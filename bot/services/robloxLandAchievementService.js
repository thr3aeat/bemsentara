"use strict";

const fs = require("fs");
const path = require("path");
const ComponentsV2Factory = require("../utils/componentsV2Factory");

const GUILD_ID = "1537407325290237973";
const DATA_FILE = path.join(__dirname, "../../data/robloxland_achievements.json");
const LEGACY_ACTIVITY_FILE = path.join(__dirname, "../../data/robloxland_user_activity.json");
const TICK_MS = 60 * 1000;

const ACHIEVEMENTS = [
  // ── Ses Başarımları (12) ──
  {
    key: "lone_wolf",
    name: "Yalnız Kurt",
    color: "#5865F2",
    description: "Seste 1 saat boyunca tek başına kalarak sessizliğin ve odağın gücünü kanıtladın. Kendi başına bir ordu!",
    test: p => (p.voice?.aloneMinutes || 0) >= 60
  },
  {
    key: "silent_night",
    name: "Sessiz Gece",
    color: "#191970",
    description: "Gece yarısı (00:00 - 05:00) ses odasında nöbet tuttun. Geceyi aydınlatan fener sensin!",
    test: p => (p.voice?.midnightMinutes || 0) >= 60
  },
  {
    key: "night_guard",
    name: "Gece Bekçisi",
    color: "#283593",
    description: "Gecenin karanlığında ses kanallarında tam 3 saat nöbet tuttun. RobloxLand sana emanet!",
    test: p => (p.voice?.nightMinutes || 0) >= 180
  },
  {
    key: "voice_regular",
    name: "Ses Müdavimi",
    color: "#7289DA",
    description: "Ses kanallarında toplam 10 saati geride bıraktın. Artık buraların gediklisisin!",
    test: p => (p.voice?.totalMinutes || 0) >= 600
  },
  {
    key: "worn_headset",
    name: "Kulaklık Eskitti",
    color: "#9B59B6",
    description: "Seste toplam 50 saati devirdin. O kulaklık artık vücudunun bir parçası haline geldi!",
    test: p => (p.voice?.totalMinutes || 0) >= 3000
  },
  {
    key: "voice_legend",
    name: "Ses Efsanesi",
    color: "#8E44AD",
    description: "Ses kanallarında 100 saati aştın! Sunucunun efsane sesçisi unvanı artık senin.",
    test: p => (p.voice?.totalMinutes || 0) >= 6000
  },
  {
    key: "in_the_crowd",
    name: "Kalabalığın İçinde",
    color: "#3498DB",
    description: "10+ kişilik kalabalık bir ses odasında en az 1 saat vakit geçirdin. Coşku ve eğlence zirvede!",
    test: p => (p.voice?.crowdMinutes || 0) >= 60
  },
  {
    key: "duo_team",
    name: "İkili Takım",
    color: "#1ABC9C",
    description: "Aynı arkadaşınla seste aralıksız 3 saat geçirdin. Gerçek bir takım ruhu!",
    test: p => maxValue(p.voice?.partnerMinutes) >= 180
  },
  {
    key: "until_morning",
    name: "Sabaha Kadar",
    color: "#34495E",
    description: "Gece 23:00'ten sabah 06:00'ya kadar tam 5 saat seste kaldın. Uyku da neymiş?",
    test: p => (p.voice?.lateNightMinutes || 0) >= 300
  },
  {
    key: "mic_master",
    name: "Mikrofon Ustası",
    color: "#00A8FF",
    description: "Haftanın 7 günü ses kanallarında aktif oldun. Mikrofonun hiç soğumuyor!",
    test: p => (p.voice?.days?.length || 0) >= 7
  },
  {
    key: "voice_traveler",
    name: "Gezgin Sesçi",
    color: "#5DADE2",
    description: "Sunucudaki en az 10 farklı ses kanalını ziyaret ettin. Ayak basmadık oda bırakmadın!",
    test: p => (p.voice?.channels?.length || 0) >= 10
  },
  {
    key: "afk_king",
    name: "AFK Kralı",
    color: "#7F8C8D",
    description: "AFK kanalında toplam 10 saat vakit geçirdin. Hareketsizlik sanattır, sen de ustasısın!",
    test: p => (p.voice?.afkMinutes || 0) >= 600
  },

  // ── Sohbet Başarımları (14) ──
  {
    key: "first_word",
    name: "İlk Kelime",
    color: "#BDC3C7",
    description: "RobloxLand sohbetine ilk adımını attın ve ilk mesajını gönderdin. Topluluğumuza hoş geldin!",
    test: p => (p.chat?.messages || 0) >= 1
  },
  {
    key: "chat_started",
    name: "Muhabbet Başladı",
    color: "#2ECC71",
    description: "Sohbette 100 mesaj barajını aştın. Ortamın sıcaklığına alıştın bile!",
    test: p => (p.chat?.messages || 0) >= 100
  },
  {
    key: "chatter",
    name: "Sohbetçi",
    color: "#27AE60",
    description: "500 mesajla sohbetin nabzını tuttun. Parmaklarına sağlık!",
    test: p => (p.chat?.messages || 0) >= 500
  },
  {
    key: "talkative",
    name: "Konuşkan",
    color: "#16A085",
    description: "Tam 1.000 mesaja ulaştın! Sohbetin neşesi ve akışı senden sorulur.",
    test: p => (p.chat?.messages || 0) >= 1000
  },
  {
    key: "wont_stop",
    name: "Durmuyor",
    color: "#00B894",
    description: "5.000 mesaj! Hızına kimse yetişemiyor, durdurulamaz bir sohbet makinesisin.",
    test: p => (p.chat?.messages || 0) >= 5000
  },
  {
    key: "keyboard_warrior",
    name: "Klavye Savaşçısı",
    color: "#00CEC9",
    description: "10.000 mesaj barajını yıktın geçtin! Klavyendeki tuşlar aşınmış olmalı.",
    test: p => (p.chat?.messages || 0) >= 10000
  },
  {
    key: "historian",
    name: "RobloxLand Tarihçisi",
    color: "#F1C40F",
    description: "Tam 25.000 mesaj! RobloxLand'in canlı tarihi ve hafızası oldun.",
    test: p => (p.chat?.messages || 0) >= 25000
  },
  {
    key: "night_owl",
    name: "Gece Kuşu",
    color: "#2C3E50",
    description: "Gece 03:00 - 05:00 arasında sohbete mesaj bıraktın. Gece yaşayanlar loncasına katıldın!",
    test: p => (p.chat?.nightMessages || 0) >= 1
  },
  {
    key: "good_morning",
    name: "Günaydın RobloxLand",
    color: "#F9CA24",
    description: "Sabahın ilk ışıklarında (06:00 - 07:00) sohbete enerji kattın. Erken kalkan yol alır!",
    test: p => (p.chat?.morningMessages || 0) >= 1
  },
  {
    key: "last_word",
    name: "Son Sözü Söyleyen",
    color: "#E67E22",
    description: "Bir kanalda son mesajı sen yazdın ve 6 saat boyunca kimse üstüne yazamadı. Son söz her zaman senin!",
    test: p => (p.chat?.lastWordWins || 0) >= 1
  },
  {
    key: "chat_marathon",
    name: "Maraton Sohbetçi",
    color: "#FF7675",
    description: "Tek bir günde tam 500 mesaj gönderdin. Gerçek bir maraton koşucusu!",
    test: p => maxValue(p.chat?.dailyMessages) >= 500
  },
  {
    key: "everywhere",
    name: "Her Yerdeyim",
    color: "#6C5CE7",
    description: "Sunucudaki 20 farklı metin kanalında aktif oldun. Seni her kanalda görmek mümkün!",
    test: p => (p.chat?.channels?.length || 0) >= 20
  },
  {
    key: "loyal_chatter",
    name: "Sadık Sohbetçi",
    color: "#A29BFE",
    description: "Son 30 günün en az 25 gününde sohbette aktif oldun. İstikrarının önünde saygıyla eğiliyoruz!",
    test: p => activeInLastDays(p.chat?.days, 30) >= 25
  },
  {
    key: "returned",
    name: "Geri Döndü",
    color: "#74B9FF",
    description: "30 günden uzun bir aranın ardından RobloxLand'e geri döndün. Efsaneler asla unutulmaz!",
    test: p => !!p.chat?.returnedAfter30Days
  },

  // ── Sunucuda Kalma / Kıdem Başarımları (8) ──
  {
    key: "new_dev",
    name: "Yeni Dev",
    color: "#95A5A6",
    description: "RobloxLand ailesinde 1 günü geride bıraktın. Geliştirici yolculuğun resmen başladı!",
    test: (p, c) => (c.joinDays || 0) >= 1
  },
  {
    key: "settling",
    name: "Yerleşmeye Başladı",
    color: "#3498DB",
    description: "Sunucumuzda 1 haftayı tamamladın. Artık buraların havasına alıştın!",
    test: (p, c) => (c.joinDays || 0) >= 7
  },
  {
    key: "loyal_dev",
    name: "Sadık Dev",
    color: "#2ECC71",
    description: "Tam 1 aydır (30 gün) bizimlesin. Sadakatin ve desteğin için teşekkürler!",
    test: (p, c) => (c.joinDays || 0) >= 30
  },
  {
    key: "senior_dev",
    name: "Kıdemli Dev",
    color: "#F39C12",
    description: "3 aydır (90 gün) bu topluluğun temel taşlarındansın. Kıdemin saygı uyandırıyor!",
    test: (p, c) => (c.joinDays || 0) >= 90
  },
  {
    key: "old_timer",
    name: "Eski Toprak",
    color: "#E67E22",
    description: "Yarım yılı (180 gün) devirdin. Eskilerden kim kaldı deseler ilk akla gelenlerdensin!",
    test: (p, c) => (c.joinDays || 0) >= 180
  },
  {
    key: "veteran",
    name: "RobloxLand Veteranı",
    color: "#E74C3C",
    description: "Tam 1 yıldır (365 gün) RobloxLand ailesindesin. Gerçek bir topluluk gazisi ve emektarı!",
    test: (p, c) => (c.joinDays || 0) >= 365
  },
  {
    key: "fossil",
    name: "Fosil Dev",
    color: "#8E44AD",
    description: "500 gündür buradasın! Sunucunun temelleri atılırken de buradaydın, hâlâ dimdik ayaktasın.",
    test: (p, c) => (c.joinDays || 0) >= 500
  },
  {
    key: "immortal",
    name: "Ölümsüz Dev",
    color: "#FFD700",
    description: "Tam 1.000 gün! Zaman senin için durmuş gibi, sunucunun ölümsüz efsanesi!",
    test: (p, c) => (c.joinDays || 0) >= 1000
  },

  // ── Komik / Troll Başarımları (16) ──
  {
    key: "anyone_there",
    name: "Kimse Yok Mu?",
    color: "#F1C40F",
    description: "5 kez boş ses odalarına girip yankını dinledin. Biri gelir elbet!",
    test: p => (p.voice?.emptyJoins || 0) >= 5
  },
  {
    key: "talking_wall",
    name: "Duvarla Konuşuyor",
    color: "#F1C40F",
    description: "Seste 2 saat tek başına kaldın. Duvarlar bile seni dinlemekten keyif alıyor!",
    test: p => (p.voice?.aloneMinutes || 0) >= 120
  },
  {
    key: "fell_asleep",
    name: "Uyuyakaldı",
    color: "#F1C40F",
    description: "Seste tek oturumda 6 saat kaldın. Mikrofon açık uyuya kaldığını kimseye söylemeyeceğiz!",
    test: p => (p.voice?.longestSessionMinutes || 0) >= 360
  },
  {
    key: "close_discord",
    name: "Discord’u Kapat Artık",
    color: "#F1C40F",
    description: "Günde 10 saat aktif kaldın. Gözlerini biraz dinlendir, Discord bir yere kaçmıyor!",
    test: p => maxActiveMinutes(p) >= 600
  },
  {
    key: "touch_grass",
    name: "Çime Dokun",
    color: "#F1C40F",
    description: "Bir günde 1.000 mesaj attın! Pencereyi aç ve biraz temiz hava al, çimlere basmak ücretsiz 😄",
    test: p => maxValue(p.chat?.dailyMessages) >= 1000
  },
  {
    key: "npc",
    name: "NPC",
    color: "#F1C40F",
    description: "Aynı kanalda 50 gün boyunca aktif oldun. Görev veren NPC gibi hep aynı yerdesin!",
    test: p => maxChannelDays(p.chat?.channelDays) >= 50
  },
  {
    key: "i_live_here",
    name: "Ben Burada Yaşıyorum",
    color: "#F1C40F",
    description: "Seste toplam 500 saati (30.000 dk) aştın. İkametgâhını buraya aldırmanın vakti geldi!",
    test: p => (p.voice?.totalMinutes || 0) >= 30000
  },
  {
    key: "wrong_channel",
    name: "Yanlış Kanal",
    color: "#F1C40F",
    description: "Mesajını attıktan sonraki 5 saniye içinde sildin. 'Görmediniz sayın' hamlesi başarıyla tamamlandı!",
    test: p => (p.chat?.quickDeletes || 0) >= 1
  },
  {
    key: "indecisive",
    name: "Kararsız",
    color: "#F1C40F",
    description: "10 dakika içinde 10 kez ses kanalı değiştirdin. Karar vermek gerçekten zor!",
    test: p => (p.voice?.recentSwitches?.length || 0) >= 10
  },
  {
    key: "in_and_out",
    name: "Girdi Çıktı",
    color: "#F1C40F",
    description: "Günde 20 kez ses kanalına girip çıktın. Kapı açılıp kapanmaktan aşındı!",
    test: p => maxValue(p.voice?.dailyJoins) >= 20
  },
  {
    key: "ping_hunter",
    name: "Ping Avcısı",
    color: "#F1C40F",
    description: "Tam 100 kez başkaları tarafından etiketlendin. Popülariten tavan yaptı!",
    test: p => (p.social?.mentionedBy?.length || 0) >= 100
  },
  {
    key: "emoji_addict",
    name: "Emoji Bağımlısı",
    color: "#F1C40F",
    description: "Mesajlarında toplam 1.000 emoji kullandın. Duygularını kelimeler yerine emojiler anlatıyor!",
    test: p => (p.chat?.emojis || 0) >= 1000
  },
  {
    key: "caps_minister",
    name: "Caps Lock Bakanı",
    color: "#F1C40F",
    description: "100 mesajını büyük harflerle (CAPS LOCK) yazdın. Sesini tüm sunucuya duyurdun!",
    test: p => (p.chat?.capsMessages || 0) >= 100
  },
  {
    key: "edit_master",
    name: "Edit Ustası",
    color: "#F1C40F",
    description: "100 mesajını düzenledin (edit). Mükemmeliyetçilik tam olarak böyle bir şey!",
    test: p => (p.chat?.edits || 0) >= 100
  },
  {
    key: "ghost",
    name: "Hayalet",
    color: "#F1C40F",
    description: "30 gündür sunucudasın ama tek bir mesaj bile yazmadın. Görünmezlik pelerinin çok havalı!",
    test: (p, c) => (c.joinDays || 0) >= 30 && (p.chat?.messages || 0) === 0
  },
  {
    key: "silent_follower",
    name: "Sessiz Takipçi",
    color: "#F1C40F",
    description: "60 gündür buradasın ve 10'dan az mesaj attın. Gölgeden izlemeyi tercih eden gizemli üye!",
    test: (p, c) => (c.joinDays || 0) >= 60 && (p.chat?.messages || 0) < 10
  },

  // ── Sosyal Başarımlar (9) ──
  {
    key: "first_friend",
    name: "İlk Arkadaş",
    color: "#E91E63",
    description: "Biriyle seste baş başa 30 dakika geçirdin. Güzel bir dostluğun ilk tohumları!",
    test: p => maxValue(p.voice?.partnerMinutes) >= 30
  },
  {
    key: "socializing",
    name: "Sosyalleşiyor",
    color: "#E91E63",
    description: "Ses kanallarında 25 farklı kişiyle birlikte bulundun. Çevren hızla genişliyor!",
    test: p => (p.social?.voicePeople?.length || 0) >= 25
  },
  {
    key: "knows_everyone",
    name: "Herkesi Tanıyor",
    color: "#E91E63",
    description: "100 farklı kişiyle seste vakit geçirdin. Sunucuda tanımadığın kimse kalmadı!",
    test: p => (p.social?.voicePeople?.length || 0) >= 100
  },
  {
    key: "party_formed",
    name: "Parti Kuruldu",
    color: "#E91E63",
    description: "Kalabalık ses odasında 2 saatten fazla eğlendin. Gerçek bir parti ortamı!",
    test: p => (p.voice?.partyMinutes || 0) >= 120
  },
  {
    key: "twins",
    name: "İkizler",
    color: "#E91E63",
    description: "Aynı kişiyle seste toplam 25 saat geçirdin. Ayrılmaz bir ikili oldunuz!",
    test: p => maxValue(p.voice?.partnerMinutes) >= 1500
  },
  {
    key: "inseparable",
    name: "Ayrılmaz İkili",
    color: "#E91E63",
    description: "Aynı kişiyle seste tam 100 saat geçirdin! Aranızdan su sızmıyor.",
    test: p => maxValue(p.voice?.partnerMinutes) >= 6000
  },
  {
    key: "community_person",
    name: "Topluluk İnsanı",
    color: "#E91E63",
    description: "100 kişinin mesajına yanıt verdin. İletişim gücünle topluluğu bir arada tutuyorsun!",
    test: p => (p.social?.repliedTo?.length || 0) >= 100
  },
  {
    key: "welcome_team",
    name: "Hoş Geldin Ekibi",
    color: "#E91E63",
    description: "Aramıza yeni katılan 50 üyeye sıcak bir 'Hoş geldin' dedin. Harika bir misafirperverlik!",
    test: p => (p.social?.welcomed?.length || 0) >= 50
  },
  {
    key: "helpful",
    name: "Yardımsever",
    color: "#E91E63",
    description: "Destek ve yardım kanallarında 50 kez insanlara destek oldun. İyilik meleği!",
    test: p => (p.social?.helped?.length || 0) >= 50
  },

  // ── Streak Başarımları (7) ──
  {
    key: "streak_3",
    name: "3’te 3",
    color: "#FF6B35",
    description: "Üst üste 3 gün boyunca sunucuda aktif oldun. Seri ısınıyor!",
    test: p => (p.streak?.current || 0) >= 3
  },
  {
    key: "streak_7",
    name: "Bir Hafta Bizimle",
    color: "#FF6B35",
    description: "Aralıksız 7 gün aktif kaldın. 1 haftalık muazzam seri!",
    test: p => (p.streak?.current || 0) >= 7
  },
  {
    key: "streak_14",
    name: "Seri Başladı",
    color: "#FF6B35",
    description: "Tam 14 gün boyunca her gün buradaydın. 2 haftalık istikrar!",
    test: p => (p.streak?.current || 0) >= 14
  },
  {
    key: "streak_30",
    name: "Bir Ay Kaçırmadı",
    color: "#FF6B35",
    description: "30 gün boyunca tek bir gün bile aksatmadın. 1 aylık sadakat abidesi!",
    test: p => (p.streak?.current || 0) >= 30
  },
  {
    key: "streak_60",
    name: "Durmak Yok",
    color: "#FF6B35",
    description: "60 gün boyunca her gün aktif oldun. Bu azim takdire şayan!",
    test: p => (p.streak?.current || 0) >= 60
  },
  {
    key: "streak_100",
    name: "Demir Dev",
    color: "#FF6B35",
    description: "Tam 100 günlük kesintisiz seri! Gerçek bir demir irade.",
    test: p => (p.streak?.current || 0) >= 100
  },
  {
    key: "streak_365",
    name: "Makine",
    color: "#FF6B35",
    description: "365 gün boyunca her gün aktif kaldın! 1 yıl kesintisiz seriyle adını tarihe altın harflerle yazdırdın.",
    test: p => (p.streak?.current || 0) >= 365
  }
];

