'use strict';

const { handleTicketButton } = require('./ticketButtons');
const { handleStaffButton } = require('./staffButtons');
const { handleEconomyButton } = require('./economyButtons');
const { handleCourtButton } = require('./courtButtons');
const { handleRpgButton } = require('./rpgButtons');
const { handleApprovalButton } = require('../../services/robloxApprovalGateway');
const { handleModApprovalButton } = require('../../services/modApprovalGateway');

/**
 * Modular Button Router — dispatches incoming button customIds to domain sub-handlers
 */
async function routeButtonInteraction(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('btn_leave_')) {
    const StaffLeaveService = require('../../services/staffLeaveService');
    if (customId.startsWith('btn_leave_approve_')) {
      const leaveId = customId.replace('btn_leave_approve_', '');
      await StaffLeaveService.handleApprovalButton(interaction, leaveId, true);
      return true;
    }
    if (customId.startsWith('btn_leave_reject_')) {
      const leaveId = customId.replace('btn_leave_reject_', '');
      await StaffLeaveService.handleApprovalButton(interaction, leaveId, false);
      return true;
    }
    if (customId === 'btn_leave_request_modal') {
      const modal = StaffLeaveService.createLeaveRequestModal();
      await interaction.showModal(modal);
      return true;
    }
  }

  if (customId.startsWith('btn_duty_') || customId.startsWith('staff_duty_')) {
    const { handleDutyButton } = require('../../services/staffDutyService');
    await handleDutyButton(interaction);
    return true;
  }

  if (customId.startsWith('btn_security_')) {
    const AltRaidGuardService = require('../../services/security/altRaidGuardService');
    if (customId.startsWith('btn_security_release_')) {
      const targetId = customId.replace('btn_security_release_', '');
      await AltRaidGuardService.handleSecurityButton(interaction, 'release', targetId);
      return true;
    }
    if (customId.startsWith('btn_security_ban_')) {
      const targetId = customId.replace('btn_security_ban_', '');
      await AltRaidGuardService.handleSecurityButton(interaction, 'ban', targetId);
      return true;
    }
  }

  if (customId.startsWith('btn_ticket_resolved_by_ai') || customId.startsWith('btn_ticket_need_staff')) {
    const TicketSmartResolverService = require('../../services/ticket/ticketSmartResolverService');
    await TicketSmartResolverService.handleButton(interaction);
    return true;
  }

  if (customId.startsWith('btn_market_')) {
    const MarketAuctionService = require('../../services/marketAuctionService');
    if (customId === 'btn_market_panel' || customId === 'btn_market_refresh') {
      await MarketAuctionService.renderMarketplacePanel(interaction);
      return true;
    }
  }

  if (customId.startsWith('btn_stock_')) {
    const StockChartService = require('../../services/stockChartService');
    if (customId === 'btn_stock_chart') {
      await interaction.deferReply({ ephemeral: true });
      const chartAttachment = await StockChartService.generateStockChart();
      await interaction.editReply({ files: [chartAttachment] });
      return true;
    }
  }

  if (customId.startsWith('mod_appr_')) {
    const handled = await handleModApprovalButton(interaction);
    if (handled) return true;
  }

  if (customId.startsWith('rbx_appr_')) {
    const handled = await handleApprovalButton(interaction);
    if (handled) return true;
  }

  if (customId.startsWith('rpg_') || customId.startsWith('buy_prop_') || customId.startsWith('invest_stock_') || customId.startsWith('jury_vote_')) {
    const handled = await handleRpgButton(interaction);
    if (handled) return true;
  }

  if (customId.startsWith('btn_rollcall_')) {
    const { handleRollCallButton } = require('../../services/rollCallService');
    await handleRollCallButton(interaction);
    return true;
  }

  if (customId.startsWith('apply_unit_')) {
    const { handleApplyClick } = require('../../services/unitService');
    const target = customId.replace('apply_unit_', '');
    await handleApplyClick(interaction, target);
    return true;
  }

  if (customId.startsWith('unit_exam_ans_')) {
    const { handleAnswerClick } = require('../../services/unitService');
    const parts = customId.split('_');
    const qIndex = parts[3];
    const optIndex = parts[4];
    await handleAnswerClick(interaction, qIndex, optIndex);
    return true;
  }

  if (customId === 'staff_units_request_menu' || customId.startsWith('unit_req_') || customId.startsWith('unit_cmd_')) {
    const { handleRequestButton } = require('../../services/unitRequestService');
    await handleRequestButton(interaction);
    return true;
  }

  if (customId.startsWith('unit_chat_')) {
    const { handleChatButton } = require('../../services/unitChatService');
    await handleChatButton(interaction);
    return true;
  }

  if (customId.startsWith('unit_quest_')) {
    const { showUnitQuestPanel, claimUnitQuestRewards } = require('../../services/unitQuestService');
    if (customId === 'unit_quest_claim_all') {
      await claimUnitQuestRewards(interaction);
    } else {
      await showUnitQuestPanel(interaction);
    }
    return true;
  }

  if (customId.startsWith('btn_ticket_smart_')) {
    const { handleSmartResolveButton } = require('../../services/ticketAIAutoResolver');
    await handleSmartResolveButton(interaction);
    return true;
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

