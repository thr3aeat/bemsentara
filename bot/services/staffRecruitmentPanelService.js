/**
 * Staff Recruitment Panel & Form Log Service
 * Target Channel: 1535967551874670693 (Guild: 1367646464804655104)
 */

const { BASE_URL } = require("../../config");
const ComponentsV2Factory = require("../utils/componentsV2Factory");

const RECRUITMENT_CHANNEL_ID = "1535967551874670693"; // Yetkili alımları paneli
const RECRUITMENT_GUILD_ID   = "1367646464804655104";
const FORM_LOG_CHANNEL_ID    = "1518692526998032626"; // Form başvuru logları

// 5-parça kapalı badge ve 4-parça açık badge
const BADGE_ACIK   = "<:a1:1535976290857783356><:a2:1535976288567693383><:a3:1535976286399242340><:a4:1535976284310470776>";
const BADGE_KAPALI = "<:k1:1535976282947453009><:k2:1535976281479319583><:k3:1535976280292597830><:k3b:1535978163677433957><:k4:1535976279063666688>";

const BANNER_IMAGE_URL = "https://i.imgur.com/bSVh4Rl.png";

const RESOLVED_BASE_URL = BASE_URL || "https://ekoyildiz.duckdns.org";

/**
 * Components V2 ile Yetkili Formları paneli — görseldeki gibi:
 * Üstte banner görseli, altında başvuru listesi ve durumlar.
 */
