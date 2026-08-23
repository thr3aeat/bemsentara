'use strict';

const {
  EmbedBuilder, ChannelType, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const Ticket = require('../../models/Ticket');
const { generateTicketId } = require('../../utils/ticketId');
const { GUILD2_ID, GUILD2_TICKET_CATEGORY_ID } = require('../../config');
const { ROLES } = require('./staffSystem');

/**
 * Reklam & Sponsorluk Paketleri Veritabanı
 * Psikolojik pazarlama:
 * 1. Liste TL fiyatı üstü çizili (%40-%60 indirim)
 * 2. 3x Çoklu Yayın / Abone Alım Çapası (Anchor Effect)
 * 3. Aşırı pahalılaştırılmış, üzeri çizili fake indirimli Robux fiyatları
 * 4. Kalan Kontenjan / Kıtlık (FOMO)
 * 5. Cross-Sell / Upsell Fırsatları
 * Tüm ödemeler SADECE İTEMSATIŞ üzerinden gerçekleştirilir.
 */
const REKLAM_PACKAGES = [
  {
    id: 'pkg_shorts',
    code: 'pkg_30',
    title: 'Shorts & Hızlı Tanıtım Paketi',
    emoji: '📱',
    badge: '⚡ EN HIZLI DÖNÜŞÜM',
    regularPrice: '75 TL',
    discountPrice: '30 TL',
    multiPackPrice: '65 TL (3x Shorts - Video Başı 21 TL!)',
    multiPackRobux: '5.200 Robux',
    regularRobux: '4.500 Robux',
    discountRobux: '2.400 Robux',
    discountPercent: '%60 İNDİRİM',
    color: 0x3498DB,
    category: 'Ekonomik Paketler',
    remainingSlots: 1,
    maxSlots: 3,
    upsellTargetId: 'pkg_advantaged',
    upsellNotice: 'Sadece +40 TL farkla hem Shorts hem Sesli Mid-Roll (Avantajlı Paket) almak ister misiniz? (Normalde 100 TL yerine size özel 70 TL!)',
    summary: 'YouTube Shorts ve dikey formatlı videolarda dinamik reklam yerleşimi.',
    features: [
      'YouTube Shorts videolarında video içi logo & ürün görseli',
      'İlk yorumda sabitlenmiş (pinned) sponsorluk ve davet linki',
      'Video açıklamasında ilk 2 satırda doğrudan bağlantı',
      'Hızlı tüketilen, algoritmada yüksek izlenmeye ulaşan dinamik kitle',
      'Mobil kullanıcılar için anında tek tıkla katılım avantajı'
    ],
    reach: '15.000 - 60.000+ Dikey İzlenme / Gösterim',
    idealFor: 'Hızlı kitle çekmek, Roblox sunucusu veya oyun grubuna anlık oyuncu kazandırmak isteyenler.'
  },
  {
    id: 'pkg_standart',
    code: 'pkg_50',
    title: 'Standart Uzun Video Sponsorluğu',
    emoji: '🎬',
    badge: '🎯 FİYAT / PERFORMANS',
    regularPrice: '125 TL',
    discountPrice: '50 TL',
    multiPackPrice: '110 TL (3x Video Alt Bant - Video Başı 36 TL!)',
    multiPackRobux: '9.200 Robux',
    regularRobux: '7.500 Robux',
    discountRobux: '4.200 Robux',
    discountPercent: '%60 İNDİRİM',
    color: 0x2ECC71,
    category: 'Ekonomik Paketler',
    remainingSlots: 2,
    maxSlots: 4,
    upsellTargetId: 'pkg_advantaged',
    upsellNotice: 'Sadece +30 TL farkla videonun en heyecanlı anında 20-30 saniyelik Sesli Mid-Roll Reklam Arası eklemek ister misiniz?',
    summary: 'YouTube ana videolarında sabit alt bant ve açıklama sponsorluğu.',
    features: [
      'Video boyunca alt kısımda sabit, şık sponsor banner / metin yerleşimi',
      'Video açıklamasının en üstünde özel başlık ve yönlendirme linki',
      'Sabitlenmiş yorumda doğrudan katıl / tıkla bağlantısı',
      'Kalıcı video varlığı (Video kanalda kaldığı sürece reklamınız silinmez)',
      'Organik ve sadık izleyici kitlesine doğrudan hitap'
    ],
    reach: '8.000 - 25.000+ Kalıcı Organik İzlenme',
    idealFor: 'Bütçe dostu, kalıcı ve sürekli izlenen videolarda marka bilinirliği oluşturmak isteyenler.'
  },
  {
    id: 'pkg_advantaged',
    code: 'pkg_100',
    title: 'Avantajlı Uzun Video (Mid-Roll Sesli)',
    emoji: '🔥',
    badge: '🏆 EN ÇOK TERCİH EDİLEN',
    regularPrice: '250 TL',
    discountPrice: '100 TL',
    multiPackPrice: '220 TL (3x Sesli Mid-Roll - Video Başı 73 TL!)',
    multiPackRobux: '15.000 Robux',
    regularRobux: '12.000 Robux',
    discountRobux: '6.800 Robux',
    discountPercent: '%60 İNDİRİM',
    color: 0xE67E22,
    category: 'Popüler Paketler',
    remainingSlots: 1,
    maxSlots: 3,
    upsellTargetId: 'pkg_gold',
    upsellNotice: 'Sadece +150 TL farkla hem YouTube Shorts hem de yüz binlerce kişiye ulaşan YouTube Topluluk Anketi içeren Gold Kombin Pakete yükseltmek ister misiniz?',
    summary: 'Videonun en heyecanlı anında 20-30 saniyelik sesli & görüntülü özel reklam arası.',
    features: [
      'Videonun orta kısmında (Mid-Roll) sesli ve görüntülü özel tanıtım bölümü',
      'Tüm video boyunca alt bant sponsorluk yazısı/logosu',
      'Açıklamada ve sabitlenmiş yorumda özel çağrı metni (CTA)',
      'İzleyicinin dikkatini dağıtmadan maksimum odaklanma sağlayan kurgu',
      'Yüksek tıklama ve dönüşüm oranı sağlayan doğrudan yönlendirme'
    ],
    reach: '15.000 - 40.000+ Yüksek Etkileşimli İzlenme',
    idealFor: 'Roblox oyunları, Discord toplulukları ve projelerini sesli olarak detaylı tanıtmak isteyenler.'
  },
  {
    id: 'pkg_gold',
    code: 'pkg_350',
    title: 'Gold Kombin Paket (3 Platform)',
    emoji: '🌟',
    badge: '⚡ ÇOKLU PLATFORM GÜCÜ',
    regularPrice: '875 TL',
    discountPrice: '350 TL',
    multiPackPrice: '750 TL (3 Aylık Gold Paket - %35 Tasarruf!)',
    multiPackRobux: '32.000 Robux',
    regularRobux: '26.000 Robux',
    discountRobux: '14.500 Robux',
    discountPercent: '%60 İNDİRİM',
    color: 0xF1C40F,
    category: 'Premium & Entegre Paketler',
    remainingSlots: 1,
    maxSlots: 2,
    upsellTargetId: 'pkg_mega',
    upsellNotice: 'Sadece +100 TL farkla 50.000+ kişilik Discord sunucumuzda @everyone duyurusu dahil Mega Etkileşim Paketine yükseltmek ister misiniz?',
    summary: 'YouTube Uzun Video + Shorts + YouTube Topluluk Anketi üçlüsü.',
    features: [
      'Uzun videoda alt bant sponsorluğu + Video içi Mid-Roll reklam',
      '1 Adet YouTube Shorts dikey reklam videosu',
      'YouTube Topluluk sekmesinde yüz binlerce kişiye ulaşan özel Anket & Reklam',
      '3 farklı kanaldan eşzamanlı kitle akışı ve etkileşim',
      'Açıklama & yorumlarda öncelikli VIP konumlandırma'
    ],
    reach: '50.000 - 120.000+ Toplam Kitle Erişimi',
    idealFor: 'Tek bir videoyla sınırlı kalmayıp tüm platformlardan kitle çekmek isteyen ciddi projeler.'
  },
  {
    id: 'pkg_mega',
    code: 'pkg_500',
    title: 'Mega Etkileşim Paketi (360° Reklam)',
    emoji: '🚀',
    badge: '💥 360 DERECE GÖRÜNÜRLÜK',
    regularPrice: '1.250 TL',
    discountPrice: '500 TL',
    multiPackPrice: '1.100 TL (3x Mega Paket - %30 Tasarruf!)',
    multiPackRobux: '44.000 Robux',
    regularRobux: '36.000 Robux',
    discountRobux: '19.800 Robux',
    discountPercent: '%60 İNDİRİM',
    color: 0x9B59B6,
    category: 'Premium & Entegre Paketler',
    remainingSlots: 2,
    maxSlots: 3,
    upsellTargetId: 'pkg_vip_cekilis',
    upsellNotice: 'Sadece +120 TL farkla Roblox grubunuza katılım şartlı 9.800 Robux Çekilişi (Garantili +1.500 üye kazandıran) Çekilişli VIP Pakete geçmek ister misiniz?',
    summary: 'YouTube + Topluluk + Discord Sunucusu tam kapsamlı reklam bombardımanı.',
    features: [
      'Uzun video alt bant + Video içi sesli Mid-Roll reklam arası',
      '1 Adet YouTube Shorts dikey tanıtım videosu',
      'YouTube Topluluk sekmesinde özel anket + görsel/metin tanıtımı',
      'Discord sunucumuzda @everyone / @here bildirimli özel sponsorluk duyurusu',
      'Discord özel duyuru kanalında kalıcı sponsor rolü ve link paylaşımı',
      'Tüm sosyal ağlarda eşzamanlı yayınlama'
    ],
    reach: '80.000 - 200.000+ Çoklu Platform Gösterimi',
    idealFor: 'Discord sunucusunu doldurmak, büyük sunucu açılışları veya lansmanlar yapmak isteyenler.'
  },
  {
    id: 'pkg_vip_cekilis',
    code: 'pkg_670',
    title: 'Çekilişli VIP Paket (Garantili Üye Çekimi)',
    emoji: '💎',
    badge: '🎁 GARANTİLİ ÜYE & TAKİPÇİ',
    regularPrice: '1.490 TL',
    discountPrice: '670 TL',
    multiPackPrice: '1.450 TL (2 Aylık VIP Çekiliş Kampı)',
    multiPackRobux: '58.000 Robux',
    regularRobux: '48.000 Robux',
    discountRobux: '26.500 Robux',
    discountPercent: '%55 DEV İNDİRİM',
    color: 0x1ABC9C,
    category: 'VIP & Topluluk Odaklı Paketler',
    remainingSlots: 1,
    maxSlots: 2,
    upsellTargetId: 'pkg_ultimate',
    upsellNotice: 'Sadece +150 TL farkla grubunuza özel 1 Aylık Tam Kapsamlı Topluluk Büyütme Kampı ve Resmi Partnerlik almak ister misiniz?',
    summary: 'Mega Etkileşim Paketi + Reklam Sahibinin Grubuna Özel 9.800 Robux Çekilişi!',
    features: [
      'Mega Etkileşim Paketi’ndeki TÜM ÖZELLİKLER (Uzun video, Shorts, Topluluk, Discord Duyurusu)',
      '🎯 BÜYÜK ÇEKİLİŞ: 2 kişiye toplam 9.800 Robux ödüllü sponsorlu çekiliş',
      'Çekilişe katılım şartı: Reklam sahibinin Roblox grubuna / Discord sunucusuna katılmak zorunludur!',
      'Doğrudan yüzlerce gerçek, aktif oyuncuyu grubunuza/sunucunuza kazandırır',
      'Organik üye artışı ve rekor etkileşim garantisi'
    ],
    reach: '150.000+ Gösterim + Garantili 500-1500+ Yeni Grup/Sunucu Üyesi',
    idealFor: 'Roblox grubunu ve Discord sunucusunu hızlıca binlerce üyeye ulaştırmak isteyen VIP müşteriler.'
  },
  {
    id: 'pkg_ultimate',
    code: 'pkg_870',
    title: 'Ultimate Roblox & Topluluk Kampı',
    emoji: '👑',
    badge: '👑 MAKSİMUM PRESTİJ & LİDERLİK',
    regularPrice: '1.890 TL',
    discountPrice: '870 TL',
    multiPackPrice: '1.900 TL (3 Aylık Mega Geliştirme Kampı)',
    multiPackRobux: '75.000 Robux',
    regularRobux: '65.000 Robux',
    discountRobux: '35.000 Robux',
    discountPercent: '%54 VIP FIRSAT',
    color: 0xE74C3C,
    category: 'VIP & Topluluk Odaklı Paketler',
    remainingSlots: 1,
    maxSlots: 1,
    summary: 'VIP Çekilişli Paket + Özel Roblox Grubu Geliştirme Kampı & 1 Ay Partnerlik!',
    features: [
      'Çekilişli VIP Paket\'in tüm içerikleri (9.800 Robux Çekilişi Dahil)',
      '🔥 ROBLOX GRUBU GELİŞTİRME KAMPI: Grubunuza özel 1 aylık büyüme stratejisi ve aktif kamp tanıtımı',
      'Tüm platformlarda grubun 1 ay boyunca resmi partner olarak sabitlenmesi',
      'Özel video kurgusu & senaryolu oyun/grup tanıtım içeriği',
      'Üst Düzey Yönetici ve İçerik Üreticisi ile birebir VIP danışmanlık'
    ],
    reach: '300.000+ Devasa Kitle Erişimi & Kalıcı Liderlik',
    idealFor: 'Piyasada lider Roblox stüdyosu/grubu olmak, oyununu trendlere sokmak isteyen vizyoner müşteriler.'
  },
  {
    id: 'pkg_custom',
    code: 'pkg_custom',
    title: 'Özel Proje & Lansman Sponsorluğu',
    emoji: '🎯',
    badge: '✨ KİŞİYE ÖZEL KURGU',
    regularPrice: '2.100 TL',
    discountPrice: '1.050 TL\'den başlayan',
    multiPackPrice: 'Görüşme ile Özel Fiyatlandırma',
    multiPackRobux: 'Özel Teklif',
    regularRobux: '88.000 Robux',
    discountRobux: '48.000+ Robux',
    discountPercent: '%50 İNDİRİM',
    color: 0x34495E,
    category: 'Özel Projeler',
    remainingSlots: 1,
    maxSlots: 2,
    summary: 'Size özel senaryolu videolar, turnuvalar, kampanya entegrasyonları ve lansmanlar.',
    features: [
      'Kişiye / Markaya özel kurgulanmış video serisi veya dizi formatı',
      'Büyük ödüllü oyun turnuvası veya etkinlik sponsorluğu',
      'Özel Discord botu entegrasyonu ve marka işbirlikleri',
      'Esnek bütçe ve hedeflere göre uyarlanabilir tam paket',
      'Özel sözleşmeli ve faturalı kurumsal sponsorluk'
    ],
    reach: 'Projenin Büyüklüğüne Göre 500.000+ Sınırsız Kitle',
    idealFor: 'Büyük markalar, oyun geliştiricileri ve özel etkinlik düzenlemek isteyen sponsorlar.'
  }
];

/**
 * Özellik Seçim Modülleri (Kendi Paketini Oluştur / Customizer)
 */
const CUSTOM_BUILDER_MODULES = [
  {
    id: 'mod_banner',
    label: '🎬 Sabit Alt Bant Sponsorluğu',
    desc: 'Video boyunca sabit alt yazı/logo yerleşimi',
    tlPrice: 30,
    robuxPrice: 2400
  },
  {
    id: 'mod_midroll',
    label: '🎙️ Sesli & Görüntülü Mid-Roll Reklam',
    desc: 'Video ortasında 20-30 saniye özel sesli tanıtım',
    tlPrice: 70,
    robuxPrice: 4800
  },
  {
    id: 'mod_shorts',
    label: '📱 1x YouTube Shorts Dikey Tanıtım',
    desc: 'Shorts & dikey video formatında hızlı erişim',
    tlPrice: 30,
    robuxPrice: 2400
  },
  {
    id: 'mod_community',
    label: '📊 YouTube Topluluk Anketi & Gönderisi',
    desc: 'Yüz binlerce kişiye ulaşan topluluk sekmesi gönderisi',
    tlPrice: 80,
    robuxPrice: 5200
  },
  {
    id: 'mod_discord',
    label: '📢 Discord Sunucu @everyone Duyurusu',
    desc: '50.000+ üyeli Discord sunucumuzda bildirimli duyuru',
    tlPrice: 120,
    robuxPrice: 7500
  },
  {
    id: 'mod_raffle',
    label: '🎁 9.800 Robux Çekilişi (Üye Çekme)',
    desc: 'Grubunuza katılma şartlı dev Robux çekilişi',
    tlPrice: 250,
    robuxPrice: 15000
  },
  {
    id: 'mod_camp',
    label: '👑 1 Aylık Roblox Geliştirme Kampı',
    desc: 'Tüm platformlarda 1 ay boyunca resmi partnerlik',
    tlPrice: 350,
    robuxPrice: 20000
  }
];

/**
 * Tek bir paketin zenginleştirilmiş sayfa embed'ini oluşturur (İki Seviyeli İndirim Çapası ve Canlı Akış ile).
 */
function buildPackagePageEmbed(index) {
  const total = REKLAM_PACKAGES.length;
  const safeIdx = Math.max(0, Math.min(index, total - 1));
  const pkg = REKLAM_PACKAGES[safeIdx];

  const featureList = pkg.features.map(f => `  ✅ ${f}`).join('\n');
  const slotText = `⚠️ **BU HAFTALIK KALAN KONTENJAN:** 🔴 **${pkg.remainingSlots} / ${pkg.maxSlots} Slot** *(Tükenmek Üzere!)*`;
  const liveFeed = getLiveActivityFeedText();

  const embed = new EmbedBuilder()
    .setTitle(`${pkg.emoji} ${pkg.title}`)
    .setDescription(
      `🏷️ **Paket Kodu:** \`${pkg.id}\` | 📂 **Kategori:** ${pkg.category}\n` +
      `🏅 **Rozet:** \`${pkg.badge}\`\n` +
      `⏳ ${slotText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 **FİYAT ÇAPASI VE SEÇENEKLER (SADECE İTEMSATIŞ):**\n` +
      `> 🎯 **1x Tek Seferlik Yayın:** ~~${pkg.regularPrice}~~ ➔ **${pkg.discountPrice}** *(%60 Fırsat İndirimi)* 🟢\n` +
      `> 💎 **3x Çoklu Yayın Paketi:** **${pkg.multiPackPrice}** *(Ekstra %30 Tasarruf!)* ⭐\n` +
      `> 🪙 **Robux ile Ödeme:** ~~${pkg.regularRobux}~~ ➔ **${pkg.discountRobux}** ⚠️ *(Komisyonlar Dahil)*\n` +
      `> 🚀 *Fast-Track: Sadece +40 TL farkla 24 saat süper hızlı teslimat ve öncelikli sıra alabilirsiniz!*\n` +
      `> 🛡️ *Performans Güvencesi: Reklamınız hedeflenen minimum organik erişime ulaşmazsa ÜCRETSİZ telafi yayını yapılır!*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${liveFeed}\n\n` +
      `📝 **Paket Özeti:**\n*${pkg.summary}*\n\n` +
      `✨ **Neler Dahil? (Paket Kapsamı):**\n${featureList}\n\n` +
      `📊 **Tahmini Kitle Erişimi:**\n🔥 **${pkg.reach}**\n\n` +
      `🎯 **Kimler İçin İdeal?**\n💡 *${pkg.idealFor}*`
    )
    .setColor(pkg.color)
    .setFooter({
      text: `📦 Paket ${safeIdx + 1} / ${total} • Kalan Kontenjan: ${pkg.remainingSlots} • Sadece İtemSatış`,
      iconURL: 'https://i.imgur.com/bWvBM0N.png'
    })
    .setTimestamp();

  return embed;
}

/**
 * Roblox & Discord Kamp Kurulum Hizmetleri Veritabanı
 */
const KAMP_SERVICES = [
  {
    id: 'kamp_ana_brans',
    code: 'kamp_ana_brans',
    title: '🏰 Ana & Branş Sunucu Kurulumu',
    regularPrice: '1.000 TL',
    discountPrice: '500 TL',
    robuxPrice: '22.000 Robux',
    desc: 'Ana & Branş sunucu mimarisi, yetki hiyerarşisi, kural & duyuru estetiği. (+90 TL Webhook & İzin Şablonları)'
  },
  {
    id: 'kamp_birim_odalar',
    code: 'kamp_birim_odalar',
    title: '🏛️ Birim & Departman Odaları Paketi',
    regularPrice: '600 TL',
    discountPrice: '450 TL',
    robuxPrice: '19.500 Robux',
    desc: 'Özel birlik/departman ses & metin kanalları, gizli operasyon odaları. (+350 TL RoWifi, +50 TL Webhook Form)'
  },
  {
    id: 'kamp_panel_yonetim',
    code: 'kamp_panel_yonetim',
    title: '⚡ Eko Yıldız Paneli Rütbe & Alım Sistemi (Ömür Boyu)',
    regularPrice: '600 TL',
    discountPrice: '300 TL',
    robuxPrice: '13.500 Robux',
    desc: 'Eko Yıldız Panel Entegreli Rütbe & Alım Yönetim Sistemi (7/24 Kesintisiz Ömür Boyu Aktif).'
  },
  {
    id: 'kamp_ozel_bot',
    code: 'kamp_ozel_bot',
    title: '🤖 Özel Kodlanmış Rütbe, Aktiflik & Log Botu',
    regularPrice: '1.500 TL',
    discountPrice: '750 TL',
    robuxPrice: '32.000 Robux',
    desc: 'Rütbe atlama, ses/yazı aktifliği, tüm denetim logları. (+300 TL Oyuna Girme Kayıtlarını Rütbe XP\'sine Dönüştürme)'
  },
  {
    id: 'kamp_gfx_tasarim',
    code: 'kamp_gfx_tasarim',
    title: '🎨 Stüdyo GFX Logo + Banner VIP Seti',
    regularPrice: '1.100 TL',
    discountPrice: '790 TL',
    robuxPrice: '34.500 Robux',
    desc: 'Stüdyo Kalite Logo (500 TL) + Özel Konsept Banner (500 TL) = Anında 310 TL Tasarrufla 790 TL!'
  },
  {
    id: 'kamp_full_bundle',
    code: 'kamp_full_bundle',
    title: '👑 %100 FULL LÜKS KAMP KURULUM SETİ (ALL-IN-ONE VIP BUNDLE)',
    regularPrice: '7.000 TL',
    discountPrice: '4.850 TL',
    robuxPrice: '198.000 Robux',
    desc: 'Tüm Sunucu Mimarisi + RoWifi + Birimler + Panel + 7/24 Bot + GFX Seti + KDV & Komisyon Dahil Anahtar Teslim!'
  }
];

/**
 * Kamp Kurulum Hizmetleri Embed'i
 */
function buildKampKurulumEmbed() {
  return new EmbedBuilder()
    .setTitle('🏰 EKO YILDIZ REKLAM SİSTEMLERİ — KAMPINIZ YOK MU YAPARIZ!')
    .setDescription(
      `*Normalde sadece reklamlar vardı ancak artık kampta yapıyoruz! Tamamen yüzde yüz Türk insanlar yapıyor. (Ara sıra demokratik Kongolu da.)*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 📊 HİZMET KALEMLERİ & VERGİLENDİRİLMİŞ LİSTE FİYATLARI:\n` +
      `• **🏰 Ana ve Branş Sunucuları:** 500 TL\n` +
      `• **🔗 Webhook & Kural Ek Paketi:** 90 TL\n` +
      `• **🏛️ Birim ve Departman Odaları:** 450 TL\n` +
      `• **🤖 RoWifi Tam Kurulumu:** 350 TL\n` +
      `• **📝 Webhook / Alım Formu / Dokümantasyon:** 50 TL\n` +
      `• **⚡ Eko Yıldız Paneli Rütbe & Alım Sistemi (Ömür Boyu):** 300 TL\n` +
      `• **🛡️ Özel Kodlanmış Rütbe, Aktiflik & Log Botu:** 750 TL\n` +
      `• **🎨 Stüdyo GFX Logo + Banner VIP Seti:** 790 TL\n` +
      `• **🧾 Yasal KDV (%20) + İtemSatış Platform Komisyonu & Güvenlik:** 3.720 TL\n` +
      `> ❌ **Tek Tek Alım Genel Liste Değeri (Her Şey Dahil):** ~~7.000 TL~~\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 👑 %100 FULL LÜKS KAMP KURULUM SETİ (ALL-IN-ONE VIP BUNDLE)\n` +
      `Tüm sunucu mimarisi, bot yazılımları, yönetim panelleri ve profesyonel grafik tasarımları tek bir anahtar teslim pakette birleştirildi. Yasal vergiler, platform komisyonları ve tam altyapı maliyeti paket fiyatına yedirildi.\n\n` +
      `💰 **Tek Tek Alım Değeri:** ~~7.000 TL~~\n` +
      `🟢 **Paket Kampanya Fiyatı:** **4.850 TL** *(%20 KDV ve İtemSatış Komisyonları Dahildir — Net 2.150 TL Tasarruf!)*\n\n` +
      `✨ **Paket Kapsamı (Anahtar Teslim):**\n` +
      `• 🏰 **Tam Mimarili Ana & Branş Sunucu Kurulumu:** Webhook bildirimleri, kural setleri ve profesyonel yetki ağacı\n` +
      `• 🏢 **Birim & Departman Sunucuları:** Gelişmiş kanal düzeni, webhook alım formları ve operasyon dokümantasyonu\n` +
      `• 🤖 **RoWifi Tam Entegrasyonu:** Otomatik grup, rol ve rütbe eşitleme altyapısı\n` +
      `• ⚙️ **Eko Yıldız Panel Entegrasyonu:** 7/24 kesintisiz, ömür boyu rütbe ve alım yönetim sistemi\n` +
      `• 🛡️ **Özel Kodlanmış Rütbe, Aktiflik & Log Botu:** Sunucunuza özel bağımsız çalışan eşsiz denetim mimarisi\n` +
      `• 🎨 **Stüdyo Kalite GFX Paketi:** Özel konsept Discord & Roblox Logo + Banner seti\n` +
      `• 🧾 **%100 Güvenli Ödeme & Yasal Güvence:** İtemSatış 3D Secure güvencesi, yasal KDV ve resmi işlem garantisi\n` +
      `• 🚀 **Öncelikli Teslimat:** 24–48 saatte tam teslim + 7 Gün VIP Birebir Teknik Destek\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *Sıfır teknik bilgiyle grubunuzu Roblox ekosisteminin en prestijli, hatasız ve tam otomatik kampı haline getirin!*`
    )
    .setColor(0xF1C40F)
    .setFooter({ text: 'Eko Yıldız Full Lüks Kamp Mimarlık & Bot Departmanı • Sadece İtemSatış' })
    .setTimestamp();
}

/**
 * Kamp Kurulum Hizmetleri Sipariş Butonları
 */
function buildKampBrowserComponents(ticketId = 'general') {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_buy_pkg_kamp_full_${ticketId}`)
      .setLabel('👑 Full Lüks VIP Bundle (4.850 TL)')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🏆'),
    new ButtonBuilder()
      .setCustomId(`reklam_buy_pkg_kamp_bot_${ticketId}`)
      .setLabel('🤖 7/24 Log & Rütbe Botu (750 TL)')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('⚡'),
    new ButtonBuilder()
      .setCustomId(`reklam_buy_pkg_kamp_gfx_${ticketId}`)
      .setLabel('🌟 VIP Logo+Banner (790 TL)')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎨')
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_buy_pkg_kamp_ana_${ticketId}`)
      .setLabel('🏰 Ana/Branş (500 TL)')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`reklam_buy_pkg_kamp_birim_${ticketId}`)
      .setLabel('🏛️ Birim Odaları (450 TL)')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`reklam_buy_pkg_kamp_panel_${ticketId}`)
      .setLabel('⚡ Panel Yönetim (300 TL)')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`reklam_browse_start_${ticketId}`)
      .setLabel('📦 Reklam Paketleri')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('↩️')
  );

  return [row1, row2];
}

