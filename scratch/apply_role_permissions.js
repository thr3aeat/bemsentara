const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1367646464804655104'; // EkoYıldız
const ROLE_ID = '1546577772724359239';  // 👑Video Ekibi

// Özel ses kanalları listesi
const SPECIAL_VOICE_CHANNELS = [
  { id: '1545830225999569027', name: '🔉VİDEO', fullVoiceChat: true },
  { id: '1518692538595283185', name: '🖥️  Yayın', fullVoiceChat: true },
  { id: '1535296197017997343', name: "9.813+ adet Ekocan'ın evi.", fullVoiceChat: false },
  { id: '1524349090664550541', name: '🔉  Ofis', fullVoiceChat: false },
  { id: '1518692536062050516', name: '⚔️  Operasyon', fullVoiceChat: false },
  { id: '1518692531875872799', name: '🔉  Sesli Oda 1', fullVoiceChat: false }
];

client.on('ready', async () => {
  console.log(`[Bot Ready] ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      console.error(`Guild ${GUILD_ID} bulunamadı!`);
      process.exit(1);
    }

    const role = await guild.roles.fetch(ROLE_ID);
    if (!role) {
      console.error(`Rol ${ROLE_ID} bulunamadı!`);
      process.exit(1);
    }

    console.log(`[Rol Bulundu] "${role.name}" (${role.id})`);

    // 1. Ortalama, güvenli, sunucuyu patlatmayacak rol yetkileri
    const safeAveragePermissions = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.SendMessagesInThreads,
      PermissionFlagsBits.CreatePublicThreads,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.UseExternalEmojis,
      PermissionFlagsBits.UseExternalStickers,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.UseApplicationCommands,
      PermissionFlagsBits.CreateInstantInvite,
      PermissionFlagsBits.ChangeNickname,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.Stream,
      PermissionFlagsBits.UseVAD,
      PermissionFlagsBits.PrioritySpeaker,
      PermissionFlagsBits.RequestToSpeak,
      PermissionFlagsBits.UseSoundboard,
      PermissionFlagsBits.UseExternalSounds,
      PermissionFlagsBits.UseEmbeddedActivities,
    ];

    console.log(`Rol yetkileri güncelleniyor...`);
    await role.setPermissions(safeAveragePermissions, 'Video Ekibi için ortalama ve güvenli yetkiler tanımlandı.');
    console.log(`✅ Rol yetkileri başarıyla güncellendi! Yeni izin sayısı: ${safeAveragePermissions.length}`);

    // 2. Özel ses kanallarına giriş ve kullanım izinleri
    console.log(`\nÖzel ses kanallarına izin tanımlanıyor...`);
    for (const item of SPECIAL_VOICE_CHANNELS) {
      try {
        const channel = await guild.channels.fetch(item.id).catch(() => null);
        if (!channel) {
          console.warn(`⚠️ Kanal bulunamadı: ${item.name} (${item.id})`);
          continue;
        }

        const overwrites = {
          ViewChannel: true,
          Connect: true,
          Speak: true,
          Stream: true,
          UseVAD: true,
          UseSoundboard: true,
          UseExternalSounds: true,
          RequestToSpeak: true,
        };

        if (item.fullVoiceChat) {
          overwrites.PrioritySpeaker = true;
          overwrites.SendMessages = true;
          overwrites.AttachFiles = true;
          overwrites.EmbedLinks = true;
          overwrites.AddReactions = true;
        }

        await channel.permissionOverwrites.edit(role, overwrites, {
          reason: `Video Ekibi rolüne (${role.name}) özel ses kanalına erişim izni verildi.`
        });

        console.log(`✅ ${channel.name} (${channel.id}) izni başarıyla verildi.`);
      } catch (chErr) {
        console.error(`❌ ${item.name} izni verilirken hata:`, chErr.message);
      }
    }

    console.log(`\n🎉 Tüm işlemler başarıyla tamamlandı!`);
  } catch (err) {
    console.error('Genel Hata:', err);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.TOKEN);
