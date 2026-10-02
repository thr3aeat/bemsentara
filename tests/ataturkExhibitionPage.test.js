const test = require('node:test');
const assert = require('node:assert/strict');

const { renderAtaturkExhibitionPage } = require('../server/views/ataturkExhibitionPage');

test('Atatürk exhibition embeds platform chrome output instead of renderer source code', () => {
  const html = renderAtaturkExhibitionPage(null);

  assert.ok((html.split('<style>').length - 1) >= 1);
  assert.doesNotMatch(html, /function platformChromeStyles/);
  assert.doesNotMatch(html, /function platformChromeScript/);
  assert.match(html, /document\.querySelectorAll\('\[data-dropdown\]'\)/);
});
