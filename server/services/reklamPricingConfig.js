'use strict';

/**
 * reklamPricingConfig.js
 * 
 * EkoYıldız Reklam & Sponsorluk Merkezi Fiyatlandırma ve Paket Konfigürasyonu.
 * UI ve sunucu taraflı kontroller için tek kaynak (Single Source of Truth).
 */

// Taban Discord duyuru ücreti (video paketi olmadan veya bağımsız fiyat)
const BASE_DISCORD_ANNOUNCEMENT_PRICE = 140;

/**
 * Hazır Reklam Paketleri
 */
const PRESET_PACKAGES = [
  {
    id: 'shorts',
    title: 'Shorts & Hızlı Tanıtım',
    basePrice: 30,
    priceLabel: '30 TL',
    badge: 'Hızlı Erişim',
    category: 'video_shorts',
    allowsDiscordAddon: false, // KURAL: Shorts paketlerinde Discord duyurusu KESİNLİKLE gösterilmez
    description: 'Dikey içerikte hızlı, algoritmada yüksek izlenmeye ulaşan dinamik marka görünürlüğü.',
    highlights: [
      'YouTube Shorts videolarında video içi logo & ürün görseli',
      'İlk yorumda sabitlenmiş (pinned) yönlendirme linki',
      'Video açıklamasında ilk 2 satırda doğrudan bağlantı',
      'Mobil odaklı genç ve dinamik Roblox kitlesi'
    ],
    recommended: false,
    reachEstimate: '15.000 – 60.000+ Dikey Gösterim'
  },
  {
    id: 'standart',
    title: 'Standart Video Sponsorluğu',
    basePrice: 50,
    priceLabel: '50 TL',
    badge: 'Süreklilik',
    category: 'video_long',
    allowsDiscordAddon: true,
    description: 'Kalıcı video alt bant sponsorluğu, video açıklaması ve sabit yorum yerleşimi.',
    highlights: [
      'Video boyunca alt bantta sabit sponsor banner & logo yerleşimi',
      'Açıklamanın ilk satırlarında özel başlık ve yönlendirme linki',
      'Sabitlenmiş yorumda doğrudan katılım bağlantısı',
      'Kanalda kalıcı video varlığı (içerik silinmez)'
    ],
    discordAddon: {
      price: 110,
      discountAmount: 30,
      discountPercent: 21,
      tag: '₺30 Avantaj',
      description: 'Reklam bağlantınız topluluğumuzun Discord sunucusunda özel bir duyuru olarak paylaşılır.',
      advantageNote: 'Standart paket avantajı: Discord duyurusu ₺30 daha uygun.'
    },
    recommended: false,
    reachEstimate: '8.000 – 25.000+ Kalıcı İzlenme'
  },
  {
    id: 'midroll',
    title: 'Sesli Mid-Roll Anlatım',
    basePrice: 100,
    priceLabel: '100 TL',
    badge: 'En Çok Tercih Edilen',
    category: 'video_long',
    allowsDiscordAddon: true,
    description: 'Videonun en dikkat çekici anında 20–30 saniyelik doğal sesli & görüntülü anlatım.',
    highlights: [
      'Videonun akışına entegre 20–30 sn sesli ve görüntülü tanıtım bölümü',
      'Tüm video boyunca alt bant sponsorluk yerleşimi',
      'Açıklamada ve sabitlenmiş yorumda öncelikli çağrı metni (CTA)',
      'İzleyicinin dikkatini dağıtmayan yüksek dönüşümlü kurgu'
    ],
    discordAddon: {
      price: 80,
      discountAmount: 60,
      discountPercent: 43,
      tag: '₺60 Avantaj',
      description: 'Reklam bağlantınız topluluğumuzun Discord sunucusunda özel bir duyuru olarak paylaşılır.',
      advantageNote: 'Bu paketle Discord duyurusunda %43 (₺60) avantaj.'
    },
    recommended: true,
    reachEstimate: '15.000 – 40.000+ Yüksek Odaklı İzlenme'
  },
  {
    id: 'gold',
    title: 'Gold Kombin',
    basePrice: 350,
    priceLabel: '350 TL',
    badge: 'Çok Kanallı Güç',
    category: 'bundle',
    allowsDiscordAddon: true,
    description: 'Uzun video alt bant + Sesli Mid-Roll + Shorts ve YouTube Topluluk paylaşımı birlikte.',
    highlights: [
      'Uzun videoda alt bant sponsorluğu + Sesli Mid-Roll reklam',
      '1 Adet YouTube Shorts dikey reklam videosu',
      'YouTube Topluluk sekmesinde yüz binlere ulaşan anket/paylaşım',
      '3 farklı kanaldan eş zamanlı kitle akışı ve etkileşim'
    ],
    discordAddon: {
      price: 50,
      discountAmount: 90,
      discountPercent: 64,
      tag: '₺90 Avantaj',
      description: 'Reklam bağlantınız topluluğumuzun Discord sunucusunda özel bir duyuru olarak paylaşılır.',
      advantageNote: 'Gold paket avantajı: Discord duyurusu ₺90 daha uygun.'
    },
    recommended: false,
    reachEstimate: '50.000 – 120.000+ Çoklu Kitle'
  },
  {
    id: 'mega',
    title: 'Mega Etkileşim',
    basePrice: 500,
    priceLabel: '500 TL',
    badge: '360° Görünürlük',
    category: 'bundle',
    allowsDiscordAddon: true,
    description: 'YouTube Video + Shorts + Topluluk ve Discord sunucusunda 360° tam kapsamlı reklam.',
    highlights: [
      'Uzun video alt bant + Video içi sesli Mid-Roll reklam arası',
      '1 Adet YouTube Shorts dikey tanıtım videosu',
      'YouTube Topluluk sekmesinde özel anket + görsel tanıtım',
      'Discord sunucumuzda @everyone bildirimli özel sponsorluk duyurusu (dahil)'
    ],
    discordAddon: {
      price: 30,
      discountAmount: 110,
      discountPercent: 79,
      tag: '₺110 Avantaj',
      description: 'Mevcut pakete ek olarak 2. özel Discord duyurusu ve kalıcı öne çıkarma.',
      advantageNote: 'Mega paket avantajı: Ek Discord duyurusu yalnızca ₺30.'
    },
    recommended: false,
    reachEstimate: '80.000 – 200.000+ Çoklu Platform Gösterimi'
  },
  {
    id: 'vip',
    title: 'Çekilişli VIP Kapsam',
    basePrice: 670,
    priceLabel: '670 TL',
    badge: 'Garantili Katılım',
    category: 'bundle',
    allowsDiscordAddon: true,
    description: 'Mega kapsam + topluluk odaklı özel çekiliş kurgusu ve garantili üye/ziyaretçi akışı.',
    highlights: [
      'Tüm Mega paket içerikleri (Uzun video, Mid-roll, Shorts, Topluluk)',
      'Roblox grubu / Discord katılım şartlı özel çekiliş kurgusu',
      'Discord sunucusunda özel sponsor rolü ve kalıcı link alanı',
      'VIP öncelikli yayın takvimi ve detaylı teslim raporu'
    ],
    discordAddon: {
      price: 20,
      discountAmount: 120,
      discountPercent: 86,
      tag: '₺120 Avantaj',
      description: 'Mevcut pakete ek olarak 2. özel Discord duyurusu ve kalıcı öne çıkarma.',
      advantageNote: 'VIP paket avantajı: Ek Discord duyurusu yalnızca ₺20.'
    },
    recommended: false,
    reachEstimate: 'En Yüksek Topluluk Katılımı & Üye Artışı'
  }
];

