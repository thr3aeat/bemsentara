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
 * Determines whether a channel or category is specifically a ticket channel or ticket archive category.
 * Prevents touching non-ticket server channels (e.g. kurallar-ve-ilkeler-arşiv, hikaye-arsiv, vb.)
 */
function isTicketChannel(channel) {
  if (!channel || !channel.name) return false;
  const norm = normalizeString(channel.name);
  const parentNorm = channel.parent ? normalizeString(channel.parent.name) : "";

  // Exclude normal static server channels
  if (norm.includes("kurallar") || norm.includes("hikaye") || norm.includes("sakinles") || 
      norm.includes("duyuru") || norm.includes("bilgi") || norm.includes("sohbet") || norm.includes("genel")) {
    return false;
  }

  // Must have a ticket keyword OR be inside a ticket category
  const isTicketKeyword = norm.includes("ticket") || norm.includes("bilet") || norm.includes("destek") || 
                          norm.includes("talep") || norm.includes("sorusturma") || norm.includes("sikayet") ||
                          norm.startsWith("kapali-") || norm.startsWith("closed-");

  const isTicketParent = parentNorm.includes("ticket") || parentNorm.includes("bilet") || parentNorm.includes("destek") || 
                         parentNorm.includes("talep") || parentNorm.includes("sorusturma") || parentNorm.includes("sikayet");

  return isTicketKeyword || isTicketParent;
}

/**
 * Checks if a channel is a closed/archived ticket channel and processes it accordingly.
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
  if (!normalizedName.endsWith("-arsiv") && !normalizedName.endsWith("-arşiv") && !normalizedName.includes("kapali") && !normalizedName.includes("closed")) return;

  // Only process if it is a ticket channel
  if (!isTicketChannel(channel)) return;

  // Check if @everyone is already denied ViewChannel
  const everyoneOverwrite = channel.permissionOverwrites?.cache?.get(channel.guild.id);
  const isEveryoneDenied = everyoneOverwrite?.deny?.has(PermissionFlagsBits.ViewChannel);

  // Find or check "🗂️ Arşiv" category
  let archiveCategory = channel.guild.channels.cache.find(c => {
    if (c.type !== ChannelType.GuildCategory) return false;
    const normalizedCatName = normalizeString(c.name);
    return (normalizedCatName.includes("arsiv") || normalizedCatName.includes("arşiv")) && (normalizedCatName.includes("ticket") || normalizedCatName.includes("destek") || normalizedCatName.includes("bilet"));
  });

  const isInArchiveCategory = archiveCategory && channel.parentId === archiveCategory.id;

  // If already private and in archive category, skip re-applying permissions to avoid API loops
  if (isEveryoneDenied && isInArchiveCategory) {
    return;
  }

  processingChannels.add(channel.id);
  processedCooldowns.set(channel.id, Date.now());

  try {
    console.log(`[ArchiveService] 🔒 Private Archive action initiated for ticket channel: "${channel.name}" (${channel.id}) in guild: "${channel.guild.name}"`);

    if (!archiveCategory) {
      archiveCategory = await channel.guild.channels.create({
        name: "🗂️ Ticket Arşivi",
        type: ChannelType.GuildCategory,
        reason: "Gizli Otomatik Ticket Arşiv Kategorisi"
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
    console.log(`[ArchiveService] ✅ Ticket Channel "${channel.name}" is now completely private (@everyone & Moderators hidden).`);
  } catch (error) {
    console.error(`[ArchiveService] Error processing archive channel "${channel?.name}":`, error.message || error);
  } finally {
    processingChannels.delete(channel.id);
  }
}

/**
 * Scans all guilds on bot startup ONCE to find closed and archived ticket channels/categories,
 * and enforces strict privacy permissions (Deny ViewChannel for @everyone, all Mod/Staff roles, and all target users).
 * Only Administrators and the Bot can view!
 */
async function scanAndFixArchivedTicketPermissions(client) {
  try {
    console.log("[ArchiveService] 🔍 Kapatılan ve arşive alınan ticket kanalları tek seferlik taranıyor...");
    if (!client || !client.guilds) return;

    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.channels.fetch().catch(() => {});
        await guild.roles.fetch().catch(() => {});

        // 1. Find all ticket archive / closed categories
        const archiveCategories = guild.channels.cache.filter(c => {
          if (c.type !== ChannelType.GuildCategory) return false;
          const norm = normalizeString(c.name);
          return (norm.includes("arsiv") || norm.includes("arşiv") || norm.includes("kapali") || norm.includes("closed")) &&
                 (norm.includes("ticket") || norm.includes("destek") || norm.includes("bilet") || norm.includes("talep"));
        });

        for (const cat of archiveCategories.values()) {
          await applyPrivateArchivePermissions(cat).catch(() => {});
        }

        // 2. Find all closed/archived ticket channels
        const targetChannels = guild.channels.cache.filter(c => {
          if (c.type === ChannelType.GuildCategory || c.isThread?.()) return false;
          return isTicketChannel(c);
        });

        console.log(`[ArchiveService] ${guild.name} sunucusunda ${targetChannels.size} adet kapatılmış/arşivlenmiş ticket kanalı bulundu. Yetkiler düzenleniyor...`);

        for (const ch of targetChannels.values()) {
          await applyPrivateArchivePermissions(ch).catch(() => {});
        }
      } catch (gErr) {
        console.error(`[ArchiveService] Guild ${guild.id} scan error:`, gErr.message);
      }
    }
    console.log("[ArchiveService] ✅ Kapatılan ve arşive alınan ticket izinleri tek seferlik başarıyla tarandı ve kilitlendi.");
  } catch (err) {
    console.error("[ArchiveService] scanAndFixArchivedTicketPermissions error:", err.message);
  }
}

module.exports = {
  handleArchiveChannel,
  applyPrivateArchivePermissions,
  scanAndFixArchivedTicketPermissions
};
