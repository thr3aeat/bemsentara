'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REKLAM_PACKAGES,
  buildPackagePageEmbed,
  buildPackageBrowserComponents,
  buildCorporateAdvertisingPanel,
  buildAdvertisingCommunicationPrompt,
  buildCorporatePackageOverview,
} = require('../bot/services/reklamTicketService');
const { MessageFlags, ButtonStyle } = require('discord.js');

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

test('corporate advertising panel uses accent-free Components v2 and neutral actions', () => {
  const payload = buildCorporateAdvertisingPanel({
    ticketId: 'REKLAM-KURUMSAL-1',
    userId: '123456789012345678',
    communityName: 'Örnek Kamp',
    targetLink: 'https://example.com',
    requestDetails: 'YouTube sponsorluğu',
  });
  const json = payload.components[0].toJSON();
  const buttons = json.components
    .filter(component => component.type === 1)
    .flatMap(row => row.components);

  assert.equal(payload.flags, MessageFlags.IsComponentsV2);
  assert.equal(json.accent_color, undefined);
  assert.equal(payload.embeds, undefined);
  assert.ok(buttons.some(button => button.style === ButtonStyle.Link && /ekoyildiz-ortaklik/.test(button.url)));
  assert.ok(buttons.every(button => [ButtonStyle.Secondary, ButtonStyle.Link].includes(button.style)));
});

test('corporate advertising panel states sponsorship value and Allied Armies eligibility clearly', () => {
  const payload = buildCorporateAdvertisingPanel({ ticketId: 'REKLAM-KURUMSAL-2' });
  const text = payload.components[0].toJSON().components
    .filter(component => component.type === 10)
    .map(component => component.content)
    .join('\n');

  assert.match(text, /Neden EkoYıldız ile sponsor olmalısınız/i);
  assert.match(text, /gerçek ve ilgili bir kitleye ulaş/i);
  assert.match(text, /üye artışı.*garanti edilmez/i);
  assert.match(text, /YGS veya GS/i);
  assert.match(text, /yalnızca ücretli reklam/i);
  assert.match(text, /rütbe fark etmez/i);
  assert.match(text, /5\.000\+ gerçek üye/i);
  assert.match(text, /bot hesaplar.*sayılmaz/i);
  assert.match(text, /bekleme süresi.*uzun/i);
  assert.doesNotMatch(text, /TL fark|indirim|fırsat|vergi.*jest|erişim sigortası/i);
});

test('advertising communication choice is a concise accent-free Components v2 prompt', () => {
  const payload = buildAdvertisingCommunicationPrompt('Alp');
  const json = payload.components[0].toJSON();
  const text = json.components
    .filter(component => component.type === 10)
    .map(component => component.content)
    .join('\n');
  const buttons = json.components
    .filter(component => component.type === 1)
    .flatMap(row => row.components);

  assert.equal(payload.flags, MessageFlags.IsComponentsV2);
  assert.equal(json.accent_color, undefined);
  assert.match(text, /iletişim kanalını seç/i);
  assert.match(text, /DM.*özel mesaj/i);
  assert.match(text, /Sunucu kanalı.*gizli/i);
  assert.ok(buttons.every(button => button.style === ButtonStyle.Secondary));
});

test('package overview stays corporate and does not reopen promotional sales mechanics', () => {
  const payload = buildCorporatePackageOverview('REKLAM-KURUMSAL-3');
  const json = payload.components[0].toJSON();
  const text = json.components
    .filter(component => component.type === 10)
    .map(component => component.content)
    .join('\n');
  const buttons = json.components
    .filter(component => component.type === 1)
    .flatMap(row => row.components);

  assert.equal(payload.flags, MessageFlags.IsComponentsV2);
  assert.equal(json.accent_color, undefined);
  assert.match(text, /30 TL/);
  assert.match(text, /500 TL/);
  assert.match(text, /başlangıç fiyat/i);
  assert.doesNotMatch(text, /garanti|indirim|fırsat|TL fark|kontenjan|sigorta/i);
  assert.ok(buttons.every(button => [ButtonStyle.Secondary, ButtonStyle.Link].includes(button.style)));
});
