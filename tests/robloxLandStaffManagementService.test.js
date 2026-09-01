'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  GUILD_ID,
  PANEL_CHANNEL_ID,
  WORK_CATEGORY_ID,
  STAFF_ROLE_ID,
  DESIGNATED_STAFF_ID,
  buildStaffManagementPayload,
  isValidWorkMessage,
  handleStaffWorkMessage,
  calculateStaffHealth,
  renderProgressBar,
  runDailyStaffAudit,
  handleStaffManagementInteraction,
  activeAnonSessions
} = require('../bot/services/robloxLandStaffManagementService');

test('buildStaffManagementPayload returns Components V2 container with stats and action rows', () => {
  const mockData = {
    staffMembers: {
      'user-1': {
        userId: 'user-1',
        username: 'Asaf',
        joinedStaffAt: Date.now() - (30 * 86400000),
        lastWorkAt: Date.now() - (2 * 86400000),
        workCountTotal: 25,
        workCount30d: 14,
        streakDays: 18,
        status: 'active',
        performanceScore: 92,
        warningsCount: 0
      }
    },
    weeklyStats: { totalWorksThisWeek: 12 }
  };

  const payload = buildStaffManagementPayload(mockData);
  assert.ok(payload);
  assert.ok(Array.isArray(payload.components));
  assert.equal(payload.components[0].type, 17); // Container

  const containerJson = JSON.stringify(payload.components[0]);
  assert.match(containerJson, /ROBLOXLAND YETKİLİ YÖNETİM/);
  assert.match(containerJson, /robloxland_staffmgmt_add/);
  assert.match(containerJson, /robloxland_staffmgmt_list/);
  assert.match(containerJson, /robloxland_staffmgmt_leaderboard/);
  assert.match(containerJson, /robloxland_staffmgmt_broadcast/);
  assert.match(containerJson, /robloxland_staffmgmt_anon_dm/);
  assert.match(containerJson, /robloxland_staffmgmt_leave/);
  assert.match(containerJson, /robloxland_staffmgmt_task/);
});

test('isValidWorkMessage accurately distinguishes valid work from casual spam', () => {
  // Geçersiz mesajlar (Boş veya sadece selamlama)
  assert.equal(isValidWorkMessage({ content: 'sa' }), false);
  assert.equal(isValidWorkMessage({ content: 'günaydın beyler nasılsınız' }), false);
  assert.equal(isValidWorkMessage({ content: 'selam' }), false);

  // Geçerli mesajlar (Dosya / attachment)
  assert.equal(isValidWorkMessage({ content: 'Yeni araç sistemi', attachments: new Map([['1', { name: 'car.rbxm' }]]) }), true);

  // Geçerli mesajlar (Roblox/GitHub linki)
  assert.equal(isValidWorkMessage({ content: 'İncelemek isteyenler için model linki: https://www.roblox.com/library/12345/Custom-Inventory' }), true);
  assert.equal(isValidWorkMessage({ content: 'Github repo: https://github.com/RobloxLand/core-systems' }), true);

  // Geçerli mesajlar (Kod bloğu)
  const codeMessage = '```lua\nlocal Players = game:GetService("Players")\nPlayers.PlayerAdded:Connect(function(p)\n  print(p.Name)\nend)\n```';
  assert.equal(isValidWorkMessage({ content: codeMessage }), true);
});

test('calculateStaffHealth and renderProgressBar correctly compute activity status', () => {
  const now = Date.now();

  const activeStaff = { lastWorkAt: now - (2 * 86400000) };
  assert.equal(calculateStaffHealth(activeStaff).status, 'active');

  const warningStaff = { lastWorkAt: now - (8 * 86400000) };
  assert.equal(calculateStaffHealth(warningStaff).status, 'warning');

  const passiveStaff = { lastWorkAt: now - (12 * 86400000) };
  assert.equal(calculateStaffHealth(passiveStaff).status, 'passive');

  const reviewStaff = { lastWorkAt: now - (25 * 86400000) };
  assert.equal(calculateStaffHealth(reviewStaff).status, 'review');

  const leaveStaff = { leaveUntil: now + (5 * 86400000) };
  assert.equal(calculateStaffHealth(leaveStaff).status, 'leave');

  const bar90 = renderProgressBar(90);
  assert.equal(bar90, '█████████░');

  const bar30 = renderProgressBar(30);
  assert.equal(bar30, '███░░░░░░░');
});

