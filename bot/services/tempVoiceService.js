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
 * Gelişmiş özelliklerle: Üye listesi, detaylı ayarlar, user limit, bitrate, region vb.
 */
function getTempVoiceControlPanelV2(member, channel) {
  const HEADER_BANNER_URL = 'https://i.imgur.com/xvYD3tF.png';
  
  const isLocked = channel.permissionOverwrites.cache.some(po => po.id === channel.guild.id && po.deny.has(PermissionFlagsBits.Connect));
  const isHidden = channel.permissionOverwrites.cache.some(po => po.id === channel.guild.id && po.deny.has(PermissionFlagsBits.ViewChannel));
  const ownerId = tempChannels.get(channel.id) || member.id;
  
  // Kanaldaki üyeleri topla
  const members = Array.from(channel.members.values());
  const membersList = members.length > 0 
    ? members.slice(0, 10).map((m, i) => `${i + 1}. ${m.user.tag}${m.id === ownerId ? ' 👑' : ''}`).join('\n')
    : '*Henüz kimse yok*';

  // Kanal istatistikleri
  const channelStats = 
    `📊 **Kanal İstatistikleri:**\n` +
    `• 👥 Kullanıcı: **${channel.members.size}/${channel.userLimit || '∞'}**\n` +
    `• 🎚️ Bitrate: **${channel.bitrate / 1000} kbps**\n` +
    `• 🌍 Bölge: **${channel.rtcRegion || 'Otomatik'}**\n` +
    `• 🔒 Durum: **${isLocked ? 'Kilitli' : 'Açık'}**\n` +
    `• 👁️ Görünürlük: **${isHidden ? 'Gizli' : 'Görünür'}**`;

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

  // 2️⃣ Başlık ve Kanal Bilgisi
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## 🎙️ ${channel.name}`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // 3️⃣ Açıklama Metni
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> **Özel Sesli Kanal Yönetim Paneli**\n` +
      `> Bu arayüz özel sesli kanalınızın yönetim panelidir. Sesli kanalınızı bu panel üzerinden basitçe yönetebilirsiniz.\n\n` +
      `> 👑 **Kanal Sahibi:** <@${ownerId}>\n\n` +
      `${channelStats}`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // 4️⃣ Üye Listesi
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`**👥 Kanaldaki Üyeler (${channel.members.size}):**\n${membersList}${members.length > 10 ? '\n*... ve daha fazla*' : ''}`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
  );

  // 5️⃣ Uyarı Metni
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> ⚠️ **Önemli Notlar:**\n` +
      `> • Kullanıcı **susturmak, bağlantısını kesmek ve sağırlaştırmak** için seslide bulunan kullanıcının profilinden işlemi gerçekleştirebilirsiniz.\n` +
      `> • Sesli kanalınız içerisinde **kurallar ve ilkeleri ihlal etmediğinizden** emin olun.\n` +
      `> • Kanal boşaldığında **otomatik olarak silinir**.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
  );

  // 6️⃣ Temel Ayarlar Select Menu
  const basicMenu = new StringSelectMenuBuilder()
    .setCustomId(`tv_select_basic_${channel.id}`)
    .setPlaceholder('⚙️ Temel Kanal Ayarları')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('📝 Kanal ismini değiştir')
        .setDescription('Sesli kanalınızın ismini değiştirmek için kullanabilirsiniz.')
        .setValue('rename')
        .setEmoji('📝'),
      new StringSelectMenuOptionBuilder()
        .setLabel('👥 Kullanıcı limitini değiştir')
        .setDescription('Kanala girebilecek maksimum kullanıcı sayısını belirleyin.')
        .setValue('user_limit')
        .setEmoji('👥'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🎚️ Bitrate kalitesini değiştir')
        .setDescription('Ses kalitesini artırmak veya azaltmak için kullanabilirsiniz.')
        .setValue('bitrate')
        .setEmoji('🎚️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🌍 Bölge ayarını değiştir')
        .setDescription('Ses bağlantısı için sunucu bölgesini seçin.')
        .setValue('region')
        .setEmoji('🌍'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔄 Paneli yenile')
        .setDescription('Kanal bilgilerini ve üye listesini güncelleyin.')
        .setValue('refresh')
        .setEmoji('🔄')
    );

  const basicMenuRow = new ActionRowBuilder().addComponents(basicMenu);
  container.addActionRowComponents(basicMenuRow);

  // 7️⃣ Güvenlik ve Erişim Select Menu
  const securityMenu = new StringSelectMenuBuilder()
    .setCustomId(`tv_select_security_${channel.id}`)
    .setPlaceholder('🔒 Güvenlik ve Erişim Ayarları')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('🔒 Kanal kilit seviyesini değiştir')
        .setDescription('Kanalı kilitleyebilir veya kilidini açabilirsiniz.')
        .setValue('lock')
        .setEmoji('🔒'),
      new StringSelectMenuOptionBuilder()
        .setLabel('👁️ Kanal görünürlüğünü değiştir')
        .setDescription('Kanalın sunucuda görünürlüğünü ayarlayın.')
        .setValue('visibility')
        .setEmoji('👁️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔨 Kullanıcıyı kanaldan yasakla')
        .setDescription('Belirli bir kullanıcının kanala erişimini engelleyin.')
        .setValue('ban_user')
        .setEmoji('🔨'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔧 Kullanıcının yasağını kaldır')
        .setDescription('Yasaklı bir kullanıcının erişimini geri verin.')
        .setValue('unban_user')
        .setEmoji('🔧'),
      new StringSelectMenuOptionBuilder()
        .setLabel('👤 Güvenilir kullanıcı ekle')
        .setDescription('Kanal kilitli bile olsa girebilecek kullanıcı ekleyin.')
        .setValue('whitelist')
        .setEmoji('👤')
    );

  const securityMenuRow = new ActionRowBuilder().addComponents(securityMenu);
  container.addActionRowComponents(securityMenuRow);

  // 8️⃣ Gelişmiş İşlemler Select Menu
  const advancedMenu = new StringSelectMenuBuilder()
    .setCustomId(`tv_select_advanced_${channel.id}`)
    .setPlaceholder('🛠️ Gelişmiş Kanal İşlemleri')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('📞 Davet linki oluştur')
        .setDescription('Arkadaşlarınızı kanala davet etmek için link oluşturun.')
        .setValue('invite')
        .setEmoji('📞'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🚫 Sesli kanaldan kullanıcı at')
        .setDescription('Belirli bir kullanıcıyı sesli kanaldan çıkarın.')
        .setValue('kick_user')
        .setEmoji('🚫'),
      new StringSelectMenuOptionBuilder()
        .setLabel('👑 Kanal sahipliğini devret')
        .setDescription('Kanal sahipliğini başka bir kullanıcıya devredin.')
        .setValue('transfer')
        .setEmoji('👑'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📋 Kanal durumunu kopyala')
        .setDescription('Kanal bilgilerini ve ayarlarını metin olarak alın.')
        .setValue('copy_info')
        .setEmoji('📋'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🗑️ Kanalı sil')
        .setDescription('Sesli kanalı kalıcı olarak silin.')
        .setValue('delete')
        .setEmoji('🗑️')
    );

  const advancedMenuRow = new ActionRowBuilder().addComponents(advancedMenu);
  container.addActionRowComponents(advancedMenuRow);

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // 9️⃣ Footer Bilgisi
  const timestamp = Math.floor(Date.now() / 1000);
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Sentara Dynamic TempVoice V2 Engine • Oluşturulma: <t:${timestamp}:R> • Kanal ID: ${channel.id}`
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
  if (interaction.isStringSelectMenu()) {
    const channelIdMatch = customId.match(/_(\d{17,20})$/);
    if (!channelIdMatch) return false;
    
    const channelId = channelIdMatch[1];
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

    // ═══ TEMEL AYARLAR ═══════════════════════════════════════════

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

    // 2. Kullanıcı limiti değiştir
    if (selectedValue === 'user_limit') {
      const modal = new ModalBuilder()
        .setCustomId(`tv_modal_limit_${channel.id}`)
        .setTitle('👥 Kullanıcı Limitini Değiştir')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('user_limit')
              .setLabel('Maksimum Kullanıcı Sayısı (0 = Sınırsız)')
              .setPlaceholder('0-99 arası bir sayı girin')
              .setStyle(TextInputStyle.Short)
              .setValue(String(channel.userLimit || 0))
              .setRequired(true)
          )
        );
      await interaction.showModal(modal);
      return true;
    }

    // 3. Bitrate değiştir
    if (selectedValue === 'bitrate') {
      const modal = new ModalBuilder()
        .setCustomId(`tv_modal_bitrate_${channel.id}`)
        .setTitle('🎚️ Bitrate Kalitesini Değiştir')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('bitrate')
              .setLabel('Bitrate (kbps) - 8 ile 96 arası')
              .setPlaceholder('Örn: 64')
              .setStyle(TextInputStyle.Short)
              .setValue(String(channel.bitrate / 1000))
              .setRequired(true)
          )
        );
      await interaction.showModal(modal);
      return true;
    }

    // 4. Bölge değiştir
    if (selectedValue === 'region') {
      const modal = new ModalBuilder()
        .setCustomId(`tv_modal_region_${channel.id}`)
        .setTitle('🌍 Bölge Ayarını Değiştir')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('region')
              .setLabel('Bölge Kodu (auto, us-west, europe, vb.)')
              .setPlaceholder('Boş bırakırsanız "auto" olarak ayarlanır')
              .setStyle(TextInputStyle.Short)
              .setValue(channel.rtcRegion || 'auto')
              .setRequired(false)
          )
        );
      await interaction.showModal(modal);
      return true;
    }

    // 5. Paneli yenile
    if (selectedValue === 'refresh') {
      await interaction.deferUpdate();
      const newPanel = getTempVoiceControlPanelV2(interaction.member, channel);
      await interaction.editReply(newPanel).catch(() => {});
      return true;
    }

    // ═══ GÜVENLİK VE ERİŞİM ═══════════════════════════════════

    // 6. Kanal kilidi
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

    // 7. Görünürlük
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

    // 8. Kullanıcıyı yasakla
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

    // 9. Yasağı kaldır
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

    // 10. Güvenilir kullanıcı ekle (whitelist)
    if (selectedValue === 'whitelist') {
      const modal = new ModalBuilder()
        .setCustomId(`tv_modal_whitelist_${channel.id}`)
        .setTitle('👤 Güvenilir Kullanıcı Ekle')
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

    // ═══ GELİŞMİŞ İŞLEMLER ═══════════════════════════════════

    // 11. Davet linki oluştur
    if (selectedValue === 'invite') {
      const invite = await channel.createInvite({ 
        maxAge: 3600, 
        maxUses: 10, 
        reason: 'Ses odası daveti' 
      }).catch(() => null);
      
      if (invite) {
        await interaction.reply({ 
          content: `📞 **Ses Odası Davet Bağlantınız:**\n${invite.url}\n\n*Bu link 1 saat geçerli olacak ve 10 kişi kullanabilecek.*`, 
          ephemeral: true 
        }).catch(() => {});
      } else {
        await interaction.reply({ content: '❌ Davet bağlantısı oluşturulamadı.', ephemeral: true }).catch(() => {});
      }
      return true;
    }

    // 12. Kullanıcıyı at
    if (selectedValue === 'kick_user') {
      const modal = new ModalBuilder()
        .setCustomId(`tv_modal_kick_${channel.id}`)
        .setTitle('🚫 Kullanıcıyı Sesten At')
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

    // 13. Sahipliği devret
    if (selectedValue === 'transfer') {
      const modal = new ModalBuilder()
        .setCustomId(`tv_modal_transfer_${channel.id}`)
        .setTitle('👑 Kanal Sahipliğini Devret')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('user_id')
              .setLabel('Yeni Sahibin ID veya Mention')
              .setPlaceholder('Örn: 123456789012345678 veya @kullanıcı')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      await interaction.showModal(modal);
      return true;
    }

    // 14. Kanal bilgilerini kopyala
    if (selectedValue === 'copy_info') {
      const info = 
        `📋 **Kanal Bilgileri**\n\n` +
        `**İsim:** ${channel.name}\n` +
        `**ID:** ${channel.id}\n` +
        `**Sahip:** <@${ownerId}>\n` +
        `**Üye Sayısı:** ${channel.members.size}/${channel.userLimit || '∞'}\n` +
        `**Bitrate:** ${channel.bitrate / 1000} kbps\n` +
        `**Bölge:** ${channel.rtcRegion || 'Otomatik'}\n` +
        `**Durum:** ${channel.permissionOverwrites.cache.some(po => po.id === guild.id && po.deny.has(PermissionFlagsBits.Connect)) ? 'Kilitli' : 'Açık'}\n` +
        `**Görünürlük:** ${channel.permissionOverwrites.cache.some(po => po.id === guild.id && po.deny.has(PermissionFlagsBits.ViewChannel)) ? 'Gizli' : 'Görünür'}\n\n` +
        `**Üyeler:**\n${Array.from(channel.members.values()).map((m, i) => `${i + 1}. ${m.user.tag}`).join('\n')}`;

      await interaction.reply({ content: info, ephemeral: true }).catch(() => {});
      return true;
    }

    // 15. Kanalı sil
    if (selectedValue === 'delete') {
      await interaction.reply({ content: '🗑️ **Ses kanalı siliniyor...**', ephemeral: true }).catch(() => {});
      await channel.delete('Oda sahibi tarafından silindi.').catch(() => {});
      tempChannels.delete(channel.id);
      return true;
    }

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
