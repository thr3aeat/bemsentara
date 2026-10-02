const test = require('node:test');
const assert = require('node:assert/strict');
const { buildApplicationApprovalHandlers } = require('../server/routes/applicationApproval');

function makeMockResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    redirectUrl: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    send(html) { this.body = html; return this; },
    redirect(url) { this.redirectUrl = url; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    sendFile(filePath) { this.sentFile = filePath; return this; }
  };
}

test('renderApprovalPage redirects unauthenticated user to login', async () => {
  const handlers = buildApplicationApprovalHandlers({
    approvalService: {},
    signatureService: {},
    submissionModel: {},
    isAdmin: () => false
  });

  const req = {
    params: { token: 'raw-token-123' },
    originalUrl: '/applications/approve/raw-token-123',
    session: {},
    user: null
  };
  const res = makeMockResponse();

  await handlers.renderApprovalPage(req, res);
  assert.equal(req.session.applicationReturnTo, '/applications/approve/raw-token-123');
  assert.match(res.redirectUrl, /\/login\?returnTo=/);
});

test('renderApprovalPage handles valid, forbidden, and invalid token states', async () => {
  const fakeService = {
    async inspect(token, user) {
      if (token === 'valid-token') {
        return {
          status: 'VALID',
          submission: {
            id: 'sub-1',
            reference: 'EKO-26-10001',
            formTitle: 'Geliştirici Başvurusu',
            discordUsername: 'Alp',
            scheduledTime: '5 Ekim 2026, 20:00'
          }
        };
      }
      if (token === 'forbidden-token') {
        return {
          status: 'FORBIDDEN',
          error: 'Bu onay adımı yalnızca başvuru sahibi Discord hesabı tarafından imzalanabilir.'
        };
      }
      return {
        status: 'INVALID',
        error: 'Bu onay bağlantısının süresi dolmuş veya daha önce kullanılmış.'
      };
    }
  };

  const handlers = buildApplicationApprovalHandlers({
    approvalService: fakeService,
    signatureService: {},
    submissionModel: {},
    isAdmin: () => false
  });

  // Valid token
  const resValid = makeMockResponse();
  await handlers.renderApprovalPage({ params: { token: 'valid-token' }, user: { discordId: '123' } }, resValid);
  assert.equal(resValid.statusCode, 200);
  assert.match(resValid.body, /Geliştirici Başvurusu/);
  assert.match(resValid.body, /EKO-26-10001/);
  assert.match(resValid.body, /Taahhütler ve Koşullar/);

  // Forbidden token
  const resForbidden = makeMockResponse();
  await handlers.renderApprovalPage({ params: { token: 'forbidden-token' }, user: { discordId: '999' } }, resForbidden);
  assert.equal(resForbidden.statusCode, 403);
  assert.match(resForbidden.body, /Yetkisiz Hesap Erişimi/);

  // Invalid token
  const resInvalid = makeMockResponse();
  await handlers.renderApprovalPage({ params: { token: 'expired-token' }, user: { discordId: '123' } }, resInvalid);
  assert.equal(resInvalid.statusCode, 410);
  assert.match(resInvalid.body, /Bağlantı Geçersiz veya Süresi Dolmuş/);
});

test('completeApproval enforces authentication and processes completion', async () => {
  let completedInput = null;
  const fakeService = {
    async complete(args) {
      completedInput = args;
      return { success: true, submissionId: 'sub-1', stage: 'INTERVIEW_READY' };
    }
  };

  const handlers = buildApplicationApprovalHandlers({
    approvalService: fakeService,
    signatureService: {},
    submissionModel: {},
    isAdmin: () => false
  });

  // Unauthenticated
  const resUnauth = makeMockResponse();
  await handlers.completeApproval({ params: { token: 'tok-1' }, user: null }, resUnauth);
  assert.equal(resUnauth.statusCode, 401);
  assert.equal(resUnauth.body.success, false);

  // Authenticated
  const resAuth = makeMockResponse();
  const strokes = [[{ x: 10, y: 10 }, { x: 50, y: 50 }]];
  await handlers.completeApproval({
    params: { token: 'tok-1' },
    user: { discordId: '12345', username: 'Alp' },
    body: {
      agreements: { truthful: true, guidelines: true, commitments: true },
      strokes
    },
    ip: '127.0.0.1',
    get: () => 'TestAgent'
  }, resAuth);

  assert.equal(resAuth.statusCode, 200);
  assert.equal(resAuth.body.success, true);
  assert.equal(completedInput.rawToken, 'tok-1');
  assert.equal(completedInput.authenticatedUser.discordId, '12345');
});

test('getSignatureImage requires admin and serves signature PNG', async () => {
  const fakeSubmissionModel = {
    async findById(id) {
      if (id === 'sub-signed') {
        return {
          _id: 'sub-signed',
          signature: { file: 'data/application-signatures/sig_test.png' }
        };
      }
      return null;
    }
  };

  const fakeSigService = {
    getSignaturePath(fileName) {
      if (fileName === 'sig_test.png') {
        return '/full/path/to/sig_test.png';
      }
      return null;
    }
  };

  const handlers = buildApplicationApprovalHandlers({
    approvalService: {},
    signatureService: fakeSigService,
    submissionModel: fakeSubmissionModel,
    isAdmin: (u) => Boolean(u && u.isAdmin)
  });

  // Non-admin -> 403
  const resNonAdmin = makeMockResponse();
  await handlers.getSignatureImage({ user: { isAdmin: false }, params: { id: 'sub-signed' } }, resNonAdmin);
  assert.equal(resNonAdmin.statusCode, 403);

  // Admin but missing submission -> 404
  const resNotFound = makeMockResponse();
  await handlers.getSignatureImage({ user: { isAdmin: true }, params: { id: 'sub-missing' } }, resNotFound);
  assert.equal(resNotFound.statusCode, 404);

  // Admin with valid signature -> 200 file
  const resValid = makeMockResponse();
  await handlers.getSignatureImage({ user: { isAdmin: true }, params: { id: 'sub-signed' } }, resValid);
  assert.equal(resValid.headers['Content-Type'], 'image/png');
  assert.equal(resValid.sentFile, '/full/path/to/sig_test.png');
});
