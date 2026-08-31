'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildAgeVerificationPanelPayload,
  createWavHeader,
  handleAgeVerificationInteraction,
  TEKERLEMELER,
  AGE_VERIFY_PANEL_CHANNEL_ID,
  SENSITIVE_ROLE_ID,
  SENSITIVE_CATEGORY_ID,
  STAFF_LOG_CHANNEL_ID
} = require('../bot/services/robloxLandAgeVerificationService');

test('buildAgeVerificationPanelPayload returns valid components V2 payload without accent color and with divider', () => {
  const payload = buildAgeVerificationPanelPayload();
  assert.ok(payload);
  assert.ok(Array.isArray(payload.components));
  assert.equal(payload.components[0].type, 17); // Container
  assert.equal(payload.components[0].accent_color, undefined); // Accent colorsuz
  assert.ok(payload.components[0].components.some(c => c.type === 14 && c.divider === true)); // Çizgili ayrıcı
  assert.ok(payload.components[0].components.some(c => c.type === 1)); // ActionRow with buttons
});

test('createWavHeader generates a valid 44-byte WAV header', () => {
  const pcmLength = 96000;
  const header = createWavHeader(pcmLength, 48000, 2, 16);

  assert.equal(header.length, 44);
  assert.equal(header.toString('ascii', 0, 4), 'RIFF');
  assert.equal(header.toString('ascii', 8, 12), 'WAVE');
  assert.equal(header.toString('ascii', 12, 16), 'fmt ');
  assert.equal(header.toString('ascii', 36, 40), 'data');
  assert.equal(header.readUInt32LE(40), pcmLength);
});

test('tekerleme pool has at least 15 rich Turkish tekerlemes', () => {
  assert.ok(Array.isArray(TEKERLEMELER));
  assert.ok(TEKERLEMELER.length >= 15);
  for (const t of TEKERLEMELER) {
    assert.ok(typeof t === 'string' && t.length > 10);
  }
});

test('unauthorized users cannot click ticket management buttons', async () => {
  let replyContent = '';
  let replyEphemeral = false;

  const mockNonStaffInteraction = {
    customId: 'robloxland_age_ask_speak_yas-1234',
    member: {
      permissions: {
        has: () => false
      },
      roles: {
        cache: new Map()
      }
    },
    reply: async (opts) => {
      replyContent = opts.content;
      replyEphemeral = opts.ephemeral;
    }
  };

  const res = await handleAgeVerificationInteraction(mockNonStaffInteraction);
  assert.ok(replyContent.includes('yalnızca RobloxLand yetkilileri'));
  assert.equal(replyEphemeral, true);
});
