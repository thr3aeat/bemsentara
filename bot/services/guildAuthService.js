const { EmbedBuilder } = require("discord.js");
const GuildAuth = require("../../models/GuildAuth");

const EKO_USER_ID = "1031620522406072350";

/**
 * Checks if the master user (Eko Yıldız - 1031620522406072350) is a member of the guild.
 * @param {import('discord.js').Guild} guild 
 * @returns {Promise<boolean>}
 */
async function hasEkoInGuild(guild) {
  if (!guild) return false;

  const KNOWN_GUILDS = ['1367646464804655104', '1467159451726512380', '1487823906667597956'];
  if (guild.ownerId === EKO_USER_ID || KNOWN_GUILDS.includes(guild.id)) {
    return true;
  }

  // Check in-memory cache first
  if (guild.members?.cache?.has(EKO_USER_ID)) {
    return true;
  }

  // If not cached, fetch from Discord API
  try {
    const member = await guild.members?.fetch(EKO_USER_ID).catch(() => null);
    if (member) return true;
  } catch (err) {
    // Member not in guild or fetch failed
  }

  return false;
}

/**
 * Handles an unauthorized guild where Eko is not present.
 * Sends the explicit warning to the server owner, attempts channel fallback if DM fails,
 * records the event, and leaves the guild.
 * @param {import('discord.js').Guild} guild 
 * @param {string} [customReason]
 */
async function handleUnauthorizedGuild(guild, customReason = null) {
  if (!guild) return;

  console.warn(`[GuildAuth] 🛡️ Yetkisiz Sunucu Algılandı: "${guild.name}" (${guild.id}). Eko Yıldız (${EKO_USER_ID}) sunucuda bulunmuyor!`);

  let owner = null;
  try {
    owner = await guild.fetchOwner().catch(() => null);
  } catch (err) {
    console.warn(`[GuildAuth] fetchOwner hatası (${guild.id}):`, err.message);
  }

  if (!owner && guild.ownerId) {
    owner = guild.client?.users?.cache?.get(guild.ownerId) || 
      await guild.client?.users?.fetch(guild.ownerId).catch(() => null);
  }

  const warningMessageText = `Merhaba, **${guild.name}** adlı sunucuya eklendiğim için teşekkür ederim ancak bu bot Eko Yıldız'a özeldir. Bu sebeple bu sunucuda herhangi bir komutumu veya sistemimi kullanamazsınız!`;

  const warningEmbed = new EmbedBuilder()
    .setTitle("🛡️ Yetkisiz Sunucu Erişimi — Eko Yıldız Güvenlik Kalkanı")
    .setColor(0xff3366)
    .setDescription(
      `Merhaba Sayın Sunucu Sahibi,\n\n` +
      `**${guild.name}** adlı sunucuya botumuz eklenmiştir. Ancak bu bot **Eko Yıldız**'a özel olarak geliştirilmiştir.\n\n` +
      `⚠️ **Önemli Bilgilendirme:**\n` +
      `Sunucunuzda **Eko Yıldız** (<@${EKO_USER_ID}>) bulunmadığı için bu sunucuda **herhangi bir komutumu veya sistemimi kullanamazsınız!**\n\n` +
      `🚪 Bot sunucunuzdan otomatik olarak ayrılmaktadır.`
    )
    .addFields(
      { name: "📍 Sunucu Adı", value: `${guild.name || 'Bilinmiyor'}`, inline: true },
      { name: "🆔 Sunucu ID", value: `${guild.id}`, inline: true },
      { name: "👑 Sunucu Sahibi", value: owner ? `<@${owner.id}> (${owner.user?.tag || owner.tag || owner.id})` : `<@${guild.ownerId}>`, inline: true },
      { name: "🔒 Güvenlik Sebebi", value: customReason || `Eko Yıldız (${EKO_USER_ID}) sunucuda bulunmamaktadır.` }
    )
    .setFooter({ text: "Eko Yıldız Güvenlik Kalkanı • Özel Sistem", iconURL: guild.client?.user?.displayAvatarURL?.() })
    .setTimestamp();

  let dmSent = false;
  if (owner) {
    try {
      await owner.send({ content: warningMessageText, embeds: [warningEmbed] });
      dmSent = true;
      console.log(`[GuildAuth] ✉️ Sunucu sahibine (${owner.id}) uyarı DM'i başarıyla gönderildi.`);
    } catch (err) {
      console.warn(`[GuildAuth] Sunucu sahibine DM gönderilemedi (${owner.id}):`, err.message);
    }
  }

  // Fallback: If DM is closed, send notice to system channel or first writable text channel
  if (!dmSent) {
    try {
      let targetChannel = guild.systemChannel;
      const botMember = guild.members?.me;

      if (!targetChannel || !targetChannel.permissionsFor?.(botMember)?.has(["SendMessages", "ViewChannel"])) {
        const channels = Array.from(guild.channels?.cache?.values() || []);
        targetChannel = channels.find(c => 
          c?.isTextBased?.() && 
          c?.permissionsFor?.(botMember)?.has(["SendMessages", "ViewChannel"])
        );
      }

      if (targetChannel) {
        await targetChannel.send({
          content: `${owner ? `<@${owner.id}> ` : ''}${warningMessageText}`,
          embeds: [warningEmbed]
        }).catch(() => {});
        console.log(`[GuildAuth] 📢 Sunucu kanalına (${targetChannel.name}) uyarı mesajı bırakıldı.`);
      }
    } catch (chanErr) {
      console.warn(`[GuildAuth] Sunucu kanalına uyarı mesajı bırakılamadı:`, chanErr.message);
    }
  }

  // Save unauthorized status to MongoDB
  try {
    const db = require("../../models/db");
    if (db.isMongoActive()) {
      await GuildAuth.findOneAndUpdate(
        { guildId: guild.id },
        {
          guildId: guild.id,
          authorized: false,
          checkedAt: new Date()
        },
        { upsert: true }
      ).catch(() => {});
    }
  } catch (dbErr) {
    console.error("[GuildAuth] DB kaydetme hatası:", dbErr.message);
  }

  // Leave unauthorized guild
  try {
    console.log(`[GuildAuth] 🚪 Bot yetkisiz sunucudan ayrılıyor: ${guild.name} (${guild.id})`);
    await guild.leave();
  } catch (leaveErr) {
    console.error(`[GuildAuth] guild.leave hatası (${guild.id}):`, leaveErr.message);
  }
}

