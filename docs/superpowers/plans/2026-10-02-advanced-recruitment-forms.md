# Advanced Recruitment Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build five substantial role-specific recruitment applications on a shared, versioned form engine with server drafts, conditional questions, accessible multi-step interaction, and immutable question snapshots for admin review.

**Architecture:** Keep short general-purpose forms in the existing catalog while moving staff applications into versioned role modules consumed by a stricter validation engine. Persist authenticated drafts separately, submit them idempotently into backward-compatible `FormSubmission` records, and render the experience with server HTML plus an external progressive-enhancement client.

**Tech Stack:** Node.js 20, Express 4, custom `InMemoryCollection`, server-rendered HTML/CSS/vanilla JavaScript, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-02-advanced-recruitment-forms-design.md`

## Global Constraints

- Apply the long application experience only to moderator, event staff, community ambassador, developer, and debug office roles.
- Each role must contain 6–8 sections and 20–35 meaningful questions with a 20–35 minute estimate.
- Staff forms require the verified DM-auth session from the application operations plan; general forms remain guest-capable.
- Stable question IDs and `schemaVersion` are mandatory; submitted question text is snapshotted.
- Do not add file upload or external storage; portfolio, résumé, and evidence use validated HTTP(S) URLs.
- Client validation is never authoritative; the server revalidates conditions, types, options, lengths, and identity.
- Preserve legacy `formData` compatibility and existing public form aliases.
- Do not modify or commit unrelated working-tree changes or runtime data files.

## Review Focus

- A hidden required conditional question must neither block submission nor remain in the stored payload.
- A draft created under the previous schema version must preserve removed answers as legacy data during migration.
- Two simultaneous submit requests with one idempotency key must create exactly one `FormSubmission`.
- An expired login followed by re-authentication must not overwrite a newer server draft with an older browser backup.
- Question snapshots must remain safe plain data even when a configured label contains HTML-like text.

---

### Task 1: Define the versioned recruitment schema engine

**Files:**
- Create: `server/forms/recruitment/schema.js`
- Create: `server/forms/recruitment/commonSections.js`
- Create: `tests/recruitmentSchema.test.js`
- Modify: `server/forms/catalog.js`

**Interfaces:**
- Produces schema types through builders `question(id, label, options)`, `section(id, title, questions, options)`, and `recruitmentForm(config)`.
- Produces `validateRecruitmentDefinition(definition) -> { valid, errors }` and `isQuestionVisible(question, answers) -> boolean`.
- `catalog.js` composes recruitment definitions with unchanged general forms and exports `getFormDefinitionByType`.

- [ ] **Step 1: Write failing schema invariant tests**

Assert unique stable IDs, required `schemaVersion`, 6–8 sections, 20–35 questions, known question types, valid conditional source/options, candidate/admin labels, 20–35 minute estimate, and safe declarative metadata only. Include malformed HTML-like labels as plain data.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/recruitmentSchema.test.js`

Expected: FAIL because the schema engine is missing.

- [ ] **Step 3: Implement schema builders and shared sections**

Support `text`, `textarea`, `select`, `multiselect`, `boolean`, `date`, `availability`, `url`, and `repeater`; conditions use `{ questionId, operator: 'equals'|'includes', value }`. Define shared identity, availability, experience, motivation, ethics/privacy, and final declaration sections without role-specific questions.

- [ ] **Step 4: Integrate recruitment definitions into the catalog boundary**

Keep general form shapes compatible while allowing `kind: 'recruitment'`, `schemaVersion`, stable section IDs, and advanced validation metadata.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/recruitmentSchema.test.js tests/formsCatalog.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the schema engine**

```bash
git add server/forms/recruitment/schema.js server/forms/recruitment/commonSections.js server/forms/catalog.js tests/recruitmentSchema.test.js
git commit -m "feat: add recruitment form schema"
```

### Task 2: Author the five role modules

**Files:**
- Create: `server/forms/recruitment/moderator.js`
- Create: `server/forms/recruitment/eventStaff.js`
- Create: `server/forms/recruitment/communityAmbassador.js`
- Create: `server/forms/recruitment/developer.js`
- Create: `server/forms/recruitment/debugOffice.js`
- Create: `server/forms/recruitment/index.js`
- Create: `tests/recruitmentDefinitions.test.js`
- Modify: `server/forms/catalog.js`