test('handleStaffWorkMessage updates work count and awards performance score', async () => {
  let reacted = [];
  const mockMessage = {
    guild: { id: GUILD_ID },
    channelId: 'channel-map-share',
    channel: { parentId: WORK_CATEGORY_ID },
    author: { id: 'moderator-test-888', username: 'ProMod', bot: false },
    content: 'Yeni RobloxLand envanter sistemi dosyasını paylaşıyorum: https://www.roblox.com/library/999/Inventory',
    react: async (emoji) => { reacted.push(emoji); }
  };

  const handled = await handleStaffWorkMessage(mockMessage);
  assert.equal(handled, true);
  assert.ok(reacted.includes('📦'));
  assert.ok(reacted.includes('⭐'));
});

test('handleStaffManagementInteraction supports anonymous DM and reply bridge', async () => {
  let replyPayload = null;
  let sentDMs = [];

  const mockClient = {
    users: {
      fetch: async (id) => ({
        id,
        username: 'StaffCandidate',
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

  // 1. Yönetici anonim DM başlatır
  const mockManagerInteraction = {
    customId: 'robloxland_staffmgmt_modal_anon_start',
    member: { id: DESIGNATED_STAFF_ID }, // Yetkili amir
    user: { id: DESIGNATED_STAFF_ID, tag: 'Amir#0001' },
    fields: {
      getTextInputValue: (field) => {
        if (field === 'anon_target_user') return '1538471137833394237';
        if (field === 'anon_initial_message') return 'Son günlerde pasifsin, her şey yolunda mı?';
        return '';
      }
    },
    client: mockClient,
    reply: async (p) => { replyPayload = p; }
  };

  const handledStart = await handleStaffManagementInteraction(mockManagerInteraction);
  assert.equal(handledStart, true);
  assert.equal(sentDMs.length, 1);
  assert.match(replyPayload.content, /anonim mesajınız iletildi/);

  // 2. Yetkili gelen anonim mesaja yanıt verir
  const activeSessions = Array.from(activeAnonSessions.keys());
  assert.ok(activeSessions.length > 0);
  const sessionId = activeSessions[0];

  let replyConfirmation = null;
  const mockStaffReplyInteraction = {
    customId: `robloxland_staffmgmt_modal_anon_reply_${sessionId}`,
    member: { id: '1538471137833394237' },
    user: { id: '1538471137833394237', tag: 'StaffMember#0001' },
    fields: {
      getTextInputValue: () => 'Sınav haftam vardı, yarından itibaren aktif olacağım.'
    },
    client: mockClient,
    reply: async (p) => { replyConfirmation = p; }
  };

  const handledReply = await handleStaffManagementInteraction(mockStaffReplyInteraction);
  assert.equal(handledReply, true);
  assert.match(replyConfirmation.content, /başarıyla iletildi/);

  activeAnonSessions.clear();
});

test('unauthorized users cannot perform staff management actions', async () => {
  let replyMsg = '';
  let replyEphemeral = false;

  const mockUnauthorizedInteraction = {
    customId: 'robloxland_staffmgmt_add',
    member: {
      id: 'regular-user-555',
      permissions: { has: () => false },
      roles: { cache: new Map() }
    },
    user: { id: 'regular-user-555' },
    reply: async (p) => {
      replyMsg = p.content;
      replyEphemeral = p.ephemeral;
    }
  };

  const handled = await handleStaffManagementInteraction(mockUnauthorizedInteraction);
  assert.equal(handled, undefined);
  assert.match(replyMsg, /yalnızca RobloxLand yetkili amirleri/);
  assert.equal(replyEphemeral, true);
});
