'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getGitMetadata, ANNOUNCE_CHANNEL_ID } = require('../bot/services/botStartupAnnounceService');
const { checkAndDeploy } = require('../bot/services/gitAutoDeployWatcher');

test('botStartupAnnounceService gets git metadata correctly', () => {
  const meta = getGitMetadata();

  assert.ok(meta.version);
  assert.ok(typeof meta.commitHash === 'string');
  assert.ok(typeof meta.commitMessage === 'string');
  assert.equal(ANNOUNCE_CHANNEL_ID, '1553530701926629539');
});

test('gitAutoDeployWatcher functions are defined and executable', () => {
  assert.equal(typeof checkAndDeploy, 'function');
});