/**
 * Sıra sıra gezinti için interaktif buton satırlarını oluşturur.
 */
function buildPackageBrowserComponents(currentIndex, ticketId = null) {
  const total = REKLAM_PACKAGES.length;
  const safeIdx = Math.max(0, Math.min(currentIndex, total - 1));
  const currentPkg = REKLAM_PACKAGES[safeIdx];

  const tId = ticketId || 'general';

  // Satır 1: Gezinme Butonları (Önceki, Sayfa, Sonraki, Satın Al)
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_nav_first_${tId}`)
      .setLabel('⏮️ İlk')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safeIdx === 0),
    new ButtonBuilder()
      .setCustomId(`reklam_nav_prev_${safeIdx}_${tId}`)
      .setLabel('◀️ Önceki')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(safeIdx === 0),
    new ButtonBuilder()
      .setCustomId(`reklam_nav_pageinfo_${safeIdx}_${tId}`)
      .setLabel(`${safeIdx + 1} / ${total}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`reklam_nav_next_${safeIdx}_${tId}`)
      .setLabel('Sonraki ▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(safeIdx === total - 1),
    new ButtonBuilder()
      .setCustomId(`reklam_nav_last_${tId}`)
      .setLabel('⏭️ Son')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safeIdx === total - 1)
  );

  // Satır 2: Satın Alma ve Hızlı Aksiyon Butonları
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_buy_pkg_${currentPkg.id}_${tId}`)
      .setLabel(`🛒 Satın Al (${currentPkg.discountPrice})`)
      .setStyle(ButtonStyle.Success)
      .setEmoji('🛍️'),
    new ButtonBuilder()
      .setCustomId(`reklam_builder_open_${tId}`)
      .setLabel('🎯 Kendi Paketini Oluştur')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🛠️'),
    new ButtonBuilder()
      .setCustomId(`reklam_view_guarantee_${tId}`)
      .setLabel('🛡️ Erişim Sigortası')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId(`reklam_view_flash_deal_${tId}`)
      .setLabel('⚡ Flaş Fırsat (Hediye)')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🎁')
  );

  // Satır 3: Gamification & İkna Butonları (Şans Çarkı, Grup Analizi, Örnekler, Hediyeler)
  const promoRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_spin_wheel_${tId}`)
      .setLabel('🎰 Şans Çarkı')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🎁'),
    new ButtonBuilder()
      .setCustomId(`reklam_group_audit_${tId}`)
      .setLabel('📊 Grup Büyüme Raporu')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📈'),
    new ButtonBuilder()
      .setCustomId(`reklam_view_samples_${tId}`)
      .setLabel('🎬 Örnek Çalışmalar')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎙️'),
    new ButtonBuilder()
      .setCustomId(`reklam_view_milestones_${tId}`)
      .setLabel('🏆 Hediye Merdiveni')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('✨'),
    new ButtonBuilder()
      .setCustomId(`reklam_fast_track_${tId}`)
      .setLabel('🚀 24s Hızlı Sıra')
      .setStyle(ButtonStyle.Secondary)
  );

  // Satır 4: Hızlı Açılır Menü (Dropdown ile anında istenen pakete atlama)
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`reklam_quick_jump_${tId}`)
    .setPlaceholder('🚀 İstediğiniz pakete doğrudan atlayın...')
    .addOptions(
      REKLAM_PACKAGES.map((p, i) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${p.title} (${p.discountPrice} / ${p.discountRobux})`)
          .setDescription(`🔴 Kalan: ${p.remainingSlots} Slot • Sadece İtemSatış`)
          .setValue(`jump_${i}`)
          .setEmoji(p.emoji)
          .setDefault(i === safeIdx)
      )
    );

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);

  return [navRow, actionRow, promoRow, selectRow];
}

/**
 * Anti-Risk Performans Garantisi & Erişim Sigortası Embed'i
 */
function buildAntiRiskGuaranteeEmbed() {
  return new EmbedBuilder()
    .setTitle('🛡️ %100 ANTİ-RİSK PERFORMANS VE ERİŞİM SİGORTASI')
    .setDescription(
      `Eko Yıldız olarak paranızın ve emeğinizin karşılığını %100 garanti altına alıyoruz. Riskleri tamamen üzerimize alıyoruz!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 1️⃣ 🎯 ERİŞİM & ETKİLEŞİM SİGORTASI:\n` +
      `> Satın aldığınız paket tahmini minimum izlenme veya kitle etkileşimine ulaşmazsa, bir sonraki ana videomuzda **HİÇBİR EK ÜCRET TALEP EDİLMEDEN %100 ÜCRETSİZ** telafi reklamı yayınlanır!\n\n` +
      `### 2️⃣ 🔒 İTEMSATIŞ HAVUZ GÜVENCESİ:\n` +
      `> Sipariş tutarınız, reklamınız yayına girip link ve raporları tarafınıza teslim edilene kadar **İtemSatış Güvence Havuzu**'nda korunur. Onayınız olmadan bakiye aktarılmaz.\n\n` +
      `### 3️⃣ 🎬 %100 MEMNUNİYET & SINIRSIZ REVİZE:\n` +
      `> Hazırlanan seslendirme, reklam görseli veya video kurgusu yayından önce onayınıza sunulur. Beğenmediğiniz kısımlar yayından önce **ücretsiz olarak baştan revize edilir**.\n\n` +
      `### 4️⃣ 📊 ŞEFFAF ANALİTİK RAPORU:\n` +
      `> Yayınlandıktan sonra YouTube Studio gerçek izleyici, tıklama ve demografi grafikleri tarafınızla paylaşılır.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ *Sıfır risk, maksimum dönüşüm. Reklamınız boşa gitmez, garantili büyürsünüz!*`
    )
    .setColor(0x2ECC71)
    .setFooter({ text: 'Eko Yıldız Anti-Risk Sigorta Poliçesi • %100 Güvenli Yatırım' })
    .setTimestamp();
}

