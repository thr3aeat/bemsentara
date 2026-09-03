'use strict';

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const logger = require('../../utils/logger');

// ─── SABİTLER & HEDEF KANALLAR ───────────────────────────────────────────────
const TARGET_REPORT_CHANNEL_ID = '1544400099004784700';

const TRACKED_GUILDS = {
  ROBLOXLND: {
    id: '1537407325290237973',
    name: 'RobloxLand',
    shortName: 'RobloxLand',
    icon: '🎮',
    color: 0x5865F2,
    roleCategory: 'Geliştirici & Topluluk'
  },
  EKOYILDIZ: {
    id: '1367646464804655104',
    name: 'EkoYıldız',
    shortName: 'EkoYıldız',
    icon: '⭐',
    color: 0xFEE75C,
    roleCategory: 'Ana Topluluk'
  }
};

const DATA_FILE = path.join(__dirname, '../../data/server_daily_analytics.json');

// ─── VERİ DEPOSU YÖNETİMİ ────────────────────────────────────────────────────
function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getTodayKey() {
  const now = new Date();
  // Turkey timezone UTC+3
  const turkeyDate = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return turkeyDate.toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const now = new Date();
  const turkeyYesterday = new Date(now.getTime() + (3 * 60 * 60 * 1000) - (24 * 60 * 60 * 1000));
  return turkeyYesterday.toISOString().slice(0, 10);
}

function loadAnalyticsData() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    logger.warn('[AnalyticsService] Veri okuma hatası, sıfırlanıyor:', err.message);
  }
  return {
    meta: {
      lastDailyReportSent: null,
      created: new Date().toISOString()
    },
    days: {},
    historySummary: []
  };
}

function saveAnalyticsData(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    logger.error('[AnalyticsService] Veri kaydetme hatası:', err.message);
  }
}

function getGuildDayRecord(data, guildId, dateKey = getTodayKey()) {
  if (!data.days) {
    data.days = {};
  }
  if (!data.days[dateKey]) {
    data.days[dateKey] = {};
  }
  if (!data.days[dateKey][guildId]) {
    data.days[dateKey][guildId] = {
      guildId,
      joins: 0,
      leaves: 0,
      messages: 0,
      userMessages: {},      // { [userId]: count }
      channelMessages: {},   // { [channelId]: count }
      hourlyMessages: Array(24).fill(0), // 0-23 hours
      joinedUsers: [],
      leftUsers: [],
      memberCountSnapshot: null
    };
  }
  return data.days[dateKey][guildId];
}

// ─── ETKİNLİK İZLEME FONKSİYONLARI ───────────────────────────────────────────
function recordMessage(guildId, channelId, userId) {
  if (!guildId || !userId) return;
  const isTracked = Object.values(TRACKED_GUILDS).some(g => g.id === guildId);
  if (!isTracked) return;

  const data = loadAnalyticsData();
  const today = getTodayKey();
  const record = getGuildDayRecord(data, guildId, today);

  record.messages = (record.messages || 0) + 1;

  if (userId) {
    record.userMessages = record.userMessages || {};
    record.userMessages[userId] = (record.userMessages[userId] || 0) + 1;
  }

  if (channelId) {
    record.channelMessages = record.channelMessages || {};
    record.channelMessages[channelId] = (record.channelMessages[channelId] || 0) + 1;
  }

  const now = new Date();
  const currentHour = (now.getUTCHours() + 3) % 24;
  record.hourlyMessages = record.hourlyMessages || Array(24).fill(0);
  record.hourlyMessages[currentHour] = (record.hourlyMessages[currentHour] || 0) + 1;

  saveAnalyticsData(data);
}

function recordMemberJoin(guildId, userId) {
  if (!guildId || !userId) return;
  const isTracked = Object.values(TRACKED_GUILDS).some(g => g.id === guildId);
  if (!isTracked) return;

  const data = loadAnalyticsData();
  const today = getTodayKey();
  const record = getGuildDayRecord(data, guildId, today);

  record.joins = (record.joins || 0) + 1;
  record.joinedUsers = record.joinedUsers || [];
  if (!record.joinedUsers.includes(userId)) {
    record.joinedUsers.push(userId);
  }

  saveAnalyticsData(data);
}

