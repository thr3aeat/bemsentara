'use strict';

/**
 * Aynı bot token'ıyla eski kodla çalışan başka bir kopya (ör. eski bir deploy) varsa,
 * onun gönderdiği accent renkli Components V2 mesajlarını siler. Güncel kod hiç accent
 * göndermez (embedsToV2.stripAccent), bu yüzden accent'li bot mesajı = eski kopya.
 */

const V2 = 1 << 15;

function hasAccent(components) {
  return (components || []).some((c) => {
    const j = c && typeof c.toJSON === 'function' ? c.toJSON() : c;
    return j && j.type === 17 && j.accent_color != null;
  });
}

function isStaleCopyMessage(message, selfId) {
  if (!message || !message.author || message.author.id !== selfId || message.webhookId) return false;
  const flags = message.flags && typeof message.flags.bitfield === 'number' ? message.flags.bitfield : Number(message.flags) || 0;
  return (flags & V2) !== 0 && hasAccent(message.components);
}

function startStaleInstanceGuard(client) {
  if (process.env.STALE_GUARD === '0') return;
  client.on('messageCreate', (message) => {
    if (!isStaleCopyMessage(message, client.user && client.user.id)) return;
    console.warn(`⚠️ [StaleInstanceGuard] Eski bot kopyasının mesajı silindi (#${message.channelId}). Bot token'ını yenileyin.`);
    message.delete().catch(() => {});
  });
}

module.exports = { startStaleInstanceGuard, isStaleCopyMessage };
