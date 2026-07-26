'use strict';

const logger = require('../../../utils/logger');

/**
 * SLAEngine — Monitors open support tickets for response SLA deadlines (e.g. 10 mins).
 */
class SLAEngine {
  constructor() {
    this.activeSLATimers = new Map(); // ticketId -> timer
    this.defaultSLAThresholdMs = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Starts an SLA timer for a newly created or unanswered ticket
   */
  startTicketSLA(ticketId, channelId, client, thresholdMs = this.defaultSLAThresholdMs) {
    this.clearTicketSLA(ticketId);

    const timer = setTimeout(async () => {
      try {
        logger.warn(`[SLAEngine] SLA breached for Ticket ${ticketId} in channel ${channelId}`);
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (channel && typeof channel.send === 'function') {
          const { EmbedBuilder } = require('discord.js');
          const embed = new EmbedBuilder()
            .setTitle('🚨 SLA YANIT SÜRESİ AŞILDI (10 Dakika)')
            .setDescription(
              '⚠️ **Yetkili Ekip Uyarı:** Bu destek talebine 10 dakikadır yanıt verilmemiştir!\n' +
              'Lütfen en kısa sürede üyenin talebini inceleyiniz.'
            )
            .setColor(0xe74c3c)
            .setTimestamp();
          await channel.send({ content: '🔔 <@&1521508588135387166>', embeds: [embed] }).catch(() => {});
        }
      } catch (err) {
        logger.error(`[SLAEngine] Error sending SLA warning for ticket ${ticketId}:`, err.message);
      } finally {
        this.activeSLATimers.delete(ticketId);
      }
    }, thresholdMs);

    this.activeSLATimers.set(ticketId, timer);
  }

  /**
   * Clears the SLA timer when a staff member responds to the ticket
   */
  clearTicketSLA(ticketId) {
    if (this.activeSLATimers.has(ticketId)) {
      clearTimeout(this.activeSLATimers.get(ticketId));
      this.activeSLATimers.delete(ticketId);
    }
  }
}

module.exports = new SLAEngine();
