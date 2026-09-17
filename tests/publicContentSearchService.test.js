const test = require('node:test');
const assert = require('node:assert/strict');

const { searchPublicContent } = require('../server/services/publicContentSearchService');

test('search returns both Help and Safety results with real URLs', () => {
  const results = searchPublicContent('ticket');

  assert.ok(results.some((item) => item.kind === 'help' && item.url.startsWith('/help')));
  assert.ok(results.some((item) => item.kind === 'safety' && item.url.startsWith('/yardim/')));
});

test('search handles Turkish casing and deduplicates URLs', () => {
  const results = searchPublicContent('GÜVENLİK');
  const urls = results.map((item) => item.url);

  assert.ok(results.length > 0);
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(results.length <= 12);
});

test('empty and one-character queries return no results', () => {
  assert.deepEqual(searchPublicContent(''), []);
  assert.deepEqual(searchPublicContent('a'), []);
});
