'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { getFormDefinitionByType } = require('../server/forms/catalog');
const { normalizeSubmissionAnswers } = require('../server/services/submissionAnswerNormalizer');

test('flat catalog answers render in catalog order with their real question labels', () => {
  const definition = getFormDefinitionByType('contact');
  const result = normalizeSubmissionAnswers({
    formType: 'contact',
    formData: {
      replyPreference: 'Discord',
      message: 'Etkinliğe nasıl katılırım?',
      subject: 'Topluluk sorusu',
    },
  }, definition);

  assert.equal(result.sections.length, 1);
  assert.equal(result.sections[0].title, 'Mesajın');
  assert.deepEqual(result.sections[0].answers.map((answer) => answer.id), [
    'subject',
    'message',
    'replyPreference',
  ]);
  assert.deepEqual(result.sections[0].answers.map((answer) => answer.label), [
    'Konu',
    'Mesajın',
    'Geri dönüş tercihin',
  ]);
  assert.equal(result.sections[0].answers[0].value, 'Topluluk sorusu');
});

test('explicit false and empty optional answers are preserved as answered values', () => {
  const definition = {
    formType: 'custom',
    sections: [{
      id: 'declarations',
      title: 'Beyanlar',
      fields: [
        { name: 'accepted', label: 'Kabul ediyor musun?', type: 'checkbox' },
        { name: 'note', label: 'Ek not', type: 'textarea', required: false },
      ],
    }],
  };
  const result = normalizeSubmissionAnswers({
    formType: 'custom',
    formData: { accepted: false, note: '' },
  }, definition);

  assert.deepEqual(result.sections[0].answers.map((answer) => ({
    id: answer.id,
    value: answer.value,
    answered: answer.answered,
  })), [
    { id: 'accepted', value: false, answered: true },
    { id: 'note', value: '', answered: true },
  ]);
});

test('nested legacy answers preserve booleans arrays choices and unknown historical keys', () => {
  const result = normalizeSubmissionAnswers({
    formType: 'legacy_form',
    formData: {
      section1: {
        confirmed: false,
        skills: ['Planlama', 'İletişim'],
        ethics: { choice: 'Kısmen Katılıyorum', reason: 'Duruma göre değerlendiririm.' },
        old_private_note: 'Arşiv değeri',
      },
    },
  }, null);

  assert.equal(result.sections[0].id, 'section1');
  assert.equal(result.sections[0].legacy, true);
  assert.deepEqual(result.sections[0].answers.map((answer) => answer.valueType), [
    'boolean',
    'array',
    'choice',
    'text',
  ]);
  assert.deepEqual(result.sections[0].answers[1].value, ['Planlama', 'İletişim']);
  assert.deepEqual(result.sections[0].answers[2].value, {
    choice: 'Kısmen Katılıyorum',
    reason: 'Duruma göre değerlendiririm.',
  });
  assert.equal(result.sections[0].answers[3].label, 'Old private note');
  assert.equal(result.sections[0].answers[3].value, 'Arşiv değeri');
});