function recordMemberLeave(guildId, userId) {
  if (!guildId || !userId) return;
  const isTracked = Object.values(TRACKED_GUILDS).some(g => g.id === guildId);
  if (!isTracked) return;

  const data = loadAnalyticsData();
  const today = getTodayKey();
  const record = getGuildDayRecord(data, guildId, today);

  record.leaves = (record.leaves || 0) + 1;
  record.leftUsers = record.leftUsers || [];
  if (!record.leftUsers.includes(userId)) {
    record.leftUsers.push(userId);
  }

  saveAnalyticsData(data);
}

// ─── DERİN ANALİZ & TAHMİN HESAPLAMA MOTORU ───────────────────────────────────
/**
 * "Sunucu Nereye Gidiyor?" Gelecek Projeksiyonu ve Sağlık İndeksi
 */
function analyzeGuildTrajectory(guild, dayRecord, pastDays = []) {
  const totalMembers = guild?.memberCount || dayRecord?.memberCountSnapshot || 100;
  const joins = dayRecord?.joins || 0;
  const leaves = dayRecord?.leaves || 0;
  const netGrowth = joins - leaves;
  const messages = dayRecord?.messages || 0;

  const uniqueChatters = Object.keys(dayRecord?.userMessages || {}).length;
  const chatterRatio = totalMembers > 0 ? (uniqueChatters / totalMembers) * 100 : 0;
  const msgsPerChatter = uniqueChatters > 0 ? (messages / uniqueChatters) : 0;

  // Çıkış / Ayrılma Oranı (Churn Rate)
  const churnRate = totalMembers > 0 ? (leaves / (totalMembers + joins)) * 100 : 0;
  const retentionRate = Math.max(0, 100 - churnRate);

  // Sağlık Skoru (0 - 100)
  let healthScore = 50;

  if (netGrowth > 0) healthScore += Math.min(25, netGrowth * 5);
  else if (netGrowth < 0) healthScore -= Math.min(30, Math.abs(netGrowth) * 6);

  if (chatterRatio >= 15) healthScore += 20;
  else if (chatterRatio >= 8) healthScore += 12;
  else if (chatterRatio >= 3) healthScore += 6;
  else healthScore -= 8;

  if (churnRate < 1) healthScore += 15;
  else if (churnRate < 3) healthScore += 8;
  else if (churnRate > 7) healthScore -= 15;

  if (messages > 500) healthScore += 10;
  else if (messages > 100) healthScore += 5;
  else if (messages < 20) healthScore -= 5;

  healthScore = Math.max(5, Math.min(100, Math.round(healthScore)));

  // Trend & Durum Teşhisi
  let trendStatus = '';
  let trendIcon = '📈';
  let trendColor = 0x2ECC71;

  if (healthScore >= 80) {
    trendStatus = '🔥 Roket Büyüme & Çok Canlı Topluluk';
    trendIcon = '🚀';
    trendColor = 0x2ECC71;
  } else if (healthScore >= 65) {
    trendStatus = '📈 Dengeli & İstikrarlı Gelişim';
    trendIcon = '🟢';
    trendColor = 0x57F287;
  } else if (healthScore >= 45) {
    trendStatus = '⚖️ Rutin & Durgun Dönem (Etkinlik Tavsiye Edilir)';
    trendIcon = '🟡';
    trendColor = 0xFEE75C;
  } else {
    trendStatus = '⚠️ Üye Kaybı / Pasifleşme Riski (Acil Aksiyon)';
    trendIcon = '🔴';
    trendColor = 0xED4245;
  }

  // 30 Günlük Tahmin (Gelecek Projeksiyonu)
  const projectedMonthlyNetGrowth = Math.round(netGrowth * 30);
  const projected30DayMembers = Math.max(0, totalMembers + projectedMonthlyNetGrowth);
  const projectedMonthlyMessages = Math.round(messages * 30);

  // En Yoğun Saatler
  const hourly = dayRecord?.hourlyMessages || Array(24).fill(0);
  let maxHour = 0;
  let maxHourCount = 0;
  hourly.forEach((count, h) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      maxHour = h;
    }
  });
  const peakHourStr = maxHourCount > 0
    ? `${String(maxHour).padStart(2, '0')}:00 - ${String((maxHour + 1) % 24).padStart(2, '0')}:00 (${maxHourCount} msj)`
    : 'Veri toplanıyor';

  // Stratejik Tavsiyeler
  const recommendations = [];
  if (leaves > joins && leaves > 0) {
    recommendations.push('🚨 **Ayrılma Uyarısı:** Çıkış yapan üye sayısı yeni gelenlerden fazla. Karşılama ve ilk 10 dakika deneyimini (onboarding) gözden geçirin.');
  } else if (joins >= 5 && chatterRatio < 5) {
    recommendations.push('💡 **Etkileşim Tavsiyesi:** Yeni üye girişi iyi fakat sohbete katılım düşük. Çekiliş, soru-cevap veya sesli etkinlik düzenleyin.');
  } else if (healthScore >= 75) {
    recommendations.push('✨ **Büyüme Fırsatı:** Topluluk enerjisi çok yüksek! Yeni yetkili/moderatör alımı ve Roblox etkinlikleriyle momentumu koruyun.');
  } else {
    recommendations.push('🎯 **Topluluk Dinamiği:** En yoğun saatlerde (' + (maxHourCount > 0 ? `${maxHour}:00` : 'akşam') + ') duyuru veya mini oyunlar yaparak etkileşimi 2 katına çıkarabilirsiniz.');
  }

  return {
    healthScore,
    trendStatus,
    trendIcon,
    trendColor,
    totalMembers,
    joins,
    leaves,
    netGrowth,
    messages,
    uniqueChatters,
    chatterRatio: chatterRatio.toFixed(1),
    msgsPerChatter: msgsPerChatter.toFixed(1),
    retentionRate: retentionRate.toFixed(1),
    churnRate: churnRate.toFixed(1),
    projected30DayMembers,
    projectedMonthlyNetGrowth,
    projectedMonthlyMessages,
    peakHourStr,
    recommendations
  };
}

