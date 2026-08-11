const test = require('node:test');
const assert = require('node:assert/strict');
const { logTrustUserActivity, ensureUserTrustScore } = require('../bot/services/security/trustScoreService');
const UserTrustScore = require('../models/UserTrustScore');

test('logTrustUserActivity handles missing parameters safely', async () => {
  const result = await logTrustUserActivity(null, '12345', 'Test Title', 'Test Details');
  assert.strictEqual(result, undefined);
});

test('UserTrustScore profile permissions overwrite configuration', async () => {
  const record = new UserTrustScore({
    userId: '9876543210',
    username: 'testuser',
    trustScore: 100,
    profileChannelId: 'channel_101'
  });

  assert.strictEqual(record.userId, '9876543210');
  assert.strictEqual(record.profileChannelId, 'channel_101');
});
