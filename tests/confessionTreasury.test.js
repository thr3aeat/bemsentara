'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('confession treasury is expanded and nonsensical troll comments are removed', () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, '../bot/services/confessionService.js'), 'utf8');

  // Verify SEED_CONFESSIONS is expanded
  assert.match(serviceCode, /roblox askeri denetimde/);
  assert.match(serviceCode, /blade ball da son 2 kişi kaldık/);
  assert.match(serviceCode, /tower of hell in son katında/);
  assert.match(serviceCode, /aynı ses odasında saatlerce hiç konuşmadan/);
  assert.match(serviceCode, /gece 4 te sunucuda kimse yok sanıp/);

  // Verify chatWithAI is used for intelligent comments
  assert.match(serviceCode, /generateRealisticComment/);
  assert.match(serviceCode, /chatWithAI/);

  // Verify absurd troll memes are eliminated from comment pool
  assert.doesNotMatch(serviceCode, /sahte telif atıcam/);
  assert.doesNotMatch(serviceCode, /telif davası loading/);
});
