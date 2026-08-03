'use strict';

/**
 * Mutation (Mute/Deafen/Kick) İtiraz Sistemi
 * 
 * - Kullanıcı susturulunca/sağırlaştırılınca/atılınca → DM ile haber ver
 * - DM'de İTİRAZ ET butonu olsun
 * - İtiraz butonu tıklanınca → Yapan kişiye DM git
 * - Yapan kişi kabul ederse → Mute kaldırılsın, kullanıcıya "Reddedildi" DM gitmez
 * - Yapan kişi reddeterse → Kullanıcıya "İtirazınız reddedildi" mesajı git
 * - Destek Talebi Aç butonu → Tek taraflı/çift taraflı seçimi
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

const APPEAL_TIMEOUT = 3600000; // 1 saat (appeal butonunun geçerliliği)

/**
 * Kullanıcıya mutation (mute/deafen/kick) DM'i gönder
 */
async function sendMutationAppealDM(user, guild, actionType, moderatorTag, reason) {
  try {
    const actionLabels = {
      mute: '🔇 Susturuldunuz',
      deafen: '🔕 Sağırlaştırıldınız',
      kick: '👢 Atıldınız',
    };

    const actionEmojis = {
      mute: '🔇',
      deafen: '🔕',
      kick: '👢',
    };

    const actionColors = {
      mute: 0xff9500,
      deafen: 0xff6b6b,
      kick: 0xff4444,
    };

    const embed = new EmbedBuilder()
      .setColor(actionColors[actionType] || 0xff4444)
      .setTitle(`${actionLabels[actionType] || '⚠️ İşlem Yapıldı'}`)
      .setDescription(
        `**${guild.name}** sunucusunda bir moderatör tarafından **${
          actionType === 'mute' ? 'susturuldunuz' :
          actionType === 'deafen' ? 'sağırlaştırıldınız' :
          'atıldınız'
        }'.\n\n` +
        `**Moderatör:** ${moderatorTag}\n` +
        `**Sebep:** ${reason || 'Belirtilmedi'}\n\n` +
        `Bu işleme itiraz etmek istiyorsanız aşağıdaki butona basın. Moderatör kabul ederse işlem geri alınacak.`
      )
      .setFooter({ text: 'Moderatör İtiraz Sistemi • Ekoyıldız' })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mutation_appeal_${guild.id}_${actionType}_${Date.now()}`)
        .setLabel('📝 İtiraz Et')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('📝')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`create_support_ticket_from_mutation_${guild.id}`)
        .setLabel('📋 Destek Talebi Aç')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📋')
    );

    await user.send({ embeds: [embed], components: [row1, row2] });
    console.log(`[mutationAppeal] ${actionType} DM gönderildi: ${user.tag} (moderator: ${moderatorTag})`);
    return true;
  } catch (err) {
    console.log(`[mutationAppeal] DM gönderilemedi (${user.tag}): ${err.message}`);
    return false;
  }
}

/**
 * İtiraz butonuna tıklanınca → Moderatöre DM git
 */
async function handleMutationAppealButton(interaction, client) {
  const customId = interaction.customId;
  if (!customId.startsWith('mutation_appeal_')) return false;

  // mutation_appeal_{guildId}_{actionType}_{timestamp}
  const parts = customId.replace('mutation_appeal_', '').split('_');
  const guildId = parts[0];
  const actionType = parts[1];
  const timestamp = parts[2];

  // Timeout kontrolü
  if (Date.now() - parseInt(timestamp, 10) > APPEAL_TIMEOUT) {
    return interaction.reply({
      content: '❌ Bu itiraz butonu geçerliliğini yitirmiştir (1 saat). Yeni bir itiraz başlatmak için moderatöre başvurun.',
      ephemeral: true,
    });
  }

  const Mutation = require('../models/Mutation');
  const mutation = await Mutation.findOne({
    guildId,
    targetUserId: interaction.user.id,
    actionType,
    resolvedAt: null,
  }).sort({ createdAt: -1 });

  if (!mutation) {
    return interaction.reply({
      content: '❌ Bu itiraz için ilgili işlem kaydı bulunamadı.',
      ephemeral: true,
    });
  }

  // İtiraz modal'ı aç
  const modal = new ModalBuilder()
    .setCustomId(`mutation_appeal_modal_${mutation._id}`)
    .setTitle('📝 İtiraz Nedeni');

  const reasonInput = new TextInputBuilder()
    .setCustomId('appeal_reason')
    .setLabel('Neden itiraz ediyorsunuz?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Kararın haksız olduğunu düşünüyorsanız nedenini yazın...')
    .setRequired(true)
    .setMaxLength(500);

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

  await interaction.showModal(modal);
  return true;
}

/**
 * İtiraz modal'ı gönderildiğinde
 */
async function handleMutationAppealModalSubmit(interaction, client) {
  const customId = interaction.customId;
  if (!customId.startsWith('mutation_appeal_modal_')) return false;

  const mutationId = customId.replace('mutation_appeal_modal_', '');
  const appealReason = interaction.fields.getTextInputValue('appeal_reason');

  const Mutation = require('../models/Mutation');
  const mutation = await Mutation.findById(mutationId);

  if (!mutation) {
    return interaction.reply({
      content: '❌ İtiraz kaydı bulunamadı.',
      ephemeral: true,
    });
  }

  // Moderatöre DM gönder
  let moderatorUser = null;
  try {
    moderatorUser = await client.users.fetch(mutation.moderatorUserId);
  } catch (_) {}

  if (!moderatorUser) {
    return interaction.reply({
      content: '❌ İtirazınız gönderilirken hata oluştu (moderatör bulunumadı).',
      ephemeral: true,
    });
  }

  mutation.appealReason = appealReason;
  mutation.appealedAt = new Date();
  await mutation.save();

  // Moderatöre DM embed'i
  const moderatorEmbed = new EmbedBuilder()
    .setColor(0xfbbf24)
    .setTitle(`📝 ${interaction.user.tag} İtiraz Etti`)
    .setDescription(
      `${interaction.user.tag} tarafından sizin yaptığınız işleme itiraz geldi.\n\n` +
      `**İşlem:** ${mutation.actionType === 'mute' ? '🔇 Susturma' : mutation.actionType === 'deafen' ? '🔕 Sağırlaştırma' : '👢 Atma'}\n` +
      `**Hedef:** <@${mutation.targetUserId}>\n` +
      `**İtiraz Sebebi:** ${appealReason}`
    )
    .setFooter({ text: `ID: ${mutation._id}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`mutation_appeal_accept_${mutation._id}`)
      .setLabel('✅ Kabul Et (İşlemi Geri Al)')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`mutation_appeal_reject_${mutation._id}`)
      .setLabel('❌ İtirazı Reddet')
      .setStyle(ButtonStyle.Danger)
  );

  await moderatorUser.send({ embeds: [moderatorEmbed], components: [row] }).catch(() => {});

  return interaction.reply({
    content: '✅ İtirazınız gönderildi. Moderatörün cevabını bekleyin.',
    ephemeral: true,
  });
}

