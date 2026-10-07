'use strict';

/**
 * haBoot.js — HA başlatıcısı. `index.js` de başlangıçta buraya devreder; yani sunucuda süreç
 * `npm start`, `node index.js` ya da `node haBoot.js` ile açılsa da aynı yol izlenir.
 *
 * HA şu durumda açıktır: MONGODB_URI tanımlı ve HA_ENABLED=0 DEĞİL. Açıkken önce liderlik kirası
 * alınır. Kira başka makinedeyse bu makine YEDEK modda bekler (yalnızca /api/health cevaplar) ve lider
 * düşünce devralır. Devralmada (veya taze/geçici diskte) data/*.json dosyaları MongoDB'deki kopyadan
 * geri yüklenir. HA kapalıysa doğrudan index.js çalışır.
 *
 * Roller (HA_ROLE=primary|standby, varsayılan: Render'da standby, diğer her yerde primary):
 *  - standby: MongoDB'ye ulaşamazsa asla lider olmaz (çift bot riskine karşı güvenli taraf).
 *  - primary: MongoDB'ye HA_BOOT_FAILOPEN_MS (varsayılan 120 sn) boyunca ulaşamazsa kirasız başlar,
 *    böylece MongoDB kesintisi tek başına botu düşürmez. MongoDB geri gelince kira alınır; kira başka
 *    makinedeyse bu süreç kendini kapatır (fencing).
 *
 * Lider, kirayı yenilerken başkasına geçtiğini öğrenirse kendini kapatır (iki lider olmaz). Çıkarken
 * (deploy/yeniden başlatma) son veri kopyası yazılır ve kira bırakılır; aynı makine liderliği hemen geri alır.
 */

require('dotenv').config();

const http = require('http');
const os = require('os');
const path = require('path');

const HA_ENABLED = !!process.env.MONGODB_URI && process.env.HA_ENABLED !== '0';

// index.js giriş modülüyken HA'ya devredip erken döndüyse modül önbellekte durur ve yeniden
// çalıştırılmaz; bu yüzden önbellekten silip asıl uygulamayı gerçekten çalıştırırız.
function loadApp() {
  delete require.cache[require.resolve('./index')];
  require('./index');
}

if (!HA_ENABLED) {
  if (process.env.HA_ENABLED === '1') console.warn('[HA] HA_ENABLED=1 ama MONGODB_URI yok; HA devre dışı, normal başlatılıyor.');
  process.env.HA_BOOTED = '1';
  loadApp();
} else {
  process.env.HA_BOOTED = '1';
  runHa().catch((err) => {
    console.error('[HA] Başlatıcı hatası:', err && err.stack || err);
    process.exit(1);
  });
}

