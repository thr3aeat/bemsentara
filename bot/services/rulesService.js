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

    // ─── CONTAINER 1: GİRİŞ + KISIM I (İLKELER) + KISIM II (GÜVENLİK/KVKK) + KISIM III (AHLAK) ───────────
    const container1 = new ContainerBuilder();

    // Banner görseli
    container1.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(BANNER_URL)
      )
    );

    // Karşılama ve Resmî Başlık
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 📜 EkoYıldız Topluluğu Resmî Anayasası ve Disiplin Mevzuatı'),
      new TextDisplayBuilder().setContent(
        `> **Mevzuat No: 2026/01** | **Yürürlük:** 07 Temmuz 2026\n` +
        `> İşbu normlar bütünü, EkoYıldız Dijital Topluluk Federasyonu'nun en üst amir ve bağlayıcı hukuki mevzuatıdır. Sunucuya katılan, doğrulama protokolünü tamamlayan veya topluluk mecralarında etkileşimde bulunan her birey bu Anayasa'nın tüm hükümlerini okumuş, idrak etmiş ve gayrikabili rücu kabul etmiş sayılır. **Kuralları ve mevzuatı bilmemek hiçbir surette mazeret teşkil etmez.**`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // Kısım 1: Temel Normlar ve İlkeler
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM I: Genel Hükümler, Devlet Değerleri ve Temel İlkeler 🏛️'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 1 (Anayasanın Üstünlüğü ve Şümul):** EkoYıldız Anayasası tüm alt yönergelerin, kanal kurallarının ve sözlü talimatların fevkindedir. Kurucular, idareciler, personeller ve tüm üyeler bu normlara istisnasız tabidir.\n` +
        `* **MADDE 2 (Milli Değerler ve Atatürk İlkeleri):** Gazi Mustafa Kemal Atatürk'e, Türkiye Cumhuriyeti'nin kurucu ilkelerine, bayrağımıza ve şehitlerimizin aziz hatırasına yönelik her türlü tahkir, saygısızlık ve aşağılama **ihtarsız süresiz ihraç (kalıcı ban)** sebebidir.\n` +
        `* **MADDE 3 (Siyasetsizlik ve Tarafsızlık Güvencesi):** Topluluk hiçbir siyasi partiye, fraksiyona, ideolojiye veya dini cemaate tabi değildir. Sunucu kanallarında partizan propaganda yürütmek, ayrıştırıcı siyasi münakaşalara girişmek mutlak surette yasaktır.\n` +
        `* **MADDE 4 (Eşitlik ve İnsan Onuru):** Bireylerin dili, ırkı, rengi, cinsiyeti, dini, mezhebi veya inancı sebebiyle hor görülmesi, alaya alınması yahut hedef gösterilmesi yasaktır. Nefret suçlarına sıfır tolerans gösterilir.\n` +
        `* **MADDE 5 (Yaş Sınırı ve Emniyet):** Discord Hizmet Şartları (ToS) uyarınca 13 yaşından küçük kullanıcıların tespiti halinde güvenlik politikaları gereğince derhal sunucuyla ilişiği kesilir.`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Kısım 2: Siber Emniyet ve KVKK
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM II: Siber Emniyet, Kişisel Veriler (KVKK) ve Mahremiyet 🛡️'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 6 (Doxxing ve Şahsi Veri İfşası Yasağı):** Üyelerin ad, soyad, T.C. kimlik, telefon, ikametgah, fotoğraf, ailevi kayıtlar veya özel hayat kayıtlarının izinsiz neşri ve ifşa şantajı **doğrudan kalıcı ihraç ve adli suç duyurusu** ile neticelenir.\n` +
        `* **MADDE 7 (Bilişim Suçları ve Zararlı Kodlar):** Virüs, truva atı, token grabber, keylogger veya sahte hediye linkleri (phishing) paylaşmak mutlak surette yasaktır.\n` +
        `* **MADDE 8 (Gizli Ses Kaydı Yasağı):** Sesli odalarda bulunan kişilerin sarih rızası bulunmaksızın gizlice ses kaydı almak ve bunu şantaj veya alay malzemesi yapmak ağır suç teşkil eder.\n` +
        `* **MADDE 9 (Hesap Güvenliği ve Yan Hesap Yasağı):** Her fert hesabının güvenliğinden mesuldür. \"Kardeşim yazdı\" gibi mazeretler kabul edilmez. Cezadan kaçmak için açılan yan hesaplar (alt-account) re'sen süresiz yasaklanır.\n` +
        `* **MADDE 10 (Destek Bilet Sistemi İntizamı):** Bilet (ticket) kanalları münhasıran meşru talep, şikayet ve adli itirazlar içindir. Sistemi meşgul etmek, trolleme veya sahte ihbar disiplin suçudur.`
      )
    );

    container1.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Kısım 3: Kamu Ahlakı ve Hassasiyetler
    container1.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM III: Kamu Ahlakı, Müstehcenlik ve E-Date Yasağı 🔞'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 11 (Müstehcenlik ve NSFW Yasağı):** Pornografik, cinsel çağrışımlı, teşhir içeren görsel, video veya linklerin paylaşımı derhal süresiz uzaklaştırma ile cezalandırılır.\n` +
        `* **MADDE 12 (Vahşet, Kan ve NSFL Yasağı):** Kan, ceset, cinayet, intihar, kendine zarar verme veya ağır şiddet içerikli materyallerin neşri mutlak olarak memnudur.\n` +
        `* **MADDE 13 (Sanal Flört ve E-Date Memnuiyeti):** Sunucu mecraları veya üyelerin DM kutuları flört, çöpçatanlık ve sanal ilişki gayesiyle kullanılamaz; üyeleri ısrarla rahatsız edenler men edilir.\n` +
        `* **MADDE 14 (Muhabere Âdabı ve Ağır Küfür):** Şahısların namus, haysiyet ve ailevi mukaddesatına yönelik ağır küfürler, galiz hakaretler ve taşkınlıklar kademeli ceza cetveli uyarınca cezalandırılır.\n` +
        `* **MADDE 15 (Dini ve Manevi Değerler):** Semavi dinlere, peygamberlere, kutsal kitaplara veya inançlara hakaret etmek toplumsal barışı dinamitlediği için en ağır müeyyideye tabidir.`
      )
    );

    // ─── CONTAINER 2: İLETİŞİM + YÖNETİM + YARGI / AYM + DOKUNULMAZLIK + BUTONLAR ───────────
    const container2 = new ContainerBuilder();

    // Kısım 4: İletişim ve Muhabere Düzeni
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM IV: İletişim Standartları, Ses Kanalları ve Reklam Yasağı 💬'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 16 (Spam, Flood ve Capslock):** Metin kanallarında peş peşe anlamsız mesaj göndermek, harf uzatmak, kanalı emojilerle kilitlemek ve sürekli büyük harfle yazmak men edilmiştir.\n` +
        `* **MADDE 17 (Kanal Amacına Uygunluk - Off-Topic):** Her oda tahsis amacına göre kullanılır. Komut kanalları dışında bot komutu yazmak veya kod odalarında geyik muhabbeti yapmak ikaz gerektirir.\n` +
        `* **MADDE 18 (İzinsiz Reklam ve DM Tanıtımı):** Kurucular Kurulu'ndan yazılı izin alınmaksızın harici sunucu daveti, yayıncı linki veya ticari bağlantı paylaşmak yasaktır. DM'den reklam doğrudan kalıcı ihraçtır.\n` +
        `* **MADDE 19 (Sesli Kanal İntizamı):** Mikrofon basarak çığlık atmak, baslı müzik açmak, soundboard veya ses değiştirici programlarla başkalarını taciz etmek yasaktır.\n` +
        `* **MADDE 20 (Rol ve Ayrıcalık Satışı Yasağı):** Sunucu içi makamlar, moderasyon rütbeleri ve unvanlar hiçbir surette nakit para veya maddi menfaat karşılığında satılamaz ve devredilemez.`
      )
    );

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Kısım 5: Yönetim ve Denetim
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM V: Yönetim Teşkilatı, Moderasyon ve İdari Sorumluluk 👑'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 21 (Tarafsızlık ve Liyakat):** Moderasyon kadrosu cezai işlemlerde ahbap-çavuş ilişkisi gözetmeksizin mutlak tarafsızlıkla hareket etmek mecburiyetindedir.\n` +
        `* **MADDE 22 (İspat ve Delil Mecburiyeti):** Tatbik edilen her disiplin yaptırımı (Mute, Jail, Kick, Ban) ekran görüntüsü, bot kaydı veya delil ile arşivlenir. Delilsiz keyfi cezalar yok hükmündedir.\n` +
        `* **MADDE 23 (Yetki Kötüye Kullanımı ve Azil):** Görevini kötüye kullanan, üyelere kaba davranan veya idari gizliliği ihlal eden yetkililer hakkında re'sen azil ve ihraç işlemi uygulanır.\n` +
        `* **MADDE 24 (Yetkiliyi ve Botu Taklit Etme):** EkoYıldız kurucularını, moderatörlerini veya resmi sistem botlarını taklit ederek üyelere talimat vermeye yeltenmek kalıcı ban sebebidir.\n` +
        `* **MADDE 25 (Hak Arama Hürriyeti):** Her üye hakkında verilen karara 72 saat içinde Destek Bilet Sistemi veya Üst Mahkeme yoluyla gerekçeli itiraz hakkını haizdir.`
      )
    );

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Kısım 6: Yargı, Mahkeme, İstinaf ve AYM
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM VI: Yargı Usulü, İtiraz Mekanizması ve Ceza Cetveli ⚖️'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 26 (Suçta ve Cezada Kanunilik):** Anayasa'da açıkça suç sayılmayan bir eylemden dolayı kimseye ceza verilemez. Cezalar şahsidir, kolektif ceza tatbik edilemez.\n` +
        `* **MADDE 27 (İstinaf ve Anayasa Mahkemesi AYM Başvurusu):** Mahkeme kararlarına karşı önce İstinaf (Üst Mahkeme), temel anayasal hak ihlallerinde ise **Anayasa Mahkemesi'ne (AYM) Bireysel Başvuru** yolu açıktır. AYM kararları nihaidir.\n` +
        `* **MADDE 28 (Standart Yaptırım Skalası):**\n` +
        `  └ ⚠️ **İhtar (Warn):** Hafif kusurlarda resmi kayıtlı ikaz.\n` +
        `  └ 🔇 **Susturma (Mute / Timeout):** 10 dk ile 7 gün arası geçici kısıtlama.\n` +
        `  └ 🚨 **Karantina (Jail):** Tahkikat sürecinde tecrit odasına alma.\n` +
        `  └ 🚪 **Sunucudan Çıkarma (Kick):** Tekrar katılım hakkıyla ihraç.\n` +
        `  └ ⏳ **Süreli İhraç (Temp-Ban):** 1 gün - 30 gün arası uzaklaştırma.\n` +
        `  └ 🚫 **Kalıcı İhraç (Perm-Ban):** Ağır cürümlerde süresiz üyelik iptali.\n` +
        `* **MADDE 29 (Sicil Affı):** 6 ay boyunca disiplin suçu işlemeyen üyelerin hafif sicil kayıtları arşive kaldırılır (Doxxing ve sabotaj failleri aftan muaftır).`
      )
    );

    container2.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // Kısım 7: Değiştirilemez Hükümler ve Yürürlük
    container2.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### | KISIM VII: Dokunulmaz Hükümler (Kırmızı Çizgiler) ve Mer\'iyet 🚨'),
      new TextDisplayBuilder().setContent(
        `* **MADDE 30 (Kırmızı Çizgiler / Mutlak Dokunulmazlık):** Anayasa'nın;\n` +
        `  └ **Madde 2:** Atatürk İlkeleri, Devlet Değerleri ve Siyasetsizlik,\n` +
        `  └ **Madde 4:** Temel İnsan Hakları ve Ayrımcılık Yasağı,\n` +
        `  └ **Madde 6:** Doxxing ve Kişisel Veri Güvenliği (KVKK),\n` +
        `  └ **Madde 11:** Kamu Ahlakı ve Müstehcenlik Men'i,\n` +
        `  └ **Madde 30:** Dokunulmazlık Maddesi,\n` +
        `  hükümleri **hiçbir surette değiştirilemez, ilga edilemez ve bunların değiştirilmesi teklif dahi edilemez.**\n` +
        `* **MADDE 31 (Yürürlük ve İcra):** İşbu Anayasa metni 07.07.2026 tarihinde ilan edilerek yürürlüğe girmiştir. İcrasına Kurucular Kurulu ve Yüksek İdare Heyeti yetkilidir.`
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
      new TextDisplayBuilder().setContent(`-# ⚖️ EkoYıldız Topluluğu Resmî Anayasası ve Disiplin Yönetmeliği • 07.07.2026 Resmî Gazete Neşriyatı`)
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
  } catch (error) {
    console.error('[RulesService] ❌ Gönderim/Güncelleme hatası:', error);
    return false;
  }
}

module.exports = {
  sendEkoYildizRules,
  RULES_CHANNEL_ID
};
