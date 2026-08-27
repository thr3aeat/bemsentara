const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");
const { chatWithAI } = require("./aiService");
const { getSpecialDayInfo } = require("./specialDaysHelper");
const { getHistoricalFallbackEvent } = require("./historyDataset");

const TARGET_CHANNEL_IDS = [process.env.TMT_HISTORY_CHANNEL_ID || "1514583020680777760"];

let lastPostedDateTR = null;
let isPostingInProgress = false;

function getTurkeyTimeInfo() {
  const now = new Date();
  const trDateStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }); // "YYYY-MM-DD"
  const trHour = parseInt(now.toLocaleTimeString("en-GB", { timeZone: "Europe/Istanbul", hour12: false, hour: "2-digit" }), 10);
  
  const dayStr = now.toLocaleDateString("en-US", { timeZone: "Europe/Istanbul", day: "numeric" });
  const monthStr = now.toLocaleDateString("en-US", { timeZone: "Europe/Istanbul", month: "numeric" });
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  return { now, trDateStr, trHour, day, month };
}

async function checkAndCatchUpAtaturkHistory(client) {
  if (isPostingInProgress) return;

  const { trDateStr, trHour } = getTurkeyTimeInfo();
  if (lastPostedDateTR === trDateStr) return;

  if (trHour >= 9) {
    try {
      isPostingInProgress = true;
      const success = await postAtaturkHistory(client);
      if (success) {
        lastPostedDateTR = trDateStr;
      }
    } catch (err) {
      console.error("❌ [AtaturkHistoryAI] Catch-up hatası:", err.message);
    } finally {
      isPostingInProgress = false;
    }
  }
}

/**
 * Her gün sabah 09:00'da (TR Saati) Atatürk ve Türk tarihi özel gün paylaşımı yapar.
 * @param {import('discord.js').Client} client
 */
