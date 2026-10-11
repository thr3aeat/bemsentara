'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const { createSupervisor } = require('../bot/services/selfHealingService');

const FAST = { failThreshold: 2, backoffBaseMs: 1000, backoffMaxMs: 8000, maxFastAttempts: 3, checkTimeoutMs: 500, healTimeoutMs: 2000 };

function listen(server, port = 0) {
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server.address().port)));
}

describe('selfHealingService', () => {
  const cleanup = [];
  afterEach(async () => {
    delete process.env.ALERT_WEBHOOK_URL;
    while (cleanup.length) await cleanup.pop()();
  });

  it('sağlıklı sistemde onarım denemez', async () => {
    const sup = createSupervisor(FAST);
    let heals = 0;
    sup.register('x', { check: async () => ({ ok: true }), heal: async () => { heals++; } });
    for (let t = 0; t < 5; t++) await sup.tick(t * 1000);
    assert.equal(heals, 0);
  });

  it('tek seferlik başarısızlıkta onarmaz, eşik aşılınca onarır ve toparlanınca sıfırlar', async () => {
    const sup = createSupervisor(FAST);
    let healthy = false; let heals = 0;
    sup.register('x', { check: async () => ({ ok: healthy, detail: 'bozuk' }), heal: async () => { heals++; healthy = true; } });
    await sup.tick(0);
    assert.equal(heals, 0, 'ilk hatada onarım yok');
    await sup.tick(1000);
    assert.equal(heals, 1, 'eşik aşıldı, onarıldı');
    assert.equal(sup.getStatus()[0].status, 'ok');
    assert.equal(sup.getStatus()[0].attempts, 0);
  });

  it('başarısız onarımlarda üstel geri çekilme uygular ve süreci kapatmaz', async () => {
    const sup = createSupervisor(FAST);
    const healTimes = [];
    sup.register('x', { check: async () => ({ ok: false, detail: 'hep bozuk' }), heal: async () => { healTimes.push(1); } });
    const originalExit = process.exit;
    process.exit = () => { throw new Error('process.exit çağrılmamalıydı'); };
    try {
      for (let t = 0; t <= 40000; t += 500) await sup.tick(t);
    } finally { process.exit = originalExit; }
    // 0/500: eşik, sonra bekleme 1s, 2s, 4s, 8s, 8s ... => 40 sn içinde sınırlı sayıda deneme
    assert.ok(healTimes.length >= 5 && healTimes.length <= 9, `deneme sayısı beklenenden farklı: ${healTimes.length}`);
  });

  it('kalıcı arızada tek uyarı gönderir, toparlanınca tek "düzeldi" bildirimi gönderir', async () => {
    const received = [];
    const hook = http.createServer((req, res) => {
      let d = ''; req.on('data', c => d += c); req.on('end', () => { received.push(JSON.parse(d).content); res.end('ok'); });
    });
    const port = await listen(hook);
    cleanup.push(() => new Promise(r => hook.close(r)));
    process.env.ALERT_WEBHOOK_URL = `http://127.0.0.1:${port}/hook`;

    const sup = createSupervisor(FAST);
    let healthy = false;
    sup.register('Veri Deposu', { check: async () => ({ ok: healthy, detail: 'yazılamıyor' }), heal: async () => {} });
    for (let t = 0; t <= 30000; t += 500) await sup.tick(t);
    const alerts = received.filter(m => m.includes('düzelmedi'));
    assert.equal(alerts.length, 1, 'uyarı tekrarlanmamalı');
    assert.match(alerts[0], /Veri Deposu/);

    healthy = true;
    await sup.tick(31000);
    assert.equal(received.filter(m => m.includes('yeniden sağlıklı')).length, 1);
    assert.match(received.at(-1), /yeniden başlatılmadı/);
  });

  it('Discord: kopunca aynı süreçte destroy+login ile yeniden bağlanır; ilk bağlantıya karışmaz', async () => {
    const calls = [];
    const client = {
      readyTimestamp: null,
      ws: { status: 5 },
      isReady() { return this.ws.status === 0; },
      async destroy() { calls.push('destroy'); this.ws.status = 5; },
      async login(token) { calls.push(`login:${token}`); this.ws.status = 0; this.readyTimestamp = Date.now(); },
      channels: { cache: new Map(), fetch: async () => null }
    };
    const sup = createSupervisor(FAST);
    sup.registerDiscord(client, { token: 'TKN' });

    for (let t = 0; t < 10; t++) await sup.tick(t * 1000);
    assert.deepEqual(calls, [], 'hiç hazır olmadıysa ilk bağlanma döngüsüne karışmamalı');

    client.readyTimestamp = Date.now(); client.ws.status = 0;
    await sup.tick(20000);
    assert.deepEqual(calls, [], 'sağlıklıyken dokunmamalı');

    client.ws.status = 5; // gateway koptu
    for (let t = 21000; t <= 25000; t += 1000) await sup.tick(t); // 5 başarısız kontrol
    assert.deepEqual(calls, [], 'discord.js kendi yeniden bağlanması için tolerans (6 kontrol)');
    await sup.tick(26000);
    assert.deepEqual(calls, ['destroy', 'login:TKN']);
    assert.equal(client.isReady(), true);
    assert.equal(sup.getStatus()[0].status, 'ok');
  });

  it('Web: sunucu kapanırsa aynı portta yeniden dinletir', async () => {
    const server = http.createServer((req, res) => res.end('ok'));
    const port = await listen(server);
    cleanup.push(() => new Promise(r => (server.listening ? server.close(r) : r())));

    const sup = createSupervisor(FAST);
    sup.registerWeb(server, { port });
    await sup.tick(0);
    assert.equal(sup.getStatus()[0].status, 'ok');

    await new Promise(r => server.close(r));
    assert.equal(server.listening, false);
    await sup.tick(1000); await sup.tick(2000);
    assert.equal(server.listening, true, 'sunucu yeniden dinlemeye başlamalı');
    const body = await new Promise((resolve, reject) => http.get({ host: '127.0.0.1', port }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); }).on('error', reject));
    assert.equal(body, 'ok');
  });

  it('Web: bakım sayfası (503) sunucunun ayakta olduğu anlamına gelir', async () => {
    const server = http.createServer((req, res) => { res.statusCode = 503; res.end('bakim'); });
    const port = await listen(server);
    cleanup.push(() => new Promise(r => server.close(r)));
    let heals = 0;
    const sup = createSupervisor(FAST);
    sup.registerWeb(server, { port });
    const original = server.listen.bind(server);
    server.listen = (...a) => { heals++; return original(...a); };
    for (let t = 0; t < 5; t++) await sup.tick(t * 1000);
    assert.equal(heals, 0);
    assert.equal(sup.getStatus()[0].status, 'ok');
  });

  it('Web: yanıt vermeyen sunucuda takılı bağlantıları temizler', async () => {
    let hang = true;
    const server = http.createServer((req, res) => { if (!hang) res.end('ok'); });
    const port = await listen(server);
    cleanup.push(() => new Promise(r => { server.closeAllConnections(); server.close(r); }));
    let cleared = 0;
    const orig = server.closeAllConnections.bind(server);
    server.closeAllConnections = () => { cleared++; hang = false; orig(); };
    const sup = createSupervisor({ ...FAST, checkTimeoutMs: 6000 });
    sup.registerWeb(server, { port });
    await sup.tick(0); await sup.tick(1000);
    assert.equal(cleared, 1);
    assert.equal(sup.getStatus()[0].status, 'ok');
  });
});

