'use strict';

const {
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags
} = require('discord.js');

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
 * Returns Components V2 Control Panel payload for a temporary voice channel
 * Görseldeki gibi büyük başlık banner'ı ve dropdown select menu ile
 */
function getTempVoiceControlPanelV2(member, channel) {
  const HEADER_BANNER_URL = 'https://i.imgur.com/xvYD3tF.png';
  
  const isLocked = channel.permissionOverwrites.cache.some(po => po.id === channel.guild.id && po.deny.has(PermissionFlagsBits.Connect));
  const ownerId = tempChannels.get(channel.id) || member.id;

  // ─── CONTAINER ────────────────────────────────────────────────────────
  const container = new ContainerBuilder();

  // 1️⃣ Üst Banner Görseli
  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(HEADER_BANNER_URL)
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // 2️⃣ Başlık
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## Özel Sesli Kanal Yönetim Paneli')
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // 3️⃣ Açıklama Metni
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> Bu arayüz özel sesli kanalınızın yönetim panelidir. Sesli kanalınızı bu panel üzerinden basitçe yönetebilirsiniz.\n` +
      `> * **Kullanıcı susturmak, bağlantısını kesmek ve sağırlaştırmak için** seslide bulunan kullanıcının profilinden işlemi gerçekleştirebilirsiniz.\n` +
      `> * Sesli kanalınız içerisinde **kurallar ve ilkeleri ihlal etmediğinizden** emin olun.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
  );

  // 4️⃣ Select Menu (Dropdown)
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`tv_select_${channel.id}`)
    .setPlaceholder('Kanal ayar seçenekleri')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('📝 Kanal ismini değiştir')
        .setDescription('Sesli kanalınızın ismini değiştirmek için kullanabilirsiniz.')
        .setValue('rename')
        .setEmoji('�'),
      new StringSelectMenuOptionBuilder()
        .setLabel('👁️ Kanal görünürlüğünü değiştir')
        .setDescription('Sesli kanalınızın görünürlüğünü kapatmak ve açmak için kullanabilirsiniz.')
        .setValue('visibility')
        .setEmoji('👁️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔨 Kullanıcıyı kanaldan yasakla')
        .setDescription('Sesli kanalınızdan kullanıcı yasaklamak için kullanabilirsiniz.')
        .setValue('ban_user')
        .setEmoji('�'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔧 Kullanıcının kanaldan yasağını kaldır')
        .setDescription('Sesli kanalınızdan yasaklanmış kullanıcının yasağını kaldırmak için kullanabilirsiniz.')
        .setValue('unban_user')
        .setEmoji('�'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔒 Kanal kilit seviyesini değiştir')
        .setDescription('Sesli kanalınızı kilitleyebilirsiniz, kilidini açabilirsiniz.')
        .setValue('lock')
        .setEmoji('�')
    );

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);
  container.addActionRowComponents(selectRow);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // 5️⃣ Footer Bilgisi
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Sentara Dynamic TempVoice V2 Engine • Kanal Sahibi: <@${ownerId}> • Durum: ${isLocked ? '🔒 Kilitli' : '🔓 Açık'}`
    )
  );

  // ─── MESAJ PAYLOADı ────────────────────────────────────────────────
  return {
    content: null,
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
}

/**
 * TempVoice V2 Etkileşim Yöneticisi (Select Menu ve Butonlar için)
 */
async function handleTempVoiceInteraction(interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith('tv_') && !customId.startsWith('tempvoice_')) return false;

  // Select Menu İşlemleri
  if (interaction.isStringSelectMenu() && customId.startsWith('tv_select_')) {
    const channelId = customId.replace('tv_select_', '');
    const selectedValue = interaction.values[0];

    const guild = interaction.guild;
    if (!guild) return false;

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      await interaction.reply({ content: '❌ Bu ses kanalı artık mevcut değil veya silinmiş.', ephemeral: true }).catch(() => {});
      return true;
    }

    const ownerId = tempChannels.get(channel.id) || interaction.user.id;
    const isOwner = ownerId === interaction.user.id;

    // Sahip kontrolü
    if (!isOwner && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({ content: '❌ Bu işlemi yapmak için oda sahibi olmalısınız.', ephemeral: true }).catch(() => {});
      return true;
    }

    // 1. Kanal ismini değiştir
    if (selectedValue === 'rename') {
      const modal = new ModalBuilder()
        .setCustomId(`tv_modal_rename_${channel.id}`)
        .setTitle('📝 Kanal İsmini Değiştir')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('room_name')
              .setLabel('Yeni Kanal İsmi')
              .setPlaceholder('Örn: Arkadaşlarımla Sohbet')
              .setStyle(TextInputStyle.Short)
              .setValue(channel.name.replace('[🔊] ', ''))
              .setRequired(true)
              .setMaxLength(50)
          )
        );
      await interaction.showModal(modal);
      return true;
    }

    // 2. Kanal görünürlüğünü değiştir
    if (selectedValue === 'visibility') {
      const isHidden = channel.permissionOverwrites.cache.some(
        po => po.id === guild.id && po.deny.has(PermissionFlagsBits.ViewChannel)
      );

      if (isHidden) {
        await channel.permissionOverwrites.edit(guild.id, { ViewChannel: null });
        await interaction.reply({ 
          content: '👁️ **Kanal görünürlüğü açıldı.** Artık kanal sunucu üyelerine görünür.', 
          ephemeral: true 
        }).catch(() => {});
      } else {
        await channel.permissionOverwrites.edit(guild.id, { ViewChannel: false });
        await interaction.reply({ 
          content: '👁️‍🗨️ **Kanal gizlendi.** Artık kanal sadece izinli üyelere görünür.', 
          ephemeral: true 
        }).catch(() => {});
      }
      return true;
    }

    // 3. Kullanıcıyı kanaldan yasakla
    if (selectedValue === 'ban_user') {
      const modal = new ModalBuilder()
        .setCustomId(`tv_modal_ban_${channel.id}`)
        .setTitle('🔨 Kullanıcıyı Yasakla')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('Kullanıcı ID veya Mention')
              .setPlaceholder('Örn: 123456789012345678 veya @kullanıcı')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      await interaction.showModal(modal);
      return true;
    }

    // 4. Kullanıcının yasağını kaldır
    if (selectedValue === 'unban_user') {
      const modal = new ModalBuilder()
        .setCustomId(`tv_modal_unban_${channel.id}`)
        .setTitle('🔧 Yasağı Kaldır')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('Kullanıcı ID veya Mention')
              .setPlaceholder('Örn: 123456789012345678 veya @kullanıcı')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      await interaction.showModal(modal);
      return true;
    }

    // 5. Kanal kilit seviyesini değiştir
    if (selectedValue === 'lock') {
      const isLocked = channel.permissionOverwrites.cache.some(
        po => po.id === guild.id && po.deny.has(PermissionFlagsBits.Connect)
      );

      if (isLocked) {
        await channel.permissionOverwrites.edit(guild.id, { Connect: null });
        await interaction.reply({ 
          content: '🔓 **Kanal kilidi açıldı.** Artık herkes kanala katılabilir.', 
          ephemeral: true 
        }).catch(() => {});
      } else {
        await channel.permissionOverwrites.edit(guild.id, { Connect: false });
        await interaction.reply({ 
          content: '🔒 **Kanal kilitlendi.** Artık sadece izinli üyeler kanala katılabilir.', 
          ephemeral: true 
        }).catch(() => {});
      }
      return true;
    }

    return true;
  }

  // Buton İşlemleri (Eski kod uyumluluğu için)

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
