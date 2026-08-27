const cron = require("node-cron");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { chatWithAI } = require("./aiService");
const { getSpecialDayInfo } = require("./specialDaysHelper");
const { getHistoricalFallbackEvent } = require("./historyDataset");

const TARGET_CHANNEL_ID = process.env.EKO_YILDIZ_HISTORY_CHANNEL_ID || "1518692463177498674";

// Günlük paylaşım takip durumu (YYYY-MM-DD)
let lastPostedDateTR = null;
let isPostingInProgress = false;

/**
 * Türkiye (Europe/Istanbul) saat dilimine göre güncel tarih bilgilerini döner.
 */
function getTurkeyTimeInfo() {
  const now = new Date();
  const trDateStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }); // "YYYY-MM-DD"
  const trHour = parseInt(now.toLocaleTimeString("en-GB", { timeZone: "Europe/Istanbul", hour12: false, hour: "2-digit" }), 10);
  
  // TR saat dilimindeki gün ve ay bilgisi
  const dayStr = now.toLocaleDateString("en-US", { timeZone: "Europe/Istanbul", day: "numeric" });
  const monthStr = now.toLocaleDateString("en-US", { timeZone: "Europe/Istanbul", month: "numeric" });
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  return { now, trDateStr, trHour, day, month };
}

/**
 * Kanalda bugüne ait bir "Tarihte Bugün" mesajı zaten atılmış mı kontrol eder.
 * @param {import('discord.js').TextChannel} channel
 * @param {string} dateHeaderStr - Örn: "27 Ağustos"
 * @returns {Promise<boolean>}
 */
async function hasAlreadyPostedToday(channel, dateHeaderStr) {
  try {
    if (!channel || !channel.isTextBased()) return false;
    const messages = await channel.messages.fetch({ limit: 15 }).catch(() => null);
    if (!messages) return false;

    const todayEmbed = messages.find(m => {
      if (!m.embeds || m.embeds.length === 0) return false;
      const title = m.embeds[0]?.title || "";
      return title.includes("Tarihte Bugün") && title.includes(dateHeaderStr);
    });

    return !!todayEmbed;
  } catch (err) {
    console.warn("⚠️ [EkoYildizHistoryAI] Mesaj geçmişi kontrol hatası:", err.message);
    return false;
  }
}

/**
 * Günlük kontrolü yapar ve gerekiyorsa otomatik paylaşır.
 * @param {import('discord.js').Client} client
 */
async function checkAndCatchUpEkoYildizHistory(client) {
  if (isPostingInProgress) return;

  const { trDateStr, trHour, day, month } = getTurkeyTimeInfo();
  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const dateHeaderStr = `${day} ${months[month]}`;

  // Hafızada zaten bugün paylaşıldığı kayıtlıysa geç
  if (lastPostedDateTR === trDateStr) {
    return;
  }

  // Sabah 09:00 veya sonrasıysa kontrol et
  if (trHour >= 9) {
    try {
      const channel = await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);
      if (channel && channel.isTextBased()) {
        const alreadySent = await hasAlreadyPostedToday(channel, dateHeaderStr);
        if (alreadySent) {
          lastPostedDateTR = trDateStr;
          console.log(`ℹ️ [EkoYildizHistoryAI] ${dateHeaderStr} Tarihte Bugün mesajı kanalda zaten mevcut, tekrar atılmadı.`);
          return;
        }

        console.log(`🕒 [EkoYildizHistoryAI] ${dateHeaderStr} için Tarihte Bugün paylaşımı başlatılıyor...`);
        isPostingInProgress = true;
        const success = await postEkoYildizHistory(client);
        if (success) {
          lastPostedDateTR = trDateStr;
        }
      }
    } catch (err) {
      console.error("❌ [EkoYildizHistoryAI] Catch-up kontrol hatası:", err);
    } finally {
      isPostingInProgress = false;
    }
  }
}

/**
 * Her gün sabah 09:00'da (TR Saati) tarih ve özel gün paylaşımı yapar.
 * Ayrıca bot başladığında ve 15 dakikada bir otomatik kontrol yaparak gün kaçırılmasını engeller.
 * @param {import('discord.js').Client} client
 */
