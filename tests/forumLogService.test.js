'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { LOG_TOPICS } = require('../bot/services/forumLogService');

test('LOG_TOPICS exports 10 required log category topics', () => {
  const keys = Object.keys(LOG_TOPICS);
  assert.equal(keys.length, 10);
  assert.ok(LOG_TOPICS.BEHAVIOR_PSYCHOLOGY);
  assert.ok(LOG_TOPICS.VOICE_MEDIA_ADVANCED);
  assert.ok(LOG_TOPICS.SECURITY_FORENSICS);
  assert.ok(LOG_TOPICS.SERVER_HEALTH_ECONOMY);
  assert.ok(LOG_TOPICS.MESSAGE_LOGS);
  assert.ok(LOG_TOPICS.USER_MEMBER_LOGS);
  assert.ok(LOG_TOPICS.MODERATION_PUNISHMENT);
  assert.ok(LOG_TOPICS.CHANNEL_ROLE_CONFIG);
  assert.ok(LOG_TOPICS.VOICE_BASIC_LOGS);
  assert.ok(LOG_TOPICS.SERVER_UPDATES_LOGS);
});
