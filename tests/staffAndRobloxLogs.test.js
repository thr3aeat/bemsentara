'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const discordLogger = require('../bot/services/discordLogger');
const LockManager = require('../bot/services/security/LockManager');
const SchoolSession = require('../models/SchoolSession');
const { calculateAccountRisk } = require('../bot/services/security/AccountRiskScore');

test('discordLogger exports sendLog and init functions', () => {
  assert.ok(typeof discordLogger.sendLog === 'function');
  assert.ok(typeof discordLogger.init === 'function');
});

test('LockManager enforces atomic lock for staff salary claims', () => {
  const userId = `staff_user_${Date.now()}`;
  const action = 'staff_claim_salary';

  const lock1 = LockManager.acquireLock(userId, action, 4000);
  assert.equal(lock1, true);

  const lock2 = LockManager.acquireLock(userId, action, 4000);
  assert.equal(lock2, false);

  LockManager.releaseLock(userId, action);
  const lock3 = LockManager.acquireLock(userId, action, 4000);
  assert.equal(lock3, true);
  LockManager.releaseLock(userId, action);
});

test('SchoolSession model instantiates with proper fields', () => {
  const sess = new SchoolSession({
    userId: 'stajyer_123',
    training: { phase: 1, step: 2, lastMessageId: 'msg_999' },
    exam: { questionIndex: 3, answers: ['Answer A', 'Answer B'], phase: 2 }
  });

  assert.equal(sess.userId, 'stajyer_123');
  assert.equal(sess.training.phase, 1);
  assert.equal(sess.exam.answers.length, 2);
});

test('AccountRiskScore correctly rates old verified accounts as low risk', () => {
  const verifiedUser = {
    id: 'user_veteran',
    createdTimestamp: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year old
    avatar: 'avatar_hash_123',
    username: 'ahmet_eko'
  };

  const risk = calculateAccountRisk(verifiedUser);
  assert.equal(risk.riskScore, 0);
  assert.equal(risk.riskLevel, 'Düşük Risk');
});
