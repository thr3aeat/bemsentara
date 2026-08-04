const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const UserTrustScore = require("../../../models/UserTrustScore");
const ModPerformance = require("../../../models/ModPerformance");

const ACTIVE_GUILD_ID = "1367646464804655104"; // EKO YILDIZ
const RECORD_GUILD_ID = "1466927911364726845"; // Profile Channels Guild
const RECORD_CATEGORY_ID = "1533884763507789965"; // Category ID

/**
 * Ensures user has a trust score record and a dynamic log channel.
 */
async function ensureUserTrustScore(userId, guildId, client) {
  try {
    let record = await UserTrustScore.findOne({ userId });
    let isNew = false;
    
    if (!record) {
      isNew = true;
      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) return null;

      let score = 100.0;
      const ageMs = Date.now() - user.createdTimestamp;
      const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44);
      const scoreLogs = [];

      // Account age bonus
      if (ageMonths > 6) {
        score += 5.0;
        scoreLogs.push({
          amount: 5.0,
          reason: "Bonus: Hesap Yaşı > 6 Ay",
          operatorId: "SYSTEM",
          timestamp: new Date()
        });
      }

      // Booster check
      const activeGuild = await client.guilds.fetch(ACTIVE_GUILD_ID).catch(() => null);
      if (activeGuild) {
        const member = await activeGuild.members.fetch(userId).catch(() => null);
        if (member && member.premiumSince) {
          score += 10.0;
          scoreLogs.push({
            amount: 10.0,
            reason: "Bonus: Sunucu Takviyesi (Booster)",
            operatorId: "SYSTEM",
            timestamp: new Date()
          });
        }
      }

      record = await UserTrustScore.create({
        userId,
        username: user.username,
        trustScore: score,
        scoreLogs,
        createdAt: new Date(),
      });
    }

    // Check if channel exists on logging guild
    const recordGuild = await client.guilds.fetch(RECORD_GUILD_ID).catch(() => null);
    if (recordGuild) {
      let channel = null;
      if (record.profileChannelId) {
        channel = await recordGuild.channels.fetch(record.profileChannelId).catch(() => null);
      }

      if (!channel) {
        // Create dynamic channel
        channel = await recordGuild.channels.create({
          name: `${record.userId}-${record.username.slice(0, 20)}`,
          type: ChannelType.GuildText,
          parent: RECORD_CATEGORY_ID,
          permissionOverwrites: [
            {
              id: recordGuild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            }
          ],
          reason: `Güvenlik Profili: ${record.username}`
        }).catch((err) => {
          console.error("[TrustScore] Channel creation failed:", err.message);
          return null;
        });

        if (channel) {
          record.profileChannelId = channel.id;
          await record.save();

          // Send initial embed message
          const embed = await buildProfileEmbed(record, client);
          const buttons = buildActionButtons(record.userId);
          const msg = await channel.send({ embeds: [embed], components: [buttons] }).catch(() => null);
          if (msg) {
            await msg.pin().catch(() => {});
            record.profileMessageId = msg.id;
            await record.save();
          }
        }
      }
    }

    return record;
  } catch (err) {
    console.error("[TrustScore] ensureUserTrustScore error:", err);
    return null;
  }
}

/**
 * Updates trust score and refreshes profile channel.
 */
async function updateTrustScore(userId, amount, reason, operatorId, client) {
  try {
    const record = await ensureUserTrustScore(userId, ACTIVE_GUILD_ID, client);
    if (!record) return;

    // Reset daily points if day changed
    const todayStr = new Date().toISOString().split('T')[0];
    if (record.lastPointsResetDate !== todayStr) {
      record.dailyChatPoints = 0.0;
      record.dailyVoicePoints = 0.0;
      record.lastPointsResetDate = todayStr;
    }

    // Apply cap constraints for SYSTEM updates (chat and voice)
    if (operatorId === "SYSTEM") {
      if (reason.includes("Sohbet")) {
        if (record.dailyChatPoints >= 5.0) return; // Daily cap reached
        record.dailyChatPoints = Math.min(record.dailyChatPoints + amount, 5.0);
      } else if (reason.includes("Sesli")) {
        if (record.dailyVoicePoints >= 5.0) return; // Daily cap reached
        record.dailyVoicePoints = Math.min(record.dailyVoicePoints + amount, 5.0);
      }
    }

    // Calculate new score
    const oldScore = record.trustScore;
    let newScore = parseFloat((oldScore + amount).toFixed(2));
    newScore = Math.max(0.0, Math.min(newScore, 500.0)); // Constraint: 0 to 500

    record.trustScore = newScore;
    record.scoreLogs.push({
      amount,
      reason,
      operatorId,
      timestamp: new Date()
    });

    await record.save();

    // Trigger role updates on EKO YILDIZ
    const activeGuild = await client.guilds.fetch(ACTIVE_GUILD_ID).catch(() => null);
    if (activeGuild) {
      const member = await activeGuild.members.fetch(userId).catch(() => null);
      if (member) {
        await updateMemberRoles(member, newScore);
      }
    }

    // Update Profile Channel Embed
    await updateProfileEmbed(record, client);

  } catch (err) {
    console.error("[TrustScore] updateTrustScore error:", err);
  }
}

