'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// Telegram gönderimlerini yakalamak için telegramService'i servis yüklenmeden önce taklit et
const alerts = [];
const telegramPath = require.resolve('../bot/services/telegramService');
require.cache[telegramPath] = {
  id: telegramPath,
  filename: telegramPath,
  loaded: true,
  exports: { sendTelegramAlert: async (text) => { alerts.push(text); return true; } },
};

const ekoAITicketService = require('../bot/services/ekoAITicketService');
const Ticket = require('../models/Ticket');
const { tickets } = require('../models/Store');

function makeClient(sent) {
  return {
    channels: {
      fetch: async (id) => ({
        id,
        name: 'ticket-tk-bridge-1',
        send: async (payload) => { sent.push(payload); return { id: 'm' }; },
      }),
    },
  };
}

async function createTicket(data) {
  const doc = new Ticket({ channelId: 'ch-bridge-1', userId: '111222333444555666', subject: 'Rütbe', ...data });
  await doc.save();
  return doc;
}

test('plain Telegram messages without a ticket id go to normal EKOai chat, not to a random ticket', async () => {
  await createTicket({ ticketId: 'TK-BRIDGE-PLAIN', status: 'open' });
  const sent = [];

  const handled = await ekoAITicketService.handleEkoTelegramBridge(makeClient(sent), 'sunucu durumu nasıl?', { chat: { id: 1 } });

  assert.equal(handled, false);
  assert.equal(sent.length, 0);
  tickets.deleteOne({ ticketId: 'TK-BRIDGE-PLAIN' });
});

test('replying to a ticket alert forwards Eko\'s text verbatim with a user mention', async () => {
  await createTicket({ ticketId: 'TK-BRIDGE-1', status: 'open' });
  const sent = [];
  alerts.length = 0;

  const handled = await ekoAITicketService.handleEkoTelegramBridge(
    makeClient(sent),
    'Dekontu buraya at\nkontrol edeceğim',
    { chat: { id: 1 }, reply_to_message: { text: 'Bilet ID: #TK-BRIDGE-1' } }
  );

  assert.equal(handled, true);
  assert.equal(sent.length, 1);
  const text = sent[0].components[0].components[0].content;
  assert.ok(text.includes('<@111222333444555666>'));
  assert.ok(text.includes('> Dekontu buraya at\n> kontrol edeceğim'));
  assert.deepEqual(sent[0].allowedMentions, { users: ['111222333444555666'] });
  assert.ok(alerts.some(a => a.includes('İletildi')));
  tickets.deleteOne({ ticketId: 'TK-BRIDGE-1' });
});

test('ticket id written in the message is stripped from the forwarded text', async () => {
  await createTicket({ ticketId: 'TK-BRIDGE-2', status: 'open' });
  const sent = [];

  await ekoAITicketService.handleEkoTelegramBridge(makeClient(sent), '#TK-BRIDGE-2: yetkililer ilgilenecek', { chat: { id: 1 } });

  const text = sent[0].components[0].components[0].content;
  assert.ok(text.includes('> yetkililer ilgilenecek'));
  assert.ok(!text.includes('TK-BRIDGE-2'));
  tickets.deleteOne({ ticketId: 'TK-BRIDGE-2' });
});

test('messages to a closed ticket are not forwarded and the escalation is cleared', async () => {
  await createTicket({ ticketId: 'TK-BRIDGE-3', status: 'closed' });
  ekoAITicketService.activeEscalations.set('TK-BRIDGE-3', { ticketId: 'TK-BRIDGE-3', escalatedAt: new Date().toISOString() });
  const sent = [];
  alerts.length = 0;

  const handled = await ekoAITicketService.handleEkoTelegramBridge(makeClient(sent), 'TK-BRIDGE-3 tamam', { chat: { id: 1 } });

  assert.equal(handled, true);
  assert.equal(sent.length, 0);
  assert.equal(ekoAITicketService.activeEscalations.has('TK-BRIDGE-3'), false);
  assert.ok(alerts.some(a => a.includes('kapatılmış')));
  tickets.deleteOne({ ticketId: 'TK-BRIDGE-3' });
});

test('escalation alert escapes user-provided HTML so Telegram does not reject it', async () => {
  alerts.length = 0;
  const channel = { id: 'ch-esc', name: 'ticket-tk-esc', guild: { id: 'g' }, send: async () => ({}) };

  await ekoAITicketService.escalateToEkoTelegram(
    { ticketId: 'TK-ESC-1', userId: '1', userName: 'a<b>', subject: 'x & y' },
    channel,
    {},
    '<script>'
  );

  const html = alerts[0];
  assert.ok(html.includes('a&lt;b&gt;'));
  assert.ok(html.includes('x &amp; y'));
  assert.ok(html.includes('&lt;script&gt;'));
  ekoAITicketService.clearEscalation('TK-ESC-1');
});

test('ticket channel messages only escalate on explicit requests and respect the cooldown', async () => {
  await createTicket({ ticketId: 'TK-BRIDGE-4', channelId: 'ch-bridge-4', status: 'open' });
  alerts.length = 0;
  const channel = { id: 'ch-bridge-4', name: 'ticket-tk-bridge-4', guild: { id: 'g' }, send: async () => ({}) };
  const msg = (content) => ({ guild: {}, author: { bot: false }, channel, content });

  await ekoAITicketService.handleTicketChannelMessage(msg('ekonomi sistemi bozuk'), {});
  assert.equal(alerts.length, 0);

  await ekoAITicketService.handleTicketChannelMessage(msg('başkana bağlayın lütfen'), {});
  assert.equal(alerts.length, 1);

  await ekoAITicketService.handleTicketChannelMessage(msg('eko neredesin'), {});
  assert.equal(alerts.length, 1, 'second request within cooldown must not re-alert');

  ekoAITicketService.clearEscalation('TK-BRIDGE-4');
  ekoAITicketService.ticketInterventions.delete('TK-BRIDGE-4');
  ekoAITicketService.saveState();
  tickets.deleteOne({ ticketId: 'TK-BRIDGE-4' });
});
