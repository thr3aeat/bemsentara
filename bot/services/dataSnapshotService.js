'use strict';

/**
 * dataSnapshotService.js
 *
 * Ana veri deposu (Store) MongoDB'ye yazılır, ama RobloxLand vb. servisler `data/*.json`
 * dosyalarını doğrudan kullanır. Başka bir makine devraldığında bu dosyaların güncel olması için
 * lider makine bu dosyaları değiştikçe MongoDB'ye yansıtır; devralan makine açılışta geri yükler.
 *
 * Yalnızca `data/` klasöründeki üst düzey .json dosyaları kopyalanır. Makineye özgü dosyalar
 * (bakım durumu, yeniden başlatma kaydı, izleme durumu, dosya tabanlı Store yedeği) hariçtir.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXCLUDED = new Set([
  'maintenance.json',          // makineye özgü bakım bayrağı
  'last_restart_state.json',   // makineye özgü
  'domain_monitor_state.json', // makineye özgü uyarı mesajı kimliği
  'store.json'                 // Mongo aktifken Store zaten Mongo'dan yüklenir
]);

function listDataFiles(dir) {
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.json') && !EXCLUDED.has(f));
  } catch (_) {
    return [];
  }
}

const sha1 = (text) => crypto.createHash('sha1').update(text).digest('hex');

/**
 * Değişen dosyaları koleksiyona yazar. `knownShas` çağrılar arasında korunur.
 * @returns {Promise<string[]>} yazılan dosya adları
 */
async function pushSnapshots({ collection, dir, knownShas, now = Date.now }) {
  const pushed = [];
  for (const file of listDataFiles(dir)) {
    let content;
    try { content = fs.readFileSync(path.join(dir, file), 'utf8'); } catch (_) { continue; }
    if (!content) continue; // yarım yazılmış/boş dosyayla gerçek kopyayı ezme
    const sha = sha1(content);
    if (knownShas.get(file) === sha) continue;
    await collection.replaceOne({ _id: file }, { _id: file, content, sha, updatedAt: now() }, { upsert: true });
    knownShas.set(file, sha);
    pushed.push(file);
  }
  return pushed;
}

/**
 * Koleksiyondaki kopyaları yerel dosyalara yazar (atomik: önce geçici dosya, sonra yeniden adlandırma).
 * Bozuk JSON içeren kopyalar atlanır.
 * @returns {Promise<string[]>} geri yüklenen dosya adları
 */
async function restoreSnapshots({ collection, dir }) {
  const restored = [];
  fs.mkdirSync(dir, { recursive: true });
  const docs = await collection.find({}).toArray();
  for (const doc of docs) {
    const file = String(doc._id);
    if (EXCLUDED.has(file) || path.basename(file) !== file || !file.endsWith('.json')) continue;
    try { JSON.parse(doc.content); } catch (_) { continue; }
    const target = path.join(dir, file);
    const tmp = `${target}.restore.tmp`;
    fs.writeFileSync(tmp, doc.content, 'utf8');
    fs.renameSync(tmp, target);
    restored.push(file);
  }
  return restored;
}

const MARKER = '.ha_leader_node';

/**
 * Yerel dosyalara güvenilir mi? Devralmada hayır. Aynı makine yeniden başladıysa yalnızca disk kalıcıysa
 * (işaret dosyası duruyorsa) evet; Render gibi geçici disklerde işaret dosyası yoktur ve dosyalar
 * git'teki eski kopyadır, bu yüzden her zaman MongoDB'den geri yüklenir.
 */
function needsRestore({ takeover, dir }) {
  return !!takeover || !fs.existsSync(path.join(dir, MARKER));
}

function markLeader({ dir, node }) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, MARKER), String(node), 'utf8');
  } catch (_) { /* işaret yazılamazsa bir sonraki açılışta geri yükleme yapılır (güvenli taraf) */ }
}

function startSnapshotPusher({ collection, dir, intervalMs = 30000, log = () => {} }) {
  const knownShas = new Map();
  let busy = false;
  const run = async () => {
    if (busy) return [];
    busy = true;
    try {
      const pushed = await pushSnapshots({ collection, dir, knownShas });
      if (pushed.length) log(`${pushed.length} veri dosyası MongoDB'ye yansıtıldı (${pushed.join(', ')}).`);
      return pushed;
    } catch (err) {
      log(`Veri dosyası yansıtma hatası: ${err.message}`);
      return [];
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return { flush: run, stop: () => clearInterval(timer) };
}

module.exports = { pushSnapshots, restoreSnapshots, startSnapshotPusher, listDataFiles, needsRestore, markLeader, EXCLUDED };
