"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ACHIEVEMENTS,
  GUILD_ID,
  handleStreakCommand,
  _test
} = require("../bot/services/robloxLandAchievementService");
const { buildStaffApplyPayload, handleRobloxDevsInteraction } = require("../bot/services/robloxDevsSetupService");

test("RobloxLand başarım kataloğu 66 benzersiz rolü ve verilen renkleri içerir", () => {
  assert.equal(ACHIEVEMENTS.length, 66);
  assert.equal(new Set(ACHIEVEMENTS.map(item => item.name)).size, 66);
  const byName = Object.fromEntries(ACHIEVEMENTS.map(item => [item.name, item]));
  assert.equal(byName["Yalnız Kurt"].color, "#5865F2");
  assert.equal(byName["RobloxLand Tarihçisi"].color, "#F1C40F");
  assert.equal(byName["Ölümsüz Dev"].color, "#FFD700");
  assert.ok(byName["Makine"]);
  assert.ok(byName["Sessiz Takipçi"]);
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