/**
 * Moderatörün itirazı kabul/reddetmesi
 */
async function handleMutationAppealDecision(interaction, client) {
  const customId = interaction.customId;
  
  const isAccept = customId.startsWith('mutation_appeal_accept_');
  const isReject = customId.startsWith('mutation_appeal_reject_');
  
  if (!isAccept && !isReject) return false;

  const mutationId = customId.replace(isAccept ? 'mutation_appeal_accept_' : 'mutation_appeal_reject_', '');
  
  const Mutation = require('../models/Mutation');
  const mutation = await Mutation.findById(mutationId);

  if (!mutation) {
    return interaction.reply({
      content: '❌ İtiraz kaydı bulunamadı.',
      ephemeral: true,
    });
  }

  const guild = await client.guilds.fetch(mutation.guildId).catch(() => null);
  const targetUser = await client.users.fetch(mutation.targetUserId).catch(() => null);

  if (isAccept) {
    // Kabul: İşlemi geri al
    if (guild && targetUser) {
      const member = await guild.members.fetch(mutation.targetUserId).catch(() => null);
      if (member) {
        try {
          if (mutation.actionType === 'mute') {
            await member.timeout(null, 'İtiraz kabul edildi');
          } else if (mutation.actionType === 'deafen') {
            await member.voice.setDeaf(false).catch(() => {});
          }
          // kick ise geri getirilemez, kullanıcı sunucuya el ile eklenmelidir
        } catch (_) {}
      }
    }

    // Kullanıcıya DM
    if (targetUser) {
      const acceptEmbed = new EmbedBuilder()
        .setColor(0x4ade80)
        .setTitle('✅ İtirazınız Kabul Edildi!')
        .setDescription(
          `Sizin itirazınız **${interaction.user.tag}** tarafından incelendi ve **kabul edildi**!\n\n` +
          `${mutation.actionType === 'mute' ? '🔇 Susturmanız kaldırıldı.' : 
            mutation.actionType === 'deafen' ? '🔕 Sağırlaştırmanız kaldırıldı.' : 
            '👢 Sunucuya yeniden katılabilirsiniz.'}`
        )
        .setFooter({ text: 'Moderatör İtiraz Sistemi' })
        .setTimestamp();

      await targetUser.send({ embeds: [acceptEmbed] }).catch(() => {});
    }

    mutation.resolvedAt = new Date();
    mutation.resolvedBy = interaction.user.id;
    mutation.appealAccepted = true;
    await mutation.save();

    return interaction.update({
      embeds: [
        EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0x4ade80)
          .setTitle('✅ İTİRAZ KABUL EDİLDİ')
          .addFields({ name: 'Karar Veren', value: `${interaction.user.tag}`, inline: false })
      ],
      components: []
    });
  } else {
    // Reddet
    if (targetUser) {
      const rejectEmbed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle('❌ İtirazınız Reddedildi')
        .setDescription(
          `İtirazınız **${interaction.user.tag}** tarafından incelendi ve **reddedildi**.\n\n` +
          `Ceza devam etmektedir. Sorularınız varsa moderatör ekibi ile iletişime geçiniz.`
        )
        .setFooter({ text: 'Moderatör İtiraz Sistemi' })
        .setTimestamp();

      await targetUser.send({ embeds: [rejectEmbed] }).catch(() => {});
    }

    mutation.resolvedAt = new Date();
    mutation.resolvedBy = interaction.user.id;
    mutation.appealAccepted = false;
    await mutation.save();

    return interaction.update({
      embeds: [
        EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0xff4444)
          .setTitle('❌ İTİRAZ REDDEDİLDİ')
          .addFields({ name: 'Karar Veren', value: `${interaction.user.tag}`, inline: false })
      ],
      components: []
    });
  }
}

module.exports = {
  sendMutationAppealDM,
  handleMutationAppealButton,
  handleMutationAppealModalSubmit,
  handleMutationAppealDecision,
};
