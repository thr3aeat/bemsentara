'use strict';

const express = require('express');
const path = require('path');
const { createApplicationApprovalService } = require('../services/applicationApprovalService');
const { createSignatureService } = require('../services/signatureService');
const { renderApplicationApprovalPage } = require('../views/applicationApprovalPage');
const FormSubmission = require('../../models/FormSubmission');

const defaultSignatureService = createSignatureService();
const defaultApprovalService = createApplicationApprovalService({
  signatureService: defaultSignatureService,
  submissionModel: FormSubmission
});

function defaultIsAdmin(user) {
  return Boolean(user && (user.isAdmin || user.role === 'admin'));
}

function buildApplicationApprovalHandlers({
  approvalService = defaultApprovalService,
  signatureService = defaultSignatureService,
  submissionModel = FormSubmission,
  isAdmin = defaultIsAdmin
} = {}) {
  return {
    async renderApprovalPage(req, res) {
      const rawToken = req.params.token;
      if (!req.user) {
        if (req.session) {
          req.session.applicationReturnTo = req.originalUrl;
        }
        return res.redirect('/login?returnTo=' + encodeURIComponent(req.originalUrl));
      }

      try {
        const inspection = await approvalService.inspect(rawToken, req.user);
        if (inspection.status === 'VALID') {
          return res.send(renderApplicationApprovalPage({
            status: 'VALID',
            rawToken,
            submission: inspection.submission,
            user: req.user
          }));
        }

        if (inspection.status === 'FORBIDDEN') {
          return res.status(403).send(renderApplicationApprovalPage({
            status: 'FORBIDDEN',
            rawToken,
            error: inspection.error,
            user: req.user
          }));
        }

        return res.status(410).send(renderApplicationApprovalPage({
          status: 'INVALID',
          rawToken,
          error: inspection.error,
          user: req.user
        }));
      } catch (err) {
        return res.status(500).send(renderApplicationApprovalPage({
          status: 'INVALID',
          rawToken,
          error: 'Onay sayfası yüklenirken bir hata oluştu: ' + err.message,
          user: req.user
        }));
      }
    },

    async completeApproval(req, res) {
      const rawToken = req.params.token;
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Oturum açmanız gerekmektedir.' });
      }

      try {
        const result = await approvalService.complete({
          rawToken,
          authenticatedUser: req.user,
          agreements: req.body?.agreements,
          strokes: req.body?.strokes,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });

        return res.json({ success: true, data: result });
      } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
          success: false,
          error: err.message || 'Onay işlemi tamamlanamadı.'
        });
      }
    },

    async getSignatureImage(req, res) {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ success: false, error: 'Yetkisiz erişim.' });
      }

      try {
        const submission = await submissionModel.findById(req.params.id);
        if (!submission || !submission.signature || !submission.signature.file) {
          return res.status(404).json({ success: false, error: 'İmza bulunamadı.' });
        }

        const fileName = path.basename(submission.signature.file);
        const fullPath = signatureService.getSignaturePath(fileName);
        if (!fullPath) {
          return res.status(404).json({ success: false, error: 'İmza dosyası diskte bulunamadı.' });
        }

        res.setHeader('Content-Type', 'image/png');
        return res.sendFile(fullPath);
      } catch (err) {
        return res.status(500).json({ success: false, error: 'İmza dosyası okunamadı: ' + err.message });
      }
    }
  };
}

const defaultHandlers = buildApplicationApprovalHandlers();
const router = express.Router();

router.get('/applications/approve/:token', defaultHandlers.renderApprovalPage);
router.post('/api/applications/approve/:token/complete', defaultHandlers.completeApproval);
router.get('/api/admin/applications/:id/signature', defaultHandlers.getSignatureImage);

module.exports = {
  router,
  buildApplicationApprovalHandlers
};
