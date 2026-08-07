const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  TARGET_GUILD_ID,
  VOICE_PANEL_CHANNEL_ID,
  VOICE_JOIN_CHANNEL_ID,
  GUILD2_ID,
  GUILD2_VOICE_PANEL_ID,
  GUILD2_VOICE_JOIN_ID,
  TMT_GUILD_ID,
  TMT_VOICE_PANEL_CHANNEL_ID,
  TMT_VOICE_JOIN_CHANNEL_ID,
} = require("../../config");

const VOICE_PANEL_MARKER = "Sentara-Voice-Panel-v1";


function getVoicePanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🔊 Ses Sistemi Paneli")
    .setDescription(
      "Butonlara basarak özel ses kanalını yönetebilirsin. Kilitle/aç, kullanıcı ekle-çıkar, yeniden adlandır ve daha fazlası!\n\n" +
        "**Ses Sistemi**"
    )
    .addFields({
      name: "📜 Buton Açıklamaları",
      value:
        "➕ **Kanal oluştur** – Yeni bir ses kanalı oluşturur.\n" +
        "✏️ **Yeniden adlandır** – Kanalın adını değiştirir.\n" +
        "🗑️ **Sil** – Kanalı tamamen kaldırır.\n" +
        "➕ **Kullanıcı ekle** – Kanala kullanıcı ekler.\n" +
        "➖ **Kullanıcı çıkar** – Kanaldan kullanıcıyı kaldırır.\n" +
        "🔒 **Kilitle** – Kanalı kilitler.\n" +
        "🔓 **Kilidi kaldır** – Kanalın kilidini açar.\n" +
        "👥 **Üye sayısı** – Kullanıcı sayısını gösterir.\n" +
        "👢 **Kanaldan at** – Kullanıcıyı çıkarır.\n" +
        "ℹ️ **Kanal bilgisi** – Detaylı bilgi verir.\n" +
        "🎭 **Rol ekle** – Kanala özel rol ekler.\n" +
        "🎭 **Rol çıkar** – Kanaldan rolü kaldırır.",
      inline: false,
    })
    .setFooter({ text: `${VOICE_PANEL_MARKER} • Sentara` })
    .setTimestamp();
}

function getVoicePanelComponents() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("voice_create").setLabel("Kanal Oluştur").setEmoji("➕").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("voice_rename").setLabel("Yeniden Adlandır").setEmoji("✏️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("voice_delete").setLabel("Sil").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("voice_add").setLabel("Kullanıcı Ekle").setEmoji("➕").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("voice_remove").setLabel("Kullanıcı Çıkar").setEmoji("➖").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("voice_lock").setLabel("Kilitle").setEmoji("🔒").setStyle(ButtonStyle.Secondary)
  );
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("voice_unlock").setLabel("Kilidi Kaldır").setEmoji("🔓").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("voice_limit").setLabel("Üye Sayısı").setEmoji("👥").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("voice_kick").setLabel("Kanaldan At").setEmoji("👢").setStyle(ButtonStyle.Secondary)
  );
  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("voice_info").setLabel("Kanal Bilgisi").setEmoji("ℹ️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("voice_role_add").setLabel("Rol Ekle").setEmoji("🎭").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("voice_role_remove").setLabel("Rol Çıkar").setEmoji("🎭").setStyle(ButtonStyle.Secondary)
  );
  return [row1, row2, row3, row4];
}

