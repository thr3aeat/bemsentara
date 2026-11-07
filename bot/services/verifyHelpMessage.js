const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const {
  TARGET_GUILD_ID,
  VERIFY_CHANNEL_ID,
  BASE_URL,
} = require("../../config");
const { MAIN_GROUP_URL } = require("../config/roleSync");

/** Mevcut mesajı tanımak için footer işareti */
const VERIFY_HELP_MARKER = "Sentara-Verify-Help-v1";

function buildVerifyHelpContainer() {
  const quickUrl = `${BASE_URL || "https://ekoyildiz.duckdns.org"}/baglan/bem`;
  return new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "# 🔐 Doğrulama ve Rol Güncelleme\n" +
        "Roblox **BEM** grubundaki rütbenize göre Discord rolleriniz otomatik verilir."
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "### ⚡ HIZLI DOĞRULA (Tek Tıkla Web Doğrulama)\n" +
        "Aşağıdaki **⚡ HIZLI DOĞRULA** butonuna tıklayarak web üzerinden **Discord Doğrula ➔ Roblox Doğrula ➔ 🎉 ARTIK HAZIRSIN!** adımlarını anında tamamlayabilirsiniz."
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "### 📋 Doğrulama & Güncelleme Yöntemleri\n" +
        `> ⚡ **Hızlı Doğrula:** [Buraya Tıkla](${quickUrl}) — Discord + Roblox bağla ve rollerini otomatik al\n` +
        "> 🤝 **Roblox Arkadaşlık:** `/authorize` veya **Yetkilendir** butonu ile `yildiznqt` botuna istek gönder\n" +
        "> 🔄 **Rol Güncelleme:** Rütbe değiştirdiyseniz `/dogrula` (`/update`) yazın veya **Rollerimi Senkronize Et** butonuna basın\n" +
        `> ⚠️ **Not:** Ana **[BEM grubunun](${MAIN_GROUP_URL})** üyesi olmalısınız`
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("⚡ HIZLI DOĞRULA")
          .setStyle(ButtonStyle.Link)
          .setURL(quickUrl),
        new ButtonBuilder()
          .setCustomId("authorize_button")
          .setLabel("Yetkilendirmek İçin Tıkla")
          .setEmoji("🔐")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("verify_button")
          .setLabel("Rollerimi Senkronize Et")
          .setEmoji("✅")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("verify_help_refresh")
          .setLabel("ℹ️ Komut Özeti")
          .setStyle(ButtonStyle.Secondary)
      )
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${VERIFY_HELP_MARKER} • Sentara Components V2`));
}

function getVerifyHelpEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🔐 Doğrulama ve Rol Güncelleme")
    .setDescription(
      "Roblox **BEM** grubundaki rütbenize göre Discord rolleriniz otomatik verilir.\n\n" +
      "Aşağıdaki **⚡ HIZLI DOĞRULA** butonuna tıklayarak hesabınızı saniyeler içinde bağlayabilirsiniz."
    )
    .addFields(
      {
        name: "⚡ HIZLI DOĞRULA",
        value: `[Hızlı Doğrulama Sayfası](${BASE_URL}/baglan/bem) üzerinden **Discord Doğrula ➔ Roblox Doğrula ➔ ARTIK HAZIRSIN!** adımlarını tamamlayın.`,
        inline: false,
      },
      {
        name: "🔄 Rol güncelleme — `/dogrula`",
        value: "Grupta rütbe değiştirdiyseniz `/dogrula` veya `/update` kullanın.",
        inline: false,
      }
    )
    .setFooter({ text: `${VERIFY_HELP_MARKER} • Sentara` })
    .setTimestamp();
}

function getVerifyHelpComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("⚡ HIZLI DOĞRULA")
        .setStyle(ButtonStyle.Link)
        .setURL(`${BASE_URL}/baglan/bem`),
      new ButtonBuilder()
        .setCustomId("authorize_button")
        .setLabel("🔐 Yetkilendir")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("verify_button")
        .setLabel("✅ Rollerimi Senkronize Et")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("verify_help_refresh")
        .setLabel("ℹ️ Komut Özeti")
        .setStyle(ButtonStyle.Secondary)
    ),
  ];
}

function isVerifyHelpMessage(message, botId) {
  if (message.author?.id !== botId) return false;
  const embed = message.embeds?.[0];
  if (embed) {
    const footer = embed.footer?.text || "";
    const title = embed.title || "";
    if (footer.includes(VERIFY_HELP_MARKER) || title.includes("Doğrulama ve Rol Güncelleme")) return true;
  }
  if (message.components?.length > 0) {
    const raw = JSON.stringify(message.components);
    if (raw.includes(VERIFY_HELP_MARKER) || raw.includes("verify_help_refresh") || raw.includes("/baglan/bem")) return true;
  }
  return false;
}

/**
 * Doğrulama kanalına Components V2 yardım mesajını gönderir veya günceller.
 */
async function ensureVerifyHelpMessage(client) {
  const logger = require("../../utils/logger");

  if (!VERIFY_CHANNEL_ID) {
    logger.warn("VERIFY_CHANNEL_ID tanımlı değil, doğrulama mesajı atlanıyor.");
    return { posted: false, reason: "no_channel_config" };
  }

  try {
    const guild = await client.guilds.fetch(TARGET_GUILD_ID);
    const channel = await guild.channels.fetch(VERIFY_CHANNEL_ID);

    if (!channel?.isTextBased()) {
      logger.warn(`Doğrulama kanalı metin kanalı değil: ${VERIFY_CHANNEL_ID}`);
      return { posted: false, reason: "invalid_channel" };
    }

    let existing = null;
    let lastId = undefined;

    for (let i = 0; i < 3; i++) {
      const batch = await channel.messages.fetch({ limit: 50, before: lastId });
      if (batch.size === 0) break;

      existing = batch.find((m) => isVerifyHelpMessage(m, client.user.id));
      if (existing) break;

      lastId = batch.last()?.id;
      if (batch.size < 50) break;
    }

    const container = buildVerifyHelpContainer();

    if (existing) {
      await existing.edit({
        content: null,
        embeds: [],
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(async () => {
        await existing.delete().catch(() => {});
        await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      });
      logger.info(`Doğrulama yardım mesajı Components V2 olarak güncellendi (${existing.id}).`);
      return { posted: false, updated: true, reason: "updated", messageId: existing.id };
    }

    const sent = await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    logger.success(`Doğrulama yardım mesajı (Components V2) gönderildi: #${channel.name} (${sent.id})`);
    return { posted: true, messageId: sent.id };
  } catch (err) {
    logger.error("Doğrulama yardım mesajı gönderilemedi:", err.message);
    return { posted: false, reason: "error", error: err.message };
  }
}

module.exports = {
  VERIFY_HELP_MARKER,
  buildVerifyHelpContainer,
  getVerifyHelpEmbed,
  getVerifyHelpComponents,
  ensureVerifyHelpMessage,
  isVerifyHelpMessage,
};
