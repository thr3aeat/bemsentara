'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MessageFlags } = require('discord.js');

const {
  parseHistoryButtonId, buildDailyPayload, buildDetailPayload, buildLoadingPayload, buildErrorPayload, VIEW_ORDER, capText
} = require('../bot/services/historyV2Messages');
const { handleHistoryButton } = require('../bot/services/historyButtons');
const { hasAlreadyPostedToday } = require('../bot/services/ekoYildizHistoryAI');

const V2 = MessageFlags.IsComponentsV2;
const EPH = MessageFlags.Ephemeral;

// Bileşen ağacını düz listeye çevirir (type: 17 container, 9 section, 10 text, 12 gallery, 14 separator, 1 row, 2 button)
function walk(node, out = []) {
  if (!node) return out;
  out.push(node);
  (node.components || []).forEach((c) => walk(c, out));
  if (node.accessory) walk(node.accessory, out);
  return out;
}
const flat = (payload) => walk(payload.components[0].toJSON());
const textLen = (payload) => flat(payload).filter((n) => n.type === 10).reduce((n, c) => n + c.content.length, 0);

describe('parseHistoryButtonId', () => {
  it('günlük (tb_) ve gezinme (tbn_) butonlarını çözer', () => {
    assert.deepEqual(parseHistoryButtonId('tb_detail_ataturk_9_9'), { nav: false, viewKey: 'ataturk', day: 9, month: 9 });
    assert.deepEqual(parseHistoryButtonId('tbn_random_quote_31_0'), { nav: true, viewKey: 'quote', day: 31, month: 0 });
    assert.equal(parseHistoryButtonId('tb_detail_science_1_11').viewKey, 'science');
    assert.equal(parseHistoryButtonId('tb_detail_trivia_1_1').viewKey, 'trivia');
  });

  it('geçersiz veya elle üretilmiş kimlikleri reddeder', () => {
    for (const id of ['tb_detail_ataturk_32_1', 'tb_detail_ataturk_0_1', 'tb_detail_ataturk_5_12', 'tb_detail_ataturk_x_1',
      'tb_unknown_5_5', 'jail_5_5', 'tb_detail_ataturk_5_5_extra', '', undefined]) {
      assert.equal(parseHistoryButtonId(id), null, String(id));
    }
  });
});

describe('günlük mesaj (Components V2)', () => {
  const base = { title: '📅 Tarihte Bugün – 9 Ekim', color: 0xdc143c, content: 'Metin', day: 9, month: 9 };

  it('V2 bayrağı, accent renk, fotoğraf ve 4 buton bölümü içerir; embed kullanmaz', () => {
    const p = buildDailyPayload({ ...base, photo: { url: 'https://x.test/a.jpg', title: 'Atatürk', source: 'Wikimedia Commons' } });
    assert.equal(p.flags, V2);
    assert.equal(p.embeds, undefined);
    assert.equal(p.content, undefined);
    const json = p.components[0].toJSON();
    assert.equal(json.type, 17);
    assert.equal(json.accent_color, 0xdc143c);
    const nodes = flat(p);
    assert.equal(nodes.filter((n) => n.type === 12).length, 1, 'fotoğraf galerisi');
    assert.equal(nodes.filter((n) => n.type === 9).length, 4, '4 bölüm');
    const buttons = nodes.filter((n) => n.type === 2).map((b) => b.custom_id);
    assert.deepEqual(buttons, ['tb_detail_ataturk_9_9', 'tb_detail_science_9_9', 'tb_detail_trivia_9_9', 'tb_random_quote_9_9']);
    for (const id of buttons) assert.ok(parseHistoryButtonId(id), `${id} çözülebilmeli`);
  });

  it('fotoğraf yoksa galeri eklenmez; özel gün alanı gösterilir', () => {
    const p = buildDailyPayload({ ...base, photo: null, specialField: { name: '📌 Önemli Gün', value: 'Açıklama' } });
    const nodes = flat(p);
    assert.equal(nodes.filter((n) => n.type === 12).length, 0);
    assert.ok(nodes.some((n) => n.type === 10 && n.content.includes('Önemli Gün') && n.content.includes('Açıklama')));
  });

  it('çok uzun içerikte toplam metin 4000 karakter sınırının altında kalır', () => {
    const p = buildDailyPayload({ ...base, content: 'a'.repeat(20000), specialField: { name: 'x', value: 'b'.repeat(5000) }, photo: { url: 'https://x.test/a.jpg', source: 'Wikimedia Commons' } });
    assert.ok(textLen(p) < 4000, `toplam metin ${textLen(p)}`);
  });
});

