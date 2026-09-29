# EkoYıldız Support, Recovery, Advertising and Page Redesign

**Date:** 2026-09-29  
**Status:** Approved direction; implementation pending  
**Scope:** Public website recovery experience, support campaign entry points, advertising/support conversation, Links page, ticket creation page, and Discord ThanksService supporter list.

## 1. Product intent

The work should make EkoYıldız feel maintained by a thoughtful product team rather than assembled from generic AI-style templates. It should also make the financial reality of running the YouTube channels, Discord bots, websites, and community infrastructure visible without trapping visitors in a fundraising flow.

Success means:

- brief connection failures do not interrupt the user;
- longer outages explain what is happening calmly and offer useful actions;
- user-entered form and chat data survives recoverable connection failures;
- the homepage introduces advertising and voluntary support once, without permanently redirecting every visit;
- sponsor/support links consistently lead to the advertising and support page;
- EKOai copy feels concise and conversational while remaining transparently an automated EKOai assistant;
- the Links and ticket creation pages share a restrained, human-crafted editorial design;
- the Discord thanks message includes `Yusuf ve YK Ordusu`;
- existing advertising page work is preserved and integrated rather than overwritten.

## 2. Design principles

1. **Calm before dramatic.** A failure begins as a small status message and escalates only when it lasts.
2. **No deceptive identity.** EKOai may sound natural, but it must not claim to be a human employee.
3. **Support is an invitation.** Visitors can advertise, donate, or continue to the site. There is no recurring forced redirect.
4. **Editorial rather than synthetic.** Use strong typography, clear hierarchy, solid surfaces, and limited brand accents. Avoid gradient-heavy glass cards, excessive glow, fake metrics, and inflated claims.
5. **Existing contracts remain stable.** Current routes, ticket API payloads, pricing rules, and ten official link records remain compatible.
6. **Progressive enhancement.** Navigation, forms, and recovery actions remain useful if optional JavaScript features fail.

## 3. Information architecture and entry flow

### Homepage

The homepage remains at `/`. On the first eligible visit, it presents a dismissible support panel after the core page has rendered. The panel contains three clear choices:

- **Reklam vermek istiyorum** → `/reklam/ekoyildiz-ortaklik?intent=advertise&source=home-support`
- **Bağışla destek olmak istiyorum** → `/reklam/ekoyildiz-ortaklik?intent=donate&source=home-support`
- **Siteye devam et** → closes the panel

Dismissal is stored locally with a cooling period so normal visitors are not asked on every visit. The panel must not block keyboard navigation, search engines, or the first meaningful page paint.

The homepage also gains a permanent, compact support section explaining that hosting, bots, sites, moderation tools, and video production cost money and that YouTube monetization is currently unavailable. The copy must be factual and non-manipulative.

### Sponsor and support links

Existing sponsor/support calls to action in shared chrome, relevant homepage areas, and advertising-facing pages should use the advertising route above. Existing third-party sponsor ads continue to use their tracked click destinations; this change does not hijack paid advertiser links.

### Advertising page intent

The advertising page reads the optional `intent` parameter:

- `advertise` opens with the advertising conversation;
- `donate` opens with the voluntary support conversation;
- no intent shows a neutral choice between the two.

No new payment processor is invented. Donation completion uses an existing approved payment/store route or creates a support ticket when manual coordination is required.

## 4. Shared connection recovery system

### Component boundary

Create a shared server-rendered recovery module that exposes markup, styles, and a small browser controller. The conceptual components are:

- `ConnectionStatusBanner`
- `ReconnectPanel`
- `SystemRecoveryScreen`
- `RetryActions`
- `MiniRunnerGame`
- `SystemStatusCard`

The shared platform chrome mounts the module once per page. Standalone proxy error HTML uses the same visual tokens and state language without depending on the application server.

### State machine

The browser controller uses explicit states:

| State | Trigger | Presentation |
|---|---|---|
| `idle` | Normal operation | Nothing shown |
| `short` | Failure begins, 0–3 seconds | Small banner: “Bağlantı yenileniyor…” |
| `medium` | Failure lasts 3–10 seconds | Centered compact reconnect panel |
| `long` | Failure lasts over 10 seconds | Recovery screen with status, actions, and optional game |
| `retrying` | User selects retry | Disabled retry action with calm progress label |
| `recovered` | Health check succeeds | Success notice, restore previous context, dismiss |
| `critical` | Non-recoverable response or repeated timeout | Long screen with support and home actions |

Only network failures, request timeouts, and server `5xx` responses participate. Validation errors, authentication failures, permissions, `404`, and other normal `4xx` application responses must retain their specific messages.

### Health and retry behavior

- Use `/api/health` for recovery probes.
- Apply bounded exponential backoff with jitter; do not poll continuously.
- “Tekrar Dene” has a visible cooldown and cannot be spammed.
- A successful probe shows “Bağlantı yeniden kuruldu — devam edebilirsiniz.”
- If the failed action is safe and idempotent, the user may retry it explicitly. Mutating submissions are never repeated automatically.
- “Ana Sayfaya Dön” points to `/`; “Destek Talebi Oluştur” points to `/tickets/new?category=technical`.

### Draft preservation

Text entered into ticket, chat, and ordinary forms is saved locally with a short expiry and restored after recovery. Passwords, authentication codes, payment details, file inputs, and explicitly sensitive fields are excluded. Drafts are cleared only after confirmed successful submission or an explicit user reset.

### Standalone 502 page

`scripts/custom_error.html` becomes a standalone version of the same experience. Because it is served when the application may be unreachable, it contains no app imports and uses lightweight vanilla HTML/CSS/JS. It escalates through the same timing stages, checks `/api/health`, and returns the visitor to the original URL after recovery only when safe.

## 5. Mini runner game

The long recovery state offers an optional, compact endless runner inspired by the interaction pattern of offline runner games without copying Chrome artwork or branding.

- Original EkoYıldız-themed character and obstacles drawn with CSS/canvas primitives.
- Space, Arrow Up, click, and touch controls.
- Score and session best score.
- Restart button and clear focus states.
- No required audio.
- Animation pauses when the tab is hidden and respects `prefers-reduced-motion`.
- Fixed logical canvas size scaled responsively; no layout overflow on mobile.
- The game never blocks health checks or recovery actions.

## 6. Advertising and voluntary support conversation

### Positioning

EKOai remains visibly labeled as `EKOai · otomatik destek`. The surface should read like a thoughtfully written chat, not a sci-fi console. Remove pulsing AI badges, excessive gradients, glow, generic “AI assistant” marketing, and robotic filler.

Opening copy:

> Bütçen çok yüksek olmayabilir; sorun değil. Reklam vermek mi istiyorsun, yoksa EkoYıldız’ın YouTube, Discord botları ve sitelerine destek olmak mı?

Quick choices:

- `Reklam seçeneklerini göster`
- `Küçük bütçem var`
- `Bağış yapmak istiyorum`
- `Bir yetkiliyle görüşmek istiyorum`

The user can always type freely. Answers should be short, direct, and based on the existing pricing configuration. The assistant must not invent discounts, guarantees, audience figures, urgency, or payment channels.

### Service behavior

The existing `/api/reklam/ekoai-chat` endpoint remains the integration point. Its system prompt gains two explicit intents—advertising and donation—and a response style contract. Deterministic fallbacks cover prices, low-budget options, donation routing, and human handoff when the AI provider is unavailable.

## 7. Advertising page integration

`server/views/advertisingLandingPage.js` already contains uncommitted user work. Implementation must begin by re-reading and preserving that diff. New work is integrated surgically:

- replace the synthetic visual language with restrained surfaces and typography;
- consolidate duplicate chat presentations into one conversation area;
- retain current honest price ranges, package builder behavior, partner evidence, ticket route, and eligibility rules;
- introduce a support/donation section without presenting donations as purchases;
- use source/intent query parameters for opening state only, not for hidden tracking of personal data.

## 8. Links page redesign

The Links page becomes an editorial directory rather than a glass-card showcase.

