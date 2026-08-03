'use strict';

/**
 * Timed Ban & Mute Management System
 * - Süreli banlar (Temporary bans with auto-unban)
 * - Süreli muteler
 * - Unban davetleri (invite links when unbanned)
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const User = require('../../models/User');

// In-memory timed bans map (bot restarts will lose data - TODO: move to DB)
const timedBans = new Map();
const timedMutes = new Map();

/**
 * Apply timed ban to user
 */
async function applyTimedBan(interaction, userId, durationDays, reason = 'Belirtilmedi') {
  try {
    const guild = interaction.guild;
    const client = interaction.client;

    // Ban user from guild
    try {
      await guild.bans.create(userId, { reason: `[${durationDays} Gün] ${reason}` });
    } catch (err) {
      throw new Error(`Kullanıcı banlanamadı: ${err.message}`);
    }

    // Calculate unban time
    const unbanTime = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
    const bannedUser = await client.users.fetch(userId).catch(() => null);

    // Store in memory
    timedBans.set(userId, {
      guildId: guild.id,
      duration: durationDays,
      reason,
      bannedAt: new Date(),
      unbanAt: new Date(unbanTime),
    });

    // Store in database
    try {
      let dbUser = await User.findOne({ discordId: userId });
      if (!dbUser) {
        dbUser = new User({
          discordId: userId,
          discordUsername: bannedUser?.tag || 'Bilinmeyen',
        });
      }

      dbUser.isBanned = true;
      dbUser.banReason = reason;
      dbUser.bannedAt = new Date();
      dbUser.bannedBy = interaction.user.id;
      dbUser.timedBan = {
        durationDays,
        unbanAt: new Date(unbanTime),
      };

      await dbUser.save();
    } catch (dbErr) {
      console.warn('[timedBanService] DB save failed:', dbErr.message);
    }

    // Send ban notification DM
    if (bannedUser) {
      const banEmbed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle(`🚫 ${durationDays} Günlük Yasaklandınız`)
        .setDescription(
          `**${guild.name}** sunucusundan **${durationDays} gün** için yasaklandınız.\n\n` +
          `**Kaldırılacak Tarih:** <t:${Math.floor(unbanTime / 1000)}:f>\n` +
          `**Sebep:** ${reason}\n` +
          `**Yetkili:** ${interaction.user.tag}`
        )
        .setFooter({ text: 'Süreli Ban Sistemi • Ekoyıldız' })
        .setTimestamp();

      await bannedUser.send({ embeds: [banEmbed] }).catch(() => {});
    }

    return {
      success: true,
      message: `✅ **${bannedUser?.tag || userId}** başarıyla ${durationDays} gün için banlandı.`,
      unbanTime,
    };
  } catch (err) {
    console.error('[timedBanService] applyTimedBan error:', err.message);
    throw err;
  }
}

/**
 * Remove timed ban and send invite link
 */
async function removeTimedBan(interaction, userId) {
  try {
    const guild = interaction.guild;
    const client = interaction.client;

    // Remove ban from Discord
    try {
      await guild.bans.remove(userId, 'Süreli ban süresi doldu');
    } catch (err) {
      throw new Error(`Ban kaldırılamadı: ${err.message}`);
    }

    // Get unbanned user
    const unbannedUser = await client.users.fetch(userId).catch(() => null);

    // Create invite link (permanent)
    const inviteLink = await guild.channels.cache
      .find(c => c.isTextBased())
      ?.createInvite({
        maxAge: 0, // Permanent
        maxUses: 1, // One time use
        unique: true,
      })
      .catch(() => null);

    // Update database
    try {
      const dbUser = await User.findOne({ discordId: userId });
      if (dbUser) {
        dbUser.isBanned = false;
        dbUser.banReason = null;
        dbUser.bannedAt = null;
        dbUser.timedBan = null;
        await dbUser.save();
      }
    } catch (dbErr) {
      console.warn('[timedBanService] DB update failed:', dbErr.message);
    }

    // Remove from memory
    timedBans.delete(userId);

    // Send unban notification DM with invite
    if (unbannedUser) {
      const unbanEmbed = new EmbedBuilder()
        .setColor(0x4ade80)
        .setTitle(`✅ Yasaklama Süresi Sona Erdi`)
        .setDescription(
          `**${guild.name}** sunucusundaki yasaklamanız sona ermiştir.\n\n` +
          `Sunucuya yeniden katılmak için aşağıdaki davetiye tıklayabilirsiniz.`
        )
        .setFooter({ text: 'Süreli Ban Sistemi • Ekoyıldız' })
        .setTimestamp();

      const inviteRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('🔗 Sunucuya Geri Dön')
          .setURL(inviteLink || `https://discord.gg/${guild.vanityURLCode || 'invite'}`)
          .setStyle(ButtonStyle.Link)
      );

      await unbannedUser.send({
        embeds: [unbanEmbed],
        components: inviteRow,
      }).catch(() => {});
    }

    return {
      success: true,
      message: `✅ **${unbannedUser?.tag || userId}** başarıyla banı kaldırıldı. Davet linki gönderildi.`,
      inviteLink,
    };
  } catch (err) {
    console.error('[timedBanService] removeTimedBan error:', err.message);
    throw err;
  }
}

