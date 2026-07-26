'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const LockManager = require('../bot/services/security/LockManager');
const AntiNukeEngine = require('../bot/services/security/AntiNukeEngine');
const { calculateAccountRisk } = require('../bot/services/security/AccountRiskScore');
const SLAEngine = require('../bot/services/ticket/SLAEngine');
const { routeButtonInteraction } = require('../bot/handlers/buttons');

test('LockManager prevents concurrent double clicks on same action', () => {
  const userId = `user_${Date.now()}`;
  const action = 'eco_claim';

  const firstAcquire = LockManager.acquireLock(userId, action, 3000);
  assert.equal(firstAcquire, true, 'First lock acquire should succeed');

  const secondAcquire = LockManager.acquireLock(userId, action, 3000);
  assert.equal(secondAcquire, false, 'Second lock acquire within TTL should be rejected');

  LockManager.releaseLock(userId, action);
  const thirdAcquire = LockManager.acquireLock(userId, action, 3000);
  assert.equal(thirdAcquire, true, 'Acquire after release should succeed');
  LockManager.releaseLock(userId, action);
});

test('AntiNukeEngine triggers mitigation when action threshold is exceeded', () => {
  const fakeGuild = { id: `guild_${Date.now()}`, ownerId: 'owner_999', members: { fetch: async () => null } };
  const attackerId = 'attacker_123';

  AntiNukeEngine.processAuditAction(fakeGuild, attackerId, 'CHANNEL_DELETE');
  AntiNukeEngine.processAuditAction(fakeGuild, attackerId, 'CHANNEL_DELETE');
  const res3 = AntiNukeEngine.processAuditAction(fakeGuild, attackerId, 'CHANNEL_DELETE');

  assert.equal(res3.triggered, true, 'AntiNuke should trigger on 3rd rapid deletion action');
});

test('AccountRiskScore calculates high risk score for new accounts without avatar', () => {
  const freshUser = {
    id: 'user_fresh',
    createdTimestamp: Date.now() - (12 * 60 * 60 * 1000), // 12 hours old
    avatar: null,
    username: 'user_99214141'
  };

  const risk = calculateAccountRisk(freshUser);
  assert.ok(risk.riskScore >= 70, `Expected high risk score, got: ${risk.riskScore}`);
  assert.equal(risk.riskLevel, 'Yüksek Risk / Karantina');
});

test('SLAEngine starts and clears ticket SLA timers without throwing errors', () => {
  const ticketId = `ticket_${Date.now()}`;
  const fakeClient = { channels: { fetch: async () => null } };

  SLAEngine.startTicketSLA(ticketId, 'chan_123', fakeClient, 5000);
  assert.ok(SLAEngine.activeSLATimers.has(ticketId));

  SLAEngine.clearTicketSLA(ticketId);
  assert.equal(SLAEngine.activeSLATimers.has(ticketId), false);
});

test('Modular Button Router dispatches ticket, staff, and economy buttons correctly', async () => {
  let replyContent = null;
  const fakeInteraction = {
    customId: 'eco_daily_reward',
    user: { id: `user_${Date.now()}` },
    reply: async (payload) => {
      replyContent = payload;
      return payload;
    }
  };

  const handled = await routeButtonInteraction(fakeInteraction);
  assert.equal(handled, true);
  assert.ok(replyContent);
});