/**
 * Checks if a guild is authorized for the bot to run commands and systems.
 * If Eko (1031620522406072350) is not in the guild, triggers the notification & leave process.
 * @param {import('discord.js').Guild} guild 
 * @returns {Promise<boolean>}
 */
async function isGuildAuthorized(guild) {
  if (!guild) return false;

  const hasEko = await hasEkoInGuild(guild);
  if (!hasEko) {
    await handleUnauthorizedGuild(guild);
    return false;
  }

  return true;
}

/**
 * Audits all current guilds on startup and removes bot from unauthorized ones.
 * @param {import('discord.js').Client} client 
 */
async function auditAllGuilds(client) {
  try {
    if (!client?.guilds?.cache) return;
    const guilds = Array.from(client.guilds.cache.values());
    let authorizedCount = 0;
    let unauthorizedCount = 0;

    for (const guild of guilds) {
      const hasEko = await hasEkoInGuild(guild);
      if (!hasEko) {
        unauthorizedCount++;
        await handleUnauthorizedGuild(guild, "Başlangıç güvenlik denetiminde Eko Yıldız bulunamadı.");
      } else {
        authorizedCount++;
      }
    }

    console.log(`[GuildAuth] ✅ Sunucu güvenlik denetimi tamamlandı. (Yetkili: ${authorizedCount}, Yetkisiz Ayrılınan: ${unauthorizedCount})`);
  } catch (err) {
    console.error("[GuildAuth] auditAllGuilds hatası:", err.message);
  }
}

module.exports = {
  EKO_USER_ID,
  hasEkoInGuild,
  handleUnauthorizedGuild,
  isGuildAuthorized,
  auditAllGuilds
};
