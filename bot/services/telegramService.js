'use strict';

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "";
let cachedChatId = process.env.TELEGRAM_CHAT_ID || "";

const recentMessages = []; // Timestamps of recent messages

// Instance lock management
const LOCK_FILE = path.join(__dirname, "../../data/.telegram_polling.lock");
const LOCK_TIMEOUT = 30000; // 30 seconds - if lock is older than this, assume process died

function createLockFile() {
  try {
    if (!fs.existsSync(path.dirname(LOCK_FILE))) {
      fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
    }
    fs.writeFileSync(LOCK_FILE, JSON.stringify({
      pid: process.pid,
      timestamp: Date.now(),
      instance: process.env.INSTANCE_ID || "default"
    }, null, 2));
    console.log("[Telegram Polling] Lock dosyası oluşturuldu (PID: " + process.pid + ")");
    return true;
  } catch (err) {
    console.error("[Telegram Polling] Lock dosyası oluşturulamadı:", err.message);
    return false;
  }
}

function updateLockFile() {
  try {
    fs.writeFileSync(LOCK_FILE, JSON.stringify({
      pid: process.pid,
      timestamp: Date.now(),
      instance: process.env.INSTANCE_ID || "default"
    }, null, 2));
  } catch (err) {
    console.error("[Telegram Polling] Lock dosyası güncellenemedi:", err.message);
  }
}

function isLockValid() {
  try {
    if (!fs.existsSync(LOCK_FILE)) {
      return false;
    }
    const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, "utf-8"));
    const age = Date.now() - lockData.timestamp;
    
    // If lock is older than timeout, consider it stale
    if (age > LOCK_TIMEOUT) {
      console.log("[Telegram Polling] Eski lock dosyası tespit edildi, üzerine yazılıyor...");
      return false;
    }
    
    // If lock is from same PID, it's still valid
    if (lockData.pid === process.pid) {
      return true;
    }

    // Yeniden başlatmada eski (ölmüş) sürecin kilidi kalırsa polling sessizce kapanıyordu.
    try {
      process.kill(lockData.pid, 0);
    } catch (e) {
      if (e.code === "ESRCH") {
        console.log(`[Telegram Polling] Kilit sahibi süreç (PID: ${lockData.pid}) çalışmıyor, kilit devralınıyor.`);
        return false;
      }
    }

    console.warn(`[Telegram Polling] ⚠️ BAŞKA BİR ÖRNEK ZATEN ÇOK GÜÇLÜDENİCİ! PID: ${lockData.pid}, Örnek: ${lockData.instance}`);
    return true;
  } catch (err) {
    console.error("[Telegram Polling] Lock dosyası okunamadı:", err.message);
    return false;
  }
}

function removeLockFile() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log("[Telegram Polling] Lock dosyası silindi");
    }
  } catch (err) {
    console.error("[Telegram Polling] Lock dosyası silinemedi:", err.message);
  }
}

function recordMessage() {
  recentMessages.push(Date.now());
}

function getRecentMessageCount() {
  const limit = Date.now() - 10 * 60 * 1000; // last 10 minutes
  // Clean up older timestamps
  while (recentMessages.length > 0 && recentMessages[0] < limit) {
    recentMessages.shift();
  }
  return recentMessages.length;
}

/**
 * Dinamik olarak /getUpdates endpointinden en son mesaj yazan chat ID'sini çeker ve kaydeder.
 */
async function getTelegramChatId() {
  if (cachedChatId) return cachedChatId;
  try {
    const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`);
    const updates = response.data?.result || [];
    // En yeni güncellemeden eskiye doğru tara
    for (const update of [...updates].reverse()) {
      if (update.message?.chat?.id) {
        cachedChatId = update.message.chat.id;
        console.log(`[Telegram] Dinamik chat ID bulundu: ${cachedChatId}`);
        return cachedChatId;
      }
    }
  } catch (err) {
    if (err.response?.status === 409) {
      console.warn("[Telegram] Chat ID sorgulanırken 409 çakışması algılandı, webhook siliniyor...");
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook?drop_pending_updates=true`).catch(() => {});
    } else {
      console.error("[Telegram] Updates çekilirken hata oluştu:", err.message);
    }
  }
  return null;
}

