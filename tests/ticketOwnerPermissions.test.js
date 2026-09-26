'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Collection, PermissionFlagsBits } = require('discord.js');

const {
  ensureTicketOwnerAccess,
  reconcileTicketOwnerPermissions,
  canReopenTicket,
} = require('../bot/services/ticketOwnerPermissions');
const { applyPrivateArchivePermissions } = require('../bot/services/archiveService');

function createChannel(id, guild, calls) {
  return {
    id,
    guild,
    permissionOverwrites: {
      edit: async (targetId, permissions) => {
        calls.push({ targetId, permissions });
      },
      set: async () => {
        calls.push({ destructiveSet: true });
      },
    },
  };
}

test('ticket owner access grants view, history and messaging without replacing other overwrites', async () => {
  const calls = [];
  const guild = { id: 'guild-1' };
  const channel = createChannel('channel-1', guild, calls);

  await ensureTicketOwnerAccess(channel, 'owner-1');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].targetId, 'owner-1');
  assert.deepEqual(calls[0].permissions, {
    ViewChannel: true,
    ReadMessageHistory: true,
    SendMessages: true,
    AttachFiles: true,
    EmbedLinks: true,
  });
  assert.equal(calls.some((call) => call.destructiveSet), false);
});

test('startup reconciliation restores every persisted ticket owner and reports inaccessible channels', async () => {
  const ownerCalls = [];
  const guild = {
    id: 'guild-1',
    channels: {
      fetch: async (channelId) => {
        if (channelId === 'missing-channel') throw new Error('Unknown Channel');
        return createChannel(channelId, guild, ownerCalls);
      },
    },
  };
  const client = {
    channels: {
      fetch: async (channelId) => createChannel(channelId, guild, ownerCalls),
    },
    guilds: {
      cache: new Collection([['guild-1', guild]]),
      fetch: async (guildId) => guildId === 'guild-1' ? guild : null,
    },
  };
  const tickets = [
    { ticketId: 'OPEN-1', status: 'open', guildId: 'guild-1', channelId: 'open-channel', userId: 'owner-1' },
    { ticketId: 'CLOSED-1', status: 'closed', guildId: 'guild-1', channelId: 'closed-channel', userId: 'owner-2' },
    { ticketId: 'MISSING-1', status: 'open', guildId: 'guild-1', channelId: 'missing-channel', userId: 'owner-3' },
    { ticketId: 'LEGACY-1', status: 'open', guildId: null, channelId: 'legacy-channel', userId: 'owner-legacy' },
    { ticketId: 'DELETED-1', status: 'closed', guildId: 'guild-1', channelId: 'deleted-channel', userId: 'owner-4', channelDeleted: true },
  ];
  const logs = [];

  const result = await reconcileTicketOwnerPermissions(client, {
    findTickets: async () => tickets,
    logError: (message) => logs.push(message),
  });

  assert.deepEqual(ownerCalls.map((call) => call.targetId), ['owner-1', 'owner-2', 'owner-legacy']);
  assert.deepEqual(result, { checked: 4, repaired: 3, failed: 1 });
  assert.match(logs[0], /MISSING-1/);
  assert.match(logs[0], /Unknown Channel/);
});

test('archive privacy updates are non-destructive and preserve existing member overwrites', async () => {
  const calls = [];
  const guild = {
    id: 'guild-1',
    roles: {
      fetch: async () => {},
      cache: new Collection([
        ['guild-1', { id: 'guild-1', name: '@everyone', permissions: { has: () => false } }],
        ['staff-1', {
          id: 'staff-1',
          name: 'Yetkili',
          permissions: { has: (permission) => permission === PermissionFlagsBits.ManageMessages },
        }],
      ]),
    },
  };
  const channel = createChannel('archive-channel', guild, calls);

  await applyPrivateArchivePermissions(channel);

  assert.equal(calls.some((call) => call.destructiveSet), false);
  assert.deepEqual(calls.map((call) => call.targetId), ['guild-1', 'staff-1']);
});

test('reopen authorization accepts owners and real staff but rejects unrelated users', () => {
  const ticket = { userId: 'owner-1', additionalUsers: ['guest-1'], lockReopen: false };

  assert.equal(canReopenTicket(ticket, 'owner-1', false), true);
  assert.equal(canReopenTicket(ticket, 'guest-1', false), true);
  assert.equal(canReopenTicket(ticket, 'staff-1', true), true);
  assert.equal(canReopenTicket(ticket, 'stranger-1', false), false);
  assert.equal(canReopenTicket({ ...ticket, lockReopen: true }, 'owner-1', false), false);
  assert.equal(canReopenTicket({ ...ticket, lockReopen: true }, 'staff-1', true), true);
});
