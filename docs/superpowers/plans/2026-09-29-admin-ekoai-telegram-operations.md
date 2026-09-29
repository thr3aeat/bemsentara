# Admin EKOai and Telegram Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Release A of the EkoYıldız Control Center with permission-aware operational data, explainable security risk signals, read-only EKOai summaries, and deduplicated urgent Telegram alerts.

**Architecture:** Existing Store collections remain the persistence boundary. Focused services normalize operational events, calculate risk, queue emergency alerts, and expose permission-filtered read-only tools; the existing admin router composes those services into JSON endpoints consumed by the current server-rendered Control Center shell. Telegram sending is isolated behind an injected transport so missing credentials and network failures are observable without crashing requests or tests.

**Tech Stack:** Node.js 20, CommonJS, Express 4, existing file/Mongo-backed Store adapter, native `node:test`, server-rendered HTML, vanilla CSS and JavaScript, existing AI provider adapter, Axios-backed Telegram API.

**Spec:** `docs/superpowers/specs/2026-09-29-admin-ekoai-telegram-operations-design.md`

## Global Constraints

- Release A is observational: EKOai must not ban, restrict IPs, change roles/payments/rate limits, terminate sessions, or perform bulk ticket actions.
- Every admin JSON route and sensitive field must be authorized on the server; client-side hiding is not authorization.
- Missing data is represented by `null`/`unknown` and rendered as `—` with “Veri kaynağı bağlı değil”; it must never become a fabricated zero.
- Security output must use evidence-based language such as “possible anomaly” or “high-risk pattern”, never unproven guilt or attack declarations.
- Telegram credentials come only from `TELEGRAM_TOKEN` and `TELEGRAM_CHAT_ID`; absence degrades safely and tests use fake transports.
- Alerts are deduplicated, auditable, non-blocking, sanitized, and retained when delivery fails.
- Prompt, log, UI, and Telegram payloads must not contain tokens, passwords, session identifiers, complete payment details, raw sensitive ticket text, or full IPs for roles lacking `security.ip.read_full`.
- Use bounded polling for Release A; do not add WebSocket/SSE infrastructure.
- Preserve the user's uncommitted `server/views/advertisingLandingPage.js` changes and do not start production `node index.js` during verification.

## Review Focus

- Missing or partially configured Telegram environment: startup and request paths continue; the alert remains visible as `failed` or `pending`.
- Repeated urgent submissions or duplicate security signals: one fingerprinted alert is created, counts update, and cooldown prevents message storms.
- Crafted admin role flags, direct endpoint calls, and forbidden EKOai questions: no protected reader runs and the response contains no sensitive field.
- Malformed timestamps, oversized AI questions, strange Store records, and unavailable adapters: bounded validation returns safe errors or `unknown`, never crashes or `NaN`.
- Hostile text and identifier content in events/tickets/errors: HTML, logs, AI context, and Telegram payloads remain escaped, redacted, and length bounded.

---

### Task 1: Environment-only Telegram transport

**Files:**
- Create: `bot/services/telegramTransport.js`
- Modify: `bot/services/telegramService.js`
- Test: `tests/telegramTransport.test.js`

**Interfaces:**
- Consumes: injected HTTP client with `post(url, body)`.
- Produces: `createTelegramTransport({ http, token, chatId, logger })` returning `{ isConfigured(), send(text) }`; `send(text)` resolves `{ ok, code, error? }` and never throws a network/configuration failure.

- [ ] **Step 1: Write the failing transport tests**

Cover `isConfigured() === false` with either value absent; `send()` returns `{ ok: false, code: 'not_configured' }` without an HTTP call; configured sending uses the injected client and fixed chat ID; API rejection returns `delivery_failed`; text is bounded to Telegram's safe message length. Assert source no longer contains credential-shaped fallbacks or dynamic chat discovery when an explicit chat ID is absent.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/telegramTransport.test.js`
Expected: FAIL because `telegramTransport.js` does not exist and the legacy service still owns credential fallback behavior.

- [ ] **Step 3: Implement and integrate the minimal transport**

Read `process.env.TELEGRAM_TOKEN` and `process.env.TELEGRAM_CHAT_ID` only at the legacy service composition boundary. Replace `sendTelegramAlert(text)` internals with the transport result while preserving its current boolean public contract for existing callers. Polling must refuse to start when token or chat ID is missing and must not try to infer a destination from arbitrary updates.

