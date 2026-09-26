'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { handleTicketUserPanelAction, handleTicketStaffActionAuthorization } = require('../bot/handlers/buttonHandler');

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

test('ticket owner info action uses an id distinct from the staff user-record action', async () => {
  const replies = [];
  const ticket = { ticketId: 'EY-ACTION-2', userId: 'owner-2', status: 'open', category: 'technical', createdAt: new Date('2026-09-14T12:00:00Z') };
  const interaction = {
    customId: 'ticket_owner_info_EY-ACTION-2',
    user: { id: 'owner-2' },
    reply: async (payload) => replies.push(payload.content),
  };

  const handled = await handleTicketUserPanelAction(interaction, { findTicket: async () => ticket });

  assert.equal(handled, true);
  assert.match(replies[0], /EY-ACTION-2/);
  assert.match(replies[0], /technical/);
});

test('every staff panel action rejects ticket owners without staff permission', async () => {
  assert.equal(typeof handleTicketStaffActionAuthorization, 'function');
  const staffActionIds = [
    'close_ticket_EY-SEC-1',
    'claim_ticket_EY-SEC-1',
    'ticket_notify_user_EY-SEC-1',
    'ticket_ai_dispute_EY-SEC-1',
    'ticket_user_info_EY-SEC-1',
    'ticket_add_note_EY-SEC-1',
    'ticket_save_transcript_EY-SEC-1',
    'ticket_toggle_slowmode_EY-SEC-1',
    'ticket_add_user_prompt_EY-SEC-1',
    'ticket_change_priority_EY-SEC-1',
    'ticket_change_category_EY-SEC-1',
    'ticket_lock_chat_EY-SEC-1',
  ];

  for (const customId of staffActionIds) {
    const replies = [];
    const blocked = await handleTicketStaffActionAuthorization({
      customId,
      member: { permissions: { has: () => false } },
      reply: async (payload) => replies.push(payload),
    });

    assert.equal(blocked, true, customId);
    assert.match(replies[0].content, /yetkili/i, customId);
    assert.equal(replies[0].ephemeral, true, customId);
  }
});
