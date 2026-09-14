'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { safetyGuides } = require('../server/views/knowledgeCenterData');
const { renderHelpHubPage, renderSafetyGuidePage } = require('../server/views/helpHubPage');

test('Safety Center exposes a complete set of community-specific guides', () => {
  assert.ok(Array.isArray(safetyGuides));
  assert.ok(safetyGuides.length >= 8);
  for (const guide of safetyGuides) {
    assert.ok(guide.slug);
    assert.ok(guide.sections.length >= 3);
    assert.ok(guide.sections.every((section) => section.body.length >= 120));
  }
});

test('Safety Center home links topics to real guide pages', () => {
  const html = renderHelpHubPage();
  assert.match(html, /href="\/yardim\/discord-sahte-dm-ve-phishing"/);
  assert.match(html, /href="\/yardim\/ticket-sorun-giderici"/);
});

test('Discord phishing guide renders actionable sections and the safety promise', () => {
  const html = renderSafetyGuidePage('discord-sahte-dm-ve-phishing');
  assert.match(html, /Sahte DM ve phishing/);
  assert.match(html, /Ne yapmalıyım\?/);
  assert.match(html, /Ne yapmamalıyım\?/);
  assert.match(html, /Sonraki adım/);
  assert.match(html, /Şifre, token veya doğrulama kodu istemeyiz/);
});

test('unknown Safety Center guide returns an informative not-found page', () => {
  const html = renderSafetyGuidePage('olmayan-rehber');
  assert.match(html, /Rehber bulunamadı/);
  assert.match(html, /\/yardim/);
});

test('Safety Center exposes category navigation and searchable guide metadata', () => {
  const html = renderHelpHubPage();
  assert.match(html, /id="topic-search"/);
  assert.match(html, /Ticket Kullanımı/);
  assert.match(html, /Dolandırıcılıktan Korunma/);
});
