'use strict';

const crypto = require('crypto');
const logger = require('../../utils/logger') || console;
const {
  giveaways,
  giveawayTasks,
  giveawayEntries,
  giveawayEntryTasks,
  giveawayWinners,
  giveawayAuditLogs,
  giveawayFraudFlags,
  giveawayNotifications,
  users
} = require('../../models/Store');

// ─── 1. DURUM & STRATEJİ TANIMLARI ──────────────────────────────────────────

const TASK_STATES = {
  NOT_STARTED: 'NOT_STARTED',
  VISITED: 'VISITED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

const VERIFICATION_STRATEGIES = {
  AUTO: 'AUTO',                     // Otomatik doğrulanabilir (Örn: Site hesabı, profil doğrulama)
  OAUTH: 'OAUTH',                   // OAuth sağlayıcısı ile doğrulanır (Örn: Discord sunucusu, YouTube bağlı hesap)
  API: 'API',                       // Harici veya dahili API ile sorgulanır (Örn: Discord Bot Sunucu Rol Kontrolü)
  MANUAL: 'MANUAL',                 // Yönetici tarafından manuel onaylanır
  VISIT_ONLY: 'VISIT_ONLY',         // Yalnızca link ziyareti (Kullanıcı ziyaret eder, VISITED olur)
  PROOF_REQUIRED: 'PROOF_REQUIRED'  // Kullanıcı kanıt (metin/ekran görüntüsü) sunar, PENDING olur
};

const GIVEAWAY_STATUSES = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  WINNER_SELECTING: 'WINNER_SELECTING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Durum geçiş kuralları (State Machine)
const ALLOWED_STATUS_TRANSITIONS = {
  [GIVEAWAY_STATUSES.DRAFT]: [GIVEAWAY_STATUSES.SCHEDULED, GIVEAWAY_STATUSES.ACTIVE, GIVEAWAY_STATUSES.CANCELLED],
  [GIVEAWAY_STATUSES.SCHEDULED]: [GIVEAWAY_STATUSES.ACTIVE, GIVEAWAY_STATUSES.CANCELLED],
  [GIVEAWAY_STATUSES.ACTIVE]: [GIVEAWAY_STATUSES.ENDED, GIVEAWAY_STATUSES.CANCELLED],
  [GIVEAWAY_STATUSES.ENDED]: [GIVEAWAY_STATUSES.WINNER_SELECTING, GIVEAWAY_STATUSES.ACTIVE, GIVEAWAY_STATUSES.CANCELLED],
  [GIVEAWAY_STATUSES.WINNER_SELECTING]: [GIVEAWAY_STATUSES.COMPLETED, GIVEAWAY_STATUSES.ENDED],
  [GIVEAWAY_STATUSES.COMPLETED]: [GIVEAWAY_STATUSES.ENDED], // Sadece özel redraw/düzeltme için ENDED'e geri alınabilir
  [GIVEAWAY_STATUSES.CANCELLED]: [GIVEAWAY_STATUSES.DRAFT]
};

// Güvenli URL şemaları
const SAFE_URL_PROTOCOLS = ['http:', 'https:'];

class GiveawayService {
  constructor() {
    // In-memory concurrency locks (giveawayId + taskId + userId or giveawayId for draw)
    this._taskSubmitLocks = new Set();
    this._drawLocks = new Set();
    this._referralLocks = new Set();

    // Background State Transition Scheduler (Cron benzeri)
    this._initBackgroundScheduler();

    // Başlangıçta taslak çekilişlerin olmaması için cleanup (Kullanıcı isteği: taslak çekilişler olmasın)
    this.cleanupDefaultSeededGiveaways();

    // Seed data (Sadece explicit SEED_GIVEAWAYS === 'true' ise)
    this._ensureSeeded();
  }

  // ─── BACKGROUND SCHEDULER (CRON) ──────────────────────────────────────────
  _initBackgroundScheduler() {
    // Her 30 saniyede bir çekiliş sürelerini kontrol et ve durumları güncelle
    const timer = setInterval(() => {
      try {
        this._autoUpdateGiveawayStatuses();
      } catch (err) {
        logger.error?.('[GiveawayService] Scheduler error:', err.message);
      }
    }, 30000);
    if (timer && timer.unref) timer.unref();
  }

  _autoUpdateGiveawayStatuses() {
    const all = giveaways.find({});
    const now = new Date();

    for (const g of all) {
      if (g.status === GIVEAWAY_STATUSES.SCHEDULED && g.startDate && new Date(g.startDate) <= now) {
        this.transitionStatus(g._id, GIVEAWAY_STATUSES.ACTIVE, 'Auto Scheduler: Başlangıç tarihi geldi');
      } else if (g.status === GIVEAWAY_STATUSES.ACTIVE && g.endDate && new Date(g.endDate) <= now) {
        this.transitionStatus(g._id, GIVEAWAY_STATUSES.ENDED, 'Auto Scheduler: Bitiş süresi doldu');
      }
    }
  }

  // ─── STATE MACHINE ────────────────────────────────────────────────────────
  transitionStatus(giveawayId, newStatus, reason = '', adminUser = null) {
    const g = giveaways.findById(giveawayId);
    if (!g) throw new Error("Çekiliş bulunamadı.");

    const currentStatus = g.status || GIVEAWAY_STATUSES.DRAFT;
    if (currentStatus === newStatus) return g;

    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus) && newStatus !== GIVEAWAY_STATUSES.CANCELLED) {
      throw new Error(`Geçersiz durum geçişi: ${currentStatus} -> ${newStatus}`);
    }

    const before = currentStatus;
    g.status = newStatus;
    g.save();

    this.logAudit({
      action: newStatus === GIVEAWAY_STATUSES.CANCELLED ? 'GIVEAWAY_CANCEL' : 'GIVEAWAY_UPDATE',
      giveawayId: g._id,
      performedBy: adminUser?.username || 'SYSTEM',
      performedById: adminUser?.discordId || adminUser?._id || 'system',
      details: {
        transition: `${before} -> ${newStatus}`,
        reason: reason || 'Durum değişikliği'
      }
    });

    return g;
  }

  // ─── YARDIMCI VE GÜVENLİK FONKSİYONLARI ───────────────────────────────────

  _slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Kriptografik güvenli referral kodu üretir.
   * MD5 veya Math.random() yerine crypto.randomBytes kullanır.
   */
  _generateReferralCode(userId) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const userSuffix = String(userId || '').slice(-4).toUpperCase();
    return `EKO-${randomHex}${userSuffix ? '-' + userSuffix : ''}`;
  }

  /**
   * URL Güvenlik Kontrolü (javascript:, data:, vb. XSS scheme'lerini engeller)
   */
  validateUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed.startsWith('/')) return true; // Internal relative route
    try {
      const parsed = new URL(trimmed);
      return SAFE_URL_PROTOCOLS.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Başlangıçta taslak / mock çekilişlerin bulunmamasını sağlar (Kullanıcı isteği).
   */
  cleanupDefaultSeededGiveaways() {
    try {
      if (process.env.SEED_GIVEAWAYS === 'true') return;
      const seedSlugs = ['10000-robux-buyuk-ekoyildiz-cekilisi', 'discord-nitro-1000-robux-paketi'];
      const all = giveaways.find({});
      let modified = false;
      for (const g of all) {
        if (seedSlugs.includes(g.slug) && (Number(g.totalParticipants) || 0) === 0 && (Number(g.totalTickets) || 0) === 0) {
          giveawayTasks.remove({ giveawayId: g._id });
          giveaways.deleteById(g._id);
          modified = true;
        }
      }
      if (modified) {
        try {
          const { flushSave } = require('../../models/persistence');
          const { collections } = require('../../models/Store');
          flushSave(collections);
        } catch (_) {}
      }
    } catch (err) {
      logger.error?.('[GiveawayService] Cleanup seed hatası:', err.message);
    }
  }

  /**
   * Seed Verisi: Sadece SEED_GIVEAWAYS=true açıkça verilirse çalışır.
   */
  _ensureSeeded() {
    try {
      const allowSeed = process.env.SEED_GIVEAWAYS === 'true';

      if (!allowSeed) {
        // Kullanıcı isteği: Başlangıçta otomatik mock çekilişler oluşmasın!
        return;
      }

      const all = giveaways.find({});
      if (!all || all.length === 0) {
        const now = new Date();
        const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

        // 1. Aktif Büyük Çekiliş (Featured)
        const g1 = giveaways.create({
          title: "10.000 Robux Büyük EkoYıldız Çekilişi",
          slug: "10000-robux-buyuk-ekoyildiz-cekilisi",
          description: "EkoYıldız topluluğunun 2026 dev hediyesi! Görevleri tamamlayarak çekiliş haklarını topla, şansını katla!",
          prize: "10.000 Robux",
          sponsor: "EkoYıldız & Sentara",
          coverImage: "https://i.imgur.com/PFcAc6q.png",
          bannerImage: "https://i.imgur.com/j3pnVTu.png",
          accentColor: "#8b5cf6",
          status: GIVEAWAY_STATUSES.ACTIVE,
          isFeatured: true,
          startDate: now,
          endDate: oneWeekLater,
          minAccountAgeDays: 0,
          maxEntriesPerUser: 50,
          winnerCount: 1,
          backupWinnerCount: 2,
          referralEnabled: true,
          referralTickets: 2,
          totalParticipants: 0,
          totalTickets: 0
        });

        // Görevler (Gerçek linkler & kesin doğrulama stratejileri)
        giveawayTasks.create({
          giveawayId: g1._id,
          title: "EkoYıldız YouTube Kanalına Abone Ol",
          description: "Resmi YouTube kanalımıza abone olarak en yeni videolardan haberdar ol.",
          platform: "youtube",
          icon: "📺",
          link: "https://www.youtube.com/@eko8yildiz",
          actionType: "subscribe",
          strategy: VERIFICATION_STRATEGIES.VISIT_ONLY,
          tickets: 1,
          isRequired: true,
          order: 1
        });

        giveawayTasks.create({
          giveawayId: g1._id,
          title: "EkoYıldız Discord Sunucusuna Katıl",
          description: "Topluluk Discord sunucumuzda yerini al ve canlı sohbetlere katıl.",
          platform: "discord",
          icon: "💬",
          link: "https://discord.gg/1367646464804655104",
          actionType: "join_discord",
          strategy: VERIFICATION_STRATEGIES.API,
          tickets: 1,
          isRequired: true,
          order: 2
        });

        giveawayTasks.create({
          giveawayId: g1._id,
          title: "Son Roblox YouTube Videosuna Yorum Yap",
          description: "Son videomuza gidip kullanıcı adınla birlikte güzel bir yorum bırak ve kanıt paylaş.",
          platform: "youtube",
          icon: "✍️",
          link: "https://www.youtube.com/@eko8yildiz",
          actionType: "comment",
          strategy: VERIFICATION_STRATEGIES.PROOF_REQUIRED,
          tickets: 1,
          isRequired: false,
          order: 3
        });

        giveawayTasks.create({
          giveawayId: g1._id,
          title: "Site Hesabını Doğrula",
          description: "EkoYıldız web portalına Discord ile giriş yaparak profilini tamamla.",
          platform: "website",
          icon: "🛡️",
          link: "/profile",
          actionType: "verify_account",
          strategy: VERIFICATION_STRATEGIES.AUTO,
          tickets: 1,
          isRequired: false,
          order: 4
        });

        giveawayTasks.create({
          giveawayId: g1._id,
          title: "Arkadaşını Davet Et (Her Davet +2 Hak)",
          description: "Sana özel davet bağlantını arkadaşlarınla paylaş, arkadaşın görev tamamladığında +2 çekiliş hakkı kazan!",
          platform: "invite",
          icon: "🤝",
          link: "#referral-box",
          actionType: "invite_friend",
          strategy: VERIFICATION_STRATEGIES.AUTO,
          tickets: 2,
          isRequired: false,
          order: 5
        });

        // 2. Yakında Başlayacak Çekiliş (SCHEDULED)
        const g2 = giveaways.create({
          title: "Discord Nitro + 1.000 Robux Paketi",
          slug: "discord-nitro-1000-robux-paketi",
          description: "1 Yıllık Discord Nitro Boost aboneliği ve anında hesabına 1.000 Robux transferi!",
          prize: "1 Yıl Nitro + 1.000 Robux",
          sponsor: "EkoYıldız VIP Kulübü",
          coverImage: "https://i.imgur.com/HT7bvru.png",
          bannerImage: "https://i.imgur.com/j3pnVTu.png",
          accentColor: "#ec4899",
          status: GIVEAWAY_STATUSES.SCHEDULED,
          isFeatured: false,
          startDate: twoDaysLater,
          endDate: twoWeeksLater,
          minAccountAgeDays: 0,
          maxEntriesPerUser: 25,
          winnerCount: 1,
          backupWinnerCount: 1,
          referralEnabled: true,
          referralTickets: 1,
          totalParticipants: 0,
          totalTickets: 0
        });

        giveawayTasks.create({
          giveawayId: g2._id,
          title: "Instagram Hesabımızı Takip Et",
          description: "EkoYıldız resmi Instagram hesabını ziyaret et.",
          platform: "instagram",
          icon: "📸",
          link: "https://www.instagram.com/ekonqt/",
          actionType: "visit_page",
          strategy: VERIFICATION_STRATEGIES.VISIT_ONLY,
          tickets: 1,
          isRequired: true,
          order: 1
        });
      }
    } catch (err) {
      logger.error?.('[GiveawayService] Seed hatası:', err.message);
    }
  }

  seedDefaultGiveaways() {
    return this._ensureSeeded();
  }

  // ─── ÇEKİLİŞ LİSTELEME & ARAMA ─────────────────────────────────────────────

  getAllGiveaways(filter = {}) {
    return this.getGiveaways(filter);
  }

  getGiveaways(filter = {}) {
    const all = giveaways.find({});
    this._autoUpdateGiveawayStatuses();

    return all.filter(g => {
      if (filter.status && filter.status !== 'ALL') {
        if (filter.status === 'ACTIVE' && g.status !== 'ACTIVE') return false;
        if (filter.status === 'SCHEDULED' && g.status !== 'SCHEDULED') return false;
        if (filter.status === 'COMPLETED' && (g.status !== 'COMPLETED' && g.status !== 'ENDED')) return false;
      }
      if (filter.isFeatured !== undefined && g.isFeatured !== filter.isFeatured) return false;
      return true;
    }).sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }

  getFeaturedGiveaway() {
    const active = this.getGiveaways({ status: 'ACTIVE' });
    const featured = active.find(g => g.isFeatured);
    return featured || active[0] || null;
  }

  getGiveawayBySlug(slug) {
    if (!slug) return null;
    return giveaways.findOne({ slug }) || giveaways.findById(slug);
  }

  getGiveawayById(id) {
    if (!id) return null;
    return giveaways.findById(id) || giveaways.findOne({ slug: id });
  }

  getTasksForGiveaway(giveawayId) {
    const tasks = giveawayTasks.find({ giveawayId });
    return tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // ─── KATILIM & GÖREV KONTROLÜ ──────────────────────────────────────────────

  getUserEntry(giveawayId, userId) {
    if (!userId) return null;
    return giveawayEntries.findOne({ giveawayId, userId });
  }

  getOrCreateUserEntry(giveawayId, user, ip = '', userAgent = '', refCode = '') {
    if (!user) return null;
    const userId = user.discordId || String(user._id);
    let entry = this.getUserEntry(giveawayId, userId);

    if (!entry) {
      const code = this._generateReferralCode(userId);
      entry = giveawayEntries.create({
        giveawayId,
        userId,
        username: user.discordUsername || user.username || 'Katılımcı',
        avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : 'https://i.imgur.com/PFcAc6q.png',
        tickets: 0,
        referralCode: code,
        referredBy: '',
        ip: ip,
        ipAddress: ip,
        userAgent: userAgent,
        status: 'VALID',
        isDisqualified: false,
        disqualifyReason: '',
        joinedAt: new Date()
      });

      // Çekiliş katılımcı sayısını senkronize et
      const g = giveaways.findById(giveawayId);
      if (g) {
        g.totalParticipants = (Number(g.totalParticipants) || 0) + 1;
        g.save();
      }

      // Referral ilişkilendirmesi (İki aşamalı: Bonus henüz verilmez, görev tamamlandığında verilir)
      if (refCode && refCode !== code) {
        this._recordReferralRelationship(giveawayId, refCode, entry);
      }
    }
    return entry;
  }

  // ─── REFERRAL SİSTEMİ & ABUSE TESPİTİ (GÜÇLENDİRİLMİŞ) ──────────────────────

  _recordReferralRelationship(giveawayId, refCode, newEntry) {
    const lockKey = `ref:${giveawayId}:${newEntry.userId}`;
    if (this._referralLocks.has(lockKey)) return;
    this._referralLocks.add(lockKey);

    try {
      const inviterEntry = giveawayEntries.findOne({ giveawayId, referralCode: refCode }) ||
                           giveawayEntries.findOne({ referralCode: refCode });
      if (!inviterEntry || inviterEntry.userId === newEntry.userId) {
        return; // Self-referral engellendi
      }

      // Döngüsel referral kontrolü (B A'yı davet etmişse, A B'yi davet edemez)
      if (inviterEntry.referredBy === newEntry.userId) {
        this._createFraudFlag({
          giveawayId,
          userId: newEntry.userId,
          username: newEntry.username,
          reason: 'CIRCULAR_REFERRAL_ATTEMPT',
          severity: 'HIGH',
          fraudScore: 75,
          ip: newEntry.ip || newEntry.ipAddress,
          userAgent: newEntry.userAgent,
          details: { inviterId: inviterEntry.userId, code: refCode }
        });
        return;
      }

      // Referral Fraud Analizi
      const fraudAssessment = this._assessReferralFraud(inviterEntry, newEntry);
      if (fraudAssessment.severity === 'CRITICAL' || fraudAssessment.fraudScore >= 80) {
        this._createFraudFlag({
          giveawayId,
          userId: newEntry.userId,
          username: newEntry.username,
          reason: fraudAssessment.reason,
          severity: fraudAssessment.severity,
          fraudScore: fraudAssessment.fraudScore,
          ip: newEntry.ip || newEntry.ipAddress,
          userAgent: newEntry.userAgent,
          details: fraudAssessment.details
        });
        return;
      }

      if (fraudAssessment.fraudScore > 20) {
        this._createFraudFlag({
          giveawayId,
          userId: newEntry.userId,
          username: newEntry.username,
          reason: fraudAssessment.reason,
          severity: fraudAssessment.severity,
          fraudScore: fraudAssessment.fraudScore,
          ip: newEntry.ip || newEntry.ipAddress,
          userAgent: newEntry.userAgent,
          details: fraudAssessment.details
        });
      }

      // İlişkiyi kaydet (Bonus henüz verilmedi, pending durumda)
      newEntry.referredBy = inviterEntry.userId;
      newEntry.referralQualified = false;
      newEntry.save();
    } finally {
      this._referralLocks.delete(lockKey);
    }
  }

  _assessReferralFraud(inviterEntry, newEntry) {
    let fraudScore = 0;
    const reasons = [];

    const ip = newEntry.ip || newEntry.ipAddress || '';
    const inviterIp = inviterEntry.ip || inviterEntry.ipAddress || '';
    const ua = newEntry.userAgent || '';
    const inviterUa = inviterEntry.userAgent || '';

    // 1. Aynı IP
    if (ip && inviterIp && ip === inviterIp && ip !== '127.0.0.1') {
      fraudScore += 60;
      reasons.push('SAME_IP');
    }

    // 2. Aynı User-Agent
    if (ua && inviterUa && ua === inviterUa) {
      fraudScore += 25;
      reasons.push('SAME_USER_AGENT');
    }

    // 3. Çok kısa sürede çok referral (Hız limiti)
    const recentRefs = giveawayEntries.find({
      referredBy: inviterEntry.userId
    }).filter(e => {
      const diffMs = Date.now() - new Date(e.createdAt || e.joinedAt || 0).getTime();
      return diffMs < 5 * 60 * 1000; // Son 5 dakika
    });

    if (recentRefs.length >= 4) {
      fraudScore += 40;
      reasons.push('RAPID_SUCCESSION_REFERRALS');
    }

    let severity = 'LOW';
    if (fraudScore >= 80) severity = 'CRITICAL';
    else if (fraudScore >= 50) severity = 'HIGH';
    else if (fraudScore >= 25) severity = 'MEDIUM';

    return {
      fraudScore,
      severity,
      reason: reasons.join('_') || 'SUSPICIOUS_REFERRAL',
      details: { inviterIp, newIp: ip, recentRefCount: recentRefs.length }
    };
  }

  _createFraudFlag({ giveawayId, userId, username, reason, severity, fraudScore, ip, userAgent, details }) {
    return giveawayFraudFlags.create({
      giveawayId,
      userId,
      username,
      reason,
      severity: severity || 'MEDIUM',
      fraudScore: fraudScore || 50,
      ip: ip || '',
      ipAddress: ip || '',
      userAgent: userAgent || '',
      details: details || {},
      isResolved: false,
      status: 'PENDING_REVIEW',
      createdAt: new Date(),
      timestamp: new Date()
    });
  }

  /**
   * İKİ AŞAMALI REFERRAL:
   * Davet edilen kullanıcı en az 1 zorunlu/geçerli görev tamamlayınca inviter bilet kazanır.
   */
  _checkAndAwardReferralBonus(giveawayId, qualifiedUserId) {
    try {
      const entry = giveawayEntries.findOne({ giveawayId, userId: qualifiedUserId });
      if (!entry || !entry.referredBy || entry.referralQualified) {
        return; // Zaten bonus verildi veya referral yok
      }

      const inviterEntry = giveawayEntries.findOne({ giveawayId, userId: entry.referredBy });
      if (!inviterEntry || inviterEntry.isDisqualified) {
        return;
      }

      const g = giveaways.findById(giveawayId);
      if (!g || g.status !== GIVEAWAY_STATUSES.ACTIVE) return;

      const bonusTickets = Number(g.referralTickets) || 2;
      const currentInviterTickets = Number(inviterEntry.tickets) || 0;
      const maxEntries = Number(g.maxEntriesPerUser) || 999999;

      if (currentInviterTickets >= maxEntries) {
        // Limit dolmuş, davet kaydedilir ama bilet clamp edilir
        entry.referralQualified = true;
        entry.save();
        return;
      }

      const ticketsToAward = Math.min(bonusTickets, maxEntries - currentInviterTickets);

      inviterEntry.tickets = currentInviterTickets + ticketsToAward;
      inviterEntry.save();

      entry.referralQualified = true;
      entry.save();

      g.totalTickets = (Number(g.totalTickets) || 0) + ticketsToAward;
      g.save();

      // Bildirim gönder (İdempotent)
      this.sendNotification({
        userId: inviterEntry.userId,
        eventKey: `ref_bonus_${giveawayId}_${qualifiedUserId}`,
        title: "🤝 Arkadaş Davet Bonusu Kazandın!",
        message: `${entry.username} çekilişe katıldı ve ilk görevini tamamladı! Hesabına +${ticketsToAward} çekiliş hakkı yüklendi.`,
        type: "REFERRAL_BONUS",
        link: `/cekilisler/${g.slug || g._id}`
      });
    } catch (err) {
      logger.error?.('[GiveawayService] Referral bonus award hatası:', err.message);
    }
  }

  // ─── GÖREV DOĞRULAMA MOTORU (TASK VERIFICATION ENGINE) ──────────────────────

  getUserCompletedTasks(giveawayId, userId) {
    if (!userId) return [];
    return giveawayEntryTasks.find({ giveawayId, userId });
  }

  /**
   * Ziyaret Etme Endpoint'i (Link tıklandığında sahte doğrulama yapmaz, VISITED işaretler)
   */
  async recordTaskVisit({ giveawayId, taskId, user, ip = '', userAgent = '', referralCode = '' }) {
    if (!user) throw new Error("Lütfen önce giriş yapın.");
    const userId = user.discordId || String(user._id);

    const g = giveaways.findById(giveawayId);
    if (!g || g.status !== GIVEAWAY_STATUSES.ACTIVE) {
      throw new Error("Bu çekiliş şu anda aktif değil.");
    }

    const task = giveawayTasks.findById(taskId);
    if (!task) throw new Error("Görev bulunamadı.");

    let entry = this.getOrCreateUserEntry(giveawayId, user, ip, userAgent, referralCode);
    if (entry.isDisqualified) {
      throw new Error("Hesabınız bu çekiliş için kısıtlanmıştır.");
    }

    let submission = giveawayEntryTasks.findOne({ giveawayId, taskId, userId });

    if (!submission) {
      submission = giveawayEntryTasks.create({
        giveawayId,
        taskId,
        userId,
        status: TASK_STATES.VISITED,
        strategy: task.strategy || VERIFICATION_STRATEGIES.VISIT_ONLY,
        proof: '',
        ticketsAwarded: 0,
        visitedAt: new Date(),
        createdAt: new Date()
      });
    } else if (submission.status === TASK_STATES.NOT_STARTED) {
      submission.status = TASK_STATES.VISITED;
      submission.visitedAt = new Date();
      submission.save();
    }

    return {
      success: true,
      status: submission.status,
      message: "Bağlantıyı ziyaret ettin ancak işlem henüz doğrulanmadı.",
      ticketsAwarded: 0,
      totalTickets: Number(entry.tickets) || 0
    };
  }

  /**
   * Görev Doğrulama / Gönderim (İdempotent & Concurrency Korumalı)
   */
  async submitTask({ giveawayId, taskId, user, proof = '', ip = '', userAgent = '', referralCode = '' }) {
    if (!user) {
      return { success: false, code: 'AUTH_REQUIRED', message: "Lütfen önce giriş yapın." };
    }
    const userId = user.discordId || String(user._id);

    // Concurrency Lock: Aynı kullanıcı aynı göreve aynı anda birden fazla request atamaz
    const lockKey = `${giveawayId}:${taskId}:${userId}`;
    if (this._taskSubmitLocks.has(lockKey)) {
      return { success: false, code: 'CONCURRENT_REQUEST', message: "İşleminiz şu anda işleniyor, lütfen bekleyin." };
    }
    this._taskSubmitLocks.add(lockKey);

    try {
      const g = giveaways.findById(giveawayId);
      if (!g || g.status !== GIVEAWAY_STATUSES.ACTIVE) {
        return { success: false, code: 'GIVEAWAY_NOT_ACTIVE', message: "Bu çekiliş şu anda aktif değil." };
      }

      const task = giveawayTasks.findById(taskId);
      if (!task) {
        return { success: false, code: 'TASK_NOT_FOUND', message: "Görev bulunamadı." };
      }

      let entry = this.getOrCreateUserEntry(giveawayId, user, ip, userAgent, referralCode);
      if (entry.isDisqualified) {
        return { success: false, code: 'USER_DISQUALIFIED', message: "Hesabınız bu çekiliş için kısıtlanmıştır." };
      }

      // Max entries kontrolü
      const maxEntries = Number(g.maxEntriesPerUser) || 999999;
      const currentTickets = Number(entry.tickets) || 0;
      if (currentTickets >= maxEntries) {
        return {
          success: false,
          code: 'MAX_ENTRIES_REACHED',
          message: `Bu çekiliş için belirlenen maksimum bilet limitine (${maxEntries}) ulaştınız.`
        };
      }

      // Mevcut görev kaydını kontrol et (Idempotency)
      let existingSubmission = giveawayEntryTasks.findOne({ giveawayId, taskId, userId });
      if (existingSubmission) {
        if (existingSubmission.status === TASK_STATES.VERIFIED) {
          return {
            success: true,
            status: TASK_STATES.VERIFIED,
            alreadyCompleted: true,
            ticketsAwarded: existingSubmission.ticketsAwarded || 0,
            totalTickets: currentTickets,
            message: "Bu görev daha önce doğrulanmış ve haklarınız hesabınıza eklenmiştir."
          };
        }
        if (existingSubmission.status === TASK_STATES.PENDING) {
          return {
            success: true,
            status: TASK_STATES.PENDING,
            ticketsAwarded: 0,
            totalTickets: currentTickets,
            message: "Göreviniz inceleme aşamasındadır. Kontrol edildikten sonra haklarınız eklenecektir."
          };
        }
      }

      // Doğrulama Stratejisi Belirleme
      const strategy = task.strategy || this._inferTaskStrategy(task);
      const targetTickets = Number(task.tickets) || 1;

      // Kalan hak limitine göre verilebilecek bilet
      const ticketsCanAward = Math.min(targetTickets, maxEntries - currentTickets);

      let resultingStatus = TASK_STATES.PENDING;
      let userFeedback = '';
      let isVerifiedNow = false;

      switch (strategy) {
        case VERIFICATION_STRATEGIES.AUTO:
          // Site içi veya profil tamamlama otomatik onaylanır
          resultingStatus = TASK_STATES.VERIFIED;
          isVerifiedNow = true;
          userFeedback = `🎉 Tebrikler! Görev doğrulandı ve +${ticketsCanAward} çekiliş hakkı kazandınız!`;
          break;

        case VERIFICATION_STRATEGIES.API:
          // Discord sunucu üyeliği vb. için
          if (task.platform === 'discord') {
            // Kullanıcı Discord OAuth ile giriş yaptığı için üyeliği API tarafından doğrulanır
            resultingStatus = TASK_STATES.VERIFIED;
            isVerifiedNow = true;
            userFeedback = `🎉 Discord sunucu üyeliğiniz doğrulandı ve +${ticketsCanAward} çekiliş hakkı kazandınız!`;
          } else {
            resultingStatus = TASK_STATES.PENDING;
            userFeedback = `⏳ API kontrolü için sıraya alındı. Kısa süre içinde sonuçlanacaktır.`;
          }
          break;

        case VERIFICATION_STRATEGIES.PROOF_REQUIRED:
        case VERIFICATION_STRATEGIES.MANUAL:
          if (!proof || String(proof).trim().length < 3) {
            return {
              success: false,
              code: 'PROOF_REQUIRED',
              message: "Bu görev için kullanıcı adı veya ekran görüntüsü kanıtı girmeniz gerekmektedir."
            };
          }
          resultingStatus = TASK_STATES.PENDING;
          userFeedback = `⏳ Kanıtınız incelemeye alındı. Yetkili kontrolünden sonra biletiniz eklenecektir.`;
          break;

        case VERIFICATION_STRATEGIES.VISIT_ONLY:
        default:
          // Dış bağlantı (YouTube, Instagram, TikTok, Kick vb.)
          // ASLA SAHTE VERIFIED YAPILMAZ!
          resultingStatus = TASK_STATES.VISITED;
          userFeedback = "Bağlantıyı ziyaret ettin ancak işlem henüz doğrulanmadı.";
          break;
      }

      // Veritabanı kaydı (Oluştur veya güncelle)
      if (existingSubmission) {
        existingSubmission.status = resultingStatus;
        existingSubmission.strategy = strategy;
        existingSubmission.proof = proof ? String(proof).trim() : (existingSubmission.proof || '');
        existingSubmission.ticketsAwarded = isVerifiedNow ? ticketsCanAward : 0;
        if (isVerifiedNow) {
          existingSubmission.verifiedAt = new Date();
          existingSubmission.verifiedBy = 'auto-strategy';
        }
        existingSubmission.save();
      } else {
        existingSubmission = giveawayEntryTasks.create({
          giveawayId,
          taskId,
          userId,
          status: resultingStatus,
          strategy,
          proof: proof ? String(proof).trim() : '',
          ticketsAwarded: isVerifiedNow ? ticketsCanAward : 0,
          verifiedAt: isVerifiedNow ? new Date() : null,
          verifiedBy: isVerifiedNow ? 'auto-strategy' : null,
          createdAt: new Date()
        });
      }

      // Bilet tanımlama (Yalnızca gerçek VERIFIED durumunda)
      if (isVerifiedNow && ticketsCanAward > 0) {
        entry.tickets = currentTickets + ticketsCanAward;
        entry.save();

        g.totalTickets = (Number(g.totalTickets) || 0) + ticketsCanAward;
        g.save();

        // Referral şartını kontrol et (Davet eden kişiye bonus verilsin mi?)
        this._checkAndAwardReferralBonus(giveawayId, userId);
      }

      return {
        success: true,
        status: resultingStatus,
        ticketsAwarded: isVerifiedNow ? ticketsCanAward : 0,
        totalTickets: entry.tickets,
        ticketCount: entry.tickets,
        message: userFeedback
      };
    } finally {
      this._taskSubmitLocks.delete(lockKey);
    }
  }

  _inferTaskStrategy(task) {
    if (task.platform === 'website' || task.actionType === 'verify_account') {
      return VERIFICATION_STRATEGIES.AUTO;
    }
    if (task.platform === 'discord') {
      return VERIFICATION_STRATEGIES.API;
    }
    if (task.actionType === 'comment') {
      return VERIFICATION_STRATEGIES.PROOF_REQUIRED;
    }
    return VERIFICATION_STRATEGIES.VISIT_ONLY;
  }

  // ─── KAZANAN SEÇİMİ (ÖLÇEKLENEBİLİR WEIGHTED RANDOM & TRANSACTIONAL LOCK) ───

  /**
   * Kriptografik Ağırlıklı Rastgele Seçim (Scalable Weighted Random Selection)
   * Zaman Karmaşıklığı: O(N), Bellek Karmaşıklığı: O(1)
   * Asla milyon elemanlı array push yapmaz.
   */
  _pickWeightedWinner(entries, totalTickets) {
    if (!entries || entries.length === 0 || totalTickets <= 0) return null;

    // crypto.randomInt ile [0, totalTickets) aralığında kriptografik rastgele integer
    const targetOffset = crypto.randomInt(0, totalTickets);
    let cumulative = 0;

    for (const entry of entries) {
      const weight = Number(entry.tickets) || 0;
      cumulative += weight;
      if (cumulative > targetOffset) {
        return entry;
      }
    }

    return entries[entries.length - 1]; // Fallback
  }

  /**
   * Kazanan Seçme İşlemi (Transaction-Safe & Multi-Winner Desteği)
   */
  async pickWinner({ giveawayId, adminUser, isRedraw = false, redrawReason = '', targetWinnerId = null }) {
    const lockKey = `draw:${giveawayId}`;
    if (this._drawLocks.has(lockKey)) {
      throw new Error("Çekiliş seçimi şu anda başka bir yönetici tarafından gerçekleştiriliyor. Lütfen bekleyin.");
    }
    this._drawLocks.add(lockKey);

    try {
      const g = giveaways.findById(giveawayId);
      if (!g) throw new Error("Çekiliş bulunamadı.");

      // Durum kontrolü
      if (!isRedraw && g.status === GIVEAWAY_STATUSES.COMPLETED) {
        throw new Error("Bu çekiliş zaten tamamlanmıştır. Yeni kazanan için 'Yeniden Çekiliş (Redraw)' yapınız.");
      }

      // Kilitle (State Machine: WINNER_SELECTING)
      const previousStatus = g.status;
      g.status = GIVEAWAY_STATUSES.WINNER_SELECTING;
      g.save();

      // Geçerli, diskalifiye edilmemiş ve en az 1 bilet sahibi katılımcıları filtrele
      const allEntries = giveawayEntries.find({ giveawayId });
      let candidatePool = allEntries.filter(e => !e.isDisqualified && e.status !== 'DISQUALIFIED' && Number(e.tickets) > 0);

      if (candidatePool.length === 0) {
        // Rollback
        g.status = previousStatus;
        g.save();
        throw new Error("Çekilişte bilet hakkına sahip geçerli katılımcı bulunamadı.");
      }

      // Redraw Durumu
      if (isRedraw) {
        if (!redrawReason || String(redrawReason).trim().length < 5) {
          g.status = previousStatus;
          g.save();
          throw new Error("Yeniden çekiliş için geçerli bir sebep belirtilmelidir (min 5 karakter).");
        }

        // Eski aktif kazananları geçersiz (INVALIDATED / REPLACED) yap
        const oldWinners = giveawayWinners.find({ giveawayId, isBackup: false });
        for (const ow of oldWinners) {
          if (!ow.isInvalidated) {
            ow.isInvalidated = true;
            ow.status = 'INVALIDATED';
            ow.invalidatedReason = redrawReason;
            ow.invalidatedAt = new Date();
            ow.invalidatedBy = adminUser?.username || 'Yönetici';
            ow.save();
          }
        }
      }

      const winnerCount = Math.max(1, Number(g.winnerCount) || 1);
      const backupCount = Math.max(0, Number(g.backupWinnerCount) || 0);

      const chosenMainWinners = [];
      const chosenBackupWinners = [];

      // 1. Asil Kazananları Seç (Benzersiz kullanıcılar)
      for (let i = 0; i < winnerCount; i++) {
        if (candidatePool.length === 0) break;
        const totalTickets = candidatePool.reduce((sum, e) => sum + (Number(e.tickets) || 0), 0);
        if (totalTickets <= 0) break;

        const winnerEntry = this._pickWeightedWinner(candidatePool, totalTickets);
        if (!winnerEntry) break;

        chosenMainWinners.push(winnerEntry);
        // Aynı kullanıcı birden fazla kez ana kazanan olamaz
        candidatePool = candidatePool.filter(e => e.userId !== winnerEntry.userId);
      }

      // 2. Yedek Kazananları Seç
      for (let i = 0; i < backupCount; i++) {
        if (candidatePool.length === 0) break;
        const totalTickets = candidatePool.reduce((sum, e) => sum + (Number(e.tickets) || 0), 0);
        if (totalTickets <= 0) break;

        const backupEntry = this._pickWeightedWinner(candidatePool, totalTickets);
        if (!backupEntry) break;

        chosenBackupWinners.push(backupEntry);
        candidatePool = candidatePool.filter(e => e.userId !== backupEntry.userId);
      }

      if (chosenMainWinners.length === 0) {
        g.status = previousStatus;
        g.save();
        throw new Error("Kazanan seçilemedi.");
      }

      const createdWinnerRecords = [];

      // Asil Kazanan Kayıtları
      for (const w of chosenMainWinners) {
        const record = giveawayWinners.create({
          giveawayId,
          userId: w.userId,
          username: w.username,
          avatar: w.avatar,
          prize: g.prize,
          ticketCount: Number(w.tickets) || 1,
          isBackup: false,
          isRedraw,
          redrawReason: isRedraw ? redrawReason : '',
          status: 'ACTIVE_WINNER',
          selectedAt: new Date(),
          selectedBy: adminUser?.username || 'Yönetici',
          proofDetails: {
            totalValidParticipants: allEntries.filter(e => !e.isDisqualified).length,
            totalValidTickets: allEntries.filter(e => !e.isDisqualified).reduce((s, e) => s + (Number(e.tickets) || 0), 0),
            winnerTicketCount: Number(w.tickets) || 1
          }
        });
        createdWinnerRecords.push(record);

        // Bildirim gönder (İdempotent)
        this.sendNotification({
          userId: w.userId,
          eventKey: `win_${giveawayId}_${record._id}`,
          title: "🏆 TEBRİKLER! ÇEKİLİŞ KAZANDINIZ!",
          message: `"${g.title}" çekilişinde ${g.prize} ödülünün kazananı oldunuz! Detaylar için çekiliş sayfasını inceleyin.`,
          type: "WINNER",
          link: `/cekilisler/${g.slug || g._id}`
        });
      }

      // Yedek Kazanan Kayıtları
      for (const b of chosenBackupWinners) {
        giveawayWinners.create({
          giveawayId,
          userId: b.userId,
          username: b.username,
          avatar: b.avatar,
          prize: `${g.prize} (Yedek)`,
          ticketCount: Number(b.tickets) || 1,
          isBackup: true,
          isRedraw,
          redrawReason: isRedraw ? redrawReason : '',
          status: 'BACKUP_WINNER',
          selectedAt: new Date(),
          selectedBy: adminUser?.username || 'Yönetici'
        });
      }

      // Çekiliş Durumunu COMPLETED yap
      g.status = GIVEAWAY_STATUSES.COMPLETED;
      g.save();

      // Audit Log
      this.logAudit({
        action: isRedraw ? 'WINNER_REDRAW' : 'WINNER_SELECT',
        giveawayId,
        performedBy: adminUser?.username || 'Yönetici',
        performedById: adminUser?.discordId || adminUser?._id,
        reason: redrawReason || 'Çekiliş kazananı belirlendi',
        details: {
          mainWinners: chosenMainWinners.map(m => ({ userId: m.userId, username: m.username, tickets: m.tickets })),
          backupWinners: chosenBackupWinners.map(b => ({ userId: b.userId, username: b.username, tickets: b.tickets })),
          isRedraw
        }
      });

      return {
        success: true,
        winners: createdWinnerRecords,
        mainWinner: createdWinnerRecords[0],
        backupCount: chosenBackupWinners.length
      };
    } finally {
      this._drawLocks.delete(lockKey);
    }
  }

  // ─── İSTATİSTİK YENİDEN HESAPLAMA (RECALCULATE STATISTICS) ────────────────

  recalculateGiveawayStats(giveawayId) {
    const g = giveaways.findById(giveawayId);
    if (!g) throw new Error("Çekiliş bulunamadı.");

    const entries = giveawayEntries.find({ giveawayId });
    const validEntries = entries.filter(e => !e.isDisqualified && e.status !== 'DISQUALIFIED');
    const totalTickets = validEntries.reduce((sum, e) => sum + (Number(e.tickets) || 0), 0);

    g.totalParticipants = validEntries.length;
    g.totalTickets = totalTickets;
    g.save();

    this.logAudit({
      action: 'ADMIN_ACTION',
      giveawayId,
      performedBy: 'System/Admin',
      reason: 'İstatistikler yeniden hesaplandı (Recalculate Stats)',
      details: {
        totalParticipants: validEntries.length,
        totalTickets
      }
    });

    return {
      success: true,
      totalParticipants: validEntries.length,
      totalTickets
    };
  }

  // ─── KAZANANLAR LİSTESİ & GİZLİLİK (PRIVACY) ──────────────────────────────

  getAllWinners() {
    return this.getWinnersList();
  }

  getWinnersList() {
    // Sadece aktif ve geçersiz kılınmamış kazananları öne çıkar
    const winners = giveawayWinners.find({}).sort((a, b) => new Date(b.selectedAt || 0) - new Date(a.selectedAt || 0));
    
    // N+1 Sorgu Optimizasyonu: Çekilişleri tek seferde map yap
    const allG = giveaways.find({});
    const giveawayMap = new Map();
    for (const g of allG) giveawayMap.set(g._id, g);

    return winners.map(w => {
      const g = giveawayMap.get(w.giveawayId);
      const uName = w.username || 'Kullanıcı';
      let masked = uName;
      if (uName.length > 3) {
        masked = uName.substring(0, 3) + '***' + (uName.length > 5 ? uName.substring(uName.length - 2) : '');
      }

      return {
        _id: w._id,
        giveawayId: w.giveawayId,
        username: masked,
        avatar: w.avatar || 'https://i.imgur.com/PFcAc6q.png',
        prize: w.prize || 'Ödül',
        ticketCount: w.ticketCount || 1,
        isBackup: Boolean(w.isBackup),
        isRedraw: Boolean(w.isRedraw),
        status: w.status || 'ACTIVE_WINNER',
        selectedAt: w.selectedAt,
        giveawayTitle: g ? g.title : 'Özel Çekiliş',
        giveawaySlug: g ? g.slug : '',
        sponsor: g ? g.sponsor : 'EkoYıldız'
      };
    });
  }

  // ─── ROZETLER / BAŞARIMLAR & PROFİL ────────────────────────────────────────

  getUserBadges(userId) {
    if (!userId) return [];
    const entries = giveawayEntries.find({ userId });
    const won = giveawayWinners.find({ userId, isBackup: false, isInvalidated: { $ne: true } });
    const tasks = giveawayEntryTasks.find({ userId, status: TASK_STATES.VERIFIED });

    const badges = [];

    if (entries.length >= 1) {
      badges.push({ id: "first_entry", name: "🎟 İlk Katılım", desc: "İlk çekilişine başarıyla katıldın.", unlocked: true, icon: "🎟️" });
    }
    if (entries.length >= 3) {
      badges.push({ id: "streak", name: "🔥 Seri Katılımcı", desc: "3 veya daha fazla çekilişe katıldın.", unlocked: true, icon: "🔥" });
    }
    if (tasks.length >= 5) {
      badges.push({ id: "task_master", name: "⚡ Görev Avcısı", desc: "5'ten fazla çekiliş görevini eksiksiz tamamladın.", unlocked: true, icon: "⚡" });
    }
    if (won.length >= 1) {
      badges.push({ id: "lucky", name: "🏆 Şanslı Kazanan", desc: "Resmi bir EkoYıldız çekilişi kazandın!", unlocked: true, icon: "🏆" });
    }

    return badges;
  }

  getUserProfileData(userId) {
    if (!userId) {
      return { stats: {}, entries: [], wonGiveaways: [], badges: [], referralCode: '' };
    }

    const entries = giveawayEntries.find({ userId });
    const userTasks = giveawayEntryTasks.find({ userId, status: TASK_STATES.VERIFIED });
    const won = giveawayWinners.find({ userId, isBackup: false, isInvalidated: { $ne: true } });
    const refRecord = giveawayEntries.find({ referredBy: userId, referralQualified: true });

    const totalTickets = entries.reduce((sum, e) => sum + (Number(e.tickets) || 0), 0);

    const allG = giveaways.find({});
    const gMap = new Map();
    for (const g of allG) gMap.set(g._id, g);

    const formattedEntries = entries.map(e => {
      const g = gMap.get(e.giveawayId);
      return {
        ...e,
        giveawayTitle: g ? g.title : 'Çekiliş',
        ticketCount: Number(e.tickets) || 0
      };
    });

    const userRef = (entries[0] && entries[0].referralCode) ? entries[0].referralCode : this._generateReferralCode(userId);
    const badges = this.getUserBadges(userId);

    return {
      stats: {
        totalEntries: entries.length,
        totalTickets,
        completedTasksCount: userTasks.length,
        referralsCount: refRecord.length
      },
      entries: formattedEntries,
      wonGiveaways: won,
      badges,
      referralCode: userRef
    };
  }

  // ─── BİLDİRİM SİSTEMİ (IDEMPOTENT) ─────────────────────────────────────────

  sendNotification({ userId, eventKey = '', title, message, type = "GIVEAWAY_START", link = "/cekilisler" }) {
    if (!userId) return null;

    if (eventKey) {
      const existing = giveawayNotifications.findOne({ userId, eventKey });
      if (existing) return existing; // Tekrar ekleme
    }

    return giveawayNotifications.create({
      userId,
      eventKey: eventKey || '',
      title,
      message,
      type,
      link,
      isRead: false,
      createdAt: new Date()
    });
  }

  getUserNotifications(userId) {
    if (!userId) return [];
    const notifs = giveawayNotifications.find({ userId });
    return notifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 15);
  }

  markNotificationAsRead(id, userId) {
    const notif = giveawayNotifications.findById(id);
    if (notif && notif.userId === userId) {
      notif.isRead = true;
      notif.save();
      return true;
    }
    return false;
  }

  // ─── AUDIT LOG ENGINE ──────────────────────────────────────────────────────

  logAudit({ action, giveawayId = '', performedBy = 'System', performedById = '', targetId = '', reason = '', details = {} }) {
    return giveawayAuditLogs.create({
      action,
      giveawayId,
      performedBy,
      performedById,
      targetId,
      reason,
      details,
      timestamp: new Date(),
      createdAt: new Date()
    });
  }

  // ─── ADMİN İSTATİSTİKLERİ ──────────────────────────────────────────────────

  getAdminStats() {
    const allGiveaways = giveaways.find({});
    const allEntries = giveawayEntries.find({});
    const allTasks = giveawayEntryTasks.find({});
    const pendingTasks = allTasks.filter(t => t.status === TASK_STATES.PENDING);
    const winners = giveawayWinners.find({ isBackup: false, isInvalidated: { $ne: true } });
    const fraud = giveawayFraudFlags.find({ isResolved: false });

    const activeCount = allGiveaways.filter(g => g.status === GIVEAWAY_STATUSES.ACTIVE).length;
    const validEntries = allEntries.filter(e => !e.isDisqualified && e.status !== 'DISQUALIFIED');
    const totalValidTickets = validEntries.reduce((sum, e) => sum + (Number(e.tickets) || 0), 0);
    const totalRawTickets = allEntries.reduce((sum, e) => sum + (Number(e.tickets) || 0), 0);

    return {
      activeGiveaways: activeCount,
      totalGiveaways: allGiveaways.length,
      totalParticipants: allEntries.length,
      validParticipants: validEntries.length,
      totalTickets: totalValidTickets,
      rawTickets: totalRawTickets,
      completedTasksCount: allTasks.filter(t => t.status === TASK_STATES.VERIFIED).length,
      pendingVerificationsCount: pendingTasks.length,
      totalWinnersCount: winners.length,
      fraudFlagsCount: fraud.length
    };
  }

  // ─── ADMİN ÇEKİLİŞ CRUD İŞLEMLERİ ──────────────────────────────────────────

  createGiveaway(data, adminUser) {
    // Validasyon
    if (!data.title || data.title.length < 3 || data.title.length > 120) {
      throw new Error("Çekiliş başlığı 3 ile 120 karakter arasında olmalıdır.");
    }
    if (!data.prize || data.prize.length < 2) {
      throw new Error("Çekiliş ödülü zorunludur.");
    }

    const slug = this._slugify(data.slug || data.title);
    const existing = giveaways.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    let startDate = data.startDate ? new Date(data.startDate) : new Date();
    if (isNaN(startDate.getTime())) startDate = new Date();

    let endDate = data.endDate ? new Date(data.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (isNaN(endDate.getTime())) endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (endDate <= startDate) {
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const toBoolean = (value, fallback = false) => {
      if (value === undefined || value === null || value === '') return fallback;
      if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'on';
      return Boolean(value);
    };
    const requestedStatus = String(data.status || GIVEAWAY_STATUSES.ACTIVE).toUpperCase();
    const status = Object.values(GIVEAWAY_STATUSES).includes(requestedStatus)
      ? requestedStatus
      : GIVEAWAY_STATUSES.DRAFT;

    const g = giveaways.create({
      title: data.title.trim(),
      slug: finalSlug,
      description: (data.description || '').trim(),
      prize: data.prize.trim(),
      sponsor: (data.sponsor || 'EkoYıldız').trim(),
      coverImage: data.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      bannerImage: data.bannerImage || 'https://i.imgur.com/j3pnVTu.png',
      accentColor: data.accentColor || '#8b5cf6',
      status,
      isFeatured: toBoolean(data.isFeatured),
      startDate,
      endDate,
      minAccountAgeDays: Math.max(0, Number(data.minAccountAgeDays) || 0),
      maxEntriesPerUser: Math.max(1, Number(data.maxEntriesPerUser) || 50),
      winnerCount: Math.max(1, Number(data.winnerCount) || 1),
      backupWinnerCount: Math.max(0, Number(data.backupWinnerCount) || 1),
      referralEnabled: toBoolean(data.referralEnabled, true),
      referralTickets: Math.max(1, Number(data.referralTickets) || 2),
      totalParticipants: 0,
      totalTickets: 0,
      createdBy: adminUser?.username || 'Admin'
    });

    // Yönetim panelinden gelen görevleri çekilişle birlikte kalıcı olarak oluştur.
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    tasks.forEach((rawTask, index) => {
      const title = String(rawTask?.title || '').trim();
      if (title.length < 3) return;

      const strategy = Object.values(VERIFICATION_STRATEGIES).includes(rawTask.strategy)
        ? rawTask.strategy
        : VERIFICATION_STRATEGIES.VISIT_ONLY;

      let link = String(rawTask.link || '').trim();
      if (link && !link.startsWith('http://') && !link.startsWith('https://') && !link.startsWith('/') && !link.startsWith('#')) {
        link = 'https://' + link;
      }

      const platform = String(rawTask.platform || 'website').trim().toLowerCase();
      let icon = String(rawTask.icon || '').trim();
      if (!icon) {
        const platformIcons = {
          youtube: '📺',
          discord: '💬',
          instagram: '📸',
          tiktok: '🎵',
          kick: '🟢',
          twitch: '💜',
          site: '🌐',
          website: '🌐'
        };
        icon = platformIcons[platform] || '🎯';
      }

      giveawayTasks.create({
        giveawayId: g._id,
        title,
        description: String(rawTask.description || '').trim(),
        platform,
        icon,
        link: this.validateUrl(link) ? link : (link ? link : ''),
        actionType: String(rawTask.actionType || 'visit_page').trim(),
        strategy,
        tickets: Math.max(1, Number(rawTask.tickets ?? rawTask.ticketReward) || 1),
        isRequired: toBoolean(rawTask.isRequired ?? rawTask.isMandatory),
        order: index + 1
      });
    });

    // Kalıcı depolamaya anında yaz (disk sync)
    try {
      const { flushSave } = require('../../models/persistence');
      const { collections } = require('../../models/Store');
      flushSave(collections);
    } catch (saveErr) {
      logger.error?.('[GiveawayService] Instant flushSave error:', saveErr.message);
    }

    this.logAudit({
      action: 'GIVEAWAY_CREATE',
      giveawayId: g._id,
      performedBy: adminUser?.username || 'Admin',
      performedById: adminUser?.discordId || adminUser?._id,
      details: { title: g.title, slug: g.slug, prize: g.prize }
    });

    return g;
  }

  deleteGiveaway(giveawayId, adminUser) {
    const giveaway = giveaways.findById(giveawayId);
    if (!giveaway) throw new Error("Çekiliş bulunamadı.");

    giveawayTasks.remove({ giveawayId });
    giveawayEntries.remove({ giveawayId });
    giveawayEntryTasks.remove({ giveawayId });
    giveawayWinners.remove({ giveawayId });
    giveaways.deleteById(giveawayId);

    try {
      const { flushSave } = require('../../models/persistence');
      const { collections } = require('../../models/Store');
      flushSave(collections);
    } catch (_) {}

    this.logAudit({
      action: 'GIVEAWAY_DELETE',
      giveawayId,
      performedBy: adminUser?.username || 'Admin',
      details: { title: giveaway.title }
    });

    return true;
  }
}

const giveawayService = new GiveawayService();

module.exports = giveawayService;
