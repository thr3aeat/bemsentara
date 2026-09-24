/**
 * VDS Auxiliary Integration Client for BEM/Sentara
 * 
 * BU MODÜL RENDER'IN ANA ÇALIŞMASINI ASLA DURDURMAZ VEYA BOZMAZ.
 * Circuit Breaker ve kısa timeout (varsayılan 2000ms) ile çalışır.
 * VDS kapalıysa, ağ koparsa veya timeout olursa:
 * - Hata fırlatmaz (asla crash etmez)
 * - Render ana akışına kesintisiz devam eder
 * - VDS_AVAILABLE = false durumuna geçer
 */

const axios = require('axios');
const logger = require('./logger');

const VDS_ENABLED = process.env.VDS_ENABLED === 'true';
const VDS_API_URL = (process.env.VDS_API_URL || '').replace(/\/+$/, '');
const VDS_SERVICE_TOKEN = process.env.VDS_SERVICE_TOKEN || '';
const VDS_TIMEOUT_MS = parseInt(process.env.VDS_TIMEOUT_MS || '2000', 10);

// Circuit Breaker Durumu
let isVdsCircuitOpen = false;
let nextCircuitRetry = 0;
const CIRCUIT_COOLDOWN_MS = 60000; // Hata durumunda 1 dakika VDS'i rahatsız etme

function isCircuitAvailable() {
  if (!VDS_ENABLED) return false;
  if (!isVdsCircuitOpen) return true;
  if (Date.now() > nextCircuitRetry) {
    isVdsCircuitOpen = false;
    return true;
  }
  return false;
}

function tripCircuit(reason) {
  isVdsCircuitOpen = true;
  nextCircuitRetry = Date.now() + CIRCUIT_COOLDOWN_MS;
  logger.warn(`[VDS-CircuitBreaker] VDS geçici olarak devre dışı (Neden: ${reason}). ${CIRCUIT_COOLDOWN_MS / 1000}s sonra tekrar denenecek.`);
}

/**
 * VDS Sağlık Kontrolü
 */
async function checkVdsHealth() {
  if (!isCircuitAvailable()) return { available: false, reason: 'disabled_or_circuit_open' };

  try {
    const res = await axios.get(`${VDS_API_URL}/health`, {
      timeout: VDS_TIMEOUT_MS,
    });
    return { available: true, data: res.data };
  } catch (err) {
    tripCircuit(err.message);
    return { available: false, error: err.message };
  }
}

/**
 * Render'dan VDS'e Asenkron Veri Snapshot Yedekleme
 * @param {string} name - Yedek adı (örn: 'store_snapshot')
 * @param {object} data - JSON veri nesnesi
 */
async function sendBackupToVds(name, data) {
  if (!isCircuitAvailable()) return { success: false, fallback: true };

  try {
    const res = await axios.post(
      `${VDS_API_URL}/backup`,
      { name, data },
      {
        headers: {
          'Authorization': `Bearer ${VDS_SERVICE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: Math.max(VDS_TIMEOUT_MS, 5000), // Yedek için max 5s
      }
    );
    return { success: true, data: res.data };
  } catch (err) {
    tripCircuit(err.message);
    return { success: false, fallback: true, error: err.message };
  }
}

/**
 * Render'dan VDS'e Dosya / Görsel Depolama
 */
async function storeFileOnVds(filename, bufferOrBase64) {
  if (!isCircuitAvailable()) return { success: false, fallback: true };

  try {
    const base64Content = Buffer.isBuffer(bufferOrBase64)
      ? bufferOrBase64.toString('base64')
      : String(bufferOrBase64);

    const res = await axios.post(
      `${VDS_API_URL}/storage/save`,
      { filename, base64Content },
      {
        headers: {
          'Authorization': `Bearer ${VDS_SERVICE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: Math.max(VDS_TIMEOUT_MS, 4000),
      }
    );
    return { success: true, data: res.data };
  } catch (err) {
    tripCircuit(err.message);
    return { success: false, fallback: true, error: err.message };
  }
}

/**
 * Arka Plan İşi Gönderme (Queue Job)
 */
async function queueJobOnVds(type, payload = {}) {
  if (!isCircuitAvailable()) return { success: false, fallback: true };

  try {
    const res = await axios.post(
      `${VDS_API_URL}/jobs`,
      { type, payload },
      {
        headers: {
          'Authorization': `Bearer ${VDS_SERVICE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: VDS_TIMEOUT_MS,
      }
    );
    return { success: true, data: res.data };
  } catch (err) {
    tripCircuit(err.message);
    return { success: false, fallback: true, error: err.message };
  }
}

module.exports = {
  isVdsEnabled: () => VDS_ENABLED,
  checkVdsHealth,
  sendBackupToVds,
  storeFileOnVds,
  queueJobOnVds,
};
