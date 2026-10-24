"use strict";

// Botun bulunduğu tüm sunuculardaki kullanıcı aktivitesini kişinin tek güvenlik profili kanalına yazar:
// katılma / ayrılma, ban / ban kaldırma ve yazdığı mesajlar (mesajlar kanal dolmasın diye toplu gönderilir).

const { logTrustUserActivity } = require("./trustScoreService");

const RECORD_GUILD_ID = "1466927911364726845"; // Profil kanallarının bulunduğu sunucu
const FLUSH_MS = 15 * 60 * 1000;
const MAX_LINES = 20;

const messageBuffer = new Map(); // userId -> [{ guild, channelId, text, at }]

function clip(text, max = 120) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean || "*(ek / sticker)*";
}

function log(client, userId, title, details, emoji, color) {
  logTrustUserActivity(client, userId, title, details, emoji, color).catch(() => {});
}

async function flushMessages(client) {
  const entries = [...messageBuffer.entries()];
  messageBuffer.clear();
  for (const [userId, items] of entries) {
    const lines = items.slice(-MAX_LINES).map(m =>
      `<t:${Math.floor(m.at / 1000)}:t> **${m.guild}** <#${m.channelId}>: ${m.text}`
    );
    const extra = items.length > MAX_LINES ? `\n*…ve ${items.length - MAX_LINES} mesaj daha*` : "";
    const details = (lines.join("\n") + extra).slice(0, 3800); // embed açıklama sınırı 4096
    await logTrustUserActivity(client, userId, `Mesajlar (${items.length})`, details, "💬", 0x64748b).catch(() => {});
  }
}

function initProfileActivityLog(client) {
  if (!client || client.__profileActivityLogAttached) return;
  client.__profileActivityLogAttached = true;

  client.on("guildMemberAdd", (member) => {
    if (member.user.bot || member.guild.id === RECORD_GUILD_ID) return;
    log(client, member.id, "Sunucuya Katıldı", `**Sunucu:** ${member.guild.name}`, "📥", 0x22c55e);
  });

  client.on("guildMemberRemove", (member) => {
    if (member.user?.bot || member.guild.id === RECORD_GUILD_ID) return;
    log(client, member.id, "Sunucudan Ayrıldı", `**Sunucu:** ${member.guild.name}`, "📤", 0xf59e0b);
  });

  client.on("guildBanAdd", (ban) => {
    if (ban.guild.id === RECORD_GUILD_ID) return;
    log(client, ban.user.id, "Sunucudan Banlandı", `**Sunucu:** ${ban.guild.name}\n**Sebep:** ${ban.reason || "Belirtilmedi"}`, "🔨", 0xef4444);
  });

  client.on("guildBanRemove", (ban) => {
    if (ban.guild.id === RECORD_GUILD_ID) return;
    log(client, ban.user.id, "Banı Kaldırıldı", `**Sunucu:** ${ban.guild.name}`, "🔓", 0x22c55e);
  });

  client.on("messageCreate", (message) => {
    if (!message.guild || message.author.bot || message.guild.id === RECORD_GUILD_ID) return;
    const list = messageBuffer.get(message.author.id) || [];
    list.push({ guild: message.guild.name, channelId: message.channel.id, text: clip(message.content), at: Date.now() });
    messageBuffer.set(message.author.id, list);
  });

  setInterval(() => flushMessages(client).catch(err => console.error("[ProfileActivity] flush:", err.message)), FLUSH_MS);
}

module.exports = { initProfileActivityLog };
