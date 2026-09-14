'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { resolveTicketGuide } = require('./ticketGuideResolver');

function buildTicketUserPanel(ticket) {
  const guide = resolveTicketGuide(ticket?.category);
  const id = ticket?.ticketId || 'BILINMIYOR';
  const userId = ticket?.userId || '0';
  const createdAt = ticket?.createdAt ? new Date(ticket.createdAt) : new Date();
  const timestamp = Math.floor(createdAt.getTime() / 1000);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('EkoYıldız Destek Merkezi')
    .setDescription(`Merhaba <@${userId}>, destek talebiniz başarıyla oluşturuldu.\n\nBir ekip üyesi mümkün olan en kısa sürede sizinle ilgilenecektir. Sürecin daha hızlı ilerlemesi için yaşadığınız problemi mümkün olduğunca detaylı anlatabilirsiniz.`)
    .addFields(
      { name: 'Ticket ID', value: `\`${id}\``, inline: true },
      { name: 'Durum', value: '🟡 Yetkili bekleniyor', inline: true },
      { name: 'Açılış', value: `<t:${timestamp}:R>`, inline: true }
    )
    .setFooter({ text: 'EkoYıldız Support · Güvenli destek için kod ve şifre paylaşmayın.' })
    .setTimestamp(createdAt);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_user_close_${id}`).setLabel('Ticketi Kapat').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ticket_staff_call_${id}`).setLabel('Personel Çağır').setEmoji('🔔').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setURL(guide.url).setLabel('Safety Center').setEmoji('🛡️').setStyle(ButtonStyle.Link),
    new ButtonBuilder().setURL(guide.url).setLabel('İlgili Doküman').setEmoji('📚').setStyle(ButtonStyle.Link),
    new ButtonBuilder().setCustomId(`ticket_user_info_${id}`).setLabel('Ticket Bilgileri').setEmoji('ℹ️').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

function buildTicketStaffPanel(ticket) {
  const { buildTicketEmbed, getTicketModActionRows } = require('../embeds');
  return { embeds: [buildTicketEmbed(ticket)], components: getTicketModActionRows(ticket.ticketId) };
}

module.exports = { buildTicketUserPanel, buildTicketStaffPanel };