**Interfaces:**
- Consumes: Task 1 builders/shared sections.
- Produces `RECRUITMENT_FORMS`, keyed by slug and form type.

- [ ] **Step 1: Write failing role-content tests**

For each role assert section/question count bounds, expected competency IDs, at least three realistic scenario questions, a role-specific work sample, ethics/privacy declaration, no duplicate wording IDs, and a non-empty `adminLabel` for every question.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/recruitmentDefinitions.test.js`

Expected: FAIL because role modules are missing or the current forms are too short.

- [ ] **Step 3: Implement moderator and event staff modules**

Use the exact competency groups from the spec: moderation fairness/evidence/escalation/written decisions; event planning/participation/coordination/technical and fairness incidents/post-event reporting.

- [ ] **Step 4: Implement ambassador, developer, and debug office modules**

Use the spec’s role-specific groups. Developer expertise branching must ask only the selected Node.js, Roblox/Luau, web, or design follow-up set. Debug office must cover reproduction, environment, client/server, logs, intermittent failures, regression, severity, and responsible disclosure.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/recruitmentDefinitions.test.js tests/recruitmentSchema.test.js tests/formsCatalog.test.js`

Expected: PASS.

- [ ] **Step 6: Commit role content**

```bash
git add server/forms/recruitment server/forms/catalog.js tests/recruitmentDefinitions.test.js
git commit -m "feat: add role-specific recruitment forms"
```

### Task 3: Implement authoritative conditional validation and snapshots

**Files:**
- Create: `server/forms/recruitment/validation.js`
- Create: `server/forms/recruitment/snapshot.js`
- Create: `tests/recruitmentValidation.test.js`
- Modify: `server/forms/catalog.js`

**Interfaces:**
- Produces `validateRecruitmentPayload(definition, payload, identity) -> { valid, answers, errors, completionMetadata }`.
- Produces `createQuestionSnapshot(definition, answers) -> Array<{ sectionId, title, questions: Array<{ id, label, adminLabel, type }> }>`.

- [ ] **Step 1: Write failing validation tests**

Cover all supported types, min/max length, safe HTTP(S) URLs, allowed selections, repeater limits, unknown IDs, tampered options, conditional show/hide, hidden-answer removal, identity override, and payload size boundaries.

- [ ] **Step 2: Verify validation RED**

Run: `node --test tests/recruitmentValidation.test.js`

Expected: FAIL because advanced validation is missing.

- [ ] **Step 3: Implement pure validation and completion metadata**

Derive visible questions server-side from already-normalized answers, strip unknown/hidden data, source Discord identity only from the verified session, and return literal per-field errors plus completed/total visible counts.

- [ ] **Step 4: Implement immutable safe snapshots**

