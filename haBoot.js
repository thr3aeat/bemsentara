'use strict';

/**
 * haBoot.js — Başlatıcı (npm start / PM2 / systemd bunu çalıştırır).
 *
 * HA_ENABLED=1 ve MONGODB_URI tanımlıysa: önce liderlik kirası alınır. Kira başka makinedeyse bu
 * makine YEDEK modda bekler (yalnızca /api/health cevaplar, bot ve site çalışmaz) ve lider düşünce
 * devralır. Devralmada data/*.json dosyaları MongoDB'deki kopyadan geri yüklenir.
 * Aksi halde doğrudan index.js çalışır; yani HA kapalıyken hiçbir şey değişmez.
 *
 * Lider, kirayı yenilerken kirayın başkasına geçtiğini öğrenirse kendini kapatır (iki lider olmaz).
 * Çıkarken (deploy/yeniden başlatma) son veri kopyası yazılır ve kira bırakılır; böylece aynı makine
 * yeniden açıldığında liderliği hemen geri alır, yedek makine araya girmez.
 */

require('dotenv').config();

const http = require('http');
const os = require('os');
const path = require('path');

const HA_ENABLED = process.env.HA_ENABLED === '1' && !!process.env.MONGODB_URI;

if (!HA_ENABLED) {
  if (process.env.HA_ENABLED === '1') console.warn('[HA] HA_ENABLED=1 ama MONGODB_URI yok; HA devre dışı, normal başlatılıyor.');
  require('./index');
} else {
  runHa().catch((err) => {
    console.error('[HA] Başlatıcı hatası:', err && err.stack || err);
    process.exit(1);
  });
}

async function runHa() {
  const mongoose = require('mongoose');
  const { MongoLeaseBackend, waitForLeadership, startRenewal } = require('./bot/services/haLeaseService');
  const { restoreSnapshots, startSnapshotPusher, needsRestore, markLeader } = require('./bot/services/dataSnapshotService');

  const node = process.env.HA_NODE_NAME || os.hostname();
  const ttlMs = Number(process.env.HA_LEASE_TTL_MS) || 35000;
  const renewMs = Number(process.env.HA_RENEW_MS) || Math.floor(ttlMs / 3.5); // TTL'nin çok altında yenile
  const snapshotMs = Number(process.env.HA_SNAPSHOT_INTERVAL_MS) || 30000;
  const port = Number(process.env.PORT) || 3000;
  const dataDir = path.join(__dirname, 'data');
  const log = (msg) => console.log(`[HA ${node}] ${msg}`);

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
  log(`Yedek sağlık ucu :${port} üzerinde dinleniyor.`);

  // 2) Ortak MongoDB bağlantısı (başarısız olursa yedek modda yeniden dener)
  let conn;
  for (;;) {
    try {
      conn = await mongoose.createConnection(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).asPromise();
      break;
    } catch (err) {
      log(`MongoDB'ye ulaşılamadı (${err.message}), yedek modda yeniden denenecek.`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  const backend = new MongoLeaseBackend(conn.db.collection('ha_lease'));
  const snapshots = conn.db.collection('ha_file_snapshots');

  // 3) Lider olana kadar bekle
  const { holder, takeover, firstEver } = await waitForLeadership({ backend, node, ttlMs, pollMs: renewMs, log });
  log(`LİDER oldum (${firstEver ? 'ilk lider' : takeover ? 'devralma' : 'aynı makine yeniden başladı'}).`);

  await new Promise((resolve) => {
    if (typeof standby.closeAllConnections === 'function') standby.closeAllConnections();
    standby.close(resolve);
  });

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
  let fenced = false;
  const pusher = startSnapshotPusher({ collection: snapshots, dir: dataDir, intervalMs: snapshotMs, log });
  const renewal = startRenewal({
    backend, node, holder, ttlMs, intervalMs: renewMs, log,
    onLost: (reason) => {
      fenced = true;
      log(`LİDERLİK KAYBEDİLDİ (${reason}). Çift lider olmaması için süreç kapatılıyor; yeniden açılınca yedek modda bekleyecek.`);
      process.exit(0);
    }
  });

  const realExit = process.exit.bind(process);
  let exiting = false;
  process.exit = (code) => {
    if (exiting) return realExit(code);
    exiting = true;
    renewal.stop();
    const finish = () => realExit(code);
    setTimeout(finish, 4000).unref(); // takılırsa yine de çık
    (async () => {
      try {
        if (!fenced) {
          await pusher.flush();
          await backend.release({ holder, now: Date.now() });
          log('Çıkış: son veri kopyası yazıldı, liderlik kirası bırakıldı.');
        }
      } catch (_) { /* en iyi çaba */ }
      finish();
    })();
  };

  // 6) Asıl uygulama
  require('./index');
}
