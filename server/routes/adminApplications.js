const express = require('express');
const { isSiteAdmin } = require('../../utils/adminCheck');
const { createApplicationOperationsService } = require('../services/applicationOperationsService');

const defaultService = createApplicationOperationsService();

function sendError(res, error) {
  const statusCode = [400, 404, 409].includes(error?.statusCode) ? error.statusCode : 500;
  const message = statusCode === 500 ? 'Başvuru işlemi tamamlanamadı.' : error.message;
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(error?.code && statusCode !== 500 ? { code: error.code } : {})
  });
}

function buildAdminApplicationsHandlers({ service = defaultService, isAdmin = isSiteAdmin } = {}) {
  const guard = (req, res) => {
    if (!req.user || !isAdmin(req.user)) {
      res.status(403).json({ success: false, error: 'Bu alanı görüntüleme yetkiniz yok.' });
      return false;
    }
    return true;
  };

  return {
    async list(req, res) {
      if (!guard(req, res)) return;
      try {
        const data = await service.list(req.query || {});
        return res.json({ success: true, data });
      } catch (error) {
        return sendError(res, error);
      }
    },

    async detail(req, res) {
      if (!guard(req, res)) return;
      try {
        const data = await service.getDetail(req.params.id);
        return res.json({ success: true, data });
      } catch (error) {
        return sendError(res, error);
      }
    },

    async action(req, res) {
      if (!guard(req, res)) return;
      const idempotencyKey = req.headers?.['idempotency-key'];
      if (!idempotencyKey || !String(idempotencyKey).trim()) {
        return res.status(400).json({ success: false, error: 'Idempotency-Key başlığı zorunludur.', code: 'IDEMPOTENCY_KEY_REQUIRED' });
      }
      try {
        const data = await service.performAction({
          id: req.params.id,
          action: req.params.action,
          payload: req.body || {},
          actor: {
            id: req.user.discordId || req.user._id || null,
            name: req.user.discordUsername || req.user.username || 'Admin'
          },
          idempotencyKey: String(idempotencyKey).trim()
        });
        return res.json({ success: true, data });
      } catch (error) {
        return sendError(res, error);
      }
    },

    async aiGuide(req, res) {
      if (!guard(req, res)) return;
      try {
        const FormSubmission = require('../../models/FormSubmission');
        const submission = await FormSubmission.findById(req.params.id) || await FormSubmission.findByReference(req.params.id);
        if (!submission) {
          return res.status(404).json({ success: false, error: 'Aday kaydı bulunamadı.' });
        }
        const { generateInterviewGuide } = require('../services/applicationAiService');
        const guide = await generateInterviewGuide(submission);
        await FormSubmission.update(submission._id, { aiInterviewGuide: guide });
        return res.json({ success: true, data: guide });
      } catch (error) {
        return sendError(res, error);
      }
    }
  };
}

const handlers = buildAdminApplicationsHandlers();
const router = express.Router();
router.get('/api/admin/applications', handlers.list);
router.get('/api/admin/applications/:id', handlers.detail);
router.post('/api/admin/applications/:id/actions/:action', handlers.action);
router.post('/api/admin/applications/:id/ai-guide', handlers.aiGuide);

module.exports = { router, buildAdminApplicationsHandlers, defaultService };