/**
 * Belirtilen HTML formatındaki mesajı Telegram sahibine gönderir.
 * @param {string} text - Gönderilecek HTML formatındaki mesaj içeriği
 */
async function sendTelegramAlert(text) {
  if (!TELEGRAM_TOKEN) {
    console.warn("[Telegram] Token yapılandırılmamış.");
    return false;
  }

  const chatId = await getTelegramChatId();
  if (!chatId) {
    console.warn("[Telegram] Gönderim başarısız: Aktif chat ID bulunamadı. Lütfen önce Telegram botunuza (/start) mesajı gönderin.");
    return false;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    });
    console.log(`[Telegram] Bildirim başarıyla gönderildi. Chat ID: ${chatId}`);
    return true;
  } catch (err) {
    console.error("[Telegram] Mesaj gönderim hatası:", err.response?.data || err.message);
    return false;
  }
}

let lastUpdateId = 0;
let isPollingActive = false;

async function buildServerContext(client) {
  const context = {
    // Bot sistem bilgileri
    botUptimeSec: Math.floor(process.uptime()),
    botRamMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    nodeVersion: process.version,
    // Guild bilgileri
    totalGuilds: 0,
    totalMembers: 0,
    onlineMembers: 0,
    voiceMembers: 0,
    botCount: 0,
    // Üye rol dağılımı
    staffRoleCount: 0,
    bannedMembersCount: 0,
    // Kanal/aktivite
    textChannelCount: 0,
    voiceChannelCount: 0,
    activeVoiceChannels: [],
    // Chat aktivite
    recentMessages10min: getRecentMessageCount(),
    activityLevel: "Sakin",
    // Ticket
    openTickets: 0,
    closedTickets24h: 0,
    pendingTickets: 0,
    // Staff
    activeStaff: 0,
    // Automod
    activeAutomodIncidents: 0,
    // İtiraz
    pendingAppeals: 0,
    totalAppealsToday: 0,
    // Abuse
    pendingAbuse: 0,
    // TrustScore
    avgTrustScore: null,
    lowTrustCount: 0,
    // Ekonomi
    totalCoinsInCirculation: 0,
    // Frog Level
    avgLevel: null,
    maxLevel: null,
    // Son yetkili hareketleri
    recentStaffActions: []
  };

  // ── Guild istatistikleri ─────────────────────────────────────────
  try {
    const MAIN_GUILD_ID = "1367646464804655104";
    const guild = client.guilds.cache.get(MAIN_GUILD_ID) || client.guilds.cache.first();
    if (guild) {
      // Üye çekimi için fetch
      const members = guild.members.cache;
      context.totalGuilds = client.guilds.cache.size;
      context.totalMembers = guild.memberCount || members.size;
      context.botCount = members.filter(m => m.user.bot).size;

      // Çevrimiçi üyeler (presence cache'den)
      context.onlineMembers = members.filter(m => {
        const s = m.presence?.status;
        return s === "online" || s === "idle" || s === "dnd";
      }).size;

      // Voice üyeler
      const voiceMembers = members.filter(m => m.voice.channel);
      context.voiceMembers = voiceMembers.size;

      // Aktif voice kanalları
      const voiceMap = new Map();
      voiceMembers.forEach(m => {
        const ch = m.voice.channel;
        if (ch) {
          if (!voiceMap.has(ch.id)) voiceMap.set(ch.id, { name: ch.name, count: 0 });
          voiceMap.get(ch.id).count++;
        }
      });
      context.activeVoiceChannels = [...voiceMap.values()]
        .filter(v => v.count > 0)
        .map(v => `#${v.name} (${v.count} kişi)`);

      // Kanal sayıları
      context.textChannelCount = guild.channels.cache.filter(c => c.type === 0).size;
      context.voiceChannelCount = guild.channels.cache.filter(c => c.type === 2).size;

      // Staff rol sayısı (STAFF_ROLE_ID veya "yetkili" içeren roller)
      const staffRoles = guild.roles.cache.filter(r =>
        r.name.toLowerCase().includes("yetkili") ||
        r.name.toLowerCase().includes("moderatör") ||
        r.name.toLowerCase().includes("admin") ||
        r.name.toLowerCase().includes("kurucu")
      );
      staffRoles.forEach(r => { context.staffRoleCount += r.members.size; });

      // Aktivite seviyesi
      const rm = context.recentMessages10min;
      const vm = context.voiceMembers;
      if (rm > 50 || vm > 10) context.activityLevel = "Çok Aktif 🔥";
      else if (rm > 15 || vm > 3) context.activityLevel = "Orta Aktif ⚡";
      else if (rm > 3 || vm > 0) context.activityLevel = "Düşük Aktif 🌙";
      else context.activityLevel = "Sakin / Sessiz 😴";

      // Son 5 audit log hareketi (ban/kick/timeout)
      try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 5, type: 22 /* MEMBER_BAN_ADD */ }).catch(() => null);
        if (auditLogs) {
          context.recentStaffActions = auditLogs.entries.map(entry =>
            `${entry.executor?.tag || "Bilinmeyen"} → ${entry.target?.tag || entry.targetId} (Ban, ${new Date(entry.createdTimestamp).toLocaleTimeString("tr-TR")})`
          );
        }
      } catch (_) {}
    }
  } catch (_) {}

  // ── Ticket istatistikleri ────────────────────────────────────────
  try {
    const Ticket = require("../../models/Ticket");
    const [openCount, closedCount, pendingCount] = await Promise.all([
      Ticket.countDocuments({ status: "open" }).catch(() => 0),
      Ticket.countDocuments({ status: "closed", updatedAt: { $gte: new Date(Date.now() - 86400000) } }).catch(() => 0),
      Ticket.countDocuments({ status: "pending" }).catch(() => 0)
    ]);
    context.openTickets = openCount;
    context.closedTickets24h = closedCount;
    context.pendingTickets = pendingCount;
  } catch (_) {}

  // ── Staff istatistikleri ─────────────────────────────────────────
  try {
    const StaffProgress = require("../../models/StaffProgress");
    context.activeStaff = await StaffProgress.countDocuments({ status: "active" }).catch(() => 0);
  } catch (_) {}

  // ── Automod incidents ────────────────────────────────────────────
  try {
    const { getAutomodIncident } = require("./profanityAutomodService");
    // Mevcut fonksiyon tek ID ile çalışıyor; automodIncidents map'ini doğrudan erişemeyiz
    // Yerine son 24 saat içindeki appeal sayısına bakıyoruz
    const AutomodAppeal = require("../../models/AutomodAppeal");
    const [pendingAppeals, todayAppeals] = await Promise.all([
      AutomodAppeal.countDocuments({ status: "rejected_by_ai_pending_mod" }).catch(() => 0),
      AutomodAppeal.countDocuments({ submittedAt: { $gte: new Date(Date.now() - 86400000) } }).catch(() => 0)
    ]);
    context.pendingAppeals = pendingAppeals;
    context.totalAppealsToday = todayAppeals;
  } catch (_) {}

  // ── Abuse detector ───────────────────────────────────────────────
  try {
    const { nightModePendingBans } = require("./discordAbuseDetector");
    context.pendingAbuse = nightModePendingBans ? nightModePendingBans.size : 0;
  } catch (_) {}

  // ── TrustScore istatistikleri ────────────────────────────────────
  try {
    const UserTrustScore = require("../../models/UserTrustScore");
    const scores = await UserTrustScore.find({}, "score").lean().catch(() => []);
    if (scores.length > 0) {
      const avg = scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length;
      context.avgTrustScore = Math.round(avg);
      context.lowTrustCount = scores.filter(s => (s.score || 0) < 40).length;
    }
  } catch (_) {}

  // ── Ekonomi (toplam altın/coin) ──────────────────────────────────
  try {
    const Economy = require("../../models/Economy");
    const agg = await Economy.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]).catch(() => []);
    context.totalCoinsInCirculation = agg[0]?.total || 0;
  } catch (_) {}

  // ── Frog Level (seviye dağılımı) ─────────────────────────────────
  try {
    const FrogLevel = require("../../models/FrogLevel");
    const levels = await FrogLevel.find({}, "level").lean().catch(() => []);
    if (levels.length > 0) {
      context.avgLevel = Math.round(levels.reduce((s, l) => s + (l.level || 0), 0) / levels.length);
      context.maxLevel = Math.max(...levels.map(l => l.level || 0));
    }
  } catch (_) {}

  return context;
}

