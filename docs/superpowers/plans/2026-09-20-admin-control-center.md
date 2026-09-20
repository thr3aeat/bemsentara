# EkoYıldız Admin Control Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut `/admin` özelliklerini ve API sözleşmelerini koruyarak modern, responsive ve gerçek verili bir EkoYıldız Admin Control Center oluşturmak.

**Architecture:** Yeni `adminControlCenterService` salt-okunur dashboard özetini mevcut modellerden üretir ve tek bir admin endpointi üzerinden sunar. Yeni view helper, CSS ve tarayıcı betiği mevcut `renderAdminPage` bölümlerinin etrafına modern bir uygulama kabuğu kurar; eski mutation fonksiyonları yerinde kalır ve duplicate yönetim sistemi oluşturulmaz.

**Tech Stack:** Node.js 20+, Express 4, CommonJS, mevcut Mongo/Mongoose uyumlu model katmanı, vanilla HTML/CSS/JavaScript, `node:test`, Discord.js mevcut servisleri.

**Spec:** `docs/superpowers/specs/2026-09-20-admin-control-center-design.md`

## Global Constraints

- `/admin` erişimi mevcut `isSiteAdmin` kontrolünü kullanmaya devam edecek.
- Discord OAuth, site oturumu, authentication ve permission davranışları değiştirilmeyecek.
- Kullanıcı, rol, ban, coin, hesap aktarımı, form, ticket, reklam ve çekiliş mutation endpointleri değiştirilmeyecek.
- Yeni React/Vue SPA veya build bağımlılığı eklenmeyecek.
- Gerçek kaynağı olmayan metrik üretilmeyecek; hesaplanamayan değer `null` olacak.
- IP, token, session, OAuth ve hassas log verisi control-center response’una eklenmeyecek.
- Eski `/admin` URL’si, `adm-*` bölüm kimlikleri ve hash bağlantıları çalışmaya devam edecek.
- Mevcut ayrı debug, giveaway ve group-admin sayfaları kopyalanmayacak; bağlanacak.
- Tüm yeni kullanıcı kaynaklı metinler escape edilerek gösterilecek.
- Kullanıcının mevcut veri JSON değişiklikleri commitlere dahil edilmeyecek.

## Review Focus

- Bir model sorgusu hata verdiğinde diğer dashboard kartları çalışmalı; Task 1 service testinde kısmi hata sabitlenecek.
- `null`, `0` ve boş liste birbirinden ayrılmalı; Task 1 ve Task 4 testleri dürüst empty state’i sabitleyecek.
- Çok uzun kullanıcı adı/sidebar etiketi yatay taşma üretmemeli; Task 3 markup/CSS testi ve Task 8 viewport kontrolü bunu doğrulayacak.
- Eski `#adm-users`, `#adm-bans` ve `#adm-submissions` bağlantıları doğru workspace’i açmalı; Task 5 interaction testi bunu sabitleyecek.
- 401/403 veya ağ hatasında başarı bildirimi çıkmamalı; Task 6 tarayıcı mantığı testi hata durumunu sabitleyecek.

---

## File Structure

**Create**

- `server/services/adminControlCenterService.js` — dashboard metrikleri, kuyruk, canlı kullanıcılar, servis durumları ve audit özetinin tek sorumlusu.
- `server/routes/adminControlCenter.js` — salt-okunur endpoint ve admin yetki kapısı.
- `server/views/adminControlCenter.js` — güvenli admin shell, sidebar, overview ve ortak durum bileşenlerini üreten saf view helper’ları.
- `server/public/admin/control-center.css` — yalnızca Admin Control Center görünümü ve responsive davranış.
- `server/public/admin/control-center.js` — sidebar, hash routing, komut paleti, özet fetch/refresh ve ortak feedback davranışı.
- `tests/adminControlCenterService.test.js` — aggregator veri ve kısmi hata testleri.
- `tests/adminControlCenterPage.test.js` — shell, backward compatibility, escape ve empty-state testleri.
- `tests/adminControlCenterRoute.test.js` — endpoint yetki ve güvenli response testi.

**Modify**

- `server/app.js` — bağımsız admin control-center router’ını mevcut Express uygulamasına bağlama.
- `server/views.js` — mevcut `renderAdminPage` içine yeni shell’i yerleştirme, legacy bölümlere workspace metadata ekleme ve assetleri yükleme.
- `tests/advertisingLandingPage.test.js` — admin reklam önizleme bağlantısını sabitleme.

---

### Task 1: Salt-okunur control-center veri servisi

**Files:**

- Create: `server/services/adminControlCenterService.js`
- Create: `tests/adminControlCenterService.test.js`

**Interfaces:**

- Consumes: repository adapter nesnesi `{ listUsers, listTickets, listSubmissions, listStaff, listActivityLogs, getLiveUsers, getSystemTelemetry, now }`.
- Produces: `createAdminControlCenterService(deps)` ve async `getSnapshot()`.
- Produces snapshot shape: `{ generatedAt, summary, liveUsers, queue, recentActions, services, errors }`.

- [ ] **Step 1: Başarılı snapshot için failing test yaz**

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdminControlCenterService } = require('../server/services/adminControlCenterService');

