'use strict';

/**
 * selfHealingService.js
 *
 * Süreci yeniden başlatmadan, alt sistemleri yerinde onaran denetçi (supervisor).
 *
 * Her alt sistem için bir `check` (sağlıklı mı?) ve bir `heal` (yerinde onar) kaydedilir.
 * Denetçi düzenli aralıkla kontrol eder; art arda başarısız olursa onarmayı dener, başarısız
 * onarımlarda üstel geri çekilme uygular, kalıcı arızada uyarı gönderir ve yavaş yavaş denemeye
 * devam eder. Süreç varsayılan olarak ASLA kapatılmaz (SELF_HEAL_EXIT_ON_FAIL=1 ile en son
 * çare olarak açılabilir; bu durumda PM2/systemd süreci yeniden ayağa kaldırır).
 *
 * Uyarılar Discord kapalıyken de ulaşsın diye ALERT_WEBHOOK_URL (bağımsız webhook) üzerinden
 * gider; Discord hazırsa ayrıca SELF_HEAL_ALERT_CHANNEL_ID kanalına da yazılır.
 */

const http = require('http');
const axios = require('axios');
const logger = require('../../utils/logger');

const DEFAULTS = {
  intervalMs: 15000,
  failThreshold: 2,        // art arda kaç başarısız kontrolde onarım denensin
  maxFastAttempts: 5,      // bu denemeden sonra "kalıcı arıza" uyarısı
  backoffBaseMs: 10000,
  backoffMaxMs: 5 * 60 * 1000,
  checkTimeoutMs: 10000,
  healTimeoutMs: 45000
};

