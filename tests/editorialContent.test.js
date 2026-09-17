const test = require('node:test');
const assert = require('node:assert/strict');

const { renderBlogPage, renderBlogPostPage } = require('../server/views/helpHubPage');
const { renderVideoBlogPage, videoEntries } = require('../server/views/videoBlogPage');
const { searchPublicContent } = require('../server/services/publicContentSearchService');

test('blog exposes editorial category, author, reading time and Video Blog cross-link', () => {
  const listing = renderBlogPage();
  const article = renderBlogPostPage('yeni-moderasyon-araclari');

  assert.match(listing, /Video Blog/);
  assert.match(listing, /Yazar/);
  assert.match(article, /dk okuma/);
});

test('video blog exports safe metadata and links back to Blog', () => {
  const html = renderVideoBlogPage();

  assert.ok(Array.isArray(videoEntries));
  assert.ok(videoEntries.length >= 10);
  assert.match(html, /href="\/blog"/);
});

test('video entries are searchable as YouTube content', () => {
  const results = searchPublicContent('kamp');
  assert.ok(results.some((item) => item.kind === 'video'));
});
