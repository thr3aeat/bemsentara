'use strict';

const cron = require('node-cron');
const logger = require('../../utils/logger');

const ROBLOXLND_GUILD_ID = '1537407325290237973';
const BASE_ROLE_ID = '1537426467204370543';

// En eski hesaptan en yeni hesaba doğru kıdem/hesap yaşı rol hiyerarşisi
const SENIORITY_TIERS = [
  { rank: 1, name: 'Kızıl alev', roleId: '1544019657491615814' },
  { rank: 2, name: 'Altın taç', roleId: '1544016562753904760' },
  { rank: 3, name: 'Zümrüt', roleId: '1544017553637253200' },
  { rank: 4, name: 'Mor galaksi', roleId: '1544018013005676564' },
  { rank: 5, name: 'Mavi elmas', roleId: '1544018426589085776' }
];

const TARGET_ROLE_IDS = SENIORITY_TIERS.map(t => t.roleId);
const ALL_MANAGED_ROLE_IDS = [BASE_ROLE_ID, ...TARGET_ROLE_IDS];

/**
 * Üyeleri Discord hesap açılış tarihine (createdTimestamp / createdAt) göre en eskiden en yeniye sıralar
 * ve hangi rolleri alıp hangilerini bırakacaklarını belirler.
 */
function calculateSeniorityRoleAssignments(members, options = {}) {
  const baseRoleId = options.baseRoleId || BASE_ROLE_ID;
  const tiers = options.tiers || SENIORITY_TIERS;
  const targetRoleIds = tiers.map(t => t.roleId);
  const allManagedRoleIds = [baseRoleId, ...targetRoleIds];

  // Filtre: Bot olmayan ve baseRoleId veya targetRoleIds'den en az birine sahip olanlar
  const eligible = (members || []).filter(member => {
    if (!member || member.user?.bot) return false;
    const roleIds = member.roles?.cache
      ? Array.from(member.roles.cache.keys())
      : (Array.isArray(member.roleIds) ? member.roleIds : []);
    return allManagedRoleIds.some(id => roleIds.includes(id));
  });

  // Sıralama: En eski hesap ilk sırada (küçük timestamp önce)
  eligible.sort((a, b) => {
    const timeA = Number(a.user?.createdTimestamp || a.user?.createdAt?.getTime?.() || a.createdTimestamp || 0);
    const timeB = Number(b.user?.createdTimestamp || b.user?.createdAt?.getTime?.() || b.createdTimestamp || 0);
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    // Eşitlik durumunda id karşılaştırması ile deterministik sıralama
    const idA = String(a.id || a.user?.id || '');
    const idB = String(b.id || b.user?.id || '');
    return idA.localeCompare(idB);
  });

  const plan = [];

  for (let index = 0; index < eligible.length; index++) {
    const member = eligible[index];
    const currentRoles = member.roles?.cache
      ? Array.from(member.roles.cache.keys())
      : (Array.isArray(member.roleIds) ? member.roleIds : []);

    let targetRoleId = null;
    let tierName = null;

    if (index < tiers.length) {
      targetRoleId = tiers[index].roleId;
      tierName = tiers[index].name;
    }

    // Hedef roller:
    // İlk 5'te ise: İlgili tier rolünü alır, diğer tier rolleri ve taban rolü bırakır.
    // 5'ten sonra ise: Taban rolünü (1537426467204370543) alır, tüm tier rollerini bırakır.
    const expectedRoles = targetRoleId ? [targetRoleId] : [baseRoleId];
    const unexpectedRoles = allManagedRoleIds.filter(id => !expectedRoles.includes(id));

    const rolesToAdd = expectedRoles.filter(id => !currentRoles.includes(id));
    const rolesToRemove = unexpectedRoles.filter(id => currentRoles.includes(id));

    const createdTime = Number(member.user?.createdTimestamp || member.user?.createdAt?.getTime?.() || member.createdTimestamp || 0);

    plan.push({
      member,
      userId: member.id || member.user?.id,
      rank: index + 1,
      tierName: tierName || 'Normal (Taban Rol)',
      createdTimestamp: createdTime,
      createdAtIso: createdTime ? new Date(createdTime).toISOString() : null,
      targetRoleId,
      rolesToAdd,
      rolesToRemove,
      needsUpdate: rolesToAdd.length > 0 || rolesToRemove.length > 0
    });
  }

  return plan;
}

