'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { renderLinksHubPage, LINKS_DATA } = require('../server/views/linksHubPage');

test('linksHubPage - Resmi Bağlantılar Sayfası', async (t) => {
  const html = renderLinksHubPage(null);

  await t.test('LINKS_DATA tam 10 resmi bağlantıyı içermeli', () => {
    assert.equal(LINKS_DATA.length, 10);
    const ids = LINKS_DATA.map((l) => l.id);
    for (const id of ['kick', 'twitch', 'youtube-main', 'youtube-secondary', 'tiktok', 'discord', 'yt-join', 'itemsatis', 'insta-eko', 'insta-ege']) {
      assert.ok(ids.includes(id), id);
    }
  });

  await t.test('her bağlantı tam bir kez, yeni sekmede ve güvenli rel ile render edilir', () => {
    for (const l of LINKS_DATA) {
      assert.equal(html.split(`href="${l.url}"`).length - 1, 1, l.id);
      assert.ok(html.includes(`data-copy="${l.url}"`), `${l.id} kopyalama`);
    }
    assert.equal((html.match(/target="_blank" rel="noopener noreferrer" data-id=/g) || []).length, 10);
  });

  await t.test('bağlantılar kategorilere göre gruplanır', () => {
    for (const label of ['Canlı yayın', 'Video', 'Topluluk', 'Destek ol', 'Instagram']) assert.ok(html.includes(`>${label}</h2>`), label);
    assert.equal((html.match(/class="row" /g) || []).length, 10);
  });

  await t.test('şarkı oynatıcısı yalnızca dokununca yüklenir (otomatik çalma yok)', () => {
    assert.ok(html.includes('id="npToggle"'));
    assert.ok(html.includes('spotify:track:6hPPwiXH4Y4kmc121v9Fdg'));
    assert.ok(!/<iframe[^>]*spotify/.test(html.split('<script>').slice(0, 1).join('')), 'sayfa açılışında iframe yok');
    assert.ok(!/autoplay(?!;)/.test(html.split('<script>')[0]), 'otomatik oynatma özniteliği yok');
  });

  await t.test('HTML enjeksiyonuna karşı kaçış uygulanır', () => {
    const { LINKS_DATA: data } = require('../server/views/linksHubPage');
    const original = data[0].title;
    data[0].title = '<img src=x onerror=alert(1)>';
    try {
      const out = renderLinksHubPage(null);
      assert.ok(!out.includes('<img src=x onerror=alert(1)>'));
      assert.ok(out.includes('&lt;img src=x onerror=alert(1)&gt;'));
    } finally { data[0].title = original; }
  });

  await t.test('istemci betikleri sözdizimsel olarak geçerli', () => {
    const blocks = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    assert.ok(blocks.length >= 1);
    for (const b of blocks) assert.doesNotThrow(() => new Function(b));
  });
});
