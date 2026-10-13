'use strict';

/**
 * /linkler sayfasının profil fotoğrafı ve sekme ikonu: Discord'daki "ekoyildiz"
 * kullanıcısının güncel avatarı. Önce EKOYILDIZ_DISCORD_USER_ID, yoksa botun
 * sunucularında kullanıcı adıyla arama. Sonuç 1 saat önbelleklenir; sayfa beklemez.
 */

const NAMES = (process.env.EKOYILDIZ_DISCORD_USERNAME || 'ekoyildiz,ekoyildz').split(',').map((s) => s.trim().toLowerCase());
const TTL_MS = 60 * 60 * 1000;
let cache = { url: null, at: 0 };
let pending = null;

function client() {
  try { return require('../../bot/discordClient').getDiscordClient(); } catch (_) { return null; }
}

async function resolveAvatar(c) {
  const opts = { extension: 'png', size: 256 };
  const id = process.env.EKOYILDIZ_DISCORD_USER_ID;
  if (id) {
    const u = await c.users.fetch(id).catch(() => null);
    if (u) return u.displayAvatarURL(opts);
  }
  for (const guild of c.guilds.cache.values()) {
    const found = await guild.members.search({ query: NAMES[0], limit: 10 }).catch(() => null);
    const m = found && [...found.values()].find((x) => NAMES.includes(String(x.user.username).toLowerCase()));
    if (m) return m.user.displayAvatarURL(opts);
  }
  return null;
}

function refresh() {
  const c = client();
  if (pending || !c || !c.isReady || !c.isReady()) return pending;
  pending = resolveAvatar(c)
    .then((url) => { if (url) cache = { url, at: Date.now() }; else cache.at = Date.now(); return url; })
    .catch(() => null)
    .finally(() => { pending = null; });
  return pending;
}

/** En fazla `waitMs` bekler; avatar yoksa null döner (sayfa varsayılan görseli kullanır). */
async function getLinksAvatar(waitMs = 1200) {
  if (Date.now() - cache.at < TTL_MS) return cache.url;
  const p = refresh();
  if (!cache.url && p) {
    await Promise.race([p, new Promise((r) => setTimeout(r, waitMs))]);
  }
  return cache.url;
}

module.exports = { getLinksAvatar };
