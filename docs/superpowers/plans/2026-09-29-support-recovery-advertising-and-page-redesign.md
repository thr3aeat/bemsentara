# EkoYıldız Support, Recovery, Advertising and Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a calm site-wide recovery experience and a coherent, human-crafted support journey across the homepage, advertising assistant, Links page, ticket creation page, and Discord thanks message.

**Architecture:** A dependency-free recovery shell mounts through the shared platform chrome and exposes pure timing/backoff helpers for tests. Homepage support entry points and advertising intent use the existing `/reklam/ekoyildiz-ortaklik` route, while existing ticket, pricing, links, and Discord service contracts remain stable. Each page redesign stays server-rendered and uses small vanilla browser controllers.

**Tech Stack:** Node.js 20+, CommonJS, Express, server-rendered HTML/CSS/vanilla JavaScript, Discord.js v14, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-29-support-recovery-advertising-and-page-redesign.md`

## Global Constraints

- Preserve the user's uncommitted changes in `server/views/advertisingLandingPage.js`; inspect the live diff immediately before editing and never replace the file wholesale.
- Do not add dependencies, database migrations, payment processors, or new public routes.
- Keep `/`, `/reklam/ekoyildiz-ortaklik`, `/links`, `/tickets/new`, `/api/health`, `/api/reklam/ekoai-chat`, and the current ticket POST contract compatible.
- EKOai stays visibly automated and must not impersonate a human; the copy may be natural and concise.
- Preserve honest prices, eligibility rules, all ten official link records, and current tracked third-party sponsor destinations.
- Never automatically repeat mutating submissions after recovery.
- Exclude passwords, authentication codes, payment details, file inputs, and sensitive fields from local drafts.
- All interactive work must support keyboards, visible focus, `prefers-reduced-motion`, and 320px-wide screens.
- Use test-driven development: write and observe the focused test fail before production changes, then run it green.
- Stage and commit only files named by the current task; unrelated working-tree changes remain untouched.

## Review Focus

- A ticket POST that receives a network failure or `5xx` must show recovery without automatically submitting a second ticket; Task 1 pins this with `shouldAutoRetryRequest` tests and Task 5 checks the form integration.
- Authentication, validation, permission, and other `4xx` responses must keep their normal application messages instead of opening recovery UI; Task 1 tests status classification.
- Draft persistence must omit password, OTP/code, payment, sensitive, and file fields even when their values are present; Task 1 tests the exclusion filter.
- Pages must continue to work when `localStorage` throws or is unavailable; Tasks 1 and 2 test guarded storage behavior.
- Unknown or malformed `intent`, `category`, and `package` query values must fall back safely without injecting HTML or breaking preselection; Tasks 3 and 5 test these inputs.

---

### Task 1: Shared Connection Recovery State and Draft Safety

**Files:**
- Create: `server/views/connectionRecovery.js`
- Create: `tests/connectionRecovery.test.js`

**Interfaces:**
- Produces: `getRecoveryStage(elapsedMs: number): 'short'|'medium'|'long'`
- Produces: `getRetryDelay(attempt: number, jitter: number): number`
- Produces: `classifyRecoveryResponse({ status, networkError }): 'recoverable'|'application'|'ok'`
- Produces: `shouldAutoRetryRequest(method: string): boolean`
- Produces: `isDraftableField({ type, name, autocomplete, dataset }): boolean`
- Produces: `renderConnectionRecoveryShell(options?: { homeUrl?: string, supportUrl?: string }): string`
- Produces: `connectionRecoveryScript(options?: { healthUrl?: string }): string`

- [ ] **Step 1: Write the failing state, retry, and response-classification tests**

Add tests named:

```js
test('recovery stages escalate at 3s and 10s boundaries', () => {
  assert.equal(getRecoveryStage(0), 'short');
  assert.equal(getRecoveryStage(2999), 'short');
  assert.equal(getRecoveryStage(3000), 'medium');
  assert.equal(getRecoveryStage(9999), 'medium');
  assert.equal(getRecoveryStage(10000), 'long');
});

