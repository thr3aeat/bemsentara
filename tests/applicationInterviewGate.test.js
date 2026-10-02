const test = require('node:test');
const assert = require('node:assert/strict');
const { assertInterviewGate, createApplicationOperationsService } = require('../server/services/applicationOperationsService');

function makeFakeRepo(records) {
  const map = new Map(records.map((r) => [String(r._id), structuredClone(r)]));
  return {
    async findById(id) {
      const rec = map.get(String(id));
      return rec ? structuredClone(rec) : null;
    },
    async update(id, patch) {
      const rec = map.get(String(id));
      if (!rec) return null;
      const updated = { ...rec, ...structuredClone(patch) };
      map.set(String(id), updated);
      return structuredClone(updated);
    }
  };
}

test('assertInterviewGate blocks completion and acceptance without signed approval', () => {
  // Missing both approval and signature
  assert.throws(
    () => assertInterviewGate({ applicationStage: 'INTERVIEW_SCHEDULED' }, 'accept-interview'),
    (err) => err.code === 'APPROVAL_AND_SIGNATURE_REQUIRED' && err.statusCode === 409
  );

  assert.throws(
    () => assertInterviewGate({ applicationStage: 'INTERVIEW_SCHEDULED' }, 'finish-interview'),
    (err) => err.code === 'APPROVAL_AND_SIGNATURE_REQUIRED' && err.statusCode === 409
  );

  // Approval completed but no signature
  assert.throws(
    () => assertInterviewGate({ siteApprovalCompleted: true }, 'finish-interview'),
    (err) => err.code === 'APPROVAL_AND_SIGNATURE_REQUIRED'
  );

  // Signature present but no approval completed
  assert.throws(
    () => assertInterviewGate({ signature: { file: 'sig.png' } }, 'finish-interview'),
    (err) => err.code === 'APPROVAL_AND_SIGNATURE_REQUIRED'
  );

  // Both approval and signature present -> does not throw
  assert.doesNotThrow(() => {
    assertInterviewGate({
      siteApprovalCompleted: true,
      signature: { file: 'sig.png', sha256: 'abc' }
    }, 'finish-interview');
  });

  assert.doesNotThrow(() => {
    assertInterviewGate({
      siteApprovalCompleted: true,
      signature: { file: 'sig.png', sha256: 'abc' }
    }, 'accept-interview');
  });

  // Other actions are never blocked by interview gate
  assert.doesNotThrow(() => {
    assertInterviewGate({}, 'schedule-interview');
  });
  assert.doesNotThrow(() => {
    assertInterviewGate({}, 'reject-interview');
  });
});

test('applicationOperationsService enforces interview gate on actions', async () => {
  const repo = makeFakeRepo([
    {
      _id: 'sub-gate-1',
      reference: 'EKO-26-55555',
      formTitle: 'Topluluk Elçisi Başvurusu',
      applicationStage: 'INTERVIEW_SCHEDULED',
      interviewScheduledTime: '4 Ekim 2026, 21:00',
      interviewTimeApproved: true,
      siteApprovalCompleted: false,
      signature: null
    }
  ]);

  const service = createApplicationOperationsService({
    FormSubmission: repo,
    notifier: async () => ({ channel: 'none' })
  });

  // 1. Proposing a new schedule time is allowed before approval
  const schedRes = await service.performAction({
    id: 'sub-gate-1',
    action: 'schedule-interview',
    payload: { scheduledTime: '5 Ekim 2026, 21:00' },
    actor: { name: 'Admin' },
    idempotencyKey: 'sched-1'
  });
  assert.ok(schedRes.application);

  // 2. Rejecting is always allowed even without approval
  const rejectCheckRepo = makeFakeRepo([
    {
      _id: 'sub-gate-rej',
      applicationStage: 'INTERVIEW_SCHEDULED',
      siteApprovalCompleted: false
    }
  ]);
  const rejectService = createApplicationOperationsService({
    FormSubmission: rejectCheckRepo,
    notifier: async () => ({ channel: 'none' })
  });
  const rejRes = await rejectService.performAction({
    id: 'sub-gate-rej',
    action: 'reject-interview',
    payload: { reason: 'Görüşmeye katılmadı' },
    actor: { name: 'Admin' },
    idempotencyKey: 'rej-1'
  });
  assert.equal(rejRes.application.stage, 'REJECTED');

  // 3. finish-interview must be rejected with 409
  await assert.rejects(
    () => service.performAction({
      id: 'sub-gate-1',
      action: 'finish-interview',
      payload: {},
      actor: { name: 'Admin' },
      idempotencyKey: 'finish-1'
    }),
    (err) => err.code === 'APPROVAL_AND_SIGNATURE_REQUIRED' && err.statusCode === 409
  );

  // 4. accept-interview must also be rejected with 409
  await assert.rejects(
    () => service.performAction({
      id: 'sub-gate-1',
      action: 'accept-interview',
      payload: {},
      actor: { name: 'Admin' },
      idempotencyKey: 'accept-1'
    }),
    (err) => err.code === 'APPROVAL_AND_SIGNATURE_REQUIRED' && err.statusCode === 409
  );

  // 5. Now update record with site approval and signature
  await repo.update('sub-gate-1', {
    siteApprovalCompleted: true,
    siteApprovalCompletedAt: new Date().toISOString(),
    signature: { file: 'data/application-signatures/sig_test.png', sha256: 'deadbeef' }
  });

  // 6. Now finish-interview succeeds!
  const finishRes = await service.performAction({
    id: 'sub-gate-1',
    action: 'finish-interview',
    payload: {},
    actor: { name: 'Admin' },
    idempotencyKey: 'finish-2'
  });
  assert.equal(finishRes.application.stage, 'FINISHED');
});
