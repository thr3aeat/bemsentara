const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");
const { chatWithAI } = require("./aiService");
const { getSpecialDayInfo } = require("./specialDaysHelper");

const TARGET_CHANNEL_IDS = [process.env.TMT_HISTORY_CHANNEL_ID || "1514583020680777760"];

/**
 * Her gün sabah 09:00'da Atatürk ve Türk tarihi özel gün paylaşımı yapar.
 * @param {import('discord.js').Client} client
 */
function startAtaturkHistoryScheduler(client) {
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("🕒 [AtaturkHistoryAI] Günlük görev başlatılıyor...");
      await postAtaturkHistory(client);
    } catch (err) {
      console.error("❌ [AtaturkHistoryAI] Cron hatası:", err);
    }
  });
}

/**
 * AI'dan bilgi alıp kanala gönderir.
 * @param {import('discord.js').Client} client
 * @param {Date} [customDate] - İsteğe bağlı özel tarih (test için)
 */
async function postAtaturkHistory(client, customDate = null) {
  try {
    const today = customDate instanceof Date ? customDate : new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dateStr = `${day} ${months[month]}`;

    // 1. Özel Gün / Bayram Kontrolü
    const specialDay = getSpecialDayInfo(today);

    let title = `📅 Tarihte Bugün - ${dateStr}`;
    let embedColor = 0xdc143c; // Normal kırmızı
    let specialField = null;

    const systemPrompt = `Sen Türk Kurtuluş Savaşı ve Mustafa Kemal Atatürk tarihi konusunda uzman, saygın bir tarihçisin.
Görevin: İstenen tarihte gerçekleşmiş önemli tarihi gelişmeyi doğru, akıcı ve saygılı bir Türkçe ile aktarmak.

KESİN ÇIKTI KURALLARI:
1. Yanıtın SADECE ve DOĞRUDAN yayınlanacak Türkçe metinden oluşmalıdır.
2. Kesinlikle hiçbir İngilizce kelime, iç düşünce (thinking/reasoning process), taslak, kural kontrolü veya planlama adımı YAZMA.
3. Giriş/selamlama yapma, başlık atma, kural veya prompt tekrarı YAZMA.
4. Doğrudan tarihi olayın anlatımına başla.`;

    let userPrompt = "";

    if (specialDay) {
      title = `${specialDay.emoji} ${specialDay.name} - ${dateStr}`;
      embedColor = specialDay.color || 0xdc143c;

      specialField = {
        name: `📌 ${specialDay.emoji} Günün Anlam ve Önemi`,
        value: `${specialDay.desc}\n> *"${specialDay.quote}"*`
      };

      if (specialDay.isMourning) {
        userPrompt = `Bugün ${specialDay.name} (${dateStr}). Ulu Önderimiz Gazi Mustafa Kemal Atatürk'ün ebediyete intikalinin yıl dönümünde onun mirasını, fikirlerini ve hatırasını 1-2 paragraf halinde derin, saygılı ve minnet dolu bir üslupla anlat. Sadece Türkçe yaz.`;
      } else {
        userPrompt = `Bugün ${specialDay.name} (${dateStr})! Atatürk'ün bu büyük gündeki rolünü, Türk tarihindeki dönüm noktasını ve ${dateStr} tarihinde gerçekleşen önemli tarihi olayları coşkulu ve gururlu bir dille 1-2 paragraf halinde anlat. Sadece Türkçe yaz.`;
      }
    } else {
      userPrompt = `Tarih: ${dateStr}.
Mustafa Kemal Atatürk'ün hayatında ve Türk tarihinde ${dateStr} günü (veya bu haftalarda) gerçekleşen önemli bir olayı 1-2 paragraf halinde anlat. Yıl bilgisini metin içinde açıkça belirt (örn. 1922'de). Sadece Türkçe metin üret.`;
    }

    let aiContent = "";
    try {
      aiContent = await chatWithAI([{ role: 'user', content: userPrompt }], systemPrompt, 'ticket', { max_tokens: 1200, temperature: 0.6 });
    } catch (aiErr) {
      console.error("❌ [AtaturkHistoryAI] AI isteği başarısız:", aiErr.message);
      if (specialDay) {
        if (specialDay.isMourning) {
          aiContent = `Bugün ${specialDay.name}. Ulu Önderimiz Mustafa Kemal Atatürk'ü vefatının yıl dönümünde sonsuz sevgi, saygı, minnet ve özlemle anıyoruz. Fikirleri ve devrimleri her zaman yolumuzu aydınlatmaya devam edecek.`;
        } else {
          aiContent = `Bugün ${specialDay.name}! ${specialDay.desc}\n\nBaşta Ulu Önderimiz Mustafa Kemal Atatürk olmak üzere, bu vatanı bizlere armağan eden tüm kahramanlarımızı saygı ve minnetle anıyoruz.`;
        }
      } else {
        aiContent = `${dateStr} gününde Atatürk'ün tarihimize kattığı eşsiz değerleri saygıyla anıyoruz.`;
      }
    }

    for (const channelId of TARGET_CHANNEL_IDS) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel && channel.isTextBased()) {
        const isEkoYildiz = (channel.guild && channel.guild.id === "1367646464804655104") || channelId === "1518692463177498674";
        const footerText = isEkoYildiz ? "EkoYıldız Yapay Zeka Tarih Sistemi" : "TMT Yapay Zeka Tarih Sistemi";

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(aiContent)
          .setColor(embedColor)
          .setFooter({ text: footerText, iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        if (specialField) {
          embed.addFields(specialField);
        }

        await channel.send({ embeds: [embed] }).catch(() => {});
        console.log(`✅ [AtaturkHistoryAI] ${title} mesajı ${channelId} kanalına başarıyla gönderildi.`);
      } else {
        console.warn(`⚠️ [AtaturkHistoryAI] Hedef kanal bulunamadı veya metin kanalı değil: ${channelId}`);
      }
    }
  } catch (error) {
    console.error("❌ [AtaturkHistoryAI] Mesaj gönderim hatası:", error);
  }
}

module.exports = {
  startAtaturkHistoryScheduler,
  postAtaturkHistory
};