// ── Bellek ve Kilit Mekanizmaları ──────────────────────────────────────────
let memoryCache = null;
const userLockMap = new Map(); // Kullanıcı bazlı concurrency kilidi (race condition önleyici)
const roleCacheMap = new Map(); // Guild rol önbelleği (Tekrar eden role.create çağrılarını önler)

function loadData() {
  if (memoryCache) return memoryCache;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(DATA_FILE)) {
      memoryCache = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (_) {}

  if (!memoryCache || typeof memoryCache !== "object") {
    memoryCache = { users: {}, channels: {}, messages: {} };
  }
  if (!memoryCache.users) memoryCache.users = {};
  if (!memoryCache.channels) memoryCache.channels = {};
  if (!memoryCache.messages) memoryCache.messages = {};
  return memoryCache;
}

/**
 * Verileri diske atomik (tmp dosya üzerinden güvenli) olarak yazar.
 */
function saveData(data) {
  memoryCache = data || memoryCache || { users: {}, channels: {}, messages: {} };
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(memoryCache, null, 2), "utf8");
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (e) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(memoryCache, null, 2), "utf8");
    } catch (directErr) {
      console.error("[RobloxLandAchievements] Save error:", directErr.message);
    }
  }
}

function blankProgress(userId) {
  return {
    userId,
    awarded: {},
    chat: {
      messages: 0,
      dailyMessages: {},
      days: [],
      channels: [],
      channelDays: {},
      nightMessages: 0,
      morningMessages: 0,
      emojis: 0,
      capsMessages: 0,
      edits: 0,
      quickDeletes: 0,
      lastWordWins: 0,
      returnedAfter30Days: false,
      lastValidAt: 0
    },
    voice: {
      totalMinutes: 0,
      aloneMinutes: 0,
      midnightMinutes: 0,
      nightMinutes: 0,
      lateNightMinutes: 0,
      crowdMinutes: 0,
      partyMinutes: 0,
      afkMinutes: 0,
      days: [],
      channels: [],
      partnerMinutes: {},
      emptyJoins: 0,
      recentSwitches: [],
      dailyJoins: {},
      sessionStartedAt: 0,
      longestSessionMinutes: 0
    },
    social: {
      voicePeople: [],
      mentionedBy: [],
      repliedTo: [],
      welcomed: [],
      helped: []
    },
    streak: {
      current: 0,
      longest: 0,
      lastDate: ""
    },
    activeMinutes: {}
  };
}

