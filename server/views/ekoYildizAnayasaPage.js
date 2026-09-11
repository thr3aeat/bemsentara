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
        margin: 0.75rem 0 1rem 1.75rem;
        padding: 0;
        list-style-type: none;
      }
      .bent-list li {
        margin-bottom: 0.55rem;
        position: relative;
        padding-left: 1.6rem;
        line-height: 1.7;
      }
      .bent-list li.bent-a::before { content: 'a)'; position: absolute; left: 0; color: #a78bfa; font-weight: 800; }
      .bent-list li.bent-b::before { content: 'b)'; position: absolute; left: 0; color: #a78bfa; font-weight: 800; }
      .bent-list li.bent-c::before { content: 'c)'; position: absolute; left: 0; color: #a78bfa; font-weight: 800; }
      .bent-list li.bent-d::before { content: 'd)'; position: absolute; left: 0; color: #a78bfa; font-weight: 800; }
      .bent-list li.bent-e::before { content: 'e)'; position: absolute; left: 0; color: #a78bfa; font-weight: 800; }

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

      <!-- BAŞLANGIÇ / ÖNSÖZ -->
      <div class="preamble-card" id="onsoz">
        <div class="preamble-title">📜 Başlangıç / Önsöz</div>
        <p>EkoYıldız Topluluğu; dijital evrende bilginin, adaletin, yapıcı tartışma kültürünün ve kolektif üretimin ön planda tutulduğu saygın ve güvenli bir sosyal alan inşa etmek; bireysel hürriyetler ile kamu düzeni arasındaki sarsılmaz dengeyi kurmak, liyakat ve insan onurunu güvence altına almak amacıyla işbu Anayasa'yı en üstün bağlayıcı normlar bütünü olarak kabul ve ilan eder.</p>
        <p style="margin-top: 0.75rem;">Topluluk çatısı altında bulunan her fert, düzenin tesisi ve hakkaniyetin idamesi için ortak ahlaki ve hukuki zemin olan bu metne sadakatle bağlı kalmayı taahhüt eder.</p>
      </div>

      <!-- NAVİGASYON VE ARAMA -->
      <div class="mevzuat-nav">
        <div class="search-container">
          <span class="search-icon-fixed">🔍</span>
          <input type="text" id="mevzuat-ara" placeholder="Madde no, fıkra veya terim ara (örn: Madde 8, Savunma, Olağanüstü Hâl, AYM, Delil)..." oninput="mevzuatAra()">
          <button id="search-clear" class="search-clear-btn" onclick="aramaTemizle()" title="Aramayı Temizle">✕</button>
        </div>
        
        <div class="nav-controls-right">
          <div class="jump-select">
            <select id="mevzuat-bolum-sec" onchange="bolumeGit(this.value)">
              <option value="">⚡ Resmî Fihrist (Bölüme Git)...</option>
              <option value="#onsoz">📜 Başlangıç / Önsöz</option>
              <option value="#bolum-1">🏛️ KISIM I: Temel Esaslar (Md. 1-5)</option>
              <option value="#bolum-2">👥 KISIM II: Üyelerin Temel Hak ve Teminatları (Md. 6-9)</option>
              <option value="#bolum-3">🛡️ KISIM III: Üyelerin Yükümlülükleri ve Sadakat (Md. 10-13)</option>
              <option value="#bolum-4">📜 KISIM IV: Yasama ve Kural Koyma Erki (Md. 14-15)</option>
              <option value="#bolum-5">👑 KISIM V: Yürütme Organı ve Günlük İdare (Md. 16-18)</option>
              <option value="#bolum-6">🔒 KISIM VI: Yetki Sınırları ve İdari Denetim (Md. 19-21)</option>
              <option value="#bolum-7">⚖️ KISIM VII: Yargı, Disiplin Hukuku ve Yaptırımlar (Md. 22-26)</option>
              <option value="#ceza-cetveli">⚖️ KISIM VII Cetvel: Resmî Yaptırım Matrisi</option>
              <option value="#bolum-8">🚨 KISIM VIII: Olağanüstü Hâl ve Güvenlik Tedbirleri (Md. 27-28)</option>
              <option value="#bolum-9">🗳️ KISIM IX: Anayasa Değişikliği ve Dokunulmazlık (Md. 29-30)</option>
              <option value="#bolum-10">📜 KISIM X: Son Hükümler ve Yürürlük (Md. 31-32)</option>
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
          <a href="#onsoz" class="quick-chip">📜 Önsöz</a>
          <a href="#bolum-1" class="quick-chip">Kısım I: Esaslar</a>
          <a href="#bolum-2" class="quick-chip">Kısım II: Haklar</a>
          <a href="#bolum-3" class="quick-chip">Kısım III: Yükümlülükler</a>
          <a href="#bolum-4" class="quick-chip">Kısım IV: Yasama</a>
          <a href="#bolum-5" class="quick-chip">Kısım V: Yürütme</a>
          <a href="#bolum-6" class="quick-chip">Kısım VI: Yetki Sınırı</a>
          <a href="#ceza-cetveli" class="quick-chip" style="border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">⚖️ Yargı & Ceza Cetveli</a>
          <a href="#bolum-8" class="quick-chip" style="border-color: rgba(245, 158, 11, 0.4); color: #fcd34d;">🚨 Olağanüstü Hâl</a>
          <a href="#madde-30" class="quick-chip" style="border-color: rgba(239, 68, 68, 0.5); color: #fca5a5;">🔒 Kırmızı Çizgiler</a>
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

      <!-- KISIM I: TEMEL ESASLAR -->
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