/**
 * Bot İçi Dinamik "Flash Deal" (Geri Sayımlı Hediye Kuponu) Embed'i
 */
function buildFlashDealEmbed(ticketId = 'general') {
  const expiresTimestamp = Math.floor(Date.now() / 1000) + 900; // 15 minutes
  const embed = new EmbedBuilder()
    .setTitle('⚡ ANİ FLAŞ FIRSAT: 80 TL DEĞERİNDE ANKET HEDİYE!')
    .setDescription(
      `🎉 **TEBRİKLER! ÖZEL KAMPANYA KUPONU KAZANDINIZ!**\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎁 **HEDİYE İÇERİĞİ:**\n` +
      `Şimdi sipariş verirseniz, seçtiğiniz herhangi bir paketin yanında **80 TL değerindeki YouTube Topluluk Anketi & Görsel Tanıtımı HEDİYE** edilecektir!\n\n` +
      `🏷️ **Flaş Kupon Kodu:** \`EKO-VIP-HEDIYE\`\n` +
      `⏳ **Kalan Süre:** <t:${expiresTimestamp}:R> *(15 Dakika İçinde Geçerlidir)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Fırsatı kaçırmadan hemen İtemSatış sipariş formunuzu doldurabilirsiniz:`
    )
    .setColor(0xE74C3C)
    .setFooter({ text: 'Eko Yıldız Flaş Fırsat Kulübü • Sınırlı Süreli Kupon' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_buy_pkg_pkg_advantaged_${ticketId}`)
      .setLabel('🎁 Hediyeli Flaş Fırsatı Kullan (100 TL)')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🛍️'),
    new ButtonBuilder()
      .setCustomId(`reklam_browse_start_${ticketId}`)
      .setLabel('📦 Tüm Paketleri İncele')
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, components: [row] };
}

/**
 * YouTube Studio Kitle Analitiği Raporu (Kurumsal İkna)
 */
function buildAudienceAnalyticsEmbed() {
  return new EmbedBuilder()
    .setTitle('📈 YOUTUBE STUDIO KİTLE ANALİTİĞİ VE ALIM GÜCÜ RAPORU')
    .setDescription(
      `Eko Yıldız izleyicilerinin en güncel YouTube Studio verileri ve demografik alım gücü analizi:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👥 **ALIM GÜCÜ & OYUNCU PROFİLİ:**\n` +
      `> 💳 **%88 Aktif Robux Harcayan Kitle:** İzleyicilerimizin ezici çoğunluğu Roblox Gamepass, kıyafet ve grup ürünleri satın alan doğrudan oyuncu kitlesidir.\n` +
      `> 🎯 *Vurgu: Boş veya ölü kitleye değil, doğrudan cüzdanı olan aktif oyunculara harcama yaparsınız!*\n\n` +
      `⏰ **EN ZİRVE AKTİFLİK VE İZLENME SAATLERİ:**\n` +
      `> • **Hafta İçi:** 16:30 - 22:30 *(Okul/İş çıkışı zirve saatler)*\n` +
      `> • **Hafta Sonu:** 11:30 - 23:30 *(Kesintisiz 12 saatlik rekor etkileşim)*\n` +
      `> 🚀 *Tüm videolarımız bu zirve saatlerde yayınlanarak maksimum anlık tıklama hedeflenir.*\n\n` +
      `📱 **CİHAZ VE ERİŞİM DAĞILIMI:**\n` +
      `> • **%74 Mobil (Telefon/Tablet):** Tek tıkla Roblox grubuna, YouTube linkine veya Discord davetine anında katılım avantajı.\n` +
      `> • **%26 PC / Konsol:** Oyun içi aktif kullanıcılar.\n\n` +
      `📊 **İZLENME SADAKATİ (RETENTION):**\n` +
      `> • Ortalama Video Tamamlama Oranı: **%68.4** *(Sektör ortalaması %42)*\n` +
      `> • Yorum & Beğeni Oranı: İzleyici başına **3.4 kat** daha yüksek etkileşim!`
    )
    .setColor(0x3498DB)
    .setFooter({ text: 'Eko Yıldız Doğrulanmış YouTube Studio Verileri • %100 Şeffaf Analitik' })
    .setTimestamp();
}

/**
 * Müşteri İncelemeleri & Sosyal Kanıt Vitrini (Social Proof & Reviews)
 */
function buildCustomerReviewsEmbed() {
  return new EmbedBuilder()
    .setTitle('⭐ MÜŞTERİ YORUMLARI VE KANITLANMIŞ DÖNÜŞÜMLER')
    .setDescription(
      `Eko Yıldız ile çalışan reklam verenlerin gerçek deneyimleri ve elde ettikleri rekor sonuçlar:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⭐⭐⭐⭐⭐ **@VortexStudiosTR — Roblox Oyun Geliştiricisi**\n` +
      `> *"Avantajlı Mid-Roll paketini aldık. Video yayınlandıktan 3 saat sonra Roblox oyunumuz trendlere girdi ve +1.450 yeni aktif oyuncu kazandık! Kesinlikle harcanan her kuruşa değdi."*\n\n` +
      `⭐⭐⭐⭐⭐ **@KaanGamer — Discord Topluluk Sahibi**\n` +
      `> *"Mega Etkileşim Paketi sayesinde sunucumuza 3 günde 900+ organik üye katıldı. Bot basan yayıncılar gibi değil, kitle gerçekten aktif ve sohbete katılıyor. Emre Bey'e ilgisi için teşekkürler."*\n\n` +
      `⭐⭐⭐⭐⭐ **@BloxTownTR — Roblox Grup Yöneticisi**\n` +
      `> *"9.800 Robux çekilişli VIP Paketi aldık. Grubumuz 2.800 üyeyi aştı. İtemSatış'tan 5 dakikada ödemeyi yaptık, ertesi gün video hazırdı. 10/10 hizmet!"*\n\n` +
      `⭐⭐⭐⭐⭐ **@NexusProject — Yazılım & Bot Geliştiricisi**\n` +
      `> *"Stüdyo kalitesinde kurgu ve seslendirme yaptılar. Kendi hazırladığımız metni çok daha heyecanlı ve profesyonel seslendirdiler. Dönüşüm oranımız %340 arttı."*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 **Ortalama Memnuniyet Oranı:** %99.2 • **Tekrar Tercih Edenler:** %87`
    )
    .setColor(0xF1C40F)
    .setFooter({ text: 'Eko Yıldız Sosyal Kanıt Raporu • %100 Doğrulanmış Müşteri İncelemeleri' })
    .setTimestamp();
}

/**
 * Cross-Sell & Upsell Fırsat Teklifi Embed'i
 */
function buildUpsellOfferEmbed(originalPkg, upsellPkg, ticketId = 'general') {
  const embed = new EmbedBuilder()
    .setTitle('🎁 SİZE ÖZEL ANLIK SEPET YÜKSELTMESİ (UPSELL FIRSATI)')
    .setDescription(
      `Tebrikler! **${originalPkg.title}** siparişinizi hazırlarken size özel tek seferlik bir fırsat tanımlandı!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔥 **FIRSAT TEKLİFİ:**\n` +
      `> **${originalPkg.upsellNotice}**\n\n` +
      `📦 **Yükseltilecek Paket:** **${upsellPkg.title}**\n` +
      `> ❌ Normal Fiyatı: ~~${upsellPkg.regularPrice}~~ (${upsellPkg.regularRobux})\n` +
      `> 🟢 **Teklife Özel Fiyat:** **${upsellPkg.discountPrice}** *(Sadece +${parseInt(upsellPkg.discountPrice) - parseInt(originalPkg.discountPrice)} TL farkla!)*\n\n` +
      `✨ **Ekstra Kazanacaklarınız:**\n` +
      upsellPkg.features.map(f => `  ➕ ${f}`).join('\n') + `\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Aşağıdaki butonlardan tercihinizi yaparak İtemSatış sipariş formunuza devam edebilirsiniz:`
    )
    .setColor(0xE67E22)
    .setFooter({ text: 'Eko Yıldız Özel Fırsat Kulübü • Sınırlı Süreli Upsell' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_upsell_accept_${originalPkg.id}_${upsellPkg.id}_${ticketId}`)
      .setLabel(`🚀 Evet! ${upsellPkg.title} Paketi ile Devam Et`)
      .setStyle(ButtonStyle.Success)
      .setEmoji('🎉'),
    new ButtonBuilder()
      .setCustomId(`reklam_upsell_decline_${originalPkg.id}_${ticketId}`)
      .setLabel(`↩️ Hayır, ${originalPkg.discountPrice} ile Devam Et`)
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [row] };
}

/**
 * Kendi Paketini Oluştur (Custom Package Builder) Ekranı ve Bileşenleri
 */
function buildCustomBuilderComponents(selectedModuleIds = [], ticketId = 'general') {
  let totalTl = 0;
  let totalRobux = 0;

  const selectedModules = CUSTOM_BUILDER_MODULES.filter(m => selectedModuleIds.includes(m.id));
  for (const mod of selectedModules) {
    totalTl += mod.tlPrice;
    totalRobux += mod.robuxPrice;
  }

  // Minimum base
  if (selectedModules.length === 0) {
    totalTl = 30;
    totalRobux = 2400;
  }

  const fakeRegularTl = Math.round(totalTl * 2.2);
  const fakeRegularRobux = Math.round(totalRobux * 1.9);

  let desc = 
    `🛠️ **REKLAM VE SPONSORLUK ÖZELLİK SEÇİM SİHİRBAZI**\n` +
    `Paketinizde yer almasını istediğiniz özellikleri aşağıdaki menüden seçerek **kendi bütçenize ve hedefinize özel reklam paketinizi** oluşturabilirsiniz!\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 **SEÇİLEN ÖZELLİKLER:**\n`;

  if (selectedModules.length === 0) {
    desc += `> *(Henüz bir özellik seçmediniz. Aşağıdaki menüden 1 veya birden fazla özellik seçin.)*\n`;
  } else {
    for (const mod of selectedModules) {
      desc += `> ✅ **${mod.label}:** +${mod.tlPrice} TL *(🪙 ${mod.robuxPrice} Robux)*\n`;
    }
  }

  desc += 
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 **CANLI HESAPLANAN ÖZEL PAKET TUTARINIZ:**\n` +
    `> 🎯 **1x Tek Seferlik:** ~~${fakeRegularTl} TL~~ ➔ **${totalTl} TL** *(%55 Özel Paket İndirimi)* 🟢\n` +
    `> 💎 **3x Çoklu Yayın Paketi:** **${Math.round(totalTl * 2.3)} TL** *(Video başı %30 daha karlı!)* ⭐\n` +
    `> 🪙 **Robux Fiyatı:** ~~${fakeRegularRobux} Robux~~ ➔ **${totalRobux} Robux** ⚠️ *(Komisyonlar Dahil)*\n\n` +
    `🛡️ *Tüm ödemeler SADECE İTEMSATIŞ üzerinden güvenceyle alınır. Seçiminizi tamamlayınca aşağıdaki butondan siparişinizi oluşturun.*`;

  const embed = new EmbedBuilder()
    .setTitle('🎯 KENDİ REKLAM PAKETİNİ OLUŞTUR (ÖZELLİK SİHİRBAZI)')
    .setDescription(desc)
    .setColor(0x9B59B6)
    .setFooter({ text: 'Eko Yıldız İnteraktif Reklam Sihirbazı • Sadece İtemSatış' })
    .setTimestamp();

  // Multi-Select menu to toggle features
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`reklam_builder_select_${ticketId}`)
    .setPlaceholder('📦 Paketinizde olmasını istediğiniz özellikleri seçin...')
    .setMinValues(1)
    .setMaxValues(CUSTOM_BUILDER_MODULES.length)
    .addOptions(
      CUSTOM_BUILDER_MODULES.map(m =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${m.label} (+${m.tlPrice} TL)`)
          .setDescription(`${m.desc} • 🪙 ${m.robuxPrice} R$`)
          .setValue(m.id)
          .setDefault(selectedModuleIds.includes(m.id))
      )
    );

  const row1 = new ActionRowBuilder().addComponents(selectMenu);

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_builder_buy_${ticketId}_${selectedModuleIds.join('-') || 'default'}`)
      .setLabel(`🛒 Bu Özel Paketi Satın Al (${totalTl} TL / ${totalRobux} Robux)`)
      .setStyle(ButtonStyle.Success)
      .setEmoji('🛍️'),
    new ButtonBuilder()
      .setCustomId(`reklam_browse_start_${ticketId}`)
      .setLabel('📦 Hazır Paketlere Dön')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('↩️'),
    new ButtonBuilder()
      .setCustomId(`reklam_view_guarantee_${ticketId}`)
      .setLabel('🛡️ Erişim Sigortası')
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, components: [row1, row2] };
}

/**
 * Tüm paketlerin karşılaştırmalı özet tablosunu oluşturur.
 */
function buildAllPackagesSummaryEmbed() {
  let desc = 
    `🌟 **Eko Yıldız Sponsorluk ve Reklam Paketleri Özeti**\n` +
    `*Bütçenize ve hedefinize en uygun paketi seçerek doğrudan binlerce oyuncuya ulaşabilirsiniz.*\n\n` +
    `🔥 **GÜNCEL KAMPANYA:** Aşağıdaki tüm paketlerimizde **%50 ile %60 arasında indirim** uygulanmıştır!\n\n`;

  for (let i = 0; i < REKLAM_PACKAGES.length; i++) {
    const p = REKLAM_PACKAGES[i];
    desc += `### ${i + 1}. ${p.emoji} ${p.title}\n`;
    desc += `> 🎯 **1x Fiyat:** ~~${p.regularPrice}~~ ➔ **${p.discountPrice}** | 💎 **3x Paket:** **${p.multiPackPrice}**\n`;
    desc += `> 🪙 **Robux Fiyatı:** ~~${p.regularRobux}~~ ➔ **${p.discountRobux}** *(Komisyon Dahil)*\n`;
    desc += `> 🔴 **Kalan Slot:** ${p.remainingSlots}/${p.maxSlots} • 📊 Erişim: **${p.reach}**\n\n`;
  }

  desc += 
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🛡️ **ÖDEME GÜVENCESİ:** Tüm siparişlerin ödemesi **SADECE İTEMSATIŞ** üzerinden güvenle alınmaktadır.\n` +
    `⚠️ **Komisyon Uyarısı:** Robux ödemelerinde Roblox kesintisi ve transfer komisyonu alıcıya ait olduğundan Robux fiyatı normal TL'ye göre belirgin şekilde yüksektir. TL ile ödeme tavsiye edilir.`;

  return new EmbedBuilder()
    .setTitle('📋 TÜM REKLAM VE SPONSORLUK PAKETLERİ KARŞILAŞTIRMASI')
    .setDescription(desc)
    .setColor(0x2ECC71)
    .setFooter({ text: 'Eko Yıldız Reklam Departmanı • Sadece İtemSatış Güvencesi' })
    .setTimestamp();
}

