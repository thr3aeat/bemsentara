const { AutoModerationRuleEventType, AutoModerationRuleTriggerType, AutoModerationActionType, AutoModerationRuleKeywordPresetType } = require('discord.js');
const { TMT_GUILD_ID } = require('../../config');

const RULE_PREFIX = "[TMT] ";

// ─── 1.0 Kişisel Bilgiler Regex ─────────────────────────────────────────────
// Sadece telefon numarası, IP ve potansiyel TCKN (11 hane) için
const PERSONAL_INFO_REGEX = [
  "(?:0|\\+90|90)?\\s*[1-9]\\d{2}\\s*\\d{3}\\s*\\d{2}\\s*\\d{2}", // TR Phone
  "\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b", // IPv4
  "\\b[1-9]\\d{10}\\b" // TR ID (11 digits starting non-zero) - broad match
];

// ─── Kesin Kelime Eşleşmesi ─────────────────────────────────────────────────
// Bir yasaklı kelime YALNIZCA kendi başına duruyorsa eşleşir: önünde ve arkasında harf/rakam olamaz.
// "selamün" içindeki "am", "malzeme" içindeki "mal", "topla" içindeki "top" asla yakalanmaz.
// Joker (*) hiçbir zaman kullanılmaz; listeye yanlışlıkla eklenirse silinir.
const WORD_CHARS = "\\p{L}\\p{N}";
const DISCORD_REGEX_MAX_LEN = 260; // Discord: kural başına en fazla 10 regex, her biri en fazla 260 karakter

function cleanWord(word) {
  return String(word).replace(/\*/g, "").trim().toLocaleLowerCase("tr-TR");
}

function wordToPattern(word) {
  return cleanWord(word)
    .split(/\s+/)
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
}

function wrapStrict(alternatives) {
  return `(?:^|[^${WORD_CHARS}])(?:${alternatives.join("|")})(?:$|[^${WORD_CHARS}])`;
}

/** Discord'a gönderilecek, tam-kelime sınırlı regex desenleri (260 karakterlik parçalara bölünmüş). */
function buildStrictRegexChunks(words) {
  const prefix = "(?i)";
  const chunks = [];
  let current = [];
  for (const pattern of words.map(wordToPattern)) {
    const candidate = prefix + wrapStrict([...current, pattern]);
    if (candidate.length > DISCORD_REGEX_MAX_LEN && current.length) {
      chunks.push(prefix + wrapStrict(current));
      current = [pattern];
    } else {
      current.push(pattern);
    }
  }
  if (current.length) chunks.push(prefix + wrapStrict(current));
  return chunks;
}

/** Botun kendi kontrolü: içerikte listeden bir kelime kendi başına geçiyor mu? */
function findStrictMatch(content, words) {
  const text = String(content || "").toLocaleLowerCase("tr-TR");
  for (const word of words) {
    if (new RegExp(wrapStrict([wordToPattern(word)]), "u").test(text)) return word;
  }
  return null;
}

// ─── 1.1 Toksik Kelimeler ───────────────────────────────────────────────────
const TOXIC_KEYWORDS = [
  // 1. Doğrudan Ağır Küfürler
  "amk", "aq", "amq", "amcık", "am feryadı", "hoşafı", "göt", "gavat", "godoş", "gaddar", "gote", "götveren", "götoş",
  "sik", "siktir", "sikik", "sik kırığı", "sik kafalı", "sikiş", "yarak", "yarrak", "yarram", "yarrak kafalı",
  "piç", "orospu", "oç", "o.ç", "kancık", "kahpe", "kaltak", "fahişe", "yosma", "sülaleni", "soyunu sopunu",
  // 2. Ailevi/Kutsal Değerlere
  "ananı", "anancı", "ana bacı", "babanı", "bacını", "kız kardeşini", "ceddin", "gelmişini", "geçmişini",
  "allahını", "kitabını", "dinini", "kutsalını", "muhammedini",
  // 3. Hakaretler/Argo — hafif atışmalara ("mal", "salak") izin veriliyor
  "geri zekalı", "gerizekalı", "aptal", "ibne", "top", "puşt", "nonoş"
].map(cleanWord);

// Selamlaşmalar asla 1.1'e takılmasın (eski "*am*" kalıbı "Selamün aleyküm"ü engelliyordu)
const TOXIC_ALLOW_LIST = [
  "selam*", "selamün", "selamun", "aleyküm", "aleykum",
  "selamünaleyküm", "selamunaleykum", "aleykümselam", "aleykumselam"
];

