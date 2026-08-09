const { logBanAdd, logBanRemove } = require("../services/banLog");
const { handleJoinToCreate, handleVoiceLeave } = require("../services/voiceManager");
const { TMT_GUILD_ID } = require("../../config");
const Mutation = require("../../models/Mutation");

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
        const oldMuted = oldState.serverMute ?? false;
        const newMuted = newState.serverMute ?? false;
        const oldDeafened = oldState.serverDeaf ?? false;
        const newDeafened = newState.serverDeaf ?? false;
        const oldChannelId = oldState.channelId;
        const newChannelId = newState.channelId;

        // Mute durumu değişti
        if (oldMuted !== newMuted && newMuted && newChannelId) {
          try {
            const { sendMutationAppealDM } = require("../services/mutationAppealService");
            const { sendMutualConfirmationDM } = require("../services/modMutualConfirmService");
            const Mutation = require("../../models/Mutation");
            
            let moderator = 'Bilinmeyen';
            let moderatorObj = null;
            
            // Audit log lookup - try to find who performed the mute
            try {
              const auditLogs = await newState.guild.fetchAuditLogs({
                type: 'MemberUpdate',
                limit: 10,
              }).catch(() => null);
              
              if (auditLogs && auditLogs.entries.size > 0) {
                // Daha geniş zaman penceresi: 10 saniye
                const entry = auditLogs.entries.find(e => 
                  e.target?.id === newState.member.id && 
                  Date.now() - e.createdTimestamp < 10000 &&
                  (e.changes?.some(c => c.key === 'mute' && c.new === true) || // Discord.js v13
                   (e.changes?.some(c => c.key === 'communication_disabled_until')) || // Discord.js v14+
                   true) // Fallback: any recent update
                );
                
                if (entry && entry.executor) {
                  moderator = entry.executor.tag;
                  moderatorObj = entry.executor;
                }
              }
            } catch (auditErr) {
              console.warn(`[voiceStateUpdate] Audit log fetch failed: ${auditErr.message}`);
              // Devam et - moderator bilinmeyen olarak gönder
            }

            // ❌ SELF-ACTION: Kendi kendini susturmuş → ignore et
            if (moderatorObj?.id === newState.member.id) {
              console.log(`[voiceStateUpdate] Self-mute detected: ${newState.member?.user?.tag || newState.member?.id} kendini susturdu, DM gönderilmedi`);
              return;
            }

            // Eğer hedef moderatör ise → mutual confirmation DM (moderator bilinse)
            if (moderatorObj) {
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
                return;
              }
            }

            // Normal kullanıcı → appeal DM (her durumda gönder)
            await sendMutationAppealDM(
              newState.member.user,
              newState.guild,
              'mute',
              moderator,
              'Ses kanalında susturuldunuz'
            );

            // DB'ye kaydet (moderatorUserId bilinmeyen olsa da kaydet)
            new Mutation({
              guildId: newState.guild.id,
              targetUserId: newState.member.id,
              moderatorUserId: moderatorObj?.id || 'bilinmeyen',
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
            
            let moderator = 'Bilinmeyen';
            let moderatorObj = null;
            
            // Audit log lookup
            try {
              const auditLogs = await newState.guild.fetchAuditLogs({
                type: 'MemberUpdate',
                limit: 10,
              }).catch(() => null);
              
              if (auditLogs && auditLogs.entries.size > 0) {
                // Daha geniş zaman penceresi: 10 saniye
                const entry = auditLogs.entries.find(e => 
                  e.target?.id === newState.member.id && 
                  Date.now() - e.createdTimestamp < 10000
                );
                
                if (entry && entry.executor) {
                  moderator = entry.executor.tag;
                  moderatorObj = entry.executor;
                }
              }
            } catch (auditErr) {
              console.warn(`[voiceStateUpdate] Audit log fetch failed: ${auditErr.message}`);
            }

            // ❌ SELF-ACTION: Kendi kendini sağırlaştırmış → ignore et
            if (moderatorObj?.id === newState.member.id) {
              console.log(`[voiceStateUpdate] Self-deafen detected: ${newState.member?.user?.tag || newState.member?.id} kendini sağırlaştırdı`);
              return;
            }

            // Eğer hedef moderatör ise → mutual confirmation DM (moderator bilinse)
            if (moderatorObj) {
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
                return;
              }
            }

            // Normal kullanıcı → appeal DM (her durumda gönder)
            await sendMutationAppealDM(
              newState.member.user,
              newState.guild,
              'deafen',
              moderator,
              'Ses kanalında sağırlaştırıldınız'
            );

          } catch (err) {
            console.warn("[voiceStateUpdate] Deafen appeal DM hatası:", err.message);
          }
        }

        // Kick: Ses kanalından çıkarıldı
        if (oldChannelId && !newChannelId && oldChannelId !== newChannelId) {
          try {
            const { sendMutationAppealDM } = require("../services/mutationAppealService");
            const { sendMutualConfirmationDM } = require("../services/modMutualConfirmService");
            const { detectVoiceKick } = require("../services/voiceKickDetector");
            
            // Gerçek moderator kick'ini tespit et (self-leave vs moderator action ayırt et)
            const kickInfo = await detectVoiceKick(newState, newState.guild);
            
            if (kickInfo && kickInfo.isKicked) {
              const { moderator, moderatorObj } = kickInfo;

              // ✅ GERÇEK KICK TESPIT EDILDI - Appeal DM gönder
              const isModerator = newState.member.roles.cache.some(r => 
                r.name.toLowerCase().includes('mod') ||
                r.name.toLowerCase().includes('staff') ||
                r.name.toLowerCase().includes('yetkili')
              );

              if (isModerator && moderatorObj?.id !== newState.member.id) {
                await sendMutualConfirmationDM(
                  newState.client,
                  moderatorObj,
                  newState.member.user,
                  newState.guild,
                  'kick',
                  'Ses kanalından çıkarıldı'
                );
              } else {
                // Normal kullanıcı → appeal DM
                await sendMutationAppealDM(
                  newState.member.user,
                  newState.guild,
                  'kick',
                  moderator,
                  'Ses kanalından çıkarıldınız'
                );
              }

              // DB'ye kaydet
              new Mutation({
                guildId: newState.guild.id,
                targetUserId: newState.member.id,
                moderatorUserId: moderatorObj?.id || 'bilinmeyen',
                actionType: 'kick',
                reason: 'Ses kanalından çıkarıldı',
              }).save().catch(() => {});
            } else {
              console.log(`[voiceStateUpdate] User ${newState.member?.user?.tag || newState.member?.id} voluntarily left voice channel`);
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