test('control center returns real summary counts and sorted queue items', async () => {
  const service = createAdminControlCenterService({
    listUsers: async () => [{ discordId: '1', username: 'Eko', isBanned: true }],
    listTickets: async () => [{ ticketId: 'T-1', subject: 'Yanıt bekliyor', updatedAt: new Date('2026-09-20T09:00:00Z'), status: 'open' }],
    listSubmissions: async () => [{ _id: 'F-1', status: 'PENDING', createdAt: new Date('2026-09-20T10:00:00Z') }],
    listStaff: async () => [{ userId: '1', status: 'active' }],
    listActivityLogs: async () => [{ id: 'L-1', discordId: '1', activityType: 'login', timestamp: new Date('2026-09-20T11:00:00Z') }],
    getLiveUsers: () => [{ userId: '1', username: 'Eko', url: '/dashboard', lastSeen: Date.parse('2026-09-20T11:59:55Z') }],
    getSystemTelemetry: () => ({ services: [{ id: 'web', name: 'Web sitesi', status: 'online', statusLabel: 'Operasyonel' }] }),
    now: () => new Date('2026-09-20T12:00:00Z'),
  });

  const snapshot = await service.getSnapshot();
  assert.equal(snapshot.summary.activeUsers24h, 1);
  assert.equal(snapshot.summary.liveUsersNow, 1);
  assert.equal(snapshot.summary.openTickets, 1);
  assert.equal(snapshot.summary.pendingSubmissions, 1);
  assert.equal(snapshot.summary.activeBans, 1);
  assert.equal(snapshot.summary.activeStaff, 1);
  assert.equal(snapshot.queue[0].type, 'ticket');
  assert.equal(snapshot.liveUsers[0].username, 'Eko');
  assert.equal(snapshot.services[0].id, 'web');
  assert.deepEqual(snapshot.errors, []);
});
```

- [ ] **Step 2: Testi çalıştır ve doğru nedenle başarısız olduğunu doğrula**

Run: `node --test tests/adminControlCenterService.test.js`

Expected: FAIL with `Cannot find module '../server/services/adminControlCenterService'`.

- [ ] **Step 3: Minimal dependency-injected servisi oluştur**

```js
'use strict';

function createAdminControlCenterService(deps) {
  const now = deps.now || (() => new Date());
  async function safeList(section, reader, errors) {
    try { const value = await reader(); return Array.isArray(value) ? value : []; }
    catch (_) { errors.push({ section, message: 'Veri alınamadı' }); return null; }
  }
  function publicLiveUser(item) {
    return { userId: String(item.userId || ''), username: String(item.username || 'Bilinmiyor').slice(0, 80), avatar: String(item.avatar || ''), url: String(item.url || '/').slice(0, 180), lastSeen: Number(item.lastSeen || 0) };
  }
  async function getSnapshot() {
    const errors = [];
    const current = now();
    const sinceMs = current.getTime() - 86400000;
    const [users, tickets, submissions, staff, logs, liveUsers, telemetry] = await Promise.all([
      safeList('users', deps.listUsers, errors), safeList('tickets', deps.listTickets, errors),
      safeList('submissions', deps.listSubmissions, errors), safeList('staff', deps.listStaff, errors),
      safeList('activity', deps.listActivityLogs, errors), safeList('liveUsers', async () => deps.getLiveUsers(), errors),
      (async () => { try { return await deps.getSystemTelemetry(); } catch (_) { errors.push({ section: 'services', message: 'Veri alınamadı' }); return null; } })(),
    ]);
    const activeIds = logs === null ? null : new Set(logs.filter(item => new Date(item.timestamp || item.iso || 0).getTime() >= sinceMs).map(item => String(item.discordId))).size;
    const open = tickets === null ? null : tickets.filter(item => ['open', 'pending_confirmation'].includes(item.status));
    const pending = submissions === null ? null : submissions.filter(item => item.status === 'PENDING');
    const queue = [
      ...(open || []).map(item => ({ id: String(item.ticketId || item._id), type: 'ticket', title: String(item.subject || 'İsimsiz ticket'), createdAt: item.updatedAt || item.createdAt, href: '/tickets', priority: item.priority || 'medium' })),
      ...(pending || []).map(item => ({ id: String(item._id), type: 'submission', title: String(item.formTitle || 'İsimsiz başvuru'), createdAt: item.createdAt, href: '/admin#adm-submissions', priority: 'normal' })),
    ].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)).slice(0, 12);
    return {
      generatedAt: current.toISOString(),
      summary: { activeUsers24h: activeIds, liveUsersNow: liveUsers?.length ?? null, openTickets: open?.length ?? null, pendingSubmissions: pending?.length ?? null, activeBans: users === null ? null : users.filter(item => item.isBanned).length, activeStaff: staff === null ? null : staff.filter(item => !['dismissed', 'resigned', 'paused'].includes(item.status)).length },
      liveUsers: (liveUsers || []).map(publicLiveUser), queue,
      recentActions: (logs || []).filter(item => ['ban', 'unban', 'mod_action', 'admin_note'].includes(item.activityType)).slice(-12).reverse().map(item => ({ id: String(item.id || item._id || ''), discordId: String(item.discordId || ''), type: item.activityType, timestamp: item.timestamp || item.iso })),
      services: Array.isArray(telemetry?.services) ? telemetry.services.map(item => ({ id: item.id, name: item.name, status: item.status, statusLabel: item.statusLabel, metrics: item.metrics })) : [], errors,
    };
  }
  return { getSnapshot };
}

