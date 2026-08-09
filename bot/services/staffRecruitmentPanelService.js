/**
 * Staff Recruitment Panel & Form Log Service
 * Target Channel: 1535967551874670693 (Guild: 1367646464804655104)
 */

const { BASE_URL } = require("../../config");

const RECRUITMENT_CHANNEL_ID = "1535967551874670693";
const RECRUITMENT_GUILD_ID = "1367646464804655104";

// 5-parça kapalı badge ve 4-parça açık badge
const BADGE_ACIK   = "<:a1:1535976290857783356><:a2:1535976288567693383><:a3:1535976286399242340><:a4:1535976284310470776>";
const BADGE_KAPALI = "<:k1:1535976282947453009><:k2:1535976281479319583><:k3:1535976280292597830><:k3b:1535978163677433957><:k4:1535976279063666688>";

const BANNER_IMAGE_URL = "https://i.imgur.com/bSVh4Rl.png";

/**
 * Components V2 ile Yetkili Formları paneli — görseldeki gibi:
 * Üstte banner görseli, altında başvuru listesi ve durumlar.
 */
function getRecruitmentPanelPayload() {
  const formsUrl      = `${BASE_URL || "https://ekoyildiz.duckdns.org"}/forms`;
  const eventStaffUrl = `${BASE_URL || "https://ekoyildiz.duckdns.org"}/forms/event-staff`;

  const ComponentsV2Factory = require('../utils/componentsV2Factory');

  return {
    flags: ComponentsV2Factory.FLAGS,
    components: [
      ComponentsV2Factory.container(0x2F3136, [
        // Banner görseli — en üstte
        ComponentsV2Factory.mediaGallery([BANNER_IMAGE_URL]),
        ComponentsV2Factory.separator(false),

        // Başlık satırı — görseldeki "│ Yetkili Formları │" tarzı
        ComponentsV2Factory.section(
         //buraya banner gelecek
          '**EkoYıldız Yetkili Ekibi Başvuruları**'
        ),

        ComponentsV2Factory.separator(false),

        // Discord Moderasyon Takımı
        ComponentsV2Factory.section(
          `• <:mod:1535976277654249562> **[ Discord Moderasyon Takımı ]** başvuru formu için [tıklayın](${formsUrl}).\n` +
          `  ◦ Başvuru durumu: ${BADGE_KAPALI}`
        ),

        // Oyun Moderasyon Takımı
        ComponentsV2Factory.section(
          `• 🗡️ **[ Oyun Moderasyon Takımı ]** başvuru formu için [tıklayın](${formsUrl}).\n` +
          `  ◦ Başvuru durumu: ${BADGE_KAPALI}`
        ),

        // Etkinlik Yetkilisi — AÇIK
        ComponentsV2Factory.section(
          `• <:etkinlik:1535976275317891194> **[ Etkinlik Yetkilisi ]** başvuru formu için [tıklayın](${eventStaffUrl}).\n` +
          `  ◦ Başvuru durumu: ${BADGE_ACIK}`
        ),

        // Topluluk Elçiliği
        ComponentsV2Factory.section(
          `• ⚜️ **[ Topluluk Elçiliği ]** başvuru formu için [tıklayın](${formsUrl}).\n` +
          `  ◦ Başvuru durumu: ${BADGE_KAPALI}`
        ),

        ComponentsV2Factory.separator(true),

        ComponentsV2Factory.text(
          'Başvuru durumları otomatik olarak güncellenmektedir. Yeni bir bölümün başvuruları açıldığında sizleri bilgilendireceğiz.'
        ),
      ]),
    ],
  };
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
        if (found) { channel = found; break; }
      }
    }

    if (!channel) {
      console.warn(`[RecruitmentPanel] Target channel ${RECRUITMENT_CHANNEL_ID} not found.`);
      return;
    }

    const messages = await channel.messages.fetch({ limit: 15 }).catch(() => null);
    const existingMessage = messages
      ? messages.find(m =>
          m.author.id === client.user.id &&
          (m.components?.length > 0 || m.embeds?.length > 0)
        )
      : null;

    const payload = getRecruitmentPanelPayload();

    if (existingMessage) {
      await existingMessage.edit(payload).catch(() => {});
      console.log(`✅ [RecruitmentPanel] Yetkili alımları paneli güncellendi (#${channel.name})`);
    } else {
      await channel.send(payload);
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

    const ComponentsV2Factory = require('../utils/componentsV2Factory');

    const payload = {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container(0x818cf8, [
          ComponentsV2Factory.section(
            '## 📥 Yeni Başvuru Gönderildi!\n\n' +
            `**${submission.discordUsername}** (\`${submission.userId}\`) adlı kullanıcı **Etkinlik Yetkilisi Alım Formunu** doldurdu.\n\n` +
            `📋 **Form:** ✳️ Etkinlik Yetkilisi [A-1]\n` +
            `👤 **Başvuran:** <@${submission.userId}>\n` +
            `🆔 **Başvuru ID:** \`${submission._id}\``
          ),
        ]),
      ],
    };

    await channel.send(payload);
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


