'use strict';

/**
 * VDS durum paneli (salt okunur). Bottan bağımsız çalışır; bot çökse de açılır.
 * Şifre düz metin tutulmaz: VDS_ADMIN_PASS_HASH = "scrypt$<salt hex>$<hash hex>".
 * Çalıştırma: pm2 start deploy/vds-admin/server.js --name vds-admin
 */

const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const PORT = Number(process.env.VDS_ADMIN_PORT || 3900);
const HOST = '127.0.0.1';
const HASH_FILE = process.env.VDS_ADMIN_HASH_FILE || '/root/.vds_admin_pass';
const SESSION_MS = 2 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

const sessions = new Map(); // token -> expiresAt
const fails = new Map(); // ip -> { count, until }

function readPassHash() {
  try { return fs.readFileSync(HASH_FILE, 'utf8').trim(); } catch (_) { return ''; }
}

function verifyPassword(input) {
  const [scheme, saltHex, hashHex] = readPassHash().split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(String(input || ''), Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function clientIp(req) {
  return String(req.headers['x-real-ip'] || req.socket.remoteAddress || '');
}

function getSession(req) {
  const match = /(?:^|;\s*)vds_admin=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  if (!match) return null;
  const exp = sessions.get(match[1]);
  if (!exp || exp < Date.now()) { sessions.delete(match[1]); return null; }
  return match[1];
}

function run(cmd, args) {
  return new Promise(resolve => {
    execFile(cmd, args, { timeout: 8000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => resolve(err ? '' : stdout));
  });
}

function fmtBytes(n) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0; n = Number(n) || 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}

function fmtDuration(sec) {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
  return `${d ? d + 'g ' : ''}${h}s ${m}dk`;
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function collectStatus() {
  const [dfOut, pm2Out] = await Promise.all([
    run('df', ['-B1', '--output=size,used,avail', '/']),
    run('pm2', ['jlist'])
  ]);
  const [size, used, avail] = (dfOut.trim().split('\n')[1] || '').trim().split(/\s+/).map(Number);
  let procs = [];
  try {
    procs = JSON.parse(pm2Out).map(p => ({
      name: p.name,
      status: p.pm2_env.status,
      cpu: p.monit?.cpu ?? 0,
      mem: p.monit?.memory ?? 0,
      uptime: p.pm2_env.status === 'online' ? (Date.now() - p.pm2_env.pm_uptime) / 1000 : 0,
      restarts: p.pm2_env.restart_time
    }));
  } catch (_) {}
  const haLeader = fs.existsSync(path.join('/root/bemsentara/data/.ha_leader_node'));
  return {
    host: os.hostname(),
    load: os.loadavg().map(n => n.toFixed(2)).join(' / '),
    cpus: os.cpus().length,
    memUsed: os.totalmem() - os.freemem(),
    memTotal: os.totalmem(),
    disk: { size, used, avail },
    uptime: os.uptime(),
    procs,
    haLeader
  };
}

const STYLE = `
  :root { --bg:#060813; --card:rgba(18,24,48,.75); --line:rgba(255,255,255,.08); --text:#f8fafc; --muted:#94a3b8; --rose:#f43f5e; --ok:#22c55e; }
  * { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;
    background-image:radial-gradient(ellipse 60% 40% at 50% 0%,rgba(244,63,94,.12),transparent 60%); min-height:100vh; }
  .wrap { width:min(960px,calc(100% - 32px)); margin:32px auto; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:20px; padding:20px; margin-bottom:16px; }
  h1 { font-size:1.4rem; margin:0 0 4px; } .muted { color:var(--muted); font-size:.85rem; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; }
  .stat b { display:block; font-size:1.3rem; } .bar { height:6px; background:var(--line); border-radius:9px; overflow:hidden; margin-top:6px; }
  .bar i { display:block; height:100%; background:linear-gradient(90deg,var(--rose),#a855f7); }
  table { width:100%; border-collapse:collapse; font-size:.9rem; } th,td { text-align:left; padding:8px 6px; border-bottom:1px solid var(--line); }
  th { color:var(--muted); font-weight:600; } .on { color:var(--ok); } .off { color:var(--rose); }
  input,button { font:inherit; padding:12px 14px; border-radius:12px; border:1px solid var(--line); background:rgba(255,255,255,.05); color:var(--text); width:100%; }
  button { background:linear-gradient(135deg,#f43f5e,#e11d48); border:0; font-weight:700; cursor:pointer; margin-top:10px; }
  .login { max-width:360px; margin:18vh auto; } .err { color:var(--rose); margin-top:8px; font-size:.9rem; }
  .top { display:flex; justify-content:space-between; align-items:center; gap:12px; } .top form button { width:auto; margin:0; padding:8px 14px; }
`;

function page(title, body) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title><style>${STYLE}</style></head><body>${body}</body></html>`;
}

function loginPage(error = '') {
  return page('VDS Panel', `<div class="login card"><h1>VDS Panel</h1><p class="muted">Devam etmek için şifreyi gir.</p>
<form method="post" action="/login"><input type="password" name="password" autocomplete="current-password" autofocus required>
<button type="submit">Giriş</button>${error ? `<div class="err">${esc(error)}</div>` : ''}</form></div>`);
}

function statusPage(s) {
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const rows = s.procs.map(p => `<tr><td>${esc(p.name)}</td><td class="${p.status === 'online' ? 'on' : 'off'}">${esc(p.status)}</td>
<td>${p.cpu}%</td><td>${fmtBytes(p.mem)}</td><td>${p.uptime ? fmtDuration(p.uptime) : '—'}</td><td>${p.restarts}</td></tr>`).join('');
  return page('VDS Panel', `<div class="wrap">
<div class="card top"><div><h1>${esc(s.host)}</h1><div class="muted">Sunucu açık: ${fmtDuration(s.uptime)} · Yük: ${s.load} (${s.cpus} çekirdek) · 30 sn'de bir yenilenir</div></div>
<form method="post" action="/logout"><button type="submit">Çıkış</button></form></div>
<div class="grid">
<div class="card stat"><span class="muted">RAM</span><b>${fmtBytes(s.memUsed)} / ${fmtBytes(s.memTotal)}</b><div class="bar"><i style="width:${pct(s.memUsed, s.memTotal)}%"></i></div></div>
<div class="card stat"><span class="muted">Disk</span><b>${fmtBytes(s.disk.used)} / ${fmtBytes(s.disk.size)}</b><div class="bar"><i style="width:${pct(s.disk.used, s.disk.size)}%"></i></div></div>
<div class="card stat"><span class="muted">HA (VDS ↔ Render)</span><b class="${s.haLeader ? 'on' : 'off'}">${s.haLeader ? 'VDS lider' : 'VDS lider değil'}</b></div>
</div>
<div class="card"><h1>Süreçler (pm2)</h1><table><tr><th>Ad</th><th>Durum</th><th>CPU</th><th>RAM</th><th>Çalışma</th><th>Yeniden başlama</th></tr>${rows || '<tr><td colspan="6" class="muted">pm2 verisi alınamadı</td></tr>'}</table></div>
</div><script>setTimeout(()=>location.reload(),30000)</script>`);
}

function send(res, code, html, headers = {}) {
  res.writeHead(code, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...headers
  });
  res.end(html);
}

function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 4096) req.destroy(); });
    req.on('end', () => resolve(new URLSearchParams(data)));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');

  if (req.method === 'POST' && url.pathname === '/login') {
    const ip = clientIp(req);
    const f = fails.get(ip);
    if (f && f.until > Date.now()) return send(res, 429, loginPage('Çok fazla hatalı deneme. 15 dakika sonra tekrar dene.'));
    const body = await readBody(req);
    if (!verifyPassword(body.get('password'))) {
      const count = (f && f.until > Date.now() ? f.count : (f?.count || 0)) + 1;
      fails.set(ip, { count, until: count >= MAX_FAILS ? Date.now() + LOCK_MS : 0 });
      await new Promise(r => setTimeout(r, 800));
      return send(res, 401, loginPage('Şifre hatalı.'));
    }
    fails.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_MS);
    return send(res, 303, '', { Location: '/', 'Set-Cookie': `vds_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}` });
  }

  if (req.method === 'POST' && url.pathname === '/logout') {
    const token = getSession(req);
    if (token) sessions.delete(token);
    return send(res, 303, '', { Location: '/', 'Set-Cookie': 'vds_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }

  if (req.method !== 'GET' || url.pathname !== '/') return send(res, 404, page('404', '<div class="login card"><h1>404</h1></div>'));
  if (!getSession(req)) return send(res, 200, loginPage());
  return send(res, 200, statusPage(await collectStatus()));
});

server.listen(PORT, HOST, () => console.log(`[vds-admin] http://${HOST}:${PORT} dinleniyor`));
