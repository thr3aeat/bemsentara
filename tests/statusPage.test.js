const test = require('node:test');
const assert = require('node:assert/strict');

const { renderStatusPage } = require('../server/views');

test('status page does not claim invented uptime or operational monitoring', () => {
  const html = renderStatusPage(null);

  assert.doesNotMatch(html, /99\.98|18 ms|TÜM SİSTEMLER OPERASYONEL/);
  assert.match(html, /canlı izleme bağlı değil/i);
  assert.match(html, /doğrulanmış bir durum verisi yok/i);
});

test('status page lists known services without claiming their health', () => {
  const html = renderStatusPage(null);

  assert.match(html, /Web sitesi/);
  assert.match(html, /Authentication/);
  assert.match(html, /Discord Bot/);
  assert.match(html, /Ticket sistemi/);
});
