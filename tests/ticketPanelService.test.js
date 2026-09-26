'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags } = require('discord.js');

const { resolveTicketGuide } = require('../bot/services/ticketGuideResolver');
const { buildTicketPanel, buildTicketPanelForMessage } = require('../bot/services/ticketPanelService');

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

test('ticket opening panel separates owner and staff actions in one Components V2 message', () => {
  assert.equal(typeof buildTicketPanel, 'function');
  const panel = buildTicketPanel(ticket);
  const container = panel.components[0];
  const buttons = container.components
    .filter((component) => component.type === 1)
    .flatMap((row) => row.components);

  assert.equal(panel.flags, MessageFlags.IsComponentsV2);
  assert.equal(panel.embeds, undefined);
  assert.equal(container.type, 17);
  assert.ok(container.components.some((component) => component.type === 10 && component.content.includes('Kullanıcı İşlemleri')));
  assert.ok(container.components.some((component) => component.type === 10 && component.content.includes('Yetkili İşlemleri')));
  assert.ok(buttons.some((button) => button.custom_id === 'ticket_owner_info_EY-TEST-1'));
  assert.ok(buttons.some((button) => button.custom_id === 'ticket_staff_call_EY-TEST-1'));
  assert.ok(buttons.some((button) => button.custom_id === 'claim_ticket_EY-TEST-1'));
  assert.ok(buttons.some((button) => button.custom_id === 'close_ticket_EY-TEST-1'));
  assert.ok(buttons.some((button) => button.custom_id === 'ticket_save_transcript_EY-TEST-1'));
  assert.equal(buttons.filter((button) => button.url?.endsWith('/yardim/ceza-ve-itiraz')).length, 1);
});

test('claimed ticket rebuild disables the claim action in a Components V2 message', () => {
  assert.equal(typeof buildTicketPanelForMessage, 'function');
  const panel = buildTicketPanelForMessage(
    { ...ticket, claimedBy: 'staff-1', claimedByName: 'Yetkili' },
    { flags: { has: () => true } },
  );
  const buttons = panel.components[0].components
    .filter((component) => component.type === 1)
    .flatMap((row) => row.components);
  const claimButton = buttons.find((button) => button.custom_id === 'claimed_ticket_disabled_EY-TEST-1');

  assert.ok(claimButton);
  assert.equal(claimButton.disabled, true);
  assert.match(claimButton.label, /Yetkili/);
});
