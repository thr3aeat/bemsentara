'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const discord = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = discord;
const { convertPayload, install, shadow } = require('../bot/patches/embedsToV2');

const V2 = MessageFlags.IsComponentsV2;
const types = (list, out = []) => { for (const c of list) { out.push(c.type); if (c.components) types(c.components, out); if (c.accessory) out.push(c.accessory.type); } return out; };
const texts = (list, out = []) => { for (const c of list) { if (c.type === 10) out.push(c.content); if (c.components) texts(c.components, out); } return out; };

describe('convertPayload', () => {
  it('başlık, açıklama, alanlar, görsel, altbilgi, renk ve içerik V2 container olur; butonlar korunur', () => {
    const embed = new EmbedBuilder().setTitle('Başlık').setURL('https://x.test').setDescription('Açıklama').setColor(0xff0000)
      .addFields({ name: 'A', value: '1', inline: true }, { name: 'B', value: '2' }).setImage('https://x.test/i.png')
      .setFooter({ text: 'Altbilgi' }).setTimestamp(new Date('2026-01-01T00:00:00Z')).setAuthor({ name: 'Yazar' });
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('b1').setLabel('Tıkla').setStyle(ButtonStyle.Primary));
    const { payload, embeds } = convertPayload({ content: 'Merhaba', embeds: [embed], components: [row] });
    assert.equal(payload.embeds, undefined);
    assert.equal(payload.content, undefined);
    assert.equal(payload.flags & V2, V2);
    assert.equal(embeds[0].title, 'Başlık');
    const [first, container, buttons] = payload.components;
    assert.deepEqual([first.type, container.type, buttons.type], [10, 17, 1]);
    assert.equal(first.content, 'Merhaba');
    assert.equal(container.accent_color, 0xff0000);
    const t = texts(container.components).join('\n');
    for (const s of ['-# Yazar', '### [Başlık](https://x.test)', 'Açıklama', '**A**\n1', '**B**\n2', '-# Altbilgi • <t:1767225600:f>']) assert.ok(t.includes(s), s);
    assert.ok(types(container.components).includes(12), 'görsel galerisi');
    assert.equal(buttons.components[0].custom_id, 'b1');
  });

  it('küçük resim (thumbnail) metinle birlikte bölüm olur', () => {
    const { payload } = convertPayload({ embeds: [{ title: 'T', description: 'D', thumbnail: { url: 'https://x.test/t.png' } }] });
    const section = payload.components[0].components[0];
    assert.equal(section.type, 9);
    assert.equal(section.accessory.type, 11);
  });

  it('geçici (ephemeral) bayrağı korunur, eski ephemeral alanı kaldırılır', () => {
    const a = convertPayload({ embeds: [{ description: 'x' }], ephemeral: true }).payload;
    assert.equal(a.flags, V2 | MessageFlags.Ephemeral);
    assert.equal(a.ephemeral, undefined);
    const b = convertPayload({ embeds: [{ description: 'x' }], flags: MessageFlags.Ephemeral }).payload;
    assert.equal(b.flags, V2 | MessageFlags.Ephemeral);
  });

  it('çevrilmeyenler: embed yok, zaten V2, anket, metin, istisna işareti, aşırı bileşen', () => {
    assert.equal(convertPayload({ content: 'sadece metin' }), null);
    assert.equal(convertPayload('düz metin'), null);
    assert.equal(convertPayload({ embeds: [{ description: 'x' }], flags: V2 }), null);
    assert.equal(convertPayload({ embeds: [{ description: 'x' }], poll: {} }), null);
    assert.equal(convertPayload({ embeds: [{ description: 'x' }], __keepEmbeds: true }), null);
    const rows = Array.from({ length: 5 }, (_, r) => new ActionRowBuilder().addComponents(
      Array.from({ length: 5 }, (_, i) => new ButtonBuilder().setCustomId(`b${r}${i}`).setLabel('x').setStyle(ButtonStyle.Secondary))));
    const many = Array.from({ length: 3 }, () => ({ description: 'x', fields: [{ name: 'a', value: 'b' }], footer: { text: 'f' } }));
    assert.equal(convertPayload({ embeds: many, components: rows }), null, '40 bileşen sınırı aşılırsa orijinal gönderilir');
  });

  it('çok uzun içerikte toplam metin 4000 sınırının altında kalır', () => {
    const { payload } = convertPayload({ content: 'c'.repeat(3000), embeds: [{ title: 't'.repeat(256), description: 'd'.repeat(4096), fields: [{ name: 'n', value: 'v'.repeat(1024) }] }] });
    assert.ok(texts(payload.components).join('').length <= 4000);
  });
});

