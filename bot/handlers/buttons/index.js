'use strict';

const { handleTicketButton } = require('./ticketButtons');
const { handleStaffButton } = require('./staffButtons');
const { handleEconomyButton } = require('./economyButtons');
const { handleCourtButton } = require('./courtButtons');

/**
 * Modular Button Router — dispatches incoming button customIds to domain sub-handlers
 */
async function routeButtonInteraction(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('ticket_')) {
    const handled = await handleTicketButton(interaction);
    if (handled) return true;
  }

  if (customId.startsWith('staff_')) {
    const handled = await handleStaffButton(interaction);
    if (handled) return true;
  }

  if (customId.startsWith('eco_')) {
    const handled = await handleEconomyButton(interaction);
    if (handled) return true;
  }

  if (customId.startsWith('court_')) {
    const handled = await handleCourtButton(interaction);
    if (handled) return true;
  }

  return false;
}

module.exports = {
  routeButtonInteraction
};

