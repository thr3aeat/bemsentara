'use strict';

/**
 * Moderatör Hiyerarşik Dashboard - İşlem Handler Sistemi
 * Tüm mod_action_* butonları için gerçek işlem implementasyonu
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

const StaffProgress = require('../../models/StaffProgress');
const { ROLES, ROLE_NAMES, getProgressBar } = require('./staffSystem');

/**
 * Personnel Search Action - Personel Arama
 */
async function handlePersonnelSearch(interaction, actionId) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`search_modal_${actionId}`)
      .setTitle('👤 Personel Arama');

    let searchInput;
    if (actionId === 'search_by_name') {
      searchInput = new TextInputBuilder()
        .setCustomId('search_value')
        .setLabel('Personelin Adını Yazın')
        .setPlaceholder('Örn: Ahmet Yıldız')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    } else if (actionId === 'search_by_id') {
      searchInput = new TextInputBuilder()
        .setCustomId('search_value')
        .setLabel('Sicil Numarasını Yazın')
        .setPlaceholder('Örn: 1234567890')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    } else if (actionId === 'search_by_role') {
      // Burada modal yerine select menu gösterelim
      return showRoleSelectMenu(interaction);
    } else if (actionId === 'search_active') {
      return showActiveStaffList(interaction);
    }

    if (searchInput) {
      modal.addComponents(new ActionRowBuilder().addComponents(searchInput));
      await interaction.showModal(modal);
    }

    return true;
  } catch (err) {
    console.error('[modDashboardActionHandler] handlePersonnelSearch:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Show Active Staff List
 */
async function showActiveStaffList(interaction) {
  try {
    const allProgress = await StaffProgress.find({}).catch(() => []);
    const activeStaff = allProgress.filter(p => p.level > 0 && !p.dismissedAt && !p.resignedAt).slice(0, 24);

    if (activeStaff.length === 0) {
      return interaction.reply({
        content: '❌ Aktif personel bulunamadı.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🟢 Aktif Personel Listesi')
      .setDescription(`Toplam ${activeStaff.length} aktif personel`)
      .setColor(0x2ecc71);

    for (const p of activeStaff.slice(0, 20)) {
      embed.addFields({
        name: `${ROLE_NAMES[p.level] || 'Bilinmeyen'} - ${p.userId}`,
        value: `📊 Level: ${p.level} | 🎫 Ticket: ${p.stats?.ticketsSolved || 0} | 🗣️ Mesaj: ${p.stats?.chatMessages || 0}`,
        inline: true,
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    console.error('[modDashboardActionHandler] showActiveStaffList:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Show Role Selection Menu
 */
async function showRoleSelectMenu(interaction) {
  try {
    const options = Object.entries(ROLE_NAMES).map(([level, name]) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(name)
        .setValue(`role_${level}`)
        .setEmoji(level === '1' ? '🎓' : level === '2' ? '👔' : level === '3' ? '⭐' : level === '4' ? '👑' : level === '5' ? '👨‍✈️' : '💼')
    );

    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_staff_by_role')
        .setPlaceholder('Rol seçin...')
        .addOptions(options)
    );

    return interaction.reply({
      content: '📋 Lütfen filtrelemek istediğiniz rolü seçin:',
      components: [selectRow],
      ephemeral: true,
    });
  } catch (err) {
    console.error('[modDashboardActionHandler] showRoleSelectMenu:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Personnel Roles - Role Atama
 */
async function handlePersonnelRoles(interaction, actionId) {
  try {
    if (actionId === 'role_assign') {
      const modal = new ModalBuilder()
        .setCustomId('role_assign_modal')
        .setTitle('➕ Personele Rol Ata');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('Kullanıcı ID\'si')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('new_role_level')
            .setLabel('Yeni Rol Seviyesi (1-6)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Sebep')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        )
      );

      await interaction.showModal(modal);
    } else if (actionId === 'role_remove') {
      const modal = new ModalBuilder()
        .setCustomId('role_remove_modal')
        .setTitle('➖ Personelden Rol Kaldır');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('Kullanıcı ID\'si')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      await interaction.showModal(modal);
    }

    return true;
  } catch (err) {
    console.error('[modDashboardActionHandler] handlePersonnelRoles:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Discipline Warnings - Uyarı Sistemi
 */
async function handleDisciplineWarnings(interaction, actionId) {
  try {
    if (actionId === 'warnings_issue') {
      const modal = new ModalBuilder()
        .setCustomId('issue_warning_modal')
        .setTitle('⚠️ Resmi Uyarı Ver');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('warned_user_id')
            .setLabel('Uyarı Verilecek Kullanıcı ID\'si')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('warning_reason')
            .setLabel('Uyarı Sebebi')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('severity')
            .setLabel('Ciddiyet (1-5)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        )
      );

      await interaction.showModal(modal);
    } else if (actionId === 'warnings_history') {
      const modal = new ModalBuilder()
        .setCustomId('view_warnings_modal')
        .setTitle('📜 Uyarı Geçmişi Görüntüle');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('user_id_for_warnings')
            .setLabel('Personel Kullanıcı ID\'si')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      await interaction.showModal(modal);
    }

    return true;
  } catch (err) {
    console.error('[modDashboardActionHandler] handleDisciplineWarnings:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * HR Salary - Maaş Yönetimi
 */
async function handleHRSalary(interaction, actionId) {
  try {
    if (actionId === 'salary_calculate') {
      const modal = new ModalBuilder()
        .setCustomId('calculate_salary_modal')
        .setTitle('💰 Maaş Hesapla');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('salary_user_id')
            .setLabel('Personel Kullanıcı ID\'si')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('base_salary')
            .setLabel('Temel Maaş (TL)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      await interaction.showModal(modal);
    } else if (actionId === 'salary_view') {
      return interaction.reply({
        content: '📊 Maaş yönetimi modülü şu anda kısıtlıdır. Sistem yöneticisine başvurun.',
        ephemeral: true,
      });
    }

    return true;
  } catch (err) {
    console.error('[modDashboardActionHandler] handleHRSalary:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * System Settings - Sunucu Ayarları
 */
async function handleSystemSettings(interaction, actionId) {
  try {
    if (actionId === 'settings_general') {
      const settingsEmbed = new EmbedBuilder()
        .setTitle('🔩 Genel Sistem Ayarları')
        .setDescription('**Mevcut Ayarlar:**')
        .addFields(
          { name: '📍 Sunucu ID', value: '`1367646464804655104`', inline: true },
          { name: '👥 Aktif Personel', value: '`42`', inline: true },
          { name: '⏰ Sistem Saati (Istanbul)', value: `\`${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}\``, inline: false }
        )
        .setColor(0x9b59b6)
        .setFooter({ text: 'Sistem Yönetim Paneli' })
        .setTimestamp();

      return interaction.reply({ embeds: [settingsEmbed], ephemeral: true });
    }

    return true;
  } catch (err) {
    console.error('[modDashboardActionHandler] handleSystemSettings:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Reporting Stats - İstatistikler
 */
async function handleReportingStats(interaction, actionId) {
  try {
    const allProgress = await StaffProgress.find({}).catch(() => []);
    const activeStaff = allProgress.filter(p => p.level > 0 && !p.dismissedAt && !p.resignedAt);

    const totalTickets = activeStaff.reduce((sum, p) => sum + (p.stats?.ticketsSolved || 0), 0);
    const totalMessages = activeStaff.reduce((sum, p) => sum + (p.stats?.chatMessages || 0), 0);
    const totalVoiceMinutes = activeStaff.reduce((sum, p) => sum + (p.stats?.totalVoiceMinutes || 0), 0);

    const statsEmbed = new EmbedBuilder()
      .setTitle('📊 Sistem İstatistikleri')
      .setColor(0x1abc9c)
      .addFields(
        { name: '👥 Aktif Personel', value: `${activeStaff.length}`, inline: true },
        { name: '🎫 Toplam Çözülen Ticket', value: `${totalTickets}`, inline: true },
        { name: '💬 Toplam Mesaj', value: `${totalMessages}`, inline: true },
        { name: '🎤 Toplam Ses Saati', value: `${Math.round(totalVoiceMinutes / 60)} saat`, inline: true }
      )
      .setFooter({ text: 'Raporlama Sistemi' })
      .setTimestamp();

    return interaction.reply({ embeds: [statsEmbed], ephemeral: true });
  } catch (err) {
    console.error('[modDashboardActionHandler] handleReportingStats:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * RPG Prestige - Prestij (Rebirth)
 */
async function handleRPGPrestige(interaction, actionId) {
  try {
    if (actionId === 'rpg_prestige_rebirth') {
      const modal = new ModalBuilder()
        .setCustomId('rebirth_modal')
        .setTitle('👑 Prestij Yap (Rebirth)');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('rebirth_user_id')
            .setLabel('Personel Kullanıcı ID\'si')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('rebirth_confirmation')
            .setLabel('Onay: "EVET" yazın')
            .setPlaceholder('EVET')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      await interaction.showModal(modal);
    }

    return true;
  } catch (err) {
    console.error('[modDashboardActionHandler] handleRPGPrestige:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Real Estate - Sanal Mülk
 */
async function handleRealEstate(interaction, actionId) {
  try {
    const realEstateEmbed = new EmbedBuilder()
      .setTitle('🏙️ Sanal Emlak Mağazası')
      .setDescription('**Uygun Mülkler:**')
      .addFields(
        { name: '☕ Kahve Dükkanı', value: '💵 500 TL | 📈 Günlük +10 TL Pasif Gelir', inline: false },
        { name: '🏢 Tactic Ofis', value: '💵 2,000 TL | 📈 Günlük +50 TL Pasif Gelir', inline: false },
        { name: '🏙️ Penthouse', value: '💵 10,000 TL | 📈 Günlük +200 TL Pasif Gelir', inline: false }
      )
      .setColor(0x2ecc71)
      .setFooter({ text: 'Emlak Sistemi • Paranız: 5,000 TL' })
      .setTimestamp();

    const buyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('buy_property_coffee')
        .setLabel('☕ Kahve Dükkanı Al')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('buy_property_office')
        .setLabel('🏢 Ofis Al')
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({ embeds: [realEstateEmbed], components: [buyRow], ephemeral: true });
  } catch (err) {
    console.error('[modDashboardActionHandler] handleRealEstate:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Guild Wars - Lonca Savaşları
 */
async function handleGuildWars(interaction, actionId) {
  try {
    const guildEmbed = new EmbedBuilder()
      .setTitle('🏛️ Lonca Ligi Sıralaması')
      .setDescription('**Bu Hafta En Güçlü Loncalar:**')
      .addFields(
        { name: '🥇 1. Ak Ejderhalar', value: '📊 Seviye: 15 | 💰 Kasa: 50,000 TL | 👥 Üye: 5', inline: false },
        { name: '🥈 2. Kara Pençeler', value: '📊 Seviye: 12 | 💰 Kasa: 35,000 TL | 👥 Üye: 4', inline: false },
        { name: '🥉 3. Altın Aslanlar', value: '📊 Seviye: 10 | 💰 Kasa: 20,000 TL | 👥 Üye: 3', inline: false }
      )
      .setColor(0xf1c40f)
      .setFooter({ text: 'Lonca Sistemi' })
      .setTimestamp();

    return interaction.reply({ embeds: [guildEmbed], ephemeral: true });
  } catch (err) {
    console.error('[modDashboardActionHandler] handleGuildWars:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Main Router - Tüm İşlemlerin merkezi
 */
async function handleModDashboardAction(interaction, actionId) {
  try {
    // Personnel category
    if (actionId.startsWith('search_')) return handlePersonnelSearch(interaction, actionId);
    if (actionId.startsWith('role_')) return handlePersonnelRoles(interaction, actionId);

    // Discipline
    if (actionId.startsWith('warnings_')) return handleDisciplineWarnings(interaction, actionId);

    // HR
    if (actionId.startsWith('salary_')) return handleHRSalary(interaction, actionId);

    // System
    if (actionId.startsWith('settings_')) return handleSystemSettings(interaction, actionId);

    // Reporting
    if (actionId.startsWith('reporting_')) return handleReportingStats(interaction, actionId);

    // RPG
    if (actionId.startsWith('rpg_')) return handleRPGPrestige(interaction, actionId);

    // Real Estate
    if (actionId.startsWith('estate_') || actionId.includes('property')) return handleRealEstate(interaction, actionId);

    // Guild Wars
    if (actionId.startsWith('guild_')) return handleGuildWars(interaction, actionId);

    // Unknown action
    return interaction.reply({
      content: '❌ Bu işlem henüz uygulanmadı. Sistem yöneticisine başvurun.',
      ephemeral: true,
    });
  } catch (err) {
    console.error('[modDashboardActionHandler] handleModDashboardAction:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

module.exports = {
  handleModDashboardAction,
  handlePersonnelSearch,
  handlePersonnelRoles,
  handleDisciplineWarnings,
  handleHRSalary,
  handleSystemSettings,
  handleReportingStats,
  handleRPGPrestige,
  handleRealEstate,
  handleGuildWars,
};
