# Premium Loading Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fast, honest, reusable loading feedback to real public-user async flows while keeping the experience completely absent for admin and admin/mod users.

**Architecture:** A server renderer module decides eligibility through the existing `isSiteStaff(user)` helper, then emits one shared CSS file and one dependency-free browser controller only for eligible users. Platform search/navigation, forms and profile flows opt into the primitives; Admin Control Center, Tüm Modlar and Staff Panel remain unchanged.

**Tech Stack:** Node.js 20, Express 4, CommonJS, server-rendered template strings, vanilla JavaScript, CSS, `node:test`, `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-09-24-premium-loading-experience-design.md`

## Global Constraints

- `isSiteStaff(user)` is the authoritative exclusion rule; it already includes `user.isStaff` and `isSiteAdmin(user)`.
- Admin and admin/mod users must receive no new loading stylesheet, script, PageLoader, skeleton, spinner, shimmer, fade or loading-step markup.
- Exclusion affects only visual loading. Double-submit prevention, disabled controls, empty states, errors, authorization and permissions remain active.
- Do not add a frontend framework, build pipeline or runtime dependency.
- Never delay completion of a real operation; a 120 ms timer may delay only visual feedback for eligible users.
- Use neutral copy. Never invent progress percentages or payment, security scan, verification or order states.
- Normal transitions stay within 150–300 ms; success feedback stays within 500–800 ms and does not keep an originally enabled control disabled.
- Reuse current color, radius, spacing, typography and shadow tokens.
- Every busy path clears timers, `aria-busy` and disabled states on success and failure.
- Reduced motion stops shimmer and animated progress and makes reveal transitions effectively instant.
- Preserve routes, API payloads, response contracts and current user-owned working-tree changes.

## Review Focus

- A staff/admin user must never receive loading assets or markup even on a public page; Task 1 and Task 2 test this server-side gate.
- A request completing before 120 ms must not flash a spinner or leave a control disabled; Task 1 tests this lifecycle.
- A button already disabled before loading must remain disabled after cleanup; Task 1 tests original-state preservation.
- A stale search response must not replace a newer result; Task 2 tests the generation guard.
- A failed profile subrequest must remove its own skeleton while successful profile sections remain visible; Task 4 tests the generated partial-failure contract.

---

## File Map

- Create `server/views/loadingUi.js`: eligibility gate and escaped SSR renderers for LoadingSpinner, Skeleton, SkeletonCard, PageLoader, ButtonLoader, ProgressBar and LoadingSteps.
- Create `server/public/loading-ui.css`: token-adapted spinner, skeleton, progress, reveal, image and reduced-motion styles.
- Create `server/public/loading-ui.js`: CommonJS/browser busy lifecycle, button restoration, steps, reveal, image and latest-request helpers.
- Create `tests/loadingUi.test.js`: renderer, eligibility and controller behavior tests.
- Modify `server/views.js`: conditionally attach shared assets/PageLoader and prevent legacy submit feedback from touching explicitly managed forms.
- Modify `server/views/platformChrome.js`: role-configured search feedback, stale-response protection and public-user-only page progress.
- Modify `tests/platformChrome.test.js`: regular-versus-staff layout and search/navigation contracts.
- Modify `server/views/formsPage.js`: eligible-user ButtonLoader and staff-safe basic submit disabling.
- Modify `tests/formsPage.test.js`: regular and privileged form output contracts.
- Modify `server/views/profilePage.js`: public skeletons and real promise-linked steps, with plain placeholders for privileged viewers.
- Modify `tests/rewardsAndProfile.test.js`: public versus privileged profile output and partial-failure contracts.

---

### Task 1: Eligibility Gate and Shared Loading Primitives

**Files:**
- Create: `server/views/loadingUi.js`
- Create: `server/public/loading-ui.css`
- Create: `server/public/loading-ui.js`
- Create: `tests/loadingUi.test.js`

**Interfaces:**
- Consumes: `isSiteStaff(user)` from `utils/adminCheck.js` and existing CSS custom properties.
- Produces: `isLoadingEnabled(user)`, `renderLoadingSpinner`, `renderSkeleton`, `renderSkeletonCard`, `renderPageLoader`, `renderButtonLoader`, `renderProgressBar`, `renderLoadingSteps`, `loadingUiAssets`; browser/CommonJS `LoadingUI` with `setBusy`, `setButtonState`, `createBusyTask`, `setSteps`, `reveal`, `bindImage`, `startPageProgress`, `finishPageProgress`, `createLatestRequestGuard`.

- [ ] **Step 1: Write failing eligibility, renderer and lifecycle tests**