test('only network failures and 5xx responses enter recovery', () => {
  assert.equal(classifyRecoveryResponse({ networkError: true }), 'recoverable');
  assert.equal(classifyRecoveryResponse({ status: 503 }), 'recoverable');
  assert.equal(classifyRecoveryResponse({ status: 401 }), 'application');
  assert.equal(classifyRecoveryResponse({ status: 422 }), 'application');
  assert.equal(classifyRecoveryResponse({ status: 204 }), 'ok');
});

test('mutating requests are never automatically retried', () => {
  assert.equal(shouldAutoRetryRequest('GET'), true);
  assert.equal(shouldAutoRetryRequest('HEAD'), true);
  assert.equal(shouldAutoRetryRequest('POST'), false);
  assert.equal(shouldAutoRetryRequest('DELETE'), false);
});
```

Also assert bounded exponential delays for attempts 0–5 and exact stage copy/hooks in the rendered shell.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/connectionRecovery.test.js`  
Expected: FAIL because `server/views/connectionRecovery.js` does not exist.

- [ ] **Step 3: Implement the pure state helpers and recovery shell**

Implement the exported signatures above. Pin thresholds to `3000` and `10000` milliseconds, cap backoff at `30000` milliseconds, and render banner, compact panel, long screen, retry/home/support actions, `aria-live`, and an initially hidden game mount.

- [ ] **Step 4: Write the failing draft-safety tests**

Assert `isDraftableField` rejects `password`, `file`, names containing `password`, `otp`, `code`, `token`, `payment`, or `card`, and any `data-sensitive="true"`; assert it accepts ordinary text, textarea, select, checkbox, and radio fields. Assert the browser script wraps storage reads/writes in `try/catch` and does not retry POST automatically.

- [ ] **Step 5: Run the focused test and verify the new assertions fail**

Run: `node --test tests/connectionRecovery.test.js`  
Expected: FAIL on draft filtering or missing browser controller hooks.

- [ ] **Step 6: Implement health probes, cooldown, recovery, and draft persistence**

The controller probes `/api/health` with bounded backoff and jitter, transitions through the explicit states, provides manual retry cooldown, restores focus, and uses guarded local storage with a short expiry. It dispatches `eko:connection-recovered` rather than replaying mutating requests.

- [ ] **Step 7: Run the focused test green**

Run: `node --test tests/connectionRecovery.test.js`  
Expected: all Task 1 tests PASS.

- [ ] **Step 8: Commit Task 1**

```powershell
git add -- server/views/connectionRecovery.js tests/connectionRecovery.test.js
git commit -m "feat: add shared connection recovery state"
```

### Task 2: Global Recovery Mount, Standalone 502 Page, and Mini Runner

**Files:**
- Modify: `server/views/platformChrome.js`
- Modify: `scripts/custom_error.html`
- Create: `tests/connectionRecoveryIntegration.test.js`

**Interfaces:**
- Consumes: Task 1 `renderConnectionRecoveryShell` and `connectionRecoveryScript`
- Produces: shared platform pages with one `[data-connection-recovery]` mount
- Produces: standalone recovery page with `retry`, `home`, `support`, `game`, and health-probe hooks

- [ ] **Step 1: Write failing global-mount and standalone-page tests**

