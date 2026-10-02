const test = require('node:test');
const assert = require('node:assert/strict');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function service(overrides = {}) {
  return {
    list: async () => ({ items: [{ id: '1', candidate: { name: 'Ada' } }], total: 1 }),
    getDetail: async () => ({ id: '1', answers: { sections: [] } }),
    performAction: async () => ({ application: { id: '1', stage: 'REVIEWING' }, notification: { state: 'SENT' } }),
    ...overrides
  };
}

test('all handlers reject a non-admin with 403', async () => {
  const { buildAdminApplicationsHandlers } = require('../server/routes/adminApplications');
  const handlers = buildAdminApplicationsHandlers({ service: service(), isAdmin: () => false });
  for (const [name, req] of [
    ['list', { user: null, query: {} }],
    ['detail', { user: {}, params: { id: '1' } }],
    ['action', { user: {}, params: { id: '1', action: 'start-review' }, headers: {}, body: {} }]
  ]) {
    const res = response();
    await handlers[name](req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
  }
});

test('list and detail return stable safe contracts', async () => {
  const { buildAdminApplicationsHandlers } = require('../server/routes/adminApplications');
  const handlers = buildAdminApplicationsHandlers({ service: service(), isAdmin: () => true });
  const listRes = response();
  await handlers.list({ user: { isAdmin: true }, query: { status: 'PENDING' } }, listRes);
  assert.deepEqual(listRes.body, { success: true, data: { items: [{ id: '1', candidate: { name: 'Ada' } }], total: 1 } });
  const detailRes = response();
  await handlers.detail({ user: { isAdmin: true }, params: { id: '1' } }, detailRes);
  assert.deepEqual(detailRes.body, { success: true, data: { id: '1', answers: { sections: [] } } });
});

test('action requires Idempotency-Key and supplies the authenticated actor', async () => {
  let received;
  const { buildAdminApplicationsHandlers } = require('../server/routes/adminApplications');
  const handlers = buildAdminApplicationsHandlers({
    service: service({ performAction: async (input) => { received = input; return { ok: true }; } }),
    isAdmin: () => true
  });
  const missing = response();
  await handlers.action({ user: { discordId: '9' }, params: { id: '1', action: 'start-review' }, headers: {}, body: {} }, missing);
  assert.equal(missing.statusCode, 400);

  const res = response();
  await handlers.action({
    user: { discordId: '9', discordUsername: 'Admin' },
    params: { id: '1', action: 'start-review' },
    headers: { 'idempotency-key': 'key-1' },
    body: { note: 'x' }
  }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(received.actor, { id: '9', name: 'Admin' });
  assert.equal(received.idempotencyKey, 'key-1');
});

test('typed service errors map to 400, 404, and 409 without leaking stacks', async () => {
  const { buildAdminApplicationsHandlers } = require('../server/routes/adminApplications');
  for (const code of [400, 404, 409]) {
    const error = Object.assign(new Error(`safe-${code}`), { statusCode: code, code: `E_${code}` });
    const handlers = buildAdminApplicationsHandlers({ service: service({ getDetail: async () => { throw error; } }), isAdmin: () => true });
    const res = response();
    await handlers.detail({ user: {}, params: { id: 'x' } }, res);
    assert.equal(res.statusCode, code);
    assert.deepEqual(res.body, { success: false, error: `safe-${code}`, code: `E_${code}` });
  }
});

