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
const { chatWithAI } = require("./aiService");
const { jailUser } = require("./jailService");
const { issueWarning } = require("./punishmentService");
const { logTrustUserActivity, updateTrustScore } = require("./security/trustScoreService");
const MOD_CEZA_LOG_CHANNEL_ID = process.env.EKOYILDIZ_MOD_CEZA_LOG_CHANNEL_ID || "1518693023934844959";

async function sendCezaLog(client, embed) {
  try {
    if (!client) return;
    const channel = await client.channels.fetch(MOD_CEZA_LOG_CHANNEL_ID).catch(() => null);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] }).catch(() => {});
    }
  } catch (err) {
    console.warn('[automodPunishmentService] sendCezaLog error:', err.message);
  }
}

/**
 * Moderatör tıklamaları için Automod Ceza Handler
 */
async function handleAutomodPunishmentButton(interaction) {
  try {
    const customId = interaction.customId;
    if (!customId.startsWith("jail_")) return false;

    // customId format: jail_{action}_{guildId}_{userId}_{channelId}_{msgId}_{extra}
    const parts = customId.split("_");
    const action = parts[1]; // warn | mute | immed | kick | ban | ignore | ai | jop | extend
    const guildId = parts[2];
    const userId = parts[3];
    const channelId = parts[4];
    const msgId = parts[5];
    const extra = parts[6];

    const guild = interaction.guild || await interaction.client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      return interaction.reply({ content: "❌ Sunucu bulunamadı.", ephemeral: true });
    }

    const member = await guild.members.fetch(userId).catch(() => null);
    const dbUser = await User.findOne({ discordId: userId }) || {};
    const trustRecord = await UserTrustScore.findOne({ userId }) || {};

    const originalEmbed = interaction.message?.embeds?.[0];
    const msgContent = originalEmbed?.description?.match(/📝 \*\*İçerik:\*\* `([\s\S]*?)`/)?.[1] || "Uygunsuz içerik / küfür";

    // ── 1. YOKSAY ──────────────────────────────────────────────────────────
    if (action === "ignore") {
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0x95a5a6)
        .setTitle("✅ Automod Uyarısı — Yoksayıldı")
        .setDescription((originalEmbed?.description || "") + `\n\n> 👤 **${interaction.user.tag}** tarafından yoksayıldı.`);

      return interaction.update({ embeds: [updatedEmbed], components: [] }).catch(() => {});
    }

    // ── 2. YAPAY ZEKANIN ÖNERDİĞİ CEZAYI UYGULA ───────────────────────────
    if (action === "ai" || customId.startsWith("jail_ai_auto_punish_")) {
      await interaction.deferUpdate().catch(() => {});

      const isJailedNow = !!(dbUser.isJailed || member?.roles?.cache?.some(r => r.name.toLowerCase() === "hapis"));

      const prompt = `Sen EkoYıldız sunucusunun baş yapay zeka hakim ve moderatörüsün.
Aşağıdaki kullanıcının en son gerçekleştirdiği kural ihlali ve geçmiş sicili verilmiştir:
- Son İhlal Mesajı: "${msgContent}"
- Mevcut Güven Puanı: ${trustRecord.trustScore || 100}
- Geçmiş İhlal Logları Sayısı: ${trustRecord.scoreLogs?.length || 0}
- Kullanıcı Şu An Hapiste mi?: ${isJailedNow ? "Evet" : "Hayır"}

Görevin kullanıcının mevcut ihlalini ve geçmiş ceza sicilini değerlendirerek en adil cezayı vermektir.
Seçebileceğin Kararlar:
- "WARN" (Yalnızca Uyarı)
- "MUTE" (Geçici Susturma)
- "JAIL" (Hapse Atma)
- "EXTEND_JAIL" (Hapisteyse Süreyi Uzatma)
- "KICK" (Sunucudan Atma)
- "BAN" (Sunucudan Yasaklama)

SADECE AŞAĞIDAKİ JSON FORMATINDA YANIT VER:
{
  "action": "WARN|MUTE|JAIL|EXTEND_JAIL|KICK|BAN",
  "durationMinutes": 30,
  "reason": "AI gerekçesi"
}`;

      const aiRes = await chatWithAI([{ role: "user", content: prompt }], prompt, "automod", { max_tokens: 300, temperature: 0.2 }).catch(() => null);

      let decision = { action: "JAIL", durationMinutes: 30, reason: "Automod AI Kararı" };
      try {
        const jsonMatch = aiRes?.match(/\{[\s\S]*\}/);
        if (jsonMatch) decision = JSON.parse(jsonMatch[0]);
      } catch (_) {}

      let resultMsg = "";
      const act = (decision.action || "JAIL").toUpperCase();
      const mins = decision.durationMinutes || 30;
      const rsn = decision.reason || "Yapay Zeka Moderasyon Kararı";

      if (act === "WARN") {
        if (member) await issueWarning(interaction, member.user, rsn, interaction.user).catch(() => {});
        resultMsg = `⚠️ **AI Kararı:** Kullanıcıya resmi uyarı gönderildi (${rsn}).`;
      } else if (act === "MUTE") {
        if (member) await member.timeout(mins * 60 * 1000, rsn).catch(() => {});
        resultMsg = `🔇 **AI Kararı:** Kullanıcı **${mins} dakika** susturuldu (${rsn}).`;
      } else if (act === "EXTEND_JAIL" || (act === "JAIL" && isJailedNow)) {
        if (dbUser && dbUser.jailedUntil) {
          dbUser.jailedUntil = new Date(dbUser.jailedUntil.getTime() + mins * 60 * 1000);
          await dbUser.save().catch(() => {});
        }
        resultMsg = `🔒 **AI Kararı:** Kullanıcının hapis cezası **${mins} dakika** uzatıldı (${rsn}).`;
      } else if (act === "KICK") {
        if (member) await member.kick(rsn).catch(() => {});
        resultMsg = `👢 **AI Kararı:** Kullanıcı sunucudan atıldı (${rsn}).`;
      } else if (act === "BAN") {
        await guild.members.ban(userId, { reason: rsn }).catch(() => {});
        resultMsg = `🔨 **AI Kararı:** Kullanıcı sunucudan BANLANDI (${rsn}).`;
      } else {
        await jailUser(interaction.client, guild, userId, rsn, mins, interaction.user.id).catch(() => {});
        resultMsg = `🔒 **AI Kararı:** Kullanıcı **${mins} dakika** hapse atıldı (${rsn}).`;
      }

      logTrustUserActivity(interaction.client, userId, "Yapay Zeka Otomatik Cezası", resultMsg, "🤖").catch(() => {});

      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0x9b59b6)
        .setTitle("🤖 YAPAY ZEKA CEZASI İNFAZ EDİLDİ")
        .setDescription((originalEmbed?.description || "") + `\n\n> 👮 **İnfaz Eden:** ${interaction.user.toString()}\n> ${resultMsg}`);

      sendCezaLog(interaction.client, updatedEmbed).catch(() => {});
      return interaction.editReply({ embeds: [updatedEmbed], components: [] }).catch(() => {});
    }

    // ── 3. JOPLA (Hapiste Konuşmasını Kısıtla) ───────────────────────────
    if (action === "jop" || customId.startsWith("jail_jop_mute_")) {
      await interaction.deferUpdate().catch(() => {});

      if (member) {
        await member.timeout(60 * 60 * 1000, "Hapishanede Joplandınız: Konuşma kısıtlandı.").catch(() => {});
      }

      logTrustUserActivity(interaction.client, userId, "Hapishanede Joplandı", `🏏 Kullanıcının hapiste konuşması 60 dakika joplanarak kısıtlandı. Yetkili: <@${interaction.user.id}>`, "🏏").catch(() => {});

      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0xe67e22)
        .setTitle("🏏 HAPİSTE JOPLAMA GERÇEKLEŞTİRİLDİ")
        .setDescription((originalEmbed?.description || "") + `\n\n> 👮 **Yetkili:** ${interaction.user.toString()}\n> 🏏 Kullanıcının hapiste konuşması **60 dakika** joplanarak kısıtlandı.`);

      sendCezaLog(interaction.client, updatedEmbed).catch(() => {});
      return interaction.editReply({ embeds: [updatedEmbed], components: [] }).catch(() => {});
    }

    // ── 4. HAPİS SÜRESİNİ UZAT ──────────────────────────────────────────────
    if (action === "extend" || customId.startsWith("jail_extend_")) {
      await interaction.deferUpdate().catch(() => {});

      let addedMins = 60;
      if (dbUser && dbUser.jailedUntil) {
        dbUser.jailedUntil = new Date(dbUser.jailedUntil.getTime() + addedMins * 60 * 1000);
        await dbUser.save().catch(() => {});
      } else {
        await jailUser(interaction.client, guild, userId, "Hapisteyken Kural İhlali", addedMins, interaction.user.id).catch(() => {});
      }

      logTrustUserActivity(interaction.client, userId, "Hapis Süresi Uzatıldı", `🔒 Hapis cezası **+${addedMins} dakika** uzatıldı. Yetkili: <@${interaction.user.id}>`, "🔒").catch(() => {});

      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0xc0392b)
        .setTitle("🔒 HAPİS SÜRESİ UZATILDI")
        .setDescription((originalEmbed?.description || "") + `\n\n> 👮 **Yetkili:** ${interaction.user.toString()}\n> 🔒 Kullanıcının hapis cezası **+${addedMins} dakika** uzatıldı.`);

      sendCezaLog(interaction.client, updatedEmbed).catch(() => {});
      return interaction.editReply({ embeds: [updatedEmbed], components: [] }).catch(() => {});
    }

    // ── 5. UYAR ────────────────────────────────────────────────────────────
    if (action === "warn") {
      await interaction.deferUpdate().catch(() => {});
      if (member) await issueWarning(interaction, member.user, "Automod: Uygunsuz İçerik", interaction.user).catch(() => {});

      // Topluluk Elçisine DM Bildirimi
      try {
        const { sendModAuditToAmbassador } = require('./toplulukElcisiService');
        if (member) await sendModAuditToAmbassador(interaction.client, guild, interaction.user, member.user, 'Automod Uyarısı (Warn)', msgContent);
      } catch (_) {}

      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0xf1c40f)
        .setTitle("⚠️ UYARI GÖNDERİLDİ")
        .setDescription((originalEmbed?.description || "") + `\n\n> 👮 **Yetkili:** ${interaction.user.toString()}\n> ⚠️ Kullanıcıya resmi uyarı gönderildi.`);

      sendCezaLog(interaction.client, updatedEmbed).catch(() => {});
      return interaction.editReply({ embeds: [updatedEmbed], components: [] }).catch(() => {});
    }

    // ── 6. SUSTUR (MUTE) ──────────────────────────────────────────────────
    if (action === "mute") {
      await interaction.deferUpdate().catch(() => {});
      const duration = parseInt(extra, 10) || 15;
      if (member) await member.timeout(duration * 60 * 1000, "Automod: Uygunsuz İçerik").catch(() => {});

      logTrustUserActivity(interaction.client, userId, "Susturma (Mute) Uygulandı", `🔇 **Süre:** ${duration} dakika. Yetkili: <@${interaction.user.id}>`, "🔇").catch(() => {});

      // Topluluk Elçisine DM Bildirimi
      try {
        const { sendModAuditToAmbassador } = require('./toplulukElcisiService');
        if (member) await sendModAuditToAmbassador(interaction.client, guild, interaction.user, member.user, `Automod Susturma ${duration}dk`, msgContent);
      } catch (_) {}

      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0xe67e22)
        .setTitle("🔇 SUSTURMA CEZASI UYGULANDI")
        .setDescription((originalEmbed?.description || "") + `\n\n> 👮 **Yetkili:** ${interaction.user.toString()}\n> 🔇 Kullanıcı **${duration} dakika** susturuldu.`);

      sendCezaLog(interaction.client, updatedEmbed).catch(() => {});
      return interaction.editReply({ embeds: [updatedEmbed], components: [] }).catch(() => {});
    }

    // ── 7. HAPİSE AT ──────────────────────────────────────────────────────
    if (action === "immed") {
      await interaction.deferUpdate().catch(() => {});
      const duration = parseInt(extra, 10) || 30;
      await jailUser(interaction.client, guild, userId, "Automod: Uygunsuz İçerik", duration, interaction.user.id).catch(() => {});

      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0xe74c3c)
        .setTitle("🔒 HAPİS CEZASI UYGULANDI")
        .setDescription((originalEmbed?.description || "") + `\n\n> 👮 **Yetkili:** ${interaction.user.toString()}\n> 🔒 Kullanıcı **${duration} dakika** hapse atıldı.`);

      sendCezaLog(interaction.client, updatedEmbed).catch(() => {});
      return interaction.editReply({ embeds: [updatedEmbed], components: [] }).catch(() => {});
    }

    // ── 8. BANLA (BAN) & KICK (AI ÇOK AĞIR İNCELEMESİ) ─────────────────────
    if (action === "ban" || action === "kick") {
      await interaction.deferReply({ ephemeral: true }).catch(() => {});

      const targetActionStr = action === "ban" ? "YASAKLAMA (BAN)" : "SUNUCUDAN ATMA (KICK)";

      // AI Onay İncelemesi
      const severityCheckPrompt = `Sen EkoYıldız sunucusunun AI Baş Hakimisin.
Bir moderatör kullanıcıya ${targetActionStr} cezası vermek istedi.

Kullanıcının İhlal Mesajı: "${msgContent}"
Mevcut Güven Puanı: ${trustRecord.trustScore || 100}
Geçmiş İhlal Log Sayısı: ${trustRecord.scoreLogs?.length || 0}

Görevin: Bu ihlalin "${targetActionStr}" gerektirecek kadar "ÇOK AĞIR" (Ağır Küfür, Irkçılık, Tehdit, Dolandırıcılık, Sunucuya Zarar Verme, Terör/Bölücülük vb.) olup olmadığını değerlendirmektir. Hafif veya orta derece küfürlerde "isVerySevere": false olmalıdır.

YALNIZCA AŞAĞIDAKİ JSON FORMATINDA YANIT VER:
{
  "isVerySevere": true veya false,
  "reason": "AI onay veya ret açıklaması"
}`;

      const aiCheckRes = await chatWithAI([{ role: "user", content: severityCheckPrompt }], severityCheckPrompt, "automod", { max_tokens: 300, temperature: 0.1 }).catch(() => null);

      let aiResult = { isVerySevere: false, reason: "İhlal 'ÇOK AĞIR' kategorisine girmediği için ağır ceza onaylanmadı." };
      try {
        const match = aiCheckRes?.match(/\{[\s\S]*\}/);
        if (match) aiResult = JSON.parse(match[0]);
      } catch (_) {}

      // AI ONAYLAMADIYSA:
      if (!aiResult.isVerySevere) {
        return interaction.editReply({
          content: `❌ **AI Onayı Alınamadı!**\n\nYapay Zeka bu ihlali **'ÇOK AĞIR'** kategorisinde değerlendirmedi ve **${targetActionStr}** cezasını **ONAYLAMADI**.\n\n🤖 **AI Değerlendirmesi:** ${aiResult.reason || 'Lütfen Ban/Kick yerine Hapis veya Mute cezasını uygulayınız.'}`
        });
      }

      // AI ONAYLADIYSA: İNFAZ ET
      if (action === "kick") {
        if (member) await member.kick(`Automod AI Onaylı Kick: ${aiResult.reason}`).catch(() => {});
        logTrustUserActivity(interaction.client, userId, "Sunucudan Atıldı (Kick)", `👢 **Yetkili:** <@${interaction.user.id}>\n🤖 **AI Gerekçesi:** ${aiResult.reason}`, "👢").catch(() => {});
      } else {
        await guild.members.ban(userId, { reason: `Automod AI Onaylı Ban: ${aiResult.reason}` }).catch(() => {});
        logTrustUserActivity(interaction.client, userId, "Yasaklandı (Ban)", `🔨 **Yetkili:** <@${interaction.user.id}>\n🤖 **AI Gerekçesi:** ${aiResult.reason}`, "🔨").catch(() => {});
      }

      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0x900c3f)
        .setTitle(`✅ AI ONAYLI ${targetActionStr} İNFAZ EDİLDİ`)
        .setDescription((originalEmbed?.description || "") + `\n\n> 👮 **Yetkili:** ${interaction.user.toString()}\n> 🤖 **AI Onayı:** ${aiResult.reason}`);

      await interaction.message.edit({ embeds: [updatedEmbed], components: [] }).catch(() => {});
      return interaction.editReply({ content: `✅ **İşlem Başarılı!** Yapay zeka ihlali 'ÇOK AĞIR' buldu ve **${targetActionStr}** cezasını onaylayarak infaz etti.` });
    }

    return false;
  } catch (err) {
    console.error("[automodPunishmentService] Error:", err.message);
    return false;
  }
}

module.exports = {
  handleAutomodPunishmentButton
};
