const FormSubmission = require('../../models/FormSubmission');
const { normalizeSubmissionAnswers } = require('./submissionAnswerNormalizer');
const {
  STAGES,
  STAGE_METADATA,
  getStageInfo,
  generateInterviewId,
  deriveReferenceFromId
} = require('./recruitmentStages');
const { buildApplicationMessage } = require('../../bot/services/applicationMessageFactory');

const STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'AI_DETECTED']);
const ACTIONS = new Set([
  'start-review',
  'ask-question',
  'invite-interview',
  'schedule-interview',
  'approve-time',
  'candidate-checkin',
  'accept-interview',
  'reject-interview',
  'finish-interview',
  'record-evaluation',
  'add-internal-note',
  'change-stage',
  'resend-notification'
]);

class ApplicationOperationsError extends Error {
  constructor(message, statusCode = 400, code = 'APPLICATION_OPERATION_ERROR') {
    super(message);
    this.name = 'ApplicationOperationsError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function text(value, max = 240) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function activityTime(record) {
  const timestamp = new Date(record.updatedAt || record.reviewedAt || record.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function candidateName(record) {
  return text(record.discordUsername || record.username || record.candidateName || record.userId || 'Aday', 100);
}

function getRecordReference(record) {
  if (record.reference) return record.reference;
  if (FormSubmission && typeof FormSubmission.getReference === 'function') {
    return FormSubmission.getReference(record);
  }
  return deriveReferenceFromId(record._id, record.createdAt);
}

function summary(record) {
  const ref = getRecordReference(record);
  const rawStage = record.applicationStage || record.interviewState || 'SUBMITTED';
  const stageInfo = getStageInfo(rawStage);

  return {
    id: String(record._id),
    reference: ref,
    status: record.status || 'PENDING',
    stage: rawStage,
    stageInfo: stageInfo,
    formType: record.formType || 'unknown',
    formTitle: record.formTitle || 'Başvuru',
    candidate: {
      id: record.userId ? String(record.userId) : null,
      discordId: record.targetDiscordId || record.discordId || record.userId || null,
      name: candidateName(record),
      avatar: record.avatar || null
    },
    notification: record.notificationStatus || null,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || record.reviewedAt || record.createdAt || null
  };
}

function detail(record, normalizer) {
  const base = summary(record);
  const interviewId = record.interviewId || (record.interviewScheduledTime ? `INT-26-${String(record._id).slice(-4)}` : null);

  return {
    ...base,
    answers: normalizer(record),
    review: {
      reviewedBy: record.reviewedBy || null,
      reviewedAt: record.reviewedAt || null,
      note: record.reviewNote || null
    },
    interview: {
      id: interviewId,
      interviewId: interviewId,
      interviewer: record.interviewer || 'EkoYıldız People & Community',
      scheduledTime: record.interviewScheduledTime || null,
      timeApproved: Boolean(record.interviewTimeApproved),
      estimatedDuration: record.estimatedDuration || '20–30 dakika',
      method: record.interviewMethod || 'Discord',
      candidateReady: Boolean(record.candidateReady),
      candidateReadyAt: record.candidateReadyAt || null,
      gameLink: record.robloxGameLink || null,
      status: record.interviewStatus || (record.interviewTimeApproved ? 'CONFIRMED' : (record.interviewScheduledTime ? 'SCHEDULED' : 'PLANNING')),
      state: record.interviewState || null,
      internalNotes: Array.isArray(record.internalNotes) ? record.internalNotes : [],
      evaluationRubric: record.evaluationRubric || null
    },
    signature: record.signature ? {
      signedAt: record.signature.signedAt || null,
      signerName: record.signature.signerName || null,
      imageUrl: record.signature.imageUrl || null
    } : null,
    operationHistory: Array.isArray(record.operationHistory) ? record.operationHistory : []
  };
}

function clientView(record, normalizer) {
  const base = summary(record);
  const rawHistory = Array.isArray(record.operationHistory) ? record.operationHistory : [];

  // Filter out internal sensitive actions
  const userFacingHistory = rawHistory
    .filter((entry) => !entry.internalOnly && !['add-internal-note', 'record-evaluation'].includes(entry.action))
    .map((entry) => {
      let desc = entry.description || entry.userDescription;
      if (!desc) {
        if (entry.action === 'APPLICATION_CREATED') desc = 'Başvurunuz başarıyla oluşturuldu.';
        else if (entry.action === 'APPLICATION_RECEIVED') desc = 'Başvurunuz ön inceleme kuyruğuna alındı.';
        else if (entry.action === 'start-review') desc = 'Ekibimiz başvurunuzdaki bilgileri incelemeye başladı.';
        else if (entry.action === 'invite-interview') desc = 'Mülakat aşamasına davet edildiniz.';
        else if (entry.action === 'schedule-interview') desc = `Mülakat saatiniz planlandı: ${entry.payload?.scheduledTime || ''}`;
        else if (entry.action === 'approve-time') desc = 'Mülakat saatiniz onaylandı.';
        else if (entry.action === 'candidate-checkin') desc = 'Mülakat öncesi hazırlık check-in adımı tamamlandı.';
        else if (entry.action === 'finish-interview') desc = 'Mülakat görüşmeniz tamamlandı.';
        else if (entry.action === 'accept-interview') desc = 'EkoYıldız ekibine kabul edildiniz!';
        else if (entry.action === 'reject-interview') desc = 'Başvuru süreci sonuçlandı.';
        else desc = 'Başvuru dosyanız güncellendi.';
      }
      return {
        action: entry.action,
        createdAt: entry.createdAt,
        description: desc
      };
    });

  return {
    reference: base.reference,
    formTitle: base.formTitle,
    formType: base.formType,
    status: base.status,
    stage: base.stage,
    stageInfo: base.stageInfo,
    candidate: base.candidate,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    interview: {
      scheduledTime: record.interviewScheduledTime || null,
      timeApproved: Boolean(record.interviewTimeApproved),
      estimatedDuration: record.estimatedDuration || '20–30 dakika',
      method: record.interviewMethod || 'Discord',
      candidateReady: Boolean(record.candidateReady),
      candidateReadyAt: record.candidateReadyAt || null,
      gameLink: record.robloxGameLink || null,
      status: record.interviewStatus || (record.interviewTimeApproved ? 'CONFIRMED' : (record.interviewScheduledTime ? 'SCHEDULED' : 'PLANNING'))
    },
    answers: normalizer(record),
    operationHistory: userFacingHistory
  };
}

function requirePayload(action, payload) {
  const body = payload && typeof payload === 'object' ? payload : {};
  if (action === 'ask-question' && !text(body.questionText, 2000)) {
    throw new ApplicationOperationsError('Soru metni zorunludur.', 400, 'INVALID_PAYLOAD');
  }
  if (action === 'schedule-interview' && !text(body.scheduledTime, 160)) {
    throw new ApplicationOperationsError('Mülakat zamanı zorunludur.', 400, 'INVALID_PAYLOAD');
  }
  if (action === 'add-internal-note' && !text(body.noteText, 3000)) {
    throw new ApplicationOperationsError('Not metni zorunludur.', 400, 'INVALID_PAYLOAD');
  }
  return body;
}

function assertInterviewGate(record, action) {
  if (action === 'accept-interview' || action === 'finish-interview') {
    const hasSiteApproval = Boolean(
      record.siteApprovalCompleted ||
      record.siteApprovalCompletedAt ||
      record.workflowState === 'SITE_APPROVAL_COMPLETED' ||
      record.applicationStage === 'SITE_APPROVAL_COMPLETED' ||
      record.applicationStage === 'INTERVIEW_READY'
    );
    const hasSignature = Boolean(
      record.signature &&
      (record.signature.file || record.signature.sha256)
    );

    if (!hasSiteApproval || !hasSignature) {
      throw new ApplicationOperationsError(
        'Mülakatın kabul edilmesi veya tamamlanması için adayın site üzerinden taahhütlerini onaylamış ve imza atmış olması zorunludur.',
        409,
        'APPROVAL_AND_SIGNATURE_REQUIRED'
      );
    }
  }
}

function transition(record, action, payload, actor) {
  const stage = record.applicationStage || record.interviewState || 'SUBMITTED';
  const patch = {};
  const allowed = (...states) => {
    if (!states.includes(stage)) {
      throw new ApplicationOperationsError(
        `“${action}” işlemi ${stage} aşamasında uygulanamaz.`,
        409,
        'INVALID_TRANSITION'
      );
    }
  };

  switch (action) {
    case 'start-review':
      allowed('SUBMITTED', 'PENDING', 'APPLICATION_RECEIVED');
      patch.applicationStage = 'REVIEWING';
      patch.reviewStartedAt = new Date().toISOString();
      break;

    case 'ask-question':
      allowed('REVIEWING', 'QUESTION_PENDING', 'INTERVIEW_SCHEDULED', 'SCHEDULE_QUESTION', 'UNDER_REVIEW');
      patch.applicationStage = 'QUESTION_PENDING';
      patch.lastQuestion = {
        key: text(payload.questionKey, 100) || null,
        label: text(payload.questionLabel, 240) || null,
        text: text(payload.questionText, 2000),
        askedAt: new Date().toISOString()
      };
      break;

    case 'invite-interview':
      patch.applicationStage = 'INVITED_TO_INTERVIEW';
      patch.interviewId = record.interviewId || generateInterviewId();
      patch.interviewStatus = 'PLANNING';
      break;

    case 'schedule-interview':
      allowed('REVIEWING', 'QUESTION_PENDING', 'UNDER_REVIEW', 'INVITED_TO_INTERVIEW', 'TEAM_EVALUATION', 'INTERVIEW_SCHEDULED', 'TIME_APPROVED', 'SCHEDULE_QUESTION');
      patch.applicationStage = 'INTERVIEW_SCHEDULED';
      patch.interviewState = 'SCHEDULE_QUESTION';
      patch.interviewStatus = 'SCHEDULED';
      patch.interviewId = record.interviewId || generateInterviewId();
      patch.interviewScheduledTime = text(payload.scheduledTime, 160);
      patch.interviewTimeApproved = false;
      break;

    case 'approve-time':
      allowed('INTERVIEW_SCHEDULED', 'SCHEDULE_QUESTION');
      patch.applicationStage = 'TIME_APPROVED';
      patch.interviewState = 'TIME_APPROVED';
      patch.interviewStatus = 'CONFIRMED';
      patch.interviewTimeApproved = true;
      if (text(payload.scheduledTime, 160)) patch.interviewScheduledTime = text(payload.scheduledTime, 160);
      break;

    case 'candidate-checkin':
      patch.candidateReady = true;
      patch.candidateReadyAt = new Date().toISOString();
      break;

    case 'record-evaluation':
      patch.applicationStage = 'FINAL_EVALUATION';
      patch.evaluationRubric = {
        communication: text(payload.communication, 30),
        problemSolving: text(payload.problemSolving, 30),
        roleFit: text(payload.roleFit, 30),
        communityKnowledge: text(payload.communityKnowledge, 30),
        accountability: text(payload.accountability, 30),
        technical: text(payload.technical, 30),
        overallRecommendation: text(payload.overallRecommendation, 60),
        notes: text(payload.notes, 2000),
        evaluator: actor.name || actor.id || 'Yetkili',
        evaluatedAt: new Date().toISOString()
      };
      break;

    case 'add-internal-note':
      const newNote = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: text(payload.noteText, 3000),
        author: actor.name || actor.id || 'Yetkili',
        authorId: actor.id || null,
        createdAt: new Date().toISOString(),
        visibility: 'Yalnızca EkoYıldız ekibi tarafından görülebilir'
      };
      patch.internalNotes = [...(record.internalNotes || []), newNote];
      break;

    case 'change-stage':
      if (payload.stage) {
        patch.applicationStage = text(payload.stage, 60);
      }
      break;

    case 'accept-interview':
      allowed('TIME_APPROVED', 'INTERVIEW_COMPLETED', 'FINAL_EVALUATION', 'INTERVIEW_SCHEDULED', 'INTERVIEW_READY');
      assertInterviewGate(record, action);
      patch.applicationStage = 'ACCEPTED_WAITING_VERIFY';
      patch.interviewState = 'ACCEPTED_WAITING_VERIFY';
      patch.interviewStatus = 'COMPLETED';
      patch.status = 'APPROVED';
      patch.reviewedBy = actor.name || actor.id || 'Admin';
      patch.reviewedAt = new Date().toISOString();
      break;

    case 'reject-interview':
      if (['REJECTED', 'FINISHED'].includes(stage)) {
        throw new ApplicationOperationsError(`“${action}” işlemi ${stage} aşamasında uygulanamaz.`, 409, 'INVALID_TRANSITION');
      }
      patch.applicationStage = 'REJECTED';
      patch.interviewState = 'REJECTED';
      patch.interviewStatus = 'CANCELLED';
      patch.status = 'REJECTED';
      patch.reviewNote = text(payload.reason, 2000) || 'Neden belirtilmedi';
      patch.reviewedBy = actor.name || actor.id || 'Admin';
      patch.reviewedAt = new Date().toISOString();
      break;

    case 'finish-interview':
      allowed('TIME_APPROVED', 'ACCEPTED_WAITING_VERIFY', 'INTERVIEW_SCHEDULED', 'INTERVIEW_READY');
      assertInterviewGate(record, action);
      patch.applicationStage = 'FINISHED';
      patch.interviewState = 'FINISHED';
      patch.interviewStatus = 'COMPLETED';
      break;

    default:
      break;
  }
  return patch;
}

async function defaultDiscordNotifier({ application, action, payload }) {
  try {
    const { getDiscordClient } = require('../../bot/discordClient');
    const client = getDiscordClient();
    if (!client || !client.isReady()) return { channel: 'discord_dm_offline' };

    const targetDiscordId = application.candidate?.discordId;
    if (!targetDiscordId || !/^\d{17,20}$/.test(String(targetDiscordId))) {
      return { channel: 'discord_dm_invalid_id' };
    }

    const user = await client.users.fetch(targetDiscordId).catch(() => null);
    if (!user) return { channel: 'discord_dm_user_not_found' };

    let kind = null;
    if (action === 'ask-question') kind = 'question';
    else if (action === 'schedule-interview' || action === 'approve-time') kind = 'time-approved';
    else if (action === 'accept-interview') kind = 'accepted';
    else if (action === 'reject-interview') kind = 'rejected';
    else if (action === 'finish-interview') kind = 'interview-finished';
    else if (action === 'invite-interview') kind = 'site-approval';

    if (!kind) return { channel: 'none' };

    const messagePayload = buildApplicationMessage(kind, {
      candidateName: application.candidate?.name,
      formTitle: application.formTitle,
      reference: application.reference,
      question: payload.questionText,
      scheduledTime: payload.scheduledTime || application.interview?.scheduledTime,
      reason: payload.reason,
      primaryPath: `/applications/${encodeURIComponent(application.reference)}`
    });

    await user.send(messagePayload);
    return { channel: 'discord_dm' };
  } catch (err) {
    console.warn('[applicationOperationsService] DM notification error:', err.message);
    throw err;
  }
}

function createApplicationOperationsService(deps = {}) {
  const repository = deps.FormSubmission || FormSubmission;
  const normalizer = deps.normalizeSubmissionAnswers || normalizeSubmissionAnswers;
  const notifier = deps.notifier || defaultDiscordNotifier;

  return {
    async list(filters = {}) {
      const status = text(filters.status, 30).toUpperCase();
      const formType = text(filters.formType, 100);
      const search = text(filters.search, 160).toLocaleLowerCase('tr-TR');
      const limitRaw = filters.limit == null || filters.limit === '' ? 100 : Number(filters.limit);
      if (status && !STATUSES.has(status)) {
        throw new ApplicationOperationsError('Geçersiz başvuru durumu.', 400, 'INVALID_FILTER');
      }
      if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > 250) {
        throw new ApplicationOperationsError('Liste limiti 1-250 arasında olmalıdır.', 400, 'INVALID_FILTER');
      }

      let records = await repository.findAll();
      if (!Array.isArray(records)) records = [];
      records = records.filter((record) => {
        if (status && String(record.status || 'PENDING').toUpperCase() !== status) return false;
        if (formType && String(record.formType || '') !== formType) return false;
        if (search) {
          const ref = getRecordReference(record);
          const haystack = [record._id, ref, record.userId, record.discordId, record.targetDiscordId, candidateName(record), record.formTitle, record.formType]
            .filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');
          if (!haystack.includes(search)) return false;
        }
        return true;
      });
      records.sort((a, b) => activityTime(b) - activityTime(a));
      return { items: records.slice(0, limitRaw).map(summary), total: records.length };
    },

    async getDetail(id) {
      let record = await repository.findById(String(id || ''));
      if (!record && typeof repository.findByReference === 'function') {
        record = await repository.findByReference(String(id || ''));
      }
      if (!record) throw new ApplicationOperationsError('Başvuru bulunamadı.', 404, 'NOT_FOUND');
      return detail(record, normalizer);
    },

    async getCandidateView(refOrId, user = null) {
      let record = null;
      if (typeof repository.findByReference === 'function') {
        record = await repository.findByReference(String(refOrId || ''));
      }
      if (!record) {
        record = await repository.findById(String(refOrId || ''));
      }
      if (!record) throw new ApplicationOperationsError('Başvuru bulunamadı.', 404, 'NOT_FOUND');

      // Authorization check: if user is provided and not admin, must match owner
      if (user) {
        const isAdmin = Boolean(user.isAdmin || user.isStaff);
        const candidateDiscordId = record.targetDiscordId || record.discordId || record.userId;
        const userDiscordId = user.discordId || user.id;
        if (!isAdmin && candidateDiscordId && userDiscordId && candidateDiscordId !== userDiscordId) {
          throw new ApplicationOperationsError('Bu başvuruyu görüntüleme yetkiniz yok.', 403, 'FORBIDDEN');
        }
      }

      return clientView(record, normalizer);
    },

    async getHiringOverview() {
      let records = await repository.findAll();
      if (!Array.isArray(records)) records = [];

      let totalActive = 0;
      let inReview = 0;
      let inInterview = 0;
      let decisionPending = 0;

      for (const rec of records) {
        const stage = rec.applicationStage || rec.interviewState || 'SUBMITTED';
        const status = rec.status || 'PENDING';

        if (status !== 'REJECTED' && stage !== 'REJECTED' && stage !== 'FINISHED' && stage !== 'APPLICATION_CLOSED') {
          totalActive += 1;
        }

        if (stage === 'REVIEWING' || stage === 'UNDER_REVIEW' || stage === 'SUBMITTED' || stage === 'APPLICATION_RECEIVED' || stage === 'TEAM_EVALUATION') {
          inReview += 1;
        } else if (stage === 'INTERVIEW_SCHEDULED' || stage === 'TIME_APPROVED' || stage === 'INVITED_TO_INTERVIEW' || stage === 'SCHEDULE_QUESTION') {
          inInterview += 1;
        } else if (stage === 'QUESTION_PENDING' || stage === 'ACCEPTED_WAITING_VERIFY' || stage === 'FINAL_EVALUATION') {
          decisionPending += 1;
        }
      }

      return {
        totalActive,
        inReview,
        inInterview,
        decisionPending
      };
    },

    async performAction({ id, action, payload = {}, actor = {}, idempotencyKey }) {
      if (!ACTIONS.has(action)) throw new ApplicationOperationsError('Bilinmeyen başvuru işlemi.', 400, 'UNKNOWN_ACTION');
      if (!text(idempotencyKey, 160)) throw new ApplicationOperationsError('Idempotency-Key zorunludur.', 400, 'IDEMPOTENCY_KEY_REQUIRED');
      let record = await repository.findById(String(id || ''));
      if (!record && typeof repository.findByReference === 'function') {
        record = await repository.findByReference(String(id || ''));
      }
      if (!record) throw new ApplicationOperationsError('Başvuru bulunamadı.', 404, 'NOT_FOUND');

      const previousKeys = Array.isArray(record.operationKeys) ? record.operationKeys : [];
      const previous = previousKeys.find((entry) => entry.key === idempotencyKey);
      if (previous) return { ...previous.result, replayed: true };

      const body = requirePayload(action, payload);
      let patch = {};
      if (action === 'resend-notification') {
        if (record.notificationStatus?.state !== 'FAILED') {
          throw new ApplicationOperationsError('Yeniden gönderilebilecek başarısız bir bildirim yok.', 409, 'NOTIFICATION_NOT_RETRYABLE');
        }
      } else {
        patch = transition(record, action, body, actor);
      }

      const operation = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action,
        actor: { id: actor.id || null, name: actor.name || null },
        payload: body,
        createdAt: new Date().toISOString(),
        internalOnly: ['add-internal-note', 'record-evaluation'].includes(action)
      };
      let persisted = await repository.update(record._id, {
        ...patch,
        operationHistory: [...(record.operationHistory || []), operation].slice(-100)
      });

      let notification;
      try {
        const sent = await notifier({ application: summary(persisted), action, payload: body, actor });
        notification = { state: 'SENT', sentAt: new Date().toISOString(), channel: sent?.channel || 'discord_dm', error: null };
      } catch (error) {
        notification = { state: 'FAILED', failedAt: new Date().toISOString(), channel: 'discord_dm', error: text(error?.message || error, 500) };
      }
      persisted = await repository.update(record._id, { notificationStatus: notification });
      const result = { application: summary(persisted), notification, replayed: false };
      const operationKeys = [...previousKeys, { key: idempotencyKey, result, createdAt: new Date().toISOString() }].slice(-50);
      persisted = await repository.update(record._id, { operationKeys });
      result.application = summary(persisted);
      return result;
    }
  };
}

module.exports = {
  ACTIONS,
  ApplicationOperationsError,
  assertInterviewGate,
  createApplicationOperationsService
};
