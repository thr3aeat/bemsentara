const test = require('node:test');
const assert = require('node:assert/strict');

const { renderLinksHubPage, LINKS_DATA } = require('../server/views/linksHubPage');

test('links hub page contains all requested broadcast, video, support and instagram links', () => {
  const html = renderLinksHubPage(null);

  // Canlı Yayınlar
  assert.match(html, /https:\/\/kick\.com\/ekoyildiz/);
  assert.match(html, /https:\/\/www\.twitch\.tv\/ekoyildiz/);

  // YouTube & Video
  assert.match(html, /https:\/\/www\.youtube\.com\/@eko8yildiz/);
  assert.match(html, /https:\/\/www\.youtube\.com\/@eko8yildiz2/);
  assert.match(html, /https:\/\/www\.tiktok\.com\/@kimdirbueko/);
  assert.match(html, /https:\/\/discord\.gg\/XJWnqx9DQC/);

  // Destek & Üyelik
  assert.match(html, /https:\/\/www\.youtube\.com\/channel\/UCNSZYtuDQYsZYYQVJvErDVw\/join/);
  assert.match(html, /https:\/\/www\.itemsatis\.com\/destekle\/ekoyildiz/);

  // Instagram Adreslerimiz
  assert.match(html, /https:\/\/www\.instagram\.com\/ekonqt\//);
  assert.match(html, /https:\/\/www\.instagram\.com\/egee7dino\//);
});

test('links hub page includes interactive filters, copy buttons and liquid glass optics', () => {
  const html = renderLinksHubPage(null);

  // Category filters
  assert.match(html, /data-filter="all"/);
  assert.match(html, /data-filter="stream"/);
  assert.match(html, /data-filter="video"/);
  assert.match(html, /data-filter="support"/);
  assert.match(html, /data-filter="instagram"/);

  // Copy to clipboard attributes
  assert.match(html, /data-copy-url="https:\/\/kick\.com\/ekoyildiz"/);
  assert.match(html, /data-copy-url="https:\/\/www\.twitch\.tv\/ekoyildiz"/);
  assert.match(html, /id="btnShareProfile"/);

  // Liquid glass optics and platform chrome
  assert.match(html, /platform-header/);
  assert.match(html, /bio-profile-card/);
  assert.match(html, /bio-link-card/);
  assert.match(html, /data-theme="dark"/);
});

test('LINKS_DATA catalog contains 10 structured destinations with verified targets', () => {
  assert.equal(LINKS_DATA.length, 10);
  const ids = LINKS_DATA.map(l => l.id);
  assert.deepEqual(ids, [
    'kick',
    'twitch',
    'youtube-main',
    'youtube-secondary',
    'tiktok',
    'discord',
    'yt-join',
    'itemsatis',
    'insta-eko',
    'insta-ege'
  ]);
});