const ALERT_CHANNEL_ID = process.env.SELF_HEAL_ALERT_CHANNEL_ID || '1518692466860101915';

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} zaman aşımı (${ms}ms)`)), ms).unref())
]);

function createSupervisor(options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  const systems = new Map();
  let timer = null;
  let discordClient = null;
  let running = false;

  async function notify(text) {
    logger.warn(`[SelfHealing] ${text}`);
    const webhook = process.env.ALERT_WEBHOOK_URL;
    if (webhook) {
      await axios.post(webhook, { content: `🛠️ ${text}` }, { timeout: 8000 }).catch(() => {});
    }
    try {
      if (discordClient && discordClient.isReady()) {
        const channel = discordClient.channels.cache.get(ALERT_CHANNEL_ID)
          || await discordClient.channels.fetch(ALERT_CHANNEL_ID).catch(() => null);
        if (channel && typeof channel.send === 'function') await channel.send({ content: `🛠️ ${text}` }).catch(() => {});
      }
    } catch (_) { /* uyarı kanalı yoksa webhook/log yeterli */ }
  }

  /**
   * @param {string} name
   * @param {{ check: () => Promise<{ok:boolean, detail?:string}>, heal: () => Promise<void> } & Partial<typeof DEFAULTS>} def
   */
  function register(name, def) {
    systems.set(name, {
      name,
      ...cfg,
      ...def,
      failStreak: 0,
      attempts: 0,
      nextAttemptAt: 0,
      alerted: false,
      status: 'ok',
      since: null,
      lastDetail: null,
      lastHealAt: null
    });
  }

  async function runCheck(s) {
    try {
      const res = await withTimeout(Promise.resolve(s.check()), s.checkTimeoutMs, `${s.name} kontrolü`);
      return { ok: !!(res && res.ok), detail: res && res.detail };
    } catch (err) {
      return { ok: false, detail: err.message };
    }
  }

  async function checkSystem(s, now) {
    let res = await runCheck(s);

    if (res.ok) {
      if (s.status !== 'ok') {
        const downFor = s.since ? Math.round((now - s.since) / 1000) : 0;
        logger.success(`[SelfHealing] ${s.name} kendiliğinden toparlandı (${downFor} sn).`);
        if (s.alerted) await notify(`✅ **${s.name}** yeniden sağlıklı (${downFor} sn sürdü, süreç yeniden başlatılmadı).`);
      }
      Object.assign(s, { failStreak: 0, attempts: 0, nextAttemptAt: 0, alerted: false, status: 'ok', since: null, lastDetail: null });
      return;
    }

    s.failStreak++;
    s.lastDetail = res.detail || null;
    if (s.status === 'ok') { s.status = 'degraded'; s.since = now; }
    if (s.failStreak < s.failThreshold || now < s.nextAttemptAt) return;

    s.attempts++;
    s.status = 'healing';
    s.lastHealAt = now;
    s.nextAttemptAt = now + Math.min(s.backoffBaseMs * 2 ** (s.attempts - 1), s.backoffMaxMs);
    logger.warn(`[SelfHealing] ${s.name} sağlıksız (${s.lastDetail || 'bilinmiyor'}), yerinde onarım #${s.attempts} deneniyor...`);

    try {
      await withTimeout(Promise.resolve(s.heal()), s.healTimeoutMs, `${s.name} onarımı`);
    } catch (err) {
      logger.error(`[SelfHealing] ${s.name} onarımı hata verdi: ${err.message}`);
    }

    res = await runCheck(s);
    if (res.ok) {
      s.failStreak = 0;
      return checkSystem(s, now); // başarılı onarımı tek yerden raporla
    }

    if (s.attempts >= s.maxFastAttempts && !s.alerted) {
      s.alerted = true;
      await notify(`⚠️ **${s.name}** ${s.attempts} onarım denemesine rağmen düzelmedi (${s.lastDetail || 'neden bilinmiyor'}). Otomatik denemeler azalan sıklıkta sürüyor.`);
    }

    if (process.env.SELF_HEAL_EXIT_ON_FAIL === '1' && s.attempts >= s.maxFastAttempts * 2) {
      logger.error(`[SelfHealing] ${s.name} kalıcı arızalı; en son çare olarak süreç sonlandırılıyor (dış denetçi yeniden başlatır).`);
      process.exit(1);
    }
  }

  async function tick(now = Date.now()) {
    if (running) return;
    running = true;
    try {
      for (const s of systems.values()) {
        try { await checkSystem(s, now); } catch (err) { logger.error(`[SelfHealing] ${s.name} denetim hatası: ${err.message}`); }
      }
    } finally {
      running = false;
    }
  }

  function start() {
    if (timer) return;
    timer = setInterval(() => tick().catch(() => {}), cfg.intervalMs);
    timer.unref();
    logger.info(`[SelfHealing] Denetçi aktif (${systems.size} alt sistem, ${cfg.intervalMs / 1000} sn aralık).`);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function getStatus() {
    return [...systems.values()].map(s => ({
      name: s.name, status: s.status, failStreak: s.failStreak, attempts: s.attempts, detail: s.lastDetail, lastHealAt: s.lastHealAt
    }));
  }

  // ── Hazır alt sistem kayıtları ───────────────────────────────────────────

  /**
   * Discord bağlantısı: hazır değilse (ve en az bir kez hazır olduysa) aynı süreçte
   * client.destroy() + client.login() ile yeniden bağlanır. İlk bağlanma döngüsüne karışmaz.
   */
  function registerDiscord(client, { token, name = 'Discord Bağlantısı' }) {
    discordClient = client;
    register(name, {
      failThreshold: 6, // ~90 sn: discord.js'in kendi yeniden bağlanmasına süre tanı
      check: async () => {
        if (!client.readyTimestamp) return { ok: true, detail: 'ilk bağlantı bekleniyor' };
        const ok = client.isReady() && client.ws.status === 0;
        return { ok, detail: ok ? null : `ws durumu=${client.ws && client.ws.status}, hazır=${client.isReady()}` };
      },
      heal: async () => {
        try { await client.destroy(); } catch (_) { /* zaten kopuk olabilir */ }
        await client.login(token);
      }
    });
  }

  /**
   * Web sunucusu: dinlemiyorsa yeniden dinletir; dinliyor ama yanıt vermiyorsa takılı
   * bağlantıları temizler. Bakım sayfası (503) yanıt sayılır, yani sunucu ayaktadır.
   */
  function registerWeb(server, { port, name = 'Web Sunucusu' }) {
    const probe = () => new Promise((resolve) => {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/health', timeout: 5000, headers: { Accept: 'application/json' } }, (res) => {
        res.resume();
        resolve({ ok: res.statusCode < 600 });
      });
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, detail: 'yanıt zaman aşımı' }); });
      req.on('error', (err) => resolve({ ok: false, detail: err.code || err.message }));
    });

    register(name, {
      failThreshold: 2,
      check: async () => {
        if (!server.listening) return { ok: false, detail: 'sunucu dinlemiyor' };
        return probe();
      },
      heal: async () => {
        if (!server.listening) {
          await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(port, () => { server.removeListener('error', reject); resolve(); });
          });
        } else if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections(); // takılı/yarım bağlantılar yeni isteklerin önünü tıkamasın
        }
      }
    });
  }

  return { register, registerDiscord, registerWeb, tick, start, stop, getStatus, notify };
}

const defaultSupervisor = createSupervisor();

module.exports = { createSupervisor, supervisor: defaultSupervisor };