describe('install (gerçek discord.js sınıfları)', () => {
  const calls = [];
  let uninstall; const saved = {};
  const stubbed = [
    [discord.DMChannel.prototype, 'send'],
    [discord.Message.prototype, 'edit'],
    [discord.MessageComponentInteraction.prototype, 'reply'],
    [discord.MessageComponentInteraction.prototype, 'update'],
    [discord.MessageComponentInteraction.prototype, 'editReply']
  ];
  let failNext = false;
  before(() => {
    for (const [proto, name] of stubbed) {
      saved[name + proto.constructor.name] = proto[name];
      proto[name] = async function (opts) {
        calls.push([name, opts]);
        if (failNext) { failNext = false; const e = new Error('Invalid Form Body'); e.status = 400; e.code = 50035; throw e; }
        return { id: `m${calls.length}`, flags: { has: () => true } };
      };
    }
    uninstall = install(discord, { log: () => {} });
  });
  after(() => {
    uninstall();
    for (const [proto, name] of stubbed) proto[name] = saved[name + proto.constructor.name];
  });

  it('kanala gönderilen embed V2 olur ve gölge embed saklanır', async () => {
    const ch = Object.create(discord.DMChannel.prototype);
    const res = await ch.send({ embeds: [new EmbedBuilder().setTitle('Ceza').addFields({ name: 'Kullanıcı', value: '123' })] });
    const sent = calls.at(-1)[1];
    assert.equal(sent.flags & V2, V2);
    assert.equal(sent.embeds, undefined);
    assert.equal(shadow.get(res.id)[0].fields[0].value, '123', 'eski kod embed alanını okuyabilsin');
  });

  it('Discord V2 yükünü reddederse aynı mesaj orijinal embed ile gönderilir', async () => {
    const ch = Object.create(discord.DMChannel.prototype);
    failNext = true;
    await ch.send({ embeds: [{ description: 'yedek yol' }] });
    const [v2Try, fallback] = calls.slice(-2).map((c) => c[1]);
    assert.equal(v2Try.flags & V2, V2);
    assert.equal(fallback.embeds[0].description, 'yedek yol');
  });

  it('embed\'li (V2 olmayan) eski mesaj düzenlenirken çevrilmez; V2 mesajda çevrilir', async () => {
    const oldMsg = Object.create(discord.Message.prototype); oldMsg.flags = { has: () => false };
    await oldMsg.edit({ embeds: [{ description: 'x' }] });
    assert.ok(calls.at(-1)[1].embeds, 'eski mesaj embed olarak kalır');
    const v2Msg = Object.create(discord.Message.prototype); v2Msg.flags = { has: (f) => f === V2 };
    await v2Msg.edit({ embeds: [{ description: 'y' }] });
    assert.equal(calls.at(-1)[1].flags & V2, V2);
  });

  it('etkileşim: ilk cevap V2 olur, sonraki editReply de V2; update yalnızca V2 mesajda', async () => {
    const i = Object.create(discord.MessageComponentInteraction.prototype);
    i.deferred = false; i.replied = false;
    await i.reply({ embeds: [{ description: 'a' }], ephemeral: true });
    assert.equal(calls.at(-1)[1].flags, V2 | MessageFlags.Ephemeral);
    await i.editReply({ embeds: [{ description: 'b' }] });
    assert.equal(calls.at(-1)[1].flags & V2, V2);

    const deferredI = Object.create(discord.MessageComponentInteraction.prototype);
    deferredI.deferred = true; deferredI.replied = false;
    await deferredI.editReply({ embeds: [{ description: 'c' }] });
    assert.ok(calls.at(-1)[1].embeds, 'ertelenmiş cevap bilinmediği için embed kalır');

    const u = Object.create(discord.MessageComponentInteraction.prototype);
    u.message = { id: 'old', flags: { has: () => false } };
    await u.update({ embeds: [{ description: 'd' }] });
    assert.ok(calls.at(-1)[1].embeds, 'embed\'li mesajın butonu: embed kalır');
  });

  it('V2 mesaj sonradan okunduğunda gölge embed geri konur (Message._patch)', () => {
    const client = new discord.Client({ intents: [] });
    shadow.set('999', [{ title: 'Kayıtlı', fields: [{ name: 'ID', value: '42' }] }]);
    const msg = new discord.Message(client, {
      id: '999', channel_id: '1', type: 0, content: '', flags: V2, embeds: [], components: [], attachments: [],
      timestamp: new Date().toISOString(), author: { id: '5', username: 'bot', discriminator: '0' }
    });
    assert.equal(msg.embeds[0].title, 'Kayıtlı');
    assert.equal(msg.embeds[0].fields[0].value, '42');
    client.destroy();
  });

  it('EMBED_V2=0 ile hiçbir şey kurulmaz', () => {
    process.env.EMBED_V2 = '0';
    try { assert.equal(typeof install(discord), 'function'); } finally { delete process.env.EMBED_V2; }
  });
});
