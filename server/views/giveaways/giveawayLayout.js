'use strict';

const { isSiteAdmin } = require('../../../utils/adminCheck');

function _esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Discord avatarı: kayıtta tam URL, yalnızca hash veya hiç olmayabilir
function discordAvatarUrl(user) {
  if (!user) return 'https://cdn.discordapp.com/embed/avatars/0.png';
  const av = String(user.avatar || user.avatarUrl || '');
  if (/^https?:\/\//.test(av)) return av;
  if (av && user.discordId) {
    return `https://cdn.discordapp.com/avatars/${user.discordId}/${av}.${av.startsWith('a_') ? 'gif' : 'png'}?size=128`;
  }
  let idx = 0;
  try { idx = Number((BigInt(user.discordId || 0) >> 22n) % 6n); } catch (e) { idx = 0; }
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function giveawayLayout(titleOrOpts, userParam, contentParam, activeTabParam = 'feed') {
  let title, user, content, activeTab, description, notificationCount;
  if (typeof titleOrOpts === 'object' && titleOrOpts !== null && !userParam && !contentParam) {
    title = titleOrOpts.title;
    user = titleOrOpts.user;
    content = titleOrOpts.content;
    activeTab = titleOrOpts.activeTab || 'feed';
    description = titleOrOpts.description;
    notificationCount = titleOrOpts.notificationCount || 0;
  } else {
    title = titleOrOpts;
    user = userParam;
    content = contentParam;
    activeTab = activeTabParam;
    notificationCount = 0;
  }

  const isAdmin = user && isSiteAdmin(user);
  const username = user ? (user.discordUsername || user.username || 'Kullanıcı') : '';
  const avatarUrl = discordAvatarUrl(user);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${_esc(title)} — EkoYıldız Çekilişler</title>
  ${description ? `<meta name="description" content="${_esc(description)}">` : ''}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- Confetti kütüphanesi -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>

  <style>
    :root {
      --gw-bg: #0a0a0c;
      --gw-surface: #121215;
      --gw-surface-hover: #17171b;
      --gw-border: rgba(255, 255, 255, 0.08);
      --gw-border-glow: rgba(255, 255, 255, 0.16);
      --gw-accent: #8b85ff;
      --gw-accent-light: #a9a5ff;
      /* Eski sayfalar için korunan değişkenler — hepsi sakin tonlara eşlendi */
      --gw-accent-pink: #a9a5ff;
      --gw-accent-emerald: #4ade80;
      --gw-accent-amber: #fbbf24;
      --gw-accent-cyan: #a9a5ff;
      --gw-text: #ededef;
      --gw-muted: #8b8b94;
      --gw-text-muted: #8b8b94;
      --gw-primary: #8b85ff;
    }

    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: var(--gw-bg);
      color: var(--gw-text);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-feature-settings: 'cv11', 'ss01';
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    ::selection { background: rgba(139, 133, 255, 0.35); }

    /* ── ÜST BAR ── */
    .gw-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      width: 100%;
      background: rgba(10, 10, 12, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--gw-border);
    }
    .gw-header-inner {
      position: relative;
      max-width: 1180px;
      margin: 0 auto;
      height: 60px;
      padding: 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .gw-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      color: var(--gw-text);
      flex-shrink: 0;
    }
    .gw-brand-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: var(--gw-surface);
      border: 1px solid var(--gw-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }
    .gw-brand-title {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .gw-nav-menu {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex: 1;
    }
    .gw-nav-link {
      color: var(--gw-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
      transition: color 0.15s, background 0.15s;
    }
    .gw-nav-link:hover { color: var(--gw-text); }
    .gw-nav-link.active { color: var(--gw-text); background: rgba(255, 255, 255, 0.06); }

    .btn-return-main {
      margin-left: auto;
      font-size: 0.85rem;
      color: var(--gw-muted);
      text-decoration: none;
      padding: 0.45rem 0.75rem;
      transition: color 0.15s;
    }
    .btn-return-main:hover { color: var(--gw-text); }

    .gw-nav-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-shrink: 0;
    }

    .gw-user-card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--gw-text);
      padding: 4px 10px 4px 4px;
      border-radius: 999px;
      border: 1px solid var(--gw-border);
      transition: border-color 0.15s;
    }
    .gw-user-card:hover { border-color: var(--gw-border-glow); }
    .gw-user-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      object-fit: cover;
    }
    .gw-user-name {
      font-size: 0.85rem;
      font-weight: 500;
    }

    .btn-gw-login {
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      background: var(--gw-text);
      color: #0a0a0c;
      font-weight: 600;
      font-size: 0.85rem;
      text-decoration: none;
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    .btn-gw-login:hover { opacity: 0.88; }

    .btn-gw-admin {
      color: var(--gw-muted);
      font-size: 0.85rem;
      font-weight: 500;
      text-decoration: none;
      padding: 0.45rem 0.75rem;
      border: 1px solid var(--gw-border);
      border-radius: 8px;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .btn-gw-admin:hover { color: var(--gw-text); border-color: var(--gw-border-glow); }

    .gw-mobile-toggle {
      display: none;
      background: transparent;
      border: none;
      color: var(--gw-text);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
    }

    /* ── ANA İÇERİK ALANI ── */
    .gw-main {
      flex: 1;
      max-width: 1180px;
      width: 100%;
      margin: 0 auto;
      padding: 2.5rem 1.25rem 4rem;
    }

    /* ── PAYLAŞILAN ÇEKİLİŞ BİLEŞENLERİ ── */
    .gw-container { width: 100%; margin: 0 auto; }
    .gw-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .gw-card { overflow: hidden; background: var(--gw-surface); border: 1px solid var(--gw-border); border-radius: 14px; transition: border-color .15s ease, background .15s ease; }
    .gw-card:hover { border-color: var(--gw-border-glow); background: var(--gw-surface-hover); }
    .gw-btn { min-height: 38px; border: 1px solid transparent; border-radius: 9px; padding: .55rem 1rem; text-decoration: none; font: 600 .875rem 'Inter', system-ui, sans-serif; cursor: pointer; color: var(--gw-text); display: inline-flex; align-items: center; justify-content: center; gap: .45rem; transition: opacity .15s ease, background .15s ease, border-color .15s ease; }
    .gw-btn[disabled] { cursor: not-allowed; opacity: .45; }
    .gw-btn-primary { background: var(--gw-text); color: #0a0a0c; }
    .gw-btn-primary:hover:not([disabled]) { opacity: .88; }
    .gw-btn-secondary { background: transparent; border-color: var(--gw-border-glow); }
    .gw-btn-secondary:hover:not([disabled]) { background: rgba(255, 255, 255, .05); }
    .gw-badge { display: inline-flex; align-items: center; gap: .4rem; padding: .25rem .6rem; border-radius: 999px; font: 500 .75rem 'Inter', system-ui, sans-serif; color: var(--gw-text); background: rgba(10, 10, 12, .75); border: 1px solid var(--gw-border); }
    .gw-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .gw-badge-active::before { background: #4ade80; }
    .gw-badge-scheduled::before { background: #fbbf24; }
    .gw-badge-ended { color: var(--gw-muted); }

    /* ── FOOTER ── */
    .gw-footer {
      border-top: 1px solid var(--gw-border);
      padding: 2rem 1.25rem;
      margin-top: auto;
    }
    .gw-footer-inner {
      max-width: 1180px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .gw-footer-links {
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;
    }
    .gw-footer-link {
      color: var(--gw-muted);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.15s;
    }
    .gw-footer-link:hover { color: var(--gw-text); }
    .gw-footer-copy {
      font-size: 0.8rem;
      color: #5c5c66;
    }

    /* Toast Bildirim */
    .gw-toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .gw-toast {
      background: var(--gw-surface);
      border: 1px solid var(--gw-border-glow);
      border-radius: 10px;
      padding: 11px 16px;
      color: var(--gw-text);
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: toastIn 0.25s ease-out;
    }
    @keyframes toastIn {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @media (max-width: 900px) {
      .gw-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .gw-header-inner { gap: 1rem; }
      .gw-nav-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--gw-bg);
        border-bottom: 1px solid var(--gw-border);
        padding: 0.5rem 1.25rem 1rem;
        flex-direction: column;
        align-items: stretch;
      }
      .gw-nav-menu.open { display: flex; }
      .btn-return-main { margin-left: 0; }
      .gw-nav-actions { margin-left: auto; }
      .gw-mobile-toggle { display: block; }
    }
    @media (max-width: 620px) {
      .gw-grid { grid-template-columns: 1fr; }
      .gw-user-name { display: none; }
      .gw-main { padding-top: 1.75rem; }
      .gw-footer-inner { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>

  <!-- ÇEKİLİŞ NAVBAR -->
  <header class="gw-header">
    <div class="gw-header-inner">
      <a href="/cekilisler" class="gw-brand">
        <span class="gw-brand-icon">🎁</span>
        <span class="gw-brand-title">EkoYıldız Çekiliş</span>
      </a>

      <nav class="gw-nav-menu">
        <a href="/cekilisler" class="gw-nav-link ${activeTab === 'feed' ? 'active' : ''}">Çekilişler</a>
        <a href="/cekilisler/kazananlar" class="gw-nav-link ${activeTab === 'winners' ? 'active' : ''}">Kazananlar</a>
        <a href="/cekilisler/seffaflik" class="gw-nav-link ${activeTab === 'transparency' ? 'active' : ''}">Şeffaflık</a>
        ${user ? `<a href="/cekilisler/profil" class="gw-nav-link ${activeTab === 'profile' ? 'active' : ''}">Profilim</a>` : ''}
        <a href="/" class="btn-return-main">Ana siteye dön ↗</a>
      </nav>

      <div class="gw-nav-actions">
        ${isAdmin ? `<a href="/admin/giveaways" class="btn-gw-admin">Panel</a>` : ''}
        ${user ? `
          <a href="/cekilisler/profil" class="gw-user-card" title="Profilim">
            <img src="${_esc(avatarUrl)}" alt="" class="gw-user-avatar" onerror="this.onerror=null;this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
            <span class="gw-user-name">${_esc(username)}</span>
          </a>
        ` : `
          <a href="/login" class="btn-gw-login">Giriş yap</a>
        `}
        <button class="gw-mobile-toggle" onclick="document.querySelector('.gw-nav-menu').classList.toggle('open')" aria-label="Menüyü Aç/Kapat">☰</button>
      </div>
    </div>
  </header>

  <!-- ANA GÖVDE -->
  <main class="gw-main">
    ${content}
  </main>

  <!-- FOOTER -->
  <footer class="gw-footer">
    <div class="gw-footer-inner">
      <div class="gw-footer-links">
        <a href="/cekilisler" class="gw-footer-link">Çekilişler</a>
        <a href="/cekilisler/kazananlar" class="gw-footer-link">Kazananlar</a>
        <a href="/cekilisler/seffaflik" class="gw-footer-link">Şeffaflık</a>
        <a href="/anayasasi" class="gw-footer-link">Topluluk Anayasası</a>
        <a href="/" class="gw-footer-link">Ana Sayfa</a>
      </div>
      <div class="gw-footer-copy">© 2026 EkoYıldız</div>
    </div>
  </footer>

  <div id="gw-toast-container" class="gw-toast-container"></div>

  <script>
    function gwToast(msg, icon = '🎉') {
      const container = document.getElementById('gw-toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'gw-toast';
      toast.innerHTML = '<span>' + icon + '</span><span>' + msg + '</span>';
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }
    window.gwToast = gwToast;
  </script>
</body>
</html>
  `;
}

module.exports = {
  giveawayLayout,
  discordAvatarUrl,
  _esc
};
