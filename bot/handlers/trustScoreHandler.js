const { AuditLogEvent } = require("discord.js");
const { updateTrustScore, ensureUserTrustScore, incrementAfProgress } = require("../services/security/trustScoreService");
const UserTrustScore = require("../../models/UserTrustScore");

const ACTIVE_GUILD_ID = "1367646464804655104"; // EKO YILDIZ

// In-memory message tracking
const messageCounts = new Map(); // userId -> { count, lastTimestamp }
const voiceSessions = new Map(); // userId -> joinTime
const userTimestamps = new Map(); // userId -> Array of message timestamps (for flood check)
const recentMessages = new Map(); // messageId -> { authorId, createdTimestamp, hasMentions }
const awardedReactionMessages = new Set(); // messageId -> Boolean (to prevent double reaction points)

const LINK_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
const SUSPICIOUS_LINK_REGEX = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
const SWEAR_WORDS = ["amk", "aq", "amq", "piç", "göt", "sik", "orospu", "yarrak", "siktir", "oç", "amcık", "gavat", "puşt"];

// Clean up recent messages mapping every 60 seconds to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [msgId, data] of recentMessages.entries()) {
    if (now - data.createdTimestamp > 30000) {
      recentMessages.delete(msgId);
    }
  }
}, 60000);

