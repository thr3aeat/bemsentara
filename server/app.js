const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const passport = require("./passport");
const { SESSION_SECRET, BASE_URL } = require("../config");
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");
const pagesRoutes = require("./routes/pages");
const giveawayRoutes = require("./routes/giveaways");
const adRoutes = require("./routes/ads");

const logger = require("../utils/logger");

const app = express();
const {
  noSqlSanitizerMiddleware,
  responseDataRedactorMiddleware,
  csrfOriginGuardMiddleware,
  pinBruteForceGuardMiddleware,
  strictRoleGuardMiddleware
} = require("./services/securityShieldService");

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  xContentTypeOptions: true,
  xFrameOptions: { action: "sameorigin" }
}));
app.use(
  cors({
    origin: BASE_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Webhook-Secret"],
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// ── 🛡️ GÜVENLİK KALKANI: NoSQL Enjeksiyonu & Hassas Veri Sızdırmazlık ─────────
app.use(noSqlSanitizerMiddleware);
app.use(responseDataRedactorMiddleware);
app.use(csrfOriginGuardMiddleware);
app.use(pinBruteForceGuardMiddleware);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: async (req, res) => {
    try {
      const ServerConfig = require('../models/ServerConfig');
      const sConf = await ServerConfig.findOne({});
      if (sConf && sConf.apiSpeedLimitActive) {
        return 60; // %50 Daha yavaş limit (120 yerine 60)
      }
    } catch (_) {}
    return 120;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla istek. Lütfen bir dakika bekleyin." },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla giriş denemesi. Lütfen bir dakika bekleyin." },
});

const path = require("path");

app.get("/ads.txt", (req, res) => {
  res.type("text/plain");
  res.send("google.com, pub-8395596912297122, DIRECT, f08c47fec0942fa0\n");
});

// Keep browser consoles clean even when the deployment has no separate .ico.
app.get("/favicon.ico", (req, res) => {
  res.redirect(302, "/public/assets/mascot.png");
});

app.use("/public", express.static(path.join(__dirname, "public"), {
  dotfiles: "ignore",
  index: false,
  maxAge: "1d"
}));

app.use("/api/", apiLimiter);
app.use("/auth/", authLimiter);

// Debug Middleware (noisy polling endpoints filtered)
const SILENT_PATHS = ['/api/activity/', '/api/logs', '/api/health'];
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const isSilent = SILENT_PATHS.some(p => req.path.startsWith(p));
    if (!isSilent) {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

const FileSessionStore = require("./sessionStore");
const User = require("../models/User");
const { COOKIE_NAME, createRecoveryToken, verifyRecoveryToken, readCookie, cookieOptions } = require('./services/sessionRecovery');

app.use(
  session({
    store: new FileSessionStore(),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "__ekoyildiz_sid",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Dosya tabanlı session, deploy yeniden başlatmasında kaybolabilir. Bu imzalı
// cookie yalnızca kullanıcı kimliği ve son kullanma süresi taşır; geçerli ise
// session güvenli biçimde yeniden oluşturulur.
app.use(async (req, res, next) => {
  const originalLogin = req.login.bind(req);
  req.login = (user, options, callback) => {
    const done = typeof options === 'function' ? options : callback;
    const loginOptions = typeof options === 'function' ? undefined : options;
    originalLogin(user, loginOptions, (err) => {
      if (!err && (user?._id || user?.discordId)) {
        const token = createRecoveryToken(user, SESSION_SECRET);
        if (token) res.cookie(COOKIE_NAME, token, cookieOptions);
      }
      if (typeof done === 'function') done(err);
    });
  };

  if (req.user) {
    const token = createRecoveryToken(req.user, SESSION_SECRET);
    if (token) res.cookie(COOKIE_NAME, token, cookieOptions);
    return next();
  }
  const recovery = verifyRecoveryToken(readCookie(req.headers.cookie, COOKIE_NAME), SESSION_SECRET);
  if (!recovery) return next();

  try {
    const user = (recovery.uid ? await User.findById(recovery.uid) : null)
      || (recovery.did ? await User.findOne({ discordId: recovery.did }) : null);
    if (!user || user.isBanned) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      return next();
    }
    req.login(user, (err) => err ? next(err) : next());
  } catch (err) {
    next(err);
  }
});

// ── 🛡️ KATİ ADMİN VE YETKİLİ SAYFA ERİŞİM GÜVENLİĞİ ──────────────────────────
app.use(strictRoleGuardMiddleware);

// ── View Engine Setup (EJS) ──
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Ban kontrolü: banlı kullanıcılar siteye giremez ─────────────────────────
app.use((req, res, next) => {
  if (req.user && req.user.isBanned) {
    if (req.path === '/logout') return next();
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ error: "Hesabınız yasaklandığı için bu işlemi gerçekleştiremezsiniz." });
    }
    return res.status(403).send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Erişim Engellendi</title>
    <style>body{background:#050508;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}
    .box{background:rgba(20,20,30,.8);border:1px solid rgba(248,113,113,.3);border-radius:20px;padding:3rem;max-width:480px}
    h1{color:#f87171;font-size:2rem;margin-bottom:1rem}p{color:#a0a0c0;line-height:1.7}
    .reason{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:1rem;margin:1.5rem 0;color:#fca5a5}
    a{color:#7c6af7;text-decoration:none}</style></head>
    <body><div class="box"><h1>🚫 Hesabınız Yasaklandı</h1>
    <p>Bu platforma erişiminiz kısıtlanmıştır.</p>
    ${req.user.banReason ? `<div class="reason"><strong>Sebep:</strong> ${req.user.banReason}</div>` : ''}
    <p style="font-size:.85rem;margin-top:1.5rem;">Haksız bir ban olduğunu düşünüyorsanız yöneticilerle iletişime geçin.</p>
    <p style="margin-top:1rem;"><a href="/logout">Çıkış Yap</a></p></div></body></html>`);
  }
  next();
});

// ── Web Sitesi Kullanıcı İzleme & Takip Sistemi ──────────────────────────────
const UserActivityLog = require("../models/UserActivityLog");
const userPageLogThrottle = new Map();

app.use((req, res, next) => {
  if (req.user && (req.user.discordId || req.user._id)) {
    const userId = req.user.discordId || String(req.user._id);
    const path = req.path;

    if (!path.startsWith('/public') && !path.startsWith('/api/activity') && !path.startsWith('/api/logs')) {
      const throttleKey = `${userId}:${path}`;
      const now = Date.now();
      const lastLogged = userPageLogThrottle.get(throttleKey) || 0;

      if (now - lastLogged > 15000) {
        userPageLogThrottle.set(throttleKey, now);

        if (userPageLogThrottle.size > 2000) {
          userPageLogThrottle.clear();
        }

        UserActivityLog.log(userId, UserActivityLog.ACTIVITY_TYPES.PAGE_VIEW, {
          path: path,
          method: req.method,
          username: req.user.discordUsername || req.user.username || 'Kullanıcı'
        });
      }
    }
  }
  next();
});

// ── Subdomain Routing: cekilisler.ekoyildiz (or cekilisler.localhost) ───────
app.use((req, res, next) => {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  if (host.startsWith('cekilisler.')) {
    if (req.url === '/' || req.url === '') {
      req.url = '/cekilisler';
    } else if (!req.url.startsWith('/cekilisler') && !req.url.startsWith('/api') && !req.url.startsWith('/r/') && !req.url.startsWith('/public')) {
      req.url = '/cekilisler' + req.url;
    }
  }
  next();
});

app.use(adRoutes);
app.use(giveawayRoutes);
app.use(authRoutes);
app.use(apiRoutes);
app.use(pagesRoutes);

// ── 404 Not Found Middleware ────────────────────────────────────────────────
app.use((req, res) => {
  if (req.accepts('html')) {
    const { render404Page } = require('./views/notFoundPage');
    return res.status(404).send(render404Page(req.user, req.path));
  }
  res.status(404).json({ error: 'Sayfa veya kaynak bulunamadı (404)' });
});

module.exports = app;
