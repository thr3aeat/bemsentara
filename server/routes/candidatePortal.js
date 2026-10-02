'use strict';

const express = require('express');
const { createApplicationOperationsService } = require('../services/applicationOperationsService');
const { renderCandidatePortalPage } = require('../views/candidatePortalPage');
const { renderErrorPage } = require('../views');

const router = express.Router();
const service = createApplicationOperationsService();

router.get('/applications/:refOrId', async (req, res) => {
  try {
    const data = await service.getCandidateView(req.params.refOrId, req.user);
    return res.send(renderCandidatePortalPage(data, req.user));
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 404) {
      return res.status(404).send(renderErrorPage(req.user, 'Başvuru bulunamadı. Referans numaranızı kontrol ediniz.'));
    }
    if (status === 403) {
      return res.status(403).send(renderErrorPage(req.user, 'Bu başvuru dosyası yalnızca ilgili adaya aittir.'));
    }
    return res.status(500).send(renderErrorPage(req.user, 'Başvuru dosyası yüklenirken bir sorun oluştu.'));
  }
});

// Alias for Turkish path /basvuru/:refOrId
router.get('/basvuru/:refOrId', (req, res) => {
  res.redirect(`/applications/${encodeURIComponent(req.params.refOrId)}`);
});

// Candidate Check-in Endpoint
router.post('/api/applications/:refOrId/checkin', async (req, res) => {
  try {
    const result = await service.performAction({
      id: req.params.refOrId,
      action: 'candidate-checkin',
      payload: {},
      actor: { id: req.user?.discordId || 'candidate', name: req.user?.username || 'Aday' },
      idempotencyKey: `checkin-${req.params.refOrId}-${Date.now()}`
    });
    return res.json({ ok: true, application: result.application });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Check-in işlemi tamamlanamadı.' });
  }
});

// Status JSON API
router.get('/api/applications/:refOrId/status', async (req, res) => {
  try {
    const data = await service.getCandidateView(req.params.refOrId, req.user);
    return res.json(data);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Başvuru durumu alınamadı.' });
  }
});

module.exports = router;
