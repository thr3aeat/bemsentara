'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const { injectOg, isKnownPath } = require('../server/services/ogMeta');

const req = (p) => ({ path: p, headers: { 'x-forwarded-proto': 'https' }, get: () => 'site.test' });

it('sayfaya özel OG etiketleri eklenir, eskileri tek kopya kalacak şekilde değiştirilir', () => {
  const html = '<html><head><title>X</title><meta property="og:title" content="eski"></head><body></body></html>';
  const out = injectOg(html, req('/linkler'));
  assert.equal((out.match(/og:title/g) || []).length, 1);
  assert.ok(out.includes('content="https://site.test/og/card.png?p=%2Flinkler"'));
  assert.ok(out.includes('name="twitter:card" content="summary_large_image"'));
});

it('bilinmeyen sayfa başlığını <title>dan alır; rastgele yollar görsel üretmez', () => {
  const out = injectOg('<html><head><title>Liderlik — EkoYıldız</title></head></html>', req('/leaderboard'));
  assert.ok(out.includes('og:title" content="Liderlik"'));
  assert.equal(isKnownPath('/leaderboard'), true);
  assert.equal(isKnownPath('/rastgele-' + Date.now()), false);
  assert.equal(injectOg('{"a":1}', req('/x')), '{"a":1}');
});
