// server/services/socialHubService.js
// Interactive Social Media Hub & Humorous Ad Experience for Eko Yıldız
'use strict';

const { socialAds, socialAdMetrics } = require('../../models/Store');

const WITTY_QUOTES = [
  "Evet, bu da bir reklam.",
  "Bunu geçebilirdin ama buraya kadar geldin.",
  "Algoritma seni buraya kadar getirdiyse bir bildiği vardır.",
  "Buraya tıklarsan hayatın değişmeyebilir ama Eko’nun profili açılır.",
  "Bu buton %100 butondur.",
  "Reklam engelleyici bunu engelleyemedi 😎",
  "Eko yine bir yerlere hesap açmış.",
  "Takip etmezsen admin ağlar.",
  "Kaydırmaya devam etmeden önce ufak bir mola ver.",
  "Buradaki pikseller organik Eko Yıldız sevgisi içerir."
];

class SocialHubService {
  constructor() {
    this._ensureSeeded();
  }

  _getRandomQuote() {
    return WITTY_QUOTES[Math.floor(Math.random() * WITTY_QUOTES.length)];
  }

  _ensureSeeded() {
    try {
      const existing = socialAds.find({});
      if (!existing || existing.length === 0) {
        const defaultAccounts = [
          {
            key: 'youtube-main',
            platform: 'youtube',
            title: "Bir saniye... sen hâlâ abone değil misin?",
            subtitle: "Video başlamadan önce önemli bir şey...",
            accountName: "Eko Yıldız (Ana Kanal)",
            targetUrl: "https://www.youtube.com/@eko8yildiz",
            ctaText: "Eko Yıldız'a Abone Ol",
            directCta: "Direkt Git →",
            badgeText: "🔥 100K+ ABONE",
            wittyQuote: "Bunu geçebilirdin ama buraya kadar geldin.",
            interactionType: 'video-player',
            order: 1,
            isFeatured: true,
            isActive: true,
            views: 0,
            interactionsStarted: 0,
            interactionsCompleted: 0,
            clicks: 0
          },
          {
            key: 'instagram-eko',
            platform: 'instagram',
            title: "Hmmm... Instagram mı?",
            subtitle: "Eko artık burada da bir şeyler paylaşıyormuş 👀",
            accountName: "@ekonqt",
            targetUrl: "https://www.instagram.com/ekonqt/",
            ctaText: "Instagram'a Git",
            directCta: "Direkt Git →",
            badgeText: "📸 KAMERA ARKASI",
            wittyQuote: "Tamam tamam, yakaladın. Şimdi Eko'yu stalklamaya gidebilirsin.",
            interactionType: 'drag-phone',
            order: 2,
            isFeatured: false,
            isActive: true,
            views: 0,
            interactionsStarted: 0,
            interactionsCompleted: 0,
            clicks: 0
          },
          {
            key: 'tiktok',
            platform: 'tiktok',
            title: "Kaydırmayı bırak.",
            subtitle: "Eko'nun TikTok'una git.",
            accountName: "@kimdirbueko",
            targetUrl: "https://www.tiktok.com/@kimdirbueko",
            ctaText: "TikTok'ta İzle",
            directCta: "Direkt Git →",
            badgeText: "🎵 KOMİK ANLAR",
            wittyQuote: "Algoritma seni buraya kadar getirdiyse bir bildiği vardır.",
            interactionType: 'video-swipe',
            order: 3,
            isFeatured: false,
            isActive: true,
            views: 0,
            interactionsStarted: 0,
            interactionsCompleted: 0,
            clicks: 0
          },
          {
            key: 'kick',
            platform: 'kick',
            title: "Eko canlıysa burada işler karışıyor.",
            subtitle: "Kaos, eğlence ve yüksek tempo.",
            accountName: "kick.com/ekoyildiz",
            targetUrl: "https://kick.com/ekoyildiz",
            ctaText: "Yayına Gir",
            directCta: "Direkt Git →",
            badgeText: "🟢 CANLI YAYIN",
            wittyQuote: "Reklam engelleyici bunu engelleyemedi 😎",
            interactionType: 'live-chat',
            order: 4,
            isFeatured: false,
            isActive: true,
            views: 0,
            interactionsStarted: 0,
            interactionsCompleted: 0,
            clicks: 0
          },
          {
            key: 'twitch',
            platform: 'twitch',
            title: "Bağlantı aranıyor...",
            subtitle: "Eko bulundu.",
            accountName: "twitch.tv/ekoyildiz",
            targetUrl: "https://www.twitch.tv/ekoyildiz",
            ctaText: "Twitch'e Geç",
            directCta: "Direkt Git →",
            badgeText: "💜 RETRO YAYIN",
            wittyQuote: "Bu buton %100 butondur.",
            interactionType: 'retro-terminal',
            order: 5,
            isFeatured: false,
            isActive: true,
            views: 0,
            interactionsStarted: 0,
            interactionsCompleted: 0,
            clicks: 0
          },
          {
            key: 'instagram-ege',
            platform: 'instagram',
            title: "Ege’nin gizli köşesi 👀",
            subtitle: "Buraya kadar geldiysen zaten merak etmişsindir.",
            accountName: "@egee7dino",
            targetUrl: "https://www.instagram.com/egee7dino/",
            ctaText: "Ege’nin Instagramına Git",
            directCta: "Direkt Git →",
            badgeText: "✨ GİZLİ KÖŞE",
            wittyQuote: "Eko yine bir yerlere hesap açmış.",
            interactionType: 'scratch-blur',
            order: 6,
            isFeatured: false,
            isActive: true,
            views: 0,
            interactionsStarted: 0,
            interactionsCompleted: 0,
            clicks: 0
          },
          {
            key: 'youtube-second',
            platform: 'youtube',
            title: "Ana kanalda bulamadığın şeyler burada.",
            subtitle: "Yan kanalın kapısını aç.",
            accountName: "Eko Yıldız 2 (Yedek)",
            targetUrl: "https://www.youtube.com/@eko8yildiz2",
            ctaText: "İçeri Gir",
            directCta: "Direkt Git →",
            badgeText: "🔓 GİZLİ BONUS",
            wittyQuote: "Takip etmezsen admin ağlar.",
            interactionType: 'key-unlock',
            order: 7,
            isFeatured: false,
            isActive: true,
            views: 0,
            interactionsStarted: 0,
            interactionsCompleted: 0,
            clicks: 0
          }
        ];

        defaultAccounts.forEach(item => socialAds.create(item));
      }
    } catch (err) {
      console.error('[SocialHubService] Seed hatası:', err.message);
    }
  }

