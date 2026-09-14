'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveTicketGuide } = require('../bot/services/ticketGuideResolver');
const { buildTicketUserPanel } = require('../bot/services/ticketPanelService');

const ticket = {
  ticketId: 'EY-TEST-1',
  userId: '123456789012345678',
  category: 'ban',
  subject: 'Ceza itirazı',
  createdAt: new Date('2026-09-14T12:00:00Z')
};

test('ticket guide resolver maps support categories to Safety Center articles', () => {
  assert.equal(resolveTicketGuide('ban').slug, 'ceza-ve-itiraz');
  assert.equal(resolveTicketGuide('technical').slug, 'ticket-sorun-giderici');
  assert.equal(resolveTicketGuide('unknown').slug, 'yetkiliyle-iletisim');
});

test('ticket user panel contains five actions with public Safety Center links', () => {
  const panel = buildTicketUserPanel(ticket);
  const buttons = panel.components.flatMap((row) => row.components);

  assert.equal(buttons.length, 5);
  assert.ok(buttons.some((button) => button.data.custom_id === 'ticket_staff_call_EY-TEST-1'));
  assert.ok(buttons.some((button) => button.data.url?.endsWith('/yardim/ceza-ve-itiraz')));
  assert.ok(buttons.some((button) => button.data.url?.includes('/yardim/ceza-ve-itiraz')));
});