/**
 * Eko Yıldız Kalite & Güvence Farkı Embed'i
 */
function buildQualityGuaranteeEmbed() {
  return new EmbedBuilder()
    .setTitle('💎 EKO YILDIZ KALİTE VE PRESTİJ STANDARTLARI')
    .setDescription(
      `Piyasadaki baştan savma, kalitesiz ve bot basan içerik üreticilerinin aksine; **Eko Yıldız** her sponsora ve reklam verene VIP stüdyo kalitesinde, garantili ve profesyonel hizmet sunar.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🚫 PİYASADAKİ SIRADAN & ÖZENSİZ YAYINCILAR:\n` +
      `• ❌ Kötü mikrofon, kekeleyerek ve isteksizce yapılan 5 saniyelik geçiştirme reklamlar\n` +
      `• ❌ Videonun sonuna kimsenin izlemediği ölü noktalara atılan işlevsiz tanıtımlar\n` +
      `• ❌ Sahte/bot izleyiciler, sıfır gerçek üye ve boşa giden paranız\n` +
      `• ❌ Parayı aldıktan sonra cevap vermeyen, ilgisiz ve kaba yayıncılar\n\n` +
      `### 🌟 EKO YILDIZ VIP KALİTE FARKI VE GARANTİSİ:\n` +
      `• 🎬 **Stüdyo Kalitesinde Kurgu & Montaj:** Reklamınız videoya dinamik efektler, görsel zenginlik ve profesyonel akışla yedirilir.\n` +
      `• 🎙️ **Kristal Netliğinde Profesyonel Seslendirme:** İzleyicinin merakını uyandıran, heyecanlı ve akıcı ses tonuyla doğrudan harekete geçirici çağrı (CTA).\n` +
      `• 👥 **%100 Gerçek, Canlı & Sadık Kitle:** Bot veya sahte tıklama yok! Gerçek Roblox ve oyun oyuncularından oluşan sadık topluluk.\n` +
      `• 🏆 **Çok Yönlü Entegrasyon:** Video içi tanıtım + Açıklama linki + Sabitlenmiş yorum + YouTube Topluluk + Discord Duyurusu ile 360° dönüşüm gücü.\n` +
      `• 🛡️ **SADECE İTEMSATIŞ Güvencesi & Birebir Danışmanlık:** Ödemeler %100 güvence altında İtemSatış üzerinden tamamlanır.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ *Kalite asla tesadüf değildir. Eko Yıldız ile çalışın, markanızı ve topluluğunuzu hak ettiği zirveye taşıyın!*`
    )
    .setColor(0xF1C40F)
    .setFooter({ text: 'Eko Yıldız Kalite & Güvence Belgesi • %100 Organik & Prestijli Sponsorluk' })
    .setTimestamp();
}

/**
 * %60 indirim fırsatları ve günün fırsatı vitrini
 */
function buildCampaignDealsEmbed() {
  return new EmbedBuilder()
    .setTitle('🔥 GÜNÜN FIRSATLARI & %60 DEV İNDİRİM VİTRİNİ')
    .setDescription(
      `⚡ **SINIRLI SÜRELİ SEZON İNDİRİMİ BAŞLADI!**\n\n` +
      `Reklam verenlerimizin ve yeni toplulukların büyümesini desteklemek adına tüm popüler paketlerimizde **%60'a varan indirim** uygulandı!\n\n` +
      `🏆 **GÜNÜN EN ÇOK SATAN FIRSATLARI (İTEMSATIŞ):**\n\n` +
      `1️⃣ **Avantajlı Uzun Video (Mid-Roll Sesli):**\n` +
      `> 🎯 Tekli: ~~250 TL~~ ➔ **100 TL** | 💎 3x Paket: **220 TL**\n` +
      `> 🪙 **Robux:** ~~12.000 Robux~~ ➔ **6.800 Robux** | 🔴 Kalan: 1/3 Slot\n\n` +
      `2️⃣ **Mega Etkileşim Paketi (360° Reklam):**\n` +
      `> 🎯 Tekli: ~~1.250 TL~~ ➔ **500 TL** | 💎 3x Paket: **1.100 TL**\n` +
      `> 🪙 **Robux:** ~~36.000 Robux~~ ➔ **19.800 Robux** | 🔴 Kalan: 2/3 Slot\n\n` +
      `3️⃣ **Çekilişli VIP Paket (9.800 Robux Çekilişi):**\n` +
      `> 🎯 Tekli: ~~1.490 TL~~ ➔ **670 TL** | 💎 2x Paket: **1.450 TL**\n` +
      `> 🪙 **Robux:** ~~48.000 Robux~~ ➔ **26.500 Robux** | 🔴 Kalan: 1/2 Slot\n\n` +
      `4️⃣ **Shorts Paketi:**\n` +
      `> 🎯 Tekli: ~~75 TL~~ ➔ **30 TL** | 💎 3x Paket: **65 TL**\n` +
      `> 🪙 **Robux:** ~~4.500 Robux~~ ➔ **2.400 Robux** | 🔴 Kalan: 1/3 Slot\n\n` +
      `💡 *Ödemeler SADECE İTEMSATIŞ üzerinden yapılmaktadır. İndirimden yararlanmak için hemen satın alma butonunu kullanabilirsiniz.*`
    )
    .setColor(0xE74C3C)
    .setFooter({ text: 'Eko Yıldız Fırsat Kulübü • Sınırlı Süreli Kampanya' })
    .setTimestamp();
}

/**
 * T.C. Yasal Vergileri ve %100 Eko Yıldız Vergi Muafiyeti / Karşılama Embed'i
 */
function buildTaxReliefGuaranteeEmbed() {
  return new EmbedBuilder()
    .setTitle('🏛️ T.C. YASAL VERGİLERİ VE %100 EKO YILDIZ VERGİ KARŞILAMA GÜVENCESİ')
    .setDescription(
      `Türkiye Cumhuriyeti vergi mevzuatı uyarınca dijital reklam, yayıncılık ve sponsorluk hizmetlerine uygulanan yasal vergi yükümlülükleri ve Eko Yıldız güvencesi:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 📊 T.C. RESMİ DİJİTAL HİZMET VERGİ TABLOSU:\n` +
      `• 🏛️ **Katma Değer Vergisi (KDV - %20):** Normalde faturaya eklenen yasal satış vergisi\n` +
      `• 💻 **Dijital Hizmet Vergisi (DHV - %7.5):** 7194 Sayılı Kanun kapsamındaki dijital reklam yayınlama vergisi\n` +
      `• 📋 **Stopaj & Gelir Vergisi Kesintisi (%15):** Reklam ve telif ödemeleri stopaj yükümlülüğü\n` +
      `• 📜 **Damga Vergisi & Banka Muameleleri (BSMV - %5):** Resmi sözleşme ve işlem vergisi\n` +
      `> ⚠️ **TOPLAM YASAL VERGİ YÜKÜ:** **+%47.5**\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🎁 EKO YILDIZ'DAN SİZE %100 VERGİ KARŞILAMA JESTİ:\n` +
      `> 💥 **MÜJDE:** Normalde müşteriye yansıtılması gereken **bu %47.5'lik TÜM VERGİLERİ (KDV, DHV, Stopaj ve Damga Vergisi) TAMAMEN BİZ CEBİMİZDEN KARŞILIYORUZ!**\n` +
      `> 🟢 **Sizden 1 Kuruş Bile Ekstra Vergi Alınmaz!** Ekranda gördüğünüz indirimli İtemSatış fiyatı neyse, sadece o net tutarı ödersiniz. Şirketimiz tüm yasal beyanname ve vergileri kendi bünyesinde öder.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛡️ *Sıfır ek maliyet, net fiyat garantisi! Güvenle İtemSatış üzerinden siparişinizi tamamlayabilirsiniz.*`
    )
    .setColor(0x2ECC71)
    .setFooter({ text: 'Eko Yıldız Mali Müşavirlik & Finans Güvencesi • Sadece İtemSatış' })
    .setTimestamp();
}

/**
 * Canlı Satın Alma Akışı (Live Activity Feed)
 */
function getLiveActivityFeedText() {
  const buyers = ['@Berke***', '@Kaan***', '@Yigit***', '@Alp***', '@Emir***', '@Arda***', '@Mert***', '@Burak***'];
  const packages = [
    'Avantajlı Mid-Roll (100 TL)',
    'Shorts Hızlı Paket (30 TL)',
    'Full VIP Mega Kombo (600 TL)',
    'Gold Kombin Paket (350 TL)',
    'Full Lüks Kamp Seti (4.850 TL)',
    'Özel Video Çekimi (450 TL)'
  ];
  const minutesAgo = Math.floor(Math.random() * 25) + 4;
  const count = Math.floor(Math.random() * 3) + 2;
  const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
  const randomPkg = packages[Math.floor(Math.random() * packages.length)];
  return `🔥 **Canlı Sipariş Akışı:** Son 2 saatte **${count} kişi** sipariş verdi! *(Son alım: ${minutesAgo} dk önce ${randomBuyer} ➔ '${randomPkg}')*`;
}

/**
 * Çok Aşamalı "Tiered Milestone" İndirimi & Hediye Merdiveni
 */
function buildTieredMilestonesEmbed(ticketId = 'general') {
  return new EmbedBuilder()
    .setTitle('🏆 ÇOK AŞAMALI SEPET MERDİVENİ & EKSTRA HEDİYELER')
    .setDescription(
      `Sipariş tutarınız arttıkça anında kazandığınız ücretsiz ek hediyeler ve avantajlar:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🥉 **1. SEVİYE (300 TL ve Üzeri Siparişlerde):**\n` +
      `• 🎁 **+1 Adet YouTube Shorts Reklamı Hediye!** *(50 TL Değerinde)*\n` +
      `• ⚡ Öncelikli Kurgu & Yayın Sırası\n\n` +
      `🥈 **2. SEVİYE (600 TL ve Üzeri Siparişlerde):**\n` +
      `• 🎁 **1 Hafta Boyunca Discord Sabit Sponsor Rolü & Kanalı Hediye!** *(200 TL Değerinde)*\n` +
      `• 📊 Detaylı YouTube Studio Tıklama ve Dönüşüm Analiz Raporu\n\n` +
      `🥇 **3. SEVİYE (1.000 TL ve Üzeri Siparişlerde):**\n` +
      `• 🎁 **Ekstra %10 Anında Nakit İndirim!**\n` +
      `• 👑 7/24 Kesintisiz Birebir VIP Müşteri Danışmanı Masası\n` +
      `• 🛡️ %100 Çift Kat Telafi & Erişim Sigortası\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *Birden fazla paketi veya Kamp Kurulum hizmetlerini birleştirerek anında seviye atlayabilirsiniz!*`
    )
    .setColor(0xF1C40F)
    .setFooter({ text: 'Eko Yıldız Milestone Kulübü • Sadece İtemSatış' })
    .setTimestamp();
}

/**
 * Örnek Çalışma & Kalite Vitrini (Audio / Video Preview Showcase)
 */
function buildSamplesShowcaseEmbed(ticketId = 'general') {
  return new EmbedBuilder()
    .setTitle('🎬 ÖRNEK ÇALIŞMA VİTRİNİ & SES/VİDEO KALİTE STANDARDI')
    .setDescription(
      `Eko Yıldız güvencesiyle hazırlanan önceki sponsorluk ve reklam çalışmalarımızın standartları:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎙️ **SES VE MİKROFON STANDARDI:**\n` +
      `• Kristal netliğinde stüdyo mikrofonu, dip ses ve yankı filtreli yayın kaydı.\n` +
      `• Heyecanlı, akıcı ve doğrudan oyuncuya hitap eden profesyonel seslendirme.\n\n` +
      `🎥 **1080p 60FPS STÜDYO KURGUSU:**\n` +
      `• 3D Motion grafikler, dikkat çekici alt bant animasyonları ve özel efektler.\n` +
      `• Videonun en kritik anında izleyiciyi sıkmadan merak uyandıran Mid-Roll geçişi.\n\n` +
      `🎨 **3D RENDER GFX TASARIM:**\n` +
      `• Kristal ışıklandırmalı, sinematik Discord logo ve banner çalışmaları.\n\n` +
      `📊 **GERÇEK SONUÇLAR:**\n` +
      `• Ortalama Tıklama Oranı (CTR): **%14.8** (Sektör ortalamasının 3 katı!)\n` +
      `• Tek videoda ortalama **+1.400 yeni üye** katılımı!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛡️ *Siz de aynı stüdyo kalitesinde profesyonel tanıtım almak için hemen siparişinizi başlatın.*`
    )
    .setColor(0x3498DB)
    .setFooter({ text: 'Eko Yıldız Prodüksiyon Stüdyosu • %100 Stüdyo Kalitesi' })
    .setTimestamp();
}

