'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { getFormDefinition } = require('../server/forms/catalog');
const {
  renderFormsHubPage,
  renderFormPage,
  renderClosedFormPage,
} = require('../server/views/formsPage');

test('forms hub separates staff and other forms without legacy gaming UI', () => {
  const html = renderFormsHubPage(null);

  assert.match(html, /Yetkili Alımları/);
  assert.match(html, /Diğer Formlar/);
  assert.match(html, /Genel İletişim/);
  assert.doesNotMatch(html, /20 SAAT SONRA KAPANACAK|EKOYILDIZ APPLICATIONS/);
});

test('form page uses semantic labels, live feedback and responsive overflow protection', () => {
  const html = renderFormPage(null, getFormDefinition('bug-report'), null);

  assert.match(html, /<label[^>]*for="field-summary"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /overflow-wrap:anywhere/);
  assert.match(html, /@media\(max-width:760px\)/);
});

test('only maintenance form renders a disabled maintenance action', () => {
  const html = renderClosedFormPage(null, getFormDefinition('game-moderation'));

  assert.match(html, /Başvurular geçici olarak kapalı/);
  assert.match(html, /disabled/);
});
