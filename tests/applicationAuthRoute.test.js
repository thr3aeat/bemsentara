const test = require('node:test');
const assert = require('node:assert/strict');

function res() { return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }

test('request route returns stable JSON and does not suggest OAuth when DM is closed', async () => {
  const { buildApplicationAuthHandlers } = require('../server/routes/applicationAuth');
  const error = Object.assign(new Error('DM kapalı'), { statusCode: 400, code: 'DM_CLOSED' });
  const handlers = buildApplicationAuthHandlers({ service: { requestCode: async () => { throw error; } } });
  const response = res();
  await handlers.requestCode({ body: { identifier: 'ada' }, session: {}, ip: '1' }, response);
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { success: false, error: 'DM kapalı', code: 'DM_CLOSED' });
  assert.doesNotMatch(JSON.stringify(response.body), /OAuth/i);
});

test('request route preserves a safe application return path', async () => {
  let sessionSeen;
  const { buildApplicationAuthHandlers } = require('../server/routes/applicationAuth');
  const handlers = buildApplicationAuthHandlers({ service: { requestCode: async ({ session }) => { sessionSeen = session; return { targetId: '1', expiresAt: 10 }; } } });
  const session = {};
  const response = res();
  await handlers.requestCode({ body: { identifier: 'ada', returnTo: '/forms/developer?step=2' }, session, ip: '1' }, response);
  assert.equal(sessionSeen, session);
  assert.equal(session.applicationReturnTo, '/forms/developer?step=2');
  assert.equal(response.body.success, true);
});

test('verify logs in only after successful service verification and uses preserved return path', async () => {
  let loginCalls = 0;
  const user = { discordId: '1', isBanned: false };
  const { buildApplicationAuthHandlers } = require('../server/routes/applicationAuth');
  const handlers = buildApplicationAuthHandlers({ service: { verifyCode: async () => ({ user, discordUser: { id: '1' } }) } });
  const response = res();
  await handlers.verifyCode({
    body: { code: '123456' }, session: { applicationReturnTo: '/forms/developer?step=2' }, ip: '1',
    login(value, callback) { loginCalls += 1; assert.equal(value, user); callback(); }
  }, response);
  assert.equal(loginCalls, 1);
  assert.equal(response.body.redirectUrl, '/forms/developer?step=2');
});

test('failed verification and banned users never call req.login', async () => {
  const { buildApplicationAuthHandlers } = require('../server/routes/applicationAuth');
  for (const code of ['INVALID_CODE', 'USER_BANNED']) {
    let loginCalls = 0;
    const error = Object.assign(new Error(code), { statusCode: code === 'USER_BANNED' ? 403 : 400, code });
    const handlers = buildApplicationAuthHandlers({ service: { verifyCode: async () => { throw error; } } });
    const response = res();
    await handlers.verifyCode({ body: { code: 'bad' }, session: {}, ip: '1', login() { loginCalls += 1; } }, response);
    assert.equal(loginCalls, 0);
    assert.equal(response.body.code, code);
  }
});

