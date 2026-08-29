'use strict';

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const GUILD_ID = "1537407325290237973";
const STAFF_LOG_CHANNEL_ID = "1543382733408174220";

// Rol Kademeleri
const ROLES = {
  TIER_1_MOD: "1538465689554260079",       // 1. Kademe: Moderatör (3 dk)
  TIER_2_SENIOR: "1542169874539876414",    // 2. Kademe: Üst Yetkili (5 dk)
  TIER_3_MANAGEMENT: "1537411535859617903" // 3. Kademe: Üst Yönetim / Kurucu
};

const INCIDENTS_FILE = path.join(__dirname, "../../data/robloxland_automod_incidents.json");

// Bellekte aktif vakalar ve zamanlayıcılar
const activeIncidents = new Map();

function loadIncidents() {
  try {
    if (fs.existsSync(INCIDENTS_FILE)) {
      return JSON.parse(fs.readFileSync(INCIDENTS_FILE, "utf8"));
    }
  } catch (_) {}
  return {};
}

function saveIncidents(data) {
  try {
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[RobloxLandAutoMod] Save error:", e.message);
  }
}

// ─── 1. BELİRLİ KÜFÜR KELİME LİSTESİ (SYNTAX YOK, SADECE BELİRLİ KELİMELER) ───
const EXACT_SWEAR_WORDS = new Set([
  "oç",
  "oc",
  "orospu",
  "orospu çocuğu",
  "orospuçocuğu",
  "orospucocugu",
  "piç",
  "pic",
  "amk",
  "aq",
  "sik",
  "sikerim",
  "sikim",
  "sikeyim",
  "siktir",
  "siktirgit",
  "yarrak",
  "yarak",
  "amcık",
  "amcik",
  "götveren",
  "gotveren",
  "kahpe",
  "kancık",
  "kancik",
  "yavşak",
  "yavsak",
  "dalyarak",
  "pezevenk",
  "ibne",
  "puşt",
  "pust"
]);

