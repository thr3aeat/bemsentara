// server/routes/giveaways.js
'use strict';

const express = require('express');
const router = express.Router();
const giveawayService = require('../services/giveawayService');
const sponsorAdService = require('../services/sponsorAdService');
const socialHubService = require('../services/socialHubService');
const { isSiteAdmin, isSiteStaff, isEnvAdmin } = require('../../utils/adminCheck');
const Store = require('../../models/Store');
const logger = require('../../utils/logger') || console;

const { renderGiveawaysFeedPage } = require('../views/giveaways/giveawaysFeedPage');
const { renderGiveawayDetailPage } = require('../views/giveaways/giveawayDetailPage');
const { renderGiveawayWinnersPage } = require('../views/giveaways/giveawayWinnersPage');
const { renderGiveawayTransparencyPage } = require('../views/giveaways/giveawayTransparencyPage');
const { renderGiveawayProfilePage } = require('../views/giveaways/giveawayProfilePage');
const { renderGiveawayLiveDrawPage } = require('../views/giveaways/giveawayLiveDrawPage');
const { renderGiveawayAdminPage } = require('../views/giveaways/giveawayAdminPage');

// ─── 1. RATE LIMITING ENGINE (IN-MEMORY SLIDING WINDOW) ─────────────────────
const rateLimitMap = new Map();

function createRateLimiter({ windowMs = 60000, maxRequests = 30, code = 'RATE_LIMIT_EXCEEDED', message = 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' }) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
    const userId = req.user?.discordId || req.user?._id || 'anonymous';
    const key = `${req.path}:${ip}:${userId}`;

    const now = Date.now();
    let record = rateLimitMap.get(key);

    if (!record) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitMap.set(key, record);
    } else {
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
        if (record.count > maxRequests) {
          return res.status(429).json({
            success: false,
            code,
            message,
            retryAfterMs: Math.max(0, record.resetTime - now)
          });
        }
      }
    }
    next();
  };
}

// Özel endpoint rate limiter'ları
const taskSubmitLimiter = createRateLimiter({ windowMs: 10000, maxRequests: 5, code: 'TASK_RATE_LIMIT' });
const referralLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 15, code: 'REFERRAL_RATE_LIMIT' });
const winnerDrawLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 6, code: 'DRAW_RATE_LIMIT' });

// Periodik temizlik (Memory leak engelleme)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(key);
  }
}, 120000);

// Helper to get client IP
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
}

// ─── 2. ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE ─────────────────────────
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  GIVEAWAY_ADMIN: 'GIVEAWAY_ADMIN',
  GIVEAWAY_MODERATOR: 'GIVEAWAY_MODERATOR',
  VIEWER: 'VIEWER'
};

function getUserGiveawayRole(user) {
  if (!user || user.isBanned) return null;
  if (isEnvAdmin(user.discordId) || user.role === 'SUPER_ADMIN') return ROLES.SUPER_ADMIN;
  if (isSiteAdmin(user) || user.role === 'GIVEAWAY_ADMIN') return ROLES.GIVEAWAY_ADMIN;
  if (isSiteStaff(user) || user.role === 'GIVEAWAY_MODERATOR') return ROLES.GIVEAWAY_MODERATOR;
  return ROLES.VIEWER;
}

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Lütfen giriş yapın.' });
      }
      return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }

    const role = getUserGiveawayRole(req.user);
    if (!role) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Yetkisiz erişim.' });
    }

    const hierarchy = [ROLES.VIEWER, ROLES.GIVEAWAY_MODERATOR, ROLES.GIVEAWAY_ADMIN, ROLES.SUPER_ADMIN];
    const userLevel = hierarchy.indexOf(role);
    const requiredLevel = hierarchy.indexOf(minRole);

    if (userLevel < requiredLevel) {
      return res.status(403).json({ success: false, code: 'INSUFFICIENT_PERMISSIONS', message: 'Bu işlem için yetkiniz bulunmuyor.' });
    }

    req.userRole = role;
    next();
  };
}

// ─── 3. PUBLIC PAGES & REFERRAL FLOW ────────────────────────────────────────

