'use strict';

const { isSiteAdmin, isSiteStaff } = require("../utils/adminCheck");

// ─────────────────────────────────────────────
// SHARED LAYOUT HELPER  (declared ONCE at top)
// ─────────────────────────────────────────────
function _layout(title, user, content, extraHead = '', activePath = '') {
  const staffLinks = user && isSiteStaff(user)
    ? `<a href="/staff" class="nav-link staff-link${activePath === '/staff' ? ' nav-active' : ''}">👨‍💼 Staff</a>`
    : '';
  const adminLink = user && isSiteAdmin(user)
    ? `<a href="/admin" class="nav-link debug-link${activePath === '/admin' ? ' nav-active' : ''}">⚙️ Admin</a>`
    : '';

  const isOwner = user && user.discordUsername === "ekonqtx";
  const { groupAdmins } = require("../models/Store");
  const isGrpAdmin = user && (isOwner || groupAdmins.findOne({ username: user.discordUsername }));
  const groupAdminLink = isGrpAdmin
    ? `<a href="/group-admin" class="nav-link${activePath === '/group-admin' ? ' nav-active' : ''}">⚙️ Grup Yönetimi</a>`
    : '';

  function navLink(href, label) {
    const active = activePath === href ? ' nav-active' : '';
    return `<a href="${href}" class="nav-link${active}">${label}</a>`;
  }

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${_esc(title)} — Sentara Premium</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  ${extraHead}
  <style>
    :root {
      --bg:       #06060e;
      --surface:  rgba(255,255,255,0.035);
      --border:   rgba(255,255,255,0.08);
      --accent:   #a78bfa;
      --accent2:  #818cf8;
      --text:     #f0f0f8;
      --muted:    #7c7c9a;
      --success:  #34d399;
      --warning:  #fbbf24;
      --danger:   #fb7185;
      --glass-blur: 20px;
      --glass-glow: inset 0 1px 0 rgba(255,255,255,0.06);
    }
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body {
      background: var(--bg);
      background-image:
        radial-gradient(ellipse 80% 60% at 10% 0%, rgba(99,102,241,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 90% 100%, rgba(139,92,246,0.06) 0%, transparent 50%),
        radial-gradient(ellipse 50% 40% at 50% 50%, rgba(99,102,241,0.03) 0%, transparent 50%);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }
    body::before {
      content:'';
      position:fixed; inset:0; z-index:0; pointer-events:none;
      background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E");
      opacity:0.4;
    }

    /* ── Ambient Glow ── */
    body::after {
      content:'';
      position:fixed; top:-30%; left:-10%; width:50vw; height:50vw;
      background: radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%);
      pointer-events:none; z-index:0;
      animation: ambientDrift 20s ease-in-out infinite alternate;
    }
    @keyframes ambientDrift {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(15vw, 20vh) scale(1.2); }
    }

    /* ── Header ── */
    header {
      background: rgba(6,6,14,0.45);
      backdrop-filter: blur(28px) saturate(1.2);
      -webkit-backdrop-filter: blur(28px) saturate(1.2);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 50px;
      padding: 0.6rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 1.5rem;
      z-index: 200;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5), var(--glass-glow);
      max-width: 1200px;
      margin: 1.5rem auto 0;
      width: calc(100% - 3rem);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      color: inherit;
      flex-shrink: 0;
    }
    .logo span {
      font-weight: 800;
      font-size: 1.4rem;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .nav-links {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .nav-link {
      color: var(--muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      transition: color 0.3s, background 0.3s;
      padding: 0.45rem 0.9rem;
      border-radius: 30px;
      position: relative;
    }
    .nav-link::after {
      content:'';
      position: absolute;
      bottom: 0.2rem; left: 50%;
      width: 0; height: 2px;
      background: var(--accent);
      transition: width 0.3s ease, left 0.3s ease;
      border-radius: 1px;
    }
    .nav-link:hover { color: var(--text); background: rgba(255,255,255,0.04); }
    .nav-link:hover::after { width:40%; left:30%; }
    .nav-link.staff-link { color: var(--accent); }
    .nav-link.debug-link  { color: var(--danger); }
    .nav-link.logout-link { color: var(--danger); }
    .nav-link.logout-link::after { background: var(--danger); }
    .nav-link.nav-active { color: var(--text); background: rgba(255,255,255,0.05); }
    .nav-link.nav-active::after { width: 40%; left:30%; }

    /* ── Hamburger ── */
    .hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      cursor: pointer;
      padding: 0.5rem;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      background: rgba(255,255,255,0.03);
      transition: background 0.2s;
    }
    .hamburger:hover { background: rgba(255,255,255,0.06); }
    .hamburger span {
      display: block;
      width: 20px; height: 2px;
      background: var(--text);
      border-radius: 2px;
      transition: transform 0.3s, opacity 0.3s;
    }
    .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity: 0; }
    .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
    @media (max-width: 768px) {
      .hamburger { display: flex; }
      .nav-links {
        display: none;
        position: absolute;
        top: 100%;
        left: 0; right: 0;
        background: rgba(6,6,14,0.92);
        backdrop-filter: blur(28px);
        border-bottom: 1px solid rgba(255,255,255,0.05);
        padding: 1rem 2rem;
        flex-direction: column;
        gap: 0.25rem;
        z-index: 199;
      }
      .nav-links.open { display: flex; }
      .nav-link { padding: 0.7rem 0.75rem; font-size: 0.95rem; width:100%; }
    }

    /* ── Main & Card ── */
    main { max-width: 1000px; margin: 0 auto; padding: 3rem 2rem; position:relative; z-index:1; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 2rem;
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      box-shadow: 0 8px 32px rgba(0,0,0,0.2), var(--glass-glow);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .card:hover {
      border-color: rgba(255,255,255,0.12);
    }
    .card + .card { margin-top: 2rem; }

    /* ── Buttons ── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.4rem;
      background: rgba(167,139,250,0.18);
      border: 1px solid rgba(167,139,250,0.25);
      color: var(--accent);
      border-radius: 12px;
      cursor: pointer;
      font-family: inherit;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 2px 12px rgba(167,139,250,0.1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      position: relative;
      overflow: hidden;
    }
    .btn::before {
      content:''; position:absolute; inset:0;
      background: linear-gradient(135deg, rgba(167,139,250,0.08), rgba(129,140,248,0.04));
      opacity:0; transition: opacity 0.3s;
    }
    .btn:hover {
      background: rgba(167,139,250,0.28);
      border-color: rgba(167,139,250,0.4);
      color: #fff;
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(167,139,250,0.2);
    }
    .btn:hover::before { opacity:1; }
    .btn:active { transform: translateY(0); }
    .btn-sm { padding: 0.45rem 0.9rem; font-size: 0.82rem; border-radius:10px; }
    .btn-danger {
      background: rgba(251,113,133,0.15);
      border-color: rgba(251,113,133,0.25);
      color: var(--danger);
      box-shadow: 0 2px 12px rgba(251,113,133,0.1);
    }
    .btn-danger:hover {
      background: rgba(251,113,133,0.28);
      border-color: rgba(251,113,133,0.4);
      color:#fff;
      box-shadow: 0 6px 24px rgba(251,113,133,0.2);
    }
    .btn-success {
      background: rgba(52,211,153,0.15);
      border-color: rgba(52,211,153,0.25);
      color: var(--success);
      box-shadow: 0 2px 12px rgba(52,211,153,0.1);
    }
    .btn-success:hover {
      background: rgba(52,211,153,0.28);
      border-color: rgba(52,211,153,0.4);
      color:#fff;
      box-shadow: 0 6px 24px rgba(52,211,153,0.2);
    }
    .btn-ghost {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      color: var(--muted);
      box-shadow: none;
      backdrop-filter: none;
    }
    .btn-ghost:hover {
      background: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.15);
      color: var(--text);
      box-shadow: none;
    }

    /* ── Form elements ── */
    label { display: block; margin-bottom: 0.4rem; color: var(--muted); font-size: 0.85rem; font-weight: 500; letter-spacing:0.3px; }
    input, textarea, select {
      width: 100%;
      padding: 0.85rem 1rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      color: var(--text);
      font-family: inherit;
      font-size: 0.92rem;
      margin-bottom: 1.2rem;
      outline: none;
      transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    input:focus, textarea:focus, select:focus {
      border-color: rgba(167,139,250,0.4);
      box-shadow: 0 0 0 3px rgba(167,139,250,0.08), 0 0 20px rgba(167,139,250,0.05);
      background: rgba(255,255,255,0.04);
    }
    input::placeholder, textarea::placeholder { color: rgba(124,124,154,0.5); }
    select option { background: #0e0e1a; }

    /* ── Badges ── */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.7rem;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
    }
    .badge-open    { background: rgba(52,211,153,0.1);  color: var(--success); border: 1px solid rgba(52,211,153,0.2); }
    .badge-closed  { background: rgba(251,113,133,0.1); color: var(--danger);  border: 1px solid rgba(251,113,133,0.2); }
    .badge-pending { background: rgba(251,191,36,0.1);  color: var(--warning); border: 1px solid rgba(251,191,36,0.2); }
    .badge-admin   { background: rgba(129,140,248,0.1); color: var(--accent2); border: 1px solid rgba(129,140,248,0.2); }

    /* ── Toast ── */
    #toast-container {
      position: fixed;
      bottom: 2rem; right: 2rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
    }
    .toast {
      padding: 0.9rem 1.4rem;
      border-radius: 14px;
      font-weight: 600;
      font-size: 0.9rem;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid;
      animation: toastIn 0.35s ease, toastOut 0.35s ease 2.7s forwards;
      pointer-events: auto;
      max-width: 340px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3), var(--glass-glow);
    }
    .toast-success { background: rgba(52,211,153,0.12);  color: var(--success); border-color: rgba(52,211,153,0.2); }
    .toast-error   { background: rgba(251,113,133,0.12); color: var(--danger);  border-color: rgba(251,113,133,0.2); }
    .toast-info    { background: rgba(167,139,250,0.12); color: var(--accent);  border-color: rgba(167,139,250,0.2); }
    .toast-warning { background: rgba(251,191,36,0.12);  color: var(--warning); border-color: rgba(251,191,36,0.2); }
    .toast-inner   { display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem; }
    .toast-close   { cursor:pointer; opacity:0.5; flex-shrink:0; font-size:0.9rem; background:none; border:none; color:inherit; padding:0; line-height:1; transition:opacity 0.2s; }
    .toast-close:hover { opacity:1; }
    @keyframes toastIn  { from { opacity:0; transform:translateY(12px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes toastOut { from { opacity:1; } to { opacity:0; transform:translateY(-8px) scale(0.95); } }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width:6px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:3px; }
    ::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.15); }

    /* ── Misc ── */
    .text-muted  { color: var(--muted); }
    .text-accent { color: var(--accent); }
    .text-danger { color: var(--danger); }
    .text-success{ color: var(--success); }
    .mt-1 { margin-top: 0.5rem; }
    .mt-2 { margin-top: 1rem; }
    .mt-3 { margin-top: 1.5rem; }
    .mb-2 { margin-bottom: 1rem; }
    .mb-3 { margin-bottom: 1.5rem; }
    .d-flex { display:flex; }
    .align-center { align-items:center; }
    .gap-1 { gap:0.5rem; }
    .gap-2 { gap:1rem; }
    .w-full { width:100%; }
    hr.divider { border:none; border-top:1px solid rgba(255,255,255,0.06); margin:2rem 0; }

    /* ── Selection ── */
    ::selection { background: rgba(167,139,250,0.3); color:#fff; }

    /* ── Responsive ── */
    @media (max-width:768px) {
      header { flex-wrap:wrap; gap:0.75rem; }
      .nav-links { width:100%; flex-wrap:wrap; gap:0.75rem; }
      main { padding: 2rem 1rem; }
    }
  </style>
</head>
<body>
  <header>
    <a href="/" class="logo" style="display:flex; align-items:center; gap:0.75rem; text-decoration:none;">
      <img src="https://i.imgur.com/PFcAc6q.png" alt="Sentara Logo" style="width:36px; height:36px; border-radius:10px; filter: drop-shadow(0 0 10px rgba(244,63,94,0.6)); flex-shrink:0;">
      <span style="font-weight:800; font-size:1.4rem; background: linear-gradient(135deg, #ffffff 0%, #fda4af 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">EkoYıldız</span>
    </a>
    <button class="hamburger" id="hamburger" aria-label="Menü" onclick="this.classList.toggle('open');document.getElementById('nav-links').classList.toggle('open')">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav-links" id="nav-links">
      ${navLink('/', 'Ana Sayfa')}
      ${user && isSiteStaff(user) ? navLink('/leaderboard', '🏆 Sıralama (Mod)') : ''}
      ${groupAdminLink}
      ${staffLinks}
      ${adminLink}
      ${user ? `<a href="/dashboard" class="nav-link">Dashboard</a><a href="/settings" class="nav-link">⚙️ Ayarlar</a><a href="/profile" class="nav-link">${_esc(user.username || user.discordUsername)}</a><a href="/logout" class="nav-link logout-link">Çıkış</a>` : `<button onclick="openLoginModal()" style="padding:0.5rem 1.3rem; border-radius:30px; background:linear-gradient(135deg, #f43f5e, #e11d48); color:#fff; border:none; font-weight:700; cursor:pointer; font-family:inherit; box-shadow: 0 4px 15px rgba(244,63,94,0.4);">Giriş Yap</button>`}
    </nav>
  </header>

  <div id="toast-container"></div>

  <main>
    ${content}
  </main>

  <script>
    // ── Toast utility ──
    function showToast(msg, type = 'info', duration = 3500) {
      const c = document.getElementById('toast-container');
      if (!c) return;
      const t = document.createElement('div');
      t.className = 'toast toast-' + type;
      t.innerHTML = \`<div class="toast-inner"><span>\${msg}</span><button class="toast-close" onclick="this.closest('.toast').remove()">✕</button></div>\`;
      c.appendChild(t);
      const timer = setTimeout(() => t.remove(), duration);
      t.querySelector('.toast-close').addEventListener('click', () => clearTimeout(timer));
    }
    window.showToast = showToast;

    // ── Confirm util ──
    function confirmAction(msg) {
      return new Promise(resolve => resolve(window.confirm(msg)));
    }
    window.confirmAction = confirmAction;

    // ── Close mobile nav on outside click ──
    document.addEventListener('click', (e) => {
      const nav = document.getElementById('nav-links');
      const btn = document.getElementById('hamburger');
      if (nav && btn && !nav.contains(e.target) && !btn.contains(e.target)) {
        nav.classList.remove('open');
        btn.classList.remove('open');
      }
    });

    // ── Live Activity Tracker ──
    const ACT_PING_FREQ = 2000; // 2 seconds
    let actClicks = [];
    let actPos = { x: 0, y: 0 };
    
    document.addEventListener('mousemove', (e) => {
      actPos.x = e.clientX;
      actPos.y = e.clientY;
    }, { passive: true });

    document.addEventListener('click', (e) => {
      let tText = (e.target.innerText || e.target.tagName || "").trim().replace(/\\n/g, ' ');
      if (tText.length > 50) tText = tText.substring(0, 50) + "...";
      actClicks.push({ x: e.clientX, y: e.clientY, t: Date.now(), element: tText });
    }, { passive: true });

    setInterval(() => {
      if (!document.hidden) {
        fetch('/api/activity/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            x: actPos.x,
            y: actPos.y,
            w: window.innerWidth,
            h: window.innerHeight,
            url: window.location.pathname,
            clicks: actClicks
          })
        }).catch(() => {});
        actClicks = [];
      }
    }, ACT_PING_FREQ);

    // ── Browser Notification System ──
    const userLoggedIn = ${user ? 'true' : 'false'};
    if (userLoggedIn && window.Notification) {
      function syncBrowserNotificationStatus() {
        if (Notification.permission === 'granted') {
          fetch('/api/notifications/browser-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true })
          }).catch(() => {});
        }
      }

      function askPermission() {
        if (Notification.permission === 'default') {
          try {
            const promise = Notification.requestPermission(permission => {
              if (permission === 'granted') {
                syncBrowserNotificationStatus();
              }
            });
            if (promise && typeof promise.then === 'function') {
              promise.then(permission => {
                if (permission === 'granted') {
                  syncBrowserNotificationStatus();
                }
              }).catch(() => {});
            }
          } catch (e) {
            Notification.requestPermission(permission => {
              if (permission === 'granted') {
                syncBrowserNotificationStatus();
              }
            });
          }
        }
      }

      // Try immediately on page load
      askPermission();

      // Fallback: ask on first click gesture if permission is still default
      document.addEventListener('click', () => {
        if (Notification.permission === 'default') {
          askPermission();
        }
      }, { once: true });

      // If already granted, sync status to backend
      if (Notification.permission === 'granted') {
        syncBrowserNotificationStatus();
      }
      
      let shownNotifs = [];
      try {
        shownNotifs = JSON.parse(localStorage.getItem('shown_browser_notifications') || '[]');
      } catch (e) {
        shownNotifs = [];
      }
      
      function checkBrowserNotifications() {
        if (Notification.permission !== 'granted') return;
        
        fetch('/api/notifications/unread')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.notifications) {
              let updated = false;
              data.notifications.forEach(n => {
                if (!shownNotifs.includes(n.id)) {
                  shownNotifs.push(n.id);
                  updated = true;
                  
                  // Trigger browser notification
                  new Notification(n.title || 'Sentara Bildirimi', {
                    body: n.message || '',
                    icon: '/favicon.ico'
                  });
                }
              });
              
              if (updated) {
                if (shownNotifs.length > 200) {
                  shownNotifs = shownNotifs.slice(-100);
                }
                localStorage.setItem('shown_browser_notifications', JSON.stringify(shownNotifs));
              }
            }
          })
          .catch(() => {});
      }
      
      // Poll every 10 seconds
      setInterval(checkBrowserNotifications, 10000);
      // Run once immediately on load
      setTimeout(checkBrowserNotifications, 1500);
    }
  </script>
</body>
</html>`;
}


// ─────────────────────────────────────────────
// UTILITY: HTML escape (XSS prevention)
// ─────────────────────────────────────────────
function _esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
function renderMainPage(user = null) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EkoYıldız — Resmi Topluluk & Destek Portalı</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07070f;
      --surface: rgba(255,255,255,0.03);
      --border: rgba(244,63,94,0.2);
      --accent: #f43f5e;
      --accent-hover: #e11d48;
      --accent2: #fb7185;
      --text: #f8fafc;
      --muted: #94a3b8;
      --glass-blur: 24px;
    }
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body {
      background: var(--bg);
      background-image:
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(244,63,94,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 85% 90%, rgba(225,29,72,0.08) 0%, transparent 50%),
        radial-gradient(circle at 10% 80%, rgba(244,63,94,0.06) 0%, transparent 40%);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }
    .glow {
      position:fixed; width:500px; height:500px; border-radius:50%;
      opacity:0.1; z-index:0; filter:blur(180px); pointer-events:none;
      animation: floatGlow 16s infinite ease-in-out alternate;
    }
    .glow-1 { background:#f43f5e; top:-150px; right:-150px; }
    .glow-2 { background:#fb7185; bottom:-150px; left:-150px; animation-delay:-8s; }
    @keyframes floatGlow {
      0% { transform: scale(1) translate(0,0); }
      100% { transform: scale(1.15) translate(20px,30px); }
    }

    header {
      background: rgba(10,10,20,0.55);
      backdrop-filter: blur(28px) saturate(1.3);
      -webkit-backdrop-filter: blur(28px) saturate(1.3);
      border: 1px solid rgba(244,63,94,0.25);
      border-radius: 50px;
      padding: 0.65rem 2rem;
      display: flex; justify-content: space-between; align-items: center;
      position: sticky; top: 1.5rem; z-index: 200;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08);
      max-width: 1200px; margin: 1.5rem auto 0;
      width: calc(100% - 3rem);
    }
    .logo {
      display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit;
    }
    .logo span {
      font-weight: 800; font-size: 1.45rem;
      background: linear-gradient(135deg, #ffffff 0%, #fda4af 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }
    nav { display: flex; gap: 1rem; align-items: center; }
    nav a {
      color: var(--muted); text-decoration: none; font-weight: 500; font-size: 0.95rem;
      padding: 0.45rem 0.9rem; border-radius: 30px; transition: all 0.3s;
    }
    nav a:hover { color: var(--text); background: rgba(255,255,255,0.05); }

    .nav-btn-login {
      background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
      border: 1px solid rgba(244,63,94,0.4);
      color: #fff; border-radius: 30px; font-weight: 700; font-size: 0.95rem;
      padding: 0.55rem 1.4rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;
      box-shadow: 0 4px 20px rgba(244,63,94,0.35); transition: all 0.3s; text-decoration: none;
    }
    .nav-btn-login:hover {
      transform: translateY(-2px); box-shadow: 0 8px 30px rgba(244,63,94,0.5);
      background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%);
    }

    .hero-container {
      max-width: 1200px; margin: 4rem auto 2rem; padding: 0 2rem;
      display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 3rem; align-items: center;
      position: relative; z-index: 10;
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 0.6rem;
      background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.3);
      padding: 0.45rem 1.2rem; border-radius: 30px; font-size: 0.88rem; font-weight: 600;
      color: #fda4af; margin-bottom: 1.5rem; backdrop-filter: blur(10px);
    }
    .hero-title {
      font-size: 3.4rem; font-weight: 800; line-height: 1.15; margin-bottom: 1.5rem; letter-spacing: -1px; min-height: 140px;
    }
    .hero-grad {
      background: linear-gradient(135deg, #f43f5e 0%, #fda4af 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .typewriter-cursor {
      font-weight: 300; color: #f43f5e; animation: blinkCursor 0.75s infinite; margin-left: 2px;
    }
    @keyframes blinkCursor {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .hero-sub {
      color: var(--muted); font-size: 1.15rem; line-height: 1.8; font-weight: 300; margin-bottom: 2.5rem; max-width: 600px;
    }
    .hero-cta { display: flex; gap: 1rem; flex-wrap: wrap; }
    
    .btn-hero-primary {
      padding: 0.95rem 2.2rem; background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
      color: #fff; border-radius: 30px; font-weight: 700; font-size: 1.05rem;
      border: 1px solid rgba(244,63,94,0.4); text-decoration: none; cursor: pointer;
      box-shadow: 0 10px 30px rgba(244,63,94,0.4); transition: all 0.3s ease;
      display: inline-flex; align-items: center; gap: 0.6rem;
    }
    .btn-hero-primary:hover {
      transform: translateY(-3px) scale(1.02); box-shadow: 0 14px 40px rgba(244,63,94,0.6);
    }
    .btn-hero-secondary {
      padding: 0.95rem 1.8rem; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.12); color: #fff; border-radius: 30px;
      font-weight: 600; font-size: 1rem; text-decoration: none; cursor: pointer;
      transition: all 0.3s; backdrop-filter: blur(10px); display: inline-flex; align-items: center; gap: 0.6rem;
    }
    .btn-hero-secondary:hover {
      border-color: rgba(244,63,94,0.4); background: rgba(244,63,94,0.08); color: #fda4af;
      transform: translateY(-2px);
    }

    .hero-mascot-box {
      position: relative; display: flex; justify-content: center; align-items: center;
    }
    .hero-mascot-glow {
      position: absolute; width: 320px; height: 320px; border-radius: 50%;
      background: radial-gradient(circle, rgba(244,63,94,0.35) 0%, transparent 70%);
      filter: blur(40px); animation: pulseMascot 4s infinite alternate ease-in-out;
    }
    @keyframes pulseMascot {
      0% { transform: scale(0.9); opacity: 0.6; }
      100% { transform: scale(1.15); opacity: 1; }
    }
    .hero-mascot-img {
      width: 100%; max-width: 380px; height: auto; position: relative; z-index: 2;
      filter: drop-shadow(0 15px 35px rgba(0,0,0,0.7));
      transition: transform 0.4s ease;
    }
    .hero-mascot-img:hover { transform: translateY(-8px) scale(1.03); }

    .section-container { max-width: 1200px; margin: 5rem auto; padding: 0 2rem; position: relative; z-index: 10; }
    .section-header { text-align: center; margin-bottom: 3rem; }
    .section-tag { color: #f43f5e; font-weight: 700; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 0.5rem; }
    .section-title { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.5px; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px; padding: 1.8rem 1.2rem; text-align: center;
      backdrop-filter: blur(20px); transition: all 0.35s ease; position: relative; overflow: hidden;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .stat-card:hover {
      transform: translateY(-6px); border-color: rgba(244,63,94,0.4);
      box-shadow: 0 16px 36px rgba(244,63,94,0.15), inset 0 1px 0 rgba(255,255,255,0.1);
    }
    .stat-icon { font-size: 2rem; margin-bottom: 0.8rem; }
    .stat-number { font-size: 2.1rem; font-weight: 800; color: #fff; margin-bottom: 0.3rem; letter-spacing: -0.5px; }
    .stat-badge {
      display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem;
      font-weight: 700; background: rgba(244,63,94,0.15); color: #fda4af; border: 1px solid rgba(244,63,94,0.3);
    }

    .widget-box {
      background: rgba(255,255,255,0.025); border: 1px solid rgba(244,63,94,0.25);
      border-radius: 28px; padding: 2.5rem; backdrop-filter: blur(24px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: grid; grid-template-columns: 1fr 380px; gap: 2.5rem;
      align-items: center;
    }
    .widget-info h3 { font-size: 2.2rem; font-weight: 800; margin-bottom: 1rem; }
    .widget-info p { color: var(--muted); line-height: 1.8; font-size: 1.05rem; font-weight: 300; margin-bottom: 2rem; }
    .contact-btn {
      display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.9rem 2rem;
      background: rgba(88,101,242,0.2); border: 1px solid rgba(88,101,242,0.4); color: #818cf8;
      border-radius: 30px; font-weight: 700; font-size: 1rem; text-decoration: none; transition: all 0.3s;
    }
    .contact-btn:hover {
      background: rgba(88,101,242,0.35); color: #fff; transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(88,101,242,0.3);
    }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(5,5,10,0.85); backdrop-filter: blur(16px);
      z-index: 999; display: none; align-items: center; justify-content: center; padding: 1.5rem;
    }
    .modal-card {
      background: rgba(15,15,25,0.95); border: 1px solid rgba(244,63,94,0.3);
      border-radius: 28px; width: 100%; max-width: 480px; padding: 2.5rem;
      box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);
      position: relative; animation: popModal 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
    }
    @keyframes popModal {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-close {
      position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none;
      color: var(--muted); font-size: 1.4rem; cursor: pointer; transition: color 0.2s;
    }
    .modal-close:hover { color: #fff; }

    .login-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.8rem; background: rgba(255,255,255,0.04); padding: 0.35rem; border-radius: 16px; }
    .tab-btn {
      flex: 1; padding: 0.65rem 0.5rem; border: none; border-radius: 12px; background: none;
      color: var(--muted); font-weight: 600; font-size: 0.88rem; cursor: pointer; transition: all 0.25s;
    }
    .tab-btn.active { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); color: #fff; box-shadow: 0 4px 15px rgba(244,63,94,0.3); }

    .input-box { width: 100%; padding: 0.95rem 1.2rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.3); color: #fff; font-size: 1rem; margin-bottom: 1rem; outline: none; transition: border-color 0.3s; }
    .input-box:focus { border-color: #f43f5e; box-shadow: 0 0 0 3px rgba(244,63,94,0.15); }

    .btn-submit-modal {
      width: 100%; padding: 0.95rem; border-radius: 14px; border: none; font-weight: 700; font-size: 1rem;
      background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); color: #fff; cursor: pointer;
      box-shadow: 0 6px 20px rgba(244,63,94,0.3); transition: all 0.3s; margin-top: 0.5rem;
    }
    .btn-submit-modal:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(244,63,94,0.5); }

    footer {
      border-top: 1px solid rgba(255,255,255,0.06); padding: 3rem 2rem; text-align: center; color: var(--muted);
      background: rgba(5,5,10,0.8); margin-top: 6rem;
    }

    @media (max-width: 900px) {
      .hero-container { grid-template-columns: 1fr; text-align: center; }
      .hero-title { font-size: 2.8rem; min-height: 160px; }
      .hero-sub { margin-left: auto; margin-right: auto; }
      .hero-cta { justify-content: center; }
      .widget-box { grid-template-columns: 1fr; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="glow glow-1"></div>
  <div class="glow glow-2"></div>

  <header>
    <a href="/" class="logo" style="display:flex; align-items:center; gap:0.75rem; text-decoration:none;">
      <img src="https://i.imgur.com/PFcAc6q.png" alt="Sentara Logo" style="width:36px; height:36px; border-radius:10px; filter: drop-shadow(0 0 10px rgba(244,63,94,0.6)); flex-shrink:0;">
      <span>EkoYıldız</span>
    </a>
    <nav>
      <a href="/">Ana Sayfa</a>
      ${user ? `
        <a href="/dashboard" class="nav-btn-login" style="background:linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); text-decoration:none;">🚀 Panelim</a>
        <a href="/settings" class="nav-btn-login" style="background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.15); text-decoration:none;">⚙️ Ayarlar</a>
        <a href="/logout" style="color:var(--danger); font-weight:600; text-decoration:none; font-size:0.9rem; margin-left:0.5rem;">Çıkış Yap</a>
      ` : `
        <button onclick="openLoginModal()" class="nav-btn-login">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> Giriş Yap
        </button>
      `}
    </nav>
  </header>

  <div class="hero-container">
    <div>
      <div class="hero-badge">✨ EkoYıldız YouTube Kanalı & Resmi Topluluğu</div>
      <h1 class="hero-title">EkoYıldız Dünyasına<br><span id="typewriterText" class="hero-grad"></span><span class="typewriter-cursor">|</span></h1>
      <p class="hero-sub">Canlı yayınlar, eğlenceli Roblox içerikleri, topluluk etkinlikleri ve sürpriz hediyeler burada! Siz de hemen aramıza katılın.</p>
      <div class="hero-cta">
        ${user ? `
          <a href="/dashboard" class="btn-hero-primary">🚀 Panelime Git</a>
          <a href="/settings" class="btn-hero-secondary">⚙️ Hesabım & Ayarlar</a>
        ` : `
          <button onclick="openLoginModal()" class="btn-hero-primary">🚀 Giriş Yap</button>
        `}
        <a href="https://www.youtube.com/@eko8yildiz" target="_blank" class="btn-hero-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="red"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> YouTube Kanalımız
        </a>
        <a href="https://discord.gg/1367646464804655104" target="_blank" class="btn-hero-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.093.252-.19.373-.287a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg> Discord Sunucumuz
        </a>
      </div>
    </div>
    <div class="hero-mascot-box">
      <div class="hero-mascot-glow"></div>
      <img src="https://i.imgur.com/NzyMqMK.png" alt="EkoYıldız Maskot" class="hero-mascot-img">
    </div>
  </div>

  <div class="section-container">
    <div class="section-header">
      <div class="section-tag">SOSYAL MEDYA HESAPLARIMIZ</div>
      <h2 class="section-title">Canlı Takipçi & <span class="hero-grad">Abone Sayıları</span></h2>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📺</div>
        <div class="stat-number" id="stat-youtube1">0</div>
        <div class="stat-badge">YouTube (Ana Kanal)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎬</div>
        <div class="stat-number" id="stat-youtube2">0</div>
        <div class="stat-badge">YouTube (Yedek)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎵</div>
        <div class="stat-number" id="stat-tiktok">0</div>
        <div class="stat-badge">TikTok</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💚</div>
        <div class="stat-number" id="stat-kick">0</div>
        <div class="stat-badge">Kick Canlı Yayın</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💜</div>
        <div class="stat-number" id="stat-twitch">0</div>
        <div class="stat-badge">Twitch</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📸</div>
        <div class="stat-number" id="stat-instagram1">0</div>
        <div class="stat-badge">Instagram</div>
      </div>
    </div>
  </div>

  <div class="section-container">
    <div class="widget-box">
      <div class="widget-info">
        <div class="section-tag">CANLI DISCORD SUNUCUMUZ</div>
        <h3>EkoYıldız Resmi <span class="hero-grad">Discord Ailesi</span></h3>
        <p>Topluluğumuza katılarak binlerce aktif üye ile sohbet edebilir, çekilişlere katılabilir ve yetkili ekibimizden 7/24 destek alabilirsiniz.</p>
        <a href="https://ptb.discord.com/channels/1367646464804655104/1518692475189854218" target="_blank" class="contact-btn">
          💬 Bize Ulaşın / Destek Kanalı
        </a>
      </div>
      <div>
        <iframe src="https://ptb.discord.com/widget?id=1367646464804655104&theme=dark" width="100%" height="450" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" style="border-radius:24px; border:1px solid rgba(244,63,94,0.3); box-shadow: 0 15px 40px rgba(0,0,0,0.6);"></iframe>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="loginModal">
    <div class="modal-card">
      <button class="modal-close" onclick="closeLoginModal()">✕</button>
      
      <div style="text-align:center; margin-bottom:1.5rem;">
        <h3 style="font-size:1.6rem; font-weight:800; margin-bottom:0.4rem;">Giriş Yap</h3>
        <p style="color:var(--muted); font-size:0.9rem;">EkoYıldız portalına erişmek için giriş yöntemi seçin</p>
      </div>

      <div class="login-tabs">
        <button class="tab-btn active" onclick="switchLoginTab('discord')">Discord ile</button>
        <button class="tab-btn" onclick="switchLoginTab('roblox')">Roblox ile</button>
        <button class="tab-btn" onclick="switchLoginTab('username')">Kullanıcı Adı</button>
      </div>

      <div id="tab-discord" style="display:block;">
        <a href="/auth/discord" class="btn-submit-modal" style="display:flex; align-items:center; justify-content:center; gap:0.6rem; text-decoration:none; margin-bottom:0.8rem; background:#5865F2;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.093.252-.19.373-.287a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z"/></svg> Discord OAuth ile Giriş Yap
        </a>
        
        <div style="text-align:center; color:var(--muted); margin:1rem 0; font-size:0.85rem;">veya</div>

        <input type="text" id="dmUsernameInput" class="input-box" placeholder="Discord Kullanıcı Adınız (Örn: ekonqtx)">
        <button onclick="requestDiscordDMCode()" class="btn-submit-modal" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);">
          📩 Discord DM ile Kod Gönder
        </button>

        <div id="dmCodeVerifyBox" style="display:none; margin-top:1.2rem;">
          <input type="text" id="dmCodeInput" class="input-box" placeholder="6 Haneli DM Kodunu Girin" maxlength="6">
          <button onclick="verifyDiscordDMCode()" class="btn-submit-modal">Kodu Doğrula & Giriş Yap</button>
        </div>
      </div>

      <div id="tab-roblox" style="display:none;">
        <a href="/auth/roblox" class="btn-submit-modal" style="display:flex; align-items:center; justify-content:center; gap:0.6rem; text-decoration:none; background:#000; border:1px solid rgba(255,255,255,0.2);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M18.5 3.5L3.5 7.5L5.5 20.5L20.5 16.5L18.5 3.5ZM14 14L10 15L11 11L15 10L14 14Z"/></svg> Roblox OAuth ile Giriş Yap
        </a>
      </div>

      <div id="tab-username" style="display:none;">
        <input type="text" id="usernameCheckInput" class="input-box" placeholder="Kullanıcı Adı veya Discord ID">
        <button onclick="checkUsernameSubmit()" class="btn-submit-modal">Devam Et</button>

        <div id="passwordStepBox" style="display:none; margin-top:1.2rem;">
          <input type="password" id="pinInput" class="input-box" placeholder="Site PIN / Şifrenizi Girin">
          <button onclick="submitPinLogin()" class="btn-submit-modal">Giriş Yap</button>
          <div style="text-align:center; margin-top:0.8rem;">
            <a href="#" onclick="alert('Şifrenizi sıfırlamak için Discord DM kod gönder seçeneğini kullanabilirsiniz.');" style="color:var(--muted); font-size:0.85rem; text-decoration:none;">Şifremi Unuttum</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <div style="max-width:1200px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
      <div style="font-weight:700; color:#fff;">EkoYıldız Resmi Topluluğu</div>
      <div style="display:flex; gap:1.5rem; font-size:0.9rem;">
        <a href="/legal/tos" style="color:var(--muted); text-decoration:none;">Kullanım Koşulları</a>
        <a href="/legal/privacy" style="color:var(--muted); text-decoration:none;">Gizlilik Politikası</a>
      </div>
    </div>
  </footer>

  <script>
    // ── Typewriter (Daktilo Efekti) ──
    const phrases = [
      "Türkiye'nin en eğlenceli Roblox ve topluluk kanalı dünyasına...",
      "Türkiye'nin en büyük Türk asker oyunu gizemlerini anlatan kanalına...",
      "Aksiyon ve macera dolu canlı yayın dünyasına...",
      "Efsane Roblox çekilişleri ve büyük ödüllü etkinliklerine...",
      "7/24 aktif, samimi ve eğlenceli Discord ailesine...",
      "En komik Roblox rol yapma ve vaka videolarına...",
      "TMT & Türk Askeri konseptli özel oyun serilerine...",
      "EkoYıldız resmi web portalı ve destek platformuna...",
      "Unutulmaz yarışmalar ve sürpriz turnuvalara...",
      "Topluluğa özel eğlenceli mini oyunlar ve bot sistemlerine...",
      "Her gün yenilenen sürpriz Roblox maceralarına...",
      "YouTube'da 10.000+ aboneye yaklaşan dev ailemize...",
      "TikTok'ta trend olan en kaliteli Roblox videolarına...",
      "Kick ve Twitch canlı yayın coşkusuna...",
      "Instagram'da anlık duyurular ve kamera arkası görüntülerine...",
      "Sadık üyeler ve profesyonel yetkili kadromuza...",
      "Samimi sohbet ortamı ve yeni dostluklara...",
      "Oyuncular için tasarlanmış özel web arayüzüne...",
      "Sosyal medya hesaplarımızla kesintisiz iletişime...",
      "EkoYıldız'ın en gizemli Roblox sırlarına...",
      "Tüm platformlarda tek çatı altında buluşma noktasına...",
      "Sesli kanallarda efsane muhabbet ve eğlencelere...",
      "Roblox hesabını eşle, hemen aileye katılma noktasına...",
      "Güvenli, adil ve eğlenceli topluluk dünyasına...",
      "Siz de aramıza katılın, eğlenceyi asla kaçırmayın!"
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typewriterEl = document.getElementById('typewriterText');

    function typeEffect() {
      const currentPhrase = phrases[phraseIndex];
      if (isDeleting) {
        typewriterEl.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typewriterEl.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
      }

      let typeSpeed = isDeleting ? 25 : 45;

      if (!isDeleting && charIndex === currentPhrase.length) {
        typeSpeed = 2200;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 450;
      }

      setTimeout(typeEffect, typeSpeed);
    }
    typeEffect();

    // ── Real Live Animated Fast Counter ──
    function animateCounter(id, endValue, duration = 2000) {
      const el = document.getElementById(id);
      if (!el) return;
      let startTimestamp = null;
      const startValue = 0;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * (endValue - startValue) + startValue);
        el.textContent = current.toLocaleString('tr-TR') + (endValue >= 100 ? '+' : '');
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }

    async function fetchLiveSocialStats() {
      try {
        const res = await fetch('/api/social-stats');
        const data = await res.json();
        if (data.success && data.stats) {
          const s = data.stats;
          animateCounter('stat-youtube1', s.youtube1 || 7420);
          animateCounter('stat-youtube2', s.youtube2 || 1910);
          animateCounter('stat-tiktok', s.tiktok || 150);
          animateCounter('stat-kick', s.kick || 0);
          animateCounter('stat-twitch', s.twitch || 0);
          animateCounter('stat-instagram1', s.instagram1 || 0);
        } else {
          animateCounter('stat-youtube1', 7420);
          animateCounter('stat-youtube2', 1910);
          animateCounter('stat-tiktok', 150);
          animateCounter('stat-kick', 0);
          animateCounter('stat-twitch', 0);
          animateCounter('stat-instagram1', 0);
        }
      } catch (err) {
        animateCounter('stat-youtube1', 7420);
        animateCounter('stat-youtube2', 1910);
        animateCounter('stat-tiktok', 150);
        animateCounter('stat-kick', 0);
        animateCounter('stat-twitch', 0);
        animateCounter('stat-instagram1', 0);
      }
    }

    fetchLiveSocialStats();

    function openLoginModal() {
      document.getElementById('loginModal').style.display = 'flex';
    }
    function closeLoginModal() {
      document.getElementById('loginModal').style.display = 'none';
    }

    function switchLoginTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-discord').style.display = 'none';
      document.getElementById('tab-roblox').style.display = 'none';
      document.getElementById('tab-username').style.display = 'none';

      if (tab === 'discord') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('tab-discord').style.display = 'block';
      } else if (tab === 'roblox') {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('tab-roblox').style.display = 'block';
      } else {
        document.querySelectorAll('.tab-btn')[2].classList.add('active');
        document.getElementById('tab-username').style.display = 'block';
      }
    }

    async function requestDiscordDMCode() {
      const username = document.getElementById('dmUsernameInput').value.trim();
      if (!username) return;

      try {
        const res = await fetch('/auth/send-discord-dm-code', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('dmCodeVerifyBox').style.display = 'block';
        } else {
          // HİÇBİR POPUP UYARISI GÖSTERMEDEN DOĞRUDAN İNTERAKTİF HESAP OLUŞTURMA SİHİRBAZINA YÖNLENDİR
          window.location.href = '/login?register=1&username=' + encodeURIComponent(username);
        }
      } catch (err) {
        window.location.href = '/login?register=1&username=' + encodeURIComponent(username);
      }
    }

    async function verifyDiscordDMCode() {
      const code = document.getElementById('dmCodeInput').value.trim();
      if (!code) return;

      try {
        const res = await fetch('/auth/verify-discord-dm-code', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = data.redirectUrl || '/dashboard';
        } else {
          window.location.href = '/login?register=1';
        }
      } catch (err) {
        window.location.href = '/login?register=1';
      }
    }

    let activeCheckUsername = '';
    async function checkUsernameSubmit() {
      const username = document.getElementById('usernameCheckInput').value.trim();
      if (!username) return;

      try {
        const res = await fetch('/auth/check-username', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (data.success && data.exists) {
          activeCheckUsername = username;
          if (data.hasPassword) {
            document.getElementById('passwordStepBox').style.display = 'block';
          } else {
            if (data.hasDiscord) switchLoginTab('discord');
            else switchLoginTab('roblox');
          }
        } else {
          // HİÇBİR POPUP UYARISI GÖSTERMEDEN DOĞRUDAN İNTERAKTİF HESAP OLUŞTURMA SİHİRBAZINA YÖNLENDİR
          window.location.href = '/login?register=1&username=' + encodeURIComponent(username);
        }
      } catch (err) {
        window.location.href = '/login?register=1&username=' + encodeURIComponent(username);
      }
    }

    async function submitPinLogin() {
      const pin = document.getElementById('pinInput').value.trim();
      if (!pin) return alert('Lütfen şifrenizi girin.');

      try {
        const res = await fetch('/auth/login-pin', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ username: activeCheckUsername, pin })
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = data.redirectUrl || '/dashboard';
        } else {
          alert('Hata: ' + (data.error || 'Giriş başarısız.'));
        }
      } catch (err) {
        alert('Sunucu hatası.');
      }
    }
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
function renderLoginPage(errorMsg = null) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Giriş Yap — Sentara Premium</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:      #06060e;
      --border:  rgba(255,255,255,0.08);
      --accent:  #a78bfa;
      --accent2: #818cf8;
      --text:    #f0f0f8;
      --muted:   #7c7c9a;
      --danger:  #fb7185;
    }
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: var(--bg);
      background-image:
        radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.06) 0%, transparent 60%);
      color:var(--text); font-family:'Outfit',sans-serif;
      min-height:100vh; display:flex; align-items:center; justify-content:center;
      overflow:hidden;
    }
    .glow {
      position:fixed; width:500px; height:500px; border-radius:50%;
      filter:blur(200px); pointer-events:none; z-index:0;
      animation:pulse 12s infinite alternate;
    }
    .glow-1 { background:var(--accent); top:-200px; left:-200px; opacity:0.05; }
    .glow-2 { background:var(--accent2); bottom:-200px; right:-200px; opacity:0.05; animation-delay:-6s; }
    @keyframes pulse {
      0%   { transform:scale(1); opacity:0.04; }
      100% { transform:scale(1.15); opacity:0.08; }
    }
    .container { position:relative; z-index:10; width:100%; max-width:420px; padding:1.5rem; }
    .card {
      background:rgba(255,255,255,0.035);
      backdrop-filter:blur(28px) saturate(1.2);
      -webkit-backdrop-filter:blur(28px) saturate(1.2);
      border:1px solid rgba(255,255,255,0.07);
      border-radius:24px; padding:3rem 2.5rem;
      text-align:center;
      box-shadow:0 24px 48px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
      animation:popIn 0.55s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
    }
    @keyframes popIn {
      0%   { opacity:0; transform:scale(0.9) translateY(20px); }
      100% { opacity:1; transform:scale(1) translateY(0); }
    }
    .logo {
      font-size:2.5rem; font-weight:800; letter-spacing:-0.5px;
      background:linear-gradient(135deg,var(--accent),var(--accent2));
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      margin-bottom:0.5rem; display:block;
    }
    .card h1 { font-size:1.4rem; font-weight:600; margin-bottom:0.4rem; }
    .card .subtitle { color:var(--muted); margin-bottom:2rem; font-size:0.92rem; font-weight:300; }
    .error-box {
      background:rgba(251,113,133,0.08); border:1px solid rgba(251,113,133,0.2);
      color:var(--danger); padding:0.8rem 1rem; border-radius:12px;
      margin-bottom:1.5rem; font-size:0.88rem;
      backdrop-filter:blur(8px);
      display: none;
    }
    .btn {
      width:100%; padding:1.05rem; border:none; border-radius:14px;
      font-family:'Outfit',sans-serif; font-weight:600; font-size:1rem;
      cursor:pointer; color:white;
      display:flex; align-items:center; justify-content:center; gap:10px;
      text-decoration:none;
      transition:all 0.3s ease;
      margin-bottom: 0.8rem;
    }
    .btn-discord { background:rgba(88,101,242,0.85); box-shadow:0 4px 20px rgba(88,101,242,0.2); }
    .btn-discord:hover { background:rgba(71,82,196,0.9); transform:translateY(-2px); box-shadow:0 8px 28px rgba(88,101,242,0.3); }
    .btn-primary { background:rgba(124,106,247,0.85); box-shadow:0 4px 20px rgba(124,106,247,0.2); }
    .btn-primary:hover { background:rgba(100,80,240,0.9); transform:translateY(-2px); box-shadow:0 8px 28px rgba(124,106,247,0.3); }
    .btn-success { background:rgba(16,185,129,0.85); box-shadow:0 4px 20px rgba(16,185,129,0.2); }
    .btn-success:hover { background:rgba(5,150,105,0.9); transform:translateY(-2px); box-shadow:0 8px 28px rgba(16,185,129,0.3); }
    
    .divider { color:var(--muted); font-size:0.85rem; margin:1.5rem 0; position:relative; display:flex; align-items:center; justify-content:center; }
    .divider::before, .divider::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.06); margin:0 10px; }
    
    .input-field {
      width:100%; padding:1rem; border-radius:12px; border:1px solid rgba(255,255,255,0.1); 
      background:rgba(0,0,0,0.2); color:#fff; margin-bottom:1rem; 
      font-family:'Outfit',sans-serif; font-size:0.95rem;
    }
    .remember-me {
      display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 1.5rem; color: var(--muted); font-size: 0.9rem;
    }
    .remember-me input { accent-color: var(--accent); width: 16px; height: 16px; }
    
    .link-btn { background:none;border:none;color:var(--muted);font-size:0.85rem;cursor:pointer;text-decoration:underline; font-family:'Outfit',sans-serif; }
    .link-btn:hover { color:var(--text); }
  </style>
</head>
<body>
  <div class="glow glow-1"></div>
  <div class="glow glow-2"></div>
  <div class="container">
    <div class="card">
      <span class="logo" style="background: linear-gradient(135deg, #f43f5e, #fda4af); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight:800; font-size:2.2rem;">EkoYıldız</span>
      <h1>EkoYıldız Portalı</h1>
      <p class="subtitle">Sisteme giriş yapmak için bir yöntem seçin</p>

      <div class="error-box" id="error-box">${errorMsg ? errorMsg : ''}</div>

      <!-- MAIN OPTIONS -->
      <div id="view-main">
        <div class="remember-me">
          <input type="checkbox" id="remember-discord">
          <label for="remember-discord">Beni Hatırla</label>
        </div>
        <a href="#" onclick="goDiscordAuth()" class="btn btn-discord" style="background:#5865F2;">Discord ile Giriş Yap</a>
        <a href="/auth/roblox" class="btn" style="background:#000; border:1px solid rgba(255,255,255,0.2); color:#fff;">Roblox ile Giriş Yap</a>
        <div class="divider">veya</div>
        <button onclick="showView('view-otp')" class="btn btn-primary" style="background:linear-gradient(135deg,#f43f5e,#e11d48);">Discord Kod Gönder (DM)</button>
        <button onclick="showView('view-password')" class="btn btn-primary" style="background:rgba(255,255,255,0.1); color:#fff; box-shadow:none;">Site Şifresi ile Giriş</button>
        <button onclick="startRegisterWizard()" class="btn" style="background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.3); margin-top:0.4rem;">✨ Yeni Hesap Oluştur (Kayıt Ol)</button>
      </div>

      <!-- OTP VIEW -->
      <div id="view-otp" style="display:none;">
        <h2 style="font-size:1.1rem; margin-bottom:1rem;">Discord Kodu ile Giriş</h2>
        <div class="remember-me">
          <input type="checkbox" id="remember-otp">
          <label for="remember-otp">Beni Hatırla</label>
        </div>
        <div id="otp-step-1">
          <input type="text" id="otp-username" class="input-field" placeholder="Discord Kullanıcı Adı (Örn: ekoyildiz)">
          <button id="btn-request" onclick="requestCode()" class="btn btn-primary">Kod Gönder</button>
        </div>
        <div id="otp-step-2" style="display:none;">
          <p style="font-size:0.85rem; color:var(--muted); margin-bottom:1rem;">Discord özel mesajlarınıza gelen 4 haneli kodu girin:</p>
          <input type="text" id="otp-code" class="input-field" placeholder="____" maxlength="4" style="text-align:center; letter-spacing:0.5rem; font-size:1.5rem;">
          <input type="hidden" id="otp-resolved-id">
          <button id="btn-verify" onclick="verifyCode()" class="btn btn-success">Doğrula ve Giriş Yap</button>
        </div>
        <button onclick="showView('view-main')" class="link-btn" style="margin-top:1rem;">← Geri dön</button>
      </div>

      <!-- PASSWORD VIEW -->
      <div id="view-password" style="display:none;">
        <h2 style="font-size:1.1rem; margin-bottom:1rem;">Site Şifresi ile Giriş</h2>
        <div class="remember-me">
          <input type="checkbox" id="remember-pwd">
          <label for="remember-pwd">Beni Hatırla</label>
        </div>
        <input type="text" id="pwd-username" class="input-field" placeholder="Discord Kullanıcı Adı">
        <input type="password" id="pwd-password" class="input-field" placeholder="Site Şifresi">
        <button id="btn-pwd-login" onclick="passwordLogin()" class="btn btn-success">Giriş Yap</button>
        <button onclick="forgotPassword()" class="link-btn" style="display:block; margin: 1rem auto 0.5rem;">Şifremi Unuttum</button>
        <button onclick="showView('view-main')" class="link-btn" style="display:block; margin:0 auto;">← Geri dön</button>
      </div>

      <!-- INTERACTIVE REGISTER WIZARD VIEW -->
      <div id="view-register-wizard" style="display:none; text-align:left;">
        <h2 style="font-size:1.15rem; margin-bottom:0.3rem; color:#fff; text-align:center;">✨ Yeni Hesap Oluşturma</h2>
        <p style="font-size:0.82rem; color:var(--muted); text-align:center; margin-bottom:1.2rem;">Adım Adım İnteraktif Kurulum <span id="reg-username-display" style="color:var(--accent); font-weight:600;"></span></p>

        <!-- STEP 1: ROBLOX METHOD -->
        <div id="wiz-step-1">
          <h3 style="font-size:0.92rem; font-weight:600; margin-bottom:0.5rem; color:#fff;">🎮 Adım 1/3: Roblox Hesabını Bağla</h3>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:1rem; line-height:1.4;">Şimdi Roblox hesabını EkoYıldız portalına bağlayalım. Roblox hesabını hangi yöntemle doğrulamak istersin?</p>

          <div class="wiz-card" id="opt-rbx-friend" onclick="selectRobloxMethod('friend_request')" style="padding:0.9rem; border:1px solid rgba(167,139,250,0.4); border-radius:14px; background:rgba(167,139,250,0.1); margin-bottom:0.7rem; cursor:pointer;">
            <div style="font-weight:600; font-size:0.9rem; color:#fff;">👥 Arkadaş İsteği İle (RoWifi / Bot)</div>
            <div style="font-size:0.78rem; color:var(--muted); margin-top:3px;">RoWifi Botumuza arkadaşlık isteği göndererek otomatik doğrulayın.</div>
          </div>

          <div class="wiz-card" id="opt-rbx-profile" onclick="selectRobloxMethod('profile_code')" style="padding:0.9rem; border:1px solid rgba(255,255,255,0.08); border-radius:14px; background:rgba(0,0,0,0.25); margin-bottom:1.2rem; cursor:pointer;">
            <div style="font-weight:600; font-size:0.9rem; color:#fff;">🔐 Roblox Profil Açıklaması / 2FA Kodu İle</div>
            <div style="font-size:0.78rem; color:var(--muted); margin-top:3px;">Roblox profil açıklamanıza özel kodu ekleyerek veya Roblox 2FA ile doğrulayın.</div>
          </div>

          <button onclick="nextWizardStep(1)" class="btn btn-primary" style="background:linear-gradient(135deg,#a78bfa,#818cf8);">Devam Et (Adım 2) →</button>
        </div>

        <!-- STEP 2: PASSWORD CREATION -->
        <div id="wiz-step-2" style="display:none;">
          <h3 style="font-size:0.92rem; font-weight:600; margin-bottom:0.5rem; color:#fff;">🔐 Adım 2/3: Güvenli Web Şifresi Belirle</h3>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:1rem;">Portalınıza tek tıkla güvenle giriş yapabilmek için kendi web şifrenizi belirleyin:</p>

          <input type="password" id="reg-pwd-1" class="input-field" placeholder="Web Şifresi (En az 6 karakter)" oninput="checkPasswordStrength(this.value)">
          <div id="pwd-strength" style="font-size:0.75rem; color:var(--muted); margin:-0.5rem 0 0.8rem; text-align:right;"></div>

          <input type="password" id="reg-pwd-2" class="input-field" placeholder="Web Şifresini Tekrarla">

          <button onclick="nextWizardStep(2)" class="btn btn-primary" style="background:linear-gradient(135deg,#a78bfa,#818cf8);">Devam Et (Adım 3) →</button>
          <button onclick="showWizardStep(1)" class="link-btn" style="display:block; margin:0.6rem auto 0;">← Önceki Adım</button>
        </div>

        <!-- STEP 3: 2FA CHOICE -->
        <div id="wiz-step-3" style="display:none;">
          <h3 style="font-size:0.92rem; font-weight:600; margin-bottom:0.5rem; color:#fff;">🛡️ Adım 3/3: 2 Aşamalı Doğrulama (2FA)</h3>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:1.2rem;">Hesabınızı izinsiz girişlere karşı korumak için 2 Aşamalı Doğrulamayı aktif etmek ister misiniz?</p>

          <button id="btn-finish-reg" onclick="finishRegisterWizard(true)" class="btn btn-success" style="background:linear-gradient(135deg,#10b981,#059669); margin-bottom:0.8rem;">🛡️ Evet, 2 Aşamalı Doğrulamayı Aktif Et (Önerilir)</button>
          <button onclick="finishRegisterWizard(false)" class="btn" style="background:rgba(255,255,255,0.08); color:#fff; border:1px solid rgba(255,255,255,0.1);">⚡ Hayır, Şimdilik Atla</button>
          <button onclick="showWizardStep(2)" class="link-btn" style="display:block; margin:0.6rem auto 0;">← Önceki Adım</button>
        </div>

        <!-- STEP 4: SUCCESS ANIMATION -->
        <div id="wiz-step-4" style="display:none; text-align:center; padding:1.2rem 0;">
          <div style="font-size:3.2rem; margin-bottom:0.6rem;">🎉</div>
          <h3 style="font-size:1.15rem; font-weight:700; color:#34d399; margin-bottom:0.4rem;">Hesabınız Başarıyla Oluşturuldu!</h3>
          <p style="font-size:0.85rem; color:var(--muted);">EkoYıldız portalına yönlendiriliyorsunuz, lütfen bekleyin...</p>
        </div>

        <button onclick="showView('view-main')" class="link-btn" style="display:block; margin:1rem auto 0; text-align:center;">← Kaydı İptal Et ve Girişe Dön</button>
      </div>

      <script>
        // Init error box
        const srvErr = ${JSON.stringify(errorMsg || '')};
        if (srvErr) { document.getElementById('error-box').style.display = 'block'; }

        function showError(msg) {
          const box = document.getElementById('error-box');
          box.innerText = "⚠️ " + msg;
          box.style.display = 'block';
        }
        function hideError() {
          document.getElementById('error-box').style.display = 'none';
        }
        function showView(id) {
          hideError();
          document.getElementById('view-main').style.display = 'none';
          document.getElementById('view-otp').style.display = 'none';
          document.getElementById('view-password').style.display = 'none';
          const regWiz = document.getElementById('view-register-wizard');
          if (regWiz) regWiz.style.display = 'none';
          document.getElementById(id).style.display = 'block';
        }

        // --- INTERACTIVE REGISTER WIZARD STATE ---
        let regState = {
          username: '',
          robloxMethod: 'friend_request',
          password: '',
          enable2FA: false
        };

        function startRegisterWizard(username = '') {
          regState.username = username || document.getElementById('otp-username')?.value || document.getElementById('pwd-username')?.value || '';
          document.getElementById('reg-username-display').innerText = regState.username ? '(@' + regState.username + ')' : '';
          showView('view-register-wizard');
          showWizardStep(1);
        }

        // Auto-launch registration wizard if register=1 or username parameter is present in URL
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const autoUser = urlParams.get('username') || '';
          if (urlParams.get('register') === '1' || autoUser) {
            startRegisterWizard(autoUser);
          }
        } catch(e) {}

        function showWizardStep(stepNum) {
          hideError();
          document.getElementById('wiz-step-1').style.display = 'none';
          document.getElementById('wiz-step-2').style.display = 'none';
          document.getElementById('wiz-step-3').style.display = 'none';
          document.getElementById('wiz-step-4').style.display = 'none';
          document.getElementById('wiz-step-' + stepNum).style.display = 'block';
        }

        function selectRobloxMethod(method) {
          regState.robloxMethod = method;
          const optFriend = document.getElementById('opt-rbx-friend');
          const optProfile = document.getElementById('opt-rbx-profile');
          if (method === 'friend_request') {
            optFriend.style.borderColor = 'rgba(167,139,250,0.6)';
            optFriend.style.background = 'rgba(167,139,250,0.15)';
            optProfile.style.borderColor = 'rgba(255,255,255,0.08)';
            optProfile.style.background = 'rgba(0,0,0,0.25)';
          } else {
            optProfile.style.borderColor = 'rgba(167,139,250,0.6)';
            optProfile.style.background = 'rgba(167,139,250,0.15)';
            optFriend.style.borderColor = 'rgba(255,255,255,0.08)';
            optFriend.style.background = 'rgba(0,0,0,0.25)';
          }
        }

        function checkPasswordStrength(val) {
          const indicator = document.getElementById('pwd-strength');
          if (!indicator) return;
          if (!val) { indicator.innerText = ''; return; }
          if (val.length < 6) { indicator.innerText = '🔴 Şifre çok kısa (en az 6 karakter)'; indicator.style.color = '#fb7185'; }
          else if (val.length < 9) { indicator.innerText = '🟡 Şifre gücü: Orta'; indicator.style.color = '#fbbf24'; }
          else { indicator.innerText = '🟢 Şifre gücü: Güçlü'; indicator.style.color = '#34d399'; }
        }

        function nextWizardStep(fromStep) {
          hideError();
          if (fromStep === 1) {
            showWizardStep(2);
          } else if (fromStep === 2) {
            const p1 = document.getElementById('reg-pwd-1').value;
            const p2 = document.getElementById('reg-pwd-2').value;
            if (!p1 || p1.length < 6) return showError("Lütfen en az 6 karakterli bir şifre girin.");
            if (p1 !== p2) return showError("Girilen şifreler eşleşmiyor!");
            regState.password = p1;
            showWizardStep(3);
          }
        }

        async function finishRegisterWizard(enable2FA) {
          regState.enable2FA = enable2FA;
          const btn = document.getElementById('btn-finish-reg');
          if (btn) { btn.disabled = true; btn.innerText = "Hesap Oluşturuluyor..."; }

          try {
            const res = await fetch('/api/auth/register-interactive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(regState)
            });
            const data = await res.json();
            if (data.success) {
              showWizardStep(4);
              setTimeout(() => {
                window.location.href = data.redirectUrl || '/dashboard';
              }, 1500);
            } else {
              showError(data.error || "Hesap oluşturulamadı.");
              if (btn) { btn.disabled = false; btn.innerText = "🛡️ Evet, 2 Aşamalı Doğrulamayı Aktif Et (Önerilir)"; }
            }
          } catch (e) {
            showError("Bağlantı hatası oluştu.");
            if (btn) { btn.disabled = false; btn.innerText = "🛡️ Evet, 2 Aşamalı Doğrulamayı Aktif Et (Önerilir)"; }
          }
        }

        // Discord OAuth2
        function goDiscordAuth() {
          const rem = document.getElementById('remember-discord').checked;
          const btn = document.querySelector('.btn-discord');
          if (btn) btn.style.pointerEvents = 'none';

          const errorBox = document.getElementById('error-box');
          errorBox.style.background = 'rgba(124, 106, 247, 0.15)';
          errorBox.style.borderColor = 'rgba(124, 106, 247, 0.4)';
          errorBox.style.color = '#a78bfa';
          errorBox.style.display = 'block';

          let seconds = 3;
          errorBox.innerHTML = '🔒 <strong>Sentara botunun sadece kullanıcı ismine erişebildiğini unutmayın.</strong><br>Yönlendiriliyor (' + seconds + 's)...';

          const interval = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
              clearInterval(interval);
              window.location.href = '/auth/discord?remember=' + (rem ? 'true' : 'false');
            } else {
              errorBox.innerHTML = '🔒 <strong>Sentara botunun sadece kullanıcı ismine erişebildiğini unutmayın.</strong><br>Yönlendiriliyor (' + seconds + 's)...';
            }
          }, 1000);
        }

        // OTP Auth
        async function requestCode() {
          hideError();
          const username = document.getElementById('otp-username').value.trim();
          if (!username) return showError("Lütfen Discord Kullanıcı Adınızı girin.");

          const btn = document.getElementById('btn-request');
          btn.disabled = true; btn.innerText = "Kontrol Ediliyor...";
          try {
            const res = await fetch('/auth/send-discord-dm-code', {
              method: 'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ username })
            });
            const data = await res.json();
            if(data.success) {
              document.getElementById('otp-resolved-id').value = data.targetId || data.discordId || username;
              document.getElementById('otp-step-1').style.display = 'none';
              document.getElementById('otp-step-2').style.display = 'block';
            } else if (data.isNewUser || res.status === 404) {
              // HİÇBİR UYARI/ALERT POPUP GÖSTERMEDEN DOĞRUDAN ADIM ADIM KAYIT WIZARDINA AKTAR
              startRegisterWizard(username);
            } else {
              showError(data.error || "Giriş hatası.");
            }
          } catch(e) { 
            startRegisterWizard(username);
          }
          btn.disabled = false; btn.innerText = "Kod Gönder";
        }

        async function verifyCode() {
          hideError();
          const discordId = document.getElementById('otp-resolved-id').value;
          const code = document.getElementById('otp-code').value.trim();
          const rem = document.getElementById('remember-otp').checked;
          if(!code || code.length !== 4) return showError("Lütfen 4 haneli kodu girin.");

          const btn = document.getElementById('btn-verify');
          btn.disabled = true; btn.innerText = "Doğrulanıyor...";
          try {
            const res = await fetch('/api/auth/verify-code', {
              method: 'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ discordId, code, rememberMe: rem })
            });
            const data = await res.json();
            if(data.success) window.location.href = '/dashboard';
            else showError(data.error || "Hatalı kod.");
          } catch(e) { showError("Bağlantı hatası."); }
          btn.disabled = false; btn.innerText = "Doğrula ve Giriş Yap";
        }

        // Custom Password Auth
        async function passwordLogin() {
          hideError();
          const username = document.getElementById('pwd-username').value.trim();
          const password = document.getElementById('pwd-password').value.trim();
          const rem = document.getElementById('remember-pwd').checked;

          if (!username || !password) return showError("Lütfen tüm alanları doldurun.");

          const btn = document.getElementById('btn-pwd-login');
          btn.disabled = true; btn.innerText = "Giriş Yapılıyor...";

          try {
            const res = await fetch('/api/auth/site-login', {
              method: 'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ username, password, rememberMe: rem })
            });
            const data = await res.json();
            if(data.success) window.location.href = '/dashboard';
            else if (data.isNewUser) {
              startRegisterWizard(username);
            } else {
              showError(data.error || "Hatalı şifre veya kullanıcı bulunamadı.");
            }
          } catch(e) { showError("Bağlantı hatası."); }

          btn.disabled = false; btn.innerText = "Giriş Yap";
        }

        async function forgotPassword() {
          hideError();
          const username = prompt("Lütfen Discord Kullanıcı Adınızı girin:");
          if(!username) return;

          try {
            const res = await fetch('/api/auth/forgot-password', {
              method: 'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ username })
            });
            const data = await res.json();
            if(data.success) {
              alert(data.message);
              // Wait for code
              const code = prompt("DM kutunuza gelen 6 haneli sıfırlama kodunu girin:");
              if(!code) return;
              const newPassword = prompt("Lütfen yeni Site Şifrenizi belirleyin (En az 8 karakter):");
              if(!newPassword || newPassword.length < 8) return alert("Geçersiz şifre.");

              const res2 = await fetch('/api/auth/reset-password', {
                method: 'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ discordId: data.discordId, code, password: newPassword })
              });
              const data2 = await res2.json();
              if(data2.success) alert("Şifreniz başarıyla sıfırlandı!");
              else alert("Sıfırlama başarısız: " + data2.error);
            } else {
              showError(data.error || "Hata oluştu.");
            }
          } catch(e) { showError("Bağlantı hatası."); }
        }
      </script>
    </div>
  </div>
</body>
</html>`;
}


// ─────────────────────────────────────────────
// DISCORD AUTHORIZE PAGE
// ─────────────────────────────────────────────
function renderAuthorizePage(scopes = []) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yetkilendirme — Sentara Premium</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg:#06060e; --border:rgba(255,255,255,0.08); --accent:#a78bfa; --accent2:#818cf8; --text:#f0f0f8; --muted:#7c7c9a; }
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    body {
      background:var(--bg);
      background-image:radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.06) 0%, transparent 60%);
      color:var(--text); font-family:'Outfit',sans-serif;
      min-height:100vh; display:flex; align-items:center; justify-content:center;
    }
    .card {
      background:rgba(255,255,255,0.035); backdrop-filter:blur(28px) saturate(1.2);
      -webkit-backdrop-filter:blur(28px) saturate(1.2);
      border:1px solid rgba(255,255,255,0.07); border-radius:24px; padding:3rem 2.5rem;
      text-align:center; max-width:400px; width:100%; margin:1.5rem;
      box-shadow:0 24px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
      animation:popIn 0.5s ease forwards;
    }
    @keyframes popIn { from{opacity:0;transform:scale(0.92) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
    .logo { font-size:2rem; font-weight:800; background:linear-gradient(135deg,var(--accent),var(--accent2)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; display:block; margin-bottom:1.5rem; letter-spacing:-0.5px; }
    h1 { font-size:1.3rem; margin-bottom:0.5rem; }
    p  { color:var(--muted); margin-bottom:2rem; font-size:0.92rem; line-height:1.6; font-weight:300; }
    .scope-list { text-align:left; margin-bottom:2rem; display:flex; flex-direction:column; gap:0.5rem; }
    .scope-item {
      display:flex; align-items:center; gap:0.75rem;
      background:rgba(167,139,250,0.06); border:1px solid rgba(167,139,250,0.12);
      padding:0.6rem 1rem; border-radius:12px; font-size:0.88rem;
      backdrop-filter:blur(8px);
    }
    .btn {
      width:100%; padding:0.95rem; border:none; border-radius:14px;
      font-family:'Outfit',sans-serif; font-weight:600; font-size:0.95rem;
      cursor:pointer; background:rgba(167,139,250,0.18); border:1px solid rgba(167,139,250,0.25);
      color:var(--accent); margin-bottom:0.75rem; transition:all 0.3s;
      text-decoration:none; display:block;
      backdrop-filter:blur(8px);
    }
    .btn:hover { transform:translateY(-1px); background:rgba(167,139,250,0.28); border-color:rgba(167,139,250,0.4); color:#fff; box-shadow:0 6px 24px rgba(167,139,250,0.15); }
    .btn-ghost { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:var(--muted); }
    .btn-ghost:hover { border-color:rgba(255,255,255,0.15); color:var(--text); background:rgba(255,255,255,0.06); box-shadow:none; }
    ::selection { background:rgba(167,139,250,0.3); color:#fff; }
  </style>
</head>
<body>
  <div class="card">
    <span class="logo">sentara</span>
    <h1>Uygulamayı Yetkilendir</h1>
    <p>Sentara şu izinlere erişmek istiyor:</p>
    <div class="scope-list">
      ${(scopes.length ? scopes : ['identify', 'email', 'guilds']).map(s => `
        <div class="scope-item">✅ <span><strong>${_esc(s)}</strong></span></div>
      `).join('')}
    </div>
    <a href="/auth/discord" class="btn">İzin Ver</a>
    <a href="/" class="btn btn-ghost">Reddet</a>
  </div>
</body>
</html>`;
}


// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function renderDashboard(user, staffProgress) {
  // Use isAuthorized flag instead of checking username, since username might be a fallback value
  const isRobloxLinked = user.isAuthorized && user.robloxId;
  const hasDiscordOAuth = Boolean(user.discordId);
  const usernameIsEkonqt = String(user.robloxUsername || '').toLowerCase() === 'damndoggii';
  const hasModeratorTeamMembership = Boolean(user.verificationStatus?.moderatorTeamMember || user.verificationStatus?.moderatorTeamGroupMember);
  const { SUPPORT_CATEGORIES } = require("../config");

  // Determine if staff promotion warning should be displayed
  const isStaff = user.isStaff || isSiteAdmin(user);
  let showPromotionWarning = false;
  if (isStaff) {
    if (!staffProgress || !staffProgress.promotedAt) {
      showPromotionWarning = true;
    } else {
      const daysSincePromotion = (Date.now() - new Date(staffProgress.promotedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePromotion >= 3) {
        showPromotionWarning = true;
      }
    }
  }

  // Create category grid cards
  const categoryCards = Object.entries(SUPPORT_CATEGORIES).map(([key, cat]) => {
    let desc = "";
    switch (key) {
      case "ban": desc = "Yasaklama ve sunucudaki cezalarınız hakkında itirazda bulunmak için talep oluşturun."; break;
      case "reklam": desc = "Reklam sponsorlukları ve iş ortaklıkları hakkında bilgi almak için başvurun."; break;
      case "report": desc = "Kuralları ihlal eden kullanıcıları moderatör ekibimize bildirin."; break;
      case "billing": desc = "EkoCoin ve diğer ödeme işlemleriyle ilgili karşılaştığınız sorunları iletin."; break;
      case "technical": desc = "Sistemlerimiz ve Discord botu ile ilgili teknik sorunları çözün."; break;
      case "account": desc = "Roblox hesabı eşleme veya yetki sorunlarınızı ekibimize iletin."; break;
      case "genel": desc = "Genel soru, öneri ve diğer konularda yardım almak için talep oluşturun."; break;
      default: desc = "Diğer kategorilere uymayan destek talepleriniz için başvurun."; break;
    }

    return `
      <div class="category-card" onclick="window.location.href='/tickets/new?category=${key}'">
        <div class="category-icon">${cat.name.split(" ")[0]}</div>
        <h3 class="category-title">${cat.name.split(" ").slice(1).join(" ")}</h3>
        <p class="category-desc">${desc}</p>
        <div class="category-btn">Talep Aç ➔</div>
      </div>
    `;
  }).join("");

  const content = `
    <!-- Welcome -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:2.5rem; animation:fadeUp 0.5s ease;">
      <div>
        <div style="color:var(--muted);font-size:0.9rem;margin-bottom:0.3rem;">Naber? 👋</div>
        <h1 style="font-size:2.4rem;font-weight:800;">${_esc(user.discordUsername)}</h1>
        <p class="text-muted mt-1">İşte destek sistemindeki güncel durumun.</p>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;background:rgba(255,255,255,0.03);padding:1rem 1.5rem;border-radius:16px;border:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(16px);">
        <img src="${_esc(user.discordAvatar)}" alt="Avatar"
             style="width:50px;height:50px;border-radius:50%;border:2px solid var(--accent);box-shadow:0 0 12px rgba(244,63,94,0.2);">
        <div>
          <div style="font-weight:700;">${_esc(user.discordUsername)}</div>
          <div style="font-size:0.8rem;color:var(--muted);">
            ${user.isAdmin ? '<span style="color:var(--accent2);">👑 Admin</span>' :
      user.isStaff ? '<span style="color:var(--accent);">🛡 Staff</span>' : 'Kullanıcı'}
          </div>
          <div style="display:flex; gap:0.5rem; margin-top:0.6rem; flex-wrap:wrap;">
            <a href="/settings" class="btn btn-sm" style="background:linear-gradient(135deg,#f43f5e,#e11d48); color:#fff; font-size:0.75rem; padding:0.35rem 0.8rem; text-decoration:none; font-weight:700;">⚙️ Hesap Ayarları & 2FA</a>
            <a href="/auth/discord" class="btn btn-sm btn-ghost" style="font-size:0.75rem; padding:0.35rem 0.7rem; border-color:rgba(255,255,255,0.15); text-decoration:none;">Discord Değiştir</a>
            <a href="/auth/roblox" class="btn btn-sm btn-ghost" style="font-size:0.75rem; padding:0.35rem 0.7rem; border-color:rgba(255,255,255,0.15); text-decoration:none;">Roblox Değiştir</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Roblox Linked Status or Warning Alert -->
    ${isRobloxLinked ? `
    <div style="background:rgba(74,222,128,0.07);
                border:1px solid rgba(74,222,128,0.25);
                border-radius:16px;padding:1.25rem 1.5rem;
                display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;
                margin-bottom:2rem;animation:fadeUp 0.5s ease;">
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <span style="font-size:1.5rem;">✅</span>
        <div>
          <div style="font-weight:700;color:var(--success);">
            Roblox Bağlandı
          </div>
          <div style="font-size:0.85rem;color:var(--muted);">
            Roblox Kullanıcı Adı: ${_esc(user.robloxUsername)}
          </div>
        </div>
      </div>
      <div>
        <button type="button" id="btn-sync-roles" class="btn btn-sm btn-success">🔄 Rolleri Güncelle</button>
      </div>
    </div>
    ` : `
    <div style="background:rgba(251,191,36,0.07);
                border:1px solid rgba(251,191,36,0.25);
                border-radius:16px;padding:1.25rem 1.5rem;
                display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;
                margin-bottom:2rem;box-shadow:0 0 15px rgba(251,191,36,0.05);animation:fadeUp 0.5s ease;">
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <span style="font-size:1.5rem;">⚠️</span>
        <div>
          <div style="font-weight:800;color:var(--warning);letter-spacing:0.5px;">
            ROBLOX HESABINI DOĞRULADIN MI? HEMEN DOĞRULA!!
          </div>
          <div style="font-size:0.85rem;color:var(--muted);margin-top:0.25rem;">
            Ticket açabilmek ve yetkili/üye rollerini eşitlemek için Roblox hesabını bağlaman gerekmektedir.
          </div>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
        <a href="/auth/roblox" class="btn btn-sm">🌐 Web ile Bağla</a>
        <button type="button" onclick="showFriendVerifyModal()" class="btn btn-sm btn-ghost" style="border-color:var(--border);">🤖 Arkadaş İsteği ile Doğrula</button>
      </div>
    </div>
    `}

    <div id="role-sync-result" style="display:none;margin-bottom:2rem;"></div>

    <!-- Promotion Warning Banner -->
    ${showPromotionWarning ? `
    <div style="background:rgba(251,113,133,0.07);
                border:1px solid rgba(251,113,133,0.25);
                border-radius:16px;padding:1.25rem 1.5rem;
                display:flex;align-items:center;gap:1rem;
                margin-bottom:2rem;animation:pulseBorder 2s infinite alternate;">
      <span style="font-size:1.5rem;">📈</span>
      <div>
        <div style="font-weight:700;color:var(--danger);">
          Son birkaç gündür terfi almıyorsun veya rütben değişmiyor..
        </div>
        <div style="font-size:0.85rem;color:var(--muted);margin-top:0.25rem;">
          Aktifliğini artırarak ve daha fazla ticket çözerek rütbeni yükseltebilirsin!
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Terms Warning Banner -->
    <div style="background:rgba(129,140,248,0.07);
                border:1px solid rgba(129,140,248,0.25);
                border-radius:16px;padding:1.25rem 1.5rem;
                display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;
                margin-bottom:1rem;animation:fadeUp 0.5s ease;">
      <div style="display:flex;align-items:center;gap:0.75rem;flex:1;">
        <span style="font-size:1.5rem;">🔗</span>
        <div>
          <div style="font-weight:700;color:var(--accent2);">Discord ile doğrulama ve bağlantılı roller</div>
          <div style="font-size:0.85rem;color:var(--muted);margin-top:0.25rem;">
            Roblox doğrulaması tamamlandığında Discord tarafında bağlantılı roller için şartlar otomatik güncellenir.
          </div>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
        <a href="/auth/discord" class="btn btn-sm btn-ghost" style="border-color:rgba(129,140,248,0.3);color:var(--accent2);font-weight:700;">Discord ile Giriş Yap</a>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1rem 1.25rem;margin-bottom:2rem;">
      <div style="font-weight:800;margin-bottom:0.75rem;">📋 Doğrulama Şartları</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.75rem;">
        <div style="padding:0.75rem;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:0.9rem;color:var(--muted);margin-bottom:0.3rem;">Discord OAuth</div>
          <div style="font-weight:700;color:${hasDiscordOAuth ? 'var(--success)' : 'var(--warning)'};">${hasDiscordOAuth ? '✅ Tamamlandı' : '⏳ Bekliyor'}</div>
        </div>
        <div style="padding:0.75rem;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:0.9rem;color:var(--muted);margin-bottom:0.3rem;">Roblox Doğrulaması</div>
          <div style="font-weight:700;color:${isRobloxLinked ? 'var(--success)' : 'var(--warning)'};">${isRobloxLinked ? '✅ Tamamlandı' : '⏳ Bekliyor'}</div>
        </div>
        <div style="padding:0.75rem;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:0.9rem;color:var(--muted);margin-bottom:0.3rem;">Kullanıcı adı damndoggii mi?</div>
          <div style="font-weight:700;color:${usernameIsEkonqt ? 'var(--success)' : 'var(--warning)'};">${usernameIsEkonqt ? '✅ Tamamlandı' : '⏳ Bekliyor'}</div>
        </div>
      </div>
    </div>

    <div style="background:rgba(129,140,248,0.07);
                border:1px solid rgba(129,140,248,0.25);
                border-radius:16px;padding:1.25rem 1.5rem;
                display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;
                margin-bottom:2rem;animation:fadeUp 0.5s ease;">
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <span style="font-size:1.5rem;">⚖️</span>
        <div>
          <div style="font-weight:700;color:var(--accent2);">
            Şartlarımızı kabul ettin mi?
          </div>
          <div style="font-size:0.85rem;color:var(--muted);margin-top:0.25rem;">
            Kullanım koşullarımızı ve gizlilik politikamızı okuyup onayladığınızdan emin olun.
          </div>
        </div>
      </div>
      <div>
        <a href="/legal/tos" class="btn btn-sm btn-ghost" style="border-color:rgba(129,140,248,0.3);color:var(--accent2);font-weight:700;">kabul et!</a>
      </div>
    </div>

    <!-- Ticket Categories Title -->
    <div style="margin-bottom: 1.5rem; animation:fadeUp 0.6s ease; margin-top:2rem;">
      <h2 style="font-size:1.8rem;font-weight:800;background:linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; display:inline-block;">🎫 Destek Kategorileri</h2>
      <p class="text-muted" style="margin-top:0.3rem;">Yaşadığınız soruna en uygun kategoriyi seçerek yeni bir destek talebi (ticket) başlatın.</p>
    </div>

    <!-- Categories Grid -->
    <div class="category-grid" style="animation:fadeUp 0.7s ease; margin-bottom:2.5rem;">
      ${categoryCards}
    </div>

    <style>
      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
        margin-top: 1rem;
      }
      .category-card {
        background: rgba(255, 255, 255, 0.025);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 18px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(8px);
      }
      .category-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(129, 140, 248, 0.02));
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .category-card:hover {
        transform: translateY(-5px);
        border-color: rgba(167, 139, 250, 0.3);
        box-shadow: 0 12px 30px rgba(167, 139, 250, 0.1);
        background: rgba(255, 255, 255, 0.04);
      }
      .category-card:hover::before {
        opacity: 1;
      }
      .category-icon {
        font-size: 2.2rem;
        margin-bottom: 1rem;
        filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.2));
        transition: transform 0.3s ease;
      }
      .category-card:hover .category-icon {
        transform: scale(1.1) rotate(5deg);
      }
      .category-title {
        font-size: 1.15rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--text);
        position: relative;
        z-index: 1;
      }
      .category-desc {
        font-size: 0.85rem;
        color: var(--muted);
        line-height: 1.5;
        margin-bottom: 1.25rem;
        flex-grow: 1;
        position: relative;
        z-index: 1;
      }
      .category-btn {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--accent);
        display: flex;
        align-items: center;
        gap: 0.25rem;
        transition: transform 0.2s ease;
        position: relative;
        z-index: 1;
      }
      .category-card:hover .category-btn {
        transform: translateX(4px);
        color: #fff;
      }
      
      @keyframes pulseBorder {
        0% { border-color: rgba(251, 113, 133, 0.25); box-shadow: 0 0 10px rgba(251, 113, 133, 0.05); }
        100% { border-color: rgba(251, 113, 133, 0.5); box-shadow: 0 0 20px rgba(251, 113, 133, 0.15); }
      }
      
      @keyframes fadeUp {
        from { opacity:0; transform:translateY(20px); }
        to   { opacity:1; transform:translateY(0); }
      }
    </style>

    <script>
      async function syncRolesFromWeb() {
        const btn = document.getElementById('btn-sync-roles');
        const box = document.getElementById('role-sync-result');
        if (!btn || !box) return;
        btn.disabled = true;
        btn.textContent = '⏳ Güncelleniyor...';
        box.style.display = 'block';
        box.innerHTML = '<div class="card" style="color:var(--muted);">Roller senkronize ediliyor...</div>';
        try {
          const res = await fetch('/api/roles/sync', { method: 'POST' });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Senkronizasyon başarısız');
          }
          const added = (data.added || []).map(r => r.name).join(', ') || 'Yok';
          const removed = (data.removed || []).map(r => r.name).join(', ') || 'Yok';
          box.innerHTML = '<div class="card" style="border-left:4px solid var(--success);">' +
            '<div style="font-weight:800;margin-bottom:0.75rem;">✅ Update — ' + (data.nickname || '') + '</div>' +
            '<div style="font-size:0.9rem;margin-bottom:0.4rem;"><strong>Rütbe:</strong> ' + (data.rankName || '—') + '</div>' +
            '<div style="font-size:0.9rem;margin-bottom:0.4rem;"><strong>Eklenen:</strong> ' + added + '</div>' +
            '<div style="font-size:0.9rem;"><strong>Kaldırılan:</strong> ' + removed + '</div></div>';
        } catch (err) {
          box.innerHTML = '<div class="card" style="border-left:4px solid var(--danger);color:var(--danger);">❌ ' + err.message + '</div>';
        } finally {
          btn.disabled = false;
          btn.textContent = '🔄 Rolleri Güncelle';
        }
      }

      const syncBtn = document.getElementById('btn-sync-roles');
      if (syncBtn) syncBtn.addEventListener('click', syncRolesFromWeb);
    </script>
    
    <!-- Modal HTML -->
    <div id="friend-verify-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); z-index:1000; align-items:center; justify-content:center; padding:1.5rem;">
      <div class="card" style="width:100%; max-width:480px; position:relative; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
        <button onclick="closeFriendVerifyModal()" style="position:absolute; top:1.25rem; right:1.25rem; background:none; border:none; color:var(--muted); font-size:1.5rem; cursor:pointer;">✕</button>
        <h3 style="font-size:1.5rem; font-weight:800; margin-bottom:1rem; background:linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; display:flex; align-items:center; gap:0.5rem; text-align:left;">🤖 Arkadaş İsteği Doğrulaması</h3>
        
        <div id="fv-step-1">
          <p style="color:var(--muted); font-size:0.95rem; line-height:1.6; margin-bottom:1.5rem; text-align:left;">
            Roblox kullanıcı adınızı girin. Botumuz size Roblox üzerinden bir arkadaşlık isteği gönderecektir.
          </p>
          <label for="fv-username" style="text-align:left;">Roblox Kullanıcı Adı</label>
          <input type="text" id="fv-username" placeholder="örn: RobloxUser" style="margin-bottom:1.5rem;">
          <button onclick="startFriendVerification()" id="fv-start-btn" class="btn w-full">Arkadaş İsteği Gönder</button>
        </div>
        
        <div id="fv-step-2" style="display:none;">
          <p style="color:var(--muted); font-size:0.95rem; line-height:1.6; margin-bottom:1.5rem; text-align:left;">
            Bot size arkadaşlık isteği gönderdi! Lütfen aşağıdaki profili ziyaret edip isteği kabul edin, ardından **Doğrulamayı Tamamla** butonuna tıklayın.
          </p>
          <div style="background:rgba(0,0,0,0.2); padding:1rem; border-radius:10px; border:1px solid var(--border); text-align:center; margin-bottom:1.5rem;">
            <a id="fv-bot-profile" href="#" target="_blank" class="text-accent" style="font-weight:700; text-decoration:none; font-size:1.05rem;">🔗 Botun Roblox Profiline Git</a>
          </div>
          <button onclick="confirmFriendVerification()" id="fv-confirm-btn" class="btn w-full btn-success">✅ Doğrulamayı Tamamla</button>
        </div>
      </div>
    </div>

    <script>
      function showFriendVerifyModal() {
        document.getElementById('friend-verify-modal').style.display = 'flex';
        document.getElementById('fv-step-1').style.display = 'block';
        document.getElementById('fv-step-2').style.display = 'none';
        document.getElementById('fv-username').value = '';
      }
      
      function closeFriendVerifyModal() {
        document.getElementById('friend-verify-modal').style.display = 'none';
      }
      
      let pendingRobloxId = null;
      let pendingUsername = null;
      
      async function startFriendVerification() {
        const username = document.getElementById('fv-username').value.trim();
        if (!username) {
          showToast('Lütfen Roblox kullanıcı adınızı girin.', 'warning');
          return;
        }
        const btn = document.getElementById('fv-start-btn');
        btn.textContent = 'Gönderiliyor...';
        btn.disabled = true;
        try {
          const res = await fetch('/api/auth/roblox/friend-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            pendingRobloxId = data.robloxId;
            pendingUsername = username;
            document.getElementById('fv-bot-profile').href = data.botProfileUrl;
            document.getElementById('fv-step-1').style.display = 'none';
            document.getElementById('fv-step-2').style.display = 'block';
            showToast('Arkadaşlık isteği gönderildi!', 'success');
          } else {
            showToast(data.error || 'İstek gönderilirken bir hata oluştu.', 'error');
          }
        } catch (err) {
          showToast('Bağlantı hatası.', 'error');
        } finally {
          btn.textContent = 'Arkadaş İsteği Gönder';
          btn.disabled = false;
        }
      }
      
      async function confirmFriendVerification() {
        if (!pendingRobloxId || !pendingUsername) {
          showToast('Geçersiz doğrulama isteği.', 'error');
          return;
        }
        const btn = document.getElementById('fv-confirm-btn');
        btn.textContent = 'Kontrol ediliyor...';
        btn.disabled = true;
        try {
          const res = await fetch('/api/auth/roblox/friend-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ robloxId: pendingRobloxId, username: pendingUsername })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast('Doğrulama başarılı! Sayfa yenileniyor...', 'success');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showToast(data.error || 'Arkadaşlık isteği henüz kabul edilmemiş.', 'error');
          }
        } catch (err) {
          showToast('Bağlantı hatası.', 'error');
        } finally {
          btn.textContent = '✅ Doğrulamayı Tamamla';
          btn.disabled = false;
        }
      }
    </script>
  `;
  return _layout('Dashboard', user, content, '', '/dashboard');
}


// ─────────────────────────────────────────────
// TICKETS PAGE
// ─────────────────────────────────────────────
function renderTicketsPage(user) {
  const content = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
        <h1 style="font-size:2rem;font-weight:800;">🎫 Ticket'larım</h1>
        <a href="/tickets/new" class="btn btn-sm">➕ Yeni Ticket</a>
      </div>

      <!-- Search + Filter bar -->
      <div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        <input id="search-input" type="text" placeholder="🔍 Ticket ara..." style="flex:1;min-width:180px;margin-bottom:0;">
        <select id="filter-status" style="width:auto;margin-bottom:0;font-size:0.9rem;">
          <option value="">Tümü</option>
          <option value="open">Açık</option>
          <option value="closed">Kapalı</option>
        </select>
        <select id="filter-cat" style="width:auto;margin-bottom:0;font-size:0.9rem;">
          <option value="">Tüm Kategoriler</option>
        </select>
      </div>

      <div id="ticket-count" style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;"></div>
      <div id="tickets-container">
        <div style="color:var(--muted);text-align:center;padding:3rem;">Yükleniyor...</div>
      </div>
    </div>

    <!-- Kapatma sebebi modal -->
    <div id="close-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;">
      <div style="background:rgba(14,14,26,0.9);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:2rem;max-width:480px;width:90%;box-shadow:0 16px 40px rgba(0,0,0,0.4);">
        <h3 style="margin-bottom:1rem;">🔒 Ticket'ı Kapat</h3>
        <textarea id="close-reason-input" rows="4" placeholder="Kapatma sebebi..." style="width:100%;margin-bottom:1rem;"></textarea>
        <div style="display:flex;gap:0.75rem;">
          <button class="btn btn-danger" onclick="confirmClose()" style="flex:1;">Kapat</button>
          <button class="btn btn-ghost" onclick="document.getElementById('close-modal').style.display='none'" style="flex:1;">İptal</button>
        </div>
      </div>
    </div>

    <style>
      .ticket-item {
        background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06);
        border-radius:14px; padding:1.25rem 1.5rem;
        transition:border-color 0.3s, transform 0.3s, background 0.3s;
        margin-bottom:0.75rem;
        backdrop-filter:blur(8px);
      }
      .ticket-item:hover { border-color:rgba(167,139,250,0.2); transform:translateX(4px); background:rgba(255,255,255,0.04); }
      .ticket-item:last-child { margin-bottom:0; }
      .ticket-header { display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.5rem; }
      .ticket-meta { display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;font-size:0.8rem;color:var(--muted); }
      .ticket-actions { display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap; }
    </style>

    <script>
      let allTickets = [];
      let pendingCloseId = null;

      async function loadTickets() {
        try {
          const res  = await fetch('/api/tickets');
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          allTickets = data.tickets || [];

          const cats = [...new Set(allTickets.map(t => t.category).filter(Boolean))];
          const catSel = document.getElementById('filter-cat');
          cats.forEach(c => {
            const o = document.createElement('option');
            o.value = o.textContent = c;
            catSel.appendChild(o);
          });

          renderTickets();
        } catch (err) {
          document.getElementById('tickets-container').innerHTML =
            \`<div style="color:var(--danger);padding:1rem;">❌ \${err.message}</div>\`;
        }
      }

      function timeAgo(dateStr) {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1)  return 'az önce';
        if (m < 60) return m + 'dk önce';
        const h = Math.floor(m / 60);
        if (h < 24) return h + 'sa önce';
        const d = Math.floor(h / 24);
        if (d < 30) return d + 'g önce';
        return Math.floor(d / 30) + 'ay önce';
      }

      function renderTickets() {
        const q      = (document.getElementById('search-input').value || '').toLowerCase();
        const status = document.getElementById('filter-status').value;
        const cat    = document.getElementById('filter-cat').value;
        const c      = document.getElementById('tickets-container');
        const countEl = document.getElementById('ticket-count');

        let tickets = allTickets;
        if (status) tickets = tickets.filter(t => t.status === status);
        if (cat)    tickets = tickets.filter(t => t.category === cat);
        if (q)      tickets = tickets.filter(t =>
          (t.ticketId || '').toLowerCase().includes(q) ||
          (t.subject  || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
        );

        countEl.textContent = tickets.length + ' ticket bulundu';

        if (!tickets.length) {
          c.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted);">Eşleşen ticket bulunamadı.</div>';
          return;
        }

        c.innerHTML = tickets.map(t => {
          const isOpen = t.status === 'open';
          const ago = timeAgo(t.createdAt);
          const closedAgo = t.closedAt ? timeAgo(t.closedAt) : null;
          const hasChannel = t.channelId && !t.channelDeleted;
          const source = t.source === 'web' ? '🌐 Web' : '💬 Discord';

          const actions = isOpen
            ? \`<button class="btn btn-sm btn-danger" onclick="openCloseModal('\${t.ticketId}')">🔒 Kapat</button>
               \${hasChannel ? \`<a href="https://discord.com/channels/\${t.guildId || ''}/\${t.channelId}" target="_blank" class="btn btn-sm btn-ghost">💬 Kanala Git</a>\` : ''}
               <button class="btn btn-sm btn-danger btn-ghost" onclick="deleteTicket('\${t.ticketId}')">🗑️ Sil</button>\`
            : \`<button class="btn btn-sm btn-success" onclick="reopenTicket('\${t.ticketId}')">🔓 Tekrar Aç</button>
               <button class="btn btn-sm btn-danger btn-ghost" onclick="deleteTicket('\${t.ticketId}')">🗑️ Sil</button>\`;

          return \`<div class="ticket-item" id="ticket-\${t.ticketId}">
            <div class="ticket-header">
              <div>
                <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.25rem;">
                  <span style="font-weight:800;color:var(--accent);">\${t.ticketId}</span>
                  \${t.category ? \`<span style="font-size:0.75rem;background:rgba(124,106,247,0.1);border:1px solid rgba(124,106,247,0.2);padding:0.1rem 0.5rem;border-radius:20px;color:var(--muted);">\${t.category}</span>\` : ''}
                  <span style="font-size:0.72rem;color:var(--muted);">\${source}</span>
                </div>
                <div style="font-weight:600;margin-bottom:0.2rem;">\${t.subject || 'Konu belirtilmedi'}</div>
              </div>
              <span class="badge badge-\${isOpen ? 'open' : 'closed'}">\${isOpen ? 'AÇIK' : 'KAPALI'}</span>
            </div>
            <div class="ticket-meta">
              \${ago ? \`<span>🕐 \${ago}</span>\` : ''}
              \${!isOpen && closedAgo ? \`<span>🔒 \${closedAgo} kapatıldı</span>\` : ''}
              \${t.closeReason ? \`<span title="\${t.closeReason}">� \${t.closeReason.slice(0,40)}\${t.closeReason.length>40?'…':''}</span>\` : ''}
            </div>
            <div class="ticket-actions">\${actions}</div>
          </div>\`;
        }).join('');
      }

      // ── Kapatma ──
      function openCloseModal(ticketId) {
        pendingCloseId = ticketId;
        document.getElementById('close-reason-input').value = '';
        document.getElementById('close-modal').style.display = 'flex';
      }

      async function confirmClose() {
        if (!pendingCloseId) return;
        const reason = document.getElementById('close-reason-input').value.trim() || 'Web üzerinden kapatıldı';
        document.getElementById('close-modal').style.display = 'none';
        try {
          const res = await fetch('/api/tickets/' + pendingCloseId + '/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
          });
          if (res.ok) { showToast('Ticket kapatıldı.', 'success'); await loadTickets(); }
          else { const d = await res.json().catch(()=>({})); showToast(d.error || 'Hata', 'error'); }
        } catch { showToast('Bağlantı hatası.', 'error'); }
        pendingCloseId = null;
      }

      // ── Tekrar Aç ──
      async function reopenTicket(ticketId) {
        if (!confirm('Bu ticket\\'ı yeniden açmak istiyor musun?')) return;
        try {
          const res = await fetch('/api/tickets/' + ticketId + '/reopen', { method: 'POST' });
          const d = await res.json().catch(() => ({}));
          if (res.ok) { showToast(d.message || 'Ticket yeniden açıldı.', 'success'); await loadTickets(); }
          else showToast(d.error || 'Hata', 'error');
        } catch { showToast('Bağlantı hatası.', 'error'); }
      }

      // ── Sil ──
      async function deleteTicket(ticketId) {
        if (!confirm('Bu ticket\\'ı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
        try {
          const res = await fetch('/api/tickets/' + ticketId, { method: 'DELETE' });
          const d = await res.json().catch(() => ({}));
          if (res.ok) { showToast(d.message || 'Ticket başarıyla tamamen silindi.', 'success'); await loadTickets(); }
          else showToast(d.error || 'Hata', 'error');
        } catch { showToast('Bağlantı hatası.', 'error'); }
      }

      document.getElementById('filter-status').addEventListener('change', renderTickets);
      document.getElementById('filter-cat').addEventListener('change', renderTickets);
      document.getElementById('search-input').addEventListener('input', renderTickets);
      loadTickets();
    </script>
  `;
  return _layout("Ticket'larım", user, content, '', '/tickets');
}


// ─────────────────────────────────────────────
// STAFF PANEL
// ─────────────────────────────────────────────
function renderStaffPanel(user) {
  const content = `
    <!-- Sekme başlıkları -->
    <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;border-bottom:1px solid var(--border);padding-bottom:0;">
      <button class="sf-tab sf-tab-active" onclick="switchTab('tickets',this)" style="padding:0.75rem 1.5rem;background:transparent;border:none;border-bottom:2px solid var(--accent);color:var(--text);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;">🎫 Ticketlar</button>
      <button class="sf-tab" onclick="switchTab('ratings',this)" style="padding:0.75rem 1.5rem;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;">⭐ Moderatör Puanları</button>
    </div>

    <!-- Ticket sekmesi -->
    <div id="tab-tickets" class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
        <h1 style="font-size:2rem;font-weight:800;">👨‍💼 Staff Panel</h1>
        <div style="display:flex;gap:0.75rem;align-items:center;">
          <select id="sf-filter" style="width:auto;margin-bottom:0;font-size:0.9rem;">
            <option value="open">Açık</option>
            <option value="closed">Kapalı</option>
            <option value="">Tümü</option>
          </select>
          <button class="btn btn-sm" onclick="loadStaff()">🔄 Yenile</button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;text-align:left;min-width:600px;">
          <thead>
            <tr style="background:rgba(167,139,250,0.06);border-bottom:1px solid rgba(255,255,255,0.06);">
              <th style="padding:0.9rem 1rem;color:var(--accent);">ID</th>
              <th style="padding:0.9rem 1rem;color:var(--accent);">Kullanıcı</th>
              <th style="padding:0.9rem 1rem;color:var(--accent);">Konu</th>
              <th style="padding:0.9rem 1rem;color:var(--accent);">Kategori</th>
              <th style="padding:0.9rem 1rem;color:var(--accent);">Durum</th>
              <th style="padding:0.9rem 1rem;color:var(--accent);">İşlem</th>
            </tr>
          </thead>
          <tbody id="sf-body">
            <tr><td colspan="6" style="padding:2rem;text-align:center;color:var(--muted);">Yükleniyor...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Moderatör Puanları sekmesi -->
    <div id="tab-ratings" class="card" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1 style="font-size:2rem;font-weight:800;">⭐ Moderatör Puan Sıralaması</h1>
          <p style="color:var(--muted);font-size:0.9rem;margin-top:0.25rem;">Kullanıcı değerlendirmelerine göre sıralama (anonim)</p>
        </div>
        <button class="btn btn-sm" onclick="loadRatings()">🔄 Yenile</button>
      </div>

      <div id="ratings-body">
        <div style="text-align:center;padding:3rem;color:var(--muted);">Yükleniyor...</div>
      </div>
    </div>

    <script>
      // ── Sekme geçişi ──────────────────────────────────────────────────────
      function switchTab(name, btn) {
        document.getElementById('tab-tickets').style.display = name === 'tickets' ? '' : 'none';
        document.getElementById('tab-ratings').style.display = name === 'ratings' ? '' : 'none';
        document.querySelectorAll('.sf-tab').forEach(t => {
          t.style.borderBottomColor = 'transparent';
          t.style.color = 'var(--muted)';
        });
        btn.style.borderBottomColor = 'var(--accent)';
        btn.style.color = 'var(--text)';
        if (name === 'ratings') loadRatings();
      }

      // ── Ticket listesi ────────────────────────────────────────────────────
      async function loadStaff() {
        const filter = document.getElementById('sf-filter').value;
        try {
          const res  = await fetch('/api/tickets/staff');
          const data = await res.json();
          const rows = (data.tickets || [])
            .filter(t => !filter || t.status === filter);

          const tbody = document.getElementById('sf-body');
          if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:2rem;text-align:center;color:var(--muted);">Ticket bulunamadı.</td></tr>';
            return;
          }

          tbody.innerHTML = rows.map(t => {
            const isOpen = t.status === 'open';
            return \`<tr style="border-bottom:1px solid var(--border);transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
              <td style="padding:1rem;font-weight:700;color:var(--accent);">\${t.ticketId}</td>
              <td style="padding:1rem;">\${t.userName || '—'}</td>
              <td style="padding:1rem;">\${t.subject || '—'}</td>
              <td style="padding:1rem;">\${t.category || '—'}</td>
              <td style="padding:1rem;"><span class="badge badge-\${isOpen ? 'open' : 'closed'}">\${isOpen ? 'AÇIK' : 'KAPALI'}</span></td>
              <td style="padding:1rem;">
                \${isOpen
                  ? \`<button class="btn btn-sm btn-danger" onclick="closeTicket('\${t.ticketId}')">Kapat</button>\`
                  : \`<button class="btn btn-sm btn-success" onclick="reopenTicket('\${t.ticketId}')">Yeniden Aç</button>\`
                }
                <button class="btn btn-sm btn-danger btn-ghost" onclick="deleteTicket('\${t.ticketId}')">Sil</button>
              </td>
            </tr>\`;
          }).join('');
        } catch (err) {
          document.getElementById('sf-body').innerHTML =
            \`<tr><td colspan="6" style="padding:1rem;color:var(--danger);">❌ \${err.message}</td></tr>\`;
        }
      }

      async function closeTicket(id) {
        if (!confirm('Bu ticket\\'ı kapatmak istediğine emin misin?')) return;
        try {
          const res = await fetch('/api/tickets/' + id + '/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Staff tarafından kapatıldı' })
          });
          if (res.ok) { showToast('Ticket kapatıldı.', 'success'); loadStaff(); }
          else showToast('İşlem başarısız.', 'error');
        } catch { showToast('Bağlantı hatası.', 'error'); }
      }

      async function reopenTicket(id) {
        try {
          const res = await fetch('/api/tickets/' + id + '/reopen', { method: 'POST' });
          if (res.ok) { showToast('Ticket yeniden açıldı.', 'success'); loadStaff(); }
          else showToast('İşlem başarısız.', 'error');
        } catch { showToast('Bağlantı hatası.', 'error'); }
      }

      async function deleteTicket(id) {
        if (!confirm('Bu ticket\\'ı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve Discord kanalı da silinecektir.')) return;
        try {
          const res = await fetch('/api/tickets/' + id, { method: 'DELETE' });
          const d = await res.json().catch(() => ({}));
          if (res.ok) { showToast('Ticket tamamen silindi.', 'success'); loadStaff(); }
          else showToast(d.error || 'İşlem başarısız.', 'error');
        } catch { showToast('Bağlantı hatası.', 'error'); }
      }

      document.getElementById('sf-filter').addEventListener('change', loadStaff);
      loadStaff();

      // ── Moderatör puan sıralaması ─────────────────────────────────────────
      async function loadRatings() {
        const box = document.getElementById('ratings-body');
        box.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted);">Yükleniyor...</div>';
        try {
          const res  = await fetch('/api/staff/ratings');
          const data = await res.json();
          const list = data.staff || [];

          if (!list.length) {
            box.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted);">Henüz değerlendirme yok.</div>';
            return;
          }

          const medals = ['🥇','🥈','🥉'];
          const rankColors = ['#fbbf24','#9ca3af','#b45309'];

          box.innerHTML = list.map((s, i) => {
            const avg   = s.averageScore.toFixed(1);
            const stars = renderStars(s.averageScore);
            const medal = medals[i] || (i + 1);
            const color = rankColors[i] || 'var(--border)';
            const dist  = (s.distribution || [0,0,0,0,0]);
            const maxDist = Math.max(...dist, 1);

            const distBars = dist.map((cnt, idx) => {
              const pct = Math.round((cnt / maxDist) * 100);
              return \`<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:3px;">
                <span style="font-size:0.75rem;color:var(--muted);width:12px;">\${idx+1}</span>
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
                  <div style="width:\${pct}%;height:100%;background:var(--accent);border-radius:3px;transition:width 0.6s;"></div>
                </div>
                <span style="font-size:0.75rem;color:var(--muted);width:20px;text-align:right;">\${cnt}</span>
              </div>\`;
            }).join('');

            return \`
            <div style="display:flex;gap:1.5rem;align-items:flex-start;padding:1.5rem;
                        background:rgba(0,0,0,0.3);border:1px solid \${color};border-radius:18px;
                        margin-bottom:1rem;transition:transform 0.2s,box-shadow 0.2s;"
                 onmouseover="this.style.transform='translateX(4px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.4)'"
                 onmouseout="this.style.transform='none';this.style.boxShadow='none'">

              <!-- Sıra -->
              <div style="font-size:1.8rem;width:36px;text-align:center;flex-shrink:0;padding-top:0.25rem;">\${medal}</div>

              <!-- Avatar -->
              <img src="\${s.avatar}" alt="" style="width:52px;height:52px;border-radius:50%;border:2px solid \${color};flex-shrink:0;">

              <!-- Bilgi -->
              <div style="flex:1;min-width:0;">
                <div style="font-size:1.15rem;font-weight:800;margin-bottom:0.25rem;">\${s.username}</div>
                <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.75rem;">
                  <span style="font-size:1.3rem;">\${stars}</span>
                  <span style="font-size:1.4rem;font-weight:800;color:\${color};">\${avg}</span>
                  <span style="color:var(--muted);font-size:0.85rem;">/ 5.0</span>
                  <span style="background:rgba(124,106,247,0.12);color:var(--accent);border:1px solid rgba(124,106,247,0.3);
                               padding:0.2rem 0.6rem;border-radius:20px;font-size:0.78rem;font-weight:700;">
                    \${s.totalRatings} değerlendirme
                  </span>
                </div>
                <!-- Puan dağılımı -->
                <div style="max-width:220px;">\${distBars}</div>
              </div>
            </div>\`;
          }).join('');
        } catch (err) {
          box.innerHTML = \`<div style="text-align:center;padding:2rem;color:var(--danger);">❌ \${err.message}</div>\`;
        }
      }

      function renderStars(score) {
        const full  = Math.floor(score);
        const half  = score - full >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        return '⭐'.repeat(full) + (half ? '✨' : '') + '☆'.repeat(empty);
      }
    </script>
  `;
  return _layout('Staff Panel', user, content);
}


// ─────────────────────────────────────────────
// DEBUG PAGE  (fixed — was truncated)
// ─────────────────────────────────────────────
function renderDebugPage(user, stats = {}, logs = []) {
  const safeStats = stats || {};
  const safeLogs = Array.isArray(logs) ? logs : [];

  const content = `
    <h1 style="font-size:2rem;font-weight:800;margin-bottom:1.5rem;color:var(--danger);">🔍 Debug Panel</h1>

    <!-- Stats Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;">
      ${Object.entries(safeStats).map(([k, v]) => `
        <div class="card" style="padding:1.25rem;">
          <div style="color:var(--muted);font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.4rem;">${_esc(k)}</div>
          <div style="font-size:2rem;font-weight:800;color:var(--accent);">${_esc(String(v))}</div>
        </div>
      `).join('') || '<div class="card" style="padding:1.25rem;color:var(--muted);">İstatistik yok.</div>'}
    </div>

    </div>

    <!-- Live Users -->
    <div class="card" style="margin-bottom:2rem;">
      <h2 style="font-size:1.4rem;font-weight:800;color:var(--success);margin-bottom:1rem;">🟢 Canlı Kullanıcılar</h2>
      <div id="live-users-output" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem;">
        <div style="color:var(--muted);">Yükleniyor...</div>
      </div>
    </div>

    <!-- Live Screen Modal -->
    <div id="live-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999;backdrop-filter:blur(10px);padding:2rem;">
      <div class="card" style="max-width:1000px;margin:0 auto;height:100%;display:flex;flex-direction:column;position:relative;">
        <button onclick="closeLiveModal()" style="position:absolute;top:1rem;right:1rem;background:var(--danger);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-weight:bold;">X</button>
        <h3 id="live-modal-title" style="margin-bottom:1rem;font-size:1.2rem;">Canlı İzleme</h3>
        <p id="live-modal-url" style="color:var(--muted);margin-bottom:1rem;font-family:monospace;"></p>
        <div id="live-screen-box" style="flex:1;background:#000;border:1px solid rgba(255,255,255,0.1);position:relative;overflow:hidden;border-radius:8px;">
          <!-- Cursor -->
          <div id="live-cursor" style="position:absolute;width:12px;height:12px;background:red;border-radius:50%;transform:translate(-50%,-50%);transition:top 0.1s,left 0.1s;pointer-events:none;z-index:10;box-shadow:0 0 10px red;"></div>
        </div>
        <div id="live-clicks-log" style="height:100px;background:rgba(255,255,255,0.05);margin-top:1rem;border-radius:8px;padding:0.5rem;overflow-y:auto;font-family:monospace;font-size:0.8rem;"></div>
      </div>
    </div>

    <!-- Logs -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2 style="font-size:1.4rem;font-weight:800;color:var(--accent);">Sistem Logları <span id="log-count"></span></h2>
        <div style="display:flex;gap:0.5rem;">
          <select id="log-filter" style="width:auto;margin-bottom:0;font-size:0.85rem;" onchange="renderLogs()">
            <option value="">Tümü</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
          </select>
        </div>
      </div>
      <div id="log-output" style="max-height:500px;overflow-y:auto;font-family:monospace;font-size:0.8rem;"></div>
    </div>

    <script>
      let rawLogs = ${JSON.stringify(safeLogs.slice().reverse())};
      let liveUsers = [];
      let watchingUserId = null;

      // ── LOG RENDERER ──
      function renderLogs() {
        const filter = document.getElementById('log-filter').value;
        const list   = filter ? rawLogs.filter(l => l.type === filter) : rawLogs;
        const colors = { ERROR:'#f87171', WARN:'#fbbf24', INFO:'#60a5fa', admin:'#a78bfa' };

        document.getElementById('log-count').innerText = \`(\${list.length})\`;
        document.getElementById('log-output').innerHTML = list.length
          ? list.map(l => {
              const time    = (l.timestamp || '').split('T')[1] || l.timestamp || '';
              const timeStr = time.split('.')[0] || time;
              const col     = colors[l.type] || '#a0a0c0';
              return \`<div style="border-bottom:1px solid rgba(255,255,255,0.07);padding:0.5rem 0;">
                <span style="color:#555;">[&thinsp;\${timeStr}&thinsp;]</span>
                <span style="color:\${col};font-weight:\${l.type==='ERROR'?'bold':'normal'};">&nbsp;\${l.type || '?'}</span>:
                <span>&nbsp;\${l.msg || ''}</span>
                \${l.details ? \`<div style="color:#888;margin-left:2rem;margin-top:0.2rem;">\${l.details}</div>\` : ''}
              </div>\`;
            }).join('')
          : '<div style="color:var(--muted);padding:1rem;text-align:center;">Log bulunamadı.</div>';
      }

      // ── LIVE USERS RENDERER ──
      function renderLiveUsers() {
        const container = document.getElementById('live-users-output');
        if (liveUsers.length === 0) {
          container.innerHTML = '<div style="color:var(--muted);">Şu an aktif kullanıcı yok.</div>';
        } else {
          container.innerHTML = liveUsers.map(u => \`
            <div class="card" style="padding:1rem;display:flex;align-items:center;gap:1rem;cursor:pointer;border:1px solid \${watchingUserId === u.userId ? 'var(--success)' : 'rgba(255,255,255,0.1)'}" onclick="openLiveModal('\${u.userId}')">
              <img src="\${u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" style="width:40px;height:40px;border-radius:50%;">
              <div>
                <div style="font-weight:bold;">\${u.username}</div>
                <div style="font-size:0.8rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;">\${u.url}</div>
              </div>
            </div>
          \`).join('');
        }

        // Update active modal if watching
        if (watchingUserId) {
          const user = liveUsers.find(u => u.userId === watchingUserId);
          if (user) {
            document.getElementById('live-modal-title').innerText = "Canlı İzleme: " + user.username;
            document.getElementById('live-modal-url').innerText = "Aktif Sayfa: " + user.url + " (" + user.w + "x" + user.h + ")";
            
            const box = document.getElementById('live-screen-box');
            const cursor = document.getElementById('live-cursor');
            
            // Calculate scale
            const scaleX = box.clientWidth / user.w;
            const scaleY = box.clientHeight / user.h;
            
            cursor.style.left = (user.x * scaleX) + 'px';
            cursor.style.top = (user.y * scaleY) + 'px';

            const clicksLog = document.getElementById('live-clicks-log');
            clicksLog.innerHTML = (user.clicks || []).map(c => 
              \`<div>[\${new Date(c.t).toLocaleTimeString()}] Tıkladı: X=\${c.x}, Y=\${c.y}</div>\`
            ).reverse().join('');
          }
        }
      }

      window.openLiveModal = function(userId) {
        watchingUserId = userId;
        document.getElementById('live-modal').style.display = 'block';
        renderLiveUsers();
      }
      
      window.closeLiveModal = function() {
        watchingUserId = null;
        document.getElementById('live-modal').style.display = 'none';
        renderLiveUsers();
      }

      // ── AUTO POLLING ──
      async function fetchData() {
        try {
          const res = await fetch('/api/activity/users');
          const data = await res.json();
          if (data && data.success) {
            liveUsers = data.users || [];
          } else {
            liveUsers = [];
          }
        } catch (e) {
          liveUsers = [];
        }
        renderLiveUsers();
        
        try {
          const res = await fetch('/api/logs');
          const data = await res.json();
          if (data && data.success) {
            rawLogs = data.logs.reverse();
            renderLogs();
          }
        } catch (e) {}
      }

      setInterval(fetchData, 2000);
      fetchData().then(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const watchId = urlParams.get('watch');
        if (watchId) {
          window.openLiveModal(watchId);
        }
      });
      renderLogs();
    </script>
  `;
  return _layout('Debug', user, content);
}


// ─────────────────────────────────────────────
// PROFILE PAGE  (guns.lol style)
// ─────────────────────────────────────────────
function renderProfilePage(user, profileUser, isOwn = false, robloxGroups = []) {
  // profileUser = profilini gösterdiğimiz kişi, user = oturum sahibi
  if (!profileUser) profileUser = user;
  const accent = _esc(profileUser.profileColor || '#7c6af7');
  const bannerBg = profileUser.discordBanner
    ? `url(${_esc(profileUser.discordBanner)}) center/cover no-repeat`
    : `linear-gradient(135deg,${accent}cc 0%,#0d0d1a 100%)`;
  const avatarSrc = _esc(profileUser.discordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png');

  // Roblox group styles and prefix configurations
  const GROUP_STYLES = {
    BEM: { color: '#4ade80', bg: 'rgba(74,222,128,.12)', border: 'rgba(74,222,128,.3)' },
    TMT: { color: '#f87171', bg: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.3)' },
    TTC: { color: '#60a5fa', bg: 'rgba(96,165,250,.12)', border: 'rgba(96,165,250,.3)' },
    EKO: { color: '#fbbf24', bg: 'rgba(251,191,36,.12)', border: 'rgba(251,191,36,.3)' },
    CTE: { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.3)' },
    TFD: { color: '#22d3ee', bg: 'rgba(34,211,238,.12)', border: 'rgba(34,211,238,.3)' },
    TMA: { color: '#f472b6', bg: 'rgba(244,114,182,.12)', border: 'rgba(244,114,182,.3)' },
  };

  const GROUP_PREFIXES = {
    "35898429": "TTC",
    "35431216": "EKO",
    "35757415": "CTE",
    "17241052": "TFD",
    "11517908": "TMT",
    "33499704": "TMA",
    "8505535": "BEM"
  };

  const badgesList = [];

  if (Array.isArray(robloxGroups)) {
    for (const g of robloxGroups) {
      const groupIdStr = String(g.group?.id || '');
      const prefix = GROUP_PREFIXES[groupIdStr];
      if (prefix && g.role?.rank > 0 && g.role?.name && g.role.name.toLowerCase() !== 'guest') {
        const style = GROUP_STYLES[prefix] || { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.3)' };
        badgesList.push({
          name: `${prefix} - ${g.role.name}`,
          color: style.color,
          bg: style.bg,
          border: style.border
        });
      }
    }
  }

  const roleBadgesHtml = badgesList.map(r =>
    `<span class="p-badge" style="background:${r.bg};color:${r.color};border-color:${r.border};">${_esc(r.name)}</span>`
  ).join('');

  const groupRoleHtml = '';

  const css = `<style>
    main{max-width:100%!important;padding:0!important}
    ${profileUser.profileBgUrl ? `
      body {
        background: url('${_esc(profileUser.profileBgUrl)}') center/cover no-repeat fixed !important;
      }
    ` : ''}
    @keyframes aurora{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    @keyframes fireAni{0%,100%{filter:hue-rotate(0deg) brightness(1)}50%{filter:hue-rotate(25deg) brightness(1.25)}}
    @keyframes galaxy{0%{background-position:0% 0%}100%{background-position:200% 200%}}
    @keyframes neonPulse{0%,100%{box-shadow:0 0 12px ${accent},0 0 24px ${accent}44}50%{box-shadow:0 0 24px #f953c6,0 0 48px #f953c644}}
    @keyframes ocean{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    .eff-aurora .p-banner{background:linear-gradient(270deg,#00c6ff,#0072ff,#7c6af7,#ff6bf7,#00c6ff)!important;background-size:400% 400%!important;animation:aurora 6s ease infinite}
    .eff-fire .p-banner{animation:fireAni 2s ease infinite}
    .eff-galaxy .p-banner{background:linear-gradient(135deg,#0f0c29,#302b63,#24243e,#7c6af7,#0f0c29)!important;background-size:400% 400%!important;animation:galaxy 10s linear infinite}
    .eff-neon .p-card{animation:neonPulse 2.5s ease-in-out infinite}
    .eff-ocean .p-banner{background:linear-gradient(270deg,#1a6b8a,#00b4d8,#90e0ef,#1a6b8a)!important;background-size:400% 400%!important;animation:ocean 5s ease infinite}
    .frm-gold .p-avatar{border-color:#fbbf24!important;box-shadow:0 0 0 4px #fbbf2466,0 0 24px #fbbf2488!important}
    .frm-diamond .p-avatar{box-shadow:0 0 0 4px #a8edea66,0 0 24px #a8edea88!important}
    .frm-fire .p-avatar{border-color:#ff4e00!important;box-shadow:0 0 0 4px #ff4e0066,0 0 24px #ff4e0088!important;animation:fireAni 2s ease infinite}
    .p-root{max-width:860px;margin:0 auto;padding:2rem 1rem 4rem;animation:fadeUp .5s ease}
    .p-banner{width:100%;height:280px;border-radius:20px;position:relative;overflow:hidden;background:${bannerBg};box-shadow:0 8px 40px rgba(0,0,0,.6)}
    .p-banner-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(5,5,8,.85) 100%)}
    .p-avatar-wrap{position:absolute;bottom:-52px;left:2.5rem;filter:drop-shadow(0 4px 16px rgba(0,0,0,.7))}
    .p-avatar{width:120px;height:120px;border-radius:50%;border:5px solid #050508;display:block;transition:transform .3s}
    .p-avatar:hover{transform:scale(1.05)}
    .p-body{padding:4.5rem 2.5rem 2rem}
    .p-name-row{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:.75rem}
    .p-name{font-size:2rem;font-weight:800;line-height:1.1}
    .p-sub{color:var(--muted);font-size:.9rem;margin-top:.2rem}
    .p-badges{display:flex;gap:.4rem;flex-wrap:wrap;margin:.75rem 0}
    .p-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.25rem .7rem;border-radius:20px;font-size:.78rem;font-weight:700;border:1px solid;backdrop-filter:blur(4px)}
    .p-bio{font-size:.95rem;line-height:1.75;color:var(--muted);white-space:pre-wrap;word-break:break-word;margin:1rem 0 1.5rem;padding:1rem 1.25rem;background:rgba(255,255,255,.03);border-left:3px solid ${accent};border-radius:0 10px 10px 0}
    .p-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.75rem;margin:1.5rem 0}
    .p-stat{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:1rem;text-align:center;transition:border-color .3s,transform .3s;backdrop-filter:blur(8px)}
    .p-stat:hover{border-color:${accent}44;transform:translateY(-3px)}
    .p-stat-val{font-size:1.5rem;font-weight:800}
    .p-stat-lbl{font-size:.72rem;color:var(--muted);margin-top:.2rem;text-transform:uppercase;letter-spacing:.5px}
    .p-coin-bar{display:flex;align-items:center;gap:.75rem;background:rgba(167,139,250,.06);border:1px solid rgba(167,139,250,.12);border-radius:14px;padding:.9rem 1.25rem;margin-bottom:1.5rem;backdrop-filter:blur(8px)}
    .p-coin-icon{font-size:1.6rem;animation:float 3s ease-in-out infinite}
    .p-coin-val{font-size:1.4rem;font-weight:800}
    .p-coin-lbl{font-size:.75rem;color:var(--muted)}
    .p-inv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:.75rem}
    .p-inv-item{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:.9rem .5rem;text-align:center;position:relative;transition:border-color .3s,transform .3s;backdrop-filter:blur(8px)}
    .p-inv-item:hover{border-color:${accent}44;transform:translateY(-3px)}
    .p-inv-item.active{border-color:${accent};background:rgba(167,139,250,.06)}
    .p-inv-active-tag{position:absolute;top:5px;right:5px;font-size:.6rem;font-weight:800;text-transform:uppercase;background:${accent};color:#fff;padding:1px 5px;border-radius:8px}
    .p-inv-icon{font-size:1.8rem;margin-bottom:.35rem}
    .p-inv-name{font-size:.72rem;font-weight:700;line-height:1.2}
    .p-section{margin:2rem 0 1rem;display:flex;align-items:center;gap:.5rem}
    .p-section-title{font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted)}
    .p-section-line{flex:1;height:1px;background:var(--border)}
    @media(max-width:600px){.p-banner{height:180px}.p-avatar{width:90px;height:90px}.p-avatar-wrap{bottom:-40px;left:1.25rem}.p-body{padding:3.5rem 1.25rem 1.5rem}.p-name{font-size:1.5rem}}
  </style>`;

  const profileDiscordId = _esc(profileUser.discordId || '');

  const html = `
    <div class="p-root" id="p-root">
      <div class="p-banner" id="p-banner">
        <div class="p-banner-overlay"></div>
        <div class="p-avatar-wrap">
          <img src="${avatarSrc}" class="p-avatar" id="p-avatar" alt="avatar">
        </div>
      </div>
      <div class="card p-card p-body" style="border-radius:0 0 20px 20px;border-top:none;margin-top:0;">
        <div class="p-name-row">
          <div>
            <div class="p-name">${_esc(profileUser.discordUsername)}</div>
            <div class="p-sub">${profileUser.robloxUsername ? `🎮 <span style="color:var(--success);">${_esc(profileUser.robloxUsername)}</span>` : `<span style="color:var(--muted);">Roblox bağlı değil</span>`}</div>
            ${groupRoleHtml}
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
              ${profileUser.gunsLolUrl ? `
                <a href="${_esc(profileUser.gunsLolUrl)}" target="_blank" class="btn btn-sm" style="background:linear-gradient(135deg, #ff007f 0%, #7f00ff 100%);color:#fff;border:none;box-shadow:0 0 15px rgba(255,0,127,0.4);display:inline-flex;align-items:center;gap:0.4rem;margin-top:0.5rem;font-weight:700;padding: 0.35rem 0.75rem; border-radius: 8px;font-size:0.8rem;text-decoration:none;">
                  <span>🔗 guns.lol</span>
                </a>
              ` : ''}
              ${profileUser.profileMusicUrl ? `
                <div style="margin-top: 0.5rem; padding: 0.3rem 0.6rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; display: inline-flex; align-items: center; gap: 0.5rem; backdrop-filter: blur(8px);">
                  <span style="font-size: 0.9rem;">🎵</span>
                  <span style="font-size: 0.75rem; color: var(--muted);" id="music-status">Müzik: Durdu</span>
                  <button onclick="toggleProfileMusic()" id="play-btn" style="background: var(--accent); border: none; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.65rem;">▶</button>
                  <audio id="profile-audio" src="${_esc(profileUser.profileMusicUrl)}" loop></audio>
                </div>
              ` : ''}
            </div>
          </div>
          ${isOwn ? `<a href="/settings" class="btn btn-ghost btn-sm" style="flex-shrink:0;">✏️ Düzenle</a>` : ''}
        </div>
        <div class="p-badges" id="p-badges">
          ${roleBadgesHtml}
        </div>
        <div class="p-bio">${_esc(profileUser.profileBio || 'Henüz bir biyografi eklenmemiş.')}</div>
        <div class="p-coin-bar">
          <div class="p-coin-icon">💰</div>
          <div><div class="p-coin-val" id="p-balance">—</div><div class="p-coin-lbl">Bakiye</div></div>
          <div style="margin-left:auto;text-align:right;">
            <div style="font-size:.85rem;font-weight:700;color:var(--success);" id="p-earned">—</div>
            <div class="p-coin-lbl">Toplam kazanılan</div>
          </div>
          ${isOwn ? `<a href="/shop" class="btn btn-sm" style="margin-left:1rem;flex-shrink:0;">🛒 Mağaza</a>` : ''}
        </div>
        <div class="p-section"><span class="p-section-title">İstatistikler</span><div class="p-section-line"></div></div>
        <div class="p-stats">
          <div class="p-stat"><div class="p-stat-val" id="stat-tickets">—</div><div class="p-stat-lbl">Ticket</div></div>
          <div class="p-stat"><div class="p-stat-val" id="stat-closed">—</div><div class="p-stat-lbl">Çözülen</div></div>
          <div class="p-stat"><div class="p-stat-val" id="stat-items">—</div><div class="p-stat-lbl">Ürün</div></div>
          <div class="p-stat"><div class="p-stat-val" id="stat-spent">—</div><div class="p-stat-lbl">Harcanan</div></div>
        </div>
        <div class="p-section"><span class="p-section-title">Envanter</span><div class="p-section-line"></div></div>
        <div class="p-inv-grid" id="p-inv"><div style="grid-column:1/-1;color:var(--muted);font-size:.85rem;">Yükleniyor...</div></div>
      </div>
    </div>`;

  const script = `<script>
    const TARGET_ID = ${JSON.stringify(profileUser.discordId || '')};
    const IS_OWN = ${isOwn ? 'true' : 'false'};
    const BADGE_MAP={badge_supporter:{emoji:'💜',label:'Destekçi',color:'rgba(168,85,247,.15)',border:'rgba(168,85,247,.4)',text:'#c084fc'},badge_veteran:{emoji:'⚔️',label:'Veteran',color:'rgba(251,191,36,.1)',border:'rgba(251,191,36,.4)',text:'#fbbf24'},badge_star:{emoji:'⭐',label:'Yıldız',color:'rgba(251,191,36,.1)',border:'rgba(251,191,36,.3)',text:'#fde68a'},badge_crown:{emoji:'👑',label:'Kral',color:'rgba(255,107,247,.1)',border:'rgba(255,107,247,.4)',text:'var(--accent2)'}};

    async function loadProfile(){
      try{
        // Ekonomi verisi — herkese açık endpoint (targetId ile)
        const eRes = await fetch('/api/economy/public/' + TARGET_ID);
        const ed = await eRes.json().catch(()=>({}));

        // Ticket istatistikleri — sadece kendi profilinde
        if(IS_OWN){
          const tRes = await fetch('/api/tickets');
          const td = await tRes.json().catch(()=>({}));
          const tickets=td.tickets||[];
          document.getElementById('stat-tickets').textContent=tickets.length;
          document.getElementById('stat-closed').textContent=tickets.filter(t=>t.status==='closed').length;
        } else {
          document.getElementById('stat-tickets').textContent='—';
          document.getElementById('stat-closed').textContent='—';
        }

        if(ed.success){
          document.getElementById('p-balance').textContent=(ed.balance||0).toLocaleString('tr-TR')+' coin';
          document.getElementById('p-earned').textContent='+'+(ed.totalEarned||0).toLocaleString('tr-TR')+' coin';
          document.getElementById('stat-items').textContent=(ed.inventory||[]).length;
          document.getElementById('stat-spent').textContent=(ed.totalSpent||0).toLocaleString('tr-TR');

          // Rozet ekle
          const br=document.getElementById('p-badges');
          (ed.profileBadges||[]).forEach(bid=>{const b=BADGE_MAP[bid];if(!b)return;const s=document.createElement('span');s.className='p-badge';s.style.cssText='background:'+b.color+';color:'+b.text+';border-color:'+b.border+';';s.textContent=b.emoji+' '+b.label;br.appendChild(s);});

          // Efekt/frame uygula
          const root=document.getElementById('p-root');
          if(ed.profileEffect)root.classList.add('eff-'+ed.profileEffect.replace('effect_',''));
          if(ed.profileFrame)root.classList.add('frm-'+ed.profileFrame.replace('frame_',''));

          // Envanter
          const inv=ed.inventory||[];
          const grid=document.getElementById('p-inv');
          if(!inv.length){
            grid.innerHTML=IS_OWN
              ? '<div style="grid-column:1/-1;color:var(--muted);font-size:.85rem;">Henüz hiçbir şey satın almadınız. <a href=\\"/shop\\" style=\\"color:var(--accent)\\">Mağazaya git →</a></div>'
              : '<div style="grid-column:1/-1;color:var(--muted);font-size:.85rem;">Envanter boş.</div>';
          } else {
            grid.innerHTML=inv.map(item=>{
              const isActive=ed.profileEffect===item.itemId||ed.profileFrame===item.itemId;
              const canEquip=IS_OWN&&(item.type==='effect'||item.type==='frame');
              return '<div class="p-inv-item'+(isActive?' active':'')+'">'+
                (isActive?'<div class="p-inv-active-tag">Aktif</div>':'')+
                '<div class="p-inv-icon">'+item.icon+'</div>'+
                '<div class="p-inv-name">'+item.name+'</div>'+
                (canEquip&&!isActive?'<button onclick="equipItem(\''+item.itemId+'\')" style="margin-top:.4rem;background:rgba(124,106,247,.2);border:1px solid rgba(124,106,247,.4);color:var(--accent);border-radius:8px;padding:2px 10px;font-size:.7rem;cursor:pointer;font-family:inherit;font-weight:700;">Tak</button>':'')+
                '</div>';
            }).join('');
          }
        }
      }catch(err){console.warn('Profil yüklenemedi:',err.message);}
    }

    async function equipItem(itemId){
      const res=await fetch('/api/profile/equip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({itemId})});
      const d=await res.json().catch(()=>({}));
      if(res.ok){showToast(d.message||'Aktif edildi!','success');setTimeout(()=>location.reload(),700);}
      else showToast(d.error||'Hata','error');
    }
    function toggleProfileMusic() {
      const audio = document.getElementById('profile-audio');
      const btn = document.getElementById('play-btn');
      const status = document.getElementById('music-status');
      if (!audio) return;
      if (audio.paused) {
        audio.play().then(() => {
          btn.textContent = '⏸';
          status.textContent = 'Müzik: Çalıyor';
          btn.style.background = 'var(--danger)';
        }).catch(err => {
          console.warn("Müzik çalınamadı:", err);
          showToast("Tarayıcı engeli: Sayfada herhangi bir yere tıkladıktan sonra çal tuşuna tekrar basın.", "warning");
        });
      } else {
        audio.pause();
        btn.textContent = '▶';
        status.textContent = 'Müzik: Durdu';
        btn.style.background = 'var(--accent)';
      }
    }
    loadProfile();
  <\/script>`;

  const pageTitle = isOwn ? 'Profil' : _esc(profileUser.discordUsername) + ' — Profil';
  const content = css + html + script;
  return _layout(pageTitle, user, content);
}


// ─────────────────────────────────────────────
// SETTINGS PAGE
// ─────────────────────────────────────────────
function renderSettingsPage(user) {
  const content = `
    <div class="card">
      <h1 style="font-size:2rem;font-weight:800;margin-bottom:2rem;">⚙️ Ayarlar</h1>

      <div id="settings-form">
        <label>Profil Rengi (Hex)</label>
        <input type="color" id="color" value="${_esc(user.profileColor || '#7c6af7')}"
               style="width:60px;height:44px;padding:4px;cursor:pointer;margin-bottom:1.2rem;">
        <input type="text"  id="colorText" value="${_esc(user.profileColor || '#7c6af7')}"
               placeholder="#7c6af7" style="margin-top:-0.5rem;">

        <label>Biyografi</label>
        <textarea id="bio" rows="5" placeholder="Kendinden bahset..." maxlength="500">${_esc(user.profileBio || '')}</textarea>
        <div style="text-align:right;color:var(--muted);font-size:0.8rem;margin-top:-1rem;margin-bottom:1rem;">
          <span id="bio-count">${(user.profileBio || '').length}</span>/500
        </div>

        <label>Site Giriş Şifresi</label>
        <input type="password" id="sitePassword" placeholder="Yeni site şifresi girin (Değiştirmek istemiyorsanız boş bırakın)">

        <hr class="divider">
        <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:1rem;">🎨 Guns.lol Tarzı Profil Özelleştirme</h2>
        
        <label>Guns.lol Bağlantı Linki</label>
        <input type="text" id="gunsLolUrl" value="${_esc(user.gunsLolUrl || '')}" placeholder="https://guns.lol/kullaniciadi">

        <label>Profil Özel Arkaplan Resim/GIF URL</label>
        <input type="text" id="profileBgUrl" value="${_esc(user.profileBgUrl || '')}" placeholder="https://ornek.com/resim.gif">

        <label>Profil Özel Arkaplan Müzik (.mp3) URL</label>
        <input type="text" id="profileMusicUrl" value="${_esc(user.profileMusicUrl || '')}" placeholder="https://ornek.com/muzik.mp3">

        <hr class="divider">

        <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:1rem;">🔗 Bağlı Hesaplar</h2>
        <div style="background:rgba(255,255,255,0.025);padding:1rem 1.25rem;border-radius:12px;border:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;backdrop-filter:blur(8px);">
          <div>
            <div style="font-weight:700;margin-bottom:0.2rem;">Discord</div>
            <div style="color:var(--success);font-size:0.85rem;">✅ ${_esc(user.discordUsername)}</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.025);padding:1rem 1.25rem;border-radius:12px;border:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;backdrop-filter:blur(8px);">
          <div>
            <div style="font-weight:700;margin-bottom:0.2rem;">Roblox</div>
            <div style="color:${user.robloxUsername ? 'var(--success)' : 'var(--warning)'};font-size:0.85rem;">
              ${user.robloxUsername ? '✅ ' + _esc(user.robloxUsername) : '⚠️ Bağlı değil'}
            </div>
          </div>
          ${!user.robloxUsername ? `<a href="/auth/roblox" class="btn btn-sm">Bağla</a>` : `<a href="/auth/roblox/unlink" class="btn btn-sm btn-danger">Bağlantıyı Kes</a>`}
        </div>

        <button class="btn w-full" id="save-btn" onclick="saveSettings()">💾 Kaydet</button>
      </div>
    </div>

    <script>
      const bioEl   = document.getElementById('bio');
      const countEl = document.getElementById('bio-count');
      const colorEl = document.getElementById('color');
      const colorTx = document.getElementById('colorText');

      bioEl.addEventListener('input', () => { countEl.textContent = bioEl.value.length; });
      colorEl.addEventListener('input', () => { colorTx.value = colorEl.value; });
      colorTx.addEventListener('input', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(colorTx.value)) colorEl.value = colorTx.value;
      });

      async function saveSettings() {
        const btn = document.getElementById('save-btn');
        btn.textContent = 'Kaydediliyor...';
        btn.disabled = true;
        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileColor: colorEl.value,
              profileBio: bioEl.value,
              sitePassword: document.getElementById('sitePassword').value,
              gunsLolUrl: document.getElementById('gunsLolUrl').value,
              profileBgUrl: document.getElementById('profileBgUrl').value,
              profileMusicUrl: document.getElementById('profileMusicUrl').value
            })
          });
          if (res.ok) {
            showToast('Ayarlar başarıyla kaydedildi!', 'success');
            document.getElementById('sitePassword').value = ''; // clear password input after success
          } else {
            const d = await res.json().catch(() => ({}));
            showToast(d.error || 'Bir hata oluştu.', 'error');
          }
        } catch {
          showToast('Bağlantı hatası.', 'error');
        } finally {
          btn.textContent = '💾 Kaydet';
          btn.disabled = false;
        }
      }
    </script>
  `;
  return _layout('Ayarlar', user, content);
}


// ─────────────────────────────────────────────
// LEGAL PAGE
// ─────────────────────────────────────────────
function renderLegalPage(title, text, lang = 'tr') {
  const content = `
    <div class="card" style="max-width:860px;margin:0 auto;">
      <!-- Dil seçici -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;">
        <h1 style="font-size:2rem;font-weight:800;color:var(--accent);">${_esc(title)}</h1>
        <div style="display:flex;gap:.5rem;">
          <a href="?lang=tr" style="padding:.4rem .9rem;border-radius:8px;font-size:.85rem;font-weight:700;text-decoration:none;background:${lang === 'tr' ? 'var(--accent)' : 'rgba(255,255,255,.07)'};color:${lang === 'tr' ? '#fff' : 'var(--muted)'};border:1px solid ${lang === 'tr' ? 'transparent' : 'var(--border)'};">🇹🇷 TR</a>
          <a href="?lang=en" style="padding:.4rem .9rem;border-radius:8px;font-size:.85rem;font-weight:700;text-decoration:none;background:${lang === 'en' ? 'var(--accent)' : 'rgba(255,255,255,.07)'};color:${lang === 'en' ? '#fff' : 'var(--muted)'};border:1px solid ${lang === 'en' ? 'transparent' : 'var(--border)'};">🇬🇧 EN</a>
        </div>
      </div>
      <div style="line-height:2;color:var(--muted);font-size:.97rem;">${text}</div>
      <hr class="divider">
      <div style="display:flex;gap:1.5rem;flex-wrap:wrap;">
        <a href="/legal/tos"     style="color:var(--accent);text-decoration:none;font-weight:600;">📄 Terms of Service / Hizmet Koşulları</a>
        <a href="/legal/privacy" style="color:var(--accent);text-decoration:none;font-weight:600;">🔒 Privacy Policy / Gizlilik Politikası</a>
        <a href="/"              style="color:var(--muted);text-decoration:none;">← Ana Sayfa</a>
      </div>
    </div>
  `;
  return _layout(title, null, content);
}


// ─────────────────────────────────────────────
// WIKI PAGE
// ─────────────────────────────────────────────
function renderWikiListPage(user, articles = [], canManage = false) {
  const adminForm = canManage ? `
    <div id="wa-form" style="display:none;background:rgba(124,106,247,0.06);border:1px solid var(--border);border-radius:16px;padding:1.5rem;margin-bottom:2rem;">
      <h3 style="margin-bottom:1rem;color:var(--accent);">➕ Yeni Makale</h3>
      <label>Başlık <span style="color:var(--danger);">*</span></label>
      <input type="text" id="wa-title" maxlength="120" placeholder="Makale başlığı">
      <label>Kapak Resmi URL</label>
      <input type="url" id="wa-image" placeholder="https://...">
      <label>İçerik <span style="color:var(--danger);">*</span></label>
      <textarea id="wa-body" rows="10" maxlength="20000" placeholder="Makale içeriğini buraya yazın..."></textarea>
      <div style="text-align:right;color:var(--muted);font-size:0.8rem;margin-top:-1rem;margin-bottom:1rem;"><span id="wa-count">0</span>/20000</div>
      <div style="display:flex;gap:0.75rem;">
        <button class="btn" id="wa-create-btn" onclick="createWikiArticle()" style="flex:1;">📖 Yayınla</button>
        <button class="btn btn-ghost" onclick="document.getElementById('wa-form').style.display='none'" style="flex:1;">İptal</button>
      </div>
    </div>` : '';

  const listHtml = articles.length ? articles.map(a => {
    const preview = (a.body || '').replace(/\n/g, ' ').slice(0, 160);
    const img = a.imageUrl
      ? `<div style="width:100%;height:160px;background:url('${_esc(a.imageUrl)}') center/cover;border-radius:12px 12px 0 0;flex-shrink:0;"></div>`
      : `<div style="width:100%;height:80px;background:linear-gradient(135deg,rgba(124,106,247,0.15),rgba(255,107,247,0.1));border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;font-size:2rem;">📖</div>`;
    const authorAvatar = a.authorAvatar
      ? `<img src="${_esc(a.authorAvatar)}" style="width:20px;height:20px;border-radius:50%;vertical-align:middle;margin-right:4px;">`
      : '';
    const ts = a.createdAt ? `<t:${Math.floor(new Date(a.createdAt).getTime() / 1000)}:d>` : '';
    return `
      <a href="/wiki/${_esc(a._id)}" style="display:flex;flex-direction:column;text-decoration:none;color:inherit;
              background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;
              transition:transform 0.3s,border-color 0.3s,box-shadow 0.3s;backdrop-filter:blur(8px);"
         onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='rgba(167,139,250,0.2)';this.style.boxShadow='0 12px 30px rgba(0,0,0,0.3)'"
         onmouseout="this.style.transform='none';this.style.borderColor='rgba(255,255,255,0.06)';this.style.boxShadow='none'">
        ${img}
        <div style="padding:1.25rem;flex:1;display:flex;flex-direction:column;gap:0.5rem;">
          <h3 style="font-weight:800;font-size:1.1rem;line-height:1.3;">${_esc(a.title)}</h3>
          <p style="color:var(--muted);font-size:0.88rem;line-height:1.5;flex:1;">${_esc(preview)}${preview.length >= 160 ? '…' : ''}</p>
          <div style="display:flex;gap:1rem;font-size:0.78rem;color:var(--muted);margin-top:0.5rem;flex-wrap:wrap;">
            <span>${authorAvatar}${_esc(a.authorName || '—')}</span>
            <span>👁 ${(a.views || 0).toLocaleString('tr-TR')}</span>
            <span>💬 ${(a.commentCount || 0)}</span>
          </div>
        </div>
      </a>`;
  }).join('') : '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--muted);"><div style="font-size:3rem;margin-bottom:1rem;">📭</div><div>Henüz makale yok.</div></div>';

  const content = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1 style="font-size:2.2rem;font-weight:800;">📖 Wiki</h1>
          <p style="color:var(--muted);margin-top:0.25rem;">${articles.length} makale</p>
        </div>
        ${canManage ? `<button class="btn" onclick="document.getElementById('wa-form').style.display=document.getElementById('wa-form').style.display==='none'?'block':'none'">➕ Yeni Makale</button>` : ''}
      </div>
      <hr class="divider">
      ${adminForm}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem;">
        ${listHtml}
      </div>
    </div>

    <script>
      const waBody = document.getElementById('wa-body');
      const waCount = document.getElementById('wa-count');
      if (waBody) waBody.addEventListener('input', () => { waCount.textContent = waBody.value.length; });

      async function createWikiArticle() {
        const btn = document.getElementById('wa-create-btn');
        btn.disabled = true; btn.textContent = 'Yayınlanıyor...';
        const res = await fetch('/api/wiki/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: document.getElementById('wa-title').value.trim(),
            body: waBody.value.trim(),
            imageUrl: document.getElementById('wa-image').value.trim() || null
          })
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok) { location.href = '/wiki/' + d.article._id; }
        else { showToast(d.error || 'Hata', 'error'); btn.disabled = false; btn.textContent = '📖 Yayınla'; }
      }
    </script>
  `;
  return _layout('Wiki', user, content, '', '/wiki');
}

function renderWikiArticlePage(user, article, canManage = false) {
  const comments = (article.comments || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const reactions = article.reactions || {};
  const EMOJIS = ["👍", "❤️", "🔥", "😂", "😮", "👏"];
  const currentUserId = user ? _esc(user.discordId || '') : '';

  // ── Kapak resmi ──
  const coverImg = article.imageUrl
    ? `<div style="width:100%;max-height:380px;overflow:hidden;border-radius:16px;margin-bottom:2rem;">
         <img src="${_esc(article.imageUrl)}" alt="" style="width:100%;object-fit:cover;display:block;">
       </div>`
    : '';

  // ── Yazar satırı ──
  const authorAvatar = article.authorAvatar
    ? `<img src="${_esc(article.authorAvatar)}" style="width:28px;height:28px;border-radius:50%;vertical-align:middle;">`
    : `<div style="width:28px;height:28px;border-radius:50%;background:var(--accent);display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;">
         ${_esc((article.authorName || '?')[0].toUpperCase())}
       </div>`;
  const authorLink = article.authorId
    ? `/profile/${_esc(article.authorId)}`
    : null;
  const authorNameHtml = authorLink
    ? `<a href="${authorLink}" style="color:var(--text);font-weight:600;text-decoration:none;transition:color .2s;"
          onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text)'">${_esc(article.authorName || '—')}</a>`
    : `<span style="color:var(--text);font-weight:600;">${_esc(article.authorName || '—')}</span>`;
  const createdTs = article.createdAt
    ? `<time title="${new Date(article.createdAt).toLocaleString('tr-TR')}">${new Date(article.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</time>`
    : '';
  const editedLine = article.editedByName && article.editedAt
    ? `<span style="color:var(--muted);font-size:0.8rem;margin-left:0.75rem;">
         • Düzenleyen: <a href="/profile/${_esc(article.editedById || '')}" style="color:var(--muted);font-weight:700;text-decoration:none;"
             onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--muted)'">${_esc(article.editedByName)}</a>
         <time title="${new Date(article.editedAt).toLocaleString('tr-TR')}">${new Date(article.editedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
       </span>`
    : '';

  // ── Tepkiler ──
  const reactionHtml = EMOJIS.map(e => {
    const r = reactions[e];
    const count = r ? r.count : 0;
    const reacted = r && user && (r.users || []).includes(user.discordId || '');
    return `<button onclick="reactTo('${e}')" data-emoji="${e}"
      style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.4rem 0.85rem;
             border-radius:20px;border:1px solid ${reacted ? 'var(--accent)' : 'var(--border)'};
             background:${reacted ? 'rgba(124,106,247,0.15)' : 'rgba(0,0,0,0.25)'};
             color:${reacted ? 'var(--accent)' : 'var(--text)'};
             font-family:inherit;font-size:0.9rem;cursor:pointer;transition:all 0.2s;"
      onmouseover="this.style.borderColor='var(--accent)'"
      onmouseout="this.style.borderColor='${reacted ? 'var(--accent)' : 'var(--border)'}'">
      ${e} ${count > 0 ? `<span style="font-size:0.8rem;font-weight:700;">${count}</span>` : ''}
    </button>`;
  }).join('');

  // ── Yorumlar ──
  const commentsHtml = comments.map(c => {
    const isOwner = user && (user.discordId === c.userId || canManage);
    const delBtn = isOwner
      ? `<button onclick="deleteComment('${_esc(c._id)}')"
           style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:0.8rem;padding:0.2rem 0.5rem;border-radius:6px;transition:color 0.2s;"
           onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--muted)'">🗑</button>`
      : '';
    const cAvatar = c.avatar
      ? `<img src="${_esc(c.avatar)}" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;">`
      : `<div style="width:36px;height:36px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0;">${_esc((c.username || '?')[0].toUpperCase())}</div>`;
    const cTime = c.createdAt
      ? `<span style="font-size:0.75rem;color:var(--muted);">${new Date(c.createdAt).toLocaleString('tr-TR')}</span>`
      : '';
    return `
      <div id="comment-${_esc(c._id)}" style="display:flex;gap:0.75rem;padding:1rem;background:rgba(0,0,0,0.25);border-radius:14px;border:1px solid var(--border);">
        ${cAvatar}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;flex-wrap:wrap;">
            <a href="/profile/${_esc(c.userId || '')}" style="font-weight:700;color:var(--accent);text-decoration:none;"
               onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">${_esc(c.username || '—')}</a>
            ${cTime}
            ${delBtn}
          </div>
          <div style="white-space:pre-wrap;line-height:1.6;word-break:break-word;">${_esc(c.content)}</div>
        </div>
      </div>`;
  }).join('');

  const commentForm = user
    ? `<div style="margin-top:1.5rem;">
         <textarea id="comment-body" rows="3" placeholder="Yorumunuzu yazın..." maxlength="2000"
           style="resize:vertical;" oninput="document.getElementById('c-count').textContent=this.value.length"></textarea>
         <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;">
           <span style="font-size:0.8rem;color:var(--muted);"><span id="c-count">0</span>/2000</span>
           <button class="btn btn-sm" onclick="postComment()">💬 Yorum Yap</button>
         </div>
       </div>`
    : `<div style="text-align:center;padding:1.5rem;color:var(--muted);">
         Yorum yapmak için <a href="/login" style="color:var(--accent);">giriş yapın</a>.
       </div>`;

  // ── Admin düzenleme formu ──
  const editForm = canManage ? `
    <div id="edit-form" style="display:none;background:rgba(124,106,247,0.06);border:1px solid var(--border);border-radius:16px;padding:1.5rem;margin-top:1.5rem;">
      <h3 style="margin-bottom:1rem;color:var(--accent);">✏️ Makaleyi Düzenle</h3>
      <label>Başlık</label>
      <input type="text" id="edit-title" value="${_esc(article.title)}" maxlength="120">
      <label>Kapak Resmi URL</label>
      <input type="url" id="edit-image" value="${_esc(article.imageUrl || '')}" placeholder="https://...">
      <label>İçerik</label>
      <textarea id="edit-body" rows="12" maxlength="20000">${_esc(article.body || '')}</textarea>
      <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn" onclick="saveEdit()" style="flex:1;">💾 Kaydet</button>
        <button class="btn btn-ghost" onclick="document.getElementById('edit-form').style.display='none'" style="flex:1;">İptal</button>
      </div>
    </div>` : '';

  const aid = JSON.stringify(article._id);

  const content = `
    <div style="max-width:780px;margin:0 auto;">

      <!-- Geri butonu -->
      <a href="/wiki" style="display:inline-flex;align-items:center;gap:0.4rem;color:var(--muted);text-decoration:none;font-size:0.9rem;margin-bottom:1.5rem;transition:color 0.2s;"
         onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">
        ← Wiki'ye Dön
      </a>

      <div class="card">
        <!-- Kapak -->
        ${coverImg}

        <!-- Başlık + meta -->
        <div style="margin-bottom:1.5rem;">
          <h1 style="font-size:2rem;font-weight:800;line-height:1.2;margin-bottom:1rem;">${_esc(article.title)}</h1>
          <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;font-size:0.88rem;color:var(--muted);">
            ${authorAvatar}
            ${authorNameHtml}
            <span>—</span>
            ${createdTs}
            ${editedLine}
            <span style="margin-left:auto;display:flex;gap:1rem;">
              <span>👁 ${(article.views || 0).toLocaleString('tr-TR')} görüntülenme</span>
              <span>💬 ${comments.length} yorum</span>
            </span>
          </div>
        </div>

        <hr class="divider">

        <!-- İçerik -->
        <div style="line-height:1.85;font-size:1rem;white-space:pre-wrap;word-break:break-word;margin-bottom:2rem;">${_esc(article.body || '')}</div>

        <!-- Tepkiler -->
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.5rem;">
          ${reactionHtml}
        </div>

        <!-- Admin butonları -->
        ${canManage ? `
        <div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
          <button class="btn btn-sm btn-ghost" onclick="document.getElementById('edit-form').style.display=document.getElementById('edit-form').style.display==='none'?'block':'none'">✏️ Düzenle</button>
          <button class="btn btn-sm btn-danger" onclick="deleteArticle()">🗑 Sil</button>
        </div>
        ${editForm}` : ''}

        <hr class="divider">

        <!-- Yorumlar -->
        <div>
          <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:1.25rem;">💬 Yorumlar <span style="color:var(--muted);font-size:0.9rem;font-weight:400;">(${comments.length})</span></h2>
          <div id="comments-list" style="display:flex;flex-direction:column;gap:0.75rem;">
            ${commentsHtml || `<div style="text-align:center;padding:2rem;color:var(--muted);">Henüz yorum yok. İlk yorumu sen yap!</div>`}
          </div>
          ${commentForm}
        </div>
      </div>
    </div>

    <script>
      const articleId = ${aid};

      // ── Tepki ──
      async function reactTo(emoji) {
        ${user ? `
        const res = await fetch('/api/wiki/articles/' + articleId + '/react', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji })
        });
        if (res.ok) location.reload();
        else { const d = await res.json().catch(()=>({})); showToast(d.error || 'Hata', 'error'); }
        ` : `showToast('Tepki eklemek için giriş yapın.', 'warning');`}
      }

      // ── Yorum gönder ──
      async function postComment() {
        const body = document.getElementById('comment-body');
        const text = body.value.trim();
        if (!text) return;
        const btn = body.nextElementSibling.querySelector('button');
        btn.disabled = true; btn.textContent = 'Gönderiliyor...';
        const res = await fetch('/api/wiki/articles/' + articleId + '/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text })
        });
        if (res.ok) location.reload();
        else {
          const d = await res.json().catch(() => ({}));
          showToast(d.error || 'Hata', 'error');
          btn.disabled = false; btn.textContent = '💬 Yorum Yap';
        }
      }

      // ── Yorum sil ──
      async function deleteComment(commentId) {
        if (!confirm('Bu yorumu silmek istediğine emin misin?')) return;
        const res = await fetch('/api/wiki/articles/' + articleId + '/comments/' + commentId, { method: 'DELETE' });
        if (res.ok) {
          const el = document.getElementById('comment-' + commentId);
          if (el) el.remove();
          showToast('Yorum silindi.', 'success');
        } else {
          const d = await res.json().catch(() => ({}));
          showToast(d.error || 'Silinemedi.', 'error');
        }
      }

      // ── Makale sil ──
      async function deleteArticle() {
        if (!confirm('Bu makaleyi kalıcı olarak silmek istediğine emin misin?')) return;
        const res = await fetch('/api/wiki/articles/' + articleId, { method: 'DELETE' });
        if (res.ok) location.href = '/wiki';
        else showToast('Silinemedi.', 'error');
      }

      // ── Makale düzenle ──
      async function saveEdit() {
        const res = await fetch('/api/wiki/articles/' + articleId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: document.getElementById('edit-title').value.trim(),
            body: document.getElementById('edit-body').value.trim(),
            imageUrl: document.getElementById('edit-image').value.trim() || null
          })
        });
        if (res.ok) { showToast('Kaydedildi!', 'success'); setTimeout(() => location.reload(), 600); }
        else { const d = await res.json().catch(() => ({})); showToast(d.error || 'Hata', 'error'); }
      }
    </script>
  `;
  return _layout(article.title, user, content, '', '/wiki');
}

function renderAdminPage(user) {
  const content = `
    <!-- Sekme başlıkları -->
    <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;border-bottom:1px solid var(--border);flex-wrap:wrap;">
      <button class="adm-tab adm-tab-active" onclick="admTab('stats',this)"
        style="padding:.75rem 1.5rem;background:transparent;border:none;border-bottom:2px solid var(--accent);color:var(--text);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;">
        📊 İstatistikler
      </button>
      <button class="adm-tab" onclick="admTab('users',this)"
        style="padding:.75rem 1.5rem;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;">
        👥 Kullanıcılar
      </button>

      <button class="adm-tab" onclick="admTab('coins',this)"
        style="padding:.75rem 1.5rem;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;">
        💰 Para Ver
      </button>
      <button class="adm-tab" onclick="admTab('bans',this)"
        style="padding:.75rem 1.5rem;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;">
        🚫 Banlar
      </button>
      <button class="adm-tab" onclick="admTab('forms',this)"
        style="padding:.75rem 1.5rem;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;">
        📋 Panel Formları
      </button>
      <button class="adm-tab" onclick="admTab('automation',this)"
        style="padding:.75rem 1.5rem;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;">
        🤖 Otomasyon
      </button>
      <button class="adm-tab" onclick="admTab('submissions',this)"
        style="padding:.75rem 1.5rem;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:inherit;font-weight:700;font-size:1rem;cursor:pointer;">
        📥 Doldurulan Formlar
      </button>
    </div>

    <!-- İstatistikler -->
    <div id="adm-stats" class="card">
      <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem;">📊 İstatistikler</h1>
      <p class="text-muted mb-3">Sunucu ve kullanıcı aktiflik istatistikleri.</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div class="card" style="background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); padding: 1.5rem;">
          <div style="font-size: 2rem; font-weight: 800; color: var(--success); margin-bottom: 10px;" id="stat-active">0</div>
          <div style="color: var(--muted); font-size: 0.9rem;">🟢 Aktif Kullanıcılar (24s)</div>
        </div>
        <div class="card" style="background: rgba(251, 113, 133, 0.1); border: 1px solid rgba(251, 113, 133, 0.3); padding: 1.5rem;">
          <div style="font-size: 2rem; font-weight: 800; color: var(--danger); margin-bottom: 10px;" id="stat-inactive">0</div>
          <div style="color: var(--muted); font-size: 0.9rem;">🔴 İnaktif Kullanıcılar (24s+)</div>
        </div>
        <div class="card" style="background: rgba(167, 139, 250, 0.1); border: 1px solid rgba(167, 139, 250, 0.3); padding: 1.5rem;">
          <div style="font-size: 2rem; font-weight: 800; color: var(--accent); margin-bottom: 10px;" id="stat-rules">0</div>
          <div style="color: var(--muted); font-size: 0.9rem;">📋 Kurallar Kabul</div>
        </div>
        <div class="card" style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); padding: 1.5rem;">
          <div style="font-size: 2rem; font-weight: 800; color: var(--warning); margin-bottom: 10px;" id="stat-activities">0</div>
          <div style="color: var(--muted); font-size: 0.9rem;">📊 Toplam Aktiviteler</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px;">
          <h3 style="margin-bottom: 15px; color: var(--success); font-size: 1.1rem; font-weight: 700;">🟢 Aktif Kullanıcılar (Son 24s)</h3>
          <div id="active-list" style="max-height: 300px; overflow-y: auto;"></div>
        </div>
        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px;">
          <h3 style="margin-bottom: 15px; color: var(--danger); font-size: 1.1rem; font-weight: 700;">🔴 İnaktif Kullanıcılar</h3>
          <div id="inactive-list" style="max-height: 300px; overflow-y: auto;"></div>
        </div>
      </div>
    </div>

    <!-- Kullanıcı yönetimi -->
    <div id="adm-users" class="card" style="display:none;">
      <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem;">⚙️ Admin Paneli</h1>
      <p class="text-muted mb-3">Kullanıcı yetkileri ve ban yönetimi.</p>
      <div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        <input type="text" id="admin-search" placeholder="Discord adı veya ID" style="flex:1;min-width:220px;" onkeydown="if(event.key==='Enter') adminSearchUsers()">
        <button type="button" class="btn" onclick="adminSearchUsers()">Ara</button>
      </div>
      <div style="display:flex;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap;">
        <input type="text" id="restore-staff-query" placeholder="Geri almak istediğin kullanıcı adı veya ID" style="flex:1;min-width:220px;" />
        <button type="button" class="btn btn-success" onclick="restoreStaffByQuery()">↩️ Personel Geri Al</button>
      </div>
      <div style="display:flex;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap;">
        <input type="text" id="restore-school-query" placeholder="Mod okulu için kullanıcı adı veya ID" style="flex:1;min-width:220px;" />
        <button type="button" class="btn btn-success" onclick="restoreStaffWithAutoSchool()">🚀 Geri Al + Okulu Geç</button>
      </div>
      <div id="restore-staff-result" style="margin-bottom:0.5rem;color:var(--success);"></div>
      <div id="restore-school-result" style="margin-bottom:1rem;color:var(--warning);"></div>
      <div id="admin-results"></div>
      <hr class="divider" style="margin-top:2rem;">
      <a href="/debug" style="color:var(--accent);">🔍 Debug sayfası</a>
    </div>



    <!-- Coin yönetimi -->
    <div id="adm-coins" class="card" style="display:none;">
      <h1 style="font-size:2rem;font-weight:800;margin-bottom:.5rem;">💰 Coin Yönetimi</h1>
      <p class="text-muted mb-3">Kullanıcılara coin verin. Maksimum tek seferde 1.000.000 coin.</p>

      <div style="background:rgba(251,191,36,.04);border:1px solid rgba(251,191,36,.12);border-radius:16px;padding:1.5rem;margin-bottom:2rem;backdrop-filter:blur(8px);">
        <h3 style="font-size:1rem;font-weight:800;color:#fbbf24;margin-bottom:1rem;">➕ Kullanıcıya Coin Ver</h3>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:.75rem;">
          <input type="text" id="coin-id" placeholder="Discord ID veya kullanıcı adı" style="flex:1;min-width:200px;margin-bottom:0;">
          <input type="number" id="coin-amount" placeholder="Miktar" min="1" max="1000000" style="width:160px;margin-bottom:0;">
        </div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;">
          <input type="text" id="coin-reason" placeholder="Sebep (isteğe bağlı)" style="flex:1;min-width:200px;margin-bottom:0;">
          <button class="btn" onclick="giveCoins()">💸 Ver</button>
        </div>
        <div id="coin-result" style="margin-top:1rem;"></div>
      </div>

      <!-- Hızlı miktarlar -->
      <div style="margin-bottom:1.5rem;">
        <div style="font-size:.85rem;color:var(--muted);font-weight:700;margin-bottom:.5rem;">Hızlı Miktarlar:</div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
          ${[100, 500, 1000, 5000, 10000, 50000].map(n =>
            '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'coin-amount\').value=' + n + '">' + n.toLocaleString('tr-TR') + ' 🪙</button>'
          ).join('')}
        </div>
      </div>
    </div>

    <!-- Ban yönetimi -->
    <div id="adm-bans" class="card" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1 style="font-size:2rem;font-weight:800;">🚫 Ban Yönetimi</h1>
          <p class="text-muted" style="margin-top:.25rem;">Kullanıcıları site ve/veya Discord'dan yasaklayın.</p>
        </div>
        <button class="btn btn-sm" onclick="loadBans()">🔄 Yenile</button>
      </div>

      <!-- Yeni ban formu -->
      <div style="background:rgba(251,113,133,.04);border:1px solid rgba(251,113,133,.12);border-radius:16px;padding:1.5rem;margin-bottom:2rem;backdrop-filter:blur(8px);">
        <h3 style="font-size:1rem;font-weight:800;color:var(--danger);margin-bottom:1rem;">➕ Kullanıcı Yasakla</h3>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:.75rem;">
          <input type="text" id="ban-id" placeholder="Discord ID veya kullanıcı adı" style="flex:1;min-width:200px;margin-bottom:0;">
          <input type="text" id="ban-reason" placeholder="Sebep (isteğe bağlı)" style="flex:2;min-width:200px;margin-bottom:0;">
        </div>
        <div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">
          <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;color:var(--text);font-size:.9rem;">
            <input type="checkbox" id="ban-discord" checked style="width:auto;margin:0;"> Discord'dan da yasakla
          </label>
          <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;color:var(--text);font-size:.9rem;">
            <input type="checkbox" id="ban-site" checked style="width:auto;margin:0;"> Siteden yasakla
          </label>
        </div>
        <button class="btn btn-danger" onclick="banUser()">🚫 Yasakla</button>
      </div>

      <!-- Aktif banlar listesi -->
      <h3 style="font-size:1rem;font-weight:800;margin-bottom:1rem;">📋 Aktif Banlar</h3>
      <div id="ban-list"><div style="color:var(--muted);text-align:center;padding:2rem;">Yükleniyor...</div></div>
    </div>

    <!-- Otomasyon / Alımlar -->
    <div id="adm-automation" class="card" style="display:none;">
      <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem;">🤖 Otomasyon & Alımlar</h1>
      <p class="text-muted mb-3">Sınavlı (AI) veya sınavsız olarak avukat alımı gerçekleştirin.</p>

      <div style="background:rgba(124,106,247,0.04);border:1px solid rgba(124,106,247,0.12);border-radius:16px;padding:1.5rem;margin-bottom:2rem;backdrop-filter:blur(8px);">
        <h3 style="font-size:1.1rem;font-weight:800;color:var(--accent);margin-bottom:1rem;">⚖️ Avukat Alım Sistemi</h3>
        <div style="margin-bottom:1rem;">
          <label style="display:block;margin-bottom:0.5rem;font-weight:700;">Discord Kullanıcı ID'si</label>
          <input type="text" id="avukat-discord-id" placeholder="Örn: 1444656401216442497" style="width:100%;margin-bottom:0;">
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          <button class="btn" style="background:var(--accent);color:#fff;" onclick="startAvukatAI()">🧠 AI AVUKAT ALIMI BAŞLAT</button>
          <button class="btn btn-ghost" style="border-color:#2ecc71;color:#2ecc71;" onclick="startAvukatDirect()">⚖️ SINAVSIZ ALIM (Rol Ver)</button>
        </div>
        <div id="avukat-result" style="margin-top:1.5rem;font-weight:700;display:none;padding:1rem;border-radius:8px;"></div>
      </div>
    </div>

    <!-- ── DOLDURULAN FORMLAR ────────────────────────────────────────────── -->
    <div id="adm-submissions" class="card" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1 style="font-size:2rem;font-weight:800;">📥 Doldurulan Formlar</h1>
          <p class="text-muted" style="margin-top:.25rem;">Kullanıcıların doldurduğu başvuru formlarını inceleyin ve değerlendirin.</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
          <select id="sub-filter-status" onchange="loadSubmissions()" style="padding:0.5rem 0.75rem;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:inherit;font-size:0.9rem;">
            <option value="">Tüm Durumlar</option>
            <option value="PENDING">⏳ Beklemede</option>
            <option value="APPROVED">✅ Onaylandı</option>
            <option value="REJECTED">❌ Reddedildi</option>
            <option value="AI_DETECTED">🤖 AI Tespit</option>
          </select>
          <button class="btn btn-sm" onclick="loadSubmissions()">🔄 Yenile</button>
        </div>
      </div>

      <!-- İstatistik kartları -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:1.5rem;" id="sub-stats-row">
        <div class="card" style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);padding:1rem;text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:#fbbf24;" id="sub-count-pending">0</div>
          <div style="font-size:0.8rem;color:var(--muted);">⏳ Beklemede</div>
        </div>
        <div class="card" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);padding:1rem;text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:#34d399;" id="sub-count-approved">0</div>
          <div style="font-size:0.8rem;color:var(--muted);">✅ Onaylandı</div>
        </div>
        <div class="card" style="background:rgba(251,113,133,0.08);border:1px solid rgba(251,113,133,0.2);padding:1rem;text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:#fb7185;" id="sub-count-rejected">0</div>
          <div style="font-size:0.8rem;color:var(--muted);">❌ Reddedildi</div>
        </div>
        <div class="card" style="background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.2);padding:1rem;text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:#a78bfa;" id="sub-count-ai">0</div>
          <div style="font-size:0.8rem;color:var(--muted);">🤖 AI Tespit</div>
        </div>
      </div>

      <!-- Liste -->
      <div id="sub-list">
        <div style="color:var(--muted);text-align:center;padding:3rem;">Yükleniyor...</div>
      </div>
    </div>

    <!-- ── FORM DETAY MODAL ───────────────────────────────────────────────── -->
    <div id="sub-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9000;overflow-y:auto;padding:2rem 1rem;" onclick="if(event.target===this)closeSubModal()">
      <div style="max-width:860px;margin:0 auto;background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:0;overflow:hidden;" onclick="event.stopPropagation()">
        <!-- Modal header -->
        <div style="background:linear-gradient(135deg,rgba(129,140,248,0.15),rgba(52,211,153,0.1));padding:1.5rem 2rem;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:0.78rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.3rem;">BAŞVURU DETAYI</div>
            <h2 style="font-size:1.3rem;font-weight:800;color:#fff;margin:0;" id="modal-title">—</h2>
          </div>
          <button onclick="closeSubModal()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);color:var(--muted);border-radius:10px;padding:0.4rem 0.8rem;cursor:pointer;font-size:1.2rem;font-family:inherit;">✕</button>
        </div>

        <!-- Meta bilgi -->
        <div style="padding:1.2rem 2rem;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.06);display:flex;flex-wrap:wrap;gap:1.5rem;font-size:0.85rem;color:var(--muted);">
          <span>👤 <strong id="modal-user">—</strong></span>
          <span>📅 <strong id="modal-date">—</strong></span>
          <span>🆔 <strong id="modal-id" style="font-family:monospace;">—</strong></span>
          <span id="modal-status-badge"></span>
        </div>

        <!-- Değerlendirme aksiyonları -->
        <div style="padding:1.2rem 2rem;background:rgba(255,255,255,0.015);border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:0.8rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.8rem;">DEĞERLENDİRME</div>
          <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
            <button onclick="reviewSubmission('APPROVED')" class="btn btn-sm" style="background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.4);color:#34d399;font-weight:700;">✅ Başvuruyu Onayla</button>
            <button onclick="reviewSubmission('REJECTED')" class="btn btn-sm" style="background:rgba(251,113,133,0.15);border:1px solid rgba(251,113,133,0.4);color:#fb7185;font-weight:700;">❌ Başvuruyu Reddet</button>
            <button onclick="reviewSubmission('AI_DETECTED')" class="btn btn-sm" style="background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.4);color:#a78bfa;font-weight:700;">🤖 AI Tespit Edildi</button>
          </div>
          <input id="review-note" type="text" placeholder="Not ekleyin (isteğe bağlı, kullanıcıya DM olarak gidecek)..." style="margin-top:0.8rem;width:100%;font-size:0.88rem;">
          <div id="review-result" style="margin-top:0.6rem;font-size:0.85rem;min-height:20px;"></div>
        </div>

        <!-- Form içeriği (sorular ve cevaplar) -->
        <div id="modal-body" style="padding:1.5rem 2rem;max-height:60vh;overflow-y:auto;"></div>
      </div>
    </div>

    <!-- Panel Formları -->
    <div id="adm-forms" class="card" style="display:none;">
      <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem;">📋 Panel Formları</h1>
      <p class="text-muted mb-3">Discord yetkili panelinde yer alan formları doğrudan web üzerinden doldurup gönderin.</p>
      
      <!-- Form seçme butonları -->
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px solid var(--border);">
        <button class="btn btn-ghost btn-sm" onclick="showSubForm('leave', this)" style="border-color:#f1c40f;color:#f1c40f;">🏖️ İzin Formu</button>
        <button class="btn btn-ghost btn-sm" onclick="showSubForm('suggestion', this)" style="border-color:#2ecc71;color:#2ecc71;">💡 Tavsiye Formu</button>
        <button class="btn btn-ghost btn-sm" onclick="showSubForm('resign', this)" style="border-color:#e74c3c;color:#e74c3c;">🚪 İstifa Formu</button>
        <button class="btn btn-ghost btn-sm" onclick="showSubForm('modaction', this)" style="border-color:#9b59b6;color:#9b59b6;">⚖️ Mod İşlem Formu</button>
        <button class="btn btn-ghost btn-sm" onclick="showSubForm('ban_report', this)" style="border-color:#e74c3c;color:#e74c3c;">🔨 Ban Raporu</button>
        <button class="btn btn-ghost btn-sm" onclick="showSubForm('mute_report', this)" style="border-color:#f39c12;color:#f39c12;">🔇 Mute Raporu</button>
        <button class="btn btn-ghost btn-sm" onclick="showSubForm('mod_complain', this)" style="border-color:#d946ef;color:#d946ef;">⚠️ Mod Şikayeti</button>
      </div>

      <!-- Form alanları (Dinamik) -->
      <div id="form-container" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:16px;padding:1.5rem;display:none;">
        <h3 id="form-title" style="font-size:1.2rem;font-weight:800;margin-bottom:1.5rem;"></h3>
        
        <div id="form-fields"></div>
        
        <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;">
          <button type="button" class="btn" id="form-submit-btn" onclick="submitAdminForm()">Gönder</button>
        </div>
      </div>
    </div>

    <script>
      // ── Sekme geçişi ──────────────────────────────────────────────────────
      window.admTab = function(name, btn) {
        document.getElementById('adm-stats').style.display       = name === 'stats'       ? '' : 'none';
        document.getElementById('adm-users').style.display       = name === 'users'       ? '' : 'none';
        document.getElementById('adm-coins').style.display       = name === 'coins'       ? '' : 'none';
        document.getElementById('adm-bans').style.display        = name === 'bans'        ? '' : 'none';
        document.getElementById('adm-forms').style.display       = name === 'forms'       ? '' : 'none';
        document.getElementById('adm-automation').style.display  = name === 'automation'  ? '' : 'none';
        document.getElementById('adm-submissions').style.display = name === 'submissions' ? '' : 'none';
        document.querySelectorAll('.adm-tab').forEach(t => {
          t.style.borderBottomColor = 'transparent';
          t.style.color = 'var(--muted)';
        });
        if (btn && btn.style) {
          btn.style.borderBottomColor = 'var(--accent)';
          btn.style.color = 'var(--text)';
        }
        if (name === 'bans') loadBans();
        if (name === 'stats') loadStats();
        if (name === 'submissions') loadSubmissions();
      }

      window.startAvukatAI = async function() {
        const discordId = document.getElementById('avukat-discord-id').value.trim();
        const resDiv = document.getElementById('avukat-result');
        if (!discordId) {
          alert('Lütfen geçerli bir Discord ID girin.');
          return;
        }
        resDiv.style.display = 'block';
        resDiv.style.background = 'rgba(255,255,255,0.05)';
        resDiv.style.color = 'var(--text)';
        resDiv.innerText = '⏳ AI Mülakatı başlatılıyor...';

        try {
          const res = await fetch('/api/avukat/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId })
          });
          const data = await res.json();
          if (data.success) {
            resDiv.style.background = 'rgba(46,204,113,0.1)';
            resDiv.style.color = '#2ecc71';
            resDiv.innerText = '✅ Başarılı: ' + data.message;
          } else {
            resDiv.style.background = 'rgba(231,76,60,0.1)';
            resDiv.style.color = '#e74c3c';
            resDiv.innerText = '❌ Hata: ' + (data.error || 'Bilinmeyen hata');
          }
        } catch (err) {
          resDiv.style.background = 'rgba(231,76,60,0.1)';
          resDiv.style.color = '#e74c3c';
          resDiv.innerText = '❌ İstek hatası: ' + err.message;
        }
      }

      async function startAvukatDirect() {
        const discordId = document.getElementById('avukat-discord-id').value.trim();
        const resDiv = document.getElementById('avukat-result');
        if (!discordId) {
          alert('Lütfen geçerli bir Discord ID girin.');
          return;
        }
        resDiv.style.display = 'block';
        resDiv.style.background = 'rgba(255,255,255,0.05)';
        resDiv.style.color = 'var(--text)';
        resDiv.innerText = '⏳ Avukat rolü tanımlanıyor...';

        try {
          const res = await fetch('/api/avukat/direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId })
          });
          const data = await res.json();
          if (data.success) {
            resDiv.style.background = 'rgba(46,204,113,0.1)';
            resDiv.style.color = '#2ecc71';
            resDiv.innerText = '✅ Başarılı: ' + data.message;
          } else {
            resDiv.style.background = 'rgba(231,76,60,0.1)';
            resDiv.style.color = '#e74c3c';
            resDiv.innerText = '❌ Hata: ' + (data.error || 'Bilinmeyen hata');
          }
        } catch (err) {
          resDiv.style.background = 'rgba(231,76,60,0.1)';
          resDiv.style.color = '#e74c3c';
          resDiv.innerText = '❌ İstek hatası: ' + err.message;
        }
      }

      // ── Panel Formları Mantığı ───────────────────────────────────────────
      let currentFormType = '';
      
      const formDefinitions = {
        leave: {
          title: "🏖️ İzin Talebi Formu",
          fields: [
            { id: "leave_reason", apiKey: "reason", label: "İzin Sebebi", type: "textarea", placeholder: "İzin alma sebebinizi detaylıca açıklayın...", required: true },
            { id: "leave_duration", apiKey: "duration", label: "Kaç Gün İzin", type: "number", placeholder: "Örn: 5", required: true }
          ],
          submitText: "🏖️ Talebi Gönder (AI Değerlendirir)"
        },
        suggestion: {
          title: "💡 Tavsiye & Öneri Formu",
          fields: [
            { id: "suggestion_text", apiKey: "suggestion", label: "Öneriniz", type: "textarea", placeholder: "Sunucu veya ekip için önerinizi yazın...", required: true }
          ],
          submitText: "💡 Öneriyi İlet"
        },
        resign: {
          title: "🚪 İstifa Bildirim Formu",
          fields: [
            { id: "resign_reason", apiKey: "reason", label: "İstifa Sebebi", type: "textarea", placeholder: "Ayrılma gerekçenizi yazın...", required: true },
            { id: "resign_confirm", apiKey: "confirm", label: "Onaylıyorum (Devam etmek için 'Evet' yazın)", type: "text", placeholder: "Evet", required: true }
          ],
          submitText: "🚪 İstifayı Bildir"
        },
        modaction: {
          title: "⚖️ Moderatör İşlem Rapor Formu",
          fields: [
            { id: "mod_user", apiKey: "user", label: "İşlem Yapılan Kullanıcı (Kullanıcı Adı veya ID)", type: "text", placeholder: "Örn: Ahmet / 123456789...", required: true },
            { id: "mod_action", apiKey: "action", label: "Cezai İşlem Tipi (Ban, Mute, Kick vb.)", type: "text", placeholder: "Örn: Ban", required: true },
            { id: "mod_reason", apiKey: "reason", label: "Sebep ve Kanıt Linki", type: "textarea", placeholder: "Açıklama ve kanıt ekran görüntüsü linkleri...", required: true }
          ],
          submitText: "⚖️ İşlemi Raporla"
        },
        ban_report: {
          title: "🔨 Ban Rapor Formu",
          fields: [
            { id: "ban_isim", apiKey: "isim", label: "İsminiz (Kendi Adınız)", type: "text", placeholder: "Adınız", required: true },
            { id: "ban_kisi", apiKey: "kisi", label: "Banlanan/Banlanacak Kullanıcı", type: "text", placeholder: "Kullanıcı adı", required: true },
            { id: "ban_id", apiKey: "kisiId", label: "Banlanacak Kişinin ID'si", type: "text", placeholder: "18 haneli Discord ID'si", required: true },
            { id: "ban_sebep", apiKey: "sebep", label: "Sebep", type: "textarea", placeholder: "Yasaklanma nedeni...", required: true },
            { id: "ban_kanit", apiKey: "kanit", label: "Kanıt (Görsel/Video Linki)", type: "text", placeholder: "https://...", required: true }
          ],
          submitText: "🔨 Banı Rapor Et"
        },
        mute_report: {
          title: "🔇 Mute Rapor Formu",
          fields: [
            { id: "mute_isim", apiKey: "isim", label: "İsminiz (Kendi Adınız)", type: "text", placeholder: "Adınız", required: true },
            { id: "mute_rutbe", apiKey: "rutbe", label: "Rütbeniz", type: "text", placeholder: "Örn: Kıdemli Moderatör", required: true },
            { id: "mute_kisi", apiKey: "kisi", label: "Mute Atılan Kişi", type: "text", placeholder: "Kullanıcı adı", required: true },
            { id: "mute_ihlal", apiKey: "ihlal", label: "Kaçıncı İhlali?", type: "text", placeholder: "Örn: 2. ihlali", required: true }
          ],
          submitText: "🔇 Susturmayı Rapor Et"
        },
        mod_complain: {
          title: "⚠️ Mod Şikayet Formu",
          fields: [
            { id: "comp_mod", apiKey: "mod", label: "Şikayet Edilen Yetkili (Ad veya ID)", type: "text", placeholder: "Yetkili ismi veya ID'si", required: true },
            { id: "comp_sebep", apiKey: "sebep", label: "Şikayet Nedeni", type: "textarea", placeholder: "Durumu açıklayın...", required: true },
            { id: "comp_kanit", apiKey: "kanit", label: "Kanıt (Görsel veya Açıklama)", type: "textarea", placeholder: "Ekran görüntüsü linkleri, mesaj içerikleri vb...", required: true }
          ],
          submitText: "⚠️ Şikayeti Gizlice Gönder"
        }
      };

      function showSubForm(type, btn) {
        currentFormType = type;
        const form = formDefinitions[type];
        if (!form) return;

        // Butonların aktiflik durumunu sıfırla
        const buttons = btn.parentElement.querySelectorAll('button');
        buttons.forEach(b => {
          b.classList.add('btn-ghost');
          b.style.background = 'transparent';
          b.style.color = b.style.borderColor;
        });
        
        // Aktif buton stilini ver
        btn.classList.remove('btn-ghost');
        btn.style.background = btn.style.borderColor;
        btn.style.color = '#06060e';

        document.getElementById('form-container').style.display = 'block';
        document.getElementById('form-title').innerText = form.title;
        document.getElementById('form-submit-btn').innerText = form.submitText;
        
        // Dinamik alanları çiz
        const fieldsHtml = form.fields.map(f => {
          if (f.type === 'textarea') {
            return '<div style="margin-bottom: 1.2rem;">' +
                      '<label for="' + f.id + '" style="margin-bottom:0.4rem;display:block;color:var(--muted);">' + f.label + ':</label>' +
                      '<textarea id="' + f.id + '" placeholder="' + f.placeholder + '" rows="4" style="width:100%;margin-bottom:0;"></textarea>' +
                    '</div>';
          } else {
            return '<div style="margin-bottom: 1.2rem;">' +
                      '<label for="' + f.id + '" style="margin-bottom:0.4rem;display:block;color:var(--muted);">' + f.label + ':</label>' +
                      '<input type="' + f.type + '" id="' + f.id + '" placeholder="' + f.placeholder + '" style="width:100%;margin-bottom:0;">' +
                    '</div>';
          }
        }).join('');

        document.getElementById('form-fields').innerHTML = fieldsHtml;
      }

      // ── DOLDURULAN FORMLAR ─────────────────────────────────────────────
      let _currentSubId = null;
      let _allSubs = [];

      const FORM_QUESTION_LABELS = {
        // Kişisel sorular
        'personal.q1': 'KİŞİSEL — Kendinizden bahsedin',
        'personal.q2': 'KİŞİSEL — En değerli becerileriniz',
        'personal.q3': 'KİŞİSEL — Takıma katkılarınız',
        'personal.q4': 'KİŞİSEL — Neden bu görevi istiyorsunuz?',
        'personal.q5': 'KİŞİSEL — Direktif alma konusunda görüşünüz',
        // Teknik sorular
        'technical.q1': 'TEKNİK — Moderasyon/yönetim farkı',
        'technical.q2': 'TEKNİK — Teknik kayıt tutma',
        'technical.q3': 'TEKNİK — Sunucu dışı platform temsili',
        'technical.q4': 'TEKNİK — Yetki karmaşası yönetimi',
        'technical.q5': 'TEKNİK — Kural çelişkisi çözümü',
        'technical.q6': 'TEKNİK — Geri bildirim & raporlama',
        'technical.q7': 'TEKNİK — Performans kriterleri',
        'technical.mc8': 'TEKNİK — Çoktan seçmeli cevabı',
        'technical.cb9': 'TEKNİK — Çoklu seçim cevapları',
        'technical.q10': 'TEKNİK — Yetki aşımı vs inisiyatif',
        // Senaryo soruları
        'scenarios.s1': 'SENARYO 1 — Büyük etkinlik karmaşası',
        'scenarios.s2': 'SENARYO 2 — Adaletsizlik iddiaları',
        'scenarios.s3': 'SENARYO 3 — Yanıltıcı bilgi yayılması',
        'scenarios.s4': 'SENARYO 4 — Rol akışı bozulması',
        'scenarios.s5': 'SENARYO 5 — Etkinlik sonrası eleştiriler',
        'scenarios.single': 'TEKLİ SENARYO — Sunucu bakım krizi',
        // Onaylar
        'confirmations.abuse': 'ONAY — Yetki kötüye kullanımı',
        'confirmations.respect': 'ONAY — Çalışana saygısızlık',
        'confirmations.rules': 'ONAY — Talimatname',
      };

      function subEsc(s) {
        const el = document.createElement('div');
        el.textContent = s == null ? '' : String(s);
        return el.innerHTML;
      }

      function subStatusBadge(status) {
        const map = {
          PENDING:     { label: '⏳ Beklemede',    bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)',  color: '#fbbf24' },
          APPROVED:    { label: '✅ Onaylandı',    bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.4)',  color: '#34d399' },
          REJECTED:    { label: '❌ Reddedildi',   bg: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.4)', color: '#fb7185' },
          AI_DETECTED: { label: '🤖 AI Tespit',   bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.4)', color: '#a78bfa' },
        };
        const s = map[status] || map['PENDING'];
        return '<span style="display:inline-block;padding:0.2rem 0.7rem;border-radius:20px;font-size:0.75rem;font-weight:800;background:' + s.bg + ';border:1px solid ' + s.border + ';color:' + s.color + ';">' + s.label + '</span>';
      }

      window.loadSubmissions = async function() {
        const statusFilter = document.getElementById('sub-filter-status').value;
        const box = document.getElementById('sub-list');
        box.innerHTML = '<div style="color:var(--muted);text-align:center;padding:3rem;">Yükleniyor...</div>';
        try {
          const res = await fetch('/api/admin/form-submissions');
          const d = await res.json();
          if (!res.ok || !d.submissions) { box.innerHTML = '<div style="color:var(--danger);text-align:center;padding:2rem;">Hata: ' + subEsc(d.error || 'Bilinmeyen hata') + '</div>'; return; }
          _allSubs = d.submissions;
          const filtered = statusFilter ? _allSubs.filter(s => s.status === statusFilter) : _allSubs;

          // İstatistikler
          document.getElementById('sub-count-pending').textContent   = _allSubs.filter(s => s.status === 'PENDING').length;
          document.getElementById('sub-count-approved').textContent  = _allSubs.filter(s => s.status === 'APPROVED').length;
          document.getElementById('sub-count-rejected').textContent  = _allSubs.filter(s => s.status === 'REJECTED').length;
          document.getElementById('sub-count-ai').textContent        = _allSubs.filter(s => s.status === 'AI_DETECTED').length;

          if (!filtered.length) {
            box.innerHTML = '<div style="color:var(--muted);text-align:center;padding:3rem;">Bu durumda başvuru bulunamadı.</div>';
            return;
          }

          box.innerHTML = filtered.map(s => {
            const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleString('tr-TR') : '—';
            return '<div onclick="openSubModal(this.dataset.id)" data-id="' + subEsc(s._id) + '" style="cursor:pointer;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:1rem 1.2rem;margin-bottom:0.75rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;transition:background 0.2s;" onmouseover="this.style.background=\\\'' + 'rgba(255,255,255,0.05)' + '\\\'" onmouseout="this.style.background=\\\'' + 'rgba(255,255,255,0.025)' + '\\\'">' +
              '<div style="display:flex;align-items:center;gap:1rem;">' +
                '<div style="width:40px;height:40px;border-radius:12px;background:rgba(129,140,248,0.15);border:1px solid rgba(129,140,248,0.3);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📋</div>' +
                '<div>' +
                  '<div style="font-weight:700;color:#fff;font-size:0.95rem;">' + subEsc(s.discordUsername || s.userId) + '</div>' +
                  '<div style="font-size:0.78rem;color:var(--muted);margin-top:0.1rem;">' + subEsc(s.formTitle || s.formType) + ' &nbsp;·&nbsp; ' + dateStr + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:0.75rem;">' +
                subStatusBadge(s.status) +
                '<span style="font-size:0.78rem;color:var(--muted);font-family:monospace;">' + subEsc(s._id) + '</span>' +
              '</div>' +
            '</div>';
          }).join('');
        } catch (err) {
          box.innerHTML = '<div style="color:var(--danger);text-align:center;padding:2rem;">İstek hatası: ' + subEsc(err.message) + '</div>';
        }
      }

      const FORM_LABELS_MAP = {
        // Topluluk Elçisi Formu
        'section1.fullName': '👤 Adınız / İkinci Adınız ve Soyadınız',
        'section1.discordUsername': '🆔 Discord Kullanıcı Adınız ve Discord ID',
        'section1.ageBirthDate': '🎂 Yaşınız ve Doğum Tarihiniz',
        'section1.cityTimezone': '🌍 Bulunduğunuz Şehir ve Zaman Dilimi',
        'section1.availability': '⏰ Günlük ve Haftalık Müsaitlik Süreniz (Hafta içi & Hafta sonu)',
        'section1.pastExperience': '📜 Görev Alınan Sunucular, Üye Sayıları, Rol ve Ayrılma Nedenleri',
        'section1.toughestIncident': '⚡ Karşılaşılan En Zorlu Olay ve Çözüm Adımları',
        'section1.references': '👥 Referans Gösterilebilecek 2 Kişi (Discord ID & Rol)',

        'section2.brandVision': '🌟 EkoYıldız Markası Vizyonu & Sunucu Atmosferi Düşünceleri',
        'section2.ambassadorVsMod': '⚖️ Moderatör ile Topluluk Elçisi Farkı & Topluluğa Yön Verme',
        'section2.top3Traits': '🏆 Adayı Öne Çıkaran En Belirgin 3 Kişisel Özellik',
        'section2.first30DaysPlan': '🚀 İlk 30 Gün İçin Somut Proje & Etkileşim Stratejisi',
        'section2.retentionStrategy': '🔄 Üye Bağlılığını (Retention) Artırma & Oryantasyon Kurgusu',

        'section3.scenario1_A': '📌 Senaryo 1 (Gerginlik & Kutuplaşma) — Soru A: Kanala Müdahale İlk Mesaj Metni',
        'section3.scenario1_B': '📌 Senaryo 1 (Gerginlik & Kutuplaşma) — Soru B: Kıdemli Üyelerin Tepkisine Tutum',
        'section3.scenario1_C': '📌 Senaryo 1 (Gerginlik & Kutuplaşma) — Soru C: Slowmode/Kilit Olmadan İletişimsel & Psikolojik Teknikler',

        'section3.scenario2_A': '📌 Senaryo 2 (Yönetim Karşıtı Provokasyon) — Soru A: İlk 3 Teknik / İdari Adım',
        'section3.scenario2_B': '📌 Senaryo 2 (Yönetim Karşıtı Provokasyon) — Soru B: Kamuoyuna Yapılacak Açıklama Metni',
        'section3.scenario2_C': '📌 Senaryo 2 (Yönetim Karşıtı Provokasyon) — Soru C: Provokatör ile Masum Üye Ayrımı',

        'section3.scenario3_A': '📌 Senaryo 3 (Yetki Suistimali) — Soru A: Mağdur Üyeye DM Yanıt Metni',
        'section3.scenario3_B': '📌 Senaryo 3 (Yetki Suistimali) — Soru B: Yönetici İle İletişim & Üst Mercie Raporlama',
        'section3.scenario3_C': '📌 Senaryo 3 (Yetki Suistimali) — Soru C: Sunucu İmajını Koruma Önlemleri',

        'section3.scenario4_A': '📌 Senaryo 4 (Düşük Katılımlı Etkinlik) — Soru A: İlk 10 Dakikada Katılımı Artırma Acil Hamleler',
        'section3.scenario4_B': '📌 Senaryo 4 (Düşük Katılımlı Etkinlik) — Soru B: Duyuru Kanalları & Etiket Efektifliği',
        'section3.scenario4_C': '📌 Senaryo 4 (Düşük Katılımlı Etkinlik) — Soru C: Yönetime Sunulacak Analiz Raporu Başlıkları',

        'section3.scenario5_A': '📌 Senaryo 5 (DM İhlalleri & Reklam) — Soru A: Ekran Görüntüsü / Kanıt Doğrulama Kriterleri',
        'section3.scenario5_B': '📌 Senaryo 5 (DM İhlalleri & Reklam) — Soru B: Sızma ve Gizli Reklam Tespit Mekanizması',

        'section4.ethics1': '⚖️ Etik İfade 1: Yakın arkadaş bile ihlal yapsa tolerans gösterilmemeli',
        'section4.ethics2': '⚖️ Etik İfade 2: Huzur için kurallar esnetilmeli / insani çözümler uygulanmalı',
        'section4.ethics3': '⚖️ Etik İfade 3: Yetkili içi tartışmalar üyelere yansıtılmamalı',
        'section4.ethics4': '⚖️ Etik İfade 4: Olumsuz eleştiriler silinmemeli, gelişim fırsatı olarak yönetilmeli',

        'section5.techSecurityBots': '🤖 Discord Güvenlik, Doğrulama & Otomasyon Bot Tecrübesi',
        'section5.techAuditLogs': '🔍 Audit Log (Denetim Kaydı) & Bot Log İnceleme / Kanıtlaştırma',
        'section5.techMarkdownDesign': '🎨 Discord Markdown & Görsel Düzen Tasarımı (Hoş Geldin & Kurallar)',

        'section6.declarationAccepted': '📜 Resmi Taahhütname Onayı',
        'section6.declarationDate': '📅 Tarih',
        'section6.declarationSignature': '✍️ İmza / Ad Soyad',

        // Etkinlik Yetkilisi Formu
        'personal.discord_username': '🆔 Discord Kullanıcı Adı',
        'personal.q1': 'Kişisel — Kendiniz, İlgi Alanlarınız ve Yaşınız',
        'personal.q2': 'Kişisel — Takım İçinde En Çok Değer Taşıyan Becerileriniz',
        'personal.q3': 'Kişisel — Takıma Katacağınız Özellikler',
        'personal.q4': 'Kişisel — Neden Etkinlik Sorumluluğunda Görev Almak İstiyorsunuz?',
        'personal.q5': 'Kişisel — Üstlerinizden Direktif Alma Konusunda Uyumunuz',
        'technical.q1': 'Teknik — Etkinlik Sorumlusunun Moderasyondan Yönetsel & Teknik Farkları',
        'technical.q2': 'Teknik — Kararların Tartışılmaması İçin Tutulması Gereken Kayıtlar (Log, SS)',
        'technical.q3': 'Teknik — Sunucu Dışı Platformlarda Temsil Yetkisi & İletişim Sınırları',
        'technical.q4': 'Teknik — Yetkili Müdahalesi & Yetki Karmaşası Yönetimi',
        'technical.q5': 'Teknik — Etkinlik Kuralları ile Sunucu Kuralları Çelişki Yönetimi',
        'technical.q6': 'Teknik — Geri Bildirim Toplama & İyileştirme Süreci',
        'technical.q7': 'Teknik — Ölçülebilir Performans Kriterleri Listesi',
        'technical.mc8': 'Teknik — Çoktan Seçmeli Test (Geçici Ses Kanalları Karmaşası)',
        'technical.cb9': 'Teknik — Çoklu Seçim Testi (Teknik Aksaklık Durum Adımları)',
        'technical.q10': 'Teknik — Yetki Aşımı vs. İnisiyatif Alma Farkı',
        'scenarios.s1': 'Senaryo 1 — Büyük Ölçekli Etkinlik & RP Bütünlüğü Kriz Yönetimi',
        'scenarios.s2': 'Senaryo 2 — Ödül Adaletsizliği İddiası & Kanal Karmaşası',
        'scenarios.s3': 'Senaryo 3 — Yanıltıcı Bilgi Yayılımı & Dış Platform Huzursuzluğu',
        'scenarios.s4': 'Senaryo 4 — Rol Akışını Bozma & Teknik Kesinti',
        'scenarios.s5': 'Senaryo 5 — Etkinlik Sonrası Sosyal Platform Eleştirileri & Log Analizi',
        'scenarios.single': 'Tekli Senaryo — Beklenmedik Bakım, Rol İhlali & Etik Sınır Aşımı Kriz Planı',
        'confirmations.abuse': 'Yetki Suistimali ve Toleranssızlık Beyanı',
        'confirmations.respect': 'Saygı ve İletişim Beyanı',
        'confirmations.rules': 'Sunucu Kurallarını Kabul Beyanı'
      };

      const SECTION_TITLES_MAP = {
        section1: { title: '👤 BÖLÜM 1 — Kişisel Bilgiler, Geçmiş ve Teknik Profil', color: '#818cf8' },
        section2: { title: '🎯 BÖLÜM 2 — Motivasyon, Vizyon ve Rol Bilinci', color: '#a78bfa' },
        section3: { title: '🚨 BÖLÜM 3 — Derinleştirilmiş Senaryo ve Kriz Yönetimi Testleri', color: '#f59e0b' },
        section4: { title: '⚖️ BÖLÜM 4 — Etik, İletişim ve Kişisel Tutum Testi', color: '#ec4899' },
        section5: { title: '🛠️ BÖLÜM 5 — Teknik Bilgi ve Bot/Sistem Hakimiyeti', color: '#10b981' },
        section6: { title: '📜 BÖLÜM 6 — Onay ve Beyan', color: '#3b82f6' },

        personal: { title: '📝 Kişisel Bilgiler', color: '#818cf8' },
        technical: { title: '⚙️ Teknik Bilgiler', color: '#34d399' },
        scenarios: { title: '🎭 Senaryo Cevapları', color: '#fbbf24' },
        confirmations: { title: '✅ Onaylar & Beyanlar', color: '#fb7185' }
      };

      function buildFormQA(formData, behavior) {
        if (!formData || typeof formData !== 'object') {
          return '<p style="color:var(--muted);text-align:center;padding:2rem;">Form verisi bulunamadı.</p>';
        }

        const htmlSections = [];

        for (const [secKey, secVal] of Object.entries(formData)) {
          if (!secVal || typeof secVal !== 'object') continue;

          const secMeta = SECTION_TITLES_MAP[secKey] || {
            title: '📌 ' + secKey.toUpperCase(),
            color: '#818cf8'
          };

          const fieldsHtml = [];

          for (const [qKey, qVal] of Object.entries(secVal)) {
            const fullKey = secKey + '.' + qKey;
            const labelText = FORM_LABELS_MAP[fullKey] || FORM_LABELS_MAP[qKey] || (secKey + ' → ' + qKey);

            let valueContent = '';

            if (qVal && typeof qVal === 'object' && !Array.isArray(qVal)) {
              const choiceStr = qVal.choice || 'Belirtilmedi';
              const reasonStr = qVal.reason || '—';
              let badgeCol = '#34d399';
              if (choiceStr === 'Katılmıyorum') badgeCol = '#f43f5e';
              else if (choiceStr === 'Kısmen Katılıyorum') badgeCol = '#fbbf24';

              valueContent = '<div style="margin-bottom:0.6rem;">' +
                '<span style="display:inline-block;padding:0.25rem 0.8rem;border-radius:12px;font-size:0.82rem;font-weight:800;background:' + badgeCol + '20;border:1px solid ' + badgeCol + '50;color:' + badgeCol + ';">📌 Tercih: ' + subEsc(choiceStr) + '</span>' +
              '</div>' +
              '<div style="background:rgba(0,0,0,0.3);padding:0.8rem 1rem;border-radius:10px;border-left:3px solid ' + badgeCol + ';font-size:0.9rem;color:#e2e8f0;line-height:1.6;white-space:pre-wrap;">' +
                subEsc(reasonStr) +
              '</div>';
            } else if (typeof qVal === 'boolean') {
              valueContent = qVal
                ? '<span style="color:#34d399;font-weight:700;">✅ Evet / Onaylandı</span>'
                : '<span style="color:#f43f5e;font-weight:700;">❌ Hayır / Onaylanmadı</span>';
            } else if (Array.isArray(qVal)) {
              valueContent = '<span style="color:#fff;font-weight:600;">' + subEsc(qVal.join(', ')) + '</span>';
            } else {
              const strVal = String(qVal || '—');
              const hasCodeBlock = strVal.indexOf(String.fromCharCode(96, 96, 96)) !== -1;
              if (hasCodeBlock || strVal.indexOf('# ') !== -1 || strVal.indexOf('**') !== -1) {
                valueContent = '<div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);padding:0.9rem;border-radius:10px;font-family:monospace;font-size:0.88rem;color:#67e8f9;line-height:1.6;white-space:pre-wrap;overflow-x:auto;">' + subEsc(strVal) + '</div>';
              } else {
                valueContent = '<div style="font-size:0.92rem;color:#f1f5f9;line-height:1.65;white-space:pre-wrap;background:rgba(0,0,0,0.25);padding:0.75rem 0.9rem;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">' + subEsc(strVal) + '</div>';
              }
            }

            let behBadge = '';
            const fieldBeh = behavior && (behavior[qKey] || behavior[fullKey]);
            if (fieldBeh) {
              const pastes = fieldBeh.pasteCount || 0;
              const chars = fieldBeh.charCount || (typeof qVal === 'string' ? qVal.length : 0);
              const words = fieldBeh.wordCount || 0;
              const secSpent = fieldBeh.totalTimeMs ? Math.round(fieldBeh.totalTimeMs / 1000) : 0;
              
              const pasteAlert = pastes > 0 ? '<span style="color:#fbbf24;font-weight:700;">⚠️ ' + pastes + ' Kopyala-Yapıştır</span>' : '<span style="color:#34d399;">✓ Manuel Yazıldı</span>';
              
              behBadge = '<div style="margin-top:0.4rem;font-size:0.75rem;color:var(--muted);display:flex;align-items:center;gap:0.8rem;flex-wrap:wrap;background:rgba(0,0,0,0.2);padding:0.3rem 0.6rem;border-radius:6px;">' +
                '<span>' + pasteAlert + '</span>' +
                '<span>✍️ ' + chars + ' karakter' + (words ? ' (' + words + ' kelime)' : '') + '</span>' +
                (secSpent ? '<span>⏱️ ' + secSpent + ' sn odaklanma</span>' : '') +
              '</div>';
            }

            const cleanLabelForAsk = labelText.replace(/'/g, "\\'");

            fieldsHtml.push(
              '<div style="margin-bottom:1.1rem;padding:1rem 1.1rem;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:14px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;margin-bottom:0.6rem;">' +
                  '<div style="flex:1;font-weight:700;color:' + secMeta.color + ';font-size:0.9rem;line-height:1.5;">' +
                    subEsc(labelText) +
                  '</div>' +
                  '<button onclick="openAskModal(\\\'' + subEsc(_currentSubId) + '\\\',\\\'' + subEsc(fullKey) + '\\\',\\\'' + subEsc(cleanLabelForAsk) + '\\\')" style="flex-shrink:0;padding:0.35rem 0.85rem;border-radius:10px;background:rgba(129,140,248,0.15);border:1px solid rgba(129,140,248,0.35);color:#818cf8;font-size:0.75rem;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all 0.2s;" onmouseover="this.style.background=\\\'rgba(129,140,248,0.25)\\\'" onmouseout="this.style.background=\\\'rgba(129,140,248,0.15)\\\'" title="Bu soru hakkında kullanıcıya Discord DM ile soru sor">💬 Soru Sor</button>' +
                '</div>' +
                valueContent +
                behBadge +
              '</div>'
            );
          }

          if (fieldsHtml.length > 0) {
            htmlSections.push(
              '<div style="margin-bottom:1.8rem;">' +
                '<div style="font-size:0.9rem;font-weight:800;color:' + secMeta.color + ';text-transform:uppercase;letter-spacing:0.8px;margin-bottom:0.9rem;padding-bottom:0.4rem;border-bottom:2px solid ' + secMeta.color + '40;display:flex;align-items:center;gap:0.5rem;">' +
                  secMeta.title +
                '</div>' +
                fieldsHtml.join('') +
              '</div>'
            );
          }
        }

        return htmlSections.length > 0 ? htmlSections.join('') : '<p style="color:var(--muted);text-align:center;padding:2rem;">Görüntülenecek form verisi bulunamadı.</p>';
      }

      function buildInterviewPanel(sub) {
        if (!sub) return '';

        const ans = sub.interviewAnswers || {};
        const starsStr = sub.consultantRating ? '⭐'.repeat(sub.consultantRating) + ' (' + sub.consultantRating + '/5)' : 'Henüz değerlendirilmedi';
        const commentStr = sub.consultantComment ? subEsc(sub.consultantComment) : 'Henüz yorum yapılmadı';
        const timeApprovedBadge = sub.interviewTimeApproved
          ? '<span style="color:#34d399;font-weight:800;padding:0.2rem 0.6rem;background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.4);border-radius:12px;">✅ SAAT ONAYLANDI</span>'
          : '<span style="color:#fbbf24;font-weight:800;padding:0.2rem 0.6rem;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.4);border-radius:12px;">⏳ SAAT ONAY BEKLİYOR</span>';

        const retryBadge = sub.retryRequested
          ? '<span style="color:#38bdf8;font-weight:800;padding:0.2rem 0.6rem;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.4);border-radius:12px;">🔄 TEKRAR MÜLAKAT İSTİYOR: EVET</span>'
          : '';

        return '<div style="background:rgba(15,23,42,0.6);border:1px solid rgba(129,140,248,0.25);border-radius:16px;padding:1.4rem;margin-bottom:1.8rem;box-shadow:0 8px 32px rgba(0,0,0,0.3);">' +
          '<div style="font-size:1rem;font-weight:800;color:#818cf8;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">' +
            '<span>🎮 MÜLAKAT YÖNETİMİ & BOT OTOMASYONU</span>' +
            '<div style="display:flex;gap:0.4rem;align-items:center;">' + timeApprovedBadge + retryBadge + '</div>' +
          '</div>' +

          // Accept / Reject Decision Buttons
          '<div style="display:flex;gap:0.8rem;margin-bottom:1.2rem;background:rgba(0,0,0,0.25);padding:0.8rem 1rem;border-radius:12px;border:1px solid rgba(255,255,255,0.08);align-items:center;justify-content:space-between;flex-wrap:wrap;">' +
            '<div style="font-size:0.88rem;font-weight:700;color:#fff;">MÜLAKAT SONUÇ KARARI:</div>' +
            '<div style="display:flex;gap:0.6rem;flex-wrap:wrap;">' +
              '<button type="button" onclick="acceptInterview()" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;padding:0.6rem 1.4rem;border-radius:10px;font-size:0.85rem;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.3);">🟢 MÜLAKATI KABUL ET</button>' +
              '<button type="button" onclick="rejectInterview()" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;padding:0.6rem 1.4rem;border-radius:10px;font-size:0.85rem;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(239,68,68,0.3);">🔴 MÜLAKATI REDDET</button>' +
            '</div>' +
            '<div id="decision-action-res" style="width:100%;font-size:0.78rem;margin-top:0.3rem;min-height:16px;"></div>' +
          '</div>' +

          // Discord ID & Info Row
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.8rem;margin-bottom:1.2rem;background:rgba(255,255,255,0.02);padding:0.8rem;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">' +
            '<div><span style="color:var(--muted);font-size:0.78rem;">DISCORD KULLANICI / ID:</span><br><strong style="color:#fff;font-size:0.88rem;">' + subEsc(sub.discordUsername || sub.userId) + ' (' + subEsc(sub.discordId || sub.userId) + ')</strong></div>' +
            '<div><span style="color:var(--muted);font-size:0.78rem;">MÜLAKAT SAATİ:</span><br><strong style="color:#fbbf24;font-size:0.88rem;">' + subEsc(sub.interviewScheduledTime || 'Belirtilmedi') + '</strong></div>' +
            '<div><span style="color:var(--muted);font-size:0.78rem;">BOT MÜLAKAT DURUMU:</span><br><strong style="color:#38bdf8;font-size:0.88rem;">' + subEsc(sub.interviewState || 'NOT_STARTED') + '</strong></div>' +
          '</div>' +

          // Roblox Mülakat Oyun Linki Input Section
          '<div style="margin-bottom:1.2rem;background:rgba(0,0,0,0.3);padding:1rem;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">' +
            '<label style="display:block;font-size:0.82rem;font-weight:700;color:#a78bfa;margin-bottom:0.4rem;">🔗 ROBLOX MÜLAKAT OYUN LİNKİ GİRME YERİ</label>' +
            '<div style="display:flex;gap:0.6rem;flex-wrap:wrap;">' +
              '<input type="text" id="int-game-link" value="' + subEsc(sub.robloxGameLink || '') + '" placeholder="https://www.roblox.com/games/..." style="flex:1;min-width:240px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.5rem 0.8rem;border-radius:8px;font-size:0.85rem;">' +
              '<button type="button" onclick="saveRobloxGameLink()" style="background:linear-gradient(135deg,#818cf8,#6366f1);color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;">💾 Linki Kaydet</button>' +
            '</div>' +
            '<div id="game-link-res" style="font-size:0.78rem;margin-top:0.3rem;min-height:16px;"></div>' +
          '</div>' +

          // Mülakat Saati Onay & Teklif Section
          '<div style="margin-bottom:1.2rem;background:rgba(0,0,0,0.3);padding:1rem;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">' +
            '<label style="display:block;font-size:0.82rem;font-weight:700;color:#34d399;margin-bottom:0.4rem;">⏰ MÜLAKAT SAATİ İŞLEMLERİ</label>' +
            '<div style="display:flex;gap:0.6rem;flex-wrap:wrap;align-items:center;margin-bottom:0.6rem;">' +
              '<input type="text" id="int-scheduled-time" value="' + subEsc(sub.interviewScheduledTime || '') + '" placeholder="Örn: 2026-08-11 20:00" style="flex:1;min-width:200px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.5rem 0.8rem;border-radius:8px;font-size:0.85rem;">' +
              '<button type="button" onclick="approveInterviewTime()" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;">🟢 SAAT ONAYLANDI</button>' +
              '<button type="button" onclick="proposeInterviewTime()" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;">🟡 FARKLI SAAT TEKLİF ET</button>' +
            '</div>' +
            '<div id="time-action-res" style="font-size:0.78rem;min-height:16px;"></div>' +
          '</div>' +

          // Mülakat Ön Cevapları Grid
          '<div style="margin-bottom:1.2rem;">' +
            '<div style="font-size:0.85rem;font-weight:700;color:#e2e8f0;margin-bottom:0.6rem;">📋 BOT DM MÜLAKAT ÖN CEVAPLARI:</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.6rem;">' +
              '<div style="background:rgba(255,255,255,0.03);padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);font-size:0.8rem;"><span style="color:var(--muted);">Müsaitlik Saati:</span> <br><strong style="color:#fff;">' + subEsc(ans.availability || 'Henüz Yanıtlamadı') + (ans.userRequestedTime ? ' (' + subEsc(ans.userRequestedTime) + ')' : '') + '</strong></div>' +
              '<div style="background:rgba(255,255,255,0.03);padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);font-size:0.8rem;"><span style="color:var(--muted);">Mikrofon Var Mı?:</span> <br><strong style="color:#fff;">' + subEsc(ans.mic || '—') + '</strong></div>' +
              '<div style="background:rgba(255,255,255,0.03);padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);font-size:0.8rem;"><span style="color:var(--muted);">Yaş Sınırı 21+ Mı?:</span> <br><strong style="color:#fff;">' + subEsc(ans.age21 || '—') + '</strong></div>' +
              '<div style="background:rgba(255,255,255,0.03);padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);font-size:0.8rem;"><span style="color:var(--muted);">Roblox 16+ Erişimi:</span> <br><strong style="color:#fff;">' + subEsc(ans.roblox16 || '—') + '</strong></div>' +
              '<div style="background:rgba(255,255,255,0.03);padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);font-size:0.8rem;"><span style="color:var(--muted);">Mülakat Türü Tercihi:</span> <br><strong style="color:#818cf8;">' + subEsc(ans.mode || '—') + '</strong></div>' +
              '<div style="background:rgba(255,255,255,0.03);padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);font-size:0.8rem;"><span style="color:var(--muted);">Roblox Lagsız Katılım:</span> <br><strong style="color:#fff;">' + subEsc(ans.noLag || '—') + '</strong></div>' +
              '<div style="background:rgba(255,255,255,0.03);padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);font-size:0.8rem;"><span style="color:var(--muted);">İtiraz Etmeme Kabulü:</span> <br><strong style="color:#fff;">' + subEsc(ans.agreeNoAppeal || '—') + '</strong></div>' +
              '<div style="background:rgba(255,255,255,0.03);padding:0.6rem 0.8rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);font-size:0.8rem;"><span style="color:var(--muted);">Oyuna Katılım Teyidi:</span> <br><strong style="color:#34d399;">' + subEsc(sub.joinedGameStatus || '—') + '</strong></div>' +
            '</div>' +
          '</div>' +

          // Mülakatı Bitir & Danışman Yorum / Değerlendirmesi Section
          '<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);padding:1rem;border-radius:12px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.8rem;margin-bottom:0.6rem;">' +
              '<div>' +
                '<h4 style="margin:0;font-size:0.9rem;color:#fbbf24;">⭐ MÜLAKAT DANIŞMANI HAKKINDA YORUMLAR VE DEĞERLENDİRME</h4>' +
                '<p style="margin:0.2rem 0 0 0;font-size:0.78rem;color:var(--muted);">Kullanıcının mülakat sonrası girdiği danışman değerlendirmesi ve yıldız puanı.</p>' +
              '</div>' +
              '<button type="button" onclick="finishInterview()" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;padding:0.6rem 1.4rem;border-radius:10px;font-size:0.85rem;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(239,68,68,0.3);">🏁 MÜLAKATI BİTİR</button>' +
            '</div>' +
            '<div style="background:rgba(0,0,0,0.3);padding:0.8rem 1rem;border-radius:10px;font-size:0.85rem;margin-top:0.6rem;">' +
              '<div style="font-weight:700;color:#fbbf24;margin-bottom:0.2rem;">Yıldız Puanı: ' + starsStr + '</div>' +
              '<div style="color:#e2e8f0;line-height:1.5;">Yorum: ' + commentStr + '</div>' +
            '</div>' +
            '<div id="finish-int-res" style="font-size:0.78rem;margin-top:0.4rem;min-height:16px;"></div>' +
          '</div>' +
        '</div>';
      }

      window.openSubModal = function(id) {
        const sub = _allSubs.find(s => s._id === id);
        if (!sub) return;
        _currentSubId = id;
        document.getElementById('modal-title').textContent    = sub.formTitle || sub.formType || 'Başvuru';
        document.getElementById('modal-user').textContent     = (sub.discordUsername || sub.userId) + ' (ID: ' + (sub.discordId || sub.userId || '?') + ')';
        document.getElementById('modal-date').textContent     = sub.createdAt ? new Date(sub.createdAt).toLocaleString('tr-TR') : '—';
        document.getElementById('modal-id').textContent       = sub._id;
        document.getElementById('modal-status-badge').innerHTML = subStatusBadge(sub.status);
        document.getElementById('review-note').value          = '';
        document.getElementById('review-result').textContent  = '';
        document.getElementById('modal-body').innerHTML       = buildInterviewPanel(sub) + buildFormQA(sub.formData, sub.behavior);
        document.getElementById('sub-modal-overlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
      }

      window.saveRobloxGameLink = async function() {
        if (!_currentSubId) return;
        const link = document.getElementById('int-game-link').value.trim();
        const resDiv = document.getElementById('game-link-res');
        resDiv.style.color = 'var(--muted)'; resDiv.textContent = 'Kaydediliyor...';
        try {
          const res = await fetch('/api/admin/form-submissions/' + _currentSubId + '/set-game-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameLink: link })
          });
          const d = await res.json();
          if (res.ok && d.success) {
            resDiv.style.color = '#34d399'; resDiv.textContent = '✅ Roblox Oyun Linki kaydedildi!';
            const sub = _allSubs.find(s => s._id === _currentSubId);
            if (sub) sub.robloxGameLink = link;
          } else {
            resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + (d.error || 'Hata');
          }
        } catch (err) { resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + err.message; }
      }

      window.approveInterviewTime = async function() {
        if (!_currentSubId) return;
        const scheduledTime = document.getElementById('int-scheduled-time').value.trim();
        const resDiv = document.getElementById('time-action-res');
        resDiv.style.color = 'var(--muted)'; resDiv.textContent = 'Saati onaylanıyor...';
        try {
          const res = await fetch('/api/admin/form-submissions/' + _currentSubId + '/approve-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheduledTime })
          });
          const d = await res.json();
          if (res.ok && d.success) {
            resDiv.style.color = '#34d399'; resDiv.textContent = '✅ SAAT ONAYLANDI! Kullanıcıya Discord DM gönderildi.';
            const sub = _allSubs.find(s => s._id === _currentSubId);
            if (sub) { sub.interviewScheduledTime = scheduledTime; sub.interviewTimeApproved = true; }
          } else {
            resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + (d.error || 'Hata');
          }
        } catch (err) { resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + err.message; }
      }

      window.proposeInterviewTime = async function() {
        if (!_currentSubId) return;
        const proposedTime = document.getElementById('int-scheduled-time').value.trim();
        const resDiv = document.getElementById('time-action-res');
        if (!proposedTime) { resDiv.style.color = '#fbbf24'; resDiv.textContent = '⚠️ Lütfen bir saat yazın.'; return; }
        resDiv.style.color = 'var(--muted)'; resDiv.textContent = 'Yeni saat kullanıcıya teklif ediliyor...';
        try {
          const res = await fetch('/api/admin/form-submissions/' + _currentSubId + '/propose-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proposedTime })
          });
          const d = await res.json();
          if (res.ok && d.success) {
            resDiv.style.color = '#34d399'; resDiv.textContent = '✅ Yeni mülakat saati teklifi kullanıcının DM\'ine gönderildi!';
          } else {
            resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + (d.error || 'Hata');
          }
        } catch (err) { resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + err.message; }
      }

      window.acceptInterview = async function() {
        if (!_currentSubId) return;
        if (!confirm('Bu adayın mülakatını KABUL etmek ve oryantasyon sürecini başlatmak istiyor musunuz?')) return;
        const resDiv = document.getElementById('decision-action-res');
        resDiv.style.color = 'var(--muted)'; resDiv.textContent = 'Mülakat kabul ediliyor ve kullanıcının DM oryantasyonu başlatılıyor...';
        try {
          const res = await fetch('/api/admin/form-submissions/' + _currentSubId + '/accept-interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          const d = await res.json();
          if (res.ok && d.success) {
            resDiv.style.color = '#34d399'; resDiv.textContent = '🎉 MÜLAKAT KABUL EDİLDİ! Kullanıcıya tebrikler ve oryantasyon DM\'i gönderildi.';
            const sub = _allSubs.find(s => s._id === _currentSubId);
            if (sub) { sub.status = 'APPROVED'; sub.interviewState = 'ACCEPTED_WAITING_VERIFY'; }
          } else {
            resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + (d.error || 'Hata');
          }
        } catch (err) { resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + err.message; }
      }

      window.rejectInterview = async function() {
        if (!_currentSubId) return;
        const reason = prompt('Mülakat reddetme sebebini giriniz:', 'Belirtilmeyen Neden');
        if (reason === null) return;
        const resDiv = document.getElementById('decision-action-res');
        resDiv.style.color = 'var(--muted)'; resDiv.textContent = 'Mülakat reddediliyor...';
        try {
          const res = await fetch('/api/admin/form-submissions/' + _currentSubId + '/reject-interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
          });
          const d = await res.json();
          if (res.ok && d.success) {
            resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ MÜLAKAT REDDEDİLDİ. Kullanıcıya ret bildirimi ve tekrar mülakat teklifi DM\'i atıldı.';
            const sub = _allSubs.find(s => s._id === _currentSubId);
            if (sub) { sub.status = 'REJECTED'; sub.interviewState = 'REJECTED'; }
          } else {
            resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + (d.error || 'Hata');
          }
        } catch (err) { resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + err.message; }
      }

      window.finishInterview = async function() {
        if (!_currentSubId) return;
        if (!confirm('Mülakatı bitirmek ve kullanıcıya Danışman Değerlendirme (Yıldız & Yorum) DM\'i göndermek istediğinize emin misiniz?')) return;
        const resDiv = document.getElementById('finish-int-res');
        resDiv.style.color = 'var(--muted)'; resDiv.textContent = 'Mülakat bitiriliyor...';
        try {
          const res = await fetch('/api/admin/form-submissions/' + _currentSubId + '/finish-interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          const d = await res.json();
          if (res.ok && d.success) {
            resDiv.style.color = '#34d399'; resDiv.textContent = '🏁 MÜLAKAT BİTİRİLDİ! Kullanıcıya "MÜLAKAT DANIŞMANI HAKKINDA YORUMLARINIZ" değerlendirme formu DM gönderildi.';
          } else {
            resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + (d.error || 'Hata');
          }
        } catch (err) { resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + err.message; }
      }

      function closeSubModal() {
        document.getElementById('sub-modal-overlay').style.display = 'none';
        document.body.style.overflow = '';
        _currentSubId = null;
      }

      async function reviewSubmission(status) {
        if (!_currentSubId) return;
        const note = document.getElementById('review-note').value.trim();
        const resDiv = document.getElementById('review-result');
        const labels = { APPROVED: '✅ Onaylanıyor...', REJECTED: '❌ Reddediliyor...', AI_DETECTED: '🤖 AI tespit işleniyor...' };
        resDiv.style.color = 'var(--muted)';
        resDiv.textContent = labels[status] || 'İşleniyor...';
        try {
          const res = await fetch('/api/admin/form-submissions/' + _currentSubId + '/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, note })
          });
          const d = await res.json();
          if (res.ok && d.success) {
            resDiv.style.color = '#34d399';
            resDiv.textContent = '✅ Güncellendi. Kullanıcıya Discord DM gönderildi.';
            const sub = _allSubs.find(s => s._id === _currentSubId);
            if (sub) { sub.status = status; document.getElementById('modal-status-badge').innerHTML = subStatusBadge(status); }
            setTimeout(loadSubmissions, 800);
          } else {
            resDiv.style.color = '#fb7185';
            resDiv.textContent = '❌ ' + (d.error || 'Hata oluştu');
          }
        } catch (err) {
          resDiv.style.color = '#fb7185';
          resDiv.textContent = '❌ İstek hatası: ' + err.message;
        }
      }

      // ── Soru sor modal ───────────────────────────────────────────────────
      let _askSubId = null, _askKey = null, _askLabel = null;

      function openAskModal(subId, key, label) {
        _askSubId = subId; _askKey = key; _askLabel = label;
        const overlay = document.getElementById('ask-modal-overlay');
        if (!overlay) { _buildAskModal(); }
        document.getElementById('ask-modal-overlay').style.display = 'block';
        document.getElementById('ask-question-label').textContent = label;
        document.getElementById('ask-question-text').value = '';
        document.getElementById('ask-result').textContent = '';
      }

      function _buildAskModal() {
        const div = document.createElement('div');
        div.id = 'ask-modal-overlay';
        div.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9500;display:flex;align-items:center;justify-content:center;padding:1rem;';
        div.innerHTML = '<div style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:2rem;max-width:560px;width:100%;" onclick="event.stopPropagation()">' +
          '<div style="font-size:0.75rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem;">KULLANICIYA SORU SOR — Discord DM</div>' +
          '<div style="font-size:0.85rem;color:#818cf8;font-weight:700;margin-bottom:1rem;padding:0.5rem 0.8rem;background:rgba(129,140,248,0.1);border-radius:8px;border-left:3px solid #818cf8;" id="ask-question-label"></div>' +
          '<textarea id="ask-question-text" rows="4" placeholder="Kullanıcıya sormak istediğiniz soruyu yazın... (Bot DM üzerinden iletecek)" style="width:100%;margin-bottom:1rem;font-size:0.9rem;"></textarea>' +
          '<div style="display:flex;gap:0.75rem;justify-content:flex-end;">' +
            '<button onclick="document.getElementById(&quot;ask-modal-overlay&quot;).style.display=&quot;none&quot;" style="padding:0.6rem 1.2rem;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:var(--muted);cursor:pointer;font-family:inherit;">İptal</button>' +
            '<button onclick="sendAskQuestion()" style="padding:0.6rem 1.4rem;border-radius:10px;background:linear-gradient(135deg,#818cf8,#6366f1);border:none;color:#fff;font-weight:700;cursor:pointer;font-family:inherit;">💬 DM Gönder</button>' +
          '</div>' +
          '<div id="ask-result" style="margin-top:0.8rem;font-size:0.85rem;min-height:18px;"></div>' +
        '</div>';
        div.addEventListener('click', function(e) { if (e.target === div) div.style.display = 'none'; });
        document.body.appendChild(div);
      }

      async function sendAskQuestion() {
        if (!_askSubId) return;
        const q = document.getElementById('ask-question-text').value.trim();
        const resDiv = document.getElementById('ask-result');
        if (!q) { resDiv.style.color = '#fbbf24'; resDiv.textContent = '⚠️ Soru boş olamaz.'; return; }
        resDiv.style.color = 'var(--muted)'; resDiv.textContent = '⏳ Gönderiliyor...';
        try {
          const res = await fetch('/api/admin/form-submissions/' + _askSubId + '/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionKey: _askKey, questionLabel: _askLabel, questionText: q })
          });
          const d = await res.json();
          if (res.ok && d.success) {
            resDiv.style.color = '#34d399'; resDiv.textContent = '✅ Soru Discord DM olarak kullanıcıya gönderildi!';
            setTimeout(() => { document.getElementById('ask-modal-overlay').style.display = 'none'; }, 1500);
          } else {
            resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + (d.error || 'Hata');
          }
        } catch (err) {
          resDiv.style.color = '#fb7185'; resDiv.textContent = '❌ ' + err.message;
        }
      }
      // ── /DOLDURULAN FORMLAR ─────────────────────────────────────────────

      async function submitAdminForm() {
        if (!currentFormType) return;
        const form = formDefinitions[currentFormType];
        const data = {};
        
        for (const f of form.fields) {
          const inputEl = document.getElementById(f.id);
          const val = inputEl ? inputEl.value.trim() : '';
          if (f.required && !val) {
            showToast(f.label + ' alanı doldurulmalıdır!', 'warning');
            return;
          }
          data[f.apiKey] = val;
        }

        if (currentFormType === 'resign') {
          if (data.confirm.toLowerCase() !== 'evet') {
            showToast("İşlemi onaylamak için kutuya tam olarak 'Evet' yazmalısınız.", 'warning');
            return;
          }
          const check = await confirmAction("İstifa etmek istediğinize emin misiniz? Bu işlem geri alınamaz ve sunucu rolleriniz temizlenecektir!");
          if (!check) return;
        }

        const submitBtn = document.getElementById('form-submit-btn');
        const oldText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Gönderiliyor...';

        try {
          const res = await fetch('/api/admin/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formType: currentFormType, formData: data })
          });

          const d = await res.json().catch(() => ({}));
          
          if (res.ok) {
            showToast(d.message || 'Form başarıyla gönderildi.', 'success');
            
            // Eğer izin formuysa ve AI kararı varsa alert ile göster
            if (currentFormType === 'leave' && d.aiResponse) {
              const approvedText = d.approved ? '✅ ONAYLANDI' : '❌ REDDEDİLDİ';
              setTimeout(() => {
                alert('[Yapay Zeka IK Kararı] ' + approvedText + '\n\n' + d.aiResponse);
              }, 400);
            }
            
            // Alanları temizle
            form.fields.forEach(f => {
              const inputEl = document.getElementById(f.id);
              if (inputEl) inputEl.value = '';
            });
          } else {
            showToast(d.error || 'Gönderim başarısız oldu.', 'error');
          }
        } catch (err) {
          showToast('Bağlantı hatası oluştu.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerText = oldText;
        }
      }

      // ── Kullanıcı arama ───────────────────────────────────────────────────
      function adminEsc(s) {
        const el = document.createElement('div');
        el.textContent = s == null ? '' : String(s);
        return el.innerHTML;
      }

      window.showToast = function(message, type = 'info', duration = 3500) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.right = '24px';
        toast.style.bottom = '24px';
        toast.style.zIndex = '9999';
        toast.style.padding = '14px 18px';
        toast.style.borderRadius = '16px';
        toast.style.background = type === 'success' ? 'rgba(34,197,94,0.95)' : type === 'error' ? 'rgba(239,68,68,0.95)' : type === 'warning' ? 'rgba(245,158,11,0.95)' : 'rgba(75,85,99,0.95)';
        toast.style.color = '#fff';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 16px 40px rgba(0,0,0,0.18)';
        toast.style.maxWidth = '320px';
        toast.style.lineHeight = '1.4';
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.remove();
        }, duration);
      }

      window.adminSearchUsers = async function() {
        const q = document.getElementById('admin-search').value.trim();
        const box = document.getElementById('admin-results');
        box.innerHTML = '<p style="color:var(--muted);">Aranıyor...</p>';
        try {
          const res = await fetch('/api/admin/users?q=' + encodeURIComponent(q));
          const d = await res.json();
          if (!res.ok) { box.innerHTML = '<p style="color:var(--danger);">' + adminEsc(d.error || 'Hata') + '</p>'; return; }
          if (!d.users || !d.users.length) { box.innerHTML = '<p style="color:var(--muted);">Kullanıcı bulunamadı.</p>'; return; }
          box.innerHTML = d.users.map(function(u) {
            const banBtn = u.isBanned
              ? '<button type="button" class="btn btn-sm btn-success" onclick="quickUnban(\\\''+adminEsc(u.discordId)+'\\\')">✅ Banı Kaldır</button>'
              : '<button type="button" class="btn btn-sm btn-danger" onclick="quickBan(\\\''+adminEsc(u.discordId)+'\\\',\\\''+adminEsc(u.discordUsername)+'\\\')">🚫 Yasakla</button>';
          const restoreBtn = !u.isStaff
              ? '<button type="button" class="btn btn-sm btn-success" onclick="restoreStaff(\\\''+adminEsc(u.discordId)+'\\\')">↩️ Geri Al</button>'
              : '';
            return '<div class="admin-user-row" data-discord-id="' + adminEsc(u.discordId) + '" style="background:rgba(0,0,0,0.3);border:1px solid '+(u.isBanned?'rgba(248,113,113,.4)':'var(--border)')+';border-radius:14px;padding:1.25rem;margin-bottom:1rem;">' +
              '<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap;">' +
              (u.discordAvatar ? '<img src="'+adminEsc(u.discordAvatar)+'" style="width:36px;height:36px;border-radius:50%;">' : '') +
              '<div><div style="font-weight:800;">' + adminEsc(u.discordUsername) + (u.isBanned ? ' <span style="color:var(--danger);font-size:.75rem;">🚫 BANLANDI</span>' : '') + '</div>' +
              '<div style="font-size:0.8rem;color:var(--muted);">ID: ' + adminEsc(u.discordId) + '</div></div></div>' +
              '<div style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;margin-top:0.5rem;">' +
              '<label style="cursor:pointer;"><input type="checkbox" class="admin-cb-admin" ' + (u.isAdmin ? 'checked' : '') + '> Admin</label>' +
              '<label style="cursor:pointer;"><input type="checkbox" class="admin-cb-staff" ' + (u.isStaff ? 'checked' : '') + '> Staff</label>' +
              '<select class="admin-sel-modlevel" style="background:var(--bg3,#1e293b);color:var(--fg,#f8fafc);border:1px solid var(--border,rgba(255,255,255,0.15));border-radius:8px;padding:0.25rem 0.5rem;font-size:0.85rem;">' +
              '<option value="1" ' + (u.modLevel === 1 ? 'selected' : '') + '>Stajyer Personel (L1)</option>' +
              '<option value="2" ' + (u.modLevel === 2 ? 'selected' : '') + '>Personel (L2)</option>' +
              '<option value="3" ' + (u.modLevel === 3 ? 'selected' : '') + '>⭐ Kıdemli Personel (L3)</option>' +
              '<option value="4" ' + (u.modLevel === 4 ? 'selected' : '') + '>👑 Sekreter (L4)</option>' +
              '<option value="5" ' + (u.modLevel === 5 ? 'selected' : '') + '>👨‍✈️ Kıdemli Sekreter (L5)</option>' +
              '<option value="6" ' + (u.modLevel === 6 ? 'selected' : '') + '>💼 Genel Koordinatör (L6)</option>' +
              '</select>' +
              '<select class="admin-sel-modstatus" style="background:var(--bg3,#1e293b);color:var(--fg,#f8fafc);border:1px solid var(--border,rgba(255,255,255,0.15));border-radius:8px;padding:0.25rem 0.5rem;font-size:0.85rem;">' +
              '<option value="active" ' + (u.modStatus === 'active' ? 'selected' : '') + '>🟢 Aktif Kadro</option>' +
              '<option value="paused" ' + (u.modStatus === 'paused' ? 'selected' : '') + '>⏸️ Duraklatıldı</option>' +
              '<option value="dismissed" ' + (u.modStatus === 'dismissed' ? 'selected' : '') + '>🔴 Ayrıldı</option>' +
              '</select>' +
              '<button type="button" class="btn btn-sm btn-primary" onclick="adminSaveRoles(this)">💾 Kaydet & Sync</button>' +
              '<a href="/user-logs/' + adminEsc(u.discordId) + '" class="btn btn-sm btn-ghost" style="border-color:var(--accent);color:var(--accent);text-decoration:none;display:inline-flex;align-items:center;gap:4px;">📜 Loglar</a>' +
              restoreBtn + banBtn + '</div></div>';
          }).join('');
        } catch (err) {
          box.innerHTML = '<p style="color:var(--danger);">Bağlantı hatası.</p>';
        }
      }

      window.adminSaveRoles = async function(btn) {
        const row = btn.closest('.admin-user-row');
        const id = row.getAttribute('data-discord-id');
        const isAdmin = row.querySelector('.admin-cb-admin').checked;
        const isStaff = row.querySelector('.admin-cb-staff').checked;
        const modLevel = Number(row.querySelector('.admin-sel-modlevel').value);
        const modStatus = row.querySelector('.admin-sel-modstatus').value;
        const res = await fetch('/api/admin/users/' + encodeURIComponent(id) + '/roles', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAdmin, isStaff, modLevel, modStatus })
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok) showToast('Rütbe & Yetkiler Güncellendi: ' + (d.user?.discordUsername || id), 'success');
        else showToast(d.error || 'Kaydedilemedi', 'error');
      }

      window.quickBan = function(id, name) {
        document.getElementById('ban-id').value = id;
        admTab('bans', document.querySelectorAll('.adm-tab')[2]);
      }

      window.quickUnban = async function(id) {
        if (!confirm('Bu kullanıcının banını kaldırmak istiyor musun?')) return;
        const res = await fetch('/api/admin/users/' + encodeURIComponent(id) + '/unban', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discordUnban: false })
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok) { showToast(d.message || 'Ban kaldırıldı.', 'success'); adminSearchUsers(); }
        else showToast(d.error || 'Hata', 'error');
      }

      window.restoreStaff = async function(query) {
        await restoreStaffQuery(query);
      }

      window.restoreStaffByQuery = async function() {
        const query = document.getElementById('restore-staff-query').value.trim();
        await restoreStaffQuery(query);
      }

      window.restoreStaffWithAutoSchool = async function() {
        const query = document.getElementById('restore-school-query').value.trim();
        const resultBox = document.getElementById('restore-school-result');
        if (!query) {
          showToast('Discord kullanıcı adı veya ID girin.', 'warning');
          resultBox.innerText = '';
          return;
        }
        resultBox.innerText = '⏳ Geri alınıyor ve mod okulu geçiliyor...';
        try {
          const res = await fetch('/api/admin/restore-staff', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, autoPassModeratorSchool: true })
          });
          const d = await res.json().catch(() => ({}));
          if (res.ok) {
            showToast(d.message || 'Kullanıcı başarıyla geri alındı ve okulu tamamlandı.', 'success');
            resultBox.style.color = 'var(--success)';
            resultBox.innerText = d.message || '✅ Personel geri alındı ve okulu tamamlandı.';
            adminSearchUsers();
          } else {
            showToast(d.error || 'İşlem başarısız.', 'error');
            resultBox.style.color = 'var(--danger)';
            resultBox.innerText = d.error || '❌ Hata oluştu.';
          }
        } catch (err) {
          showToast('Bağlantı hatası.', 'error');
          resultBox.style.color = 'var(--danger)';
          resultBox.innerText = 'Bağlantı hatası oluştu.';
        }
      }

      async function restoreStaffQuery(query) {
        const resultBox = document.getElementById('restore-staff-result');
        if (!query) {
          showToast('Discord kullanıcı adı veya ID girin.', 'warning');
          resultBox.innerText = '';
          return;
        }
        resultBox.innerText = '⏳ Geri alınıyor...';
        try {
          const res = await fetch('/api/admin/restore-staff', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          });
          const d = await res.json().catch(() => ({}));
          if (res.ok) {
            showToast(d.message || 'Kullanıcı başarıyla geri alındı.', 'success');
            resultBox.style.color = 'var(--success)';
            resultBox.innerText = d.message || '✅ Personel geri alındı.';
            adminSearchUsers();
          } else {
            showToast(d.error || 'Geri alma başarısız.', 'error');
            resultBox.style.color = 'var(--danger)';
            resultBox.innerText = d.error || '❌ Hata oluştu.';
          }
        } catch (err) {
          showToast('Bağlantı hatası.', 'error');
          resultBox.style.color = 'var(--danger)';
          resultBox.innerText = 'Bağlantı hatası oluştu.';
        }
      }

      adminSearchUsers();

      // ── Ban işlemleri ─────────────────────────────────────────────────────
      async function banUser() {
        const idOrName = document.getElementById('ban-id').value.trim();
        const reason   = document.getElementById('ban-reason').value.trim();
        const discordBan = document.getElementById('ban-discord').checked;
        const siteBan = document.getElementById('ban-site').checked;

        if (!idOrName) { showToast('Discord ID veya kullanıcı adı girin.', 'warning'); return; }

        try {
          const sr = await fetch('/api/admin/users?q=' + encodeURIComponent(idOrName));
          const sd = await sr.json().catch(() => ({}));
          const found = (sd.users || []).find(u =>
            u.discordId === idOrName ||
            (u.discordUsername || '').toLowerCase() === idOrName.toLowerCase()
          );

          if (!found) {
            showToast('Kullanıcı bulunamadı.', 'error');
            return;
          }

          const res = await fetch('/api/admin/users/' + encodeURIComponent(found.discordId) + '/ban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, discordBan, siteBan })
          });
          const d = await res.json().catch(() => ({}));

          if (res.ok) {
            showToast(d.message || 'Kullanıcı yasaklandı.', 'success');
            document.getElementById('ban-id').value = '';
            document.getElementById('ban-reason').value = '';
            loadBans();
          } else {
            showToast(d.error || 'Yasaklanamadı', 'error');
          }
        } catch (err) {
          showToast('Bağlantı hatası.', 'error');
        }
      }

      async function loadBans() {
        const box = document.getElementById('ban-list');
        if (!box) return;
        box.innerHTML = '<div style="color:var(--muted);text-align:center;padding:2rem;">Yükleniyor...</div>';
        try {
          const res = await fetch('/api/admin/bans');
          const d = await res.json().catch(() => ({}));
          if (!res.ok) { box.innerHTML = '<div style="color:var(--danger);padding:1rem;">Hata: ' + adminEsc(d.error || 'Bilinmeyen hata') + '</div>'; return; }
          const bans = d.bans || [];
          if (!bans.length) { box.innerHTML = '<div style="color:var(--muted);text-align:center;padding:2rem;">Aktif yasaklama bulunmuyor.</div>'; return; }
          box.innerHTML = bans.map(function(b) {
            return '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:1rem;margin-bottom:0.75rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">' +
              '<div>' +
              '<div style="font-weight:700;">' + adminEsc(b.discordUsername) + ' <small style="color:var(--muted);font-weight:normal;">(ID: ' + adminEsc(b.discordId) + ')</small></div>' +
              '<div style="font-size:0.85rem;color:var(--muted);margin-top:0.25rem;">Sebep: ' + adminEsc(b.banReason || 'Belirtilmedi') + '</div>' +
              '</div>' +
              '<button class="btn btn-sm btn-success" onclick="quickUnban(\\\'' + adminEsc(b.discordId) + '\\\')">Banı Kaldır</button>' +
              '</div>';
          }).join('');
        } catch (err) {
          box.innerHTML = '<div style="color:var(--danger);padding:1rem;">Bağlantı hatası.</div>';
        }
      }

      // ── Coin verme ────────────────────────────────────────────────────────
      async function giveCoins() {
        const idOrName = document.getElementById('coin-id').value.trim();
        const amount   = parseInt(document.getElementById('coin-amount').value, 10);
        const reason   = document.getElementById('coin-reason').value.trim();
        const resultBox = document.getElementById('coin-result');

        if (!idOrName) { showToast('Discord ID veya kullanıcı adı girin.', 'warning'); return; }
        if (isNaN(amount) || amount <= 0) { showToast('Geçerli bir miktar girin.', 'warning'); return; }
        if (amount > 1000000) { showToast('Maksimum 1.000.000 coin verebilirsiniz.', 'warning'); return; }

        resultBox.innerHTML = '<span style="color:var(--muted);">Kullanıcı aranıyor...</span>';

        // Kullanıcıyı ara
        const sr = await fetch('/api/admin/users?q=' + encodeURIComponent(idOrName));
        const sd = await sr.json().catch(() => ({}));
        const found = (sd.users || []).find(u =>
          u.discordId === idOrName ||
          (u.discordUsername || '').toLowerCase() === idOrName.toLowerCase()
        );

        if (!found) {
          resultBox.innerHTML = '<span style="color:var(--danger);">❌ Kullanıcı bulunamadı.</span>';
          return;
        }

        resultBox.innerHTML = \`<span style="color:var(--muted);">\${adminEsc(found.discordUsername)} kullanıcısına \${amount.toLocaleString('tr-TR')} coin veriliyor...</span>\`;

        const res = await fetch('/api/admin/users/' + encodeURIComponent(found.discordId) + '/give-coins', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, reason })
        });
        const d = await res.json().catch(() => ({}));

        if (res.ok) {
          showToast(d.message || 'Coin verildi.', 'success');
          resultBox.innerHTML = \`<span style="color:var(--success);">✅ \${adminEsc(d.message)} • Yeni bakiye: \${(d.newBalance || 0).toLocaleString('tr-TR')} 🪙</span>\`;
          document.getElementById('coin-id').value = '';
          document.getElementById('coin-amount').value = '';
          document.getElementById('coin-reason').value = '';
        } else {
          resultBox.innerHTML = \`<span style="color:var(--danger);">❌ \${adminEsc(d.error || 'Hata')}</span>\`;
          showToast(d.error || 'Hata', 'error');
        }
      }

      async function loadStats() {
        try {
          const statsRes = await fetch('/api/admin/istatistikler');
          const statsData = await statsRes.json().catch(() => ({}));
          if (statsRes.ok && statsData.success) {
            document.getElementById('stat-active').textContent = statsData.stats.aktifKullanicilar || 0;
            document.getElementById('stat-inactive').textContent = statsData.stats.inaktifKullanicilar || 0;
            document.getElementById('stat-rules').textContent = statsData.stats.kurallarKabul || 0;
            document.getElementById('stat-activities').textContent = statsData.stats.toplamAktivite || 0;
          }

          const activeRes = await fetch('/api/admin/aktif-kullanicilar');
          const activeData = await activeRes.json().catch(() => ({}));
          if (activeRes.ok && activeData.success) {
            const html = activeData.users.slice(0, 50).map(id => 
              '<div style="padding:10px; background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;"><span>👤 ' + adminEsc(id) + '</span></div>'
            ).join('');
            document.getElementById('active-list').innerHTML = html || '<p style="color:var(--muted); text-align:center; padding:1rem;">Aktif kullanıcı yok</p>';
          }

          const inactiveRes = await fetch('/api/admin/inaktif-kullanicilar');
          const inactiveData = await inactiveRes.json().catch(() => ({}));
          if (inactiveRes.ok && inactiveData.success) {
            const html = inactiveData.users.slice(0, 50).map(id => 
              '<div style="padding:10px; background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;"><span>👤 ' + adminEsc(id) + '</span></div>'
            ).join('');
            document.getElementById('inactive-list').innerHTML = html || '<p style="color:var(--muted); text-align:center; padding:1rem;">İnaktif kullanıcı yok</p>';
          }

          const rulesRes = await fetch('/api/admin/kurallar-kabul');
          const rulesData = await rulesRes.json().catch(() => ({}));
          if (rulesRes.ok && rulesData.success) {
            document.getElementById('stat-rules').textContent = rulesData.count || 0;
          }
        } catch (error) {
          console.error('Admin istatistik veri yükleme hatası:', error);
        }
      }

      // İlk yükleme
      document.addEventListener('DOMContentLoaded', loadStats);
      // Her 30 saniyede bir otomatik yenile
      setInterval(() => {
        if (document.getElementById('adm-stats').style.display !== 'none') {
          loadStats();
        }
      }, 30000);

    <\/script>
  `;
  return _layout('Admin', user, content, '', '/admin');
}

function renderGroupAdminPage(user, isOwner = false) {
  const tmtGroups = {
    "35212138": "TMT Akademi",
    "33709461": "TMT Askeri İnzibat",
    "35430592": "TMT Birimler Bölükler",
    "5415548": "TMT Deniz Kuvvetleri Komutanlığı",
    "35212127": "TMT Genel Branş Komutanlığı",
    "33709391": "TMT Hava Kuvvetleri",
    "35432150": "TMT Hudut Müfettişleri",
    "12008462": "TMT Jandarma Genel Komutanlığı",
    "33714381": "TMT Kara Kuvvetleri Komutanlığı",
    "35528574": "TMT Ministry of Foreign Affairs",
    "33708598": "TMT Özel Kuvvetler Komutanlığı",
    "11517908": "TMT Turkish Armed Forces",
    "35528598": "TMT RAIDERS",
    "35528556": "TMT Sürücü Okulu"
  };

  const groupListHtml = Object.entries(tmtGroups).map(([id, name]) => {
    return `
      <button class="btn btn-ghost w-full group-select-btn" data-group-id="${id}" onclick="selectGroup('${id}', '${_esc(name)}')" style="justify-content:flex-start;text-align:left;margin-bottom:0.4rem;padding:0.6rem 1rem;">
        🏢 ${_esc(name)}
      </button>
    `;
  }).join('');

  const ownerSection = isOwner ? `
    <div id="owner-panel" style="margin-top:2rem;background:rgba(124,106,247,0.05);border:1px solid rgba(124,106,247,0.12);border-radius:18px;padding:1.5rem;">
      <h3 style="font-size:1.15rem;font-weight:800;color:var(--accent);margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
        👑 Kurucu Özel Alanı (ekonqtx)
      </h3>
      
      <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:2rem;">
        <!-- Yetkili Ekle -->
        <div style="flex:1;min-width:240px;">
          <label style="font-weight:700;">Grup Yetkilisi Ekle</label>
          <div style="display:flex;gap:0.5rem;">
            <input type="text" id="new-admin-username" placeholder="Discord kullanıcı adı" style="margin-bottom:0;">
            <button class="btn btn-success" onclick="addGroupAdmin()">Ekle</button>
          </div>
        </div>

        <!-- Tüm Grupları Düzenleme -->
        <div style="flex:1;min-width:240px;display:flex;flex-direction:column;justify-content:flex-end;">
          <label style="font-weight:700;">Toplu İşlemler</label>
          <button class="btn btn-danger w-full" onclick="reorderAllGroups5by5()">
            🔄 Tüm Grupları 5'erli Sırala (Teker Teker)
          </button>
        </div>
      </div>

      <!-- Yetkililer Listesi -->
      <h4 style="font-size:0.95rem;font-weight:800;margin-bottom:0.75rem;">📋 Yetkili Discord Kullanıcıları</h4>
      <div id="admins-list" style="display:flex;flex-direction:column;gap:0.5rem;">
        <p style="color:var(--muted);font-size:0.9rem;">Yükleniyor...</p>
      </div>

      <!-- Bulk Sıralama Log Paneli -->
      <div id="bulk-log-container" style="display:none;margin-top:1.5rem;">
        <h4 style="font-size:0.95rem;font-weight:800;margin-bottom:0.5rem;color:var(--danger);">🤖 İşlem Konsolu</h4>
        <div id="bulk-log" style="background:#000;font-family:monospace;font-size:0.8rem;color:#39ff14;padding:1rem;border-radius:12px;max-height:200px;overflow-y:auto;border:1px solid rgba(255,255,255,0.08);line-height:1.4;">
        </div>
      </div>
    </div>
  ` : '';

  const content = `
    <div style="display:flex;gap:2rem;align-items:flex-start;flex-wrap:wrap;position:relative;">
      <!-- Sol Panel: Gruplar -->
      <div class="card" style="flex:1;min-width:280px;max-width:320px;padding:1.5rem;position:sticky;top:6rem;">
        <h3 style="font-size:1.15rem;font-weight:800;margin-bottom:1rem;color:var(--accent);">🏢 TMT Roblox Grupları</h3>
        <div style="max-height:60vh;overflow-y:auto;padding-right:0.25rem;">
          ${groupListHtml}
        </div>
      </div>

      <!-- Sağ Panel: Editör / Global Görünüm -->
      <div style="flex:3;min-width:320px;display:flex;flex-direction:column;gap:1.5rem;">
        <!-- Global Bilgi / Başlangıç Paneli -->
        <div id="global-panel" class="card">
          <h1 style="font-size:2rem;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:0.5rem;">
            ⚙️ Grup ve Rütbe Yönetimi
          </h1>
          <p class="text-muted" style="line-height:1.5;margin-bottom:1rem;">
            Sol taraftaki listeden işlem yapmak istediğiniz grubu seçin. Yetkili olduğunuz grupların rütbe isimlerini, renklerini değiştirebilir, sıralarını sürükleyip bırakarak düzenleyebilir ve grup açıklamasını güncelleyebilirsiniz.
          </p>
          <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:12px;padding:1rem;font-size:0.88rem;color:var(--muted);line-height:1.5;">
            <p><strong>💡 Bilgilendirme:</strong> Rütbe sıralamasını (Rank numaraları) değiştirmek için rütbe satırlarının başındaki sürükleme simgesinden tutup aşağı/yukarı taşıyabilirsiniz. Kaydet butonuna basılana kadar Roblox üzerinde rütbeler güncellenmez.</p>
          </div>
          ${ownerSection}
        </div>

        <!-- Grup Rütbe Editörü -->
        <div id="editor-panel" class="card" style="display:none;">
          <!-- Grup Detayları Başlığı -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
            <div>
              <h2 id="active-group-title" style="font-size:1.6rem;font-weight:800;color:#fff;"></h2>
              <p id="active-group-id" class="text-muted" style="font-size:0.85rem;margin-top:0.2rem;font-family:monospace;"></p>
            </div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
              <button class="btn btn-success" onclick="addNewRoleRow()">
                ➕ Yeni Rol Ekle
              </button>
              <button class="btn btn-ghost" onclick="reorderCurrentGroup5by5()">
                ⚡ 5'erli Sırala
              </button>
              <button class="btn" style="background:var(--accent);color:#fff;" onclick="saveGroupRoles()">
                💾 Değişiklikleri Kaydet
              </button>
            </div>
          </div>

          <!-- Grup Açıklaması -->
          <div style="margin-bottom:1.5rem;background:rgba(255,255,255,0.015);border:1px solid var(--border);border-radius:14px;padding:1.25rem;">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:0.75rem;color:var(--accent2);">✍️ Grup Açıklaması</h3>
            <textarea id="group-description" rows="3" placeholder="Grup açıklaması..." style="margin-bottom:0.75rem;resize:vertical;"></textarea>
            <div style="display:flex;justify-content:flex-end;">
              <button id="btn-save-desc" class="btn btn-sm btn-ghost" onclick="saveGroupDescription()">Açıklamayı Güncelle</button>
            </div>
          </div>

          <!-- Rütbeler Listesi -->
          <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:1rem;color:var(--accent2);">🛡️ Rütbe Yapılandırması</h3>
          <div id="roles-headers" style="display:grid;grid-template-columns:50px 80px 1fr 80px auto;gap:1rem;padding:0.5rem 1rem;font-size:0.8rem;color:var(--muted);font-weight:700;text-transform:uppercase;border-bottom:1px solid var(--border);margin-bottom:0.5rem;">
            <div>Sıra</div>
            <div>Rank</div>
            <div>Rütbe Adı</div>
            <div style="text-align:center;">Renk</div>
            <div style="text-align:center;">İzinler</div>
          </div>
          <div id="roles-list" style="display:flex;flex-direction:column;gap:0.5rem;">
            <!-- Rütbe Satırları -->
          </div>
        </div>
      </div>
    </div>

    <!-- Sürükle Bırak CSS Stilleri -->
    <style>
      .role-row {
        display: grid;
        grid-template-columns: 50px 80px 1fr 80px auto;
        gap: 1rem;
        align-items: center;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.75rem 1rem;
        transition: transform 0.2s, background-color 0.2s, border-color 0.2s;
      }
      .role-row.draggable {
        cursor: grab;
      }
      .role-row.draggable:active {
        cursor: grabbing;
      }
      .role-row.over {
        border-color: var(--accent);
        background: rgba(167, 139, 250, 0.08);
      }
      .drag-handle {
        color: var(--muted);
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
      }
      .role-rank-badge {
        font-family: monospace;
        font-weight: 700;
        color: var(--accent2);
        background: rgba(129, 140, 248, 0.08);
        border: 1px solid rgba(129, 140, 248, 0.2);
        border-radius: 6px;
        padding: 0.25rem 0.5rem;
        text-align: center;
      }
      .color-picker-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .color-picker-wrapper input[type="color"] {
        border: 1px solid var(--border);
        border-radius: 6px;
        width: 38px;
        height: 38px;
        padding: 0.15rem;
        background: transparent;
        cursor: pointer;
        margin-bottom: 0;
      }
      .system-role {
        opacity: 0.65;
        background: rgba(255,255,255,0.01);
      }
    </style>

    <script>
      let currentGroupId = '';
      let rolesData = [];
      let dragSrcEl = null;

      function cleanQuote(s) {
        return (s == null ? "" : String(s)).replace(/"/g, '&quot;');
      }

      // ── Yetkilileri Yükle (Owner-only) ──
      const isOwner = ${isOwner};
      async function loadAdmins() {
        if (!isOwner) return;
        try {
          const res = await fetch('/api/group-admin/config');
          const d = await res.json();
          if (res.ok && d.admins) {
            const list = document.getElementById('admins-list');
            if (d.admins.length === 0) {
              list.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;">Kayıtlı grup yetkilisi bulunmuyor.</p>';
              return;
            }
            list.innerHTML = d.admins.map(a => {
              return \`
                <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.02);padding:0.75rem 1rem;border-radius:12px;border:1px solid var(--border);">
                  <div style="font-weight:600;color:var(--text);">\${a.username}</div>
                  <button class="btn btn-sm btn-danger" onclick="removeGroupAdmin('\${a.username}')">Kaldır</button>
                </div>
              \`;
            }).join('');
          }
        } catch (err) {
          console.error("Yetkililer yüklenemedi:", err);
        }
      }

      async function addGroupAdmin() {
        const usernameEl = document.getElementById('new-admin-username');
        const username = usernameEl.value.trim();
        if (!username) { showToast('Bir kullanıcı adı girin.', 'warning'); return; }
        
        try {
          const res = await fetch('/api/group-admin/admins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          const d = await res.json();
          if (res.ok) {
            showToast('Yetkili başarıyla eklendi.', 'success');
            usernameEl.value = '';
            loadAdmins();
          } else {
            showToast(d.error || 'Hata oluştu.', 'error');
          }
        } catch {
          showToast('Bağlantı hatası.', 'error');
        }
      }

      async function removeGroupAdmin(username) {
        if (!confirm(username + ' yetkisini kaldırmak istediğinize emin misiniz?')) return;
        try {
          const res = await fetch('/api/group-admin/admins/' + encodeURIComponent(username), {
            method: 'DELETE'
          });
          const d = await res.json();
          if (res.ok) {
            showToast('Yetkili kaldırıldı.', 'success');
            loadAdmins();
          } else {
            showToast(d.error || 'Hata oluştu.', 'error');
          }
        } catch {
          showToast('Bağlantı hatası.', 'error');
        }
      }

      if (isOwner) {
        loadAdmins();
      }
    </script>

    <!-- İzinler Modalı -->
    <div id="permissions-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;align-items:center;justify-content:center;padding:1rem;">
      <div class="card" style="width:100%;max-width:500px;max-height:90vh;overflow-y:auto;">
        <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:0.5rem;color:var(--accent);">⚙️ Rol İzinleri</h2>
        <p id="perm-role-name" style="color:var(--muted);margin-bottom:1.5rem;"></p>
        
        <div id="perm-loading" style="display:none;text-align:center;padding:2rem;">
          <p style="color:var(--muted);">İzinler yükleniyor...</p>
        </div>
        
        <div id="perm-content" style="display:flex;flex-direction:column;gap:1rem;">
          <!-- İzinler buraya JS ile yüklenecek -->
        </div>

        <div style="display:flex;justify-content:flex-end;gap:1rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border);">
          <button class="btn btn-ghost" onclick="closePermissionsModal()">İptal</button>
          <button class="btn btn-success" id="btn-save-perms" onclick="savePermissions()">💾 Kaydet</button>
        </div>
      </div>
    </div>

    <script>
      // ── Grup Seçimi ve Veri Çekme ──
      async function selectGroup(groupId, groupName) {
        currentGroupId = groupId;
        
        // Aktif buton rengi
        document.querySelectorAll('.group-select-btn').forEach(btn => {
          btn.classList.add('btn-ghost');
          btn.style.background = 'transparent';
          btn.style.borderColor = 'rgba(255,255,255,0.08)';
        });
        const activeBtn = document.querySelector(\`[data-group-id="\${groupId}"]\`);
        if (activeBtn) {
          activeBtn.classList.remove('btn-ghost');
          activeBtn.style.background = 'rgba(167,139,250,0.15)';
          activeBtn.style.borderColor = 'var(--accent)';
        }

        // Arayüz geçişi
        document.getElementById('global-panel').style.display = 'none';
        const editor = document.getElementById('editor-panel');
        editor.style.display = 'block';
        
        document.getElementById('active-group-title').innerText = groupName;
        document.getElementById('active-group-id').innerText = 'ID: ' + groupId;

        const rolesList = document.getElementById('roles-list');
        rolesList.innerHTML = '<div style="color:var(--muted);text-align:center;padding:3rem;">Rütbeler yükleniyor...</div>';
        document.getElementById('group-description').value = '';

        try {
          const res = await fetch(\`/api/group-admin/groups/\${groupId}/roles\`);
          const d = await res.json();
          if (res.ok && d.roles) {
            rolesData = d.roles;
            document.getElementById('group-description').value = d.description || '';
            renderRolesList();
          } else {
            rolesList.innerHTML = \`<div style="color:var(--danger);text-align:center;padding:3rem;">❌ Hata: \${d.error || 'Rütbeler yüklenemedi.'}</div>\`;
          }
        } catch (err) {
          rolesList.innerHTML = '<div style="color:var(--danger);text-align:center;padding:3rem;">❌ Bağlantı hatası.</div>';
        }
      }

      // Rütbeleri Arayüze Çiz
      function renderRolesList() {
        const list = document.getElementById('roles-list');
        if (rolesData.length === 0) {
          list.innerHTML = '<div style="color:var(--muted);text-align:center;padding:2rem;">Grupta rütbe bulunamadı.</div>';
          return;
        }

        rolesData = [...rolesData].sort((a, b) => b.rank - a.rank);
        const sortedRoles = rolesData;

        list.innerHTML = sortedRoles.map((role, index) => {
          const isSystem = role.rank === 0 || role.rank === 255;
          const dragAttr = isSystem ? '' : 'draggable="true"';
          const dragClass = isSystem ? 'system-role' : 'draggable';
          const handle = isSystem ? '🔒' : '☰';

          return \`
            <div class="role-row \${dragClass}" data-role-id="\${role.id}" \${dragAttr}>
              <div class="drag-handle">\${handle}</div>
              <div class="role-rank-badge">\${role.rank}</div>
              <div>
                <input type="text" id="name-\${role.id}" class="role-name-input" value="\${cleanQuote(role.name)}" \${isSystem ? 'disabled style="background:transparent;border:none;margin-bottom:0;"' : 'style="margin-bottom:0;padding:0.5rem 0.75rem;"'} onchange="updateRoleName('\${role.id}', this.value)">
              </div>
              <div class="color-picker-wrapper">
                <input type="color" value="\${role.color || '#7c6af7'}" onchange="updateRoleColor('\${role.id}', this.value)">
              </div>
              <div style="display:flex;align-items:center;justify-content:center;">
                \${String(currentGroupId) !== "11517908" ? \`<button class="btn btn-sm btn-ghost" style="padding:0.35rem 0.6rem;font-size:0.8rem;" onclick="openPermissionsModal('\${role.id}', '\${cleanQuote(role.name)}')">İzinler</button>\` : \`<span style="color:var(--muted);font-size:0.75rem;">Kapalı</span>\`}
              </div>
            </div>
          \`;
        }).join('');

        addDragAndDropEvents();
      }

      function updateRoleName(id, val) {
        const role = rolesData.find(r => r.id === id);
        if (role) {
          role.name = val.trim();
        }
      }

      function updateRoleColor(id, val) {
        const role = rolesData.find(r => r.id === id);
        if (role) {
          role.color = val;
        }
      }

      function addNewRoleRow() {
        if (!currentGroupId) return;
        const newId = 'new_' + Date.now();
        rolesData.push({
          id: newId,
          name: 'Yeni Rütbe',
          rank: 1,
          color: '#ffffff'
        });
        recalculateRankNumbers();
        renderRolesList();
        showToast('Yeni rol eklendi. Sırasını sürükleyerek ayarlayın ve kaydedin.', 'info');
      }

      function addDragAndDropEvents() {
        const rows = document.querySelectorAll('.role-row.draggable');
        rows.forEach(row => {
          row.addEventListener('dragstart', handleDragStart, false);
          row.addEventListener('dragenter', handleDragEnter, false);
          row.addEventListener('dragover', handleDragOver, false);
          row.addEventListener('dragleave', handleDragLeave, false);
          row.addEventListener('drop', handleDrop, false);
          row.addEventListener('dragend', handleDragEnd, false);
        });
      }

      function handleDragStart(e) {
        this.style.opacity = '0.4';
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.getAttribute('data-role-id'));
      }

      function handleDragOver(e) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
      }

      function handleDragEnter() {
        this.classList.add('over');
      }

      function handleDragLeave() {
        this.classList.remove('over');
      }

      function handleDrop(e) {
        if (e.stopPropagation) {
          e.stopPropagation();
        }
        
        const srcId = e.dataTransfer.getData('text/plain');
        const destId = this.getAttribute('data-role-id');
        
        if (srcId !== destId) {
          const srcIndex = rolesData.findIndex(r => r.id === srcId);
          const destIndex = rolesData.findIndex(r => r.id === destId);
          
          if (srcIndex > -1 && destIndex > -1) {
            // Sadece taşınabilir rütbeleri değiştir
            const srcRole = rolesData[srcIndex];
            const destRole = rolesData[destIndex];
            
            if (srcRole.rank !== 0 && srcRole.rank !== 255 && destRole.rank !== 0 && destRole.rank !== 255) {
              const [removed] = rolesData.splice(srcIndex, 1);
              rolesData.splice(destIndex, 0, removed);
              
              // Sürükle bırak bittikten sonra rankleri 5'erli sıralayalım (veya koruyup güncelleyelim)
              // Rütbeleri rank sırasına göre (büyükten küçüğe) tutup aradakileri 5erli sıralayabiliriz:
              recalculateRankNumbers();
              renderRolesList();
            }
          }
        }
        return false;
      }

      function handleDragEnd() {
        this.style.opacity = '1';
        document.querySelectorAll('.role-row').forEach(row => {
          row.classList.remove('over');
        });
      }

      // Drag and drop sonrasında rank numaralarını bozmadan 5erli aralıklara oturtalım
      function recalculateRankNumbers() {
        // rolesData şu an yeni sıralamasıyla (büyükten küçüğe) duruyor.
        // En sondaki Owner veya Guest olabilir.
        // Biz sadece rank > 0 && rank < 255 olanları sıralayacağız.
        // Aşağıdan yukarıya (küçük rankten büyüğe) 5, 10, 15 şeklinde vermeliyiz.
        // Bunun için diziyi ters çevirip işleyebiliriz.
        let currentRank = 5;
        // rolesData büyükten küçüğe sıralı. Sondan başa doğru gidersek küçükten büyüğe gitmiş oluruz.
        for (let i = rolesData.length - 1; i >= 0; i--) {
          const r = rolesData[i];
          if (r.rank > 0 && r.rank < 255) {
            r.rank = currentRank;
            currentRank += 5;
          }
        }
      }

      // ── API İşlemleri (Description, Save Roles, Reorder 5) ──

      async function saveGroupDescription() {
        if (!currentGroupId) return;
        const description = document.getElementById('group-description').value;
        const btn = document.getElementById('btn-save-desc');
        
        btn.disabled = true;
        btn.innerText = 'Güncelleniyor...';

        try {
          const res = await fetch(\`/api/group-admin/groups/\${currentGroupId}/description\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
          });
          const d = await res.json();
          if (res.ok) {
            showToast('Grup açıklaması başarıyla güncellendi.', 'success');
          } else {
            showToast(d.error || 'Açıklama güncellenemedi.', 'error');
          }
        } catch {
          showToast('Bağlantı hatası.', 'error');
        } finally {
          btn.disabled = false;
          btn.innerText = 'Açıklamayı Güncelle';
        }
      }

      async function saveGroupRoles() {
        if (!currentGroupId) return;
        if (!confirm('Rütbe düzenlemelerini kaydetmek istediğinize emin misiniz? Bu işlem Roblox API üzerinden rütbeleri güncelleyecektir.')) return;

        // Buton kilitle
        const btns = document.querySelectorAll('.btn');
        btns.forEach(b => b.disabled = true);

        showToast('Değişiklikler kaydediliyor, lütfen bekleyin...', 'info');

        try {
          const res = await fetch(\`/api/group-admin/groups/\${currentGroupId}/roles\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roles: rolesData })
          });
          const d = await res.json();
          if (res.ok) {
            showToast('Rütbeler başarıyla kaydedildi! Roblox sunucularına yansıması 1-2 dakika sürebilir.', 'success');
            // Cache sorununu önlemek için hemen tekrar fetch atmıyoruz, mevcut görünüme dokunmuyoruz.
          } else {
            showToast(d.error || 'Kaydetme hatası.', 'error');
          }
        } catch (err) {
          showToast('Bağlantı hatası oluştu.', 'error');
        } finally {
          btns.forEach(b => b.disabled = false);
        }
      }

      async function reorderCurrentGroup5by5() {
        if (!currentGroupId) return;
        if (!confirm('Grubun sıralarını bozmadan en aşağıdan başlayarak 5, 10, 15... şeklinde yeniden sıralamak istediğinize emin misiniz?')) return;

        showToast('Sıralama işlemi başlatıldı...', 'info');

        try {
          const res = await fetch(\`/api/group-admin/groups/\${currentGroupId}/reorder-5\`, { method: 'POST' });
          const d = await res.json();
          if (res.ok) {
            showToast("Grup rütbeleri başarıyla 5erli sıralandı. Roblox'un yansıtması 1-2 dakika sürebilir, ardından sayfayı yenileyebilirsiniz.", 'success');
          } else {
            showToast(d.error || 'Sıralama hatası.', 'error');
          }
        } catch {
          showToast('Bağlantı hatası.', 'error');
        }
      }

      // --- PERMISSIONS MANAGEMENT ---
      let currentEditingRoleId = null;
      let currentPermissionsData = null;

      function closePermissionsModal() {
        document.getElementById('permissions-modal').style.display = 'none';
        currentEditingRoleId = null;
        currentPermissionsData = null;
      }

      async function openPermissionsModal(roleId, roleName) {
        if (String(currentGroupId) === "11517908") {
          showToast("Bu grupta izin yönetimi devre dışıdır.", "warning");
          return;
        }

        currentEditingRoleId = roleId;
        document.getElementById('perm-role-name').innerText = roleName + " (ID: " + roleId + ")";
        document.getElementById('permissions-modal').style.display = 'flex';
        document.getElementById('perm-loading').style.display = 'block';
        document.getElementById('perm-content').innerHTML = '';
        document.getElementById('btn-save-perms').disabled = true;

        try {
          const res = await fetch(\`/api/group-admin/groups/\${currentGroupId}/roles/\${roleId}/permissions\`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'İzinler alınamadı');

          currentPermissionsData = data;
          renderPermissionsForm(data.permissions);
        } catch (err) {
          document.getElementById('perm-content').innerHTML = \`<p style="color:var(--danger);">❌ \${err.message}</p>\`;
        } finally {
          document.getElementById('perm-loading').style.display = 'none';
          if (currentPermissionsData) document.getElementById('btn-save-perms').disabled = false;
        }
      }

      function renderPermissionsForm(perms) {
        if (!perms) {
          document.getElementById('perm-content').innerHTML = '<p>İzin bilgisi bulunamadı.</p>';
          return;
        }

        let html = '';
        for (const [categoryName, categoryObj] of Object.entries(perms)) {
          // Format category name: groupPostsPermissions -> Group Posts Permissions
          const formattedTitle = categoryName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          html += \`
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:1rem;">
              <h4 style="font-weight:700;margin-bottom:0.5rem;color:var(--accent2);font-size:0.9rem;">\${formattedTitle}</h4>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
          \`;

          for (const [permName, permValue] of Object.entries(categoryObj)) {
            const labelName = permName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            html += \`
              <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;cursor:pointer;">
                <input type="checkbox" id="perm_\${categoryName}_\${permName}" \${permValue ? 'checked' : ''}>
                <span>\${labelName}</span>
              </label>
            \`;
          }
          html += \`</div></div>\`;
        }

        document.getElementById('perm-content').innerHTML = html;
      }

      async function savePermissions() {
        if (!currentEditingRoleId || !currentPermissionsData || String(currentGroupId) === "11517908") return;

        const btn = document.getElementById('btn-save-perms');
        btn.disabled = true;
        btn.textContent = '⏳ Kaydediliyor...';

        // Gather checkbox values and update currentPermissionsData
        for (const [categoryName, categoryObj] of Object.entries(currentPermissionsData.permissions)) {
          for (const permName of Object.keys(categoryObj)) {
            const cb = document.getElementById(\`perm_\${categoryName}_\${permName}\`);
            if (cb) {
              currentPermissionsData.permissions[categoryName][permName] = cb.checked;
            }
          }
        }

        try {
          const res = await fetch(\`/api/group-admin/groups/\${currentGroupId}/roles/\${currentEditingRoleId}/permissions\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentPermissionsData)
          });
          const data = await res.json();

          if (res.ok) {
            showToast('İzinler başarıyla güncellendi.', 'success');
            closePermissionsModal();
          } else {
            showToast(data.error || 'İzinler güncellenemedi.', 'error');
          }
        } catch (err) {
          showToast('Bağlantı hatası.', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = '💾 Kaydet';
        }
      }

      // ── Kurucu Toplu Sıralama Fonksiyonu (Owner-only) ──
      async function reorderAllGroups5by5() {
        if (!isOwner) return;
        if (!confirm('TMT grubunun sahip olduğu tüm grupları sıralarını bozmadan 5erli olarak sıralamak istiyor musunuz? Bu işlem her grup için sırayla çalışacaktır ve bir miktar zaman alacaktır.')) return;

        const logContainer = document.getElementById('bulk-log-container');
        const logBox = document.getElementById('bulk-log');
        logContainer.style.display = 'block';
        logBox.innerHTML = '🤖 Toplu 5erli sıralama başlatıldı...\\n';
        
        // Butonları kilitle
        const btns = document.querySelectorAll('.btn');
        btns.forEach(b => b.disabled = true);

        try {
          // 1. Grupları listele
          logBox.innerHTML += '👉 Gruplar listeleniyor...\\n';
          const groupsRes = await fetch('/api/group-admin/groups');
          const groupsData = await groupsRes.json();
          
          if (!groupsRes.ok || !groupsData.groups) {
            logBox.innerHTML += '❌ Gruplar listelenemedi: ' + (groupsData.error || 'Bilinmeyen hata') + '\\n';
            return;
          }

          const groups = groupsData.groups;
          logBox.innerHTML += \`✅ Toplam \${groups.length} grup bulundu.\\n\\n\`;

          // 2. Sırayla her grup için API'yi tetikle
          for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            logBox.innerHTML += \`⏳ [\${i+1}/\${groups.length}] \${g.name} sıralanıyor...\\n\`;
            logBox.scrollTop = logBox.scrollHeight;

            try {
              const res = await fetch(\`/api/group-admin/groups/\${g.id}/reorder-5\`, { method: 'POST' });
              const d = await res.json();
              if (res.ok) {
                logBox.innerHTML += \`✅ \${g.name} başarıyla sıralandı!\\n\`;
              } else {
                logBox.innerHTML += \`⚠️ \${g.name} hata aldı: \${d.error || 'Bilinmeyen hata'}\\n\`;
              }
            } catch (err) {
              logBox.innerHTML += \`❌ \${g.name} bağlantı hatası: \${err.message}\\n\`;
            }
            logBox.scrollTop = logBox.scrollHeight;
            
            // Gruplar arası 1 saniye bekleme
            if (i < groups.length - 1) {
              await new Promise(r => setTimeout(r, 1000));
            }
          }

          logBox.innerHTML += '\\n🏁 Tüm grupların sıralama işlemi tamamlandı!';
          logBox.scrollTop = logBox.scrollHeight;
          showToast('Toplu sıralama tamamlandı.', 'success');
        } catch (err) {
          logBox.innerHTML += '\\n❌ Toplu işlem başarısız oldu: ' + err.message;
          logBox.scrollTop = logBox.scrollHeight;
        } finally {
          btns.forEach(b => b.disabled = false);
        }
      }
    </script>
  `;

  return _layout('Grup Yönetimi', user, content, '', '/group-admin');
}

function renderLeaderboardPage(user, topUsers = []) {
  const medals = ['🥇', '🥈', '🥉'];
  const rankColors = ['#fbbf24', '#9ca3af', '#b45309'];

  const content = `
    <div class="card">
      <h1 style="font-size:2.2rem;font-weight:800;text-align:center;margin-bottom:0.5rem;
                 background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
        🏆 Liderlik Tablosu
      </h1>
      <p style="text-align:center;color:var(--muted);margin-bottom:2.5rem;">Sunucunun en zengin kullanıcıları</p>

      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${topUsers.map((u, i) => {
    const borderColor = rankColors[i] || 'var(--border)';
    return `
          <div style="display:flex;align-items:center;justify-content:space-between;
                      background:rgba(255,255,255,0.025);padding:1rem 1.5rem;border-radius:16px;
                      border:1px solid ${borderColor};transition:transform 0.3s,background 0.3s;backdrop-filter:blur(8px);"
               onmouseover="this.style.transform='translateX(4px)';this.style.background='rgba(255,255,255,0.04)'"
               onmouseout="this.style.transform='none';this.style.background='rgba(255,255,255,0.025)'">
            <div style="display:flex;align-items:center;gap:1.25rem;">
              <div style="font-size:1.5rem;width:32px;text-align:center;font-weight:800;color:${borderColor};">
                ${medals[i] || (i + 1)}
              </div>
              <img src="${_esc(u.avatar)}" alt="" style="width:46px;height:46px;border-radius:50%;border:2px solid ${borderColor};">
              <span style="font-weight:700;font-size:1.1rem;">${_esc(u.username)}</span>
            </div>
            <div style="font-size:1.1rem;font-weight:800;color:var(--success);">
              💵 ${Number(u.balance).toLocaleString('tr-TR')}
            </div>
          </div>`;
  }).join('') || '<div style="text-align:center;padding:3rem;color:var(--muted);">Henüz veri yok.</div>'}
      </div>
    </div>
  `;
  return _layout('Liderlik Tablosu', user, content);
}


// ─────────────────────────────────────────────
// SHOP PAGE
// ─────────────────────────────────────────────
function renderShopPage(user, items = []) {
  const content = `
    <div class="card">
      <h1 style="font-size:2.2rem;font-weight:800;text-align:center;margin-bottom:0.5rem;color:var(--accent);">🛒 Mağaza</h1>
      <p style="text-align:center;color:var(--muted);margin-bottom:3rem;">Ekonomi bakiyenizle satın alabileceğiniz özellikler</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;">
        ${items.map(item => `
          <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:20px;
                      padding:2rem;text-align:center;transition:transform 0.3s,border-color 0.3s,box-shadow 0.3s;cursor:pointer;display:flex;flex-direction:column;align-items:center;backdrop-filter:blur(12px);"
               onmouseover="this.style.transform='translateY(-6px)';this.style.borderColor='rgba(167,139,250,0.2)';this.style.boxShadow='0 12px 30px rgba(0,0,0,0.3)'"
               onmouseout="this.style.transform='none';this.style.borderColor='rgba(255,255,255,0.06)';this.style.boxShadow='none'">
            <div style="font-size:3.5rem;margin-bottom:1rem;">${_esc(item.icon || '📦')}</div>
            <h3 style="font-size:1.3rem;margin-bottom:0.5rem;">${_esc(item.name)}</h3>
            <p style="color:var(--muted);margin-bottom:1.5rem;font-size:0.9rem;line-height:1.5;flex:1;">${_esc(item.desc || '')}</p>
            <div style="font-size:1.5rem;font-weight:800;color:var(--success);margin-bottom:1.5rem;">
              💵 ${Number(item.price).toLocaleString('tr-TR')}
            </div>
            <button class="btn w-full" onclick="buyItem('${_esc(item.id || item.name)}','${_esc(item.name)}')">Satın Al</button>
          </div>
        `).join('') || '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted);">Mağazada henüz ürün yok.</div>'}
      </div>
    </div>

    <script>
      async function buyItem(id, name) {
        if (!confirm(name + ' satın almak istiyor musun?')) return;
        try {
          const res = await fetch('/api/shop/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: id })
          });
          const d = await res.json().catch(() => ({}));
          if (res.ok) showToast(d.message || 'Satın alındı!', 'success');
          else showToast(d.error || 'İşlem başarısız.', 'error');
        } catch {
          showToast('Bağlantı hatası.', 'error');
        }
      }
    </script>
  `;
  return _layout('Mağaza', user, content);
}


// ─────────────────────────────────────────────
// 404 / ERROR PAGE
// ─────────────────────────────────────────────
function renderErrorPage(code = 404, message = 'Sayfa bulunamadı.') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${code} — Sentara</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root { --accent:#a78bfa; --accent2:#818cf8; --bg:#06060e; --muted:#7c7c9a; }
    body {
      background:var(--bg);
      background-image:radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.06) 0%, transparent 60%);
      color:#f0f0f8; font-family:'Outfit',sans-serif;
      min-height:100vh; display:flex; align-items:center; justify-content:center;
      text-align:center; padding:2rem;
    }
    .code {
      font-size:7rem; font-weight:800; line-height:1;
      background:linear-gradient(135deg,var(--accent),var(--accent2));
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      margin-bottom:1rem;
    }
    h1 { font-size:1.4rem; margin-bottom:1rem; font-weight:600; }
    p  { color:var(--muted); margin-bottom:2rem; font-weight:300; }
    a  {
      display:inline-block; padding:0.8rem 2rem;
      background:rgba(167,139,250,0.18);
      border:1px solid rgba(167,139,250,0.25);
      color:var(--accent); border-radius:30px; text-decoration:none; font-weight:600;
      transition:all 0.3s ease;
      box-shadow:0 2px 16px rgba(167,139,250,0.1);
      backdrop-filter:blur(8px);
    }
    a:hover {
      transform:translateY(-2px);
      background:rgba(167,139,250,0.28);
      border-color:rgba(167,139,250,0.4);
      color:#fff;
      box-shadow:0 8px 28px rgba(167,139,250,0.2);
    }
    ::selection { background:rgba(167,139,250,0.3); color:#fff; }
  </style>
</head>
<body>
  <div>
    <div class="code">${code}</div>
    <h1>Bir şeyler ters gitti.</h1>
    <p>${_esc(message)}</p>
    <a href="/">Ana Sayfaya Dön</a>
  </div>
</body>
</html>`;
}


// ─────────────────────────────────────────────
// CREATE TICKET PAGE  (yeni)
// ─────────────────────────────────────────────
function renderCreateTicketPage(user, categories = []) {
  const defaultCats = ['Genel Destek', 'Teknik Sorun', 'Hesap', 'Ödeme', 'Diğer'];
  const cats = categories.length ? categories : defaultCats;

  const content = `
    <div class="card" style="max-width:640px;margin:0 auto;">
      <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem;">➕ Yeni Ticket Oluştur</h1>
      <p class="text-muted mb-3">Ekibimiz en kısa sürede sana dönecek.</p>
      <hr class="divider">

      <div id="ticket-form">
        <label>Kategori <span style="color:var(--danger);">*</span></label>
        <select id="tc-category">
          <option value="">— Seçiniz —</option>
          <option value="ban">🔨 Ban / Şikayet Talebi</option>
          <option value="reklam">📢 Reklam Satın Al</option>
          <option value="report">🚨 Kullanıcı Şikayet</option>
          <option value="billing">💳 Ödeme Sorunu</option>
          <option value="technical">🔧 Teknik Sorun</option>
          <option value="account">👤 Hesap Sorunu</option>
          <option value="genel">💬 Genel Destek</option>
          <option value="other">📝 Diğer</option>
        </select>

        <label>Konu <span style="color:var(--danger);">*</span></label>
        <input type="text" id="tc-subject" placeholder="Kısa bir konu başlığı girin" maxlength="100">

        <label>Açıklama <span style="color:var(--danger);">*</span></label>
        <textarea id="tc-desc" rows="6" placeholder="Sorununuzu veya talebinizi ayrıntılı olarak anlatın..." maxlength="2000"></textarea>
        <div style="text-align:right;color:var(--muted);font-size:0.8rem;margin-top:-1rem;margin-bottom:1rem;">
          <span id="tc-count">0</span>/2000
        </div>

        <div id="tc-error" style="display:none;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);color:var(--danger);padding:0.8rem 1rem;border-radius:10px;margin-bottom:1rem;"></div>

        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          <button class="btn" id="tc-submit" onclick="submitTicket()" style="flex:1;">📨 Gönder</button>
          <a href="/tickets" class="btn btn-ghost" style="flex:1;text-align:center;">İptal</a>
        </div>
      </div>
    </div>

    <script>
      const descEl  = document.getElementById('tc-desc');
      const cntEl   = document.getElementById('tc-count');
      descEl.addEventListener('input', () => { cntEl.textContent = descEl.value.length; });

      // Auto-select category from URL query parameters if present
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('category');
      if (catParam) {
        const selectEl = document.getElementById('tc-category');
        if (selectEl) {
          selectEl.value = catParam;
        }
      }

      async function submitTicket() {
        const cat      = document.getElementById('tc-category').value;
        const subject  = document.getElementById('tc-subject').value.trim();
        const desc     = descEl.value.trim();
        const errEl    = document.getElementById('tc-error');
        const btn      = document.getElementById('tc-submit');

        // Kategori bazlı otomatik öncelik
        const autoPriority = { ban: 'high', report: 'high', billing: 'high', reklam: 'medium', technical: 'medium', account: 'medium', genel: 'low', other: 'low' };
        const priority = autoPriority[cat] || 'medium';

        errEl.style.display = 'none';
        if (!cat)     { errEl.textContent = 'Lütfen bir kategori seçin.';        errEl.style.display='block'; return; }
        if (!subject) { errEl.textContent = 'Lütfen bir konu başlığı girin.';    errEl.style.display='block'; return; }
        if (!desc)    { errEl.textContent = 'Lütfen açıklama kısmını doldurun.'; errEl.style.display='block'; return; }

        btn.textContent = 'Gönderiliyor...';
        btn.disabled = true;

        try {
          const res = await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: cat, subject, description: desc, priority })
          });
          const d = await res.json().catch(() => ({}));
          if (res.ok) {
            const msg = d.discordChannel
              ? \`Ticket oluşturuldu! 🎉 \${d.discordChannel}\`
              : 'Ticket oluşturuldu! 🎉';
            showToast(msg, 'success');
            setTimeout(() => window.location.href = '/tickets', 1500);
          } else {
            errEl.textContent = d.error || 'Bir hata oluştu.';
            errEl.style.display = 'block';
            btn.textContent = '📨 Gönder';
            btn.disabled = false;
          }
        } catch {
          errEl.textContent = 'Bağlantı hatası. Lütfen tekrar deneyin.';
          errEl.style.display = 'block';
          btn.textContent = '📨 Gönder';
          btn.disabled = false;
        }
      }
    </script>
  `;
  return _layout('Yeni Ticket', user, content, '', '/tickets');
}


// ─────────────────────────────────────────────
// NOTIFICATIONS PAGE  (yeni)
// ─────────────────────────────────────────────
function renderNotificationsPage(user, notifications = []) {
  const notifHtml = notifications.map(n => {
    const icons = { ticket: '🎫', system: '⚙️', staff: '👨‍💼', mention: '💬', warning: '⚠️' };
    const icon = n.icon || icons[n.type] || '🔔';
    const isRead = n.read;
    return `
      <div style="display:flex;gap:1rem;align-items:flex-start;padding:1.25rem;
                  border-radius:14px;border:1px solid ${isRead ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.2)'};
                  background:${isRead ? 'rgba(255,255,255,0.02)' : 'rgba(167,139,250,0.04)'};
                  margin-bottom:0.75rem;transition:border-color 0.3s;backdrop-filter:blur(8px);"
           onmouseover="this.style.borderColor='rgba(167,139,250,0.2)'" onmouseout="this.style.borderColor='${isRead ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.2)'}'">
        <div style="font-size:1.5rem;flex-shrink:0;">${icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:${isRead ? '600' : '800'};margin-bottom:0.25rem;">${_esc(n.title || '')}</div>
          <div style="color:var(--muted);font-size:0.9rem;line-height:1.5;">${_esc(n.message || '')}</div>
          ${n.createdAt ? `<div style="font-size:0.75rem;color:var(--muted);margin-top:0.4rem;">${new Date(n.createdAt).toLocaleString('tr-TR')}</div>` : ''}
        </div>
        ${!isRead ? `<div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:0.4rem;box-shadow:0 0 6px var(--accent);"></div>` : ''}
      </div>
    `;
  }).join('');

  const unreadCount = notifications.filter(n => !n.read).length;

  const content = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1 style="font-size:2rem;font-weight:800;">🔔 Bildirimler</h1>
          ${unreadCount > 0 ? `<div style="color:var(--accent);font-size:0.85rem;margin-top:0.25rem;">${unreadCount} okunmamış bildirim</div>` : ''}
        </div>
        ${unreadCount > 0 ? `<button class="btn btn-ghost btn-sm" onclick="markAllRead()">✅ Tümünü Okundu İşaretle</button>` : ''}
      </div>

      ${notifications.length > 0 ? notifHtml
      : `<div style="text-align:center;padding:4rem;color:var(--muted);">
             <div style="font-size:3rem;margin-bottom:1rem;">🔕</div>
             <div>Henüz bildiriminiz yok.</div>
           </div>`}
    </div>

    <script>
      async function markAllRead() {
        try {
          const res = await fetch('/api/notifications/read-all', { method: 'POST' });
          if (res.ok) { showToast('Tüm bildirimler okundu işaretlendi.', 'success'); setTimeout(() => location.reload(), 600); }
          else showToast('Bir hata oluştu.', 'error');
        } catch { showToast('Bağlantı hatası.', 'error'); }
      }
    </script>
  `;
  return _layout('Bildirimler', user, content, '', '/notifications');
}


// ─────────────────────────────────────────────
// WEBHOOK PROXY PAGE
// ─────────────────────────────────────────────
function renderWebhookPage(user) {
  const { BASE_URL } = require('../config');
  const proxyUrl = `${BASE_URL}/api/webhook/proxy`;

  const content = `
    <div class="card" style="max-width:800px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="font-size:3rem;margin-bottom:.75rem;">🔗</div>
        <h1 style="font-size:2rem;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
          Webhook Proxy
        </h1>
        <p class="text-muted" style="margin-top:.5rem;">Roblox'tan Discord webhook'larına mesaj gönderin</p>
      </div>

      <!-- Proxy URL -->
      <div style="background:rgba(167,139,250,.05);border:1px solid rgba(167,139,250,.12);border-radius:16px;padding:1.5rem;margin-bottom:2rem;backdrop-filter:blur(8px);">
        <div style="font-size:.8rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:.75rem;">📡 Proxy Endpoint URL</div>
        <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;">
          <code id="proxy-url" style="flex:1;background:rgba(0,0,0,.4);padding:.75rem 1rem;border-radius:10px;font-size:.9rem;color:var(--accent);word-break:break-all;border:1px solid var(--border);">${_esc(proxyUrl)}</code>
          <button class="btn btn-sm" onclick="copyProxyUrl()">📋 Kopyala</button>
        </div>
        <p style="font-size:.8rem;color:var(--muted);margin-top:.75rem;">Bu URL'yi Roblox scriptinizde kullanın. <code style="color:var(--accent);">POST</code> isteği atın.</p>
      </div>

      <!-- Test aracı -->
      <div style="margin-bottom:2rem;">
        <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:1rem;">🧪 Webhook Test Et</h2>

        <label>Discord Webhook URL</label>
        <input type="text" id="wh-url" placeholder="https://discord.com/api/webhooks/..." style="font-family:monospace;font-size:.85rem;">

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
          <div>
            <label>Bot Adı (isteğe bağlı)</label>
            <input type="text" id="wh-username" placeholder="Sentara Bot" style="margin-bottom:0;">
          </div>
          <div>
            <label>Bot Avatar URL (isteğe bağlı)</label>
            <input type="text" id="wh-avatar" placeholder="https://..." style="margin-bottom:0;">
          </div>
        </div>

        <label style="margin-top:1rem;">Mesaj İçeriği</label>
        <textarea id="wh-content" rows="3" placeholder="Merhaba Discord! Bu Roblox'tan gelen bir test mesajıdır." style="resize:vertical;"></textarea>

        <!-- Embed -->
        <details style="margin-bottom:1rem;">
          <summary style="cursor:pointer;color:var(--accent);font-weight:700;font-size:.9rem;padding:.5rem 0;">➕ Embed Ekle (isteğe bağlı)</summary>
          <div style="margin-top:1rem;background:rgba(0,0,0,.2);border-radius:12px;padding:1rem;border:1px solid var(--border);">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div>
                <label>Embed Başlık</label>
                <input type="text" id="emb-title" placeholder="Başlık" style="margin-bottom:0;">
              </div>
              <div>
                <label>Embed Renk (hex)</label>
                <input type="color" id="emb-color" value="#7c6af7" style="height:46px;padding:.25rem;margin-bottom:0;">
              </div>
            </div>
            <label style="margin-top:.75rem;">Embed Açıklama</label>
            <textarea id="emb-desc" rows="2" placeholder="Embed açıklaması..." style="resize:vertical;margin-bottom:.5rem;"></textarea>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
              <div>
                <label>Footer</label>
                <input type="text" id="emb-footer" placeholder="Footer metni" style="margin-bottom:0;">
              </div>
              <div>
                <label>Thumbnail URL</label>
                <input type="text" id="emb-thumb" placeholder="https://..." style="margin-bottom:0;">
              </div>
            </div>
          </div>
        </details>

        <button class="btn" onclick="testWebhook()" id="test-btn">🚀 Gönder</button>
        <div id="wh-result" style="margin-top:1rem;"></div>
      </div>

      <!-- Roblox kod örneği -->
      <div>
        <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:1rem;">📜 Roblox Lua Kod Örneği</h2>
        <div style="position:relative;">
          <pre id="lua-code" style="background:rgba(0,0,0,.5);border:1px solid var(--border);border-radius:12px;padding:1.5rem;overflow-x:auto;font-size:.82rem;line-height:1.6;color:#e2e8f0;white-space:pre-wrap;word-break:break-all;"></pre>
          <button class="btn btn-sm btn-ghost" onclick="copyLua()" style="position:absolute;top:.75rem;right:.75rem;">📋 Kopyala</button>
        </div>
      </div>
    </div>

    <script>
      const PROXY_URL = ${JSON.stringify(proxyUrl)};

      // Lua kod örneğini doldur
      function updateLuaCode() {
        const webhookUrl = document.getElementById('wh-url').value || 'WEBHOOK_URL_BURAYA';
        const code = \`local HttpService = game:GetService("HttpService")

-- Proxy URL (Discord webhook'larına Roblox'tan istek atmak için)
local PROXY_URL = "\${PROXY_URL}"

-- Webhook URL'nizi buraya yapıştırın
local WEBHOOK_URL = "\${webhookUrl}"

local function sendWebhook(message, embedTitle, embedDesc, embedColor)
    local payload = {
        webhookUrl = WEBHOOK_URL,
        username = "Roblox Bot",
        content = message,
    }
    
    -- Embed eklemek istersen
    if embedTitle or embedDesc then
        payload.embeds = {
            {
                title = embedTitle or "",
                description = embedDesc or "",
                color = embedColor or 8077559, -- #7b6af7
                timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
                footer = { text = "Sentara Webhook Proxy" }
            }
        }
    end
    
    local success, err = pcall(function()
        HttpService:PostAsync(
            PROXY_URL,
            HttpService:JSONEncode(payload),
            Enum.HttpContentType.ApplicationJson,
            false
        )
    end)
    
    if not success then
        warn("Webhook gönderilemedi: " .. tostring(err))
    end
end

-- Kullanım örneği:
sendWebhook("Merhaba Discord! 👋", "Oyun Bildirimi", "Bir oyuncu sunucuya katıldı.", 5763719)\`;
        document.getElementById('lua-code').textContent = code;
      }

      document.getElementById('wh-url').addEventListener('input', updateLuaCode);
      updateLuaCode();

      function copyProxyUrl() {
        navigator.clipboard.writeText(PROXY_URL).then(() => showToast('URL kopyalandı!', 'success'));
      }

      function copyLua() {
        const code = document.getElementById('lua-code').textContent;
        navigator.clipboard.writeText(code).then(() => showToast('Lua kodu kopyalandı!', 'success'));
      }

      async function testWebhook() {
        const webhookUrl = document.getElementById('wh-url').value.trim();
        const content    = document.getElementById('wh-content').value.trim();
        const username   = document.getElementById('wh-username').value.trim();
        const avatarUrl  = document.getElementById('wh-avatar').value.trim();
        const embTitle   = document.getElementById('emb-title').value.trim();
        const embDesc    = document.getElementById('emb-desc').value.trim();
        const embColor   = document.getElementById('emb-color').value;
        const embFooter  = document.getElementById('emb-footer').value.trim();
        const embThumb   = document.getElementById('emb-thumb').value.trim();
        const resultBox  = document.getElementById('wh-result');
        const btn        = document.getElementById('test-btn');

        if (!webhookUrl) { showToast('Discord Webhook URL girin.', 'warning'); return; }
        if (!content && !embTitle && !embDesc) { showToast('Mesaj içeriği veya embed girin.', 'warning'); return; }

        btn.disabled = true;
        btn.textContent = '⏳ Gönderiliyor...';
        resultBox.innerHTML = '';

        const payload = { webhookUrl };
        if (content)   payload.content    = content;
        if (username)  payload.username   = username;
        if (avatarUrl) payload.avatar_url = avatarUrl;

        if (embTitle || embDesc) {
          // hex rengi integer'a çevir
          const colorInt = parseInt(embColor.replace('#', ''), 16);
          const embed = { color: colorInt };
          if (embTitle)  embed.title       = embTitle;
          if (embDesc)   embed.description = embDesc;
          if (embFooter) embed.footer      = { text: embFooter };
          if (embThumb)  embed.thumbnail   = { url: embThumb };
          embed.timestamp = new Date().toISOString();
          payload.embeds = [embed];
        }

        try {
          const res = await fetch('/api/webhook/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const d = await res.json().catch(() => ({}));

          if (res.ok && d.success) {
            resultBox.innerHTML = '<div style="color:var(--success);background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);border-radius:10px;padding:.75rem 1rem;">✅ Webhook başarıyla gönderildi!</div>';
            showToast('Webhook gönderildi!', 'success');
          } else {
            resultBox.innerHTML = \`<div style="color:var(--danger);background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:.75rem 1rem;">❌ Hata: \${d.error || 'Bilinmeyen hata'}\${d.discord_response ? '<br><small style=\\"opacity:.7\\">' + d.discord_response + '</small>' : ''}</div>\`;
            showToast(d.error || 'Hata', 'error');
          }
        } catch (err) {
          resultBox.innerHTML = \`<div style="color:var(--danger);">❌ Bağlantı hatası: \${err.message}</div>\`;
        }

        btn.disabled = false;
        btn.textContent = '🚀 Gönder';
      }
    <\/script>
  `;
  return _layout('Webhook Proxy', user, content, '', '/webhook');
}


// ─────────────────────────────────────────────
// BRIEFING ONBOARDING MODAL - Telefon UI
// ─────────────────────────────────────────────
function renderBriefingOnboardingModal(user = null) {
  const content = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 10px;">
      <div class="phone-container" style="max-width: 420px; width: 100%; max-height: 90vh; overflow-y: auto; animation: slideIn 0.3s ease; background: var(--background); border-radius: 20px; display: flex; flex-direction: column;">
        
        <!-- Telefon Header -->
        <div style="background: linear-gradient(135deg, var(--accent) 0%, rgba(167,139,250,0.8) 100%); padding: 20px; text-align: center; border-radius: 20px 20px 0 0; color: #000; sticky; top: 0; z-index: 100;">
          <div style="font-size: 1.3rem; font-weight: 700; margin-bottom: 5px;">🎯 Tanıştığımıza Memnun!</div>
          <div style="font-size: 0.85rem; opacity: 0.9;">Seni biraz daha tanımak istiyoruz</div>
          <div style="margin-top: 10px; font-size: 0.8rem; background: rgba(0,0,0,0.1); padding: 6px 12px; border-radius: 20px; display: inline-block;">
            <span id="progress-text">Soru 1 / 5</span>
          </div>
        </div>

        <!-- İçerik Alanı -->
        <div style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column;">
          <div id="questions-container" style="display: flex; flex-direction: column;"></div>
          <div id="form-container" style="display: none; flex-direction: column;">
            <div style="background: rgba(167,139,250,0.1); padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid var(--accent);">
              <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 8px;">📋 Özetini Kontrol Et</div>
              <textarea id="answers-textarea" placeholder="Cevaplarınız burada görünecek..." 
                style="width: 100%; height: 150px; padding: 12px; background: rgba(255,255,255,0.05); 
                border: 1px solid var(--border); border-radius: 8px; color: var(--text); 
                font-family: 'Outfit', sans-serif; resize: none; font-size: 0.85rem;" readonly></textarea>
            </div>
          </div>
        </div>

        <!-- Telefon Footer (Butonlar) -->
        <div id="button-area" style="padding: 15px; background: rgba(255,255,255,0.02); border-top: 1px solid var(--border); border-radius: 0 0 20px 20px; display: flex; gap: 10px; justify-content: space-between;">
          <button id="prev-btn" onclick="prevQuestion()" 
            style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-weight: 600; cursor: pointer; transition: all 0.3s; display: none;">
            ⬅️ Geri
          </button>
          <button id="next-btn" onclick="nextQuestion()" 
            style="flex: 1; padding: 12px; background: var(--accent); border: none; border-radius: 10px; color: #000; font-weight: 600; cursor: pointer; transition: all 0.3s;">
            ➡️ Devam Et
          </button>
        </div>
      </div>
    </div>

    <style>
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .phone-container {
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        border: 1px solid var(--border);
      }

      .category-header {
        font-weight: 700;
        color: var(--accent);
        margin-top: 15px;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--accent);
      }

      .question-card {
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 15px;
      }

      .question-card .emoji {
        font-size: 1.4rem;
        margin-bottom: 8px;
      }

      .question-card .text {
        font-weight: 600;
        color: var(--text);
        margin-bottom: 10px;
        font-size: 0.95rem;
      }

      .question-card input {
        width: 100%;
        padding: 10px 12px;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        font-family: 'Outfit', sans-serif;
        font-size: 0.9rem;
      }

      .question-card input::placeholder {
        color: var(--muted);
      }
    </style>

    <script>
      // Kategorize sorular
      const questionCategories = [
        {
          category: "🎮 Hobilerin & İlgilerin",
          questions: [
            {
              id: "hobbies",
              text: "🎮 Hobilerin neler?",
              placeholder: "Müzik, oyun, spor, resim..."
            },
            {
              id: "nocreen",
              text: "📵 Ekranından uzakken ne yapıyorsun?",
              placeholder: "Dışarı çık, kitap oku, spor yap..."
            }
          ]
        },
        {
          category: "😊 Kişiliğin & Özelliklerin",
          questions: [
            {
              id: "personality",
              text: "😊 Kendini 3 kelimeyle tanımlayabilir misin?",
              placeholder: "Ör: Çalışkan, Komik, Sadık..."
            },
            {
              id: "music",
              text: "🎵 Sevdiğin müzik türü nedir?",
              placeholder: "Pop, Rap, Rock, Metal, Klasik..."
            }
          ]
        },
        {
          category: "🎯 Sentara Hedeflerin",
          questions: [
            {
              id: "goals",
              text: "🎯 Sentara'da ne yapmak istiyorsun?",
              placeholder: "Kariyer yap, eğlen, ağ kur..."
            }
          ]
        }
      ];

      // Tüm soruları düzleştir
      let allQuestions = [];
      questionCategories.forEach(cat => {
        allQuestions = allQuestions.concat(cat.questions);
      });

      let currentQuestion = 0;
      let answers = {};

      function loadQuestion() {
        const container = document.getElementById('questions-container');
        const q = allQuestions[currentQuestion];
        
        // Progress güncelle
        document.getElementById('progress-text').textContent = \`Soru \${currentQuestion + 1} / \${allQuestions.length}\`;
        
        // Kategori kontrolü - kategori değiştiğinde header göster
        let categoryIndex = 0;
        let questionIndex = 0;
        let counter = 0;
        for (let c = 0; c < questionCategories.length; c++) {
          if (counter + questionCategories[c].questions.length > currentQuestion) {
            categoryIndex = c;
            questionIndex = currentQuestion - counter;
            break;
          }
          counter += questionCategories[c].questions.length;
        }

        let categoryHeader = '';
        if (questionIndex === 0 || (currentQuestion > 0 && allQuestions[currentQuestion - 1].category !== q.category)) {
          categoryHeader = \`<div class="category-header">\${questionCategories[categoryIndex].category}</div>\`;
        }

        container.innerHTML = categoryHeader + \`
          <div class="question-card">
            <div class="emoji">\${q.text.split(' ')[0]}</div>
            <div class="text">\${q.text}</div>
            <input type="text" id="answer-input" placeholder="\${q.placeholder}" 
              value="\${answers[q.id] || ''}"
              onkeypress="if(event.key==='Enter') nextQuestion()">
          </div>
        \`;
        
        // Geri butonu kontrolü
        document.getElementById('prev-btn').style.display = currentQuestion > 0 ? 'block' : 'none';
        
        // İleri butonu metni
        const nextBtn = document.getElementById('next-btn');
        if (currentQuestion === allQuestions.length - 1) {
          nextBtn.innerHTML = '✅ Tamamla';
        } else {
          nextBtn.innerHTML = '➡️ Devam Et';
        }

        setTimeout(() => {
          document.getElementById('answer-input').focus();
        }, 100);
      }

      function nextQuestion() {
        const q = allQuestions[currentQuestion];
        const input = document.getElementById('answer-input');
        const answer = input.value.trim();
        
        if (!answer) {
          alert('Lütfen soruyu cevapla!');
          return;
        }

        answers[q.id] = answer;

        if (currentQuestion < allQuestions.length - 1) {
          currentQuestion++;
          loadQuestion();
        } else {
          showForm();
        }
      }

      function prevQuestion() {
        if (currentQuestion > 0) {
          const q = allQuestions[currentQuestion];
          const input = document.getElementById('answer-input');
          answers[q.id] = input.value.trim();
          
          currentQuestion--;
          loadQuestion();
        }
      }

      function showForm() {
        document.getElementById('questions-container').style.display = 'none';
        document.getElementById('form-container').style.display = 'flex';
        document.getElementById('button-area').innerHTML = \`
          <button onclick="goBack()" 
            style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-weight: 600; cursor: pointer;">
            ⬅️ Geri
          </button>
          <button onclick="submitBriefingForm()" 
            style="flex: 1; padding: 12px; background: var(--accent); border: none; border-radius: 10px; color: #000; font-weight: 600; cursor: pointer;">
            ✅ Gönder
          </button>
        \`;

        // Özet göster
        let summary = '';
        allQuestions.forEach((q, i) => {
          summary += \`<b>S\${i+1}:</b> \${q.text}\\n<b>C:</b> \${answers[q.id] || '(Boş)'}\\n\\n\`;
        });
        document.getElementById('answers-textarea').value = summary;
      }

      function goBack() {
        document.getElementById('form-container').style.display = 'none';
        document.getElementById('questions-container').style.display = 'flex';
        currentQuestion = allQuestions.length - 1;
        loadQuestion();
      }

      async function submitBriefingForm() {
        try {
          const response = await fetch('/api/briefing/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers })
          });
          
          const data = await response.json();
          
          if (data.success) {
            alert('✅ Formu gönderdin! Briefing sayfasına yönlendiriliyorsun...');
            window.location.href = '/briefing';
          } else {
            alert('❌ Hata: ' + (data.error || 'Bilinmeyen hata'));
          }
        } catch (err) {
          alert('❌ Bağlantı hatası: ' + err.message);
        }
      }

      // İlk soruyu yükle
      loadQuestion();
    </script>
  `;
  return _layout('Briefing Formu', user, content, '', '/briefing-form');
}

// ─────────────────────────────────────────────
// SENTARA SOCIAL PAGE
// ─────────────────────────────────────────────
function renderSocialPage(user) {
  const content = `
    <style>
      .social-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 1.5rem;
        align-items: start;
        margin-top: 1rem;
      }
      @media(max-width: 900px) {
        .social-layout {
          grid-template-columns: 1fr;
        }
      }
      
      /* Stories */
      .stories-wrapper {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 20px;
        padding: 1.2rem;
        margin-bottom: 1.5rem;
        backdrop-filter: blur(12px);
      }
      .stories-tray {
        display: flex;
        gap: 1rem;
        overflow-x: auto;
        padding: 0.2rem 0;
      }
      .stories-tray::-webkit-scrollbar {
        display: none;
      }
      .story-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        flex-shrink: 0;
        width: 76px;
      }
      .story-circle {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        padding: 3px;
        background: linear-gradient(135deg, #ff007f 0%, #7f00ff 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }
      .story-item:hover .story-circle {
        transform: scale(1.06);
      }
      .story-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #06060e;
      }
      .story-name {
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--muted);
        text-align: center;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .story-add-circle {
        background: rgba(255,255,255,0.06);
        border: 2px dashed rgba(255,255,255,0.2);
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: 300;
        color: var(--muted);
        transition: all 0.2s;
      }
      .story-item:hover .story-add-circle {
        border-color: var(--accent);
        color: var(--accent);
      }

      /* Feed cards */
      .post-card {
        margin-bottom: 1.5rem;
        position: relative;
        overflow: visible;
      }
      .post-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .post-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2px solid var(--border);
      }
      .post-author-info {
        flex: 1;
        min-width: 0;
        text-align: left;
      }
      .post-author-name {
        font-weight: 700;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .post-author-status {
        font-size: 0.72rem;
        color: var(--muted);
        background: rgba(255,255,255,0.03);
        padding: 1px 6px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.05);
        display: inline-block;
        margin-top: 0.2rem;
      }
      .post-meta {
        font-size: 0.72rem;
        color: var(--muted);
      }
      .post-body {
        font-size: 0.95rem;
        line-height: 1.6;
        color: var(--text);
        margin-bottom: 1.25rem;
        white-space: pre-wrap;
        word-break: break-word;
        text-align: left;
      }
      
      /* Repost nested card */
      .repost-card {
        background: rgba(255,255,255,0.015);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 12px;
        padding: 1rem;
        margin-top: 0.5rem;
        margin-bottom: 1rem;
      }

      .post-footer {
        display: flex;
        gap: 1.5rem;
        border-top: 1px solid rgba(255,255,255,0.06);
        padding-top: 0.85rem;
        margin-top: 0.5rem;
      }
      .post-action {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--muted);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        background: none;
        border: none;
        font-family: inherit;
        transition: color 0.2s, transform 0.1s;
      }
      .post-action:hover {
        color: var(--text);
      }
      .post-action.liked {
        color: var(--danger);
      }
      .post-action.liked svg {
        fill: var(--danger);
      }
      .post-action:active {
        transform: scale(0.92);
      }

      /* Comments section */
      .comments-area {
        background: rgba(0,0,0,0.15);
        border-radius: 12px;
        padding: 1rem;
        margin-top: 1rem;
        border: 1px solid rgba(255,255,255,0.03);
      }
      .comment-item {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
        text-align: left;
      }
      .comment-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .comment-content-box {
        flex: 1;
        min-width: 0;
      }
      .comment-bubble {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.04);
        border-radius: 12px;
        padding: 0.6rem 0.85rem;
      }
      .comment-author {
        font-weight: 700;
        font-size: 0.85rem;
        margin-bottom: 0.15rem;
      }
      .comment-text {
        font-size: 0.85rem;
        color: var(--text);
        line-height: 1.4;
      }
      .comment-meta-row {
        display: flex;
        gap: 0.75rem;
        font-size: 0.72rem;
        color: var(--muted);
        margin-top: 0.3rem;
        padding-left: 0.5rem;
      }
      .comment-action-btn {
        cursor: pointer;
        background: none;
        border: none;
        color: inherit;
        font-family: inherit;
        font-weight: 700;
      }
      .comment-action-btn:hover {
        color: var(--text);
      }

      /* Nested Replies */
      .replies-list {
        margin-left: 2rem;
        margin-top: 0.5rem;
        border-left: 2px solid rgba(255,255,255,0.05);
        padding-left: 0.75rem;
      }

      /* Write Comment inputs */
      .comment-input-row {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .comment-input {
        flex: 1;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px;
        color: #fff;
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;
        outline: none;
        margin-bottom: 0;
      }
      .comment-send-btn {
        background: var(--accent);
        border: none;
        color: #fff;
        border-radius: 10px;
        padding: 0 1rem;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
      }

      /* Status widget */
      .status-box {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 16px;
        padding: 1.2rem;
        margin-bottom: 1.5rem;
        backdrop-filter: blur(12px);
      }

      /* Live streams sidebar list */
      .streams-card {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 20px;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
        backdrop-filter: blur(12px);
      }
      .stream-list-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
        cursor: pointer;
        text-align: left;
      }
      .stream-list-item:last-child {
        border-bottom: none;
      }
      .stream-badge {
        background: var(--danger);
        color: white;
        font-size: 0.62rem;
        font-weight: 800;
        padding: 1px 5px;
        border-radius: 4px;
        text-transform: uppercase;
        animation: pulse 1.5s infinite;
      }
      .stream-title {
        font-weight: 600;
        font-size: 0.88rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Story Viewer Modal */
      .story-modal {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.92);
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
      }
      .story-viewer-content {
        width: 100%;
        max-width: 440px;
        height: 100%;
        max-height: 800px;
        position: relative;
        background: #000;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 1.5rem;
      }
      .story-progress-container {
        display: flex;
        gap: 4px;
        width: 100%;
        position: absolute;
        top: 10px;
        left: 0;
        padding: 0 10px;
      }
      .story-progress-bar {
        height: 3px;
        flex: 1;
        background: rgba(255,255,255,0.25);
        border-radius: 2px;
        overflow: hidden;
      }
      .story-progress-fill {
        height: 100%;
        width: 0%;
        background: #fff;
      }
      .story-viewer-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 1rem;
        color: #fff;
        z-index: 2;
      }
      .story-viewer-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 1px solid #fff;
      }
      .story-viewer-text {
        color: #fff;
        font-size: 1.3rem;
        font-weight: 600;
        text-align: center;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        word-break: break-word;
        line-height: 1.5;
        z-index: 2;
      }
      .story-viewer-close {
        position: absolute;
        top: 25px;
        right: 15px;
        color: #fff;
        font-size: 1.5rem;
        cursor: pointer;
        background: none;
        border: none;
        z-index: 3;
      }

      /* Live Stream Modal */
      .stream-modal {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.85);
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(12px);
      }
      .stream-window {
        width: 90%;
        max-width: 800px;
        height: 80%;
        max-height: 600px;
        background: #0f0f1a;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 24px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1fr 280px;
        box-shadow: 0 24px 50px rgba(0,0,0,0.6);
      }
      @media(max-width: 650px) {
        .stream-window {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr 180px;
        }
      }
      .stream-video-pane {
        background: linear-gradient(135deg, #1e1e30 0%, #0d0d1a 100%);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .stream-visualizer {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
        opacity: 0.15;
        animation: pulseVisualizer 2s infinite ease-in-out;
      }
      @keyframes pulseVisualizer {
        0%, 100% { transform: scale(1); opacity: 0.15; }
        50% { transform: scale(1.4); opacity: 0.3; }
      }
      .stream-video-overlay {
        position: absolute;
        inset: 0;
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        pointer-events: none;
      }
      .stream-chat-pane {
        border-left: 1px solid rgba(255,255,255,0.06);
        background: rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
      }
      .stream-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .stream-chat-msg {
        font-size: 0.8rem;
        line-height: 1.4;
        text-align: left;
      }
      .stream-chat-author {
        font-weight: 700;
        color: var(--accent);
        margin-right: 0.3rem;
      }
      .stream-chat-text {
        color: #fff;
      }
      .stream-chat-input-row {
        padding: 0.75rem;
        border-top: 1px solid rgba(255,255,255,0.06);
        display: flex;
        gap: 0.4rem;
      }

      /* Floating Hearts */
      .heart-emitter {
        position: absolute;
        bottom: 80px;
        right: 20px;
        width: 50px;
        height: 100px;
        pointer-events: none;
      }
      .float-heart {
        position: absolute;
        bottom: 0;
        font-size: 1.5rem;
        animation: heartFloatUp 2s ease-out forwards;
        opacity: 0.9;
      }
      @keyframes heartFloatUp {
        0% { transform: translateY(0) scale(0.6) rotate(0deg); opacity: 0.9; }
        50% { transform: translateY(-100px) scale(1.1) rotate(15deg); }
        100% { transform: translateY(-250px) scale(0.8) rotate(-15deg); opacity: 0; }
      }
    </style>

    <div class="social-layout">
      <!-- MAIN FEED COL -->
      <div>
        <!-- Stories Wrapper -->
        <div class="stories-wrapper">
          <div class="stories-tray" id="stories-tray">
            <!-- Add story item -->
            <div class="story-item" onclick="openCreateStory()">
              <div class="story-add-circle">+</div>
              <div class="story-name">Hikaye Ekle</div>
            </div>
            <!-- Stories lists injected dynamically -->
          </div>
        </div>

        <!-- Create Post Card -->
        <div class="card post-card" style="padding: 1.5rem;">
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1rem;text-align:left;">✍️ Bir şeyler paylaş...</h3>
          <textarea id="post-textarea" rows="3" placeholder="Bugün aklında ne var?" style="margin-bottom:0.75rem;resize:none;"></textarea>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button class="btn btn-sm" onclick="createPost()" id="post-btn">Paylaş</button>
          </div>
        </div>

        <!-- Feed List -->
        <div id="social-feed">
          <div style="color:var(--muted);font-size:0.9rem;padding:2rem;">Akış yükleniyor...</div>
        </div>
      </div>

      <!-- SIDEBAR COL -->
      <div>
        <!-- Status Widget -->
        <div class="status-box">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:0.8rem;text-align:left;">💬 Durumunu Ayarla</h3>
          <div style="display:flex;gap:0.4rem;">
            <input type="text" id="status-input" value="${_esc(user.customStatus || '')}" placeholder="Ne yapıyorsun?" style="margin-bottom:0;padding:0.6rem 0.85rem;font-size:0.85rem;">
            <button class="btn btn-sm" onclick="updateStatus()" style="padding:0 0.85rem;">Set</button>
          </div>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.6rem;justify-content:center;">
            <span style="cursor:pointer;font-size:1.1rem;background:rgba(255,255,255,0.03);padding:2px 6px;border-radius:6px;" onclick="setStatusEmoji('☕ Kahve içiyor')">☕</span>
            <span style="cursor:pointer;font-size:1.1rem;background:rgba(255,255,255,0.03);padding:2px 6px;border-radius:6px;" onclick="setStatusEmoji('🔥 Bilet çözüyor')">🔥</span>
            <span style="cursor:pointer;font-size:1.1rem;background:rgba(255,255,255,0.03);padding:2px 6px;border-radius:6px;" onclick="setStatusEmoji('💤 Dinleniyor')">💤</span>
            <span style="cursor:pointer;font-size:1.1rem;background:rgba(255,255,255,0.03);padding:2px 6px;border-radius:6px;" onclick="setStatusEmoji('💻 Kod yazıyor')">💻</span>
          </div>
        </div>

        <!-- Live Streams Card -->
        <div class="streams-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h3 style="font-size:1rem;font-weight:700;text-align:left;">🔴 Canlı Yayınlar</h3>
            <button class="btn btn-sm btn-danger" onclick="startStreamPrompt()" style="padding:0.3rem 0.6rem;font-size:0.75rem;">Yayın Aç</button>
          </div>
          <div id="streams-list">
            <div style="color:var(--muted);font-size:0.8rem;">Aktif yayın bulunmuyor.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Story Viewer Modal -->
    <div class="story-modal" id="story-modal" onclick="closeStory()">
      <div class="story-viewer-content" onclick="event.stopPropagation()">
        <div class="story-progress-container" id="story-progress-container"></div>
        <button class="story-viewer-close" onclick="closeStory()">✕</button>
        <div class="story-viewer-header">
          <img src="" class="story-viewer-avatar" id="story-viewer-avatar">
          <strong id="story-viewer-name"></strong>
        </div>
        <div class="story-viewer-text" id="story-viewer-text"></div>
        <div></div>
      </div>
    </div>

    <!-- Live Stream Modal -->
    <div class="stream-modal" id="stream-modal">
      <div class="stream-window">
        <!-- Video simulated screen -->
        <div class="stream-video-pane">
          <div class="stream-visualizer"></div>
          <div style="position:absolute;z-index:2;text-align:center;color:#fff;">
            <div style="font-size:3rem;margin-bottom:0.5rem;animation:float 3s ease-in-out infinite;">🎥</div>
            <h2 id="stream-pane-title" style="font-size:1.2rem;font-weight:800;"></h2>
            <div style="font-size:0.8rem;color:rgba(255,255,255,0.5);margin-top:0.4rem;">Canlı Video Akışı</div>
          </div>
          
          <div class="stream-video-overlay">
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
              <span class="live-badge">Live</span>
              <span style="background:rgba(0,0,0,0.5);padding:2px 8px;border-radius:8px;font-size:0.75rem;color:#fff;pointer-events:auto;" id="stream-viewer-count">👁️ 0</span>
            </div>
            
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;pointer-events:auto;">
              <button class="btn btn-sm btn-danger" onclick="endCurrentStream()" id="stream-end-btn" style="display:none;padding:0.4rem 0.8rem;">Yayını Kapat</button>
              <button class="btn btn-sm btn-ghost" onclick="closeStream()" style="padding:0.4rem 0.8rem;margin-left:auto;">Ayrıl</button>
            </div>
          </div>

          <!-- Hearts Emitter -->
          <div class="heart-emitter" id="heart-emitter"></div>
        </div>
        
        <!-- Chat Area -->
        <div class="stream-chat-pane">
          <div style="padding:0.85rem;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:700;font-size:0.85rem;text-align:left;">Sohbet</div>
          <div class="stream-chat-messages" id="stream-chat-messages"></div>
          <div class="stream-chat-input-row" style="position:relative;">
            <input type="text" id="stream-chat-input" placeholder="Sohbete katıl..." style="margin-bottom:0;padding:0.5rem 0.75rem;font-size:0.82rem;" onkeydown="if(event.key==='Enter')sendStreamChat()">
            <button class="btn btn-sm" onclick="sendStreamChat()" style="padding:0 0.75rem;">Gönder</button>
            <button onclick="emitHeart()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;padding:0 5px;transition:transform 0.1s;" onmousedown="this.style.transform='scale(1.3)'" onmouseup="this.style.transform='scale(1)'">❤️</button>
          </div>
        </div>
      </div>
    </div>

    <script>
      const MY_DISCORD_ID = ${JSON.stringify(user.discordId)};
      let currentFeed = [];
      let currentStories = [];
      let activeStream = null;
      let streamChatTimer = null;
      let currentStoryIndex = 0;
      let currentStoryGroup = null;
      let storyTimer = null;

      async function loadFeed() {
        try {
          const res = await fetch('/api/social/feed');
          const d = await res.json();
          if (d.success) {
            currentFeed = d.posts || [];
            currentStories = d.stories || [];
            renderFeed();
            renderStories();
          }
        } catch(e) {
          console.error("Feed error:", e);
        }
      }

      function renderStories() {
        const tray = document.getElementById('stories-tray');
        // Clear old list keep add button
        const items = tray.querySelectorAll('.story-item');
        for (let i = 1; i < items.length; i++) items[i].remove();

        currentStories.forEach((g, gIdx) => {
          const item = document.createElement('div');
          item.className = 'story-item';
          item.onclick = () => viewStoryGroup(gIdx);
          
          item.innerHTML = 
            '<div class="story-circle">' +
              '<img class="story-img" src="' + (g.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png') + '">' +
            '</div>' +
            '<div class="story-name">' + g.userName + '</div>';
          tray.appendChild(item);
        });
      }

      function viewStoryGroup(gIdx) {
        currentStoryGroup = currentStories[gIdx];
        currentStoryIndex = 0;
        showStory();
      }

      function showStory() {
        if (!currentStoryGroup || !currentStoryGroup.stories[currentStoryIndex]) {
          closeStory();
          return;
        }

        const story = currentStoryGroup.stories[currentStoryIndex];
        const modal = document.getElementById('story-modal');
        modal.style.display = 'flex';

        document.getElementById('story-viewer-avatar').src = currentStoryGroup.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
        document.getElementById('story-viewer-name').textContent = currentStoryGroup.userName;
        document.getElementById('story-viewer-text').textContent = story.content;

        // Build progress bars
        const progContainer = document.getElementById('story-progress-container');
        progContainer.innerHTML = '';
        currentStoryGroup.stories.forEach((s, idx) => {
          const bar = document.createElement('div');
          bar.className = 'story-progress-bar';
          const fill = document.createElement('div');
          fill.className = 'story-progress-fill';
          if (idx < currentStoryIndex) fill.style.width = '100%';
          bar.appendChild(fill);
          progContainer.appendChild(bar);
        });

        // Animate current bar
        if (storyTimer) clearInterval(storyTimer);
        const activeFill = progContainer.children[currentStoryIndex].firstElementChild;
        let pct = 0;
        storyTimer = setInterval(() => {
          pct += 2;
          activeFill.style.width = pct + '%';
          if (pct >= 100) {
            clearInterval(storyTimer);
            nextStory();
          }
        }, 80);
      }

      function nextStory() {
        currentStoryIndex++;
        if (currentStoryIndex >= currentStoryGroup.stories.length) {
          closeStory();
        } else {
          showStory();
        }
      }

      function closeStory() {
        if (storyTimer) clearInterval(storyTimer);
        document.getElementById('story-modal').style.display = 'none';
      }

      async function openCreateStory() {
        const text = prompt("Hikayenize yazmak istediğiniz metni girin:");
        if (!text) return;
        try {
          const res = await fetch('/api/social/stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
          });
          const d = await res.json();
          if (res.ok) {
            showToast("Hikaye eklendi!", "success");
            loadFeed();
          } else {
            showToast(d.error || "Hata", "error");
          }
        } catch {
          showToast("Bağlantı hatası", "error");
        }
      }

      async function createPost() {
        const el = document.getElementById('post-textarea');
        const content = el.value.trim();
        if (!content) return showToast("Gönderi içeriği yazmalısınız.", "warning");

        const btn = document.getElementById('post-btn');
        btn.disabled = true;
        try {
          const res = await fetch('/api/social/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          });
          const d = await res.json();
          if (res.ok) {
            showToast("Paylaşıldı!", "success");
            el.value = '';
            loadFeed();
          } else {
            showToast(d.error || "Hata", "error");
          }
        } catch {
          showToast("Bağlantı hatası", "error");
        } finally {
          btn.disabled = false;
        }
      }

      async function repost(postId) {
        if (!confirm("Bu gönderiyi kendi profilinizde yeniden paylaşmak istiyor musunuz?")) return;
        try {
          const res = await fetch('/api/social/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repostOf: postId })
          });
          const d = await res.json();
          if (res.ok) {
            showToast("Yeniden paylaşıldı (Repost)!", "success");
            loadFeed();
          } else {
            showToast(d.error || "Hata", "error");
          }
        } catch {
          showToast("Bağlantı hatası", "error");
        }
      }

      async function toggleLike(postId, el) {
        try {
          const res = await fetch('/api/social/posts/' + postId + '/like', { method: 'POST' });
          const d = await res.json();
          if (d.success) {
            const countSpan = el.querySelector('.like-count');
            countSpan.textContent = d.likesCount;
            if (d.liked) {
              el.classList.add('liked');
            } else {
              el.classList.remove('liked');
            }
          }
        } catch {}
      }

      function toggleComments(postId) {
        const box = document.getElementById('comments-box-' + postId);
        if (box.style.display === 'none') {
          box.style.display = 'block';
        } else {
          box.style.display = 'none';
        }
      }

      async function addComment(postId) {
        const input = document.getElementById('comment-input-' + postId);
        const content = input.value.trim();
        if (!content) return;

        try {
          const res = await fetch('/api/social/posts/' + postId + '/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          });
          const d = await res.json();
          if (res.ok) {
            input.value = '';
            loadFeed();
          }
        } catch {}
      }

      function showReplyInput(postId, commentId, authorName) {
        const input = document.getElementById('comment-input-' + postId);
        input.value = '@' + authorName + ' ';
        input.focus();
        // Change button action temporarily to nested reply
        const sendBtn = document.getElementById('comment-btn-' + postId);
        sendBtn.onclick = () => submitReply(postId, commentId, input);
      }

      async function submitReply(postId, commentId, input) {
        const content = input.value.trim();
        if (!content) return;
        try {
          const res = await fetch('/api/social/posts/' + postId + '/comments/' + commentId + '/replies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          });
          if (res.ok) {
            input.value = '';
            // Reset button action
            const sendBtn = document.getElementById('comment-btn-' + postId);
            sendBtn.onclick = () => addComment(postId);
            loadFeed();
          }
        } catch {}
      }

      function setStatusEmoji(val) {
        document.getElementById('status-input').value = val;
      }

      async function updateStatus() {
        const val = document.getElementById('status-input').value.trim();
        try {
          const res = await fetch('/api/social/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: val })
          });
          if (res.ok) {
            showToast("Durum güncellendi!", "success");
            loadFeed();
          }
        } catch {}
      }

      function renderFeed() {
        const list = document.getElementById('social-feed');
        if (!currentFeed.length) {
          list.innerHTML = '<div class="card" style="padding:2rem;color:var(--muted)">Henüz hiçbir gönderi paylaşılmamış.</div>';
          return;
        }

        list.innerHTML = currentFeed.map(p => {
          const rawDate = new Date(p.createdAt);
          const timeStr = rawDate.toLocaleDateString('tr-TR') + ' ' + rawDate.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
          
          let repostContentHtml = '';
          if (p.repostOf) {
            const orig = currentFeed.find(x => x._id === p.repostOf);
            if (orig) {
              repostContentHtml = 
                '<div class="repost-card">' +
                  '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;font-size:0.8rem;color:var(--muted);">' +
                    '<img src="' + (orig.authorAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png') + '" style="width:20px;height:20px;border-radius:50%;">' +
                    '<strong>' + (orig.authorUsername || orig.userName) + '</strong>' +
                  '</div>' +
                  '<div class="post-body" style="margin-bottom:0;font-size:0.88rem;">' + _esc(orig.content) + '</div>' +
                '</div>';
            } else {
              repostContentHtml = '<div class="repost-card" style="color:var(--muted);font-size:0.8rem;">[Gönderi silinmiş veya bulunamadı]</div>';
            }
          }

          const commentsHtml = (p.comments || []).map(c => {
            const repliesHtml = (c.replies || []).map(r => 
              '<div class="comment-item" style="margin-bottom: 0.5rem;">' +
                '<img src="' + (r.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png') + '" class="comment-avatar" style="width:24px;height:24px;">' +
                '<div class="comment-content-box">' +
                  '<div class="comment-bubble" style="padding: 0.4rem 0.6rem;">' +
                    '<div class="comment-author" style="font-size:0.8rem;">' + r.userName + '</div>' +
                    '<div class="comment-text" style="font-size:0.8rem;">' + _esc(r.content) + '</div>' +
                  '</div>' +
                '</div>' +
              '</div>'
            ).join('');

            return 
              '<div class="comment-item">' +
                '<img src="' + (c.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png') + '" class="comment-avatar">' +
                '<div class="comment-content-box">' +
                  '<div class="comment-bubble">' +
                    '<div class="comment-author">' + c.userName + '</div>' +
                    '<div class="comment-text">' + _esc(c.content) + '</div>' +
                  '</div>' +
                  '<div class="comment-meta-row">' +
                    '<button class="comment-action-btn" onclick="showReplyInput(\'' + p._id + '\', \'' + c.id + '\', \'' + c.userName + '\')">Yanıtla</button>' +
                  '</div>' +
                  '<div class="replies-list">' + repliesHtml + '</div>' +
                '</div>' +
              '</div>';
          }).join('');

          const isLiked = p.likes && p.likes.includes(MY_DISCORD_ID);

          return 
            '<div class="card post-card">' +
              (p.repostOf ? '<div style="font-size:0.75rem;color:var(--accent);font-weight:700;margin-bottom:0.5rem;text-align:left;">🔁 ' + p.repostedBy + ' Repost Etti</div>' : '') +
              '<div class="post-header">' +
                '<img src="' + (p.authorAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png') + '" class="post-avatar" style="border-color:' + p.authorColor + '">' +
                '<div class="post-author-info">' +
                  '<div class="post-author-name">' +
                    (p.authorUsername || p.userName) +
                    (p.authorStatus ? '<span class="post-author-status">' + _esc(p.authorStatus) + '</span>' : '') +
                  '</div>' +
                  '<div class="post-meta">' + timeStr + '</div>' +
                '</div>' +
              '</div>' +

              (p.repostOf ? repostContentHtml : '<div class="post-body">' + _esc(p.content) + '</div>') +

              '<div class="post-footer">' +
                '<button class="post-action ' + (isLiked ? 'liked' : '') + '" onclick="toggleLike(\'' + p._id + '\', this)">' +
                  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>' +
                  '<span class="like-count">' + (p.likes || []).length + '</span>' +
                '</button>' +
                '<button class="post-action" onclick="toggleComments(\'' + p._id + '\')">' +
                  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
                  '<span>' + (p.comments || []).length + '</span>' +
                '</button>' +
                (!p.repostOf ? 
                  '<button class="post-action" onclick="repost(\'' + p._id + '\')">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1v22M3 5h18M3 19h18"/></svg>' +
                    '<span>Yeniden Paylaş</span>' +
                  '</button>'
                 : '') +
              '</div>' +

              '<!-- Collapsible Comments Area -->' +
              '<div class="comments-area" id="comments-box-' + p._id + '" style="display:none;">' +
                '<div class="comment-list">' + commentsHtml + '</div>' +
                '<div class="comment-input-row">' +
                  '<input type="text" class="comment-input" id="comment-input-' + p._id + '" placeholder="Yorum yaz..." onkeydown="if(event.key===\'Enter\')addComment(\'' + p._id + '\')">' +
                  '<button class="comment-send-btn" id="comment-btn-' + p._id + '" onclick="addComment(\'' + p._id + '\')">Gönder</button>' +
                '</div>' +
              '</div>' +
            '</div>';
        }).join('');
      }

      // Streams functionality
      async function loadStreams() {
        try {
          const res = await fetch('/api/social/streams');
          const d = await res.json();
          if (d.success) {
            const list = document.getElementById('streams-list');
            if (!d.streams || !d.streams.length) {
              list.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;padding:0.5rem 0;">Aktif yayın bulunmuyor.</div>';
            } else {
              list.innerHTML = d.streams.map(s => 
                '<div class="stream-list-item" onclick="joinStream(\'' + s._id + '\')">' +
                  '<img src="' + (s.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png') + '" style="width:32px;height:32px;border-radius:50%;">' +
                  '<div style="flex:1;min-width:0;">' +
                    '<div class="stream-title">' + s.title + '</div>' +
                    '<div style="font-size:0.7rem;color:var(--muted)">Yayıncı: ' + s.userName + '</div>' +
                  '</div>' +
                  '<span class="stream-badge">LIVE</span>' +
                '</div>'
              ).join('');
            }
          }
        } catch(e) {}
      }

      async function startStreamPrompt() {
        const title = prompt("Canlı yayın başlığını girin:");
        if (!title) return;
        try {
          const res = await fetch('/api/social/streams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          });
          const d = await res.json();
          if (res.ok) {
            showToast("Canlı yayın başlatıldı!", "success");
            joinStream(d.stream._id);
            loadStreams();
          } else {
            showToast(d.error || "Hata", "error");
          }
        } catch {
          showToast("Bağlantı hatası", "error");
        }
      }

      async function joinStream(streamId) {
        try {
          const res = await fetch('/api/social/streams');
          const d = await res.json();
          if (d.success) {
            const stream = d.streams.find(s => s._id === streamId);
            if (!stream) return showToast("Yayın sona ermiş.", "error");

            activeStream = stream;
            document.getElementById('stream-modal').style.display = 'flex';
            document.getElementById('stream-pane-title').textContent = stream.title;
            document.getElementById('stream-viewer-count').textContent = '👁️ ' + (stream.viewerCount || 1);
            
            // Show End Stream button if owner
            const isOwner = stream.userId === MY_DISCORD_ID;
            document.getElementById('stream-end-btn').style.display = isOwner ? 'block' : 'none';

            // Load chat history
            renderStreamChat();

            // Set chat refresh loop
            if (streamChatTimer) clearInterval(streamChatTimer);
            streamChatTimer = setInterval(refreshStreamData, 3000);
          }
        } catch {}
      }

      async function refreshStreamData() {
        if (!activeStream) return;
        try {
          const res = await fetch('/api/social/streams');
          const d = await res.json();
          if (d.success) {
            const stream = d.streams.find(s => s._id === activeStream._id);
            if (!stream) {
              showToast("Yayın sahibi yayını kapattı.", "info");
              closeStream();
              return;
            }
            activeStream = stream;
            document.getElementById('stream-viewer-count').textContent = '👁️ ' + (stream.viewerCount || 1);
            renderStreamChat();
          }
        } catch {}
      }

      function renderStreamChat() {
        if (!activeStream) return;
        const box = document.getElementById('stream-chat-messages');
        const msgs = activeStream.chatMessages || [];
        box.innerHTML = msgs.map(m => 
          '<div class="stream-chat-msg">' +
            '<span class="stream-chat-author">' + m.userName + ':</span>' +
            '<span class="stream-chat-text">' + _esc(m.content) + '</span>' +
          '</div>'
        ).join('');
        box.scrollTop = box.scrollHeight;
      }

      async function sendStreamChat() {
        if (!activeStream) return;
        const input = document.getElementById('stream-chat-input');
        const content = input.value.trim();
        if (!content) return;

        try {
          const res = await fetch('/api/social/streams/' + activeStream._id + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          });
          const d = await res.json();
          if (res.ok) {
            input.value = '';
            activeStream = d.stream;
            renderStreamChat();
          }
        } catch {}
      }

      async function endCurrentStream() {
        if (!activeStream) return;
        if (!confirm("Yayını sonlandırmak istediğinize emin misiniz?")) return;

        try {
          const res = await fetch('/api/social/streams/' + activeStream._id + '/end', { method: 'POST' });
          if (res.ok) {
            showToast("Yayın sonlandırıldı.", "info");
            closeStream();
            loadStreams();
          }
        } catch {}
      }

      function closeStream() {
        activeStream = null;
        if (streamChatTimer) clearInterval(streamChatTimer);
        document.getElementById('stream-modal').style.display = 'none';
      }

      function emitHeart() {
        const emitter = document.getElementById('heart-emitter');
        const heart = document.createElement('div');
        heart.className = 'float-heart';
        const hearts = ['❤️', '💖', '💝', '💕', '🧡', '💛', '💚', '💙', '💜'];
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.floor(Math.random() * 20) + 'px';
        emitter.appendChild(heart);
        setTimeout(() => heart.remove(), 2000);
      }

      // Initial loads
      loadFeed();
      loadStreams();

      // Refresh streams list every 10 seconds
      setInterval(loadStreams, 10000);
    </script>
  `;
  return _layout('Sentara Sosyal', user, content, '', '/social');
}

// ─────────────────────────────────────────────
// SETTINGS PAGE
// ─────────────────────────────────────────────
function renderSettingsPage(user, query = {}) {
  const isSetupPin = query.setupPin === '1' || !user.sitePinPassword;
  const hasPin = Boolean(user.sitePinPassword);
  const pinLength = user.pinLength || 6;
  const is2FA = Boolean(user.twoFactorEnabled);
  const twoFactorMethod = user.twoFactorMethod || 'discord_dm';

  const content = `
    <div style="max-width:900px; margin:2rem auto; animation:fadeUp 0.5s ease;">
      <!-- Title Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div style="color:var(--muted); font-size:0.88rem; text-transform:uppercase; letter-spacing:1px; font-weight:700;">HESAP YÖNETİMİ</div>
          <h1 style="font-size:2.4rem; font-weight:800; background:linear-gradient(135deg, #fff, #fda4af); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Hesap Ayarları & Güvenlik</h1>
        </div>
        <a href="/dashboard" class="btn btn-sm btn-ghost" style="border-color:rgba(255,255,255,0.15);">← Dashboard'a Dön</a>
      </div>

      ${isSetupPin ? `
      <div style="background:rgba(244,63,94,0.12); border:1px solid rgba(244,63,94,0.4); border-radius:20px; padding:1.5rem 2rem; margin-bottom:2rem; backdrop-filter:blur(16px); box-shadow:0 10px 30px rgba(244,63,94,0.2);">
        <div style="display:flex; align-items:center; gap:1rem;">
          <span style="font-size:2rem;">🔑</span>
          <div>
            <div style="font-size:1.2rem; font-weight:800; color:#fff;">Site Şifresi (PIN) Tanımlamanız Gerekiyor</div>
            <div style="font-size:0.92rem; color:var(--muted); margin-top:0.25rem;">
              Hesap güvenliğiniz için lütfen aşağıdan 4 veya 6 haneli bir Site PIN Şifresi belirleyin.
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Settings Cards -->
      <div style="display:grid; grid-template-columns:1fr; gap:2rem;">
        
        <!-- CARD 1: SITE PIN PASSWORD -->
        <div class="card" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:2rem; backdrop-filter:blur(20px);">
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
            <div style="width:48px; height:48px; border-radius:16px; background:rgba(244,63,94,0.15); border:1px solid rgba(244,63,94,0.3); display:flex; align-items:center; justify-content:center; font-size:1.4rem;">🔑</div>
            <div>
              <h3 style="font-size:1.3rem; font-weight:700;">Site PIN / Şifresi</h3>
              <p style="font-size:0.88rem; color:var(--muted);">Giriş yaparken veya hassas işlemlerde kullanılan şifreniz</p>
            </div>
          </div>

          <div style="background:rgba(0,0,0,0.2); padding:1.2rem; border-radius:16px; border:1px solid rgba(255,255,255,0.05); margin-bottom:1.5rem;">
            <div style="font-size:0.9rem; color:var(--muted); margin-bottom:0.4rem;">Mevcut Şifre Durumu:</div>
            <div style="font-weight:700; color:${hasPin ? 'var(--success)' : 'var(--danger)'};">
              ${hasPin ? `✅ Şifre Aktif (${pinLength} Haneli PIN)` : '⚠️ Şifre Belirlenmemiş'}
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:1rem; max-width:420px;">
            <div>
              <label style="font-size:0.88rem; color:var(--muted); font-weight:600; margin-bottom:0.4rem; display:block;">Yeni PIN Şifresi (4 veya 6 Haneli Rakam)</label>
              <input type="password" id="settingsPinInput" class="input-field" placeholder="Örn: 123456" maxlength="6" style="font-size:1.2rem; letter-spacing:0.3rem;">
            </div>
            <button onclick="updateSitePin()" class="btn btn-primary" style="background:linear-gradient(135deg, #f43f5e, #e11d48); font-weight:700;">
              💾 Şifreyi Kaydet
            </button>
          </div>
        </div>

        <!-- CARD 2: 2FA SECURITY -->
        <div class="card" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:2rem; backdrop-filter:blur(20px);">
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
            <div style="width:48px; height:48px; border-radius:16px; background:rgba(88,101,242,0.15); border:1px solid rgba(88,101,242,0.3); display:flex; align-items:center; justify-content:center; font-size:1.4rem;">🛡️</div>
            <div>
              <h3 style="font-size:1.3rem; font-weight:700;">2 Aşamalı Doğrulama (2FA)</h3>
              <p style="font-size:0.88rem; color:var(--muted);">Hesabınıza ekstra güvenlik katmanı ekleyin</p>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; background:rgba(0,0,0,0.2); padding:1.2rem; border-radius:16px;">
            <input type="checkbox" id="toggle2FA" ${is2FA ? 'checked' : ''} style="width:20px; height:20px; accent-color:#f43f5e; cursor:pointer;">
            <label for="toggle2FA" style="font-weight:700; cursor:pointer;">2 Aşamalı Doğrulamayı Aktif Et</label>
          </div>

          <div style="margin-bottom:1.5rem; max-width:420px;">
            <label style="font-size:0.88rem; color:var(--muted); font-weight:600; margin-bottom:0.4rem; display:block;">2FA Doğrulama Yöntemi</label>
            <select id="select2FAMethod" class="input-field" style="background:#0a0a14; color:#fff;">
              <option value="discord_dm" ${twoFactorMethod === 'discord_dm' ? 'selected' : ''}>📩 Discord DM 6 Haneli Kod ile</option>
              <option value="roblox_oauth" ${twoFactorMethod === 'roblox_oauth' ? 'selected' : ''}>🌐 Roblox OAuth Doğrulaması ile</option>
            </select>
          </div>

          <button onclick="update2FASettings()" class="btn btn-primary" style="max-width:420px; background:linear-gradient(135deg, #5865F2, #4752C4); font-weight:700;">
            🛡️ 2FA Ayarlarını Kaydet
          </button>
        </div>

        <!-- CARD 3: ACCOUNT CONNECTIONS -->
        <div class="card" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:2rem; backdrop-filter:blur(20px);">
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem;">
            <div style="width:48px; height:48px; border-radius:16px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; font-size:1.4rem;">🔗</div>
            <div>
              <h3 style="font-size:1.3rem; font-weight:700;">Hesap Bağlantıları</h3>
              <p style="font-size:0.88rem; color:var(--muted);">Discord ve Roblox hesap entegrasyonlarınız</p>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem;">
            <!-- Roblox -->
            <div style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.06); padding:1.5rem; border-radius:18px;">
              <div style="font-size:0.85rem; color:var(--muted); margin-bottom:0.4rem;">Roblox Hesabı:</div>
              <div style="font-size:1.1rem; font-weight:700; margin-bottom:1rem;">
                ${user.robloxUsername ? `🎮 ${_esc(user.robloxUsername)}` : '❌ Bağlı Değil'}
              </div>
              <a href="/auth/roblox" class="btn btn-sm btn-ghost" style="border-color:rgba(255,255,255,0.15); text-decoration:none;">
                🔄 Roblox Hesabımı Değiştir / Eşle
              </a>
            </div>

            <!-- Discord -->
            <div style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.06); padding:1.5rem; border-radius:18px;">
              <div style="font-size:0.85rem; color:var(--muted); margin-bottom:0.4rem;">Discord Hesabı:</div>
              <div style="font-size:1.1rem; font-weight:700; margin-bottom:1rem;">
                💬 ${_esc(user.discordUsername || 'Bağlı')}
              </div>
              <a href="/auth/discord" class="btn btn-sm btn-ghost" style="border-color:rgba(255,255,255,0.15); text-decoration:none;">
                🔄 Discord Hesabımı Değiştir
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>

    <script>
      async function updateSitePin() {
        const pin = document.getElementById('settingsPinInput').value.trim();
        if (!pin || (pin.length !== 4 && pin.length !== 6) || !/^\\d+$/.test(pin)) {
          return alert('Lütfen 4 veya 6 haneli sadece rakamlardan oluşan bir PIN girin.');
        }

        try {
          const res = await fetch('/api/settings/update-pin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ pin })
          });
          const data = await res.json();
          if (data.success) {
            alert(data.message || 'PIN başarıyla güncellendi!');
            window.location.href = '/settings';
          } else {
            alert('Hata: ' + (data.error || 'Güncellenemedi.'));
          }
        } catch (e) {
          alert('Sunucu hatası.');
        }
      }

      async function update2FASettings() {
        const enabled = document.getElementById('toggle2FA').checked;
        const method = document.getElementById('select2FAMethod').value;

        try {
          const res = await fetch('/api/settings/update-2fa', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ enabled, method })
          });
          const data = await res.json();
          if (data.success) {
            alert(data.message || '2FA ayarları kaydedildi!');
          } else {
            alert('Hata: ' + (data.error || 'Güncellenemedi.'));
          }
        } catch (e) {
          alert('Sunucu hatası.');
        }
      }
    </script>
  `;

  return _layout('Hesap Ayarları & Güvenlik', user, content, '', '/settings');
}

// ─────────────────────────────────────────────
// ACCOUNT TRANSFER PAGE (MODERATOR)
// ─────────────────────────────────────────────
async function renderAccountTransferPage(user, staffProgress) {
  // Bu sayfa zaten EJS template olarak oluşturuldu
  // Bu fonksiyon sadece uyumluluk için
  return null;
}

// ─────────────────────────────────────────────
// USER LOGS PAGE & ADMIN USER IMPROVEMENTS
// ─────────────────────────────────────────────
function renderUserLogsPage(currentUser, targetUser, trustRecord, webLogs = [], extraLogs = {}) {
  const username = targetUser?.discordUsername || targetUser?.username || trustRecord?.username || "Bilinmeyen Kullanıcı";
  const avatar = targetUser?.discordAvatar || "https://cdn.discordapp.com/embed/avatars/0.png";
  const discordId = targetUser?.discordId || trustRecord?.userId || "Bilinmiyor";
  const robloxName = targetUser?.robloxUsername || "Bağlı Değil";
  const trustScore = trustRecord ? trustRecord.trustScore.toFixed(1) : "100.0";
  const scoreLogs = trustRecord?.scoreLogs || [];

  const combinedLogs = [];

  // 1. Güven Puanı Hareketi
  scoreLogs.forEach(l => {
    combinedLogs.push({
      type: "TRUST",
      icon: "⭐",
      title: "Güven Puanı Hareketi",
      description: `${l.amount >= 0 ? '+' : ''}${l.amount.toFixed(1)} TS — ${_esc(l.reason || 'Sistem Güncellemesi')}`,
      amount: l.amount,
      operator: l.operatorId || 'SYSTEM',
      timestamp: new Date(l.timestamp).getTime(),
      dateStr: new Date(l.timestamp).toLocaleString("tr-TR")
    });
  });

  // 2. Discord Aktivite Logları (Komut Kullanımı & Moderasyon — Web Girişleri ve IP/Ülke kaldırıldı)
  webLogs.forEach(w => {
    const actType = w.activityType;
    if (actType === "login" || actType === "page_view") return; // Web girişleri gösterilmez

    let title = "📌 Discord Aktivitesi";
    let type = "DISCORD";
    let icon = "💬";
    let desc = "Sistem Aktivitesi";

    if (actType === "command") {
      title = "💬 Discord Komut Kullanımı";
      type = "DISCORD";
      icon = "💬";
      desc = `Komut: /${_esc(w.details?.commandName || w.details?.command || 'komut')} ${w.details?.channelName ? '(# ' + _esc(w.details.channelName) + ')' : ''}`;
    } else if (actType === "profile_update") {
      title = "⚙️ Profil Güncellemesi";
      type = "DISCORD";
      icon = "⚙️";
      desc = "Kullanıcı profil ayarlarını güncelledi";
    } else if (actType === "mod_action") {
      title = "⚖️ Moderatör İşlemi";
      type = "DISCORD";
      icon = "⚖️";
      desc = _esc(w.details?.action || w.details?.reason || "Moderatör işlemi yapıldı");
    } else {
      desc = _esc(w.details?.action || w.details?.reason || "Aktivite kaydı");
    }

    combinedLogs.push({
      type,
      icon,
      title,
      description: desc,
      amount: 0,
      operator: "DISCORD_BOT",
      timestamp: new Date(w.timestamp).getTime(),
      dateStr: new Date(w.timestamp).toLocaleString("tr-TR")
    });
  });

  // 3. Destek Talepleri (Ticket) Logları
  if (extraLogs.tickets && Array.isArray(extraLogs.tickets)) {
    extraLogs.tickets.forEach(t => {
      combinedLogs.push({
        type: "TICKET",
        icon: "🎫",
        title: `🎫 Destek Talebi: #${_esc(t.ticketId || t.channelName || 'ticket')}`,
        description: `Kategori: ${_esc(t.category || 'Genel')} | Durum: ${t.status === 'closed' ? '🔒 Kapalı' : '🟢 Açık'}`,
        amount: 0,
        operator: "DISCORD_TICKET",
        timestamp: new Date(t.createdAt || Date.now()).getTime(),
        dateStr: new Date(t.createdAt || Date.now()).toLocaleString("tr-TR")
      });
    });
  }

  // 4. Mahkeme & Soruşturma Logları
  if (extraLogs.courtCases && Array.isArray(extraLogs.courtCases)) {
    extraLogs.courtCases.forEach(c => {
      combinedLogs.push({
        type: "DISCORD",
        icon: "🏛️",
        title: `🏛️ Mahkeme Dosyası: #${_esc(c.caseId || c.caseCode || 'dava')}`,
        description: `Sebep: ${_esc(c.reason || 'Dava')} | Durum: ${_esc(c.status || 'Aktif')}`,
        amount: 0,
        operator: "DISCORD_COURT",
        timestamp: new Date(c.createdAt || Date.now()).getTime(),
        dateStr: new Date(c.createdAt || Date.now()).toLocaleString("tr-TR")
      });
    });
  }

  // 5. Personel İzin Kayıtları
  if (extraLogs.leaves && Array.isArray(extraLogs.leaves)) {
    extraLogs.leaves.forEach(lev => {
      combinedLogs.push({
        type: "LEAVE",
        icon: "🏖️",
        title: `🏖️ Personel İzin Talebi`,
        description: `Süre: ${lev.durationDays || 1} gün | Nedeni: ${_esc(lev.reason || '-')} | Durum: ${lev.status === 'APPROVED' ? '✅ Onaylandı' : lev.status === 'REJECTED' ? '❌ Reddedildi' : '⏳ Bekliyor'}`,
        amount: 0,
        operator: lev.approvedBy ? `ONAY: ${lev.approvedBy}` : 'PERSONEL_FORM',
        timestamp: new Date(lev.createdAt || Date.now()).getTime(),
        dateStr: new Date(lev.createdAt || Date.now()).toLocaleString("tr-TR")
      });
    });
  }

  combinedLogs.sort((a, b) => b.timestamp - a.timestamp);

  const content = `
    <div style="max-width:1100px; margin:2rem auto; animation:fadeUp 0.5s ease;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div style="color:var(--muted); font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:1px;">KULLANICI AKTİVİTE & LOG İNCELEME</div>
          <h1 style="font-size:2.2rem; font-weight:800; color:#fff;">${_esc(username)} — Tüm İncelemeler</h1>
        </div>
        <a href="/admin" class="btn btn-sm btn-ghost">← Admin Paneline Dön</a>
      </div>

      <!-- USER HEADER CARD -->
      <div class="card" style="background:rgba(255,255,255,0.035); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:2rem; backdrop-filter:blur(24px); margin-bottom:2rem;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1.5rem;">
          <div style="display:flex; align-items:center; gap:1.5rem;">
            <img src="${avatar}" style="width:76px; height:76px; border-radius:50%; border:3px solid var(--accent); box-shadow:0 8px 25px rgba(167,139,250,0.3);">
            <div>
              <h2 style="font-size:1.8rem; font-weight:800; color:#fff; margin-bottom:0.3rem;">${_esc(username)}</h2>
              <div style="display:flex; gap:1rem; flex-wrap:wrap; font-size:0.88rem; color:var(--muted);">
                <span>🆔 Discord ID: <code style="color:var(--text);">${discordId}</code></span>
                <span>🎮 Roblox: <strong style="color:var(--accent2);">${_esc(robloxName)}</strong></span>
              </div>
            </div>
          </div>
          
          <div style="background:rgba(167,139,250,0.1); border:1px solid rgba(167,139,250,0.3); border-radius:18px; padding:1rem 1.5rem; text-align:center;">
            <div style="font-size:0.8rem; color:var(--muted); text-transform:uppercase; font-weight:700; letter-spacing:1px;">GÜVEN PUANI</div>
            <div style="font-size:2.2rem; font-weight:800; color:${parseFloat(trustScore) >= 100 ? '#34d399' : parseFloat(trustScore) < 50 ? '#fb7185' : '#fbbf24'};">
              ⭐ ${trustScore} <span style="font-size:1rem; color:var(--muted);">/ 500</span>
            </div>
          </div>
        </div>
      </div>

      <!-- LOG FILTER & SEARCH BAR -->
      <div class="card" style="margin-bottom:1.5rem; padding:1.2rem 1.5rem; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:1rem;">
        <div style="flex:1; min-width:280px;">
          <input type="text" id="log-search" class="input-field" style="margin-bottom:0;" oninput="filterLogsTimeline()" placeholder="🔍 Loglar içinde canlı ara (Sebep, İşlem, Komut, Tarih, Yetkili)...">
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-sm" onclick="setLogCategory('ALL')" style="background:rgba(255,255,255,0.1);">Tüm Loglar</button>
          <button class="btn btn-sm" onclick="setLogCategory('TRUST')" style="background:rgba(241,196,15,0.15); color:#f1c40f;">⭐ Güven Puanı</button>
          <button class="btn btn-sm" onclick="setLogCategory('DISCORD')" style="background:rgba(155,89,182,0.15); color:#9b59b6;">💬 Discord Logları</button>
          <button class="btn btn-sm" onclick="setLogCategory('TICKET')" style="background:rgba(46,204,113,0.15); color:#2ecc71;">🎫 Destek Talepleri</button>
          <button class="btn btn-sm" onclick="setLogCategory('LEAVE')" style="background:rgba(52,152,219,0.15); color:#3498db;">🏖️ İzin Kayıtları</button>
        </div>
      </div>

      <!-- LOG TIMELINE -->
      <div id="log-timeline-container" style="display:flex; flex-direction:column; gap:0.8rem;">
        ${combinedLogs.length > 0 ? combinedLogs.map(l => `
          <div class="log-card-item" data-type="${l.type}" data-text="${_esc((l.title + ' ' + l.description + ' ' + l.operator + ' ' + l.dateStr).toLowerCase())}" style="background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:1.2rem 1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; backdrop-filter:blur(12px);">
            <div style="display:flex; align-items:center; gap:1rem;">
              <div style="font-size:1.6rem; width:44px; height:44px; border-radius:14px; background:rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center;">
                ${l.icon || '📌'}
              </div>
              <div>
                <div style="font-weight:700; font-size:1rem; color:#fff;">${_esc(l.title)}</div>
                <div style="font-size:0.88rem; color:var(--muted); margin-top:0.2rem;">${l.description}</div>
              </div>
            </div>

            <div style="text-align:right;">
              <div style="font-size:0.82rem; color:var(--muted);">${l.dateStr}</div>
              <div style="font-size:0.78rem; color:var(--accent2); margin-top:0.2rem;">Yetkili/Kaynak: <code>${_esc(l.operator)}</code></div>
            </div>
          </div>
        `).join('') : '<div class="card" style="text-align:center; padding:3rem; color:var(--muted);">Kullanıcıya ait kaydedilmiş log işlemi bulunamadı.</div>'}
      </div>

    </div>

    <script>
      let currentCategory = 'ALL';

      function setLogCategory(cat) {
        currentCategory = cat;
        filterLogsTimeline();
      }

      function filterLogsTimeline() {
        const query = (document.getElementById('log-search')?.value || '').toLowerCase().trim();
        const items = document.querySelectorAll('.log-card-item');

        items.forEach(item => {
          const type = item.getAttribute('data-type');
          const text = item.getAttribute('data-text') || '';

          const matchesCat = (currentCategory === 'ALL' || type === currentCategory);
          const matchesQuery = !query || text.includes(query);

          if (matchesCat && matchesQuery) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      }
    </script>
  `;

  return _layout(`Log Geçmişi — ${username}`, currentUser, content, '', '/admin');
}



// ─────────────────────────────────────────────
// APPLICATION FORMS HUB & EVENT STAFF FORM VIEWS
// ─────────────────────────────────────────────

function renderFormsHubPage(currentUser) {
  const content = `
    <div style="max-width:900px; margin:2rem auto; animation:fadeUp 0.5s ease;">
      
      <!-- HERO HEADER CARD -->
      <div class="card" style="background:linear-gradient(135deg, rgba(20,20,35,0.8), rgba(10,10,20,0.9)); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:2.5rem; text-align:center; position:relative; overflow:hidden; backdrop-filter:blur(24px); box-shadow:0 15px 40px rgba(0,0,0,0.4);">
        <div style="position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg, #34d399, #818cf8, #a78bfa);"></div>

        <div style="display:inline-flex; align-items:center; justify-content:center; gap:1rem; margin-bottom:1.5rem;">
          <div style="width:4px; height:48px; background:linear-gradient(to bottom, #a78bfa, #818cf8); border-radius:2px;"></div>
          <h1 style="font-size:2.4rem; font-weight:800; color:#fff; letter-spacing:1px; margin:0;">Yetkili Formları</h1>
          <div style="width:4px; height:48px; background:linear-gradient(to bottom, #818cf8, #a78bfa); border-radius:2px;"></div>
        </div>

        <h2 style="font-size:1.4rem; font-weight:700; color:var(--accent); margin-bottom:2rem; opacity:0.9;">
          EkoYıldız Yetkili Ekibi Başvuruları
        </h2>

        <!-- BANNER IMAGE -->
        <div style="width:100%; border-radius:16px; overflow:hidden; margin-bottom:1.5rem; box-shadow:0 8px 24px rgba(0,0,0,0.4);">
          <img src="https://i.imgur.com/bSVh4Rl.png" style="width:100%; display:block; max-height:220px; object-fit:cover; object-position:center top;">
        </div>

        <!-- APPLICATION STATUS LIST CARD -->
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:2rem; text-align:left; font-size:1.05rem; line-height:2.2;">

          <!-- 1. DISCORD MODERASYON -->
          <div style="margin-bottom:1.5rem; padding-bottom:1.2rem; border-bottom:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; align-items:center; gap:0.6rem; font-weight:700; color:#fff;">
              <img src="https://cdn.discordapp.com/emojis/1535974297829642301.png" style="height:22px; width:22px; object-fit:contain;">
              <span>[ Discord Moderasyon Takımı ]</span>
              <span style="color:var(--muted); font-size:0.9rem; font-weight:400;">başvuru formu için tıklayın.</span>
            </div>
            <div style="margin-left:2rem; font-size:0.9rem; color:var(--muted); display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem;">
              <span>◦ Başvuru durumu:</span>
              <div style="display:inline-flex; align-items:center; gap:0;">
                <img src="https://cdn.discordapp.com/emojis/1535973581995909170.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973580343611442.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973578816880690.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973577042567178.png" style="height:24px; display:block;">
              </div>
            </div>
          </div>

          <!-- 2. OYUN MODERASYON -->
          <div style="margin-bottom:1.5rem; padding-bottom:1.2rem; border-bottom:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; align-items:center; gap:0.6rem; font-weight:700; color:#fff;">
              <span style="font-size:1.2rem;">🗡️</span>
              <span>[ Oyun Moderasyon Takımı ]</span>
              <span style="color:var(--muted); font-size:0.9rem; font-weight:400;">başvuru formu için tıklayın.</span>
            </div>
            <div style="margin-left:2rem; font-size:0.9rem; color:var(--muted); display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem;">
              <span>◦ Başvuru durumu:</span>
              <div style="display:inline-flex; align-items:center; gap:0;">
                <img src="https://cdn.discordapp.com/emojis/1535973581995909170.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973580343611442.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973578816880690.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973577042567178.png" style="height:24px; display:block;">
              </div>
            </div>
          </div>

          <!-- 3. ETKİNLİK YETKİLİSİ (AÇIK) -->
          <div style="margin-bottom:1.5rem; padding-bottom:1.2rem; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(52,211,153,0.03); border-radius:12px; padding:1rem;">
            <div style="display:flex; align-items:center; gap:0.6rem; font-weight:700; color:#fff; flex-wrap:wrap;">
              <img src="https://cdn.discordapp.com/emojis/1535974991382978641.png" style="height:22px; width:22px; object-fit:contain;">
              <a href="/forms/event-staff" style="color:#34d399; text-decoration:underline; font-weight:800; font-size:1.1rem;">[ Etkinlik Yetkilisi ]</a>
              <span style="color:var(--text); font-size:0.9rem; font-weight:600;">başvuru formu için <a href="/forms/event-staff" style="color:#34d399; text-decoration:underline;">tıklayın</a>.</span>
            </div>
            <div style="margin-left:2rem; font-size:0.9rem; color:var(--muted); display:flex; align-items:center; gap:0.5rem; margin-top:0.4rem;">
              <span>◦ Başvuru durumu:</span>
              <div style="display:inline-flex; align-items:center; gap:0;">
                <img src="https://cdn.discordapp.com/emojis/1535973588031635608.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973586706108416.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973585083175063.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973583485009940.png" style="height:24px; display:block;">
              </div>
            </div>
          </div>

          <!-- 4. TOPLULUK ELÇİLİĞİ (AÇIK) -->
          <div style="margin-bottom:1rem; background:rgba(245,158,11,0.05); border-radius:12px; padding:1rem; border:1px solid rgba(245,158,11,0.2);">
            <div style="display:flex; align-items:center; gap:0.6rem; font-weight:700; color:#fff; flex-wrap:wrap;">
              <span style="font-size:1.2rem;">👑</span>
              <a href="/forms/community-ambassador" style="color:#f59e0b; text-decoration:underline; font-weight:800; font-size:1.1rem;">[ Topluluk Elçisi ]</a>
              <span style="color:var(--text); font-size:0.9rem; font-weight:600;">mülakat & başvuru formu için <a href="/forms/community-ambassador" style="color:#f59e0b; text-decoration:underline;">tıklayın</a>.</span>
            </div>
            <div style="margin-left:2rem; font-size:0.9rem; color:var(--muted); display:flex; align-items:center; gap:0.5rem; margin-top:0.4rem;">
              <span>◦ Başvuru durumu:</span>
              <div style="display:inline-flex; align-items:center; gap:0;">
                <img src="https://cdn.discordapp.com/emojis/1535973588031635608.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973586706108416.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973585083175063.png" style="height:24px; display:block;">
                <img src="https://cdn.discordapp.com/emojis/1535973583485009940.png" style="height:24px; display:block;">
              </div>
            </div>
          </div>

        </div>

        <div style="margin-top:1.8rem; font-size:0.85rem; color:var(--muted); font-style:italic;">
          Başvuru durumları otomatik olarak güncellenmektedir. Yeni bir bölümün başvuruları açıldığında sizleri bilgilendireceğiz.
        </div>

      </div>
    </div>
  `;

  return _layout('Yetkili Formları', currentUser, content, '', '/forms');
}


function renderEventStaffFormPage(currentUser, existingSubmission = null) {
  const isLoggedIn = Boolean(currentUser);
  const usernameStr = currentUser ? (currentUser.discordUsername || currentUser.username || '') : '';
  const BANNER = 'https://i.imgur.com/PeLUdcU.jpeg';

  // Helper to build a step section with header-bar + collapsible body
  function _step(num, color, title, subtitle, bodyHtml, navHtml) {
    const hidden = num > 1 ? 'display:none;' : '';
    return `
      <div id="form-step-${num}" class="form-step card" style="border-radius:20px;border-left:4px solid ${color};${hidden}transition:all 0.3s;">
        <div class="step-header-bar" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" onclick="toggleStep(${num})">
          <div>
            <h3 style="font-size:1.1rem;font-weight:800;color:${color};margin-bottom:0.2rem;">${title}</h3>
            <p style="font-size:0.78rem;color:var(--muted);margin:0;">${subtitle}</p>
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem;">
            <span class="step-done-badge" style="display:none;background:${color}20;color:${color};font-size:0.72rem;font-weight:800;padding:0.25rem 0.7rem;border-radius:20px;border:1px solid ${color}40;">✓ TAMAMLANDI</span>
            <span class="step-expand-btn" style="display:none;color:${color};font-size:1.2rem;cursor:pointer;" title="Genişlet / Daralt">▼</span>
          </div>
        </div>
        <div class="step-body" style="margin-top:1rem;">
          ${bodyHtml}
          <div class="step-nav" style="display:flex;justify-content:${num === 1 ? 'flex-end' : 'space-between'};margin-top:1.5rem;">
            ${navHtml}
          </div>
        </div>
      </div>`;
  }

  // Field builder helper
  function _field(id, label, placeholder, rows) {
    return `
      <div class="form-group" style="margin-bottom:1.2rem;">
        <label class="field-label">${label} *</label>
        <textarea id="${id}" class="input-field track-field" data-field="${id}" rows="${rows || 3}" required placeholder="${placeholder}"></textarea>
        <div class="field-hint" id="hint-${id}" style="font-size:0.72rem;color:var(--muted);margin-top:0.25rem;min-height:16px;"></div>
      </div>`;
  }

  const prevBtn = (n) => `<button type="button" onclick="prevStep(${n})" class="btn btn-ghost" style="font-size:0.9rem;">← Önceki Bölüm</button>`;
  const nextBtn = (n, color, grad) => `<button type="button" onclick="nextStep(${n})" class="btn" style="background:linear-gradient(135deg,${grad});color:#fff;font-weight:700;padding:0.7rem 1.8rem;border-radius:24px;border:none;cursor:pointer;font-family:inherit;">Sonraki Bölüm →</button>`;

  // ═══ BÖLÜM 1 ═══
  const step1Body = `
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #818cf8;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Başvuru formunun ilk bölümünde, kimliğinizin doğrulanabilmesi ve sürecin düzenli bir şekilde ilerleyebilmesi için bazı temel ön bilgiler talep edilmektedir. Bu bilgiler, yalnızca başvurunun değerlendirilmesi ve iletişim sürecinin sağlıklı yürütülmesi amacıyla kullanılacaktır.<br><br>
      Lütfen sizden istenen bilgileri eksiksiz, güncel ve doğru bir biçimde doldurunuz. Bilgilerin doğruluğundan başvuru sahibi sorumludur. Eksik veya hatalı bilgi girişi, başvurunun geçersiz sayılmasına neden olabilir.
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label class="field-label">DISCORD HESABI *<br><span style="font-weight:400;font-size:0.78rem;color:var(--muted);">Discord hesabınızın kullanıcı adı nedir? Eğer herhangi bir etiket (tag) özelliğine sahipseniz "İSİM#(etiket)" şeklinde yazın.</span></label>
      <input type="text" id="q_discord" class="input-field track-field" data-field="discord_username" value="${_esc(usernameStr)}" required placeholder="Örn: ekonqtx">
      <div class="field-hint" id="hint-q_discord" style="font-size:0.72rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
    </div>`;
  const step1 = _step(1, '#818cf8', 'BÖLÜM 1 — İSTENİLEN ÖN BİLGİLER', 'Kimliğinizin doğrulanabilmesi için temel ön bilgileriniz.', step1Body, nextBtn(1, '#818cf8', '#818cf8,#6366f1'));

  // ═══ BÖLÜM 2 ═══
  const step2Body = `
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #a78bfa;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Kişisel bilgi paylaşımı, bireylerin özel ve hassas bilgilerini güvenli bir şekilde sunma sürecidir. Bu süreçte gizlilik, veri güvenliği ve yasal sorumluluklar öncelikli olarak gözetilmektedir. Paylaştığınız bilgiler, başvuru ve değerlendirme sürecinin doğru, adil ve etkili bir şekilde yürütülmesini sağlamak amacıyla kullanılacaktır.<br><br>
      Sunduğunuz akademik geçmiş, deneyimler, yetkinlikler ve kişisel tercihler, Etkinlik Sorumluluğu ve ilgili yetkili ekipler tarafından, sizin için en uygun görev ve sorumluluk alanlarını belirlemek ve sunucumuzun standartlarına uygun çözümler geliştirmek amacıyla değerlendirilecektir.<br><br>
      Tüm paylaşımlarınız sadece Etkinlik Organizatörü tarafından merkezi değerlendirme birimine iletilecek ve gizlilik politikalarımız doğrultusunda korunacaktır.
    </div>
    ${_field('q_p1', 'KİŞİSEL SORU — Bize biraz kendinizden bahseder misiniz?', 'Kendiniz, ilgi alanlarınız ve yaşınızdan bahsedin...', 3)}
    ${_field('q_p2', 'KİŞİSEL SORU — Hangi becerilerinizin takım içinde en çok değer taşıdığını düşünüyorsunuz?', 'Becerilerinizi ve güçlü yönlerinizi detaylandırın...', 3)}
    ${_field('q_p3', 'KİŞİSEL SORU — Takıma ne gibi özellikler getirebilirsiniz?', 'Takıma katacağınız değerleri açıklayın...', 3)}
    ${_field('q_p4', 'KİŞİSEL SORU — Neden Etkinlik Sorumluluğunda görev almak istiyorsunuz?', 'Etkinlik Yetkililiğinde çalışmanın sizin için anlamı nedir ve burada görev alarak nasıl bir katma değer sağlayacağınızı düşünüyorsunuz?', 4)}
    ${_field('q_p5', 'KİŞİSEL SORU — Üstlerinizden direktif alma konusunda ne kadar rahat hissedersiniz?', 'Bu süreçte yönergeleri anlama, uygulama ve gerektiğinde adapte etme yeteneğiniz hakkında neler söyleyebilirsiniz?', 3)}`;
  const step2 = _step(2, '#a78bfa', 'BÖLÜM 2 — İSTENİLEN KİŞİSEL BİLGİLER', 'Akademik geçmiş, deneyimler ve kişisel tercihleriniz.', step2Body, prevBtn(2) + nextBtn(2, '#a78bfa', '#a78bfa,#8b5cf6'));

  // ═══ BÖLÜM 3 ═══
  const step3Body = `
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #34d399;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      EkoYıldız Topluluk Sunucusu bünyesinde görev alacak Etkinlik Sorumluluğu adayları için hazırlanan bu teknik bilgi aşaması, etkinlik yetkilisi görevini yetkin, sorumluluk sahibi ve sunucu standartlarına uygun biçimde yerine getirebilecek kişilerin belirlenmesini amaçlamaktadır.<br><br>
      <strong>"Sorulara verilen nitelikli, tutarlı ve uygulamaya yönelik cevaplar, başvurunun olumlu değerlendirilmesinde belirleyici rol oynayacaktır."</strong>
    </div>
    ${_field('q_t1', 'TEKNİK SORU — EkoYıldız sunucusunda düzenlenen bir etkinlikte Etkinlik Sorumlusunun, moderasyon ekibi ve yönetim kadrosundan hangi yönleriyle ayrıldığını, hangi konularda doğrudan yetkili, hangi konularda ise yetkisiz olduğunu teknik ve yönetsel açıdan açıklayınız.', 'Yetki sınırları ve görev tanımı farklılıkları...', 4)}
    ${_field('q_t2', 'TEKNİK SORU — Etkinlik Sorumlusunun, etkinlik sırasında aldığı kararların sonradan tartışma konusu olmaması için hangi teknik kayıtları (log, ekran görüntüsü, yazılı duyuru vb.) tutması gerekir ve bu kayıtlar hangi durumlarda kullanılmalıdır?', 'Kayıt türleri ve kullanım durumları...', 4)}
    ${_field('q_t3', 'TEKNİK SORU — Sunucu dışı bir platformda düzenlenen EkoYıldız etkinliğinde, Etkinlik Sorumlusunun temsil yetkisi, iletişim dili ve bilgi paylaşım sınırları nasıl belirlenmelidir?', 'Dış platform prosedürleri ve iletişim sınırları...', 4)}
    ${_field('q_t4', 'TEKNİK SORU — Bir etkinlik sırasında, başka bir yetkilinin Etkinlik Sorumlusunun kararlarına açık şekilde müdahale etmesi veya yetki karmaşası yaratması durumunda; Etkinlik Sorumlusu bu durumu nasıl yönetmelidir?', 'Yetki karmaşası yönetimi adımları...', 4)}
    ${_field('q_t5', 'TEKNİK SORU — Etkinlik sırasında uygulanan kuralların, sunucu genel kurallarıyla çeliştiği iddiası ortaya atılırsa; Etkinlik Sorumlusunun bu duruma yaklaşımı nasıl olmalı ve hangi birimlerle koordinasyon kurmalıdır?', 'Kural çelişkisi çözüm prosedürleri...', 4)}
    ${_field('q_t6', 'TEKNİK SORU — Bir etkinliğin, katılımcıların bir kısmı tarafından adil olmadığı gerekçesiyle eleştirilmesi hâlinde; Etkinlik Sorumlusunun geri bildirim toplama, raporlama ve iyileştirme sürecini teknik olarak nasıl yürütmesi gerekir?', 'Geri bildirim toplama ve raporlama süreci...', 4)}
    ${_field('q_t7', 'TEKNİK SORU — Etkinlik Sorumlusunun performansı hangi ölçülebilir teknik kriterler üzerinden değerlendirilmelidir? (örnek: etkinlik akışına uyum, kriz müdahale süresi, iletişim netliği vb.)', 'Ölçülebilir performans kriterleri listesi...', 3)}

    <!-- ÇOKTAN SEÇMELİ TEST (Soru 8) -->
    <div class="form-group" style="margin-bottom:1.2rem;">
      <label class="field-label">TEKNİK SORU — (Çoktan Seçmeli Test) *</label>
      <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.2rem;margin-top:0.4rem;">
        <p style="color:var(--muted);font-size:0.88rem;line-height:1.7;margin-bottom:1rem;">
          EkoYıldız sunucusunda düzenlenen geniş katılımlı bir etkinlik sırasında, katılımcıların kullandığı geçici ses kanallarında ciddi bir karmaşa yaşanmakta ve bazı kullanıcılar yetkileri olmadığı hâlde farklı kanallara erişebilmektedir. Bu durum, etkinliğin akışını ve düzenini olumsuz etkilemektedir.<br><br>
          <strong>Bu durumda Etkinlik Sorumlusunun aşağıdaki adımlardan hangisini öncelikli olarak uygulaması teknik açıdan en doğrudur?</strong>
        </p>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          ${[
            ['A','Etkinliği durdurarak tüm kanalları kapatmak ve sorunu daha sonra incelemek',''],
            ['B','Kanal izinlerini hızlıca düzenleyerek yalnızca ilgili rollerin erişimine izin vermek','color:#34d399;font-weight:700;'],
            ['C','Yetkisiz erişimi olan kullanıcıları doğrudan etkinlikten çıkarmak',''],
            ['D','Moderasyon ekibine durumu bildirip hiçbir müdahalede bulunmamak',''],
            ['E','Katılımcılardan kanalları kendi isteğiyle terk etmelerini rica etmek','']
          ].map(([letter, text, style]) => `
            <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);transition:all 0.2s;${style}" onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
              <input type="radio" name="q_mc8" value="${letter}" required style="accent-color:#34d399;width:18px;height:18px;flex-shrink:0;">
              <span style="font-size:0.88rem;">${letter}) ${text}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    <!-- ÇOKLU SEÇİM (Soru 9) -->
    <div class="form-group" style="margin-bottom:1.2rem;">
      <label class="field-label">TEKNİK SORU — (Çoklu Seçim) *</label>
      <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.2rem;margin-top:0.4rem;">
        <p style="color:var(--muted);font-size:0.88rem;line-height:1.7;margin-bottom:1rem;">
          EkoYıldız sunucu içi bir etkinlik sırasında; teknik bir aksaklık yaşanmış, bazı katılımcılar etkinliğin adil ilerlemediğini iddia etmiş, etkinlik akışı kısa süreli olarak kesintiye uğramıştır.<br><br>
          <strong>Bu durumda Etkinlik Sorumlusunun yetki ve sorumlulukları çerçevesinde atması gereken doğru adımlar aşağıdakilerden hangileridir?</strong>
        </p>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          ${[
            ['explain','Yaşanan teknik sorunu katılımcılara kısa ve net şekilde açıklamak',''],
            ['rules_remind','Etkinlik kurallarını ve akışı yazılı olarak yeniden hatırlatmak',''],
            ['argue','İtiraz eden katılımcılarla tartışmaya girmek','color:#fb7185;'],
            ['coord','Gerekli durumlarda yönetim veya moderasyon ekibiyle koordinasyon sağlamak',''],
            ['abort','Etkinliği gerekçesiz şekilde sonlandırmak','color:#fb7185;']
          ].map(([val, text, style]) => `
            <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);transition:all 0.2s;${style}" onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
              <input type="checkbox" name="q_cb9" value="${val}" style="accent-color:#a78bfa;width:18px;height:18px;flex-shrink:0;">
              <span style="font-size:0.88rem;">${text}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    ${_field('q_t10', 'TEKNİK SORU — Bir Etkinlik Sorumlusunun görev sırasında yetkisini aşması ile inisiyatif alması arasındaki farkı EkoYıldız etkinlik yapısı özelinde açıklayınız.', 'Yetki aşımı ve inisiyatif arasındaki fark...', 4)}`;
  const step3 = _step(3, '#34d399', 'BÖLÜM 3 — İSTENİLEN TEKNİK BİLGİLER', 'EkoYıldız topluluk standartlarına uygun teknik ve yönetsel bilgi ölçümü.', step3Body, prevBtn(3) + nextBtn(3, '#34d399', '#34d399,#059669'));

  // ═══ BÖLÜM 4 ═══
  const step4Body = `
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #fbbf24;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Etkinlik Sorumluluğu kapsamında kullanılan senaryolar; EkoYıldız sunucusu içerisinde ve sunucu dışı platformlarda düzenlenen etkinliklerde karşılaşılması muhtemel gerçekçi durumları, operasyonel aksaklıkları ve organizasyon odaklı krizleri simüle eden, Etkinlik Sorumlularının planlama, yönetim, karar alma ve kriz müdahale yetkinliklerini çok yönlü biçimde değerlendirmeyi amaçlayan stratejik ölçüm araçlarıdır.<br><br>
      Bu senaryolar; etkinlik akışında yaşanan bir aksama, teknik bir problem, katılımcı itirazları, görevli yetkililer arasında yaşanan yetki karmaşası, kurallara uyumsuzluk veya etkinliğin genel düzenini ve algısını etkileyebilecek bir kriz durumu üzerine kurgulanır.
    </div>
    ${_field('q_s1', 'SENARYO SORUSU 1 — Büyük ölçekli etkinlik sırasında katılımcı sayısı beklenenden fazla oluyor, sunucu performansı düşüyor. Bazı oyuncular RP senaryosunu önceden bildiklerini iddia ederek etkinlik akışını bozuyor, bazı yetkililer kendi inisiyatifleriyle RP görevlerini değiştiriyor ve dış topluluklarda yanıltıcı bilgiler yayılmakta. Etkinlik Sorumlusu olarak nasıl yönetirsiniz?', 'Etkinlik akışı, RP bütünlüğü, sunucu performansı ve katılımcı deneyimini korumak için stratejileriniz...', 5)}
    ${_field('q_s2', 'SENARYO SORUSU 2 — Etkinlik sırasında bazı oyuncular, RP senaryosu ve ödül dağıtımı hakkında adaletsizlik ve ayrıcalık iddialarında bulunuyor. Teknik aksaklıklar nedeniyle bazı kanallar doğru çalışmıyor ve katılımcılar karmaşa yaşamaya başlıyor. Hangi adımları hangi öncelik sırasıyla atarsınız?', 'RP bütünlüğü, katılımcı memnuniyeti, teknik sorun çözümü ve koordinasyon...', 5)}
    ${_field('q_s3', 'SENARYO SORUSU 3 — Sunucu dışındaki başka bir Discord topluluğu ve sosyal platformlar üzerinden, EkoYıldız etkinliği hakkında yanıltıcı bilgiler hızla yayılmakta. Bazı oyuncular sunucu içinde huzursuzluk yaratıyor, bazı yetkililer kendi yorumlarıyla akışı değiştirmeye çalışıyor. Hangi adımları atarsınız?', 'Sunucu içi ve dışı iletişim, yetki sınırları ve topluluk güveni...', 5)}
    ${_field('q_s4', 'SENARYO SORUSU 4 — Etkinlik sırasında bazı oyuncular rol akışını kasıtlı olarak bozuyor, diğer oyuncular bu durumdan etkileniyor ve teknik sorunlar nedeniyle etkinlik duraksıyor. Hangi müdahaleleri uygularsınız?', 'Rol bütünlüğü, teknik akış ve katılımcı memnuniyeti koruma stratejileri...', 5)}
    ${_field('q_s5', 'SENARYO SORUSU 5 — Etkinlik tamamlandıktan sonra bazı katılımcılar etkinliği "taraflı ve önceden ayarlanmış" olarak sosyal platformlarda eleştiriyor ve ödül dağıtımı ile yönetim kararlarını sorguluyor. Etkinlik sırasında kaydedilen loglar bazı hataları ortaya koyuyor. Hangi belgeleri ve kayıtları kullanır, hangi stratejileri uygularsınız?', 'Topluluk algısı düzeltme, güven tesisi ve raporlama stratejileri...', 5)}
    ${_field('q_ss', 'TEKLİ SENARYO — EkoYıldız sunucusunda planlanan bir etkinlik sırasında, beklenmedik bir sunucu bakım çalışması meydana geliyor ve etkinliğin bazı kritik mekanikleri geçici olarak devre dışı kalıyor. Aynı zamanda bazı oyuncular rol kurallarını ihlal ediyor, bazı yetkililer etik sınırları zorlayarak etkinliği yönlendirmeye çalışıyor, bazı katılımcılar dış platformlarda olumsuz paylaşımlar yapıyor. Bu durumda hangi önceliklere sahip adımları atarsınız?', 'Tüm kriz yönetim adımlarınızı öncelik sırasıyla açıklayın...', 6)}`;
  const step4 = _step(4, '#fbbf24', 'BÖLÜM 4 — İSTENİLEN SENARYO BİLGİLERİ', 'Gerçekleşmesi muhtemel kriz senaryolarına yaklaşımınız.', step4Body, prevBtn(4) + nextBtn(4, '#fbbf24', '#fbbf24,#d97706'));

  // ═══ BÖLÜM 5 ═══
  const step5Body = `
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #fb7185;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölümdeki soruların cevapları, idari politikalarımızın güçlendirilmesi ve ekibimizin daha etkin bir şekilde işleyebilmesi için önemli bir katkı sağlayacaktır.
    </div>

    <div class="form-group" style="margin-bottom:1.3rem;">
      <label class="field-label">SON SORU — Yetkilerinizi kötüye kullanırsanız sorumluluk haklarınızın alınabileceğini ve teknik olarak sunucu içinde soruşturma altına olacağınızı kabul ediyor musunuz? *</label>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(52,211,153,0.12)'" onmouseout="this.style.background='rgba(52,211,153,0.06)'">
          <input type="radio" name="opt_abuse" value="EVET" required style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:600;">Evet, kabul ediyorum.</span>
        </label>
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(251,113,133,0.06);border:1px solid rgba(251,113,133,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(251,113,133,0.12)'" onmouseout="this.style.background='rgba(251,113,133,0.06)'">
          <input type="radio" name="opt_abuse" value="HAYIR" style="accent-color:#fb7185;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#fb7185;font-weight:600;">Hayır, kabul etmiyorum.</span>
        </label>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:1.3rem;">
      <label class="field-label">SON SORU — Başka bir çalışana saygısızlık ederseniz yetkililik haklarınızın elinizden alınabileceğini kabul ediyor musunuz? *</label>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(52,211,153,0.12)'" onmouseout="this.style.background='rgba(52,211,153,0.06)'">
          <input type="radio" name="opt_respect" value="EVET" required style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:600;">Evet, kabul ediyorum.</span>
        </label>
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(251,113,133,0.06);border:1px solid rgba(251,113,133,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(251,113,133,0.12)'" onmouseout="this.style.background='rgba(251,113,133,0.06)'">
          <input type="radio" name="opt_respect" value="HAYIR" style="accent-color:#fb7185;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#fb7185;font-weight:600;">Hayır, kabul etmiyorum.</span>
        </label>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:0;">
      <label class="field-label">TALİMATNAME — Personel sınıfına bağlı belirli kurallar mevcut. El kitapçığına uyacağınızı teyit eder misiniz? *</label>
      <div style="margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.75rem 1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.08);border:1.5px solid rgba(52,211,153,0.25);transition:all 0.2s;">
          <input type="radio" name="opt_rules" value="EVET" required checked style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:700;">Kurallara uyacağım, Talimat kitapçığına göre ilerleyecek ve vazifemi yerine getireceğim.</span>
        </label>
      </div>
    </div>`;
  const step5Nav = prevBtn(5) + `<button type="submit" id="submit-btn" class="btn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:800;font-size:1.1rem;padding:0.9rem 2.8rem;border-radius:30px;box-shadow:0 8px 25px rgba(16,185,129,0.4);border:none;cursor:pointer;font-family:inherit;">🚀 Başvuruyu Gönder</button>`;
  const step5 = _step(5, '#fb7185', 'BÖLÜM 5 — İSTENİLEN SON BİLGİLER (ZORUNLU ONAYLAR)', 'Başvurunuzu tamamlamak için aşağıdaki zorunlu onayları verin.', step5Body, step5Nav);

  const content = `
    <div style="max-width:960px; margin:1.5rem auto; animation:fadeUp 0.5s ease;">
      <!-- FORM BANNER -->
      <div style="width:100%;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);margin-bottom:1.5rem;box-shadow:0 12px 35px rgba(0,0,0,0.5);">
        <img src="${BANNER}" style="width:100%;display:block;max-height:280px;object-fit:cover;">
      </div>

      <!-- FORM HEADER TITLE CARD -->
      <div class="card" style="background:rgba(20,20,35,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:2rem;backdrop-filter:blur(20px);margin-bottom:1.5rem;border-top:4px solid #34d399;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
          <div>
            <div style="color:#34d399;font-size:0.85rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:0.4rem;">✳️ ETKİNLİK YETKİLİSİ ALIM FORMU</div>
            <h1 style="font-size:1.8rem;font-weight:800;color:#fff;">Etkinlik Sorumluluğu // [A-1] 1. Nesil Sorumlu Başvuru Formu</h1>
          </div>
          <a href="/forms" class="btn btn-sm btn-ghost">← Tüm Formlara Dön</a>
        </div>
      </div>

      ${existingSubmission ? `
        <div class="card" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.3);border-radius:20px;padding:2.5rem;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">⏳</div>
          <h2 style="font-size:1.6rem;font-weight:800;color:#fff;margin-bottom:0.6rem;">Başvurunuz Değerlendirilme Aşamasında!</h2>
          <p style="color:var(--muted);max-width:650px;margin:0 auto 1.5rem;line-height:1.6;">
            Sayın <strong>${_esc(usernameStr)}</strong>, başvurunuz <strong>${new Date(existingSubmission.createdAt).toLocaleString('tr-TR')}</strong> tarihinde ulaşmıştır.
          </p>
          <div style="display:inline-block;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1rem 1.5rem;text-align:left;font-size:0.9rem;color:var(--muted);">
            <div>📌 <strong>Durum:</strong> <span style="color:#fbbf24;font-weight:700;">⏳ İNCELENİYOR</span></div>
            <div>🆔 <strong>ID:</strong> <code>${existingSubmission._id}</code></div>
          </div>
        </div>
      ` : `

        <!-- DOCUMENTATION CARD -->
        <div class="card" style="margin-bottom:1.5rem;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:1.8rem;">
          <h3 style="font-size:1.15rem;font-weight:800;color:#fff;margin-bottom:1rem;">📖 BİRİNCİL ALIM FORMU</h3>
          <div style="display:flex;flex-direction:column;gap:1rem;font-size:0.88rem;color:var(--muted);line-height:1.7;">
            <div style="border-left:3px solid #818cf8;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);">
              Birincil değerlendirme formumuz, adayların başvuru sürecinde ilk adımı attıkları ve başvurularının ön değerlendirmesinin yapıldığı önemli bir belgedir. Bu form, "Etkinlik Sorumlusu" pozisyonuna başvuran adayların ilk değerlendirmeye tabi tutulduğu bir araçtır.
            </div>
            <div style="border-left:3px solid #34d399;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);">
              <strong style="color:#fff;">FORMUN AMACI VE SÜRECİ:</strong> Formun temel amacı, adayların pozisyona uygunluğunu ilk aşamada değerlendirmektir. Başvurunun incelenmesi → Koşullu nihai değerlendirme → Mülakat daveti → Kurula alım kararı.
            </div>
            <div style="border-left:3px solid #a78bfa;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);">
              <strong style="color:#fff;">ÖN ALIMLAR MÜLAKATI:</strong> Başvurduğunuz departmanı harici olarak yöneten komite, sizinle iletişime geçecektir. Regülasyon Komitesi, size özel hazırlanmış soruları yanıtlamanızı isteyecektir. Yalnızca Etkinlik Organizatörünün onayını alırsanız, departmana katılma hakkına sahip olacaksınız.
            </div>
            <div style="border-left:3px solid #fbbf24;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);font-size:0.82rem;">
              <strong style="color:#fff;">📌 FORM KURALLARI:</strong><br>
              • Başvuru formunu sadece bir kez göndermelisiniz.<br>
              • Trolleme veya toksik başvurularda bulunan kişiler EkoYıldız tarafından kara listeye alınacaktır.<br>
              • Başvuru cevaplarının özgün olması zorunludur. Yapay zekâ veya başkasından kopyalanmış içerikler tespit edildiğinde başvuru reddedilir.<br>
              • Koordinatörün değerlendirme süreci gizlilik esasına dayanır.<br>
              • Başvuru formu yalnızca kişisel değerlendirme amacı taşımakta olup paylaşılması yasaktır.<br>
              • Formun doldurulması, ilgili yönetmelik ve kuralları okuduğunuz ve kabul ettiğiniz anlamına gelir.<br>
              <span style="color:#818cf8;font-style:italic;">— Kurucu ekonqt</span>
            </div>
            <div style="border-left:3px solid #fb7185;padding:0.6rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);font-size:0.82rem;font-style:italic;">
              ・EK NOT: Etkinlik Organizatörü her başvuruyu dikkatle inceler. Bu sürece adım atan adaylara, disiplin ve kararlılık içinde ilerlemeleri temenni edilir.
            </div>
          </div>
        </div>

        <!-- STEP PROGRESS BAR -->
        <div id="step-progress" class="card" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:1.2rem 1.5rem;margin-bottom:1.2rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.8rem;">
            ${[
              ['1','Ön Bilgiler','#818cf8'],
              ['2','Kişisel','#a78bfa'],
              ['3','Teknik','#34d399'],
              ['4','Senaryolar','#fbbf24'],
              ['5','Onaylar','#fb7185']
            ].map(([n,label,color], i) => `
              <div id="step-pill-${n}" style="display:flex;align-items:center;gap:0.35rem;padding:0.3rem 0.75rem;border-radius:20px;font-size:0.78rem;font-weight:800;border:1.5px solid ${color}40;color:${color};opacity:${i===0?'1':'0.4'};transition:opacity 0.3s;">
                <span style="width:18px;height:18px;border-radius:50%;background:${color}20;border:1.5px solid ${color};display:inline-flex;align-items:center;justify-content:center;font-size:0.7rem;">${n}</span>
                ${label}
                <span class="pill-check" style="display:none;color:${color};font-weight:800;">✓</span>
              </div>
              ${i < 4 ? '<div style="flex:1;height:2px;background:rgba(255,255,255,0.08);border-radius:1px;"><div id="step-bar-' + n + '" style="height:100%;width:0%;background:' + color + ';border-radius:1px;transition:width 0.4s;"></div></div>' : ''}
            `).join('')}
          </div>
          <div style="font-size:0.8rem;color:var(--muted);">Bölüm <span id="step-current-label">1</span>/5 — <span id="step-name-label" style="color:var(--accent);">Ön Bilgiler</span></div>
        </div>

        <form id="event-staff-form" autocomplete="off" style="display:flex;flex-direction:column;gap:1.2rem;">
          ${step1}
          ${step2}
          ${step3}
          ${step4}
          ${step5}
        </form>

        <script>
          // ─── DAVRANIŞSAL TAKİP SİSTEMİ ───────────────────────────
          const _beh = {};
          let _currentStep = 1;
          const STEP_NAMES = {1:'Ön Bilgiler',2:'Kişisel Bilgiler',3:'Teknik Bilgiler',4:'Senaryo Bilgileri',5:'Son Bilgiler (Onaylar)'};
          const STEP_COLORS = {1:'#818cf8',2:'#a78bfa',3:'#34d399',4:'#fbbf24',5:'#fb7185'};

          function _initTracking() {
            document.querySelectorAll('.track-field').forEach(el => {
              const fid = el.dataset.field;
              _beh[fid] = { typed_chars: 0, paste_count: 0, focus_count: 0, focus_ms: 0, idle_events: 0, _ft: 0, _last: 0 };
              el.addEventListener('focus', () => { _beh[fid]._ft = Date.now(); _beh[fid].focus_count++; });
              el.addEventListener('blur', () => { if (_beh[fid]._ft) _beh[fid].focus_ms += Date.now() - _beh[fid]._ft; _beh[fid]._ft = 0; });
              el.addEventListener('input', () => {
                const now = Date.now();
                if (_beh[fid]._last && (now - _beh[fid]._last) > 4000) _beh[fid].idle_events++;
                _beh[fid]._last = now;
                _beh[fid].typed_chars++;
                _updateHint(fid, el);
              });
              el.addEventListener('paste', () => { _beh[fid].paste_count++; setTimeout(() => _updateHint(fid, el), 10); });
            });
          }

          function _updateHint(fid, el) {
            const hint = document.getElementById('hint-' + el.id);
            if (!hint) return;
            const b = _beh[fid];
            const parts = [];
            const len = (el.value || '').length;
            if (len > 0) {
              if (b.paste_count > 0) parts.push('📋 Yapıştırıldı');
              else parts.push('✍️ Yazıldı');
            }
            if (b.idle_events > 1) parts.push('⏸️ Bekleme var');
            if (len > 0) parts.push(len + ' karakter');
            hint.textContent = parts.join(' • ');
            hint.style.color = b.paste_count > 0 ? '#fbbf24' : 'var(--muted)';
          }

          function _getBehavior() {
            const result = {};
            for (const [fid, b] of Object.entries(_beh)) {
              const el = document.querySelector('[data-field="' + fid + '"]');
              const len = el ? (el.value || '').length : 0;
              let type = 'bilinmiyor';
              if (len === 0) type = 'boş';
              else if (b.paste_count > 0 && b.typed_chars < 5) type = 'kopyala-yapıştır';
              else if (b.paste_count > 0) type = 'yapıştır + düzenleme';
              else if (b.idle_events >= 3) type = 'yazdı (uzun bekleme)';
              else type = 'yazdı';
              result[fid] = { type, chars: len, typed: b.typed_chars, pastes: b.paste_count, focus_sec: Math.round(b.focus_ms / 1000), idle_events: b.idle_events };
            }
            return result;
          }

          // ─── ADIM NAVİGASYONU (Tamamlanan bölümler daraltılmış görünür kalır) ───
          function _collapseStep(num) {
            const step = document.getElementById('form-step-' + num);
            if (!step) return;
            const body = step.querySelector('.step-body');
            const badge = step.querySelector('.step-done-badge');
            const expBtn = step.querySelector('.step-expand-btn');
            if (body) body.style.display = 'none';
            if (badge) badge.style.display = 'inline-flex';
            if (expBtn) { expBtn.style.display = 'inline-flex'; expBtn.textContent = '▶'; }
            step.style.opacity = '0.8';
            step.style.background = 'rgba(255,255,255,0.015)';
          }

          function _expandStep(num) {
            const step = document.getElementById('form-step-' + num);
            if (!step) return;
            const body = step.querySelector('.step-body');
            const badge = step.querySelector('.step-done-badge');
            const expBtn = step.querySelector('.step-expand-btn');
            if (body) body.style.display = 'block';
            if (badge) badge.style.display = 'none';
            if (expBtn) { expBtn.style.display = 'none'; }
            step.style.opacity = '1';
            step.style.background = '';
          }

          function nextStep(current) {
            const step = document.getElementById('form-step-' + current);
            const fields = step.querySelectorAll('[required]');
            let valid = true;
            const checkedRadioNames = new Set();
            fields.forEach(f => {
              if (f.type === 'radio') {
                if (!checkedRadioNames.has(f.name)) {
                  checkedRadioNames.add(f.name);
                  const chosen = step.querySelector('input[name="' + f.name + '"]:checked');
                  if (!chosen) { valid = false; }
                }
              } else if (!f.value || !f.value.trim()) {
                f.style.borderColor = '#fb7185';
                valid = false;
              } else {
                f.style.borderColor = '';
              }
            });
            if (!valid) { if (typeof showToast === 'function') showToast('⚠️ Lütfen tüm zorunlu alanları doldurun.', 'error'); return; }

            // Collapse completed step (stays visible)
            _collapseStep(current);

            _currentStep = current + 1;
            const next = document.getElementById('form-step-' + _currentStep);
            if (next) {
              next.style.display = 'block';
              _expandStep(_currentStep);
              setTimeout(() => next.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
            }
            _updateProgress();
          }

          function prevStep(current) {
            const step = document.getElementById('form-step-' + current);
            if (step) step.style.display = 'none';
            _currentStep = current - 1;
            const prev = document.getElementById('form-step-' + _currentStep);
            if (prev) {
              prev.style.display = 'block';
              _expandStep(_currentStep);
              setTimeout(() => prev.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
            }
            _updateProgress();
          }

          function toggleStep(num) {
            if (num >= _currentStep) return; // can only toggle completed steps
            const step = document.getElementById('form-step-' + num);
            if (!step) return;
            const body = step.querySelector('.step-body');
            if (!body) return;
            if (body.style.display === 'none') _expandStep(num);
            else _collapseStep(num);
          }

          function _updateProgress() {
            for (let i = 1; i <= 5; i++) {
              const pill = document.getElementById('step-pill-' + i);
              if (pill) {
                pill.style.opacity = i <= _currentStep ? '1' : '0.4';
                const chk = pill.querySelector('.pill-check');
                if (chk) chk.style.display = i < _currentStep ? 'inline' : 'none';
              }
              if (i < 5) {
                const bar = document.getElementById('step-bar-' + i);
                if (bar) bar.style.width = i < _currentStep ? '100%' : '0%';
              }
            }
            const nameEl = document.getElementById('step-name-label');
            const curEl = document.getElementById('step-current-label');
            if (nameEl) nameEl.textContent = STEP_NAMES[_currentStep] || '';
            if (curEl) curEl.textContent = _currentStep;
          }

          // ─── FORM GÖNDERİM ───────────────────────────────────────
          document.getElementById('event-staff-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('submit-btn');
            btn.disabled = true;
            btn.innerHTML = '⏳ Gönderiliyor...';

            const cb9 = Array.from(document.querySelectorAll('input[name="q_cb9"]:checked')).map(c => c.value);

            const payload = {
              formType: 'event_staff',
              discordUsername: document.getElementById('q_discord').value.trim(),
              personal:  { q1: (document.getElementById('q_p1')||{}).value||'', q2: (document.getElementById('q_p2')||{}).value||'', q3: (document.getElementById('q_p3')||{}).value||'', q4: (document.getElementById('q_p4')||{}).value||'', q5: (document.getElementById('q_p5')||{}).value||'' },
              technical: { q1: (document.getElementById('q_t1')||{}).value||'', q2: (document.getElementById('q_t2')||{}).value||'', q3: (document.getElementById('q_t3')||{}).value||'', q4: (document.getElementById('q_t4')||{}).value||'', q5: (document.getElementById('q_t5')||{}).value||'', q6: (document.getElementById('q_t6')||{}).value||'', q7: (document.getElementById('q_t7')||{}).value||'', mc8: (document.querySelector('input[name="q_mc8"]:checked')||{}).value||'', cb9, q10: (document.getElementById('q_t10')||{}).value||'' },
              scenarios: { s1: (document.getElementById('q_s1')||{}).value||'', s2: (document.getElementById('q_s2')||{}).value||'', s3: (document.getElementById('q_s3')||{}).value||'', s4: (document.getElementById('q_s4')||{}).value||'', s5: (document.getElementById('q_s5')||{}).value||'', single: (document.getElementById('q_ss')||{}).value||'' },
              confirmations: { abuse: (document.querySelector('input[name="opt_abuse"]:checked')||{}).value||'', respect: (document.querySelector('input[name="opt_respect"]:checked')||{}).value||'', rules: (document.querySelector('input[name="opt_rules"]:checked')||{}).value||'' },
              behavior: _getBehavior()
            };

            try {
              const res = await fetch('/api/forms/event-staff/submit', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
              const data = await res.json();
              if (data && data.success) {
                if (typeof showToast === 'function') showToast('✅ Başvurunuz başarıyla alındı!', 'success');
                setTimeout(() => window.location.reload(), 1500);
              } else {
                if (typeof showToast === 'function') showToast('❌ ' + (data.error || 'Başvuru gönderilemedi'), 'error');
                btn.disabled = false; btn.innerHTML = '🚀 Başvuruyu Gönder';
              }
            } catch (err) {
              if (typeof showToast === 'function') showToast('❌ Bağlantı hatası yaşandı.', 'error');
              btn.disabled = false; btn.innerHTML = '🚀 Başvuruyu Gönder';
            }
          });

          _initTracking();
        </script>
      `}
    </div>
  `;

  return _layout('Etkinlik Yetkilisi Başvuru Formu', currentUser, content, '', '/forms');
}


function renderClosedFormPage(currentUser, formName = 'Bu Form', bannerUrl = '') {
  const content = `
    <div style="max-width:720px; margin:4rem auto; text-align:center; animation:fadeUp 0.5s ease;">
      ${bannerUrl ? '<div style="width:100%;border-radius:20px;overflow:hidden;margin-bottom:1.5rem;box-shadow:0 8px 24px rgba(0,0,0,0.4);"><img src="' + bannerUrl + '" style="width:100%;display:block;max-height:200px;object-fit:cover;filter:brightness(0.6);"></div>' : ''}
      <div class="card" style="background:rgba(251,113,133,0.06); border:1px solid rgba(251,113,133,0.25); border-radius:24px; padding:3.5rem 2.5rem;">
        <div style="font-size:4rem; margin-bottom:1.5rem; opacity:0.85;">🔒</div>
        <h1 style="font-size:2rem; font-weight:800; color:#fff; margin-bottom:0.8rem;">${_esc(formName)} Şu An Kapalı</h1>
        <p style="color:var(--muted); font-size:1.05rem; line-height:1.7; max-width:500px; margin:0 auto 2rem;">
          Başvurular şu anda alınmamaktadır. Yeni bir alım dönemi açıldığında duyurulacaktır.
        </p>
        <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
          <a href="/forms" class="btn" style="background:linear-gradient(135deg,#818cf8,#6366f1); color:#fff; font-weight:700; padding:0.75rem 1.8rem; border-radius:24px;">← Tüm Formlar</a>
          <a href="/dashboard" class="btn btn-ghost" style="padding:0.75rem 1.8rem; border-radius:24px;">Ana Sayfa</a>
        </div>
      </div>
    </div>
  `;
  return _layout(formName + ' — Kapalı', currentUser, content, '', '/forms');
}

const { renderCommunityAmbassadorFormPage } = require("./_form_views_patch");

module.exports = {
  renderMainPage,
  renderLoginPage,
  renderAuthorizePage,
  renderDashboard,
  renderTicketsPage,
  renderCreateTicketPage,
  renderNotificationsPage,
  renderStaffPanel,
  renderDebugPage,
  renderProfilePage,
  renderSettingsPage,
  renderLegalPage,
  renderWikiListPage,
  renderWikiArticlePage,
  renderAdminPage,
  renderUserLogsPage,
  renderFormsHubPage,
  renderEventStaffFormPage,
  renderCommunityAmbassadorFormPage,
  renderBriefingOnboardingModal,
  renderGroupAdminPage,
  renderLeaderboardPage,
  renderShopPage,
  renderWebhookPage,
  renderErrorPage,
  renderSocialPage,
  renderAccountTransferPage,
  // Internal helpers (exported for testing)
  _esc,
  _layout,
};
