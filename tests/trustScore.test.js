'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const UserTrustScore = require('../models/UserTrustScore');
const ModPerformance = require('../models/ModPerformance');
const { collections } = require('../models/Store');
const {
  updateTrustScore,
  addModPoints,
  checkModAbuseLimit,
  incrementAfProgress,
  scanVoiceChannels
} = require('../bot/services/security/trustScoreService');

/**
 * Factory function creating a fresh isolated mock client per test instance.
 */
function createFakeClient(overrides = {}) {
  return {
    users: {
      fetch: async (id) => ({
        id,
        username: `testuser_${id}`,
        createdTimestamp: Date.now() - (365 * 24 * 60 * 60 * 1000), // 1 year old
        displayAvatarURL: () => "http://avatar.url",
        ...(overrides.user || {})
      })
    },
    guilds: {
      fetch: async () => ({
        id: "1367646464804655104",
        roles: {
          everyone: { id: "everyone_role" },
          cache: {
            find: () => ({ id: "role_123" }),
            has: () => true
          },
          create: async () => ({ id: "role_123" })
        },
        members: {
          fetch: async () => ({
            id: "member_123",
            premiumSince: new Date(),
            roles: {
              cache: {
                has: () => false
              },
              add: async () => {},
              remove: async () => {}
            }
          })
        },
        channels: {
          cache: {
            values: () => []
          },
          create: async () => ({
            id: "chan_999",
            send: async () => ({
              id: "msg_999",
              pin: async () => {}
            })
          }),
          fetch: async () => ({
            id: "chan_999",
            send: async () => ({
              id: "msg_999",
              pin: async () => {}
            }),
            messages: {
              fetch: async () => ({
                id: "msg_999",
                edit: async () => {}
              })
            }
          })
        }
      })
    }
  };
}

describe('TrustScoreService Suite (Refactored for Isolation & Readability)', () => {
  beforeEach(async () => {
    // Test İzolasyonu: Her test öncesi veri mağazasını temizle
    if (collections.userTrustScores?.data) collections.userTrustScores.data.clear();
    if (collections.modPerformances?.data) collections.modPerformances.data.clear();
  });

  afterEach(async () => {
    // Test İzolasyonu: Her test sonrası veri mağazasını temizle
    if (collections.userTrustScores?.data) collections.userTrustScores.data.clear();
    if (collections.modPerformances?.data) collections.modPerformances.data.clear();
  });

  describe('updateTrustScore()', () => {
    it('UserTrustScore DB dokümanı oluşturulmalı ve puan hesaplamaları doğru eklenmeli', async () => {
      const fakeClient = createFakeClient();
      const userId = `user_${Math.floor(Math.random() * 1000000)}`;

      await updateTrustScore(userId, 10.0, "Test Ekleme", "operator_123", fakeClient);

      const doc = await UserTrustScore.findOne({ userId });
      assert.ok(doc, 'UserTrustScore dokümanı başarıyla oluşturulmalı');
      assert.ok(doc.trustScore > 100.0, 'Hesap yaşı bonusları ve eklenen puan doğru eklenmeli');
    });
  });

  describe('addModPoints()', () => {
    it('ModPerformance dokümanı oluşturulmalı ve ödül puanı eklenmeli', async () => {
      const modId = `mod_${Math.floor(Math.random() * 1000000)}`;

      await addModPoints(modId, 2.5, "Mod İşlem: Yasakla");

      const doc = await ModPerformance.findOne({ moderatorId: modId });
      assert.ok(doc, 'ModPerformance dokümanı oluşturulmalı');
      assert.equal(doc.points, 2.5, 'Moderatör puanı eklenmeli');
      assert.equal(doc.actionsCount, 1);
    });
  });

  describe('checkModAbuseLimit()', () => {
    it('1 saat içinde seri manuel değişiklik yapıldığında suistimal limitini tespit etmeli', async () => {
      const fakeClient = createFakeClient();
      const userId = `user_${Math.floor(Math.random() * 1000000)}`;
      const modId = "mod_abuse_tester";

      // 1. Manuel düzenleme
      await updateTrustScore(userId, 5.0, "Manuel Düzenleme: Test 1", modId, fakeClient);
      let isExceeded = await checkModAbuseLimit(modId, userId);
      assert.equal(isExceeded, false, '1. değişiklikte suistimal limiti aşılmamalı');

      // 2. Manuel düzenleme
      await updateTrustScore(userId, 5.0, "Manuel Düzenleme: Test 2", modId, fakeClient);
      isExceeded = await checkModAbuseLimit(modId, userId);
      assert.equal(isExceeded, true, '1 saat içindeki 2. değişiklikte suistimal limiti aşılmalı');
    });
  });

  describe('incrementAfProgress()', () => {
    it('Ceza Bitirme Görevi (Af Progress) 20 mesaj gönderildiğinde tamamlanan günü artırmalı', async () => {
      const fakeClient = createFakeClient();
      const userId = `user_${Math.floor(Math.random() * 1000000)}`;

      // Puanı < 50 yaparak Af görevini aktif et
      await updateTrustScore(userId, -70.0, "Büyük Ceza", "SYSTEM", fakeClient);

      let doc = await UserTrustScore.findOne({ userId });
      assert.equal(doc.afProgress.active, true, 'Puan < 50 olduğunda Af görevi aktifleşmeli');

      // 20 mesaj gönderimini paralel / optimize akışla simüle et
      await Promise.all(
        Array.from({ length: 20 }, () => incrementAfProgress(userId, fakeClient))
      );

      doc = await UserTrustScore.findOne({ userId });
      assert.equal(doc.afProgress.daysCompleted, 1, '20 mesaj sonrası tamamlanan gün 1 olmalı');
    });
  });

  describe('scanVoiceChannels() Inactivity Decay', () => {
    it('Aktif olunmayan süre boyunca inaktiflik puan düşüşünü uygulamalı', async () => {
      const fakeClient = createFakeClient();
      const userId = `user_${Math.floor(Math.random() * 1000000)}`;

      await updateTrustScore(userId, 50.0, "Giriş Puanı", "SYSTEM", fakeClient);

      let doc = await UserTrustScore.findOne({ userId });
      assert.ok(doc.trustScore > 100.0);

      // Son aktiflik tarihini 31 gün geriye al
      doc.lastActiveTimestamp = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      await doc.save();

      // Sesli kanal taramasını ve inaktiflik düşüş kontrolünü tetikle
      await scanVoiceChannels(fakeClient);

      doc = await UserTrustScore.findOne({ userId });
      assert.ok(doc.trustScore < 165.0, 'İnaktiflik düşüşü güven puanını azaltmalı');
    });
  });
});
