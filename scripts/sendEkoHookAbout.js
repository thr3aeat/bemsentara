'use strict';

require('dotenv').config();

const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const { TOKEN } = require('../config');

const CHANNEL_ID = '1535332536564191413';
const WEBHOOK_NAME = 'Eko Hook';
const WEBHOOK_AVATAR = 'https://i.imgur.com/HT7bvru.png';
const HEADER_BANNER = 'https://i.imgur.com/6ZC1SXO.png';

async function sendAboutWebhook() {
  if (!TOKEN) {
    console.error('❌ TOKEN bulunamadı!');
    process.exit(1);
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
  });

  client.once('ready', async () => {
    console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);

    try {
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (!channel) {
        console.error(`❌ Kanal bulunamadı: ${CHANNEL_ID}`);
        process.exit(1);
      }

      console.log(`📌 Hedef Kanal: #${channel.name} (${channel.id})`);

      // Webhook bul veya oluştur
      let webhooks = await channel.fetchWebhooks().catch(() => null);
      let webhook = webhooks ? webhooks.find(w => w.name === WEBHOOK_NAME) : null;

      if (!webhook) {
        console.log(`⚙️ Webhook "${WEBHOOK_NAME}" oluşturuluyor...`);
        webhook = await channel.createWebhook({
          name: WEBHOOK_NAME,
          avatar: WEBHOOK_AVATAR,
          reason: 'EkoYıldız Resmi Hakkında Duyurusu'
        });
      } else {
        // Avatarı güncelle
        await webhook.edit({
          name: WEBHOOK_NAME,
          avatar: WEBHOOK_AVATAR
        }).catch(() => {});
      }

      // Embed hazırlığı (Görseldekinin birebir tasarımı)
      const embed = new EmbedBuilder()
        .setColor(0x2b2d31) // Discord koyu tema rengi
        .setImage(HEADER_BANNER)
        .setDescription(
          `# Hakkında\n\n` +
          `> EkoYıldız, Eko tarafından özgün içerikler üretmek ve dijital yayıncılık alanında sürdürülebilir bir topluluk yapısı inşa etmek amacıyla hayata geçirilmiş bir YouTube kanalıdır.\n>\n` +
          `> Bu ekosistemin merkezinde yer alan EkoYıldız Discord Topluluğu ise, başta EkoYıldız olmak üzere bünyesinde barındırdığı tüm dijital kanalların içerik yönetimini, operasyonel süreçlerini ve topluluk düzenini profesyonel standartlarda yürütmek amacıyla kurulmuştur. Topluluğumuz; üyeler arasındaki etkileşimi güvenli, seviyeli ve dinamik bir yapıda tutmayı, içerik üretim süreçlerinin verimliliğini artırmayı ve dijital varlığımızın kurumsal bütünlüğünü korumayı temel misyonu olarak benimsemektedir.\n\n` +
          `Bu sunucu Youtube kanalı ve Roblox Türkiye üzerine kurulmuştur. Roblox Türkiye ile alakalı işbirlikleri için <#1518692475189854218> kanalına gidin.\n\n` +
          `───────────────────────────────────────────────\n` +
          `**Bağlantılarımız**`
        )
        .setFooter({ text: '14 Nisan 2024 tarihinde kuruldu.' });

      // ActionRow 1: Dijital Kanallar (Components v2)
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('YouTube Ana Kanal')
          .setURL('https://www.youtube.com/@eko8yildiz')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔴'),
        new ButtonBuilder()
          .setLabel('YouTube 2. Kanal')
          .setURL('https://www.youtube.com/@eko8yildiz2')
          .setStyle(ButtonStyle.Link)
          .setEmoji('📺'),
        new ButtonBuilder()
          .setLabel('Kick Canlı Yayın')
          .setURL('https://kick.com/ekoyildiz')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🟢')
      );

      // ActionRow 2: Sosyal Medya ve Destek
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Twitch')
          .setURL('https://www.twitch.tv/ekoyildiz')
          .setStyle(ButtonStyle.Link)
          .setEmoji('💜'),
        new ButtonBuilder()
          .setLabel('Instagram')
          .setURL('https://www.instagram.com/ekonqt/')
          .setStyle(ButtonStyle.Link)
          .setEmoji('📸'),
        new ButtonBuilder()
          .setLabel('TikTok')
          .setURL('https://www.tiktok.com/@kimdirbueko')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🎵'),
        new ButtonBuilder()
          .setLabel('Bize Ulaşın / İletişim')
          .setURL('https://ptb.discord.com/channels/1367646464804655104/1518692475189854218')
          .setStyle(ButtonStyle.Link)
          .setEmoji('📩')
      );

      console.log('🚀 Webhook mesajı gönderiliyor...');
      await webhook.send({
        username: WEBHOOK_NAME,
        avatarURL: WEBHOOK_AVATAR,
        embeds: [embed],
        components: [row1, row2]
      });

      console.log('✅ Webhook mesajı başarıyla gönderildi!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Gönderim sırasında hata:', err);
      process.exit(1);
    }
  });

  await client.login(TOKEN);
}

sendAboutWebhook();
