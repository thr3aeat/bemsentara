# Application Operations Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy submissions workspace with a reliable candidate operations center that shows every stored answer, authenticates candidates through hardened Discord DM codes, sends accent-free Components v2 messages, and requires a verified drawn signature before interview completion.

**Architecture:** Normalize legacy and catalog submissions behind one read model, expose focused admin/candidate routes through a dedicated service, and mount purpose-built server-rendered workspaces with external client assets. Keep `FormSubmission` and legacy endpoint paths compatible while moving new behavior out of `server/views.js` and `server/routes/api.js`.

**Tech Stack:** Node.js 20, Express 4, discord.js 14, `@napi-rs/canvas`, custom `InMemoryCollection`, server-rendered HTML/CSS/vanilla JavaScript, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-02-application-operations-design.md`

## Global Constraints

- Keep the existing `/admin#adm-submissions` entry point and current `FormSubmission` records compatible.
- Components v2 containers must not contain `accent_color`.
- Candidate authentication uses a six-digit Discord DM code valid for five minutes and invalidated after three wrong attempts.
- A Discord user must be a member of at least one configured allowed bot guild, including when login uses a numeric Discord ID.
- Approval links are single-use, expire after 24 hours, and store only a SHA-256 token hash.
- Interview acceptance and completion require a completed site approval and valid signature record.
- Candidate-facing links use public routes; never link candidates to `/staff/docs`.
- Do not modify or commit unrelated working-tree changes or runtime data files.

## Review Focus

- A flat catalog submission containing primitive values must render every value, including `false` and an intentionally empty optional answer.
- Two allowed-guild members with the same entered display name must receive no code and must be asked for a Discord ID.
- A fourth verification attempt after three wrong codes must remain rejected even if it supplies the original correct code.
- A signature write failure must leave the approval token usable and the workflow state unchanged.
- A duplicate admin action with the same idempotency key must return the first result without sending a second DM.

---

### Task 1: Normalize every stored answer shape

**Files:**
- Create: `server/services/submissionAnswerNormalizer.js`
- Create: `tests/submissionAnswerNormalizer.test.js`
- Modify: `server/forms/catalog.js`

**Interfaces:**
- Consumes: `getFormDefinitionByType(formType)` from `server/forms/catalog.js`.
- Produces: `normalizeSubmissionAnswers(submission, definition?) -> { sections: Array<{ id, title, legacy, answers: Array<{ id, label, value, valueType, answered }> }> }`.
- Produces: `getFormDefinitionByType(formType) -> FormDefinition|null`.

- [ ] **Step 1: Write failing normalizer tests**

