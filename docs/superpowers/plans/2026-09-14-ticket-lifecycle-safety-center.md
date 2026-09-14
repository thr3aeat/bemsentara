# Ticket Lifecycle ve Safety Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web, Discord modalı ve DM ticketlarını güvenli kayıt, standart panel ve kategoriye uygun Safety Center rehberiyle birleştirmek.

**Architecture:** Ticket oluşturma ve panel gönderme `bot/services/ticketLifecycleService.js` ile merkezileşir. `ticketGuideResolver` kategoriden rehber URL’si çıkarır, `ticketPanelService` kullanıcı/yetkili Discord bileşenlerini üretir. Mevcut button handler etkileşim gerektiren aksiyonları işler; link düğmeleri bot yeniden başlasa da çalışır.

**Tech Stack:** Node.js 20, discord.js 14, Express, mevcut Store tabanlı Ticket modeli, node:test.

**Spec:** `docs/superpowers/specs/2026-09-14-ticket-lifecycle-safety-center-design.md`

## Global Constraints

- Var olan authentication, Ticket modeli ve Discord button handler mimarisi korunur.
- Ticket, Discord kanal/panel işleminden önce kalıcı olarak kaydedilir.
- Link düğmeleri üretim `BASE_URL` adresini kullanır; localhost değeri kullanılamaz.
- Her panel hatasında `TICKET_PANEL_SEND_FAILED` ticket, guild, channel, user ve hata detaylarını içerir.
- Sahte production verisi eklenmez; Safety Center içeriği statik dokümantasyon verisidir.

---

### Task 1: Ticket rehber çözümleyicisi ve kullanıcı paneli

**Files:**
- Create: `bot/services/ticketGuideResolver.js`
- Create: `bot/services/ticketPanelService.js`
- Test: `tests/ticketPanelService.test.js`

**Interfaces:**
- Produces: `resolveTicketGuide(category): { slug, title, url }`
- Produces: `buildTicketUserPanel(ticket): { embeds, components }`
- Produces: `buildTicketStaffPanel(ticket): { embeds, components }`

- [ ] **Step 1: Write the failing tests**

```js
assert.equal(resolveTicketGuide('ban').slug, 'ceza-ve-itiraz');
assert.equal(resolveTicketGuide('technical').slug, 'ticket-sorun-giderici');
assert.equal(buildTicketUserPanel(ticket).components.flatMap(row => row.components).length, 5);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/ticketPanelService.test.js`

Expected: FAIL because the services do not exist.

- [ ] **Step 3: Implement the minimal services**

```js
function resolveTicketGuide(category) {
  return GUIDE_BY_CATEGORY[category] || GUIDE_BY_CATEGORY.other;
}

function buildTicketUserPanel(ticket) {
  return { embeds: [welcomeEmbed(ticket)], components: [userActionRow(ticket)] };
}
```

