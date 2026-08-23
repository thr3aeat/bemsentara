const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");
const { chatWithAI } = require("./aiService");
const { getSpecialDayInfo } = require("./specialDaysHelper");
const { getHistoricalFallbackEvent } = require("./historyDataset");

const TARGET_CHANNEL_ID = process.env.EKO_YILDIZ_HISTORY_CHANNEL_ID || "1518692463177498674";

/**
 * Her gün sabah 09:00'da tarih ve özel gün paylaşımı yapar.
 * @param {import('discord.js').Client} client
 */
function startEkoYildizHistoryScheduler(client) {
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("🕒 [EkoYildizHistoryAI] Günlük görev başlatılıyor...");
      await postEkoYildizHistory(client);
    } catch (err) {
      console.error("❌ [EkoYildizHistoryAI] Cron hatası:", err);
    }
  });
}

/**
 * AI'dan bilgi alıp kanala gönderir.
 * @param {import('discord.js').Client} client
 * @param {Date} [customDate] - İsteğe bağlı özel tarih (test için)
 */
async function postEkoYildizHistory(client, customDate = null) {
  try {
    const channel = await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      console.warn("⚠️ [EkoYildizHistoryAI] Hedef kanal bulunamadı veya metin kanalı değil:", TARGET_CHANNEL_ID);
      return;
    }

    const today = customDate instanceof Date ? customDate : new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dateStr = `${day} ${months[month]}`;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDay = yesterday.getDate();
    const yesterdayMonth = months[yesterday.getMonth()];
    const yesterdayStr = `${yesterdayDay} ${yesterdayMonth}`;

    // 1. Özel Gün / Bayram Kontrolü
    const specialDay = getSpecialDayInfo(today);
    const isFirstDayOfMonth = (day === 1 && !specialDay);

    let embedTitle = `📅 Tarihte Bugün – ${dateStr}`;
    let embedColor = 0xdc143c; // Kırmızı (Photo 2 standardı)
    let specialField = null;

    const systemPrompt = `Sen EkoYıldız Discord sunucusunda her gün düzenli olarak Tarihte Bugün mesajları paylaşan; tarihi büyük bir tutku, samimiyet ve arkadaş canlısı bir dille aktaran sevilen bir tarih anlatıcısısın.
Görevin: İstenen tarihte (${dateStr}) gerçekleşmiş tarihi olayları (özellikle Mustafa Kemal Atatürk ve varsa diğer büyük tarihi olayları) sanki her gün arkadaşlarına bizzat kendin yazıyormuş gibi sıcak, samimi, akıcı ve sürükleyici bir Türkçe ile tam 2 detaylı paragraf halinde aktarmak.

KESİN ÇIKTI VE ANLATIM KURALLARI:
1. Yanıtın SADECE ve DOĞRUDAN yayınlanacak 2 Türkçe paragraftan oluşmalıdır.
2. 1. PARAGRAFIN BAŞLANGICI: Samimi ve sıcak bir hitapla başla (Örn: "Evet sevgili EkoYıldız ailesi, geldik ${dateStr}'a! Dün ${yesterdayStr}'ta bahsettiğimiz gibi / yaşanan gelişmelerin ardından bugün...", "Evet arkadaşlar, takvimler ${dateStr}'ı gösteriyor! Dün konuştuğumuz hazırlıkların ardından bugün...").
3. 1. PARAGRAF (Mustafa Kemal Atatürk): Atatürk'ün ${dateStr} tarihinde (veya o dönemin bu günlerinde) üstlendiği askeri, siyasi ve devrimci liderliğini, vizyonunu ve kararlarını zengin, akıcı ve canlı bir dille anlat.
4. 2. PARAGRAF (Büyük Tarihi Olay / Tarihsel Derinlik & Samimi Kapanış): Bu tarihte gerçekleşen başka büyük bir tarihi olay varsa (büyük zaferler, fetihler, antlaşmalar, devrimler) ondan bahset; yoksa Atatürk'ün bu tarihi adımının milletimiz ve cumhuriyetimiz üzerindeki mirasını anlat ve sıcak bir kapanış yap (Örn: "...İşte bağımsızlık ruhu tam da böyle günlerde yazıldı. Yarın tarihin bir başka heyecan dolu sayfasında buluşmak üzere!").
5. İki paragrafı çift satır boşluğu (\\n\\n) ile ayır.
6. Başlık, markdown başlığı (## vb.), madde işareti, emoji listesi, düşünce süreci YAZMA. Doğrudan 1. paragrafın samimi açılış cümlesiyle başla.`;

    let userPrompt = "";

    if (specialDay) {
      embedTitle = `${specialDay.emoji} ${specialDay.name} – ${dateStr}`;
      embedColor = specialDay.color || 0xdc143c;

      specialField = {
        name: `📌 ${specialDay.emoji} Günün Anlam ve Önemi`,
        value: `${specialDay.desc}\n> *"${specialDay.quote}"*`
      };

      if (specialDay.isMourning) {
        userPrompt = `Bugün ${specialDay.name} (${dateStr}). Ulu Önder Gazi Mustafa Kemal Atatürk'ün ebediyete intikalinin yıl dönümünde onun fikirlerini, inkılaplarını ve aziz hatırasını samimi, derin ve saygılı 2 paragraf halinde anlat. Sadece Türkçe yaz.`;
      } else {
        userPrompt = `Bugün ${specialDay.name} (${dateStr}). Bu özel günün anlam ve önemini, Gazi Mustafa Kemal Atatürk'ün rolünü ve ${dateStr} tarihinde yaşanmış büyük tarihi gelişmeleri samimi, akıcı ve arkadaş canlısı bir dille 2 detaylı paragraf halinde anlat. Sadece Türkçe yaz.`;
      }
    } else if (isFirstDayOfMonth) {
      embedTitle = `🌟 YENİ AYA MERHABA! – 1 ${months[month]}`;
      embedColor = 0xdc143c;
      userPrompt = `Tarih: 1 ${months[month]} (Ayın ilk günü). Lütfen aşağıdaki şablona tam olarak uyacak şekilde samimi ve arkadaş canlısı bir metin oluştur:

🌟 YENİ AYA MERHABA!
Evet dostlar, bu ay Tarihte Bugün EkoYıldız'da [bu ay içinde yaşanmış, Türk ve dünya tarihinden 3-4 adet dikkat çeken önemli tarihi konu başlığı/tema] konularını göreceksiniz.

📅 Bugünün Tarihte Bugünü:
[Tarihte bugün yaşanan önemli bir tarihi olay hakkında Gazi Mustafa Kemal Atatürk odaklı 2 paragraflık samimi, sürükleyici ve detaylı anlatım]

Kurallar:
- Şablondaki başlıkları (🌟 YENİ AYA MERHABA!, 📅 Bugünün Tarihte Bugünü:) aynen kullan.
- Metin doğrudan bu şablonla başlasın. Sadece Türkçe yaz.`;
    } else {
      userPrompt = `Tarih: ${dateStr}.
Lütfen ${dateStr} tarihi için Gazi Mustafa Kemal Atatürk'ün hayatındaki önemli bir olayı ve ayrıca tarihte bu gün yaşanmış çok büyük bir tarihi gelişmeyi "Dün ${yesterdayStr}'ta..." bağı kurarak, yukarıdaki samimi ve arkadaş canlısı kurallara tam uyacak şekilde 2 zengin paragraf halinde anlat. Sadece Türkçe metin üret.`;
    }

    let aiContent = "";
    try {
      aiContent = await chatWithAI([{ role: 'user', content: userPrompt }], systemPrompt, 'ticket', { max_tokens: 1200, temperature: 0.6 });
      if (!aiContent || aiContent.trim().length < 80) {
        throw new Error("AI yanıtı yetersiz veya çok kısa");
      }
    } catch (aiErr) {
      console.warn("⚠️ [EkoYildizHistoryAI] AI isteği başarısız veya yetersiz, zengin tarih veritabanı kullanılıyor:", aiErr.message);
      if (specialDay) {
        aiContent = `Bugün ${specialDay.name}! ${specialDay.desc}\n\n${dateStr} tarihinde milletimizin bağımsızlığı ve istikbali için canlarını feda eden tüm kahramanlarımızı, başta Gazi Mustafa Kemal Atatürk olmak üzere sonsuz minnet ve saygıyla anıyoruz.`;
      } else if (isFirstDayOfMonth) {
        const monthHistory = getHistoricalFallbackEvent(day, month);
        aiContent = `🌟 YENİ AYA MERHABA!\nBu ay Tarihte Bugün EkoYıldız'da dünya ve Türk tarihinin en önemli dönüm noktalarını göreceksiniz.\n\n📅 Bugünün Tarihte Bugünü:\n${monthHistory}`;
      } else {
        aiContent = getHistoricalFallbackEvent(day, month);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(embedTitle)
      .setDescription(aiContent)
      .setColor(embedColor)
      .setFooter({ text: "EkoYıldız Yapay Zeka Tarih Sistemi", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    if (specialField) {
      embed.addFields(specialField);
    }

    await channel.send({ embeds: [embed] });
    console.log(`✅ [EkoYildizHistoryAI] ${embedTitle} mesajı başarıyla gönderildi.`);
    return true;
  } catch (error) {
    console.error("❌ [EkoYildizHistoryAI] Mesaj gönderim hatası:", error);
    return false;
  }
}

module.exports = {
  startEkoYildizHistoryScheduler,
  postEkoYildizHistory
};
