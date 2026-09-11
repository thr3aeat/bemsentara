'use strict';

const assert = require('assert');
const giveawayService = require('../server/services/giveawayService');
const Store = require('../models/Store');

async function runProductionTests() {
  console.log('\n=============================================================');
  console.log('🧪 EKOYILDIZ ÇEKİLİŞ SİSTEMİ PRODUCTION DOĞRULAMA TESTLERİ');
  console.log('=============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function runTest(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`  ✅ [BAŞARILI] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ [HATA] ${name}:`, err.message);
    }
  }

  async function runAsyncTest(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✅ [BAŞARILI] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ [HATA] ${name}:`, err.message);
    }
  }

  // 1. TEST: Kriptografik Referral Kodu Güvenliği
  runTest('1. Kriptografik Referral Kodu (Crypto Random & Unpredictable)', () => {
    const code1 = giveawayService._generateReferralCode('user_123456');
    const code2 = giveawayService._generateReferralCode('user_123456');
    assert(code1.startsWith('EKO-'), 'Referral kodu EKO- ile başlamalı');
    assert.notStrictEqual(code1, code2, 'Ardı ardına üretilen kodlar rastgele ve benzersiz olmalı');
    assert(code1.length >= 10, 'Kod yeterli entropiye sahip olmalı');
  });

  // 2. TEST: URL Güvenliği (XSS ve Tehlikeli Protokol Engeli)
  runTest('2. URL Güvenlik Validasyonu (javascript:, data: engelleme)', () => {
    assert.strictEqual(giveawayService.validateUrl('javascript:alert(1)'), false, 'javascript: engellenmeli');
    assert.strictEqual(giveawayService.validateUrl('data:text/html,<script>'), false, 'data: engellenmeli');
    assert.strictEqual(giveawayService.validateUrl('https://www.youtube.com/@eko8yildiz'), true, 'https:// geçerli olmalı');
    assert.strictEqual(giveawayService.validateUrl('/profile'), true, 'Internal relative URL geçerli olmalı');
  });

  // Test Çekilişi ve Görev Hazırlığı
  const testGiveaway = Store.giveaways.create({
    title: 'Test Production Çekilişi',
    slug: 'test-production-cekilisi-' + Date.now(),
    prize: '5.000 Robux',
    sponsor: 'Eko Test',
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    maxEntriesPerUser: 5,
    winnerCount: 2,
    backupWinnerCount: 1,
    referralEnabled: true,
    referralTickets: 2,
    totalParticipants: 0,
    totalTickets: 0
  });

  const autoTask = Store.giveawayTasks.create({
    giveawayId: testGiveaway._id,
    title: 'Profilini Doğrula',
    strategy: 'AUTO',
    platform: 'website',
    actionType: 'verify_account',
    tickets: 1,
    isRequired: true,
    order: 1
  });

  const visitTask = Store.giveawayTasks.create({
    giveawayId: testGiveaway._id,
    title: 'Instagram Takip Et',
    strategy: 'VISIT_ONLY',
    platform: 'instagram',
    actionType: 'visit_page',
    link: 'https://www.instagram.com/ekonqt/',
    tickets: 1,
    isRequired: false,
    order: 2
  });

  const proofTask = Store.giveawayTasks.create({
    giveawayId: testGiveaway._id,
    title: 'Videoya Yorum Yap',
    strategy: 'PROOF_REQUIRED',
    platform: 'youtube',
    actionType: 'comment',
    link: 'https://www.youtube.com/@eko8yildiz',
    tickets: 2,
    isRequired: false,
    order: 3
  });

  // 3. TEST: Dış Sosyal Medya Görevi Sahte VERIFIED Olmamalı (VISITED veya PENDING Olmalı)
  await runAsyncTest('3. Gerçek Dış Link Doğrulaması (Ziyaret sahte VERIFIED yapmaz)', async () => {
    const userA = { discordId: 'user_A_' + Date.now(), username: 'Ahmet' };
    const res = await giveawayService.recordTaskVisit({
      giveawayId: testGiveaway._id,
      taskId: visitTask._id,
      user: userA,
      ip: '192.168.1.10'
    });
    assert.strictEqual(res.status, 'VISITED', 'Dış link tıklandığında durum VISITED olmalı');
    assert.strictEqual(res.ticketsAwarded, 0, 'Sadece link tıklandı diye bilet verilmemeli');

    const entry = giveawayService.getUserEntry(testGiveaway._id, userA.discordId);
    assert.strictEqual(entry.tickets, 0, 'Katılımcı bileti artmamalı');
  });

  // 4. TEST: Concurrency & Duplicate Task Submit (Promise.all ile 10 paralel istek)
  await runAsyncTest('4. Eşzamanlı (Concurrency) İstek Testi: 10 paralel submit -> Tek hak', async () => {
    const userConcurrency = { discordId: 'user_concurrency_' + Date.now(), username: 'ParalelTest' };
    
    // Aynı anda 10 istek tetikle
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(giveawayService.submitTask({
        giveawayId: testGiveaway._id,
        taskId: autoTask._id,
        user: userConcurrency,
        ip: '10.0.0.1'
      }));
    }

    const results = await Promise.all(promises);
    const entry = giveawayService.getUserEntry(testGiveaway._id, userConcurrency.discordId);
    
    // Toplam bilet sadece görev kadar (1 bilet) olmalı, 10 bilet olmamalı!
    assert.strictEqual(entry.tickets, 1, `Eşzamanlı 10 istekte toplam bilet 1 olmalı, bulunan: ${entry.tickets}`);
  });

  // 5. TEST: Kanıt Zorunluluğu (PROOF_REQUIRED boş kanıtla reddedilmeli)
  await runAsyncTest('5. Proof Required Validasyonu (Boş veya yetersiz kanıt reddedilir)', async () => {
    const userProof = { discordId: 'user_proof_' + Date.now(), username: 'ProofTest' };
    const resEmpty = await giveawayService.submitTask({
      giveawayId: testGiveaway._id,
      taskId: proofTask._id,
      user: userProof,
      proof: ''
    });
    assert.strictEqual(resEmpty.success, false, 'Boş kanıt reddedilmeli');
    assert.strictEqual(resEmpty.code, 'PROOF_REQUIRED', 'Hata kodu PROOF_REQUIRED olmalı');

    // Geçerli kanıt ile gönderim -> PENDING olmalı
    const resValid = await giveawayService.submitTask({
      giveawayId: testGiveaway._id,
      taskId: proofTask._id,
      user: userProof,
      proof: '@ahmet34 youtube yorumum: Harika video!'
    });
    assert.strictEqual(resValid.success, true);
    assert.strictEqual(resValid.status, 'PENDING', 'Kanıt inceleme için PENDING durumuna geçmeli');
  });

  // 6. TEST: Max Entries Per User Sınırının Uygulanması
  await runAsyncTest('6. Max Entries Limiti (maxEntriesPerUser = 5 kesin enforcement)', async () => {
    const userMax = { discordId: 'user_max_' + Date.now(), username: 'MaxTest' };
    const entry = giveawayService.getOrCreateUserEntry(testGiveaway._id, userMax);
    entry.tickets = 5; // Limiti doldur
    entry.save();

    const res = await giveawayService.submitTask({
      giveawayId: testGiveaway._id,
      taskId: autoTask._id,
      user: userMax
    });

    assert.strictEqual(res.success, false, 'Maksimum limite ulaşınca yeni bilet verilmemeli');
    assert.strictEqual(res.code, 'MAX_ENTRIES_REACHED', 'Hata kodu MAX_ENTRIES_REACHED olmalı');
  });

  // 7. TEST: Referral Abuse - Self Referral Engeli
  await runAsyncTest('7. Self-Referral Engeli (Kendi davet linkini kullanamaz)', async () => {
    const userSelf = { discordId: 'user_self_' + Date.now(), username: 'SelfTest' };
    const entry = giveawayService.getOrCreateUserEntry(testGiveaway._id, userSelf);
    
    // Kendi referans kodunu tekrar göndermeyi dene
    giveawayService.getOrCreateUserEntry(testGiveaway._id, userSelf, '127.0.0.1', 'Mozilla/5.0', entry.referralCode);
    assert.notStrictEqual(entry.referredBy, userSelf.discordId, 'Kullanıcı kendini refere edemez');
  });

  // 8. TEST: Referral Abuse - Same IP Sinyali & Fraud Flag
  await runAsyncTest('8. Same IP Referral Tespiti (Fraud Flag & Severity üretimi)', async () => {
    const inviter = { discordId: 'inviter_' + Date.now(), username: 'DavetEden' };
    const inviterEntry = giveawayService.getOrCreateUserEntry(testGiveaway._id, inviter, '198.51.100.55', 'Chrome');

    const invitee = { discordId: 'invitee_' + Date.now(), username: 'DavetEdilen' };
    giveawayService.getOrCreateUserEntry(testGiveaway._id, invitee, '198.51.100.55', 'Chrome', inviterEntry.referralCode);

    const fraudFlags = Store.giveawayFraudFlags.find({ giveawayId: testGiveaway._id, userId: invitee.discordId });
    assert(fraudFlags.length > 0, 'Aynı IP ve UA için fraud flag oluşturulmalı');
    assert(fraudFlags[0].severity === 'HIGH' || fraudFlags[0].severity === 'CRITICAL', 'Severity HIGH veya CRITICAL olmalı');
  });

  // 9. TEST: İki Aşamalı Referral Bonusu (İnvitee görev yapınca bonus tanımlanır)
  await runAsyncTest('9. İki Aşamalı Referral (Görev tamamlanmadan bonus verilmez, tamamlanınca verilir)', async () => {
    const legitInviter = { discordId: 'legit_inviter_' + Date.now(), username: 'GercekDavetci' };
    const inviterEntry = giveawayService.getOrCreateUserEntry(testGiveaway._id, legitInviter, '85.100.20.10', 'Firefox');
    const startTickets = inviterEntry.tickets;

    const legitInvitee = { discordId: 'legit_invitee_' + Date.now(), username: 'GercekArkadas' };
    giveawayService.getOrCreateUserEntry(testGiveaway._id, legitInvitee, '92.44.11.22', 'Safari', inviterEntry.referralCode);

    // Henüz görev yapmadı -> Inviter bileti artmamalı
    const updatedInviter1 = giveawayService.getUserEntry(testGiveaway._id, legitInviter.discordId);
    assert.strictEqual(updatedInviter1.tickets, startTickets, 'Arkadaşı görev yapmadan davetçiye bonus verilmemeli');

    // Arkadaşı görevi tamamlar
    await giveawayService.submitTask({
      giveawayId: testGiveaway._id,
      taskId: autoTask._id,
      user: legitInvitee,
      ip: '92.44.11.22'
    });

    // Artık davetçiye +2 bonus verilmeli
    const updatedInviter2 = giveawayService.getUserEntry(testGiveaway._id, legitInviter.discordId);
    assert.strictEqual(updatedInviter2.tickets, startTickets + 2, 'Arkadaş görev tamamlayınca +2 bonus tanımlanmalı');
  });

  // 10. TEST: Ölçeklenebilir Weighted Random Winner Seçimi & Çoklu Kazanan
  await runAsyncTest('10. Ölçeklenebilir Weighted Random Kazanan Seçimi (O(1) bellek, Multi-Winner & Backup)', async () => {
    // Katılımcı havuzu oluştur
    const u1 = { discordId: 'cand_1_' + Date.now(), username: 'Aday1' };
    const u2 = { discordId: 'cand_2_' + Date.now(), username: 'Aday2' };
    const u3 = { discordId: 'cand_3_' + Date.now(), username: 'Aday3' };

    const e1 = giveawayService.getOrCreateUserEntry(testGiveaway._id, u1);
    e1.tickets = 10;
    e1.save();

    const e2 = giveawayService.getOrCreateUserEntry(testGiveaway._id, u2);
    e2.tickets = 5;
    e2.save();

    const e3 = giveawayService.getOrCreateUserEntry(testGiveaway._id, u3);
    e3.tickets = 2;
    e3.save();

    testGiveaway.winnerCount = 2;
    testGiveaway.backupWinnerCount = 1;
    testGiveaway.status = 'ACTIVE';
    testGiveaway.save();

    const admin = { username: 'SuperAdmin', discordId: 'admin_999' };
    const drawResult = await giveawayService.pickWinner({
      giveawayId: testGiveaway._id,
      adminUser: admin
    });

    assert.strictEqual(drawResult.success, true);
    assert.strictEqual(drawResult.winners.length, 2, '2 asil kazanan seçilmeli');
    assert.notStrictEqual(drawResult.winners[0].userId, drawResult.winners[1].userId, 'Asil kazananlar farklı kullanıcılar olmalı');
    assert.strictEqual(drawResult.backupCount, 1, '1 yedek kazanan seçilmeli');
  });

  // 11. TEST: Redraw Mantığı (Eski kazanan silinmez, INVALIDATED olur, gerekçe zorunludur)
  await runAsyncTest('11. Redraw Mantığı (Eski kazanan arşivlenir, zorunlu reason ile yeni kazanan seçilir)', async () => {
    const admin = { username: 'SuperAdmin', discordId: 'admin_999' };

    // Sebep olmadan redraw hata vermeli
    await assert.rejects(async () => {
      await giveawayService.pickWinner({
        giveawayId: testGiveaway._id,
        adminUser: admin,
        isRedraw: true,
        redrawReason: ''
      });
    }, /geçerli bir sebep/, 'Sebepsiz redraw reddedilmeli');

    // Geçerli sebep ile redraw
    const redrawRes = await giveawayService.pickWinner({
      giveawayId: testGiveaway._id,
      adminUser: admin,
      isRedraw: true,
      redrawReason: '24 saat içinde yanıt vermedi'
    });

    assert.strictEqual(redrawRes.success, true);

    // Eski kazananları kontrol et
    const invalidated = Store.giveawayWinners.find({
      giveawayId: testGiveaway._id,
      isInvalidated: true
    });
    assert(invalidated.length > 0, 'Eski kazananlar silinmemeli, INVALIDATED olarak arşivlenmeli');
    assert.strictEqual(invalidated[0].status, 'INVALIDATED');
  });

  // 12. TEST: Diskalifiye Edilen Kullanıcı Biletlerinin Dışarıda Tutulması
  await runAsyncTest('12. Diskalifiye Edilen Kullanıcı Bilet Hesabı (Winner havuzunda yer almaz)', async () => {
    const badUser = { discordId: 'disq_user_' + Date.now(), username: 'Hileci' };
    const entry = giveawayService.getOrCreateUserEntry(testGiveaway._id, badUser);
    entry.tickets = 100;
    entry.isDisqualified = true;
    entry.status = 'DISQUALIFIED';
    entry.save();

    const stats = giveawayService.recalculateGiveawayStats(testGiveaway._id);
    const validEntries = Store.giveawayEntries.find({ giveawayId: testGiveaway._id, isDisqualified: { $ne: true } });
    const validSum = validEntries.reduce((s, e) => s + (Number(e.tickets) || 0), 0);

    assert.strictEqual(stats.totalTickets, validSum, 'Diskalifiye kullanıcının 100 bileti toplam geçerli bilet sayısına dahil edilmemeli');
  });

  // 13. TEST: Notification Idempotency (Aynı eventKey ile tekrar bildirim oluşmaz)
  runTest('13. Bildirim Idempotency Kontrolü (eventKey koruması)', () => {
    const testUid = 'notif_user_' + Date.now();
    const evKey = 'unique_event_' + Date.now();

    const n1 = giveawayService.sendNotification({
      userId: testUid,
      eventKey: evKey,
      title: 'Tebrikler',
      message: 'İlk Bildirim'
    });

    const n2 = giveawayService.sendNotification({
      userId: testUid,
      eventKey: evKey,
      title: 'Tebrikler',
      message: 'Mükerrer Bildirim'
    });

    assert.strictEqual(n1._id, n2._id, 'Aynı eventKey için ikinci bildirim oluşturulmamalı, var olan dönmeli');
  });

  // 14. TEST: State Machine Geçiş Kuralları
  runTest('14. Giveaway Status State Machine (Geçersiz geçişler reddedilir)', () => {
    const dummyGw = Store.giveaways.create({
      title: 'Dummy State Test',
      status: 'SCHEDULED'
    });

    // SCHEDULED -> COMPLETED geçişi yasak (Önce ACTIVE veya CANCELLED olmalı)
    assert.throws(() => {
      giveawayService.transitionStatus(dummyGw._id, 'COMPLETED');
    }, /Geçersiz durum geçişi/, 'SCHEDULED doğrudan COMPLETED olamaz');

    // SCHEDULED -> ACTIVE geçişi geçerli
    const updated = giveawayService.transitionStatus(dummyGw._id, 'ACTIVE');
    assert.strictEqual(updated.status, 'ACTIVE');
  });

  console.log('\n-------------------------------------------------------------');
  console.log(`📊 TEST SONUÇLARI: ${passedTests} / ${totalTests} test başarıyla geçti.`);
  console.log('-------------------------------------------------------------\n');

  if (passedTests === totalTests) {
    console.log('🎉 TÜM PRODUCTION TESTLERİ EKSİKSİZ VE HATASIZ TAMAMLANDI!\n');
  } else {
    throw new Error(`${totalTests - passedTests} test başarısız oldu!`);
  }
}

runProductionTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