// ─── GRAFİK VE İLERLEME ÇUBUĞU FORMATLAYICILARI ──────────────────────────────
function generateProgressBar(percent, length = 10) {
  const valid = Math.max(0, Math.min(100, percent));
  const filled = Math.round((valid / 100) * length);
  const empty = length - filled;
  return '`[' + '█'.repeat(filled) + '░'.repeat(empty) + `] ${valid}%` + '`';
}

function generateHourlyChart(hourlyArray) {
  const max = Math.max(...hourlyArray, 1);
  const blocks = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  let chart = '';
  for (let i = 0; i < 24; i++) {
    const val = hourlyArray[i] || 0;
    const blockIdx = Math.min(blocks.length - 1, Math.floor((val / max) * (blocks.length - 1)));
    chart += blocks[blockIdx];
  }
  return `\`${chart}\` *(00:00 → 23:00)*`;
}

// ─── EMBED OLUŞTURUCULARI ───────────────────────────────────────────────────
function buildMainDashboardEmbed(client, dateKey = getTodayKey()) {
  const data = loadAnalyticsData();
  const rblxGuild = client.guilds.cache.get(TRACKED_GUILDS.ROBLOXLND.id);
  const ekoGuild = client.guilds.cache.get(TRACKED_GUILDS.EKOYILDIZ.id);

  const rblxRecord = getGuildDayRecord(data, TRACKED_GUILDS.ROBLOXLND.id, dateKey);
  const ekoRecord = getGuildDayRecord(data, TRACKED_GUILDS.EKOYILDIZ.id, dateKey);

  const rblxAnalysis = analyzeGuildTrajectory(rblxGuild, rblxRecord);
  const ekoAnalysis = analyzeGuildTrajectory(ekoGuild, ekoRecord);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📊 GÜNLÜK SUNUCU ANALİZİ & GELECEK ROTASI RAPORU')
    .setDescription(
      `📅 **Rapor Tarihi:** \`${dateKey}\`\n` +
      `📌 Bu rapor, **RobloxLand** ve **EkoYıldız** sunucularının 24 saatlik giriş-çıkış, sohbet aktivitesi ve gelecek büyüme rotasını detaylı olarak analiz eder.\n\n` +
      `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯`
    )
    .addFields(
      {
        name: `🎮 ROBLOXLND ANALİZ ÖZETİ`,
        value:
          `👥 **Üye Sayısı:** \`${rblxAnalysis.totalMembers}\`\n` +
          `🟢 **Giriş:** \`+${rblxAnalysis.joins}\` | 🔴 **Çıkış:** \`-${rblxAnalysis.leaves}\` | 📈 **Net:** \`${rblxAnalysis.netGrowth >= 0 ? '+' : ''}${rblxAnalysis.netGrowth}\`\n` +
          `💬 **Mesaj Sayısı:** \`${rblxAnalysis.messages}\` | 🗣️ **Aktif Üye:** \`${rblxAnalysis.uniqueChatters}\`\n` +
          `🩺 **Sağlık:** ${generateProgressBar(rblxAnalysis.healthScore, 8)}\n` +
          `🎯 **Rota:** ${rblxAnalysis.trendIcon} *${rblxAnalysis.trendStatus}*`,
        inline: false
      },
      {
        name: `⭐ EKOYILDIZ ANALİZ ÖZETİ`,
        value:
          `👥 **Üye Sayısı:** \`${ekoAnalysis.totalMembers}\`\n` +
          `🟢 **Giriş:** \`+${ekoAnalysis.joins}\` | 🔴 **Çıkış:** \`-${ekoAnalysis.leaves}\` | 📈 **Net:** \`${ekoAnalysis.netGrowth >= 0 ? '+' : ''}${ekoAnalysis.netGrowth}\`\n` +
          `💬 **Mesaj Sayısı:** \`${ekoAnalysis.messages}\` | 🗣️ **Aktif Üye:** \`${ekoAnalysis.uniqueChatters}\`\n` +
          `🩺 **Sağlık:** ${generateProgressBar(ekoAnalysis.healthScore, 8)}\n` +
          `🎯 **Rota:** ${ekoAnalysis.trendIcon} *${ekoAnalysis.trendStatus}*`,
        inline: false
      },
      {
        name: `🔮 SUNUCULAR NEREYE GİDİYOR? (30 GÜNLÜK TAHMİN)`,
        value:
          `🎮 **RobloxLand Projeksiyonu:** Tahmini \`${rblxAnalysis.projected30DayMembers}\` Üye (${rblxAnalysis.projectedMonthlyNetGrowth >= 0 ? '+' : ''}${rblxAnalysis.projectedMonthlyNetGrowth}/ay)\n` +
          `⭐ **EkoYıldız Projeksiyonu:** Tahmini \`${ekoAnalysis.projected30DayMembers}\` Üye (${ekoAnalysis.projectedMonthlyNetGrowth >= 0 ? '+' : ''}${ekoAnalysis.projectedMonthlyNetGrowth}/ay)\n` +
          `💡 *Aşağıdaki butonları kullanarak sunucuların kanal bazlı detaylarını, en çok yazan üyelerini ve stratejik tavsiyeleri inceleyebilirsiniz.*`,
        inline: false
      }
    )
    .setFooter({
      text: 'BEM Sentara & EkoYıldız AI Intelligence • Otomatik Günlük Analiz Sistemi',
      iconURL: client.user?.displayAvatarURL()
    })
    .setTimestamp();

  return embed;
}

