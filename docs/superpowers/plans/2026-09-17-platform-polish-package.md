# EkoYıldız Platform Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve EkoYıldız's existing routes and integrations while delivering a professional shared navigation, distinct Help and Safety centers, integrated content search, editorial blog/video presentation, honest status states, and focused dashboard polish.

**Architecture:** Add one small shared public-platform chrome module and one read-only public content search service, then integrate them into existing renderers and routes. Existing auth, Discord, ticket, forms, storage, and permission services remain untouched; route aliases keep old URLs working.

**Tech Stack:** Node.js 20, Express 4, server-rendered HTML/CSS/JavaScript, `node:test`, existing in-memory/Mongo-compatible Store.

**Spec:** `docs/superpowers/specs/2026-09-17-platform-polish-package-design.md`

## Global Constraints

- Keep Help Center and Safety Center separate but connected through shared information architecture and visual language.
- Make `/safety` the canonical Safety Center landing without breaking `/yardim` or `/yardim/:slug`.
- Do not change OAuth, authentication, session, Discord bot, ticket, form, API contract, or permission behavior.
- Do not add duplicate backends or invented metrics.
- Use explanatory empty states whenever verified live data is unavailable.
- Apply TDD for every behavior change and run relevant regression tests after each task.
- Preserve unrelated dirty JSON data files and do not include them in commits.

---

### Task 1: Shared public platform chrome and navigation contract

**Files:**
- Create: `server/views/platformChrome.js`
- Modify: `server/views.js`
- Test: `tests/platformChrome.test.js`

**Interfaces:**
- Produces: `renderPlatformHeader({ user, activePath, theme })`, `renderPlatformFooter({ theme })`, `renderSearchDialog({ theme })`, `platformChromeStyles(theme)`, and `platformChromeScript()`.
- Consumes: existing user shape and `isSiteAdmin` / `isSiteStaff` checks in `server/views.js`; it performs no authorization itself.

- [ ] **Step 1: Write the failing component contract test**

```js
test('platform chrome exposes Help and Safety as separate destinations', () => {
  const html = renderPlatformHeader({ user: null, activePath: '/safety', theme: 'dark' });
  assert.match(html, /href="\/help"/);
  assert.match(html, /href="\/safety"/);
  assert.match(html, /aria-expanded="false"/);
});
```

- [ ] **Step 2: Run the test and verify it fails because `platformChrome` does not exist**

Run: `node --test tests/platformChrome.test.js`
Expected: FAIL with module-not-found or missing export.

- [ ] **Step 3: Implement the shared chrome module**

Create semantic header/footer markup, compact desktop groups, a keyboard-operable mobile drawer, a search trigger, visible focus states, reduced-motion CSS, and no links to nonexistent routes. Accept `theme: 'dark' | 'light'`; escape displayed user data.

- [ ] **Step 4: Integrate the header/footer/search shell into `_layout` without changing page content or authorization**

Replace only `_layout`'s existing header/footer markup and associated navigation CSS/JS. Keep current staff/admin/group-admin link predicates and route targets intact by passing the already-authorized links into the shared renderer.

- [ ] **Step 5: Run focused tests and syntax checks**

Run: `node --test tests/platformChrome.test.js tests/umModlarPage.test.js tests/tumModlarPage.test.js`
Run: `node --check server/views/platformChrome.js && node --check server/views.js`
Expected: all pass.

- [ ] **Step 6: Commit the shared chrome change**

```bash
git add server/views/platformChrome.js server/views.js tests/platformChrome.test.js
git commit -m "feat: unify platform navigation chrome"
```

### Task 2: Separate Help and Safety centers with backward compatibility

**Files:**
- Create: `server/views/productHelpCenterPage.js`
- Modify: `server/views/helpHubPage.js`
- Modify: `server/routes/pages.js`
- Test: `tests/helpSafetyArchitecture.test.js`
- Test: `tests/safetyCenter.test.js`

**Interfaces:**
- Produces: `renderProductHelpCenterPage(user)` for `/help`, `renderSafetyCenterPage(user)` for `/safety` and legacy `/yardim`.
- Preserves: `/yardim`, `/yardim/:slug`, `/help/:topic`, `/appeals`, and `/cases` behavior.

- [ ] **Step 1: Write failing route and renderer tests**

```js
test('Safety Center is canonical at /safety while legacy guide URLs remain available', () => {
  const safety = renderSafetyCenterPage(null);
  assert.match(safety, /EkoYıldız Safety Center/);
  assert.match(safety, /href="\/yardim\/discord-sahte-dm-ve-phishing"/);
});

test('Help Center contains product support categories and links to Safety', () => {
  const help = renderProductHelpCenterPage(null);
  assert.match(help, /Hesap ve giriş/);
  assert.match(help, /EkoYıldız Bot/);
  assert.match(help, /href="\/safety"/);
});
```

- [ ] **Step 2: Run tests and verify missing exports/renderers fail**

Run: `node --test tests/helpSafetyArchitecture.test.js tests/safetyCenter.test.js`
Expected: new tests fail while existing Safety tests remain green.

