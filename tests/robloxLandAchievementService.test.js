"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ACHIEVEMENTS,
  GUILD_ID,
  handleStreakCommand,
  buildAchievementDmMessage,
  awardEligible,
  _test
} = require("../bot/services/robloxLandAchievementService");
const { buildStaffApplyPayload, handleRobloxDevsInteraction } = require("../bot/services/robloxDevsSetupService");

test("RobloxLand başarım kataloğu 66 benzersiz rolü, rengi ve özel açıklamayı içerir", () => {
  assert.equal(ACHIEVEMENTS.length, 66);
  assert.equal(new Set(ACHIEVEMENTS.map(item => item.name)).size, 66);
  for (const ach of ACHIEVEMENTS) {
    assert.ok(ach.description, `${ach.name} için açıklama bulunamadı!`);
    assert.ok(ach.description.length > 10, `${ach.name} açıklaması çok kısa!`);
  }
  const byName = Object.fromEntries(ACHIEVEMENTS.map(item => [item.name, item]));
  assert.equal(byName["Yalnız Kurt"].color, "#5865F2");
  assert.equal(byName["İlk Kelime"].description, "RobloxLand sohbetine ilk adımını attın ve ilk mesajını gönderdin. Topluluğumuza hoş geldin!");
  assert.equal(byName["Yeni Dev"].description, "RobloxLand ailesinde 1 günü geride bıraktın. Geliştirici yolculuğun resmen başladı!");
  assert.equal(byName["RobloxLand Tarihçisi"].color, "#F1C40F");
  assert.equal(byName["Ölümsüz Dev"].color, "#FFD700");
  assert.ok(byName["Makine"]);
  assert.ok(byName["Sessiz Takipçi"]);
});

test("buildAchievementDmMessage her başarımın kendine özel açıklamasını içerir", () => {
  const single = buildAchievementDmMessage([
    { name: "İlk Kelime", description: "RobloxLand sohbetine ilk adımını attın." }
  ]);
  assert.match(single, /Tebrikler!/);
  assert.match(single, /İlk Kelime/);
  assert.match(single, /RobloxLand sohbetine ilk adımını attın\./);

  const multiple = buildAchievementDmMessage([
    { name: "İlk Kelime", description: "İlk mesajını gönderdin." },
    { name: "Yeni Dev", description: "1 günü geride bıraktın." }
  ]);
  assert.match(multiple, /2 yeni gizli başarım açtın/);
  assert.match(multiple, /İlk Kelime/);
  assert.match(multiple, /İlk mesajını gönderdin\./);
  assert.match(multiple, /Yeni Dev/);
  assert.match(multiple, /1 günü geride bıraktın\./);
});

test("awardEligible bir kez kazanılan başarımı mükerrer olarak vermez ve DM spamını engeller", async () => {
  const dmSent = [];
  const rolesAdded = [];
  const mockMember = {
    id: "test-user-award-1",
    guild: {
      id: GUILD_ID,
      roles: {
        cache: new Map(),
        create: async opts => ({ id: `role_${opts.name}`, name: opts.name })
      }
    },
    roles: {
      cache: new Map(),
      add: async (role, reason) => { rolesAdded.push(role.name); }
    },
    joinedTimestamp: Date.now() - 2 * 86400000, // 2 days ago (qualifies for Yeni Dev)
    send: async msg => { dmSent.push(msg); }
  };

  const fakeData = { users: {}, channels: {}, messages: {} };
  const p = _test.blankProgress("test-user-award-1");
  p.chat.messages = 5; // qualifies for İlk Kelime

  // 1. Çalıştırma: İlk Kelime ve Yeni Dev kazanılmalı
  const firstWon = await awardEligible(mockMember, p, fakeData);
  assert.deepEqual(firstWon, ["İlk Kelime", "Yeni Dev"]);
  assert.equal(dmSent.length, 1);
  assert.match(dmSent[0], /İlk Kelime/);
  assert.match(dmSent[0], /Yeni Dev/);

  // 2. Çalıştırma (Hemen ardından veya tick sırasında): Tekrar tetiklenmemeli, 0 DM atılmalı!
  const secondWon = await awardEligible(mockMember, p, fakeData);
  assert.deepEqual(secondWon, []);
  assert.equal(dmSent.length, 1, "Mükerrer DM gönderilmemeli!");
});

test("streak yalnızca ardışık takvim günlerinde büyür ve boşlukta sıfırlanır", () => {
  const p = _test.blankProgress("123");
  _test.updateStreak(p, "2026-08-29");
  assert.equal(p.streak.current, 1);
  _test.updateStreak(p, "2026-08-30");
  assert.equal(p.streak.current, 2);
  _test.updateStreak(p, "2026-08-30");
  assert.equal(p.streak.current, 2, "aynı gün ikinci kez ilerlememeli");
  _test.updateStreak(p, "2026-09-02");
  assert.equal(p.streak.current, 1);
  assert.equal(p.streak.longest, 2);
});

test("kısa/caps ve emoji yardımcıları spam koşullarını doğru ayırır", () => {
  assert.equal(_test.isCapsHeavy("BU MESAJ GERÇEKTEN BÜYÜK"), true);
  assert.equal(_test.isCapsHeavy("Normal bir sohbet mesajı"), false);
  assert.equal(_test.emojiCount("Selam 😀 <:eko:123456789012345678> 🚀"), 3);
});

test("e!streak sadece RobloxLand'de Components V2 durum kartı döndürür", async () => {
  let payload;
  const handled = await handleStreakCommand({
    guild: { id: GUILD_ID },
    author: { id: "test-streak-user", username: "Test" },
    content: "e!streak",
    reply: async value => { payload = value; }
  });
  assert.equal(handled, true);
  assert.ok(payload.flags);
  const text = payload.components[0].components[0].content;
  assert.match(text, /Güncel seri/);
  assert.match(text, /Rutin DM gönderilmez/);
});

test("yetkili alım paneli mülakat aşamasını anlatır", () => {
  const payload = buildStaffApplyPayload();
  const components = payload.components[0].components;
  assert.match(components[0].content, /mülakata/i);
  assert.match(components[0].content, /beş soruluk/i);
  assert.equal(components.at(-1).components[0].custom_id, "robloxland_staff_apply");
});

test("alım sorumlusu adaya mülakat daveti gönderebilir", async () => {
  let dmPayload;
  let replyPayload;
  const interaction = {
    customId: "robloxland_staff_interview_123456789012345678",
    isRepliable: () => true,
    isButton: () => true,
    isModalSubmit: () => false,
    member: { roles: { cache: { has: () => true } }, permissions: { has: () => false } },
    user: { id: "999999999999999999" },
    guild: { ownerId: "111111111111111111" },
    client: { users: { fetch: async () => ({ send: async p => { dmPayload = p; } }) } },
    reply: async p => { replyPayload = p; }
  };
  const handled = await handleRobloxDevsInteraction(interaction);
  assert.equal(handled, true);
  assert.match(replyPayload.content, /mülakat daveti/i);
  const button = dmPayload.components[0].components.at(-1).components[0];
  assert.equal(button.custom_id, "robloxland_interview_start_123456789012345678");
});
