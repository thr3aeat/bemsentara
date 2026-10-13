'use strict';

/**
 * /ataturk sayfasının galeri, ses ve video kaynaklarını Wikimedia Commons'tan çözer (24 sa önbellek).
 * Elle yazılmış adresler (yanlış hash yolu, ölü YouTube kimliği) bozulduğu için adresleri API verir.
 * Uygun, kamu malı, konuyla eşleşen dosya bulunamazsa o öğe null kalır: yanlış görsel göstermektense
 * sayfa yer tutucuyla devam eder.
 */

const axios = require('axios');

const API = 'https://commons.wikimedia.org/w/api.php';
const HEADERS = { 'User-Agent': 'EkoYildizBot/1.0 (https://github.com/thr3aeat/bemsentara; Discord community bot; contact: alpcelikx@gmail.com)' };
const TTL = 24 * 60 * 60 * 1000;
const FAIL_TTL = 10 * 60 * 1000;

// Commons'ta doğrulanmış, kamu malı dosyalar.
const CURATED = {
  'photo-1': 'Ataturk13.JPG',
  'photo-2': 'Mustafa Kemal harf devriminde.jpg',
  'photo-3': 'Atatürk during the 10th Anniversary Speech.jpg'
};
const AUDIO_FILE = "Mustafa Kemal's speech at the 10th Anniversary of the Republic of Turkey.ogg";

// Aranan kartlar: görselin başlık/açıklaması konu kelimelerini içermeli.
const SEARCHED = {
  'photo-4': { query: 'Atatürk Dumlupınar 1922', topic: /dumlup|büyük taarruz|buyuk taarruz|başkomutan|baskomutan|kağnı|kagni/i },
  'photo-5': { query: 'Atatürk köylü çiftçi', topic: /köylü|koylu|farmer|villager|peasant|çiftçi|ciftci/i },
  'photo-6': { query: 'Atatürk Florya', topic: /florya|kürek|kurek|rowing|boat|deniz|swim/i }
};
const VIDEO_QUERY = 'Atatürk filetype:video';

const ATATURK = /atat[üu]rk|mustafa kemal/i;
const BAD_TITLE = /banknote|stamp|coin|poster|billboard|statue|heykel|monument|anıt|anit|bust|mezar|anıtkabir/i;
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const cleanUrl = (u) => (u ? String(u).split('?')[0] : null);

function describe(page) {
  const info = (page.imageinfo || [])[0];
  if (!info) return null;
  const m = info.extmetadata || {};
  return {
    title: page.title.replace(/^File:/, '').replace(/\.[^.]+$/, ''),
    mime: info.mime, width: info.width || 0, size: info.size || 0,
    url: cleanUrl(info.url), thumb: cleanUrl(info.thumburl || info.url),
    license: strip(m.LicenseShortName && m.LicenseShortName.value),
    text: `${page.title} ${strip(m.ImageDescription && m.ImageDescription.value)}`,
    pageUrl: info.descriptionurl || null
  };
}

const isFree = (d) => /public domain|^pd\b|^pd-|cc0/i.test(d.license);

function createMediaService({ http = axios, now = Date.now } = {}) {
  let cache = null;
  let inflight = null;

  const get = (params) => http.get(API, {
    headers: HEADERS, timeout: 15000,
    params: { action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|mime|size|extmetadata', iiextmetadatafilter: 'LicenseShortName|ImageDescription', iiurlwidth: 960, ...params }
  }).then((r) => Object.values((r.data.query && r.data.query.pages) || {}));

  async function byTitles(titles) {
    const pages = await get({ titles: titles.map((t) => `File:${t}`).join('|') });
    return pages.map(describe).filter(Boolean);
  }

  async function search(query) {
    const pages = await get({ generator: 'search', gsrsearch: query, gsrnamespace: 6, gsrlimit: 20 });
    return pages.sort((a, b) => (a.index || 0) - (b.index || 0)).map(describe).filter(Boolean);
  }

  const photo = (d) => ({ thumb: d.thumb, full: d.thumb, title: d.title, license: d.license, pageUrl: d.pageUrl });

  async function resolve() {
    const out = { gallery: {}, audio: null, video: null };

    const curated = await byTitles([...Object.values(CURATED), AUDIO_FILE]).catch(() => []);
    for (const [id, file] of Object.entries(CURATED)) {
      const d = curated.find((c) => c.text.startsWith(`File:${file}`));
      if (d && d.mime.startsWith('image/') && isFree(d)) out.gallery[id] = photo(d);
    }
    const a = curated.find((c) => c.text.startsWith(`File:${AUDIO_FILE}`));
    if (a && /ogg|audio/i.test(a.mime) && isFree(a)) out.audio = { url: a.url, title: a.title, license: a.license, pageUrl: a.pageUrl };

    for (const [id, spec] of Object.entries(SEARCHED)) {
      const found = (await search(spec.query).catch(() => [])).find((d) =>
        d.mime === 'image/jpeg' && d.width >= 600 && isFree(d) && ATATURK.test(d.text) && spec.topic.test(d.text) && !BAD_TITLE.test(d.title));
      if (found) out.gallery[id] = photo(found);
    }

    const v = (await search(VIDEO_QUERY).catch(() => []))
      .filter((d) => /^video\//.test(d.mime) && isFree(d) && ATATURK.test(d.text) && d.size > 0 && d.size <= 80 * 1024 * 1024)
      .sort((x, y) => (/webm/.test(y.mime) ? 1 : 0) - (/webm/.test(x.mime) ? 1 : 0))[0];
    if (v) out.video = { url: v.url, mime: v.mime, poster: v.thumb, title: v.title, license: v.license, pageUrl: v.pageUrl };
    return out;
  }

  async function getMedia() {
    if (cache && now() < cache.expiresAt) return cache.data;
    if (inflight) return inflight;
    inflight = (async () => {
      try {
        const data = await resolve();
        const found = Object.keys(data.gallery).length + (data.audio ? 1 : 0) + (data.video ? 1 : 0);
        cache = { data, expiresAt: now() + (found ? TTL : FAIL_TTL) };
      } catch (err) {
        console.warn(`[AtaturkMedia] Çözülemedi: ${err.message}`);
        cache = { data: cache ? cache.data : { gallery: {}, audio: null, video: null }, expiresAt: now() + FAIL_TTL };
      } finally { inflight = null; }
      return cache.data;
    })();
    return inflight;
  }

  return { getMedia };
}

module.exports = { createMediaService, mediaService: createMediaService(), CURATED, AUDIO_FILE };
