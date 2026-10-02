'use strict';

const defaultTokenModel = require('../../models/ApplicationApprovalToken');
const defaultSubmissionModel = require('../../models/FormSubmission');
const { createSignatureService } = require('./signatureService');
const { buildApplicationMessage } = require('../../bot/services/applicationMessageFactory');
const { STAGES } = require('./recruitmentStages');

function createApplicationApprovalService({
  tokenModel = defaultTokenModel,
  submissionModel = defaultSubmissionModel,
  signatureService = createSignatureService(),
  notifier = null,
  baseUrl = process.env.BASE_URL || 'https://ekoyildiz.duckdns.org',
  clock = () => new Date()
} = {}) {
  return {
    async issue(submissionOrId, actor = { name: 'Admin' }) {
      let submission = submissionOrId;
      if (typeof submissionOrId === 'string' || typeof submissionOrId === 'number') {
        submission = await submissionModel.findById(String(submissionOrId));
      }
      if (!submission) {
        throw new Error('Başvuru bulunamadı.');
      }

      const candidateDiscordId = submission.targetDiscordId || submission.discordId || submission.userId;
      if (!candidateDiscordId) {
        throw new Error('Başvuruda kayıtlı Discord kullanıcı ID bulunamadı.');
      }

      const { rawToken, record } = await tokenModel.createTokenRecord({
        submissionId: submission._id,
        candidateDiscordId,
        createdBy: actor.name || 'Admin'
      });

      const cleanBase = String(baseUrl).replace(/\/+$/, '');
      const approvalPath = `/applications/approve/${encodeURIComponent(rawToken)}`;
      const approvalUrl = `${cleanBase}${approvalPath}`;

      // Update submission stage & audit log
      const now = clock();
      const currentHistory = Array.isArray(submission.operationHistory) ? submission.operationHistory : [];
      const updatedHistory = [
        ...currentHistory,
        {
          id: `${Date.now()}-approval-issued`,
          action: 'SITE_APPROVAL_ISSUED',
          actor: { id: actor.id || 'admin', name: actor.name || 'Admin' },
          createdAt: now.toISOString(),
          description: 'Adaya site onay ve imza bağlantısı iletildi.'
        }
      ];

      const patch = {
        applicationStage: STAGES.SITE_APPROVAL_SENT || 'SITE_APPROVAL_SENT',
        operationHistory: updatedHistory,
        updatedAt: now
      };

      await submissionModel.update(submission._id, patch);

      // Notify candidate
      let notificationResult = null;
      if (typeof notifier === 'function') {
        try {
          const payload = buildApplicationMessage('site-approval', {
            baseUrl: cleanBase,
            primaryPath: approvalPath,
            candidateName: submission.discordUsername || 'Aday',
            formTitle: submission.formTitle || 'EkoYıldız Başvurusu',
            reference: submission.reference || submission._id
          });
          notificationResult = await notifier({
            targetDiscordId: candidateDiscordId,
            messagePayload: payload,
            kind: 'site-approval'
          });
        } catch (notifErr) {
          notificationResult = { error: notifErr.message, status: 'FAILED' };
        }
      }

      return {
        rawToken,
        approvalUrl,
        record,
        notificationResult
      };
    },

    async inspect(rawToken, authenticatedUser = null) {
      if (!rawToken || typeof rawToken !== 'string') {
        return { status: 'INVALID', error: 'Geçersiz onay bağlantısı.' };
      }

      const tokenHash = tokenModel.hashToken(rawToken);
      const token = await tokenModel.findValidByHash(tokenHash);

      if (!token) {
        return {
          status: 'INVALID',
          error: 'Bu onay bağlantısının süresi dolmuş veya bağlantı daha önce kullanılmış.'
        };
      }

      const submission = await submissionModel.findById(token.submissionId);
      if (!submission) {
        return { status: 'INVALID', error: 'İlgili başvuru kaydı bulunamadı.' };
      }

      if (authenticatedUser) {
        const candidateDiscordId = String(token.candidateDiscordId);
        const userDiscordId = String(authenticatedUser.discordId || authenticatedUser.id || '');
        const isAdmin = Boolean(authenticatedUser.isAdmin);

        if (candidateDiscordId !== userDiscordId && !isAdmin) {
          return {
            status: 'FORBIDDEN',
            error: 'Bu onay adımı yalnızca başvuru sahibi Discord hesabı tarafından imzalanabilir.',
            requiredDiscordId: candidateDiscordId,
            currentDiscordId: userDiscordId
          };
        }
      }

      return {
        status: 'VALID',
        token: {
          submissionId: token.submissionId,
          expiresAt: token.expiresAt,
          candidateDiscordId: token.candidateDiscordId
        },
        submission: {
          id: submission._id,
          reference: submission.reference || submission._id,
          formTitle: submission.formTitle || 'EkoYıldız Ekip Başvurusu',
          discordUsername: submission.discordUsername || 'Aday',
          targetDiscordId: submission.targetDiscordId || token.candidateDiscordId,
          scheduledTime: submission.interviewScheduledTime || null,
          applicationStage: submission.applicationStage || 'SITE_APPROVAL_SENT'
        }
      };
    },

    async complete({ rawToken, authenticatedUser, agreements = {}, strokes = [], ip = null, userAgent = null } = {}) {
      if (!authenticatedUser) {
        const err = new Error('Kimlik doğrulaması gereklidir.');
        err.statusCode = 401;
        throw err;
      }

      const inspection = await this.inspect(rawToken, authenticatedUser);
      if (inspection.status !== 'VALID') {
        const err = new Error(inspection.error || 'Onay bağlantısı doğrulanamadı.');
        err.statusCode = inspection.status === 'FORBIDDEN' ? 403 : 410;
        throw err;
      }

      // Check required agreements
      if (!agreements || !agreements.truthful || !agreements.guidelines || !agreements.commitments) {
        const err = new Error('Tüm taahhüt ve koşulları kabul etmeniz gerekmektedir.');
        err.statusCode = 400;
        throw err;
      }

      // Validate strokes before any write or token consumption
      signatureService.validateStrokes(strokes);

      // Render PNG
      const subId = inspection.submission.id;
      const sigResult = await signatureService.renderPng(subId, strokes);

      // Consume token (if consumption fails, workflow does not proceed)
      const tokenHash = tokenModel.hashToken(rawToken);
      const consumed = await tokenModel.consume(tokenHash, {
        candidateId: authenticatedUser.discordId || authenticatedUser.id,
        ip,
        userAgent
      });

      if (!consumed) {
        const err = new Error('Onay tokenı tüketilemedi.');
        err.statusCode = 409;
        throw err;
      }

      // Fetch latest submission record
      const submission = await submissionModel.findById(subId);
      const now = clock();

      // Determine next stage:
      // If interview is already scheduled / approved, advance to INTERVIEW_READY; otherwise SITE_APPROVAL_COMPLETED
      let nextStage = STAGES.SITE_APPROVAL_COMPLETED || 'SITE_APPROVAL_COMPLETED';
      if (submission.interviewScheduledTime || submission.interviewTimeApproved) {
        nextStage = STAGES.INTERVIEW_READY || 'INTERVIEW_READY';
      }

      const currentHistory = Array.isArray(submission.operationHistory) ? submission.operationHistory : [];
      const updatedHistory = [
        ...currentHistory,
        {
          id: `${Date.now()}-approval-completed`,
          action: 'SITE_APPROVAL_COMPLETED',
          actor: {
            id: authenticatedUser.discordId || authenticatedUser.id || 'candidate',
            name: authenticatedUser.username || 'Aday'
          },
          createdAt: now.toISOString(),
          description: 'Aday mülakat öncesi taahhütlerini onayladı ve imzaladı.',
          signatureHash: sigResult.sha256
        }
      ];

      const patch = {
        applicationStage: nextStage,
        siteApprovalCompleted: true,
        siteApprovalCompletedAt: now.toISOString(),
        signature: {
          file: sigResult.relativePath,
          sha256: sigResult.sha256,
          signedAt: now.toISOString(),
          signedByDiscordId: authenticatedUser.discordId || authenticatedUser.id
        },
        operationHistory: updatedHistory,
        updatedAt: now
      };

      const updated = await submissionModel.update(subId, patch);

      // Optionally notify
      if (typeof notifier === 'function') {
        try {
          const payload = buildApplicationMessage('approval-complete', {
            baseUrl: String(baseUrl).replace(/\/+$/, ''),
            candidateName: submission.discordUsername || 'Aday',
            formTitle: submission.formTitle || 'EkoYıldız Başvurusu',
            reference: submission.reference || submission._id
          });
          await notifier({
            targetDiscordId: token.candidateDiscordId,
            messagePayload: payload,
            kind: 'approval-complete'
          });
        } catch (_) {
          // Non-blocking notification failure
        }
      }

      return {
        success: true,
        submissionId: subId,
        reference: submission.reference || subId,
        stage: nextStage,
        signatureHash: sigResult.sha256
      };
    }
  };
}

module.exports = {
  createApplicationApprovalService
};