/**
 * 10 Dakikalık "Şans Çarkı / Fırsat Sandığı" Mini-Oyunu
 */
function buildSpinWheelEmbed(ticketId = 'general') {
  const prizes = [
    { title: '🎁 %10 Ekstra İtemSatış Nakit İndirimi', code: 'EKO-SANS-10', val: '%10 İndirim' },
    { title: '🎁 Ücretsiz YouTube Topluluk Anketi (80 TL Değerinde)', code: 'EKO-ANKET-BEDAVA', val: 'Ücretsiz Anket' },
    { title: '🎁 Ücretsiz Sabitlenmiş Açıklama Linki (50 TL Değerinde)', code: 'EKO-PIN-LINK', val: 'Ücretsiz Pinned Link' },
    { title: '🚀 24 Saat Öncelikli Hızlı Teslimat Bileti (40 TL Değerinde)', code: 'EKO-FAST-VIP', val: 'Hızlı Sıra' }
  ];
  const wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
  const expireTimestamp = Math.floor(Date.now() / 1000) + (15 * 60);

  const embed = new EmbedBuilder()
    .setTitle('🎰 ŞANS ÇARKINI ÇEVİRDİNİZ VE KAZANDINIZ!')
    .setDescription(
      `Tebrikler! Eko Yıldız Şans Çarkı / Fırsat Sandığından size özel ödül çıktı!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎉 **KAZANDIĞINIZ ÖDÜL:**\n` +
      `> **${wonPrize.title}**\n\n` +
      `🔑 **Kupon Kodunuz:** \`${wonPrize.code}\`\n` +
      `⏳ **Kupon Geçerlilik Süresi:** <t:${expireTimestamp}:R> (Son 15 Dakika!)\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *Bu kupon kodunu sipariş formundaki "Sipariş Notu" alanına yazarak anında ödülünüzü hesabınıza tanımlatabilirsiniz!*`
    )
    .setColor(0xE74C3C)
    .setFooter({ text: 'Eko Yıldız Şans Çarkı • 15 Dakika Süreli Kupon' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_open_modal_general_${ticketId}`)
      .setLabel(`🚀 Kuponu Kullan (${wonPrize.code})`)
      .setStyle(ButtonStyle.Success)
      .setEmoji('🎁'),
    new ButtonBuilder()
      .setCustomId(`reklam_browse_start_${ticketId}`)
      .setLabel('📦 Paketleri İncele')
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, components: [row] };
}

/**
 * "Grup Sağlık & Potansiyel Büyüme Raporu" (Lead Magnet)
 */
function buildGroupAuditEmbed(range = '100_500', ticketId = 'general') {
  let rangeText = '100 - 500 Üye';
  let potential = '+1.200 - 1.800 Aktif Oyuncu';
  let recommendedPkg = 'Avantajlı Mid-Roll (100 TL) veya Gold Kombin (350 TL)';
  let conversionRate = '%38 - %45';
  let advice = 'Grubunuz başlangıç eşiğinde. Sesli Mid-Roll ve Topluluk Anketi ile ilk 1.000 üyeyi aşmanız tavsiye edilir.';

  if (range === '0_100') {
    rangeText = '0 - 100 Üye (Yeni Açılan Grup)';
    potential = '+600 - 1.200 Aktif Oyuncu';
    recommendedPkg = 'Shorts (30 TL) + YouTube Topluluk Anketi (80 TL)';
    conversionRate = '%45 - %55';
    advice = 'Yeni açılan gruplar için hızlı viral Shorts videoları anında oyuncu patlaması yaratır.';
  } else if (range === '500_2000') {
    rangeText = '500 - 2.000 Üye (Orta Büyüklük)';
    potential = '+2.000 - 3.500 Aktif Oyuncu';
    recommendedPkg = 'Gold Kombin (350 TL) veya Özel Video Çekimi (450 TL)';
    conversionRate = '%35 - %40';
    advice = 'Grubunuz oturmuş durumda. Özel video çekimi veya 3 Platformlu Gold paket ile liderliğe oynayabilirsiniz.';
  } else if (range === '2000_plus') {
    rangeText = '2.000+ Üye (Büyük Topluluk & Kamp)';
    potential = '+4.000 - 8.000+ Aktif Oyuncu';
    recommendedPkg = '👑 FULL VIP MEGA KOMBO (600 TL) + 7/24 Log Botu (750 TL)';
    conversionRate = '%30 - %36';
    advice = 'Büyük gruplar için 360 derece tüm platform reklamı ve 7/24 denetim botu altyapısı şarttır.';
  }

  const embed = new EmbedBuilder()
    .setTitle('📊 GRUP SAĞLIK & BÜYÜME POTANSİYEL RAPORU')
    .setDescription(
      `Girdiğiniz mevcut grup büyüklüğüne göre Eko Yıldız Veri Analitiği simülasyonu:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👥 **Mevcut Grup Hacmi:** \`${rangeText}\`\n` +
      `📈 **48 Saatte Hedeflenen Büyüme:** **${potential}**\n` +
      `🎯 **Ortalama Oyuncu Dönüşüm Oranı:** \`${conversionRate}\`\n` +
      `💡 **Uzman Tavsiyesi:** ${advice}\n\n` +
      `🏆 **En Çok Dönüşüm Sağlayacak Paket:**\n` +
      `> **${recommendedPkg}**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛡️ *Tüm reklamlarımız %100 Organik Oyuncu & Telafi Sigortası kapsamındadır.*`
    )
    .setColor(0x2ECC71)
    .setFooter({ text: 'Eko Yıldız Büyüme Analiz Laboratuvarı • Ücretsiz Rapor' })
    .setTimestamp();

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`reklam_audit_calc_${ticketId}`)
      .setPlaceholder('Grup Büyüklüğünüzü Seçin...')
      .addOptions(
        { label: '0 - 100 Üye (Yeni Başlayan)', value: '0_100', emoji: '🌱' },
        { label: '100 - 500 Üye (Gelişen Grup)', value: '100_500', emoji: '🌿' },
        { label: '500 - 2.000 Üye (Orta Büyüklük)', value: '500_2000', emoji: '🌲' },
        { label: '2.000+ Üye (Dev Topluluk/Kamp)', value: '2000_plus', emoji: '👑' }
      )
  );

  const btnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_open_modal_general_${ticketId}`)
      .setLabel('🚀 Önerilen Paketle Başla')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📝'),
    new ButtonBuilder()
      .setCustomId(`reklam_browse_start_${ticketId}`)
      .setLabel('📦 Paketleri Gez')
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, components: [selectRow, btnRow] };
}

/**
 * Fast-Track 24 Saat Süper Hızlı Teslimat
 */
function buildFastTrackEmbed(ticketId = 'general') {
  return new EmbedBuilder()
    .setTitle('🚀 24 SAAT SÜPER HIZLI TESLİMAT & ÖNCELİKLİ SIRA')
    .setDescription(
      `Standart siparişlerimizde teslimat süresi 48 saattir. Ancak acil etkinliğiniz veya lansmanınız varsa:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ **SADECE +40 TL FARKLA:**\n` +
      `• Siparişiniz tüm kuyruğun en önüne alınır (1. Öncelik).\n` +
      `• Stüdyo kurgusu 12-24 saat içinde tamamlanır ve videonuz ilk sırada yayınlanır.\n` +
      `• Danışmanımız **Emre** ile anlık WhatsApp / Discord VIP canlı iletişim köprüsü kurulur.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Sipariş verirken formu açtığınızda **Sipariş Notu** kısmına \`HIZLI TESLİMAT İSTİYORUM (+40 TL)\` yazmanız yeterlidir!`
    )
    .setColor(0xE67E22)
    .setFooter({ text: 'Eko Yıldız Hızlı Sıra Departmanı • VIP Öncelik' })
    .setTimestamp();
}

/**
 * Ödeme Yöntemleri & Yayın Süreci Bilgilendirme Embed'i (SADECE İTEMSATIŞ)
 */
function buildPaymentInfoEmbed() {
  return new EmbedBuilder()
    .setTitle('💳 ÖDEME SİSTEMİ VE %100 VERGİ KARŞILAMA GÜVENCESİ')
    .setDescription(
      `Tüm reklam ve sponsorluk ödemelerimiz **SADECE İTEMSATIŞ** platformu üzerinden güvenle kabul edilmektedir.\n\n` +
      `🛡️ **Neden Sadece İtemSatış?**\n` +
      `• **3D Secure & Güvenli Ödeme:** Kredi kartı, banka kartı veya İtemSatış bakiyesi ile anında ve güvenli alışveriş.\n` +
      `• **Alıcı & Satıcı Güvencesi:** Paranızı yatırdığınızda işlem onaylanana kadar İtemSatış havuzunda güvende kalır.\n` +
      `• **Hızlı Onay:** Ödeme tamamlandığında otomatik veya danışman onaylı anında işlem.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏛️ **T.C. VERGİLERİ BİZDEN (KDV %20 + DHV %7.5 + STOPAJ %15 = %47.5):**\n` +
      `> Normalde yasal olarak eklenmesi gereken **%47.5'lik tüm T.C. vergilerini tamamen Eko Yıldız olarak biz karşılıyoruz!** Sizden ek vergi alınmaz, fiyata her şey dahildir.\n\n` +
      `💰 **TL vs. ROBUX ÖDEME FARKI & KOMİSYON UYARISI:**\n` +
      `• 🇹🇷 **TL İle Ödeme (Tavsiye Edilen):** İtemSatış üzerinden doğrudan liste/kampanya fiyatıyla komisyonsuz, en karlı ödeme yöntemidir.\n` +
      `• 🪙 **Robux İle Ödeme (Aşırı Pahalı Seçenek):** Roblox sisteminin uyguladığı **%30 kesinti** ve platform transfer komisyonları nedeniyle Robux fiyatlarımız TL karşılığına göre **oldukça yüksektir**. Tüm Robux ve transfer komisyonları **müşteri (alıcı) tarafından karşılanmaktadır**.\n\n` +
      `🚀 **Satın Alma Adımları:**\n` +
      `1. Paket ve para biriminizi (TL / Robux) seçip sipariş formunu doldurun.\n` +
      `2. Size özel İtemSatış ilan/ödeme bağlantısı iletilir.\n` +
      `3. İtemSatış'tan ödemenizi tamamladığınız an yetkilimiz teslimat takvimini başlatır!`
    )
    .setColor(0x2ECC71)
    .setFooter({ text: 'Eko Yıldız Finans • Sadece İtemSatış Üzerinden Güvenli Alışveriş' })
    .setTimestamp();
}

/**
 * Reklam Başvuru ve Satın Alma Modalı
 * İtemSatış hesabı durumu, TL/Robux seçimi, topluluk linki ve özel notları toplar.
 */
async function triggerReklamModal(interaction, prefilledPackageName = '', ticketId = 'general') {
  const modal = new ModalBuilder()
    .setCustomId(`ekoyildiz_reklam_checkout_modal_${ticketId}`)
    .setTitle("🛒 Reklam & İtemSatış Sipariş Formu");

  const compNameInput = new TextInputBuilder()
    .setCustomId("reklam_topluluk_adi")
    .setLabel("Topluluk, Oyun veya Kanal Adınız")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Örn: Eko Yıldız Roblox Grubu / YouTube Kanalım")
    .setRequired(true);

  const itemsatisInput = new TextInputBuilder()
    .setCustomId("reklam_itemsatis_durumu")
    .setLabel("İtemSatış Hesabınız Var mı? (Deneyiminiz)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Örn: Evet var (Kullanıcı Adım: ...) / Hayır ilk defa alacağım")
    .setRequired(true);

  const currencyInput = new TextInputBuilder()
    .setCustomId("reklam_odeme_birimi")
    .setLabel("Ödeme Seçeneği (Tekli TL, 3x Paket, Robux)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Tek Seferlik TL / 3x Çoklu Paket / Robux")
    .setValue(prefilledPackageName ? `Paket: ${prefilledPackageName}` : "1x Tek Seferlik TL (İtemSatış)")
    .setRequired(true);

  const linkInput = new TextInputBuilder()
    .setCustomId("reklam_hedef_link")
    .setLabel("Tanıtılacak Link (Roblox / YouTube / Discord)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Örn: https://www.roblox.com/groups/... veya discord.gg/...")
    .setRequired(true);

  const notesInput = new TextInputBuilder()
    .setCustomId("reklam_siparis_notu")
    .setLabel("Sipariş Notunuz & Tercih Edilen Yayın Tarihi")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Vurgulanmasını istediğiniz özellikler, video teması, yayın tarihi tercihi veya özel istekleriniz...")
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(compNameInput),
    new ActionRowBuilder().addComponents(itemsatisInput),
    new ActionRowBuilder().addComponents(currencyInput),
    new ActionRowBuilder().addComponents(linkInput),
    new ActionRowBuilder().addComponents(notesInput)
  );

  return interaction.showModal(modal);
}

/**
 * Handles the submit of EkoYildiz reklam form modal
 */
