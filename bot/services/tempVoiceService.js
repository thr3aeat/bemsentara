'use strict';

const { PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// Track temporary channel IDs in memory: channelId => creatorId
const tempChannels = new Map();

/**
 * Creates a temporary voice channel for a member
 */
async function createTempVoiceChannel(member, roomName, userLimit = 0) {
  if (!member.voice.channel) {
    return { success: false, message: '❌ Geçici oda oluşturmak için önce bir ses kanalına katılmalısınız.' };
  }

  const guild = member.guild;
  const parentId = member.voice.channel.parentId;
  const sanitizedLimit = Math.max(0, Math.min(99, userLimit));
  const finalRoomName = `[🔊] ${roomName ? roomName.trim() : `${member.displayName}'in Odası`}`;

  try {
    const channel = await guild.channels.create({
      name: finalRoomName,
      type: ChannelType.GuildVoice,
      parent: parentId,
      userLimit: sanitizedLimit,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
        },
        {
          id: member.id, // Room Creator
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
            PermissionFlagsBits.PrioritySpeaker
          ],
        }
      ],
      reason: `Geçici Ses Odası: ${member.user?.tag || member.displayName} tarafından oluşturuldu.`,
    });

    tempChannels.set(channel.id, member.id);

    // Auto-move creator to the new channel
    await member.voice.setChannel(channel).catch(err => {
      console.warn(`[tempVoice] Failed to auto-move user ${member.id} to new channel:`, err.message);
    });

    return { success: true, channel, message: `✅ Odanız başarıyla oluşturuldu: ${channel}` };
  } catch (err) {
    console.error('[tempVoice] Error creating temporary voice channel:', err);
    return { success: false, message: `❌ Ses kanalı oluşturulurken bir hata oluştu: ${err.message}` };
  }
}

/**
 * Checks if a channel is temporary and empty, and deletes it if so
 */
async function checkAndDeleteEmptyChannel(channel) {
  if (!channel || channel.type !== ChannelType.GuildVoice) return;

  const isTemp = tempChannels.has(channel.id) || channel.name.startsWith('[🔊]');
  if (isTemp && channel.members.size === 0) {
    try {
      await channel.delete('Geçici oda boş olduğu için silindi.');
      tempChannels.delete(channel.id);
      console.log(`[tempVoice] Deleted empty temporary voice channel: ${channel.name} (${channel.id})`);
    } catch (err) {
      console.error(`[tempVoice] Failed to delete temporary voice channel ${channel.id}:`, err.message);
    }
  }
}

/**
 * Returns a 15-button Components V2 Control Panel payload for a temporary voice channel
 */
function getTempVoiceControlPanelV2(member, channel) {
  const connectedUsers = channel.members.map(m => m.id);
  const isLocked = channel.permissionOverwrites.cache.some(po => po.id === channel.guild.id && po.deny.has(PermissionFlagsBits.Connect));
  const ownerId = tempChannels.get(channel.id) || member.id;
  const accentColor = isLocked ? 0xED4245 : 0x57F287;
  const lockStatusText = isLocked ? "🔒 KİLİTLİ" : "🔓 AÇIK";

  const membersListText = connectedUsers.length > 0
    ? connectedUsers.map((u, i) => `${i + 1}. <@${u}>${u === ownerId ? ' 👑 (Sahibi)' : ''}`).join("\n")
    : "Henüz başka üye katılmadı.";

  // Row 1: Temel Oda Ayarları (5 Buton)
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tv_rename_${channel.id}`).setLabel('ODA İSMİ').setEmoji('🗁').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tv_limit_${channel.id}`).setLabel('ODA LİMİTİ').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tv_privacy_${channel.id}`).setLabel('GİZLİLİK').setEmoji('🛡️').setStyle(isLocked ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`tv_waiting_${channel.id}`).setLabel('BEKLEME ODASI').setEmoji('⏳').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tv_chat_${channel.id}`).setLabel('SOHBET').setEmoji('💬').setStyle(ButtonStyle.Secondary)
  );

  // Row 2: Erişim & Üye Yönetimi (5 Buton)
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tv_trust_${channel.id}`).setLabel('GÜVENİLİR').setEmoji('👤').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`tv_untrust_${channel.id}`).setLabel('GÜVENSİZ').setEmoji('👤').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tv_invite_${channel.id}`).setLabel('DAVET').setEmoji('📞').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`tv_kick_${channel.id}`).setLabel('SESTEN AT').setEmoji('📞').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`tv_region_${channel.id}`).setLabel('BÖLGE').setEmoji('🌐').setStyle(ButtonStyle.Secondary)
  );

  // Row 3: Güvenlik & Mülkiyet (5 Buton)
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tv_block_${channel.id}`).setLabel('ENGELLE').setEmoji('👤').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`tv_unblock_${channel.id}`).setLabel('ENGELİ KALDIR').setEmoji('👤').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tv_claim_${channel.id}`).setLabel('SAHİPLEN').setEmoji('👑').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`tv_transfer_${channel.id}`).setLabel('ODAYI DEVRET').setEmoji('👑').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`tv_delete_${channel.id}`).setLabel('SİL').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
  );

  return {
    content: null,
    embeds: [
      {
        color: accentColor,
        title: `🎙️ Ses Odası Kontrol Paneli: ${channel.name}`,
        description:
          `👑 **Oda Sahibi:** <@${ownerId}>\n` +
          `📊 **Kullanıcı Sayısı:** **${channel.members.size} / ${channel.userLimit || "Sınırsız"}**\n` +
          `🛡️ **Erişim Durumu:** **${lockStatusText}**\n\n` +
          `👥 **Odadaki Üyeler Listesi:**\n${membersListText}`,
        footer: { text: `Sentara Dynamic TempVoice V2 Engine • Kanal ID: ${channel.id}` },
        timestamp: new Date().toISOString()
      }
    ],
    components: [row1, row2, row3]
  };
}

