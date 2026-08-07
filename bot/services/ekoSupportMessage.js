'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags
} = require('discord.js');
const { GUILD2_ID } = require('../../config');
const { appMeta, saveStoreNow } = require('../../models/Store');

const EKO_SUPPORT_CHANNEL_ID = '1518692475189854218';
const HEADER_BANNER_URL = 'https://i.imgur.com/bWvBM0N.png';

function buildSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ekoyildiz_support_category')
      .setPlaceholder('İletişime geçmek istediğiniz bölümü seçin')
      .addOptions(
        {
          label: 'Bir konu hakkında soru sormak istiyorum',
          value: 'diger_destek',
          description: 'Sorularınız için bu seçeneği seçebilirsiniz.',
          emoji: '❓'
        },
        {
          label: 'Şikayette bulunmak istiyorum',
          value: 'sikayet_destek',
          description: 'Sunucuda bir sorun yaşıyorsan şikayette bulunmak istiyoruma tıklayabilirsin.',
          emoji: '❗'
        },
        {
          label: 'Kullanıcı Destek',
          value: 'kullanici_destek',
          description: 'Birisi seni rahatsız ediyorsa veya yardıma ihtiyacın varsa buradan ulaş.',
          emoji: '👤'
        },
        {
          label: 'Yönetim ekibi ile görüşmek istiyorum',
          value: 'yonetim_destek',
          description: 'EkoYıldız sunucu yönetim ekip üyeleriyle iletişim için bu seçeneği seç.',
          emoji: '👑'
        },
        {
          label: 'Reklam verdirmek ve sponsor olmak istiyorum',
          value: 'reklam_destek',
          description: 'Bize reklam verdirerek sponsor olabilirsin.',
          emoji: '📢'
        }
      )
  );
}

function buildSupportContainer() {
  const container = new ContainerBuilder();

  // 1️⃣ Banner
  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(HEADER_BANNER_URL)
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false)
  );

  // 2️⃣ Başlık
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## İletişim ve Destek Kanalı')
  );

  // 3️⃣ Açıklama (alıntı bloğu)
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> Sunucu hakkında yaşadığınız problemler ve sorularınız için aşağıdaki seçenekleri kullanabilirsiniz. ` +
      `Talep oluştururken kuralları ihlal etmediğinizden emin olun.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // 4️⃣ Kurallar
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `* **Destek talebi oluşturmadan önce;**\n` +
      `  * Troll, şaka veya deneme amaçlı destek talebi açmayın.\n` +
      `  * Sorununuzun gerçekten desteğe ihtiyaç duyduğundan emin olun.\n` +
      `  * Daha önce açtığınız bir talep varsa yeni bir tane açmayın.\n` +
      `  * Reklam destek için doğru kategoriyi seçtiğinizden emin olun.\n` +
      `  * Eğer kendinizi kötü hissediyor, asker oyunu bağımlılığı yaşıyor veya birisi sizi panikletiyorsa, **Kullanıcı Destek** açın.\n` +
      `  * Konu başlığını ve açıklamayı net bir şekilde yazın.\n` +
      `  * Kanıtlarınızın (SS, video, ID vb.) hazır ve doğru olduğundan emin olun.\n` +
      `  * Sunucu kurallarını okuduğunuzdan ve ihlal etmediğinizden emin olun.\n` +
      `  * Yetkilileri veya herhangi bir üyeyi etiketlemeyin, sabırlı olun.\n` +
      `  * Sorununuzun doğru kategoriye ait olduğundan emin olun.\n` +
      `  * Başkasının adına talep açmayın.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // 5️⃣ Form açıklaması
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `Destek talep seçeneğinizi seçtikten sonra ekranınıza bir form gelecek. Bu formda seçtiğiniz seçeneğe göre içerik hazırlanır, ` +
      `böylece size daha hızlı yardımcı olabiliriz. Formu gönderdikten sonra yalnızca sizin ve yetkili ekibimizin erişebileceği ` +
      `özel bir kanal oluşturulacaktır. Sorununuzla ilgili detayları bu kanal üzerinden paylaşabilirsiniz.`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // 6️⃣ Select menu artık container'ın içinde
  container.addActionRowComponents(buildSelectMenu());

  return container;
}

async function ensureEkoSupportMessage(client) {
  try {
    const guild = await client.guilds.fetch(GUILD2_ID).catch(() => null);
    if (!guild) return;
    const channel = await guild.channels.fetch(EKO_SUPPORT_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const container = buildSupportContainer();

    const messagePayload = {
      components: [container],
      flags: MessageFlags.IsComponentsV2
    };

    // Store'dan kayıtlı mesaj ID'sini al
    let metaRecord = appMeta ? appMeta.findOne({ key: 'ekoSupportMsgId' }) : null;
    let existingMsg = null;

    if (metaRecord && metaRecord.messageId) {
      existingMsg = await channel.messages.fetch(metaRecord.messageId).catch(() => null);
    }

    if (existingMsg) {
      await existingMsg.edit(messagePayload);
      console.log('✅ EkoYıldız destek mesajı güncellendi (Components V2).');
      return;
    }

    // Eski embed tabanlı mesajı bul ve sil
    const msgs = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    if (msgs) {
      for (const [, m] of msgs) {
        if (m.author.id === client.user.id) {
          await m.delete().catch(() => { });
        }
      }
    }

    const sent = await channel.send(messagePayload);
    console.log('✅ EkoYıldız destek sistemi mesajı gönderildi (Components V2).');

    if (sent && appMeta) {
      if (!metaRecord) {
        appMeta.create({ key: 'ekoSupportMsgId', messageId: sent.id, channelId: EKO_SUPPORT_CHANNEL_ID });
      } else {
        metaRecord.messageId = sent.id;
        metaRecord.channelId = EKO_SUPPORT_CHANNEL_ID;
        metaRecord.save();
      }
      saveStoreNow();
    }
  } catch (error) {
    console.error('❌ EkoYıldız destek mesajı hatası:', error.stack || error.message);
  }
}

module.exports = {
  ensureEkoSupportMessage,
  EKO_SUPPORT_CHANNEL_ID
};