/**
 * Awards points to a moderator.
 */
async function addModPoints(moderatorId, amount, reason) {
  try {
    let modPerf = await ModPerformance.findOne({ moderatorId });
    if (!modPerf) {
      modPerf = await ModPerformance.create({
        moderatorId,
        points: 0.0,
      });
    }

    modPerf.points = parseFloat((modPerf.points + amount).toFixed(2));
    if (reason.includes("İşlem")) {
      modPerf.actionsCount = (modPerf.actionsCount || 0) + 1;
    } else if (reason.includes("Bilet") || reason.includes("Ticket")) {
      modPerf.ticketsClosedCount = (modPerf.ticketsClosedCount || 0) + 1;
    }

    modPerf.modLogs.push({
      amount,
      reason,
      timestamp: new Date()
    });

    await modPerf.save();
    console.log(`[ModPerformance] Moderator ${moderatorId} earned +${amount} points (${reason}). Total: ${modPerf.points}`);
  } catch (err) {
    console.error("[TrustScore] addModPoints error:", err);
  }
}

/**
 * Checks if a moderator is trying to manually change a user's score too many times (cap: 2 times per 1 hour).
 */
async function checkModAbuseLimit(moderatorId, targetUserId) {
  try {
    const record = await UserTrustScore.findOne({ userId: targetUserId });
    if (!record) return false;

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const manualActions = record.scoreLogs.filter(log => 
      log.operatorId === moderatorId && 
      new Date(log.timestamp).getTime() > oneHourAgo
    );

    return manualActions.length >= 2;
  } catch (err) {
    return false;
  }
}

/**
 * Formats trust status and color.
 */
function getTrustStatus(score) {
  if (score < 50.0) return { name: "🔴 Yüksek Risk", color: 0xFF0000 };
  if (score < 100.0) return { name: "🟡 Şüpheli / Yeni", color: 0xFFA500 };
  if (score < 150.0) return { name: "🟢 Güvenilir Üye", color: 0x00FF00 };
  return { name: "👑 Topluluk VIP", color: 0x7c6af7 };
}

/**
 * Builds the profile embed message.
 */
async function buildProfileEmbed(record, client) {
  const status = getTrustStatus(record.trustScore);
  const user = await client.users.fetch(record.userId).catch(() => null);

  const embed = new EmbedBuilder()
    .setTitle(`👤 Güvenlik Sicil & Profil Kartı: ${record.username}`)
    .setColor(status.color)
    .setThumbnail(user ? user.displayAvatarURL({ dynamic: true }) : null)
    .addFields(
      { name: "👤 Kullanıcı", value: `<@${record.userId}> (\`${record.userId}\`)`, inline: true },
      { name: "📊 Güven Skoru", value: `**${record.trustScore.toFixed(1)} / 500**`, inline: true },
      { name: "⚖️ Seviye / Durum", value: `**${status.name}**`, inline: true },
      { name: "💬 Sohbet İlerlemesi", value: `\`${record.messageCount} / 50\` mesaj`, inline: true },
      { name: "📅 Günlük Puanlar", value: `Chat: \`${record.dailyChatPoints.toFixed(1)}/5.0\`\nVoice: \`${record.dailyVoicePoints.toFixed(1)}/5.0\``, inline: true },
      { name: "📝 Son Güncelleme", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
    )
    .setTimestamp();

  // Add last 10 logs
  const logs = record.scoreLogs.slice(-10).reverse();
  if (logs.length > 0) {
    const logsStr = logs.map(l => 
      `• **[${l.amount >= 0 ? "+" : ""}${l.amount.toFixed(1)}]** ${l.reason} (<@${l.operatorId}>) - *<t:${Math.floor(new Date(l.timestamp).getTime() / 1000)}:R>*`
    ).join("\n");
    embed.addFields({ name: "📜 Son Puan Hareketleri (Sicil)", value: logsStr, inline: false });
  } else {
    embed.addFields({ name: "📜 Son Puan Hareketleri (Sicil)", value: "*Henüz bir puan hareketi bulunmuyor.*", inline: false });
  }

  return embed;
}

/**
 * Updates profile embed on logging guild.
 */
async function updateProfileEmbed(record, client) {
  try {
    const recordGuild = await client.guilds.fetch(RECORD_GUILD_ID).catch(() => null);
    if (!recordGuild || !record.profileChannelId || !record.profileMessageId) return;

    const channel = await recordGuild.channels.fetch(record.profileChannelId).catch(() => null);
    if (channel) {
      const msg = await channel.messages.fetch(record.profileMessageId).catch(() => null);
      if (msg) {
        const embed = await buildProfileEmbed(record, client);
        const buttons = buildActionButtons(record.userId);
        await msg.edit({ embeds: [embed], components: [buttons] }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[TrustScore] Embed update failed:", err.message);
  }
}

/**
 * Builds interaction buttons.
 */
function buildActionButtons(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`trust_add_${userId}`)
      .setLabel("🟢 Güven Puanı Ekle")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`trust_sub_${userId}`)
      .setLabel("🔴 Güven Puanı Düşür")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`trust_logs_${userId}`)
      .setLabel("📜 Geçmiş Sicil")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`trust_reset_${userId}`)
      .setLabel("🔄 Skoru Sıfırla")
      .setStyle(ButtonStyle.Secondary)
  );
}

