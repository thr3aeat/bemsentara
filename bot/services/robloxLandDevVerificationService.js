'use strict';

const {
  ChannelType,
  PermissionFlagsBits,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');

const GUILD_ID = '1537407325290237973';
const TICKET_CATEGORY_ID = '1538466419245719663';
const STAFF_ROLE_ID = '1537411928585015366';
const DESIGNATED_STAFF_ID = '1497600770634289194';
const STAFF_LOG_CHANNEL_ID = '1543382733408174220';
const STAFF_RECRUITMENT_MGMT_CHANNEL_ID = '1544367634433183765';

// Bellekte aktif doğrulama talepleri: ticketId -> { ticketId, textChannelId, userId, createdAt }
const activeDevTickets = new Map();

/**
 * Yetkili yetki kontrolü
 */
function isAuthorizedStaff(member) {
  if (!member) return false;
  const rolesList = member.roles?.cache
    ? (Array.isArray(member.roles.cache)
      ? member.roles.cache
      : Array.from(member.roles.cache.values ? member.roles.cache.values() : []))
    : [];

  return Boolean(
    member.id === DESIGNATED_STAFF_ID ||
    (member.permissions?.has && (
      member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageChannels)
    )) ||
    (member.roles?.cache?.has && member.roles.cache.has(STAFF_ROLE_ID)) ||
    (Array.isArray(rolesList) ? rolesList.some(r => /yetkili|admin|mod|yönetici|sorumlu|kurucu/i.test(r?.name || '')) : (typeof rolesList.some === 'function' && rolesList.some(r => /yetkili|admin|mod|yönetici|sorumlu|kurucu/i.test(r?.name || ''))))
  );
}

/**
 * Kullanıcı için Onaylı Developer Doğrulama Kanalı Açar
 */
