'use strict';

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
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
  EndBehaviorType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  StreamType
} = require('@discordjs/voice');
const prism = require('prism-media');
const ComponentsV2Factory = require('../utils/componentsV2Factory');

// Hedef Sabitler
const GUILD_ID = '1537407325290237973';
const AGE_VERIFY_PANEL_CHANNEL_ID = '1544023655527219330'; // Yaş doğrulama paneli kanalı
const TICKET_CATEGORY_ID = '1538466419245719663';          // Yaş tanımlama ticket kategorisi
const SENSITIVE_CATEGORY_ID = '1544024714702491648';       // 16+ Hassas kanallar kategorisi
const SENSITIVE_ROLE_ID = '1544024330005119068';           // 16+ Hassas Erişim Rolü
const STAFF_LOG_CHANNEL_ID = '1543382733408174220';        // Ses kaydı ve yetkili log kanalı
const STAFF_ROLE_ID = '1537411928585015366';               // Yetkili Rolü
const DESIGNATED_STAFF_ID = '1497600770634289194';         // Belirtilen Yetkili Kullanıcı ID

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

// Aktif ticket oturumları belleği: ticketId -> { ticketId, textChannelId, voiceChannelId, userId, staffId, isWaitingStaff, staffNotified, tekerleme, audioChunks, startTime, connection }
const activeAgeTickets = new Map();

/**
 * 16-bit PCM WAV Header oluşturucu
 */
