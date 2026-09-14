'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { preparePhibiPayload } = require('../bot/services/phibiDmFallback');

test('Phibi DM fallback converts the staff home action to a public link button', () => {
  const payload = preparePhibiPayload({
    content: 'Yetkili uygulamaları',
    components: [{
      type: 1,
      components: [{ type: 2, style: 1, custom_id: 'app_open_home', label: 'Ana Sayfa' }]
    }]
  });

  assert.equal(payload.content, 'Yetkili uygulamaları');
  assert.deepEqual(payload.components[0].components[0], {
    type: 2,
    style: 5,
    label: 'Ana Sayfa',
    url: 'https://ekoyildiz.duckdns.org/staff'
  });
});

test('Phibi DM fallback leaves unrelated component actions unchanged', () => {
  const payload = preparePhibiPayload({
    components: [{
      type: 1,
      components: [{ type: 2, style: 2, custom_id: 'ticket_close_123', label: 'Kapat' }]
    }]
  });

  assert.equal(payload.components[0].components[0].custom_id, 'ticket_close_123');
  assert.equal(payload.components[0].components[0].style, 2);
});
