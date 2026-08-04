const { updateTrustScore, ensureUserTrustScore, scanVoiceChannels } = require("../services/security/trustScoreService");
const UserTrustScore = require("../../models/UserTrustScore");

const ACTIVE_GUILD_ID = "1367646464804655104"; // EKO YILDIZ

// In-memory message tracking
const messageCounts = new Map(); // userId -> { count, lastTimestamp }
// In-memory voice tracking
const voiceSessions = new Map(); // userId -> joinTime

const LINK_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
const SWEAR_WORDS = ["amk", "aq", "amq", "piç", "göt", "sik", "orospu", "yarrak", "siktir", "oç", "amcık", "gavat", "puşt"];

function initializeTrustScoreHandlers(client) {
  // ── 1. Message Event Handler (Sohbet ve Automod) ───────────────────────────
  client.on("messageCreate", async (message) => {
    try {
      if (message.author.bot || !message.guild || message.guild.id !== ACTIVE_GUILD_ID) return;

      const userId = message.author.id;

      // Ensure record and channel exist (lazy creation on first message)
      const record = await ensureUserTrustScore(userId, ACTIVE_GUILD_ID, client);
      if (!record) return;

      // ── A. Automod Checks (Swears & Links) ──
      const contentLower = message.content.toLowerCase();
      let hasViolated = false;

      // Swear check
      const hasSwear = SWEAR_WORDS.some(word => {
        // Match exact word or boundary to avoid false positives (e.g. "yapmak" containing "am")
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

      // Link check
      if (!hasViolated && LINK_REGEX.test(message.content)) {
        // High Risk users cannot share links at all
        if (record.trustScore < 50.0) {
          hasViolated = true;
          await message.delete().catch(() => {});
          await updateTrustScore(userId, -3.0, "Automod: Yüksek Risk Altında Link Paylaşımı", "SYSTEM", client);
          await message.channel.send(`⚠️ <@${userId}> Yüksek risk seviyesinde olduğunuz için link paylaşımınız engellendi ve güven puanınız düşürüldü.`).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
          }).catch(() => {});
        } else {
          // Normal users get light penalty if sharing unauthorized links
          hasViolated = true;
          await updateTrustScore(userId, -1.0, "Automod: Link Paylaşımı", "SYSTEM", client);
        }
      }

      if (hasViolated) return; // Skip chat activity points if user violated rules in this message

      // ── B. Chat Activity Points ──
      const now = Date.now();
      const userTrack = messageCounts.get(userId) || { count: 0, lastTimestamp: 0 };

      // 1-minute window check
      if (now - userTrack.lastTimestamp >= 60 * 1000) {
        userTrack.count += 1;
        userTrack.lastTimestamp = now;
        messageCounts.set(userId, userTrack);

        // Update database message count
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

  // ── 2. Voice State Event Handler (Ses Aktifliği) ───────────────────────────
  client.on("voiceStateUpdate", async (oldState, newState) => {
    try {
      if (newState.guild.id !== ACTIVE_GUILD_ID) return;

      const userId = newState.id;
      const oldChannel = oldState.channelId;
      const newChannel = newState.channelId;

      // User joined a voice channel
      if (!oldChannel && newChannel) {
        if (!newState.member.user.bot) {
          voiceSessions.set(userId, Date.now());
        }
      }
      // User left a voice channel
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
      // User changed state/channel
      else if (oldChannel && newChannel) {
        const joinTime = voiceSessions.get(userId);
        if (joinTime) {
          const elapsedMin = (Date.now() - joinTime) / (1000 * 60);
          if (elapsedMin >= 30) {
            const pointsToAward = Math.floor(elapsedMin / 30) * 0.5;
            await updateTrustScore(userId, pointsToAward, `Sesli Kanal Aktifliği (${Math.floor(elapsedMin)} Dk)`, "SYSTEM", client);
            // Reset start time for remainder/next chunk
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

  // ── 3. Member Join Event Handler (Sicil Kanalı Oluşturma) ──────────────────
  client.on("guildMemberAdd", async (member) => {
    try {
      if (member.guild.id !== ACTIVE_GUILD_ID) return;

      // Automatically initialize score and create profile channel
      await ensureUserTrustScore(member.id, ACTIVE_GUILD_ID, client);
    } catch (err) {
      console.error("[TrustScoreHandler] guildMemberAdd error:", err);
    }
  });

  // ── 4. Member Update Event Handler (Takviye/Booster Kontrolü) ──────────────
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
      if (newMember.guild.id !== ACTIVE_GUILD_ID) return;

      const userId = newMember.id;
      const boostedBefore = oldMember.premiumSince;
      const boostedNow = newMember.premiumSince;

      // Gained booster status
      if (!boostedBefore && boostedNow) {
        await updateTrustScore(userId, 10.0, "Sunucu Takviyesi (Booster) Bonusu", "SYSTEM", client);
      }
      // Lost booster status
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