function buildGuildDetailEmbed(client, guildKey, dateKey = getTodayKey()) {
  const guildConfig = TRACKED_GUILDS[guildKey];
  if (!guildConfig) return null;

  const data = loadAnalyticsData();
  const guild = client.guilds.cache.get(guildConfig.id);
  const record = getGuildDayRecord(data, guildConfig.id, dateKey);
  const analysis = analyzeGuildTrajectory(guild, record);

  // En aktif kanallar
  const channelEntries = Object.entries(record.channelMessages || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const channelListStr = channelEntries.length > 0
    ? channelEntries.map(([cid, cnt], idx) => `${idx + 1}. <#${cid}> → **${cnt}** mesaj`).join('\n')
    : '*Henüz mesaj kaydedilmedi.*';

  // En aktif üyeler
  const userEntries = Object.entries(record.userMessages || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const userListStr = userEntries.length > 0
    ? userEntries.map(([uid, cnt], idx) => `${idx + 1}. <@${uid}> → **${cnt}** mesaj`).join('\n')
    : '*Henüz aktif üye kaydedilmedi.*';

  const hourlyChart = generateHourlyChart(record.hourlyMessages || Array(24).fill(0));

  const embed = new EmbedBuilder()
    .setColor(guildConfig.color)
    .setTitle(`${guildConfig.icon} ${guildConfig.name} — DETAYLI SUNUCU ANALİZİ`)
    .setDescription(
      `📅 **İncelenen Gün:** \`${dateKey}\`\n` +
      `🏢 **Kategori:** \`${guildConfig.roleCategory}\`\n` +
      `🩺 **Sunucu Sağlık Skoru:** ${generateProgressBar(analysis.healthScore, 10)}\n` +
      `🚩 **Mevcut Durum & Teşhis:** ${analysis.trendIcon} **${analysis.trendStatus}**\n\n` +
      `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯`
    )
    .addFields(
      {
        name: '📥 GİRİŞ - ÇIKIŞ & ÜYE TUTUNDURMA',
        value:
          `🟢 **Bugün Katılan:** \`+${analysis.joins}\` üye\n` +
          `🔴 **Ayrılan:** \`-${analysis.leaves}\` üye\n` +
          `📈 **Net Değişim:** \`${analysis.netGrowth >= 0 ? '+' : ''}${analysis.netGrowth}\` üye\n` +
          `🛡️ **Üye Sadakat Oranı:** \`%${analysis.retentionRate}\`\n` +
          `📉 **Kayıp/Terk (Churn) Oranı:** \`%${analysis.churnRate}\``,
        inline: true
      },
      {
        name: '💬 SOHBET & ETKİLEŞİM İSTATİSTİKLERİ',
        value:
          `📝 **Toplam Mesaj:** \`${analysis.messages}\`\n` +
          `🗣️ **Konuşan Tekil Üye:** \`${analysis.uniqueChatters}\`\n` +
          `📊 **Katılım Oranı:** \`%${analysis.chatterRatio}\`\n` +
          `⚡ **Üye Başına Mesaj:** \`${analysis.msgsPerChatter}\`\n` +
          `⏰ **Zirve Saat:** \`${analysis.peakHourStr}\``,
        inline: true
      },
      {
        name: '⏳ 24 SAATLİK AKTİFLİK YOĞUNLUK GRAFİĞİ',
        value: `${hourlyChart}\n*(Çubukların yüksekliği o saatteki mesaj yoğunluğunu gösterir)*`,
        inline: false
      },
      {
        name: '🏆 EN AKTİF 5 KANAL',
        value: channelListStr,
        inline: true
      },
      {
        name: '🥇 EN ÇOK MESAJ ATAN 5 ÜYE',
        value: userListStr,
        inline: true
      },
      {
        name: '💡 STRATEJİK TAVSİYE & EYLEM PLANI',
        value: analysis.recommendations.join('\n'),
        inline: false
      }
    )
    .setFooter({
      text: `${guildConfig.name} İstatistik Servisi • Güncel Saatlik Veri`,
      iconURL: client.user?.displayAvatarURL()
    })
    .setTimestamp();

  return embed;
}

function buildComparisonEmbed(client, dateKey = getTodayKey()) {
  const data = loadAnalyticsData();
  const rblxGuild = client.guilds.cache.get(TRACKED_GUILDS.ROBLOXLND.id);
  const ekoGuild = client.guilds.cache.get(TRACKED_GUILDS.EKOYILDIZ.id);

  const rblxRecord = getGuildDayRecord(data, TRACKED_GUILDS.ROBLOXLND.id, dateKey);
  const ekoRecord = getGuildDayRecord(data, TRACKED_GUILDS.EKOYILDIZ.id, dateKey);

  const rblxAnalysis = analyzeGuildTrajectory(rblxGuild, rblxRecord);
  const ekoAnalysis = analyzeGuildTrajectory(ekoGuild, ekoRecord);

  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle('⚖️ ROBLOXLND VS EKOYILDIZ — SUNUCU KARŞILAŞTIRMASI')
    .setDescription(
      `📅 **Tarih:** \`${dateKey}\`\n` +
      `İki kardeş sunucunun büyüme hızı, mesaj trafiği ve etkileşim yarışının karşılaştırmalı analizi:\n\n` +
      `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯`
    )
    .addFields(
      {
        name: '👥 TOPLAM ÜYE & BÜYÜME FARKI',
        value:
          `🎮 **RobloxLand:** \`${rblxAnalysis.totalMembers}\` üye (Net: \`${rblxAnalysis.netGrowth >= 0 ? '+' : ''}${rblxAnalysis.netGrowth}\`)\n` +
          `⭐ **EkoYıldız:** \`${ekoAnalysis.totalMembers}\` üye (Net: \`${ekoAnalysis.netGrowth >= 0 ? '+' : ''}${ekoAnalysis.netGrowth}\`)\n` +
          `🏆 **Lider:** ${rblxAnalysis.netGrowth > ekoAnalysis.netGrowth ? '🎮 RobloxLand daha hızlı büyüyor!' : ekoAnalysis.netGrowth > rblxAnalysis.netGrowth ? '⭐ EkoYıldız daha hızlı büyüyor!' : '🤝 İki sunucu eşit hızda büyüyor!'}`,
        inline: false
      },
      {
        name: '💬 MESAJ TRAFİĞİ & AKTİFLİK ORANI',
        value:
          `🎮 **RobloxLand Mesajı:** \`${rblxAnalysis.messages}\` msj (Katılım: \`%${rblxAnalysis.chatterRatio}\`)\n` +
          `⭐ **EkoYıldız Mesajı:** \`${ekoAnalysis.messages}\` msj (Katılım: \`%${ekoAnalysis.chatterRatio}\`)\n` +
          `⚡ **Toplam Ortak Hacim:** \`${rblxAnalysis.messages + ekoAnalysis.messages}\` mesaj`,
        inline: false
      },
      {
        name: '🩺 SAĞLIK & SADAKAT SKORLARI',
        value:
          `🎮 **RobloxLand Sağlık:** ${generateProgressBar(rblxAnalysis.healthScore, 6)} (%${rblxAnalysis.retentionRate} Sadakat)\n` +
          `⭐ **EkoYıldız Sağlık:** ${generateProgressBar(ekoAnalysis.healthScore, 6)} (%${ekoAnalysis.retentionRate} Sadakat)`,
        inline: false
      }
    )
    .setFooter({ text: 'BEM Sentara Karşılaştırmalı Büyüme Analizi' })
    .setTimestamp();

  return embed;
}

function buildTrajectoryEmbed(client, dateKey = getTodayKey()) {
  const data = loadAnalyticsData();
  const rblxGuild = client.guilds.cache.get(TRACKED_GUILDS.ROBLOXLND.id);
  const ekoGuild = client.guilds.cache.get(TRACKED_GUILDS.EKOYILDIZ.id);

  const rblxRecord = getGuildDayRecord(data, TRACKED_GUILDS.ROBLOXLND.id, dateKey);
  const ekoRecord = getGuildDayRecord(data, TRACKED_GUILDS.EKOYILDIZ.id, dateKey);

  const rblx = analyzeGuildTrajectory(rblxGuild, rblxRecord);
  const eko = analyzeGuildTrajectory(ekoGuild, ekoRecord);

  const embed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('🔮 SUNUCULAR NEREYE GİDİYOR? — STRATEJİK GELECEK ROTASI')
    .setDescription(
      `Sunucu verileri, giriş/çıkış trendleri ve sohbet ritimleri yapay zeka algoritmasıyla analiz edildi. İşte önümüzdeki 30 günün projeksiyonu ve stratejik rota haritası:\n\n` +
      `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯`
    )
    .addFields(
      {
        name: '🎮 ROBLOXLND — NEREYE GİDİYOR?',
        value:
          `🎯 **Rota Teşhisi:** ${rblx.trendIcon} **${rblx.trendStatus}**\n` +
          `📅 **30 Gün Sonraki Tahmini Üye:** \`${rblx.projected30DayMembers}\` (Net: \`${rblx.projectedMonthlyNetGrowth >= 0 ? '+' : ''}${rblx.projectedMonthlyNetGrowth}\`)\n` +
          `💬 **Aylık Beklenen Mesaj:** \`~${rblx.projectedMonthlyMessages}\` mesaj\n` +
          `🔍 **Büyüme Dinamiği:** Geliştirici kitlesi ve Roblox içerikleri sunucuya düzenli akış sağlıyor. ${rblx.recommendations[0]}`,
        inline: false
      },
      {
        name: '⭐ EKOYILDIZ — NEREYE GİDİYOR?',
        value:
          `🎯 **Rota Teşhisi:** ${eko.trendIcon} **${eko.trendStatus}**\n` +
          `📅 **30 Gün Sonraki Tahmini Üye:** \`${eko.projected30DayMembers}\` (Net: \`${eko.projectedMonthlyNetGrowth >= 0 ? '+' : ''}${eko.projectedMonthlyNetGrowth}\`)\n` +
          `💬 **Aylık Beklenen Mesaj:** \`~${eko.projectedMonthlyMessages}\` mesaj\n` +
          `🔍 **Topluluk Dinamiği:** Ana topluluk sohbet ve oyun kanallarıyla ayakta duruyor. ${eko.recommendations[0]}`,
        inline: false
      },
      {
        name: '🚀 YÖNETİM & MODERASYON İÇİN 3 KRİTİK ADIM',
        value:
          `1️⃣ **Zirve Saatleri Değerlendirin:** Her iki sunucuda en yoğun saatler akşamları. Önemli duyurular ve etkinlikler bu saatlere planlanmalı.\n` +
          `2️⃣ **Giriş-Çıkış Kalkanı:** Yeni gelen üyelerin ilk 24 saat içinde sunucuda kalmasını sağlayacak hoş geldin etkileşimlerini artırın.\n` +
          `3️⃣ **Roblox & Eko Yıldız Çapraz Etkinlikleri:** İki sunucu arasında ortak etkinlik ve turnuvalar düzenleyerek kitleyi birbirine bağlayın.`,
        inline: false
      }
    )
    .setFooter({ text: 'Yapay Zeka & Stratejik Büyüme Modeli' })
    .setTimestamp();

  return embed;
}

// ─── BUTONLARI OLUŞTURUCU ───────────────────────────────────────────────────
function buildAnalyticsActionRow() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_analytics_robloxland')
      .setLabel('🎮 RobloxLand Detay')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_analytics_ekoyildiz')
      .setLabel('⭐ EkoYıldız Detay')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_analytics_compare')
      .setLabel('⚖️ Karşılaştır')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_analytics_trajectory')
      .setLabel('🔮 Nereye Gidiyor?')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_analytics_refresh')
      .setLabel('🔄 Canlı Güncelle')
      .setStyle(ButtonStyle.Secondary)
  );
  return row;
}

