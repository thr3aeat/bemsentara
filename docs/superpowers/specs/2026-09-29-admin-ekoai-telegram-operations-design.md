# EkoYıldız Control Center, EKOai Operations and Telegram Alerts

**Date:** 2026-09-29  
**Status:** Conversational design approved; implementation pending  
**Relationship:** This is a separate architectural sub-project that complements `2026-09-29-support-recovery-advertising-and-page-redesign.md`.

## 1. Product intent

EkoYıldız Control Center should operate as a real administration and operations product rather than a collection of settings and oversized dashboard cards. Authorized staff should be able to understand system health, support demand, security signals, advertising and payment work, staff applications, errors, and alerts from one consistent interface.

EKOai should provide a natural-language, evidence-backed view of that operational data. It may summarize and explain, but it must not silently take security, finance, moderation, or access-control actions. Truly urgent user requests and HIGH/CRITICAL operational events should reach Eko through Telegram without creating duplicate alert storms.

Success means:

- dashboard numbers come from real sources and unavailable values display as unavailable;
- security language describes evidence and risk rather than declaring guilt;
- admin permissions are enforced server-side for every API and sensitive field;
- EKOai answers questions such as “Sunucu nasıl?”, “Son 24 saatte en çok hangi hata oldu?”, and “Şüpheli görünen hesaplar var mı?” with timestamps and confidence;
- urgent tickets and serious operational events are deduplicated, audited, and delivered to Telegram;
- Telegram failure never discards the underlying alert;
- sensitive credentials and user data never enter prompts, logs, or Telegram messages;
- the interface is dense, restrained, responsive, and visually consistent with professional operations software.

## 2. Delivery strategy

The attachment describes a large operations platform. It is split into independently testable releases rather than implemented as one unsafe rewrite.

### Release A — Operations foundation

- permission model and server-side guards;
- append-only operational events and audit records;
- compact overview with real/unavailable metrics;
- Alert Center;
- EKOai Operations Desk with read-only tools;
- urgent ticket and HIGH/CRITICAL Telegram alerts;
- Security Center overview and explanatory risk scoring;
- System Health and Error summaries;
- responsive Control Center shell and global search foundations.

### Release B — Managed workflows

- advanced ticket assignment, status, history, and internal notes;
- advertising order workflow;
- payment review workflow;
- staff application review workflow;
- active admin sessions and termination;
- temporary IP restrictions and rate-limit configuration with confirmations and audit.

### Release C — Infrastructure operations

- backup center using a real backup provider;
- database/storage/queue/cache health adapters;
- live traffic using bounded SSE if infrastructure supports it;
- richer charts and incident timelines;
- safe manual recovery tools.

This specification fully designs Release A. Later releases may expose unavailable cards and navigation placeholders only when labeled honestly and non-interactive; they must not fabricate working operations or statistics.

## 3. Existing system integration

The repository already contains:

- `server/views/adminControlCenter.js` and admin CSS/client assets;
- `server/services/adminControlCenterService.js` for dashboard snapshots;
- `server/routes/adminControlCenter.js` with a basic admin guard;
- `server/services/systemStatusService.js` for real telemetry;
- request guards in `ddosAndExploitGuardService.js` and `securityShieldService.js`;
- Discord trust, investigation, abuse, and account-risk services;
- `bot/services/telegramService.js` with polling, outgoing alerts, and server context;
- existing ticket and EKOai services.

Release A extends these boundaries. It does not replace the complete admin UI, duplicate existing security engines, or create an independent database editor.

## 4. Security prerequisite: Telegram credentials

The current Telegram service contains a bot token and chat identifier fallback in source code. Before any Telegram feature ships:

1. remove every credential fallback from source;
2. require `TELEGRAM_TOKEN` and `TELEGRAM_CHAT_ID` from the runtime environment;
3. treat an absent value as “Telegram unavailable” without startup failure;
4. rotate the exposed bot token through BotFather outside the repository;
5. update deployment secrets with the rotated value;
6. ensure tests use injected fake transports and never a real token.

