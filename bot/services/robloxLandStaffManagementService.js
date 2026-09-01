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
const STAFF_ROLE_ID = '1537411928585015366';
const DESIGNATED_STAFF_ID = '1497600770634289194';
const STAFF_LOG_CHANNEL_ID = '1543382733408174220';

const DATA_FILE = path.join(__dirname, '../../data/robloxland_staff_management.json');

// Bellek İçi Anonim DM Oturumları: sessionId -> { sessionId, staffUserId, managerUserId, createdAt, messages: [] }
const activeAnonSessions = new Map();

function loadStaffData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[StaffManagement] Load error:', err.message);
  }
  return {
    staffMembers: {}, // userId -> { userId, username, joinedStaffAt, lastWorkAt, workCountTotal, workCount30d, streakDays, status, leaveUntil, leaveReason, performanceScore, warningsCount, historyLogs: [], assignedTasks: [] }
    panelMessageId: null,
    weeklyStats: {
      weekNumber: getWeekNumber(),
      totalWorksThisWeek: 0
    }
  };
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
 * Yetkili Yetki Kontrolü
 */
function isAuthorizedManager(member) {
  if (!member) return false;
  if (member.id === DESIGNATED_STAFF_ID) return true;

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
    (member.roles?.cache?.has && member.roles.cache.has(STAFF_ROLE_ID)) ||
    (Array.isArray(rolesList) ? rolesList.some(r => /kurucu|yönetici|admin|ik|sorumlu/i.test(r?.name || '')) : (typeof rolesList.some === 'function' && rolesList.some(r => /kurucu|yönetici|admin|ik|sorumlu/i.test(r?.name || ''))))
  );
}

/**
 * Yetkili Sağlık Durumunu Hesaplar
 */