Add tests proving that a flat catalog `formData`, nested legacy `section1`, boolean `false`, arrays, `{ choice, reason }`, and unknown historical keys all survive normalization with stable labels and original ordering. The flat fixture must assert `subject: "Topluluk sorusu"` is visible under its catalog section.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/submissionAnswerNormalizer.test.js`

Expected: FAIL because the normalizer and `getFormDefinitionByType` do not exist.

- [ ] **Step 3: Implement the catalog lookup and pure normalizer**

Implement `getFormDefinitionByType(formType)` and `normalizeSubmissionAnswers(submission, definition = getFormDefinitionByType(submission.formType))`. Use catalog section/question metadata first, legacy section maps second, and humanized keys only as a lossless fallback. Never use truthiness to decide whether a value exists.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/submissionAnswerNormalizer.test.js tests/formsCatalog.test.js tests/formsSubmission.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the answer read model**

```bash
git add server/services/submissionAnswerNormalizer.js server/forms/catalog.js tests/submissionAnswerNormalizer.test.js
git commit -m "fix: normalize application answers"
```

### Task 2: Introduce the application operations service and API

**Files:**
- Create: `server/services/applicationOperationsService.js`
- Create: `server/routes/adminApplications.js`
- Create: `tests/applicationOperationsService.test.js`
- Create: `tests/adminApplicationsRoute.test.js`
- Modify: `server/app.js`
- Modify: `server/routes/api.js`

**Interfaces:**
- Consumes: `normalizeSubmissionAnswers`, `FormSubmission.findAll/findById/update/updateStatus`, and injected `notifier`.
- Produces: `createApplicationOperationsService(deps)` with `list(filters)`, `getDetail(id)`, and `performAction({ id, action, payload, actor, idempotencyKey })`.
- Produces routes: `GET /api/admin/applications`, `GET /api/admin/applications/:id`, and `POST /api/admin/applications/:id/actions/:action`.

- [ ] **Step 1: Write failing service contract tests**

Assert filtering by status/form/search, newest-update sorting, normalized detail answers, allowed transition enforcement, notifier failure recorded as `FAILED` without rolling back the action, retryable notification state, and replay of the same idempotency key without a second notifier call. Include unknown IDs and malformed filters.

- [ ] **Step 2: Verify service RED**

Run: `node --test tests/applicationOperationsService.test.js`

Expected: FAIL because the service is missing.

- [ ] **Step 3: Implement the service with explicit transition rules**

Implement actions `start-review`, `ask-question`, `schedule-interview`, `approve-time`, `accept-interview`, `reject-interview`, `finish-interview`, and `resend-notification`. Store audit entries in `operationHistory` and bounded idempotency results in `operationKeys`; reject out-of-order actions with a typed `409` error.

- [ ] **Step 4: Verify service GREEN**

Run: `node --test tests/applicationOperationsService.test.js`

Expected: PASS.

- [ ] **Step 5: Write failing admin route tests**

Assert `403` without admin status, safe list/detail response shapes, `400/404/409` mapping, and required `Idempotency-Key` for mutating actions.

- [ ] **Step 6: Verify route RED**

Run: `node --test tests/adminApplicationsRoute.test.js`

Expected: FAIL because the router is missing or unmounted.

- [ ] **Step 7: Implement and mount the dedicated router**

Export `{ router, buildAdminApplicationsHandlers }`, mount it before legacy `apiRoutes`, and turn matching legacy `/api/admin/form-submissions*` handlers into thin compatibility calls to the same service rather than duplicate behavior.

- [ ] **Step 8: Verify route GREEN**

Run: `node --test tests/adminApplicationsRoute.test.js tests/applicationOperationsService.test.js`

Expected: PASS.

- [ ] **Step 9: Commit the operations API**

```bash
git add server/services/applicationOperationsService.js server/routes/adminApplications.js server/routes/api.js server/app.js tests/applicationOperationsService.test.js tests/adminApplicationsRoute.test.js
git commit -m "feat: add application operations API"
```

### Task 3: Replace the legacy submissions workspace

**Files:**
- Create: `server/views/adminApplications.js`
- Create: `server/public/admin/applications.js`
- Create: `server/public/admin/applications.css`
- Create: `tests/adminApplicationsPage.test.js`
- Modify: `server/views/adminControlCenter.js`
- Modify: `server/public/admin/control-center.js`
- Modify: `server/views.js`
- Modify: `tests/adminControlCenterPage.test.js`

**Interfaces:**
- Consumes: Task 2 list/detail/action JSON contracts.
- Produces: `renderAdminApplicationsWorkspace() -> string` with `data-admin-workspace="submissions"`.
- Produces browser controller states `idle|loading|ready|empty|error` and a 12-second request timeout.

- [ ] **Step 1: Write failing page structure tests**

Assert queue/search/filter markup, candidate tabs (`Özet`, `Form Yanıtları`, `Mülakat`, `İmza ve Onay`, `İşlem Geçmişi`), retry controls, external asset tags, and exactly one submissions workspace ID.

- [ ] **Step 2: Verify page RED**

Run: `node --test tests/adminApplicationsPage.test.js tests/adminControlCenterPage.test.js`

Expected: FAIL because the dedicated workspace/assets are absent and legacy markup remains.

- [ ] **Step 3: Implement the server-rendered workspace and theme styles**

Use the approved split queue/detail layout. At `max-width: 900px`, stack the queue and detail views and expose a labeled back control. Reuse Control Center design tokens and semantic controls.

- [ ] **Step 4: Implement the safe browser controller**

Use `AbortController` with 12 seconds, `textContent`/DOM nodes for API content, latest-request guards for candidate selection, retry without clearing the last successful view, state-aware actions, and `Idempotency-Key` generated once per user action.

- [ ] **Step 5: Wire navigation and remove the legacy block**

Make `activate('submissions')` dispatch an `admin:workspace-activated` event; the applications controller loads on that event and direct hash entry. Remove the old submissions HTML plus `loadSubmissions`, modal builders, and submission action functions from `renderAdminPage` only after the replacement is mounted.

- [ ] **Step 6: Verify page GREEN**

Run: `node --test tests/adminApplicationsPage.test.js tests/adminControlCenterPage.test.js tests/adminControlCenterRoute.test.js`

Expected: PASS.

- [ ] **Step 7: Commit the admin workspace**

```bash
git add server/views/adminApplications.js server/public/admin/applications.js server/public/admin/applications.css server/views/adminControlCenter.js server/public/admin/control-center.js server/views.js tests/adminApplicationsPage.test.js tests/adminControlCenterPage.test.js
git commit -m "feat: modernize application admin workspace"
```

### Task 4: Harden Discord DM code authentication

**Files:**
- Create: `server/services/discordDmAuthService.js`
- Create: `server/routes/applicationAuth.js`
- Create: `tests/discordDmAuthService.test.js`
- Create: `tests/applicationAuthRoute.test.js`
- Modify: `server/app.js`
- Modify: `server/routes/auth.js`
- Modify: `bot/utils/componentsV2Factory.js`

**Interfaces:**
- Produces: `createDiscordDmAuthService({ clientProvider, allowedGuildIds, userRepo, clock, randomInt, hashSecret })`.
- Produces service methods `requestCode({ identifier, session, ip }) -> { targetId, expiresAt }` and `verifyCode({ code, session, ip }) -> { discordUser, user }`.
- Produces routes `POST /api/application-auth/request-code` and `POST /api/application-auth/verify-code`.

- [ ] **Step 1: Write failing eligibility and OTP tests**

Assert username/ID membership checks across allowed guilds, duplicate-name rejection, six digits, stored hash rather than plaintext, five-minute expiry, replacement by a new code, exactly three failures, rejection of the original correct code after lockout, and request/verify cooldown behavior.

- [ ] **Step 2: Verify service RED**

Run: `node --test tests/discordDmAuthService.test.js`

Expected: FAIL because the service is missing.

- [ ] **Step 3: Implement membership resolution and OTP lifecycle**

Numeric IDs must fetch a member from allowed guilds rather than `client.users.fetch` alone. Resolve exact Discord usernames first; treat global names/nicknames only as secondary matches and reject ambiguous results. Store `codeHash`, `targetId`, `expiresAt`, `failCount`, and cooldown timestamps in the session.

- [ ] **Step 4: Build the accent-free Components v2 login message**

Add a factory helper returning a content-free V2 payload with no `accent_color`, the six-digit code, five-minute warning, `/yardim` link, and EkoYıldız security signature.

- [ ] **Step 5: Verify service GREEN**

Run: `node --test tests/discordDmAuthService.test.js`

Expected: PASS.

- [ ] **Step 6: Write failing route/session tests**

Assert JSON error contracts, no user creation before verification, `req.login` only after success, return-path preservation, DM-closed handling without OAuth fallback, and banned-user rejection.

- [ ] **Step 7: Implement and mount application auth routes**

Keep existing general login routes compatible but delegate `/auth/send-discord-dm-code` and `/auth/verify-discord-dm-code` to the same service where their response contract permits. Mount application auth before generic API routes.

- [ ] **Step 8: Verify route GREEN**

Run: `node --test tests/applicationAuthRoute.test.js tests/discordDmAuthService.test.js`

Expected: PASS.

- [ ] **Step 9: Commit DM authentication**

```bash
git add server/services/discordDmAuthService.js server/routes/applicationAuth.js server/routes/auth.js server/app.js bot/utils/componentsV2Factory.js tests/discordDmAuthService.test.js tests/applicationAuthRoute.test.js
git commit -m "feat: secure application DM login"
```

### Task 5: Centralize accent-free application messages

**Files:**
- Create: `bot/services/applicationMessageFactory.js`
- Create: `tests/applicationMessageFactory.test.js`
- Modify: `bot/services/formInterviewService.js`
- Modify: `bot/services/adminFormHandler.js`
- Modify: `server/services/applicationOperationsService.js`

**Interfaces:**
- Produces `buildApplicationMessage(kind, context) -> { flags, components }` for `site-approval`, `approval-complete`, `question`, `time-approved`, `accepted`, `rejected`, and `interview-finished`.
- Consumes public `baseUrl`, candidate/form/reference fields, and route-specific links.

- [ ] **Step 1: Write failing payload tests**

For every message kind, assert `MessageFlags.IsComponentsV2`, no top-level content/embeds, no container `accent_color`, personalized candidate/form/reference text, and only public site/help/blog/video-blog links.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/applicationMessageFactory.test.js`