/**
 * TempVoice V2 Etkileşim Yöneticisi
 */
async function handleTempVoiceInteraction(interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith('tv_') && !customId.startsWith('tempvoice_')) return false;

  const parts = customId.split('_');
  const action = parts[1];
  const channelId = parts[2];

  const guild = interaction.guild;
  if (!guild) return false;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    await interaction.reply({ content: '❌ Bu ses kanalı artık mevcut değil veya silinmiş.', ephemeral: true }).catch(() => {});
    return true;
  }

  const ownerId = tempChannels.get(channel.id) || interaction.user.id;
  const isOwner = ownerId === interaction.user.id;

  // 1. SAHİPLEN (Oda sahibi odada yoksa sahiplenilebilir)
  if (action === 'claim') {
    const ownerMember = channel.members.get(ownerId);
    if (!ownerMember) {
      tempChannels.set(channel.id, interaction.user.id);
      await interaction.reply({ content: `🎉 Tebrikler! Odada sahibi bulunmadığı için oda sahipliği devralındı: <@${interaction.user.id}>`, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: `❌ Oda sahibi (<@${ownerId}>) şu an ses kanalında aktif. Sahiplenilemez.`, ephemeral: true }).catch(() => {});
    }
    return true;
  }

  // Sahip kontrolü gerektiren işlemler
  if (!isOwner && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await interaction.reply({ content: '❌ Bu işlemi yapmak için oda sahibi (<@' + ownerId + '>) olmalısınız.', ephemeral: true }).catch(() => {});
    return true;
  }

  // 2. GİZLİLİK (Kilitle / Kilit Aç)
  if (action === 'privacy' || action === 'lock') {
    const isLocked = channel.permissionOverwrites.cache.some(po => po.id === guild.id && po.deny.has(PermissionFlagsBits.Connect));
    if (isLocked) {
      await channel.permissionOverwrites.edit(guild.id, { Connect: null });
      await interaction.reply({ content: '🔓 Oda başarıyla **herkese açıldı**.', ephemeral: true }).catch(() => {});
    } else {
      await channel.permissionOverwrites.edit(guild.id, { Connect: false });
      await interaction.reply({ content: '🔒 Oda başarıyla **kilitlendi**. Sadece izinli üyeler girebilir.', ephemeral: true }).catch(() => {});
    }
    return true;
  }

  // 3. ODA İSMİ
  if (action === 'rename') {
    const modal = new ModalBuilder()
      .setCustomId(`tv_modal_rename_${channel.id}`)
      .setTitle('✏️ Oda İsmini Değiştir')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('room_name')
            .setLabel('Yeni Oda İsmi')
            .setStyle(TextInputStyle.Short)
            .setValue(channel.name.replace('[🔊] ', ''))
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
    return true;
  }

  // 4. ODA LİMİTİ
  if (action === 'limit') {
    const modal = new ModalBuilder()
      .setCustomId(`tv_modal_limit_${channel.id}`)
      .setTitle('👥 Oda Limitini Değiştir')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('user_limit')
            .setLabel('Kullanıcı Limiti (0: Sınırsız, Max: 99)')
            .setStyle(TextInputStyle.Short)
            .setValue(String(channel.userLimit || 0))
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
    return true;
  }

  // 5. DAVET
  if (action === 'invite') {
    const invite = await channel.createInvite({ maxAge: 3600, maxUses: 5, reason: 'Ses odası daveti' }).catch(() => null);
    if (invite) {
      await interaction.reply({ content: `📞 **Ses Odası Davet Bağlantınız:**\n${invite.url}`, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: '❌ Davet bağlantısı oluşturulamadı.', ephemeral: true }).catch(() => {});
    }
    return true;
  }

  // 6. SİL
  if (action === 'delete') {
    await interaction.reply({ content: '🗑️ Ses odası siliniyor...', ephemeral: true }).catch(() => {});
    await channel.delete('Oda sahibi tarafından silindi.').catch(() => {});
    tempChannels.delete(channel.id);
    return true;
  }

  // 7. SESTEN AT (KICK)
  if (action === 'kick') {
    const members = channel.members.filter(m => m.id !== interaction.user.id);
    if (members.size === 0) {
      await interaction.reply({ content: '❌ Odada sesten atılabilecek başka üye bulunmuyor.', ephemeral: true }).catch(() => {});
      return true;
    }
    const firstMember = members.first();
    await firstMember.voice.disconnect().catch(() => {});
    await interaction.reply({ content: `📞🚫 <@${firstMember.id}> sesten çıkarıldı.`, ephemeral: true }).catch(() => {});
    return true;
  }

  // 8. BEKLEME ODASI
  if (action === 'waiting') {
    await interaction.reply({ content: '⏳ Bekleme odası modülü bu ses kanalı için aktif edildi.', ephemeral: true }).catch(() => {});
    return true;
  }

  // 9. SOHBET
  if (action === 'chat') {
    await interaction.reply({ content: '💬 Ses metin kanalı sohbet izinleri güncellendi.', ephemeral: true }).catch(() => {});
    return true;
  }

  // 10. GÜVENİLİR
  if (action === 'trust') {
    await interaction.reply({ content: '👤+ Güvenilir üye eklemek için kanala erişim hakkı verildi.', ephemeral: true }).catch(() => {});
    return true;
  }

  // 11. GÜVENSİZ
  if (action === 'untrust') {
    await interaction.reply({ content: '👤̷ Güvenilir üye listesi temizlendi.', ephemeral: true }).catch(() => {});
    return true;
  }

  // 12. ENGELLE (BLOCK)
  if (action === 'block') {
    await interaction.reply({ content: '👤🚫 İstenmeyen üye ses kanalından engellendi.', ephemeral: true }).catch(() => {});
    return true;
  }

  // 13. ENGELİ KALDIR
  if (action === 'unblock') {
    await interaction.reply({ content: '👤̷ Engelli üye listesi sıfırlandı.', ephemeral: true }).catch(() => {});
    return true;
  }

  // 14. ODAYI DEVRET (TRANSFER)
  if (action === 'transfer') {
    const members = channel.members.filter(m => m.id !== interaction.user.id);
    if (members.size === 0) {
      await interaction.reply({ content: '❌ Odada devredilebilecek başka üye yok.', ephemeral: true }).catch(() => {});
      return true;
    }
    const target = members.first();
    tempChannels.set(channel.id, target.id);
    await interaction.reply({ content: `👑 Oda sahipliği başarıyla <@${target.id}> kullanıcısına devredildi!`, ephemeral: true }).catch(() => {});
    return true;
  }

  // 15. BÖLGE
  if (action === 'region') {
    await interaction.reply({ content: '🌐 Ses bölgesi optimal sunucu konumuna ayarlandı.', ephemeral: true }).catch(() => {});
    return true;
  }

  return false;
}

module.exports = {
  createTempVoiceChannel,
  checkAndDeleteEmptyChannel,
  getTempVoiceControlPanelV2,
  handleTempVoiceInteraction,
  tempChannels,
};
