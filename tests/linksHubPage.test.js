'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { renderLinksHubPage, LINKS_DATA } = require('../server/views/linksHubPage');

test('linksHubPage - Resmi Bağlantılar & Linkler Sayfası', async (t) => {
  await t.test('LINKS_DATA tam 10 resmi bağlantıyı içermeli', () => {
    assert.equal(LINKS_DATA.length, 10);
    const ids = LINKS_DATA.map(l => l.id);
    assert.ok(ids.includes('kick'));
    assert.ok(ids.includes('twitch'));
    assert.ok(ids.includes('youtube-main'));
    assert.ok(ids.includes('youtube-secondary'));
    assert.ok(ids.includes('tiktok'));
    assert.ok(ids.includes('discord'));
    assert.ok(ids.includes('yt-join'));
    assert.ok(ids.includes('itemsatis'));
    assert.ok(ids.includes('insta-eko'));
    assert.ok(ids.includes('insta-ege'));
  });

  await t.test('renderLinksHubPage geçerli HTML dönmeli', () => {
    const html = renderLinksHubPage();
    assert.equal(typeof html, 'string');
    assert.ok(html.length > 1000);
    assert.ok(html.includes('EkoYıldız'));
    assert.ok(html.includes('bio-profile-card'));
    assert.ok(html.includes('bio-search-input'));
    assert.ok(html.includes('bio-filters'));
  });

  await t.test('Liquid Glass ve Spotlight Refraction öğelerini içermeli', () => {
    const html = renderLinksHubPage();
    assert.ok(html.includes('bio-card-spotlight'));
    assert.ok(html.includes('backdrop-filter: blur(28px) saturate(210%)'));
    assert.ok(html.includes('bio-btn-copy'));
    assert.ok(html.includes('bio-btn-visit'));
  });

  await t.test('Tüm kategori filtrelerini ve arama kontrolünü barındırmalı', () => {
    const html = renderLinksHubPage();
    assert.ok(html.includes('data-filter="all"'));
    assert.ok(html.includes('data-filter="stream"'));
    assert.ok(html.includes('data-filter="video"'));
    assert.ok(html.includes('data-filter="community"'));
    assert.ok(html.includes('data-filter="support"'));
    assert.ok(html.includes('data-filter="instagram"'));
  });
});