module.exports = { createAdminControlCenterService };
```

Production adapter’ı Task 2’de mevcut in-memory Store, `FormSubmission.findAll`, `StaffProgress.find`, `collections.userActivityLogs`, `activityTracker.getActiveUsers` ve `systemStatusService.getSystemTelemetry` üzerine kurulacak. Böylece in-memory ve Mongoose kaynakları tek serviste varsayılmayacak.

- [ ] **Step 4: Kısmi model hatası ve `null` davranışı için ikinci failing test ekle**

```js
test('control center isolates failed model queries and returns null for unknown metrics', async () => {
  const broken = async () => { throw new Error('store unavailable'); };
  const service = createAdminControlCenterService({
    listUsers: broken,
    listTickets: async () => [{ ticketId: 'T-1', status: 'open' }],
    listSubmissions: async () => [],
    listStaff: async () => [],
    listActivityLogs: async () => [],
    getLiveUsers: () => [],
    getSystemTelemetry: () => ({ services: [] }),
    now: () => new Date('2026-09-20T12:00:00Z'),
  });
  const snapshot = await service.getSnapshot();
  assert.equal(snapshot.summary.activeBans, null);
  assert.equal(snapshot.summary.openTickets, 1);
  assert.deepEqual(snapshot.errors, [{ section: 'users', message: 'Veri alınamadı' }]);
});
```

- [ ] **Step 5: İki testi çalıştır ve geçir**

Run: `node --test tests/adminControlCenterService.test.js`

Expected: 2 tests, 2 pass, 0 fail.

- [ ] **Step 6: Task 1 commitini oluştur**

```powershell
git add -- server/services/adminControlCenterService.js tests/adminControlCenterService.test.js
git commit -m "feat: add admin control center snapshot service"
```

---

### Task 2: Yetkili control-center API endpointi

**Files:**

- Create: `server/routes/adminControlCenter.js`
- Modify: `server/app.js`
- Create: `tests/adminControlCenterRoute.test.js`

**Interfaces:**

- Consumes: `createAdminControlCenterService(deps).getSnapshot()` from Task 1.
- Produces: `GET /api/admin/control-center` returning `{ success: true, ...snapshot }`.
- Produces: exported `buildAdminControlCenterHandler({ service, isAdmin })` for direct tests.

- [ ] **Step 1: Yetkisiz ve yetkili davranış için failing test yaz**

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAdminControlCenterHandler } = require('../server/routes/adminControlCenter');

function responseRecorder() {
  return {
    statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test('control center endpoint rejects non-admin users without querying data', async () => {
  let calls = 0;
  const handler = buildAdminControlCenterHandler({ service: { getSnapshot: async () => { calls++; return {}; } }, isAdmin: () => false });
  const res = responseRecorder();
  await handler({ user: { username: 'member' } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(calls, 0);
});

test('control center endpoint returns the safe snapshot to admins', async () => {
  const snapshot = { generatedAt: '2026-09-20T12:00:00.000Z', summary: {}, liveUsers: [], queue: [], recentActions: [], services: [], errors: [] };
  const handler = buildAdminControlCenterHandler({ service: { getSnapshot: async () => snapshot }, isAdmin: () => true });
  const res = responseRecorder();
  await handler({ user: { isAdmin: true } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true, ...snapshot });
});
```

- [ ] **Step 2: Testi çalıştır ve export eksikliğiyle başarısız olduğunu doğrula**

Run: `node --test tests/adminControlCenterRoute.test.js`

Expected: FAIL because `buildAdminControlCenterHandler` is not defined.

- [ ] **Step 3: Handler factory ve route’u ekle**

```js
function buildAdminControlCenterHandler({ service, isAdmin = isSiteAdmin }) {
  return async function adminControlCenterHandler(req, res) {
    if (!req.user || !isAdmin(req.user)) {
      return res.status(403).json({ success: false, error: 'Bu alan için yönetici yetkisi gerekli.' });
    }
    try {
      const snapshot = await service.getSnapshot();
      return res.json({ success: true, ...snapshot });
    } catch (error) {
      console.error('[AdminControlCenter] snapshot error:', error.message);
      return res.status(500).json({ success: false, error: 'Kontrol merkezi verileri yüklenemedi.' });
    }
  };
}
```

Yeni route modülünde mevcut veri kaynaklarını küçük adapter fonksiyonlarıyla geçir ve aynı handler’ı bağla:

```js
const { users: userStore, tickets: ticketStore, collections } = require('../../models/Store');
const FormSubmission = require('../../models/FormSubmission');
const StaffProgress = require('../../models/StaffProgress');
const { getActiveUsers } = require('../services/activityTracker');
const { getSystemTelemetry } = require('../services/systemStatusService');

const router = require('express').Router();
router.get('/api/admin/control-center', buildAdminControlCenterHandler({
  service: createAdminControlCenterService({
    listUsers: async () => userStore.find({}),
    listTickets: async () => ticketStore.find({}),
    listSubmissions: () => FormSubmission.findAll(),
    listStaff: () => StaffProgress.find({}).lean(),
    listActivityLogs: async () => collections.userActivityLogs?.find({}) || [],
    getLiveUsers: () => getActiveUsers(),
    getSystemTelemetry: () => getSystemTelemetry(),
  }),
}));

module.exports = { router, buildAdminControlCenterHandler };
```