// ─── BUTON ETKİLEŞİM YÖNETİCİSİ ──────────────────────────────────────────────
async function handleAnalyticsButtonInteraction(interaction) {
  const customId = interaction.customId;
  if (!customId || !customId.startsWith('btn_analytics_')) return false;

  const client = interaction.client;
  const today = getTodayKey();

  try {
    if (customId === 'btn_analytics_robloxland') {
      const embed = buildGuildDetailEmbed(client, 'ROBLOXLND', today);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return true;
    }

    if (customId === 'btn_analytics_ekoyildiz') {
      const embed = buildGuildDetailEmbed(client, 'EKOYILDIZ', today);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return true;
    }

    if (customId === 'btn_analytics_compare') {
      const embed = buildComparisonEmbed(client, today);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return true;
    }

    if (customId === 'btn_analytics_trajectory') {
      const embed = buildTrajectoryEmbed(client, today);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return true;
    }

    if (customId === 'btn_analytics_refresh') {
      await interaction.deferUpdate().catch(() => {});
      const mainEmbed = buildMainDashboardEmbed(client, today);
      const row = buildAnalyticsActionRow();
      await interaction.editReply({ embeds: [mainEmbed], components: [row] }).catch(() => {});
      return true;
    }
  } catch (err) {
    logger.error('[handleAnalyticsButtonInteraction] Hata:', err.message);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Rapor verisi alınırken bir hata oluştu.', ephemeral: true }).catch(() => {});
    }
    return true;
  }

  return false;
}