function initializeTrustScoreHandlers(client) {
  // ── 1. Message Event Handler (Sohbet, Automod, Streaks, Flood, Caps Lock) ──
  client.on("messageCreate", async (message) => {
    try {
      if (message.author.bot || !message.guild || message.guild.id !== ACTIVE_GUILD_ID) return;

      const userId = message.author.id;

      // Ensure record and channel exist (lazy creation on first message)
      const record = await ensureUserTrustScore(userId, ACTIVE_GUILD_ID, client);
      if (!record) return;

      // Update last active time
      record.lastActiveTimestamp = new Date();

      const now = Date.now();
      const contentLower = message.content.toLowerCase();
      const isTargetCategory = message.channel.parentId === "1521539351031578684" || message.channel.parent?.parentId === "1521539351031578684";

      // ── A. Automod Checks: Suspicious Link / Ad ──
      if (!isTargetCategory && SUSPICIOUS_LINK_REGEX.test(message.content)) {
        await message.delete().catch(() => {});
        await updateTrustScore(userId, -25.0, "Automod: Şüpheli Link / Sunucu Tanıtımı Reklamı", "SYSTEM", client);
        
        // Quarantine: 7 days timeout and assign High Risk role
        const member = await message.guild.members.fetch(userId).catch(() => null);
        if (member) {
          const highRiskRole = message.guild.roles.cache.find(r => r.name === "Yüksek Risk") || 
                               await message.guild.roles.create({
                                 name: "Yüksek Risk",
                                 color: "#ff0000",
                                 reason: "Güvenlik Sistemi: Yüksek Risk Seviyesi (Şüpheli Link)"
                               }).catch(() => null);
          if (highRiskRole) {
            await member.roles.add(highRiskRole).catch(() => {});
          }
          await member.timeout(7 * 24 * 60 * 60 * 1000, "Automod: Reklam / Şüpheli Davet Linki").catch(() => {});
        }

        await message.channel.send(`🚨 <@${userId}> Şüpheli/reklam linki paylaştığınız için **-25.0** TS cezası uygulandı ve karantinaya alındınız.`).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 5000);
        }).catch(() => {});
        return;
      }

      // ── B. Automod Checks: Flood (Hızlı Mesaj) ──
      const timestamps = userTimestamps.get(userId) || [];
      timestamps.push(now);
      const recentTimestamps = timestamps.filter(t => now - t < 3000);
      userTimestamps.set(userId, recentTimestamps);

      if (recentTimestamps.length > 5) {
        userTimestamps.set(userId, []); // Reset timestamps
        await updateTrustScore(userId, -2.0, "Automod: Hızlı Mesaj / Flood İhlali", "SYSTEM", client);
        await message.reply({ content: "⚠️ **[Güvenlik]** Lütfen bu kadar hızlı mesaj yazmayın! Flood ihlali nedeniyle puan kaybettiniz." }).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 5000);
        }).catch(() => {});
        return;
      }

      // ── C. Automod Checks: Caps Lock / Büyük Harf Spamı ──
      const letters = message.content.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, "");
      if (letters.length > 10) {
        const uppercaseCount = letters.split("").filter(c => c === c.toUpperCase()).length;
        const uppercaseRatio = uppercaseCount / letters.length;
        
        if (uppercaseRatio > 0.7) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (record.lastCapsViolationReset !== todayStr) {
            record.capsViolationsCount = 0;
            record.lastCapsViolationReset = todayStr;
          }

          record.capsViolationsCount = (record.capsViolationsCount || 0) + 1;
          await record.save();

          if (record.capsViolationsCount > 3) {
            await updateTrustScore(userId, -1.0, "Automod: Caps Lock / Büyük Harf Spamı (3+ İhlal)", "SYSTEM", client);
            await message.reply({ content: "⚠️ **[Güvenlik]** Büyük harf (Caps Lock) spamı yapmaya devam ettiğiniz için güven puanınız düşürüldü." }).then(msg => {
              setTimeout(() => msg.delete().catch(() => {}), 5000);
            }).catch(() => {});
          }
        }
      }

      // ── D. Store recent message for Ghost Ping detection ──
      const hasMentions = message.mentions.users.size > 0 || message.mentions.roles.size > 0;
      recentMessages.set(message.id, {
        authorId: userId,
        createdTimestamp: now,
        hasMentions
      });

      // ── E. Automod Checks: Swears & Normal Links ──
      let hasViolated = false;

      // Swear check
      const hasSwear = SWEAR_WORDS.some(word => {
        const regex = new RegExp(`\\b${word}\\b|${word}`, 'i');
        return regex.test(contentLower);
      });

      if (hasSwear) {
        hasViolated = true;
        await updateTrustScore(userId, -2.0, "Automod: Küfür / Argo Tespiti", "SYSTEM", client);
        await message.reply({ content: "⚠️ **[Güvenlik]** Küfürlü/toksik dil tespiti nedeniyle güven puanınız düşürüldü." }).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 5000);
        }).catch(() => {});
      }

      // Normal link check
      if (!isTargetCategory && !hasViolated && LINK_REGEX.test(message.content)) {
        if (record.trustScore < 50.0) {
          hasViolated = true;
          await message.delete().catch(() => {});
          await updateTrustScore(userId, -3.0, "Automod: Yüksek Risk Altında Link Paylaşımı", "SYSTEM", client);
          await message.channel.send(`⚠️ <@${userId}> Yüksek risk seviyesinde olduğunuz için link paylaşımınız engellendi ve güven puanınız düşürüldü.`).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
          }).catch(() => {});
        } else {
          hasViolated = true;
          await updateTrustScore(userId, -1.0, "Automod: Link Paylaşımı", "SYSTEM", client);
        }
      }

      if (hasViolated) return; // Skip daily streak and message progress if they violated rules

      // ── F. Ceza Bitirme Görevi (Af) Progress ──
      if (record.afProgress && record.afProgress.active) {
        await incrementAfProgress(userId, client);
      }

      // ── G. Daily Streak Check (Daily Login) ──
      const todayStr = new Date().toISOString().split('T')[0];
      if (record.lastMessageDate !== todayStr) {
        const lastMsgDate = record.lastMessageDate;
        record.lastMessageDate = todayStr;

        // Daily Login Puanı (+0.5)
        await updateTrustScore(userId, 0.5, "Günlük Giriş Bonus Puanı (+0.5 TS)", "SYSTEM", client);

        // Check if yesterday they chatted to increment streak
        if (lastMsgDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastMsgDate === yesterdayStr) {
            record.dailyStreak = (record.dailyStreak || 0) + 1;
            
            // 7 Days Streak Reward (+3.0)
            if (record.dailyStreak >= 7) {
              record.dailyStreak = 0; // Reset streak cycle
              await record.save();
              await updateTrustScore(userId, 3.0, "Kıdem: 7 Gün Üst Üste Günlük Aktiflik Bonusu (+3.0 TS)", "SYSTEM", client);
            } else {
              await record.save();
            }
          } else {
            record.dailyStreak = 1;
            await record.save();
          }
        } else {
          record.dailyStreak = 1;
          await record.save();
        }
      }

      // ── H. Sohbet Aktifliği (50 Mesajda bir +0.2) ──
      const userTrack = messageCounts.get(userId) || { count: 0, lastTimestamp: 0 };
      if (now - userTrack.lastTimestamp >= 60 * 1000) {
        userTrack.count += 1;
        userTrack.lastTimestamp = now;
        messageCounts.set(userId, userTrack);

        record.messageCount = (record.messageCount || 0) + 1;
        if (record.messageCount >= 50) {
          record.messageCount = 0;
          await record.save();
          await updateTrustScore(userId, 0.2, "Sohbet Aktifliği (50 Mesaj)", "SYSTEM", client);
        } else {
          await record.save();
        }
      }

    } catch (err) {
      console.error("[TrustScoreHandler] messageCreate error:", err);
    }
  });

  // ── 2. Message Delete Event Handler (Ghost Ping Tespiti) ───────────────────
  client.on("messageDelete", async (message) => {
    try {
      if (!message.guild || message.guild.id !== ACTIVE_GUILD_ID) return;

      const msgData = recentMessages.get(message.id);
      if (!msgData) return;

      recentMessages.delete(message.id);

      const elapsed = Date.now() - msgData.createdTimestamp;
      if (elapsed < 15000 && msgData.hasMentions) {
        // Fetch audit logs to see if a moderator/staff member deleted it
        const fetchedLogs = await message.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.MessageDelete,
        }).catch(() => null);

        const deletionLog = fetchedLogs?.entries.first();
        if (deletionLog) {
          const { executor, target } = deletionLog;
          const logAge = Date.now() - deletionLog.createdTimestamp;
          
          if (target && target.id === msgData.authorId && executor && executor.id !== msgData.authorId && logAge < 5000) {
            // Deleted by a moderator/someone else. Skip ghost ping penalty.
            return;
          }
        }

        // Ghost ping detected!
        await updateTrustScore(msgData.authorId, -3.0, "Automod: Ghost Ping (Etiketleyip Silme)", "SYSTEM", client);
        await message.channel.send(`⚠️ <@${msgData.authorId}> Ghost Ping (Etiketleyip silme) ihlali nedeniyle **-3.0** TS cezası aldınız.`).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 5000);
        }).catch(() => {});
      }

    } catch (err) {
      console.error("[TrustScoreHandler] messageDelete error:", err);
    }
  });

  // ── 3. Reaction Add Event Handler (Reaction Puanı) ──────────────────────────
  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;

      const allowedEmoji = ["👍", "❤️", "💡"].includes(reaction.emoji.name);
      if (!allowedEmoji) return;

      // Handle partials
      if (reaction.partial) {
        await reaction.fetch().catch(() => null);
      }

      const message = reaction.message;
      if (!message.guild || message.guild.id !== ACTIVE_GUILD_ID || message.author.bot) return;

      // Award reactions count (> 5 positive reactions)
      if (!awardedReactionMessages.has(message.id)) {
        // Fetch all reactions to sum them up
        let positiveCount = 0;
        
        for (const react of message.reactions.cache.values()) {
          if (["👍", "❤️", "💡"].includes(react.emoji.name)) {
            // Fetch users of this reaction to exclude the author themselves
            const users = await react.users.fetch().catch(() => null);
            if (users) {
              const others = users.filter(u => u.id !== message.author.id && !u.bot);
              positiveCount += others.size;
            }
          }
        }

        if (positiveCount > 5) {
          awardedReactionMessages.add(message.id);
          await updateTrustScore(message.author.id, 0.3, "Olumlu Tepki / Reaksiyon Alma (>5 Olumlu Tepki)", "SYSTEM", client);
        }
      }

    } catch (err) {
      console.error("[TrustScoreHandler] messageReactionAdd error:", err);
    }
  });

  // ── 4. Voice State Event Handler (Ses Aktifliği & Ekran Paylaşımı) ──────────
  client.on("voiceStateUpdate", async (oldState, newState) => {
    try {
      if (newState.guild.id !== ACTIVE_GUILD_ID) return;

      const userId = newState.id;
      const oldChannel = oldState.channelId;
      const newChannel = newState.channelId;

      const record = await ensureUserTrustScore(userId, ACTIVE_GUILD_ID, client);
      if (record) {
        record.lastActiveTimestamp = new Date();
        await record.save();
      }

      if (!oldChannel && newChannel) {
        if (!newState.member.user.bot) {
          voiceSessions.set(userId, Date.now());
        }
      }
      else if (oldChannel && !newChannel) {
        const joinTime = voiceSessions.get(userId);
        if (joinTime) {
          const elapsedMin = (Date.now() - joinTime) / (1000 * 60);
          const pointsToAward = Math.floor(elapsedMin / 30) * 0.5;

          if (pointsToAward > 0) {
            await updateTrustScore(userId, pointsToAward, `Sesli Kanal Aktifliği (${Math.floor(elapsedMin)} Dk)`, "SYSTEM", client);
          }
          voiceSessions.delete(userId);
        }
      }
      else if (oldChannel && newChannel) {
        const joinTime = voiceSessions.get(userId);
        if (joinTime) {
          const elapsedMin = (Date.now() - joinTime) / (1000 * 60);
          if (elapsedMin >= 30) {
            const pointsToAward = Math.floor(elapsedMin / 30) * 0.5;
            await updateTrustScore(userId, pointsToAward, `Sesli Kanal Aktifliği (${Math.floor(elapsedMin)} Dk)`, "SYSTEM", client);
            voiceSessions.set(userId, Date.now());
          }
        } else {
          if (!newState.member.user.bot) {
            voiceSessions.set(userId, Date.now());
          }
        }
      }

    } catch (err) {
      console.error("[TrustScoreHandler] voiceStateUpdate error:", err);
    }
  });

  // ── 5. Member Join Event Handler (Kanal Oluşturma & Başlangıç) ─────────────
  client.on("guildMemberAdd", async (member) => {
    try {
      if (member.guild.id !== ACTIVE_GUILD_ID) return;
      await ensureUserTrustScore(member.id, ACTIVE_GUILD_ID, client);
    } catch (err) {
      console.error("[TrustScoreHandler] guildMemberAdd error:", err);
    }
  });

  // ── 6. Member Update Event Handler (Takviye/Booster Takibi) ─────────────────
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
      if (newMember.guild.id !== ACTIVE_GUILD_ID) return;

      const userId = newMember.id;
      const boostedBefore = oldMember.premiumSince;
      const boostedNow = newMember.premiumSince;

      if (!boostedBefore && boostedNow) {
        await updateTrustScore(userId, 10.0, "Sunucu Takviyesi (Booster) Bonusu", "SYSTEM", client);
      }
      else if (boostedBefore && !boostedNow) {
        await updateTrustScore(userId, -10.0, "Sunucu Takviyesi Kaldırıldı", "SYSTEM", client);
      }
    } catch (err) {
      console.error("[TrustScoreHandler] guildMemberUpdate error:", err);
    }
  });

  // Populate active voice sessions on bot startup
  client.once("ready", async () => {
    try {
      const activeGuild = await client.guilds.fetch(ACTIVE_GUILD_ID).catch(() => null);
      if (activeGuild) {
        console.log("[TrustScoreHandler] Aktif ses kullanıcıları önbelleğe alınıyor...");
        for (const channel of activeGuild.channels.cache.values()) {
          if (channel.isVoiceBased()) {
            for (const member of channel.members.values()) {
              if (!member.user.bot) {
                voiceSessions.set(member.id, Date.now());
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[TrustScoreHandler] Startup voice caching error:", err.message);
    }
  });
}

module.exports = {
  initializeTrustScoreHandlers,
};
