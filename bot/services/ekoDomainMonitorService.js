const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const logger = require("../../utils/logger");

const TARGET_URL = process.env.BASE_URL || "https://ekoyildiz.duckdns.org";
const TARGET_CHANNEL_ID = "1518692466860101915";
const TARGET_GUILD_ID = "1367646464804655104";
const STATE_FILE = path.join(__dirname, "../../data/domain_monitor_state.json");
const CHECK_INTERVAL_MS = 45 * 1000; // 45 saniyede bir kontrol

function createAlertPayload() {
  const embed = new EmbedBuilder()
    .setColor(0xE67E22) // Modern Amber / Canlı Turuncu
    .setAuthor({
      name: "EkoYıldız Altyapı ve Sistem İzleme",
      iconURL: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26a0.png"
    })
    .setTitle("⚠️ Teknik ve Donanım Sistemlerinde Kesinti")
    .setDescription(
      "> **EkoYıldız teknik ve donanım sistemlerimizde beklenmeyen bir hata keşfedilmiştir.**\n\n" +
      "🔧 **Müdahale Durumu:**\n" +
      "Bu arıza teknik ve sistem mühendisliği ekiplerimize ivedilikle aktarılmış olup, sistemlerin stabilizasyonu için gerekli çalışmalar sürdürülmektedir.\n\n" +
      "⏱️ En kısa sürede tüm servisler yeniden aktif hale getirilecektir."
    )
    .addFields(
      {
        name: "📡 Etkilenen Sistem",
        value: "```\nWeb Paneli & API Gateway (ekoyildiz.duckdns.org)\n```",
        inline: false
      },
      {
        name: "⚡ Canlı Durum",
        value: "🔴 **Servis Dışı (Müdahale Ediliyor)**",
        inline: true
      },
      {
        name: "🔄 Otomatik Kurtarma",
        value: "🟢 **Normale dönünce bu mesaj silinecektir**",
        inline: true
      }
    )
    .setFooter({
      text: "EkoYıldız Altyapı & Donanım Güvenlik İzleme Servisi • 7/24 Aktif"
    })
    .setTimestamp();

  return { embeds: [embed] };
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch (err) {
    logger.warn(`[DomainMonitor] State dosyası okunamadı: ${err && err.message}`);
  }
  return { alertMessageId: null, isDown: false, lastCheck: null };
}

function saveState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    logger.warn(`[DomainMonitor] State dosyası kaydedilemedi: ${err && err.message}`);
  }
}

let state = loadState();
let monitorTimer = null;
let isChecking = false;

async function checkDomainHealth(url) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        "User-Agent": "EkoYildiz-Monitor/1.0"
      }
    });
    if (res.status >= 502 && res.status <= 504) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function performDomainCheck(discordBot) {
  if (isChecking) return;
  isChecking = true;

  try {
    const health = await checkDomainHealth(TARGET_URL);
    state.lastCheck = new Date().toISOString();

    if (!health.ok) {
      logger.warn(`[DomainMonitor] ${TARGET_URL} erişilemez durumda: ${health.error}`);

      if (!state.alertMessageId) {
        try {
          const channel = discordBot.channels.cache.get(TARGET_CHANNEL_ID) 
            || await discordBot.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);

          if (channel && channel.isTextBased()) {
            const payload = createAlertPayload();
            const sent = await channel.send(payload);
            state.alertMessageId = sent.id;
            state.isDown = true;
            saveState(state);
            logger.info(`[DomainMonitor] Modern uyarı bildirimi gönderildi (Mesaj ID: ${sent.id})`);
          } else {
            logger.warn(`[DomainMonitor] Hedef kanal (${TARGET_CHANNEL_ID}) bulunamadı veya metin kanalı değil.`);
          }
        } catch (sendErr) {
          logger.error(`[DomainMonitor] Uyarı bildirimi gönderilirken hata: ${sendErr && sendErr.message}`);
        }
      }
    } else {
      if (state.alertMessageId || state.isDown) {
        logger.info(`[DomainMonitor] ${TARGET_URL} yeniden aktif oldu! Uyarı bildirimi temizleniyor...`);
        try {
          const channel = discordBot.channels.cache.get(TARGET_CHANNEL_ID)
            || await discordBot.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);

          if (channel && channel.isTextBased()) {
            if (state.alertMessageId) {
              const msg = await channel.messages.fetch(state.alertMessageId).catch(() => null);
              if (msg && msg.deletable) {
                await msg.delete().catch(() => {});
                logger.info(`[DomainMonitor] Uyarı mesajı (${state.alertMessageId}) başarıyla silindi.`);
              }
            }

            // Botun daha önce gönderdiği eşleşen uyarıları da temizle
            try {
              const recent = await channel.messages.fetch({ limit: 15 }).catch(() => null);
              if (recent) {
                for (const [, m] of recent) {
                  const isBotAlert = m.author.id === discordBot.user.id && (
                    m.content.includes("EkoYıldız teknik") ||
                    (m.embeds.length && m.embeds[0].title?.includes("Teknik ve Donanım"))
                  );
                  if (isBotAlert && m.deletable) {
                    await m.delete().catch(() => {});
                  }
                }
              }
            } catch (_) {}
          }
        } catch (delErr) {
          logger.warn(`[DomainMonitor] Mesaj silinirken hata: ${delErr && delErr.message}`);
        }

        state.alertMessageId = null;
        state.isDown = false;
        saveState(state);
      }
    }
  } catch (err) {
    logger.error(`[DomainMonitor] Genel kontrol hatası: ${err && err.message}`);
  } finally {
    isChecking = false;
  }
}

function startEkoDomainMonitor(discordBot) {
  if (monitorTimer) {
    clearInterval(monitorTimer);
  }

  logger.info(`[DomainMonitor] EkoYıldız domain izleme servisi aktif (${TARGET_URL} -> #${TARGET_CHANNEL_ID})`);

  setTimeout(() => {
    performDomainCheck(discordBot).catch(() => {});
  }, 10000);

  monitorTimer = setInterval(() => {
    performDomainCheck(discordBot).catch(() => {});
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  startEkoDomainMonitor,
  checkDomainHealth,
  performDomainCheck,
  createAlertPayload
};
