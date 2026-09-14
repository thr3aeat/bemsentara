'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { handleTicketUserPanelAction } = require('../bot/handlers/buttonHandler');

test('ticket owner can request a staff call once and receives a channel confirmation', async () => {
  const updates = [];
  const ticket = { ticketId: 'EY-ACTION-1', userId: 'owner-1', status: 'open', staffCallCount: 0, save: async () => updates.push('saved') };
  const interaction = {
    customId: 'ticket_staff_call_EY-ACTION-1',
    user: { id: 'owner-1' },
    channel: { send: async (payload) => updates.push(payload.content) },
    reply: async (payload) => updates.push(payload.content)
  };

  const handled = await handleTicketUserPanelAction(interaction, { findTicket: async () => ticket, now: () => new Date('2026-09-14T12:00:00Z') });
  assert.equal(handled, true);
  assert.equal(ticket.staffCallCount, 1);
  assert.match(updates.find((value) => /personel çağrısı/i.test(value)), /personel çağrısı/i);
});
