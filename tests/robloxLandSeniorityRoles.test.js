'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BASE_ROLE_ID,
  SENIORITY_TIERS,
  TARGET_ROLE_IDS,
  calculateSeniorityRoleAssignments,
  syncRobloxLandSeniorityRoles
} = require('../bot/services/robloxLandSeniorityRoleService');

test('calculates correct seniority order based on account creation timestamp', () => {
  const members = [
    {
      id: 'user_2022',
      user: { bot: false, createdTimestamp: 1640995200000 }, // Jan 1, 2022
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'user_2018',
      user: { bot: false, createdTimestamp: 1514764800000 }, // Jan 1, 2018 (Oldest)
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'user_2020_june',
      user: { bot: false, createdTimestamp: 1590969600000 }, // June 1, 2020
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'user_2020_jan',
      user: { bot: false, createdTimestamp: 1577836800000 }, // Jan 1, 2020
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'user_2019',
      user: { bot: false, createdTimestamp: 1546300800000 }, // Jan 1, 2019
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'user_2023',
      user: { bot: false, createdTimestamp: 1672531200000 }, // Jan 1, 2023
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'bot_user',
      user: { bot: true, createdTimestamp: 1400000000000 }, // Old bot, must be ignored
      roleIds: [BASE_ROLE_ID]
    }
  ];

  const plan = calculateSeniorityRoleAssignments(members);

  // 6 valid members (bot excluded)
  assert.equal(plan.length, 6);

  // Rank 1: user_2018 -> Kızıl alev (1544019657491615814)
  assert.equal(plan[0].userId, 'user_2018');
  assert.equal(plan[0].rank, 1);
  assert.equal(plan[0].targetRoleId, '1544019657491615814');
  assert.deepEqual(plan[0].rolesToAdd, ['1544019657491615814']);
  assert.deepEqual(plan[0].rolesToRemove, [BASE_ROLE_ID]);

  // Rank 2: user_2019 -> Altın taç (1544016562753904760)
  assert.equal(plan[1].userId, 'user_2019');
  assert.equal(plan[1].rank, 2);
  assert.equal(plan[1].targetRoleId, '1544016562753904760');

  // Rank 3: user_2020_jan -> Zümrüt (1544017553637253200)
  assert.equal(plan[2].userId, 'user_2020_jan');
  assert.equal(plan[2].rank, 3);
  assert.equal(plan[2].targetRoleId, '1544017553637253200');

  // Rank 4: user_2020_june -> Mor galaksi (1544018013005676564)
  assert.equal(plan[3].userId, 'user_2020_june');
  assert.equal(plan[3].rank, 4);
  assert.equal(plan[3].targetRoleId, '1544018013005676564');

  // Rank 5: user_2022 -> Mavi elmas (1544018426589085776)
  assert.equal(plan[4].userId, 'user_2022');
  assert.equal(plan[4].rank, 5);
  assert.equal(plan[4].targetRoleId, '1544018426589085776');

  // Rank 6: user_2023 -> Beyond top 5, stays in BASE_ROLE_ID, targetRoleId is null
  assert.equal(plan[5].userId, 'user_2023');
  assert.equal(plan[5].rank, 6);
  assert.equal(plan[5].targetRoleId, null);
  assert.deepEqual(plan[5].rolesToAdd, []);
  assert.deepEqual(plan[5].rolesToRemove, []);
  assert.equal(plan[5].needsUpdate, false);
});

test('accounts from same month/year are properly ordered by precise timestamp', () => {
  const members = [
    {
      id: 'account_b',
      user: { bot: false, createdTimestamp: 1600000050000 }, // Later in same month
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'account_a',
      user: { bot: false, createdTimestamp: 1600000010000 }, // Earlier in same month
      roleIds: [BASE_ROLE_ID]
    }
  ];

  const plan = calculateSeniorityRoleAssignments(members);
  assert.equal(plan[0].userId, 'account_a');
  assert.equal(plan[1].userId, 'account_b');
});

test('existing target role holders are recognized and unnecessary role edits are avoided', () => {
  const members = [
    {
      id: 'top1_already_has_role',
      user: { bot: false, createdTimestamp: 1500000000000 },
      roleIds: ['1544019657491615814'] // Already has Kızıl alev
    }
  ];

  const plan = calculateSeniorityRoleAssignments(members);
  assert.equal(plan[0].rank, 1);
  assert.equal(plan[0].needsUpdate, false);
  assert.deepEqual(plan[0].rolesToAdd, []);
  assert.deepEqual(plan[0].rolesToRemove, []);
});

test('members dropping out of top 5 get tier roles removed and base role restored', () => {
  const members = [
    {
      id: 'u1',
      user: { bot: false, createdTimestamp: 1000000000000 },
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'u2',
      user: { bot: false, createdTimestamp: 1100000000000 },
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'u3',
      user: { bot: false, createdTimestamp: 1200000000000 },
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'u4',
      user: { bot: false, createdTimestamp: 1300000000000 },
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'u5',
      user: { bot: false, createdTimestamp: 1400000000000 },
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'u6_dropped',
      user: { bot: false, createdTimestamp: 1500000000000 },
      roleIds: ['1544018426589085776'] // Formerly rank 5 Mavi elmas
    }
  ];

  const plan = calculateSeniorityRoleAssignments(members);
  const dropped = plan.find(p => p.userId === 'u6_dropped');
  assert.equal(dropped.rank, 6);
  assert.equal(dropped.needsUpdate, true);
  assert.deepEqual(dropped.rolesToAdd, [BASE_ROLE_ID]);
  assert.deepEqual(dropped.rolesToRemove, ['1544018426589085776']);
});

test('syncRobloxLandSeniorityRoles executes role add and remove operations accurately on guild members', async () => {
  const added = [];
  const removed = [];

  const mockMember = {
    id: 'user-mock-1',
    user: { bot: false, createdTimestamp: 1500000000000, tag: 'TestUser#0001' },
    roles: {
      cache: new Map([
        [BASE_ROLE_ID, { id: BASE_ROLE_ID }]
      ]),
      add: async (ids) => added.push(...ids),
      remove: async (ids) => removed.push(...ids)
    }
  };

  const mockGuild = {
    id: '1537407325290237973',
    members: {
      fetch: async () => {},
      cache: new Map([[mockMember.id, mockMember]])
    }
  };

  const mockClient = {
    guilds: {
      cache: new Map([[mockGuild.id, mockGuild]]),
      fetch: async () => mockGuild
    }
  };

  const result = await syncRobloxLandSeniorityRoles(mockClient);
  assert.equal(result.success, true);
  assert.equal(result.updatedCount, 1);
  assert.deepEqual(added, ['1544019657491615814']);
  assert.deepEqual(removed, [BASE_ROLE_ID]);
});
