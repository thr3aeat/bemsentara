/**
 * Staff Recruitment Panel & Form Log Service
 * Target Channel: 1535967551874670693 (Guild: 1367646464804655104)
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { BASE_URL } = require("../../config");

const RECRUITMENT_CHANNEL_ID = "1535967551874670693";
const RECRUITMENT_GUILD_ID = "1367646464804655104";

const BADGE_ACIK = "<:a1:1535973588031635608><:a2:1535973586706108416><:a3:1535973585083175063><:a4:1535973583485009940>";
const BADGE_KAPALI = "<:k1:1535973581995909170><:k2:1535973580343611442><:k3:1535973578816880690><:k4:1535973577042567178>";

/**
 * Build Discord Panel Embed for Channel 1535967551874670693
 */
function getRecruitmentPanelEmbed() {
  const eventStaffUrl = `${BASE_URL || "https://ekoyildiz.duckdns.org"}/forms/event-staff`;

  return new EmbedBuilder()
    .setTitle("│ Yetkili Formları │")
    .setDescription(
      "# **EkoYıldız Yetkili Ekibi Başvuruları**\n\n" +
      "• 🛡️ **[ Discord Moderasyon Takımı ]** başvuru formu için tıklayın.\n" +
      "  ◦ Başvuru durumu: " + BADGE_KAPALI + "\n\n" +
      "• 🗡️ **[ Oyun Moderasyon Takımı ]** başvuru formu için tıklayın.\n" +
      "  ◦ Başvuru durumu: " + BADGE_KAPALI + "\n\n" +
      "• ✳️ **[ Etkinlik Yetkilisi ]** başvuru formu için [tıklayın](" + eventStaffUrl + ").\n" +
      "  ◦ Başvuru durumu: " + BADGE_ACIK + "\n\n" +
      "• ⚜️ **[ Topluluk Elçiliği ]** başvuru formu için tıklayın.\n" +
      "  ◦ Başvuru durumu: " + BADGE_KAPALI + "\n\n" +
      "───────────────────────────────────\n" +
      "Başvuru durumları otomatik olarak güncellenmektedir. Yeni bir bölümün başvuruları açıldığında sizleri bilgilendireceğiz."
    )
    .setColor(0x2F3136)
    .setFooter({ text: "EkoYıldız Yetkili Alımları • Başvuru Sistemi" })
    .setTimestamp();
}

/**
 * Build ActionRow button for Panel
 */
function getRecruitmentPanelButton() {
  const formsUrl = `${BASE_URL || "https://ekoyildiz.duckdns.org"}/forms`;
  const eventStaffUrl = `${BASE_URL || "https://ekoyildiz.duckdns.org"}/forms/event-staff`;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("🌐 Siteden Başvuru Yap (Etkinlik Yetkilisi)")
      .setStyle(ButtonStyle.Link)
      .setURL(eventStaffUrl),
    new ButtonBuilder()
      .setLabel("📋 Tüm Yetkili Formları")
      .setStyle(ButtonStyle.Link)
      .setURL(formsUrl)
  );
}

/**
 * Ensures the recruitment panel message exists in channel 1535967551874670693
 */
async function ensureRecruitmentPanelMessage(client) {
  try {
    if (!client || !client.isReady()) return;

    let channel = await client.channels.fetch(RECRUITMENT_CHANNEL_ID).catch(() => null);
    if (!channel) {
      for (const guild of client.guilds.cache.values()) {
        const found = guild.channels.cache.get(RECRUITMENT_CHANNEL_ID);
        if (found) {
          channel = found;
          break;
        }
      }
    }

    if (!channel) {
      console.warn(`[RecruitmentPanel] Target channel ${RECRUITMENT_CHANNEL_ID} not found.`);
      return;
    }

    const messages = await channel.messages.fetch({ limit: 15 }).catch(() => null);
    const existingMessage = messages ? messages.find(m => m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0].title?.includes("Yetkili Formları")) : null;

    const embed = getRecruitmentPanelEmbed();
    const row = getRecruitmentPanelButton();

    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed], components: [row] }).catch(() => {});
      console.log(`✅ [RecruitmentPanel] Yetkili alımları paneli güncellendi (#${channel.name})`);
    } else {
      await channel.send({ embeds: [embed], components: [row] });
      console.log(`✅ [RecruitmentPanel] Yetkili alımları paneli gönderildi (#${channel.name})`);
    }
  } catch (err) {
    console.error("[RecruitmentPanel] ensureRecruitmentPanelMessage error:", err.message);
  }
}

/**
 * Sends a log notification embed when a user submits an application
 */
async function sendNewApplicationLog(client, submission) {
  try {
    if (!client || !client.isReady()) return;

    let channel = await client.channels.fetch(RECRUITMENT_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("📥 Yeni Başvuru Gönderildi!")
      .setDescription(
        `**${submission.discordUsername}** (\`${submission.userId}\`) adlı kullanıcı **Etkinlik Yetkilisi Alım Formunu** doldurdu.`
      )
      .addFields(
        { name: "📋 Form Tipi", value: "✳️ Etkinlik Yetkilisi [A-1]", inline: true },
        { name: "👤 Başvuran", value: `<@${submission.userId}>`, inline: true },
        { name: "🆔 Başvuru ID", value: `\`${submission._id}\``, inline: true }
      )
      .setColor(0x818CF8)
      .setFooter({ text: "EkoYıldız Başvuru Yönetim Sistemi" })
      .setTimestamp();

    const adminUrl = `${BASE_URL || "https://ekoyildiz.duckdns.org"}/admin`;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("⚙️ Admin Paneline Git & İncele")
        .setStyle(ButtonStyle.Link)
        .setURL(adminUrl)
    );

    await channel.send({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error("[RecruitmentPanel] sendNewApplicationLog error:", err.message);
  }
}

module.exports = {
  RECRUITMENT_CHANNEL_ID,
  RECRUITMENT_GUILD_ID,
  ensureRecruitmentPanelMessage,
  sendNewApplicationLog,
};
