'use strict';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function platformChromeStyles(theme = 'dark') {
  const light = theme === 'light';
  return `<style>
    .platform-chrome{--pc-bg:${light ? '#ffffff' : '#101014'};--pc-surface:${light ? '#f7f7f8' : '#17171d'};--pc-text:${light ? '#171719' : '#f5f5f7'};--pc-muted:${light ? '#686872' : '#a4a4b1'};--pc-line:${light ? '#e5e5e9' : 'rgba(255,255,255,.1)'};--pc-accent:#7c6af7;color:var(--pc-text)}
    .platform-header{width:min(1180px,calc(100% - 32px));min-height:68px;margin:14px auto 0;padding:10px 14px;display:flex;align-items:center;gap:18px;position:sticky;top:12px;z-index:500;background:color-mix(in srgb,var(--pc-bg) 94%,transparent);border:1px solid var(--pc-line);border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.12);backdrop-filter:blur(18px)}
    .platform-brand{display:flex;align-items:center;gap:10px;color:var(--pc-text);text-decoration:none;font-weight:850;letter-spacing:-.045em;white-space:nowrap}.platform-brand img{width:36px;height:36px;border-radius:10px}.platform-brand i{font-style:normal;color:#ed5b7b}
    .platform-nav{display:flex;align-items:center;gap:3px;flex:1}.platform-nav a,.platform-nav button{min-height:40px;display:inline-flex;align-items:center;border:0;border-radius:9px;padding:0 11px;background:transparent;color:var(--pc-muted);font:700 .84rem inherit;text-decoration:none;cursor:pointer}.platform-nav a:hover,.platform-nav button:hover,.platform-nav a[aria-current="page"]{background:var(--pc-surface);color:var(--pc-text)}
    .platform-search-trigger{margin-left:auto!important;border:1px solid var(--pc-line)!important;gap:8px}.platform-search-trigger kbd{font:700 .68rem inherit;border:1px solid var(--pc-line);border-radius:5px;padding:2px 5px;color:var(--pc-muted)}
    .platform-account{display:flex;align-items:center;gap:5px}.platform-account a{min-height:40px;display:inline-flex;align-items:center;padding:0 12px;border-radius:9px;color:var(--pc-muted);font-weight:750;font-size:.82rem;text-decoration:none}.platform-account .platform-primary{background:var(--pc-text);color:var(--pc-bg)}
    .platform-menu-toggle{display:none;margin-left:auto;width:42px;height:42px;border:1px solid var(--pc-line);border-radius:9px;background:var(--pc-surface);color:var(--pc-text);font-size:1.15rem;cursor:pointer}
    .platform-footer{width:min(1180px,calc(100% - 32px));margin:48px auto 0;padding:28px 0 40px;border-top:1px solid var(--pc-line);display:grid;grid-template-columns:1fr auto;gap:24px;color:var(--pc-muted);font-size:.82rem}.platform-footer strong{display:block;color:var(--pc-text);font-size:.95rem;margin-bottom:6px}.platform-footer nav{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px 18px}.platform-footer a{color:var(--pc-muted);text-decoration:none}.platform-footer a:hover{color:var(--pc-text)}
    .platform-search-backdrop{position:fixed;inset:0;z-index:1200;display:none;padding:9vh 18px;background:rgba(4,4,8,.72);backdrop-filter:blur(8px)}.platform-search-backdrop[data-open="true"]{display:block}.platform-search-panel{width:min(680px,100%);margin:auto;background:var(--pc-bg);color:var(--pc-text);border:1px solid var(--pc-line);border-radius:16px;box-shadow:0 28px 80px rgba(0,0,0,.38);overflow:hidden}.platform-search-head{display:flex;align-items:center;gap:10px;padding:15px;border-bottom:1px solid var(--pc-line)}.platform-search-head input{margin:0!important;padding:11px!important;border:0!important;box-shadow:none!important;background:transparent!important;color:var(--pc-text)!important;font:600 1rem inherit!important}.platform-search-close{border:1px solid var(--pc-line);border-radius:8px;background:var(--pc-surface);color:var(--pc-muted);padding:7px 9px;cursor:pointer}.platform-search-results{max-height:56vh;overflow:auto;padding:10px}.platform-search-empty{padding:28px;text-align:center;color:var(--pc-muted);line-height:1.55}.platform-search-result{display:block;padding:12px;border-radius:10px;color:var(--pc-text);text-decoration:none}.platform-search-result:hover,.platform-search-result[aria-selected="true"]{background:var(--pc-surface)}.platform-search-result small{display:block;color:var(--pc-accent);font-weight:800;margin-bottom:4px}.platform-search-result span{display:block;color:var(--pc-muted);font-size:.8rem;margin-top:4px}
    :where(.platform-header,.platform-footer,.platform-search-backdrop) :focus-visible{outline:3px solid rgba(124,106,247,.48);outline-offset:2px}
    @media(max-width:920px){.platform-menu-toggle{display:inline-grid;place-items:center}.platform-header{flex-wrap:wrap}.platform-nav,.platform-account{display:none;width:100%;flex-direction:column;align-items:stretch}.platform-header[data-menu-open="true"] .platform-nav,.platform-header[data-menu-open="true"] .platform-account{display:flex}.platform-nav a,.platform-nav button,.platform-account a{width:100%;justify-content:flex-start}.platform-search-trigger{margin-left:0!important}.platform-footer{grid-template-columns:1fr}.platform-footer nav{justify-content:flex-start}}
    @media(prefers-reduced-motion:reduce){.platform-chrome *, .platform-chrome *::before,.platform-chrome *::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
  </style>`;
}

