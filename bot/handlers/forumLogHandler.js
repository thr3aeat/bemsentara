'use strict';

const { EmbedBuilder, AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const {
  initForumLogService,
  ensureGuildForumAndThreadsSafe,
  sendForumLog,
  handleGhostPingAndDelete,
  handleMessageEdit,
  handleMessageCreateBehavior,
  handleVoiceStateTracker,
  handleMemberJoinForensics,
  handleMemberRemoveLog,
  handleAntiNukeAndHierarchy
} = require('../services/forumLogService');

const CENTRAL_GUILD_ID = '1483482948320891074';

/**
 * Register all event listeners for the Forum Log System
 */
function setupForumLogHandlers(client) {
  // 1. Ready Event: Initialize Forum channels and threads for all servers
  client.once('ready', async () => {
    await initForumLogService(client);
  });

  // 2. Guild Join Event: Create forum channel when bot enters a new server
  client.on('guildCreate', async (guild) => {
    try {
      const centralGuild = client.guilds.cache.get(CENTRAL_GUILD_ID) ||
        await client.guilds.fetch(CENTRAL_GUILD_ID).catch(() => null);
      if (centralGuild) {
        await ensureGuildForumAndThreadsSafe(centralGuild, guild);
      }
    } catch (err) {
      console.error(`[ForumLogHandler] guildCreate error for ${guild.name}:`, err.message);
    }
  });

  // 3. Message Events
  client.on('messageDelete', async (message) => {
    try {
      await handleGhostPingAndDelete(client, message);
    } catch (err) {
      console.error('[ForumLogHandler] messageDelete error:', err.message);
    }
  });

  client.on('messageUpdate', async (oldMessage, newMessage) => {
    try {
      await handleMessageEdit(client, oldMessage, newMessage);
    } catch (err) {
      console.error('[ForumLogHandler] messageUpdate error:', err.message);
    }
  });

  client.on('messageCreate', async (message) => {
    try {
      await handleMessageCreateBehavior(client, message);
    } catch (err) {
      console.error('[ForumLogHandler] messageCreate error:', err.message);
    }
  });

  // 4. Voice Events
  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      await handleVoiceStateTracker(client, oldState, newState);
    } catch (err) {
      console.error('[ForumLogHandler] voiceStateUpdate error:', err.message);
    }
  });

  // 5. Member Join & Leave Events
  client.on('guildMemberAdd', async (member) => {
    try {
      await handleMemberJoinForensics(client, member);
    } catch (err) {
      console.error('[ForumLogHandler] guildMemberAdd error:', err.message);
    }
  });

  client.on('guildMemberRemove', async (member) => {
    try {
      await handleMemberRemoveLog(client, member);
    } catch (err) {
      console.error('[ForumLogHandler] guildMemberRemove error:', err.message);
    }
  });

  // 6. Member Update Events (Nickname, Roles, Avatar)
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
      const guild = newMember.guild;

      // Nickname Change
      if (oldMember.nickname !== newMember.nickname) {
        const nickEmbed = new EmbedBuilder()
          .setTitle('✏️ TAKMA AD (NICKNAME) DEĞİŞTİ')
          .setColor(0x3498DB)
          .addFields(
            { name: '👤 Kullanıcı', value: `${newMember.toString()} (\`${newMember.user.tag}\`)`, inline: true },
            { name: '⬅️ Eski Takma Ad', value: `\`${oldMember.nickname || oldMember.user.username}\``, inline: true },
            { name: '➡️ Yeni Takma Ad', value: `\`${newMember.nickname || newMember.user.username}\``, inline: true }
          )
          .setTimestamp();
        await sendForumLog(client, guild, 'USER_MEMBER_LOGS', nickEmbed);
      }

      // Role Changes
      const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
      const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

      if (addedRoles.size > 0 || removedRoles.size > 0) {
        // Rol adını güvenli biçimde formatla — silinmiş/önbelleksiz roller için isim + ID fallback
        const formatRole = (r) => {
          const name = r.name && r.name !== '@everyone' ? r.name : null;
          return name
            ? `**${name}** (\`${r.id}\`)`
            : `**Silinmiş Rol** (\`${r.id}\`)`;
        };

        // Audit log'dan işlemi yapan yetkiliyi çek
        let executorText = 'Bilinmiyor';
        try {
          const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 5 }).catch(() => null);
          const entry = audit?.entries?.find(e => e.target?.id === newMember.id && (Date.now() - e.createdTimestamp) < 10000);
          if (entry?.executor) {
            executorText = `${entry.executor.toString()} (\`${entry.executor.tag}\`)`;
          }
        } catch (_) {}

        const roleEmbed = new EmbedBuilder()
          .setTitle('🛡️ ÜYE ROL DEĞİŞİKLİĞİ')
          .setColor(0x9B59B6)
          .setDescription(
            `**Kullanıcı:** ${newMember.toString()} (\`${newMember.id}\`)\n` +
            `**İşlemi Yapan:** ${executorText}`
          )
          .setTimestamp();

        if (addedRoles.size > 0) {
          roleEmbed.addFields({
            name: '➕ Eklenen Roller',
            value: addedRoles.map(formatRole).join('\n') || '—',
            inline: false
          });
        }
        if (removedRoles.size > 0) {
          roleEmbed.addFields({
            name: '➖ Çıkarılan Roller',
            value: removedRoles.map(formatRole).join('\n') || '—',
            inline: false
          });
        }

        await sendForumLog(client, guild, 'USER_MEMBER_LOGS', roleEmbed);
      }
    } catch (err) {
      console.error('[ForumLogHandler] guildMemberUpdate error:', err.message);
    }
  });

  // 7. Moderation Ban & Unban Events
  client.on('guildBanAdd', async (ban) => {
    try {
      const guild = ban.guild;
      const user = ban.user;

      const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null);
      const entry = audit?.entries?.first();
      const executor = entry?.target?.id === user.id ? entry.executor : null;

      const banEmbed = new EmbedBuilder()
        .setTitle('⛔ KULLANICI YASAKLANDI (BAN)')
        .setColor(0xFF0000)
        .addFields(
          { name: '👤 Yasaklanan Üye', value: `${user.tag} (\`${user.id}\`)`, inline: true },
          { name: '🛡️ Uygulayan Yetkili', value: executor ? `${executor.tag} (\`${executor.id}\`)` : 'Bilinmiyor', inline: true },
          { name: '📋 Gerekçe', value: ban.reason || entry?.reason || 'Gerekçe belirtilmedi', inline: false }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await sendForumLog(client, guild, 'MODERATION_PUNISHMENT', banEmbed);

      if (executor) {
        await handleAntiNukeAndHierarchy(client, guild, executor, 'MEMBER_BAN');
      }
    } catch (err) {
      console.error('[ForumLogHandler] guildBanAdd error:', err.message);
    }
  });

  client.on('guildBanRemove', async (ban) => {
    try {
      const guild = ban.guild;
      const user = ban.user;

      const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 }).catch(() => null);
      const entry = audit?.entries?.first();
      const executor = entry?.target?.id === user.id ? entry.executor : null;

      const unbanEmbed = new EmbedBuilder()
        .setTitle('✅ YASAK KALDIRILDI (UNBAN)')
        .setColor(0x2ECC71)
        .addFields(
          { name: '👤 Yasağı Kaldırılan', value: `${user.tag} (\`${user.id}\`)`, inline: true },
          { name: '🛡️ İşlemi Yapan', value: executor ? `${executor.tag} (\`${executor.id}\`)` : 'Bilinmiyor', inline: true }
        )
        .setTimestamp();

      await sendForumLog(client, guild, 'MODERATION_PUNISHMENT', unbanEmbed);

      // Erken Af Logu (Early Unban)
      const earlyAfEmbed = new EmbedBuilder()
        .setTitle('🕊️ YÖNETİCİ ERKEN AF LOGU')
        .setColor(0x3498DB)
        .setDescription(`**Yasağı Kaldırılan:** ${user.tag}\n**Affeden Yetkili:** ${executor ? executor.toString() : 'Bilinmiyor'}\n*Ceza süresi dolmadan manuel unban atıldı.*`)
        .setTimestamp();

      await sendForumLog(client, guild, 'SERVER_HEALTH_ECONOMY', earlyAfEmbed);
    } catch (err) {
      console.error('[ForumLogHandler] guildBanRemove error:', err.message);
    }
  });

  // 8. Channel Configuration Events
  client.on('channelCreate', async (channel) => {
    if (!channel.guild) return;
    try {
      const createEmbed = new EmbedBuilder()
        .setTitle('➕ KANAL OLUŞTURULDU')
        .setColor(0x2ECC71)
        .addFields(
          { name: '📍 Kanal Adı', value: `${channel.name} (\`<#${channel.id}>\`)`, inline: true },
          { name: '📂 Tür', value: `\`${channel.type}\``, inline: true }
        )
        .setTimestamp();

      await sendForumLog(client, channel.guild, 'CHANNEL_ROLE_CONFIG', createEmbed);
    } catch (err) {
      console.error('[ForumLogHandler] channelCreate error:', err.message);
    }
  });

  client.on('channelDelete', async (channel) => {
    if (!channel.guild) return;
    try {
      const audit = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(() => null);
      const entry = audit?.entries?.first();
      const executor = entry?.target?.id === channel.id ? entry.executor : null;

      const delEmbed = new EmbedBuilder()
        .setTitle('🗑️ KANAL SİLİNDİ')
        .setColor(0xE74C3C)
        .addFields(
          { name: '📍 Silinen Kanal', value: `\`${channel.name}\` (ID: \`${channel.id}\`)`, inline: true },
          { name: '🛡️ Siler Yetkili', value: executor ? `${executor.tag}` : 'Bilinmiyor', inline: true }
        )
        .setTimestamp();

      await sendForumLog(client, channel.guild, 'CHANNEL_ROLE_CONFIG', delEmbed);

      if (executor) {
        await handleAntiNukeAndHierarchy(client, channel.guild, executor, 'CHANNEL_DELETE');
      }
    } catch (err) {
      console.error('[ForumLogHandler] channelDelete error:', err.message);
    }
  });

  // 9. Role Configuration Events
  client.on('roleCreate', async (role) => {
    try {
      const roleEmbed = new EmbedBuilder()
        .setTitle('✨ YENİ ROL OLUŞTURULDU')
        .setColor(0x2ECC71)
        .addFields(
          { name: '🛡️ Rol Adı', value: `${role.name} (\`${role.id}\`)`, inline: true },
          { name: '🎨 Renk', value: `\`${role.hexColor}\``, inline: true }
        )
        .setTimestamp();

      await sendForumLog(client, role.guild, 'CHANNEL_ROLE_CONFIG', roleEmbed);
    } catch (err) {
      console.error('[ForumLogHandler] roleCreate error:', err.message);
    }
  });

  client.on('roleDelete', async (role) => {
    try {
      const roleEmbed = new EmbedBuilder()
        .setTitle('🗑️ ROL SİLİNDİ')
        .setColor(0xE74C3C)
        .setDescription(`**Silinen Rol:** \`${role.name}\` (ID: \`${role.id}\`)`)
        .setTimestamp();

      await sendForumLog(client, role.guild, 'CHANNEL_ROLE_CONFIG', roleEmbed);
    } catch (err) {
      console.error('[ForumLogHandler] roleDelete error:', err.message);
    }
  });

  // 10. Server Updates & Invites & Emojis
  client.on('inviteCreate', async (invite) => {
    if (!invite.guild) return;
    try {
      const invEmbed = new EmbedBuilder()
        .setTitle('🔗 DAVET BAĞLANTISI OLUŞTURULDU')
        .setColor(0x3498DB)
        .addFields(
          { name: '🔗 Kodu', value: `\`${invite.code}\``, inline: true },
          { name: '👤 Oluşturan', value: `${invite.inviter?.toString() || 'Bilinmiyor'}`, inline: true },
          { name: '📍 Kanal', value: `<#${invite.channelId}>`, inline: true }
        )
        .setTimestamp();

      await sendForumLog(client, invite.guild, 'SERVER_UPDATES_LOGS', invEmbed);
    } catch (err) {
      console.error('[ForumLogHandler] inviteCreate error:', err.message);
    }
  });

  client.on('emojiCreate', async (emoji) => {
    try {
      const emojiEmbed = new EmbedBuilder()
        .setTitle('😀 YENİ EMOJİ EKLENDİ')
        .setColor(0x2ECC71)
        .setDescription(`**Emoji:** ${emoji.toString()} \`:${emoji.name}:\` (ID: \`${emoji.id}\`)`)
        .setTimestamp();

      await sendForumLog(client, emoji.guild, 'SERVER_UPDATES_LOGS', emojiEmbed);
    } catch (err) {
      console.error('[ForumLogHandler] emojiCreate error:', err.message);
    }
  });
}

module.exports = { setupForumLogHandlers };
