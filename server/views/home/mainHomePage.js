// server/views/home/mainHomePage.js
// Completely reimagined, interactive, modern creator portal homepage for EkoYıldız
'use strict';

const homepageService = require('../../services/homepageService');
const socialHubService = require('../../services/socialHubService');
const { giveaways, giveawayEntries, users } = require('../../../models/Store');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value, fallback = '/') {
  const url = String(value || '').trim();
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : fallback;
  } catch {
    return fallback;
  }
}

function renderFocusedHomePage(user) {
  const name = escapeHtml(user?.username || user?.discordUsername || 'misafir');
  const accountAction = user
    ? '<a class="home-button home-button-dark" href="/dashboard">Panele git</a>'
    : '<a class="home-button home-button-dark" href="/login">Giriş yap</a>';

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#111114">
  <meta name="description" content="EkoYıldız içerik, topluluk ve destek merkezi.">
  <title>EkoYıldız</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --ink:#171719; --muted:#69696f; --line:#e9e9ec; --paper:#fff; --soft:#f6f6f7; --pink:#ed5b7b; }
    * { box-sizing:border-box; } body { margin:0; color:var(--ink); background:var(--paper); font-family:Inter,Arial,sans-serif; }
    a { color:inherit; text-decoration:none; } .home-wrap { width:min(1160px,calc(100% - 40px)); margin:auto; }
    .home-nav { height:76px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--line); }
    .home-brand { font-weight:800; letter-spacing:-.06em; font-size:1.25rem; } .home-brand i { color:var(--pink); font-style:normal; }
    .home-links { display:flex; align-items:center; gap:25px; color:#4d4d53; font-size:.9rem; font-weight:600; }
    .home-links a:hover { color:var(--ink); } .home-button { display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:0 18px; border-radius:9px; font-weight:700; font-size:.9rem; }
    .home-button-dark { color:#fff; background:#19191b; } .home-button-light { color:#19191b; background:#fff; border:1px solid #d9d9de; }
    .home-hero { display:grid; grid-template-columns:1.15fr .85fr; gap:56px; min-height:550px; align-items:center; padding:75px 0; }
    .home-eyebrow { color:var(--pink); font-size:.76rem; letter-spacing:.12em; font-weight:800; text-transform:uppercase; }
    h1 { max-width:680px; margin:16px 0 20px; font-size:clamp(3rem,6vw,5.45rem); line-height:.98; letter-spacing:-.075em; }
    .home-intro { max-width:540px; color:var(--muted); font-size:1.1rem; line-height:1.65; } .home-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:30px; }
    .home-note { margin-top:20px; color:#888890; font-size:.82rem; } .home-art { align-self:stretch; min-height:370px; border-radius:20px; background:#f0edf0; display:flex; flex-direction:column; justify-content:flex-end; padding:32px; overflow:hidden; position:relative; }
    .home-art::before { content:''; position:absolute; width:240px; height:240px; border-radius:50%; background:var(--pink); top:45px; right:-65px; } .home-art::after { content:'✦'; position:absolute; color:#fff; font-size:9rem; top:65px; right:27px; }
    .home-art span,.home-art strong { position:relative; z-index:1; } .home-art span { color:#6e5961; font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.11em; } .home-art strong { margin-top:10px; font-size:1.65rem; letter-spacing:-.05em; max-width:250px; }
    .home-section { border-top:1px solid var(--line); padding:30px 0 72px; } .home-section-head { display:flex; justify-content:space-between; gap:24px; align-items:end; padding:30px 0; } .home-section-head h2 { margin:0; letter-spacing:-.055em; font-size:2rem; } .home-section-head p { max-width:430px; color:var(--muted); line-height:1.55; margin:0; }
    .home-grid { display:grid; grid-template-columns:repeat(3,1fr); border:1px solid var(--line); border-radius:14px; overflow:hidden; } .home-card { padding:28px; min-height:208px; border-right:1px solid var(--line); } .home-card:last-child { border:0; } .home-card small { display:block; color:var(--pink); font-weight:800; letter-spacing:.1em; } .home-card h3 { font-size:1.15rem; letter-spacing:-.035em; margin:17px 0 10px; } .home-card p { color:var(--muted); line-height:1.55; font-size:.9rem; } .home-card a { font-size:.86rem; font-weight:700; text-decoration:underline; text-underline-offset:4px; }
    .home-join { padding:38px; background:#19191b; color:#fff; border-radius:16px; display:flex; justify-content:space-between; align-items:center; gap:24px; } .home-join h2 { margin:0; letter-spacing:-.05em; font-size:1.9rem; } .home-join p { color:#bbb; margin:8px 0 0; }
    footer { padding:30px 0 42px; color:#86868e; font-size:.8rem; display:flex; justify-content:space-between; }
    @media(max-width:760px) { .home-wrap{width:min(100% - 28px,1160px)} .home-links a:not(:last-child){display:none} .home-hero{grid-template-columns:1fr;gap:22px;padding:55px 0} .home-art{min-height:235px} .home-grid{grid-template-columns:1fr}.home-card{border-right:0;border-bottom:1px solid var(--line)}.home-card:last-child{border-bottom:0}.home-section-head,.home-join,footer{align-items:flex-start;flex-direction:column}.home-section-head{gap:12px} }
  </style>
</head>
<body>
  <div class="home-wrap">
    <header class="home-nav"><a class="home-brand" href="/">eko<i>yıldız</i></a><nav class="home-links"><a href="/yardim">Yardım merkezi</a><a href="/ekoyildizda-calis">Ekip</a><a href="/cekilisler">Çekilişler</a>${accountAction}</nav></header>
    <main>
      <section class="home-hero"><div><div class="home-eyebrow">EkoYıldız topluluğu</div><h1>İyi oyunlar, iyi insanlar.</h1><p class="home-intro">İçerikleri takip et, toplulukla buluş ve ihtiyacın olduğunda doğru yere tek adımda ulaş. Gereksiz karmaşa yok.</p><div class="home-actions"><a class="home-button home-button-dark" href="https://discord.gg/1367646464804655104" target="_blank" rel="noreferrer">Discord’a katıl</a><a class="home-button home-button-light" href="/yardim">Yardım al</a></div><div class="home-note">${user ? `Tekrar hoş geldin, ${name}.` : 'Hesabın varsa panelden devam edebilirsin.'}</div></div><aside class="home-art"><span>Topluluk, içerik, destek</span><strong>Herkes için daha düzenli bir EkoYıldız.</strong></aside></section>
      <section class="home-section"><div class="home-section-head"><h2>Neye ihtiyacın var?</h2><p>Sayfaları yalnızca işe yarayan şeyler etrafında topladık.</p></div><div class="home-grid"><article class="home-card"><small>01 / İÇERİK</small><h3>Yeni şeyleri keşfet</h3><p>Çekilişler, duyurular ve toplulukta olan bitenler tek yerde.</p><a href="/cekilisler">Çekilişlere git</a></article><article class="home-card"><small>02 / DESTEK</small><h3>Doğru kişiye ulaş</h3><p>Hesap, doğrulama veya sunucu sorunları için net yardım yolları.</p><a href="/yardim">Safety Center’ı aç</a></article><article class="home-card"><small>03 / EKİP</small><h3>EkoYıldız’da çalış</h3><p>Ekibe nasıl katkı sunabileceğini, süreci ve beklentileri incele.</p><a href="/ekoyildizda-calis">Ekip sayfasını aç</a></article></div></section>
      <section class="home-section"><div class="home-section-head"><h2>Haberler ve notlar</h2><p>Ne değiştiğini, nasıl çalıştığını ve toplulukta neler olduğunu şeffaf biçimde paylaşıyoruz.</p></div><div class="home-grid"><article class="home-card"><small>SAFETY · 12 EYLÜL</small><h3>Daha güvenli bir topluluk için yeni moderasyon araçları</h3><p>Yeni raporlama, vaka merkezi ve spam koruması hakkında.</p><a href="/blog/yeni-moderasyon-araclari">Yazıyı oku</a></article><article class="home-card"><small>GÜNCELLEME</small><h3>Report sistemi yenilendi</h3><p>Bir kullanıcıyı bildirirken doğru bilgiyi vermek artık daha kolay.</p><a href="/blog/report-sistemi-yenilendi">Yazıyı oku</a></article><article class="home-card"><small>BEHIND THE SCENES</small><h3>Moderasyon sistemimizi nasıl tasarladık?</h3><p>Hızdan önce adalet, araçlardan önce ilkeler.</p><a href="/blog/moderasyon-sistemini-nasil-tasarladik">Yazıyı oku</a></article></div><div class="home-actions" style="margin-top:20px"><a class="home-button home-button-light" href="/blog">Tüm blog yazılarını aç</a></div></section>
      <section class="home-join"><div><h2>Toplulukta yerini al.</h2><p>Discord sunucusunda sohbet et, yardım al ve gelişmeleri kaçırma.</p></div><a class="home-button home-button-light" href="https://discord.gg/1367646464804655104" target="_blank" rel="noreferrer">Discord’u aç</a></section>
    </main><footer><span>© ${new Date().getFullYear()} EkoYıldız</span><span>Phibi destek sistemiyle birlikte</span></footer>
  </div>
</body></html>`;
}

function renderMainHomePage(userOrOptions = null) {
  const user = (userOrOptions && typeof userOrOptions === 'object' && 'user' in userOrOptions)
    ? userOrOptions.user
    : userOrOptions;

  return renderFocusedHomePage(user);

  const config = homepageService.getConfig() || {};
  const greeting = homepageService.getDynamicGreeting();
  
  // Get active giveaways
  const activeGws = giveaways.find({ status: 'ACTIVE' });
  const featuredGw = activeGws.find(g => g.isFeatured) || activeGws[0] || null;

  // "Şimdi Ne Var?" dynamic priority widget
  const nowWidget = homepageService.getNowPriorityWidget(config, activeGws) || {
    badge: 'EKOYILDIZ', title: 'Topluluk Portalı', desc: 'Yeni içerikleri ve çekilişleri keşfet.', btnLink: '/cekilisler', btnText: 'Çekilişleri Gör'
  };

  // Community Pulse
  const communityPulse = homepageService.getCommunityPulse();
  const pulseStats = Array.isArray(communityPulse) ? communityPulse : [];

  // User personalization (only for verified logged-in user)
  let userStatsHtml = '';
  if (user && (user.discordId || user._id || user.username)) {
    const userDiscordId = user.discordId || String(user._id);
    const userEntries = giveawayEntries.find({ userId: userDiscordId }) || [];
    const totalTickets = userEntries.reduce((sum, e) => sum + (Number(e.tickets) || 1), 0);
    userStatsHtml = `
      <div class="user-welcome-banner">
        <div class="user-welcome-avatar">
          <img src="${safeUrl(user.avatar, 'https://i.imgur.com/PFcAc6q.png')}" alt="${escapeHtml(user.username || 'Kullanıcı')}" onerror="this.src='https://i.imgur.com/PFcAc6q.png'">
        </div>
        <div class="user-welcome-text">
          <div class="user-welcome-title">Tekrar hoş geldin, <span>${escapeHtml(user.username || user.discordUsername || 'Ekocan')}</span> 👋</div>
          <div class="user-welcome-sub">Katıldığın Çekilişler: <strong>${userEntries.length}</strong> &bull; Toplam Çekiliş Biletin: <strong>${totalTickets} bilet</strong></div>
        </div>
        <div class="user-welcome-actions">
          <a href="/dashboard" class="btn-portal-sm">🚀 Panelime Git</a>
          <a href="/cekilisler/profil" class="btn-portal-sm btn-portal-outline">🎟️ Biletlerim</a>
        </div>
      </div>
    `;
  }

  // Announcement Bar
  const announcement = config.announcement || {};
  let announcementText = announcement.text || '';
  let announcementLink = announcement.link || '/cekilisler';
  let announcementBtnText = announcement.buttonText || 'Hemen İncele ➔';

  if (activeGws.length === 0 && (announcementText.includes('10.000 Robux') || announcementText.includes('Discord Nitro'))) {
    announcementText = '🎉 EkoYıldız Resmi Topluluk Portalı yayında! Yeni videoları ve topluluğu hemen keşfet.';
    announcementLink = '#latest-video';
    announcementBtnText = 'Videolara Göz At ➔';
  }

  const isAnnouncementActive = announcement.isActive !== false && Boolean(announcementText);
  const featuredEndIso = featuredGw?.endDate && !Number.isNaN(new Date(featuredGw.endDate).getTime())
    ? new Date(featuredGw.endDate).toISOString()
    : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EkoYıldız — Resmi İçerik, Yayın & Çekiliş Portalı</title>
  
  <!-- OpenGraph & Twitter Meta Tags -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="EkoYıldız Resmi Portalı">
  <meta property="og:title" content="EkoYıldız — İzle. Katıl. Keşfet.">
  <meta property="og:description" content="Eko Yıldız resmi web sitesi. Roblox maceraları, YouTube serileri, canlı yayınlar, 10.000 Robux çekilişleri ve Discord topluluğunun tamamı burada.">
  <meta property="og:image" content="https://i.imgur.com/PFcAc6q.png">
  <meta name="theme-color" content="#f43f5e">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="EkoYıldız — İzle. Katıl. Keşfet.">
  <meta name="twitter:description" content="Videolar, canlı yayınlar, çekilişler ve EkoYıldız topluluğu tek adreste.">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-dark: #060813;
      --bg-surface: #0e1224;
      --bg-surface-elevated: #161c36;
      --bg-card: rgba(18, 24, 48, 0.75);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-glow: rgba(244, 63, 94, 0.35);
      --primary: #f43f5e;
      --primary-hover: #e11d48;
      --primary-glow: rgba(244, 63, 94, 0.4);
      --purple: #a855f7;
      --purple-glow: rgba(168, 85, 247, 0.35);
      --cyan: #00f2fe;
      --green: #22c55e;
      --yellow: #fbbf24;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --radius-lg: 24px;
      --radius-md: 16px;
      --radius-sm: 10px;
    }

    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text);
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.5;
      background-image: 
        radial-gradient(ellipse 60% 40% at 50% 0%, rgba(244, 63, 94, 0.12) 0%, transparent 60%),
        radial-gradient(circle 35% 35% at 85% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
        radial-gradient(circle 40% 40% at 15% 65%, rgba(0, 242, 254, 0.05) 0%, transparent 50%);
      background-attachment: fixed;
    }

    /* Ambient Background Grid Pattern */
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }

    /* ── Announcement Bar ── */
    .announcement-bar {
      background: linear-gradient(90deg, #991b1b, #f43f5e, #a855f7);
      color: #fff;
      padding: 0.6rem 1rem;
      font-size: 0.88rem;
      font-weight: 700;
      display: ${isAnnouncementActive ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(244, 63, 94, 0.35);
      animation: barSlideDown 0.4s ease;
    }
    @keyframes barSlideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
    .announcement-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .announcement-badge {
      background: rgba(0, 0, 0, 0.3);
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .announcement-link {
      color: #fff;
      text-decoration: underline;
      margin-left: 0.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      transition: opacity 0.2s;
    }
    .announcement-link:hover { opacity: 0.85; }
    .announcement-close {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      color: #fff;
      font-size: 1.1rem;
      cursor: pointer;
      opacity: 0.8;
      padding: 0 0.5rem;
    }
    .announcement-close:hover { opacity: 1; }

    /* ── Modern Sticky Navbar ── */
    .portal-nav {
      position: sticky;
      top: 0;
      z-index: 90;
      background: rgba(6, 8, 19, 0.82);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
      transition: all 0.3s ease;
    }
    .nav-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0.9rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
    }
    .brand-logo-wrap {
      position: relative;
      width: 42px;
      height: 42px;
    }
    .brand-logo-img {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      object-fit: cover;
      filter: drop-shadow(0 0 12px rgba(244, 63, 94, 0.5));
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .brand-logo-wrap:hover .brand-logo-img {
      transform: scale(1.1) rotate(5deg);
    }
    .brand-name {
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #fff;
      display: flex;
      flex-direction: column;
      line-height: 1;
    }
    .brand-tag {
      font-size: 0.65rem;
      color: var(--primary);
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 0.2rem;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      list-style: none;
    }
    .nav-item-link {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 700;
      font-size: 0.92rem;
      padding: 0.5rem 0.9rem;
      border-radius: 10px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .nav-item-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }
    .nav-item-link.highlight {
      color: #fff;
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Command Palette Button */
    .cmd-k-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 0.5rem 0.85rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cmd-k-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.2);
    }
    .cmd-k-key {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 4px;
      padding: 0.1rem 0.4rem;
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
      color: #cbd5e1;
    }

    .btn-portal-primary {
      background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
      color: #fff;
      font-weight: 800;
      font-size: 0.92rem;
      padding: 0.6rem 1.4rem;
      border-radius: 30px;
      border: 1px solid rgba(244, 63, 94, 0.5);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 20px rgba(244, 63, 94, 0.4);
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    .btn-portal-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(244, 63, 94, 0.6);
    }

    .btn-portal-outline {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-weight: 700;
      font-size: 0.92rem;
      padding: 0.6rem 1.3rem;
      border-radius: 30px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .btn-portal-outline:hover {
      border-color: rgba(244, 63, 94, 0.4);
      background: rgba(244, 63, 94, 0.1);
      color: #fda4af;
      transform: translateY(-2px);
    }

    .btn-portal-sm {
      font-size: 0.82rem;
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-weight: 700;
      text-decoration: none;
      background: var(--primary);
      color: #fff;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    /* ── Layout Containers ── */
    .portal-section {
      max-width: 1280px;
      margin: 4.5rem auto;
      padding: 0 1.5rem;
      position: relative;
      z-index: 10;
    }
    .section-title-wrap {
      text-align: center;
      margin-bottom: 2.75rem;
    }
    .section-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: rgba(244, 63, 94, 0.1);
      padding: 0.35rem 0.9rem;
      border-radius: 9999px;
      border: 1px solid rgba(244, 63, 94, 0.25);
      margin-bottom: 0.75rem;
    }
    .section-heading {
      font-size: clamp(2rem, 4.5vw, 3rem);
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #fff;
      line-height: 1.15;
    }
    .section-desc {
      font-size: 1.05rem;
      color: var(--text-muted);
      max-width: 640px;
      margin: 0.75rem auto 0;
      line-height: 1.6;
    }

    /* ── User Welcome Banner ── */
    .user-welcome-banner {
      background: linear-gradient(135deg, rgba(22, 28, 54, 0.85) 0%, rgba(14, 18, 36, 0.85) 100%);
      border: 1px solid rgba(244, 63, 94, 0.3);
      border-radius: var(--radius-md);
      padding: 1rem 1.5rem;
      margin: 1.5rem auto 0;
      max-width: 1280px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      flex-wrap: wrap;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .user-welcome-avatar img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid var(--primary);
      object-fit: cover;
    }
    .user-welcome-text {
      flex: 1;
      min-width: 240px;
    }
    .user-welcome-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #fff;
    }
    .user-welcome-title span { color: var(--primary); }
    .user-welcome-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }
    .user-welcome-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* ── 1. HERO SECTION ── */
    .hero-portal {
      position: relative;
      padding: 4rem 1.5rem 3rem;
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1.25fr 0.85fr;
      gap: 3.5rem;
      align-items: center;
      z-index: 10;
    }
    .hero-content {
      position: relative;
      z-index: 2;
    }
    .hero-greeting-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      padding: 0.4rem 1.1rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 1.25rem;
      backdrop-filter: blur(12px);
    }
    .hero-greeting-icon { font-size: 1.1rem; }
    .hero-main-title {
      font-size: clamp(2.8rem, 6vw, 4.5rem);
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.04em;
      margin-bottom: 1.25rem;
      color: #fff;
    }
    .hero-grad-text {
      background: linear-gradient(135deg, #fff 20%, #f43f5e 70%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-description {
      font-size: 1.15rem;
      color: #cbd5e1;
      line-height: 1.65;
      max-width: 580px;
      margin-bottom: 2.25rem;
      font-weight: 400;
    }
    .hero-actions-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }

    /* Live Status Pill in Hero */
    .hero-live-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(14, 18, 36, 0.8);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.75rem 1.25rem;
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }
    .live-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 10px #ef4444;
    }
    .live-dot.offline {
      background: #64748b;
      box-shadow: none;
    }

    /* Hero Interactive Mascot Showcase */
    .hero-mascot-scene {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      perspective: 1000px;
    }
    .mascot-ambient-circle {
      position: absolute;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(244, 63, 94, 0.3) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 70%);
      filter: blur(40px);
      animation: ambientPulse 5s infinite alternate ease-in-out;
      pointer-events: none;
    }
    @keyframes ambientPulse {
      0% { transform: scale(0.85); opacity: 0.5; }
      100% { transform: scale(1.15); opacity: 0.9; }
    }
    .mascot-character-img {
      width: 100%;
      max-width: 420px;
      height: auto;
      position: relative;
      z-index: 3;
      filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.7));
      /* Keep the mascot stable; pointer parallax used to make it jitter. */
      transform: translate3d(0, 0, 0);
      transition: filter 0.2s ease;
      user-select: none;
    }
    .mascot-floating-badge {
      position: absolute;
      background: rgba(14, 18, 36, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-sm);
      padding: 0.6rem 1rem;
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 4;
      font-size: 0.85rem;
      font-weight: 800;
      color: #fff;
      animation: floatBadge 3s infinite ease-in-out alternate;
    }
    .badge-top-right { top: 10%; right: 0%; }
    .badge-bottom-left { bottom: 8%; left: -5%; animation-delay: 1.5s; }
    @keyframes floatBadge {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-8px); }
    }

    /* ── 2. "ŞİMDİ NE VAR?" DYNAMIC WIDGET ── */
    .now-widget-box {
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
      border: 1px solid rgba(244, 63, 94, 0.3);
      border-radius: var(--radius-lg);
      padding: 1.75rem 2.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      flex-wrap: wrap;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
    }
    .now-widget-box::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(to bottom, #f43f5e, #a855f7);
    }
    .now-widget-info {
      flex: 1;
      min-width: 280px;
    }
    .now-badge {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: rgba(244, 63, 94, 0.2);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #fda4af;
      display: inline-block;
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
    }
    .now-title {
      font-size: 1.4rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 0.35rem;
    }
    .now-desc {
      font-size: 0.95rem;
      color: var(--text-muted);
    }

    /* ── 3. LATEST FEATURED VIDEO SECTION ── */
    .featured-video-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      transition: border-color 0.3s ease;
    }
    .featured-video-card:hover {
      border-color: rgba(239, 68, 68, 0.4);
    }
    .video-preview-thumb-box {
      position: relative;
      min-height: 360px;
      background: #000;
      overflow: hidden;
      cursor: pointer;
    }
    .video-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.85;
      transition: transform 0.5s ease, opacity 0.5s ease;
    }
    .video-preview-thumb-box:hover .video-thumb-img {
      transform: scale(1.05);
      opacity: 0.7;
    }
    .video-play-center-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      color: #fff;
      box-shadow: 0 0 30px rgba(239, 68, 68, 0.7);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .video-preview-thumb-box:hover .video-play-center-btn {
      transform: translate(-50%, -50%) scale(1.15);
    }
    .video-progress-line {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      width: 65%;
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
    }
    .video-info-content {
      padding: 2.75rem 2.25rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .video-category-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: #ef4444;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .video-heading {
      font-size: 1.65rem;
      font-weight: 900;
      line-height: 1.25;
      margin-bottom: 1rem;
      color: #fff;
    }
    .video-description {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.65;
      margin-bottom: 2rem;
    }

    /* ── 4. CONTENT JOURNEY TIMELINE ── */
    .journey-timeline-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      position: relative;
    }
    .journey-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      position: relative;
      transition: transform 0.3s ease, border-color 0.3s ease;
    }
    .journey-card:hover {
      transform: translateY(-5px);
      border-color: rgba(244, 63, 94, 0.4);
    }
    .journey-step-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }
    .journey-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 0.35rem;
    }
    .journey-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* ── 5. ACTIVE GIVEAWAYS SHOWCASE ── */
    .giveaway-highlight-card {
      background: linear-gradient(135deg, rgba(22, 28, 54, 0.95) 0%, rgba(14, 18, 36, 0.95) 100%);
      border: 2px solid rgba(168, 85, 247, 0.4);
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5rem;
      align-items: center;
      box-shadow: 0 20px 60px rgba(168, 85, 247, 0.15);
      position: relative;
      overflow: hidden;
    }
    .giveaway-highlight-card::after {
      content: "";
      position: absolute;
      top: -50%;
      right: -20%;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .countdown-grid {
      display: flex;
      gap: 0.75rem;
      margin: 1.5rem 0;
    }
    .countdown-box {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
      min-width: 68px;
      text-align: center;
    }
    .countdown-val {
      font-size: 1.5rem;
      font-weight: 900;
      color: #fbbf24;
      font-family: 'JetBrains Mono', monospace;
    }
    .countdown-label {
      font-size: 0.68rem;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 700;
      margin-top: 0.2rem;
    }

    /* ── 6. FEATURED SERIES ── */
    .series-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.75rem;
    }
    .series-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
    }
    .series-card:hover {
      transform: translateY(-6px);
      border-color: rgba(244, 63, 94, 0.4);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
    }
    .series-cover-box {
      height: 200px;
      position: relative;
      overflow: hidden;
    }
    .series-cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .series-card:hover .series-cover-img {
      transform: scale(1.08);
    }
    .series-badge {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 800;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .series-body {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .series-title {
      font-size: 1.25rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    .series-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.55;
      margin-bottom: 1.25rem;
      flex: 1;
    }

    /* ── 7. COMMUNITY PULSE ── */
    .pulse-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .pulse-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.75rem 1.25rem;
      text-align: center;
      transition: all 0.3s ease;
    }
    .pulse-card:hover {
      transform: translateY(-4px);
      border-color: rgba(244, 63, 94, 0.35);
      background: var(--bg-surface-elevated);
    }
    .pulse-icon {
      font-size: 2.2rem;
      margin-bottom: 0.75rem;
    }
    .pulse-stat {
      font-size: 2.25rem;
      font-weight: 900;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 0.25rem;
    }
    .pulse-label {
      font-size: 0.92rem;
      font-weight: 800;
      color: #fda4af;
      margin-bottom: 0.2rem;
    }
    .pulse-note {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* ── 8. OFFICIAL VERIFIED SOCIAL ACCOUNTS ── */
    .official-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .official-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.35rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      transition: all 0.25s ease;
    }
    .official-card:hover {
      transform: translateY(-3px);
      border-color: rgba(255, 255, 255, 0.25);
      background: var(--bg-surface-elevated);
    }
    .official-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .official-name {
      font-size: 1rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .official-handle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* ── 9. COMMAND PALETTE MODAL ── */
    .cmd-palette-overlay {
      position: fixed;
      inset: 0;
      background: rgba(4, 6, 15, 0.85);
      backdrop-filter: blur(12px);
      z-index: 1000;
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding: 6rem 1.5rem 2rem;
    }
    .cmd-palette-card {
      width: 100%;
      max-width: 600px;
      background: var(--bg-surface-elevated);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-lg);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8);
      overflow: hidden;
      animation: cmdPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes cmdPop {
      from { opacity: 0; transform: scale(0.96) translateY(-10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .cmd-search-input {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--border-subtle);
      padding: 1.25rem 1.5rem;
      font-size: 1.1rem;
      color: #fff;
      font-family: inherit;
      outline: none;
    }
    .cmd-list {
      max-height: 380px;
      overflow-y: auto;
      padding: 0.75rem;
    }
    .cmd-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-sm);
      color: #cbd5e1;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s;
    }
    .cmd-item:hover, .cmd-item.selected {
      background: rgba(244, 63, 94, 0.15);
      color: #fff;
    }
    .cmd-item-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 0.95rem;
    }

    /* ── 10. CUSTOM DESKTOP CURSOR ── */
    @media (pointer: fine) {
      .custom-cursor {
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(244, 63, 94, 0.5);
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: width 0.2s, height 0.2s, background-color 0.2s;
        z-index: 99999;
        mix-blend-mode: screen;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-weight: 900;
        color: #fff;
      }
      .custom-cursor.cursor-hover {
        width: 60px;
        height: 60px;
        background: rgba(244, 63, 94, 0.85);
        box-shadow: 0 0 20px rgba(244, 63, 94, 0.6);
      }
    }
    @media (pointer: coarse) {
      .custom-cursor { display: none !important; }
    }

    /* ── Mobile Responsive Styles ── */
    @media (max-width: 992px) {
      .hero-portal {
        grid-template-columns: 1fr;
        text-align: center;
        padding-top: 2rem;
        gap: 2rem;
      }
      .hero-description {
        margin-left: auto;
        margin-right: auto;
      }
      .hero-actions-row {
        justify-content: center;
      }
      .featured-video-card {
        grid-template-columns: 1fr;
      }
      .video-preview-thumb-box {
        min-height: 240px;
      }
      .journey-timeline-grid {
        grid-template-columns: 1fr 1fr;
      }
      .giveaway-highlight-card {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .countdown-grid {
        justify-content: center;
      }
      .nav-menu { display: none; }
    }

    @media (max-width: 600px) {
      .journey-timeline-grid {
        grid-template-columns: 1fr;
      }
      .portal-section {
        margin: 3rem auto;
      }
      .hero-main-title {
        font-size: 2.6rem;
      }
    }

    /* Accessibility: Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.001s !important;
        transition-duration: 0.001s !important;
      }
    }

    /* Footer */
    .portal-footer {
      border-top: 1px solid var(--border-subtle);
      background: #04050d;
      padding: 4rem 1.5rem 3rem;
      margin-top: 6rem;
      text-align: center;
      position: relative;
      z-index: 10;
    }
    .footer-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.3rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 1rem;
    }
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin: 1.5rem 0 2rem;
      list-style: none;
    }
    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    .footer-links a:hover { color: #fff; }
  </style>
</head>
<body>

  <!-- Custom Cursor Element (Desktop Only) -->
  <div class="custom-cursor" id="customCursor"></div>

  ${isAnnouncementActive ? `
  <!-- Announcement Bar -->
  <aside class="announcement-bar" id="announcementBar" role="region" aria-label="Duyuru">
    <div class="announcement-content">
      <span class="announcement-badge">${escapeHtml(announcement.badge || 'DUYURU')}</span>
      <span>${escapeHtml(announcementText)}</span>
      <a href="${safeUrl(announcementLink, '/cekilisler')}" class="announcement-link">
        ${escapeHtml(announcementBtnText)}
      </a>
    </div>
    <button class="announcement-close" onclick="dismissAnnouncement()" aria-label="Duyuruyu Kapat">✕</button>
  </aside>
  ` : ''}

  <!-- Sticky Navbar -->
  <header class="portal-nav">
    <div class="nav-inner">
      <a href="/" class="nav-brand" onclick="handleLogoClick(event)">
        <div class="brand-logo-wrap">
          <img src="https://i.imgur.com/PFcAc6q.png" alt="EkoYıldız Logo" class="brand-logo-img">
        </div>
        <div class="brand-name">
          <span>EKOYILDIZ</span>
          <span class="brand-tag">Resmi Portalı</span>
        </div>
      </a>

      <nav>
        <ul class="nav-menu">
          <li><a href="/" class="nav-item-link">Ana Sayfa</a></li>
          <li><a href="#latest-video" class="nav-item-link">🎬 Videolar</a></li>
          <li><a href="/cekilisler" class="nav-item-link highlight">🎁 Çekilişler</a></li>
          <li><a href="/yardim" class="nav-item-link">❔ Yardım & Blog</a></li>
          <li><a href="/ekoyildizda-calis" class="nav-item-link">EkoYıldız'da Çalış</a></li>
          <li><a href="#social-hub" class="nav-item-link">📱 Sosyal Hub</a></li>
          <li><a href="#series-section" class="nav-item-link">📚 Seriler</a></li>
          <li><a href="#community-section" class="nav-item-link">👥 Topluluk</a></li>
        </ul>
      </nav>

      <div class="nav-actions">
        <button class="cmd-k-btn" onclick="openCommandPalette()" title="Hızlı Arama & Komutlar (Ctrl+K)">
          <span>🔍</span>
          <span class="cmd-k-key">Ctrl + K</span>
        </button>

        ${user ? `
          <a href="/dashboard" class="btn-portal-primary" style="padding: 0.55rem 1.2rem;">
            🚀 Panelim
          </a>
          <a href="/logout" style="color:var(--text-muted); font-size:0.85rem; text-decoration:none; margin-left:0.25rem;">
            Çıkış
          </a>
        ` : `
          <a href="/login" class="btn-portal-primary" style="text-decoration:none;">
            Giriş Yap
          </a>
        `}
      </div>
    </div>
  </header>

  <!-- Logged in User Personalization Banner (if session exists) -->
  ${userStatsHtml}

  <!-- 1. HERO SECTION -->
  <section class="hero-portal" id="hero">
    <div class="hero-content">
      <!-- Dynamic Time Greeting Pill -->
      <div class="hero-greeting-pill">
        <span class="hero-greeting-icon">${greeting.icon}</span>
        <span>${greeting.text}</span>
      </div>

      <h1 class="hero-main-title">
        EKOYILDIZ<br>
        <span class="hero-grad-text">${config.hero?.tagline || 'İzle. Katıl. Keşfet.'}</span>
      </h1>

      <p class="hero-description">
        ${config.hero?.subtitle || 'Videolar, canlı yayınlar, çekilişler ve EkoYıldız topluluğunun tamamı burada.'}
      </p>

      <div class="hero-actions-row">
        <a href="${config.hero?.primaryCtaLink || '#latest-video'}" class="btn-portal-primary" data-cursor="WATCH">
          ${config.hero?.primaryCtaText || 'Son Videoyu İzle 🎬'}
        </a>
        <a href="${config.hero?.secondaryCtaLink || '/cekilisler'}" class="btn-portal-outline" data-cursor="OPEN">
          ${config.hero?.secondaryCtaText || 'Çekilişlere Katıl 🎁'}
        </a>
      </div>

      <!-- Live Status Honest Indicator -->
      <div class="hero-live-status-pill">
        <div class="live-dot ${config.liveStatus?.isLive ? '' : 'offline'}"></div>
        <div>
          <div style="font-size: 0.85rem; font-weight: 800; color: #fff;">
            ${config.liveStatus?.isLive ? '🔴 ŞU ANDA CANLI YAYINDA' : '⚪ YAYIN DURUMU: OFFLINE'}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            ${config.liveStatus?.statusText || 'Şu anda yayın yok ama son yayını kaçırmış olabilirsin!'}
          </div>
        </div>
      </div>
    </div>

    <!-- Mascot Interactive Showcase -->
    <div class="hero-mascot-scene" id="mascotScene">
      <div class="mascot-ambient-circle"></div>
      <img src="https://i.imgur.com/NzyMqMK.png" alt="EkoYıldız Maskot" class="mascot-character-img" id="mascotImg">
      <div class="mascot-floating-badge badge-top-right">
        <span>🎮</span> 100K+ Topluluk
      </div>
      <div class="mascot-floating-badge badge-bottom-left" title="Tıkla ve sürprizi gör!" onclick="triggerEasterEgg()">
        <span>⭐</span> Resmi Eko Portalı
      </div>
    </div>
  </section>

  <!-- 2. "ŞİMDİ NE VAR?" DYNAMIC PRIORITY WIDGET -->
  <section class="portal-section" style="margin-top: 1rem; margin-bottom: 3.5rem;">
    <div class="now-widget-box">
      <div class="now-widget-info">
        <span class="now-badge">${escapeHtml(nowWidget.badge)}</span>
        <h3 class="now-title">${escapeHtml(nowWidget.title)}</h3>
        <p class="now-desc">${escapeHtml(nowWidget.desc)}</p>
      </div>
      <a href="${safeUrl(nowWidget.btnLink, '/')}" class="btn-portal-primary" data-cursor="GO">
        ${escapeHtml(nowWidget.btnText)}
      </a>
    </div>
  </section>

  <!-- 3. SON VİDEO (FEATURED VIDEO SECTION) -->
  <section class="portal-section" id="latest-video">
    <div class="section-title-wrap">
      <div class="section-eyebrow">📺 EN YENİ YOUTUBE BÖLÜMÜ</div>
      <h2 class="section-heading">Eko Yıldız <span style="color:var(--primary);">Son Videosu</span></h2>
      <p class="section-desc">Roblox dünyasından en komik anlar, kaçış parkurları ve sürpriz mücadeleler.</p>
    </div>

    <div class="featured-video-card">
      <div class="video-preview-thumb-box" onclick="window.open('${config.featuredVideo?.youtubeUrl || 'https://www.youtube.com/@eko8yildiz'}', '_blank')" data-cursor="WATCH">
        <img src="${config.featuredVideo?.thumbnailUrl || 'https://images.unsplash.com/photo-1612287233207-68b37583624c?q=80&w=1200'}" alt="${config.featuredVideo?.title || 'Son Video'}" class="video-thumb-img">
        <div class="video-play-center-btn">▶</div>
        <div class="video-progress-line"></div>
      </div>

      <div class="video-info-content">
        <div class="video-category-tag">${config.featuredVideo?.category || 'ROBLOX ÖZEL'} &bull; ${config.featuredVideo?.publishedAt || 'YENİ'}</div>
        <h3 class="video-heading">${config.featuredVideo?.title || 'Roblox En Zor Kaçış Haritası'}</h3>
        <p class="video-description">
          ${config.featuredVideo?.description || 'Eko Yıldız ve ekibin en yeni Roblox serüvenini izle, yorumlarda yerini al!'}
        </p>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <a href="${config.featuredVideo?.youtubeUrl || 'https://www.youtube.com/@eko8yildiz'}" target="_blank" rel="noopener noreferrer" class="btn-portal-primary" data-cursor="YOUTUBE">
            Şimdi YouTube'da İzle ➔
          </a>
          <a href="https://www.youtube.com/@eko8yildiz?sub_confirmation=1" target="_blank" rel="noopener noreferrer" class="btn-portal-outline">
            🔔 Abone Ol
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- 4. CONTENT JOURNEY TIMELINE -->
  <section class="portal-section">
    <div class="section-title-wrap">
      <div class="section-eyebrow">🗺️ İÇERİK YOLCULUĞU</div>
      <h2 class="section-heading">EkoYıldız <span style="color:var(--cyan);">Ekosistemi</span></h2>
      <p class="section-desc">Sitede adım adım içerikleri keşfet ve topluluğun ritmine katıl.</p>
    </div>

    <div class="journey-timeline-grid">
      <div class="journey-card">
        <div class="journey-step-num">01 // VİDEOLAR</div>
        <h4 class="journey-title">Son Bölümü İzle</h4>
        <p class="journey-desc">Her hafta düzenli olarak yayınlanan Roblox challenge ve komik maceralar.</p>
      </div>
      <div class="journey-card">
        <div class="journey-step-num">02 // ÇEKİLİŞLER</div>
        <h4 class="journey-title">Şansını Dene</h4>
        <p class="journey-desc">Robux, Discord Nitro ve özel hediyeler için görevleri tamamla, bilet kazan.</p>
      </div>
      <div class="journey-card">
        <div class="journey-step-num">03 // CANLI YAYIN</div>
        <h4 class="journey-title">Yayınlara Katıl</h4>
        <p class="journey-desc">Kick ve Twitch canlı yayınlarında Eko ile beraber oyna ve sohbete dahil ol.</p>
      </div>
      <div class="journey-card">
        <div class="journey-step-num">04 // TOPLULUK</div>
        <h4 class="journey-title">Discord Ailesi</h4>
        <p class="journey-desc">5.000+ aktif üye ile oyun odaları, çekiliş sohbetleri ve 7/24 kesintisiz destek.</p>
      </div>
    </div>
  </section>

  <!-- 5. AKTİF ÇEKİLİŞLER BÖLÜMÜ -->
  <section class="portal-section" id="giveaways-section">
    <div class="section-title-wrap">
      <div class="section-eyebrow">🎁 KAZANMA ZAMANI</div>
      <h2 class="section-heading">Ödüllü <span style="color:#a855f7;">Çekilişler</span></h2>
      <p class="section-desc">Tamamen şeffaf ve kriptografik rastgelelikle belirlenen ödüllere hemen katılın.</p>
    </div>

    ${featuredGw ? `
      <div class="giveaway-highlight-card">
        <div>
          <span style="font-size:0.75rem; font-weight:800; color:#22c55e; background:rgba(34,197,94,0.15); padding:0.25rem 0.75rem; border-radius:9999px; border:1px solid rgba(34,197,94,0.3);">
            🟢 ŞU ANDA AKTİF ÇEKİLİŞ
          </span>
          <h3 style="font-size:1.85rem; font-weight:900; color:#fff; margin:0.75rem 0 0.5rem;">${escapeHtml(featuredGw.title)}</h3>
          <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:1.25rem;">
            Ödül: <strong style="color:#fbbf24;">${escapeHtml(featuredGw.prize || 'Belirtilmedi')}</strong> &bull; Katılımcı: <strong style="color:#fff;">${Number(featuredGw.totalParticipants || 0).toLocaleString('tr-TR')}</strong>
          </p>

          <!-- Live Countdown Timer -->
          <div class="countdown-grid" id="gwCountdown" data-end="${escapeHtml(featuredEndIso)}">
            <div class="countdown-box">
              <div class="countdown-val" id="cdDays">00</div>
              <div class="countdown-label">GÜN</div>
            </div>
            <div class="countdown-box">
              <div class="countdown-val" id="cdHours">00</div>
              <div class="countdown-label">SAAT</div>
            </div>
            <div class="countdown-box">
              <div class="countdown-val" id="cdMinutes">00</div>
              <div class="countdown-label">DAKİKA</div>
            </div>
            <div class="countdown-box">
              <div class="countdown-val" id="cdSeconds">00</div>
              <div class="countdown-label">SANİYE</div>
            </div>
          </div>

          <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-top:1.5rem;">
            <a href="/cekilisler/${encodeURIComponent(featuredGw.slug || featuredGw._id)}" class="btn-portal-primary" style="background:linear-gradient(135deg, #a855f7, #ec4899);">
              🎯 Şansını Dene & Katıl ➔
            </a>
            <a href="/cekilisler" class="btn-portal-outline">
              Tüm Çekilişleri Gör
            </a>
          </div>
        </div>

        <div style="text-align:center;">
          <img src="${safeUrl(featuredGw.coverImage, 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=600')}" alt="${escapeHtml(featuredGw.title)}" style="width:100%; max-width:420px; border-radius:var(--radius-md); box-shadow:0 15px 35px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.15);">
        </div>
      </div>
    ` : `
      <div style="background:var(--bg-surface); border:1px dashed var(--border-subtle); border-radius:var(--radius-lg); padding:3rem; text-align:center;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">🎁</div>
        <h3 style="font-size:1.3rem; font-weight:800; color:#fff; margin-bottom:0.5rem;">Şu anda aktif çekiliş yok</h3>
        <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:1.5rem;">Yeni Robux ve hediye çekilişleri çok yakında başlayacak. Bildirimleri açmayı unutma!</p>
        <a href="/cekilisler" class="btn-portal-outline">Çekilişler Sayfasını Ziyaret Et</a>
      </div>
    `}
  </section>

  <!-- 6. INTERACTIVE SOCIAL HUB (SPECIAL REDESIGNED SOCIAL CAMPAIGNS) -->
  <div id="social-hub">
    ${socialHubService.renderSocialHubHtml()}
  </div>

  <!-- 7. ÖNE ÇIKAN YOUTUBE SERİLERİ -->
  <section class="portal-section" id="series-section">
    <div class="section-title-wrap">
      <div class="section-eyebrow">📂 ÖZEL İÇERİK LİSTELERİ</div>
      <h2 class="section-heading">EkoYıldız <span style="color:var(--yellow);">Serileri</span></h2>
      <p class="section-desc">Milyonlarca izlenen serilere göz at, baştan sona kesintisiz eğlenceyi yaşa.</p>
    </div>

    <div class="series-grid">
      ${(config.seriesList || []).map(s => `
        <div class="series-card" onclick="window.open('${s.url}', '_blank')">
          <div class="series-cover-box">
            <img src="${s.coverImage}" alt="${s.title}" class="series-cover-img">
            <span class="series-badge">${s.episodeCount} BÖLÜM &bull; ${s.tag}</span>
          </div>
          <div class="series-body">
            <h3 class="series-title">${s.title}</h3>
            <p class="series-desc">${s.description}</p>
            <div style="font-size:0.8rem; color:#fda4af; font-weight:700; margin-bottom:1rem;">
              Son Bölüm: ${s.lastEpisode}
            </div>
            <div style="margin-top:auto;">
              <span class="btn-portal-outline" style="width:100%; justify-content:center; padding:0.5rem;">
                ▶ Seriyi İzle
              </span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </section>

  <!-- 8. COMMUNITY PULSE & DISCORD HUB -->
  <section class="portal-section" id="community-section">
    <div class="section-title-wrap">
      <div class="section-eyebrow">⚡ CANLI TOPLULUK NABZI</div>
      <h2 class="section-heading">Toplulukta <span style="color:#22c55e;">Neler Oluyor?</span></h2>
      <p class="section-desc">Ekocanlar ailesi her geçen gün büyüyor. İşte anlık rakamlar ve topluluk gücü.</p>
    </div>

    <div class="pulse-grid" style="margin-bottom: 2.5rem;">
      ${pulseStats.map(p => `
        <div class="pulse-card">
          <div class="pulse-icon">${escapeHtml(p.icon)}</div>
          <div class="pulse-stat">${escapeHtml(p.stat)}</div>
          <div class="pulse-label">${escapeHtml(p.label)}</div>
          <div class="pulse-note">${escapeHtml(p.note)}</div>
        </div>
      `).join('')}
    </div>

    <!-- Discord Live Embed Container -->
    <div style="background:var(--bg-surface); border:1px solid rgba(88,101,242,0.3); border-radius:var(--radius-lg); padding:2.25rem; display:grid; grid-template-columns:1fr 380px; gap:2.5rem; align-items:center; box-shadow:0 15px 40px rgba(0,0,0,0.5);">
      <div>
        <span style="font-size:0.75rem; font-weight:800; color:#818cf8; letter-spacing:0.08em; text-transform:uppercase;">RESMİ DİSCORD SUNUCUMUZ</span>
        <h3 style="font-size:2rem; font-weight:900; color:#fff; margin:0.5rem 0 1rem;">EkoYıldız Discord Ailesi</h3>
        <p style="color:var(--text-muted); font-size:1rem; line-height:1.7; margin-bottom:1.75rem;">
          Yayın bildirimleri, çekiliş duyuruları, Roblox eşya takasları ve sesli oyun odalarında binlerce Ekocan seni bekliyor.
        </p>
        <a href="https://discord.gg/1367646464804655104" target="_blank" rel="noopener noreferrer" class="btn-portal-primary" style="background:#5865F2; border-color:#5865F2;">
          💬 Discord'a Katıl ➔
        </a>
      </div>
      <div>
        <iframe src="https://ptb.discord.com/widget?id=1367646464804655104&theme=dark" width="100%" height="340" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" style="border-radius:16px; border:1px solid rgba(88,101,242,0.3);"></iframe>
      </div>
    </div>
  </section>

  <!-- 9. RESMİ DOĞRULANMIŞ HESAPLAR -->
  <section class="portal-section">
    <div class="section-title-wrap">
      <div class="section-eyebrow">🛡️ GÜVENLİK & ŞEFFAFLIK</div>
      <h2 class="section-heading">Resmi <span style="color:var(--cyan);">Hesaplarımız</span></h2>
      <p class="section-desc">Sahte hesaplara aldanmayın. EkoYıldız'ın tüm resmi platformları aşağıda doğrulanmıştır.</p>
    </div>

    <div class="official-grid">
      <a href="https://www.youtube.com/@eko8yildiz" target="_blank" rel="noopener noreferrer" class="official-card">
        <div class="official-icon" style="background:rgba(239,68,68,0.15); color:#ef4444;">▶</div>
        <div>
          <div class="official-name">YouTube Ana Kanal <span style="color:#38bdf8;">✓</span></div>
          <div class="official-handle">@eko8yildiz</div>
        </div>
      </a>

      <a href="https://www.youtube.com/@eko8yildiz2" target="_blank" rel="noopener noreferrer" class="official-card">
        <div class="official-icon" style="background:rgba(251,191,36,0.15); color:#fbbf24;">🔓</div>
        <div>
          <div class="official-name">YouTube Yedek / 2 <span style="color:#38bdf8;">✓</span></div>
          <div class="official-handle">@eko8yildiz2</div>
        </div>
      </a>

      <a href="https://www.tiktok.com/@kimdirbueko" target="_blank" rel="noopener noreferrer" class="official-card">
        <div class="official-icon" style="background:rgba(0,242,254,0.15); color:#00f2fe;">🎵</div>
        <div>
          <div class="official-name">TikTok <span style="color:#38bdf8;">✓</span></div>
          <div class="official-handle">@kimdirbueko</div>
        </div>
      </a>

      <a href="https://kick.com/ekoyildiz" target="_blank" rel="noopener noreferrer" class="official-card">
        <div class="official-icon" style="background:rgba(83,252,24,0.15); color:#53fc18;">🟢</div>
        <div>
          <div class="official-name">Kick Canlı Yayın <span style="color:#38bdf8;">✓</span></div>
          <div class="official-handle">kick.com/ekoyildiz</div>
        </div>
      </a>

      <a href="https://www.twitch.tv/ekoyildiz" target="_blank" rel="noopener noreferrer" class="official-card">
        <div class="official-icon" style="background:rgba(145,71,255,0.15); color:#9146ff;">💜</div>
        <div>
          <div class="official-name">Twitch <span style="color:#38bdf8;">✓</span></div>
          <div class="official-handle">twitch.tv/ekoyildiz</div>
        </div>
      </a>

      <a href="https://www.instagram.com/ekonqt/" target="_blank" rel="noopener noreferrer" class="official-card">
        <div class="official-icon" style="background:rgba(225,48,108,0.15); color:#e1306c;">📸</div>
        <div>
          <div class="official-name">Instagram (Eko) <span style="color:#38bdf8;">✓</span></div>
          <div class="official-handle">@ekonqt</div>
        </div>
      </a>

      <a href="https://www.instagram.com/egee7dino/" target="_blank" rel="noopener noreferrer" class="official-card">
        <div class="official-icon" style="background:rgba(236,72,153,0.15); color:#ec4899;">✨</div>
        <div>
          <div class="official-name">Instagram (Ege) <span style="color:#38bdf8;">✓</span></div>
          <div class="official-handle">@egee7dino</div>
        </div>
      </a>
    </div>
  </section>

  <!-- 10. COMMAND PALETTE MODAL (CTRL + K) -->
  <div class="cmd-palette-overlay" id="cmdPalette" onclick="handleCmdOverlayClick(event)">
    <div class="cmd-palette-card">
      <input type="text" id="cmdSearchInput" class="cmd-search-input" placeholder="Sayfada ara veya komut yaz... (Örn: Çekiliş, YouTube, Discord)" oninput="filterCmdList()">
      <div class="cmd-list" id="cmdList">
        <a href="#latest-video" class="cmd-item" onclick="closeCommandPalette()">
          <div class="cmd-item-left"><span>🎬</span> Son Videoyu İzle</div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Bölüme Git</span>
        </a>
        <a href="/cekilisler" class="cmd-item" onclick="closeCommandPalette()">
          <div class="cmd-item-left"><span>🎁</span> Çekilişleri Aç</div>
          <span style="font-size:0.75rem; color:#22c55e;">Aktif Ödüller</span>
        </a>
        <a href="https://www.youtube.com/@eko8yildiz" target="_blank" class="cmd-item" onclick="closeCommandPalette()">
          <div class="cmd-item-left"><span>▶</span> YouTube Ana Kanalı</div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Dış Bağlantı</span>
        </a>
        <a href="https://discord.gg/1367646464804655104" target="_blank" class="cmd-item" onclick="closeCommandPalette()">
          <div class="cmd-item-left"><span>💬</span> Discord Sunucusu</div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Topluluk</span>
        </a>
        <a href="https://kick.com/ekoyildiz" target="_blank" class="cmd-item" onclick="closeCommandPalette()">
          <div class="cmd-item-left"><span>🟢</span> Kick Canlı Yayın</div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Canlı</span>
        </a>
        <a href="https://www.instagram.com/ekonqt/" target="_blank" class="cmd-item" onclick="closeCommandPalette()">
          <div class="cmd-item-left"><span>📸</span> Instagram (@ekonqt)</div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Profil</span>
        </a>
        <a href="#series-section" class="cmd-item" onclick="closeCommandPalette()">
          <div class="cmd-item-left"><span>📚</span> Özel Seriler</div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Rehberler</span>
        </a>
        ${user ? `
          <a href="/dashboard" class="cmd-item" onclick="closeCommandPalette()">
            <div class="cmd-item-left"><span>🚀</span> Kullanıcı Dashboard</div>
            <span style="font-size:0.75rem; color:#38bdf8;">Hesabım</span>
          </a>
        ` : `
          <a href="/login" class="cmd-item" onclick="closeCommandPalette();">
            <div class="cmd-item-left"><span>🔑</span> Giriş Yap</div>
            <span style="font-size:0.75rem; color:#f43f5e;">Oturum Aç</span>
          </a>
        `}
      </div>
    </div>
  </div>

  <!-- 11. LOGIN MODAL (PRESERVED SYSTEM) -->
  <div class="modal-overlay" id="loginModal">
    <div class="modal-card">
      <button class="modal-close" onclick="closeLoginModal()">✕</button>
      
      <div style="text-align:center; margin-bottom:1.5rem;">
        <h3 style="font-size:1.6rem; font-weight:800; margin-bottom:0.4rem;">Giriş Yap</h3>
        <p style="color:var(--text-muted); font-size:0.9rem;">EkoYıldız portalına erişmek için giriş yöntemi seçin</p>
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
        <div style="text-align:center; color:var(--text-muted); font-size:0.8rem; margin:0.8rem 0;">VEYA DM Kodu ile:</div>
        <input type="text" id="dmUsernameInput" class="input-box" placeholder="Discord Kullanıcı Adınız">
        <button onclick="requestDiscordDMCode()" class="btn-submit-modal" style="background:rgba(255,255,255,0.08); box-shadow:none;">DM ile Giriş Kodu İste</button>
        <div id="dmCodeVerifyBox" style="display:none; margin-top:0.8rem;">
          <input type="text" id="dmCodeInput" class="input-box" placeholder="DM'den Gelen 6 Haneli Kod">
          <button onclick="verifyDiscordDMCode()" class="btn-submit-modal">Kodu Doğrula & Giriş Yap</button>
        </div>
      </div>

      <div id="tab-roblox" style="display:none;">
        <a href="/auth/roblox" class="btn-submit-modal" style="display:flex; align-items:center; justify-content:center; gap:0.6rem; text-decoration:none; background:#000; border:1px solid rgba(255,255,255,0.2);">
          Roblox OAuth ile Giriş Yap
        </a>
      </div>

      <div id="tab-username" style="display:none;">
        <input type="text" id="usernameCheckInput" class="input-box" placeholder="Kullanıcı Adınız">
        <button onclick="checkUsernameSubmit()" class="btn-submit-modal">Devam Et</button>
        <div id="passwordStepBox" style="display:none; margin-top:0.8rem;">
          <input type="password" id="pinInput" class="input-box" placeholder="Şifreniz">
          <button onclick="submitPinLogin()" class="btn-submit-modal">Şifreyle Giriş Yap</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="portal-footer">
    <div class="footer-logo">
      <img src="https://i.imgur.com/PFcAc6q.png" alt="EkoYıldız" style="width:32px; height:32px; border-radius:8px;">
      <span>EKOYILDIZ · PHIBI PORTALI</span>
    </div>
    <p style="color:var(--text-muted); font-size:0.9rem; max-width:500px; margin:0 auto;">
      Roblox içerikleri, topluluk etkinlikleri ve Phibi destek akışı tek yerde. Tüm hakları saklıdır.
    </p>
    <ul class="footer-links">
      <li><a href="/">Ana Sayfa</a></li>
      <li><a href="/cekilisler">Çekilişler</a></li>
      <li><a href="/status">Sistem Durumu</a></li>
      <li><a href="/yardim">SSS & Blog</a></li>
      <li><a href="https://discord.gg/1367646464804655104" target="_blank">Discord Destek</a></li>
    </ul>
    <div style="font-size:0.8rem; color:#64748b;">
      &copy; 2026 EkoYıldız. Bu platform Eko Yıldız resmi topluluğu için geliştirilmiştir.
    </div>
  </footer>

  <!-- ── Interactive Logic Scripts ── -->
  <script>
    // 1. Announcement dismiss
    function dismissAnnouncement() {
      const bar = document.getElementById('announcementBar');
      if (bar) bar.style.display = 'none';
      sessionStorage.setItem('ekoyildiz_announcement_dismissed', '1');
    }
    if (sessionStorage.getItem('ekoyildiz_announcement_dismissed') === '1') {
      const b = document.getElementById('announcementBar');
      if (b) b.style.display = 'none';
    }

    // 2. Command Palette (Ctrl + K)
    function openCommandPalette() {
      const p = document.getElementById('cmdPalette');
      if (p) {
        p.style.display = 'flex';
        const input = document.getElementById('cmdSearchInput');
        if (input) {
          input.value = '';
          input.focus();
        }
        filterCmdList();
      }
    }
    function closeCommandPalette() {
      const p = document.getElementById('cmdPalette');
      if (p) p.style.display = 'none';
    }
    function handleCmdOverlayClick(e) {
      if (e.target.id === 'cmdPalette') closeCommandPalette();
    }
    document.addEventListener('keydown', function(e) {
      const key = String(e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
      if (e.key === 'Escape') {
        closeCommandPalette();
        closeLoginModal();
      }
    });

    function filterCmdList() {
      const query = (document.getElementById('cmdSearchInput')?.value || '').toLowerCase().trim();
      const items = document.querySelectorAll('.cmd-item');
      items.forEach(function(el) {
        const text = el.innerText.toLowerCase();
        if (!query || text.includes(query)) {
          el.style.display = 'flex';
        } else {
          el.style.display = 'none';
        }
      });
    }

    // 3. Mini Interactive Easter Eggs
    let logoClickCount = 0;
    function handleLogoClick(e) {
      logoClickCount++;
      if (logoClickCount === 5) {
        e.preventDefault();
        triggerEasterEgg();
        logoClickCount = 0;
      }
    }

    function triggerEasterEgg() {
      alert("🎉 TEBRİKLER EKOCAN! Gizli Easter Egg'i yakaladın! EkoYıldız süper gücü aktif.");
      document.body.style.filter = "hue-rotate(90deg)";
      setTimeout(function() {
        document.body.style.filter = "none";
      }, 3500);
    }

    // Konami Code Easter Egg (Up Up Down Down Left Right Left Right B A)
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    document.addEventListener('keydown', function(e) {
      const key = String(e.key || '');
      if (key === konamiCode[konamiIndex] || key.toLowerCase() === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          alert("🎮 GİZLİ EKOCAN KONAMİ KODU AÇILDI! Burayı bulduysan gerçekten siteyi kurcalıyorsun 😎");
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    });

    // 4. Custom Desktop Cursor
    const cursor = document.getElementById('customCursor');
    if (cursor && window.matchMedia('(pointer: fine)').matches) {
      document.addEventListener('mousemove', function(e) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      });

      document.querySelectorAll('a, button, [data-cursor]').forEach(function(el) {
        el.addEventListener('mouseenter', function() {
          cursor.classList.add('cursor-hover');
          const txt = el.getAttribute('data-cursor');
          cursor.innerText = txt || '➔';
        });
        el.addEventListener('mouseleave', function() {
          cursor.classList.remove('cursor-hover');
          cursor.innerText = '';
        });
      });
    }

    // 6. Live Giveaway Countdown Timer
    function startCountdown() {
      const box = document.getElementById('gwCountdown');
      if (!box) return;
      const endStr = box.getAttribute('data-end');
      if (!endStr) return;
      const endTime = new Date(endStr).getTime();

      function update() {
        const now = Date.now();
        const diff = Math.max(0, endTime - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        const dEl = document.getElementById('cdDays');
        const hEl = document.getElementById('cdHours');
        const mEl = document.getElementById('cdMinutes');
        const sEl = document.getElementById('cdSeconds');

        if (dEl) dEl.innerText = String(days).padStart(2, '0');
        if (hEl) hEl.innerText = String(hours).padStart(2, '0');
        if (mEl) mEl.innerText = String(mins).padStart(2, '0');
        if (sEl) sEl.innerText = String(secs).padStart(2, '0');
      }

      update();
      setInterval(update, 1000);
    }
    startCountdown();

    // 7. Login Modal Handlers
    function openLoginModal() {
      const m = document.getElementById('loginModal');
      if (m) m.style.display = 'flex';
    }
    function closeLoginModal() {
      const m = document.getElementById('loginModal');
      if (m) m.style.display = 'none';
    }
    function switchLoginTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const dTab = document.getElementById('tab-discord');
      const rTab = document.getElementById('tab-roblox');
      const uTab = document.getElementById('tab-username');
      if (dTab) dTab.style.display = 'none';
      if (rTab) rTab.style.display = 'none';
      if (uTab) uTab.style.display = 'none';

      if (tab === 'discord') {
        document.querySelectorAll('.tab-btn')[0]?.classList.add('active');
        if (dTab) dTab.style.display = 'block';
      } else if (tab === 'roblox') {
        document.querySelectorAll('.tab-btn')[1]?.classList.add('active');
        if (rTab) rTab.style.display = 'block';
      } else {
        document.querySelectorAll('.tab-btn')[2]?.classList.add('active');
        if (uTab) uTab.style.display = 'block';
      }
    }

    async function requestDiscordDMCode() {
      const username = document.getElementById('dmUsernameInput')?.value.trim();
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
          window.location.href = '/login?register=1&username=' + encodeURIComponent(username);
        }
      } catch (err) {
        window.location.href = '/login?register=1&username=' + encodeURIComponent(username);
      }
    }

    async function verifyDiscordDMCode() {
      const code = document.getElementById('dmCodeInput')?.value.trim();
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
      const username = document.getElementById('usernameCheckInput')?.value.trim();
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
          window.location.href = '/login?register=1&username=' + encodeURIComponent(username);
        }
      } catch (err) {
        window.location.href = '/login?register=1&username=' + encodeURIComponent(username);
      }
    }

    async function submitPinLogin() {
      const pin = document.getElementById('pinInput')?.value.trim();
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

module.exports = { renderMainHomePage };
