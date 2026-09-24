/**
 * EkoYıldız Grubu (35431216) Otomatik Takipçi Seviye (Level) ve Grup Üyelik Kontrol Servisi
 * 
 * Mantık:
 * 1. "Hala grupta mı?" Kontrolü:
 *    - Gruptaki üyeler taranır, üyenin gerçekten grupta olup olmadığı (rank > 0) doğrulanır.
 * 2. Seviye Atlatma Kuralları:
 *    - Seviye 3 için ilk olarak Rank 2 (🎈 Sımsıkı Takipçi) olmak şarttır.
 *    - Rank 2'de 45 günden uzun süredir bulunan aktif üyeler -> Rank 3 (💖Bomba Takipçi) yapılır.
 *    - Rank 2/3'te 90 günden uzun süredir bulunan kıdemli üyeler -> Rank 4 (🤩ADAM Takipçi) yapılır.
 * 3. Otomatik Çalışma:
 *    - Bot ayağa kalktığında ilk kontrolü yapar, ardından her 12 saatte bir otomatik tekrarlar.
 */

const noblox = require('noblox.js');
const axios = require('axios');
const logger = require('../../utils/logger');

const GROUP_ID = 35431216;
const ROLES = {
  SIMSIKI: { id: 665251001, rank: 2, name: '🎈 Sımsıkı Takipçi' },
  BOMBA:   { id: 858718009, rank: 3, name: '💖Bomba Takipçi' },
  ADAM:    { id: 860182017, rank: 4, name: '🤩ADAM Takipçi' }
};

// Seviye Eşikleri (Gün cinsinden)
const BOMBA_DAYS_THRESHOLD = 45; // 45 gün Rank 2 olan -> Rank 3
const ADAM_DAYS_THRESHOLD  = 90; // 90 gün grupta olan -> Rank 4

const CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 Saatte bir otomatik çalışır
let _schedulerTimer = null;
let _isRunning = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Belirtilen rol ID'sine sahip tüm üyeleri döner
 */
async function fetchRoleMembers(roleId) {
  const members = [];
  let cursor = '';
  while (true) {
    const url = `https://groups.roblox.com/v1/groups/${GROUP_ID}/roles/${roleId}/users?limit=100` + (cursor ? `&cursor=${cursor}` : '');
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data && res.data.data) {
      members.push(...res.data.data);
    }
    cursor = res.data?.nextPageCursor;
    if (!cursor) break;
  }
  return members;
}

/**
 * Audit log kayıtlarını tarayarak üyelerin Rank 2'ye geçiş tarihlerini çıkarır
 */
async function fetchRank2DatesMap() {
  const datesMap = {};
  let logCursor = null;
  let page = 0;

  while (page < 35) {
    page++;
    try {
      const logs = await noblox.getAuditLog({ group: GROUP_ID, cursor: logCursor, limit: 100 });
      if (!logs.data || logs.data.length === 0) break;

      for (const item of logs.data) {
        if (item.actionType === 'Change Rank') {
          const targetId = item.description?.TargetId;
          const newRole = item.description?.NewRoleSetName;
          if (newRole && (newRole.includes('Sımsıkı') || newRole.includes('Bomba') || newRole.includes('ADAM'))) {
            const d = new Date(item.created);
            if (!datesMap[targetId] || d < datesMap[targetId]) {
              datesMap[targetId] = d;
            }
          }
        }
      }
      logCursor = logs.nextPageCursor;
      if (!logCursor) break;
    } catch (err) {
      console.warn(`[FollowerLevelScheduler] Audit log tarama sayfası ${page} uyarısı:`, err.message);
      break;
    }
  }

  return datesMap;
}

/**
 * Otomatik Seviye Kontrol ve Rütbe Dağıtım Fonksiyonu
 */
