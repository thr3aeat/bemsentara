'use strict';

const {
  EmbedBuilder, ChannelType, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require('discord.js');
const Ticket = require('../../models/Ticket');
const { generateTicketId } = require('../../utils/ticketId');
const { GUILD2_ID, GUILD2_TICKET_CATEGORY_ID } = require('../../config');
const { ROLES } = require('./staffSystem');

const pendingUserReplyTimers = new Map();
const pendingModReplyTimers = new Map();

/**
 * Handles support category select menu interception (Directly opens Form Modal)
 */
async function handleEpostaSupportSelect(interaction, category) {
  const categoryNames = {
    kullanici_destek: "Kullanıcı Destek",
    diger_destek: "Diğer Destek"
  };
  const categoryName = categoryNames[category] || "Destek";

  const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");
  const modal = new ModalBuilder()
    .setCustomId(`ekoyildiz_eposta_form_modal_${category}`)
    .setTitle(`${categoryName} — Talep Formu`);

  const subjectInput = new TextInputBuilder()
    .setCustomId("eposta_konu")
    .setLabel("Talep Konusu (Kısa Başlık)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Örn: Rütbe sorunu / Hata bildirimi")
    .setRequired(true);

  const detailInput = new TextInputBuilder()
    .setCustomId("eposta_detay")
    .setLabel("Talep İçeriği (Detaylı Açıklama)")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Talebinizi veya sorununuzu detaylıca buraya yazın.")
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(subjectInput),
    new ActionRowBuilder().addComponents(detailInput)
  );

  return interaction.showModal(modal);
}

/**
 * Shows the form modal when clicked
 */
async function triggerEpostaFormModal(interaction, category) {
  return handleEpostaSupportSelect(interaction, category);
}

/**
 * Handles submit of the support modal (Creates ONE single channel for User + Staff)
 */
async function handleEpostaModalSubmit(interaction, category) {
  const subject = interaction.fields.getTextInputValue("eposta_konu").trim();
  const description = interaction.fields.getTextInputValue("eposta_detay").trim();

  // Check if user is ticket-banned
  const User = require('../../models/User');
  const userRecord = await User.findOne({ discordId: interaction.user.id });
  if (userRecord?.ticketBanned) {
    return interaction.reply({
      content: "🚫 **Ticket Yasaklısınız.**\nSpam/kötüye kullanım raporunuz yetkililerce onaylandığı için ticket sistemi erişiminiz engellendi. Bu konuda itirazınız varsa sunucu yöneticisiyle iletişime geçin.",
      ephemeral: true
    });
  }

  const ticketId = generateTicketId();

  try {
    const targetGuild = await interaction.client.guilds.fetch(GUILD2_ID);
    if (!targetGuild) throw new Error("Eko Yıldız sunucusu bulunamadı.");

    // Single Channel Overwrites: User + Staff Roles
    const permissionOverwrites = [
      { id: targetGuild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      }
    ];

    for (const roleId of Object.values(ROLES)) {
      if (roleId && targetGuild.roles.cache.has(roleId)) {
        permissionOverwrites.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        });
      }
    }

    const ticketChannel = await targetGuild.channels.create({
      name: `ticket-${ticketId.toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: GUILD2_TICKET_CATEGORY_ID || undefined,
      permissionOverwrites,
    });

    // Save ticket in DB
    const ticket = new Ticket({
      ticketId,
      userId: interaction.user.id,
      userName: interaction.user.username,
      category,
      subject,
      description,
      channelId: ticketChannel.id,
      userChannelId: null,
      status: 'open',
      guildId: GUILD2_ID,
      source: 'eposta',
    });
    await ticket.save();

    await interaction.reply({
      content: `📬 **Talebiniz başarıyla oluşturuldu!** Sizin için ${ticketChannel.toString()} kanalı açıldı.`,
      ephemeral: true
    });

    // Welcome Embed in the Single Ticket Channel
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎫 Destek Talebi — ${ticketId}`)
      .setDescription(
        `Merhaba <@${interaction.user.id}>,\n` +
        `Destek talebiniz oluşturulmuştur. Yetkililerimiz en kısa sürede sizinle iletişime geçecektir.\n\n` +
        `🔹 **Konu:** ${subject}\n` +
        `🔹 **Açıklama:** ${description}\n\n` +
        `💬 *Sorununuzu buraya detaylıca yazabilir ve yetkili arkadaşımızla doğrudan bu kanalda görüşebilirsiniz.*`
      )
      .setColor(0x3498DB)
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`close_ticket_${ticketId}`)
        .setLabel("❌ Talebi Kapat")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`claim_ticket_${ticketId}`)
        .setLabel("🙋‍♂️ Üstlen")
        .setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_notify_user_${ticketId}`)
        .setLabel("🔔 DM Bildirimi Gönder")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_ai_dispute_${ticketId}`)
        .setLabel("🚨 Tickette Kavga Var!")
        .setStyle(ButtonStyle.Secondary)
    );

    await ticketChannel.send({
      content: `Merhaba <@${interaction.user.id}>, hoş geldiniz!`,
      embeds: [welcomeEmbed],
      components: [row1, row2]
    });

    // AI Smart Auto-Resolver check
    try {
      const { processTicketMessageForAutoResolution } = require('./ticketAIAutoResolver');
      await processTicketMessageForAutoResolution(ticket, { content: `${subject} ${description}`, author: { bot: false } }, interaction.client);
    } catch (_) {}

  } catch (err) {
    console.error("[epostaTicketService] Support setup failed:", err.message);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: `❌ Ticket oluşturulamadı: ${err.message}`, ephemeral: true }).catch(() => {});
    }
  }
}