/**
 * Updates roles on Active Guild based on score.
 */
async function updateMemberRoles(member, score) {
  try {
    const guild = member.guild;

    // Fetch or create roles
    const highRiskRole = guild.roles.cache.find(r => r.name === "Yüksek Risk") || 
                         await guild.roles.create({
                           name: "Yüksek Risk",
                           color: "#ff0000",
                           reason: "Güvenlik Sistemi: Yüksek Risk Seviyesi"
                         }).catch(() => null);

    const trustedRole = guild.roles.cache.find(r => r.name === "Güvenilir Üye") || 
                        await guild.roles.create({
                          name: "Güvenilir Üye",
                          color: "#3498db",
                          reason: "Güvenlik Sistemi: Güvenilir Üye"
                        }).catch(() => null);

    const vipRole = guild.roles.cache.find(r => r.name === "Topluluk VIP") || 
                    await guild.roles.create({
                      name: "Topluluk VIP",
                      color: "#f1c40f",
                      reason: "Güvenlik Sistemi: Topluluk VIP"
                    }).catch(() => null);

    // Apply role checks
    if (score < 50.0) {
      if (highRiskRole && !member.roles.cache.has(highRiskRole.id)) {
        await member.roles.add(highRiskRole).catch(() => {});
        // Restrict channel overrides dynamically if needed, or simply role settings deny EmbedLinks/AttachFiles.
      }
    } else {
      if (highRiskRole && member.roles.cache.has(highRiskRole.id)) {
        await member.roles.remove(highRiskRole).catch(() => {});
      }
    }

    if (score >= 100.0 && score < 150.0) {
      if (trustedRole && !member.roles.cache.has(trustedRole.id)) {
        await member.roles.add(trustedRole).catch(() => {});
      }
    } else {
      if (trustedRole && member.roles.cache.has(trustedRole.id)) {
        await member.roles.remove(trustedRole).catch(() => {});
      }
    }

    if (score >= 150.0) {
      if (vipRole && !member.roles.cache.has(vipRole.id)) {
        await member.roles.add(vipRole).catch(() => {});
      }
    } else {
      if (vipRole && member.roles.cache.has(vipRole.id)) {
        await member.roles.remove(vipRole).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[TrustScore] Role update failed:", err.message);
  }
}

/**
 * Handles clicks of profile channel buttons.
 */
async function handleTrustButtons(interaction) {
  try {
    const customId = interaction.customId;
    const parts = customId.split("_");
    const action = parts[1]; // add, sub, logs, reset
    const targetUserId = parts[2];
    
    if (action === "logs") {
      await interaction.deferReply({ ephemeral: true });
      const record = await UserTrustScore.findOne({ userId: targetUserId });
      if (!record) {
        return interaction.editReply("❌ Kullanıcı bulunamadı.");
      }

      const status = getTrustStatus(record.trustScore);
      const logList = record.scoreLogs.slice(-25).reverse();
      const logsStr = logList.length > 0 
        ? logList.map(l => `• **[${l.amount >= 0 ? "+" : ""}${l.amount.toFixed(1)}]** ${l.reason} (<@${l.operatorId}>) - <t:${Math.floor(new Date(l.timestamp).getTime() / 1000)}:R>`).join("\n")
        : "*Hiçbir puan hareketi kaydı bulunamadı.*";

      const embed = new EmbedBuilder()
        .setTitle(`📜 Güvenlik Puan Geçmişi: ${record.username}`)
        .setColor(status.color)
        .setDescription(
          `**Güncel Skor:** \`${record.trustScore.toFixed(1)} / 500\`\n` +
          `**Mevcut Durum:** \`${status.name}\`\n\n` +
          `**Son 25 Puan Hareketi:**\n${logsStr}`
        )
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    }

    if (action === "reset") {
      // High-rank check (Administrator permission)
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "❌ Skoru sıfırlamak için Yönetici yetkisine sahip olmalısınız!", ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      await updateTrustScore(targetUserId, 100.0 - (await getScore(targetUserId)), "Skor Yönetim Tarafından Sıfırlandı", interaction.user.id, interaction.client);
      return interaction.editReply("✅ Kullanıcı güven puanı başarıyla 100.0 (Taban) olarak sıfırlandı.");
    }

    // Modal show for add / sub
    const isAdd = action === "add";
    const modal = new ModalBuilder()
      .setCustomId(`trust_modal_${action}_${targetUserId}`)
      .setTitle(isAdd ? "🟢 Güven Puanı Ekle" : "🔴 Güven Puanı Düşür");

    const amountInput = new TextInputBuilder()
      .setCustomId("trust_modal_amount")
      .setLabel("Miktar (Örn: 0.5, 5.0, 10.0)")
      .setPlaceholder(isAdd ? "Eklenecek puan miktarı" : "Düşürülecek puan miktarı (pozitif sayı girin)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId("trust_modal_reason")
      .setLabel("Gerekçe / Sebep")
      .setPlaceholder("Lütfen işlem sebebini detaylıca yazın")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    modal.addComponents(
      new ActionRowBuilder().addComponents(amountInput),
      new ActionRowBuilder().addComponents(reasonInput)
    );

    return interaction.showModal(modal);

  } catch (err) {
    console.error("[TrustScore] handleTrustButtons error:", err);
    await interaction.reply({ content: "❌ İşlem yapılırken hata oluştu.", ephemeral: true }).catch(() => {});
  }
}

/**
 * Helper to get current score of a user.
 */
async function getScore(userId) {
  const r = await UserTrustScore.findOne({ userId });
  return r ? r.trustScore : 100.0;
}

/**
 * Handles manual adjustments modals.
 */
async function handleTrustModals(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    const customId = interaction.customId;
    const parts = customId.split("_");
    const action = parts[2]; // add, sub
    const targetUserId = parts[3];

    const amountVal = parseFloat(interaction.fields.getTextInputValue("trust_modal_amount"));
    const reason = interaction.fields.getTextInputValue("trust_modal_reason");

    if (isNaN(amountVal) || amountVal <= 0) {
      return interaction.editReply("❌ Lütfen geçerli bir pozitif sayı girin.");
    }

    // Abuse protection check
    const isLimitExceeded = await checkModAbuseLimit(interaction.user.id, targetUserId);
    if (isLimitExceeded) {
      return interaction.editReply("❌ Bir kullanıcıya 1 saat içinde en fazla 2 kez manuel puan işlemi uygulayabilirsiniz! Suistimal engellendi.");
    }

    const isAdd = action === "add";
    const finalAmount = isAdd ? amountVal : -amountVal;

    await updateTrustScore(targetUserId, finalAmount, `Manuel Düzenleme: ${reason}`, interaction.user.id, interaction.client);
    
    return interaction.editReply(`✅ Başarıyla <@${targetUserId}> kullanıcısına **${isAdd ? "+" : ""}${finalAmount.toFixed(1)}** puan uygulandı.`);

  } catch (err) {
    console.error("[TrustScore] handleTrustModals error:", err);
    return interaction.editReply("❌ İşlem sırasında bir hata oluştu.").catch(() => {});
  }
}

/**
 * Periodically scans voice channels to award points (every 30 mins -> +0.5).
 */
async function scanVoiceChannels(client) {
  try {
    const activeGuild = await client.guilds.fetch(ACTIVE_GUILD_ID).catch(() => null);
    if (!activeGuild) return;

    console.log("[TrustScore] Ses kanalları taranıyor...");

    for (const channel of activeGuild.channels.cache.values()) {
      if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
        for (const member of channel.members.values()) {
          if (member.user.bot) continue;

          // Award +0.5 voice points (checking caps inside updateTrustScore)
          await updateTrustScore(member.id, 0.5, "Sesli Kanal Aktifliği (30 Dk)", "SYSTEM", client);
        }
      }
    }
  } catch (err) {
    console.error("[TrustScore] scanVoiceChannels error:", err.message);
  }
}

module.exports = {
  ensureUserTrustScore,
  updateTrustScore,
  addModPoints,
  checkModAbuseLimit,
  handleTrustButtons,
  handleTrustModals,
  scanVoiceChannels,
};
