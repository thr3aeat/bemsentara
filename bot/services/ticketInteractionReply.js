'use strict';

async function deferTicketReply(interaction) {
  if (interaction.deferred || interaction.replied) return false;
  await interaction.deferReply({ ephemeral: true });
  return true;
}

async function replyToTicketInteraction(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply({ ...payload, ephemeral: payload?.ephemeral ?? true });
}

module.exports = { deferTicketReply, replyToTicketInteraction };
