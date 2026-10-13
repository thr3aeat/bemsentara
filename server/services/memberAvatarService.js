'use strict';

/**
 * Discord kullanıcı adlarından güncel avatar adresleri (ekip sayfası vb.).
 * Botun sunucularında üye araması yapar; sonuçlar 1 saat önbelleklenir ve
 * sayfa en fazla `waitMs` bekler, bulunamayanlar null döner.
 */

const TTL_MS = 60 * 60 * 1000;
const cache = new Map(); // ad -> { url, at }
let pending = null;

function client() {
  try { return require('../../bot/discordClient').getDiscordClient(); } catch (_) { return null; }
}

async function lookup(c, names) {
  const want = names.map((n) => n.toLowerCase());
  const found = new Map();
  for (const guild of c.guilds.cache.values()) {
    for (const name of want) {
      if (found.has(name)) continue;
      const res = await guild.members.search({ query: name, limit: 10 }).catch(() => null);
      const m = res && [...res.values()].find((x) =>
        [x.user.username, x.user.globalName, x.nickname, x.displayName].some((v) => v && v.toLowerCase() === name));
      if (m) found.set(name, m.displayAvatarURL({ extension: 'png', size: 256 }));
    }
    if (found.size === want.length) break;
  }
  const now = Date.now();
  for (const n of want) cache.set(n, { url: found.get(n) || (cache.get(n) || {}).url || null, at: now });
}

async function getAvatars(names, waitMs = 1200) {
  const now = Date.now();
  const stale = names.filter((n) => { const e = cache.get(n.toLowerCase()); return !e || now - e.at > TTL_MS; });
  const c = client();
  if (stale.length && c && c.isReady && c.isReady() && !pending) {
    pending = lookup(c, stale).catch(() => {}).finally(() => { pending = null; });
  }
  if (pending && stale.some((n) => !(cache.get(n.toLowerCase()) || {}).url)) {
    await Promise.race([pending, new Promise((r) => setTimeout(r, waitMs))]);
  }
  const out = {};
  for (const n of names) out[n] = (cache.get(n.toLowerCase()) || {}).url || null;
  return out;
}

module.exports = { getAvatars };
