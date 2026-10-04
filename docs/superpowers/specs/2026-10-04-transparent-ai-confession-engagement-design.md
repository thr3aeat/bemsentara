# Transparent AI Confession Engagement Design

**Date:** 2026-10-04  
**Status:** Conversational design approved; written specification awaiting review

## 1. Product intent

The confession system will offer optional, one-time EKOai-supported engagement around a published confession. It will preserve the existing anonymous-confession experience while ensuring that automated participants are never presented as real community members.

Success means:

- a confession can receive at most one automated DM invitation;
- the invitation clearly identifies the conversation as EKOai-supported before consent;
- accepting the invitation starts a bounded, context-aware conversation about that confession;
- declining, closing, pausing, expiry, safety escalation, or an AI-identity question stops the relevant automation deterministically;
- automated reactions, poll choices, and comments never inflate or masquerade as community activity;
- confession owners receive one concise engagement summary and one-time controls;
- reports reach the existing moderation workflow and only serious, sanitized events reach Telegram;
- AI or Telegram failure does not corrupt real reaction, poll, or DM state.

## 2. Non-negotiable transparency boundary

Automated activity must be attributable to the system:

- the initial DM invitation says `EKOai destekli anonim sohbet`;
- active conversation cards retain an `EKOai destekli` indicator;
- automated thread comments use an EKOai-supported alias rather than a fabricated community-member identity;
- AI reaction and poll aggregates are displayed separately from community totals;
- the model may use concise, casual Turkish and common abbreviations, but prompts must not instruct it to deny being AI, impersonate a real person, or manufacture deceptive typing mistakes;
- if the user asks whether the participant is AI, the response is truthful and the confession's automated engagement is disabled after that response.

## 3. Existing integration points

The implementation extends the current boundaries:

- `models/Confession.js` owns confession and bridge persistence;
- `bot/services/confessionService.js` owns publishing, reactions, polls, human anonymous bridges, reports, and card rendering;
- `bot/services/aiService.js` owns EKOai provider calls;
- `bot/services/telegramService.js` owns Telegram delivery;
- `bot/handlers/buttonHandler.js`, `bot/handlers/modalHandler.js`, and the DM listener in `bot/handlers/index.js` route Discord interactions;
- `bot/utils/componentsV2Factory.js` remains the Discord Components V2 construction boundary.

The new automated workflow will live in a focused service rather than further expanding `confessionService.js`.

## 4. Persistence model

### Confession fields

Add an `aiEngagement` subdocument to `Confession`:

- `enabled`: whether any future automated activity is allowed;
- `state`: `eligible`, `scheduled`, `invited`, `active`, `paused`, `closed`, or `disabled`;
- `invitationSentAt`: proves the one-invitation rule;
- `disabledReason`: `owner`, `identity_question`, `moderation`, `expired`, `safety`, or `completed`;
- `reactionsPausedAt`: owner-controlled automation pause;
- `promotedAt`: proves the one-time promotion rule;
- `summarySentAt`: proves the one-time summary rule;
- `automatedReactions`: separate `shock`, `laugh`, `redflag`, and `support` counters;
- `automatedPollVote`: `A`, `B`, or null;
- bounded generation counters and timestamps for scheduling and audit.

Existing `reactions`, `userReactions`, poll counts, and poll voters remain human-only.

### AI conversation session

Extend `ConfessionSession` so sessions have `participantType: human | ai`. AI sessions use a reserved system participant identifier, cannot participate in identity-reveal or tipping actions, and store only a bounded transcript. An index or atomic update enforces at most one AI session per confession.

AI session states are `pending`, `active`, and `closed`. Closure stores `closedAt` and a machine-readable reason. The session never reopens after closure.

## 5. Automated engagement lifecycle

Only an approved, non-expired confession with `allowDm: true` and `aiEngagement.enabled: true` is eligible.

After publication, the scheduler atomically claims eligibility. A bounded randomized delay may make delivery less abrupt, but the delay must not be used to suggest that a real person initiated the request. The author receives one invitation:

> “#1234 adlı itirafınız hakkında EKOai destekli anonim bir sohbet başlatmak ister misiniz?”

Buttons:

- `Kabul Et` activates the AI session;
- `Anonim DM'yi Kapat` closes the invitation and disables further AI DMs for this confession;
- `Moderasyona Raporla` records and forwards a report.

Accepting starts a conversation grounded only in the confession content, category, and bounded session history. Replies are concise, supportive, and relevant. The model must not request identifying information, encourage off-platform contact, promise secrecy beyond system policy, or provide unsafe professional advice.

The session closes when:

- the author presses close;
- a maximum message count is reached;
- inactivity expiry is reached;
- the confession expires or is removed;
- moderation disables it;
- a safety rule triggers;
- an AI-identity question is detected and answered truthfully;
- the model returns a completion signal accepted by deterministic policy.

No later automated DM invitation is sent for that confession.

## 6. Identity-question handling

Detection occurs before the model call using normalized Turkish phrase matching for forms such as `sen ai misin`, `bot musun`, `yapay zeka mısın`, and common punctuation or spelling variants. The model prompt also requires truthful disclosure if an indirect question reaches it.

On detection:

1. send a short truthful response;
2. close the AI session with `identity_question`;
3. atomically set the confession's AI state to `disabled`;
4. cancel or invalidate pending automated reactions, comments, votes, invitations, and summary jobs;
5. keep real community interactions available unless separately paused by moderation;
6. write a sanitized audit event.

