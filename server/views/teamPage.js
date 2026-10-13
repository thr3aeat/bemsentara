'use strict';

const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
} = require('./platformChrome');

// Ekip: `discord` = avatar için aranan Discord adı.
const TEAM = [
  { name: 'eko', discord: 'eko', role: 'Kurucu · İçerik Üreticisi', bio: 'Kanalın sesi ve yüzü. Videoların fikri, çekimi ve yayını onun elinden geçer.', tag: 'EKO', lead: true },
  { name: 'Zyrox', discord: 'Zyrox', role: 'Ekip Danışmanı', bio: 'Video fikirleri, kanal stratejisi ve ekibin yol haritasında yön gösterir.', tag: 'SNOW', advisor: true },
  { name: 'nonolive', discord: 'nonolive', role: 'Video Ekibi', tag: 'KRP' },
  { name: 'HepsaBey', discord: 'HepsaBey', role: 'Video Ekibi' },
  { name: 'zencisynxx', discord: 'zencisynxx', role: 'Video Ekibi', tag: 'BİO' },
];

const STEPS = [
  ['01', 'Fikir', 'Topluluktan gelen öneriler ve gündem.'],
  ['02', 'Çekim', 'Oyun içi kayıtlar ve sahneler.'],
  ['03', 'Kurgu', 'Montaj, ses ve efektler.'],
  ['04', 'Yayın', 'YouTube, TikTok ve Discord duyurusu.'],
];

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (n) => esc(String(n).slice(0, 2).toLocaleUpperCase('tr'));

function avatar(member, url, size) {
  return url
    ? `<img class="av" src="${esc(url)}" alt="" width="${size}" height="${size}" loading="lazy">`
    : `<span class="av av-fallback" aria-hidden="true">${initials(member.name)}</span>`;
}