Rotation is an external operator action. Code can enforce safe configuration but cannot safely rotate BotFather credentials itself.

## 5. Authorization model

Roles:

- `owner`: unrestricted Control Center access;
- `administrator`: general administration except owner-only access/credential operations;
- `security`: Security Center, redacted login security, events, temporary restrictions, and risk data;
- `support`: ticket queues, user support history, and non-sensitive EKOai support summaries;
- `advertising`: advertising orders and relevant customer/ticket data;
- `finance`: payment records and state transitions;
- `moderator`: user moderation views and permitted actions.

Permissions are explicit strings such as:

- `overview.read`
- `security.read`
- `security.ip.read_full`
- `security.restrict`
- `support.read`
- `support.manage`
- `advertising.read`
- `advertising.manage`
- `finance.read`
- `finance.manage`
- `staff.read`
- `staff.manage`
- `system.read`
- `errors.read_stack`
- `sessions.terminate`
- `ekoai.query`

Every route uses server-side permission checks. The browser may hide unavailable controls for clarity, but hiding UI is never authorization. Unauthorized requests receive `403` and an audit/security event without leaking the protected object.

## 6. Operational event model

`OperationalEventService` is the shared ingestion and query boundary.

Normalized event fields:

- immutable event ID;
- type and category;
- severity: `INFO`, `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`;
- first and last observed timestamps;
- source service;
- route/endpoint when applicable;
- redacted actor/user/IP references;
- count and aggregation key;
- evidence object containing allow-listed metrics only;
- applied protection;
- lifecycle status: `open`, `acknowledged`, `resolved`, or `suppressed`;
- links to related ticket, user, audit, or security records.

Events are append-only at the source boundary. Lifecycle transitions create audit entries. No normal admin can edit raw evidence or delete event history.

The first implementation may use bounded in-memory aggregation plus the repository’s established persistence adapter, but retention and maximum collection size must be explicit to prevent unbounded memory growth.

## 7. Security risk service

`SecurityRiskService` consumes normalized signals and returns:

- score from 0–100;
- level `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`;
- human-readable reasons;
- supporting metric references;
- confidence `low`, `medium`, or `high`;
- recommended defensive review action.

Initial signals include:

- request bursts over short windows;
- many endpoint probes from one source;
- repeated failed authentication;
- rate-limit violations;
- abnormal 404/403/429/5xx ratios;
- unauthorized admin route access;
- suspicious or missing user agent;
- sudden concentration on one endpoint;
- existing account/trust risk evidence.

Country/location data is used only when a reliable source exists. The system never invents geolocation. Traffic growth alone cannot produce “attack confirmed”; UI and EKOai use “possible anomaly”, “DDoS-like behavior”, or “high-risk pattern” with evidence.

Risk scoring is explanatory and read-only in Release A. It does not automatically ban users or IPs.

## 8. Emergency alert service

`EmergencyAlertService` accepts two alert classes:

### Operational alerts

- HIGH/CRITICAL security anomalies;
- repeated authentication attacks;
- service outage or sustained severe degradation;
- backup failure when a real backup adapter exists;
- payment integrity issue.

### User support alerts

- account takeover;
- serious payment problem;
- credible threat, harassment, or immediate safety concern;
- a ticket explicitly marked “çok acil” after server-side validation.

An “urgent” label increases priority but does not bypass abuse controls. Rate limits and a per-user cooldown prevent spam. EKOai may recommend urgency, but deterministic rules and/or an authorized staff confirmation decide outbound escalation for ambiguous cases.

Each alert has a stable fingerprint, deduplication window, send status, attempt count, last error, and audit trail. Repeated observations update one alert and may send a concise escalation update rather than duplicate full messages.

Telegram messages contain:

- severity and category;
- concise summary;
- evidence highlights;
- first/last seen time and occurrence count;
- safe Control Center or ticket link;
- lifecycle state.

