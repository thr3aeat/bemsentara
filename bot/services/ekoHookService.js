'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const { appMeta, saveStoreNow } = require('../../models/Store');

const CHANNEL_ID = '1535332536564191413';
const WEBHOOK_NAME = 'Eko Hook';
const WEBHOOK_AVATAR = 'https://i.imgur.com/HT7bvru.png';
const HEADER_BANNER = 'https://i.imgur.com/6ZC1SXO.png';

/**
 * Creates, fetches, or edits the existing Webhook "Eko Hook" message using
 * Discord's Components v2 (ContainerBuilder tabanlı) yapısı.
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

    const bannerUrl = options.banner || HEADER_BANNER;

    // Void Hook örneğindeki gibi: başlık + blockquote açıklama
    const descriptionText = options.description || (
      `> EkoYıldız, Eko tarafından özgün içerikler üretmek ve dijital yayıncılık alanında sürdürülebilir bir topluluk yapısı inşa etmek amacıyla hayata geçirilmiş bir YouTube kanalıdır. Bu ekosistemin merkezinde yer alan EkoYıldız Discord Topluluğu ise, başta EkoYıldız olmak üzere bünyesinde barındırdığı tüm dijital kanalların içerik yönetimini, operasyonel süreçlerini ve topluluk düzenini profesyonel standartlarda yürütmek amacıyla kurulmuştur.\n` +
      `> Amacımız, üyeler arasındaki etkileşimi güvenli, seviyeli ve dinamik bir yapıda tutmayı, içerik üretim süreçlerinin verimliliğini artırmayı ve dijital varlığımızın kurumsal bütünlüğünü korumaktır.\n\n` +
      `Bu sunucu YouTube kanalı ve Roblox Türkiye üzerine kurulmuştur. Roblox Türkiye ile alakalı işbirlikleri için <#1518692475189854218> kanalına gidin.`
    );

    const footerText = options.footer || '14 Nisan 2024 tarihinde kuruldu.';

    // ─── Components v2 Container ───────────────────────────────
    const container = new ContainerBuilder();

    // Üstte tam genişlik banner görseli
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(bannerUrl)
      )
    );

    // "Hakkında" başlığı + açıklama
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### Hakkında'),
      new TextDisplayBuilder().setContent(descriptionText)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // "Bağlantılarımız" başlığı
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Bağlantılarımız**')
    );

    // ActionRow 1: Yayın ve Video Platformları
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

    // ActionRow 2: Sosyal Medya ve RobloxLand
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('RobloxLand')
        .setURL('https://discord.gg/eJ2dPBXT4R')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🎮'),
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

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Alt bilgi (kuruluş tarihi)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${footerText}`)
    );

    const messagePayload = {
      username: WEBHOOK_NAME,
      avatarURL: WEBHOOK_AVATAR,
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };

    // Persisted message tracking
    let metaRecord = appMeta ? appMeta.findOne({ key: 'ekoHookConfig' }) : null;
    let existingMsg = null;

    if (webhook && metaRecord && metaRecord.messageId && !options.forceNew) {
      existingMsg = await webhook.fetchMessage(metaRecord.messageId).catch(() => null);
    }

    if (webhook && existingMsg) {
      console.log(`[EkoHookService] ✏️ Existing Webhook message found (${existingMsg.id}). Editing message...`);
      await webhook.editMessage(existingMsg.id, messagePayload);
      console.log('[EkoHookService] ✅ Existing Webhook message updated successfully to Components v2.');
      return true;
    }

    // Otherwise send new message and store ID
    let sentMsg = null;
    if (webhook) {
      sentMsg = await webhook.send(messagePayload);
    } else {
      sentMsg = await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
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