async function handleReklamModalSubmit(interaction) {
  let communityName = "Topluluk";
  let itemsatisStatus = "Belirtilmedi";
  let currencyChoice = "TL (İtemSatış)";
  let targetLink = "Belirtilmedi";
  let orderNotes = "Özel not eklenmedi";

  try { communityName = interaction.fields.getTextInputValue("reklam_topluluk_adi")?.trim() || "Topluluk"; } catch (_) {}
  try { itemsatisStatus = interaction.fields.getTextInputValue("reklam_itemsatis_durumu")?.trim() || "Belirtilmedi"; } catch (_) {}
  try { currencyChoice = interaction.fields.getTextInputValue("reklam_odeme_birimi")?.trim() || "TL (İtemSatış)"; } catch (_) {}
  try { targetLink = interaction.fields.getTextInputValue("reklam_hedef_link")?.trim() || "Belirtilmedi"; } catch (_) {}
  try { orderNotes = interaction.fields.getTextInputValue("reklam_siparis_notu")?.trim() || "Özel not eklenmedi"; } catch (_) {}

  // Check if user is ticket-banned
  const User = require('../../models/User');
  const userRecord = await User.findOne({ discordId: interaction.user.id });
  if (userRecord?.ticketBanned) {
    return interaction.reply({
      content: "🚫 **Ticket Yasaklısınız.**\nSpam/kötüye kullanım raporunuz yetkililerce onaylandığı için ticket sistemi erişiminiz engellendi. Bu konuda itirazınız varsa sunucu yöneticisiyle iletişime geçin.",
      ephemeral: true
    });
  }

  await interaction.reply({
    content: "📬 **Harika! Reklam ve İtemSatış sipariş talebiniz başarıyla alındı.**\nLütfen DM kutunuzu kontrol edin; Müşteri Danışmanımız **Emre** sizinle iletişime geçti.",
    ephemeral: true
  });

  const ticketId = generateTicketId();

  // Create pending ticket in DB
  const ticket = new Ticket({
    ticketId,
    userId: interaction.user.id,
    userName: interaction.user.username,
    category: 'reklam_destek',
    subject: `Reklam Talebi (${communityName})`,
    description: 
      `🏢 **Topluluk/Marka:** ${communityName}\n` +
      `💳 **İtemSatış Durumu:** ${itemsatisStatus}\n` +
      `💰 **Ödeme Birimi / Tercih:** ${currencyChoice}\n` +
      `🔗 **Tanıtım Linki:** ${targetLink}\n` +
      `📝 **Sipariş Notu:** ${orderNotes}`,
    status: 'pending_confirmation',
    guildId: GUILD2_ID,
    source: 'dm',
  });
  await ticket.save();

  // Send DM to the user with Yes/No confirmation buttons and interactive browser options
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle("✉️ YENİ MESAJ: Eko Yıldız Reklam ve Sponsorluk Departmanı")
      .setDescription(
        `Merhaba **${interaction.user.username}**, ben Eko Yıldız Reklam ve Müşteri İlişkileri Danışmanı **Emre**.\n\n` +
        `Reklam ve sponsorluk talebinizi büyük bir memnuniyetle aldık! Topluluğunuzu binlerce oyuncuya ulaştırmak için sabırsızlanıyoruz.\n\n` +
        `📋 **Sipariş & Talep Özeti:**\n` +
        `🔹 **Topluluk / Marka:** ${communityName}\n` +
        `🔹 **İtemSatış Hesabı / Deneyim:** ${itemsatisStatus}\n` +
        `🔹 **Ödeme Seçeneği:** ${currencyChoice}\n` +
        `🔹 **Tanıtılacak Link:** ${targetLink}\n` +
        `🔹 **Sipariş Notu:** ${orderNotes}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🛡️ **ÖDEME & SİGORTA GÜVENCESİ:**\n` +
        `• Tüm ödemelerimiz **SADECE İTEMSATIŞ** üzerinden 3D Secure güvencesiyle alınır.\n` +
        `• Reklamınız hedeflenen performansa ulaşmazsa **%100 Ücretsiz Telafi Yayını Sigortası** kapsamındasınız.\n\n` +
        `Resmi reklam masanızı açıp İtemSatış siparişinizi tamamlamak istiyor musunuz?`
      )
      .setColor(0xF1C40F)
      .setFooter({ text: 'Eko Yıldız VIP Danışmanlık • Sadece İtemSatış Güvencesi' })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ekoyildiz_reklam_confirm_yes_${ticketId}`)
        .setLabel("✅ Evet, Reklam Kanalını Aç")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ekoyildiz_reklam_confirm_no_${ticketId}`)
        .setLabel("❌ Talebi İptal Et")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`reklam_view_flash_deal_${ticketId}`)
        .setLabel("⚡ Flaş Fırsat Kuponu")
        .setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_browse_start_${ticketId}`)
        .setLabel("📦 Paketleri İncele")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`reklam_view_guarantee_${ticketId}`)
        .setLabel("🛡️ Erişim Sigortası")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reklam_view_analytics_${ticketId}`)
        .setLabel("📈 Kitle Analitiği")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.user.send({ embeds: [dmEmbed], components: [row1, row2] });
  } catch (err) {
    console.error(`[reklamTicketService] Failed to send DM to user ${interaction.user.id}:`, err.message);
  }
}

/**
 * Adım geçişi yükleniyor durumu embed'i
 */
