const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const UserTrustScore = require("../../../models/UserTrustScore");
const ModPerformance = require("../../../models/ModPerformance");
const User = require("../../../models/User");

const ACTIVE_GUILD_ID = "1367646464804655104"; // EKO YILDIZ
const RECORD_GUILD_ID = "1466927911364726845"; // Profile Channels Guild
const RECORD_CATEGORY_ID = "1533884763507789965"; // Category ID

// In-memory mutex/lock set to prevent race condition channel creation
const activeChannelCreationLocks = new Set();

/**
 * Safely pushes a log entry and caps scoreLogs array to 100 items max.
 */
function pushScoreLog(record, logEntry) {
  if (!record.scoreLogs) record.scoreLogs = [];
  record.scoreLogs.push(logEntry);
  if (record.scoreLogs.length > 100) {
    record.scoreLogs = record.scoreLogs.slice(-100);
  }
}

/**
 * Ensures user has a trust score record and a dynamic log channel.
 */
async function ensureUserTrustScore(userId, guildId, client, forceCreate = false) {
  try {
    let record = await UserTrustScore.findOne({ userId });
    let isNew = false;
    
    if (!record) {
      isNew = true;
      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) return null;

      record = await UserTrustScore.create({
        userId,
        username: user.username,
        trustScore: 100.0,
        scoreLogs: [],
        createdAt: new Date(),
        lastActiveTimestamp: new Date(),
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Check Discord account age kıdem
    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
      const ageYears = (Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYears >= 3 && record.bonusAccountAge < 10) {
        const diff = 10.0 - record.bonusAccountAge;
        record.bonusAccountAge = 10;
        record.trustScore = parseFloat((record.trustScore + diff).toFixed(2));
        pushScoreLog(record, {
          amount: diff,
          reason: "Kıdem: 3 Yıldan Eski Discord Hesabı",
          operatorId: "SYSTEM",
          timestamp: new Date()
        });
      } else if (ageYears >= 1 && ageYears < 3 && record.bonusAccountAge < 5) {
        const diff = 5.0 - record.bonusAccountAge;
        record.bonusAccountAge = 5;
        record.trustScore = parseFloat((record.trustScore + diff).toFixed(2));
        pushScoreLog(record, {
          amount: diff,
          reason: "Kıdem: 1 Yıldan Eski Discord Hesabı",
          operatorId: "SYSTEM",
          timestamp: new Date()
        });
      }
    }

    // Check Eko Yıldız sunucu katılım süresi kıdem
    const activeGuild = await client.guilds.fetch(ACTIVE_GUILD_ID).catch(() => null);
    if (activeGuild) {
      const member = await activeGuild.members.fetch(userId).catch(() => null);
      if (member && member.joinedTimestamp) {
        const joinMonths = (Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24 * 30.44);
        if (joinMonths >= 6 && record.bonusJoinAge < 15) {
          const diff = 15.0 - record.bonusJoinAge;
          record.bonusJoinAge = 15;
          record.trustScore = parseFloat((record.trustScore + diff).toFixed(2));
          pushScoreLog(record, {
            amount: diff,
            reason: "Kıdem: Sunucuda 6. Ayını Doldurma",
            operatorId: "SYSTEM",
            timestamp: new Date()
          });
        } else if (joinMonths >= 1 && joinMonths < 6 && record.bonusJoinAge < 5) {
          const diff = 5.0 - record.bonusJoinAge;
          record.bonusJoinAge = 5;
          record.trustScore = parseFloat((record.trustScore + diff).toFixed(2));
          pushScoreLog(record, {
            amount: diff,
            reason: "Kıdem: Sunucuda 1. Ayını Doldurma",
            operatorId: "SYSTEM",
            timestamp: new Date()
          });
        }
      }
    }

    // Check 2FA bonus from web DB User
    if (!record.bonus2FA) {
      const dbUser = await User.findOne({ discordId: userId });
      if (dbUser && dbUser.mfaEnabled) {
        record.bonus2FA = true;
        record.trustScore = parseFloat((record.trustScore + 5.0).toFixed(2));
        pushScoreLog(record, {
          amount: 5.0,
          reason: "Bonus: İki Faktörlü Doğrulama (2FA) Aktif",
          operatorId: "SYSTEM",
          timestamp: new Date()
        });
      }
    }

    // Check Phone verification bonus from web DB User
    if (!record.bonusPhone) {
      const dbUser = await User.findOne({ discordId: userId });
      if (dbUser && dbUser.phoneVerified) {
        record.bonusPhone = true;
        record.trustScore = parseFloat((record.trustScore + 10.0).toFixed(2));
        pushScoreLog(record, {
          amount: 10.0,
          reason: "Bonus: Telefon Numarası Doğrulanmış",
          operatorId: "SYSTEM",
          timestamp: new Date()
        });
      }
    }

    await record.save();

    // Check if channel exists on logging guild
    const recordGuild = await client.guilds.fetch(RECORD_GUILD_ID).catch(() => null);
    if (recordGuild) {
      let channel = null;
      if (record.profileChannelId) {
        channel = await recordGuild.channels.fetch(record.profileChannelId).catch(() => null);
        if (!channel) {
          // Channel was previously recorded but deleted/closed!
          record.profileChannelClosed = true;
          record.profileChannelId = null;
          record.profileMessageId = null;
          await record.save();
        }
      }

      // ONLY create a new channel IF:
      // 1) forceCreate === true (e.g. explicitly requested by mod/command), OR
      // 2) User is in High Risk (< 50.0) AND profileChannelClosed is NOT true
      const shouldCreate = forceCreate || (record.trustScore < 50.0 && !record.profileChannelClosed && !record.profileChannelId);

      if (!channel && shouldCreate) {
        // Prevent race condition duplicate channel creation via in-memory lock
        if (activeChannelCreationLocks.has(userId)) {
          return record;
        }
        activeChannelCreationLocks.add(userId);

        try {
          const permissionOverwrites = [
            {
              id: recordGuild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            }
          ];

          let modRoles = [];
          if (recordGuild.roles && recordGuild.roles.cache && typeof recordGuild.roles.cache.filter === 'function') {
            modRoles = recordGuild.roles.cache.filter(r => 
              (r.permissions && typeof r.permissions.has === 'function' && 
               (r.permissions.has(PermissionFlagsBits.ModerateMembers) || r.permissions.has(PermissionFlagsBits.ManageMessages))) ||
              (r.name && (
                r.name.toLowerCase().includes("mod") ||
                r.name.toLowerCase().includes("yetkili") ||
                r.name.toLowerCase().includes("staff") ||
                r.name.toLowerCase().includes("admin")
              ))
            );
          }

          for (const role of modRoles.values()) {
            permissionOverwrites.push({
              id: role.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ]
            });
          }

          const cleanName = record.username.toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 100) || 'kullanici';

          // Create dynamic channel
          channel = await recordGuild.channels.create({
            name: cleanName,
            type: ChannelType.GuildText,
            parent: RECORD_CATEGORY_ID,
            permissionOverwrites,
            reason: `Güvenlik Profili: ${record.username}`
          }).catch((err) => {
            console.error("[TrustScore] Channel creation failed:", err.message);
            return null;
          });

          if (channel) {
            record.profileChannelId = channel.id;
            record.profileChannelClosed = false;
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
        } finally {
          activeChannelCreationLocks.delete(userId);
        }
      }
    }

    return record;

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

    // ── 6. Dinamik Ceza Katlayıcısı (Risk Scaled Penalty) ──
    let finalAmount = amount;
    if (finalAmount < 0 && operatorId === "SYSTEM") {
      record.lastViolationDate = new Date();
      if (record.trustScore < 30.0) {
        // Yüksek Risk (< 30 TS): 1.5x ceza katlayıcısı
        finalAmount = parseFloat((finalAmount * 1.5).toFixed(2));
      } else if (record.trustScore >= 80.0) {
        // Güvenilir Üye (>= 80 TS): İlk ihlallerde 0.8x yumuşatma
        finalAmount = parseFloat((finalAmount * 0.8).toFixed(2));
      }
    }

    // Reset af progress if they get penalized
    if (finalAmount < 0 && record.afProgress && record.afProgress.active) {
      record.afProgress.daysCompleted = 0;
      record.afProgress.messagesToday = 0;
      record.afProgress.lastPenaltyDate = new Date();
    }

    // Calculate new score
    const oldScore = record.trustScore;
    let newScore = parseFloat((oldScore + finalAmount).toFixed(2));
    newScore = Math.max(0.0, Math.min(newScore, 500.0)); // Constraint: 0 to 500

    record.trustScore = newScore;
    pushScoreLog(record, {
      amount: finalAmount,
      reason,
      operatorId,
      timestamp: new Date()
    });

    // Check if score falls below 50.0 to trigger Af task
    if (newScore >= 50.0 && record.afProgress) {
      record.afProgress.status = null;
      record.afProgress.completedAt = null;
    }

    if (newScore < 50.0) {
      const isAlreadyActive = record.afProgress && record.afProgress.active;
      const isRecentlyCompleted = record.afProgress && record.afProgress.status === 'completed';
      
      if (!isAlreadyActive && !isRecentlyCompleted) {
        record.afProgress = {
          active: true,
          daysCompleted: 0,
          messagesToday: 0,
          lastMessageDay: todayStr,
          lastPenaltyDate: null,
          status: 'active',
          completedAt: null
        };
      }
    }

    await record.save();

    // Log to their profile channel
    if (record.profileChannelId) {
      const recordGuild = await client.guilds.fetch(RECORD_GUILD_ID).catch(() => null);
      if (recordGuild) {
        const channel = await recordGuild.channels.fetch(record.profileChannelId).catch(() => null);
        if (channel) {
          const operatorMention = operatorId === "SYSTEM" ? "SYSTEM" : `<@${operatorId}>`;
          const prefix = amount >= 0 ? "🟢 **[Puan Ekleme]**" : "🔴 **[Puan Düşürme]**";
          await channel.send(`${prefix}\n**İşlem Yapan:** ${operatorMention}\n**Sebep:** ${reason}\n**Miktar:** ${amount >= 0 ? "+" : ""}${amount.toFixed(1)} TS`).catch(() => {});
        }
      }
    }

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
 * Increments messages for the Af Mission (Ceza Bitirme Görevi).
 */
async function incrementAfProgress(userId, client) {
  try {
    const record = await ensureUserTrustScore(userId, ACTIVE_GUILD_ID, client);
    if (!record || !record.afProgress || !record.afProgress.active) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Reset messages if new day
    if (record.afProgress.lastMessageDay !== todayStr) {
      record.afProgress.messagesToday = 0;
    }

    record.afProgress.messagesToday = (record.afProgress.messagesToday || 0) + 1;
    record.afProgress.lastMessageDay = todayStr;

    if (record.afProgress.messagesToday === 20) {
      record.afProgress.daysCompleted = (record.afProgress.daysCompleted || 0) + 1;
      
      // Log to their channel
      if (record.profileChannelId) {
        const recordGuild = await client.guilds.fetch(RECORD_GUILD_ID).catch(() => null);
        if (recordGuild) {
          const channel = await recordGuild.channels.fetch(record.profileChannelId).catch(() => null);
          if (channel) {
            await channel.send(`📈 **[Ceza Bitirme Görevi]** <@${userId}> bugünün görevini tamamladı (20 mesaj). **Gün: ${record.afProgress.daysCompleted}/3**`).catch(() => {});
          }
        }
      }

      if (record.afProgress.daysCompleted >= 3) {
        record.afProgress.active = false;
        record.afProgress.daysCompleted = 0;
        record.afProgress.messagesToday = 0;
        record.afProgress.lastMessageDay = null;
        record.afProgress.status = 'completed';
        record.afProgress.completedAt = new Date();
        
        await record.save();
        await updateTrustScore(userId, 10.0, "Görev Tamamlandı: Ceza Bitirme Görevi (+10.0)", "SYSTEM", client);
      } else {
        await record.save();
      }
    } else {
      await record.save();
    }
  } catch (err) {
    console.error("[TrustScore] incrementAfProgress error:", err);
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

function getProgressBar(pct) {
  const totalBlocks = 10;
  const filledBlocks = Math.max(0, Math.min(totalBlocks, Math.round((pct / 100) * totalBlocks)));
  const emptyBlocks = totalBlocks - filledBlocks;
  return `\`[${"█".repeat(filledBlocks)}${"░".repeat(emptyBlocks)}]\` **${pct.toFixed(0)}%**`;
}

/**
 * Builds the profile embed message.
 */
async function buildProfileEmbed(record, client) {
  const status = getTrustStatus(record.trustScore);
  const user = await client.users.fetch(record.userId).catch(() => null);

  const pct = (record.trustScore / 500) * 100;
  const progressBar = getProgressBar(pct);

  const embed = new EmbedBuilder()
    .setTitle(`🛡️ Güvenlik Sicili ve Profil Analizi: ${record.username}`)
    .setDescription(
      `Bu kanal, **${record.username}** kullanıcısının sunucu içerisindeki davranışsal güvenliğini ve sicil geçmişini izlemek amacıyla otonom olarak oluşturulmuştur.\n\n` +
      `**Skor İlerleme Çubuğu:**\n${progressBar}\n`
    )
    .setColor(status.color)
    .setThumbnail(user ? user.displayAvatarURL({ dynamic: true }) : null)
    .addFields(
      { name: "👤 Kullanıcı", value: `<@${record.userId}>`, inline: true },
      { name: "📊 Güven Skoru", value: `\`${record.trustScore.toFixed(1)} / 500.0\``, inline: true },
      { name: "⚖️ Güvenlik Kademesi", value: `**${status.name}**`, inline: true },
      { name: "💬 Sohbet İlerlemesi", value: `\`${record.messageCount} / 50\` mesaj`, inline: true },
      { name: "📅 Günlük Limitler", value: `💬 Chat: \`${record.dailyChatPoints.toFixed(1)}/5.0\`\n🎤 Voice: \`${record.dailyVoicePoints.toFixed(1)}/5.0\``, inline: true },
      { name: "🔥 Günlük Streak", value: `\`${record.dailyStreak || 0}\` gün`, inline: true }
    )
    .addFields(
      {
        name: "🔑 Güvenlik & Doğrulama Rozetleri",
        value: 
          `• **İki Faktörlü Doğrulama (2FA):** ${record.bonus2FA ? "✅ Aktif (+5.0 TS)" : "❌ Pasif"}\n` +
          `• 📱 **Telefon Numarası:** ${record.bonusPhone ? "✅ Doğrulanmış (+10.0 TS)" : "❌ Doğrulanmamış"}\n` +
          `• 🚀 **Discord Hesap Yaşı:** ${record.bonusAccountAge > 0 ? `✅ ${record.bonusAccountAge === 10 ? "3+ Yıl (+10.0 TS)" : "1+ Yıl (+5.0 TS)"}` : "❌ Kriter Dışı"}\n` +
          `• 📅 **Sunucu Katılım Süresi:** ${record.bonusJoinAge > 0 ? `✅ ${record.bonusJoinAge === 15 ? "6+ Ay (+15.0 TS)" : "1+ Ay (+5.0 TS)"}` : "❌ Kriter Dışı"}`,
        inline: false
      }
    )
    .setTimestamp();

  if (record.afProgress && record.afProgress.active) {
    embed.addFields({
      name: "🛡️ Ceza Bitirme Görevi (Af)",
      value: `• **Durum:** Aktif\n• **Günler:** \`${record.afProgress.daysCompleted || 0} / 3\` gün\n• **Bugün gönderilen:** \`${record.afProgress.messagesToday || 0} / 20\` mesaj`,
      inline: false
    });
  }

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
      .setCustomId(`trust_close_${userId}`)
      .setLabel("🔒 Kanalı Kapat & Sil")
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
    const action = parts[1]; // add, sub, logs, reset, close
    const targetUserId = parts[2];
    
    if (action === "close") {
      const record = await UserTrustScore.findOne({ userId: targetUserId });
      if (record) {
        record.profileChannelClosed = true;
        record.profileChannelId = null;
        record.profileMessageId = null;
        await record.save();
      }

      await interaction.reply({ content: "🔒 Güvenlik profili kanalı başarıyla kapatıldı. Kanal siliniyor...", ephemeral: true });
      if (interaction.channel) {
        setTimeout(() => interaction.channel.delete().catch(() => {}), 1500);
      }
      return;
    }
    
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

    if (amountVal > 50.0) {
      return interaction.editReply("❌ Tek seferde en fazla **50.0 TS** puan ekleyebilir veya düşürebilirsiniz (Güvenlik Sınırı: Max 50.0 TS).");
    }

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
 * Also runs weekly inactivity decay check.
 */
async function scanVoiceChannels(client) {
  try {
    // ── 1. Voice Channels scan ──
    const activeGuild = await client.guilds.fetch(ACTIVE_GUILD_ID).catch(() => null);
    if (!activeGuild) return;

    for (const channel of activeGuild.channels.cache.values()) {
      if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
        const isAFKChannel = channel.id === activeGuild.afkChannelId || channel.name.toLowerCase().includes("afk");
        if (isAFKChannel) continue; // Skip AFK channels completely

        const nonBotMembers = channel.members.filter(m => !m.user.bot);
        if (nonBotMembers.size === 0) continue;

        for (const member of nonBotMembers.values()) {
          const voiceState = member.voice;
          
          // ── 4. AFK & Self-Mute / Self-Deafen Protection ──
          if (voiceState && voiceState.selfMute && voiceState.selfDeafen) {
            continue; // Skip users who are self-muted and self-deafened (AFK farming)
          }

          // Award full +0.5 TS if 2+ users in channel, or +0.25 TS if alone
          const pointsToAward = nonBotMembers.size >= 2 ? 0.5 : 0.25;
          await updateTrustScore(member.id, pointsToAward, `Sesli Kanal Aktifliği (${nonBotMembers.size >= 2 ? "Birlikte" : "Yalnız"} 30 Dk)`, "SYSTEM", client);

          // Stream checks: streaming to 2+ viewers
          if (voiceState && voiceState.streaming) {
            const viewers = nonBotMembers.filter(m => m.id !== member.id).size;
            if (viewers >= 2) {
              await updateTrustScore(member.id, 1.0, "Sesli Kanal Ekran Paylaşımı / Yayın (30 Dk, 2+ İzleyici)", "SYSTEM", client);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[TrustScore] scanVoiceChannels error:", err.message);
  }
}

/**
 * Runs weekly inactivity decay & passive trust recovery checks.
 */
async function runInactivityDecay(client) {
  try {
    const records = await UserTrustScore.find({});
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const record of records) {
      // ── 8. Pasif Güven Puanı İyileşme Oranı (Passive Trust Recovery Rate) ──
      const isRecentlyActive = record.lastActiveTimestamp && new Date(record.lastActiveTimestamp) >= sevenDaysAgo;
      const hasRecentViolation = record.lastViolationDate && new Date(record.lastViolationDate) > fourteenDaysAgo;
      const alreadyRecoveredRecently = record.lastRecoveryDate && new Date(record.lastRecoveryDate) > fourteenDaysAgo;

      if (isRecentlyActive && !hasRecentViolation && !alreadyRecoveredRecently && record.trustScore < 150.0) {
        record.lastRecoveryDate = now;
        await record.save();
        await updateTrustScore(record.userId, 2.0, "Güvenlik Kalkanı: 14 Günlük İhlalsiz Temiz Sicil İyileşme Bonusu (+2.0 TS)", "SYSTEM", client);
      }

      // ── İnaktiflik Erimesi Check ──
      if (!record.lastActiveTimestamp) continue;

      const inactiveMs = now.getTime() - new Date(record.lastActiveTimestamp).getTime();
      const inactiveDays = inactiveMs / (1000 * 60 * 60 * 24);

      if (inactiveDays >= 30) {
        let shouldDecay = false;
        if (!record.weeklyDecayLastChecked) {
          shouldDecay = true;
        } else {
          const lastCheckedMs = now.getTime() - new Date(record.weeklyDecayLastChecked).getTime();
          const lastCheckedDays = lastCheckedMs / (1000 * 60 * 60 * 24);
          if (lastCheckedDays >= 7) {
            shouldDecay = true;
          }
        }

        if (shouldDecay) {
          if (record.trustScore > 100.0) {
            const oldScore = record.trustScore;
            let newScore = Math.max(100.0, parseFloat((oldScore - 2.0).toFixed(2)));
            const diff = parseFloat((newScore - oldScore).toFixed(2));
            
            if (diff !== 0) {
              record.trustScore = newScore;
              record.weeklyDecayLastChecked = now;
              record.scoreLogs.push({
                amount: diff,
                reason: "Uzun Süreli İnaktiflik Erimesi (-2.0)",
                operatorId: "SYSTEM",
                timestamp: now
              });
              await record.save();
              
              if (record.profileChannelId) {
                const recordGuild = await client.guilds.fetch(RECORD_GUILD_ID).catch(() => null);
                if (recordGuild) {
                  const channel = await recordGuild.channels.fetch(record.profileChannelId).catch(() => null);
                  if (channel) {
                    await channel.send(`📉 **[Aktiflik Erimesi]** 30 gündür inaktif olunduğu için haftalık erime uygulandı: **${diff.toFixed(1)}** TS`).catch(() => {});
                  }
                }
              }
              
              await updateProfileEmbed(record, client);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[TrustScore] runInactivityDecay error:", err);
  }
}

let lastDecayRunDay = null;

function startTrustScoreDecayScheduler(client) {
  // Check once every 15 minutes to guarantee we run precisely during the 4 AM hour
  setInterval(() => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      if (now.getHours() === 4 && lastDecayRunDay !== todayStr) {
        lastDecayRunDay = todayStr;
        console.log("[TrustScore] Günlük inaktiflik erime taraması başlatılıyor...");
        runInactivityDecay(client).catch(err => console.error("[TrustScore] Decay error:", err));
      }
    } catch (e) {
      console.error("[TrustScore] startTrustScoreDecayScheduler interval error:", e.message);
    }
  }, 15 * 60 * 1000);
  console.log("✅ Güven Puanı İnaktiflik Erime Zamanlayıcısı başlatıldı (Her gün 04:00).");
}

/**
 * Scans RECORD_GUILD_ID on startup to detect duplicate trust score channels.
 * If 2 or more channels exist for the same username/person, deletes the older duplicates
 * and keeps the newest valid channel, syncing any missing profile embeds & DB linkage.
 */
async function cleanupDuplicateTrustChannels(client) {
  try {
    const recordGuild = await client.guilds.fetch(RECORD_GUILD_ID).catch(() => null);
    if (!recordGuild) return;

    console.log("[TrustScore] Bot Başlangıcı: Çift Kanal Teşhis & Temizlik Taraması...");

    const channels = await recordGuild.channels.fetch().catch(() => null);
    if (!channels) return;

    const categoryChannels = channels.filter(c => 
      c.type === ChannelType.GuildText && (c.parentId === RECORD_CATEGORY_ID || !c.parentId)
    );

    const groupedByName = new Map();
    for (const channel of categoryChannels.values()) {
      const name = channel.name.toLowerCase();
      if (!groupedByName.has(name)) {
        groupedByName.set(name, []);
      }
      groupedByName.get(name).push(channel);
    }

    let deletedCount = 0;
    let syncedCount = 0;

    for (const [name, channelList] of groupedByName.entries()) {
      channelList.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      if (channelList.length >= 2) {
        console.log(`[TrustScore] ⚠️ Mükerrer kanal tespit edildi: "${name}" (${channelList.length} adet)`);

        // Keep the newest channel
        const keepChannel = channelList[channelList.length - 1];
        const duplicateChannels = channelList.slice(0, channelList.length - 1);

        for (const dupChan of duplicateChannels) {
          await dupChan.delete("Tek seferlik mükerrer güvenlik kanalı temizliği").catch(() => {});
          deletedCount++;
        }

        const record = await UserTrustScore.findOne({ 
          $or: [
            { profileChannelId: keepChannel.id },
            { username: { $regex: new RegExp(`^${name}$`, 'i') } }
          ]
        });

        if (record) {
          record.profileChannelId = keepChannel.id;
          record.profileChannelClosed = false;
          await record.save();

          await updateProfileEmbed(record, client);
          syncedCount++;
        }
      } else if (channelList.length === 1) {
        const channel = channelList[0];
        const record = await UserTrustScore.findOne({ 
          $or: [
            { profileChannelId: channel.id },
            { username: { $regex: new RegExp(`^${name}$`, 'i') } }
          ]
        });

        if (record && !record.profileChannelClosed) {
          if (record.profileChannelId !== channel.id) {
            record.profileChannelId = channel.id;
            await record.save();
          }
          await updateProfileEmbed(record, client);
          syncedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[TrustScore] ✅ Tek seferlik temizlik tamamlandı: ${deletedCount} fazla mükerrer kanal kapatıldı, ${syncedCount} profil senkronize edildi.`);
    }
  } catch (err) {
    console.error("[TrustScore] cleanupDuplicateTrustChannels hatası:", err.message);
  }
}

/**
 * Sends a detailed activity log to the user's dedicated Güven Puanı record channel.
 */
async function logTrustUserActivity(client, userId, actionTitle, actionDetails, emoji = "📝") {
  try {
    const record = await UserTrustScore.findOne({ userId });
    if (!record || !record.profileChannelId) return;

    const recordGuild = await client.guilds.fetch(RECORD_GUILD_ID).catch(() => null);
    if (!recordGuild) return;

    const channel = await recordGuild.channels.fetch(record.profileChannelId).catch(() => null);
    if (!channel || !channel.isSendable()) return;

    const timestamp = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`${emoji} ${actionTitle}`)
      .setDescription(`**Zaman:** ${timestamp}\n${actionDetails}`)
      .setFooter({ text: `Güvenlik Logu • ${record.username || userId}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    console.error("[TrustScoreLog] Activity log error:", err.message);
  }
}

module.exports = {
  ensureUserTrustScore,
  updateTrustScore,
  incrementAfProgress,
  addModPoints,
  checkModAbuseLimit,
  handleTrustButtons,
  handleTrustModals,
  scanVoiceChannels,
  startTrustScoreDecayScheduler,
  cleanupDuplicateTrustChannels,
  logTrustUserActivity,
};