```js
// tests/loadingUi.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isLoadingEnabled,
  renderLoadingSpinner,
  renderSkeletonCard,
  renderLoadingSteps,
  renderPageLoader,
  loadingUiAssets,
} = require('../server/views/loadingUi');
const LoadingUI = require('../server/public/loading-ui');

function fakeElement({ disabled = false, html = 'Gönder' } = {}) {
  const attrs = new Map();
  const classes = new Set();
  return {
    disabled,
    innerHTML: html,
    textContent: html,
    dataset: {},
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    setAttribute: (name, value) => attrs.set(name, String(value)),
    getAttribute: (name) => attrs.get(name) ?? null,
    removeAttribute: (name) => attrs.delete(name),
  };
}

test('loading eligibility excludes staff and admins', () => {
  assert.equal(isLoadingEnabled(null), true);
  assert.equal(isLoadingEnabled({ discordId: '1', isStaff: false, isAdmin: false }), true);
  assert.equal(isLoadingEnabled({ discordId: '2', isStaff: true }), false);
  assert.equal(isLoadingEnabled({ discordId: '3', isAdmin: true }), false);
  assert.equal(loadingUiAssets({ isStaff: true }), '');
  assert.equal(renderPageLoader({ user: { isAdmin: true } }), '');
});

test('eligible renderers expose status semantics and escape copy', () => {
  const spinner = renderLoadingSpinner({ label: '<img src=x>', size: 'sm' });
  assert.match(spinner, /role="status"/);
  assert.match(spinner, /&lt;img src=x&gt;/);
  assert.doesNotMatch(spinner, /<img src=x>/);
  assert.match(renderSkeletonCard({ variant: 'profile' }), /aria-hidden="true"/);
  assert.match(renderLoadingSteps({ steps: ['Profil hazırlanıyor…'], activeIndex: 0 }), /aria-live="polite"/);
  assert.match(loadingUiAssets(null), /\/public\/loading-ui\.css/);
});

test('fast completion never shows visual button loading', async () => {
  const button = fakeElement();
  const container = fakeElement();
  const task = LoadingUI.createBusyTask({ button, container, delay: 25, labels: { loading: 'Gönderiliyor…' } });
  task.finish('idle');
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.equal(button.innerHTML, 'Gönder');
  assert.equal(button.disabled, false);
  assert.equal(container.getAttribute('aria-busy'), 'false');
  assert.equal(button.classList.contains('is-loading'), false);
});

test('cleanup preserves a control that began disabled', async () => {
  const button = fakeElement({ disabled: true, html: 'Kapalı' });
  const task = LoadingUI.createBusyTask({ button, delay: 0, labels: { loading: 'Bekleyin…' } });
  await new Promise((resolve) => setTimeout(resolve, 1));
  task.finish('idle');
  assert.equal(button.innerHTML, 'Kapalı');
  assert.equal(button.disabled, true);
});

test('success copy enables the action and restores its label', async () => {
  const button = fakeElement();
  const task = LoadingUI.createBusyTask({ button, delay: 0, labels: { loading: 'Gönderiliyor…', success: '✓ Gönderildi', successDuration: 5 } });
  await new Promise((resolve) => setTimeout(resolve, 1));
  task.finish('success');
  assert.equal(button.innerHTML, '✓ Gönderildi');
  assert.equal(button.disabled, false);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(button.innerHTML, 'Gönder');
});

test('latest request guard rejects stale generations', () => {
  const guard = LoadingUI.createLatestRequestGuard();
  const first = guard.next();
  const second = guard.next();
  assert.equal(guard.isCurrent(first), false);
  assert.equal(guard.isCurrent(second), true);
});
```

- [ ] **Step 2: Run the test and verify the missing modules fail**

Run: `node --test tests/loadingUi.test.js`

Expected: FAIL with `Cannot find module '../server/views/loadingUi'`.

- [ ] **Step 3: Implement the eligibility-aware SSR renderers**