They never contain secrets, passwords, tokens, session identifiers, complete payment details, unredacted sensitive form text, or full IP addresses unless a separate explicitly authorized secure channel is implemented later.

If Telegram is unavailable, the alert remains `pending` or `failed` in Alert Center. Retry uses bounded backoff and never blocks the request that created the event.

## 9. EKOai Operations Desk

`AdminEkoAIService` is a permission-aware orchestration layer with read-only tools:

- `getSystemHealth(window)`
- `getErrorSummary(window)`
- `getTicketSummary(window, filters)`
- `getSecuritySummary(window)`
- `getRiskCandidates(window, limit)`
- `getAuditSummary(window)`
- `getAdvertisingSummary(window)` when authorized
- `getPaymentSummary(window)` when authorized

The service resolves the caller’s permissions before invoking any tool. Unauthorized datasets are not fetched and therefore cannot leak into the model context. IPs and user identifiers are redacted according to role before prompt construction.

Responses include:

- answer in concise Turkish;
- data window and generated-at timestamp;
- confidence and missing-data notes;
- evidence bullets;
- links to relevant Control Center workspaces;
- a clear distinction between observation and inference.

Examples:

- “Sunucu nasıl?” returns service status, uptime, error rate, and current degradations.
- “Şüpheli kullanıcı var mı?” returns ranked risk candidates with explicit signals, never a guilt claim.
- “Bugünkü ticketları özetle.” returns counts, urgent/open queues, response state, and missing sources.

EKOai cannot execute bans, IP restrictions, role changes, payment changes, session termination, mass ticket actions, or rate-limit changes in Release A.

If the AI provider is unavailable, deterministic summary builders return the same core metrics without pretending an AI response succeeded.

## 10. Control Center overview

The overview uses compact metric groups rather than one giant colored card per statistic. Metrics include only values backed by a real source:

- active/live users and 24-hour logins;
- open/urgent/waiting tickets;
- EKOai-assisted or resolved ticket count when recorded;
- pending staff applications;
- active advertising orders and pending payments when a source exists;
- request/error counts from the operational event stream;
- security alert counts;
- service health;
- last backup only when a backup adapter exists.

Unavailable values render `—` with “Veri kaynağı bağlı değil”. Zero remains `0`; zero and unavailable must never be conflated.

The overview includes a small Alert Center and direct routes to Security, Tickets, EKOai Operations, Errors, System Health, Advertising, Payments, and Staff.

## 11. Security Center Release A

The Security Center route is `/admin/security`, backed by permission-protected JSON endpoints.

Sections:

- current risk posture;
- requests per second/minute and 5/15/60-minute comparisons;
- 2xx/403/404/429/5xx distribution;
- top routes and redacted sources;
- failed login summary;
- active security events;
- explanatory incident timeline;
- risk candidates;
- existing protection state.

Live data initially uses bounded polling of aggregated snapshots. SSE is deferred until a real need and infrastructure support are demonstrated. This prevents a monitoring feature from becoming a performance problem.

Release A offers investigation links and acknowledgement. Temporary IP restriction changes remain Release B unless the existing guard can support tested persistence, false-positive reversal, confirmation, permission, and audit as one complete unit.

## 12. System Health, Error Center, and alerts

System Health adapts existing telemetry for Web, API, Database, Discord/EKOai, Ticket, Authentication, Storage, and VDS where real probes exist. Statuses are `operational`, `degraded`, `offline`, or `unknown`, with last checked and last error time.

Error Center groups errors by stable fingerprint and shows route, type, first/last seen, count, impacted user count when known, and a friendly summary. Stack traces require `errors.read_stack`; other roles receive redacted summaries.

Alert Center groups security, service, ticket, payment, and backup alerts by severity and lifecycle. Counts link to filtered workspaces rather than dead-end badges.

## 13. Admin shell and interaction design

Visual direction:

