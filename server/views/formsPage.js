'use strict';

const sponsorAdService = require('../services/sponsorAdService');
const {
  renderPlatformHeader,
  renderPlatformFooter,
  renderSearchDialog,
  platformChromeStyles,
  platformChromeScript,
} = require('./platformChrome');
const { FORM_CATALOG, getFields } = require('../forms/catalog');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const formsStyles = `
  :root {
    --f-bg: #06060e;
    --f-surface: rgba(255, 255, 255, 0.035);
    --f-surface-hover: rgba(255, 255, 255, 0.06);
    --f-border: rgba(255, 255, 255, 0.08);
    --f-border-hover: rgba(167, 139, 250, 0.35);
    --f-text: #f5f5f7;
    --f-muted: #9494a8;
    --f-accent: #a78bfa;
    --f-accent2: #818cf8;
    --f-pink: #ed5b7b;
    --f-success: #34d399;
    --f-warning: #fbbf24;
    --f-danger: #fb7185;
    --f-glass-blur: 24px;
    --f-shadow: 0 16px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
  }

  * { box-sizing: border-box; }
  body.forms-page {
    margin: 0;
    background: var(--f-bg);
    color: var(--f-text);
    font-family: 'Outfit', Inter, -apple-system, sans-serif;
    min-height: 100vh;
  }
  .forms-page a { color: inherit; text-decoration: none; }
  
  .forms-shell {
    width: min(1140px, calc(100% - 36px));
    margin: 0 auto;
    padding: 36px 0 60px;
    animation: formsFadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes formsFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Hero Section ── */
  .forms-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 32px;
    align-items: end;
    padding: 44px 36px;
    margin-bottom: 36px;
    background: linear-gradient(135deg, rgba(26, 26, 38, 0.7) 0%, rgba(13, 13, 22, 0.8) 100%);
    border: 1px solid var(--f-border);
    border-radius: 24px;
    box-shadow: var(--f-shadow);
    backdrop-filter: blur(var(--f-glass-blur));
    -webkit-backdrop-filter: blur(var(--f-glass-blur));
    position: relative;
    overflow: hidden;
  }
  .forms-hero::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 380px;
    height: 380px;
    background: radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .forms-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--f-accent);
    font-size: 0.74rem;
    letter-spacing: 0.12em;
    font-weight: 800;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .forms-title {
    margin: 8px 0 12px;
    font-size: clamp(2.4rem, 4.5vw, 3.8rem);
    line-height: 1.05;
    letter-spacing: -0.04em;
    font-weight: 800;
    color: #fff;
  }
  .forms-lede {
    max-width: 620px;
    margin: 0;
    color: var(--f-muted);
    font-size: 1.02rem;
    line-height: 1.6;
  }
  .forms-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    justify-content: flex-end;
  }
  .forms-pill-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 99px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--f-muted);
    backdrop-filter: blur(8px);
  }

  /* ── Sections & List ── */
  .forms-section {
    margin-bottom: 40px;
  }
  .forms-section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
    padding-left: 4px;
  }
  .forms-section-kicker {
    display: block;
    color: var(--f-accent);
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    font-weight: 800;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .forms-section-head h2 {
    margin: 0;
    font-size: 1.55rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #fff;
  }
  .forms-section-head p {
    margin: 0;
    color: var(--f-muted);
    font-size: 0.9rem;
    max-width: 480px;
  }

  .forms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
  .form-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px;
    background: var(--f-surface);
    border: 1px solid var(--f-border);
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
    backdrop-filter: blur(var(--f-glass-blur));
    -webkit-backdrop-filter: blur(var(--f-glass-blur));
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .form-card:hover {
    transform: translateY(-2.5px);
    border-color: var(--f-border-hover);
    box-shadow: 0 16px 44px -8px rgba(0,0,0,0.4), 0 0 24px rgba(167, 139, 250, 0.15);
  }
  .form-card:active {
    transform: scale(0.985);
  }
  .form-card--maintenance {
    opacity: 0.75;
    cursor: not-allowed;
  }
  .form-card--maintenance:hover {
    transform: none;
    border-color: var(--f-border);
    box-shadow: none;
  }
  .form-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .form-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(167, 139, 250, 0.12);
    border: 1px solid rgba(167, 139, 250, 0.25);
    color: var(--f-accent);
    display: grid;
    place-items: center;
    font-size: 1.15rem;
    font-weight: 700;
  }
  .form-badge-open {
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    background: rgba(52, 211, 153, 0.15);
    color: var(--f-success);
    border: 1px solid rgba(52, 211, 153, 0.25);
  }
  .form-badge-maint {
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    background: rgba(251, 191, 36, 0.15);
    color: var(--f-warning);
    border: 1px solid rgba(251, 191, 36, 0.25);
  }
  .form-card-title {
    margin: 0 0 8px;
    font-size: 1.18rem;
    font-weight: 750;
    color: #fff;
    letter-spacing: -0.02em;
  }
  .form-card-desc {
    margin: 0 0 20px;
    color: var(--f-muted);
    font-size: 0.88rem;
    line-height: 1.5;
  }
  .form-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.85rem;
  }
  .form-time-est {
    color: var(--f-muted);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .form-action-link {
    color: var(--f-accent);
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: transform 0.15s ease;
  }
  .form-card:hover .form-action-link {
    transform: translateX(3px);
    color: #fff;
  }

  /* ── Form Detail Page ── */
  .form-detail {
    width: min(840px, 100%);
    margin: 0 auto;
  }
  .form-detail-head {
    padding: 24px 0 28px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--f-border);
  }
  .form-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--f-border);
    color: var(--f-muted);
    font-size: 0.84rem;
    font-weight: 600;
    margin-bottom: 20px;
    transition: all 0.18s ease;
  }
  .form-back-btn:hover {
    background: rgba(255,255,255,0.08);
    color: #fff;
    transform: translateX(-2px);
  }
  .form-detail-title {
    margin: 10px 0;
    font-size: clamp(2rem, 4.5vw, 3.2rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1.08;
    color: #fff;
  }
  .form-detail-summary {
    color: var(--f-muted);
    font-size: 1.05rem;
    line-height: 1.6;
    margin: 0 0 18px;
  }
  .form-progress-wrap {
    background: rgba(255,255,255,0.05);
    height: 6px;
    border-radius: 99px;
    overflow: hidden;
    margin: 16px 0 8px;
  }
  .form-progress-bar {
    height: 100%;
    width: 25%;
    background: linear-gradient(90deg, var(--f-accent), var(--f-pink));
    border-radius: 99px;
    transition: width 0.3s ease;
  }

  /* ── Form Inputs & Card Sections ── */
  .form-section-card {
    background: var(--f-surface);
    border: 1px solid var(--f-border);
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
    backdrop-filter: blur(var(--f-glass-blur));
  }
  .form-section-card h2 {
    margin: 0 0 20px;
    font-size: 1.25rem;
    font-weight: 750;
    letter-spacing: -0.02em;
    color: #fff;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .field { margin-top: 20px; }
  .field:first-of-type { margin-top: 0; }
  .field label {
    display: block;
    margin-bottom: 6px;
    color: #cbd5e1;
    font-size: 0.92rem;
    font-weight: 650;
  }
  .field-required { color: var(--f-pink); font-weight: 800; }
  .field-description {
    display: block;
    margin-bottom: 8px;
    color: var(--f-muted);
    font-size: 0.82rem;
    line-height: 1.45;
  }
  .field input, .field textarea, .field select {
    display: block;
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(10, 10, 18, 0.6);
    color: #fff;
    font-family: inherit;
    font-size: 0.95rem;
    padding: 13px 16px;
    outline: none;
    transition: all 0.18s ease;
    backdrop-filter: blur(8px);
  }
  .field textarea { min-height: 120px; resize: vertical; line-height: 1.5; }
  .field select option { background: #12121a; color: #fff; }
  .field input:focus, .field textarea:focus, .field select:focus,
  .field input:focus-visible, .field textarea:focus-visible, .field select:focus-visible,
  .forms-submit-btn:focus-visible {
    border-color: var(--f-accent);
    background: rgba(14, 14, 24, 0.85);
    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.18), 0 0 20px rgba(167, 139, 250, 0.1);
  }
  .field [aria-invalid="true"] { border-color: var(--f-danger) !important; }
  .field-error {
    min-height: 18px;
    margin: 6px 0 0;
    color: var(--f-danger);
    font-size: 0.82rem;
    font-weight: 600;
  }
  .form-detail, .forms-hero, .form-card {
    overflow-wrap:anywhere;
  }

  .forms-submit-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 24px 28px;
    background: var(--f-surface);
    border: 1px solid var(--f-border);
    border-radius: 20px;
    box-shadow: var(--f-shadow);
    margin-top: 12px;
  }
  .forms-submit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
    color: #fff;
    font-size: 0.98rem;
    font-weight: 750;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(124, 58, 237, 0.35);
    transition: transform 0.14s cubic-bezier(0.2, 0.8, 0.4, 1), box-shadow 0.18s ease;
    user-select: none;
  }
  .forms-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 26px rgba(124, 58, 237, 0.45);
  }
  .forms-submit-btn:active {
    transform: scale(0.975);
  }
  .forms-submit-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  /* ── Success State ── */
  .form-success-card {
    text-align: center;
    padding: 48px 32px;
    background: linear-gradient(135deg, rgba(20, 32, 28, 0.85) 0%, rgba(12, 20, 18, 0.95) 100%);
    border: 1px solid rgba(52, 211, 153, 0.3);
    border-radius: 24px;
    box-shadow: 0 20px 50px -10px rgba(0,0,0,0.6);
    backdrop-filter: blur(24px);
    margin: 36px 0;
  }
  .form-success-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(52, 211, 153, 0.2);
    color: var(--f-success);
    font-size: 1.8rem;
    display: grid;
    place-items: center;
    margin: 0 auto 20px;
    box-shadow: 0 0 30px rgba(52, 211, 153, 0.3);
  }
  .form-success-card h2 {
    font-size: 2rem;
    font-weight: 800;
    color: #fff;
    margin: 0 0 10px;
  }
  .form-success-card p {
    color: var(--f-muted);
    font-size: 1rem;
    max-width: 520px;
    margin: 0 auto 24px;
    line-height: 1.6;
  }
  .form-id-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    font-family: monospace;
    font-size: 0.95rem;
    color: #fff;
  }

  @media(max-width:760px) {
    .forms-hero { grid-template-columns: 1fr; padding: 28px 20px; }
    .forms-meta { justify-content: flex-start; }
    .forms-submit-card { flex-direction: column; align-items: stretch; }
    .forms-submit-btn { width: 100%; }
  }
`;

