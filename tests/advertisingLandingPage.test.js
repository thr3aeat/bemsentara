'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { renderAdvertisingLandingPage } = require('../server/views/advertisingLandingPage');
const {
  buildPackageBrowserComponents,
  getAdvertisingLandingUrl,
} = require('../bot/services/reklamTicketService');
const { renderPlatformHeader, renderPlatformFooter } = require('../server/views/platformChrome');

test('private advertising landing page explains value and uses honest net pricing', () => {
  const html = renderAdvertisingLandingPage(null);

  assert.match(html, /Neden EkoYıldız’da reklam/i);
  assert.match(html, /Fiyatlar neden böyle/i);
  assert.match(html, /30 TL/);
  assert.match(html, /670 TL/);
  assert.match(html, /href="\/tickets\/new\?category=reklam"/);
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(html, /sahte|garantili satış|kesin dönüşüm/i);
});

test('advertising landing stays unlisted but has a direct route', () => {
  const routeSource = fs.readFileSync(path.join(__dirname, '../server/routes/pages.js'), 'utf8');
  const chrome = renderPlatformHeader({ user: null }) + renderPlatformFooter();

  assert.match(routeSource, /router\.get\("\/reklam\/ekoyildiz-ortaklik"/);
  assert.doesNotMatch(chrome, /\/reklam\/ekoyildiz-ortaklik/);
});

test('Discord advertising catalog links to the private sales guide', () => {
  assert.equal(
    getAdvertisingLandingUrl('http://localhost:3000'),
    'https://ekoyildiz.duckdns.org/reklam/ekoyildiz-ortaklik'
  );

  const rows = buildPackageBrowserComponents(0, 'REKLAM-LINK-1');
  const urls = rows.flatMap(row => row.components.map(component => component.data.url).filter(Boolean));

  assert.ok(urls.some(url => /\/reklam\/ekoyildiz-ortaklik$/.test(url)));
});
