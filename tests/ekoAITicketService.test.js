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

test('processOpenTickets does not spam when ticket already offered escalation or intervened', async () => {
  const Ticket = require('../models/Ticket');
  const testTicketId = 'TK-ANTI-SPAM-001';
  const channelId = 'ch-anti-spam-001';

  // Ticket oluştur
  const ticketDoc = new Ticket({
    ticketId: testTicketId,
    channelId,
    status: 'open',
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 dakika önce açılmış
    subject: 'Reklam Talebi (YK Türk Asker Oyunu)',
    category: 'reklam'
  });
  await ticketDoc.save();

  // State'e daha önce teklif yapılmış olarak kaydet
  ekoAITicketService.ticketInterventions.set(testTicketId, {
    ticketId: testTicketId,
    stage: 'offered_escalation',
    attempts: 1,
    lastInterventionAt: new Date(Date.now() - 6 * 60 * 1000).toISOString() // 6 dk önce (5 dk sınırını geçmiş)
  });

  let messageSentCount = 0;
  const mockClient = {
    isReady: () => true,
    user: { id: 'bot-123' },
    channels: {
      fetch: async () => ({
        id: channelId,
        messages: {
          fetch: async () => []
        },
        send: async () => {
          messageSentCount++;
          return { id: 'msg-spam' };
        }
      })
    }
  };

  await ekoAITicketService.processOpenTickets(mockClient);

  // Zaten offered_escalation aşamasında olduğu için KESİNLİKLE mesaj atılmamalı
  assert.equal(messageSentCount, 0, 'Bot must not send duplicate spam when escalation is already offered');

  // Şimdi stage'i sıfırlayalım ama kanala önceden EKOai mesajı atılmış yapalım
  ekoAITicketService.ticketInterventions.delete(testTicketId);
  ticketDoc.ekoaiIntervened = false;
  await ticketDoc.save();

  const mockClientWithExistingMsg = {
    isReady: () => true,
    user: { id: 'bot-123' },
    channels: {
      fetch: async () => ({
        id: channelId,
        messages: {
          fetch: async () => [
            {
              author: { id: 'bot-123' },
              content: '### 🤖 EKOai — Destek Asistanı\nTicketiniz uzun zamandır açık...',
              components: []
            }
          ]
        },
        send: async () => {
          messageSentCount++;
          return { id: 'msg-spam-2' };
        }
      })
    }
  };

  await ekoAITicketService.processOpenTickets(mockClientWithExistingMsg);

  // Kanalda zaten EKOai mesajı olduğu için dedup mekanizması tetiklenmeli ve mesaj atılmamalı
  assert.equal(messageSentCount, 0, 'Bot must not send duplicate message if channel already has an EKOai message');

  // Temizlik
  const { tickets } = require('../models/Store');
  tickets.deleteOne({ ticketId: testTicketId });
  ekoAITicketService.ticketInterventions.delete(testTicketId);
});

test('isEkoAIMessage and Components V2 dedup correctly detects nested components and cleans duplicates', async () => {
  const v2Msg = {
    author: { id: 'bot-123' },
    content: '', // V2'de content boş olur
    components: [
      {
        type: 17, // Container
        components: [
          {
            type: 10, // TextDisplay
            content: '### 🤖 EKOai — Destek Asistanı\nTicketiniz uzun zamandır açık...'
          },
          {
            type: 1, // ActionRow
            components: [
              {
                type: 2, // Button
                customId: 'ekoai_connect_telegram_TK-TEST-V2',
                label: "👑 Yönetim Kurulu Başkanı'na Bağla"
              }
            ]
          }
        ]
      }
    ]
  };

  assert.equal(ekoAITicketService.isEkoAIMessage(v2Msg, 'bot-123'), true);

  // Duplicate silme testi
  let deletedMsgCount = 0;
  const oldMsg1 = { ...v2Msg, delete: async () => { deletedMsgCount++; } };
  const oldMsg2 = { ...v2Msg, delete: async () => { deletedMsgCount++; } };
  const latestMsg = { ...v2Msg, delete: async () => { deletedMsgCount++; } };

  const testTicketId = 'TK-DEDUP-V2';
  const channelId = 'chan-dedup-v2';
  const Ticket = require('../models/Ticket');
  const ticketDoc = new Ticket({
    ticketId: testTicketId,
    channelId,
    status: 'open',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    subject: 'Genel Yardım',
    category: 'other'
  });
  await ticketDoc.save();

  let sentCount = 0;
  const mockClient = {
    isReady: () => true,
    user: { id: 'bot-123' },
    channels: {
      fetch: async () => ({
        id: channelId,
        messages: {
          fetch: async () => [latestMsg, oldMsg1, oldMsg2] // En yeni ilk eleman
        },
        send: async () => { sentCount++; }
      })
    }
  };

  await ekoAITicketService.processOpenTickets(mockClient);

  assert.equal(sentCount, 0, 'No new messages sent because duplicate V2 messages exist');
  assert.equal(deletedMsgCount, 2, 'Two older duplicate messages should be deleted to prevent spam clutter');

  // Temizlik
  const { tickets } = require('../models/Store');
  tickets.deleteOne({ ticketId: testTicketId });
  ekoAITicketService.ticketInterventions.delete(testTicketId);
});

test('saveState and loadState correctly preserve ticketId in interventions', () => {
  const tId = 'TK-PERSIST-999';
  ekoAITicketService.ticketInterventions.set(tId, {
    ticketId: tId,
    stage: 'offered_escalation',
    attempts: 1,
    lastInterventionAt: new Date().toISOString()
  });

  ekoAITicketService.saveState();
  ekoAITicketService.ticketInterventions.clear();

  assert.equal(ekoAITicketService.ticketInterventions.has(tId), false);

  ekoAITicketService.loadState();
  assert.equal(ekoAITicketService.ticketInterventions.has(tId), true);
  const loaded = ekoAITicketService.ticketInterventions.get(tId);
  assert.equal(loaded.ticketId, tId);
  assert.equal(loaded.stage, 'offered_escalation');

  // Temizlik
  ekoAITicketService.ticketInterventions.delete(tId);
  ekoAITicketService.saveState();
});



