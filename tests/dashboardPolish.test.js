const test = require('node:test');
const assert = require('node:assert/strict');

const { renderDashboard } = require('../server/views');

test('dashboard leads with role-aware priorities without removing existing actions', () => {
  const html = renderDashboard({ discordId: '1', username: 'Eko', isStaff: false, isAuthorized: false }, null);

  assert.match(html, /İyi günler, Eko/);
  assert.match(html, /Hızlı işlemler/);
  assert.match(html, /BEKLEYEN İŞLEMLER/);
  assert.match(html, /href="\/tickets\/new"/);
  assert.match(html, /href="\/help"/);
  assert.match(html, /href="\/safety"/);
});

test('staff dashboard keeps staff destination and explains missing progress honestly', () => {
  const html = renderDashboard({ discordId: '2', username: 'Mod', isStaff: true, isAuthorized: true }, null);

  assert.match(html, /href="\/staff"/);
  assert.match(html, /Personel kaydı henüz yüklenmedi/);
});
