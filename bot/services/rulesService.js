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
const { BASE_URL } = require('../../config');

const RULES_CHANNEL_ID = '1535319008956649564';
const WEBHOOK_NAME = 'EkoYıldız Kurallar';
const WEBHOOK_AVATAR = 'https://i.imgur.com/HT7bvru.png';
const BANNER_URL = 'https://i.imgur.com/j3pnVTu.png';

const getAnayasaUrl = () => {
  if (process.env.ANAYASA_URL) return process.env.ANAYASA_URL;
  if (BASE_URL && !BASE_URL.includes('localhost')) {
    return `${BASE_URL.replace(/\/+$/, '')}/anayasasi`;
  }
  return 'http://ekoyildiz.duckdns.org/anayasasi';
};
const ANAYASA_URL = getAnayasaUrl();

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
    const container1 = new ContainerBuilder();

    // Banner görseli
    container1.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(BANNER_URL)
      )
    );

    // Karşılama Metni
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 📜 EkoYıldız Resmî Topluluk ve Disiplin Yönetmeliği'),
      new TextDisplayBuilder().setContent(
        `> **Resmî Mevzuat No: 2026/01** | İşbu kurallar bütünü, EkoYıldız Anayasası'nın amir hükümleri uyarınca yürürlükte olup en üst düzey bağlayıcı norm niteliğindedir. Topluluğa katılım sağlayan her üye bu yönetmeliği tebellüğ etmiş ve hükümlerine uymayı taahhüt etmiş sayılır.`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // Bölüm 1: Genel Topluluk
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM I: Genel Hukuk ve Topluluk Standartları 💬'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 1 (Discord Hizmet Koşulları):** Topluluk üyeleri Discord ToS ve Topluluk İlkelerine tam uyumla mükelleftir.\n` +
        `* **MADDE 2 (Milli Değerler ve Türk Tarihi):** Gazi Mustafa Kemal Atatürk'e, cumhuriyetimizin kurucu değerlerine ve tarihimize yönelik her türlü hakaret ve saygısızlık **süresiz ihraç (kalıcı ban)** sebebidir.\n` +
        `* **MADDE 3 (Yaş Sınırı ve Emniyet):** Discord platform standartları gereğince 13 yaşından küçük kullanıcıların tespiti halinde güvenlik politikaları uyarınca ilişiği kesilir.`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Bölüm 2: Güvenlik ve Gizlilik
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM II: Siber Emniyet, KVKK ve Mahremiyet 🛡️'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 4 (Kişisel Verilerin Gizliliği - KVKK):** Üyelerin ad, soyad, telefon, T.C. kimlik, adres, görsel veya şahsi kayıtlarının izinsiz neşri (Doxxing) ve ifşa tehdidi **ihtarsız süresiz ihraç ve adli bildirim** sebebidir.\n` +
        `* **MADDE 5 (Siber Suçlar ve Zararlı Yazılım):** Virüs, keylogger, token grabber ve sahte oltalama (phishing) bağlantıları kesinlikle yasaktır.\n` +
        `* **MADDE 6 (Ses Kayıt Prosedürü):** Sesli kanallarda üyelerin açık rızası hilafına izinsiz ses kaydı alınamaz.\n` +
        `* **MADDE 7 (Destek / Bilet Sistemi):** Destek hattı yalnızca meşru talep ve şikayetler için kullanılır; sistemi trolleme cürüm sayılır.`
      )
    );

    // ─── CONTAINER 2: MÜSTEHCENLİK + SAYGI/DÜZEN + ANAYASA ────────────────
    const container2 = new ContainerBuilder();

    // Bölüm 3: İçerik ve Müstehcenlik
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM III: Kamu Ahlakı, Müstehcenlik ve E-Date Yasağı 🔞'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 8 (NSFW ve Müstehcenlik):** Pornografik, cinsel çağrışımlı veya aşırı teşhir içeren hiçbir materyal paylaşılamaz.\n` +
        `* **MADDE 9 (NSFL ve Şiddet Unsurları):** Vahşet, kan, intihar veya toplumsal hassasiyetleri rencide edici materyaller yasaktır.\n` +
        `* **MADDE 10 (Sanal Flört / E-Date Yasağı):** Sunucu mecraları veya DM üzerinden flört ve sanal ilişki faaliyetlerinde bulunanlar sunucudan men edilir.`
      )
    );

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Bölüm 4: Saygı, Düzen ve Reklam
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM IV: Kamu İntizamı, Reklam Memnuiyeti ve Saygı 👥'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 11 (Nezaket ve İntizam):** Tahrik, aşağılama, küfür ve kışkırtma yasaktır. Fikir teatisinde medeni üslup esastır.\n` +
        `* **MADDE 12 (Hassas Konular ve Tarafsızlık):** Siyaset, din, ideoloji ve fanatizm içeren tartışmalar kısıtlanmıştır.\n` +
        `* **MADDE 13 (Radikal Söylem ve Nefret Suçu):** Ayrımcılık ve nefret sembollerinin kullanımı mutlak yasaktır.\n` +
        `* **MADDE 14 (İzinsiz Reklam Yasağı):** Kanallarda veya DM üzerinden harici sunucu, platform veya ticari oluşum tanıtımı yapılamaz.\n` +
        `* **MADDE 15 (Taklit Yasağı):** EkoYıldız yetkililerini, kurucularını veya resmi personeli taklit etmek yasaktır.`
      )
    );

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Bölüm 5: Anayasa ve Özel Hükümler
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM V: Resmî Anayasa ve Yargı Hükümleri 📜'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 16 (Anayasal Bağlayıcılık):** EkoYıldız Anayasası tüm kuralların fevkindedir. Detaylı kanun maddeleri, dokunulmaz hükümler ve ceza cetveli resmî portal üzerinden neşrolunmuştur.\n` +
        `* **MADDE 17 (Ağırlaştırılmış Yaptırım):** Anayasa'nın 2.1, 4.2 ve 20. maddelerini ihlal eden failler hakkında infaz indirimi uygulanmaz.`
      )
    );

    // Anayasa Butonu
    const rowButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('RESMÎ EKOYILDIZ ANAYASASI')
        .setStyle(ButtonStyle.Link)
        .setURL(ANAYASA_URL)
        .setEmoji('📜')
    );

    container2.addActionRowComponents(rowButtons);

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# EkoYıldız Resmî Disiplin ve Topluluk Yönetmeliği 07.07.2026 tarihi itibariyle mer'iyettedir.`)
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
