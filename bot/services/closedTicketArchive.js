'use strict';

// Kapatılan ticketler "🔒 KAPATILAN TİCKETLER" kategorisine taşınır, sahibinden gizlenir ve
// 30 gün içinde yeniden açılmazsa ticketCleanup tarafından otomatik silinir.

const { ChannelType, PermissionFlagsBits } = require('discord.js');

const CATEGORY_NAME = '🔒 KAPATILAN TİCKETLER';

async function getClosedCategory(guild) {
  const existing = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME);
  if (existing) return existing;
  return guild.channels.create({
    name: CATEGORY_NAME,
    type: ChannelType.GuildCategory,
    permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }],
    reason: 'Kapatılan ticket arşivi'
  }).catch(() => null);
}

// Kanalı kapalı kategorisine taşır ve sahibinden gizler; yeniden açılınca dönülecek kategoriyi saklar.
async function archiveClosedTicket(channel, ticket, category = null) {
  if (!channel) return;
  const target = category || await getClosedCategory(channel.guild);
  if (target && channel.parentId !== target.id) {
    if (!ticket.openParentId) ticket.openParentId = channel.parentId || null;
    await channel.setParent(target.id, { lockPermissions: false }).catch(() => {});
  }
  if (ticket.userId) {
    await channel.permissionOverwrites.edit(ticket.userId, { ViewChannel: false }, { reason: 'Ticket kapatıldı' }).catch(() => {});
  }
  await ticket.save();
}

// Yeniden açılan ticketi eski kategorisine geri taşır.
async function restoreReopenedTicket(channel, ticket) {
  if (!channel || !ticket.openParentId) return;
  await channel.setParent(ticket.openParentId, { lockPermissions: false }).catch(() => {});
  ticket.openParentId = null;
  await ticket.save();
}

module.exports = { CATEGORY_NAME, getClosedCategory, archiveClosedTicket, restoreReopenedTicket };
