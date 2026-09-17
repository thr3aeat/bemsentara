const test = require('node:test');
const assert = require('node:assert/strict');

const { renderMainHomePage } = require('../server/views/home/mainHomePage');

test('homepage exposes separate Help and Safety destinations plus command search', () => {
  const html = renderMainHomePage(null);

  assert.match(html, /href="\/help"/);
  assert.match(html, /href="\/safety"/);
  assert.match(html, /data-global-search-trigger/);
  assert.match(html, /href="\/blog"/);
  assert.match(html, /href="\/video-blog"/);
});

test('homepage keeps existing community links and easter egg', () => {
  const html = renderMainHomePage(null);

  assert.match(html, /discord\.gg\/rEu5gvRBdM/);
  assert.match(html, /discord\.gg\/tfykdvvdPT/);
  assert.match(html, /star-button/);
  assert.match(html, /api\/social-stats/);
});