`server/app.js` importlarına ve mevcut router mount sırasına şunu ekle:

```js
const { router: adminControlCenterRoutes } = require('./routes/adminControlCenter');
app.use(adminControlCenterRoutes);
```

- [ ] **Step 4: Endpoint testlerini geçir**

Run: `node --test tests/adminControlCenterRoute.test.js tests/adminControlCenterService.test.js`

Expected: 4 tests, 4 pass, 0 fail.

- [ ] **Step 5: Task 2 commitini oluştur**

```powershell
git add -- server/routes/adminControlCenter.js server/app.js tests/adminControlCenterRoute.test.js
git commit -m "feat: expose admin control center snapshot"
```

---

### Task 3: Admin shell ve responsive tasarım sistemi

**Files:**

- Create: `server/views/adminControlCenter.js`
- Create: `server/public/admin/control-center.css`
- Create: `tests/adminControlCenterPage.test.js`

**Interfaces:**

- Produces: `renderAdminControlCenterShell({ user, legacyContent })`.
- Produces: `renderAdminMetric(value, label, options)`.
- Produces: `adminControlCenterAssets()` returning `<link>` and `<script defer>` tags.
- Consumes: already-escaped or internally escaped `user.username`.

- [ ] **Step 1: Shell, escaping ve eski workspace kimlikleri için failing test yaz**

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderAdminControlCenterShell, adminControlCenterAssets } = require('../server/views/adminControlCenter');