/**
 * Kendi Paketini Oluştur (Custom Package Builder) Modülleri
 */
const CUSTOM_MODULES = {
  // 1. Ana Format Seçimi (Tekli seçim)
  mainFormat: {
    id: 'mainFormat',
    title: 'Ana Yayın Formatı',
    required: false,
    type: 'single',
    options: [
      {
        id: 'fmt_none',
        title: 'Video İstemiyorum',
        subtitle: 'Yalnızca Discord ve topluluk kanallarında tanıtım',
        price: 0,
        category: 'none'
      },
      {
        id: 'fmt_shorts',
        title: 'YouTube Shorts Tanıtımı',
        subtitle: 'Dikey formatta hızlı ve dinamik marka gösterimi',
        price: 30,
        category: 'shorts'
      },
      {
        id: 'fmt_video_standard',
        title: 'Uzun Video Alt Bant & Banner',
        subtitle: 'Video boyunca sabit alt bant sponsorluk yazısı/logosu',
        price: 50,
        category: 'long_standard'
      },
      {
        id: 'fmt_video_midroll',
        title: 'Uzun Video Sesli Mid-Roll',
        subtitle: 'Videonun akışında 20–30 saniyelik sesli & görüntülü anlatım',
        price: 100,
        category: 'long_midroll'
      }
    ]
  },

  // 2. Video İçi Süre & Kurgu (Yalnızca uzun video seçildiğinde aktif)
  videoPacing: {
    id: 'videoPacing',
    title: 'Video İçi Kurgu Derinliği',
    requiredIf: ['fmt_video_standard', 'fmt_video_midroll'],
    type: 'single',
    options: [
      {
        id: 'pacing_standard',
        title: 'Standart Anlatım (20–30 sn)',
        subtitle: 'Özlü, net ve vurucu mesaj iletimi',
        price: 0
      },
      {
        id: 'pacing_extended',
        title: 'Genişletilmiş Anlatım (45–60 sn)',
        subtitle: 'Oyun içi özellikler ve detaylı inceleme kesiti',
        price: 45
      },
      {
        id: 'pacing_gameplay',
        title: 'Özel Oynanış / Deneyim Bölümü (2–3 dk)',
        subtitle: 'Videonun bir bölümünün doğrudan sunucunuza ayrılması',
        price: 90
      }
    ]
  },

  // 3. Dağıtım ve Ek Görünürlük Seçenekleri (Çoklu seçim)
  addons: [
    {
      id: 'addon_pinned_comment',
      title: 'Sabitlenmiş Yorum Bağlantısı',
      subtitle: 'Video altında ilk yorumda kalıcı CTA bağlantısı',
      price: 20
    },
    {
      id: 'addon_desc_link',
      title: 'Açıklama Üst Sıra Bağlantısı',
      subtitle: 'Video açıklamasında en üstte doğrudan tıklanabilir link',
      price: 15
    },
    {
      id: 'addon_community_post',
      title: 'YouTube Topluluk Anketi / Görsel Paylaşımı',
      subtitle: 'Yüz binlerce aboneye ulaşan topluluk sekmesinde özel anket ve duyuru',
      price: 60
    },
    {
      id: 'addon_discord_announcement',
      title: 'Discord Topluluk Duyurusu',
      subtitle: 'EkoYıldız Discord sunucusunda özel bildirimli sponsorluk duyurusu',
      isDiscordDynamic: true,
      price: BASE_DISCORD_ANNOUNCEMENT_PRICE
    },
    {
      id: 'addon_giveaway',
      title: 'Topluluk Çekilişi & Özel Katılım Kurgusu',
      subtitle: 'Topluluk içi çekilişle organik üye ve oyuncu yönlendirmesi',
      price: 120
    },
    {
      id: 'addon_live_stream',
      title: 'Canlı Yayında / Etkinlikte Özel Anons',
      subtitle: 'Haftalık yayınlarda veya etkinliklerde canlı sesli tanıtım',
      price: 80
    }
  ]
};