function getRecruitmentPanelPayload() {
  const formsUrl               = `${RESOLVED_BASE_URL}/forms`;
  const eventStaffUrl          = `${RESOLVED_BASE_URL}/forms/event-staff`;
  const communityAmbassadorUrl = `${RESOLVED_BASE_URL}/forms/community-ambassador`;

  return {
    flags: ComponentsV2Factory.FLAGS,
    components: [
      ComponentsV2Factory.container(0x2F3136, [
        // Banner görseli — en üstte
        ComponentsV2Factory.mediaGallery([BANNER_IMAGE_URL]),
        ComponentsV2Factory.separator(false),

        // Başlık satırı — görseldeki gibi büyük punto
        ComponentsV2Factory.text(
          '## EkoYıldız Yetkili Ekibi Başvuruları'
        ),

        ComponentsV2Factory.separator(false),

        // Discord Moderasyon Takımı
        ComponentsV2Factory.text(
          `• <:mod:1535976277654249562> [**[ Discord Moderasyon Takımı ]**](${formsUrl}) başvuru formu için [tıklayın](${formsUrl}).\n` +
          `  ◦ Başvuru durumu: ${BADGE_KAPALI}`
        ),

        // Oyun Moderasyon Takımı
        ComponentsV2Factory.text(
          `• 🗡️ [**[ Oyun Moderasyon Takımı ]**](${formsUrl}) başvuru formu için [tıklayın](${formsUrl}).\n` +
          `  ◦ Başvuru durumu: ${BADGE_KAPALI}`
        ),

        // Etkinlik Yetkilisi — AÇIK
        ComponentsV2Factory.text(
          `• <:etkinlik:1535976275317891194> [**[ Etkinlik Yetkilisi ]**](${eventStaffUrl}) başvuru formu için [tıklayın](${eventStaffUrl}).\n` +
          `  ◦ Başvuru durumu: ${BADGE_ACIK}`
        ),

        // Topluluk Elçiliği — AÇIK
        ComponentsV2Factory.text(
          `• 👑 [**[ Topluluk Elçisi ]**](${communityAmbassadorUrl}) başvuru formu için [tıklayın](${communityAmbassadorUrl}).\n` +
          `  ◦ Başvuru durumu: ${BADGE_ACIK}`
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
 * Ensures the recruitment panel message exists in channel 1535967551874670693.
 * Discord, bir mesajın IS_COMPONENTS_V2 flag'ini gönderildikten sonra edit ile
 * değiştirmenize izin vermez. Eski mesaj bu flag olmadan gönderilmişse (ör. eski
 * embed tabanlı panel), edit() 50035 hatasıyla patlar. Bu durumda mesajı silip
 * yeniden gönderiyoruz.
 */
async function ensureRecruitmentPanelMessage(client) {
  try {
    if (!client || !client.isReady()) {
      console.warn("[RecruitmentPanel] Client hazır değil, panel atlanıyor.");
      return;
    }

    let channel = null;

    // Önce guild üzerinden fetch et — en güvenilir yol
    try {
      const guild = await client.guilds.fetch(RECRUITMENT_GUILD_ID);
      channel = await guild.channels.fetch(RECRUITMENT_CHANNEL_ID);
    } catch (err) {
      console.warn(`[RecruitmentPanel] Guild üzerinden kanal alınamadı: ${err.message}`);
    }

    // Fallback: doğrudan client üzerinden dene
    if (!channel) {
      channel = await client.channels.fetch(RECRUITMENT_CHANNEL_ID).catch(() => null);
    }

    if (!channel) {
      console.error(`[RecruitmentPanel] Kanal bulunamadı: ${RECRUITMENT_CHANNEL_ID} (guild: ${RECRUITMENT_GUILD_ID})`);
      return;
    }

    if (!channel.isTextBased || !channel.isTextBased()) {
      console.error(`[RecruitmentPanel] Kanal metin tabanlı değil: ${RECRUITMENT_CHANNEL_ID}`);
      return;
    }

    const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    const existingMessage = messages
      ? messages.find(m =>
          m.author?.id === client.user.id &&
          (m.components?.length > 0 || m.embeds?.length > 0)
        )
      : null;

    const payload = getRecruitmentPanelPayload();

    if (existingMessage) {
      try {
        await existingMessage.edit(payload);
        console.log(`✅ [RecruitmentPanel] Panel güncellendi (#${channel.name})`);
      } catch (editErr) {
        // IS_COMPONENTS_V2 flag'i sonradan eklenemez -> eski mesajı sil, yenisini gönder
        console.warn(`[RecruitmentPanel] Edit başarısız (${editErr.message}), mesaj yeniden gönderiliyor.`);
        await existingMessage.delete().catch(() => {});
        await channel.send(payload);
        console.log(`✅ [RecruitmentPanel] Panel yeniden gönderildi (#${channel.name})`);
      }
    } else {
      await channel.send(payload);
      console.log(`✅ [RecruitmentPanel] Panel gönderildi (#${channel.name})`);
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
    if (!submission || !submission.userId) {
      console.warn("[RecruitmentPanel] sendNewApplicationLog: geçersiz submission verisi.");
      return;
    }

    // Form logları ayrı kanala gönderilir
    let channel = null;
    try {
      const guild = await client.guilds.fetch(RECRUITMENT_GUILD_ID);
      channel = await guild.channels.fetch(FORM_LOG_CHANNEL_ID);
    } catch (_) {}

    if (!channel) {
      channel = await client.channels.fetch(FORM_LOG_CHANNEL_ID).catch(() => null);
    }

    if (!channel) {
      console.error(`[RecruitmentPanel] Form log kanalı bulunamadı: ${FORM_LOG_CHANNEL_ID}`);
      return;
    }

    const username = submission.discordUsername || "Bilinmiyor";
    const submissionId = submission._id ?? "N/A";
    const formTitle = submission.formTitle || (submission.formType === 'community_ambassador' ? "Topluluk Elçisi Mülakat Başvuru Formu" : "Etkinlik Yetkilisi Başvuru Formu");
    const embedColor = submission.formType === 'community_ambassador' ? 0xf59e0b : 0x818cf8;

    const payload = {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container(embedColor, [
          ComponentsV2Factory.text(
            '## 📥 Yeni Başvuru Gönderildi!\n\n' +
            `**${username}** (\`${submission.userId}\`) adlı kullanıcı **${formTitle}** belgesini doldurdu.\n\n` +
            `📋 **Form:** ${formTitle}\n` +
            `👤 **Başvuran:** <@${submission.userId}>\n` +
            `🆔 **Başvuru ID:** \`${submissionId}\``
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