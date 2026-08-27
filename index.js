const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

// Apply global sanitization to prevent @everyone / @here pings from bot messages
try {
  const applyDisable = require('./bot/patches/disableEveryone');
  applyDisable();
} catch (err) {
  console.error('[startup] disableEveryone patch failed:', err && err.message);
}

const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const app = require("./server/app");
const { createDiscordClient } = require("./bot/client");
const { initializeDiscordHandlers } = require("./bot/handlers");
const { registerAllCommands } = require("./bot/registerCommands");
const { PORT, BASE_URL, TOKEN } = require("./config");
const cron = require("node-cron");
const axios = require("axios");
const logger = require("./utils/logger");

// ── 7/24 Kendini İyileştirme & Çökme Önleyici (Self-Healing Crash Guard) ───
process.on("unhandledRejection", (reason, promise) => {
  const errMsg = reason instanceof Error ? reason.stack || reason.message : String(reason);
  logger.error(`[Self-Healing] Unhandled Rejection engellendi: ${errMsg}`);
});

process.on("uncaughtException", (err, origin) => {
  const errMsg = err instanceof Error ? err.stack || err.message : String(err);
  logger.error(`[Self-Healing] Uncaught Exception (${origin}) engellendi: ${errMsg}`);
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  logger.warn(`[Self-Healing Monitor] Hata yakalandı (${origin}):`, err && err.message);
});

const discordBot = createDiscordClient();

discordBot.on("debug", (info) => {
  if (typeof info === 'string') {
    if (
      info.includes('Heartbeat acknowledged') ||
      info.includes('WS => Shard') ||
      info.includes('WS => Manager') ||
      info.includes('Session Limit Information') ||
      info.includes('Fetched Gateway Information') ||
      info.includes('Failed to find guild, or unknown type for channel')
    ) {
      return;
    }
  }
  logger.info(`[Discord] ${info}`);
});
discordBot.on("warn", (info) => {
  logger.warn(`[Discord Warn] ${info}`);
});
discordBot.on("error", (err) => {
  logger.error(`[Discord Error]`, err && err.message);
});
discordBot.on("shardError", (err, shardId) => {
  logger.warn(`[Discord Shard ${shardId} Error]`, err && err.message);
});
discordBot.on("shardDisconnect", (event, shardId) => {
  logger.warn(`[Discord Shard ${shardId} Disconnected (Kod: ${event?.code})]`);
});
discordBot.on("shardReconnecting", (shardId) => {
  logger.info(`[Discord Shard ${shardId} Yeniden Bağlanıyor...]`);
});
discordBot.on("shardResume", (shardId, replayedEvents) => {
  logger.success(`[Discord Shard ${shardId} Oturum Devam Etti (${replayedEvents} olay tekrarlandı)]`);
});

const { setDiscordClient } = require("./bot/discordClient");
setDiscordClient(discordBot);
initializeDiscordHandlers(discordBot);

