'use strict';

/**
 * Destek Talebi Modu Seçim Sistemi
 * 
 * TEK TARAFLI: Eposta kanalı (user-only) + Ticket kanalı (staff-only)
 * ÇİFT TARAFLI: Tek kanal (herkes aynı yerde görüşüyor)
 */

const { 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
} = require('discord.js');

const Ticket = require('../../models/Ticket');

/**
 * Destek talebi açılırken mod seçim embed'i göster
 */
function getTicketModeSelectionEmbed() {
  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('📋 Destek Talebi Modu Seç')
    .setDescription(
      '**Destek talebiniz için hangi mod kullanmak istiyorsunuz?**\n\n' +
      '**1️⃣ TEK TARAFLI (Önerilir)**\n' +
      '• Kişisel eposta kanalı (sadece siz ve yetkili görecek)\n' +
      '• Ayrı yetkili channel (arka taraflı işlemler)\n' +
      '• Daha özel ve güvenli konuşma\n\n' +
      '**2️⃣ ÇİFT TARAFLI**\n' +
      '• Tek kanal (siz, yetkili, ve herkese açık)\n' +
      '• Daha hızlı çözüm\n' +
      '• Sonraki kullanıcılar da görebilir (referans)\n\n' +
      '👇 Aşağıdan seçin:'
    )
    .setFooter({ text: 'Destek Talebi Sistemi • Ekoyıldız' })
    .setTimestamp();

  return embed;
}

/**
 * Mod seçim butonları
 */
function getTicketModeButtons(ticketId) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_mode_single_${ticketId}`)
      .setLabel('1️⃣ Tek Tarafı (Eposta+Ticket)')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📧'),
    new ButtonBuilder()
      .setCustomId(`ticket_mode_dual_${ticketId}`)
      .setLabel('2️⃣ Çift Tarafı (Tek Kanal)')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('💬')
  );

  return row;
}

/**
 * TEK TARAFLI: Eposta + Ticket kanallarını oluştur
 */
async function createSingleModeTicket(interaction, ticketId, ticket) {
  return createDualModeTicket(interaction, ticketId, ticket);
}

async function createDualModeTicket(interaction, ticketId, ticket) {
  try {
    let guild = interaction.guild;
    if (!guild && interaction.client) {
      guild = await interaction.client.guilds.fetch(ticket.guildId).catch(() => null);
    }
    
    if (!guild) {
      throw new Error('Sunucu bulunamadı');
    }

    const user = interaction.user;
    let category = guild.channels.cache.find(c => 
      c.type === ChannelType.GuildCategory && 
      c.name.toLowerCase().includes('destek')
    );

    if (!category) {
      category = await guild.channels.create({
        name: '📋 Destek Talepleri',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: ['ViewChannel'],
          },
        ],
      });
    }

    const ticketChannel = await guild.channels.create({
      name: `ticket-${ticketId.toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: category,
      topic: `🎫 Destek Talebi: ${ticketId} — ${user.tag}`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles', 'EmbedLinks'],
        },
      ],
    });

    const staffRoles = guild.roles.cache.filter(r => 
      r.name.toLowerCase().includes('staff') ||
      r.name.toLowerCase().includes('mod') ||
      r.name.toLowerCase().includes('yetkili')
    );

    for (const role of staffRoles.values()) {
      await ticketChannel.permissionOverwrites.create(role, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true,
      }).catch(() => {});
    }

    const ticketEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`🎫 Destek Talebi — ${ticketId}`)
      .setDescription(`Merhaba ${user.toString()},\n\nDestek talebiniz başarıyla oluşturulmuştur. Yetkililerimiz en kısa sürede sizinle ilgilenecektir.`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${user.toString()} (\`${user.id}\`)`, inline: true },
        { name: '🎫 Talep No', value: ticketId, inline: true },
        { name: '📝 Talep İçeriği', value: ticket.description || 'Belirtilmedi', inline: false },
        { name: '⏱️ Durum', value: '🟢 Açık', inline: true },
      )
      .setFooter({ text: 'Destek Sistemi • Ekoyıldız' })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`close_ticket_${ticketId}`)
        .setLabel('❌ Talebi Kapat')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`claim_ticket_${ticketId}`)
        .setLabel('🙋‍♂️ Üstlen')
        .setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_notify_user_${ticketId}`)
        .setLabel('🔔 DM Bildirimi Gönder')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_ai_dispute_${ticketId}`)
        .setLabel('🚨 Tickette Kavga Var!')
        .setStyle(ButtonStyle.Secondary)
    );

    await ticketChannel.send({
      content: `${user.toString()} Hoş geldiniz!`,
      embeds: [ticketEmbed],
      components: [row1, row2],
    });

    ticket.channelId = ticketChannel.id;
    ticket.userChannelId = null;
    ticket.mode = 'dual';
    ticket.status = 'open';
    await ticket.save();

    return { success: true, ticketChannel, epostaChannel: ticketChannel };
  } catch (err) {
    console.error('[ticketModeService] Ticket creation error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getTicketModeSelectionEmbed,
  getTicketModeButtons,
  createSingleModeTicket,
  createDualModeTicket,
};