/**
 * Bir video paketine göre dinamik Discord duyuru fiyatını hesaplar.
 * @param {string} packageId - 'shorts' | 'standart' | 'midroll' | 'gold' | 'mega' | 'vip'
 * @returns {object|null} Fiyat bilgisi ve avantaj etiketi veya izin verilmiyorsa null
 */
function getDiscordAddonForPackage(packageId) {
  const pkg = PRESET_PACKAGES.find(p => p.id === packageId);
  if (!pkg || !pkg.allowsDiscordAddon || !pkg.discordAddon) {
    return null;
  }
  return {
    packageId: pkg.id,
    packageTitle: pkg.title,
    basePrice: BASE_DISCORD_ANNOUNCEMENT_PRICE,
    addonPrice: pkg.discordAddon.price,
    discountAmount: pkg.discordAddon.discountAmount,
    discountPercent: pkg.discordAddon.discountPercent,
    tag: pkg.discordAddon.tag,
    description: pkg.discordAddon.description,
    advantageNote: pkg.discordAddon.advantageNote
  };
}

/**
 * Custom Package Fiyatlandırma Hesaplayıcı
 * @param {object} selections - { formatId, pacingId, addonIds: [] }
 * @returns {object} { subtotal, discount, total, breakdown, isValid }
 */