Expected: FAIL because the factory is missing and current flows still build embeds/accented containers.

- [ ] **Step 3: Implement the message factory**

End every candidate message with the candidate/reference-specific closing and `EkoYıldız People & Community`. Keep one primary action and context-relevant secondary links.

- [ ] **Step 4: Migrate application and interview senders**

Replace inline application-related embed/V2 construction in the listed services and operations service with the factory. Do not change unrelated bot messages.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/applicationMessageFactory.test.js tests/formsSubmission.test.js`

Expected: PASS.

- [ ] **Step 6: Commit message migration**

```bash
git add bot/services/applicationMessageFactory.js bot/services/formInterviewService.js bot/services/adminFormHandler.js server/services/applicationOperationsService.js tests/applicationMessageFactory.test.js
git commit -m "feat: modernize application messages"
```

### Task 6: Add single-use approval tokens and server-rendered signatures

**Files:**
- Create: `models/ApplicationApprovalToken.js`
- Create: `server/services/applicationApprovalService.js`
- Create: `server/services/signatureService.js`
- Create: `server/routes/applicationApproval.js`
- Create: `server/views/applicationApprovalPage.js`
- Create: `server/public/applications/approval.js`
- Create: `server/public/applications/approval.css`
- Create: `tests/applicationApprovalService.test.js`
- Create: `tests/applicationApprovalRoute.test.js`
- Create: `tests/applicationApprovalPage.test.js`
- Modify: `server/app.js`
- Modify: `.gitignore`

**Interfaces:**
- `ApplicationApprovalToken`: `createTokenRecord`, `findValidByHash`, `consume`, `invalidateOpenForSubmission`.
- `createApplicationApprovalService(deps)`: `issue(submission, actor)`, `inspect(rawToken, authenticatedUser)`, `complete({ rawToken, authenticatedUser, agreements, strokes })`.
- `createSignatureService({ rootDir })`: `validateStrokes(strokes)`, `renderPng(submissionId, strokes) -> { relativePath, sha256 }`.
- Routes: `GET /applications/approve/:token`, `POST /api/applications/approve/:token/complete`, and authorized `GET /api/admin/applications/:id/signature`.

- [ ] **Step 1: Write failing token/workflow tests**

Assert SHA-256-only storage, 24-hour expiry, invalidation on resend, single use, owner matching, agreements required, workflow unchanged on invalid token, and `INTERVIEW_READY` only when approval, signature, and schedule all exist.

- [ ] **Step 2: Verify approval service RED**

Run: `node --test tests/applicationApprovalService.test.js`

Expected: FAIL because token/signature services are missing.

- [ ] **Step 3: Write failing signature tests**

Test empty strokes, NaN/out-of-bounds coordinates, excessive stroke/point count, output under an injected temporary root, PNG signature, and SHA-256 hash. Include a renderer write failure and assert no token consumption.

- [ ] **Step 4: Implement token, signature, and approval services**

Render only validated normalized points through `@napi-rs/canvas`; never persist client SVG/HTML/data URLs. Write to `data/application-signatures/<opaque-name>.png`, add that directory to `.gitignore`, and expose files only through the authorized route.

- [ ] **Step 5: Verify service GREEN**

Run: `node --test tests/applicationApprovalService.test.js`

Expected: PASS.

- [ ] **Step 6: Write failing route and page tests**

Assert DM-auth redirect with preserved return path, wrong-user/expired/used states, three-step semantic markup, touch-capable canvas controls, public documentation links, success state, signature authorization, and no raw filesystem path leakage.

- [ ] **Step 7: Implement the approval router, page, and canvas client**

Use the approved steps: verify details, accept agreements, draw signature. The canvas must scale pointer coordinates for device pixel ratio, support pointer events and clear, reject empty submission before network, and provide accessible text/status controls.

- [ ] **Step 8: Verify route/page GREEN**

Run: `node --test tests/applicationApprovalRoute.test.js tests/applicationApprovalPage.test.js tests/applicationApprovalService.test.js`

Expected: PASS.

- [ ] **Step 9: Commit site approval and signatures**

```bash
git add .gitignore models/ApplicationApprovalToken.js server/services/applicationApprovalService.js server/services/signatureService.js server/routes/applicationApproval.js server/views/applicationApprovalPage.js server/public/applications/approval.js server/public/applications/approval.css server/app.js tests/applicationApprovalService.test.js tests/applicationApprovalRoute.test.js tests/applicationApprovalPage.test.js
git commit -m "feat: add signed application approval"
```

### Task 7: Enforce approval before interview completion and run regression verification

**Files:**
- Modify: `server/services/applicationOperationsService.js`
- Modify: `bot/services/formInterviewService.js`
- Modify: `bot/services/formInterviewScheduler.js`
- Create: `tests/applicationInterviewGate.test.js`
- Modify: `tests/adminApplicationsRoute.test.js`

**Interfaces:**
- Consumes: approval/signature fields from Task 6 and Task 2 action service.
- Produces one shared `assertInterviewGate(submission, action) -> void` used by admin routes and bot interview paths.

- [ ] **Step 1: Write failing end-to-end state tests**

Assert acceptance and finish are blocked without signed approval, schedule may be proposed before approval, ready state derives when the last prerequisite arrives in any order, rejection remains available, and duplicate completion does not send a second DM.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/applicationInterviewGate.test.js`

