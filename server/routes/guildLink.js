/**
 * Sunucuya özel hızlı doğrulama ve rol senkron sayfası (/baglan/tmt, /baglan/bem, /baglan/allied)
 * + Web doğrulama API uç noktaları (/api/roblox/verify/start, /api/roblox/verify/check, /api/verify/sync-roles)
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { BASE_URL, TMT_GUILD_ID, TARGET_GUILD_ID, ALLIED_GUILD_ID } = require('../../config');

const pendingWebBioCodes = new Map();

const GUILD_META = {
  tmt: {
    key: 'tmt',
    title: 'TMT — Hızlı Doğrulama',
    subtitle: 'TMT | Turkish Armed Forces sunucusu için Discord ve Roblox hesabını bağla, rollerini saniyeler içinde al!',
    accent: '#dc143c',
    syncBody: { guild: 'tmt' },
  },
  bem: {
    key: 'bem',
    title: 'BEM — Hızlı Doğrulama',
    subtitle: 'BEM sunucusu için Discord ve Roblox hesabını bağla, rütbe ve branş rollerini otomatik al!',
    accent: '#5865f2',
    syncBody: { guild: 'bem' },
  },
  allied: {
    key: 'allied',
    title: 'Müttefik Orduları — Hızlı Doğrulama',
    subtitle: 'Müttefik Orduları sunucusu için Discord ve Roblox hesabını bağla, grup rollerini senkronize et!',
    accent: '#00ff7f',
    syncBody: { guild: 'allied' },
  },
  eko: {
    key: 'tmt',
    title: 'Sentara — Hızlı Doğrulama',
    subtitle: 'Discord ve Roblox hesabını bağla, sunucu rollerini otomatik senkronize et!',
    accent: '#5865f2',
    syncBody: { guild: 'tmt' },
  },
};

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Backend API Endpoints for /baglan/:guild ────────────────────────────────
router.post('/api/roblox/verify/start', async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Önce 1. Adımdan Discord hesabınla giriş yapmalısın.' });
  const username = String(req.body?.username || '').trim();
  const method = String(req.body?.method || 'friend').toLowerCase();
  if (!username) return res.status(400).json({ success: false, error: 'Lütfen Roblox kullanıcı adını gir.' });

  try {
    const rbxRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
      usernames: [username],
      excludeBannedUsers: false,
    }, { timeout: 8000 });
    const account = rbxRes.data?.data?.[0];
    if (!account?.id) {
      return res.status(404).json({ success: false, error: 'Roblox kullanıcı adı bulunamadı.' });
    }
    const robloxId = String(account.id);
    const resolvedUsername = account.name || username;

    if (method === 'bio') {
      const code = `EKO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      pendingWebBioCodes.set(`${req.user.discordId}:${robloxId}`, {
        robloxId,
        username: resolvedUsername,
        code,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });
      return res.json({ success: true, robloxId, username: resolvedUsername, code });
    }

    const { getFriendJar, getOrFetchFriendBotId } = require('../../bot/services/robloxGroupManager');
    const noblox = require('noblox.js');
    const friendJar = getFriendJar();
    if (friendJar) {
      await noblox.sendFriendRequest({ userId: Number(robloxId), jar: friendJar }).catch(() => {});
    }
    const botRobloxId = (await getOrFetchFriendBotId()) || 11940372682;
    const botProfileUrl = `https://www.roblox.com/users/${botRobloxId}/profile`;
    pendingWebBioCodes.set(`friend:${req.user.discordId}:${robloxId}`, {
      robloxId,
      username: resolvedUsername,
      expiresAt: Date.now() + 20 * 60 * 1000,
    });

    return res.json({
      success: true,
      robloxId,
      username: resolvedUsername,
      botProfileUrl,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Roblox API hatası.' });
  }
});

router.post('/api/roblox/verify/check', async (req, res) => {
  if (!req.user) return res.status(401).json({ verified: false, error: 'Önce Discord hesabınla giriş yapmalısın.' });
  const robloxId = String(req.body?.robloxId || '').trim();
  const method = String(req.body?.method || 'friend').toLowerCase();
  if (!robloxId) return res.status(400).json({ verified: false, error: 'Roblox ID eksik.' });

  try {
    let resolvedUsername = null;
    if (method === 'bio') {
      const pending = pendingWebBioCodes.get(`${req.user.discordId}:${robloxId}`);
      if (!pending || pending.expiresAt < Date.now()) {
        return res.status(400).json({ verified: false, error: 'Doğrulama kodunun süresi doldu, tekrar Kod Oluştur butonuna bas.' });
      }
      const profile = await axios.get(`https://users.roblox.com/v1/users/${encodeURIComponent(robloxId)}`, { timeout: 8000 });
      const desc = String(profile.data?.description || '');
      if (!desc.includes(pending.code)) {
        return res.status(400).json({ verified: false, error: `Kod (${pending.code}) profil açıklamanda bulunamadı. Kaydedip tekrar dene.` });
      }
      resolvedUsername = pending.username || profile.data?.name;
      pendingWebBioCodes.delete(`${req.user.discordId}:${robloxId}`);
    } else {
      const { verifyViaFriendRequest, isFriendWithBot, unfriendUser } = require('../../bot/services/robloxGroupManager');
      const viaReq = await verifyViaFriendRequest(robloxId);
      const isFriend = viaReq?.verified || (await isFriendWithBot(robloxId));
      if (!isFriend) {
        return res.status(400).json({
          verified: false,
          error: 'Arkadaşlık isteği henüz bulunamadı. yildiznqt profiline arkadaşlık isteği gönderdiğinden emin ol ve tekrar dene.',
        });
      }
      const fPending = pendingWebBioCodes.get(`friend:${req.user.discordId}:${robloxId}`);
      if (fPending?.username) {
        resolvedUsername = fPending.username;
      } else {
        const profile = await axios.get(`https://users.roblox.com/v1/users/${encodeURIComponent(robloxId)}`, { timeout: 8000 }).catch(() => null);
        resolvedUsername = profile?.data?.name || `Roblox_${robloxId}`;
      }
      await unfriendUser(Number(robloxId)).catch(() => {});
    }

    const User = require('../../models/User');
    const { saveStoreNow } = require('../../models/Store');
    let dbUser = await User.findById(req.user._id);
    if (!dbUser && req.user.discordId) {
      dbUser = await User.findOne({ discordId: String(req.user.discordId) });
    }
    if (!dbUser) {
      return res.status(404).json({ verified: false, error: 'Kullanıcı kaydı bulunamadı.' });
    }

    dbUser.robloxId = String(robloxId);
    dbUser.robloxUsername = resolvedUsername;
    dbUser.isAuthorized = true;
    await dbUser.save();
    saveStoreNow();
    req.user.robloxId = dbUser.robloxId;
    req.user.robloxUsername = dbUser.robloxUsername;

    return res.json({ verified: true, robloxId: dbUser.robloxId, robloxUsername: dbUser.robloxUsername });
  } catch (err) {
    return res.status(500).json({ verified: false, error: err.message || 'Doğrulama kontrol hatası.' });
  }
});

router.post('/api/verify/sync-roles', async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Önce Discord ile giriş yapmalısın.' });
  try {
    const User = require('../../models/User');
    const dbUser = (await User.findOne({ discordId: String(req.user.discordId) })) || req.user;
    if (!dbUser?.robloxId) {
      return res.status(400).json({ success: false, error: 'Önce Roblox hesabını doğrulamalısın.' });
    }

    const { getDiscordClient } = require('../../bot/discordClient');
    const client = getDiscordClient();
    if (!client || !client.isReady()) {
      return res.json({ success: true, message: 'Hesabın doğrulandı! Sunucuda /dogrula komutu ile rollerini alabilirsin.' });
    }

    const targetKey = String(req.body?.guild || 'tmt').toLowerCase();
    const robloxIdNum = parseInt(dbUser.robloxId, 10);

    if (targetKey === 'bem') {
      const { syncMemberRoles } = require('../../bot/services/roleSyncService');
      const guild = await client.guilds.fetch(TARGET_GUILD_ID).catch(() => null);
      const member = guild ? await guild.members.fetch(dbUser.discordId).catch(() => null) : null;
      if (!member) {
        return res.json({ success: true, message: 'Hesabın bağlandı! BEM sunucusuna katıldığında rollerin otomatik verilecek.' });
      }
      const result = await syncMemberRoles(guild, member, robloxIdNum, dbUser.robloxUsername);
      return res.json({
        success: true,
        message: result.message || 'BEM sunucu rollerin başarıyla senkronize edildi!',
        addedRoles: (result.added || []).map(r => r.name || r),
        removedRoles: (result.removed || []).map(r => r.name || r),
      });
    }

    if (targetKey === 'allied') {
      const { syncAlliedRoles } = require('../../bot/services/alliedRoleSyncService');
      const guild = await client.guilds.fetch(ALLIED_GUILD_ID).catch(() => null);
      if (!guild) {
        return res.json({ success: true, message: 'Hesabın bağlandı!' });
      }
      const result = await syncAlliedRoles(client, dbUser.discordId, robloxIdNum, guild);
      return res.json({
        success: true,
        message: result?.message || 'Müttefik Orduları rollerin senkronize edildi!',
        addedRoles: result?.addedRoles || [],
        removedRoles: result?.removedRoles || [],
      });
    }

    // Default: TMT
    const { syncTMTRoles } = require('../../bot/services/tmtRoleSyncService');
    const guild = await client.guilds.fetch(TMT_GUILD_ID).catch(() => null);
    const member = guild ? await guild.members.fetch(dbUser.discordId).catch(() => null) : null;
    if (!member) {
      return res.json({ success: true, message: 'Hesabın doğrulandı! TMT sunucusunda /dogrula yazarak rollerini alabilirsin.' });
    }
    const result = await syncTMTRoles(client, dbUser.discordId, robloxIdNum, member);
    return res.json({
      success: true,
      message: result?.message || 'TMT sunucu rollerin başarıyla senkronize edildi!',
      addedRoles: result?.addedRoles || [],
      removedRoles: result?.removedRoles || [],
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Rol eşitleme hatası.' });
  }
});

router.get('/baglan', (req, res) => {
  res.redirect('/baglan/tmt');
});

router.get('/baglan/:guild', (req, res) => {
  const g = String(req.params.guild || '').toLowerCase();
  const meta = GUILD_META[g] || GUILD_META.tmt;

  const returnPath = `/baglan/${meta.key}`;
  const discordLoginUrl = `/auth/discord?returnTo=${encodeURIComponent(returnPath)}`;
  const robloxOAuthUrl = `/auth/roblox?returnTo=${encodeURIComponent(returnPath)}`;
  const dashUrl = `${BASE_URL}/dashboard`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>⚡ ${escapeHtml(meta.title)}</title>
  <style>
    :root { --accent: ${meta.accent}; --bg: #0b0d13; --card: #131722; --text: #f3f4f6; --muted: #9ca3af; --ok: #22c55e; --warn: #f59e0b; --err: #ef4444; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: radial-gradient(1100px 600px at 50% -10%, ${meta.accent}33, transparent), var(--bg); color: var(--text); padding: 24px 16px 56px; overflow-x: hidden; }
    #confetti-canvas { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; }
    .wrap { max-width: 580px; margin: 0 auto; position: relative; z-index: 2; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; letter-spacing: .04em; color: #fff; margin-bottom: 10px; }
    h1 { font-size: 1.65rem; margin: 0 0 8px; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px; }
    .sub { color: var(--muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 22px; }
    .stepper { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 18px; }
    .step-pill { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; padding: 10px; text-align: center; font-size: 0.8rem; font-weight: 600; color: var(--muted); transition: all .25s; }
    .step-pill.active { border-color: var(--accent); color: #fff; background: rgba(255,255,255,.08); }
    .step-pill.done { border-color: rgba(34,197,94,.5); background: rgba(34,197,94,.12); color: #86efac; }
    .card { background: var(--card); border: 1px solid rgba(255,255,255,.09); border-radius: 16px; padding: 18px 20px; margin-bottom: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.35); transition: border-color .25s, transform .2s; }
    .card.done-card { border-color: rgba(34,197,94,.4); }
    .ready-banner { display: none; background: linear-gradient(135deg, rgba(34,197,94,.22), rgba(16,185,129,.08)); border: 2px solid #22c55e; border-radius: 18px; padding: 24px 20px; margin-bottom: 18px; text-align: center; box-shadow: 0 0 40px rgba(34,197,94,.25); animation: popIn .45s cubic-bezier(.16,1,.3,1); }
    .ready-banner.show { display: block; }
    .ready-banner h2 { margin: 0 0 6px; font-size: 1.75rem; color: #4ade80; letter-spacing: -0.02em; }
    .ready-banner p { margin: 0; color: #d1fae5; font-size: 0.96rem; }
    @keyframes popIn { 0% { opacity: 0; transform: scale(.92); } 100% { opacity: 1; transform: scale(1); } }
    .step-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .step-title { font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; }
    .pill { font-size: 0.75rem; padding: 4px 10px; border-radius: 999px; font-weight: 700; }
    .pill.ok { background: rgba(34,197,94,.2); color: #86efac; border: 1px solid rgba(34,197,94,.35); }
    .pill.wait { background: rgba(245,158,11,.18); color: #fcd34d; border: 1px solid rgba(245,158,11,.35); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 18px; border-radius: 11px; font-weight: 700; font-size: 0.92rem; border: none; cursor: pointer; text-decoration: none; color: #fff; background: var(--accent); transition: transform .12s, filter .15s; }
    .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn.discord { background: #5865F2; }
    .btn.roblox { background: #00a2ff; }
    .btn.success { background: #16a34a; }
    .btn.secondary { background: rgba(255,255,255,.09); color: var(--text); border: 1px solid rgba(255,255,255,.14); }
    .btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }
    .row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    input[type="text"] { width: 100%; padding: 11px 13px; border-radius: 10px; border: 1px solid rgba(255,255,255,.16); background: rgba(0,0,0,.35); color: var(--text); font-size: 0.95rem; margin-top: 8px; outline: none; }
    input[type="text"]:focus { border-color: var(--accent); }
    .hint { font-size: 0.83rem; color: var(--muted); margin-top: 8px; line-height: 1.45; }
    .msg { margin-top: 10px; padding: 11px 13px; border-radius: 10px; font-size: 0.88rem; display: none; line-height: 1.45; }
    .msg.show { display: block; }
    .msg.ok { background: rgba(34,197,94,.15); color: #bbf7d0; border: 1px solid rgba(34,197,94,.35); }
    .msg.err { background: rgba(239,68,68,.15); color: #fecaca; border: 1px solid rgba(239,68,68,.35); }
    .tabs { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
    .tab { padding: 7px 12px; border-radius: 9px; font-size: 0.82rem; font-weight: 600; cursor: pointer; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: var(--muted); }
    .tab.active { color: var(--text); border-color: var(--accent); background: rgba(255,255,255,.12); }
    .panel { display: none; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.07); }
    .panel.active { display: block; }
    code.inline { background: rgba(0,0,0,.45); padding: 3px 7px; border-radius: 6px; font-size: 0.86em; color: #fde047; }
    .foot { margin-top: 22px; font-size: 0.82rem; color: var(--muted); text-align: center; }
    .foot a { color: #93c5fd; text-decoration: none; }
  </style>
</head>
<body>
  <canvas id="confetti-canvas"></canvas>
  <div class="wrap">
    <div class="badge">⚡ HIZLI DOĞRULA • SENTARA</div>
    <h1>${escapeHtml(meta.title)}</h1>
    <p class="sub">${escapeHtml(meta.subtitle)}</p>

    <div class="stepper">
      <div id="sp1" class="step-pill active">1. Discord Doğrula</div>
      <div id="sp2" class="step-pill">2. Roblox Doğrula</div>
      <div id="sp3" class="step-pill">3. ARTIK HAZIRSIN!</div>
    </div>

    <div id="ready-banner" class="ready-banner">
      <h2>🎉 ARTIK HAZIRSIN!</h2>
      <p id="ready-sub">Discord ve Roblox hesabın başarıyla doğrulandı, sunucu rollerin senkronize edildi!</p>
      <div class="row" style="justify-content:center;margin-top:14px;">
        <button type="button" class="btn success" onclick="launchConfetti()">🎊 Tekrar Kutla</button>
        <a class="btn secondary" href="${dashUrl}">Panele Git</a>
      </div>
    </div>

    <div id="card-discord" class="card">
      <div class="step-head">
        <span class="step-title">1️⃣ Discord Doğrula</span>
        <span id="st-discord" class="pill wait">Kontrol…</span>
      </div>
      <p id="tx-discord" class="hint">Discord hesabınla giriş yaparak doğrulamayı başlat.</p>
      <div class="row">
        <a id="btn-discord" class="btn discord" href="${discordLoginUrl}">💬 Discord Doğrula</a>
      </div>
    </div>

    <div id="card-roblox" class="card">
      <div class="step-head">
        <span class="step-title">2️⃣ Roblox Doğrula</span>
        <span id="st-roblox" class="pill wait">Bekliyor</span>
      </div>
      <p id="tx-roblox" class="hint">Sana en uygun yöntemle Roblox hesabını doğrula:</p>
      <div class="tabs">
        <button type="button" class="tab active" data-tab="friend">🤝 Arkadaşlık İsteği (yildiznqt)</button>
        <button type="button" class="tab" data-tab="oauth">🌐 Roblox OAuth2</button>
        <button type="button" class="tab" data-tab="bio">📝 Profil Açıklaması</button>
      </div>
      <div id="panel-friend" class="panel active">
        <p class="hint">Roblox kullanıcı adını yaz ➔ <strong>yildiznqt</strong> bot profiline arkadaşlık isteği gönder ➔ <strong>Arkadaşlığı Doğrula</strong> butonuna bas.</p>
        <input type="text" id="inp-rbx-user" placeholder="Roblox kullanıcı adın (örn. Builderman)" autocomplete="username"/>
        <div class="row">
          <button type="button" class="btn roblox" id="btn-friend-start">1. Kullanıcıyı Kontrol Et</button>
          <a id="btn-bot-profile" class="btn secondary" href="https://www.roblox.com/users/11940372682/profile" target="_blank" rel="noopener">2. yildiznqt Profilini Aç (İstek Gönder)</a>
          <button type="button" class="btn success" id="btn-friend-check" disabled>3. ✅ Arkadaşlığı Doğrula</button>
        </div>
        <div id="msg-friend" class="msg"></div>
      </div>
      <div id="panel-oauth" class="panel">
        <p class="hint">Resmi Roblox giriş sayfası üzerinden tek tıkla güvenli bağlan.</p>
        <div class="row">
          <a id="btn-roblox-oauth" class="btn roblox" href="${robloxOAuthUrl}">🌐 Roblox ile Doğrula (OAuth2)</a>
        </div>
      </div>
      <div id="panel-bio" class="panel">
        <p class="hint">Roblox kullanıcı adını gir, verilen kodu Roblox profil <strong>About / Açıklama</strong> kısmına yapıştır ve doğrula.</p>
        <input type="text" id="inp-bio-user" placeholder="Roblox kullanıcı adın"/>
        <div class="row">
          <button type="button" class="btn secondary" id="btn-bio-start">Kod Oluştur</button>
          <button type="button" class="btn success" id="btn-bio-check" disabled>✅ Açıklamayı Doğrula</button>
        </div>
        <p id="bio-code-box" class="hint" style="display:none;">Profil açıklamana eklenecek kod: <code class="inline" id="bio-code"></code></p>
        <div id="msg-bio" class="msg"></div>
      </div>
    </div>

    <div id="card-sync" class="card">
      <div class="step-head">
        <span class="step-title">3️⃣ Rol Senkronizasyonu</span>
        <span id="st-sync" class="pill wait">Hazır değil</span>
      </div>
      <p class="hint">Discord ve Roblox doğrulandığında rollerin otomatik olarak senkronize edilir!</p>
      <div class="row">
        <button type="button" class="btn success" id="btn-sync" disabled>🔄 Rollerimi Şimdi Eşitle</button>
      </div>
      <div id="msg-sync" class="msg"></div>
    </div>

    <p class="foot">Tam kontrol paneli: <a href="${dashUrl}">Dashboard</a></p>
  </div>

  <script>
    const SYNC_BODY = ${JSON.stringify(meta.syncBody)};
    let lastVerifyRobloxId = null;
    let bioRobloxId = null;
    let autoSyncedOnce = false;

    function launchConfetti() {
      const canvas = document.getElementById('confetti-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4', '#facc15'];
      const pieces = Array.from({ length: 140 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height * 0.5 - 10,
        w: 7 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 5,
        vy: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.2
      }));
      let frame = 0;
      function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        for (const p of pieces) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.rot += p.vrot;
          if (p.y < canvas.height + 30) alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
        frame++;
        if (alive && frame < 240) requestAnimationFrame(tick);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      requestAnimationFrame(tick);
    }

    function showReadyBanner(customText) {
      const b = document.getElementById('ready-banner');
      if (customText) document.getElementById('ready-sub').textContent = customText;
      if (!b.classList.contains('show')) {
        b.classList.add('show');
        launchConfetti();
      }
      document.getElementById('sp3').className = 'step-pill done';
    }

    function showMsg(el, text, ok) {
      el.textContent = text;
      el.className = 'msg show ' + (ok ? 'ok' : 'err');
    }

    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const id = 'panel-' + btn.getAttribute('data-tab');
        const p = document.getElementById(id);
        if (p) p.classList.add('active');
      });
    });

    async function runRoleSync(silent) {
      const btnSync = document.getElementById('btn-sync');
      const m = document.getElementById('msg-sync');
      const stSync = document.getElementById('st-sync');
      btnSync.disabled = true;
      stSync.textContent = 'Eşitleniyor…';
      if (!silent) m.className = 'msg';
      try {
        const r = await fetch('/api/verify/sync-roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(SYNC_BODY),
        });
        const j = await r.json();
        if (!r.ok || !j.success) {
          stSync.textContent = 'Tamamlandı';
          stSync.className = 'pill ok';
          showMsg(m, j.error || 'Hesabın bağlandı! Sunucuda /dogrula komutu ile de rollerini yenileyebilirsin.', true);
          showReadyBanner('Discord ve Roblox hesabın bağlandı! ARTIK HAZIRSIN!');
        } else {
          const extra = [
            j.addedRoles && j.addedRoles.length ? ('Eklenen: ' + j.addedRoles.join(', ')) : '',
            j.removedRoles && j.removedRoles.length ? ('Kaldırılan: ' + j.removedRoles.join(', ')) : '',
          ].filter(Boolean).join(' • ');
          stSync.textContent = 'Hazır ✓';
          stSync.className = 'pill ok';
          document.getElementById('card-sync').classList.add('done-card');
          showMsg(m, (j.message || 'Rollerin başarıyla güncellendi!') + (extra ? ' (' + extra + ')' : ''), true);
          showReadyBanner((j.message || 'Rollerin başarıyla senkronize edildi!') + (extra ? ' — ' + extra : ''));
        }
      } catch (e) {
        showMsg(m, 'Bağlantı hatası: ' + e.message, false);
      }
      btnSync.disabled = false;
    }

    async function refreshMe() {
      const stD = document.getElementById('st-discord');
      const txD = document.getElementById('tx-discord');
      const btnD = document.getElementById('btn-discord');
      const stR = document.getElementById('st-roblox');
      const txR = document.getElementById('tx-roblox');
      const stS = document.getElementById('st-sync');
      const btnS = document.getElementById('btn-sync');

      try {
        const r = await fetch('/api/me', { credentials: 'same-origin' });
        if (!r.ok) {
          stD.textContent = 'Giriş gerekli';
          stD.className = 'pill wait';
          btnS.disabled = true;
          return;
        }
        const me = await r.json();
        stD.textContent = 'Doğrulandı ✓';
        stD.className = 'pill ok';
        txD.textContent = 'Discord: ' + (me.username || me.discordId);
        btnD.textContent = '✅ Discord Bağlı (' + (me.username || 'Hesap Değiştir') + ')';
        btnD.className = 'btn secondary';
        document.getElementById('card-discord').classList.add('done-card');
        document.getElementById('sp1').className = 'step-pill done';
        document.getElementById('sp2').className = 'step-pill active';

        if (me.robloxId) {
          stR.textContent = 'Doğrulandı ✓';
          stR.className = 'pill ok';
          txR.textContent = 'Roblox: ' + (me.robloxUsername || '') + ' (ID: ' + me.robloxId + ')';
          document.getElementById('card-roblox').classList.add('done-card');
          document.getElementById('sp2').className = 'step-pill done';
          stS.textContent = 'Hazır';
          stS.className = 'pill ok';
          btnS.disabled = false;
          if (!autoSyncedOnce) {
            autoSyncedOnce = true;
            await runRoleSync(true);
          }
        } else {
          stR.textContent = 'Doğrulanmadı';
          stR.className = 'pill wait';
          stS.textContent = 'Önce Roblox doğrula';
          stS.className = 'pill wait';
          btnS.disabled = true;
        }
      } catch (e) {
        stD.textContent = 'Hata';
        txD.textContent = 'Durum alınamadı, sayfayı yenile.';
      }
    }

    document.getElementById('btn-friend-start').addEventListener('click', async () => {
      const u = document.getElementById('inp-rbx-user').value.trim();
      const m = document.getElementById('msg-friend');
      m.className = 'msg';
      if (!u) return showMsg(m, 'Lütfen Roblox kullanıcı adını yaz.', false);
      try {
        const r = await fetch('/api/roblox/verify/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ username: u, method: 'friend' }),
        });
        const j = await r.json();
        if (!r.ok || !j.success) return showMsg(m, j.error || 'İşlem başarısız', false);
        lastVerifyRobloxId = j.robloxId;
        if (j.botProfileUrl) {
          document.getElementById('btn-bot-profile').href = j.botProfileUrl;
        }
        document.getElementById('btn-friend-check').disabled = false;
        showMsg(m, 'Harika! Şimdi "2. yildiznqt Profilini Aç" butonuna tıklayıp arkadaşlık isteği gönder, ardından "3. Arkadaşlığı Doğrula" butonuna bas.', true);
      } catch (e) {
        showMsg(m, 'İstek hatası: ' + e.message, false);
      }
    });

    document.getElementById('btn-friend-check').addEventListener('click', async () => {
      const m = document.getElementById('msg-friend');
      m.className = 'msg';
      if (!lastVerifyRobloxId) return showMsg(m, 'Önce "1. Kullanıcıyı Kontrol Et" adımını tamamla.', false);
      try {
        const r = await fetch('/api/roblox/verify/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ robloxId: lastVerifyRobloxId, method: 'friend' }),
        });
        const j = await r.json();
        if (!r.ok || !j.verified) return showMsg(m, j.error || 'Arkadaşlık isteği henüz görünmüyor. yildiznqt profiline istek gönderip tekrar dene.', false);
        showMsg(m, '🎉 Roblox hesabın doğrulandı! Rollerin eşitleniyor…', true);
        autoSyncedOnce = false;
        await refreshMe();
      } catch (e) {
        showMsg(m, 'Doğrulama hatası: ' + e.message, false);
      }
    });

    document.getElementById('btn-bio-start').addEventListener('click', async () => {
      const u = document.getElementById('inp-bio-user').value.trim();
      const m = document.getElementById('msg-bio');
      m.className = 'msg';
      if (!u) return showMsg(m, 'Kullanıcı adı gir.', false);
      try {
        const r = await fetch('/api/roblox/verify/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ username: u, method: 'bio' }),
        });
        const j = await r.json();
        if (!r.ok || !j.success) return showMsg(m, j.error || 'Başarısız', false);
        bioRobloxId = j.robloxId;
        document.getElementById('bio-code').textContent = j.code || '';
        document.getElementById('bio-code-box').style.display = 'block';
        document.getElementById('btn-bio-check').disabled = false;
        showMsg(m, 'Kodu Roblox profil açıklamana (About) kaydedip "Açıklamayı Doğrula"ya bas.', true);
      } catch (e) {
        showMsg(m, e.message, false);
      }
    });

    document.getElementById('btn-bio-check').addEventListener('click', async () => {
      const m = document.getElementById('msg-bio');
      m.className = 'msg';
      if (!bioRobloxId) return showMsg(m, 'Önce kod oluştur.', false);
      try {
        const r = await fetch('/api/roblox/verify/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ robloxId: bioRobloxId, method: 'bio' }),
        });
        const j = await r.json();
        if (!r.ok || !j.verified) return showMsg(m, j.error || 'Kod profil açıklamanda bulunamadı.', false);
        showMsg(m, '🎉 Roblox hesabın doğrulandı! Rollerin eşitleniyor…', true);
        autoSyncedOnce = false;
        await refreshMe();
      } catch (e) {
        showMsg(m, e.message, false);
      }
    });

    document.getElementById('btn-sync').addEventListener('click', () => runRoleSync(false));

    refreshMe();
  </script>
</body>
</html>`);
});

module.exports = router;
