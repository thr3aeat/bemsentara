'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { renderCreateTicketPage } = require('../server/views/createTicketPage');

test('renderCreateTicketPage generates a modern ticket form with preselected reklam category', () => {
  const mockUser = {
    discordId: '123456789012345678',
    discordUsername: 'ege_Test',
    discordAvatar: 'avatar123'
  };

  const html = renderCreateTicketPage(mockUser, [], { category: 'reklam', package: 'midroll' });

  assert.match(html, /📢 Reklam & Sponsorluk Talebi Oluştur|📢 Reklam \/ Sponsorluk & İş Birliği/);
  assert.match(html, /Sesli Mid-Roll/);
  assert.match(html, /100 TL/);
  assert.match(html, /30 TL/);
  assert.match(html, /670 TL/);
  assert.match(html, /İMPREİUS FAMİLY/);
  assert.match(html, /Asker Oyunu/);
  assert.match(html, /TTA/);
  assert.match(html, /rek-community/);
  assert.match(html, /rek-link/);
  assert.doesNotMatch(html, /EkoMaskot.*confirm|confirm\('EkoMaskot/i);
});

test('renderCreateTicketPage supports general support tickets smoothly', () => {
  const mockUser = {
    discordId: '123456789012345678',
    discordUsername: 'ege_Test',
  };

  const html = renderCreateTicketPage(mockUser, [], { category: 'technical' });

  assert.match(html, /🔧 Teknik \/ Bot Sorunları/);
  assert.match(html, /ticket-subject/);
  assert.match(html, /ticket-description/);
});
