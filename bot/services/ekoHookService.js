'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { appMeta, saveStoreNow } = require('../../models/Store');

const CHANNEL_ID = '1535332536564191413';
const WEBHOOK_NAME = 'Eko Hook';
const WEBHOOK_AVATAR = 'https://i.imgur.com/HT7bvru.png';
const HEADER_BANNER = 'https://i.imgur.com/6ZC1SXO.png';

/**
 * Creates, fetches, or edits the existing Webhook "Eko Hook" message with Components v2
 */
async function sendEkoHookAbout(client, targetChannelId = CHANNEL_ID, options = {}) {
  try {
    const channel = await client.channels.fetch(targetChannelId).catch(() => null);
    if (!channel) {
      console.error(`[EkoHookService] ❌ Kanal bulunamadı: ${targetChannelId}`);
      return false;
    }

    console.log(`[EkoHookService] 📌 Target channel: #${channel.name} (${channel.id})`);

    // Webhook bul veya oluştur
    let webhooks = await channel.fetchWebhooks().catch(() => null);
    let webhook = webhooks ? webhooks.find(w => w.name === WEBHOOK_NAME) : null;

    if (!webhook) {
      console.log(`[EkoHookService] ⚙️ Webhook "${WEBHOOK_NAME}" oluşturuluyor...`);
      webhook = await channel.createWebhook({
        name: WEBHOOK_NAME,
        avatar: WEBHOOK_AVATAR,
        reason: 'EkoYıldız Resmi Hakkında Webhook Duyurusu'
      }).catch((err) => {
        console.error('[EkoHookService] Webhook oluşturma hatası:', err.message);
        return null;
      });
    } else {
      await webhook.edit({
        name: WEBHOOK_NAME,
        avatar: WEBHOOK_AVATAR
      }).catch(() => { });
    }

    // Embed hazırlığı (Void Hook düzenine birebir uyumlu)
    const bannerUrl = options.banner || HEADER_BANNER;

    // Void Hook stili metin yapısı
    const descriptionText = options.description || (
      `───────────────────────────────────────────────\n` +
      `### Hakkında\n\n` +
      `> EkoYıldız, Eko tarafından özgün içerikler üretmek ve dijital yayıncılık alanında sürdürülebilir bir topluluk yapısı inşa etmek amacıyla hayata geçirilmiş bir YouTube kanalıdır. Bu ekosistemin merkezinde yer alan EkoYıldız Discord Topluluğu ise, başta EkoYıldız olmak üzere bünyesinde barındırdığı tüm dijital kanalların içerik yönetimini, operasyonel süreçlerini ve topluluk düzenini profesyonel standartlarda yürütmek amacıyla kurulmuştur.\n` +
      `> Amacımız, üyeler arasındaki etkileşimi güvenli, seviyeli ve dinamik bir yapıda tutmayı, içerik üretim süreçlerinin verimliliğini artırmayı ve dijital varlığımızın kurumsal bütünlüğünü korumaktır.\n\n` +
      `Bu sunucu YouTube kanalı ve Roblox Türkiye üzerine kurulmuştur. Roblox Türkiye ile alakalı işbirlikleri için <#1518692475189854218> kanalına gidin.\n\n` +
      `───────────────────────────────────────────────\n` +
      `**Bağlantılarımız**\n` +
      `🔴 📺 🟢 🟣 📸 🎵 📩\n\n` +
      `───────────────────────────────────────────────\n` +
      `14 Nisan 2024 tarihinde kuruldu.`
    );

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31) // Void Hook ile aynı koyu tema rengi
      .setImage(bannerUrl) // Afiş görseli tam en üstte
      .setDescription(descriptionText);

    // ActionRow 1: Yayın ve Video Platformları (Components v2)
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
        .setEmoji('🟢'),
      new ButtonBuilder()
        .setLabel('Twitch')
        .setURL('https://www.twitch.tv/ekoyildiz')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🟣')
    );

    // ActionRow 2: Sosyal Medya ve İletişim (Components v2)
    const row2 = new ActionRowBuilder().addComponents(
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

    // Persisted message tracking
    let metaRecord = appMeta ? appMeta.findOne({ key: 'ekoHookConfig' }) : null;
    let existingMsg = null;

    if (webhook && metaRecord && metaRecord.messageId && !options.forceNew) {
      existingMsg = await webhook.fetchMessage(metaRecord.messageId).catch(() => null);
    }

    if (webhook && existingMsg) {
      console.log(`[EkoHookService] ✏️ Existing Webhook message found (${existingMsg.id}). Editing message...`);
      await webhook.editMessage(existingMsg.id, {
        username: WEBHOOK_NAME,
        avatarURL: WEBHOOK_AVATAR,
        embeds: [embed],
        components: [row1, row2]
      });
      console.log('[EkoHookService] ✅ Existing Webhook message updated successfully to Components v2.');
      return true;
    }

    // Otherwise send new message and store ID
    let sentMsg = null;
    if (webhook) {
      sentMsg = await webhook.send({
        username: WEBHOOK_NAME,
        avatarURL: WEBHOOK_AVATAR,
        embeds: [embed],
        components: [row1, row2]
      });
    } else {
      sentMsg = await channel.send({
        embeds: [embed],
        components: [row1, row2]
      });
    }

    if (sentMsg && appMeta) {
      if (!metaRecord) {
        appMeta.create({
          key: 'ekoHookConfig',
          messageId: sentMsg.id,
          channelId: targetChannelId
        });
      } else {
        metaRecord.messageId = sentMsg.id;
        metaRecord.channelId = targetChannelId;
        metaRecord.save();
      }
      saveStoreNow();
    }

    console.log('[EkoHookService] ✅ Eko Hook message dispatched and ID recorded.');
    return true;
  } catch (err) {
    console.error('[EkoHookService] ❌ Error:', err.message);
    return false;
  }
}

module.exports = { sendEkoHookAbout, CHANNEL_ID };