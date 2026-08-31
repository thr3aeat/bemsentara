'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const {
  loadInvitesData,
  saveInvitesData,
  buildInvitePanelPayload,
  handleMemberJoinInvite,
  unlockSecretChannelForUser,
  SECRET_REWARD_CHANNEL_ID
} = require('../bot/services/robloxLandInviteService');

const INVITES_FILE = path.join(__dirname, '../data/robloxland_invites.json');

test('buildInvitePanelPayload returns valid components V2 payload', () => {
  const payload = buildInvitePanelPayload();
  assert.ok(payload);
  assert.ok(Array.isArray(payload.components));
});

test('member join triggers 3-invite 2X XP and 5-invite secret channel unlock', async () => {
  const original = loadInvitesData();

  const testInviterId = 'inviter_test_user';
  const testInviteCode = 'test_code_123';

  const mockData = {
    users: {
      [testInviterId]: {
        userId: testInviterId,
        code: testInviteCode,
        invitedCount: 2,
        invitedUsers: ['user_1', 'user_2'],
        hasXpBoost: false,
        hasSecretChannelAccess: false
      }
    },
    codes: {
      [testInviteCode]: testInviterId
    }
  };
  saveInvitesData(mockData);

  let unlockedChannelUserId = null;
  const mockGuild = {
    id: '1537407325290237973',
    invites: {
      fetch: async () => new Map([[testInviteCode, { code: testInviteCode, uses: 3 }]])
    },
    channels: {
      cache: new Map([
        [SECRET_REWARD_CHANNEL_ID, {
          id: SECRET_REWARD_CHANNEL_ID,
          permissionOverwrites: {
            create: async (userId) => {
              unlockedChannelUserId = userId;
            }
          }
        }]
      ]),
      fetch: async () => null
    }
  };

  const mockMember = {
    id: 'user_3',
    guild: mockGuild,
    user: { bot: false }
  };

  const mockClient = {
    users: {
      fetch: async () => ({ send: async () => {} })
    }
  };

  await handleMemberJoinInvite(mockMember, mockClient);

  const updatedData = loadInvitesData();
  const inviter = updatedData.users[testInviterId];

  // 3. davet gerçekleştiğinde 2X XP boost aktif olmalı
  assert.equal(inviter.invitedCount, 3);
  assert.equal(inviter.hasXpBoost, true);

  // 4. ve 5. davetler
  inviter.invitedUsers.push('user_4');
  inviter.invitedCount = 4;
  saveInvitesData(updatedData);

  const mockMember5 = {
    id: 'user_5',
    guild: mockGuild,
    user: { bot: false }
  };

  await handleMemberJoinInvite(mockMember5, mockClient);

  const finalData = loadInvitesData();
  const finalInviter = finalData.users[testInviterId];

  // 5. davette gizli kanal yetkisi açılmalı
  assert.equal(finalInviter.invitedCount, 5);
  assert.equal(finalInviter.hasSecretChannelAccess, true);
  assert.equal(unlockedChannelUserId, testInviterId);

  // Cleanup
  saveInvitesData(original);
});
