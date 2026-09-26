'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  sendThanksMessage,
  getDynamicThanksMembers,
  setupThanksAutoUpdater,
  SUPPORTERS_LIST,
  THANKS_CHANNEL_ID
} = require('../bot/services/thanksService');

test('thanksService: exports and structure test', async () => {
  assert.strictEqual(typeof sendThanksMessage, 'function');
  assert.strictEqual(typeof getDynamicThanksMembers, 'function');
  assert.strictEqual(typeof setupThanksAutoUpdater, 'function');
  assert.strictEqual(THANKS_CHANNEL_ID, '1535336359579885629');
  assert.ok(Array.isArray(SUPPORTERS_LIST));
  assert.ok(SUPPORTERS_LIST.includes('gizemliabe ve TEF ordusu'));
  assert.ok(SUPPORTERS_LIST.includes('Ceasar İmpreius ve Order of İmperius'));
  assert.ok(SUPPORTERS_LIST.includes('funter'));
  assert.ok(SUPPORTERS_LIST.includes('lejyon'));
});

test('thanksService: getDynamicThanksMembers handles empty/mock guild without crashing', async () => {
  const mockGuild = {
    id: '1367646464804655104',
    ownerId: '1031620522406072350',
    members: {
      fetch: async () => {},
      cache: new Map([
        ['1031620522406072350', { id: '1031620522406072350', user: { username: 'owner_user', bot: false }, joinedTimestamp: 100 }],
        ['bot1', { id: 'bot1', user: { username: 'some_bot', bot: true }, joinedTimestamp: 200 }],
        ['user1', { id: 'user1', user: { username: 'oldest_user1', bot: false }, joinedTimestamp: 300 }],
        ['user2', { id: 'user2', user: { username: 'oldest_user2', bot: false }, joinedTimestamp: 400 }],
        ['user3', { id: 'user3', user: { username: 'oldest_user3', bot: false }, joinedTimestamp: 500 }],
        ['user4', { id: 'user4', user: { username: 'newest_user4', bot: false }, joinedTimestamp: 600 }]
      ])
    }
  };

  const { oldestMembers, mostActiveMember } = await getDynamicThanksMembers(mockGuild);
  assert.strictEqual(oldestMembers.length, 3);
  assert.strictEqual(oldestMembers[0].user.username, 'oldest_user1');
  assert.strictEqual(oldestMembers[1].user.username, 'oldest_user2');
  assert.strictEqual(oldestMembers[2].user.username, 'oldest_user3');
  // Neither owner nor bot should be in oldestMembers
  assert.ok(!oldestMembers.some(m => m.user.bot || m.id === mockGuild.ownerId));
});
