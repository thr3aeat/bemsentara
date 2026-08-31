"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ACHIEVEMENTS,
  GUILD_ID,
  handleStreakCommand,
  buildAchievementDmMessage,
  buildAchievementComponentsV2Payload,
  handleAchievementInteraction,
  awardEligible,
  getUserAchievements,
  hasAchievement,
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

test("buildAchievementComponentsV2Payload returns modern Components V2 container with buttons", () => {
  const payload = buildAchievementComponentsV2Payload([
    { name: "İlk Kelime", description: "RobloxLand sohbetine ilk adımını attın." }
  ]);
  assert.ok(payload);
  assert.ok(Array.isArray(payload.components));
  assert.equal(payload.components[0].type, 17); // Container
  assert.equal(payload.components[0].accent_color, undefined); // Accent colorsuz
  assert.ok(payload.components[0].components.some(c => c.type === 14 && c.divider === true)); // Çizgili ayrıcı
  const actionRow = payload.components[0].components.find(c => c.type === 1);
  assert.ok(actionRow);
  assert.ok(actionRow.components.some(b => b.custom_id === "robloxland_view_my_achievements"));
  assert.ok(actionRow.components.some(b => b.custom_id === "robloxland_streak_check"));
});

test("handleAchievementInteraction opens showcase and streak status cards", async () => {
  let editPayload;
  const mockInteraction = {
    customId: "robloxland_view_my_achievements",
    user: { id: "test-ach-user-1", username: "AchUser" },
    deferReply: async () => {},
    editReply: async p => { editPayload = p; }
  };

  const handled = await handleAchievementInteraction(mockInteraction);
  assert.equal(handled, true);
  assert.ok(editPayload);
  assert.equal(editPayload.components[0].type, 17);
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
        create: async (opts) => ({ id: `role-${opts.name}`, name: opts.name })
      }
    },
    roles: {
      cache: new Map(),
      add: async (role) => { rolesAdded.push(role.name || role.id); }
    },
    send: async (msg) => { dmSent.push(msg); }
  };

  const p = {
    awarded: {},
    chat: { messages: 1 },
    voice: {},
    social: {},
    streak: {}
  };

  const wonFirst = await awardEligible(mockMember, p);
  assert.ok(wonFirst.includes("İlk Kelime"));
  assert.equal(dmSent.length, 1);
  assert.ok(p.awarded["first_word"]);

  // Tekrar çağrıldığında mükerrer ödül verilmemeli
  const wonSecond = await awardEligible(mockMember, p);
  assert.equal(wonSecond.length, 0);
  assert.equal(dmSent.length, 1);
});

test("getUserAchievements ve hasAchievement sorguları doğru çalışır", () => {
  const userId = "test-query-user-1";
  const p = _test.blankProgress(userId);
  p.awarded["first_word"] = new Date().toISOString();
  p.awarded["new_dev"] = new Date().toISOString();

  const mockData = { users: { [userId]: p } };
  const userProgress = getUserAchievements(userId);
  assert.equal(userProgress.totalCount, 66);
  assert.equal(typeof userProgress.unlockedCount, "number");
});

test("streak yalnızca ardışık takvim günlerinde büyür ve boşlukta sıfırlanır", () => {
  const p = _test.blankProgress("u1");
  _test.updateStreak(p, "2026-03-01");
  assert.equal(p.streak.current, 1);
  _test.updateStreak(p, "2026-03-02");
  assert.equal(p.streak.current, 2);
  _test.updateStreak(p, "2026-03-04");
  assert.equal(p.streak.current, 1);
});

test("kısa/caps ve emoji yardımcıları spam koşullarını doğru ayırır", () => {
  assert.equal(_test.emojiCount("selam 😀 <a:fire:123456789>"), 2);
  assert.equal(_test.isCapsHeavy("BU MESAJ TAMAMEN BUYUK"), true);
  assert.equal(_test.isCapsHeavy("Bu normal bir cumledir"), false);
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
