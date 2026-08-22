'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

const User = require("../../models/User");
const UserTrustScore = require("../../models/UserTrustScore");
const { jailUser } = require("./jailService");
const { updateTrustScore, logTrustUserActivity } = require("./security/trustScoreService");
const { chatWithAI } = require("./aiService");

const MOD_CEZA_LOG_CHANNEL_ID = process.env.EKOYILDIZ_MOD_CEZA_LOG_CHANNEL_ID || "1518693023934844959";

// Kullanıcı ihlal hafızası (15 dakika kayan pencere)
// userId -> [{ timestamp, severity, swearWord }]
const userViolations = new Map();

// Bellek temizleme (5 dakikada bir)
setInterval(() => {
  const now = Date.now();
  for (const [userId, logs] of userViolations.entries()) {
    const valid = logs.filter(l => now - l.timestamp < 15 * 60 * 1000);
    if (valid.length === 0) userViolations.delete(userId);
    else userViolations.set(userId, valid);
  }
}, 5 * 60 * 1000);

/**
 * 1. UNICODE HOMOGLYPH DÖNÜŞTÜRÜCÜ (Kiril / Grek / Şekilli Harf Bypass Kalkanı)
 */
const HOMOGLYPHS = {
  'а': 'a', 'а': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a', 'à': 'a', 'á': 'a', 'ą': 'a', 'å': 'a',
  'б': 'b', 'в': 'b', 'Ь': 'b',
  'с': 'c', 'ç': 'c', 'ć': 'c', 'č': 'c',
  'д': 'd', 'đ': 'd',
  'е': 'e', 'ё': 'e', 'є': 'e', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ē': 'e', 'ę': 'e',
  'г': 'g', 'ğ': 'g',
  'н': 'h',
  'і': 'i', 'ï': 'i', 'í': 'i', 'ì': 'i', 'î': 'i', 'ı': 'i', '1': 'i', 'l': 'i', 'İ': 'i', 'I': 'i',
  'к': 'k',
  'м': 'm',
  'о': 'o', 'ö': 'o', 'ø': 'o', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', '0': 'o',
  'р': 'p',
  'г': 'r',
  'ѕ': 's', 'ş': 's', 'ś': 's', 'š': 's', '$': 's', '5': 's',
  'т': 't', '7': 't',
  'у': 'u', 'ü': 'u', 'ù': 'u', 'ú': 'u', 'û': 'u', 'µ': 'u',
  'х': 'x',
  'у': 'y', 'ý': 'y', 'ÿ': 'y'
};

/**
 * Güvenli Kelimeler (Yanlış Pozitifleri Önleme / Whitelist)
 */
const SAFE_WORDS = [
  "tamam", "akşam", "akşamki", "alamamki", "yapamamki", "olamamki",
  "program", "programlama", "programlar",
  "sık", "sıkıntı", "sıkıntılı", "sıkmak", "sıkı", "sıklıkla",
  "fıstık", "paspas", "kastamonu", "sikke", "klasik", "müzik", "fizik", "teknik",
  "kombine", "amiral", "amin", "sikke", "pusula", "helikopter"
];

/**
 * HİYERARŞİK KÜFÜR VE HAKARET VERİTABANI
 */
const PROFANITY_TIERS = {
  // 1. KRİTİK VE AĞIR (Milli/Dini Değerler, Atatürk'e Hakaret, Ağır Ailevi Küfür)
  CRITICAL: {
    name: "Kritik / Milli-Dini Değerler & Ağır Ailevi",
    severity: "CRITICAL",
    points: -15.0,
    words: [
      "atatürk", "kemalist piç", "atamıza", "atatürke", "şehitlere", "bayrağa", "ezana", "kurana", "allaha söv", "allahını", "dinini", "peygamberini", "kitabını"
    ],
    // Tam eşleşen kritik ifadeler
    phrases: [
      /allah(ı|i|ini|ina)\s*(sik|sikeyim|sok|yok)/i,
      /din(i|ini|ine)\s*(sik|sikeyim)/i,
      /kitab(ı|ini)\s*(sik|sikeyim)/i,
      /atatürk(e|ün|ü)\s*(sik|küfür|söveyim|piç)/i,
      /ana(nı|na|nızı)\s*(sik|sikeyim|avradını)/i,
      /bacı(nı|nızı)\s*(sik|sikeyim)/i,
      /ecdadını\s*(sik|sikeyim)/i
    ]
  },

  // 2. AĞIR KÜFÜRLER (Cinsel organ, ağır sövgü, orospu, yarrak, amcık)
  SEVERE: {
    name: "Ağır Küfür / Müstehcen Hakaret",
    severity: "SEVERE",
    points: -5.0,
    words: [
      "orospu", "orospucocugu", "orospuçocuğu", "orosbu", "orospunun", "orospular",
      "yarrak", "yarak", "yarram", "yarragim", "yarrağım", "yarrrak",
      "amcık", "amcik", "amcığı", "amcığını", "amcıklar",
      "sikeyim", "siktim", "siktiğimin", "sikerim", "sikiş", "sikis", "sikim", "sikem", "sik kırığı", "sikişmek", "sikismek",
      "amına", "amını", "amina", "amini", "amk", "aq", "amq", "anaskm", "amınakoyim", "amınakoyayım", "amınakodumun", "amkoyim", "aminakoyim",
      "piç", "pic", "pici", "piçin", "picin", "piçler", "picler",
      "oç", "oc", "götveren", "gotveren", "gavat", "kaltak", "fahişe", "fahise", "kahpe", "puşt", "pust"
    ]
  },

  // 3. ORTA VE HAFİF ARGO / TOKSİSİTE
  MODERATE: {
    name: "Orta / Hafif Argo ve Toksisite",
    severity: "MODERATE",
    points: -2.0,
    words: [
      "göt", "got", "göte", "gote", "götü", "gotu", "götlek", "gotlek", "göt kafalı",
      "sik", "siktir", "siktirgit", "sg", "sktir",
      "yavşak", "yavsak", "ibne", "top", "dingil", "dangalak", "pezevenk", "pezevenkler"
    ]
  }
};