- [ ] **Step 3: Implement the Help landing and Safety canonical renderer**

Reuse existing help/support routes and content. The Help landing links account/login to `/login`, tickets to `/tickets` or `/tickets/new`, bot/support documentation to existing `/help/<topic>` pages, and Safety to `/safety`. Rename no existing endpoint.

- [ ] **Step 4: Update routes with aliases, not migrations**

Serve the Safety landing at both `/safety` and `/yardim`. Keep `/yardim/:slug` as the guide URL. Route `/help` to the product Help landing and `/help/:topic` to the existing Phibi support renderer.

- [ ] **Step 5: Replace unverified Safety transparency numbers with an honest empty state**

Remove hard-coded report/action/spam counts. Render “Bu rapor için henüz doğrulanmış veri bulunmuyor” plus links to policies/appeals/support.

- [ ] **Step 6: Verify route and content regressions**

Run: `node --test tests/helpSafetyArchitecture.test.js tests/safetyCenter.test.js tests/ticketPanelActions.test.js`
Run: `node --check server/routes/pages.js && node --check server/views/helpHubPage.js && node --check server/views/productHelpCenterPage.js`
Expected: all pass.

- [ ] **Step 7: Commit Help/Safety architecture**

```bash
git add server/routes/pages.js server/views/helpHubPage.js server/views/productHelpCenterPage.js tests/helpSafetyArchitecture.test.js tests/safetyCenter.test.js
git commit -m "feat: separate help and safety centers"
```

### Task 3: Public content search and Ctrl/Cmd+K dialog

**Files:**
- Create: `server/services/publicContentSearchService.js`
- Modify: `server/routes/api.js`
- Modify: `server/views/platformChrome.js`
- Test: `tests/publicContentSearchService.test.js`
- Test: `tests/platformChrome.test.js`

**Interfaces:**
- Produces: `searchPublicContent(query, options?) -> Array<{ title, description, category, breadcrumb, url, kind }>` and `GET /api/search?q=<query>` returning `{ success: true, results }`.
- Consumes: `knowledgeCenterData` posts/guides/topics and a safe exported video index; it never indexes private staff or user data.

- [ ] **Step 1: Write failing search behavior tests**

```js
test('search returns both Help and Safety results with real URLs', () => {
  const results = searchPublicContent('ticket');
  assert.ok(results.some((item) => item.kind === 'help' && item.url.startsWith('/help')));
  assert.ok(results.some((item) => item.kind === 'safety' && item.url.startsWith('/yardim/')));
});

test('empty and one-character queries return no results', () => {
  assert.deepEqual(searchPublicContent(''), []);
  assert.deepEqual(searchPublicContent('a'), []);
});
```

- [ ] **Step 2: Run the service test and verify RED**

Run: `node --test tests/publicContentSearchService.test.js`
Expected: FAIL because the service is missing.

- [ ] **Step 3: Implement normalized, bounded public search**

Normalize Turkish casing/diacritics, search title/description/category terms, deduplicate by URL, and cap results at 12. Define Help entries from real existing routes; never expose user/staff/admin records.

- [ ] **Step 4: Add the read-only API endpoint and command dialog client**

Add `GET /api/search`, validate query length, return JSON, and add debounced fetch rendering to the shared dialog. Support Ctrl/Cmd+K, Escape, focus return, arrow navigation, Enter, `role="dialog"`, and `aria-live` status.

- [ ] **Step 5: Verify search and chrome tests**

Run: `node --test tests/publicContentSearchService.test.js tests/platformChrome.test.js`
Run: `node --check server/services/publicContentSearchService.js && node --check server/routes/api.js`
Expected: all pass.

- [ ] **Step 6: Commit global search**

```bash
git add server/services/publicContentSearchService.js server/routes/api.js server/views/platformChrome.js tests/publicContentSearchService.test.js tests/platformChrome.test.js
git commit -m "feat: add public content command search"
```

### Task 4: Integrate Blog and Video Blog into the public content system

**Files:**
- Modify: `server/views/helpHubPage.js`
- Modify: `server/views/videoBlogPage.js`
- Modify: `server/services/publicContentSearchService.js`
- Test: `tests/editorialContent.test.js`
- Test: `tests/publicContentSearchService.test.js`

**Interfaces:**
- Produces: exported `videoEntries` metadata for search and editorial cross-links.
- Preserves: `/blog`, `/blog/:slug`, `/yazar/:slug`, `/video-blog`, and external YouTube URLs.

- [ ] **Step 1: Write failing editorial metadata tests**

```js
test('blog cards expose category, author, date and reading context', () => {
  const html = renderBlogPage();
  assert.match(html, /Yazar/);
  assert.match(html, /okuma/);
  assert.match(html, /Video Blog/);
});

test('video entries are searchable as YouTube content', () => {
  const results = searchPublicContent('kamp');
  assert.ok(results.some((item) => item.kind === 'video'));
});
```

- [ ] **Step 2: Run the tests and verify missing metadata/search behavior fails**

Run: `node --test tests/editorialContent.test.js tests/publicContentSearchService.test.js`
Expected: FAIL on reading metadata and/or video result.

