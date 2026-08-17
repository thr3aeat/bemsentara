'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const StaffProgress = require('../../models/StaffProgress');
const { GUILD_ID } = require('./staffSystem');

/**
 * Calculates a staff member's Key Performance Indicator (KPI) score (0-100)
 */
function calculateKpi(progress) {
  if (!progress) return 100;
  
  let score = 100;

  // 1. Düşüşler: Sicil uyarıları (-10 puan her biri)
  const disciplinaryWarns = progress.disciplinary?.warns || [];
  score -= (disciplinaryWarns.length * 10);

  // 2. Artışlar: Teşekkürler (+5 puan her biri)
  const commendations = progress.disciplinary?.commendations || [];
  score += (commendations.length * 5);

  // 3. Düşüşler: Görev ihlali uyarıları (-5 puan her biri)
  const taskWarnings = progress.warnings?.count || 0;
  score -= (taskWarnings * 5);

  // Limitler (0 - 100)
  score = Math.max(0, Math.min(100, score));
  return score;
}

/**
 * Gets a text evaluation grade based on KPI score
 */
function getKpiGrade(score) {
  if (score >= 95) return { label: '🌟 ÜSTÜN PERFORMANS (Efsanevi)', color: 0x2ecc71 };
  if (score >= 80) return { label: '🟢 BAŞARILI (Ortalama Üstü)', color: 0x2ecc71 };
  if (score >= 60) return { label: '🟡 YETERLİ (Gereksinimleri Karşılıyor)', color: 0xf1c40f };
  if (score >= 40) return { label: '🟠 GELİŞTİRİLMELİ', color: 0xe67e22 };
  return { label: '🔴 KRİTİK SEVİYE / PERFORMANS UYARISI', color: 0xe74c3c };
}

/**
 * Logs duty-related events to the nöbet-log channel
 */