const sameList = (a = [], b = []) => [...a].sort().join('\n') === [...b].sort().join('\n');

// ─── 1.2 Siyasi Parti ve Liderler ───────────────────────────────────────────
const POLITICAL_KEYWORDS = [
  // Partiler
  "akp", "ak parti", "akparti", "chp", "cehape", "mhp", "mehape", "dem parti", "demparti", "hdp", "hedape",
  "iyi parti", "iyiparti", "zafer partisi", "yeniden refah", "yrp", "tip", "tipçiler", "hüda par", "hudapar",
  // Liderler
  "erdoğan", "tayyip", "rte", "reis", "cb", "özgür özel", "imamoğlu", "ekrem imamoğlu", "mansur yavaş",
  "devlet bahçeli", "bahçeli", "ümit özdağ", "özdağ", "fatih erbakan", "selahattin demirtaş", "demirtaş", "selo", "kemal kılıçdaroğlu"
].map(cleanWord);

// ─── 1.3 Discord Bağlantıları ───────────────────────────────────────────────
// Sadece invite linklerini yakalamak için Regex ve kelimeler
const DISCORD_LINK_REGEX = [
  "(?:https?://)?(?:www\\.)?(?:discord\\.(?:gg|io|me|li)|discordapp\\.com/invite)/[a-zA-Z0-9]+"
];

// ─── Tam-kelime kuralları (1.1 ve 1.2) ──────────────────────────────────────
const STRICT_WORD_RULES = [
  {
    name: `${RULE_PREFIX}1.1 Toksik Kelimeler`,
    words: TOXIC_KEYWORDS,
    allowList: TOXIC_ALLOW_LIST,
    customMessage: "Küfür veya toksik ifadeler yasaktır. (Kural 1.1)",
    timeoutSeconds: 86400, // 1 Gün
    reason: "TMT 1.1 Otomod Modülü"
  },
  {
    name: `${RULE_PREFIX}1.2 Siyaset`,
    words: POLITICAL_KEYWORDS,
    allowList: [],
    customMessage: "Siyasi parti ve liderler hakkında konuşmak yasaktır. (Kural 1.2)",
    timeoutSeconds: 86400, // 1 Gün
    reason: "TMT 1.2 Otomod Modülü"
  }
];

/**
 * Kuralı Discord'da tam-kelime regex'leriyle kurar/günceller. Discord eski joker'li kelime listesini
 * (ör. "*am*") tutuyorsa onu siler. Regex reddedilirse jokersiz kelime listesine düşer.
 */
async function syncStrictWordRule(guild, rules, def, exemptRoles) {
  const regexPatterns = buildStrictRegexChunks(def.words);
  const desiredMeta = { keywordFilter: [], regexPatterns, allowList: def.allowList };
  const fallbackMeta = { keywordFilter: def.words, regexPatterns: [], allowList: def.allowList };
  const existing = rules.find(r => r.name === def.name);

  try {
    if (existing) {
      const meta = existing.triggerMetadata || {};
      const inSync = sameList(meta.keywordFilter, []) &&
        sameList(meta.regexPatterns, regexPatterns) &&
        sameList(meta.allowList, def.allowList);
      if (!inSync) {
        await existing.edit({ triggerMetadata: desiredMeta, reason: `${def.reason} — tam kelime senkronizasyonu` });
        console.log(`🔄 ${def.name} tam-kelime regex'leriyle güncellendi.`);
      }
    } else {
      await guild.autoModerationRules.create({
        name: def.name,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: desiredMeta,
        actions: [
          { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: def.customMessage } },
          { type: AutoModerationActionType.Timeout, metadata: { durationSeconds: def.timeoutSeconds } }
        ],
        exemptRoles,
        enabled: true,
        reason: def.reason
      });
      console.log(`✅ ${def.name} kuralı oluşturuldu.`);
    }
  } catch (err) {
    console.error(`⚠️ ${def.name} regex ile kurulamadı (${err.message}); jokersiz kelime listesine geçiliyor.`);
    if (existing) {
      await existing.edit({ triggerMetadata: fallbackMeta, reason: `${def.reason} — yedek senkronizasyon` }).catch(e =>
        console.error(`❌ ${def.name} yedek senkronizasyonu da başarısız:`, e.message));
    }
  }
}

