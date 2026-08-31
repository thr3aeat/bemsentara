'use strict';

const cron = require('node-cron');
const logger = require('../../utils/logger');

const ROBLOXLND_GUILD_ID = '1537407325290237973';
const BASE_ROLE_ID = '1537426467204370543'; // Standart/Taban VIP rolü (Kimse bu rolde kalmayacak)

// En eski hesaptan en yeni hesaba doğru 5 kademeli VIP rol hiyerarşisi
const SENIORITY_TIERS = [
  { rank: 1, name: 'Kızıl alev', roleId: '1544019657491615814' },
  { rank: 2, name: 'Altın taç', roleId: '1544016562753904760' },
  { rank: 3, name: 'Zümrüt', roleId: '1544017553637253200' },
  { rank: 4, name: 'Mor galaksi', roleId: '1544018013005676564' },
  { rank: 5, name: 'Mavi elmas', roleId: '1544018426589085776' }
];

const TARGET_ROLE_IDS = SENIORITY_TIERS.map(t => t.roleId);
const ALL_MANAGED_ROLE_IDS = [BASE_ROLE_ID, ...TARGET_ROLE_IDS];

let isSyncing = false;
let debounceSyncTimeout = null;

/**
 * Üyeleri Discord hesap açılış tarihine (createdTimestamp / createdAt) göre en eskiden en yeniye sıralar
 * ve taban VIP rolünde kimseyi bırakmadan tüm üyeleri 5 kademeli VIP rollerine dengeli dağıtır.
 */
