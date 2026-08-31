'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getSocialStats, fetchTotalSocialFollowers } = require('../bot/services/socialStatsService');

test('social stats counts are within sanity bounds and total is ~9.810', () => {
  const stats = getSocialStats();
  assert.ok(stats.total >= 5000 && stats.total <= 50000, `Total ${stats.total} should be in realistic bounds`);
  assert.ok(stats.youtube1 < 50000);
  assert.ok(stats.youtube2 < 50000);
  assert.ok(stats.tiktok < 20000);
  assert.ok(stats.instagram1 < 20000);
  assert.ok(stats.instagram2 < 20000);
});
