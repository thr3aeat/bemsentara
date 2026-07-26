'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

async function handleTicketButton(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('ticket_create_')) {
    const category = customId.replace('ticket_create_', '');
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_submit_${category}`)
      .setTitle('📩 Destek Talebi Oluştur');

    const descInput = new TextInputBuilder()
      .setCustomId('ticket_description')
      .setLabel('Sorununuzu / Talebinizi Açıklayın')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(descInput));
    return interaction.showModal(modal);
  }

  if (customId === 'ticket_close') {
    const embed = new EmbedBuilder()
      .setTitle('🔒 Ticket Kapatılıyor')
      .setDescription('Bu destek talebi yetkili tarafından sonlandırıldı.')
      .setColor(0xe74c3c)
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }

  return false;
}

module.exports = {
  handleTicketButton
};