- [ ] **Step 4: Run transport and existing Telegram-adjacent tests**

Run: `node --test tests/telegramTransport.test.js tests/ekoAITicketService.test.js`
Expected: PASS with no real HTTP request.

- [ ] **Step 5: Commit**

Run: `git add bot/services/telegramTransport.js bot/services/telegramService.js tests/telegramTransport.test.js && git commit -m "fix: harden Telegram credential handling"`

### Task 2: Explicit admin permissions and field redaction

**Files:**
- Create: `server/services/adminPermissionService.js`
- Test: `tests/adminPermissionService.test.js`

**Interfaces:**
- Consumes: request user objects from Passport and optional role fields already stored on users.
- Produces: `resolveAdminRole(user)`, `getPermissions(user)`, `hasPermission(user, permission)`, `requireAdminPermission(permission, { recordDeniedAccess }?)`, `requireTrustedAdminOrigin({ allowedOrigins }?)`, `redactAdminValue(value, { user, kind })`, and `getAdminCapabilities(user)`.

- [ ] **Step 1: Write the failing permission matrix tests**

Pin the spec roles and permission strings. Assert owner has all Release A permissions; administrator lacks owner-only full-IP/credential operations; security can read redacted security data; support cannot fetch finance/security readers; banned or ordinary users have no permissions; full IP becomes a stable masked value unless `security.ip.read_full` is present. A denied direct route call invokes `recordDeniedAccess` once without protected data, and an admin mutation without a trusted Origin/Referer is rejected.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/adminPermissionService.test.js`
Expected: FAIL because the permission service does not exist.

- [ ] **Step 3: Implement deterministic role resolution and middleware**

Keep `isSiteAdmin` compatibility for current owners/admins, map explicit `adminRole` values to immutable permission sets, and return `403` JSON without invoking `next()` for denied requests. Record denied access through the injected callback; callback failure must not change the response. Redaction must recurse through arrays/plain objects, mask IP/user identifiers by `kind`, and never mutate its input. The trusted-origin guard is applied only to `/api/admin` mutations so existing non-browser integration routes are not silently broken.

- [ ] **Step 4: Run permission and existing admin route tests**

Run: `node --test tests/adminPermissionService.test.js tests/adminControlCenterRoute.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add server/services/adminPermissionService.js tests/adminPermissionService.test.js && git commit -m "feat: add admin permission matrix"`

### Task 3: Bounded operational event and audit ledger

**Files:**
- Create: `server/services/operationalEventService.js`
- Modify: `models/Store.js`
- Test: `tests/operationalEventService.test.js`

**Interfaces:**
- Consumes: `collections.operationalEvents` and `collections.adminAuditEvents`.
- Produces: `createOperationalEventService({ eventStore, auditStore, now, maxEvents, fingerprintWindowMs })` with `record(input)`, `list(filters)`, `summarize({ since, category })`, `transition({ eventId, status, actorId, reason })`, and `recordAudit(entry)`.

- [ ] **Step 1: Write failing ledger tests**

Assert normalized severity/status defaults, allow-listed evidence, redacted source identifiers, stable fingerprint aggregation inside the window, distinct records outside it, `count`/`lastObservedAt` updates, append-only evidence, audited lifecycle transitions, invalid transitions rejected, and retention never exceeds `maxEvents` even with malformed timestamps.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/operationalEventService.test.js`
Expected: FAIL because the service and persistent Store collections do not exist.

- [ ] **Step 3: Implement the event boundary and register collections**

Add both collection names to `ALL_COLLECTION_NAMES`. `record(input)` accepts `{ type, category, severity, source, route, actorRef, evidence, protection, related }`; reject unknown evidence keys, cap strings/arrays, and calculate the aggregation key from normalized non-sensitive fields.

- [ ] **Step 4: Run ledger and Store compatibility tests**

Run: `node --test tests/operationalEventService.test.js tests/ticketModelCompatibility.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add server/services/operationalEventService.js models/Store.js tests/operationalEventService.test.js && git commit -m "feat: add operational event ledger"`

### Task 4: Explainable security risk signals

**Files:**
- Create: `server/services/securityRiskService.js`
- Modify: `server/services/ddosAndExploitGuardService.js`
- Modify: `server/services/securityShieldService.js`
- Modify: `server/app.js`
- Test: `tests/securityRiskService.test.js`
- Test: `tests/operationalEventMiddleware.test.js`
- Modify: `tests/ddosAndExploitGuard.test.js`

