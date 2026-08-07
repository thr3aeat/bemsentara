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
const WEBHOOK_NAME = 'Eko Hook'; // Void Hook tarzı isim
const WEBHOOK_AVATAR = 'https://i.imgur.com/HT7bvru.png';
const HEADER_BANNER = 'https://i.imgur.com/6ZC1SXO.png';

// Void Hook'un tam olarak kullandığı koyu gri ton (#2b2d31)
const ACCENT_COLOR = 0x2b2d31;

async function sendEkoHookAbout(client, targetChannelId = CHANNEL_ID, options = {}) {
  try {
    const channel = await client.channels.fetch(targetChannelId).catch(() => null);
    if (!channel) {
      console.error(`[EkoHookService] ❌ Kanal bulunamadı: ${targetChannelId}`);
      return false;
    }

    console.log(`[EkoHookService] 📌 Hedef kanal: #${channel.name} (${channel.id})`);

    // Webhook yönetimi
    let webhooks = await channel.fetchWebhooks().catch(() => null);
    let webhook = webhooks ? webhooks.find(w => w.name === WEBHOOK_NAME) : null;

    if (!webhook) {
      console.log(`[EkoHookService] ⚙️ Webhook "${WEBHOOK_NAME}" oluşturuluyor...`);
      webhook = await channel.createWebhook({
        name: WEBHOOK_NAME,
        avatar: WEBHOOK_AVATAR,
        reason: 'EkoYıldız Resmi Hakkında'
      }).catch((err) => {
        console.error('[EkoHookService] Webhook hatası:', err.message);
        return null;
      });
    } else {
      await webhook.edit({ name: WEBHOOK_NAME, avatar: WEBHOOK_AVATAR }).catch(() => {});
    }

    const bannerUrl = options.banner || HEADER_BANNER;

    // ─── METİN İÇERİĞİ ────────────────────────────────────────
    const descriptionText = options.description || (
      `> EkoYıldız, özgün dijital içerikler üretmek ve sürdürülebilir bir topluluk ekosistemi kurmak amacıyla hayata geçirilmiştir.\n` +
      `> Bu Discord topluluğu, YouTube kanalı operasyonlarını, içerik yönetimini ve profesyonel standartlarda topluluk düzenini yürütmektedir.\n` +
      `> Amacımız; güvenli, seviyeli etkileşim alanı ve kurumsal bütünlük korumasıdır.\n\n` +
      `Bu sunucu **YouTube** ve **Roblox Türkiye** üzerine kurulmuştur.` +
      ` İşbirlikleri için <#1518692475189854218> kanalını kullanabilirsiniz.`
    );

    const footerText = options.footer || '*14 Nisan 2024 tarihinde kuruldu.*';

    // ─── CONTAINER V2 YAPILANDIRMASI ──────────────────────────
    const container = new ContainerBuilder().setAccentColor(ACCENT_COLOR);

    // 1️⃣ ÜST BANNER (Tam genişlik, koyu temalı görsel)
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder()
          .setURL(bannerUrl)
          .setAltText('EkoYıldız Banner')
      )
    );

    // 2️⃣ HAKKINDA BÖLÜMÜ (Heading + Blockquote)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### Hakkında'),
      new TextDisplayBuilder().setContent('\u200B'),
      new TextDisplayBuilder().setContent(descriptionText)
    );

    // 3️⃣ BÜYÜK AYIRICI (Section break)
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setDivider(true)
    );

    // 4️⃣ BAĞLANTILAR (İkon Odaklı Butonlar)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Bağlantılarımız**')
    );

    const rowIcons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('YouTube')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.youtube.com/@eko8yildiz')
        .setEmoji('🔴'),
      new ButtonBuilder()
        .setLabel('Kick')
        .setStyle(ButtonStyle.Link)
        .setURL('https://kick.com/ekoyildiz')
        .setEmoji('🟢'),
      new ButtonBuilder()
        .setLabel('TikTok')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.tiktok.com/@kimdirbueko')
        .setEmoji('🎵'),
      new ButtonBuilder()
        .setLabel('İletişim')
        .setStyle(ButtonStyle.Link)
        .setURL('https://ptb.discord.com/channels/1367646464804655104/1518692475189854218')
        .setEmoji('📩')
    );

    container.addActionRowComponents(rowIcons);

    // 5️⃣ KÜÇÜK AYIRICI (Footer öncesi)
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    );

    // 6️⃣ ALT BİLGİ (Footer - İtalik ve küçük görünüm)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(footerText)
    );

    // ─── MESAJ GÖNDERİM ──────────────────────────────────────
    const messagePayload = {
      username: WEBHOOK_NAME,
      avatarURL: WEBHOOK_AVATAR,
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };

    // Persisted message logic
    let metaRecord = appMeta ? appMeta.findOne({ key: 'ekoHookConfig' }) : null;
    let existingMsg = null;

    if (webhook && metaRecord && metaRecord.messageId && !options.forceNew) {
      existingMsg = await webhook.fetchMessage(metaRecord.messageId).catch(() => null);
    }

    if (webhook && existingMsg) {
      console.log(`[EkoHookService] ✏️ Mevcut mesaj düzenleniyor (${existingMsg.id})...`);
      await webhook.editMessage(existingMsg.id, messagePayload);
      console.log('[EkoHookService] ✅ Components v2 formatına güncellendi.');
      return true;
    }

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

    console.log('[EkoHookService] ✅ Void Hook stili mesaj başarıyla gönderildi.');
    return true;
  } catch (err) {
    console.error('[EkoHookService] ❌ Hata:', err.message);
    return false;
  }
}

module.exports = { sendEkoHookAbout, CHANNEL_ID };