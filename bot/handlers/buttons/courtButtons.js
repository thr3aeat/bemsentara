'use strict';

const { EmbedBuilder } = require('discord.js');

async function handleCourtButton(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('court_statement_')) {
    const caseCode = customId.replace('court_statement_', '');
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

    const modal = new ModalBuilder()
      .setCustomId(`court_statement_modal_${caseCode}`)
      .setTitle('📜 Mahkeme Savunma İfadesi');

    const statementInput = new TextInputBuilder()
      .setCustomId('court_statement_text')
      .setLabel('Yeminli Savunma Beyanınız')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1500);

    modal.addComponents(new ActionRowBuilder().addComponents(statementInput));
    return interaction.showModal(modal);
  }

  if (customId.startsWith('court_kyok_')) {
    const caseCode = customId.replace('court_kyok_', '');
    const { issueKYOK } = require('../../services/courtService');
    return issueKYOK(interaction, caseCode);
  }

  return false;
}

module.exports = {
  handleCourtButton
};
