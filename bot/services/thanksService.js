'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');
const { appMeta, saveStoreNow } = require('../../models/Store');

const THANKS_CHANNEL_ID = '1535336359579885629';
const WEBHOOK_NAME = 'EkoYıldız Destekçiler';
const WEBHOOK_AVATAR = 'https://i.imgur.com/HT7bvru.png';
const HEADER_BANNER_URL = 'https://i.imgur.com/DrkAlzu.png';
const SUPPORTERS_CHANNEL_LINK = 'https://ptb.discord.com/channels/1367646464804655104/1535336327975927919';

// Destekçi listesi — güncellemek için buraya ekleyin/çıkarın
const SUPPORTERS_LIST = [
  'gizemliabe ve TEF ordusu',
  'Ceasar İmpreius ve Order of İmperius',
  'khsinternet',
  'slm3828mrb',
  'never92lion_man_iso',
  'YTTBRARDA',
  'adamgeldi_adam4'
];

/**
 * Sends or updates the EkoYıldız "Teşekkürler" donors message using Discord Components V2.
 * (Accent color kaldırıldı — nötr/renksiz container)
 */
async function sendThanksMessage(client, targetChannelId = THANKS_CHANNEL_ID, options = {}) {
  try {
    const channel = await client.channels.fetch(targetChannelId).catch(() => null);
    if (!channel) {
      console.error(`[ThanksService] ❌ Kanal bulunamadı: ${targetChannelId}`);
      return false;
    }

    console.log(`[ThanksService] 📌 Hedef kanal: #${channel.name} (${channel.id})`);

    // Webhook yönetimi
    let webhooks = await channel.fetchWebhooks().catch(() => null);
    let webhook = webhooks ? webhooks.find(w => w.name === WEBHOOK_NAME) : null;

    if (!webhook) {
      console.log(`[ThanksService] ⚙️ Webhook "${WEBHOOK_NAME}" oluşturuluyor...`);
      webhook = await channel.createWebhook({
        name: WEBHOOK_NAME,
        avatar: WEBHOOK_AVATAR,
        reason: 'EkoYıldız Teşekkürler Duyurusu'
      }).catch((err) => {
        console.error('[ThanksService] Webhook oluşturma hatası:', err.message);
        return null;
      });
    } else {
      await webhook.edit({ name: WEBHOOK_NAME, avatar: WEBHOOK_AVATAR }).catch(() => { });
    }

    // ─── CONTAINER (renksiz / accent color yok) ────────────────────────────
    const container = new ContainerBuilder();

    // 1️⃣ Üst Banner (Teşekkürler görseli)
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(HEADER_BANNER_URL)
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false)
    );

    // 2️⃣ Giriş açıklaması
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `EkoYıldız topluluğuna geçmiş projeler ve topluluğun yapısına maddi destekte bulunmuş **Destekçi dinazorlar**, ` +
        `vaatlerimize ve sözlerimize güvenerek sağladığınız bu destekler için teşekkürler.`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // 3️⃣ Destekçiler başlık
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### Destekçilerimiz; <:erkndnmdestkck:1535364220676476978>')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // 4️⃣ Destekçi listesi
    const listText = SUPPORTERS_LIST.map(name => `» *Teşekkürler,* **${name}**`).join('\n');
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(listText)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // 5️⃣ Footer / Açıklama
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Bu liste EkoYıldız topluluğuna bağışlarda bulunan ve destekler veren kişilerdir. ` +
        `Listeye girmek için **"reklam destek"** açabilir veya <#1535336327975927919> kanalından nasıl bağış yapabileceğinizi öğrenebilirsiniz. ` +
        `Destekçilere özel avantajlar verilmektedir.`
      )
    );

    // ─── MESAJ GÖNDERİM / DÜZENLEME ────────────────────────────────────
    const messagePayload = {
      username: WEBHOOK_NAME,
      avatarURL: WEBHOOK_AVATAR,
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };

    let metaRecord = appMeta ? appMeta.findOne({ key: 'thanksConfig' }) : null;
    let existingMsg = null;

    if (webhook && metaRecord && metaRecord.messageId && !options.forceNew) {
      existingMsg = await webhook.fetchMessage(metaRecord.messageId).catch(() => null);
    }

    if (webhook && existingMsg) {
      console.log(`[ThanksService] ✏️ Mevcut mesaj güncelleniyor (${existingMsg.id})...`);
      await webhook.editMessage(existingMsg.id, messagePayload);
      console.log('[ThanksService] ✅ Teşekkürler mesajı güncellendi.');
      return true;
    }

    // Eski mesajları bul
    const messagesCollection = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    const botMessages = messagesCollection
      ? Array.from(messagesCollection.values())
        .filter(m => webhook ? m.webhookId === webhook.id : m.author.id === client.user.id)
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      : [];

    let sentMsg = null;

    if (botMessages.length > 0 && webhook) {
      sentMsg = await webhook.editMessage(botMessages[0].id, messagePayload).catch(() => null);
      for (let i = 1; i < botMessages.length; i++) {
        await botMessages[i].delete().catch(() => { });
      }
    }

    if (!sentMsg) {
      if (webhook) {
        sentMsg = await webhook.send(messagePayload).catch(() => null);
      } else {
        sentMsg = await channel.send(messagePayload).catch(() => null);
      }
    }

    if (sentMsg && appMeta) {
      if (!metaRecord) {
        appMeta.create({
          key: 'thanksConfig',
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

    console.log('[ThanksService] ✅ Teşekkürler mesajı başarıyla gönderildi.');
    return true;
  } catch (err) {
    console.error('[ThanksService] ❌ Hata:', err.stack || err.message);
    return false;
  }
}

module.exports = {
  sendThanksMessage,
  THANKS_CHANNEL_ID,
  SUPPORTERS_LIST
};