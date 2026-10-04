# Transparent AI Confession Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-time, explicitly EKOai-supported confession DM and separately labeled automated engagement without inflating human reactions or polls.

**Architecture:** A new dependency-injected `confessionAiEngagementService` owns persistent scheduling, invitation, conversation, automated engagement, owner controls, and escalation. The existing confession service continues to own human activity and delegates presentation to a small shared module; MongoDB state and atomic conditional updates make one-time actions restart-safe and idempotent.

**Tech Stack:** Node.js 20, CommonJS, discord.js 14, Mongoose 8, Node built-in test runner, existing EKOai and Telegram adapters

**Spec:** `docs/superpowers/specs/2026-10-04-transparent-ai-confession-engagement-design.md`

## Global Constraints

- The initial invitation and active conversation UI must visibly say `EKOai destekli`.
- Automated comments, reactions, and poll choices must remain separate from community activity.
- Total automated reactions per confession must stay between 5 and 15.
- One confession may receive at most one AI invitation, one AI session, one promotion, and one summary.
- An AI-identity question must receive a truthful answer and disable every pending AI action for that confession.
- AI sessions cannot reveal identity, transfer tips, or direct users off-platform.
- Owner-only actions require server-side author checks and idempotent atomic updates.
- Missing EKOai or Telegram configuration disables that integration without crashing startup.
- Generated text must be bounded, mention-safe, link-safe, moderated, and based only on confession/session context.
- Existing unrelated changes in `server/public/admin/applications.js` and `server/services/applicationOperationsService.js` must not be modified or committed.

## Review Focus

- Process restart while an invitation or reaction is due: persisted `nextActionAt` must let the scheduler resume exactly once; covered in Task 4.
- Author has both a human bridge and an AI session: the newest active AI session is handled first and human relay remains reachable after AI closure; covered in Task 5.
- Discord DM succeeds but the subsequent database update fails: retry must not create a second session and must keep delivery auditable; covered in Task 4.
- Generated content contains mass mentions, Markdown links, or oversized text: delivery must sanitize or reject it; covered in Task 3 and Task 5.
- Duplicate/out-of-order Discord button events: accept, close, pause, promote, and report must return stable current state without duplicate side effects; covered in Tasks 4 and 6.

---

### Task 1: Harden EKOai and Telegram credentials

**Files:**
- Modify: `bot/services/aiService.js`
- Modify: `bot/services/telegramService.js`
- Create: `tests/aiAndTelegramCredentialSafety.test.js`

**Interfaces:**
- Consumes: runtime `GROQ_API_KEY`/existing supported AI environment aliases, `TELEGRAM_TOKEN`, and `TELEGRAM_CHAT_ID`.
- Produces: `isAIConfigured() -> boolean`, `isTelegramConfigured() -> boolean`, and existing calls that fail safely when configuration is absent.

- [ ] **Step 1: Write the failing credential-safety tests**

Create tests that load each module in a child process with relevant environment variables removed and assert: no source fallback is used, `isAIConfigured()`/`isTelegramConfigured()` return `false`, an AI request rejects with a configuration error, and `sendTelegramAlert()` resolves `false` without making a network request. Add source assertions that the known fallback declarations no longer exist.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/aiAndTelegramCredentialSafety.test.js`  
Expected: FAIL because hardcoded fallbacks and configuration helpers still do not satisfy the tests.

- [ ] **Step 3: Implement configuration-only credentials**

Remove source credential fallbacks. Export `isAIConfigured` from `bot/services/aiService.js` and `isTelegramConfigured` from `bot/services/telegramService.js`; preserve existing environment aliases for AI, require both Telegram values for outbound delivery, and return configuration-safe failures without startup exceptions.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/aiAndTelegramCredentialSafety.test.js`  
Expected: PASS with no real network call.

- [ ] **Step 5: Commit**

```bash
git add bot/services/aiService.js bot/services/telegramService.js tests/aiAndTelegramCredentialSafety.test.js
git commit -m "security: remove embedded AI and Telegram credentials"
```

