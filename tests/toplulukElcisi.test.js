'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  processModMistake,
  reinstateStaff,
  clearStaffWarnings,
  requestUnitBudgetFromAmbassador,
  toggleAmbassadorLockdown,
  getLockdownState,
  trackProtocolZeroAction,
  activateProtocolZero,
  triggerCentralBankVote,
  generateGhostReport,
  assignAIPracticeScenario,
  requestStateTreasuryFund,
  grantPardonWithCommunityService,
  releaseFromPIP
} = require('../bot/services/toplulukElcisiService');
const { applyCentralBankIntervention, getCentralBankState } = require('../bot/services/marketSystem');
const { triggerAmbassadorPromotionCheck } = require('../bot/services/staffSystem');

test('Topluluk Elçisi - toggleAmbassadorLockdown toggles lockdown status correctly', async () => {
  const initialState = getLockdownState();
  const newState = await toggleAmbassadorLockdown(null, { id: 'amb1', tag: 'Elci#0001' }, null, 'Test Lockdown');
  assert.equal(newState, !initialState);
  
  // Revert back
  const revertedState = await toggleAmbassadorLockdown(null, { id: 'amb1', tag: 'Elci#0001' }, null, 'Reset Lockdown');
  assert.equal(revertedState, initialState);
});

test('Topluluk Elçisi - Central Bank Intervention applies market overrides', () => {
  const res = applyCentralBankIntervention(0.05, 2.0, 1);
  assert.equal(res.active, true);
  assert.equal(res.crisisTaxRate, 0.05);

  const cbState = getCentralBankState();
  assert.equal(cbState.active, true);
  assert.equal(cbState.crisisTaxRate, 0.05);
});

test('Topluluk Elçisi - Advanced exports and functions exist', () => {
  assert.equal(typeof processModMistake, 'function');
  assert.equal(typeof reinstateStaff, 'function');
  assert.equal(typeof clearStaffWarnings, 'function');
  assert.equal(typeof requestUnitBudgetFromAmbassador, 'function');
  assert.equal(typeof triggerAmbassadorPromotionCheck, 'function');
  assert.equal(typeof trackProtocolZeroAction, 'function');
  assert.equal(typeof activateProtocolZero, 'function');
  assert.equal(typeof triggerCentralBankVote, 'function');
  assert.equal(typeof generateGhostReport, 'function');
  assert.equal(typeof assignAIPracticeScenario, 'function');
  assert.equal(typeof requestStateTreasuryFund, 'function');
  assert.equal(typeof grantPardonWithCommunityService, 'function');
  assert.equal(typeof releaseFromPIP, 'function');
});
