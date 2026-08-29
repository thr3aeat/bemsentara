const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const ComponentsV2Factory = require("../utils/componentsV2Factory");

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
  // Satış Kanalları
  ROBUX: "1538477657984073728",
  GROUP: "1538477762442956830",
  MEMBER: "1538477806537678898",
  FOLLOWER: "1538477845314273311",
  GROUP_MEMBER: "1538477945041977385",
  INSTAGRAM: "1538478070812516372",
  BOT: "1538478164005625896",
  MAP: "1538478237037109349",
  OWO: "1538478293987233852",
  GFX: "1540476977629364235",
};

const STATE_FILE = path.join(__dirname, "../../data/robloxdevs_setup_state.json");

function getSetupState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch (_) {}
  return { deployed: false, deployedAt: null };
}

function saveSetupState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("[RobloxDevsSetup] State save error:", err.message);
  }
}

// ─── 1. Kurallar Paneli (1538465174602649611) ──────────────────────────────────
function buildRulesPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 📜 RobloxDevs — Topluluk & Sunucu Kuralları\n\n` +
      `RobloxDevs sunucusunda herkesin güvenli, saygılı ve profesyonel bir ortamda ticaret ve geliştirme yapabilmesi için aşağıdaki kurallara uyulması zorunludur.\n\n` +
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
      `-# RobloxDevs • Kurallara uymayanlar sunucu yönetimince sorgusuz ceza alma hakkına tabidir.`
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
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 2. Dolandırıcılar & Kara Liste Paneli (1538466110158938162) ───────────────
function buildScammerPanelPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 🚨 RobloxDevs — Dolandırıcı Kara Liste & Güvenlik Sistemi\n\n` +
      `Topluluğumuzda güvenli ticareti sağlamak adına dolandırıcılık teşebbüsünde bulunan, sahte dekont atan veya teslimat yapmayan kullanıcılar bu sistem üzerinden kayıt altına alınır.\n\n` +
      `### ⚠️ Dikkat Edilmesi Gerekenler:\n` +
      `• Sunucumuzdaki hiçbir yetkili sizden hesap şifrenizi veya e-posta doğrulama kodunuzu istemez.\n` +
      `• DM üzerinden size indirim vadeden veya yetkili olduğunu iddia eden kişilere itibar etmeyiniz.\n` +
      `• Şüpheli bir durumla karşılaştığınızda derhal aşağıdaki butona basarak kanıtlarıyla birlikte bildirim yapınız.\n\n` +
      `### 🛡️ Kara Liste Sorgulama & Bildirim\n` +
      `Aşağıdaki butonları kullanarak şüphelileri bildirebilir ve güvenli alışveriş adımlarını inceleyebilirsiniz.`
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
        label: "🎫 Destek Al",
        custom_id: "robloxland_open_ticket_destek",
        emoji: { name: "🛡️" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 3. Sipariş Kuralları Paneli (1538464717444747274) ──────────────────────────
function buildOrderRulesPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 💰 RobloxDevs — Sipariş & Satış Kuralları\n\n` +
      `Tüm müşterilerimizin haklarını ve güvenliğini korumak amacıyla sipariş süreçleri belirli kurallar çerçevesinde yürütülmektedir.\n\n` +
      `### 📌 Sipariş Esasları:\n` +
      `1. **Ödeme Önceliği:** Tüm siparişler ödeme alındıktan sonra işleme alınır ve sıraya eklenir.\n` +
      `2. **Teslimat Süreleri:** Sipariş türüne ve stok durumuna göre teslimat süresi yetkili tarafından ticket içerisinde belirtilir.\n` +
      `3. **İade Politikası:** Dijital ürün ve hizmetlerde (Robux, Takipçi, Üye, Özel Map vb.) işlem başlatıldıktan sonra keyfi iade yapılmaz.\n` +
      `4. **Yetkili Aracılığı:** Tüm alışverişler sunucunun resmi ticket kanalları üzerinden kayıt altında yapılır.\n` +
      `5. **Ödeme Yöntemleri:** IBAN (Havale/EFT), İtemSatış, OwO Coin ve Google Play Kod seçenekleri desteklenmektedir.\n\n` +
      `-# Sipariş oluşturmak için ilgili kategorideki 'Satın Al' butonlarını veya Destek panelini kullanınız.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🛒 Sipariş Oluştur (Ticket)",
        custom_id: "robloxland_open_ticket_siparis",
        emoji: { name: "🛍️" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 4. Biz Kimiz Paneli (1538465264142786621) ──────────────────────────────────
function buildAboutUsPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 🌟 RobloxDevs & Robloxland — Biz Kimiz?\n\n` +
      `**RobloxDevs**, Roblox ekosisteminde geliştiricileri, tasarımcıları, oyuncuları ve alıcıları tek bir çatı altında toplayan profesyonel bir topluluk ve dijital hizmet merkezidir.\n\n` +
      `### 🚀 Ne Yapıyoruz?\n` +
      `• **Roblox Geliştirme:** Harita yapımı (Map Building), modelleme, script yazımı ve sistem entegrasyonları.\n` +
      `• **Grafik & Tasarım:** Özel GFX, logo, banner, thumbnail ve arayüz (UI) tasarımları.\n` +
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
      `# 🎫 Robloxland — Destek & Sipariş Merkezi\n\n` +
      `Her türlü satın alım, ürün teslimatı, soru, öneri ve destek ihtiyacınız için talebinizi buradan oluşturabilirsiniz.\n\n` +
      `### 📂 Talep Türleri:\n` +
      `• 🛒 **Sipariş & Satın Alma:** Robux, Grup, Takipçi, Üye, Bot, Map, GFX, OwO vb.\n` +
      `• 📢 **Reklam & Sponsorluk:** Özel paketler, DM duyuru, YouTube/Eko Yıldız sponsorlukları.\n` +
      `• 🛡️ **Genel Destek & Şikayet:** Sorun bildirme, teslimat kontrolü ve genel sorular.\n\n` +
      `Talebiniz **1538466419245719663** kategorisinde size özel gizli bir kanalda açılacaktır.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🛒 Sipariş Talebi",
        custom_id: "robloxland_open_ticket_siparis",
        emoji: { name: "🛍️" }
      },
      {
        style: ButtonStyle.Primary,
        label: "📢 Reklam / Sponsorluk",
        custom_id: "robloxland_open_ticket_reklam",
        emoji: { name: "📣" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🛡️ Genel Destek",
        custom_id: "robloxland_open_ticket_destek",
        emoji: { name: "❓" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 7. Reklam & Sponsorluk Paketleri Paneli (1538467688060297276) ─────────────
function buildAdPackagesPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 📢 Robloxland & RobloxDevs — Reklam & Sponsorluk Paketleri\n\n` +
      `Sunucunuzu, oyununuzu, grubunuzu veya YouTube kanalınızı binlerce aktif kullanıcıya tanıtmak için indirimli reklam paketlerimiz:\n\n` +
      `### 📦 1. Ucuz Paket\n` +
      `• \`📬︱reklam・paylaşım\` kanalında **Here** etiketi ile kalıcı paylaşım.\n` +
      `💰 **Fiyat:** \`2.5M OwO\` / \`45 TL İtemSatış\` / \`55 TL IBAN\` / \`70 TL Play Kod\`\n\n` +
      `### 📦 2. Orta Paket\n` +
      `• \`📬︱reklam・paylaşım\` kanalında **Everyone** etiketi ile kalıcı paylaşım.\n` +
      `💰 **Fiyat:** \`5M OwO\` / \`70 TL İtemSatış\` / \`80 TL IBAN\` / \`110 TL Play Kod\`\n\n` +
      `### 📦 3. Pahalı Paket\n` +
      `• \`📬︱reklam・paylaşım\` Everyone paylaşım + Sunucunuza Özel Kanal (7 Gün) + Özel Kanalda Everyone + Özel Çekiliş Açılışı.\n` +
      `💰 **Fiyat:** \`8M OwO\` / \`105 TL İtemSatış\` / \`120 TL IBAN\` / \`160 TL Play Kod\`\n\n` +
      `### 📦 4. Mega Paket\n` +
      `• Everyone Paylaşım + Özel Kanal (14 Gün) + Everyone + Özel Çekiliş + **Sunucu Botu Üzerinden Tüm Üyelere DM Duyuru Hakkı**.\n` +
      `💰 **Fiyat:** \`12M OwO\` / \`150 TL İtemSatış\` / \`175 TL IBAN\` / \`230 TL Play Kod\`\n\n` +
      `### 👑 5. Premium Paket (Full+Full)\n` +
      `• Kalıcı Everyone + En Üstte Özel Kategori & Özel Kanal (20 Gün) + Greed Kurulumu + **2 Adet Toplu DM Duyuru**.\n` +
      `💰 **Fiyat:** \`18M OwO\` / \`195 TL İtemSatış\` / \`230 TL IBAN\` / \`450 TL Play Kod\`\n\n` +
      `### 🎬 6. YouTube & Eko Yıldız Ortak Sponsor Paketi (ÖZEL)\n` +
      `• YouTube videosunda detaylı sponsor tanıtımı + Eko Yıldız botu içerisinde sponsor ortaklık yayını + Sunucu boyu süresiz duyuru.\n` +
      `💰 **Fiyat:** \`25M OwO\` / \`290 TL İtemSatış\` / \`340 TL IBAN\` / \`600 TL Play Kod\`\n\n` +
      `-# Satın almak için aşağıdaki butonları kullanınız veya Kendi Paketinizi Oluşturunuz.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🛒 Reklam Satın Al (Ticket Aç)",
        custom_id: "robloxland_open_ticket_reklam",
        emoji: { name: "📢" }
      },
      {
        style: ButtonStyle.Primary,
        label: "🛠️ Kendi Paketini Oluştur",
        custom_id: "robloxland_custom_ad_package",
        emoji: { name: "✨" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── 8. Satış & Hizmet Fiyat Listeleri ──────────────────────────────────────────
const SALES_CONFIG = {
  [CHANNELS.ROBUX]: {
    title: "💎 Robux Satın Al",
    desc: "En uygun fiyatlarla güvenli, hızlı ve anında teslim Robux stokları.",
    items: [
      "• **100 Robux:** 30 TL IBAN / 25 TL İtemSatış / 1.5M OwO",
      "• **500 Robux:** 140 TL IBAN / 125 TL İtemSatış / 7M OwO",
      "• **1.000 Robux:** 260 TL IBAN / 235 TL İtemSatış / 13M OwO",
      "• **5.000 Robux:** 1.200 TL IBAN / 1.100 TL İtemSatış / 55M OwO",
      "• **10.000 Robux:** 2.300 TL IBAN / 2.150 TL İtemSatış / 100M OwO"
    ]
  },
  [CHANNELS.GROUP]: {
    title: "👥 Roblox Grup Satın Al",
    desc: "Eski kuruluş tarihli, temiz ve üyeli hazır Roblox grupları.",
    items: [
      "• **Boş Hazır Grup:** 40 TL IBAN / 35 TL İtemSatış / 2M OwO",
      "• **100+ Üyeli Grup:** 85 TL IBAN / 75 TL İtemSatış / 4.5M OwO",
      "• **500+ Üyeli Grup:** 175 TL IBAN / 155 TL İtemSatış / 9M OwO",
      "• **1.000+ Üyeli Grup:** 320 TL IBAN / 290 TL İtemSatış / 16M OwO",
      "• **Old/Vintage Grup (2015-2018):** 190 TL IBAN / 170 TL İtemSatış / 10M OwO"
    ]
  },
  [CHANNELS.MEMBER]: {
    title: "📈 Discord Sunucu Üyesi Satın Al",
    desc: "Sunucunuzun görünürlüğünü ve popülerliğini artıracak kaliteli üye çekimleri.",
    items: [
      "• **100 Çevrimdışı Üye:** 25 TL IBAN / 20 TL İtemSatış / 1.2M OwO",
      "• **500 Çevrimdışı Üye:** 95 TL IBAN / 85 TL İtemSatış / 5M OwO",
      "• **1.000 Çevrimdışı Üye:** 170 TL IBAN / 150 TL İtemSatış / 9M OwO",
      "• **100 Aktif/Online Üye:** 50 TL IBAN / 40 TL İtemSatış / 2.5M OwO",
      "• **500 Aktif/Online Üye:** 220 TL IBAN / 195 TL İtemSatış / 11M OwO"
    ]
  },
  [CHANNELS.FOLLOWER]: {
    title: "👤 Roblox Takipçi Satın Al",
    desc: "Roblox profilinize anında güvenli ve kalıcı takipçi gönderimi.",
    items: [
      "• **500 Roblox Takipçi:** 20 TL IBAN / 15 TL İtemSatış / 1M OwO",
      "• **1.000 Roblox Takipçi:** 35 TL IBAN / 30 TL İtemSatış / 1.8M OwO",
      "• **5.000 Roblox Takipçi:** 150 TL IBAN / 130 TL İtemSatış / 7.5M OwO",
      "• **10.000 Roblox Takipçi:** 270 TL IBAN / 240 TL İtemSatış / 13.5M OwO"
    ]
  },
  [CHANNELS.GROUP_MEMBER]: {
    title: "🛡️ Roblox Grup Üyesi Satın Al",
    desc: "Roblox grubunuzu büyütmek için hızlı ve bot korumalı grup üyesi transferi.",
    items: [
      "• **100 Grup Üyesi:** 30 TL IBAN / 25 TL İtemSatış / 1.5M OwO",
      "• **500 Grup Üyesi:** 125 TL IBAN / 110 TL İtemSatış / 6M OwO",
      "• **1.000 Grup Üyesi:** 230 TL IBAN / 205 TL İtemSatış / 11M OwO",
      "• **2.500 Grup Üyesi:** 520 TL IBAN / 470 TL İtemSatış / 25M OwO"
    ]
  },
  [CHANNELS.INSTAGRAM]: {
    title: "📸 Instagram Takipçi & Beğeni",
    desc: "Instagram hesaplarınız için düşmeyen, garantili takipçi ve etkileşim paketleri.",
    items: [
      "• **1.000 Instagram Takipçi:** 35 TL IBAN / 30 TL İtemSatış / 1.8M OwO",
      "• **5.000 Instagram Takipçi:** 140 TL IBAN / 125 TL İtemSatış / 7M OwO",
      "• **10.000 Instagram Takipçi:** 260 TL IBAN / 230 TL İtemSatış / 13M OwO",
      "• **1.000 Beğeni / Görüntülenme:** 15 TL IBAN / 10 TL İtemSatış / 800K OwO"
    ]
  },
  [CHANNELS.BOT]: {
    title: "🤖 Özel Discord Botu Satın Al",
    desc: "İhtiyaçlarınıza özel kodlanmış Discord.js v14, Roblox API entegrasyonlu botlar.",
    items: [
      "• **Temel Kayıt & Moderasyon Botu:** 150 TL IBAN / 130 TL İtemSatış / 8M OwO",
      "• **Ekonomi & Mağaza Botu:** 250 TL IBAN / 220 TL İtemSatış / 13M OwO",
      "• **Roblox Grup Sıralama (Ranking) Botu:** 350 TL IBAN / 310 TL İtemSatış / 18M OwO",
      "• **Full Kapsamlı Özel Sunucu Yönetim Botu:** 600 TL IBAN / 530 TL İtemSatış / 30M OwO"
    ]
  },
  [CHANNELS.MAP]: {
    title: "🗺️ Özel Roblox Haritası (Map) Satın Al",
    desc: "Profesyonel mimarlar tarafından inşa edilmiş optimize ve estetik Roblox haritaları.",
    items: [
      "• **Lobi / Spawn Alanı:** 200 TL IBAN / 175 TL İtemSatış / 10M OwO",
      "• **Askeri / Ordu Üssü:** 450 TL IBAN / 400 TL İtemSatış / 22M OwO",
      "• **Şehir & Rolplay Haritası:** 750 TL IBAN / 670 TL İtemSatış / 38M OwO",
      "• **Özel Konsept Tam Oyun Haritası:** İletişime geçiniz (Ticket açınız)"
    ]
  },
  [CHANNELS.OWO]: {
    title: "🪙 OwO Para Satın Al",
    desc: "En ucuz fiyat garantisiyle anında transfer edilen OwO Coin stokları.",
    items: [
      "• **1M OwO:** 15 TL IBAN / 12 TL İtemSatış",
      "• **5M OwO:** 60 TL IBAN / 50 TL İtemSatış",
      "• **10M OwO:** 110 TL IBAN / 95 TL İtemSatış",
      "• **25M OwO:** 250 TL IBAN / 220 TL İtemSatış",
      "• **50M OwO:** 470 TL IBAN / 420 TL İtemSatış"
    ]
  },
  [CHANNELS.GFX]: {
    title: "🎨 Özel GFX & Grafik Tasarım",
    desc: "Roblox oyun kapakları, profil avatarları, logolar ve afişler.",
    items: [
      "• **Tek Karakter GFX Avatar:** 50 TL IBAN / 40 TL İtemSatış / 2.5M OwO",
      "• **Roblox Oyun Thumbnail (Kapak):** 120 TL IBAN / 105 TL İtemSatış / 6M OwO",
      "• **Oyun İkonu & Logo:** 80 TL IBAN / 70 TL İtemSatış / 4M OwO",
      "• **Tam Oyun Grafik Seti (Logo + Icon + 2 Thumbnail):** 280 TL IBAN / 250 TL İtemSatış / 14M OwO"
    ]
  }
};

function buildSalePayload(info) {
  const content = [
    ComponentsV2Factory.text(
      `# ${info.title}\n\n` +
      `${info.desc}\n\n` +
      `### 💳 Güncel Fiyat Listesi:\n` +
      `${info.items.join("\n")}\n\n` +
      `-# Alışveriş yapmak için aşağıdaki butona basarak Destek Talebi açınız.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "🛒 Satın Al / Destek Talebi Aç",
        custom_id: "robloxland_open_ticket_siparis",
        emoji: { name: "🛍️" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

// ─── TEK SEFERLİĞİNE OTOMATİK KURULUM ──────────────────────────────────────────
async function deployRobloxDevsSetup(client, force = false) {
  const state = getSetupState();
  if (state.deployed && !force) {
    return { success: true, message: "Zaten daha önce kuruldu (atlandı)." };
  }

  console.log("[RobloxDevsSetup] 🚀 RobloxDevs & Robloxland panelleri kuruluyor...");

  const results = [];
  const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) {
    console.warn(`[RobloxDevsSetup] Hedef sunucu (${GUILD_ID}) bulunamadı.`);
    return { success: false, message: "Sunucu bulunamadı." };
  }

  // 1. Kurallar
  try {
    const ch = await guild.channels.fetch(CHANNELS.RULES).catch(() => null);
    if (ch && ch.isTextBased()) {
      await ch.send(buildRulesPayload());
      results.push("Kurallar");
    }
  } catch (e) { console.error("Rules deploy error:", e.message); }

  // 2. Dolandırıcılar
  try {
    const ch = await guild.channels.fetch(CHANNELS.SCAMMERS).catch(() => null);
    if (ch && ch.isTextBased()) {
      await ch.send(buildScammerPanelPayload());
      results.push("Dolandırıcılar");
    }
  } catch (e) { console.error("Scammers deploy error:", e.message); }

  // 3. Sipariş Kuralları
  try {
    const ch = await guild.channels.fetch(CHANNELS.ORDER_RULES).catch(() => null);
    if (ch && ch.isTextBased()) {
      await ch.send(buildOrderRulesPayload());
      results.push("Sipariş Kuralları");
    }
  } catch (e) { console.error("Order rules deploy error:", e.message); }

  // 4. Biz Kimiz
  try {
    const ch = await guild.channels.fetch(CHANNELS.ABOUT_US).catch(() => null);
    if (ch && ch.isTextBased()) {
      await ch.send(buildAboutUsPayload());
      results.push("Biz Kimiz");
    }
  } catch (e) { console.error("About us deploy error:", e.message); }

  // 5. Yetkili Alım
  try {
    const ch = await guild.channels.fetch(CHANNELS.STAFF_APPLY).catch(() => null);
    if (ch && ch.isTextBased()) {
      await ch.send(buildStaffApplyPayload());
      results.push("Yetkili Alım");
    }
  } catch (e) { console.error("Staff apply deploy error:", e.message); }

  // 6. Destek Paneli
  try {
    const ch = await guild.channels.fetch(CHANNELS.TICKET_PANEL).catch(() => null);
    if (ch && ch.isTextBased()) {
      await ch.send(buildTicketPanelPayload());
      results.push("Destek Paneli");
    }
  } catch (e) { console.error("Ticket panel deploy error:", e.message); }

  // 7. Reklam Paketleri
  try {
    const ch = await guild.channels.fetch(CHANNELS.AD_PACKAGES).catch(() => null);
    if (ch && ch.isTextBased()) {
      await ch.send(buildAdPackagesPayload());
      results.push("Reklam Paketleri");
    }
  } catch (e) { console.error("Ad packages deploy error:", e.message); }

  // 8. Satış Kanalları
  for (const [chanId, info] of Object.entries(SALES_CONFIG)) {
    try {
      const ch = await guild.channels.fetch(chanId).catch(() => null);
      if (ch && ch.isTextBased()) {
        await ch.send(buildSalePayload(info));
        results.push(info.title);
      }
    } catch (e) { console.error(`Sale channel ${chanId} deploy error:`, e.message); }
  }

  saveSetupState({ deployed: true, deployedAt: new Date().toISOString(), results });
  console.log(`[RobloxDevsSetup] ✅ Başarıyla kurulan paneller: ${results.join(", ")}`);
  return { success: true, results };
}

// ─── ETKİLEŞİM İŞLEYİCİLERİ (MODAL & BUTONLAR) ──────────────────────────────────
async function handleRobloxDevsInteraction(interaction) {
  if (!interaction.isRepliable()) return false;

  const { customId } = interaction;

  // 1. Yetkili Alım Form Butonuna Tıklandı
  if (interaction.isButton() && customId === "robloxland_staff_apply") {
    const modal = new ModalBuilder()
      .setCustomId("robloxland_staff_modal")
      .setTitle("Robloxland Yetkili Alım Formu");

    const inputName = new TextInputBuilder()
      .setCustomId("staff_name")
      .setLabel("İsim / Yaş")
      .setPlaceholder("Örn: Kerem / 17")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const inputExperience = new TextInputBuilder()
      .setCustomId("staff_exp")
      .setLabel("Hiç Satış Mağazasında Bulundun mu?")
      .setPlaceholder("Daha önce hangi mağaza veya sunucularda yetkili oldunuz?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const inputCustomers = new TextInputBuilder()
      .setCustomId("staff_customers")
      .setLabel("Müşteri Çekebilir misin?")
      .setPlaceholder("Müşteri çekme stratejiniz ve çevreniz hakkında bilgi veriniz.")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const inputOtherRoles = new TextInputBuilder()
      .setCustomId("staff_other")
      .setLabel("Başka Bir Yerde Yetkili misin?")
      .setPlaceholder("Şu anda aktif yetkili olduğunuz başka sunucular var mı?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputName),
      new ActionRowBuilder().addComponents(inputExperience),
      new ActionRowBuilder().addComponents(inputCustomers),
      new ActionRowBuilder().addComponents(inputOtherRoles)
    );

    await interaction.showModal(modal);
    return true;
  }

  // 2. Yetkili Alım Formu Dolduruldu (Modal Submit)
  if (interaction.isModalSubmit() && customId === "robloxland_staff_modal") {
    const name = interaction.fields.getTextInputValue("staff_name");
    const exp = interaction.fields.getTextInputValue("staff_exp");
    const customers = interaction.fields.getTextInputValue("staff_customers");
    const other = interaction.fields.getTextInputValue("staff_other");

    // A) Başvuran kullanıcıya interaktif rehber gönder (Ephemeral)
    const guidePayload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 📘 Robloxland — Yetkili Rehberi: Bizde Çalışırsan Bunları Yapmalısın\n\n` +
        `Tebrikler **${interaction.user.username}**, yetkili başvurunuz başarıyla alındı ve yönetime iletildi!\n\n` +
        `### 🎯 Ekibimizde Dikkat Edilmesi Gereken Temel Görevler:\n` +
        `1. **Müşteri Memnuniyeti:** Müşterilere karşı daima nazik, çözüm odaklı ve kurumsal bir dille yaklaşınız.\n` +
        `2. **Aktiflik ve Vardiya:** Belirlenen saatlerde biletlere (ticket) hızlı yanıt veriniz, gecikme durumunda diğer yetkililerden destek isteyiniz.\n` +
        `3. **Güvenlik İlkeleri:** Müşterilerle kesinlikle DM üzerinden özel ticaret yapmayınız, tüm işlemleri sunucu kanallarında tutunuz.\n` +
        `4. **Dürüstlük & Şeffaflık:** Teslimat kanıtlarını kayıt altına alınız ve dolandırıcılığa karşı tetikte olunuz.\n\n` +
        `*Başvurunuz incelendikten sonra sonucunuz Discord DM kutunuza otomatik olarak iletilecektir.*`
      )
    ]);

    await interaction.reply({ ...guidePayload, ephemeral: true });

    // B) Log kanalına (1543382733408174220) başvuruyu butonlarla gönder
    try {
      const logChannel = interaction.guild?.channels.cache.get(STAFF_LOG_CHANNEL_ID) ||
                         await interaction.guild?.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);

      if (logChannel && logChannel.isTextBased()) {
        const logContent = [
          ComponentsV2Factory.text(
            `# 📋 Yeni Yetkili Başvurusu!\n\n` +
            `👤 **Başvuran:** <@${interaction.user.id}> (\`${interaction.user.id}\`)\n` +
            `📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
            `**1. İsim / Yaş:**\n${name}\n\n` +
            `**2. Satış Mağazasında Bulundu mu?:**\n${exp}\n\n` +
            `**3. Müşteri Çekebilir mi?:**\n${customers}\n\n` +
            `**4. Başka Bir Yerde Yetkili mi?:**\n${other}`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            {
              style: ButtonStyle.Success,
              label: "✅ Kabul Et",
              custom_id: `robloxland_staff_accept_${interaction.user.id}`,
              emoji: { name: "🎉" }
            },
            {
              style: ButtonStyle.Danger,
              label: "❌ Reddet",
              custom_id: `robloxland_staff_reject_${interaction.user.id}`,
              emoji: { name: "🚫" }
            }
          ])
        ];

        await logChannel.send(ComponentsV2Factory.buildPayload(logContent));
      }
    } catch (logErr) {
      console.error("[RobloxDevsSetup] Staff apply log error:", logErr.message);
    }
    return true;
  }

  // 3. Yetkili Başvurusunu Kabul Et / Reddet Butonları
  if (interaction.isButton() && (customId.startsWith("robloxland_staff_accept_") || customId.startsWith("robloxland_staff_reject_"))) {
    const isAccept = customId.startsWith("robloxland_staff_accept_");
    const targetUserId = customId.replace("robloxland_staff_accept_", "").replace("robloxland_staff_reject_", "");

    const isAdmin = interaction.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
                    interaction.member?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
                    interaction.user.id === "1031620522406072350";

    if (!isAdmin) {
      return interaction.reply({ content: "❌ Bu başvuruyu sadece sunucu yöneticileri onaylayabilir veya reddedebilir.", ephemeral: true });
    }

    const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);

    if (isAccept) {
      if (targetUser) {
        await targetUser.send({
          content: `🎉 **Tebrikler <@${targetUserId}>!**\n**Robloxland** yetkili başvurunuz **${interaction.user.tag}** tarafından onaylanmıştır!\nLütfen sunucuya giriş yaparak yetkili odalarını kontrol ediniz ve yönetimle iletişime geçiniz.`
        }).catch(() => {});
      }
      await interaction.reply({ content: `✅ <@${targetUserId}> kullanıcısının yetkili başvurusu başarıyla **kabul edildi** ve DM bilgilendirmesi yapıldı.`, ephemeral: true });
    } else {
      if (targetUser) {
        await targetUser.send({
          content: `❌ **Merhaba <@${targetUserId}>,**\n**Robloxland** yetkili başvurunuz maalesef yapılan değerlendirme sonucunda onaylanmamıştır. İlerleyen dönemlerde tekrar başvurabilirsiniz.`
        }).catch(() => {});
      }
      await interaction.reply({ content: `❌ <@${targetUserId}> kullanıcısının yetkili başvurusu **reddedildi** ve DM bilgilendirmesi yapıldı.`, ephemeral: true });
    }

    // Butonları devre dışı bırakıp log mesajını güncelle
    try {
      const statusText = isAccept
        ? `\n\n✅ **KABUL EDİLDİ** — Yetkili: <@${interaction.user.id}> (<t:${Math.floor(Date.now() / 1000)}:R>)`
        : `\n\n❌ **REDDEDİLDİ** — Yetkili: <@${interaction.user.id}> (<t:${Math.floor(Date.now() / 1000)}:R>)`;

      await interaction.message.edit({
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text(interaction.message.content + statusText),
            ComponentsV2Factory.separator(false),
            ComponentsV2Factory.actionRow([
              {
                style: isAccept ? ButtonStyle.Success : ButtonStyle.Danger,
                label: isAccept ? "Kabul Edildi" : "Reddedildi",
                custom_id: "disabled_status",
                disabled: true
              }
            ])
          ])
        ]
      }).catch(() => {});
    } catch (_) {}

    return true;
  }

  // 4. Ticket Açma Butonları (Sipariş / Reklam / Destek)
  if (interaction.isButton() && interaction.customId.startsWith("robloxland_open_ticket_")) {
    const type = interaction.customId.replace("robloxland_open_ticket_", "");
    const guild = interaction.guild;
    if (!guild) return false;

    await interaction.deferReply({ ephemeral: true });

    // Hedef kategoriyi kontrol et (1538466419245719663)
    let category = guild.channels.cache.get(TICKET_CATEGORY_ID) ||
                   await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null);

    if (!category) {
      category = await guild.channels.create({
        name: "📁 TALEPLER & SİPARİŞLER",
        type: ChannelType.GuildCategory,
        reason: "Robloxland Destek Talepleri Kategorisi"
      }).catch(() => null);
    }

    const channelName = `talep-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    // Kanalı oluştur
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category ? category.id : null,
      topic: `Müşteri: ${interaction.user.tag} (${interaction.user.id}) | Tür: ${type.toUpperCase()}`,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        },
        ...(interaction.client.user?.id ? [{
          id: interaction.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels
          ]
        }] : [])
      ]
    }).catch((err) => {
      console.error("[RobloxDevsSetup] Ticket create error:", err.message);
      return null;
    });

    if (!ticketChannel) {
      return interaction.editReply({ content: "❌ Destek kanalı oluşturulurken bir hata oluştu. Lütfen yetkililere bildiriniz." });
    }

    // Ticket içine karşılama mesajı gönder
    const welcomePayload = ComponentsV2Factory.buildPayload([
      ComponentsV2Factory.text(
        `# 👋 Hoş Geldiniz, <@${interaction.user.id}>!\n\n` +
        `Destek ve sipariş talebiniz başarıyla açıldı.\n` +
        `• **Talep Türü:** \`${type.toUpperCase()}\`\n` +
        `• **Kategori:** ${category ? category.name : "Destek"}\n\n` +
        `Lütfen almak istediğiniz ürünü veya sorununuzu detaylıca yazınız. Yetkili ekibimiz en kısa sürede sizinle ilgilenecektir.`
      ),
      ComponentsV2Factory.separator(true),
      ComponentsV2Factory.actionRow([
        {
          style: ButtonStyle.Danger,
          label: "🔒 Talebi Kapat",
          custom_id: "robloxland_close_ticket",
          emoji: { name: "🔒" }
        }
      ])
    ]);

    await ticketChannel.send({ content: `<@${interaction.user.id}>`, ...welcomePayload });

    return interaction.editReply({ content: `✅ Destek talebiniz açıldı: <#${ticketChannel.id}>` });
  }

  // 5. Ticket Kapat Butonu
  if (interaction.isButton() && interaction.customId === "robloxland_close_ticket") {
    await interaction.reply({ content: "🔒 Bu talep 5 saniye içinde kapatılıp silinecektir..." });
    setTimeout(async () => {
      await interaction.channel.delete().catch(() => {});
    }, 5000);
    return true;
  }

  // 6. Dolandırıcı Bildir Butonu (Modal)
  if (interaction.isButton() && interaction.customId === "robloxland_scam_report") {
    const modal = new ModalBuilder()
      .setCustomId("robloxland_scam_report_modal")
      .setTitle("Dolandırıcı Bildirimi");

    const inputTarget = new TextInputBuilder()
      .setCustomId("scam_user")
      .setLabel("Dolandırıcının Kullanıcı Adı veya ID'si")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const inputProof = new TextInputBuilder()
      .setCustomId("scam_proof")
      .setLabel("Olay Detayı ve Kanıt Bağlantıları")
      .setPlaceholder("Ekran görüntüsü linkleri, dekont bilgisi vb.")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputTarget),
      new ActionRowBuilder().addComponents(inputProof)
    );

    await interaction.showModal(modal);
    return true;
  }

  // 7. Dolandırıcı Bildir Modal Submit
  if (interaction.isModalSubmit() && interaction.customId === "robloxland_scam_report_modal") {
    const user = interaction.fields.getTextInputValue("scam_user");
    const proof = interaction.fields.getTextInputValue("scam_proof");

    await interaction.reply({
      content: "✅ **Dolandırıcı bildiriminiz başarıyla kaydedildi.** Yetkililerimiz inceleyerek gerekli işlemleri yapacaktır. Teşekkür ederiz.",
      ephemeral: true
    });

    try {
      const logChan = interaction.guild?.channels.cache.get(STAFF_LOG_CHANNEL_ID) ||
                      await interaction.guild?.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
      if (logChan && logChan.isTextBased()) {
        await logChan.send({
          content: `🚨 **Yeni Dolandırıcı Bildirimi!**\n• **Bildiren:** <@${interaction.user.id}>\n• **Şüpheli:** \`${user}\`\n• **Detay & Kanıt:**\n${proof}`
        });
      }
    } catch (_) {}
    return true;
  }

  // 8. Kendi Paketini Oluştur Butonu (Modal)
  if (interaction.isButton() && interaction.customId === "robloxland_custom_ad_package") {
    const modal = new ModalBuilder()
      .setCustomId("robloxland_custom_ad_modal")
      .setTitle("Kendi Reklam Paketini Oluştur");

    const inputAdDesc = new TextInputBuilder()
      .setCustomId("custom_ad_content")
      .setLabel("Hangi Özellikleri İstiyorsunuz?")
      .setPlaceholder("Örn: Everyone paylaşım + Özel Çekiliş + 1 Adet DM Duyuru + YouTube reklamı")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const inputBudget = new TextInputBuilder()
      .setCustomId("custom_ad_budget")
      .setLabel("Bütçeniz ve Ödeme Yönteminiz")
      .setPlaceholder("Örn: 200 TL IBAN / İtemSatış / 15M OwO")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputAdDesc),
      new ActionRowBuilder().addComponents(inputBudget)
    );

    await interaction.showModal(modal);
    return true;
  }

  // 9. Kendi Paketini Oluştur Modal Submit -> Özel Ticket Açar
  if (interaction.isModalSubmit() && customId === "robloxland_custom_ad_modal") {
    const contentText = interaction.fields.getTextInputValue("custom_ad_content");
    const budget = interaction.fields.getTextInputValue("custom_ad_budget");

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    let category = guild.channels.cache.get(TICKET_CATEGORY_ID) ||
                   await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null);

    const ticketChannel = await guild.channels.create({
      name: `ozel-reklam-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      type: ChannelType.GuildText,
      parent: category ? category.id : null,
      topic: `Özel Reklam Paketi | Müşteri: ${interaction.user.tag} (${interaction.user.id})`,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        ...(interaction.client.user?.id ? [{
          id: interaction.client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
        }] : [])
      ]
    }).catch(() => null);

    if (ticketChannel) {
      await ticketChannel.send({
        content: `<@${interaction.user.id}>`,
        ...ComponentsV2Factory.buildPayload([
          ComponentsV2Factory.text(
            `# 🛠️ Özel Reklam Paketi Talebi\n\n` +
            `Müşteri: <@${interaction.user.id}>\n\n` +
            `📋 **İstenen Reklam Özellikleri:**\n${contentText}\n\n` +
            `💰 **Belirtilen Bütçe / Ödeme Türü:**\n${budget}\n\n` +
            `Yetkilimiz özel teklif ve indirimli fiyat hesaplaması ile birazdan sizinle ilgilenecektir.`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            { style: ButtonStyle.Danger, label: "🔒 Kapat", custom_id: "robloxland_close_ticket", emoji: { name: "🔒" } }
          ])
        ])
      });

      return interaction.editReply({ content: `✅ Özel reklam talebiniz oluşturuldu: <#${ticketChannel.id}>` });
    } else {
      return interaction.editReply({ content: "❌ Kanal oluşturulamadı." });
    }
  }

  return false;
}

module.exports = {
  deployRobloxDevsSetup,
  handleRobloxDevsInteraction,
  CHANNELS,
  TICKET_CATEGORY_ID
};
