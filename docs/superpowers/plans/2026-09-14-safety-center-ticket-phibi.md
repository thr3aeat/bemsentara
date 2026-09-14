# EkoYıldız Safety Center, Ticket ve Phibi DM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EkoYıldız’a gerçek rehber rotaları eklemek, ticket teslim sonucunu görünür yapmak ve Phibi DM yetkili paneli bağlantısını çalışır hâle getirmek.

**Architecture:** Safety makaleleri tek veri kaynağında tutulur ve rota bazlı render edilir. Ticket kalıcı kaydı Discord tesliminden ayrılır. Phibi fallback yalnızca DM payload’ındaki bilinen Sentara düğmelerini Link Button’a çevirir.

**Tech Stack:** Node.js 20, Express 4, discord.js 14, Node built-in `node:test`, dosya tabanlı Store.

**Spec:** `docs/superpowers/specs/2026-09-14-safety-center-ticket-phibi-design.md`

## Global Constraints

- Phibi sadece Sentara DM gönderimi başarısız olduğunda kullanılacak; guild mesajları değişmeyecek.
- Eksik veya localhost `BASE_URL`, Phibi bağlantısında `https://ekoyildiz.duckdns.org` olarak çözümlenecek.
- Güvenlik rehberleri şifre, token, çerez veya doğrulama kodu istemeyecek.
- Discord erişilemezken ticket kaydı kaybolmayacak ve API `delivered` ya da `queued` döndürecek.

---

### Task 1: Phibi DM web bağlantısı dönüştürücüsü

**Files:**
- Create: `tests/phibiDmFallback.test.js`
- Modify: `bot/services/phibiDmFallback.js:1-50`