Copy only IDs, plain labels, admin labels, types, section titles, schema version, and the questions actually presented. Do not copy functions, conditions as executable strings, or HTML.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/recruitmentValidation.test.js tests/formsCatalog.test.js`

Expected: PASS.

- [ ] **Step 6: Commit validation and snapshots**

```bash
git add server/forms/recruitment/validation.js server/forms/recruitment/snapshot.js server/forms/catalog.js tests/recruitmentValidation.test.js
git commit -m "feat: validate recruitment applications"
```

### Task 4: Add authenticated server drafts and schema migration

**Files:**
- Create: `models/FormDraft.js`
- Create: `server/forms/draftService.js`
- Create: `server/routes/formDrafts.js`
- Create: `tests/formDraftService.test.js`
- Create: `tests/formDraftRoutes.test.js`
- Modify: `server/app.js`

**Interfaces:**
- `FormDraft`: one active record per `{ discordId, formType }` with `schemaVersion`, `answers`, `currentStep`, `completionPercent`, `updatedAt`, and `legacyAnswers`.
- `createDraftService({ draftRepo, catalog, clock })`: `get`, `save`, `migrate`, `deleteAfterSubmission`.
- Routes: `GET /api/forms/:slug/draft`, `PUT /api/forms/:slug/draft`, `DELETE /api/forms/:slug/draft`.

- [ ] **Step 1: Write failing draft service tests**

Assert one active draft, partial validation, verified identity ownership, current-step bounds, completion calculation, schema migration, preservation of removed answers in `legacyAnswers`, and rejection of stale `updatedAt` writes that would overwrite newer server data.

- [ ] **Step 2: Verify service RED**

Run: `node --test tests/formDraftService.test.js`

Expected: FAIL because draft storage is missing.

- [ ] **Step 3: Implement the model and service**

Use `InMemoryCollection` persistence and optimistic concurrency through an exact `baseUpdatedAt` match. Migration keeps compatible stable IDs, revalidates options, and moves removed values to legacy storage.

- [ ] **Step 4: Write failing route tests**

Assert `401` without verified DM-auth identity, `404` for general/unknown forms, safe draft response, stale-write `409`, and route-level payload limits.

- [ ] **Step 5: Implement and mount draft routes**

Mount before the generic API router. Never accept `discordId` from request bodies.

- [ ] **Step 6: Verify GREEN**

Run: `node --test tests/formDraftService.test.js tests/formDraftRoutes.test.js`

Expected: PASS.

- [ ] **Step 7: Commit server drafts**

```bash
git add models/FormDraft.js server/forms/draftService.js server/routes/formDrafts.js server/app.js tests/formDraftService.test.js tests/formDraftRoutes.test.js
git commit -m "feat: persist recruitment form drafts"
```

### Task 5: Build the accessible advanced form experience

**Files:**
- Create: `server/public/forms/recruitment.js`
- Create: `server/public/forms/recruitment.css`
- Create: `tests/recruitmentFormPage.test.js`
- Modify: `server/views/formsPage.js`
- Modify: `tests/formsPage.test.js`

**Interfaces:**
- Consumes: recruitment definitions and Task 4 draft APIs.
- Produces server HTML annotated with `data-recruitment-form`, stable section/question IDs, condition metadata, and an external controller.

- [ ] **Step 1: Write failing renderer tests**

Assert six-to-eight-step navigation, real labels/descriptions, progress, estimated time, draft status, save-and-exit, review/edit links, every supported control type, accessible error relationships, no inline answer HTML injection, and an expired-login recovery state that compares timestamps before merging a local backup with the newer server draft.

- [ ] **Step 2: Verify renderer RED**

Run: `node --test tests/recruitmentFormPage.test.js tests/formsPage.test.js`

Expected: FAIL because current rendering supports only basic short forms and inline client code.

- [ ] **Step 3: Extend the server renderer and styles**

Render one focused competency section at a time, serious site-theme typography, responsive navigation, and progressive-enhancement fallbacks. Keep general form output unchanged.

- [ ] **Step 4: Implement the external browser controller**

Support keyboard step navigation, condition updates, field errors, review/edit navigation, 600ms debounced server saves, local backup with server timestamp, offline pending status, authenticated resume, save-and-exit, and safe DOM APIs.

- [ ] **Step 5: Add deterministic client-source assertions and syntax checks**

Assert the source uses `AbortController`, no API-data `innerHTML`, server draft endpoints, conflict handling, and focus transfer to the first invalid control.

- [ ] **Step 6: Verify GREEN**

Run: `node --check server/public/forms/recruitment.js`

Run: `node --test tests/recruitmentFormPage.test.js tests/formsPage.test.js`

Expected: PASS.

- [ ] **Step 7: Commit the candidate experience**

```bash
git add server/public/forms/recruitment.js server/public/forms/recruitment.css server/views/formsPage.js tests/recruitmentFormPage.test.js tests/formsPage.test.js
git commit -m "feat: add advanced recruitment form experience"
```

### Task 6: Submit drafts atomically with immutable question snapshots

**Files:**
- Modify: `models/FormSubmission.js`
- Modify: `server/forms/submissionService.js`
- Create: `server/routes/recruitmentForms.js`
- Create: `tests/recruitmentSubmission.test.js`
- Modify: `server/app.js`
- Modify: `server/routes/api.js`
- Modify: `server/routes/pages.js`

**Interfaces:**
- Consumes: Tasks 3–4 validation/snapshot/draft services and verified DM-auth session.
- Produces `submitRecruitmentForm({ definition, body, user, idempotencyKey, notify }) -> { submissionId, message }`.
- Routes keep `POST /api/forms/:slug/submit` and `GET /forms/:slug` while delegating recruitment slugs to the new handlers.

- [ ] **Step 1: Write failing submission tests**

Assert authentication, server identity, final validation, `schemaVersion`, `questionSnapshot`, normalized `answers`, backward-compatible `formData`, completion metadata, one active application, one submission per idempotency key, draft deletion only after success, and notification failure isolation.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/recruitmentSubmission.test.js`

