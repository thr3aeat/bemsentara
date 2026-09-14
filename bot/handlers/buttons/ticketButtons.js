'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

async function handleTicketButton(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('ticket_create_')) {
    const category = customId.replace('ticket_create_', '');
    const modal = new ModalBuilder()
      .setCustomId(`support_modal_${category}`)
      .setTitle('📩 Destek Talebi Oluştur');

    const subjectInput = new TextInputBuilder()
      .setCustomId('support_subject')
      .setLabel('Konu başlığı')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descInput = new TextInputBuilder()
      .setCustomId('ticket_description')
      .setLabel('Sorununuzu / Talebinizi Açıklayın')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    descInput.setCustomId('support_description');
    modal.addComponents(
      new ActionRowBuilder().addComponents(subjectInput),
      new ActionRowBuilder().addComponents(descInput)
    );
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
