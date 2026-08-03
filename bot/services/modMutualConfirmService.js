'use strict';

/**
 * Moderatör Arası Mutual Confirmation Sistemi
 * 
 * Bir moderatör başka moderatöre işlem yaptığında (mute/deafen/kick):
 * - Karşı moderatöre DM: "X sizi çekti, kabul ediyor musunuz?"
 * - KABUL ET / REDDET / ÖZEL MESAJ GÖNDER butonları
 * - REDDET → işlem geri alındı
 * - ÖZEL MESAJ → modal açılır, yazı karşı tarafa gider, cevap alabilir
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

const ModerationConfirm = require('../../models/ModerationConfirm');

/**
 * Karşı moderatöre confirmation DM'i gönder
 */
async function sendMutualConfirmationDM(client, actor, target, guild, actionType, reason) {
  try {
    if (!target.user || target.user.bot) return false;

    const actionLabels = {
      mute: '🔇 Susturdu',
      deafen: '🔕 Sağırlaştırdı',
      kick: '👢 Çekti',
    };

    const actionDescriptions = {
      mute: 'sesini kısmıştır',
      deafen: 'seni sağırlaştırmıştır',
      kick: 'seni ses kanalından çıkarmıştır',
    };

    const embed = new EmbedBuilder()
      .setColor(0xfbbf24)
      .setTitle(`⚠️ Moderatör Onayı Gerekiyor`)
      .setDescription(
        `**${actor.tag}** ${actionDescriptions[actionType] || 'işlem yapmıştır'}.\n\n` +
        `**Hedef:** ${target.toString()}\n` +
        `**Sunucu:** ${guild.name}\n` +
        `**Sebep:** ${reason || 'Belirtilmedi'}\n\n` +
        `Bu işlemi kabul ediyor musunuz?`
      )
      .setThumbnail(actor.displayAvatarURL())
      .setFooter({ text: 'Moderatör Onay Sistemi • Ekoyıldız' })
      .setTimestamp();

    const confirmId = `${guild.id}_${actor.id}_${target.id}_${actionType}_${Date.now()}`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mod_confirm_accept_${confirmId}`)
        .setLabel('✅ Kabul Et')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`mod_confirm_reject_${confirmId}`)
        .setLabel('❌ Reddet')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`mod_confirm_message_${confirmId}`)
        .setLabel('💬 Özel Mesaj Gönder')
        .setStyle(ButtonStyle.Primary)
    );

    // DB'ye kaydet
    const confirm = new ModerationConfirm({
      guildId: guild.id,
      actorId: actor.id,
      targetId: target.id,
      actionType,
      reason,
      status: 'pending',
      createdAt: new Date(),
    });
    await confirm.save();

    await target.send({ embeds: [embed], components: [row] }).catch(() => {});
    console.log(`[modConfirm] DM gönderildi: ${actor.tag} → ${target.tag} (${actionType})`);
    return true;
  } catch (err) {
    console.log(`[modConfirm] DM gönderilemedi: ${err.message}`);
    return false;
  }
}

/**
 * KABUL ET butonuna basıldığında
 */
async function handleConfirmAccept(interaction, confirmId) {
  try {
    const parts = confirmId.split('_');
    const guildId = parts[0];
    const actorId = parts[1];
    const targetId = parts[2];
    const actionType = parts[3];

    const ModerationConfirm = require('../../models/ModerationConfirm');
    const confirm = await ModerationConfirm.findOne({ guildId, actorId, targetId, actionType, status: 'pending' }).sort({ createdAt: -1 });

    if (!confirm) {
      return interaction.reply({
        content: '❌ Bu onay kaydı bulunamadı veya zaten çözülmüş.',
        ephemeral: true,
      });
    }

    // Onay: işlem kalıcı, başka bir şey yok
    confirm.status = 'accepted';
    confirm.acceptedBy = interaction.user.id;
    confirm.acceptedAt = new Date();
    await confirm.save();

    return interaction.update({
      embeds: [
        EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0x4ade80)
          .setTitle('✅ KABUL EDİLDİ')
          .addFields({
            name: 'Onaylayan',
            value: interaction.user.tag,
            inline: false
          })
      ],
      components: []
    });
  } catch (err) {
    console.error('[modConfirmAccept] Error:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * REDDET butonuna basıldığında → işlemi geri al
 */
async function handleConfirmReject(interaction, client, confirmId) {
  try {
    const parts = confirmId.split('_');
    const guildId = parts[0];
    const actorId = parts[1];
    const targetId = parts[2];
    const actionType = parts[3];

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      return interaction.reply({
        content: '❌ Sunucu bulunamadı.',
        ephemeral: true,
      });
    }

    const member = await guild.members.fetch(targetId).catch(() => null);
    if (member) {
      try {
        if (actionType === 'mute') {
          await member.timeout(null, 'Moderatör onayı reddedildi');
        } else if (actionType === 'deafen') {
          await member.voice.setDeaf(false).catch(() => {});
        }
        // kick ise geri getirilemiyor
      } catch (_) {}
    }

    // DB'ye reddet kaydı
    const ModerationConfirm = require('../../models/ModerationConfirm');
    const confirm = await ModerationConfirm.findOne({ guildId, actorId, targetId, actionType, status: 'pending' }).sort({ createdAt: -1 });

    if (confirm) {
      confirm.status = 'rejected';
      confirm.rejectedBy = interaction.user.id;
      confirm.rejectedAt = new Date();
      await confirm.save();
    }

    // Actor'a DM gönder
    const actor = await client.users.fetch(actorId).catch(() => null);
    if (actor) {
      const rejectEmbed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle('❌ Moderatör Onayı Reddedildi')
        .setDescription(
          `${interaction.user.tag} tarafından yaptığınız işlem **reddedildi** ve geri alındı.\n\n` +
          `**İşlem Tipi:** ${actionType === 'mute' ? '🔇 Susturma' : actionType === 'deafen' ? '🔕 Sağırlaştırma' : '👢 Kick'}`
        )
        .setFooter({ text: 'Moderatör Onay Sistemi' })
        .setTimestamp();

      await actor.send({ embeds: [rejectEmbed] }).catch(() => {});
    }

    return interaction.update({
      embeds: [
        EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0xff4444)
          .setTitle('❌ REDDEDİLDİ - İŞLEM GERİ ALINDI')
          .addFields({
            name: 'Reddeden',
            value: interaction.user.tag,
            inline: false
          })
      ],
      components: []
    });
  } catch (err) {
    console.error('[modConfirmReject] Error:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * ÖZEL MESAJ GÖNDER butonuna basıldığında → Modal aç
 */
async function handleConfirmMessage(interaction, confirmId) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`mod_confirm_msg_modal_${confirmId}`)
      .setTitle('💬 Moderatöre Mesaj Gönder');

    const messageInput = new TextInputBuilder()
      .setCustomId('confirm_message_text')
      .setLabel('Mesajınız')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Örn: Bu işlemi neden yaptın?')
      .setRequired(true)
      .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder().addComponents(messageInput));

    await interaction.showModal(modal);
    return true;
  } catch (err) {
    console.error('[modConfirmMessage] Error:', err.message);
    return false;
  }
}

/**
 * Özel mesaj modal'ı gönderilince → karşı tarafa git
 */
async function handleConfirmMessageSubmit(interaction, client, confirmId) {
  try {
    const message = interaction.fields.getTextInputValue('confirm_message_text');

    const parts = confirmId.split('_');
    const actorId = parts[1];

    // Karşı tarafa mesaj gönder
    const actor = await client.users.fetch(actorId).catch(() => null);

    if (!actor) {
      return interaction.reply({
        content: '❌ Alıcı bulunumadı.',
        ephemeral: true,
      });
    }

    const messageEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`💬 ${interaction.user.tag} Sana Mesaj Gönderdi`)
      .setDescription(message)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: 'Moderatör Mesajlaşma Sistemi' })
      .setTimestamp();

    const replyButtonId = `mod_confirm_reply_${confirmId}`;
    const replyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(replyButtonId)
        .setLabel('↩️ Yanıt Ver')
        .setStyle(ButtonStyle.Primary)
    );

    await actor.send({ embeds: [messageEmbed], components: [replyRow] }).catch(() => {});

    return interaction.reply({
      content: '✅ Mesajınız gönderildi.',
      ephemeral: true,
    });
  } catch (err) {
    console.error('[modConfirmMessageSubmit] Error:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

/**
 * Yanıt Ver butonuna basıldığında → Modal aç
 */
async function handleConfirmReply(interaction, confirmId) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`mod_confirm_reply_modal_${confirmId}`)
      .setTitle('↩️ Yanıt Ver');

    const replyInput = new TextInputBuilder()
      .setCustomId('confirm_reply_text')
      .setLabel('Yanıtınız')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Yazınız...')
      .setRequired(true)
      .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder().addComponents(replyInput));

    await interaction.showModal(modal);
    return true;
  } catch (err) {
    console.error('[modConfirmReply] Error:', err.message);
    return false;
  }
}

/**
 * Yanıt modal'ı gönderilince → gönderene geri git
 */
async function handleConfirmReplySubmit(interaction, client, confirmId) {
  try {
    const reply = interaction.fields.getTextInputValue('confirm_reply_text');

    const parts = confirmId.split('_');
    const targetId = parts[2];

    // Gönderene yanıt gönder
    const originalSender = await client.users.fetch(targetId).catch(() => null);

    if (!originalSender) {
      return interaction.reply({
        content: '❌ Gönderici bulunumadı.',
        ephemeral: true,
      });
    }

    const replyEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`↩️ ${interaction.user.tag} Yanıt Verdi`)
      .setDescription(reply)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: 'Moderatör Mesajlaşma Sistemi' })
      .setTimestamp();

    await originalSender.send({ embeds: [replyEmbed] }).catch(() => {});

    return interaction.reply({
      content: '✅ Yanıtınız gönderildi.',
      ephemeral: true,
    });
  } catch (err) {
    console.error('[modConfirmReplySubmit] Error:', err.message);
    return interaction.reply({ content: `❌ Hata: ${err.message}`, ephemeral: true });
  }
}

module.exports = {
  sendMutualConfirmationDM,
  handleConfirmAccept,
  handleConfirmReject,
  handleConfirmMessage,
  handleConfirmMessageSubmit,
  handleConfirmReply,
  handleConfirmReplySubmit,
};
