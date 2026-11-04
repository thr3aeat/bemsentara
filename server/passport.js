// passport.js

const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const RobloxStrategy = require("passport-roblox");
const LocalStrategy = require("passport-local").Strategy;
const axios = require("axios");
const User = require("../models/User");
const { saveStoreNow } = require("../models/Store"); // ✅ Döngüsel require kaldırıldı
const { BASE_URL } = require("../config");
const { isEnvAdmin } = require("../utils/adminCheck");

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

/**
 * Discord avatar URL'si oluşturur.
 */
function buildDiscordAvatarUrl(profile) {
  if (profile.avatar) {
    return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
  }
  const discriminator = parseInt(profile.discriminator || "0", 10);
  return `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`;
}

/**
 * Discord banner URL'si oluşturur.
 */
function buildDiscordBannerUrl(profile) {
  if (!profile.banner) return null;
  return `https://cdn.discordapp.com/banners/${profile.id}/${profile.banner}.png?size=512`;
}

/**
 * Roblox API'den kullanıcı adı çeker.
 * @param {string} robloxId
 * @returns {Promise<string>}
 */
async function fetchRobloxUsername(robloxId) {
  try {
    const { data } = await axios.get(
      `https://users.roblox.com/v1/users/${robloxId}`,
      { timeout: 5000 }
    );
    return data.name || data.username || null;
  } catch (err) {
    console.warn(`[passport] Roblox API'den kullanıcı adı alınamadı (ID: ${robloxId}):`, err.message);
    return null;
  }
}

/**
 * Roblox profil nesnesinden ham kullanıcı ID'sini çıkarır.
 * @param {object} profile
 * @returns {string|null}
 */
function extractRobloxId(profile) {
  const raw =
    profile.id ??
    profile.sub ??
    profile._json?.sub ??
    profile._json?.id ??
    null;

  return raw != null ? String(raw) : null;
}

// ─── Discord Strategy ─────────────────────────────────────────────────────────

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID || "dummy",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "dummy",
      callbackURL: `${BASE_URL}/auth/discord/callback`,
      scope: ["identify", "email", "role_connections.write"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const discordId = String(profile.id);
        const envAdmin = isEnvAdmin(discordId);
        const avatarUrl = buildDiscordAvatarUrl(profile);
        const bannerUrl = buildDiscordBannerUrl(profile);

        let user = await User.findOne({ discordId });

        const mfaEnabled = profile._json ? !!profile._json.mfa_enabled : false;
        const phoneVerified = profile._json ? !!profile._json.verified : false;

        if (!user) {
          user = new User({
            discordId,
            discordUsername: profile.username,
            discordEmail: profile.email,
            discordAvatar: avatarUrl,
            discordBanner: bannerUrl,
            isAdmin: envAdmin,
            isStaff: envAdmin,
            mfaEnabled,
            phoneVerified,
          });
        } else {
          user.discordUsername = profile.username;
          user.discordEmail = profile.email;
          user.discordAvatar = avatarUrl;
          if (bannerUrl) user.discordBanner = bannerUrl;
          user.mfaEnabled = mfaEnabled;
          user.phoneVerified = phoneVerified;
          if (envAdmin) {
            user.isAdmin = true;
            user.isStaff = true;
          }
        }

        user.discordAccessToken = accessToken || null;
        user.discordRefreshToken = refreshToken || null;
        user.discordTokenUpdatedAt = new Date();

        await user.save();
        saveStoreNow();

        return done(null, user);
      } catch (err) {
        console.error("[passport] Discord auth hatası:", err);
        return done(err);
      }
    }
  )
);

// ─── Local Strategy (Password-based login) ────────────────────────────────────

passport.use(
  new LocalStrategy(
    {
      usernameField: 'password',
      passwordField: 'password',
      passReqToCallback: true
    },
    async (req, password, passReqCallback, done) => {
      try {
        // 6-digit password login
        const user = await User.findOne({ loginPassword: password });
        
        if (!user) {
          return done(null, false, { message: 'Geçersiz şifre.' });
        }

        if (user.isBanned) {
          return done(null, false, { message: 'Hesabınız yasaklandı.' });
        }

        return done(null, user);
      } catch (err) {
        console.error("[passport] Local auth hatası:", err);
        return done(err);
      }
    }
  )
);

// ─── Roblox Strategy ──────────────────────────────────────────────────────────

const ACTIVE_SENTARA_CLIENT_ID = "6748474744887863615";
const ACTIVE_SENTARA_CLIENT_SECRET =
  "RBX-4cu22Y7nHEGVVnrep29VdZy7Qspz6w0rIEp049RvNv3o2tqD85o88vJUAhV6Py_C";

const rawRobloxClientId = String(
  process.env.ROBLOX_OAUTH_CLIENT_ID ||
  process.env.ROBLOX_CLIENT_ID || ""
).trim();

const rawRobloxClientSecret = String(
  process.env.ROBLOX_OAUTH_CLIENT_SECRET ||
  process.env.ROBLOX_CLIENT_SECRET || ""
).trim();

