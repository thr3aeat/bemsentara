'use strict';

function renderEkoYildizAnayasaPage(user) {
  const content = `
    <style>
      .mevzuat-wrapper {
        max-width: 1240px;
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
        margin: 0 0 1.35rem 0;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }
      .resmi-metadata-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        background: rgba(0, 0, 0, 0.42);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 1.1rem 1.4rem;
        max-width: 960px;
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

      /* Başlangıç (Preamble) Kutusu */
      .preamble-card {
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%);
        border: 1px solid rgba(167, 139, 250, 0.25);
        border-left: 5px solid #a78bfa;
        border-radius: 0 16px 16px 0;
        padding: 1.75rem 2rem;
        margin-bottom: 2.25rem;
        font-style: italic;
        line-height: 1.9;
        color: #cbd5e1;
        font-size: 1.02rem;
        box-shadow: 0 6px 25px rgba(0,0,0,0.25);
        position: relative;
      }
      .preamble-title {
        font-style: normal;
        font-weight: 800;
        font-size: 1.15rem;
        color: #c4b5fd;
        margin-bottom: 0.65rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 8px;
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

      /* Hızlı Kısayol Rozetleri */
      .quick-chips-wrapper {
        margin-bottom: 2rem;
      }
      .quick-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .quick-chip {
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.09);
        padding: 7px 15px;
        border-radius: 10px;
        font-size: 0.84rem;
        color: #cbd5e1;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .quick-chip:hover {
        background: rgba(167, 139, 250, 0.18);
        border-color: rgba(167, 139, 250, 0.5);
        color: #fff;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(167, 139, 250, 0.2);
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
        margin-bottom: 0.95rem;
        padding-bottom: 0.65rem;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
        flex-wrap: wrap;
      }
      .madde-baslik-etiketi {
        font-size: 1.1rem;
        font-weight: 800;
        color: #c4b5fd;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .madde-paylas-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #94a3b8;
        font-size: 0.78rem;
        font-weight: 600;
        padding: 5px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .madde-paylas-btn:hover {
        background: rgba(167, 139, 250, 0.25);
        border-color: #a78bfa;
        color: #ffffff;
      }
      .madde-metin {
        font-size: 0.97rem;
        line-height: 1.85;
        color: #cbd5e1;
      }
      .madde-metin p {
        margin: 0 0 0.95rem 0;
        text-indent: 1.25rem;
      }
      .madde-metin p:last-child {
        margin-bottom: 0;
      }
      .fıkra-no {
        font-weight: 800;
        color: #a78bfa;
        margin-right: 6px;
        background: rgba(167, 139, 250, 0.15);
        padding: 1px 6px;
        border-radius: 5px;
        font-size: 0.88rem;
      }
      .bent-list {
        margin: 0.75rem 0 1rem 1.5rem;
        padding: 0;
        list-style-type: none;
      }
      .bent-list li {
        margin-bottom: 0.55rem;
        position: relative;
        padding-left: 1.6rem;
        line-height: 1.7;
      }
      .bent-list li::before {
        content: '•';
        position: absolute;
        left: 0;
        color: #a78bfa;
        font-weight: 800;
        font-size: 1.1rem;
      }

      /* Kırmızı Çizgi / Dokunulmazlık Damgası */
      .dokunulmaz-madde {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.09) 0%, rgba(185, 28, 28, 0.03) 100%);
        border: 1px solid rgba(239, 68, 68, 0.4);
        position: relative;
      }
      .dokunulmaz-madde .madde-baslik-etiketi {
        color: #fca5a5;
      }
      .dokunulmaz-badge {
        background: rgba(239, 68, 68, 0.25);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.5);
        padding: 3px 10px;
        border-radius: 7px;
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        animation: pulseRed 3s infinite;
      }
      @keyframes pulseRed {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      }

      /* Resmî Ceza ve İntizam Cetveli Tablosu */
      .resmi-tablo-wrapper {
        overflow-x: auto;
        margin-top: 1.35rem;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.38);
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
      }
      .resmi-tablo {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 0.92rem;
      }
      .resmi-tablo th {
        background: rgba(167, 139, 250, 0.16);
        color: #c4b5fd;
        padding: 15px 20px;
        font-weight: 800;
        border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        white-space: nowrap;
        text-transform: uppercase;
        font-size: 0.82rem;
        letter-spacing: 0.06em;
      }
      .resmi-tablo td {
        padding: 14px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
      }
      .resmi-tablo tr:hover td {
        background: rgba(255, 255, 255, 0.035);
      }
      .yaptirim-ihrac {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.45);
        padding: 4px 11px;
        border-radius: 7px;
        font-size: 0.82rem;
        font-weight: 700;
        display: inline-block;
      }
      .yaptirim-uzaklasma {
        background: rgba(245, 158, 11, 0.25);
        color: #fcd34d;
        border: 1px solid rgba(245, 158, 11, 0.45);
        padding: 4px 11px;
        border-radius: 7px;
        font-size: 0.82rem;
        font-weight: 700;
        display: inline-block;
      }
      .yaptirim-susturma {
        background: rgba(99, 102, 241, 0.25);
        color: #c7d2fe;
        border: 1px solid rgba(99, 102, 241, 0.45);
        padding: 4px 11px;
        border-radius: 7px;
        font-size: 0.82rem;
        font-weight: 700;
        display: inline-block;
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
        font-size: 0.9rem;
        color: #64748b;
        margin-bottom: 1.5rem;
      }
      .empty-search-btn {
        background: rgba(167, 139, 250, 0.2);
        border: 1px solid #a78bfa;
        color: #fff;
        padding: 8px 18px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
      }

      /* Resmî Mühür ve İmzalar */
      .resmi-imza-alani {
        background: linear-gradient(135deg, rgba(20, 20, 38, 0.96) 0%, rgba(10, 10, 22, 0.98) 100%);
        border: 1px solid rgba(167, 139, 250, 0.35);
        border-radius: 20px;
        padding: 3rem 2rem;
        margin-top: 4rem;
        text-align: center;
        position: relative;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        scroll-margin-top: 165px;
      }
      .imza-ust-baslik {
        font-size: 1.35rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 0.65rem;
      }
      .imza-aciklama {
        color: #94a3b8;
        font-size: 0.98rem;
        max-width: 750px;
        margin: 0 auto 2.25rem;
        line-height: 1.7;
      }
      .muhur-grid {
        display: flex;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
      }
      .muhur-kutusu {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        padding: 1.75rem 2.75rem;
        background: rgba(0, 0, 0, 0.45);
        border: 2px dashed rgba(167, 139, 250, 0.55);
        border-radius: 18px;
        position: relative;
        min-width: 280px;
        transition: transform 0.2s;
      }
      .muhur-kutusu:hover {
        transform: translateY(-3px);
        border-color: #a78bfa;
      }
      .muhur-kurum {
        font-size: 0.82rem;
        color: #94a3b8;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .muhur-imzaci {
        font-size: 1.55rem;
        font-weight: 900;
        color: #a78bfa;
        letter-spacing: 0.05em;
      }
      .muhur-unvan {
        font-size: 0.94rem;
        font-weight: 600;
        color: #e2e8f0;
        margin-top: 3px;
      }
      .muhur-kod {
        font-family: monospace;
        font-size: 0.78rem;
        color: #64748b;
        margin-top: 12px;
        background: rgba(255, 255, 255, 0.04);
        padding: 3px 10px;
        border-radius: 6px;
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

      /* Print CSS */
      @media print {
        body {
          background: #ffffff !important;
          color: #000000 !important;
        }
        header, .mevzuat-nav, .quick-chips-wrapper, .madde-paylas-btn, .btn-scroll-top, .anayasa-toast {
          display: none !important;
        }
        .mevzuat-wrapper {
          padding: 0 !important;
          max-width: 100% !important;
          color: #000000 !important;
        }
        .resmi-header, .kanun-bolum, .kanun-madde, .preamble-card, .resmi-imza-alani {
          background: transparent !important;
          border: 1px solid #ccc !important;
          box-shadow: none !important;
          color: #000000 !important;
          break-inside: avoid;
        }
        .resmi-portal-title, .bolum-baslik, .madde-baslik-etiketi, .preamble-title, .meta-value {
          color: #000000 !important;
        }
        .madde-metin, .resmi-tablo td {
          color: #222222 !important;
        }
        .fıkra-no {
          background: #eee !important;
          color: #000 !important;
        }
        .dokunulmaz-badge, .yaptirim-ihrac, .yaptirim-uzaklasma, .yaptirim-susturma {
          border: 1px solid #000 !important;
          color: #000 !important;
          background: transparent !important;
        }
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
        .nav-controls-right {
          width: 100%;
          justify-content: space-between;
        }
        .jump-select {
          flex: 1;
        }
        .jump-select select {
          width: 100%;
        }
        .kanun-bolum {
          padding: 1.5rem 1.1rem;
        }
        .kanun-madde {
          padding: 1.2rem 1.1rem;
        }
        .muhur-kutusu {
          width: 100%;
          min-width: auto;
          padding: 1.5rem;
        }
      }
    </style>

    <div class="mevzuat-wrapper">
      <!-- RESMÎ BAŞLIK & METADATA -->
      <header class="resmi-header">
        <div class="resmi-emblem">🇹🇷 ⭐</div>
        <div class="resmi-state-title">EkoYıldız Dijital Topluluk Federasyonu</div>
        <h1 class="resmi-portal-title">EkoYıldız Topluluğu Resmî Anayasası</h1>
        
        <div class="resmi-metadata-grid">
          <div class="meta-item">
            <div class="meta-label">Mevzuat Türü</div>
            <div class="meta-value">Temel Anayasa Metni</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Mevzuat No</div>
            <div class="meta-value">2026/01</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Kabul Tarihi</div>
            <div class="meta-value">07 Temmuz 2026</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Yürürlük Durumu</div>
            <div class="meta-value" style="color: #34d399;">● Mer'iyette (Yürürlükte)</div>
          </div>
        </div>
      </header>

      <!-- BAŞLANGIÇ (PREAMBLE) -->
      <div class="preamble-card">
        <div class="preamble-title">📜 Başlangıç ve İlan Hükümleri</div>
        EkoYıldız Topluluğu; dijital evrende ilmin, medeniyetin, yapıcı müzakere kültürünün ve ortak üretimin ön planda tutulduğu emniyetli ve saygın bir sosyal mecra tesis etmek; bireysel hürriyetler ile kamu emniyeti arasındaki sarsılmaz dengeyi tahkim eylemek; adaleti, liyakati, şeffaflığı ve insan onurunu güvence altına almak amacıyla işbu Anayasa'yı en üstün, amir ve bağlayıcı normlar hiyerarşisinin zirvesi olarak kabul, ilan ve tescil eder.
      </div>

      <!-- NAVİGASYON VE ARAMA (FIXED & RESPONSIVE) -->
      <div class="mevzuat-nav">
        <div class="search-container">
          <span class="search-icon-fixed">🔍</span>
          <input type="text" id="mevzuat-ara" placeholder="Madde no, fıkra veya terim ara (örn: Madde 4, Doxxing, Mute, Telif, KVKK, AYM)..." oninput="mevzuatAra()">
          <button id="search-clear" class="search-clear-btn" onclick="aramaTemizle()" title="Aramayı Temizle">✕</button>
        </div>
        
        <div class="nav-controls-right">
          <div class="jump-select">
            <select id="mevzuat-bolum-sec" onchange="bolumeGit(this.value)">
              <option value="">⚡ Resmî Fihrist (Bölüme Git)...</option>
              <option value="#on-esaslar">📌 Başlangıç ve Ön Esaslar</option>
              <option value="#bolum-1">🏛️ KISIM I: Genel Hükümler ve İlkeler (Md. 1-5)</option>
              <option value="#bolum-2">👑 KISIM II: Yönetim Teşkilatı ve Hiyerarşi (Md. 6-10)</option>
              <option value="#bolum-3">👥 KISIM III: Üyelik Statüsü ve Haklar (Md. 11-15)</option>
              <option value="#bolum-4">💬 KISIM IV: İletişim ve Muhabere Düzeni (Md. 16-19)</option>
              <option value="#bolum-5">🛡️ KISIM V: Güvenlik, KVKK ve Yasaklar (Md. 20-24)</option>
              <option value="#bolum-6">⚖️ KISIM VI: Ceza ve Disiplin Hukuku (Md. 25-28)</option>
              <option value="#ceza-cetveli">⚖️ KISIM VI Cetvel: Resmî Yaptırım Matrisi</option>
              <option value="#bolum-7">🎨 KISIM VII: Etkinlikler ve Fikri Mülkiyet (Md. 29-32)</option>
              <option value="#bolum-8">🤝 KISIM VIII: Dış Münasebetler ve Temsil (Md. 33-36)</option>
              <option value="#bolum-9">🗳️ KISIM IX: Değişiklik Usulü ve Kırmızı Çizgiler (Md. 37-41)</option>
              <option value="#bolum-10">📜 KISIM X: Yürürlük ve İcra Hükümleri (Md. 42-44)</option>
              <option value="#resmi-imzalar">✍️ Resmî Mühür ve İmzalar</option>
            </select>
          </div>
          <button class="btn-print" onclick="window.print()" title="Resmî Belge Olarak Yazdır veya PDF Kaydet">🖨️ Yazdır / PDF</button>
        </div>

        <div id="search-info" class="search-results-info"></div>
      </div>

      <!-- HIZLI KISAYOLLAR -->
      <div class="quick-chips-wrapper">
        <div class="quick-chips">
          <a href="#on-esaslar" class="quick-chip">📌 Ön Esaslar</a>
          <a href="#bolum-1" class="quick-chip">Kısım I: İlkeler</a>
          <a href="#bolum-2" class="quick-chip">Kısım II: Yönetim</a>
          <a href="#bolum-3" class="quick-chip">Kısım III: Haklar</a>
          <a href="#bolum-4" class="quick-chip">Kısım IV: İletişim</a>
          <a href="#bolum-5" class="quick-chip">Kısım V: Güvenlik</a>
          <a href="#ceza-cetveli" class="quick-chip" style="border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">⚖️ Ceza Cetveli</a>
          <a href="#bolum-7" class="quick-chip">Kısım VII: Projeler</a>
          <a href="#bolum-8" class="quick-chip">Kısım VIII: Dış İlişkiler</a>
          <a href="#madde-40" class="quick-chip" style="border-color: rgba(245, 158, 11, 0.4); color: #fcd34d;">🚨 Dokunulmaz Hükümler</a>
          <a href="#bolum-10" class="quick-chip">Kısım X: Yürürlük</a>
          <a href="#resmi-imzalar" class="quick-chip">✍️ Resmî Tasdik</a>
        </div>
      </div>

      <!-- BOŞ ARAMA SONUCU BİLDİRİMİ -->
      <div id="empty-search" class="empty-search-state">
        <div class="empty-search-icon">🔍</div>
        <div class="empty-search-text">Aramanızla Eşleşen Madde Bulunamadı</div>
        <div class="empty-search-sub">Lütfen arama ifadenizi kontrol ediniz veya filtrelemeyi temizleyerek tüm anayasa metnini görüntüleyiniz.</div>
        <button class="empty-search-btn" onclick="aramaTemizle()">Aramayı Temizle</button>
      </div>

      <!-- ÖN ESASLAR -->
      <section id="on-esaslar" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">BAŞLANGIÇ DÜZENLEMELERİ</div>
          <h2 class="bolum-baslik">📌 Ön Bilgilendirme ve Hukuki Bağlam</h2>
        </div>

        <div class="kanun-madde" id="madde-on-1">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">I. Metnin Niteliği, Hiyerarşik Konumu ve Bağlayıcılığı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-on-1')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> İşbu mevzuat belgesi, EkoYıldız Discord Topluluğu ("Topluluk") içerisindeki asayişi, iç barışı, etik standartları, hak arama hürriyetini ve operasyonel işleyiş hiyerarşisini tayin eden en üst düzey dijital anayasa metnidir.</p>
            <p><span class="fıkra-no">(2)</span> Metin içerisinde geçen "Anayasa" tabiri, topluluğun iç bağlayıcı normlar hiyerarşisinin en tepe noktasını temsil eden kurucu normlar kümesini ifade eder.</p>
            <p><span class="fıkra-no">(3)</span> Sunucuya iltihak eden, bot doğrulama sistemini tamamlayan veya sunucuya ait herhangi bir yazılı/sesli mecrada etkileşim kuran her gerçek kişi, bu Anayasa'nın tüm amir hükümlerini peşinen okumuş, anlamış ve kabul etmiş addolunur. Kurallardan ve anayasa hükümlerinden haberdar olmamak hiçbir surette mazeret olarak ileri sürülemez.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-on-2">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">II. Resmî Lisan, İntizam Şartı ve Yargı Güvencesi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-on-2')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> <strong>Resmî Lisan:</strong> EkoYıldız Topluluğu'nun ana ve resmî muhabere dili Türkçedir. Uluslararası diplomatik misafirler ve yabancı ortaklık müzakereleri haricinde sunucu genelinde Türk dilinin kurallarına ve zarafetine uygun iletişim esastır.</p>
            <p><span class="fıkra-no">(2)</span> <strong>Adil Yargılanma ve İtiraz Güvencesi:</strong> Disiplin veya idari bir tasarrufa muhatap olan her ferd, adil yargılanma ve gerekçeli karar hakkına maliktir. Haksızlığa uğradığını iddia eden her üye, Resmî Destek Bilet Sistemi yahut Anayasa Mahkemesi (AYM) Bireysel Başvuru yolu ile itiraz hakkını kullanabilir.</p>
            <p><span class="fıkra-no">(3)</span> <strong>İntizam Şartı:</strong> Topluluğun salahiyeti ve kamu düzeni namına yetkili moderatörlerin meşru talimatlarına riayet kuraldır. Yetkisiz güç kullanımı ise şikayete tabidir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM I -->
      <section id="bolum-1" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM I</div>
          <h2 class="bolum-baslik">🏛️ Genel Hükümler, Kurucu Değerler ve Temel İlkeler (Md. 1-5)</h2>
        </div>

        <div class="kanun-madde" id="madde-1">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 1 – Tanımlamalar, Şümul (Kapsam) ve Topluluk Hudutları</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-1')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> İşbu Anayasa metninde zikredilen "Topluluk", "Sunucu" veya "EkoYıldız" kavramları; EkoYıldız Discord ana sunucusu, alt komisyon odaları, entegre bot servisleri, resmi web portalları ve EkoYıldız tasarrufunda bulunan tüm dijital alanları kapsar.</p>
            <p><span class="fıkra-no">(2)</span> Bu Anayasa hükümleri; Kurucular Kurulu, İdare Heyeti, Divan Kurulu, Moderasyon Kadrosu, Teknik Personel, tüm onaylı üyeler ve geçici ziyaretçileri istisnasız bağlar.</p>
            <p><span class="fıkra-no">(3)</span> Topluluk namına düzenlenen resmî etkinlikler, harici sunuculardaki ortak faaliyetler ve EkoYıldız adına icra edilen tüm diplomatik münasebetlerde işbu Anayasa'nın ruhu ve lafzı amirdir.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-2">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 2 – Topluluğun Gayesi, Ahlaki Çerçevesi ve Siyasetsizlik İlkesi
              <span class="dokunulmaz-badge">MUTLAK DOKUNULMAZ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-2')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Topluluğu; üyelerinin bilgi, görgü ve kabiliyetlerini artırmayı, fikir teatisinde bulunabileceği medeni bir müzakere iklimi oluşturmayı, ortak yazılım ve içerik projeleri üretmeyi gaye edinir.</p>
            <p><span class="fıkra-no">(2)</span> <strong>Siyasetsizlik ve Tarafsızlık Güvencesi:</strong> EkoYıldız Topluluğu hiçbir siyasi partiye, fırkaya, ideolojik hizbe, ticari holdinge veya dini cemaate tabi değildir. Sunucu mecralarında siyasi propaganda yapmak, hizipçilik gütmek veya topluluğu siyasi menfaatlere alet etmek kesinlikle memnudur (yasaktır).</p>
            <p><span class="fıkra-no">(3)</span> Topluluk, cumhuriyetimizin kurucusu Gazi Mustafa Kemal Atatürk'ün çağdaş medeniyet idealleri, ilim sevgisi ve vatanperverlik şuuru ile milli manevi müştereklere saygıyı en temel ahlaki zemin olarak benimser.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-3">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 3 – Anayasanın Üstünlüğü, Normlar Hiyerarşisi ve Kanunilik</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-3')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Anayasası hükümleri; sunucu içerisindeki tüm alt talimatnamelerin, kanal yönergelerinin, moderasyon teamüllerinin ve yetkili emirlerinin fevkindedir (üstündedir).</p>
            <p><span class="fıkra-no">(2)</span> Anayasa'nın lafzına veya ruhuna aykırı hiçbir idari emir ittihaz olunamaz; aykırı düzenlemeler re'sen yok hükmündedir (butlanla maluldür).</p>
            <p><span class="fıkra-no">(3)</span> <strong>Kanunların Geriye Yürümezliği:</strong> Yeni kabul edilen kural ve cezai normlar ilan edildikleri andan itibaren geçerli olup; geriye yürütülerek geçmiş eylemlere ceza tayin edilemez.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-4">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 4 – Temel İnsan Hakları, Eşitlik ve Ayrımcılık Yasağı
              <span class="dokunulmaz-badge">MUTLAK DOKUNULMAZ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-4')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Her üye; dil, ırk, renk, cinsiyet, felsefi inanç, din, mezhep ve sosyoekonomik durum tefriki yapılmaksızın hukuk ve intizam önünde mutlak surette eşittir.</p>
            <p><span class="fıkra-no">(2)</span> İnsan onur ve haysiyetini ayaklar altına alan her türlü aşağılama, tahkir, nefret söylemi, ırkçılık, siber zorbalık, linç teşebbüsü ve hedef gösterme fiilleri <strong>ihtarsız süresiz ihraç (kalıcı ban)</strong> müeyyidesine tabidir.</p>
            <p><span class="fıkra-no">(3)</span> İfade hürriyeti; başkalarının hürriyet alanını tahrip etme, kamu sükununu bozma veya nefret ekme cüretini ve selahiyetini bahşetmez.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-5">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 5 – Topluluk Kimliği, Doğa ve Ekolojik Denge Felsefesi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-5')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> "EkoYıldız" unvanı; tabiatın ahengi ile dijital teknolojinin yaratıcı gücünün sentezini remzeder. Topluluk mensupları bu saygın kimliğe yaraşır vakar ve nezaket içerisinde hareket etmekle mükelleftir.</p>
            <p><span class="fıkra-no">(2)</span> Paylaşımlarda yapıcı tenkit, bilimsel yaklaşım ve ekolojik duyarlılık teşvik edilir; çevreye, canlı hayatına ve toplumsal sağduyuya hakaret içeren yaklaşımlar men olunur.</p>
          </div>
        </div>
      </section>

      <!-- KISIM II -->
      <section id="bolum-2" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM II</div>
          <h2 class="bolum-baslik">👑 Yönetim Teşkilatı, Moderasyon Hiyerarşisi ve Yetki Taksimi (Md. 6-10)</h2>
        </div>

        <div class="kanun-madde" id="madde-6">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 6 – Yönetim Erkinin Menşei, Şeffaflık ve Hesap Verebilirlik</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-6')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Yönetim mercileri salahiyetlerini münhasıran Anayasa'dan ve kamu nizamını muhafaza mükellefiyetinden alır. Hiçbir şahıs veya kurul, kaynağını Anayasa'dan almayan bir idari ve cezai yetkiyi kullanamaz.</p>
            <p><span class="fıkra-no">(2)</span> İdarenin her türlü tasarrufu hukuka ve mantık kaidelerine uygun olmak zorundadır. Keyfi muamele, kin ve husumetle hareket etmek en ağır idari cürümlerden sayılır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-7">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 7 – İdari Teşkilat Yapısı ve Hiyerarşik Kademeler</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-7')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız İdari Hiyerarşisi aşağıda sıralanan yetkili organ ve kadrolardan teşekkül eder:</p>
            <ul class="bent-list">
              <li><strong>Kurucular Kurulu (Founders):</strong> Topluluğun nihai temsil, anayasal denetim, stratejik karar ve mutlak veto yetkisine haiz en yüksek meclisidir.</li>
              <li><strong>Üst Yönetim ve İdare Heyeti (High Council & Admins):</strong> Sunucunun genel idari, teşkilat ve komisyon sevkini yürüten yüksek icra organıdır.</li>
              <li><strong>Moderatörler Heyeti (Moderators):</strong> Sahada kamu asayişini temin eden, kanalları denetleyen ve ilk tahkikatı yürüten icra kadrosudur.</li>
              <li><strong>Teknik ve Bot Heyeti (Systems & Developers):</strong> Sunucu siber altyapısını, bot algoritmalarını ve veritabanı emniyetini yöneten teknik kuruldur.</li>
              <li><strong>Stajyer Kadro (Trial Staff):</strong> İdare Heyeti gözetiminde tecrübe kazanan ve sınırlı yetkiyle vazife ifa eden aday heyettir.</li>
            </ul>
          </div>
        </div>

        <div class="kanun-madde" id="madde-8">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 8 – Tarafsızlık İlkesi, Şahsi Çıkar Yasağı ve Delil Mecburiyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-8')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Moderasyon kadrosu üyeler arasında cereyan eden hadiselerde tarafsız bir hakem mesabesindedir. Ahbap-çavuş ilişkisiyle ceza indirimi veya kayırmacılık yapılamaz.</p>
            <p><span class="fıkra-no">(2)</span> <strong>Delil Mecburiyeti:</strong> Tatbik edilen her türlü susturma (mute), karantina, atma (kick) veya ihraç (ban) muamelesi; ekran görüntüsü, ses kaydı, bot kütüğü (log) veya tanık beyanı ile kayıt altına alınmak mecburiyetindedir. Delilsiz cezalar talep halinde hükümsüz kılınır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-9">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 9 – İdari Denetim, Yetki Gaspı ve Görevden El Çektirme (Azil)</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-9')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Salahiyetini suiistimal eden, üyelere kaba ve küçümseyici muamelede bulunan yahut idari mahremiyeti haiz gizli kayıtları harice sızdıran yetkililer hakkında derhal idari tahkikat açılır.</p>
            <p><span class="fıkra-no">(2)</span> Kusurlu bulunan yetkiliye fiilin vehametine göre; Kınama, Yetki Tenzili (Rütbe Düşürme), Geçici Yetki Askısı veya Daimi Azil (İhraç) müeyyideleri tatbik edilir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-10">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 10 – Hak Arama Hürriyeti ve İdari İşlemlere İtiraz Hakkı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-10')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Aleyhine idari veya disiplin işlemi tesis edilen her üye, işlemin tebliğinden itibaren 72 saat zarfında Resmî Bilet Hattı (Ticket) üzerinden üst kurula yazılı itiraz hakkını haizdir.</p>
            <p><span class="fıkra-no">(2)</span> İtirazlar en geç 48 saat içerisinde incelenir; haksız veya usulsüz olduğu tespit edilen tasarruflar iptal edilerek mağdurun itibarı iade olunur.</p>
          </div>
        </div>
      </section>

      <!-- KISIM III -->
      <section id="bolum-3" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM III</div>
          <h2 class="bolum-baslik">👥 Üyelik Statüsü, Temel Haklar, Vecibeler ve Rol Düzeni (Md. 11-15)</h2>
        </div>

        <div class="kanun-madde" id="madde-11">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 11 – Üyelik Sıfatının Kazanılması, Doğrulama ve Şahsi Mesuliyet</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-11')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sunucuya intisap eden ve resmî kayıt/doğrulama protokollerini başarıyla tamamlayan her şahıs "EkoYıldız Topluluk Üyesi" hukuki sıfatını iktisap eder.</p>
            <p><span class="fıkra-no">(2)</span> Her kullanıcı kendi Discord hesabının emniyetinden ve hesabından gerçekleştirilen tüm yazılı, sesli ve görsel eylemlerden şahsen ve hukuken münhasıran mesuldür.</p>
            <p><span class="fıkra-no">(3)</span> "Hesabım çalındı", "kardeşim yazdı" veya "arkadaşım yaptı" şeklindeki beyanlar disiplin hukuku karşısında mesuliyeti ortadan kaldıran meşru bir mazeret kabul edilmez.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-12">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 12 – Üyelerin Temel Hak ve Teminatları</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-12')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Topluluk üyeleri; emniyetli, nezih ve sükun dolu bir dijital muhitte bulunma, düşüncelerini medeni çerçevede serbestçe ifade etme ve bilgiye adil koşullarda erişme hakkına sahiptir.</p>
            <p><span class="fıkra-no">(2)</span> Hiçbir üye Anayasa'da açıkça men edilmemiş bir eylem sebebiyle kınanamaz, küçük düşürülemez veya sunucu kanallarından sebepsiz yere tecrit edilemez.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-13">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 13 – Üyelerin Temel Vecibeleri ve Topluluk Sadakati</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-13')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Üyeler; topluluğun huzurunu muhafaza etmek, diğer üyelerin hak ve hukukuna saygı göstermek, sunucu içi intizam kurallarına uymak ve yıkıcı tutumlardan kaçınmakla mükelleftir.</p>
            <p><span class="fıkra-no">(2)</span> Sunucu aleyhine gizli kumpas kurmak, üyeleri kışkırtarak toplu isyan ve ayrılık tertiplemek yahut harici mecralarda sunucuyu karalama kampanyası başlatmak ağır sadakatsizlik cürmü sayılır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-14">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 14 – Rol Hiyerarşisi, Yetkilendirme Esasları ve Rol Gaspı Yasağı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-14')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sunucu içi roller liyakat, aktif katılım, güvenilirlik ve idari takdir prensipleri dairesinde Kurucular ve İdare Heyeti marifetiyle tevdi edilir.</p>
            <p><span class="fıkra-no">(2)</span> Sahip olunmayan bir rolü taklit etmek, bot yetkilerini suistimal ederek rol hiyerarşisini delmeye yeltenmek veya yetkili sıfatını haksız yere takınmak kesinlikle yasaktır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-15">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 15 – Rol ve Ayrıcalıkların Ticarete Konu Edilememesi (Satış Yasağı)</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-15')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız bünyesindeki idari makamlar, moderasyon kadroları, VIP unvanları ve teknik roller hiçbir surette nakdi para, oyun içi eşya veya harici menfaat mukabilinde satılamaz, kiralanamaz ve devredilemez.</p>
            <p><span class="fıkra-no">(2)</span> Rol rüşveti teklif eden veya alan tarafların unvanları re'sen iptal edilir ve şahıslar süresiz olarak topluluktan ihraç olunur.</p>
          </div>
        </div>
      </section>

      <!-- KISIM IV -->
      <section id="bolum-4" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM IV</div>
          <h2 class="bolum-baslik">💬 İletişim Standartları, Sesli/Yazılı Muhabere ve Topluluk Huzuru (Md. 16-19)</h2>
        </div>

        <div class="kanun-madde" id="madde-16">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 16 – Muhabere Âdabı, Dil Nezaketi ve Genel Chat İntizamı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-16')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Genel sohbet kanallarında karşılıklı saygı, nezaket ve edep kuralları caridir. Şahısların ailevi, mukaddes ve şahsi değerlerine yönelik küfür, argo ve alaycı sataşmalar yasaktır.</p>
            <p><span class="fıkra-no">(2)</span> Fikir ayrılıklarında seviyeli münazara kültürü korunur; şahsiyata inen kaba üslup susturma müeyyidesiyle cezalandırılır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-17">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 17 – Spam, Flood, Büyük Harf (Capslock) ve Kanal Dışı Yazım</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-17')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Kanalların akışını tahrif eden peş peşe anlamsız mesaj gönderme (spam), uzun metin kopyalama (flood), emojilerle kanal doldurma ve bağırış hissi uyandıran sürekli büyük harf (capslock) kullanımı men edilmiştir.</p>
            <p><span class="fıkra-no">(2)</span> Her kanal münhasıran tahsis edildiği konuya uygun olarak kullanılır. Kod kanallarında geyik sohbeti, genel sohbette komut istismarı gibi konu dışı (off-topic) taşkınlıklar yetkili personelin ikazıyla derhal sonlandırılır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-18">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 18 – Reklam, İzinsiz Tanıtım ve DM Tacizi Memnuiyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-18')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Kurucular Kurulu'nun resmî yazılı onayı olmaksızın sunucu kanallarında harici Discord sunucu daveti, YouTube/Twitch yayın linki, ticari ürün reklamı veya referanslı gelir bağlantısı paylaşmak mutlak surette yasaktır.</p>
            <p><span class="fıkra-no">(2)</span> Sunucu üyelerinin özel mesaj kutularına (DM) topluluk kanalı vasıtasıyla ulaşıp izinsiz reklam, sahte hediye linki veya rahatsız edici mesaj gönderenler <strong>ihtarsız süresiz ihraç</strong> edilir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-19">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 19 – Sesli Kanalların Kullanımı, Ses Kayıt Yasağı ve Profil Standartları</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-19')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sesli odalarda mikrofon basarak çığlık atmak, kulak tırmalayıcı gürültü yapmak, ses değiştirici programları suiistimal etmek ve soundboard araçlarıyla başkalarının konuşma hakkını gasp etmek yasaktır.</p>
            <p><span class="fıkra-no">(2)</span> <strong>İzinsiz Ses Kaydı Yasağı:</strong> Sesli odada bulunan üyelerin açık rızası hilafına gizlice ses ve görüntü kaydı almak, bunu şantaj veya alay malzemesi yapmak ağır suçtur.</p>
            <p><span class="fıkra-no">(3)</span> Kullanıcıların sunucu içi profil resimleri, kullanıcı adları, durum mesajları ve biyografileri kamu ahlakına, milli değerlere ve sunucu intizamına uygun olmak mecburiyetindedir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM V -->
      <section id="bolum-5" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM V</div>
          <h2 class="bolum-baslik">🛡️ Siber Güvenlik, Kişisel Veriler (KVKK), Mahremiyet ve Ağır Yasaklar (Md. 20-24)</h2>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-20">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 20 – Kişisel Verilerin Korunması ve Doxxing / İfşa Yasağı
              <span class="dokunulmaz-badge">MUTLAK DOKUNULMAZ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-20')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Gerçek kişilerin adı, soyadı, T.C. kimlik numarası, telefon numarası, ikametgah adresi, ailevi bilgileri, şahsi fotoğrafları, okul/işyeri kayıtları veya özel hayatın gizliliğini ihlal eden herhangi bir verinin izinsiz neşredilmesi (Doxxing) mutlak surette yasaktır.</p>
            <p><span class="fıkra-no">(2)</span> Doxxing fiilini işleyen yahut üyeleri ifşa ile tehdit ve şantaj eden fail, <strong>ihtarsız olarak süresiz ihraç (Perm-Ban)</strong> edilir; deliller adli makamlara resmi suç duyurusu olarak intikal ettirilir.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-21">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 21 – Siber Güvenlik, Zararlı Yazılım, Token Grabber ve Phishing Yasağı
              <span class="dokunulmaz-badge">AĞIR SİBER SUÇ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-21')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Virüs, truva atı (trojan), keylogger, Discord token hırsızı (token grabber), sahte Nitro/hediye dolandırıcılığı (phishing) ve şifre çalmaya matuf zararlı kod barındıran hiçbir dosya veya bağlantı paylaşılamaz.</p>
            <p><span class="fıkra-no">(2)</span> Sunucuya yönelik DDoS, spam-bot akını, webhook suistimali veya altyapıyı çökertmeye dönük sabotaj girişimleri doğrudan kalıcı ihraç ve global kara liste yaptırımı ile neticelenir.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-22">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 22 – Kamu Ahlakı, Müstehcenlik (NSFW) ve Cinsel Teşhir Yasağı
              <span class="dokunulmaz-badge">AĞIR SUÇ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-22')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Pornografik, cinsel çağrışım uyandıran, aşırı teşhir içeren yahut kamu ahlakını zedeleyen resim, video, çizim ve metinlerin sunucunun hiçbir kanalında (özel NSFW kanalları da dahil olmak üzere) paylaşılmasına müsaade edilmez.</p>
            <p><span class="fıkra-no">(2)</span> Reşit olmayan bireylerin istismarına matuf en ufak bir emare dahi tespit edildiğinde derhal adli mercilere ve siber suçlarla mücadele şubelerine bildirimde bulunulur.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-23">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 23 – Vahşet, Kan (NSFL), İntihar ve Şiddet Tasvirlerinin Men'i
              <span class="dokunulmaz-badge">AĞIR SUÇ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-23')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> İnsan yahut hayvan cesetleri, ağır yaralanma, vahşet, kan, infaz, terör eylemleri tasviri (gore/NSFL) ile intihar ve kendine zarar verme temalı tüm içerikler mutlak olarak yasaklanmıştır.</p>
            <p><span class="fıkra-no">(2)</span> Terör örgütlerini övücü, şiddeti kutsayıcı veya insanlık dışı muameleleri meşrulaştırıcı paylaşımlarda bulunanlar süresiz olarak men edilir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-24">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 24 – Sanal Flört, E-Date ve Bireyleri Rahatsız Edici Yaklaşımların Yasağı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-24')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız; kültür, yazılım, oyun ve bilgi paylaşım platformudur. Sunucu mecraları çöpçatanlık, sanal sevgililik (e-dating) veya flörtleşme gayesiyle suiistimal edilemez.</p>
            <p><span class="fıkra-no">(2)</span> Kadın veya erkek üyeleri ısrarla özel mesajlardan rahatsız etmek, flört teklifleriyle taciz boyutuna varan darlık yaşatmak ve huzursuzluk yaratmak süresiz uzaklaştırma sebebidir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM VI: RESMÎ CEZA CETVELİ -->
      <section id="bolum-6" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM VI</div>
          <h2 class="bolum-baslik">⚖️ Ceza ve Disiplin Hukuku, Yargı Usulü ve Yaptırım Cetveli (Md. 25-28)</h2>
        </div>

        <div class="kanun-madde" id="madde-25">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 25 – Suçta ve Cezada Kanunilik Prensibi ve Cezaların Şahsiliği</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-25')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Anayasa'da ve bağlı tüzüklerde açıkça suç sayılmayan hiçbir fiilden dolayı kimseye disiplin cezası uygulanamaz.</p>
            <p><span class="fıkra-no">(2)</span> <strong>Cezaların Şahsiliği:</strong> Disiplin cezaları münhasıran kabahati ika eden şahsa tatbik edilir; failin arkadaşlarına veya aynı gruptaki masum üyelere kolektif ceza verilemez.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-26">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 26 – Disiplin Yaptırımlarının Nevileri ve Kademeli Ceza Sistemi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-26')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Hukukunda tatbik olunacak resmî disiplin cezaları hafiften ağıra doğru şunlardır:</p>
            <ul class="bent-list">
              <li><strong>Sözlü ve Yazılı İhtar (Warn):</strong> İhlalin hafif olduğu durumlarda failin kaydına işlenen resmî ikazdır.</li>
              <li><strong>Süreli Susturma (Timeout / Mute):</strong> 5 dakikadan 7 güne kadar üyenin yazma ve konuşma salahiyetinin askıya alınmasıdır.</li>
              <li><strong>İntizam Karantinası (Jail):</strong> Tahkikat neticelenene kadar üyenin yalnızca tecrit kanalında bulunması tedbiridir.</li>
              <li><strong>Sunucudan Çıkarma (Kick):</strong> Tekrar katılım hakkı saklı kalmak üzere sunucudan çıkarılmadır.</li>
              <li><strong>Süreli İhraç (Temp-Ban):</strong> 1 günden 30 güne kadar sunucuya erişimin engellenmesidir.</li>
              <li><strong>Kalıcı İhraç (Perm-Ban):</strong> Ağır cürümlerde sunucuyla ilişiğin süresiz olarak kesilmesidir.</li>
            </ul>
          </div>
        </div>

        <!-- CETVEL TABLOSU -->
        <div class="kanun-madde" id="ceza-cetveli">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 27 – Resmî İntizam ve Yaptırım Cetveli (Ceza Matrisi Tablosu)</div>
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
                    <td><strong>Fikri Mülkiyet ve Korsan Paylaşımı</strong></td>
                    <td>İçerik İptali + İhtar</td>
                    <td><span class="yaptirim-uzaklasma">1 Gün Süreli İhraç</span></td>
                    <td><span class="yaptirim-uzaklasma">7 Gün Süreli İhraç</span></td>
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
                  <tr>
                    <td><strong>Yan Hesapla (Alt-Acc) Cezadan Kaçış</strong></td>
                    <td><span class="yaptirim-uzaklasma">Asıl ve Yan Hesap 7 Gün Ban</span></td>
                    <td colspan="2"><span class="yaptirim-ihrac">Tüm Hesaplar İçin Kalıcı İhraç</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="kanun-madde" id="madde-28">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 28 – Sicil Affı, Zamanaşımı ve İnfaz İndirimi Hükümleri</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-28')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Son ceza tarihinden itibaren aralıksız 6 ay müddetle hiçbir disiplin suçu işlemeyen üyelerin hafif disiplin kayıtları arşive kaldırılarak sicilleri temizlenir.</p>
            <p><span class="fıkra-no">(2)</span> Doxxing, terör propagandası, dolandırıcılık ve çocuk istismarı fiillerinden mahkum olanlar hiçbir sicil affından veya cezai indirimden yararlanamaz.</p>
          </div>
        </div>
      </section>

      <!-- KISIM VII -->
      <section id="bolum-7" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM VII</div>
          <h2 class="bolum-baslik">🎨 Etkinlikler, Projeler, Fikri Mülkiyet ve Ortak Eserler (Md. 29-32)</h2>
        </div>

        <div class="kanun-madde" id="madde-29">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 29 – Resmî Topluluk Etkinlikleri ve Katılım Esasları</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-29')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız adına düzenlenen turnuva, seminer, bilgi yarışması ve çalıştaylar Etkinlik Komisyonu marifetiyle yürütülür.</p>
            <p><span class="fıkra-no">(2)</span> Etkinliklerde hile yapan, trolleme girişiminde bulunan veya diğer yarışmacıları sabote edenlerin tüm ödül hakları iptal edilir ve disiplin işlemi başlatılır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-30">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 30 – Fikri Mülkiyet, Telif Hakları ve Korsan Paylaşım Yasağı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-30')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Başkalarına ait yazılımların, kod bloklarının, grafik tasarımların veya telifli eserlerin izinsiz neşredilmesi (korsan paylaşım, warez, crack) yasaktır.</p>
            <p><span class="fıkra-no">(2)</span> Eser sahibinin haklı telif ihtarı üzerine ilgili içerik derhal kaldırılır ve ihlali ika eden üye uyarılır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-31">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 31 – Kolektif Eserler, Geliştirici Projeleri ve EkoYıldız Lisansı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-31')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız laboratuvarlarında topluluk desteğiyle üretilen açık kaynaklı yazılım ve projeler, aksi kararlaştırılmadıkça topluluğun manevi himayesindedir.</p>
            <p><span class="fıkra-no">(2)</span> Geliştiricilerin emeği kutsaldır; topluluk projelerinden izinsiz kod kopyalayıp harici platformlarda kendi eseri gibi pazarlayanlar ihraç olunur.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-32">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 32 – Topluluk İçi Bağış, Çekiliş ve Ödül Dağıtım Kuralları</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-32')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sunucu bünyesinde icra edilecek tüm hediye çekilişleri ve ödüllü müsabakalar İdare Heyeti'nin onay ve nezaretine tabidir.</p>
            <p><span class="fıkra-no">(2)</span> Çekiliş sonuçlarında sahtecilik yapmak, kazananı kayırmak veya vaat edilen ödülü teslim etmemek dolandırıcılık suçu olarak değerlendirilir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM VIII -->
      <section id="bolum-8" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM VIII</div>
          <h2 class="bolum-baslik">🤝 Dış Münasebetler, Diplomatik Temsil ve Partnerlik Hukuku (Md. 33-36)</h2>
        </div>

        <div class="kanun-madde" id="madde-33">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 33 – Temsil Salahiyeti ve Resmî Beyanat Yetkisi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-33')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Topluluğu'nu harici sunucularda, kamuoyunda, basında ve sosyal medyada temsil etme salahiyeti münhasıran Kurucular Kurulu ve yetkilendirilmiş Baş Temsilcilere aittir.</p>
            <p><span class="fıkra-no">(2)</span> Yetkisi olmadığı halde topluluk namına harici mecralarda beyanat veren, vaatte bulunan yahut kurum adına bağlayıcı taahhütlerde bulunan şahıslar hakkında cezai tahkikat yapılır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-34">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 34 – Harici Topluluklarla Partnerlik, İttifak ve Ortak Protokoller</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-34')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Başka Discord sunucuları veya platformlarla akdedilecek partnerlik (ortaklık) muahedeleri karşılıklı saygı, üye emniyeti ve menfaat dengesi esasına göre tanzim edilir.</p>
            <p><span class="fıkra-no">(2)</span> EkoYıldız Anayasası'nın temel ilkelerine ve ahlaki duruşuna aykırı yayın yapan topluluklarla hiçbir şart altında ortaklık kurulamaz.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-35">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 35 – Topluluk Menfaatlerinin Korunması ve Dış Tehditlere Mukavemet</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-35')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Harici sunuculardan EkoYıldız'a yönelen baskın (raid), karalama, spam saldırısı veya sabotaj girişimlerine karşı İdare Heyeti olağanüstü emniyet tedbirleri almaya yetkilidir.</p>
            <p><span class="fıkra-no">(2)</span> Saldırıyı organize eden yahut içeriden işbirliği sağlayan hain unsurlar derhal tespit edilerek kalıcı şekilde aforoz edilir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-36">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 36 – Temsilcilerin Hesap Verebilirliği ve Diplomatik İntizam</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-36')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Dış temsilciler yürüttükleri müzakereler ve temaslar hakkında Kurucular Kurulu'na muntazaman rapor vermekle mükelleftir.</p>
            <p><span class="fıkra-no">(2)</span> Diplomatik nezakete riayet etmeyen ve topluluğun prestijini sarsan temsilciler derhal görevden alınır.</p>
          </div>
        </div>
      </section>

      <!-- KISIM IX -->
      <section id="bolum-9" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM IX</div>
          <h2 class="bolum-baslik">🗳️ Anayasa Değişikliği, Yasama Usulü ve Değiştirilemez Hükümler (Md. 37-41)</h2>
        </div>

        <div class="kanun-madde" id="madde-37">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 37 – Anayasa Değişikliği Teklifi ve Gerekçe Şartı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-37')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Anayasa'nın dokunulmaz maddeleri haricindeki hükümleri için değişiklik teklifi; Kuruculardan biri veya İdare Heyeti üyelerinin en az salt çoğunluğu tarafından yazılı gerekçesiyle birlikte sunulabilir.</p>
            <p><span class="fıkra-no">(2)</span> Gerekçesiz ve kamu yararı taşımayan değişiklik teklifleri Divan marifetiyle doğrudan reddedilir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-38">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 38 – Değişiklik Tekliflerinin Müzakeresi ve Komisyon İncelemesi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-38')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Usulüne uygun sunulan değişiklik teklifleri Hukuk Komisyonu tarafından 7 gün süreyle incelenir ve etki analiz raporu tanzim edilir.</p>
            <p><span class="fıkra-no">(2)</span> İnceleme sürecinde topluluk üyelerinin görüş ve temennileri anketler marifetiyle istişare edilebilir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-39">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 39 – Kabul Yeter Sayısı ve Kurucular Kurulu Onayı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-39')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Anayasa değişiklik metninin yürürlüğe girebilmesi için İdare Heyeti'nin en az üçte iki (2/3) ekseriyet oyu ve Kurucular Kurulu'nun müşterek tasdiki şarttır.</p>
            <p><span class="fıkra-no">(2)</span> Kurucular Kurulu'nun onaylamadığı hiçbir teklif yasalaşamaz.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-40">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 40 – Değiştirilemez Hükümler (Kırmızı Çizgiler / Mutlak Dokunulmazlık)
              <span class="dokunulmaz-badge">MUTLAK DOKUNULMAZ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-40')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Anayasası'nın temel omurgasını ve varlık sebebini teşkil eden;</p>
            <ul class="bent-list">
              <li><strong>Madde 2:</strong> Topluluğun Gayesi, Ahlaki Çerçevesi ve Siyasetsizlik İlkesi,</li>
              <li><strong>Madde 4:</strong> Temel İnsan Hakları, Eşitlik ve Ayrımcılık Yasağı,</li>
              <li><strong>Madde 20:</strong> Kişisel Verilerin Korunması ve Doxxing / İfşa Yasağı,</li>
              <li><strong>Madde 21:</strong> Siber Güvenlik, Zararlı Yazılım ve Sabotaj Yasağı,</li>
              <li><strong>Madde 22:</strong> Kamu Ahlakı ve Müstehcenlik (NSFW) Yasağı,</li>
              <li><strong>Madde 40:</strong> Değiştirilemez Hükümler Güvencesi,</li>
            </ul>
            <p>hükümleri <strong>hiçbir surette değiştirilemez, ilga edilemez ve bunların değiştirilmesi teklif dahi edilemez.</strong> Bu yöndeki teklifler yok hükmünde olup oylamaya sunulamaz.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-41">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 41 – Değişikliklerin Neşri, İlanı ve Yürürlüğe Girişi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-41')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Kabul edilen değişiklikler Resmî Duyuru kanalında ve Resmî Mevzuat Portalında neşrolunur ve ilan edilen tarihte yürürlüğe girer.</p>
          </div>
        </div>
      </section>

      <!-- KISIM X -->
      <section id="bolum-10" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM X</div>
          <h2 class="bolum-baslik">📜 Geçici Maddeler, Yürürlük ve İcra Salahiyeti (Md. 42-44)</h2>
        </div>

        <div class="kanun-madde" id="madde-42">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 42 – Geçici İntibak Hükümleri ve Müktesep Hakların Korunması</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-42')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> İşbu Anayasa'nın yürürlüğe girmesinden önce ihdas edilmiş alt yönergeler ve kanal kuralları, Anayasa'ya aykırı olmayan hükümleri nispetinde mer'iyetini muhafaza eder; çelişen kurallar re'sen mülga olur.</p>
            <p><span class="fıkra-no">(2)</span> Eski kurallar uyarınca tesis edilmiş nihai disiplin cezaları müktesep hak gereğince muhafaza edilir; ancak devam eden infazlarda lehe olan Anayasa hükümleri tatbik olunur.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-43">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 43 – Anayasanın Yürürlük Tarihi ve Resmî Neşri</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-43')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Toplam 10 Kısım ve 44 Maddeden müteşekkil işbu EkoYıldız Topluluğu Anayasası, Kurucular Kurulu tarafından kabul edilerek Resmî Gazete / Portal üzerinde neşredildiği <strong>07 Temmuz 2026</strong> tarihi itibarıyla tam olarak mer'iyete (yürürlüğe) girmiştir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-44">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 44 – Anayasa Hükümlerini İcra ve Yürütme Salahiyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-44')">🔗 Paylaş</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> İşbu Anayasa hükümlerini icra, teftiş ve tatbik etmeye Kurucular Kurulu ve Yüksek İdare Heyeti yetkilidir.</p>
            <p><span class="fıkra-no">(2)</span> Topluluğun tüm organları, heyetleri ve personeli bu Anayasa'nın uygulanmasını temin etmekle mükelleftir.</p>
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

    <!-- SAYFA İÇİ TOAST BİLDİRİMİ -->
    <div id="anayasa-toast" class="anayasa-toast">
      <span>🔗</span>
      <span id="toast-message">Madde Bağlantısı Kopyalandı!</span>
    </div>

    <!-- BAŞA DÖN BUTONU -->
    <button id="btn-scroll-top" class="btn-scroll-top" onclick="basaDon()" title="Sayfa Başına Dön">⬆</button>

    <!-- İNTERAKTİF İSTEMCİ SCRİPTİ -->
    <script>
      function bolumeGit(secici) {
        if (!secici) return;
        const hedef = document.querySelector(secici);
        if (hedef) {
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
        const kelime = input.value.toLowerCase().trim();
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
          infoDiv.innerHTML = '🔍 "<b>' + kelime + '</b>" ifadesiyle eşleşen <b>' + toplamEslenen + '</b> madde listeleniyor.';
        }

        if (emptyState) {
          emptyState.style.display = (toplamEslenen === 0) ? 'block' : 'none';
        }
      }

      // Sayfa yüklendiğinde URL hash varsa oraya odaklan
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
  return _layout("EkoYıldız Topluluğu Resmî Anayasası & Mevzuat Portalı", user, content, "", "/anayasasi");
}

module.exports = {
  renderEkoYildizAnayasaPage
};
