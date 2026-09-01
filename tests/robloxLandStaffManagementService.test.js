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
        fetch: async () => ({ isTextBased: () => true, send: async () => {} })
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
        [PANEL_CHANNEL_ID, { isTextBased: () => true, send: async () => {} }],
        [STAFF_LOG_CHANNEL_ID, { isTextBased: () => true, send: async () => {} }]
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
      members: { cache: new Map(), fetch: async () => ({ roles: { add: async () => {} } }) }
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
        [PANEL_CHANNEL_ID, { isTextBased: () => true, send: async () => {} }],
        [STAFF_LOG_CHANNEL_ID, { isTextBased: () => true, send: async () => {} }]
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