function startAtaturkHistoryScheduler(client) {
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("🕒 [AtaturkHistoryAI] 09:00 TR Zamanlanmış görevi tetiklendi...");
      await checkAndCatchUpAtaturkHistory(client);
    } catch (err) {
      console.error("❌ [AtaturkHistoryAI] Cron hatası:", err);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  cron.schedule("*/20 * * * *", async () => {
    try {
      await checkAndCatchUpAtaturkHistory(client);
    } catch (err) {
      console.error("❌ [AtaturkHistoryAI] Periyodik kontrol hatası:", err.message);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  setTimeout(() => {
    checkAndCatchUpAtaturkHistory(client).catch(() => {});
  }, 10000);

  console.log("✅ [AtaturkHistoryAI] 7/24 Kesintisiz Tarihte Bugün Zamanlayıcısı Aktif.");
}

/**
 * AI'dan bilgi alıp kanala gönderir.
 * @param {import('discord.js').Client} client
 * @param {Date} [customDate] - İsteğe bağlı özel tarih (test için)
 */
async function postAtaturkHistory(client, customDate = null) {
  try {
    const { day, month, now } = customDate ? {
      day: customDate.getDate(),
      month: customDate.getMonth(),
      now: customDate
    } : getTurkeyTimeInfo();

    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dateStr = `${day} ${months[month]}`;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDay = yesterday.getDate();
    const yesterdayMonth = months[yesterday.getMonth()];
    const yesterdayStr = `${yesterdayDay} ${yesterdayMonth}`;

    // 1. Özel Gün / Bayram Kontrolü
    const specialDay = getSpecialDayInfo(now);

    let title = `📅 Tarihte Bugün – ${dateStr}`;
    let embedColor = 0xdc143c; // Normal kırmızı
    let specialField = null;

    const systemPrompt = `Sen her gün düzenli olarak Tarihte Bugün mesajları paylaşan; tarihi büyük bir tutku, samimiyet ve arkadaş canlısı bir dille aktaran sevilen bir tarih anlatıcısısın.
Görevin: İstenen tarihte (${dateStr}) gerçekleşmiş tarihi olayları (özellikle Gazi Mustafa Kemal Atatürk ve varsa diğer büyük tarihi olayları) sanki her gün arkadaşlarına bizzat kendin yazıyormuş gibi sıcak, samimi, akıcı ve sürükleyici bir Türkçe ile tam 2 detaylı paragraf halinde aktarmak.

KESİN ÇIKTI VE ANLATIM KURALLARI:
1. Yanıtın SADECE ve DOĞRUDAN yayınlanacak 2 Türkçe paragraftan oluşmalıdır.
2. 1. PARAGRAFIN BAŞLANGICI: Samimi ve sıcak bir hitapla başla (Örn: "Evet sevgili dostlar, geldik ${dateStr}'a! Dün ${yesterdayStr}'ta bahsettiğimiz gibi...", "Evet arkadaşlar, takvimler ${dateStr}'ı gösteriyor! Dün konuştuğumuz hazırlıkların ardından bugün...").
3. 1. PARAGRAF (Mustafa Kemal Atatürk): Atatürk'ün ${dateStr} tarihinde (veya o dönemin bu günlerinde) üstlendiği askeri, siyasi ve devrimci liderliğini, vizyonunu ve kararlarını zengin, akıcı ve canlı bir dille anlat.
4. 2. PARAGRAF (Büyük Tarihi Olay / Tarihsel Derinlik & Samimi Kapanış): Bu tarihte gerçekleşen başka büyük bir tarihi olay varsa ondan bahset; yoksa Atatürk'ün bu tarihi adımının milletimiz ve cumhuriyetimiz üzerindeki mirasını anlat ve sıcak bir kapanış yap.
5. İki paragrafı çift satır boşluğu (\\n\\n) ile ayır.
6. Başlık, markdown başlığı (## vb.), madde işareti, emoji listesi, düşünce süreci YAZMA. Doğrudan 1. paragrafın samimi açılış cümlesiyle başla.`;

    let userPrompt = "";

    if (specialDay) {
      title = `${specialDay.emoji} ${specialDay.name} – ${dateStr}`;
      embedColor = specialDay.color || 0xdc143c;

      specialField = {
        name: `📌 ${specialDay.emoji} Günün Anlam ve Önemi`,
        value: `${specialDay.desc}\n> *"${specialDay.quote}"*`
      };

      if (specialDay.isMourning) {
        userPrompt = `Bugün ${specialDay.name} (${dateStr}). Ulu Önderimiz Gazi Mustafa Kemal Atatürk'ün ebediyete intikalinin yıl dönümünde onun mirasını, fikirlerini ve hatırasını samimi, derin ve saygılı 2 paragraf halinde anlat. Sadece Türkçe yaz.`;
      } else {
        userPrompt = `Bugün ${specialDay.name} (${dateStr})! Atatürk'ün bu büyük gündeki rolünü, Türk tarihindeki dönüm noktasını ve ${dateStr} tarihinde gerçekleşen önemli tarihi olayları samimi, gururlu ve arkadaş canlısı bir dille 2 detaylı paragraf halinde anlat. Sadece Türkçe yaz.`;
      }
    } else {
      userPrompt = `Tarih: ${dateStr}.
Lütfen ${dateStr} tarihi için Gazi Mustafa Kemal Atatürk'ün hayatındaki önemli bir olayı ve ayrıca tarihte bu gün yaşanmış çok büyük bir tarihi gelişmeyi "Dün ${yesterdayStr}'ta..." bağı kurarak, yukarıdaki samimi kurallara tam uyarak 2 zengin paragraf halinde anlat. Sadece Türkçe metin üret.`;
    }

    let aiContent = "";
    try {
      aiContent = await chatWithAI([{ role: 'user', content: userPrompt }], systemPrompt, 'ticket', { max_tokens: 1000, temperature: 0.6 });
      if (!aiContent || aiContent.trim().length < 80) {
        throw new Error("AI yanıtı yetersiz veya çok kısa");
      }
    } catch (aiErr) {
      console.warn("⚠️ [AtaturkHistoryAI] AI isteği başarısız, zengin tarih veritabanı kullanılıyor:", aiErr.message);
      if (specialDay) {
        if (specialDay.isMourning) {
          aiContent = `Bugün ${specialDay.name}. Ulu Önderimiz Mustafa Kemal Atatürk'ü vefatının yıl dönümünde sonsuz sevgi, saygı, minnet ve özlemle anıyoruz. Fikirleri ve devrimleri her zaman yolumuzu aydınlatmaya devam edecek.`;
        } else {
          aiContent = `Bugün ${specialDay.name}! ${specialDay.desc}\n\nBaşta Ulu Önderimiz Mustafa Kemal Atatürk olmak üzere, bu vatanı bizlere armağan eden tüm kahramanlarımızı saygı ve minnetle anıyoruz.`;
        }
      } else {
        aiContent = getHistoricalFallbackEvent(day, month);
      }
    }

    if (aiContent && aiContent.length > 4000) {
      aiContent = aiContent.substring(0, 3990) + "\n\n*(Devamı kesildi...)*";
    }

    const botAvatar = client.user ? client.user.displayAvatarURL() : undefined;

    for (const channelId of TARGET_CHANNEL_IDS) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel && channel.isTextBased()) {
        const isEkoYildiz = (channel.guild && channel.guild.id === "1367646464804655104") || channelId === "1518692463177498674";
        const footerText = isEkoYildiz ? "EkoYıldız Yapay Zeka Tarih Sistemi" : "TMT Yapay Zeka Tarih Sistemi";

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(aiContent)
          .setColor(embedColor)
          .setFooter({ text: footerText, iconURL: botAvatar })
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
    return true;
  } catch (error) {
    console.error("❌ [AtaturkHistoryAI] Mesaj gönderim hatası:", error);
    return false;
  }
}

module.exports = {
  startAtaturkHistoryScheduler,
  postAtaturkHistory,
  checkAndCatchUpAtaturkHistory
};
