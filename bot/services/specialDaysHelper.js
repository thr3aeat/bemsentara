'use strict';

/**
 * Türkiye'de kutlanan resmi, dini, milli, mesleki ve özel günlerin kapsamlı takvim veritabanı.
 * Sabit günler (Miladi), Dinamik günler (Anneler Günü, Babalar Günü) ve Dini Günler (Hicri/Diyanet) içerir.
 */

// Yıllara göre Dini Günler Takvimi (Miladi Karşılıkları)
const RELIGIOUS_DAYS_BY_YEAR = {
  2024: [
    { name: "Regaib Kandili", month: 0, day: 11, emoji: "✨", color: 0xf39c12, desc: "Üç ayların başlangıcı ve Regaib Kandili" },
    { name: "Miraç Kandili", month: 1, day: 6, emoji: "✨", color: 0xf39c12, desc: "Peygamber Efendimiz'in göğe yükselişi ve Miraç Kandili" },
    { name: "Berat Kandili", month: 1, day: 24, emoji: "✨", color: 0xf39c12, desc: "Af ve mağfiret gecesi Berat Kandili" },
    { name: "Kadir Gecesi", month: 3, day: 5, emoji: "🌙", color: 0x9b59b6, desc: "Bin aydan daha hayırlı Kadir Gecesi" },
    { name: "Ramazan Bayramı Arifesi", month: 3, day: 9, emoji: "🍬", color: 0x1abc9c, desc: "Ramazan Bayramı Arifesi" },
    { name: "Ramazan Bayramı 1. Gün", month: 3, day: 10, emoji: "🍬", color: 0x1abc9c, desc: "Mübarek Ramazan Bayramı" },
    { name: "Ramazan Bayramı 2. Gün", month: 3, day: 11, emoji: "🍬", color: 0x1abc9c, desc: "Ramazan Bayramı 2. Günü" },
    { name: "Ramazan Bayramı 3. Gün", month: 3, day: 12, emoji: "🍬", color: 0x1abc9c, desc: "Ramazan Bayramı 3. Günü" },
    { name: "Kurban Bayramı Arifesi", month: 5, day: 15, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı Arifesi" },
    { name: "Kurban Bayramı 1. Gün", month: 5, day: 16, emoji: "🐑", color: 0x27ae60, desc: "Mübarek Kurban Bayramı" },
    { name: "Kurban Bayramı 2. Gün", month: 5, day: 17, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı 2. Günü" },
    { name: "Kurban Bayramı 3. Gün", month: 5, day: 18, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı 3. Günü" },
    { name: "Kurban Bayramı 4. Gün", month: 5, day: 19, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı 4. Günü" },
    { name: "Aşure Günü", month: 6, day: 16, emoji: "🥣", color: 0xe67e22, desc: "Muharrem ayının 10. günü, Aşure Günü" },
    { name: "Mevlid Kandili", month: 8, day: 14, emoji: "✨", color: 0xf39c12, desc: "Peygamber Efendimiz'in dünyaya teşrifi, Mevlid Kandili" },
  ],
  2025: [
    { name: "Regaib Kandili", month: 0, day: 2, emoji: "✨", color: 0xf39c12, desc: "Üç ayların başlangıcı ve Regaib Kandili" },
    { name: "Miraç Kandili", month: 0, day: 26, emoji: "✨", color: 0xf39c12, desc: "Peygamber Efendimiz'in göğe yükselişi ve Miraç Kandili" },
    { name: "Berat Kandili", month: 1, day: 13, emoji: "✨", color: 0xf39c12, desc: "Af ve mağfiret gecesi Berat Kandili" },
    { name: "Kadir Gecesi", month: 2, day: 26, emoji: "🌙", color: 0x9b59b6, desc: "Bin aydan daha hayırlı Kadir Gecesi" },
    { name: "Ramazan Bayramı Arifesi", month: 2, day: 29, emoji: "🍬", color: 0x1abc9c, desc: "Ramazan Bayramı Arifesi" },
    { name: "Ramazan Bayramı 1. Gün", month: 2, day: 30, emoji: "🍬", color: 0x1abc9c, desc: "Mübarek Ramazan Bayramı" },
    { name: "Ramazan Bayramı 2. Gün", month: 2, day: 31, emoji: "🍬", color: 0x1abc9c, desc: "Ramazan Bayramı 2. Günü" },
    { name: "Ramazan Bayramı 3. Gün", month: 3, day: 1, emoji: "🍬", color: 0x1abc9c, desc: "Ramazan Bayramı 3. Günü" },
    { name: "Kurban Bayramı Arifesi", month: 5, day: 5, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı Arifesi" },
    { name: "Kurban Bayramı 1. Gün", month: 5, day: 6, emoji: "🐑", color: 0x27ae60, desc: "Mübarek Kurban Bayramı" },
    { name: "Kurban Bayramı 2. Gün", month: 5, day: 7, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı 2. Günü" },
    { name: "Kurban Bayramı 3. Gün", month: 5, day: 8, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı 3. Günü" },
    { name: "Kurban Bayramı 4. Gün", month: 5, day: 9, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı 4. Günü" },
    { name: "Aşure Günü", month: 6, day: 5, emoji: "🥣", color: 0xe67e22, desc: "Muharrem ayının 10. günü, Aşure Günü" },
    { name: "Mevlid Kandili", month: 8, day: 3, emoji: "✨", color: 0xf39c12, desc: "Peygamber Efendimiz'in dünyaya teşrifi, Mevlid Kandili" },
  ],
  2026: [
    { name: "Regaib Kandili", month: 11, day: 25, emoji: "✨", color: 0xf39c12, desc: "Üç ayların başlangıcı ve Regaib Kandili" },
    { name: "Miraç Kandili", month: 0, day: 15, emoji: "✨", color: 0xf39c12, desc: "Peygamber Efendimiz'in göğe yükselişi ve Miraç Kandili" },
    { name: "Berat Kandili", month: 1, day: 2, emoji: "✨", color: 0xf39c12, desc: "Af ve mağfiret gecesi Berat Kandili" },
    { name: "Kadir Gecesi", month: 2, day: 16, emoji: "🌙", color: 0x9b59b6, desc: "Bin aydan daha hayırlı Kadir Gecesi" },
    { name: "Ramazan Bayramı Arifesi", month: 2, day: 19, emoji: "🍬", color: 0x1abc9c, desc: "Ramazan Bayramı Arifesi" },
    { name: "Ramazan Bayramı 1. Gün", month: 2, day: 20, emoji: "🍬", color: 0x1abc9c, desc: "Mübarek Ramazan Bayramı" },
    { name: "Ramazan Bayramı 2. Gün", month: 2, day: 21, emoji: "🍬", color: 0x1abc9c, desc: "Ramazan Bayramı 2. Günü" },
    { name: "Ramazan Bayramı 3. Gün", month: 2, day: 22, emoji: "🍬", color: 0x1abc9c, desc: "Ramazan Bayramı 3. Günü" },
    { name: "Kurban Bayramı Arifesi", month: 4, day: 26, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı Arifesi" },
    { name: "Kurban Bayramı 1. Gün", month: 4, day: 27, emoji: "🐑", color: 0x27ae60, desc: "Mübarek Kurban Bayramı" },
    { name: "Kurban Bayramı 2. Gün", month: 4, day: 28, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı 2. Günü" },
    { name: "Kurban Bayramı 3. Gün", month: 4, day: 29, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı 3. Günü" },
    { name: "Kurban Bayramı 4. Gün", month: 4, day: 30, emoji: "🐑", color: 0x27ae60, desc: "Kurban Bayramı 4. Günü" },
    { name: "Aşure Günü", month: 5, day: 25, emoji: "🥣", color: 0xe67e22, desc: "Muharrem ayının 10. günü, Aşure Günü" },
    { name: "Mevlid Kandili", month: 7, day: 24, emoji: "✨", color: 0xf39c12, desc: "Peygamber Efendimiz'in dünyaya teşrifi, Mevlid Kandili" },
  ],
  2027: [
    { name: "Miraç Kandili", month: 0, day: 4, emoji: "✨", color: 0xf39c12, desc: "Peygamber Efendimiz'in göğe yükselişi ve Miraç Kandili" },
    { name: "Berat Kandili", month: 0, day: 22, emoji: "✨", color: 0xf39c12, desc: "Af ve mağfiret gecesi Berat Kandili" },
    { name: "Kadir Gecesi", month: 2, day: 5, emoji: "🌙", color: 0x9b59b6, desc: "Bin aydan daha hayırlı Kadir Gecesi" },
    { name: "Ramazan Bayramı 1. Gün", month: 2, day: 9, emoji: "🍬", color: 0x1abc9c, desc: "Mübarek Ramazan Bayramı" },
    { name: "Kurban Bayramı 1. Gün", month: 4, day: 16, emoji: "🐑", color: 0x27ae60, desc: "Mübarek Kurban Bayramı" },
    { name: "Aşure Günü", month: 5, day: 14, emoji: "🥣", color: 0xe67e22, desc: "Muharrem ayının 10. günü, Aşure Günü" },
    { name: "Mevlid Kandili", month: 7, day: 13, emoji: "✨", color: 0xf39c12, desc: "Peygamber Efendimiz'in dünyaya teşrifi, Mevlid Kandili" },
  ]
};

// Sabit Özel Günler Sözlüğü: "AY_GÜN" (Ay: 0-11, Gün: 1-31)
const FIXED_SPECIAL_DAYS = {
  // Ocak
  "0_1": {
    name: "Yılbaşı",
    type: "official_holiday",
    emoji: "🎆",
    color: 0xf1c40f,
    desc: "Yeni Yılın İlk Günü - Resmi Tatil",
    quote: "Yeni yılın ülkemize, milletimize ve tüm insanlığa sağlık, huzur, barış ve mutluluk getirmesini dileriz.",
    isMourning: false
  },
  "0_10": {
    name: "10 Ocak Çalışan Gazeteciler Günü",
    type: "professional",
    emoji: "📰",
    color: 0x3498db,
    desc: "Basın ve Medya Emekçileri Günü",
    quote: "Basın, milletin müşterek sesidir. Bir milleti aydınlatma ve irşatta basının rolü büyüktür. — M. Kemal Atatürk",
    isMourning: false
  },

  // Şubat
  "1_14": {
    name: "14 Şubat Sevgililer Günü",
    type: "social",
    emoji: "❤️",
    color: 0xe84393,
    desc: "Sevgi, Muhabbet ve Gönül Bağı Günü",
    quote: "Sevgi insanı hayata bağlayan en güçlü bağdır.",
    isMourning: false
  },

  // Mart
  "2_8": {
    name: "8 Mart Dünya Kadınlar Günü",
    type: "social",
    emoji: "💐",
    color: 0xf368e0,
    desc: "Dünya Emekçi Kadınlar Günü",
    quote: "Dünyada her şey kadının eseridir. Ey kahraman Türk kadını, sen yerde sürünmeye değil, omuzlar üzerinde göklere yükselmeye layıksın! — M. Kemal Atatürk",
    isMourning: false
  },
  "2_12": {
    name: "12 Mart İstiklal Marşı'nın Kabulü ve Mehmet Âkif Ersoy'u Anma Günü",
    type: "national_memorial",
    emoji: "📜",
    color: 0xc0392b,
    desc: "İstiklal Marşı'nın TBMM Tarafından Kabulü (1921)",
    quote: "Allah bu millete bir daha İstiklal Marşı yazdırmasın! — Mehmet Âkif Ersoy",
    isMourning: false
  },
  "2_14": {
    name: "14 Mart Tıp Bayramı",
    type: "professional",
    emoji: "🩺",
    color: 0x00cec9,
    desc: "Sağlık ve Tıp Çalışanları Günü",
    quote: "Beni Türk hekimlerine emanet ediniz. — M. Kemal Atatürk",
    isMourning: false
  },
  "2_18": {
    name: "18 Mart Çanakkale Zaferi ve Şehitleri Anma Günü",
    type: "national_victory",
    emoji: "🇹🇷",
    color: 0xff0000,
    desc: "Çanakkale Deniz Zaferi ve Aziz Şehitlerimizi Anma Günü",
    quote: "Çanakkale Zaferi, Türk askerinin ruh kudretini gösteren şayanı hayret ve tebrik bir misaldir. Çanakkale Geçilmez! — M. Kemal Atatürk",
    isMourning: false
  },
  "2_21": {
    name: "21 Mart Nevruz Bayramı / Dünya Ormancılık Günü",
    type: "cultural_nature",
    emoji: "🌸",
    color: 0x2ecc71,
    desc: "Baharın Müjdecisi Nevruz & Ormancılık Günü",
    quote: "Doğayı ve ağacı korumak, geleceği korumaktır.",
    isMourning: false
  },
  "2_27": {
    name: "27 Mart Dünya Tiyatro Günü",
    type: "art",
    emoji: "🎭",
    color: 0x9b59b6,
    desc: "Sanat ve Sahne Emekçileri Günü",
    quote: "Sanatsız kalan bir milletin hayat damarlarından biri kopmuş demektir. — M. Kemal Atatürk",
    isMourning: false
  },

  // Nisan
  "3_5": {
    name: "5 Nisan Avukatlar Günü",
    type: "professional",
    emoji: "⚖️",
    color: 0x6c5ce7,
    desc: "Hukuk ve Adalet Savunucuları Günü",
    quote: "Adalet mülkün temelidir.",
    isMourning: false
  },
  "3_10": {
    name: "10 Nisan Polis Teşkilatı Kuruluş Günü (Polis Haftası)",
    type: "security",
    emoji: "👮",
    color: 0x0984e3,
    desc: "Türk Polis Teşkilatı'nın Kuruluş Yıldönümü",
    quote: "Polis, kanunun şefkatli eli ve huzurun teminatıdır.",
    isMourning: false
  },
  "3_23": {
    name: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı",
    type: "official_national_holiday",
    emoji: "🇹🇷",
    color: 0xff0000,
    desc: "TBMM'nin Açılışı ve Dünyanın İlk Çocuk Bayramı - Resmi Tatil",
    quote: "Egemenlik, kayıtsız şartsız milletindir! Küçük hanımlar, küçük beyler! Sizler hepiniz geleceğin bir gülü, yıldızı ve ikbal ışığısınız. — M. Kemal Atatürk",
    isMourning: false
  },

  // Mayıs
  "4_1": {
    name: "1 Mayıs Emek ve Dayanışma Günü",
    type: "official_holiday",
    emoji: "🛠️",
    color: 0xd63031,
    desc: "İşçi ve Emekçi Bayramı - Resmi Tatil",
    quote: "En büyük erdem çalışmak ve üretmektir. Alın teri döken tüm emekçilerimizin günü kutlu olsun.",
    isMourning: false
  },
  "4_12": {
    name: "12 Mayıs Hemşireler Günü (Hemşirelik Haftası)",
    type: "professional",
    emoji: "👩‍⚕️",
    color: 0x00b894,
    desc: "Sağlık Ordumuzun Fedakar Neferleri Hemşireler Günü",
    quote: "İnsan hayatını korumak için gece gündüz özveriyle çalışan hemşirelerimize minnettarız.",
    isMourning: false
  },
  "4_19": {
    name: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı",
    type: "official_national_holiday",
    emoji: "🇹🇷",
    color: 0xff0000,
    desc: "Kurtuluş Meşalesinin Samsun'da Yakılışı - Resmi Tatil",
    quote: "Ey yükselen yeni nesil! İstikbal sizsiniz. Cumhuriyeti biz kurduk, onu yükseltecek ve yaşatacak olan sizsiniz! — M. Kemal Atatürk",
    isMourning: false
  },
  "4_29": {
    name: "29 Mayıs İstanbul'un Fethi",
    type: "history_victory",
    emoji: "⚔️",
    color: 0x8e44ad,
    desc: "İstanbul'un Fethi ve Bir Çağın Kapanıp Yeni Çağın Açılışı (1453)",
    quote: "Ya ben İstanbul'u alırım, ya İstanbul beni! — Fatih Sultan Mehmet Han",
    isMourning: false
  },

  // Haziran
  "5_5": {
    name: "5 Haziran Dünya Çevre Günü",
    type: "nature",
    emoji: "🌍",
    color: 0x27ae60,
    desc: "Doğayı, Suyu ve Çevreyi Koruma Günü",
    quote: "Tabiat ile uyum içinde yaşamak medeniyetin en yüksek göstergesidir.",
    isMourning: false
  },

  // Temmuz
  "6_1": {
    name: "1 Temmuz Denizcilik ve Kabotaj Bayramı",
    type: "national_maritime",
    emoji: "⚓",
    color: 0x0984e3,
    desc: "Türk Karasularında Egemenliğin Tescili ve Denizcilik Bayramı",
    quote: "Denizciliği Türk'ün büyük milli ülküsü olarak düşünmeli ve onu az zamanda başarmalıyız. — M. Kemal Atatürk",
    isMourning: false
  },
  "6_15": {
    name: "15 Temmuz Demokrasi ve Milli Birlik Günü",
    type: "official_holiday",
    emoji: "🇹🇷",
    color: 0xc0392b,
    desc: "Milli İrade ve Şehitleri Anma Günü - Resmi Tatil",
    quote: "Milletimizin birlik ve beraberliği, bağımsızlığımızın ebedi teminatıdır.",
    isMourning: false
  },

  // Ağustos
  "7_26": {
    name: "26 Ağustos Malazgirt Zaferi & Büyük Taarruz Başlangıcı",
    type: "history_victory",
    emoji: "⚔️",
    color: 0xd35400,
    desc: "Anadolu'nun Kapılarını Açan Malazgirt Zaferi (1071) & Büyük Taarruz (1922)",
    quote: "Size öyle bir vatan bıraktım ki; ebediyen sizin olacaktır! — Sultan Alparslan",
    isMourning: false
  },
  "7_30": {
    name: "30 Ağustos Zafer Bayramı",
    type: "official_national_holiday",
    emoji: "🇹🇷",
    color: 0xff0000,
    desc: "Başkomutanlık Meydan Muharebesi Büyük Zaferi - Resmi Tatil",
    quote: "Ordular! İlk hedefiniz Akdeniz'dir, ileri! Türk milleti bağımsızlığından asla taviz vermez. — M. Kemal Atatürk",
    isMourning: false
  },

  // Eylül
  "8_19": {
    name: "19 Eylül Gaziler Günü",
    type: "veterans",
    emoji: "🎖️",
    color: 0xb71540,
    desc: "Kahraman Gazilerimizi Minnetle Anma Günü",
    quote: "Gaziler yaşayan anıtlardır. Vatan size minnettardır!",
    isMourning: false
  },

  // Ekim
  "9_4": {
    name: "4 Ekim Dünya Hayvanları Koruma Günü",
    type: "animals",
    emoji: "🐾",
    color: 0xf39c12,
    desc: "Sessiz Dostlarımızı Koruma ve Yaşatma Günü",
    quote: "Bir milletin büyüklüğü ve ahlaki gelişimi, hayvanlara olan davranış biçimiyle değerlendirilir.",
    isMourning: false
  },
  "9_28": {
    name: "28 Ekim Cumhuriyet Bayramı Arifesi",
    type: "national_pre",
    emoji: "🇹🇷",
    color: 0xe74c3c,
    desc: "Cumhuriyetimizin İlanı Arifesi (13:00'ten itibaren)",
    quote: "Efendiler! Yarın Cumhuriyeti ilan edeceğiz! — M. Kemal Atatürk (28 Ekim 1923)",
    isMourning: false
  },
  "9_29": {
    name: "29 Ekim Cumhuriyet Bayramı",
    type: "official_national_holiday",
    emoji: "🇹🇷",
    color: 0xff0000,
    desc: "Cumhuriyetimizin Kuruluşunun En Büyük Bayramı - Resmi Tatil",
    quote: "Cumhuriyet, fikren, ilmen, fennen, bedenen kuvvetli ve yüksek seciyeli muhafızlar ister. Yaşasın Cumhuriyet! — M. Kemal Atatürk",
    isMourning: false
  },

  // Kasım
  "10_10": {
    name: "10 Kasım Atatürk'ü Anma Günü",
    type: "memorial_mourning",
    emoji: "🖤",
    color: 0x1e272e,
    desc: "Gazi Mustafa Kemal Atatürk'ün Ebediyete İntikali (09:05 Saygı Duruşu)",
    quote: "Beni görmek demek mutlaka yüzümü görmek demek değildir. Benim fikirlerimi, benim duygularımı anlıyorsanız ve hissediyorsanız bu kafidir. — M. Kemal Atatürk",
    isMourning: true
  },
  "10_24": {
    name: "24 Kasım Öğretmenler Günü",
    type: "professional_education",
    emoji: "📚",
    color: 0x0984e3,
    desc: "Millet Mektepleri Başöğretmenliği ve Geleceği Aydınlatan Öğretmenler Günü",
    quote: "Öğretmenler! Yeni nesil, cumhuriyetin fedakar öğretmen ve eğitimcileri, sizler yetiştireceksiniz. Yeni nesil sizin eseriniz olacaktır! — M. Kemal Atatürk",
    isMourning: false
  },

  // Aralık
  "11_3": {
    name: "3 Aralık Dünya Engelliler Günü",
    type: "social_awareness",
    emoji: "♿",
    color: 0x6c5ce7,
    desc: "Engelsiz Bir Dünya ve Farkındalık Günü",
    quote: "En büyük engel sevgisizliktir. Engelsiz bir gelecek el ele mümkündür.",
    isMourning: false
  }
};

/**
 * Dinamik Özel Günleri (Anneler Günü, Babalar Günü, Özel Haftalar vb.) tespit eder.
 */
function getDynamicSpecialDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0 = Pazar

  // 1. Anneler Günü: Mayıs'ın 2. Pazarı (month === 4)
  if (month === 4 && dayOfWeek === 0) {
    // 8-14 arası Pazar günleri 2. pazardır
    if (day >= 8 && day <= 14) {
      return {
        name: "Anneler Günü",
        type: "social_family",
        emoji: "🌸",
        color: 0xf368e0,
        desc: "Başımızın Tacı, Karşılıksız Sevginin Timsali Annelerimiz",
        quote: "Cennet annelerin ayakları altındadır.",
        isMourning: false
      };
    }
  }

  // 2. Babalar Günü: Haziran'ın 3. Pazarı (month === 5)
  if (month === 5 && dayOfWeek === 0) {
    // 15-21 arası Pazar günleri 3. pazardır
    if (day >= 15 && day <= 21) {
      return {
        name: "Babalar Günü",
        type: "social_family",
        emoji: "👔",
        color: 0x3498db,
        desc: "Ailenin Çınarı ve Güven Kaynağı Babalarımız",
        quote: "Evlatlarına kol kanat geren tüm fedakar babalarımızın günü kutlu olsun.",
        isMourning: false
      };
    }
  }

  // 3. Kızılay Haftası: 29 Ekim - 4 Kasım (month === 9 && day === 29-31 || month === 10 && day <= 4)
  if ((month === 9 && day >= 29) || (month === 10 && day <= 4)) {
    // 29 Ekim Cumhuriyet Bayramı hariç diğer günlerde Kızılay Haftası vurgusu
    if (!(month === 9 && day === 29)) {
      return {
        name: "Kızılay Haftası (29 Ekim - 4 Kasım)",
        type: "thematic_week",
        emoji: "🩸",
        color: 0xe74c3c,
        desc: "İyiliğin ve Yardımlaşmanın Simgesi Türk Kızılayı Haftası",
        quote: "Kızılay kara gün dostudur. Kan bağışı hayat kurtarır.",
        isMourning: false
      };
    }
  }

  // 4. Yerli Malı Haftası: 12 - 18 Aralık (month === 11 && day >= 12 && day <= 18)
  if (month === 11 && day >= 12 && day <= 18) {
    return {
      name: "Tutum, Yatırım ve Türk Malları Haftası (Yerli Malı)",
      type: "thematic_week",
      emoji: "🍎",
      color: 0x27ae60,
      desc: "Yerli Üretim, Tasarruf ve Milli İktisat Bilinci Haftası",
      quote: "Yerli malı Türk'ün malı, her Türk onu kullanmalı!",
      isMourning: false
    };
  }

  // 5. Kütüphaneler Haftası: Mart ayının son haftası (25-31 Mart)
  if (month === 2 && day >= 25 && day <= 31) {
    return {
      name: "Kütüphaneler Haftası",
      type: "thematic_week",
      emoji: "📖",
      color: 0xf39c12,
      desc: "Kitap, Okuma ve Bilgi Hazinesi Kütüphaneler Haftası",
      quote: "Kitapsız yaşamak, kör, sağır ve dilsiz yaşamaktır. — Seneca",
      isMourning: false
    };
  }

  return null;
}

/**
 * Belirtilen tarih için geçerli olan özel günü döner (Varsa).
 * @param {Date} date
 * @returns {object|null}
 */
function getSpecialDayInfo(date = new Date()) {
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  // 1. Sabit Özel Gün Kontrolü
  const fixedKey = `${month}_${day}`;
  if (FIXED_SPECIAL_DAYS[fixedKey]) {
    return FIXED_SPECIAL_DAYS[fixedKey];
  }

  // 2. Dinamik Özel Gün / Hafta Kontrolü
  const dynamicDay = getDynamicSpecialDays(date);
  if (dynamicDay) {
    return dynamicDay;
  }

  // 3. Dini Gün / Kandil / Bayram Kontrolü
  const religiousList = RELIGIOUS_DAYS_BY_YEAR[year] || [];
  const foundRel = religiousList.find(r => r.month === month && r.day === day);
  if (foundRel) {
    return {
      name: foundRel.name,
      type: "religious",
      emoji: foundRel.emoji,
      color: foundRel.color,
      desc: foundRel.desc,
      quote: "Tüm İslam alemine hayırlar, huzur ve esenlikler getirmesini niyaz ederiz.",
      isMourning: false
    };
  }

  return null;
}

module.exports = {
  getSpecialDayInfo,
  FIXED_SPECIAL_DAYS,
  RELIGIOUS_DAYS_BY_YEAR
};
