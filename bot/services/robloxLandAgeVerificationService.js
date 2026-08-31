'use strict';

const fs = require('fs');
const path = require('path');
const {
  ChannelType,
  PermissionFlagsBits,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  AttachmentBuilder
} = require('discord.js');
const {
  joinVoiceChannel,
  getVoiceConnection,
  EndBehaviorType
} = require('@discordjs/voice');
const ComponentsV2Factory = require('../utils/componentsV2Factory');

// Hedef Sabitler
const GUILD_ID = '1537407325290237973';
const AGE_VERIFY_PANEL_CHANNEL_ID = '1544023655527219330'; // Yaş doğrulama paneli kanalı
const TICKET_CATEGORY_ID = '1538466419245719663';          // Yaş tanımlama ticket kategorisi
const SENSITIVE_CATEGORY_ID = '1544024714702491648';       // 16+ Hassas kanallar kategorisi
const SENSITIVE_ROLE_ID = '1544024330005119068';           // 16+ Hassas Erişim Rolü
const STAFF_LOG_CHANNEL_ID = '1543382733408174220';        // Ses kaydı ve yetkili log kanalı
const STAFF_ROLE_ID = '1537411928585015366';               // Yetkili Rolü

// Zengin Türkçe Tekerleme Havuzu
const TEKERLEMELER = [
  "Şu köşe yaz köşesi, şu köşe kış köşesi, ortadaki su şişesi.",
  "Bir berber bir berbere bre berber beri gel diye bar bar bağırmış.",
  "Al bu takatukaları takatukacıya takatukalat konsepte takatukalatmazsa takatukaları takatukalatmadan geri getir.",
  "Çatalca'da topal çoban çatal yapıp çatal satar, nesi için çatalca'da topal çoban çatal yapıp çatal satar? Kârı için çatalca'da topal çoban çatal yapıp çatal satar.",
  "Dört deryanın deresini dörtyüz dört dertli dedeye devreden derici Derviş.",
  "O piknikçi bu piknikçi şu piknikçi, piknikte pipetle pirinçli püre yiyen piknikçi.",
  "Sizin damda var beş boz başlı beş boz ördek, bizim damda var beş boz başlı beş boz ördek.",
  "Gece penceredeki tekir kedi kendi kendine mırıldandı.",
  "Şemsi Paşa Pasajı'nda sesi büzüşesiceler.",
  "Gül dibi bülbül dili gibi, gül dibi bülbül dili.",
  "Kırk küp, kırkının da kulpu kırık kara küp.",
  "Pireli peyniri perhizli pireler yerse pireli peynir de pürüzsüzleşir.",
  "İbiş'le Memiş mahkemeye gitmiş, mahkemeleşmiş mi mahkemeleşmemiş mi?",
  "Kartal kalkar dal sarkar, dal sarkar kartal kalkar.",
  "Değirmene girdi köpek, değirmenci vurdu kötek; hem kepek yedi köpek, hem kötek yedi köpek."
];

// Aktif ticket oturumları belleği: ticketId -> { textChannelId, voiceChannelId, userId, staffId, tekerleme, chunks, startTime, connection }
const activeAgeTickets = new Map();

/**
 * 48kHz Stereo 16-bit PCM WAV Header oluşturucu
 */
