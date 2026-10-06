const crypto = require('crypto');
const User = require('../../models/User');
const ComponentsV2Factory = require('../../bot/utils/componentsV2Factory');

class DiscordDmAuthError extends Error {
  constructor(message, statusCode = 400, code = 'DM_AUTH_ERROR') {
    super(message);
    this.name = 'DiscordDmAuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function normalize(value) {
  return String(value || '').replace(/^@/, '').trim().toLocaleLowerCase('tr-TR');
}

function createDiscordDmAuthService({
  clientProvider,
  allowedGuildIds = [],
  userRepo = User,
  clock = () => Date.now(),
  randomInt = (min, max) => crypto.randomInt(min, max),
  hashSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
} = {}) {
  const hashCode = (code, targetId) => crypto.createHmac('sha256', hashSecret).update(`${targetId}:${code}`).digest('hex');

  async function client() {
    const value = await clientProvider();
    if (!value || !value.isReady?.()) throw new DiscordDmAuthError('Discord botu şu anda hazır değil.', 503, 'BOT_UNAVAILABLE');
    return value;
  }

  async function allowedGuilds(discordClient) {
    const guilds = [];
    for (const id of [...new Set(allowedGuildIds.filter(Boolean).map(String))]) {
      const guild = await discordClient.guilds.fetch(id).catch(() => null);
      if (guild) guilds.push(guild);
    }
    return guilds;
  }

  async function resolveMember(identifier) {
    const wanted = normalize(identifier);
    if (!wanted) throw new DiscordDmAuthError('Discord kullanıcı adı veya ID gerekli.', 400, 'IDENTIFIER_REQUIRED');
    const discordClient = await client();
    const guilds = await allowedGuilds(discordClient);
    if (/^\d{17,20}$/.test(wanted)) {
      for (const guild of guilds) {
        const found = await guild.members.fetch(wanted).catch(() => null);
        if (found) return found;
      }
      throw new DiscordDmAuthError('Bu Discord hesabı yetkili topluluk sunucularında bulunamadı.', 403, 'NOT_IN_ALLOWED_GUILD');
    }

    const unique = new Map();
    for (const guild of guilds) {
      const members = await guild.members.fetch().catch(() => null);
      if (!members) continue;
      for (const item of members.values ? members.values() : members) unique.set(String(item.id || item.user?.id), item);
    }
    const all = [...unique.values()];
    const exact = all.filter((item) => normalize(item.user?.username) === wanted);
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) throw new DiscordDmAuthError('Bu kullanıcı adı birden fazla üyeyle eşleşiyor. Discord ID kullanın.', 409, 'AMBIGUOUS_IDENTIFIER');
    const secondary = all.filter((item) => [item.user?.globalName, item.nickname].some((name) => normalize(name) === wanted));
    if (secondary.length === 1) return secondary[0];
    if (secondary.length > 1) throw new DiscordDmAuthError('Bu görünen ad birden fazla üyeyle eşleşiyor. Discord ID kullanın.', 409, 'AMBIGUOUS_IDENTIFIER');
    throw new DiscordDmAuthError('Bu kullanıcı yetkili topluluk sunucularında bulunamadı.', 403, 'NOT_IN_ALLOWED_GUILD');
  }

  function clear(session) {
    delete session.applicationDmAuth;
  }

  return {
    async requestCode({ identifier, session, ip }) {
      if (!session || typeof session !== 'object') throw new DiscordDmAuthError('Oturum oluşturulamadı.', 400, 'SESSION_REQUIRED');
      const now = clock();
      if (session.applicationDmAuthRequestAt && now - session.applicationDmAuthRequestAt < 30000) {
        throw new DiscordDmAuthError('Yeni kod istemeden önce kısa bir süre bekleyin.', 429, 'REQUEST_COOLDOWN');
      }
      const resolved = await resolveMember(identifier);
      const code = String(randomInt(100000, 1000000)).padStart(6, '0').slice(-6);
      session.applicationDmAuthRequestAt = now;
      session.applicationDmAuth = {
        codeHash: hashCode(code, resolved.user.id),
        targetId: String(resolved.user.id),
        username: resolved.user.username,
        expiresAt: now + 5 * 60 * 1000,
        failCount: 0,
        requestedFromIp: String(ip || ''),
        verifyAfter: 0
      };
      try {
        await resolved.user.send(ComponentsV2Factory.buildDmLoginCode(code));
      } catch (_) {
        clear(session);
        throw new DiscordDmAuthError('Discord özel mesajı gönderilemedi. DM ayarlarınızı açıp tekrar deneyin.', 400, 'DM_CLOSED');
      }
      return { targetId: String(resolved.user.id), expiresAt: now + 5 * 60 * 1000 };
    },

    async verifyCode({ code, session, ip }) {
      const state = session?.applicationDmAuth;
      if (!state) throw new DiscordDmAuthError('Önce yeni bir Discord DM kodu isteyin.', 400, 'CODE_REQUIRED');
      const now = clock();
      if (state.verifyAfter && now < state.verifyAfter) throw new DiscordDmAuthError('Kod denemeleri arasında kısa bir süre bekleyin.', 429, 'VERIFY_COOLDOWN');
      if (now > state.expiresAt) {
        clear(session);
        throw new DiscordDmAuthError('Doğrulama kodunun süresi doldu. Yeni kod isteyin.', 400, 'CODE_EXPIRED');
      }
      const candidate = String(code || '').trim();
      const expected = Buffer.from(state.codeHash, 'hex');
      const actual = Buffer.from(hashCode(candidate, state.targetId), 'hex');
      const valid = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
      if (!valid) {
        state.failCount += 1;
        state.verifyAfter = now + 750;
        if (state.failCount >= 3) {
          clear(session);
          throw new DiscordDmAuthError('Üç hatalı deneme nedeniyle kod iptal edildi. Yeni kod isteyin.', 429, 'LOCKED');
        }
        throw new DiscordDmAuthError('Doğrulama kodu hatalı.', 400, 'INVALID_CODE');
      }

      let portalUser = await userRepo.findOne({ discordId: state.targetId });
      if (portalUser?.isBanned) {
        clear(session);
        throw new DiscordDmAuthError('Bu hesabın site erişimi kısıtlanmış.', 403, 'USER_BANNED');
      }
      if (!portalUser) {
        portalUser = await userRepo.create({ discordId: state.targetId, discordUsername: state.username, username: state.username, isAuthorized: true });
      }
      const discordUser = { id: state.targetId, username: state.username };
      clear(session);
      return { discordUser, user: portalUser, ip: String(ip || '') };
    },

    resolveMember
  };
}

module.exports = { createDiscordDmAuthService, DiscordDmAuthError };
