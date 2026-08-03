/**
 * newAccountSurvey.js
 * 
 * Yeni hesaplara anket DM'i gönderir ve cevapları toplar
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");

/**
 * Kullanıcıya anket DM'i gönderir
 * @param {User} user 
 * @param {Guild} guild 
 * @returns {Promise<boolean>}
 */
async function sendSurveyDM(user, guild) {
  try {
    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle("👋 Güvenlik Doğrulaması")
      .setDescription(
        `Merhaba! Görüyorum ki hesabın son 24 saat içinde oluşturulmuş ve **${guild.name}** sunucumuza katılmışsın.\n\n` +
        `Güvenlik amacıyla senden kısa bir doğrulama anketini doldurmanı rica ediyoruz.\n\n` +
        `Lütfen aşağıdaki **"Anketi Başlat"** butonuna basarak devam et. Yetkililer en kısa sürede inceleyecektir.`
      )
      .setFooter({ text: `${guild.name} • Güvenlik Sistemi` })
      .setTimestamp();
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`survey_start_${guild.id}`)
        .setLabel("📝 Anketi Başlat")
        .setStyle(ButtonStyle.Primary)
    );
    
    await user.send({ embeds: [embed], components: [row] });
    return true;
  } catch (err) {
    console.error(`[NewAccountSurvey] DM gönderilemedi (${user.tag}):`, err.message);
    return false;
  }
}

/**
 * Anket sorularını adım adım gönderir
 * @param {User} user 
 * @param {Guild} guild 
 * @param {string} step 
 * @returns {Promise<Object>}
 */
async function sendSurveyStep(user, guild, step = "1") {
  const questions = {
    "1": {
      question: "**Soru 1/9:** Discord kullanıcı adın nedir?",
      type: "text",
      placeholder: "Örnek: Ahmet#1234",
      nextStep: "2"
    },
    "2": {
      question: "**Soru 2/9:** Sunucumuza nasıl ulaştın?",
      type: "select",
      options: [
        { label: "Davet linki", value: "invite_link" },
        { label: "Arkadaş tavsiyesi", value: "friend" },
        { label: "Sosyal medya", value: "social_media" },
        { label: "Diğer", value: "other" }
      ],
      nextStep: "3"
    },
    "3": {
      question: "**Soru 3/9:** Sunucuya katılma amacın nedir?",
      type: "text",
      placeholder: "Örnek: Oyun oynamak, sohbet etmek...",
      nextStep: "4"
    },
    "4": {
      question: "**Soru 4/9:** Daha önce bu sunucuda bulundun mu?",
      type: "buttons",
      options: [
        { label: "Evet", value: "yes", style: ButtonStyle.Danger },
        { label: "Hayır", value: "no", style: ButtonStyle.Success }
      ],
      nextStep: "5"
    },
    "5": {
      question: "**Soru 5/9:** Herhangi bir alternatif (alt) hesabın var mı?",
      type: "buttons",
      options: [
        { label: "Evet", value: "yes", style: ButtonStyle.Danger },
        { label: "Hayır", value: "no", style: ButtonStyle.Success }
      ],
      nextStep: "6"
    },
    "6": {
      question: "**Soru 6/9:** Kuralları okudun ve kabul ediyor musun?",
      type: "buttons",
      options: [
        { label: "Evet", value: "yes", style: ButtonStyle.Success },
        { label: "Hayır", value: "no", style: ButtonStyle.Danger }
      ],
      nextStep: "7"
    },
    "7": {
      question: "**Soru 7/9:** Eklemek istediğin bir şey var mı? (İsteğe bağlı)\n\n`Yoksa 'Yok' yazabilirsin.`",
      type: "text",
      placeholder: "İsteğe bağlı açıklama...",
      nextStep: "8",
      optional: true
    },
    "8": {
      question: "**Soru 8/9:** Hesabını neden yeni oluşturdun? (İsteğe bağlı)\n\n`Yoksa 'Yok' yazabilirsin.`",
      type: "text",
      placeholder: "Örnek: Eski hesabıma erişemiyorum...",
      nextStep: "9",
      optional: true
    },
    "9": {
      question: "**Soru 9/9:** Mikrofonun var mı?",
      type: "buttons",
      options: [
        { label: "Evet", value: "yes", style: ButtonStyle.Success },
        { label: "Hayır", value: "no", style: ButtonStyle.Secondary }
      ],
      nextStep: "complete"
    }
  };
  
  return questions[step] || null;
}

/**
 * Anket tamamlandı mesajı
 * @param {User} user 
 * @param {Guild} guild 
 */
async function sendSurveyCompleteMessage(user, guild) {
  try {
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle("✅ Anket Tamamlandı")
      .setDescription(
        `Teşekkürler! Anketin başarıyla tamamlandı.\n\n` +
        `Cevapların yetkililerimize iletildi. En kısa sürede incelenecek ve sana geri dönüş yapılacak.\n\n` +
        `Bu süre zarfında lütfen sabırlı ol. Şüpheli bir durum yoksa kısa sürede onaylanacaksın.`
      )
      .setFooter({ text: `${guild.name} • Güvenlik Sistemi` })
      .setTimestamp();
    
    await user.send({ embeds: [embed] });
  } catch (err) {
    console.error(`[NewAccountSurvey] Complete mesajı gönderilemedi:`, err.message);
  }
}

module.exports = {
  sendSurveyDM,
  sendSurveyStep,
  sendSurveyCompleteMessage,
};
