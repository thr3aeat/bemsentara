const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
} = require('../server/views/platformChrome');

test('platform chrome exposes Help and Safety as separate destinations', () => {
  const html = renderPlatformHeader({ user: null, activePath: '/safety', theme: 'dark' });

  assert.match(html, /href="\/help"/);
  assert.match(html, /href="\/safety"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /data-global-search-trigger/);
});

test('platform chrome keeps authenticated account actions and escapes the username', () => {
  const html = renderPlatformHeader({
    user: { username: '<script>alert(1)</script>' },
    activePath: '/dashboard',
    theme: 'dark',
  });

  assert.match(html, /href="\/dashboard"/);
  assert.match(html, /href="\/logout"/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});

test('platform chrome keeps navigation and account controls in separate overflow-safe regions', () => {
  const html = renderPlatformHeader({
    user: { username: 'bu-kullanici-adi-cok-uzun-olabilir-ve-headeri-bozmamalidir' },
    activePath: '/blog',
    theme: 'light',
  });
  const styles = platformChromeStyles('light');

  assert.match(html, /class="platform-actions"/);
  assert.match(html, /class="platform-account-name"/);
  assert.match(styles, /grid-template-columns:max-content minmax\(0,1fr\) max-content/);
  assert.match(styles, /min-width:0/);
  assert.match(styles, /text-overflow:ellipsis/);
  assert.match(styles, /@media\(max-width:1120px\)/);
});

test('platform chrome supplies accessible footer, search dialog, styles and keyboard script', () => {
  assert.match(renderPlatformFooter({ theme: 'dark' }), /href="\/status"/);
  assert.match(renderSearchDialog({ theme: 'dark' }), /role="dialog"/);
  assert.match(renderSearchDialog({ theme: 'dark' }), /aria-live="polite"/);
  assert.match(platformChromeStyles('dark'), /prefers-reduced-motion/);
  assert.match(platformChromeScript(), /ctrlKey|metaKey/);
});
