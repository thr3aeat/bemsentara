'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags } = require('discord.js');

const { resolveTicketGuide } = require('../bot/services/ticketGuideResolver');
const { buildTicketUserPanel, buildTicketStaffPanel } = require('../bot/services/ticketPanelService');

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

test('ticket staff panel is a Components V2 control desk with existing action ids', () => {
  const panel = buildTicketStaffPanel(ticket);
  const container = panel.components[0];
  const buttons = container.components
    .filter((component) => component.type === 1)
    .flatMap((row) => row.components);

  assert.equal(panel.flags, MessageFlags.IsComponentsV2);
  assert.equal(panel.embeds, undefined);
  assert.equal(container.type, 17);
  assert.ok(container.components.some((component) => component.type === 10 && component.content.includes('Yetkili Hızlı Eylem Masası')));
  assert.ok(buttons.some((button) => button.custom_id === 'claim_ticket_EY-TEST-1'));
  assert.ok(buttons.some((button) => button.custom_id === 'close_ticket_EY-TEST-1'));
  assert.ok(buttons.some((button) => button.custom_id === 'ticket_save_transcript_EY-TEST-1'));
});
