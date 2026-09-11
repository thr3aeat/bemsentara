// server/services/homepageService.js
// Modern EkoYıldız Creator Ecosystem & Portal Homepage Service
'use strict';

const { homepageConfig, giveaways, giveawayEntries, users } = require('../../models/Store');
const socialHubService = require('./socialHubService');

class HomepageService {
  constructor() {
    this._ensureSeeded();
  }

  _ensureSeeded() {
    try {
      const existing = homepageConfig.findOne({ key: 'main_homepage_settings' });
      if (!existing) {
        homepageConfig.create({
          key: 'main_homepage_settings',
          announcement: {
            isActive: true,
            badge: "DUYURU",
            text: "🎉 10.000 Robux ve Discord Nitro çekilişleri devam ediyor! Hemen katıl, biletlerini topla.",
            link: "/cekilisler",
            buttonText: "Çekilişlere Git ➔"
          },
          hero: {
            brandName: "EKOYILDIZ",
            badgeText: "✨ RESMİ YOUTUBE & İÇERİK PORTALI",
            title: "EKOYILDIZ",
            tagline: "İzle. Katıl. Keşfet.",
            subtitle: "Videolar, canlı yayınlar, çekilişler ve EkoYıldız topluluğunun tamamı burada. Roblox maceralarından sürpriz ödüllere kadar aradığın her şey tek adreste.",
            primaryCtaText: "Son Videoyu İzle 🎬",
            primaryCtaLink: "#latest-video",
            secondaryCtaText: "Çekilişlere Katıl 🎁",
            secondaryCtaLink: "/cekilisler"
          },
          liveStatus: {
            isLive: false,
            statusText: "Şu anda canlı yayın yok ama son yayını kaçırmış olabilirsin!",
            platform: "kick",
            targetUrl: "https://kick.com/ekoyildiz",
            lastStreamTitle: "Roblox Topluluk Gecesi & Büyük Macera",
            nextScheduled: "Çok Yakında Canlı Yayında!"
          },
          featuredVideo: {
            videoId: "bO_ZqLd3B24",
            title: "Roblox En Zor Kaçış Haritasını Bitirdik! (Çıldırtan Anlar)",
            category: "ROBLOX ÖZEL BÖLÜM",
            publishedAt: "Yeni Yayınlandı",
            description: "Bugün EkoYıldız ekibiyle Roblox'un en kaotik ve en zorlu parkur haritasında hayatta kalmaya çalıştık. Sürpriz sonlu harika anlar!",
            youtubeUrl: "https://www.youtube.com/@eko8yildiz",
            thumbnailUrl: "https://images.unsplash.com/photo-1612287233207-68b37583624c?q=80&w=1200&auto=format&fit=crop"
          },
          seriesList: [
            {
              id: "kamp-serisi-1",
              title: "Kamp Nasıl Kurulur?",
              tag: "REHBER & OYUN",
              episodeCount: 6,
              lastEpisode: "Bölüm 6: Zirvede Hayatta Kalma",
              description: "Roblox dünyasında sıfırdan profesyonel kamp alanı inşa etme ve taktik rehberi.",
              url: "https://www.youtube.com/@eko8yildiz",
              coverImage: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop"
            },
            {
              id: "kamp-serisi-2",
              title: "Kamp Neden Batar?",
              tag: "KOMEDİ & MİZAH",
              episodeCount: 8,
              lastEpisode: "Bölüm 8: Büyük Fırtına ve İflas",
              description: "Yapılmaması gereken tüm hataların ve arkadaşların birbirini trollediği en komik anlar.",
              url: "https://www.youtube.com/@eko8yildiz",
              coverImage: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=800&auto=format&fit=crop"
            },
            {
              id: "kacis-gunlukleri",
              title: "Roblox Kaçış Günlükleri",
              tag: "AKSİYON & PARKUR",
              episodeCount: 12,
              lastEpisode: "Bölüm 12: İmkansız Lazer Odası",
              description: "Her bölümde farklı bir haritadan en hızlı sürede kaçma challenge'ı!",
              url: "https://www.youtube.com/@eko8yildiz",
              coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
            }
          ],
          sectionOrder: ['announcement', 'hero', 'now', 'featured_video', 'giveaways', 'social_hub', 'series', 'community', 'official_links'],
          sectionVisibility: {
            announcement: true,
            hero: true,
            now: true,
            featured_video: true,
            giveaways: true,
            social_hub: true,
            series: true,
            community: true,
            official_links: true
          },
          updatedAt: new Date()
        });
      }
    } catch (err) {
      console.error('[HomepageService] Seed hatası:', err.message);
    }
  }

