'use strict';

const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
} = require('./platformChrome');

// Herkese açık sayfalar. Yönetim, personel ve gizli sayfalar bilerek yok.
// login: true = giriş yapınca açılır.
const SECTIONS = [
  { title: 'Keşfet', items: [
    ['/', 'Ana sayfa', 'EkoYıldız ekosistemine giriş.'],
    ['/linkler', 'Bağlantılar', 'Kick, Twitch, YouTube, TikTok, Discord ve Instagram.'],
    ['/ekip', 'Video Ekibi', 'Videoların arkasındaki ekip.'],
    ['/video-blog', 'Video Blog', 'Son videolar ve yayın arşivi.'],
    ['/blog', 'Blog', 'Duyurular ve yazılar.'],
    ['/ataturk', 'Ulu Önder', 'Günün fotoğrafı, sesler, videolar ve sözler.'],
  ] },
  { title: 'Topluluk', items: [
    ['/anayasasi', 'EkoYıldız Anayasası', 'Topluluğun temel kuralları.'],
    ['/safety', 'Güvenlik Merkezi', 'Güvende kalmak için rehberler.'],
    ['/cases', 'Vakalar', 'Açıklanan moderasyon kararları.'],
    ['/wiki', 'Wiki', 'Sistemler ve komutlar hakkında bilgi.'],
    ['/shop', 'Mağaza', 'Ödüller ve ürünler.'],
    ['/cark', 'Şans Çarkı', 'Günlük ödülünü al.', true],
  ] },
  { title: 'Destek', items: [
    ['/yardim', 'Yardım Merkezi', 'Sık sorulan sorular ve rehberler.'],
    ['/tickets/new', 'Destek Talebi', 'Ekibe doğrudan yaz.', true],
    ['/itiraz', 'İtiraz Merkezi', 'Ceza ve kararlara itiraz et.'],
    ['/status', 'Sistem Durumu', 'Bot ve sitenin anlık durumu.'],
  ] },
  { title: 'Kariyer & İşbirliği', items: [
    ['/ekoyildizda-calis', "EkoYıldız'da Çalış", 'Açık pozisyonlar.'],
    ['/forms', 'Başvuru Formları', 'Topluluk elçisi, geliştirici ve diğerleri.'],
    ['/reklam/ekoyildiz-ortaklik', 'Reklam & Sponsorluk', 'Markanı toplulukla buluştur.'],
  ] },
  { title: 'Yasal', items: [
    ['/legal/tos', 'Kullanım Koşulları', 'Hizmet şartları.'],
    ['/legal/privacy', 'Gizlilik Politikası', 'Verilerin nasıl işlendiği.'],
  ] },
];

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderSiteMapPage(user = null) {
  const total = SECTIONS.reduce((n, s) => n + s.items.length, 0);
  let idx = 0;
  const sectionsHtml = SECTIONS.map((s, si) => `
      <section class="sm-sec" data-sec>
        <h2><span class="sm-num">${String(si + 1).padStart(2, '0')}</span>${esc(s.title)}</h2>
        <ul>${s.items.map(([href, title, desc, login]) => `
          <li data-q="${esc(`${title} ${desc} ${href}`.toLocaleLowerCase('tr'))}" style="--i:${idx++}">
            <a href="${esc(href)}">
              <span class="sm-t">${esc(title)}${login ? ' <span class="sm-badge">Giriş</span>' : ''}</span>
              <span class="sm-d">${esc(desc)}</span>
              <span class="sm-p">${esc(href)}</span>
            </a>
          </li>`).join('')}
        </ul>
      </section>`).join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="EkoYıldız site haritası: herkese açık tüm sayfalar tek yerde.">
  <title>Site Haritası — EkoYıldız</title>
  ${platformChromeStyles('dark')}
  <style>
    .sm { --bg:#0a0a0b; --surface:#111113; --surface-2:#17171a; --line:#222226; --line-2:#2e2e33; --text:#ededef; --muted:#8c8c95; --accent:#f43f5e;
      --mono: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace; }
    body.sm { background: var(--bg); color: var(--text); font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .sm-main { max-width: 960px; margin: 0 auto; padding: 48px 16px 72px; }
    .eyebrow { font: 600 .72rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }
    .sm h1 { margin: 10px 0 8px; font-size: clamp(2rem, 5vw, 3rem); letter-spacing: -0.035em; }
    .lede { margin: 0; color: var(--muted); }
    .sm-main h1, .sm-main h2 { font-family: inherit; }
    .sm-search { margin-top: 24px; position: relative; display: block; }
    .sm-search input { width: 100%; height: 48px; border-radius: 12px; border: 1px solid var(--line-2); background: var(--surface); color: var(--text);
      padding: 0 16px 0 44px; font: inherit; outline: none; }
    .sm-search input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(244,63,94,.15); }
    .sm-search svg { position: absolute; left: 14px; top: 50%; margin-top: -10px; width: 20px; height: 20px; color: var(--muted); }
    .sm-sec { margin-top: 36px; }
    .sm-sec h2 { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; font-size: 1.05rem; }
    .sm-num { font: 600 .72rem/1 var(--mono); color: var(--muted); border: 1px solid var(--line-2); border-radius: 6px; padding: 5px 6px; }
    .sm-sec ul { list-style: none; margin: 0; padding: 0; display: grid; align-items: stretch; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
    .sm-sec li { display: flex; height: auto; min-height: 0; margin: 0; opacity: 0; transform: translateY(6px); animation: up .35s ease forwards; animation-delay: calc(var(--i) * 25ms + 60ms); }
    .sm-sec a { flex: 1 1 auto; display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface);
      color: inherit; text-decoration: none; transition: border-color .15s ease, background .15s ease, transform .15s ease; }
    .sm-sec a:hover, .sm-sec a:focus-visible { border-color: var(--line-2); background: var(--surface-2); transform: translateY(-1px); outline: none; }
    .sm-t { font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .sm-d { color: var(--muted); font-size: .9rem; line-height: 1.4; }
    .sm-p { margin-top: auto; padding-top: 6px; font: .76rem/1 var(--mono); color: #6b6b74; }
    .sm-badge { font: 700 .65rem/1 var(--mono); padding: 4px 6px; border-radius: 5px; border: 1px solid var(--line-2); color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
    .sm-empty { display: none; margin-top: 32px; color: var(--muted); text-align: center; }
    @keyframes up { to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .sm-sec li { animation: none; opacity: 1; transform: none; } }
  </style>
</head>
<body class="platform-chrome sm" data-theme="dark">
  ${renderPlatformHeader({ user, activePath: '/harita' })}
  <main class="sm-main" id="main-content">
    <div class="eyebrow">İçindekiler</div>
    <h1>Site haritası</h1>
    <p class="lede">Herkese açık ${total} sayfa, tek yerde.</p>
    <label class="sm-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input id="smq" type="search" placeholder="Sayfa ara…" aria-label="Sayfa ara" autocomplete="off">
    </label>
    ${sectionsHtml}
    <p class="sm-empty" id="smEmpty">Eşleşen sayfa yok.</p>
  </main>
  ${renderSearchDialog()}
  ${renderPlatformFooter()}
  ${platformChromeScript()}
  <script>
    (function () {
      var q = document.getElementById('smq'), empty = document.getElementById('smEmpty');
      q.addEventListener('input', function () {
        var v = q.value.toLocaleLowerCase('tr').trim(), any = false;
        document.querySelectorAll('[data-sec]').forEach(function (sec) {
          var shown = 0;
          sec.querySelectorAll('li').forEach(function (li) { var ok = !v || li.getAttribute('data-q').indexOf(v) !== -1; li.hidden = !ok; if (ok) shown++; });
          sec.hidden = shown === 0; if (shown) any = true;
        });
        empty.style.display = any ? 'none' : 'block';
      });
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderSiteMapPage, SECTIONS };