The user action row contains persistent link buttons for Safety Center and relevant docs plus custom IDs `ticket_user_close_`, `ticket_staff_call_`, and `ticket_user_info_`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/ticketPanelService.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bot/services/ticketGuideResolver.js bot/services/ticketPanelService.js tests/ticketPanelService.test.js
git commit -m "feat: add ticket guide and panel services"
```

### Task 2: Dayanıklı ticket yaşam döngüsü

**Files:**
- Create: `bot/services/ticketLifecycleService.js`
- Modify: `models/Ticket.js`
- Modify: `server/routes/api.js`
- Modify: `bot/handlers/modalHandler.js`
- Test: `tests/ticketLifecycleService.test.js`

**Interfaces:**
- Consumes: `buildTicketUserPanel(ticket)`, `buildTicketStaffPanel(ticket)`.
- Produces: `createTicketLifecycle(input, { client, Ticket }): Promise<Ticket>`.
- Produces: `retryTicketPanel(ticket, { client }): Promise<{ delivered: boolean }>`.

- [ ] **Step 1: Write failing lifecycle tests**

```js
const result = await createTicketLifecycle(input, dependencies);
assert.equal(result.deliveryState, 'delivered');
assert.equal(savedBeforeChannelCreation, true);
assert.match(errorLog, /TICKET_PANEL_SEND_FAILED/);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/ticketLifecycleService.test.js`

Expected: FAIL because the lifecycle module does not exist.

- [ ] **Step 3: Implement persistence-first lifecycle**

```js
const ticket = new Ticket({ ...input, status: 'open', deliveryState: 'pending_delivery' });
await ticket.save();
const channel = await createTicketChannel(ticket, client);
await sendTicketPanels(ticket, channel);
```

On panel failure set `deliveryState: 'pending_retry'`, `deliveryError`, `deliveryErrorAt`, save the ticket, and log the required structured context.

- [ ] **Step 4: Replace duplicate web and Discord modal panel sends**

`POST /api/tickets` and `handleTicketModal` call the lifecycle service with their existing input/authentication/permission logic. Existing reopen flow uses `retryTicketPanel` only when a panel is absent.

- [ ] **Step 5: Run lifecycle tests**

Run: `node --test tests/ticketLifecycleService.test.js tests/ticketDeliveryStatus.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add models/Ticket.js server/routes/api.js bot/handlers/modalHandler.js bot/services/ticketLifecycleService.js tests/ticketLifecycleService.test.js
git commit -m "feat: centralize resilient ticket delivery"
```

### Task 3: Persistent ticket panel actions

**Files:**
- Modify: `bot/handlers/buttonHandler.js`
- Modify: `bot/services/ticketLifecycleService.js`
- Test: `tests/ticketPanelActions.test.js`

**Interfaces:**
- Consumes: `ticket_user_close_<ticketId>`, `ticket_staff_call_<ticketId>`, `ticket_user_info_<ticketId>`.
- Produces: `handleTicketUserPanelAction(interaction): Promise<boolean>`.

- [ ] **Step 1: Write failing action tests**

```js
assert.equal(await handleTicketUserPanelAction(staffCallInteraction), true);
assert.equal(channelMessages.length, 1);
assert.match(channelMessages[0].content, /personel çağrısı/i);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/ticketPanelActions.test.js`

Expected: FAIL because no user-panel action handler exists.

- [ ] **Step 3: Implement authorization and cooldown**

The ticket owner may close/call/view details; staff may also view details. Call cooldown uses `staffCallRequestedAt`, updates `staffCallCount`, and replies ephemerally. Close delegates to existing close modal behavior instead of duplicating closure logic.

- [ ] **Step 4: Run action tests**

Run: `node --test tests/ticketPanelActions.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bot/handlers/buttonHandler.js bot/services/ticketLifecycleService.js tests/ticketPanelActions.test.js
git commit -m "feat: handle persistent ticket panel actions"
```

### Task 4: Safety Center kategori ve arama genişletmesi

**Files:**
- Modify: `server/views/knowledgeCenterData.js`
- Modify: `server/views/helpHubPage.js`
- Test: `tests/safetyCenter.test.js`

**Interfaces:**
- Consumes: `safetyGuides` with `slug`, `category`, `summary`, `sections`.
- Produces: category navigation and search results linking to `/yardim/:slug`.

- [ ] **Step 1: Extend failing Safety Center tests**

```js
assert.ok(new Set(safetyGuides.map(guide => guide.category)).size >= 12);
assert.match(renderHelpHubPage(), /data-guide-search/);
assert.match(renderHelpHubPage(), /Ticket Kullanımı/);
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/safetyCenter.test.js`

Expected: FAIL because the category navigation and search attributes are absent.

- [ ] **Step 3: Add complete category guides and accessible filtering**

Add the missing listed categories without removing current guide URLs. Render navigation links and search metadata; filter title, category and summary while preserving keyboard-visible links.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/safetyCenter.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/views/knowledgeCenterData.js server/views/helpHubPage.js tests/safetyCenter.test.js
git commit -m "feat: expand Safety Center documentation navigation"
```

### Task 5: Integration verification

**Files:**
- Test: `tests/ticketPanelService.test.js`
- Test: `tests/ticketLifecycleService.test.js`
- Test: `tests/ticketPanelActions.test.js`
- Test: `tests/safetyCenter.test.js`

- [ ] **Step 1: Run focused tests**

Run: `node --test tests/ticketPanelService.test.js tests/ticketLifecycleService.test.js tests/ticketPanelActions.test.js tests/safetyCenter.test.js tests/ticketDeliveryStatus.test.js`

Expected: PASS.

- [ ] **Step 2: Run the repository suite**

Run: `$ekoTestFiles = Get-ChildItem -LiteralPath 'tests' -Filter '*.test.js' | ForEach-Object { $_.FullName }; node --test $ekoTestFiles`

Expected: PASS.

- [ ] **Step 3: Check source integrity**

Run: `git diff --check` and `node --check bot/services/ticketLifecycleService.js`.

Expected: no diff whitespace errors and zero syntax errors.

- [ ] **Step 4: Commit verification-ready implementation**

```bash
git add bot/services/ticketGuideResolver.js bot/services/ticketPanelService.js bot/services/ticketLifecycleService.js models/Ticket.js server/routes/api.js server/views/knowledgeCenterData.js server/views/helpHubPage.js bot/handlers/buttonHandler.js bot/handlers/modalHandler.js tests
git commit -m "feat: integrate ticket lifecycle with Safety Center"
```
