'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { renderTumModlarPage } = require('../server/views/tumModlarPage');

test('renderTumModlarPage returns valid HTML with dashboard components', () => {
  const mockUser = {
    discordId: '123456789',
    discordUsername: 'TestAdmin',
    isStaff: true,
    isAdmin: true
  };

  const html = renderTumModlarPage(mockUser);
  assert.ok(typeof html === 'string');
  assert.ok(html.includes('Tüm Moderatörler &amp; Mod Okulu Yönetimi') || html.includes('Tüm Moderatörler & Mod Okulu Yönetimi'));
  assert.ok(html.includes('Eksik Doğrulama'));
  assert.ok(html.includes('modSearchInput'));
  assert.ok(html.includes('/api/tumodlar/data'));
});

test('StaffProgress settings handles skipIncompleteVerificationDM field', () => {
  const StaffProgress = require('../models/StaffProgress');
  const sp = new StaffProgress({
    userId: 'user_test_999',
    guildId: '123456',
    level: 2,
    settings: {
      skipIncompleteVerificationDM: true,
      dailyBriefingEnabled: true
    }
  });

  assert.equal(sp.settings.skipIncompleteVerificationDM, true);
  assert.equal(sp.settings.dailyBriefingEnabled, true);
});
