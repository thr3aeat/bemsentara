const { ChannelType, PermissionFlagsBits } = require("discord.js");

// Protection against event loop recursion
const processingChannels = new Set();
const processedCooldowns = new Map();
const COOLDOWN_MS = 60000; // 1 minute cooldown per channel

/**
 * Normalizes Turkish characters and lowercases a string.
 * @param {string} str 
 * @returns {string}
 */
function normalizeString(str) {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u');
}

/**
 * Applies strict privacy overwrites: Denies ViewChannel to @everyone and all Moderator/Staff roles.
 * @param {import("discord.js").GuildChannel} channelOrCategory 
 */
async function applyPrivateArchivePermissions(channelOrCategory) {
  try {
    const guild = channelOrCategory.guild;
    await guild.roles.fetch().catch(() => {});

    // Collect all overwrites: @everyone is denied ViewChannel
    const overwrites = [
      {
        id: guild.id, // @everyone role
        deny: [PermissionFlagsBits.ViewChannel]
      }
    ];

    // Deny ViewChannel for all staff/mod roles (unless they possess full Administrator permissions)
    guild.roles.cache.forEach(role => {
      if (role.id === guild.id) return; // skip @everyone
      
      // If role has Administrator permission, leave them untouched so full admins/owner can view
      if (role.permissions.has(PermissionFlagsBits.Administrator)) return;

      const lowerRoleName = role.name.toLowerCase();
      const isModOrStaff = role.permissions.has(PermissionFlagsBits.ManageMessages) ||
                           role.permissions.has(PermissionFlagsBits.ModerateMembers) ||
                           role.permissions.has(PermissionFlagsBits.ManageChannels) ||
                           role.permissions.has(PermissionFlagsBits.KickMembers) ||
                           role.permissions.has(PermissionFlagsBits.BanMembers) ||
                           lowerRoleName.includes('mod') ||
                           lowerRoleName.includes('yetkili') ||
                           lowerRoleName.includes('personel') ||
                           lowerRoleName.includes('stajyer') ||
                           lowerRoleName.includes('sekreter') ||
                           lowerRoleName.includes('rehber') ||
                           lowerRoleName.includes('koordinatör');

      if (isModOrStaff) {
        overwrites.push({
          id: role.id,
          deny: [PermissionFlagsBits.ViewChannel]
        });
      }
    });

    await channelOrCategory.permissionOverwrites.set(overwrites, "Otomatik Özel Arşiv İzinleri (@everyone ve Modlar Engellendi)").catch(() => {});
  } catch (err) {
    console.error(`[ArchiveService] Error applying permissions to "${channelOrCategory?.name}":`, err.message);
  }
}

/**
 * Checks if a channel ends with "-arşiv" or "-arsiv" and processes it accordingly.
 * Makes the channel strictly private: @everyone and ALL moderators CANNOT view it!
 * @param {import("discord.js").GuildChannel} channel
 */
async function handleArchiveChannel(channel) {
  if (!channel || !channel.guild || !channel.id) return;

  // 1. Lock check to prevent channelUpdate infinite loops
  if (processingChannels.has(channel.id)) return;

  const lastProcessed = processedCooldowns.get(channel.id);
  if (lastProcessed && (Date.now() - lastProcessed) < COOLDOWN_MS) {
    return;
  }

  // Skip categories and threads
  if (channel.type === ChannelType.GuildCategory || channel.isThread?.()) return;

  const name = channel.name;
  if (!name) return;

  const normalizedName = normalizeString(name);
  if (!normalizedName.endsWith("-arsiv")) return;

  // Check if @everyone is already denied ViewChannel
  const everyoneOverwrite = channel.permissionOverwrites?.cache?.get(channel.guild.id);
  const isEveryoneDenied = everyoneOverwrite?.deny?.has(PermissionFlagsBits.ViewChannel);

  // Find or check "🗂️ Arşiv" category
  let archiveCategory = channel.guild.channels.cache.find(c => {
    if (c.type !== ChannelType.GuildCategory) return false;
    const normalizedCatName = normalizeString(c.name);
    return normalizedCatName.includes("arsiv") || normalizedCatName.includes("arşiv");
  });

  const isInArchiveCategory = archiveCategory && channel.parentId === archiveCategory.id;

  // If already private and in archive category, skip re-applying permissions to avoid API loops
  if (isEveryoneDenied && isInArchiveCategory) {
    return;
  }

  processingChannels.add(channel.id);
  processedCooldowns.set(channel.id, Date.now());

  try {
    console.log(`[ArchiveService] 🔒 Private Archive action initiated for channel: "${channel.name}" (${channel.id}) in guild: "${channel.guild.name}"`);

    if (!archiveCategory) {
      archiveCategory = await channel.guild.channels.create({
        name: "🗂️ Arşiv",
        type: ChannelType.GuildCategory,
        reason: "Gizli Otomatik Arşiv Kategorisi"
      }).catch(() => null);
    }

    if (archiveCategory) {
      await applyPrivateArchivePermissions(archiveCategory);
      if (channel.parentId !== archiveCategory.id) {
        await channel.setParent(archiveCategory.id, { lockPermissions: false }).catch(() => {});
        console.log(`[ArchiveService] Successfully moved "${channel.name}" to category "${archiveCategory.name}".`);
      }
    }

    // Apply strict privacy overwrites to the Archive Channel
    await applyPrivateArchivePermissions(channel);
    console.log(`[ArchiveService] ✅ Channel "${channel.name}" is now completely private (@everyone & Moderators hidden).`);
  } catch (error) {
    console.error(`[ArchiveService] Error processing archive channel "${channel?.name}":`, error.message || error);
  } finally {
    processingChannels.delete(channel.id);
  }
}

module.exports = { handleArchiveChannel, applyPrivateArchivePermissions };
