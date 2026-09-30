const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const { renderSettingsPage } = require('../server/views');

function loadSettingsClient(overrides = {}) {
  const elements = new Map();
  const values = {
    profileColor: '#123456',
    profileBio: 'Kısa biyografi',
    profileGunsLol: 'https://guns.lol/test',
    profileBgImage: 'https://example.com/bg.png',
    profileMusic: 'https://example.com/music.mp3',
    currentPin: '111111',
    newPin: '222222',
    newPinConfirm: '222222',
    lrCategory: 'kvkk_delete',
    lrSubject: 'Veri silme talebi',
    lrTargetAccount: 'test (123)',
    lrContact: 'test@example.com',
    lrContent: 'Kişisel verilerimin silinmesini talep ediyorum.',
    lrEvidenceUrls: '',
    lrLegalConsent: '',
  };

  for (const [id, value] of Object.entries(values)) {
    elements.set(id, {
      value,
      checked: id === 'lrLegalConsent',
      disabled: false,
      innerHTML: '',
      innerText: '',
      style: { setProperty() {} },
      reset() {},
    });
  }

  const requests = [];
  const document = {
    readyState: 'complete',
    documentElement: {
      style: { setProperty() {} },
      classList: { add() {}, remove() {} },
    },
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, {
          value: '', checked: false, disabled: false, innerHTML: '', innerText: '',
          style: { setProperty() {} }, reset() {}, classList: { add() {}, remove() {} },
        });
      }
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener() {},
  };

  const context = {
    document,
    window: { location: { hash: '', reload() {} }, addEventListener() {} },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    fetch: async (url, options = {}) => {
      requests.push({ url, options });
      return { json: async () => ({ success: true, refCode: 'EKO-LEG-2026-ABC123', requests: [] }) };
    },
    alert() {},
    confirm() { return true; },
    console,
    setTimeout() {},
    ...overrides,
  };
  context.globalThis = context;

  const html = renderSettingsPage({
    username: 'test',
    discordId: '123',
    roles: [],
    sitePinPassword: '111111',
    staffSettings: {},
    tosAccepted: false,
  });
  const scripts = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  const settingsScript = scripts.find((script) => script.includes('function handleSaveProfile'));
  vm.createContext(context);
  vm.runInContext(settingsScript, context);

  return { context, elements, requests };
}

test('profil kaydetme mevcut ayarlar API sözleşmesini kullanır', async () => {
  const { context, requests } = loadSettingsClient();

  await context.handleSaveProfile({ preventDefault() {} });

  assert.equal(requests[0].url, '/api/settings');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    profileColor: '#123456',
    profileBio: 'Kısa biyografi',
    gunsLolUrl: 'https://guns.lol/test',
    profileBgUrl: 'https://example.com/bg.png',
    profileMusicUrl: 'https://example.com/music.mp3',
  });
});

test('PIN kaydetme mevcut PIN API sözleşmesini kullanır', async () => {
  const { context, requests } = loadSettingsClient();

  await context.handleSavePin({ preventDefault() {} });

  assert.equal(requests[0].url, '/api/settings/update-pin');
  assert.deepEqual(JSON.parse(requests[0].options.body), { pin: '222222' });
});

test("şart onayı yeni durumu API'ye gönderir", async () => {
  const { context, requests } = loadSettingsClient();

  await context.handleToggleTosConsent();

  assert.equal(requests[0].url, '/api/settings/tos-consent');
  assert.deepEqual(JSON.parse(requests[0].options.body), { accept: true });
});

test('hukuki talep formu mevcut hukuk API sözleşmesini kullanır', async () => {
  const { context, requests } = loadSettingsClient();

  await context.handleLegalRequestSubmit({ preventDefault() {} });

  assert.equal(requests[0].url, '/api/legal-requests');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    requestType: 'kvkk_delete',
    fullName: 'test',
    officialEmail: 'test@example.com',
    idOrDiscord: 'test (123)',
    legalBasis: 'KVKK / Topluluk Mevzuatı',
    subject: 'Veri silme talebi',
    statement: 'Kişisel verilerimin silinmesini talep ediyorum.',
    legalLiabilityAccepted: true,
    termsAccepted: false,
  });
});