### Task 2: Persist transparent AI engagement state

**Files:**
- Modify: `models/Confession.js`
- Create: `tests/confessionAiModel.test.js`

**Interfaces:**
- Consumes: existing `Confession` and `ConfessionSession` Mongoose models.
- Produces: `Confession.aiEngagement`, AI session metadata, and a partial unique index for one AI session per confession.

- [ ] **Step 1: Write failing schema tests**

Assert schema defaults and enums for `aiEngagement.enabled`, `state`, `invitationSentAt`, `invitationDeliveryId`, `disabledReason`, `reactionsPausedAt`, `promotedAt`, `summarySentAt`, `nextActionAt`, `deliveryAttempts`, generation counters, `automatedReactions`, and `automatedPollVote`. Assert `ConfessionSession.participantType`, `closeReason`, `lastActivityAt`, bounded message metadata, and the unique partial `{ confessionId: 1, participantType: 1 }` AI-session index.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/confessionAiModel.test.js`  
Expected: FAIL because the schema paths and index are absent.

- [ ] **Step 3: Add the persistence fields and index**

Extend the schemas with exact fields from the spec. Keep existing human-session defaults compatible by defaulting `participantType` to `human`; use a partial unique index whose filter is `{ participantType: 'ai' }`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/confessionAiModel.test.js`  
Expected: PASS without connecting to MongoDB.

- [ ] **Step 5: Commit**

```bash
git add models/Confession.js tests/confessionAiModel.test.js
git commit -m "feat: persist confession AI engagement state"
```

### Task 3: Add deterministic AI policy and shared presentation

**Files:**
- Create: `bot/services/confessionAiPolicy.js`
- Create: `bot/services/confessionPresentationService.js`
- Modify: `bot/services/confessionService.js`
- Create: `tests/confessionAiPolicy.test.js`
- Create: `tests/confessionPresentationService.test.js`

**Interfaces:**
- Consumes: confession documents and existing `ComponentsV2Factory`.
- Produces: `normalizeIdentityText(text) -> string`, `isIdentityQuestion(text) -> boolean`, `sanitizeGeneratedMessage(text, options) -> string`, `allocateAutomatedReactions(input) -> ReactionCounts`, `buildConfessionV2Payload(confession) -> DiscordPayload`, and `refreshConfessionMessage(client, confession) -> Promise<void>`.

- [ ] **Step 1: Write failing policy tests**

Test Turkish identity variants including punctuation and common misspellings; non-identity control phrases; deterministic reaction allocations whose total is 5, 10, and 15 for injected random values; no negative counters; mention/link stripping; whitespace normalization; and the 240-character output cap.

- [ ] **Step 2: Run the policy test and verify RED**

Run: `node --test tests/confessionAiPolicy.test.js`  
Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement the pure policy functions**

Implement and export the four exact functions. `sanitizeGeneratedMessage` must neutralize `@everyone`, `@here`, user/role/channel mentions, Markdown links, and raw HTTP(S) URLs before applying the length limit.

- [ ] **Step 4: Run the policy test and verify GREEN**

Run: `node --test tests/confessionAiPolicy.test.js`  
Expected: PASS.

- [ ] **Step 5: Write failing presentation tests**

Assert human reactions and poll totals remain primary, an `EKOai destekli etkileşim` line appears only when automated activity exists, automated poll choice is labeled separately, DM status remains correct, and automated counts do not alter the human values passed into rendering.

- [ ] **Step 6: Run the presentation test and verify RED**

Run: `node --test tests/confessionPresentationService.test.js`  
Expected: FAIL because the presentation module does not exist.

- [ ] **Step 7: Extract the presentation boundary**

