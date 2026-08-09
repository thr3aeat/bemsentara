/**
 * User Audit Log Panel Service
 * Target Channel: 1535969595846819911 (Guild: 1466927911364726845)
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require("discord.js");

const { BASE_URL } = require("../../config");
const { users, tickets, courtCases, investigations } = require("../../models/Store");
const User = require("../../models/User");
const UserTrustScore = require("../../models/UserTrustScore");
const UserActivityLog = require("../../models/UserActivityLog");
const StaffProgress = require("../../models/StaffProgress");

const AUDIT_PANEL_CHANNEL_ID = "1535969595846819911";
const AUDIT_PANEL_GUILD_ID = "1466927911364726845";

/**
 * Creates the panel embed
 */
function getUserAuditPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("🕵️ Kullanıcı Detaylı Log & İnceleme Paneli")
    .setDescription(
      "Aşağıdaki **🔍 Kullanıcı Sorgula** butonuna basarak herhangi bir Discord kullanıcısının veya sunucu üyesinin tüm geçmiş hareketlerini ve detaylı verilerini anlık olarak sorgulayabilirsiniz.\n\n" +
      "**🔍 Detaylı İnceleme Kapsamı:**\n" +
      "• 📥 **Sunucuya Giriş & Çıkış Tarihleri** (Sunucuya katılma zamanı & hesap yaşı)\n" +
      "• 🔊 **Ses Kalma & Mesaj İstatistikleri** (Toplam ses süresi, attığı mesaj sayıları)\n" +
      "• ⭐ **Güven Puanı & Rütbe/Rol Durumu** (Trust Score, staff derecesi, yetkili durumu)\n" +
      "• 🎫 **Destek Talepleri & İzinler** (Açtığı biletler, personel izin geçmişi)\n" +
      "• ⚖️ **Mahkeme & Soruşturma Kayıtları** (Dava ve ceza geçmişi)\n" +
      "• 🎮 **Roblox Hesabı** (Bağlı Roblox kullanıcı adı & profili)\n" +
      "• 📜 **Canlı Web Log Linki** (Tüm geçmiş zaman çizelgesi)\n\n" +
      "*Sorgulama yapmak için butona tıklayıp kullanıcı adı veya 18 haneli Discord ID girin.*"
    )
    .setColor(0x7C6AF7)
    .setFooter({ text: "Sentara Central Audit System • Güvenlik & Denetim Paneli" })
    .setTimestamp();
}

/**
 * Creates the query button
 */
function getUserAuditPanelButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("user_audit_panel_search_btn")
      .setLabel("🔍 Kullanıcı Sorgula")
      .setStyle(ButtonStyle.Primary)
  );
}

/**
 * Ensures the audit panel message exists in the specified channel
 */
async function ensureUserAuditPanel(client) {
  try {
    if (!client || !client.isReady()) return;

    let channel = await client.channels.fetch(AUDIT_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel) {
      // Try to find across all guilds if direct fetch failed
      for (const guild of client.guilds.cache.values()) {
        const found = guild.channels.cache.get(AUDIT_PANEL_CHANNEL_ID);
        if (found) {
          channel = found;
          break;
        }
      }
    }

    if (!channel) {
      console.warn(`[UserAuditPanel] Target channel ${AUDIT_PANEL_CHANNEL_ID} not found.`);
      return;
    }

    const messages = await channel.messages.fetch({ limit: 15 }).catch(() => null);
    const existingMessage = messages ? messages.find(m => m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0].title?.includes("Kullanıcı Detaylı Log")) : null;

    const embed = getUserAuditPanelEmbed();
    const row = getUserAuditPanelButton();

    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed], components: [row] }).catch(() => {});
      console.log(`✅ [UserAuditPanel] Paneli güncellendi (#${channel.name})`);
    } else {
      await channel.send({ embeds: [embed], components: [row] });
      console.log(`✅ [UserAuditPanel] Paneli gönderildi (#${channel.name})`);
    }
  } catch (err) {
    console.error("[UserAuditPanel] ensureUserAuditPanel error:", err.message);
  }
}

/**
 * Button click handler -> Return search Modal
 */
async function handleUserAuditButton(interaction) {
  if (interaction.customId !== "user_audit_panel_search_btn") return false;

  const modal = new ModalBuilder()
    .setCustomId("user_audit_panel_modal")
    .setTitle("🔍 Kullanıcı Log Sorgulama");

  const inputRow = new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId("user_query_input")
      .setLabel("Discord Kullanıcı Adı veya ID'si")
      .setPlaceholder("Örn: ekonqtx veya 1444656401216442497")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
  );

  modal.addComponents(inputRow);
  await interaction.showModal(modal);
  return true;
}