function detectProfanity(text) {
  if (!text) return null;
  const raw = text.toLowerCase().trim();

  // 1. Çok kelimeli tam eşleşmeler (ör: "orospu çocuğu")
  for (const swear of EXACT_SWEAR_WORDS) {
    if (swear.includes(" ") && raw.includes(swear)) {
      return swear;
    }
  }

  // 2. Noktalama ve boşluklarla ayrılmış kesin kelime eşleşmesi (Syntax/Regex karmaşası yok)
  const words = raw.split(/[\s,.\-_!?/\\|;:()\[\]{}'"+*#~`<>]+/);
  for (const w of words) {
    const cleanWord = w.trim();
    if (cleanWord && EXACT_SWEAR_WORDS.has(cleanWord)) {
      return cleanWord;
    }
  }

  return null;
}

// ─── 2. KÜFÜR TESPİTİ VE KADEMELİ MODERASYON YÖNETİMİ ─────────────────────────
async function handleRobloxLandAutoMod(message, client) {
  if (!message.guild || message.author.bot) return false;
  if (message.guildId !== GUILD_ID) return false;

  // Yetkili mesajlarını yoksay
  if (message.member?.permissions?.has(PermissionFlagsBits.ManageMessages) || message.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
    return false;
  }

  const content = message.content ? message.content.trim() : "";
  const detected = detectProfanity(content);
  if (!detected) return false;

  // 1. Mesajı derhal sil
  try {
    await message.delete().catch(() => {});
  } catch (_) {}

  // 2. Kanala kısa süreli uyarı mesajı bırak (5 sn sonra silinir)
  try {
    const warnMsg = await message.channel.send(`⚠️ <@${message.author.id}>, lütfen sunucu kurallarına uygun bir dil kullanınız.`);
    setTimeout(() => { warnMsg.delete().catch(() => {}); }, 5000);
  } catch (_) {}

  // 3. Vaka oluştur
  const incidentId = "INC-" + Date.now().toString(36).toUpperCase();
  const incident = {
    incidentId,
    userId: message.author.id,
    userTag: message.author.tag || message.author.username,
    channelId: message.channelId,
    channelName: message.channel.name || "bilinmeyen-kanal",
    content: content,
    detected,
    createdAt: Date.now(),
    currentTier: 1,
    resolved: false,
    resolvedBy: null,
    resolution: null,
    alertMessages: [] // [{ roleId, channelId, messageId }]
  };

  activeIncidents.set(incidentId, incident);
  const db = loadIncidents();
  db[incidentId] = incident;
  saveIncidents(db);

  // 4. Kademe 1: Moderatörlere (1538465689554260079) Bildirim Gönder
  await dispatchTier1Alert(incident, message.guild, client);
  return true;
}

/**
 * Kademe 1 Moderatör Bildirimi (3 Dakika Süre)
 */
async function dispatchTier1Alert(incident, guild, client) {
  const staffLog = guild.channels.cache.get(STAFF_LOG_CHANNEL_ID) || await guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
  if (!staffLog || !staffLog.isTextBased()) return;

  const alertText =
    `🚨 **KÜFÜR & UYGUNSUZ İÇERİK TESPİTİ (#${incident.incidentId})**\n` +
    `📢 **Kademe:** 🟡 **Kademe 1 — Moderatörler (<@&${ROLES.TIER_1_MOD}>)**\n\n` +
    `👤 **Kullanıcı:** <@${incident.userId}> (\`${incident.userTag}\` - \`${incident.userId}\`)\n` +
    `📁 **Kanal:** <#${incident.channelId}> (\`${incident.channelName}\`)\n` +
    `⚠️ **Tespit Edilen İçerik:**\n` +
    `> "${incident.content.replace(/\n/g, "\n> ")}"\n\n` +
    `⏳ **Kalan Süre:** 3 Dakika *(Süre içinde yanıt verilmezse vaka üst kademeye devredilecektir!)*`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`automod_mute_${incident.incidentId}_${incident.userId}`).setLabel("Sustur (15 Dk Mute)").setStyle(ButtonStyle.Danger).setEmoji("🔇"),
    new ButtonBuilder().setCustomId(`automod_warn_${incident.incidentId}_${incident.userId}`).setLabel("Uyar & Kapat").setStyle(ButtonStyle.Primary).setEmoji("🟡"),
    new ButtonBuilder().setCustomId(`automod_dismiss_${incident.incidentId}_${incident.userId}`).setLabel("Yanlış Alarm / Affet").setStyle(ButtonStyle.Secondary).setEmoji("⚪")
  );

  const sentMsg = await staffLog.send({
    content: alertText,
    components: [row]
  }).catch(() => null);

  if (sentMsg) {
    incident.alertMessages.push({ roleId: ROLES.TIER_1_MOD, channelId: staffLog.id, messageId: sentMsg.id });
    activeIncidents.set(incident.incidentId, incident);
  }

  // 3 Dakika Sonra Escalation Kontrolü
  setTimeout(async () => {
    const cur = activeIncidents.get(incident.incidentId);
    if (!cur || cur.resolved || cur.currentTier !== 1) return;

    // 1. Kademe yanıt vermedi! Mesajı güncelle:
    if (sentMsg) {
      await sentMsg.edit({
        content: `⚠️ **3 dakikada cevap vermediğiniz için bu vaka sizden gitti ve üst kademeye devredildi!**\n\n` + alertText,
        components: []
      }).catch(() => {});
    }

    // 2. Kademeye Yükselt
    cur.currentTier = 2;
    activeIncidents.set(incident.incidentId, cur);
    await dispatchTier2Alert(cur, guild, client);
  }, 3 * 60 * 1000);
}

/**
 * Kademe 2 Üst Yetkili Bildirimi (5 Dakika Süre)
 */
