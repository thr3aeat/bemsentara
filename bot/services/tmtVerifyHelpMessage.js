/**
 * TMT Verification Help Message Service
 * Posts verification instructions to TMT server
 */

const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder,
  SeparatorBuilder, SeparatorSpacingSize, MessageFlags,
} = require("discord.js");
const { TMT_GUILD_ID, TMT_VERIFY_HELP_CHANNEL_ID } = require("../../config");

/**
 * Post verification help message to TMT server
 */
async function postTMTVerifyHelpMessage(client) {
  try {
    const guild = await client.guilds.fetch(TMT_GUILD_ID);
    const channel = await guild.channels.fetch(TMT_VERIFY_HELP_CHANNEL_ID);

    const container = new ContainerBuilder()
      .setAccentColor(0xDC143C)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "# 🎖️ Doğrulama Yardımı\n" +
          "Roblox hesabını Discord hesabına bağlayarak sunucudaki rollerini otomatik senkronize et."
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### 📋 Nasıl Doğrulanırım?\n" +
          "**1.** Aşağıdaki **Yetkilendirmek İçin Tıkla** butonuna bas\n" +
          "**2.** Sana uygun doğrulama yöntemini seç:\n" +
          "> 🌐 **Roblox OAuth2** — Resmi Roblox girişi ile\n" +
          "> 🤝 **Roblox Arkadaşlık** — Botun isteğini kabul ederek\n" +
          "> 📝 **Roblox Açıklama** — Profil açıklamana kod yazarak\n" +
          "> ✉️ **Discord DM** — Doğrulama bağlantısı DM'ine gelsin\n" +
          "**3.** Rollerin otomatik senkronize edilir"
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### 🔄 Roller Nasıl Senkronize Edilir?\n" +
          "TMT'deki rütbene göre Discord rolleri atanır. Bulunduğun her branşın rolünü alırsın; rütbe 100+ ise branş yetkilisi rolü de eklenir."
        )
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("authorize_button")
            .setLabel("Yetkilendirmek İçin Tıkla")
            .setEmoji("🔐")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("verify_button")
            .setLabel("Rollerimi Senkronize Et")
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success)
        )
      )
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("-# TMT Doğrulama Sistemi"));

    await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    console.log("✅ TMT doğrulama yardım mesajı gönderildi");
    return true;
  } catch (error) {
    console.error("❌ TMT doğrulama yardım mesajı gönderilirken hata:", error);
    return false;
  }
}

/**
 * Ensure verification help message exists
 */
async function ensureTMTVerifyHelpMessage(client) {
  try {
    const guild = await client.guilds.fetch(TMT_GUILD_ID);
    const channel = await guild.channels.fetch(TMT_VERIFY_HELP_CHANNEL_ID);

    const messages = await channel.messages.fetch({ limit: 10 });
    const existingMessage = messages.find(m => m.author.id === client.user.id && (m.embeds.length > 0 || m.components.length > 0));

    if (!existingMessage) {
      await postTMTVerifyHelpMessage(client);
    }
  } catch (error) {
    console.error("❌ TMT doğrulama mesajı kontrol edilirken hata:", error);
  }
}

module.exports = {
  postTMTVerifyHelpMessage,
  ensureTMTVerifyHelpMessage,
};
