'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isAuthorizedBotManager } = require('../server/routes/botControl');

test('isAuthorizedBotManager grants access to 1031620522406072350 and site admins', () => {
  assert.equal(isAuthorizedBotManager({ discordId: '1031620522406072350' }), true);
  assert.equal(isAuthorizedBotManager({ id: '1031620522406072350' }), true);
  assert.equal(isAuthorizedBotManager({ discordId: ' 1031620522406072350 ' }), true);
  assert.equal(isAuthorizedBotManager({ isAdmin: true }), true);
  assert.equal(isAuthorizedBotManager({ roles: ['admin'] }), true);
  assert.equal(isAuthorizedBotManager({ discordId: '999999999999', isAdmin: false }), false);
  assert.equal(isAuthorizedBotManager({ discordId: '1031620522406072350', isBanned: true }), false);
  assert.equal(isAuthorizedBotManager(null), false);
});
