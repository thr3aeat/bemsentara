'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SECRET_MESSAGE,
  buildSecretEasterEggPayload,
  handleEasterEggMessage,
  handleEasterEggInteraction
} = require('../bot/services/secretEasterEggService');

test('SECRET_MESSAGE contains the exact founder message', () => {
  assert.equal(
    SECRET_MESSAGE,
    "Dikkat! bu mesaj sunucunun kurucusu eko yani ege izmirli tarafından saklanmıştır. Bu mesajı görüyorsanız aferin! :D"
  );
});

test('buildSecretEasterEggPayload returns Components V2 container with founder message', () => {
  const payload = buildSecretEasterEggPayload();
  assert.ok(payload);
  const jsonStr = JSON.stringify(payload.components[0]);
  assert.match(jsonStr, /GİZLİ PASKALYA YUMURTASI BULUNDU/);
  assert.match(jsonStr, /ege izmirli/);
  assert.match(jsonStr, /aferin! :D/);
});

test('handleEasterEggMessage replies to secret triggers', async () => {
  let repliedPayload = null;
  const mockMessage = {
    content: 'e!eko',
    author: { bot: false },
    reply: async (p) => { repliedPayload = p; }
  };

  const handled = await handleEasterEggMessage(mockMessage);
  assert.equal(handled, true);
  assert.ok(repliedPayload);
  assert.match(JSON.stringify(repliedPayload.components[0]), /ege izmirli/);
});

test('handleEasterEggInteraction handles secret button clicks', async () => {
  let replyPayload = null;
  const mockInteraction = {
    customId: 'eko_easter_egg_secret_settings',
    reply: async (p) => { replyPayload = p; }
  };

  const handled = await handleEasterEggInteraction(mockInteraction);
  assert.equal(handled, true);
  assert.equal(replyPayload.ephemeral, true);
  assert.match(JSON.stringify(replyPayload.components[0]), /ege izmirli/);
});
