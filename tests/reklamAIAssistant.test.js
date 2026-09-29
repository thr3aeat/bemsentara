'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { answerAdvertisingQuestion, REKLAM_AI_SYSTEM_PROMPT } = require('../server/services/reklamAIAssistantService');
const { renderAdvertisingLandingPage } = require('../server/views/advertisingLandingPage');

test('REKLAM_AI_SYSTEM_PROMPT includes crucial business and moderation rules', () => {
  assert.ok(REKLAM_AI_SYSTEM_PROMPT.includes('EKOai Reklam Danışmanı'));
  assert.ok(REKLAM_AI_SYSTEM_PROMPT.includes('Shorts paketine "Discord Duyurusu" EKLENEMEZ'));
  assert.ok(REKLAM_AI_SYSTEM_PROMPT.includes('İtemSatış'));
  assert.ok(REKLAM_AI_SYSTEM_PROMPT.includes('5.000+ GERÇEK'));
  assert.ok(REKLAM_AI_SYSTEM_PROMPT.includes('YGS veya GS'));
});

test('answerAdvertisingQuestion answers inquiry gracefully', async () => {
  const answer = await answerAdvertisingQuestion('Shorts paketine Discord duyurusu ekleyebilir miyim?');
  assert.ok(typeof answer === 'string');
  assert.ok(answer.length > 20);
  assert.ok(
    answer.toLowerCase().includes('discord') ||
    answer.toLowerCase().includes('shorts') ||
    answer.toLowerCase().includes('eklenemez') ||
    answer.toLowerCase().includes('içermez')
  );
});

test('renderAdvertisingLandingPage includes in-page EKOai section and floating assistant widget', () => {
  const html = renderAdvertisingLandingPage(null);
  assert.ok(html.includes('id="ekoai-danisman"'), 'Must have in-page EKOai section');
  assert.ok(html.includes('EKOai Reklam Danışmanına Sorun'), 'Must have section title');
  assert.ok(html.includes('id="ekoai-floating-widget"'), 'Must have floating assistant widget');
  assert.ok(html.includes('/api/reklam/ekoai-chat'), 'Must connect to advertising AI chat API');
});