/**
 * Helper: Formats milliseconds into readable hours/minutes
 */
function formatHoursMinutes(ms) {
  if (!ms || ms <= 0) return "0 dakika";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours} saat ${minutes} dakika`;
  }
  return `${minutes} dakika`;
}

/**
 * Modal submit handler -> Generate comprehensive audit report
 */
async function handleUserAuditModal(interaction) {
  if (interaction.customId !== "user_audit_panel_modal") return false;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const query = interaction.fields.getTextInputValue("user_query_input").trim();
  if (!query) {
    return interaction.editReply({ content: "❌ Lütfen geçerli bir kullanıcı adı veya Discord ID girin." });
  }

  const client = interaction.client;
  let targetDiscordUser = null;
  let targetMember = null;

  // 1. Try to fetch user directly by ID
  if (/^\d{17,20}$/.test(query)) {
    targetDiscordUser = await client.users.fetch(query).catch(() => null);
  }

  // 2. Try to search in database if not found by ID
  let dbUser = await User.findOne({
    $or: [
      { discordId: query },
      { discordUsername: new RegExp(`^${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { username: new RegExp(`^${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    ]
  });

  if (!targetDiscordUser && dbUser?.discordId) {
    targetDiscordUser = await client.users.fetch(dbUser.discordId).catch(() => null);
  }

  // 3. Search in guild members if still not found
  if (!targetDiscordUser) {
    for (const guild of client.guilds.cache.values()) {
      const members = await guild.members.fetch({ query, limit: 5 }).catch(() => null);
      if (members && members.size > 0) {
        targetMember = members.first();
        targetDiscordUser = targetMember.user;
        break;
      }
    }
  }

  if (!targetDiscordUser && !dbUser) {
    return interaction.editReply({ content: `❌ **"${query}"** ile eşleşen hiçbir Discord kullanıcısı bulunamadı.` });
  }

  const resolvedId = targetDiscordUser ? targetDiscordUser.id : dbUser.discordId;

  // Fetch Member across guilds
  if (!targetMember) {
    for (const guild of client.guilds.cache.values()) {
      const m = await guild.members.fetch(resolvedId).catch(() => null);
      if (m) {
        targetMember = m;
        break;
      }
    }
  }

  // Fetch all user records
  const trustRecord = await UserTrustScore.findOne({ userId: resolvedId });
  const staffProgress = await StaffProgress.findOne({ userId: resolvedId });
  const webLogs = UserActivityLog.getByUser(resolvedId, 20) || [];
  const userTickets = tickets ? (tickets.find({ userId: resolvedId }) || []) : [];
  const userCourtCases = courtCases ? (courtCases.find({ targetId: resolvedId }) || courtCases.find({ userId: resolvedId }) || []) : [];
  const userInvestigations = investigations ? (investigations.find({ targetId: resolvedId }) || investigations.find({ userId: resolvedId }) || []) : [];
  
  let userLeaves = [];
  try {
    const StaffLeave = require("../../models/StaffLeave");
    userLeaves = await StaffLeave.find({ userId: resolvedId });
  } catch (_) {}

  // Construct Data Points
  const username = targetDiscordUser ? targetDiscordUser.tag : (dbUser?.discordUsername || "Bilinmeyen Kullanıcı");
  const avatarUrl = targetDiscordUser ? targetDiscordUser.displayAvatarURL({ dynamic: true }) : (dbUser?.discordAvatar || "https://cdn.discordapp.com/embed/avatars/0.png");

  // Timestamps
  const accountCreatedTs = targetDiscordUser ? Math.floor(targetDiscordUser.createdTimestamp / 1000) : null;
  const createdStr = accountCreatedTs ? `<t:${accountCreatedTs}:F> (<t:${accountCreatedTs}:R>)` : "Bilinmiyor";

  let serverJoinStr = "❌ Sunucuda Değil / Ayrılmış";
  if (targetMember && targetMember.joinedTimestamp) {
    const joinedTs = Math.floor(targetMember.joinedTimestamp / 1000);
    serverJoinStr = `✅ <t:${joinedTs}:F> (<t:${joinedTs}:R>)`;
  }

  // Voice & Chat Activity
  const voiceTimeMs = staffProgress?.voiceTime || trustRecord?.totalVoiceTime || 0;
  const totalVoiceStr = formatHoursMinutes(voiceTimeMs);
  const totalMessages = staffProgress?.totalMessages || staffProgress?.messageCount || trustRecord?.totalMessages || 0;

  // Trust Score & Staff Level
  const trustScore = trustRecord ? trustRecord.trustScore.toFixed(1) : "100.0";
  const modLevel = dbUser?.modLevel || staffProgress?.level || 0;
  const modStatus = dbUser?.modStatus || staffProgress?.status || "active";
  const modStatusStr = modStatus === 'active' ? '🟢 Aktif' : modStatus === 'paused' ? '⏸️ Duraklatıldı' : '🔴 Ayrıldı';

  // Roblox details
  const robloxName = dbUser?.robloxUsername || "Bağlı Değil";
  const robloxId = dbUser?.robloxId || null;
  const robloxProfileUrl = robloxId ? `[${robloxName} (ID: ${robloxId})](https://www.roblox.com/users/${robloxId}/profile)` : robloxName;

  // Infractions & Ban Status
  const isBanned = dbUser?.isBanned || false;
  const banStatusStr = isBanned ? "🚫 SİTEDEN / SUNUCUDAN YASAKLI" : "🟢 Temiz (Aktif Cezası Yok)";

  // Embed Construction
  const embed = new EmbedBuilder()
    .setTitle(`🕵️ Kullanıcı Denetim Raporu: ${username}`)
    .setThumbnail(avatarUrl)
    .setColor(isBanned ? 0xFB7185 : 0x7C6AF7)
    .addFields(
      {
        name: "👤 Kullanıcı Kimliği",
        value: `• **Discord Adı:** ${username}\n` +
               `• **Discord ID:** \`${resolvedId}\`\n` +
               `• **Hesap Açılış:** ${createdStr}\n` +
               `• **Sunucuya Giriş:** ${serverJoinStr}`,
        inline: false
      },
      {
        name: "📊 Ses & Mesaj Aktifliği",
        value: `• 🔊 **Toplam Ses Süresi:** \`${totalVoiceStr}\`\n` +
               `• 💬 **Toplam Mesaj:** \`${totalMessages.toLocaleString('tr-TR')} mesaj\``,
        inline: true
      },
      {
        name: "⭐ Güven Puanı & Rütbe",
        value: `• **Güven Puanı:** ⭐ \`${trustScore} / 500\`\n` +
               `• **Yetkili Seviyesi:** Level ${modLevel} (${modStatusStr})`,
        inline: true
      },
      {
        name: "🎮 Roblox Hesabı",
        value: `• **Roblox:** ${robloxProfileUrl}`,
        inline: true
      },
      {
        name: "📋 Destek, İzin & Dava İstatistikleri",
        value: `• 🎫 **Açtığı Biletler:** \`${userTickets.length} adet\`\n` +
               `• 🏛️ **Dava / Soruşturma:** \`${userCourtCases.length + userInvestigations.length} kayıt\`\n` +
               `• 🏖️ **Personel İzinleri:** \`${userLeaves.length} talep\`\n` +
               `• 🛡️ **Ceza Durumu:** ${banStatusStr}`,
        inline: false
      }
    );

  // Recent History Timeline Snippet
  const scoreLogs = trustRecord?.scoreLogs || [];
  const recentTimeline = [];

  scoreLogs.slice(-5).reverse().forEach(l => {
    recentTimeline.push(`⭐ **[Güven Puanı]** ${l.amount >= 0 ? '+' : ''}${l.amount.toFixed(1)} TS (${l.reason || 'Sistem'}) — <t:${Math.floor(new Date(l.timestamp).getTime() / 1000)}:R>`);
  });

  webLogs.slice(0, 5).forEach(w => {
    if (w.activityType === 'command') {
      recentTimeline.push(`💬 **[Komut]** /${w.details?.commandName || 'komut'} — <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>`);
    } else if (w.activityType === 'mod_action') {
      recentTimeline.push(`⚖️ **[Mod İşlemi]** ${w.details?.action || 'İşlem'} — <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>`);
    }
  });

  if (recentTimeline.length > 0) {
    embed.addFields({
      name: "📜 Son Hareketler (Özet)",
      value: recentTimeline.slice(0, 6).join("\n"),
      inline: false
    });
  }

  // Web Portal Link Button
  const webLogUrl = `${BASE_URL}/user-logs/${resolvedId}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("📜 Tüm Detaylı Canlı Logları Gör (Web)")
      .setStyle(ButtonStyle.Link)
      .setURL(webLogUrl)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
  return true;
}

module.exports = {
  AUDIT_PANEL_CHANNEL_ID,
  AUDIT_PANEL_GUILD_ID,
  ensureUserAuditPanel,
  handleUserAuditButton,
  handleUserAuditModal,
};
