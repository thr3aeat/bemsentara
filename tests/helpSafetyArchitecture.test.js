const test = require('node:test');
const assert = require('node:assert/strict');

const { renderSafetyCenterPage } = require('../server/views/helpHubPage');
const { renderProductHelpCenterPage } = require('../server/views/productHelpCenterPage');

test('Safety Center is canonical while legacy guide URLs remain available', () => {
  const html = renderSafetyCenterPage(null);

  assert.match(html, /EKOYILDIZ SAFETY CENTER/);
  assert.match(html, /href="\/yardim\/discord-sahte-dm-ve-phishing"/);
  assert.match(html, /href="\/help"/);
});

test('Safety Center does not publish unverified moderation statistics', () => {
  const html = renderSafetyCenterPage(null);

  assert.doesNotMatch(html, />428</);
  assert.doesNotMatch(html, />1\.824</);
  assert.match(html, /henüz doğrulanmış veri bulunmuyor/i);
});

test('Help Center contains product support categories and links to Safety', () => {
  const html = renderProductHelpCenterPage(null);

  assert.match(html, /Hesap ve giriş/);
  assert.match(html, /EkoYıldız Bot/);
  assert.match(html, /Panel ve özellikler/);
  assert.match(html, /href="\/safety"/);
  assert.match(html, /href="\/tickets\/new"/);
});
