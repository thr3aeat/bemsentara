'use strict';

/**
 * Reklam sayfasında net fiyat görüntüleme izni.
 * Kullanıcı reklam ticket'ından talep eder, Eko DM'den onaylar; izin kısa süreli
 * olup bu süre boyunca fiyata göre kademeli indirim uygulanır.
 */

const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(__dirname, '../../data/ad_price_access.json');
const ACCESS_MINUTES = 30;

let grants = {};
try {
  grants = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) || {};
} catch (_) {
  grants = {};
}

function persist() {
  try {
    const now = Date.now();
    for (const [id, g] of Object.entries(grants)) {
      if (!g || g.expiresAt < now) delete grants[id];
    }
    fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(grants));
  } catch (err) {
    console.error('[adPriceAccess] Kaydedilemedi:', err.message);
  }
}

function grantPriceAccess(discordId, grantedBy, minutes = ACCESS_MINUTES) {
  const expiresAt = Date.now() + minutes * 60 * 1000;
  grants[String(discordId)] = { expiresAt, grantedBy: String(grantedBy || ''), grantedAt: Date.now() };
  persist();
  return expiresAt;
}

function getPriceAccess(discordId) {
  if (!discordId) return null;
  const g = grants[String(discordId)];
  if (!g || g.expiresAt < Date.now()) return null;
  return g;
}

/** Ucuz pakette sembolik, pahalı pakette ~%25'e varan indirim oranı. */
function getDiscountRate(price) {
  const p = Number(price) || 0;
  if (p >= 300) return 0.25;
  if (p >= 150) return 0.15;
  if (p >= 75) return 0.08;
  return 0.03;
}

function applyDiscount(price) {
  const p = Number(price) || 0;
  return Math.max(0, Math.round(p * (1 - getDiscountRate(p))));
}

module.exports = {
  ACCESS_MINUTES,
  grantPriceAccess,
  getPriceAccess,
  getDiscountRate,
  applyDiscount
};