test('admin shell renders grouped navigation and escapes administrator identity', () => {
  const html = renderAdminControlCenterShell({
    user: { username: '<img src=x onerror=alert(1)>' },
    legacyContent: '<section id="adm-users">Users</section><section id="adm-bans">Bans</section>',
  });
  assert.match(html, /data-admin-shell/);
  assert.match(html, /data-admin-nav="overview"/);
  assert.match(html, /data-admin-nav="users"/);
  assert.match(html, /id="adm-users"/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(adminControlCenterAssets(), /\/public\/admin\/control-center\.css/);
});
```

- [ ] **Step 2: Testi çalıştır ve modül bulunamadığı için başarısız olduğunu doğrula**

Run: `node --test tests/adminControlCenterPage.test.js`

Expected: FAIL with missing `server/views/adminControlCenter`.

- [ ] **Step 3: Saf shell renderer’ını ekle**

```js
'use strict';
function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const groups = [
  ['Genel', [['overview', 'Genel Bakış'], ['operations', 'Canlı Operasyon']]],
  ['İnsanlar', [['users', 'Kullanıcılar'], ['staff', 'Personel'], ['bans', 'Banlar ve Güvenlik'], ['coins', 'Ekonomi']]],
  ['Operasyon', [['tickets', 'Ticket’lar'], ['submissions', 'Başvurular'], ['forms', 'Panel Formları'], ['automation', 'Otomasyonlar'], ['group-logs', 'Grup Değişiklikleri']]],
  ['İçerik ve Sistem', [['content', 'İçerik ve Topluluk'], ['system', 'Sistem ve Audit']]],
];

function renderAdminControlCenterShell({ user, legacyContent }) {
  const nav = groups.map(([label, items]) => `<section class="acc-nav-group"><h2>${label}</h2>${items.map(([id, title]) => `<button type="button" data-admin-nav="${id}">${title}</button>`).join('')}</section>`).join('');
  return `<div class="acc-shell" data-admin-shell data-sidebar-open="false"><aside class="acc-sidebar"><div class="acc-brand">E★ <span>Control Center</span></div>${nav}</aside><section class="acc-main"><header class="acc-commandbar"><button type="button" data-admin-sidebar-toggle aria-label="Yönetim menüsünü aç">☰</button><button type="button" data-admin-command-trigger>Kontrol merkezinde ara <kbd>Ctrl K</kbd></button><span class="acc-admin-name">${esc(user?.username || user?.discordUsername || 'Yönetici')}</span></header><div class="acc-workspace">${legacyContent}</div></section><div data-admin-command-dialog hidden></div></div>`;
}

function adminControlCenterAssets() {
  return '<link rel="stylesheet" href="/public/admin/control-center.css"><script defer src="/public/admin/control-center.js"><\/script>';
}

module.exports = { renderAdminControlCenterShell, adminControlCenterAssets, esc };
```

- [ ] **Step 4: CSS’te grid shell, truncation ve responsive drawer’ı tanımla**

```css
.acc-shell{--acc-sidebar:252px;display:grid;grid-template-columns:var(--acc-sidebar) minmax(0,1fr);min-height:calc(100vh - 96px);width:min(1480px,calc(100% - 28px));margin:18px auto;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:rgba(10,11,17,.78);box-shadow:0 28px 80px rgba(0,0,0,.34);backdrop-filter:blur(24px)}
.acc-sidebar{min-width:0;padding:18px 12px;border-right:1px solid rgba(255,255,255,.08);overflow-y:auto}.acc-main,.acc-workspace{min-width:0}.acc-admin-name{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.acc-commandbar{min-height:64px;display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
@media(max-width:900px){.acc-shell{display:block}.acc-sidebar{position:fixed;inset:0 auto 0 0;width:min(86vw,300px);z-index:900;transform:translateX(-105%);transition:transform .2s ease}.acc-shell[data-sidebar-open="true"] .acc-sidebar{transform:none}}
@media(prefers-reduced-motion:reduce){.acc-sidebar{transition:none}}
```

- [ ] **Step 5: Shell testini geçir**

Run: `node --test tests/adminControlCenterPage.test.js`

Expected: 1 test, 1 pass, 0 fail.

- [ ] **Step 6: Task 3 commitini oluştur**

```powershell
git add -- server/views/adminControlCenter.js server/public/admin/control-center.css tests/adminControlCenterPage.test.js
git commit -m "feat: add responsive admin control center shell"
```

---

### Task 4: Genel bakış dashboard’u ve dürüst veri durumları

**Files:**

- Modify: `server/views/adminControlCenter.js`
- Modify: `server/public/admin/control-center.css`
- Modify: `tests/adminControlCenterPage.test.js`

**Interfaces:**

- Produces: `renderAdminOverviewSkeleton()` with stable hooks `data-admin-metric`, `data-admin-queue`, `data-admin-live-users`, `data-admin-services`, `data-admin-recent-actions`.
- Produces: `renderAdminMetric(value, label, { tone })`, where `null` renders `Veri alınamadı`, `0` renders numeric `0`.

- [ ] **Step 1: `null`, `0` ve overview hookları için failing test ekle**

```js
test('admin metrics distinguish zero from unavailable data', () => {
  assert.match(renderAdminMetric(0, 'Açık ticket'), />0</);
  assert.match(renderAdminMetric(null, 'Açık ticket'), /Veri alınamadı/);
  const html = renderAdminOverviewSkeleton();
  assert.match(html, /data-admin-queue/);
  assert.match(html, /data-admin-live-users/);
  assert.match(html, /data-admin-services/);
});
```

- [ ] **Step 2: Testi çalıştır ve missing export ile başarısız olduğunu doğrula**

Run: `node --test tests/adminControlCenterPage.test.js`

Expected: FAIL because overview helpers are missing.

- [ ] **Step 3: Overview helper’larını minimal HTML ile ekle**

```js
function renderAdminMetric(value, label, { tone = 'neutral', key = '' } = {}) {
  const display = value === null || value === undefined ? 'Veri alınamadı' : String(value);
  return `<article class="acc-metric" data-tone="${tone}" data-admin-metric="${key}"><span>${esc(label)}</span><strong>${esc(display)}</strong></article>`;
}

function renderAdminOverviewSkeleton() {
  return `<section id="adm-overview" data-admin-workspace="overview"><header class="acc-page-head"><div><span class="acc-eyebrow">EKOYILDIZ OPERASYON</span><h1>Kontrol Merkezi</h1><p>Canlı durum, bekleyen işler ve hızlı yönetim araçları.</p></div><button type="button" data-admin-refresh>Verileri yenile</button></header><div class="acc-metrics" data-admin-metrics aria-live="polite"></div><div class="acc-dashboard-grid"><section class="acc-panel"><h2>Operasyon kuyruğu</h2><div data-admin-queue class="acc-state">Yükleniyor…</div></section><section class="acc-panel"><h2>Canlı kullanıcılar</h2><div data-admin-live-users class="acc-state">Yükleniyor…</div></section><section class="acc-panel"><h2>Servis sağlığı</h2><div data-admin-services class="acc-state">Yükleniyor…</div></section><section class="acc-panel"><h2>Son yönetim işlemleri</h2><div data-admin-recent-actions class="acc-state">Yükleniyor…</div></section></div></section>`;
}
```

- [ ] **Step 4: Dashboard grid, empty state ve skeleton stillerini ekle**

CSS; desktopta 12 kolon, dashboard panellerinde `grid-column:span 6`, 720 px altında tek kolon kullanmalı. `.acc-state[data-state="error"]`, `.acc-state[data-state="empty"]` ve `.acc-skeleton` belirgin fakat sakin görünümler taşımalı.

- [ ] **Step 5: Page testini geçir**

Run: `node --test tests/adminControlCenterPage.test.js`

Expected: 2 tests, 2 pass, 0 fail.

- [ ] **Step 6: Task 4 commitini oluştur**

```powershell
git add -- server/views/adminControlCenter.js server/public/admin/control-center.css tests/adminControlCenterPage.test.js
git commit -m "feat: add admin operations overview"
```

---

### Task 5: Mevcut admin sayfasını yeni shell’e bağlama

**Files:**

- Modify: `server/views.js:3879-5777`
- Create: `server/public/admin/control-center.js`
- Modify: `tests/adminControlCenterPage.test.js`

**Interfaces:**

- Consumes: `renderAdminControlCenterShell`, `renderAdminOverviewSkeleton`, `adminControlCenterAssets`.
- Preserves: `admTab(name, button)`, `adminSearchUsers`, `giveCoins`, `banUser`, form review functions and all existing IDs.
- Produces: hash resolver mapping `#adm-stats -> overview`, `#adm-users -> users`, `#adm-bans -> bans`, `#adm-submissions -> submissions`.

- [ ] **Step 1: Rendered `/admin` HTML’i için failing integration assertion ekle**

```js
const { renderAdminPage } = require('../server/views');

test('existing admin workspaces are mounted inside the new control center shell', () => {
  const html = renderAdminPage({ username: 'admin', isAdmin: true });
  assert.match(html, /data-admin-shell/);
  assert.match(html, /id="adm-overview"/);
  assert.match(html, /id="adm-users"/);
  assert.match(html, /id="adm-bans"/);
  assert.match(html, /\/public\/admin\/control-center\.js/);
});
```

- [ ] **Step 2: Testi çalıştır ve yeni shell olmadığı için başarısız olduğunu doğrula**

Run: `node --test tests/adminControlCenterPage.test.js`

Expected: FAIL on `data-admin-shell`.

- [ ] **Step 3: `renderAdminPage` çıktısını shell ile sar**

`server/views.js` üst importlarına helper’ları ekle. Mevcut `content` template’inde eski sekme çubuğuna `data-admin-legacy-tabs` ekle; her `id="adm-*"` köküne karşılık gelen `data-admin-workspace` ekle. Fonksiyon sonunda:

```js
const adminContent = renderAdminControlCenterShell({
  user,
  legacyContent: `${renderAdminOverviewSkeleton()}${content}`,
});
return _layout('Admin Control Center', user, adminContent, adminControlCenterAssets(), '/admin');
```

Eski inline script ve modal markup `legacyContent` içinde kalmalı; çalışma mantığı yeniden yazılmamalı.

- [ ] **Step 4: Hash routing ve sidebar davranışı için client script ekle**

```js
(function () {
  const shell = document.querySelector('[data-admin-shell]');
  if (!shell) return;
  const aliases = { stats: 'overview', 'adm-stats': 'overview', 'adm-users': 'users', 'adm-bans': 'bans', 'adm-submissions': 'submissions' };
  function normalize(value) { return aliases[String(value || '').replace(/^#/, '')] || String(value || 'overview').replace(/^adm-/, ''); }
  function activate(name, writeHash = true) {
    const target = normalize(name);
    document.querySelectorAll('[data-admin-workspace]').forEach(node => { node.hidden = node.dataset.adminWorkspace !== target; node.style.display = node.hidden ? 'none' : ''; });
    document.querySelectorAll('[data-admin-nav]').forEach(button => button.setAttribute('aria-current', button.dataset.adminNav === target ? 'page' : 'false'));
    if (writeHash) history.replaceState(null, '', `#adm-${target === 'overview' ? 'stats' : target}`);
  }
  document.querySelectorAll('[data-admin-nav]').forEach(button => button.addEventListener('click', () => activate(button.dataset.adminNav)));
  document.querySelector('[data-admin-sidebar-toggle]')?.addEventListener('click', () => { shell.dataset.sidebarOpen = shell.dataset.sidebarOpen !== 'true' ? 'true' : 'false'; });
  window.addEventListener('hashchange', () => activate(location.hash, false));
  activate(location.hash || 'overview', false);
})();
```

Sidebar’daki `tickets`, `content` ve `system` gibi ayrı sayfa/özet grupları için workspace helper’ın ürettiği bağlantı kartlarını kullan; var olmayan `adm-*` hedefi açma.

- [ ] **Step 5: Eski hash mapping testini ekle ve geçir**

Test, client script kaynak metninde `adm-users`, `adm-bans`, `adm-submissions` aliaslarını ve `hashchange` listener’ını doğrulasın.

Run: `node --test tests/adminControlCenterPage.test.js`

Expected: all page tests pass.

- [ ] **Step 6: Task 5 commitini oluştur**

```powershell
git add -- server/views.js server/public/admin/control-center.js tests/adminControlCenterPage.test.js
git commit -m "feat: mount legacy admin tools in control center"
```

---

### Task 6: Dashboard veri yükleme, komut paleti ve hata durumları

**Files:**

- Modify: `server/public/admin/control-center.js`
- Modify: `server/public/admin/control-center.css`
- Modify: `tests/adminControlCenterPage.test.js`

**Interfaces:**

- Consumes: `GET /api/admin/control-center`.
- Produces: `loadAdminSnapshot({ force })`, `renderAdminSnapshot(data)`, `setAdminSectionState(element, state, message)` client functions.
- Produces: client-side command list with `{ id, label, keywords, target, href }`.

- [ ] **Step 1: Güvenli DOM render ve hata beklentileri için failing source test ekle**

```js
test('admin client uses textContent, handles forbidden responses and never injects API text with innerHTML', () => {
  const source = fs.readFileSync(path.join(__dirname, '../server/public/admin/control-center.js'), 'utf8');
  assert.match(source, /response\.status === 401 \|\| response\.status === 403/);
  assert.match(source, /textContent/);
  assert.doesNotMatch(source, /innerHTML\s*=\s*.*(?:data|item|message)/);
  assert.match(source, /data-admin-command-trigger/);
  assert.match(source, /Control|Meta/);
});
```

- [ ] **Step 2: Testi çalıştır ve eksik client davranışı nedeniyle başarısız olduğunu doğrula**

Run: `node --test tests/adminControlCenterPage.test.js`

Expected: FAIL on 401/403 or command palette assertions.

- [ ] **Step 3: Snapshot fetch ve safe DOM render ekle**

```js
async function loadAdminSnapshot() {
  const refresh = document.querySelector('[data-admin-refresh]');
  if (refresh?.disabled) return;
  if (refresh) refresh.disabled = true;
  try {
    const response = await fetch('/api/admin/control-center', { headers: { Accept: 'application/json' } });
    if (response.status === 401 || response.status === 403) {
      setGlobalNotice('Yönetici oturumun sona erdi. Yeniden giriş yapmalısın.', 'error');
      return;
    }
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'snapshot_failed');
    renderAdminSnapshot(data);
  } catch (error) {
    document.querySelectorAll('.acc-state').forEach(node => setAdminSectionState(node, 'error', 'Bu bölüm şu anda yüklenemedi.'));
  } finally {
    if (refresh) refresh.disabled = false;
  }
}
```

Liste render’larında `document.createElement`, `textContent`, `setAttribute` ve sabit class adları kullan. API’den gelen HTML hiçbir yerde `innerHTML` ile yazılmasın.

- [ ] **Step 4: Admin komut paletini ekle**

Komutlar yalnızca admin modülleri ve mevcut sayfa bağlantılarından oluşmalı. `Ctrl/Cmd + K` açar, Escape kapatır, ok tuşları seçim değiştirir, Enter hedef workspace’i aktive eder veya `href`e gider. Kullanıcı arama komutu `users` workspace’ini açıp `#admin-search` alanına focus verir.

