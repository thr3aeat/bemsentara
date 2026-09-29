'use strict';

const { _esc, _layout } = require('../views');

const REKLAM_PRESET_PACKAGES = [
  { id: 'shorts', name: 'Shorts & Hızlı Tanıtım', price: '30 TL', icon: '📱', desc: 'Dikey formatta hızlı ve dinamik marka görünürlüğü.' },
  { id: 'standart', name: 'Standart Video Sponsorluğu', price: '50 TL', icon: '🎬', desc: 'Kalıcı video alt bant, açıklama ve sabit yorum.' },
  { id: 'midroll', name: 'Sesli Mid-Roll (Önerilen)', price: '100 TL', icon: '🎙️', desc: 'Video akışına uyarlanan 20-30 saniyelik doğal sesli anlatım.', featured: true },
  { id: 'gold', name: 'Gold Kombin', price: '350 TL', icon: '🌟', desc: 'Uzun video, Shorts ve topluluk paylaşımı bir arada.' },
  { id: 'mega', name: 'Mega Etkileşim', price: '500 TL', icon: '🚀', desc: 'Video, Shorts, topluluk ve özel Discord duyurusu.' },
  { id: 'vip', name: 'Çekilişli VIP Kapsam', price: '670 TL', icon: '💎', desc: 'Mega paket ve topluluk odaklı özel çekiliş kurgusu.' },
  { id: 'allied', name: 'İttifak Orduları Başvurusu', price: 'Şartlı', icon: '🤝', desc: 'YGS/GS kampları için ücretli veya 5K+ kamplar için değerlendirme.' },
  { id: 'custom', name: 'Özel Bütçe & Proje', price: 'Teklif', icon: '💡', desc: 'Belirlediğiniz bütçe ve hedefe özel kampanya tasarımı.' }
];

const CATEGORY_LIST = [
  { key: 'reklam', label: '📢 Reklam / Sponsorluk & İş Birliği', badge: 'Öne Çıkan', desc: 'YouTube ve Discord topluluğunda büyüme ve sponsorluk.' },
  { key: 'ban', label: '🔨 Ban / Moderasyon İtirazı', desc: 'Haksız ceza veya susturma inceleme talepleri.' },
  { key: 'report', label: '🚨 Kullanıcı / Kural İhlali Şikayeti', desc: 'Sunucu kurallarını ihlal eden kişileri bildirin.' },
  { key: 'billing', label: '💳 Ödeme & İtemSatış Destek', desc: 'Siparişler, bakiye ve ödeme sorunları.' },
  { key: 'technical', label: '🔧 Teknik / Bot Sorunları', desc: 'EkoYıldız bot veya panel hataları.' },
  { key: 'account', label: '👤 Hesap & Roblox Eşleştirme', desc: 'Hesap doğrulama ve rol eşitleme işlemleri.' },
  { key: 'genel', label: '💬 Genel Destek', desc: 'Diğer tüm soru ve bilgi talepleriniz.' },
  { key: 'other', label: '📝 Diğer Konular', desc: 'Özel veya sınıflandırılmamış destek talepleri.' }
];

