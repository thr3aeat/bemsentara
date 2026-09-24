'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const trustScoreService = require('../bot/services/security/trustScoreService');
const originalUpdateTrustScore = trustScoreService.updateTrustScore;
trustScoreService.updateTrustScore = async () => undefined;

const User = require('../models/User');
const UserTrustScore = require('../models/UserTrustScore');
const originalUserFindOne = User.findOne;
const originalTrustFindOne = UserTrustScore.findOne;
User.findOne = async () => null;
UserTrustScore.findOne = async () => null;

const {
  detectProfanity,
  processMessageAutomod
} = require('../bot/services/profanityAutomodService');
const { handleAutomodPunishmentButton } = require('../bot/services/automodPunishmentService');

test.after(() => {
  trustScoreService.updateTrustScore = originalUpdateTrustScore;
  User.findOne = originalUserFindOne;
  UserTrustScore.findOne = originalTrustFindOne;
});

test('topluluk içindeki top parçasını küfür olarak algılamaz', () => {
  const text = 'Sythonom Discord topluluğunuzu daha düzenli, güvenli ve profesyonel hale getirir; topluluk büyüdükçe yönetimi kolaylaştırır.';

  assert.equal(detectProfanity(text), null);
  assert.equal(detectProfanity('Komut syntax açıklaması ve Sythonom yapılandırması burada.'), null);
  assert.equal(detectProfanity('Dönen top kırmızıydı.').matched, 'top');
});

test('masum sık kelimesini engellemez, Türkçe ekleri ve ayrılmış kaçınmaları yakalar', () => {
  assert.equal(detectProfanity('Bu kanala çok sık geliyorum.'), null);

  for (const text of ['siktirin', 'ibneler', 'yavşağın', 'gavatlar', 'orospuya', 's.i.k.t.i.r.i.n']) {
    assert.ok(detectProfanity(text), `${text} algılanmalı`);
  }
});

test('yasaklı heceleri içeren normal kelimeleri ihlal saymaz', () => {
  const safeSentences = [
    'Topluluk toplantısı için topoloji ve topaz hakkında konuştuk.',
    'Klasik müzik dinlerken şikayet metnini düzenledim.',
    'Göteborg şehrine yapılan teknik geziyi anlattı.',
    'Piknik için ocak ve gerekli ekipmanları hazırladık.',
    'Mercedes AMG paketini aldık ve SIG Sauer hakkında konuştuk.',
    'Sythonom syntax belgesi topluluk yöneticilerine yöneliktir.'
  ];

  for (const text of safeSentences) {
    assert.equal(detectProfanity(text), null, `Yanlış pozitif: ${text}`);
  }
});

test('yasaklı kelimeye benzeyen ekli normal kelimelerde kök veya ek tahmini yapmaz', () => {
  for (const text of ['Çocuk toplar ile oynuyor.', 'Bu benim topum.', 'Toplar mısınız?']) {
    assert.equal(detectProfanity(text), null, `Tam kelime olmadığı hâlde eşleşti: ${text}`);
  }
});

test('yaygın Türkçe kişi ve geçmiş zaman ekleriyle kullanılan ihlalleri yakalar', () => {
  for (const text of ['ibnesin', 'gavatsın', 'piçsin', 'orospusun', 'siktirsin', 'ibneyim', 'orospuymuş']) {
    assert.ok(detectProfanity(text), `${text} algılanmalı`);
  }
});

test('Yoksay / Affet silinen mesajı ve ekini geri yükler, özür diler ve AutoMod timeoutunu kaldırır', async () => {
  const sentToChannel = [];
  const timeoutCalls = [];
  const deletedMessageIds = [];
  let moderationLogPayload;
  let updatedModerationPayload;

  const member = {
    communicationDisabledUntilTimestamp: null,
    timeout: async (duration, reason) => {
      timeoutCalls.push({ duration, reason });
      member.communicationDisabledUntilTimestamp = duration === null ? null : Date.now() + duration;
    }
  };
  const channel = {
    id: 'channel-1',
    isTextBased: () => true,
    send: async payload => {
      sentToChannel.push(payload);
      return { delete: async () => undefined };
    }
  };
  const guild = {
    id: 'guild-1',
    name: 'EkoYıldız',
    members: { fetch: async () => member },
    channels: { fetch: async id => id === channel.id ? channel : null }
  };
  const logChannel = {
    isTextBased: () => true,
    send: async payload => {
      moderationLogPayload = payload;
      return payload;
    }
  };
  const client = {
    user: {
      id: 'bot-1',
      displayAvatarURL: () => 'https://cdn.example/bot.png'
    },
    channels: { fetch: async () => logChannel },
    guilds: { fetch: async () => guild }
  };
  const author = {
    id: 'user-restore-1',
    bot: false,
    username: 'den',
    displayName: 'den',
    displayAvatarURL: () => 'https://cdn.example/den.png'
  };

  function makeMessage(id, content, attachments = []) {
    return {
      id,
      content,
      author,
      guild,
      channel,
      attachments: new Map(attachments.map((attachment, index) => [String(index), attachment])),
      delete: async () => { deletedMessageIds.push(id); }
    };
  }

  await processMessageAutomod(makeMessage('message-1', 'Dönen top kırmızıydı.'), client);
  const originalContent = 'Bu top için hazırladığım ayrıntılı açıklama ve görsel burada.';
  const attachment = {
    url: 'https://cdn.example/original.png',
    name: 'original.png',
    contentType: 'image/png'
  };
  await processMessageAutomod(makeMessage('message-2', originalContent, [attachment]), client);

  assert.deepEqual(deletedMessageIds, ['message-1', 'message-2']);
  assert.equal(timeoutCalls[0].duration, 15 * 60 * 1000);
  assert.ok(moderationLogPayload, 'İkinci ihlalin moderasyon kartı oluşturulmalı');

  const interaction = {
    customId: 'jail_ignore_guild-1_user-restore-1_channel-1_message-2',
    guild,
    client,
    user: {
      id: 'moderator-1',
      tag: 'mod#0001',
      toString: () => '<@moderator-1>'
    },
    message: { embeds: moderationLogPayload.embeds },
    update: async payload => {
      updatedModerationPayload = payload;
      return payload;
    },
    reply: async payload => payload
  };

  await handleAutomodPunishmentButton(interaction);

  const restored = sentToChannel.find(payload => payload.content === originalContent);
  assert.ok(restored, 'Özgün mesaj içeriği yeniden yayınlanmalı');
  assert.deepEqual(restored.files, [{ attachment: attachment.url, name: attachment.name }]);
  assert.deepEqual(restored.allowedMentions, { parse: [] });

  const apology = sentToChannel.find(payload => /yanlış değerlendirdi/i.test(payload.content || ''));
  assert.ok(apology, 'Kullanıcıdan açıkça özür dilenmeli');
  assert.match(apology.content, /<@user-restore-1>/);
  assert.equal(timeoutCalls.at(-1).duration, null);
  assert.match(timeoutCalls.at(-1).reason, /yanlış pozitif/i);
  assert.match(updatedModerationPayload.embeds[0].data.title, /Geri Yüklendi/i);

  await processMessageAutomod(makeMessage('message-3', 'Dönen top yeniden kırmızıydı.'), client);
  assert.match(moderationLogPayload.embeds[0].data.description, /15 Dk İhlal Sayısı:\*\* \*\*2\*\*/);
});

