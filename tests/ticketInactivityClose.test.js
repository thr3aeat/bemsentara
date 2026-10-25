'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// Discord istemcisini ticketCleanup yüklenmeden önce taklit et
let mockClient = null;
const discordClientPath = require.resolve('../bot/discordClient');
require.cache[discordClientPath] = {
  id: discordClientPath,
  filename: discordClientPath,
  loaded: true,
  exports: { getDiscordClient: () => mockClient },
};

const { runInactivityCheck } = require('../bot/services/ticketCleanup');
const Ticket = require('../models/Ticket');
const { tickets } = require('../models/Store');

const CLOSE_DELAY_MS = 5 * 60 * 1000;

test('inactivity warning closes the ticket after 5 minutes and is not repeated', async () => {
  const ticketId = 'TK-INACT-CLOSE-1';
  await new Ticket({ ticketId, channelId: 'ch-inact-1', userId: 'owner-1', guildId: 'g-inact', status: 'open' }).save();

  const staffReply = {
    id: 'staff-msg',
    author: { id: 'staff-1', bot: false },
    createdTimestamp: Date.now() - 2 * 60 * 60 * 1000,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  };
  const sent = [];
  const channel = {
    id: 'ch-inact-1',
    parentId: 'open-cat',
    isTextBased: () => true,
    messages: { fetch: async () => new Map([[staffReply.id, staffReply]]) },
    send: async (content) => { sent.push(content); return {}; },
    setParent: async () => {},
    permissionOverwrites: { edit: async () => {} },
  };
  const guild = {
    channels: { fetch: async () => channel, cache: { find: () => ({ id: 'closed-cat' }) } },
    roles: { everyone: { id: 'everyone' } },
  };
  channel.guild = guild;
  mockClient = {
    isReady: () => true,
    guilds: { fetch: async () => guild },
    users: { fetch: async () => ({ send: async () => {} }) },
  };

  const closeCallbacks = [];
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (fn, ms, ...args) => {
    if (ms === CLOSE_DELAY_MS) {
      closeCallbacks.push(fn);
      return { fake: true };
    }
    return originalSetTimeout(fn, ms, ...args);
  };

  try {
    await runInactivityCheck();
    await runInactivityCheck(); // Kapatma zamanlayıcısı beklerken tekrar uyarmamalı

    const warnings = sent.filter(s => typeof s === 'string' && s.includes('yanıt bekleniyor'));
    assert.equal(warnings.length, 1);
    assert.equal(closeCallbacks.length, 1);

    closeCallbacks[0]();
    for (let i = 0; i < 50; i++) {
      if (tickets.findOne({ ticketId })?.status === 'closed') break;
      await new Promise(r => setImmediate(r));
    }

    const closed = tickets.findOne({ ticketId });
    assert.equal(closed.status, 'closed');
    assert.equal(closed.closedBy, 'system');
    assert.ok(sent.some(s => typeof s === 'string' && s.includes('inaktivite nedeniyle kapatıldı')));

    await runInactivityCheck();
    assert.equal(sent.filter(s => typeof s === 'string' && s.includes('yanıt bekleniyor')).length, 1);
  } finally {
    global.setTimeout = originalSetTimeout;
    tickets.deleteOne({ ticketId });
  }
});