```js
// server/views/loadingUi.js
'use strict';
const { isSiteStaff } = require('../../utils/adminCheck');

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function isLoadingEnabled(user) { return !isSiteStaff(user); }
function renderLoadingSpinner({ label = 'İçerik getiriliyor…', size = 'md' } = {}) {
  const safeSize = ['sm', 'md', 'lg'].includes(size) ? size : 'md';
  return `<span class="loading-status" role="status"><span class="loading-spinner loading-spinner--${safeSize}" aria-hidden="true"></span><span>${esc(label)}</span></span>`;
}
function renderSkeleton({ shape = 'line', width = '100%' } = {}) {
  const safeShape = ['line', 'circle', 'block'].includes(shape) ? shape : 'line';
  const safeWidth = /^\d+(?:\.\d+)?(?:%|px|rem)$/.test(String(width)) ? String(width) : '100%';
  return `<span class="skeleton skeleton--${safeShape}" style="--skeleton-width:${safeWidth}" aria-hidden="true"></span>`;
}
function renderSkeletonCard({ variant = 'card', lines = 3 } = {}) {
  const safeVariant = ['card', 'profile', 'inventory'].includes(variant) ? variant : 'card';
  const count = Math.max(1, Math.min(Number(lines) || 3, 4));
  const bars = Array.from({ length: count }, (_, index) => renderSkeleton({ width: index === 0 ? '72%' : index === 1 ? '92%' : '58%' })).join('');
  return `<article class="skeleton-card skeleton-card--${safeVariant}" aria-hidden="true"><div class="skeleton-card__head">${renderSkeleton({ shape: 'circle', width: '44px' })}<div>${bars}</div></div></article>`;
}
function renderProgressBar({ label = 'Sayfa yükleniyor' } = {}) {
  return `<div class="loading-progress" data-page-loader hidden role="progressbar" aria-label="${esc(label)}"><span></span></div>`;
}
function renderPageLoader({ user = null, label = 'Sayfa yükleniyor' } = {}) { return isLoadingEnabled(user) ? renderProgressBar({ label }) : ''; }
function renderButtonLoader({ label = 'İşleniyor…' } = {}) { return `<span class="button-loader"><span class="loading-spinner loading-spinner--sm" aria-hidden="true"></span><span>${esc(label)}</span></span>`; }
function renderLoadingSteps({ steps = [], activeIndex = 0 } = {}) {
  return `<ol class="loading-steps" data-loading-steps role="status" aria-live="polite">${steps.map((step, index) => `<li data-state="${index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending'}"><span>${esc(step)}</span></li>`).join('')}</ol>`;
}
function loadingUiAssets(user = null) {
  return isLoadingEnabled(user) ? '<link rel="stylesheet" href="/public/loading-ui.css">\n<script src="/public/loading-ui.js"></script>' : '';
}
module.exports = { isLoadingEnabled, renderLoadingSpinner, renderSkeleton, renderSkeletonCard, renderPageLoader, renderButtonLoader, renderProgressBar, renderLoadingSteps, loadingUiAssets };
```

- [ ] **Step 4: Implement the dependency-free browser lifecycle**

```js
// server/public/loading-ui.js
(function attach(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LoadingUI = api;
})(typeof window !== 'undefined' ? window : globalThis, function factory() {
  function setBusy(container, busy, message = '') {
    if (!container) return;
    container.setAttribute('aria-busy', String(Boolean(busy)));
    if (container.dataset) container.dataset.loadingMessage = message;
  }
  function setButtonState(button, state, labels = {}) {
    if (!button) return;
    if (!button.dataset.loadingOriginalHtml) {
      button.dataset.loadingOriginalHtml = button.innerHTML;
      button.dataset.loadingOriginalDisabled = String(Boolean(button.disabled));
    }
    if (state === 'loading') {
      button.disabled = true;
      button.classList.add('is-loading');
      button.innerHTML = `<span class="button-loader"><span class="loading-spinner loading-spinner--sm" aria-hidden="true"></span><span>${labels.loading || 'İşleniyor…'}</span></span>`;
      return;
    }
    if (state === 'success') {
      button.classList.remove('is-loading');
      button.innerHTML = labels.success || '✓ Hazır';
      button.disabled = button.dataset.loadingOriginalDisabled === 'true';
      const token = String(Date.now()) + Math.random();
      button.dataset.loadingSuccessToken = token;
      setTimeout(() => { if (button.dataset.loadingSuccessToken === token) setButtonState(button, 'idle', labels); }, labels.successDuration ?? 650);
      return;
    }
    button.classList.remove('is-loading');
    button.innerHTML = button.dataset.loadingOriginalHtml;
    button.disabled = button.dataset.loadingOriginalDisabled === 'true';
    delete button.dataset.loadingOriginalHtml;
    delete button.dataset.loadingOriginalDisabled;
    delete button.dataset.loadingSuccessToken;
  }
  function createBusyTask({ container = null, button = null, message = '', labels = {}, delay = 120 } = {}) {
    let finished = false;
    setBusy(container, true, message);
    if (button) delete button.dataset.loadingSuccessToken;
    if (button && !button.dataset.loadingOriginalHtml) {
      button.dataset.loadingOriginalHtml = button.innerHTML;
      button.dataset.loadingOriginalDisabled = String(Boolean(button.disabled));
    }
    if (button) button.disabled = true;
    const timer = setTimeout(() => { if (!finished) setButtonState(button, 'loading', labels); }, Math.max(0, delay));
    return { finish(outcome = 'idle') { if (finished) return; finished = true; clearTimeout(timer); setBusy(container, false, ''); if (button?.dataset?.loadingOriginalHtml) setButtonState(button, outcome, labels); } };
  }
  function setSteps(container, steps, activeIndex) { if (!container) return; [...container.querySelectorAll('li')].forEach((item, index) => item.dataset.state = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending'); container.setAttribute('aria-label', steps[activeIndex] || 'Hazır'); }
  function reveal(container) { container?.classList.add('is-loaded'); }
  function bindImage(image) { if (!image) return; const done = () => image.classList.add('is-loaded'); image.complete ? done() : image.addEventListener('load', done, { once: true }); image.addEventListener('error', () => image.classList.add('is-error'), { once: true }); }
  function startPageProgress(doc = typeof document !== 'undefined' ? document : null) { const el = doc?.querySelector('[data-page-loader]'); if (el) { el.hidden = false; el.dataset.state = 'loading'; } }
  function finishPageProgress(doc = typeof document !== 'undefined' ? document : null) { const el = doc?.querySelector('[data-page-loader]'); if (el) { el.dataset.state = 'done'; setTimeout(() => { el.hidden = true; el.removeAttribute('data-state'); }, 220); } }
  function createLatestRequestGuard() { let generation = 0; return { next: () => ++generation, isCurrent: (value) => value === generation }; }
  return { setBusy, setButtonState, createBusyTask, setSteps, reveal, bindImage, startPageProgress, finishPageProgress, createLatestRequestGuard };
});
```

