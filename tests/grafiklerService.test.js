'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  recordCommand,
  recordButtonClick,
  recordModalSubmit,
  get7DayAnalytics,
  generateQuickChartUrl
} = require('../bot/services/usageTracker');
const { sendGrafiklerMenu } = require('../bot/services/grafiklerService');

test('usageTracker records commands, buttons, and modals correctly', () => {
  recordCommand('s!sil', 'user101', 'guild01');
  recordCommand('/dogrula', 'user102', 'guild01');
  recordButtonClick('verify_roblox_start', 'user101', 'guild01');
  recordButtonClick('ticket_create_genel', 'user103', 'guild01');
  recordModalSubmit('ticket_modal_submit', 'user101', 'guild01');

  const analytics = get7DayAnalytics();
  assert.ok(analytics.today.totalCommands >= 2);
  assert.ok(analytics.today.totalButtonClicks >= 2);
  assert.ok(analytics.today.totalModalSubmits >= 1);

  assert.ok(analytics.topButtons.length > 0);
  assert.ok(analytics.topCommands.length > 0);
});

test('generateQuickChartUrl generates valid QuickChart URL strings', () => {
  const lineUrl = generateQuickChartUrl('line');
  assert.ok(lineUrl.includes('https://quickchart.io/chart?c='));
  assert.ok(lineUrl.includes('line'));

  const donutUrl = generateQuickChartUrl('donut');
  assert.ok(donutUrl.includes('https://quickchart.io/chart?c='));
  assert.ok(donutUrl.includes('doughnut'));
});

test('sendGrafiklerMenu formats embed response and buttons', async () => {
  let repliedPayload = null;
  const fakeInteraction = {
    isRepliable: true,
    replied: false,
    deferred: false,
    reply: async (payload) => {
      repliedPayload = payload;
      return payload;
    }
  };

  await sendGrafiklerMenu(fakeInteraction, 'trend');
  assert.ok(repliedPayload);
  assert.ok(repliedPayload.embeds.length === 1);
  assert.ok(repliedPayload.components.length === 1);
  assert.equal(repliedPayload.embeds[0].data.title, '📊 Sentara Bot — Canlı Sistem Kullanım Grafiği');

  await sendGrafiklerMenu(fakeInteraction, 'donut');
  assert.equal(repliedPayload.embeds[0].data.title, '🍩 Sistem Bazlı Kullanım Dağılım Grafiği');

  await sendGrafiklerMenu(fakeInteraction, 'buttons');
  assert.equal(repliedPayload.embeds[0].data.title, '🔘 Buton İstatistikleri & Günlük Basılma Oranları');

  await sendGrafiklerMenu(fakeInteraction, 'commands');
  assert.equal(repliedPayload.embeds[0].data.title, '📜 Komut İstatistikleri & Günlük Çalıştırılma Oranları');
});
