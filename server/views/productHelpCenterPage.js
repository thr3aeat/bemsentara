'use strict';

const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
} = require('./platformChrome');

const helpCategories = [
  { icon: '🔐', title: 'Hesap ve giriş', description: 'Giriş yöntemleri, Discord hesabını bağlama, doğrulama ve hesap ayarları.', links: [['Giriş seçenekleri', '/login'], ['Hesap ayarları', '/settings']] },
  { icon: '🤖', title: 'EkoYıldız Bot', description: 'Bot komutları, izinler, DM bildirimleri ve yaygın sorunların çözümü.', links: [['Bot rehberi', '/blog/phibi-bot-nasil-kullanilir'], ['Bot desteği', '/help/bot']] },
  { icon: '🧭', title: 'Panel ve özellikler', description: 'Dashboard, profil, bildirimler, çekilişler ve topluluk araçlarını kullanma.', links: [['Paneli aç', '/dashboard'], ['Çekilişler', '/cekilisler']] },
  { icon: '🎫', title: 'Ticket ve destek', description: 'Yeni destek talebi gönder, biletlerini izle ve teslim sorunlarını çöz.', links: [['Yeni ticket aç', '/tickets/new'], ['Sorun giderici', '/yardim/ticket-sorun-giderici']] },
  { icon: '⚖️', title: 'Moderasyon ve itiraz', description: 'Bir işlemi anlamak, kanıt hazırlamak ve uygun itiraz kanalına ulaşmak.', links: [['İtiraz merkezi', '/appeals'], ['Ceza rehberi', '/yardim/ceza-ve-itiraz']] },
  { icon: '🛡️', title: 'Güvenlik ve Safety', description: 'Phishing, scam, hesap güvenliği, raporlama ve topluluk güvenliği rehberleri.', links: [['Safety Center', '/safety'], ['Raporlama rehberi', '/yardim/kullanici-raporlama']] },
];

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderProductHelpCenterPage(user = null) {
  const cards = helpCategories.map((category) => `<article class="help-card"><span class="help-icon" aria-hidden="true">${category.icon}</span><h2>${esc(category.title)}</h2><p>${esc(category.description)}</p><div class="help-links">${category.links.map(([label, url]) => `<a href="${url}">${esc(label)} <span aria-hidden="true">→</span></a>`).join('')}</div></article>`).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="description" content="EkoYıldız hesap, bot, panel ve destek yardım merkezi."><title>Help Center — EkoYıldız</title>${platformChromeStyles('light')}<style>
  :root{--ink:#171719;--muted:#686872;--line:#e6e6ea;--soft:#f7f7f8;--accent:#6356e8}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:#fff;font:16px Inter,system-ui,sans-serif}.help-wrap{width:min(1120px,calc(100% - 36px));margin:auto}.help-hero{padding:74px 0 44px;display:grid;grid-template-columns:1.25fr .75fr;gap:40px;align-items:end}.help-eyebrow{color:var(--accent);font-size:.74rem;font-weight:850;letter-spacing:.12em}.help-hero h1{max-width:760px;margin:14px 0 18px;font-size:clamp(2.8rem,6vw,5.4rem);line-height:.98;letter-spacing:-.075em}.help-hero p{max-width:640px;margin:0;color:var(--muted);line-height:1.65;font-size:1.08rem}.help-search{align-self:end;border:1px solid var(--line);border-radius:14px;padding:22px;background:var(--soft)}.help-search strong{display:block;font-size:1.05rem}.help-search p{font-size:.86rem;margin:8px 0 18px}.help-search button{min-height:43px;border:0;border-radius:9px;padding:0 14px;background:var(--ink);color:#fff;font-weight:800;cursor:pointer}.help-grid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-bottom:54px}.help-card{padding:26px;min-height:260px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.help-card:nth-child(3n){border-right:0}.help-card:nth-last-child(-n+3){border-bottom:0}.help-icon{font-size:1.45rem}.help-card h2{font-size:1.15rem;letter-spacing:-.035em;margin:16px 0 9px}.help-card p{color:var(--muted);font-size:.9rem;line-height:1.55;min-height:70px}.help-links{display:grid;gap:8px;margin-top:18px}.help-links a{color:var(--ink);font-size:.84rem;font-weight:800;text-decoration:none}.help-links a:hover{color:var(--accent)}.help-note{margin:0 0 56px;padding:24px;border-left:4px solid var(--accent);background:#f6f5ff;border-radius:0 12px 12px 0}.help-note h2{font-size:1.05rem;margin:0 0 7px}.help-note p{margin:0;color:var(--muted);line-height:1.55}@media(max-width:800px){.help-hero{grid-template-columns:1fr;padding-top:48px}.help-grid{grid-template-columns:1fr}.help-card,.help-card:nth-child(3n),.help-card:nth-last-child(-n+3){border-right:0;border-bottom:1px solid var(--line)}.help-card:last-child{border-bottom:0}.help-card p{min-height:0}}
  </style></head><body>${renderPlatformHeader({ user, activePath: '/help', theme: 'light' })}<main class="help-wrap"><section class="help-hero"><div><div class="help-eyebrow">EKOYILDIZ HELP CENTER</div><h1>Bir şeyi çözmek için doğru yerden başla.</h1><p>Hesap, bot, panel, ticket ve topluluk özellikleri için kısa yollar ve adım adım rehberler. Güvenlik veya moderasyon konusunda yardıma ihtiyacın varsa Safety Center seni bekliyor.</p></div><aside class="help-search"><strong>Her yerde ara</strong><p>Help, Safety, blog ve video içeriklerini tek aramada bul.</p><button type="button" data-global-search-trigger>Aramayı aç · Ctrl K</button></aside></section><section class="help-grid" aria-label="Yardım kategorileri">${cards}</section><section class="help-note"><h2>Bu bir güvenlik konusu mu?</h2><p>Şüpheli DM, phishing, scam, hesap ele geçirilmesi, moderasyon veya itiraz konuları için <a href="/safety">Safety Center'a geç</a>. Acil destek gerekiyorsa <a href="/tickets/new">ticket oluşturabilirsin</a>.</p></section></main>${renderPlatformFooter({ theme: 'light' })}${renderSearchDialog({ theme: 'light' })}${platformChromeScript()}</body></html>`;
}

module.exports = { renderProductHelpCenterPage, helpCategories };
