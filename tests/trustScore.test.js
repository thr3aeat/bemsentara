'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const UserTrustScore = require('../models/UserTrustScore');
const ModPerformance = require('../models/ModPerformance');
const { updateTrustScore, addModPoints, checkModAbuseLimit } = require('../bot/services/security/trustScoreService');

// Mock client
const fakeClient = {
  users: {
    fetch: async (id) => ({
      id,
      username: `testuser_${id}`,
      createdTimestamp: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year old
      displayAvatarURL: () => "http://avatar.url"
    })
  },
  guilds: {
    fetch: async () => ({
      id: "1367646464804655104",
      roles: {
        everyone: { id: "everyone_role" },
        cache: {
          find: () => ({ id: "role_123" }),
          has: () => true
        },
        create: async () => ({ id: "role_123" })
      },
      members: {
        fetch: async () => ({
          id: "member_123",
          premiumSince: new Date(),
          roles: {
            cache: {
              has: () => false
            },
            add: async () => {},
            remove: async () => {}
          }
        })
      },
      channels: {
        create: async () => ({
          id: "chan_999",
          send: async () => ({
            id: "msg_999",
            pin: async () => {}
          })
        }),
        fetch: async () => ({
          id: "chan_999",
          messages: {
            fetch: async () => ({
              id: "msg_999",
              edit: async () => {}
            })
          }
        })
      }
    })
  }
};

test('UserTrustScore DB document creation and calculations', async () => {
  const userId = `user_${Math.floor(Math.random() * 1000000)}`;

  // Test updateTrustScore
  await updateTrustScore(userId, 10.0, "Test Ekleme", "operator_123", fakeClient);

  const doc = await UserTrustScore.findOne({ userId });
  assert.ok(doc, 'UserTrustScore document should be created');
  assert.ok(doc.trustScore > 100.0, 'Account age and booster bonuses + test amount should be added');
});

test('ModPerformance DB document creation and points awarding', async () => {
  const modId = `mod_${Math.floor(Math.random() * 1000000)}`;

  await addModPoints(modId, 2.5, "Mod İşlem: Yasakla");

  const doc = await ModPerformance.findOne({ moderatorId: modId });
  assert.ok(doc, 'ModPerformance document should be created');
  assert.equal(doc.points, 2.5, 'Mod points should be added');
  assert.equal(doc.actionsCount, 1);
});

test('checkModAbuseLimit detects rapid manual changes', async () => {
  const userId = `user_${Math.floor(Math.random() * 1000000)}`;
  const modId = "mod_abuse_tester";

  // First manual change
  await updateTrustScore(userId, 5.0, "Manuel Düzenleme: Test 1", modId, fakeClient);
  let isExceeded = await checkModAbuseLimit(modId, userId);
  assert.equal(isExceeded, false, 'Abuse limit should not be reached on 1st change');

  // Second manual change
  await updateTrustScore(userId, 5.0, "Manuel Düzenleme: Test 2", modId, fakeClient);
  isExceeded = await checkModAbuseLimit(modId, userId);
  assert.equal(isExceeded, true, 'Abuse limit should be reached on 2nd change within 1 hour');
});
