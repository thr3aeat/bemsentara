'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FORUM_CATEGORY_ID,
  FORUM_CATEGORIES,
  REACTION_PACKS,
  buildForumSetupPayload,
  handleThreadCreate,
  handleForumInteraction,
  isOwnerOrStaff
} = require('../bot/services/robloxLandForumService');

test('buildForumSetupPayload generates Components V2 container with Category and Reaction select menus', () => {
  const mockThread = { id: 'thread-test-1', name: 'Harika Bir Oyun Yaptım' };
  const payload = buildForumSetupPayload(mockThread, 'user-12345');

  assert.ok(payload);
  assert.ok(Array.isArray(payload.components));
  assert.equal(payload.components[0].type, 17); // Container
  assert.equal(payload.components[0].accent_color, undefined); // Accent colorsuz
  assert.ok(payload.components[0].components.some(c => c.type === 14 && c.divider === true)); // Çizgili

  // StringSelectMenu for Categories
  const catRow = payload.components[0].components.find(c => c.type === 1 && c.components?.[0]?.custom_id?.includes('forum_category_'));
  assert.ok(catRow);
  assert.equal(catRow.components[0].options.length, FORUM_CATEGORIES.length);

  // StringSelectMenu for Reactions
  const reactRow = payload.components[0].components.find(c => c.type === 1 && c.components?.[0]?.custom_id?.includes('forum_reaction_'));
  assert.ok(reactRow);
  assert.equal(reactRow.components[0].options.length, REACTION_PACKS.length);

  // ActionRow buttons (Rename and Finish)
  const btnRow = payload.components[0].components.find(c => c.type === 1 && c.components?.[0]?.custom_id?.includes('forum_rename_'));
  assert.ok(btnRow);
  assert.ok(btnRow.components.some(b => b.custom_id.includes('forum_finish_')));
});

test('handleThreadCreate sends setup card only for threads inside category 1538475901778530324', async () => {
  let sentPayload = null;

  const mockTargetThread = {
    id: 'thread-target-1',
    name: 'Benim Roblox Oyunum',
    ownerId: 'author-123',
    guild: { id: '1537407325290237973', ownerId: 'guild-owner-1' },
    parent: { id: 'forum-chan-1', parentId: FORUM_CATEGORY_ID },
    send: async (p) => { sentPayload = p; }
  };

  const handled = await handleThreadCreate(mockTargetThread, true);
  assert.equal(handled, true);
  assert.ok(sentPayload);
  assert.match(sentPayload.components[0].components[0].content, /HOŞ GELDİNİZ/);

  // Farklı kategorideki thread için gönderilmemeli
  const mockOtherThread = {
    id: 'thread-other-1',
    guild: { id: '1537407325290237973' },
    parent: { id: 'other-chan', parentId: '999999999999999999' },
    send: async () => {}
  };

  const ignored = await handleThreadCreate(mockOtherThread, true);
  assert.equal(ignored, false);
});

test('handleForumInteraction allows category selection and updates thread title with prefix', async () => {
  let replyMsg = '';
  let updatedTitle = '';

  const mockThread = {
    id: 'thread-mod-1',
    name: 'Oyunuma Senarist Arıyorum',
    ownerId: 'user-author-1',
    isThread: true,
    setName: async (t) => { updatedTitle = t; }
  };

  const mockInteraction = {
    customId: 'robloxland_forum_category_thread-mod-1',
    values: ['arkadas'],
    member: { id: 'user-author-1' }, // Konu sahibi
    channel: mockThread,
    deferReply: async () => {},
    editReply: async (opts) => { replyMsg = opts.content; }
  };

  const handled = await handleForumInteraction(mockInteraction);
  assert.equal(handled, true);
  assert.match(replyMsg, /Arkadaş & Ekip Arama/);
  assert.equal(updatedTitle, '[👥 Ekip Arama] Oyunuma Senarist Arıyorum');
});

test('handleForumInteraction allows main and subtitle editing via modal and cleans up message', async () => {
  let replyMsg = '';
  let updatedTitle = '';
  let deletedMsg = false;

  const mockThread = {
    id: 'thread-sub-1',
    name: '[🚀 Proje] Anime Defenders Ticaret',
    ownerId: 'user-author-1',
    isThread: true,
    setName: async (t) => { updatedTitle = t; }
  };

  const mockModalInteraction = {
    customId: 'robloxland_forum_modal_rename_thread-sub-1',
    member: { id: 'user-author-1' },
    channel: mockThread,
    message: {
      delete: async () => { deletedMsg = true; }
    },
    fields: {
      getTextInputValue: (field) => {
        if (field === 'main_title') return 'Anime Defenders Ticaret & Satış';
        if (field === 'sub_title') return 'Geliştirici Aranıyor • 100K Ziyaret';
        return '';
      }
    },
    client: { user: { id: 'bot-123' } },
    deferReply: async () => {},
    editReply: async (opts) => { replyMsg = opts.content; }
  };

  const handled = await handleForumInteraction(mockModalInteraction);
  assert.equal(handled, true);
  assert.match(replyMsg, /Alt Başlığı Güncellendi/);
  assert.equal(updatedTitle, '[🚀 Proje] Anime Defenders Ticaret & Satış — Geliştirici Aranıyor • 100K Ziyaret');
});

test('handleForumInteraction finish button confirms and deletes setup card', async () => {
  let replyMsg = '';
  let deletedMsg = false;

  const mockThread = {
    id: 'thread-fin-1',
    ownerId: 'user-author-1',
    isThread: true
  };

  const mockInteraction = {
    customId: 'robloxland_forum_finish_thread-fin-1',
    member: { id: 'user-author-1' },
    channel: mockThread,
    message: {
      delete: async () => { deletedMsg = true; }
    },
    client: { user: { id: 'bot-123' } },
    reply: async (opts) => { replyMsg = opts.content; }
  };

  const handled = await handleForumInteraction(mockInteraction);
  assert.equal(handled, true);
  assert.match(replyMsg, /Forum düzenlemeniz tamamlandı/);
});

test('unauthorized users cannot edit forum thread settings', async () => {
  let replyMsg = '';
  let replyEphemeral = false;

  const mockThread = {
    id: 'thread-lock-1',
    ownerId: 'real-author-1',
    isThread: true
  };

  const mockNonAuthorInteraction = {
    customId: 'robloxland_forum_lock_thread-lock-1',
    member: {
      id: 'random-user-2',
      permissions: { has: () => false },
      roles: { cache: new Map() }
    },
    channel: mockThread,
    reply: async (opts) => {
      replyMsg = opts.content;
      replyEphemeral = opts.ephemeral;
    }
  };

  await handleForumInteraction(mockNonAuthorInteraction);
  assert.ok(replyMsg.includes('yalnızca gönderi sahibi veya RobloxLand yetkilileri'));
  assert.equal(replyEphemeral, true);
});
