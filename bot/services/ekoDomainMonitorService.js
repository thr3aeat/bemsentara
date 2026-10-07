const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const logger = require("../../utils/logger");

const TARGET_URL = process.env.BASE_URL || "https://ekoyildiz.duckdns.org";
const TARGET_CHANNEL_ID = "1518692466860101915";
const TARGET_GUILD_ID = "1367646464804655104";
const STATE_FILE = path.join(__dirname, "../../data/domain_monitor_state.json");
const CHECK_INTERVAL_MS = 45 * 1000; // 45 saniyede bir kontrol
// Tek bir hatalı kontrol (yeniden başlatma, anlık gecikme) kesinti sayılmaz:
const CONFIRM_RETRIES = 2; // ilk hatadan sonra ek deneme sayısı
const CONFIRM_RETRY_MS = Number(process.env.DOMAIN_MONITOR_RETRY_MS) || 8000;
// Bot açıldıktan sonra web paneli de ayağa kalkana kadar uyarı gönderme:
const STARTUP_GRACE_MS = process.env.DOMAIN_MONITOR_STARTUP_GRACE_MS !== undefined
  ? Number(process.env.DOMAIN_MONITOR_STARTUP_GRACE_MS)
  : 120 * 1000;
const STARTED_AT = Date.now();
const ALERT_COLOR = 0xE67E22;
const OK_COLOR = 0x2ECC71;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDuration(ms) {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  if (h) return `${h} sa ${m} dk`;
  if (m) return `${m} dk ${sec} sn`;
  return `${sec} sn`;
}

function buildContainer(color, lines) {
  const container = new ContainerBuilder().setAccentColor(color);
  lines.forEach((line) => {
    if (line === "---") {
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    } else {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(line));
    }
  });
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

/**
 * Kesinti bildirimi (Components V2).
 * @param {{error?: string, since?: string|Date, failures?: number}} info
 */
function createAlertPayload(info = {}) {
  const sinceUnix = Math.floor(new Date(info.since || Date.now()).getTime() / 1000);
  return buildContainer(ALERT_COLOR, [
    "## ⚠️ Web paneli erişilemiyor",
    "EkoYıldız web paneli ve API ağ geçidi şu anda yanıt vermiyor. Teknik ekip bilgilendirildi, sistem otomatik olarak izleniyor.",
    "---",
    `**Etkilenen sistem:** Web Paneli & API Gateway\n` +
    `**Başlangıç:** <t:${sinceUnix}:R>\n` +
    `**Tespit edilen hata:** \`${String(info.error || "Bilinmiyor").slice(0, 120)}\`\n` +
    `**Başarısız kontrol:** ${info.failures || CONFIRM_RETRIES + 1} ardışık`,
    "---",
    "-# Servis normale dönünce bu mesaj otomatik olarak güncellenir • EkoYıldız Altyapı İzleme"
  ]);
}

/** Servis düzelince aynı mesajın yerine geçen bildirim. */
function createRecoveryPayload(info = {}) {
  const downFor = info.since ? formatDuration(Date.now() - new Date(info.since).getTime()) : "bilinmiyor";
  return buildContainer(OK_COLOR, [
    "## ✅ Web paneli yeniden erişilebilir",
    "EkoYıldız web paneli ve API ağ geçidi normal çalışıyor.",
    "---",
    `**Kesinti süresi:** ${downFor}\n**Normale dönüş:** <t:${Math.floor(Date.now() / 1000)}:R>`,
    "-# EkoYıldız Altyapı İzleme"
  ]);
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch (err) {
    logger.warn(`[DomainMonitor] State dosyası okunamadı: ${err && err.message}`);
  }
  return { alertMessageId: null, isDown: false, lastCheck: null, downSince: null, lastError: null };
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

async function getAlertChannel(discordBot) {
  return discordBot.channels.cache.get(TARGET_CHANNEL_ID)
    || await discordBot.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);
}

