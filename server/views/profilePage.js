'use strict';

function _esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
  '35898429': 'TTC',
  '35431216': 'EKO',
  '35757415': 'CTE',
  '17241052': 'TFD',
  '11517908': 'TMT',
  '33499704': 'TMA',
  '8505535': 'BEM',
};

function renderProfilePage(user, profileUser, isOwn = false, robloxGroups = [], _layout) {
  if (!profileUser) profileUser = user;
  if (!profileUser) {
    const errorHtml = '<div class="card" style="max-width:600px;margin:3rem auto;padding:2rem;text-align:center;"><h1>Profil bulunamadı.</h1><p>Bu kullanıcı mevcut değil veya profili yüklenemedi.</p><a href="/" class="btn" style="margin-top:1rem;">Ana Sayfaya Dön</a></div>';
    return _layout ? _layout('Profil bulunamadı', user, errorHtml) : errorHtml;
  }

  const displayName = _esc(profileUser.discordUsername || profileUser.username || 'EkoYıldız üyesi');
  const accent = _esc(profileUser.profileColor || '#7c6af7');
  const bannerBg = profileUser.discordBanner
    ? `url(${_esc(profileUser.discordBanner)}) center/cover no-repeat`
    : `radial-gradient(130% 120% at 50% -15%, ${accent}99 0%, rgba(124,106,247,0.4) 45%, #090a14 100%)`;
  const avatarSrc = _esc(profileUser.discordAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png');

  // Roblox group badges
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
          border: style.border,
        });
      }
    }
  }

  const roleBadgesHtml = badgesList.map(r =>
    `<span class="p-badge" style="background:${r.bg};color:${r.color};border-color:${r.border};">${_esc(r.name)}</span>`
  ).join('');

  const targetId = _esc(profileUser.discordId || '');

  const content = `
  <style>
    main { max-width: 100% !important; padding: 0 !important; }
    ${profileUser.profileBgUrl ? `
      body { background: url('${_esc(profileUser.profileBgUrl)}') center/cover no-repeat fixed !important; }
    ` : ''}

    /* ── Profile Keyframe Animations ── */
    @keyframes aurora { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    @keyframes fireAni { 0%,100%{filter:hue-rotate(0deg) brightness(1.05)} 50%{filter:hue-rotate(28deg) brightness(1.35)} }
    @keyframes galaxy { 0%{background-position:0% 0%} 100%{background-position:200% 200%} }
    @keyframes neonPulse { 0%,100%{box-shadow:0 0 16px ${accent},0 0 32px ${accent}44} 50%{box-shadow:0 0 28px #f953c6,0 0 54px #f953c655} }
    @keyframes ocean { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    @keyframes liquidWobble { 0%,100%{border-radius:28px 24px 28px 24px;filter:brightness(1)} 50%{border-radius:24px 28px 24px 28px;filter:brightness(1.18)} }
    @keyframes spinWheelAnim { to { transform: rotate(var(--wheel-angle, 1440deg)); } }
    @keyframes boxVibrate {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      20% { transform: translate(-4px, 2px) rotate(-3deg); }
      40% { transform: translate(4px, -2px) rotate(3deg); }
      60% { transform: translate(-3px, -1px) rotate(-2deg); }
      80% { transform: translate(3px, 1px) rotate(2deg); }
    }
    @keyframes lidPop {
      0% { transform: translateY(0); }
      50% { transform: translateY(-70px) rotate(-18deg) scale(1.1); opacity: 0.9; }
      100% { transform: translateY(-110px) rotate(-25deg) scale(1.15); opacity: 0; }
    }
    @keyframes rewardPopIn {
      0% { transform: scale(0.3) translateY(40px); opacity: 0; }
      70% { transform: scale(1.06) translateY(-6px); opacity: 1; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }

    /* ── Effect Classes ── */
    .eff-aurora .p-banner { background: linear-gradient(270deg,#00c6ff,#0072ff,#7c6af7,#ff6bf7,#00c6ff)!important; background-size: 400% 400%!important; animation: aurora 6s ease infinite; }
    .eff-fire .p-banner { animation: fireAni 2s ease infinite; }
    .eff-galaxy .p-banner { background: linear-gradient(135deg,#0f0c29,#302b63,#24243e,#7c6af7,#0f0c29)!important; background-size: 400% 400%!important; animation: galaxy 10s linear infinite; }
    .eff-neon .p-card { animation: neonPulse 2.5s ease-in-out infinite; }
    .eff-ocean .p-banner { background: linear-gradient(270deg,#1a6b8a,#00b4d8,#90e0ef,#1a6b8a)!important; background-size: 400% 400%!important; animation: ocean 5s ease infinite; }
    .eff-liquid .p-card { animation: liquidWobble 4s ease-in-out infinite; box-shadow: 0 0 35px rgba(124,106,247,0.38), inset 0 2px 2px rgba(255,255,255,0.85); }
    .eff-matrix .p-banner { background: linear-gradient(180deg, #052e16 0%, #000 50%, #052e16 100%)!important; box-shadow: 0 0 30px rgba(34,197,94,0.35)!important; }
    .eff-cosmic .p-banner { background: radial-gradient(circle, #7928ca 0%, #ff0080 50%, #000 100%)!important; }

    /* ── Frame Classes ── */
    .frm-gold .p-avatar { border-color: #fbbf24!important; box-shadow: 0 0 0 4px #fbbf2466, 0 0 28px #fbbf24aa!important; }
    .frm-diamond .p-avatar { border-color: #a8edea!important; box-shadow: 0 0 0 4px #a8edea66, 0 0 30px #a8edeabb!important; }
    .frm-fire .p-avatar { border-color: #ff4e00!important; box-shadow: 0 0 0 4px #ff4e0066, 0 0 30px #ff4e00aa!important; animation: fireAni 2s ease infinite; }
    .frm-liquid .p-avatar { border-color: rgba(255,255,255,0.95)!important; box-shadow: 0 0 0 4px rgba(124,106,247,0.65), 0 0 32px rgba(0,242,254,0.6), inset 0 2px 3px #fff!important; }
    .frm-cyber .p-avatar { border-color: #00f2fe!important; box-shadow: 0 0 0 4px #fe2c55aa, 0 0 30px #00f2febf!important; }
    .frm-crown .p-avatar { border-color: #ffd700!important; box-shadow: 0 0 0 4px #f59e0b88, 0 0 35px #ffd700cc!important; }
    .frm-cosmic .p-avatar { border-color: #ec4899!important; box-shadow: 0 0 0 4px #8b5cf688, 0 0 32px #ec4899cc!important; }

    /* ── Layout & Bento Structure ── */
    .p-root {
      max-width: 980px;
      margin: 18px auto 60px;
      padding: 0 16px;
    }
    .p-banner {
      width: 100%;
      height: 290px;
      border-radius: 28px 28px 0 0;
      position: relative;
      overflow: hidden;
      background: ${bannerBg};
      box-shadow: 0 16px 48px -12px rgba(0,0,0,.7);
      border: 1px solid rgba(255,255,255,.18);
      border-bottom: none;
    }
    .p-banner-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(9,10,18,0.88) 100%);
    }
    .p-avatar-wrap {
      position: absolute;
      bottom: -54px;
      left: 2.2rem;
      z-index: 10;
      filter: drop-shadow(0 8px 24px rgba(0,0,0,.7));
    }
    .p-avatar {
      width: 124px;
      height: 124px;
      border-radius: 50%;
      border: 5px solid #090a12;
      display: block;
      object-fit: cover;
      background: #141624;
      transition: transform .28s cubic-bezier(0.34,1.56,0.64,1);
    }
    .p-avatar:hover { transform: scale(1.05) rotate(2deg); }

    /* ── Profile Body & Dark Liquid Glass Card ── */
    .p-card {
      position: relative;
      background: radial-gradient(130% 120% at 50% -15%, rgba(124,106,247,0.12) 0%, rgba(255,255,255,0.02) 35%, rgba(9,11,20,0.95) 100%), linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(12,14,24,0.92) 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 0 0 28px 28px;
      box-shadow: 0 28px 64px -16px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.14);
      backdrop-filter: blur(28px) saturate(210%);
      -webkit-backdrop-filter: blur(28px) saturate(210%);
      padding: 4.6rem 2.2rem 2.2rem;
      overflow: hidden;
    }
    .p-name-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1.2rem;
      margin-bottom: 1rem;
    }
    .p-name {
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      font-weight: 850;
      line-height: 1.1;
      letter-spacing: -0.04em;
      background: linear-gradient(110deg, #fff 35%, #c7d2fe 75%, #f472b6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .p-sub {
      color: var(--muted, #9496a8);
      font-size: .92rem;
      margin-top: .3rem;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .p-badges {
      display: flex;
      gap: .45rem;
      flex-wrap: wrap;
      margin: .85rem 0;
    }
    .p-badge {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      padding: .28rem .75rem;
      border-radius: 999px;
      font-size: .78rem;
      font-weight: 750;
      border: 1px solid;
      backdrop-filter: blur(8px);
    }
    .p-bio {
      font-size: .94rem;
      line-height: 1.7;
      color: #cbd5e1;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 1rem 0 1.6rem;
      padding: 1.1rem 1.3rem;
      background: rgba(255,255,255,.035);
      border-left: 3.5px solid ${accent};
      border-radius: 0 14px 14px 0;
      border-top: 1px solid rgba(255,255,255,.05);
      border-right: 1px solid rgba(255,255,255,.05);
      border-bottom: 1px solid rgba(255,255,255,.05);
    }

    /* ── Tab Navigation ── */
    .p-tabs {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;
      margin: 1.6rem 0 1.8rem;
      border-bottom: 1px solid rgba(255,255,255,0.12);
      scrollbar-width: none;
    }
    .p-tabs::-webkit-scrollbar { display: none; }
    .p-tab-btn {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: 12px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.14);
      color: var(--muted, #9496a8);
      font-size: .84rem;
      font-weight: 750;
      cursor: pointer;
      user-select: none;
      transition: all .2s cubic-bezier(0.34,1.56,0.64,1);
    }
    .p-tab-btn:hover {
      background: rgba(255,255,255,0.14);
      color: #fff;
      transform: translateY(-1.5px);
    }
    .p-tab-btn.active {
      background: linear-gradient(135deg, rgba(124,106,247,0.35) 0%, rgba(168,85,247,0.2) 100%);
      color: #fff;
      border-color: rgba(124,106,247,0.6);
      box-shadow: 0 4px 16px rgba(124,106,247,0.35), inset 0 1px 1px rgba(255,255,255,0.6);
    }
    .p-tab-btn:active {
      transform: scale(0.93) translateY(2px) !important;
    }
    .p-tab-badge {
      padding: 2px 7px;
      border-radius: 999px;
      font-size: .68rem;
      background: #ec4899;
      color: #fff;
      font-weight: 800;
    }

    /* ── Tab Content Panels ── */
    .p-tab-content { display: none; animation: fadeUp .3s ease; }
    .p-tab-content.active { display: block; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* ── Bento Stats & Coin Bar ── */
    .p-coin-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: radial-gradient(120% 110% at 50% -20%, rgba(124,106,247,0.09) 0%, rgba(255,255,255,0.02) 40%, rgba(10,12,22,0.90) 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 1.1rem 1.4rem;
      margin-bottom: 1.8rem;
      box-shadow: 0 10px 30px -8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1);
      backdrop-filter: blur(14px);
    }
    .p-coin-icon { font-size: 2rem; }
    .p-coin-val { font-size: 1.55rem; font-weight: 850; color: #fff; letter-spacing: -0.02em; }
    .p-coin-lbl { font-size: .76rem; color: var(--muted, #9496a8); }
    .p-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: .9rem;
      margin: 1.4rem 0 2rem;
    }
    .p-stat {
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      padding: 1.1rem 1rem;
      text-align: center;
      backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      transition: all .2s cubic-bezier(0.34,1.56,0.64,1);
    }
    .p-stat:hover { border-color: rgba(124,106,247,0.5); transform: translateY(-3px); }
    .p-stat-val { font-size: 1.6rem; font-weight: 850; color: #fff; letter-spacing: -0.02em; }
    .p-stat-lbl { font-size: .74rem; color: var(--muted, #9496a8); margin-top: .3rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 750; }

    /* ── Rewards Hub (Kutu Açma & Çark) ── */
    .rewards-hub-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin: 1.2rem 0;
    }
    .reward-box-card, .reward-wheel-card {
      position: relative;
      padding: 26px;
      border-radius: 22px;
      background: radial-gradient(130% 120% at 50% -15%, rgba(124,106,247,0.08) 0%, rgba(10,12,22,0.94) 100%);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 16px 40px -10px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.1);
      text-align: center;
      overflow: hidden;
    }
    .reward-head-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: .7rem;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    /* 3D Mystery Chest */
    .chest-stage {
      position: relative;
      height: 180px;
      display: grid;
      place-items: center;
      margin: 10px 0 18px;
    }
    .chest-glow {
      position: absolute;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: #ffd700;
      filter: blur(50px);
      opacity: 0.35;
      transition: opacity .3s ease;
    }
    .chest-body {
      position: relative;
      width: 110px;
      height: 110px;
      display: grid;
      place-items: center;
      font-size: 5rem;
      user-select: none;
      filter: drop-shadow(0 12px 24px rgba(0,0,0,0.6));
      cursor: pointer;
      transition: transform .2s ease;
    }
    .chest-body.vibrating {
      animation: boxVibrate 0.15s ease-in-out infinite alternate;
    }
    .chest-body.opened {
      animation: lidPop 0.8s ease forwards;
    }

    /* Prize Reveal Box Modal */
    .prize-reveal-modal {
      display: none;
      position: relative;
      margin-top: 14px;
      padding: 16px;
      border-radius: 16px;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.25);
      animation: rewardPopIn .4s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }
    .prize-reveal-icon { font-size: 3rem; margin-bottom: 6px; }
    .prize-reveal-title { font-size: 1.15rem; font-weight: 850; margin: 0 0 4px; }
    .prize-reveal-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: .68rem;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    /* Wheel Canvas & Pointer */
    .wheel-stage {
      position: relative;
      width: 200px;
      height: 200px;
      margin: 10px auto 18px;
    }
    .wheel-pointer {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 20px solid #ef4444;
      z-index: 20;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));
    }
    .wheel-disc {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 4px solid rgba(255,255,255,0.3);
      box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 2px 4px #fff;
      background: conic-gradient(
        #7c6af7 0deg 45deg,
        #00f2fe 45deg 90deg,
        #10b981 90deg 135deg,
        #ec4899 135deg 180deg,
        #f59e0b 180deg 225deg,
        #22c55e 225deg 270deg,
        #8b5cf6 270deg 315deg,
        #ffd700 315deg 360deg
      );
      display: grid;
      place-items: center;
      transition: transform 4s cubic-bezier(0.15, 0.9, 0.25, 1);
    }
    .wheel-center-hub {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #11131e;
      border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      display: grid;
      place-items: center;
      font-size: 1.2rem;
      z-index: 10;
    }

    /* ── Inventory Grid ── */
    .p-inv-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
      margin-top: 14px;
    }
    .p-inv-item {
      background: rgba(255,255,255,0.035);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      padding: 1.1rem .6rem;
      text-align: center;
      position: relative;
      transition: all .2s cubic-bezier(0.34,1.56,0.64,1);
      backdrop-filter: blur(10px);
    }
    .p-inv-item:hover { border-color: ${accent}; transform: translateY(-3px); }
    .p-inv-item.active { border-color: ${accent}; background: rgba(124,106,247,0.12); box-shadow: 0 0 16px rgba(124,106,247,0.3); }
    .p-inv-active-tag {
      position: absolute;
      top: 6px;
      right: 6px;
      font-size: .62rem;
      font-weight: 800;
      text-transform: uppercase;
      background: ${accent};
      color: #fff;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .p-inv-icon { font-size: 2.1rem; margin-bottom: .4rem; }
    .p-inv-name { font-size: .78rem; font-weight: 750; line-height: 1.3; color: #fff; }
    .p-inv-type { font-size: .68rem; color: var(--muted, #9496a8); margin-top: 2px; }

    /* Action Buttons */
    .p-btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: 11px;
      font-size: .82rem;
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
      user-select: none;
      transition: all .2s cubic-bezier(0.34,1.56,0.64,1);
    }
    .p-btn-action.primary {
      background: linear-gradient(135deg, rgba(124,106,247,0.88) 0%, rgba(99,102,241,0.88) 100%);
      color: #ffffff;
      border: 1px solid rgba(167,139,250,0.5);
      box-shadow: 0 4px 14px rgba(124,106,247,0.35), inset 0 1px 0 rgba(255,255,255,0.4);
    }
    .p-btn-action.primary:hover {
      transform: translateY(-2px) scale(1.02);
      background: linear-gradient(135deg, rgba(124,106,247,1) 0%, rgba(99,102,241,1) 100%);
      box-shadow: 0 8px 24px rgba(124,106,247,0.5), inset 0 1px 0 rgba(255,255,255,0.6);
    }
    .p-btn-action.primary:active { transform: scale(0.95) translateY(1px) !important; }
    .p-btn-action.secondary {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
    }
    .p-btn-action.secondary:hover { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.22); transform: translateY(-1px); }

    /* Responsive */
    @media (max-width: 768px) {
      .rewards-hub-container { grid-template-columns: 1fr; }
      .p-stats { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 580px) {
      .p-banner { height: 200px; border-radius: 20px 20px 0 0; }
      .p-avatar { width: 94px; height: 94px; }
      .p-avatar-wrap { bottom: -42px; left: 1.2rem; }
      .p-card { padding: 3.6rem 1.2rem 1.4rem; border-radius: 0 0 20px 20px; }
      .p-name { font-size: 1.6rem; }
      .p-stats { grid-template-columns: 1fr 1fr; }
      .p-coin-bar { flex-direction: column; align-items: flex-start; gap: 8px; }
    }
  </style>

  <div class="p-root" id="p-root">
    <!-- Banner Stage -->
    <div class="p-banner" id="p-banner">
      <div class="p-banner-overlay"></div>
      <div class="p-avatar-wrap">
        <img src="${avatarSrc}" class="p-avatar" id="p-avatar" alt="Avatar">
      </div>
    </div>

    <!-- Main Card Body -->
    <div class="p-card" id="p-card">
      <div class="p-name-row">
        <div>
          <div class="p-name">${displayName}</div>
          <div class="p-sub">
            ${profileUser.robloxUsername ? `🎮 <span style="color:#34d399;font-weight:750;">${_esc(profileUser.robloxUsername)}</span>` : `<span style="color:var(--muted);">Roblox bağlı değil</span>`}
            <span>•</span>
            <span style="font-family:ui-monospace,monospace;font-size:0.8em;color:var(--muted);">${targetId}</span>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-top:0.4rem;">
            ${profileUser.gunsLolUrl ? `
              <a href="${_esc(profileUser.gunsLolUrl)}" target="_blank" rel="noopener noreferrer" class="p-btn-action secondary" style="padding:4px 10px;font-size:0.75rem;background:linear-gradient(135deg,#ff007f 0%,#7f00ff 100%);border:none;">
                <span>🔗 guns.lol</span>
              </a>
            ` : ''}
            ${profileUser.profileMusicUrl ? `
              <div style="padding:0.3rem 0.65rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;display:inline-flex;align-items:center;gap:0.5rem;backdrop-filter:blur(8px);">
                <span style="font-size:0.9rem;">🎵</span>
                <span style="font-size:0.75rem;color:var(--muted);" id="music-status">Müzik</span>
                <button type="button" onclick="toggleProfileMusic()" id="play-btn" style="background:var(--accent,#7c6af7);border:none;color:#fff;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;cursor:pointer;font-size:0.65rem;">▶</button>
                <audio id="profile-audio" src="${_esc(profileUser.profileMusicUrl)}" loop></audio>
              </div>
            ` : ''}
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          ${isOwn ? `<a href="/settings" class="p-btn-action secondary">✏️ Profili Düzenle</a>` : ''}
          <button type="button" class="p-btn-action secondary" id="btnShareProfile">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            <span>Paylaş</span>
          </button>
        </div>
      </div>

      <!-- Badges Row -->
      <div class="p-badges" id="p-badges">
        ${roleBadgesHtml}
      </div>

      <!-- Bio Quote -->
      <div class="p-bio">${_esc(profileUser.profileBio || 'Henüz bir biyografi eklenmemiş.')}</div>

      <!-- Tab Navigation -->
      <nav class="p-tabs" aria-label="Profil sekmeleri">
        <button type="button" class="p-tab-btn active" data-tab="overview">📌 Genel Bakış</button>
        <button type="button" class="p-tab-btn" data-tab="rewards">
          🎁 Kutu Aç &amp; Çark
          <span class="p-tab-badge" id="tabBadgeCount">1</span>
        </button>
        <button type="button" class="p-tab-btn" data-tab="inventory">🎒 Envanter &amp; Efektler</button>
        <button type="button" class="p-tab-btn" data-tab="staff">🛡️ Görev &amp; Moderasyon</button>
      </nav>

      <!-- ── TAB 1: Genel Bakış ── -->
      <div class="p-tab-content active" id="tab-overview">
        <div class="p-coin-bar">
          <div class="p-coin-icon">💰</div>
          <div>
            <div class="p-coin-val" id="p-balance">—</div>
            <div class="p-coin-lbl">Sanal Bakiye</div>
          </div>
          <div style="margin-left:auto;text-align:right;">
            <div style="font-size:.95rem;font-weight:800;color:#34d399;" id="p-earned">—</div>
            <div class="p-coin-lbl">Toplam Kazanılan</div>
          </div>
          ${isOwn ? `<a href="/shop" class="p-btn-action primary" style="margin-left:1rem;">🛒 Mağaza</a>` : ''}
        </div>

        <div class="p-stats">
          <div class="p-stat">
            <div class="p-stat-val" id="stat-tickets">—</div>
            <div class="p-stat-lbl">Ticket</div>
          </div>
          <div class="p-stat">
            <div class="p-stat-val" id="stat-closed">—</div>
            <div class="p-stat-lbl">Çözülen</div>
          </div>
          <div class="p-stat">
            <div class="p-stat-val" id="stat-items">—</div>
            <div class="p-stat-lbl">Kozmetik Ürün</div>
          </div>
          <div class="p-stat">
            <div class="p-stat-val" id="stat-spent">—</div>
            <div class="p-stat-lbl">Harcanan (TL)</div>
          </div>
        </div>
      </div>

      <!-- ── TAB 2: Kutu Açma & Çark Çevirme ── -->
      <div class="p-tab-content" id="tab-rewards">
        <div class="rewards-hub-container">
          <!-- 3D Mystery Chest Card -->
          <div class="reward-box-card">
            <span class="reward-head-badge" style="background:rgba(251,191,36,0.18);border:1px solid rgba(251,191,36,0.4);color:#fbbf24;">
              ✨ GÖREV ÖDÜL SANDIĞI
            </span>
            <h3 style="margin:0 0 6px;color:#fff;font-size:1.2rem;">Gizemli Kutu Açılımı</h3>
            <p style="margin:0 auto 12px;color:var(--muted);font-size:0.84rem;max-width:320px;">
              Görev tamamlayarak veya ticket çözerek kazandığın sandığı 3D animasyonla aç!
            </p>

            <div class="chest-stage">
              <div class="chest-glow" id="chestGlow"></div>
              <div class="chest-body" id="chestBody" title="Açmak için tıkla">📦</div>
            </div>

            <div style="display:flex;gap:10px;justify-content:center;align-items:center;margin-top:6px;">
              <button type="button" class="p-btn-action primary" id="btnOpenBox">
                <span>🎁 Kutuyu Aç</span>
                <span style="opacity:0.8;font-size:0.8em;" id="boxCountDisplay">(1)</span>
              </button>
            </div>

            <!-- Modal Result Box -->
            <div class="prize-reveal-modal" id="boxRevealModal">
              <div class="prize-reveal-icon" id="boxPrizeIcon">✨</div>
              <span class="prize-reveal-badge" id="boxPrizeRarity">Efsanevi</span>
              <div class="prize-reveal-title" id="boxPrizeName">Kraliyet Tacı</div>
              <p style="margin:0 0 10px;font-size:0.82rem;color:#cbd5e1;" id="boxPrizeDesc">Profiline otomatik eklendi!</p>
              <button type="button" class="p-btn-action primary" id="btnEquipWonBox" style="font-size:0.78rem;padding:6px 14px;">
                Hemen Kuşan
              </button>
            </div>
          </div>

          <!-- Lucky Wheel Card -->
          <div class="reward-wheel-card">
            <span class="reward-head-badge" style="background:rgba(124,106,247,0.18);border:1px solid rgba(124,106,247,0.4);color:#a5b4fc;">
              🎡 ŞANS ÇARKI
            </span>
            <h3 style="margin:0 0 6px;color:#fff;font-size:1.2rem;">Çarkıfelek Çevir</h3>
            <p style="margin:0 auto 12px;color:var(--muted);font-size:0.84rem;max-width:320px;">
              Sıvı cam efektleri, nadir çerçeveler, XP ve coin kazanma fırsatı!
            </p>

            <div class="wheel-stage">
              <div class="wheel-pointer"></div>
              <div class="wheel-disc" id="wheelDisc">
                <div class="wheel-center-hub">🎯</div>
              </div>
            </div>

            <div style="display:flex;gap:10px;justify-content:center;align-items:center;">
              <button type="button" class="p-btn-action primary" id="btnSpinWheel">
                <span>🎡 Çarkı Çevir</span>
                <span style="opacity:0.8;font-size:0.8em;" id="spinCountDisplay">(1)</span>
              </button>
            </div>

            <!-- Modal Result Wheel -->
            <div class="prize-reveal-modal" id="wheelRevealModal">
              <div class="prize-reveal-icon" id="wheelPrizeIcon">🎉</div>
              <div class="prize-reveal-title" id="wheelPrizeName">Tebrikler!</div>
              <p style="margin:0;font-size:0.82rem;color:#cbd5e1;" id="wheelPrizeDesc">Ödül hesabınıza aktarıldı.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TAB 3: Envanter & Efektler ── -->
      <div class="p-tab-content" id="tab-inventory">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:0.84rem;font-weight:800;text-transform:uppercase;color:var(--muted);letter-spacing:1px;">
            Kozmetik Envanteriniz
          </span>
          ${isOwn ? `<a href="/shop" style="color:var(--accent,#7c6af7);font-size:0.82rem;font-weight:750;text-decoration:none;">+ Mağazadan Yeni Al →</a>` : ''}
        </div>
        <div class="p-inv-grid" id="p-inv">
          <div style="grid-column:1/-1;color:var(--muted);font-size:.85rem;text-align:center;padding:2rem;">Yükleniyor...</div>
        </div>
      </div>

      <!-- ── TAB 4: Görev & Moderasyon ── -->
      <div class="p-tab-content" id="tab-staff">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:10px;">
          <div class="telemetry-card" style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.1);padding:18px;border-radius:18px;">
            <div style="font-size:0.76rem;color:var(--muted);font-weight:750;text-transform:uppercase;margin-bottom:6px;">📋 Günlük Görev Durumu</div>
            <div style="font-size:1.1rem;font-weight:850;color:#fff;" id="staffTaskStatus">Aktif Takipte</div>
            <div style="font-size:0.82rem;color:#cbd5e1;margin-top:6px;">
              Selamlaşma &amp; Ses Nöbeti tamamlandığında otomatik 1x Gizemli Kutu ve EkoCoin tanımlanır.
            </div>
          </div>
          <div class="telemetry-card" style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.1);padding:18px;border-radius:18px;">
            <div style="font-size:0.76rem;color:var(--muted);font-weight:750;text-transform:uppercase;margin-bottom:6px;">🛡️ Güven &amp; Yetkili Seviyesi</div>
            <div style="font-size:1.1rem;font-weight:850;color:#34d399;" id="staffTrustStatus">Doğrulanmış Personel</div>
            <div style="font-size:0.82rem;color:#cbd5e1;margin-top:6px;">
              Ticket çözüm hızı ve adli raporlar sistem tarafından değerlendirilir.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="bio-toast" id="profileToast" role="status" aria-live="polite" style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(30px);opacity:0;visibility:hidden;background:rgba(18,20,32,0.95);border:1px solid rgba(255,255,255,0.25);border-radius:999px;padding:10px 22px;color:#fff;font-size:0.84rem;font-weight:750;box-shadow:0 16px 40px rgba(0,0,0,0.6);backdrop-filter:blur(16px);display:flex;align-items:center;gap:8px;z-index:9999;transition:all 0.25s ease;">
    <span style="color:#10b981;">✓</span>
    <span id="profileToastMsg">İşlem başarılı!</span>
  </div>

  <script>
    (function() {
      const TARGET_ID = ${JSON.stringify(profileUser.discordId || '')};
      const IS_OWN = ${isOwn ? 'true' : 'false'};

      // Toast notification helper
      const toast = document.getElementById('profileToast');
      const toastMsg = document.getElementById('profileToastMsg');
      let toastTimeout = null;
      function showToast(msg) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = msg || 'İşlem yapıldı!';
        toast.style.opacity = '1';
        toast.style.visibility = 'visible';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.visibility = 'hidden';
          toast.style.transform = 'translateX(-50%) translateY(30px)';
        }, 2500);
      }

      // Tab Switcher
      const tabs = document.querySelectorAll('.p-tab-btn');
      const panels = document.querySelectorAll('.p-tab-content');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-tab');
          tabs.forEach(t => t.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const panel = document.getElementById('tab-' + target);
          if (panel) panel.classList.add('active');
        });
      });

      // URL query auto-open tab (e.g. ?tab=rewards)
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const reqTab = urlParams.get('tab');
        if (reqTab) {
          const btn = document.querySelector('.p-tab-btn[data-tab="' + reqTab + '"]');
          if (btn) btn.click();
        }
      } catch (_) {}

      // Share profile button
      const btnShare = document.getElementById('btnShareProfile');
      if (btnShare) {
        btnShare.addEventListener('click', () => {
          const url = window.location.href;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => showToast('Profil linki kopyalandı!'));
          } else {
            showToast('Profil linki kopyalandı!');
          }
        });
      }

      // Profile load
      async function loadProfile() {
        try {
          const eRes = await fetch('/api/economy/public/' + TARGET_ID);
          const ed = await eRes.json().catch(() => ({}));

          if (IS_OWN) {
            const tRes = await fetch('/api/tickets');
            const td = await tRes.json().catch(() => ({}));
            const tickets = td.tickets || [];
            document.getElementById('stat-tickets').textContent = tickets.length;
            document.getElementById('stat-closed').textContent = tickets.filter(t => t.status === 'closed').length;
          } else {
            document.getElementById('stat-tickets').textContent = '—';
            document.getElementById('stat-closed').textContent = '—';
          }

          if (ed.success) {
            document.getElementById('p-balance').textContent = (ed.balance || 0).toLocaleString('tr-TR') + ' coin';
            document.getElementById('p-earned').textContent = '+' + (ed.totalEarned || 0).toLocaleString('tr-TR') + ' coin';
            document.getElementById('stat-items').textContent = (ed.inventory || []).length;
            document.getElementById('stat-spent').textContent = (ed.totalSpent || 0).toLocaleString('tr-TR');

            const root = document.getElementById('p-root');
            if (ed.profileEffect) root.classList.add('eff-' + ed.profileEffect.replace('effect_', ''));
            if (ed.profileFrame) root.classList.add('frm-' + ed.profileFrame.replace('frame_', ''));

            renderInventory(ed.inventory || [], ed.profileEffect, ed.profileFrame);
          }

          // Fetch rewards count
          fetchRewardsStatus();
        } catch (err) {
          console.warn('Profile load error:', err);
        }
      }

      function renderInventory(inv, currentEffect, currentFrame) {
        const grid = document.getElementById('p-inv');
        if (!grid) return;
        if (!inv.length) {
          grid.innerHTML = IS_OWN
            ? '<div style="grid-column:1/-1;color:var(--muted);font-size:.85rem;text-align:center;padding:2rem;">Henüz hiçbir kozmetik açmadınız. <a href="/shop" style="color:var(--accent,#7c6af7);">Mağazadan al</a> veya Kutu Aç!</div>'
            : '<div style="grid-column:1/-1;color:var(--muted);font-size:.85rem;text-align:center;padding:2rem;">Envanter boş.</div>';
          return;
        }

        grid.innerHTML = inv.map(item => {
          const isActive = currentEffect === item.itemId || currentFrame === item.itemId;
          const canEquip = IS_OWN && (item.type === 'effect' || item.type === 'frame');
          return '<div class="p-inv-item' + (isActive ? ' active' : '') + '">' +
            (isActive ? '<div class="p-inv-active-tag">Aktif</div>' : '') +
            '<div class="p-inv-icon">' + (item.icon || '✨') + '</div>' +
            '<div class="p-inv-name">' + (item.name || item.itemId) + '</div>' +
            '<div class="p-inv-type">' + (item.type === 'frame' ? 'Çerçeve' : 'Efekt') + '</div>' +
            (canEquip && !isActive ? '<button type="button" onclick="equipItem(\\'' + item.itemId + '\\')" style="margin-top:.5rem;background:rgba(124,106,247,.25);border:1px solid rgba(124,106,247,.5);color:#fff;border-radius:8px;padding:3px 12px;font-size:.72rem;cursor:pointer;font-weight:750;">Kuşan</button>' : '') +
            '</div>';
        }).join('');
      }

      window.equipItem = async function(itemId) {
        try {
          const res = await fetch('/api/profile/equip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId }),
          });
          const d = await res.json();
          if (res.ok) {
            showToast(d.message || 'Kozmetik aktif edildi!');
            setTimeout(() => location.reload(), 600);
          } else {
            showToast(d.error || 'Hata oluştu');
          }
        } catch (_) {
          showToast('İşlem tamamlanamadı.');
        }
      };

      // Rewards status
      async function fetchRewardsStatus() {
        try {
          const res = await fetch('/api/rewards/status');
          const data = await res.json();
          if (data.success) {
            const boxes = data.availableBoxes || 1;
            const spins = data.availableSpins || 1;
            const bBadge = document.getElementById('tabBadgeCount');
            if (bBadge) bBadge.textContent = boxes + spins;
            const bCount = document.getElementById('boxCountDisplay');
            if (bCount) bCount.textContent = '(' + boxes + ')';
            const sCount = document.getElementById('spinCountDisplay');
            if (sCount) sCount.textContent = '(' + spins + ')';
          }
        } catch (_) {}
      }

      // ── Kutu Açma Minigame ──
      const btnOpenBox = document.getElementById('btnOpenBox');
      const chestBody = document.getElementById('chestBody');
      const chestGlow = document.getElementById('chestGlow');
      const boxModal = document.getElementById('boxRevealModal');
      let boxInProgress = false;

      if (btnOpenBox && chestBody) {
        btnOpenBox.addEventListener('click', async () => {
          if (boxInProgress) return;
          boxInProgress = true;
          btnOpenBox.disabled = true;
          btnOpenBox.textContent = 'Açılıyor...';

          if (boxModal) boxModal.style.display = 'none';
          chestBody.classList.add('vibrating');
          if (chestGlow) chestGlow.style.opacity = '0.9';

          try {
            const res = await fetch('/api/rewards/open-box', { method: 'POST' });
            const data = await res.json();

            setTimeout(() => {
              chestBody.classList.remove('vibrating');
              chestBody.classList.add('opened');

              setTimeout(() => {
                if (data.success && data.reward) {
                  const r = data.reward;
                  document.getElementById('boxPrizeIcon').textContent = r.icon || '🎁';
                  document.getElementById('boxPrizeName').textContent = r.name;
                  document.getElementById('boxPrizeRarity').textContent = r.rarityLabel || 'Ödül';
                  document.getElementById('boxPrizeRarity').style.background = r.rarity === 'legendary' ? '#eab308' : (r.rarity === 'epic' ? '#a855f7' : '#3b82f6');
                  document.getElementById('boxPrizeDesc').textContent = r.type === 'coin' ? (r.amount + ' EkoCoin bakiyenize eklendi!') : (r.type === 'xp' ? (r.amount + ' XP yetkili profilinize eklendi!') : 'Kozmetik envanterinize eklendi ve aktif edildi!');

                  const btnEquip = document.getElementById('btnEquipWonBox');
                  if (btnEquip) {
                    if (r.type === 'effect' || r.type === 'frame') {
                      btnEquip.style.display = 'inline-flex';
                      btnEquip.onclick = () => window.equipItem(r.id);
                    } else {
                      btnEquip.style.display = 'none';
                    }
                  }

                  if (boxModal) boxModal.style.display = 'block';
                  showToast('🎉 Tebrikler! ' + r.name + ' kazandınız!');
                }

                chestBody.classList.remove('opened');
                btnOpenBox.disabled = false;
                btnOpenBox.innerHTML = '<span>🎁 Kutuyu Aç</span>';
                boxInProgress = false;
                fetchRewardsStatus();
              }, 600);
            }, 1400);
          } catch (err) {
            chestBody.classList.remove('vibrating');
            btnOpenBox.disabled = false;
            boxInProgress = false;
          }
        });
      }

      // ── Şans Çarkı Minigame ──
      const btnSpin = document.getElementById('btnSpinWheel');
      const wheelDisc = document.getElementById('wheelDisc');
      const wheelModal = document.getElementById('wheelRevealModal');
      let wheelInProgress = false;

      if (btnSpin && wheelDisc) {
        btnSpin.addEventListener('click', async () => {
          if (wheelInProgress) return;
          wheelInProgress = true;
          btnSpin.disabled = true;
          btnSpin.textContent = 'Dönüyor...';
          if (wheelModal) wheelModal.style.display = 'none';

          try {
            const res = await fetch('/api/rewards/spin-wheel', { method: 'POST' });
            const data = await res.json();

            const targetIndex = data.sliceIndex || Math.floor(Math.random() * 8);
            // 8 dilim, her dilim 45 derece. Hedef dilim açısı:
            const baseDegree = (8 - targetIndex) * 45 - 22.5;
            const finalRotation = 1800 + baseDegree;

            wheelDisc.style.transform = 'rotate(' + finalRotation + 'deg)';

            setTimeout(() => {
              if (data.success && data.slice) {
                const s = data.slice;
                document.getElementById('wheelPrizeIcon').textContent = s.icon || '🎉';
                document.getElementById('wheelPrizeName').textContent = s.label;
                document.getElementById('wheelPrizeDesc').textContent = 'Harika! ' + s.label + ' kazandınız ve hesabınıza işlendi.';
                if (wheelModal) wheelModal.style.display = 'block';
                showToast('🎡 ' + s.label + ' kazandınız!');
              }

              btnSpin.disabled = false;
              btnSpin.innerHTML = '<span>🎡 Çarkı Çevir</span>';
              wheelInProgress = false;
              fetchRewardsStatus();
            }, 4200);
          } catch (_) {
            btnSpin.disabled = false;
            wheelInProgress = false;
          }
        });
      }

      // Music toggle
      window.toggleProfileMusic = function() {
        const audio = document.getElementById('profile-audio');
        const btn = document.getElementById('play-btn');
        const status = document.getElementById('music-status');
        if (!audio) return;
        if (audio.paused) {
          audio.play().then(() => {
            btn.textContent = '⏸';
            status.textContent = 'Müzik: Çalıyor';
            btn.style.background = '#ef4444';
          }).catch(() => {
            showToast('Tarayıcı ses engeli: Sayfada bir yere tıkladıktan sonra tekrar deneyin.');
          });
        } else {
          audio.pause();
          btn.textContent = '▶';
          status.textContent = 'Müzik: Durdu';
          btn.style.background = 'var(--accent,#7c6af7)';
        }
      };

      loadProfile();
    })();
  </script>
  `;

  const pageTitle = isOwn ? 'Profil' : displayName + ' — Profil';
  if (typeof _layout === 'function') {
    return _layout(pageTitle, user, content);
  }
  return content;
}

module.exports = {
  renderProfilePage,
};
