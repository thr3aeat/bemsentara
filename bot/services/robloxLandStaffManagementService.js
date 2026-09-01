'use strict';

const fs = require('fs');
const path = require('path');
const {
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
} = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');

// Hedef Sabitler
const GUILD_ID = '1537407325290237973';
const PANEL_CHANNEL_ID = '1544367634433183765'; // Yetkili Alımları & Yönetim Kanalı
const WORK_CATEGORY_ID = '1538471137833394237'; // Sistem, Map & Paylaşım Kanalları Kategorisi
const STAFF_LOG_CHANNEL_ID = '1543382733408174220';
const DESIGNATED_STAFF_ID = '1497600770634289194';

let createCanvas, loadImage;
try {
  const canvasPkg = require('@napi-rs/canvas');
  createCanvas = canvasPkg.createCanvas;
  loadImage = canvasPkg.loadImage;
} catch (_) {}

// ── Sunucu Yetkili Rol Hiyerarşisi (Varsayılanlar) ──────────────────────────
const DEFAULT_STAFF_RANKS = [
  { rank: 1, name: "Yetkili Ofisi Başkanı", id: "1544392306101067878" },
  { rank: 2, name: "Yetkili Ofisi Müdürü", id: "1544393164067053618" },
  { rank: 3, name: "Yetkili Ofisi Müdür Yardımcısı", id: "1544393522784903278" },
  { rank: 4, name: "Yetkili Ofisi Baş Staj", id: "1544393943570190456" },
  { rank: 5, name: "Yetkili Ofisi Kıdemli Staj", id: "1544393943570190456" },
  { rank: 6, name: "Yetkili Ofisi Staj", id: "1544394096918003712" }
];

const DEFAULT_TEMPLATES = {
  dm10d: "Selam {username} 👋\n\nBir süredir sistem veya map paylaşmadığını fark ettik (Son 10 gün).\nAktif misin?",
  dm13d: "Selam {username},\n\n3 gündür hâlâ hiç sistem-map atmadın! Bir şey mi oldu?\nEğer yardıma ihtiyacın varsa veya mazeretin bulunuyorsa lütfen yönetime bildir.\n\nTopluluğumuz için yetkili kadromuzun aktifliği büyük önem taşımaktadır.",
  workTime: "Selam! Çalışma vakti. Bugün müsaitsen yeni bir sistem veya map paylaşmanı bekliyoruz.",
  meeting: "📅 Yetkili toplantısı vardır. Lütfen en kısa sürede yetkili kanalını kontrol ediniz.",
  lowActivity: "⚠️ Son zamanlardaki aktivite durumunuz düşüktür. Lütfen durumunuzu kontrol ediniz."
};

const DEFAULT_AUTOMATION_RULES = {
  days10Reminder: 10,
  days13Warning: 13,
  days20DemotionReview: 20,
  scoreStar5: 7,
  scoreStar3: 4,
  scoreStar1: 1,
  penaltyWarning: 15,
  bonusOath: 5
};

/**
 * Görev Yemini Resmi Sertifika & SS Görselini Üretir
 */
function generateOathCertificateBuffer({ username, faithName, oathText, swornDate, userId }) {
  if (!createCanvas) return null;
  const width = 1000;
  const height = 540;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Arka Plan (Lüks Koyu Gradyan)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0c1017');
  bgGrad.addColorStop(0.5, '#131b26');
  bgGrad.addColorStop(1, '#090d13');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Çerçeve (Altın & Neon Mavi Çift Çizgi)
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // Üst Başlık Banner
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 25px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛡️ ROBLOXLND RESMİ GÖREV & SADAKAT YEMİNİ BELGESİ', width / 2, 70);

  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('RESMİ YETKİLİ KADRO TAAHHÜTNAMESİ VE İMZALI PROTOKOL', width / 2, 98);

  // Ayırıcı çizgi
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.beginPath();
  ctx.moveTo(80, 115);
  ctx.lineTo(width - 80, 115);
  ctx.stroke();

  // Yetkili Bilgi Kartı
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`YETKİLİ: ${username.toUpperCase()} (ID: ${userId})`, 70, 155);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px sans-serif';
  ctx.fillText(`İNANÇ / AND TÜRÜ: ${faithName}`, 70, 185);
  ctx.fillText(`YEMİN TARİHİ: ${swornDate}`, 70, 215);

  // Yemin Metin Kutusu (Arka Plan)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(60, 240, width - 120, 190);
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
  ctx.strokeRect(60, 240, width - 120, 190);

  // Yemin Metni (Satır Satır Yazma)
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'italic 16px sans-serif';
  ctx.textAlign = 'left';

  const words = `"${oathText}"`.split(' ');
  let line = '';
  let y = 275;
  const maxWidth = width - 160;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, 80, y);
      line = words[n] + ' ';
      y += 28;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 80, y);

  // İmzalandı Beyanı
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('✍️ İMZA & ONAY: "Yemin Ederim."', 80, y + 40);

  // Sağ Alt Mühür / Damga
  ctx.fillStyle = '#ffd700';
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.strokeRect(width - 320, height - 85, 260, 45);
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⭐ OFFICIAL SEAL • VERIFIED ⭐', width - 190, height - 64);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('ROBLOXLND MANAGEMENT SYSTEM', width - 190, height - 48);

  return canvas.toBuffer('image/png');
}

const STAFF_RANKS = DEFAULT_STAFF_RANKS;
const ALL_STAFF_ROLE_IDS = Array.from(new Set(STAFF_RANKS.map(r => r.id)));

const DATA_FILE = path.join(__dirname, '../../data/robloxland_staff_management.json');

// Bellek İçi Anonim DM Oturumları: sessionId -> { sessionId, staffUserId, managerUserId, createdAt, active: true }
const activeAnonSessions = new Map();

function loadStaffData() {
  let data = null;
  try {
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[StaffManagement] Load error:', err.message);
  }
  if (!data || typeof data !== 'object') data = {};
  if (!data.staffMembers) data.staffMembers = {};
  if (!data.pendingWorks) data.pendingWorks = {};
  if (!data.pendingAppeals) data.pendingAppeals = {};
  if (!data.pendingLeaves) data.pendingLeaves = {};
  if (!data.activeTasks) data.activeTasks = {};
  if (!data.weeklyStats) data.weeklyStats = { weekNumber: getWeekNumber(), totalWorksThisWeek: 0 };
  
  if (!data.settings) {
    data.settings = {
      baskanRoleId: "1544392306101067878",
      baskanYardimcisiRoleId: "1544393522784903278",
      roles: [...DEFAULT_STAFF_RANKS],
      templates: { ...DEFAULT_TEMPLATES }
    };
  } else {
    if (!data.settings.roles || !Array.isArray(data.settings.roles) || data.settings.roles.length === 0) {
      data.settings.roles = [...DEFAULT_STAFF_RANKS];
    }
    if (!data.settings.templates) {
      data.settings.templates = { ...DEFAULT_TEMPLATES };
    }
    if (!data.settings.baskanRoleId) data.settings.baskanRoleId = "1544392306101067878";
    if (!data.settings.baskanYardimcisiRoleId) data.settings.baskanYardimcisiRoleId = "1544393522784903278";
  }

  return data;
}

function saveStaffData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[StaffManagement] Save error:', err.message);
  }
}

function getWeekNumber(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

/**
 * Yönetici Yetki Kontrolü (Dinamik Ayarlarla Entegre)
 */
function isAuthorizedManager(member) {
  if (!member) return false;
  if (member.id === DESIGNATED_STAFF_ID) return true;

  const data = loadStaffData();
  const baskanId = data.settings?.baskanRoleId || "1544392306101067878";
  const baskanYrdId = data.settings?.baskanYardimcisiRoleId || "1544393522784903278";
  const configuredRoles = data.settings?.roles || DEFAULT_STAFF_RANKS;
  const highRankIds = configuredRoles.filter(r => r.rank <= 3).map(r => r.id);

  const rolesList = member.roles?.cache
    ? (typeof member.roles.cache.some === 'function'
      ? member.roles.cache
      : Array.from(member.roles.cache.values ? member.roles.cache.values() : []))
    : [];

  return Boolean(
    (member.permissions?.has && (
      member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ModerateMembers)
    )) ||
    (member.roles?.cache?.has && (
      member.roles.cache.has(baskanId) ||
      member.roles.cache.has(baskanYrdId) ||
      highRankIds.some(id => member.roles.cache.has(id))
    )) ||
    (Array.isArray(rolesList) ? rolesList.some(r => /başkan|müdür|yönetici|admin|ik|kurucu/i.test(r?.name || '')) : (typeof rolesList.some === 'function' && rolesList.some(r => /başkan|müdür|yönetici|admin|ik|kurucu/i.test(r?.name || ''))))
  );
}

/**
 * 1. Yetkili Aktivite & Sağlık Durumunu Hesaplar
 */
function calculateStaffHealth(staff) {
  const now = Date.now();
  if (staff.leaveUntil && staff.leaveUntil > now) {
    const untilDate = new Date(staff.leaveUntil).toLocaleDateString('tr-TR');
    return {
      status: 'leave',
      badge: `🏖️ İzinli — ${untilDate}'e kadar`,
      shortBadge: '🏖️ İzinli',
      desc: `İzinli (${untilDate}'e kadar)`
    };
  }

  const daysSinceWork = Math.floor((now - (staff.lastWorkAt || staff.joinedStaffAt || now)) / (1000 * 60 * 60 * 24));

  if (daysSinceWork <= 6) {
    return {
      status: 'active',
      badge: '🟢 Aktif',
      shortBadge: '🟢 Aktif',
      daysSinceWork,
      desc: daysSinceWork === 0 ? 'Bugün çalışma yaptı' : `${daysSinceWork} gün önce çalışma yaptı`
    };
  } else if (daysSinceWork <= 9) {
    return {
      status: 'warning',
      badge: '🟡 Çalışma bekleniyor',
      shortBadge: '🟡 Bekleniyor',
      daysSinceWork,
      desc: `${daysSinceWork} gündür paylaşım yapmadı`
    };
  } else if (daysSinceWork <= 12) {
    if (staff.acknowledgedActive) {
      return {
        status: 'acknowledged',
        badge: '🟡 Aktif olduğunu belirtti',
        shortBadge: '🟡 Aktif Belirtti',
        daysSinceWork,
        desc: `${daysSinceWork} gündür çalışma yok (Aktifim dedi)`
      };
    }
    return {
      status: 'passive_10d',
      badge: '🟠 10 gündür çalışma yok',
      shortBadge: '🟠 10 Gün Yok',
      daysSinceWork,
      desc: '10 gündür sistem/map paylaşmadı (DM gönderildi)'
    };
  } else if (daysSinceWork <= 19) {
    return {
      status: 'passive_13d',
      badge: '🔴 13 gündür çalışma yok',
      shortBadge: '🔴 13 Gün Yok',
      daysSinceWork,
      desc: '13 gündür çalışma yapılmadı (Ciddi uyarı DM gönderildi)'
    };
  } else {
    return {
      status: 'review_20d',
      badge: '⚠️ YÖNETİCİ İNCELEMESİ GEREKLİ (🔴 RD ADAYI)',
      shortBadge: '🔴 RD Adayı',
      daysSinceWork,
      desc: `${daysSinceWork} gündür tamamen inaktif!`
    };
  }
}

/**
 * 3. Akıllı Terfi Şartlarını Değerlendirir
 */
function evaluatePromotionEligibility(staff) {
  const now = Date.now();
  const daysInRank = Math.floor((now - (staff.lastPromotionAt || staff.joinedStaffAt || now)) / (1000 * 60 * 60 * 24));
  const performance = staff.performanceScore || 70;
  const works30d = staff.workCount30d || 0;
  const activeWarnings = staff.warningsCount || 0;
  const qualityWorks = staff.qualityWorksCount || 0;

  const reqDays = 14;
  const reqPerf = 80;
  const reqWorks = 10;
  const reqQuality = 3;

  const passedDays = daysInRank >= reqDays;
  const passedPerf = performance >= reqPerf;
  const passedWorks = works30d >= reqWorks;
  const passedWarnings = activeWarnings === 0;
  const passedQuality = qualityWorks >= reqQuality;

  const completedCount = [passedDays, passedPerf, passedWorks, passedWarnings, passedQuality].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);
  const isReady = progressPercent === 100;

  const missingItems = [];
  if (!passedDays) missingItems.push(`${reqDays - daysInRank} gün görev süresi`);
  if (!passedPerf) missingItems.push(`${reqPerf - performance} performans puanı`);
  if (!passedWorks) missingItems.push(`${reqWorks - works30d} sistem/map paylaşımı`);
  if (!passedWarnings) missingItems.push(`Aktif uyarıların temizlenmesi (${activeWarnings} uyarı var)`);
  if (!passedQuality) missingItems.push(`${reqQuality - qualityWorks} kaliteli çalışma (4+ yıldız)`);

  return {
    isReady,
    progressPercent,
    daysInRank,
    performance,
    works30d,
    activeWarnings,
    qualityWorks,
    passedDays,
    passedPerf,
    passedWorks,
    passedWarnings,
    passedQuality,
    missingItems
  };
}

/**
 * 4. Akıllı RD (Rütbe Düşürme) Kriterlerini Değerlendirir
 */
function evaluateDemotionRisk(staff) {
  const health = calculateStaffHealth(staff);
  const performance = staff.performanceScore || 70;
  const activeWarnings = staff.warningsCount || 0;

  const reasons = [];
  if (health.daysSinceWork >= 20) reasons.push(`${health.daysSinceWork} gündür çalışma yok`);
  if (performance < 35) reasons.push(`Performans ${performance}/100 (35 altı)`);
  if (activeWarnings >= 2) reasons.push(`${activeWarnings} aktif uyarı`);

  const isRisk = reasons.length >= 2 || health.daysSinceWork >= 20;

  return {
    isRisk,
    reasons
  };
}

/**
 * Performans İlerleme Çubuğu Üretir
 */
