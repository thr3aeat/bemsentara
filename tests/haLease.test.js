'use strict';

const { describe, it, afterEach, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { MongoLeaseBackend, MemoryLeaseBackend, waitForLeadership, startRenewal } = require('../bot/services/haLeaseService');
const { pushSnapshots, restoreSnapshots, needsRestore, markLeader } = require('../bot/services/dataSnapshotService');

const TTL = 35000;
const clock = (start = 1_000_000) => { const c = { t: start, now: () => c.t, advance: (ms) => { c.t += ms; } }; return c; };

// Soyut sözleşme: bellek içi ve gerçek MongoDB aynı davranışı vermeli.
function leaseContract(label, makeBackend) {
  describe(`kira sözleşmesi — ${label}`, () => {
    it('boş kirayı ilk isteyen alır, ikinci istek reddedilir', async () => {
      const b = await makeBackend(); const c = clock();
      const a = await b.acquire({ holder: 'A:1', node: 'A', ttlMs: TTL, now: c.now() });
      assert.equal(a.acquired, true); assert.equal(a.previous, null);
      const r = await b.acquire({ holder: 'B:1', node: 'B', ttlMs: TTL, now: c.now() });
      assert.equal(r.acquired, false);
    });

    it('lider yenileyebilir, süre dolunca başkası devralır ve önceki lider bilinir', async () => {
      const b = await makeBackend(); const c = clock();
      await b.acquire({ holder: 'A:1', node: 'A', ttlMs: TTL, now: c.now() });
      c.advance(30000);
      assert.equal((await b.acquire({ holder: 'A:1', node: 'A', ttlMs: TTL, now: c.now() })).acquired, true, 'yenileme');
      c.advance(30000);
      assert.equal((await b.acquire({ holder: 'B:1', node: 'B', ttlMs: TTL, now: c.now() })).acquired, false, 'yenilenen kira dolmadı');
      c.advance(10000);
      const take = await b.acquire({ holder: 'B:1', node: 'B', ttlMs: TTL, now: c.now() });
      assert.equal(take.acquired, true);
      assert.equal(take.previous.node, 'A');
      assert.equal((await b.acquire({ holder: 'A:1', node: 'A', ttlMs: TTL, now: c.now() })).acquired, false, 'eski lider artık yenileyemez');
    });

    it('bırakılan kira hemen alınabilir', async () => {
      const b = await makeBackend(); const c = clock();
      await b.acquire({ holder: 'A:1', node: 'A', ttlMs: TTL, now: c.now() });
      await b.release({ holder: 'A:1', now: c.now() });
      assert.equal((await b.acquire({ holder: 'A:2', node: 'A', ttlMs: TTL, now: c.now() })).acquired, true);
    });

    it('başkasının kirasını bırakamaz', async () => {
      const b = await makeBackend(); const c = clock();
      await b.acquire({ holder: 'A:1', node: 'A', ttlMs: TTL, now: c.now() });
      await b.release({ holder: 'B:1', now: c.now() });
      assert.equal((await b.acquire({ holder: 'B:1', node: 'B', ttlMs: TTL, now: c.now() })).acquired, false);
    });

    it('eşzamanlı 12 istekten yalnızca biri kazanır', async () => {
      const b = await makeBackend(); const now = 5_000_000;
      const results = await Promise.all(Array.from({ length: 12 }, (_, i) =>
        b.acquire({ holder: `N${i}:1`, node: `N${i}`, ttlMs: TTL, now }).catch(() => ({ acquired: false }))));
      assert.equal(results.filter(r => r.acquired).length, 1);
    });
  });
}

leaseContract('bellek', async () => new MemoryLeaseBackend());

describe('waitForLeadership / startRenewal', () => {
  it('devralma ve aynı makinenin yeniden başlaması ayırt edilir', async () => {
    const b = new MemoryLeaseBackend(); const c = clock();
    const sleep = async (ms) => c.advance(ms);
    const a = await waitForLeadership({ backend: b, node: 'vds', ttlMs: TTL, now: c.now, sleep });
    assert.equal(a.takeover, false); assert.equal(a.firstEver, true);

    c.advance(40000); // vds öldü, süre doldu
    const r = await waitForLeadership({ backend: b, node: 'render', ttlMs: TTL, now: c.now, sleep });
    assert.equal(r.takeover, true);

    c.advance(40000); // render öldü; vds geri geliyor
    const v = await waitForLeadership({ backend: b, node: 'vds', ttlMs: TTL, now: c.now, sleep });
    assert.equal(v.takeover, true, 'araya başka makine girdiyse devralmadır');

    await b.release({ holder: v.holder, now: c.now() });
    const again = await waitForLeadership({ backend: b, node: 'vds', ttlMs: TTL, now: c.now, sleep });
    assert.equal(again.takeover, false, 'aynı makine temiz çıkıp geri geldi: yerel dosyalar korunur');
  });

  it('lider ayaktayken yedek bekler, veritabanı hatasında lider OLMAZ', async () => {
    const b = new MemoryLeaseBackend(); const c = clock();
    await b.acquire({ holder: 'vds:1', node: 'vds', ttlMs: TTL, now: c.now() });
    let polls = 0;
    const standby = waitForLeadership({ backend: b, node: 'render', ttlMs: TTL, now: c.now, sleep: async (ms) => { polls++; c.advance(ms); if (polls === 2) { /* lider yeniliyor */ await b.acquire({ holder: 'vds:1', node: 'vds', ttlMs: TTL, now: c.now() }); } } });
    const res = await standby; // sonunda süre dolunca alır
    assert.ok(polls >= 3);
    assert.equal(res.takeover, true);

    const broken = { acquire: async () => { throw new Error('db yok'); } };
    let tries = 0;
    await assert.rejects(waitForLeadership({ backend: broken, node: 'x', pollMs: 1, sleep: async () => { if (++tries >= 4) throw new Error('durduruldu'); } }), /durduruldu/);
    assert.equal(tries, 4, 'veritabanı yokken lider olmaya çalışmadan beklemeli');
  });

  it('kira başkasına geçince onLost bir kez çağrılır; veritabanı hatası liderliği düşürmez', async () => {
    const b = new MemoryLeaseBackend(); const c = clock();
    await b.acquire({ holder: 'vds:1', node: 'vds', ttlMs: TTL, now: c.now() });
    const lostReasons = [];
    const r = startRenewal({ backend: b, node: 'vds', holder: 'vds:1', ttlMs: TTL, intervalMs: 10, now: c.now, onLost: (x) => lostReasons.push(x) });

    const realAcquire = b.acquire.bind(b);
    b.acquire = async () => { throw new Error('ağ kesildi'); };
    await new Promise(r => setTimeout(r, 60));
    assert.deepEqual(lostReasons, [], 'veritabanına ulaşılamıyor: lider kalır (fail-open)');

    b.acquire = realAcquire;
    c.advance(TTL + 1000);
    await b.acquire({ holder: 'render:1', node: 'render', ttlMs: TTL, now: c.now() }); // başka makine aldı
    await new Promise(r => setTimeout(r, 60));
    assert.equal(lostReasons.length, 1);
    r.stop();
  });
});

describe('dataSnapshotService', () => {
  const dirs = [];
  const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ha-snap-')); dirs.push(d); return d; };
  afterEach(() => { while (dirs.length) fs.rmSync(dirs.pop(), { recursive: true, force: true }); });

  function fakeCollection() {
    const docs = new Map();
    return {
      docs,
      async replaceOne(q, doc) { docs.set(q._id, doc); },
      find() { return { toArray: async () => [...docs.values()] }; }
    };
  }

  it('yalnızca değişen dosyaları yazar, boş ve hariç tutulan dosyaları atlar', async () => {
    const dir = tmp(); const col = fakeCollection(); const shas = new Map();
    fs.writeFileSync(path.join(dir, 'a.json'), '{"x":1}');
    fs.writeFileSync(path.join(dir, 'empty.json'), '');
    fs.writeFileSync(path.join(dir, 'maintenance.json'), '{"enabled":true}');
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'x');
    assert.deepEqual(await pushSnapshots({ collection: col, dir, knownShas: shas }), ['a.json']);
    assert.deepEqual(await pushSnapshots({ collection: col, dir, knownShas: shas }), [], 'değişmedi');
    fs.writeFileSync(path.join(dir, 'a.json'), '{"x":2}');
    assert.deepEqual(await pushSnapshots({ collection: col, dir, knownShas: shas }), ['a.json']);
    assert.deepEqual([...col.docs.keys()], ['a.json']);
  });

  it('yerel veriye ne zaman güvenilir: devralmada hayır, taze (geçici) diskte hayır, kalıcı diskte aynı makine evet', () => {
    const dir = tmp();
    assert.equal(needsRestore({ takeover: false, dir }), true, 'işaret yok = taze disk (Render yeniden dağıtımı)');
    markLeader({ dir, node: 'vds' });
    assert.equal(needsRestore({ takeover: false, dir }), false, 'kalıcı disk, aynı makine yeniden başladı');
    assert.equal(needsRestore({ takeover: true, dir }), true, 'başka makineden devralma');
  });

  it('geri yükleme dosyaları yazar, bozuk JSON ve yol atlatmalarını reddeder', async () => {
    const dir = tmp(); const col = fakeCollection();
    col.docs.set('ok.json', { _id: 'ok.json', content: '{"a":1}' });
    col.docs.set('bozuk.json', { _id: 'bozuk.json', content: '{bozuk' });
    col.docs.set('../kacis.json', { _id: '../kacis.json', content: '{}' });
    col.docs.set('maintenance.json', { _id: 'maintenance.json', content: '{"enabled":true}' });
    fs.writeFileSync(path.join(dir, 'ok.json'), '{"a":0}');
    const restored = await restoreSnapshots({ collection: col, dir });
    assert.deepEqual(restored, ['ok.json']);
    assert.equal(fs.readFileSync(path.join(dir, 'ok.json'), 'utf8'), '{"a":1}');
    assert.equal(fs.existsSync(path.join(dir, 'bozuk.json')), false);
    assert.equal(fs.existsSync(path.join(dir, 'maintenance.json')), false);
    assert.equal(fs.existsSync(path.join(os.tmpdir(), 'kacis.json')), false);
    assert.deepEqual(fs.readdirSync(dir).filter(f => f.endsWith('.tmp')), [], 'geçici dosya kalmamalı');
  });
});

