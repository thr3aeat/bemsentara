'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const User = require('../models/User');
const UserTrustScore = require('../models/UserTrustScore');
const UserActivityLog = require('../models/UserActivityLog');
const Economy = require('../models/Economy');
const { collections } = require('../models/Store');
const {
  fetchComprehensiveUserData,
  buildIncelePayload,
  parseDurationMs,
  canManageUsers
} = require('../bot/services/userManagementService');

function createMockClient() {
  const usersMap = new Map();
  return {
    isReady: () => true,
    users: {
      fetch: async (id) => {
        if (!usersMap.has(id)) {
          usersMap.set(id, {
            id,
            tag: `User_${id}#1234`,
            username: `User_${id}`,
            createdTimestamp: Date.now() - 100 * 24 * 60 * 60 * 1000,
            displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/test.png',
            send: async () => ({})
          });
        }
        return usersMap.get(id);
      }
    },
    guilds: {
      cache: new Map([
        ["guild_1", {
          id: "guild_1",
          name: "Test Guild",
          members: {
            fetch: async (id) => ({
              id,
              nickname: "NickTest",
              joinedTimestamp: Date.now() - 50 * 24 * 60 * 60 * 1000,
              roles: {
                cache: new Map([
                  ["role_1", { id: "role_1", position: 10, toString: () => "<@&role_1>" }],
                  ["guild_1", { id: "guild_1", position: 0, toString: () => "@everyone" }]
                ])
              },
              communicationDisabledUntilTimestamp: null,
              timeout: async () => {}
            })
          },
          bans: {
            create: async () => {},
            remove: async () => {}
          }
        }]
      ]),
      fetch: async () => mockClient.guilds.cache.get("guild_1")
    }
  };
}

describe('User Management & Incele Hub Suite', () => {
  const testUserId = '999888777666555444';
  const mockClient = createMockClient();
  const mockGuild = mockClient.guilds.cache.get('guild_1');

  beforeEach(async () => {
    if (collections.users?.data) collections.users.data.clear();
    if (collections.userTrustScores?.data) collections.userTrustScores.data.clear();
    if (collections.userActivityLogs?.data) collections.userActivityLogs.data.clear();
    if (collections.economies?.data) collections.economies.data.clear();

    await User.create({
      discordId: testUserId,
      discordUsername: 'AuditUser',
      robloxUsername: 'TestRobloxDev',
      robloxId: '12345678',
      adminNotes: [{ id: '1', note: 'Örnek not', category: 'Güvenlik', createdAt: new Date() }],
      criminalRecord: [{ caseCode: 'WARN-001', lawArticle: 'Spam', verdict: 'Uyarı', date: new Date() }]
    });
  });

  it('parseDurationMs correctly converts string times', () => {
    assert.strictEqual(parseDurationMs('10m'), 600000);
    assert.strictEqual(parseDurationMs('1h'), 3600000);
    assert.strictEqual(parseDurationMs('1d'), 86400000);
  });

  it('canManageUsers validates permissions properly', () => {
    const adminMember = { permissions: { has: (perm) => true } };
    assert.strictEqual(canManageUsers(adminMember), true);

    const normalMember = { permissions: { has: () => false } };
    assert.strictEqual(canManageUsers(normalMember, { isStaff: true }), true);
    assert.strictEqual(canManageUsers(normalMember, { isStaff: false }), false);
  });

  it('UserActivityLog persists and retrieves logs', () => {
    UserActivityLog.log(testUserId, 'command', { commandName: 'incele' });
    UserActivityLog.log(testUserId, 'admin_note', { note: 'Test note' });

    const logs = UserActivityLog.getByUser(testUserId, 10);
    assert.ok(logs.length >= 2);
    assert.strictEqual(logs[0].discordId, testUserId);
  });

  it('fetchComprehensiveUserData aggregates all user components', async () => {
    // Setup DB User
    await User.create({
      discordId: testUserId,
      discordUsername: 'AuditUser',
      robloxUsername: 'TestRobloxDev',
      robloxId: '12345678',
      adminNotes: [{ id: '1', note: 'Örnek not', category: 'Güvenlik', createdAt: new Date() }],
      criminalRecord: [{ caseCode: 'WARN-001', lawArticle: 'Spam', verdict: 'Uyarı', date: new Date() }]
    });

    // Setup Economy
    collections.economies.create({
      userId: testUserId,
      wallet: 5000,
      bank: 25000
    });

    const data = await fetchComprehensiveUserData(testUserId, mockGuild, mockClient);

    assert.strictEqual(data.resolvedId, testUserId);
    assert.ok(data.discordUser, 'Discord user fetched');
    assert.ok(data.dbUser, 'DB user found');
    assert.strictEqual(data.adminNotes.length, 1);
    assert.strictEqual(data.criminalRecord.length, 1);
    assert.strictEqual(data.economy.wallet, 5000);
  });

  it('buildIncelePayload correctly generates embeds and action rows for all tabs', async () => {
    const data = await fetchComprehensiveUserData(testUserId, mockGuild, mockClient);

    const tabs = ['overview', 'trust_score', 'logs', 'actions', 'economy'];
    for (const tab of tabs) {
      const payload = buildIncelePayload(data, tab);
      assert.ok(payload.embeds && payload.embeds.length === 1, `Tab ${tab} has embed`);
      assert.ok(payload.components && payload.components.length === 3, `Tab ${tab} has 3 rows`);

      const embed = payload.embeds[0];
      assert.ok(embed.data.title.length > 0, `Tab ${tab} has title`);
      assert.ok(embed.data.fields.length > 0, `Tab ${tab} has fields`);
    }
  });
});