const discordLogger = require("./bot/services/discordLogger");
discordBot.once("ready", async () => {
  await discordLogger.init(discordBot);

  try {
    const { sendNotificationPermissionPrompt } = require("./utils/notification");
    await sendNotificationPermissionPrompt(discordBot);
  
    // --- v7.0 one-time release announcement and small reward ---
    try {
      const { appMeta } = require("./models/Store");
      const Economy = require("./models/Economy");
      const { LOG_CHANNEL_ID, EKOYILDIZ_MOD_LOG_CHANNEL_ID } = require("./config");

      const flag = appMeta.findOne({ key: "release_v7_0_announced" });
      if (!flag) {
        const channelsToNotify = [LOG_CHANNEL_ID, EKOYILDIZ_MOD_LOG_CHANNEL_ID];

        for (const chanId of channelsToNotify) {
          if (!chanId) continue;
          const ch = await discordBot.channels.fetch(chanId).catch(() => null);
          if (ch && typeof ch.send === "function") {
            try {
              const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
              const embed = new EmbedBuilder()
                .setColor(0x7c6af7)
                .setTitle('📣 Sürüm v7.0 — Yeni Özellikler ve Güncellemeler (v6.0 tarzı duyuru)')
                .setDescription('Merhaba EkoYıldız topluluğu! 🎉\nv7.0 sürümümüz yayımlandı. Bu sürümde topluluk ve moderasyon için kapsamlı yenilikler getiriyoruz — daha etkili bordro sistemi, resmi istifa süreci, vaka raporu entegrasyonu, AI destekli denetim, PIP, vardiya devir notları ve çok daha fazlası.')
                .addFields(
                  { name: '🔹 1) Dinamik Bordro & Vergi Kesintisi', value: 'Yetkili maaşları otomatik hesaplanır; disiplin durumuna göre kesintiler uygulanır.', inline: false },
                  { name: '🔹 2) Resmi İstifa & Kıdem Tazminatı', value: '3 günlük ihbar süreci, yönetim incelemesi ve kıdem tazminatı hesaplama (60+ gün).', inline: false },
                  { name: '🔹 3) Vaka Raporu ve Delil Klasörü', value: 'Otomatik `CASE-XXXX` ID, denetçi etkileşimleri ve kanıt arşivleme.', inline: false },
                  { name: '🔹 4) Vardiya Devir & AI Denetimi', value: 'Devir notları kaydedilir, AI anomali tespiti ile şüpheli durumlar raporlanır.', inline: false },
                  { name: '🔹 5) Burnout Tespiti ve Zorunlu İzin', value: 'Uzun görev yapanlara otomatik zorunlu dinlenme (kahve izni).', inline: false },
                  { name: '🔹 6) Taktik Komuta & Operasyon Masası', value: 'Canlı durum panosu ve komuta butonları ile hızlı çağrı ve ödül verme.', inline: false },
                  { name: '🔹 7) Personel 2FA', value: 'Kritik işlemler için DM üzerinden 2FA doğrulaması (5 dk geçiş).', inline: false },
                  { name: '🔹 8) PIP — Performans İyileştirme Planı', value: 'Uyarı alan personele son şans: iki kat görev hedefi ve takip.', inline: false },
                  { name: '🔹 9) Birim Lojistiği & Bütçe Yönetimi', value: 'UnitBudget ile prim dağıtımı, izin kredileri ve birim reklamları.', inline: false },
                  { name: '🔹 10) Disiplin Soruşturması & İtiraz Mahkemesi', value: 'Disiplin süreçleri şeffaf ve itiraza açık biçimde yürütülür.', inline: false }
                )
                .setFooter({ text: 'Eko Yıldız • Sürüm v7.0 — Küçük jest: +25 EkoCoin (tek seferlik)' })
                .setTimestamp();

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('Detaylı Güncelleme (Panel)').setStyle(5).setURL(`${BASE_URL}/dashboard`)
              );

              await ch.send({ embeds: [embed], components: [row] });
            } catch (err) {
              logger.error(`[Release v7.0] Channel ${chanId} send error:`, err.message);
            }
          }
        }

        // distribute small reward to staff users & send DM announcements
        try {
          const StaffProgress = require("./models/StaffProgress");
          const staffList = await StaffProgress.find({ status: "active" });

          const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
          const dmEmbed = new EmbedBuilder()
            .setColor(0x7c6af7)
            .setTitle('📣 Sürüm v7.0 — Yeni Özellikler ve Güncellemeler')
            .setDescription('Merhaba Değerli Yetkilimiz! 🎉\nv7.0 sürümümüz başarıyla yayına alındı. Bu güncelleme ile sistemimize yepyeni gerçekçi kurumsal özellikler eklendi:')
            .addFields(
              { name: '🔹 1) Dinamik Bordro & Vergi Kesintisi', value: 'Maaşlar artık haftalık aktiflik, ticket ve ses sürenize göre hesaplanıyor.', inline: false },
              { name: '🔹 2) Resmi İstifa & Kıdem Tazminatı', value: '3 günlük ihbar süresi ve kıdem tazminatı (60+ gün aktiflik) sistemi getirildi.', inline: false },
              { name: '🔹 3) Vaka Raporu ve Delil Arşivi', value: '`CASE-XXXX` ID formatında delil dosyaları ve kurul onay mekanizması.', inline: false },
              { name: '🔹 4) Vardiya Devir & AI Denetimi', value: 'Devir notları kaydediliyor ve yapay zeka ile denetleniyor.', inline: false },
              { name: '🔹 5) Mental Yorgunluk & Kahve İzni', value: 'Çok çalışan yetkililerimiz için zorunlu dinlenme ve kahve izni modu.', inline: false },
              { name: '🔹 6) Taktik Operasyon Masası', value: 'Canlı ekip paneli, nöbete çağırma telsiz duyuruları ve lider seçimi.', inline: false },
              { name: '🔹 7) Personel 2FA', value: 'Kritik sicil ve yetkili işlemlerinden önce butonlu DM doğrulaması.', inline: false },
              { name: '🔹 8) Performans İyileştirme Planı (PIP)', value: 'Hedeflerin gerisinde kalan yetkililere son şans hedefleri.', inline: false },
              { name: '🔹 9) Birim Lojistiği & Bütçe Yönetimi', value: 'Ortak havuzdan prim dağıtma ve izin kredisi satın alma.', inline: false },
              { name: '🔹 10) Disiplin Mahkemesi & İhbar Hattı', value: 'Savunma yapma hakları ve SHA-256 şifreli çift yönlü ihbar tüneli.', inline: false }
            )
            .setFooter({ text: 'Eko Yıldız • Sürüm v7.0 — Küçük jest: +25 EkoCoin (tek seferlik)' })
            .setTimestamp();

          const dmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Web Paneline Git').setStyle(5).setURL(`${BASE_URL}/dashboard`)
          );

          for (const u of staffList) {
            // Distribute reward in Economy
            try {
              let eco = await Economy.findOne({ userId: String(u.userId) });
              if (!eco) {
                eco = new Economy({ userId: String(u.userId), balance: 0, totalEarned: 0 });
              }
              eco.balance = (eco.balance || 0) + 25;
              eco.totalEarned = (eco.totalEarned || 0) + 25;
              await eco.save();
            } catch (ecoErr) {
              console.error(`Economy reward error for ${u.userId}:`, ecoErr.message);
            }

            // Send DM
            try {
              const discordUser = await discordBot.users.fetch(u.userId).catch(() => null);
              if (discordUser) {
                await discordUser.send({ embeds: [dmEmbed], components: [dmRow] }).catch(() => {});
              }
            } catch (dmErr) {
              console.warn(`Could not send release announcement DM to ${u.userId}:`, dmErr.message);
            }
          }
        } catch (err) {
          logger.error("Staff reward/announcement loop error:", err.message);
        }

        // mark announced to prevent duplicate spam on reboots
        appMeta.create({ key: "release_v7_0_announced", value: true, createdAt: new Date() });
        const { saveStoreNow } = require("./models/Store");
        saveStoreNow();
      }
    } catch (releaseErr) {
      logger.error("[Release v7.0] Announcement error:", releaseErr.message);
    }
  } catch (promptErr) {
    logger.error("[NotificationPrompt] Startup prompt error:", promptErr.message);
  }
});