// ── Portu tutan eski HA yedek süreci ──
const { evictStaleStandby } = require('../bot/services/selfHealingService');

describe('evictStaleStandby', () => {
  const standbyBody = JSON.stringify({ status: 'standby', mode: 'standby', node: 'vds' });
  const base = (over = {}) => {
    const killed = [];
    return {
      killed,
      deps: {
        getHealth: async () => standbyBody,
        findPids: () => [4242],
        readCmdline: () => 'node /home/ubuntu/bemsentara/haBoot.js',
        kill: (pid) => killed.push(pid),
        waitMs: 0,
        ...over
      }
    };
  };

  it('kills only a node haBoot/index.js process that reports standby', async () => {
    const { deps, killed } = base();
    assert.deepEqual(await evictStaleStandby(3000, deps), [4242]);
    assert.deepEqual(killed, [4242]);
  });

  it('leaves the port holder alone when it is not a standby', async () => {
    for (const body of ['{"status":"ok"}', '<html>nginx</html>', '']) {
      const { deps, killed } = base({ getHealth: async () => body });
      assert.deepEqual(await evictStaleStandby(3000, deps), []);
      assert.deepEqual(killed, []);
    }
  });

  it('never kills unrelated processes or itself', async () => {
    const { deps, killed } = base({
      findPids: () => [process.pid, 1, 77],
      readCmdline: (pid) => (pid === 77 ? 'python3 server.py' : 'node haBoot.js')
    });
    assert.deepEqual(await evictStaleStandby(3000, deps), [1]);
    assert.deepEqual(killed, [1]);
  });

  it('end-to-end: supervisor evicts a real stale standby and takes the port', async () => {
    const { spawn } = require('child_process');
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'standby-'));
    const script = path.join(dir, 'haBoot.js');
    fs.writeFileSync(script, `require('http').createServer((q, r) => { r.statusCode = q.url.startsWith('/api/health') ? 200 : 503; r.end(JSON.stringify({ status: 'standby', mode: 'standby', node: 't' })); }).listen(+process.argv[2], () => console.log('up'));`);
    const port = 39000 + Math.floor(Math.random() * 500);
    const child = spawn(process.execPath, [script, String(port)], { stdio: ['ignore', 'pipe', 'ignore'] });
    await new Promise((r) => child.stdout.once('data', r));

    const server = http.createServer((req, res) => res.end('app'));
    const sup = createSupervisor(FAST);
    sup.registerWeb(server, { port, evictDeps: { waitMs: 300 } });
    try {
      for (let i = 0; i < 40 && !server.listening; i++) { await sup.tick(); await new Promise((r) => setTimeout(r, 50)); }
      assert.ok(server.listening, 'uygulama portu devralmalı');
      assert.ok(child.exitCode !== null || child.signalCode !== null, 'eski yedek süreç kapanmalı');
    } finally {
      sup.stop();
      server.close();
      if (child.exitCode === null) child.kill('SIGKILL');
    }
  });
});