function startEkoYildizHistoryScheduler(client) {
  // 1. Cron: Her gün 09:00 Europe/Istanbul
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("🕒 [EkoYildizHistoryAI] 09:00 TR Zamanlanmış görevi tetiklendi...");
      await checkAndCatchUpEkoYildizHistory(client);
    } catch (err) {
      console.error("❌ [EkoYildizHistoryAI] Cron hatası:", err);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  // 2. Periyodik Kontrol: Her 15 dakikada bir kontrol et (Kaçan gün/saatleri telafi etmek için)
  cron.schedule("*/15 * * * *", async () => {
    try {
      await checkAndCatchUpEkoYildizHistory(client);
    } catch (err) {
      console.error("❌ [EkoYildizHistoryAI] 15dk telafi kontrol hatası:", err.message);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  // 3. Bot hazır olduğunda 5 sn sonra telafi kontrolü yap
  setTimeout(() => {
    checkAndCatchUpEkoYildizHistory(client).catch(err => {
      console.error("❌ [EkoYildizHistoryAI] Başlangıç kontrol hatası:", err.message);
    });
  }, 5000);

  console.log("✅ [EkoYildizHistoryAI] 7/24 Kesintisiz Tarihte Bugün Zamanlayıcısı (Europe/Istanbul) Aktif.");
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
      return false;
    }

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
    const isFirstDayOfMonth = (day === 1 && !specialDay);

    let embedTitle = `📅 Tarihte Bugün – ${dateStr}`;
    let embedColor = 0xdc143c; // Kırmızı (Photo 2 standardı)
    let specialField = null;

    const systemPrompt = `Sen Türk ve Dünya tarihini derinlemesine bilen, Atatürk ilkelerine ve Cumhuriyet değerlerine tutkuyla bağlı, samimi ve sürükleyici bir üslupla konuşan uzman bir baş tarih araştırmacısı ve anlatıcısısın.
Görevin: İstenen tarihte (${dateStr}) gerçekleşmiş tarihi olayları derinlemesine, edebi, akıcı, merak uyandırıcı ve zengin bir Türkçe ile çok kapsamlı aktarmak.

İÇERİK YAPISI:
1. GİRİŞ & ATATÜRK KÖŞESİ (Gazi Mustafa Kemal Atatürk'ün bu tarihteki veya o dönemin bu günlerindeki askeri, siyasi, stratejik ve devrimci liderliği, vizyonu ve tarihi adımları).
2. TÜRK VE DÜNYA TARİHİNDE BÜYÜK DÖNÜM NOKTALARI (Fetihler, savaşlar, antlaşmalar, devrimler, imparatorluklar ve uluslararası kritik gelişmeler).
3. BİLİM, UZAY, KÜLTÜR VE SANAT (İcatlar, uzay keşifleri, edebiyat ve mimarlık şaheserleri).
4. İLGİNÇ TARİHİ TRIVIA & BİLİNMEYEN GERÇEKLER (Az bilinen, şaşırtıcı ve düşündürücü tarihi anekdot).
5. GÜNÜN TARİHİ SÖZÜ & VECİZESİ (Günün ruhunu yansıtan ilham verici tarihi bir söz).

KURALLAR:
- Samimi, saygılı ve arkadaş canlısı bir hitapla başla.
- Bilgiler tarihi gerçeklere tam uygun, detaylı ve doyurucu olsun.
- Sadece Türkçe metin üret.`;

    let userPrompt = "";

    if (specialDay) {
      embedTitle = `${specialDay.emoji} ${specialDay.name} – ${dateStr}`;
      embedColor = specialDay.color || 0xdc143c;

      specialField = {
        name: `📌 ${specialDay.emoji} Günün Anlam ve Önemi`,
        value: `${specialDay.desc}\n> *"${specialDay.quote}"*`
      };

      userPrompt = `Bugün ${specialDay.name} (${dateStr}). Bu özel milli günün derin tarihsel anlam ve önemini, Gazi Mustafa Kemal Atatürk'ün eşsiz liderliğini, ${dateStr} tarihinde gerçekleşmiş Türk ve dünya tarihindeki diğer büyük dönüm noktalarını, bilim/sanat gelişmelerini, ilginç bir tarihi anekdotu ve günün tarihi sözünü kapsayan çok zengin, detaylı ve uzun bir anlatım oluştur.`;
    } else if (isFirstDayOfMonth) {
      embedTitle = `🌟 YENİ AYA MERHABA! – 1 ${months[month]}`;
      embedColor = 0xdc143c;
      userPrompt = `Tarih: 1 ${months[month]} (Ayın ilk günü).
Lütfen hem bu yeni aya merhaba diyerek bu ay boyunca bizi bekleyen büyük Türk ve dünya tarihi temalarını özetle, hem de 1 ${months[month]} tarihinde Gazi Mustafa Kemal Atatürk, Türk tarihi zaferleri, bilimsel keşifler ve ilginç tarihi anekdotları kapsayan çok zengin ve uzun bir Tarihte Bugün anlatımı oluştur.`;
    } else {
      userPrompt = `Tarih: ${dateStr}.
Lütfen ${dateStr} tarihi için:
1) Gazi Mustafa Kemal Atatürk ve Kurtuluş/Cumhuriyet tarihimizden çok detaylı bir anlatım (Dün ${yesterdayStr}'taki tarihi bağlam ile),
2) Türk ve Dünya tarihindeki diğer büyük tarihi zaferler, antlaşmalar veya kırılma anları,
3) Bilim, teknoloji, uzay veya sanat dünyasından tarihte bugün yaşanan önemli bir keşif/gelişme,
4) İlginç, şaşırtıcı bir tarihi trivia/anekdot,
5) Günün tarihi sözünü içeren çok kapsamlı, akıcı, zengin ve uzun bir Tarihte Bugün metni hazırla.`;
    }

    let aiContent = "";
    try {
      aiContent = await chatWithAI([{ role: 'user', content: userPrompt }], systemPrompt, 'ticket', { max_tokens: 1000, temperature: 0.65 });
      if (!aiContent || aiContent.trim().length < 120) {
        throw new Error("AI yanıtı yetersiz veya çok kısa");
      }
    } catch (aiErr) {
      console.warn("⚠️ [EkoYildizHistoryAI] AI isteği başarısız veya yetersiz, zengin tarih veritabanı kullanılıyor:", aiErr.message);
      if (specialDay) {
        aiContent = `Bugün ${specialDay.name}! ${specialDay.desc}\n\n${dateStr} tarihinde milletimizin bağımsızlığı ve istikbali için canlarını feda eden tüm kahramanlarımızı, başta Gazi Mustafa Kemal Atatürk olmak üzere sonsuz minnet ve saygıyla anıyoruz.\n\n` + getHistoricalFallbackEvent(day, month);
      } else if (isFirstDayOfMonth) {
        const monthHistory = getHistoricalFallbackEvent(day, month);
        aiContent = `🌟 YENİ AYA MERHABA!\nBu ay Tarihte Bugün EkoYıldız'da dünya ve Türk tarihinin en önemli dönüm noktalarını, büyük zaferleri ve bilimsel sıçrayışları göreceksiniz.\n\n📅 Bugünün Tarihte Bugünü:\n${monthHistory}`;
      } else {
        aiContent = getHistoricalFallbackEvent(day, month);
      }
    }

    if (aiContent && aiContent.length > 4000) {
      aiContent = aiContent.substring(0, 3990) + "\n\n*(Devamı kesildi...)*";
    }

    const botAvatar = client.user ? client.user.displayAvatarURL() : undefined;

    const embed = new EmbedBuilder()
      .setTitle(embedTitle)
      .setDescription(aiContent)
      .setColor(embedColor)
      .setFooter({ text: "EkoYıldız Genişletilmiş Tarih & Kültür Sistemi • Gazi Mustafa Kemal Atatürk'ün İzinde", iconURL: botAvatar })
      .setTimestamp();

    if (specialField) {
      embed.addFields(specialField);
    }

    const historyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tb_detail_ataturk_${day}_${month}`)
        .setLabel("🏛️ Atatürk & Zaferler")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`tb_detail_science_${day}_${month}`)
        .setLabel("🔬 Bilim & Keşifler")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`tb_detail_trivia_${day}_${month}`)
        .setLabel("💡 Tarihi Trivia")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`tb_random_quote_${day}_${month}`)
        .setLabel("📜 Tarihi Vecize")
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ embeds: [embed], components: [historyRow] });
    console.log(`✅ [EkoYildizHistoryAI] ${embedTitle} mesajı başarıyla gönderildi.`);

    // 2. Özel günlerde duyuru/genel kanalına bildirim mesajı gönder (1518692466860101915)
    if (specialDay) {
      const NOTIFICATION_CHANNEL_ID = process.env.EKO_YILDIZ_ANNOUNCE_CHANNEL_ID || "1518692466860101915";
      try {
        const notifyChannel = await client.channels.fetch(NOTIFICATION_CHANNEL_ID).catch(() => null);
        if (notifyChannel && notifyChannel.isTextBased()) {
          const notifyText = `:information_source: **${specialDay.name} gününüzü sevgi ve sağlıcakla kutlarız, https://discord.com/channels/1367646464804655104/1518692463177498674 kanalına bugüne özel yeni bir tarihte bugün atıldı. Komutlar ve bazı yazılar bu güne olarak düzenlendi.**`;
          await notifyChannel.send(notifyText);
          console.log(`📢 [EkoYildizHistoryAI] ${specialDay.name} özel gün duyurusu ${NOTIFICATION_CHANNEL_ID} kanalına iletildi.`);
        }
      } catch (notifyErr) {
        console.warn("⚠️ [EkoYildizHistoryAI] Özel gün duyuru mesajı gönderilemedi:", notifyErr.message);
      }
    }

    return true;
  } catch (error) {
    console.error("❌ [EkoYildizHistoryAI] Mesaj gönderim hatası:", error);
    return false;
  }
}

module.exports = {
  startEkoYildizHistoryScheduler,
  postEkoYildizHistory,
  checkAndCatchUpEkoYildizHistory
};
