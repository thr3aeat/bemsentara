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

const RULES_CHANNEL_ID = '1535319008956649564';
const WEBHOOK_NAME = 'EkoYıldız Kurallar';
const WEBHOOK_AVATAR = 'https://i.imgur.com/HT7bvru.png';
const BANNER_URL = 'https://i.imgur.com/j3pnVTu.png';
const ACCENT_COLOR = 0x2b2d31;
const ANAYASA_URL = 'https://docs.google.com/document/d/1tnZ75554rJscst2Cp0r2aIom2bOBlWzZ54iM0qshg3o/edit?usp=sharing';

/**
 * Sends or updates the EkoYıldız rules in channel 1535319008956649564 using Discord Components V2.
 */
async function sendEkoYildizRules(client, targetChannelId = RULES_CHANNEL_ID, options = {}) {
  try {
    const channel = await client.channels.fetch(targetChannelId).catch(() => null);
    if (!channel) {
      console.error(`[RulesService] ❌ Kanal bulunamadı: ${targetChannelId}`);
      return false;
    }

    console.log(`[RulesService] 📌 Kurallar kanalı: #${channel.name} (${channel.id})`);

    // Webhook yönetimi
    let webhooks = await channel.fetchWebhooks().catch(() => null);
    let webhook = webhooks ? webhooks.find(w => w.name === WEBHOOK_NAME) : null;

    if (!webhook) {
      webhook = await channel.createWebhook({
        name: WEBHOOK_NAME,
        avatar: WEBHOOK_AVATAR,
        reason: 'EkoYıldız Resmi Kurallar Duyurusu'
      }).catch((err) => {
        console.error('[RulesService] Webhook oluşturma hatası:', err.message);
        return null;
      });
    } else {
      await webhook.edit({ name: WEBHOOK_NAME, avatar: WEBHOOK_AVATAR }).catch(() => {});
    }

    // ─── CONTAINER 1: HOŞ GELDİN + GENEL TOPLULUK + GÜVENLİK/KVKK ───────────
    const container1 = new ContainerBuilder().setAccentColor(ACCENT_COLOR);

    // Banner görseli
    container1.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(BANNER_URL)
      )
    );

    // Karşılama Metni
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# EkoYıldız\'a Hoş Geldin 👋'),
      new TextDisplayBuilder().setContent(
        `> Aramıza katılımınızdan memnuniyet duyuyoruz. Sunucu kurallarımız aşağıda bilgilerinize sunulmuştur; katılım sağlayan her kullanıcının bu kuralları tebellüğ ettiği kabul edilmektedir. Bu doğrultuda, moderasyon birimi tarafından susturulmanız veya uzaklaştırılmanız durumunda, kurallara riayet edilmediği esastır.`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // Bölüm 1: Genel Topluluk
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | Genel Topluluk 💬'),
      new TextDisplayBuilder().setContent(
        `* **Discord Kullanım Şartları & Topluluk Kuralları:** Bu madde, sunucumuzun temel ve en kapsayıcı kuralıdır. Tüm alt kurallar bu çerçevede düzenlenmiştir. Kurallarımız yalnızca yerel topluluk standartlarımızı değil, aynı zamanda Discord’un resmi Hizmet Koşullarını ve Topluluk İlkelerini de kapsamaktadır.\n` +
        `* **⭐ Türk Tarihine ve Değerlerine Saygı:** Türk tarihine ve bu tarihin kurucu sembollerine yönelik her türlü saygısızlık kesinlikle yasaktır. Özellikle Gazi Mustafa Kemal Atatürk’e ve milli değerlere yönelik olumsuz beyanlarda bulunulması sunucudan süresiz uzaklaştırma sebebidir.\n` +
        `* **1.1 Yaş Sınırı ve Güvenlik:** Discord platformunu kullanabilmek ve sunucumuzda yer alabilmek için en az 13 yaşında olmanız yasal bir zorunluluktur. Yaş sınırının altında olduğu tespit edilen veya bunu beyan eden kullanıcılar, güvenlik politikalarımız gereği sunucudan yasaklanır.`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Bölüm 2: Güvenlik ve Gizlilik
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | Güvenlik ve Gizlilik 🛡️'),
      new TextDisplayBuilder().setContent(
        `* **1.2 Kişisel Verilerin Gizliliği (KVKK):** Üyelerin özel, kişisel veya hassas verilerinin (ifşa) paylaşılması kesinlikle yasaktır. Bu durum, kişisel bilgilerin paylaşımıyla tehdit etme eylemini de kapsar. Telefon numarası, isim-soyisim, T.C. Kimlik numarası ve yüz görsellerinin paylaşımı yasaktır.\n` +
        `* **1.3 Siber Güvenlik ve Dolandırıcılık:** Zararlı yazılım (virüs) içeren dosyaların gönderilmesi ve dolandırıcılık faaliyetleri yürütülmesi kesinlikle yasaktır. IP Logger gibi veri takibi yapan bağlantıların paylaşımı doğrudan uzaklaştırma nedenidir.\n` +
        `* **1.4 Sesli Kanal Kayıt Prosedürü:** Sesli kanallarda, kanalda bulunan üyelerin açık rızası olmaksızın ses kaydı alınması yasaktır. (İstisna: Yetkililer tarafından organize edilen resmi etkinlikler).\n` +
        `* **1.5 Destek Hattı (Bilet) Kullanımı:** Destek sistemi (Ticket), yalnızca ihtiyaç duyulan hallerde kullanılmalıdır. Sistemi eğlence veya trol amaçlı meşgul etmek yasaktır.`
      )
    );

    // ─── CONTAINER 2: MÜSTEHCENLİK + SAYGI/DÜZEN + ANAYASA ────────────────
    const container2 = new ContainerBuilder().setAccentColor(ACCENT_COLOR);

    // Bölüm 3: İçerik ve Müstehcenlik
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | İçerik ve Müstehcenlik 🔞'),
      new TextDisplayBuilder().setContent(
        `* **2.1 NSFW İçerik Paylaşımı ve Söylemleri:** NSFW (uygunsuz) ve pornografik içeriklere karşı toleransımız sıfırdır. Bu tür içeriklerin paylaşılması, imâ edilmesi veya çağrışım uyandıracak görsellerin sunucuya iletilmesi kesinlikle yasaktır.\n` +
        `* **2.2 NSFL ve Rahatsız Edici İçerikler:** NSFL kapsamına giren; intihar, kendine zarar verme, şiddet veya toplumsal hassasiyetleri zedeleyici unsurların paylaşımı yasaktır.\n` +
        `* **2.3 Sanal İlişki (E-date) ve Flört Faaliyetleri:** Sunucumuz bir arkadaşlık veya flört (dating) platformu değildir. DM (Özel Mesaj), genel sohbet kanalları veya diğer birimler üzerinden flört eyleminde bulunduğu tespit edilen kullanıcılar sunucudan yasaklanacaktır.`
      )
    );

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Bölüm 4: Saygı, Düzen ve Reklam
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | Saygı, Topluluk Düzeni & Reklam 👥'),
      new TextDisplayBuilder().setContent(
        `* **3.1 Nezaket ve Eşitlik:** Sunucu içerisindeki pozisyonu veya kıdemi ne olursa olsun, her üyeye karşı nazik ve saygılı bir tutum sergilenmesi esastır.\n` +
        `* **3.2 Hassas Konular ve Tartışma Kültürü:** Politika, siyaset, din, cinsellik ve fanatizm içeren futbol tartışmaları kısıtlanmıştır.\n` +
        `* **3.3 Huzur Ortamının Korunması:** Bilinçli olarak tartışma çıkarmak, üyeleri provoke etmek veya kaosa sebebiyet verecek söylemlerde bulunmak yasaktır.\n` +
        `* **3.4 Radikal Görüşler ve Ayrımcılık Yasağı:** Aşırı ve radikal ideolojilerin savunuculuğunu yapmak, svastika gibi nefret sembollerini kullanmak kesinlikle yasaktır. Ayrımcılığın hiçbir türüne tolerans gösterilmez.\n` +
        `* **5.1 Reklam Yasağı:** Üyelere özel mesaj (DM) üzerinden veya sunucu içerisinde herhangi bir oluşumun, sunucunun veya platformun (özellikle diğer Roblox gruplarının) reklamını yapmak yasaktır.\n` +
        `* **6.1 & 6.2 Profil Standartları & Taklit Yasağı:** Discord profiliniz sunucu kurallarına uygun olmalıdır. Sunucu yetkililerini, YK üyelerini ve @eko kadrosunu taklit etmek yasaktır.`
      )
    );

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Bölüm 5: Anayasa ve Özel Hükümler
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | Anayasa ve Yasal Hükümler 📜'),
      new TextDisplayBuilder().setContent(
        `* **Kuralların Suiistimali:** Sunucu kurallarını esnetmeye çalışmak veya maddeleri kişisel çıkar doğrultusunda yorumlamak yasaktır. Kurallarda açıkça belirtilmese dahi, topluluk huzurunu bozan her türlü girişim moderasyon takdirine tabidir.\n` +
        `* **📜 EKOYILDIZ ANAYASASI:** EkoYıldız Anayasası sunucu kurallarına esastır. Detaylı anayasa maddelerini aşağıdaki bağlantı üzerinden inceleyebilirsiniz.\n` +
        `* **⚖️ Özel Ceza Hükmü:** Eko Yıldız Anayasası 2.1 ve 2.2 kuralları gereğince verilen cezalar ihlalin niteliğine göre ağırlaştırılabilir.`
      )
    );

    // Anayasa Butonu
    const rowButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('EKOYILDIZ ANAYASASI')
        .setStyle(ButtonStyle.Link)
        .setURL(ANAYASA_URL)
        .setEmoji('📜')
    );

    container2.addActionRowComponents(rowButtons);

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# EkoYıldız Discord topluluk sunucu kuralları 07.07.2026 tarihi itibari ile geçerlidir.`)
    );

    // ─── MESAJ GÖNDERİMİ VE DÜZENLEME ─────────────────────────────────────
    const payload1 = {
      username: WEBHOOK_NAME,
      avatarURL: WEBHOOK_AVATAR,
      components: [container1],
      flags: MessageFlags.IsComponentsV2
    };

    const payload2 = {
      username: WEBHOOK_NAME,
      avatarURL: WEBHOOK_AVATAR,
      components: [container2],
      flags: MessageFlags.IsComponentsV2
    };

    let metaRecord = appMeta ? appMeta.findOne({ key: 'ekoYildizRulesConfig' }) : null;
    let msg1 = null;
    let msg2 = null;

    if (webhook && metaRecord && metaRecord.messageIds && metaRecord.messageIds.length >= 2 && !options.forceNew) {
      msg1 = await webhook.fetchMessage(metaRecord.messageIds[0]).catch(() => null);
      msg2 = await webhook.fetchMessage(metaRecord.messageIds[1]).catch(() => null);
    }

    if (webhook && msg1 && msg2) {
      console.log(`[RulesService] ✏️ Mevcut kurallar mesajları güncelleniyor (${msg1.id}, ${msg2.id})...`);
      await webhook.editMessage(msg1.id, payload1).catch(() => {});
      await webhook.editMessage(msg2.id, payload2).catch(() => {});
      console.log('[RulesService] ✅ EkoYıldız kuralları V2 formatında güncellendi.');
      return true;
    }

    const messagesCollection = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    const botMessages = messagesCollection
      ? Array.from(messagesCollection.values()).filter(m => m.author.id === client.user.id || (webhook && m.author.id === webhook.id)).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      : [];

    let sentMsg1 = null;
    let sentMsg2 = null;

    if (botMessages.length >= 2) {
      if (webhook) {
        sentMsg1 = await webhook.editMessage(botMessages[0].id, payload1).catch(() => null);
        sentMsg2 = await webhook.editMessage(botMessages[1].id, payload2).catch(() => null);
      } else {
        sentMsg1 = await botMessages[0].edit(payload1).catch(() => null);
        sentMsg2 = await botMessages[1].edit(payload2).catch(() => null);
      }
    } else {
      if (botMessages.length > 0) {
        for (const m of botMessages) {
          await m.delete().catch(() => {});
        }
      }

      if (webhook) {
        sentMsg1 = await webhook.send(payload1).catch(() => null);
        sentMsg2 = await webhook.send(payload2).catch(() => null);
      } else {
        sentMsg1 = await channel.send(payload1).catch(() => null);
        sentMsg2 = await channel.send(payload2).catch(() => null);
      }
    }

    if (sentMsg1 && sentMsg2 && appMeta) {
      const ids = [sentMsg1.id, sentMsg2.id];
      if (!metaRecord) {
        appMeta.create({
          key: 'ekoYildizRulesConfig',
          messageIds: ids,
          channelId: targetChannelId
        });
      } else {
        metaRecord.messageIds = ids;
        metaRecord.channelId = targetChannelId;
        metaRecord.save();
      }
      saveStoreNow();
    }

    console.log('[RulesService] ✅ EkoYıldız kuralları başarıyla gönderildi/güncellendi.');
    return true;
  } catch (err) {
    console.error('[RulesService] ❌ Hata:', err.stack || err.message);
    return false;
  }
}

module.exports = {
  sendEkoYildizRules,
  RULES_CHANNEL_ID
};