- [ ] **Step 5: Add token-adapted styles and reduced-motion behavior**

```css
/* server/public/loading-ui.css */
:root{--loading-surface:var(--surface,rgba(127,127,140,.09));--loading-border:var(--border,rgba(127,127,140,.16));--loading-muted:var(--muted,#777783);--loading-accent:var(--accent,#7c6af7);--loading-radius:12px}
.loading-status,.button-loader{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;color:var(--loading-muted)}
.loading-spinner{width:1.1rem;height:1.1rem;border:2px solid var(--loading-border);border-top-color:var(--loading-accent);border-radius:50%;animation:loading-spin .7s linear infinite;flex:0 0 auto}.loading-spinner--sm{width:.85rem;height:.85rem}.loading-spinner--lg{width:1.5rem;height:1.5rem}
.skeleton{display:block;width:var(--skeleton-width,100%);height:.72rem;border-radius:999px;background:var(--loading-surface);position:relative;overflow:hidden}.skeleton::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);transform:translateX(-100%);animation:loading-shimmer 1.35s ease-in-out infinite}.skeleton--circle{height:var(--skeleton-width);border-radius:50%}
.skeleton-card{padding:18px;border:1px solid var(--loading-border);border-radius:var(--loading-radius);background:var(--loading-surface)}.skeleton-card__head{display:grid;grid-template-columns:auto 1fr;gap:12px}.skeleton-card__head>div{display:grid;gap:9px;padding-top:3px}
.loading-progress{position:fixed;inset:0 0 auto;z-index:2000;height:2px;overflow:hidden;pointer-events:none}.loading-progress span{display:block;width:45%;height:100%;background:var(--loading-accent);transform:translateX(-110%);animation:loading-progress 1s ease-in-out infinite}.loading-progress[data-state="done"]{opacity:0;transition:opacity .18s ease}
.loading-steps{display:flex;gap:8px;list-style:none;padding:0;margin:0;color:var(--loading-muted);font-size:.82rem}.loading-steps li[data-state="active"]{color:inherit}.loading-steps li[data-state="done"]{opacity:.72}
.loading-reveal{opacity:0;transform:translateY(4px)}.loading-reveal.is-loaded{opacity:1;transform:none;transition:opacity .2s ease,transform .2s ease}.loading-image{opacity:0}.loading-image.is-loaded{opacity:1;transition:opacity .22s ease}
@keyframes loading-spin{to{transform:rotate(360deg)}}@keyframes loading-shimmer{to{transform:translateX(100%)}}@keyframes loading-progress{0%{transform:translateX(-110%)}70%,100%{transform:translateX(240%)}}
@media(prefers-reduced-motion:reduce){.loading-spinner,.skeleton::after,.loading-progress span{animation:none!important}.skeleton::after{display:none}.loading-reveal,.loading-reveal.is-loaded,.loading-image,.loading-image.is-loaded,.loading-progress[data-state="done"]{transform:none!important;transition-duration:.01ms!important}}
```

- [ ] **Step 6: Run focused tests and syntax checks**

