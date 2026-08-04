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
        `Merhaba **${user.username}**!\n\n` +
        `Hesabınızın son 24 saat içinde oluşturulduğunu ve **${guild.name}** sunucumuza katıldığını tespit ettik.\n\n` +
        `Sunucu güvenliğini ve düzenini korumak amacıyla, yeni üyelerimizin kısa bir güvenlik anketini doldurmalarını rica ediyoruz.\n\n` +
        `> 📝 **Ankete başlamak için aşağıdaki butona tıklayın.**\n` +
        `> Yanıtlarınız yetkililerimizce en kısa sürede incelenecektir.`
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
      question: "📝 **Soru 1/9:** Discord kullanıcı adınız nedir?\n\n*Aşağıdaki butona tıklayarak mevcut adınızı otomatik doldurabilir veya farklı bir isim/Roblox adı yazabilirsiniz.*",
      type: "text",
      placeholder: "İsim veya kullanıcı adı yazın...",
      quickReplies: [
        { label: "👤 Mevcut Kullanıcı Adımı Kullan", value: "currentuser" }
      ],
      nextStep: "2"
    },
    "2": {
      question: "📝 **Soru 2/9:** Sunucumuza nasıl ulaştınız?\n\n*Lütfen aşağıdaki açılır menüden size en uygun seçeneği seçin.*",
      type: "select",
      placeholder: "Bir seçenek seçiniz...",
      options: [
        { label: "🔗 Davet Linki", value: "Davet Linki" },
        { label: "👥 Arkadaş Tavsiyesi", value: "Arkadaş Tavsiyesi" },
        { label: "📱 Sosyal Medya", value: "Sosyal Medya" },
        { label: "🔍 İnternet / Arama", value: "İnternet / Arama" },
        { label: "📝 Diğer", value: "Diğer" }
      ],
      nextStep: "3"
    },
    "3": {
      question: "📝 **Soru 3/9:** Sunucuya katılma amacınız nedir?\n\n*Aşağıdaki hızlı cevap butonlarını kullanabilir veya kendi yanıtınızı yazabilirsiniz.*",
      type: "text",
      placeholder: "Oyun oynamak, sohbet etmek vb...",
      quickReplies: [
        { label: "🎮 Oyun & Sohbet", value: "Oyun oynamak ve sohbet etmek" },
        { label: "👥 Topluluk & Sosyal", value: "Topluluğa katılmak" }
      ],
      nextStep: "4"
    },
    "4": {
      question: "📝 **Soru 4/9:** Daha önce bu sunucuda bulundunuz mu?",
      type: "buttons",
      options: [
        { label: "Evet, bulundum", value: "yes", style: ButtonStyle.Danger },
        { label: "Hayır, ilk defa geliyorum", value: "no", style: ButtonStyle.Success }
      ],
      nextStep: "5"
    },
    "5": {
      question: "📝 **Soru 5/9:** Herhangi bir alternatif (alt) hesabınız var mı?",
      type: "buttons",
      options: [
        { label: "Evet, var", value: "yes", style: ButtonStyle.Danger },
        { label: "Hayır, yok", value: "no", style: ButtonStyle.Success }
      ],
      nextStep: "6"
    },
    "6": {
      question: "📝 **Soru 6/9:** Kuralları okudunuz ve kabul ediyor musunuz?",
      type: "buttons",
      options: [
        { label: "Kabul Ediyorum", value: "yes", style: ButtonStyle.Success },
        { label: "Kabul Etmiyorum", value: "no", style: ButtonStyle.Danger }
      ],
      nextStep: "7"
    },
    "7": {
      question: "📝 **Soru 7/9:** Eklemek istediğiniz bir şey var mı? (İsteğe bağlı)\n\n*Aşağıdaki butona basarak bu adımı geçebilirsiniz.*",
      type: "text",
      placeholder: "Eklemek istediğiniz bir şey varsa yazın...",
      optional: true,
      nextStep: "8"
    },
    "8": {
      question: "📝 **Soru 8/9:** Hesabınızı neden yeni oluşturdunuz? (İsteğe bağlı)\n\n*Aşağıdaki butona basarak bu adımı geçebilirsiniz.*",
      type: "text",
      placeholder: "Örnek: Eski hesabıma erişemiyorum...",
      optional: true,
      nextStep: "9"
    },
    "9": {
      question: "📝 **Soru 9/9:** Mikrofonunuz var mı?",
      type: "buttons",
      options: [
        { label: "Evet, var", value: "yes", style: ButtonStyle.Success },
        { label: "Hayır, yok", value: "no", style: ButtonStyle.Secondary }
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
      .setTitle("✅ Doğrulama Anketi Tamamlandı")
      .setDescription(
        `Teşekkürler! Güvenlik anketiniz başarıyla sisteme iletildi.\n\n` +
        `**Sonraki Adımlar:**\n` +
        `• Yanıtlarınız yetkililerimiz tarafından incelenmektedir.\n` +
        `• Şüpheli bir durum görülmediğinde hesabınız otomatik olarak onaylanacaktır.\n` +
        `• Gerekli görülürse bir yetkili bu DM üzerinden sizinle iletişime geçebilir.\n\n` +
        `_Lütfen bu süreçte sabırlı olun ve DM kutunuzu açık tutun._`
      )
      .setFooter({ text: `${guild ? guild.name : "Güvenlik"} • Güvenlik Sistemi` })
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
