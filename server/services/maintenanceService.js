'use strict';

/**
 * maintenanceService.js
 *
 * Bakım / düşük performans modu. Amaç: sistem sorun yaşadığında kullanıcı boş sayfa,
 * zaman aşımı veya ham hata görmesin; bunun yerine kontrollü bir bakım ekranı görsün ve
 * acil/kritik sistemler (durum, destek, itiraz, yardım, personel girişi) açık kalsın.
 *
 * Modlar:
 *   off     – normal çalışma
 *   auto    – sağlık sinyalleri art arda bozulunca otomatik açılır, düzelince kapanır
 *   manual  – yönetici açar/kapatır (data/maintenance.json, yeniden başlatmadan etkilenmez)
 *
 * Sağlık sinyalleri (veri MongoDB'de değil, bellek/dosya tabanlı olduğu için):
 *   - olay döngüsü gecikmesi (p99)  – sunucu aşırı yüklendi / kilitlendi
 *   - bellek baskısı                – heap sınırına yaklaşıldı (çökme öncesi)
 *   - veri klasörüne yazılabilirlik – disk dolu / salt okunur
 *
 * Bakımdayken kritik rotalar açık kalır ama IP başına daha sıkı hız sınırından geçer.
 */

const fs = require('fs');
const path = require('path');
const v8 = require('v8');
const express = require('express');
const { monitorEventLoopDelay } = require('perf_hooks');
const logger = require('../../utils/logger');
const { getClientIp } = require('./ddosAndExploitGuardService');
const { isSiteAdmin } = require('../../utils/adminCheck');

const DATA_DIR = path.join(__dirname, '../../data');
const STATE_FILE = path.join(DATA_DIR, 'maintenance.json');
const PROBE_FILE = path.join(DATA_DIR, '.health-probe');

const PROBE_INTERVAL_MS = 5000;
const ENTER_AFTER_BAD = 3; // art arda kötü ölçüm → bakıma geç
const EXIT_AFTER_GOOD = 6; // art arda iyi ölçüm → normale dön (titreşimi önler)
const LAG_P99_LIMIT_MS = 1500;
const HEAP_RATIO_LIMIT = 0.92;

// Bakımdayken de açık kalan acil/kritik sistemler (önek eşleşmesi).
const CRITICAL_PREFIXES = [
  '/status', '/api/status', '/api/health',
  '/yardim', '/help', '/itiraz', '/itiraz-merkezi',
  '/tickets', '/api/tickets', '/forms', '/api/forms',
  '/auth/', '/admin', '/api/admin',
  '/public/', '/robots.txt', '/favicon.ico', '/.well-known/'
];

const ADMIN_PREFIXES = ['/admin', '/api/admin', '/auth/'];

const CRITICAL_LINKS = [
  { href: '/status', label: 'Sistem Durumu', desc: 'Canlı servis durumu' },
  { href: '/tickets/new', label: 'Destek Talebi', desc: 'Acil sorunlar için talep aç' },
  { href: '/itiraz', label: 'İtiraz Merkezi', desc: 'Ceza ve karar itirazları' },
  { href: '/yardim', label: 'Yardım Merkezi', desc: 'Güvenlik ve kullanım rehberleri' }
];

// Bakım sırasında kritik rotalar için sıkı abuse sınırı (IP başına, dakika).
const MAINT_GET_LIMIT = 60;
const MAINT_WRITE_LIMIT = 8;
const maintHits = new Map(); // ip -> { reads, writes, resetAt }

const lagHistogram = monitorEventLoopDelay({ resolution: 20 });
let timer = null;
let badStreak = 0;
let goodStreak = 0;
let autoActive = false;
let autoSince = null;
let lastSignals = { lagP99Ms: 0, heapRatio: 0, diskOk: true };
let manual = loadManual();

function loadManual() {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return parsed && parsed.enabled ? parsed : { enabled: false };
  } catch (_) {
    return { enabled: false };
  }
}

function saveManual(next) {
  manual = next;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
  } catch (err) {
    logger.warn(`[Maintenance] Durum dosyası yazılamadı: ${err.message}`);
  }
}