function createWavHeader(dataLength, sampleRate = 48000, numChannels = 2, bitDepth = 16) {
  const buffer = Buffer.alloc(44);
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

/**
 * 1544023655527219330 kanalına gönderilecek Components V2 Yaş Doğrulama Paneli
 */
function buildAgeVerificationPanelPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 🔒 ROBLOXLND — HASSAS KANALLARA ERİŞİM & YAŞ DOĞRULAMA\n\n` +
      `Hassas kanallara erişmek için bu kanaldan ticket oluşturabilirsiniz. Eğer 16 yaşından üstün değilseniz ve mikrofonunuzu açamıyorsanız lütfen oluşturmayın gereksiz yere oluşturanlar yaptırımlarla karşılaşacaktır!\n\n` +
      `### 🎙️ Doğrulama Süreci Nasıl İşler?\n` +
      `1. Aşağıdaki **🔒 16+ Yaş Doğrulama Talebi Aç** butonuna basarak size özel sesli onay odası açın.\n` +
      `2. Aktif yetkilimiz odaya bağlandığında bot size mikrofondan okumanız için özel bir tekerleme verecektir.\n` +
      `3. Tekerlemeyi net bir şekilde sesli okuduğunuzda yetkili kaydı onaylayacak ve **16+ Hassas Erişim Rolü** hesabınıza otomatik tanımlanacaktır.\n` +
      `4. Onay sonrası bu panel gizlenecek ve tüm hassas kanallar erişiminize açılacaktır.\n\n` +
      `-# ⚠️ Ses kayıtları güvenlik ve denetim amacıyla log kanalında arşivlenir.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🔒 16+ Yaş Doğrulama Talebi Aç",
        custom_id: "robloxland_open_age_ticket",
        emoji: { name: "🎙️" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

/**
 * Paneli 1544023655527219330 kanalına yerleştirir/günceller
 */
async function deployAgeVerificationPanel(client) {
  try {
    const channel = client.channels.cache.get(AGE_VERIFY_PANEL_CHANNEL_ID) || await client.channels.fetch(AGE_VERIFY_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return false;

    const payload = buildAgeVerificationPanelPayload();
    const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    const botMsg = messages?.find(m => m.author.id === client.user.id);

    if (botMsg) {
      await botMsg.edit(payload).catch(err => console.error("[AgeVerify] edit error:", err.message));
    } else {
      await channel.send(payload).catch(err => console.error("[AgeVerify] send error:", err.message));
    }
    return true;
  } catch (err) {
    console.error("[AgeVerify] Deploy error:", err.message);
    return false;
  }
}

/**
 * Aktif / Çevrimiçi Yetkiliyi Bulur
 */
async function findActiveStaffMember(guild) {
  try {
    const members = await guild.members.fetch().catch(() => guild.members.cache);
    const staffMembers = members.filter(m => 
      !m.user.bot && (
        m.roles.cache.has(STAFF_ROLE_ID) ||
        m.permissions.has(PermissionFlagsBits.ManageGuild) ||
        m.permissions.has(PermissionFlagsBits.ModerateMembers)
      )
    );

    // Çevrimiçi olanları önceliklendir (online, idle, dnd)
    const onlineStaff = staffMembers.find(m => m.presence && m.presence.status !== 'offline');
    if (onlineStaff) return onlineStaff;

    return staffMembers.first() || null;
  } catch (_) {
    return null;
  }
}

/**
 * 16+ Yaş Doğrulama Ticket'ı Açar (Yazı ve Özel Ses Kanalı ile)
 */
async function openAgeVerificationTicket(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;
  const member = interaction.member;

  // Zaten rolü varsa uyar
  if (member.roles.cache.has(SENSITIVE_ROLE_ID)) {
    return await interaction.reply({
      content: '✅ Zaten 16+ Hassas Erişim Rolüne sahipsiniz!',
      ephemeral: true
    });
  }

  // Kullanıcının açık talebi var mı kontrol et
  for (const [tId, tData] of activeAgeTickets.entries()) {
    if (tData.userId === user.id) {
      return await interaction.reply({
        content: `⚠️ Zaten açık bir yaş doğrulama talebiniz bulunuyor: <#${tData.textChannelId}>`,
        ephemeral: true
      });
    }
  }

  await interaction.deferReply({ ephemeral: true });

  const ticketId = `yas-${Date.now().toString().slice(-4)}`;
  const activeStaff = await findActiveStaffMember(guild);
  const staffMention = activeStaff ? `<@${activeStaff.id}>` : `<@&${STAFF_ROLE_ID}>`;

  // 1. Özel Metin Kanalı Oluştur
  const textChannel = await guild.channels.create({
    name: `yas-onay-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
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
          PermissionFlagsBits.AttachFiles
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
      ...(activeStaff ? [{
        id: activeStaff.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }] : []),
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
    console.error("[AgeVerify] Text channel create error:", err.message);
    return null;
  });

  if (!textChannel) {
    return await interaction.editReply({ content: '❌ Ticket metin kanalı oluşturulamadı.' });
  }

  // 2. Özel Ses Kanalı Oluştur (Sadece Kullanıcı, Yetkili ve Bot)
  const voiceChannel = await guild.channels.create({
    name: `🎙️ Sesli Onay - ${user.username}`,
    type: ChannelType.GuildVoice,
    parent: TICKET_CATEGORY_ID,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak
        ]
      },
      {
        id: STAFF_ROLE_ID,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.MuteMembers
        ]
      },
      ...(activeStaff ? [{
        id: activeStaff.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak
        ]
      }] : []),
      ...(interaction.client.user?.id ? [{
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.ManageChannels
        ]
      }] : [])
    ]
  }).catch(err => {
    console.error("[AgeVerify] Voice channel create error:", err.message);
    return null;
  });

  if (!voiceChannel) {
    await textChannel.delete().catch(() => {});
    return await interaction.editReply({ content: '❌ Ticket ses kanalı oluşturulamadı.' });
  }

  // Belleğe kaydet
  activeAgeTickets.set(ticketId, {
    ticketId,
    textChannelId: textChannel.id,
    voiceChannelId: voiceChannel.id,
    userId: user.id,
    staffId: activeStaff?.id || null,
    tekerleme: null,
    audioChunks: [],
    startTime: Date.now(),
    connection: null
  });

  // Metin kanalına yetkili ve adayı etiketleyerek kontrol paneli gönder
  const controlPayload = ComponentsV2Factory.buildPayload([
    ComponentsV2Factory.text(
      `# 🎙️ 16+ YAŞ DOĞRULAMA VE SES ONAY TALEBİ (#${ticketId})\n\n` +
      `👋 **Aday:** <@${user.id}> (\`${user.tag}\`)\n` +
      `🛡️ **Görevli Yetkili:** ${staffMention}\n` +
      `🔊 **Özel Ses Kanalı:** <#${voiceChannel.id}>\n\n` +
      `### 📌 İşlem Adımları:\n` +
      `1. Hem aday <@${user.id}> hem de yetkili <#${voiceChannel.id}> ses odasına katılsın.\n` +
      `2. Yetkili aşağıdaki **🎙️ Kullanıcıdan Konuşmasını İste** butonuna tıklasın.\n` +
      `3. Bot sese katılarak adaya sesli okuması için rastgele bir tekerleme verecek ve konuşmayı kaydedecektir.\n` +
      `4. Okuma tamamlandığında **⏹️ Kaydı Bitir & Onayla** butonuna basınız.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Primary,
        label: "🎙️ Kullanıcıdan Konuşmasını İste",
        custom_id: `robloxland_age_ask_speak_${ticketId}`,
        emoji: { name: "🗣️" }
      },
      {
        style: ButtonStyle.Success,
        label: "⏹️ Kaydı Bitir & Onayla",
        custom_id: `robloxland_age_finish_${ticketId}`,
        emoji: { name: "✅" }
      },
      {
        style: ButtonStyle.Danger,
        label: "❌ Reddet & Kapat",
        custom_id: `robloxland_age_reject_${ticketId}`,
        emoji: { name: "🗑️" }
      }
    ])
  ]);

  await textChannel.send({
    content: `${staffMention} <@${user.id}>`,
    ...controlPayload
  });

  await interaction.editReply({
    content: `✅ Yaş doğrulama talebiniz açıldı:\n• **Yazı Kanalı:** <#${textChannel.id}>\n• **Ses Kanalı:** <#${voiceChannel.id}>`
  });
  return true;
}

