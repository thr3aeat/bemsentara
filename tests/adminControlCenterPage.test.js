'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderAdminControlCenterShell, adminControlCenterAssets } = require('../server/views/adminControlCenter');

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
