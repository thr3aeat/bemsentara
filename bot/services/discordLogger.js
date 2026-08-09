const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const LOG_GUILD_ID = "1483482948320891074";
const LOG_CATEGORY_ID = "1483483262126133440";

// Map logical system names to channel names and colors
const LOG_SYSTEMS = {
  web: { name: "web-loglar", color: 0x3498db },
  admin: { name: "grup-loglar", color: 0xe67e22 },
  ticket: { name: "ticket-loglar", color: 0x2ecc71 },
  bot: { name: "bot-loglar", color: 0x9b59b6 },
  auth: { name: "auth-loglar", color: 0xf1c40f },
  error: { name: "bot-loglar", color: 0xe74c3c } // Route errors to bot-loglar
};

let discordClient = null;
let channelCache = new Map();
let isLoggerActive = false;

/**
 * Initializes the logger, ensuring all necessary channels exist.
 */
async function init(client) {
  discordClient = client;
  if (!discordClient || !discordClient.isReady()) return;

  try {
    const guild = await discordClient.guilds.fetch(LOG_GUILD_ID).catch(() => null);
    if (!guild) {
      isLoggerActive = false;
      return;
    }

    // Attempt to fetch or verify category
    let category = await guild.channels.fetch(LOG_CATEGORY_ID).catch(() => null);
    if (!category) {
      isLoggerActive = false;
      return;
    }

    // Get existing channels in the category
    const existingChannels = guild.channels.cache.filter(c => c.parentId === category.id && c.type === ChannelType.GuildText);

    // Ensure all target channels exist
    for (const [sysKey, config] of Object.entries(LOG_SYSTEMS)) {
      if (sysKey === 'error') continue; // aliases

      let channel = existingChannels.find(c => c.name === config.name);
      
      if (!channel) {
        channel = await guild.channels.create({
          name: config.name,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: discordClient.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
            }
          ]
        }).catch(() => null);
      }
      
      if (channel) {
        channelCache.set(sysKey, channel.id);
      }
    }
    
    // Alias routing
    if (channelCache.has("bot")) {
      channelCache.set("error", channelCache.get("bot"));
      isLoggerActive = true;
    }
  } catch (err) {
    isLoggerActive = false;
  }
}

/**
 * Send a log message to the appropriate channel
 */
async function sendLog(system, message, details = null, level = "INFO", actionRow = null) {
  if (!isLoggerActive || !discordClient || !discordClient.isReady()) return;

  const channelId = channelCache.get(system) || channelCache.get("bot");
  if (!channelId) return;

  try {
    const channel = await discordClient.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const config = LOG_SYSTEMS[system] || LOG_SYSTEMS.bot;
    let color = config.color;
    if (level === "ERROR") color = 0xe74c3c;
    else if (level === "WARN") color = 0xf39c12;

    const embed = new EmbedBuilder()
      .setTitle(level === "ERROR" ? "🚨 HATA" : (level === "WARN" ? "⚠️ UYARI" : "ℹ️ BİLGİ"))
      .setDescription(message)
      .setColor(color)
      .setTimestamp();

    if (details) {
      const detailsStr = typeof details === "string" ? details : JSON.stringify(details, null, 2);
      if (detailsStr.length > 0) {
        const safeDetails = detailsStr.length > 1000 ? detailsStr.substring(0, 1000) + "..." : detailsStr;
        embed.addFields({ name: "Detaylar", value: `\`\`\`json\n${safeDetails}\n\`\`\`` });
      }
    }

    const payload = { embeds: [embed] };
    if (actionRow) payload.components = [actionRow];

    await channel.send(payload).catch(() => {});
  } catch (_) {
    // Fail silently without clogging console
  }
}

/**
 * Returns the resolved channel object for a given system
 */
async function getChannel(system) {
  if (!discordClient || !discordClient.isReady()) return null;
  const channelId = channelCache.get(system) || channelCache.get("bot");
  if (!channelId) return null;
  return await discordClient.channels.fetch(channelId).catch(() => null);
}

module.exports = {
  init,
  sendLog,
  getChannel
};
