'use strict';

const { buildTicketUserPanel, buildTicketStaffPanel } = require('./ticketPanelService');

function formatPanelError(ticket, error) {
  return `[TICKET_PANEL_SEND_FAILED] ticketId=${ticket?.ticketId || 'unknown'} guildId=${ticket?.guildId || 'unknown'} channelId=${ticket?.channelId || 'unknown'} userId=${ticket?.userId || 'unknown'} error=${error?.message || String(error)}`;
}

async function sendTicketPanels(ticket, channel, buildPanels) {
  const panels = buildPanels ? buildPanels(ticket) : [buildTicketUserPanel(ticket), buildTicketStaffPanel(ticket)];
  const messages = [];
  for (const panel of panels) messages.push(await channel.send(panel));
  ticket.panelMessageId = messages[0]?.id || null;
  ticket.staffPanelMessageId = messages[1]?.id || null;
  ticket.panelDeliveredAt = new Date();
  ticket.deliveryState = 'delivered';
  ticket.deliveryError = null;
  ticket.deliveryErrorAt = null;
  await ticket.save();
  return messages;
}

async function createTicketLifecycle(input, dependencies) {
  const { Ticket, createChannel, buildPanels, logError = console.error } = dependencies;
  const ticket = new Ticket({
    ...input,
    status: input.status || 'open',
    deliveryState: 'pending_delivery',
    createdAt: input.createdAt || new Date()
  });
  await ticket.save();

  try {
    const channel = await createChannel(ticket);
    ticket.channelId = channel.id;
    ticket.guildId = channel.guild?.id || ticket.guildId || null;
    await ticket.save();
    await sendTicketPanels(ticket, channel, buildPanels);
  } catch (error) {
    ticket.deliveryState = 'pending_retry';
    ticket.deliveryError = error?.message || String(error);
    ticket.deliveryErrorAt = new Date();
    await ticket.save();
    logError(formatPanelError(ticket, error));
  }

  return ticket;
}

async function retryTicketPanel(ticket, dependencies) {
  const { client, buildPanels, logError = console.error } = dependencies;
  try {
    const guild = await client.guilds.fetch(ticket.guildId);
    const channel = await guild.channels.fetch(ticket.channelId);
    await sendTicketPanels(ticket, channel, buildPanels);
    return { delivered: true, ticket };
  } catch (error) {
    ticket.deliveryState = 'pending_retry';
    ticket.deliveryError = error?.message || String(error);
    ticket.deliveryErrorAt = new Date();
    await ticket.save();
    logError(formatPanelError(ticket, error));
    return { delivered: false, ticket };
  }
}

module.exports = { createTicketLifecycle, retryTicketPanel, sendTicketPanels, formatPanelError };