  seedDefaultAccounts() {
    return this._ensureSeeded();
  }

  getAllAds() {
    const all = socialAds.find({});
    return all.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getActiveAds() {
    const all = this.getAllAds();
    return all.filter(a => a.isActive !== false);
  }

  getAdByKey(key) {
    return socialAds.findOne({ key }) || socialAds.findById(key);
  }

  // ── Analytics & Event Recording ──────────────────────────────────────────
  recordEvent(adKey, eventType, ip = '', userAgent = '') {
    try {
      const ad = this.getAdByKey(adKey);
      if (ad) {
        if (eventType === 'card_view') {
          ad.views = (Number(ad.views) || 0) + 1;
        } else if (eventType === 'interaction_started') {
          ad.interactionsStarted = (Number(ad.interactionsStarted) || 0) + 1;
        } else if (eventType === 'interaction_completed') {
          ad.interactionsCompleted = (Number(ad.interactionsCompleted) || 0) + 1;
        } else if (eventType === 'social_link_clicked') {
          ad.clicks = (Number(ad.clicks) || 0) + 1;
        }
        ad.save();
      }

      socialAdMetrics.create({
        adKey,
        eventType,
        ip,
        userAgent,
        createdAt: new Date(),
        timestamp: new Date()
      });
      return true;
    } catch (err) {
      console.error('[SocialHubService] Event record hatası:', err.message);
      return false;
    }
  }

  getAnalytics() {
    const ads = this.getAllAds();
    const metrics = socialAdMetrics.find({});

    const platformBreakdown = {};
    ads.forEach(ad => {
      const views = Number(ad.views) || 0;
      const started = Number(ad.interactionsStarted) || 0;
      const completed = Number(ad.interactionsCompleted) || 0;
      const clicks = Number(ad.clicks) || 0;

      const completionRate = started > 0 ? ((completed / started) * 100).toFixed(1) : "0.0";
      const clickRate = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0.0";

      platformBreakdown[ad.key] = {
        title: ad.title,
        platform: ad.platform,
        accountName: ad.accountName,
        views,
        started,
        completed,
        clicks,
        completionRate: `${completionRate}%`,
        clickRate: `${clickRate}%`
      };
    });

    const totalViews = ads.reduce((s, a) => s + (Number(a.views) || 0), 0);
    const totalClicks = ads.reduce((s, a) => s + (Number(a.clicks) || 0), 0);
    const totalCompleted = ads.reduce((s, a) => s + (Number(a.interactionsCompleted) || 0), 0);

    return {
      totalViews,
      totalClicks,
      totalCompleted,
      platformBreakdown,
      recentEvents: metrics.slice(-25).reverse()
    };
  }

  // ── Render Interactive Social Hub Bento ──────────────────────────────────
  renderSocialHubHtml() {
    const ads = this.getActiveAds();
    if (!ads || ads.length === 0) return '';

    const adMap = {};
    ads.forEach(a => { adMap[a.key] = a; });

    const ytMain = adMap['youtube-main'] || ads[0];
    const igEko = adMap['instagram-eko'] || ads[1] || ads[0];
    const tiktok = adMap['tiktok'] || ads[2] || ads[0];
    const kick = adMap['kick'] || ads[3] || ads[0];
    const twitch = adMap['twitch'] || ads[4] || ads[0];
    const igEge = adMap['instagram-ege'] || ads[5] || ads[0];
    const ytSecond = adMap['youtube-second'] || ads[6] || ads[0];

    const randomHumor = this._getRandomQuote();

    return `
    <!-- 🌟 EKO YILDIZ INTERACTIVE SOCIAL HUB (SPECIAL AD CAMPAIGN) -->
    <section class="social-hub-section" id="social-hub" aria-label="Eko Yıldız Sosyal Medya Merkezi">
      <style>
        .social-hub-section {
          width: 100%;
          max-width: 1140px;
          margin: 3.5rem auto 2rem;
          padding: 0 1rem;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #f8fafc;
        }
        .social-hub-header {
          text-align: center;
          margin-bottom: 2.25rem;
          position: relative;
        }
        .social-hub-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.35);
          color: #f43f5e;
          padding: 0.35rem 1rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .social-hub-title {
          font-size: clamp(1.8rem, 4vw, 2.75rem);
          font-weight: 900;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .social-hub-subtitle {
          font-size: 1rem;
          color: #94a3b8;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.5;
        }
        .social-hub-ticker {
          display: inline-block;
          margin-top: 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 0.3rem 0.9rem;
          font-size: 0.8rem;
          color: #cbd5e1;
        }

        /* ── Asymmetric Bento Grid ── */
        .social-bento {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.25rem;
        }

        .bento-card {
          background: rgba(18, 20, 38, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.25rem;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }
        .bento-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        /* Span alignments */
        .card-yt-main { grid-column: span 7; min-height: 340px; }
        .card-ig-eko { grid-column: span 5; min-height: 340px; }
        .card-tiktok { grid-column: span 4; min-height: 320px; }
        .card-kick { grid-column: span 4; min-height: 320px; }
        .card-twitch { grid-column: span 4; min-height: 320px; }
        .card-ig-ege { grid-column: span 6; min-height: 240px; }
        .card-yt-second { grid-column: span 6; min-height: 240px; }

        @media (max-width: 980px) {
          .card-yt-main, .card-ig-eko, .card-tiktok, .card-kick, .card-twitch, .card-ig-ege, .card-yt-second {
            grid-column: span 12;
            min-height: auto;
          }
        }

        /* Top row in card */
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
        }
        .card-brand-badge {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .direct-link {
          font-size: 0.8rem;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .direct-link:hover {
          color: #fff;
          text-decoration: underline;
        }

        .card-heading {
          font-size: 1.25rem;
          font-weight: 900;
          margin: 0 0 0.35rem;
          line-height: 1.25;
          color: #fff;
        }
        .card-subtext {
          font-size: 0.85rem;
          color: #94a3b8;
          margin: 0 0 1rem;
          line-height: 1.4;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.65rem 1.4rem;
          border-radius: 0.75rem;
          font-weight: 800;
          font-size: 0.9rem;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          user-select: none;
        }
        .cta-btn:hover {
          transform: translateY(-2px) scale(1.02);
        }
        .cta-btn:active {
          transform: translateY(1px) scale(0.97);
        }

        /* ── Specific Interactive Elements ── */

        /* 1. YouTube Mock Player */
        .yt-player-box {
          background: #090a14;
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 1rem;
          padding: 1.25rem;
          margin-top: auto;
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        .yt-progress-bar {
          width: 0%;
          height: 4px;
          background: #ff0000;
          border-radius: 2px;
          transition: width 2.5s ease-out;
        }

        /* 2. Instagram Drag & Phone */
        .ig-phone-box {
          background: linear-gradient(135deg, rgba(225, 48, 108, 0.1) 0%, rgba(131, 58, 180, 0.1) 100%);
          border: 1px dashed rgba(225, 48, 108, 0.4);
          border-radius: 1rem;
          padding: 1rem;
          margin-top: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-height: 140px;
          justify-content: center;
        }
        .ig-draggable-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          font-size: 1.3rem;
          color: #fff;
          box-shadow: 0 4px 15px rgba(225, 48, 108, 0.4);
          transition: transform 0.2s;
          touch-action: none;
        }
        .ig-draggable-icon:active {
          cursor: grabbing;
          transform: scale(1.1);
        }

        /* 3. TikTok Swipe */
        .tt-slider-box {
          position: relative;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 242, 234, 0.25);
          border-radius: 1rem;
          padding: 1rem;
          margin-top: auto;
          overflow: hidden;
        }
        .tt-slide {
          display: none;
          animation: ttFade 0.3s ease;
        }
        .tt-slide.active { display: block; }
        @keyframes ttFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* 4. Kick Live Chat */
        .kick-chat-box {
          background: #0b120c;
          border: 1px solid rgba(83, 252, 24, 0.3);
          border-radius: 0.85rem;
          padding: 0.75rem;
          height: 115px;
          overflow: hidden;
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.75rem;
        }
        .kick-msg {
          animation: chatSlide 0.4s ease forwards;
        }
        @keyframes chatSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* 5. Twitch Retro Terminal */
        .twitch-terminal {
          background: #0e0720;
          border: 1px solid rgba(145, 71, 255, 0.35);
          border-radius: 0.85rem;
          padding: 0.85rem;
          font-family: monospace;
          font-size: 0.78rem;
          height: 115px;
          margin-top: auto;
          color: #c084fc;
        }

        /* 6. Ege Scratch Blur */
        .scratch-box {
          position: relative;
          border-radius: 1rem;
          overflow: hidden;
          margin-top: auto;
          cursor: crosshair;
          min-height: 110px;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .scratch-blur-layer {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          background: rgba(15, 23, 42, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.5s ease;
          font-size: 0.85rem;
          font-weight: 700;
          color: #ec4899;
        }

        /* 7. YouTube Second Key Unlock */
        .unlock-box {
          background: rgba(239, 68, 68, 0.08);
          border: 1px dashed rgba(239, 68, 68, 0.35);
          border-radius: 1rem;
          padding: 1rem;
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-around;
        }
        .unlock-key {
          font-size: 2rem;
          cursor: pointer;
          transition: transform 0.2s;
          user-select: none;
        }
        .unlock-key:hover {
          transform: scale(1.2) rotate(15deg);
        }

        /* Accessibility: Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .bento-card, .cta-btn, .kick-msg, .tt-slide, .yt-progress-bar {
            transition: none !important;
            animation: none !important;
          }
        }
      </style>

      <div class="social-hub-header">
        <div class="social-hub-badge">
          <span>⚡</span> ÖZEL INTERAKTİF SPONSOR & TOPLULUK ALANI
        </div>
        <h2 class="social-hub-title">
          EkoYıldız Resmi <span style="background: linear-gradient(135deg, #f43f5e 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Sosyal Medya Dünyası</span>
        </h2>
        <p class="social-hub-subtitle">
          Klasik reklamları unuttuk! Aşağıdaki interaktif mini deneyimlerle Eko Yıldız'ın resmi hesaplarını keşfet, katıl ve topluluğun parçası ol.
        </p>
        <div class="social-hub-ticker">
          💡 <em>"${randomHumor}"</em>
        </div>
      </div>

      <div class="social-bento">

        <!-- 1. YOUTUBE ANA KANAL (BÜYÜK VİDEO DENEYİMİ KARTI) -->
        <article class="bento-card card-yt-main" style="border-left: 4px solid #ef4444;" data-ad-key="youtube-main">
          <div class="card-top">
            <span class="card-brand-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">
              ▶ YOUTUBE &bull; ANA KANAL
            </span>
            <a href="${ytMain.targetUrl}" target="_blank" rel="noopener noreferrer" class="direct-link" onclick="trackSocialClick('youtube-main')">
              ${ytMain.directCta || 'Direkt Git →'}
            </a>
          </div>

          <h3 class="card-heading">${ytMain.title}</h3>
          <p class="card-subtext">${ytMain.subtitle}</p>

          <div class="yt-player-box" id="ytPlayerBox">
            <div id="ytInitial">
              <div style="font-size: 2.25rem; margin-bottom: 0.35rem; color: #ef4444; cursor: pointer;" onclick="startYoutubeExperience()">
                ▶
              </div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #fff;">Önizlemeyi Oynat</div>
              <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem;">(Mini animasyonu başlatmak için tıkla)</div>
            </div>

            <div id="ytPlaying" style="display: none; padding: 0.5rem 0;">
              <div style="font-size: 0.85rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem;">Yükleniyor...</div>
              <div style="background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; overflow: hidden; width: 100%;">
                <div id="ytProgress" class="yt-progress-bar"></div>
              </div>
            </div>

            <div id="ytReveal" style="display: none; padding: 0.5rem 0;">
              <div style="font-size: 1.1rem; font-weight: 900; color: #fef08a; margin-bottom: 0.3rem;">
                ⚠️ Video başlamadan önce önemli bir şey...
              </div>
              <div style="font-size: 0.85rem; color: #fff; margin-bottom: 0.85rem;">
                Abone olmayı unuttun! Resmi kanalımıza katılarak her gün Roblox videolarını kaçırma.
              </div>
              <a href="${ytMain.targetUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="background: #ef4444; color: #fff;" onclick="trackSocialClick('youtube-main')">
                🔔 ${ytMain.ctaText}
              </a>
            </div>
          </div>
        </article>

        <!-- 2. INSTAGRAM EKO ANA HESAP (DRAG & PHONE KARTI) -->
        <article class="bento-card card-ig-eko" style="border-left: 4px solid #e1306c;" data-ad-key="instagram-eko">
          <div class="card-top">
            <span class="card-brand-badge" style="background: rgba(225, 48, 108, 0.15); color: #e1306c; border: 1px solid rgba(225, 48, 108, 0.3);">
              📸 INSTAGRAM &bull; EKO
            </span>
            <a href="${igEko.targetUrl}" target="_blank" rel="noopener noreferrer" class="direct-link" onclick="trackSocialClick('instagram-eko')">
              ${igEko.directCta || 'Direkt Git →'}
            </a>
          </div>

          <h3 class="card-heading">${igEko.title}</h3>
          <p class="card-subtext">${igEko.subtitle}</p>

          <div class="ig-phone-box" id="igDropZone" ondragover="event.preventDefault()" ondrop="handleIgDrop(event)">
            <div id="igInitialState" style="text-align: center;">
              <div style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.6rem;">
                👇 İkonu bu alana sürükle veya tıkla:
              </div>
              <div id="igDragIcon" class="ig-draggable-icon" draggable="true" ondragstart="handleIgDragStart(event)" onclick="completeIgExperience()">
                📷
              </div>
            </div>

            <div id="igUnlockedState" style="display: none; text-align: center;">
              <div style="font-size: 1.5rem; margin-bottom: 0.2rem;">❤️ ❤️ ❤️</div>
              <div style="font-size: 0.9rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
                Tamam tamam, yakaladın! Şimdi Eko'yu stalklamaya gidebilirsin 👀
              </div>
              <a href="${igEko.targetUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="background: linear-gradient(135deg, #e1306c, #833ab4); color: #fff;" onclick="trackSocialClick('instagram-eko')">
                🚀 ${igEko.ctaText}
              </a>
            </div>
          </div>
        </article>

        <!-- 3. TIKTOK (DİKEY VİDEO SWIPE FEED KARTI) -->
        <article class="bento-card card-tiktok" style="border-left: 4px solid #00f2fe;" data-ad-key="tiktok">
          <div class="card-top">
            <span class="card-brand-badge" style="background: rgba(0, 242, 234, 0.15); color: #00f2fe; border: 1px solid rgba(0, 242, 234, 0.3);">
              🎵 TIKTOK &bull; @kimdirbueko
            </span>
            <a href="${tiktok.targetUrl}" target="_blank" rel="noopener noreferrer" class="direct-link" onclick="trackSocialClick('tiktok')">
              ${tiktok.directCta || 'Direkt Git →'}
            </a>
          </div>

          <h3 class="card-heading">${tiktok.title}</h3>
          <p class="card-subtext">${tiktok.subtitle}</p>

          <div class="tt-slider-box" id="ttSliderBox" onclick="nextTiktokSlide()">
            <div class="tt-slide active" id="ttSlide1">
              <div style="font-size: 0.8rem; color: #00f2fe; font-weight: 800;">#1 SHORT PREVIEW</div>
              <div style="font-size: 0.95rem; font-weight: 700; color: #fff; margin: 0.4rem 0;">"Roblox'ta En Hızlı Harita Kaçışı ⚡"</div>
              <div style="font-size: 0.75rem; color: #94a3b8;">(Sonraki video için tıkla ➔)</div>
            </div>

            <div class="tt-slide" id="ttSlide2">
              <div style="font-size: 0.8rem; color: #ff0050; font-weight: 800;">#2 SHORT PREVIEW</div>
              <div style="font-size: 0.95rem; font-weight: 700; color: #fff; margin: 0.4rem 0;">"Adminlerin Çıldırdığı O Anlar 😂"</div>
              <div style="font-size: 0.75rem; color: #94a3b8;">(Sonraki video için tıkla ➔)</div>
            </div>

            <div class="tt-slide" id="ttSlide3">
              <div style="font-size: 0.95rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
                Kaydırmayı bırak! Eko'nun TikTok'una git.
              </div>
              <a href="${tiktok.targetUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="background: linear-gradient(135deg, #00f2fe, #ff0050); color: #000;" onclick="trackSocialClick('tiktok')">
                🔥 ${tiktok.ctaText}
              </a>
            </div>
          </div>
        </article>

        <!-- 4. KICK (CANLI YAYIN & SİMÜLE EDİLMİŞ CHAT) -->
        <article class="bento-card card-kick" style="border-left: 4px solid #53fc18;" data-ad-key="kick">
          <div class="card-top">
            <span class="card-brand-badge" style="background: rgba(83, 252, 24, 0.15); color: #53fc18; border: 1px solid rgba(83, 252, 24, 0.3);">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#53fc18;"></span> KICK CANLI YAYIN
            </span>
            <a href="${kick.targetUrl}" target="_blank" rel="noopener noreferrer" class="direct-link" onclick="trackSocialClick('kick')">
              ${kick.directCta || 'Direkt Git →'}
            </a>
          </div>

          <h3 class="card-heading">${kick.title}</h3>
          <p class="card-subtext">${kick.subtitle}</p>

          <div class="kick-chat-box" id="kickChatBox">
            <div class="kick-msg"><strong style="color:#53fc18;">RobloxKing:</strong> W yayın açıldı beyler!</div>
            <div class="kick-msg"><strong style="color:#38bdf8;">Zeynep_TR:</strong> Eko map yine mi bozuldu ahaha</div>
            <div class="kick-msg"><strong style="color:#fbbf24;">Admin_Mod:</strong> CHAT SAKİN OLUN 🟢</div>
          </div>

          <div style="margin-top: 0.85rem; text-align: right;">
            <a href="${kick.targetUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="background: #53fc18; color: #000;" onclick="trackSocialClick('kick')">
              🟢 ${kick.ctaText}
            </a>
          </div>
        </article>

        <!-- 5. TWITCH (RETRO YAYIN & TERMINAL EKRANI) -->
        <article class="bento-card card-twitch" style="border-left: 4px solid #9146ff;" data-ad-key="twitch">
          <div class="card-top">
            <span class="card-brand-badge" style="background: rgba(145, 70, 255, 0.15); color: #a855f7; border: 1px solid rgba(145, 70, 255, 0.3);">
              💜 TWITCH &bull; ekoyildiz
            </span>
            <a href="${twitch.targetUrl}" target="_blank" rel="noopener noreferrer" class="direct-link" onclick="trackSocialClick('twitch')">
              ${twitch.directCta || 'Direkt Git →'}
            </a>
          </div>

          <h3 class="card-heading">${twitch.title}</h3>
          <p class="card-subtext">${twitch.subtitle}</p>

          <div class="twitch-terminal" id="twitchTerminal">
            <div>> twitch.connect("ekoyildiz")</div>
            <div>> [OK] Frekans arandı...</div>
            <div id="twitchStatusLine" style="color: #4ade80;">> [HAZIR] Eko kanalı bulundu ✓</div>
          </div>

          <div style="margin-top: 0.85rem; text-align: right;">
            <a href="${twitch.targetUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="background: #9146ff; color: #fff;" onclick="trackSocialClick('twitch')">
              🎮 ${twitch.ctaText}
            </a>
          </div>
        </article>

        <!-- 6. INSTAGRAM EGE (SCRATCH / BLUR KAZIMA KARTI) -->
        <article class="bento-card card-ig-ege" style="border-left: 4px solid #ec4899;" data-ad-key="instagram-ege">
          <div class="card-top">
            <span class="card-brand-badge" style="background: rgba(236, 72, 153, 0.15); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.3);">
              ✨ EGE KİŞİSEL & YAN HESAP
            </span>
            <a href="${igEge.targetUrl}" target="_blank" rel="noopener noreferrer" class="direct-link" onclick="trackSocialClick('instagram-ege')">
              ${igEge.directCta || 'Direkt Git →'}
            </a>
          </div>

          <h3 class="card-heading">${igEge.title}</h3>
          <p class="card-subtext">${igEge.subtitle}</p>

          <div class="scratch-box" onmousemove="revealEgeBlur()" onclick="revealEgeBlur()" ontouchmove="revealEgeBlur()">
            <div class="scratch-blur-layer" id="egeBlurLayer">
              🔍 Üzerinde gezdir veya tıkla (Bulanıklığı Temizle)
            </div>
            <div id="egeRevealed" style="text-align: center; padding: 0.5rem;">
              <div style="font-weight: 800; color: #fdf2f8; font-size: 0.95rem; margin-bottom: 0.4rem;">
                Tamam, artık görebilirsin!
              </div>
              <a href="${igEge.targetUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="background: #ec4899; color: #fff;" onclick="trackSocialClick('instagram-ege')">
                📸 ${igEge.ctaText}
              </a>
            </div>
          </div>
        </article>

        <!-- 7. YOUTUBE YAN KANAL (ANAHTAR VE KİLİT AÇMA) -->
        <article class="bento-card card-yt-second" style="border-left: 4px solid #fbbf24;" data-ad-key="youtube-second">
          <div class="card-top">
            <span class="card-brand-badge" style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3);">
              🔓 YOUTUBE 2 &bull; YEDEK KANAL
            </span>
            <a href="${ytSecond.targetUrl}" target="_blank" rel="noopener noreferrer" class="direct-link" onclick="trackSocialClick('youtube-second')">
              ${ytSecond.directCta || 'Direkt Git →'}
            </a>
          </div>

          <h3 class="card-heading">${ytSecond.title}</h3>
          <p class="card-subtext">${ytSecond.subtitle}</p>

          <div class="unlock-box" id="unlockBox">
            <div id="unlockLockedState" style="display: flex; align-items: center; justify-content: space-around; width: 100%;">
              <span class="unlock-key" id="unlockKey" draggable="true" ondragstart="unlockYoutubeSecond()" ontouchstart="unlockYoutubeSecond()" onclick="unlockYoutubeSecond()" title="Kilidi açmak için tıkla veya sürükle">🗝️</span>
              <span style="font-size: 0.85rem; color: #94a3b8;">➔ Anahtarı kilide götür veya tıkla ➔</span>
              <span style="font-size: 2rem; cursor: pointer;" id="unlockLock" onclick="unlockYoutubeSecond()" ondragover="event.preventDefault()" ondrop="unlockYoutubeSecond()">🔒</span>
            </div>

            <div id="unlockOpenState" style="display: none; text-align: center; width: 100%;">
              <div style="font-size: 1rem; font-weight: 800; color: #fbbf24; margin-bottom: 0.4rem;">
                Yan Kanal Açıldı 🔓
              </div>
              <a href="${ytSecond.targetUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="background: #fbbf24; color: #000;" onclick="trackSocialClick('youtube-second')">
                🚀 ${ytSecond.ctaText}
              </a>
            </div>
          </div>
        </article>

      </div>
    </section>

    <!-- ── Interactive Logic Script ── -->
    <script>
      (function() {
        // Send impression tracking beacon for all visible cards
        try {
          var cards = document.querySelectorAll('.bento-card[data-ad-key]');
          cards.forEach(function(card) {
            var k = card.getAttribute('data-ad-key');
            if (k) {
              var payload = JSON.stringify({ adKey: k, eventType: 'card_view' });
              if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/social-ads/event', new Blob([payload], { type: 'application/json' }));
              } else {
                fetch('/api/social-ads/event', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: payload
                }).catch(function(){});
              }
            }
          });
        } catch(e) {}
      })();

      function trackSocialClick(adKey) {
        try {
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/social-ads/event', new Blob([JSON.stringify({ adKey: adKey, eventType: 'social_link_clicked' })], { type: 'application/json' }));
          }
        } catch(e) {}
      }

      function recordInteraction(adKey, type) {
        try {
          fetch('/api/social-ads/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adKey: adKey, eventType: type })
          }).catch(function(){});
        } catch(e) {}
      }

      // 1. YouTube Mock Player
      function startYoutubeExperience() {
        recordInteraction('youtube-main', 'interaction_started');
        document.getElementById('ytInitial').style.display = 'none';
        document.getElementById('ytPlaying').style.display = 'block';
        const progress = document.getElementById('ytProgress');
        setTimeout(function() { progress.style.width = '100%'; }, 50);

        setTimeout(function() {
          document.getElementById('ytPlaying').style.display = 'none';
          document.getElementById('ytReveal').style.display = 'block';
          recordInteraction('youtube-main', 'interaction_completed');
        }, 2600);
      }

      // 2. Instagram Drag & Phone
      function handleIgDragStart(e) {
        e.dataTransfer.setData('text/plain', 'ig-icon');
        recordInteraction('instagram-eko', 'interaction_started');
      }

      function handleIgDrop(e) {
        e.preventDefault();
        completeIgExperience();
      }

      function completeIgExperience() {
        document.getElementById('igInitialState').style.display = 'none';
        document.getElementById('igUnlockedState').style.display = 'block';
        recordInteraction('instagram-eko', 'interaction_completed');
      }

      // 3. TikTok Carousel
      let currentTtSlide = 1;
      function nextTiktokSlide() {
        recordInteraction('tiktok', 'interaction_started');
        document.getElementById('ttSlide' + currentTtSlide).classList.remove('active');
        currentTtSlide++;
        if (currentTtSlide > 3) currentTtSlide = 3;
        document.getElementById('ttSlide' + currentTtSlide).classList.add('active');
        if (currentTtSlide === 3) {
          recordInteraction('tiktok', 'interaction_completed');
        }
      }

      // 4. Ege Scratch Blur
      let egeCleared = false;
      function revealEgeBlur() {
        if (egeCleared) return;
        recordInteraction('instagram-ege', 'interaction_started');
        const layer = document.getElementById('egeBlurLayer');
        if (layer) {
          layer.style.opacity = '0';
          setTimeout(function() { layer.style.display = 'none'; }, 500);
          egeCleared = true;
          recordInteraction('instagram-ege', 'interaction_completed');
        }
      }

      // 5. YouTube Second Unlock
      function unlockYoutubeSecond() {
        recordInteraction('youtube-second', 'interaction_started');
        const key = document.getElementById('unlockKey');
        const lock = document.getElementById('unlockLock');
        key.style.transform = 'translateX(60px) rotate(45deg)';
        setTimeout(function() {
          lock.innerText = '🔓';
          setTimeout(function() {
            document.getElementById('unlockLockedState').style.display = 'none';
            document.getElementById('unlockOpenState').style.display = 'block';
            recordInteraction('youtube-second', 'interaction_completed');
          }, 400);
        }, 300);
      }

      // 6. Kick Chat Auto-Ticker
      const kickChatBox = document.getElementById('kickChatBox');
      if (kickChatBox) {
        const sampleMsgs = [
          '<div class="kick-msg"><strong style="color:#53fc18;">ege33:</strong> Chat selamlar W stream</div>',
          '<div class="kick-msg"><strong style="color:#ec4899;">GamerGirl:</strong> Yayındayız koşun 🚀</div>',
          '<div class="kick-msg"><strong style="color:#38bdf8;">RobuxHunter:</strong> Çekiliş ne zaman başlıyor?</div>',
          '<div class="kick-msg"><strong style="color:#fbbf24;">EkoMod:</strong> Chat spam yapmayın link profilde!</div>'
        ];
        let msgIndex = 0;
        setInterval(function() {
          if (kickChatBox.children.length > 5) {
            kickChatBox.removeChild(kickChatBox.children[0]);
          }
          const div = document.createElement('div');
          div.innerHTML = sampleMsgs[msgIndex % sampleMsgs.length];
          kickChatBox.appendChild(div.firstChild);
          kickChatBox.scrollTop = kickChatBox.scrollHeight;
          msgIndex++;
        }, 3500);
      }
    </script>
    `;
  }
}

const socialHubService = new SocialHubService();

module.exports = socialHubService;
