/**
 * moderatorSelector.js
 * 
 * Uygun moderatör seçer: Online > Idle > DND > Offline
 * En son aktif olan moderatörü bulur
 */

const { PresenceUpdateStatus } = require("discord.js");

/**
 * Sunucudaki tüm moderatörleri bulur
 * @param {Guild} guild 
 * @returns {Promise<Array<GuildMember>>}
 */
async function getAllModerators(guild) {
  try {
    await guild.members.fetch();
    
    const moderators = guild.members.cache.filter(member => {
      if (member.user.bot) return false;
      
      // "mod", "moderator", "yetkili", "staff" gibi rolleri kontrol et
      const hasModerationRole = member.roles.cache.some(role => {
        const roleName = role.name.toLowerCase();
        return (
          roleName.includes('mod') ||
          roleName.includes('yetkili') ||
          roleName.includes('staff') ||
          roleName.includes('yönetici') ||
          roleName.includes('admin')
        );
      });
      
      // Veya yönetici yetkisi var mı?
      const hasAdminPermission = member.permissions.has('Administrator');
      
      return hasModerationRole || hasAdminPermission;
    });
    
    return Array.from(moderators.values());
  } catch (err) {
    console.error("[ModeratorSelector] Moderatör listesi alınamadı:", err.message);
    return [];
  }
}

/**
 * Presence durumuna göre öncelik puanı
 * @param {string} status 
 * @returns {number}
 */
function getStatusPriority(status) {
  switch (status) {
    case 'online': return 4;
    case 'idle': return 3;
    case 'dnd': return 2;
    case 'offline': return 1;
    default: return 0;
  }
}

/**
 * En uygun moderatörü seçer
 * @param {Guild} guild 
 * @returns {Promise<GuildMember|null>}
 */
async function selectBestModerator(guild) {
  try {
    const moderators = await getAllModerators(guild);
    
    if (moderators.length === 0) {
      console.warn("[ModeratorSelector] Hiç moderatör bulunamadı!");
      return null;
    }
    
    // 1. Presence durumuna göre sırala
    const sortedByStatus = moderators.sort((a, b) => {
      const statusA = a.presence?.status || 'offline';
      const statusB = b.presence?.status || 'offline';
      return getStatusPriority(statusB) - getStatusPriority(statusA);
    });
    
    // 2. Online olanlar varsa ilk online moderatörü döndür
    const onlineMod = sortedByStatus.find(m => m.presence?.status === 'online');
    if (onlineMod) {
      console.log(`[ModeratorSelector] Online moderatör bulundu: ${onlineMod.user.tag}`);
      return onlineMod;
    }
    
    // 3. Idle olanlar varsa
    const idleMod = sortedByStatus.find(m => m.presence?.status === 'idle');
    if (idleMod) {
      console.log(`[ModeratorSelector] Idle moderatör bulundu: ${idleMod.user.tag}`);
      return idleMod;
    }
    
    // 4. DND olanlar varsa
    const dndMod = sortedByStatus.find(m => m.presence?.status === 'dnd');
    if (dndMod) {
      console.log(`[ModeratorSelector] DND moderatör bulundu: ${dndMod.user.tag}`);
      return dndMod;
    }
    
    // 5. Hiç online yoksa - en son aktif olanı bul (son mesaj tarihine göre)
    console.log("[ModeratorSelector] Hiç online moderatör yok, en son aktif olan aranıyor...");
    
    // En son mesaj atan moderatörü bul
    let mostRecentMod = null;
    let mostRecentTimestamp = 0;
    
    for (const mod of moderators) {
      try {
        // Son mesajlarını kontrol et (tüm kanallarda)
        const channels = guild.channels.cache.filter(ch => ch.isTextBased());
        
        for (const channel of channels.values()) {
          try {
            const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
            if (!messages) continue;
            
            const modMessage = messages.find(msg => msg.author.id === mod.id);
            if (modMessage && modMessage.createdTimestamp > mostRecentTimestamp) {
              mostRecentTimestamp = modMessage.createdTimestamp;
              mostRecentMod = mod;
            }
          } catch (err) {
            // Kanal erişim hatası - pas geç
          }
        }
      } catch (err) {
        console.warn(`[ModeratorSelector] ${mod.user.tag} için mesaj kontrolü başarısız:`, err.message);
      }
    }
    
    if (mostRecentMod) {
      console.log(`[ModeratorSelector] En son aktif moderatör bulundu: ${mostRecentMod.user.tag}`);
      return mostRecentMod;
    }
    
    // 6. Son çare: İlk moderatörü döndür
    console.log(`[ModeratorSelector] Fallback: İlk moderatör seçildi: ${moderators[0].user.tag}`);
    return moderators[0];
    
  } catch (err) {
    console.error("[ModeratorSelector] Moderatör seçimi başarısız:", err.message);
    return null;
  }
}

/**
 * Moderatörün müsait olup olmadığını kontrol eder
 * (Şu anda başka bir soruşturma yürütüp yürütmediğini kontrol eder)
 * @param {string} moderatorId 
 * @returns {Promise<boolean>}
 */
async function isModeratorAvailable(moderatorId) {
  try {
    const AccountInvestigation = require("../../../models/AccountInvestigation");
    
    const activeInvestigations = await AccountInvestigation.countDocuments({
      assignedModeratorId: moderatorId,
      status: { $in: ['assigned', 'investigating'] }
    });
    
    // 3'ten fazla aktif soruşturması varsa müsait değil
    return activeInvestigations < 3;
  } catch (err) {
    console.error("[ModeratorSelector] Müsaitlik kontrolü başarısız:", err.message);
    return true; // Hata durumunda müsait kabul et
  }
}

module.exports = {
  getAllModerators,
  selectBestModerator,
  isModeratorAvailable,
};