async function sendDutyLog(client, embed) {
  try {
    const { GUILD2_ID } = require('../../config');
    const guild = await client.guilds.fetch(GUILD2_ID).catch(() => null);
    if (!guild) return;
    
    const categoryId = "1518692460233228431"; // EkoYıldız log kategorisi
    let channel = guild.channels.cache.find(c => c.parentId === categoryId && c.name === 'nöbet-log');
    if (!channel) {
      channel = await guild.channels.create({
        name: 'nöbet-log',
        type: 0, // text channel
        parent: categoryId,
        topic: 'Yetkili Nöbet Giriş/Çıkış ve Aktivite log kanalı.'
      }).catch(() => null);
    }
    
    if (channel) {
      await channel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('[staffDutyService] sendDutyLog error:', err.message);
  }
}

/**
 * Staff starts their duty session
 */
async function startDuty(interaction, client) {
  const userId = interaction.user.id;
  try {
    const p = await StaffProgress.findOne({ userId });
    if (!p) return interaction.reply({ content: '❌ Personel kaydınız bulunamadı.', ephemeral: true });

    if (p.duty?.isActive) {
      return interaction.reply({ content: '⚠️ Zaten aktif bir nöbettesiniz!', ephemeral: true });
    }

    p.duty = {
      isActive: true,
      startedAt: new Date(),
      sessionVoiceMinutes: 0,
      sessionTicketsSolved: 0,
      sessionModerationActions: 0
    };

    await p.save();

    const logEmbed = new EmbedBuilder()
      .setTitle('⚡ Nöbet Başlatıldı')
      .setDescription(`**${interaction.user.tag}** (\`${userId}\`) aktif olarak nöbete başladı!`)
      .setColor(0x3498db)
      .addFields(
        { name: '🎖️ Seviye / Seviye', value: `Seviye ${p.level}`, inline: true },
        { name: '⏰ Başlangıç Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setTimestamp();

    await sendDutyLog(client, logEmbed);

    return interaction.reply({
      content: '⚡ **Nöbet Başlatıldı!** Ses kanallarındaki aktifliğiniz ve çözdüğünüz biletler bu nöbet oturumunuza işlenecektir. Kolay gelsin! 🫡',
      ephemeral: true
    });
  } catch (err) {
    console.error('[staffDutyService] startDuty error:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Staff ends their duty session
 */
async function endDuty(interaction, client, handoverNotes = null) {
  const userId = interaction.user.id;
  const isDeferred = interaction.deferred || interaction.replied;
  try {
    const p = await StaffProgress.findOne({ userId });
    if (!p) {
      const msg = '❌ Personel kaydınız bulunamadı.';
      return isDeferred ? interaction.editReply({ content: msg }) : interaction.reply({ content: msg, ephemeral: true });
    }

    if (!p.duty?.isActive || !p.duty.startedAt) {
      const msg = '⚠️ Aktif bir nöbetiniz bulunmuyor!';
      return isDeferred ? interaction.editReply({ content: msg }) : interaction.reply({ content: msg, ephemeral: true });
    }

    const durationMs = Date.now() - new Date(p.duty.startedAt).getTime();
    const durationMins = Math.floor(durationMs / 1000 / 60);
    const durationHours = Math.floor(durationMins / 60);
    const remainingMins = durationMins % 60;

    const voiceMins = p.duty.sessionVoiceMinutes || 0;
    const tickets = p.duty.sessionTicketsSolved || 0;
    const mods = p.duty.sessionModerationActions || 0;

    // V0.7/OHAL Çarpanı Entegrasyonu
    const ServerConfig = require('../../models/ServerConfig');
    let sConf = await ServerConfig.findOne({ guildId: p.guildId || (interaction.guild ? interaction.guild.id : '1466927911364726845') });
    const isOhal = sConf && sConf.isOhalActive;
    const multiplier = isOhal ? 2.5 : 0.7;

    const xpReward = Math.floor(((durationHours * 15) + (tickets * 25) + (mods * 15) + (voiceMins * 3)) * multiplier);
    const coinRewardRaw = Math.floor(((durationHours * 50) + (tickets * 40) + (mods * 30) + (voiceMins * 2)) * multiplier);
    const taxDeduction = Math.floor(coinRewardRaw * 0.10);
    const coinReward = Math.max(0, coinRewardRaw - taxDeduction);

    p.duty.isActive = false;
    p.duty.startedAt = null;
    p.duty.pendingEnd = false;
    p.duty.pendingHandoverNotes = '';

    p.daily = p.daily || {};
    p.daily.dutyMinutesToday = (p.daily.dutyMinutesToday || 0) + durationMins;
    if (handoverNotes) {
      p.daily.incidentReportsToday = (p.daily.incidentReportsToday || 0) + 1;

      // Save latest handover notes to ServerConfig
      try {
        const ServerConfig = require('../../models/ServerConfig');
        let sConf = await ServerConfig.findOne({ guildId: p.guildId || (interaction.guild ? interaction.guild.id : '1466927911364726845') });
        if (!sConf) {
          sConf = new ServerConfig({ guildId: p.guildId || (interaction.guild ? interaction.guild.id : '1466927911364726845') });
        }
        sConf.latestHandoverNote = handoverNotes;
        sConf.latestHandoverAuthor = userId;
        sConf.latestHandoverAt = new Date();
        await sConf.save();
      } catch (confErr) {
        console.error('[staffDutyService] ServerConfig handover notes save error:', confErr.message);
      }

      // Run AI Audit Log check (Yumuşatılmış ve adil denetim)
      try {
        let isAnomaly = false;
        let anomalyReason = '';
        if (durationMins >= 480 && tickets === 0 && mods === 0 && voiceMins === 0) {
          isAnomaly = true;
          anomalyReason = 'Çok uzun süre (8+ saat) boyunca tamamen hareketsiz nöbet oturumu.';
        } else if (handoverNotes && handoverNotes.length >= 5) {
          const { chatWithAI } = require('./staffSystem');
          const aiPrompt = `Aşağıdaki vardiya devir notunu analiz et. Küfür, bariz hakaret veya troll spam var mı? Sadece EVET veya HAYIR ile başla.
Not: "${handoverNotes}"`;
          const aiResponse = await chatWithAI([{ role: 'user', content: aiPrompt }], 'Sen bir denetleme yapay zekasısın.').catch(() => '');
          if (aiResponse && aiResponse.toUpperCase().startsWith('EVET')) {
            isAnomaly = true;
            anomalyReason = 'Devir notunda uygunsuz ifade veya troll içerik tespiti.';
          }
        }

        if (isAnomaly) {
          const { CHANNELS } = require('./staffAutomation');
          const adminLogChanId = CHANNELS.CEZA_LOG || CHANNELS.TERFI_LOG;
          const adminLogChan = await client.channels.fetch(adminLogChanId).catch(() => null);
          if (adminLogChan && adminLogChan.isTextBased()) {
            const anomalyEmbed = new EmbedBuilder()
              .setColor(0xe74c3c)
              .setTitle('⚠️ Akıllı Denetleme: Yetkili Anomalisi Tespit Edildi')
              .setDescription(`👤 <@${userId}> adlı yetkilinin vardiya devrinde şüpheli durum tespit edildi.`)
              .addFields(
                { name: '👤 Yetkili', value: `<@${userId}> (${userId})`, inline: true },
                { name: '⏱️ Süre / Aktiflik', value: `${durationMins} dk (Ses: ${voiceMins} dk | Ticket: ${tickets} | Mod: ${mods})`, inline: true },
                { name: '📝 Vardiya Notu', value: `\`\`\`${handoverNotes}\`\`\``, inline: false },
                { name: '🔍 Tespit Edilen Anomali', value: anomalyReason, inline: false }
              )
              .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`audit_inspect_${userId}`)
                .setLabel('🔍 Personeli İncelemeye Al')
                .setStyle(ButtonStyle.Danger)
            );

            await adminLogChan.send({ embeds: [anomalyEmbed], components: [row] });
          }
        }
      } catch (auditErr) {
        console.error('[staffDutyService] AI Audit Log check error:', auditErr.message);
      }
    }

    if (!p.gamification) {
      p.gamification = { totalPoints: 0, ecoCoins: 0, level: 1, currentXP: 0, badges: {}, streak: { current: 0, longest: 0, brokenDays: 0 } };
    }
    p.gamification.currentXP = (p.gamification.currentXP || 0) + xpReward;
    p.gamification.ecoCoins = (p.gamification.ecoCoins || 0) + coinReward;

    await p.save();

    const { checkChosenTaskCompletion } = require('./staffSystem');
    await checkChosenTaskCompletion(p, client).catch(() => {});

    const logFields = [
      { name: '⏱️ Toplam Süre', value: `${durationHours} saat ${remainingMins} dakika`, inline: true },
      { name: '🎤 Ses Aktifliği', value: `${voiceMins} dakika`, inline: true },
      { name: '🎫 Çözülen Bilet', value: `${tickets} adet`, inline: true },
      { name: '🛡️ Mod İşlemleri', value: `${mods} adet`, inline: true },
      { name: '🎁 Kazanılan Ödüller', value: `✨ **+${xpReward} Elmas (💎)**\n🪙 **+${coinReward} TL**`, inline: false }
    ];

    if (handoverNotes) {
      logFields.push({ name: '📝 Vardiya Devir Notları', value: `\`\`\`. ${handoverNotes}\`\`\``, inline: false });
    }

    const logEmbed = new EmbedBuilder()
      .setTitle('🛑 Nöbet Tamamlandı (Vardiya Devri)')
      .setDescription(`**${interaction.user.tag}** (\`${userId}\`) nöbetini tamamladı ve vardiyayı devretti.`)
      .setColor(0xe74c3c)
      .addFields(logFields)
      .setTimestamp();

    await sendDutyLog(client, logEmbed);

    const replyContent = `🛑 **Nöbetinizi Bitirdiniz!**\n\n` +
      `⏱️ **Süre:** ${durationHours} sa ${remainingMins} dk\n` +
      `🎙️ **Ses:** ${voiceMins} dk | 🎫 **Bilet:** ${tickets} | 🛡️ **Mod:** ${mods}\n` +
      (handoverNotes ? `📝 **Devir Notu:** \`${handoverNotes}\`\n` : '') +
      `🎁 **Kazanılan:** +${xpReward} Elmas (💎), +${coinReward} TL!\n\n` +
      `Emeğiniz için teşekkürler! 💚`;

    return isDeferred ? interaction.editReply({ content: replyContent }) : interaction.reply({ content: replyContent, ephemeral: true });
  } catch (err) {
    console.error('[staffDutyService] endDuty error:', err.message);
    const msg = `❌ Hata: ${err.message}`;
    return isDeferred ? interaction.editReply({ content: msg }) : interaction.reply({ content: msg, ephemeral: true });
  }
}

/**
 * Gets live duty status for a staff member and shows currently active guards
 */
async function getDutyStatus(interaction) {
  const isDeferred = interaction.deferred || interaction.replied;
  if (!isDeferred) {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
  }
  try {
    const userId = interaction.user.id;
    const p = await StaffProgress.findOne({ userId });
    
    // Find all currently active duty guards
    const activeStaffList = await StaffProgress.find({ 'duty.isActive': true });

    const activeGuardsStr = activeStaffList.length > 0
      ? activeStaffList.map(s => `<@${s.userId}> (Seviye ${s.level || 1})`).join('\n')
      : '_Şu anda aktif nöbette yetkili bulunmuyor._';

    if (!p || !p.duty?.isActive) {
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Canlı Nöbet Durum Paneli')
        .setColor(0xE67E22)
        .setDescription(
          `**Kullanıcı:** <@${userId}>\n` +
          `🔴 **Nöbet Durumunuz:** Inaktif (Nöbette değilsiniz)\n\n` +
          `🟢 **ŞU ANDA NÖBETTE OLAN YETKİLİLER (${activeStaffList.length}):**\n${activeGuardsStr}`
        )
        .setFooter({ text: 'EkoYıldız Akıllı Nöbet Sistemi V2.0' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_duty_start').setLabel('⚡ Nöbet Başlat').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_duty_leaderboard').setLabel('🏆 Nöbet Sıralaması').setStyle(ButtonStyle.Primary)
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    }

    const startedAt = new Date(p.duty.startedAt);
    const durationMs = Date.now() - startedAt.getTime();
    const durationMins = Math.floor(durationMs / 1000 / 60);
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;

    const isBreak = !!p.duty.isOnBreak;
    const breakStr = isBreak ? '☕ **MOLADA**' : '🟢 **AKTİF NÖBETTE**';

    const embed = new EmbedBuilder()
      .setTitle('⚡ Canlı Nöbet İstatistikleriniz')
      .setColor(isBreak ? 0xF1C40F : 0x2ECC71)
      .setDescription(
        `**Yetkili:** <@${userId}>\n` +
        `🎭 **Durum:** ${breakStr}\n` +
        `⏰ **Başlangıç:** <t:${Math.floor(startedAt.getTime() / 1000)}:R>\n` +
        `⏱️ **Geçen Süre:** **${hours} saat ${mins} dakika**\n\n` +
        `📊 **BU NÖBETTEKİ AKTİFLİĞİNİZ:**\n` +
        `• 🎤 Sesli Oda Aktifliği: **${p.duty.sessionVoiceMinutes || 0} dk**\n` +
        `• 🎫 Çözülen Bilet: **${p.duty.sessionTicketsSolved || 0} adet**\n` +
        `• 🛡️ Moderasyon İşlemleri: **${p.duty.sessionModerationActions || 0} adet**\n\n` +
        `👥 **ŞU ANDA NÖBETTE OLAN DİĞER YETKİLİLER (${activeStaffList.length}):**\n${activeGuardsStr}`
      )
      .setFooter({ text: 'EkoYıldız Akıllı Nöbet Sistemi' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_duty_break').setLabel(isBreak ? '▶️ Molayı Bitir' : '☕ Mola Al').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('btn_duty_end').setLabel('🛑 Nöbeti Bitir & Devret').setStyle(ButtonStyle.Danger)
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[staffDutyService] getDutyStatus error:', err.message);
    return interaction.editReply({ content: `❌ Durum alınırken hata oluştu: ${err.message}` });
  }
}

/**
 * Toggles coffee break (mola) status for staff on duty
 */
async function toggleDutyBreak(interaction) {
  const userId = interaction.user.id;
  await interaction.deferReply({ ephemeral: true }).catch(() => {});
  try {
    const p = await StaffProgress.findOne({ userId });
    if (!p || !p.duty?.isActive) {
      return interaction.editReply({ content: '❌ Molaya çıkabilmek için önce nöbet başlatmalısınız.' });
    }

    const currentState = !!p.duty.isOnBreak;
    p.duty.isOnBreak = !currentState;
    await p.save();

    if (!currentState) {
      return interaction.editReply({ content: '☕ **Nöbet Molanız Başlatıldı!** Dinlenebilirsiniz. Dönünce butondan molanızı bitirebilirsiniz.' });
    } else {
      return interaction.editReply({ content: '▶️ **Nöbet Molanız Bitti!** Göreve tekrar hoş geldiniz. Kolay gelsin! 🫡' });
    }
  } catch (err) {
    console.error('[staffDutyService] toggleDutyBreak error:', err.message);
    return interaction.editReply({ content: `❌ Hata: ${err.message}` });
  }
}

/**
 * Displays the duty leaderboard (top duty staff)
 */
async function renderDutyLeaderboard(interaction) {
  await interaction.deferReply({ ephemeral: true }).catch(() => {});
  try {
    const topStaff = await StaffProgress.find({ 'daily.dutyMinutesToday': { $gt: 0 } })
      .sort({ 'daily.dutyMinutesToday': -1 })
      .limit(10);

    const embed = new EmbedBuilder()
      .setTitle('🏆 Günlük Nöbet Liderlik Tablosu')
      .setColor(0xF1C40F)
      .setDescription(
        topStaff.length > 0
          ? topStaff.map((s, idx) => {
              const mins = s.daily?.dutyMinutesToday || 0;
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '🎖️'));
              return `${medal} **#${idx + 1}** <@${s.userId}> — **${h} sa ${m} dk** Nöbet`;
            }).join('\n')
          : '_Bugün henüz nöbet kaydı bulunan yetkili bulunmuyor._'
      )
      .setFooter({ text: 'EkoYıldız En Aktif Nöbetçiler' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error('[staffDutyService] renderDutyLeaderboard error:', err.message);
    return interaction.editReply({ content: `❌ Sıralama alınırken hata oluştu: ${err.message}` });
  }
}

/**
 * Handles all duty-related buttons
 */
async function handleDutyButton(interaction) {
  const { customId, client } = interaction;
  if (customId === 'staff_duty_start' || customId === 'btn_duty_start') {
    return startDuty(interaction, client);
  }
  if (customId === 'staff_duty_end' || customId === 'btn_duty_end') {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
    const modal = new ModalBuilder()
      .setCustomId('modal_duty_end_handover')
      .setTitle('🛑 Nöbeti Bitir & Devret');

    const input = new TextInputBuilder()
      .setCustomId('handover_notes')
      .setLabel('Nöbet Devir Notları (Neler Yaşandı?)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Örn: Spam yapan 2 kişiyi muteledim, destek biletlerinde reklam yapan üyeyi takip ettim.')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal).catch(() => {});
  }
  if (customId === 'staff_duty_status' || customId === 'btn_duty_status') {
    return getDutyStatus(interaction);
  }
  if (customId === 'btn_duty_break') {
    return toggleDutyBreak(interaction);
  }
  if (customId === 'btn_duty_leaderboard') {
    return renderDutyLeaderboard(interaction);
  }
}

/**
 * Adds a formal commendation to a staff member
 */
async function addCommendation(userId, reason, issuedBy) {
  const p = await StaffProgress.findOne({ userId, status: 'active' });
  if (!p) return { success: false, error: 'Aktif personel bulunamadı.' };

  if (!p.disciplinary) {
    p.disciplinary = { warns: [], commendations: [] };
  }

  p.disciplinary.commendations.push({
    date: new Date(),
    reason,
    issuedBy
  });

  await p.save();
  return { success: true, newKpi: calculateKpi(p) };
}

/**
 * Adds a disciplinary warning to a staff member
 */
async function addDisciplinaryWarn(userId, reason, issuedBy) {
  const p = await StaffProgress.findOne({ userId, status: 'active' });
  if (!p) return { success: false, error: 'Aktif personel bulunamadı.' };

  if (!p.disciplinary) {
    p.disciplinary = { warns: [], commendations: [] };
  }

  p.disciplinary.warns.push({
    date: new Date(),
    reason,
    issuedBy
  });

  await p.save();
  return { success: true, newKpi: calculateKpi(p) };
}

/**
 * Increments active stats in current duty session if active
 */
async function logDutyActivity(userId, activityType, amount = 1) {
  try {
    const p = await StaffProgress.findOne({ userId, 'duty.isActive': true });
    if (!p || !p.duty) return;

    if (activityType === 'voice') {
      p.duty.sessionVoiceMinutes = (p.duty.sessionVoiceMinutes || 0) + amount;
    } else if (activityType === 'ticket') {
      p.duty.sessionTicketsSolved = (p.duty.sessionTicketsSolved || 0) + amount;
    } else if (activityType === 'mod') {
      p.duty.sessionModerationActions = (p.duty.sessionModerationActions || 0) + amount;
    }

    await p.save();
  } catch (err) {
    console.error('[staffDutyService] logDutyActivity error:', err.message);
  }
}

/**
 * Produces a Components V2 Audit Dashboard payload for a staff member
 */
function buildStaffDashboardV2(staffProgress = {}, user = {}) {
  const ComponentsV2Factory = require('../utils/componentsV2Factory');
  const TypographyHelper = require('../utils/typographyHelper');
  const QuickChartHelper = require('../utils/quickChartHelper');
  const { ButtonStyle } = require('discord.js');

  const kpiScore = calculateKpi(staffProgress);
  const kpiGrade = getKpiGrade(kpiScore);

  const userId = staffProgress.userId || user.id || "0";
  const username = user?.username || staffProgress.userId || "Yetkili";
  const avatarUrl = user?.displayAvatarURL ? user.displayAvatarURL({ size: 256 }) : null;
  const ticketCount = staffProgress.duty?.sessionTicketsSolved || 0;
  const modActions = staffProgress.duty?.sessionModerationActions || 0;
  const voiceHours = Math.round(((staffProgress.duty?.sessionVoiceMinutes || 0) / 60) * 10) / 10;

  const chartUrl = QuickChartHelper.getChartUrl({
    labels: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    data: [2, 5, 8, 4, 10, 6, 3],
    datasetLabel: "Ticket Çözümü",
    chartType: "bar",
    color: "#5865F2",
    width: 450,
    height: 180,
  });

  return ComponentsV2Factory.buildPayload(kpiGrade.color || 0x5865F2, [
    ComponentsV2Factory.section(
      `${TypographyHelper.h2(`👑 Yetkili Audit Dashboard: ${username}`)}\n` +
      `🎭 **Durum:** \`${kpiGrade.label}\` (KPI: **${kpiScore}/100**)\n` +
      `🎫 **Ticket:** **${ticketCount}**  |  🔨 **Mod İşlemleri:** **${modActions}**\n` +
      `🎙️ **Sesli Mesai:** **${voiceHours} Saat**`,
      avatarUrl
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.text(`📈 **Haftalık Aktiflik & Performans Grafiği:**`),
    ComponentsV2Factory.mediaGallery([chartUrl]),
    ComponentsV2Factory.separator(false),
    ComponentsV2Factory.text(
      TypographyHelper.subtext(`Sentara Staff Audit • ${TypographyHelper.timestamp(new Date(), "R")}`)
    ),
    ComponentsV2Factory.actionRow([
      { custom_id: `btn_duty_status`, label: "⚡ Nöbet Durumu", style: ButtonStyle.Primary },
      { custom_id: `staff_kpi_detail_${userId}`, label: "🔍 KPI Detayı", style: ButtonStyle.Secondary },
    ]),
  ]);
}

module.exports = {
  calculateKpi,
  getKpiGrade,
  startDuty,
  endDuty,
  getDutyStatus,
  toggleDutyBreak,
  renderDutyLeaderboard,
  handleDutyButton,
  addCommendation,
  addDisciplinaryWarn,
  logDutyActivity,
  buildStaffDashboardV2
};