async function handleTelegramMessage(client, message) {
  // Fotoğraf/dosya açıklamaları da mesaj olarak işlensin
  const text = (message.text || message.caption || "").trim();
  const chatId = message.chat.id;
  
  if (!text) return;
  
  if (!cachedChatId) {
    cachedChatId = chatId;
    console.log(`[Telegram] İlk chat ID önbelleğe alındı: ${cachedChatId}`);
  }
  
  if (cachedChatId && String(chatId) !== String(cachedChatId)) {
    console.log(`[Telegram Chat] Yetkisiz chat ID yoksayıldı: ${chatId}`);
    return;
  }
  
  console.log(`[Telegram Chat] Mesaj alındı: "${text}"`);
  
  // ── EKOai Destek Bileti Yönetici Köprüsü ─────────────────────────
  try {
    const { handleEkoTelegramBridge } = require("./ekoAITicketService");
    const bridgeHandled = await handleEkoTelegramBridge(client, text, message);
    if (bridgeHandled) return;
  } catch (bridgeErr) {
    console.warn(`[Telegram Chat] EKOai köprü kontrol hatası:`, bridgeErr.message);
  }
  
  try {
    // ── Kapsamlı sunucu bağlamını topla ──────────────────────────
    const ctx = await buildServerContext(client);

    const uptimeHours = Math.floor(ctx.botUptimeSec / 3600);
    const uptimeMins  = Math.floor((ctx.botUptimeSec % 3600) / 60);
    const uptimeStr   = `${uptimeHours}s ${uptimeMins}dk`;

    const abuseDesc = ctx.pendingAbuse > 0
      ? `🚨 DİKKAT: ${ctx.pendingAbuse} aktif şüpheli işlem / abuse tespit edildi!`
      : "✅ Şu an herhangi bir abuse şüphesi yok.";

    const systemPrompt = `Sen EkoYıldız Discord Sunucusu ve Sentara Bot'un baş yönetim yapay zeka asistanısın (EKOai).
Bu konuşma Telegram üzerinden yetkili sunucu sahibi "Eko" ile yapılmaktadır.
Aşağıda sana sunucunun GERÇEK ZAMANLI, kapsamlı performans ve durum raporları verilmiştir.
Bu verilere dayanarak yöneticinin her türlü sorusunu (performans, aktiflik, güvenlik, ekonomi, moderasyon, istatistik vb.) eksiksiz, profesyonel ve net şekilde yanıtla.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 BOT SİSTEM DURUMU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Uptime: ${uptimeStr}
• RAM Kullanımı: ${ctx.botRamMB} MB
• Node.js: ${ctx.nodeVersion}
• Bağlı Sunucu Sayısı: ${ctx.totalGuilds}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 ÜYE & AKTİFLİK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Toplam Üye: ${ctx.totalMembers} (${ctx.botCount} bot)
• Çevrimiçi (online/idle/dnd): ${ctx.onlineMembers}
• Ses Kanalında: ${ctx.voiceMembers} üye
• Son 10 Dk Mesaj: ${ctx.recentMessages10min}
• Genel Aktiflik: ${ctx.activityLevel}
${ctx.activeVoiceChannels.length > 0 ? `• Aktif Ses Kanalları: ${ctx.activeVoiceChannels.join(" | ")}` : "• Aktif Ses Kanalı Yok"}
• Metin Kanalı: ${ctx.textChannelCount} | Ses Kanalı: ${ctx.voiceChannelCount}
• Yetkili Rol Üyesi (Toplam): ${ctx.staffRoleCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 DESTEK & OPERASYON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Açık Ticket: ${ctx.openTickets}
• Bekleyen Ticket: ${ctx.pendingTickets}
• Son 24s Kapatılan Ticket: ${ctx.closedTickets24h}
• Aktif Staff Sayısı: ${ctx.activeStaff}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ AUTOMOD & İTİRAZ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Bekleyen İtiraz (Yetkili Onayı): ${ctx.pendingAppeals}
• Bugün Toplam İtiraz: ${ctx.totalAppealsToday}
• Abuse/Şüpheli: ${abuseDesc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ GÜVENİLİRLİK & TOPLULUK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Ortalama Trust Score: ${ctx.avgTrustScore !== null ? ctx.avgTrustScore + "/100" : "Veri yok"}
• Düşük Trust Scoreli Üye (<40): ${ctx.lowTrustCount}
• Ortalama Frog Level: ${ctx.avgLevel !== null ? ctx.avgLevel : "Veri yok"}
• En Yüksek Frog Level: ${ctx.maxLevel !== null ? ctx.maxLevel : "Veri yok"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 EKONOMİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Dolaşımdaki Toplam Altın: ${ctx.totalCoinsInCirculation.toLocaleString("tr-TR")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SON YETKİLİ HAREKETLERİ (Ban)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${ctx.recentStaffActions.length > 0 ? ctx.recentStaffActions.join("\n") : "Son 5 ban hareketi yok."}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kurallar:
- Türkçe yanıt ver, emoji kullan.
- Yöneticinin sorusunu yukarıdaki gerçek zamanlı veriler doğrultusunda net ve detaylı yanıtla.
- Eğer veri "Veri yok" veya 0 ise bunu dürüstçe belirt ama varsa yorumunu ekle.
- İstenen konuya odaklan; tüm istatistikleri sayma, sadece sorulana odaklan.`;

    const { chatWithAI } = require("./aiService");
    const response = await chatWithAI([{ role: "user", content: text }], systemPrompt);
    
    await sendTelegramAlert(response);
    console.log(`[Telegram Chat] EKOai yanıtı gönderildi.`);
  } catch (err) {
    console.error("[Telegram Chat] AI Hata:", err.message);
    await sendTelegramAlert(`❌ Yapay zeka yanıt verirken hata oluştu: ${err.message}`);
  }
}