  getConfig() {
    this._ensureSeeded();
    const config = homepageConfig.findOne({ key: 'main_homepage_settings' });
    return config || {};
  }

  updateConfig(updates = {}) {
    this._ensureSeeded();
    let config = homepageConfig.findOne({ key: 'main_homepage_settings' });
    if (!config) {
      config = homepageConfig.create({ key: 'main_homepage_settings', ...updates });
    } else {
      Object.keys(updates).forEach(key => {
        config[key] = updates[key];
      });
      config.updatedAt = new Date();
      config.save();
    }
    return config;
  }

  /**
   * Kullanıcının saatine göre dinamik sıcak selamlama metni
   */
  getDynamicGreeting() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return { icon: "🌅", text: "Günaydın Ekocan 👋", subtext: "Güne enerjik bir başlangıç yapmaya hazır mısın?" };
    } else if (hour >= 12 && hour < 18) {
      return { icon: "⚡", text: "Günün nasıl geçiyor Ekocan?", subtext: "Yeni videoları ve çekilişleri inceleme vakti!" };
    } else if (hour >= 18 && hour < 23) {
      return { icon: "🌙", text: "Akşam tayfa toplandı mı?", subtext: "Topluluk Discord'unda sohbet son hız devam ediyor." };
    } else {
      return { icon: "🦉", text: "Bu saatte hâlâ buradaysan bizdensin!", subtext: "Gece kuşlarına özel sürprizler her an çıkabilir." };
    }
  }

  /**
   * "Şimdi Ne Var?" öncelik motoru: LIVE > GIVEAWAY > NEW VIDEO > ANNOUNCEMENT
   */
  getNowPriorityWidget(config, activeGiveaways = []) {
    // 1. LIVE
    if (config.liveStatus && config.liveStatus.isLive) {
      return {
        badge: "🔴 ŞU ANDA CANLI YAYINDA",
        title: config.liveStatus.lastStreamTitle || "EkoYıldız Canlı Yayında!",
        desc: "Yayın başladı, ekiple birlikte sohbete ve oyuna hemen katıl.",
        btnText: "Yayına Katıl 🚀",
        btnLink: config.liveStatus.targetUrl || "https://kick.com/ekoyildiz",
        type: "live"
      };
    }

    // 2. ACTIVE GIVEAWAY
    if (activeGiveaways && activeGiveaways.length > 0) {
      const topGw = activeGiveaways[0];
      return {
        badge: "🎁 ŞU ANDA AKTİF ÇEKİLİŞ",
        title: topGw.title,
        desc: `Büyük ödül seni bekliyor! ${topGw.prize || 'Sürpriz Ödüller'} kazanma şansı yakala.`,
        btnText: "Şansını Dene ➔",
        btnLink: `/cekilisler/${topGw.slug || topGw._id}`,
        type: "giveaway"
      };
    }

    // 3. NEW VIDEO
    if (config.featuredVideo) {
      return {
        badge: "🎬 YENİ VİDEO DÜŞTÜ",
        title: config.featuredVideo.title,
        desc: config.featuredVideo.description || "En son Roblox bölümünü kaçırma.",
        btnText: "Videoyu İzle ➔",
        btnLink: config.featuredVideo.youtubeUrl || "https://www.youtube.com/@eko8yildiz",
        type: "video"
      };
    }

    // 4. ANNOUNCEMENT
    return {
      badge: "📢 GÜNCEL DUYURU",
      title: "EkoYıldız Topluluk Ekosistemi",
      desc: config.announcement?.text || "Tüm güncel duyurular ve ödüller burada.",
      btnText: "Keşfet ➔",
      btnLink: "/cekilisler",
      type: "announcement"
    };
  }

  /**
   * Topluluk nabzı (Community Pulse) verileri
   */
  getCommunityPulse(stats = {}) {
    const totalParticipants = giveawayEntries.find({}).length || 2480;
    const totalUsers = users.find({}).length || 1200;

    return [
      { icon: "🎟️", stat: `${totalParticipants}+`, label: "Çekiliş Katılımı", note: "Topluluk üyelerinin kazandığı biletler" },
      { icon: "👥", stat: "5.000+", label: "Discord Ailesi", note: "Canlı odalarda 7/24 aktif sohbet" },
      { icon: "📺", stat: "100K+", label: "Video İzlenmesi", note: "YouTube kanalındaki Roblox serileri" },
      { icon: "🛡️", stat: "%100", label: "Şeffaf & Adil Seçim", note: "Kriptografik çekiliş denetimi" }
    ];
  }
}

const homepageService = new HomepageService();

module.exports = homepageService;