function renderIcon(definition) {
  const icons = { staff: '🛡️', other: '📝' };
  return `<span class="form-card-icon" aria-hidden="true">${icons[definition.section] || '📝'}</span>`;
}

function renderCard(definition) {
  const icon = renderIcon(definition);
  if (definition.status === 'maintenance') {
    return `
      <div class="form-card form-card--maintenance">
        <div>
          <div class="form-card-top">
            ${icon}
            <span class="form-badge-maint">Bakımda</span>
          </div>
          <h3 class="form-card-title">${escapeHtml(definition.title)}</h3>
          <p class="form-card-desc">${escapeHtml(definition.description)}</p>
        </div>
        <div class="form-card-bottom">
          <span class="form-time-est">🕒 Geçici olarak kapalı</span>
          <span style="color:var(--f-muted);font-weight:600;">Kapalı</span>
        </div>
      </div>
    `;
  }

  return `
    <a class="form-card" href="${escapeHtml(definition.route)}">
      <div>
        <div class="form-card-top">
          ${icon}
          <span class="form-badge-open">Açık</span>
        </div>
        <h3 class="form-card-title">${escapeHtml(definition.title)}</h3>
        <p class="form-card-desc">${escapeHtml(definition.description)}</p>
      </div>
      <div class="form-card-bottom">
        <span class="form-time-est">⏱️ ~${definition.estimatedMinutes} dakika</span>
        <span class="form-action-link">Forma Git →</span>
      </div>
    </a>
  `;
}

