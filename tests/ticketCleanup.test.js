'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { getLatestHumanMessage } = require('../bot/services/ticketCleanup');

test('inactivity checks use the latest human reply when a bot panel is the newest message', () => {
  const staffReply = {
    id: 'staff-reply',
    createdTimestamp: 1_000,
    author: { id: 'staff-1', bot: false },
  };
  const botPanel = {
    id: 'bot-panel',
    createdTimestamp: 2_000,
    author: { id: 'bot-1', bot: true },
  };

  const latestHuman = getLatestHumanMessage(new Map([
    [botPanel.id, botPanel],
    [staffReply.id, staffReply],
  ]));

  assert.equal(latestHuman, staffReply);
});
