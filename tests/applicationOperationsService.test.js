const test = require('node:test');
const assert = require('node:assert/strict');

function makeRepo(records) {
  const store = new Map(records.map((item) => [String(item._id), structuredClone(item)]));
  return {
    async findAll() { return [...store.values()].map((item) => structuredClone(item)); },
    async findById(id) { return store.has(String(id)) ? structuredClone(store.get(String(id))) : null; },
    async update(id, patch) {
      const current = store.get(String(id));
      if (!current) return null;
      const updated = { ...current, ...structuredClone(patch), updatedAt: new Date().toISOString() };
      store.set(String(id), updated);
      return structuredClone(updated);
    }
  };
}

test('lists applications using validated filters, search, and newest activity order', async () => {
  const { createApplicationOperationsService } = require('../server/services/applicationOperationsService');
  const service = createApplicationOperationsService({
    FormSubmission: makeRepo([
      { _id: 'old', status: 'PENDING', formType: 'developer', discordUsername: 'Ada', createdAt: '2026-01-01' },
      { _id: 'new', status: 'PENDING', formType: 'developer', discordUsername: 'Deniz', createdAt: '2026-01-02', updatedAt: '2026-02-01' },
      { _id: 'other', status: 'REJECTED', formType: 'moderator', discordUsername: 'Ada', createdAt: '2026-03-01' }
    ]),
    normalizeSubmissionAnswers: () => ({ sections: [] })
  });

  assert.deepEqual((await service.list({ status: 'PENDING', formType: 'developer' })).items.map((x) => x.id), ['new', 'old']);
  assert.deepEqual((await service.list({ search: 'ada' })).items.map((x) => x.id), ['other', 'old']);
  await assert.rejects(() => service.list({ status: 'NOT_REAL' }), (error) => error.statusCode === 400);
  await assert.rejects(() => service.list({ limit: 'wat' }), (error) => error.statusCode === 400);
});

test('detail exposes normalized answers and omits raw internal form data', async () => {
  const { createApplicationOperationsService } = require('../server/services/applicationOperationsService');
  const service = createApplicationOperationsService({
    FormSubmission: makeRepo([{ _id: '1', status: 'PENDING', formType: 'developer', formData: { motivation: 'Merak' } }]),
    normalizeSubmissionAnswers: () => ({ sections: [{ id: 'fit', title: 'Uyum', answers: [{ label: 'Neden?', value: 'Merak' }] }] })
  });
  const detail = await service.getDetail('1');
  assert.equal(detail.id, '1');
  assert.equal(detail.answers.sections[0].answers[0].value, 'Merak');
  assert.equal('formData' in detail, false);
  await assert.rejects(() => service.getDetail('missing'), (error) => error.statusCode === 404);
});

test('actions enforce transitions, persist notification failures, and allow retry', async () => {
  const { createApplicationOperationsService } = require('../server/services/applicationOperationsService');
  const repo = makeRepo([{ _id: '1', status: 'PENDING', formType: 'developer' }]);
  let notifications = 0;
  const notifier = async ({ action }) => {
    notifications += 1;
    if (action !== 'resend-notification') throw new Error('DM kapalı');
    return { channel: 'discord_dm' };
  };
  const service = createApplicationOperationsService({ FormSubmission: repo, notifier, normalizeSubmissionAnswers: () => ({ sections: [] }) });

  await assert.rejects(
    () => service.performAction({ id: '1', action: 'approve-time', actor: { id: 'a' }, idempotencyKey: 'bad-order' }),
    (error) => error.statusCode === 409
  );

  const reviewed = await service.performAction({ id: '1', action: 'start-review', actor: { id: 'a', name: 'Admin' }, idempotencyKey: 'review-1' });
  assert.equal(reviewed.application.stage, 'REVIEWING');
  assert.equal(reviewed.notification.state, 'FAILED');
  assert.match(reviewed.notification.error, /DM kapalı/);

  const retried = await service.performAction({ id: '1', action: 'resend-notification', actor: { id: 'a' }, idempotencyKey: 'retry-1' });
  assert.equal(retried.notification.state, 'SENT');
  assert.equal(notifications, 2);
});

test('same idempotency key replays the first result without notifying twice', async () => {
  const { createApplicationOperationsService } = require('../server/services/applicationOperationsService');
  const repo = makeRepo([{ _id: '1', status: 'PENDING' }]);
  let calls = 0;
  const service = createApplicationOperationsService({
    FormSubmission: repo,
    notifier: async () => { calls += 1; },
    normalizeSubmissionAnswers: () => ({ sections: [] })
  });
  const input = { id: '1', action: 'start-review', actor: { id: 'admin' }, idempotencyKey: 'same' };
  const first = await service.performAction(input);
  const replay = await service.performAction(input);
  assert.equal(calls, 1);
  assert.equal(replay.replayed, true);
  assert.equal(replay.application.stage, first.application.stage);
});