function normalizeProgress(raw, userId) {
  const base = blankProgress(userId);
  const p = raw || {};
  return {
    ...base,
    ...p,
    awarded: { ...base.awarded, ...(p.awarded || {}) },
    chat: { ...base.chat, ...(p.chat || {}) },
    voice: { ...base.voice, ...(p.voice || {}) },
    social: { ...base.social, ...(p.social || {}) },
    streak: { ...base.streak, ...(p.streak || {}) },
    activeMinutes: { ...base.activeMinutes, ...(p.activeMinutes || {}) }
  };
}

function getProgress(data, userId) {
  const store = data || loadData();
  const isNew = !store.users[userId];
  const p = normalizeProgress(store.users[userId], userId);
  if (isNew) {
    try {
      if (fs.existsSync(LEGACY_ACTIVITY_FILE)) {
        const legacy = JSON.parse(fs.readFileSync(LEGACY_ACTIVITY_FILE, "utf8"))[userId];
        if (legacy) {
          p.chat.messages = Math.max(0, Number(legacy.messagesCount || 0));
          p.voice.totalMinutes = Math.max(0, Number(legacy.voiceMinutes || 0));
        }
      }
    } catch (_) {}
  }
  store.users[userId] = p;
  return p;
}

function maxValue(obj) { return Math.max(0, ...Object.values(obj || {}).map(Number)); }
function maxChannelDays(obj) { return Math.max(0, ...Object.values(obj || {}).map(v => Array.isArray(v) ? v.length : 0)); }
function maxActiveMinutes(p) { return Math.max(0, ...Object.values(p?.activeMinutes || {}).map(v => Array.isArray(v) ? v.length : 0)); }
function uniqPush(arr, value) { if (value && !arr.includes(value)) arr.push(value); }
function trimObject(obj, keep = 40) { const keys = Object.keys(obj || {}).sort(); while (keys.length > keep) delete obj[keys.shift()]; }

function istanbulParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const pick = type => parts.find(x => x.type === type)?.value;
  return { date: `${pick("year")}-${pick("month")}-${pick("day")}`, hour: Number(pick("hour")) };
}

function dayNumber(date) { return Math.floor(Date.parse(`${date}T12:00:00Z`) / 86400000); }
function activeInLastDays(days, count) {
  const today = dayNumber(istanbulParts().date);
  return (days || []).filter(d => {
    const n = dayNumber(d);
    return n <= today && n > today - count;
  }).length;
}
function joinDays(member) { return member?.joinedTimestamp ? Math.floor((Date.now() - member.joinedTimestamp) / 86400000) : 0; }

function markActiveMinute(p, date, now = Date.now()) {
  p.activeMinutes[date] = p.activeMinutes[date] || [];
  uniqPush(p.activeMinutes[date], String(Math.floor(now / 60000)));
  trimObject(p.activeMinutes, 3);
}

function updateStreak(p, today) {
  if (p.streak.lastDate === today) return;
  const yesterday = p.streak.lastDate && dayNumber(today) - dayNumber(p.streak.lastDate) === 1;
  p.streak.current = yesterday ? p.streak.current + 1 : 1;
  p.streak.longest = Math.max(p.streak.longest || 0, p.streak.current);
  p.streak.lastDate = today;
}