async function openDevVerificationTicket(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;
  const member = interaction.member;

  if (!guild || !user) return false;

  // Kullanıcının açık talebi var mı kontrol et
  for (const [tId, tData] of activeDevTickets.entries()) {
    if (tData.userId === user.id) {
      const existingChan = guild.channels.cache.get(tData.textChannelId);
      if (existingChan) {
        return await interaction.reply({
          content: `⚠️ Zaten açık bir geliştirici doğrulama talebiniz bulunuyor: <#${tData.textChannelId}>`,
          ephemeral: true
        });
      } else {
        activeDevTickets.delete(tId);
      }
    }
  }

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
  }

  const ticketId = `dev-${Date.now().toString().slice(-4)}`;
  const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'user';

  // Özel Metin Kanalı Oluştur
  const textChannel = await guild.channels.create({
    name: `dev-onay-${cleanUsername}`,
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      },
      {
        id: DESIGNATED_STAFF_ID,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels
        ]
      },
      {
        id: STAFF_ROLE_ID,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels
        ]
      },
      ...(interaction.client.user?.id ? [{
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.EmbedLinks
        ]
      }] : [])
    ]
  }).catch(err => {
    console.error('[DevVerification] Channel create error:', err.message);
    return null;
  });

  if (!textChannel) {
    if (interaction.editReply) {
      return await interaction.editReply({ content: '❌ Doğrulama kanalı oluşturulamadı. Lütfen yetkililere bildirin.' });
    }
    return await interaction.reply({ content: '❌ Doğrulama kanalı oluşturulamadı.', ephemeral: true });
  }

  activeDevTickets.set(ticketId, {
    ticketId,
    textChannelId: textChannel.id,
    userId: user.id,
    createdAt: Date.now()
  });

  const staffMention = `<@${DESIGNATED_STAFF_ID}>`;
  const staffRoleMention = `<@&${STAFF_ROLE_ID}>`;

  const welcomePayload = ComponentsV2Factory.buildPayload([
    ComponentsV2Factory.text(
      `# 💻 ROBLOXLND — ONAYLI DEVELOPER PORTFOLYO DOĞRULAMASI (#${ticketId})\n\n` +
      `👋 **Aday:** <@${user.id}> (\`${user.tag}\`)\n` +
      `🛡️ **Değerlendirme Ekibi:** ${staffRoleMention} / ${staffMention}\n\n` +
      `### 📌 Yapılması Gerekenler & Kanıt Yükleme:\n` +
      `Lütfen bu kanala uzmanlık alanınızı ve çalışmanızı doğrulayan kanıtları gönderiniz:\n` +
      `1. 🖼️ **Çalışma Görseli (Ekran Görüntüsü / SS):** Hangi alanda uzmansanız (GFX, 3D Model, Map/Build, Script/Sistem vb.) yaptığınız en kaliteli çalışmanın net görselini yükleyin.\n` +
      `2. 🎥 **Sahiplik & Süreç Videosu (Zorunlu):** Çalışmanın gerçekten size ait olduğunu kanıtlayan proje dosyasını (Blender, Roblox Studio, Photoshop, VS Code vb.) veya yapım sürecini gösteren kısa bir video/ekran kaydı paylaşın.\n` +
      `3. 💬 **Kısa Açıklama:** Uzmanlık alanınızı, çalışmayı ne kadar sürede yaptığınızı ve detaylarını bu kanala yazın.\n\n` +
      `---\n` +
      `### ⚖️ Yetkili Değerlendirme Esasları:\n` +
      `• **Sahiplik Kanıtı:** Yalnızca çalışmanın adaya ait olduğu video ile kesin olarak kanıtlanan projeler onaylanır.\n` +
      `• **Kalite Standardı:** Yalnızca estetik, profesyonel ve kaliteli işler onaylanır; yetersiz/basit çalışmalar onaylanmaz.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "✅ Onayla (Developer Rolü Ver)",
        custom_id: `rl_dev_verify_approve_${ticketId}`,
        emoji: { name: "🎉" }
      },
      {
        style: ButtonStyle.Danger,
        label: "❌ Reddet (Kalite / Kanıt Yetersiz)",
        custom_id: `rl_dev_verify_reject_${ticketId}`,
        emoji: { name: "🚫" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "❓ Ek Kanıt İste",
        custom_id: `rl_dev_verify_askmore_${ticketId}`,
        emoji: { name: "📑" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🗑️ Odayı Kapat",
        custom_id: `rl_dev_verify_close_${ticketId}`,
        emoji: { name: "🗑️" }
      }
    ])
  ]);

  await textChannel.send({
    content: `${staffRoleMention} ${staffMention} <@${user.id}>`,
    ...welcomePayload
  });

  const replyMsg = `✅ **Onaylı Developer Doğrulama Odanız Açıldı!**\nLütfen <#${textChannel.id}> kanalına giderek çalışma görselinizi ve sahiplik videonuzu yükleyiniz.`;
  if (interaction.editReply) {
    await interaction.editReply({ content: replyMsg });
  } else {
    await interaction.reply({ content: replyMsg, ephemeral: true });
  }

  return true;
}

/**
 * Yetkili Onaylama İşlemini Gerçekleştirir
 */
async function handleApproveDevVerification(interaction, ticketId) {
  const ticketData = activeDevTickets.get(ticketId);
  if (!ticketData) {
    return await interaction.reply({ content: '❌ Bu doğrulama oturumu bulunamadı.', ephemeral: true });
  }

  if (ticketData.userId === interaction.user?.id) {
    return await interaction.reply({
      content: '❌ Kendi geliştirici doğrulama talebinizi kendiniz onaylayamazsınız!',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const guild = interaction.guild;
  const userId = ticketData.userId;

  // Onaylı Geliştirici Rolünü Bul ve Ata
  try {
    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    if (member) {
      // Role bulma: isminde onaylı developer / geliştirici geçen rolü ara
      let devRole = guild.roles.cache.find(r => /onaylı.*(dev|geliştirici)|developer|geliştirici/i.test(r.name));
      if (devRole) {
        await member.roles.add(devRole.id, `Onaylı Developer Doğrulaması: ${interaction.user.tag}`).catch(() => {});
      }

      // DM Bildirimi
      await member.send({
        content: `🎉 **Tebrikler!** RobloxLand sunucusundaki **Onaylı Developer** portfolyonuz yetkililerimizce onaylandı!\n` +
                 `• **Onaylayan Yetkili:** <@${interaction.user.id}>\n` +
                 `• Geliştirici yetkiniz hesabınıza tanımlandı. Başarılı çalışmalar dileriz!`
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[DevVerification] Role add error:', err.message);
  }

  // Yönetim ve Log Kanalına Bildir
  try {
    const logChan = guild.channels.cache.get(STAFF_LOG_CHANNEL_ID) || 
                    await guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null) ||
                    guild.channels.cache.get(STAFF_RECRUITMENT_MGMT_CHANNEL_ID) ||
                    await guild.channels.fetch(STAFF_RECRUITMENT_MGMT_CHANNEL_ID).catch(() => null);

    if (logChan && logChan.isTextBased()) {
      await logChan.send({
        content: `⭐ **Onaylı Developer Doğrulaması Tamamlandı!**\n` +
                 `• **Geliştirici:** <@${userId}> (\`${userId}\`)\n` +
                 `• **Onaylayan Yetkili:** <@${interaction.user.id}>\n` +
                 `• **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>`
      }).catch(() => {});
    }
  } catch (_) {}

  await interaction.editReply({
    content: `✅ **<@${userId}> adlı kullanıcının Onaylı Developer başvurusu onaylandı!**\nOda 5 saniye içinde kapatılacaktır.`
  });

  setTimeout(async () => {
    try {
      const ch = guild.channels.cache.get(ticketData.textChannelId);
      if (ch) await ch.delete().catch(() => {});
      activeDevTickets.delete(ticketId);
    } catch (_) {}
  }, 5000);

  return true;
}

/**
 * Yetkili Reddetme İşlemini Gerçekleştirir
 */
async function handleRejectDevVerification(interaction, ticketId) {
  const ticketData = activeDevTickets.get(ticketId);
  if (!ticketData) {
    return await interaction.reply({ content: '❌ Bu doğrulama oturumu bulunamadı.', ephemeral: true });
  }

  if (ticketData.userId === interaction.user?.id) {
    return await interaction.reply({
      content: '❌ Kendi geliştirici doğrulama talebinizi kendiniz reddedemezsiniz!',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const guild = interaction.guild;
  const userId = ticketData.userId;

  // Adaya DM gönder
  try {
    const candidateUser = await interaction.client.users.fetch(userId).catch(() => null);
    if (candidateUser) {
      await candidateUser.send({
        content: `ℹ️ RobloxLand sunucusundaki **Onaylı Developer** doğrulama talebiniz maalesef **onaylanmamıştır**.\n` +
                 `• **Gerekçe:** Paylaşılan çalışma kalite standartlarımızı karşılamamış veya sahiplik kanıtı (video/proje dosyası) yetersiz görülmüştür.\n` +
                 `• Kendinizi geliştirerek ve eksiksiz kanıtlarla ilerleyen süreçte tekrar başvurabilirsiniz.`
      }).catch(() => {});
    }
  } catch (_) {}

  await interaction.editReply({
    content: `❌ **<@${userId}> kullanıcısının geliştirici başvurusu reddedildi.** Oda 5 saniye içinde kapatılacaktır.`
  });

  setTimeout(async () => {
    try {
      const ch = guild.channels.cache.get(ticketData.textChannelId);
      if (ch) await ch.delete().catch(() => {});
      activeDevTickets.delete(ticketId);
    } catch (_) {}
  }, 5000);

  return true;
}

/**
 * Yetkili Ek Kanıt İstediğinde
 */
async function handleAskMoreDevVerification(interaction, ticketId) {
  const ticketData = activeDevTickets.get(ticketId);
  if (!ticketData) {
    return await interaction.reply({ content: '❌ Bu doğrulama oturumu bulunamadı.', ephemeral: true });
  }

  if (ticketData.userId === interaction.user?.id) {
    return await interaction.reply({
      content: '❌ Kendi talebiniz için bu butonu kullanamazsınız!',
      ephemeral: true
    });
  }

  const userId = ticketData.userId;
  await interaction.reply({
    content: `⚠️ <@${userId}>, Yetkilimiz (<@${interaction.user.id}>) paylaştığınız kanıtları yetersiz buldu.\n` +
             `> Lütfen çalışmanın **%100 size ait olduğunu** kanıtlayan proje çalışma ekranını (Blender/Studio katmanları, timeline veya kayıt videosunu) bu kanala gönderiniz.`
  });
  return true;
}

/**
 * Yetkili Odayı Doğrudan Kapatmak İstediğinde
 */
async function handleCloseDevVerification(interaction, ticketId) {
  const ticketData = activeDevTickets.get(ticketId);
  if (!ticketData) {
    return await interaction.reply({ content: '❌ Bu doğrulama oturumu bulunamadı.', ephemeral: true });
  }

  await interaction.reply({ content: '🗑️ Doğrulama odası kapatılıyor...' });

  const guild = interaction.guild;
  setTimeout(async () => {
    try {
      const ch = guild.channels.cache.get(ticketData.textChannelId);
      if (ch) await ch.delete().catch(() => {});
      activeDevTickets.delete(ticketId);
    } catch (_) {}
  }, 3000);

  return true;
}

/**
 * Developer Doğrulama Etkileşim Yönlendiricisi
 */
async function handleDevVerificationInteraction(interaction) {
  const customId = interaction.customId;
  if (!customId) return false;

  // 1. Rol panelinden doğrulama başlatma
  if (customId === 'rl_start_dev_verification') {
    return await openDevVerificationTicket(interaction);
  }

  // 2. Yetkili kontrolü gerektiren butonlar
  if (
    customId.startsWith('rl_dev_verify_approve_') ||
    customId.startsWith('rl_dev_verify_reject_') ||
    customId.startsWith('rl_dev_verify_askmore_') ||
    customId.startsWith('rl_dev_verify_close_')
  ) {
    if (!isAuthorizedStaff(interaction.member)) {
      return await interaction.reply({
        content: '❌ Bu işlem butonunu yalnızca RobloxLand yetkilileri kullanabilir.',
        ephemeral: true
      });
    }

    const ticketId = customId
      .replace('rl_dev_verify_approve_', '')
      .replace('rl_dev_verify_reject_', '')
      .replace('rl_dev_verify_askmore_', '')
      .replace('rl_dev_verify_close_', '');

    if (customId.startsWith('rl_dev_verify_approve_')) {
      return await handleApproveDevVerification(interaction, ticketId);
    }
    if (customId.startsWith('rl_dev_verify_reject_')) {
      return await handleRejectDevVerification(interaction, ticketId);
    }
    if (customId.startsWith('rl_dev_verify_askmore_')) {
      return await handleAskMoreDevVerification(interaction, ticketId);
    }
    if (customId.startsWith('rl_dev_verify_close_')) {
      return await handleCloseDevVerification(interaction, ticketId);
    }
  }

  return false;
}

module.exports = {
  GUILD_ID,
  TICKET_CATEGORY_ID,
  STAFF_ROLE_ID,
  DESIGNATED_STAFF_ID,
  activeDevTickets,
  openDevVerificationTicket,
  handleDevVerificationInteraction,
  isAuthorizedStaff
};