- Preserve all ten official records and their destinations.
- Keep search, copy, visit, and category filtering behavior.
- Replace blur-heavy “liquid glass” and spotlight effects with a simple profile header, clear grouped lists, and compact platform metadata.
- Add a visible “Reklam ve destek” entry leading to the advertising page without changing the ten-record data contract; it is a separate support callout.
- Ensure meaningful headings, keyboard-accessible controls, visible focus states, and mobile-friendly tap targets.

## 9. Ticket creation redesign

The page keeps `/tickets/new`, authentication requirements, current category values, and the existing POST payload. It is reorganized into a three-part guided flow:

1. **Konu seçimi** — category cards with plain-language descriptions.
2. **Ayrıntılar** — only fields relevant to the selected category; advertising retains package, community, link, budget, and payment preference data.
3. **Kontrol ve gönderim** — a readable summary and explicit confirmation.

Design changes:

- remove oversized badges, decorative status claims, and dense one-page presentation;
- use a quiet two-column desktop layout with a contextual summary rail and a single-column mobile layout;
- show validation beside fields and move focus to the first error;
- save eligible draft fields through the recovery module;
- preserve query preselection such as `?category=reklam&package=midroll`;
- keep EKOai help optional and secondary, not the visual center of the form;
- preserve current server-side ticket behavior and Discord handoff.

## 10. ThanksService change

Append `Yusuf ve YK Ordusu` to `SUPPORTERS_LIST` in `bot/services/thanksService.js`. The existing supporters remain unless the user later names a specific entry to replace. Update `tests/thanksService.test.js` to assert the new entry.

## 11. Accessibility and responsive behavior

- Meet practical WCAG AA contrast for text and interactive controls.
- Use semantic headings, labels, `aria-live` for recovery status, and `aria-modal` only while the long recovery screen is active.
- Trap focus only for the blocking long state and restore focus on recovery.
- All actions work by keyboard.
- Honor `prefers-reduced-motion` in recovery transitions, support panel motion, and the mini game.
- At 320 CSS pixels, no horizontal page or game overflow is permitted.

## 12. Testing and verification

### Automated tests

- recovery state timing and state transitions with controllable timers;
- health probe backoff, cooldown, recovery, and non-retry of mutating requests;
- draft preservation exclusions and successful cleanup;
- standalone error page contains working home, retry, support, and game controls;
- homepage support panel links, cooling period hooks, and factual funding copy;
- advertising intent states and natural opening copy;
- EKOai deterministic fallback for low-budget, donation, and handoff questions;
- ten-link data contract plus the separate advertising/support callout;
- ticket category preselection, guided steps, current fields, payload contract, and validation hooks;
- ThanksService includes `Yusuf ve YK Ordusu`.

### Visual and interaction verification

- render homepage, advertising, Links, ticket, and standalone recovery pages at desktop and mobile widths;
- exercise keyboard navigation and visible focus;
- simulate 2-second, 6-second, and 12-second outages;
- play the runner using keyboard and touch/click controls;
- verify recovery returns to the prior page and preserves allowed draft data;
- confirm the current targeted test suite passes and report any unrelated pre-existing failures separately.

## 13. Planned files and boundaries

Expected production changes are limited to:

- a new shared connection recovery view/controller module;
- `server/views/platformChrome.js` for global mounting and support navigation;
- `scripts/custom_error.html` for the standalone recovery experience;
- `server/views/home/mainHomePage.js` for the first-visit support panel and permanent support section;
- `server/views/advertisingLandingPage.js` and `server/services/reklamAIAssistantService.js` for the advertising/donation conversation;
- `server/views/linksHubPage.js` for the directory redesign;
- `server/views/createTicketPage.js` for the guided form redesign;
- `bot/services/thanksService.js` for the supporter entry;
- focused tests for each changed behavior.

No database migration, new dependency, new payment processor, or route removal is required.

## 14. Out of scope

- forcing every homepage request to redirect to advertising;
- disguising EKOai as a real person;
- fabricating monetization, audience, conversion, or sponsor claims;
- automatically resubmitting purchases, donations, or ticket creation requests;
- changing third-party paid sponsor destinations;
- replacing the existing advertising pricing model or payment providers.
