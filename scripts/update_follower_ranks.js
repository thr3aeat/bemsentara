/**
 * EkoYıldız (35431216) Takipçi Seviye Rütbe Dağıtım Scripti
 * 
 * Seviye Kuralı:
 * - Rank 2 (🎈 Sımsıkı Takipçi) olan üyeler taranır.
 * - En uzun süredir (>= 4 ay, Nisan-Mayıs başı) olanlar: Rank 4 (🤩ADAM Takipçi)
 * - Uzun süredir (>= 2 ay, Mayıs-Temmuz) olanlar: Rank 3 (💖Bomba Takipçi)
 * - Daha yakın zamanda Rank 2 olanlar (Ağustos-Eylül): Rank 2'de kalır.
 */

const noblox = require('noblox.js');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GROUP_ID = 35431216;
const RANK2_ROLE_ID = 665251001; // 🎈 Sımsıkı Takipçi

// Eşik Tarihleri (2026 yılı bazlı)
const ADAM_THRESHOLD = new Date('2026-05-15T23:59:59Z');   // Nisan - Mayıs başı (En kıdemli) -> Rank 4
const BOMBA_THRESHOLD = new Date('2026-07-25T23:59:59Z');  // Mayıs - Temmuz (Uzun süredir) -> Rank 3

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 EkoYıldız Takipçi Seviye Sistemi Başlatılıyor...');

  const cookie = process.env.COOKIE;
  if (!cookie) {
    console.error('❌ HATA: .env içinde COOKIE bulunamadı!');
    process.exit(1);
  }

  try {
    await noblox.setCookie(cookie);
    const currentUser = await noblox.getAuthenticatedUser();
    console.log(`✅ Roblox Botu Giriş Yaptı: ${currentUser.name} (ID: ${currentUser.id})`);
  } catch (err) {
    console.error('❌ Roblox oturum açma hatası:', err.message);
    process.exit(1);
  }

  // 1. Rank 2 Üyelerini Çek
  console.log('\n📥 1. Mevcut Rank 2 (🎈 Sımsıkı Takipçi) üyeleri toplanıyor...');
  let rank2Members = [];
  let cursor = '';
  while (true) {
    const url = `https://groups.roblox.com/v1/groups/${GROUP_ID}/roles/${RANK2_ROLE_ID}/users?limit=100` + (cursor ? `&cursor=${cursor}` : '');
    const res = await axios.get(url);
    rank2Members.push(...res.data.data);
    cursor = res.data.nextPageCursor;
    if (!cursor) break;
  }
  console.log(`👥 Toplam Rank 2 üye sayısı: ${rank2Members.length}`);

  // 2. Audit Log Taraması
  console.log('\n📜 2. Audit log taranarak rütbe alma tarihleri analiz ediliyor...');
  const rank2Dates = {};
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
          if (newRole && newRole.includes('Sımsıkı')) {
            const d = new Date(item.created);
            if (!rank2Dates[targetId] || d < rank2Dates[targetId]) {
              rank2Dates[targetId] = d;
            }
          }
        }
      }
      logCursor = logs.nextPageCursor;
      if (!logCursor) break;
    } catch (e) {
      console.warn(`⚠️ Log tarama sayfası ${page} uyarı: ${e.message}`);
      break;
    }
  }

  // 3. Tarihlere göre hedef rütbe belirleme
  const toPromoteToRank4 = []; // 🤩ADAM Takipçi
  const toPromoteToRank3 = []; // 💖Bomba Takipçi
  const toKeepRank2 = [];      // 🎈 Sımsıkı Takipçi

  for (const member of rank2Members) {
    const joinDate = rank2Dates[member.userId];
    if (joinDate && joinDate <= ADAM_THRESHOLD) {
      toPromoteToRank4.push({ ...member, joinDate });
    } else if (joinDate && joinDate <= BOMBA_THRESHOLD) {
      toPromoteToRank3.push({ ...member, joinDate });
    } else {
      toKeepRank2.push({ ...member, joinDate: joinDate || null });
    }
  }

  console.log('\n📊 SEVİYE DAĞILIM RAPORU:');
  console.log(`⭐ Rank 4 (🤩ADAM Takipçi) verilecekler : ${toPromoteToRank4.length} kişi`);
  console.log(`⭐ Rank 3 (💖Bomba Takipçi) verilecekler: ${toPromoteToRank3.length} kişi`);
  console.log(`⭐ Rank 2 (🎈 Sımsıkı Takipçi) kalacaklar  : ${toKeepRank2.length} kişi`);

  // 4. Rütbeleri Güncelle
  console.log('\n⚙️ 3. Rütbe güncellemeleri uygulanıyor (Rate limit korumalı)...');

  let successCount = 0;
  let failCount = 0;

  // Rank 4 Dağıtımı
  for (const m of toPromoteToRank4) {
    try {
      console.log(`[LEVEL 4] 🌟 ${m.username} (${m.userId}) -> Rank 4 (🤩ADAM Takipçi) yapılıyor... (${m.joinDate.toISOString().split('T')[0]})`);
      await noblox.setRank({ group: GROUP_ID, target: m.userId, rank: 4 });
      successCount++;
      await sleep(1500); // 1.5s gecikme
    } catch (err) {
      console.error(`❌ Hata [${m.username}]:`, err.message);
      failCount++;
      await sleep(2500);
    }
  }

  // Rank 3 Dağıtımı
  for (const m of toPromoteToRank3) {
    try {
      console.log(`[LEVEL 3] ✨ ${m.username} (${m.userId}) -> Rank 3 (💖Bomba Takipçi) yapılıyor... (${m.joinDate.toISOString().split('T')[0]})`);
      await noblox.setRank({ group: GROUP_ID, target: m.userId, rank: 3 });
      successCount++;
      await sleep(1500); // 1.5s gecikme
    } catch (err) {
      console.error(`❌ Hata [${m.username}]:`, err.message);
      failCount++;
      await sleep(2500);
    }
  }

  console.log('\n🎉 ==========================================');
  console.log(`✅ İŞLEM TAMAMLANDI!`);
  console.log(`Başarılı Rütbe Güncellemesi: ${successCount}`);
  console.log(`Hatalı: ${failCount}`);
  console.log('==========================================\n');
}

run().catch(console.error);