/**
 * Single Channel: Forwarding is not needed because user and staff speak directly in the channel
 */
async function forwardUserToModChannel(message, client) {
  return false;
}

async function forwardModToUserChannel(message, client) {
  return false;
}

/**
 * Archives a single-channel ticket
 */
async function archiveEkoYildizTicket(ticket, interaction, reason) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
  const guild = await interaction.client.guilds.fetch(ticket.guildId).catch(() => null);
  if (!guild) return;

  const archiveCategoryId = "1525218080068730991";

  // Lock single ticket channel
  const channel = await guild.channels.fetch(ticket.channelId).catch(() => null);
  if (channel) {
    await channel.setParent(archiveCategoryId, { lockPermissions: false }).catch(() => {});
    await channel.permissionOverwrites.set([
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: ticket.userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
    ]).catch(() => {});

    const closedEmbed = new EmbedBuilder()
      .setTitle("🔒 Destek Talebi Kapatıldı")
      .setDescription(
        `**Kapatan:** ${interaction.user.username}\n` +
        `**Sebep:** ${reason || 'Belirtilmedi'}\n\n` +
        `Talebi yeniden açmak için aşağıdaki butonu kullanabilirsiniz.`
      )
      .setColor(0x7f8c8d)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`reopen_ticket_${ticket.ticketId}`)
        .setLabel("🔓 Yeniden Aç")
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [closedEmbed], components: [row] }).catch(() => {});
  }

  // Update DB status
  ticket.status = 'closed';
  ticket.closedAt = new Date();
  ticket.closedBy = interaction.user.id;
  ticket.closedByName = interaction.user.username;
  ticket.closeReason = reason || 'Belirtilmedi';
  await ticket.save();

  // Send DM rating / close notification to user
  try {
    const ticketOwner = await interaction.client.users.fetch(ticket.userId).catch(() => null);
    if (ticketOwner) {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("🔒 Ticket'ınız Kapatıldı")
        .setDescription(
          `Destek talebiniz **${interaction.user.username}** tarafından kapatıldı.\n\n` +
          `**Sebep:** ${reason || 'Belirtilmedi'}\n\n` +
          `Destek talebini değerlendirmek için aşağıdaki butonları kullanabilirsiniz.`
        )
        .addFields(
          { name: "🎫 Ticket ID", value: `\`${ticket.ticketId}\``, inline: true },
          { name: "📋 Konu", value: ticket.subject || 'Belirtilmedi', inline: true }
        )
        .setFooter({ text: "Eko Yıldız Destek Sistemi" })
        .setTimestamp();

      const { buildReopenAndRateRow } = require("../embeds");
      const dmButtons = buildReopenAndRateRow(ticket.ticketId);
      await ticketOwner.send({ embeds: [dmEmbed], components: [dmButtons] }).catch(() => {});
    }
  } catch (dmErr) {
    console.warn("[archiveEkoYildizTicket] DM gönderilemedi:", dmErr.message);
  }
}

/**
 * Reopens a closed single-channel ticket
 */
async function reopenEkoYildizTicket(ticket, interaction) {
  const { PermissionFlagsBits } = require("discord.js");
  const guild = await interaction.client.guilds.fetch(ticket.guildId).catch(() => null);
  if (!guild) return;

  const ticketCategoryId = "1518716275239551046";

  const channel = await guild.channels.fetch(ticket.channelId).catch(() => null);
  if (channel) {
    await channel.setParent(ticketCategoryId, { lockPermissions: false }).catch(() => {});
    await channel.permissionOverwrites.edit(ticket.userId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    }).catch(() => {});

    await channel.send(`🔄 **Ticket Yeniden Açıldı.** (Açan: ${interaction.user.username})`);
  }

  ticket.status = 'open';
  ticket.closedAt = null;
  ticket.closeReason = null;
  await ticket.save();
}

module.exports = {
  handleEpostaSupportSelect,
  triggerEpostaFormModal,
  handleEpostaModalSubmit,
  forwardUserToModChannel,
  forwardModToUserChannel,
  archiveEkoYildizTicket,
  reopenEkoYildizTicket,
  pendingUserReplyTimers,
  pendingModReplyTimers,
};

