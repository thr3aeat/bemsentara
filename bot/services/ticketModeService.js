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
  const guild = interaction.guild;
  const user = interaction.user;

  try {
    // 1. Kategori bul (ya da oluştur)
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

    // 2. Eposta Kanalı (USER-ONLY): user + selected staff member
    const epostaChannel = await guild.channels.create({
      name: `eposta-${user.username.toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: category,
      topic: `📧 Destek Talebi: ${ticketId} (Tek Taraflı)`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
      ],
    });

    // 3. Ticket Kanalı (STAFF-ONLY): yetkili ekibi
    const ticketChannel = await guild.channels.create({
      name: `ticket-${ticketId}`,
      type: ChannelType.GuildText,
      parent: category,
      topic: `🎫 Destek Talebi: ${ticketId} (Yetkili Paneli) — ${user.tag}`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: user.id,
          deny: ['ViewChannel'],
        },
      ],
    });

    // Moderatör/Staff rolleri ekip ekle
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
      }).catch(() => {});
    }

    // 4. Embed gönder (eposta kanalına)
    const epostaEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`📧 Destek Talebi Açıldı — ${ticketId}`)
      .setDescription(`Merhaba ${user.toString()}!\n\nDestek talebiniz başarıyla açılmıştır. Lütfen sorununuzu ayrıntılı bir şekilde yazınız.`)
      .addFields(
        { name: '🎫 Talep No', value: ticketId, inline: true },
        { name: '📅 Açılış Tarihi', value: new Date().toLocaleString('tr-TR'), inline: true },
        { name: '📝 Açıklama', value: ticket.description || 'Belirtilmedi', inline: false },
      )
      .setFooter({ text: 'Teknik Destek • Ekoyıldız' })
      .setTimestamp();

    await epostaChannel.send({
      content: `${user.toString()} Hoş geldiniz!`,
      embeds: [epostaEmbed],
    });

    // 5. Embed gönder (yetkili kanalına)
    const ticketEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`🎫 Yeni Destek Talebi — ${ticketId}`)
      .setDescription(`**${user.tag}** tarafından yeni bir destek talebi açılmıştır.`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${user.toString()} (\`${user.id}\`)`, inline: true },
        { name: '🎫 Talep No', value: ticketId, inline: true },
        { name: '📝 Talep İçeriği', value: ticket.description || 'Belirtilmedi', inline: false },
        { name: '📧 Eposta Kanalı', value: epostaChannel.toString(), inline: true },
        { name: '⏱️ Durum', value: '🟢 Açık', inline: true },
      )
      .setFooter({ text: 'Destek Yönetim Paneli • Ekoyıldız' })
      .setTimestamp();

    const acceptButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_accept_${ticketId}`)
        .setLabel('✅ Talep Al')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${ticketId}`)
        .setLabel('❌ Kapat')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      embeds: [ticketEmbed],
      components: [acceptButton],
    });

    // 6. DB'ye kaydet
    ticket.channelId = epostaChannel.id;
    ticket.modChannelId = ticketChannel.id;
    ticket.mode = 'single';
    ticket.status = 'open';
    await ticket.save();

    return { success: true, epostaChannel, ticketChannel };
  } catch (err) {
    console.error('[ticketModeService] Single mode error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * ÇİFT TARAFLI: Tek kanal (herkes aynı yerde)
 */
async function createDualModeTicket(interaction, ticketId, ticket) {
  const guild = interaction.guild;
  const user = interaction.user;

  try {
    // 1. Kategori bul/oluştur
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

    // 2. Tek kanal (user + staff görebilir)
    const ticketChannel = await guild.channels.create({
      name: `ticket-${ticketId}`,
      type: ChannelType.GuildText,
      parent: category,
      topic: `🎫 Destek Talebi: ${ticketId} (Çift Taraflı) — ${user.tag}`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
      ],
    });

    // Staff rolleri ekle
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
      }).catch(() => {});
    }

    // 3. Embed gönder
    const ticketEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`🎫 Destek Talebi — ${ticketId}`)
      .setDescription(`${user.toString()} tarafından açılan destek talebiniz başarıyla oluşturulmuştur.`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${user.toString()} (\`${user.id}\`)`, inline: true },
        { name: '🎫 Talep No', value: ticketId, inline: true },
        { name: '📝 Talep İçeriği', value: ticket.description || 'Belirtilmedi', inline: false },
        { name: '⏱️ Durum', value: '🟢 Açık (Çift Taraflı)', inline: true },
      )
      .setFooter({ text: 'Destek Sistemi • Ekoyıldız' })
      .setTimestamp();

    const closeButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_close_dual_${ticketId}`)
        .setLabel('❌ Talebi Kapat')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `${user.toString()} Hoş geldiniz!`,
      embeds: [ticketEmbed],
      components: [closeButton],
    });

    // 4. DB'ye kaydet
    ticket.channelId = ticketChannel.id;
    ticket.mode = 'dual';
    ticket.status = 'open';
    await ticket.save();

    return { success: true, ticketChannel };
  } catch (err) {
    console.error('[ticketModeService] Dual mode error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getTicketModeSelectionEmbed,
  getTicketModeButtons,
  createSingleModeTicket,
  createDualModeTicket,
};