function renderSection(section, title, description) {
  const forms = FORM_CATALOG.filter((d) => d.section === section);
  return `
    <section class="forms-section">
      <div class="forms-section-head">
        <div>
          <span class="forms-section-kicker">${section === 'staff' ? 'Yetkili & Kadro' : 'Topluluk & Destek'}</span>
          <h2>${title}</h2>
        </div>
        <p>${description}</p>
      </div>
      <div class="forms-grid">
        ${forms.map(renderCard).join('')}
      </div>
    </section>
  `;
}

function renderFormsDocument({ user, activePath, title, body }) {
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} — EkoYıldız</title>
  <meta name="theme-color" content="#06060e">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  ${platformChromeStyles('dark')}
  <style>${formsStyles}</style>
</head>
<body class="forms-page">
  ${renderPlatformHeader({ user, activePath, theme: 'dark' })}
  <main class="forms-shell">
    ${body}
    ${sponsorAdService.renderSponsorAdHtml()}
  </main>
  ${renderPlatformFooter({ theme: 'dark' })}
  ${renderSearchDialog({ theme: 'dark' })}
  ${platformChromeScript()}
</body>
</html>`;
}

function renderFormsHubPage(user) {
  const openCount = FORM_CATALOG.filter((d) => d.status === 'open').length;
  const body = `
    <section class="forms-hero">
      <div>
        <span class="forms-eyebrow">✨ EkoYıldız Başvuru & Talep Merkezi</span>
        <h1 class="forms-title">Formlar</h1>
        <p class="forms-lede">EkoYıldız kadrosuna katılmak, yetkili başvurusu yapmak veya özel taleplerini güvenli şekilde iletmek için ilgili formu seç.</p>
      </div>
      <div class="forms-meta" aria-label="Forms bilgileri">
        <span class="forms-pill-tag">🟢 ${openCount} Aktif Başvuru</span>
        <span class="forms-pill-tag">🔒 Uçtan Uca İnceleme</span>
        <span class="forms-pill-tag">⚡ Hızlı Değerlendirme</span>
      </div>
    </section>

    ${renderSection('staff', 'Yetkili Alımları & Kadro', 'Sunucu ve topluluk yönetiminde aktif rol almak isteyenler için başvuru formları.')}
    ${renderSection('other', 'Diğer Formlar & Destek', 'İçerik üreticiliği, reklam, sponsorluk ve genel taleplerinizi doğrudan ekibimize ulaştırın.')}
  `;
  return renderFormsDocument({ user, activePath: '/forms', title: 'Formlar', body });
}

function renderField(definitionField) {
  const id = `field-${definitionField.name}`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const required = definitionField.required ? '<span class="field-required" aria-hidden="true">*</span>' : '';
  const description = definitionField.description ? `<span id="${helpId}" class="field-description">${escapeHtml(definitionField.description)}</span>` : '';
  const describedBy = [definitionField.description ? helpId : '', errorId].filter(Boolean).join(' ');
  const attributes = `id="${id}" name="${escapeHtml(definitionField.name)}" aria-describedby="${describedBy}" aria-invalid="false"${definitionField.required ? ' required' : ''}${definitionField.maxLength ? ` maxlength="${definitionField.maxLength}"` : ''}`;

  let control;
  if (definitionField.type === 'textarea') {
    control = `<textarea ${attributes} placeholder="${escapeHtml(definitionField.placeholder)}"></textarea>`;
  } else if (definitionField.type === 'select') {
    control = `<select ${attributes}><option value="">Seçim yapınız…</option>${definitionField.options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select>`;
  } else {
    control = `<input ${attributes} type="${definitionField.type === 'url' ? 'url' : 'text'}" placeholder="${escapeHtml(definitionField.placeholder)}">`;
  }

  return `
    <div class="field">
      <label for="${id}">${escapeHtml(definitionField.label)} ${required}</label>
      ${description}
      ${control}
      <p id="${errorId}" class="field-error" aria-live="polite"></p>
    </div>
  `;
}

function renderFormPage(user, definition, existingSubmission) {
  const sections = definition.sections || [];
  const fields = getFields(definition);
  const sectionMarkup = sections.map((section, index) => `
    <section class="form-section-card" data-form-section="${index + 1}">
      <h2>${escapeHtml(section.title)}</h2>
      ${section.fields.map(renderField).join('')}
    </section>
  `).join('');

  const existingNotice = existingSubmission ? `
    <div style="padding:16px 20px;border-radius:14px;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);color:#fde68a;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:1.4rem;">⏳</span>
      <div>
        <strong style="display:block;margin-bottom:2px;">Bekleyen Başvuru Bulundu</strong>
        <span style="font-size:0.88rem;opacity:0.9;">Bu form için şu anda incelenmekte olan bir başvurunuz mevcut. Sonuçlanana kadar mükerrer başvuru gönderemezsiniz.</span>
      </div>
    </div>
  ` : '';

  const body = `
    <article class="form-detail">
      <header class="form-detail-head">
        <a class="form-back-btn" href="/forms">← Tüm Formlara Dön</a>
        <div>
          <span class="forms-eyebrow">📂 ${escapeHtml(definition.category)}</span>
          <h1 class="form-detail-title">${escapeHtml(definition.title)}</h1>
          <p class="form-detail-summary">${escapeHtml(definition.description)}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <span class="forms-pill-tag">⏱️ Yaklaşık ${definition.estimatedMinutes} dakika</span>
          <span class="forms-pill-tag">🛡️ Gizli & Güvenli İnceleme</span>
        </div>
      </header>

      ${existingNotice}

      <form class="forms-form" data-forms-form data-form-slug="${escapeHtml(definition.slug)}" novalidate>
        ${sectionMarkup}
        
        <div class="forms-submit-card">
          <p style="margin:0;color:var(--f-muted);font-size:0.88rem;line-height:1.5;">
            Gönderdiğiniz bilgiler doğrudan yetkili kurulu tarafından incelenir ve KVKK ilkeleri uyarınca korunur.
          </p>
          <button class="forms-submit-btn" type="submit"${existingSubmission ? ' disabled' : ''}>
            <span>🚀 Başvuruyu Gönder</span>
          </button>
        </div>
        <div data-form-live aria-live="polite" style="margin-top:12px;text-align:right;color:var(--f-accent);font-weight:600;font-size:0.9rem;"></div>
      </form>
    </article>
    <script>${renderFormScript(fields)}</script>
  `;

  return renderFormsDocument({ user, activePath: '/forms', title: definition.title, body });
}

function renderFormScript(fields) {
  const schema = JSON.stringify(fields.map((item) => ({ name: item.name, required: item.required, type: item.type })));
  return `(function(){
    const form = document.querySelector('[data-forms-form]');
    if (!form) return;
    const fields = ${schema};
    const live = form.querySelector('[data-form-live]');
    const submitBtn = form.querySelector('button[type="submit"]');

    const setError = (input, message) => {
      const error = document.getElementById(input.id + '-error');
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (error) error.textContent = message || '';
    };

    // Dinamik input odak ve hata temizleme
    form.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', () => {
        if (el.getAttribute('aria-invalid') === 'true') {
          setError(el, '');
        }
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      let first = null;
      let valid = true;

      for (const spec of fields) {
        const input = form.elements.namedItem(spec.name);
        if (!input) continue;
        const value = String(input.value || '').trim();
        const message = spec.required && !value ? 'Bu alanı doldurmanız gerekiyor.' : '';
        setError(input, message);
        if (message) {
          valid = false;
          first = first || input;
        }
      }

      if (!valid) {
        if (first) first.focus();
        if (live) live.textContent = 'Lütfen işaretli zorunlu alanları kontrol ediniz.';
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳ Gönderiliyor…</span>';
      }
      if (live) live.textContent = 'Başvurunuz şifrelenip iletiliyor…';

      const payload = Object.fromEntries(new FormData(form).entries());

      try {
        const response = await fetch('/api/forms/' + form.dataset.formSlug + '/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw data;

        const subId = String(data.submissionId || '—');
        form.innerHTML = \`
          <section class="form-success-card">
            <div class="form-success-icon">✓</div>
            <h2>Başvurunuz Başarıyla Alındı!</h2>
            <p>Bilgileriniz ilgili yönetim kuruluna ulaştırıldı. Süreç hakkında sistem üzerinden bilgilendirileceksiniz.</p>
            <div style="margin-bottom: 24px;">
              <div class="form-id-badge">
                <span>Takip No:</span>
                <strong style="color:var(--f-accent);">\${subId}</strong>
                <button type="button" onclick="navigator.clipboard.writeText('\${subId}');this.textContent='Kopyalandı';" style="background:none;border:none;color:var(--f-muted);cursor:pointer;font-size:0.8rem;text-decoration:underline;">Kopyala</button>
              </div>
            </div>
            <div>
              <a href="/forms" class="forms-submit-btn" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);box-shadow:none;">
                ← Formlar Listesine Dön
              </a>
            </div>
          </section>
        \`;
      } catch (error) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>🚀 Başvuruyu Gönder</span>';
        }
        if (live) live.textContent = (error && error.error) ? error.error : 'Bağlantı kurulamadı. Lütfen tekrar deneyiniz.';
      }
    });
  })();`;
}

function renderClosedFormPage(user, definition) {
  const body = `
    <article class="form-detail">
      <header class="form-detail-head">
        <a class="form-back-btn" href="/forms">← Tüm Formlara Dön</a>
        <div>
          <span class="forms-eyebrow">📂 ${escapeHtml(definition.category)}</span>
          <h1 class="form-detail-title">${escapeHtml(definition.title)}</h1>
          <p class="form-detail-summary">Bu form şu anda geçici olarak yeni başvuru alımına kapatılmıştır.</p>
        </div>
      </header>
      <section class="form-success-card" style="border-color:rgba(251,191,36,0.3);background:linear-gradient(135deg,rgba(30,24,15,0.85) 0%,rgba(18,14,10,0.95) 100%);">
        <div class="form-success-icon" style="background:rgba(251,191,36,0.2);color:var(--f-warning);box-shadow:0 0 30px rgba(251,191,36,0.25);">⏳</div>
        <h2>Başvurular geçici olarak kapalı</h2>
        <p>Yönetim ekibi bu form için kontenjanları doldurduğundan veya bakım çalışması yapıldığından alımlar durdurulmuştur. Yeniden açıldığında duyurulacaktır.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="forms-submit-btn" disabled style="opacity:0.5;cursor:not-allowed;">
            <span>🚫 Başvuru Kapalı (Bakım)</span>
          </button>
          <a href="/forms" class="forms-submit-btn" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);box-shadow:none;">
            ← Açık Formları İncele
          </a>
        </div>
      </section>
    </article>
  `;
  return renderFormsDocument({ user, activePath: '/forms', title: definition.title, body });
}

module.exports = {
  renderFormsHubPage,
  renderFormPage,
  renderClosedFormPage,
};
