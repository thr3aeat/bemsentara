'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getGitMetadata,
  ANNOUNCE_CHANNEL_ID,
  SHORT_ANNOUNCE_CHANNEL_ID,
  generateShortUpdateNote
} = require('../bot/services/botStartupAnnounceService');
const { checkAndDeploy } = require('../bot/services/gitAutoDeployWatcher');

test('botStartupAnnounceService gets git metadata correctly and defines announcement channels', () => {
  const meta = getGitMetadata();

  assert.ok(meta.version);
  assert.ok(typeof meta.commitHash === 'string');
  assert.ok(typeof meta.commitMessage === 'string');
  assert.equal(ANNOUNCE_CHANNEL_ID, '1553530701926629539');
  assert.equal(SHORT_ANNOUNCE_CHANNEL_ID, '1518705723184386198');
});

test('generateShortUpdateNote produces concise clean summary without leaking commit details', async () => {
  const short = await generateShortUpdateNote({
    commitMessage: 'fix(admin): fix sanitize ReferenceError and improve layout'
  });
  assert.ok(typeof short === 'string');
  assert.ok(short.length > 0 && short.length <= 80);
  assert.ok(!short.includes('sanitize'), 'Should not mention code function details');
  assert.ok(!short.includes('ReferenceError'), 'Should not mention raw errors');
});

test('gitAutoDeployWatcher functions are defined and executable', () => {
  assert.equal(typeof checkAndDeploy, 'function');
});
