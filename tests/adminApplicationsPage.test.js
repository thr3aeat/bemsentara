const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { renderAdminApplicationsWorkspace, adminApplicationsAssets } = require('../server/views/adminApplications');
const { renderAdminPage } = require('../server/views');

test('applications workspace renders the queue, filters, retry state, and dossier tabs', () => {
  const html = renderAdminApplicationsWorkspace();
  assert.match(html, /data-admin-workspace="submissions"/);
  assert.match(html, /data-application-search/);
  assert.match(html, /data-application-status/);
  assert.match(html, /data-application-queue/);
  assert.match(html, /data-application-retry/);
  for (const label of ['Özet', 'Form Yanıtları', 'Mülakat', 'İmza ve Onay', 'İşlem Geçmişi']) assert.match(html, new RegExp(label));
  assert.match(adminApplicationsAssets(), /applications\.css/);
  assert.match(adminApplicationsAssets(), /applications\.js/);
});

test('admin page mounts exactly one submissions workspace and external assets', () => {
  const html = renderAdminPage({ username: 'admin', isAdmin: true });
  assert.equal((html.match(/data-admin-workspace="submissions"/g) || []).length, 1);
  assert.equal((html.match(/id="adm-submissions"/g) || []).length, 1);
  assert.match(html, /\/public\/admin\/applications\.css/);
  assert.match(html, /\/public\/admin\/applications\.js/);
});

test('browser controller has timeout, safe DOM rendering, latest request guard, and idempotent actions', () => {
  const source = fs.readFileSync(path.join(__dirname, '../server/public/admin/applications.js'), 'utf8');
  assert.match(source, /AbortController/);
  assert.match(source, /12000/);
  assert.match(source, /textContent/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /requestSequence/);
  assert.match(source, /Idempotency-Key/);
  assert.match(source, /admin:workspace-activated/);
});

