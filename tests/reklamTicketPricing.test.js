'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REKLAM_PACKAGES,
  buildPackagePageEmbed,
  buildPackageBrowserComponents,
} = require('../bot/services/reklamTicketService');

test('reklam package catalog shows one transparent net price without discount mechanics', () => {
  const packagePage = buildPackagePageEmbed(0).data.description;
  const rows = buildPackageBrowserComponents(0, 'REKLAM-NET-1');
  const buttonLabels = rows.flatMap(row => row.components.map(component => component.data.label || ''));

  assert.equal(REKLAM_PACKAGES[0].price, '30 TL');
  assert.equal(REKLAM_PACKAGES[0].discountPrice, undefined);
  assert.match(packagePage, /NET PAKET FİYATI/i);
  assert.doesNotMatch(packagePage, /indirim|fırsat|~~/i);
  assert.ok(buttonLabels.every(label => !/indirim|flaş|şans/i.test(label)));
});
