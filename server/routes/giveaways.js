// server/routes/giveaways.js
const express = require('express');
const router = express.Router();
const giveawayService = require('../services/giveawayService');
const sponsorAdService = require('../services/sponsorAdService');
const socialHubService = require('../services/socialHubService');
const { isSiteAdmin } = require('../../utils/adminCheck');
const Store = require('../../models/Store');

const { renderGiveawaysFeedPage } = require('../views/giveaways/giveawaysFeedPage');
const { renderGiveawayDetailPage } = require('../views/giveaways/giveawayDetailPage');
const { renderGiveawayWinnersPage } = require('../views/giveaways/giveawayWinnersPage');
const { renderGiveawayTransparencyPage } = require('../views/giveaways/giveawayTransparencyPage');
const { renderGiveawayProfilePage } = require('../views/giveaways/giveawayProfilePage');
const { renderGiveawayLiveDrawPage } = require('../views/giveaways/giveawayLiveDrawPage');
const { renderGiveawayAdminPage } = require('../views/giveaways/giveawayAdminPage');

// Helper to get client IP
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
}

// 1. Referral Link Handler (/r/:code)
router.get('/r/:code', async (req, res) => {
  const code = req.params.code;
  if (req.session) {
    req.session.referralCode = code;
  }
  res.cookie('ekoyildiz_ref', code, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });

  // Find active giveaway to redirect to, or fallback to /cekilisler
  const giveaways = await giveawayService.getAllGiveaways();
  const featured = giveaways.find(g => g.status === 'ACTIVE' && g.isFeatured) || giveaways.find(g => g.status === 'ACTIVE');
  if (featured) {
    return res.redirect(`/cekilisler/${featured.slug || featured._id}?ref=${encodeURIComponent(code)}`);
  }
  res.redirect(`/cekilisler?ref=${encodeURIComponent(code)}`);
});