Expected: FAIL because legacy paths can still bypass the gate.

- [ ] **Step 3: Implement the shared gate at every interview boundary**

Call the same guard from operations service, form interview service, and scheduler-triggered transitions; return user-safe conflict messages while logging technical state.

- [ ] **Step 4: Verify focused GREEN**

Run: `node --test tests/applicationInterviewGate.test.js tests/adminApplicationsRoute.test.js tests/applicationApprovalService.test.js`

Expected: PASS.

- [ ] **Step 5: Verify the real admin and candidate flows in a browser**

Run the app with test fixtures, then inspect `/admin#adm-submissions` at 1440px and 390px widths for loading, populated, empty, timeout/error/retry, long-answer, and signature-preview states. Complete the candidate flow with mouse and touch/pointer emulation; verify expired, used, and wrong-user links show the designed safe states.

Expected: no clipped controls, no permanent loading state, keyboard focus remains visible, and every submitted answer remains readable.

- [ ] **Step 6: Run the full suite and syntax checks**

Run: `node --check server/public/admin/applications.js`

Run: `node --check server/public/applications/approval.js`

Run: `node --test tests`

Expected: all tests pass with no unreported failures. If a pre-existing unrelated failure occurs, record its exact test name and output before proceeding.

- [ ] **Step 7: Commit the interview gate**

```bash
git add server/services/applicationOperationsService.js bot/services/formInterviewService.js bot/services/formInterviewScheduler.js tests/applicationInterviewGate.test.js tests/adminApplicationsRoute.test.js
git commit -m "feat: require signed interview approval"
```