## 7. Reactions, polls, comments, and summaries

Automated engagement uses a deterministic policy layer around EKOai output:

- total automated reactions are bounded to 5-15 per confession;
- distribution must match content sentiment and never include unsupported severe judgments;
- an automated poll may contribute at most one separately stored AI choice;
- automated comments are labeled `EKOai destekli anonim yorum`;
- content moderation runs before any generated text is posted;
- paused, disabled, expired, rejected, or deleted confessions cannot receive new automated activity.

The public card displays human/community numbers as the primary totals. If automated engagement exists, it appears in a distinct labeled line and is never included in rankings based on community popularity.

After the automation reaches its final reaction allocation, the author receives one summary, for example:

> “İtirafınız 5 destek ve 5 gülme topluluk tepkisi aldı. EKOai destekli etkileşimler ayrı gösterilir.”

The summary must calculate real and automated values from separate fields and never call an automated reaction a community reaction.

## 8. Owner controls

The publication confirmation and owner-only DM control card expose:

- `İtirafımı Öne Çıkar`: usable once; sets `promotedAt`, applies a bounded badge/announcement, and cannot be replayed concurrently;
- `AI Tepkilerini Duraklat`: atomically pauses future automated reactions, votes, comments, and invitations while preserving human interaction;
- `Anonim DM'yi Kapat`: sets `allowDm` false, closes pending or active AI sessions, and blocks new human bridge requests;
- `Moderasyona Raporla`: sends a structured report with the confession ID and safe context.

Every control verifies the confession owner server-side. Discord button visibility is not authorization.

## 9. Moderation and Telegram

Reports use the existing confession moderation channel and secret audit boundary. The public reporter receives a generic acknowledgement; author identity and transcript details remain restricted to authorized moderation views.

Telegram receives only HIGH/CRITICAL events, such as credible immediate-safety content, repeated provider abuse, or a severe system failure. Messages are sanitized and contain the confession ID, severity, category, timestamp, concise reason, and moderation link. They exclude full DM transcripts, access tokens, API keys, session identifiers, and unnecessary user identifiers.

Telegram delivery is best-effort and does not determine report persistence. Failed sends remain logged for staff follow-up without repeatedly notifying the user.

## 10. Service boundaries

Create `bot/services/confessionAiEngagementService.js` with injected dependencies for the model, clock, random source, scheduler, Discord sender, moderation reporter, and Telegram notifier. Its public interface will cover:

- eligibility and one-time scheduling;
- invitation creation and button actions;
- AI DM message handling;
- identity-question detection;
- automated reaction/poll/comment application;
- owner pause/disable/promote actions;
- final summary delivery;
- job invalidation on state changes.

`confessionService.js` will delegate automated behavior to this service and continue to own human confession and bridge behavior. Handler files only parse custom IDs and dispatch to the appropriate service.

## 11. Concurrency, safety, and failure behavior

- One-time operations use atomic conditional updates rather than read-then-write checks.
- Scheduled callbacks re-read the confession and validate state before side effects.
- Duplicate button deliveries are idempotent and return the current state.
- AI provider failure leaves the session active for bounded retry or closes it with a user-safe message; it never invents a response.
- Discord DM failure records delivery failure without marking an invitation delivered.
- Telegram failure does not lose the moderation report.
- Removed or expired confession jobs become no-ops.
- Generated text is length-limited, stripped of mentions and unsafe links, and passed through moderation before delivery.
- Transcript storage is bounded and follows the existing audit-retention policy.

## 12. Credential prerequisite

`bot/services/aiService.js` and `bot/services/telegramService.js` currently contain source-code credential fallbacks. Before shipping this feature:

1. remove hardcoded credential fallbacks;
2. require runtime environment variables;
3. treat missing credentials as a disabled integration rather than a startup crash;
4. inject fake transports in tests;
5. rotate the exposed provider and Telegram credentials outside the repository.

Credential rotation is an operator action and is not performed by application code.

## 13. Testing and acceptance

Automated tests must prove:

- only eligible confessions receive an invitation;
- concurrent schedulers still create one invitation and one AI session;
- the invitation and active cards contain the EKOai-supported disclosure;
- refusal or DM closure permanently blocks another AI invitation;
- identity questions receive a truthful response and disable all pending AI activity;
- human reactions and poll votes remain separate from automated values;
- automated reactions remain between 5 and 15 and stop when paused;
- automated votes and comments are visibly labeled;
- promotion and summary delivery are each one-time and idempotent;
- only the confession owner can pause, promote, or close owner controls;
- moderation reports persist when Telegram fails;
- HIGH/CRITICAL Telegram payloads are sanitized;
- provider, DM, database, and scheduler failures preserve consistent state;
- expired, rejected, deleted, or moderation-disabled confessions receive no new automation;
- no prompt asks the model to deny being AI or impersonate a real person;
- no hardcoded provider or Telegram credential fallback remains.

Manual acceptance verifies the complete Discord flow from confession publication through invitation, acceptance, conversation, identity question, shutdown, owner controls, card refresh, moderation report, and Telegram failure simulation.

## 14. Out of scope

- presenting automated accounts as real users;
- merging synthetic and human engagement counts;
- autonomous moderation punishment;
- identity reveal, tipping, or off-platform contact for AI sessions;
- repeated AI invitations for the same confession;
- Telegram commands that mutate confession or moderation state;
- retroactively generating AI engagement for old confessions without an explicit migration decision.