describe('detay / yükleniyor / hata mesajları', () => {
  it('detay cevabı içerik + 4 gezinme butonu içerir, aktif olan devre dışıdır', () => {
    const p = buildDetailPayload({ viewKey: 'science', day: 9, month: 9, body: 'Bilim içeriği' });
    assert.equal(p.flags, V2);
    const json = p.components[0].toJSON();
    assert.equal(json.accent_color, 0x3b82f6);
    const buttons = flat(p).filter((n) => n.type === 2);
    assert.equal(buttons.length, 4);
    assert.deepEqual(buttons.map((b) => b.custom_id), VIEW_ORDER.map((k) => `tbn_${{ ataturk: 'detail_ataturk', science: 'detail_science', trivia: 'detail_trivia', quote: 'random_quote' }[k]}_9_9`));
    assert.deepEqual(buttons.map((b) => !!b.disabled), [false, true, false, false]);
    assert.ok(flat(p).some((n) => n.type === 10 && n.content.includes('Bilim içeriği')));
    assert.ok(textLen(buildDetailPayload({ viewKey: 'ataturk', day: 1, month: 0, body: 'z'.repeat(20000) })) < 4000);
  });

  it('yükleniyor durumunda tüm butonlar devre dışıdır; hata durumunda hepsi etkindir', () => {
    assert.ok(flat(buildLoadingPayload({ viewKey: 'trivia', day: 9, month: 9 })).filter((n) => n.type === 2).every((b) => b.disabled));
    const err = flat(buildErrorPayload({ viewKey: 'trivia', day: 9, month: 9 })).filter((n) => n.type === 2);
    assert.equal(err.length, 4);
    assert.ok(err.every((b) => !b.disabled));
    assert.ok(err.some((b) => b.label === 'Yeniden dene'));
  });

  it('capText kısaltır ve boşları temizler', () => {
    assert.equal(capText('  merhaba  ', 100), 'merhaba');
    assert.ok(capText('x'.repeat(500), 100).length < 140);
  });
});

function fakeInteraction(customId, userId) {
  const calls = [];
  return {
    customId,
    user: { id: userId },
    calls,
    reply: async (p) => { calls.push(['reply', p]); },
    update: async (p) => { calls.push(['update', p]); },
    deferUpdate: async () => { calls.push(['deferUpdate']); },
    editReply: async (p) => { calls.push(['editReply', p]); }
  };
}