/**
 * Discord bir mesajı 1.1/1.2 ile engellediğinde botun ikinci kontrolü.
 * Mesajda listedeki bir kelime KENDİ BAŞINA geçmiyorsa bu bir yanlış pozitiftir.
 * @returns {{ ruleName: string, matchedWord: string|null, falsePositive: boolean } | null}
 *          null: bu kural tam-kelime kurallarından biri değil ya da içerik okunamadı.
 */
function checkStrictRuleExecution(ruleName, content) {
  const def = STRICT_WORD_RULES.find(d => d.name === ruleName);
  if (!def || typeof content !== "string" || !content.trim()) return null;
  const matchedWord = findStrictMatch(content, def.words);
  return { ruleName, matchedWord, falsePositive: !matchedWord };
}

/**
 * TMT sunucusundaki Otomod kurallarını kontrol eder ve yoksa/hatalıysa kurar.
 * @param {import('discord.js').Client} client 
 */
async function ensureTMTAutoMod(client) {
  try {
    const guild = await client.guilds.fetch(TMT_GUILD_ID).catch(() => null);
    if (!guild) {
      console.warn("⚠️ [TMT AutoMod] Sunucu bulunamadı.");
      return;
    }

    // Gerekli Rolleri Bul (Ordu Yönetimi, Moderatör Ekibi)
    let exemptRoles = [];
    const orduRole = guild.roles.cache.find(r => r.name.toLowerCase() === "ordu yönetimi");
    const modRole = guild.roles.cache.find(r => r.name.toLowerCase() === "moderatör ekibi");
    
    if (orduRole) exemptRoles.push(orduRole.id);
    if (modRole) exemptRoles.push(modRole.id);

    const rules = await guild.autoModerationRules.fetch();

    // ── 1.0 Kişisel Bilgilerin Koruması (BAN) ──
    const rule1Name = `${RULE_PREFIX}1.0 Kişisel Bilgiler`;
    if (!rules.some(r => r.name === rule1Name)) {
      await guild.autoModerationRules.create({
        name: rule1Name,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: {
          regexPatterns: PERSONAL_INFO_REGEX
        },
        actions: [
          { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: "Kişisel bilgi paylaşımı yasaktır. (Kural 1.0)" } }
        ],
        enabled: true,
        reason: "TMT 1.0 Otomod Modülü"
      });
      console.log(`✅ ${rule1Name} kuralı oluşturuldu.`);
    }

    // ── 1.1 Toksik Kelime ve 1.2 Siyaset Moderasyonu (yalnızca tam kelime) ──
    for (const def of STRICT_WORD_RULES) {
      await syncStrictWordRule(guild, rules, def, exemptRoles);
    }

    // ── 1.3 Discord Bağlantı Moderasyonu ──
    const rule4Name = `${RULE_PREFIX}1.3 Discord Linkleri`;
    if (!rules.some(r => r.name === rule4Name)) {
      await guild.autoModerationRules.create({
        name: rule4Name,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: {
          regexPatterns: DISCORD_LINK_REGEX
        },
        actions: [
          { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: "Discord sunucu davet linki paylaşmak yasaktır. (Kural 1.3)" } },
          { type: AutoModerationActionType.Timeout, metadata: { durationSeconds: 86400 } } // 1 Gün
        ],
        exemptRoles,
        enabled: true,
        reason: "TMT 1.3 Otomod Modülü"
      });
      console.log(`✅ ${rule4Name} kuralı oluşturuldu.`);
    }

    // ── 1.4 Etiket Spam Engeli ──
    const rule5Name = `${RULE_PREFIX}1.4 Etiket Spam`;
    if (!rules.some(r => r.name === rule5Name)) {
      await guild.autoModerationRules.create({
        name: rule5Name,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.MentionSpam,
        triggerMetadata: {
          mentionTotalLimit: 3
        },
        actions: [
          { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: "Çok fazla kişiyi etiketlediniz! (Kural 1.4)" } },
          { type: AutoModerationActionType.Timeout, metadata: { durationSeconds: 600 } } // 10 Dakika
        ],
        exemptRoles,
        enabled: true,
        reason: "TMT 1.4 Otomod Modülü"
      });
      console.log(`✅ ${rule5Name} kuralı oluşturuldu.`);
    }

    console.log("✅ TMT Otomod kuralları doğrulandı.");
  } catch (err) {
    console.error("❌ TMT Otomod kuralları kontrolünde hata:", err.message);
  }
}

module.exports = {
  ensureTMTAutoMod,
  checkStrictRuleExecution,
  findStrictMatch,
  buildStrictRegexChunks,
  STRICT_WORD_RULES,
  RULE_PREFIX
};
