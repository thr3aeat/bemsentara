'use strict';

const fs = require('fs');
const path = require('path');
const { getDiscordClient } = require('../../bot/discordClient');

function formatUptime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}g`);
  if (hours > 0 || days > 0) parts.push(`${hours}s`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}dk`);
  parts.push(`${seconds}sn`);
  return parts.join(' ');
}

function getSystemTelemetry() {
  const now = Date.now();

  // 1. Web Sunucusu (Node.js Process)
  const processUptimeSeconds = Math.floor(process.uptime());
  const processUptimeFormatted = formatUptime(processUptimeSeconds * 1000);
  const memory = process.memoryUsage();
  const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
  const rssMB = Math.round(memory.rss / 1024 / 1024);

  // 2. Discord Botu (Discord Gateway)
  let discordClient = null;
  let botReady = false;
  let botPing = null;
  let botGuildCount = 0;
  let botUserCount = 0;
  let botUptimeMs = null;
  let botUptimeFormatted = null;

  try {
    discordClient = getDiscordClient();
    if (discordClient && typeof discordClient.isReady === 'function' && discordClient.isReady()) {
      botReady = true;
      botPing = typeof discordClient.ws?.ping === 'number' && discordClient.ws.ping >= 0 ? discordClient.ws.ping : 0;
      botGuildCount = discordClient.guilds?.cache?.size || 0;
      botUserCount = discordClient.users?.cache?.size || 0;
      botUptimeMs = discordClient.uptime || 0;
      botUptimeFormatted = formatUptime(botUptimeMs);
    }
  } catch (_) {}

  // 3. Veritabanı & Model Store
  let dbStatus = 'standby';
  let dbStatusText = 'Bellek Modu (Store)';
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      dbStatus = 'online';
      dbStatusText = 'MongoDB Bağlı';
    } else if (mongoose.connection && mongoose.connection.readyState === 2) {
      dbStatus = 'connecting';
      dbStatusText = 'MongoDB Bağlanıyor';
    }
  } catch (_) {}

  let storeStats = { users: 0, tickets: 0, economies: 0 };
  try {
    const { users, tickets, economies } = require('../../models/Store');
    storeStats.users = users?.data?.size || 0;
    storeStats.tickets = tickets?.data?.size || 0;
    storeStats.economies = economies?.data?.size || 0;
  } catch (_) {}

  // 4. Harici İzleme Durumu (bot/status_state.json)
  let monitorData = null;
  let lastMonitorCheckTime = null;
  try {
    const stateFile = path.join(__dirname, '../../bot/status_state.json');
    if (fs.existsSync(stateFile)) {
      monitorData = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      if (monitorData && monitorData.updatedAt) {
        lastMonitorCheckTime = new Date(monitorData.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      }
    }
  } catch (_) {}

  // Servis Listesi
  const services = [
    {
      id: 'web',
      icon: '🌐',
      name: 'Web sitesi',
      category: 'Çekirdek Platform',
      description: 'Ana sayfa, Help, Safety, linkler, blog ve kullanıcı paneli',
      status: 'online',
      statusLabel: 'Operasyonel',
      statusClass: 'status-green',
      metrics: `Uptime: ${processUptimeFormatted} • RAM: ${heapUsedMB} MB`,
    },
    {
      id: 'auth',
      icon: '🔐',
      name: 'Authentication',
      category: 'Güvenlik',
      description: 'Oturum, Discord OAuth ve Roblox hesap doğrulama akışları',
      status: 'online',
      statusLabel: 'Operasyonel',
      statusClass: 'status-green',
      metrics: 'OAuth2 & PIN Oturum Altyapısı Aktif',
    },
    {
      id: 'discord-bot',
      icon: '🤖',
      name: 'Discord Bot',
      category: 'Topluluk Motoru',
      description: 'Komutlar, otomasyonlar, roller ve topluluk etkileşimleri',
      status: botReady ? 'online' : 'standby',
      statusLabel: botReady ? 'Operasyonel' : 'Hazır Bekliyor',
      statusClass: botReady ? 'status-green' : 'status-yellow',
      metrics: botReady
        ? `Gecikme: ${botPing} ms • ${botGuildCount} Sunucu • Uptime: ${botUptimeFormatted}`
        : 'Gateway bağlantısı bekleniyor',
    },
    {
      id: 'tickets',
      icon: '🎫',
      name: 'Ticket sistemi',
      category: 'Destek Masası',
      description: 'Web talepleri, Discord teslimi ve destek kayıtları',
      status: 'online',
      statusLabel: 'Operasyonel',
      statusClass: 'status-green',
      metrics: `${storeStats.tickets} Destek Kaydı • SLA Motoru Devrede`,
    },
    {
      id: 'database',
      icon: '🗄️',
      name: 'Veritabanı & Bellek',
      category: 'Veri Depolama',
      description: 'Kullanıcı profilleri, ekonomi kayıtları ve eşzamanlı veri deposu',
      status: dbStatus === 'online' ? 'online' : 'standby',
      statusLabel: dbStatusText,
      statusClass: dbStatus === 'online' ? 'status-green' : 'status-yellow',
      metrics: `${storeStats.users} Kullanıcı • ${storeStats.economies} Ekonomi Cüzdanı`,
    },
    {
      id: 'moderation',
      icon: '🛡️',
      name: 'Moderasyon',
      category: 'Güvenlik & Denetim',
      description: 'Topluluk güvenliği, dinamik güven puanı (TrustScore) ve personel araçları',
      status: 'online',
      statusLabel: 'Operasyonel',
      statusClass: 'status-green',
      metrics: 'Anti-Nuke & Çift Kontrol Mekanizması Devrede',
    },
    {
      id: 'api',
      icon: '🔌',
      name: 'API',
      category: 'Entegrasyon',
      description: 'Web ve bot servisleri arasındaki canlı veri uç noktaları',
      status: 'online',
      statusLabel: 'Operasyonel',
      statusClass: 'status-green',
      metrics: 'REST API & WebSocket Köprüsü Aktif',
    },
    {
      id: 'external-monitor',
      icon: '📡',
      name: 'Canlı İzleme & Durum Kanalı',
      category: 'Dış İzleme',
      description: 'Discord #durum kanalı ve harici servis heartbeat kontrolcüsü',
      status: monitorData ? 'online' : 'standby',
      statusLabel: monitorData ? 'İzleme Bağlı' : 'İzleme Bekleniyor',
      statusClass: monitorData ? 'status-green' : 'status-yellow',
      metrics: lastMonitorCheckTime ? `Son senkronizasyon: ${lastMonitorCheckTime}` : 'Periyodik heartbeat kontrolü',
    },
  ];

  const allOperational = services.every(s => s.status === 'online');

  return {
    timestamp: now,
    isoTime: new Date(now).toISOString(),
    overall: allOperational ? 'all_operational' : 'mostly_operational',
    overallText: allOperational ? 'Tüm Sistemler Operasyonel' : 'Sistemler Aktif ve Çalışıyor',
    process: {
      uptimeSeconds: processUptimeSeconds,
      uptimeFormatted: processUptimeFormatted,
      memoryHeapMB: heapUsedMB,
      memoryRssMB: rssMB,
      nodeVersion: process.version,
    },
    discord: {
      ready: botReady,
      ping: botPing,
      guildCount: botGuildCount,
      userCount: botUserCount,
      uptimeFormatted: botUptimeFormatted,
    },
    database: {
      status: dbStatus,
      statusText: dbStatusText,
      users: storeStats.users,
      tickets: storeStats.tickets,
    },
    services,
  };
}

module.exports = {
  getSystemTelemetry,
  formatUptime,
};
