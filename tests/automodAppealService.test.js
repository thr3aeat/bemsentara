'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  submitAutomodAppeal,
  sendAppealToDiscordStaffChannel,
  handleModeratorDecision,
  checkPendingAppealsAndAlertTelegram,
  startAppealMonitoringScheduler,
  applyAppealApproval,
  MOD_APPROVAL_CHANNEL_ID
} = require('../bot/services/automodAppealService');
const { renderItirazMerkeziPage } = require('../server/views/itirazMerkeziPage');
const AutomodAppeal = require('../models/AutomodAppeal');

test('automodAppealService: basic configuration and constants', () => {
  assert.strictEqual(MOD_APPROVAL_CHANNEL_ID, '1518684031275761719');
  assert.strictEqual(typeof submitAutomodAppeal, 'function');
  assert.strictEqual(typeof sendAppealToDiscordStaffChannel, 'function');
  assert.strictEqual(typeof handleModeratorDecision, 'function');
  assert.strictEqual(typeof checkPendingAppealsAndAlertTelegram, 'function');
  assert.strictEqual(typeof startAppealMonitoringScheduler, 'function');
});

test('automodAppealService: submitAutomodAppeal validates required inputs', async () => {
  const result1 = await submitAutomodAppeal({ userId: '', appealMessage: '', client: {} });
  assert.strictEqual(result1.success, false);
  assert.ok(result1.error.includes('zorunludur'));

  const result2 = await submitAutomodAppeal({ userId: '123', appealMessage: '   ', client: {} });
  assert.strictEqual(result2.success, false);
});

test('itirazMerkeziPage: renders web appeal portal correctly', () => {
  const html = renderItirazMerkeziPage({
    query: { incident: 'MSG-999', user: '1031620522406072350' },
    user: { id: '1031620522406072350', username: 'ekoyildiz_' }
  });

  assert.ok(html.includes('Automod İtiraz Portalı'));
  assert.ok(html.includes('MSG-999'));
  assert.ok(html.includes('1031620522406072350'));
  assert.ok(html.includes('EKOai İncelemesi'));
  assert.ok(html.includes('Telegram Takibi'));
  assert.ok(html.includes('/api/automod/appeal'));
});

test('automodAppealService: sendAppealToDiscordStaffChannel constructs Components V2 without accent color', async () => {
  let sentPayload = null;
  const mockStaffChannel = {
    id: MOD_APPROVAL_CHANNEL_ID,
    isTextBased: () => true,
    send: async (payload) => {
      sentPayload = payload;
      return { id: 'DISCORD_MSG_777' };
    }
  };

  const mockClient = {
    channels: {
      fetch: async (id) => {
        if (id === MOD_APPROVAL_CHANNEL_ID) return mockStaffChannel;
        return null;
      }
    }
  };

  const message = await sendAppealToDiscordStaffChannel({
    client: mockClient,
    appealId: 'ITR-TEST-1234',
    userId: '987654321',
    username: 'test_user',
    blockedContent: 'ornek kural disi icerik',
    matchedWord: 'ornek_kelime',
    appealMessage: 'Yanlislikla arkadasima yazmistim, ozur dilerim.',
    aiReasoning: 'Kullanici ihlali kabul etmiyor ama savunmasi tutarli.',
    trustScore: 80,
    totalMessages: 450,
    userLevel: 3,
    channelId: '1504201341021716690'
  });

  assert.ok(message);
  assert.strictEqual(message.id, 'DISCORD_MSG_777');
  assert.ok(sentPayload);
  assert.ok(Array.isArray(sentPayload.components));

  const container = sentPayload.components[0];
  // Verify accent color is null or not set (accent colorsuz)
  assert.strictEqual(container.data.accent_color, undefined);
  assert.ok(container.components.length >= 3);
});
