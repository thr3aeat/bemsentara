'use strict';

const { execSync } = require('child_process');
const logger = require('../../utils/logger');

let isDeploying = false;
let watcherTimer = null;

/**
 * Uzak depoyu (origin/main) kontrol eder. Yeni bir git push varsa
 * kodu çeker (pull) ve botu yeniden başlatır.
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
      logger.info('[GitAutoDeploy] Kod güncelleniyor (git pull origin main)...');

      const pullOutput = execSync('git pull origin main', { encoding: 'utf8', timeout: 30000 });
      logger.success(`[GitAutoDeploy] Güncelleme tamamlandı:\n${pullOutput}`);

      // Eğer package.json değiştiyse hızlı npm install
      if (pullOutput.includes('package.json')) {
        logger.info('[GitAutoDeploy] Paket bağımlılıkları güncelleniyor (npm install)...');
        try {
          execSync('npm install --production --prefer-offline', { encoding: 'utf8', timeout: 60000 });
        } catch (npmErr) {
          logger.warn(`[GitAutoDeploy] npm install uyarısı: ${npmErr.message}`);
        }
      }

      logger.success('[GitAutoDeploy] Sistem yeniden başlatılıyor (PM2 otomatik ayağa kaldıracak)...');
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    }
  } catch (err) {
    // Sessizce yut veya warn bas (ağ kesintisi vb. durumlar botu çökertmesin)
    if (!err.message.includes('not a git repository')) {
      logger.warn(`[GitAutoDeploy] Kontrol uyarısı: ${err.message}`);
    }
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
