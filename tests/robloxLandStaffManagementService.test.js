'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  GUILD_ID,
  PANEL_CHANNEL_ID,
  WORK_CATEGORY_ID,
  STAFF_LOG_CHANNEL_ID,
  DESIGNATED_STAFF_ID,
  STAFF_RANKS,
  buildStaffManagementPayload,
  buildStaffProfilePayload,
  isValidWorkMessage,
  handleStaffWorkMessage,
  calculateStaffHealth,
  evaluatePromotionEligibility,
  evaluateDemotionRisk,
  renderProgressBar,
  runDailyStaffAudit,
  handleStaffManagementInteraction,
  activeAnonSessions
} = require('../bot/services/robloxLandStaffManagementService');

test('buildStaffManagementPayload returns Components V2 hub with 10-system summary and action rows', () => {
  const mockData = {
    staffMembers: {
      'user-1': {
        userId: 'user-1',
        username: 'Asaf',
        roleName: 'Yetkili Ofisi Kıdemli Staj',
        joinedStaffAt: Date.now() - (30 * 86400000),
        lastWorkAt: Date.now() - (2 * 86400000),
        workCountTotal: 25,
        workCount30d: 14,
        qualityWorksCount: 4,
        streakDays: 18,
        status: 'active',
        performanceScore: 92,
        warningsCount: 0
      }
    },
    pendingWorks: {
      'work-1': { id: 'work-1', status: 'pending' }
    },
    pendingAppeals: {},
    pendingLeaves: {},
    activeTasks: {},
    weeklyStats: { totalWorksThisWeek: 12 }
  };

  const payload = buildStaffManagementPayload(mockData);
  assert.ok(payload);
  assert.ok(Array.isArray(payload.components));
  assert.equal(payload.components[0].type, 17); // Container

  const containerJson = JSON.stringify(payload.components[0]);
  assert.match(containerJson, /YETKİLİ KONTROL MERKEZİ/);
  assert.match(containerJson, /robloxland_staffmgmt_list/);
  assert.match(containerJson, /robloxland_staffmgmt_view_promos/);
  assert.match(containerJson, /robloxland_staffmgmt_view_demos/);
  assert.match(containerJson, /robloxland_staffmgmt_view_works/);
  assert.match(containerJson, /robloxland_staffmgmt_add/);
  assert.match(containerJson, /robloxland_staffmgmt_task_hub/);
});

test('buildStaffProfilePayload shows rank, health, streak, and promotion readiness', () => {
  const readyStaff = {
    userId: 'user-top',
    username: 'Enes',
    roleName: 'Yetkili Ofisi Staj',
    joinedStaffAt: Date.now() - (20 * 86400000),
    lastWorkAt: Date.now() - (1 * 86400000),
    workCountTotal: 15,
    workCount30d: 12,
    qualityWorksCount: 4,
    streakDays: 15,
    performanceScore: 88,
    warningsCount: 0,
    historyLogs: [{ date: Date.now(), text: '5 Yıldızlı Sistem paylaştı' }]
  };

  const payload = buildStaffProfilePayload(readyStaff);
  assert.ok(payload);
  const json = JSON.stringify(payload.components[0]);
  assert.match(json, /TERFİYE HAZIR/);
  assert.match(json, /robloxland_staffmgmt_act_promote_user-top/);
  assert.match(json, /robloxland_staffmgmt_act_demote_user-top/);
  assert.match(json, /robloxland_staffmgmt_act_warn_user-top/);
});