function calculateCustomPackagePrice(selections = {}) {
  const formatId = selections.formatId || 'fmt_none';
  const pacingId = selections.pacingId || 'pacing_standard';
  const addonIds = Array.isArray(selections.addonIds) ? selections.addonIds : [];

  const breakdown = [];
  let subtotal = 0;

  // 1. Ana format
  const formatOpt = CUSTOM_MODULES.mainFormat.options.find(o => o.id === formatId);
  if (formatOpt && formatOpt.price > 0) {
    subtotal += formatOpt.price;
    breakdown.push({
      id: formatOpt.id,
      title: formatOpt.title,
      price: formatOpt.price
    });
  }

  // 2. Video içi süre (eğer video seçildiyse)
  const isVideoSelected = formatId === 'fmt_video_standard' || formatId === 'fmt_video_midroll';
  if (isVideoSelected) {
    const pacingOpt = CUSTOM_MODULES.videoPacing.options.find(o => o.id === pacingId);
    if (pacingOpt && pacingOpt.price > 0) {
      subtotal += pacingOpt.price;
      breakdown.push({
        id: pacingOpt.id,
        title: pacingOpt.title,
        price: pacingOpt.price
      });
    }
  }

  // 3. Addonlar (Discord dinamik fiyat dahil)
  for (const addonId of addonIds) {
    const addon = CUSTOM_MODULES.addons.find(a => a.id === addonId);
    if (!addon) continue;

    let effectivePrice = addon.price;
    let note = null;

    if (addon.isDiscordDynamic) {
      // Dinamik Discord duyurusu: seçilen video formatına göre avantaj kazanır
      if (formatId === 'fmt_video_midroll') {
        effectivePrice = 80;
        note = 'Mid-Roll avantajı: ₺60 indirimli';
      } else if (formatId === 'fmt_video_standard') {
        effectivePrice = 110;
        note = 'Standart video avantajı: ₺30 indirimli';
      } else {
        effectivePrice = BASE_DISCORD_ANNOUNCEMENT_PRICE;
      }
    }

    subtotal += effectivePrice;
    breakdown.push({
      id: addon.id,
      title: addon.title,
      price: effectivePrice,
      note
    });
  }

  // 4. Akıllı Paket Avantajı (Kombinasyon İndirimi):
  // Seçilen toplam ücretli kalem sayısı arttıkça paket avantajı devreye girer
  const totalItemsCount = breakdown.length;
  let discount = 0;
  let discountReason = null;

  if (totalItemsCount >= 4) {
    discount = Math.round(subtotal * 0.15); // %15 avantaj
    discountReason = '4+ Hizmet Kombinasyon Avantajı (%15)';
  } else if (totalItemsCount >= 3) {
    discount = Math.round(subtotal * 0.10); // %10 avantaj
    discountReason = '3 Hizmet Paket Avantajı (%10)';
  }

  const total = Math.max(0, subtotal - discount);
  const isValid = totalItemsCount > 0 && total > 0;

  return {
    subtotal,
    discount,
    discountReason,
    total,
    breakdown,
    totalItemsCount,
    isValid
  };
}

/**
 * Ödeme Yöntemleri ve Komisyon Yapılandırması
 */
const PAYMENT_METHODS = {
  papara: {
    id: 'papara',
    title: 'Papara ile Ödeme',
    badge: '0 TL Komisyon',
    fee: 0,
    feeLabel: '0 TL (Komisyonsuz)',
    paparaNumber: '1947291842',
    accountHolder: 'Alp Ç. / EkoYıldız Topluluğu',
    highlights: [
      'Ek işlem ücreti veya komisyon alınmaz (0 TL)',
      'Hızlı ve anında hesap onayı',
      'Mobil Papara uygulamasından tek dokunuşla transfer'
    ],
    description: 'Papara numarasına doğrudan ödeme yaparak ek işlem ücreti ödemeden işleminizi tamamlayabilirsiniz.',
    trustNote: 'Ödemeniz doğrudan resmî hesap tarafından doğrulanır.'
  },
  itemsatis: {
    id: 'itemsatis',
    title: 'İtemSatış ile Ödeme',
    badge: '+5 TL İşlem Ücreti',
    fee: 5,
    feeLabel: '+5 TL İşlem Ücreti',
    platformUrl: 'https://www.itemsatis.com',
    highlights: [
      'İtemSatış platform altyapısı üzerinden güvenli ödeme',
      'Kart, havale/EFT ve platform bakiyesi desteği',
      'Şeffaf +5 TL işlem/hizmet bedeli yansıtılır'
    ],
    description: 'Ödeme İtemSatış güvencesiyle platform üzerinden gerçekleştirilebilir.',
    trustNote: 'İtemSatış üzerinden yapılan ödemelerde platform işlem/komisyon bedeli (+5 TL) şeffaf olarak fiyata eklenir.'
  }
};

/**
 * Ödeme yöntemi komisyonunu hesaplar
 */
function calculatePaymentTotal(amount, method = 'papara') {
  const numericAmount = Math.max(0, Number(amount) || 0);
  const config = PAYMENT_METHODS[method] || PAYMENT_METHODS.papara;
  const fee = config.fee;
  const total = numericAmount + fee;

  return {
    method: config.id,
    baseAmount: numericAmount,
    fee,
    feeLabel: config.feeLabel,
    total,
    title: config.title,
    description: config.description
  };
}

module.exports = {
  BASE_DISCORD_ANNOUNCEMENT_PRICE,
  PRESET_PACKAGES,
  CUSTOM_MODULES,
  PAYMENT_METHODS,
  getDiscordAddonForPackage,
  calculateCustomPackagePrice,
  calculatePaymentTotal
};

