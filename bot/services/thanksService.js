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

// Özel Destekçi listesi — güncellemek için buraya ekleyin/çıkarın
const SUPPORTERS_LIST = [
  'gizemliabe ve TEF ordusu',
  'Ceasar İmpreius ve Order of İmperius',
  'khsinternet',
  'slm3828mrb',
  'never92lion_man_iso',
  'YTTBRARDA',
  'adamgeldi_adam4',
  'askasaf ve TSK ordusu',
  'swoxy',
  'funter',
  'lejyon'
];

/**
 * Sunucuda en çok kalan 3 üyeyi ve en çok mesaj yazan aktif üyeyi getirir (owner ve botlar hariç)
 */
async function getDynamicThanksMembers(guild) {
  let oldestMembers = [];
  let mostActiveMember = null;

  try {
    if (!guild) return { oldestMembers, mostActiveMember };

    // Tüm üyeleri önbelleğe ve güncel listeye çek
    await guild.members.fetch().catch(err => {
      console.warn('[ThanksService] Üyeler fetch edilirken uyarı:', err.message);
    });

    const ownerId = guild.ownerId;
    const cacheValues = typeof guild.members.cache.values === 'function'
      ? Array.from(guild.members.cache.values())
      : (Array.isArray(guild.members.cache) ? guild.members.cache : []);

    const humanMembers = cacheValues.filter(m => m && m.user && !m.user.bot && m.id !== ownerId);

    // 1. Sunucuda en çok kalan owner ve botlar hariç 3 kişi (en eski joinedTimestamp)
    oldestMembers = humanMembers
      .filter(m => m.joinedTimestamp)
      .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
      .slice(0, 3);

    // 2. En çok mesaj yazan üye (owner ve botlar hariç)
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const FrogLevel = require('../../models/FrogLevel');
        const topMessagers = await FrogLevel.find({ guildId: guild.id })
          .sort({ totalMessages: -1, xp: -1 })
          .limit(25)
          .lean()
          .catch(() => []);

        for (const doc of topMessagers) {
          if (!doc || !doc.userId) continue;
          if (doc.userId === ownerId) continue;
          const member = typeof guild.members.cache.get === 'function'
            ? guild.members.cache.get(doc.userId)
            : null;
          if (member && !member.user.bot) {
            mostActiveMember = member;
            break;
          }
        }
      }
    } catch (dbErr) {
      console.warn('[ThanksService] FrogLevel sorgu hatası:', dbErr.message);
    }
  } catch (err) {
    console.error('[ThanksService] Dinamik üyeler çekilirken hata:', err.message);
  }

  return { oldestMembers, mostActiveMember };
}

async function sendThanksMessage(client, targetChannelId = THANKS_CHANNEL_ID, options = {}) {
  try {
    const channel = await client.channels.fetch(targetChannelId).catch(() => null);
    if (!channel) {
      console.error(`[ThanksService] ❌ Kanal bulunamadı: ${targetChannelId}`);
      return false;
    }

    const guild = channel.guild || client.guilds.cache.get('1367646464804655104');
    console.log(`[ThanksService] 📌 Hedef kanal: #${channel.name} (${channel.id})`);

    // Dinamik bilgileri topla (En çok kalan 3 kişi + en aktif mesaj yazan kişi)
    const { oldestMembers, mostActiveMember } = await getDynamicThanksMembers(guild);

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

    // 3️⃣ Özel Teşekkürler başlık
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### Özel Teşekkürler; <:erkndnmdestkck:1535364220676476978>')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // 4️⃣ Özel Destekçi listesi
    const specialListText = SUPPORTERS_LIST.map(name => `» *Özel Teşekkürler,* **${name}**`).join('\n');
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(specialListText)
    );

    // 5️⃣ Yeni ayrıcı çizgi (Divider)
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // 6️⃣ Teşekkürler başlık
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### Teşekkürler;')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // 7️⃣ Dinamik Teşekkürler Listesi:
    //    - Sunucuda en çok kalan 3 kişi (etiketleme yok, sadece kullanıcı adı)
    //    - En aktif mesaj yazan kişi ("Çok teşekkürler, kullanıcıadı")
    const dynamicLines = [];
    if (oldestMembers && oldestMembers.length > 0) {
      for (const m of oldestMembers) {
        dynamicLines.push(`» *Teşekkürler,* **${m.user.username}**`);
      }
    }
    if (mostActiveMember) {
      dynamicLines.push(`» *Çok Teşekkürler,* **${mostActiveMember.user.username}**`);
    }

    const thanksListText = dynamicLines.length > 0
      ? dynamicLines.join('\n')
      : '» *Teşekkürler,* **Sunucu Üyelerimiz**';

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(thanksListText)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // 8️⃣ Footer / Açıklama
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

// ─── OTOMATİK GÜNCELLEME (Üye çıkışları ve periyodik senkronizasyon) ────────
let updateTimeout = null;
function triggerThanksUpdate(client, delayMs = 5000) {
  if (updateTimeout) clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    sendThanksMessage(client).catch(err => {
      console.error('[ThanksService] Auto update error:', err.message);
    });
  }, delayMs);
}

function setupThanksAutoUpdater(client) {
  // İlk açılışta gecikmeli olarak güncelle (diğer servisler bağlandıktan sonra)
  setTimeout(() => {
    sendThanksMessage(client).catch(() => {});
  }, 10000);

  // Bir üye sunucudan çıktığında (en çok kalan veya en aktif değişmiş olabilir)
  client.on('guildMemberRemove', (member) => {
    if (member.guild && member.guild.id === '1367646464804655104') {
      console.log(`[ThanksService] ℹ️ Üye ayrıldı (${member.user?.username || member.id}), teşekkürler listesi güncelleniyor...`);
      triggerThanksUpdate(client, 5000);
    }
  });

  // Periyodik güncelleme (her 30 dakikada bir en aktif mesaj yazan & süreleri tazele)
  setInterval(() => {
    triggerThanksUpdate(client, 1000);
  }, 30 * 60 * 1000);
}

module.exports = {
  sendThanksMessage,
  setupThanksAutoUpdater,
  getDynamicThanksMembers,
  THANKS_CHANNEL_ID,
  SUPPORTERS_LIST
};
