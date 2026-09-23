'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getFormDefinition,
  getOpenForms,
  validateFormPayload,
} = require('../server/forms/catalog');

test('only game moderation is unavailable and ambassador remains open', () => {
  assert.equal(getFormDefinition('game-moderation').status, 'maintenance');
  assert.ok(getOpenForms().some((form) => form.slug === 'community-ambassador'));
  assert.ok(getOpenForms().every((form) => form.slug !== 'game-moderation'));
});

test('bug report requires its core fields but accepts no evidence URL', () => {
  const form = getFormDefinition('bug-report');
  const invalid = validateFormPayload(form, {
    summary: '',
    steps: '',
    expected: '',
    actual: '',
  });

  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.summary, 'Bu alanı doldurman gerekiyor.');

  const valid = validateFormPayload(form, {
    summary: 'Profil ayarları kaydedilmiyor',
    steps: 'Profil > Kaydet',
    expected: 'Ayarların kaydedilmesi',
    actual: 'Buton yanıt vermiyor',
    evidenceUrl: '',
  });

  assert.equal(valid.valid, true);
});
