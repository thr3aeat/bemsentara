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
 */
async function checkAndCatchUpEkoYildizHistory(client) {
  if (isPostingInProgress) return;

  const { trDateStr, trHour, day, month } = getTurkeyTimeInfo();
  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const dateHeaderStr = `${day} ${months[month]}`;

  if (lastPostedDateTR === trDateStr) {
    return;
  }

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
 */
function startEkoYildizHistoryScheduler(client) {
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

  cron.schedule("*/15 * * * *", async () => {
    try {
      await checkAndCatchUpEkoYildizHistory(client);
    } catch (err) {
      console.error("❌ [EkoYildizHistoryAI] 15dk telafi kontrol hatası:", err.message);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  setTimeout(() => {
    checkAndCatchUpEkoYildizHistory(client).catch(err => {
      console.error("❌ [EkoYildizHistoryAI] Başlangıç kontrol hatası:", err.message);
    });
  }, 5000);

  console.log("✅ [EkoYildizHistoryAI] 7/24 Kesintisiz Tarihte Bugün Zamanlayıcısı (Europe/Istanbul) Aktif.");
}

/**
 * AI'dan kompakt bilgi alıp kanala gönderir.
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

    const specialDay = getSpecialDayInfo(now);
    const isFirstDayOfMonth = (day === 1 && !specialDay);

    let embedTitle = `📅 Tarihte Bugün – ${dateStr}`;
    let embedColor = 0xdc143c;
    let specialField = null;

    const systemPrompt = `Sen Türk ve Dünya tarihini mükemmel bilen, Atatürk ilke ve inkılaplarına bağlı uzman bir tarih anlatıcısısın.
Görevin: İstenen tarihte (${dateStr}) gerçekleşmiş tarihi olayları KISA, ÖZET, ESTETİK VE AKICI bir formatta aktarmaktır. Çok uzun paragraflardan kaçın; maddeler, kısa başlıklar ve vurucu cümleler kullan.

FORMAT:
🏛️ **ATATÜRK & MİLLİ MÜCADELE**
(Atatürk'ün bu tarihteki veya döneme ait liderliği hakkında 2-3 vurucu cümle)

🌍 **DÜNYA & TÜRK TARİHİNDE DÖNÜM NOKTALARI**
• **Yıl:** Olay özeti (1 cümle)
• **Yıl:** Olay özeti (1 cümle)
• **Yıl:** Olay özeti (1 cümle)

🔬 **BİLİM & KÜLTÜR**
• Önemli keşif veya kültürel gelişme özeti.

📜 **GÜNÜN SÖZÜ**
> *"İlham verici tarihi bir söz"*`;

    let userPrompt = `Tarih: ${dateStr}. Lütfen yukarıdaki formatta kısa, derli toplu ve son derece estetik bir Tarihte Bugün metni hazırla.`;

    if (specialDay) {
      embedTitle = `${specialDay.emoji} ${specialDay.name} – ${dateStr}`;
      embedColor = specialDay.color || 0xdc143c;
      specialField = {
        name: `📌 ${specialDay.emoji} Günün Anlam ve Önemi`,
        value: `${specialDay.desc}\n> *"${specialDay.quote}"*`
      };
      userPrompt = `Bugün ${specialDay.name} (${dateStr}). Bu özel günün anlamını ve günün özetini kapsayan kısa, estetik bir Tarihte Bugün formatı hazırla.`;
    }

    let aiContent = "";
    try {
      aiContent = await chatWithAI([{ role: 'user', content: userPrompt }], systemPrompt, 'ticket', { max_tokens: 650, temperature: 0.65 });
      if (!aiContent || aiContent.trim().length < 80) {
        throw new Error("AI yanıtı çok kısa");
      }
    } catch (aiErr) {
      console.warn("⚠️ [EkoYildizHistoryAI] AI isteği başarısız, veritabanı yedeği kullanılıyor:", aiErr.message);
      aiContent = getHistoricalFallbackEvent(day, month);
    }

    if (aiContent && aiContent.length > 2000) {
      aiContent = aiContent.substring(0, 1980) + "...";
    }

    const botAvatar = client.user ? client.user.displayAvatarURL() : undefined;

    const embed = new EmbedBuilder()
      .setTitle(embedTitle)
      .setDescription(
        `${aiContent}\n\n` +
        `👇 **Detaylı Atatürk hikayeleri, zaferler ve bilim tarihi için aşağıdaki butonları kullanabilirsiniz:**`
      )
      .setColor(embedColor)
      .setFooter({ text: "EkoYıldız Tarih & Kültür Sistemi • Gazi Mustafa Kemal Atatürk'ün İzinde", iconURL: botAvatar })
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

    if (specialDay) {
      const NOTIFICATION_CHANNEL_ID = process.env.EKO_YILDIZ_ANNOUNCE_CHANNEL_ID || "1518692466860101915";
      try {
        const notifyChannel = await client.channels.fetch(NOTIFICATION_CHANNEL_ID).catch(() => null);
        if (notifyChannel && notifyChannel.isTextBased()) {
          const notifyText = `:information_source: **${specialDay.name} gününüzü sevgi ve sağlıcakla kutlarız, https://discord.com/channels/1367646464804655104/1518692463177498674 kanalına bugüne özel yeni bir tarihte bugün atıldı.**`;
          await notifyChannel.send(notifyText);
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
  checkAndCatchUpEkoYildizHistory,
  getTurkeyTimeInfo
};