async function runHa() {
  const mongoose = require('mongoose');
  const { MongoLeaseBackend, waitForLeadership, startRenewal, newHolderId } = require('./bot/services/haLeaseService');
  const { restoreSnapshots, startSnapshotPusher, needsRestore, markLeader } = require('./bot/services/dataSnapshotService');

  const node = process.env.HA_NODE_NAME || (process.env.RENDER ? 'render' : os.hostname());
  const role = process.env.HA_ROLE || (process.env.RENDER ? 'standby' : 'primary');
  const ttlMs = Number(process.env.HA_LEASE_TTL_MS) || 35000;
  const renewMs = Number(process.env.HA_RENEW_MS) || Math.floor(ttlMs / 3.5); // TTL'nin çok altında yenile
  const snapshotMs = Number(process.env.HA_SNAPSHOT_INTERVAL_MS) || 30000;
  const failOpenMs = process.env.HA_BOOT_FAILOPEN_MS !== undefined ? Number(process.env.HA_BOOT_FAILOPEN_MS) : 120000;
  const port = Number(process.env.PORT) || 3000;
  const dataDir = path.join(__dirname, 'data');
  const log = (msg) => console.log(`[HA ${node}] ${msg}`);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Çıkış kancası için ortak durum
  const ctx = { backend: null, holder: null, pusher: null, renewal: null, fenced: false };

  const installExitHook = () => {
    const realExit = process.exit.bind(process);
    let exiting = false;
    process.exit = (code) => {
      if (exiting) return realExit(code);
      exiting = true;
      if (ctx.renewal) ctx.renewal.stop();
      const finish = () => realExit(code);
      setTimeout(finish, 4000).unref(); // takılırsa yine de çık
      (async () => {
        try {
          if (!ctx.fenced && ctx.backend && ctx.holder) {
            if (ctx.pusher) await ctx.pusher.flush();
            await ctx.backend.release({ holder: ctx.holder, now: Date.now() });
            log('Çıkış: son veri kopyası yazıldı, liderlik kirası bırakıldı.');
          }
        } catch (_) { /* en iyi çaba */ }
        finish();
      })();
    };
  };

  const fence = (reason) => {
    ctx.fenced = true;
    log(`LİDERLİK KAYBEDİLDİ (${reason}). Çift lider olmaması için süreç kapatılıyor; yeniden açılınca yedek modda bekleyecek.`);
    process.exit(0);
  };

  // 1) Yedek modda sağlık ucu: Render gibi platformlar bir port dinlenmesini bekler.
  const standby = http.createServer((req, res) => {
    const isHealth = req.url && req.url.startsWith('/api/health');
    res.statusCode = isHealth ? 200 : 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (!isHealth) res.setHeader('Retry-After', '30');
    res.end(JSON.stringify(isHealth
      ? { status: 'standby', mode: 'standby', node }
      : { error: 'Bu düğüm yedek modda; aktif düğüm başka makinede çalışıyor.' }));
  });
  await new Promise((resolve) => standby.listen(port, resolve));
  log(`Yedek sağlık ucu :${port} üzerinde dinleniyor (rol: ${role}).`);
  const closeStandby = () => new Promise((resolve) => {
    if (typeof standby.closeAllConnections === 'function') standby.closeAllConnections();
    standby.close(resolve);
  });

  const connect = () => mongoose.createConnection(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).asPromise();

  // 2) Ortak MongoDB bağlantısı. Birincil düğüm sınırlı süre dener; yedek düğüm sonsuza dek bekler.
  const startedAt = Date.now();
  let conn = null;
  for (;;) {
    try { conn = await connect(); break; } catch (err) {
      const waited = Date.now() - startedAt;
      if (role === 'primary' && waited >= failOpenMs) break;
      log(`MongoDB'ye ulaşılamadı (${err.message}), yedek modda yeniden denenecek.`);
      await sleep(10000);
    }
  }

  // 2b) Birincil düğüm, MongoDB yokken kirasız başlar; MongoDB gelince kira alınır veya süreç kapanır.
  if (!conn) {
    log(`MongoDB ${Math.round(failOpenMs / 1000)} sn'dir yok: birincil düğüm kirasız başlatılıyor (MongoDB gelince kira kontrol edilecek).`);
    await closeStandby();
    installExitHook();
    loadApp();
    (async () => {
      let c;
      for (;;) { try { c = await connect(); break; } catch (_) { await sleep(10000); } }
      const backend = new MongoLeaseBackend(c.db.collection('ha_lease'));
      const holder = newHolderId(node);
      const res = await backend.acquire({ holder, node, ttlMs, now: Date.now() }).catch(() => ({ acquired: true }));
      if (!res.acquired) return fence('MongoDB geri geldi, kira başka düğümde');
      Object.assign(ctx, { backend, holder });
      ctx.pusher = startSnapshotPusher({ collection: c.db.collection('ha_file_snapshots'), dir: dataDir, intervalMs: snapshotMs, log });
      ctx.renewal = startRenewal({ backend, node, holder, ttlMs, intervalMs: renewMs, log, onLost: fence });
      log('MongoDB geri geldi, liderlik kirası alındı.');
    })().catch(() => {});
    return;
  }

  const backend = new MongoLeaseBackend(conn.db.collection('ha_lease'));
  const snapshots = conn.db.collection('ha_file_snapshots');

  // 3) Lider olana kadar bekle
  const { holder, takeover, firstEver } = await waitForLeadership({ backend, node, ttlMs, pollMs: renewMs, log });
  log(`LİDER oldum (${firstEver ? 'ilk lider' : takeover ? 'devralma' : 'aynı makine yeniden başladı'}).`);
  await closeStandby();

  // 4) Devralmada veya yerel disk taze/geçici ise (Render), güncel dosya verisini MongoDB'den geri yükle.
  //    index.js dosyaları okumadan önce yapılmalı.
  if (needsRestore({ takeover, dir: dataDir })) {
    try {
      const restored = await restoreSnapshots({ collection: snapshots, dir: dataDir });
      log(`${restored.length} veri dosyası MongoDB'den geri yüklendi (${takeover ? 'devralma' : 'taze disk'}).`);
    } catch (err) {
      log(`Veri geri yükleme hatası (yerel dosyalarla devam): ${err.message}`);
    }
  }
  markLeader({ dir: dataDir, node });

  // 5) Kirayı yenile, dosya verisini yansıt, çıkışta bırak
  Object.assign(ctx, { backend, holder });
  ctx.pusher = startSnapshotPusher({ collection: snapshots, dir: dataDir, intervalMs: snapshotMs, log });
  ctx.renewal = startRenewal({ backend, node, holder, ttlMs, intervalMs: renewMs, log, onLost: fence });
  installExitHook();

  // 6) Asıl uygulama
  loadApp();
}