/**
 * Apply timed mute to user
 */
async function applyTimedMute(interaction, userId, durationHours, reason = 'Belirtilmedi') {
  try {
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) {
      throw new Error('Kullanıcı sunucuda bulunamadı');
    }

    const muteDuration = durationHours * 60 * 60 * 1000; // Convert to milliseconds
    const unmuteTime = Date.now() + muteDuration;

    // Apply timeout to member
    await member.timeout(muteDuration, `[${durationHours}h] ${reason}`);

    // Store in memory
    timedMutes.set(userId, {
      guildId: interaction.guild.id,
      duration: durationHours,
      reason,
      mutedAt: new Date(),
      unmuteAt: new Date(unmuteTime),
    });

    // Send DM
    const muteEmbed = new EmbedBuilder()
      .setColor(0xff9500)
      .setTitle(`🔇 ${durationHours} Saatlik Susturuldunuz`)
      .setDescription(
        `**${interaction.guild.name}** sunucusundan **${durationHours} saat** susturuldunuz.\n\n` +
        `**Açılacak Tarih:** <t:${Math.floor(unmuteTime / 1000)}:f>\n` +
        `**Sebep:** ${reason}\n` +
        `**Yetkili:** ${interaction.user.tag}`
      )
      .setFooter({ text: 'Süreli Mute Sistemi • Ekoyıldız' })
      .setTimestamp();

    await member.user.send({ embeds: [muteEmbed] }).catch(() => {});

    return {
      success: true,
      message: `✅ **${member.user.tag}** başarıyla ${durationHours} saat için susturuldu.`,
      unmuteTime,
    };
  } catch (err) {
    console.error('[timedBanService] applyTimedMute error:', err.message);
    throw err;
  }
}

/**
 * Get all active timed bans
 */
function getActiveBans() {
  const now = Date.now();
  return Array.from(timedBans.entries()).filter(([, ban]) => ban.unbanAt.getTime() > now);
}

/**
 * Get all active timed mutes
 */
function getActiveMutes() {
  const now = Date.now();
  return Array.from(timedMutes.entries()).filter(([, mute]) => mute.unmuteAt.getTime() > now);
}

/**
 * Auto-unban checker (call periodically)
 */
async function checkAndProcessTimedBans(client) {
  const now = Date.now();
  const bansToRemove = [];

  for (const [userId, banInfo] of timedBans.entries()) {
    if (banInfo.unbanAt.getTime() <= now) {
      try {
        const guild = await client.guilds.fetch(banInfo.guildId).catch(() => null);
        if (guild) {
          const result = await removeTimedBan({ guild, user: { id: userId }, client }, userId);
          console.log(`[timedBanService] Auto-unban: ${result.message}`);
        }
        bansToRemove.push(userId);
      } catch (err) {
        console.error(`[timedBanService] Auto-unban failed for ${userId}:`, err.message);
      }
    }
  }

  bansToRemove.forEach(userId => timedBans.delete(userId));
  return bansToRemove.length;
}

module.exports = {
  applyTimedBan,
  removeTimedBan,
  applyTimedMute,
  getActiveBans,
  getActiveMutes,
  checkAndProcessTimedBans,
  timedBans,
  timedMutes,
};
