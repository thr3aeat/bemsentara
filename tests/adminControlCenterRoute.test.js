'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAdminControlCenterHandler } = require('../server/routes/adminControlCenter');

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test('control center endpoint rejects non-admin users without querying data', async () => {
  let calls = 0;
  const handler = buildAdminControlCenterHandler({
    service: { getSnapshot: async () => { calls++; return {}; } },
    isAdmin: () => false,
  });
  const res = responseRecorder();
  await handler({ user: { username: 'member' } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(calls, 0);
});

test('control center endpoint returns the safe snapshot to admins', async () => {
  const snapshot = { generatedAt: '2026-09-20T12:00:00.000Z', summary: {}, liveUsers: [], queue: [], recentActions: [], services: [], errors: [] };
  const handler = buildAdminControlCenterHandler({
    service: { getSnapshot: async () => snapshot },
    isAdmin: () => true,
  });
  const res = responseRecorder();
  await handler({ user: { isAdmin: true } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true, ...snapshot });
});
