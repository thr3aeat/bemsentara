# EkoYıldız Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Replace the legacy Forms experience and sponsor surface with a shared, responsive, accessible EkoYıldız Forms product while preserving existing submission flows.

**Architecture:** A catalog-driven Forms domain module becomes the single source of truth for routes, availability, metadata, field schemas, and validation. A dedicated light-theme renderer uses existing platform chrome for the hub and every detail view. A shared submission service validates, persists to FormSubmission, and safely reuses the current bot-notification flow.

**Tech Stack:** Node.js 20, Express 4, CommonJS, node:test, FormSubmission, platform chrome, SponsorAdService.

**Spec:** \`docs/superpowers/specs/2026-09-23-ekoyildiz-forms-design.md\`

## Global Constraints

- Use the Inter-based, light main-home design language and retain platform header/footer/navigation.
- Do not use gradients, neon/glow, glassmorphism, giant emoji, or nested-card layouts.
- Only \`game-moderation\` is closed; every other catalog form and submit endpoint is open.
- Preserve current route aliases, authentication behavior, FormSubmission records, dashboard visibility, and bot notifications.
- Add contact, content/video proposal, bug report, partnership, and security report only under **Diğer Formlar**.
- All validation errors are clear Turkish. Security reporting never asks for credentials.
- Provide semantic labels, visible focus, status text, reduced-motion behavior, and no horizontal overflow at 320 px.

## Review Focus

- A stale community-ambassador date gate must not reject a valid submission; Task 4 owns the test.
- Optional fields must not make a valid general-form submission fail; Task 4 owns the test.
- User-entered titles, descriptions, and responses must be escaped before HTML rendering; Tasks 2 and 4 own the tests.
- Long titles, URLs, or usernames must not overflow a list row, form action, or sponsor surface; Task 2 owns the CSS test and viewport review.
- The absence of a sponsor must render a deliberate low-priority empty state; Task 5 owns the test.

---

## File Structure

- Create: \`server/forms/catalog.js\` — catalog entries, routes, schema, availability, and pure validation.
- Create: \`server/forms/submissionService.js\` — server-side validation, persistence, duplicate checks, and safe notification dispatch.
- Create: \`server/views/formsPage.js\` — light-theme hub, form detail renderer, success/error UI, and responsive styles.
- Create: \`tests/formsCatalog.test.js\` — metadata, availability, and validation tests.
- Create: \`tests/formsPage.test.js\` — markup, accessibility, responsive, and sponsor rendering tests.
- Create: \`tests/formsApi.test.js\` — POST API integration tests.
- Modify: \`server/views.js\` — make the new Forms renderer authoritative while retaining unrelated legacy views.
- Modify: \`server/routes/pages.js\` — route catalog forms through one handler and preserve aliases.
- Modify: \`server/routes/api.js\` — use the shared submit handler and remove the community deadline.
- Modify: \`server/services/sponsorAdService.js\` and legacy sponsor CSS in \`server/views.js\` — theme-safe sponsor markup and empty state.

## Task 1: Define the catalog and pure validation

**Files:**

- Create: \`server/forms/catalog.js\`
- Test: \`tests/formsCatalog.test.js\`

**Interfaces:**

- Produces: \`FORM_CATALOG\`, \`getFormDefinition(slug)\`, \`getOpenForms()\`, \`validateFormPayload(definition, payload)\`.
- \`getFormDefinition\` returns \`{ slug, route, formType, title, description, category, section, estimatedMinutes, status, fields }\` or \`null\`.
- \`validateFormPayload\` returns \`{ valid, values, errors }\`, where \`errors\` maps field names to Turkish messages.

- [ ] **Step 1: Write failing catalog tests**

~~~js
const test = require('node:test');
const assert = require('node:assert/strict');
const { getFormDefinition, getOpenForms, validateFormPayload } = require('../server/forms/catalog');

test('only game moderation is unavailable and ambassador remains open', () => {
  assert.equal(getFormDefinition('game-moderation').status, 'maintenance');
  assert.ok(getOpenForms().some((form) => form.slug === 'community-ambassador'));
  assert.ok(getOpenForms().every((form) => form.slug !== 'game-moderation'));
});

test('bug report requires its core fields but accepts no evidence URL', () => {
  const form = getFormDefinition('bug-report');
  const invalid = validateFormPayload(form, { summary: '', steps: '', expected: '', actual: '' });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.summary, 'Bu alanı doldurman gerekiyor.');

  const valid = validateFormPayload(form, {
    summary: 'Profil ayarları kaydedilmiyor',
    steps: 'Profil > Kaydet',
    expected: 'Ayarların kaydedilmesi',
    actual: 'Buton yanıt vermiyor',
    evidenceUrl: ''
  });
  assert.equal(valid.valid, true);
});
~~~

- [ ] **Step 2: Run the test and verify it fails**

Run: \`node --test tests/formsCatalog.test.js\`  
Expected: FAIL with missing \`server/forms/catalog\`.

- [ ] **Step 3: Implement explicit catalog entries and validation**

~~~js
const FORM_CATALOG = Object.freeze([
  { slug: 'event-staff', formType: 'event_staff', section: 'staff', category: 'Başvurular', status: 'open', estimatedMinutes: 12 },
  { slug: 'community-ambassador', formType: 'community_ambassador', section: 'staff', category: 'Başvurular', status: 'open', estimatedMinutes: 15 },
  { slug: 'developer', formType: 'developer', section: 'staff', category: 'Başvurular', status: 'open', estimatedMinutes: 12 },
  { slug: 'debug-office', formType: 'debug_office', section: 'staff', category: 'Başvurular', status: 'open', estimatedMinutes: 10 },
  { slug: 'game-moderation', formType: 'game_moderation', section: 'staff', category: 'Başvurular', status: 'maintenance', estimatedMinutes: 10 },
  { slug: 'contact', formType: 'contact', section: 'other', category: 'Topluluk', status: 'open', estimatedMinutes: 3 },
  { slug: 'content-proposal', formType: 'content_proposal', section: 'other', category: 'İçerik', status: 'open', estimatedMinutes: 4 },
  { slug: 'bug-report', formType: 'bug_report', section: 'other', category: 'Destek', status: 'open', estimatedMinutes: 5 },
  { slug: 'partnership', formType: 'partnership', section: 'other', category: 'Partnerlik', status: 'open', estimatedMinutes: 6 },
  { slug: 'security-report', formType: 'security_report', section: 'other', category: 'Güvenlik', status: 'open', estimatedMinutes: 5 }
]);
~~~

Define every field with \`name\`, \`label\`, \`type\`, \`required\`, \`maxLength\`, \`description\`, and \`placeholder\`. Convert current staff-page field names and section structure into the catalog so downstream review/bot flows retain compatible data. New schemas are: contact (subject, message, replyPreference), content proposal (title, url, rationale), bug report (summary, steps, expected, actual, evidenceUrl optional), partnership (organization, contactName, audience, proposal), and security report (summary, affectedArea, reproductionOrEvidence, replyPreference).

Normalize every string via \`String(value ?? '').trim()\`; missing required values return \`Bu alanı doldurman gerekiyor.\`; invalid nonempty URL fields return \`Geçerli bir bağlantı girmen gerekiyor.\`; overlength values return a Turkish maximum-length error.

- [ ] **Step 4: Run the focused test**

Run: \`node --test tests/formsCatalog.test.js\`  
Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add server/forms/catalog.js tests/formsCatalog.test.js
git commit -m "feat: add shared forms catalog"
~~~

## Task 2: Build the dedicated Forms renderer

**Files:**

- Create: \`server/views/formsPage.js\`
- Modify: \`server/views.js\`
- Test: \`tests/formsPage.test.js\`

**Interfaces:**

- Consumes: catalog functions from Task 1 and \`renderPlatformHeader\`, \`renderPlatformFooter\`, \`renderSearchDialog\`, \`platformChromeStyles\`, \`platformChromeScript\`.
- Produces: \`renderFormsHubPage(user)\`, \`renderFormPage(user, definition, existingSubmission)\`, \`renderClosedFormPage(user, definition)\`.

- [ ] **Step 1: Write failing renderer tests**

~~~js
const test = require('node:test');
const assert = require('node:assert/strict');
const { getFormDefinition } = require('../server/forms/catalog');
const { renderFormsHubPage, renderFormPage, renderClosedFormPage } = require('../server/views/formsPage');

test('hub separates staff and other forms without the legacy gaming UI', () => {
  const html = renderFormsHubPage(null);
  assert.match(html, /Yetkili Alımları/);
  assert.match(html, /Diğer Formlar/);
  assert.match(html, /Genel İletişim/);
  assert.doesNotMatch(html, /20 SAAT SONRA KAPANACAK|EKOYILDIZ APPLICATIONS/);
});

test('detail page uses labels, live feedback, focus styling and overflow protection', () => {
  const html = renderFormPage(null, getFormDefinition('bug-report'), null);
  assert.match(html, /<label[^>]*for="field-summary"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /overflow-wrap:anywhere/);
  assert.match(html, /@media\(max-width:760px\)/);
});

test('only maintenance uses a disabled action', () => {
  const html = renderClosedFormPage(null, getFormDefinition('game-moderation'));
  assert.match(html, /Başvurular geçici olarak kapalı/);
  assert.match(html, /disabled/);
});
~~~

- [ ] **Step 2: Run the test and verify it fails**

Run: \`node --test tests/formsPage.test.js\`  
Expected: FAIL with missing \`server/views/formsPage\`.

- [ ] **Step 3: Implement the document shell, hub, and form renderer**

~~~js
function renderFormsDocument({ user, activePath, title, body }) {
  return '<!doctype html><html lang="tr"><head>'
    + '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + escapeHtml(title) + ' — EkoYıldız</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">'
    + platformChromeStyles('light') + '<style>' + formsStyles + '</style></head>'
    + '<body class="forms-page">' + renderPlatformHeader({ user, activePath, theme: 'light' })
    + '<main class="forms-shell">' + body + '</main>' + renderPlatformFooter({ theme: 'light' })
    + renderSearchDialog({ theme: 'light' }) + platformChromeScript() + '</body></html>';
}
~~~

Use a \`width:min(1160px,calc(100% - 40px))\` shell, 9–16 px radii, thin neutral lines, small monochrome SVG/character icons, and calm hover movement of at most 2 px. The hub renders two sections from catalog \`section\` values. Open items are links; game moderation renders an article with a disabled button. Never put the new five forms in the staff section.

Generate inputs from schema. For grouped options use \`fieldset\`/ \`legend\`; for every control use real labels, help IDs, error IDs, \`aria-describedby\`, \`aria-invalid\`, and required text. Long staff forms get simple text progress. Short general forms remain one page. Client code validates required values, focuses the first invalid field, disables the submit button while posting JSON to its endpoint, and replaces the form only after a successful response containing \`submissionId\`. Errors use server text or a clear Turkish network message.

Include \`min-width:0\`, \`max-width:100%\`, \`overflow-wrap:anywhere\`, a 760 px stacking breakpoint, and a reduced-motion media query.

- [ ] **Step 4: Make the renderer authoritative in views.js**

~~~js
const {
  renderFormsHubPage,
  renderFormPage,
  renderClosedFormPage,
} = require('./views/formsPage');
~~~

Export these functions from \`server/views.js\`. Remove only the old active definitions of those identical names; retain unrelated legacy renderers and compatibility exports.

- [ ] **Step 5: Run focused rendering regressions**

Run: \`node --test tests/formsPage.test.js tests/platformChrome.test.js tests/homePlatformIntegration.test.js\`  
Expected: PASS.

- [ ] **Step 6: Commit**

~~~bash
git add server/views/formsPage.js server/views.js tests/formsPage.test.js
git commit -m "feat: redesign forms pages"
~~~

## Task 3: Route catalog forms and retain aliases

**Files:**

- Modify: \`server/routes/pages.js\`
- Modify: \`tests/formsPage.test.js\`

**Interfaces:**

- Consumes: catalog, renderer functions, and \`FormSubmission.findPendingByUser(userId, formType)\`.
- Produces: one \`GET /forms/:slug\` handler, with legacy alias redirects still preceding it.

- [ ] **Step 1: Add a route-source regression test**

~~~js
const fs = require('node:fs');
const path = require('node:path');

test('form routes retain aliases and expose catalog detail routes', () => {
  const source = fs.readFileSync(path.join(__dirname, '../server/routes/pages.js'), 'utf8');
  assert.match(source, /router\.get\(['"]\/forms\/:slug/);
  assert.match(source, /res\.redirect\(["']\/forms\/community-ambassador/);
  assert.match(source, /res\.redirect\(["']\/forms\/developer/);
  assert.match(source, /res\.redirect\(["']\/forms\/debug-office/);
});
~~~

- [ ] **Step 2: Run the test and verify it fails**

Run: \`node --test tests/formsPage.test.js\`  
Expected: FAIL because no dynamic catalog route exists.

- [ ] **Step 3: Implement one catalog handler**

~~~js
router.get('/forms/:slug', async (req, res) => {
  const definition = getFormDefinition(req.params.slug);
  if (!definition) return res.status(404).send(renderErrorPage(req.user, 'Form bulunamadı.'));
  if (definition.status === 'maintenance') return res.send(renderClosedFormPage(req.user, definition));
  const existing = req.user
    ? await FormSubmission.findPendingByUser(req.user.discordId, definition.formType)
    : null;
  return res.send(renderFormPage(req.user, definition, existing));
});
~~~

Keep \`/forms\` as the hub and preserve aliases for Topluluk Elçisi, Geliştirici, and Hata Ayıklama before this route. Do not redirect unknown slugs to the hub. Preserve existing pending formType values exactly: \`event_staff\`, \`community_ambassador\`, \`developer\`, \`debug_office\`.

- [ ] **Step 4: Run route and page tests**

Run: \`node --test tests/formsPage.test.js tests/platformChrome.test.js\`  
Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add server/routes/pages.js tests/formsPage.test.js
git commit -m "refactor: route forms through catalog"
~~~

## Task 4: Add shared, validated submission handling

**Files:**

- Create: \`server/forms/submissionService.js\`
- Modify: \`server/routes/api.js\`
- Create: \`tests/formsApi.test.js\`

**Interfaces:**

- Produces: \`submitCatalogForm({ definition, body, user })\`, resolving to \`{ submissionId, message }\`.
- Errors carry \`statusCode\`, Turkish \`message\`, and optional field \`errors\`.
- Contract: \`POST /api/forms/:slug/submit\` returns 201 success, 400 validation errors, 409 duplicate pending application, and 404 unknown/maintenance form.

- [ ] **Step 1: Write failing API tests**

~~~js
test('contact persists valid input and returns a submission id', async () => {
  const response = await request(app)
    .post('/api/forms/contact/submit')
    .send({ subject: 'Topluluk sorusu', message: 'Etkinliğe nasıl katılırım?', replyPreference: 'Discord' });
  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.match(response.body.submissionId, /.+/);
});

test('community ambassador has no deadline rejection and missing fields return Turkish errors', async () => {
  const response = await request(app).post('/api/forms/community-ambassador/submit').send({});
  assert.equal(response.status, 400);
  assert.match(response.body.error, /doldurman gerekiyor|zorunlu/i);
  assert.doesNotMatch(response.body.error, /20 saat|sürenin dolması/i);
});
~~~

Use the repository’s existing Express test harness when available. Otherwise mount the API router on a minimal \`express()\` app with \`express.json()\`, deterministic test user middleware, and test-only FormSubmission cleanup after each test.

- [ ] **Step 2: Run the test and verify it fails**

Run: \`node --test tests/formsApi.test.js\`  
Expected: FAIL because the generic route and service are absent.

- [ ] **Step 3: Implement the shared service**

~~~js
async function submitCatalogForm({ definition, body, user }) {
  if (!definition || definition.status !== 'open') throw formError(404, 'Bu form şu anda başvuru kabul etmiyor.');
  const checked = validateFormPayload(definition, body);
  if (!checked.valid) throw formError(400, 'Lütfen işaretli alanları kontrol et.', checked.errors);
  const userId = user?.discordId || 'guest_' + Date.now();
  if (user && await FormSubmission.findPendingByUser(userId, definition.formType)) {
    throw formError(409, 'Bu form için incelenmekte olan bir başvurun bulunuyor.');
  }
  const submission = await FormSubmission.create({
    userId, formType: definition.formType, formTitle: definition.title, formData: checked.values
  });
  await notifySafely(submission);
  return { submissionId: submission._id, message: 'Başvurun alındı.' };
}
~~~

\`notifySafely\` must use the same best-effort Discord notification and interview-start behaviors that existing handlers use. A notification failure must never roll back a saved submission. Adapt validated staff values to the nesting expected by the current interview services instead of forwarding raw \`req.body\`.

- [ ] **Step 4: Register the generic handler and remove the stale gate**

~~~js
router.post('/api/forms/:slug/submit', async (req, res) => {
  const definition = getFormDefinition(req.params.slug);
  try {
    const result = await submitCatalogForm({ definition, body: req.body, user: req.user });
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false, error: error.message, errors: error.errors
    });
  }
});
~~~

Remove \`DEADLINE_MS\` and its expired community-ambassador response. Remove or bypass duplicate individual POST registrations so the generic handler cannot be shadowed.

- [ ] **Step 5: Run API and regression tests**

Run: \`node --test tests/formsApi.test.js tests/formsCatalog.test.js tests/adminControlCenterRoute.test.js\`  
Expected: PASS.

- [ ] **Step 6: Commit**

~~~bash
git add server/forms/submissionService.js server/routes/api.js tests/formsApi.test.js
git commit -m "feat: add validated forms submissions"
~~~

## Task 5: Modernize the Sponsorlu Bağlantı component

**Files:**

- Modify: \`server/services/sponsorAdService.js\`
- Modify: sponsor CSS in \`server/views.js\`
- Modify: \`tests/formsPage.test.js\`

**Interfaces:**

- Preserves: active-ad selection, click tracking, impression tracking, safe target URLs, and admin management.
- Changes: \`renderSponsorAdHtml(customAd)\` always returns semantic active or empty-state markup.

- [ ] **Step 1: Write failing sponsor tests**

~~~js
const sponsorAdService = require('../server/services/sponsorAdService');

test('sponsor renderer exposes an empty state and complete active component', () => {
  const empty = sponsorAdService.renderSponsorAdHtml({ isActive: false });
  assert.match(empty, /sponsor-ad--empty/);
  assert.match(empty, /Şu anda gösterilecek sponsorlu bağlantı yok/);

  const active = sponsorAdService.renderSponsorAdHtml({
    _id: 'ad-1', title: 'EkoYıldız Store', description: 'Topluluğa özel ürünler',
    sponsorName: 'EkoYıldız', ctaText: 'İncele',
    imageUrl: 'https://example.com/logo.png', isActive: true
  });
  assert.match(active, /role="complementary"/);
  assert.match(active, /rel="noopener noreferrer sponsored"/);
});
~~~

- [ ] **Step 2: Run the sponsor test and verify it fails**

Run: \`node --test tests/formsPage.test.js\`  
Expected: FAIL because inactive custom content lacks a deliberate empty state.

- [ ] **Step 3: Implement active and empty semantic variants**

~~~js
if (!ad || ad.isActive === false) {
  return '<aside class="sponsor-ad sponsor-ad--empty" role="status" aria-label="Sponsorlu bağlantı">'
    + '<span class="sponsor-ad__label">Sponsorlu bağlantı</span>'
    + '<p>Şu anda gösterilecek sponsorlu bağlantı yok.</p></aside>';
}
~~~

Use \`sponsor-ad__header\`, \`sponsor-ad__media\`, \`sponsor-ad__content\`, and \`sponsor-ad__action\` classes. Keep safe URL handling, the click route, the \`sponsored\` relation, and one-impression-per-ad tracking.

- [ ] **Step 4: Add contained, responsive CSS**

~~~css
.sponsor-ad{width:min(100%,1000px);margin:2rem auto 0;padding:1rem 1.125rem;border:1px solid var(--sponsor-line);border-radius:14px;background:var(--sponsor-surface);color:var(--sponsor-text)}
.sponsor-ad__body{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:12px;align-items:center}
.sponsor-ad__content{min-width:0}.sponsor-ad__title,.sponsor-ad__description{overflow-wrap:anywhere}
@media(max-width:640px){.sponsor-ad__body{grid-template-columns:42px minmax(0,1fr)}.sponsor-ad__action{grid-column:1/-1}.sponsor-ad__action a{width:100%}}
~~~

Define dark shared-layout variables and override them inside \`.forms-page\` to use the light Forms palette. Do not modify sponsor storage or management behavior.

- [ ] **Step 5: Run sponsor/page regressions**

Run: \`node --test tests/formsPage.test.js tests/platformChrome.test.js\`  
Expected: PASS.

- [ ] **Step 6: Commit**

~~~bash
git add server/services/sponsorAdService.js server/views.js tests/formsPage.test.js
git commit -m "fix: modernize sponsor connection component"
~~~

## Task 6: Full verification and responsive QA

**Files:**

- Modify: \`tests/formsCatalog.test.js\`
- Modify: \`tests/formsPage.test.js\`
- Modify: \`tests/formsApi.test.js\`

**Interfaces:**

- Consumes all catalog, view, route, API, and sponsor interfaces.
- Produces final regression evidence; no new product interface.

- [ ] **Step 1: Add cross-surface assertions**

~~~js
test('every open catalog form has a usable form view and submit endpoint', () => {
  for (const form of getOpenForms()) {
    const html = renderFormPage(null, form, null);
    assert.match(html, new RegExp('/api/forms/' + form.slug + '/submit'));
    assert.doesNotMatch(html, /disabled[^>]*>Forma Git/);
  }
});
~~~

Also assert a 760 px breakpoint, reduced-motion media query, \`aria-live\`, \`aria-invalid\`, and the game-moderation-only maintenance condition.

- [ ] **Step 2: Run the full automated suite**

Run: \`node --test tests/*.test.js\`  
Expected: PASS.

- [ ] **Step 3: Start the local app and perform manual viewport checks**

Run: \`node index.js\`  
Expected: the server starts without an unhandled exception.

At 1440 px, 768 px, and 320 px, inspect \`/forms\`, one staff form, one general form, and \`/forms/game-moderation\`. Verify header/footer, labels, keyboard focus, validation, loading/success/error UI, sponsor active and empty variants, no horizontal scrolling, and no new console errors.

- [ ] **Step 4: Stop the app, inspect the final diff, and commit test coverage**

~~~bash
git diff --check
git status --short
git add tests/formsCatalog.test.js tests/formsPage.test.js tests/formsApi.test.js
git commit -m "test: cover forms redesign regressions"
~~~

- [ ] **Step 5: Record completion evidence**

Include the exact test command output, viewport checks, and any pre-existing non-blocking warnings in the final implementation handoff.