// ─── GÜNLÜK RAPOR GÖNDERİCİ & ZAMANLAYICI ────────────────────────────────────
async function sendDailyReport(client, forceDate = null) {
  const dateKey = forceDate || getTodayKey();
  try {
    const channel = client.channels.cache.get(TARGET_REPORT_CHANNEL_ID)
      || await client.channels.fetch(TARGET_REPORT_CHANNEL_ID).catch(() => null);

    if (!channel || typeof channel.send !== 'function') {
      logger.warn(`[AnalyticsService] Hedef rapor kanalı bulunamadı: ${TARGET_REPORT_CHANNEL_ID}`);
      return false;
    }

    const embed = buildMainDashboardEmbed(client, dateKey);
    const row = buildAnalyticsActionRow();

    await channel.send({
      content: `📢 **Günlük Sunucu Analiz Raporu Hazırlandı!** (${dateKey})`,
      embeds: [embed],
      components: [row]
    });

    const data = loadAnalyticsData();
    data.meta = data.meta || {};
    data.meta.lastDailyReportSent = dateKey;
    saveAnalyticsData(data);

    logger.success(`[AnalyticsService] Günlük rapor başarıyla kanala (${TARGET_REPORT_CHANNEL_ID}) gönderildi.`);
    return true;
  } catch (err) {
    logger.error('[AnalyticsService] Günlük rapor gönderim hatası:', err.message);
    return false;
  }
}

