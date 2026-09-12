'use strict';

const { sponsorAds } = require('../../models/Store');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class SponsorAdService {
  constructor() {
    this._ensureSeeded();
  }

  _ensureSeeded() {
    try {
      const existing = sponsorAds.find({});
      if (!existing || existing.length === 0) {
        sponsorAds.create({
          title: "EkoYıldız Resmî Roblox Pazar Yeri & Mağazası",
          description: "En güvenilir Roblox eşyaları, sınırlı üretim kozmetikler ve topluluk ayrıcalıkları avantajlı fiyatlarla sizleri bekliyor!",
          imageUrl: "https://i.imgur.com/PFcAc6q.png",
          sponsorName: "EkoYıldız Store",
          targetUrl: "https://discord.gg/1367646464804655104",
          ctaText: "Hemen İncele 🚀",
          startDate: new Date('2026-01-01'),
          endDate: new Date('2027-12-31'),
          isActive: true,
          priority: 20,
          impressions: 0,
          clicks: 0
        });

        sponsorAds.create({
          title: "Sentara Yüksek Hızlı Destek Masası",
          description: "RobloxLand & EkoYıldız geliştirici ekosisteminde 7/24 kesintisiz moderasyon ve teknik bilet güvencesi.",
          imageUrl: "https://i.imgur.com/HT7bvru.png",
          sponsorName: "Sentara Ecosystem",
          targetUrl: "/tickets",
          ctaText: "Destek Al 💬",
          startDate: new Date('2026-01-01'),
          endDate: new Date('2027-12-31'),
          isActive: true,
          priority: 15,
          impressions: 0,
          clicks: 0
        });
      }

      // Resmî topluluk bağlantıları sabit tutulur; eski sponsor kayıtları
      // varsa da yanlış/eskimiş Discord davetleri göstermesin.
      const officialAds = [
        {
          match: 'EkoYıldız Store',
          title: 'EkoYıldız Resmî Discord Sunucusu',
          description: 'EkoYıldız topluluğuna katıl, duyuruları ve etkinlikleri tek yerden takip et.',
          sponsorName: 'EkoYıldız', targetUrl: 'https://discord.gg/rEu5gvRBdM', ctaText: 'Sunucuya katıl', priority: 30
        },
        {
          match: 'Sentara Ecosystem',
          title: 'RobloxLand Resmî Discord Sunucusu',
          description: 'RobloxLand topluluğu, destek kanalları ve güncel duyurular için resmî sunucu.',
          sponsorName: 'RobloxLand', targetUrl: 'https://discord.gg/tfykdvvdPT', ctaText: 'RobloxLand’e git', priority: 25
        }
      ];
      for (const official of officialAds) {
        const ad = existing.find(item => item.sponsorName === official.match || item.targetUrl === official.targetUrl);
        if (ad) {
          Object.assign(ad, official);
          delete ad.match;
          ad.isActive = true;
          ad.save();
        } else {
          const { match, ...data } = official;
          sponsorAds.create({ ...data, imageUrl: 'https://i.imgur.com/PFcAc6q.png', startDate: new Date('2026-01-01'), endDate: new Date('2027-12-31'), isActive: true, impressions: 0, clicks: 0 });
        }
      }
    } catch (err) {
      console.error('[SponsorAdService] Seed hatası:', err.message);
    }
  }

  seedDefaultAds() {
    return this._ensureSeeded();
  }

  /**
   * Aktif ve tarih kriterlerine uyan tüm reklamları getirir
   */
  getActiveAds() {
    const now = new Date();
    const all = sponsorAds.find({});
    return all.filter(ad => {
      if (!ad.isActive) return false;
      if (ad.startDate && new Date(ad.startDate) > now) return false;
      if (ad.endDate && new Date(ad.endDate) < now) return false;
      return true;
    });
  }

  /**
   * Öncelik ağırlıklı rastgele aktif bir reklam seçer
   */
  getRandomActiveAd() {
    const activeAds = this.getActiveAds();
    if (!activeAds || activeAds.length === 0) return null;
    if (activeAds.length === 1) return activeAds[0];

    const totalWeight = activeAds.reduce((sum, ad) => sum + Math.max(1, Number(ad.priority) || 10), 0);
    let randomNum = Math.random() * totalWeight;

    for (const ad of activeAds) {
      const weight = Math.max(1, Number(ad.priority) || 10);
      if (randomNum < weight) {
        return ad;
      }
      randomNum -= weight;
    }

    return activeAds[0];
  }

  /**
   * Gösterim (impression) kaydeder
   */
  recordImpression(id) {
    const ad = sponsorAds.findById(id);
    if (!ad) return false;
    ad.impressions = (Number(ad.impressions) || 0) + 1;
    ad.save();
    return true;
  }

  /**
   * Tıklama (click) kaydeder ve yönlendirme linkini döner
   */
  recordClick(id) {
    const ad = sponsorAds.findById(id);
    if (!ad) return null;
    ad.clicks = (Number(ad.clicks) || 0) + 1;
    ad.save();
    return ad.targetUrl || '/';
  }

  /**
   * Reklam istatistiklerini hesaplar (CTR vb.)
   */
  getAdWithStats(ad) {
    const impressions = Number(ad.impressions) || 0;
    const clicks = Number(ad.clicks) || 0;
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00";
    return {
      ...ad,
      impressions,
      clicks,
      ctr: `${ctr}%`
    };
  }

  /**
   * Tüm reklamları performans metrikleriyle listeler
   */
  getAllAdsWithStats() {
    const all = sponsorAds.find({});
    return all.map(ad => this.getAdWithStats(ad)).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  getAllAds() {
    return this.getAllAdsWithStats();
  }

  _isSafeTargetUrl(value) {
    const url = String(value || '').trim();
    if (url.startsWith('/')) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  createAd(data = {}) {
    const title = String(data.title || '').trim();
    const targetUrl = String(data.targetUrl || '').trim();
    if (title.length < 3) throw new Error('Reklam başlığı en az 3 karakter olmalıdır.');
    if (!this._isSafeTargetUrl(targetUrl)) throw new Error('Geçerli bir hedef bağlantı giriniz.');

    return sponsorAds.create({
      title,
      description: String(data.description || '').trim(),
      imageUrl: this._isSafeTargetUrl(data.imageUrl) ? String(data.imageUrl).trim() : '',
      sponsorName: String(data.sponsorName || 'EkoYıldız Partner').trim(),
      targetUrl,
      ctaText: String(data.ctaText || 'Hemen İncele').trim(),
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isActive: data.isActive !== false && data.isActive !== 'false',
      priority: Math.max(1, Number(data.priority) || 1),
      impressions: 0,
      clicks: 0
    });
  }

  toggleAdActive(id) {
    const ad = sponsorAds.findById(id);
    if (!ad) throw new Error('Reklam bulunamadı.');
    ad.isActive = !ad.isActive;
    ad.save();
    return ad;
  }

  deleteAd(id) {
    const ad = sponsorAds.findById(id);
    if (!ad) throw new Error('Reklam bulunamadı.');
    sponsorAds.deleteById(ad._id);
    return true;
  }

  /**
   * Sayfalarda render edilmek üzere modern HTML bileşeni üretir.
   * Aktif reklam yoksa KESİNLİKLE boşluk veya kırık kutu bırakmaz (boş string döner).
   */
  renderSponsorAdHtml(customAd = null) {
    const ad = customAd || this.getRandomActiveAd();
    if (!ad) {
      return ''; // Hiçbir aktif reklam yoksa sıfır görsel artık, boşluk yok!
    }

    const adId = escapeHtml(ad._id);
    const title = escapeHtml(ad.title || 'Sponsorlu İçerik');
    const description = escapeHtml(ad.description || '');
    const sponsor = escapeHtml(ad.sponsorName || 'EkoYıldız Partner');
    const cta = escapeHtml(ad.ctaText || 'Hemen İncele ➔');
    const image = escapeHtml(this._isSafeTargetUrl(ad.imageUrl) ? ad.imageUrl : 'https://i.imgur.com/PFcAc6q.png');

    return `
      <div class="sponsor-ad-card-wrapper" id="sponsor-ad-${adId}" data-ad-id="${adId}" role="complementary" aria-label="Sponsorlu Alan">
        <div class="sponsor-ad-header">
          <span class="sponsor-ad-tag">
            <span class="sponsor-ad-dot"></span> SPONSORLU BAĞLANTI
          </span>
          <span class="sponsor-ad-by">${sponsor}</span>
        </div>
        <div class="sponsor-ad-body">
          <div class="sponsor-ad-image-box">
            <img src="${image}" alt="${title}" loading="lazy" class="sponsor-ad-img" onerror="this.onerror=null;this.src='https://i.imgur.com/PFcAc6q.png'">
          </div>
          <div class="sponsor-ad-content">
            <h4 class="sponsor-ad-title">${title}</h4>
            <p class="sponsor-ad-desc">${description}</p>
          </div>
          <div class="sponsor-ad-action">
            <a href="/api/ads/${adId}/click" target="_blank" rel="noopener noreferrer sponsored" class="sponsor-ad-cta-btn">
              ${cta}
            </a>
          </div>
        </div>
      </div>
      <script>
        (function() {
          try {
            if (!window.__trackedAds) window.__trackedAds = {};
            if (!window.__trackedAds['${adId}']) {
              window.__trackedAds['${adId}'] = true;
              if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/ads/${adId}/impression');
              } else {
                fetch('/api/ads/${adId}/impression', { method: 'POST', keepalive: true }).catch(function(){});
              }
            }
          } catch(e) {}
        })();
      </script>
    `;
  }
}

const sponsorAdService = new SponsorAdService();

module.exports = sponsorAdService;
