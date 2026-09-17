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

test('platform chrome supplies accessible footer, search dialog, styles and keyboard script', () => {
  assert.match(renderPlatformFooter({ theme: 'dark' }), /href="\/status"/);
  assert.match(renderSearchDialog({ theme: 'dark' }), /role="dialog"/);
  assert.match(renderSearchDialog({ theme: 'dark' }), /aria-live="polite"/);
  assert.match(platformChromeStyles('dark'), /prefers-reduced-motion/);
  assert.match(platformChromeScript(), /ctrlKey|metaKey/);
});