// 2. Feed Page (/cekilisler)
router.get('/cekilisler', async (req, res) => {
  try {
    const category = req.query.kategori || 'all';
    const giveaways = await giveawayService.getAllGiveaways();
    const activities = await Store.giveawayAuditLogs.find({});
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Format activities for ticker
    const tickerActs = activities.slice(0, 10).map(act => {
      let text = '⚡ Platformda hareketlilik var.';
      if (act.action === 'TASK_COMPLETED') {
        text = `🎟️ @${act.details?.username || 'Kullanıcı'} görev tamamlayarak +${act.details?.reward || 1} bilet kazandı!`;
      } else if (act.action === 'WINNER_SELECTED') {
        text = `🏆 @${act.details?.winnerUsername || 'Kazanan'} büyük çekilişi kazandı!`;
      } else if (act.action === 'GIVEAWAY_CREATED') {
        text = `🎉 Yeni bir çekiliş yayınlandı!`;
      }
      return { text, timestamp: act.timestamp };
    });

    let notificationCount = 0;
    if (req.user) {
      const userNotifs = await Store.giveawayNotifications.find({ userId: req.user.discordId || req.user._id, isRead: false });
      notificationCount = userNotifs.length;
    }

    const html = renderGiveawaysFeedPage({
      user: req.user,
      giveaways,
      activities: tickerActs,
      activeCategory: category,
      notificationCount
    });
    res.send(html);
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

// 3. Winners Hall (/cekilisler/kazananlar)
router.get('/cekilisler/kazananlar', async (req, res) => {
  try {
    const winners = await giveawayService.getAllWinners();
    let notificationCount = 0;
    if (req.user) {
      const userNotifs = await Store.giveawayNotifications.find({ userId: req.user.discordId || req.user._id, isRead: false });
      notificationCount = userNotifs.length;
    }

    const html = renderGiveawayWinnersPage({
      user: req.user,
      winners,
      notificationCount
    });
    res.send(html);
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

// 4. Transparency Page (/cekilisler/seffaflik)
router.get('/cekilisler/seffaflik', async (req, res) => {
  try {
    const all = await giveawayService.getAllGiveaways();
    const completed = all.filter(g => g.status === 'COMPLETED' || g.status === 'ENDED');
    const auditLogs = await Store.giveawayAuditLogs.find({});
    auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    let notificationCount = 0;
    if (req.user) {
      const userNotifs = await Store.giveawayNotifications.find({ userId: req.user.discordId || req.user._id, isRead: false });
      notificationCount = userNotifs.length;
    }

    const html = renderGiveawayTransparencyPage({
      user: req.user,
      completedGiveaways: completed,
      auditLogs: auditLogs.slice(0, 15),
      notificationCount
    });
    res.send(html);
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

// 5. User Profile Page (/cekilisler/profil)
router.get('/cekilisler/profil', async (req, res) => {
  if (!req.user) {
    return res.redirect('/login?redirect=/cekilisler/profil');
  }

  try {
    const profile = await giveawayService.getUserProfileData(req.user.discordId || req.user._id);
    let notificationCount = 0;
    const userNotifs = await Store.giveawayNotifications.find({ userId: req.user.discordId || req.user._id, isRead: false });
    notificationCount = userNotifs.length;

    const html = renderGiveawayProfilePage({
      user: req.user,
      stats: profile.stats,
      entries: profile.entries,
      wonGiveaways: profile.wonGiveaways,
      badges: profile.badges,
      referralCode: profile.referralCode,
      notificationCount
    });
    res.send(html);
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

// 6. Live Draw Screen (/cekilisler/canli/:id)
router.get('/cekilisler/canli/:id', async (req, res) => {
  try {
    const giveaway = await giveawayService.getGiveawayById(req.params.id);
    if (!giveaway) {
      return res.status(404).send('Çekiliş bulunamadı.');
    }
    const winners = await Store.giveawayWinners.find({ giveawayId: giveaway._id });
    const entries = await Store.giveawayEntries.find({ giveawayId: giveaway._id, status: 'VALID' });

    const html = renderGiveawayLiveDrawPage({
      giveaway,
      winners,
      participants: entries
    });
    res.send(html);
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

// 7. Giveaway Detail Page (/cekilisler/:idOrSlug)
router.get('/cekilisler/:idOrSlug', async (req, res) => {
  try {
    const giveaway = await giveawayService.getGiveawayById(req.params.idOrSlug);
    if (!giveaway) {
      return res.status(404).send('Çekiliş bulunamadı.');
    }

    const tasks = await giveawayService.getTasksForGiveaway(giveaway._id);
    let userEntry = null;
    let referralCode = '';

    if (req.user) {
      const userId = req.user.discordId || req.user._id;
      userEntry = await Store.giveawayEntries.findOne({ giveawayId: giveaway._id, userId });
      const refRec = await Store.giveawayReferrals.findOne({ userId });
      referralCode = refRec ? refRec.code : userId;
    }

    const winners = await Store.giveawayWinners.find({ giveawayId: giveaway._id });

    let notificationCount = 0;
    if (req.user) {
      const userNotifs = await Store.giveawayNotifications.find({ userId: req.user.discordId || req.user._id, isRead: false });
      notificationCount = userNotifs.length;
    }

    const html = renderGiveawayDetailPage({
      user: req.user,
      giveaway,
      tasks,
      userEntry,
      winners,
      referralCode,
      notificationCount
    });
    res.send(html);
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

// 8. API: Task Verification & Ticket Submission
router.post('/api/giveaways/:id/tasks/:taskId/verify', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Lütfen önce giriş yapın.' });
  }

  try {
    const ip = getClientIp(req);
    const refCode = req.session?.referralCode || req.cookies?.ekoyildiz_ref || null;
    const result = await giveawayService.submitTask({
      giveawayId: req.params.id,
      taskId: req.params.taskId,
      user: req.user,
      ip,
      referralCode: refCode
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. API: Live giveaway statistics
router.get('/api/giveaways/:id/status', async (req, res) => {
  try {
    const giveaway = await giveawayService.getGiveawayById(req.params.id);
    if (!giveaway) return res.status(404).json({ success: false });
    res.json({
      success: true,
      totalEntries: giveaway.totalEntries || 0,
      totalTickets: giveaway.totalTickets || 0,
      status: giveaway.status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= ADMIN ROUTES ================= //

// Admin Dashboard View (/admin/giveaways)
router.get('/admin/giveaways', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).send('Bu sayfaya erişim yetkiniz bulunmuyor.');
  }

  try {
    const stats = await giveawayService.getAdminStats();
    const giveaways = await giveawayService.getAllGiveaways();
    const tasks = await Store.giveawayTasks.find({});
    const participants = await Store.giveawayEntries.find({});
    const fraudFlags = await Store.giveawayFraudFlags.find({});
    const ads = await sponsorAdService.getAllAds();
    const socialAds = socialHubService.getAllAds();
    const socialAnalytics = socialHubService.getAnalytics();
    const auditLogs = await Store.giveawayAuditLogs.find({});
    auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const html = renderGiveawayAdminPage({
      user: req.user,
      stats,
      giveaways,
      tasks,
      participants,
      fraudFlags,
      ads,
      socialAds,
      socialAnalytics,
      auditLogs: auditLogs.slice(0, 30)
    });
    res.send(html);
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

// Admin: Create Giveaway
router.post('/api/admin/giveaways', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz işlem.' });
  }

  try {
    const giveaway = await giveawayService.createGiveaway(req.body, req.user);
    res.json({ success: true, giveaway });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Pick / Draw Winner
router.post('/api/admin/giveaways/:id/draw', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz işlem.' });
  }

  try {
    const isRedraw = req.body.isRedraw === true;
    const winner = await giveawayService.pickWinner({
      giveawayId: req.params.id,
      adminUser: req.user,
      isRedraw
    });
    res.json({ success: true, winner });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Disqualify Participant
router.post('/api/admin/participants/:id/disqualify', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz işlem.' });
  }
  try {
    await Store.giveawayEntries.update({ _id: req.params.id }, { $set: { status: 'DISQUALIFIED' } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Restore Participant
router.post('/api/admin/participants/:id/restore', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz işlem.' });
  }
  try {
    await Store.giveawayEntries.update({ _id: req.params.id }, { $set: { status: 'VALID' } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Resolve Fraud Flag
router.post('/api/admin/fraud/:id/resolve', async (req, res) => {
  if (!isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, message: 'Yetkisiz işlem.' });
  }
  try {
    await Store.giveawayFraudFlags.remove({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