function probe() {
  const lagP99Ms = Math.round((lagHistogram.percentile(99) || 0) / 1e6);
  lagHistogram.reset();

  const { used_heap_size: used, heap_size_limit: limit } = v8.getHeapStatistics();
  const heapRatio = limit ? used / limit : 0;

  let diskOk = true;
  try {
    fs.writeFileSync(PROBE_FILE, String(Date.now()));
  } catch (_) {
    diskOk = false;
  }

  lastSignals = { lagP99Ms, heapRatio: Number(heapRatio.toFixed(3)), diskOk };
  const bad = lagP99Ms > LAG_P99_LIMIT_MS || heapRatio > HEAP_RATIO_LIMIT || !diskOk;

  if (bad) {
    badStreak++;
    goodStreak = 0;
    if (!autoActive && badStreak >= ENTER_AFTER_BAD) {
      autoActive = true;
      autoSince = new Date().toISOString();
      logger.warn(`[Maintenance] Otomatik bakım modu AÇILDI (gecikme=${lagP99Ms}ms, heap=${Math.round(heapRatio * 100)}%, disk=${diskOk ? 'ok' : 'HATA'})`);
    }
  } else {
    goodStreak++;
    badStreak = 0;
    if (autoActive && goodStreak >= EXIT_AFTER_GOOD) {
      autoActive = false;
      autoSince = null;
      logger.info('[Maintenance] Sistem normale döndü, otomatik bakım modu KAPANDI.');
    }
  }

  manual = loadManual(); // yönetici dosyayı elle değiştirirse yeniden başlatmadan algılanır
}

function start() {
  if (timer) return;
  lagHistogram.enable();
  timer = setInterval(probe, PROBE_INTERVAL_MS);
  timer.unref();
}

function getStatus() {
  const mode = manual.enabled ? 'manual' : (autoActive ? 'auto' : 'off');
  return {
    mode,
    active: mode !== 'off',
    since: mode === 'manual' ? manual.since : autoSince,
    reason: mode === 'manual' ? manual.reason || null : null,
    etaAt: mode === 'manual' ? manual.etaAt || null : null,
    signals: lastSignals
  };
}

function setManual({ enabled, reason, etaMinutes, by }) {
  if (!enabled) {
    saveManual({ enabled: false });
    logger.info(`[Maintenance] Manuel bakım modu KAPATILDI (${by || 'bilinmiyor'}).`);
    return getStatus();
  }
  const eta = Number(etaMinutes);
  saveManual({
    enabled: true,
    reason: String(reason || '').slice(0, 200) || null,
    etaAt: eta > 0 ? new Date(Date.now() + Math.min(eta, 24 * 60) * 60000).toISOString() : null,
    since: new Date().toISOString(),
    by: by || null
  });
  logger.warn(`[Maintenance] Manuel bakım modu AÇILDI (${by || 'bilinmiyor'}).`);
  return getStatus();
}

function isCritical(reqPath) {
  return CRITICAL_PREFIXES.some(p => reqPath === p || reqPath.startsWith(p.endsWith('/') ? p : p + '/'));
}