function calculateStaffHealth(staff) {
  const now = Date.now();
  if (staff.leaveUntil && staff.leaveUntil > now) {
    return {
      status: 'leave',
      badge: '🏖️ İzinli',
      desc: `İzinli (${new Date(staff.leaveUntil).toLocaleDateString('tr-TR')}'e kadar)`
    };
  }

  const daysSinceWork = Math.floor((now - (staff.lastWorkAt || staff.joinedStaffAt || now)) / (1000 * 60 * 60 * 24));

  if (daysSinceWork <= 6) {
    return { status: 'active', badge: '🟢 Çok Aktif', daysSinceWork, desc: `${daysSinceWork} gün önce çalışma yaptı` };
  } else if (daysSinceWork <= 9) {
    return { status: 'warning', badge: '🟡 Yakında Çalışma Gerekli', daysSinceWork, desc: `${daysSinceWork} gündür paylaşım yapmadı` };
  } else if (daysSinceWork <= 19) {
    return { status: 'passive', badge: '🟠 Pasifleşiyor / Uyarıda', daysSinceWork, desc: `${daysSinceWork} gündür çalışma yapmadı (DM gönderildi)` };
  } else {
    return { status: 'review', badge: '🔴 İnceleme / RD Önerisi', daysSinceWork, desc: `${daysSinceWork} gündür inaktif!` };
  }
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
 * Ana Yetkili Yönetim Merkezi Paneli Payload'u
 */
function buildStaffManagementPayload(data = loadStaffData()) {
  const staffList = Object.values(data.staffMembers || {});
  const totalStaff = staffList.length;

  let activeCount = 0;
  let warningCount = 0;
  let passiveCount = 0;
  let leaveCount = 0;
  let topStaff = null;
  const needReview = [];

  for (const staff of staffList) {
    const health = calculateStaffHealth(staff);
    if (health.status === 'leave') leaveCount++;
    else if (health.status === 'active') activeCount++;
    else if (health.status === 'warning') warningCount++;
    else {
      passiveCount++;
      needReview.push(staff);
    }

    if (!topStaff || (staff.workCount30d || 0) > (topStaff.workCount30d || 0)) {
      topStaff = staff;
    }
  }

  const topStaffText = topStaff && topStaff.workCount30d > 0
    ? `<@${topStaff.userId}> (${topStaff.workCount30d} paylaşım 🔥 ${topStaff.streakDays || 1} gün seri)`
    : 'Henüz kayıt yok';

  const reviewText = needReview.length > 0
    ? needReview.slice(0, 3).map(s => `• <@${s.userId}> (${calculateStaffHealth(s).desc})`).join('\n')
    : '🟢 Kontrol bekleyen pasif yetkili bulunmuyor.';

  const currentWeekWorks = data.weeklyStats?.totalWorksThisWeek || 0;

  const content = [
    ComponentsV2Factory.text(
      `# 🛡️ ROBLOXLND YETKİLİ YÖNETİM MERKEZİ\n` +
      `*Yetkili kadrosunun haftalık/aylık performansını, 10 günlük paylaşım takibini ve idari işlemlerini bu panelden yönetebilirsiniz.*\n\n` +
      `### 📊 Kadro Durumu & İstatistikler:\n` +
      `• 👥 **Toplam Yetkili:** \`${totalStaff}\`\n` +
      `• 🟢 **Aktif:** \`${activeCount}\` | 🟡 **Yakında Gerekli:** \`${warningCount}\` | 🔴 **Pasif/Uyarı:** \`${passiveCount}\` | 🏖️ **İzinli:** \`${leaveCount}\`\n\n` +
      `• 📦 **Bu Hafta Paylaşılan Sistem/Map:** \`${currentWeekWorks}\` adet\n` +
      `• 🏆 **Ayın En Aktif Yetkilisi:** ${topStaffText}\n\n` +
      `### ⚠️ Dikkat & Kontrol Bekleyenler:\n` +
      `${reviewText}\n\n` +
      `-# 💡 *Sistem, 1538471137833394237 kategorisine atılan geçerli model, kod ve map paylaşımlarını 7/24 otomatik olarak çalışma sayar ve serileri işler.*`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "➕ Yetkili Ekle",
        custom_id: "robloxland_staffmgmt_add",
        emoji: { name: "➕" }
      },
      {
        style: ButtonStyle.Primary,
        label: "👥 Yetkili Kadrosu & Sağlık",
        custom_id: "robloxland_staffmgmt_list",
        emoji: { name: "👥" }
      },
      {
        style: ButtonStyle.Primary,
        label: "📊 Performans & Seri Tablosu",
        custom_id: "robloxland_staffmgmt_leaderboard",
        emoji: { name: "🏆" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "📨 Mesaj Gönder",
        custom_id: "robloxland_staffmgmt_broadcast",
        emoji: { name: "📨" }
      }
    ]),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Secondary,
        label: "🕵️ Anonim Görüşme Başlat",
        custom_id: "robloxland_staffmgmt_anon_dm",
        emoji: { name: "🕵️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🏖️ İzin Yönetimi",
        custom_id: "robloxland_staffmgmt_leave",
        emoji: { name: "🏖️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🎯 Görev Ata",
        custom_id: "robloxland_staffmgmt_task",
        emoji: { name: "🎯" }
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
 * Mesajın Geçerli Bir Sistem/Map Çalışması Olup Olmadığını Doğrular
 */
function isValidWorkMessage(message) {
  if (!message || message.author?.bot) return false;
  const content = message.content || '';
  const hasAttachment = Boolean(message.attachments && message.attachments.size > 0);

  // Linkler: roblox, github, devforum, pastebin vb.
  const hasValidLink = /(roblox\.com|github\.com|devforum\.roblox\.com|pastebin\.com|mediafire\.com|drive\.google\.com)/i.test(content);
  // Kod blokları veya belirgin model/sistem açıklaması
  const hasCodeBlock = content.includes('```') && content.length >= 30;
  const hasDetailedWorkDescription = content.length >= 60 && /(sistem|model|map|script|ui|gui|harita|plugin|animasyon)/i.test(content);

  return hasAttachment || hasValidLink || hasCodeBlock || hasDetailedWorkDescription;
}

/**
 * Kategorideki Paylaşım Mesajını Dinler ve Yetkili Çalışmasını Kaydeder
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

  if (!data.staffMembers[userId]) {
    // Kayıtlı değilse otomatik profil oluştur
    data.staffMembers[userId] = {
      userId,
      username: message.author.username,
      joinedStaffAt: Date.now(),
      lastWorkAt: Date.now(),
      workCountTotal: 1,
      workCount30d: 1,
      streakDays: 1,
      status: 'active',
      leaveUntil: null,
      leaveReason: null,
      performanceScore: 80,
      warningsCount: 0,
      historyLogs: [
        { date: Date.now(), text: 'Sisteme katıldı ve ilk sistem/map paylaşımını yaptı (+5 Puan)' }
      ],
      assignedTasks: []
    };
  } else {
    const staff = data.staffMembers[userId];
    const prevWork = staff.lastWorkAt || staff.joinedStaffAt || 0;
    const daysSince = Math.floor((Date.now() - prevWork) / (1000 * 60 * 60 * 24));

    staff.lastWorkAt = Date.now();
    staff.workCountTotal = (staff.workCountTotal || 0) + 1;
    staff.workCount30d = (staff.workCount30d || 0) + 1;
    staff.performanceScore = Math.min(100, (staff.performanceScore || 70) + 5);

    if (daysSince <= 7) {
      staff.streakDays = (staff.streakDays || 0) + 1;
    } else {
      staff.streakDays = 1;
    }

    staff.historyLogs = staff.historyLogs || [];
    staff.historyLogs.unshift({
      date: Date.now(),
      text: `Sistem/Map paylaştı (<#${message.channelId}>) — +5 Performans Puanı (Güncel: ${staff.performanceScore}/100)`
    });
    if (staff.historyLogs.length > 20) staff.historyLogs = staff.historyLogs.slice(0, 20);
  }

  // Haftalık sayaç
  const currentWeek = getWeekNumber();
  if (data.weeklyStats?.weekNumber !== currentWeek) {
    data.weeklyStats = { weekNumber: currentWeek, totalWorksThisWeek: 1 };
  } else {
    data.weeklyStats.totalWorksThisWeek = (data.weeklyStats.totalWorksThisWeek || 0) + 1;
  }

  saveStaffData(data);

  // Tepki vererek teyit et
  await message.react('📦').catch(() => {});
  await message.react('⭐').catch(() => {});

  return true;
}

/**
 * 10 Günlük & 13 Günlük Periyodik Denetim Motoru
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

      // 10. Gün Uyarısı (İlk Nazik Hatırlatma)
      if (daysSinceWork === 10 && !staff.warned10d) {
        staff.warned10d = true;
        staff.performanceScore = Math.max(0, (staff.performanceScore || 70) - 10);
        staff.historyLogs = staff.historyLogs || [];
        staff.historyLogs.unshift({ date: now, text: '10 gündür çalışma yapılmadığı için aktivite hatırlatması yapıldı (-10 Puan)' });

        const dmPayload = ComponentsV2Factory.buildPayload([
          ComponentsV2Factory.text(
            `# 🔔 RobloxLand Yetkili Aktivite Kontrolü\n\n` +
            `Selam **${user.username}** 👋\n\n` +
            `Bir süredir sistem/map kategorisinde herhangi bir paylaşım yapmadığını fark ettik (Son 10 gün).\n` +
            `Durumunu teyit etmek ve sana destek olmak için ulaşıyoruz. Aktif misin?\n\n` +
            `-# Lütfen aşağıdaki butonlardan durumunu seç:`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            {
              style: ButtonStyle.Success,
              label: "✅ Aktifim, Çalışıyorum",
              custom_id: `robloxland_staff_dm_active_${staff.userId}`,
              emoji: { name: "✅" }
            },
            {
              style: ButtonStyle.Primary,
              label: "🏖️ İzinliyim / Mola",
              custom_id: `robloxland_staff_dm_leave_${staff.userId}`,
              emoji: { name: "🏖️" }
            },
            {
              style: ButtonStyle.Secondary,
              label: "💬 Yönetime Yaz",
              custom_id: `robloxland_staff_dm_reply_${staff.userId}`,
              emoji: { name: "💬" }
            }
          ])
        ]);

        await user.send(dmPayload).catch(() => {});
      }

      // 13. Gün Uyarısı (3 gün daha geçince)
      if (daysSinceWork === 13 && !staff.warned13d) {
        staff.warned13d = true;
        staff.performanceScore = Math.max(0, (staff.performanceScore || 70) - 10);
        staff.historyLogs = staff.historyLogs || [];
        staff.historyLogs.unshift({ date: now, text: '13 gündür çalışma yapılmadığı için 2. kontrol uyarısı gönderildi' });

        const dmPayload13 = ComponentsV2Factory.buildPayload([
          ComponentsV2Factory.text(
            `# ⚠️ RobloxLand Yetkili Durum Hatırlatması\n\n` +
            `Selam **${user.username}**,\n\n` +
            `3 gündür hâlâ herhangi bir sistem veya map paylaşmadığını görüyoruz (Toplam 13 gün).\n` +
            `Bir sorun mu var? Eğer sınavların, işlerin veya yardıma ihtiyacın olan bir konu varsa lütfen yönetime bildir.\n\n` +
            `Ekibimizin aktifliği topluluğumuz için çok değerlidir.`
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
 * Yetkili Yönetim Etkileşimlerini İşler (Buttons & Modals)
 */
async function handleStaffManagementInteraction(interaction) {
  const customId = interaction.customId;
  if (!customId || (!customId.startsWith('robloxland_staffmgmt_') && !customId.startsWith('robloxland_staff_dm_'))) {
    return false;
  }

  const { guild, member, user } = interaction;
  const data = loadStaffData();

  // 1. DM Butonları (Yetkili DM'sinden gelenler)
  if (customId.startsWith('robloxland_staff_dm_')) {
    if (customId.startsWith('robloxland_staff_dm_active_')) {
      const staffId = customId.replace('robloxland_staff_dm_active_', '');
      if (data.staffMembers[staffId]) {
        data.staffMembers[staffId].warned10d = false;
        data.staffMembers[staffId].historyLogs = data.staffMembers[staffId].historyLogs || [];
        data.staffMembers[staffId].historyLogs.unshift({ date: Date.now(), text: 'DM uyarısına "Aktifim" yanıtı verdi' });
        saveStaffData(data);
      }
      return await interaction.reply({
        content: '✅ **Geri bildirimin alındı!** En kısa sürede sistem/map paylaşımını bekliyoruz. İyi çalışmalar!',
        ephemeral: true
      });
    }

    if (customId.startsWith('robloxland_staff_dm_leave_')) {
      const staffId = customId.replace('robloxland_staff_dm_leave_', '');
      const modal = new ModalBuilder()
        .setCustomId(`robloxland_staffmgmt_modal_dmleave_${staffId}`)
        .setTitle("🏖️ İzin Bildirimi Formu");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("leave_days")
            .setLabel("İzin Süresi (Gün Sayısı Olarak)")
            .setPlaceholder("Örn: 3, 7 veya 14")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(3)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("leave_reason")
            .setLabel("İzin Gerekçeniz")
            .setPlaceholder("Örn: Sınav haftası / Tatil / Kişisel sebepler")
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

  // 2. DM Modal Yanıtları
  if (customId.startsWith('robloxland_staffmgmt_modal_dmleave_')) {
    const staffId = customId.replace('robloxland_staffmgmt_modal_dmleave_', '');
    const daysRaw = parseInt(interaction.fields.getTextInputValue('leave_days'), 10) || 7;
    const days = Math.max(1, Math.min(60, daysRaw));
    const reason = interaction.fields.getTextInputValue('leave_reason') || 'Belirtilmedi';

    if (data.staffMembers[staffId]) {
      data.staffMembers[staffId].leaveUntil = Date.now() + (days * 24 * 60 * 60 * 1000);
      data.staffMembers[staffId].leaveReason = reason;
      data.staffMembers[staffId].historyLogs = data.staffMembers[staffId].historyLogs || [];
      data.staffMembers[staffId].historyLogs.unshift({ date: Date.now(), text: `İzin aldı (${days} gün): ${reason}` });
      saveStaffData(data);
    }

    await interaction.reply({
      content: `🏖️ **İzniniz kaydedildi!** ${days} gün boyunca (${new Date(Date.now() + days * 86400000).toLocaleDateString('tr-TR')} tarihine kadar) sistem çalışma uyarısı göndermeyecektir.`,
      ephemeral: true
    });
    return true;
  }

  if (customId.startsWith('robloxland_staffmgmt_modal_dmreply_')) {
    const staffId = customId.replace('robloxland_staffmgmt_modal_dmreply_', '');
    const text = interaction.fields.getTextInputValue('reply_text');

    try {
      const logChan = interaction.client.channels.cache.get(PANEL_CHANNEL_ID) ||
                      interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID);
      if (logChan && logChan.isTextBased()) {
        await logChan.send({
          ...ComponentsV2Factory.buildPayload([
            ComponentsV2Factory.text(
              `# 💬 Yetkili Yanıtı Geldi!\n\n` +
              `👤 **Yetkili:** <@${staffId}> (\`${staffId}\`)\n` +
              `📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
              `**Mesaj:**\n> ${text}`
            )
          ])
        });
      }
    } catch (_) {}

    await interaction.reply({
      content: '✅ Mesajınız yönetim kanalına başarıyla iletildi. Teşekkürler!',
      ephemeral: true
    });
    return true;
  }

  // ── Yönetici Yetki Kontrolü ──
  if (!isAuthorizedManager(member)) {
    return await interaction.reply({
      content: '❌ Bu yönetim panelini yalnızca RobloxLand yetkili amirleri ve yöneticileri kullanabilir.',
      ephemeral: true
    });
  }

  // 3. Yetkili Ekle Butonu
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
          .setLabel("Başlangıç Rolü / Departman")
          .setPlaceholder("Örn: Discord Moderatör / Geliştirici / Destek")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 4. Yetkili Ekle Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_add') {
    const rawUser = interaction.fields.getTextInputValue("staff_user_id")?.trim();
    const roleName = interaction.fields.getTextInputValue("staff_initial_role")?.trim() || "Moderatör";
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
      content: `✅ <@${cleanId}> başarıyla **${roleName}** olarak yetkili kadrosuna eklendi!`,
      ephemeral: true
    });
    return true;
  }

  // 5. Yetkili Listesi & Sağlık Tablosu
  if (customId === 'robloxland_staffmgmt_list') {
    const staffList = Object.values(data.staffMembers || {});
    if (staffList.length === 0) {
      return await interaction.reply({ content: 'ℹ️ Kayıtlı yetkili bulunamadı. "➕ Yetkili Ekle" butonu ile yetkili ekleyebilirsiniz.', ephemeral: true });
    }

    const lines = staffList.map(s => {
      const health = calculateStaffHealth(s);
      const bar = renderProgressBar(s.performanceScore || 80);
      return `### 👤 <@${s.userId}> (\`${s.username || s.userId}\`)\n` +
             `• **Durum:** ${health.badge} | **Performans:** \`${s.performanceScore || 80}/100\` [${bar}]\n` +
             `• **Son Çalışma:** ${health.desc} | **30 Gün Paylaşım:** \`${s.workCount30d || 0}\` | **Seri:** \`${s.streakDays || 0} gün\`\n` +
             `• **Uyarılar:** \`${s.warningsCount || 0}\``;
    });

    const payload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 👥 ROBLOXLND YETKİLİ SAĞLIK & KADRO TABLOSU\n\n` +
        lines.join('\n\n')
      ),
      ComponentsV2Factory.separator(true),
      ComponentsV2Factory.actionRow([
        {
          style: ButtonStyle.Primary,
          label: "🔍 Yetkili Profili & İşlem",
          custom_id: "robloxland_staffmgmt_select_profile",
          emoji: { name: "🔍" }
        }
      ])
    ]);

    return await interaction.reply({ ...payload, ephemeral: true });
  }

  // 6. Performans & Seri Tablosu
  if (customId === 'robloxland_staffmgmt_leaderboard') {
    const staffList = Object.values(data.staffMembers || {});
    if (staffList.length === 0) {
      return await interaction.reply({ content: 'ℹ️ Henüz yetkili verisi bulunmuyor.', ephemeral: true });
    }

    const sortedByWork = [...staffList].sort((a, b) => (b.workCount30d || 0) - (a.workCount30d || 0));
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    const rankingText = sortedByWork.slice(0, 10).map((s, idx) => {
      const medal = medals[idx] || `\`#${idx + 1}\``;
      return `${medal} **<@${s.userId}>** — \`${s.workCount30d || 0} Paylaşım\` | 🔥 \`${s.streakDays || 1} Gün Seri\` | ⭐ \`${s.performanceScore || 80}/100 Puan\``;
    }).join('\n');

    const payload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 🏆 YETKİLİ PERFORMANS & AKTİFLİK SIRALAMASI\n\n` +
        `*Son 30 günlük sistem/map paylaşımları ve aktiflik serileri baz alınmıştır:*\n\n` +
        `${rankingText}\n\n` +
        `-# Sistem/Map paylaşımı: +5 Puan | Kaliteli paylaşım: +2 Bonus | 7 Gün Seri: +5 Puan`
      )
    ]);

    return await interaction.reply({ ...payload, ephemeral: true });
  }

  // 7. Paneli Yenile Butonu
  if (customId === 'robloxland_staffmgmt_refresh') {
    const payload = buildStaffManagementPayload(data);
    try {
      if (interaction.message && typeof interaction.message.edit === 'function') {
        await interaction.message.edit(payload);
      }
    } catch (_) {}

    return await interaction.reply({ content: '🔄 Yetkili yönetim paneli güncellendi!', ephemeral: true });
  }

  // 8. İzin Yönetimi Modal
  if (customId === 'robloxland_staffmgmt_leave') {
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_adminleave')
      .setTitle("🏖️ Yetkiliye İzin Tanımla");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("leave_target_user")
          .setLabel("Yetkili Discord ID veya @Kullanıcı")
          .setPlaceholder("Örn: 123456789012345678")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("leave_duration_days")
          .setLabel("İzin Süresi (Gün Sayısı)")
          .setPlaceholder("Örn: 3, 7, 14")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("leave_admin_reason")
          .setLabel("İzin Gerekçesi")
          .setPlaceholder("Örn: Sınav / Mazeret İzni")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(200)
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 9. İzin Yönetimi Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_adminleave') {
    const rawTarget = interaction.fields.getTextInputValue("leave_target_user")?.trim();
    const cleanId = rawTarget?.replace(/[^0-9]/g, '');
    const days = parseInt(interaction.fields.getTextInputValue("leave_duration_days"), 10) || 7;
    const reason = interaction.fields.getTextInputValue("leave_admin_reason") || "Yönetim tarafından izin verildi";

    if (!cleanId || !data.staffMembers[cleanId]) {
      return await interaction.reply({ content: '❌ Belirtilen kullanıcı yetkili listesinde bulunamadı.', ephemeral: true });
    }

    data.staffMembers[cleanId].leaveUntil = Date.now() + (days * 24 * 60 * 60 * 1000);
    data.staffMembers[cleanId].leaveReason = reason;
    data.staffMembers[cleanId].historyLogs = data.staffMembers[cleanId].historyLogs || [];
    data.staffMembers[cleanId].historyLogs.unshift({ date: Date.now(), text: `Yönetici (<@${user.id}>) tarafından ${days} gün izin verildi: ${reason}` });

    saveStaffData(data);

    await interaction.reply({
      content: `✅ <@${cleanId}> adlı yetkiliye **${days} gün** (${new Date(Date.now() + days * 86400000).toLocaleDateString('tr-TR')} tarihine kadar) izin tanımlandı!`,
      ephemeral: true
    });
    return true;
  }

  // 10. Anonim Görüşme Başlat Butonu
  if (customId === 'robloxland_staffmgmt_anon_dm') {
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_anon_start')
      .setTitle("🕵️ Anonim Görüşme Başlat");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("anon_target_user")
          .setLabel("Yetkili Discord ID veya @Kullanıcı")
          .setPlaceholder("Örn: 123456789012345678")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("anon_initial_message")
          .setLabel("Yetkiliye Gönderilecek Anonim Mesaj")
          .setPlaceholder("Selam, son günlerde biraz pasif olduğunu fark ettik. Her şey yolunda mı?")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(400)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 11. Anonim Görüşme Başlat Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_anon_start') {
    const rawTarget = interaction.fields.getTextInputValue("anon_target_user")?.trim();
    const cleanId = rawTarget?.replace(/[^0-9]/g, '');
    const messageText = interaction.fields.getTextInputValue("anon_initial_message")?.trim();

    if (!cleanId || cleanId.length < 16) {
      return await interaction.reply({ content: '❌ Geçersiz kullanıcı ID.', ephemeral: true });
    }

    const sessionId = `anon-${Date.now().toString().slice(-5)}`;
    activeAnonSessions.set(sessionId, {
      sessionId,
      staffUserId: cleanId,
      managerUserId: user.id,
      createdAt: Date.now(),
      messages: [{ sender: 'manager', text: messageText, time: Date.now() }]
    });

    try {
      const targetUser = await interaction.client.users.fetch(cleanId).catch(() => null);
      if (targetUser) {
        const dmPayload = ComponentsV2Factory.buildPayload([
          ComponentsV2Factory.text(
            `# 📩 YÖNETİMDEN YENİ BİR MESAJINIZ VAR\n\n` +
            `> "${messageText}"\n\n` +
            `-# Bu mesaj RobloxLand Üst Yönetimi tarafından anonim olarak gönderilmiştir.\n` +
            `-# Yanıt vermek için aşağıdaki "💬 Yanıtla" butonunu kullanabilirsiniz.`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            {
              style: ButtonStyle.Primary,
              label: "💬 Yönetime Yanıtla",
              custom_id: `robloxland_staffmgmt_anon_reply_${sessionId}`,
              emoji: { name: "💬" }
            }
          ])
        ]);

        await targetUser.send(dmPayload);
      }
    } catch (err) {
      return await interaction.reply({ content: `❌ DM gönderilemedi: ${err.message}`, ephemeral: true });
    }

    // Üst Yönetim Loguna Bildir
    try {
      const logChan = interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID) ||
                      interaction.client.channels.cache.get(PANEL_CHANNEL_ID);
      if (logChan && logChan.isTextBased()) {
        await logChan.send({
          content: `🕵️ **Anonim Görüşme Başlatıldı (#${sessionId})**\n` +
                   `• **Başlatan Yönetici:** <@${user.id}> (\`${user.tag}\`)\n` +
                   `• **Hedef Yetkili:** <@${cleanId}>\n` +
                   `• **Mesaj:** "${messageText}"`
        });
      }
    } catch (_) {}

    await interaction.reply({
      content: `✅ <@${cleanId}> adlı yetkiliye anonim mesajınız iletildi (#${sessionId})!`,
      ephemeral: true
    });
    return true;
  }

  // 12. Yetkilinin Anonim Mesaja Yanıt Butonu
  if (customId.startsWith('robloxland_staffmgmt_anon_reply_')) {
    const sessionId = customId.replace('robloxland_staffmgmt_anon_reply_', '');
    const modal = new ModalBuilder()
      .setCustomId(`robloxland_staffmgmt_modal_anon_reply_${sessionId}`)
      .setTitle("💬 Yönetime Yanıt");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("anon_reply_text")
          .setLabel("Yönetime Mesajınız")
          .setPlaceholder("Açıklamanızı ve durumunuzu buraya yazabilirsiniz...")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(400)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 13. Yetkilinin Anonim Yanıt Modalı Submit
  if (customId.startsWith('robloxland_staffmgmt_modal_anon_reply_')) {
    const sessionId = customId.replace('robloxland_staffmgmt_modal_anon_reply_', '');
    const replyText = interaction.fields.getTextInputValue("anon_reply_text")?.trim();
    const session = activeAnonSessions.get(sessionId);

    // Yönetim Kanalına Köprü Olarak İlet
    try {
      const logChan = interaction.client.channels.cache.get(PANEL_CHANNEL_ID) ||
                      interaction.client.channels.cache.get(STAFF_LOG_CHANNEL_ID);
      if (logChan && logChan.isTextBased()) {
        await logChan.send({
          ...ComponentsV2Factory.buildPayload([
            ComponentsV2Factory.text(
              `# 🕵️ Anonim Görüşme Yanıtı (#${sessionId})\n\n` +
              `👤 **Yetkili:** <@${user.id}> (\`${user.tag}\`)\n` +
              `🛡️ **Görüşmeyi Başlatan:** <@${session?.managerUserId || DESIGNATED_STAFF_ID}>\n` +
              `📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
              `**Yetkilinin Yanıtı:**\n> ${replyText}`
            )
          ])
        });
      }
    } catch (_) {}

    await interaction.reply({
      content: '✅ Yanıtınız üst yönetime başarıyla iletildi.',
      ephemeral: true
    });
    return true;
  }

  // 14. Toplu / Hazır Mesaj Gönder Butonu
  if (customId === 'robloxland_staffmgmt_broadcast') {
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_broadcast')
      .setTitle("📨 Yetkili Kadrosuna Mesaj");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("broadcast_type")
          .setLabel("Mesaj Türü (1:Çalışma, 2:Toplantı, 3:Uyarı, 4:Özel)")
          .setPlaceholder("1, 2, 3 veya 4 yazınız")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(1)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("broadcast_custom_text")
          .setLabel("Ek Mesaj / Toplantı Detayı (İsteğe Bağlı)")
          .setPlaceholder("Toplantı saat 21:00'de ses kanalında olacaktır...")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 15. Hazır Mesaj Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_broadcast') {
    const type = interaction.fields.getTextInputValue("broadcast_type")?.trim();
    const extra = interaction.fields.getTextInputValue("broadcast_custom_text")?.trim() || "";

    let messageBody = "👋 **Selam! Çalışma vakti.**\nBugün müsaitsen yeni bir sistem/map paylaşmanı bekliyoruz.";
    let title = "💼 Çalışma Vakti Hatırlatması";

    if (type === '2') {
      title = "📅 Yetkili Toplantısı Duyurusu";
      messageBody = "📅 **Yetkili Toplantısı Var!**\nLütfen belirlenen saatte sesli kanalda hazır bulununuz.";
    } else if (type === '3') {
      title = "⚠️ Yetkili Aktivite Uyarısı";
      messageBody = "⚠️ **Aktivite Kontrolü!**\nSon zamanlardaki sistem/map paylaşım durumunuzu kontrol etmeniz rica olunur.";
    }

    if (extra) {
      messageBody += `\n\n**Detay:** ${extra}`;
    }

    const staffList = Object.values(data.staffMembers || {});
    let sentCount = 0;

    for (const staff of staffList) {
      try {
        const u = await interaction.client.users.fetch(staff.userId).catch(() => null);
        if (u) {
          await u.send({
            ...ComponentsV2Factory.buildPayload([
              ComponentsV2Factory.text(`# 📢 ${title}\n\n${messageBody}`)
            ])
          }).catch(() => {});
          sentCount++;
        }
      } catch (_) {}
    }

    await interaction.reply({
      content: `✅ **${sentCount} yetkiliye** "${title}" mesajı DM olarak başarıyla gönderildi!`,
      ephemeral: true
    });
    return true;
  }

  // 16. Görev Atama Butonu
  if (customId === 'robloxland_staffmgmt_task') {
    const modal = new ModalBuilder()
      .setCustomId('robloxland_staffmgmt_modal_task')
      .setTitle("🎯 Yetkiliye Özel Görev Ata");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("task_target_user")
          .setLabel("Yetkili Discord ID veya @Kullanıcı")
          .setPlaceholder("Örn: 123456789012345678")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("task_description")
          .setLabel("Görev Açıklaması")
          .setPlaceholder("Örn: Cuma gününe kadar araç envanter sistemi paylaş")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(250)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 17. Görev Atama Modal Submit
  if (customId === 'robloxland_staffmgmt_modal_task') {
    const rawTarget = interaction.fields.getTextInputValue("task_target_user")?.trim();
    const cleanId = rawTarget?.replace(/[^0-9]/g, '');
    const taskDesc = interaction.fields.getTextInputValue("task_description")?.trim();

    if (!cleanId || !data.staffMembers[cleanId]) {
      return await interaction.reply({ content: '❌ Belirtilen kullanıcı yetkili listesinde bulunamadı.', ephemeral: true });
    }

    data.staffMembers[cleanId].assignedTasks = data.staffMembers[cleanId].assignedTasks || [];
    data.staffMembers[cleanId].assignedTasks.push({
      id: Date.now(),
      desc: taskDesc,
      assignedBy: user.tag,
      assignedAt: Date.now(),
      status: 'pending'
    });

    data.staffMembers[cleanId].historyLogs = data.staffMembers[cleanId].historyLogs || [];
    data.staffMembers[cleanId].historyLogs.unshift({ date: Date.now(), text: `Yeni görev atandı: ${taskDesc}` });
    saveStaffData(data);

    try {
      const targetUser = await interaction.client.users.fetch(cleanId).catch(() => null);
      if (targetUser) {
        await targetUser.send({
          ...ComponentsV2Factory.buildPayload([
            ComponentsV2Factory.text(
              `# 🎯 YENİ YETKİLİ GÖREVİNİZ VAR!\n\n` +
              `Yönetici **${user.tag}** tarafından size özel bir görev atandı:\n\n` +
              `> **Görev:** ${taskDesc}\n\n` +
              `*Görevi tamamladığınızda sistem kategorisinde paylaşarak yönetime bildirebilirsiniz (+5 Performans Puanı).*`
            )
          ])
        }).catch(() => {});
      }
    } catch (_) {}

    await interaction.reply({
      content: `✅ <@${cleanId}> adlı yetkiliye görev başarıyla atandı ve DM ile bildirildi!`,
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
      panelMsg = recent?.find(m => m.author.id === client.user.id && m.content?.includes('ROBLOXLAND YETKİLİ YÖNETİM'));
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
  STAFF_ROLE_ID,
  DESIGNATED_STAFF_ID,
  activeAnonSessions,
  loadStaffData,
  saveStaffData,
  calculateStaffHealth,
  renderProgressBar,
  buildStaffManagementPayload,
  isValidWorkMessage,
  handleStaffWorkMessage,
  runDailyStaffAudit,
  handleStaffManagementInteraction,
  ensureStaffManagementPanel,
  initStaffManagementService
};
