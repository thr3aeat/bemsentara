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
    .platform-chrome{--pc-bg:${light ? '#ffffff' : '#101014'};--pc-surface:${light ? '#f5f5f7' : '#1a1a22'};--pc-text:${light ? '#18181b' : '#f5f5f7'};--pc-muted:${light ? '#65656f' : '#a4a4b1'};--pc-line:${light ? 'rgba(35,35,45,.12)' : 'rgba(255,255,255,.12)'};--pc-glass:${light ? 'rgba(255,255,255,.72)' : 'rgba(20,20,27,.72)'};--pc-glow:${light ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.14)'};--pc-hover:${light ? 'rgba(33,33,45,.065)' : 'rgba(255,255,255,.085)'};--pc-accent:#7165e7;color:var(--pc-text)}
    .platform-header{box-sizing:border-box;width:min(1360px,calc(100% - 32px));min-height:64px;margin:14px auto 0;padding:8px 12px;display:grid;grid-template-columns:max-content minmax(0,1fr) max-content;align-items:center;gap:10px;position:sticky;top:12px;z-index:900;isolation:isolate;contain:layout style;background:var(--pc-glass);border:1px solid var(--pc-line);border-radius:18px;box-shadow:0 16px 42px rgba(0,0,0,.13),inset 0 1px 0 var(--pc-glow);backdrop-filter:blur(22px) saturate(145%);-webkit-backdrop-filter:blur(22px) saturate(145%)}
    .platform-brand{min-width:0;display:flex;align-items:center;gap:9px;padding:0 5px;color:var(--pc-text);text-decoration:none;font-weight:850;letter-spacing:-.045em;white-space:nowrap;flex:0 0 auto;min-width:max-content}.platform-brand img{width:35px;height:35px;flex:0 0 auto;border-radius:11px;box-shadow:0 3px 12px rgba(0,0,0,.13)}.platform-brand i{font-style:normal;color:#ed5b7b}
    .platform-nav{min-width:0;display:flex;align-items:center;justify-content:center;gap:3px;overflow-x:auto;overflow-y:visible;white-space:nowrap;scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;scroll-behavior:smooth}.platform-nav::-webkit-scrollbar{display:none}
    .platform-nav a,.platform-nav button{flex:0 0 auto;white-space:nowrap;min-width:max-content;min-height:38px;display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:10px;padding:0 clamp(7px,1vw,11px);background:transparent;color:var(--pc-muted);font:700 clamp(.73rem,1.1vw,.84rem) inherit;text-decoration:none;cursor:pointer;transition:background-color .18s ease,color .18s ease,border-color .18s ease,box-shadow .18s ease;box-sizing:border-box}.platform-nav a:hover,.platform-nav button:hover{background:var(--pc-hover);color:var(--pc-text)}.platform-nav a[aria-current="page"]{background:var(--pc-hover);border-color:var(--pc-line);box-shadow:inset 0 1px 0 var(--pc-glow);color:var(--pc-text)}
    .platform-dropdown{position:relative;display:inline-flex;align-items:center;flex:0 0 auto}
    .platform-dropdown-btn{min-height:38px;display:inline-flex;align-items:center;gap:4px;border:1px solid transparent;border-radius:10px;padding:0 clamp(7px,1vw,11px);background:transparent;color:var(--pc-muted);font:700 clamp(.73rem,1.1vw,.84rem) inherit;cursor:pointer;white-space:nowrap;transition:background-color .18s ease,color .18s ease,border-color .18s ease;box-sizing:border-box}
    .platform-dropdown:hover .platform-dropdown-btn,.platform-dropdown-btn:hover,.platform-dropdown[data-open="true"] .platform-dropdown-btn{background:var(--pc-hover);color:var(--pc-text);border-color:var(--pc-line)}
    .platform-dropdown-btn[aria-current="page"]{background:var(--pc-hover);border-color:var(--pc-line);color:var(--pc-text)}
    .platform-dropdown-menu{position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%) translateY(4px);min-width:180px;max-width:calc(100vw - 32px);padding:6px;background:var(--pc-bg);border:1px solid var(--pc-line);border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.35),inset 0 1px 0 var(--pc-glow);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,transform .18s ease,visibility .18s;z-index:1000;display:flex;flex-direction:column;gap:3px}
    .platform-dropdown:hover .platform-dropdown-menu,.platform-dropdown:focus-within .platform-dropdown-menu,.platform-dropdown[data-open="true"] .platform-dropdown-menu{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}
    .platform-dropdown-menu a{display:flex!important;align-items:center;gap:8px;padding:8px 12px!important;border-radius:9px;color:var(--pc-muted)!important;font:650 .82rem inherit!important;text-decoration:none;white-space:nowrap;width:100%!important;box-sizing:border-box;transition:background .15s ease,color .15s ease!important}
    .platform-dropdown-menu a:hover{background:var(--pc-hover)!important;color:var(--pc-text)!important}
    .platform-dropdown-menu a[aria-current="page"]{background:var(--pc-hover)!important;color:var(--pc-accent)!important;font-weight:800!important}
    .platform-actions{min-width:0;display:flex;align-items:center;justify-content:flex-end;gap:7px;flex:0 0 auto}.platform-search-trigger{flex:0 0 auto;min-height:38px;display:inline-flex;align-items:center;gap:7px;border:1px solid var(--pc-line)!important;border-radius:10px;padding:0 9px;background:rgba(127,127,140,.06)!important;color:var(--pc-muted);font:700 .78rem inherit;cursor:pointer;box-shadow:inset 0 1px 0 var(--pc-glow);white-space:nowrap}.platform-search-trigger:hover{background:var(--pc-hover)!important;color:var(--pc-text)}.platform-search-trigger kbd{font:750 .64rem inherit;border:1px solid var(--pc-line);border-radius:5px;padding:2px 4px;color:var(--pc-muted);background:rgba(127,127,140,.07)}
    .platform-account{min-width:0;display:flex;align-items:center;gap:2px;flex:0 0 auto}.platform-account a{min-width:0;min-height:38px;display:inline-flex;align-items:center;padding:0 9px;border-radius:10px;color:var(--pc-muted);font-weight:750;font-size:.78rem;text-decoration:none;transition:background-color .18s ease,color .18s ease;white-space:nowrap;flex:0 0 auto}.platform-account a:hover{background:var(--pc-hover);color:var(--pc-text)}.platform-account .platform-account-name{display:block;max-width:clamp(86px,10vw,148px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.platform-account .platform-primary{padding:0 13px;background:var(--pc-text);color:var(--pc-bg);box-shadow:0 3px 12px rgba(0,0,0,.12)}
    .platform-menu-toggle{display:none;justify-self:end;width:40px;height:40px;border:1px solid var(--pc-line);border-radius:10px;background:var(--pc-hover);color:var(--pc-text);font-size:1.05rem;cursor:pointer;box-shadow:inset 0 1px 0 var(--pc-glow);flex-shrink:0}
    .platform-footer{width:min(1180px,calc(100% - 32px));margin:48px auto 0;padding:28px 0 40px;border-top:1px solid var(--pc-line);display:grid;grid-template-columns:1fr auto;gap:24px;color:var(--pc-muted);font-size:.82rem}.platform-footer strong{display:block;color:var(--pc-text);font-size:.95rem;margin-bottom:6px}.platform-footer nav{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px 18px}.platform-footer a{color:var(--pc-muted);text-decoration:none}.platform-footer a:hover{color:var(--pc-text)}
    .platform-search-backdrop{position:fixed;inset:0;z-index:1200;display:none;padding:9vh 18px;background:rgba(4,4,8,.72);backdrop-filter:blur(8px)}.platform-search-backdrop[data-open="true"]{display:block}.platform-search-panel{width:min(680px,100%);margin:auto;background:var(--pc-bg);color:var(--pc-text);border:1px solid var(--pc-line);border-radius:16px;box-shadow:0 28px 80px rgba(0,0,0,.38);overflow:hidden}.platform-search-head{display:flex;align-items:center;gap:10px;padding:15px;border-bottom:1px solid var(--pc-line)}.platform-search-head input{margin:0!important;padding:11px!important;border:0!important;box-shadow:none!important;background:transparent!important;color:var(--pc-text)!important;font:600 1rem inherit!important}.platform-search-close{border:1px solid var(--pc-line);border-radius:8px;background:var(--pc-surface);color:var(--pc-muted);padding:7px 9px;cursor:pointer}.platform-search-results{max-height:56vh;overflow:auto;padding:10px}.platform-search-empty{padding:28px;text-align:center;color:var(--pc-muted);line-height:1.55}.platform-search-result{display:block;padding:12px;border-radius:10px;color:var(--pc-text);text-decoration:none}.platform-search-result:hover,.platform-search-result[aria-selected="true"]{background:var(--pc-surface)}.platform-search-result small{display:block;color:var(--pc-accent);font-weight:800;margin-bottom:4px}.platform-search-result span{display:block;color:var(--pc-muted);font-size:.8rem;margin-top:4px}
    :where(.platform-header,.platform-footer,.platform-search-backdrop) :focus-visible{outline:3px solid rgba(124,106,247,.48);outline-offset:2px}
    @media(max-width:1120px){.platform-header{grid-template-columns:minmax(0,1fr) max-content;gap:8px}.platform-header[data-menu-open="true"]{max-height:calc(100vh - 24px);overflow-y:auto;overscroll-behavior:contain}.platform-menu-toggle{display:inline-grid;place-items:center}.platform-nav,.platform-actions{display:none;grid-column:1/-1;width:100%;min-width:0;flex-direction:column;align-items:stretch;justify-content:flex-start;overflow:visible;white-space:normal}.platform-header[data-menu-open="true"] .platform-nav,.platform-header[data-menu-open="true"] .platform-actions{display:flex}.platform-nav{padding-top:6px;border-top:1px solid var(--pc-line)}.platform-nav a,.platform-nav button,.platform-search-trigger{width:100%;justify-content:flex-start;box-sizing:border-box;padding:0 11px}.platform-dropdown{width:100%;flex-direction:column;align-items:stretch}.platform-dropdown-btn{width:100%;justify-content:space-between;box-sizing:border-box;padding:0 11px}.platform-dropdown-menu{position:static;transform:none!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;box-shadow:none;background:transparent;border:none;border-left:2px solid var(--pc-line);border-radius:0;margin-left:12px;padding:4px 0 4px 8px;max-width:none}.platform-actions{gap:7px}.platform-account{width:100%;flex-wrap:wrap;gap:4px}.platform-account a{flex:0 0 auto}.platform-account .platform-account-name{max-width:min(50vw,260px)}.platform-footer{grid-template-columns:1fr}.platform-footer nav{justify-content:flex-start}}
    @media(max-width:480px){.platform-header{width:calc(100% - 20px);margin-top:10px;padding:7px 8px;border-radius:15px;top:8px}.platform-brand img{width:32px;height:32px}.platform-brand{font-size:.94rem}.platform-account{flex-direction:column;align-items:stretch}.platform-account a{width:100%;box-sizing:border-box;justify-content:flex-start}.platform-account .platform-account-name{max-width:none}.platform-search-trigger kbd{margin-left:auto}.platform-footer{width:calc(100% - 24px)}}
    @media(prefers-reduced-motion:reduce){.platform-chrome *, .platform-chrome *::before,.platform-chrome *::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
  </style>`;
}

function renderPlatformHeader({ user = null, activePath = '', theme = 'dark', authorizedLinks = '' } = {}) {
  const active = (path) => activePath === path ? ' aria-current="page"' : '';
  const account = user
    ? `<div class="platform-account"><a href="/dashboard"${active('/dashboard')}>Panel</a><a href="/settings"${active('/settings')}>Ayarlar</a><a class="platform-account-name" href="/profile" title="${esc(user.username || user.discordUsername || 'Profil')}">${esc(user.username || user.discordUsername || 'Profil')}</a><a href="/logout">Çıkış</a></div>`
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
    </nav>
    <div class="platform-actions">
      <button type="button" class="platform-search-trigger" data-global-search-trigger aria-label="EkoYıldız'da ara">Ara <kbd>Ctrl K</kbd></button>
      ${account}
    </div>
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
    const resultsBox=document.querySelector('[data-global-search-results]');
    let previousFocus=null;
    let searchTimer=null;
    let activeIndex=-1;
    const openSearch=()=>{if(!dialog)return;previousFocus=document.activeElement;dialog.dataset.open='true';dialog.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(()=>input?.focus(),0)};
    const closeSearch=()=>{if(!dialog)return;dialog.dataset.open='false';dialog.setAttribute('aria-hidden','true');document.body.style.overflow='';previousFocus?.focus?.()};
    document.querySelectorAll('[data-global-search-trigger]').forEach(btn=>btn.addEventListener('click',openSearch));
    document.querySelector('[data-global-search-close]')?.addEventListener('click',closeSearch);
    dialog?.addEventListener('click',event=>{if(event.target===dialog)closeSearch()});
    const setEmpty=(message)=>{if(!resultsBox)return;resultsBox.replaceChildren();const empty=document.createElement('div');empty.className='platform-search-empty';empty.textContent=message;resultsBox.appendChild(empty);activeIndex=-1};
    const selectResult=(index)=>{const items=[...(resultsBox?.querySelectorAll('.platform-search-result')||[])];if(!items.length)return;activeIndex=(index+items.length)%items.length;items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===activeIndex)));items[activeIndex].scrollIntoView({block:'nearest'})};
    const renderResults=(items)=>{if(!resultsBox)return;resultsBox.replaceChildren();activeIndex=-1;if(!items.length){setEmpty('Bu aramayla eşleşen bir içerik bulamadık. Farklı bir ifade deneyebilirsin.');return}items.forEach(item=>{const link=document.createElement('a');link.className='platform-search-result';link.href=item.url;link.setAttribute('aria-selected','false');const category=document.createElement('small');category.textContent=item.breadcrumb||item.category;const title=document.createElement('strong');title.textContent=item.title;const description=document.createElement('span');description.textContent=item.description||'';link.append(category,title,description);resultsBox.appendChild(link)})};
    input?.addEventListener('input',()=>{clearTimeout(searchTimer);const query=input.value.trim();if(query.length<2){setEmpty('Aramak için en az iki karakter yaz.');return}setEmpty('Aranıyor…');searchTimer=setTimeout(async()=>{try{const response=await fetch('/api/search?q='+encodeURIComponent(query),{headers:{Accept:'application/json'}});const data=await response.json();if(!response.ok||!data.success)throw new Error('search_failed');renderResults(Array.isArray(data.results)?data.results:[])}catch(error){setEmpty('Arama şu anda yanıt vermiyor. Help veya Safety Center bağlantılarından devam edebilirsin.')}},180)});
    document.querySelectorAll('[data-dropdown]').forEach(dd=>{
      const btn=dd.querySelector('.platform-dropdown-btn');
      btn?.addEventListener('click',(e)=>{
        e.stopPropagation();
        const isOpen=dd.dataset.open==='true';
        document.querySelectorAll('[data-dropdown]').forEach(d=>{if(d!==dd)d.dataset.open='false'});
        dd.dataset.open=String(!isOpen);
        btn.setAttribute('aria-expanded',String(!isOpen));
      });
    });
    document.addEventListener('click',()=>{
      document.querySelectorAll('[data-dropdown]').forEach(dd=>{
        dd.dataset.open='false';
        dd.querySelector('.platform-dropdown-btn')?.setAttribute('aria-expanded','false');
      });
    });
    document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();return}if(event.key==='Escape'){document.querySelectorAll('[data-dropdown]').forEach(dd=>{dd.dataset.open='false';dd.querySelector('.platform-dropdown-btn')?.setAttribute('aria-expanded','false')});if(dialog?.dataset.open==='true'){closeSearch();return}}if(dialog?.dataset.open!=='true')return;if(event.key==='ArrowDown'){event.preventDefault();selectResult(activeIndex+1)}else if(event.key==='ArrowUp'){event.preventDefault();selectResult(activeIndex-1)}else if(event.key==='Enter'&&activeIndex>=0){event.preventDefault();resultsBox?.querySelectorAll('.platform-search-result')[activeIndex]?.click()}});
  })();</script>`;
}

module.exports = {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
};
