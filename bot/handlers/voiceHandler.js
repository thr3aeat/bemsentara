const { logBanAdd, logBanRemove } = require("../services/banLog");
const { handleJoinToCreate, handleVoiceLeave } = require("../services/voiceManager");
const { TMT_GUILD_ID } = require("../../config");

function initializeVoiceAndBanHandlers(client) {
  client.on("guildBanAdd", async (ban) => {
    if (ban.guild.id === TMT_GUILD_ID) {
      const { logTMTBanAdd } = require("../services/tmtLogger");
      logTMTBanAdd(ban);
    } else {
      logBanAdd(ban);
    }
    let dbUser = null;
    try {
      const User = require("../../models/User");
      dbUser = await User.findOne({ discordId: ban.user.id });
    } catch (err) {
      console.warn("[guildBanAdd] DB query error:", err.message);
    }

    // Discord'dan ban atılınca site ban da uygula
    try {
      if (dbUser && !dbUser.isBanned) {
        const { saveStoreNow } = require("../../models/Store");
        dbUser.isBanned = true;
        dbUser.banReason = ban.reason || "Discord üzerinden yasaklandı";
        dbUser.bannedAt = new Date();
        await dbUser.save();
        saveStoreNow();
      }
    } catch (err) {
      console.warn("[guildBanAdd] Site ban uygulanamadı:", err.message);
    }

    // Banlanan kullanıcıya itiraz DM'i gönder (Tam Ban hariç)
    try {
      const isTamBan = (ban.reason && ban.reason.includes("Tam Ban")) || (dbUser && dbUser.banLevel);
      if (!isTamBan) {
        const { sendAppealDM } = require("../services/banAppeal");
        await sendAppealDM(
          ban.user,
          ban.guild.name,
          ban.guild.id,
          ban.reason || "Belirtilmedi",
          "ban"
        );

        // AI soruşturma DM'i — Aras botu kısa gecikmeli olarak ikinci DM atar
        setTimeout(async () => {
          try {
            const { sendBanInvestigationDM } = require("../services/banInvestigationAI");
            await sendBanInvestigationDM(
              ban.user.id,
              {
                reason: ban.reason || "Belirtilmedi",
                bannedBy: dbUser?.bannedBy || null,
                bannedAt: new Date(),
                guildName: ban.guild.name,
              },
              client
            );
          } catch (aiErr) {
            console.warn("[guildBanAdd] AI soruşturma DM gönderilemedi:", aiErr.message);
          }
        }, 3000); // 3 sn gecikme
      } else {
        console.log(`[guildBanAdd] Tam Ban tespit edildi, DM gönderimi atlandı: ${ban.user.tag}`);
      }
    } catch (err) {
      console.warn("[guildBanAdd] İtiraz DM gönderilemedi:", err.message);
    }

  });

  client.on("guildBanRemove", async (ban) => {
    if (ban.guild.id === TMT_GUILD_ID) {
      const { logTMTBanRemove } = require("../services/tmtLogger");
      logTMTBanRemove(ban);
    } else {
      logBanRemove(ban);
    }
    // Discord'dan ban kaldırılınca site ban da kaldır
    try {
      const User = require("../../models/User");
      const { saveStoreNow } = require("../../models/Store");
      const dbUser = await User.findOne({ discordId: ban.user.id });
      if (dbUser && dbUser.isBanned) {
        dbUser.isBanned = false;
        dbUser.banReason = null;
        dbUser.bannedAt = null;
        dbUser.bannedBy = null;
        await dbUser.save();
        saveStoreNow();
      }
    } catch (err) {
      console.warn("[guildBanRemove] Site ban kaldırılamadı:", err.message);
    }
  });

  client.on("voiceStateUpdate", async (oldState, newState) => {
    try {
      if (newState.guild.id !== oldState.guild.id) return;

      // ── Mute/Deafen/Kick İtiraz Sistemi ───────────────────────────────────────
      if (newState.member && !newState.member.user.bot) {
        const oldMuted = oldState.mute ?? false;
        const newMuted = newState.mute ?? false;
        const oldDeafened = oldState.selfDeaf ?? false;
        const newDeafened = newState.selfDeaf ?? false;
        const oldChannelId = oldState.channelId;
        const newChannelId = newState.channelId;

        // Mute durumu değişti
        if (oldMuted !== newMuted && newMuted && newChannelId) {
          try {
            const { sendMutationAppealDM } = require("../services/mutationAppealService");
            const { sendMutualConfirmationDM } = require("../services/modMutualConfirmService");
            const Mutation = require("../../models/Mutation");
            const auditLogs = await newState.guild.fetchAuditLogs({
              type: 'MemberUpdate',
              limit: 5,
            }).catch(() => null);
            
            let moderator = 'Bilinmeyen';
            let moderatorObj = null;
            if (auditLogs && auditLogs.entries.size > 0) {
              const entry = auditLogs.entries.find(e => 
                e.target?.id === newState.member.id && 
                Date.now() - e.createdTimestamp < 5000
              );
              moderator = entry?.executor?.tag || 'Bilinmeyen';
              moderatorObj = entry?.executor;
            }

            // ❌ SELF-ACTION: Kendi kendini susturmuş → ignore et
            if (moderatorObj?.id === newState.member.id) {
              console.log(`[voiceStateUpdate] Self-mute detected: ${newState.member?.user?.tag || newState.member?.id} kendini susturdu, DM gönderilmedi`);
              return;
            }

            // Eğer moderator bulunamamışsa → ignore et (bot işlemi olabilir)
            if (!moderatorObj) {
              console.warn(`[voiceStateUpdate] Mute yapan moderator bulunamadı: ${newState.member?.user?.tag || newState.member?.id}`);
              return;
            }

            // Eğer hedef moderatör ise → mutual confirmation DM
            const isModerator = newState.member.roles.cache.some(r => 
              r.name.toLowerCase().includes('mod') ||
              r.name.toLowerCase().includes('staff') ||
              r.name.toLowerCase().includes('yetkili')
            );

            if (isModerator && moderatorObj.id !== newState.member.id) {
              // Moderatör arası işlem → confirmation
              await sendMutualConfirmationDM(
                newState.client,
                moderatorObj,
                newState.member.user,
                newState.guild,
                'mute',
                'Ses kanalında susturuldu'
              );
            } else {
              // Normal kullanıcı → appeal DM
              await sendMutationAppealDM(
                newState.member.user,
                newState.guild,
                'mute',
                moderator,
                'Ses kanalında susturuldunuz'
              );
            }

            // DB'ye kaydet
            new Mutation({
              guildId: newState.guild.id,
              targetUserId: newState.member.id,
              moderatorUserId: moderatorObj.id,
              actionType: 'mute',
              reason: 'Ses kanalında susturuldu',
            }).save().catch(() => {});
          } catch (err) {
            console.warn("[voiceStateUpdate] Mute appeal DM hatası:", err.message);
          }
        }

        // Deafen durumu değişti
        if (oldDeafened !== newDeafened && newDeafened && newChannelId) {
          try {
            const { sendMutationAppealDM } = require("../services/mutationAppealService");
            const { sendMutualConfirmationDM } = require("../services/modMutualConfirmService");
            const auditLogs = await newState.guild.fetchAuditLogs({
              type: 'MemberUpdate',
              limit: 5,
            }).catch(() => null);
            
            let moderator = 'Bilinmeyen';
            let moderatorObj = null;
            if (auditLogs && auditLogs.entries.size > 0) {
              const entry = auditLogs.entries.find(e => 
                e.target?.id === newState.member.id && 
                Date.now() - e.createdTimestamp < 5000
              );
              moderator = entry?.executor?.tag || 'Bilinmeyen';
              moderatorObj = entry?.executor;
            }

            // ❌ SELF-ACTION: Kendi kendini sağırlaştırmış → ignore et
            if (moderatorObj?.id === newState.member.id) {
              console.log(`[voiceStateUpdate] Self-deafen detected: ${newState.member?.user?.tag || newState.member?.id} kendini sağırlaştırdı`);
              return;
            }

            if (!moderatorObj) {
              console.warn(`[voiceStateUpdate] Deafen yapan moderator bulunamadı: ${newState.member?.user?.tag || newState.member?.id}`);
              return;
            }

            // Eğer hedef moderatör ise → mutual confirmation DM
            const isModerator = newState.member.roles.cache.some(r => 
              r.name.toLowerCase().includes('mod') ||
              r.name.toLowerCase().includes('staff') ||
              r.name.toLowerCase().includes('yetkili')
            );

            if (isModerator && moderatorObj.id !== newState.member.id) {
              await sendMutualConfirmationDM(
                newState.client,
                moderatorObj,
                newState.member.user,
                newState.guild,
                'deafen',
                'Ses kanalında sağırlaştırıldı'
              );
            } else {
              await sendMutationAppealDM(
                newState.member.user,
                newState.guild,
                'deafen',
                moderator,
                'Ses kanalında sağırlaştırıldınız'
              );
            }
          } catch (err) {
            console.warn("[voiceStateUpdate] Deafen appeal DM hatası:", err.message);
          }
        }

        // Kick: Ses kanalından çıkarıldı
        if (oldChannelId && !newChannelId && oldChannelId !== newChannelId) {
          try {
            const { sendMutationAppealDM } = require("../services/mutationAppealService");
            const { sendMutualConfirmationDM } = require("../services/modMutualConfirmService");
            const auditLogs = await newState.guild.fetchAuditLogs({
              type: 'MemberUpdate',
              limit: 5,
            }).catch(() => null);
            
            let moderator = 'Bilinmeyen';
            let moderatorObj = null;
            if (auditLogs && auditLogs.entries.size > 0) {
              const entry = auditLogs.entries.find(e => 
                e.target?.id === newState.member.id && 
                Date.now() - e.createdTimestamp < 5000
              );
              moderator = entry?.executor?.tag || 'Bilinmeyen';
              moderatorObj = entry?.executor;
            }

            // ❌ SELF-ACTION: Kendi kendini çıkarmış → ignore et (normal çıkış)
            if (moderatorObj?.id === newState.member.id || !moderatorObj) {
              console.log(`[voiceStateUpdate] Self-leave detected: ${newState.member?.user?.tag || newState.member?.id}`);
              return;
            }

            // Eğer hedef moderatör ise → mutual confirmation DM
            const isModerator = newState.member.roles.cache.some(r => 
              r.name.toLowerCase().includes('mod') ||
              r.name.toLowerCase().includes('staff') ||
              r.name.toLowerCase().includes('yetkili')
            );

            if (isModerator && moderatorObj.id !== newState.member.id) {
              await sendMutualConfirmationDM(
                newState.client,
                moderatorObj,
                newState.member.user,
                newState.guild,
                'kick',
                'Ses kanalından çıkarıldı'
              );
            } else {
              await sendMutationAppealDM(
                newState.member.user,
                newState.guild,
                'kick',
                moderator,
                'Ses kanalından çıkarıldınız'
              );
            }
          } catch (err) {
            console.warn("[voiceStateUpdate] Kick appeal DM hatası:", err.message);
          }
        }
      }

      // ── Hapis Ses Kanalı Engelleme Kontrolü ─────────────────────────────────
      if (newState.channelId && newState.member && !newState.member.user.bot) {
        const hasHapisRole = newState.member.roles.cache.some(r => r.name.toLowerCase() === "hapis");
        let isUserJailed = hasHapisRole;
        if (!isUserJailed) {
          const User = require("../../models/User");
          const dbUser = await User.findOne({ discordId: newState.member.id });
          if (dbUser && dbUser.isJailed) {
            isUserJailed = true;
          }
        }

        if (isUserJailed) {
          const isJailCategory = newState.channel && newState.channel.parentId === "1521501154339586078";
          if (!isJailCategory) {
            await newState.disconnect("Hapiste olan kullanıcı ses kanalına katılamaz.").catch(() => {});
            await newState.member.send("❌ Hapiste olduğunuz için bu ses kanalına katılamazsınız!").catch(() => {});
            return;
          }
        }
      }

      await handleJoinToCreate(oldState, newState);
      if (oldState.channelId && oldState.channelId !== newState.channelId) {
        await handleVoiceLeave(oldState, newState);
      }
    } catch (err) {
      console.error("[voiceStateUpdate]", err.message);
    }
  });
}

module.exports = { initializeVoiceAndBanHandlers };