Expected: FAIL because recruitment submission metadata and idempotency are missing.

- [ ] **Step 3: Extend `FormSubmission` compatibility fields and service**

Persist snapshots as plain data. Keep existing status defaults and legacy readers working. Implement the create/idempotency/draft-finalization sequence behind one service boundary so retries return the stored submission.

- [ ] **Step 4: Add focused recruitment routes and remove duplicate matching**

Mount the recruitment router before generic `apiRoutes/pagesRoutes`; leave general catalog forms on the existing path. Remove or adapt only duplicate staff-form handlers after route tests prove the new order.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/recruitmentSubmission.test.js tests/formsSubmission.test.js tests/formsPage.test.js`

Expected: PASS.

- [ ] **Step 6: Commit recruitment submission**

```bash
git add models/FormSubmission.js server/forms/submissionService.js server/routes/recruitmentForms.js server/app.js server/routes/api.js server/routes/pages.js tests/recruitmentSubmission.test.js
git commit -m "feat: submit versioned recruitment applications"
```

### Task 7: Integrate admin answer display and perform full regression verification

**Files:**
- Modify: `server/services/submissionAnswerNormalizer.js`
- Modify: `tests/submissionAnswerNormalizer.test.js`
- Create: `tests/recruitmentAdminIntegration.test.js`
- Modify: `tests/adminApplicationsRoute.test.js`

**Interfaces:**
- Consumes: `questionSnapshot` and normalized `answers` from Task 6.
- Produces snapshot-first admin display, with catalog and legacy fallbacks from the application operations plan.

- [ ] **Step 1: Write failing integration tests**

Submit each role fixture through the real service, load it through the admin detail service, and assert every visible submitted question appears in snapshot order with its real admin label. Include an old flat record and an old nested record in the same result set.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/recruitmentAdminIntegration.test.js`

Expected: FAIL until the normalizer prefers immutable snapshots.

- [ ] **Step 3: Implement snapshot-first answer normalization**

Use `questionSnapshot + answers` first, live catalog + `formData` second, and lossless legacy fallback last. Preserve explicit empty/false values and mark legacy-only answers.

- [ ] **Step 4: Verify focused GREEN**

Run: `node --test tests/recruitmentAdminIntegration.test.js tests/submissionAnswerNormalizer.test.js tests/adminApplicationsRoute.test.js`

Expected: PASS.

- [ ] **Step 5: Verify all five real forms in a browser**

At 1440px and 390px widths, open every role, exercise at least one conditional branch, save and resume a draft, simulate offline save then reconnect, trigger validation, edit from final review, and submit. Verify keyboard-only completion and visible focus for the moderator form.

Expected: all role forms remain readable, conditions and progress are accurate, drafts survive, and no horizontal clipping or lost answers occur.

- [ ] **Step 6: Run full project verification**

Run: `node --check server/public/forms/recruitment.js`

Run: `node --test tests`

Expected: all tests pass with no unreported failures. If a pre-existing unrelated failure occurs, record its exact test name and output before proceeding.

- [ ] **Step 7: Commit the integration**

```bash
git add server/services/submissionAnswerNormalizer.js tests/submissionAnswerNormalizer.test.js tests/recruitmentAdminIntegration.test.js tests/adminApplicationsRoute.test.js
git commit -m "feat: show versioned recruitment answers"
```
