'use strict';

const crypto = require('crypto');
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

class GiveawayService {
  constructor() {
    this._ensureSeeded();
  }

  _slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  _generateReferralCode(userId) {
    const hash = crypto.createHash('md5').update(`${userId}-${Date.now()}-${Math.random()}`).digest('hex');
    return hash.substring(0, 8).toUpperCase();
  }

  _ensureSeeded() {
    try {
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
          status: "ACTIVE",
          isFeatured: true,
          startDate: now,
          endDate: oneWeekLater,
          minAccountAgeDays: 0,
          maxEntriesPerUser: 50,
          winnerCount: 1,
          backupWinnerCount: 2,
          referralEnabled: true,
          referralTickets: 2,
          totalParticipants: 48,
          totalTickets: 162
        });

        // Görevler
        giveawayTasks.create({
          giveawayId: g1._id,
          title: "EkoYıldız YouTube Kanalına Abone Ol",
          description: "Resmi YouTube kanalımıza abone olarak en yeni videolardan haberdar ol.",
          platform: "youtube",
          icon: "📺",
          link: "https://www.youtube.com/@eko8yildiz",
          actionType: "subscribe",
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
          tickets: 1,
          isRequired: true,
          order: 2
        });

        giveawayTasks.create({
          giveawayId: g1._id,
          title: "Son Roblox YouTube Videosuna Yorum Yap",
          description: "Son videomuza gidip kullanıcı adınla birlikte güzel bir yorum bırak.",
          platform: "youtube",
          icon: "✍️",
          link: "https://www.youtube.com/@eko8yildiz",
          actionType: "comment",
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
          tickets: 1,
          isRequired: false,
          order: 4
        });

        giveawayTasks.create({
          giveawayId: g1._id,
          title: "Arkadaşını Davet Et (Her Davet +2 Hak)",
          description: "Sana özel davet bağlantını arkadaşlarınla paylaş, her geçerli katılımda +2 çekiliş hakkı kazan!",
          platform: "invite",
          icon: "🤝",
          link: "#referral-box",
          actionType: "invite_friend",
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
          status: "SCHEDULED",
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
          description: "EkoYıldız Instagram hesabını takip et.",
          platform: "instagram",
          icon: "📸",
          link: "https://instagram.com",
          actionType: "visit_page",
          tickets: 1,
          isRequired: true,
          order: 1
        });

        // 3. Tamamlanan Çekiliş (COMPLETED / Arşiv & Kazananlar)
        const g3 = giveaways.create({
          title: "Blox Fruits Kalıcı (Perm) Meyve Çekilişi",
          slug: "blox-fruits-kalici-meyve-cekilisi",
          description: "Roblox Blox Fruits efsanevi kalıcı meyve çekilişi tamamlandı.",
          prize: "Kalıcı Kitsune & Leopard",
          sponsor: "RobloxLand Market",
          coverImage: "https://i.imgur.com/PFcAc6q.png",
          bannerImage: "https://i.imgur.com/j3pnVTu.png",
          accentColor: "#10b981",
          status: "COMPLETED",
          isFeatured: false,
          startDate: lastWeek,
          endDate: yesterday,
          minAccountAgeDays: 0,
          maxEntriesPerUser: 30,
          winnerCount: 1,
          backupWinnerCount: 1,
          referralEnabled: true,
          referralTickets: 2,
          totalParticipants: 184,
          totalTickets: 612
        });