/**
 * "Kullanıcıdan Konuşmasını İste" Butonunu Yönetir
 */
async function handleAskToSpeak(interaction, ticketId) {
  const ticketData = activeAgeTickets.get(ticketId);
  if (!ticketData) {
    return await interaction.reply({ content: '❌ Bu doğrulama oturumu bulunamadı.', ephemeral: true });
  }

  // Rastgele Tekerleme Seç
  const tekerleme = TEKERLEMELER[Math.floor(Math.random() * TEKERLEMELER.length)];
  ticketData.tekerleme = tekerleme;

  await interaction.deferReply();

  const guild = interaction.guild;
  const voiceChannel = guild.channels.cache.get(ticketData.voiceChannelId) || await guild.channels.fetch(ticketData.voiceChannelId).catch(() => null);

  // Bot Sese Katılsın ve Kayıt Başlatsın
  let connection = null;
  try {
    if (voiceChannel) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });

      ticketData.connection = connection;
      ticketData.audioChunks = [];

      // Kullanıcının sesini dinle ve kaydet
      const receiver = connection.receiver;
      const audioStream = receiver.subscribe(ticketData.userId, {
        end: {
          behavior: EndBehaviorType.Manual
        }
      });

      audioStream.on('data', (chunk) => {
        ticketData.audioChunks.push(chunk);
      });

      audioStream.on('error', (err) => {
        console.warn(`[AgeVerify] Audio stream warning: ${err.message}`);
      });
    }
  } catch (voiceErr) {
    console.error('[AgeVerify] Join voice error:', voiceErr.message);
  }

  // Metin kanalına tekerleme kartını gönder
  const tekerlemePayload = ComponentsV2Factory.buildPayload([
    ComponentsV2Factory.text(
      `# 📜 16+ YAŞ DOĞRULAMA SESLİ OKUMA TESTİ\n\n` +
      `👤 **Aday:** <@${ticketData.userId}>\n\n` +
      `Lütfen mikrofonunuzu açarak aşağıdaki tekerlemeyi tane tane ve sesli bir şekilde okuyunuz:\n\n` +
      `> 🗣️ **"${tekerleme}"**\n\n` +
      `*Bot <#${ticketData.voiceChannelId}> ses kanalına katıldı ve kaydı başlattı.* 🎙️🔴`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "⏹️ Kaydı Bitir & Onayla",
        custom_id: `robloxland_age_finish_${ticketId}`,
        emoji: { name: "✅" }
      },
      {
        style: ButtonStyle.Danger,
        label: "❌ Reddet",
        custom_id: `robloxland_age_reject_${ticketId}`,
        emoji: { name: "🚫" }
      }
    ])
  ]);

  await interaction.editReply(tekerlemePayload);
  return true;
}

