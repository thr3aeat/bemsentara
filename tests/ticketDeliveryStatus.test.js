'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildTicketDeliveryResult,
  sortTicketsNewestFirst,
  normaliseComponentRows
} = require('../server/services/ticketDelivery');

test('ticket delivery is queued when the record exists without a Discord channel', () => {
  assert.deepEqual(buildTicketDeliveryResult({ ticketId: 'EKO-1', channelId: null }), {
    deliveryStatus: 'queued',
    deliveryMessage: 'Biletin kaydedildi. Discord destek kanalına teslim edilmesi sıraya alındı.'
  });
});

test('ticket delivery is delivered when a Discord channel was created', () => {
  assert.deepEqual(buildTicketDeliveryResult({ ticketId: 'EKO-2', channelId: '123456789' }), {
    deliveryStatus: 'delivered',
    deliveryMessage: 'Biletin Discord destek ekibine teslim edildi.'
  });
});

test('ticket list is sorted newest first without passing an object to Array.sort', () => {
  const tickets = sortTicketsNewestFirst([
    { ticketId: 'OLD', createdAt: '2026-09-12T10:00:00.000Z' },
    { ticketId: 'NEW', createdAt: '2026-09-14T10:00:00.000Z' }
  ]);
  assert.deepEqual(tickets.map((ticket) => ticket.ticketId), ['NEW', 'OLD']);
});

test('Discord component rows are not wrapped in an invalid nested array', () => {
  const rows = [{ type: 1, components: [] }, { type: 1, components: [] }];
  assert.deepEqual(normaliseComponentRows(rows), rows);
  assert.deepEqual(normaliseComponentRows(rows[0]), [rows[0]]);
});