describe('handleHistoryButton', () => {
  it('ilgisiz kimliklerde false döner ve hiçbir şey yapmaz', async () => {
    const i = fakeInteraction('jail_1_2', 'u0');
    assert.equal(await handleHistoryButton(i, { chat: async () => 'x'.repeat(50) }), false);
    assert.deepEqual(i.calls, []);
  });

  it('günlük mesajdaki buton: önce V2 geçici "hazırlanıyor", sonra aynı cevabı V2 içerikle günceller', async () => {
    const i = fakeInteraction('tb_detail_ataturk_9_9', 'u1');
    let asked = null;
    assert.equal(await handleHistoryButton(i, { chat: async (m) => { asked = m[0].content; return 'Atatürk hakkında yeterince uzun bir metin burada.'; } }), true);
    assert.deepEqual(i.calls.map((c) => c[0]), ['reply', 'editReply']);
    assert.equal(i.calls[0][1].flags, EPH | V2, 'yalnızca basan kişiye görünür + V2');
    assert.equal(i.calls[1][1].flags, V2);
    assert.match(asked, /9 Ekim/);
    assert.ok(flat(i.calls[1][1]).some((n) => n.type === 10 && n.content.includes('Atatürk hakkında')));
  });

  it('cevap içindeki gezinme butonu: aynı mesajı günceller (yeni mesaj açmaz)', async () => {
    const i = fakeInteraction('tbn_detail_science_9_9', 'u2');
    await handleHistoryButton(i, { chat: async () => 'Bilim ve keşifler hakkında yeterince uzun bir metin.' });
    assert.deepEqual(i.calls.map((c) => c[0]), ['update', 'editReply']);
    const json = i.calls[1][1].components[0].toJSON();
    assert.equal(json.accent_color, 0x3b82f6);
  });

  it('yapay zeka hata verirse V2 hata mesajı ve yeniden dene butonu gösterir', async () => {
    const i = fakeInteraction('tb_detail_trivia_9_9', 'u3');
    await handleHistoryButton(i, { chat: async () => { throw new Error('ağ yok'); } });
    const final = i.calls.at(-1)[1];
    assert.equal(final.flags, V2);
    assert.ok(flat(final).some((n) => n.type === 2 && n.label === 'Yeniden dene'));
    const empty = fakeInteraction('tb_detail_trivia_9_9', 'u3b');
    await handleHistoryButton(empty, { chat: async () => '  ' });
    assert.ok(flat(empty.calls.at(-1)[1]).some((n) => n.type === 2 && n.label === 'Yeniden dene'), 'boş yanıt da hata sayılır');
  });

  it('aynı kullanıcı 3 sn içinde tekrar basarsa sınırlanır; süre dolunca çalışır', async () => {
    let clock = 1_000_000; const now = () => clock;
    const chat = async () => 'Yeterince uzun bir yanıt metni burada yer alıyor.';
    const first = fakeInteraction('tb_detail_ataturk_9_9', 'u4');
    await handleHistoryButton(first, { chat, now });
    assert.deepEqual(first.calls.map((c) => c[0]), ['reply', 'editReply']);

    clock += 1000;
    const spam = fakeInteraction('tb_detail_ataturk_9_9', 'u4');
    await handleHistoryButton(spam, { chat, now });
    assert.deepEqual(spam.calls.map((c) => c[0]), ['reply']);
    assert.equal(spam.calls[0][1].flags, EPH);

    const spamNav = fakeInteraction('tbn_detail_science_9_9', 'u4');
    await handleHistoryButton(spamNav, { chat, now });
    assert.deepEqual(spamNav.calls.map((c) => c[0]), ['deferUpdate']);

    clock += 3000;
    const later = fakeInteraction('tb_detail_ataturk_9_9', 'u4');
    await handleHistoryButton(later, { chat, now });
    assert.deepEqual(later.calls.map((c) => c[0]), ['reply', 'editReply']);
  });

  it('etkileşim başlatılamazsa (süresi dolmuş) hata fırlatmadan çıkar', async () => {
    const i = fakeInteraction('tb_detail_ataturk_9_9', 'u5');
    i.reply = async () => { throw new Error('Unknown interaction'); };
    assert.equal(await handleHistoryButton(i, { chat: async () => 'x'.repeat(40) }), true);
    assert.deepEqual(i.calls, []);
  });
});

describe('ekoYildizHistoryAI mükerrer kontrolü', () => {
  const trToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
  const channel = (messages) => ({
    isTextBased: () => true,
    client: { user: { id: 'bot' } },
    messages: { fetch: async () => ({ size: messages.length, find: (f) => messages.find(f) }) }
  });
  const v2Msg = (date) => ({ author: { id: 'bot' }, flags: { has: (f) => f === V2 }, createdAt: new Date(date), embeds: [] });

  it('botun bugün attığı V2 mesajını tanır, eski günün mesajını saymaz', async () => {
    assert.equal(await hasAlreadyPostedToday(channel([v2Msg(Date.now())]), '9 Ekim', trToday), true);
    assert.equal(await hasAlreadyPostedToday(channel([v2Msg(Date.now() - 3 * 86400000)]), '9 Ekim', trToday), false);
  });

  it("başkasının V2 mesajını saymaz; eski embed'li mesajı hâlâ tanır", async () => {
    const other = { ...v2Msg(Date.now()), author: { id: 'baska' } };
    assert.equal(await hasAlreadyPostedToday(channel([other]), '9 Ekim', trToday), false);
    const legacy = { author: { id: 'bot' }, flags: { has: () => false }, createdAt: new Date(), embeds: [{ title: '📅 Tarihte Bugün – 9 Ekim', footer: { text: '' } }] };
    assert.equal(await hasAlreadyPostedToday(channel([legacy]), '9 Ekim', trToday), true);
  });
});