        giveawayWinners.create({
          giveawayId: g3._id,
          userId: "sample_winner_123",
          username: "Berk***34",
          avatar: "https://i.imgur.com/PFcAc6q.png",
          prize: "Kalıcı Kitsune & Leopard",
          ticketCount: 6,
          isBackup: false,
          isRedraw: false,
          selectedAt: yesterday,
          selectedBy: "ekonqt (Admin)"
        });
      }
    } catch (err) {
      console.error('[GiveawayService] Seed hatası:', err.message);
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
    const now = new Date();

    // Otomatik durum güncellemesi (süresi dolanları ENDED yap)
    for (const g of all) {
      if (g.status === 'ACTIVE' && g.endDate && new Date(g.endDate) < now) {
        g.status = 'ENDED';
        g.save();
      } else if (g.status === 'SCHEDULED' && g.startDate && new Date(g.startDate) <= now) {
        g.status = 'ACTIVE';
        g.save();
      }
    }

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
    return giveaways.findById(id);
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
        referredBy: refCode || '',
        ip: ip,
        ipAddress: ip,
        userAgent: userAgent,
        isDisqualified: false,
        disqualifyReason: ''
      });

      // Çekiliş sayaç güncelle
      const g = giveaways.findById(giveawayId);
      if (g) {
        g.totalParticipants = (Number(g.totalParticipants) || 0) + 1;
        g.save();
      }

      // Referral kontrolü (Başkası davet ettiyse)
      if (refCode && refCode !== code) {
        this._processReferralBonus(giveawayId, refCode, entry);
      }
    }
    return entry;
  }

  _processReferralBonus(giveawayId, refCode, newEntry) {
    try {
      const inviterEntry = giveawayEntries.findOne({ giveawayId, referralCode: refCode }) || giveawayEntries.findOne({ referralCode: refCode });
      if (!inviterEntry || inviterEntry.userId === newEntry.userId) return;

      newEntry.referredBy = inviterEntry.userId;
      newEntry.save();

      // Anti-Abuse: Aynı IP kontrolü
      const ip = newEntry.ip || newEntry.ipAddress || '';
      const inviterIp = inviterEntry.ip || inviterEntry.ipAddress || '';
      if (inviterIp && ip && inviterIp === ip) {
        giveawayFraudFlags.create({
          giveawayId,
          userId: newEntry.userId,
          username: newEntry.username,
          reason: "SAME_IP_REFERRAL_ATTEMPT",
          ip: ip,
          ipAddress: ip,
          severity: "MEDIUM",
          isResolved: false,
          createdAt: new Date(),
          timestamp: new Date()
        });
        return;
      }

      const g = giveaways.findById(giveawayId);
      const bonusTickets = (g && Number(g.referralTickets)) || 2;

      inviterEntry.tickets = (Number(inviterEntry.tickets) || 0) + bonusTickets;
      inviterEntry.save();

      if (g) {
        g.totalTickets = (Number(g.totalTickets) || 0) + bonusTickets;
        g.save();
      }

      this.sendNotification({
        userId: inviterEntry.userId,
        title: "🤝 Arkadaş Davet Bonusu!",
        message: `${newEntry.username} davet bağlantınla çekilişe katıldı! +${bonusTickets} çekiliş hakkı kazandın.`,
        type: "GIVEAWAY_START",
        link: `/cekilisler/${g ? g.slug : ''}`
      });
    } catch (err) {
      console.error('[GiveawayService] Referral bonus hatası:', err.message);
    }
  }

  getUserCompletedTasks(giveawayId, userId) {
    if (!userId) return [];
    return giveawayEntryTasks.find({ giveawayId, userId });
  }

  submitTask({ giveawayId, taskId, user, proof = '', ip = '', userAgent = '', referralCode = '' }) {
    if (!user) throw new Error("Giriş yapmalısınız.");
    const userId = user.discordId || String(user._id);

    const g = giveaways.findById(giveawayId);
    if (!g || g.status !== 'ACTIVE') {
      throw new Error("Bu çekiliş şu anda aktif değil.");
    }

    const task = giveawayTasks.findById(taskId);
    if (!task) throw new Error("Görev bulunamadı.");

    let entry = this.getOrCreateUserEntry(giveawayId, user, ip, userAgent, referralCode);
    if (entry.isDisqualified) {
      throw new Error("Hesabınız bu çekiliş için kısıtlanmıştır.");
    }

    const existingSubmission = giveawayEntryTasks.findOne({ giveawayId, taskId, userId });
    if (existingSubmission && (existingSubmission.status === 'VERIFIED' || existingSubmission.status === 'PENDING')) {
      return { status: existingSubmission.status, message: "Bu görev zaten tamamlandı veya onay bekliyor." };
    }

    // Doğrulama mekanizması:
    // Web sitesi ziyareti, hesap doğrulama veya Discord entegrasyonu anında VERIFIED sayılır;
    // Özel yorum veya dış linkler opsiyonel olarak doğrudan veya kontrole tabi tutulur.
    let status = 'VERIFIED';
    if (task.actionType === 'comment' && !proof) {
      status = 'PENDING';
    }

    const ticketsAwarded = Number(task.tickets) || 1;

    const submission = giveawayEntryTasks.create({
      giveawayId,
      taskId,
      userId,
      status,
      proof: proof || '',
      ticketsAwarded: status === 'VERIFIED' ? ticketsAwarded : 0,
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
      verifiedBy: status === 'VERIFIED' ? 'auto' : null,
      createdAt: new Date()
    });

    if (status === 'VERIFIED') {
      entry.tickets = (Number(entry.tickets) || 0) + ticketsAwarded;
      entry.save();

      g.totalTickets = (Number(g.totalTickets) || 0) + ticketsAwarded;
      g.save();
    }

    return {
      success: true,
      status,
      ticketsAwarded: status === 'VERIFIED' ? ticketsAwarded : 0,
      totalTickets: entry.tickets,
      ticketCount: entry.tickets,
      message: status === 'VERIFIED' 
        ? `🎉 Tebrikler! Görev doğrulandı ve +${ticketsAwarded} çekiliş hakkı kazandınız!` 
        : `⏳ Göreviniz incelemeye alındı. Kontrol edildikten sonra haklarınız yüklenecektir.`
    };
  }

  // ─── KAZANAN SEÇİMİ & AUDIT LOG ──────────────────────────────────────────

  pickWinner({ giveawayId, adminUser, isRedraw = false, reason = '' }) {
    const g = giveaways.findById(giveawayId);
    if (!g) throw new Error("Çekiliş bulunamadı.");

    const entries = giveawayEntries.find({ giveawayId }).filter(e => !e.isDisqualified && Number(e.tickets) > 0);
    if (!entries || entries.length === 0) {
      throw new Error("Geçerli ve bilet hakkına sahip katılımcı bulunamadı.");
    }

    // Ağırlıklı ticket havuzu oluştur
    const ticketPool = [];
    for (const e of entries) {
      const count = Number(e.tickets) || 1;
      for (let i = 0; i < count; i++) {
        ticketPool.push(e);
      }
    }

    if (ticketPool.length === 0) {
      throw new Error("Bilet havuzu boş.");
    }

    // Kriptografik güvenli rastgele sayı seçimi
    const randomIdx = crypto.randomInt(0, ticketPool.length);
    const winnerEntry = ticketPool[randomIdx];

    // Kazanan kaydet
    const winnerRecord = giveawayWinners.create({
      giveawayId,
      userId: winnerEntry.userId,
      username: winnerEntry.username,
      avatar: winnerEntry.avatar,
      prize: g.prize,
      ticketCount: winnerEntry.tickets,
      isBackup: false,
      isRedraw,
      selectedAt: new Date(),
      selectedBy: adminUser?.username || 'Yönetici',
      proofDetails: {
        totalParticipants: entries.length,
        totalTickets: ticketPool.length,
        winnerTicketCount: winnerEntry.tickets,
        winProbability: ((winnerEntry.tickets / ticketPool.length) * 100).toFixed(2) + '%',
        redrawReason: reason || ''
      }
    });

    // Çekiliş durumunu güncelle
    g.status = 'COMPLETED';
    g.save();

    // Audit Log
    giveawayAuditLogs.create({
      action: isRedraw ? 'REDRAW_WINNER' : 'WINNER_SELECTED',
      giveawayId,
      performedBy: adminUser?.username || 'Yönetici',
      details: {
        winnerId: winnerEntry.userId,
        winnerUsername: winnerEntry.username,
        ticketCount: winnerEntry.tickets,
        totalPool: ticketPool.length,
        reason
      },
      createdAt: new Date(),
      timestamp: new Date()
    });

    // Kazanan kullanıcıya bildirim gönder
    this.sendNotification({
      userId: winnerEntry.userId,
      title: "🏆 TEBRİKLER, ÇEKİLİŞ KAZANDINIZ!",
      message: `Tebrikler! "${g.title}" çekilişinde ${g.prize} ödülünü kazandınız! Yetkililer en kısa sürede sizinle iletişime geçecektir.`,
      type: "WINNER",
      link: `/cekilisler/${g.slug}`
    });

    return {
      success: true,
      winner: winnerRecord,
      userId: winnerRecord.userId,
      username: winnerRecord.username,
      ticketCount: winnerRecord.ticketCount,
      totalParticipants: entries.length,
      totalTickets: ticketPool.length
    };
  }

  getAllWinners() {
    return this.getWinnersList();
  }

  getWinnersList() {
    const winners = giveawayWinners.find({}).sort((a, b) => new Date(b.selectedAt || 0) - new Date(a.selectedAt || 0));
    return winners.map(w => {
      const g = giveaways.findById(w.giveawayId);
      // Gizlilik ayarı: Kullanıcı adını kısmen maskele (örn: ali***34)
      const uName = w.username || 'Kullanıcı';
      let masked = uName;
      if (uName.length > 4) {
        masked = uName.substring(0, 3) + '***' + uName.substring(uName.length - 2);
      }
      return {
        ...w,
        maskedUsername: masked,
        giveawayTitle: g ? g.title : 'Özel Çekiliş',
        giveawaySlug: g ? g.slug : '',
        sponsor: g ? g.sponsor : 'EkoYıldız'
      };
    });
  }

  // ─── ROZETLER / BAŞARIMLAR ─────────────────────────────────────────────────

  getUserBadges(userId) {
    if (!userId) return [];
    const entries = giveawayEntries.find({ userId });
    const won = giveawayWinners.find({ userId });
    const tasks = giveawayEntryTasks.find({ userId, status: 'VERIFIED' });

    const badges = [];

    // 1. İlk Katılım
    if (entries.length >= 1) {
      badges.push({
        id: "first_entry",
        name: "🎟 İlk Katılım",
        desc: "İlk çekilişine başarıyla katıldın.",
        unlocked: true,
        icon: "🎟️"
      });
    }

    // 2. Seri Katılımcı
    if (entries.length >= 3) {
      badges.push({
        id: "streak",
        name: "🔥 Seri Katılımcı",
        desc: "3 veya daha fazla farklı çekilişe katıldın.",
        unlocked: true,
        icon: "🔥"
      });
    }

    // 3. Görev Ustası
    if (tasks.length >= 5) {
      badges.push({
        id: "task_master",
        name: "⚡ Görev Avcısı",
        desc: "5'ten fazla çekiliş görevini eksiksiz tamamladın.",
        unlocked: true,
        icon: "⚡"
      });
    }

    // 4. Şanslı Kazanan
    if (won.length >= 1) {
      badges.push({
        id: "lucky",
        name: "🏆 Şanslı Kazanan",
        desc: "Resmi bir EkoYıldız çekilişi kazandın!",
        unlocked: true,
        icon: "🏆"
      });
    }

    return badges;
  }

  getUserProfileData(userId) {
    if (!userId) {
      return { stats: {}, entries: [], wonGiveaways: [], badges: [], referralCode: '' };
    }

    const entries = giveawayEntries.find({ userId });
    const userTasks = giveawayEntryTasks.find({ userId, status: 'VERIFIED' });
    const won = giveawayWinners.find({ userId });
    const refRecord = giveawayEntries.find({ referredBy: userId });

    const totalTickets = entries.reduce((sum, e) => sum + (Number(e.tickets) || 0), 0);

    const formattedEntries = entries.map(e => {
      const g = giveaways.findById(e.giveawayId);
      return {
        ...e,
        giveawayTitle: g ? g.title : 'Çekiliş',
        ticketCount: Number(e.tickets) || 1
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

  // ─── BİLDİRİM SİSTEMİ ──────────────────────────────────────────────────────

  sendNotification({ userId, title, message, type = "GIVEAWAY_START", link = "/cekilisler" }) {
    if (!userId) return null;
    return giveawayNotifications.create({
      userId,
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

  // ─── ADMİN İSTATİSTİKLERİ ──────────────────────────────────────────────────

  getAdminStats() {
    const allGiveaways = giveaways.find({});
    const allEntries = giveawayEntries.find({});
    const allTasks = giveawayEntryTasks.find({});
    const pendingTasks = allTasks.filter(t => t.status === 'PENDING');
    const winners = giveawayWinners.find({});
    const fraud = giveawayFraudFlags.find({});

    const activeCount = allGiveaways.filter(g => g.status === 'ACTIVE').length;
    const totalTickets = allEntries.reduce((sum, e) => sum + (Number(e.tickets) || 0), 0);

    return {
      activeGiveaways: activeCount,
      totalGiveaways: allGiveaways.length,
      totalParticipants: allEntries.length,
      totalTickets,
      completedTasksCount: allTasks.filter(t => t.status === 'VERIFIED').length,
      pendingVerificationsCount: pendingTasks.length,
      totalWinnersCount: winners.length,
      fraudFlagsCount: fraud.length
    };
  }
}

const giveawayService = new GiveawayService();

module.exports = giveawayService;