// 1. Referral Link Handler (/r/:code)
router.get('/r/:code', referralLimiter, async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (req.session) {
    req.session.referralCode = code;
  }
  // Güvenli çerez (Production: secure, httpOnly, sameSite lax)
  res.cookie('ekoyildiz_ref', code, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

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
    
    // Format activities for ticker (Privacy: mask usernames)
    const tickerActs = activities.slice(0, 10).map(act => {
      let text = '⚡ Çekiliş platformunda hareketlilik var.';
      const rawUser = act.details?.username || act.performedBy || 'Kullanıcı';
      const maskedUser = rawUser.length > 3 ? rawUser.substring(0, 3) + '***' : rawUser;
      
      if (act.action === 'TASK_VERIFY' || act.action === 'TASK_COMPLETED') {
        text = `🎟️ @${maskedUser} görev tamamlayarak bilet kazandı!`;
      } else if (act.action === 'WINNER_SELECT') {
        text = `🏆 Büyük çekiliş kazananı belirlendi!`;
      } else if (act.action === 'GIVEAWAY_CREATE') {
        text = `🎉 Yeni bir resmi çekiliş yayınlandı!`;
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
    logger.error?.('[Giveaways] Feed hatası:', err.message);
    res.status(500).send('Hata oluştu: ' + err.message);
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
    const rawAuditLogs = await Store.giveawayAuditLogs.find({});
    rawAuditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Public Privacy Sanitization (Hide sensitive admin details or IP)
    const sanitizedLogs = rawAuditLogs.slice(0, 20).map(log => ({
      _id: log._id,
      action: log.action,
      giveawayId: log.giveawayId,
      performedBy: 'Yetkili Yönetici',
      timestamp: log.timestamp,
      reason: log.reason || ''
    }));

    let notificationCount = 0;
    if (req.user) {
      const userNotifs = await Store.giveawayNotifications.find({ userId: req.user.discordId || req.user._id, isRead: false });
      notificationCount = userNotifs.length;
    }

    const html = renderGiveawayTransparencyPage({
      user: req.user,
      completedGiveaways: completed,
      auditLogs: sanitizedLogs,
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
  // Canlı çekiliş ekranı kaldırıldı; sonuçlar artık modern çekiliş detayında yayınlanır.
  return res.redirect(302, `/cekilisler/${encodeURIComponent(req.params.id)}`);
  /*
  try {
    const giveaway = await giveawayService.getGiveawayById(req.params.id);
    if (!giveaway) {
      return res.status(404).send('Çekiliş bulunamadı.');
    }

    const winners = await Store.giveawayWinners.find({ giveawayId: giveaway._id, isBackup: false, isInvalidated: { $ne: true } });
    const entries = await Store.giveawayEntries.find({ giveawayId: giveaway._id, isDisqualified: { $ne: true } });

    // Maskeli katılımcı listesi (Privacy)
    const maskedEntries = entries.map(e => {
      const uName = e.username || 'Katılımcı';
      return {
        _id: e._id,
        username: uName.length > 3 ? uName.substring(0, 3) + '***' : uName,
        tickets: Number(e.tickets) || 0
      };
    });

    const html = renderGiveawayLiveDrawPage({
      giveaway,
      winners,
      participants: maskedEntries
    });
    res.send(html);
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
  */
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
    let userTasks = [];
    let referralCode = '';

    if (req.user) {
      const userId = req.user.discordId || req.user._id;
      userEntry = await Store.giveawayEntries.findOne({ giveawayId: giveaway._id, userId });
      userTasks = await giveawayService.getUserCompletedTasks(giveaway._id, userId);
      referralCode = userEntry ? userEntry.referralCode : giveawayService._generateReferralCode(userId);
    }

    const winners = await Store.giveawayWinners.find({ giveawayId: giveaway._id, isInvalidated: { $ne: true } });

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
      userTasks,
      winners,
      referralCode,
      notificationCount
    });
    res.send(html);
  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

// ─── 4. USER API: TASK VISIT & SUBMISSION ───────────────────────────────────

// Görev Bağlantısını Ziyaret Et (Linke tıklandı, durum VISITED olur, sahte onay yapılmaz)
router.post('/api/giveaways/:id/tasks/:taskId/visit', taskSubmitLimiter, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Lütfen önce giriş yapın.' });
  }

  try {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const refCode = req.session?.referralCode || req.cookies?.ekoyildiz_ref || null;

    const result = await giveawayService.recordTaskVisit({
      giveawayId: req.params.id,
      taskId: req.params.taskId,
      user: req.user,
      ip,
      userAgent,
      referralCode: refCode
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, code: 'VISIT_FAILED', message: err.message });
  }
});

// Görevi Doğrula veya Kanıt Sun
router.post('/api/giveaways/:id/tasks/:taskId/verify', taskSubmitLimiter, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Lütfen önce giriş yapın.' });
  }

  try {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const refCode = req.session?.referralCode || req.cookies?.ekoyildiz_ref || null;
    const proof = req.body.proof || '';

    const result = await giveawayService.submitTask({
      giveawayId: req.params.id,
      taskId: req.params.taskId,
      user: req.user,
      proof,
      ip,
      userAgent,
      referralCode: refCode
    });

    if (result.success === false) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, code: 'SUBMIT_ERROR', message: err.message });
  }
});