Move `buildConfessionV2Payload` and `refreshConfessionMessage` from `confessionService.js` into the new module, add the separately labeled automated fields, import/re-export them from `confessionService.js` for compatibility, and leave human reaction/poll mutation unchanged.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run: `node --test tests/confessionAiPolicy.test.js tests/confessionPresentationService.test.js`  
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add bot/services/confessionAiPolicy.js bot/services/confessionPresentationService.js bot/services/confessionService.js tests/confessionAiPolicy.test.js tests/confessionPresentationService.test.js
git commit -m "refactor: separate confession AI policy and presentation"
```

### Task 4: Implement restart-safe one-time invitation lifecycle

**Files:**
- Create: `bot/services/confessionAiEngagementService.js`
- Create: `tests/confessionAiInvitation.test.js`

**Interfaces:**
- Consumes: `createConfessionAiEngagementService({ confessionRepository, sessionRepository, chatWithAI, sendTelegramAlert, scheduleWakeup, now, random, sendDm, sendModerationReport, refreshConfessionMessage, logger })`.
- Produces: `isEligible(confession)`, `scheduleForConfession(client, confessionId)`, `runDueActions(client, at)`, `deliverInvitation(client, confessionId)`, `handleInvitationAction(interaction, action, confessionId)`, and `initScheduler(client)`.

- [ ] **Step 1: Write failing invitation lifecycle tests**

Using in-memory repositories and fake transports, test eligibility, atomic scheduling, process-restart recovery through `runDueActions`, one invitation under concurrent runs, exact `EKOai destekli anonim sohbet` copy, accept/decline/close authorization, one AI session, unavailable DM retry state, successful-DM/database-update failure with stable `invitationDeliveryId`, duplicate button idempotency, and no invitation for expired/rejected/disabled/`allowDm: false` confessions.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/confessionAiInvitation.test.js`  
Expected: FAIL because the engagement service does not exist.

- [ ] **Step 3: Implement the service factory and invitation methods**

Use repository methods with atomic compare-and-set semantics: `claimSchedule(confessionId, dueAt)`, `claimInvitation(confessionId, deliveryId)`, `markInvited(confessionId, deliveryId, sentAt)`, `createAiSessionOnce(confessionId, authorId)`, and `transitionAiState(confessionId, fromStates, nextState, patch)`. The default production adapter wraps Mongoose conditional updates; tests use the same interface in memory.

- [ ] **Step 4: Implement the persistent scheduler entry point**

`initScheduler(client)` performs an immediate due-action sweep and installs one bounded interval; each action re-reads state before sending. Export `stopScheduler()` for tests and shutdown.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node --test tests/confessionAiInvitation.test.js`  
Expected: PASS with zero real Discord, AI, MongoDB, or Telegram calls.

- [ ] **Step 6: Commit**

```bash
git add bot/services/confessionAiEngagementService.js tests/confessionAiInvitation.test.js
git commit -m "feat: add one-time EKOai confession invitations"
```

### Task 5: Implement bounded AI DM conversation and identity shutdown

**Files:**
- Modify: `bot/services/confessionAiEngagementService.js`
- Create: `tests/confessionAiConversation.test.js`

**Interfaces:**
- Consumes: Task 3 policy functions and Task 4 service/repository interfaces.
- Produces: `handleDirectMessage(message) -> Promise<boolean>`, `closeAiSession(client, confessionId, reason)`, and a prompt builder that always identifies the role as EKOai-supported.

- [ ] **Step 1: Write failing conversation tests**

Test accepted-session routing; refusal before acceptance; confession content plus at most the latest 20 bounded messages in the prompt; casual but explicitly EKOai-supported output; content sanitization; provider failure; message-count and inactivity closure; AI session precedence while active and human relay availability after closure; truthful identity response; and atomic invalidation of every pending AI action with `disabledReason: identity_question`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/confessionAiConversation.test.js`  
Expected: FAIL because conversation methods are absent.

- [ ] **Step 3: Implement DM handling and prompt construction**

Build model messages from confession content, category, and bounded transcript only. The system prompt must require truthful AI disclosure, prohibit human impersonation/identity collection/off-platform contact, and cap replies before `sanitizeGeneratedMessage` processes them.

- [ ] **Step 4: Implement deterministic identity and closure paths**

