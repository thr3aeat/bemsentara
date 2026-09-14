'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { handleTicketButton } = require('../bot/handlers/buttons/ticketButtons');

test('category ticket button opens the existing support modal flow', async () => {
  let shownModal;
  await handleTicketButton({
    customId: 'ticket_create_technical',
    showModal: async (modal) => { shownModal = modal; }
  });

  const modal = shownModal.toJSON();
  assert.equal(modal.custom_id, 'support_modal_technical');
  assert.equal(modal.components.length, 2);
  assert.equal(modal.components[0].components[0].custom_id, 'support_subject');
  assert.equal(modal.components[1].components[0].custom_id, 'support_description');
});
