const cron = require("node-cron");
const { MessageFlags } = require("discord.js");
const { buildDailyPayload, TMT_DAILY_FOOTER } = require("./historyV2Messages");

const { hasPostedDate, recordPostedDate, claimDateShared, removeDuplicateDailyPosts } = require("./historyTracker");

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

async function hasAlreadyPostedToday(channel, dateHeaderStr, trDateStr) {
  try {
    if (!channel || !channel.isTextBased()) return false;
    const messages = await channel.messages.fetch({ limit: 25 }).catch(() => null);
    if (!messages || messages.size === 0) return false;

    const botId = channel.client && channel.client.user && channel.client.user.id;
    const todayEmbed = messages.find(m => {
      // Components V2 mesajlarında embed yok: botun bugün attığı V2 mesajını tarihten tanı.
      if (botId && m.author && m.author.id === botId && m.flags && m.flags.has(MessageFlags.IsComponentsV2)) {
        const msgDate = m.createdAt ? m.createdAt.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }) : "";
        if (msgDate === trDateStr) return true;
      }
      if (!m.embeds || m.embeds.length === 0) return false;
      const embed = m.embeds[0];
      const title = embed.title || "";
      const footer = embed.footer?.text || "";

      if (title.includes(dateHeaderStr)) return true;
      if (footer.includes("Tarih")) {
        const msgDateStr = m.createdAt ? m.createdAt.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }) : "";
        if (msgDateStr === trDateStr) return true;
      }
      return false;
    });

    return !!todayEmbed;
  } catch (err) {
    console.warn("⚠️ [AtaturkHistoryAI] Mesaj geçmişi kontrol hatası:", err.message);
    return false;
  }
}

async function checkAndCatchUpAtaturkHistory(client) {
  if (isPostingInProgress) return;

  const { trDateStr, trHour, day, month } = getTurkeyTimeInfo();
  if (lastPostedDateTR === trDateStr || hasPostedDate('ataturk', trDateStr)) {
    lastPostedDateTR = trDateStr;
    return;
  }

  if (trHour < 9) return;

  isPostingInProgress = true;
  try {
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dateHeaderStr = `${day} ${months[month]}`;

    // Kanalda zaten mevcut mu kontrol et
    let anyAlreadyPosted = false;
    for (const channelId of TARGET_CHANNEL_IDS) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel && await hasAlreadyPostedToday(channel, dateHeaderStr, trDateStr)) {
        anyAlreadyPosted = true;
        break;
      }
    }

    if (anyAlreadyPosted) {
      lastPostedDateTR = trDateStr;
      recordPostedDate('ataturk', trDateStr);
      console.log(`ℹ️ [AtaturkHistoryAI] ${dateHeaderStr} mesajı kanalda zaten mevcut, tekrar atılmadı.`);
      return;
    }

    // Kilit kanal+gün ile: aynı kanala atan her süreç/servis aynı kaydı paylaşır
    const releases = [];
    for (const channelId of TARGET_CHANNEL_IDS) {
      const release = await claimDateShared(`channel_${channelId}`, trDateStr);
      if (!release) {
        releases.forEach((r) => r());
        lastPostedDateTR = trDateStr;
        return;
      }
      releases.push(release);
    }
    const success = await postAtaturkHistory(client);
    if (!success) releases.forEach((r) => r());
    if (success) {
      lastPostedDateTR = trDateStr;
      recordPostedDate('ataturk', trDateStr);
      // Yine de iki mesaj düştüyse ilk geleni bırak, sonrakini sil
      for (const channelId of TARGET_CHANNEL_IDS) {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        const removed = channel ? await removeDuplicateDailyPosts(channel, trDateStr) : 0;
        if (removed) console.log(`🧹 [AtaturkHistoryAI] ${removed} çift mesaj silindi (${channelId}), ilk mesaj bırakıldı.`);
      }
    }
  } catch (err) {
    console.error("❌ [AtaturkHistoryAI] Catch-up hatası:", err.message);
  } finally {
    isPostingInProgress = false;
  }
}

/**
 * Her gün sabah 09:00'da (TR Saati) Atatürk ve Türk tarihi özel gün paylaşımı yapar.
 * 09:00 çakışmasını engellemek için telafi cron'u :23, :43 dakikalarında çalışır (asla :00'da tetiklenmez).
 * @param {import('discord.js').Client} client
 */
function startAtaturkHistoryScheduler(client) {
  // 1. Ana Cron: Her gün 09:00 Europe/Istanbul
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

  // 2. Periyodik Telafi Kontrolü: 09:00 ile çakışmaması için dakikalar :23, :43 olarak ayarlandı
  cron.schedule("23,43 * * * *", async () => {
    try {
      await checkAndCatchUpAtaturkHistory(client);
    } catch (err) {
      console.error("❌ [AtaturkHistoryAI] Periyodik kontrol hatası:", err.message);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  // 3. Bot hazır olduğunda 10 sn sonra tek seferlik telafi kontrolü yap
  setTimeout(() => {
    checkAndCatchUpAtaturkHistory(client).catch(() => {});
  }, 10000);

  console.log("✅ [AtaturkHistoryAI] 7/24 Kesintisiz Tarihte Bugün Zamanlayıcısı Aktif.");
}

/**
 * EkoYıldız ile aynı "Tarihte Bugün" içeriğini (kısa format + Atatürk/Bilim/Trivia/Vecize
 * butonları) TMT kanalına, TMT alt yazısıyla gönderir.
 * @param {import('discord.js').Client} client
 * @param {Date} [customDate] - İsteğe bağlı özel tarih (test için)
 */
async function postAtaturkHistory(client, customDate = null) {
  try {
    const channels = [];
    for (const channelId of TARGET_CHANNEL_IDS) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel && channel.isTextBased()) channels.push(channel);
      else console.warn(`⚠️ [AtaturkHistoryAI] Hedef kanal bulunamadı veya metin kanalı değil: ${channelId}`);
    }
    if (channels.length === 0) return false;

    const { generateDailyHistoryContent } = require("./ekoYildizHistoryAI");
    const daily = await generateDailyHistoryContent(customDate);

    let sent = 0;
    for (const channel of channels) {
      const isEkoYildiz = channel.guild && channel.guild.id === "1367646464804655104";
      const payload = buildDailyPayload({ ...daily, ...(isEkoYildiz ? {} : { footer: TMT_DAILY_FOOTER }) });
      const ok = await channel.send(payload).then(() => true).catch(err => {
        console.warn(`⚠️ [AtaturkHistoryAI] Mesaj gönderilemedi (${channel.id}): ${err.message}`);
        return false;
      });
      if (ok) {
        sent++;
        console.log(`✅ [AtaturkHistoryAI] ${daily.title} mesajı ${channel.id} kanalına başarıyla gönderildi.`);
      }
    }
    return sent > 0;
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