- neutral solid surfaces and restrained brand accent;
- compact rows, small metric groups, and readable density;
- no neon hacker theme, glass blur, gradient flooding, or oversized rounded cards;
- desktop tables only where comparison matters;
- mobile list/card representations instead of squeezed tables;
- persistent workspace navigation and `Ctrl/Cmd + K` global search;
- visible focus, semantic labels, live-region feedback, and reduced-motion support.

Global search in Release A indexes admin workspaces and the data types already available to the caller. Results are permission filtered on the server or by already-authorized snapshot data; the client cannot discover hidden objects by searching.

## 14. Sensitive and critical actions

Release A is primarily observational. Any existing critical action that remains accessible—ban, role change, payment change, deletion, ticket bulk close, rate-limit change, IP restriction, or session termination—requires:

1. server-side permission check;
2. origin/CSRF protection;
3. strict input validation;
4. explicit confirmation describing the target and effect;
5. rate limit and concurrency lock;
6. before/after audit record;
7. user-safe error handling.

The new EKOai chat never bypasses these controls.

## 15. Routes and component boundaries

Expected Release A boundaries:

- `server/services/operationalEventService.js`
- `server/services/securityRiskService.js`
- `server/services/emergencyAlertService.js`
- `server/services/adminEkoAIService.js`
- `server/services/adminPermissionService.js`
- extensions to `adminControlCenterService.js` and `systemStatusService.js`
- permission-protected routes under the existing admin router plus `/admin/security`;
- focused view components within `adminControlCenter.js` or small adjacent modules if size demands;
- updates to admin CSS/client assets;
- Telegram service credential hardening and injectable send transport;
- focused tests for every service and route.

Existing model adapters and stores are reused. New persistence is introduced only where events/alerts cannot be safely represented by current infrastructure.

## 16. Failure behavior

- Missing data source: show unknown/unavailable, never `0` or fabricated data.
- AI unavailable: deterministic summary with an explicit note.
- Telegram unavailable: retain failed alert, show retry state, never crash startup.
- Security adapter failure: mark its section degraded and preserve other metrics.
- Unauthorized tool request: omit data and return a permission-safe explanation.
- Oversized user question: reject with validation; do not send it to the model.
- Repeated urgent flag abuse: cooldown, event record, and staff-visible warning.
- Duplicate operational event: aggregate by fingerprint and time window.

## 17. Testing and acceptance

Automated coverage includes:

- permission matrix and backend route denial;
- no protected fetch for unauthorized EKOai tools;
- zero versus unavailable metrics;
- normalized event aggregation and bounded retention;
- risk levels, reason lists, confidence, and non-accusatory wording;
- urgent ticket validation, cooldown, deduplication, and audit;
- Telegram success, failure, retry, sanitization, and missing configuration;
- deterministic EKOai fallback and provider failure;
- Alert Center lifecycle;
- stack-trace permission redaction;
- origin/CSRF and sensitive action guards;
- global search permission filtering;
- mobile rendering and keyboard access hooks.

Manual verification includes:

- normal user cannot access `/admin` or admin APIs;
- each role sees only its workspaces and data;
- “Sunucu nasıl?”, “Şüpheli kullanıcı var mı?”, “Son 24 saatin hatalarını özetle”, and ticket summary queries use real evidence;
- one incident creates one Telegram alert plus controlled updates;
- Telegram failure remains visible and retryable;
- no console errors at desktop and mobile widths;
- no real Telegram message, deploy, moderation, payment, or security action occurs in tests.

## 18. Out of scope for Release A

- autonomous EKOai enforcement;
- permanent IP bans;
- attack or guilt declarations without proof;
- raw database editing;
- fake backup, payment, advertising, or traffic data;
- WebSocket/SSE live traffic before bounded polling is measured;
- exposing full IPs or stack traces to general admins;
- allowing Telegram messages to execute administrative commands;
- replacing the previously approved public-site recovery and advertising redesign.
