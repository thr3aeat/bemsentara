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
    const {
      getPrestigeEmbed,
    } = require('../services/rpgFeaturesService');

    if (actionId === 'rpg_prestige_rebirth') {
      const progress = await StaffProgress.findOne({ userId: interaction.user.id });
      const embed = getPrestigeEmbed(progress);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (actionId === 'rpg_prestige_do') {
      // Perform prestige action
      return interaction.reply({
        content: '👑 Prestij işlemi henüz tam olarak uygulanmadı. Sistem yöneticisine başvurun.',
        ephemeral: true,
      });
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
    const {
      getRealEstateEmbed,
    } = require('../services/rpgFeaturesService');

    const embed = getRealEstateEmbed();

    const buyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('buy_property_coffee')
        .setLabel('☕ Kahve Dükkanı Al')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('buy_property_office')
        .setLabel('🏢 Ofis Al')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('buy_property_penthouse')
        .setLabel('🏙️ Penthouse Al')
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({ embeds: [embed], components: [buyRow], ephemeral: true });
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
    const {
      getGuildWarsEmbed,
    } = require('../services/rpgFeaturesService');

    const embed = getGuildWarsEmbed();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    console.error('[modDashboardActionHandler] handleGuildWars:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Character Classes - Karakter Sınıfları
 */
async function handleCharacterClasses(interaction, actionId) {
  try {
    const {
      getCharacterClassEmbed,
    } = require('../services/rpgFeaturesService');
    const progress = await StaffProgress.findOne({ userId: interaction.user.id });

    const embed = getCharacterClassEmbed(progress);

    const classRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('select_class_guard')
        .setLabel('🛡️ Muhafız')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('select_class_guide')
        .setLabel('📖 Rehber')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('select_class_solver')
        .setLabel('🎫 Çözücü')
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [classRow], ephemeral: true });
  } catch (err) {
    console.error('[modDashboardActionHandler] handleCharacterClasses:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Stock Market - Borsa
 */
async function handleStockMarket(interaction, actionId) {
  try {
    const {
      getStockMarketEmbed,
    } = require('../services/rpgFeaturesService');

    const embed = getStockMarketEmbed();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    console.error('[modDashboardActionHandler] handleStockMarket:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * AI Court - Mahkemesi
 */
async function handleAICourt(interaction, actionId) {
  try {
    const {
      getAICourtEmbed,
    } = require('../services/rpgFeaturesService');

    const embed = getAICourtEmbed();

    const courtRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('court_jury_duty')
        .setLabel('⚖️ Jüri Görevlerine Bak')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('court_my_votes')
        .setLabel('📊 Oylarım')
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [courtRow], ephemeral: true });
  } catch (err) {
    console.error('[modDashboardActionHandler] handleAICourt:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Appreciation & Tip - Takdir
 */
async function handleAppreciation(interaction, actionId) {
  try {
    const {
      getAppreciationEmbed,
    } = require('../services/rpgFeaturesService');

    const embed = getAppreciationEmbed();

    const tipRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('send_tip_diamond')
        .setLabel('💎 Elmas Gönder')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('send_tip_coins')
        .setLabel('💰 EkoCoin Gönder')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('send_tip_card')
        .setLabel('🎖️ Takdir Kartı Gönder')
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [tipRow], ephemeral: true });
  } catch (err) {
    console.error('[modDashboardActionHandler] handleAppreciation:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Main Router - Tüm İşlemlerin merkezi
 */
async function handleModDashboardAction(interaction, actionId) {
  try {
    // V7.0 Features
    if (actionId.startsWith('rpg_prestige')) return handleRPGPrestige(interaction, actionId);
    if (actionId.startsWith('rpg_classes') || actionId === 'rpg_prestige_classes') return handleCharacterClasses(interaction, actionId);
    if (actionId.startsWith('rpg_guild') || actionId === 'guild_') return handleGuildWars(interaction, actionId);
    if (actionId.startsWith('rpg_court') || actionId === 'court_') return handleAICourt(interaction, actionId);
    if (actionId.startsWith('rpg_appreciation') || actionId === 'appreciation_') return handleAppreciation(interaction, actionId);
    if (actionId.startsWith('rpg_stock') || actionId === 'stock_') return handleStockMarket(interaction, actionId);

    // V7.0 Version Reward
    if (actionId === 'claim_v7_reward') {
      const { claimV7VersionReward } = require('../services/rpgFeaturesService');
      const result = await claimV7VersionReward(interaction.user.id, interaction.client);
      return interaction.reply({
        content: result.success ? `🎉 ${result.message}` : `❌ ${result.message}`,
        ephemeral: true,
      });
    }

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

    // Real Estate
    if (actionId.startsWith('estate_') || actionId.includes('property')) return handleRealEstate(interaction, actionId);

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
  handleCharacterClasses,
  handleStockMarket,
  handleAICourt,
  handleAppreciation,
  handleRealEstate,
  handleGuildWars,
};
