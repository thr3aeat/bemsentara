'use strict';

const { processTicketMessageForAutoResolution, handleSmartResolveButton } = require('../ticketAIAutoResolver');

/**
 * AI Ticket Smart Auto-Resolver & FAQ Bridge Service
 */
class TicketSmartResolverService {
  /**
   * SSS ve Arşivlenmiş Ticket Arama Süreci
   */
  static async processTicketCreation(channel, user, ticketSubject = '') {
    try {
      const ticket = {
        ticketId: channel.name.replace('ticket-', '').replace('eposta-', ''),
        userId: user.id,
        channelId: channel.id,
        category: 'general',
        subject: ticketSubject
      };

      await processTicketMessageForAutoResolution(ticket, { content: ticketSubject, author: { bot: false } }, channel.client);
      return true;
    } catch (err) {
      console.error('[TicketSmartResolverService] processTicketCreation error:', err.message);
      return false;
    }
  }

  /**
   * Buton Etkileşimi Yönetimi
   */
  static async handleButton(interaction) {
    if (interaction.customId.startsWith('btn_ticket_smart_') || interaction.customId.startsWith('btn_ticket_resolved_') || interaction.customId === 'btn_ticket_need_staff') {
      return handleSmartResolveButton(interaction);
    }
  }
}

module.exports = TicketSmartResolverService;