async function dispatchTier2Alert(incident, guild, client) {
  const staffLog = guild.channels.cache.get(STAFF_LOG_CHANNEL_ID) || await guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
  if (!staffLog || !staffLog.isTextBased()) return;

  const alertText =
    `🚨 **KÜFÜR VAKASI DEVREDİLDİ (#${incident.incidentId})**\n` +
    `📢 **Kademe:** 🟠 **Kademe 2 — Üst Yetkili & Denetim (<@&${ROLES.TIER_2_SENIOR}>)**\n` +
    `⚠️ *Moderatörler 3 dakika içinde müdahale etmediği için vaka bu kademeye devredilmiştir.*\n\n` +
    `👤 **Kullanıcı:** <@${incident.userId}> (\`${incident.userTag}\`)\n` +
    `📁 **Kanal:** <#${incident.channelId}>\n` +
    `📝 **İçerik:** > "${incident.content.replace(/\n/g, "\n> ")}"\n\n` +
    `⏳ **Kalan Süre:** 5 Dakika *(Yanıt verilmezse Üst Yönetime iletilecektir)*`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`automod_mute_${incident.incidentId}_${incident.userId}`).setLabel("Sustur (15 Dk Mute)").setStyle(ButtonStyle.Danger).setEmoji("🔇"),
    new ButtonBuilder().setCustomId(`automod_warn_${incident.incidentId}_${incident.userId}`).setLabel("Uyar & Kapat").setStyle(ButtonStyle.Primary).setEmoji("🟡"),
    new ButtonBuilder().setCustomId(`automod_dismiss_${incident.incidentId}_${incident.userId}`).setLabel("Yanlış Alarm").setStyle(ButtonStyle.Secondary).setEmoji("⚪")
  );

  const sentMsg = await staffLog.send({
    content: alertText,
    components: [row]
  }).catch(() => null);

  if (sentMsg) {
    incident.alertMessages.push({ roleId: ROLES.TIER_2_SENIOR, channelId: staffLog.id, messageId: sentMsg.id });
    activeIncidents.set(incident.incidentId, incident);
  }

  // 5 Dakika Sonra Escalation Kontrolü
  setTimeout(async () => {
    const cur = activeIncidents.get(incident.incidentId);
    if (!cur || cur.resolved || cur.currentTier !== 2) return;

    if (sentMsg) {
      await sentMsg.edit({
        content: `⚠️ **Süre içinde cevap verilmediği için vaka Üst Yönetime devredildi!**\n\n` + alertText,
        components: []
      }).catch(() => {});
    }

    cur.currentTier = 3;
    activeIncidents.set(incident.incidentId, cur);
    await dispatchTier3Alert(cur, guild, client);
  }, 5 * 60 * 1000);
}

/**
 * Kademe 3 Üst Yönetim Bildirimi (1537411535859617903)
 */
async function dispatchTier3Alert(incident, guild, client) {
  const staffLog = guild.channels.cache.get(STAFF_LOG_CHANNEL_ID) || await guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
  if (!staffLog || !staffLog.isTextBased()) return;

  const alertText =
    `🔴 **ACİL — KÜFÜR VAKASI ÜST YÖNETİME GELDİ (#${incident.incidentId})**\n` +
    `📢 **Kademe:** 👑 **Kademe 3 — Üst Yönetim / Kurucu (<@&${ROLES.TIER_3_MANAGEMENT}>)**\n` +
    `⚠️ *Alt kademe yetkililer zamanında müdahale etmediği için vaka doğrudan yönetime aktarılmıştır.*\n\n` +
    `👤 **Kullanıcı:** <@${incident.userId}> (\`${incident.userTag}\`)\n` +
    `📁 **Kanal:** <#${incident.channelId}>\n` +
    `📝 **İçerik:** > "${incident.content.replace(/\n/g, "\n> ")}"`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`automod_mute_${incident.incidentId}_${incident.userId}`).setLabel("Sustur (30 Dk)").setStyle(ButtonStyle.Danger).setEmoji("🔇"),
    new ButtonBuilder().setCustomId(`automod_warn_${incident.incidentId}_${incident.userId}`).setLabel("Uyar & Kapat").setStyle(ButtonStyle.Primary).setEmoji("🟡"),
    new ButtonBuilder().setCustomId(`automod_dismiss_${incident.incidentId}_${incident.userId}`).setLabel("Kapat").setStyle(ButtonStyle.Secondary).setEmoji("⚪")
  );

  const sentMsg = await staffLog.send({
    content: alertText,
    components: [row]
  }).catch(() => null);

  if (sentMsg) {
    incident.alertMessages.push({ roleId: ROLES.TIER_3_MANAGEMENT, channelId: staffLog.id, messageId: sentMsg.id });
    activeIncidents.set(incident.incidentId, incident);
  }
}

