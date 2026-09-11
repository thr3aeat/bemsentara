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
const WEBHOOK_NAME = 'EkoYıldız Anayasa & Kurallar';
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

const getTicketsUrl = () => {
  if (BASE_URL && !BASE_URL.includes('localhost')) {
    return `${BASE_URL.replace(/\/+$/, '')}/tickets`;
  }
  return 'http://ekoyildiz.duckdns.org/tickets';
};
const TICKETS_URL = getTicketsUrl();

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
        reason: 'EkoYıldız Resmi Anayasa ve Kurallar Duyurusu'
      }).catch((err) => {
        console.error('[RulesService] Webhook oluşturma hatası:', err.message);
        return null;
      });
    } else {
      await webhook.edit({ name: WEBHOOK_NAME, avatar: WEBHOOK_AVATAR }).catch(() => {});
    }

    // ─── CONTAINER 1: ÖNSÖZ + KISIM I (ESASLAR) + KISIM II (HAKLAR) + KISIM III (YÜKÜMLÜLÜKLER) ───────────
    const container1 = new ContainerBuilder();

    container1.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(BANNER_URL)
      )
    );

    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 📜 EkoYıldız Topluluğu Resmî Anayasası'),
      new TextDisplayBuilder().setContent(
        `### 📜 Başlangıç / Önsöz\n` +
        `> **Resmî Mevzuat No: 2026/01** | **Yürürlük:** 07 Temmuz 2026\n` +
        `> EkoYıldız Topluluğu; dijital evrende bilginin, adaletin, yapıcı müzakere kültürünün ve ortak üretimin ön planda tutulduğu güvenli bir sosyal alan inşa etmek; bireysel hürriyetler ile kamu düzeni arasındaki sarsılmaz dengeyi kurmak amacıyla işbu Anayasa'yı en üstün bağlayıcı normlar bütünü olarak kabul ve ilan eder. Sunucuda bulunan her fert bu kurallara kayıtsız şartsız tabidir.`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // Kısım I: Temel Esaslar
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM I: Temel Esaslar (Madde 1 – 5) 🏛️'),
      new TextDisplayBuilder().setContent(
        `**MADDE 1 — Sunucunun Adı ve Hukuki Statüsü**\n` +
        `(1) Topluluğun resmî adı "EkoYıldız" olup; tüm sesli, yazılı ve web platformlarını kapsar.\n` +
        `(2) Sunucuya katılan her fert sunucunun bağımsız tüzel kurumsal kimliğine saygıyla mükelleftir.\n\n` +
        `**MADDE 2 — Yönetim Biçimi ve Temsil Erki**\n` +
        `(1) Topluluk liyakat, istişare ve hukukun üstünlüğü ilkelerine dayalı kurumsal yapıyla idare edilir.\n` +
        `(2) Temsil yetkisi münhasıran Kurucular Kurulu ile yetkilendirilmiş Yönetim Kurulu'na aittir.\n\n` +
        `**MADDE 3 — Resmî Dil**\n` +
        `(1) Topluluğun resmî iletişim ve yazışma dili Türkçedir.\n` +
        `(2) Kanallarda Türk dilinin zarafetine ve nezaket kaidelerine uygun muhabere esastır.\n\n` +
        `**MADDE 4 — Temel İlkeler ve Kurucu Değerler (MUTLAK DOKUNULMAZ)**\n` +
        `(1) Gazi Mustafa Kemal Atatürk'ün çağdaş idealleri ve cumhuriyet değerleri temel rehberdir.\n` +
        `(2) **Siyasetsizlik İlkesi:** Topluluk siyaset üstüdür; partizan propaganda yürütmek kesinlikle yasaktır.\n\n` +
        `**MADDE 5 — Anayasanın Üstünlüğü**\n` +
        `(1) Anayasa hükümleri tüm alt talimat ve teamüllerin üstündedir; aykırı emirler hükümsüzdür.\n` +
        `(2) Kanunlar geriye yürümez; sonradan ihdas edilen cezai hükümler geçmişe tatbik edilemez.`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Kısım II: Üyelerin Temel Hak ve Teminatları
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM II: Üyelerin Temel Hak ve Teminatları (Madde 6 – 9) 👥'),
      new TextDisplayBuilder().setContent(
        `**MADDE 6 — Eşit Muamele ve Hukuk Önünde Eşitlik**\n` +
        `(1) Üyeler rol, seviye veya kıdem tefriki olmaksızın kurallar önünde eşittir.\n` +
        `(2) Hiçbir yönetici şahsi yakınlık veya husumet saikiyle ayrıcalıklı işlem tesis edemez.\n\n` +
        `**MADDE 7 — Savunma Hakkı ve Adil Yargılanma**\n` +
        `(1) Hakkında disiplin işlemi yapılan her üyeye savunma hakkı tanınır.\n` +
        `(2) Disiplin işlemleri şüpheye değil, somut delillere (ekran görüntüsü, bot kütüğü) dayanır.\n` +
        `a) İspatsız yaptırımlar iptal edilir.\n` +
        `b) Suçluluğu kanıtlanana kadar her üye masumdur (Masumiyet Karinesi).\n\n` +
        `**MADDE 8 — Şikâyet ve Hak Arama Hürriyeti**\n` +
        `(1) Haksızlığa uğradığını iddia eden üye, Destek Bilet Sistemi üzerinden müracaat hakkına maliktir.\n` +
        `(2) Şikâyet hakkını kullanan üyeye hiçbir surette idari misilleme yapılamaz.\n\n` +
        `**MADDE 9 — Özel Hayatın Mahremiyeti ve DM Gizliliği (MUTLAK DOKUNULMAZ)**\n` +
        `(1) Üyelerin şahsi verilerinin izinsiz neşri (Doxxing) ve ifşa şantajı **doğrudan kalıcı ihraçtır**.\n` +
        `(2) İzinsiz ses kaydı almak ve üyeleri DM kutularından rahatsız etmek yasaktır.`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Kısım III: Üyelerin Yükümlülükleri
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM III: Üyelerin Temel Yükümlülükleri (Madde 10 – 13) 🛡️'),
      new TextDisplayBuilder().setContent(
        `**MADDE 10 — Anayasa ve Mevzuata Riayet Mükellefiyeti**\n` +
        `(1) Üyeler bu Anayasa hükümlerine tam uyumla yükümlüdür; kuralları bilmemek mazeret değildir.\n\n` +
        `**MADDE 11 — Karşılıklı Hürmet ve Nezaket Âdabı**\n` +
        `(1) Şahsa, ailevi değerlere ve kutsallara yönelik ağır küfür, hakaret ve tahkir yasaktır.\n\n` +
        `**MADDE 12 — Kamu Düzeninin Korunması**\n` +
        `(1) Sunucu içerisinde görev ve yetki kullanan personele yönelik tehdit, ağır hakaret, görev engelleme veya yetkinin icrasını kasıtlı şekilde aksatmaya yönelik davranışlar disiplin yaptırımına tabidir.\n` +
        `(2) Asayişi temine yönelik meşru idari talimatlara riayet zorunludur.\n\n` +
        `**MADDE 13 — Düzeni Bozucu Eylemlerin Men'i**\n` +
        `(1) Spam, flood, capslock, off-topic, izinsiz reklam, virüs ve dolandırıcılık bağlantıları yasaktır.`
      )
    );

    // ─── CONTAINER 2: KISIM IV - X (YASAMA, YÜRÜTME, YARGI, OHAL, DEĞİŞİKLİK, İCRA) ───────────
    const container2 = new ContainerBuilder();

    // Kısım IV & V: Yasama ve Yürütme
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM IV & V: Yasama, Yürütme ve İdari Yapı (Madde 14 – 18) 👑'),
      new TextDisplayBuilder().setContent(
        `**MADDE 14 — Kural Koyma ve Yasama Salahiyeti**\n` +
        `(1) Toplulukta kural ihdası Kurucular Kurulu ve Yönetim Kurulu Meclisi salahiyetindedir.\n\n` +
        `**MADDE 15 — Topluluk İstişaresi**\n` +
        `(1) Hayati yapısal kararlarda istişari üye anketleri düzenlenebilir.\n\n` +
        `**MADDE 16 & 17 — Yürütme Erki ve Günlük İdare**\n` +
        `(1) Günlük idari işleyiş ve asayiş Kurucular, Yöneticiler (Admins) ve Moderatörlerce sevk olunur.\n\n` +
        `**MADDE 18 — Rol ve Ayrıcalıkların Satılamazlığı**\n` +
        `(1) Sunucu rolleri ve unvanları nakdi menfaat mukabilinde satılamaz, devredilemez.`
      )
    );

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Kısım VI & VII: Yetki Sınırı ve Yargı Hukuku
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM VI & VII: Yetki Sınırları, Yargı ve İtiraz (Madde 19 – 26) ⚖️'),
      new TextDisplayBuilder().setContent(
        `**MADDE 19 — Yetkinin Sınırları ve Keyfilik Yasağı**\n` +
        `(1) Hiçbir yetkili keyfi ceza tayin edemez; husumetle hareket eden personelin yetkisi alınır.\n\n` +
        `**MADDE 20 — İspat ve Kayıt Altına Alma Mecburiyeti**\n` +
        `(1) Uygulanan her ceza log/kanıt ile arşivlenir. Delilsiz cezalar talep halinde hükümsüzdür.\n\n` +
        `**MADDE 22 & 23 — Suçta Kanunilik ve Ceza Kademeleri**\n` +
        `(1) Mevzuatta yazmayan eyleme ceza verilemez. Cezalar şahsidir.\n` +
        `(2) Skala: **Uyarı (Warn) ➔ Susturma (Mute) ➔ Karantina (Jail) ➔ Atılma (Kick) ➔ İhraç (Ban)**\n\n` +
        `**MADDE 25 — İtiraz Mekanizması, İstinaf ve AYM Başvurusu**\n` +
        `(1) Ceza alan üye 72 saatte Bilet üzerinden İstinaf (Üst Mahkeme) incelemesi isteyebilir.\n` +
        `(2) Anayasal hak ihlallerinde Kurucular riyasetindeki **Anayasa Mahkemesi'ne (AYM)** başvurulabilir; AYM kararı nihaidir.`
      )
    );

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Kısım VIII, IX, X: OHAL, Değişiklik ve Son Hükümler
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM VIII, IX & X: Olağanüstü Hâl, Değişiklik ve Yürürlük 🚨'),
      new TextDisplayBuilder().setContent(
        `**MADDE 27 & 28 — Olağanüstü Hâl (OHAL) ve Özel Tedbirler**\n` +
        `(1) Baskın (raid), bot saldırısı veya kritik güvenlik krizlerinde Kurucular re'sen OHAL ilan edebilir.\n` +
        `(2) OHAL'de davetleri askıya alma, kanalları kilitleme (lockdown) ve şüpheli hesapları topluca tecrit yetkisi caridir.\n\n` +
        `**MADDE 29 — Anayasa Değişiklik Usulü**\n` +
        `(1) Değişiklik teklifleri; **Kurucu onayı ve Üst Yönetimin 2/3 çoğunluk oyuyla** kabul edilebilir.\n\n` +
        `**MADDE 30 — Değiştirilemez Hükümler (Kırmızı Çizgiler)**\n` +
        `(1) Madde 1 (Ad/Statü), Madde 3 (Resmî Dil), Madde 4 (Atatürk/Siyasetsizlik), Madde 9 (KVKK/Doxxing) ve Madde 30 hükümleri **değiştirilemez ve teklif dahi edilemez**.\n\n` +
        `**MADDE 31 & 32 — Yürürlük ve İcra**\n` +
        `(1) İşbu Anayasa 07.07.2026 tarihinde yürürlüğe girmiş olup, icrasına Kurucular Kurulu yetkilidir.`
      )
    );

    // İnteraktif Butonlar
    const rowButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('RESMÎ ANAYASA PORTALI')
        .setStyle(ButtonStyle.Link)
        .setURL(ANAYASA_URL)
        .setEmoji('📜'),
      new ButtonBuilder()
        .setLabel('DESTEK VE BİLET HATTI')
        .setStyle(ButtonStyle.Link)
        .setURL(TICKETS_URL)
        .setEmoji('🎫')
    );

    container2.addActionRowComponents(rowButtons);

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ⚖️ EkoYıldız Resmî Anayasası ve Disiplin Yönetmeliği • Madde 1–32 • Yürürlük: 07.07.2026`)
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

    console.log('[RulesService] ✅ EkoYıldız anayasası başarıyla gönderildi/güncellendi.');
    return true;
  } catch (error) {
    console.error('[RulesService] ❌ Gönderim/Güncelleme hatası:', error);
    return false;
  }
}

module.exports = {
  sendEkoYildizRules,
  RULES_CHANNEL_ID
};
