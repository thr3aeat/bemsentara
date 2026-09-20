'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  renderAdminControlCenterShell,
  adminControlCenterAssets,
  renderAdminMetric,
  renderAdminOverviewSkeleton,
} = require('../server/views/adminControlCenter');
const { renderAdminPage } = require('../server/views');

test('admin shell renders grouped navigation and escapes administrator identity', () => {
  const html = renderAdminControlCenterShell({
    user: { username: '<img src=x onerror=alert(1)>' },
    legacyContent: '<section id="adm-users">Users</section><section id="adm-bans">Bans</section>',
  });
  assert.match(html, /data-admin-shell/);
  assert.match(html, /data-admin-nav="overview"/);
  assert.match(html, /data-admin-nav="users"/);
  assert.match(html, /id="adm-users"/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(adminControlCenterAssets(), /\/public\/admin\/control-center\.css/);
});

test('admin metrics distinguish zero from unavailable data', () => {
  assert.match(renderAdminMetric(0, 'Açık ticket'), />0</);
  assert.match(renderAdminMetric(null, 'Açık ticket'), /Veri alınamadı/);
  const html = renderAdminOverviewSkeleton();
  assert.match(html, /data-admin-queue/);
  assert.match(html, /data-admin-live-users/);
  assert.match(html, /data-admin-services/);
});

test('existing admin workspaces are mounted inside the new control center shell', () => {
  const html = renderAdminPage({ username: 'admin', isAdmin: true });
  assert.match(html, /data-admin-shell/);
  assert.match(html, /id="adm-overview"/);
  assert.match(html, /id="adm-users"/);
  assert.match(html, /id="adm-bans"/);
  assert.match(html, /\/public\/admin\/control-center\.js/);
});

test('admin client source includes legacy aliases and hash routing', () => {
  const source = fs.readFileSync(path.join(__dirname, '../server/public/admin/control-center.js'), 'utf8');
  assert.match(source, /adm-users/);
  assert.match(source, /adm-bans/);
  assert.match(source, /adm-submissions/);
  assert.match(source, /hashchange/);
});

test('admin client uses textContent, handles forbidden responses and never injects API text with innerHTML', () => {
  const source = fs.readFileSync(path.join(__dirname, '../server/public/admin/control-center.js'), 'utf8');
  assert.match(source, /response\.status === 401 \|\| response\.status === 403/);
  assert.match(source, /textContent/);
  assert.doesNotMatch(source, /innerHTML\s*=\s*.*(?:data|item|message)/);
  assert.match(source, /data-admin-command-trigger/);
  assert.match(source, /Control|Meta/);
});

test('admin shell includes a reusable destructive-action confirmation dialog', () => {
  const html = renderAdminPage({ username: 'admin', isAdmin: true });
  assert.match(html, /data-admin-confirm-dialog/);
  assert.match(html, /data-admin-confirm-summary/);
  assert.match(html, /data-admin-confirm-submit/);
  assert.match(html, /class="[^"]*acc-legacy-workspace/);
});