/**
 * ─── 3. BUTON ETKİLEŞİMLERİ VE DİNAMİK MESAJ TEMİZLEME ─────────────────────────
 */
async function handleAutoModInteraction(interaction, client) {
  const customId = interaction.customId || "";
  if (!customId.startsWith("automod_")) return false;

  const parts = customId.split("_");
  const action = parts[1]; // mute, warn, dismiss
  const incidentId = parts[2];
  const targetUserId = parts[3];

  const incident = activeIncidents.get(incidentId) || loadIncidents()[incidentId];
  if (!incident) {
    await interaction.reply({ content: "❌ Bu vaka kaydı bulunamadı veya süresi doldu.", ephemeral: true });
    return true;
  }

  if (incident.resolved) {
    await interaction.reply({ content: `ℹ️ Bu vaka zaten <@${incident.resolvedBy}> tarafından çözüldü.`, ephemeral: true });
    return true;
  }

  incident.resolved = true;
  incident.resolvedBy = interaction.user.id;
  incident.resolvedAt = Date.now();

  const guild = interaction.guild;
  const targetMember = guild?.members.cache.get(targetUserId) || await guild?.members.fetch(targetUserId).catch(() => null);

  let actionText = "";

  if (action === "mute") {
    actionText = "🔇 15 Dakika Susturuldu (Timeout)";
    if (targetMember && typeof targetMember.timeout === "function") {
      await targetMember.timeout(15 * 60 * 1000, `RobloxLand AutoMod Küfür (#${incidentId}) - Yetkili: ${interaction.user.tag}`).catch(() => {});
    }
  } else if (action === "warn") {
    actionText = "🟡 Uyarıldı & Kayıt Kapatıldı";
    if (targetMember) {
      await targetMember.send(`⚠️ **RobloxLand Uyarısı:** Küfür ve argo içerikli mesajınız silinmiştir. Lütfen kurallara uyunuz.`).catch(() => {});
    }
  } else {
    actionText = "⚪ Yanlış Alarm / Affedildi";
  }

  incident.resolution = actionText;
  activeIncidents.delete(incidentId);

  const db = loadIncidents();
  db[incidentId] = incident;
  saveIncidents(db);

  // ── DİNAMİK MESAJ TEMİZLEME: Diğer kademelere atılan mesajları sil / güncelle ──
  try {
    if (Array.isArray(incident.alertMessages)) {
      for (const item of incident.alertMessages) {
        if (item.messageId !== interaction.message.id) {
          const chan = guild.channels.cache.get(item.channelId) || await guild.channels.fetch(item.channelId).catch(() => null);
          if (chan) {
            const m = await chan.messages.fetch(item.messageId).catch(() => null);
            if (m) {
              await m.delete().catch(() => {});
            }
          }
        }
      }
    }
  } catch (cleanErr) {
    console.warn("[RobloxLandAutoMod] Clean messages error:", cleanErr.message);
  }

  // Mevcut mesajı sonuç kartına dönüştür
  await interaction.update({
    content:
      `✅ **VAKA ÇÖZÜLDÜ (#${incidentId})**\n\n` +
      `👤 **Kullanıcı:** <@${targetUserId}>\n` +
      `👨‍💼 **İşlem Yapan Yetkili:** <@${interaction.user.id}>\n` +
      `⚖️ **Uygulanan Ceza / Sonuç:** \`${actionText}\`\n` +
      `🕒 **Çözüm Zamanı:** <t:${Math.floor(Date.now() / 1000)}:R>`,
    components: []
  });

  return true;
}

module.exports = {
  handleRobloxLandAutoMod,
  handleAutoModInteraction,
  detectProfanity,
  ROLES,
  GUILD_ID
};
