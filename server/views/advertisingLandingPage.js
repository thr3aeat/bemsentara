'use strict';

const {
  BASE_DISCORD_ANNOUNCEMENT_PRICE,
  PRESET_PACKAGES,
  CUSTOM_MODULES,
  getDiscordAddonForPackage
} = require('../services/reklamPricingConfig');

const DISCORD_URL = 'https://discord.gg/rEu5gvRBdM';
const YOUTUBE_URL = 'https://www.youtube.com/@eko8yildiz';

function renderAdvertisingLandingPage(user = null) {
  const accountLink = user
    ? '<a class="quiet-link" href="/dashboard">Paneline dön</a>'
    : '<a class="quiet-link" href="/login">Giriş yap</a>';

  // Preset Paket Kartları
  const packageCardsHtml = PRESET_PACKAGES.map(pkg => {
    const isShorts = !pkg.allowsDiscordAddon;
    const addon = getDiscordAddonForPackage(pkg.id);

    const highlightsList = (pkg.highlights || []).map(h => `
      <li>
        <svg class="check-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M13.3 4.3L6 11.6 2.7 8.3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>${h}</span>
      </li>
    `).join('');

    // Discord Duyurusu Add-on Kartı (Shorts hariç!)
    let addonHtml = '';
    if (!isShorts && addon) {
      addonHtml = `
        <div class="addon-card" id="addon-box-${pkg.id}" onclick="toggleDiscordAddon('${pkg.id}', ${pkg.basePrice}, ${addon.addonPrice})">
          <div class="addon-checkbox" id="addon-check-${pkg.id}" role="checkbox" aria-checked="false" tabindex="0">
            <svg viewBox="0 0 16 16" fill="none" class="check-svg" aria-hidden="true">
              <path d="M13.3 4.3L6 11.6 2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="addon-details">
            <div class="addon-top">
              <div class="addon-title-group">
                <svg class="discord-mini-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <strong class="addon-title">Discord Duyurusu</strong>
              </div>
              <div class="addon-pricing">
                <span class="addon-cost">+ ₺${addon.addonPrice}</span>
              </div>
            </div>
            <p class="addon-desc">${addon.description}</p>
            <div class="addon-advantage-tag">
              <span class="advantage-badge">${addon.tag}</span>
              <span class="advantage-text">${addon.advantageNote}</span>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <article class="pricing-card${pkg.recommended ? ' is-recommended' : ''}" id="card-${pkg.id}" data-pkg-id="${pkg.id}">
        <div class="card-inner">
          <div class="card-header">
            <div class="badge-row">
              <span class="pkg-category-badge">${pkg.badge}</span>
              ${pkg.recommended ? '<span class="status-pill">Öne Çıkan</span>' : ''}
            </div>
            <h3 class="pkg-name">${pkg.title}</h3>
            <p class="pkg-desc">${pkg.description}</p>
          </div>

          <div class="card-pricing-block">
            <div class="price-figure-wrap">
              <span class="amount" id="price-amount-${pkg.id}">${pkg.basePrice} TL</span>
              <span class="period">/ başlangıç</span>
            </div>
            <div class="price-caption" id="price-caption-${pkg.id}">Net başlangıç fiyatı</div>
          </div>

          <div class="card-features">
            <div class="features-label">Paket Kapsamı</div>
            <ul class="features-list">
              ${highlightsList}
            </ul>
          </div>

          ${addonHtml}

          <div class="card-cta">
            <a class="btn-select-package" id="btn-cta-${pkg.id}" href="/tickets/new?category=reklam&package=${pkg.id}">
              <span id="cta-label-${pkg.id}">Bu Paketi Konuşalım</span>
              <svg viewBox="0 0 16 16" fill="none" class="cta-arrow" aria-hidden="true">
                <path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <button type="button" class="btn-direct-pay" onclick="openPaymentModal('${pkg.id}', '${pkg.title.replace(/'/g, "\\'")}', ${pkg.basePrice})">
              <span>💳 Ödeme Seçenekleri (Papara / İtemSatış)</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // SSS Bölümü
  const faqList = [
    ['Reklam doğrudan yayınlanıyor mu?', 'Hayır. Metin, görsel ve yerleşim önce sizinle netleştirilir; onayınızdan sonra yayın planına alınır.'],
    ['Fiyat neden izlenme başına hesaplanmıyor?', 'EkoYıldız paketleri yalnızca ham gösterimi değil; kurgu, yerleşim, topluluk dağıtımı, revize ve raporlama sürecini birlikte fiyatlandırır.'],
    ['Satış veya üye artışı garanti mi?', 'Her kampanyanın sonucu; teklifinize, kreatife ve kitle uyumuna göre değişir. Doğru formatı, doğal anlatımı ve ölçülebilir teslimi birlikte planlarız.'],
    ['Ödemeyi nasıl yapacağım?', 'Resmî siparişler yalnızca İtemSatış üzerinden yürütülür. Kişisel hesaba veya DM üzerinden ödeme istenmez.'],
    ['Discord duyurusu nasıl yayınlanır?', 'Satın aldığınız pakete eklenen Discord duyurusu, onaylanan takvimde EkoYıldız topluluk sunucusunda özel metin ve linkinizle birlikte paylaşılır.'],
    ['Kendi paketimi nasıl özelleştirebilirim?', 'Aşağıdaki "Kendi Paketini Oluştur" aracından dilediğiniz video süresi, açıklama linki, sabit yorum ve topluluk anketini seçerek şeffaf paket avantajıyla anında talep oluşturabilirsiniz.']
  ];

  const faqHtml = faqList.map(([question, answer]) => `
    <details class="faq-item">
      <summary class="faq-question">
        <span>${question}</span>
        <span class="faq-icon" aria-hidden="true">+</span>
      </summary>
      <p class="faq-answer">${answer}</p>
    </details>
  `).join('');

  // Teşekkürler Bölümü Verisi (Data-driven Credits - Components V2)
  const CREDITS_DATA = [
    {
      id: 'yusuf',
      name: 'Yusuf',
      role: 'Topluluk & Proje Katkısı',
      badge: 'Özel Destekçi',
      description: 'Projenin kuruluşundan bugüne kadar sağladığı vizyon, yapıcı geri bildirimler ve topluluk koordinasyonundaki emekleri için içtenlikle teşekkür ederiz.',
      avatarText: 'Y',
      avatarGradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      highlights: ['Vizyon & Strateji', 'Topluluk Koordinasyonu', 'Kesintisiz Destek']
    },
    {
      id: 'yk_ordusu',
      name: 'YK Ordusu',
      role: 'Topluluk & Dayanışma Gücü',
      badge: 'Onur Topluluğu',
      description: 'Her yayında, etkinlikte ve platformun büyüme adımlarında gösterdikleri sarsılmaz birliktelik, yüksek enerji ve samimi topluluk ruhu için minnettarız.',
      avatarText: 'YK',
      avatarGradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
      highlights: ['Sadık Dayanışma', 'Pozitif Topluluk Ruhu', 'Birlik ve Beraberlik']
    }
  ];

  const creditsCardsHtml = CREDITS_DATA.map(c => `
    <div class="credit-card" id="credit-${c.id}">
      <div class="credit-card-head">
        <div class="credit-avatar" style="background:${c.avatarGradient};">
          <span>${c.avatarText}</span>
        </div>
        <div class="credit-info">
          <div class="credit-name-row">
            <h3 class="credit-name">${c.name}</h3>
            <span class="credit-badge">${c.badge}</span>
          </div>
          <span class="credit-role">${c.role}</span>
        </div>
      </div>
      <p class="credit-desc">${c.description}</p>
      <div class="credit-perks">
        ${c.highlights.map(h => `<span class="credit-pill">${h}</span>`).join('')}
      </div>
    </div>
  `).join('');

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#090a0f">
  <meta name="robots" content="noindex,nofollow">
  <meta name="description" content="EkoYıldız YouTube ve Discord topluluğu için reklam ve sponsorluk seçeneklerini keşfedin.">
  <title>EkoYıldız Partner Studio — Reklam ve Sponsorluk</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090a0f;
      --bg-surface: #0f1118;
      --bg-surface-elevated: #151822;
      --bg-subtle: #1a1e2b;
      --border-subtle: rgba(255, 255, 255, 0.07);
      --border-medium: rgba(255, 255, 255, 0.12);
      --border-active: rgba(255, 255, 255, 0.28);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-tertiary: #64748b;
      --accent-discord: #5865f2;
      --accent-green: #10b981;
      --accent-green-subtle: rgba(16, 185, 129, 0.12);
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-xl: 28px;
      --transition: 180ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background: var(--bg);
      color: var(--text-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    a { color: inherit; text-decoration: none; }
    .shell { width: min(1200px, calc(100% - 48px)); margin: 0 auto; }

    /* Topbar */
    .topbar {
      position: sticky;
      top: 16px;
      z-index: 60;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 18px;
      border: 1px solid var(--border-medium);
      border-radius: 999px;
      background: rgba(15, 17, 24, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      margin-top: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: -0.02em;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #ffffff;
      color: #090a0f;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 0.8rem;
    }
    .brand-sub {
      color: var(--text-tertiary);
      font-weight: 500;
      font-size: 0.8rem;
      border-left: 1px solid var(--border-medium);
      padding-left: 12px;
    }
    .top-actions { display: flex; align-items: center; gap: 14px; }
    .quiet-link {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
      transition: color var(--transition);
    }
    .quiet-link:hover { color: var(--text-primary); }
    .btn-top-cta {
      background: #ffffff;
      color: #090a0f;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      transition: transform var(--transition), opacity var(--transition);
    }
    .btn-top-cta:hover { transform: translateY(-1px); opacity: 0.94; }

    /* Hero */
    .hero {
      padding: 96px 0 64px;
      display: grid;
      grid-template-columns: 1.25fr 0.85fr;
      gap: 56px;
      align-items: center;
    }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-secondary);
      margin-bottom: 20px;
    }
    .dot-status {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-green);
      box-shadow: 0 0 10px var(--accent-green);
    }
    h1.hero-title {
      font-size: clamp(2.4rem, 5.2vw, 4.4rem);
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.04em;
      margin-bottom: 20px;
    }
    h1.hero-title span {
      color: var(--text-secondary);
      font-weight: 400;
    }
    .hero-lead {
      color: var(--text-secondary);
      font-size: clamp(1rem, 1.3vw, 1.15rem);
      line-height: 1.65;
      max-width: 580px;
      margin-bottom: 32px;
    }
    .hero-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .btn-primary {
      background: #ffffff;
      color: #090a0f;
      padding: 13px 24px;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.95rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: transform var(--transition), opacity var(--transition);
    }
    .btn-primary:hover { transform: translateY(-1px); opacity: 0.95; }
    .btn-secondary {
      background: var(--bg-surface);
      border: 1px solid var(--border-medium);
      color: var(--text-primary);
      padding: 13px 22px;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.95rem;
      transition: background var(--transition), border-color var(--transition);
    }
    .btn-secondary:hover { background: var(--bg-subtle); border-color: var(--border-active); }
    .hero-honesty {
      margin-top: 24px;
      font-size: 0.8rem;
      color: var(--text-tertiary);
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .hero-honesty strong { color: var(--accent-green); }

    /* Summary Card in Hero */
    .hero-summary-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-xl);
      padding: 28px;
    }
    .card-meta-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .meta-title { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); }
    .status-badge {
      font-size: 0.75rem;
      color: var(--accent-green);
      background: var(--accent-green-subtle);
      padding: 4px 10px;
      border-radius: 999px;
      font-weight: 600;
    }
    .summary-spec-list { display: grid; gap: 14px; }
    .spec-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 0.88rem;
    }
    .spec-label { color: var(--text-secondary); }
    .spec-value { font-weight: 600; color: var(--text-primary); }
    .summary-footnote {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.8rem;
      color: var(--text-tertiary);
      line-height: 1.5;
    }

    /* Trust Stats Strip */
    .trust-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      margin: 40px auto 90px;
    }
    .trust-cell {
      padding: 24px 20px;
      border-right: 1px solid var(--border-subtle);
    }
    .trust-cell:last-child { border-right: none; }
    .trust-cell strong { display: block; font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
    .trust-cell span { font-size: 0.82rem; color: var(--text-secondary); }

    /* Section Styling */
    .section-wrap { padding: 80px 0; }
    .section-head { margin-bottom: 48px; }
    .section-kicker {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
      margin-bottom: 10px;
      display: block;
    }
    .section-title {
      font-size: clamp(1.9rem, 3.4vw, 2.9rem);
      font-weight: 800;
      letter-spacing: -0.035em;
      line-height: 1.15;
      margin-bottom: 14px;
    }
    .section-desc {
      color: var(--text-secondary);
      font-size: 1.05rem;
      max-width: 640px;
      line-height: 1.6;
    }

    /* Preset Packages Grid */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 22px;
      align-items: start;
    }
    .pricing-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      transition: border-color var(--transition), transform var(--transition);
      position: relative;
    }
    .pricing-card:hover {
      border-color: var(--border-medium);
      transform: translateY(-2px);
    }
    .pricing-card.is-recommended {
      border-color: rgba(255, 255, 255, 0.22);
      background: var(--bg-surface-elevated);
    }
    .card-inner { padding: 26px; }
    .badge-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .pkg-category-badge {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      background: var(--bg-subtle);
      padding: 4px 9px;
      border-radius: 999px;
      border: 1px solid var(--border-subtle);
    }
    .status-pill {
      font-size: 0.72rem;
      font-weight: 600;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.12);
      padding: 3px 9px;
      border-radius: 999px;
    }
    .pkg-name { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
    .pkg-desc { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; min-height: 42px; margin-bottom: 22px; }

    .card-pricing-block {
      padding: 16px 0 20px;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 22px;
    }
    .price-figure-wrap { display: flex; align-items: baseline; gap: 4px; }
    .currency { font-size: 1.25rem; font-weight: 600; color: var(--text-secondary); }
    .amount { font-size: 2.3rem; font-weight: 800; letter-spacing: -0.04em; color: var(--text-primary); transition: color var(--transition); }
    .period { font-size: 0.85rem; color: var(--text-tertiary); margin-left: 4px; }
    .price-caption { font-size: 0.78rem; color: var(--text-tertiary); margin-top: 4px; }

    .card-features { margin-bottom: 24px; }
    .features-label { font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); margin-bottom: 12px; }
    .features-list { list-style: none; display: grid; gap: 10px; }
    .features-list li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }
    .check-icon { width: 15px; height: 15px; color: var(--text-primary); flex-shrink: 0; margin-top: 3px; }

    /* Discord Add-on Card */
    .addon-card {
      margin-top: 18px;
      padding: 14px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      transition: border-color var(--transition), background var(--transition);
      user-select: none;
    }
    .addon-card:hover { border-color: var(--border-medium); }
    .addon-card.is-active {
      background: rgba(88, 101, 242, 0.08);
      border-color: rgba(88, 101, 242, 0.45);
    }
    .addon-checkbox {
      width: 18px;
      height: 18px;
      border: 1px solid var(--border-medium);
      border-radius: 5px;
      background: var(--bg-surface);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      margin-top: 2px;
      transition: background var(--transition), border-color var(--transition);
    }
    .addon-card.is-active .addon-checkbox {
      background: var(--accent-discord);
      border-color: var(--accent-discord);
    }
    .check-svg { width: 12px; height: 12px; color: #ffffff; opacity: 0; transform: scale(0.6); transition: opacity var(--transition), transform var(--transition); }
    .addon-card.is-active .check-svg { opacity: 1; transform: scale(1); }

    .addon-details { flex: 1; min-width: 0; }
    .addon-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .addon-title-group { display: flex; align-items: center; gap: 6px; }
    .discord-mini-icon { width: 14px; height: 14px; color: var(--accent-discord); flex-shrink: 0; }
    .addon-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
    .addon-cost { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
    .addon-desc { font-size: 0.77rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 8px; }
    .addon-advantage-tag { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .advantage-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--accent-green);
      background: var(--accent-green-subtle);
      padding: 2px 7px;
      border-radius: 4px;
    }
    .advantage-text { font-size: 0.72rem; color: var(--text-tertiary); }

    .card-cta { margin-top: 22px; }
    .btn-select-package {
      width: 100%;
      background: var(--bg-subtle);
      border: 1px solid var(--border-medium);
      color: var(--text-primary);
      padding: 11px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.88rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background var(--transition), border-color var(--transition), color var(--transition);
    }
    .btn-select-package:hover {
      background: #ffffff;
      color: #090a0f;
      border-color: #ffffff;
    }
    .cta-arrow { width: 14px; height: 14px; transition: transform var(--transition); }
    .btn-select-package:hover .cta-arrow { transform: translateX(3px); }

    /* Custom Package Builder Section */
    .custom-builder-section {
      margin-top: 60px;
      padding: 60px 0;
      border-top: 1px solid var(--border-subtle);
    }
    .builder-header { margin-bottom: 36px; }
    .builder-badge-group { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .beta-badge {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid var(--border-medium);
      color: var(--text-primary);
      background: var(--bg-surface);
    }
    .beta-badge.primary { background: #ffffff; color: #090a0f; border-color: #ffffff; }

    .builder-layout {
      display: grid;
      grid-template-columns: 1.35fr 0.85fr;
      gap: 40px;
      align-items: start;
    }
    .builder-options { display: grid; gap: 32px; }
    .option-group-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .option-group-title span.step-num {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--bg-subtle);
      border: 1px solid var(--border-medium);
      display: grid;
      place-items: center;
      font-size: 0.72rem;
      color: var(--text-secondary);
    }
    .cards-row-select { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .custom-choice-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      cursor: pointer;
      transition: border-color var(--transition), background var(--transition);
      position: relative;
    }
    .custom-choice-card:hover { border-color: var(--border-medium); }
    .custom-choice-card.is-selected {
      border-color: var(--border-active);
      background: var(--bg-surface-elevated);
    }
    .choice-card-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
    .choice-card-title { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
    .choice-card-price { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
    .choice-card-sub { font-size: 0.76rem; color: var(--text-tertiary); line-height: 1.4; }

    .cards-grid-addons { display: grid; grid-template-columns: 1fr; gap: 10px; }
    .custom-addon-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      cursor: pointer;
      transition: border-color var(--transition), background var(--transition);
    }
    .custom-addon-item:hover { border-color: var(--border-medium); }
    .custom-addon-item.is-selected {
      border-color: rgba(255, 255, 255, 0.25);
      background: var(--bg-surface-elevated);
    }
    .addon-item-left { display: flex; align-items: center; gap: 12px; }
    .addon-item-box {
      width: 18px;
      height: 18px;
      border: 1px solid var(--border-medium);
      border-radius: 5px;
      background: var(--bg-subtle);
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: background var(--transition), border-color var(--transition);
    }
    .custom-addon-item.is-selected .addon-item-box {
      background: #ffffff;
      border-color: #ffffff;
    }
    .custom-addon-item.is-selected .addon-item-box .check-svg {
      color: #090a0f;
      opacity: 1;
      transform: scale(1);
    }
    .addon-item-info strong { display: block; font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
    .addon-item-info span { font-size: 0.77rem; color: var(--text-tertiary); }
    .addon-item-price { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; }

    /* Builder Sticky Sidebar / Summary */
    .builder-summary-sticky {
      position: sticky;
      top: 96px;
      background: var(--bg-surface);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-xl);
      padding: 28px;
    }
    .summary-card-head {
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 20px;
    }
    .summary-card-head h4 { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; }
    .summary-items-list {
      list-style: none;
      display: grid;
      gap: 12px;
      min-height: 110px;
      margin-bottom: 20px;
    }
    .summary-items-list li {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 0.85rem;
      color: var(--text-secondary);
      animation: fadeIn 180ms ease;
    }
    .summary-items-list li strong { color: var(--text-primary); font-weight: 600; }
    .empty-summary-hint {
      color: var(--text-tertiary);
      font-size: 0.85rem;
      font-style: italic;
      padding: 24px 0;
      text-align: center;
    }

    .summary-calculation-box {
      padding-top: 16px;
      border-top: 1px solid var(--border-subtle);
      margin-bottom: 24px;
      display: grid;
      gap: 10px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .calc-row.discount-row { color: var(--accent-green); font-weight: 600; }
    .calc-row.total-row {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
      padding-top: 10px;
      border-top: 1px dashed var(--border-subtle);
    }

    .btn-build-package {
      width: 100%;
      background: #ffffff;
      color: #090a0f;
      padding: 13px 20px;
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: none;
      cursor: pointer;
      transition: opacity var(--transition), transform var(--transition);
    }
    .btn-build-package:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none !important;
    }
    .btn-build-package:not(:disabled):hover {
      opacity: 0.93;
      transform: translateY(-1px);
    }

    /* Mobile Sticky Bar */
    .mobile-sticky-bar {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 55;
      background: rgba(15, 17, 24, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--border-medium);
      padding: 12px 18px;
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
    }
    .mobile-sticky-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 600px;
      margin: 0 auto;
      gap: 16px;
    }
    .mobile-total-info small { display: block; font-size: 0.72rem; color: var(--text-tertiary); text-transform: uppercase; }
    .mobile-total-info strong { font-size: 1.25rem; font-weight: 800; color: #ffffff; }

    /* Case Studies & Social Proof */
    .case-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .case-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      flex-direction: column;
    }
    .case-badge {
      display: inline-block;
      align-self: flex-start;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-secondary);
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 14px;
    }
    .case-badge.warning { color: #f59e0b; }
    .case-badge.success { color: var(--accent-green); }
    .case-partner { font-size: 1.2rem; font-weight: 800; color: #ffffff; margin-bottom: 14px; }
    .case-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: var(--bg-subtle);
      padding: 12px;
      border-radius: var(--radius-sm);
      margin-bottom: 14px;
    }
    .metric-val { font-size: 1.1rem; font-weight: 800; color: #ffffff; }
    .metric-lbl { font-size: 0.72rem; color: var(--text-tertiary); text-transform: uppercase; }
    .case-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; }
    .transparency-note { font-style: normal; color: var(--text-tertiary); font-size: 0.78rem; display: block; margin-top: 4px; }
    .case-link {
      margin-top: auto;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 13px;
      border-radius: var(--radius-sm);
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
      transition: border-color var(--transition);
    }
    .case-link:hover { border-color: var(--border-medium); }

    /* Why Price Section */
    .why-price-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 48px; align-items: center; }
    .cost-stack { display: grid; gap: 10px; }
    .cost-row {
      display: grid;
      grid-template-columns: 36px 1fr auto;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
    }
    .cost-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--bg-subtle); display: grid; place-items: center; font-size: 0.9rem; }
    .cost-row strong { display: block; font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
    .cost-row small { display: block; font-size: 0.78rem; color: var(--text-tertiary); }
    .cost-tag { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }

    /* Process 4 Steps */
    .process-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .step-card {
      padding: 28px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
    }
    .step-card:last-child { border-right: none; }
    .step-card b { font-size: 0.72rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 24px; }
    .step-card h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 8px; }
    .step-card p { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; }

    /* FAQ */
    .faq-layout { display: grid; grid-template-columns: 0.75fr 1.25fr; gap: 56px; }
    .faq-list { display: grid; }
    .faq-item {
      border-top: 1px solid var(--border-subtle);
    }
    .faq-item:last-child { border-bottom: 1px solid var(--border-subtle); }
    .faq-question {
      padding: 20px 0;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 0.98rem;
      list-style: none;
    }
    .faq-question::-webkit-details-marker { display: none; }
    .faq-icon { font-size: 1.2rem; color: var(--text-tertiary); transition: transform var(--transition); }
    details[open] .faq-icon { transform: rotate(45deg); }
    .faq-answer { padding-bottom: 20px; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; }

    /* Final CTA */
    .final-cta {
      margin: 80px 0 40px;
      padding: 72px 36px;
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-xl);
      background: var(--bg-surface);
      text-align: center;
    }
    .final-cta h2 { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 800; letter-spacing: -0.04em; margin-bottom: 14px; }
    .final-cta p { color: var(--text-secondary); max-width: 540px; margin: 0 auto 28px; }

    /* Footer */
    .footer {
      padding: 40px 0 60px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.8rem;
      color: var(--text-tertiary);
    }
    .footer a:hover { color: var(--text-primary); }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsiveness */
    @media (max-width: 1024px) {
      .pricing-grid { grid-template-columns: repeat(2, 1fr); }
      .hero { grid-template-columns: 1fr; padding-top: 60px; }
      .hero-summary-card { max-width: 520px; }
      .builder-layout { grid-template-columns: 1fr; }
      .builder-summary-sticky { position: static; margin-top: 24px; }
      .why-price-grid { grid-template-columns: 1fr; }
      .faq-layout { grid-template-columns: 1fr; }
      .process-grid { grid-template-columns: repeat(2, 1fr); }
      .step-card:nth-child(2) { border-right: none; }
      .step-card:nth-child(-n+2) { border-bottom: 1px solid var(--border-subtle); }
      .trust-strip { grid-template-columns: repeat(2, 1fr); }
      .trust-cell:nth-child(2) { border-right: none; }
      .trust-cell:nth-child(-n+2) { border-bottom: 1px solid var(--border-subtle); }
      .case-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .shell { width: calc(100% - 32px); }
      .pricing-grid { grid-template-columns: 1fr; }
      .cards-row-select { grid-template-columns: 1fr; }
      .trust-strip { grid-template-columns: 1fr; }
      .trust-cell { border-right: none; border-bottom: 1px solid var(--border-subtle); }
      .trust-cell:last-child { border-bottom: none; }
      .process-grid { grid-template-columns: 1fr; }
      .step-card { border-right: none; border-bottom: 1px solid var(--border-subtle); }
      .step-card:last-child { border-bottom: none; }
      .case-grid { grid-template-columns: 1fr; }
      .topbar { padding: 8px 14px; }
      .brand-sub { display: none; }
      .hero-actions { flex-direction: column; width: 100%; }
      .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
    /* ── EKOai Reklam Danışmanı Stilleri ── */
    .ekoai-section {
      margin: 80px auto;
      position: relative;
    }
    .ekoai-card {
      position: relative;
      background: radial-gradient(120% 120% at 50% 0%, rgba(99, 102, 241, 0.12) 0%, rgba(15, 17, 24, 0.85) 60%), #0f1118;
      border: 1px solid rgba(129, 140, 248, 0.28);
      border-radius: var(--radius-xl);
      padding: 44px;
      box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15);
      overflow: hidden;
    }
    .ekoai-card-glow {
      position: absolute;
      top: -100px;
      right: -100px;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
      filter: blur(50px);
      pointer-events: none;
    }
    .ekoai-header {
      max-width: 640px;
      margin-bottom: 28px;
    }
    .ekoai-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(99, 102, 241, 0.14);
      border: 1px solid rgba(129, 140, 248, 0.32);
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 0.76rem;
      font-weight: 700;
      color: #a5b4fc;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .ekoai-chips-wrap {
      margin-bottom: 24px;
    }
    .chips-label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-tertiary);
      margin-bottom: 10px;
      font-weight: 500;
    }
    .ekoai-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ekoai-chip {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-medium);
      color: var(--text-secondary);
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all var(--transition);
      text-align: left;
    }
    .ekoai-chip:hover {
      background: rgba(99, 102, 241, 0.16);
      border-color: rgba(129, 140, 248, 0.4);
      color: var(--text-primary);
      transform: translateY(-1px);
    }
    .ekoai-console {
      background: rgba(9, 10, 15, 0.7);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ekoai-messages-box {
      max-height: 380px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-right: 6px;
    }
    .ekoai-messages-box::-webkit-scrollbar {
      width: 5px;
    }
    .ekoai-messages-box::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
    }
    .ekoai-msg {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      animation: fadeIn 0.25s ease-out;
    }
    .ekoai-msg.user {
      flex-direction: row-reverse;
    }
    .ekoai-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: grid;
      place-items: center;
      font-size: 0.95rem;
      flex-shrink: 0;
    }
    .ekoai-msg.user .ekoai-avatar {
      background: #272a38;
      font-size: 0.85rem;
    }
    .ekoai-bubble {
      max-width: 82%;
      padding: 12px 18px;
      border-radius: 14px;
      font-size: 0.9rem;
      line-height: 1.55;
    }
    .ekoai-msg.ai .ekoai-bubble {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
    }
    .ekoai-msg.ai .ekoai-bubble strong {
      color: #fff;
    }
    .ekoai-msg.ai .ekoai-bubble ul {
      margin: 8px 0 8px 18px;
    }
    .ekoai-msg.ai .ekoai-bubble li {
      margin-bottom: 4px;
    }
    .ekoai-msg.user .ekoai-bubble {
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }
    .ekoai-input-form {
      display: flex;
      gap: 10px;
      border-top: 1px solid var(--border-subtle);
      padding-top: 16px;
    }
    .ekoai-text-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
      transition: border-color var(--transition);
    }
    .ekoai-text-input:focus {
      border-color: #6366f1;
      background: rgba(255, 255, 255, 0.06);
    }
    .ekoai-submit-btn {
      background: #ffffff;
      color: #090a0f;
      border: none;
      border-radius: var(--radius-md);
      padding: 0 20px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: transform var(--transition), opacity var(--transition);
    }
    .ekoai-submit-btn:hover {
      transform: translateY(-1px);
      opacity: 0.94;
    }
    .send-icon {
      width: 14px;
      height: 14px;
    }

    /* Floating Widget */
    .ekoai-floating-widget {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .ekoai-floating-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 999px;
      padding: 12px 20px;
      box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.35);
      cursor: pointer;
      font-weight: 700;
      font-size: 0.88rem;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
    }
    .ekoai-floating-trigger:hover {
      transform: scale(1.05) translateY(-2px);
      box-shadow: 0 16px 36px rgba(99, 102, 241, 0.55);
    }
    .ekoai-trigger-icon {
      font-size: 1.15rem;
    }
    .ekoai-chat-window {
      width: 360px;
      height: 480px;
      background: #0f1118;
      border: 1px solid rgba(129, 140, 248, 0.35);
      border-radius: var(--radius-xl);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.15);
      display: flex;
      flex-direction: column;
      margin-bottom: 14px;
      overflow: hidden;
      animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .ekoai-chat-header {
      padding: 14px 18px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ekoai-agent-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ekoai-online-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .ekoai-agent-info strong {
      display: block;
      font-size: 0.88rem;
      line-height: 1.2;
    }
    .ekoai-agent-info small {
      display: block;
      color: var(--text-tertiary);
      font-size: 0.72rem;
    }
    .ekoai-close-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1rem;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
    }
    .ekoai-close-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.06);
    }
    .ekoai-chat-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ekoai-chat-footer {
      padding: 12px;
      background: rgba(255, 255, 255, 0.02);
      border-top: 1px solid var(--border-subtle);
      display: flex;
      gap: 8px;
    }
    .ekoai-chat-footer input {
      flex: 1;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      color: #fff;
      font-size: 0.85rem;
      outline: none;
    }
    .ekoai-chat-footer input:focus {
      border-color: #6366f1;
    }
    .ekoai-chat-footer button {
      background: #6366f1;
      color: #fff;
      border: none;
      border-radius: var(--radius-md);
      width: 38px;
      height: 38px;
      font-size: 1rem;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: opacity var(--transition);
    }
    .ekoai-chat-footer button:hover {
      opacity: 0.9;
    }
    .ekoai-typing-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      font-size: 0.8rem;
      color: var(--text-tertiary);
    }
    .typing-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #a5b4fc;
      animation: typing 1.4s infinite;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    /* Atatürk Sayfası Topbar Link */
    .special-ataturk-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #fca5a5 !important;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.22);
      transition: all var(--transition);
      font-size: 0.84rem;
    }
    .special-ataturk-link:hover {
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(239, 68, 68, 0.45);
      transform: translateY(-1px);
      color: #fff !important;
    }

    /* Paket Kartlarında Doğrudan Ödeme Seçenek Butonu */
    .btn-direct-pay {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-top: 8px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
    }
    .btn-direct-pay:hover {
      background: rgba(255, 255, 255, 0.09);
      border-color: var(--border-active);
      color: #fff;
      transform: translateY(-1px);
    }

    /* Teşekkürler Bölümü (Components V2) */
    .credits-section {
      padding: 72px 0;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
    }
    .credits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 24px;
    }
    .credit-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 28px;
      transition: border-color var(--transition), transform var(--transition);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .credit-card:hover {
      border-color: var(--border-active);
      transform: translateY(-2px);
    }
    .credit-card-head {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .credit-avatar {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      flex-shrink: 0;
    }
    .credit-info {
      flex: 1;
      min-width: 0;
    }
    .credit-name-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .credit-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .credit-badge {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #c4b5fd;
    }
    .credit-role {
      display: block;
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 2px;
    }
    .credit-desc {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .credit-perks {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: auto;
    }
    .credit-pill {
      font-size: 0.76rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      color: var(--text-tertiary);
    }

    /* Checkout & Payment Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .payment-modal-card {
      width: min(580px, 100%);
      max-height: 90vh;
      overflow-y: auto;
      background: #0f1118;
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-xl);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05);
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalSlideUp {
      from { transform: translateY(20px) scale(0.97); }
      to { transform: translateY(0) scale(1); }
    }
    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .modal-kicker {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #a5b4fc;
      margin-bottom: 4px;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }
    .modal-close-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      color: var(--text-secondary);
      font-size: 0.9rem;
      cursor: pointer;
      transition: all var(--transition);
      flex-shrink: 0;
    }
    .modal-close-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    .modal-pkg-summary {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px 18px;
    }
    .modal-pkg-summary .summary-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 1.05rem;
    }
    .modal-pkg-summary .summary-price {
      color: #a5b4fc;
    }
    .modal-pkg-summary .summary-subnote {
      font-size: 0.8rem;
      color: var(--text-tertiary);
      margin-top: 4px;
    }
    .payment-cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 520px) {
      .payment-cards-grid { grid-template-columns: 1fr; }
    }
    .pay-method-card {
      background: var(--bg-surface-elevated);
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      cursor: pointer;
      transition: all var(--transition);
      display: flex;
      flex-direction: column;
      gap: 10px;
      user-select: none;
      outline: none;
    }
    .pay-method-card:hover {
      border-color: var(--border-active);
      background: rgba(255, 255, 255, 0.03);
    }
    .pay-method-card:focus-visible {
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4);
    }
    .pay-method-card.is-selected {
      border-color: #6366f1;
      background: rgba(99, 102, 241, 0.08);
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.18);
    }
    .pay-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .pay-card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pay-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      font-size: 0.75rem;
      font-weight: 800;
      color: #fff;
    }
    .papara-icon { background: #9333ea; }
    .itemsatis-icon { background: #2563eb; }
    .fee-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .fee-badge.zero-fee {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
    }
    .fee-badge.fee-added {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
    }
    .pay-card-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.45;
      margin: 0;
    }
    .pay-perks {
      list-style: none;
      font-size: 0.76rem;
      color: var(--text-tertiary);
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0;
      margin: 0;
    }
    .pay-details-block {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .papara-account-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: rgba(147, 51, 234, 0.08);
      border: 1px solid rgba(147, 51, 234, 0.25);
      border-radius: 10px;
      padding: 12px 16px;
    }
    .account-meta { display: flex; flex-direction: column; gap: 2px; }
    .account-meta .acc-label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; }
    .account-meta .acc-number { font-size: 1.25rem; font-weight: 800; letter-spacing: 0.08em; color: #fff; font-family: monospace; }
    .btn-copy-acc {
      background: #9333ea;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition);
    }
    .btn-copy-acc:hover { background: #a855f7; transform: translateY(-1px); }
    .copy-svg { width: 14px; height: 14px; }
    .copy-toast {
      font-size: 0.8rem;
      color: #34d399;
      font-weight: 600;
      padding: 4px 8px;
      text-align: center;
    }
    .upload-proof-box { display: flex; flex-direction: column; gap: 6px; }
    .proof-label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
    .proof-input {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-medium);
      border-radius: 8px;
      padding: 8px 12px;
      color: #fff;
      font-size: 0.85rem;
      outline: none;
    }
    .proof-input:focus { border-color: #9333ea; }
    .proof-hint { font-size: 0.74rem; color: var(--text-tertiary); }
    .itemsatis-trust-callout {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px;
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.25);
      border-radius: 10px;
      font-size: 0.84rem;
      line-height: 1.5;
      color: #bfdbfe;
    }
    .shield-svg { width: 22px; height: 22px; color: #60a5fa; flex-shrink: 0; margin-top: 1px; }
    .price-breakdown-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .price-breakdown-card .bd-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
    }
    .price-breakdown-card .bd-divider {
      height: 1px;
      background: var(--border-subtle);
      margin: 4px 0;
    }
    .price-breakdown-card .total-row {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
    }
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 8px;
    }
    .btn-cancel {
      background: none;
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all var(--transition);
    }
    .btn-cancel:hover { background: rgba(255, 255, 255, 0.04); color: #fff; }
    .btn-checkout-confirm {
      background: #6366f1;
      color: #fff;
      border: none;
      padding: 10px 22px;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all var(--transition);
    }
    .btn-checkout-confirm:hover:not(:disabled) {
      background: #4f46e5;
      transform: translateY(-1px);
    }
    .btn-checkout-confirm:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Redesigned Chat UI (Intercom Style) */
    .chat-date-separator {
      text-align: center;
      position: relative;
      margin: 12px 0 6px;
    }
    .chat-date-separator::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border-subtle);
    }
    .chat-date-separator span {
      position: relative;
      background: var(--bg-surface);
      padding: 2px 10px;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-tertiary);
      border-radius: 999px;
      border: 1px solid var(--border-subtle);
    }
    .ekoai-msg {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 88%;
      animation: fadeInMsg 0.2s ease;
    }
    @keyframes fadeInMsg { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .ekoai-msg.ai { align-self: flex-start; }
    .ekoai-msg.user { align-self: flex-end; }
    .ekoai-author-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.74rem;
      color: var(--text-tertiary);
      padding: 0 4px;
    }
    .ekoai-msg.user .ekoai-author-row { justify-content: flex-end; }
    .ekoai-sender-name { font-weight: 700; color: var(--text-secondary); }
    .ekoai-role-badge {
      font-size: 0.68rem;
      padding: 1px 6px;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.35);
      color: #a5b4fc;
      font-weight: 600;
    }
    .ekoai-msg-time { font-size: 0.68rem; color: var(--text-tertiary); }
    .ekoai-bubble {
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 0.88rem;
      line-height: 1.55;
      word-break: break-word;
    }
    .ekoai-msg.ai .ekoai-bubble {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-medium);
      color: #f1f5f9;
      border-bottom-left-radius: 4px;
    }
    .ekoai-msg.user .ekoai-bubble {
      background: #6366f1;
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }
    .ekoai-msg-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      padding-left: 4px;
    }
    .ekoai-escalate-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 0.72rem;
      font-weight: 600;
      color: #cbd5e1;
      cursor: pointer;
      transition: all var(--transition);
    }
    .ekoai-escalate-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    .ekoai-keyboard-hint {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.7rem;
      color: var(--text-tertiary);
      padding: 4px 8px 0;
    }

    /* ── DIRECT PAYMENT BUTTON (Image 3 fix) ── */
    .btn-direct-pay {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      margin-top: 10px;
      padding: 10px 16px;
      border-radius: 12px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.28);
      color: #c7d2fe;
      font-size: 0.86rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      text-decoration: none;
    }
    .btn-direct-pay:hover {
      background: rgba(99, 102, 241, 0.22);
      border-color: rgba(99, 102, 241, 0.5);
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
    }
    .btn-direct-pay:active {
      transform: translateY(0) scale(0.98);
    }

    /* ── TEŞEKKÜRLER & HALL OF FAME CARDS (Image 1 fix) ── */
    .credits-section {
      padding: 80px 0;
      position: relative;
    }
    .credits-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      max-width: 960px;
      margin: 0 auto;
    }
    .credit-card {
      position: relative;
      background: radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.03) 0%, rgba(15,18,28,0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 24px;
      padding: 28px 26px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 16px 36px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
      transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.24s ease, box-shadow 0.24s ease;
      overflow: hidden;
    }
    .credit-card:hover {
      transform: translateY(-3px);
      border-color: rgba(124, 106, 247, 0.4);
      box-shadow: 0 24px 48px -12px rgba(0,0,0,0.8), 0 0 25px rgba(124, 106, 247, 0.15), inset 0 1px 0 rgba(255,255,255,0.2);
    }
    .credit-card-head {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .credit-avatar {
      width: 58px;
      height: 58px;
      min-width: 58px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 850;
      font-size: 1.3rem;
      color: #ffffff;
      box-shadow: 0 8px 20px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.4);
      border: 2px solid rgba(255, 255, 255, 0.15);
    }
    .credit-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .credit-name-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .credit-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .credit-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 750;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: rgba(124, 106, 247, 0.15);
      border: 1px solid rgba(124, 106, 247, 0.35);
      color: #c7d2fe;
    }
    .credit-role {
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .credit-desc {
      font-size: 0.92rem;
      line-height: 1.65;
      color: #cbd5e1;
      margin: 0;
    }
    .credit-perks {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .credit-pill {
      display: inline-flex;
      align-items: center;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.09);
      color: #e2e8f0;
      transition: all 0.2s ease;
    }
    .credit-card:hover .credit-pill {
      border-color: rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.08);
    }
    @media (max-width: 768px) {
      .credits-grid { grid-template-columns: 1fr; }
    }

    /* ── EKOAI STUDIO SECTION (Image 2 fix) ── */
    .ekoai-section {
      padding: 80px 0 100px;
    }
    .ekoai-card {
      position: relative;
      background: radial-gradient(120% 120% at 50% 0%, rgba(99,102,241,0.06) 0%, rgba(12,15,24,0.96) 100%);
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 28px;
      padding: 40px 36px;
      box-shadow: 0 24px 60px -15px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12);
      overflow: hidden;
    }
    .ekoai-card-glow {
      position: absolute;
      top: -120px;
      right: -100px;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%);
      pointer-events: none;
      filter: blur(50px);
    }
    .ekoai-header {
      margin-bottom: 24px;
    }
    .ekoai-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #6366f1;
      box-shadow: 0 0 10px #6366f1;
      animation: pulseAiDot 1.8s infinite;
    }
    @keyframes pulseAiDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }

    .ekoai-chips-wrap {
      margin-bottom: 22px;
    }
    .chips-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .ekoai-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ekoai-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      padding: 8px 15px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .ekoai-chip:hover {
      background: rgba(99, 102, 241, 0.18);
      border-color: rgba(99, 102, 241, 0.45);
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.22);
    }

    .ekoai-console {
      background: #080a11;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .ekoai-messages-box {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      max-height: 480px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.15) transparent;
    }
    .ekoai-input-form {
      padding: 14px 18px;
      background: rgba(255, 255, 255, 0.03);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ekoai-text-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 12px;
      padding: 12px 18px;
      color: #ffffff;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }
    .ekoai-text-input:focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(99, 102, 241, 0.6);
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.2);
    }
    .ekoai-submit-btn {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      border: none;
      color: #ffffff;
      border-radius: 12px;
      padding: 12px 22px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }
    .ekoai-submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }
    .send-icon {
      width: 14px;
      height: 14px;
    }

    /* AI Bubble Markdown Table Styling */
    .ekoai-table-wrap {
      width: 100%;
      overflow-x: auto;
      margin: 12px 0 8px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(0, 0, 0, 0.25);
    }
    .ekoai-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }
    .ekoai-table th {
      background: rgba(99, 102, 241, 0.15);
      padding: 10px 14px;
      font-weight: 750;
      color: #e2e8f0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    .ekoai-table td {
      padding: 10px 14px;
      color: #cbd5e1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .ekoai-table tr:last-child td {
      border-bottom: none;
    }
    .ekoai-table tr:hover td {
      background: rgba(255, 255, 255, 0.03);
    }
  </style>
</head>
<body>

  <!-- Topbar -->
  <header class="topbar shell">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">E★</span>
      <span>EkoYıldız</span>
      <span class="brand-sub">Partner Studio</span>
    </a>
    <div class="top-actions">
      <a class="special-ataturk-link" href="/ataturk">
        <span aria-hidden="true">🇹🇷</span>
        <span>Atatürk Sergisi</span>
      </a>
      ${accountLink}
      <a class="btn-top-cta" href="/tickets/new?category=reklam">Reklam talebi oluştur</a>
    </div>
  </header>

  <main>
    <!-- Hero Section -->
    <section class="hero shell">
      <div class="hero-left">
        <div class="hero-eyebrow">
          <span class="dot-status"></span>
          <span>EkoYıldız Partner Studio · Özel Bağlantı</span>
        </div>
        <h1 class="hero-title">
          Reklam değil, <span>doğru toplulukla bağ.</span>
        </h1>
        <p class="hero-lead">
          Roblox Türk topluluklarını yakından tanıyan bir YouTube kanalı, aktif bir Discord ekosistemi ve içeriğin akışını bozmayan reklam formatları. Mesajınızı sadece göstermiyoruz; doğru bağlama yerleştiriyoruz.
        </p>
        <div class="hero-actions">
          <a class="btn-primary" href="#paketler">
            <span>Paketleri ve Ekstraları İncele</span>
            <span aria-hidden="true">↓</span>
          </a>
          <a class="btn-secondary" href="#kendi-paketini-olustur">
            <span>Kendi Paketini Oluştur</span>
          </a>
        </div>
        <div class="hero-honesty">
          <strong>✓</strong>
          <span>Şeffaflık notu: Kampanya sonuçları kitle ve kreatife göre değişir. Teslim kapsamını, yerleşimi ve raporlamayı baştan netleştiriyoruz.</span>
        </div>
      </div>

      <aside class="hero-summary-card">
        <div class="card-meta-head">
          <span class="meta-title">Kampanya Durumu</span>
          <span class="status-badge">Planlamaya Açık</span>
        </div>
        <div class="summary-spec-list">
          <div class="spec-item">
            <span class="spec-label">Hedef Kitle</span>
            <span class="spec-value">Roblox Türkiye & Genç Oyuncular</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Yayın Kanalları</span>
            <span class="spec-value">YouTube + Shorts + Discord</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Onay Süreci</span>
            <span class="spec-value">Yayın Öncesi Önizleme</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Ödeme & Sipariş</span>
            <span class="spec-value">Resmî İtemSatış Güvencesi</span>
          </div>
        </div>
        <div class="summary-footnote">
          Paket kapsamı, yayın takvimi ve teslim ölçütleri başlamadan önce bilet içinde yazılı olarak netleştirilir.
        </div>
      </aside>
    </section>

    <!-- Trust Strip -->
    <div class="trust-strip shell">
      <div class="trust-cell">
        <strong>Niş Topluluk</strong>
        <span>Roblox ve Türk oyun kültürünü bilen sadık izleyici</span>
      </div>
      <div class="trust-cell">
        <strong>Çoklu Dağıtım</strong>
        <span>YouTube, Shorts, topluluk anketi ve Discord duyurusu</span>
      </div>
      <div class="trust-cell">
        <strong>Önce Onay</strong>
        <span>Metin, seslendirme ve görsel yerleşimi yayın öncesi netleşir</span>
      </div>
      <div class="trust-cell">
        <strong>Güvenli Ödeme</strong>
        <span>Yalnızca resmî İtemSatış süreci (Kişisel IBAN/DM yok)</span>
      </div>
    </div>

    <!-- Neden EkoYıldız -->
    <section class="section-wrap shell">
      <div class="section-head">
        <span class="section-kicker">Neden EkoYıldız’da reklam?</span>
        <h2 class="section-title">İzleyici reklamı değil, bağlamı hatırlar.</h2>
        <p class="section-desc">
          Genel kitleye rastgele gösterim yerine, Roblox topluluklarının dilini ve gündemini bilen bir ekosistemde yer alırsınız. Tanıtımınız izleyicinin ilgisini bölmeden, videonun doğal bir parçası olarak kurgulanır.
        </p>
      </div>

      <div class="trust-strip" style="margin:0 0 40px 0; border-top:1px solid var(--border-subtle); border-bottom:1px solid var(--border-subtle);">
        <div class="trust-cell">
          <strong>01 / Odaklı Erişim</strong>
          <span>Roblox oyuncuları ve Discord topluluklarıyla doğrudan temas</span>
        </div>
        <div class="trust-cell">
          <strong>02 / Doğal Entegrasyon</strong>
          <span>Kuru bir afiş yerine videonun tonuna uyumlu sesli anlatım</span>
        </div>
        <div class="trust-cell">
          <strong>03 / Yayın Öncesi Kontrol</strong>
          <span>Onayınız alınmadan hiçbir tanıtım içeriği yayına girmez</span>
        </div>
        <div class="trust-cell">
          <strong>04 / Ölçülebilir Teslim</strong>
          <span>Nerede ve ne zaman yayınlandığını görün; şeffaf arşiv kaydı</span>
        </div>
      </div>
    </section>

    <!-- 1. HAZIR PAKETLER + DİNAMİK DISCORD DUYURUSU -->
    <section class="section-wrap shell" id="paketler">
      <div class="section-head">
        <span class="section-kicker">Şeffaf paketler</span>
        <h2 class="section-title">Üstü çizili fiyat yok. Numara yok.</h2>
        <p class="section-desc">
          Her paket tek net başlangıç fiyatıyla sunulur. Video paketinizi seçerken isteğe bağlı Discord duyurusunu tek tıkla ekleyebilir; üst seviye paketlerde artan ekstra fiyat avantajından yararlanabilirsiniz.
        </p>
      </div>

      <div class="pricing-grid">
        ${packageCardsHtml}
      </div>

      <p style="color:var(--text-tertiary); font-size:0.8rem; margin-top:20px;">
        * Fiyatlar başlangıç paket kapsamını gösterir. Vergi, platform komisyonu veya özel prodüksiyon gereksinimleri teklif aşamasında açıkça belirtilir.
      </p>
    </section>

    <!-- 2. KENDİ PAKETİNİ OLUŞTUR (YENİ / BETA) -->
    <section class="custom-builder-section shell" id="kendi-paketini-olustur">
      <div class="builder-header">
        <div class="builder-badge-group">
          <span class="beta-badge primary">YENİ</span>
          <span class="beta-badge">BETA</span>
        </div>
        <h2 class="section-title">Kendi Paketini Oluştur</h2>
        <p class="section-desc">
          Hazır paketlere bağlı kalmak zorunda değilsiniz. İhtiyacınız olan bileşenleri seçin; akıllı paket motorumuz çoklu seçim avantajını canlı olarak hesaplasın.
        </p>
      </div>

      <div class="builder-layout">
        <!-- Sol Seçenekler -->
        <div class="builder-options">

          <!-- Adım 1: Ana Format -->
          <div class="option-block">
            <div class="option-group-title">
              <span class="step-num">1</span>
              <span>Ana Yayın Formatı</span>
            </div>
            <div class="cards-row-select">
              <div class="custom-choice-card is-selected" id="choice-fmt_video_midroll" onclick="selectBuilderFormat('fmt_video_midroll', 100, 'Uzun Video Sesli Mid-Roll')">
                <div class="choice-card-head">
                  <span class="choice-card-title">Sesli Mid-Roll</span>
                  <span class="choice-card-price">100 TL</span>
                </div>
                <div class="choice-card-sub">Videonun ortasında 20–30 sn sesli ve görüntülü anlatım</div>
              </div>

              <div class="custom-choice-card" id="choice-fmt_video_standard" onclick="selectBuilderFormat('fmt_video_standard', 50, 'Uzun Video Alt Bant')">
                <div class="choice-card-head">
                  <span class="choice-card-title">Video Alt Bant</span>
                  <span class="choice-card-price">50 TL</span>
                </div>
                <div class="choice-card-sub">Kalıcı banner ve alt yazı yerleşimi</div>
              </div>

              <div class="custom-choice-card" id="choice-fmt_shorts" onclick="selectBuilderFormat('fmt_shorts', 30, 'YouTube Shorts')">
                <div class="choice-card-head">
                  <span class="choice-card-title">YouTube Shorts</span>
                  <span class="choice-card-price">30 TL</span>
                </div>
                <div class="choice-card-sub">Dikey formatta dinamik ve hızlı kitle erişimi</div>
              </div>

              <div class="custom-choice-card" id="choice-fmt_none" onclick="selectBuilderFormat('fmt_none', 0, 'Video Yok (Sadece Topluluk)')">
                <div class="choice-card-head">
                  <span class="choice-card-title">Video İstemiyorum</span>
                  <span class="choice-card-price">0 TL</span>
                </div>
                <div class="choice-card-sub">Yalnızca Discord duyurusu ve topluluk etkinlikleri</div>
              </div>
            </div>
          </div>

          <!-- Adım 2: Video İçi Kurgu Derinliği -->
          <div class="option-block" id="block-video-pacing">
            <div class="option-group-title">
              <span class="step-num">2</span>
              <span>Video İçi Kurgu & Süre</span>
            </div>
            <div class="cards-row-select">
              <div class="custom-choice-card is-selected" id="choice-pacing_standard" onclick="selectBuilderPacing('pacing_standard', 0, 'Standart Süre (20-30 sn)')">
                <div class="choice-card-head">
                  <span class="choice-card-title">Standart Süre</span>
                  <span class="choice-card-price">Dahil</span>
                </div>
                <div class="choice-card-sub">Videonun akışında net ve vurucu mesaj iletimi</div>
              </div>

              <div class="custom-choice-card" id="choice-pacing_extended" onclick="selectBuilderPacing('pacing_extended', 45, 'Genişletilmiş Anlatım (45-60 sn)')">
                <div class="choice-card-head">
                  <span class="choice-card-title">Genişletilmiş (45–60 sn)</span>
                  <span class="choice-card-price">+ ₺45</span>
                </div>
                <div class="choice-card-sub">Oyun içi özellikler ve detaylı inceleme kesiti</div>
              </div>

              <div class="custom-choice-card" id="choice-pacing_gameplay" onclick="selectBuilderPacing('pacing_gameplay', 90, 'Özel Oynanış Kesiti (2-3 dk)')">
                <div class="choice-card-head">
                  <span class="choice-card-title">Oynanış Kesiti (2–3 dk)</span>
                  <span class="choice-card-price">+ ₺90</span>
                </div>
                <div class="choice-card-sub">Videonun bir bölümünün doğrudan oyununuza ayrılması</div>
              </div>
            </div>
          </div>

          <!-- Adım 3: Ek Dağıtım & Discord -->
          <div class="option-block">
            <div class="option-group-title">
              <span class="step-num">3</span>
              <span>Dağıtım & Ek Hizmetler</span>
            </div>
            <div class="cards-grid-addons">
              <!-- Discord Duyurusu (Dinamik Fiyat) -->
              <div class="custom-addon-item" id="builder-addon-discord" onclick="toggleBuilderAddon('addon_discord_announcement')">
                <div class="addon-item-left">
                  <div class="addon-item-box">
                    <svg viewBox="0 0 16 16" fill="none" class="check-svg" aria-hidden="true">
                      <path d="M13.3 4.3L6 11.6 2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="addon-item-info">
                    <strong>Discord Topluluk Duyurusu</strong>
                    <span id="builder-discord-sub">EkoYıldız Discord sunucusunda @everyone bildirimli özel sponsorluk paylaşımı</span>
                  </div>
                </div>
                <div class="addon-item-price" id="builder-discord-price">+ ₺80</div>
              </div>

              <!-- Sabitlenmiş Yorum -->
              <div class="custom-addon-item" id="builder-addon-pinned" onclick="toggleBuilderAddon('addon_pinned_comment', 20, 'Sabitlenmiş Yorum Bağlantısı')">
                <div class="addon-item-left">
                  <div class="addon-item-box">
                    <svg viewBox="0 0 16 16" fill="none" class="check-svg" aria-hidden="true">
                      <path d="M13.3 4.3L6 11.6 2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="addon-item-info">
                    <strong>Sabitlenmiş Yorum Bağlantısı</strong>
                    <span>Video altında ilk yorumda doğrudan yönlendirme linki</span>
                  </div>
                </div>
                <div class="addon-item-price">+ ₺20</div>
              </div>

              <!-- Açıklama Linki -->
              <div class="custom-addon-item" id="builder-addon-desc" onclick="toggleBuilderAddon('addon_desc_link', 15, 'Açıklama Üst Sıra Bağlantısı')">
                <div class="addon-item-left">
                  <div class="addon-item-box">
                    <svg viewBox="0 0 16 16" fill="none" class="check-svg" aria-hidden="true">
                      <path d="M13.3 4.3L6 11.6 2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="addon-item-info">
                    <strong>Açıklama Üst Sıra Bağlantısı</strong>
                    <span>Açıklamanın ilk 2 satırında tıklanabilir davet linki</span>
                  </div>
                </div>
                <div class="addon-item-price">+ ₺15</div>
              </div>

              <!-- YouTube Topluluk Anketi -->
              <div class="custom-addon-item" id="builder-addon-community" onclick="toggleBuilderAddon('addon_community_post', 60, 'YouTube Topluluk Anketi & Görsel')">
                <div class="addon-item-left">
                  <div class="addon-item-box">
                    <svg viewBox="0 0 16 16" fill="none" class="check-svg" aria-hidden="true">
                      <path d="M13.3 4.3L6 11.6 2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="addon-item-info">
                    <strong>YouTube Topluluk Anketi / Görsel Paylaşımı</strong>
                    <span>Yüz binlerce aboneye ulaşan topluluk sekmesinde özel gönderi</span>
                  </div>
                </div>
                <div class="addon-item-price">+ ₺60</div>
              </div>

              <!-- Çekiliş Kurgusu -->
              <div class="custom-addon-item" id="builder-addon-giveaway" onclick="toggleBuilderAddon('addon_giveaway', 120, 'Topluluk Çekilişi & Özel Kurgu')">
                <div class="addon-item-left">
                  <div class="addon-item-box">
                    <svg viewBox="0 0 16 16" fill="none" class="check-svg" aria-hidden="true">
                      <path d="M13.3 4.3L6 11.6 2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="addon-item-info">
                    <strong>Topluluk Çekilişi & Katılım Kurgusu</strong>
                    <span>Roblox grubu/Discord şartlı çekilişle organik kitle yönlendirmesi</span>
                  </div>
                </div>
                <div class="addon-item-price">+ ₺120</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Sağ Canlı Özet Sidebar -->
        <aside class="builder-summary-sticky">
          <div class="summary-card-head">
            <h4>Paket Özeti</h4>
          </div>

          <ul class="summary-items-list" id="builder-items-list">
            <!-- Dinamik doldurulacak -->
          </ul>

          <div class="summary-calculation-box">
            <div class="calc-row">
              <span>Ara Toplam</span>
              <span id="builder-subtotal">₺0</span>
            </div>
            <div class="calc-row discount-row" id="builder-discount-row" style="display:none;">
              <span id="builder-discount-label">Paket Avantajı</span>
              <span id="builder-discount-val">-₺0</span>
            </div>
            <div class="calc-row total-row">
              <span>Tahmini Toplam</span>
              <span id="builder-total">₺0</span>
            </div>
          </div>

          <button type="button" class="btn-build-package" id="btn-submit-custom" onclick="submitCustomPackage()">
            <span>Paketimi Oluştur</span>
            <svg viewBox="0 0 16 16" fill="none" class="cta-arrow" aria-hidden="true" style="width:14px;height:14px;">
              <path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </aside>
      </div>
    </section>

    <!-- Fiyatlar Neden Böyle? -->
    <section class="section-wrap shell">
      <div class="why-price-grid">
        <div>
          <span class="section-kicker">Fiyatlar neden böyle?</span>
          <h2 class="section-title">Gösterim değil, üretim ve yerleşim satın alırsınız.</h2>
          <p class="section-desc" style="margin-bottom:24px;">
            Bir reklamın değeri yalnızca ekranda kaldığı saniye değildir. Doğru cümle, doğru bağlam, yayın öncesi kontrol ve sonrasında doğrulanabilir teslim aynı sürecin parçalarıdır.
          </p>
          <a class="btn-secondary" href="/tickets/new?category=reklam">Bütçeme göre planla →</a>
        </div>
        <div class="cost-stack">
          <div class="cost-row">
            <span class="cost-icon">✦</span>
            <div><strong>İçerik uyarlaması</strong><small>Mesajın EkoYıldız izleyicisine uygun dile çevrilmesi</small></div>
            <span class="cost-tag">Dahil</span>
          </div>
          <div class="cost-row">
            <span class="cost-icon">🎬</span>
            <div><strong>Üretim ve yerleşim</strong><small>Kurgu, seslendirme, görsel veya bağlantı konumlandırması</small></div>
            <span class="cost-tag">Dahil</span>
          </div>
          <div class="cost-row">
            <span class="cost-icon">◎</span>
            <div><strong>Yayın öncesi revize</strong><small>İsim, mesaj ve kreatif unsurların birlikte kontrolü</small></div>
            <span class="cost-tag">Dahil</span>
          </div>
          <div class="cost-row">
            <span class="cost-icon">↗</span>
            <div><strong>Topluluk dağıtımı</strong><small>Seçilen pakete göre YouTube, Shorts ve Discord desteği</small></div>
            <span class="cost-tag">Pakete göre</span>
          </div>
          <div class="cost-row">
            <span class="cost-icon">▥</span>
            <div><strong>Teslim kaydı</strong><small>Yayın bağlantıları ve uygun paketlerde performans özeti</small></div>
            <span class="cost-tag">Şeffaf</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Kanıtlanmış Sonuçlar & Partner Başarıları -->
    <section class="section-wrap shell" id="isbirlikleri">
      <div class="section-head">
        <span class="section-kicker">Kanıtlanmış Sonuçlar & Partner Başarıları</span>
        <h2 class="section-title">İş birliklerimizin somut yükseliş hikayeleri.</h2>
        <p class="section-desc">
          Tahmini vaatler değil; YouTube videoları, aktiflik verileri ve gerçek topluluk büyüme çıktıları. Önceki partnerlerimizin EkoYıldız ile yakaladığı somut yükselişi inceleyin.
        </p>
      </div>

      <div class="case-grid">
        <!-- 1. İMPREİUS FAMİLY -->
        <article class="case-card">
          <span class="case-badge">🏆 TOPLULUK & SOHBET PATLAMASI</span>
          <div class="case-partner">İMPREİUS FAMİLY</div>
          <div class="case-metrics">
            <div>
              <span class="metric-val">150 ➔ 980</span>
              <span class="metric-lbl">Üye Büyümesi</span>
            </div>
            <div>
              <span class="metric-val">45 Mesaj/Dk</span>
              <span class="metric-lbl">Sohbet Aktifliği</span>
            </div>
          </div>
          <p class="case-desc">
            150 üyeli başlangıç seviyesinden 980 üyeye hızlı bir yükseliş sağlandı. Tanıtım sonrasında sunucu sohbetinde dakikada 45 mesajlık yüksek bir canlılık ve organik etkileşim temposu korundu.
          </p>
          <a class="case-link" href="https://www.youtube.com/watch?v=fNrMzxYGP64&t=1225s&pp=0gcJCWMAwfN6Pr3D" target="_blank" rel="noopener noreferrer">
            <span>YouTube Videosunu İzle (12:25)</span>
            <span aria-hidden="true">↗</span>
          </a>
        </article>

        <!-- 2. ASKER OYUNU MAP SAĞLAYICISI -->
        <article class="case-card">
          <span class="case-badge warning">📦 TİCARİ LANSMAN & SİPARİŞ</span>
          <div class="case-partner">Asker Oyunu Map Sağlayıcısı</div>
          <div class="case-metrics">
            <div>
              <span class="metric-val">10–15</span>
              <span class="metric-lbl">Aylık Düzenli Sipariş</span>
            </div>
            <div>
              <span class="metric-val">Sıfırdan Lansman</span>
              <span class="metric-lbl">İlk Tanıtım</span>
            </div>
          </div>
          <p class="case-desc">
            Pazara yeni çıktığında EkoYıldız kanalında tanıtıldı ve ayda 10-15 siparişe kadar yükseldi. <em class="transparency-note">(Not: Sonradan operasyonunu kapattı — şeffaf arşiv kaydı).</em>
          </p>
          <a class="case-link" href="https://www.youtube.com/watch?v=op1ipqwgxRU&t=8s" target="_blank" rel="noopener noreferrer">
            <span>Tanıtım Videosunu İncele (0:08)</span>
            <span aria-hidden="true">↗</span>
          </a>
        </article>

        <!-- 3. TTA TURKISH ARMED FORCES -->
        <article class="case-card">
          <span class="case-badge success">🛡️ DENETİM VE AKTİFLİK ARTIŞI</span>
          <div class="case-partner">TTA TURKISH ARMED FORCES</div>
          <div class="case-metrics">
            <div>
              <span class="metric-val">15 ➔ 65</span>
              <span class="metric-lbl">Denetim Aktifliği</span>
            </div>
            <div>
              <span class="metric-val">Haziran 2025</span>
              <span class="metric-lbl">Etkinlik Dönemi</span>
            </div>
          </div>
          <p class="case-desc">
            15 güncel aktiflik seviyesinden 65 denetim aktifliğine yükselerek askeri rol yapma alanında rekor katılıma ulaştı. Topluluk içi rütbe ve tatbikat disiplininde güçlü bir sıçrama kaydedildi.
          </p>
          <a class="case-link" href="https://www.youtube.com/watch?v=vYT9LFfzHxc&t=149s" target="_blank" rel="noopener noreferrer">
            <span>Tatbikat & Tanıtım Videosu (2:29)</span>
            <span aria-hidden="true">↗</span>
          </a>
        </article>
      </div>
    </section>

    <!-- Başvuru Koşulları & İttifak Orduları -->
    <section class="section-wrap shell">
      <div class="section-head">
        <span class="section-kicker">Başvuru koşulları</span>
        <h2 class="section-title">İttifak Orduları kampları için açık ölçütler.</h2>
        <p class="section-desc">
          Başvurular ücretli ve ücretsiz reklam türüne göre ayrı değerlendirilir. Üye sayısı incelenirken yalnızca gerçek hesaplar dikkate alınır.
        </p>
      </div>

      <div class="trust-strip" style="margin:0 0 20px 0;">
        <div class="trust-cell">
          <strong>01 / Ücretli Reklam</strong>
          <span>YGS veya GS olma şartı yalnızca ücretli reklam alacak İttifak Orduları kampları için geçerlidir.</span>
        </div>
        <div class="trust-cell">
          <strong>02 / Rütbe Durumu</strong>
          <span>Rütbe fark etmez; ücretli reklam şartının dışındaki uygun başvurularda kamp yöneticisinin rütbesi değerlendirmeyi etkilemez.</span>
        </div>
        <div class="trust-cell">
          <strong>03 / Ücretsiz Reklam</strong>
          <span>5.000+ gerçek üye şartı aranır. Bot hesaplar üye sayısında kesinlikle sayılmaz ve bekleme süresi oldukça uzundur.</span>
        </div>
        <div class="trust-cell">
          <strong>04 / Şeffaf Sınırlar</strong>
          <span>Reklam çalışmaları erişim ve görünürlük sağlar; üye artışı garanti edilmez.</span>
        </div>
      </div>
    </section>

    <!-- 4 Adımda Süreç -->
    <section class="section-wrap shell">
      <div class="section-head">
        <span class="section-kicker">Nasıl ilerliyor?</span>
        <h2 class="section-title">Dört adımda yayına hazır.</h2>
        <p class="section-desc">Uzun formlar yerine bilet içinde her şeyin şeffaf ilerlediği yalın bir planlama süreci.</p>
      </div>

      <div class="process-grid">
        <div class="step-card">
          <b>Adım 01</b>
          <h3>Hedefini Anlat</h3>
          <p>Topluluğunu, bağlantını, bütçeni ve ulaşmak istediğin hedef kitleyi bizimle paylaş.</p>
        </div>
        <div class="step-card">
          <b>Adım 02</b>
          <h3>Formatı Belirle</h3>
          <p>Shorts, video içi sesli anlatım veya özel Discord duyurusu arasından doğru kapsamı seç.</p>
        </div>
        <div class="step-card">
          <b>Adım 03</b>
          <h3>Metni Onayla</h3>
          <p>Yayın metni ve görsel yerleşimi önceden sana sunulur; gerekli revizeler birlikte tamamlanır.</p>
        </div>
        <div class="step-card">
          <b>Adım 04</b>
          <h3>Yayın ve Teslim</h3>
          <p>Belirlenen takvimde yayınlanır; kalıcı bağlantılar ve teslim bilgileri biletine eklenir.</p>
        </div>
      </div>
    </section>

    <!-- TEŞEKKÜRLER — COMPONENTS V2 -->
    <section class="credits-section shell" id="tesekkurler">
      <div class="section-head" style="text-align:center;max-width:720px;margin:0 auto 40px;">
        <span class="section-kicker">Gönülden Teşekkür</span>
        <h2 class="section-title">Projeye katkıları ve destekleri için teşekkür ederiz.</h2>
        <p class="section-desc">
          EkoYıldız platformunun büyümesinde, topluluk ruhunun korunmasında ve yolculuğumuzun her evresinde emeği geçen yol arkadaşlarımıza en içten şükranlarımızla.
        </p>
      </div>

      <div class="credits-grid">
        ${creditsCardsHtml}
      </div>
    </section>

    <!-- SSS -->
    <section class="section-wrap shell">
      <div class="faq-layout">
        <div>
          <span class="section-kicker">Kısa cevaplar</span>
          <h2 class="section-title">Başlamadan önce bilinmesi gerekenler.</h2>
          <p class="section-desc">
            Ek sorularınızı destek bileti üzerinden iletebilir; kapsam, takvim ve ödeme sürecini yetkiliyle yazılı olarak netleştirebilirsiniz.
          </p>
        </div>
        <div class="faq-list">
          ${faqHtml}
        </div>
      </div>
    </section>

    <!-- EkoAI — Canlı Reklam ve Destek Asistanı -->
    <section class="ekoai-section shell" id="ekoai-danisman">
      <div class="ekoai-card">
        <div class="ekoai-card-glow"></div>
        <div class="ekoai-header">
          <div class="ekoai-badge">
            <span class="pulse-dot"></span>
            <span>EkoAI · AI Destek Asistanı</span>
          </div>
          <h2 class="section-title" style="margin-bottom:10px;">EKOai Reklam Danışmanına Sorun</h2>
          <p class="section-desc">
            Paket kapsamları, Discord duyurusu entegrasyonu, İtemSatış / Papara ödeme yöntemleri veya İttifak kampları kuralları hakkında sorularınızı anında yöneltebilirsiniz.
          </p>
        </div>

        <div class="ekoai-chips-wrap">
          <span class="chips-label">Örnek Hızlı Sorular:</span>
          <div class="ekoai-chips">
            <button type="button" class="ekoai-chip" onclick="askEkoAI('Shorts paketinde Discord duyurusu var mı?')">💡 Shorts paketinde Discord duyurusu var mı?</button>
            <button type="button" class="ekoai-chip" onclick="askEkoAI('Papara ile İtemSatış ödemesi arasındaki komisyon farkı nedir?')">💳 Papara vs İtemSatış ödeme farkı nedir?</button>
            <button type="button" class="ekoai-chip" onclick="askEkoAI('Dedicated Özel Video ile Midroll arasındaki temel fark nedir?')">💡 Dedicated ile Midroll arasındaki fark nedir?</button>
            <button type="button" class="ekoai-chip" onclick="askEkoAI('İttifak Orduları kampları için reklam koşulları neler?')">💡 İttifak kampları reklam koşulları neler?</button>
            <button type="button" class="ekoai-chip" onclick="askEkoAI('Kendi paketimi oluştururken indirim kazanabilir miyim?')">💡 Paketimi oluştururken indirim kazanabilir miyim?</button>
          </div>
        </div>

        <div class="ekoai-console">
          <div class="ekoai-messages-box" id="ekoai-inline-chat">
            <div class="chat-date-separator"><span>Bugün</span></div>
            <div class="ekoai-msg ai">
              <div class="ekoai-author-row">
                <span class="ekoai-sender-name">EkoAI</span>
                <span class="ekoai-role-badge">AI Destek Asistanı</span>
                <span class="ekoai-msg-time">Şimdi</span>
              </div>
              <div class="ekoai-bubble">
                Merhaba! Ben EkoYıldız Partner Studio'nun yapay zekâ destekli asistanı <strong>EkoAI</strong>. Reklam paketleri, Papara/İtemSatış ödeme detayları veya süreçle ilgili sorularınızı yanıtlayabilirim.
              </div>
              <div class="ekoai-msg-actions">
                <button type="button" class="ekoai-escalate-btn" onclick="escalateToHumanStaff()">👤 Yetkiliye Aktar (Bilet Aç)</button>
              </div>
            </div>
          </div>
          <form class="ekoai-input-form" onsubmit="handleInlineSubmit(event)">
            <input type="text" id="ekoai-inline-input" class="ekoai-text-input" placeholder="Reklam paketleri veya süreçle ilgili bir soru yazın... (Enter ile gönder)" autocomplete="off">
            <button type="submit" id="ekoai-inline-btn" class="ekoai-submit-btn">
              <span>Sor</span>
              <svg viewBox="0 0 16 16" fill="none" class="send-icon"><path d="M2 8l11-5-3.5 11-2.5-4-5-2z" fill="currentColor"/></svg>
            </button>
          </form>
          <div class="ekoai-keyboard-hint">
            <span>EkoAI bir yapay zekâ asistanıdır. Gerçek yetkili değildir.</span>
            <span>Enter: Gönder · Shift+Enter: Yeni satır</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="final-cta shell">
      <h2>Topluluğunu doğru yerde büyüt.</h2>
      <p>
        Hazır bir paket seç veya bütçeni ve hedefini anlat; EkoYıldız reklam ekibi sana uygun kapsamı ticket içinde netleştirsin.
      </p>
      <div class="hero-actions" style="justify-content:center;">
        <a class="btn-primary" href="/tickets/new?category=reklam">Reklam talebi oluştur →</a>
        <a class="btn-secondary" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Discord’a katıl</a>
        <a class="btn-secondary" href="${YOUTUBE_URL}" target="_blank" rel="noopener noreferrer">Kanalı incele ↗</a>
      </div>
    </section>
  </main>

  <!-- Mobile Sticky Bar -->
  <aside class="mobile-sticky-bar" id="mobile-sticky-bar">
    <div class="mobile-sticky-content">
      <div class="mobile-total-info">
        <small id="mobile-summary-label">Paket Seçimi</small>
        <strong id="mobile-summary-price">₺100</strong>
      </div>
      <a class="btn-primary" id="mobile-sticky-cta" href="/tickets/new?category=reklam&package=midroll" style="padding:10px 18px;font-size:0.88rem;">
        Devam Et →
      </a>
    </div>
  </aside>

  <!-- Floating EkoAI Widget (Sağ Altta) -->
  <aside class="ekoai-floating-widget" id="ekoai-floating-widget">
    <div class="ekoai-chat-window" id="ekoai-chat-window" style="display:none;">
      <div class="ekoai-chat-header">
        <div class="ekoai-agent-info">
          <span class="ekoai-online-indicator"></span>
          <div>
            <strong>EkoAI</strong>
            <small>AI Destek Asistanı</small>
          </div>
        </div>
        <button type="button" class="ekoai-close-btn" onclick="toggleFloatingChat()" aria-label="Kapat">✕</button>
      </div>
      <div class="ekoai-chat-body" id="ekoai-floating-chat-body">
        <div class="chat-date-separator"><span>Bugün</span></div>
        <div class="ekoai-msg ai">
          <div class="ekoai-author-row">
            <span class="ekoai-sender-name">EkoAI</span>
            <span class="ekoai-role-badge">AI Destek Asistanı</span>
            <span class="ekoai-msg-time">Şimdi</span>
          </div>
          <div class="ekoai-bubble">
            Merhaba! Reklam paketlerimiz, Discord duyurusu veya Papara / İtemSatış ödeme adımları hakkında sorularınızı yanıtlamaya hazırım. Size nasıl yardımcı olabilirim?
          </div>
          <div class="ekoai-msg-actions">
            <button type="button" class="ekoai-escalate-btn" onclick="escalateToHumanStaff()">👤 Yetkiliye Aktar</button>
          </div>
        </div>
      </div>
      <form class="ekoai-chat-footer" onsubmit="handleFloatingSubmit(event)">
        <input type="text" id="ekoai-floating-input" placeholder="Bir soru yazın..." autocomplete="off">
        <button type="submit" aria-label="Gönder">➔</button>
      </form>
    </div>

    <button type="button" class="ekoai-floating-trigger" id="ekoai-floating-trigger" onclick="toggleFloatingChat()" aria-label="EkoAI Destek Asistanı">
      <span class="ekoai-trigger-icon">🤖</span>
      <span class="ekoai-trigger-label">EkoAI'ya Danış</span>
    </button>
  </aside>

  <!-- ÖDEME VE SATIN ALMA SEÇİM MODALI (Papara 0 TL vs İtemSatış +5 TL) -->
  <div class="modal-backdrop" id="payment-modal" style="display:none;" onclick="handleModalBackdropClick(event)">
    <div class="payment-modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-pkg-title">
      <div class="modal-header">
        <div class="modal-header-left">
          <span class="modal-kicker">Şeffaf Ödeme Yöntemleri</span>
          <h3 id="modal-pkg-title">Paket Ödeme Seçimi</h3>
        </div>
        <button type="button" class="modal-close-btn" onclick="closePaymentModal()" aria-label="Kapat">✕</button>
      </div>

      <div class="modal-body">
        <div class="modal-pkg-summary">
          <div class="summary-line">
            <span class="summary-title" id="modal-item-name">Seçilen Paket</span>
            <span class="summary-price" id="modal-item-price">₺100</span>
          </div>
          <div class="summary-subnote" id="modal-item-note">Resmî sipariş ve kampanya başlangıcı</div>
        </div>

        <!-- 2 Payment Choice Cards -->
        <div class="payment-cards-grid">
          <!-- PAPARA CARD -->
          <div class="pay-method-card is-selected" id="pay-card-papara" onclick="selectPaymentMethod('papara')" tabindex="0" role="radio" aria-checked="true">
            <div class="pay-card-head">
              <div class="pay-card-title-row">
                <span class="pay-icon papara-icon">P</span>
                <strong>Papara</strong>
              </div>
              <span class="fee-badge zero-fee">0 TL Komisyon</span>
            </div>
            <p class="pay-card-desc">Papara numarasına doğrudan ödeme yaparak ek işlem ücreti ödemeden işleminizi tamamlayabilirsiniz.</p>
            <ul class="pay-perks">
              <li>✓ Ek komisyon yok (0 TL)</li>
              <li>✓ Doğrudan ve hızlı işlem</li>
              <li>✓ 1 Tıkla hesap no kopyalama</li>
            </ul>
          </div>

          <!-- ITEMSATIS CARD -->
          <div class="pay-method-card" id="pay-card-itemsatis" onclick="selectPaymentMethod('itemsatis')" tabindex="0" role="radio" aria-checked="false">
            <div class="pay-card-head">
              <div class="pay-card-title-row">
                <span class="pay-icon itemsatis-icon">İS</span>
                <strong>İtemSatış</strong>
              </div>
              <span class="fee-badge fee-added">+5 TL İşlem Ücreti</span>
            </div>
            <p class="pay-card-desc">Ödeme İtemSatış üzerinden gerçekleştirilebilir. Platform hizmet bedeli şeffaf olarak yansıtılır.</p>
            <ul class="pay-perks">
              <li>✓ Platform güvencesiyle işlem</li>
              <li>✓ Kredi kartı, banka kartı ve bakiye</li>
              <li>✓ Şeffaf +5 TL işlem ücreti dökümü</li>
            </ul>
          </div>
        </div>

        <!-- Papara Details Section (Shown when Papara is active) -->
        <div id="papara-details-block" class="pay-details-block">
          <div class="papara-account-box">
            <div class="account-meta">
              <span class="acc-label">Papara Hesap Numarası:</span>
              <span class="acc-number" id="papara-acc-number">1947291842</span>
            </div>
            <button type="button" class="btn-copy-acc" id="btn-copy-papara" onclick="copyPaparaNumber()">
              <span id="copy-btn-text">Kopyala</span>
              <svg viewBox="0 0 16 16" fill="none" class="copy-svg"><path d="M4 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.5"/><path d="M6 2V1a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1" stroke="currentColor" stroke-width="1.5"/></svg>
            </button>
          </div>
          <div id="copy-feedback-toast" class="copy-toast" style="display:none;">✓ Papara Numarası Panoya Kopyalandı!</div>
          <div class="upload-proof-box">
            <label class="proof-label" for="payment-proof-ref">Ödeme Dekont / İşlem Kodu (İsteğe Bağlı):</label>
            <input type="text" id="payment-proof-ref" class="proof-input" placeholder="Dekont takip no veya Papara gönderici adı...">
            <small class="proof-hint">Ödemeyi yaptıktan sonra biletinizde yetkili anında eşleştirir.</small>
          </div>
        </div>

        <!-- ItemSatis Details Section (Shown when ItemSatis is active) -->
        <div id="itemsatis-details-block" class="pay-details-block" style="display:none;">
          <div class="itemsatis-trust-callout">
            <svg viewBox="0 0 20 20" fill="currentColor" class="shield-svg"><path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clip-rule="evenodd"/></svg>
            <span>Ödeme İtemSatış güvencesiyle platform üzerinden gerçekleştirilebilir. Sipariş bağlantınız biletinizde güvenle tanımlanacaktır.</span>
          </div>
        </div>

        <!-- Price Breakdown Table -->
        <div class="price-breakdown-card">
          <div class="bd-row">
            <span>Paket Tutarı</span>
            <strong id="bd-base-price">₺100</strong>
          </div>
          <div class="bd-row" id="bd-fee-row" style="color:var(--text-secondary);">
            <span id="bd-fee-label">İşlem Komisyonu (Papara 0 TL)</span>
            <strong id="bd-fee-price">₺0</strong>
          </div>
          <div class="bd-divider"></div>
          <div class="bd-row total-row">
            <span>Ödenecek Toplam</span>
            <strong id="bd-total-price">₺100</strong>
          </div>
        </div>

        <!-- Status message / feedback -->
        <div id="payment-status-message" class="payment-status-message" style="display:none;"></div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" onclick="closePaymentModal()">Kapat</button>
        <button type="button" class="btn-checkout-confirm" id="btn-confirm-payment" onclick="processPaymentSelection()">
          <span class="btn-spinner" id="confirm-spinner" style="display:none;"></span>
          <span id="confirm-btn-label">Talebi & Ödemeyi Başlat</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="footer shell">
    <span>© 2026 EkoYıldız Partner Studio · Özel bilgilendirme ve reklam merkezi</span>
    <span>
      <a href="/safety">Safety Center</a> · 
      <a href="/help">Help Center</a> · 
      <a href="/anayasasi">Politikalar</a>
    </span>
  </footer>

  <!-- Frontend Client Script (Paket Seçimi, Dinamik Discord Add-on, Custom Builder) -->
  <script>
    // State
    const cardAddonStates = {}; // pkgId -> boolean
    const builderState = {
      formatId: 'fmt_video_midroll',
      formatPrice: 100,
      formatTitle: 'Uzun Video Sesli Mid-Roll',
      pacingId: 'pacing_standard',
      pacingPrice: 0,
      pacingTitle: 'Standart Süre (20-30 sn)',
      addons: new Map() // addonId -> { price, title }
    };

    // 1. Preset Paketlerde Discord Add-on Aç/Kapa
    function toggleDiscordAddon(pkgId, basePrice, addonPrice) {
      const box = document.getElementById('addon-box-' + pkgId);
      const check = document.getElementById('addon-check-' + pkgId);
      const amountEl = document.getElementById('price-amount-' + pkgId);
      const captionEl = document.getElementById('price-caption-' + pkgId);
      const ctaBtn = document.getElementById('btn-cta-' + pkgId);
      const ctaLabel = document.getElementById('cta-label-' + pkgId);

      const isActive = !cardAddonStates[pkgId];
      cardAddonStates[pkgId] = isActive;

      if (isActive) {
        box.classList.add('is-active');
        check.setAttribute('aria-checked', 'true');
        const total = basePrice + addonPrice;
        amountEl.textContent = total + ' TL';
        captionEl.textContent = 'Paket (₺' + basePrice + ') + Discord Duyurusu (+₺' + addonPrice + ')';
        ctaBtn.href = '/tickets/new?category=reklam&package=' + pkgId + '&withDiscord=true';
        ctaLabel.textContent = 'Paket + Discord Duyurusu ile Devam Et';
        updateMobileBar(pkgId + ' + Discord', total, ctaBtn.href);
      } else {
        box.classList.remove('is-active');
        check.setAttribute('aria-checked', 'false');
        amountEl.textContent = basePrice + ' TL';
        captionEl.textContent = 'Net başlangıç fiyatı';
        ctaBtn.href = '/tickets/new?category=reklam&package=' + pkgId;
        ctaLabel.textContent = 'Bu Paketi Konuşalım';
        updateMobileBar(pkgId, basePrice, ctaBtn.href);
      }
    }

    function updateMobileBar(name, total, href) {
      const label = document.getElementById('mobile-summary-label');
      const price = document.getElementById('mobile-summary-price');
      const cta = document.getElementById('mobile-sticky-cta');
      if (label && price && cta) {
        label.textContent = name;
        price.textContent = '₺' + total;
        cta.href = href;
      }
    }

    // 2. Custom Package Builder Mantığı
    function selectBuilderFormat(formatId, price, title) {
      builderState.formatId = formatId;
      builderState.formatPrice = price;
      builderState.formatTitle = title;

      // Card active states
      document.querySelectorAll('#kendi-paketini-olustur .cards-row-select .custom-choice-card').forEach(c => {
        if (c.id.startsWith('choice-fmt_')) c.classList.remove('is-selected');
      });
      const selectedEl = document.getElementById('choice-' + formatId);
      if (selectedEl) selectedEl.classList.add('is-selected');

      // Video pacing block visibility: sadece video formatlarında göster
      const pacingBlock = document.getElementById('block-video-pacing');
      const isVideo = formatId === 'fmt_video_standard' || formatId === 'fmt_video_midroll';
      if (pacingBlock) {
        pacingBlock.style.display = isVideo ? 'block' : 'none';
      }
      if (!isVideo) {
        builderState.pacingPrice = 0;
        builderState.pacingTitle = '';
      } else if (!builderState.pacingTitle) {
        builderState.pacingId = 'pacing_standard';
        builderState.pacingPrice = 0;
        builderState.pacingTitle = 'Standart Süre (20-30 sn)';
      }

      // Discord dinamik fiyatını format'a göre ayarla
      updateBuilderDiscordPrice();
      renderBuilderSummary();
    }

    function selectBuilderPacing(pacingId, price, title) {
      builderState.pacingId = pacingId;
      builderState.pacingPrice = price;
      builderState.pacingTitle = title;

      document.querySelectorAll('#block-video-pacing .custom-choice-card').forEach(c => {
        c.classList.remove('is-selected');
      });
      const selectedEl = document.getElementById('choice-' + pacingId);
      if (selectedEl) selectedEl.classList.add('is-selected');

      renderBuilderSummary();
    }

    function updateBuilderDiscordPrice() {
      const priceEl = document.getElementById('builder-discord-price');
      const subEl = document.getElementById('builder-discord-sub');
      if (!priceEl) return;

      let effectivePrice = 140;
      let note = 'Topluluk sunucusunda @everyone duyurusu';

      if (builderState.formatId === 'fmt_video_midroll') {
        effectivePrice = 80;
        note = 'Mid-Roll video avantajı: ₺60 indirimli (+₺80)';
      } else if (builderState.formatId === 'fmt_video_standard') {
        effectivePrice = 110;
        note = 'Standart video avantajı: ₺30 indirimli (+₺110)';
      }

      priceEl.textContent = '+ ₺' + effectivePrice;
      if (subEl) subEl.textContent = note;

      // Eğer seçiliyse Map'teki fiyatını da güncelle
      if (builderState.addons.has('addon_discord_announcement')) {
        builderState.addons.set('addon_discord_announcement', {
          price: effectivePrice,
          title: 'Discord Topluluk Duyurusu'
        });
      }
    }

    function toggleBuilderAddon(addonId, defaultPrice, title) {
      const itemEl = document.getElementById(
        addonId === 'addon_discord_announcement' ? 'builder-addon-discord' :
        addonId === 'addon_pinned_comment' ? 'builder-addon-pinned' :
        addonId === 'addon_desc_link' ? 'builder-addon-desc' :
        addonId === 'addon_community_post' ? 'builder-addon-community' :
        'builder-addon-giveaway'
      );

      if (builderState.addons.has(addonId)) {
        builderState.addons.delete(addonId);
        if (itemEl) itemEl.classList.remove('is-selected');
      } else {
        let price = defaultPrice;
        let finalTitle = title;
        if (addonId === 'addon_discord_announcement') {
          if (builderState.formatId === 'fmt_video_midroll') price = 80;
          else if (builderState.formatId === 'fmt_video_standard') price = 110;
          else price = 140;
          finalTitle = 'Discord Topluluk Duyurusu';
        }
        builderState.addons.set(addonId, { price, title: finalTitle });
        if (itemEl) itemEl.classList.add('is-selected');
      }

      renderBuilderSummary();
    }

    function renderBuilderSummary() {
      const listEl = document.getElementById('builder-items-list');
      const subtotalEl = document.getElementById('builder-subtotal');
      const discountRow = document.getElementById('builder-discount-row');
      const discountVal = document.getElementById('builder-discount-val');
      const discountLabel = document.getElementById('builder-discount-label');
      const totalEl = document.getElementById('builder-total');
      const submitBtn = document.getElementById('btn-submit-custom');

      const items = [];
      let subtotal = 0;

      // 1. Format
      if (builderState.formatPrice > 0) {
        items.push({ name: builderState.formatTitle, price: builderState.formatPrice });
        subtotal += builderState.formatPrice;
      }

      // 2. Pacing
      const isVideo = builderState.formatId === 'fmt_video_standard' || builderState.formatId === 'fmt_video_midroll';
      if (isVideo && builderState.pacingPrice > 0) {
        items.push({ name: builderState.pacingTitle, price: builderState.pacingPrice });
        subtotal += builderState.pacingPrice;
      }

      // 3. Addons
      for (const [id, item] of builderState.addons.entries()) {
        items.push({ name: item.title, price: item.price });
        subtotal += item.price;
      }

      // List HTML
      if (items.length === 0) {
        listEl.innerHTML = '<li class="empty-summary-hint">Lütfen sol panelden bir yayın formatı veya hizmet seçin.</li>';
        subtotalEl.textContent = '₺0';
        discountRow.style.display = 'none';
        totalEl.textContent = '₺0';
        submitBtn.disabled = true;
        return;
      }

      listEl.innerHTML = items.map(item => '<li><span>' + item.name + '</span><strong>₺' + item.price + '</strong></li>').join('');
      subtotalEl.textContent = '₺' + subtotal;

      // Akıllı paket indirimi (3 veya daha fazla parça seçimi)
      let discount = 0;
      if (items.length >= 4) {
        discount = Math.round(subtotal * 0.15);
        discountLabel.textContent = '4+ Hizmet Avantajı (%15)';
      } else if (items.length >= 3) {
        discount = Math.round(subtotal * 0.10);
        discountLabel.textContent = '3 Hizmet Avantajı (%10)';
      }

      if (discount > 0) {
        discountRow.style.display = 'flex';
        discountVal.textContent = '-₺' + discount;
      } else {
        discountRow.style.display = 'none';
      }

      const total = Math.max(0, subtotal - discount);
      totalEl.textContent = '₺' + total;
      submitBtn.disabled = false;

      updateMobileBar('Özel Paket (' + items.length + ' Hizmet)', total, '#kendi-paketini-olustur');
    }

    function submitCustomPackage() {
      const items = [];
      if (builderState.formatPrice > 0) items.push(builderState.formatTitle);
      const isVideo = builderState.formatId === 'fmt_video_standard' || builderState.formatId === 'fmt_video_midroll';
      if (isVideo && builderState.pacingPrice > 0) items.push(builderState.pacingTitle);
      for (const [id, item] of builderState.addons.entries()) items.push(item.title);

      const totalText = document.getElementById('builder-total').textContent.replace('₺', '').trim();
      const summaryParam = encodeURIComponent(items.join(' + ') + ' (Tahmini: ' + totalText + ' TL)');
      window.location.href = '/tickets/new?category=reklam&package=custom&summary=' + summaryParam + '&price=' + totalText;
    }

    // 3. EKOai Reklam Danışmanı Canlı Sohbet Mantığı
    const aiChatHistory = [];
    let isAiResponding = false;

    function toggleFloatingChat() {
      const win = document.getElementById('ekoai-chat-window');
      if (!win) return;
      if (win.style.display === 'none' || !win.style.display) {
        win.style.display = 'flex';
        const input = document.getElementById('ekoai-floating-input');
        if (input) setTimeout(() => input.focus(), 150);
      } else {
        win.style.display = 'none';
      }
    }

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function formatAiText(text) {
      var t = escapeHtml(text);
      var lines = t.split(String.fromCharCode(10));
      var processed = lines.map(function(line) {
        var boldParts = line.split('**');
        var bOut = '';
        for (var i = 0; i < boldParts.length; i++) {
          bOut += (i % 2 === 1) ? '<strong>' + boldParts[i] + '</strong>' : boldParts[i];
        }
        var italicParts = bOut.split('*');
        var iOut = '';
        for (var j = 0; j < italicParts.length; j++) {
          iOut += (j % 2 === 1) ? '<em>' + italicParts[j] + '</em>' : italicParts[j];
        }
        return iOut;
      });
      return processed.join('<br>');
    }

    async function sendQuestionToAI(question, source = 'inline') {
      if (!question || isAiResponding) return;
      isAiResponding = true;

      const inlineChat = document.getElementById('ekoai-inline-chat');
      const floatingChat = document.getElementById('ekoai-floating-chat-body');
      const inlineInput = document.getElementById('ekoai-inline-input');
      const floatingInput = document.getElementById('ekoai-floating-input');
      const inlineBtn = document.getElementById('ekoai-inline-btn');

      if (inlineInput) inlineInput.value = '';
      if (floatingInput) floatingInput.value = '';
      if (inlineBtn) inlineBtn.disabled = true;

      const userHtml = '<div class="ekoai-msg user">' +
        '<div class="ekoai-avatar">👤</div>' +
        '<div class="ekoai-bubble">' + escapeHtml(question) + '</div>' +
        '</div>';

      if (inlineChat) {
        inlineChat.insertAdjacentHTML('beforeend', userHtml);
        inlineChat.scrollTop = inlineChat.scrollHeight;
      }
      if (floatingChat) {
        floatingChat.insertAdjacentHTML('beforeend', userHtml);
        floatingChat.scrollTop = floatingChat.scrollHeight;
      }

      const typingId = 'typing-' + Date.now();
      const typingHtml = '<div class="ekoai-msg ai" id="' + typingId + '">' +
        '<div class="ekoai-avatar">🤖</div>' +
        '<div class="ekoai-bubble">' +
          '<span class="ekoai-typing-indicator">' +
            '<span>EKOai yazıyor</span>' +
            '<span class="typing-dot"></span>' +
            '<span class="typing-dot"></span>' +
            '<span class="typing-dot"></span>' +
          '</span>' +
        '</div>' +
        '</div>';

      if (inlineChat) {
        inlineChat.insertAdjacentHTML('beforeend', typingHtml);
        inlineChat.scrollTop = inlineChat.scrollHeight;
      }
      if (floatingChat) {
        floatingChat.insertAdjacentHTML('beforeend', typingHtml);
        floatingChat.scrollTop = floatingChat.scrollHeight;
      }

      try {
        const response = await fetch('/api/reklam/ekoai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question,
            history: aiChatHistory
          })
        });

        const data = await response.json();
        const answer = (data && data.success && data.answer) ? data.answer : (data && data.error ? data.error : 'Yanıt alınamadı.');

        aiChatHistory.push({ role: 'user', content: question });
        aiChatHistory.push({ role: 'assistant', content: answer });

        document.querySelectorAll('#' + typingId).forEach(el => el.remove());

        const aiHtml = '<div class="ekoai-msg ai">' +
          '<div class="ekoai-avatar">🤖</div>' +
          '<div class="ekoai-bubble">' + formatAiText(answer) + '</div>' +
          '</div>';

        if (inlineChat) {
          inlineChat.insertAdjacentHTML('beforeend', aiHtml);
          inlineChat.scrollTop = inlineChat.scrollHeight;
        }
        if (floatingChat) {
          floatingChat.insertAdjacentHTML('beforeend', aiHtml);
          floatingChat.scrollTop = floatingChat.scrollHeight;
        }
      } catch (err) {
        console.error('[EKOai Chat Error]:', err);
        document.querySelectorAll('#' + typingId).forEach(el => el.remove());
        const errorHtml = '<div class="ekoai-msg ai">' +
          '<div class="ekoai-avatar">🤖</div>' +
          '<div class="ekoai-bubble" style="color:#f87171;">' +
            'Bağlantı sırasında bir hata oluştu. Lütfen biraz sonra tekrar deneyin veya doğrudan reklam masası biletinizi açın.' +
          '</div>' +
          '</div>';

        if (inlineChat) inlineChat.insertAdjacentHTML('beforeend', errorHtml);
        if (floatingChat) floatingChat.insertAdjacentHTML('beforeend', errorHtml);
      } finally {
        isAiResponding = false;
        if (inlineBtn) inlineBtn.disabled = false;
      }
    }

    function askEkoAI(question) {
      const targetSec = document.getElementById('ekoai-danisman');
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      sendQuestionToAI(question, 'inline');
    }

    function handleInlineSubmit(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('ekoai-inline-input');
      if (input && input.value.trim()) {
        sendQuestionToAI(input.value.trim(), 'inline');
      }
    }

    function handleFloatingSubmit(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('ekoai-floating-input');
      if (input && input.value.trim()) {
        sendQuestionToAI(input.value.trim(), 'floating');
      }
    }

    function escalateToHumanStaff() {
      let summary = 'EkoAI asistanından canlı yetkiliye aktarım talebi.';
      if (aiChatHistory.length > 0) {
        const newlineChar = String.fromCharCode(10);
        const lastMsgs = aiChatHistory.slice(-4).map(function(m) {
          return (m.role === 'user' ? 'Kullanıcı: ' : 'EkoAI: ') + m.content;
        }).join(' ' + newlineChar);
        summary = 'EkoAI Görüşme Özeti:' + newlineChar + lastMsgs;
      }
      window.location.href = '/tickets/new?category=reklam&summary=' + encodeURIComponent(summary);
    }

    // 4. Ödeme Modalı ve Seçim Mantığı (Papara 0 TL vs İtemSatış +5 TL)
    let currentModalPkg = { id: 'midroll', title: 'Sesli Mid-Roll (Önerilen)', basePrice: 100 };
    let selectedPaymentMethod = 'papara';
    let isSubmittingPayment = false;

    function openPaymentModal(pkgId, pkgTitle, basePrice) {
      currentModalPkg = {
        id: pkgId || 'midroll',
        title: pkgTitle || 'Reklam Paketi',
        basePrice: Number(basePrice) || 100
      };

      const modal = document.getElementById('payment-modal');
      const titleEl = document.getElementById('modal-pkg-title');
      const itemNameEl = document.getElementById('modal-item-name');
      const noteEl = document.getElementById('modal-item-note');

      if (titleEl) titleEl.textContent = currentModalPkg.title + ' — Ödeme Seçimi';
      if (itemNameEl) itemNameEl.textContent = currentModalPkg.title;
      if (noteEl) noteEl.textContent = 'Resmî sipariş ve kampanya başlangıcı (' + currentModalPkg.basePrice + ' TL)';

      selectPaymentMethod('papara');

      if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    }

    function closePaymentModal() {
      const modal = document.getElementById('payment-modal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }

    function handleModalBackdropClick(e) {
      if (e.target && e.target.id === 'payment-modal') {
        closePaymentModal();
      }
    }

    function selectPaymentMethod(method) {
      selectedPaymentMethod = method === 'itemsatis' ? 'itemsatis' : 'papara';

      const cardPapara = document.getElementById('pay-card-papara');
      const cardItemsatis = document.getElementById('pay-card-itemsatis');
      const paparaBlock = document.getElementById('papara-details-block');
      const itemsatisBlock = document.getElementById('itemsatis-details-block');
      const bdFeeLabel = document.getElementById('bd-fee-label');
      const bdFeePrice = document.getElementById('bd-fee-price');
      const bdBasePrice = document.getElementById('bd-base-price');
      const bdTotalPrice = document.getElementById('bd-total-price');

      const base = currentModalPkg.basePrice;
      const fee = selectedPaymentMethod === 'itemsatis' ? 5 : 0;
      const total = base + fee;

      if (bdBasePrice) bdBasePrice.textContent = '₺' + base;
      if (bdTotalPrice) bdTotalPrice.textContent = '₺' + total;

      if (selectedPaymentMethod === 'papara') {
        if (cardPapara) {
          cardPapara.classList.add('is-selected');
          cardPapara.setAttribute('aria-checked', 'true');
        }
        if (cardItemsatis) {
          cardItemsatis.classList.remove('is-selected');
          cardItemsatis.setAttribute('aria-checked', 'false');
        }
        if (paparaBlock) paparaBlock.style.display = 'flex';
        if (itemsatisBlock) itemsatisBlock.style.display = 'none';
        if (bdFeeLabel) bdFeeLabel.textContent = 'İşlem Komisyonu (Papara)';
        if (bdFeePrice) {
          bdFeePrice.textContent = '0 TL';
          bdFeePrice.style.color = '#34d399';
        }
      } else {
        if (cardItemsatis) {
          cardItemsatis.classList.add('is-selected');
          cardItemsatis.setAttribute('aria-checked', 'true');
        }
        if (cardPapara) {
          cardPapara.classList.remove('is-selected');
          cardPapara.setAttribute('aria-checked', 'false');
        }
        if (itemsatisBlock) itemsatisBlock.style.display = 'flex';
        if (paparaBlock) paparaBlock.style.display = 'none';
        if (bdFeeLabel) bdFeeLabel.textContent = 'İtemSatış Platform İşlem Ücreti';
        if (bdFeePrice) {
          bdFeePrice.textContent = '+₺5';
          bdFeePrice.style.color = '#fbbf24';
        }
      }
    }

    function copyPaparaNumber() {
      const numEl = document.getElementById('papara-acc-number');
      const toast = document.getElementById('copy-feedback-toast');
      const btnText = document.getElementById('copy-btn-text');
      const text = numEl ? numEl.textContent.trim() : '1947291842';

      navigator.clipboard.writeText(text).then(() => {
        if (toast) {
          toast.style.display = 'block';
          setTimeout(() => { toast.style.display = 'none'; }, 2500);
        }
        if (btnText) {
          btnText.textContent = 'Kopyalandı!';
          setTimeout(() => { btnText.textContent = 'Kopyala'; }, 2000);
        }
      }).catch(() => {
        if (btnText) btnText.textContent = '1947291842';
      });
    }

    function processPaymentSelection() {
      if (isSubmittingPayment) return; // Çift tıklama / duplicate engelleme
      isSubmittingPayment = true;

      const btn = document.getElementById('btn-confirm-payment');
      const spinner = document.getElementById('confirm-spinner');
      const label = document.getElementById('confirm-btn-label');
      const proofInput = document.getElementById('payment-proof-ref');
      const proofVal = proofInput ? proofInput.value.trim() : '';

      if (btn) btn.disabled = true;
      if (spinner) spinner.style.display = 'inline-block';
      if (label) label.textContent = 'Ödeme hazırlanıyor...';

      const pkgId = currentModalPkg.id;
      const method = selectedPaymentMethod;
      const fee = method === 'itemsatis' ? 5 : 0;
      const total = currentModalPkg.basePrice + fee;

      setTimeout(() => {
        let targetUrl = '/tickets/new?category=reklam&package=' + encodeURIComponent(pkgId) +
          '&paymentMethod=' + encodeURIComponent(method) +
          '&totalAmount=' + encodeURIComponent(total);

        if (proofVal) {
          targetUrl += '&proof=' + encodeURIComponent(proofVal);
        }

        window.location.href = targetUrl;
      }, 650);
    }

    // Klavye desteği: ESC ile modal kapatma, Enter / Shift+Enter desteği
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closePaymentModal();
      }
    });

    const inlineChatInput = document.getElementById('ekoai-inline-input');
    if (inlineChatInput) {
      inlineChatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleInlineSubmit(e);
        }
      });
    }

    // İlk yüklemede builder summary başlat
    document.addEventListener('DOMContentLoaded', function() {
      // Başlangıçta Mid-Roll seçili olsun
      selectBuilderFormat('fmt_video_midroll', 100, 'Uzun Video Sesli Mid-Roll');
    });
  </script>
</body>
</html>`;
}

module.exports = { renderAdvertisingLandingPage, DISCORD_URL, YOUTUBE_URL };