/**
 * RobloxLand sunucusunda hesap yaşı sıralamasını kontrol edip rolleri eşitler.
 */
async function syncRobloxLandSeniorityRoles(client) {
  if (!client) {
    logger.warn('[SeniorityRoles] Discord client parametresi eksik.');
    return { success: false, reason: 'No client provided' };
  }

  try {
    const guild = client.guilds.cache.get(ROBLOXLND_GUILD_ID) || await client.guilds.fetch(ROBLOXLND_GUILD_ID).catch(() => null);
    if (!guild) {
      logger.warn(`[SeniorityRoles] RobloxLand sunucusu (${ROBLOXLND_GUILD_ID}) bulunamadı.`);
      return { success: false, reason: 'Guild not found' };
    }

    // Üyeleri tam olarak getir (önbellekte olmayanları da kapsamak için)
    await guild.members.fetch().catch((e) => {
      logger.warn(`[SeniorityRoles] Üyeler fetch edilirken uyarı: ${e.message}`);
    });

    const members = Array.from(guild.members.cache.values());
    const plan = calculateSeniorityRoleAssignments(members);

    if (plan.length === 0) {
      logger.info('[SeniorityRoles] Sıralamaya dahil edilecek üye bulunamadı.');
      return { success: true, updatedCount: 0, totalEligible: 0, plan: [] };
    }

    logger.info(`[SeniorityRoles] Toplam ${plan.length} üye hesap yaşına göre sıralandı.`);

    let updatedCount = 0;
    for (const item of plan) {
      if (!item.needsUpdate) continue;

      const member = item.member;
      try {
        if (item.rolesToRemove.length > 0) {
          await member.roles.remove(item.rolesToRemove, 'RobloxLand Hesap Yaşı Sıralaması');
        }
        if (item.rolesToAdd.length > 0) {
          await member.roles.add(item.rolesToAdd, `RobloxLand Hesap Yaşı Rolü (Sıra #${item.rank} - ${item.tierName})`);
        }
        updatedCount++;
        logger.info(`[SeniorityRoles] Üye ${member.user?.tag || member.id} (Sıra #${item.rank}, ${item.tierName}) güncellendi.`);
        // API rate limit güvenliği için kısa bekleme
        await new Promise(res => setTimeout(res, 250));
      } catch (err) {
        logger.error(`[SeniorityRoles] Üye ${member.id} rol güncellenirken hata: ${err.message}`);
      }
    }

    logger.success(`[SeniorityRoles] Sıralama senkronizasyonu tamamlandı. (${updatedCount}/${plan.length} üye güncellendi)`);
    return { success: true, updatedCount, totalEligible: plan.length, plan };
  } catch (error) {
    logger.error(`[SeniorityRoles] Senkronizasyon genel hatası: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Her 2 günde bir sabah saat 09:00'da çalışacak cron planlayıcısını başlatır.
 */
function startSeniorityRoleScheduler(client) {
  logger.info('[SeniorityRoles] 📅 Hesap yaşı rol senkronizasyon planlayıcısı başlatıldı (Her 2 günde bir 09:00).');

  cron.schedule('0 9 */2 * *', async () => {
    if (global.SPAM_STOPPED) {
      logger.info('[SeniorityRoles] Cron atlandı (global.SPAM_STOPPED aktif)');
      return;
    }
    try {
      logger.info('[SeniorityRoles] ⏰ 2 günlük periyodik hesap yaşı rol senkronizasyonu başlatılıyor...');
      await syncRobloxLandSeniorityRoles(client);
    } catch (err) {
      logger.error(`[SeniorityRoles] Cron senkronizasyon hatası: ${err.message}`);
    }
  }, {
    timezone: 'Europe/Istanbul'
  });
}

module.exports = {
  ROBLOXLND_GUILD_ID,
  BASE_ROLE_ID,
  SENIORITY_TIERS,
  TARGET_ROLE_IDS,
  ALL_MANAGED_ROLE_IDS,
  calculateSeniorityRoleAssignments,
  syncRobloxLandSeniorityRoles,
  startSeniorityRoleScheduler
};
