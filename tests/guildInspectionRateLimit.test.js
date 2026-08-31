'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ROBLOXLAND_MESSAGE_BATCH_SIZE,
  ROBLOXLAND_MESSAGE_WINDOW_MS,
  sendChunkedMessages
} = require('../bot/services/guildInspectionCommands');

test('RobloxLand output sends at most 10 messages per 5-second batch', async () => {
  const sent = [];
  const waits = [];
  const message = {
    channel: {
      send: async payload => {
        sent.push(payload.content || payload);
        return payload;
      }
    }
  };
  const chunks = Array.from({ length: 25 }, (_, index) => `Normal çıktı ${index + 1}`);

  await sendChunkedMessages(message, chunks, {
    wait: async ms => waits.push(ms)
  });

  assert.equal(ROBLOXLAND_MESSAGE_BATCH_SIZE, 10);
  assert.equal(ROBLOXLAND_MESSAGE_WINDOW_MS, 5_000);
  assert.equal(sent.length, 25, 'normal çıktıların toplam mesaj sayısı kesilmemeli');
  assert.deepEqual(waits, [5_000, 5_000]);
  assert.equal(sent[24], 'Normal çıktı 25');
});

test('short output does not wait unnecessarily', async () => {
  const waits = [];
  const message = { channel: { send: async payload => payload } };

  await sendChunkedMessages(message, ['1', '2', '3'], {
    wait: async ms => waits.push(ms)
  });

  assert.deepEqual(waits, []);
});
