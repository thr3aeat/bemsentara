'use strict';

const assert = require('node:assert/strict');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
  MessagePayload
} = require('discord.js');
const guard = require('../bot/patches/disableEveryone');

const { _sanitizeOptions, _preserveLegacyEditBody } = guard._test;

(async () => {

const originalMessage = {
  content: 'Sonuç metni',
  embeds: [{ title: 'Sonuç kartı' }]
};

const componentOnlyEdit = _sanitizeOptions({
  components: [{ type: 1, components: [{ type: 2, custom_id: 'again', label: 'Tekrar', style: 1 }] }]
});
const preserved = _preserveLegacyEditBody(originalMessage, componentOnlyEdit);

assert.equal(preserved.content, 'Sonuç metni');
assert.deepEqual(preserved.embeds, originalMessage.embeds);
assert.equal(preserved.components[0].components[0].label, 'Tekrar');

const explicitClear = _preserveLegacyEditBody(originalMessage, {
  content: '',
  embeds: [],
  components: []
});
assert.equal(explicitClear.content, '');
assert.deepEqual(explicitClear.embeds, []);

const v2Edit = { components: [{ type: 17, components: [{ type: 10, content: 'V2' }] }] };
assert.deepEqual(_preserveLegacyEditBody(originalMessage, v2Edit), v2Edit);
assert.equal(Object.prototype.hasOwnProperty.call(v2Edit, 'content'), false);
assert.equal(Object.prototype.hasOwnProperty.call(v2Edit, 'embeds'), false);

const internalPayload = new MessagePayload(
  { client: { options: { allowedMentions: undefined } } },
  { content: 'Hazır payload', embeds: [] }
);
assert.equal(_sanitizeOptions(internalPayload), internalPayload);

// Full Message#reply regression: discord.js forwards a MessagePayload to
// channel.send. The guard must not turn it into a zero-width-only response.
guard();
const forwarded = [];
const fakeMessage = {
  id: 'message-1',
  author: { id: 'user-1' },
  client: { options: { allowedMentions: undefined } },
  channel: {
    send: async payload => {
      forwarded.push(payload);
      return payload;
    }
  }
};
const embed = new EmbedBuilder().setTitle('Komut sonucu').setDescription('İçerik görünür');
const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('again').setLabel('Tekrar').setStyle(ButtonStyle.Primary)
);

await Message.prototype.reply.call(fakeMessage, {
  content: 'Sonuç metni',
  embeds: [embed],
  components: [row]
});

assert.equal(forwarded.length, 1);
assert.equal(forwarded[0] instanceof MessagePayload, true);
assert.equal(forwarded[0].options.content, 'Sonuç metni');
assert.equal(forwarded[0].options.embeds.length, 1);
assert.equal(forwarded[0].options.components.length, 1);

console.log('globalMessageGuard regression tests passed');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