Assert that shared chrome output contains exactly one recovery mount, `/api/health`, `/tickets/new?category=technical`, `aria-live="polite"`, and reduced-motion CSS. Read `scripts/custom_error.html` and assert the short/medium/long copy, retry cooldown hook, original URL handling, home/support links, and no claims of a guaranteed recovery time.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/connectionRecoveryIntegration.test.js`  
Expected: FAIL because platform chrome and the standalone page lack the new recovery structure.

- [ ] **Step 3: Mount the recovery shell through platform chrome**

Import Task 1 renderers, append their markup once from the shared chrome path, and include the controller after existing platform scripts without changing current header/footer signatures.

- [ ] **Step 4: Replace the standalone 502 experience**

Rebuild `scripts/custom_error.html` as dependency-free HTML/CSS/JS using the same restrained tokens and copy. Preserve direct operation when the app server is down and return to the original same-origin URL only after a confirmed successful health response.

- [ ] **Step 5: Write failing mini-runner interaction tests**

Assert the standalone and shared long state expose keyboard/touch controls, score, best score, restart, tab-visibility pause, responsive canvas sizing, and `prefers-reduced-motion` handling. Assert there is no Chrome/Dino artwork or branding.

- [ ] **Step 6: Run the focused test and verify the game assertions fail**

Run: `node --test tests/connectionRecoveryIntegration.test.js`  
Expected: FAIL on the missing original runner implementation.

- [ ] **Step 7: Implement the lightweight original mini runner**

Use a fixed logical canvas with CSS/canvas primitives, one `requestAnimationFrame` loop active only while visible, Space/ArrowUp/click/touch input, session best score, and restart. Keep probes and recovery buttons independent from game state.

- [ ] **Step 8: Run Task 1 and Task 2 tests green**

Run: `node --test tests/connectionRecovery.test.js tests/connectionRecoveryIntegration.test.js`  
Expected: all tests PASS.

- [ ] **Step 9: Commit Task 2**

```powershell
git add -- server/views/platformChrome.js scripts/custom_error.html tests/connectionRecoveryIntegration.test.js
git commit -m "feat: add progressive recovery experience"
```

### Task 3: Homepage Support Entry and Advertising/Donation Conversation

**Files:**
- Create: `server/views/supportCampaign.js`
- Modify: `server/views/home/mainHomePage.js`
- Modify carefully: `server/views/advertisingLandingPage.js`
- Modify: `server/services/reklamAIAssistantService.js`
- Modify: `tests/homePlatformIntegration.test.js`
- Modify: `tests/advertisingLandingPage.test.js`
- Modify: `tests/reklamAIAssistant.test.js`

**Interfaces:**
- Produces: `renderSupportCampaign(options?: { cooldownDays?: number }): string`
- Produces: `getAdvertisingIntent(rawIntent: unknown): 'advertise'|'donate'|'choose'`
- Consumes: existing `answerAdvertisingQuestion(question, history)` and `/api/reklam/ekoai-chat`

- [ ] **Step 1: Snapshot and inspect the existing advertising page diff**

Run: `git diff -- server/views/advertisingLandingPage.js` and save no generated output. Identify the existing 347-line user change as protected input; subsequent edits must be minimal patches around it.

- [ ] **Step 2: Write failing homepage campaign tests**

Assert homepage output includes factual funding copy covering YouTube, Discord bots, and websites; three actions with exact advertising/donation URLs; a seven-day local cooling-period key; a guarded storage fallback; and no unconditional HTTP/meta/JavaScript redirect from `/`.

- [ ] **Step 3: Run the homepage test and verify RED**

Run: `node --test tests/homePlatformIntegration.test.js`  
Expected: FAIL on missing campaign copy, URLs, or cooling hooks.

- [ ] **Step 4: Implement `renderSupportCampaign` and mount it on the homepage**

Render a non-blocking first-visit panel plus permanent compact support section. Use `/reklam/ekoyildiz-ortaklik?intent=advertise&source=home-support` and the equivalent `intent=donate` URL; “Siteye devam et” closes without navigation.

- [ ] **Step 5: Write failing intent and conversation tests**

Assert `advertise`, `donate`, missing, malformed, and HTML-like intent values map safely. Assert the page contains the exact natural opening question, the four quick choices from the spec, `EKOai · otomatik destek`, and none of `AI Destek Asistanı`, pulsing AI badges, or claims of being a human. Assert low-budget, donation, and human-handoff fallback answers use existing routes and never invent discounts or payment providers.

- [ ] **Step 6: Run advertising tests and verify RED**

Run: `node --test tests/advertisingLandingPage.test.js tests/reklamAIAssistant.test.js`  
Expected: FAIL on intent mapping, opening copy, visual markers, or deterministic fallbacks.

- [ ] **Step 7: Implement intent parsing and natural EKOai behavior**

Add `getAdvertisingIntent`, one restrained conversation surface, intent-specific opening state, concise prompt rules, and deterministic fallbacks. Preserve package builder, prices, partner evidence, eligibility, ticket CTA, existing uncommitted user work, and existing endpoint payload.

- [ ] **Step 8: Run Task 3 tests green and inspect the protected diff**

Run: `node --test tests/homePlatformIntegration.test.js tests/advertisingLandingPage.test.js tests/reklamAIAssistant.test.js`  
Expected: all tests PASS. Then run `git diff --check` and inspect `git diff -- server/views/advertisingLandingPage.js` to confirm no protected behavior disappeared.

- [ ] **Step 9: Commit Task 3 without staging unrelated files**

```powershell
git add -- server/views/supportCampaign.js server/views/home/mainHomePage.js server/views/advertisingLandingPage.js server/services/reklamAIAssistantService.js tests/homePlatformIntegration.test.js tests/advertisingLandingPage.test.js tests/reklamAIAssistant.test.js
git commit -m "feat: add natural advertising and support journey"
```

### Task 4: Editorial Links Directory

**Files:**
- Modify: `server/views/linksHubPage.js`
- Modify: `tests/linksHubPage.test.js`

**Interfaces:**
- Preserves: `LINKS_DATA` with exactly ten existing official records
- Preserves: `renderLinksHubPage(user?: object|null): string`
- Produces: separate advertising/support callout outside `LINKS_DATA`

- [ ] **Step 1: Rewrite the Links tests for the approved editorial design**

Keep exact ten-record/id assertions. Replace Liquid Glass expectations with semantic grouped directory, search, category filters, copy/visit controls, focus styles, 320px responsive rule, and a separate `/reklam/ekoyildiz-ortaklik?source=links` support callout. Assert absence of `backdrop-filter: blur(28px`, spotlight pointer tracking, and excessive glow markers.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/linksHubPage.test.js`  
Expected: FAIL because the current page still implements the glass/spotlight presentation.

- [ ] **Step 3: Implement the editorial directory**

Keep exported data and client behaviors, but render a restrained profile introduction, grouped link rows, clear platform metadata, and the separate support callout. Use text-safe DOM updates for search/filter state.

- [ ] **Step 4: Run the focused test green**

Run: `node --test tests/linksHubPage.test.js`  
Expected: all tests PASS.

- [ ] **Step 5: Commit Task 4**

```powershell
git add -- server/views/linksHubPage.js tests/linksHubPage.test.js
git commit -m "feat: redesign official links directory"
```

### Task 5: Guided Ticket Creation Experience

**Files:**
- Modify: `server/views/createTicketPage.js`
- Modify: `tests/createTicketPage.test.js`

**Interfaces:**
- Preserves: `renderCreateTicketPage(user, categories, initialQuery): string`
- Preserves: current category keys, advertisement fields, query preselection, and ticket POST payload
- Consumes: Task 1 recovery draft hooks and `eko:connection-recovered` event

- [ ] **Step 1: Write failing guided-flow and safety tests**

Assert three semantic steps, category cards, contextual fields, review summary, inline validation, first-invalid-field focus, previous/next actions, recovery draft attributes, and optional secondary EKOai help. Assert `technical` and `reklam/midroll` preselection still works, existing price and evidence copy remains, and malformed query values fall back without reflected HTML.

- [ ] **Step 2: Add the non-duplicate-submit regression test**

Assert submit disables once, assigns a client request token for UI deduplication, displays recoverable failure state, and only resubmits after an explicit user action; no `eko:connection-recovered` handler calls the submit function automatically.

- [ ] **Step 3: Run the focused test and verify RED**

Run: `node --test tests/createTicketPage.test.js`  
Expected: FAIL on missing guided steps, validation hooks, or recovery-safe submit behavior.

- [ ] **Step 4: Rebuild the page around the guided flow**

Keep the existing renderer and POST endpoint. Move current fields into category, details, and review panels; add accessible step state, inline errors, contextual summary rail, responsive single-column mode, draft attributes, and explicit safe retry.

- [ ] **Step 5: Run focused ticket tests green**

Run: `node --test tests/createTicketPage.test.js tests/ticketInteractionReply.test.js tests/ticketDeliveryStatus.test.js`  
Expected: all tests PASS.

- [ ] **Step 6: Commit Task 5**

```powershell
git add -- server/views/createTicketPage.js tests/createTicketPage.test.js
git commit -m "feat: redesign guided ticket creation"
```

### Task 6: ThanksService Supporter Entry

**Files:**
- Modify: `bot/services/thanksService.js`
- Modify: `tests/thanksService.test.js`

**Interfaces:**
- Preserves: `SUPPORTERS_LIST: string[]` and current service exports
- Produces: list containing exact string `Yusuf ve YK Ordusu`

- [ ] **Step 1: Write the failing supporter assertion**

Add `assert.ok(SUPPORTERS_LIST.includes('Yusuf ve YK Ordusu'));` while retaining all current supporter assertions.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/thanksService.test.js`  
Expected: FAIL because the new supporter is absent.

- [ ] **Step 3: Append the supporter to the existing list**

Add the exact string without removing or renaming any existing entry.

- [ ] **Step 4: Run the focused test green**

Run: `node --test tests/thanksService.test.js`  
Expected: all tests PASS.

- [ ] **Step 5: Commit Task 6**

```powershell
git add -- bot/services/thanksService.js tests/thanksService.test.js
git commit -m "feat: thank Yusuf and YK Ordusu"
```

### Task 7: Cross-Page Visual, Accessibility, and Regression Verification

**Files:**
- Modify only if verification exposes a defect: files already named in Tasks 1–6
- Test: all focused tests from Tasks 1–6 plus existing platform tests

**Interfaces:**
- Consumes: all previous task outputs
- Produces: verified desktop/mobile behavior and a clean handoff

- [ ] **Step 1: Run syntax and focused automated verification**

Run:

```powershell
node --check server/views/connectionRecovery.js
node --check server/views/platformChrome.js
node --check server/views/supportCampaign.js
node --check server/views/home/mainHomePage.js
node --check server/views/advertisingLandingPage.js
node --check server/views/linksHubPage.js
node --check server/views/createTicketPage.js
node --test tests/connectionRecovery.test.js tests/connectionRecoveryIntegration.test.js tests/homePlatformIntegration.test.js tests/advertisingLandingPage.test.js tests/reklamAIAssistant.test.js tests/linksHubPage.test.js tests/createTicketPage.test.js tests/thanksService.test.js tests/platformChrome.test.js tests/dashboardPolish.test.js
```

Expected: syntax exits `0`; all listed tests PASS with zero failures.

- [ ] **Step 2: Start a test server with deployment side effects disabled**

Use a test-only environment that disables startup panel sync, Git auto-deploy, announcements, and schedulers. Do not run the production `node index.js` path unless those external effects are positively disabled.

- [ ] **Step 3: Render and inspect desktop pages**

Inspect `/`, `/reklam/ekoyildiz-ortaklik?intent=advertise`, `/reklam/ekoyildiz-ortaklik?intent=donate`, `/links`, `/tickets/new?category=reklam&package=midroll`, and `scripts/custom_error.html` at approximately 1440×900. Verify hierarchy, no clipped content, no duplicate EKOai surfaces, no excessive glow/glass language, and working CTAs.

- [ ] **Step 4: Render and inspect mobile pages**

Inspect the same pages at 320×700 and 390×844. Verify no horizontal overflow, comfortable tap targets, readable form steps, responsive game canvas, and usable support panel.

- [ ] **Step 5: Exercise recovery and accessibility scenarios**

Simulate 2-second, 6-second, and 12-second outages; confirm short/medium/long presentations and recovery. Navigate every action by keyboard, verify focus restoration and live status text, test reduced motion, play/restart the runner with keyboard and click/touch, and confirm allowed ticket text survives while sensitive fields never persist.

- [ ] **Step 6: Run the broader suite with a bounded timeout and report existing hangs separately**

Enumerate `tests/*.test.js` explicitly for Windows. If the known open-handle tests prevent exit, record the hanging filenames and retain the successful focused suite as the completion gate; do not claim the broad suite passed.

- [ ] **Step 7: Inspect the final diff and working tree**

Run: `git diff --check`, `git status --short`, and `git log --oneline -10`. Confirm no runtime data files, secrets, generated state, or unrelated user files were staged or committed.

- [ ] **Step 8: Commit only verification-driven fixes, if any**

If verification required changes, stage only those files and commit with `fix: polish support and recovery experience`. If no fixes were needed, do not create an empty commit.