- [ ] **Step 5: 30 saniyelik görünür sayfa yenilemesini ekle**

`document.visibilityState === 'visible'` koşuluyla 30 saniyede bir snapshot yenile. Aynı anda ikinci fetch başlatma. Manuel yenileme butonu aynı fonksiyonu çağırmalı.

- [ ] **Step 6: Client testlerini geçir**

Run: `node --test tests/adminControlCenterPage.test.js tests/adminControlCenterRoute.test.js`

Expected: all tests pass.

- [ ] **Step 7: Task 6 commitini oluştur**

```powershell
git add -- server/public/admin/control-center.js server/public/admin/control-center.css tests/adminControlCenterPage.test.js
git commit -m "feat: add live admin dashboard and command palette"
```

---

### Task 7: Legacy araçları modernleştirme ve güvenli işlem onayı

**Files:**

- Modify: `server/views.js:3879-5777`
- Modify: `server/views/adminControlCenter.js`
- Modify: `server/public/admin/control-center.css`
- Modify: `server/public/admin/control-center.js`
- Modify: `tests/adminControlCenterPage.test.js`

**Interfaces:**

- Produces: shared dialog hooks `[data-admin-confirm-dialog]`, `[data-admin-confirm-title]`, `[data-admin-confirm-summary]`, `[data-admin-confirm-submit]`.
- Produces: `confirmAdminAction({ title, summary, tone, execute }) -> Promise<boolean>`.
- Preserves all existing action function names and API payloads.

