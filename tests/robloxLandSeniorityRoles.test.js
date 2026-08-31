'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BASE_ROLE_ID,
  SENIORITY_TIERS,
  TARGET_ROLE_IDS,
  calculateSeniorityRoleAssignments,
  syncRobloxLandSeniorityRoles,
  handleMemberVipRoleUpdate
} = require('../bot/services/robloxLandSeniorityRoleService');

test('tüm VIP üyeleri 5 kademeli VIP rollerine dağıtılır ve taban rolde kimse kalmaz', () => {
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
      user: { bot: false, createdTimestamp: 1672531200000 }, // Jan 1, 2023 (Newest)
      roleIds: [BASE_ROLE_ID]
    },
    {
      id: 'bot_user',
      user: { bot: true, createdTimestamp: 1400000000000 }, // Old bot, must be ignored
      roleIds: [BASE_ROLE_ID]
    }
  ];

  const plan = calculateSeniorityRoleAssignments(members);

  // 6 geçerli üye (bot hariç)
  assert.equal(plan.length, 6);

  // 1. Sıra: user_2018 -> Kızıl alev (1544019657491615814)
  assert.equal(plan[0].userId, 'user_2018');
  assert.equal(plan[0].rank, 1);
  assert.equal(plan[0].targetRoleId, '1544019657491615814');
  assert.deepEqual(plan[0].rolesToAdd, ['1544019657491615814']);
  assert.deepEqual(plan[0].rolesToRemove, [BASE_ROLE_ID]);

  // 2. Sıra: user_2019 -> Kızıl alev (Dilimleme gereği en eskiler)
  assert.equal(plan[1].userId, 'user_2019');
  assert.equal(plan[1].rank, 2);
  assert.equal(plan[1].targetRoleId, '1544019657491615814');

  // 3. Sıra: user_2020_jan -> Altın taç (1544016562753904760)
  assert.equal(plan[2].userId, 'user_2020_jan');
  assert.equal(plan[2].rank, 3);
  assert.equal(plan[2].targetRoleId, '1544016562753904760');

  // 4. Sıra: user_2020_june -> Zümrüt (1544017553637253200)
  assert.equal(plan[3].userId, 'user_2020_june');
  assert.equal(plan[3].rank, 4);
  assert.equal(plan[3].targetRoleId, '1544017553637253200');

  // 5. Sıra: user_2022 -> Mor galaksi (1544018013005676564)
  assert.equal(plan[4].userId, 'user_2022');
  assert.equal(plan[4].rank, 5);
  assert.equal(plan[4].targetRoleId, '1544018013005676564');

  // 6. Sıra: user_2023 -> Mavi elmas (1544018426589085776)
  assert.equal(plan[5].userId, 'user_2023');
  assert.equal(plan[5].rank, 6);
  assert.equal(plan[5].targetRoleId, '1544018426589085776');
  assert.deepEqual(plan[5].rolesToAdd, ['1544018426589085776']);
  assert.deepEqual(plan[5].rolesToRemove, [BASE_ROLE_ID]);
});

test('manuel olarak yanlış VIP rolü verilmişse geri çekilip hesap yaşına uygun doğru rol verilir', () => {
  const members = [
    {
      id: 'old_account_2017',
      user: { bot: false, createdTimestamp: 1500000000000 },
      roleIds: ['1544018426589085776'] // Yanlışlıkla en düşük VIP (Mavi elmas) verilmiş
    },
    {
      id: 'new_account_2024',
      user: { bot: false, createdTimestamp: 1720000000000 },
      roleIds: ['1544019657491615814'] // Yanlışlıkla en yüksek VIP (Kızıl alev) verilmiş
    }
  ];

  const plan = calculateSeniorityRoleAssignments(members);

  // Eski hesap (2017) -> Kızıl alev almalı, Mavi elmas geri çekilmeli
  const oldPlan = plan.find(p => p.userId === 'old_account_2017');
  assert.equal(oldPlan.targetRoleId, '1544019657491615814'); // Kızıl alev
  assert.deepEqual(oldPlan.rolesToAdd, ['1544019657491615814']);
  assert.deepEqual(oldPlan.rolesToRemove, ['1544018426589085776']);

  // Yeni hesap (2024) -> Altın taç / Mavi elmas almalı, Kızıl alev geri çekilmeli
  const newPlan = plan.find(p => p.userId === 'new_account_2024');
  assert.equal(newPlan.targetRoleId, '1544016562753904760'); // 2 üyeden 2. sıra
  assert.deepEqual(newPlan.rolesToAdd, ['1544016562753904760']);
  assert.deepEqual(newPlan.rolesToRemove, ['1544019657491615814']); // Hatalı verilen Kızıl alev çekilir!
});

test('aynı yıl ve ayda açılan hesaplar milisaniye hassasiyetinde sıralanır', () => {
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

test('zaten doğru VIP rolüne sahip üyelerde gereksiz rol güncellemesi yapılmaz', () => {
  const members = [
    {
      id: 'user_correct',
      user: { bot: false, createdTimestamp: 1500000000000 },
      roleIds: ['1544019657491615814'] // Zaten Kızıl alev rolünde
    }
  ];

  const plan = calculateSeniorityRoleAssignments(members);
  assert.equal(plan[0].rank, 1);
  assert.equal(plan[0].needsUpdate, false);
  assert.deepEqual(plan[0].rolesToAdd, []);
  assert.deepEqual(plan[0].rolesToRemove, []);
});

test('syncRobloxLandSeniorityRoles fonksiyonu hatalı rolleri temizleyip doğru VIP rolünü atar', async () => {
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
