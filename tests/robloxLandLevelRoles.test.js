'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildLevelRoleTransition,
  getLevelRolesMap
} = require('../bot/services/robloxLandLevelService');

test('level transition keeps current and immediately previous role', () => {
  const roles = {
    1: { id: '11111111111111111' },
    2: { id: '22222222222222222' },
    3: { id: '33333333333333333' }
  };
  const result = buildLevelRoleTransition(
    ['11111111111111111', '22222222222222222'],
    roles,
    3
  );

  assert.equal(result.addRoleId, '33333333333333333');
  assert.deepEqual(result.addRoleIds, ['33333333333333333']);
  assert.deepEqual(result.keepRoleIds, ['33333333333333333', '22222222222222222']);
  assert.deepEqual(result.removeRoleIds, ['11111111111111111']);
});

test('level transition skips missing roles and still retains two real roles', () => {
  const roles = {
    10: { id: '10101010101010101' },
    11: { id: null },
    12: { id: '12121212121212121' }
  };
  const result = buildLevelRoleTransition(['10101010101010101'], roles, 12);

  assert.deepEqual(result.keepRoleIds, ['12121212121212121', '10101010101010101']);
  assert.deepEqual(result.addRoleIds, ['12121212121212121']);
  assert.deepEqual(result.removeRoleIds, []);
});

test('multi-level jump grants both target and previous role', () => {
  const roles = {
    1: { id: '11111111111111111' },
    4: { id: '44444444444444444' },
    5: { id: '55555555555555555' }
  };
  const result = buildLevelRoleTransition(['11111111111111111'], roles, 5);

  assert.deepEqual(result.addRoleIds, ['55555555555555555', '44444444444444444']);
  assert.deepEqual(result.removeRoleIds, ['11111111111111111']);
});

test('RobloxLand role map contains real Discord IDs instead of placeholders', () => {
  const roles = getLevelRolesMap();
  const realRoles = Object.values(roles).filter(role => /^\d{17,20}$/.test(String(role?.id || '')));

  assert.equal(realRoles.length, 64);
  assert.equal(roles[1].id, '1543392692866908163');
  assert.equal(roles[65].id, '1543392782050263130');
  assert.equal(roles[11].id, null);
});