/**
 * 2. Gelişmiş Metin Normalizasyonu ve Deobfuscation (Bypass Engelleme)
 */
function cleanAndNormalizeText(rawText) {
  if (!rawText) return { raw: "", cleaned: "", collapsed: "", reduced: "", singleChar: "" };
  let text = rawText.toLowerCase();

  // A. Görünmez karakterleri, zero-width space ve unicode diacritic'leri temizle
  text = text.replace(/[\u200B-\u200D\uFEFF\u00AD\u0300-\u036F\u0456\u0457]/g, (m) => {
    if (m === '\u0456' || m === '\u0457') return 'i';
    return '';
  });

  // B. Homoglyph dönüşümü (Kiril / Latin lookalikes)
  let homoglyphCleaned = "";
  for (const ch of text) {
    homoglyphCleaned += HOMOGLYPHS[ch] || ch;
  }
  text = homoglyphCleaned;

  // C. Leet-speak ve rakam/sembol temizliği (Noktalama işaretlerinden ÖNCE yapılmalı)
  text = text.replace(/@/g, "a")
             .replace(/4/g, "a")
             .replace(/[1!|]/g, "i")
             .replace(/0/g, "o")
             .replace(/3/g, "e")
             .replace(/[5$]/g, "s")
             .replace(/7/g, "t")
             .replace(/8/g, "b")
             .replace(/9/g, "g");

  // D. Noktalama işaretleri, emojiler, altçizgi ve ayraçları kaldır
  const noPunctuation = text.replace(/[\.\,\_\-\*\+\~\#\=\|\/\\\'\"\:\;\(\)\[\]\{\}\<\>\`\^\%\!\?]/g, "");

  // E. Tek harf aralıklı boşlukları birleştir ("s i k" -> "sik", "o r o s p u" -> "orospu")
  const collapsedSpaces = noPunctuation.replace(/\b([a-zğüşıöç])\s+(?=[a-zğüşıöç]\b)/gi, "$1");

  // F. Harf tekrarlarını sınırla ("siiiikkkkk" -> "sik", "amkkkkk" -> "amk")
  const collapsedRepeats = collapsedSpaces.replace(/([a-zğüşıöç])\1{2,}/gi, "$1$1");
  const fullyCollapsedRepeats = collapsedSpaces.replace(/([a-zğüşıöç])\1+/gi, "$1");

  return {
    raw: rawText.toLowerCase(),
    cleaned: noPunctuation,
    collapsed: collapsedSpaces,
    reduced: collapsedRepeats,
    singleChar: fullyCollapsedRepeats
  };
}

/**
 * 3. Akıllı Küfür & Bypass Tespiti
 */
function detectProfanity(rawText) {
  if (!rawText || typeof rawText !== "string") return null;

  const norm = cleanAndNormalizeText(rawText);

  // Güvenli kelime kontrolü: Eğer metin tamamen safe word ise atla
  const rawWords = norm.raw.split(/\s+/);
  const isAllSafe = rawWords.length > 0 && rawWords.every(w => SAFE_WORDS.includes(w));
  if (isAllSafe) return null;

  // 1. Kritik Dini/Milli ve Ağır Ailevi Kalıp Tespiti
  for (const regex of PROFANITY_TIERS.CRITICAL.phrases) {
    if (regex.test(norm.raw) || regex.test(norm.cleaned) || regex.test(norm.collapsed) || regex.test(norm.singleChar)) {
      return {
        tier: PROFANITY_TIERS.CRITICAL,
        matched: "Dini / Milli / Ağır Ailevi İfade",
        severity: "CRITICAL"
      };
    }
  }

  // 2. Kritik Kelimeler
  for (const word of PROFANITY_TIERS.CRITICAL.words) {
    const wRegex = new RegExp(`\\b${word}\\b`, 'i');
    if (wRegex.test(norm.raw) || norm.cleaned.includes(word) || norm.collapsed.includes(word) || norm.singleChar.includes(word)) {
      return {
        tier: PROFANITY_TIERS.CRITICAL,
        matched: word,
        severity: "CRITICAL"
      };
    }
  }

  // 3. Ağır Küfürler (Severe)
  for (const word of PROFANITY_TIERS.SEVERE.words) {
    // Özel durumlar: amk, aq gibi kısa kelimelerde kelime sınırı ve safe word kontrolü
    if (word === "amk" || word === "aq" || word === "amq" || word === "oç" || word === "oc") {
      const shortRegex = new RegExp(`(^|\\s|[^a-zğüşıöç])${word}($|\\s|[^a-zğüşıöç])`, 'i');
      if (shortRegex.test(norm.raw) || shortRegex.test(norm.collapsed) || shortRegex.test(norm.singleChar)) {
        if (!SAFE_WORDS.some(sw => norm.raw.includes(sw) && !norm.raw.includes(` ${word} `))) {
          return { tier: PROFANITY_TIERS.SEVERE, matched: word, severity: "SEVERE" };
        }
      }
    } else {
      if (norm.raw.includes(word) || norm.cleaned.includes(word) || norm.collapsed.includes(word) || norm.reduced.includes(word) || norm.singleChar.includes(word)) {
        return { tier: PROFANITY_TIERS.SEVERE, matched: word, severity: "SEVERE" };
      }
    }
  }

  // 4. Orta Derece Argo / Toksik (Moderate)
  for (const word of PROFANITY_TIERS.MODERATE.words) {
    if (word === "sik" || word === "göt" || word === "sg") {
      const shortRegex = new RegExp(`(^|\\s|[^a-zğüşıöç])${word}($|\\s|[^a-zğüşıöç])`, 'i');
      if (shortRegex.test(norm.raw) || shortRegex.test(norm.collapsed) || shortRegex.test(norm.singleChar)) {
        if (!SAFE_WORDS.some(sw => norm.raw.includes(sw) && (norm.raw.includes("sık") || norm.raw.includes("sıkıntı")))) {
          return { tier: PROFANITY_TIERS.MODERATE, matched: word, severity: "MODERATE" };
        }
      }
    } else {
      if (norm.raw.includes(word) || norm.cleaned.includes(word) || norm.collapsed.includes(word) || norm.singleChar.includes(word)) {
        return { tier: PROFANITY_TIERS.MODERATE, matched: word, severity: "MODERATE" };
      }
    }
  }

  return null;
}

/**
 * 4. Kademeli Otomatik Yaptırım ve Moderasyon Motoru
 */
async function processMessageAutomod(message, client) {
  try {
    if (!message || message.author.bot || !message.guild || !message.content) return false;

    const detection = detectProfanity(message.content);
    if (!detection) return false;

    const userId = message.author.id;
    const guild = message.guild;
    const channel = message.channel;
    const now = Date.now();

    // 1. İhlali Hafızaya Kaydet
    let logs = userViolations.get(userId) || [];
    logs = logs.filter(l => now - l.timestamp < 15 * 60 * 1000);
    logs.push({
      timestamp: now,
      severity: detection.severity,
      matched: detection.matched
    });
    userViolations.set(userId, logs);

    const violationCount = logs.length;

    // 2. Mesajı Anında Sil
    await message.delete().catch(() => {});

    // 3. Güven Puanını Düşür
    const pointsToDeduct = detection.tier.points || -2.0;
    await updateTrustScore(userId, pointsToDeduct, `Automod: ${detection.tier.name} (${detection.matched})`, "SYSTEM", client);

    const member = await guild.members.fetch(userId).catch(() => null);

    let actionTaken = "UYARI";
    let actionDesc = "Kullanıcının mesajı silindi ve güven puanı düşürüldü.";
    let embedColor = 0xf1c40f;

    // ── KADEMELİ CEZA SENARYOLARI ──────────────────────────────────────────

    // A. KRİTİK SEVİYE (Milli/Dini Değerler, Ağır Sövgü) -> Doğrudan 60 Dk Hapis & Timeout
    if (detection.severity === "CRITICAL") {
      actionTaken = "🚨 KRİTİK İHLAL — DOĞRUDAN HAPİS & SUSTURMA";
      embedColor = 0x900c3f;
      if (member) {
        await member.timeout(60 * 60 * 1000, `Automod Kritik İhlal: ${detection.matched}`).catch(() => {});
        await jailUser(client, guild, userId, `Automod Kritik İhlal: ${detection.matched}`, 60, client.user.id).catch(() => {});
      }
      actionDesc = `🚨 **Ağır Yaptırım:** Kullanıcı milli/dini/ağır değer ihlali sebebiyle **60 dakika hapse atıldı ve susturuldu.**`;
    }
    // B. 3. VEYA DAHA FAZLA İHLAL (İnatçı İhlalci) -> 30 Dk Hapis
    else if (violationCount >= 3) {
      actionTaken = "🔒 İNATÇI İHLAL — OTOMATİK HAPİS";
      embedColor = 0xe74c3c;
      if (member) {
        await jailUser(client, guild, userId, `Automod 3+ Tekrarlanan Küfür İhlali (${detection.matched})`, 30, client.user.id).catch(() => {});
      }
      actionDesc = `🔒 **3. Tekerrür:** Kullanıcı 15 dakika içinde 3 kez kural ihlali yaptığı için **30 dakika hapse atıldı.**`;
    }
    // C. 2. İHLAL (Tekerrür) -> 15 Dk Timeout
    else if (violationCount === 2) {
      actionTaken = "🔇 TEKERRÜR — OTOMATİK SUSTURMA";
      embedColor = 0xe67e22;
      if (member) {
        await member.timeout(15 * 60 * 1000, `Automod 2. Küfür İhlali (${detection.matched})`).catch(() => {});
      }
      actionDesc = `🔇 **2. Tekerrür:** Kullanıcı kuralı tekrar ihlal ettiği için **15 dakika susturuldu.**`;
    }
    // D. 1. İHLAL -> Uyarı ve Geçici Bilgilendirme
    else {
      actionTaken = "⚠️ İLK İHLAL — RESMİ UYARI";
      embedColor = 0xf1c40f;
      actionDesc = `⚠️ **İlk İhlal:** Mesaj silindi, güven puanı düşürüldü ve sistem uyarısı gönderildi.`;
    }

    // Kullanıcıya / Kanala Hızlı Geçici Uyarı Mesajı Gönder (5 saniye sonra silinir)
    channel.send({
      content: `⚠️ <@${userId}>, mesajınız **EkoYıldız Automod Kalkanı** tarafından engellendi. *(Kural İhlali: Küfür / Argo / Uygunsuz Dil)*. ${violationCount > 1 ? `**[Tekerrür: ${violationCount}. İhlal]**` : ''}`
    }).then(msg => {
      setTimeout(() => msg.delete().catch(() => {}), 6000);
    }).catch(() => {});

    // ── MODERASYON LOG KANALINA BUTONLU CEZA KARTI GÖNDER ──────────────────
    const logChannel = await client.channels.fetch(MOD_CEZA_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setTitle(`🛡️ AUTOMOD: ${actionTaken}`)
        .setColor(embedColor)
        .setDescription(
          `👤 **Kullanıcı:** <@${userId}> (\`${userId}\`)\n` +
          `📍 **Kanal:** <#${channel.id}>\n` +
          `📝 **İçerik:** \`${message.content.substring(0, 500)}\`\n` +
          `🔍 **Tespit Edilen Kalıp:** \`${detection.matched}\` (${detection.tier.name})\n` +
          `📊 **15 Dk İhlal Sayısı:** **${violationCount}**\n` +
          `⚙️ **Uygulanan İşlem:** ${actionDesc}`
        )
        .setFooter({ text: "EkoYıldız Gelişmiş Automod Kalkanı", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      // Moderatör Hızlı Müdahale Butonları
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`jail_ignore_${guild.id}_${userId}_${channel.id}_${message.id}`)
          .setLabel("Yoksay / Affet")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("✅"),
        new ButtonBuilder()
          .setCustomId(`jail_mute_${guild.id}_${userId}_${channel.id}_${message.id}_30`)
          .setLabel("30 Dk Sustur")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🔇"),
        new ButtonBuilder()
          .setCustomId(`jail_immed_${guild.id}_${userId}_${channel.id}_${message.id}_60`)
          .setLabel("60 Dk Hapis")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒"),
        new ButtonBuilder()
          .setCustomId(`jail_ai_auto_punish_${guild.id}_${userId}_${channel.id}_${message.id}`)
          .setLabel("🤖 AI Başsavcı")
          .setStyle(ButtonStyle.Success)
      );

      await logChannel.send({ embeds: [logEmbed], components: [row] }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error("[profanityAutomodService] processMessageAutomod error:", err.message);
    return false;
  }
}

module.exports = {
  detectProfanity,
  cleanAndNormalizeText,
  processMessageAutomod,
  PROFANITY_TIERS
};