**Interfaces:**
- Consumes: normalized operational events and injected `recordEvent(input)` callbacks from guards.
- Produces: `createSecurityRiskService({ listEvents, now })` with `scoreCandidate(candidateRef, windowMs)` and `listCandidates({ windowMs, limit })`, each returning `{ score, level, reasons, evidenceRefs, confidence, recommendation }`; `createOperationalEventMiddleware({ recordEvent, now })` for bounded request/status aggregation.

- [ ] **Step 1: Write failing risk and guard-emission tests**

Assert request bursts, probes, failed logins, rate-limit violations, unauthorized admin attempts, odd user agents, and elevated HTTP status ratios add bounded documented weights; traffic growth alone cannot exceed `MEDIUM`; missing data lowers confidence; score clamps to 0–100; guard callbacks receive redacted identifiers and never alter current block/allow behavior. Request middleware records method, normalized route, status class, duration bucket, and redacted actor after response finish while excluding static assets/health polling and never storing query/body/cookie/header values.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/securityRiskService.test.js tests/operationalEventMiddleware.test.js tests/ddosAndExploitGuard.test.js`
Expected: FAIL because scoring and injectable guard event sinks are absent.

- [ ] **Step 3: Implement scoring and non-blocking instrumentation**

Use a table of deterministic weights/reason codes. Add `setOperationalEventSink(fn)` or factory injection to the existing guards; event recording failures are swallowed after safe logging and cannot weaken protection middleware. Mount request telemetry after authentication/session parsing and before routes, using response `finish` to record only aggregate-safe fields.

- [ ] **Step 4: Run security tests**

Run: `node --test tests/securityRiskService.test.js tests/operationalEventMiddleware.test.js tests/ddosAndExploitGuard.test.js tests/securityEngine.test.js`
Expected: PASS with existing thresholds unchanged.

- [ ] **Step 5: Commit**

Run: `git add server/services/securityRiskService.js server/services/ddosAndExploitGuardService.js server/services/securityShieldService.js server/app.js tests/securityRiskService.test.js tests/operationalEventMiddleware.test.js tests/ddosAndExploitGuard.test.js && git commit -m "feat: add explainable security risk signals"`

### Task 5: Deduplicated emergency alert queue and urgent-ticket bridge

**Files:**
- Create: `server/services/emergencyAlertService.js`
- Modify: `models/Store.js`
- Modify: `server/routes/api.js`
- Test: `tests/emergencyAlertService.test.js`
- Test: `tests/urgentTicketAlert.test.js`

**Interfaces:**
- Consumes: `collections.emergencyAlerts`, operational events, injected `{ send(text) }` transport, injected ticket reader, and `now`/scheduler functions.
- Produces: `createEmergencyAlertService(deps)` with `enqueue(input)`, `processPending({ limit })`, `list(filters)`, `transition({ alertId, status, actorId })`, `classifyUrgentTicket(ticket)`, and `buildTelegramMessage(alert)`.

- [ ] **Step 1: Write failing queue and ticket tests**

Assert HIGH/CRITICAL events and validated urgent categories enqueue; merely typing “acil” in unrelated content does not bypass deterministic validation; one user/fingerprint within cooldown aggregates instead of duplicating; success becomes `sent`; failure retains `failed` with attempt metadata and bounded backoff; messages omit raw description/full IP/secrets and include severity, evidence summary, time, count, state, and safe link.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/emergencyAlertService.test.js tests/urgentTicketAlert.test.js`
Expected: FAIL because the queue and ticket bridge do not exist.

- [ ] **Step 3: Implement the queue and hook ticket creation**

Register `emergencyAlerts` for persistence. After a web ticket is saved, call the injected/default alert service only when `classifyUrgentTicket(ticket)` returns `{ urgent: true, reasonCode }`; do not await Telegram delivery in the HTTP response path. Store the alert first, then schedule bounded processing.

- [ ] **Step 4: Run alert and ticket tests**

Run: `node --test tests/emergencyAlertService.test.js tests/urgentTicketAlert.test.js tests/ticketDeliveryStatus.test.js tests/createTicketPage.test.js`
Expected: PASS and no real Telegram/Discord call.

- [ ] **Step 5: Commit**

Run: `git add server/services/emergencyAlertService.js models/Store.js server/routes/api.js tests/emergencyAlertService.test.js tests/urgentTicketAlert.test.js && git commit -m "feat: queue urgent Telegram alerts"`