- [ ] **Step 1: Onay dialogu ve modern workspace classları için failing test ekle**

```js
test('admin shell includes a reusable destructive-action confirmation dialog', () => {
  const html = renderAdminPage({ username: 'admin', isAdmin: true });
  assert.match(html, /data-admin-confirm-dialog/);
  assert.match(html, /data-admin-confirm-summary/);
  assert.match(html, /data-admin-confirm-submit/);
  assert.match(html, /class="[^"]*acc-legacy-workspace/);
});
```

- [ ] **Step 2: Testi çalıştır ve dialog eksikliği nedeniyle başarısız olduğunu doğrula**

Run: `node --test tests/adminControlCenterPage.test.js`

Expected: FAIL on `data-admin-confirm-dialog`.

- [ ] **Step 3: Ortak dialog markup ve JS controller ekle**

```js
function confirmAdminAction({ title, summary, tone = 'danger', execute }) {
  const dialog = document.querySelector('[data-admin-confirm-dialog]');
  const submit = dialog.querySelector('[data-admin-confirm-submit]');
  dialog.querySelector('[data-admin-confirm-title]').textContent = title;
  dialog.querySelector('[data-admin-confirm-summary]').textContent = summary;
  dialog.dataset.tone = tone;
  dialog.showModal();
  return new Promise(resolve => {
    submit.onclick = async () => {
      submit.disabled = true;
      try { await execute(); resolve(true); dialog.close(); }
      catch (error) { setGlobalNotice(error.message || 'İşlem tamamlanamadı.', 'error'); resolve(false); }
      finally { submit.disabled = false; }
    };
  });
}
```

`banUser`, `performAccountTransfer`, rol güncelleme ve coin verme fonksiyonlarında mevcut fetch çağrısını değiştirmeden önce hedef kullanıcı + işlem özeti bu dialogdan geçir. Sunucudan başarı yanıtı gelmeden success notice gösterme.

- [ ] **Step 4: Legacy workspace köklerini sınıflandır ve CSS ile yeniden düzenle**

Her köke `class="acc-legacy-workspace"` ve anlamlı alt sınıf ekle. Inline stilleri topluca silme; control-center CSS yalnızca `.acc-shell` altındaki kart, input, select, tablo, modal ve butonları normalize etsin. Yatay sekme çubuğunu `[data-admin-legacy-tabs]{display:none}` ile gizle.

- [ ] **Step 5: İçerik ve sistem bağlantı merkezlerini ekle**

