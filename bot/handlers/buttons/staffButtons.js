'use strict';

const { EmbedBuilder } = require('discord.js');

async function handleStaffButton(interaction) {
  const { customId } = interaction;

  if (customId === 'staff_claim_salary') {
    const StaffProgress = require('../../../models/StaffProgress');
    const p = await StaffProgress.findOne({ userId: interaction.user.id });
    if (!p) {
      return interaction.reply({ content: '❌ Aktif bir personel kaydınız bulunamadı.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🪙 Haftalık Maaş Ödemesi')
      .setDescription(`Tebrikler <@${interaction.user.id}>! Maaşınız hesabınıza aktarıldı. Aktiflik seviyeniz: **Level ${p.level || 1}**`)
      .setColor(0x2ecc71)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  return false;
}

module.exports = {
  handleStaffButton
};
