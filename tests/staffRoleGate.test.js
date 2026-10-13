'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PermissionFlagsBits } = require('discord.js');
const { memberHasStaffRole, hasStaffRoleInGuild, MOD_ROLE_ID, STAFF_RANK_ROLES } = require('../bot/utils/staffRoleGate');

const member = (roleIds = [], admin = false) => ({
  roles: { cache: new Map(roleIds.map((id) => [id, { id }])) },
  permissions: { has: (p) => admin && p === PermissionFlagsBits.Administrator }
});
const clientWith = (fetchMember) => ({ guilds: { fetch: async () => ({ members: { fetch: fetchMember } }) } });

test('yetkili rolü olmayan üye moderatör DM alıcısı sayılmaz', () => {
  assert.equal(memberHasStaffRole(member([])), false);
  assert.equal(memberHasStaffRole(member(['111'])), false);
  assert.equal(memberHasStaffRole(member([MOD_ROLE_ID])), true);
  assert.equal(memberHasStaffRole(member([STAFF_RANK_ROLES[1]])), true);
  assert.equal(memberHasStaffRole(member([], true)), true);
});

test('hasStaffRoleInGuild: rolü alınmış veya sunucudan çıkmış kişi false, Discord kesintisinde true', async () => {
  assert.equal(await hasStaffRoleInGuild(clientWith(async () => member([])), 'u1'), false);
  assert.equal(await hasStaffRoleInGuild(clientWith(async () => member([MOD_ROLE_ID])), 'u1'), true);
  assert.equal(await hasStaffRoleInGuild(clientWith(async () => { const e = new Error('Unknown Member'); e.code = 10007; throw e; }), 'u1'), false);
  assert.equal(await hasStaffRoleInGuild(clientWith(async () => { throw new Error('ECONNRESET'); }), 'u1'), true);
});

test('broadcastToActiveStaff yalnızca hâlâ yetkili rolü olanlara DM atar', async () => {
  const StaffProgress = require('../models/StaffProgress');
  const origFind = StaffProgress.find;
  StaffProgress.find = () => ({ select: async () => [{ userId: 'mod' }, { userId: 'exmod' }] });
  const sentTo = [];
  const client = {
    guilds: { fetch: async () => ({ members: { fetch: async (id) => member(id === 'mod' ? [MOD_ROLE_ID] : []) } }) },
    users: { fetch: async (id) => ({ id, send: async () => { sentTo.push(id); } }) }
  };
  try {
    const { broadcastToActiveStaff } = require('../bot/services/notificationService');
    await broadcastToActiveStaff(client, async () => ({ title: 'Mod duyurusu', body: 'Test' }));
    assert.deepEqual(sentTo, ['mod']);
  } finally {
    StaffProgress.find = origFind;
  }
});

test('syncAndFilterActiveStaff Discord rolü alınmış personeli DM listesinden çıkarır', async () => {
  const User = require('../models/User');
  const origFindOne = User.findOne;
  User.findOne = async () => null;
  const client = { guilds: { fetch: async () => ({ members: { fetch: async (id) => member(id === 'mod' ? [STAFF_RANK_ROLES[2]] : []) } }) } };
  try {
    const { syncAndFilterActiveStaff } = require('../bot/services/staffSystem');
    const out = await syncAndFilterActiveStaff([
      { userId: 'mod', status: 'active', level: 2 },
      { userId: 'exmod', status: 'active', level: 2 }
    ], client);
    assert.deepEqual(out.map((p) => p.userId), ['mod']);
  } finally {
    User.findOne = origFindOne;
  }
});
