'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ekoAITicketService = require('../bot/services/ekoAITicketService');
const ComponentsV2Factory = require('../bot/utils/componentsV2Factory');

test('ComponentsV2Factory container without color has no accent_color', () => {
  const container = ComponentsV2Factory.container([
    ComponentsV2Factory.text('Test Content')
  ]);

  assert.equal(container.type, 17);
  assert.equal(container.accent_color, undefined, 'Container must be accent colorsuz');
  assert.equal(container.components.length, 1);
});

test('evaluateTicketWithAI returns structured judgment', async () => {
  const mockTicket = {
    ticketId: 'TK-TEST-001',
    subject: 'Yetkili alımları nereden yapılıyor?',
    description: 'Yetkili olmak istiyorum form nerede',
    category: 'genel'
  };

  const res = await ekoAITicketService.evaluateTicketWithAI(mockTicket);
  assert.ok(typeof res === 'object');
  assert.ok('canSolveEasily' in res);
});

test('escalateToEkoTelegram records active escalation and sends V2 accent-colorsuz message', async () => {
  let discordSentPayload = null;
  const mockChannel = {
    id: '123456789012345678',
    name: 'ticket-TK-TEST-002',
    guild: { id: '987654321098765432' },
    send: async (payload) => {
      discordSentPayload = payload;
      return { id: 'msg-001' };
    }
  };

  const mockTicket = {
    ticketId: 'TK-TEST-002',
    userId: '1031620522406072350',
    userName: 'Alp',
    subject: 'Robux ödemesi ile ilgili uyuşmazlık',
    description: '3 gündür bekleniyor'
  };

  await ekoAITicketService.escalateToEkoTelegram(mockTicket, mockChannel, {}, 'Kullanıcı acil yardım istiyor.');

  const latest = ekoAITicketService.getLatestEscalatedTicket();
  assert.ok(latest);
  assert.equal(latest.ticketId, 'TK-TEST-002');

  assert.ok(discordSentPayload);
  assert.equal(discordSentPayload.flags, ComponentsV2Factory.FLAGS);
  assert.equal(discordSentPayload.components[0].type, 17); // Container
  assert.equal(discordSentPayload.components[0].accent_color, undefined, 'Must have no accent color');
});

test('handleEkoTelegramBridge forwards directive from Eko to Discord ticket with Components V2', async () => {
  let channelMessage = null;
  const mockClient = {
    channels: {
      fetch: async (channelId) => {
        return {
          id: channelId,
          name: 'ticket-TK-TEST-002',
          send: async (payload) => {
            channelMessage = payload;
            return { id: 'msg-002' };
          }
        };
      }
    }
  };

  const handled = await ekoAITicketService.handleEkoTelegramBridge(
    mockClient,
    'Kullanıcıya iletin, dekontu inceledim ve işlemi onayladım.',
    { chat: { id: 8683506546 } }
  );

  assert.equal(handled, true);
  assert.ok(channelMessage);
  assert.equal(channelMessage.flags, ComponentsV2Factory.FLAGS);
  assert.equal(channelMessage.components[0].type, 17);
  assert.equal(channelMessage.components[0].accent_color, undefined, 'Must be accent colorsuz');
});