function createWavHeader(dataLength, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
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
 * 48kHz Stereo 16-bit PCM verisini 24kHz Mono 16-bit PCM verisine dönüştürür
 * Bu sayede dosya boyutu 4 kat küçülür ve Discord dosya yükleme limitine takılmaz.
 */
function convertStereo48kToMono24k(stereoBuffer) {
  if (!stereoBuffer || stereoBuffer.length < 4) {
    return Buffer.alloc(0);
  }

  const numInputSamples = Math.floor(stereoBuffer.length / 4);
  const numOutputSamples = Math.floor(numInputSamples / 2);
  const outBuffer = Buffer.alloc(numOutputSamples * 2);

  for (let i = 0; i < numOutputSamples; i++) {
    const inOffset = i * 2 * 4;
    if (inOffset + 3 < stereoBuffer.length) {
      const left = stereoBuffer.readInt16LE(inOffset);
      const right = stereoBuffer.readInt16LE(inOffset + 2);
      const mono = Math.floor((left + right) / 2);
      outBuffer.writeInt16LE(mono, i * 2);
    }
  }

  return outBuffer;
}

/**
 * Discord voice gateway'inin çift yönlü UDP veri iletimini tetiklemesi için sessiz paket çalar
 */
function sendKeepAliveSilence(connection) {
  try {
    const player = createAudioPlayer();
    const silenceFrame = Buffer.from([0xf8, 0xff, 0xfe]);
    const silenceStream = Readable.from([silenceFrame, silenceFrame]);
    const resource = createAudioResource(silenceStream, { inputType: StreamType.Opus });
    player.play(resource);
    connection.subscribe(player);
  } catch (err) {
    console.warn('[AgeVerify] Keepalive silence warning:', err.message);
  }
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
      `2. Görevli yetkilimiz (<@${DESIGNATED_STAFF_ID}>) odaya bağlandığında bot size mikrofondan okumanız için özel bir tekerleme verecektir.\n` +
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
 * Belirtilen yetkilinin aktif / çevrimiçi olup olmadığını kontrol eder
 */
async function checkStaffActiveStatus(guild, staffId = DESIGNATED_STAFF_ID) {
  try {
    const member = guild.members.cache.get(staffId) || await guild.members.fetch(staffId).catch(() => null);
    if (!member) return { member: null, isOnline: false };

    const isOnline = Boolean(member.presence && member.presence.status !== 'offline');
    return { member, isOnline };
  } catch (_) {
    return { member: null, isOnline: false };
  }
}

/**
 * Yetkili aktif olduğunda bekleyen ticket sahiplerine ve yetkiliye DM bildirimi gönderir
 */
async function checkAndNotifyWaitingTickets(client) {
  try {
    const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
    if (!guild) return;

    const { member: staffMember, isOnline } = await checkStaffActiveStatus(guild, DESIGNATED_STAFF_ID);
    if (!isOnline) return;

    for (const [ticketId, tData] of activeAgeTickets.entries()) {
      if (tData.isWaitingStaff && !tData.staffNotified) {
        tData.staffNotified = true;
        tData.isWaitingStaff = false;

        // 1. Yetkiliye DM Gönder
        try {
          const staffUser = staffMember?.user || await client.users.fetch(DESIGNATED_STAFF_ID).catch(() => null);
          if (staffUser) {
            await staffUser.send({
              content:
                `🔔 **RobloxLand 16+ Yaş Doğrulama Talebi Bekliyor!**\n\n` +
                `👤 <@${tData.userId}> kullanıcısı sesli yaş doğrulaması için sizi bekliyor.\n` +
                `• **Yazı Kanalı:** <#${tData.textChannelId}>\n` +
                `• **Ses Kanalı:** <#${tData.voiceChannelId}>`
            }).catch(() => {});
          }
        } catch (_) {}

        // 2. Adaya DM Gönder
        try {
          const candidateUser = await client.users.fetch(tData.userId).catch(() => null);
          if (candidateUser) {
            await candidateUser.send({
              content:
                `🟢 **Yetkilimiz Aktif Oldu!**\n\n` +
                `Yetkilimiz (<@${DESIGNATED_STAFF_ID}>) şu anda aktif duruma geçti. Lütfen sesli doğrulama odanıza geçiniz:\n` +
                `• **Yazı Kanalı:** <#${tData.textChannelId}>\n` +
                `• **Ses Kanalı:** <#${tData.voiceChannelId}>`
            }).catch(() => {});
          }
        } catch (_) {}

        // 3. Ticket Kanalına Mesaj Gönder
        try {
          const txtChan = guild.channels.cache.get(tData.textChannelId) || await guild.channels.fetch(tData.textChannelId).catch(() => null);
          if (txtChan && txtChan.isTextBased()) {
            await txtChan.send({
              content: `🟢 <@${DESIGNATED_STAFF_ID}> ve <@${tData.userId}>, yetkilimiz aktif duruma geçti! Ses kanalına katılarak **🎙️ Kullanıcıdan Konuşmasını İste** adımıyla devam edebilirsiniz.`
            }).catch(() => {});
          }
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('[AgeVerify] checkAndNotifyWaitingTickets error:', err.message);
  }
}

/**
 * Paneli 1544023655527219330 kanalına yerleştirir/günceller ve presence dinleyicisini bağlar
 */
async function deployAgeVerificationPanel(client) {
  try {
    if (client && !client.__ageVerifyPresenceAttached) {
      client.__ageVerifyPresenceAttached = true;
      client.on('presenceUpdate', (oldPresence, newPresence) => {
        if (newPresence && newPresence.userId === DESIGNATED_STAFF_ID) {
          if (newPresence.status !== 'offline') {
            checkAndNotifyWaitingTickets(client).catch(() => {});
          }
        }
      });
    }

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
  const { member: staffMember, isOnline: isStaffOnline } = await checkStaffActiveStatus(guild, DESIGNATED_STAFF_ID);
  const staffMention = `<@${DESIGNATED_STAFF_ID}>`;

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
        id: DESIGNATED_STAFF_ID,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.MuteMembers
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
    staffId: DESIGNATED_STAFF_ID,
    isWaitingStaff: !isStaffOnline,
    staffNotified: isStaffOnline,
    tekerleme: null,
    audioChunks: [],
    startTime: Date.now(),
    connection: null,
    isCapturing: false,
    opusDecoder: null,
    opusStream: null
  });

  // Durum kartı metni
  const staffStatusText = isStaffOnline
    ? `🛡️ **Görevli Yetkili:** ${staffMention} (🟢 Çevrimiçi)`
    : `🛡️ **Görevli Yetkili:** ${staffMention} (🔴 Çevrimdışı)\n\n⚠️ **Yetkilimiz şu anda aktif değil.** Yetkilimiz aktif olduğunda hem kendisine hem de size DM üzerinden anında bilgilendirme iletilecektir.`;

  const controlPayload = ComponentsV2Factory.buildPayload([
    ComponentsV2Factory.text(
      `# 🎙️ 16+ YAŞ DOĞRULAMA VE SES ONAY TALEBİ (#${ticketId})\n\n` +
      `👋 **Aday:** <@${user.id}> (\`${user.tag}\`)\n` +
      `${staffStatusText}\n` +
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

  const replyMsg = isStaffOnline
    ? `✅ Yaş doğrulama talebiniz açıldı:\n• **Yazı Kanalı:** <#${textChannel.id}>\n• **Ses Kanalı:** <#${voiceChannel.id}>`
    : `✅ Yaş doğrulama talebiniz açıldı:\n• **Yazı Kanalı:** <#${textChannel.id}>\n• **Ses Kanalı:** <#${voiceChannel.id}>\n\n⚠️ **Yetkilimiz (${staffMention}) şu anda aktif değil.** Yetkilimiz aktif olduğunda hem kendisine hem de size DM üzerinden bilgilendirme iletilecektir.`;

  await interaction.editReply({ content: replyMsg });
  return true;
}

/**
 * Kullanıcı ses kanalına bağlandığında Opus stream'i çözer ve kaydeder
 */
function startAudioCapture(connection, ticketData) {
  if (!connection || !ticketData || ticketData.isCapturing) return;
  ticketData.isCapturing = true;

  try {
    sendKeepAliveSilence(connection);

    const receiver = connection.receiver;
    const userId = ticketData.userId;

    const opusStream = receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.Manual }
    });

    const decoder = new prism.opus.Decoder({
      rate: 48000,
      channels: 2,
      frameSize: 960
    });

    ticketData.opusDecoder = decoder;
    ticketData.opusStream = opusStream;

    opusStream.pipe(decoder);

    decoder.on('data', (pcmChunk) => {
      // Bellek sızıntısını ve aşırı dosya boyutunu önlemek için maksimum 3000 chunk sakla
      if (ticketData.audioChunks.length < 3000) {
        ticketData.audioChunks.push(pcmChunk);
      }
    });

    decoder.on('error', (err) => {
      console.warn(`[AgeVerify] Opus decoder warning: ${err.message}`);
    });
  } catch (err) {
    console.error('[AgeVerify] Audio capture setup error:', err.message);
  }
}

/**
 * "Kullanıcıdan Konuşmasını İste" Butonunu Yönetir
 */
async function handleAskToSpeak(interaction, ticketId) {
  const ticketData = activeAgeTickets.get(ticketId);
  if (!ticketData) {
    return await interaction.reply({ content: '❌ Bu doğrulama oturumu bulunamadı.', ephemeral: true });
  }

  if (ticketData.userId === interaction.user?.id) {
    return await interaction.reply({
      content: '❌ Kendi yaş doğrulama talebinizi kendiniz yönetemez veya onaylayamazsınız! Başka bir yetkilinin işlemi gerçekleştirmesi gerekmektedir.',
      ephemeral: true
    });
  }

  // Rastgele Tekerleme Seç
  const tekerleme = TEKERLEMELER[Math.floor(Math.random() * TEKERLEMELER.length)];
  ticketData.tekerleme = tekerleme;

  await interaction.deferReply();

  const guild = interaction.guild;
  const voiceChannel = guild.channels.cache.get(ticketData.voiceChannelId) || await guild.channels.fetch(ticketData.voiceChannelId).catch(() => null);

  // Bot Sese Katılsın ve Canlı Kayıt Başlatsın
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
      ticketData.isCapturing = false;

      if (connection.state.status === VoiceConnectionStatus.Ready) {
        startAudioCapture(connection, ticketData);
      } else {
        connection.on(VoiceConnectionStatus.Ready, () => {
          startAudioCapture(connection, ticketData);
        });
      }
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
      `*Bot <#${ticketData.voiceChannelId}> ses kanalına katıldı ve sesinizi dinleyip kaydetmeye başladı.* 🎙️🔴`
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

  if (ticketData.userId === interaction.user?.id) {
    return await interaction.reply({
      content: '❌ Kendi yaş doğrulama talebinizi kendiniz onaylayamazsınız! Başka bir yetkilinin işlemi gerçekleştirmesi gerekmektedir.',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const guild = interaction.guild;
  const client = interaction.client;
  const userId = ticketData.userId;

  // 1. Akışları ve Bot Bağlantısını Temizle
  if (ticketData.opusDecoder) {
    try { ticketData.opusDecoder.destroy(); } catch (_) {}
  }
  if (ticketData.opusStream) {
    try { ticketData.opusStream.destroy(); } catch (_) {}
  }
  if (ticketData.connection) {
    try {
      ticketData.connection.destroy();
    } catch (_) {}
  }

  // 2. Ses Kaydı Dosyası Oluştur (24kHz Mono 16-bit PCM - Kompakt & Yüksek Kalite)
  let rawPcm = Buffer.concat(ticketData.audioChunks || []);
  if (rawPcm.length === 0) {
    rawPcm = Buffer.alloc(24000 * 2 * 1.5); // 1.5 saniyelik temiz PCM
  } else {
    rawPcm = convertStereo48kToMono24k(rawPcm);
  }

  // Discord 8MB limitini aşmaması için en fazla 6 MB tut
  if (rawPcm.length > 6 * 1024 * 1024) {
    rawPcm = rawPcm.subarray(rawPcm.length - 6 * 1024 * 1024);
  }

  const wavHeader = createWavHeader(rawPcm.length, 24000, 1, 16);
  const fullWavBuffer = Buffer.concat([wavHeader, rawPcm]);
  const audioAttachment = new AttachmentBuilder(fullWavBuffer, {
    name: `yas_dogrulama_${userId}.wav`,
    description: `RobloxLand 16+ Yaş Doğrulama Ses Kaydı - ${userId}`
  });

  // 3. Log Kanalına (1543382733408174220) Güvenli Gönderim
  try {
    const logChannel = client.channels.cache.get(STAFF_LOG_CHANNEL_ID) || await client.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      const logContent =
        `🎙️ **[16+ YAŞ DOĞRULAMA SES KAYDI ONAYLANDI]**\n` +
        `• 👤 **Aday:** <@${userId}> (\`${userId}\`)\n` +
        `• 🛡️ **Onaylayan Yetkili:** <@${interaction.user.id}>\n` +
        `• 📜 **Okunan Tekerleme:** "${ticketData.tekerleme || 'Genel Sesli Mülakat'}"\n` +
        `• 📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logChannel.send({
        content: logContent,
        files: [audioAttachment]
      }).catch(async (err) => {
        console.error("[AgeVerify] File log send error, falling back to text log:", err.message);
        await logChannel.send({ content: `${logContent}\n⚠️ *(Ses kaydı dosyası Discord boyut sınırından dolayı eklenemedi)*` }).catch(() => {});
      });
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

  if (ticketData.userId === interaction.user?.id) {
    return await interaction.reply({
      content: '❌ Kendi yaş doğrulama talebinizi kendiniz reddedemez veya kapatamazsınız! Başka bir yetkilinin işlemi gerçekleştirmesi gerekmektedir.',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const guild = interaction.guild;
  const userId = ticketData.userId;

  if (ticketData.opusDecoder) {
    try { ticketData.opusDecoder.destroy(); } catch (_) {}
  }
  if (ticketData.opusStream) {
    try { ticketData.opusStream.destroy(); } catch (_) {}
  }
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

function isAuthorizedStaff(member) {
  if (!member) return false;
  const rolesList = member.roles?.cache
    ? (typeof member.roles.cache.some === 'function'
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
 * Yaş Doğrulama Etkileşim Yönlendiricisi
 */
async function handleAgeVerificationInteraction(interaction) {
  const customId = interaction.customId;
  if (!customId) return false;

  // 1. Panel Butonu (Tüm üyeler açabilir)
  if (customId === 'robloxland_open_age_ticket') {
    return await openAgeVerificationTicket(interaction);
  }

  // 2. Yetkili Kontrolü Gerektiren Ticket Yönetim Butonları
  if (
    customId.startsWith('robloxland_age_ask_speak_') ||
    customId.startsWith('robloxland_age_finish_') ||
    customId.startsWith('robloxland_age_reject_')
  ) {
    if (!isAuthorizedStaff(interaction.member)) {
      return await interaction.reply({
        content: '❌ Bu işlem butonunu yalnızca RobloxLand yetkilileri kullanabilir.',
        ephemeral: true
      });
    }

    const ticketId = customId
      .replace('robloxland_age_ask_speak_', '')
      .replace('robloxland_age_finish_', '')
      .replace('robloxland_age_reject_', '');

    const ticketData = activeAgeTickets.get(ticketId);
    if (ticketData && ticketData.userId === interaction.user?.id) {
      return await interaction.reply({
        content: '❌ Kendi yaş doğrulama talebinizi kendiniz yönetemez, onaylayamaz veya kapatamazsınız! Başka bir yetkilinin işlemi gerçekleştirmesi gerekmektedir.',
        ephemeral: true
      });
    }
  }

  // "Kullanıcıdan Konuşmasını İste" Butonu
  if (customId.startsWith('robloxland_age_ask_speak_')) {
    const ticketId = customId.replace('robloxland_age_ask_speak_', '');
    return await handleAskToSpeak(interaction, ticketId);
  }

  // "Kaydı Bitir & Onayla" Butonu
  if (customId.startsWith('robloxland_age_finish_')) {
    const ticketId = customId.replace('robloxland_age_finish_', '');
    return await handleFinishAndApprove(interaction, ticketId);
  }

  // "Reddet & Kapat" Butonu
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
  DESIGNATED_STAFF_ID,
  TEKERLEMELER,
  activeAgeTickets,
  buildAgeVerificationPanelPayload,
  deployAgeVerificationPanel,
  openAgeVerificationTicket,
  handleAgeVerificationInteraction,
  checkStaffActiveStatus,
  checkAndNotifyWaitingTickets,
  convertStereo48kToMono24k,
  createWavHeader
};