/**
 * Başarım bildirim DM mesajını oluşturur (Her başarımın kendine özel mesajı/açıklaması bulunur)
 */
function buildAchievementDmMessage(wonAchievements) {
  if (!wonAchievements || wonAchievements.length === 0) return null;

  if (wonAchievements.length === 1) {
    const ach = wonAchievements[0];
    return (
      `🏆 **Tebrikler! RobloxLand'de yeni bir gizli başarım açtın!**\n\n` +
      `✨ **${ach.name}**\n` +
      `📝 *${ach.description}*\n\n` +
      `🎭 **${ach.name}** rolü hesabına tanımlandı. Rozet vitrinine eklendi!`
    );
  }

  const items = wonAchievements.map(ach => 
    `✨ **${ach.name}**\n` +
    `   └ *${ach.description}*`
  ).join("\n\n");

  return (
    `🏆 **Tebrikler! RobloxLand'de ${wonAchievements.length} yeni gizli başarım açtın!**\n\n` +
    `${items}\n\n` +
    `🎭 Kazanılan roller hesabına tanımlandı. Rozet dolabına +${wonAchievements.length} başarı eklendi!`
  );
}

/**
 * Kullanıcının mevcut durumunu inceleyip hak kazandığı başarımları tek seferlik verir.
 * Mutex kilidi sayesinde aynı kullanıcı için eşzamanlı çift tetiklenmeleri %100 önler.
 */
