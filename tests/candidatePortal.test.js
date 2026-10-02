const test = require('node:test');
const assert = require('node:assert/strict');
const { createApplicationOperationsService } = require('../server/services/applicationOperationsService');
const { renderCandidatePortalPage } = require('../server/views/candidatePortalPage');

function makeRepo(records) {
  const store = new Map(records.map((item) => [String(item._id), structuredClone(item)]));
  return {
    async findAll() { return [...store.values()].map((item) => structuredClone(item)); },
    async findById(id) { return store.has(String(id)) ? structuredClone(store.get(String(id))) : null; },
    async findByReference(ref) {
      for (const rec of store.values()) {
        if (rec.reference === ref || String(rec._id) === ref) return structuredClone(rec);
      }
      return null;
    },
    async update(id, patch) {
      const current = store.get(String(id));
      if (!current) return null;
      const updated = { ...current, ...structuredClone(patch), updatedAt: new Date().toISOString() };
      store.set(String(id), updated);
      return structuredClone(updated);
    }
  };
}

test('candidate view exposes reference, timeline, sanitized history and hides internal notes and rubrics', async () => {
  const repo = makeRepo([
    {
      _id: 'sub-1',
      reference: 'EKO-26-10482',
      status: 'PENDING',
      formType: 'developer',
      formTitle: 'Geliştirici Ekibi Başvurusu',
      userId: 'user-123',
      targetDiscordId: '123456789012345678',
      discordUsername: 'Alp',
      applicationStage: 'INVITED_TO_INTERVIEW',
      interviewScheduledTime: '3 Ekim 2026, 20:00',
      interviewTimeApproved: true,
      candidateReady: false,
      internalNotes: [
        { text: 'Topluluk yönetimi güçlü. Teknik tarafta gelişmeli.', author: 'eko', visibility: 'Yalnızca EkoYıldız ekibi tarafından görülebilir' }
      ],
      evaluationRubric: {
        communication: 'Güçlü',
        overallRecommendation: 'İlerlet'
      },
      operationHistory: [
        { action: 'APPLICATION_CREATED', createdAt: '2026-10-01T10:00:00Z', description: 'Başvuru oluşturuldu.' },
        { action: 'add-internal-note', createdAt: '2026-10-01T11:00:00Z', internalOnly: true, payload: { noteText: 'Gizli' } }
      ]
    }
  ]);

  const service = createApplicationOperationsService({
    FormSubmission: repo,
    normalizeSubmissionAnswers: () => ({ sections: [] })
  });

  // Access by reference as the candidate owner
  const candidateData = await service.getCandidateView('EKO-26-10482', { discordId: '123456789012345678' });
  assert.equal(candidateData.reference, 'EKO-26-10482');
  assert.equal(candidateData.formTitle, 'Geliştirici Ekibi Başvurusu');
  assert.equal(candidateData.stage, 'INVITED_TO_INTERVIEW');
  assert.equal(candidateData.stageInfo.label, 'Mülakata Davet');

  // Verify internal notes and rubric are NOT leaked to candidate
  assert.equal('internalNotes' in candidateData.interview, false);
  assert.equal('evaluationRubric' in candidateData.interview, false);
  assert.equal(candidateData.operationHistory.length, 1);
  assert.equal(candidateData.operationHistory[0].action, 'APPLICATION_CREATED');

  // Render candidate portal page
  const html = renderCandidatePortalPage(candidateData, { discordId: '123456789012345678', username: 'Alp' });
  assert.match(html, /EKO-26-10482/);
  assert.match(html, /Mülakata Davet/);
  assert.match(html, /Aday Süreci İlerlemesi/);
  assert.match(html, /Görüşmeye hazır mısınız\?/);
  assert.match(html, /Merak etmeyin, kravat zorunlu değil/);
  assert.doesNotMatch(html, /Gizli/);
  assert.doesNotMatch(html, /Topluluk yönetimi güçlü/);
});

test('candidate view rejects unauthorized access from a different discord user', async () => {
  const repo = makeRepo([
    {
      _id: 'sub-2',
      reference: 'EKO-26-99999',
      userId: 'user-real',
      targetDiscordId: '111111111111111111',
      discordUsername: 'Alp'
    }
  ]);

  const service = createApplicationOperationsService({
    FormSubmission: repo,
    normalizeSubmissionAnswers: () => ({ sections: [] })
  });

  // Attempt to access by another user
  await assert.rejects(
    () => service.getCandidateView('EKO-26-99999', { discordId: '222222222222222222', isAdmin: false, isStaff: false }),
    (err) => err.statusCode === 403
  );

  // Admin CAN access
  const adminView = await service.getCandidateView('EKO-26-99999', { discordId: '222222222222222222', isAdmin: true });
  assert.equal(adminView.reference, 'EKO-26-99999');
});

test('candidate check-in sets candidateReady to true', async () => {
  const repo = makeRepo([
    {
      _id: 'sub-3',
      reference: 'EKO-26-33333',
      applicationStage: 'INTERVIEW_SCHEDULED',
      candidateReady: false
    }
  ]);

  const service = createApplicationOperationsService({
    FormSubmission: repo,
    notifier: async () => ({ channel: 'none' }),
    normalizeSubmissionAnswers: () => ({ sections: [] })
  });

  const result = await service.performAction({
    id: 'EKO-26-33333',
    action: 'candidate-checkin',
    payload: {},
    actor: { id: 'cand-1', name: 'Aday' },
    idempotencyKey: 'checkin-test-1'
  });

  const updated = await repo.findById('sub-3');
  assert.equal(updated.candidateReady, true);
  assert.ok(updated.candidateReadyAt);
});
