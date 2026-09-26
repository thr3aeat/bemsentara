const axios = require("axios");
const fs = require("fs");
const path = require("path");
const logger = require("../../utils/logger");

const TARGET_URL = process.env.BASE_URL || "https://ekoyildiz.duckdns.org";
const TARGET_CHANNEL_ID = "1518692466860101915";
const TARGET_GUILD_ID = "1367646464804655104";
const ALERT_MESSAGE_TEXT = "EkoYıldız teknik ve donanım sistemlerinde bir hata keşif ettik. Bu hatayı teklnik ekipleirmize aktardık en kısa sürede düzelecek .";
const STATE_FILE = path.join(__dirname, "../../data/domain_monitor_state.json");
const CHECK_INTERVAL_MS = 45 * 1000; // 45 saniyede bir kontrol

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
    // Hem HEAD hem GET fallback
    const res = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true, // Herhangi bir HTTP kodu dönerse sunucu/domain aktiftir
      headers: {
        "User-Agent": "EkoYildiz-Monitor/1.0"
      }
    });
    // 500 ve üzeri sunucu çökmesi veya 502/503/504 bad gateway ise down kabul edilir
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
      // Domain veya sunucu kapalı / hata veriyor
      logger.warn(`[DomainMonitor] ${TARGET_URL} erişilemez durumda: ${health.error}`);

      if (!state.alertMessageId) {
        try {
          const channel = discordBot.channels.cache.get(TARGET_CHANNEL_ID) 
            || await discordBot.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);

          if (channel && channel.isTextBased()) {
            const sent = await channel.send(ALERT_MESSAGE_TEXT);
            state.alertMessageId = sent.id;
            state.isDown = true;
            saveState(state);
            logger.info(`[DomainMonitor] Uyarı mesajı gönderildi (Mesaj ID: ${sent.id})`);
          } else {
            logger.warn(`[DomainMonitor] Hedef kanal (${TARGET_CHANNEL_ID}) bulunamadı veya metin kanalı değil.`);
          }
        } catch (sendErr) {
          logger.error(`[DomainMonitor] Uyarı mesajı gönderilirken hata: ${sendErr && sendErr.message}`);
        }
      }
    } else {
      // Domain sağlıklı ve aktif
      if (state.alertMessageId || state.isDown) {
        logger.info(`[DomainMonitor] ${TARGET_URL} yeniden aktif oldu! Uyarı mesajı temizleniyor...`);
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

            // Garanti temizlik: botun daha önce atmış olabileceği eşleşen mesajları da temizle
            try {
              const recent = await channel.messages.fetch({ limit: 15 }).catch(() => null);
              if (recent) {
                for (const [, m] of recent) {
                  if (m.author.id === discordBot.user.id && m.content.includes("EkoYıldız teknik ve donanım")) {
                    if (m.deletable) {
                      await m.delete().catch(() => {});
                    }
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

  // İlk kontrolü 10 saniye sonra yap
  setTimeout(() => {
    performDomainCheck(discordBot).catch(() => {});
  }, 10000);

  // Periyodik kontrol
  monitorTimer = setInterval(() => {
    performDomainCheck(discordBot).catch(() => {});
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  startEkoDomainMonitor,
  checkDomainHealth,
  performDomainCheck
};
