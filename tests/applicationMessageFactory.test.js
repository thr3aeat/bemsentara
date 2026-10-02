const test = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags } = require('discord.js');

const kinds = ['site-approval', 'approval-complete', 'question', 'time-approved', 'accepted', 'rejected', 'interview-finished'];

test('all application messages are personalized, accent-free Components v2 with public site links', () => {
  const { buildApplicationMessage } = require('../bot/services/applicationMessageFactory');
  for (const kind of kinds) {
    const payload = buildApplicationMessage(kind, {
      baseUrl: 'https://example.test', candidateName: 'Ada', formTitle: 'Geliştirici Başvurusu', reference: 'REF-42',
      question: 'Portföyün?', scheduledTime: '3 Ekim 20:00', reason: 'Deneyim', primaryPath: '/applications/REF-42/approval'
    });
    assert.equal(payload.flags, MessageFlags.IsComponentsV2);
    assert.equal(payload.content, undefined);
    assert.equal(payload.embeds, undefined);
    assert.equal(JSON.stringify(payload).includes('accent_color'), false);
    const serialized = JSON.stringify(payload);
    assert.match(serialized, /Ada/);
    assert.match(serialized, /Geliştirici Başvurusu/);
    assert.match(serialized, /REF-42/);
    assert.match(serialized, /EkoYıldız People & Community/);
    const urls = [...serialized.matchAll(/"url":"([^"]+)"/g)].map((match) => match[1]);
    assert.ok(urls.length >= 2, `${kind} should contain site links`);
    assert.ok(urls.every((url) => /^https:\/\/example\.test\/(?:applications|yardim|blog|video-blog|forms|ekoyildizda-calis)/.test(url)), `${kind} has non-public link`);
  }
});

test('message kinds contain their relevant context and one primary site action', () => {
  const { buildApplicationMessage } = require('../bot/services/applicationMessageFactory');
  const question = JSON.stringify(buildApplicationMessage('question', { baseUrl: 'https://example.test', candidateName: 'Ada', formTitle: 'Form', reference: 'R1', question: 'Neden?' }));
  assert.match(question, /Neden/);
  const time = JSON.stringify(buildApplicationMessage('time-approved', { baseUrl: 'https://example.test', candidateName: 'Ada', formTitle: 'Form', reference: 'R1', scheduledTime: '20:00' }));
  assert.match(time, /20:00/);
  const rejected = JSON.stringify(buildApplicationMessage('rejected', { baseUrl: 'https://example.test', candidateName: 'Ada', formTitle: 'Form', reference: 'R1', reason: 'Kontenjan' }));
  assert.match(rejected, /Kontenjan/);
});

