const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");
const { chatWithAI } = require("./aiService");

const TARGET_CHANNEL_IDS = [process.env.TMT_HISTORY_CHANNEL_ID || "1514583020680777760"];

/**
 * Her gün sabah 09:00'da Atatürk ile ilgili tarihi bilgi atar.
 * @param {import('discord.js').Client} client
 */
function startAtaturkHistoryScheduler(client) {
  // Her gün sabah saat 09:00'da çalışır
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
 * Manuel test etmek için dışarıya da açıldı.
 * @param {import('discord.js').Client} client
 */
async function postAtaturkHistory(client) {
  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dateStr = `${day} ${months[month]}`;

    let title = `📅 Tarihte Bugün - ${dateStr}`;
    let embedColor = 0xdc143c; // Normal kırmızı
    const systemPrompt = `Sen Türk Kurtuluş Savaşı ve Mustafa Kemal Atatürk tarihi konusunda uzman, saygın bir tarihçisin.
Görevin: İstenen tarihte gerçekleşmiş önemli tarihi gelişmeyi doğru, akıcı ve saygılı bir Türkçe ile aktarmak.
Kesin Kurallar:
- Yanıtın SADECE Türkçe olmalıdır.
- Giriş/selamlama yapma, başlık atma, kural veya prompt tekrarı yapma, İngilizce metin yazma.
- Doğrudan tarihi olayın anlatımına başla.`;

    let userPrompt = `Tarih: ${dateStr}.
Mustafa Kemal Atatürk'ün hayatında ve Türk tarihinde ${dateStr} günü (veya bu haftalarda) gerçekleşen önemli bir olayı 1-2 paragraf halinde anlat. Yıl bilgisini metin içinde açıkça belirt (örn. 1922'de).`;

    // Özel gün kontrolleri
    let isSpecialDay = false;
    let specialDayName = "";
    let isMourning = false; // 10 Kasım hüzün günü mü?

    if (month === 9 && day === 29) {
      isSpecialDay = true;
      specialDayName = "29 Ekim Cumhuriyet Bayramı";
    } else if (month === 4 && day === 19) {
      isSpecialDay = true;
      specialDayName = "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı";
    } else if (month === 3 && day === 23) {
      isSpecialDay = true;
      specialDayName = "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı";
    } else if (month === 7 && day === 30) {
      isSpecialDay = true;
      specialDayName = "30 Ağustos Zafer Bayramı";
    } else if (month === 10 && day === 10) {
      isSpecialDay = true;
      isMourning = true;
      specialDayName = "10 Kasım Atatürk'ü Anma Günü";
    }

    if (isSpecialDay) {
      if (isMourning) {
        title = `🖤 ÖNEMLİ GÜN! - ${specialDayName} - ${dateStr}`;
        embedColor = 0x2c3e50; // Koyu Gri / Siyah tonu
        userPrompt = `Bugün ${specialDayName}. Ulu Önder Mustafa Kemal Atatürk'ün vefatının yıl dönümünde onun mirasını ve hatırasını 1-2 paragraf halinde derinden anlat.`;
      } else {
        title = `🇹🇷 ÖNEMLİ GÜN! - ${specialDayName} - ${dateStr}`;
        embedColor = 0xff0000; // Canlı Kırmızı (Bayrak Kırmızısı)
        userPrompt = `Bugün ${specialDayName}! Atatürk'ün bu büyük gündeki rolünü ve bu bayramın anlam ve önemini coşkulu ve gururlu bir dille 1-2 paragraf halinde anlat.`;
      }
    }

    let aiContent = "";
    try {
      aiContent = await chatWithAI([{ role: 'user', content: userPrompt }], systemPrompt, 'ticket', { max_tokens: 1200, temperature: 0.6 });
    } catch (aiErr) {
      console.error("❌ [AtaturkHistoryAI] AI isteği başarısız:", aiErr.message);
      if (isSpecialDay) {
        if (isMourning) {
          aiContent = `Bugün ${specialDayName}. Ulu Önderimiz Mustafa Kemal Atatürk'ü vefatının yıl dönümünde sonsuz sevgi, saygı, minnet ve özlemle anıyoruz. Fikirleri ve devrimleri her zaman yolumuzu aydınlatmaya devam edecek.`;
        } else {
          aiContent = `Bugün ${specialDayName}! Başta Ulu Önderimiz Mustafa Kemal Atatürk olmak üzere, bu vatanı bizlere armağan eden tüm kahramanlarımızı saygı, minnet ve coşkuyla anıyoruz. Bayramımız kutlu olsun!`;
        }
      } else {
        aiContent = `${dateStr} gününde Atatürk'ün tarihimize kattığı eşsiz değerleri saygıyla anıyoruz. (Yapay zeka servisinde anlık bir sorun oluştu)`;
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

        await channel.send({ embeds: [embed] }).catch(() => {});
        console.log(`✅ [AtaturkHistoryAI] ${dateStr} mesajı ${channelId} kanalına başarıyla gönderildi.`);
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
