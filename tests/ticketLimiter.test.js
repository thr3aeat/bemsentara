'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const Ticket = require('../models/Ticket');
const { canUserOpenTicket } = require('../bot/services/ticketLimiter');

test('archived ticket channels do not count as an active ticket', async () => {
  const originalFind = Ticket.find;
  let saved = false;
  const archivedTicket = {
    ticketId: 'EY-ARCHIVE-1',
    userId: 'user-1',
    status: 'open',
    channelId: 'ticket-channel',
    save: async () => { saved = true; },
  };
  const archiveCategory = { id: 'archive-category', name: '🗂️ Ticket Arşivi' };
  const archivedChannel = {
    id: 'ticket-channel',
    name: 'ticket-ey-archive-1',
    parentId: archiveCategory.id,
    type: 0,
    permissionOverwrites: {
      cache: new Map([['user-1', { allow: { has: () => true } }]]),
    },
  };
  const cache = new Map([
    [archiveCategory.id, archiveCategory],
    [archivedChannel.id, archivedChannel],
  ]);
  const guild = {
    id: 'guild-1',
    channels: {
      cache,
      fetch: async (id) => cache.get(id) || null,
    },
  };

  Ticket.find = async () => [archivedTicket];
  try {
    const result = await canUserOpenTicket({ id: 'user-1', username: 'Eko' }, guild);

    assert.equal(result.allowed, true);
    assert.equal(archivedTicket.status, 'closed');
    assert.equal(saved, true);
  } finally {
    Ticket.find = originalFind;
  }
});
