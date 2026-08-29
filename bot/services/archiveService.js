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

/**
 * !arsiv / !arşiv komutunu işler.
 * Verilen kanal ID'lerini (veya argüman yoksa mevcut kanalı) 1543376002477068409 kategorisine taşır ve gizli yapar.
 * @param {import("discord.js").Message} message
 * @param {string[]} args
 */
async function handleArsivCommand(message, args = []) {
  if (!message.guild) return;

  const isAdmin = message.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
                  message.member?.permissions?.has(PermissionFlagsBits.ManageChannels) ||
                  message.author.id === "1031620522406072350" ||
                  message.author.id === message.guild.ownerId;

  if (!isAdmin) {
    return message.reply("❌ Bu komutu kullanmak için `Kanalları Yönet` veya `Yönetici` yetkisine sahip olmalısınız.");
  }

  const TARGET_CATEGORY_ID = "1543376002477068409";

  // 1. Hedef kategoriyi bul veya getir
  await message.guild.channels.fetch().catch(() => {});
  let targetCategory = message.guild.channels.cache.get(TARGET_CATEGORY_ID);
  if (!targetCategory) {
    targetCategory = await message.guild.channels.fetch(TARGET_CATEGORY_ID).catch(() => null);
  }

  if (!targetCategory) {
    return message.reply(`❌ Hedef arşiv kategorisi (\`${TARGET_CATEGORY_ID}\`) bu sunucuda bulunamadı.`);
  }

  // Hedef kategorinin izinlerini de tamamen gizli/özel yap
  await applyPrivateArchivePermissions(targetCategory).catch(() => {});

  // 2. Kanal ID'lerini topla (virgül, boşluk veya mention ile ayrılmış olabilir)
  const fullText = message.content.replace(/^(!|\.|\-)(arsiv|arşiv|arsivle|arşivle)/i, "").trim();
  const matchedIds = fullText.match(/\b\d{17,20}\b/g) || [];
  
  // Hedef kategori ID'sini listeden çıkar
  let channelIds = matchedIds.filter(id => id !== TARGET_CATEGORY_ID);

  // Hiç ID belirtilmemişse mevcut kanalı hedef al
  if (channelIds.length === 0) {
    if (message.channel && message.channel.type !== ChannelType.GuildCategory) {
      channelIds = [message.channel.id];
    } else {
      return message.reply("❌ Lütfen arşivlenecek kanal ID'lerini giriniz. Örnek: `!arsiv 123456789012345678, 987654321098765432` veya kanalda doğrudan `!arsiv` yazınız.");
    }
  }

  // Tekrarlayan ID'leri filtrele
  channelIds = [...new Set(channelIds)];

  const statusMsg = await message.reply(`⏳ **${channelIds.length}** kanal 🗂️ **${targetCategory.name}** (\`${TARGET_CATEGORY_ID}\`) kategorisine taşınıyor ve gizleniyor...`);

  const successList = [];
  const failedList = [];

  for (const chId of channelIds) {
    try {
      let channel = message.guild.channels.cache.get(chId);
      if (!channel) {
        channel = await message.guild.channels.fetch(chId).catch(() => null);
      }

      if (!channel) {
        failedList.push({ id: chId, reason: "Kanal sunucuda bulunamadı." });
        continue;
      }

      if (channel.type === ChannelType.GuildCategory) {
        failedList.push({ id: chId, name: channel.name, reason: "Kategoriler arşivlenemez." });
        continue;
      }

      // 1) Kanal ismini opsiyonel olarak kontrol et
      let cleanName = channel.name;
      const norm = normalizeString(cleanName);
      if (!norm.endsWith("-arsiv")) {
        cleanName = `${channel.name}-arsiv`;
        await channel.setName(cleanName, "Arşiv Komutu ile İsim Güncellemesi").catch(() => {});
      }

      // 2) Hedef kategoriye taşı
      await channel.setParent(targetCategory.id, { lockPermissions: false }).catch(() => {});

      // 3) Kesin gizlilik izinlerini uygula (@everyone ve tüm mod rolleri engellenir)
      await applyPrivateArchivePermissions(channel);

      successList.push({ id: channel.id, name: channel.name });
    } catch (err) {
      console.error(`[ArchiveService] Kanal ${chId} arşivlenirken hata:`, err);
      failedList.push({ id: chId, reason: err.message || "Bilinmeyen hata" });
    }
  }

  // Sonuç raporunu hazırla
  let replyText = `🔒 **Arşivleme İşlemi Tamamlandı!**\n` +
                  `📁 **Hedef Kategori:** **${targetCategory.name}** (\`${TARGET_CATEGORY_ID}\`)\n\n`;

  if (successList.length > 0) {
    replyText += `✅ **Başarıyla Arşivlenen ve Gizlenen Kanallar (${successList.length}):**\n`;
    successList.forEach(s => {
      replyText += `- #${s.name} (\`${s.id}\`)\n`;
    });
    replyText += `\n🛡️ *Bu kanallar artık @everyone ve moderatörler tarafından görüntülenemez.*\n\n`;
  }

  if (failedList.length > 0) {
    replyText += `❌ **Başarısız Olanlar (${failedList.length}):**\n`;
    failedList.forEach(f => {
      const nameStr = f.name ? `#${f.name} ` : "";
      replyText += `- ${nameStr}(\`${f.id}\`): ${f.reason}\n`;
    });
  }

  if (replyText.length > 2000) {
    const chunks = replyText.match(/[\s\S]{1,1950}/g) || [];
    await statusMsg.edit(chunks[0]).catch(() => message.reply(chunks[0]));
    for (let i = 1; i < chunks.length; i++) {
      await message.channel.send(chunks[i]);
    }
  } else {
    await statusMsg.edit(replyText).catch(() => message.reply(replyText));
  }
}

module.exports = {
  handleArchiveChannel,
  applyPrivateArchivePermissions,
  scanAndFixArchivedTicketPermissions,
  handleArsivCommand
};