Check `isIdentityQuestion` before calling EKOai. Send the truthful response, close the session, disable confession AI state, clear `nextActionAt`, and make later scheduled actions no-op. Apply the same single closure helper to owner close, expiry, safety, completion, inactivity, and message limits.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node --test tests/confessionAiConversation.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add bot/services/confessionAiEngagementService.js tests/confessionAiConversation.test.js
git commit -m "feat: add bounded EKOai confession conversations"
```

### Task 6: Add labeled engagement, owner controls, and escalation

**Files:**
- Modify: `bot/services/confessionAiEngagementService.js`
- Create: `tests/confessionAiControlsAndEngagement.test.js`

**Interfaces:**
- Consumes: Task 3 allocation/presentation functions and Task 4 repository interface.
- Produces: `applyAutomatedEngagement(client, confessionId)`, `sendOwnerControlCard(client, confessionId)`, `handleOwnerAction(interaction, action, confessionId)`, `sendFinalSummary(client, confessionId)`, and `reportAiInteraction(interaction, confessionId, severity)`.

- [ ] **Step 1: Write failing engagement and control tests**

Test separate 5-15 reaction allocation, one separately stored poll choice, labeled thread comment, moderation filtering, owner-only pause/close/promote, no activity after pause/disable/expiry/removal, one promotion under concurrency, one summary under concurrency, real-versus-automated summary wording, duplicate report idempotency, persisted moderation report when Telegram fails, and sanitized Telegram delivery only for HIGH/CRITICAL severity.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/confessionAiControlsAndEngagement.test.js`  
Expected: FAIL because engagement/control methods are absent.

- [ ] **Step 3: Implement automated engagement and summary**

Persist automated reaction and poll fields without mutating `reactions`, `userReactions`, human poll counts, or voters. Post comments as `EKOai destekli anonim yorum`, refresh the card, and claim `summarySentAt` before sending the one-time summary.

- [ ] **Step 4: Implement owner controls**

Render `İtirafımı Öne Çıkar`, `AI Tepkilerini Duraklat`, `Anonim DM'yi Kapat`, and `Moderasyona Raporla`. Check `interaction.user.id === confession.authorId` before each atomic action; closing anonymous DM also closes pending/active AI sessions and prevents new human bridge requests.

- [ ] **Step 5: Implement moderation and Telegram escalation**

Persist/send the existing moderation-channel report first. Call Telegram only for HIGH/CRITICAL, with confession ID, severity, category, timestamp, concise reason, and moderation link; omit transcript, tokens, session IDs, and unnecessary user IDs.

- [ ] **Step 6: Run the focused test and verify GREEN**

Run: `node --test tests/confessionAiControlsAndEngagement.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add bot/services/confessionAiEngagementService.js tests/confessionAiControlsAndEngagement.test.js
git commit -m "feat: add labeled confession AI engagement controls"
```

### Task 7: Integrate Discord handlers and remove deceptive legacy automation

**Files:**
- Modify: `bot/services/confessionService.js`
- Modify: `bot/handlers/buttonHandler.js`
- Modify: `bot/handlers/index.js`
- Modify: `tests/confessionTreasury.test.js`
- Create: `tests/confessionAiIntegration.test.js`

**Interfaces:**
- Consumes: the default production instance exported by `confessionAiEngagementService` and Task 3 presentation exports.
- Produces: publication/moderation scheduling, `confession_ai_*` button routing, AI-first DM routing with human fallback, startup scheduler initialization, and removal of unlabeled synthetic engagement.

- [ ] **Step 1: Write failing integration tests**

Assert approved publication paths call `scheduleForConfession` and `sendOwnerControlCard`; pending confessions wait until moderation approval; `confession_ai_accept|close|pause|promote|report_<id>` routes correctly; DM events try `handleDirectMessage` before the existing human relay; startup calls `initScheduler`; and public rendering preserves existing human controls.

- [ ] **Step 2: Update the legacy treasury test to fail on deceptive behavior**

Replace assertions requiring `generateRealisticComment`/unlabeled fake engagement with assertions that `scheduleOrganicEngagement`, `organik sahte tepkiler`, fabricated anonymous aliases, and prompts forbidding AI disclosure are absent. Keep the seed-confession treasury assertions unrelated to AI identity.