Run: `node --test tests/loadingUi.test.js && node --check server/views/loadingUi.js && node --check server/public/loading-ui.js`

Expected: PASS with 6 tests and both syntax checks exiting 0.

- [ ] **Step 7: Commit the shared primitives**

```bash
git add server/views/loadingUi.js server/public/loading-ui.css server/public/loading-ui.js tests/loadingUi.test.js
git commit -m "feat: add role-aware loading primitives"
```

---

### Task 2: Role-Aware Layout, Search and Page Progress

**Files:**
- Modify: `server/views.js:5-12, 23-110, 545-590`
- Modify: `server/views/platformChrome.js:160-230`
- Modify: `tests/platformChrome.test.js`

**Interfaces:**
- Consumes: `loadingUiAssets(user)`, `renderPageLoader({ user })`, and browser request/progress helpers.
- Produces: loading assets/search spinner/page progress for regular users and unchanged simple search/navigation for privileged users.

- [ ] **Step 1: Add failing regular-versus-privileged layout tests**

```js
// append to tests/platformChrome.test.js
const { renderDashboard } = require('../server/views');

test('regular layout includes loading assets and PageLoader', () => {
  const html = renderDashboard({ discordId: '1', username: 'Member', isStaff: false, isAdmin: false, isAuthorized: false }, null);
  assert.match(html, /\/public\/loading-ui\.css/);
  assert.match(html, /\/public\/loading-ui\.js/);
  assert.match(html, /data-page-loader/);
});

test('staff and admin layouts contain no loading assets or markup', () => {
  const staff = renderDashboard({ discordId: '2', username: 'Mod', isStaff: true, isAuthorized: true }, null);
  const admin = renderDashboard({ discordId: '3', username: 'Admin', isAdmin: true, isAuthorized: true }, null);
  for (const html of [staff, admin]) {
    assert.doesNotMatch(html, /loading-ui\.(?:css|js)/);
    assert.doesNotMatch(html, /data-page-loader|loading-spinner|skeleton-card/);
  }
});

test('search uses a latest-request guard but privileged mode skips visual loading', () => {
  const script = platformChromeScript();
  assert.match(script, /createLatestRequestGuard/);
  assert.match(script, /setBusy\(resultsBox/);
  assert.match(script, /const loadingEnabled=Boolean\(window\.LoadingUI\)/);
  assert.match(script, /setEmpty\('Aranıyor…'\)/);
});
```

- [ ] **Step 2: Run the platform tests and verify failure**

Run: `node --test tests/platformChrome.test.js tests/dashboardPolish.test.js`

Expected: FAIL because `_layout` does not emit role-aware loading assets and `platformChromeScript` has no options.

- [ ] **Step 3: Wire eligibility into `_layout`**

```js
// server/views.js imports
const { loadingUiAssets, renderPageLoader } = require('./views/loadingUi');

// in <head>
${loadingUiAssets(user)}

// immediately after <body>
${renderPageLoader({ user })}

// keep the existing platform script call; it detects the role-gated runtime
${platformChromeScript()}
```

Narrow the legacy generic submit hook so page-owned loading code is not overwritten:

```js
if (submitBtn && !form.dataset.noFeedback && !form.dataset.loadingManaged) {
  submitBtn.classList.add('is-loading');
  if (submitBtn.tagName === 'BUTTON') {
    submitBtn.dataset.origText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'İşleniyor…';
  }
}
```

- [ ] **Step 4: Add stale-safe, role-aware search feedback**

Keep the existing signature and detect the role-gated runtime:

```js
const loadingEnabled=Boolean(window.LoadingUI);
const searchGuard=window.LoadingUI?.createLatestRequestGuard();
```

At request start:

```js
const generation=searchGuard?.next();
if(loadingEnabled){window.LoadingUI?.setBusy(resultsBox,true,'İçerik getiriliyor…');setEmpty('İçerik getiriliyor…',true)}
else{setEmpty('Aranıyor…')}
```

Before rendering or reporting an error, return when `searchGuard && !searchGuard.isCurrent(generation)`. In `finally`, clear busy only when `loadingEnabled` and the generation is current. `setEmpty(message, loading)` creates a spinner only when `loading === true`.

- [ ] **Step 5: Bind page progress only in eligible output**

```js
if(loadingEnabled){
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a[href]');
    if(!link||link.target||link.hasAttribute('download'))return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin)return;
    if(url.pathname===location.pathname&&url.search===location.search&&url.hash)return;
    window.LoadingUI?.startPageProgress();
  });
  window.addEventListener('pageshow',()=>window.LoadingUI?.finishPageProgress());
}
```