- [ ] **Step 3: Add reusable editorial metadata and cross-links**

Use existing authors/posts. Compute reading time from body length, retain mascot profiles, add Blog ↔ Video Blog navigation, and export sanitized video metadata without changing the video renderer's external links.

- [ ] **Step 4: Verify editorial rendering and search**

Run: `node --test tests/editorialContent.test.js tests/publicContentSearchService.test.js`
Run: `node --check server/views/helpHubPage.js && node --check server/views/videoBlogPage.js`
Expected: all pass.

- [ ] **Step 5: Commit editorial integration**

```bash
git add server/views/helpHubPage.js server/views/videoBlogPage.js server/services/publicContentSearchService.js tests/editorialContent.test.js tests/publicContentSearchService.test.js
git commit -m "feat: connect editorial and video content"
```

### Task 5: Dashboard hierarchy and honest status states

**Files:**
- Modify: `server/views.js`
- Modify: `server/views/statusPage.js`
- Test: `tests/dashboardPolish.test.js`
- Test: `tests/statusPage.test.js`

**Interfaces:**
- Preserves: `renderDashboard(user, staffProgress)` arguments and all existing dashboard action IDs/endpoints.
- Produces: explanatory dashboard priority section and “monitoring not connected” status presentation.

- [ ] **Step 1: Write failing dashboard/status tests**

```js
test('dashboard leads with role-aware priorities without removing existing actions', () => {
  const html = renderDashboard({ discordId: '1', username: 'Eko', isStaff: false }, null);
  assert.match(html, /İyi .*Eko/);
  assert.match(html, /Bekleyen işlemler|Hızlı işlemler/);
});

test('status page does not claim invented uptime or operational monitoring', () => {
  const html = renderStatusPage(null);
  assert.doesNotMatch(html, /99\.98|18 ms|TÜM SİSTEMLER OPERASYONEL/);
  assert.match(html, /canlı izleme bağlı değil/i);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/dashboardPolish.test.js tests/statusPage.test.js`
Expected: FAIL on new hierarchy and honest status wording.

- [ ] **Step 3: Add a compact role-aware dashboard introduction**

Keep all current cards, forms, element IDs and scripts. Add only a top hierarchy with greeting, real role label, links to existing pending work, and contextual Help/Safety links. Use empty states when a staff record is missing.

- [ ] **Step 4: Replace fictional status metrics with disconnected-monitoring empty states**

List the actual services as a catalog but label each “Canlı izleme bağlı değil”. Remove invented uptime, latency, incident, and “all operational” claims. Explain that service health is not published until a heartbeat source exists.

- [ ] **Step 5: Verify dashboard/status and existing view regressions**

Run: `node --test tests/dashboardPolish.test.js tests/statusPage.test.js tests/umModlarPage.test.js tests/tumModlarPage.test.js`
Run: `node --check server/views.js && node --check server/views/statusPage.js`
Expected: all pass.

- [ ] **Step 6: Commit dashboard/status polish**

```bash
git add server/views.js server/views/statusPage.js tests/dashboardPolish.test.js tests/statusPage.test.js
git commit -m "feat: clarify dashboard and service status"
```

### Task 6: Public homepage integration and final regression

**Files:**
- Modify: `server/views/home/mainHomePage.js`
- Test: `tests/homePlatformIntegration.test.js`
- Modify only if required by failures: files changed in Tasks 1–5

**Interfaces:**
- Preserves: `renderMainHomePage(userOrOptions)` and all existing social/giveaway API usage.
- Consumes: shared platform navigation destinations and real existing Blog/Video/Help/Safety routes.

- [ ] **Step 1: Write failing homepage integration test**

```js
test('homepage exposes separate Help and Safety destinations plus command search', () => {
  const html = renderMainHomePage(null);
  assert.match(html, /href="\/help"/);
  assert.match(html, /href="\/safety"/);
  assert.match(html, /data-global-search-trigger/);
});
```

- [ ] **Step 2: Run the homepage test and verify RED**

Run: `node --test tests/homePlatformIntegration.test.js`
Expected: FAIL because the focused homepage still links only to `/yardim` and has no shared search trigger.

- [ ] **Step 3: Integrate shared public destinations without rewriting the homepage**

Update the existing focused header/footer and relevant cards to expose Help, Safety, Blog, Video Blog and command search. Keep all social links, live stats fetch, easter egg, Discord CTAs and homepage service contracts.

- [ ] **Step 4: Run complete verification**

Run: `node --check server/views/home/mainHomePage.js`
Run: `git diff --check`
Run: `$files = Get-ChildItem tests -Filter '*.test.js' | ForEach-Object { $_.FullName }; node --test $files`
Expected: zero syntax errors, zero diff errors, all tests pass.

- [ ] **Step 5: Inspect scope and preserve unrelated files**

Run: `git status --short`
Expected: only planned source/test files plus the pre-existing unrelated JSON modifications. Do not stage the JSON files.

- [ ] **Step 6: Commit homepage integration**

```bash
git add server/views/home/mainHomePage.js tests/homePlatformIntegration.test.js
git commit -m "feat: connect homepage to platform centers"
```