function renderCreateTicketPage(user, categories = [], initialQuery = {}) {
  const queryCat = (initialQuery.category || '').toLowerCase();
  const queryPkg = (initialQuery.package || '').toLowerCase();

  const userAvatar = user?.discordAvatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=64`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
  const userName = user?.discordUsername || user?.username || 'Kullanıcı';

  const categoryOptionsHtml = CATEGORY_LIST.map(c => {
    const isSelected = queryCat === c.key || (queryCat === '' && c.key === 'reklam');
    return `<option value="${c.key}" ${isSelected ? 'selected' : ''}>${c.label}</option>`;
  }).join('');

  const packageCardsHtml = REKLAM_PRESET_PACKAGES.map(p => {
    const isSelected = queryPkg === p.id || (queryPkg === '' && p.id === 'midroll');
    return `
      <div class="pkg-card ${isSelected ? 'active' : ''} ${p.featured ? 'featured' : ''}" onclick="selectPackage('${p.id}', '${p.name}', '${p.price}')" data-pkg-id="${p.id}">
        <div class="pkg-header">
          <span class="pkg-icon">${p.icon}</span>
          <span class="pkg-price">${p.price}</span>
        </div>
        <div class="pkg-title">${p.name}</div>
        <div class="pkg-desc">${p.desc}</div>
      </div>
    `;
  }).join('');

  const content = `
    <style>
      :root {
        --tc-primary: #8b5cf6;
        --tc-primary-hover: #7c3aed;
        --tc-accent: #ec4899;
        --tc-gold: #f59e0b;
        --tc-card-bg: rgba(18, 20, 29, 0.75);
        --tc-border: rgba(255, 255, 255, 0.08);
        --tc-border-active: rgba(139, 92, 246, 0.5);
      }
      .ticket-container {
        max-width: 960px;
        margin: 2rem auto;
        padding: 0 1rem;
      }
      .ticket-hero {
        text-align: center;
        margin-bottom: 2.2rem;
      }
      .ticket-hero h1 {
        font-size: clamp(2rem, 4vw, 2.75rem);
        font-weight: 900;
        letter-spacing: -0.04em;
        margin: 0 0 0.5rem 0;
        background: linear-gradient(135deg, #fff 30%, #c4b5fd 70%, #f472b6 100%);
        -webkit-background-clip: text;
        color: transparent;
      }
      .ticket-hero p {
        color: var(--muted);
        font-size: 1.05rem;
        max-width: 620px;
        margin: 0 auto;
        line-height: 1.6;
      }

      /* Main Form Card */
      .ticket-box {
        background: var(--tc-card-bg);
        border: 1px solid var(--tc-border);
        border-radius: 28px;
        padding: clamp(1.5rem, 3.5vw, 2.5rem);
        box-shadow: 0 24px 60px -15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }

      /* User identity bar */
      .ticket-user-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        margin-bottom: 2rem;
      }
      .ticket-user-left {
        display: flex;
        align-items: center;
        gap: 0.85rem;
      }
      .ticket-user-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 2px solid rgba(139, 92, 246, 0.4);
        object-fit: cover;
      }
      .ticket-user-meta strong {
        display: block;
        color: #fff;
        font-size: 0.95rem;
      }
      .ticket-user-meta span {
        font-size: 0.8rem;
        color: var(--muted);
      }
      .ticket-badge-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.78rem;
        font-weight: 700;
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        background: rgba(16, 185, 129, 0.12);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.25);
      }

      /* Form inputs */
      .form-group {
        margin-bottom: 1.5rem;
      }
      .form-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #e2e8f0;
        font-size: 0.9rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      .form-label span.req {
        color: #f43f5e;
      }
      .form-control, .form-select {
        width: 100%;
        background: rgba(10, 12, 18, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 0.85rem 1.1rem;
        color: #fff;
        font-size: 0.95rem;
        font-family: inherit;
        transition: all 0.2s ease;
        outline: none;
      }
      .form-control:focus, .form-select:focus {
        border-color: var(--tc-primary);
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25);
        background: rgba(15, 18, 27, 0.85);
      }

      /* Reklam Package Grid */
      .pkg-section {
        background: rgba(139, 92, 246, 0.04);
        border: 1px solid rgba(139, 92, 246, 0.18);
        border-radius: 20px;
        padding: 1.5rem;
        margin-bottom: 1.8rem;
      }
      .pkg-section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .pkg-section-head h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 800;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .pkg-section-head a {
        color: #c4b5fd;
        font-size: 0.82rem;
        text-decoration: none;
        font-weight: 700;
      }
      .pkg-section-head a:hover {
        text-decoration: underline;
      }
      .pkg-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.75rem;
      }
      .pkg-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.22s ease;
        user-select: none;
        position: relative;
      }
      .pkg-card:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(139, 92, 246, 0.4);
        transform: translateY(-2px);
      }
      .pkg-card.active {
        background: rgba(139, 92, 246, 0.14);
        border-color: #8b5cf6;
        box-shadow: 0 0 16px rgba(139, 92, 246, 0.25);
      }
      .pkg-card.featured::after {
        content: "Popüler";
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 0.65rem;
        font-weight: 800;
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.15);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 999px;
        padding: 2px 6px;
      }
      .pkg-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .pkg-icon {
        font-size: 1.3rem;
      }
      .pkg-price {
        font-size: 1.05rem;
        font-weight: 800;
        color: #fff;
      }
      .pkg-title {
        font-weight: 750;
        font-size: 0.88rem;
        color: #e2e8f0;
        margin-bottom: 0.3rem;
        line-height: 1.3;
      }
      .pkg-desc {
        font-size: 0.74rem;
        color: var(--muted);
        line-height: 1.4;
      }

      /* Proof & Case study alert badge */
      .growth-hint-box {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.9rem 1.1rem;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(139, 92, 246, 0.08));
        border: 1px solid rgba(52, 211, 153, 0.25);
        color: #e2e8f0;
        font-size: 0.85rem;
        margin-bottom: 1.5rem;
      }
      .growth-hint-box span.badge {
        background: #10b981;
        color: #064e3b;
        font-weight: 800;
        font-size: 0.72rem;
        padding: 2px 8px;
        border-radius: 6px;
        white-space: nowrap;
      }

      /* Two column row */
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      @media(max-width: 640px) {
        .form-row { grid-template-columns: 1fr; }
        .pkg-grid { grid-template-columns: 1fr 1fr; }
      }

      /* Actions & Feedback */
      .ticket-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .btn-submit {
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: #fff;
        font-weight: 800;
        font-size: 1rem;
        padding: 0.85rem 2rem;
        border-radius: 14px;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        transition: all 0.25s ease;
        box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.4);
      }
      .btn-submit:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 14px 30px -5px rgba(139, 92, 246, 0.6);
        background: linear-gradient(135deg, #9061f9, #4f46e5);
      }
      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-ghost-cancel {
        color: var(--muted);
        text-decoration: none;
        font-weight: 700;
        font-size: 0.92rem;
        padding: 0.85rem 1.4rem;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.2s ease;
      }
      .btn-ghost-cancel:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.04);
      }

      /* Alert message */
      .status-alert {
        padding: 1.1rem;
        border-radius: 14px;
        margin-top: 1.25rem;
        font-size: 0.92rem;
        line-height: 1.5;
        display: none;
      }
      .status-alert.error {
        background: rgba(244, 63, 94, 0.12);
        border: 1px solid rgba(244, 63, 94, 0.35);
        color: #fca5a5;
      }
      .status-alert.success {
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: #6ee7b7;
      }

      /* Ticket Payment Method Cards */
      .ticket-pay-group {
        margin-top: 1.25rem;
      }
      .ticket-pay-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #e2e8f0;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ticket-pay-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      @media (max-width: 520px) {
        .ticket-pay-cards { grid-template-columns: 1fr; }
      }
      .ticket-pay-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 12px;
        padding: 0.85rem 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
      }
      .ticket-pay-card:hover {
        border-color: rgba(139, 92, 246, 0.4);
        background: rgba(255, 255, 255, 0.05);
      }
      .ticket-pay-card.active {
        border-color: #8b5cf6;
        background: rgba(139, 92, 246, 0.12);
        box-shadow: 0 0 14px rgba(139, 92, 246, 0.2);
      }
      .ticket-pay-card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .ticket-pay-card-title {
        font-weight: 700;
        font-size: 0.9rem;
        color: #fff;
      }
      .ticket-pay-badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 999px;
      }
      .ticket-pay-badge.zero {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.35);
      }
      .ticket-pay-badge.fee {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.35);
      }
      .ticket-pay-desc {
        font-size: 0.76rem;
        color: var(--muted);
        line-height: 1.4;
      }

      /* EkoAI Ticket Assistant Button & Box */
      .btn-ekoai-assist {
        background: rgba(139, 92, 246, 0.12);
        border: 1px solid rgba(139, 92, 246, 0.35);
        color: #c4b5fd;
        font-size: 0.8rem;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .btn-ekoai-assist:hover {
        background: rgba(139, 92, 246, 0.22);
        color: #fff;
        border-color: #8b5cf6;
      }
      .ekoai-assist-box {
        background: rgba(15, 18, 28, 0.95);
        border: 1px solid rgba(139, 92, 246, 0.35);
        border-radius: 14px;
        padding: 1rem 1.25rem;
        margin-bottom: 1rem;
        display: none;
        animation: fadeIn 0.2s ease;
      }
      .ekoai-assist-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .ekoai-assist-title {
        font-size: 0.86rem;
        font-weight: 700;
        color: #c4b5fd;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ekoai-assist-text {
        font-size: 0.85rem;
        color: #cbd5e1;
        line-height: 1.55;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        padding: 10px 12px;
        white-space: pre-wrap;
      }
      .btn-apply-suggestion {
        background: #8b5cf6;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 5px 12px;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        margin-top: 8px;
        transition: all 0.2s ease;
      }
      .btn-apply-suggestion:hover {
        background: #7c3aed;
      }
    </style>

    <div class="ticket-container">
      <div class="ticket-hero">
        <h1 id="hero-title">🎫 Yeni Destek & Reklam Talebi</h1>
        <p id="hero-sub">EkoYıldız destek ve sponsorluk ekibi tüm biletleri doğrudan Discord üzerindeki özel kanalınızda yanıtlar.</p>
      </div>

      <div class="ticket-box">
        <!-- Identity bar -->
        <div class="ticket-user-bar">
          <div class="ticket-user-left">
            <img src="${userAvatar}" alt="${_esc(userName)}" class="ticket-user-avatar">
            <div class="ticket-user-meta">
              <strong>${_esc(userName)}</strong>
              <span>Discord Hesabı Bağlı · Doğrulanmış Kullanıcı</span>
            </div>
          </div>
          <div class="ticket-badge-pill">
            <span>●</span> Discord Entegrasyonu Aktif
          </div>
        </div>

        <!-- Form fields -->
        <form id="create-ticket-form" onsubmit="handleTicketFormSubmit(event)">
          <!-- Kategori -->
          <div class="form-group">
            <label class="form-label" for="ticket-category">
              <span>Bilet Kategorisi <span class="req">*</span></span>
              <small id="cat-hint" style="color:var(--muted);font-weight:400;">Kategoriye göre özel form alanları açılır</small>
            </label>
            <select id="ticket-category" class="form-select" onchange="onCategoryChanged()">
              ${categoryOptionsHtml}
            </select>
          </div>

          <!-- REKLAM SPECIFIC SECTION -->
          <div id="reklam-fields" class="pkg-section" style="display:none;">
            <div class="pkg-section-head">
              <h3><span>📢</span> Reklam & Sponsorluk Paketi Seçin</h3>
              <a href="/reklam/ekoyildiz-ortaklik" target="_blank">Şeffaf Fiyat ve Kurumsal Rehberi Aç ↗</a>
            </div>

            <div class="growth-hint-box">
              <span class="badge">🚀 KANITLANMIŞ YÜKSELİŞ</span>
              <span>İMPREİUS FAMİLY (+830 üye, dk/45 mesaj), Asker Oyunu (ayda 10-15 sipariş) ve TTA (15'ten 65 aktifliğe) gibi önceki partnerlerimizle gerçek büyüme sağladık.</span>
            </div>

            <div class="pkg-grid">
              ${packageCardsHtml}
            </div>

            <div class="form-row" style="margin-top:1.25rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="rek-community">
                  <span>Topluluk / Kamp / Proje Adı <span class="req">*</span></span>
                </label>
                <input type="text" id="rek-community" class="form-control" placeholder="Örn: Imperius Family / İttifak Ordusu / Map Grubu" maxlength="100">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="rek-link">
                  <span>Tanıtım / Davet / Oyun Bağlantısı <span class="req">*</span></span>
                </label>
                <input type="url" id="rek-link" class="form-control" placeholder="https://discord.gg/... veya Roblox bağlantısı" maxlength="200">
              </div>
            </div>

            <div class="form-row" style="margin-top:1rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="rek-budget">
                  <span>Bütçe Aralığı veya Tercih</span>
                </label>
                <input type="text" id="rek-budget" class="form-control" placeholder="Örn: 100 - 350 TL arası / Robux" maxlength="80">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="rek-goal">
                  <span>Birincil Hedefiniz</span>
                </label>
                <input type="text" id="rek-goal" class="form-control" placeholder="Örn: Üye büyümesi, video içi sponsor, sipariş artışı" maxlength="100">
              </div>
            </div>

            <!-- Reklam Ödeme Tercihi (Papara 0 TL vs İtemSatış +5 TL) -->
            <div class="ticket-pay-group">
              <div class="ticket-pay-title">
                <span>💳 Tercih Ettiğiniz Ödeme Yöntemi</span>
                <small style="color:var(--muted);font-weight:normal;">(Bilet içinde doğrudan netleştirilir)</small>
              </div>
              <div class="ticket-pay-cards">
                <div class="ticket-pay-card active" id="ticket-pay-papara" onclick="selectTicketPayment('papara')">
                  <div class="ticket-pay-card-head">
                    <span class="ticket-pay-card-title">Papara</span>
                    <span class="ticket-pay-badge zero">0 TL Komisyon</span>
                  </div>
                  <div class="ticket-pay-desc">Papara numarasına doğrudan ödeme. Ek işlem ücreti alınmaz.</div>
                </div>
                <div class="ticket-pay-card" id="ticket-pay-itemsatis" onclick="selectTicketPayment('itemsatis')">
                  <div class="ticket-pay-card-head">
                    <span class="ticket-pay-card-title">İtemSatış</span>
                    <span class="ticket-pay-badge fee">+5 TL İşlem Ücreti</span>
                  </div>
                  <div class="ticket-pay-desc">Ödeme İtemSatış üzerinden gerçekleştirilebilir. Şeffaf komisyon eklenir.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Konu Başlığı -->
          <div class="form-group">
            <label class="form-label" for="ticket-subject">
              <span>Konu Başlığı <span class="req">*</span></span>
              <small style="color:var(--muted);font-weight:400;"><span id="subject-count">0</span>/100</small>
            </label>
            <input type="text" id="ticket-subject" class="form-control" placeholder="Destek talebinizi özetleyen kısa bir başlık" maxlength="100" required>
          </div>

          <!-- Açıklama / Mesaj & EkoAI Ticket Asistanı -->
          <div class="form-group">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
              <label class="form-label" for="ticket-description" style="margin-bottom:0;">
                <span id="desc-label-text">Talebiniz / Mesajınız <span class="req">*</span></span>
              </label>
              <button type="button" class="btn-ekoai-assist" id="btn-ekoai-help" onclick="requestEkoAITicketHelp()">
                <span>🤖 EkoAI'dan Yardım Al</span>
              </button>
            </div>

            <!-- EkoAI Suggestion Box -->
            <div id="ekoai-assist-box" class="ekoai-assist-box">
              <div class="ekoai-assist-head">
                <span class="ekoai-assist-title">🤖 EkoAI Önerisi &amp; Özeti</span>
                <button type="button" onclick="closeEkoAIAssist()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem;" aria-label="Kapat">✕</button>
              </div>
              <div id="ekoai-assist-content" class="ekoai-assist-text">EkoAI talebinizi inceliyor ve en uygun taslağı hazırlıyor...</div>
              <button type="button" class="btn-apply-suggestion" onclick="applyEkoAISuggestion()">✓ Bu Metni Açıklamaya Uygula</button>
            </div>

            <textarea id="ticket-description" class="form-control" rows="6" placeholder="Lütfen detayları ayrıntılı olarak anlatın..." maxlength="2000" required style="resize:vertical;"></textarea>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
              <small style="color:var(--muted);font-size:0.75rem;">Açık ve net ifadeler destek sürecini hızlandırır.</small>
              <small style="color:var(--muted);font-size:0.75rem;"><span id="desc-count">0</span>/2000</small>
            </div>
          </div>

          <!-- Durum ve Hata Bildirimi -->
          <div id="ticket-alert" class="status-alert" role="alert"></div>

          <!-- Form Düğmeleri -->
          <div class="ticket-actions">
            <a href="/tickets" class="btn-ghost-cancel">Vazgeç</a>
            <button type="submit" id="btn-submit-ticket" class="btn-submit">
              <span id="submit-icon">📨</span>
              <span id="submit-text">Talebi Gönder & Kanal Aç</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <script>
      let selectedPackageId = '${queryPkg || 'midroll'}';
      let selectedPackageName = 'Sesli Mid-Roll (Önerilen)';
      let selectedPackagePrice = '100 TL';
      let selectedTicketPayment = 'papara';
      let isSubmittingTicket = false;
      let lastAIGeneratedText = '';

      function selectTicketPayment(method) {
        selectedTicketPayment = method === 'itemsatis' ? 'itemsatis' : 'papara';
        const cardP = document.getElementById('ticket-pay-papara');
        const cardI = document.getElementById('ticket-pay-itemsatis');
        if (cardP && cardI) {
          if (selectedTicketPayment === 'papara') {
            cardP.classList.add('active');
            cardI.classList.remove('active');
          } else {
            cardI.classList.add('active');
            cardP.classList.remove('active');
          }
        }
      }

      async function requestEkoAITicketHelp() {
        const box = document.getElementById('ekoai-assist-box');
        const content = document.getElementById('ekoai-assist-content');
        const cat = document.getElementById('ticket-category').value;
        const subj = document.getElementById('ticket-subject').value.trim();
        const desc = document.getElementById('ticket-description').value.trim();
        const com = document.getElementById('rek-community') ? document.getElementById('rek-community').value.trim() : '';
        const link = document.getElementById('rek-link') ? document.getElementById('rek-link').value.trim() : '';

        if (box) box.style.display = 'block';
        if (content) content.textContent = 'EkoAI talebinizi inceliyor ve en uygun taslağı hazırlıyor...';

        const promptSummary = 'Kategori: ' + cat +
          (cat === 'reklam' ? (' | Paket: ' + selectedPackageName + ' | Topluluk: ' + com + ' | Link: ' + link + ' | Ödeme: ' + selectedTicketPayment) : '') +
          (subj ? (' | Konu: ' + subj) : '') +
          (desc ? (' | Kullanıcı Notu: ' + desc) : '');

        try {
          const res = await fetch('/api/reklam/ekoai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: 'Kullanıcının açmak istediği destek bileti için net ve özet bir kampanya/destek mesajı taslağı oluştur: ' + promptSummary
            })
          });
          const data = await res.json();
          if (data && data.success && data.answer) {
            lastAIGeneratedText = data.answer.replace(/<[^>]*>?/gm, '');
            if (content) content.textContent = lastAIGeneratedText;
          } else {
            fallbackEkoAITemplate();
          }
        } catch (e) {
          fallbackEkoAITemplate();
        }
      }

      function fallbackEkoAITemplate() {
        const cat = document.getElementById('ticket-category').value;
        const content = document.getElementById('ekoai-assist-content');
        let text = '';
        if (cat === 'reklam') {
          text = 'Merhaba EkoYıldız Ekibi,\n' +
            'Belirttiğim topluluk için ' + selectedPackageName + ' paketiniz kapsamında sponsorluk görüşmesi yapmak istiyorum. ' +
            'Ödememi ' + (selectedTicketPayment === 'papara' ? 'Papara (0 TL komisyon)' : 'İtemSatış (+5 TL işlem ücreti)') + ' yöntemiyle tamamlamayı planlıyorum. ' +
            'Yayın takvimi ve detaylar için kanal onayınızı rica ederim.';
        } else {
          text = 'Merhaba Destek Ekibi,\n' +
            'Konuyla ilgili detaylı bilgi ve yardım talep ediyorum. İnceleyip dönüş yapabilirseniz sevinirim.';
        }
        lastAIGeneratedText = text;
        if (content) content.textContent = text;
      }

      function closeEkoAIAssist() {
        const box = document.getElementById('ekoai-assist-box');
        if (box) box.style.display = 'none';
      }

      function applyEkoAISuggestion() {
        if (!lastAIGeneratedText) return;
        const descEl = document.getElementById('ticket-description');
        if (descEl) {
          descEl.value = lastAIGeneratedText;
          updateCharCount(descEl, 'desc-count');
        }
        closeEkoAIAssist();
      }

      function selectPackage(id, name, price) {
        selectedPackageId = id;
        selectedPackageName = name;
        selectedPackagePrice = price;

        document.querySelectorAll('.pkg-card').forEach(el => {
          if (el.getAttribute('data-pkg-id') === id) {
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        });

        const subjectEl = document.getElementById('ticket-subject');
        if (document.getElementById('ticket-category').value === 'reklam') {
          subjectEl.value = 'Reklam Başvurusu · ' + name + ' (' + price + ')';
          updateCharCount(subjectEl, 'subject-count');
        }
      }

      function updateCharCount(el, counterId) {
        const cntEl = document.getElementById(counterId);
        if (cntEl && el) cntEl.textContent = el.value.length;
      }

      function onCategoryChanged() {
        const cat = document.getElementById('ticket-category').value;
        const reklamFields = document.getElementById('reklam-fields');
        const subjectEl = document.getElementById('ticket-subject');
        const descLabel = document.getElementById('desc-label-text');
        const descEl = document.getElementById('ticket-description');
        const heroTitle = document.getElementById('hero-title');

        if (cat === 'reklam') {
          reklamFields.style.display = 'block';
          heroTitle.textContent = '📢 Reklam & Sponsorluk Talebi Oluştur';
          descLabel.innerHTML = 'Kampanya Notları & Ek Talepler <span class="req">*</span>';
          descEl.placeholder = 'Özel vurgulanmasını istediğiniz mesaj, çekiliş şartları veya yayın tarihi tercihiniz...';
          if (!subjectEl.value || subjectEl.value.startsWith('Reklam Başvurusu') || subjectEl.value.startsWith('Web destek talebi')) {
            subjectEl.value = 'Reklam Başvurusu · ' + selectedPackageName + ' (' + selectedPackagePrice + ')';
          }
        } else {
          reklamFields.style.display = 'none';
          heroTitle.textContent = '🎫 Yeni Destek Bileti Oluştur';
          descLabel.innerHTML = 'Talebiniz / Mesajınız <span class="req">*</span>';
          descEl.placeholder = 'Lütfen yaşadığınız durumu veya talebinizi detaylı olarak açıklayın...';
          if (subjectEl.value.startsWith('Reklam Başvurusu')) {
            subjectEl.value = '';
          }
        }
        updateCharCount(subjectEl, 'subject-count');
      }

      document.getElementById('ticket-subject').addEventListener('input', function() {
        updateCharCount(this, 'subject-count');
      });
      document.getElementById('ticket-description').addEventListener('input', function() {
        updateCharCount(this, 'desc-count');
      });

      // Initialize on load with query params
      document.addEventListener('DOMContentLoaded', function() {
        const params = new URLSearchParams(window.location.search);
        const catParam = params.get('category');
        if (catParam) {
          const catSelect = document.getElementById('ticket-category');
          if (catSelect) {
            catSelect.value = catParam.toLowerCase();
          }
        }

        const pkgParam = params.get('package');
        const withDiscordParam = params.get('withDiscord') === 'true';
        const summaryParam = params.get('summary');
        const priceParam = params.get('price');
        const payParam = params.get('paymentMethod');

        if (payParam) {
          selectTicketPayment(payParam);
        }

        if (pkgParam) {
          const card = document.querySelector('[data-pkg-id="' + pkgParam + '"]');
          if (card) card.click();
        }

        onCategoryChanged();

        const subjectEl = document.getElementById('ticket-subject');
        const descEl = document.getElementById('ticket-description');
        const budgetEl = document.getElementById('rek-budget');

        if (pkgParam === 'custom' && summaryParam) {
          const decodedSummary = decodeURIComponent(summaryParam);
          if (subjectEl) subjectEl.value = 'Özel Reklam Paketi · ' + decodedSummary;
          if (descEl && !descEl.value) {
            descEl.value = 'Seçilen Özel Paket Bileşenleri:\n• ' + decodedSummary.replace(/ \+ /g, '\n• ');
          }
          if (budgetEl && priceParam) {
            budgetEl.value = priceParam + ' TL (Tahmini Paket Tutarı)';
          }
        } else if (summaryParam && descEl && !descEl.value) {
          descEl.value = decodeURIComponent(summaryParam);
        } else if (withDiscordParam && subjectEl && subjectEl.value) {
          if (!subjectEl.value.includes('Discord')) {
            subjectEl.value = subjectEl.value.replace(/\)$/, ' + Discord Duyurusu)');
          }
          if (descEl && !descEl.value) {
            descEl.value = 'Seçilen Ek Hizmet: EkoYıldız Discord Topluluk Duyurusu dahil.';
          }
        }
        updateCharCount(subjectEl, 'subject-count');
      });

      async function handleTicketFormSubmit(e) {
        e.preventDefault();
        if (isSubmittingTicket) return; // Çift tıklama engelleme

        const alertEl = document.getElementById('ticket-alert');
        const submitBtn = document.getElementById('btn-submit-ticket');
        const submitText = document.getElementById('submit-text');
        const submitIcon = document.getElementById('submit-icon');

        alertEl.style.display = 'none';
        alertEl.className = 'status-alert';

        const category = document.getElementById('ticket-category').value;
        const subject = document.getElementById('ticket-subject').value.trim();
        const baseDescription = document.getElementById('ticket-description').value.trim();

        if (!category) {
          showAlert('Lütfen bir kategori seçin.', 'error');
          return;
        }
        if (!subject) {
          showAlert('Lütfen bir konu başlığı girin.', 'error');
          return;
        }

        let fullDescription = baseDescription;

        // If reklam category, format structured description
        if (category === 'reklam') {
          const community = document.getElementById('rek-community').value.trim();
          const link = document.getElementById('rek-link').value.trim();
          const budget = document.getElementById('rek-budget').value.trim();
          const goal = document.getElementById('rek-goal').value.trim();

          if (!community) {
            showAlert('Lütfen topluluk / proje adınızı girin.', 'error');
            document.getElementById('rek-community').focus();
            return;
          }
          if (!link) {
            showAlert('Lütfen tanıtılacak sunucu veya oyun bağlantısını girin.', 'error');
            document.getElementById('rek-link').focus();
            return;
          }
          if (!baseDescription) {
            showAlert('Lütfen kampanya notlarınızı veya açıklamanızı yazın.', 'error');
            document.getElementById('ticket-description').focus();
            return;
          }

          fullDescription = 
            '📋 REKLAM & SPONSORLUK DETAYLARI\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '• Seçilen Paket: ' + selectedPackageName + ' (' + selectedPackagePrice + ')\n' +
            '• Ödeme Yöntemi Tercihi: ' + (selectedTicketPayment === 'papara' ? 'Papara (0 TL Komisyon, Doğrudan Ödeme)' : 'İtemSatış (+5 TL Platform Hizmet Bedeli)') + '\n' +
            '• Topluluk / Proje: ' + community + '\n' +
            '• Tanıtım Bağlantısı: ' + link + '\n' +
            (budget ? ('• Bütçe Tercihi: ' + budget + '\n') : '') +
            (goal ? ('• Kampanya Hedefi: ' + goal + '\n') : '') +
            '\n📝 KAMPANYA NOTLARI / AÇIKLAMA:\n' +
            baseDescription;
        } else {
          if (!baseDescription) {
            showAlert('Lütfen açıklama kısmını doldurun.', 'error');
            return;
          }
        }

        isSubmittingTicket = true;
        submitBtn.disabled = true;
        submitIcon.textContent = '⏳';
        submitText.textContent = 'Bilet oluşturuluyor & kanal açılıyor...';

        try {
          const res = await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category,
              subject,
              description: fullDescription,
              priority: category === 'reklam' ? 'medium' : 'normal'
            })
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            const ticketId = data.ticket?.ticketId || data.ticketId || '';
            const isQueued = data.deliveryStatus === 'queued';
            const msg = isQueued
              ? 'Talebiniz kaydedildi! #' + ticketId + ' (Discord kanalı sıraya alındı, ekibimiz birazdan kanalı açacaktır).'
              : 'Harika! Biletiniz başarıyla oluşturuldu #' + ticketId + '. Discord sunucumuzda size özel kanalınız açıldı.';

            showAlert(msg, 'success');
            submitIcon.textContent = '✅';
            submitText.textContent = 'Yönlendiriliyorsunuz...';

            setTimeout(() => {
              window.location.href = '/tickets';
            }, 1800);
          } else {
            isSubmittingTicket = false;
            showAlert(data.error || 'Bilet oluşturulurken bir hata meydana geldi.', 'error');
            submitBtn.disabled = false;
            submitIcon.textContent = '📨';
            submitText.textContent = 'Talebi Gönder & Kanal Aç';
          }
        } catch (err) {
          isSubmittingTicket = false;
          showAlert('Bağlantı hatası oluştu. Lütfen internetinizi kontrol edip tekrar deneyin.', 'error');
          submitBtn.disabled = false;
          submitIcon.textContent = '📨';
          submitText.textContent = 'Talebi Gönder & Kanal Aç';
        }
      }

      function showAlert(msg, type) {
        const alertEl = document.getElementById('ticket-alert');
        alertEl.textContent = msg;
        alertEl.className = 'status-alert ' + type;
        alertEl.style.display = 'block';
        alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    </script>
  `;

  return _layout('Yeni Destek & Reklam Talebi', user, content, '', '/tickets/new');
}

module.exports = {
  renderCreateTicketPage,
  REKLAM_PRESET_PACKAGES,
  CATEGORY_LIST
};