function buildLoadingStepEmbed(targetStep = 1) {
  const percent = Math.min(100, Math.max(15, targetStep * 20));
  const filled = Math.floor(percent / 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  return new EmbedBuilder()
    .setTitle('⏳ BİR SONRAKİ ÖZEL AVANTAJ & FIRSAT YÜKLENİYOR...')
    .setDescription(
      `> [${bar}] **%${percent} Tamamlandı**\n\n` +
      `🔍 **Eko Yıldız Fırsat Algoritması:**\n` +
      `• Hedef kitleniz ve bütçeniz analiz ediliyor...\n` +
      `• Size özel **TL FARKLA YÜKSELTME & %100 PERFORMANS GARANTİSİ** hesaplanıyor...\n\n` +
      `*Lütfen bekleyin, bir sonraki bölüm ve kaçırılmayacak TL fark fırsatları yükleniyor...*`
    )
    .setColor(0x3498DB)
    .setFooter({ text: 'Eko Yıldız Akıllı Reklam Asistanı • Yükleniyor' });
}

/**
 * Reklam Sihirbazı Adımları (1: Kalite, 2: 8 Paket, 3: Kamp Kurulumu, 4: Vergiler & Güvence, 5: İtemSatış Sipariş)
 */
function buildReklamWizardStep(step = 1, ticketId = 'general') {
  const currentStep = Math.max(1, Math.min(5, Number(step) || 1));
  let embed;
  let nextLabel = '';
  let bumpRow = new ActionRowBuilder();

  if (currentStep === 1) {
    embed = new EmbedBuilder()
      .setTitle('🌟 [ADIM 1/5] EKO YILDIZ KALİTE & PRESTİJ STANDARTLARI')
      .setDescription(
        `Hoş geldiniz! Topluluğunuzu, Roblox grubunuzu veya YouTube projenizi **on binlerce gerçek & aktif oyuncuya** ulaştırmak için doğru adrestesiniz!\n\n` +
        `💎 **NEDEN EKO YILDIZ?**\n` +
        `• **Stüdyo Kurgusu & Kristal Seslendirme:** Piyasadaki baştan savma ve bot basan içeriklerin aksine profesyonel prodüksiyon!\n` +
        `• **%100 Sadık Organik Kitle:** 1.5M+ Aylık İzlenme, %88 Robux harcayan oyuncu kitlesi.\n` +
        `• **🛡️ %100 Anti-Risk Sigortası:** Reklam hedeflenen performansı yakalayamazsa ücretsiz telafi yayını!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🔥 **FIRSAT BUMP: SADECE 30 TL FARKLA TOPLULUK ANKETİ EKLEYİN!**\n` +
        `> Normalde 80 TL olan YouTube Topluluk Anketini siparişinizin yanına **sadece +30 TL farkla** ekleyebilir, kitle etkileşiminizi 2'ye katlayabilirsiniz!\n\n` +
        `⏳ *Bu tanıtım sihirbazı her 5 saniyede bir otomatik ilerler veya aşağıdaki butonlarla kendiniz gezebilirsiniz.*`
      )
      .setColor(0xF1C40F)
      .setFooter({ text: 'Reklam Sihirbazı • Adım 1 / 5: Kalite & Standartlar' })
      .setTimestamp();
    nextLabel = '▶️ Sıradaki: 8 Reklam Paketi (%60 İndirim)';

    bumpRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_buy_pkg_yt_poll_${ticketId}`)
        .setLabel('🔥 +30 TL Farkla Anket Ekle (80 TL Değerinde)')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📊')
    );
  } else if (currentStep === 2) {
    embed = new EmbedBuilder()
      .setTitle('📦 [ADIM 2/5] 8 POPÜLER REKLAM PAKETİ & %60 İNDİRİMLER')
      .setDescription(
        `Bütçenize ve hedefinize uygun 8 farklı reklam seçeneği:\n\n` +
        `1️⃣ **YouTube Video Başı / Sonu:** ~~250 TL~~ ➔ **100 TL** *(3x Abone: 240 TL)*\n` +
        `2️⃣ **YouTube Video İçi 60s Detaylı Tanıtım:** ~~400 TL~~ ➔ **180 TL** *(3x Abone: 430 TL)*\n` +
        `3️⃣ **Özel Video Çekimi (5-8 Dk Tam İnceleme):** ~~800 TL~~ ➔ **450 TL** *(3x Abone: 1.080 TL)*\n` +
        `4️⃣ **Canlı Yayın Sponsorluğu (1 Saatlik Banner):** ~~300 TL~~ ➔ **120 TL** *(3x Abone: 290 TL)*\n` +
        `5️⃣ **YouTube Topluluk Gönderisi:** ~~150 TL~~ ➔ **50 TL** *(3x Abone: 120 TL)*\n` +
        `6️⃣ **Topluluk Anketi (Yüksek Etkileşim):** ~~200 TL~~ ➔ **80 TL** *(3x Abone: 190 TL)*\n` +
        `7️⃣ **Discord Duyuru & @everyone Bildirimi:** ~~200 TL~~ ➔ **70 TL** *(3x Abone: 170 TL)*\n` +
        `8️⃣ **👑 FULL VIP MEGA REKLAM KOMBOSU:** ~~1.500 TL~~ ➔ **600 TL** *(%60 Dev Tasarruf!)*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👑 **VIP UPGRADE: SADECE 350 TL FARKLA FULL VIP MEGA KOMBOSUNA YÜKSELTİN!**\n` +
        `> Tek bir video yerine **Tüm YouTube Videoları + Canlı Yayın Bannerı + Topluluk Anketi + Discord @everyone Duyurusu** hepsini tek pakette toplayın (%100 Erişim Garantisi)!`
      )
      .setColor(0x3498DB)
      .setFooter({ text: 'Reklam Sihirbazı • Adım 2 / 5: Paketler & Fiyatlar' })
      .setTimestamp();
    nextLabel = '▶️ Sıradaki: Kamp Kurulumu (4.850 TL)';

    bumpRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_buy_pkg_vip_mega_${ticketId}`)
        .setLabel('👑 +350 TL Farkla Full VIP Kombo Al (600 TL)')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🏆'),
      new ButtonBuilder()
        .setCustomId(`reklam_buy_pkg_yt_full_video_${ticketId}`)
        .setLabel('🎬 Özel Video Çekimi (450 TL)')
        .setStyle(ButtonStyle.Primary)
    );
  } else if (currentStep === 3) {
    embed = new EmbedBuilder()
      .setTitle('🏰 [ADIM 3/5] KAMPINIZ YOK MU YAPARIZ! (ALTYAPI & BOT)')
      .setDescription(
        `*Sadece reklam değil, Roblox & Discord kampınızı anahtar teslim kuruyoruz!*\n\n` +
        `📊 **Hizmet Kalemleri & Liste Fiyatları:**\n` +
        `• 🏰 **Ana & Branş Sunucu:** 500 TL *(+90 TL Webhook & İzinler)*\n` +
        `• 🏛️ **Birim & Departman Odaları:** 450 TL *(+350 TL RoWifi, +50 TL Form)*\n` +
        `• ⚡ **Panel Entegreli Rütbe Sistemi:** 300 TL *(Ömür Boyu 7/24)*\n` +
        `• 🤖 **Özel Kodlanmış 7/24 Log & Rütbe Botu:** 750 TL *(Canavar gibi çalışır!)*\n` +
        `• 🎨 **Stüdyo GFX Logo + Banner VIP Seti:** 790 TL\n` +
        `• 🧾 **Yasal KDV (%20) + İtemSatış Komisyon & Güvenlik:** 3.720 TL\n` +
        `> ❌ **Tek Tek Alım Değeri:** ~~7.000 TL~~\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👑 **%100 FULL LÜKS KAMP KURULUM SETİ (ALL-IN-ONE VIP BUNDLE):**\n` +
        `> Sadece **4.850 TL** *(Her şey dahil anahtar teslim, net 2.150 TL tasarruf!)*\n` +
        `🤖 **ÖZEL EKLENTİ:** Sadece **+300 TL farkla** *Oyuna Girme Kayıtlarını Rütbe XP'sine Dönüştürme* modülü ekleyin!`
      )
      .setColor(0x9B59B6)
      .setFooter({ text: 'Reklam Sihirbazı • Adım 3 / 5: Kamp & Bot Çözümleri' })
      .setTimestamp();
    nextLabel = '▶️ Sıradaki: Vergiler & Güvence';

    bumpRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_buy_pkg_kamp_full_${ticketId}`)
        .setLabel('👑 Full Lüks VIP Bundle (4.850 TL)')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🏆'),
      new ButtonBuilder()
        .setCustomId(`reklam_buy_pkg_kamp_bot_${ticketId}`)
        .setLabel('🤖 7/24 Log & Rütbe Botu (750 TL)')
        .setStyle(ButtonStyle.Primary)
    );
  } else if (currentStep === 4) {
    embed = new EmbedBuilder()
      .setTitle('🏛️ [ADIM 4/5] T.C. VERGİLERİ BİZDEN & %100 ERİŞİM SİGORTASI')
      .setDescription(
        `Devlet vergileri ve platform komisyonlarıyla kafanızı yormayın!\n\n` +
        `📊 **T.C. RESMİ DİJİTAL HİZMET VERGİ TABLOSU:**\n` +
        `• 🏛️ KDV (%20) + 💻 DHV (%7.5) + 📋 Stopaj (%15) + 📜 BSMV (%5) = **+%47.5 Vergi Yükü**\n\n` +
        `🎁 **EKO YILDIZ'DAN SİZE %100 VERGİ KARŞILAMA JESTİ:**\n` +
        `> 💥 **Bu %47.5'lik TÜM YASAL VERGİLERİ TAMAMEN BİZ CEBİMİZDEN KARŞILIYORUZ!**\n` +
        `> Sizden 1 kuruş bile ekstra vergi alınmaz. Ekranda gördüğünüz net fiyatı ödersiniz.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🛡️ **%100 ÜCRETSİZ ERİŞİM SİGORTASI GARANTİSİ (0 TL FARKLA DAHİL):**\n` +
        `> Reklamınız hedeflenen organik izlenmeyi yakalayamazsa hiçbir ek ücret ödemeden **%100 Ücretsiz Telafi Yayını** yapılır!`
      )
      .setColor(0x2ECC71)
      .setFooter({ text: 'Reklam Sihirbazı • Adım 4 / 5: Vergi & Güvence' })
      .setTimestamp();
    nextLabel = '▶️ Sıradaki: İtemSatış & Sipariş';

    bumpRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_view_guarantee_${ticketId}`)
        .setLabel('🛡️ %100 Erişim Sigortasını İncele')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId(`reklam_view_taxes_${ticketId}`)
        .setLabel('🏛️ Vergi Muafiyet Raporu (%47.5)')
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    embed = new EmbedBuilder()
      .setTitle('💳 [ADIM 5/5] SADECE İTEMSATIŞ GÜVENCESİ & SİPARİŞİ TAMAMLA')
      .setDescription(
        `Tebrikler! Tanıtım turunu başarıyla tamamladınız. Artık siparişinizi başlatmaya hazırsınız.\n\n` +
        `🛡️ **ÖDEME SİSTEMİ:**\n` +
        `• Tüm ödemelerimiz **SADECE İTEMSATIŞ** üzerinden 3D Secure güvencesiyle gerçekleşir.\n` +
        `• İtemSatış bakiyesi, kredi kartı veya banka kartı ile güvenle ödeme yapabilirsiniz.\n` +
        `• Komisyon kesintileri sebebiyle **TL ile ödeme** şiddetle tavsiye edilir.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🎁 **SON DAKİKA JESTİ: SADECE 50 TL FARKLA DİSCORD @everyone DUYURUSU EKLEYİN!**\n` +
        `> Normalde 70 TL olan tüm sunucuya etiketli özel Discord duyurusunu **sadece +50 TL farkla** sepetinize ekleyebilirsiniz!\n\n` +
        `🚀 **Sıradaki Adım:** Aşağıdaki butonlardan sipariş formunu doldurabilir, paketleri gezebilir veya bu kanaldan canlı danışmanımız **Emre** ile görüşebilirsiniz!`
      )
      .setColor(0xE67E22)
      .setFooter({ text: 'Reklam Sihirbazı • Adım 5 / 5: Sipariş & Tamamlama' })
      .setTimestamp();

    bumpRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_buy_pkg_dc_everyone_${ticketId}`)
        .setLabel('🎁 +50 TL Farkla Discord Duyurusu Ekle')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📢'),
      new ButtonBuilder()
        .setCustomId(`reklam_builder_open_${ticketId}`)
        .setLabel('🎯 Kendi Paketini Tasarla')
        .setStyle(ButtonStyle.Primary)
    );
  }

  const navRow = new ActionRowBuilder();
  if (currentStep > 1) {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_wizard_step_${currentStep - 1}_${ticketId}`)
        .setLabel(`◀️ Geri (${currentStep - 1})`)
        .setStyle(ButtonStyle.Secondary)
    );
  }
  if (currentStep < 5) {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_wizard_step_${currentStep + 1}_${ticketId}`)
        .setLabel(nextLabel || `▶️ İleri (${currentStep + 1})`)
        .setStyle(ButtonStyle.Primary)
    );
  }

  navRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_open_modal_general_${ticketId}`)
      .setLabel('✨ Sipariş Formu Aç')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📝'),
    new ButtonBuilder()
      .setCustomId(`reklam_browse_start_${ticketId}`)
      .setLabel('📦 Paketleri Gez')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔍'),
    new ButtonBuilder()
      .setCustomId(`reklam_view_kamp_${ticketId}`)
      .setLabel('🏰 Kamp Hizmetleri')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👑')
  );

  return { embed, components: [bumpRow, navRow] };
}

/**
 * Kullanıcı menüden reklam seçtiğinde doğrudan ticket açar ve sihirbazı başlatır
 */
async function openReklamTicketDirectly(interaction) {
  const User = require('../../models/User');
  const userRecord = await User.findOne({ discordId: interaction.user.id });
  if (userRecord?.ticketBanned) {
    return interaction.reply({
      content: "🚫 **Ticket Yasaklısınız.**\nSpam/kötüye kullanım raporunuz yetkililerce onaylandığı için ticket sistemi erişiminiz engellendi.",
      ephemeral: true
    });
  }

  // Check if open ticket exists
  const existingTicket = await Ticket.findOne({
    userId: interaction.user.id,
    category: 'reklam_destek',
    status: 'open'
  });

  if (existingTicket && existingTicket.channelId) {
    return interaction.reply({
      content: `⚠️ Zaten açık bir reklam masanız bulunmaktadır: <#${existingTicket.channelId}>\nOradan sihirbazı inceleyebilir veya danışmanımızla görüşebilirsiniz.`,
      ephemeral: true
    });
  }

  const ticketId = generateTicketId();
  const targetGuild = await interaction.client.guilds.fetch(GUILD2_ID).catch(() => null);
  if (!targetGuild) {
    return interaction.reply({ content: "❌ Sunucuya erişilemedi.", ephemeral: true });
  }

  const permissionOverwrites = [
    { id: targetGuild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  for (const roleId of Object.values(ROLES)) {
    if (roleId && targetGuild.roles.cache.has(roleId)) {
      permissionOverwrites.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }
  }

  const channel = await targetGuild.channels.create({
    name: `reklam-${interaction.user.username.toLowerCase()}`,
    type: ChannelType.GuildText,
    parent: GUILD2_TICKET_CATEGORY_ID || undefined,
    permissionOverwrites,
  });

  const ticket = new Ticket({
    ticketId,
    userId: interaction.user.id,
    userName: interaction.user.username,
    category: 'reklam_destek',
    subject: 'Reklam & Sponsorluk Talebi',
    description: 'Kullanıcı destek kanalından reklam talebi başlattı.',
    status: 'open',
    channelId: channel.id,
    guildId: GUILD2_ID,
    source: 'channel',
  });
  await ticket.save();

  await interaction.reply({
    content: `✅ **Reklam ve Sponsorluk Masanız Başarıyla Açıldı!**\n👉 Lütfen <#${channel.id}> kanalına geçin. Reklam Sihirbazımız başlatıldı!`,
    ephemeral: true
  });

  // Start guided wizard in channel and send DM to user
  const step1Data = buildReklamWizardStep(1, ticketId);
  const wizardMsg = await channel.send({
    content: `🎉 Hoş geldiniz <@${interaction.user.id}>! Eko Yıldız Reklam ve Sponsorluk Masanız açıldı.\n` +
      `Danışmanımız **Emre** sizinle ilgileniyor. Aşağıda **5 Adımlı Tanıtım Sihirbazımız** başladı:`,
    embeds: [step1Data.embed],
    components: step1Data.components
  }).catch(() => null);

  // Send DM to user
  try {
    await interaction.user.send({
      content: `👑 **Eko Yıldız Reklam & Sponsorluk Masanız Açıldı!**\nSunucudaki kanalınız: <#${channel.id}>\n\nAşağıdaki sihirbazı inceleyebilir veya doğrudan sunucu kanalından bize yazabilirsiniz:`,
      embeds: [step1Data.embed],
      components: step1Data.components
    });
  } catch (_) {}

  // Automatically advance to step 2 after 5 seconds if ticket is still open
  if (wizardMsg) {
    setTimeout(async () => {
      try {
        const checkTicket = await Ticket.findOne({ ticketId });
        if (!checkTicket || checkTicket.status !== 'open') return;
        const step2Data = buildReklamWizardStep(2, ticketId);
        await wizardMsg.edit({ embeds: [step2Data.embed], components: step2Data.components }).catch(() => {});
      } catch (_) {}
    }, 5000);
  }

  // Start staff routing
  startTicketClaimRouting(ticketId, interaction.client);
}

/**
 * Handles confirmation response from DM button clicks
 */
async function handleReklamConfirm(interaction, client, isYes, ticketId) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) {
    return interaction.update({ content: "❌ Talep bulunamadı.", embeds: [], components: [] });
  }

  if (ticket.status !== 'pending_confirmation') {
    return interaction.update({ content: "❌ Bu talep zaten işlenmiş veya kanalınız açık durumda.", embeds: [], components: [] });
  }

  if (!isYes) {
    ticket.status = 'closed';
    ticket.closeReason = 'Kullanıcı DM üzerinden iptal etti.';
    ticket.closedAt = new Date();
    await ticket.save();

    return interaction.update({
      content: '❌ Reklam talebiniz iptal edildi. Dilediğiniz zaman destek panelimizden veya komutlarımızdan tekrar talep oluşturabilirsiniz. İyi günler dileriz!',
      embeds: [],
      components: []
    });
  }

  // User confirmed! Create reklam channel
  await interaction.update({
    content: '⏳ **Reklam talebiniz onaylandı!** Özel reklam ve sponsorluk masanız hazırlanıyor...',
    embeds: [],
    components: []
  });

  try {
    const targetGuild = await client.guilds.fetch(GUILD2_ID);
    if (!targetGuild) throw new Error("Eko Yıldız sunucusu bulunamadı.");

    const permissionOverwrites = [
      { id: targetGuild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: ticket.userId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
    ];

    for (const roleId of Object.values(ROLES)) {
      if (roleId && targetGuild.roles.cache.has(roleId)) {
        permissionOverwrites.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        });
      }
    }

    const channel = await targetGuild.channels.create({
      name: `reklam-${ticket.userName.toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: GUILD2_TICKET_CATEGORY_ID || undefined,
      permissionOverwrites,
    });

    ticket.status = 'open';
    ticket.channelId = channel.id;
    await ticket.save();

    // Welcome embed in reklam channel
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎫 ${ticket.ticketId} — Reklam & Sponsorluk Masası`)
      .setDescription(
        `👑 **Müşteri:** <@${ticket.userId}> (\`${ticket.userName}\`)\n` +
        `📅 **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
        `📋 **Müşteri Başvuru & İtemSatış Detayları:**\n${ticket.description}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💼 **Yetkili & Danışman Paneli:**\n` +
        `• Kanala yazdığınız her mesaj müşteriye **DM** olarak gider.\n` +
        `• Müşterinin DM'den yazdıkları anlık bu kanala düşer.\n` +
        `• Ödeme **SADECE İTEMSATIŞ** üzerinden alınacaktır. Aşağıdaki hızlı butonlarla müşteriye İtemSatış ödeme yönlendirmesi yapabilirsiniz.`
      )
      .setColor(0xF1C40F)
      .setFooter({ text: 'Eko Yıldız Reklam Departmanı • Sadece İtemSatış' })
      .setTimestamp();

    const rowButtons1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_prices_${ticketId}`)
        .setLabel("📦 Paket Kataloğu")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📑"),
      new ButtonBuilder()
        .setCustomId(`reklam_builder_open_${ticketId}`)
        .setLabel("🎯 Kendi Paketini Oluştur")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🛠️"),
      new ButtonBuilder()
        .setCustomId(`reklam_send_payment_${ticketId}`)
        .setLabel("💳 İtemSatış Bilgisini İlet")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("💰")
    );

    const rowButtons2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_ticket_${ticketId}`)
        .setLabel("🙋‍♂️ Talebi Üstlen")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reklam_pause_${ticketId}`)
        .setLabel("⏸️ Duraklat / Devam Et")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`reklam_close_${ticketId}`)
        .setLabel("🔒 Reklam Talebini Kapat")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [welcomeEmbed], components: [rowButtons1, rowButtons2] });

    // Start Claim Routing for active staff
    await startTicketClaimRouting(ticket, targetGuild, client).catch(err => {
      console.error("[reklamTicketService] Claim routing failed:", err.message);
    });

    // Inform user in DM with rich guide
    const dmReadyEmbed = new EmbedBuilder()
      .setTitle("🚀 Reklam ve Sponsorluk Masanız Açıldı!")
      .setDescription(
        `✅ **Talebiniz başarıyla aktif edildi!**\n\n` +
        `💬 **Nasıl İletişim Kuracaksınız?**\n` +
        `Buradan (DM kutusundan) yazacağınız her mesaj doğrudan **Eko Yıldız Reklam Departmanı Yetkililerine** iletilmektedir.\n\n` +
        `🛡️ **Ödeme:** Ödemeniz **SADECE İTEMSATIŞ** üzerinden güvenle gerçekleştirilecektir.\n` +
        `🔒 **Sigorta:** Reklamınız **%100 Erişim & Telafi Sigortası** altındadır.\n\n` +
        `🔥 *Yetkili danışmanımız en kısa sürede sizinle ilgilenmek için sohbete katılacaktır.*`
      )
      .setColor(0x2ECC71)
      .setTimestamp();

    const dmButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`reklam_browse_start_${ticketId}`)
        .setLabel("📦 Paketleri İncele")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔍"),
      new ButtonBuilder()
        .setCustomId(`reklam_view_guarantee_${ticketId}`)
        .setLabel("🛡️ Erişim Sigortası")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔒"),
      new ButtonBuilder()
        .setCustomId(`reklam_view_analytics_${ticketId}`)
        .setLabel("📈 Kitle Raporu")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.followUp({
      embeds: [dmReadyEmbed],
      components: [dmButtons],
      ephemeral: false
    });
  } catch (err) {
    console.error("[reklamTicketService] Channel creation failed:", err.message);
    await interaction.followUp({
      content: `❌ Reklam kanalı oluşturulurken bir hata oluştu: ${err.message}`,
      ephemeral: false
    });
  }
}

/**
 * Forwards user DM message to reklam channel
 */
async function forwardDMToReklamChannel(message, client, ticket) {
  const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
  if (!channel) return;

  if (ticket.paused) {
    await message.author.send("⏸️ **Reklam talebiniz şu anda duraklatılmış durumdadır.** İletişim geçici olarak askıya alınmıştır.").catch(() => {});
    return;
  }

  // Check transfer state
  if (ticket.transferState === "pending_transfer") {
    ticket.transferState = "connected";
    await ticket.save();
    const connEmbed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle("🔌 Bağlantı Kuruldu")
      .setDescription("✅ **Bağlanıldı!** Satın alma ve İtemSatış işlemleriniz için üst düzey yönetici sohbete katıldı.")
      .setTimestamp();
    await message.author.send({ embeds: [connEmbed] }).catch(() => {});
  }

  let replyText = null;
  if (message.reference && message.reference.messageId) {
    try {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      if (refMsg) {
        const embed = refMsg.embeds?.[0];
        const content = embed ? (embed.description || embed.title) : refMsg.content;
        replyText = content ? (content.length > 100 ? content.slice(0, 100) + '...' : content) : '*(ek dosya)*';
      }
    } catch (_) {}
  }

  const embed = new EmbedBuilder()
    .setColor(0xF1C40F)
    .setAuthor({ name: `${message.author.tag} (DM)`, iconURL: message.author.displayAvatarURL() })
    .setDescription((replyText ? `↩️ **Cevaplanan Mesaj:** *"${replyText}"*\n\n` : '') + (message.content || '*(ek dosya)*'))
    .setFooter({ text: '📩 Müşteri DM Mesajı' })
    .setTimestamp();

  const sendOpts = { embeds: [embed] };
  if (message.attachments.size > 0) {
    sendOpts.files = [...message.attachments.values()].map(a => a.url).slice(0, 5);
  }

  await channel.send(sendOpts).catch(() => {});
  await message.react('✅').catch(() => {});
}

/**
 * Forwards moderator message in reklam channel to user DM
 */
async function forwardReklamChannelToDM(message, client) {
  const channelId = message.channel.id;
  const ticket = await Ticket.findOne({ channelId, status: 'open', category: 'reklam_destek' });
  if (!ticket) return false;

  if (ticket.paused) {
    return false;
  }

  const user = await client.users.fetch(ticket.userId).catch(() => null);
  if (!user) return false;

  // Check transfer state
  if (ticket.transferState === "pending_transfer") {
    ticket.transferState = "connected";
    await ticket.save();
    const connEmbed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle("🔌 Bağlantı Kuruldu")
      .setDescription("✅ **Bağlanıldı!** Satın alma ve İtemSatış işlemleriniz için üst düzey yönetici sohbete katıldı.")
      .setTimestamp();
    await user.send({ embeds: [connEmbed] }).catch(() => {});
  }

  let replyText = null;
  if (message.reference && message.reference.messageId) {
    try {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      if (refMsg) {
        const embed = refMsg.embeds?.[0];
        const content = embed ? (embed.description || embed.title) : refMsg.content;
        replyText = content ? (content.length > 100 ? (content.includes('Cevaplanan Mesaj:') ? content.split('\n\n').slice(1).join('\n\n') : content).slice(0, 100) + '...' : content) : '*(ek dosya)*';
      }
    } catch (_) {}
  }

  const embed = new EmbedBuilder()
    .setColor(0x7c6af7)
    .setAuthor({ name: `${message.author.displayName} — Yetkili Danışman`, iconURL: message.author.displayAvatarURL() })
    .setDescription((replyText ? `↩️ **Cevaplanan Mesajınız:** *"${replyText}"*\n\n` : '') + (message.content || '*(ek dosya)*'))
    .setFooter({ text: 'Eko Yıldız Reklam & Sponsorluk Departmanı • Sadece İtemSatış' })
    .setTimestamp();

  const sendOpts = { embeds: [embed] };
  if (message.attachments.size > 0) {
    sendOpts.files = [...message.attachments.values()].map(a => a.url).slice(0, 5);
  }

  await user.send(sendOpts).catch(() => {});
  await message.react('✅').catch(() => {});
  return true;
}

/**
 * Sends advertising package details in reklam channel with interactive browser
 */
async function sendReklamPrices(interaction, ticketId) {
  const embed = buildPackagePageEmbed(0);
  const components = buildPackageBrowserComponents(0, ticketId);

  await interaction.reply({ embeds: [embed], components });

  // DM the interactive prices directly to the user (ad owner)
  try {
    const ticket = await Ticket.findOne({ ticketId });
    if (ticket) {
      const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);
      if (user) {
        await user.send({ embeds: [embed], components }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("[reklamTicketService] Failed to send prices embed via DM:", err.message);
  }
}

/**
 * Handles stepping through packages with buttons (Next/Prev/First/Last)
 */
async function handlePackageNavigation(interaction, targetIndex, ticketId) {
  const safeIdx = Math.max(0, Math.min(targetIndex, REKLAM_PACKAGES.length - 1));
  const embed = buildPackagePageEmbed(safeIdx);
  const components = buildPackageBrowserComponents(safeIdx, ticketId);

  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await interaction.update({ embeds: [embed], components });
  } else {
    await interaction.reply({ embeds: [embed], components, ephemeral: true });
  }
}

/**
 * Triggers package selection dropdown
 */
async function triggerPurchaseSelection(interaction, ticketId) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`reklam_package_select_${ticketId || 'general'}`)
    .setPlaceholder("Satın almak istediğiniz reklam paketini seçin...")
    .addOptions(
      REKLAM_PACKAGES.map(p =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${p.title} — ${p.discountPrice}`)
          .setDescription(`3x Paket: ${p.multiPackPrice} • Sadece İtemSatış`)
          .setValue(p.code)
          .setEmoji(p.emoji)
      )
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);
  await interaction.reply({
    content: "📢 **Almak istediğiniz reklam paketini seçin:**\nSeçim yaptıktan sonra İtemSatış sipariş formunuz açılacaktır.",
    components: [row],
    ephemeral: true
  });
}