Do not call `preventDefault`; navigation must start immediately.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/loadingUi.test.js tests/platformChrome.test.js tests/dashboardPolish.test.js`

Expected: PASS.

- [ ] **Step 7: Commit role-aware platform wiring**

```bash
git add server/views.js server/views/platformChrome.js tests/platformChrome.test.js
git commit -m "feat: gate platform loading by role"
```

---

### Task 3: Role-Aware Form Submission Feedback

**Files:**
- Modify: `server/views/formsPage.js:1-220`
- Modify: `tests/formsPage.test.js`

**Interfaces:**
- Consumes: `isLoadingEnabled(user)`, `loadingUiAssets(user)`, `LoadingUI.createBusyTask()`.
- Produces: animated ButtonLoader for regular users; unchanged-label disabled submit for privileged users.

- [ ] **Step 1: Add failing form role tests**

```js
// append to tests/formsPage.test.js
test('regular form uses managed loading and semantic busy state', () => {
  const html = renderFormPage({ discordId: '1', isStaff: false }, getFormDefinition('bug-report'), null);
  assert.match(html, /\/public\/loading-ui\.css/);
  assert.match(html, /data-loading-managed/);
  assert.match(html, /aria-busy="false"/);
  assert.match(html, /role="status"[^>]*aria-live="polite"/);
  assert.match(html, /LoadingUI\.createBusyTask/);
  assert.match(html, /✓ Gönderildi/);
});

test('staff and admin forms keep submit protection without loading visuals', () => {
  for (const user of [{ discordId: '2', isStaff: true }, { discordId: '3', isAdmin: true }]) {
    const html = renderFormPage(user, getFormDefinition('bug-report'), null);
    assert.doesNotMatch(html, /loading-ui\.(?:css|js)|loading-spinner|skeleton-card/);
    assert.match(html, /const loadingEnabled=false/);
    assert.match(html, /button\.disabled=true/);
  }
});
```

- [ ] **Step 2: Run form tests and verify failure**

Run: `node --test tests/formsPage.test.js`

Expected: FAIL because the standalone form document has no shared role-aware assets or managed submit branch.

- [ ] **Step 3: Emit role-aware form assets and state**

```js
const { isLoadingEnabled, loadingUiAssets } = require('./loadingUi');

function renderFormsDocument({ user, activePath, title, body }) {
  const loadingEnabled = isLoadingEnabled(user);
  return `...${platformChromeStyles('light')}${loadingUiAssets(user)}<style>${formsStyles}</style>...${platformChromeScript()}...`;
}
```

Render the form and live region as:

```html
<form class="forms-form" data-forms-form data-loading-managed aria-busy="false" ...>
  ...
  <div data-form-live role="status" aria-live="polite"></div>
