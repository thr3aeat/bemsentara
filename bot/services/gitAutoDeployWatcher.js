'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../../utils/logger');

let isDeploying = false;
let watcherTimer = null;

/**
 * Uzak depoyu (origin/main) kontrol eder. Yeni bir git push varsa
 * kodu çeker ve botu yeniden başlatır.
 */
async function checkAndDeploy() {
  if (isDeploying) return;

  try {
    // Git durumunu kontrol et
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8', timeout: 4000 }).trim();
    if (!remoteUrl) return;

    // Uzaktaki commit'leri getir
    execSync('git fetch origin main --quiet', { encoding: 'utf8', timeout: 15000 });

    const localCommit = execSync('git rev-parse HEAD', { encoding: 'utf8', timeout: 4000 }).trim();
    const remoteCommit = execSync('git rev-parse origin/main', { encoding: 'utf8', timeout: 4000 }).trim();

    if (localCommit && remoteCommit && localCommit !== remoteCommit) {
      isDeploying = true;
      logger.info(`[GitAutoDeploy] 🚀 Yeni git push algılandı! Local: ${localCommit.slice(0, 7)} ➔ Remote: ${remoteCommit.slice(0, 7)}`);
      logger.info('[GitAutoDeploy] Kod güncelleniyor (güvenli sync & backup)...');

      // 1. Çalışma zamanı verilerini korumak için geçici yedek al
      const backupDir = path.join(process.cwd(), 'data_runtime_backup');
      const dataDir = path.join(process.cwd(), 'data');
      const statusFile = path.join(process.cwd(), 'bot', 'status_state.json');

      try {
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        if (fs.existsSync(dataDir)) {
          execSync(`cp -a "${dataDir}/"* "${backupDir}/" 2>/dev/null || true`);
        }
        if (fs.existsSync(statusFile)) {
          execSync(`cp -a "${statusFile}" "${backupDir}/status_state.json" 2>/dev/null || true`);
        }
      } catch (backupErr) {
        logger.warn(`[GitAutoDeploy] Yedekleme uyarısı: ${backupErr.message}`);
      }

      // 2. Kodları origin/main seviyesine sıfırla (merge conflict oluşmasını engeller)
      execSync('git fetch origin main', { encoding: 'utf8', timeout: 30000 });
      const resetOutput = execSync('git reset --hard origin/main', { encoding: 'utf8', timeout: 30000 });
      logger.success(`[GitAutoDeploy] Güncelleme tamamlandı:\n${resetOutput}`);

      // 3. Çalışma zamanı verilerini geri yükle
      try {
        if (fs.existsSync(backupDir)) {
          execSync(`cp -a "${backupDir}/"* "${dataDir}/" 2>/dev/null || true`);
          if (fs.existsSync(path.join(backupDir, 'status_state.json'))) {
            execSync(`cp -a "${path.join(backupDir, 'status_state.json')}" "${statusFile}" 2>/dev/null || true`);
          }
        }
      } catch (restoreErr) {
        logger.warn(`[GitAutoDeploy] Veri geri yükleme uyarısı: ${restoreErr.message}`);
      }

      // 4. Eğer package.json değiştiyse hızlı npm install
      try {
        const gitDiff = execSync(`git diff --name-only ${localCommit} origin/main`, { encoding: 'utf8', timeout: 10000 });
        if (gitDiff.includes('package.json')) {
          logger.info('[GitAutoDeploy] Paket bağımlılıkları güncelleniyor (npm install)...');
          execSync('npm install --production --prefer-offline', { encoding: 'utf8', timeout: 60000 });
        }
      } catch (npmErr) {
        logger.warn(`[GitAutoDeploy] npm install uyarısı: ${npmErr.message}`);
      }

      logger.success('[GitAutoDeploy] Sistem yeniden başlatılıyor (PM2 otomatik ayağa kaldıracak)...');
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    }
  } catch (err) {
    if (!err.message.includes('not a git repository')) {
      logger.warn(`[GitAutoDeploy] Kontrol uyarısı: ${err.message}`);
    }
  } finally {
    isDeploying = false;
  }
}

/**
 * GitHub Webhook üzerinden anında tetiklendiğinde çalışır.
 */
async function triggerImmediateDeploy() {
  logger.info('[GitAutoDeploy] Webhook üzerinden anında deploy tetiklendi!');
  await checkAndDeploy();
}

/**
 * 30 saniyede bir otomatik git watcher döngüsünü başlatır.
 */
function startGitAutoDeployWatcher(intervalMs = 30000) {
  if (watcherTimer) clearInterval(watcherTimer);

  // İlk kontrol 5 sn sonra
  setTimeout(() => {
    checkAndDeploy().catch(() => {});
  }, 5000);

  watcherTimer = setInterval(() => {
    checkAndDeploy().catch(() => {});
  }, intervalMs);

  logger.info(`[GitAutoDeploy] Otomatik Git Push izleyicisi aktif (${intervalMs / 1000}s aralıklarla kontrol ediliyor).`);
}

function stopGitAutoDeployWatcher() {
  if (watcherTimer) {
    clearInterval(watcherTimer);
    watcherTimer = null;
  }
}

module.exports = {
  startGitAutoDeployWatcher,
  stopGitAutoDeployWatcher,
  checkAndDeploy,
  triggerImmediateDeploy
};