/**
 * Handles package purchase selection
 */
async function handlePurchaseSelection(interaction) {
  const customId = interaction.customId;
  const ticketId = customId.replace("reklam_package_select_", "");
  const selectedValue = interaction.values[0];

  const matchedPkg = REKLAM_PACKAGES.find(p => p.code === selectedValue || p.id === selectedValue);
  const packageName = matchedPkg ? `${matchedPkg.title} (${matchedPkg.discountPrice} / ${matchedPkg.discountRobux})` : selectedValue;

  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) {
    return triggerReklamModal(interaction, packageName, ticketId);
  }

  ticket.transferState = "pending_transfer";
  await ticket.save();

  // Send ping message in channel
  const managerPing = `<@1031620522406072350>`;
  if (interaction.channel) {
    await interaction.channel.send({
      content: `🚨 **Yeni İtemSatış Siparişi Talebi!**\n<@${ticket.userId}> kullanıcısı **${packageName}** paketini İtemSatış üzerinden almak istiyor.\n💳 **Tutar:** ${matchedPkg?.discountPrice || ''} / ${matchedPkg?.discountRobux || ''}\nLütfen ilgilenin: ${managerPing}`
    });
  }

  // Open modal for detailed checkout notes
  return triggerReklamModal(interaction, packageName, ticketId);
}

/**
 * Sends payment details directly into channel and DM
 */
async function sendPaymentDetails(interaction, ticketId) {
  const embed = buildPaymentInfoEmbed();
  await interaction.reply({ embeds: [embed] });

  try {
    const ticket = await Ticket.findOne({ ticketId });
    if (ticket) {
      const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);
      if (user) {
        await user.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (_) {}
}

/**
 * Sends %60 Deals embed directly into channel and DM
 */
async function sendDealsCampaign(interaction, ticketId) {
  const embed = buildCampaignDealsEmbed();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reklam_browse_start_${ticketId}`)
      .setLabel("📦 Paketleri İncele")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`reklam_buy_${ticketId}`)
      .setLabel("🛒 Satın Al (İtemSatış)")
      .setStyle(ButtonStyle.Success)
  );

  await interaction.reply({ embeds: [embed], components: [row] });

  try {
    const ticket = await Ticket.findOne({ ticketId });
    if (ticket) {
      const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);
      if (user) {
        await user.send({ embeds: [embed], components: [row] }).catch(() => {});
      }
    }
  } catch (_) {}
}

/**
 * Toggles advertising ticket pause state
 */
async function toggleReklamPause(interaction, ticketId) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) {
    return interaction.reply({ content: "❌ Reklam talebi bulunamadı.", ephemeral: true });
  }

  ticket.paused = !ticket.paused;
  await ticket.save();

  const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);

  if (ticket.paused) {
    await interaction.reply({ content: "⏸️ **Reklam talebi duraklatıldı.** DM mesaj iletimi geçici olarak kapatıldı." });
    if (user) {
      await user.send("⏸️ **Reklam talebiniz duraklatıldı.** Yetkililer sohbete devam edene kadar mesaj iletimi askıya alınmıştır.").catch(() => {});
    }
  } else {
    await interaction.reply({ content: "▶️ **Reklam talebi devam ettiriliyor.** DM mesaj iletimi tekrar açıldı." });
    if (user) {
      await user.send("▶️ **Reklam talebiniz tekrar aktifleştirildi.** Mesajlarınızı buradan yazmaya devam edebilirsiniz.").catch(() => {});
    }
  }
}

/**
 * 24 Saatlik Otomatik Takip Sistemi (Abandoned Cart Recovery / Sepet Kurtarma)
 * Talep açıp ödeme yapmadan DM'de kalan kullanıcıya 12-24 saat sonra hatırlatma DM'i gönderir.
 */
async function checkAbandonedReklamTickets(client) {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const tickets = await Ticket.find({
      category: 'reklam_destek',
      status: { $in: ['open', 'pending_confirmation'] },
      createdAt: { $lt: twelveHoursAgo }
    });

    if (!tickets || tickets.length === 0) return;

    for (const ticket of tickets) {
      // Don't spam if already reminded
      if (ticket.abandonedReminderSent) continue;

      const user = await client.users.fetch(ticket.userId).catch(() => null);
      if (!user) continue;

      const recoveryEmbed = new EmbedBuilder()
        .setTitle("⏰ %60 İNDİRİMLİ KONTENJANINIZ DOLMAK ÜZERE!")
        .setDescription(
          `Merhaba **${user.username}**! 👋\n\n` +
          `Eko Yıldız Reklam ve Sponsorluk Departmanı'nda başlattığınız reklam talebiniz rezerve edilmiş durumda bekliyor.\n\n` +
          `⚠️ **Son 12 Saat:** Kampanyalı kontenjanınız ve indirim hakkınız **12 saat sonra** otomatik olarak sıradaki diğer kullanıcıya aktarılacaktır.\n\n` +
          `💬 **Desteğe İhtiyacınız Var mı?**\n` +
          `İtemSatış ödeme adımlarında veya aklınıza takılan herhangi bir konuda yardıma ihtiyacınız varsa buradan doğrudan danışmanımız **Emre**'ye yazabilirsiniz!`
        )
        .setColor(0xE74C3C)
        .setFooter({ text: 'Eko Yıldız Otomatik Hatırlatma Sistemi • Sadece İtemSatış' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`reklam_browse_start_${ticket.ticketId}`)
          .setLabel("📦 Paketimi İncele")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`reklam_send_payment_${ticket.ticketId}`)
          .setLabel("💳 İtemSatış İlanına Git")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`ekoyildiz_reklam_confirm_no_${ticket.ticketId}`)
          .setLabel("❌ Rezervasyonu İptal Et")
          .setStyle(ButtonStyle.Danger)
      );

      await user.send({ embeds: [recoveryEmbed], components: [row] }).catch(() => {});
      ticket.abandonedReminderSent = true;
      ticket.abandonedReminderAt = new Date();
      await ticket.save();
      console.log(`[AbandonedRecovery] Sent recovery reminder to ${user.tag} for ticket ${ticket.ticketId}`);
    }
  } catch (err) {
    console.error("[AbandonedRecovery] Error in checkAbandonedReklamTickets:", err.message);
  }
}

const activeTicketClaims = new Map();

/**
 * Finds online active staff members in the server. Falls back to offline if none online.
 */
async function findActiveOnlineStaff(guild, client) {
  const StaffProgress = require('../../models/StaffProgress');
  const activeStaffDocs = await StaffProgress.find({ status: 'active' });
  if (!activeStaffDocs || activeStaffDocs.length === 0) return [];

  // Shuffle docs
  const shuffledDocs = activeStaffDocs.sort(() => Math.random() - 0.5);

  const onlineStaff = [];
  const { hasInactivityRole } = require('./staffSystem');

  for (const doc of shuffledDocs) {
    // Check if on leave today
    const todayStr = new Date().toISOString().slice(0, 10);
    const isLeave = doc.leaves?.usedDays && doc.leaves.usedDays.includes(todayStr);
    if (isLeave) continue;

    const member = await guild.members.fetch(doc.userId).catch(() => null);
    if (!member || member.user.bot) continue;

    // Check inactivity roles
    const inactive = await hasInactivityRole(member.id, client).catch(() => false);
    if (inactive) continue;

    const presenceStatus = member.presence?.status;
    if (presenceStatus && presenceStatus !== 'offline') {
      onlineStaff.push(member);
    }
  }

  return onlineStaff;
}

/**
 * Sends a notification to the moderator channel that no active staff is online/available.
 */
async function handleNoActiveStaffAvailable(ticketId, guildId, channelId, client) {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (guild) {
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Aktif Personel Bulunamadı")
        .setDescription("Şu anda aktif bir mod yok.. Aktif bir mod gelene kadar bekleyin...")
        .setColor(0xe74c3c)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_ticket_${ticketId}`)
          .setLabel("🙋‍♂️ Üstlen")
          .setStyle(ButtonStyle.Success)
      );

      await channel.send({ embeds: [embed], components: [row] }).catch(() => {});
    }
  }
}

/**
 * Clears timeout and deletes the last sent DM message to active staff
 */
async function deleteActiveClaimDmMessage(ticketId) {
  const claimInfo = activeTicketClaims.get(ticketId);
  if (claimInfo) {
    if (claimInfo.timeoutId) {
      clearTimeout(claimInfo.timeoutId);
      claimInfo.timeoutId = null;
    }
    if (claimInfo.lastDmMessage) {
      await claimInfo.lastDmMessage.delete().catch(() => {});
      claimInfo.lastDmMessage = null;
    }
  }
}

/**
 * Starts claim routing process for a ticket
 */
async function startTicketClaimRouting(ticket, guild, client) {
  const staffMembers = await findActiveOnlineStaff(guild, client);
  if (!staffMembers || staffMembers.length === 0) {
    console.log(`[ClaimRouting] No active staff members found for ticket ${ticket.ticketId}`);
    await handleNoActiveStaffAvailable(ticket.ticketId, guild.id, ticket.channelId, client);
    return;
  }

  const staffIds = staffMembers.map(m => m.id);
  activeTicketClaims.set(ticket.ticketId, {
    staffList: staffIds,
    currentIndex: 0,
    guildId: guild.id,
    channelId: ticket.channelId,
    lastDmMessage: null,
    timeoutId: null
  });

  await routeNextClaimRequest(ticket.ticketId, client);
}

/**
 * Route claim request to the next staff member in list
 */
async function routeNextClaimRequest(ticketId, client) {
  const claimInfo = activeTicketClaims.get(ticketId);
  if (!claimInfo) return;

  // Clear previous timeout and message if any
  if (claimInfo.timeoutId) {
    clearTimeout(claimInfo.timeoutId);
    claimInfo.timeoutId = null;
  }
  if (claimInfo.lastDmMessage) {
    await claimInfo.lastDmMessage.delete().catch(() => {});
    claimInfo.lastDmMessage = null;
  }

  const { staffList, currentIndex, guildId, channelId } = claimInfo;
  if (currentIndex >= staffList.length) {
    console.log(`[ClaimRouting] All staff members rejected or ignored ticket ${ticketId}`);
    activeTicketClaims.delete(ticketId);
    await handleNoActiveStaffAvailable(ticketId, guildId, channelId, client);
    return;
  }

  const currentStaffId = staffList[currentIndex];
  claimInfo.currentIndex++; // Advance for next attempt

  const user = await client.users.fetch(currentStaffId).catch(() => null);
  if (!user) {
    return routeNextClaimRequest(ticketId, client);
  }

  try {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Yeni Reklam / İtemSatış Destek Talebi")
      .setDescription(
        `Eko Yıldız sunucusunda **${ticketId}** numaralı yeni bir reklam/sponsorluk talebi oluşturuldu.\n\n` +
        `Bu talebi üstlenmek ister misiniz?\n\n` +
        `*Kabul ederseniz müşteriyle ilgilenmekle görevlendirileceksiniz. Reddederseniz sıradaki diğer yetkiliye iletilecektir.*\n\n` +
        `⏳ **Yanıtlama Süresi:** 5 dakika`
      )
      .setColor(0x3498DB)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`staff_claim_accept_${ticketId}_${currentStaffId}`)
        .setLabel("Kabul Et")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`staff_claim_reject_${ticketId}_${currentStaffId}`)
        .setLabel("Reddet")
        .setStyle(ButtonStyle.Danger)
    );

    const sentMsg = await user.send({ embeds: [embed], components: [row] });
    console.log(`[ClaimRouting] Sent claim request to ${user.tag} for ticket ${ticketId}`);

    claimInfo.lastDmMessage = sentMsg;

    // Set 5 minutes timeout to auto-ignore
    claimInfo.timeoutId = setTimeout(async () => {
      console.log(`[ClaimRouting] Staff member ${user.tag} ignored claim request for 5 minutes.`);
      await sentMsg.delete().catch(() => {});
      claimInfo.timeoutId = null;
      claimInfo.lastDmMessage = null;
      await routeNextClaimRequest(ticketId, client);
    }, 5 * 60 * 1000);

  } catch (err) {
    console.warn(`[ClaimRouting] Could not DM staff member ${user.tag}:`, err.message);
    return routeNextClaimRequest(ticketId, client);
  }
}

module.exports = {
  REKLAM_PACKAGES,
  CUSTOM_BUILDER_MODULES,
  KAMP_SERVICES,
  buildPackagePageEmbed,
  buildPackageBrowserComponents,
  buildCustomBuilderComponents,
  buildCustomerReviewsEmbed,
  buildUpsellOfferEmbed,
  buildAntiRiskGuaranteeEmbed,
  buildFlashDealEmbed,
  buildAudienceAnalyticsEmbed,
  buildKampKurulumEmbed,
  buildKampBrowserComponents,
  buildAllPackagesSummaryEmbed,
  buildQualityGuaranteeEmbed,
  buildCampaignDealsEmbed,
  buildPaymentInfoEmbed,
  buildTaxReliefGuaranteeEmbed,
  buildLoadingStepEmbed,
  buildReklamWizardStep,
  openReklamTicketDirectly,
  getLiveActivityFeedText,
  buildTieredMilestonesEmbed,
  buildSamplesShowcaseEmbed,
  buildSpinWheelEmbed,
  buildGroupAuditEmbed,
  buildFastTrackEmbed,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  handlePackageNavigation,
  triggerReklamModal,
  handleReklamModalSubmit,
  handleReklamConfirm,
  forwardDMToReklamChannel,
  forwardReklamChannelToDM,
  sendReklamPrices,
  sendPaymentDetails,
  sendDealsCampaign,
  triggerPurchaseSelection,
  handlePurchaseSelection,
  toggleReklamPause,
  checkAbandonedReklamTickets,
  findActiveOnlineStaff,
  startTicketClaimRouting,
  routeNextClaimRequest,
  deleteActiveClaimDmMessage,
  activeTicketClaims
};