// ── 7/24 Kesintisiz Çalışma: Global Çökme Önleyici (Anti-Crash) ─────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error("[7/24 Anti-Crash] Yakalanmamış Promise Reddi (unhandledRejection):", reason?.stack || reason?.message || reason);
});

process.on("uncaughtException", (err) => {
  logger.error("[7/24 Anti-Crash] Yakalanmamış İstisna (uncaughtException):", err?.stack || err?.message || err);
});

process.on("uncaughtExceptionMonitor", (err) => {
  logger.error("[7/24 Anti-Crash] İstisna Gözlemcisi:", err?.message || err);
});

// ── 7/24 Self-Ping Keep-Alive (Her 4 dakikada bir sunucuyu uyanık tut) ────────
cron.schedule("*/4 * * * *", async () => {
  try {
    const healthUrl = `${BASE_URL}/api/health`;
    await axios.get(healthUrl, { timeout: 8000 });
    logger.info(`7/24 Self-ping OK (${healthUrl})`);
  } catch (e) {
    // Alternatif endpoint dene
    try {
      await axios.get(`${BASE_URL}/`, { timeout: 8000 });
      logger.info(`7/24 Self-ping OK (fallback /)`);
    } catch (fallbackErr) {
      logger.warn("7/24 Self-ping failed:", fallbackErr.message);
    }
  }
});

