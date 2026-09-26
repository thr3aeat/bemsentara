'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags } = require('discord.js');

const { sendEkoTicketOpeningPanels, archiveEkoYildizTicket } = require('../bot/services/epostaTicketService');

test('EkoYıldız ticket opening sends one content-free Components V2 panel with separated actions', async () => {
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

  assert.equal(sent.length, 1);
  assert.equal(sent[0].flags, MessageFlags.IsComponentsV2);
  assert.equal(sent[0].content, undefined);
  assert.equal(sent[0].components[0].type, 17);
  const textBlocks = sent[0].components[0].components.filter((component) => component.type === 10);
  assert.ok(textBlocks.some((component) => component.content.includes('Kullanıcı İşlemleri')));
  assert.ok(textBlocks.some((component) => component.content.includes('Yetkili İşlemleri')));
});

test('closing a ticket keeps its owner able to view, read and write without replacing other overwrites', async () => {
  const permissionCalls = [];
  const channel = {
    setParent: async () => {},
    send: async () => {},
    permissionOverwrites: {
      edit: async (targetId, permissions) => permissionCalls.push({ targetId, permissions }),
      set: async () => permissionCalls.push({ destructiveSet: true }),
    },
  };
  const guild = { channels: { fetch: async () => channel } };
  const ticket = {
    ticketId: 'EY-EPOSTA-2',
    userId: 'owner-2',
    guildId: 'guild-2',
    channelId: 'channel-2',
    subject: 'Kapanış testi',
    save: async () => {},
  };
  const interaction = {
    user: { id: 'staff-1', username: 'Yetkili' },
    client: {
      guilds: { fetch: async () => guild },
      users: { fetch: async () => null },
    },
  };

  await archiveEkoYildizTicket(ticket, interaction, 'Çözüldü');

  assert.equal(permissionCalls.some((call) => call.destructiveSet), false);
  assert.deepEqual(permissionCalls, [{
    targetId: 'owner-2',
    permissions: {
      ViewChannel: true,
      ReadMessageHistory: true,
      SendMessages: true,
      AttachFiles: true,
      EmbedLinks: true,
    },
  }]);
  assert.equal(ticket.status, 'closed');
});
