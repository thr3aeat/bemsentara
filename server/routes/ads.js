// server/routes/ads.js
const express = require('express');
const router = express.Router();
const sponsorAdService = require('../services/sponsorAdService');
const socialHubService = require('../services/socialHubService');
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

// ==========================================
// 🌟 SOCIAL ADS & INTERACTIVE HUB API ROUTES
// ==========================================

// Public: Track interactive social ad event (beacon or POST)
router.post('/api/social-ads/event', express.text({ type: 'text/plain' }), async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { }
    }
    const { adKey, eventType } = body || {};
    if (!adKey || !eventType) {
      return res.status(400).json({ success: false, message: 'adKey ve eventType zorunludur.' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    const ok = socialHubService.recordEvent(adKey, eventType, ip, userAgent);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public: Get active social ads list
router.get('/api/social-ads/list', async (req, res) => {
  try {
    const ads = socialHubService.getActiveAds();
    res.json({ success: true, ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get social ads analytics breakdown
router.get('/api/admin/social-ads/stats', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
  }
  try {
    const stats = socialHubService.getAnalytics();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Toggle social ad active/passive
router.post('/api/admin/social-ads/:key/toggle', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
  }
  try {
    const ad = socialHubService.getAdByKey(req.params.key);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Sosyal reklam bulunamadı.' });
    }
    ad.isActive = ad.isActive === false ? true : false;
    ad.save();
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update social ad details, seasonal campaign tags, etc.
router.post('/api/admin/social-ads/:key/update', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
  }
  try {
    const ad = socialHubService.getAdByKey(req.params.key);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Sosyal reklam bulunamadı.' });
    }

    const {
      title,
      subtitle,
      ctaText,
      wittyQuote,
      targetUrl,
      badgeText,
      isFeatured,
      seasonalTag,
      startDate,
      endDate,
      order
    } = req.body;

    if (title !== undefined) ad.title = title;
    if (subtitle !== undefined) ad.subtitle = subtitle;
    if (ctaText !== undefined) ad.ctaText = ctaText;
    if (wittyQuote !== undefined) ad.wittyQuote = wittyQuote;
    if (targetUrl !== undefined) ad.targetUrl = targetUrl;
    if (badgeText !== undefined) ad.badgeText = badgeText;
    if (isFeatured !== undefined) ad.isFeatured = Boolean(isFeatured);
    if (seasonalTag !== undefined) ad.seasonalTag = seasonalTag;
    if (startDate !== undefined) ad.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) ad.endDate = endDate ? new Date(endDate) : null;
    if (order !== undefined) ad.order = Number(order) || ad.order;

    ad.save();
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
