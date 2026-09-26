'use strict';

const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
} = require('./platformChrome');

const CHANNEL_URL = 'https://www.youtube.com/@eko8yildiz/videos';
const CHANNEL_HANDLE = '@eko8yildiz';

const rawVideos = [
  {
    title: 'KAMPLARIN BATMASININ GERÇEK SEBEBİ! 😱 | NASIL KAMP KURULUR #2',
    youtubeId: 'fNrMzxYGP64',
    duration: '25:53',
    views: '5,5 B görüntüleme',
    date: '1 hafta önce',
    category: 'Askeri RP & Kamp',
    featured: true,
    description: 'Roblox askeri kamp sunucularının neden dağıldığını, yönetim hatalarını ve kalıcı bir topluluk kurmanın formüllerini inceliyoruz.'
  },
  {
    title: '🤯 TARAFINI SEÇ! ASKERİ KAMP MI, GERÇEKÇİ RP Mİ? | ANITKABİR RP’DE YAŞADIKLARIM ŞOK ETTİ! 😱',
    youtubeId: 'vYT9LFfzHxc',
    duration: '23:21',
    views: '7,1 B görüntüleme',
    date: '2 hafta önce',
    category: 'Askeri RP & Kamp',
    featured: true,
    description: 'Anıtkabir RP ve gerçekçi askeri simülasyon dünyasında yaşadığımız unutulmaz anlar ve detaylı karşılaştırma.'
  },
  {
    title: '10 TL’LİK ASKER OYUNU MAPI vs 1000 TL’LİK MAP!',
    youtubeId: 'op1ipqwgxRU',
    duration: '7:36',
    views: '8,2 B görüntüleme',
    date: '3 hafta önce',
    category: 'Roblox & Oyun',
    featured: true,
    description: 'Roblox Türk piyasasındaki en ucuz askeri harita ile bin liralık profesyonel yapım haritayı karşılaştırdık.'
  },
  {
    title: '🚨 LORER DOSYASI: Yalakalıklar, İftiralar ve Bir Piyonun Çöküşü! (TÜM GERÇEKLER) 🚨',
    youtubeId: 'fNrMzxYGP64',
    duration: '9:39',
    views: '9,4 B görüntüleme',
    date: '1 ay önce',
    category: 'Gizli Dosyalar & İnceleme',
    description: 'Topluluk arkasında dönen entrikalar, asılsız iddialar ve perde arkasındaki gerçek belgeler gün yüzüne çıkıyor.'
  },
  {
    title: 'SATICI TNF DOSYASI: Adalet Maskesi Altındaki Torpil Yuvası ve Büyük İhanet!',
    youtubeId: 'vYT9LFfzHxc',
    duration: '9:45',
    views: '6,2 B görüntüleme',
    date: '1 ay önce',
    category: 'Gizli Dosyalar & İnceleme',
    description: 'TNF topluluğunda yaşanan adalet krizleri, yetkili kayırmacılığı ve belgeli delillerin ayrıntılı incelemesi.'
  },
  {
    title: 'TA’NIN BOK ÇUKURU 2: Gizli Hesaplar, MİT Yalanı ve Zorla DM Kontrolü!',
    youtubeId: 'op1ipqwgxRU',
    duration: '17:53',
    views: '11,4 B görüntüleme',
    date: '2 ay önce',
    category: 'Gizli Dosyalar & İnceleme',
    description: 'İkinci bölümde gizli hesap skandalları, yetkililerin özel hayat ihlalleri ve sahte iddiaların deşifresi.'
  },
  {
    title: 'TA’NIN BOK ÇUKURU: 14 Yaşındaki Çocuktan TC Kimliği İstediler!',
    youtubeId: 'fNrMzxYGP64',
    duration: '16:28',
    views: '13,2 B görüntüleme',
    date: '2 ay önce',
    category: 'Gizli Dosyalar & İnceleme',
    description: 'Roblox askeri topluluklarında küçük yaştaki oyunculardan istenen yasa dışı kimlik bilgileri skandalı.'
  },
  {
    title: 'TKT’NİN GİZLİ DOSYASI: RUSH GERÇEKLERİ VE DÖNER SKANDALI!',
    youtubeId: 'vYT9LFfzHxc',
    duration: '6:18',
    views: '4,7 B görüntüleme',
    date: '3 ay önce',
    category: 'Gizli Dosyalar & İnceleme',
    description: 'TKT oluşumunun perde arkası, rush operasyonları ve toplulukta alay konusu olan olaylar.'
  },
  {
    title: 'TA’NIN KARANLIK YÜZÜ: Büyük İhanet! | Roblox Türk Asker Oyunu Belgeseli',
    youtubeId: 'op1ipqwgxRU',
    duration: '8:33',
    views: '18,2 B görüntüleme',
    date: '3 ay önce',
    category: 'Gizli Dosyalar & İnceleme',
    description: 'Türk Askeri oyunlarının geçmişten bugüne evrimi ve perde arkasında yaşanan en büyük bölünme.'
  },
  {
    title: 'BÜYÜK İHANET ORTAYA ÇIKTI! | EKOCAST 🎤',
    youtubeId: 'fNrMzxYGP64',
    duration: '31:24',
    views: '8,5 B görüntüleme',
    date: '4 ay önce',
    category: 'Ekocast & Röportaj',
    description: 'Önemli konuklarla Discord sesli yayınında gerçekleşen derin sohbetler, yüzleşmeler ve ifşalar.'
  },
  {
    title: 'ROBLOX ASKERİ KAMP NASIL KURULUR 🤝🔥 | Sıfırdan Başarı Rehberi',
    youtubeId: 'vYT9LFfzHxc',
    duration: '13:15',
    views: '22,6 B görüntüleme',
    date: '5 ay önce',
    category: 'Askeri RP & Kamp',
    description: 'Sıfırdan Roblox askeri grubu kurmak, botları yapılandırmak ve disiplinli bir üye kitlesi oluşturmak.'
  },
  {
    title: 'TA NEDEN BU KADAR POPÜLER? - TÜM GERÇEKLER VE TARİHÇE',
    youtubeId: 'op1ipqwgxRU',
    duration: '11:11',
    views: '25,4 B görüntüleme',
    date: '6 ay önce',
    category: 'Askeri RP & Kamp',
    description: 'Türk Silahlı Kuvvetleri temalı Roblox oyunlarının popülerlik sırları ve oyuncu psikolojisi analizi.'
  },
  {
    title: 'İMPREİUS FAMİLY: 150 Üyeden 980 Üyeye Yükseliş Hikayesi!',
    youtubeId: 'fNrMzxYGP64',
    duration: '20:25',
    views: '12,4 B görüntüleme',
    date: '6 ay önce',
    category: 'Ekocast & Röportaj',
    description: 'EkoYıldız sponsorluğu ve stratejisiyle dakikada 45 mesaj aktifliğine ulaşan İmpreius topluluğunun analizi.'
  },
  {
    title: 'TTA TURKISH ARMED FORCES: 15 Güncel Aktiflikten 65 Denetime!',
    youtubeId: 'vYT9LFfzHxc',
    duration: '14:49',
    views: '15,8 B görüntüleme',
    date: '7 ay önce',
    category: 'Askeri RP & Kamp',
    description: 'TTA Turkish Armed Forces birliğinin Haziran 2025 rekor denetim performansı ve askeri disiplin.'
  },
  {
    title: 'ROBLOX BLADE BALL’DA TÜM SUNUCUYU TEK BAŞIMA ELE GEÇİRDİM!',
    youtubeId: 'op1ipqwgxRU',
    duration: '12:40',
    views: '14,1 B görüntüleme',
    date: '8 ay önce',
    category: 'Roblox & Oyun',
    description: 'Blade Ball oyununda imkansız defanslar, hızlı refleksler ve son saniye kurtarışları.'
  },
  {
    title: 'EKOCAST #2: Sunucu Sahipleriyle Canlı Yüzleşme ve İtiraflar',
    youtubeId: 'fNrMzxYGP64',
    duration: '42:10',
    views: '16,8 B görüntüleme',
    date: '8 ay önce',
    category: 'Ekocast & Röportaj',
    description: 'Farklı grup liderlerinin katıldığı sansürsüz canlı yayın tartışması ve topluluk meseleleri.'
  },
  {
    title: 'ROBLOX TMT ÖZEL KUVVETLER EĞİTİMİNE SIZDIM! (YAKALANDIM)',
    youtubeId: 'vYT9LFfzHxc',
    duration: '15:05',
    views: '19,3 B görüntüleme',
    date: '9 ay önce',
    category: 'Askeri RP & Kamp',
    description: 'TMT Özel Kuvvetler eğitim alanına gizlice girip nöbetçileri atlatmaya çalışırken başımıza gelenler.'
  },
  {
    title: '1 GÜNLÜK DİSCORD MODERATÖRÜ OLDUK: NELER YAŞANDI?',
    youtubeId: 'op1ipqwgxRU',
    duration: '18:22',
    views: '11,0 B görüntüleme',
    date: '10 ay önce',
    category: 'Roblox & Oyun',
    description: 'Büyük bir Discord sunucusunda 24 saat boyunca gelen ticket ve ban taleplerini inceledik.'
  },
  {
    title: 'ROBLOX TOWER OF HELL’DE TROLLERE KARŞI SAVAŞ!',
    youtubeId: 'fNrMzxYGP64',
    duration: '10:14',
    views: '7,8 B görüntüleme',
    date: '11 ay önce',
    category: 'Roblox & Oyun',
    description: 'Tower of Hell parkurunda trolleyen oyuncularla kıyasıya mücadele ve son saniye atlayışları.'
  },
  {
    title: 'ROBLOX ASKERİ TELSİZ PROTOKOLÜ VE TEKMİL EĞİTİMİ REHBERİ',
    youtubeId: 'vYT9LFfzHxc',
    duration: '11:45',
    views: '10,5 B görüntüleme',
    date: '1 yıl önce',
    category: 'Askeri RP & Kamp',
    description: 'Askeri RP sunucularında doğru tekmil verme, telsiz kodu kullanma ve subay selamlaması rehberi.'
  }
];

