'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const { appMeta, saveStoreNow } = require('../../models/Store');

const SUPPORTERS_CHANNEL_ID = '1535336327975927919';
const WEBHOOK_NAME = 'EkoYıldız Destekçiler';
const WEBHOOK_AVATAR = 'https://i.imgur.com/HT7bvru.png';
const HEADER_BANNER_URL = 'https://i.imgur.com/UDXqHFY.png';
const MONEY_ICON_URL = 'https://media.discordapp.net/attachments/1123537825590169651/1532919218167746570/Bagsc.png?ex=6a772b85&is=6a75da05&hm=88702a1dd9c091b732369c92ad0b86556c4c2ab25a6b423fa41b229bf1c13d24&=&format=webp&quality=lossless';
const ACCENT_COLOR = 0x7c5cbf; // Mor ton - para/destek teması

/**
 * Sends or updates the EkoYıldız Supporters message using Discord Components V2.
 */
async function sendSupportersMessage(client, targetChannelId = SUPPORTERS_CHANNEL_ID, options = {}) {
  try {
    const channel = await client.channels.fetch(targetChannelId).catch(() => null);
    if (!channel) {
      console.error(`[SupportersService] ❌ Kanal bulunamadı: ${targetChannelId}`);
      return false;
    }

    console.log(`[SupportersService] 📌 Hedef kanal: #${channel.name} (${channel.id})`);

    // Webhook yönetimi
    let webhooks = await channel.fetchWebhooks().catch(() => null);
    let webhook = webhooks ? webhooks.find(w => w.name === WEBHOOK_NAME) : null;

    if (!webhook) {
      console.log(`[SupportersService] ⚙️ Webhook "${WEBHOOK_NAME}" oluşturuluyor...`);
      webhook = await channel.createWebhook({
        name: WEBHOOK_NAME,
        avatar: WEBHOOK_AVATAR,
        reason: 'EkoYıldız Destekçiler Duyurusu'
      }).catch((err) => {
        console.error('[SupportersService] Webhook oluşturma hatası:', err.message);
        return null;
      });
    } else {
      await webhook.edit({ name: WEBHOOK_NAME, avatar: WEBHOOK_AVATAR }).catch(() => {});
    }

    // ─── CONTAINER: DESTEKÇILER MESAJI ────────────────────────────────────
    const container = new ContainerBuilder().setAccentColor(ACCENT_COLOR);

    // 1️⃣ Üst Banner (Destekçiler görseli)
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(HEADER_BANNER_URL)
      )
    );

    // 2️⃣ Hoşgeldin Bölümü + Para İkonu
    container.addSectionComponents((section) => {
      section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### Merhaba değerli destekçiler,'),
        new TextDisplayBuilder().setContent(
          `Bize destek olmak istiyorsanız aşağıdaki yöntemlerden birini veya birkaçını tercih edebilirsiniz. ` +
          `Her türlü katkınız EkoYıldız'ın büyümesine ve daha kaliteli içerikler üretmesine doğrudan katkı sağlar.`
        )
      );
      section.setThumbnailAccessory(
        new ThumbnailBuilder().setURL(MONEY_ICON_URL)
      );
      return section;
    });

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // 3️⃣ İtemSatış (EN ÇOK ÖNERİLEN)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🚀 **1. İtemSatış Üzerinden Doğrudan Destek** *(En Çok Önerilen)*\n` +
        `Bize en doğrudan katkıyı sunabileceğiniz bağış platformudur. Hızlı, güvenli ve doğrudan.`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // 4️⃣ Süper Teşekkür (ÇOK ÖNERİLEN)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `💖 **2. YouTube Süper Teşekkür** *(Çok Önerilen)*\n` +
        `Beğendiğiniz videolarımızın altındaki **"Süper Teşekkür"** butonunu kullanarak dilediğiniz miktarda doğrudan katkıda bulunabilirsiniz.`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // 5️⃣ YouTube Üyelik (ÖNERİLEN)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `💎 **3. YouTube Kanal Üyeliği** *(Önerilen)*\n` +
        `Kanalımıza üye olarak hem topluluğumuzun özel ayrıcalıklarından yararlanabilir hem de her ay düzenli destek sağlayabilirsiniz.`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // 6️⃣ Discord Boost
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🌟 **4. Discord Sunucu Takviyesi (Server Boost)**\n` +
        `Discord topluluğumuzun kalitesini artıran ve ek özellikler kazanmamızı sağlayan Nitro Takviyesi ile sunucumuzu güçlendirebilirsiniz.`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // 7️⃣ Ücretsiz Destek
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `📊 **5. Ücretsiz ve Etkili Destek (Etkileşim)**\n` +
        `Herhangi bir maddi katkıda bulunmadan da bize büyük destek verebilirsiniz! Videolarımızı sonuna kadar izlemek, tekrar izletmek, beğenmek ve yorum yapmak algoritma görünürlüğümüzü doğrudan artırır. Paranız yoksa bunu yapın; varsa üsttekileri! 😄`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // 8️⃣ Butonlar
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('İtemSatış — Destekle')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.itemsatis.com/destekle/ekoyildiz')
        .setEmoji('💳'),
      new ButtonBuilder()
        .setLabel('YouTube Üyelik')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.youtube.com/channel/UCNSZYtuDQYsZYYQVJvErDVw/join')
        .setEmoji('💎'),
      new ButtonBuilder()
        .setLabel('YouTube Kanalı')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.youtube.com/@eko8yildiz')
        .setEmoji('🔴')
    );

    container.addActionRowComponents(row);

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Topluluğumuzun gelişmesine katkı sağlayan tüm destekçilerimize teşekkür ederiz. 💜`
      )
    );

    // ─── MESAJ GÖNDERİM / DÜZENLEME ──────────────────────────────────────
    const messagePayload = {
      username: WEBHOOK_NAME,
      avatarURL: WEBHOOK_AVATAR,
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };

    let metaRecord = appMeta ? appMeta.findOne({ key: 'supportersConfig' }) : null;
    let existingMsg = null;

    if (webhook && metaRecord && metaRecord.messageId && !options.forceNew) {
      existingMsg = await webhook.fetchMessage(metaRecord.messageId).catch(() => null);
    }

    if (webhook && existingMsg) {
      console.log(`[SupportersService] ✏️ Mevcut mesaj güncelleniyor (${existingMsg.id})...`);
      await webhook.editMessage(existingMsg.id, messagePayload);
      console.log('[SupportersService] ✅ Destekçiler mesajı güncellendi.');
      return true;
    }

    // Eski bot mesajlarını bul ve üzerine yaz ya da yeni gönder
    const messagesCollection = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    const botMessages = messagesCollection
      ? Array.from(messagesCollection.values())
          .filter(m => m.author.id === client.user.id || (webhook && m.webhookId === webhook.id))
          .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      : [];

    let sentMsg = null;

    if (botMessages.length > 0 && webhook) {
      sentMsg = await webhook.editMessage(botMessages[0].id, messagePayload).catch(() => null);
      // Fazla eski mesajları temizle
      for (let i = 1; i < botMessages.length; i++) {
        await botMessages[i].delete().catch(() => {});
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
          key: 'supportersConfig',
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

    console.log('[SupportersService] ✅ Destekçiler mesajı başarıyla gönderildi.');
    return true;
  } catch (err) {
    console.error('[SupportersService] ❌ Hata:', err.stack || err.message);
    return false;
  }
}

module.exports = {
  sendSupportersMessage,
  SUPPORTERS_CHANNEL_ID
};