</form>
```

Map existing form tokens only in eligible CSS assets through the page root:

```css
.forms-page{--loading-surface:var(--forms-soft);--loading-border:var(--forms-line);--loading-muted:var(--forms-muted);--loading-accent:var(--forms-pink);--loading-radius:9px}
```

- [ ] **Step 4: Implement the two submit branches after validation**

Pass `loadingEnabled` into `renderFormScript(fields, loadingEnabled)` and emit:

```js
const loadingEnabled=${loadingEnabled ? 'true' : 'false'};
const button=form.querySelector('button[type="submit"]');
const originalLabel=button.textContent;
const task=loadingEnabled?window.LoadingUI.createBusyTask({
  container:form,
  button,
  message:'Başvurun gönderiliyor…',
  labels:{loading:'Gönderiliyor…',success:'✓ Gönderildi'},
}):null;
if(!loadingEnabled)button.disabled=true;
if(loadingEnabled)live.textContent='Başvurun gönderiliyor…';
try{
  const response=await fetch('/api/forms/'+form.dataset.formSlug+'/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await response.json();
  if(!response.ok||!data.success)throw data;
  task?.finish('success');
  live.textContent='Başvurun gönderildi.';
  form.innerHTML='<section class="form-success" role="status"><h2>Başvurun alındı.</h2><p>Ekibimiz başvurunu inceleyecek. Sonuç veya ek bilgi gerektiğinde sana bildirim gönderilebilir.</p><code>Başvuru ID: '+String(data.submissionId||'—')+'</code></section>';
}catch(error){
  task?.finish('idle');
  button.disabled=false;
  button.textContent=originalLabel;
  live.textContent=error&&error.error?error.error:'Bağlantı kurulamadı. Lütfen tekrar dene.';
}
```

Keep this block after the current `if(!valid){...return}` branch so invalid input never starts loading or disables submit.

- [ ] **Step 5: Run form regressions**

Run: `node --test tests/formsPage.test.js tests/formsSubmission.test.js tests/loadingUi.test.js`

Expected: PASS.

- [ ] **Step 6: Commit form feedback**

```bash
git add server/views/formsPage.js tests/formsPage.test.js
git commit -m "feat: add role-aware form loading"
```

---

### Task 4: Public Profile Skeletons with Privileged Plain Mode

**Files:**
- Modify: `server/views/profilePage.js:1-40, 450-510, 550-735, 800-930, 1050-1055`
- Modify: `tests/rewardsAndProfile.test.js`

**Interfaces:**
- Consumes: `isLoadingEnabled(user)`, `renderSkeleton`, `renderSkeletonCard`, `renderLoadingSteps`, and browser `LoadingUI` helpers.
- Produces: public-user skeletons/steps/image reveal; admin and admin/mod viewers receive plain placeholders and direct updates.

- [ ] **Step 1: Add failing public-versus-privileged profile tests**

```js
// append to tests/rewardsAndProfile.test.js
test('regular viewer receives profile skeletons and real loading steps', () => {
  const user = { discordId: '1', username: 'Member', isStaff: false, isAdmin: false };
  const html = renderProfilePage(user, user, true, [], mockLayout);
  assert.match(html, /data-profile-loading-steps/);
  assert.match(html, /Profil hazırlanıyor…/);
  assert.match(html, /Topluluk bilgileri yükleniyor…/);
  assert.match(html, /skeleton-card--inventory/);
  assert.match(html, /Promise\.allSettled/);
  assert.match(html, /Veri alınamadı/);
});

test('staff and admin viewers receive no profile loading visuals', () => {
  for (const viewer of [{ discordId: '2', username: 'Mod', isStaff: true }, { discordId: '3', username: 'Admin', isAdmin: true }]) {
    const profile = { discordId: '9', username: 'Target' };
    const html = renderProfilePage(viewer, profile, false, [], mockLayout);
    assert.doesNotMatch(html, /data-profile-loading-steps|loading-image|skeleton-card|class="skeleton/);
    assert.match(html, /const loadingEnabled=false/);
  }
});
```

Move `mockLayout` to file scope so both the existing group and these tests use the same renderer fixture.

- [ ] **Step 2: Run profile tests and verify failure**

Run: `node --test tests/rewardsAndProfile.test.js`

Expected: FAIL because the current profile has one plain inventory loading message and no viewer-role branch.

- [ ] **Step 3: Render role-specific profile placeholders**

```js
const { isLoadingEnabled, renderSkeleton, renderSkeletonCard, renderLoadingSteps } = require('./loadingUi');

function renderProfilePage(user, profileUser, isOwn = false, robloxGroups = [], _layout) {
  const loadingEnabled = isLoadingEnabled(user);
  // existing setup
}
```

For eligible viewers render metric wrappers with `aria-busy="true"` and `renderSkeleton({ width: '44px' })`, four inventory cards from `renderSkeletonCard({ variant: 'inventory', lines: 2 })`, the three-step `renderLoadingSteps`, and `loading-image` on the avatar. For privileged viewers render the existing `—` metric values, an empty inventory container and the existing avatar class without any loading class.

Emit `const loadingEnabled=true|false` into the page script. Call `LoadingUI.bindImage` only inside `if(loadingEnabled)`.

- [ ] **Step 4: Split real requests and handle partial failures**

```js
async function loadEconomy(){
  const response=await fetch('/api/economy/public/'+TARGET_ID);
  const data=await response.json();
  if(!response.ok||!data.success)throw new Error('economy_failed');
  renderEconomy(data);
}
async function loadTickets(){
  if(!IS_OWN){setMetricUnavailable('tickets','—');setMetricUnavailable('closed','—');return;}
  const response=await fetch('/api/tickets');
  const data=await response.json();
  if(!response.ok||!data.success)throw new Error('tickets_failed');
  renderTicketMetrics(data.tickets||[]);
}
async function loadRewards(){
  const response=await fetch('/api/rewards/status');
  const data=await response.json();
  if(!response.ok||!data.success)throw new Error('rewards_failed');
  renderRewardCounts(data);
}
async function loadProfile(){
  const root=document.getElementById('p-root');
  const steps=document.querySelector('[data-profile-loading-steps] [data-loading-steps]');
  if(loadingEnabled){window.LoadingUI.setBusy(root,true,'Profil hazırlanıyor…');window.LoadingUI.setSteps(steps,STEP_LABELS,0)}
  const economyPromise=loadEconomy();
  const communityPromise=Promise.allSettled([loadTickets(),loadRewards()]);
  const [economyResult]=await Promise.allSettled([economyPromise]);
  if(loadingEnabled)window.LoadingUI.setSteps(steps,STEP_LABELS,1);
  const [ticketsResult,rewardsResult]=await communityPromise;
  if(economyResult.status==='rejected')setEconomyUnavailable('Veri alınamadı');
  if(ticketsResult.status==='rejected'){setMetricUnavailable('tickets','Veri alınamadı');setMetricUnavailable('closed','Veri alınamadı')}
  if(rewardsResult.status==='rejected')setRewardsUnavailable();
  if(loadingEnabled){window.LoadingUI.setSteps(steps,STEP_LABELS,2);window.LoadingUI.setBusy(root,false,'');window.LoadingUI.reveal(root)}
}
```

`renderEconomy`, `renderTicketMetrics`, `setMetricUnavailable`, `setEconomyUnavailable`, `renderRewardCounts`, and `setRewardsUnavailable` use `textContent` and set owned `aria-busy` values to `false`. `setEconomyUnavailable` calls `renderInventoryUnavailable('Veri alınamadı')`, which replaces every inventory skeleton with one inert state element. Privileged mode executes the same requests and direct text updates but never calls `LoadingUI`.

- [ ] **Step 5: Keep profile action protection without privileged visuals**

For equip, box and wheel actions, let the busy task disable eligible controls immediately; use the existing direct disable only for privileged viewers:

```js
const task=loadingEnabled?window.LoadingUI.createBusyTask({button,labels:{loading:'Hazırlanıyor…',success:'✓ Hazır'}}):null;
if(!loadingEnabled)button.disabled=true;
try{
  // preserve the existing request and result animation
  task?.finish('success');
}catch(error){
  task?.finish('idle');
  button.disabled=false;
  showToast('İşlem tamamlanamadı.');
}
```

Do not change existing reward-result animation durations; they present the result rather than simulate network work.

- [ ] **Step 6: Run profile and loading tests**

Run: `node --test tests/rewardsAndProfile.test.js tests/loadingUi.test.js`

Expected: PASS.

- [ ] **Step 7: Commit profile loading**

```bash
git add server/views/profilePage.js tests/rewardsAndProfile.test.js
git commit -m "feat: add public-only profile loading states"
```

---

### Task 5: Full Verification and Visual Smoke Check

**Files:**
- Verify only: files modified in Tasks 1–4.

**Interfaces:**
- Consumes: every implementation task.
- Produces: fresh evidence for syntax, test, responsive, reduced-motion and privileged-user exclusion requirements.

- [ ] **Step 1: Run syntax checks**

Run:

```bash
node --check server/views/loadingUi.js
node --check server/public/loading-ui.js
node --check server/views/platformChrome.js
node --check server/views/formsPage.js
node --check server/views/profilePage.js
node --check server/views.js
```

Expected: every command exits 0.

- [ ] **Step 2: Run the focused loading suite**

Run:

```bash
node --test tests/loadingUi.test.js tests/platformChrome.test.js tests/dashboardPolish.test.js tests/formsPage.test.js tests/formsSubmission.test.js tests/rewardsAndProfile.test.js
```

Expected: 0 failed tests.

- [ ] **Step 3: Run the complete repository suite**

Run: `node --test`

Expected: 0 failed tests. If unrelated pre-existing tests fail, report each failing test and error instead of claiming a green suite.

- [ ] **Step 4: Start the app and smoke-check regular-user pages**

Run: `npm start`

Verify as a normal user:

- `/forms/bug-report`: invalid submit starts no loader; valid submit disables the button; failure preserves values.
- `/profile`: skeletons preserve layout; partial API failure leaves no permanent skeleton; avatar reveals smoothly.
- Global search: neutral busy status appears only for a real request and stale results cannot replace the newest result.
- Same-origin navigation: top progress appears without delaying navigation; external, modifier and hash-only links are untouched.

- [ ] **Step 5: Smoke-check privileged exclusion**

As one staff/admin-mod account and one admin account, verify on dashboard, forms and profile that:

- No `/public/loading-ui.css` or `/public/loading-ui.js` request occurs.
- No PageLoader, skeleton, spinner, shimmer, fade or loading-step appears.
- Form/profile controls still disable when required, errors still render, and data still arrives.
- Admin Control Center, Tüm Modlar and Staff Panel remain visually and behaviorally unchanged.

- [ ] **Step 6: Emulate reduced motion and mobile widths**

As a regular user at 375 px and 768 px with `prefers-reduced-motion: reduce`, verify skeletons are static, page progress does not animate, no horizontal overflow appears, and content becomes visible without a transition delay.

- [ ] **Step 7: Inspect final scope**

Run: `git status --short && git diff --check && git diff --stat`

Expected: only plan-scoped product/test files plus the user’s pre-existing unrelated changes appear; `git diff --check` exits 0.
