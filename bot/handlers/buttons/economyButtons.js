'use strict';

const { EmbedBuilder } = require('discord.js');

async function handleEconomyButton(interaction) {
  const { customId } = interaction;

  if (customId === 'eco_daily_reward') {
    const Economy = require('../../../models/Economy');
    let eco = await Economy.findOne({ userId: interaction.user.id });
    if (!eco) {
      eco = new Economy({ userId: interaction.user.id, balance: 0 });
    }

    const reward = 50;
    eco.balance = (eco.balance || 0) + reward;
    await eco.save();

    const embed = new EmbedBuilder()
      .setTitle('🎁 Günlük Ödül Alındı!')
      .setDescription(`Hesabınıza **+${reward} EkoCoin** eklendi! Güncel Bakiye: **${eco.balance} EkoCoin**`)
      .setColor(0xf1c40f)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  return false;
}

module.exports = {
  handleEconomyButton
};
