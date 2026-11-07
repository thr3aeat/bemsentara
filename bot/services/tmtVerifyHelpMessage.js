/**
 * TMT Verification Help Message Service
 * Posts verification instructions to TMT server (Components V2)
 */

const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder,
  SeparatorBuilder, SeparatorSpacingSize, MessageFlags,
} = require("discord.js");
const { TMT_GUILD_ID, TMT_VERIFY_HELP_CHANNEL_ID, BASE_URL } = require("../../config");

function buildTMTVerifyHelpContainer() {
  const quickUrl = `${BASE_URL || "https://ekoyildiz.duckdns.org"}/baglan/tmt`;
  return new ContainerBuilder()
    .setAccentColor(0xDC143C)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "# 🎖️ TMT Doğrulama & Rol Senkronizasyonu\n" +
        "Roblox hesabını Discord hesabına bağlayarak **TMT | Turkish Armed Forces** sunucusundaki rollerini saniyeler içinde otomatik al!"
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "### ⚡ HIZLI DOĞRULA (Önerilen)\n" +
        "Aşağıdaki **⚡ HIZLI DOĞRULA** butonuna tıklayarak web üzerinden **Discord Doğrula ➔ Roblox Doğrula ➔ 🎉 ARTIK HAZIRSIN!** adımlarını tek ekranda tamamlayabilirsin."
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "### 📋 Doğrulama Yöntemleri\n" +
        "> ⚡ **Hızlı Doğrula (Web)** — Tek tıkla siteye yönlendirir, Discord + Roblox bağlar ve rollerini verir\n" +
        "> 🤝 **Roblox Arkadaşlık** — `yildiznqt` bot hesabına arkadaşlık isteği göndererek anında doğrulan\n" +
        "> 🌐 **Roblox OAuth2** — Resmi Roblox girişi ile güvenli bağlantı\n" +
        "> 📝 **Roblox Açıklama** — Profil açıklamana doğrulama kodu yazarak"
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
          .setStyle(ButtonStyle.Success)
      )
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("-# TMT Doğrulama Sistemi • Components V2"));
}

/**
 * Post verification help message to TMT server
 */
async function postTMTVerifyHelpMessage(client) {
  try {
    const guild = await client.guilds.fetch(TMT_GUILD_ID);
    const channel = await guild.channels.fetch(TMT_VERIFY_HELP_CHANNEL_ID);
    const container = buildTMTVerifyHelpContainer();

    await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    console.log("✅ TMT doğrulama yardım mesajı gönderildi");
    return true;
  } catch (error) {
    console.error("❌ TMT doğrulama yardım mesajı gönderilirken hata:", error);
    return false;
  }
}

/**
 * Ensure verification help message exists (and update to latest Components V2)
 */
async function ensureTMTVerifyHelpMessage(client) {
  try {
    const guild = await client.guilds.fetch(TMT_GUILD_ID);
    const channel = await guild.channels.fetch(TMT_VERIFY_HELP_CHANNEL_ID);

    const messages = await channel.messages.fetch({ limit: 10 });
    const existingMessage = messages.find(m => m.author.id === client.user.id && (m.embeds.length > 0 || m.components.length > 0));

    if (!existingMessage) {
      await postTMTVerifyHelpMessage(client);
    } else {
      const container = buildTMTVerifyHelpContainer();
      await existingMessage.edit({ content: null, embeds: [], components: [container], flags: MessageFlags.IsComponentsV2 }).catch(async () => {
        await existingMessage.delete().catch(() => {});
        await postTMTVerifyHelpMessage(client);
      });
    }
  } catch (error) {
    console.error("❌ TMT doğrulama mesajı kontrol edilirken hata:", error);
  }
}

module.exports = {
  buildTMTVerifyHelpContainer,
  postTMTVerifyHelpMessage,
  ensureTMTVerifyHelpMessage,
};