// Canlı Çekiliş İstatistikleri
router.get('/api/giveaways/:id/status', async (req, res) => {
  try {
    const giveaway = await giveawayService.getGiveawayById(req.params.id);
    if (!giveaway) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    res.json({
      success: true,
      totalParticipants: giveaway.totalParticipants || 0,
      totalTickets: giveaway.totalTickets || 0,
      status: giveaway.status
    });
  } catch (err) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', error: err.message });
  }
});

// ─── 5. ADMIN CONTROL & MODERATION ROUTES ───────────────────────────────────

// Admin Dashboard View (/admin/giveaways)
router.get('/admin/giveaways', requireRole(ROLES.GIVEAWAY_MODERATOR), async (req, res) => {
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
      auditLogs: auditLogs.slice(0, 30),
      userRole: req.userRole
    });
    res.send(html);
  } catch (err) {
    logger.error?.('[Admin Giveaways] View hatası:', err.message);
    res.status(500).send('Admin paneli yüklenirken hata oluştu: ' + err.message);
  }
});

// Admin: Çekiliş Oluştur (Schema Validation)
router.post('/api/admin/giveaways', requireRole(ROLES.GIVEAWAY_ADMIN), async (req, res) => {
  try {
    const body = req.body;
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      return res.status(400).json({ success: false, code: 'INVALID_TITLE', message: 'Geçerli bir çekiliş başlığı giriniz (min 3 karakter).' });
    }
    if (!body.prize || typeof body.prize !== 'string' || body.prize.trim().length < 2) {
      return res.status(400).json({ success: false, code: 'INVALID_PRIZE', message: 'Geçerli bir ödül giriniz.' });
    }

    const giveaway = await giveawayService.createGiveaway(body, req.user);
    res.json({ success: true, giveaway });
  } catch (err) {
    res.status(400).json({ success: false, code: 'CREATE_FAILED', message: err.message });
  }
});

// Admin: Kazanan Seç (Winner Draw - Scalable Weighted Random)
router.post('/api/admin/giveaways/:id/draw', requireRole(ROLES.GIVEAWAY_ADMIN), winnerDrawLimiter, async (req, res) => {
  try {
    const result = await giveawayService.pickWinner({
      giveawayId: req.params.id,
      adminUser: req.user,
      isRedraw: false
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, code: 'DRAW_FAILED', message: err.message });
  }
});

// Admin: Yeniden Çekiliş Yap (Redraw - Zorunlu Reason ile)
router.post('/api/admin/giveaways/:id/redraw', requireRole(ROLES.GIVEAWAY_ADMIN), winnerDrawLimiter, async (req, res) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason || reason.length < 5) {
      return res.status(400).json({
        success: false,
        code: 'REASON_REQUIRED',
        message: 'Yeniden çekiliş için zorunlu geçerli bir gerekçe belirtmelisiniz (min 5 karakter).'
      });
    }

    const result = await giveawayService.pickWinner({
      giveawayId: req.params.id,
      adminUser: req.user,
      isRedraw: true,
      redrawReason: reason
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, code: 'REDRAW_FAILED', message: err.message });
  }
});