function renderProgressBar(score = 100) {
  const totalBars = 10;
  const clamped = Math.max(0, Math.min(100, score));
  const filled = Math.round((clamped / 100) * totalBars);
  const empty = totalBars - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 10. Ana Yönetici Kontrol Merkezi Paneli (Hub Payload)
 */
function buildStaffManagementPayload(data = loadStaffData()) {
  const staffList = Object.values(data.staffMembers || {});
  const totalStaff = staffList.length;

  let activeCount = 0;
  let lowActiveCount = 0;
  let leaveCount = 0;
  let reviewCount = 0;

  const promotionCandidates = [];
  const demotionCandidates = [];

  for (const staff of staffList) {
    const health = calculateStaffHealth(staff);
    if (health.status === 'leave') leaveCount++;
    else if (health.status === 'active') activeCount++;
    else if (health.status === 'warning' || health.status === 'acknowledged') lowActiveCount++;
    else reviewCount++;

    const promo = evaluatePromotionEligibility(staff);
    if (promo.isReady) promotionCandidates.push(staff);

    const demo = evaluateDemotionRisk(staff);
    if (demo.isRisk) demotionCandidates.push(staff);
  }

  const pendingWorksCount = Object.values(data.pendingWorks || {}).filter(w => w.status === 'pending').length;
  const pendingAppealsCount = Object.values(data.pendingAppeals || {}).filter(a => a.status === 'pending').length;
  const pendingLeavesCount = Object.values(data.pendingLeaves || {}).filter(l => l.status === 'pending').length;
  const activeTasksCount = Object.values(data.activeTasks || {}).filter(t => t.status !== 'completed').length;

  const currentWeekWorks = data.weeklyStats?.totalWorksThisWeek || 0;

  const content = [
    ComponentsV2Factory.text(
      `# 🛡️ ROBLOXLND YETKİLİ KONTROL MERKEZİ\n` +
      `*Gelişmiş yetkili kadro takibi, kalite kontrollü çalışma sistemi ve akıllı terfi/RD yönetim merkezi.*\n\n` +
      `### 📊 Kadro Durumu & İstatistikler:\n` +
      `• 👥 **Toplam Kadro:** \`${totalStaff}\` Yetkili\n` +
      `• 🟢 **Aktif:** \`${activeCount}\` | 🟡 **Düşük Aktivite:** \`${lowActiveCount}\` | 🏖️ **İzinli:** \`${leaveCount}\` | 🔴 **İnceleme Gerekli:** \`${reviewCount}\`\n\n` +
      `### 💡 Akıllı Durum & Bekleyen İşlemler:\n` +
      `• ⬆️ **Terfi Adayları:** \`${promotionCandidates.length}\` yetkili terfiye hazır\n` +
      `• ⬇️ **RD Adayları:** \`${demotionCandidates.length}\` yetkili inceleme/risk altında\n` +
      `• 📦 **Kalite Kontrolü Bekleyen Paylaşım:** \`${pendingWorksCount}\` çalışma\n` +
      `• ⚖️ **Bekleyen Uyarı İtirazı:** \`${pendingAppealsCount}\` | 🏖️ **İzin Talebi:** \`${pendingLeavesCount}\` | 📋 **Aktif Görev:** \`${activeTasksCount}\`\n\n` +
      `• 📦 **Bu Hafta Onaylanan Sistem/Map:** \`${currentWeekWorks}\` adet\n\n` +
      `-# 💡 *Sistem, 1538471137833394237 kategorisindeki çalışmaları 7/24 denetler; 10. ve 13. günlerde otomatik DM ile durum kontrolü sağlar.*`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Primary,
        label: "👥 Yetkili Kadrosu & Profiller",
        custom_id: "robloxland_staffmgmt_list",
        emoji: { name: "👥" }
      },
      {
        style: ButtonStyle.Success,
        label: `⬆️ Terfi Adayları (${promotionCandidates.length})`,
        custom_id: "robloxland_staffmgmt_view_promos",
        emoji: { name: "⬆️" }
      },
      {
        style: ButtonStyle.Danger,
        label: `🔴 İnceleme / RD (${demotionCandidates.length})`,
        custom_id: "robloxland_staffmgmt_view_demos",
        emoji: { name: "⚠️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: `📦 Çalışma İncele (${pendingWorksCount})`,
        custom_id: "robloxland_staffmgmt_view_works",
        emoji: { name: "📦" }
      }
    ]),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "➕ Yetkili Ekle",
        custom_id: "robloxland_staffmgmt_add",
        emoji: { name: "➕" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "📋 Görevler",
        custom_id: "robloxland_staffmgmt_task_hub",
        emoji: { name: "📋" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🏖️ İzinler & İtirazlar",
        custom_id: "robloxland_staffmgmt_requests_hub",
        emoji: { name: "⚖️" }
      },
      {
        style: ButtonStyle.Primary,
        label: "⚙️ Ayarlar & Roller",
        custom_id: "robloxland_staffmgmt_settings_hub",
        emoji: { name: "⚙️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🔄 Yenile",
        custom_id: "robloxland_staffmgmt_refresh",
        emoji: { name: "🔄" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

/**
 * 11. Sistem & Rol Ayarları Paneli (Settings Payload)
 */
function buildStaffSettingsPayload(data = loadStaffData()) {
  const settings = data.settings || {};
  const baskanId = settings.baskanRoleId || "1544392306101067878";
  const baskanYrdId = settings.baskanYardimcisiRoleId || "1544393522784903278";
  const roles = settings.roles || DEFAULT_STAFF_RANKS;
  const tpl = settings.templates || DEFAULT_TEMPLATES;

  const rolesText = roles.map(r => `• **Sıra ${r.rank}:** \`${r.name}\` ➔ <@&${r.id}> (\`${r.id}\`)`).join('\n');

  const content = [
    ComponentsV2Factory.text(
      `# ⚙️ YETKİLİ SİSTEM & ROL AYARLARI\n` +
      `*Panelden yetkili hiyerarşi rollerini, başkan/başkan yardımcısı rollerini ve botun gönderdiği otomatik mesaj şablonlarını özelleştirebilirsiniz.*\n\n` +
      `### 👑 Yetkili Ofisi Üst Yönetim Rolleri:\n` +
      `• 👑 **Başkan Rolü:** <@&${baskanId}> (\`${baskanId}\`)\n` +
      `• 💼 **Başkan Yardımcısı Rolü:** <@&${baskanYrdId}> (\`${baskanYrdId}\`)\n\n` +
      `### 🏷️ Tanımlı Yetkili Rol Hiyerarşisi:\n` +
      rolesText + `\n\n` +
      `### 📝 Hazır Mesaj Şablonları:\n` +
      `• **10. Gün DM Hatırlatması:** \`${tpl.dm10d?.slice(0, 50)}...\`\n` +
      `• **13. Gün Ciddi DM Uyarısı:** \`${tpl.dm13d?.slice(0, 50)}...\`\n` +
      `• **Çalışma Vakti Mesajı:** \`${tpl.workTime?.slice(0, 50)}...\`\n` +
      `• **Toplantı Mesajı:** \`${tpl.meeting?.slice(0, 50)}...\`\n\n` +
      `-# Lütfen düzenlemek istediğiniz ayar butonuna tıklayınız:`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Primary,
        label: "👑 Başkan & Yrd. Rolleri Ayarla",
        custom_id: "robloxland_staffmgmt_btn_set_chief_roles",
        emoji: { name: "👑" }
      },
      {
        style: ButtonStyle.Success,
        label: "➕ Rol Ekle / Güncelle",
        custom_id: "robloxland_staffmgmt_btn_add_role",
        emoji: { name: "➕" }
      },
      {
        style: ButtonStyle.Danger,
        label: "🗑️ Rol Sil",
        custom_id: "robloxland_staffmgmt_btn_delete_role",
        emoji: { name: "🗑️" }
      }
    ]),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Secondary,
        label: "📝 Mesaj Şablonlarını Düzenle",
        custom_id: "robloxland_staffmgmt_btn_edit_templates",
        emoji: { name: "📝" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "⚡ Otomasyon & Kural Ayarları",
        custom_id: "robloxland_staffmgmt_btn_edit_rules",
        emoji: { name: "⚡" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🔙 Ana Kontrol Merkezi",
        custom_id: "robloxland_staffmgmt_back_hub",
        emoji: { name: "🔙" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ── Dinlere & İnançlara Göre Sadakat ve Görev Yeminleri ────────────────────
const FAITH_OATHS = {
  islam: {
    key: "islam",
    name: "☪️ İslam",
    oath: "Allah'ın huzurunda ve Kuran-ı Kerim üzerine; RobloxLand topluluğunda adaletle görev yapacağıma, yetkimi kötüye kullanmayacağıma, hak yemeyeceğime, ayrıcalık tanımayacağıma ve gizlilik ilkelerine sadık kalacağıma namusum ve şerefim üzerine yemin ederim."
  },
  christianity: {
    key: "christianity",
    name: "✝️ Hristiyanlık",
    oath: "Tanrı'nın huzurunda ve Kutsal İncil üzerine; RobloxLand topluluğunda doğruluk ve dürüstlükle görev yapacağıma, adaletle hükmedeceğime, yetkimi kötüye kullanmayacağıma ve gizlilik kurallarına uyacağıma yemin ederim."
  },
  judaism: {
    key: "judaism",
    name: "✡️ Musevilik",
    oath: "Tanrı'nın huzurunda ve Tevrat üzerine; adalet, dürüstlük ve hakkaniyetle görevimi yerine getireceğime, topluluk düzenine ve gizliliğe sadık kalacağıma yemin ederim."
  },
  buddhism: {
    key: "buddhism",
    name: "☸️ Budizm / Doğu Felsefesi",
    oath: "Doğruluk, dürüstlük ve erdem yolunda; RobloxLand topluluğunda adaletle, kimseye zarar vermeden ve tarafsızlıkla görev yapacağıma yemin ederim."
  },
  deism: {
    key: "deism",
    name: "🕊️ Deizm / Teizm",
    oath: "Yaratıcının huzurunda ve tüm vicdanım üzerine; RobloxLand yetkili kadrosunda hakkaniyetle, adaletle ve dürüstlükle görev yapacağıma yemin ederim."
  },
  secular: {
    key: "secular",
    name: "🌐 Evrensel / Laik / Vicdani Yemin",
    oath: "Tüm vicdanım, şerefim ve haysiyetim üzerine; RobloxLand yetkili kadrosunda hiçbir ayrımcılık yapmaksızın, adalet ve tarafsızlıkla görev yapacağıma ve topluluk kurallarına sadık kalacağıma yemin ederim."
  }
};

/**
 * 2. Gelişmiş Yetkili Profil Kartı Payload'u
 */
function buildStaffProfilePayload(staff) {
  const health = calculateStaffHealth(staff);
  const promo = evaluatePromotionEligibility(staff);
  const demo = evaluateDemotionRisk(staff);
  const perfBar = renderProgressBar(staff.performanceScore || 80);

  let promoSection = '';
  if (promo.isReady) {
    promoSection = `### ⬆️ Terfi Durumu: ✅ TERFİYE HAZIR!\n` +
                   `> Bu yetkili tüm terfi kriterlerini eksiksiz tamamladı. Yöneticiler terfi butonunu kullanarak rütbesini yükseltebilir.\n`;
  } else {
    promoSection = `### ⬆️ Terfi İlerlemesi: %${promo.progressPercent}\n` +
                   `• ${promo.passedDays ? '✅' : '❌'} 14 gün görev süresi (${promo.daysInRank}/14 gün)\n` +
                   `• ${promo.passedWorks ? '✅' : '❌'} 10 sistem/map çalışması (${promo.works30d}/10)\n` +
                   `• ${promo.passedPerf ? '✅' : '❌'} 80+ Performans puanı (${promo.performance}/80)\n` +
                   `• ${promo.passedQuality ? '✅' : '❌'} En az 3 kaliteli çalışma (${promo.qualityWorks}/3)\n` +
                   `• ${promo.passedWarnings ? '✅' : '❌'} Aktif uyarı olmaması (${promo.activeWarnings} uyarı)\n` +
                   `*Eksikler:* ${promo.missingItems.length ? promo.missingItems.join(', ') : 'Yok'}\n`;
  }

  let demoWarning = '';
  if (demo.isRisk) {
    demoWarning = `\n> ⚠️ **YÖNETİCİ İNCELEMESİ GEREKLİ (RD ADAYI)**\n` +
                  `> *Risk Gerekçeleri:* ${demo.reasons.join(', ')}\n`;
  }

  const oathStatusText = staff.oathStatus === 'sworn'
    ? `✅ Edildi (\`${staff.faith || 'Evrensel'}\` — <t:${Math.floor((staff.oathDate || Date.now()) / 1000)}:d>)`
    : `❌ Henüz Edilmedi (Bekleniyor)`;

  const personalityTestText = staff.personalityTestCompleted
    ? `✅ Tamamlandı (20/20 Bilgi Kayıtlı)`
    : `❌ Henüz Yapılmadı (Bekleniyor)`;

  const logsText = (staff.historyLogs && staff.historyLogs.length > 0)
    ? staff.historyLogs.slice(0, 5).map(l => `• <t:${Math.floor(l.date / 1000)}:d> — ${l.text}`).join('\n')
    : '• Henüz işlem kaydı bulunmuyor.';

  const content = [
    ComponentsV2Factory.text(
      `# 👤 YETKİLİ PROFİL KARTI — <@${staff.userId}>\n\n` +
      `• 🏷️ **Rütbe:** \`${staff.roleName || 'Yetkili'}\`\n` +
      `• 🛡️ **Durum:** ${health.badge}\n` +
      `• 📜 **Görev Yemini:** ${oathStatusText}\n` +
      `• 🧠 **Kişilik & Envanter Testi:** ${personalityTestText}\n` +
      `• ⭐ **Performans:** \`${staff.performanceScore || 80}/100\` [${perfBar}]\n\n` +
      `• 📦 **Bu Ayki Çalışmalar:** \`${staff.workCount30d || 0}\` adet | 🌟 **Kaliteli Çalışma:** \`${staff.qualityWorksCount || 0}\`\n` +
      `• 🔥 **Çalışma Serisi:** \`${staff.streakDays || 1}\` gün\n` +
      `• ⚠️ **Aktif Uyarılar:** \`${staff.warningsCount || 0}\`\n` +
      `• 📅 **Son Çalışma:** ${health.desc}\n` +
      demoWarning + `\n` +
      promoSection + `\n` +
      `### 📋 Son İşlem Geçmişi (Sicil):\n` +
      logsText
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: promo.isReady ? "⬆️ Terfi Et (Hazır)" : "⬆️ Terfi",
        custom_id: `robloxland_staffmgmt_act_promote_${staff.userId}`,
        emoji: { name: "⬆️" }
      },
      {
        style: ButtonStyle.Danger,
        label: "⬇️ RD Değerlendir",
        custom_id: `robloxland_staffmgmt_act_demote_${staff.userId}`,
        emoji: { name: "⬇️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "⚠️ Uyar",
        custom_id: `robloxland_staffmgmt_act_warn_${staff.userId}`,
        emoji: { name: "⚠️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "📜 Yemin Gönder",
        custom_id: `robloxland_staffmgmt_act_send_oath_${staff.userId}`,
        emoji: { name: "📜" }
      }
    ]),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Primary,
        label: "📋 Kişisel Bilgiler (20 Bilgi)",
        custom_id: `robloxland_staffmgmt_act_view_personal_info_${staff.userId}`,
        emoji: { name: "📋" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🧠 Kişilik Testi Gönder",
        custom_id: `robloxland_staffmgmt_act_send_personality_test_${staff.userId}`,
        emoji: { name: "🧠" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🕵️ Anonim Mesaj",
        custom_id: `robloxland_staffmgmt_act_anonmsg_${staff.userId}`,
        emoji: { name: "🕵️" }
      }
    ]),
    ComponentsV2Factory.actionRow([
      ...(staff.oathStatus === 'sworn' ? [{
        style: ButtonStyle.Primary,
        label: "📜 Yemin Belgesi (SS)",
        custom_id: `robloxland_staffmgmt_act_view_oath_cert_${staff.userId}`,
        emoji: { name: "🖼️" }
      }] : []),
      {
        style: ButtonStyle.Danger,
        label: "🚪 Kadrodan Çıkar",
        custom_id: `robloxland_staffmgmt_act_kick_${staff.userId}`,
        emoji: { name: "🚪" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🔙 Kadro Listesi",
        custom_id: "robloxland_staffmgmt_list",
        emoji: { name: "🔙" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

/**
 * 14. Yetkili Kişisel Bilgileri & Kişilik Envanteri (20 Kapsamlı Bilgi Kartı)
 */
function buildStaffPersonalInfoPayload(staff) {
  const p = staff.personalInfo || {};
  const statusBadge = staff.personalityTestCompleted
    ? '🟢 **Tamamlandı** (20/20 Bilgi Kayıtlı)'
    : '🟡 **Devam Ediyor / Eksik**';

  const content = [
    ComponentsV2Factory.text(
      `# 📋 YETKİLİ KİŞİSEL BİLGİ & KİŞİLİK ENVANTERİ\n` +
      `👤 **Yetkili:** <@${staff.userId}> (\`${staff.username || staff.userId}\`)\n` +
      `🏷️ **Rütbe:** \`${staff.roleName || 'Yetkili'}\` | 📊 **Envanter Durumu:** ${statusBadge}\n\n` +
      `### 👤 1. Temel & Kimlik Bilgileri\n` +
      `• 👤 **İsim / Hitap:** \`${p.name || 'Girilmedi'}\`\n` +
      `• 🎂 **Yaş / Doğum Yılı:** \`${p.age || 'Girilmedi'}\`\n` +
      `• ⚧️ **Cinsiyet:** \`${p.gender || 'Girilmedi'}\`\n` +
      `• ☪️ **İnanç / Din:** \`${p.religion || staff.faith || 'Girilmedi'}\`\n` +
      `• 🌍 **Yaşadığı Şehir / Bölge:** \`${p.city || 'Girilmedi'}\`\n\n` +
      `### 🧠 2. Karakter, MBTI & İletişim Mizaçları\n` +
      `• 🧠 **MBTI Kişilik Tipi:** \`${p.mbti || 'Girilmedi'}\`\n` +
      `• 🕊️ **Karakter & Mizaç:** \`${p.temperament || 'Girilmedi'}\`\n` +
      `• 🎯 **Stres Altında Tutum:** \`${p.stressHandling || 'Girilmedi'}\`\n` +
      `• 💬 **İletişim Tarzı:** \`${p.communicationStyle || 'Girilmedi'}\`\n` +
      `• 🎧 **Mikrofon & Ses Durumu:** \`${p.micStatus || 'Girilmedi'}\`\n\n` +
      `### 🛡️ 3. Roblox Uzmanlık & Ekip Becerileri\n` +
      `• 🎮 **Roblox Uzmanlık Alanı:** \`${p.robloxSpecialty || 'Girilmedi'}\`\n` +
      `• ⏳ **Haftalık Aktiflik Süresi:** \`${p.weeklyHours || 'Girilmedi'}\`\n` +
      `• 🛡️ **Kriz Anı Davranışı:** \`${p.crisisAction || 'Girilmedi'}\`\n` +
      `• 🤝 **Takım Çalışması Uyumu:** \`${p.teamwork || 'Girilmedi'}\`\n` +
      `• 📚 **Öğrenim / Meslek Durumu:** \`${p.educationWork || 'Girilmedi'}\`\n\n` +
      `### 🌟 4. Gelişim, Gelecek Hedefleri & Felsefe\n` +
      `• ⭐ **En Güçlü Yönü:** \`${p.strongestTrait || 'Girilmedi'}\`\n` +
      `• ⚠️ **Geliştirmek İstediği Yön:** \`${p.growthArea || 'Girilmedi'}\`\n` +
      `• 🏆 **Gelecek Hedefi:** \`${p.futureGoal || 'Girilmedi'}\`\n` +
      `• 🎨 **Hobiler & İlgi Alanları:** \`${p.hobbies || 'Girilmedi'}\`\n` +
      `• 📜 **Kişisel Hayat Mottosu:** *"${p.lifeMotto || 'Belirtilmedi'}"*`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Primary,
        label: "🧠 Kişilik Testi Gönder / Yenile",
        custom_id: `robloxland_staffmgmt_act_send_personality_test_${staff.userId}`,
        emoji: { name: "🧠" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🔙 Profil Kartına Dön",
        custom_id: `robloxland_staffmgmt_view_profile_${staff.userId}`,
        emoji: { name: "🔙" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "📋 Kadro Listesi",
        custom_id: "robloxland_staffmgmt_list",
        emoji: { name: "📋" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

/**
 * Mesajın Geçerli Bir Sistem/Map Çalışması Olup Olmadığını Doğrular
 */
function isValidWorkMessage(message) {
  if (!message || message.author?.bot) return false;
  const content = message.content || '';
  const hasAttachment = Boolean(message.attachments && message.attachments.size > 0);

  const hasValidLink = /(roblox\.com|github\.com|devforum\.roblox\.com|pastebin\.com|mediafire\.com|drive\.google\.com)/i.test(content);
  const hasCodeBlock = content.includes('```') && content.length >= 30;
  const hasDetailedWorkDescription = content.length >= 50 && /(sistem|model|map|script|ui|gui|harita|plugin|animasyon)/i.test(content);

  return hasAttachment || hasValidLink || hasCodeBlock || hasDetailedWorkDescription;
}

/**
 * 6. Kategorideki Paylaşım Mesajını Dinler ve Kalite Kontrol Havuzuna Gönderir
 */
async function handleStaffWorkMessage(message) {
  if (!message || !message.guild || message.guild.id !== GUILD_ID) return false;
  if (message.author.bot) return false;

  const parentId = message.channel?.parentId || message.channel?.parent?.id;
  if (parentId !== WORK_CATEGORY_ID && message.channelId !== WORK_CATEGORY_ID) {
    return false;
  }

  if (!isValidWorkMessage(message)) {
    return false;
  }

  const data = loadStaffData();
  const userId = message.author.id;
  const workId = `work-${Date.now().toString().slice(-6)}`;

  if (!data.staffMembers[userId]) {
    data.staffMembers[userId] = {
      userId,
      username: message.author.username,
      roleName: "Moderatör",
      joinedStaffAt: Date.now(),
      lastWorkAt: Date.now(),
      workCountTotal: 0,
      workCount30d: 0,
      qualityWorksCount: 0,
      streakDays: 1,
      status: 'active',
      leaveUntil: null,
      leaveReason: null,
      performanceScore: 80,
      warningsCount: 0,
      historyLogs: [
        { date: Date.now(), text: 'Kadroya katıldı ve ilk çalışmasını gönderdi (İncelemede)' }
      ],
      assignedTasks: []
    };
  }

  // Kalite Kontrol Havuzuna Ekle (⏳ İnceleme Bekliyor)
  data.pendingWorks[workId] = {
    id: workId,
    userId,
    username: message.author.username,
    channelId: message.channelId,
    messageId: message.id,
    content: message.content?.slice(0, 300) || 'Dosya / Attachment Paylaşımı',
    submittedAt: Date.now(),
    status: 'pending',
    stars: 0,
    reviewReason: ''
  };

  saveStaffData(data);

  // Tepki ile iletildiğini belirt
  await message.react('⏳').catch(() => {});

  // Yönetim Kanalına Bildir
  try {
    const mgmtChan = message.guild.channels.cache.get(PANEL_CHANNEL_ID) ||
                     await message.guild.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
    if (mgmtChan && mgmtChan.isTextBased()) {
      await mgmtChan.send({
        ...ComponentsV2Factory.buildPayload([
          ComponentsV2Factory.text(
            `# 📦 YENİ SİSTEM/MAP ÇALIŞMASI GELDİ (#${workId})\n\n` +
            `👤 **Gönderen:** <@${userId}> (\`${message.author.tag}\`)\n` +
            `📍 **Kanal:** <#${message.channelId}>\n` +
            `📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
            `**Açıklama / İçerik:**\n> ${message.content?.slice(0, 250) || 'Dosya/Model eki paylaşıldı.'}\n\n` +
            `*Lütfen çalışmanın kalitesini değerlendirerek onaylayınız veya revize isteyiniz:*`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            {
              style: ButtonStyle.Success,
              label: "⭐ 5 Yıldız (+7 Puan)",
              custom_id: `robloxland_staffmgmt_rate_5_${workId}`,
              emoji: { name: "🌟" }
            },
            {
              style: ButtonStyle.Primary,
              label: "⭐ 3 Yıldız (+4 Puan)",
              custom_id: `robloxland_staffmgmt_rate_3_${workId}`,
              emoji: { name: "⭐" }
            },
            {
              style: ButtonStyle.Secondary,
              label: "⭐ 1 Yıldız (+1 Puan)",
              custom_id: `robloxland_staffmgmt_rate_1_${workId}`,
              emoji: { name: "✨" }
            },
            {
              style: ButtonStyle.Danger,
              label: "❌ Reddet / Revize",
              custom_id: `robloxland_staffmgmt_rate_reject_${workId}`,
              emoji: { name: "🚫" }
            }
          ])
        ])
      });
    }
  } catch (_) {}

  return true;
}

/**
 * 1. 10 Günlük & 13 Günlük Periyodik Denetim & Uyarı Motoru
 */
async function runDailyStaffAudit(client) {
  const data = loadStaffData();
  const staffList = Object.values(data.staffMembers || {});
  const now = Date.now();

  for (const staff of staffList) {
    if (staff.leaveUntil && staff.leaveUntil > now) continue;

    const daysSinceWork = Math.floor((now - (staff.lastWorkAt || staff.joinedStaffAt || now)) / (1000 * 60 * 60 * 24));

    try {
      const user = await client.users.fetch(staff.userId).catch(() => null);
      if (!user) continue;

      // 10. Gün: İlk Nazik Hatırlatma DM
      if (daysSinceWork >= 10 && daysSinceWork < 13 && !staff.warned10d) {
        staff.warned10d = true;
        staff.acknowledgedActive = false;
        staff.performanceScore = Math.max(0, (staff.performanceScore || 70) - 5);
        staff.historyLogs = staff.historyLogs || [];
        staff.historyLogs.unshift({ date: now, text: '10 gündür çalışma yapılmadığı için aktivite hatırlatması yapıldı (-5 Puan)' });

        const dmPayload = ComponentsV2Factory.buildPayload([
          ComponentsV2Factory.text(
            `# 🔔 RobloxLand Yetkili Aktivite Kontrolü\n\n` +
            `Selam **${user.username}** 👋\n\n` +
            `Bir süredir sistem veya map paylaşmadığını fark ettik (Son 10 gün).\n` +
            `Aktif misin?\n\n` +
            `-# Lütfen aşağıdaki butonlardan durumunu seç:`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            {
              style: ButtonStyle.Success,
              label: "✅ Aktifim",
              custom_id: `robloxland_staff_dm_active_${staff.userId}`,
              emoji: { name: "✅" }
            },
            {
              style: ButtonStyle.Primary,
              label: "🏖️ İzinliyim",
              custom_id: `robloxland_staff_dm_leave_${staff.userId}`,
              emoji: { name: "🏖️" }
            },
            {
              style: ButtonStyle.Secondary,
              label: "💬 Sorun Var / Yönetime Yaz",
              custom_id: `robloxland_staff_dm_reply_${staff.userId}`,
              emoji: { name: "💬" }
            }
          ])
        ]);

        await user.send(dmPayload).catch(() => {});
      }

      // 13. Gün: Ciddi Hatırlatma DM (3 gün daha bir şey atmazsa)
      if (daysSinceWork >= 13 && !staff.warned13d) {
        staff.warned13d = true;
        staff.performanceScore = Math.max(0, (staff.performanceScore || 70) - 10);
        staff.historyLogs = staff.historyLogs || [];
        staff.historyLogs.unshift({ date: now, text: '13 gündür çalışma yapılmadığı için 2. kontrol uyarısı gönderildi (-10 Puan)' });

        const dmPayload13 = ComponentsV2Factory.buildPayload([
          ComponentsV2Factory.text(
            `# ⚠️ RobloxLand Yetkili Durum Uyarısı\n\n` +
            `Selam **${user.username}**,\n\n` +
            `3 gündür hâlâ hiç sistem-map atmadın! Bir şey mi oldu?\n` +
            `Eğer yardıma ihtiyacın varsa veya mazeretin bulunuyorsa lütfen yönetime bildir.\n\n` +
            `Topluluğumuz için yetkili kadromuzun aktifliği büyük önem taşımaktadır.`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            {
              style: ButtonStyle.Primary,
              label: "🏖️ İzin Bildir",
              custom_id: `robloxland_staff_dm_leave_${staff.userId}`,
              emoji: { name: "🏖️" }
            },
            {
              style: ButtonStyle.Secondary,
              label: "💬 Yönetime Yanıtla",
              custom_id: `robloxland_staff_dm_reply_${staff.userId}`,
              emoji: { name: "💬" }
            }
          ])
        ]);

        await user.send(dmPayload13).catch(() => {});
      }
    } catch (_) {}
  }

  saveStaffData(data);
}

/**
 * Tüm Etkileşimleri Yönetir (Buttons, Select Menus, Modals)
 */
async function handleStaffManagementInteraction(interaction) {
  const customId = interaction.customId;
  if (!customId || (
    !customId.startsWith('robloxland_staffmgmt_') &&
    !customId.startsWith('robloxland_staff_dm_') &&
    !customId.startsWith('robloxland_staff_oath_') &&
    !customId.startsWith('robloxland_staff_ptest_')
  )) {
    return false;
  }

  const { guild, member, user } = interaction;
  const data = loadStaffData();

  // ── 0. KİŞİLİK & ENVANTER TESTİ DM ETKİLEŞİMLERİ ──

  // Aşama 1 Butonu: Temel & Kimlik Bilgileri
  if (customId.startsWith('robloxland_staff_ptest_step1_')) {
    const targetUserId = customId.replace('robloxland_staff_ptest_step1_', '');
    const staff = data.staffMembers[targetUserId];
    const p = staff?.personalInfo || {};

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_ptest_step1_${targetUserId}`)
      .setTitle("🧠 Aşama 1: Temel & Kimlik Bilgileri");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_name").setLabel("1. İsim / Hitap").setValue(p.name || "").setPlaceholder("Örn: Ege / Alp").setStyle(TextInputStyle.Short).setMaxLength(40).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_age").setLabel("2. Yaş / Doğum Yılı").setValue(p.age || "").setPlaceholder("Örn: 18 (2008)").setStyle(TextInputStyle.Short).setMaxLength(20).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_gender").setLabel("3. Cinsiyet").setValue(p.gender || "").setPlaceholder("Örn: Erkek / Kadın / Belirtmek İstemiyor").setStyle(TextInputStyle.Short).setMaxLength(30).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_religion").setLabel("4. İnanç / Din").setValue(p.religion || staff?.faith || "").setPlaceholder("Örn: İslam / Hristiyanlık / Deizm / Agnostik vb.").setStyle(TextInputStyle.Short).setMaxLength(40).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_city").setLabel("5. Yaşadığı Şehir / Bölge").setValue(p.city || "").setPlaceholder("Örn: İstanbul / Ankara / İzmir vb.").setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Aşama 2 Butonu: Karakter, MBTI & İletişim
  if (customId.startsWith('robloxland_staff_ptest_step2_')) {
    const targetUserId = customId.replace('robloxland_staff_ptest_step2_', '');
    const staff = data.staffMembers[targetUserId];
    const p = staff?.personalInfo || {};

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_ptest_step2_${targetUserId}`)
      .setTitle("🧠 Aşama 2: Karakter & İletişim");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_mbti").setLabel("6. MBTI Kişilik Tipi").setValue(p.mbti || "").setPlaceholder("Örn: INTJ, ENFP, ISTP, Bilmiyorum").setStyle(TextInputStyle.Short).setMaxLength(20).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_temperament").setLabel("7. Karakter & Mizaç").setValue(p.temperament || "").setPlaceholder("Örn: Sakin, Çözüm Odaklı, Lider Ruhlu").setStyle(TextInputStyle.Short).setMaxLength(60).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_stress").setLabel("8. Stres Altında Tutum").setValue(p.stressHandling || "").setPlaceholder("Örn: Soğukkanlı, Kuralcı, Uzlaşmacı").setStyle(TextInputStyle.Short).setMaxLength(60).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_comm").setLabel("9. İletişim Tarzı").setValue(p.communicationStyle || "").setPlaceholder("Örn: Resmi, Samimi, Doğrudan/Net").setStyle(TextInputStyle.Short).setMaxLength(60).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_mic").setLabel("10. Mikrofon & Ses Durumu").setValue(p.micStatus || "").setPlaceholder("Örn: Aktif Konuşabilir / Sadece Dinleyici").setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Aşama 3 Butonu: Roblox Uzmanlık & Ekip
  if (customId.startsWith('robloxland_staff_ptest_step3_')) {
    const targetUserId = customId.replace('robloxland_staff_ptest_step3_', '');
    const staff = data.staffMembers[targetUserId];
    const p = staff?.personalInfo || {};

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_ptest_step3_${targetUserId}`)
      .setTitle("🧠 Aşama 3: Roblox & Ekip Becerileri");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_specialty").setLabel("11. Roblox Uzmanlık Alanı").setValue(p.robloxSpecialty || "").setPlaceholder("Örn: Scripter, Builder, UI, Moderatör").setStyle(TextInputStyle.Short).setMaxLength(60).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_hours").setLabel("12. Haftalık Aktiflik Süresi").setValue(p.weeklyHours || "").setPlaceholder("Örn: Günde 4 saat / Haftada 25 saat").setStyle(TextInputStyle.Short).setMaxLength(40).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_crisis").setLabel("13. Kriz Anı Davranışı").setValue(p.crisisAction || "").setPlaceholder("Örn: Önce kanıt toplar, amirlere danışır").setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_teamwork").setLabel("14. Takım Çalışması Uyumu").setValue(p.teamwork || "").setPlaceholder("Örn: Takım oyuncusu, uyumlu, koordine").setStyle(TextInputStyle.Short).setMaxLength(60).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_edu").setLabel("15. Öğrenim / Meslek Durumu").setValue(p.educationWork || "").setPlaceholder("Örn: Üniversite Öğrencisi / Yazılımcı").setStyle(TextInputStyle.Short).setMaxLength(60).setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Aşama 4 Butonu: Güçlü Yönler, Hedefler & Hayat Mottosu
  if (customId.startsWith('robloxland_staff_ptest_step4_')) {
    const targetUserId = customId.replace('robloxland_staff_ptest_step4_', '');
    const staff = data.staffMembers[targetUserId];
    const p = staff?.personalInfo || {};

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_ptest_step4_${targetUserId}`)
      .setTitle("🧠 Aşama 4: Hedefler & Hayat Mottosu");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_strong").setLabel("16. En Güçlü Yönü").setValue(p.strongestTrait || "").setPlaceholder("Örn: Hızlı problem çözme, sabır, empati").setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_growth").setLabel("17. Geliştirmek İstediği Yön").setValue(p.growthArea || "").setPlaceholder("Örn: Zaman yönetimi, 3D modelleme").setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_goal").setLabel("18. Gelecek Hedefi").setValue(p.futureGoal || "").setPlaceholder("Örn: Baş Moderatör olmak, stüdyo kurmak").setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_hobbies").setLabel("19. Hobiler & İlgi Alanları").setValue(p.hobbies || "").setPlaceholder("Örn: Oyun geliştirme, müzik, tasarım").setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("p_motto").setLabel("20. Kişisel Hayat Mottosu").setValue(p.lifeMotto || "").setPlaceholder("Örn: Adalet mülkün temelidir").setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Kişilik Testi Modalları Submit İşleyicileri
  if (customId.startsWith('robloxland_staffmgmt_modal_ptest_step')) {
    const parts = customId.split('_');
    const stepNum = parts[4].replace('step', '');
    const targetUserId = parts[5];
    const staff = data.staffMembers[targetUserId];

    if (staff) {
      staff.personalInfo = staff.personalInfo || {};

      if (stepNum === '1') {
        staff.personalInfo.name = interaction.fields.getTextInputValue("p_name")?.trim();
        staff.personalInfo.age = interaction.fields.getTextInputValue("p_age")?.trim();
        staff.personalInfo.gender = interaction.fields.getTextInputValue("p_gender")?.trim();
        staff.personalInfo.religion = interaction.fields.getTextInputValue("p_religion")?.trim();
        staff.personalInfo.city = interaction.fields.getTextInputValue("p_city")?.trim();
      } else if (stepNum === '2') {
        staff.personalInfo.mbti = interaction.fields.getTextInputValue("p_mbti")?.trim();
        staff.personalInfo.temperament = interaction.fields.getTextInputValue("p_temperament")?.trim();
        staff.personalInfo.stressHandling = interaction.fields.getTextInputValue("p_stress")?.trim();
        staff.personalInfo.communicationStyle = interaction.fields.getTextInputValue("p_comm")?.trim();
        staff.personalInfo.micStatus = interaction.fields.getTextInputValue("p_mic")?.trim();
      } else if (stepNum === '3') {
        staff.personalInfo.robloxSpecialty = interaction.fields.getTextInputValue("p_specialty")?.trim();
        staff.personalInfo.weeklyHours = interaction.fields.getTextInputValue("p_hours")?.trim();
        staff.personalInfo.crisisAction = interaction.fields.getTextInputValue("p_crisis")?.trim();
        staff.personalInfo.teamwork = interaction.fields.getTextInputValue("p_teamwork")?.trim();
        staff.personalInfo.educationWork = interaction.fields.getTextInputValue("p_edu")?.trim();
      } else if (stepNum === '4') {
        staff.personalInfo.strongestTrait = interaction.fields.getTextInputValue("p_strong")?.trim();
        staff.personalInfo.growthArea = interaction.fields.getTextInputValue("p_growth")?.trim();
        staff.personalInfo.futureGoal = interaction.fields.getTextInputValue("p_goal")?.trim();
        staff.personalInfo.hobbies = interaction.fields.getTextInputValue("p_hobbies")?.trim();
        staff.personalInfo.lifeMotto = interaction.fields.getTextInputValue("p_motto")?.trim();
      }

      const p = staff.personalInfo;
      const filledCount = Object.values(p).filter(v => Boolean(v && v !== 'Girilmedi')).length;

      if (filledCount >= 18) {
        staff.personalityTestCompleted = true;
        staff.performanceScore = Math.min(100, (staff.performanceScore || 80) + 5);
        staff.historyLogs = staff.historyLogs || [];
        staff.historyLogs.unshift({
          date: Date.now(),
          text: `KİŞİLİK & ENVANTER TESTİNİ TAMAMLADI (20/20 Bilgi) (+5 Bonus Puan)`
        });

        // Yönetim Kanalına Bildir
        try {
          const mgmtChan = interaction.client.channels.cache.get(PANEL_CHANNEL_ID) ||
                           interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID);
          if (mgmtChan && mgmtChan.isTextBased()) {
            await mgmtChan.send({
              ...ComponentsV2Factory.buildPayload([
                ComponentsV2Factory.text(
                  `# 🧠 YETKİLİ KİŞİLİK & PROFİL TESTİNİ TAMAMLADI!\n\n` +
                  `👤 **Yetkili:** <@${targetUserId}>\n` +
                  `📊 **Tamamlanan Bilgi:** \`20/20 Kapsamlı Profil\`\n` +
                  `🧠 **MBTI & Mizaç:** \`${p.mbti || '-'}\` • \`${p.temperament || '-'}\`\n` +
                  `🎮 **Roblox Alanı:** \`${p.robloxSpecialty || '-'}\`\n\n` +
                  `✅ Yetkilinin tüm 20 kişisel ve karakter bilgisi profil sayfasına işlenmiştir.`
                )
              ])
            });
          }
        } catch (_) {}
      }

      saveStaffData(data);

      await interaction.reply({
        content: `✅ **Aşama ${stepNum} Bilgileri Kaydedildi!** (Toplam: ${filledCount}/20 Bilgi Tamamlandı)\n${filledCount >= 18 ? '🎉 **Tebrikler! 20 soruluk kişilik testini başarıyla tamamladınız! Bilgiler profil sayfanıza eklendi.**' : 'Lütfen diğer aşama butonlarına tıklayarak kalan soruları tamamlayınız.'}`,
        ephemeral: true
      });
      return true;
    }
  }

  // ── 1. DM Üzerinden Gelen Yetkili Butonları ──
  if (customId.startsWith('robloxland_staff_dm_')) {
    if (customId.startsWith('robloxland_staff_dm_active_')) {
      const staffId = customId.replace('robloxland_staff_dm_active_', '');
      if (data.staffMembers[staffId]) {
        data.staffMembers[staffId].acknowledgedActive = true;
        data.staffMembers[staffId].historyLogs = data.staffMembers[staffId].historyLogs || [];
        data.staffMembers[staffId].historyLogs.unshift({ date: Date.now(), text: 'DM uyarısına "Aktifim" yanıtı verdi' });
        saveStaffData(data);
      }
      return await interaction.reply({
        content: '✅ **Geri bildirimin alındı!** Panelde durumun `🟡 Aktif olduğunu belirtti` olarak güncellendi. Lütfen en kısa sürede sistem/map paylaşımını gerçekleştir.',
        ephemeral: true
      });
    }

    if (customId.startsWith('robloxland_staff_dm_leave_')) {
      const staffId = customId.replace('robloxland_staff_dm_leave_', '');
      const modal = new ModalBuilder()
        .setCustomId(`robloxland_staffmgmt_modal_dmleave_${staffId}`)
        .setTitle("🏖️ İzin & Mazeret Talep Formu");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("leave_days")
            .setLabel("İzin Süresi (Gün Sayısı)")
            .setPlaceholder("Örn: 3, 7 veya 14")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(3)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("leave_reason")
            .setLabel("İzin Gerekçesi")
            .setPlaceholder("Örn: Sınav haftam / Tatil / Kişisel işler")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(200)
            .setRequired(true)
        )
      );

      await interaction.showModal(modal);
      return true;
    }

    if (customId.startsWith('robloxland_staff_dm_reply_')) {
      const staffId = customId.replace('robloxland_staff_dm_reply_', '');
      const modal = new ModalBuilder()
        .setCustomId(`robloxland_staffmgmt_modal_dmreply_${staffId}`)
        .setTitle("💬 Yönetime Mesaj Gönder");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reply_text")
            .setLabel("Yönetime İletmek İstediğiniz Mesaj")
            .setPlaceholder("Durumunuzu, ihtiyacınızı veya sorunuzu yazınız...")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(400)
            .setRequired(true)
        )
      );

      await interaction.showModal(modal);
      return true;
    }
  }

  // ── 2. DM Modalları & Yemin Yanıtları ──
  if (customId.startsWith('robloxland_staffmgmt_modal_dmleave_')) {
    const staffId = customId.replace('robloxland_staffmgmt_modal_dmleave_', '');
    const daysRaw = parseInt(interaction.fields.getTextInputValue('leave_days'), 10) || 7;
    const days = Math.max(1, Math.min(60, daysRaw));
    const reason = interaction.fields.getTextInputValue('leave_reason') || 'Belirtilmedi';

    const leaveId = `leave-${Date.now().toString().slice(-5)}`;
    data.pendingLeaves[leaveId] = {
      id: leaveId,
      userId: staffId,
      username: user.username,
      durationDays: days,
      reason: reason,
      submittedAt: Date.now(),
      status: 'pending'
    };
    saveStaffData(data);

    // Yönetim Kanalına Bildir
    try {
      const mgmtChan = interaction.client.channels.cache.get(PANEL_CHANNEL_ID) ||
                       interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID);
      if (mgmtChan && mgmtChan.isTextBased()) {
        await mgmtChan.send({
          ...ComponentsV2Factory.buildPayload([
            ComponentsV2Factory.text(
              `# 🏖️ YENİ İZİN TALEBİ GELDİ (#${leaveId})\n\n` +
              `👤 **Yetkili:** <@${staffId}> (\`${user.tag}\`)\n` +
              `⏱️ **Talep Edilen Süre:** \`${days} Gün\`\n` +
              `📝 **Gerekçe:** ${reason}\n\n` +
              `*İzin onaylandığında aktivite sayacı durdurulur:*`
            ),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.actionRow([
              {
                style: ButtonStyle.Success,
                label: "✅ İzni Onayla",
                custom_id: `robloxland_staffmgmt_approve_leave_${leaveId}`,
                emoji: { name: "✅" }
              },
              {
                style: ButtonStyle.Danger,
                label: "❌ Reddet",
                custom_id: `robloxland_staffmgmt_reject_leave_${leaveId}`,
                emoji: { name: "🚫" }
              }
            ])
          ])
        });
      }
    } catch (_) {}

    await interaction.reply({
      content: `🏖️ **İzin talebiniz alındı!** (${days} gün). Yönetim onayladığında aktivite uyarıların durdurulacaktır.`,
      ephemeral: true
    });
    return true;
  }

  // 2. Yetkili DM'den Din/İnanç Seçer (DM İçinde)
  if (customId.startsWith('robloxland_staff_oath_select_faith_')) {
    const targetUserId = customId.replace('robloxland_staff_oath_select_faith_', '');
    const selectedKey = interaction.values?.[0] || 'secular';
    const faith = FAITH_OATHS[selectedKey] || FAITH_OATHS.secular;

    const oathCardPayload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 📜 GÖREV YEMİNİ METNİNİZ (${faith.name})\n\n` +
        `> "*${faith.oath}*"\n\n` +
        `Yukarıdaki yemin metnini kabul ediyorsanız lütfen aşağıdaki **✍️ Yemin Et** butonuna tıklayınız ve açılan kutucuğa **Yemin Ederim** yazarak onaylayınız.`
      ),
      ComponentsV2Factory.separator(true),
      ComponentsV2Factory.actionRow([
        {
          style: ButtonStyle.Success,
          label: "✍️ Yemin Et ('Yemin Ederim')",
          custom_id: `robloxland_staff_oath_btn_${selectedKey}_${targetUserId}`,
          emoji: { name: "✍️" }
        }
      ])
    ]);

    await interaction.reply({ ...oathCardPayload, ephemeral: true });
    return true;
  }

  // 3. Yetkili "Yemin Et" Butonuna Basar (Modal Açılır)
  if (customId.startsWith('robloxland_staff_oath_btn_')) {
    const parts = customId.split('_');
    const faithKey = parts[4];
    const targetUserId = parts[5];
    const faith = FAITH_OATHS[faithKey] || FAITH_OATHS.secular;

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_confirm_oath_${faithKey}_${targetUserId}`)
      .setTitle("📜 Görev Yeminini Onayla");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("oath_confirm_input")
          .setLabel("Onaylamak İçin 'Yemin Ederim' Yazınız:")
          .setPlaceholder("Yemin Ederim")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(30)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 4. Yemin Modal Submit Edilir (DM İçinde)
  if (customId.startsWith('robloxland_staffmgmt_modal_confirm_oath_')) {
    const parts = customId.split('_');
    const faithKey = parts[5];
    const targetUserId = parts[6];
    const faith = FAITH_OATHS[faithKey] || FAITH_OATHS.secular;
    const confirmInput = interaction.fields.getTextInputValue("oath_confirm_input")?.trim() || "";

    if (!confirmInput.toLowerCase().includes("yemin ederim")) {
      return await interaction.reply({
        content: "❌ **Yemin onaylanamadı!** Lütfen kutucuğa tam olarak `Yemin Ederim` yazınız.",
        ephemeral: true
      });
    }

    const staff = data.staffMembers[targetUserId];
    if (staff) {
      staff.faith = faith.name;
      staff.oathStatus = 'sworn';
      staff.oathDate = Date.now();
      staff.oathText = faith.oath;
      staff.oathCertificateGenerated = true;
      staff.performanceScore = Math.min(100, (staff.performanceScore || 80) + 5); // Yemin bonusu
      staff.historyLogs = staff.historyLogs || [];
      staff.historyLogs.unshift({
        date: Date.now(),
        text: `GÖREV YEMİNİ ETTİ (${faith.name}): "${faith.oath.slice(0, 60)}..." (+5 Bonus Puan)`
      });

      saveStaffData(data);
    }

    // Resmi Yemin Sertifikası (Canvas SS) Görseli Üret
    const certBuffer = generateOathCertificateBuffer({
      username: (user && user.username) ? user.username : (staff && staff.username ? staff.username : targetUserId),
      faithName: faith.name,
      oathText: faith.oath,
      swornDate: new Date().toLocaleDateString('tr-TR'),
      userId: targetUserId
    });

    const certFiles = certBuffer ? [{ attachment: certBuffer, name: `yemin-belgesi-${targetUserId}.png` }] : [];

    // Yönetim Kanalına Log & Sertifika Gönder
    try {
      const mgmtChan = interaction.client.channels.cache.get(PANEL_CHANNEL_ID) ||
                       interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID);
      if (mgmtChan && mgmtChan.isTextBased()) {
        await mgmtChan.send({
          ...ComponentsV2Factory.buildPayload([
            ComponentsV2Factory.text(
              `# 📜 YENİ GÖREV YEMİNİ KAYDEDİLDİ!\n\n` +
              `👤 **Yetkili:** <@${targetUserId}>\n` +
              `🏷️ **İnanç / Tercih:** \`${faith.name}\`\n` +
              `📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
              `> "*${faith.oath}*"\n\n` +
              `✅ Yetkili resmi olarak "Yemin Ederim" beyanını sunmuş ve göreve başlamıştır. İmzalı yemin belgesi ektedir.`
            )
          ]),
          files: certFiles
        });
      }
    } catch (_) {}

    await interaction.reply({
      content: `🎉 **Tebrikler! Görev yemininiz (${faith.name}) başarıyla kaydedildi.**\nRobloxLand yetkili kadrosuna resmi olarak hoş geldiniz! İmzalı resmi yemin belgeniz ektedir:`,
      files: certFiles,
      ephemeral: true
    });
    return true;
  }

  // ── 3. Yönetici İşlemleri (Yetki Denetimi) ──
  if (!isAuthorizedManager(member)) {
    return await interaction.reply({
      content: '❌ Bu yönetim panelini yalnızca RobloxLand yetkili amirleri ve yöneticileri kullanabilir.',
      ephemeral: true
    });
  }

  // 12. Yemin Belgesini İncele (SS / Sertifika Göster)
  if (customId.startsWith('robloxland_staffmgmt_act_view_oath_cert_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_act_view_oath_cert_', '');
    const staff = data.staffMembers[targetUserId];
    if (!staff) {
      await interaction.reply({ content: '❌ Yetkili bulunamadı.', ephemeral: true });
      return true;
    }

    const certBuffer = generateOathCertificateBuffer({
      username: staff.username || targetUserId,
      faithName: staff.faith || 'Evrensel Yemin',
      oathText: staff.oathText || 'Topluluk kurallarına ve adalete sadık kalacağıma yemin ederim.',
      swornDate: staff.oathDate ? new Date(staff.oathDate).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
      userId: targetUserId
    });

    const certFiles = certBuffer ? [{ attachment: certBuffer, name: `yemin-belgesi-${targetUserId}.png` }] : [];

    await interaction.reply({
      content: `📜 <@${targetUserId}> adlı yetkilinin resmi imzalı **Görev & Sadakat Yemini Belgesi**:`,
      files: certFiles,
      ephemeral: true
    });
    return true;
  }

  // 14. Kişilik & Envanter Testi Gönder (DM ile 4 Aşamalı Form)
  if (customId.startsWith('robloxland_staffmgmt_act_send_personality_test_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_act_send_personality_test_', '');
    const staff = data.staffMembers[targetUserId];
    if (!staff) {
      await interaction.reply({ content: '❌ Yetkili bulunamadı.', ephemeral: true });
      return true;
    }

    const testPromptPayload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 🧠 ROBLOXLND YETKİLİ KİŞİLİK & PROFİL TESTİ (20 SORU)\n\n` +
        `Değerli yetkilimiz <@${targetUserId}>,\n\n` +
        `RobloxLand yönetim kadrosunda sizi daha yakından tanımak, ilgi ve uzmanlık alanlarınıza uygun görevlendirme yapmak adına 20 soruluk **Kişilik & Envanter Testini** doldurmanız gerekmektedir.\n\n` +
        `Test 4 aşamadan oluşur (Her aşamada 5 soru):\n` +
        `• 👤 **Aşama 1:** Temel & Kimlik Bilgileri *(İsim, Yaş, Cinsiyet, Din, Şehir)*\n` +
        `• 🧠 **Aşama 2:** Karakter, MBTI & İletişim Mizaçları *(MBTI, Mizaç, Stres, İletişim, Mikrofon)*\n` +
        `• 🛡️ **Aşama 3:** Roblox Uzmanlık & Ekip Çalışması *(Alan, Saat, Kriz, Takım, Öğrenim)*\n` +
        `• 🌟 **Aşama 4:** Gelişim, Hedefler & Hayat Mottosu *(Güçlü yön, Gelişim, Hedef, Hobi, Motto)*\n\n` +
        `-# Lütfen sırasıyla aşağıdaki butonlara tıklayarak formları doldurunuz:`
      ),
      ComponentsV2Factory.separator(true),
      ComponentsV2Factory.actionRow([
        {
          style: ButtonStyle.Primary,
          label: "👤 Aşama 1: Temel Bilgiler (1-5)",
          custom_id: `robloxland_staff_ptest_step1_${targetUserId}`,
          emoji: { name: "👤" }
        },
        {
          style: ButtonStyle.Primary,
          label: "🧠 Aşama 2: Karakter & MBTI (6-10)",
          custom_id: `robloxland_staff_ptest_step2_${targetUserId}`,
          emoji: { name: "🧠" }
        }
      ]),
      ComponentsV2Factory.actionRow([
        {
          style: ButtonStyle.Primary,
          label: "🛡️ Aşama 3: Roblox & Ekip (11-15)",
          custom_id: `robloxland_staff_ptest_step3_${targetUserId}`,
          emoji: { name: "🛡️" }
        },
        {
          style: ButtonStyle.Primary,
          label: "🌟 Aşama 4: Hedefler & Motto (16-20)",
          custom_id: `robloxland_staff_ptest_step4_${targetUserId}`,
          emoji: { name: "🌟" }
        }
      ])
    ]);

    try {
      const u = await interaction.client.users.fetch(targetUserId).catch(() => null);
      if (u) {
        await u.send(testPromptPayload);
      }
    } catch (err) {
      await interaction.reply({ content: `❌ Yetkilinin DM kutusu kapalı: ${err.message}`, ephemeral: true });
      return true;
    }

    await interaction.reply({
      content: `🧠 <@${targetUserId}> adlı yetkiliye DM üzerinden **20 Soruluk Kişilik & Profil Envanter Testi** başarıyla iletildi!`,
      ephemeral: true
    });
    return true;
  }

  // 15. Yetkili Kişisel Bilgi Dosyasını Göster (20 Bilgi Kartı)
  if (customId.startsWith('robloxland_staffmgmt_act_view_personal_info_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_act_view_personal_info_', '');
    const staff = data.staffMembers[targetUserId];
    if (!staff) {
      await interaction.reply({ content: '❌ Yetkili bulunamadı.', ephemeral: true });
      return true;
    }

    const dossierPayload = buildStaffPersonalInfoPayload(staff);
    await interaction.reply({ ...dossierPayload, ephemeral: true });
    return true;
  }

  // 16. Profil Kartına Geri Dön
  if (customId.startsWith('robloxland_staffmgmt_view_profile_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_view_profile_', '');
    const staff = data.staffMembers[targetUserId];
    if (!staff) {
      await interaction.reply({ content: '❌ Yetkili bulunamadı.', ephemeral: true });
      return true;
    }

    const profilePayload = buildStaffProfilePayload(staff);
    await interaction.reply({ ...profilePayload, ephemeral: true });
    return true;
  }

  // 13. Otomasyon & Kural Ayarları Butonu
  if (customId === 'robloxland_staffmgmt_btn_edit_rules') {
    const rules = data.settings?.automationRules || DEFAULT_AUTOMATION_RULES;
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_edit_rules')
      .setTitle("⚡ Otomasyon & Kural Ayarları");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("rule_days_10")
          .setLabel("1. Hatırlatma DM Eşiği (Gün)")
          .setValue(String(rules.days10Reminder || 10))
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("rule_days_13")
          .setLabel("2. Ciddi Uyarı DM Eşiği (Gün)")
          .setValue(String(rules.days13Warning || 13))
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("rule_days_20")
          .setLabel("3. RD / İnceleme Eşiği (Gün)")
          .setValue(String(rules.days20DemotionReview || 20))
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("rule_score_star5")
          .setLabel("5 Yıldızlı Çalışma Puanı (Örn: 7)")
          .setValue(String(rules.scoreStar5 || 7))
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("rule_penalty_warn")
          .setLabel("Uyarı Başına Puan Kesintisi (Örn: 15)")
          .setValue(String(rules.penaltyWarning || 15))
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Otomasyon Kuralları Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_edit_rules') {
    const d10 = parseInt(interaction.fields.getTextInputValue("rule_days_10"), 10) || 10;
    const d13 = parseInt(interaction.fields.getTextInputValue("rule_days_13"), 10) || 13;
    const d20 = parseInt(interaction.fields.getTextInputValue("rule_days_20"), 10) || 20;
    const star5 = parseInt(interaction.fields.getTextInputValue("rule_score_star5"), 10) || 7;
    const penWarn = parseInt(interaction.fields.getTextInputValue("rule_penalty_warn"), 10) || 15;

    data.settings = data.settings || {};
    data.settings.automationRules = {
      days10Reminder: d10,
      days13Warning: d13,
      days20DemotionReview: d20,
      scoreStar5: star5,
      scoreStar3: 4,
      scoreStar1: 1,
      penaltyWarning: penWarn,
      bonusOath: 5
    };

    saveStaffData(data);

    await interaction.reply({
      content: `⚡ **Otomasyon Kuralları & Puanlama Eşikleri Güncellendi!**\n• **Hatırlatma Eşiği:** \`${d10} Gün\` | **Uyarı:** \`${d13} Gün\` | **RD İnceleme:** \`${d20} Gün\`\n• **5 Yıldız Ödülü:** \`+${star5} Puan\` | **Uyarı Cezası:** \`-${penWarn} Puan\``,
      ephemeral: true
    });
    return true;
  }

  // 6. Kalite Kontrolü Puanlama (5 Yıldız, 3 Yıldız, 1 Yıldız, Reddet)
  if (customId.startsWith('robloxland_staffmgmt_rate_')) {
    const parts = customId.split('_');
    const action = parts[3]; // '5', '3', '1', 'reject'
    const workId = parts.slice(4).join('_');

    const work = data.pendingWorks[workId];
    if (!work) {
      return await interaction.reply({ content: '❌ Bu çalışma kaydı bulunamadı veya daha önce incelendi.', ephemeral: true });
    }

    const targetUserId = work.userId;
    const staff = data.staffMembers[targetUserId];

    if (action === 'reject') {
      work.status = 'rejected';
      work.reviewReason = 'Kalite standardı karşılanmadı / mükerrer içerik';
      saveStaffData(data);

      try {
        const u = await interaction.client.users.fetch(targetUserId).catch(() => null);
        if (u) {
          await u.send(`❌ <#${work.channelId}> kanalında paylaştığınız sistem/map çalışması yönetim tarafından incelenmiş ve **reddedilmiştir**.\n• **Sebep:** Kalite standardı karşılanmadı veya daha önce sunucuda paylaşılmış.`);
        }
      } catch (_) {}

      await interaction.reply({ content: `🚫 Çalışma (#${workId}) reddedildi ve yetkiliye bildirildi.`, ephemeral: true });
      return true;
    }

    const stars = parseInt(action, 10) || 5;
    let scoreAdd = 5;
    if (stars === 5) scoreAdd = 7;
    else if (stars === 3) scoreAdd = 4;
    else if (stars === 1) scoreAdd = 1;

    work.status = 'approved';
    work.stars = stars;

    if (staff) {
      staff.lastWorkAt = Date.now();
      staff.warned10d = false;
      staff.warned13d = false;
      staff.acknowledgedActive = false;
      staff.workCountTotal = (staff.workCountTotal || 0) + 1;
      staff.workCount30d = (staff.workCount30d || 0) + 1;
      if (stars >= 4) staff.qualityWorksCount = (staff.qualityWorksCount || 0) + 1;

      staff.performanceScore = Math.min(100, (staff.performanceScore || 70) + scoreAdd);
      staff.historyLogs = staff.historyLogs || [];
      staff.historyLogs.unshift({
        date: Date.now(),
        text: `Sistem/Map onaylandı (${stars} ⭐) — +${scoreAdd} Performans Puanı (İnceleyen: ${user.tag})`
      });
    }

    // Haftalık sayaç
    const currentWeek = getWeekNumber();
    if (data.weeklyStats?.weekNumber !== currentWeek) {
      data.weeklyStats = { weekNumber: currentWeek, totalWorksThisWeek: 1 };
    } else {
      data.weeklyStats.totalWorksThisWeek = (data.weeklyStats.totalWorksThisWeek || 0) + 1;
    }

    saveStaffData(data);

    try {
      const u = await interaction.client.users.fetch(targetUserId).catch(() => null);
      if (u) {
        await u.send(`🎉 Tebrikler! <#${work.channelId}> kanalındaki çalışmanız **${stars} Yıldız** ile onaylandı ve hesabınıza **+${scoreAdd} Performans Puanı** eklendi!`);
      }
    } catch (_) {}

    await interaction.reply({ content: `✅ Çalışma onaylandı! (${stars} ⭐, +${scoreAdd} Puan yetkiliye tanımlandı).`, ephemeral: true });
    return true;
  }

  // 9. İzin Talebini Onayla / Reddet
  if (customId.startsWith('robloxland_staffmgmt_approve_leave_') || customId.startsWith('robloxland_staffmgmt_reject_leave_')) {
    const isApprove = customId.startsWith('robloxland_staffmgmt_approve_leave_');
    const leaveId = customId.replace('robloxland_staffmgmt_approve_leave_', '').replace('robloxland_staffmgmt_reject_leave_', '');

    const leave = data.pendingLeaves[leaveId];
    if (!leave) {
      return await interaction.reply({ content: '❌ İzin talebi bulunamadı.', ephemeral: true });
    }

    leave.status = isApprove ? 'approved' : 'rejected';
    const staff = data.staffMembers[leave.userId];

    if (isApprove && staff) {
      staff.leaveUntil = Date.now() + (leave.durationDays * 24 * 60 * 60 * 1000);
      staff.leaveReason = leave.reason;
      staff.warned10d = false;
      staff.warned13d = false;
      staff.historyLogs = staff.historyLogs || [];
      staff.historyLogs.unshift({ date: Date.now(), text: `İzin talebi onaylandı (${leave.durationDays} gün): ${leave.reason}` });
    }

    saveStaffData(data);

    try {
      const u = await interaction.client.users.fetch(leave.userId).catch(() => null);
      if (u) {
        if (isApprove) {
          await u.send(`🏖️ **İzin talebiniz onaylandı!** ${leave.durationDays} gün boyunca (${new Date(Date.now() + leave.durationDays * 86400000).toLocaleDateString('tr-TR')}'e kadar) aktivite bildirimleri durduruldu.`);
        } else {
          await u.send(`❌ İzin talebiniz yönetim tarafından uygun görülmeyerek reddedildi.`);
        }
      }
    } catch (_) {}

    await interaction.reply({
      content: isApprove ? `✅ <@${leave.userId}> için izin onaylandı.` : `❌ <@${leave.userId}> izin talebi reddedildi.`,
      ephemeral: true
    });
    return true;
  }

  // 4. Yetkili Listesi & Profil Seçim Ekranı
  if (customId === 'robloxland_staffmgmt_list') {
    const staffList = Object.values(data.staffMembers || {});
    if (staffList.length === 0) {
      return await interaction.reply({ content: 'ℹ️ Kayıtlı yetkili bulunamadı. "➕ Yetkili Ekle" butonu ile yetkili ekleyebilirsiniz.', ephemeral: true });
    }

    const selectOptions = staffList.slice(0, 25).map(s => ({
      label: `${s.username || s.userId} (${s.roleName || 'Yetkili'})`,
      value: s.userId,
      description: calculateStaffHealth(s).shortBadge
    }));

    const lines = staffList.map(s => {
      const health = calculateStaffHealth(s);
      const promo = evaluatePromotionEligibility(s);
      const bar = renderProgressBar(s.performanceScore || 80);
      return `### 👤 <@${s.userId}> — \`${s.roleName || 'Yetkili'}\`\n` +
             `• **Durum:** ${health.badge} | **Performans:** \`${s.performanceScore || 80}/100\` [${bar}]\n` +
             `• **Son Çalışma:** ${health.desc} | **30 Gün Paylaşım:** \`${s.workCount30d || 0}\` | **Seri:** \`${s.streakDays || 1} gün\`\n` +
             `• **Terfi Gelişimi:** \`%${promo.progressPercent}\` ${promo.isReady ? '⭐ (TERFİYE HAZIR!)' : ''}`;
    });

    const payload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 👥 ROBLOXLND YETKİLİ KADROSU & PROFİLLER\n\n` +
        lines.join('\n\n')
      ),
      ComponentsV2Factory.separator(true),
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: "robloxland_staffmgmt_select_profile",
            placeholder: "🔍 Detaylı profilini açmak istediğiniz yetkiliyi seçin...",
            options: selectOptions
          }
        ]
      },
      ComponentsV2Factory.actionRow([
        {
          style: ButtonStyle.Secondary,
          label: "🔙 Ana Kontrol Merkezi",
          custom_id: "robloxland_staffmgmt_back_hub",
          emoji: { name: "🔙" }
        }
      ])
    ]);

    return await interaction.reply({ ...payload, ephemeral: true });
  }

  // Profil Seçimi Yapıldığında
  if (customId === 'robloxland_staffmgmt_select_profile') {
    const selectedUserId = interaction.values?.[0];
    const staff = data.staffMembers[selectedUserId];
    if (!staff) {
      return await interaction.reply({ content: '❌ Seçilen yetkili kaydı bulunamadı.', ephemeral: true });
    }

    const profilePayload = buildStaffProfilePayload(staff);
    return await interaction.reply({ ...profilePayload, ephemeral: true });
  }

  // 3. Terfi Et Butonuna Basıldığında
  if (customId.startsWith('robloxland_staffmgmt_act_promote_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_act_promote_', '');
    const staff = data.staffMembers[targetUserId];
    if (!staff) return await interaction.reply({ content: '❌ Yetkili bulunamadı.', ephemeral: true });

    // Mevcut rütbeden bir üst rütbeyi bul
    const currentRoleName = staff.roleName || "Yetkili Ofisi Staj";
    const currentRankIdx = STAFF_RANKS.findIndex(r => r.name.toLowerCase() === currentRoleName.toLowerCase());
    const targetRank = currentRankIdx > 0 ? STAFF_RANKS[currentRankIdx - 1] : STAFF_RANKS[0];

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_do_promote_${targetUserId}`)
      .setTitle("⬆️ Yetkili Terfi Onayı");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("promote_new_role")
          .setLabel("Yeni Rütbe / Unvan")
          .setValue(targetRank.name)
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("promote_reason")
          .setLabel("Terfi Gerekçesi")
          .setValue("Tüm terfi kriterlerini başarıyla tamamlaması ve yüksek performansı.")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(250)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Terfi Modal Submit
  if (customId.startsWith('robloxland_staffmgmt_modal_do_promote_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_modal_do_promote_', '');
    const newRole = interaction.fields.getTextInputValue("promote_new_role")?.trim();
    const reason = interaction.fields.getTextInputValue("promote_reason")?.trim();
    const staff = data.staffMembers[targetUserId];

    if (staff) {
      const oldRole = staff.roleName || "Moderatör";
      staff.roleName = newRole;
      staff.lastPromotionAt = Date.now();
      staff.qualityWorksCount = 0; // Bir sonraki terfi için sıfırla
      staff.historyLogs = staff.historyLogs || [];
      staff.historyLogs.unshift({
        date: Date.now(),
        text: `TERFİ ALDI: ${oldRole} ➔ ${newRole} (Gerekçe: ${reason}) — Onaylayan: ${user.tag}`
      });

      // Discord rol güncellemesi
      try {
        const memberObj = guild.members.cache.get(targetUserId) || await guild.members.fetch(targetUserId).catch(() => null);
        const targetRankObj = STAFF_RANKS.find(r => r.name.toLowerCase() === newRole.toLowerCase());
        if (memberObj && targetRankObj) {
          await memberObj.roles.add(targetRankObj.id, `Terfi: ${reason}`).catch(() => {});
        }
      } catch (_) {}

      saveStaffData(data);

      // Yetkiliye Tebrik DM
      try {
        const u = await interaction.client.users.fetch(targetUserId).catch(() => null);
        if (u) {
          await u.send(`🎉 **TEBRİKLER! TERFİ ALDINIZ!**\n\n• **Yeni Rütbeniz:** \`${newRole}\`\n• **Gerekçe:** ${reason}\n\nBaşarılı çalışmalarınızın devamını dileriz!`);
        }
      } catch (_) {}

      await interaction.reply({
        content: `🎉 <@${targetUserId}> adlı yetkili başarıyla **${newRole}** rütbesine terfi ettirildi ve loglandı!`,
        ephemeral: true
      });
    }
    return true;
  }

  // 4. RD (Rütbe Düşürme) Butonuna Basıldığında
  if (customId.startsWith('robloxland_staffmgmt_act_demote_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_act_demote_', '');
    const staff = data.staffMembers[targetUserId];
    if (!staff) return await interaction.reply({ content: '❌ Yetkili bulunamadı.', ephemeral: true });

    const currentRoleName = staff.roleName || "Yetkili Ofisi Kıdemli Staj";
    const currentRankIdx = STAFF_RANKS.findIndex(r => r.name.toLowerCase() === currentRoleName.toLowerCase());
    const lowerRank = (currentRankIdx >= 0 && currentRankIdx < STAFF_RANKS.length - 1)
      ? STAFF_RANKS[currentRankIdx + 1]
      : STAFF_RANKS[STAFF_RANKS.length - 1];

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_do_demote_${targetUserId}`)
      .setTitle("⬇️ Rütbe Düşürme (RD) Değerlendirmesi");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("demote_new_role")
          .setLabel("Yeni (Alt) Rütbe")
          .setValue(lowerRank.name)
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("demote_reason")
          .setLabel("Rütbe Düşürme Gerekçesi (Yetkiliye İletilir)")
          .setPlaceholder("Örn: Uzun süredir çalışma yapılmaması ve aktivite uyarısına yanıt verilmemesi")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(250)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // RD Modal Submit
  if (customId.startsWith('robloxland_staffmgmt_modal_do_demote_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_modal_do_demote_', '');
    const newRole = interaction.fields.getTextInputValue("demote_new_role")?.trim();
    const reason = interaction.fields.getTextInputValue("demote_reason")?.trim();
    const staff = data.staffMembers[targetUserId];

    if (staff) {
      const oldRole = staff.roleName || "Yetkili";
      staff.roleName = newRole;
      staff.historyLogs = staff.historyLogs || [];
      staff.historyLogs.unshift({
        date: Date.now(),
        text: `RÜTBE DÜŞÜRÜLDÜ: ${oldRole} ➔ ${newRole} (Gerekçe: ${reason}) — İşlemi Yapan: ${user.tag}`
      });

      saveStaffData(data);

      try {
        const u = await interaction.client.users.fetch(targetUserId).catch(() => null);
        if (u) {
          await u.send(`ℹ️ **Yetkili Rütbe Güncellemesi Bildirimi**\n\n• **Yeni Rütbeniz:** \`${newRole}\`\n• **Gerekçe:** ${reason}\n\nGörevlerinize düzenli devam ederek tekrar terfi hakkı kazanabilirsiniz.`);
        }
      } catch (_) {}

      await interaction.reply({
        content: `⬇️ <@${targetUserId}> rütbesi **${newRole}** olarak güncellendi ve işlem sicile işlendi.`,
        ephemeral: true
      });
    }
    return true;
  }

  // 8. Uyarı Verme Butonuna Basıldığında
  if (customId.startsWith('robloxland_staffmgmt_act_warn_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_act_warn_', '');
    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_do_warn_${targetUserId}`)
      .setTitle("⚠️ Yetkiliye Resmi Uyarı Ver");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("warn_level")
          .setLabel("Uyarı Şiddeti (1: Hafif, 2: Resmi, 3: Son Uyarı)")
          .setPlaceholder("1, 2 veya 3 yazınız")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(1)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("warn_reason")
          .setLabel("Uyarı Gerekçesi")
          .setPlaceholder("Örn: Görevlerin yerine getirilmemesi / Toplantıya mazeretsiz katılmama")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(250)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Uyarı Modal Submit
  if (customId.startsWith('robloxland_staffmgmt_modal_do_warn_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_modal_do_warn_', '');
    const levelRaw = interaction.fields.getTextInputValue("warn_level")?.trim();
    const reason = interaction.fields.getTextInputValue("warn_reason")?.trim();
    const staff = data.staffMembers[targetUserId];

    const levelText = levelRaw === '3' ? '🔴 Son Uyarı' : (levelRaw === '2' ? '🟠 Resmi Uyarı' : '🟡 Hafif Uyarı');
    const warningId = `warn-${Date.now().toString().slice(-5)}`;

    if (staff) {
      staff.warningsCount = (staff.warningsCount || 0) + 1;
      staff.performanceScore = Math.max(0, (staff.performanceScore || 70) - 15);
      staff.historyLogs = staff.historyLogs || [];
      staff.historyLogs.unshift({
        date: Date.now(),
        text: `UYARI ALDI (${levelText}): ${reason} (-15 Puan) — Veren: ${user.tag}`
      });
      saveStaffData(data);

      try {
        const u = await interaction.client.users.fetch(targetUserId).catch(() => null);
        if (u) {
          await u.send({
            ...ComponentsV2Factory.buildPayload([
              ComponentsV2Factory.text(
                `# ⚠️ RESMİ YETKİLİ UYARISI ALDINIZ\n\n` +
                `• **Uyarı Derecesi:** \`${levelText}\`\n` +
                `• **Gerekçe:** ${reason}\n` +
                `• **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                `*Bu uyarının haksız olduğunu düşünüyorsanız aşağıdaki butondan itiraz edebilirsiniz:*`
              ),
              ComponentsV2Factory.separator(true),
              ComponentsV2Factory.actionRow([
                {
                  style: ButtonStyle.Secondary,
                  label: "⚖️ Uyarıya İtiraz Et",
                  custom_id: `robloxland_staff_appeal_warn_${warningId}_${targetUserId}`,
                  emoji: { name: "⚖️" }
                }
              ])
            ])
          });
        }
      } catch (_) {}

      await interaction.reply({
        content: `⚠️ <@${targetUserId}> adlı yetkiliye **${levelText}** verildi ve DM ile tebliğ edildi.`,
        ephemeral: true
      });
    }
    return true;
  }

  // 8. Uyarıya İtiraz Etme (Yetkili DM'sinden)
  if (customId.startsWith('robloxland_staff_appeal_warn_')) {
    const parts = customId.split('_');
    const warningId = parts[4];
    const staffId = parts[5];

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_do_appeal_${warningId}_${staffId}`)
      .setTitle("⚖️ Uyarı İtiraz Formu");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("appeal_reason")
          .setLabel("İtiraz Gerekçeniz ve Açıklamanız")
          .setPlaceholder("Uyarının neden haksız olduğunu veya mazeretinizi yazınız...")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // İtiraz Modal Submit
  if (customId.startsWith('robloxland_staffmgmt_modal_do_appeal_')) {
    const parts = customId.split('_');
    const warningId = parts[5];
    const staffId = parts[6];
    const reason = interaction.fields.getTextInputValue("appeal_reason")?.trim();

    const appealId = `appeal-${Date.now().toString().slice(-5)}`;
    data.pendingAppeals[appealId] = {
      id: appealId,
      warningId,
      userId: staffId,
      reason,
      submittedAt: Date.now(),
      status: 'pending'
    };
    saveStaffData(data);

    try {
      const mgmtChan = interaction.client.channels.cache.get(PANEL_CHANNEL_ID) ||
                       interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID);
      if (mgmtChan && mgmtChan.isTextBased()) {
        await mgmtChan.send({
          ...ComponentsV2Factory.buildPayload([
            ComponentsV2Factory.text(
              `# ⚖️ YENİ UYARI İTİRAZI GELDİ (#${appealId})\n\n` +
              `👤 **İtiraz Eden:** <@${staffId}>\n` +
              `📝 **İtiraz Gerekçesi:**\n> ${reason}\n\n` +
              `*İtiraz kabul edilirse yetkilinin uyarısı silinir ve puanı iade edilir:*`
            ),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.actionRow([
              {
                style: ButtonStyle.Success,
                label: "✅ İtirazı Kabul Et",
                custom_id: `robloxland_staffmgmt_accept_appeal_${appealId}_${staffId}`,
                emoji: { name: "✅" }
              },
              {
                style: ButtonStyle.Danger,
                label: "❌ Reddet",
                custom_id: `robloxland_staffmgmt_reject_appeal_${appealId}_${staffId}`,
                emoji: { name: "🚫" }
              }
            ])
          ])
        });
      }
    } catch (_) {}

    await interaction.reply({
      content: '⚖️ İtirazınız yönetim kuruluna iletildi. İncelendiğinde tarafınıza bildirilecektir.',
      ephemeral: true
    });
    return true;
  }

  // İtiraz Kabul / Ret
  if (customId.startsWith('robloxland_staffmgmt_accept_appeal_') || customId.startsWith('robloxland_staffmgmt_reject_appeal_')) {
    const isAccept = customId.startsWith('robloxland_staffmgmt_accept_appeal_');
    const parts = customId.split('_');
    const appealId = parts[4];
    const staffId = parts[5];

    const appeal = data.pendingAppeals[appealId];
    if (appeal) appeal.status = isAccept ? 'accepted' : 'rejected';

    const staff = data.staffMembers[staffId];
    if (isAccept && staff) {
      staff.warningsCount = Math.max(0, (staff.warningsCount || 1) - 1);
      staff.performanceScore = Math.min(100, (staff.performanceScore || 70) + 15);
      staff.historyLogs = staff.historyLogs || [];
      staff.historyLogs.unshift({ date: Date.now(), text: `İtiraz kabul edildi: Uyarı kaldırıldı (+15 Puan iade edildi)` });
    }

    saveStaffData(data);

    try {
      const u = await interaction.client.users.fetch(staffId).catch(() => null);
      if (u) {
        if (isAccept) {
          await u.send(`✅ **Uyarı itirazınız kabul edildi!** Uyarınız sicilinizden silindi ve performans puanınız iade edildi.`);
        } else {
          await u.send(`❌ Uyarı itirazınız yönetim tarafından incelenmiş ve **reddedilmiştir**.`);
        }
      }
    } catch (_) {}

    await interaction.reply({
      content: isAccept ? `✅ <@${staffId}> itirazı kabul edildi ve uyarı silindi.` : `❌ <@${staffId}> itirazı reddedildi.`,
      ephemeral: true
    });
    return true;
  }

  // 10. Terfi Adayları Görünümü
  if (customId === 'robloxland_staffmgmt_view_promos') {
    const staffList = Object.values(data.staffMembers || {});
    const promoCandidates = staffList.filter(s => evaluatePromotionEligibility(s).isReady);

    if (promoCandidates.length === 0) {
      return await interaction.reply({
        content: 'ℹ️ Şu anda tüm terfi kriterlerini (14 gün görev, 80+ puan, 10 çalışma, 3 kaliteli çalışma) tamamlamış aday bulunmuyor.',
        ephemeral: true
      });
    }

    const textList = promoCandidates.map(s => {
      return `### 🟢 <@${s.userId}> — \`${s.roleName || 'Yetkili'}\`\n` +
             `• **Performans:** \`${s.performanceScore}/100\` | **30 Gün Paylaşım:** \`${s.workCount30d}\` | **Kalite:** \`${s.qualityWorksCount} yıldızlı iş\`\n` +
             `• 💡 **Öneri:** *Terfi değerlendirmesi öneriliyor.*`;
    }).join('\n\n');

    const selectOptions = promoCandidates.map(s => ({
      label: `${s.username || s.userId} (${s.roleName || 'Yetkili'})`,
      value: s.userId,
      description: `Performans: ${s.performanceScore}/100 (Hazır)`
    }));

    const payload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# ⬆️ TERFİYE HAZIR ADAYLAR LİSTESİ\n\n` +
        textList
      ),
      ComponentsV2Factory.separator(true),
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: "robloxland_staffmgmt_select_profile",
            placeholder: "⬆️ Terfi ettirmek için yetkili profilini açın...",
            options: selectOptions
          }
        ]
      }
    ]);

    return await interaction.reply({ ...payload, ephemeral: true });
  }

  // 10. RD Adayları Görünümü
  if (customId === 'robloxland_staffmgmt_view_demos') {
    const staffList = Object.values(data.staffMembers || {});
    const demoCandidates = staffList.filter(s => evaluateDemotionRisk(s).isRisk);

    if (demoCandidates.length === 0) {
      return await interaction.reply({
        content: '🟢 Tebrikler! Şu anda inceleme gerektiren veya RD adayı olan yetkili bulunmuyor.',
        ephemeral: true
      });
    }

    const textList = demoCandidates.map(s => {
      const demo = evaluateDemotionRisk(s);
      return `### 🔴 <@${s.userId}> — \`${s.roleName || 'Yetkili'}\`\n` +
             `• **Risk Nedenleri:** ${demo.reasons.join(', ')}\n` +
             `• 💡 **Öneri:** *Yetkiliyle görüşme başlatılması veya RD değerlendirmesi öneriliyor.*`;
    }).join('\n\n');

    const selectOptions = demoCandidates.map(s => ({
      label: `${s.username || s.userId} (${s.roleName || 'Yetkili'})`,
      value: s.userId,
      description: `Riskli durum incelenmeli`
    }));

    const payload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# ⚠️ DİKKAT & İNCELEME GEREKTİREN YETKİLİLER (RD ADAYLARI)\n\n` +
        textList
      ),
      ComponentsV2Factory.separator(true),
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: "robloxland_staffmgmt_select_profile",
            placeholder: "🔍 İşlem yapmak için yetkili profilini açın...",
            options: selectOptions
          }
        ]
      }
    ]);

    return await interaction.reply({ ...payload, ephemeral: true });
  }

  // 10. Paneli Yenile
  if (customId === 'robloxland_staffmgmt_refresh') {
    const payload = buildStaffManagementPayload(data);
    try {
      if (interaction.message && typeof interaction.message.edit === 'function') {
        await interaction.message.edit(payload);
      }
    } catch (_) {}
    return await interaction.reply({ content: '🔄 Yetkili Yönetim Merkezi güncellendi!', ephemeral: true });
  }

  // 10. Geri Dön
  if (customId === 'robloxland_staffmgmt_back_hub') {
    const payload = buildStaffManagementPayload(data);
    return await interaction.reply({ ...payload, ephemeral: true });
  }

  // 5. Görev Hub Görünümü
  if (customId === 'robloxland_staffmgmt_task_hub') {
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_create_task')
      .setTitle("📋 Yeni Görev Oluştur");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("task_target_user")
          .setLabel("Görev Verilecek Yetkili ID / @Etiket")
          .setPlaceholder("Örn: 123456789012345678")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("task_desc")
          .setLabel("Görev Açıklaması")
          .setPlaceholder("Örn: Modern bir araç sistemi bul ve paylaş")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(250)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("task_reward")
          .setLabel("Ödül Performans Puanı (Örn: 8)")
          .setValue("8")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Görev Oluştur Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_create_task') {
    const rawTarget = interaction.fields.getTextInputValue("task_target_user")?.trim();
    const cleanId = rawTarget?.replace(/[^0-9]/g, '');
    const taskDesc = interaction.fields.getTextInputValue("task_desc")?.trim();
    const reward = parseInt(interaction.fields.getTextInputValue("task_reward"), 10) || 8;

    if (!cleanId || !data.staffMembers[cleanId]) {
      return await interaction.reply({ content: '❌ Belirtilen yetkili bulunamadı.', ephemeral: true });
    }

    const taskId = `task-${Date.now().toString().slice(-5)}`;
    data.activeTasks[taskId] = {
      id: taskId,
      assignedTo: cleanId,
      desc: taskDesc,
      difficulty: 'Orta',
      rewardScore: reward,
      status: 'assigned',
      assignedBy: user.tag,
      assignedAt: Date.now()
    };

    data.staffMembers[cleanId].historyLogs = data.staffMembers[cleanId].historyLogs || [];
    data.staffMembers[cleanId].historyLogs.unshift({ date: Date.now(), text: `Yeni görev atandı: ${taskDesc}` });
    saveStaffData(data);

    try {
      const u = await interaction.client.users.fetch(cleanId).catch(() => null);
      if (u) {
        await u.send({
          ...ComponentsV2Factory.buildPayload([
            ComponentsV2Factory.text(
              `# 📋 YENİ GÖREV ALDINIZ!\n\n` +
              `> **Görev:** ${taskDesc}\n` +
              `• **Ödül:** \`+${reward} Performans Puanı\`\n` +
              `• **Veren:** ${user.tag}\n\n` +
              `*Görevi tamamlayıp sistemi paylaştığınızda puanınız otomatik eklenecektir.*`
            )
          ])
        });
      }
    } catch (_) {}

    await interaction.reply({ content: `✅ <@${cleanId}> adlı yetkiliye görev başarıyla atandı (#${taskId}).`, ephemeral: true });
    return true;
  }

  // 7. Anonim Mesaj Gönder Butonu
  if (customId.startsWith('robloxland_staffmgmt_act_anonmsg_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_act_anonmsg_', '');
    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_anon_send_${targetUserId}`)
      .setTitle("🕵️ Anonim Yönetim Mesajı Gönder");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("anon_template")
          .setLabel("Şablon Seç (1:Çalışma Vakti, 2:Toplantı, 3:Aktivite, 4:Özel)")
          .setPlaceholder("1, 2, 3 veya 4")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(1)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("anon_text")
          .setLabel("Mesaj Metni / Detay")
          .setPlaceholder("Yetkiliye iletmek istediğiniz mesaj...")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(350)
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Anonim Mesaj Modal Submit
  if (customId.startsWith('robloxland_staffmgmt_modal_anon_send_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_modal_anon_send_', '');
    const template = interaction.fields.getTextInputValue("anon_template")?.trim();
    const customText = interaction.fields.getTextInputValue("anon_text")?.trim() || "";

    let body = "Selam! Çalışma vakti. Bugün müsaitsen yeni bir sistem veya map paylaşmanı bekliyoruz.";
    if (template === '2') body = "📅 Yetkili toplantısı vardır. Lütfen en kısa sürede yetkili kanalını kontrol ediniz.";
    else if (template === '3') body = "⚠️ Son zamanlardaki aktivite durumunuz düşüktür. Lütfen durumunuzu kontrol ediniz.";
    else if (template === '4' && customText) body = customText;

    if (template !== '4' && customText) {
      body += `\n\n**Ek Not:** ${customText}`;
    }

    const sessionId = `anon-${Date.now().toString().slice(-5)}`;
    activeAnonSessions.set(sessionId, {
      sessionId,
      staffUserId: targetUserId,
      managerUserId: user.id,
      createdAt: Date.now(),
      active: true
    });

    try {
      const u = await interaction.client.users.fetch(targetUserId).catch(() => null);
      if (u) {
        await u.send({
          ...ComponentsV2Factory.buildPayload([
            ComponentsV2Factory.text(
              `# 🛡️ YÖNETİMDEN YENİ BİR MESAJINIZ VAR\n\n` +
              `> "${body}"\n\n` +
              `-# Bu mesaj RobloxLand Yönetimi tarafından anonim olarak iletilmiştir.\n` +
              `-# Yanıt vermek için aşağıdaki "💬 Yanıtla" butonunu kullanabilirsiniz.`
            ),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.actionRow([
              {
                style: ButtonStyle.Primary,
                label: "💬 Yanıtla",
                custom_id: `robloxland_staffmgmt_anon_reply_${sessionId}`,
                emoji: { name: "💬" }
              }
            ])
          ])
        });
      }
    } catch (err) {
      return await interaction.reply({ content: `❌ DM iletilemedi: ${err.message}`, ephemeral: true });
    }

    // Üst Yönetim Loguna Kaydet
    try {
      const logChan = interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID) ||
                      interaction.client.channels.cache.get(PANEL_CHANNEL_ID);
      if (logChan && logChan.isTextBased()) {
        await logChan.send({
          content: `🕵️ **Anonim Mesaj Gönderildi (#${sessionId})**\n` +
                   `• **Başlatan Yönetici:** <@${user.id}> (\`${user.tag}\`)\n` +
                   `• **Hedef Yetkili:** <@${targetUserId}>\n` +
                   `• **Mesaj:** "${body}"`
        });
      }
    } catch (_) {}

    await interaction.reply({ content: `✅ <@${targetUserId}> adlı yetkiliye anonim mesajınız iletildi (#${sessionId})!`, ephemeral: true });
    return true;
  }

  // 10. Yetkili Ekle Butonu
  if (customId === 'robloxland_staffmgmt_add') {
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_add')
      .setTitle("➕ Yeni Yetkili Ekle");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("staff_user_id")
          .setLabel("Yetkili Discord ID veya @Kullanıcı")
          .setPlaceholder("Örn: 123456789012345678 veya @kullanici")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("staff_initial_role")
          .setLabel("Başlangıç Rolü (Örn: Yetkili Ofisi Staj)")
          .setValue("Yetkili Ofisi Staj")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Yetkili Ekle Submit
  if (customId === 'robloxland_staffmgmt_modal_add') {
    const rawUser = interaction.fields.getTextInputValue("staff_user_id")?.trim();
    const roleName = interaction.fields.getTextInputValue("staff_initial_role")?.trim() || "Yetkili Ofisi Staj";
    const cleanId = rawUser?.replace(/[^0-9]/g, '');

    if (!cleanId || cleanId.length < 16) {
      return await interaction.reply({ content: '❌ Geçersiz kullanıcı ID/etiket belirttiniz.', ephemeral: true });
    }

    let targetUsername = cleanId;
    try {
      const fetchedUser = await interaction.client.users.fetch(cleanId).catch(() => null);
      if (fetchedUser) targetUsername = fetchedUser.username;
    } catch (_) {}

    data.staffMembers[cleanId] = {
      userId: cleanId,
      username: targetUsername,
      roleName: roleName,
      joinedStaffAt: Date.now(),
      lastWorkAt: Date.now(),
      workCountTotal: 0,
      workCount30d: 0,
      qualityWorksCount: 0,
      streakDays: 1,
      status: 'active',
      leaveUntil: null,
      leaveReason: null,
      performanceScore: 85,
      warningsCount: 0,
      historyLogs: [
        { date: Date.now(), text: `Kadroya eklendi (${roleName}) — Ekleyen: ${user.tag}` }
      ],
      assignedTasks: []
    };

    saveStaffData(data);

    await interaction.reply({
      content: `✅ <@${cleanId}> başarıyla **${roleName}** olarak kadroya eklendi!`,
      ephemeral: true
    });
    return true;
  }

  // ── 11. SİSTEM & ROL AYARLARI ETKİLEŞİMLERİ ──
  if (customId === 'robloxland_staffmgmt_settings_hub') {
    const payload = buildStaffSettingsPayload(data);
    return await interaction.reply({ ...payload, ephemeral: true });
  }

  // Başkan & Yardımcı Rolü Ayarla Butonu
  if (customId === 'robloxland_staffmgmt_btn_set_chief_roles') {
    const settings = data.settings || {};
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_set_chief_roles')
      .setTitle("👑 Başkan & Yardımcı Rolü Ayarla");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("baskan_role_id")
          .setLabel("Yetkili Ofisi Başkanı Rol ID / Etiket")
          .setValue(settings.baskanRoleId || "1544392306101067878")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("baskan_yardimcisi_role_id")
          .setLabel("Yetkili Ofisi Müdür Yardımcısı Rol ID")
          .setValue(settings.baskanYardimcisiRoleId || "1544393522784903278")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Başkan & Yardımcı Rol Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_set_chief_roles') {
    const rawBaskan = interaction.fields.getTextInputValue("baskan_role_id")?.trim();
    const rawBaskanYrd = interaction.fields.getTextInputValue("baskan_yardimcisi_role_id")?.trim();

    const cleanBaskan = rawBaskan?.replace(/[^0-9]/g, '');
    const cleanBaskanYrd = rawBaskanYrd?.replace(/[^0-9]/g, '');

    data.settings = data.settings || {};
    if (cleanBaskan && cleanBaskan.length >= 16) data.settings.baskanRoleId = cleanBaskan;
    if (cleanBaskanYrd && cleanBaskanYrd.length >= 16) data.settings.baskanYardimcisiRoleId = cleanBaskanYrd;

    saveStaffData(data);

    await interaction.reply({
      content: `✅ **Üst Yönetim Rolleri Güncellendi!**\n• 👑 **Başkan Rolü:** <@&${data.settings.baskanRoleId}>\n• 💼 **Başkan Yardımcısı:** <@&${data.settings.baskanYardimcisiRoleId}>`,
      ephemeral: true
    });
    return true;
  }

  // Yetkili Rolü Ekle / Güncelle Butonu
  if (customId === 'robloxland_staffmgmt_btn_add_role') {
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_add_role')
      .setTitle("➕ Yetkili Rolü Ekle / Güncelle");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("role_name")
          .setLabel("Rol İsmi")
          .setPlaceholder("Örn: Moderatör, Kıdemli Staj, Müdür...")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("role_id")
          .setLabel("Discord Rol ID")
          .setPlaceholder("Örn: 1544394096918003712")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("role_rank")
          .setLabel("Hiyerarşi Sırası (1: En Üst - 10: Staj)")
          .setValue("6")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(2)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Yetkili Rol Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_add_role') {
    const roleName = interaction.fields.getTextInputValue("role_name")?.trim();
    const rawRoleId = interaction.fields.getTextInputValue("role_id")?.trim();
    const rankNum = parseInt(interaction.fields.getTextInputValue("role_rank"), 10) || 6;
    const cleanRoleId = rawRoleId?.replace(/[^0-9]/g, '');

    if (!cleanRoleId || cleanRoleId.length < 16) {
      return await interaction.reply({ content: '❌ Geçersiz Discord Rol ID belirttiniz.', ephemeral: true });
    }

    data.settings = data.settings || {};
    data.settings.roles = data.settings.roles || [...DEFAULT_STAFF_RANKS];

    const existingIdx = data.settings.roles.findIndex(r => r.id === cleanRoleId || r.name.toLowerCase() === roleName.toLowerCase());
    if (existingIdx >= 0) {
      data.settings.roles[existingIdx] = { rank: rankNum, name: roleName, id: cleanRoleId };
    } else {
      data.settings.roles.push({ rank: rankNum, name: roleName, id: cleanRoleId });
    }

    data.settings.roles.sort((a, b) => a.rank - b.rank);
    saveStaffData(data);

    await interaction.reply({
      content: `✅ **${roleName}** rolü (Sıra: ${rankNum}, ID: \`${cleanRoleId}\`) başarıyla rol hiyerarşisine eklendi/güncellendi!`,
      ephemeral: true
    });
    return true;
  }

  // Rol Sil Butonu
  if (customId === 'robloxland_staffmgmt_btn_delete_role') {
    const roles = data.settings?.roles || DEFAULT_STAFF_RANKS;
    if (roles.length <= 1) {
      return await interaction.reply({ content: '❌ Sistemde en az bir rol bulunmalıdır. Son rolü silemezsiniz.', ephemeral: true });
    }

    const selectOptions = roles.map(r => ({
      label: `${r.name} (Sıra ${r.rank})`,
      value: r.id,
      description: `Rol ID: ${r.id}`
    }));

    const payload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 🗑️ SİLMEK İSTEDİĞİNİZ YETKİLİ ROLÜNÜ SEÇİN\n` +
        `*Seçtiğiniz rol yönetim hiyerarşisinden kaldırılacaktır:*`
      ),
      ComponentsV2Factory.separator(true),
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: "robloxland_staffmgmt_select_delete_role",
            placeholder: "🗑️ Silinecek rolü seçiniz...",
            options: selectOptions
          }
        ]
      },
      ComponentsV2Factory.actionRow([
        {
          style: ButtonStyle.Secondary,
          label: "🔙 Ayarlara Dön",
          custom_id: "robloxland_staffmgmt_settings_hub",
          emoji: { name: "🔙" }
        }
      ])
    ]);

    return await interaction.reply({ ...payload, ephemeral: true });
  }

  // Rol Sil Select Submit
  if (customId === 'robloxland_staffmgmt_select_delete_role') {
    const selectedRoleId = interaction.values?.[0];
    data.settings = data.settings || {};
    data.settings.roles = (data.settings.roles || DEFAULT_STAFF_RANKS).filter(r => r.id !== selectedRoleId);
    saveStaffData(data);

    await interaction.reply({
      content: `🗑️ <@&${selectedRoleId}> rolü başarıyla yetkili hiyerarşisinden silindi.`,
      ephemeral: true
    });
    return true;
  }

  // Hazır Mesaj Şablonlarını Düzenle Butonu
  if (customId === 'robloxland_staffmgmt_btn_edit_templates') {
    const tpl = data.settings?.templates || DEFAULT_TEMPLATES;
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_edit_templates')
      .setTitle("📝 Hazır Mesaj Şablonları");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("tpl_10d")
          .setLabel("10. Gün DM Hatırlatma Mesajı")
          .setValue(tpl.dm10d?.slice(0, 300) || "")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(350)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("tpl_13d")
          .setLabel("13. Gün DM Ciddi Uyarı Mesajı")
          .setValue(tpl.dm13d?.slice(0, 300) || "")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(350)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("tpl_work")
          .setLabel("Çalışma Vakti Mesajı")
          .setValue(tpl.workTime?.slice(0, 200) || "")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(250)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("tpl_meeting")
          .setLabel("Toplantı Mesajı")
          .setValue(tpl.meeting?.slice(0, 200) || "")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(250)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("tpl_low_activity")
          .setLabel("Düşük Aktivite Mesajı")
          .setValue(tpl.lowActivity?.slice(0, 200) || "")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(250)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Mesaj Şablonları Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_edit_templates') {
    const tpl10d = interaction.fields.getTextInputValue("tpl_10d")?.trim();
    const tpl13d = interaction.fields.getTextInputValue("tpl_13d")?.trim();
    const tplWork = interaction.fields.getTextInputValue("tpl_work")?.trim();
    const tplMeeting = interaction.fields.getTextInputValue("tpl_meeting")?.trim();
    const tplLowActivity = interaction.fields.getTextInputValue("tpl_low_activity")?.trim();

    data.settings = data.settings || {};
    data.settings.templates = {
      dm10d: tpl10d || DEFAULT_TEMPLATES.dm10d,
      dm13d: tpl13d || DEFAULT_TEMPLATES.dm13d,
      workTime: tplWork || DEFAULT_TEMPLATES.workTime,
      meeting: tplMeeting || DEFAULT_TEMPLATES.meeting,
      lowActivity: tplLowActivity || DEFAULT_TEMPLATES.lowActivity
    };

    await interaction.reply({
      content: `✅ **Hazır Mesaj & DM Şablonları Başarıyla Güncellendi!**\nBotun gönderdiği otomatik hatırlatmalar ve anonim mesajlar yeni şablonları kullanacaktır.`,
      ephemeral: true
    });
    return true;
  }

  // ── 12. GÖREV YEMİNİ & DİN SEÇİMİ VE KADRODAN ÇIKARMA (İHRAÇ) ──

  // 1. Yönetici Yetkiliye Yemin Gönderir
  if (customId.startsWith('robloxland_staffmgmt_act_send_oath_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_act_send_oath_', '');
    const staff = data.staffMembers[targetUserId];
    if (!staff) return await interaction.reply({ content: '❌ Yetkili kaydı bulunamadı.', ephemeral: true });

    const selectOptions = Object.values(FAITH_OATHS).map(f => ({
      label: f.name,
      value: f.key,
      description: f.oath.slice(0, 50) + "..."
    }));

    const dmPayload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 📜 ROBLOXLND YETKİLİ GÖREV & SADAKAT YEMİNİ\n\n` +
        `Değerli yetkilimiz <@${targetUserId}>,\n\n` +
        `RobloxLand topluluğunda adaleti, dürüstlüğü, tarafsızlığı ve düzeni sağlamak adına göreve başlamadan önce inancınıza / vicdani tercihinize uygun **Görev Yemini** etmeniz gerekmektedir.\n\n` +
        `Lütfen aşağıdaki menüden inancınızı / tercihinizi seçiniz:`
      ),
      ComponentsV2Factory.separator(true),
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: `robloxland_staff_oath_select_faith_${targetUserId}`,
            placeholder: "📜 İnancınızı / Yemin Türünüzü Seçiniz...",
            options: selectOptions
          }
        ]
      }
    ]);

    try {
      const u = await interaction.client.users.fetch(targetUserId).catch(() => null);
      if (u) {
        await u.send(dmPayload);
      }
    } catch (err) {
      return await interaction.reply({ content: `❌ Yetkilinin DM kutusu kapalı: ${err.message}`, ephemeral: true });
    }

    await interaction.reply({
      content: `📜 <@${targetUserId}> adlı yetkiliye DM üzerinden **Görev & Sadakat Yemini** formu iletildi!`,
      ephemeral: true
    });
    return true;
  }

  // 2. Yetkili DM'den Din/İnanç Seçer
  if (customId.startsWith('robloxland_staff_oath_select_faith_')) {
    const targetUserId = customId.replace('robloxland_staff_oath_select_faith_', '');
    const selectedKey = interaction.values?.[0] || 'secular';
    const faith = FAITH_OATHS[selectedKey] || FAITH_OATHS.secular;

    const oathCardPayload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 📜 GÖREV YEMİNİ METNİNİZ (${faith.name})\n\n` +
        `> "*${faith.oath}*"\n\n` +
        `Yukarıdaki yemin metnini kabul ediyorsanız lütfen aşağıdaki **✍️ Yemin Et** butonuna tıklayınız ve açılan kutucuğa **Yemin Ederim** yazarak onaylayınız.`
      ),
      ComponentsV2Factory.separator(true),
      ComponentsV2Factory.actionRow([
        {
          style: ButtonStyle.Success,
          label: "✍️ Yemin Et ('Yemin Ederim')",
          custom_id: `robloxland_staff_oath_btn_${selectedKey}_${targetUserId}`,
          emoji: { name: "✍️" }
        }
      ])
    ]);

    return await interaction.reply({ ...oathCardPayload, ephemeral: true });
  }

  // 3. Yetkili "Yemin Et" Butonuna Basar (Modal Açılır)
  if (customId.startsWith('robloxland_staff_oath_btn_')) {
    const parts = customId.split('_');
    const faithKey = parts[4];
    const targetUserId = parts[5];
    const faith = FAITH_OATHS[faithKey] || FAITH_OATHS.secular;

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_confirm_oath_${faithKey}_${targetUserId}`)
      .setTitle("📜 Görev Yeminini Onayla");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("oath_confirm_input")
          .setLabel("Onaylamak İçin 'Yemin Ederim' Yazınız:")
          .setPlaceholder("Yemin Ederim")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(30)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 4. Yemin Modal Submit Edilir
  if (customId.startsWith('robloxland_staffmgmt_modal_confirm_oath_')) {
    const parts = customId.split('_');
    const faithKey = parts[5];
    const targetUserId = parts[6];
    const faith = FAITH_OATHS[faithKey] || FAITH_OATHS.secular;
    const confirmInput = interaction.fields.getTextInputValue("oath_confirm_input")?.trim() || "";

    if (!confirmInput.toLowerCase().includes("yemin ederim")) {
      return await interaction.reply({
        content: "❌ **Yemin onaylanamadı!** Lütfen kutucuğa tam olarak `Yemin Ederim` yazınız.",
        ephemeral: true
      });
    }

    const staff = data.staffMembers[targetUserId];
    if (staff) {
      staff.faith = faith.name;
      staff.oathStatus = 'sworn';
      staff.oathDate = Date.now();
      staff.oathText = faith.oath;
      staff.performanceScore = Math.min(100, (staff.performanceScore || 80) + 5); // Yemin bonusu
      staff.historyLogs = staff.historyLogs || [];
      staff.historyLogs.unshift({
        date: Date.now(),
        text: `GÖREV YEMİNİ ETTİ (${faith.name}): "${faith.oath.slice(0, 60)}..." (+5 Bonus Puan)`
      });

      saveStaffData(data);
    }

    // Yönetim Kanalına Log Gönder
    try {
      const mgmtChan = interaction.client.channels.cache.get(PANEL_CHANNEL_ID) ||
                       interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID);
      if (mgmtChan && mgmtChan.isTextBased()) {
        await mgmtChan.send({
          ...ComponentsV2Factory.buildPayload([
            ComponentsV2Factory.text(
              `# 📜 YENİ GÖREV YEMİNİ KAYDEDİLDİ!\n\n` +
              `👤 **Yetkili:** <@${targetUserId}>\n` +
              `🏷️ **İnanç / Tercih:** \`${faith.name}\`\n` +
              `📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
              `> "*${faith.oath}*"\n\n` +
              `✅ Yetkili resmi olarak "Yemin Ederim" beyanını sunmuş ve göreve başlamıştır.`
            )
          ])
        });
      }
    } catch (_) {}

    await interaction.reply({
      content: `🎉 **Tebrikler! Görev yemininiz (${faith.name}) başarıyla kaydedildi.**\nRobloxLand yetkili kadrosuna resmi olarak hoş geldiniz! Görevinizde başarılar ve kolaylıklar dileriz.`,
      ephemeral: true
    });
    return true;
  }

  // 5. Kadrodan Çıkar (İhraç) Butonuna Basıldığında
  if (customId.startsWith('robloxland_staffmgmt_act_kick_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_act_kick_', '');
    const staff = data.staffMembers[targetUserId];
    if (!staff) return await interaction.reply({ content: '❌ Yetkili bulunamadı.', ephemeral: true });

    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_do_kick_${targetUserId}`)
      .setTitle("🚪 Yetkiliyi Kadrodan Çıkar");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("kick_reason")
          .setLabel("Kadrodan Çıkarma / İhraç Gerekçesi")
          .setPlaceholder("Örn: Uzun süreli inaktiflik / Yetki kötüye kullanımı / Kural ihlali")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // Kadrodan Çıkar Modal Submit
  if (customId.startsWith('robloxland_staffmgmt_modal_do_kick_')) {
    const targetUserId = customId.replace('robloxland_staffmgmt_modal_do_kick_', '');
    const reason = interaction.fields.getTextInputValue("kick_reason")?.trim() || "Yönetim kararı";
    const staff = data.staffMembers[targetUserId];

    // 1. Yetkili rollerini sunucudan kaldır
    try {
      const configuredRoles = data.settings?.roles || DEFAULT_STAFF_RANKS;
      const allRoleIds = configuredRoles.map(r => r.id);
      const memberObj = guild?.members?.cache?.get(targetUserId) || await guild?.members?.fetch(targetUserId).catch(() => null);
      if (memberObj) {
        for (const rId of allRoleIds) {
          if (memberObj.roles.cache.has(rId)) {
            await memberObj.roles.remove(rId, `Kadrodan çıkarma: ${reason}`).catch(() => {});
          }
        }
      }
    } catch (_) {}

    // 2. Yetkiliye DM bilgilendirmesi
    try {
      const u = await interaction.client.users.fetch(targetUserId).catch(() => null);
      if (u) {
        await u.send(
          `ℹ️ **RobloxLand Yetkili Kadrosu Bilgilendirmesi**\n\n` +
          `RobloxLand yetkili kadrosundaki göreviniz sonlandırılmıştır.\n` +
          `• **Gerekçe:** ${reason}\n\n` +
          `Şimdiye kadar sunucumuza kattığınız emekler için teşekkür ederiz.`
        );
      }
    } catch (_) {}

    // 3. Kadro kaydını sil
    delete data.staffMembers[targetUserId];
    saveStaffData(data);

    // 4. Yönetim Logu Gönder
    try {
      const logChan = interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID) ||
                      interaction.client.channels.cache.get(PANEL_CHANNEL_ID);
      if (logChan && logChan.isTextBased()) {
        await logChan.send({
          content: `🚪 **Yetkili Kadrodan Çıkarıldı (İhraç)**\n` +
                   `• **Kullanıcı:** <@${targetUserId}> (\`${targetUserId}\`)\n` +
                   `• **İşlemi Yapan Yönetici:** <@${user.id}> (\`${user.tag}\`)\n` +
                   `• **Gerekçe:** "${reason}"`
        });
      }
    } catch (_) {}

    await interaction.reply({
      content: `🚪 <@${targetUserId}> adlı yetkili başarıyla kadrodan çıkarıldı, rolleri alındı ve DM ile bilgilendirildi.`,
      ephemeral: true
    });
    return true;
  }

  return false;
}

/**
 * Panel Mesajının Kanalda Hazır Olmasını Sağlar
 */
async function ensureStaffManagementPanel(client) {
  try {
    const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
    if (!guild) return null;

    const channel = guild.channels.cache.get(PANEL_CHANNEL_ID) || await guild.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return null;

    const data = loadStaffData();
    const payload = buildStaffManagementPayload(data);

    let panelMsg = null;
    if (data.panelMessageId) {
      panelMsg = await channel.messages.fetch(data.panelMessageId).catch(() => null);
    }

    if (!panelMsg) {
      const recent = await channel.messages.fetch({ limit: 30 }).catch(() => null);
      panelMsg = recent?.find(m => m.author.id === client.user.id && m.content?.includes('YETKİLİ KONTROL MERKEZİ'));
    }

    if (panelMsg) {
      await panelMsg.edit(payload);
    } else {
      panelMsg = await channel.send(payload);
    }

    if (panelMsg) {
      data.panelMessageId = panelMsg.id;
      saveStaffData(data);
    }

    return panelMsg;
  } catch (err) {
    console.error('[StaffManagement] ensureStaffManagementPanel error:', err.message);
    return null;
  }
}

function initStaffManagementService(client) {
  if (client && !client.__robloxLandStaffManagementAttached) {
    client.__robloxLandStaffManagementAttached = true;

    // Periyodik kontrol: Her 12 saatte bir
    setInterval(() => {
      runDailyStaffAudit(client).catch(err => {
        console.error('[StaffManagement] Audit interval error:', err.message);
      });
    }, 12 * 60 * 60 * 1000);

    // Mesaj dinleyici
    client.on('messageCreate', async (message) => {
      try {
        await handleStaffWorkMessage(message);
      } catch (err) {
        console.error('[StaffManagement] messageCreate error:', err.message);
      }
    });
  }
}

module.exports = {
  GUILD_ID,
  PANEL_CHANNEL_ID,
  WORK_CATEGORY_ID,
  STAFF_LOG_CHANNEL_ID,
  DESIGNATED_STAFF_ID,
  STAFF_RANKS,
  ALL_STAFF_ROLE_IDS,
  activeAnonSessions,
  loadStaffData,
  saveStaffData,
  calculateStaffHealth,
  evaluatePromotionEligibility,
  evaluateDemotionRisk,
  renderProgressBar,
  buildStaffManagementPayload,
  buildStaffProfilePayload,
  buildStaffPersonalInfoPayload,
  buildStaffSettingsPayload,
  generateOathCertificateBuffer,
  DEFAULT_AUTOMATION_RULES,
  isValidWorkMessage,
  handleStaffWorkMessage,
  runDailyStaffAudit,
  handleStaffManagementInteraction,
  ensureStaffManagementPanel,
  initStaffManagementService
};
