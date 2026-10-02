const test = require('node:test');
const assert = require('node:assert/strict');
const { createApplicationOperationsService } = require('../server/services/applicationOperationsService');
const {
  generateFallbackGuide,
  generateFallbackWarmup,
  generateFallbackFeedback
} = require('../server/services/applicationAiService');
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

test('applicationAiService fallback generators produce high-quality structured guidance and feedback', () => {
  const mockSub = {
    formTitle: 'Topluluk Elçisi Başvurusu',
    discordUsername: 'Alp',
    interviewScheduledTime: '4 Ekim 2026, 21:00'
  };

  // 1. AI Guide Fallback
  const guide = generateFallbackGuide(mockSub);
  assert.ok(guide.candidateSummary.includes('Topluluk Elçisi'));
  assert.ok(Array.isArray(guide.strengths) && guide.strengths.length >= 2);
  assert.ok(Array.isArray(guide.riskFlags) && guide.riskFlags.length >= 1);
  assert.ok(Array.isArray(guide.recommendedQuestions) && guide.recommendedQuestions.length >= 3);
  assert.ok(guide.recommendedQuestions[0].question);
  assert.ok(guide.recommendedQuestions[0].idealResponseHint);

  // 2. Candidate Warmup Fallback
  const warmup = generateFallbackWarmup(mockSub);
  assert.ok(warmup.scenarioQuestion.includes('Simülasyon Senaryosu'));
  assert.ok(Array.isArray(warmup.prepTips) && warmup.prepTips.length >= 2);

  // 3. Candidate Feedback Fallback
  const feedback = generateFallbackFeedback('Kural ihlalinde önce sakin olurum, kayıt alır ve yetkiliye iletirim.');
  assert.ok(feedback.score >= 70 && feedback.score <= 100);
  assert.ok(feedback.feedback.length > 20);
  assert.ok(feedback.confidenceBoost.includes('başarılar') || feedback.confidenceBoost.includes('Harika'));
});

test('applicationOperationsService supports configuring pre-interview options and reflects in clientView', async () => {
  const repo = makeRepo([
    {
      _id: 'sub-ai-1',
      reference: 'EKO-26-88001',
      status: 'PENDING',
      formType: 'event_staff',
      formTitle: 'Etkinlik Ekibi Başvurusu',
      userId: 'user-77',
      targetDiscordId: '123456789012345678',
      discordUsername: 'Deniz',
      applicationStage: 'UNDER_REVIEW',
      interviewScheduledTime: null
    }
  ]);

  const service = createApplicationOperationsService({
    FormSubmission: repo,
    normalizeSubmissionAnswers: () => ({ sections: [] })
  });

  // Schedule interview with rich options
  const scheduled = await service.performAction({
    id: 'sub-ai-1',
    action: 'schedule-interview',
    payload: {
      scheduledTime: '5 Ekim 2026, 20:30',
      interviewTrack: 'VAKA_KRIZ',
      interviewTrackLabel: 'Vaka & Kriz Simülasyonu',
      interviewDifficulty: 'Zorlayıcı & Dinamik',
      interviewFocusAreas: ['Kriz Çözme', 'Rol Hakimiyeti', 'Baskı Altında İletişim'],
      candidateInstructions: 'Görüşmeden önce mikrofonunuzu test edin ve bekleme odasında hazır bulunun.'
    },
    actor: { id: 'admin-1', name: 'Yönetici' },
    idempotencyKey: 'test-sched-1'
  });

  const detailView = await service.getDetail('sub-ai-1');
  assert.equal(detailView.interview.scheduledTime, '5 Ekim 2026, 20:30');
  assert.equal(detailView.interview.interviewTrack, 'VAKA_KRIZ');
  assert.equal(detailView.interview.difficulty, 'Zorlayıcı & Dinamik');
  assert.deepEqual(detailView.interview.focusAreas, ['Kriz Çözme', 'Rol Hakimiyeti', 'Baskı Altında İletişim']);
  assert.equal(detailView.interview.candidateInstructions, 'Görüşmeden önce mikrofonunuzu test edin ve bekleme odasında hazır bulunun.');

  // Check candidate client view reflects these options
  const clientView = await service.getCandidateView('EKO-26-88001', { discordId: '123456789012345678' });
  assert.equal(clientView.interview.scheduledTime, '5 Ekim 2026, 20:30');
  assert.equal(clientView.interview.interviewTrackLabel, 'Vaka & Kriz Simülasyonu');
  assert.equal(clientView.interview.difficulty, 'Zorlayıcı & Dinamik');
  assert.equal(clientView.interview.candidateInstructions, 'Görüşmeden önce mikrofonunuzu test edin ve bekleme odasında hazır bulunun.');
});

test('candidatePortalPage renders live ticking countdown data, excitement hype banners, and AI warmup card', () => {
  const data = {
    reference: 'EKO-26-88001',
    formTitle: 'Etkinlik Ekibi Başvurusu',
    stage: 'INTERVIEW_SCHEDULED',
    stageInfo: { label: 'Mülakat Planlandı', nextStepText: 'Görüşme saatini bekleyiniz.' },
    candidate: { name: 'Deniz', discordId: '123456789012345678' },
    interview: {
      scheduledTime: '5 Ekim 2026, 20:30',
      interviewTrack: 'VAKA_KRIZ',
      interviewTrackLabel: 'Vaka & Kriz Simülasyonu',
      difficulty: 'Zorlayıcı & Dinamik',
      focusAreas: ['Kriz Çözme', 'Baskı Altında İletişim'],
      candidateInstructions: 'Mikrofonunuzu test ediniz.',
      candidateReady: false
    }
  };

  const html = renderCandidatePortalPage(data, { discordId: '123456789012345678' });

  // Countdown elements
  assert.match(html, /id="interview-countdown-box"/);
  assert.match(html, /data-scheduled-time="5 Ekim 2026, 20:30"/);
  assert.match(html, /CANLI MÜLAKAT GERİ SAYIMI/);
  assert.match(html, /id="cd-days"/);
  assert.match(html, /id="cd-secs"/);
  assert.match(html, /id="hype-panel"/);

  // Pre-interview options
  assert.match(html, /Vaka &amp; Kriz Simülasyonu/);
  assert.match(html, /Zorlayıcı &amp; Dinamik/);
  assert.match(html, /Mikrofonunuzu test ediniz/);

  // AI Warmup Simulator card
  assert.match(html, /YAPAY ZEKA MÜLAKAT PROVASI/);
  assert.match(html, /id="ai-warmup-card"/);
  assert.match(html, /startAiWarmup/);
});
