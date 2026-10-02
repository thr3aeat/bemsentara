const test = require('node:test');
const assert = require('node:assert/strict');
const { renderApplicationApprovalPage } = require('../server/views/applicationApprovalPage');

test('renderApplicationApprovalPage renders active 3-step form with accessible controls', () => {
  const html = renderApplicationApprovalPage({
    status: 'VALID',
    rawToken: 'token-abc-123',
    submission: {
      reference: 'EKO-26-90210',
      formTitle: 'Etkinlik Ekibi Başvurusu',
      discordUsername: 'Alp',
      scheduledTime: '10 Ekim 2026, 21:00'
    },
    user: { username: 'Alp', discordId: '123456789' }
  });

  assert.match(html, /Etkinlik Ekibi Başvurusu/);
  assert.match(html, /EKO-26-90210/);
  assert.match(html, /@Alp/);
  assert.match(html, /10 Ekim 2026, 21:00/);
  assert.match(html, /id="approval-form"/);
  assert.match(html, /data-token="token-abc-123"/);
  assert.match(html, /id="chk-truthful"/);
  assert.match(html, /id="chk-guidelines"/);
  assert.match(html, /id="chk-commitments"/);
  assert.match(html, /id="signature-canvas"/);
  assert.match(html, /id="btn-clear-sig"/);
  assert.match(html, /id="btn-submit-approval"/);
  assert.match(html, /\/applications\/approval\.css/);
  assert.match(html, /\/applications\/approval\.js/);
});

test('renderApplicationApprovalPage renders success card when completed', () => {
  const html = renderApplicationApprovalPage({
    completed: true,
    submission: {
      reference: 'EKO-26-90210',
      formTitle: 'Etkinlik Ekibi Başvurusu'
    }
  });

  assert.match(html, /Taahhüt ve İmzanız Alındı/);
  assert.match(html, /Aday Merkezine Dön/);
  assert.match(html, /\/applications\/EKO-26-90210/);
});

test('renderApplicationApprovalPage renders forbidden and expired states', () => {
  const forbiddenHtml = renderApplicationApprovalPage({
    status: 'FORBIDDEN',
    error: 'Bu onay adımı yalnızca başvuru sahibi Discord hesabı tarafından imzalanabilir.'
  });
  assert.match(forbiddenHtml, /Yetkisiz Hesap Erişimi/);
  assert.match(forbiddenHtml, /Farklı Hesapla Giriş Yap/);

  const invalidHtml = renderApplicationApprovalPage({
    status: 'INVALID',
    error: 'Bu onay bağlantısının süresi dolmuş veya daha önce kullanılmış.'
  });
  assert.match(invalidHtml, /Bağlantı Geçersiz veya Süresi Dolmuş/);
  assert.match(invalidHtml, /Başvurularım/);
});
