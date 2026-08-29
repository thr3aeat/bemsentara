const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
  AttachmentBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const ComponentsV2Factory = require("../utils/componentsV2Factory");
const DataStore = require("./robloxLandDataStore");

// Target IDs
const GUILD_ID = "1537407325290237973";
const TICKET_CATEGORY_ID = "1538466419245719663";
const STAFF_LOG_CHANNEL_ID = "1543382733408174220";

const CHANNELS = {
  RULES: "1538465174602649611",
  SCAMMERS: "1538466110158938162",
  ORDER_RULES: "1538464717444747274",
  ABOUT_US: "1538465264142786621",
  STAFF_APPLY: "1538465462394814485",
  TICKET_PANEL: "1538466553173905468",
  AD_PACKAGES: "1538467688060297276",
  PAYMENT_METHODS: "1538465641131151461",
  FAQ: "1538465557031030835",
  LEVEL_LOG: "1538481757404274708",
  // 10 Satış kanalları
  ROBUX: "1538477657984073728",
  GROUP: "1538477762442956830",
  MEMBER: "1538477806537678898",
  FOLLOWER: "1538477845314273311",
  GROUP_MEMBER: "1538477945041977385",
  INSTAGRAM: "1538478070812516372",
  BOT: "1538478164005625896",
  MAP: "1538478237037109349",
  OWO: "1538478293987233852",
  GFX: "1540476977629364235"
};

const STATE_FILE = path.join(__dirname, "../../data/robloxland_setup_state.json");

function getSetupState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch (err) {}
  return { deployed: false, lastUpdated: null };
}

function saveSetupState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("[RobloxLandSetup] State save error:", err.message);
  }
}

