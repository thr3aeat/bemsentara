'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const UserTrustScore = require('./models/UserTrustScore');
const ModPerformance = require('./models/ModPerformance');
const { collections } = require('./models/Store');
const {
  updateTrustScore,
  calculateTrustTier,
  requestModTrustAction
} = require('./bot/services/security/trustScoreService');

function createFakeClient() {
  return {
    isReady: () => true,
    users: {
      fetch: async (id) => ({
        id,
        username: `testuser_${id}`,
        createdTimestamp: Date.now() - (365 * 24 * 60 * 60 * 1000),
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
              cache: { has: () => false },
              add: async () => { },
              remove: async () => { }
            }
          })
        },
        channels: {
          cache: { values: () => [] },
          create: async () => ({
            id: "chan_999",
            send: async () => ({
              id: "msg_999",
              pin: async () => { }
            })
          }),
          fetch: async () => ({
            id: "chan_999",
            send: async () => ({
              id: "msg_999",
              pin: async () => { }
            }),
            messages: {
              fetch: async () => ({
                id: "msg_999",
                edit: async () => { }
              })
            }
          })
        }
      })
    }
  };
}

describe('Trust Tier & Moderation Audit Suite', () => {
  beforeEach(async () => {
    if (collections.userTrustScores?.data) collections.userTrustScores.data.clear();
    if (collections.modPerformances?.data) collections.modPerformances.data.clear();
  });

  afterEach(async () => {
    if (collections.userTrustScores?.data) collections.userTrustScores.data.clear();
    if (collections.modPerformances?.data) collections.modPerformances.data.clear();
  });

  describe('Module 1: Dynamic Trust Tiers', () => {
    it('calculates trust tiers correctly based on score', () => {
      assert.equal(calculateTrustTier(15.0), 0, '0-30 should be Tier 0 (Riskli)');
      assert.equal(calculateTrustTier(50.0), 1, '31-70 should be Tier 1 (Standart)');
      assert.equal(calculateTrustTier(85.0), 2, '71-100 should be Tier 2 (Güvenilir)');
      assert.equal(calculateTrustTier(120.0), 3, '101+ should be Tier 3 (Lider)');
    });

    it('updates tier status when user score crosses 70 to 71 threshold', async () => {
      const client = createFakeClient();
      const userId = `user_${Math.floor(Math.random() * 1000000)}`;

      // Create initial score
      let doc = await UserTrustScore.create({ userId, username: `user_${userId}`, trustScore: 60.0, tier: 1 });
      assert.equal(doc.tier, 1, 'Initial tier should be 1 for score 60');

      // Increase score to 80
      await updateTrustScore(userId, 20.0, "Ödül", "SYSTEM", client);
      doc = await UserTrustScore.findOne({ userId });
      assert.equal(doc.tier, 2, 'Tier should update to 2 when score exceeds 70');
    });
  });

  describe('Module 2: Escalating Penalties', () => {
    it('applies escalating penalty multipliers for repeated violations', async () => {
      const client = createFakeClient();
      const userId = `user_${Math.floor(Math.random() * 1000000)}`;

      // 1st violation
      await updateTrustScore(userId, -10.0, "İhlal 1", "operator_1", client);
      let doc = await UserTrustScore.findOne({ userId });
      assert.equal(doc.violationCount, 1);

      // 2nd violation
      await updateTrustScore(userId, -10.0, "İhlal 2", "operator_1", client);
      doc = await UserTrustScore.findOne({ userId });
      assert.equal(doc.violationCount, 2);
    });
  });

  describe('Module 4: Moderation Audit & Dual Control', () => {
    it('rejects manual mod action if proof URL is missing', async () => {
      const client = createFakeClient();
      const result = await requestModTrustAction("mod_1", "user_100", 10.0, "Test", "", client);
      assert.equal(result.success, false);
      assert.ok(result.error.includes("kanıt"));
    });

    it('routes high-value score changes (>= 50 TS) to Dual Control pending approval', async () => {
      const client = createFakeClient();
      const userId = `user_${Math.floor(Math.random() * 1000000)}`;

      const result = await requestModTrustAction("mod_1", userId, 60.0, "Büyük Düzenleme", "https://proof.link/123", client);
      assert.equal(result.success, true);
      assert.equal(result.pendingApproval, true);

      const doc = await UserTrustScore.findOne({ userId });
      assert.ok(doc.pendingModAction);
      assert.equal(doc.pendingModAction.amount, 60.0);
    });

    it('immediately applies standard score changes (< 50 TS) when proof is provided', async () => {
      const client = createFakeClient();
      const userId = `user_${Math.floor(Math.random() * 1000000)}`;

      const result = await requestModTrustAction("mod_1", userId, 20.0, "Normal Düzenleme", "https://proof.link/456", client);
      assert.equal(result.success, true);
      assert.equal(result.pendingApproval, false);
    });
  });
});