// Gerçek MongoDB: HA_TEST_MONGO_URI verilirse çalışır (yerelde mongod ile).
const MONGO_URI = process.env.HA_TEST_MONGO_URI;
describe('gerçek MongoDB', { skip: !MONGO_URI && 'HA_TEST_MONGO_URI tanımlı değil' }, () => {
  let conn;
  const names = [];
  before(async () => {
    const mongoose = require('mongoose');
    conn = await mongoose.createConnection(MONGO_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
  });
  after(async () => {
    for (const n of names) await conn.db.collection(n).drop().catch(() => {});
    await conn.close();
  });
  const fresh = () => { const n = `ha_lease_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; names.push(n); return new MongoLeaseBackend(conn.db.collection(n)); };

  leaseContract('MongoDB', async () => fresh());

  it('MongoDB: veri dosyası yansıtma ve geri yükleme', async () => {
    const col = conn.db.collection(`ha_snap_test_${Date.now()}`); names.push(col.collectionName);
    const src = fs.mkdtempSync(path.join(os.tmpdir(), 'ha-src-')); const dst = fs.mkdtempSync(path.join(os.tmpdir(), 'ha-dst-'));
    fs.writeFileSync(path.join(src, 'robloxland_x.json'), JSON.stringify({ users: { 1: { puan: 5 } } }));
    await pushSnapshots({ collection: col, dir: src, knownShas: new Map() });
    assert.deepEqual(await restoreSnapshots({ collection: col, dir: dst }), ['robloxland_x.json']);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dst, 'robloxland_x.json'), 'utf8')), { users: { 1: { puan: 5 } } });
    fs.rmSync(src, { recursive: true, force: true }); fs.rmSync(dst, { recursive: true, force: true });
  });
});
