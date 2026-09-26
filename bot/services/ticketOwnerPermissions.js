'use strict';

const Ticket = require('../../models/Ticket');

const OWNER_PERMISSIONS = Object.freeze({
  ViewChannel: true,
  ReadMessageHistory: true,
  SendMessages: true,
  AttachFiles: true,
  EmbedLinks: true,
});

async function ensureTicketOwnerAccess(channel, userId) {
  if (!channel?.permissionOverwrites?.edit) throw new Error('Ticket kanalı izinleri güncellenemiyor');
  if (!userId) throw new Error('Ticket sahibi bulunamadı');
  await channel.permissionOverwrites.edit(userId, OWNER_PERMISSIONS, {
    reason: 'Ticket sahibinin erişimi yenilendi',
  });
}

async function reconcileTicketOwnerPermissions(client, dependencies = {}) {
  const findTickets = dependencies.findTickets || (() => Ticket.find({}));
  const logError = dependencies.logError || console.error;
  const tickets = await findTickets();
  const result = { checked: 0, repaired: 0, failed: 0 };

  for (const ticket of tickets) {
    if (ticket?.channelDeleted || !ticket?.channelId || !ticket?.userId) continue;
    result.checked += 1;

    try {
      let channel;
      if (ticket.guildId) {
        const cachedGuild = client?.guilds?.cache?.get?.(ticket.guildId);
        const guild = cachedGuild || await client.guilds.fetch(ticket.guildId);
        if (!guild) throw new Error('Sunucu bulunamadı');
        channel = await guild.channels.fetch(ticket.channelId);
      } else {
        channel = await client?.channels?.fetch?.(ticket.channelId);
      }
      if (!channel) throw new Error('Kanal bulunamadı');
      await ensureTicketOwnerAccess(channel, ticket.userId);
      result.repaired += 1;
    } catch (error) {
      result.failed += 1;
      logError(`[TicketOwnerPermissions] ticketId=${ticket.ticketId || 'unknown'} guildId=${ticket.guildId} channelId=${ticket.channelId} userId=${ticket.userId} error=${error?.message || String(error)}`);
    }
  }

  return result;
}

function canReopenTicket(ticket, userId, isStaff) {
  if (isStaff) return true;
  if (ticket?.lockReopen) return false;
  return ticket?.userId === userId || Boolean(ticket?.additionalUsers?.includes?.(userId));
}

module.exports = {
  OWNER_PERMISSIONS,
  ensureTicketOwnerAccess,
  reconcileTicketOwnerPermissions,
  canReopenTicket,
};
