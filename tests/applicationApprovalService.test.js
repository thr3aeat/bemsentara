const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createSignatureService } = require('../server/services/signatureService');
const { createApplicationApprovalService } = require('../server/services/applicationApprovalService');

function makeFakeTokenModel() {
  const map = new Map();
  let counter = 1;
  const crypto = require('crypto');

  function hashToken(raw) {
    return crypto.createHash('sha256').update(String(raw)).digest('hex');
  }

  return {
    hashToken,
    async createTokenRecord({ submissionId, candidateDiscordId, createdBy = 'admin', ttlMs = 24 * 60 * 60 * 1000 }) {
      await this.invalidateOpenForSubmission(submissionId);
      const rawToken = `tok_${counter++}_${crypto.randomBytes(8).toString('hex')}`;
      const tokenHash = hashToken(rawToken);
      const now = Date.now();
      const rec = {
        _id: `rec_${counter}`,
        tokenHash,
        submissionId: String(submissionId),
        candidateDiscordId: String(candidateDiscordId),
        createdBy,
        expiresAt: new Date(now + ttlMs).toISOString(),
        usedAt: null,
        revokedAt: null,
        createdAt: new Date(now).toISOString()
      };
      map.set(tokenHash, rec);
      return { rawToken, tokenHash, record: rec };
    },
    async findValidByHash(tokenHash) {
      const rec = map.get(tokenHash);
      if (!rec) return null;
      if (rec.usedAt || rec.revokedAt) return null;
      if (new Date(rec.expiresAt).getTime() <= Date.now()) return null;
      return rec;
    },
    async consume(tokenHash, metadata = {}) {
      const rec = await this.findValidByHash(tokenHash);
      if (!rec) return null;
      rec.usedAt = new Date().toISOString();
      rec.metadata = metadata;
      return rec;
    },
    async invalidateOpenForSubmission(submissionId) {
      let count = 0;
      for (const rec of map.values()) {
        if (rec.submissionId === String(submissionId) && !rec.usedAt && !rec.revokedAt) {
          rec.revokedAt = new Date().toISOString();
          count++;
        }
      }
      return count;
    }
  };
}

function makeFakeSubmissionModel(initial = []) {
  const map = new Map(initial.map((s) => [String(s._id), structuredClone(s)]));
  return {
    async findById(id) {
      const s = map.get(String(id));
      return s ? structuredClone(s) : null;
    },
    async update(id, patch) {
      const s = map.get(String(id));
      if (!s) return null;
      const updated = { ...s, ...structuredClone(patch) };
      map.set(String(id), updated);
      return structuredClone(updated);
    }
  };
}

test('signatureService validates strokes correctly', () => {
  const sigService = createSignatureService();

  // Empty strokes
  assert.throws(() => sigService.validateStrokes([]), /boş olamaz/);
  assert.throws(() => sigService.validateStrokes(null), /boş olamaz/);

  // Invalid points
  assert.throws(() => sigService.validateStrokes([[]]), /geçerli nokta/);
  assert.throws(() => sigService.validateStrokes([[{ x: 'abc', y: 10 }]]), /sayı olmalıdır/);
  assert.throws(() => sigService.validateStrokes([[{ x: -10, y: 10 }]]), /tuval sınırları dışında/);

  // Valid strokes
  const validStrokes = [
    [{ x: 10, y: 10 }, { x: 20, y: 25 }, { x: 40, y: 50 }],
    [{ x: 50, y: 60 }, { x: 70, y: 80 }]
  ];
  const res = sigService.validateStrokes(validStrokes);
  assert.equal(res.valid, true);
  assert.equal(res.strokeCount, 2);
  assert.equal(res.pointCount, 5);
});