**Interfaces:**
- Produces: `resolvePublicSiteUrl(pathname)` → `string`
- Produces: `preparePhibiPayload(payload)` → Discord REST payload

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { preparePhibiPayload } = require('../bot/services/phibiDmFallback');
test('converts the staff home custom button to a safe web link for Phibi', () => {
  const payload = preparePhibiPayload({ components: [{ type: 1, components: [{ type: 2, style: 1, custom_id: 'app_open_home', label: 'Ana Sayfa' }] }] });
  const button = payload.components[0].components[0];
  assert.equal(button.style, 5);
  assert.equal(button.url, 'https://ekoyildiz.duckdns.org/staff');
  assert.equal(button.custom_id, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/phibiDmFallback.test.js`

Expected: FAIL because `preparePhibiPayload` is not exported.

- [ ] **Step 3: Write minimal implementation**

```js
function resolvePublicSiteUrl(pathname) {
  const base = String(process.env.BASE_URL || '').trim();
  const origin = !base || /localhost|127\.0\.0\.1/i.test(base) ? 'https://ekoyildiz.duckdns.org' : base.replace(/\/+$/, '');
  return `${origin}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}
function preparePhibiPayload(payload) {
  const out = serialisePayload(payload);
  out.components = (out.components || []).map(row => ({ ...row, components: (row.components || []).map(button => button.custom_id === 'app_open_home' ? { ...button, style: 5, url: resolvePublicSiteUrl('/staff'), custom_id: undefined } : button) }));
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/phibiDmFallback.test.js`

Expected: PASS with one test.

- [ ] **Step 5: Commit**

```bash
git add bot/services/phibiDmFallback.js tests/phibiDmFallback.test.js
git commit -m "Fix Phibi staff panel links"
```

### Task 2: Ticket teslim sonucu sözleşmesi

**Files:**
- Create: `server/services/ticketDelivery.js`
- Create: `tests/ticketDeliveryStatus.test.js`
- Modify: `server/routes/api.js:321-470`
- Modify: `server/views.js:10383-10430`

**Interfaces:**
- Produces: `{ deliveryStatus, deliveryMessage }`; statuses are `delivered` or `queued`.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTicketDeliveryResult } = require('../server/services/ticketDelivery');
test('reports queued delivery when a ticket is persisted without a Discord channel', () => {
  assert.deepEqual(buildTicketDeliveryResult({ ticketId: 'EK-1', channelId: null }), { deliveryStatus: 'queued', deliveryMessage: 'Biletin kaydedildi. Discord destek kanalına teslim edilmesi sıraya alındı.' });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ticketDeliveryStatus.test.js`

Expected: FAIL because `server/services/ticketDelivery.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

```js
function buildTicketDeliveryResult(ticket) {
  return ticket.channelId ? { deliveryStatus: 'delivered', deliveryMessage: 'Biletin Discord destek ekibine teslim edildi.' } : { deliveryStatus: 'queued', deliveryMessage: 'Biletin kaydedildi. Discord destek kanalına teslim edilmesi sıraya alındı.' };
}
module.exports = { buildTicketDeliveryResult };
```

Use it immediately after `await ticket.save()` and return its fields from `POST /api/tickets`. Disable the form submit button while fetch is active; show `deliveryMessage` before redirecting.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/ticketDeliveryStatus.test.js && node --check server/routes/api.js && node --check server/views.js`

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add server/services/ticketDelivery.js server/routes/api.js server/views.js tests/ticketDeliveryStatus.test.js
git commit -m "Show ticket delivery status"
```

### Task 3: Rotalı Safety Center rehberleri

**Files:**
- Create: `tests/safetyCenter.test.js`
- Modify: `server/views/knowledgeCenterData.js:1-end`
- Modify: `server/views/helpHubPage.js:1-end`
- Modify: `server/routes/pages.js:48-70`

**Interfaces:**
- Produces: `safetyGuides` with `slug`, `title`, `category`, `summary`, `sections`, `relatedSlugs`.
- Produces: `renderSafetyGuidePage(slug)` → HTML.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderSafetyGuidePage } = require('../server/views/helpHubPage');
test('renders the Discord phishing guide as a full article', () => {
  const html = renderSafetyGuidePage('discord-sahte-dm-ve-phishing');
  assert.match(html, /Sahte DM ve phishing/);
  assert.match(html, /Şifre, token veya doğrulama kodu istemeyiz/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/safetyCenter.test.js`

Expected: FAIL because `renderSafetyGuidePage` is not exported.

- [ ] **Step 3: Write minimal implementation**

Create these eight guides: `discord-sahte-dm-ve-phishing`, `roblox-hesap-guvenligi`, `youtube-topluluk-kurallari`, `kullanici-raporlama`, `ceza-ve-itiraz`, `yetkiliyle-iletisim`, `ticket-sorun-giderici`, and `hesabimi-guvene-alma`. Every guide has “Ne yapmalıyım?”, “Ne yapmamalıyım?” and “Sonraki adım” sections. Map home topic cards to `/yardim/<slug>` and add:

```js
router.get('/yardim/:slug', (req, res) => res.send(renderSafetyGuidePage(req.params.slug)));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/safetyCenter.test.js && node --check server/views/knowledgeCenterData.js && node --check server/views/helpHubPage.js && node --check server/routes/pages.js`

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add server/views/knowledgeCenterData.js server/views/helpHubPage.js server/routes/pages.js tests/safetyCenter.test.js
git commit -m "Expand EkoYildiz safety center guides"
```

### Task 4: Full verification and integration review

**Files:**
- Modify: no production file unless a verification failure requires the minimal correction.

- [ ] **Step 1: Run the focused regression suite**

Run: `node --test tests/phibiDmFallback.test.js tests/ticketDeliveryStatus.test.js tests/safetyCenter.test.js`

Expected: all tests pass.

- [ ] **Step 2: Run source validation**

Run: `node --check bot/services/phibiDmFallback.js && node --check server/services/ticketDelivery.js && node --check server/routes/api.js && node --check server/views.js && node --check server/views/helpHubPage.js && node --check server/views/knowledgeCenterData.js && node --check server/routes/pages.js && git diff --check`

Expected: exit code 0 and no whitespace errors.

- [ ] **Step 3: Verify required behavior from the spec**

Confirm that eight guide slugs render, ticket creation returns delivered or queued, `app_open_home` becomes a `/staff` Link Button, and guild channel sends remain outside Phibi fallback.

- [ ] **Step 4: Commit final verification-only corrections, if any**

Run: `git add -A; git commit -m "Verify safety center support flows"`
