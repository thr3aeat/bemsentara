'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const rewardBoxService = require('../server/services/rewardBoxService');
const { renderProfilePage } = require('../server/views/profilePage');

test('rewardBoxService - ödül kutusu ve çark sistemi', async (t) => {
  const testUserId = 'test_user_rewards_' + Date.now();

  await t.test('başlangıçta varsayılan hak durumunu dönmeli', async () => {
    const status = await rewardBoxService.getUserRewardsStatus(testUserId);
    assert.ok(typeof status.availableBoxes === 'number');
    assert.ok(typeof status.availableSpins === 'number');
    assert.equal(status.isGuest, false);
  });

  await t.test('kullanıcıya görev/ticket kutusu verildiğinde başarı dönmeli', async () => {
    const awardRes = await rewardBoxService.awardBoxToUser(testUserId, 'Ticket Çözümü');
    assert.equal(awardRes, true);

    const status = await rewardBoxService.getUserRewardsStatus(testUserId);
    assert.ok(status.availableBoxes >= 1);
    assert.ok(status.availableSpins >= 1);
  });

  await t.test('kutu açıldığında geçerli bir ödül vermeli', async () => {
    const openRes = await rewardBoxService.openBoxForUser(testUserId);
    assert.ok(openRes.reward);
    assert.ok(openRes.reward.name);
    assert.ok(openRes.reward.rarity);
    assert.ok(openRes.reward.icon);
  });

  await t.test('çark çevrildiğinde geçerli bir dilim ödülü vermeli', async () => {
    const spinRes = await rewardBoxService.spinWheelForUser(testUserId);
    assert.ok(spinRes.slice);
    assert.ok(spinRes.slice.label);
    assert.ok(typeof spinRes.sliceIndex === 'number');
    assert.ok(spinRes.sliceIndex >= 0 && spinRes.sliceIndex < 8);
  });
});

test('renderProfilePage - Liquid Glass ve Gelişmiş Profil Görünümü', async (t) => {
  const dummyUser = {
    discordId: '123456789012345678',
    username: 'ekotest',
    discordUsername: 'EkoTester',
    profileColor: '#7c6af7',
    profileBio: 'Gelişmiş profil test biyografisi',
  };

  const mockLayout = (title, user, content) => {
    return `<!DOCTYPE html><html><head><title>${title}</title></head><body>${content}</body></html>`;
  };

  const html = renderProfilePage(dummyUser, dummyUser, true, [], mockLayout);

  await t.test('HTML geçerli bir string dönmeli', () => {
    assert.equal(typeof html, 'string');
    assert.ok(html.length > 500);
  });

  await t.test('Liquid Glass stillerini barındırmalı', () => {
    assert.ok(html.includes('eff-liquid'));
    assert.ok(html.includes('frm-liquid'));
    assert.ok(html.includes('eff-matrix'));
    assert.ok(html.includes('eff-cosmic'));
    assert.ok(html.includes('liquidWobble'));
  });

  await t.test('Kutu Açma & Çark sekmelerini ve minigame alanlarını içermeli', () => {
    assert.ok(html.includes('Kutu Aç'));
    assert.ok(html.includes('tab-rewards'));
    assert.ok(html.includes('chest-stage'));
    assert.ok(html.includes('btnOpenBox'));
    assert.ok(html.includes('boxRevealModal'));
    assert.ok(html.includes('wheel-disc'));
    assert.ok(html.includes('btnSpinWheel'));
  });

  await t.test('Envanter, Efektler ve Görev sekmelerini içermeli', () => {
    assert.ok(html.includes('tab-inventory'));
    assert.ok(html.includes('tab-staff'));
    assert.ok(html.includes('p-inv-grid'));
  });
});