function isVoicePanelMessage(message, botId) {
  if (message.author?.id !== botId) return false;
  const embed = message.embeds?.[0];
  if (
    embed?.footer?.text?.includes(VOICE_PANEL_MARKER) ||
    embed?.title?.includes("Ses Sistemi Paneli")
  ) {
    return true;
  }
  if (message.components?.length > 0) {
    const customIds = message.components.flatMap((row) =>
      (row.components || []).map((c) => c.customId)
    );
    if (
      customIds.some(
        (id) => id && (id.startsWith("voice_") || id.startsWith("tv_"))
      )
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Belirtilen sunucu + kanala ses paneli gönderir (yoksa).
 */
async function ensureVoicePanelForGuild(client, guildId, channelId) {
  const logger = require("../../utils/logger");
  if (!channelId) return;

  try {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) return;

    let existing = null;
    let lastId;
    for (let i = 0; i < 5; i++) {
      const batch = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
      if (!batch || batch.size === 0) break;
      existing = batch.find((m) => isVoicePanelMessage(m, client.user.id));
      if (existing) break;
      lastId = batch.last()?.id;
      if (batch.size < 100) break;
    }

    if (existing) {
      logger.info(`[${guild.name}] Ses paneli zaten var (${existing.id})`);
      return;
    }

    await channel.send({
      embeds: [getVoicePanelEmbed()],
      components: getVoicePanelComponents(),
    });
    logger.success(`[${guild.name}] Ses sistemi paneli gönderildi → #${channel.name}`);
  } catch (err) {
    logger.error(`[voicePanel] ${guildId} için panel gönderilemedi:`, err.message);
  }
}

/**
 * Tüm sunuculara ses paneli gönderir.
 */
async function ensureVoicePanelMessage(client) {
  // 1. Ana sunucu
  if (TARGET_GUILD_ID) {
    if (VOICE_PANEL_CHANNEL_ID) await ensureVoicePanelForGuild(client, TARGET_GUILD_ID, VOICE_PANEL_CHANNEL_ID);
    if (VOICE_JOIN_CHANNEL_ID && VOICE_JOIN_CHANNEL_ID !== VOICE_PANEL_CHANNEL_ID) {
      await ensureVoicePanelForGuild(client, TARGET_GUILD_ID, VOICE_JOIN_CHANNEL_ID);
    }
  }

  // 2. İkinci sunucu
  if (GUILD2_ID) {
    if (GUILD2_VOICE_PANEL_ID) await ensureVoicePanelForGuild(client, GUILD2_ID, GUILD2_VOICE_PANEL_ID);
    if (GUILD2_VOICE_JOIN_ID && GUILD2_VOICE_JOIN_ID !== GUILD2_VOICE_PANEL_ID) {
      await ensureVoicePanelForGuild(client, GUILD2_ID, GUILD2_VOICE_JOIN_ID);
    }
  }

  // 3. TMT Sunucusu
  if (TMT_GUILD_ID) {
    if (TMT_VOICE_PANEL_CHANNEL_ID) await ensureVoicePanelForGuild(client, TMT_GUILD_ID, TMT_VOICE_PANEL_CHANNEL_ID);
    if (TMT_VOICE_JOIN_CHANNEL_ID && TMT_VOICE_JOIN_CHANNEL_ID !== TMT_VOICE_PANEL_CHANNEL_ID) {
      await ensureVoicePanelForGuild(client, TMT_GUILD_ID, TMT_VOICE_JOIN_CHANNEL_ID);
    }
  }

  // 4. Tüm sunucularda ismi sesli kanal oluşturma ile ilgili olan kanalları bul ve panel gönder
  try {
    for (const guild of client.guilds.cache.values()) {
      const matchingChannels = guild.channels.cache.filter((ch) => {
        if (!ch.isTextBased()) return false;
        const name = (ch.name || "").toLowerCase();
        return (
          name.includes("sesli-kanal-olustur") ||
          name.includes("sesli-kanal-oluştur") ||
          name.includes("ses-paneli") ||
          name.includes("sesli-panel") ||
          name.includes("ses-oluştur") ||
          name.includes("ses-olustur") ||
          name.includes("voice-create")
        );
      });

      for (const channel of matchingChannels.values()) {
        await ensureVoicePanelForGuild(client, guild.id, channel.id);
      }
    }
  } catch (err) {
    console.error("[ensureVoicePanelMessage] Auto-scan error:", err.message);
  }
}

module.exports = {
  ensureVoicePanelMessage,
  ensureVoicePanelForGuild,
  getVoicePanelEmbed,
  getVoicePanelComponents,
};

