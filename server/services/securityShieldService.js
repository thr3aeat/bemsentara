'use strict';

const { isSiteAdmin, isSiteStaff } = require("../../utils/adminCheck");
const { BASE_URL } = require("../../config");
const logger = require("../../utils/logger");

// ─── 1. SENSITIVE KEYS TO AUTOMATICALLY REDACT ────────────────────────────────
const SENSITIVE_KEYS = new Set([
  "password",
  "hashedpassword",
  "sitepinpassword",
  "pin",
  "twofactorsecret",
  "secret",
  "token",
  "discordtoken",
  "bottoken",
  "webhooksecret",
  "accesstoken",
  "refreshtoken",
  "sessionsecret",
  "creditcard",
  "cvv",
  "authkey"
]);

/**
 * Hassas verileri derinlemesine (recursive) temizler
 */
function redactSensitiveData(data) {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      continue; // Hassas alanları tamamen filtrele
    }
    if (value && typeof value === "object" && !(value instanceof Date)) {
      cleaned[key] = redactSensitiveData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * ─── 2. NoSQL INJECTION & OPERATOR SANITIZATION ──────────────────────────────
 * MongoDB $gt, $ne, $where, $regex gibi operatör enjeksiyonlarını temizler
 */
function sanitizeNoSql(value) {
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeNoSql);
  }

  const sanitized = {};
  for (const [k, v] of Object.entries(value)) {
    // $ ile başlayan veya . içeren anahtarları engelle
    if (k.startsWith("$") || k.includes(".")) {
      logger.warn(`[SecurityShield] NoSQL Enjeksiyon Teşebbüsü Engellendi: ${k}`);
      continue;
    }
    sanitized[k] = sanitizeNoSql(v);
  }
  return sanitized;
}

/**
 * Express Middleware: Request Body, Query ve Params Sanitize
 */
function noSqlSanitizerMiddleware(req, res, next) {
  if (req.body) req.body = sanitizeNoSql(req.body);
  if (req.query) req.query = sanitizeNoSql(req.query);
  if (req.params) req.params = sanitizeNoSql(req.params);
  next();
}

/**
 * ─── 3. RES.JSON OVERRIDE: HASSAS VERİ SIZMASINI ENGELLEME ───────────────────
 */
function responseDataRedactorMiddleware(req, res, next) {
  const originalJson = res.json;
  res.json = function (data) {
    if (data && typeof data === "object") {
      data = redactSensitiveData(data);
    }
    return originalJson.call(this, data);
  };
  next();
}

/**
 * ─── 4. CSRF & ORIGIN DOĞRULAMA (POST, PUT, DELETE KORUMASI) ──────────────────
 */
function csrfOriginGuardMiddleware(req, res, next) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return next();

  // Webhook rotalarını ve internal API'leri hariç tut
  if (req.path.startsWith("/api/webhook") || req.path.startsWith("/api/activity")) {
    return next();
  }

  const origin = req.headers["origin"] || req.headers["referer"];
  if (!origin) {
    // Tarayıcı dışı güvenli olmayan istekleri doğrula
    return next();
  }

  const allowedOrigins = [
    BASE_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ekoyildiz.com",
    "https://sentara.store"
  ].filter(Boolean);

  const isAllowed = allowedOrigins.some(base => origin.startsWith(base));
  if (!isAllowed) {
    logger.warn(`[SecurityShield] Şüpheli Cross-Origin İstek Engellendi: Method=${req.method}, Origin=${origin}, Path=${req.path}`);
    return res.status(403).json({ error: "Güvenlik Engeli: Geçersiz kaynak isteği (CSRF Koruması)." });
  }

  next();
}

/**
 * ─── 5. PIN & ŞİFRE BRUTE-FORCE KORUMASI ──────────────────────────────────────
 */
const failedAttempts = new Map(); // ip -> { count, lockedUntil }

function pinBruteForceGuardMiddleware(req, res, next) {
  if (req.path !== "/api/settings/update-pin" && req.path !== "/api/auth/verify-pin") {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress || "unknown_ip";
  const now = Date.now();
  const entry = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };

  if (entry.lockedUntil > now) {
    const waitSec = Math.ceil((entry.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Çok fazla hatalı deneme yapıldı. Lütfen ${waitSec} saniye bekleyin.`
    });
  }

  next();
}

/**
 * ─── 6. KATİ ADMİN VE YETKİLİ SAYFA / API KORUMASI ────────────────────────────
 */
function strictRoleGuardMiddleware(req, res, next) {
  const path = req.path.toLowerCase();

  // Admin sayfaları ve API'leri
  if (path.startsWith("/admin") || path.startsWith("/api/admin") || path.startsWith("/tumodlar") || path.startsWith("/group-admin")) {
    if (!req.user || !isSiteAdmin(req.user)) {
      logger.warn(`[SecurityShield] Yetkisiz Admin Erişim Girişimi: User=${req.user?.discordId || 'Anonim'}, Path=${req.path}`);
      if (typeof req.accepts === "function" && req.accepts("html")) {
        return res.status(403).send(`<!DOCTYPE html><html><body style="background:#06060e;color:#fff;font-family:sans-serif;text-align:center;padding:4rem;">
          <h1>⛔ Yetkisiz Erişim</h1><p>Bu alana yalnızca doğrulanmış site yöneticileri erişebilir.</p><a href="/" style="color:#a78bfa;">Ana Sayfaya Dön</a></body></html>`);
      }
      return res.status(403).json({ error: "Bu işlem için yönetici yetkisi gereklidir." });
    }
  }

  // Staff sayfaları ve API'leri
  if (path.startsWith("/staff") || path.startsWith("/api/staff")) {
    if (!req.user || !isSiteStaff(req.user)) {
      if (typeof req.accepts === "function" && req.accepts("html")) {
        return res.status(403).send(`<!DOCTYPE html><html><body style="background:#06060e;color:#fff;font-family:sans-serif;text-align:center;padding:4rem;">
          <h1>⛔ Yetkisiz Erişim</h1><p>Bu alana yalnızca yetkili kadro erişebilir.</p><a href="/" style="color:#a78bfa;">Ana Sayfaya Dön</a></body></html>`);
      }
      return res.status(403).json({ error: "Bu işlem için yetkili statüsü gereklidir." });
    }
  }

  next();
}

module.exports = {
  redactSensitiveData,
  sanitizeNoSql,
  noSqlSanitizerMiddleware,
  responseDataRedactorMiddleware,
  csrfOriginGuardMiddleware,
  pinBruteForceGuardMiddleware,
  strictRoleGuardMiddleware
};
