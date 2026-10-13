'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const { renderTeamPage } = require('../server/views/teamPage');
const { renderSiteMapPage, SECTIONS } = require('../server/views/siteMapPage');

it('ekip sayfası: eko kurucu, Zyrox danışman, avatar yoksa baş harf', () => {
  const html = renderTeamPage(null, { avatars: { eko: 'https://cdn.discordapp.com/a.png' } });
  assert.ok(html.includes('Kurucu · İçerik Üreticisi'));
  assert.ok(html.includes('Ekip Danışmanı'));
  assert.ok(html.includes('src="https://cdn.discordapp.com/a.png"'));
  for (const n of ['nonolive', 'HepsaBey', 'zencisynxx']) assert.ok(html.includes(n), n);
});

it('site haritası yönetim/personel/gizli sayfaları içermez', () => {
  const paths = SECTIONS.flatMap((s) => s.items.map((i) => i[0]));
  for (const p of paths) assert.ok(!/admin|staff|debug|dashboard|settings|webhook|profile|recovery|bakim/.test(p), p);
  assert.ok(paths.includes('/ekip') && paths.includes('/linkler'));
  assert.ok(renderSiteMapPage(null).includes(`Herkese açık ${paths.length} sayfa`));
});
