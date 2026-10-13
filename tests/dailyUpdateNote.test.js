'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { MessageFlags } = require('discord.js');

const {
  postDailyFriendlyNote, generateFriendlyNote, getUpdateScope, isBigUpdate, cleanNote, pickFallbackNote,
  buildNotePayload, FALLBACK_SMALL, FALLBACK_BIG
} = require('../bot/services/dailyUpdateNoteService');

const V2 = MessageFlags.IsComponentsV2;
const BOT = 'bot-1';
const gitMeta = { version: '1.0.0', commitHash: 'abc1234' };

const tmpDirs = [];
const mkTmp = (prefix) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix)); tmpDirs.push(d); return d; };
afterEach(() => { while (tmpDirs.length) fs.rmSync(tmpDirs.pop(), { recursive: true, force: true }); });

// Gerçek Discord kanalı gibi: gönderilen V2 mesajı geçmişe eklenir.
function fakeChannel({ failSends = 0 } = {}) {
  const messages = new Map();
  let failures = failSends;
  let clock = Date.now();
  return {
    sent: [],
    messages: { fetch: async () => messages },
    async send(payload) {
      if (failures-- > 0) throw new Error('Missing Permissions');
      this.sent.push(payload);
      const id = String(messages.size + 1);
      messages.set(id, {
        id, author: { id: BOT }, flags: { has: (f) => f === V2 }, createdAt: new Date(this.now || clock), createdTimestamp: this.now || clock++,
        components: JSON.parse(JSON.stringify(payload.components))
      });
      return { id };
    },
    now: null
  };
}