let consecutive409s = 0;
let pollingTimeout = null;
let isAttemptingRecovery = false;

async function startTelegramPolling(client) {
  if (isPollingActive) return;
  
  const pollingEnabled = String(process.env.TELEGRAM_POLLING_ENABLED || 'true').trim().toLowerCase() !== "false";
  if (!pollingEnabled) {
    console.log("[Telegram Polling] Telegram polling .env veya ortam değişkenleri üzerinden devre dışı bırakıldı.");
    return;
  }

  if (!TELEGRAM_TOKEN) {
    console.warn("[Telegram Polling] Token yapılandırılmamış, polling başlatılmadı.");
    return;
  }
  
  // Check if another instance is already polling
  if (isLockValid() && process.pid.toString() !== (function() {
    try {
      const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, "utf-8"));
      return lockData.pid.toString();
    } catch { return process.pid.toString(); }
  })()) {
    console.error("❌ [Telegram Polling] BAŞKA BİR ÖRNEK ZATEN POLLİNG YAPIYOR!");
    console.error("❌ Telegram Polling DEVRE DIŞI BIRAKILDI.");
    console.error("💡 İpucu: Eğer bu bot yerel geliştirmede çalışıyorsa ve üretim sunucusunda başka bir örnek varsa, .env dosyasına TELEGRAM_POLLING_ENABLED=false ekleyebilirsiniz.");
    return;
  }
  
  isPollingActive = true;
  
  // Create lock file
  if (!createLockFile()) {
    console.error("❌ [Telegram Polling] Lock dosyası oluşturulamadı, polling başlatılmıyor.");
    isPollingActive = false;
    return;
  }
  
  console.log("[Telegram Polling] ✅ Polling dinleyici başlatılıyor...");

  // Delete webhook first to avoid 409 Conflict errors (keep pending updates)
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook?drop_pending_updates=false`);
    console.log("[Telegram Polling] ✅ Webhook silindi (polling aktif).");
  } catch (err) {
    console.warn("[Telegram Polling] Webhook silinirken hata:", err.message);
  }

  // Cleanup on process exit
  process.on("SIGTERM", () => removeLockFile());
  process.on("SIGINT", () => removeLockFile());

  async function poll() {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`,
        { timeout: 20000 }
      );
      
      consecutive409s = 0; // Reset counter on successful update
      isAttemptingRecovery = false;
      updateLockFile(); // Keep lock fresh
      
      const updates = response.data?.result || [];
      for (const update of updates) {
        lastUpdateId = update.update_id;
        const incoming = update.message || update.edited_message || update.channel_post;
        if (incoming) {
          try {
            await handleTelegramMessage(client, incoming);
          } catch (handleErr) {
            console.error("[Telegram Polling] Mesaj işlenemedi:", handleErr.message);
          }
        }
      }
    } catch (err) {
      // Normal timeouts are ignored to avoid spamming console
      if (!err.message?.includes("timeout")) {
        if (err.response?.status === 409) {
          consecutive409s++;
          const description = err.response?.data?.description || "";
          
          if (description.toLowerCase().includes("webhook")) {
            console.warn("[Telegram Polling] ⚠️ Webhook çakışması algılandı, webhook siliniyor...");
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook?drop_pending_updates=true`).catch(() => {});
          } else {
            if (!isAttemptingRecovery) {
              console.warn(`[Telegram Polling] ⚠️ 409 Çakışma Hatası: ${description}`);
              console.warn("⚠️ Telegram botunuz başka bir yerde (örneğin başka bir terminal, sunucu veya geliştirici bilgisayarı) çalışıyor olabilir!");
              isAttemptingRecovery = true;
            }
          }

          if (consecutive409s >= 10) {
            console.error("❌ [Telegram Polling] Üst üste 10 kez çakışma (409) hatası alındı.");
            console.error("❌ Çakışmaları ve log kirliliğini önlemek amacıyla Telegram Polling bu oturum için KAPATILDI.");
            console.error("💡 Botun başka bir yerde çalışıp çalışmadığını kontrol edin. .env'den TELEGRAM_POLLING_ENABLED=false ekleyebilirsiniz.");
            // Kalıcı kapatmak yerine 5 dk sonra tekrar dene (diğer örnek kapanmış olabilir)
            console.error("⏱️ [Telegram Polling] 5 dakika sonra yeniden denenecek.");
            consecutive409s = 0;
            pollingTimeout = setTimeout(poll, 5 * 60 * 1000);
            return;
          }

          // Exponential backoff: 5s, 10s, 15s, 20s, 25s (max 25s)
          const backoffDelay = Math.min(5000 + (consecutive409s * 2500), 25000);
          console.warn(`[Telegram Polling] ⏱️ ${backoffDelay}ms içinde yeniden denenecek... (Çakışma Sayısı: ${consecutive409s}/10)`);
          pollingTimeout = setTimeout(poll, backoffDelay);
          return;
        } else {
          console.error("[Telegram Polling] Hata:", err.message);
        }
      }
    }
    // Her 3 saniyede bir yeni mesajları sorgula
    pollingTimeout = setTimeout(poll, 3000);
  }

  poll();
}

function stopTelegramPolling() {
  if (pollingTimeout) {
    clearTimeout(pollingTimeout);
    pollingTimeout = null;
  }
  removeLockFile();
  isPollingActive = false;
  console.log("[Telegram Polling] Polling durduruldu");
}

/**
 * Telegram üzerinden sesli arama başlatır (CallMeBot kullanarak)
 */
async function callTelegramUser(text) {
  const username = process.env.TELEGRAM_USERNAME || process.env.TELEGRAM_CHAT_ID || ""; // Kullanıcının Telegram kullanıcı adı veya ID'si (.env'den okunacak)
  if (!username) {
    console.warn("[Telegram Call] Arama başarısız: TELEGRAM_USERNAME tanımlanmamış.");
    return false;
  }
  try {
    const formattedUsername = (username.startsWith("@") || /^\d+$/.test(username)) ? username : `@${username}`;
    // tr-TR voice for Turkish text reading
    const url = `https://api.callmebot.com/start.php?user=${formattedUsername}&text=${encodeURIComponent(text)}&lang=tr-TR-Standard-A`;
    await axios.get(url);
    console.log(`[Telegram Call] Arama tetiklendi: ${formattedUsername}`);
    return true;
  } catch (err) {
    console.error("[Telegram Call] Arama başlatılırken hata oluştu:", err.message);
    return false;
  }
}

module.exports = { 
  sendTelegramAlert,
  recordMessage,
  startTelegramPolling,
  stopTelegramPolling,
  callTelegramUser
};