test('calculateStaffHealth and evaluatePromotionEligibility accurately calculate all conditions', () => {
  const now = Date.now();

  // 1. Aktivite durumları
  assert.equal(calculateStaffHealth({ lastWorkAt: now - (2 * 86400000) }).status, 'active');
  assert.equal(calculateStaffHealth({ lastWorkAt: now - (8 * 86400000) }).status, 'warning');
  assert.equal(calculateStaffHealth({ lastWorkAt: now - (11 * 86400000), acknowledgedActive: false }).status, 'passive_10d');
  assert.equal(calculateStaffHealth({ lastWorkAt: now - (11 * 86400000), acknowledgedActive: true }).status, 'acknowledged');
  assert.equal(calculateStaffHealth({ lastWorkAt: now - (15 * 86400000) }).status, 'passive_13d');
  assert.equal(calculateStaffHealth({ lastWorkAt: now - (25 * 86400000) }).status, 'review_20d');
  assert.equal(calculateStaffHealth({ leaveUntil: now + (5 * 86400000) }).status, 'leave');

  // 2. Terfi Değerlendirmesi
  const incompleteStaff = {
    joinedStaffAt: now - (5 * 86400000),
    performanceScore: 65,
    workCount30d: 4,
    qualityWorksCount: 1,
    warningsCount: 0
  };
  const promoIncomplete = evaluatePromotionEligibility(incompleteStaff);
  assert.equal(promoIncomplete.isReady, false);
  assert.ok(promoIncomplete.missingItems.length > 0);

  const completeStaff = {
    joinedStaffAt: now - (20 * 86400000),
    performanceScore: 85,
    workCount30d: 12,
    qualityWorksCount: 3,
    warningsCount: 0
  };
  const promoComplete = evaluatePromotionEligibility(completeStaff);
  assert.equal(promoComplete.isReady, true);
  assert.equal(promoComplete.progressPercent, 100);

  // 3. RD Risk Değerlendirmesi
  const riskStaff = {
    lastWorkAt: now - (22 * 86400000),
    performanceScore: 30,
    warningsCount: 2
  };
  const demoRisk = evaluateDemotionRisk(riskStaff);
  assert.equal(demoRisk.isRisk, true);
  assert.ok(demoRisk.reasons.length >= 2);
});

test('handleStaffWorkMessage queues work for quality review', async () => {
  let reacted = [];
  const mockMessage = {
    guild: {
      id: GUILD_ID,
      channels: {
        cache: new Map(),
        fetch: async () => ({ isTextBased: () => true, send: async () => { } })
      }
    },
    channelId: 'chan-work-1',
    channel: { parentId: WORK_CATEGORY_ID },
    author: { id: 'mod-cand-555', username: 'KadirDev', tag: 'KadirDev#0001', bot: false },
    content: 'Yeni custom araç GUI sistemi: https://www.roblox.com/library/12345/CarGui',
    react: async (e) => { reacted.push(e); }
  };

  const handled = await handleStaffWorkMessage(mockMessage);
  assert.equal(handled, true);
  assert.ok(reacted.includes('⏳'));
});