// ─── 1. Kurallar Paneli (1538465174602649611) ──────────────────────────────────
function buildRulesPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 📜 RobloxLand — Topluluk & Sunucu Kuralları\n\n` +
      `RobloxLand sunucusunda herkesin güvenli, saygılı ve profesyonel bir ortamda ticaret ve geliştirme yapabilmesi için aşağıdaki kurallara uyulması zorunludur.\n\n` +
      `### 1. Genel Ahlak ve Saygı\n` +
      `• Herhangi bir üyeye, geliştiriciye veya yetkiliye hakaret, küfür, argo, aşağılama ve toksik davranışlar kesinlikle yasaktır.\n` +
      `• Din, dil, ırk, siyaset ve cinsiyet ayrımcılığına sıfır tolerans gösterilir (Doğrudan kalıcı uzaklaştırma).\n\n` +
      `### 2. Reklam ve Yetkisiz Tanıtım\n` +
      `• Sohbet kanallarında, ses odalarında veya üyelerin özel mesajlarında (DM) yetkisiz sunucu, ürün veya link reklamı yapmak yasaktır.\n` +
      `• Reklam satın alımları için yalnızca yetkili reklam kanallarımızı ve paketlerimizi kullanınız.\n\n` +
      `### 3. Ticaret Güvenliği ve Dolandırıcılık\n` +
      `• Kanıtlanmış herhangi bir dolandırıcılık, sahte kanıt üretme veya teslimat yapmama durumunda kişi **Kara Liste**ye alınır ve tüm platformlardan yasaklanır.\n` +
      `• Güvenliğiniz için tüm alışverişlerinizi resmi destek talebi (ticket) üzerinden yetkililer eşliğinde gerçekleştiriniz.\n\n` +
      `### 4. Spam ve Düzen\n` +
      `• Kanallarda flood, spam, caps-lock kullanımı ve gereksiz etiketleme yapmak yasaktır.\n\n` +
      `-# RobloxLand • Kurallara uymayanlar sunucu yönetimince sorgusuz ceza alma hakkına tabidir.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Link,
        label: "🛡️ Dolandırıcı Listesi & Bildir",
        url: `https://discord.com/channels/${GUILD_ID}/${CHANNELS.SCAMMERS}`
      },
      {
        style: ButtonStyle.Link,
        label: "🛒 Sipariş Kuralları",
        url: `https://discord.com/channels/${GUILD_ID}/${CHANNELS.ORDER_RULES}`
      },
      {
        style: ButtonStyle.Secondary,
        label: "👤 Profilim",
        custom_id: "robloxland_open_my_profile",
        emoji: { name: "👤" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 2. Dolandırıcılar & Kara Liste Paneli (1538466110158938162) ───────────────
function buildScammerPanelPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 🚨 RobloxLand — Dolandırıcı Kara Liste & Güvenlik Sistemi\n\n` +
      `Topluluğumuzda güvenli ticareti sağlamak adına dolandırıcılık teşebbüsünde bulunan, sahte dekont atan veya teslimat yapmayan kullanıcılar bu sistem üzerinden kayıt altına alınır.\n\n` +
      `### ⚠️ Güvenlik İlkelerimiz:\n` +
      `• Sunucumuzdaki hiçbir yetkili sizden hesap şifrenizi veya e-posta doğrulama kodunuzu istemez.\n` +
      `• DM üzerinden size indirim vadeden veya yetkili olduğunu iddia eden kişilere itibar etmeyiniz.\n` +
      `• Şüpheli bir durumla karşılaştığınızda derhal aşağıdaki **Dolandırıcı Bildir** butonuna basarak ihbar ediniz.\n\n` +
      `### 🔎 Güvenlik & Kara Liste Sorgulama\n` +
      `Ticaret yapmadan önce kullanıcının Discord ID'sini girerek **Güven Puanını** ve kara liste kaydını anında sorgulayabilirsiniz.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Danger,
        label: "🚨 Dolandırıcı Bildir",
        custom_id: "robloxland_scam_report",
        emoji: { name: "⚠️" }
      },
      {
        style: ButtonStyle.Primary,
        label: "🔎 Kullanıcı / ID Sorgula",
        custom_id: "robloxland_user_lookup",
        emoji: { name: "🔍" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "👤 Profilim",
        custom_id: "robloxland_open_my_profile",
        emoji: { name: "👤" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 3. Sipariş Kuralları Paneli (1538464717444747274) ──────────────────────────
function buildOrderRulesPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 💰 RobloxLand — Sipariş & Satış Kuralları\n\n` +
      `Tüm müşterilerimizin haklarını ve güvenliğini korumak amacıyla sipariş süreçleri belirli kurallar çerçevesinde yürütülmektedir.\n\n` +
      `### 📌 Sipariş Esasları:\n` +
      `1. **Ödeme Önceliği:** Tüm siparişler ödeme alındıktan sonra işleme alınır ve sıraya eklenir.\n` +
      `2. **Teslimat Süreleri:** Sipariş türüne göre tahmini teslimat süresi sipariş kartınızda belirtilir.\n` +
      `3. **İade Politikası:** Dijital ürün ve hizmetlerde (Robux, Takipçi, Üye, Özel Map vb.) işlem başlatıldıktan sonra keyfi iade yapılmaz.\n` +
      `4. **Yetkili Aracılığı:** Tüm alışverişler sunucunun resmi bilet kanalları üzerinden kayıt altında yapılır.\n` +
      `5. **Ödeme Yöntemleri:** IBAN (Havale/EFT), İtemSatış, OwO Coin ve Google Play Kod seçenekleri desteklenmektedir.\n\n` +
      `-# Sipariş oluşturmak için ilgili kategorideki 'Satın Al' butonlarını veya Destek panelini kullanınız.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🛒 Sipariş Oluştur",
        custom_id: "robloxland_start_order_flow",
        emoji: { name: "🛍️" }
      },
      {
        style: ButtonStyle.Primary,
        label: "📦 Sipariş Durumu Sorgula",
        custom_id: "robloxland_order_lookup_btn",
        emoji: { name: "📦" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 4. Biz Kimiz Paneli (1538465264142786621) ──────────────────────────────────
function buildAboutUsPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 🌟 RobloxLand — Biz Kimiz?\n\n` +
      `**RobloxLand**, Roblox ekosisteminde geliştiricileri, tasarımcıları, oyuncuları ve alıcıları tek bir çatı altında toplayan profesyonel bir topluluk ve dijital hizmet merkezidir.\n\n` +
      `### 🚀 Ne Yapıyoruz?\n` +
      `• **Roblox Geliştirme:** Harita yapımı (Map Building), modelleme, script yazımı ve sistem entegrasyonları.\n` +
      `• **Grafik & Tasarım:** Özel 3D GFX, logo, banner, thumbnail ve arayüz (UI) tasarımları.\n` +
      `• **Dijital Varlıklar:** Robux tedariği, grup satışı, takipçi/üye sistemleri ve bot hizmetleri.\n` +
      `• **Güvenli Pazar:** Alıcı ve satıcıyı koruyan, dolandırıcılığa karşı şeffaf ve denetlenen ticaret ortamı.\n\n` +
      `### 💎 Vizyonumuz\n` +
      `Türkiye'nin en güvenilir, hızlı ve kaliteli Roblox geliştirici ve dijital ürün platformu olmak.\n\n` +
      `-# Bizimle iletişime geçmek ve hizmet almak için destek talebi açabilirsiniz.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Primary,
        label: "💬 Destek & İletişim",
        custom_id: "robloxland_open_ticket_destek",
        emoji: { name: "📞" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "👤 Profilim",
        custom_id: "robloxland_open_my_profile",
        emoji: { name: "👤" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 5. Yetkili Alım Formu Paneli (1538465462394814485) ─────────────────────────
function buildStaffApplyPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# **Robloxland Yetkili Alım Formu!**\n\n` +
      `*İsim*:\n\n` +
      `*Hiç Satış Mağzasında Bulundunmu*:\n\n` +
      `*Müşteri Çeke Bilirmisin*:\n\n` +
      `*Başka Bir Yerde Yetkilimisin?*:\n\n\n` +
      `-# Formu Doldurmak Zorunlu\n\n` +
      `Ekibimize katılmak ve Robloxland bünyesinde yetkili/satış danışmanı olmak için aşağıdaki butona tıklayarak başvuru formunu eksiksiz doldurunuz.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "📝 Yetkili Başvuru Formunu Doldur",
        custom_id: "robloxland_staff_apply",
        emoji: { name: "📋" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 6. Destek & Ticket Paneli (1538466553173905468) ───────────────────────────
function buildTicketPanelPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 🎫 RobloxLand — Destek & Talep Merkezi\n\n` +
      `RobloxLand sunucusunda ihtiyacınız olan destek ve işlemler için lütfen aşağıdaki **açılır menüden** size uygun olan talep kategorisini seçiniz.\n\n` +
      `### 📂 Talep Kategorileri:\n` +
      `• 👑 **Yönetim Ekibi ile Görüşme:** Ortaklık, özel anlaşmalar ve üst düzey konular.\n` +
      `• 📢 **Reklam Satın Alma:** Sunucu tanıtımı, toplu DM duyuruları ve YouTube/Eko Yıldız sponsorlukları.\n` +
      `• 🚨 **Birisini Şikayet Etme:** Dolandırıcılık bildirme, kural ihlali ve yetkili şikayetleri.\n` +
      `• 🛒 **Ürün / Hizmet Siparişi:** Robux, Grup, Takipçi, Üye, Bot, Harita, GFX ve OwO Coin işlemleri.\n` +
      `• ❓ **Genel Destek:** Sistemler, roller ve sunucu içi sorularınız.\n\n` +
      `Seçim yaptığınızda **1538466419245719663** kategorisinde size özel gizli bir destek odası oluşturulacaktır.`
    ),
    ComponentsV2Factory.separator(true),
    {
      type: 1, // ActionRow
      components: [
        {
          type: 3, // StringSelect
          custom_id: "robloxland_ticket_select",
          placeholder: "📩 Lütfen açmak istediğiniz destek türünü seçiniz...",
          options: [
            {
              label: "👑 Yönetim ekibi ile konuşmak istiyorum.",
              value: "yonetim",
              description: "Üst yönetim, ortaklık ve acil durumlar.",
              emoji: { name: "👑" }
            },
            {
              label: "📢 Reklam satın almak istiyorum.",
              value: "reklam",
              description: "Sunucu, YouTube, Eko Yıldız reklam paketleri.",
              emoji: { name: "📢" }
            },
            {
              label: "🚨 Birisini şikayet etmek istiyorum.",
              value: "sikayet",
              description: "Dolandırıcılık, kural ihlali veya yetkili şikayeti.",
              emoji: { name: "🚨" }
            },
            {
              label: "🛒 Ürün / Hizmet siparişi vermek istiyorum.",
              value: "siparis",
              description: "Robux, Grup, Takipçi, Bot, Map, GFX, OwO vb.",
              emoji: { name: "🛒" }
            },
            {
              label: "❓ Genel bir soru / destek almak istiyorum.",
              value: "destek",
              description: "Sunucu içi genel sorular ve yardım.",
              emoji: { name: "❓" }
            }
          ]
        }
      ]
    },
    ComponentsV2Factory.separator(false),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Secondary,
        label: "👤 Profilim",
        custom_id: "robloxland_open_my_profile",
        emoji: { name: "👤" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "📦 Sipariş Sorgula",
        custom_id: "robloxland_order_lookup_btn",
        emoji: { name: "🔍" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🎟️ Kupon Kullan",
        custom_id: "robloxland_use_coupon_btn",
        emoji: { name: "🎟️" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 7. Reklam & Sponsorluk Paketleri Paneli (1538467688060297276) ─────────────
function buildAdPackagesPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 📢 ROBLOXLND — REKLAM & SPONSORLUK\n\n` +
      `Sunucunuzu, oyununuzu veya YouTube kanalınızı binlerce aktif üyeye duyurmanın en etkili yolu.\n\n` +
      `> 🟢 **Reklam Durumu:** Aktif & Açık\n` +
      `> ⚡ **Ortalama Teslim:** 15–45 dakika\n` +
      `> 📊 **Aktif Kitle:** Aktif Roblox ve Discord Topluluğu\n\n` +
      `### 📦 Reklam Paketleri\n` +
      `🥉 **1. Ucuz Paket (Here Etiketi):** \`45 TL İtemSatış\` / \`55 TL IBAN\` / \`2.5M OwO\`\n` +
      `🥈 **2. Orta Paket (Everyone Etiketi):** \`70 TL İtemSatış\` / \`80 TL IBAN\` / \`5.0M OwO\`\n` +
      `🥇 **3. Pahalı Paket (Everyone + Özel Kanal + Çekiliş):** \`105 TL İtemSatış\` / \`120 TL IBAN\` / \`8.0M OwO\` ⭐ **EN POPÜLER**\n` +
      `👑 **4. Mega Paket (Everyone + Özel Kanal + Toplu DM Duyuru):** \`150 TL İtemSatış\` / \`175 TL IBAN\` / \`12M OwO\`\n` +
      `💎 **5. Premium Paket (Kalıcı Everyone + Üst Kategori + 2 DM):** \`195 TL İtemSatış\` / \`230 TL IBAN\` / \`18M OwO\`\n` +
      `🎬 **6. YouTube & Eko Yıldız Ortak Sponsor Paketi:** \`290 TL İtemSatış\` / \`340 TL IBAN\` / \`25M OwO\`\n\n` +
      `### 🛡️ Güvencelerimiz\n` +
      `✓ Ticket üzerinden güvenli teslimat\n` +
      `✓ İstatistik ve görüntülenme raporu\n` +
      `✓ Canlı teslimat dekontu`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🛒 Reklam Satın Al",
        custom_id: "robloxland_open_ticket_reklam",
        emoji: { name: "📢" }
      },
      {
        style: ButtonStyle.Primary,
        label: "🛠️ Kendi Paketini Oluştur & Fiyat Hesapla",
        custom_id: "robloxland_custom_ad_package",
        emoji: { name: "✨" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🎟️ Kupon Kullan",
        custom_id: "robloxland_use_coupon_btn",
        emoji: { name: "🎟️" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 8. Ödeme Yöntemleri Paneli (1538465641131151461) ──────────────────────────
function buildPaymentMethodsPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 💳 ROBLOXLND — ÖDEME YÖNTEMLERİ\n\n` +
      `RobloxLand üzerinden yapacağınız tüm alışverişlerde desteklenen resmi ödeme yöntemleri ve komisyon bilgileri:\n\n` +
      `### 🏦 1. IBAN & FAST (Havale / EFT)\n` +
      `• **Komisyon:** %0 (Sıfır Komisyon)\n` +
      `• **Özellik:** 7/24 anında hesaba geçer, açıklama kısmına yalnızca Ticket Numarası yazılır.\n\n` +
      `### 🛒 2. İtemSatış (Güvenli Ticaret)\n` +
      `• **Komisyon:** En düşük İtemSatış komisyonu ile ilan üzerinden ödeme.\n` +
      `• **Özellik:** Kredi Kartı, Banka Kartı, Papara, İninal, Havale destekler.\n\n` +
      `### 🪙 3. OwO Coin\n` +
      `• **Özellik:** Discord içi sanal bakiye transferi ile anında ödeme.\n` +
      `• **Komisyon:** Bot kesintileri tarafımızdan dengelenir.\n\n` +
      `### 🎁 4. Google Play Hediye Kodu\n` +
      `• **Özellik:** Mağazalardan temin edilen orijinal dijital kodlar kabul edilir.\n\n` +
      `-# Ödeme yapmadan önce mutlaka destek talebi açıp yetkiliden güncel hesap bilgisi isteyiniz.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🛒 Sipariş Talebi Aç",
        custom_id: "robloxland_start_order_flow",
        emoji: { name: "🛍️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "👤 Profilim",
        custom_id: "robloxland_open_my_profile",
        emoji: { name: "👤" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 9. Sıkça Sorulan Sorular (SSS) Paneli (1538465557031030835) ─────────────────
function buildFaqPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# ❓ ROBLOXLND — SIKÇA SORULAN SORULAR (SSS)\n\n` +
      `Müşterilerimizin ve üyelerimizin en çok merak ettiği soruların yanıtları:\n\n` +
      `**S1: Satın aldığım Robux / Ürün ne zaman teslim edilir?**\n` +
      `C: Robux, grup ve üye siparişleri ödeme onayından sonra ortalama 5–30 dakika içerisinde teslim edilir. Harita ve bot siparişleri teslimat takvimine göre ilerler.\n\n` +
      `**S2: Hesap şifremi vermem gerekiyor mu?**\n` +
      `C: Kesinlikle HAYIR! Hiçbir işlemde hesap şifreniz istenmez. Yalnızca Roblox kullanıcı adınız veya profil linkiniz yeterlidir.\n\n` +
      `**S3: Dolandırıcılığa karşı nasıl korunurum?**\n` +
      `C: Asla DM üzerinden kimseyle ticaret yapmayınız. Tüm işlemlerinizi bu sunucudaki resmi ticket kanalları üzerinden yetkililerle yürütünüz.\n\n` +
      `**S4: Siparişimi nasıl takip edebilirim?**\n` +
      `C: Size verilen \`#RBLX-XXXX\` sipariş kodunu \`!sipariş RBLX-XXXX\` yazarak canlı olarak sorgulayabilirsiniz.\n\n` +
      `**S5: LandCoin ve VIP sistemi nedir?**\n` +
      `C: Her 100 TL harcamanızda 10 LandCoin kazanırsınız. LandCoin'lerinizle ücretsiz indirim, reklam ve VIP üyelik alabilirsiniz.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Primary,
        label: "🎫 Destek Al",
        custom_id: "robloxland_open_ticket_destek",
        emoji: { name: "💬" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "👤 Profilim & Puanlarım",
        custom_id: "robloxland_open_my_profile",
        emoji: { name: "👤" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 10. Seviye Sistemi Log Paneli (1538481757404274708) ────────────────────────
function buildLevelLogPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 🏆 ROBLOXLND — SEVİYE & LANDCOIN LOGLARI\n\n` +
      `Sunucumuzda aktiflik gösteren, sipariş tamamlayan ve topluluğa katkı sağlayan üyelerin seviye atlama, LandCoin kazanım ve VIP terfi duyuruları bu kanalda yayınlanır.\n\n` +
      `> ⚡ **XP Kazanımı:** Mesaj yazma, etkinliklere katılma, ticket çözümleri\n` +
      `> 🪙 **LandCoin:** Her 100 TL harcamada +10 Coin\n` +
      `> 💎 **VIP Terfisi:** 500+ LandCoin veya 5.000 TL üzeri harcama\n\n` +
      `-# Kendi profilinizi ve puanınızı görmek için aşağıdaki butona basabilirsiniz.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Secondary,
        label: "👤 Profilimi Görüntüle",
        custom_id: "robloxland_open_my_profile",
        emoji: { name: "👤" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 11. Modern ve Şık Ürün Kartları Konfigürasyonu ─────────────────────────────
const SALES_CONFIG = {
  [CHANNELS.ROBUX]: {
    title: "💎 ROBUX MAĞAZASI",
    summary: "Hızlı, güvenli ve %100 temiz bakiye garantisiyle Robux stokları.",
    status: "🟢 Stokta & Siparişler Açık",
    delivery: "5–30 dakika",
    stock: "Bol Stok",
    tiers: [
      "🥉 1.000 Robux — `850 TL IBAN` / `790 TL İtemSatış` / `45M OwO`",
      "🥈 5.000 Robux — `3.900 TL IBAN` / `3.650 TL İtemSatış` / `210M OwO`",
      "🥇 10.000 Robux — `7.500 TL IBAN` / `6.990 TL İtemSatış` / `400M OwO` ⭐ **EN POPÜLER**",
      "👑 50.000 Robux — `34.000 TL IBAN` / `31.500 TL İtemSatış` / `1.8B OwO`",
      "🌌 100.000 Robux — `65.000 TL IBAN` / `59.900 TL İtemSatış` / `3.5B OwO`"
    ],
    guarantees: [
      "✓ Ticket üzerinden faturalı & güvenli işlem",
      "✓ Gamepass ve Grup Fonu ile anında transfer",
      "✓ 7/24 Aktif Satış Yetkilisi desteği"
    ]
  },
  [CHANNELS.GROUP]: {
    title: "👥 ROBLOX GRUP MAĞAZASI",
    summary: "2010–2018 eski tarihli, prestijli, temiz sicilli Roblox grupları.",
    status: "🟡 Son 4 Adet Kaldı",
    delivery: "10–20 dakika",
    stock: "Kısıtlı Nadir Stok",
    tiers: [
      "🏷️ Standart Temiz Grup (2018–2020) — `950 TL IBAN` / `890 TL İtemSatış`",
      "📜 Nostaljik Vintage Grup (2014–2017) — `2.500 TL IBAN` / `2.250 TL İtemSatış` ⭐ **EN POPÜLER**",
      "🏛️ Ultra Old / Rare Grup (2010–2013) — `5.800 TL IBAN` / `5.200 TL İtemSatış`",
      "👥 1.000+ Üyeli Aktif Gelirli Grup — `4.200 TL IBAN` / `3.850 TL İtemSatış`",
      "👑 10.000+ Dev Marka Roblox Grubu — `18.500 TL IBAN` / `16.900 TL İtemSatış`"
    ],
    guarantees: [
      "✓ Anında Ownership (Sahiplik) devri",
      "✓ Temiz geçmiş ve ban garantisi",
      "✓ İçerisinde kurulu mağaza ve oyun düzeni"
    ]
  },
  [CHANNELS.MEMBER]: {
    title: "📈 DİSCORD ÜYE & BOOST MAĞAZASI",
    summary: "Sunucunuzun popülerliğini ve aktifliğini artıracak garantili üye transferi.",
    status: "🟢 Siparişler Açık",
    delivery: "15–60 dakika",
    stock: "Yüksek Kapasite",
    tiers: [
      "📦 500 Çevrimdışı Kaliteli Üye — `650 TL IBAN` / `580 TL İtemSatış`",
      "📦 1.000 Çevrimdışı Kaliteli Üye — `1.200 TL IBAN` / `1.050 TL İtemSatış`",
      "🟢 500 %100 Aktif / Online Üye — `1.800 TL IBAN` / `1.600 TL İtemSatış`",
      "🟢 1.000 %100 Aktif / Online Üye — `3.400 TL IBAN` / `3.050 TL İtemSatış` ⭐ **EN POPÜLER**",
      "👑 5.000 VIP Sunucu Doldurma Paketi — `10.500 TL IBAN` / `9.400 TL İtemSatış`",
      "🌌 10.000 Dev Topluluk Paketi (Boost Dahil) — `19.500 TL IBAN` / `17.500 TL İtemSatış`"
    ],
    guarantees: [
      "✓ Spam & Bot algoritmalarına karşı kademeli giriş",
      "✓ 30 gün boyunca düşmeme telafi garantisi",
      "✓ Avatarlı, oyun oynayan gerçekçi hesaplar"
    ]
  },
  [CHANNELS.FOLLOWER]: {
    title: "👤 ROBLOX PROFİL TAKİPÇİSİ",
    summary: "Roblox profilinizi fenomen seviyesine çıkaracak kalıcı takipçi paketleri.",
    status: "🟢 Siparişler Açık",
    delivery: "5–15 dakika",
    stock: "Sınırsız",
    tiers: [
      "👤 2.500 Profil Takipçisi — `750 TL IBAN` / `680 TL İtemSatış`",
      "👤 5.000 Profil Takipçisi — `1.400 TL IBAN` / `1.250 TL İtemSatış`",
      "⭐ 10.000 Fenomen Takipçi — `2.600 TL IBAN` / `2.350 TL İtemSatış` ⭐ **EN POPÜLER**",
      "👑 50.000 Yıldız Profil Paketi — `11.500 TL IBAN` / `10.200 TL İtemSatış`",
      "🌌 100.000 Efsane Geliştirici Paketi — `21.000 TL IBAN` / `18.900 TL İtemSatış`"
    ],
    guarantees: [
      "✓ Şifresiz işlem (Yalnızca profil linki yeterli)",
      "✓ Kalıcı ve düşmeyen takipçi garantisi",
      "✓ Anında başlayıp dakikalar içinde tamamlanan teslimat"
    ]
  },
  [CHANNELS.GROUP_MEMBER]: {
    title: "🛡️ ROBLOX GRUP ÜYESİ MAĞAZASI",
    summary: "Roblox grubunuzu büyütmek ve oyunlarınıza organik oyuncu çekmek için dev üye transferi.",
    status: "🟢 Siparişler Açık",
    delivery: "10–45 dakika",
    stock: "Yüksek Stok",
    tiers: [
      "🛡️ 1.000 Grup Üyesi — `1.100 TL IBAN` / `990 TL İtemSatış`",
      "🛡️ 2.500 Grup Üyesi — `2.600 TL IBAN` / `2.350 TL İtemSatış`",
      "⭐ 5.000 Grup Üyesi — `4.900 TL IBAN` / `4.400 TL İtemSatış` ⭐ **EN POPÜLER**",
      "👑 20.000 Mega Grup Üyesi — `16.500 TL IBAN` / `14.800 TL İtemSatış`",
      "🌌 50.000 Ultra Popüler Grup — `38.000 TL IBAN` / `34.000 TL İtemSatış`"
    ],
    guarantees: [
      "✓ Güvenli ve ceza riski sıfır aktarım",
      "✓ Gruptan çıkmayan kalıcı üyeler",
      "✓ Manuel katılım kapalıyken anında tamamlama"
    ]
  },
  [CHANNELS.INSTAGRAM]: {
    title: "📸 INSTAGRAM TAKİPÇİ & ETKİLEŞİM",
    summary: "Sayfanız veya stüdyonuz için organik keşfet etkili Türk/Global takipçi paketleri.",
    status: "🟢 Siparişler Açık",
    delivery: "15–45 dakika",
    stock: "Aktif Stok",
    tiers: [
      "📸 2.500 Organik Takipçi — `650 TL IBAN` / `580 TL İtemSatış`",
      "📸 5.000 Organik Takipçi — `1.200 TL IBAN` / `1.080 TL İtemSatış`",
      "🌟 10.000 Mavi Tik Uyumlu Takipçi — `2.300 TL IBAN` / `2.050 TL İtemSatış` ⭐ **EN POPÜLER**",
      "👑 50.000 Fenomen Hesabı Paketi — `9.800 TL IBAN` / `8.900 TL İtemSatış`",
      "🌌 100.000 İnfluencer Paketi — `18.500 TL IBAN` / `16.800 TL İtemSatış`"
    ],
    guarantees: [
      "✓ Şifresiz ve %100 güvenli",
      "✓ Keşfet ve etkileşim desteği",
      "✓ Düşmelere karşı 30 gün telafi"
    ]
  },
  [CHANNELS.BOT]: {
    title: "🤖 ÖZEL DİSCORD BOTU & WEB PANEL",
    summary: "İhtiyaçlarınıza özel kodlanmış, kesintisiz çalışan, sıfır gecikmeli Discord.js v14 botları.",
    status: "🟢 Siparişler Açık",
    delivery: "3–7 gün",
    stock: "Özel Yazılım Ekibi",
    tiers: [
      "🤖 Temel Yönetim & Kayıt Botu — `1.800 TL IBAN` / `1.600 TL İtemSatış`",
      "🪙 Gelişmiş Ekonomi & Mağaza Botu — `3.500 TL IBAN` / `3.150 TL İtemSatış`",
      "🛡️ Roblox Grup Sıralama (Ranking) & Doğrulama Botu — `5.200 TL IBAN` / `4.700 TL İtemSatış` ⭐ **EN POPÜLER**",
      "👑 Tam Kapsamlı Özel Sunucu Yönetim Sistemi — `9.800 TL IBAN` / `8.900 TL İtemSatış`",
      "🌌 Web Dashboard (Panel) + Discord Bot + API Paketi — `22.000 TL IBAN` / `19.900 TL İtemSatış`"
    ],
    guarantees: [
      "✓ Tam açık kaynak kodları (Full Source Code)",
      "✓ 6 Ay ücretsiz teknik destek & güncelleme",
      "✓ MongoDB veritabanı ve VDS kurulumu dahil"
    ]
  },
  [CHANNELS.MAP]: {
    title: "🗺️ ÖZEL ROBLOX HARİTASI (MAP) & OYUN",
    summary: "Deneyimli mimarlar tarafından inşa edilen, optimize ve estetik Roblox haritaları.",
    status: "🟢 Siparişler Açık (3 Proje Kontenjanı)",
    delivery: "3–14 gün",
    stock: "Özel Mimari Ekip",
    tiers: [
      "🏙️ Lobi / Spawn / Bekleme Alanı — `2.800 TL IBAN` / `2.500 TL İtemSatış`",
      "⚔️ Askeri Üs / Ordu Kampı / Akademi — `6.500 TL IBAN` / `5.900 TL İtemSatış`",
      "🌆 Şehir & Roleplay Tam Haritası — `12.500 TL IBAN` / `11.200 TL İtemSatış` ⭐ **EN POPÜLER**",
      "👑 Tam Kapsamlı Özel Oyun Haritası (Scriptli) — `24.000 TL IBAN` / `21.500 TL İtemSatış`",
      "🌌 Devasa MMO / Açık Dünya Oyun Projesi — `55.000 TL IBAN` / `49.000 TL İtemSatış`"
    ],
    guarantees: [
      "✓ Free model içermez, %100 el yapımı özgün mimari",
      "✓ Düşük sistemlerde kasmayan ultra optimizasyon",
      "✓ .rbxl dosya formatında tam mülkiyet teslimatı"
    ]
  },
  [CHANNELS.OWO]: {
    title: "🪙 OWO COİN MAĞAZASI",
    summary: "En ucuz komisyon oranları ve anında teslimatla güvenli OwO Coin stokları.",
    status: "🟢 Stokta",
    delivery: "5–15 dakika",
    stock: "500M+ Hazır Stok",
    tiers: [
      "🪙 10M OwO Bakiye — `350 TL IBAN` / `310 TL İtemSatış`",
      "🪙 50M OwO Bakiye — `1.650 TL IBAN` / `1.480 TL İtemSatış`",
      "⭐ 100M OwO Bakiye — `3.100 TL IBAN` / `2.790 TL İtemSatış` ⭐ **EN POPÜLER**",
      "👑 500M OwO Mega Bakiye — `14.500 TL IBAN` / `13.000 TL İtemSatış`",
      "🌌 1 MİLYAR (1.000.000.000) OwO Ultra Paket — `27.500 TL IBAN` / `24.900 TL İtemSatış`"
    ],
    guarantees: [
      "✓ Bot üzerinden doğrudan transfer",
      "✓ Kesinti komisyonları karşılanır",
      "✓ Anında canlı teslim"
    ]
  },
  [CHANNELS.GFX]: {
    title: "🎨 3D GFX & GRAFİK TASARIM",
    summary: "Oyunlarınızı keşfete taşıyacak, tıklama oranını katlayacak 4K sinematik grafikler.",
    status: "🟢 Siparişler Açık",
    delivery: "1–3 gün",
    stock: "Aktif Tasarımcılar",
    tiers: [
      "🎨 Tek Karakter 3D Profil / Avatar GFX — `850 TL IBAN` / `760 TL İtemSatış`",
      "🖼️ Roblox Oyun Thumbnail (Sinematik Kapak) — `2.200 TL IBAN` / `1.950 TL İtemSatış` ⭐ **EN POPÜLER**",
      "🎯 Oyun İkonu & Vektörel Logo Seti — `1.600 TL IBAN` / `1.450 TL İtemSatış`",
      "👑 Tam Oyun Markalama Paketi (Logo + 3 Thumbnail + Icon + Banner) — `6.800 TL IBAN` / `6.100 TL İtemSatış`",
      "🌌 Ultra Stüdyo Tanıtım & 4K Render Paketi — `14.500 TL IBAN` / `12.900 TL İtemSatış`"
    ],
    guarantees: [
      "✓ Blender & Photoshop 4K UHD Render",
      "✓ Şeffaf PNG ve PSD katman dosyaları",
      "✓ 3 gün boyunca ücretsiz revizyon hakkı"
    ]
  }
};

function buildSalePayload(info) {
  const content = [
    ComponentsV2Factory.text(
      `# ${info.title}\n\n` +
      `${info.summary}\n\n` +
      `> 📦 **Durum:** ${info.status}\n` +
      `> ⚡ **Teslim Süresi:** ${info.delivery}\n` +
      `> 📊 **Stok Durumu:** ${info.stock}\n\n` +
      `### 📦 VIP Paketler & Fiyatlar\n` +
      `${info.tiers.join("\n")}\n\n` +
      `### 🛡️ Güvence & Ayrıcalıklar\n` +
      `${info.guarantees.join("\n")}`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🛒 Satın Al / Sipariş Oluştur",
        custom_id: "robloxland_start_order_flow",
        emoji: { name: "🛍️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🎟️ Kupon Kullan",
        custom_id: "robloxland_use_coupon_btn",
        emoji: { name: "🎟️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "👤 Profilim",
        custom_id: "robloxland_open_my_profile",
        emoji: { name: "👤" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── YARDIMCI: IN-PLACE EDIT VEYA YENİ MESAJ GÖNDERME ──────────────────────────
async function sendOrEditPanel(channel, client, payload) {
  if (!channel || !channel.isTextBased()) return false;
  try {
    const fetched = await channel.messages.fetch({ limit: 15 }).catch(() => null);
    const botId = client.user?.id;
    const existingBotMsg = fetched ? fetched.find(m => m.author.id === botId) : null;

    if (existingBotMsg) {
      await existingBotMsg.edit(payload);
      return "edit";
    } else {
      await channel.send(payload);
      return "send";
    }
  } catch (err) {
    console.error(`[RobloxLandSetup] sendOrEditPanel error in #${channel.name || channel.id}:`, err.message);
    try {
      await channel.send(payload);
      return "send_fallback";
    } catch (_) {
      return false;
    }
  }
}

// ─── OTOMATİK KURULUM VE MEVCUT MESAJLARI DÜZENLEME ───────────────────────────
async function deployRobloxDevsSetup(client, force = false) {
  console.log("[RobloxLandSetup] 🚀 RobloxLand panelleri kontrol ediliyor ve güncelleniyor...");

  const results = [];
  const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) {
    console.warn(`[RobloxLandSetup] Hedef sunucu (${GUILD_ID}) bulunamadı.`);
    return { success: false, message: "Sunucu bulunamadı." };
  }

  const panels = [
    { id: CHANNELS.RULES, name: "Kurallar", builder: buildRulesPayload },
    { id: CHANNELS.SCAMMERS, name: "Dolandırıcılar", builder: buildScammerPanelPayload },
    { id: CHANNELS.ORDER_RULES, name: "Sipariş Kuralları", builder: buildOrderRulesPayload },
    { id: CHANNELS.ABOUT_US, name: "Biz Kimiz", builder: buildAboutUsPayload },
    { id: CHANNELS.STAFF_APPLY, name: "Yetkili Alım", builder: buildStaffApplyPayload },
    { id: CHANNELS.TICKET_PANEL, name: "Destek Paneli", builder: buildTicketPanelPayload },
    { id: CHANNELS.AD_PACKAGES, name: "Reklam Paketleri", builder: buildAdPackagesPayload },
    { id: CHANNELS.PAYMENT_METHODS, name: "Ödeme Yöntemleri", builder: buildPaymentMethodsPayload },
    { id: CHANNELS.FAQ, name: "SSS", builder: buildFaqPayload },
    { id: CHANNELS.LEVEL_LOG, name: "Seviye Log", builder: buildLevelLogPayload }
  ];

  for (const p of panels) {
    try {
      const ch = await guild.channels.fetch(p.id).catch(() => null);
      if (ch) {
        const action = await sendOrEditPanel(ch, client, p.builder());
        if (action) results.push(`${p.name} (${action})`);
      }
    } catch (e) {
      console.error(`${p.name} deploy error:`, e.message);
    }
  }

  // Satış kanalları
  for (const [chanId, info] of Object.entries(SALES_CONFIG)) {
    try {
      const ch = await guild.channels.fetch(chanId).catch(() => null);
      if (ch) {
        const action = await sendOrEditPanel(ch, client, buildSalePayload(info));
        if (action) results.push(`${info.title} (${action})`);
      }
    } catch (e) {
      console.error(`Sale channel ${chanId} deploy error:`, e.message);
    }
  }

  saveSetupState({ deployed: true, lastUpdated: new Date().toISOString(), results });
  console.log(`[RobloxLandSetup] ✅ Başarıyla güncellenen paneller: ${results.join(", ")}`);
  return { success: true, results };
}

// ─── TICKET İÇİ YÖNETİM & SİPARİŞ DURUMU KARTLARI ──────────────────────────────
function buildTicketControlCard(ticketData) {
  const statusEmoji = {
    "Bekliyor": "🟡",
    "İşlemde": "🟢",
    "Beklemede": "⏸️",
    "Çözüldü": "✅",
    "Kapatıldı": "🔒"
  }[ticketData.status || "Bekliyor"] || "🟡";

  const claimerText = ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : "Henüz kimse";
  const openTime = Math.floor(new Date(ticketData.openedAt || Date.now()).getTime() / 1000);

  const content = [
    ComponentsV2Factory.text(
      `# 🎫 Talep #${ticketData.ticketId || "RBLX-00482"}\n\n` +
      `👤 **Müşteri:** <@${ticketData.ownerId}>\n` +
      `📂 **Tür:** \`${ticketData.typeLabel || "Genel Destek"}\`\n` +
      `🕒 **Açılış:** <t:${openTime}:R>\n` +
      `👨‍💼 **İlgilenen:** ${claimerText}\n` +
      `${statusEmoji} **Durum:** **${ticketData.status || "Bekliyor"}**\n\n` +
      `*Yetkili ekibi aşağıdaki butonları kullanarak talebi yönetebilir.*`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🙋 Talebi Üstlen",
        custom_id: "robloxland_ticket_claim",
        emoji: { name: "🙋" }
      },
      {
        style: ButtonStyle.Primary,
        label: "👤 Kullanıcı Ekle",
        custom_id: "robloxland_ticket_adduser",
        emoji: { name: "➕" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🔄 Tür Değiştir",
        custom_id: "robloxland_ticket_changetype",
        emoji: { name: "🔄" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "⏸️ Beklemeye Al",
        custom_id: "robloxland_ticket_hold",
        emoji: { name: "⏸️" }
      }
    ]),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "✅ Çözüldü",
        custom_id: "robloxland_ticket_resolve",
        emoji: { name: "✅" }
      },
      {
        style: ButtonStyle.Danger,
        label: "🔒 Kapat",
        custom_id: "robloxland_ticket_close_start",
        emoji: { name: "🔒" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

function buildOrderStatusCard(ticketData) {
  const steps = [
    { key: "created", label: "Sipariş oluşturuldu" },
    { key: "paid", label: "Ödeme alındı" },
    { key: "in_progress", label: "Yapım aşamasında" },
    { key: "review", label: "Kontrol bekliyor" },
    { key: "delivered", label: "Teslim edildi" }
  ];

  const currentStep = ticketData.orderStep || 0;
  const lines = steps.map((s, idx) => {
    if (idx < currentStep) return `✅ ${s.label}`;
    if (idx === currentStep) return `🟢 **${s.label}** (Şu anki aşama)`;
    return `⚪ ${s.label}`;
  });

  const content = [
    ComponentsV2Factory.text(
      `# 📦 SİPARİŞ DURUMU (#${ticketData.ticketId || "RBLX-00482"})\n\n` +
      `🛍️ **Ürün:** \`${ticketData.productName || "Özel Hizmet"}\`\n` +
      `💰 **Tutar / Bütçe:** \`${ticketData.budget || "Belirtilmedi"}\`\n` +
      `📋 **Detay:** ${ticketData.orderDetails || "Sipariş detayları inceleniyor."}\n\n` +
      `### 📊 Aşama Takibi:\n` +
      `${lines.join("\n")}\n\n` +
      `-# Yetkili butonları kullanarak siparişin aşamasını güncelleyebilir.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Primary,
        label: "💳 Ödeme Alındı",
        custom_id: "robloxland_order_step_1",
        emoji: { name: "💳" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🛠️ Yapıma Başlandı",
        custom_id: "robloxland_order_step_2",
        emoji: { name: "🛠️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🔍 Kontrole Gönder",
        custom_id: "robloxland_order_step_3",
        emoji: { name: "🔍" }
      },
      {
        style: ButtonStyle.Success,
        label: "📦 Teslim Et",
        custom_id: "robloxland_order_step_4",
        emoji: { name: "🎉" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── ETKİLEŞİM İŞLEYİCİSİ (HEPSİNİ KAPSAYAN ANA MOTOR) ─────────────────────────
async function handleRobloxDevsInteraction(interaction) {
  if (!interaction.isRepliable()) return false;
  const { customId, guild, user } = interaction;

  // 1. Yetkili Alım Formu Açma
  if (interaction.isButton() && customId === "robloxland_staff_apply") {
    const modal = new ModalBuilder()
      .setCustomId("robloxland_staff_modal")
      .setTitle("Yetkili Alım Başvuru Formu");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("staff_name").setLabel("İsminiz ve Yaşınız").setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("staff_exp").setLabel("Hiç Satış Mağazasında Bulundun mu?").setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("staff_customers").setLabel("Müşteri Çekebilir misin?").setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("staff_other").setLabel("Başka Bir Yerde Yetkili misin?").setStyle(TextInputStyle.Short).setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 2. Yetkili Alım Formu Submit
  if (interaction.isModalSubmit() && customId === "robloxland_staff_modal") {
    const name = interaction.fields.getTextInputValue("staff_name");
    const exp = interaction.fields.getTextInputValue("staff_exp");
    const customers = interaction.fields.getTextInputValue("staff_customers");
    const other = interaction.fields.getTextInputValue("staff_other");

    await interaction.reply({
      ...ComponentsV2Factory.buildPayload([
        ComponentsV2Factory.text(
          `# 📘 RobloxLand — Yetkili Rehberi: Bizde Çalışırsan Bunları Yapmalısın\n\n` +
          `Tebrikler **${user.username}**, yetkili başvurunuz başarıyla alındı ve yönetime iletildi!\n\n` +
          `### 🎯 Ekibimizde Dikkat Edilmesi Gereken Temel Görevler:\n` +
          `1. **Müşteri Memnuniyeti:** Müşterilere karşı daima nazik ve kurumsal bir dille yaklaşınız.\n` +
          `2. **Aktiflik ve Vardiya:** Biletlere (ticket) hızlı yanıt veriniz, gecikme durumunda diğer yetkililerden destek isteyiniz.\n` +
          `3. **Güvenlik İlkeleri:** Müşterilerle kesinlikle DM üzerinden özel ticaret yapmayınız.\n` +
          `4. **Dürüstlük & Şeffaflık:** Teslimat kanıtlarını kayıt altına alınız.\n\n` +
          `*Başvurunuz incelendikten sonra sonucunuz Discord DM kutunuza otomatik iletilecektir.*`
        )
      ]),
      ephemeral: true
    });

    try {
      const logChan = guild?.channels.cache.get(STAFF_LOG_CHANNEL_ID) || await guild?.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
      if (logChan && logChan.isTextBased()) {
        await logChan.send(ComponentsV2Factory.buildPayload([
          ComponentsV2Factory.text(
            `# 📋 Yeni Yetkili Başvurusu!\n\n` +
            `👤 **Başvuran:** <@${user.id}> (\`${user.id}\`)\n` +
            `📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
            `**1. İsim / Yaş:**\n${name}\n\n` +
            `**2. Satış Mağazasında Bulundu mu?:**\n${exp}\n\n` +
            `**3. Müşteri Çekebilir mi?:**\n${customers}\n\n` +
            `**4. Başka Bir Yerde Yetkili mi?:**\n${other}`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            { style: ButtonStyle.Success, label: "✅ Kabul Et", custom_id: `robloxland_staff_accept_${user.id}`, emoji: { name: "🎉" } },
            { style: ButtonStyle.Danger, label: "❌ Reddet", custom_id: `robloxland_staff_reject_${user.id}`, emoji: { name: "🚫" } }
          ])
        ]));
      }
    } catch (_) {}
    return true;
  }

  // 3. Yetkili Başvuru Kabul / Red
  if (interaction.isButton() && (customId.startsWith("robloxland_staff_accept_") || customId.startsWith("robloxland_staff_reject_"))) {
    const isAccept = customId.startsWith("robloxland_staff_accept_");
    const targetUserId = customId.replace("robloxland_staff_accept_", "").replace("robloxland_staff_reject_", "");

    await interaction.reply({
      content: isAccept ? `✅ <@${targetUserId}> kullanıcısının başvurusu **kabul edildi** ve DM bildirimi gönderildi.` : `❌ <@${targetUserId}> kullanıcısının başvurusu **reddedildi** ve DM bildirimi gönderildi.`,
      ephemeral: true
    });

    try {
      const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
      if (targetUser) {
        if (isAccept) {
          await targetUser.send(`🎉 **Tebrikler!** RobloxLand sunucusundaki yetkili başvurunuz **KABUL EDİLDİ**. Lütfen yetkili odalarındaki talimatları takip ediniz.`);
        } else {
          await targetUser.send(`ℹ️ RobloxLand sunucusundaki yetkili başvurunuz maalesef şu anda **uygun görülmemiştir**. İlerleyen alımlarda tekrar başvurabilirsiniz.`);
        }
      }
    } catch (_) {}
    return true;
  }

  // 4. Sipariş Akışı Başlatma (Modal / Seçim)
  if (interaction.isButton() && (customId === "robloxland_start_order_flow" || customId === "robloxland_open_ticket_siparis")) {
    const modal = new ModalBuilder()
      .setCustomId("robloxland_order_modal")
      .setTitle("Sipariş & Satın Alma Formu");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("order_product").setLabel("Almak İstediğiniz Ürün / Paket").setPlaceholder("Örn: 10.000 Robux / Özel GFX / Map / Bot / Grup").setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("order_username").setLabel("Roblox Kullanıcı Adınız").setPlaceholder("Roblox Nickiniz (Yoksa Yok yazınız)").setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("order_payment").setLabel("Ödeme Yöntemi ve Bütçeniz").setPlaceholder("IBAN / İtemSatış / OwO / Play Kod").setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("order_details").setLabel("Varsa Özel İstekleriniz ve Kupon Kodunuz").setPlaceholder("Örn: EKOSTAR10 kuponu, özel renkler vb.").setStyle(TextInputStyle.Paragraph).setRequired(false)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  // 5. Sipariş Modalı Submit -> Özel Sipariş Ticket'ı Açar
  if (interaction.isModalSubmit() && customId === "robloxland_order_modal") {
    const product = interaction.fields.getTextInputValue("order_product");
    const rblxUser = interaction.fields.getTextInputValue("order_username");
    const payment = interaction.fields.getTextInputValue("order_payment");
    const details = interaction.fields.getTextInputValue("order_details") || "Belirtilmedi";

    await interaction.deferReply({ ephemeral: true });

    let category = guild.channels.cache.get(TICKET_CATEGORY_ID) || await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null);
    if (!category) {
      category = await guild.channels.create({ name: "📁 TALEPLER & SİPARİŞLER", type: ChannelType.GuildCategory }).catch(() => null);
    }

    const ticketId = DataStore.getNextTicketId();
    const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    const channelName = `siparis-${ticketId.toLowerCase()}-${cleanUsername}`;

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category ? category.id : null,
      topic: `Müşteri: ${user.tag} (${user.id}) | Ticket: ${ticketId} | Ürün: ${product}`,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
        ...(interaction.client.user?.id ? [{ id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }] : [])
      ]
    }).catch(() => null);

    if (!ticketChannel) {
      await interaction.editReply({ content: "❌ Sipariş kanalı oluşturulurken bir hata oluştu." });
      return true;
    }

    const ticketData = {
      ticketId,
      channelId: ticketChannel.id,
      ownerId: user.id,
      ownerTag: user.tag,
      type: "siparis",
      typeLabel: "🛒 Sipariş & Satış",
      productName: product,
      robloxUser: rblxUser,
      budget: payment,
      orderDetails: details,
      status: "Bekliyor",
      orderStep: 0,
      openedAt: new Date().toISOString()
    };
    DataStore.saveTicketData(ticketChannel.id, ticketData);
    DataStore.updateUserProfile(user.id, (p) => { p.openedTickets = (p.openedTickets || 0) + 1; return p; });

    // Ticket içine Kontrol Kartı ve Sipariş Durumu Kartı at
    await ticketChannel.send(buildTicketControlCard(ticketData));
    await ticketChannel.send(buildOrderStatusCard(ticketData));

    await interaction.editReply({ content: `✅ **#${ticketId}** numaralı sipariş talebiniz oluşturuldu: <#${ticketChannel.id}>` });
    return true;
  }

  // 6. Normal Destek Açılır Menü / Butonları
  if (
    (typeof interaction.isStringSelectMenu === "function" && interaction.isStringSelectMenu() && customId === "robloxland_ticket_select") ||
    (typeof interaction.isButton === "function" && interaction.isButton() && customId.startsWith("robloxland_open_ticket_"))
  ) {
    let type = "destek";
    if (typeof interaction.isStringSelectMenu === "function" && interaction.isStringSelectMenu()) {
      type = interaction.values?.[0] || "destek";
    } else {
      type = customId.replace("robloxland_open_ticket_", "");
    }

    if (type === "siparis") {
      // Sipariş akışına yönlendir
      return interaction.reply({
        content: "🛒 Lütfen aşağıdaki **Sipariş Formu** butonuna tıklayarak siparişinizi detaylandırınız.",
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("robloxland_start_order_flow").setLabel("📝 Sipariş Formunu Doldur").setStyle(ButtonStyle.Success)
          )
        ],
        ephemeral: true
      });
    }

    const typeConfig = {
      yonetim: { label: "👑 Yönetim Görüşmesi", prefix: "yonetim", detail: "Üst yönetim ekibine iletilmiştir. Lütfen konuyu detaylıca yazınız." },
      reklam: { label: "📢 Reklam & Sponsorluk", prefix: "reklam", detail: "Reklam paketini, sunucu linkinizi ve bütçenizi yazınız." },
      sikayet: { label: "🚨 Şikayet & Güvenlik", prefix: "sikayet", detail: "Şikayetçi olduğunuz kullanıcının ID'sini ve kanıtları yazınız." },
      destek: { label: "❓ Genel Destek", prefix: "destek", detail: "Yaşadığınız sorunu veya sorunuzu detaylıca açıklayınız." }
    };
    const cfg = typeConfig[type] || typeConfig.destek;

    await interaction.deferReply({ ephemeral: true });

    let category = guild.channels.cache.get(TICKET_CATEGORY_ID) || await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null);
    if (!category) {
      category = await guild.channels.create({ name: "📁 TALEPLER & SİPARİŞLER", type: ChannelType.GuildCategory }).catch(() => null);
    }

    const ticketId = DataStore.getNextTicketId();
    const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    const channelName = `${cfg.prefix}-${ticketId.toLowerCase()}-${cleanUsername}`;

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category ? category.id : null,
      topic: `Müşteri: ${user.tag} (${user.id}) | Ticket: ${ticketId} | Tür: ${cfg.label}`,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
        ...(interaction.client.user?.id ? [{ id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }] : [])
      ]
    }).catch(() => null);

    if (!ticketChannel) {
      await interaction.editReply({ content: "❌ Destek kanalı oluşturulamadı." });
      return true;
    }

    const ticketData = {
      ticketId,
      channelId: ticketChannel.id,
      ownerId: user.id,
      ownerTag: user.tag,
      type,
      typeLabel: cfg.label,
      status: "Bekliyor",
      openedAt: new Date().toISOString()
    };
    DataStore.saveTicketData(ticketChannel.id, ticketData);
    DataStore.updateUserProfile(user.id, (p) => { p.openedTickets = (p.openedTickets || 0) + 1; return p; });

    await ticketChannel.send(buildTicketControlCard(ticketData));

    await interaction.editReply({ content: `✅ **${cfg.label}** talebiniz (#${ticketId}) açıldı: <#${ticketChannel.id}>` });
    return true;
  }

  // 7. Ticket İçi Yetkili Butonları (Talebi Üstlen, Çözüldü, Beklemeye Al)
  if (interaction.isButton() && customId === "robloxland_ticket_claim") {
    const tData = DataStore.getTicketData(interaction.channelId) || { channelId: interaction.channelId, ticketId: "RBLX-00482", ownerId: user.id };
    tData.claimedBy = user.id;
    tData.status = "İşlemde";
    DataStore.saveTicketData(interaction.channelId, tData);

    await interaction.update(buildTicketControlCard(tData)).catch(() => {});
    await interaction.channel.send(`✅ Bu talebi <@${user.id}> üstlendi. Durum: **🟢 İşlemde**`);
    return true;
  }

  if (interaction.isButton() && customId === "robloxland_ticket_hold") {
    const tData = DataStore.getTicketData(interaction.channelId) || { channelId: interaction.channelId, ticketId: "RBLX-00482", ownerId: user.id };
    tData.status = "Beklemede";
    DataStore.saveTicketData(interaction.channelId, tData);

    await interaction.update(buildTicketControlCard(tData)).catch(() => {});
    await interaction.channel.send(`⏸️ Talep <@${user.id}> tarafından **Beklemeye Alındı**.`);
    return true;
  }

  if (interaction.isButton() && customId === "robloxland_ticket_resolve") {
    const tData = DataStore.getTicketData(interaction.channelId) || { channelId: interaction.channelId, ticketId: "RBLX-00482", ownerId: user.id };
    tData.status = "Çözüldü";
    DataStore.saveTicketData(interaction.channelId, tData);

    await interaction.update(buildTicketControlCard(tData)).catch(() => {});
    await interaction.channel.send(`✅ Talep <@${user.id}> tarafından **Çözüldü** olarak işaretlendi. Kapatmak için 🔒 Kapat butonuna basabilirsiniz.`);
    return true;
  }

  // 8. Ticket Kullanıcı Ekleme
  if (interaction.isButton() && customId === "robloxland_ticket_adduser") {
    const modal = new ModalBuilder().setCustomId("robloxland_adduser_modal").setTitle("Talebe Kullanıcı Ekle");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("add_user_id").setLabel("Eklenecek Kullanıcı ID'si").setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.isModalSubmit() && customId === "robloxland_adduser_modal") {
    const targetId = interaction.fields.getTextInputValue("add_user_id").trim();
    try {
      await interaction.channel.permissionOverwrites.edit(targetId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });
      await interaction.reply({ content: `✅ <@${targetId}> (\`${targetId}\`) başarıyla bu talebe eklendi.`, ephemeral: false });
    } catch (e) {
      await interaction.reply({ content: `❌ Kullanıcı eklenirken hata: ${e.message}`, ephemeral: true });
    }
    return true;
  }

  // 9. Sipariş Aşamaları Güncelleme (Ödeme Alındı, Yapımda, Kontrolde, Teslim Edildi)
  if (interaction.isButton() && customId.startsWith("robloxland_order_step_")) {
    const step = Number(customId.replace("robloxland_order_step_", ""));
    const tData = DataStore.getTicketData(interaction.channelId) || { channelId: interaction.channelId, ticketId: "RBLX-00482", ownerId: user.id };
    tData.orderStep = step;
    DataStore.saveTicketData(interaction.channelId, tData);

    await interaction.update(buildOrderStatusCard(tData)).catch(() => {});

    const stepMessages = {
      1: "💳 **Ödeme Başarıyla Alındı!** Siparişiniz yapım sırasına eklendi.",
      2: "🛠️ **Sipariş Yapımına Başlandı!** Tasarımcılarımız ve geliştiricilerimiz çalışıyor.",
      3: "🔍 **Sipariş Kontrole Gönderildi!** Son incelemeler yapılıyor, lütfen teslimatı onaylayınız.",
      4: "🎉 **SİPARİŞ TESLİM EDİLDİ!** Bizi tercih ettiğiniz için teşekkür ederiz. Hesabınıza LandCoin ödülleri tanımlandı!"
    };

    await interaction.channel.send(stepMessages[step] || `Sipariş aşaması güncellendi: ${step}`);

    if (step === 4) {
      // Müşteriye LandCoin ve tamamlanan sipariş ekle
      DataStore.updateUserProfile(tData.ownerId, (p) => {
        p.completedOrders = (p.completedOrders || 0) + 1;
        p.landCoins = (p.landCoins || 0) + 25;
        p.totalSpent = (p.totalSpent || 0) + 250;
        return p;
      });
    }
    return true;
  }

  // 10. Ticket Kapatma Modalı
  if (interaction.isButton() && customId === "robloxland_ticket_close_start") {
    const modal = new ModalBuilder().setCustomId("robloxland_close_modal").setTitle("Talebi Kapat");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("close_reason").setLabel("Kapatma Nedeni").setPlaceholder("Sorun çözüldü / Teslim edildi / İptal").setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  // 11. Ticket Kapatma Submit -> Transcript, Log, DM ve Değerlendirme Puanı
  if (interaction.isModalSubmit() && customId === "robloxland_close_modal") {
    const reason = interaction.fields.getTextInputValue("close_reason");
    const tData = DataStore.getTicketData(interaction.channelId) || {
      ticketId: "RBLX-00482",
      ownerId: user.id,
      claimedBy: user.id,
      typeLabel: "Destek",
      openedAt: new Date().toISOString()
    };

    await interaction.reply({ content: "🔒 **Talep kapatılıyor ve arşivleniyor...** (Kanal 5 saniye içinde silinecektir)" });

    // Transcript Derle
    let transcriptText = `=== ROBLOXLND TICKET TRANSCRIPT (#${tData.ticketId}) ===\nMüşteri ID: ${tData.ownerId}\nYetkili ID: ${tData.claimedBy || "Yok"}\nKapatma Nedeni: ${reason}\n\n--- MESAJ GEÇMİŞİ ---\n`;
    try {
      const msgs = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);
      if (msgs) {
        const sorted = [...msgs.values()].reverse();
        for (const m of sorted) {
          transcriptText += `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.cleanContent || "(Ek/Embed)"}\n`;
        }
      }
    } catch (_) {}

    const transcriptBuffer = Buffer.from(transcriptText, "utf8");
    const attachment = new AttachmentBuilder(transcriptBuffer, { name: `transcript-${tData.ticketId}.txt` });

    // 1. Log Kanalına Gönder
    try {
      const logChan = guild.channels.cache.get(STAFF_LOG_CHANNEL_ID) || await guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
      if (logChan && logChan.isTextBased()) {
        await logChan.send({
          content: `📁 **TICKET ARŞİVİ — #${tData.ticketId}**\n• **Müşteri:** <@${tData.ownerId}>\n• **Yetkili:** ${tData.claimedBy ? `<@${tData.claimedBy}>` : "Yok"}\n• **Tür:** ${tData.typeLabel || "Destek"}\n• **Sonuç / Neden:** ${reason}`,
          files: [attachment]
        });
      }
    } catch (_) {}

    // 2. Müşteriye DM Gönder ve Puanlama İste
    try {
      const customer = await interaction.client.users.fetch(tData.ownerId).catch(() => null);
      if (customer) {
        await customer.send(
          `✅ **Talebiniz Kapatıldı!**\n\n` +
          `🎫 **Ticket:** \`#${tData.ticketId}\`\n` +
          `👨‍💼 **İlgilenen Yetkili:** ${tData.claimedBy ? `<@${tData.claimedBy}>` : "Destek Ekibi"}\n` +
          `📌 **Sonuç:** ${reason}\n\n` +
          `⭐ **Aldığın desteği değerlendir!**\n` +
          `Aşağıdaki butonlara basarak yetkiliye puan verebilirsiniz:`
        );

        await customer.send({
          content: "Aldığınız hizmetten ne kadar memnun kaldınız?",
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`robloxland_rate_1_${tData.claimedBy || "none"}`).setLabel("⭐ 1").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`robloxland_rate_2_${tData.claimedBy || "none"}`).setLabel("⭐⭐ 2").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`robloxland_rate_3_${tData.claimedBy || "none"}`).setLabel("⭐⭐⭐ 3").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`robloxland_rate_4_${tData.claimedBy || "none"}`).setLabel("⭐⭐⭐⭐ 4").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId(`robloxland_rate_5_${tData.claimedBy || "none"}`).setLabel("⭐⭐⭐⭐⭐ 5").setStyle(ButtonStyle.Success)
            )
          ]
        }).catch(() => {});
      }
    } catch (_) {}

    if (tData.claimedBy) {
      DataStore.incrementStaffStat(tData.claimedBy, "resolvedTickets", 1);
    }

    setTimeout(async () => {
      await interaction.channel.delete().catch(() => {});
    }, 5000);
    return true;
  }

  // 12. Değerlendirme Puanı Butonları (DM)
  if (interaction.isButton() && interaction.customId.startsWith("robloxland_rate_")) {
    const parts = interaction.customId.split("_");
    const stars = Number(parts[2]) || 5;
    const staffId = parts[3];

    if (staffId && staffId !== "none") {
      DataStore.addStaffRating(staffId, stars, user.id);
    }

    await interaction.update({
      content: `🎉 **${stars} Yıldız** değerlendirmeniz kaydedildi! Geri bildiriminiz için çok teşekkür ederiz.`,
      components: []
    }).catch(() => {});
    return true;
  }

  // 13. Profilim Butonu (👤 Profilim)
  if (interaction.isButton() && interaction.customId === "robloxland_open_my_profile") {
    const member = guild?.members.cache.get(user.id) || await guild?.members.fetch(user.id).catch(() => null);
    const p = DataStore.getUserProfile(user.id, member);

    const fullBlocks = Math.floor(p.trustScore / 10);
    const emptyBlocks = 10 - fullBlocks;
    const trustBar = "█".repeat(fullBlocks) + "░".repeat(Math.max(0, emptyBlocks));

    const content = [
      ComponentsV2Factory.text(
        `# 👤 ROBLOXLND — TOPLULUK PROFİLİN\n\n` +
        `🏷️ **Kullanıcı:** <@${user.id}> (\`${user.id}\`)\n` +
        `📅 **Sunucuya Katılım:** <t:${Math.floor(new Date(p.joinedAt || Date.now()).getTime() / 1000)}:R>\n` +
        `📈 **Seviye:** \`Level ${p.level || 1}\` (${p.xp || 45} / 100 XP)\n\n` +
        `### 🛡️ Güven Puanı: \`${p.trustScore || 92}/100\`\n` +
        `\`${trustBar}\` (🟢 Güvenilir Üye)\n\n` +
        `### 💎 Mağaza & Ticaret Geçmişi\n` +
        `🪙 **LandCoin Bakiyesi:** \`${p.landCoins || 50} Coin\`\n` +
        `🎫 **Açılan Destek Talebi:** \`${p.openedTickets || 0}\`\n` +
        `🛒 **Tamamlanan Sipariş:** \`${p.completedOrders || 0}\`\n` +
        `💰 **Toplam Harcama:** \`${p.totalSpent || 0} TL\`\n` +
        `👑 **VIP Durumu:** \`${p.vipTier || "Standart Müşteri"}\`\n\n` +
        `-# Her 100 TL harcamanızda 10 LandCoin hesabınıza otomatik yüklenir.`
      )
    ];

    await interaction.reply({ ...ComponentsV2Factory.buildPayload(content), ephemeral: true });
    return true;
  }

  // 14. Sipariş Sorgulama Butonu
  if (interaction.isButton() && interaction.customId === "robloxland_order_lookup_btn") {
    const modal = new ModalBuilder().setCustomId("robloxland_order_lookup_modal").setTitle("Sipariş Durumu Sorgula");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("lookup_ticket_id").setLabel("Sipariş Numarası").setPlaceholder("Örn: RBLX-00482").setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.isModalSubmit() && customId === "robloxland_order_lookup_modal") {
    const searchId = interaction.fields.getTextInputValue("lookup_ticket_id").trim();
    const found = DataStore.findTicketByNumber(searchId);

    if (!found) {
      await interaction.reply({ content: `❌ **${searchId}** numaralı aktif sipariş kaydı bulunamadı.`, ephemeral: true });
      return true;
    }

    const stepText = ["🟢 Sipariş Oluşturuldu", "💳 Ödeme Alındı", "🛠️ Yapım Aşamasında", "🔍 Kontrol Bekliyor", "🎉 Teslim Edildi"][found.orderStep || 0];

    await interaction.reply({
      content:
        `📦 **SİPARİŞ BİLGİSİ (#${found.ticketId})**\n\n` +
        `🛍️ **Ürün:** \`${found.productName || "Özel Sipariş"}\`\n` +
        `📊 **Aşama:** ${stepText}\n` +
        `👨‍💼 **İlgilenen Yetkili:** ${found.claimedBy ? `<@${found.claimedBy}>` : "Sıraya Alındı"}\n` +
        `🕒 **Oluşturulma:** <t:${Math.floor(new Date(found.openedAt || Date.now()).getTime() / 1000)}:R>`,
      ephemeral: true
    });
    return true;
  }

  // 15. Kupon Kullan Butonu
  if (interaction.isButton() && interaction.customId === "robloxland_use_coupon_btn") {
    const modal = new ModalBuilder().setCustomId("robloxland_coupon_modal").setTitle("İndirim Kuponu Doğrula");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("coupon_code").setLabel("Kupon Kodu").setPlaceholder("Örn: EKOSTAR10 / ROBLOXLND20").setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.isModalSubmit() && customId === "robloxland_coupon_modal") {
    const code = interaction.fields.getTextInputValue("coupon_code").trim();
    const coupon = DataStore.checkCoupon(code);

    if (coupon) {
      await interaction.reply({
        content: `🎉 **Kupon Geçerli!**\n• **Kupon:** \`${coupon.code}\`\n• **Açıklama:** ${coupon.desc}\n*Sipariş verirken ticket içinde bu kuponu belirterek anında indirimden yararlanabilirsiniz.*`,
        ephemeral: true
      });
    } else {
      await interaction.reply({ content: `❌ **${code}** geçerli veya aktif bir indirim kuponu değildir.`, ephemeral: true });
    }
    return true;
  }

  // 16. Dolandırıcı Vaka Sistemi & Kara Liste Sorgulama
  if (interaction.isButton() && customId === "robloxland_scam_report") {
    const modal = new ModalBuilder().setCustomId("robloxland_scam_report_modal").setTitle("Dolandırıcı Bildirimi");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("scam_user").setLabel("Şüphelinin Kullanıcı Adı veya ID'si").setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("scam_proof").setLabel("Olay Detayı ve Kanıt Linkleri").setPlaceholder("Ekran görüntüsü linkleri, dekont bilgisi vb.").setStyle(TextInputStyle.Paragraph).setRequired(true)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.isModalSubmit() && customId === "robloxland_scam_report_modal") {
    const scamTarget = interaction.fields.getTextInputValue("scam_user");
    const scamProof = interaction.fields.getTextInputValue("scam_proof");
    const caseId = DataStore.getNextCaseId();

    DataStore.saveCase(caseId, {
      caseId,
      reporterId: user.id,
      suspect: scamTarget,
      proof: scamProof,
      status: "İnceleniyor",
      createdAt: new Date().toISOString()
    });

    await interaction.reply({
      content: `✅ **Vaka #${caseId}** başarıyla oluşturuldu ve güvenlik birimine iletildi. İhbarınız için teşekkür ederiz.`,
      ephemeral: true
    });

    try {
      const logChan = guild.channels.cache.get(STAFF_LOG_CHANNEL_ID) || await guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
      if (logChan && logChan.isTextBased()) {
        await logChan.send(ComponentsV2Factory.buildPayload([
          ComponentsV2Factory.text(
            `# 🚨 Vaka #${caseId} — Dolandırıcılık İhbarı\n\n` +
            `👤 **Şikayet Eden:** <@${user.id}>\n` +
            `🎯 **Şüpheli:** \`${scamTarget}\`\n` +
            `🟡 **Durum:** İnceleniyor\n\n` +
            `### 📂 Kanıt & Olay Detayı:\n${scamProof}`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            { style: ButtonStyle.Success, label: "🙋 Vakayı Üstlen", custom_id: `robloxland_case_claim_${caseId}`, emoji: { name: "🙋" } },
            { style: ButtonStyle.Danger, label: "🚫 Kara Listeye Ekle", custom_id: `robloxland_case_ban_${caseId}_${scamTarget}`, emoji: { name: "🔴" } },
            { style: ButtonStyle.Secondary, label: "✅ Güvenli / İptal", custom_id: `robloxland_case_close_${caseId}`, emoji: { name: "✅" } }
          ])
        ]));
      }
    } catch (_) {}
    return true;
  }

  // 17. Kara Liste Kullanıcı Sorgulama Butonu
  if (interaction.isButton() && customId === "robloxland_user_lookup") {
    const modal = new ModalBuilder().setCustomId("robloxland_lookup_modal").setTitle("Kullanıcı Güvenlik Sorgusu");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("lookup_id").setLabel("Sorgulanacak Discord Kullanıcı ID'si").setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.isModalSubmit() && customId === "robloxland_lookup_modal") {
    const targetId = interaction.fields.getTextInputValue("lookup_id").trim();
    const isBlacklisted = DataStore.checkBlacklist(targetId);
    const profile = DataStore.getUserProfile(targetId);

    if (isBlacklisted) {
      await interaction.reply({
        content: `🔴 **DİKKAT — KARA LİSTEDE BULUNUYOR!**\n\n• **Kullanıcı:** <@${targetId}> (\`${targetId}\`)\n• **Sebep:** ${isBlacklisted.reason}\n• **Vaka Kodu:** ${isBlacklisted.caseId || "SC-0038"}\n• **Tarih:** ${new Date(isBlacklisted.bannedAt).toLocaleDateString("tr-TR")}\n\n⚠️ *Bu kullanıcı ile kesinlikle ticaret yapmayınız!*`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `🟢 **GÜVENLİ KAYIT — TEMİZ SİCİL**\n\n• **Kullanıcı:** <@${targetId}>\n• **Aktif Kara Liste Kaydı:** Yok (0)\n• **Güven Puanı:** \`${profile.trustScore}/100\`\n• **Başarılı Siparişler:** \`${profile.completedOrders || 0}\`\n\n✓ *Sunucumuzda doğrulanmış güvenli kullanıcıdır.*`,
        ephemeral: true
      });
    }
    return true;
  }

  // 18. Kendi Paketini Oluştur Modal & Hesaplama
  if (interaction.isButton() && customId === "robloxland_custom_ad_package") {
    const modal = new ModalBuilder().setCustomId("robloxland_custom_ad_modal").setTitle("Kendi Reklam Paketini Oluştur");
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("custom_ad_content").setLabel("İstediğiniz Reklam Özellikleri").setPlaceholder("Örn: Everyone + 7 Gün Özel Kanal + Toplu DM + YouTube").setStyle(TextInputStyle.Paragraph).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("custom_ad_budget").setLabel("Bütçeniz ve Ödeme Yönteminiz").setPlaceholder("Örn: 250 TL IBAN / İtemSatış / 15M OwO").setStyle(TextInputStyle.Short).setRequired(true)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.isModalSubmit() && customId === "robloxland_custom_ad_modal") {
    const desc = interaction.fields.getTextInputValue("custom_ad_content");
    const budget = interaction.fields.getTextInputValue("custom_ad_budget");

    await interaction.deferReply({ ephemeral: true });

    let category = guild.channels.cache.get(TICKET_CATEGORY_ID) || await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null);
    if (!category) {
      category = await guild.channels.create({ name: "📁 TALEPLER & SİPARİŞLER", type: ChannelType.GuildCategory }).catch(() => null);
    }

    const ticketId = DataStore.getNextTicketId();
    const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    const channelName = `reklam-${ticketId.toLowerCase()}-${cleanUsername}`;

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category ? category.id : null,
      topic: `Özel Reklam | Müşteri: ${user.tag} (${user.id}) | Ticket: ${ticketId}`,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
        ...(interaction.client.user?.id ? [{ id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }] : [])
      ]
    }).catch(() => null);

    if (ticketChannel) {
      const ticketData = {
        ticketId,
        channelId: ticketChannel.id,
        ownerId: user.id,
        ownerTag: user.tag,
        type: "reklam",
        typeLabel: "📢 Özel Reklam Paketi",
        budget,
        orderDetails: desc,
        status: "Bekliyor",
        openedAt: new Date().toISOString()
      };
      DataStore.saveTicketData(ticketChannel.id, ticketData);

      await ticketChannel.send(buildTicketControlCard(ticketData));
      await ticketChannel.send(ComponentsV2Factory.buildPayload([
        ComponentsV2Factory.text(
          `# 🛠️ Özel Reklam Paketi Talebi (#${ticketId})\n\n` +
          `Müşteri: <@${user.id}>\n\n` +
          `📋 **İstenen Reklam Özellikleri:**\n${desc}\n\n` +
          `💰 **Belirtilen Bütçe / Ödeme Türü:**\n${budget}\n\n` +
          `Yetkilimiz indirimli fiyat ve paket onayını birazdan iletecektir.`
        )
      ]));

      await interaction.editReply({ content: `✅ **#${ticketId}** numaralı özel reklam talebiniz oluşturuldu: <#${ticketChannel.id}>` });
    } else {
      await interaction.editReply({ content: "❌ Kanal oluşturulamadı." });
    }
    return true;
  }

  return false;
}

module.exports = {
  deployRobloxDevsSetup,
  handleRobloxDevsInteraction,
  CHANNELS,
  TICKET_CATEGORY_ID,
  STAFF_LOG_CHANNEL_ID
};
