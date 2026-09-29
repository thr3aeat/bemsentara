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
      .mobile-sticky-bar { display: block; }
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
