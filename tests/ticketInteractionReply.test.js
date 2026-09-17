'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { deferTicketReply, replyToTicketInteraction } = require('../bot/services/ticketInteractionReply');

test('deferred ticket interactions are completed with editReply instead of remaining pending', async () => {
  const calls = [];
  const interaction = {
    deferred: false,
    replied: false,
    deferReply: async (payload) => { calls.push(['defer', payload]); interaction.deferred = true; },
    editReply: async (payload) => { calls.push(['edit', payload]); },
    reply: async () => { throw new Error('reply should not be used after defer'); },
  };

  await deferTicketReply(interaction);
  await replyToTicketInteraction(interaction, { content: 'Ticket oluşturuldu.' });

  assert.deepEqual(calls, [
    ['defer', { ephemeral: true }],
    ['edit', { content: 'Ticket oluşturuldu.' }],
  ]);
});