function renderTeamPage(user = null, { avatars = {} } = {}) {
  const lead = TEAM.find((m) => m.lead);
  const advisor = TEAM.find((m) => m.advisor);
  const crew = TEAM.filter((m) => !m.lead && !m.advisor);
  const av = (m) => avatars[m.discord] || null;

  const crewHtml = crew.map((m, i) => `
        <li class="crew-card" style="--i:${i}">
          ${avatar(m, av(m), 56)}
          <div class="crew-meta">
            <div class="crew-name">${esc(m.name)}${m.tag ? ` <span class="tag">${esc(m.tag)}</span>` : ''}</div>
            <div class="crew-role">${esc(m.role)}</div>
          </div>
        </li>`).join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="EkoYıldız YouTube video ekibi: kurucu eko, ekip danışmanı Zyrox ve videoların arkasındaki ekip.">
  <title>Video Ekibi — EkoYıldız</title>
  ${platformChromeStyles('dark')}
  <style>
    .tp { --bg:#0a0a0b; --surface:#111113; --surface-2:#17171a; --line:#222226; --line-2:#2e2e33; --text:#ededef; --muted:#8c8c95; --accent:#f43f5e; --gold:#f5c542;
      --mono: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace; }
    body.tp { background: var(--bg); color: var(--text); font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .tp-main h1, .tp-main h2 { font-family: inherit; }
    .tp-main { max-width: 960px; margin: 0 auto; padding: 48px 16px 72px; }
    .eyebrow { font: 600 .72rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }
    .tp h1 { margin: 10px 0 8px; font-size: clamp(2rem, 5vw, 3.2rem); letter-spacing: -0.035em; line-height: 1.05; }
    .lede { margin: 0; max-width: 560px; color: var(--muted); font-size: 1.05rem; line-height: 1.55; }

    .hero-grid { margin-top: 36px; display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; }
    @media (max-width: 760px) { .hero-grid { grid-template-columns: 1fr; } }
    .card { position: relative; border: 1px solid var(--line); background: var(--surface); border-radius: 18px; padding: 22px; overflow: hidden; }
    .card.lead { background: radial-gradient(120% 120% at 100% 0%, rgba(220,38,38,.22), transparent 55%), var(--surface); }
    .card.lead::after { content: ""; position: absolute; right: -40px; top: -40px; width: 180px; height: 180px; border-radius: 50%;
      box-shadow: inset -26px 0 0 0 rgba(255,255,255,.08); pointer-events: none; }
    .card-top { display: flex; align-items: center; gap: 16px; }
    .av { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; background: var(--surface-2); }
    .av-fallback { display: grid; place-items: center; font: 700 .95rem/1 var(--mono); color: var(--muted); border: 1px solid var(--line-2); }
    .lead .av { width: 88px; height: 88px; outline: 2px solid var(--gold); outline-offset: 3px; }
    .advisor .av { width: 72px; height: 72px; outline: 2px solid #7dd3fc; outline-offset: 3px; }
    .name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .lead .name { color: var(--gold); font-size: 1.9rem; }
    .role { margin-top: 4px; font: 600 .78rem/1.2 var(--mono); color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
    .bio { margin: 16px 0 0; color: #c9c9d0; line-height: 1.55; }
    .tag { font: 700 .7rem/1 var(--mono); padding: 5px 7px; border-radius: 6px; background: var(--surface-2); border: 1px solid var(--line-2); color: var(--text); letter-spacing: .04em; }
    .crown { width: 22px; height: 22px; color: var(--gold); }

    .section-title { margin: 44px 0 14px; font: 600 .72rem/1 var(--mono); color: var(--muted); text-transform: uppercase; letter-spacing: .12em; }
    .crew { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .crew-card { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid var(--line); background: var(--surface); border-radius: 14px;
      opacity: 0; transform: translateY(6px); animation: up .4s cubic-bezier(.2,.7,.2,1) forwards; animation-delay: calc(var(--i) * 60ms + 120ms); transition: border-color .15s ease, background .15s ease; }
    .crew-card:hover { border-color: var(--line-2); background: var(--surface-2); }
    .crew-name { font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .crew-role { margin-top: 3px; color: var(--muted); font-size: .88rem; }
    @keyframes up { to { opacity: 1; transform: none; } }

    .steps { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: var(--surface); }
    @media (max-width: 760px) { .steps { grid-template-columns: 1fr 1fr; } }
    .step { padding: 18px; border-left: 1px solid var(--line); }
    .step:first-child { border-left: 0; }
    @media (max-width: 760px) { .step:nth-child(3) { border-left: 0; } .step:nth-child(n+3) { border-top: 1px solid var(--line); } }
    .step-n { font: 600 .75rem/1 var(--mono); color: var(--accent); }
    .step-t { margin-top: 10px; font-weight: 700; }
    .step-d { margin-top: 4px; color: var(--muted); font-size: .88rem; line-height: 1.45; }

    .cta { margin-top: 44px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 20px 22px; border-radius: 16px; border: 1px dashed var(--line-2); }
    .cta p { margin: 0; color: var(--muted); } .cta b { color: var(--text); }
    .btn { display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border-radius: 10px; background: var(--text); color: var(--bg); font-weight: 700; text-decoration: none; }
    .btn:hover { filter: brightness(.92); }
    @media (prefers-reduced-motion: reduce) { .crew-card { animation: none; opacity: 1; transform: none; } }
  </style>
</head>
<body class="platform-chrome tp" data-theme="dark">
  ${renderPlatformHeader({ user, activePath: '/ekip' })}
  <main class="tp-main" id="main-content">
    <div class="eyebrow">YouTube · Video Ekibi</div>
    <h1>Videoların arkasındaki ekip</h1>
    <p class="lede">EkoYıldız videoları küçük ama sıkı bir ekiple hazırlanıyor. Fikirden yayına kadar her adımda bu isimler var.</p>

    <div class="hero-grid">
      <article class="card lead">
        <div class="card-top">
          ${avatar(lead, av(lead), 88)}
          <div>
            <div class="name">${esc(lead.name)} <svg class="crown" viewBox="0 0 24 24" aria-label="Kurucu" role="img"><path fill="currentColor" d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7zm2 13h14v2H5v-2z"/></svg> <span class="tag">${esc(lead.tag)}</span></div>
            <div class="role">${esc(lead.role)}</div>
          </div>
        </div>
        <p class="bio">${esc(lead.bio)}</p>
      </article>
      <article class="card advisor">
        <div class="card-top">
          ${avatar(advisor, av(advisor), 72)}
          <div>
            <div class="name">${esc(advisor.name)} <span class="tag">${esc(advisor.tag)}</span></div>
            <div class="role">${esc(advisor.role)}</div>
          </div>
        </div>
        <p class="bio">${esc(advisor.bio)}</p>
      </article>
    </div>

    <h2 class="section-title">Ekip</h2>
    <ul class="crew">${crewHtml}
    </ul>

    <h2 class="section-title">Bir video nasıl çıkıyor?</h2>
    <div class="steps">${STEPS.map(([n, t, d]) => `<div class="step"><div class="step-n">${n}</div><div class="step-t">${t}</div><div class="step-d">${d}</div></div>`).join('')}</div>

    <div class="cta">
      <p><b>Ekibe katılmak mı istiyorsun?</b> Kurgu, çekim veya fikirle katkı verebilirsin.</p>
      <a class="btn" href="/ekoyildizda-calis">Başvur</a>
    </div>
  </main>
  ${renderSearchDialog()}
  ${renderPlatformFooter()}
  ${platformChromeScript()}
</body>
</html>`;
}

module.exports = { renderTeamPage, TEAM };
