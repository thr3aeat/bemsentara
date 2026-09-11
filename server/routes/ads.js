// server/routes/ads.js
const express = require('express');
const router = express.Router();
const sponsorAdService = require('../services/sponsorAdService');
const { isSiteAdmin } = require('../../utils/adminCheck');

// Public: Get random active sponsor ad JSON
router.get('/api/ads/active', async (req, res) => {
  try {
    const ad = await sponsorAdService.getRandomActiveAd();
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public: Record impression beacon
router.post('/api/ads/:id/impression', async (req, res) => {
  try {
    await sponsorAdService.recordImpression(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public: Click tracking with 302 redirect to destination
router.get('/api/ads/:id/click', async (req, res) => {
  try {
    const targetUrl = await sponsorAdService.recordClick(req.params.id);
    res.redirect(targetUrl || '/');
  } catch (err) {
    res.redirect('/');
  }
});

// Admin: Create new sponsor ad
router.post('/api/admin/ads', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
  }
  try {
    const ad = await sponsorAdService.createAd(req.body);
    res.json({ success: true, ad });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Toggle ad active state
router.post('/api/admin/ads/:id/toggle', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
  }
  try {
    const ad = await sponsorAdService.toggleAdActive(req.params.id);
    res.json({ success: true, ad });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Delete sponsor ad
router.delete('/api/admin/ads/:id', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
  }
  try {
    await sponsorAdService.deleteAd(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