function git(cwd, cmd) { return execSync(`git ${cmd}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
function makeRepo(commits) {
  const dir = mkTmp('note-repo-');
  git(dir, 'init -q'); git(dir, 'config user.email t@t'); git(dir, 'config user.name t');
  const hashes = [];
  for (const c of commits) {
    for (const [file, lines] of Object.entries(c.files)) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), Array.from({ length: lines }, (_, i) => `satır ${i}`).join('\n') + '\n');
    }
    git(dir, 'add -A'); git(dir, `commit -q -m "${c.subject}"`);
    hashes.push(git(dir, 'rev-parse --short HEAD'));
  }
  return { dir, hashes };
}

describe('cleanNote (güvenlik filtresi)', () => {
  it('temiz, samimi cümleyi geçirir; markdown ve tırnakları temizler', () => {
    assert.equal(cleanNote('Bugün Sentara biraz daha pürüzsüz çalışıyor ✨'), 'Bugün Sentara biraz daha pürüzsüz çalışıyor ✨');
    assert.equal(cleanNote('**"Bir şeyler pişiyor 👀 yakında fark edeceksin"**'), 'Bir şeyler pişiyor 👀 yakında fark edeceksin');
  });

  it('kod, bağlantı, komut, dosya adı, hash, teknik ve gizli kelimeleri (Türkçe karakterli olanlar dahil) reddeder', () => {
    for (const bad of [
      'Yeni sürüm yayında, hepsi çok güzel olmuş', 'Şifre sistemini değiştirdik, bak istersen', 'Bak: https://example.com ne güzel',
      'e!atatürk komutuna bir göz at 👀', 'server/index.js dosyasında değişiklik var', 'Commit abc1234 yayında arkadaşlar',
      'Render tarafında güzel şeyler oldu bugün', 'Admin paneline bir şey geliyor yakında', 'Şu `kod` parçası çok iyi oldu',
      'kısa', 'a'.repeat(300)
    ]) assert.equal(cleanNote(bad), null, bad);
    assert.equal(cleanNote(null), null);
    assert.equal(cleanNote(undefined), null);
  });

  it('olmayan zaman sözlerini reddeder; küçük günde "bir şey geliyor" ipuçlarını da reddeder', () => {
    for (const bad of ['Bu gece herkesin nefesi kesilecek 🤫', 'Gece yarısı perde açılıyor, hazır ol 👀', 'Yarın büyük bir gün olacak galiba 🙂']) {
      assert.equal(cleanNote(bad), null, bad);
    }
    const teaser = 'Perde arkasında güzel bir şey var 👀';
    assert.equal(cleanNote(teaser, { big: true }), teaser, 'büyük günde serbest');
    for (const bad of [teaser, 'Her yer akıcı oldu, yakında görürsünüz 👋', 'Küçük bir sürpriz hazırladık 🎁']) {
      assert.equal(cleanNote(bad, { big: false }), null, bad);
    }
    assert.equal(cleanNote('Bugün her şey biraz daha akıcı 🙂', { big: false }), 'Bugün her şey biraz daha akıcı 🙂');
  });

  it('düşünme bloklarını ve satırları temizler (en fazla 2 satır)', () => {
    assert.equal(cleanNote('<think>gizli düşünce</think>Her şey yerli yerinde, keyifli günler 🌿'), 'Her şey yerli yerinde, keyifli günler 🌿');
    assert.equal(cleanNote('Birinci cümle burada\nİkinci cümle de burada\nÜçüncü atılmalı'), 'Birinci cümle burada İkinci cümle de burada');
  });
});

describe('güncellemenin büyüklüğü', () => {
  it('çok dosyalı yeni özellik "büyük", küçük düzeltme "küçük" sayılır; veri/test/belge sayılmaz', () => {
    const big = {};
    for (let i = 0; i < 12; i++) big[`bot/feature${i}.js`] = 5;
    big['docs/rehber.md'] = 900; big['tests/x.test.js'] = 900; big['data/veri.json'] = 900;
    const { dir, hashes } = makeRepo([
      { subject: 'chore: başlangıç', files: { 'README.md': 1 } },
      { subject: 'feat: yeni büyük özellik', files: big },
      { subject: 'fix: küçük düzeltme', files: { 'bot/feature0.js': 6 } }
    ]);

    const onlyFix = getUpdateScope({ prevHash: hashes[1], cwd: dir });
    assert.equal(onlyFix.hasFeat, false);
    assert.equal(onlyFix.files, 1);
    assert.equal(isBigUpdate(onlyFix), false);

    const sinceStart = getUpdateScope({ prevHash: hashes[0], cwd: dir });
    assert.equal(sinceStart.hasFeat, true);
    assert.equal(sinceStart.files, 12, 'docs, tests ve data hariç');
    assert.equal(isBigUpdate(sinceStart), true);
    assert.deepEqual(sinceStart.subjects, ['fix: küçük düzeltme', 'feat: yeni büyük özellik']);
  });

  it('yeni özellik içermeyen büyük değişiklik, geniş olmayan yeni özellik "büyük" değildir', () => {
    assert.equal(isBigUpdate({ hasFeat: false, files: 50, lines: 5000 }), false);
    assert.equal(isBigUpdate({ hasFeat: true, files: 2, lines: 40 }), false);
    assert.equal(isBigUpdate({ hasFeat: true, files: 2, lines: 600 }), true, 'çok satır da büyüklüktür');
    assert.equal(isBigUpdate(null), false);
  });

  it('önceki duyuru commit\'i bilinmiyorsa yalnızca son commit\'e bakar; geçersiz hash\'te çökmez', () => {
    const { dir } = makeRepo([{ subject: 'feat: tek', files: { 'bot/a.js': 3 } }]);
    const s = getUpdateScope({ prevHash: 'deadbeefdeadbeef', cwd: dir });
    assert.equal(s.since, null);
    assert.equal(s.files, 1);
    assert.deepEqual(getUpdateScope({ cwd: '/nonexistent-dir-xyz' }), { files: 0, lines: 0, subjects: [], hasFeat: false, since: null });
  });
});

describe('hazır yedek cümleler', () => {
  it('kendi filtremizden geçer: küçük günlerdekiler ipucu vermez, büyük günlerdekiler güvenlidir', () => {
    for (const s of FALLBACK_SMALL) assert.equal(cleanNote(s, { big: false }), s, s);
    for (const s of FALLBACK_BIG) assert.equal(cleanNote(s, { big: true }), s, s);
  });
});

describe('generateFriendlyNote (aiService ile)', () => {
  it('model temiz cümle yazarsa onu kullanır', async () => {
    const r = await generateFriendlyNote({ big: false, subjects: [], recentNotes: [], dateKey: '2026-10-09', chat: async () => 'Ortalık bugün biraz daha yumuşak 🌿' });
    assert.deepEqual(r, { text: 'Ortalık bugün biraz daha yumuşak 🌿', source: 'ai' });
  });

  it('küçük günde ayrıntı vermez; büyük günde "sneak peek" ister ama konu ipucunu yalnızca bağlam olarak verir', async () => {
    let small = ''; let large = '';
    await generateFriendlyNote({ big: false, subjects: ['feat: gizli özellik'], recentNotes: [], dateKey: 'd', chat: async (m) => { small = m[0].content; return 'x'; } });
    await generateFriendlyNote({ big: true, subjects: ['feat(bot): gizli özellik'], recentNotes: [], dateKey: 'd', chat: async (m) => { large = m[0].content; return 'x'; } });
    assert.ok(!small.includes('gizli özellik'), 'küçük günde commit bilgisi modele hiç verilmez');
    assert.match(small, /ayrıntı vermeden/);
    assert.match(small, /izlenim VERME/);
    assert.match(large, /sneak peek/);
    assert.match(large, /ASLA söyleme/);
    assert.match(large, /gizli özellik/, 'bağlam olarak verilir');
    assert.ok(!large.includes('feat('), 'commit öneki temizlenir');
  });

  it('önceki notları modele "benzeme" diye verir ve aynı cümleyi tekrar kullanmaz', async () => {
    let prompt = '';
    const recent = ['Dünkü cümle burada duruyor ✨'];
    const r = await generateFriendlyNote({ big: false, subjects: [], recentNotes: recent, dateKey: 'd', chat: async (m) => { prompt = m[0].content; return 'Dünkü cümle burada duruyor ✨'; } });
    assert.match(prompt, /benzeme/);
    assert.match(prompt, /Dünkü cümle burada duruyor/);
    assert.equal(r.source, 'fallback', 'aynı cümle tekrar edilirse hazır cümleye düşer');
    assert.notEqual(r.text, recent[0]);
  });

  it('model hata verir veya güvensiz/boş yazarsa hazır samimi cümleyi kullanır', async () => {
    for (const chat of [async () => { throw new Error('ağ'); }, async () => 'Yeni sürüm yayında https://x.com', async () => '', async () => null]) {
      const small = await generateFriendlyNote({ big: false, subjects: [], recentNotes: [], dateKey: '2026-10-09', chat });
      assert.equal(small.source, 'fallback');
      assert.ok(FALLBACK_SMALL.includes(small.text));
      const big = await generateFriendlyNote({ big: true, subjects: [], recentNotes: [], dateKey: '2026-10-09', chat });
      assert.ok(FALLBACK_BIG.includes(big.text));
    }
    assert.notEqual(pickFallbackNote(false, '2026-10-09'), undefined);
  });
});

describe('günde en fazla bir not', () => {
  const okChat = async () => 'Bugün Sentara biraz daha keyifli, bir bak istersen 🙂';

  it('aynı gün içinde 5 kez çağrılsa da yalnızca 1 mesaj atılır', async () => {
    const channel = fakeChannel(); const lockDir = mkTmp('note-lock-');
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await postDailyFriendlyNote({ channel, botId: BOT, gitMeta, chat: okChat, lockDir, cwd: '/nonexistent' }));
    assert.equal(channel.sent.length, 1);
    assert.deepEqual(results.map((r) => r.posted), [true, false, false, false, false]);
    assert.match(results[1].reason, /bugün zaten atıldı/);
  });

  it('eşzamanlı 5 süreç (kanal geçmişi henüz boş) aynı makinede günlük kilitle yine 1 mesaj atar', async () => {
    const channel = fakeChannel(); const lockDir = mkTmp('note-lock-');
    const slow = new Map(); // geçmiş hep boş görünür: yalnızca kilit koruyor
    channel.messages.fetch = async () => slow;
    const results = await Promise.all(Array.from({ length: 5 }, () => postDailyFriendlyNote({ channel, botId: BOT, gitMeta, chat: okChat, lockDir, cwd: '/nonexistent' })));
    assert.equal(channel.sent.length, 1);
    assert.equal(results.filter((r) => r.posted).length, 1);
  });

  it('kilit dosyası kaybolsa (yeniden başlatma/başka makine) bile kanal geçmişi bugünü gösteriyorsa atmaz', async () => {
    const channel = fakeChannel();
    await postDailyFriendlyNote({ channel, botId: BOT, gitMeta, chat: okChat, lockDir: mkTmp('note-lock-'), cwd: '/nonexistent' });
    const again = await postDailyFriendlyNote({ channel, botId: BOT, gitMeta, chat: okChat, lockDir: mkTmp('note-lock-'), cwd: '/nonexistent' });
    assert.equal(again.posted, false);
    assert.equal(channel.sent.length, 1);
  });

  it('ertesi gün yeniden atılır ve metin değişir; başkasının V2 mesajı sayılmaz', async () => {
    const channel = fakeChannel(); const lockDir = mkTmp('note-lock-');
    const day1 = new Date('2026-10-09T10:00:00+03:00'); const day2 = new Date('2026-10-10T10:00:00+03:00');
    channel.now = +day1;
    const first = await postDailyFriendlyNote({ channel, botId: BOT, gitMeta, now: day1, chat: async () => 'Birinci günün samimi notu burada 🌿', lockDir, cwd: '/nonexistent' });
    channel.now = +day2;
    const second = await postDailyFriendlyNote({ channel, botId: BOT, gitMeta, now: day2, chat: async () => 'İkinci günün farklı notu burada ✨', lockDir, cwd: '/nonexistent' });
    assert.equal(first.posted && second.posted, true);
    assert.notEqual(first.note, second.note);
    assert.equal(channel.sent.length, 2);

    const other = fakeChannel();
    other.messages.fetch = async () => new Map([['1', { author: { id: 'baska' }, flags: { has: () => true }, createdAt: day1, components: [] }]]);
    const r = await postDailyFriendlyNote({ channel: other, botId: BOT, gitMeta, now: day1, chat: okChat, lockDir: mkTmp('note-lock-'), cwd: '/nonexistent' });
    assert.equal(r.posted, true);
  });

  it('gönderim başarısız olursa kilit bırakılır ve aynı gün tekrar denenebilir', async () => {
    const channel = fakeChannel({ failSends: 1 }); const lockDir = mkTmp('note-lock-');
    const failed = await postDailyFriendlyNote({ channel, botId: BOT, gitMeta, chat: okChat, lockDir, cwd: '/nonexistent' });
    assert.equal(failed.posted, false);
    assert.equal(fs.readdirSync(lockDir).length, 0, 'kilit dosyası kalmamalı');
    const retry = await postDailyFriendlyNote({ channel, botId: BOT, gitMeta, chat: okChat, lockDir, cwd: '/nonexistent' });
    assert.equal(retry.posted, true);
  });

  it('mesaj V2: accent rengi yok, yalnızca not ve küçük künye satırı (sürüm, commit, zaman) içerir; teknik başlık yok', async () => {
    const channel = fakeChannel();
    await postDailyFriendlyNote({ channel, botId: BOT, gitMeta, chat: okChat, lockDir: mkTmp('note-lock-'), cwd: '/nonexistent' });
    const p = channel.sent[0];
    assert.equal(p.flags, V2);
    const container = p.components[0].toJSON ? p.components[0].toJSON() : p.components[0];
    assert.equal(container.accent_color, undefined);
    const texts = container.components.map((c) => c.content);
    assert.equal(texts.length, 2);
    assert.equal(texts[0], 'Bugün Sentara biraz daha keyifli, bir bak istersen 🙂');
    assert.match(texts[1], /^-# v1\.0\.0 • `abc1234` • <t:\d+:R>$/);
    assert.ok(!JSON.stringify(container).includes('güncellendi'), 'eski resmi başlık kalmamalı');
  });

  it('büyük güncelleme günü ipucu istenir; küçük güncelleme günü genel cümle istenir (gerçek git geçmişiyle)', async () => {
    const files = {};
    for (let i = 0; i < 12; i++) files[`bot/ozellik${i}.js`] = 5;
    const { dir, hashes } = makeRepo([
      { subject: 'chore: temel', files: { 'README.md': 1 } },
      { subject: 'feat: büyük yenilik', files },
      { subject: 'fix: ufak düzeltme', files: { 'bot/ozellik0.js': 6 } }
    ]);

    // Önceki duyuru "temel" commit'iydi: aradaki büyük özellik birikmiş sayılır.
    const bigChannel = fakeChannel();
    bigChannel.messages.fetch = async () => new Map([['1', {
      author: { id: BOT }, flags: { has: (f) => f === V2 }, createdAt: new Date(Date.now() - 3 * 86400000), createdTimestamp: Date.now() - 3 * 86400000,
      components: [{ type: 17, components: [{ type: 10, content: 'Eski günün notu' }, { type: 10, content: `-# v1.0.0 • \`${hashes[0]}\` • <t:1:R>` }] }]
    }]]);
    let bigPrompt = '';
    const big = await postDailyFriendlyNote({ channel: bigChannel, botId: BOT, gitMeta, chat: async (m) => { bigPrompt = m[0].content; return 'Perde arkasında güzel bir şey var 👀 şimdilik sır'; }, lockDir: mkTmp('note-lock-'), cwd: dir });
    assert.equal(big.big, true);
    assert.match(bigPrompt, /sneak peek/);

    // Önceki duyuru büyük özellikten sonraki commit'ti: yalnızca küçük düzeltme kaldı.
    const smallChannel = fakeChannel();
    smallChannel.messages.fetch = async () => new Map([['1', {
      author: { id: BOT }, flags: { has: (f) => f === V2 }, createdAt: new Date(Date.now() - 86400000 * 2), createdTimestamp: Date.now() - 86400000 * 2,
      components: [{ type: 17, components: [{ type: 10, content: 'Eski not' }, { type: 10, content: `-# v1.0.0 • \`${hashes[1]}\` • <t:1:R>` }] }]
    }]]);
    let smallPrompt = '';
    const small = await postDailyFriendlyNote({ channel: smallChannel, botId: BOT, gitMeta, chat: async (m) => { smallPrompt = m[0].content; return 'Her şey biraz daha pürüzsüz oldu bugün ✨'; }, lockDir: mkTmp('note-lock-'), cwd: dir });
    assert.equal(small.big, false);
    assert.doesNotMatch(smallPrompt, /sneak peek/);
    assert.match(smallPrompt, /ayrıntı vermeden/);
  });

  it('buildNotePayload yalnızca V2 container döndürür (embed/content yok)', () => {
    const p = buildNotePayload({ note: 'Merhaba dünya, nasılsın bugün?', version: '2.0.0', commitHash: 'deadbee', now: 1_700_000_000_000 });
    assert.equal(p.flags, V2);
    assert.equal(p.embeds, undefined);
    assert.equal(p.content, undefined);
    assert.equal(p.components.length, 1);
  });
});
