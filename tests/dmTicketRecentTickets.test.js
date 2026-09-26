'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { findRecentTicketsForUser } = require('../bot/services/dmTicket');

test('DM ticket history sorts plain model results newest first and limits them to five', async () => {
  assert.equal(typeof findRecentTicketsForUser, 'function');

  const records = [1, 6, 3, 5, 2, 4].map((day) => ({
    ticketId: `TK-${day}`,
    userId: 'user-1',
    createdAt: new Date(`2026-09-${String(day).padStart(2, '0')}T12:00:00Z`),
  }));

  const result = await findRecentTicketsForUser('user-1', {
    findTickets: async (query) => {
      assert.deepEqual(query, { userId: 'user-1' });
      return records;
    },
  });

  assert.deepEqual(result.map((ticket) => ticket.ticketId), ['TK-6', 'TK-5', 'TK-4', 'TK-3', 'TK-2']);
});