test('başarısız AutoMod timeoutunu sahiplenmez ve benzer süreli başka timeoutu kaldırmaz', async () => {
  const timeoutCalls = [];
  let moderationLogPayload;
  const channel = {
    id: 'c2',
    isTextBased: () => true,
    send: async () => ({ delete: async () => undefined })
  };
  const member = {
    communicationDisabledUntilTimestamp: Date.now() + 15 * 60 * 1000,
    timeout: async duration => {
      timeoutCalls.push(duration);
      if (duration !== null) throw new Error('Discord timeout reddetti');
      member.communicationDisabledUntilTimestamp = null;
    }
  };
  const guild = {
    id: 'g2',
    members: { fetch: async () => member },
    channels: { fetch: async () => channel }
  };
  const logChannel = {
    isTextBased: () => true,
    send: async payload => { moderationLogPayload = payload; }
  };
  const client = {
    user: { id: 'bot-1', displayAvatarURL: () => 'https://cdn.example/bot.png' },
    channels: { fetch: async () => logChannel },
    guilds: { fetch: async () => guild }
  };
  const author = { id: 'u2', bot: false };
  const makeMessage = id => ({
    id,
    content: 'Dönen top kırmızıydı.',
    author,
    guild,
    channel,
    attachments: new Map(),
    delete: async () => undefined
  });

  await processMessageAutomod(makeMessage('tm1'), client);
  await processMessageAutomod(makeMessage('tm2'), client);

  await handleAutomodPunishmentButton({
    customId: 'jail_ignore_g2_u2_c2_tm2',
    guild,
    client,
    user: { id: 'moderator-1', tag: 'mod#0001' },
    message: { embeds: moderationLogPayload.embeds },
    update: async payload => payload,
    reply: async payload => payload
  });

  assert.deepEqual(timeoutCalls, [15 * 60 * 1000]);
  assert.notEqual(member.communicationDisabledUntilTimestamp, null);
});

test('AutoMod timeoutundan sonra verilen farklı moderatör timeoutunu kaldırmaz', async () => {
  const timeoutCalls = [];
  let moderationLogPayload;
  const channel = { id: 'c3', isTextBased: () => true, send: async () => ({ delete: async () => undefined }) };
  const member = {
    communicationDisabledUntilTimestamp: null,
    timeout: async duration => {
      timeoutCalls.push(duration);
      member.communicationDisabledUntilTimestamp = duration === null ? null : Date.now() + duration;
      return member;
    }
  };
  const guild = {
    id: 'g3',
    members: { fetch: async () => member },
    channels: { fetch: async () => channel }
  };
  const logChannel = { isTextBased: () => true, send: async payload => { moderationLogPayload = payload; } };
  const client = {
    user: { id: 'bot-1', displayAvatarURL: () => 'https://cdn.example/bot.png' },
    channels: { fetch: async () => logChannel },
    guilds: { fetch: async () => guild }
  };
  const author = { id: 'u3', bot: false };
  const makeMessage = id => ({
    id,
    content: 'Dönen top kırmızıydı.',
    author,
    guild,
    channel,
    attachments: new Map(),
    delete: async () => undefined
  });

  await processMessageAutomod(makeMessage('rm1'), client);
  await processMessageAutomod(makeMessage('rm2'), client);
  member.communicationDisabledUntilTimestamp += 20 * 1000;

  await handleAutomodPunishmentButton({
    customId: 'jail_ignore_g3_u3_c3_rm2',
    guild,
    client,
    user: { id: 'moderator-1', tag: 'mod#0001' },
    message: { embeds: moderationLogPayload.embeds, components: [] },
    update: async payload => payload,
    reply: async payload => payload
  });

  assert.deepEqual(timeoutCalls, [15 * 60 * 1000]);
  assert.notEqual(member.communicationDisabledUntilTimestamp, null);
});