// İlk hata sonrası kısa aralıklarla yeniden dener; biri başarılı olursa kesinti sayılmaz.
async function confirmDown(url, firstHealth) {
  let last = firstHealth;
  let failures = 1;
  for (let i = 0; i < CONFIRM_RETRIES; i++) {
    await sleep(CONFIRM_RETRY_MS);
    const retry = await checkDomainHealth(url);
    if (retry.ok) return { down: false };
    last = retry;
    failures++;
  }
  return { down: true, error: last.error, failures };
}

async function performDomainCheck(discordBot) {
  if (isChecking) return;
  isChecking = true;

  try {
    state = loadState(); // aynı dosyayı paylaşan başka süreç uyarı attıysa tekrar atma
    const health = await checkDomainHealth(TARGET_URL);
    state.lastCheck = new Date().toISOString();

    if (!health.ok) {
      logger.warn(`[DomainMonitor] ${TARGET_URL} erişilemez durumda: ${health.error}`);

      if (!state.alertMessageId) {
        if (Date.now() - STARTED_AT < STARTUP_GRACE_MS) {
          logger.info("[DomainMonitor] Bot yeni başladı, web panelinin açılması için uyarı ertelendi.");
          return;
        }

        const firstFailureAt = new Date().toISOString();
        const confirmed = await confirmDown(TARGET_URL, health);
        if (!confirmed.down) {
          logger.info("[DomainMonitor] Yeniden denemede servis yanıt verdi, geçici aksaklık olarak kabul edildi.");
          return;
        }

        try {
          const channel = await getAlertChannel(discordBot);

          if (channel && channel.isTextBased()) {
            const sent = await channel.send(createAlertPayload({
              error: confirmed.error,
              since: firstFailureAt,
              failures: confirmed.failures
            }));
            state.alertMessageId = sent.id;
            state.isDown = true;
            state.downSince = firstFailureAt;
            state.lastError = confirmed.error;
            saveState(state);
            logger.info(`[DomainMonitor] Kesinti bildirimi gönderildi (Mesaj ID: ${sent.id})`);
          } else {
            logger.warn(`[DomainMonitor] Hedef kanal (${TARGET_CHANNEL_ID}) bulunamadı veya metin kanalı değil.`);
          }
        } catch (sendErr) {
          logger.error(`[DomainMonitor] Uyarı bildirimi gönderilirken hata: ${sendErr && sendErr.message}`);
        }
      }
    } else if (state.alertMessageId || state.isDown) {
      logger.info(`[DomainMonitor] ${TARGET_URL} yeniden aktif oldu!`);
      try {
        const channel = await getAlertChannel(discordBot);

        if (channel && channel.isTextBased()) {
          const msg = state.alertMessageId
            ? await channel.messages.fetch(state.alertMessageId).catch(() => null)
            : null;

          let updated = false;
          if (msg) {
            // Eski sürümün embed'li uyarısı V2'ye çevrilemez; düzenleme başarısızsa silinir.
            updated = await msg.edit(createRecoveryPayload({ since: state.downSince })).then(() => true).catch(() => false);
            if (!updated && msg.deletable) await msg.delete().catch(() => {});
          }

          // Bu servisin eski/yarım kalmış uyarılarını temizle (güncellediğimiz mesaj hariç)
          const recent = await channel.messages.fetch({ limit: 15 }).catch(() => null);
          if (recent) {
            for (const [, m] of recent) {
              if (msg && m.id === msg.id && updated) continue;
              const isBotAlert = m.author.id === discordBot.user.id && (
                (m.content || "").includes("EkoYıldız teknik") ||
                (m.embeds.length && m.embeds[0].title?.includes("Teknik ve Donanım"))
              );
              if (isBotAlert && m.deletable) await m.delete().catch(() => {});
            }
          }
        }
      } catch (delErr) {
        logger.warn(`[DomainMonitor] Kurtarma bildirimi güncellenirken hata: ${delErr && delErr.message}`);
      }

      state.alertMessageId = null;
      state.isDown = false;
      state.downSince = null;
      saveState(state);
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
  createAlertPayload,
  createRecoveryPayload
};
