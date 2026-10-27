'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const { renderLoginPage, renderAdminPage } = require('../server/views');
const { renderPublicContractPage } = require('../server/views/contractsView');
const contractsRouter = require('../server/routes/contracts');
const { contracts } = require('../models/Store');

test('Login page renders YıldızID banner and Welcome to EkoYıldız Hub Roblox permission table without breaking existing login methods', () => {
  const html = renderLoginPage();

  // YıldızID banner
  assert.match(html, /YıldızID ile giriş yapıyorsunuz\./);

  // EkoYıldız Hub permission block
  assert.match(html, /Welcome to EkoYıldız Hub/);
  assert.match(html, /Grant permission for/);
  assert.match(html, /We will take you to the official Roblox website\./);
  assert.match(html, /We only see your display name and avatar\./);
  assert.match(html, /Check the image below to see how it works\./);
  assert.match(html, /EkoYıldız securely connects to your Roblox account/);
  assert.match(html, /Your personal profile/);
  assert.match(html, /Permission/);
  assert.match(html, /Description/);
  assert.match(html, /Risk Level/);
  assert.match(html, /Read User ID/);
  assert.match(html, /View your Roblox User ID to know who you are\./);
  assert.match(html, /Read User Profile/);
  assert.match(html, /View your username, display name, user avatar and profile link\./);
  assert.match(html, /Low/);

  // Existing login methods preserved
  assert.match(html, /href="\/auth\/discord"/);
  assert.match(html, /href="\/auth\/roblox"/);
  assert.match(html, /data-view="discord-code"/);
  assert.match(html, /data-view="site-password"/);
  assert.match(html, /data-view="register-one"/);
});

test('Admin Control Center includes Contracts Management (Sözleşmeler Yönetimi) and EkoAI enhancer button', () => {
  const html = renderAdminPage({ username: 'admin', isAdmin: true });

  assert.match(html, /data-admin-nav="contracts"/);
  assert.match(html, /id="adm-contracts"/);
  assert.match(html, /Sözleşmeler Yönetimi/);
  assert.match(html, /EkoAI ile Geliştir/);
  assert.match(html, /enhanceContractWithEkoAI/);
  assert.match(html, /Başkasına Paylaş/);
});

test('Public contract page renders in Times New Roman with mouse e-signature canvas and share controls', () => {
  const rec = contracts.create({
    title: 'KURUMSAL GİZLİLİK VE HİZMET SÖZLEŞMESİ',
    headerSubtitle: 'T.C. İSTANBUL • EKOYILDIZ HUKUK DAİRESİ',
    documentNo: 'EKO-2026/SZL-9999',
    partyOneName: 'EkoYıldız & Sentara Yönetimi',
    partyTwoName: 'Test Muhatap',
    content: 'MADDE 1 — AMAÇ\nİşbu sözleşme resmi hükümler içerir.',
    status: 'PENDING',
  });

  const html = renderPublicContractPage(rec, null);
  assert.match(html, /Times New Roman/);
  assert.match(html, /KURUMSAL GİZLİLİK VE HİZMET SÖZLEŞMESİ/);
  assert.match(html, /EKO-2026\/SZL-9999/);
  assert.match(html, /id="esign-canvas"/);
  assert.match(html, /Başkasına Paylaş/);
  assert.match(html, /submitElectronicSignature/);

  contracts.deleteById(rec._id);
});

test('Contracts API lifecycle: create, EkoAI enhance, public view, mouse e-signature sign, and delete', async () => {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use((req, _res, next) => {
    req.user = { discordId: '1', username: 'AdminEko', isAdmin: true };
    next();
  });
  app.use(contractsRouter);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1. EkoAI Enhance
    const aiRes = await fetch(`${base}/api/admin/contracts/ai-enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'GİZLİLİK PROTOKOLÜ',
        content: 'Moderatörlerin bilgileri gizli tutması hakkında sözleşme.',
        mode: 'expand_formal',
      }),
    });
    const aiData = await aiRes.json();
    assert.equal(aiRes.status, 200);
    assert.equal(aiData.success, true);
    assert.match(aiData.content, /MADDE 1/i);
    assert.ok(aiData.content.length > 200);

    // 2. Create Contract
    const createRes = await fetch(`${base}/api/admin/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: aiData.title,
        documentNo: 'EKO-2026/SZL-7777',
        partyOneName: 'EkoYıldız & Sentara Yönetimi',
        partyTwoName: 'Muhatap Personel',
        content: aiData.content,
      }),
    });
    const createData = await createRes.json();
    assert.equal(createRes.status, 200);
    assert.equal(createData.success, true);
    const contractId = createData.contract._id;

    // 3. Public View GET /sozlesme/:id
    const viewRes = await fetch(`${base}/sozlesme/${contractId}`);
    const viewHtml = await viewRes.text();
    assert.equal(viewRes.status, 200);
    assert.match(viewHtml, /EKO-2026\/SZL-7777/);
    assert.match(viewHtml, /Times New Roman/);

    // 4. Sign with Mouse E-Signature
    const fakeSignaturePng = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='.repeat(3);
    const signRes = await fetch(`${base}/api/contracts/${contractId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signerName: 'Ahmet Yılmaz',
        signerTitle: 'Kıdemli Moderatör',
        signatureData: fakeSignaturePng,
      }),
    });
    const signData = await signRes.json();
    assert.equal(signRes.status, 200);
    assert.equal(signData.success, true);
    assert.equal(signData.contract.status, 'SIGNED');
    assert.ok(signData.contract.signatureHash);

    // 5. Delete Contract
    const delRes = await fetch(`${base}/api/admin/contracts/${contractId}`, {
      method: 'DELETE',
    });
    const delData = await delRes.json();
    assert.equal(delRes.status, 200);
    assert.equal(delData.success, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
