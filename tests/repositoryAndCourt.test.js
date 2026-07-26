'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { generateTicketSummary } = require('../bot/services/ticket/TicketSummaryAI');
const { UserRepository, StaffRepository, TicketRepository } = require('../repositories');
const { routeButtonInteraction } = require('../bot/handlers/buttons');

test('TicketSummaryAI handles empty messages gracefully', async () => {
  const summary = await generateTicketSummary('ticket123', []);
  assert.equal(summary, 'Bilet içerisinde yeterli mesaj içeriği bulunmuyor.');
});

test('Repositories export expected data methods', () => {
  assert.ok(typeof UserRepository.findByDiscordId === 'function');
  assert.ok(typeof StaffRepository.findByUserId === 'function');
  assert.ok(typeof TicketRepository.findByTicketId === 'function');
});

test('Modular Button Router dispatches court buttons correctly', async () => {
  let modalShown = false;
  const fakeInteraction = {
    customId: 'court_statement_DAVA-1001',
    user: { id: `user_${Date.now()}` },
    showModal: async (modal) => {
      modalShown = true;
      return modal;
    }
  };

  const handled = await routeButtonInteraction(fakeInteraction);
  assert.equal(handled, true);
  assert.equal(modalShown, true);
});