### Task 6: Read-only, permission-aware EKOai Operations service

**Files:**
- Create: `server/services/adminEkoAIService.js`
- Test: `tests/adminEkoAIService.test.js`

**Interfaces:**
- Consumes: permission service, readers named `getSystemHealth`, `getErrorSummary`, `getTicketSummary`, `getSecuritySummary`, `getRiskCandidates`, `getAuditSummary`, `getAdvertisingSummary`, `getPaymentSummary`, plus injected `chatWithAI`.
- Produces: `createAdminEkoAIService(deps)` with `answer({ user, question, window })` returning `{ answer, generatedAt, window, confidence, missingData, evidence, links, usedTools, fallback }`.

- [ ] **Step 1: Write failing orchestration tests**

Assert Turkish intent routing for server health, suspicious candidates, errors, and tickets; forbidden tool readers are never invoked; identifiers are redacted before the model call; question length/shape is validated; provider failure produces an honest deterministic summary; observations and inferences are labeled; no action verbs expose a mutation path.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/adminEkoAIService.test.js`
Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement minimal intent selection, prompt construction, and fallback**

Use allow-listed tool descriptors tied to exact permissions. Limit questions to 1–600 trimmed characters and windows to `1h`, `24h`, or `7d`. Call only selected authorized readers, construct a compact JSON evidence envelope, and tell the provider it is a read-only AI assistant rather than a human operator.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/adminEkoAIService.test.js tests/reklamAIAssistant.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add server/services/adminEkoAIService.js tests/adminEkoAIService.test.js && git commit -m "feat: add read-only EKOai operations desk"`

### Task 7: Release A admin API composition

**Files:**
- Modify: `server/services/adminControlCenterService.js`
- Modify: `server/services/systemStatusService.js`
- Modify: `server/routes/adminControlCenter.js`
- Modify: `server/routes/pages.js`
- Modify: `tests/adminControlCenterService.test.js`
- Modify: `tests/adminControlCenterRoute.test.js`
- Test: `tests/adminOperationsRoutes.test.js`

**Interfaces:**
- Consumes: Tasks 2–6 service APIs and existing Store/model readers.
- Produces: `GET /admin/security` (the Control Center opened on Security), `GET /api/admin/control-center`, `GET /api/admin/security`, `GET /api/admin/events`, `GET /api/admin/alerts`, `POST /api/admin/alerts/:id/acknowledge`, `GET /api/admin/errors`, and `POST /api/admin/ekoai/query`.

- [ ] **Step 1: Write failing snapshot and route tests**