async function awardEligible(member, p, data) {
  if (!member || member.guild?.id !== GUILD_ID || member.user?.bot) return [];

  const userId = member.id || member.user?.id;
  if (!userId) return [];

  // Concurrency kilidi: Eğer kullanıcı zaten değerlendiriliyorsa bekle/atla
  if (userLockMap.get(userId)) {
    return [];
  }
  userLockMap.set(userId, true);

  try {
    const store = data || loadData();
    const userProgress = p || getProgress(store, userId);
    const context = { joinDays: joinDays(member) };
    const won = [];

    // Mevcut rolleri güvenli bir dizi olarak al
    const memberRolesList = member.roles?.cache
      ? (typeof member.roles.cache.values === "function" ? [...member.roles.cache.values()] : Array.from(member.roles.cache))
      : [];

    const guildRolesList = member.guild?.roles?.cache
      ? (typeof member.guild.roles.cache.values === "function" ? [...member.guild.roles.cache.values()] : Array.from(member.guild.roles.cache))
      : [];

    for (const achievement of ACHIEVEMENTS) {
      // 1. Durum Kontrolü: Zaten verildiyse atla
      if (userProgress.awarded[achievement.key]) continue;

      // 2. Koşul Kontrolü: Şartları sağlamıyorsa atla
      if (!achievement.test(userProgress, context)) continue;

      // 3. Önceden Var Olan Rol Kontrolü (Eski roller için DM spamı atılmasını engeller)
      const existingRole = memberRolesList.find(r => r?.name === achievement.name);
      if (existingRole) {
        userProgress.awarded[achievement.key] = new Date().toISOString();
        continue;
      }

      try {
        let role = roleCacheMap.get(achievement.name) || guildRolesList.find(r => r?.name === achievement.name);
        if (!role && typeof member.guild?.roles?.create === "function") {
          role = await member.guild.roles.create({
            name: achievement.name,
            color: achievement.color,
            hoist: false,
            reason: "RobloxLand Başarım Sistemi"
          });
          if (role) roleCacheMap.set(achievement.name, role);
        }

        // ÖNEMLİ: Önceden kitle (Olası hata/tekrar tetiklenmelerde mükerrer DM ve rol spamını engeller)
        userProgress.awarded[achievement.key] = new Date().toISOString();

        if (role && typeof member.roles?.add === "function") {
          const hasRole = member.roles.cache?.has ? member.roles.cache.has(role.id) : memberRolesList.some(r => r?.id === role.id);
          if (!hasRole) {
            await member.roles.add(role, `Başarım açıldı: ${achievement.name}`).catch(err => {
              console.warn(`[RobloxLandAchievements] Rol eklenemedi (${achievement.name}):`, err.message);
            });
          }
        }

        won.push(achievement);
      } catch (err) {
        console.warn(`[RobloxLandAchievements] ${achievement.name} verilemedi (${userId}):`, err.message);
        userProgress.awarded[achievement.key] = new Date().toISOString();
      }
    }

    if (won.length > 0) {
      store.users[userId] = userProgress;
      saveData(store);

      const dmText = buildAchievementDmMessage(won);
      if (dmText && typeof member.send === "function") {
        await member.send(dmText).catch(() => {});
      }
    }

    return won.map(w => w.name);
  } finally {
    userLockMap.delete(userId);
  }
}

function emojiCount(content) {
  const custom = content.match(/<a?:\w+:\d+>/g) || [];
  const unicode = content.match(/\p{Extended_Pictographic}/gu) || [];
  return custom.length + unicode.length;
}

function isCapsHeavy(content) {
  const letters = content.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/g) || [];
  if (letters.length < 8) return false;
  const upper = letters.filter(c => c === c.toLocaleUpperCase("tr-TR") && c !== c.toLocaleLowerCase("tr-TR")).length;
  return upper / letters.length >= 0.7;
}