async function start() {
  try {
    logger.section("BOT STARTUP");
    logger.step(`Node.js sürümü: ${process.version}`);
    logger.step(`Token hazır: ${!!TOKEN}`);

    const { initStore, saveStoreNow } = require("./models/Store");
    logger.step("Veri deposu yükleniyor...");
    const counts = await initStore();
    const { STORE_FILE } = require("./models/persistence");
    const { isMongoActive } = require("./models/db");
    const storageBackend = isMongoActive() ? "MongoDB" : `Dosya → ${STORE_FILE}`;
    logger.success(
      `Veri deposu hazır [${storageBackend}]: ${counts.users} kullanıcı, ${counts.tickets} ticket, ${counts.wikiArticles} wiki`
    );

    process.on("SIGINT", () => {
      console.log("\n[Telegram Polling] SIGINT alındı, Telegram Polling temizleniyor...");
      try {
        const { stopTelegramPolling } = require("./bot/services/telegramService");
        stopTelegramPolling();
      } catch (err) {
        console.error("[Telegram Polling] Cleanup hatası:", err.message);
      }
      saveStoreNow();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      console.log("[Telegram Polling] SIGTERM alındı, Telegram Polling temizleniyor...");
      try {
        const { stopTelegramPolling } = require("./bot/services/telegramService");
        stopTelegramPolling();
      } catch (err) {
        console.error("[Telegram Polling] Cleanup hatası:", err.message);
      }
      saveStoreNow();
      process.exit(0);
    });

    // 1. Express sunucusunu hemen başlat (Render port binding algılaması için)
    logger.section("WEB SERVER");
    app.listen(PORT, () => {
      logger.success(`Sunucu hazır: ${BASE_URL}`);
      logger.info(`Ticket sistemi port ${PORT} üzerinde dinleniyor`);
    });

    logger.section("DISCORD CONNECTION");

    const connectDiscord = async () => {
      let attempt = 0;
      let connected = false;

      while (!connected) {
        attempt++;
        try {
          logger.step(`[Discord 7/24] Bağlantı Denemesi #${attempt}...`);
          await discordBot.login(TOKEN);
          logger.success("✅ Discord bot başarıyla bağlandı ve 7/24 aktif.");
          connected = true;
          await new Promise(r => setTimeout(r, 1500));
          await registerAllCommands().catch(err => {
            logger.warn('[registerAllCommands] Komut kayıt uyarısı:', err && err.message);
          });
          return;
        } catch (err) {
          const retryAfterMs = err.retryAfter ?? err.sublimitTimeout ?? null;
          const waitMs = retryAfterMs ? (retryAfterMs + 2000) : Math.min(30000, 5000 * Math.min(attempt, 6));
          const waitSec = Math.ceil(waitMs / 1000);
          logger.warn(`[Discord 7/24 Self-Healing] Login başarısız (${err.message}). ${waitSec} sn sonra otomatik tekrar denenecek...`);
          await new Promise(r => setTimeout(r, waitMs));
        }
      }
    };

    connectDiscord();
  } catch (err) {
    logger.error("Başlatma hatası:", err);
    process.exit(1);
  }
}

start();