// Admin: İstatistikleri Yeniden Hesapla (Recalculate Stats)
router.post('/api/admin/giveaways/:id/recalculate-stats', requireRole(ROLES.GIVEAWAY_ADMIN), async (req, res) => {
  try {
    const stats = giveawayService.recalculateGiveawayStats(req.params.id);
    res.json(stats);
  } catch (err) {
    res.status(400).json({ success: false, code: 'RECALC_FAILED', message: err.message });
  }
});

// Admin: Durum Değiştir (State Transition)
router.post('/api/admin/giveaways/:id/status', requireRole(ROLES.GIVEAWAY_ADMIN), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const g = giveawayService.transitionStatus(req.params.id, status, reason, req.user);
    res.json({ success: true, status: g.status });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Çekiliş Sil (Delete Giveaway)
router.delete('/api/admin/giveaways/:id', requireRole(ROLES.GIVEAWAY_ADMIN), async (req, res) => {
  try {
    giveawayService.deleteGiveaway(req.params.id, req.user);
    res.json({ success: true, message: 'Çekiliş başarıyla silindi.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin: Yeni Görev Ekle
router.post('/api/admin/giveaways/:id/tasks', requireRole(ROLES.GIVEAWAY_ADMIN), async (req, res) => {
  try {
    const { title, description, platform, link, actionType, strategy, tickets, isRequired } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({ success: false, code: 'INVALID_TITLE', message: 'Görev başlığı zorunludur.' });
    }

    // URL Güvenlik Kontrolü
    if (link && !giveawayService.validateUrl(link)) {
      return res.status(400).json({ success: false, code: 'INVALID_URL', message: 'Geçersiz veya güvensiz bağlantı protokolü.' });
    }

    const task = Store.giveawayTasks.create({
      giveawayId: req.params.id,
      title: title.trim(),
      description: (description || '').trim(),
      platform: platform || 'website',
      icon: req.body.icon || '🎯',
      link: link ? link.trim() : '',
      actionType: actionType || 'visit_page',
      strategy: strategy || 'VISIT_ONLY',
      tickets: Math.max(1, Number(tickets) || 1),
      isRequired: Boolean(isRequired),
      order: Date.now()
    });

    giveawayService.logAudit({
      action: 'TASK_CREATE',
      giveawayId: req.params.id,
      performedBy: req.user.username || 'Admin',
      performedById: req.user.discordId || req.user._id,
      targetId: task._id,
      details: { title: task.title, strategy: task.strategy, tickets: task.tickets }
    });

    res.json({ success: true, task });
  } catch (err) {
    res.status(400).json({ success: false, code: 'TASK_CREATE_FAILED', message: err.message });
  }
});

// Admin: Görev Sil
router.delete('/api/admin/giveaways/:id/tasks/:taskId', requireRole(ROLES.GIVEAWAY_ADMIN), async (req, res) => {
  try {
    const task = Store.giveawayTasks.findById(req.params.taskId);
    if (task) {
      Store.giveawayTasks.deleteById(task._id);
      giveawayService.logAudit({
        action: 'TASK_DELETE',
        giveawayId: req.params.id,
        performedBy: req.user.username || 'Admin',
        performedById: req.user.discordId || req.user._id,
        targetId: task._id,
        details: { title: task.title }
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, code: 'TASK_DELETE_FAILED', message: err.message });
  }
});

// Admin / Moderator: Katılımcıyı Diskalifiye Et (Reason Zorunlu)
router.post('/api/admin/participants/:id/disqualify', requireRole(ROLES.GIVEAWAY_MODERATOR), async (req, res) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason || reason.length < 4) {
      return res.status(400).json({
        success: false,
        code: 'REASON_REQUIRED',
        message: 'Diskalifiye işlemi için geçerli bir sebep belirtilmelidir.'
      });
    }

    const entry = Store.giveawayEntries.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Katılımcı bulunamadı.' });

    entry.isDisqualified = true;
    entry.status = 'DISQUALIFIED';
    entry.disqualifyReason = reason;
    entry.save();

    giveawayService.logAudit({
      action: 'ENTRY_DISQUALIFY',
      giveawayId: entry.giveawayId,
      targetId: entry._id,
      performedBy: req.user.username || 'Moderatör',
      performedById: req.user.discordId || req.user._id,
      reason,
      details: { username: entry.username, userId: entry.userId, tickets: entry.tickets }
    });

    // Otomatik olarak çekiliş geçerli istatistiklerini güncelle
    giveawayService.recalculateGiveawayStats(entry.giveawayId);

    res.json({ success: true, message: 'Katılımcı diskalifiye edildi.' });
  } catch (err) {
    res.status(400).json({ success: false, code: 'DISQUALIFY_FAILED', message: err.message });
  }
});

// Admin / Moderator: Katılımcının Engelini Kaldır (Restore)
router.post('/api/admin/participants/:id/restore', requireRole(ROLES.GIVEAWAY_MODERATOR), async (req, res) => {
  try {
    const entry = Store.giveawayEntries.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Katılımcı bulunamadı.' });

    entry.isDisqualified = false;
    entry.status = 'VALID';
    entry.disqualifyReason = '';
    entry.save();

    giveawayService.logAudit({
      action: 'ENTRY_RESTORE',
      giveawayId: entry.giveawayId,
      targetId: entry._id,
      performedBy: req.user.username || 'Moderatör',
      performedById: req.user.discordId || req.user._id,
      reason: 'Engel kaldırıldı',
      details: { username: entry.username, userId: entry.userId }
    });

    giveawayService.recalculateGiveawayStats(entry.giveawayId);

    res.json({ success: true, message: 'Katılımcı hakları iade edildi.' });
  } catch (err) {
    res.status(400).json({ success: false, code: 'RESTORE_FAILED', message: err.message });
  }
});

// Admin / Moderator: Fraud Flag Aksiyonu (Resolve, Ignore, Disqualify)
router.post('/api/admin/fraud/:id/action', requireRole(ROLES.GIVEAWAY_MODERATOR), async (req, res) => {
  try {
    const { action, reason } = req.body;
    const flag = Store.giveawayFraudFlags.findById(req.params.id);
    if (!flag) return res.status(404).json({ success: false, message: 'İnceleme kaydı bulunamadı.' });

    if (action === 'DISQUALIFY') {
      const entry = Store.giveawayEntries.findOne({ giveawayId: flag.giveawayId, userId: flag.userId });
      if (entry) {
        entry.isDisqualified = true;
        entry.status = 'DISQUALIFIED';
        entry.disqualifyReason = reason || flag.reason;
        entry.save();
        giveawayService.recalculateGiveawayStats(flag.giveawayId);
      }
      flag.status = 'RESOLVED_DISQUALIFIED';
      flag.isResolved = true;
    } else if (action === 'IGNORE') {
      flag.status = 'IGNORED';
      flag.isResolved = true;
    } else {
      flag.status = 'RESOLVED';
      flag.isResolved = true;
    }

    flag.resolvedAt = new Date();
    flag.resolvedBy = req.user.username || 'Moderatör';
    flag.save();

    giveawayService.logAudit({
      action: 'FRAUD_REVIEW',
      giveawayId: flag.giveawayId,
      targetId: flag._id,
      performedBy: req.user.username || 'Moderatör',
      performedById: req.user.discordId || req.user._id,
      reason: reason || action,
      details: { action, fraudUser: flag.username, flagReason: flag.reason }
    });

    res.json({ success: true, status: flag.status });
  } catch (err) {
    res.status(400).json({ success: false, code: 'FRAUD_ACTION_FAILED', message: err.message });
  }
});

// Geriye dönük uyumluluk: Fraud resolve
router.post('/api/admin/fraud/:id/resolve', requireRole(ROLES.GIVEAWAY_MODERATOR), async (req, res) => {
  try {
    const flag = Store.giveawayFraudFlags.findById(req.params.id);
    if (flag) {
      flag.isResolved = true;
      flag.status = 'RESOLVED';
      flag.resolvedBy = req.user.username || 'Moderatör';
      flag.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