async function trackValidMessage(message) {
  if (!message.guild || message.guild.id !== GUILD_ID || message.author.bot) return [];
  const data = loadData();
  const p = getProgress(data, message.author.id);
  const { date, hour } = istanbulParts();
  const previousAt = Number(p.chat.lastValidAt || 0);

  if (previousAt && Date.now() - previousAt >= 30 * 86400000) p.chat.returnedAfter30Days = true;
  p.chat.lastValidAt = Date.now();
  p.chat.messages += 1;
  p.chat.dailyMessages[date] = (p.chat.dailyMessages[date] || 0) + 1;
  trimObject(p.chat.dailyMessages, 40);
  uniqPush(p.chat.days, date);
  uniqPush(p.chat.channels, message.channelId);
  p.chat.channelDays[message.channelId] = p.chat.channelDays[message.channelId] || [];
  uniqPush(p.chat.channelDays[message.channelId], date);
  if (hour >= 3 && hour < 5) p.chat.nightMessages += 1;
  if (hour >= 6 && hour < 7) p.chat.morningMessages += 1;
  p.chat.emojis += emojiCount(message.content || "");
  if (isCapsHeavy(message.content || "")) p.chat.capsMessages += 1;
  updateStreak(p, date);
  markActiveMinute(p, date, message.createdTimestamp || Date.now());

  const replied = message.mentions?.repliedUser?.id;
  if (replied && replied !== message.author.id) {
    uniqPush(p.social.repliedTo, replied);
    const channelName = message.channel?.name?.toLocaleLowerCase("tr-TR") || "";
    if (channelName.includes("yardım") || channelName.includes("yardim") || channelName.includes("destek")) uniqPush(p.social.helped, replied);
  }
  const lower = (message.content || "").toLocaleLowerCase("tr-TR");
  if (/\b(hoş geldin|hos geldin|hg)\b/.test(lower)) {
    for (const [, target] of message.mentions?.members || []) {
      if (target.id !== message.author.id && target.joinedTimestamp && Date.now() - target.joinedTimestamp <= 7 * 86400000) uniqPush(p.social.welcomed, target.id);
    }
  }
  const mentionedTargets = [];
  for (const [, target] of message.mentions?.users || []) {
    if (target.id === message.author.id || target.bot) continue;
    const targetP = getProgress(data, target.id);
    uniqPush(targetP.social.mentionedBy, message.author.id);
    data.users[target.id] = targetP;
    mentionedTargets.push([target.id, targetP]);
  }

  data.messages[message.id] = { userId: message.author.id, createdAt: message.createdTimestamp || Date.now() };
  const messageIds = Object.keys(data.messages);
  if (messageIds.length > 5000) for (const id of messageIds.slice(0, messageIds.length - 5000)) delete data.messages[id];
  data.channels[message.channelId] = { userId: message.author.id, at: Date.now(), awarded: false };
  data.users[message.author.id] = p;
  saveData(data);

  const wins = await awardEligible(message.member, p, data);
  for (const [targetId, targetP] of mentionedTargets) {
    const targetMember = message.guild.members.cache.get(targetId) || await message.guild.members.fetch(targetId).catch(() => null);
    if (targetMember) await awardEligible(targetMember, targetP, data);
  }

  // Mevcut profil kartıyla uyumluluk
  try {
    const { getUserActivity, saveUserActivity } = require("./robloxLandLevelService");
    const activity = getUserActivity(message.author.id);
    activity.streakDays = p.streak.current;
    activity.lastActiveDate = p.streak.lastDate;
    activity.achievementsCount = Object.keys(p.awarded).length;
    saveUserActivity(message.author.id, activity);
  } catch (_) {}
  return wins;
}

async function trackMessageDelete(message) {
  const guildId = message.guild?.id;
  if (guildId !== GUILD_ID) return;
  const data = loadData();
  const tracked = data.messages[message.id];
  if (!tracked || Date.now() - tracked.createdAt > 5000) return;
  const member = message.member || await message.guild.members.fetch(tracked.userId).catch(() => null);
  if (!member) return;
  const p = getProgress(data, tracked.userId);
  p.chat.quickDeletes += 1;
  delete data.messages[message.id];
  saveData(data);
  await awardEligible(member, p, data);
}

async function trackMessageEdit(message) {
  if (message.guild?.id !== GUILD_ID || message.author?.bot) return;
  const data = loadData();
  const tracked = data.messages[message.id];
  if (!tracked || tracked.edited) return;
  const p = getProgress(data, message.author.id);
  p.chat.edits += 1;
  tracked.edited = true;
  saveData(data);
  await awardEligible(message.member, p, data);
}

async function trackVoiceState(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  const member = newState.member || oldState.member;
  if (guild?.id !== GUILD_ID || !member || member.user.bot) return;
  const data = loadData();
  const p = getProgress(data, member.id);
  const now = Date.now();
  const { date } = istanbulParts();

  if (!oldState.channelId && newState.channelId) {
    p.voice.sessionStartedAt = now;
    p.voice.dailyJoins[date] = (p.voice.dailyJoins[date] || 0) + 1;
    trimObject(p.voice.dailyJoins, 3);
    if ((newState.channel?.members?.filter(m => !m.user.bot).size || 0) <= 1) p.voice.emptyJoins += 1;
  } else if (oldState.channelId && !newState.channelId) {
    if (p.voice.sessionStartedAt) p.voice.longestSessionMinutes = Math.max(p.voice.longestSessionMinutes, Math.floor((now - p.voice.sessionStartedAt) / 60000));
    p.voice.sessionStartedAt = 0;
  } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    p.voice.recentSwitches = [...p.voice.recentSwitches.filter(t => now - t <= 10 * 60000), now];
  }
  data.users[member.id] = p;
  saveData(data);
  await awardEligible(member, p, data);
}