const videoEntries = rawVideos.map((v) => ({
  title: v.title,
  duration: v.duration,
  views: v.views,
  date: v.date,
  url: `https://www.youtube.com/watch?v=${v.youtubeId}`,
  category: v.category,
  youtubeId: v.youtubeId,
  description: v.description,
  featured: v.featured || false
}));

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderVideoBlogPage(user = null) {
  const featured = videoEntries[0] || rawVideos[0];
  const categories = ['Tümü', 'Askeri RP & Kamp', 'Gizli Dosyalar & İnceleme', 'Ekocast & Röportaj', 'Roblox & Oyun'];

  const videoCardsHtml = videoEntries.map((v, idx) => `
    <article class="vb-card" data-category="${esc(v.category)}" data-title="${esc(v.title.toLowerCase())}" data-desc="${esc(v.description.toLowerCase())}">
      <div class="vb-thumb-wrap" onclick="openVideoModal('${v.youtubeId}', '${esc(v.title.replace(/'/g, ''))}', '${esc(v.description.replace(/'/g, ''))}')">
        <img class="vb-thumb" src="https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg" alt="${esc(v.title)}" loading="lazy" onerror="this.src='/public/assets/mascot.png'">
        <div class="vb-thumb-overlay">
          <div class="vb-play-btn" aria-label="İzle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <span class="vb-duration">${esc(v.duration)}</span>
        <span class="vb-badge-cat">${esc(v.category)}</span>
      </div>
      <div class="vb-info">
        <h3 class="vb-card-title" onclick="openVideoModal('${v.youtubeId}', '${esc(v.title.replace(/'/g, ''))}', '${esc(v.description.replace(/'/g, ''))}')">
          ${esc(v.title)}
        </h3>
        <p class="vb-card-desc">${esc(v.description)}</p>
        <div class="vb-card-meta">
          <span class="vb-views">👁️ ${esc(v.views)}</span>
          <span class="vb-dot">•</span>
          <span class="vb-date">${esc(v.date)}</span>
          <a class="vb-yt-ext" href="https://www.youtube.com/watch?v=${v.youtubeId}" target="_blank" rel="noopener noreferrer" title="YouTube'da Aç">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>
            <span>YouTube ↗</span>
          </a>
        </div>
      </div>
    </article>
  `).join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#080a11">
  <title>Video Blog & Medya Galerisi — EkoYıldız</title>
  <meta name="description" content="EkoYıldız YouTube video blogu, Roblox askeri kamp RP analizleri, Ekocast yayınları ve topluluk belgeselleri.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  ${platformChromeStyles('dark')}
  <style>
    :root {
      --vb-bg: #07090e;
      --vb-surface: rgba(15, 20, 32, 0.72);
      --vb-surface-card: rgba(20, 26, 42, 0.65);
      --vb-border: rgba(255, 255, 255, 0.08);
      --vb-border-hover: rgba(168, 85, 247, 0.4);
      --vb-accent: #8b5cf6;
      --vb-accent-red: #ef4444;
      --vb-text: #f1f5f9;
      --vb-muted: #94a3b8;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at 50% 0%, #15192c 0%, #07090e 65%, #040508 100%);
      color: var(--vb-text);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .vb-container {
      width: min(1360px, calc(100% - 32px));
      margin: 0 auto;
      padding-bottom: 80px;
    }

    /* Hero Spotlight Section */
    .vb-hero {
      margin-top: 24px;
      padding: 32px 36px;
      background: linear-gradient(135deg, rgba(24, 28, 48, 0.85) 0%, rgba(13, 16, 28, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      box-shadow: 0 24px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
      backdrop-filter: blur(20px);
      display: grid;
      grid-template-columns: 1.25fr 0.95fr;
      gap: 36px;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .vb-hero::before {
      content: '';
      position: absolute;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
      top: -100px;
      right: -80px;
      border-radius: 50%;
      pointer-events: none;
    }
    .vb-hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .vb-hero-badge .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 10px #ef4444;
    }
    .vb-hero h1 {
      font-size: clamp(2rem, 3.8vw, 3.1rem);
      font-weight: 800;
      line-height: 1.12;
      color: #fff;
      letter-spacing: -0.03em;
      margin: 0 0 16px 0;
    }
    .vb-hero p {
      color: var(--vb-muted);
      font-size: 1rem;
      line-height: 1.65;
      margin: 0 0 24px 0;
      max-width: 620px;
    }
    .vb-channel-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .vb-channel-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 8px 16px;
    }
    .vb-channel-avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ef4444, #8b5cf6);
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 800;
      font-size: 1.1rem;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    .vb-channel-name strong {
      display: block;
      color: #fff;
      font-size: 0.92rem;
    }
    .vb-channel-name span {
      font-size: 0.76rem;
      color: var(--vb-muted);
    }
    .vb-hero-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .vb-btn-yt {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ef4444;
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 10px 18px;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
      transition: all 0.2s;
    }
    .vb-btn-yt:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.5);
      background: #dc2626;
    }

    /* Featured Cinema Card */
    .vb-featured-card {
      position: relative;
      border-radius: 18px;
      overflow: hidden;
      aspect-ratio: 16/9;
      background: #000;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
      border: 1px solid rgba(255, 255, 255, 0.12);
      cursor: pointer;
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .vb-featured-card:hover {
      transform: scale(1.02);
      border-color: rgba(168, 85, 247, 0.6);
    }
    .vb-featured-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.85;
      transition: opacity 0.25s;
    }
    .vb-featured-card:hover .vb-featured-thumb {
      opacity: 1;
    }
    .vb-featured-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 20px;
    }
    .vb-featured-play {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.92);
      color: #fff;
      display: grid;
      place-items: center;
      box-shadow: 0 8px 30px rgba(239, 68, 68, 0.6);
      transition: transform 0.2s, background 0.2s;
    }
    .vb-featured-card:hover .vb-featured-play {
      transform: translate(-50%, -50%) scale(1.1);
      background: #ff0033;
    }

    /* Filter & Search Bar */
    .vb-toolbar {
      margin: 36px 0 28px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .vb-search-box {
      position: relative;
      min-width: 280px;
      flex: 1;
      max-width: 440px;
    }
    .vb-search-box svg {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--vb-muted);
    }
    .vb-search-input {
      width: 100%;
      background: rgba(18, 24, 38, 0.7);
      border: 1px solid var(--vb-border);
      border-radius: 14px;
      padding: 12px 16px 12px 42px;
      color: #fff;
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
    }
    .vb-search-input:focus {
      border-color: var(--vb-accent);
      background: rgba(20, 26, 44, 0.9);
      box-shadow: 0 0 16px rgba(139, 92, 246, 0.2);
    }
    .vb-pills {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
    }
    .vb-pill-btn {
      appearance: none;
      border: 1px solid var(--vb-border);
      background: rgba(255, 255, 255, 0.04);
      color: var(--vb-muted);
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.18s;
      font-family: inherit;
    }
    .vb-pill-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.15);
    }
    .vb-pill-btn.active {
      background: #8b5cf6;
      border-color: #8b5cf6;
      color: #fff;
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
    }

    /* Video Cards Grid */
    .vb-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 26px 20px;
    }
    .vb-card {
      background: var(--vb-surface-card);
      border: 1px solid var(--vb-border);
      border-radius: 18px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.22s, border-color 0.22s, box-shadow 0.22s;
    }
    .vb-card:hover {
      transform: translateY(-4px);
      border-color: var(--vb-border-hover);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
    }
    .vb-thumb-wrap {
      position: relative;
      aspect-ratio: 16/9;
      background: #0d111c;
      overflow: hidden;
      cursor: pointer;
    }
    .vb-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
    .vb-card:hover .vb-thumb {
      transform: scale(1.05);
    }
    .vb-thumb-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      display: grid;
      place-items: center;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .vb-thumb-wrap:hover .vb-thumb-overlay {
      opacity: 1;
    }
    .vb-play-btn {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.95);
      color: #fff;
      display: grid;
      place-items: center;
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
      transform: scale(0.9);
      transition: transform 0.2s;
    }
    .vb-thumb-wrap:hover .vb-play-btn {
      transform: scale(1.05);
    }
    .vb-duration {
      position: absolute;
      right: 10px;
      bottom: 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      font-size: 0.74rem;
      font-weight: 700;
      padding: 3px 7px;
      border-radius: 6px;
      letter-spacing: 0.02em;
    }
    .vb-badge-cat {
      position: absolute;
      left: 10px;
      top: 10px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #c084fc;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 999px;
    }
    .vb-info {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
    }
    .vb-card-title {
      font-size: 0.98rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.4;
      margin: 0 0 8px 0;
      cursor: pointer;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 0.18s;
    }
    .vb-card-title:hover {
      color: #a78bfa;
    }
    .vb-card-desc {
      font-size: 0.82rem;
      color: var(--vb-muted);
      line-height: 1.5;
      margin: 0 0 14px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .vb-card-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      color: #64748b;
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 12px;
    }
    .vb-yt-ext {
      margin-left: auto;
      color: #94a3b8;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.15s;
    }
    .vb-yt-ext:hover {
      color: #ef4444;
    }

    /* Video Player Modal (Theater Mode) */
    .vb-modal-wrap {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .vb-modal-wrap[data-open="true"] {
      opacity: 1;
      pointer-events: auto;
    }
    .vb-modal-box {
      width: min(940px, 100%);
      background: #0d101a;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.85);
      display: flex;
      flex-direction: column;
    }
    .vb-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(18, 24, 38, 0.7);
    }
    .vb-modal-title {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 80%;
    }
    .vb-modal-close {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: grid;
      place-items: center;
      font-size: 1rem;
      transition: background 0.15s;
    }
    .vb-modal-close:hover {
      background: #ef4444;
      border-color: #ef4444;
    }
    .vb-player-container {
      width: 100%;
      aspect-ratio: 16/9;
      background: #000;
    }
    .vb-player-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .vb-modal-foot {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(18, 24, 38, 0.4);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Cross Link to Blog */
    .vb-crosslink-banner {
      margin-top: 48px;
      padding: 24px 30px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08));
      border: 1px solid rgba(139, 92, 246, 0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .vb-crosslink-info h4 {
      margin: 0 0 4px 0;
      color: #fff;
      font-size: 1.1rem;
    }
    .vb-crosslink-info p {
      margin: 0;
      color: var(--vb-muted);
      font-size: 0.88rem;
    }
    .vb-crosslink-btn {
      padding: 10px 20px;
      background: rgba(139, 92, 246, 0.25);
      border: 1px solid rgba(139, 92, 246, 0.5);
      color: #c084fc;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.88rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .vb-crosslink-btn:hover {
      background: #8b5cf6;
      color: #fff;
      transform: translateY(-2px);
    }

    /* Responsive */
    @media (max-width: 1080px) {
      .vb-grid { grid-template-columns: repeat(2, 1fr); }
      .vb-hero { grid-template-columns: 1fr; }
    }
    @media (max-width: 680px) {
      .vb-grid { grid-template-columns: 1fr; }
      .vb-hero { padding: 24px 20px; }
      .vb-toolbar { flex-direction: column; align-items: stretch; }
      .vb-search-box { max-width: 100%; }
    }
  </style>
</head>
<body class="platform-chrome">
  ${renderPlatformHeader({ user, activePath: '/video-blog' })}

  <main class="vb-container">
    
    <!-- Hero Spotlight Section -->
    <section class="vb-hero">
      <div>
        <div class="vb-hero-badge">
          <span class="pulse-dot"></span>
          <span>EKOYILDIZ MEDYA & YOUTUBE VİDEO BLOG</span>
        </div>
        <h1>İzle. Keşfet.<br>Toplulukla Buluş.</h1>
        <p>
          Roblox Türk toplulukları, askeri kamp RP dünyası, derin inceleme dosyaları ve Ekocast söyleşileri. Videoları ister yerleşik sinema modunda izleyin, isterseniz doğrudan YouTube üzerinden takip edin.
        </p>

        <div class="vb-channel-bar">
          <div class="vb-channel-pill">
            <div class="vb-channel-avatar">E★</div>
            <div class="vb-channel-name">
              <strong>eko yıldız</strong>
              <span>${CHANNEL_HANDLE} · 2,05 B Abone</span>
            </div>
          </div>
          <div class="vb-hero-actions">
            <a class="vb-btn-yt" href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer">
              <span>▶</span>
              <span>YouTube Kanalı ↗</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Featured Video Cinema Box -->
      <div class="vb-featured-card" onclick="openVideoModal('${featured.youtubeId}', '${esc(featured.title.replace(/'/g, ''))}', '${esc(featured.description.replace(/'/g, ''))}')">
        <img class="vb-featured-thumb" src="https://img.youtube.com/vi/${featured.youtubeId}/hqdefault.jpg" alt="${esc(featured.title)}">
        <div class="vb-featured-play">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="vb-featured-overlay">
          <span style="font-size:0.75rem; color:#f87171; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:4px;">🔥 ÖNE ÇIKAN YAYIN</span>
          <h3 style="margin:0 0 4px 0; color:#fff; font-size:1.05rem; font-weight:700; line-height:1.3;">${esc(featured.title)}</h3>
          <div style="font-size:0.78rem; color:#cbd5e1; display:flex; gap:8px;">
            <span>⏱️ ${esc(featured.duration)}</span>
            <span>•</span>
            <span>${esc(featured.views)}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Toolbar: Filter Pills & Search -->
    <div class="vb-toolbar">
      <div class="vb-pills">
        ${categories.map(cat => `
          <button class="vb-pill-btn ${cat === 'Tümü' ? 'active' : ''}" onclick="filterCategory('${esc(cat)}', this)">
            ${esc(cat)}
          </button>
        `).join('')}
      </div>

      <div class="vb-search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="vbSearchInput" class="vb-search-input" placeholder="Video veya konu ara... (Örn: Kamp, İhanet, TA...)" oninput="handleVideoSearch()">
      </div>
    </div>

    <!-- Video Grid -->
    <section class="vb-grid" id="vbVideoGrid">
      ${videoCardsHtml}
    </section>

    <!-- Cross Link to Blog -->
    <section class="vb-crosslink-banner">
      <div class="vb-crosslink-info">
        <h4>📚 Yazılı Analizler ve Güvenlik Rehberleri</h4>
        <p>EkoYıldız topluluk anayasası, Roblox hesap güvenliği ve platform güncellemelerini blog sayfamızdan okuyun.</p>
      </div>
      <a class="vb-crosslink-btn" href="/blog">EkoYıldız Blog Sayfasına Git →</a>
    </section>

  </main>

  <!-- Interactive Video Player Modal -->
  <div class="vb-modal-wrap" id="vbPlayerModal" data-open="false" onclick="handleBackdropClick(event)">
    <div class="vb-modal-box">
      <div class="vb-modal-head">
        <h3 class="vb-modal-title" id="vbModalTitle">Video Oynatıcı</h3>
        <button class="vb-modal-close" onclick="closeVideoModal()" aria-label="Kapat">✕</button>
      </div>
      <div class="vb-player-container" id="vbPlayerContainer">
        <!-- iframe injected dynamically -->
      </div>
      <div class="vb-modal-foot">
        <p id="vbModalDesc" style="margin:0; font-size:0.85rem; color:#94a3b8; max-width:70%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"></p>
        <a id="vbModalYtLink" class="vb-btn-yt" href="#" target="_blank" rel="noopener noreferrer" style="padding:6px 14px; font-size:0.82rem;">
          <span>YouTube'da Aç ↗</span>
        </a>
      </div>
    </div>
  </div>

  ${renderSearchDialog()}
  ${renderPlatformFooter()}
  ${platformChromeScript()}

  <script>
    var currentFilter = 'Tümü';

    function filterCategory(cat, btn) {
      currentFilter = cat;
      document.querySelectorAll('.vb-pill-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      if (btn) btn.classList.add('active');
      applyFilters();
    }

    function handleVideoSearch() {
      applyFilters();
    }

    function applyFilters() {
      var query = (document.getElementById('vbSearchInput').value || '').trim().toLowerCase();
      var cards = document.querySelectorAll('.vb-card');

      cards.forEach(function(card) {
        var cardCat = card.getAttribute('data-category') || '';
        var cardTitle = card.getAttribute('data-title') || '';
        var cardDesc = card.getAttribute('data-desc') || '';

        var matchesCat = (currentFilter === 'Tümü' || cardCat === currentFilter);
        var matchesQuery = (!query || cardTitle.includes(query) || cardDesc.includes(query));

        if (matchesCat && matchesQuery) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function openVideoModal(youtubeId, title, desc) {
      var modal = document.getElementById('vbPlayerModal');
      var container = document.getElementById('vbPlayerContainer');
      var titleEl = document.getElementById('vbModalTitle');
      var descEl = document.getElementById('vbModalDesc');
      var linkEl = document.getElementById('vbModalYtLink');

      titleEl.innerText = title || 'EkoYıldız Video';
      descEl.innerText = desc || '';
      linkEl.href = 'https://www.youtube.com/watch?v=' + youtubeId;

      container.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(youtubeId) + '?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';

      modal.setAttribute('data-open', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeVideoModal() {
      var modal = document.getElementById('vbPlayerModal');
      var container = document.getElementById('vbPlayerContainer');
      modal.setAttribute('data-open', 'false');
      container.innerHTML = '';
      document.body.style.overflow = '';
    }

    function handleBackdropClick(e) {
      if (e.target.id === 'vbPlayerModal') {
        closeVideoModal();
      }
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeVideoModal();
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { renderVideoBlogPage, videoEntries, CHANNEL_URL };
