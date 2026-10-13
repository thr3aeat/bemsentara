'use strict';

/**
 * Discord / sosyal medya bağlantı önizlemeleri (Open Graph).
 * Her HTML sayfasının <head>'ine sayfaya özel başlık, açıklama, renk ve
 * /og/card.png?p=<yol> görselini ekler. Görseller ogImage.js ile üretilir.
 */

const SITE = 'EkoYıldız';
const DEFAULT_DESC = 'Yayınlar, topluluk, destek ve daha fazlası tek yerde.';

// Sayfaya özel içerik: [eyebrow, başlık, açıklama, renk]
const PAGES = {
  '/linkler': ['BAĞLANTILAR', 'EkoYıldız', 'Kick, Twitch, YouTube, TikTok, Discord ve Instagram. Hepsi tek sayfada.', '#f43f5e'],
  '/': ['ANA SAYFA', 'EkoYıldız', 'Topluluk, içerik, güvenlik ve destek tek ekosistemde.', '#f43f5e'],
  '/ataturk': ['ULU ÖNDER', 'Mustafa Kemal Atatürk', 'Günün fotoğrafı, sesler, videolar ve sözlerle dijital sergi.', '#dc2626'],
  '/yardim': ['YARDIM MERKEZİ', 'Nasıl yardımcı olabiliriz?', 'Sık sorulan sorular, rehberler ve destek talebi.', '#3b82f6'],
  '/status': ['SİSTEM DURUMU', 'Durum', 'Bot, site ve servislerin anlık çalışma durumu.', '#22c55e'],
  '/reklam': ['İŞBİRLİĞİ', 'Reklam & Sponsorluk', 'Markanı EkoYıldız topluluğuyla buluştur. Başvuru Discord ticket ile.', '#f59e0b'],
  '/ekoyildizda-calis': ['KARİYER', "EkoYıldız'da çalış", 'Ekibe katıl: moderasyon, geliştirme ve içerik pozisyonları.', '#8b5cf6'],
  '/forms': ['BAŞVURULAR', 'Formlar', 'Topluluk elçisi, geliştirici ve diğer başvuru formları.', '#8b5cf6'],
  '/itiraz-merkezi': ['İTİRAZ', 'İtiraz Merkezi', 'Ceza ve kararlara itiraz et, durumunu takip et.', '#ef4444'],
  '/anayasa': ['KURALLAR', 'EkoYıldız Anayasası', 'Topluluğun temel kuralları ve ilkeleri.', '#eab308'],
  '/video-blog': ['VİDEO', 'Video Blog', 'Son videolar ve yayın arşivi.', '#ef4444'],
  '/tumodlar': ['EKİP', 'Tüm Modlar', 'EkoYıldız moderasyon ekibi.', '#14b8a6'],
  '/ekip': ['VİDEO EKİBİ', 'Videoların arkasındaki ekip', 'Kurucu eko, ekip danışmanı Zyrox ve EkoYıldız video ekibi.', '#eab308'],
  '/harita': ['İÇİNDEKİLER', 'Site haritası', 'EkoYıldız sitesindeki herkese açık tüm sayfalar tek yerde.', '#14b8a6'],
  '/cark': ['ÖDÜLLER', 'Şans Çarkı', 'Çarkı çevir, ödülünü kap.', '#ec4899']
};
const ALIASES = {
  '/links': '/linkler', '/bio': '/linkler', '/eko': '/linkler', '/atamiz': '/ataturk', '/help': '/yardim', '/faq': '/yardim',
  '/itiraz': '/itiraz-merkezi', '/appeal': '/itiraz-merkezi', '/appeals': '/itiraz-merkezi', '/careers': '/ekoyildizda-calis',
  '/anayasasi': '/anayasa', '/ekoyildiz/anayasasi': '/anayasa', '/ekoyildiz-anayasasi': '/anayasa', '/rules': '/anayasa',
  '/team': '/ekip', '/sitemap': '/harita', '/icindekiler': '/harita',
  '/kutu-ac': '/cark', '/rewards': '/cark'
};

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = (v) => String(v || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function normalizePath(p) {
  let s = String(p || '/').split('?')[0].replace(/\/+$/, '') || '/';
  return ALIASES[s] || s;
}

/** Yolun kart bilgisi. HTML verilirse bilinmeyen sayfalar <title>/description'dan beslenir. */
// Sayfa sunulurken çıkarılan başlıklar; görsel uç noktası yalnızca bunları ve PAGES'i çizer.
const seen = new Map();
const MAX_SEEN = 300;

function metaFor(pathname, html = '') {
  const key = normalizePath(pathname);
  const known = PAGES[key];
  if (known) return { key, eyebrow: known[0], title: known[1], desc: known[2], color: known[3] };
  if (!html && seen.has(key)) return seen.get(key);
  const t = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const d = /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i.exec(html);
  const title = unesc(t ? t[1] : SITE).split(/\s+[—|–-]\s+/)[0].trim() || SITE;
  const m = { key, eyebrow: SITE.toLocaleUpperCase('tr'), title, desc: unesc(d ? d[1] : DEFAULT_DESC), color: '#f43f5e' };
  if (html && (seen.has(key) || seen.size < MAX_SEEN)) seen.set(key, m);
  return m;
}

/** Görsel istenebilecek yol mu (rastgele ?p= ile sonsuz görsel üretimini engeller). */
function isKnownPath(pathname) {
  const key = normalizePath(pathname);
  return Boolean(PAGES[key] || seen.has(key));
}

function baseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0];
  return `${proto}://${req.get('host')}`;
}

const STRIP = /\s*<meta\s+(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+|theme-color)["'][^>]*>/gi;

function injectOg(html, req) {
  if (typeof html !== 'string' || !/<\/head>/i.test(html) || !/<html/i.test(html)) return html;
  const m = metaFor(req.path, html);
  const base = baseUrl(req);
  const url = base + (req.path === '/' ? '/' : req.path);
  const img = `${base}/og/card.png?p=${encodeURIComponent(m.key)}`;
  const tags = [
    `<meta property="og:site_name" content="${SITE}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(m.title === SITE ? `${SITE} — ${capital(m.eyebrow)}` : m.title)}">`,
    `<meta property="og:description" content="${esc(m.desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:locale" content="tr_TR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="theme-color" content="${m.color}">`
  ].join('\n  ');
  return html.replace(STRIP, '').replace(/<\/head>/i, `  ${tags}\n</head>`);
}

function capital(s) {
  const t = String(s || '').toLocaleLowerCase('tr');
  return t.charAt(0).toLocaleUpperCase('tr') + t.slice(1);
}

/** Express ara katmanı: GET HTML cevaplarına önizleme etiketlerini ekler. */
function ogMiddleware(req, res, next) {
  if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/public/')) return next();
  const send = res.send;
  res.send = function (body) {
    try { if (typeof body === 'string') body = injectOg(body, req); } catch (_) {}
    return send.call(this, body);
  };
  next();
}

module.exports = { ogMiddleware, injectOg, metaFor, normalizePath, isKnownPath, PAGES };