function overMaintenanceLimit(ip, isWrite) {
  const now = Date.now();
  let h = maintHits.get(ip);
  if (!h || now > h.resetAt) {
    h = { reads: 0, writes: 0, resetAt: now + 60000 };
    maintHits.set(ip, h);
  }
  if (isWrite) h.writes++; else h.reads++;
  if (maintHits.size > 5000) {
    for (const [k, v] of maintHits) if (now > v.resetAt) maintHits.delete(k);
  }
  return isWrite ? h.writes > MAINT_WRITE_LIMIT : h.reads > MAINT_GET_LIMIT;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderMaintenancePage(status) {
  const planned = status.mode === 'manual';
  const title = planned ? 'Planlı bakım yapılıyor' : 'Sistemler kısa süreliğine yoğun';
  const lead = planned
    ? 'Daha iyi bir deneyim için altyapımızı güncelliyoruz. Çok kısa sürede geri döneceğiz.'
    : 'Altyapımız yoğunluğu dengelerken sayfaları geçici olarak durdurduk. Verileriniz güvende, sistem kendini otomatik olarak toparlıyor.';
  const eta = status.etaAt ? `<p class="eta">Tahmini dönüş: <time datetime="${escapeHtml(status.etaAt)}" id="eta"></time></p>` : '';
  const reason = status.reason ? `<p class="reason">${escapeHtml(status.reason)}</p>` : '';
  const links = CRITICAL_LINKS.map(l =>
    `<a class="card" href="${l.href}"><strong>${escapeHtml(l.label)}</strong><span>${escapeHtml(l.desc)}</span></a>`).join('');

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Bakımdayız — EkoYıldız</title>
<style>
  :root { --bg:#0b1020; --fg:#e8ecf8; --muted:#9aa4c4; --card:#141b34; --line:#252f55; --accent:#8b5cf6; --ok:#34d399; }
  @media (prefers-color-scheme: light) { :root { --bg:#f4f6fc; --fg:#12172b; --muted:#5b6485; --card:#fff; --line:#dfe4f3; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:24px; background:radial-gradient(1200px 600px at 50% -10%, rgba(139,92,246,.22), transparent), var(--bg); color:var(--fg); font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  main { width:100%; max-width:640px; text-align:center; }
  .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border:1px solid var(--line); border-radius:999px; background:var(--card); color:var(--muted); font-size:13px; }
  .pulse { width:9px; height:9px; border-radius:50%; background:var(--accent); box-shadow:0 0 0 0 rgba(139,92,246,.6); animation:p 1.8s infinite; }
  @keyframes p { 70% { box-shadow:0 0 0 10px rgba(139,92,246,0); } 100% { box-shadow:0 0 0 0 rgba(139,92,246,0); } }
  @media (prefers-reduced-motion: reduce) { .pulse { animation:none; } }
  h1 { margin:20px 0 8px; font-size:clamp(26px,5vw,36px); line-height:1.15; }
  p { margin:0 auto 10px; max-width:52ch; color:var(--muted); }
  .eta, .reason { color:var(--fg); }
  .section { margin-top:34px; text-align:left; }
  .section h2 { font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin:0 0 12px; text-align:center; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px; }
  .card { display:flex; flex-direction:column; gap:2px; padding:14px 16px; border:1px solid var(--line); border-radius:14px; background:var(--card); color:var(--fg); text-decoration:none; transition:transform .15s,border-color .15s; }
  .card:hover { transform:translateY(-2px); border-color:var(--accent); }
  .card span { color:var(--muted); font-size:14px; }
  .foot { margin-top:28px; font-size:13px; color:var(--muted); }
  .foot b { color:var(--ok); font-weight:600; }
</style>
</head>
<body>
<main>
  <span class="badge"><span class="pulse"></span>${planned ? 'Planlı bakım' : 'Otomatik koruma modu'}</span>
  <h1>${title}</h1>
  <p>${lead}</p>
  ${reason}${eta}
  <div class="section">
    <h2>Acil sistemler açık</h2>
    <div class="grid">${links}</div>
  </div>
  <p class="foot"><b id="state">Durum denetleniyor…</b> Sayfa hazır olduğunda otomatik yenilenecek.</p>
</main>
<script>
  (function () {
    var eta = document.getElementById('eta');
    if (eta) { try { eta.textContent = new Date(eta.getAttribute('datetime')).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); } catch (e) {} }
    var state = document.getElementById('state'), delay = 8000;
    function check() {
      fetch('/api/health?_t=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function () { state.textContent = 'Sistem hazır, yönlendiriliyorsunuz…'; location.reload(); })
        .catch(function () { state.textContent = 'Hâlâ bakımda.'; delay = Math.min(delay * 1.4, 30000); setTimeout(check, delay); });
    }
    setTimeout(check, delay);
  })();
</script>
</body>
</html>`;
}

function maintenanceMiddleware(req, res, next) {
  const status = getStatus();

  // Sağlık ucu: bakımdayken 503 (dış izleyiciler ve istemci kurtarma bunu okur), aksi halde 200.
  if (req.path === '/api/health') {
    res.set('Cache-Control', 'no-store');
    if (status.active) res.set('Retry-After', '30');
    return res.status(status.active ? 503 : 200).json({
      status: status.active ? 'maintenance' : 'online',
      mode: status.mode,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  }

  if (!status.active) return next();

  const wantsHtml = req.method === 'GET' && req.accepts(['html', 'json']) === 'html';
  const retryAfter = status.etaAt
    ? Math.max(30, Math.min(3600, Math.round((new Date(status.etaAt) - Date.now()) / 1000)))
    : 30;

  if (isCritical(req.path)) {
    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    // Yönetici/giriş uçları bakım limitinden muaf: ortak IP'den gelen bir saldırgan yöneticiyi
    // kilitleyemesin. Bunlar yine de yetki kontrolü, global ve giriş hız sınırının arkasında.
    const limited = !ADMIN_PREFIXES.some(p => req.path === p || req.path.startsWith(p));
    if (limited && overMaintenanceLimit(getClientIp(req), isWrite)) {
      res.set('Retry-After', '60');
      return res.status(429).json({ error: 'Bakım sırasında istek sınırına ulaşıldı. Lütfen bir dakika bekleyin.' });
    }
    res.set('X-Maintenance-Mode', status.mode);
    return next();
  }

  res.set({ 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store', 'X-Maintenance-Mode': status.mode });
  if (wantsHtml) return res.status(503).type('html').send(renderMaintenancePage(status));
  return res.status(503).json({
    maintenance: true,
    mode: status.mode,
    message: 'Sistem bakımda. Lütfen kısa süre sonra tekrar deneyin.',
    retryAfter
  });
}

// Yönetici ucu: oturum açılmış olmalı (passport sonrası monte edilir).
const adminRouter = express.Router();
adminRouter.get('/api/admin/maintenance', (req, res) => {
  if (!isSiteAdmin(req.user)) return res.status(403).json({ error: 'Yetkisiz' });
  res.json(getStatus());
});
adminRouter.post('/api/admin/maintenance', (req, res) => {
  if (!isSiteAdmin(req.user)) return res.status(403).json({ error: 'Yetkisiz' });
  const { enabled, reason, etaMinutes } = req.body || {};
  res.json(setManual({
    enabled: enabled === true || enabled === 'true',
    reason,
    etaMinutes,
    by: req.user && (req.user.discordId || req.user.username)
  }));
});

// Son çare hata yakalayıcı: ham hata/stack yerine kontrollü yanıt.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error(`[Express Hata] ${req.method} ${req.path}: ${err && (err.stack || err.message)}`);
  if (res.headersSent) return next(err);
  const status = Number(err && (err.status || err.statusCode)) || 500;
  const code = status >= 400 && status < 600 ? status : 500;
  const safeMsg = code >= 500 ? 'Beklenmeyen bir hata oluştu. Ekibimiz bilgilendirildi, lütfen tekrar deneyin.' : (err.expose ? err.message : 'İstek işlenemedi.');
  if (req.method === 'GET' && req.accepts(['html', 'json']) === 'html') {
    return res.status(code).type('html').send(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hata — EkoYıldız</title>` +
      `<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1020;color:#e8ecf8;font:16px system-ui,sans-serif;text-align:center;padding:24px">` +
      `<main><h1>Bir şeyler ters gitti</h1><p style="color:#9aa4c4">${escapeHtml(safeMsg)}</p>` +
      `<p><a style="color:#8b5cf6" href="/">Ana sayfa</a> · <a style="color:#8b5cf6" href="/status">Sistem durumu</a> · <a style="color:#8b5cf6" href="/tickets/new">Destek</a></p></main></body>`
    );
  }
  res.status(code).json({ error: safeMsg });
}

module.exports = {
  start,
  getStatus,
  setManual,
  probe,
  isCritical,
  maintenanceMiddleware,
  adminRouter,
  errorHandler,
  renderMaintenancePage
};
