const test = require('node:test');
const assert = require('node:assert/strict');

function member(id, username, { globalName = null, nickname = null, send } = {}) {
  return { id, nickname, user: { id, username, globalName, send: send || (async () => {}) } };
}

function harness(membersByGuild, options = {}) {
  let now = options.now || Date.parse('2026-10-02T12:00:00Z');
  const guilds = Object.entries(membersByGuild).map(([id, members]) => ({
    id,
    members: {
      async fetch(target) {
        if (target) return members.find((item) => item.id === target) || null;
        const list = new Map(members.map((item) => [item.id, item]));
        list.find = (fn) => [...list.values()].find(fn);
        return list;
      }
    }
  }));
  const users = new Map();
  const userRepo = {
    async findOne({ discordId }) { return users.get(discordId) || null; },
    async create(data) { const user = { _id: `u-${data.discordId}`, ...data }; users.set(data.discordId, user); return user; }
  };
  const { createDiscordDmAuthService } = require('../server/services/discordDmAuthService');
  return {
    service: createDiscordDmAuthService({
      clientProvider: () => ({ isReady: () => true, guilds: { fetch: async (id) => guilds.find((guild) => guild.id === id) || null } }),
      allowedGuildIds: guilds.map((guild) => guild.id), userRepo,
      clock: () => now, randomInt: options.randomInt || (() => 123456), hashSecret: 'test-secret'
    }),
    advance(ms) { now += ms; }, users
  };
}

test('numeric IDs must resolve as members of an allowed guild', async () => {
  const outside = member('999999999999999999', 'outside');
  const { service } = harness({ guild1: [member('111111111111111111', 'inside')] });
  await assert.rejects(() => service.requestCode({ identifier: outside.id, session: {}, ip: '1' }), (error) => error.code === 'NOT_IN_ALLOWED_GUILD');
  const session = {};
  const result = await service.requestCode({ identifier: '111111111111111111', session, ip: '1' });
  assert.equal(result.targetId, '111111111111111111');
});

test('exact usernames win and ambiguous secondary names are rejected', async () => {
  const { service } = harness({ guild1: [member('1', 'ada', { globalName: 'Ortak' }), member('2', 'deniz', { nickname: 'Ortak' })] });
  assert.equal((await service.requestCode({ identifier: '@ada', session: {}, ip: '1' })).targetId, '1');
  await assert.rejects(() => service.requestCode({ identifier: 'Ortak', session: {}, ip: '2' }), (error) => error.code === 'AMBIGUOUS_IDENTIFIER');
});

test('stores a six-digit hash, replaces codes, expires in five minutes, and locks after three failures', async () => {
  let next = 123456;
  const h = harness({ guild1: [member('1', 'ada')] }, { randomInt: () => next });
  const session = {};
  const first = await h.service.requestCode({ identifier: 'ada', session, ip: '1' });
  assert.equal(first.expiresAt, Date.parse('2026-10-02T12:05:00Z'));
  assert.equal(session.applicationDmAuth.codeHash.includes('123456'), false);
  assert.equal(session.applicationDmAuth.codeHash.length, 64);
  h.advance(31000); next = 654321;
  await h.service.requestCode({ identifier: 'ada', session, ip: '1' });
  await assert.rejects(() => h.service.verifyCode({ code: '123456', session, ip: '1' }), (error) => error.code === 'INVALID_CODE');
  h.advance(1000); await assert.rejects(() => h.service.verifyCode({ code: '000000', session, ip: '1' }), (error) => error.code === 'INVALID_CODE');
  h.advance(1000); await assert.rejects(() => h.service.verifyCode({ code: '000000', session, ip: '1' }), (error) => error.code === 'LOCKED');
  h.advance(1000); await assert.rejects(() => h.service.verifyCode({ code: '654321', session, ip: '1' }), (error) => error.code === 'CODE_REQUIRED');
});

test('successful verification creates the portal user only after verification and expiry/cooldowns are enforced', async () => {
  const h = harness({ guild1: [member('1', 'ada')] });
  const session = {};
  await h.service.requestCode({ identifier: 'ada', session, ip: '1' });
  assert.equal(h.users.size, 0);
  await assert.rejects(() => h.service.requestCode({ identifier: 'ada', session, ip: '1' }), (error) => error.code === 'REQUEST_COOLDOWN');
  const verified = await h.service.verifyCode({ code: '123456', session, ip: '1' });
  assert.equal(verified.user.discordId, '1');
  assert.equal(h.users.size, 1);

  const expiredSession = {};
  h.advance(31000);
  await h.service.requestCode({ identifier: 'ada', session: expiredSession, ip: '2' });
  h.advance(5 * 60 * 1000 + 1);
  await assert.rejects(() => h.service.verifyCode({ code: '123456', session: expiredSession, ip: '2' }), (error) => error.code === 'CODE_EXPIRED');
});

test('login DM is Components v2, accent-free, signed, and includes help link', async () => {
  let payload;
  const h = harness({ guild1: [member('1', 'ada', { send: async (message) => { payload = message; } })] });
  await h.service.requestCode({ identifier: 'ada', session: {}, ip: '1' });
  assert.equal(payload.content, undefined);
  assert.equal(JSON.stringify(payload).includes('accent_color'), false);
  assert.match(JSON.stringify(payload), /123456/);
  assert.match(JSON.stringify(payload), /5 dakika/);
  assert.match(JSON.stringify(payload), /yardim/);
  assert.match(JSON.stringify(payload), /EkoYıldız Güvenlik/);
});