/**
 * Her gün saat 00:00'da (Türkiye saatiyle gece yarısı) otomatik rapor gönderen Cron Scheduler
 */
function startAnalyticsScheduler(client) {
  logger.info('[AnalyticsService] Günlük sunucu analiz servisi ve zamanlayıcı başlatılıyor...');

  // Her gün 00:00 (Türkiye saati UTC+3 -> 21:00 UTC)
  cron.schedule('0 21 * * *', async () => {
    logger.info('[AnalyticsService] Cron tetiklendi: Gün sonu analiz raporu hazırlanıyor...');
    const yesterday = getYesterdayKey();
    await sendDailyReport(client, yesterday);
  });

  // Ayrıca yedek kontrol: Her gün 09:00 UTC (12:00 TR) kontrol et
  cron.schedule('0 9 * * *', async () => {
    const data = loadAnalyticsData();
    const today = getTodayKey();
    if (data.meta?.lastDailyReportSent !== today && data.meta?.lastDailyReportSent !== getYesterdayKey()) {
      logger.info('[AnalyticsService] Sabah kontrolü: Günlük analiz gönderilmemiş, gönderiliyor...');
      await sendDailyReport(client, today);
    }
  });

  logger.success(`[AnalyticsService] ✅ Zamanlayıcı aktif: Hedef kanal ${TARGET_REPORT_CHANNEL_ID}`);
}

module.exports = {
  TARGET_REPORT_CHANNEL_ID,
  TRACKED_GUILDS,
  recordMessage,
  recordMemberJoin,
  recordMemberLeave,
  analyzeGuildTrajectory,
  buildMainDashboardEmbed,
  buildGuildDetailEmbed,
  buildComparisonEmbed,
  buildTrajectoryEmbed,
  buildAnalyticsActionRow,
  handleAnalyticsButtonInteraction,
  sendDailyReport,
  startAnalyticsScheduler,
  loadAnalyticsData,
  saveAnalyticsData,
  getTodayKey
};
