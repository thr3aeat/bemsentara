'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { isSiteAdmin } = require('../../utils/adminCheck');
const logger = require('../../utils/logger');

// Bakım dosyası yolu
const maintPath = path.join(__dirname, '../../maintenance.json');

/**
 * 1031620522406072350 veya Site Admin yetki kontrolü
 */
function isAuthorizedBotManager(user) {
  if (!user || user.isBanned) return false;
  const discordId = String(user.discordId || user.id || '').trim();
  if (discordId === '1031620522406072350') return true;
  if (user.isAdmin || isSiteAdmin(user)) return true;
  if (Array.isArray(user.roles) && (user.roles.includes('admin') || user.roles.includes('yonetim'))) return true;
  return false;
}

function botManagerGuard(req, res, next) {
  if (!req.user || !isAuthorizedBotManager(req.user)) {
    return res.status(403).json({
      success: false,
      error: 'Bu işlem yalnızca yetkili kullanıcı (1031620522406072350) ve EkoYıldız başyöneticilerine açıktır.'
    });
  }
  next();
}

/**
 * GET /api/admin/bot-control/status
 * Botun canlı durumunu ve bakım modunu döner
 */
router.get('/status', botManagerGuard, (req, res) => {
  try {
    let isMaintenance = false;
    let maintReason = '';
    let maintSince = null;

    if (fs.existsSync(maintPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(maintPath, 'utf8'));
        isMaintenance = !!data.active;
        maintReason = data.reason || 'Sistem bakım ve optimizasyon çalışması';
        maintSince = data.since || null;
      } catch (_) {}
    }

    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    const client = global.client || null;
    const ping = client && client.ws ? Math.round(client.ws.ping) : null;
    const guildCount = client && client.guilds ? client.guilds.cache.size : null;
    const userCount = client && client.users ? client.users.cache.size : null;

    return res.json({
      success: true,
      data: {
        isMaintenance,
        maintenanceReason: maintReason,
        maintenanceSince: maintSince,
        uptime: `${days}g ${hours}s ${minutes}d`,
        uptimeSeconds: uptimeSec,
        memoryUsageMB: Math.round(mem.rss / 1024 / 1024),
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        ping: ping,
        guildCount: guildCount,
        userCount: userCount,
        nodeVersion: process.version,
        pid: process.pid,
        managerId: req.user.discordId
      }
    });
  } catch (err) {
    logger.error('[BotControl] Status error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/bot-control/maintenance
 * Bakım modunu açıp kapatır
 */
router.post('/maintenance', botManagerGuard, (req, res) => {
  try {
    const { active, reason } = req.body;
    const targetState = Boolean(active);
    const maintReason = (reason && String(reason).trim()) || 'Sistem bakım ve optimizasyon çalışması yapılıyor.';

    const payload = {
      active: targetState,
      reason: maintReason,
      updatedBy: req.user.username || req.user.discordUsername || req.user.discordId,
      updatedById: req.user.discordId,
      since: targetState ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(maintPath, JSON.stringify(payload, null, 2), 'utf8');
    global.maintenanceMode = targetState;

    logger.info(`[BotControl] Bakım modu ${targetState ? 'ETKİNLEŞTİRİLDİ' : 'DEVRE DIŞI BIRAKILDI'} (Kullanıcı: ${req.user.discordId})`);

    return res.json({
      success: true,
      isMaintenance: targetState,
      message: targetState 
        ? '⚠️ Bot bakım modu başarıyla aktif edildi. Komutlar bakım uyarısı verecek.' 
        : '✅ Bot bakım modu kapatıldı. Normal çalışmaya dönüldü.'
    });
  } catch (err) {
    logger.error('[BotControl] Maintenance toggle error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/bot-control/restart
 * Botu VDS üzerinde güvenle yeniden başlatır (PM2 otomatik ayağa kaldırır)
 */
router.post('/restart', botManagerGuard, (req, res) => {
  try {
    const executor = req.user.username || req.user.discordUsername || req.user.discordId;
    logger.warn(`[BotControl] VDS Bot Yeniden Başlatma Tetiklendi! (Yetkili: ${executor} / ${req.user.discordId})`);

    // Yanıtı hemen dön
    res.json({
      success: true,
      message: '🚀 Bot yeniden başlatılıyor... VDS PM2 servisi botu birkaç saniye içinde tekrar ayağa kaldıracaktır.'
    });

    // 1 saniye sonra süreci sonlandır (PM2 anında restart eder)
    setTimeout(() => {
      logger.info('[BotControl] Süreç yeniden başlatılmak üzere kapatılıyor...');
      process.exit(0);
    }, 1000);
  } catch (err) {
    logger.error('[BotControl] Restart error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/bot-control/pull-deploy
 * GitHub'dan son kodu çeker ve botu restart eder
 */
router.post('/pull-deploy', botManagerGuard, (req, res) => {
  try {
    const executor = req.user.username || req.user.discordUsername || req.user.discordId;
    logger.warn(`[BotControl] Git Pull & Deploy Tetiklendi! (Yetkili: ${executor} / ${req.user.discordId})`);

    const cmd = 'git fetch origin main && git reset --hard origin/main && npm install --production --prefer-offline';
    exec(cmd, { cwd: path.join(__dirname, '../../') }, (err, stdout, stderr) => {
      if (err) {
        logger.error('[BotControl] git pull & deploy hatası:', err.message);
        return res.status(500).json({
          success: false,
          error: 'Git deploy başarısız oldu: ' + err.message,
          output: stderr || stdout
        });
      }

      res.json({
        success: true,
        message: '📦 Git güncellemeleri başarıyla çekildi. Bot yeniden başlatılıyor...',
        gitOutput: stdout
      });

      setTimeout(() => {
        process.exit(0);
      }, 1500);
    });
  } catch (err) {
    logger.error('[BotControl] Pull deploy error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { router, isAuthorizedBotManager };