function renderPlatformHeader({ user = null, activePath = '', theme = 'dark', authorizedLinks = '' } = {}) {
  const active = (path) => activePath === path ? ' aria-current="page"' : '';
  const account = user
    ? `<div class="platform-account"><a href="/dashboard"${active('/dashboard')}>Panel</a><a href="/settings"${active('/settings')}>Ayarlar</a><a href="/profile" title="${esc(user.username || user.discordUsername || 'Profil')}">${esc(user.username || user.discordUsername || 'Profil')}</a><a href="/logout">Çıkış</a></div>`
    : '<div class="platform-account"><a class="platform-primary" href="/login">Giriş yap</a></div>';

  return `<header class="platform-header platform-chrome" data-theme="${theme}" data-menu-open="false">
    <a class="platform-brand" href="/" aria-label="EkoYıldız ana sayfa"><img src="https://i.imgur.com/PFcAc6q.png" alt=""><span>Eko<i>Yıldız</i></span></a>
    <button class="platform-menu-toggle" type="button" aria-label="Navigasyonu aç" aria-expanded="false" aria-controls="platform-navigation">☰</button>
    <nav class="platform-nav" id="platform-navigation" aria-label="Ana navigasyon">
      <a href="/"${active('/')}>Ana Sayfa</a>
      <a href="/help"${active('/help')}>Help Center</a>
      <a href="/safety"${active('/safety')}>Safety Center</a>
      <a href="/blog"${active('/blog')}>Blog</a>
      <a href="/video-blog"${active('/video-blog')}>Video Blog</a>
      <a href="/cekilisler"${active('/cekilisler')}>Çekilişler</a>
      ${authorizedLinks || ''}
      <button type="button" class="platform-search-trigger" data-global-search-trigger aria-label="EkoYıldız'da ara">Ara <kbd>Ctrl K</kbd></button>
    </nav>
    ${account}
  </header>`;
}

function renderPlatformFooter({ theme = 'dark' } = {}) {
  return `<footer class="platform-footer platform-chrome" data-theme="${theme}"><div><strong>EkoYıldız</strong><span>Topluluk, içerik, güvenlik ve destek tek ekosistemde.</span></div><nav aria-label="Alt navigasyon"><a href="/help">Help Center</a><a href="/safety">Safety Center</a><a href="/blog">Blog</a><a href="/status">Durum</a><a href="/anayasasi">Politikalar</a><a href="/appeals">İtirazlar</a></nav></footer>`;
}

function renderSearchDialog({ theme = 'dark' } = {}) {
  return `<div class="platform-search-backdrop platform-chrome" data-theme="${theme}" data-global-search-dialog data-open="false" aria-hidden="true"><section class="platform-search-panel" role="dialog" aria-modal="true" aria-labelledby="platform-search-title"><div class="platform-search-head"><span aria-hidden="true">⌕</span><label id="platform-search-title" class="sr-only" for="platform-search-input">EkoYıldız'da ara</label><input id="platform-search-input" type="search" autocomplete="off" placeholder="Help, Safety, blog ve videolarda ara…"><button class="platform-search-close" type="button" data-global-search-close aria-label="Aramayı kapat">Esc</button></div><div class="platform-search-results" data-global-search-results aria-live="polite"><div class="platform-search-empty">Bir konu yaz. Örneğin “ticket”, “phishing” veya “kamp”.</div></div></section></div>`;
}

function platformChromeScript() {
  return `<script>(function(){
    const header=document.querySelector('.platform-header');
    const toggle=header?.querySelector('.platform-menu-toggle');
    toggle?.addEventListener('click',()=>{const open=header.dataset.menuOpen!=='true';header.dataset.menuOpen=String(open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Navigasyonu kapat':'Navigasyonu aç')});
    const dialog=document.querySelector('[data-global-search-dialog]');
    const input=document.getElementById('platform-search-input');
    let previousFocus=null;
    const openSearch=()=>{if(!dialog)return;previousFocus=document.activeElement;dialog.dataset.open='true';dialog.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(()=>input?.focus(),0)};
    const closeSearch=()=>{if(!dialog)return;dialog.dataset.open='false';dialog.setAttribute('aria-hidden','true');document.body.style.overflow='';previousFocus?.focus?.()};
    document.querySelectorAll('[data-global-search-trigger]').forEach(btn=>btn.addEventListener('click',openSearch));
    document.querySelector('[data-global-search-close]')?.addEventListener('click',closeSearch);
    dialog?.addEventListener('click',event=>{if(event.target===dialog)closeSearch()});
    document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch()}else if(event.key==='Escape'&&dialog?.dataset.open==='true'){closeSearch()}});
  })();</script>`;
}

module.exports = {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
};
