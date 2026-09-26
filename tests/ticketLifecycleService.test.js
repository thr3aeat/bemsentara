'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketLifecycle, sendTicketPanels } = require('../bot/services/ticketLifecycleService');
const { MessageFlags } = require('discord.js');

function createTicketFactory(events) {
  return function Ticket(data) {
    return {
      ...data,
      save: async function save() {
        events.push({ type: 'save', state: this.deliveryState, channelId: this.channelId || null });
        return this;
      }
    };
  };
}

test('ticket lifecycle persists the record before creating a Discord channel', async () => {
  const events = [];
  const ticket = await createTicketLifecycle(
    { ticketId: 'EY-LIFE-1', userId: '1', category: 'technical', subject: 'Test', description: 'Açıklama' },
    {
      Ticket: createTicketFactory(events),
      createChannel: async () => { events.push({ type: 'channel' }); return { id: 'channel-1', guild: { id: 'guild-1' }, send: async () => ({ id: 'message-1' }) }; },
      buildPanels: () => [{ embeds: [], components: [] }]
    }
  );

  assert.equal(events[0].type, 'save');
  assert.equal(events[1].type, 'channel');
  assert.equal(ticket.deliveryState, 'delivered');
  assert.equal(ticket.channelId, 'channel-1');
});

test('ticket lifecycle keeps a retryable record and logs panel failures', async () => {
  const logs = [];
  const ticket = await createTicketLifecycle(
    { ticketId: 'EY-LIFE-2', userId: '2', category: 'technical', subject: 'Test', description: 'Açıklama' },
    {
      Ticket: createTicketFactory([]),
      createChannel: async () => ({ id: 'channel-2', guild: { id: 'guild-2' }, send: async () => { throw new Error('Missing Permissions'); } }),
      buildPanels: () => [{ embeds: [], components: [] }],
      logError: (entry) => logs.push(entry)
    }
  );

  assert.equal(ticket.deliveryState, 'pending_retry');
  assert.match(ticket.deliveryError, /Missing Permissions/);
  assert.match(logs[0], /TICKET_PANEL_SEND_FAILED/);
  assert.match(logs[0], /EY-LIFE-2/);
});

test('ticket delivery falls back to one classic combined panel when Discord rejects Components V2', async () => {
  const attempts = [];
  const delivered = [];
  const ticket = {
    ticketId: 'EY-LIFE-3',
    userId: '3',
    category: 'technical',
    subject: 'Test',
    description: 'Açıklama',
    save: async () => {},
  };

  await sendTicketPanels(ticket, {
    send: async (payload) => {
      attempts.push(payload);
      if (payload.flags === MessageFlags.IsComponentsV2) {
        throw new Error('Invalid Form Body: Components V2 rejected');
      }
      delivered.push(payload);
      return { id: `message-${delivered.length}` };
    },
  });

  assert.equal(attempts.length, 2);
  assert.equal(delivered.length, 1);
  assert.ok(delivered[0].embeds?.length);
  const fallbackButtons = delivered[0].components.flatMap((row) => row.components);
  assert.ok(fallbackButtons.some((button) => button.data.custom_id === 'ticket_owner_info_EY-LIFE-3'));
  assert.ok(fallbackButtons.some((button) => button.data.custom_id === 'claim_ticket_EY-LIFE-3'));
  assert.equal(ticket.deliveryState, 'delivered');
  assert.match(ticket.deliveryWarning, /Components V2 rejected/);
});

test('default ticket delivery sends one opening message and stores only its id', async () => {
  const sent = [];
  const ticket = {
    ticketId: 'EY-LIFE-4',
    userId: '4',
    category: 'technical',
    subject: 'Test',
    description: 'Açıklama',
    save: async () => {},
  };

  await sendTicketPanels(ticket, {
    send: async (payload) => {
      sent.push(payload);
      return { id: 'message-combined' };
    },
  });

  assert.equal(sent.length, 1);
  assert.equal(ticket.panelMessageId, 'message-combined');
  assert.equal(ticket.staffPanelMessageId, null);
});
