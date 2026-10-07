'use strict';

/**
 * ataturkImageService.js
 *
 * Ulu Önder Atatürk görsel sağlayıcısı. Bot (e!atatürk) ve web sitesi
 * (/ataturk, /api/ataturk/daily) aynı kaynaktan beslenir.
 *
 * - Kaynak: Wikimedia Commons kategorisi (JPEG fotoğraflar), 6 saat önbellek
 * - Kaynağa ulaşılamazsa yerel yedek listeye düşer
 * - "Günün fotoğrafı" Türkiye saatine göre gün numarasından deterministik
 *   seçilir; bot ve web aynı günde aynı fotoğrafı gösterir.
 */

const crypto = require('crypto');
const axios = require('axios');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const ROOT_CATEGORY = 'Category:Mustafa Kemal Atatürk';
const MAX_SUBCATEGORIES = 6;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FAILURE_RETRY_MS = 10 * 60 * 1000;
const MIN_WIDTH = 400;

// Commons dosya yolu: /<md5[0]>/<md5[0..2]>/<dosya adı>. Elle yazılan yollar yanlış çıktığı
// için adresler dosya adından üretilir.
function commonsFileUrl(fileName) {
  const hash = crypto.createHash('md5').update(fileName).digest('hex');
  return `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(fileName)}`;
}

const FALLBACK_PHOTOS = [
  'Ataturk1930s.jpg',
  'Mustafa_Kemal_Atatürk_in_1923.jpg',
  'Ataturk_in_1918.jpg',
  'Mustafa_Kemal_Atatürk_1925.jpg',
  'Mustafa_Kemal_Ataturk_1927.jpg'
].map((fileName, i) => ({
  id: `fallback-${i}`,
  url: commonsFileUrl(fileName),
  title: 'Mustafa Kemal Atatürk',
  source: 'Wikimedia Commons',
  pageUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`
}));

let cache = { photos: null, expiresAt: 0 };
let inflight = null;

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, '').trim();
}

const COMMONS_HEADERS = { 'User-Agent': 'EkoYildizBot/1.0 (Discord community bot; contact via project repository)' };

// Ana kategoride neredeyse hiç dosya yok; fotoğraflar alt kategorilerde duruyor.
async function resolveCategories() {
  const configured = (process.env.ATATURK_COMMONS_CATEGORIES || '')
    .split(',').map(c => c.trim()).filter(Boolean);
  if (configured.length) return configured;

  const { data } = await axios.get(COMMONS_API, {
    timeout: 10000,
    headers: COMMONS_HEADERS,
    params: { action: 'query', list: 'categorymembers', cmtitle: ROOT_CATEGORY, cmtype: 'subcat', cmlimit: 200, format: 'json' }
  });
  const subcats = ((data.query && data.query.categorymembers) || [])
    .map(c => c.title)
    .filter(t => /photograph|portrait|fotoğraf/i.test(t))
    .slice(0, MAX_SUBCATEGORIES);
  return [ROOT_CATEGORY, ...subcats];
}

async function fetchCategoryPhotos(category) {
  const photos = [];
  let cont = {};
  for (let page = 0; page < 3; page++) {
    const { data } = await axios.get(COMMONS_API, {
      timeout: 10000,
      headers: COMMONS_HEADERS,
      params: {
        action: 'query',
        generator: 'categorymembers',
        gcmtitle: category,
        gcmtype: 'file',
        gcmlimit: 100,
        prop: 'imageinfo',
        iiprop: 'url|mime|size|extmetadata',
        iiurlwidth: 1280, // Wikimedia yalnızca standart küçük resim boyutlarını sunar
        format: 'json',
        ...cont
      }
    });

    for (const p of Object.values((data.query && data.query.pages) || {})) {
      const info = p.imageinfo && p.imageinfo[0];
      if (!info || info.mime !== 'image/jpeg' || (info.width || 0) < MIN_WIDTH) continue;
      const meta = info.extmetadata || {};
      photos.push({
        id: String(p.pageid),
        url: info.thumburl || info.url,
        title: stripHtml(meta.ObjectName && meta.ObjectName.value) || 'Mustafa Kemal Atatürk',
        source: 'Wikimedia Commons',
        pageUrl: info.descriptionurl || null
      });
    }

    if (!data.continue) break;
    cont = data.continue;
  }
  return photos;
}

async function fetchFromCommons() {
  const byId = new Map();
  for (const category of await resolveCategories()) {
    try {
      for (const photo of await fetchCategoryPhotos(category)) byId.set(photo.id, photo);
    } catch (err) {
      console.warn(`[AtaturkImage] ${category} alınamadı: ${err.message}`);
    }
  }
  // Sıra Commons'un döndürdüğü sıraya bağlı kalmasın: günlük seçim kararlı olsun.
  return [...byId.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

async function getPhotos() {
  const now = Date.now();
  if (cache.photos && now < cache.expiresAt) return cache.photos;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const photos = await fetchFromCommons();
      if (!photos.length) throw new Error('Commons boş sonuç döndürdü');
      cache = { photos, expiresAt: Date.now() + CACHE_TTL_MS };
    } catch (err) {
      console.warn(`[AtaturkImage] Commons alınamadı, yedek liste kullanılıyor: ${err.message}`);
      // Eski başarılı önbellek varsa onu koru, yoksa yedek listeyi kısa süre kullan.
      cache = { photos: cache.photos || FALLBACK_PHOTOS, expiresAt: Date.now() + FAILURE_RETRY_MS };
    } finally {
      inflight = null;
    }
    return cache.photos;
  })();
  return inflight;
}

// Türkiye saatine (UTC+3, yaz saati yok) göre 1970'ten beri geçen gün sayısı.
function turkeyDayNumber(date = new Date()) {
  return Math.floor((date.getTime() + 3 * 60 * 60 * 1000) / 86400000);
}

function turkeyDateKey(date = new Date()) {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Ölü bağlantı (404/400 vb.) Discord'da bozuk görsel olarak görünür; seçmeden önce kontrol et.
// 429 / ağ hatası kesin sonuç değildir, görsel çalışıyor sayılır.
const aliveCache = new Map();

async function isAlive(url) {
  const hit = aliveCache.get(url);
  if (hit && Date.now() < hit.expiresAt) return hit.alive;
  let alive = true;
  try {
    const res = await axios.head(url, {
      timeout: 8000,
      headers: COMMONS_HEADERS,
      validateStatus: () => true
    });
    if (res.status !== 429 && res.status >= 400) alive = false;
    else if (res.status < 400 && !/^image\//.test(String(res.headers['content-type'] || ''))) alive = false;
  } catch (_) { /* kesin değil */ }
  aliveCache.set(url, { alive, expiresAt: Date.now() + CACHE_TTL_MS });
  return alive;
}

async function pickAlive(photos, startIndex) {
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[(startIndex + i) % photos.length];
    if (await isAlive(photo.url)) return photo;
  }
  return photos[startIndex % photos.length];
}

async function getDailyPhoto(date = new Date()) {
  const photos = await getPhotos();
  const photo = await pickAlive(photos, turkeyDayNumber(date) % photos.length);
  return { ...photo, date: turkeyDateKey(date) };
}

async function getRandomPhoto() {
  const photos = await getPhotos();
  return pickAlive(photos, Math.floor(Math.random() * photos.length));
}

module.exports = { getPhotos, getDailyPhoto, getRandomPhoto, turkeyDayNumber };
