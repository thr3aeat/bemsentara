'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('general command handler has valid JavaScript syntax', () => {
  const handlerPath = path.join(__dirname, '..', 'bot', 'handlers', 'generalCommandHandler.js');
  const result = spawnSync(process.execPath, ['--check', handlerPath], { encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
