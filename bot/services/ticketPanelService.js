'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
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
    .setDescription(
      `Merhaba <@${userId}>, destek talebiniz başarıyla oluşturuldu.\n\n` +
      `Bir ekip üyesi mümkün olan en kısa sürede sizinle ilgilenecektir. Sürecin daha hızlı ilerlemesi için yaşadığınız problemi mümkün olduğunca detaylı anlatabilirsiniz.\n\n` +
      `ℹ️ [Yetkili Günlüğü & Ticket Açarken Bilinmesi Gerekenler](https://ekoyildiz.com/blog/gece-3te-acilan-efsanevi-ticketlar)`
    )
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
    new ButtonBuilder().setCustomId(`ticket_owner_info_${id}`).setLabel('Ticket Bilgileri').setEmoji('ℹ️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setURL(guide.url).setLabel('Yardım Dokümanı').setEmoji('🛡️').setStyle(ButtonStyle.Link)
  );

  return { embeds: [embed], components: [row] };
}

function buildTicketPanel(ticket) {
  const { buildTicketV2 } = require('../embeds');
  return buildTicketV2(ticket);
}

function buildTicketStaffPanel(ticket) {
  return buildTicketPanel(ticket);
}

function buildTicketFallbackPanel(ticket) {
  const { buildTicketEmbed, getTicketModActionRows } = require('../embeds');
  const userPanel = buildTicketUserPanel(ticket);
  const embed = buildTicketEmbed(ticket).addFields(
    { name: '👤 Kullanıcı İşlemleri', value: 'İlk buton satırı talep sahibine aittir.', inline: false },
    { name: '🛡️ Yetkili İşlemleri', value: 'Alttaki buton satırları yalnızca yetkili ekip içindir.', inline: false },
  );
  return {
    embeds: [embed],
    components: [...userPanel.components, ...getTicketModActionRows(ticket.ticketId, ticket.claimedByName)],
  };
}

function buildTicketPanelForMessage(ticket, message) {
  const flags = message?.flags;
  const isComponentsV2 = Boolean(flags?.has?.(MessageFlags.IsComponentsV2)) ||
    (typeof flags === 'number' && (flags & MessageFlags.IsComponentsV2) !== 0) ||
    (typeof flags?.bitfield === 'number' && (flags.bitfield & MessageFlags.IsComponentsV2) !== 0);
  return isComponentsV2 ? buildTicketPanel(ticket) : buildTicketFallbackPanel(ticket);
}

const buildTicketStaffFallbackPanel = buildTicketFallbackPanel;

module.exports = {
  buildTicketPanel,
  buildTicketFallbackPanel,
  buildTicketPanelForMessage,
  buildTicketUserPanel,
  buildTicketStaffPanel,
  buildTicketStaffFallbackPanel,
};
