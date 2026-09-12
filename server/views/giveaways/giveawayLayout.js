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
  const avatarUrl = user && user.avatar 
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` 
    : 'https://i.imgur.com/PFcAc6q.png';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${_esc(title)} — EkoYıldız Çekilişler Platformu</title>
  
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <!-- Confetti kütüphanesi -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>

  <style>
    :root {
      --gw-bg: #060713;
      --gw-surface: rgba(18, 19, 38, 0.75);
      --gw-surface-hover: rgba(28, 30, 58, 0.85);
      --gw-border: rgba(139, 92, 246, 0.18);
      --gw-border-glow: rgba(139, 92, 246, 0.4);
      --gw-accent: #8b5cf6;
      --gw-accent-light: #a78bfa;
      --gw-accent-pink: #ec4899;
      --gw-accent-emerald: #10b981;
      --gw-accent-amber: #f59e0b;
      --gw-accent-cyan: #06b6d4;
      --gw-text: #f8fafc;
      --gw-muted: #94a3b8;
      --gw-text-muted: #94a3b8;
      --gw-primary: #8b5cf6;
    }

    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background-color: var(--gw-bg);
      background-image: 
        radial-gradient(ellipse 90% 70% at 20% 0%, rgba(139, 92, 246, 0.12) 0%, transparent 60%),
        radial-gradient(ellipse 70% 60% at 80% 100%, rgba(236, 72, 153, 0.08) 0%, transparent 55%),
        radial-gradient(ellipse 50% 50% at 50% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 60%);
      color: var(--gw-text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    /* ── ÖZEL ÇEKİLİŞ NAVBAR ── */
    .gw-header {
      position: sticky;
      top: 1rem;
      z-index: 1000;
      max-width: 1280px;
      width: calc(100% - 2rem);
      margin: 1rem auto 0;
      background: rgba(10, 11, 24, 0.85);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--gw-border);
      border-radius: 24px;
      padding: 0.75rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(139, 92, 246, 0.1);
    }

    .gw-brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      text-decoration: none;
      color: inherit;
    }
    .gw-brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      box-shadow: 0 0 16px rgba(236, 72, 153, 0.4);
      flex-shrink: 0;
    }
    .gw-brand-text {
      display: flex;
      flex-direction: column;
    }
    .gw-brand-title {
      font-size: 1.25rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 30%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .gw-brand-badge {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--gw-accent-pink);
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    .gw-nav-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .gw-nav-link {
      color: var(--gw-muted);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.92rem;
      padding: 0.55rem 1.1rem;
      border-radius: 14px;
      transition: all 0.22s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .gw-nav-link:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
    }
    .gw-nav-link.active {
      color: #ffffff;
      background: rgba(139, 92, 246, 0.18);
      border: 1px solid rgba(139, 92, 246, 0.4);
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
    }

    .gw-nav-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .btn-return-main {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--gw-muted);
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.02);
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .btn-return-main:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
    }

    .gw-user-card {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      text-decoration: none;
      color: inherit;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 5px 12px 5px 6px;
      border-radius: 30px;
      transition: all 0.2s;
    }
    .gw-user-card:hover {
      border-color: var(--gw-accent-light);
      background: rgba(139, 92, 246, 0.12);
    }
    .gw-user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid var(--gw-accent-light);
    }
    .gw-user-name {
      font-size: 0.88rem;
      font-weight: 700;
      color: #f1f5f9;
    }

    .btn-gw-login {
      padding: 0.55rem 1.35rem;
      border-radius: 16px;
      background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.9rem;
      text-decoration: none;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(236, 72, 153, 0.35);
      transition: all 0.22s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-gw-login:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(236, 72, 153, 0.5);
    }

    .btn-gw-admin {
      background: rgba(245, 158, 11, 0.18);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      padding: 0.5rem 0.9rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-gw-admin:hover {
      background: rgba(245, 158, 11, 0.3);
      color: #fff;
    }

    /* ── MOBİL MENÜ ── */
    .gw-mobile-toggle {
      display: none;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 1.5rem;
      cursor: pointer;
    }

    /* ── ANA İÇERİK ALANI ── */
    .gw-main {
      flex: 1;
      max-width: 1280px;
      width: calc(100% - 2rem);
      margin: 2.5rem auto 4rem;
    }

    /* ── PAYLAŞILAN ÇEKİLİŞ BİLEŞENLERİ ── */
    .gw-container { width: min(100%, 1180px); margin: 0 auto; }
    .gw-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }
    .gw-card { overflow: hidden; background: linear-gradient(145deg, rgba(25, 27, 54, .88), rgba(12, 14, 31, .94)); border: 1px solid var(--gw-border); border-radius: 18px; box-shadow: 0 18px 40px rgba(0, 0, 0, .18); transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease; }
    .gw-card:hover { border-color: var(--gw-border-glow); box-shadow: 0 23px 46px rgba(0, 0, 0, .28), 0 0 0 1px rgba(139, 92, 246, .08); transform: translateY(-3px); }
    .gw-btn { min-height: 42px; border: 1px solid transparent; border-radius: 12px; padding: .65rem 1rem; text-decoration: none; font: 800 .88rem 'Outfit', sans-serif; cursor: pointer; color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: .45rem; transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
    .gw-btn:hover:not([disabled]) { transform: translateY(-2px); }
    .gw-btn[disabled] { cursor: not-allowed; opacity: .5; }
    .gw-btn-primary { background: linear-gradient(135deg, var(--gw-primary), var(--gw-accent-pink)); box-shadow: 0 8px 22px rgba(139, 92, 246, .27); }
    .gw-btn-primary:hover:not([disabled]) { box-shadow: 0 12px 28px rgba(236, 72, 153, .34); }
    .gw-btn-secondary { color: #e9e6ff; border-color: rgba(167, 139, 250, .34); background: rgba(139, 92, 246, .09); }
    .gw-btn-secondary:hover:not([disabled]) { background: rgba(139, 92, 246, .19); }
    .gw-badge { display: inline-flex; align-items: center; gap: .3rem; padding: .32rem .62rem; border-radius: 999px; font: 800 .72rem 'Outfit', sans-serif; letter-spacing: .03em; }
    .gw-badge-active { color: #9df2bf; background: rgba(16, 185, 129, .13); border: 1px solid rgba(16, 185, 129, .35); }
    .gw-badge-scheduled { color: #fbd887; background: rgba(245, 158, 11, .13); border: 1px solid rgba(245, 158, 11, .35); }
    .gw-badge-ended { color: #c5cad7; background: rgba(148, 163, 184, .12); border: 1px solid rgba(148, 163, 184, .25); }

    /* ── FOOTER ── */
    .gw-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(6, 7, 19, 0.9);
      padding: 3rem 1.5rem 2rem;
      margin-top: auto;
      text-align: center;
    }
    .gw-footer-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }
    .gw-footer-links {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .gw-footer-link {
      color: var(--gw-muted);
      text-decoration: none;
      font-size: 0.88rem;
      transition: color 0.2s;
    }
    .gw-footer-link:hover {
      color: #ffffff;
    }
    .gw-footer-copy {
      font-size: 0.82rem;
      color: #64748b;
    }

    /* Toast Bildirim */
    .gw-toast-container {
      position: fixed;
      bottom: 25px;
      right: 25px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .gw-toast {
      background: rgba(15, 16, 35, 0.95);
      border: 1px solid var(--gw-accent-light);
      border-radius: 14px;
      padding: 12px 20px;
      color: #ffffff;
      font-size: 0.92rem;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes toastIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @media (max-width: 900px) {
      .gw-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .gw-nav-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #0d0e22;
        border: 1px solid var(--gw-border);
        border-radius: 18px;
        padding: 1rem;
        flex-direction: column;
        margin-top: 10px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.7);
      }
      .gw-nav-menu.open {
        display: flex;
      }
      .gw-mobile-toggle {
        display: block;
      }
    }
    @media (max-width: 620px) {
      .gw-grid { grid-template-columns: 1fr; }
      .gw-header { padding: .65rem .9rem; border-radius: 18px; }
      .gw-brand-badge, .gw-user-name { display: none; }
      .gw-main { width: calc(100% - 1.25rem); margin-top: 1.4rem; }
      .btn-return-main { display: none; }
    }
  </style>
</head>
<body>

  <!-- ÇEKİLİŞ NAVBAR -->
  <header class="gw-header">
    <a href="/cekilisler" class="gw-brand">
      <div class="gw-brand-icon">🎁</div>
      <div class="gw-brand-text">
        <span class="gw-brand-title">EkoYıldız Çekiliş</span>
        <span class="gw-brand-badge">GIVEAWAY PLATFORM</span>
      </div>
    </a>

    <button class="gw-mobile-toggle" onclick="document.querySelector('.gw-nav-menu').classList.toggle('open')" aria-label="Menüyü Aç/Kapat">
      ☰
    </button>

    <nav class="gw-nav-menu">
      <a href="/cekilisler" class="gw-nav-link ${activeTab === 'feed' ? 'active' : ''}">🎁 Çekilişler</a>
      <a href="/cekilisler/kazananlar" class="gw-nav-link ${activeTab === 'winners' ? 'active' : ''}">🏆 Kazananlar</a>
      <a href="/cekilisler/seffaflik" class="gw-nav-link ${activeTab === 'transparency' ? 'active' : ''}">🛡️ Şeffaflık</a>
      ${user ? `<a href="/cekilisler/profil" class="gw-nav-link ${activeTab === 'profile' ? 'active' : ''}">👤 Profilim</a>` : ''}
      <a href="/" class="btn-return-main">🌐 Ana Siteye Dön</a>
    </nav>

    <div class="gw-nav-actions">
      ${isAdmin ? `<a href="/admin/giveaways" class="btn-gw-admin">⚙️ Çekiliş Paneli</a>` : ''}
      ${user ? `
        <a href="/cekilisler/profil" class="gw-user-card" title="Profilim">
          <img src="${avatarUrl}" alt="${_esc(username)}" class="gw-user-avatar">
          <span class="gw-user-name">${_esc(username)}</span>
        </a>
      ` : `
        <a href="/login" class="btn-gw-login">
          🚀 Giriş Yap
        </a>
      `}
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
        <a href="/cekilisler" class="gw-footer-link">Aktif Çekilişler</a>
        <a href="/cekilisler/kazananlar" class="gw-footer-link">Geçmiş Kazananlar</a>
        <a href="/cekilisler/seffaflik" class="gw-footer-link">Çekiliş Şeffaflığı & Adil Oyun</a>
        <a href="/anayasasi" class="gw-footer-link">Topluluk Anayasası</a>
        <a href="/" class="gw-footer-link">EkoYıldız Ana Sayfa</a>
      </div>
      <div class="gw-footer-copy">
        © 2026 EkoYıldız & Sentara Ekosistemi. Tüm çekilişler bağımsız güvenli randomizasyon ile yürütülmektedir.
      </div>
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
        toast.style.transform = 'translateY(20px)';
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
  _esc
};