Assert capabilities filter workspaces/search items; unavailable metrics stay `null`; health statuses normalize to `operational|degraded|offline|unknown`; security/events/errors/alerts require their exact permission; stack traces require `errors.read_stack`; error records group by stable name/message/route fingerprint and preserve first/last/count/impacted-user metadata; acknowledgement records actor/audit and respects origin middleware; `/admin/security` selects the Security workspace without bypassing page authorization; oversized EKOai input returns `400`; service failure degrades only its section.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/adminControlCenterService.test.js tests/adminControlCenterRoute.test.js tests/adminOperationsRoutes.test.js`
Expected: FAIL on missing endpoints, capabilities, and normalized summaries.

- [ ] **Step 3: Compose dependency-injected handlers and real readers**

Export handler builders for every route so tests avoid loading production bot/network state. Snapshot output adds `{ capabilities, alerts, eventSummary, riskSummary, errorSummary, health }`; route filters and limits are allow-listed and capped. Adapt the existing error report store into redacted fingerprint groups rather than exposing raw records. Keep legacy snapshot fields during migration.

- [ ] **Step 4: Run admin and security route tests**

Run: `node --test tests/adminControlCenterService.test.js tests/adminControlCenterRoute.test.js tests/adminOperationsRoutes.test.js tests/helpSafetyArchitecture.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add server/services/adminControlCenterService.js server/services/systemStatusService.js server/routes/adminControlCenter.js server/routes/pages.js tests/adminControlCenterService.test.js tests/adminControlCenterRoute.test.js tests/adminOperationsRoutes.test.js && git commit -m "feat: expose permission-aware operations APIs"`

### Task 8: Control Center Release A workspaces

**Files:**
- Modify: `server/views/adminControlCenter.js`
- Modify: `server/public/admin/control-center.css`
- Modify: `server/public/admin/control-center.js`
- Modify: `tests/adminControlCenterPage.test.js`

**Interfaces:**
- Consumes: Task 7 snapshot/endpoints and `capabilities` array.
- Produces: compact Overview, Alert Center, Security Center, EKOai Operations Desk, System Health, and Error Center workspaces with permission-filtered navigation/search.

- [ ] **Step 1: Write failing markup/client contract tests**

Assert semantic headings/labels, `aria-live` result areas, keyboard-accessible command palette, reduced-motion CSS, mobile list fallback, no inline event handlers, no unsafe `innerHTML` for API data, `—` plus “Veri kaynağı bağlı değil” for null, and no navigation/search entry for absent capabilities.

- [ ] **Step 2: Run the page test and verify failure**

Run: `node --test tests/adminControlCenterPage.test.js`
Expected: FAIL because the new workspace contracts are absent.

- [ ] **Step 3: Build the restrained operations UI**

Extend the current shell instead of replacing legacy workspaces. Add small metric groups, filterable event/alert/error rows, evidence-first risk cards, system state rows, and an EKOai question form with timestamp/confidence/missing-data output. Use neutral solid surfaces, one restrained brand accent, polling no faster than 30 seconds, and `textContent`/DOM construction for remote values.

- [ ] **Step 4: Run UI and legacy shell tests**

Run: `node --test tests/adminControlCenterPage.test.js tests/dashboardPolish.test.js`
Expected: PASS at desktop/mobile contract widths with legacy aliases intact.

- [ ] **Step 5: Commit**

Run: `git add server/views/adminControlCenter.js server/public/admin/control-center.css server/public/admin/control-center.js tests/adminControlCenterPage.test.js && git commit -m "feat: build operations control center workspaces"`

### Task 9: Integrated Release A verification and operator documentation

**Files:**
- Create: `docs/operations/admin-ekoai-telegram.md`
- Modify: `tests/adminOperationsRoutes.test.js`
- Modify: `tests/adminControlCenterPage.test.js`

**Interfaces:**
- Consumes: all prior task interfaces.
- Produces: an operator checklist for credential rotation/configuration, Telegram-disabled behavior, alert retry visibility, role verification, and safe local test commands.

- [ ] **Step 1: Add integration assertions for cross-service failure modes**

Pin these scenarios: unauthorized EKOai query performs zero protected reads; one repeated HIGH event produces one alert plus count updates; transport failure appears in Alert Center; missing AI provider returns deterministic health/ticket/security summaries; hostile strings remain plain text in the rendered client contract.

- [ ] **Step 2: Run the complete targeted Release A suite**

Run: `node --test tests/telegramTransport.test.js tests/adminPermissionService.test.js tests/operationalEventService.test.js tests/securityRiskService.test.js tests/operationalEventMiddleware.test.js tests/emergencyAlertService.test.js tests/urgentTicketAlert.test.js tests/adminEkoAIService.test.js tests/adminControlCenterService.test.js tests/adminControlCenterRoute.test.js tests/adminOperationsRoutes.test.js tests/adminControlCenterPage.test.js`
Expected: PASS; zero external Telegram, AI, Discord, deploy, moderation, payment, or security mutations.

- [ ] **Step 3: Write the operator documentation**

Document required environment variable names without values; BotFather token rotation as a mandatory external step; safe disabled-state behavior; role/capability mapping; alert lifecycle/retry inspection; and explicit prohibition on production `node index.js` for local verification.

- [ ] **Step 4: Run regression and static safety checks**

Run: `node --test tests/*.test.js`
Expected: all applicable tests PASS with any pre-existing environment-dependent skips identified rather than hidden.

Run: `git diff --check && rg -n "TELEGRAM_TOKEN\s*=.*\|\|\s*[\"']|TELEGRAM_CHAT_ID\s*=.*\|\|\s*[\"']" bot server`
Expected: no whitespace errors and no credential fallback match.

- [ ] **Step 5: Perform non-production manual verification and commit**

Start only an isolated test harness with Telegram polling, deploy watchers, and outbound integrations disabled. Verify `/admin` desktop/mobile rendering, role-filtered navigation, the four representative EKOai questions, alert failure visibility, keyboard navigation, and no browser console errors. Then run: `git add docs/operations/admin-ekoai-telegram.md tests/adminOperationsRoutes.test.js tests/adminControlCenterPage.test.js && git commit -m "docs: add operations runbook and release verification"`.
