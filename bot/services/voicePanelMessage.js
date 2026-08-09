const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  MessageFlags,
  EmbedBuilder,
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

const VOICE_PANEL_MARKER = "Sentara-Voice-Panel-v2";

/**
 * Generates Discord Components V2 payload for the Voice Channel Control Panel
 */
function getVoicePanelV2Payload() {
  const container = new ContainerBuilder();

  // 1️⃣ Banner
  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL("https://i.imgur.com/xvYD3tF.png")
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // 2️⃣ Başlık
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## Özel Sesli Kanal Yönetim Paneli`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // 3️⃣ Açıklama Metni
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> Bu arayüz özel sesli kanalınızın yönetim panelidir. Sesli kanalınızı bu panel üzerinden basitçe yönetebilirsiniz.\n` +
      `> • **Kullanıcı susturmak, bağlantısını kesmek ve sağırlaştırmak** için seslide bulunan kullanıcının profilinden işlemi gerçekleştirebilirsiniz.\n` +
      `> • **Sesli kanalınız içerisinde kurallar ve ilkeleri ihlal etmediğinizden** emin olun.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false)
  );

  // 4️⃣ Kanal Ayar Seçenekleri Dropdown
  const channelMenu = new StringSelectMenuBuilder()
    .setCustomId("tv_select_main_panel")
    .setPlaceholder("Kanal ayar seçenekleri")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("Kanal ismini değiştir").setDescription("Sesli kanalınızın ismini değiştirmek için kullanabilirsiniz.").setValue("rename").setEmoji("✏️"),
      new StringSelectMenuOptionBuilder().setLabel("Kanal görünürlüğünü değiştir").setDescription("Sesli kanalınızın görünürlüğünü kapatmak ve açmak için kullanabilirsiniz.").setValue("visibility").setEmoji("👁️"),
      new StringSelectMenuOptionBuilder().setLabel("Kullanıcıyı kanaldan yasakla").setDescription("Sesli kanalınızdan kullanıcı yasaklamak için kullanabilirsiniz.").setValue("ban_user").setEmoji("🔨"),
      new StringSelectMenuOptionBuilder().setLabel("Kullanıcının kanaldan yasağını kaldır").setDescription("Sesli kanalınızdan yasaklanmış kullanıcının yasağını kaldırmak için kullanabilirsiniz.").setValue("unban_user").setEmoji("🔧"),
      new StringSelectMenuOptionBuilder().setLabel("Kanal kilit seviyesini değiştir").setDescription("Sesli kanalınızı kilitleyebilirsiniz, kilidini açabilirsiniz.").setValue("lock").setEmoji("🔒"),
      new StringSelectMenuOptionBuilder().setLabel("Kullanıcı limitini değiştir").setDescription("Kanala girebilecek maksimum kullanıcı sayısını belirleyin.").setValue("user_limit").setEmoji("👥"),
      new StringSelectMenuOptionBuilder().setLabel("Bitrate kalitesini değiştir").setDescription("Ses kalitesini artırmak veya azaltmak için kullanabilirsiniz.").setValue("bitrate").setEmoji("🎚️"),
      new StringSelectMenuOptionBuilder().setLabel("Bölge ayarını değiştir").setDescription("Ses bağlantısı için sunucu bölgesini seçin.").setValue("region").setEmoji("🌍"),
      new StringSelectMenuOptionBuilder().setLabel("Güvenilir kullanıcı ekle").setDescription("Kanal kilitli bile olsa girebilecek kullanıcı ekleyin.").setValue("whitelist").setEmoji("⭐"),
      new StringSelectMenuOptionBuilder().setLabel("Davet linki oluştur").setDescription("Arkadaşlarınızı kanala davet etmek için link oluşturun.").setValue("invite").setEmoji("📞"),
      new StringSelectMenuOptionBuilder().setLabel("Sesli kanaldan kullanıcı at").setDescription("Belirli bir kullanıcıyı sesli kanaldan çıkarın.").setValue("kick_user").setEmoji("🚫"),
      new StringSelectMenuOptionBuilder().setLabel("Kanal sahipliğini devret").setDescription("Kanal sahipliğini başka bir kullanıcıya devredin.").setValue("transfer").setEmoji("👑"),
      new StringSelectMenuOptionBuilder().setLabel("Kanal durumunu kopyala").setDescription("Kanal bilgilerini ve ayarlarını metin olarak alın.").setValue("copy_info").setEmoji("📋"),
      new StringSelectMenuOptionBuilder().setLabel("Kanalı sil").setDescription("Sesli kanalı kalıcı olarak silin.").setValue("delete").setEmoji("🗑️"),
      new StringSelectMenuOptionBuilder().setLabel("Paneli yenile").setDescription("Kanal bilgilerini ve üye listesini güncelleyin.").setValue("refresh").setEmoji("🔄")
    );

  const menuRow = new ActionRowBuilder().addComponents(channelMenu);
  container.addActionRowComponents(menuRow);

  return {
    content: null,
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
}

function getVoicePanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🔊 Ses Sistemi Paneli")
    .setDescription(
      "Aşağıdaki seçeneği kullanarak özel ses kanalınızı yönetebilirsiniz.\n\n" +
        "**Ses Sistemi**"
    )
    .setFooter({ text: `${VOICE_PANEL_MARKER} • Sentara` })
    .setTimestamp();
}

function getVoicePanelComponents() {
  return getVoicePanelV2Payload().components;
}

function isVoicePanelMessage(message, botId) {
  if (message.author?.id !== botId) return false;
  const embed = message.embeds?.[0];
  if (
    embed?.footer?.text?.includes(VOICE_PANEL_MARKER) ||
    embed?.title?.includes("Ses Sistemi Paneli") ||
    embed?.title?.includes("Özel Sesli Kanal")
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
 * Belirtilen sunucu + kanala ses paneli gönderir (yoksa günceller).
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

    const payload = getVoicePanelV2Payload();

    if (existing) {
      await existing.edit(payload).catch(async () => {
        await channel.send(payload);
      });
      logger.success(`[${guild.name}] Ses paneli Components V2 olarak güncellendi (${existing.id})`);
      return;
    }

    await channel.send(payload);
    logger.success(`[${guild.name}] Ses sistemi Components V2 paneli gönderildi → #${channel.name}`);
  } catch (err) {
    console.error(`[voicePanel] ${guildId} için panel gönderilemedi:`, err.message);
  }
}

/**
 * Tüm sunucularda ilgili kanallara ses paneli gönderir.
 */
async function ensureVoicePanelMessage(client) {
  if (TARGET_GUILD_ID) {
    if (VOICE_PANEL_CHANNEL_ID) await ensureVoicePanelForGuild(client, TARGET_GUILD_ID, VOICE_PANEL_CHANNEL_ID);
    if (VOICE_JOIN_CHANNEL_ID && VOICE_JOIN_CHANNEL_ID !== VOICE_PANEL_CHANNEL_ID) {
      await ensureVoicePanelForGuild(client, TARGET_GUILD_ID, VOICE_JOIN_CHANNEL_ID);
    }
  }

  if (GUILD2_ID) {
    if (GUILD2_VOICE_PANEL_ID) await ensureVoicePanelForGuild(client, GUILD2_ID, GUILD2_VOICE_PANEL_ID);
    if (GUILD2_VOICE_JOIN_ID && GUILD2_VOICE_JOIN_ID !== GUILD2_VOICE_PANEL_ID) {
      await ensureVoicePanelForGuild(client, GUILD2_ID, GUILD2_VOICE_JOIN_ID);
    }
  }

  if (TMT_GUILD_ID) {
    if (TMT_VOICE_PANEL_CHANNEL_ID) await ensureVoicePanelForGuild(client, TMT_GUILD_ID, TMT_VOICE_PANEL_CHANNEL_ID);
    if (TMT_VOICE_JOIN_CHANNEL_ID && TMT_VOICE_JOIN_CHANNEL_ID !== TMT_VOICE_PANEL_CHANNEL_ID) {
      await ensureVoicePanelForGuild(client, TMT_GUILD_ID, TMT_VOICE_JOIN_CHANNEL_ID);
    }
  }

  try {
    for (const guild of client.guilds.cache.values()) {
      const matchingChannels = guild.channels.cache.filter((ch) => {
        if (!ch.isTextBased()) return false;
        const name = (ch.name || "").toLowerCase();
        return (
          name.includes("sesli-kanal-olustur") ||
          name.includes("sesli-kanal-oluştur") ||
          name.includes("kanal-yonetimi") ||
          name.includes("kanal-yönetimi") ||
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
  getVoicePanelV2Payload,
  getVoicePanelEmbed,
  getVoicePanelComponents,
};
