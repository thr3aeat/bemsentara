'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { getFormDefinition } = require('../server/forms/catalog');
const {
  renderFormsHubPage,
  renderFormPage,
  renderClosedFormPage,
} = require('../server/views/formsPage');
const express = require('express');
const pagesRouter = require('../server/routes/pages');
const sponsorAdService = require('../server/services/sponsorAdService');

async function requestPages(pathname) {
  const app = express();
  app.use((req, res, next) => { req.user = null; next(); });
  app.use(pagesRouter);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  try {
    const { port } = server.address();
    return await fetch(`http://127.0.0.1:${port}${pathname}`, { redirect: 'manual' });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('forms hub separates staff and other forms without legacy gaming UI', () => {
  const html = renderFormsHubPage(null);

  assert.match(html, /Yetkili Alımları/);
  assert.match(html, /Diğer Formlar/);
  assert.match(html, /Genel İletişim/);
  assert.doesNotMatch(html, /20 SAAT SONRA KAPANACAK|EKOYILDIZ APPLICATIONS/);
});

test('form page uses semantic labels, live feedback and responsive overflow protection', () => {
  const html = renderFormPage(null, getFormDefinition('bug-report'), null);

  assert.match(html, /<label[^>]*for="field-summary"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /overflow-wrap:anywhere/);
  assert.match(html, /@media\(max-width:760px\)/);
});

test('only maintenance form renders a disabled maintenance action', () => {
  const html = renderClosedFormPage(null, getFormDefinition('game-moderation'));

  assert.match(html, /Başvurular geçici olarak kapalı/);
  assert.match(html, /disabled/);
});

test('catalog routes render new forms while legacy aliases still redirect', async () => {
  const contact = await requestPages('/forms/contact');
  assert.equal(contact.status, 200);
  assert.match(await contact.text(), /Genel İletişim/);

  const alias = await requestPages('/forms/topluluk-elcisi');
  assert.equal(alias.status, 302);
  assert.equal(alias.headers.get('location'), '/forms/community-ambassador');
});

test('sponsor renderer exposes an empty state and complete active component', () => {
  const empty = sponsorAdService.renderSponsorAdHtml({ isActive: false });
  assert.match(empty, /sponsor-ad--empty/);
  assert.match(empty, /Şu anda gösterilecek sponsorlu bağlantı yok/);

  const active = sponsorAdService.renderSponsorAdHtml({
    _id: 'ad-1',
    title: 'EkoYıldız Store',
    description: 'Topluluğa özel ürünler',
    sponsorName: 'EkoYıldız',
    ctaText: 'İncele',
    imageUrl: 'https://example.com/logo.png',
    isActive: true,
  });
  assert.match(active, /role="complementary"/);
  assert.match(active, /rel="noopener noreferrer sponsored"/);
});
