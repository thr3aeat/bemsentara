'use strict';

/**
 * haLeaseService.js
 *
 * Aktif/yedek (active/standby) çalışma için "liderlik kirası". Aynı bot token'ı ve aynı veriyle
 * birden çok makinede (örn. VDS + Render) süreç çalıştırılır ama yalnızca kirayı elinde tutan
 * makine botu ve siteyi çalıştırır. Kira ortak MongoDB'de tek bir belgedir:
 *
 *   { _id: 'leader', holder: <süreç kimliği>, node: <makine adı>, expiresAt: <ms> }
 *
 * - Alma/yenileme tek atomik işlemdir: kira ya benimdir ya da süresi dolmuştur.
 * - Lider kirayı düzenli yeniler. Yenilemeler ardışık başarısız olur ve kira başkasına geçerse
 *   lider kendini kapatır (fencing); böylece iki makine aynı anda lider olamaz.
 * - Veritabanına ulaşılamaması liderliği düşürmez (fail-open): kesintisiz çalışma önceliklidir.
 *   Yalnızca "kira artık başkasında" kesin bilgisi lideri durdurur.
 */

const crypto = require('crypto');

const LEASE_ID = 'leader';

class MongoLeaseBackend {
  /** @param {import('mongodb').Collection} collection */
  constructor(collection) {
    this.col = collection;
  }

  /**
   * Kirayı al veya yenile.
   * @returns {Promise<{acquired: boolean, previous: object|null}>}
   */
  async acquire({ holder, node, ttlMs, now }) {
    const filter = { _id: LEASE_ID, $or: [{ holder }, { expiresAt: { $lte: now } }] };
    try {
      const previous = await this.col.findOneAndUpdate(
        filter,
        { $set: { holder, node, expiresAt: now + ttlMs, renewedAt: now } },
        { upsert: true, returnDocument: 'before' }
      );
      return { acquired: true, previous: previous || null };
    } catch (err) {
      if (err && err.code === 11000) return { acquired: false, previous: null }; // kira başkasında
      throw err;
    }
  }

  async release({ holder, now }) {
    await this.col.updateOne({ _id: LEASE_ID, holder }, { $set: { expiresAt: now - 1 } });
  }

  async current() {
    return this.col.findOne({ _id: LEASE_ID });
  }
}

/** Test ve tek makineli deneme için bellek içi uygulama (aynı sözleşme). */
class MemoryLeaseBackend {
  constructor() { this.doc = null; }

  async acquire({ holder, node, ttlMs, now }) {
    const free = !this.doc || this.doc.holder === holder || this.doc.expiresAt <= now;
    if (!free) return { acquired: false, previous: null };
    const previous = this.doc ? { ...this.doc } : null;
    this.doc = { _id: LEASE_ID, holder, node, expiresAt: now + ttlMs, renewedAt: now };
    return { acquired: true, previous };
  }

  async release({ holder, now }) {
    if (this.doc && this.doc.holder === holder) this.doc.expiresAt = now - 1;
  }

  async current() { return this.doc; }
}

function newHolderId(node) {
  return `${node}:${process.pid}:${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Lider olana kadar bekler.
 * @returns {Promise<{holder: string, takeover: boolean}>} takeover: önceki lider başka makineydi
 */
async function waitForLeadership({ backend, node, holder = newHolderId(node), ttlMs = 35000, pollMs = 10000, log = () => {}, sleep = (ms) => new Promise(r => setTimeout(r, ms)), now = Date.now }) {
  let lastState = null;
  for (;;) {
    let state;
    try {
      const res = await backend.acquire({ holder, node, ttlMs, now: now() });
      if (res.acquired) {
        const takeover = !!res.previous && res.previous.node !== node;
        return { holder, takeover, firstEver: !res.previous };
      }
      state = 'standby';
    } catch (err) {
      state = `db-error:${err.message}`; // veritabanı yoksa lider olunmaz (açılışta güvenli taraf)
    }
    if (state !== lastState) log(state === 'standby' ? 'Kira başka düğümde, yedek modda bekleniyor.' : `Kira alınamadı (${state}), yedek modda bekleniyor.`);
    lastState = state;
    await sleep(pollMs);
  }
}

/**
 * Kirayı düzenli yeniler. Kira kesin olarak başkasına geçtiyse onLost çağrılır (bir kez).
 * @returns {{stop: () => void}}
 */
function startRenewal({ backend, node, holder, ttlMs = 35000, intervalMs = 10000, onLost, log = () => {}, now = Date.now }) {
  let lost = false;
  let busy = false;
  const timer = setInterval(async () => {
    if (busy || lost) return;
    busy = true;
    try {
      const res = await backend.acquire({ holder, node, ttlMs, now: now() });
      if (!res.acquired) {
        lost = true;
        clearInterval(timer);
        onLost('kira başka düğüme geçti');
      }
    } catch (err) {
      log(`Kira yenilenemedi (veritabanı erişimi yok), liderlik korunuyor: ${err.message}`);
    } finally {
      busy = false;
    }
  }, intervalMs);
  timer.unref();
  return { stop: () => clearInterval(timer) };
}

module.exports = { MongoLeaseBackend, MemoryLeaseBackend, newHolderId, waitForLeadership, startRenewal, LEASE_ID };