test('signatureService renders PNG and computes SHA-256', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sig-test-'));
  try {
    const sigService = createSignatureService({ rootDir: tempDir });
    const strokes = [
      [{ x: 20, y: 30 }, { x: 50, y: 80 }, { x: 100, y: 120 }],
      [{ x: 110, y: 130 }, { x: 140, y: 160 }]
    ];
    const result = await sigService.renderPng('sub-123', strokes);

    assert.ok(result.fileName);
    assert.ok(fs.existsSync(result.fullPath));
    assert.ok(result.sha256 && result.sha256.length === 64);
    assert.ok(result.byteLength > 100);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('applicationApprovalService token lifecycle and completion workflow', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sig-test-service-'));
  try {
    const sigService = createSignatureService({ rootDir: tempDir });
    const tokenModel = makeFakeTokenModel();
    const submissionModel = makeFakeSubmissionModel([
      {
        _id: 'sub-app-1',
        reference: 'EKO-26-10001',
        formTitle: 'Moderatör Ekibi Başvurusu',
        targetDiscordId: '123456789012345678',
        discordUsername: 'Alp',
        interviewScheduledTime: '5 Ekim 2026, 19:00',
        interviewTimeApproved: true,
        applicationStage: 'INVITED_TO_INTERVIEW'
      }
    ]);

    let sentNotifications = [];
    const approvalService = createApplicationApprovalService({
      tokenModel,
      submissionModel,
      signatureService: sigService,
      notifier: async (item) => {
        sentNotifications.push(item);
        return { success: true };
      }
    });

    // 1. Issue approval token
    const issueResult = await approvalService.issue('sub-app-1', { name: 'Staff Lead' });
    assert.ok(issueResult.rawToken);
    assert.match(issueResult.approvalUrl, /\/applications\/approve\//);
    assert.equal(sentNotifications.length, 1);
    assert.equal(sentNotifications[0].kind, 'site-approval');

    // Verify submission stage moved to SITE_APPROVAL_SENT
    const subAfterIssue = await submissionModel.findById('sub-app-1');
    assert.equal(subAfterIssue.applicationStage, 'SITE_APPROVAL_SENT');

    // 2. Inspect with correct user
    const inspection = await approvalService.inspect(issueResult.rawToken, { discordId: '123456789012345678' });
    assert.equal(inspection.status, 'VALID');
    assert.equal(inspection.submission.reference, 'EKO-26-10001');

    // 3. Inspect with WRONG user should be FORBIDDEN
    const wrongUserInsp = await approvalService.inspect(issueResult.rawToken, { discordId: '999999999999999999' });
    assert.equal(wrongUserInsp.status, 'FORBIDDEN');

    // 4. Complete without agreements should fail with 400
    await assert.rejects(
      () => approvalService.complete({
        rawToken: issueResult.rawToken,
        authenticatedUser: { discordId: '123456789012345678', username: 'Alp' },
        agreements: { truthful: true, guidelines: false, commitments: true },
        strokes: [[{ x: 10, y: 10 }, { x: 50, y: 50 }]]
      }),
      (err) => err.statusCode === 400
    );

    // 5. Complete with valid agreements and strokes
    const strokes = [
      [{ x: 10, y: 10 }, { x: 30, y: 40 }, { x: 80, y: 90 }],
      [{ x: 100, y: 110 }, { x: 150, y: 140 }]
    ];
    const compResult = await approvalService.complete({
      rawToken: issueResult.rawToken,
      authenticatedUser: { discordId: '123456789012345678', username: 'Alp' },
      agreements: { truthful: true, guidelines: true, commitments: true },
      strokes
    });

    assert.equal(compResult.success, true);
    // Because scheduledTime is present, stage is INTERVIEW_READY
    assert.equal(compResult.stage, 'INTERVIEW_READY');
    assert.ok(compResult.signatureHash);

    // 6. Submissions updated
    const updatedSub = await submissionModel.findById('sub-app-1');
    assert.equal(updatedSub.siteApprovalCompleted, true);
    assert.ok(updatedSub.signature.file);
    assert.equal(updatedSub.signature.sha256, compResult.signatureHash);

    // 7. Token is now consumed; inspect or reuse must fail
    const reusedInsp = await approvalService.inspect(issueResult.rawToken, { discordId: '123456789012345678' });
    assert.equal(reusedInsp.status, 'INVALID');

    await assert.rejects(
      () => approvalService.complete({
        rawToken: issueResult.rawToken,
        authenticatedUser: { discordId: '123456789012345678', username: 'Alp' },
        agreements: { truthful: true, guidelines: true, commitments: true },
        strokes
      }),
      (err) => err.statusCode === 410
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