test('handleStaffManagementInteraction handles 5-star rating, promotions, demotions, and warnings', async () => {
  let replyPayload = null;
  let sentDMs = [];

  const mockClient = {
    users: {
      fetch: async (id) => ({
        id,
        username: 'TestStaff',
        send: async (payload) => { sentDMs.push({ id, payload }); }
      })
    },
    channels: {
      cache: new Map([
        [PANEL_CHANNEL_ID, { isTextBased: () => true, send: async () => { } }],
        [STAFF_LOG_CHANNEL_ID, { isTextBased: () => true, send: async () => { } }]
      ])
    }
  };

  // 1. Yönetici çalışmayı 5 yıldızla onaylar
  const { loadStaffData, saveStaffData } = require('../bot/services/robloxLandStaffManagementService');
  const data = loadStaffData();
  data.pendingWorks['work-test-99'] = {
    id: 'work-test-99',
    userId: 'staff-user-77',
    channelId: 'chan-1',
    status: 'pending'
  };
  data.staffMembers['staff-user-77'] = {
    userId: 'staff-user-77',
    username: 'TargetStaff',
    roleName: 'Yetkili Ofisi Staj',
    performanceScore: 75,
    workCount30d: 0,
    qualityWorksCount: 0
  };
  saveStaffData(data);

  const mockRateInteraction = {
    customId: 'robloxland_staffmgmt_rate_5_work-test-99',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Baskan#0001' },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };

  const handledRate = await handleStaffManagementInteraction(mockRateInteraction);
  assert.equal(handledRate, true);
  assert.match(replyPayload.content, /5 ⭐/);

  const updatedData = loadStaffData();
  assert.equal(updatedData.staffMembers['staff-user-77'].performanceScore, 82); // 75 + 7
  assert.equal(updatedData.staffMembers['staff-user-77'].qualityWorksCount, 1);

  // 2. Terfi modal işlemi
  const mockPromoteInteraction = {
    customId: 'robloxland_staffmgmt_modal_do_promote_staff-user-77',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Baskan#0001' },
    fields: {
      getTextInputValue: (f) => {
        if (f === 'promote_new_role') return 'Yetkili Ofisi Kıdemli Staj';
        if (f === 'promote_reason') return 'Yüksek performans ve kaliteli paylaşımlar';
        return '';
      }
    },
    guild: {
      members: { cache: new Map(), fetch: async () => ({ roles: { add: async () => { } } }) }
    },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };

  const handledPromote = await handleStaffManagementInteraction(mockPromoteInteraction);
  assert.equal(handledPromote, true);
  assert.match(replyPayload.content, /terfi ettirildi/);

  const afterPromoteData = loadStaffData();
  assert.equal(afterPromoteData.staffMembers['staff-user-77'].roleName, 'Yetkili Ofisi Kıdemli Staj');
});

test('handleStaffManagementInteraction handles anonymous DM bridge', async () => {
  let replyPayload = null;
  let sentDMs = [];

  const mockClient = {
    users: {
      fetch: async (id) => ({
        id,
        username: 'TargetStaff',
        send: async (p) => { sentDMs.push(p); }
      })
    },
    channels: {
      cache: new Map([
        [PANEL_CHANNEL_ID, { isTextBased: () => true, send: async () => { } }],
        [STAFF_LOG_CHANNEL_ID, { isTextBased: () => true, send: async () => { } }]
      ])
    }
  };

  const mockAnonSendInteraction = {
    customId: 'robloxland_staffmgmt_modal_anon_send_staff-user-77',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Amir#0001' },
    fields: {
      getTextInputValue: (f) => {
        if (f === 'anon_template') return '1'; // Çalışma vakti
        if (f === 'anon_text') return 'Yeni bir map bekliyoruz';
        return '';
      }
    },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };

  const handled = await handleStaffManagementInteraction(mockAnonSendInteraction);
  assert.equal(handled, true);
  assert.match(replyPayload.content, /anonim mesajınız iletildi/);
  assert.equal(sentDMs.length, 1);
});

test('handleStaffManagementInteraction allows setting chief roles, adding staff roles, and editing templates', async () => {
  let replyPayload = null;
  const { loadStaffData, saveStaffData, buildStaffSettingsPayload } = require('../bot/services/robloxLandStaffManagementService');
  const data = loadStaffData();

  // 1. Settings payload doğrulaması
  const settingsPayload = buildStaffSettingsPayload(data);
  assert.ok(settingsPayload);
  const settingsJson = JSON.stringify(settingsPayload.components[0]);
  assert.match(settingsJson, /YETKİLİ SİSTEM & ROL AYARLARI/);
  assert.match(settingsJson, /robloxland_staffmgmt_btn_set_chief_roles/);
  assert.match(settingsJson, /robloxland_staffmgmt_btn_add_role/);
  assert.match(settingsJson, /robloxland_staffmgmt_btn_delete_role/);
  assert.match(settingsJson, /robloxland_staffmgmt_btn_edit_templates/);

  // 2. Başkan & Başkan Yardımcısı Rollerini Güncelleme
  const mockChiefRolesInteraction = {
    customId: 'robloxland_staffmgmt_modal_set_chief_roles',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Admin#0001' },
    fields: {
      getTextInputValue: (f) => {
        if (f === 'baskan_role_id') return '1544392306101067899';
        if (f === 'baskan_yardimcisi_role_id') return '1544393522784903299';
        return '';
      }
    },
    reply: async (p) => { replyPayload = p; }
  };

  const handledChief = await handleStaffManagementInteraction(mockChiefRolesInteraction);
  assert.equal(handledChief, true);
  assert.match(replyPayload.content, /Üst Yönetim Rolleri Güncellendi/);

  const updatedAfterChief = loadStaffData();
  assert.equal(updatedAfterChief.settings.baskanRoleId, '1544392306101067899');
  assert.equal(updatedAfterChief.settings.baskanYardimcisiRoleId, '1544393522784903299');

  // 3. Yeni Yetkili Rolü Ekleme
  const mockAddRoleInteraction = {
    customId: 'robloxland_staffmgmt_modal_add_role',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Admin#0001' },
    fields: {
      getTextInputValue: (f) => {
        if (f === 'role_name') return 'Kıdemli Denetmen';
        if (f === 'role_id') return '1544393943570190888';
        if (f === 'role_rank') return '4';
        return '';
      }
    },
    reply: async (p) => { replyPayload = p; }
  };

  const handledAddRole = await handleStaffManagementInteraction(mockAddRoleInteraction);
  assert.equal(handledAddRole, true);
  assert.match(replyPayload.content, /Kıdemli Denetmen/);

  const updatedAfterRole = loadStaffData();
  const addedRole = updatedAfterRole.settings.roles.find(r => r.name === 'Kıdemli Denetmen');
  assert.ok(addedRole);
  assert.equal(addedRole.id, '1544393943570190888');
  assert.equal(addedRole.rank, 4);

  // 4. Hazır Mesaj Şablonlarını Güncelleme
  const mockEditTemplatesInteraction = {
    customId: 'robloxland_staffmgmt_modal_edit_templates',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Admin#0001' },
    fields: {
      getTextInputValue: (f) => {
        if (f === 'tpl_10d') return 'Özel 10. gün mesajı: {username} aktif misin?';
        if (f === 'tpl_13d') return 'Özel 13. gün mesajı: {username} 3 gündür ses yok!';
        if (f === 'tpl_work') return 'Özel çalışma vakti mesajı!';
        if (f === 'tpl_meeting') return 'Özel toplantı mesajı!';
        if (f === 'tpl_low_activity') return 'Özel düşük aktivite uyarısı!';
        return '';
      }
    },
    reply: async (p) => { replyPayload = p; }
  };

  const handledTemplates = await handleStaffManagementInteraction(mockEditTemplatesInteraction);
  assert.equal(handledTemplates, true);
  assert.match(replyPayload.content, /Hazır Mesaj & DM Şablonları Başarıyla Güncellendi/);

  const updatedAfterTpl = loadStaffData();
  assert.equal(updatedAfterTpl.settings.templates.dm10d, 'Özel 10. gün mesajı: {username} aktif misin?');
  assert.equal(updatedAfterTpl.settings.templates.workTime, 'Özel çalışma vakti mesajı!');
});

test('handleStaffManagementInteraction handles oath sending, faith selection, swearing oath and kicking staff', async () => {
  let replyPayload = null;
  let sentDMs = [];

  const mockClient = {
    users: {
      fetch: async (id) => ({
        id,
        username: 'CandidateStaff',
        send: async (p) => { sentDMs.push(p); }
      })
    },
    channels: {
      cache: new Map([
        [PANEL_CHANNEL_ID, { isTextBased: () => true, send: async () => { } }],
        [STAFF_LOG_CHANNEL_ID, { isTextBased: () => true, send: async () => { } }]
      ])
    }
  };

  const { loadStaffData, saveStaffData } = require('../bot/services/robloxLandStaffManagementService');
  const data = loadStaffData();
  data.staffMembers['staff-oath-1'] = {
    userId: 'staff-oath-1',
    username: 'YeminAdayi',
    roleName: 'Yetkili Ofisi Staj',
    performanceScore: 80,
    oathStatus: 'pending'
  };
  saveStaffData(data);

  // 1. Yönetici yetkiliye yemin gönderir
  const mockSendOathInteraction = {
    customId: 'robloxland_staffmgmt_act_send_oath_staff-oath-1',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Baskan#0001' },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };

  const handledSend = await handleStaffManagementInteraction(mockSendOathInteraction);
  assert.equal(handledSend, true);
  assert.match(replyPayload.content, /Görev & Sadakat Yemini/);
  assert.equal(sentDMs.length, 1);

  // 2. Yetkili DM'den İslam inancını seçer
  const mockSelectFaithInteraction = {
    customId: 'robloxland_staff_oath_select_faith_staff-oath-1',
    values: ['islam'],
    user: { id: 'staff-oath-1' },
    reply: async (p) => { replyPayload = p; }
  };

  const handledSelect = await handleStaffManagementInteraction(mockSelectFaithInteraction);
  assert.equal(handledSelect, true);
  const faithCardJson = JSON.stringify(replyPayload.components[0]);
  assert.match(faithCardJson, /Kuran-ı Kerim/);
  assert.match(faithCardJson, /robloxland_staff_oath_btn_islam_staff-oath-1/);

  // 3. Yetkili yemin modalına "Yemin Ederim" yazar
  const mockConfirmOathInteraction = {
    customId: 'robloxland_staffmgmt_modal_confirm_oath_islam_staff-oath-1',
    fields: {
      getTextInputValue: () => 'Evet, Yemin Ederim.'
    },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };

  const handledConfirm = await handleStaffManagementInteraction(mockConfirmOathInteraction);
  assert.equal(handledConfirm, true);
  assert.match(replyPayload.content, /Görev yemininiz/);

  const updatedSworn = loadStaffData();
  assert.equal(updatedSworn.staffMembers['staff-oath-1'].oathStatus, 'sworn');
  assert.equal(updatedSworn.staffMembers['staff-oath-1'].faith, '☪️ İslam');
  assert.equal(updatedSworn.staffMembers['staff-oath-1'].performanceScore, 85); // +5 Puan

  // 4. Yönetici yetkiliyi kadrodan çıkarır (İhraç)
  const mockKickInteraction = {
    customId: 'robloxland_staffmgmt_modal_do_kick_staff-oath-1',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Baskan#0001' },
    fields: {
      getTextInputValue: () => 'Uzun süredir görevlerini yerine getirmedi.'
    },
    guild: {
      members: { cache: new Map(), fetch: async () => ({ roles: { cache: new Map(), remove: async () => { } } }) }
    },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };

  const handledKick = await handleStaffManagementInteraction(mockKickInteraction);
  assert.equal(handledKick, true);
  assert.match(replyPayload.content, /başarıyla kadrodan çıkarıldı/);

  const afterKickData = loadStaffData();
  assert.equal(afterKickData.staffMembers['staff-oath-1'], undefined);
});

test('generateOathCertificateBuffer creates valid PNG image and handleStaffManagementInteraction supports certificate viewing and rules customization', async () => {
  const { generateOathCertificateBuffer, loadStaffData, handleStaffManagementInteraction } = require('../bot/services/robloxLandStaffManagementService');

  // 1. Canvas Sertifika Üretimi Testi
  const certBuf = generateOathCertificateBuffer({
    username: 'egedev',
    faithName: '☪️ İslam',
    oathText: "Allah'ın huzurunda adaletle görev yapacağıma namusum üzerine yemin ederim.",
    swornDate: '01.09.2026',
    userId: '1497600770634289194'
  });

  if (certBuf) {
    assert.ok(Buffer.isBuffer(certBuf));
    // PNG Header kontrolü (89 50 4E 47)
    assert.equal(certBuf[0], 0x89);
    assert.equal(certBuf[1], 0x50);
    assert.equal(certBuf[2], 0x4E);
    assert.equal(certBuf[3], 0x47);
  }

  // 2. Yemin Belgesini İnceleme Buton Testi
  const certData = loadStaffData();
  certData.staffMembers['1497600770634289194'] = {
    userId: '1497600770634289194',
    username: 'uı9opıjopş ğşjioğşıojıı',
    faith: '☪️ İslam',
    oathStatus: 'sworn',
    oathDate: Date.now(),
    oathText: "Allah'ın huzurunda adaletle görev yapacağıma namusum üzerine yemin ederim."
  };
  const { saveStaffData } = require('../bot/services/robloxLandStaffManagementService');
  saveStaffData(certData);

  let replyPayload = null;
  const mockViewCertInteraction = {
    customId: 'robloxland_staffmgmt_act_view_oath_cert_1497600770634289194',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Baskan#0001' },
    reply: async (p) => { replyPayload = p; }
  };

  const handledView = await handleStaffManagementInteraction(mockViewCertInteraction);
  assert.equal(handledView, true);
  assert.match(replyPayload.content, /Görev & Sadakat Yemini Belgesi/);
  if (certBuf) {
    assert.ok(replyPayload.files && replyPayload.files.length > 0);
  }

  // 3. Otomasyon Kuralları Modal Submit Testi
  const mockEditRulesInteraction = {
    customId: 'robloxland_staffmgmt_modal_edit_rules',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Baskan#0001' },
    fields: {
      getTextInputValue: (f) => {
        if (f === 'rule_days_10') return '8';
        if (f === 'rule_days_13') return '11';
        if (f === 'rule_days_20') return '18';
        if (f === 'rule_score_star5') return '10';
        if (f === 'rule_penalty_warn') return '20';
        return '';
      }
    },
    reply: async (p) => { replyPayload = p; }
  };

  const handledRules = await handleStaffManagementInteraction(mockEditRulesInteraction);
  assert.equal(handledRules, true);
  assert.match(replyPayload.content, /Otomasyon Kuralları & Puanlama Eşikleri Güncellendi/);

  const updatedRulesData = loadStaffData();
  assert.equal(updatedRulesData.settings.automationRules.days10Reminder, 8);
  assert.equal(updatedRulesData.settings.automationRules.days13Warning, 11);
  assert.equal(updatedRulesData.settings.automationRules.scoreStar5, 10);
  assert.equal(updatedRulesData.settings.automationRules.penaltyWarning, 20);
});

test('buildStaffPersonalInfoPayload and handleStaffManagementInteraction support 20-item personality test and dossier viewing', async () => {
  let replyPayload = null;
  let sentDMs = [];

  const mockClient = {
    users: {
      fetch: async (id) => ({
        id,
        username: 'EgeMod',
        send: async (p) => { sentDMs.push(p); }
      })
    },
    channels: {
      cache: new Map([
        [PANEL_CHANNEL_ID, { isTextBased: () => true, send: async () => {} }],
        [STAFF_LOG_CHANNEL_ID, { isTextBased: () => true, send: async () => {} }]
      ])
    }
  };

  const {
    loadStaffData,
    saveStaffData,
    buildStaffPersonalInfoPayload,
    handleStaffManagementInteraction
  } = require('../bot/services/robloxLandStaffManagementService');

  const data = loadStaffData();
  data.staffMembers['staff-ptest-1'] = {
    userId: 'staff-ptest-1',
    username: 'EgeMod',
    roleName: 'Yetkili Ofisi Müdürü',
    performanceScore: 85,
    personalInfo: {}
  };
  saveStaffData(data);

  // 1. Yönetici Yetkiliye Kişilik Testi Gönderir
  const mockSendPTestInteraction = {
    customId: 'robloxland_staffmgmt_act_send_personality_test_staff-ptest-1',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Baskan#0001' },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };

  const handledSend = await handleStaffManagementInteraction(mockSendPTestInteraction);
  assert.equal(handledSend, true);
  assert.match(replyPayload.content, /20 Soruluk Kişilik & Profil Envanter Testi/);
  assert.equal(sentDMs.length, 1);

  // 2. Yetkili Aşama 1'i Doldurur (1-5)
  const mockStep1Modal = {
    customId: 'robloxland_staffmgmt_modal_ptest_step1_staff-ptest-1',
    fields: {
      getTextInputValue: (f) => {
        if (f === 'p_name') return 'Ege';
        if (f === 'p_age') return '19 (2007)';
        if (f === 'p_gender') return 'Erkek';
        if (f === 'p_religion') return '☪️ İslam';
        if (f === 'p_city') return 'İzmir';
        return '';
      }
    },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };
  assert.equal(await handleStaffManagementInteraction(mockStep1Modal), true);

  // 3. Yetkili Aşama 2'yi Doldurur (6-10)
  const mockStep2Modal = {
    customId: 'robloxland_staffmgmt_modal_ptest_step2_staff-ptest-1',
    fields: {
      getTextInputValue: (f) => {
        if (f === 'p_mbti') return 'INTJ';
        if (f === 'p_temperament') return 'Analitik ve Çözüm Odaklı';
        if (f === 'p_stress') return 'Soğukkanlı ve Kuralcı';
        if (f === 'p_comm') return 'Resmi ve Net';
        if (f === 'p_mic') return 'Aktif Konuşabilir';
        return '';
      }
    },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };
  assert.equal(await handleStaffManagementInteraction(mockStep2Modal), true);

  // 4. Yetkili Aşama 3'ü Doldurur (11-15)
  const mockStep3Modal = {
    customId: 'robloxland_staffmgmt_modal_ptest_step3_staff-ptest-1',
    fields: {
      getTextInputValue: (f) => {
        if (f === 'p_specialty') return 'Scripter & Sistem Mimarı';
        if (f === 'p_hours') return 'Günde 5 saat (Haftada 35 saat)';
        if (f === 'p_crisis') return 'Kanıt toplar, sakinleştirir, amirlere raporlar';
        if (f === 'p_teamwork') return 'Yüksek koordinasyon ve takım oyuncusu';
        if (f === 'p_edu') return 'Yazılım Mühendisliği Öğrencisi';
        return '';
      }
    },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };
  assert.equal(await handleStaffManagementInteraction(mockStep3Modal), true);

  // 5. Yetkili Aşama 4'ü Doldurur (16-20)
  const mockStep4Modal = {
    customId: 'robloxland_staffmgmt_modal_ptest_step4_staff-ptest-1',
    fields: {
      getTextInputValue: (f) => {
        if (f === 'p_strong') return 'Hızlı hata ayıklama ve liderlik';
        if (f === 'p_growth') return 'Zaman yönetimi';
        if (f === 'p_goal') return 'Roblox Stüdyosu Kurup Baş Moderatör Olmak';
        if (f === 'p_hobbies') return 'Lua Kodlama, 3D Modelleme, Müzik';
        if (f === 'p_motto') return 'Adalet ve disiplin başarının anahtarıdır.';
        return '';
      }
    },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };
  assert.equal(await handleStaffManagementInteraction(mockStep4Modal), true);

  // 6. Kaydedilen 20 Bilgiyi ve Tamamlanma Durumunu Doğrula
  const updatedStaff = loadStaffData().staffMembers['staff-ptest-1'];
  assert.equal(updatedStaff.personalityTestCompleted, true);
  assert.equal(updatedStaff.personalInfo.name, 'Ege');
  assert.equal(updatedStaff.personalInfo.mbti, 'INTJ');
  assert.equal(updatedStaff.personalInfo.religion, '☪️ İslam');
  assert.equal(updatedStaff.personalInfo.robloxSpecialty, 'Scripter & Sistem Mimarı');
  assert.equal(updatedStaff.personalInfo.lifeMotto, 'Adalet ve disiplin başarının anahtarıdır.');

  // 7. Kişisel Bilgi Dosyasını Gösterme Testi (Dossier View)
  const mockViewDossierInteraction = {
    customId: 'robloxland_staffmgmt_act_view_personal_info_staff-ptest-1',
    member: { id: DESIGNATED_STAFF_ID },
    user: { id: DESIGNATED_STAFF_ID, tag: 'Baskan#0001' },
    reply: async (p) => { replyPayload = p; }
  };
  assert.equal(await handleStaffManagementInteraction(mockViewDossierInteraction), true);

  const dossierPayload = buildStaffPersonalInfoPayload(updatedStaff);
  assert.ok(dossierPayload);
  const dossierJson = JSON.stringify(dossierPayload.components[0]);
  assert.match(dossierJson, /YETKİLİ KİŞİSEL BİLGİ & KİŞİLİK ENVANTERİ/);
  assert.match(dossierJson, /INTJ/);
  assert.match(dossierJson, /Scripter & Sistem Mimarı/);
  assert.match(dossierJson, /Adalet ve disiplin/);
});