/**
 * "Kaydı Bitir & Onayla" Butonunu Yönetir
 */
async function handleFinishAndApprove(interaction, ticketId) {
  const ticketData = activeAgeTickets.get(ticketId);
  if (!ticketData) {
    return await interaction.reply({ content: '❌ Bu doğrulama oturumu bulunamadı.', ephemeral: true });
  }

  await interaction.deferReply();

  const guild = interaction.guild;
  const client = interaction.client;
  const userId = ticketData.userId;

  // 1. Bot sesten ayrılsın
  if (ticketData.connection) {
    try {
      ticketData.connection.destroy();
    } catch (_) {}
  }

  // 2. Ses Kaydı Dosyası Oluştur (WAV)
  let rawPcm = Buffer.concat(ticketData.audioChunks || []);
  if (rawPcm.length === 0) {
    // Eğer opus decode edilmeden doğrudan paket gelmediyse 1 saniyelik temiz sessiz PCM oluştur
    rawPcm = Buffer.alloc(48000 * 2 * 2);
  }

  const wavHeader = createWavHeader(rawPcm.length);
  const fullWavBuffer = Buffer.concat([wavHeader, rawPcm]);
  const audioAttachment = new AttachmentBuilder(fullWavBuffer, {
    name: `yas_dogrulama_${userId}.wav`,
    description: `RobloxLand 16+ Yaş Doğrulama Ses Kaydı - ${userId}`
  });

  // 3. Log Kanalına (1543382733408174220) Gönder
  try {
    const logChannel = client.channels.cache.get(STAFF_LOG_CHANNEL_ID) || await client.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({
        content:
          `🎙️ **[16+ YAŞ DOĞRULAMA SES KAYDI ONAYLANDI]**\n` +
          `• 👤 **Aday:** <@${userId}> (\`${userId}\`)\n` +
          `• 🛡️ **Onaylayan Yetkili:** <@${interaction.user.id}>\n` +
          `• 📜 **Okunan Tekerleme:** "${ticketData.tekerleme || 'Genel Sesli Mülakat'}"\n` +
          `• 📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        files: [audioAttachment]
      }).catch(err => console.error("[AgeVerify] Log send error:", err.message));
    }
  } catch (logErr) {
    console.error("[AgeVerify] Log error:", logErr.message);
  }

  // 4. Kullanıcıya Rol Ver: 1544024330005119068
  try {
    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    if (member) {
      await member.roles.add(SENSITIVE_ROLE_ID, '16+ Yaş Doğrulama Başarılı').catch(() => {});

      // 5. 1544023655527219330 kanalını artık göremesin
      const panelChannel = guild.channels.cache.get(AGE_VERIFY_PANEL_CHANNEL_ID) || await guild.channels.fetch(AGE_VERIFY_PANEL_CHANNEL_ID).catch(() => null);
      if (panelChannel) {
        await panelChannel.permissionOverwrites.create(userId, {
          ViewChannel: false
        }, { reason: '16+ Doğrulandı, Panel Gizlendi' }).catch(() => {});
      }

      // 6. 1544024714702491648 kategorisindeki hassas kanalları görebilsin
      const sensitiveCategory = guild.channels.cache.get(SENSITIVE_CATEGORY_ID) || await guild.channels.fetch(SENSITIVE_CATEGORY_ID).catch(() => null);
      if (sensitiveCategory) {
        await sensitiveCategory.permissionOverwrites.create(userId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        }, { reason: '16+ Yaş Doğrulama Onayı' }).catch(() => {});
      }

      // DM ile bilgilendir
      await member.send({
        content: `🎉 **Tebrikler!** RobloxLand **16+ Yaş Doğrulamanız** yetkililerimizce onaylandı!\n` +
                 `• **1544024330005119068** Hassas Erişim Rolü hesabınıza tanımlandı.\n` +
                 `• Tüm hassas kanallar erişiminize açıldı. İyi eğlenceler dileriz!`
      }).catch(() => {});
    }
  } catch (roleErr) {
    console.error('[AgeVerify] Role/Permission update error:', roleErr.message);
  }

  await interaction.editReply({
    content: `✅ **<@${userId}> için 16+ Yaş Doğrulaması Onaylandı!**\n` +
             `• Rol verildi: <@&${SENSITIVE_ROLE_ID}>\n` +
             `• Ses kaydı <#${STAFF_LOG_CHANNEL_ID}> kanalına arşivlendi.\n` +
             `• Bu doğrulama odaları 5 saniye içinde kapatılacaktır.`
  });

  // Odaları temizle
  setTimeout(async () => {
    try {
      const txt = guild.channels.cache.get(ticketData.textChannelId);
      const vc = guild.channels.cache.get(ticketData.voiceChannelId);
      if (txt) await txt.delete().catch(() => {});
      if (vc) await vc.delete().catch(() => {});
      activeAgeTickets.delete(ticketId);
    } catch (_) {}
  }, 5000);

  return true;
}

/**
 * "Reddet & Kapat" Butonunu Yönetir
 */
async function handleRejectAgeVerification(interaction, ticketId) {
  const ticketData = activeAgeTickets.get(ticketId);
  if (!ticketData) {
    return await interaction.reply({ content: '❌ Bu doğrulama oturumu bulunamadı.', ephemeral: true });
  }

  await interaction.deferReply();

  const guild = interaction.guild;
  const userId = ticketData.userId;

  if (ticketData.connection) {
    try { ticketData.connection.destroy(); } catch (_) {}
  }

  try {
    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    if (member) {
      await member.send({
        content: `❌ RobloxLand 16+ Yaş Doğrulama başvurunuz yetkili tarafından uygun görülmeyerek reddedildi.`
      }).catch(() => {});
    }
  } catch (_) {}

  await interaction.editReply({
    content: `🚫 **Başvuru reddedildi.** Odalar 5 saniye içinde silinecektir.`
  });

  setTimeout(async () => {
    try {
      const txt = guild.channels.cache.get(ticketData.textChannelId);
      const vc = guild.channels.cache.get(ticketData.voiceChannelId);
      if (txt) await txt.delete().catch(() => {});
      if (vc) await vc.delete().catch(() => {});
      activeAgeTickets.delete(ticketId);
    } catch (_) {}
  }, 5000);

  return true;
}

/**
 * Yaş Doğrulama Etkileşim Yönlendiricisi
 */
async function handleAgeVerificationInteraction(interaction) {
  const customId = interaction.customId;
  if (!customId) return false;

  // 1. Panel Butonu
  if (customId === 'robloxland_open_age_ticket') {
    return await openAgeVerificationTicket(interaction);
  }

  // 2. "Kullanıcıdan Konuşmasını İste" Butonu
  if (customId.startsWith('robloxland_age_ask_speak_')) {
    const ticketId = customId.replace('robloxland_age_ask_speak_', '');
    return await handleAskToSpeak(interaction, ticketId);
  }

  // 3. "Kaydı Bitir & Onayla" Butonu
  if (customId.startsWith('robloxland_age_finish_')) {
    const ticketId = customId.replace('robloxland_age_finish_', '');
    return await handleFinishAndApprove(interaction, ticketId);
  }

  // 4. "Reddet & Kapat" Butonu
  if (customId.startsWith('robloxland_age_reject_')) {
    const ticketId = customId.replace('robloxland_age_reject_', '');
    return await handleRejectAgeVerification(interaction, ticketId);
  }

  return false;
}

module.exports = {
  GUILD_ID,
  AGE_VERIFY_PANEL_CHANNEL_ID,
  TICKET_CATEGORY_ID,
  SENSITIVE_CATEGORY_ID,
  SENSITIVE_ROLE_ID,
  STAFF_LOG_CHANNEL_ID,
  TEKERLEMELER,
  buildAgeVerificationPanelPayload,
  deployAgeVerificationPanel,
  openAgeVerificationTicket,
  handleAgeVerificationInteraction,
  createWavHeader
};
