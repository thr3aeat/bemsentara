'use strict';

const rpgService = require('../../services/rpgService');
const realEstateService = require('../../services/realEstateService');

/**
 * Handle RPG, Sanal Sehir & Guild Button Interactions
 */
async function handleRpgButton(interaction) {
  const { customId, user } = interaction;
  const staffSystem = require('../../services/staffSystem');

  if (customId === 'v7_claim_version_reward') {
    const res = await staffSystem.claimV7VersionReward(user.id);
    if (!res.success) {
      return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
    }
    return interaction.reply({ content: res.message, ephemeral: true });
  }

  if (customId === 'v7_nav_rpg') {
    const data = staffSystem.getSubcategoryEmbed('rpg_prestige');
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rpg_prestige_rebirth').setLabel('👑 Prestij Yap').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('rpg_classes_select').setLabel('🎭 Sınıf Seç').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('rpg_p2p_tip').setLabel('💖 Takdir Gönder').setStyle(ButtonStyle.Secondary)
    );
    return interaction.reply({ embeds: [data.embed], components: [row], ephemeral: true });
  }

  if (customId === 'v7_nav_city') {
    const data = staffSystem.getSubcategoryEmbed('real_estate');
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('buy_prop_coffee_shop').setLabel('☕ Kahve Dükkanı (300 EC)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('buy_prop_penthouse').setLabel('🏙️ Penthouse (2000 EC)').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('invest_stock_100').setLabel('📈 Borsaya 100 EC Yatır').setStyle(ButtonStyle.Secondary)
    );
    return interaction.reply({ embeds: [data.embed], components: [row], ephemeral: true });
  }

  if (customId === 'v7_nav_guild') {
    const data = staffSystem.getSubcategoryEmbed('guild_wars');
    return interaction.reply({ embeds: [data.embed], ephemeral: true });
  }

  if (customId.startsWith('rpg_select_')) {
    const classType = customId.replace('rpg_select_', '');
    const res = await rpgService.setUserClass(user.id, classType);
    if (!res.success) return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
    return interaction.reply({ content: `✅ Karakter sınıfınız **${res.className}** olarak başarıyla güncellendi!`, ephemeral: true });
  }

  if (customId.startsWith('buy_prop_')) {
    const propId = customId.replace('buy_prop_', '');
    const res = await realEstateService.buyProperty(user.id, propId);
    if (!res.success) return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
    return interaction.reply({ content: `🎉 Tebrikler! **${res.propertyName}** mülkünü aldınız! Güncel Bakiye: \`${res.newBalance} E.C.\``, ephemeral: true });
  }

  if (customId.startsWith('invest_stock_')) {
    const amount = parseInt(customId.replace('invest_stock_', ''), 10);
    const res = await realEstateService.investInStock(user.id, amount);
    if (!res.success) return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });

    if (res.isWin) {
      return interaction.reply({
        content: `📈 **BORSA KÂRI!** $EKO Piyasası (${res.marketTrend}) yükseldi! +${res.netChange} E.C. kazandınız! Güncel Bakiye: \`${res.newBalance} E.C.\``,
        ephemeral: true
      });
    } else {
      return interaction.reply({
        content: `📉 **BORSA ZARARI!** $EKO Piyasası (${res.marketTrend}) düştü. ${res.netChange} E.C. kaybettiniz. Güncel Bakiye: \`${res.newBalance} E.C.\``,
        ephemeral: true
      });
    }
  }

  if (customId.startsWith('jury_vote_')) {
    // jury_vote_pardon_CASEID or jury_vote_approve_CASEID
    const parts = customId.split('_');
    const option = parts[2]; // pardon or approve
    const caseId = parts[3];
    const res = await rpgService.voteJuryCase(user.id, caseId, option, interaction.client);
    if (!res.success) return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
    return interaction.reply({ content: `⚖️ Oyunuz başarıyla kaydedildi! Jüri görevi için +25 E.C. ve +10 Elmas kazandınız.`, ephemeral: true });
  }

  return false;
}

module.exports = {
  handleRpgButton
};