async function tickVoice(client) {
  const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) return;
  const data = loadData();
  const { date, hour } = istanbulParts();
  const touched = [];
  for (const [, channel] of guild.channels.cache.filter(c => c?.isVoiceBased?.())) {
    const humans = channel.members.filter(m => !m.user.bot);
    for (const [, member] of humans) {
      const p = getProgress(data, member.id);
      p.voice.totalMinutes += 1;
      uniqPush(p.voice.days, date);
      uniqPush(p.voice.channels, channel.id);
      markActiveMinute(p, date);
      if (humans.size === 1) p.voice.aloneMinutes += 1;
      if (hour >= 0 && hour < 5) p.voice.midnightMinutes += 1;
      if (hour >= 0 && hour < 6) p.voice.nightMinutes += 1;
      if (hour >= 23 || hour < 6) p.voice.lateNightMinutes += 1;
      if (humans.size >= 10) { p.voice.crowdMinutes += 1; p.voice.partyMinutes += 1; }
      if (channel.id === guild.afkChannelId) p.voice.afkMinutes += 1;
      if (!p.voice.sessionStartedAt) p.voice.sessionStartedAt = Date.now();
      p.voice.longestSessionMinutes = Math.max(p.voice.longestSessionMinutes, Math.floor((Date.now() - p.voice.sessionStartedAt) / 60000));
      for (const [, peer] of humans) {
        if (peer.id === member.id) continue;
        p.voice.partnerMinutes[peer.id] = (p.voice.partnerMinutes[peer.id] || 0) + 1;
        uniqPush(p.social.voicePeople, peer.id);
      }
      data.users[member.id] = p;
      touched.push([member, p]);
    }
  }
  // Son mesajı altı saat değişmeyen kanallar
  for (const channelState of Object.values(data.channels)) {
    if (!channelState.awarded && Date.now() - channelState.at >= 6 * 3600000) {
      const member = await guild.members.fetch(channelState.userId).catch(() => null);
      if (member) {
        const p = getProgress(data, member.id);
        p.chat.lastWordWins += 1;
        channelState.awarded = true;
        touched.push([member, p]);
      }
    }
  }
  saveData(data);
  for (const [member, p] of touched) await awardEligible(member, p, data);
}

let tenureCursor = 0;
async function scanTenure(client, batchSize = 5) {
  const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) return;
  const data = loadData();
  const members = [...guild.members.cache.values()].filter(member => !member.user.bot);
  if (!members.length) return;
  const batch = [];
  for (let i = 0; i < Math.min(batchSize, members.length); i += 1) {
    batch.push(members[(tenureCursor + i) % members.length]);
  }
  tenureCursor = (tenureCursor + batch.length) % members.length;
  for (const member of batch) {
    if (member.user.bot) continue;
    await awardEligible(member, getProgress(data, member.id), data);
  }
}

function initAchievementTracker(client) {
  if (client.__robloxLandAchievementTimer) return;
  client.__robloxLandAchievementTimer = setInterval(() => tickVoice(client).catch(err => console.error("[RobloxLandAchievements] tick:", err.message)), TICK_MS);
  setTimeout(() => { tickVoice(client).catch(() => {}); scanTenure(client).catch(() => {}); }, 15000);
  setInterval(() => scanTenure(client).catch(() => {}), TICK_MS);
}

function getStreak(userId) {
  const p = getProgress(loadData(), userId);
  const today = istanbulParts().date;
  const stale = p.streak.lastDate && dayNumber(today) - dayNumber(p.streak.lastDate) > 1;
  return { current: stale ? 0 : p.streak.current, longest: p.streak.longest, lastDate: p.streak.lastDate };
}

function getUserAchievements(userId) {
  const p = getProgress(loadData(), userId);
  const awardedKeys = Object.keys(p.awarded || {});
  const list = ACHIEVEMENTS.filter(a => awardedKeys.includes(a.key)).map(a => ({
    key: a.key,
    name: a.name,
    color: a.color,
    description: a.description,
    awardedAt: p.awarded[a.key]
  }));
  return {
    userId,
    totalCount: ACHIEVEMENTS.length,
    unlockedCount: list.length,
    achievements: list
  };
}

function hasAchievement(userId, achievementKey) {
  const p = getProgress(loadData(), userId);
  return !!p.awarded?.[achievementKey];
}

async function handleStreakCommand(message) {
  if (message.guild?.id !== GUILD_ID || !/^e!streak(?:\s|$)/i.test((message.content || "").trim())) return false;
  const streak = getStreak(message.author.id);
  const next = [3, 7, 14, 30, 60, 100, 365].find(n => n > streak.current);
  await message.reply(ComponentsV2Factory.buildPayload([
    ComponentsV2Factory.text(
      `# 🔥 ${message.author.username} — Streak Durumu\n\n` +
      `**Güncel seri:** \`${streak.current} gün\`\n` +
      `**En uzun seri:** \`${streak.longest} gün\`\n` +
      `**Bugünkü geçerli mesaj:** ${streak.lastDate === istanbulParts().date ? "✅ Atıldı" : "❌ Henüz yok"}\n\n` +
      (next ? `Sonraki seri başarımına **${next - streak.current} gün** kaldı.` : "🏆 Tüm streak başarımlarını tamamladın!") +
      `\n\n-# Seri için her gün spam olmayan en az bir geçerli mesaj gerekir. Rutin DM gönderilmez.`
    )
  ]));
  return true;
}

module.exports = {
  GUILD_ID,
  ACHIEVEMENTS,
  getStreak,
  getUserAchievements,
  hasAchievement,
  handleStreakCommand,
  initAchievementTracker,
  trackValidMessage,
  trackMessageDelete,
  trackMessageEdit,
  trackVoiceState,
  awardEligible,
  buildAchievementDmMessage,
  _test: { blankProgress, istanbulParts, updateStreak, emojiCount, isCapsHeavy, maxValue }
};
