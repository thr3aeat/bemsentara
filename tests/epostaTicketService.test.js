'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags } = require('discord.js');

const { sendEkoTicketOpeningPanels } = require('../bot/services/epostaTicketService');

test('EkoYıldız ticket opening sends a user panel and a content-free Components V2 staff panel', async () => {
  const sent = [];
  const ticket = {
    ticketId: 'EY-EPOSTA-1',
    userId: '123456789012345678',
    category: 'kullanici_destek',
    subject: 'Destek gerekiyor',
    description: 'Kanal açıldıktan sonra ilk mesaj görünmelidir.',
    createdAt: new Date('2026-09-17T12:00:00Z'),
    save: async () => {},
  };

  await sendEkoTicketOpeningPanels(ticket, {
    send: async (payload) => {
      sent.push(payload);
      return { id: `message-${sent.length}` };
    },
  });

  assert.equal(sent.length, 2);
  assert.ok(sent[0].embeds?.length);
  assert.equal(sent[1].flags, MessageFlags.IsComponentsV2);
  assert.equal(sent[1].content, undefined);
  assert.equal(sent[1].components[0].type, 17);
});
