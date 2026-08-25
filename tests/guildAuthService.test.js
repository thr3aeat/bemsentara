const test = require('node:test');
const assert = require('node:assert/strict');
const { isGuildAuthorized, handleUnauthorizedGuild, auditAllGuilds, EKO_USER_ID } = require('../bot/services/guildAuthService');

test('guildAuthService: EKO_USER_ID constant is 1031620522406072350', () => {
  assert.equal(EKO_USER_ID, '1031620522406072350');
});

test('guildAuthService: allows guild if Eko is in members cache', async () => {
  const mockGuild = {
    id: 'guild_with_eko',
    name: 'Eko Official Guild',
    members: {
      cache: new Map([[EKO_USER_ID, { id: EKO_USER_ID }]]),
      fetch: async () => ({ id: EKO_USER_ID })
    }
  };

  const authorized = await isGuildAuthorized(mockGuild);
  assert.equal(authorized, true, 'Guild should be authorized when Eko is in cache');
});

test('guildAuthService: allows guild if Eko is fetched via API', async () => {
  const mockGuild = {
    id: 'guild_with_eko_fetch',
    name: 'Eko Official Guild 2',
    members: {
      cache: new Map(),
      fetch: async (id) => {
        if (id === EKO_USER_ID) return { id: EKO_USER_ID };
        return null;
      }
    }
  };

  const authorized = await isGuildAuthorized(mockGuild);
  assert.equal(authorized, true, 'Guild should be authorized when Eko is fetched');
});

test('guildAuthService: blocks guild, DMs owner with exact message and leaves guild if Eko is NOT present', async () => {
  let dmSentMessage = null;
  let leftGuild = false;

  const mockOwner = {
    id: 'owner_123',
    user: { tag: 'Owner#0001' },
    send: async (payload) => {
      dmSentMessage = payload;
      return true;
    }
  };

  const mockGuild = {
    id: 'unauthorized_guild_999',
    name: 'Yabancı Sunucu',
    ownerId: 'owner_123',
    members: {
      cache: new Map(),
      fetch: async () => null,
      me: { permissions: { has: () => true } }
    },
    fetchOwner: async () => mockOwner,
    leave: async () => {
      leftGuild = true;
    },
    client: {
      user: { displayAvatarURL: () => 'https://example.com/avatar.png' }
    }
  };

  const authorized = await isGuildAuthorized(mockGuild);
  assert.equal(authorized, false, 'Guild should be unauthorized');
  assert.equal(leftGuild, true, 'Bot should leave unauthorized guild');
  assert.ok(dmSentMessage, 'DM should be sent to owner');
  assert.ok(
    dmSentMessage.content.includes('Merhaba, **Yabancı Sunucu** adlı sunucuya eklendiğim için teşekkür ederim ancak bu bot Eko Yıldız\'a özeldir. Bu sebeple bu sunucuda herhangi bir komutumu veya sistemimi kullanamazsınız!'),
    'DM should contain exact requested message text'
  );
});

test('guildAuthService: falls back to channel message if owner DM is closed', async () => {
  let channelSentMessage = null;
  let leftGuild = false;

  const mockOwner = {
    id: 'owner_closed_dm',
    user: { tag: 'ClosedDM#0001' },
    send: async () => {
      const err = new Error('Cannot send messages to this user');
      err.code = 50007;
      throw err;
    }
  };

  const mockChannel = {
    name: 'genel',
    isTextBased: () => true,
    permissionsFor: () => ({ has: () => true }),
    send: async (payload) => {
      channelSentMessage = payload;
    }
  };

  const mockGuild = {
    id: 'unauthorized_guild_closed_dm',
    name: 'Kapalı DM Sunucusu',
    ownerId: 'owner_closed_dm',
    members: {
      cache: new Map(),
      fetch: async () => null,
      me: { id: 'bot_id' }
    },
    channels: {
      cache: new Map([['channel_1', mockChannel]])
    },
    fetchOwner: async () => mockOwner,
    leave: async () => {
      leftGuild = true;
    },
    client: {
      user: { displayAvatarURL: () => 'https://example.com/avatar.png' }
    }
  };

  const authorized = await isGuildAuthorized(mockGuild);
  assert.equal(authorized, false);
  assert.equal(leftGuild, true);
  assert.ok(channelSentMessage, 'Channel fallback should have received the warning message');
  assert.ok(channelSentMessage.content.includes('Merhaba, **Kapalı DM Sunucusu** adlı sunucuya eklendiğim için teşekkür ederim'));
});