İçerik workspace’i `/cekilisler/admin`, `/reklam/ekoyildiz-ortaklik`, `/blog`, `/video-blog` ve mevcut sponsor reklam yönetim yüzeyine güvenli kartlarla bağlansın. Sistem workspace’i `/status`, `/debug`, `/settings` ve `/group-admin` bağlantılarını yalnızca mevcut admin yetkisi kapsamında göstersin.

- [ ] **Step 6: Güvenli işlem ve page testlerini geçir**

Run: `node --test tests/adminControlCenterPage.test.js tests/adminControlCenterRoute.test.js tests/advertisingLandingPage.test.js`

Expected: all tests pass.

- [ ] **Step 7: Task 7 commitini oluştur**

```powershell
git add -- server/views.js server/views/adminControlCenter.js server/public/admin/control-center.css server/public/admin/control-center.js tests/adminControlCenterPage.test.js tests/advertisingLandingPage.test.js
git commit -m "feat: modernize admin management workspaces"
```

---

### Task 8: Regresyon, responsive görsel doğrulama ve teslim

**Files:**

- Modify only if verification reveals a defect: files from Tasks 1–7.

**Interfaces:**

- Verifies all new and preserved interfaces; produces no new API.

- [ ] **Step 1: Sözdizimi kontrollerini çalıştır**

Run each command separately:

```powershell
node --check server/services/adminControlCenterService.js
node --check server/views/adminControlCenter.js
node --check server/public/admin/control-center.js
node --check server/routes/adminControlCenter.js
node --check server/app.js
node --check server/views.js
```

Expected: every command exits 0 with no syntax error.

- [ ] **Step 2: Hedefli test paketini çalıştır**

```powershell
node --test --test-force-exit tests/adminControlCenterService.test.js tests/adminControlCenterRoute.test.js tests/adminControlCenterPage.test.js tests/advertisingLandingPage.test.js tests/platformChrome.test.js tests/ticketPanelActions.test.js tests/reklamTicketPricing.test.js
```

Expected: 0 fail.

- [ ] **Step 3: Admin yetki ve mevcut sistem regresyonlarını çalıştır**

```powershell
node --test --test-force-exit tests/userManagementService.test.js tests/ticketLifecycleService.test.js tests/giveawayAdminDependencies.test.js tests/helpSafetyArchitecture.test.js
```

Expected: 0 fail.

- [ ] **Step 4: Local admin sayfasını yetkili fixture ile aç ve desktop kontrolü yap**

Tarayıcıda 1440×900 görünümde şu kontrolleri yap:

- Sidebar, command bar ve dashboard aynı anda görünür.
- Kullanıcı adı taşmaz.
- Özet kartları gerçek değer, `0` veya “Veri alınamadı” gösterir.
- Eski kullanıcı, ban, başvuru ve coin araçları sidebar’dan açılır.
- Console’da uncaught error yoktur.

- [ ] **Step 5: Mobil viewport kontrolü yap**

390×844 görünümde:

- `document.documentElement.scrollWidth <= window.innerWidth`.
- Sidebar drawer kapalı başlar ve toggle ile açılır.
- Metric kartları tek kolona iner.
- Form inputları ve işlem butonları viewport dışına taşmaz.
- Dialog ekran içinde kaydırılabilir ve kapatılabilir.

- [ ] **Step 6: Diff ve kullanıcı verisi güvenlik kontrolü yap**

```powershell
git diff --check
git status --short
```

Expected: whitespace error yok; `data/*.json` dosyaları staged değil.

- [ ] **Step 7: Doğrulamada bulunan kusurları TDD ile düzelt ve tüm Task 8 komutlarını yeniden çalıştır**

Her kusur için önce onu üreten failing assertion ekle, ardından minimal düzeltmeyi uygula. Fresh test çıktısı olmadan tamamlandı iddiasında bulunma.

- [ ] **Step 8: Son commit ve push öncesi branch doğrulaması**

```powershell
git add -- server/services/adminControlCenterService.js server/routes/adminControlCenter.js server/app.js server/views/adminControlCenter.js server/public/admin/control-center.css server/public/admin/control-center.js server/views.js tests/adminControlCenterService.test.js tests/adminControlCenterRoute.test.js tests/adminControlCenterPage.test.js tests/advertisingLandingPage.test.js
git commit -m "feat: complete EkoYildiz admin control center"
git fetch origin main
git merge-base --is-ancestor origin/main HEAD
```

Expected: commit succeeds and ancestry check exits 0. Push only after the user-requested integration method and final verification are satisfied.

---

## Completion Criteria

- Admin Control Center desktop ve mobilde taşmadan çalışır.
- Mevcut admin mutation işlevleri ve permission kontrolleri korunur.
- Dashboard yalnızca gerçek veriyi gösterir; bilinmeyen metrikler `null`/empty state olur.
- Eski `/admin#adm-*` bağlantıları doğru workspace’i açar.
- Riskli işlemler hedef ve özeti gösteren ikinci onaydan geçer.
- Komut paleti admin modüllerini ve kullanıcı aramasını açar.
- Control-center endpointi yalnızca admin kullanıcıya yanıt verir ve hassas veri taşımaz.
- Hedefli ve regresyon testleri 0 failure ile tamamlanır.
- Görsel QA desktop ve mobil ölçülerde tamamlanır.
