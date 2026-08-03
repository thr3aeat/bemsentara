'use strict';

const { handleTicketButton } = require('./ticketButtons');
const { handleStaffButton } = require('./staffButtons');
const { handleEconomyButton } = require('./economyButtons');
const { handleCourtButton } = require('./courtButtons');
const { handleRpgButton } = require('./rpgButtons');
const { handleApprovalButton } = require('../../services/robloxApprovalGateway');

/**
 * Modular Button Router — dispatches incoming button customIds to domain sub-handlers
 */
async function routeButtonInteraction(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('rbx_appr_')) {
    const handled = await handleApprovalButton(interaction);
    if (handled) return true;
  }

  if (customId.startsWith('rpg_') || customId.startsWith('buy_prop_') || customId.startsWith('invest_stock_') || customId.startsWith('jury_vote_')) {
    const handled = await handleRpgButton(interaction);
    if (handled) return true;
  }

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