async function runFollowerLevelCheck(client = null) {
  if (_isRunning) {
    console.log('[FollowerLevelScheduler] Zaten bir kontrol işlemi çalışıyor, atlanıyor.');
    return { success: false, reason: 'already_running' };
  }

  _isRunning = true;
  console.log('[FollowerLevelScheduler] 🚀 EkoYıldız otomatik takipçi seviye ve grup üyelik kontrolü başladı...');

  const cookie = process.env.COOKIE;
  if (!cookie) {
    console.warn('[FollowerLevelScheduler] ⚠️ COOKIE environment değişkeni bulunamadı!');
    _isRunning = false;
    return { success: false, reason: 'missing_cookie' };
  }

  try {
    await noblox.setCookie(cookie);
  } catch (err) {
    console.error('[FollowerLevelScheduler] ❌ Noblox oturum açma hatası:', err.message);
    _isRunning = false;
    return { success: false, error: err.message };
  }

  try {
    // 1. "Hala grupta mı?" ve Mevcut Rank 2 ve Rank 3 Üyelerini Topla
    const [rank2Members, rank3Members] = await Promise.all([
      fetchRoleMembers(ROLES.SIMSIKI.id).catch(() => []),
      fetchRoleMembers(ROLES.BOMBA.id).catch(() => [])
    ]);

    console.log(`[FollowerLevelScheduler] Grupta Rank 2: ${rank2Members.length} üye, Rank 3: ${rank3Members.length} üye bulundu.`);

    // 2. Audit log'dan kıdem tarihlerini çıkar
    const rankDates = await fetchRank2DatesMap();
    const now = Date.now();

    const promoteToRank4 = []; // 🤩ADAM Takipçi
    const promoteToRank3 = []; // 💖Bomba Takipçi

    // Rank 3 olanlar -> Eğer 90 günü doldurmuşsa Rank 4 olsun
    for (const m of rank3Members) {
      // Hala grupta mı kontrolü
      try {
        const curRank = await noblox.getRankInGroup(GROUP_ID, m.userId);
        if (curRank === 0) {
          console.log(`[Hala Grupta mı?] 🚪 ${m.username} (${m.userId}) artık grupta değil.`);
          continue;
        }
      } catch (_) {}

      const date = rankDates[m.userId];
      if (date) {
        const days = Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= ADAM_DAYS_THRESHOLD) {
          promoteToRank4.push({ ...m, days, date });
        }
      }
    }

    // Rank 2 olanlar -> Eğer 90 günse direkt Rank 4, eğer 45 günse Rank 3 olsun
    for (const m of rank2Members) {
      // Hala grupta mı kontrolü
      try {
        const curRank = await noblox.getRankInGroup(GROUP_ID, m.userId);
        if (curRank === 0) {
          console.log(`[Hala Grupta mı?] 🚪 ${m.username} (${m.userId}) artık grupta değil.`);
          continue;
        }
      } catch (_) {}

      const date = rankDates[m.userId];
      if (date) {
        const days = Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= ADAM_DAYS_THRESHOLD) {
          promoteToRank4.push({ ...m, days, date });
        } else if (days >= BOMBA_DAYS_THRESHOLD) {
          promoteToRank3.push({ ...m, days, date });
        }
      }
    }

    console.log(`[FollowerLevelScheduler] Terfi Bekleyenler: ${promoteToRank4.length} kişi -> Rank 4, ${promoteToRank3.length} kişi -> Rank 3`);

    let updatedCount = 0;

    // Rank 4 Terfileri
    for (const m of promoteToRank4) {
      try {
        console.log(`[LEVEL UP] 🌟 ${m.username} (${m.userId}) -> Rank 4 (${ROLES.ADAM.name}) yapılıyor (${m.days} gündür üye)...`);
        await noblox.setRank({ group: GROUP_ID, target: m.userId, rank: ROLES.ADAM.rank });
        updatedCount++;
        await sleep(1500);
      } catch (err) {
        console.error(`[FollowerLevelScheduler] Terfi hatası (${m.username} -> Rank 4):`, err.message);
        await sleep(2500);
      }
    }

    // Rank 3 Terfileri
    for (const m of promoteToRank3) {
      try {
        console.log(`[LEVEL UP] ✨ ${m.username} (${m.userId}) -> Rank 3 (${ROLES.BOMBA.name}) yapılıyor (${m.days} gündür üye)...`);
        await noblox.setRank({ group: GROUP_ID, target: m.userId, rank: ROLES.BOMBA.rank });
        updatedCount++;
        await sleep(1500);
      } catch (err) {
        console.error(`[FollowerLevelScheduler] Terfi hatası (${m.username} -> Rank 3):`, err.message);
        await sleep(2500);
      }
    }

    console.log(`[FollowerLevelScheduler] ✅ Döngü tamamlandı! Toplam güncellenen: ${updatedCount}`);

    return {
      success: true,
      updatedCount,
      promoteToRank4Count: promoteToRank4.length,
      promoteToRank3Count: promoteToRank3.length
    };
  } catch (error) {
    console.error('[FollowerLevelScheduler] Genel hata:', error);
    return { success: false, error: error.message };
  } finally {
    _isRunning = false;
  }
}

/**
 * Scheduler Başlatıcı (Arka Plan Döngüsü)
 */
function startFollowerLevelScheduler(discordClient) {
  if (_schedulerTimer) {
    clearInterval(_schedulerTimer);
  }

  console.log('[FollowerLevelScheduler] ⏰ Takipçi seviye ve grup üyelik kontrol zamanlayıcısı kuruldu (12 saat periyot).');

  // Bot açıldıktan 45 saniye sonra ilk kontrolü çalıştır
  setTimeout(() => {
    runFollowerLevelCheck(discordClient).catch(err => {
      console.error('[FollowerLevelScheduler] İlk çalıştırma hatası:', err.message);
    });
  }, 45000);

  // Ardından 12 saatte bir çalıştır
  _schedulerTimer = setInterval(() => {
    runFollowerLevelCheck(discordClient).catch(err => {
      console.error('[FollowerLevelScheduler] Periyodik çalıştırma hatası:', err.message);
    });
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  startFollowerLevelScheduler,
  runFollowerLevelCheck,
  ROLES,
  GROUP_ID
};