function calculateSeniorityRoleAssignments(members, options = {}) {
  const baseRoleId = options.baseRoleId || BASE_ROLE_ID;
  const tiers = options.tiers || SENIORITY_TIERS;
  const targetRoleIds = tiers.map(t => t.roleId);
  const allManagedRoleIds = [baseRoleId, ...targetRoleIds];

  // Filtre: Bot olmayan ve baseRoleId veya targetRoleIds'den en az birine sahip olan VIP adayları
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

    // Dağıtım Mantığı:
    // Üye sayısı 5 veya daha azsa: Sırasıyla 1, 2, 3, 4, 5. rolleri alırlar.
    // Üye sayısı 5'ten fazlaysa: Hesap yaşı dilimlerine göre 5 VIP rolüne eşit/orantılı dağıtılır.
    // Kimse taban rolde (BASE_ROLE_ID) bırakılmaz!
    let tierIndex = 0;
    if (eligible.length <= tiers.length) {
      tierIndex = index;
    } else {
      tierIndex = Math.min(tiers.length - 1, Math.floor((index * tiers.length) / eligible.length));
    }

    const assignedTier = tiers[tierIndex];
    const targetRoleId = assignedTier.roleId;
    const tierName = assignedTier.name;

    // Beklenen roller: Sadece hak edilen VIP rolü (Taban rol ve diğer VIP rolleri çıkarılır)
    const expectedRoles = [targetRoleId];
    const unexpectedRoles = allManagedRoleIds.filter(id => id !== targetRoleId);

    const rolesToAdd = expectedRoles.filter(id => !currentRoles.includes(id));
    const rolesToRemove = unexpectedRoles.filter(id => currentRoles.includes(id));

    const createdTime = Number(member.user?.createdTimestamp || member.user?.createdAt?.getTime?.() || member.createdTimestamp || 0);

    plan.push({
      member,
      userId: member.id || member.user?.id,
      rank: index + 1,
      tierIndex: tierIndex + 1,
      tierName,
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
 * RobloxLand sunucusunda hesap yaşı sıralamasını kontrol edip VIP rollerini eşitler.
 * Hatalı/manuel verilen rolleri geri çeker ve doğru rolü verir.
 */
async function syncRobloxLandSeniorityRoles(client) {
  if (!client) {
    logger.warn('[SeniorityRoles] Discord client parametresi eksik.');
    return { success: false, reason: 'No client provided' };
  }

  if (isSyncing) {
    logger.info('[SeniorityRoles] Senkronizasyon zaten çalışıyor, sonraki tura ertelendi.');
    return { success: false, reason: 'Already in progress' };
  }
  isSyncing = true;

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
      logger.info('[SeniorityRoles] VIP rollerine dahil edilecek üye bulunamadı.');
      return { success: true, updatedCount: 0, totalEligible: 0, plan: [] };
    }

    logger.info(`[SeniorityRoles] Toplam ${plan.length} VIP üye hesap yaşına göre sıralandı.`);

    let updatedCount = 0;
    for (const item of plan) {
      if (!item.needsUpdate) continue;

      const member = item.member;
      try {
        if (item.rolesToRemove.length > 0) {
          await member.roles.remove(item.rolesToRemove, 'RobloxLand VIP Hesap Yaşı Dengeleme (Hatalı/Eski Rol Çıkarıldı)');
        }
        if (item.rolesToAdd.length > 0) {
          await member.roles.add(item.rolesToAdd, `RobloxLand VIP Hesap Yaşı Rolü (${item.tierName} - Sıra #${item.rank})`);
        }
        updatedCount++;
        logger.info(`[SeniorityRoles] Üye ${member.user?.tag || member.id} (Sıra #${item.rank}, ${item.tierName}) güncellendi. Eklenen: ${item.rolesToAdd.join(', ')} | Çıkarılan: ${item.rolesToRemove.join(', ')}`);
        // API rate limit güvenliği için kısa bekleme
        await new Promise(res => setTimeout(res, 250));
      } catch (err) {
        logger.error(`[SeniorityRoles] Üye ${member.id} rol güncellenirken hata: ${err.message}`);
      }
    }

    logger.success(`[SeniorityRoles] VIP rol senkronizasyonu tamamlandı. (${updatedCount}/${plan.length} üye güncellendi)`);
    return { success: true, updatedCount, totalEligible: plan.length, plan };
  } catch (error) {
    logger.error(`[SeniorityRoles] Senkronizasyon genel hatası: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    isSyncing = false;
  }
}

/**
 * VIP rollerinde yapılan manuel değişiklikleri algılayıp sistemi otomatik dengeleyen debounce tetikleyici
 */
function triggerDebouncedSenioritySync(client, delayMs = 1500) {
  if (debounceSyncTimeout) clearTimeout(debounceSyncTimeout);
  debounceSyncTimeout = setTimeout(() => {
    syncRobloxLandSeniorityRoles(client).catch(err => {
      logger.error(`[SeniorityRoles] Debounce senkronizasyon hatası: ${err.message}`);
    });
  }, delayMs);
}

/**
 * guildMemberUpdate olayında manuel VIP rol atamalarını yakalar.
 * Yanlış VIP rolü verilmişse geri çekip hesap yaşına uygun doğru rolü verir.
 */
function handleMemberVipRoleUpdate(oldMember, newMember) {
  if (!newMember || newMember.guild?.id !== ROBLOXLND_GUILD_ID || newMember.user?.bot) return;

  const oldRoles = oldMember?.roles?.cache
    ? Array.from(oldMember.roles.cache.keys())
    : [];
  const newRoles = newMember?.roles?.cache
    ? Array.from(newMember.roles.cache.keys())
    : [];

  const hadVip = ALL_MANAGED_ROLE_IDS.some(id => oldRoles.includes(id));
  const hasVip = ALL_MANAGED_ROLE_IDS.some(id => newRoles.includes(id));

  // Eğer yönetilen VIP rollerinde herhangi bir ekleme/çıkarma olduysa
  const changed = hadVip !== hasVip || ALL_MANAGED_ROLE_IDS.some(id => oldRoles.includes(id) !== newRoles.includes(id));
  if (changed) {
    logger.info(`[SeniorityRoles] VIP rol değişikliği algılandı (${newMember.user?.tag || newMember.id}). Otomatik dengeleme başlatılıyor...`);
    triggerDebouncedSenioritySync(newMember.client);
  }
}

/**
 * Her 2 günde bir sabah saat 09:00'da çalışacak cron planlayıcısını başlatır.
 */
function startSeniorityRoleScheduler(client) {
  logger.info('[SeniorityRoles] 📅 VIP hesap yaşı rol senkronizasyon planlayıcısı başlatıldı (Her 2 günde bir 09:00).');

  cron.schedule('0 9 */2 * *', async () => {
    if (global.SPAM_STOPPED) {
      logger.info('[SeniorityRoles] Cron atlandı (global.SPAM_STOPPED aktif)');
      return;
    }
    try {
      logger.info('[SeniorityRoles] ⏰ 2 günlük periyodik VIP rol senkronizasyonu başlatılıyor...');
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
  triggerDebouncedSenioritySync,
  handleMemberVipRoleUpdate,
  startSeniorityRoleScheduler
};