// 8037156514842682566 numaralı uygulama Roblox incelemesinde (isInReview: true) kilitli olduğu için
// ekoyildiz.duckdns.org redirect URI'sini reddediyor (RedirectUriMismatch).
// Tüm domainlerin kayıtlı olduğu aktif BEM Sentara OAuth uygulaması (6748474744887863615) kullanılır.
const useActiveSentaraOAuth =
  !rawRobloxClientId ||
  !rawRobloxClientSecret ||
  rawRobloxClientId === "8037156514842682566";

const ROBLOX_CLIENT_ID = useActiveSentaraOAuth
  ? ACTIVE_SENTARA_CLIENT_ID
  : rawRobloxClientId;

const ROBLOX_CLIENT_SECRET = useActiveSentaraOAuth
  ? ACTIVE_SENTARA_CLIENT_SECRET
  : rawRobloxClientSecret;

const ALLOWED_ROBLOX_CALLBACK_HOSTS = new Set([
  "ekoyildiz.duckdns.org",
  "eko.hs.vc",
  "bemsentara-render-nlfr.onrender.com",
  "localhost:3000",
]);

function resolveRobloxCallbackUrl(req) {
  if (process.env.ROBLOX_REDIRECT_URI) {
    return String(process.env.ROBLOX_REDIRECT_URI).trim();
  }
  const host = String(
    req?.headers?.["x-forwarded-host"] || req?.headers?.host || ""
  )
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (ALLOWED_ROBLOX_CALLBACK_HOSTS.has(host)) {
    const proto = host.startsWith("localhost") ? "http" : "https";
    return `${proto}://${host}/auth/roblox/callback`;
  }
  return `${BASE_URL}/auth/roblox/callback`;
}

const ROBLOX_REDIRECT_URI = String(
  process.env.ROBLOX_REDIRECT_URI || `${BASE_URL}/auth/roblox/callback`
).trim();
console.log(`[passport] Roblox OAuth client_id=${ROBLOX_CLIENT_ID || "(yok)"} redirect_uri=${JSON.stringify(ROBLOX_REDIRECT_URI)}`);

passport.resolveRobloxCallbackUrl = resolveRobloxCallbackUrl;

passport.use(
  new RobloxStrategy(
    {
      clientID: ROBLOX_CLIENT_ID || "dummy",
      clientSecret: ROBLOX_CLIENT_SECRET || "dummy",
      authorizationURL: "https://apis.roblox.com/oauth/v1/authorize",
      tokenURL: "https://apis.roblox.com/oauth/v1/token",
      // Roblox Creator Dashboard > OAuth uygulaması > Redirect URLs listesindekiyle BİREBİR aynı olmalı.
      callbackURL: ROBLOX_REDIRECT_URI,
      scope: ["openid", "profile"],
      pkce: true,
      state: true,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // 1. Discord ile giriş yapılmış olmalı
        if (!req.user) {
          return done(new Error("Lütfen önce Discord ile giriş yapın."));
        }

        // 2. Kullanıcıyı veritabanında bul
        const user =
          (await User.findById(req.user._id)) ||
          (req.user.discordId
            ? await User.findOne({ discordId: String(req.user.discordId) })
            : null);

        if (!user) {
          return done(new Error("Kullanıcı veritabanında bulunamadı."));
        }

        // 3. Roblox ID'sini çıkar
        const rbxIdStr = extractRobloxId(profile);
        if (!rbxIdStr) {
          return done(new Error("Roblox hesap ID alınamadı. Tekrar deneyin."));
        }

        // 4. Yasaklı hesap kontrolü
        const bannedUser = await User.findOne({
          robloxId: rbxIdStr,
          isBanned: true,
        });
        if (bannedUser && String(bannedUser._id) !== String(user._id)) {
          console.warn(
            `[passport] Engellendi: Roblox ID ${rbxIdStr}, yasaklı Discord hesabına (${bannedUser.discordId}) bağlı.`
          );
          return done(
            new Error(
              "Bu Roblox hesabı yasaklı bir Discord hesabına bağlıdır. Giriş engellendi!"
            )
          );
        }

        // 5. Kullanıcı adını belirle
        const usernameFromProfile =
          profile.preferredUsername ||
          profile.displayName ||
          profile.nickname ||
          profile.name ||
          null;

        const robloxUsername =
          usernameFromProfile ||
          (await fetchRobloxUsername(rbxIdStr)) ||
          `User_${rbxIdStr}`;

        // 6. Kullanıcıyı güncelle
        user.robloxId = rbxIdStr;
        user.robloxUsername = robloxUsername;
        user.isAuthorized = true;

        if (
          req.user.discordId &&
          String(user.discordId) !== String(req.user.discordId)
        ) {
          user.discordId = String(req.user.discordId);
        }

        await user.save();
        saveStoreNow();

        req.user = user;

        return done(null, user);
      } catch (err) {
        console.error("[passport] Roblox auth hatası:", err);
        return done(err);
      }
    }
  )
);

// ─── Serialize / Deserialize ──────────────────────────────────────────────────

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) return done(null, false);

    // ID'leri string olarak normalize et
    if (user.discordId) user.discordId = String(user.discordId);
    if (user.robloxId) user.robloxId = String(user.robloxId);

    done(null, user);
  } catch (err) {
    console.error("[passport] Deserialize hatası:", err);
    done(err);
  }
});

module.exports = passport;