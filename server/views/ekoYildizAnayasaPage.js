'use strict';

function renderEkoYildizAnayasaPage(user) {
  const content = `
    <style>
      .mevzuat-wrapper {
        max-width: 1260px;
        margin: 0 auto;
        padding: 1.5rem 1rem 6rem;
        color: #e2e8f0;
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* Resmî Gazete / Mevzuat Anteti */
      .resmi-header {
        background: linear-gradient(180deg, rgba(20, 20, 38, 0.96) 0%, rgba(10, 10, 22, 0.98) 100%);
        border: 1px solid rgba(167, 139, 250, 0.28);
        border-top: 5px solid #a78bfa;
        border-radius: 20px;
        padding: 2.75rem 2rem 2.25rem;
        margin-bottom: 2rem;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(167, 139, 250, 0.1);
        position: relative;
        text-align: center;
        overflow: hidden;
      }
      .resmi-header::after {
        content: 'RESMÎ MEVZUAT';
        position: absolute;
        bottom: 5px;
        right: 25px;
        font-size: 5rem;
        font-weight: 900;
        color: rgba(255, 255, 255, 0.018);
        letter-spacing: 0.12em;
        pointer-events: none;
        user-select: none;
      }
      .resmi-emblem {
        font-size: 2.6rem;
        margin-bottom: 0.5rem;
        display: inline-block;
        filter: drop-shadow(0 4px 12px rgba(167, 139, 250, 0.6));
        animation: emblemFloat 4s ease-in-out infinite alternate;
      }
      @keyframes emblemFloat {
        0% { transform: translateY(0); }
        100% { transform: translateY(-4px); }
      }
      .resmi-state-title {
        font-size: 0.92rem;
        font-weight: 800;
        color: #c4b5fd;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        margin-bottom: 0.4rem;
      }
      .resmi-portal-title {
        font-size: 2.35rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -0.02em;
        margin: 0 0 0.85rem 0;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }
      .resmi-portal-subtitle {
        font-size: 0.98rem;
        color: #94a3b8;
        max-width: 820px;
        margin: 0 auto 1.5rem;
        line-height: 1.6;
      }
      .resmi-metadata-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        background: rgba(0, 0, 0, 0.42);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 1.1rem 1.4rem;
        max-width: 980px;
        margin: 0 auto;
        text-align: left;
      }
      .meta-item {
        font-size: 0.88rem;
      }
      .meta-label {
        color: #94a3b8;
        font-size: 0.74rem;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.06em;
        margin-bottom: 3px;
      }
      .meta-value {
        color: #f8fafc;
        font-weight: 700;
      }

      /* Legal Action Banner (Hukuki Talep Masası Kısayolu) */
      .legal-action-banner {
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%);
        border: 1px solid rgba(167, 139, 250, 0.35);
        border-radius: 16px;
        padding: 1.25rem 1.75rem;
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1.2rem;
        backdrop-filter: blur(12px);
      }
      .legal-action-text h4 {
        margin: 0 0 0.35rem 0;
        font-size: 1.1rem;
        font-weight: 800;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .legal-action-text p {
        margin: 0;
        font-size: 0.88rem;
        color: #cbd5e1;
        line-height: 1.5;
      }
      .legal-action-btn {
        background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
        color: #ffffff;
        font-weight: 700;
        font-size: 0.92rem;
        padding: 0.75rem 1.4rem;
        border-radius: 12px;
        text-decoration: none;
        box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      }
      .legal-action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(139, 92, 246, 0.6);
        color: #ffffff;
      }

      /* Kategori Seçim Butonları (Pills) */
      .category-tabs-container {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 6px;
        margin-bottom: 1.5rem;
        scrollbar-width: none;
      }
      .category-tabs-container::-webkit-scrollbar {
        display: none;
      }
      .category-pill {
        padding: 9px 18px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #94a3b8;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .category-pill:hover {
        background: rgba(255, 255, 255, 0.09);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.25);
      }
      .category-pill.active {
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%);
        border-color: #a78bfa;
        color: #ffffff;
        box-shadow: 0 4px 15px rgba(167, 139, 250, 0.25);
      }
      .category-pill .pill-badge {
        background: rgba(255, 255, 255, 0.12);
        padding: 2px 7px;
        border-radius: 8px;
        font-size: 0.72rem;
      }

      /* Sticky Arama ve Navigasyon Barı */
      .mevzuat-nav {
        position: sticky;
        top: 5.6rem;
        z-index: 95;
        background: rgba(8, 8, 20, 0.94);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(167, 139, 250, 0.25);
        border-radius: 16px;
        padding: 0.9rem 1.4rem;
        margin-bottom: 2rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 12px 35px rgba(0,0,0,0.65), 0 0 15px rgba(167, 139, 250, 0.1);
      }
      .search-container {
        flex: 1;
        min-width: 270px;
        position: relative;
      }
      .search-container input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 12px;
        padding: 11px 40px 11px 40px;
        color: #ffffff;
        font-family: inherit;
        font-size: 0.94rem;
        transition: all 0.2s ease;
      }
      .search-container input:focus {
        outline: none;
        border-color: #a78bfa;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.28);
      }
      .search-icon-fixed {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        font-size: 1.05rem;
        pointer-events: none;
      }
      .search-clear-btn {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #94a3b8;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.8rem;
        transition: background 0.2s;
      }
      .search-clear-btn:hover {
        background: rgba(239, 68, 68, 0.4);
        color: #fff;
      }
      .nav-controls-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .jump-select select {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 12px;
        padding: 11px 16px;
        color: #f1f5f9;
        font-family: inherit;
        font-size: 0.92rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .jump-select select:focus {
        outline: none;
        border-color: #a78bfa;
        background: rgba(20, 20, 38, 0.95);
      }
      .jump-select select option {
        background: #0f1020;
        color: #e2e8f0;
      }
      .btn-print {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #cbd5e1;
        padding: 11px 15px;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .btn-print:hover {
        background: rgba(167, 139, 250, 0.2);
        border-color: #a78bfa;
        color: #ffffff;
      }

      /* Canlı Arama Sonuç Durum Rozeti */
      .search-results-info {
        font-size: 0.85rem;
        color: #94a3b8;
        padding: 0 0.5rem;
        display: none;
        width: 100%;
        margin-top: -0.25rem;
      }
      .search-results-info b {
        color: #a78bfa;
      }

      /* Başlangıç (Preamble) Kutusu */
      .preamble-card {
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%);
        border: 1px solid rgba(167, 139, 250, 0.25);
        border-left: 5px solid #a78bfa;
        border-radius: 0 16px 16px 0;
        padding: 1.85rem 2.2rem;
        margin-bottom: 2.25rem;
        font-style: italic;
        line-height: 1.95;
        color: #cbd5e1;
        font-size: 1.03rem;
        box-shadow: 0 6px 25px rgba(0,0,0,0.25);
        position: relative;
      }
      .preamble-title {
        font-style: normal;
        font-weight: 800;
        font-size: 1.18rem;
        color: #c4b5fd;
        margin-bottom: 0.75rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Bölüm & Madde Kartları */
      .kanun-bolum {
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        padding: 2.25rem 2rem;
        margin-bottom: 2.25rem;
        scroll-margin-top: 165px;
        box-shadow: 0 6px 28px rgba(0,0,0,0.3);
        transition: border-color 0.2s ease;
      }
      .kanun-bolum:hover {
        border-color: rgba(167, 139, 250, 0.25);
      }
      .bolum-head {
        border-bottom: 2px solid rgba(255, 255, 255, 0.09);
        padding-bottom: 1.35rem;
        margin-bottom: 1.85rem;
      }
      .bolum-no {
        font-size: 0.82rem;
        font-weight: 800;
        color: #a78bfa;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .bolum-baslik {
        font-size: 1.55rem;
        font-weight: 800;
        color: #ffffff;
        margin: 0;
        line-height: 1.3;
      }
      .bolum-aciklama {
        font-size: 0.95rem;
        color: #94a3b8;
        margin-top: 6px;
        margin-bottom: 0;
      }

      .kanun-madde {
        background: rgba(255, 255, 255, 0.025);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 14px;
        padding: 1.45rem 1.75rem;
        margin-bottom: 1.35rem;
        scroll-margin-top: 165px;
        transition: all 0.22s ease;
        position: relative;
      }
      .kanun-madde:last-child {
        margin-bottom: 0;
      }
      .kanun-madde:hover {
        border-color: rgba(167, 139, 250, 0.35);
        background: rgba(255, 255, 255, 0.04);
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      }
      .madde-head-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .madde-baslik-etiketi {
        font-size: 1.15rem;
        font-weight: 700;
        color: #f8fafc;
      }
      .madde-paylas-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #cbd5e1;
        border-radius: 8px;
        padding: 5px 12px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .madde-paylas-btn:hover {
        background: rgba(167, 139, 250, 0.2);
        border-color: #a78bfa;
        color: #fff;
      }
      .madde-metin {
        font-size: 0.98rem;
        line-height: 1.85;
        color: #cbd5e1;
      }
      .madde-metin p {
        margin: 0 0 0.85rem 0;
      }
      .madde-metin p:last-child {
        margin-bottom: 0;
      }
      .fıkra-no {
        background: rgba(167, 139, 250, 0.15);
        color: #c4b5fd;
        font-size: 0.8rem;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 6px;
        margin-right: 6px;
        display: inline-block;
      }

      .badge-resmi {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .badge-emredici {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.4);
      }
      .badge-tanim {
        background: rgba(167, 139, 250, 0.2);
        color: #d8b4fe;
        border: 1px solid rgba(167, 139, 250, 0.4);
      }
      .badge-guvence {
        background: rgba(52, 211, 153, 0.2);
        color: #6ee7b7;
        border: 1px solid rgba(52, 211, 153, 0.4);
      }
      .badge-kvkk {
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
        border: 1px solid rgba(59, 130, 246, 0.4);
      }

      /* Boş Sonuç Kutusu */
      .empty-search-state {
        background: rgba(255, 255, 255, 0.02);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        padding: 3.5rem 2rem;
        text-align: center;
        display: none;
        margin: 2rem 0;
      }
      .empty-search-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.6;
      }
      .empty-search-text {
        font-size: 1.15rem;
        font-weight: 700;
        color: #cbd5e1;
        margin-bottom: 0.5rem;
      }
      .empty-search-sub {
        color: #94a3b8;
        font-size: 0.92rem;
        max-width: 550px;
        margin: 0 auto 1.5rem;
      }
      .empty-search-btn {
        background: rgba(167, 139, 250, 0.2);
        border: 1px solid #a78bfa;
        color: #fff;
        padding: 8px 18px;
        border-radius: 10px;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
      }

      /* Sayfa İçi Toast Bildirim */
      .anayasa-toast {
        position: fixed;
        bottom: 25px;
        right: 25px;
        background: #0f1020;
        border: 1px solid #a78bfa;
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.92rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
      }
      .anayasa-toast.show {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      /* Başa Dön Yüzen Düğmesi */
      .btn-scroll-top {
        position: fixed;
        bottom: 25px;
        left: 25px;
        background: rgba(20, 20, 38, 0.92);
        border: 1px solid rgba(167, 139, 250, 0.4);
        color: #ffffff;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        cursor: pointer;
        z-index: 90;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.25s ease;
        box-shadow: 0 6px 20px rgba(0,0,0,0.5);
      }
      .btn-scroll-top.visible {
        opacity: 1;
        transform: scale(1);
      }
      .btn-scroll-top:hover {
        background: #a78bfa;
        color: #000;
      }

      .hidden-item {
        display: none !important;
      }

      @media (max-width: 768px) {
        .mevzuat-wrapper {
          padding: 1rem 0.5rem 5rem;
        }
        .resmi-header {
          padding: 1.75rem 1.25rem 1.5rem;
        }
        .resmi-portal-title {
          font-size: 1.75rem;
        }
        .mevzuat-nav {
          top: 4.8rem;
          padding: 0.75rem 1rem;
        }
        .search-container {
          min-width: 100%;
        }
      }
    </style>

    <div class="mevzuat-wrapper">
      <!-- RESMÎ BAŞLIK & METADATA -->
      <header class="resmi-header">
        <div class="resmi-emblem">🇹🇷 ⭐ ⚖️</div>
        <div class="resmi-state-title">EkoYıldız Dijital Topluluk Federasyonu</div>
        <h1 class="resmi-portal-title">Hukuk, Politika ve Resmî Mevzuat Portalı</h1>
        <p class="resmi-portal-subtitle">
          EkoYıldız bünyesindeki Discord sunucuları, internet sitesi, Roblox deneyimleri ve tüm dijital servislerin anayasası, kullanım şartları, KVKK aydınlatma metni ve yaptırım mevzuatı işbu resmî merkezde toplanmıştır.
        </p>
        
        <div class="resmi-metadata-grid">
          <div class="meta-item">
            <div class="meta-label">Mevzuat Kodu</div>
            <div class="meta-value">EKO-MEVZ-2026/V3.5</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Resmî Sürüm</div>
            <div class="meta-value">18 Eylül 2026 Resmî Gazete</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Kapsam</div>
            <div class="meta-value">Tüm Topluluk & Servisler</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Yetkili Merci</div>
            <div class="meta-value">Hukuk & Yönetim Masası</div>
          </div>
        </div>
      </header>

      <!-- Resmî Hukuki Talep Masası Kısayolu -->
      <div class="legal-action-banner">
        <div class="legal-action-text">
          <h4>⚖️ Resmî Hukuki Başvuru ve KVKK Talep Masası</h4>
          <p>Kişisel veri silme (KVKK Md. 11), disiplin/ban kararı itirazı, telif (DMCA) veya sözleşme istisnası başvurularınızı resmi dilekçe statüsünde doğrudan yönetim masasına iletebilirsiniz.</p>
        </div>
        <a href="/settings#tab-legal" class="legal-action-btn">
          <span>📜 Resmî Dilekçe Gönder</span>
          <span>→</span>
        </a>
      </div>

      <!-- Kategori Filtreleme Sekmeleri (Interactive Switcher) -->
      <div class="category-tabs-container">
        <button class="category-pill active" onclick="filtreleKategori('all', this)">
          <span>🌐 Tüm Mevzuat</span>
          <span class="pill-badge">38 Madde</span>
        </button>
        <button class="category-pill" onclick="filtreleKategori('anayasa', this)">
          <span>📜 Topluluk Anayasası</span>
          <span class="pill-badge">Anayasa</span>
        </button>
        <button class="category-pill" onclick="filtreleKategori('tos', this)">
          <span>⚖️ Kullanım Şartları (ToS)</span>
          <span class="pill-badge">Sözleşme</span>
        </button>
        <button class="category-pill" onclick="filtreleKategori('privacy', this)">
          <span>🔒 Gizlilik & KVKK</span>
          <span class="pill-badge">Aydınlatma</span>
        </button>
        <button class="category-pill" onclick="filtreleKategori('cookies', this)">
          <span>🍪 Çerezler & Güvenlik</span>
          <span class="pill-badge">Teknik</span>
        </button>
        <button class="category-pill" onclick="filtreleKategori('enforcement', this)">
          <span>🛡️ Yaptırım & İtiraz</span>
          <span class="pill-badge">Disiplin</span>
        </button>
      </div>

      <!-- Sticky Navigasyon & Arama Barı -->
      <div class="mevzuat-nav">
        <div class="search-container">
          <span class="search-icon-fixed">🔍</span>
          <input type="text" id="mevzuat-ara" placeholder="Madde no, kural, KVKK, ban, ekonomi veya anahtar kelime arayın..." oninput="mevzuatAra()" autocomplete="off">
          <button class="search-clear-btn" id="search-clear" onclick="aramaTemizle()" title="Aramayı Temizle">✕</button>
        </div>

        <div class="nav-controls-right">
          <div class="jump-select">
            <select onchange="bolumeGit(this.value)" id="quick-jump-select">
              <option value="">📑 Hızlı Bölüm Seçimi...</option>
              <optgroup label="📜 Topluluk Anayasası">
                <option value="#bolum-1">Kısım I — Temel Esaslar</option>
                <option value="#bolum-2">Kısım II — Temel Haklar & Hürriyetler</option>
                <option value="#bolum-3">Kısım III — Genel Yükümlülükler</option>
                <option value="#bolum-4">Kısım IV — Yasama & Kurallar</option>
                <option value="#bolum-5">Kısım V — Yürütme & Yönetim</option>
                <option value="#bolum-6">Kısım VI — Yetki Sınırları</option>
                <option value="#ceza-cetveli">Kısım VII — Yargı & Ceza Cetveli</option>
                <option value="#bolum-8">Kısım VIII — Olağanüstü Hâl</option>
                <option value="#madde-30">Kısım IX — Kırmızı Çizgiler</option>
                <option value="#bolum-10">Kısım X — Yürürlük & Hükümler</option>
              </optgroup>
              <optgroup label="⚖️ Kullanım Şartları (ToS)">
                <option value="#bolum-tos">Kullanım Şartları & Hizmet Sözleşmesi</option>
              </optgroup>
              <optgroup label="🔒 Gizlilik & KVKK">
                <option value="#bolum-privacy">Gizlilik Politikası & KVKK Metni</option>
              </optgroup>
              <optgroup label="🍪 Çerez & Güvenlik">
                <option value="#bolum-cookies">Çerez ve Oturum Standartları</option>
              </optgroup>
              <optgroup label="🛡️ Yaptırım & İtiraz">
                <option value="#bolum-enforcement">Yaptırım Baremi & İtirazlar</option>
              </optgroup>
            </select>
          </div>

          <button class="btn-print" onclick="window.print()" title="Mevzuatı Yazdır veya PDF Kaydet">
            <span>🖨️ Yazdır / PDF</span>
          </button>
        </div>

        <div class="search-results-info" id="search-info"></div>
      </div>

      <!-- BOŞ ARAMA SONUCU BİLDİRİMİ -->
      <div id="empty-search" class="empty-search-state">
        <div class="empty-search-icon">🔍</div>
        <div class="empty-search-text">Aramanızla Eşleşen Madde Bulunamadı</div>
        <div class="empty-search-sub">Lütfen arama ifadenizi kontrol ediniz veya filtrelemeyi temizleyerek tüm anayasa ve politika metinlerini görüntüleyiniz.</div>
        <button class="empty-search-btn" onclick="aramaTemizle()">Aramayı Temizle</button>
      </div>

      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <!-- TOPLULUK ANAYASASI BÖLÜMLERİ (ORİJİNAL MADDELER)                       -->
      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <div id="container-anayasa" class="section-kategori-anayasa">
<section id="bolum-1" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM I</div>
          <h2 class="bolum-baslik">🏛️ Temel Esaslar (Madde 1 – 5)</h2>
        </div>

        <div class="kanun-madde" id="madde-1">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 1 — Sunucunun Adı ve Hukuki Statüsü</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-1')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Topluluğun resmî adı "EkoYıldız" olup; işbu Anayasa metninde "Topluluk", "Sunucu" veya "Federasyon" olarak anılır.</p>
            <p><span class="fıkra-no">(2)</span> Topluluğun egemenlik alanı; EkoYıldız Discord ana sunucusu, alt komisyon ve departman kanalları, resmi bot servisleri ve entegre web platformlarının bütününden oluşur.</p>
            <p><span class="fıkra-no">(3)</span> Sunucuya intisap eden her şahıs, sunucunun bağımsız tüzel dijital varlığına ve kurumsal kimliğine saygı göstermekle mükelleftir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-2">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 2 — Yönetim Biçimi ve Temsil Erki</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-2')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Topluluğu; liyakat, istişare, kuvvetler ayrılığı dengesi ve hukukun üstünlüğü ilkelerine dayalı kurumsal bir yönetim biçimiyle idare olunur.</p>
            <p><span class="fıkra-no">(2)</span> Temsil yetkisi ve nihai karar iradesi münhasıran Kurucular Kurulu ile bu kurulun yetkilendirdiği Yüksek Yönetim Heyeti'ne aittir.</p>
            <p><span class="fıkra-no">(3)</span> Hiçbir zümre veya şahıs, meşruiyetini işbu Anayasa'dan almayan bir temsil yetkisini veya yaptırım gücünü kullanamaz.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-3">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 3 — Resmî Dil ve İletişim Standartları</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-3')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Topluluğu'nun resmî iletişim, yazışma ve duyuru dili Türkçedir.</p>
            <p><span class="fıkra-no">(2)</span> Sunucu kanallarında Türk dilinin zenginliğine, imla kurallarına ve nezaket icaplarına uygun muhabere esastır.</p>
            <p><span class="fıkra-no">(3)</span> Özel diplomatik misafirler, yabancı partnerlik temasları veya özel yabancı dil odaları haricinde genel kanallarda yabancı dil kullanımı sınırlandırılabilir.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-4">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 4 — Temel İlkeler ve Kurucu Değerler
              <span class="dokunulmaz-badge">MUTLAK DOKUNULMAZ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-4')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Topluluk; cumhuriyetimizin kurucusu Gazi Mustafa Kemal Atatürk'ün çağdaş uygarlık ideallerini, milli birlik bilincini ve vatanperverlik şuurunu temel rehber kabul eder.</p>
            <p><span class="fıkra-no">(2)</span> <strong>Siyasetsizlik İlkesi:</strong> EkoYıldız hiçbir siyasi partiye, ideolojik fraksiyona, derneğe veya dini cemaate bağlı değildir. Topluluk mecralarında partizan propaganda yürütmek kesinlikle yasaktır.</p>
            <p><span class="fıkra-no">(3)</span> İnsan haklarına saygı, çevre ve doğa sevgisi, bilimsel düşünce ve akılcılık topluluğun vazgeçilmez temel harcıdır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-5">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 5 — Anayasanın Üstünlüğü ve Normlar Hiyerarşisi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-5')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Anayasası, topluluğun tüm alt yönergelerinin, oda kurallarının, sözlü talimatlarının ve idari teamüllerinin üstündedir.</p>
            <p><span class="fıkra-no">(2)</span> Anayasa hükümlerine aykırı hiçbir kural ihdas edilemez, idari emir verilemez; aykırı işlemler re'sen hükümsüzdür.</p>
            <p><span class="fıkra-no">(3)</span> <strong>Kanunların Geriye Yürümezliği:</strong> Yeni kabul edilen hiçbir kural veya ceza artırımı geçmişe şamil kılınamaz; fiilin işlendiği tarihteki lehe hükümler caridir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM II: ÜYELERİN TEMEL HAK VE TEMİNATLARI -->
      <section id="bolum-2" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM II</div>
          <h2 class="bolum-baslik">👥 Üyelerin Temel Hak ve Teminatları (Madde 6 – 9)</h2>
        </div>

        <div class="kanun-madde" id="madde-6">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 6 — Eşit Muamele ve Hukuk Önünde Eşitlik</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-6')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sunucu üyeleri sahip oldukları rol, kıdem, sunucu seviyesi veya sosyal statüleri ne olursa olsun kurallar ve yaptırımlar önünde mutlak surette eşittir.</p>
            <p><span class="fıkra-no">(2)</span> Hiçbir yönetici veya moderatör şahsi yakınlık, dostluk veya husumet sebebiyle ayrıcalıklı muamele tesis edemez.</p>
            <ul class="bent-list">
              <li class="bent-a">Ayrıcalık tanınması veya keyfi bağışıklık sağlanması idari görevi kötüye kullanma suçudur.</li>
              <li class="bent-b">Her üye kuralların tarafsız ve adil şekilde tatbik edilmesini talep etme hakkına maliktir.</li>
            </ul>
          </div>
        </div>

        <div class="kanun-madde" id="madde-7">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 7 — Savunma Hakkı ve Adil Yargılanma Güvencesi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-7')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Hakkında disiplin tahkikatı başlatılan veya ceza uygulanan her üyeye, usulüne uygun şekilde savunma yapma hakkı tanınır.</p>
            <p><span class="fıkra-no">(2)</span> Savunma hakkı kısıtlanamaz; üye iddialara karşı kendi delillerini ve beyanlarını sunma hakkını haizdir.</p>
            <ul class="bent-list">
              <li class="bent-a">Disiplin işlemleri şüpheye değil, somut delillere istinat ettirilir.</li>
              <li class="bent-b">Suçluluğu ispat edilene kadar her üyenin masumiyeti esastır (Masumiyet Karinesi).</li>
            </ul>
          </div>
        </div>

        <div class="kanun-madde" id="madde-8">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 8 — Şikâyet ve Hak Arama Hürriyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-8')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Haksız muameleye, yetki istismarına veya kural ihlaline maruz kalan her üye, Resmî Destek Bilet Sistemi üzerinden yetkili mercilere başvurma hakkına sahiptir.</p>
            <p><span class="fıkra-no">(2)</span> Şikâyet hakkını kullanan üyeye karşı hiçbir idari veya şahsi misillemede bulunulamaz.</p>
            <ul class="bent-list">
              <li class="bent-a">Başvurular en geç 48 saat zarfında gerekçeli olarak karara bağlanır.</li>
              <li class="bent-b">Kararın bir örneği talep sahibine bilet sistemi üzerinden tebliğ edilir.</li>
            </ul>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-9">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 9 — Özel Hayatın Mahremiyeti ve DM Gizliliği
              <span class="dokunulmaz-badge">MUTLAK DOKUNULMAZ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-9')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Üyelerin kişisel verileri (ad, soyad, T.C. kimlik, telefon, adres, şahsi fotoğraf, ailevi bilgiler vb.) mutlak koruma altındadır.</p>
            <p><span class="fıkra-no">(2)</span> Bu verilerin izinsiz neşri (Doxxing), ifşa tehdidi, gizli ses kaydı alma yahut DM üzerinden taciz ve reklam yapılması <strong>ihtarsız doğrudan kalıcı ihraç</strong> sebebidir.</p>
            <ul class="bent-list">
              <li class="bent-a">Kişisel verilerin ihlali halinde deliller adli makamlara resmi suç duyurusu olarak intikal ettirilir.</li>
              <li class="bent-b">Doxxing eylemini övmek veya ifşaya aracılık etmek de asli fail derecesinde cezalandırılır.</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- KISIM III: ÜYELERİN YÜKÜMLÜLÜKLERİ VE SADAKAT -->
      <section id="bolum-3" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM III</div>
          <h2 class="bolum-baslik">🛡️ Üyelerin Yükümlülükleri ve Sadakat (Madde 10 – 13)</h2>
        </div>

        <div class="kanun-madde" id="madde-10">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 10 — Anayasa ve Mevzuata Riayet Mükellefiyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-10')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sunucuya dahil olan her birey, bu Anayasa'nın ve buna bağlı olarak neşredilen tüm yönergelerin hükümlerine eksiksiz uymakla mükelleftir.</p>
            <p><span class="fıkra-no">(2)</span> Kuralları okumamış olmak, unutmak veya bilmediğini iddia etmek hiçbir cezai ve idari süreçte meşru mazeret teşkil etmez.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-11">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 11 — Karşılıklı Hürmet ve Nezaket Âdabı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-11')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Üyeler birbirleriyle olan muhaberelerinde terbiye, vakar ve nezaket hudutları dahilinde kalmak zorundadır.</p>
            <p><span class="fıkra-no">(2)</span> Şahsa, ailevi değerlere veya mukaddesata yönelik ağır küfür, hakaret, aşağılayıcı lakap takma ve kışkırtma fiilleri disiplin suçudur.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-12">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 12 — Kamu Düzeninin Korunması ve Görevlilere Saygı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-12')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sunucu içerisinde görev ve yetki kullanan personele yönelik tehdit, ağır hakaret, görev engelleme veya yetkinin icrasını kasıtlı şekilde aksatmaya yönelik davranışlar disiplin yaptırımına tabidir.</p>
            <p><span class="fıkra-no">(2)</span> Yetkili personelin kamu asayişini sağlamaya yönelik meşru ve makul talimatlarına uymak zorunludur.</p>
            <ul class="bent-list">
              <li class="bent-a">Yetkilileri sebepsiz yere etiketleyerek (spam-ping) taciz etmek ikaz ve susturma sebebidir.</li>
              <li class="bent-b">Yetkilinin kararına itiraz, genel sohbette tartışma çıkararak değil; resmî destek hattı üzerinden yapılır.</li>
            </ul>
          </div>
        </div>

        <div class="kanun-madde" id="madde-13">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 13 — Düzeni Bozucu Eylemlerin Men'i</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-13')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Kanallarda spam, flood, gereksiz büyük harf kullanımı, kanal tahsis amacına aykırı paylaşım (off-topic) ve izinsiz reklam yapılması yasaktır.</p>
            <p><span class="fıkra-no">(2)</span> Sunucu içi huzuru dinamitleyen fitne, tefrika, üyeleri ayaklanmaya kışkırtma, zararlı yazılım ve korsan içerik paylaşımı kesinlikle men edilmiştir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM IV: YASAMA VE KURAL KOYMA ERKİ -->
      <section id="bolum-4" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM IV</div>
          <h2 class="bolum-baslik">📜 Yasama ve Kural Koyma Erki (Madde 14 – 15)</h2>
        </div>

        <div class="kanun-madde" id="madde-14">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 14 — Kural Koyma ve Yasama Salahiyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-14')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Topluluğu'nda kural koyma, yönetmelik çıkarma ve anayasa teklifinde bulunma yetkisi münhasıran Kurucular Kurulu ile Yönetim Kurulu Meclisi'ne aittir.</p>
            <p><span class="fıkra-no">(2)</span> Yeni ihdas edilecek yönergeler Anayasa'nın amir hükümlerine aykırı olamaz; aykırılık halinde Anayasa hükümleri üstün tutulur.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-15">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 15 — Topluluk İstişaresi ve Referandum Usulü</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-15')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Topluluğun genel işleyişini doğrudan alakadar eden köklü yapısal kararlarda üyelerin görüşlerine başvurulabilir (İstişare Anketi).</p>
            <p><span class="fıkra-no">(2)</span> Yapılan anket ve oylamalar bağlayıcı veya tavsiye niteliğinde olup; nihai tasdik Kurucular Kurulu'nun onayına bağlıdır.</p>
          </div>
        </div>
      </section>

      <!-- KISIM V: YÜRÜTME ORGANI VE GÜNLÜK İDARE -->
      <section id="bolum-5" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM V</div>
          <h2 class="bolum-baslik">👑 Yürütme Organı ve Günlük İdare (Madde 16 – 18)</h2>
        </div>

        <div class="kanun-madde" id="madde-16">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 16 — Yürütme Erki ve İdari Teşkilat</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-16')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Yürütme organı; Kurucular Kurulu, Yöneticiler (Administrators) ve Moderatörlerden teşekkül eder.</p>
            <ul class="bent-list">
              <li class="bent-a"><strong>Kurucular Kurulu:</strong> En üst idari, stratejik ve veto salahiyetine malik makamdır.</li>
              <li class="bent-b"><strong>Sunucu Yöneticileri:</strong> Günlük idari işleyişi, teknik sistemleri ve komisyon koordinasyonunu sağlar.</li>
              <li class="bent-c"><strong>Moderatörler:</strong> Sahada kamu asayişini temin eder, anlık kural ihlallerine müdahale eder.</li>
            </ul>
          </div>
        </div>

        <div class="kanun-madde" id="madde-17">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 17 — Günlük İdare ve Asayişin Sevk ve İdaresi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-17')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Yürütme organı, sunucunun 7 gün 24 saat kesintisiz, huzurlu ve güvenli biçimde işlemesini sağlamakla vazifelidir.</p>
            <p><span class="fıkra-no">(2)</span> İdare personeli görevi esnasında adil, sabırlı ve olgun bir tutum sergilemekle mükelleftir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-18">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 18 — Rol ve Ayrıcalıkların Satılamazlığı İlkesi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-18')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız bünyesindeki hiçbir idari makam, moderatörlük rolü veya özel unvan para, menfaat veya takas mukabilinde satılamaz ve devredilemez.</p>
            <p><span class="fıkra-no">(2)</span> Rol rüşveti veya ticaretine tevessül edenlerin tüm yetkileri feshedilir ve sunucuyla ilişiği derhal kesilir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM VI: YETKİ SINIRLARI VE İDARİ DENETİM -->
      <section id="bolum-6" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM VI</div>
          <h2 class="bolum-baslik">🔒 Yetki Sınırları ve İdari Denetim (Madde 19 – 21)</h2>
        </div>

        <div class="kanun-madde" id="madde-19">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 19 — Yetkinin Sınırları ve Keyfilik Yasağı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-19')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Hiçbir yönetici veya moderatör, Anayasa ve mevzuatın çizdiği hudutların haricinde keyfi ceza tayin edemez.</p>
            <p><span class="fıkra-no">(2)</span> "Ben istedim oldu", "tavrını beğenmedim" yahut kişisel husumet saikiyle uygulanan cezalar mutlak surette hükümsüzdür.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-20">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 20 — İspat ve Kayıt Altına Alma Mecburiyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-20')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Tatbik edilen her disiplin işlemi (uyarı, susturma, karantina, kick, ban) yetkili personelce derhal kayıt altına alınır.</p>
            <p><span class="fıkra-no">(2)</span> Her yaptırım; ekran görüntüsü, bot kütüğü (log) veya ses kaydı gibi somut delillerle tevsik edilmek zorundadır. Delilsiz işlemler iptal edilir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-21">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 21 — İdari Sorumluluk ve Görevden El Çektirme (Azil)</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-21')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Yetkisini kötüye kullanan, üyelere hakaret eden yahut idari gizliliği sızdıran personel hakkında derhal idari soruşturma başlatılır.</p>
            <p><span class="fıkra-no">(2)</span> Kusuru tespit edilen personele Kınama, Rütbe İndirimi, Geçici Yetki Askısı veya Daimi Azil cezaları tatbik edilir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM VII: YARGI, DİSİPLİN HUKUKU VE YAPTIRIMLAR -->
      <section id="bolum-7" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM VII</div>
          <h2 class="bolum-baslik">⚖️ Yargı, Disiplin Hukuku ve Yaptırımlar (Madde 22 – 26)</h2>
        </div>

        <div class="kanun-madde" id="madde-22">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 22 — Suçta ve Cezada Kanunilik İlkesi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-22')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Bu Anayasa'da ve bağlı tüzüklerde açıkça suç sayılmayan hiçbir fiilden dolayı kimseye disiplin cezası verilemez.</p>
            <p><span class="fıkra-no">(2)</span> <strong>Cezaların Şahsiliği:</strong> Ceza yalnızca kabahati işleyen şahsa tatbik edilir; arkadaşlarına veya topluluktaki masum yakınlarına teşmil edilemez.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-23">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 23 — Disiplin Yaptırımlarının Kademeleri</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-23')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Hukukunda tatbik edilecek resmî yaptırımlar hafiften ağıra doğru şunlardır:</p>
            <ul class="bent-list">
              <li class="bent-a"><strong>Sözlü ve Yazılı Uyarı (Warn):</strong> Hafif kabahatlerde sicile işlenen resmî ikazdır.</li>
              <li class="bent-b"><strong>Süreli Susturma (Mute / Timeout):</strong> 10 dakikadan 7 güne kadar mesaj ve ses hakkının askıya alınmasıdır.</li>
              <li class="bent-c"><strong>İntizam Karantinası (Jail):</strong> Tahkikat sonuçlanana dek üyenin tecrit kanalında tutulması tedbiridir.</li>
              <li class="bent-d"><strong>Sunucudan Çıkarma (Kick):</strong> Tekrar katılım imkanı saklı kalmak üzere atılmadır.</li>
              <li class="bent-e"><strong>Süreli İhraç (Temp-Ban) & Kalıcı İhraç (Perm-Ban):</strong> Sunucuyla ilişiğin süreli veya süresiz olarak kesilmesidir.</li>
            </ul>
          </div>
        </div>

        <!-- CETVEL TABLOSU -->
        <div class="kanun-madde" id="ceza-cetveli">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 24 — Resmî İntizam ve Ceza Cetveli (Yaptırım Matrisi)</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('ceza-cetveli')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Fiillerin vuku derecesi ve tekerrürü halinde yetkili organlarca tatbik edilecek standart ceza tarifesi aşağıda tayin edilmiştir:</p>
            
            <div class="resmi-tablo-wrapper">
              <table class="resmi-tablo">
                <thead>
                  <tr>
                    <th>Cürüm ve İhlal Fiili</th>
                    <th>Birinci Derece (İlk Vukuat)</th>
                    <th>İkinci Derece (Tekerrür)</th>
                    <th>Üçüncü Derece (İtiyadi İhlal)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Spam / Flood / Büyük Harf Taşkınlığı</strong></td>
                    <td><span class="yaptirim-susturma">Yazılı İhtar + 15 Dk Susturma</span></td>
                    <td><span class="yaptirim-susturma">1 Saat Susturma</span></td>
                    <td><span class="yaptirim-susturma">24 Saat Susturma / Kick</span></td>
                  </tr>
                  <tr>
                    <td><strong>Kanal Dışı İletişim (Off-Topic)</strong></td>
                    <td>Sözlü / Yazılı İhtar</td>
                    <td><span class="yaptirim-susturma">30 Dk Susturma</span></td>
                    <td><span class="yaptirim-susturma">2 Saat Susturma</span></td>
                  </tr>
                  <tr>
                    <td><strong>Yetkilileri Sebepsiz Etiketleme / Taciz</strong></td>
                    <td>Yazılı İhtar</td>
                    <td><span class="yaptirim-susturma">1 Saat Susturma</span></td>
                    <td><span class="yaptirim-susturma">24 Saat Susturma</span></td>
                  </tr>
                  <tr>
                    <td><strong>Huzur ve Sükûnu Bozma / Hafif Argo</strong></td>
                    <td>Yazılı İhtar</td>
                    <td><span class="yaptirim-susturma">2 Saat Susturma</span></td>
                    <td><span class="yaptirim-uzaklasma">1 Gün Süreli İhraç</span></td>
                  </tr>
                  <tr>
                    <td><strong>Şahsa ve Mukaddesata Ağır Hakaret</strong></td>
                    <td><span class="yaptirim-uzaklasma">1 Gün Süreli İhraç</span></td>
                    <td><span class="yaptirim-uzaklasma">7 Gün Süreli İhraç</span></td>
                    <td><span class="yaptirim-ihrac">Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>İzinsiz Reklam / DM Reklamcılığı</strong></td>
                    <td><span class="yaptirim-susturma">Mesaj İptali + 1 Gün Mute</span></td>
                    <td><span class="yaptirim-uzaklasma">7 Gün Süreli İhraç</span></td>
                    <td><span class="yaptirim-ihrac">Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Doxxing / Kişisel Veri İfşası (KVKK)</strong></td>
                    <td colspan="3"><span class="yaptirim-ihrac">🚨 Doğrudan ve İhtarsız Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Müstehcenlik / NSFW / E-Date Israrı</strong></td>
                    <td colspan="3"><span class="yaptirim-ihrac">🚨 Doğrudan ve İhtarsız Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Zararlı Yazılım / Oltalama (Phishing)</strong></td>
                    <td colspan="3"><span class="yaptirim-ihrac">🚨 Doğrudan ve İhtarsız Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Nefret Söylemi ve Ağır Ayrımcılık</strong></td>
                    <td><span class="yaptirim-uzaklasma">7 Gün Süreli İhraç</span></td>
                    <td colspan="2"><span class="yaptirim-ihrac">Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="kanun-madde" id="madde-25">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 25 — İtiraz Mekanizması, İstinaf ve Anayasa Mahkemesi (AYM)</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-25')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Aleyhine disiplin yaptırımı uygulanan her üye, 72 saat zarfında Resmî Bilet Hattı üzerinden İstinaf (Üst Mahkeme) yoluna başvurabilir.</p>
            <p><span class="fıkra-no">(2)</span> Temel hakların ihlal edildiği iddiasıyla Kurucular Kurulu riyasetindeki <strong>Anayasa Mahkemesi'ne (AYM) Bireysel Başvuru</strong> yapılabilir. AYM'nin vereceği kararlar nihaidir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-26">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 26 — Sicil Affı ve İnfaz İndirimi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-26')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Son ceza tarihinden itibaren aralıksız 6 ay süreyle yeni bir disiplin cezası almayan üyelerin hafif sicil kayıtları arşive kaldırılır.</p>
            <p><span class="fıkra-no">(2)</span> Doxxing, sabotaj, çocuk istismarı ve ağır nefret suçları hiçbir af ve infaz indiriminden faydalanamaz.</p>
          </div>
        </div>
      </section>

      <!-- KISIM VIII: OLAĞANÜSTÜ HÂL VE GÜVENLİK TEDBİRLERİ -->
      <section id="bolum-8" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM VIII</div>
          <h2 class="bolum-baslik">🚨 Olağanüstü Hâl ve Güvenlik Tedbirleri (Madde 27 – 28)</h2>
        </div>

        <div class="kanun-madde" id="madde-27">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 27 — Olağanüstü Hâl (OHAL) İlanı ve Şartları</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-27')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sunucuya yönelik kitlesel baskın (raid), bot saldırısı, kritik güvenlik açığı, sabotaj veya asayişi tamamen felç eden durumlarda Kurucular Kurulu re'sen Olağanüstü Hâl (OHAL) ilan edebilir.</p>
            <p><span class="fıkra-no">(2)</span> OHAL durumu krizin ortadan kalkmasıyla birlikte derhal kaldırılır ve kamuoyuna bilgilendirme yapılır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-28">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 28 — Olağanüstü Hâl Kapsamında Geçici Özel Yetkiler</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-28')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> OHAL süresince yönetim şu geçici tedbirleri uygulamaya salahiyetlidir:</p>
            <ul class="bent-list">
              <li class="bent-a">Sunucuya yeni üye girişlerini ve davet bağlantılarını geçici olarak askıya almak.</li>
              <li class="bent-b">Yazılı ve sesli kanalları kısmen veya tamamen tecrit ve kilit altına almak (Lockdown).</li>
              <li class="bent-c">Saldırıya iştirak eden şüpheli hesapları savunma almaksızın tedbiren topluca ihraç etmek.</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- KISIM IX: ANAYASA DEĞİŞİKLİĞİ VE DOKUNULMAZLIK -->
      <section id="bolum-9" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM IX</div>
          <h2 class="bolum-baslik">🗳️ Anayasa Değişikliği ve Dokunulmazlık (Madde 29 – 30)</h2>
        </div>

        <div class="kanun-madde" id="madde-29">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 29 — Anayasa Değişikliği Teklifi ve Usulü</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-29')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Anayasa'nın değiştirilmesi; Kuruculardan birinin veya Yönetim Kurulu üyelerinin salt çoğunluğunun yazılı teklifiyle gündeme alınabilir.</p>
            <p><span class="fıkra-no">(2)</span> Değişikliğin kabulü için <strong>Kurucu onayı ve Üst Yönetim Kurulu'nun en az üçte iki (2/3) oy çokluğu</strong> şarttır. Bu nisap sağlanmadan hiçbir madde değiştirilemez.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-30">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 30 — Değiştirilemez Hükümler (Kırmızı Çizgiler / Mutlak Dokunulmazlık)
              <span class="dokunulmaz-badge">MUTLAK DOKUNULMAZ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-30')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Anayasa'nın temel omurgasını ve varlık sebebini teşkil eden;</p>
            <ul class="bent-list">
              <li class="bent-a"><strong>Madde 1:</strong> Sunucunun Adı ve Hukuki Statüsü,</li>
              <li class="bent-b"><strong>Madde 3:</strong> Resmî Dilin Türkçe Oluşu,</li>
              <li class="bent-c"><strong>Madde 4:</strong> Atatürk İlkeleri, Bağımsızlık ve Siyasetsizlik İlkesi,</li>
              <li class="bent-d"><strong>Madde 9:</strong> Kişisel Verilerin Korunması ve Doxxing Yasağı,</li>
              <li class="bent-e"><strong>Madde 30:</strong> Dokunulmazlık Hükmünün Kendisi,</li>
            </ul>
            <p>hükümleri <strong>hiçbir surette değiştirilemez, ilga edilemez ve bunların değiştirilmesi teklif dahi edilemez.</strong></p>
          </div>
        </div>
      </section>

      <!-- KISIM X: SON HÜKÜMLER VE YÜRÜRLÜK -->
      <section id="bolum-10" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM X</div>
          <h2 class="bolum-baslik">📜 Son Hükümler ve Yürürlük (Madde 31 – 32)</h2>
        </div>

        <div class="kanun-madde" id="madde-31">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 31 — Eski Kuralların Durumu ve Geçiş Hükümleri</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-31')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Bu Anayasa'nın yürürlüğe girmesiyle birlikte, daha önce ilan edilmiş tüm eski kural metinleri yürürlükten kalkmıştır.</p>
            <p><span class="fıkra-no">(2)</span> Eski kurallar döneminde kesinleşmiş disiplin kayıtları geçerliliğini korur; ancak süregelen cezalarda lehe olan hükümler uygulanır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-32">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 32 — Yürürlük Tarihi ve İcra Salahiyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-32')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Başlangıç / Önsöz ve 32 Maddeden müteşekkil işbu EkoYıldız Topluluğu Anayasası, Kurucular Kurulu ve Yönetim Heyeti tarafından tasdik edildiği <strong>07 Temmuz 2026</strong> tarihi itibarıyla mer'iyete (yürürlüğe) girmiştir.</p>
            <p><span class="fıkra-no">(2)</span> Bu Anayasa hükümlerini yürütmeye ve icra etmeye Kurucular Kurulu ve Yüksek İdare Heyeti yetkilidir.</p>
          </div>
        </div>
      </section>

      <!-- RESMÎ İMZA VE MÜHÜR ALANI -->
      <div class="resmi-imza-alani" id="resmi-imzalar">
        <div class="imza-ust-baslik">YÜKSEK TASDİK VE İCRA MAKAMI</div>
        <p class="imza-aciklama">
          İşbu EkoYıldız Topluluğu Resmî Anayasası, Kurucular Kurulu ve Yüksek Yönetim Heyeti tarafından oy birliği ile kabul, imza ve tasdik edilerek yürürlüğe konulmuştur.
        </p>

        <div class="muhur-grid">
          <div class="muhur-kutusu">
            <div class="muhur-kurum">EkoYıldız Yüksek Kurucular Kurulu</div>
            <div class="muhur-imzaci">ekonqt</div>
            <div class="muhur-unvan">👑 Kurucu & Heyet Başkanı</div>
            <div class="muhur-kod">E-İMZA: EYA-2026-0707-TURKISH-RP-OFFICIAL</div>
          </div>
          <div class="muhur-kutusu">
            <div class="muhur-kurum">Yüksek İdare ve Divan Kurulu</div>
            <div class="muhur-imzaci">EkoYıldız Divanı</div>
            <div class="muhur-unvan">⚖️ Adli ve İdari Denetim Kurulu</div>
            <div class="muhur-kod">TASDİK KODU: EKD-RESMI-MEVZUAT-CONFIRMED</div>
          </div>
        </div>
      </div>
    </div>
      </div>

      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <!-- EK POLİTİKALAR: TOS, KVKK, ÇEREZLER, YAPTIRIMLAR                      -->
      <!-- ═════════════════════════════════════════════════════════════════════ -->

      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <!-- KULLANIM ŞARTLARI VE HİZMET SÖZLEŞMESİ (TERMS OF SERVICE)             -->
      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <section id="bolum-tos" class="kanun-bolum section-kategori-tos">
        <div class="bolum-head">
          <div class="bolum-no" style="color: #60a5fa;">SÖZLEŞME METNİ • KULLANIM ŞARTLARI</div>
          <h2 class="bolum-baslik">⚖️ Topluluk Kullanım Şartları ve Hizmet Sözleşmesi (ToS)</h2>
          <p class="bolum-aciklama">EkoYıldız dijital platformu, internet sitesi, Discord botları, Roblox oyun mekanizmaları ve ilişkili tüm servislerin kullanım kurallarıdır.</p>
        </div>

        <!-- Madde T1 -->
        <div class="kanun-madde" id="madde-tos-1">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE T-1 — Taraflar ve Sözleşmenin Bağlayıcılığı</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-emredici">Zorunlu Hüküm</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-tos-1')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> İşbu Kullanım Şartları ve Hizmet Sözleşmesi; EkoYıldız Topluluğu Platform Yönetimi (“Yönetim”) ile web portalına, Discord sunucusuna, bot komutlarına veya Roblox deneyimlerine erişim sağlayan gerçek/tüzel kişiler (“Kullanıcı”) arasında yürürlüğe girmiştir.</p>
            <p><span class="fıkra-no">(2)</span> Platforma erişen veya Discord OAuth sistemiyle oturum açan her birey, işbu şartları, platform kurallarını ve ekindeki Gizlilik Politikasını herhangi bir çekince koymaksızın kabul ve taahhüt etmiş sayılır.</p>
          </div>
        </div>

        <!-- Madde T2 -->
        <div class="kanun-madde" id="madde-tos-2">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE T-2 — Hesap Güvenliği, PIN ve Yaş Sınırı</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-tanim">Uyumluluk</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-tos-2')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Kullanıcılar, Discord Inc. ve Roblox Corporation hizmet şartlarında belirtilen en az 13 yaş sınırına sahip olduklarını beyan ederler. 13 yaş altı kullanıcıların tespiti hâlinde hesapları dondurulur.</p>
            <p><span class="fıkra-no">(2)</span> Kullanıcı, sitede belirlediği Site PIN şifresinin, 2FA güvenlik kodunun ve oturum çerezlerinin gizliliğinden bizzat sorumludur. Hesabın üçüncü kişilere devri, kiralanması veya satılması kesinlikle yasaktır.</p>
          </div>
        </div>

        <!-- Madde T3 -->
        <div class="kanun-madde" id="madde-tos-3">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE T-3 — Sanal Ekonomi (EkoCoin), Mağaza ve Çekilişler</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-tanim">Ekonomi</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-tos-3')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoCoin ve platform içi sanal eşyalar sadece eğlence ve topluluk etkileşimi amaçlıdır; resmî para birimi, menkul kıymet veya kripto varlık teşkil etmez ve gerçek nakit paraya dönüştürülemez.</p>
            <p><span class="fıkra-no">(2)</span> Hile, bot açığı, yazılım hatası veya çoklu hesap (multi-account) kullanımı ile haksız avantaj ve EkoCoin sağlayan kullanıcıların tüm kazanımları sıfırlanır ve hesapları süresiz yasaklanır.</p>
          </div>
        </div>

        <!-- Madde T4 -->
        <div class="kanun-madde" id="madde-tos-4">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE T-4 — Siber Güvenlik ve Yasaklı Faaliyetler</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-emredici" style="background: rgba(239, 68, 68, 0.3); color: #fca5a5;">Ağır İhlal</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-tos-4')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Platform altyapısına, API rotalarına veya sunuculara yönelik DDoS, yetkisiz veri kazıma (scraping), SQL Injection, XSS veya kaba kuvvet saldırıları (brute-force) derhal engellenir.</p>
            <p><span class="fıkra-no">(2)</span> Bu tür kötü niyetli eylemlerde bulunan şahısların IP, oturum ve Discord kimlik kayıtları delil olarak tespit edilerek Türk Ceza Kanunu'nun bilişim suçları hükümleri uyarınca adli makamlara intikal ettirilir.</p>
          </div>
        </div>

        <!-- Madde T5 -->
        <div class="kanun-madde" id="madde-tos-5">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE T-5 — Fikri Mülkiyet, Telif ve DMCA Bildirimleri</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-guvence">Telif Hakları</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-tos-5')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız logosu, tescilli markası, arayüz tasarımları, bot kod blokları ve özel grafikler EkoYıldız yönetiminin mülkiyetindedir; yazılı izin olmaksızın kopyalanamaz veya dağıtılamaz.</p>
            <p><span class="fıkra-no">(2)</span> Telif hakkı ihlali iddiasında bulunmak isteyen hak sahipleri, <a href="/settings#tab-legal" style="color:#c4b5fd;font-weight:700;">Hukuki Talep Masası</a> üzerinden resmî DMCA / Telif İhbar Formu doldurabilir. İhbarlar 48 saat içerisinde değerlendirilir.</p>
          </div>
        </div>
      </section>

      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <!-- GİZLİLİK POLİTİKASI VE KVKK / GDPR AYDINLATMA METNİ                   -->
      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <section id="bolum-privacy" class="kanun-bolum section-kategori-privacy">
        <div class="bolum-head">
          <div class="bolum-no" style="color: #38bdf8;">VERİ KORUMA • KVKK AYDINLATMA METNİ</div>
          <h2 class="bolum-baslik">🔒 Gizlilik Politikası ve Kişisel Verilerin Korunması (KVKK/GDPR)</h2>
          <p class="bolum-aciklama">6698 Sayılı Kişisel Verilerin Korunması Kanunu ve Avrupa Birliği GDPR prensipleri uyarınca veri işleme süreçlerine ilişkin bilgilendirmedir.</p>
        </div>

        <!-- Madde G1 -->
        <div class="kanun-madde" id="madde-priv-1">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE G-1 — Veri Sorumlusu ve Kapsam</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-kvkk">KVKK Md. 10</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-priv-1')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Dijital Platformu, kullanıcılarının gizliliğine ve kişisel verilerinin korunmasına azami ehemmiyet göstermektedir. İşbu politika, toplanan tüm teknik ve kişisel verilerin hukuki zeminini teşkil eder.</p>
            <p><span class="fıkra-no">(2)</span> Platform, kişisel verileri hiçbir üçüncü tarafa reklam veya ticari pazarlama amacıyla devretmez, kiralamaz veya satmaz.</p>
          </div>
        </div>

        <!-- Madde G2 -->
        <div class="kanun-madde" id="madde-priv-2">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE G-2 — İşlenen Veri Türleri ve Toplama Yöntemi</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-tanim">Veri Envanteri</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-priv-2')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> <b>Kimlik ve Hesap Verileri:</b> Discord ID, Discord Kullanıcı Adı, Avatar Görseli, Roblox Kullanıcı Adı ve ID'si.</p>
            <p><span class="fıkra-no">(2)</span> <b>İletişim ve Beyan Verileri:</b> Resmî başvuru, destek talebi veya itiraz sırasında kullanıcının beyan ettiği ad, soyad ve e-posta adresi.</p>
            <p><span class="fıkra-no">(3)</span> <b>Güvenlik ve Erişim Kayıtları:</b> Giriş yapılan IP adresi, erişim zaman damgası, kullanıcı oturum belirteci ve bcrypt ile tuzlanmış PIN şifre özeti.</p>
          </div>
        </div>

        <!-- Madde G3 -->
        <div class="kanun-madde" id="madde-priv-3">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE G-3 — İlgili Kişinin Hakları ve Unutulma Hakkı (KVKK Md. 11)</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-guvence">Yasal Haklar</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-priv-3')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Her kullanıcı, 6698 sayılı KVKK'nın 11. maddesi kapsamında; verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme ve verilerinin dökümünü alma hakkına sahiptir.</p>
            <p><span class="fıkra-no">(2)</span> <b>Veri Silme & Unutulma Talebi:</b> Kullanıcı dilediği an <a href="/settings#tab-legal" style="color:#c4b5fd;font-weight:700;">Resmî Dilekçe Masası</a> üzerinden "KVKK Veri Silme Talebi" ileterek platformdaki tüm profil, oyun ve oturum verilerinin kalıcı olarak silinmesini talep edebilir.</p>
          </div>
        </div>
      </section>

      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <!-- ÇEREZ VE OTURUM GÜVENLİĞİ STANDARTLARI                                -->
      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <section id="bolum-cookies" class="kanun-bolum section-kategori-cookies">
        <div class="bolum-head">
          <div class="bolum-no" style="color: #a78bfa;">GÜVENLİK STANDARDI • ÇEREZ POLİTİKASI</div>
          <h2 class="bolum-baslik">🍪 Çerez Politikası ve Oturum Güvenliği Standartları</h2>
          <p class="bolum-aciklama">Web sitemizin güvenli, stabil ve kullanıcı dostu çalışmasını temin eden çerez ve oturum mimarisidir.</p>
        </div>

        <!-- Madde C1 -->
        <div class="kanun-madde" id="madde-ck-1">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE C-1 — Oturum Çerezleri ve Şifreleme</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-emredici">Güvenlik</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-ck-1')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Platformumuzda yalnızca kullanıcının kimlik doğrulamasını sağlayan ve yetkisiz oturum çalma (session hijacking) girişimlerini engelleyen HttpOnly ve SameSite=Lax bayraklı oturum çerezleri kullanılır.</p>
            <p><span class="fıkra-no">(2)</span> Tema ve hareket azaltma tercihleri tarayıcının yerel hafızasında (localStorage) saklanır ve harici sunuculara aktarılmaz.</p>
          </div>
        </div>
      </section>

      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <!-- YAPTIRIM BAREMİ, CEZA DERECELERİ VE İTİRAZ MEVZUATI                   -->
      <!-- ═════════════════════════════════════════════════════════════════════ -->
      <section id="bolum-enforcement" class="kanun-bolum section-kategori-enforcement">
        <div class="bolum-head">
          <div class="bolum-no" style="color: #f87171;">DİSİPLİN VE YARGI • YAPTIRIM MEVZUATI</div>
          <h2 class="bolum-baslik">🛡️ Yaptırım Baremi, Ceza Dereceleri ve İtiraz İlkeleri</h2>
          <p class="bolum-aciklama">Disiplin cezalarının kademeli uygulanma şartları, yetki sınırları ve resmî itiraz mercilerinin çalışma usulüdür.</p>
        </div>

        <!-- Madde Y1 -->
        <div class="kanun-madde" id="madde-enf-1">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE Y-1 — Kademeli Ceza Baremi ve Uygulama Esasları</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-emredici">Ceza Hükmü</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-enf-1')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Kural ihlallerinde keyfi ceza verilemez. Yetkililer ihlalin ağırlığına göre şu baremi izlemekle yükümlüdür:</p>
            <ul>
              <li><b>1. Aşama:</b> Sözlü Hatırlatma veya Bot Üzerinden Kayıtlı İhtar (Warn),</li>
              <li><b>2. Aşama:</b> Süreli Susturma / Zaman Aşımı (Timeout / Mute: 10 dk ila 24 saat),</li>
              <li><b>3. Aşama:</b> Geçici Uzaklaştırma (Temp Ban: 3 gün ila 30 gün),</li>
              <li><b>4. Aşama:</b> Süresiz İhraç (Permanent Ban),</li>
              <li><b>5. Aşama:</b> Tam İzolasyon ve Karaliste (Blacklist).</li>
            </ul>
          </div>
        </div>

        <!-- Madde Y2 -->
        <div class="kanun-madde" id="madde-enf-2">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE Y-2 — Resmî İtiraz Usulü ve Hukuk Masası İncelemesi</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge-resmi badge-guvence">Yargı Güvencesi</span>
              <button class="madde-paylas-btn" onclick="maddeKopyala('madde-enf-2')" title="Maddeyi Kopyala">🔗 Kopyala</button>
              <a href="/settings#tab-legal" class="madde-paylas-btn" style="color: #93c5fd; text-decoration: none;" title="Resmî Dilekçe">⚖️ Talep Gönder</a>
            </div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Hakkında disiplin cezası uygulanan her üye, tebliğ tarihinden itibaren 15 takvim günü içinde <a href="/settings#tab-legal" style="color:#c4b5fd;font-weight:700;">Resmî Dilekçe Masası</a> üzerinden Hukuk Masasına itiraz edebilir.</p>
            <p><span class="fıkra-no">(2)</span> İtiraz dilekçeleri doğrudan Admin ve Hukuk Masası paneline düşer. İnceleme en geç 7 iş günü içinde gerekçeli resmî karar ile sonuçlandırılır ve başvuru sahibine bildirilir.</p>
          </div>
        </div>
      </section>

    </div>

    <!-- SAYFA İÇİ TOAST BİLDİRİMİ -->
    <div id="anayasa-toast" class="anayasa-toast">
      <span>🔗</span>
      <span id="toast-message">Madde Bağlantısı Kopyalandı!</span>
    </div>

    <!-- BAŞA DÖN BUTONU -->
    <button id="btn-scroll-top" class="btn-scroll-top" onclick="basaDon()" title="Sayfa Başına Dön">⬆</button>

    <!-- İNTERAKTİF İSTEMCİ SCRİPTİ -->
    <script>
      let aktifKategori = 'all';

      function filtreleKategori(kategori, btn) {
        aktifKategori = kategori;

        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        if (btn) btn.classList.add('active');

        const anayasaContainer = document.getElementById('container-anayasa');
        const tosSection = document.getElementById('bolum-tos');
        const privSection = document.getElementById('bolum-privacy');
        const cookieSection = document.getElementById('bolum-cookies');
        const enfSection = document.getElementById('bolum-enforcement');

        if (kategori === 'all') {
          if (anayasaContainer) anayasaContainer.style.display = '';
          if (tosSection) tosSection.style.display = '';
          if (privSection) privSection.style.display = '';
          if (cookieSection) cookieSection.style.display = '';
          if (enfSection) enfSection.style.display = '';
        } else if (kategori === 'anayasa') {
          if (anayasaContainer) anayasaContainer.style.display = '';
          if (tosSection) tosSection.style.display = 'none';
          if (privSection) privSection.style.display = 'none';
          if (cookieSection) cookieSection.style.display = 'none';
          if (enfSection) enfSection.style.display = 'none';
        } else if (kategori === 'tos') {
          if (anayasaContainer) anayasaContainer.style.display = 'none';
          if (tosSection) tosSection.style.display = '';
          if (privSection) privSection.style.display = 'none';
          if (cookieSection) cookieSection.style.display = 'none';
          if (enfSection) enfSection.style.display = 'none';
        } else if (kategori === 'privacy') {
          if (anayasaContainer) anayasaContainer.style.display = 'none';
          if (tosSection) tosSection.style.display = 'none';
          if (privSection) privSection.style.display = '';
          if (cookieSection) cookieSection.style.display = 'none';
          if (enfSection) enfSection.style.display = 'none';
        } else if (kategori === 'cookies') {
          if (anayasaContainer) anayasaContainer.style.display = 'none';
          if (tosSection) tosSection.style.display = 'none';
          if (privSection) privSection.style.display = 'none';
          if (cookieSection) cookieSection.style.display = '';
          if (enfSection) enfSection.style.display = 'none';
        } else if (kategori === 'enforcement') {
          if (anayasaContainer) anayasaContainer.style.display = 'none';
          if (tosSection) tosSection.style.display = 'none';
          if (privSection) privSection.style.display = 'none';
          if (cookieSection) cookieSection.style.display = 'none';
          if (enfSection) enfSection.style.display = '';
        }

        mevzuatAra();
      }

      function bolumeGit(secici) {
        if (!secici) return;
        const hedef = document.querySelector(secici);
        if (hedef) {
          if (hedef.closest && (hedef.style.display === 'none' || (hedef.parentElement && hedef.parentElement.style.display === 'none'))) {
            filtreleKategori('all', document.querySelector('.category-pill'));
          }
          hedef.scrollIntoView({ behavior: 'smooth' });
        }
      }

      function basaDon() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      window.addEventListener('scroll', function() {
        const btn = document.getElementById('btn-scroll-top');
        if (btn) {
          if (window.scrollY > 300) {
            btn.classList.add('visible');
          } else {
            btn.classList.remove('visible');
          }
        }
      });

      function customToast(mesaj) {
        const toast = document.getElementById('anayasa-toast');
        const text = document.getElementById('toast-message');
        if (toast && text) {
          text.innerText = mesaj || 'Bağlantı kopyalandı!';
          toast.classList.add('show');
          setTimeout(() => {
            toast.classList.remove('show');
          }, 2800);
        }
      }

      function maddeKopyala(maddeId) {
        const link = window.location.origin + window.location.pathname + '#' + maddeId;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link).then(() => {
            customToast('Resmî Madde Bağlantısı Kopyalandı!');
          }).catch(() => {
            prompt('Madde Bağlantısı:', link);
          });
        } else {
          prompt('Madde Bağlantısı:', link);
        }
      }

      function aramaTemizle() {
        const input = document.getElementById('mevzuat-ara');
        if (input) {
          input.value = '';
          mevzuatAra();
          input.focus();
        }
      }

      function mevzuatAra() {
        const input = document.getElementById('mevzuat-ara');
        const clearBtn = document.getElementById('search-clear');
        const infoDiv = document.getElementById('search-info');
        const emptyState = document.getElementById('empty-search');
        const kelime = input ? input.value.toLowerCase().trim() : '';
        const maddeler = document.querySelectorAll('.kanun-madde');
        const bolumler = document.querySelectorAll('.kanun-bolum');

        if (clearBtn) {
          clearBtn.style.display = kelime ? 'flex' : 'none';
        }

        if (!kelime) {
          maddeler.forEach(m => m.classList.remove('hidden-item'));
          bolumler.forEach(b => b.classList.remove('hidden-item'));
          if (infoDiv) {
            infoDiv.style.display = 'none';
            infoDiv.innerHTML = '';
          }
          if (emptyState) {
            emptyState.style.display = 'none';
          }
          return;
        }

        let toplamEslenen = 0;

        bolumler.forEach(bolum => {
          if (bolum.style.display === 'none' || (bolum.parentElement && bolum.parentElement.style.display === 'none')) {
            bolum.classList.add('hidden-item');
            return;
          }

          let bolumdeVar = false;
          const bolumMaddeleri = bolum.querySelectorAll('.kanun-madde');

          bolumMaddeleri.forEach(madde => {
            const metin = madde.innerText.toLowerCase();
            if (metin.includes(kelime)) {
              madde.classList.remove('hidden-item');
              bolumdeVar = true;
              toplamEslenen++;
            } else {
              madde.classList.add('hidden-item');
            }
          });

          if (bolumdeVar) {
            bolum.classList.remove('hidden-item');
          } else {
            bolum.classList.add('hidden-item');
          }
        });

        if (infoDiv) {
          infoDiv.style.display = 'block';
          infoDiv.innerHTML = '🔍 "<b>' + kelime + '</b>" aramasıyla eşleşen <b>' + toplamEslenen + '</b> madde listeleniyor.';
        }

        if (emptyState) {
          emptyState.style.display = (toplamEslenen === 0) ? 'block' : 'none';
        }
      }

      window.addEventListener('DOMContentLoaded', () => {
        if (window.location.hash) {
          setTimeout(() => {
            bolumeGit(window.location.hash);
          }, 200);
        }
      });
    </script>
  `;

  const { _layout } = require("../views");
  return _layout("EkoYıldız Hukuk, Politika ve Resmî Mevzuat Portalı", user, content, "", "/anayasasi");
}

module.exports = {
  renderEkoYildizAnayasaPage
};