- [ ] **Step 3: Run focused integration tests and verify RED**

Run: `node --test tests/confessionAiIntegration.test.js tests/confessionTreasury.test.js`  
Expected: FAIL because legacy scheduling and routing remain.

- [ ] **Step 4: Wire publication, approval, buttons, DMs, and startup**

Replace both `scheduleOrganicEngagement` calls with the new service. Add explicit button routing, initialize one scheduler during bot ready, and invoke AI DM routing before `handleDirectMessageRelay`; if AI returns `false`, preserve the existing human bridge path.

- [ ] **Step 5: Remove deceptive legacy automation**

Delete `generateRealisticComment`, `scheduleOrganicEngagement`, their unlabeled fake reaction/comment code, and obsolete comment pools only used by that workflow. Do not remove the independently triggered seed confession feature in this task.

- [ ] **Step 6: Run all confession-focused tests**

Run: `node --test tests/confessionAiModel.test.js tests/confessionAiPolicy.test.js tests/confessionPresentationService.test.js tests/confessionAiInvitation.test.js tests/confessionAiConversation.test.js tests/confessionAiControlsAndEngagement.test.js tests/confessionAiIntegration.test.js tests/confessionTreasury.test.js`  
Expected: PASS with no real external calls.

- [ ] **Step 7: Run the complete repository test suite**

Run: `node --test`  
Expected: all tests PASS. If unrelated pre-existing failures occur, record each test name and do not claim a green suite.

- [ ] **Step 8: Perform static safety checks**

Run: `rg -n "ASLA bot gibi|organik sahte|fallbackGroqKey|TELEGRAM_TOKEN\s*\|\|\s*[\"']" bot models tests`  
Expected: no deceptive prompt, fake-engagement implementation, or credential fallback match.

- [ ] **Step 9: Commit**

```bash
git add bot/services/confessionService.js bot/handlers/buttonHandler.js bot/handlers/index.js tests/confessionTreasury.test.js tests/confessionAiIntegration.test.js
git commit -m "feat: integrate transparent confession AI engagement"
```

### Task 8: Verify the complete feature and prepare operator handoff

**Files:**
- Modify if needed: files changed in Tasks 1-7 only
- Create: `docs/confession-ai-operations.md`

**Interfaces:**
- Consumes: completed feature and runtime environment configuration.
- Produces: verified release behavior and a concise operator runbook.

- [ ] **Step 1: Write the operator runbook acceptance checklist**

Document required environment variable names without values, credential-rotation requirement, Discord manual flow, Telegram failure simulation, scheduler restart verification, moderation checks, and rollback by setting the feature flag disabled.

- [ ] **Step 2: Run focused and complete automated verification**

Run: `node --test tests/aiAndTelegramCredentialSafety.test.js tests/confessionAiModel.test.js tests/confessionAiPolicy.test.js tests/confessionPresentationService.test.js tests/confessionAiInvitation.test.js tests/confessionAiConversation.test.js tests/confessionAiControlsAndEngagement.test.js tests/confessionAiIntegration.test.js tests/confessionTreasury.test.js`  
Expected: PASS.  
Run: `node --test`  
Expected: all tests PASS or every unrelated pre-existing failure is explicitly reported.

- [ ] **Step 3: Inspect the final diff and credential/deception scan**

Run: `git diff --check da44637..HEAD`  
Expected: no whitespace errors.  
Run: `rg -n "fallbackGroqKey|TELEGRAM_TOKEN\s*\|\|\s*[\"']|ASLA bot gibi|organik sahte" bot models tests`  
Expected: no matches.

- [ ] **Step 4: Confirm unrelated user work remains untouched**

Run: `git status --short`  
Expected: only the user's pre-existing changes remain outside this feature, including `server/public/admin/applications.js` and `server/services/applicationOperationsService.js` if still present.

- [ ] **Step 5: Commit the runbook**

```bash
git add docs/confession-ai-operations.md
git commit -m "docs: add confession AI operations runbook"
```
