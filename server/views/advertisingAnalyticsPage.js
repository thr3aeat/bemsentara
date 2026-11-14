'use strict';

/**
 * advertisingAnalyticsPage.js
 *
 * EkoYıldız Partner Studio — "Nereden Nereye" İnteraktif Topluluk Büyüme & Analiz Merkezi
 * Reklam vermekten şüphe duyan topluluklar için somut büyüme grafiklerini,
 * önce/sonra kıyaslamalarını ve etkileşim eğrilerini sunar.
 */

function renderAdvertisingAnalyticsPage(user = null) {
  const PARTNERS_DATA = [
    {
      id: 'impreius',
      name: 'İMPREİUS FAMİLY',
      category: 'Topluluk & Sohbet Patlaması',
      color: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.35)',
      beforeLabel: '150 Üye',
      afterLabel: '980 Üye',
      beforeVal: 150,
      afterVal: 980,
      unit: 'Üye',
      growthPct: '+553%',
      extraMetricLabel: 'Sohbet Aktifliği',
      extraMetricVal: '45 Mesaj / Dk',
      summary: '150 üyeli başlangıç seviyesinden 980 üyeye hızlı ve organik bir sıçrama. Tanıtım sonrası sunucu sohbetinde dakikada 45 mesajlık kalıcı canlılık yakalandı.',
      videoUrl: 'https://www.youtube.com/watch?v=fNrMzxYGP64&t=1225s&pp=0gcJCWMAwfN6Pr3D',
      weeklyMembers: [150, 290, 510, 740, 890, 950, 980],
      weeklyEngagement: [8, 22, 38, 45, 42, 44, 45]
    },
    {
      id: 'tta',
      name: 'TTA TURKISH ARMED FORCES',
      category: 'Denetim & Aktiflik Artışı',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.35)',
      beforeLabel: '15 Aktif',
      afterLabel: '65 Aktif',
      beforeVal: 15,
      afterVal: 65,
      unit: 'Denetim Aktifi',
      growthPct: '+333%',
      extraMetricLabel: 'Etkinlik Dönemi',
      extraMetricVal: 'Haziran 2025',
      summary: '15 güncel aktiflik seviyesinden 65 denetim aktifliğine yükselerek askeri rol yapma alanında rekor katılıma ulaştı.',
      videoUrl: 'https://www.youtube.com/watch?v=vYT9LFfzHxc&t=149s',
      weeklyMembers: [15, 21, 32, 48, 57, 62, 65],
      weeklyEngagement: [12, 19, 31, 46, 55, 61, 65]
    },
    {
      id: 'asker-map',
      name: 'Asker Oyunu Map Sağlayıcısı',
      category: 'Ticari Lansman & Sipariş',
      color: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.35)',
      beforeLabel: '0 Sipariş',
      afterLabel: '15 Sipariş/Ay',
      beforeVal: 0,
      afterVal: 15,
      unit: 'Aylık Sipariş',
      growthPct: 'Sıfırdan Zirveye',
      extraMetricLabel: 'Sipariş Bandı',
      extraMetricVal: '10–15 / Ay',
      summary: 'Pazara sıfırdan çıktığı ilk dönemde EkoYıldız kanalında tanıtıldı ve aylık 10–15 düzenli siparişe ulaştı. (Sonradan operasyonunu kapattı — şeffaf arşiv).',
      videoUrl: 'https://www.youtube.com/watch?v=op1ipqwgxRU&t=8s',
      weeklyMembers: [0, 3, 6, 9, 12, 14, 15],
      weeklyEngagement: [0, 18, 34, 52, 68, 76, 82]
    }
  ];

  const serializedPartners = JSON.stringify(PARTNERS_DATA);

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#060813">
  <title>Nereden Nereye Analizleri — EkoYıldız Partner Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #060813;
      --surface: rgba(16, 22, 44, 0.78);
      --surface-elevated: rgba(24, 32, 64, 0.9);
      --border: rgba(255, 255, 255, 0.09);
      --border-strong: rgba(255, 255, 255, 0.18);
      --text: #f8fafc;
      --muted: #94a3b8;
      --rose: #f43f5e;
      --indigo: #6366f1;
      --emerald: #10b981;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 15% 10%, rgba(244, 63, 94, 0.12), transparent 38%),
                  radial-gradient(circle at 85% 20%, rgba(99, 102, 241, 0.14), transparent 40%),
                  var(--bg);
      color: var(--text);
      font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      line-height: 1.55;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    .shell { max-width: 1180px; margin: 0 auto; padding: 0 22px; }

    /* Top Bar */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(16px);
      background: rgba(6, 8, 19, 0.82);
      border-bottom: 1px solid var(--border);
    }
    .topbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      height: 70px;
    }
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-strong);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.92rem;
      transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
    }
    .btn-back:hover {
      transform: translateX(-3px);
      background: rgba(244, 63, 94, 0.16);
      border-color: rgba(244, 63, 94, 0.55);
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 1rem;
      color: #e2e8f0;
    }
    .topbar-badge {
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.16);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #6ee7b7;
      font-size: 0.74rem;
      font-weight: 800;
    }
    .btn-cta-top {
      padding: 10px 18px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f43f5e, #e11d48);
      color: #fff;
      font-weight: 800;
      font-size: 0.9rem;
      box-shadow: 0 8px 24px rgba(225, 29, 72, 0.32);
    }

    /* Hero */
    .hero { padding: 44px 0 28px; text-align: center; }
    .hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(244, 63, 94, 0.14);
      border: 1px solid rgba(244, 63, 94, 0.36);
      color: #fda4af;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .hero h1 {
      font-size: clamp(2rem, 4.2vw, 3.1rem);
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1.12;
      margin-bottom: 14px;
    }
    .hero h1 span {
      background: linear-gradient(135deg, #fb7185, #818cf8, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      max-width: 700px;
      margin: 0 auto;
      color: var(--muted);
      font-size: 1.02rem;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 28px 0 32px;
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    .kpi-card::after {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    }
    .kpi-label { font-size: 0.8rem; color: var(--muted); font-weight: 600; margin-bottom: 6px; }
    .kpi-val { font-size: 1.9rem; font-weight: 900; letter-spacing: -0.02em; }
    .kpi-sub { font-size: 0.8rem; color: #cbd5e1; margin-top: 4px; }

    /* Partner Selector Tabs */
    .selector-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      margin-bottom: 24px;
    }
    .partner-tab {
      padding: 11px 20px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 180ms ease;
    }
    .partner-tab:hover { border-color: var(--border-strong); color: #fff; }
    .partner-tab.is-active {
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.22), rgba(99, 102, 241, 0.22));
      border-color: rgba(244, 63, 94, 0.6);
      color: #ffffff;
      box-shadow: 0 8px 24px rgba(244, 63, 94, 0.18);
    }

    /* Main Interactive Dashboard Grid */
    .dash-grid {
      display: grid;
      grid-template-columns: 1.45fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 24px;
      position: relative;
    }
    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .panel-title { font-size: 1.12rem; font-weight: 800; }
    .panel-sub { font-size: 0.84rem; color: var(--muted); }

    .mode-pills {
      display: inline-flex;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 3px;
      gap: 4px;
    }
    .mode-pill {
      padding: 6px 12px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .mode-pill.is-active {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }

    /* SVG Chart Container */
    .chart-wrap {
      position: relative;
      width: 100%;
      height: 300px;
    }
    .chart-svg { width: 100%; height: 100%; overflow: visible; }
    .chart-tooltip {
      position: absolute;
      pointer-events: none;
      background: rgba(10, 14, 30, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.82rem;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
      opacity: 0;
      transform: translate(-50%, -110%);
      transition: opacity 120ms ease;
      z-index: 20;
      min-width: 170px;
    }
    .chart-tooltip.is-visible { opacity: 1; }

    /* Before -> After Comparison Bars */
    .journey-list { display: flex; flex-direction: column; gap: 16px; }
    .journey-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
    }
    .journey-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .journey-name { font-weight: 800; font-size: 0.96rem; }
    .journey-delta {
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 800;
      background: rgba(16, 185, 129, 0.16);
      color: #6ee7b7;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 72px 1fr 78px;
      align-items: center;
      gap: 10px;
      margin-top: 6px;
      font-size: 0.82rem;
    }
    .bar-track {
      height: 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.07);
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 650ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Simulator Section */
    .sim-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: center;
    }
    .sim-controls { display: flex; flex-direction: column; gap: 16px; }
    .sim-slider { width: 100%; accent-color: #f43f5e; cursor: pointer; }
    .sim-result-box {
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.14), rgba(99, 102, 241, 0.14));
      border: 1px solid rgba(244, 63, 94, 0.35);
      border-radius: 18px;
      padding: 22px;
      text-align: center;
    }
    .sim-arrow {
      font-size: clamp(1.5rem, 3vw, 2.2rem);
      font-weight: 900;
      margin: 10px 0;
      color: #fff;
    }

    /* Bottom Footer CTA */
    .bottom-cta {
      margin: 34px 0 60px;
      padding: 28px;
      border-radius: 22px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .bottom-actions { display: flex; gap: 12px; flex-wrap: wrap; }

    @media (max-width: 960px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .dash-grid { grid-template-columns: 1fr; }
      .sim-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .topbar-brand span.hide-sm { display: none; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="shell topbar-inner">
      <a class="btn-back" href="/reklam/ekoyildiz-ortaklik#isbirlikleri" id="btnBackTop">
        <span aria-hidden="true">←</span>
        <span>Geri Dön</span>
      </a>
      <div class="topbar-brand">
        <span class="hide-sm">EkoYıldız Partner Studio</span>
        <span class="topbar-badge">CANLI ANALİZ</span>
      </div>
      <a class="btn-cta-top" href="/tickets/new?category=reklam">Reklam Talebi Aç</a>
    </div>
  </header>

  <main class="shell">
    <section class="hero">
      <div class="hero-pill">📈 Nereden Nereye • Şeffaf Büyüme Raporları</div>
      <h1>Toplulukların <span>Gerçek Sıçrama Grafikleri</span></h1>
      <p>
        Reklam vermeden önce tereddüt etmen çok normal. EkoYıldız ile çalışan toplulukların reklam öncesi ve sonrası verilerini, haftalık ivme eğrilerini ve etkileşim dönüşümlerini aşağıdan interaktif olarak incele.
      </p>
    </section>

    <section class="kpi-grid" aria-label="Özet İstatistikler">
      <div class="kpi-card">
        <div class="kpi-label">En Yüksek Üye Sıçraması</div>
        <div class="kpi-val" style="color:#fb7185;">+%553</div>
        <div class="kpi-sub">150 üyeden 980 üyeye (İMPREİUS)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Zirve Sohbet Aktifliği</div>
        <div class="kpi-val" style="color:#818cf8;">45 Msj/Dk</div>
        <div class="kpi-sub">Tanıtım sonrası organik sohbet hızı</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Denetim Katılım Artışı</div>
        <div class="kpi-val" style="color:#34d399;">+%333</div>
        <div class="kpi-sub">15 aktiften 65 denetim aktifine (TTA)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Ticari Dönüşüm</div>
        <div class="kpi-val" style="color:#fbbf24;">10–15 / Ay</div>
        <div class="kpi-sub">Sıfırdan aylık düzenli sipariş</div>
      </div>
    </section>

    <div class="selector-bar" role="tablist" aria-label="Topluluk Seçimi">
      <button type="button" class="partner-tab is-active" data-partner="all" onclick="selectPartner('all')">🌐 Tümünü Karşılaştır</button>
      <button type="button" class="partner-tab" data-partner="impreius" onclick="selectPartner('impreius')">🏆 İMPREİUS FAMİLY</button>
      <button type="button" class="partner-tab" data-partner="tta" onclick="selectPartner('tta')">🛡️ TTA TURKISH ARMED FORCES</button>
      <button type="button" class="partner-tab" data-partner="asker-map" onclick="selectPartner('asker-map')">📦 Asker Oyunu Map</button>
    </div>

    <section class="dash-grid">
      <!-- Sol: İnteraktif SVG Zaman Serisi Grafiği -->
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title" id="chartTitle">Haftalık Büyüme Eğrisi (Nereden ➔ Nereye)</h2>
            <p class="panel-sub" id="chartSub">Noktaların üzerine gelerek haftalık değişimi inceleyin</p>
          </div>
          <div class="mode-pills" role="group" aria-label="Grafik Modu">
            <button type="button" class="mode-pill is-active" id="modeMembers" onclick="setChartMode('members')">Büyüme Hacmi</button>
            <button type="button" class="mode-pill" id="modeEngagement" onclick="setChartMode('engagement')">Etkileşim İndeksi</button>
          </div>
        </div>
        <div class="chart-wrap" id="chartWrap">
          <svg class="chart-svg" id="growthSvg" viewBox="0 0 680 280" preserveAspectRatio="none"></svg>
          <div class="chart-tooltip" id="chartTooltip"></div>
        </div>
      </div>

      <!-- Sağ: Önce -> Sonra Karşılaştırma -->
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Önce vs Sonra Kıyaslaması</h2>
            <p class="panel-sub">Reklam öncesi başlangıç ve ulaşılan seviye</p>
          </div>
        </div>
        <div class="journey-list" id="journeyList"></div>
      </div>
    </section>

    <!-- İnteraktif Büyüme Simülatörü -->
    <section class="panel" style="margin-bottom:24px;">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">🎯 Kendi Topluluğun İçin Büyüme Simülatörü</h2>
          <p class="panel-sub">Mevcut üye veya aktiflik sayını seç, geçmiş EkoYıldız partner verilerine göre olası yükseliş bandını gör.</p>
        </div>
      </div>
      <div class="sim-grid">
        <div class="sim-controls">
          <div>
            <label for="simInput" style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:8px;">
              <span>Mevcut Topluluk / Aktiflik Sayın:</span>
              <span id="simInputVal" style="color:#fb7185;">150 Üye</span>
            </label>
            <input class="sim-slider" id="simInput" type="range" min="30" max="1500" step="10" value="150" oninput="updateSimulator()">
          </div>
          <div>
            <span style="display:block;font-weight:700;margin-bottom:8px;">Hedeflenen Kampanya Yoğunluğu:</span>
            <div class="mode-pills">
              <button type="button" class="mode-pill sim-tier" data-mult="2.4" onclick="setSimTier(this)">Başlangıç (2.4x)</button>
              <button type="button" class="mode-pill sim-tier is-active" data-mult="4.2" onclick="setSimTier(this)">Standart (4.2x)</button>
              <button type="button" class="mode-pill sim-tier" data-mult="6.5" onclick="setSimTier(this)">Tam Lansman (6.5x)</button>
            </div>
          </div>
        </div>
        <div class="sim-result-box">
          <div style="font-size:0.82rem;color:#fda4af;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;">Öngörülen Nereden ➔ Nereye Bandı</div>
          <div class="sim-arrow" id="simOutput">150 ➔ 630 Üye</div>
          <div style="font-size:0.86rem;color:#cbd5e1;" id="simNote">Geçmiş EkoYıldız partnerlerinin gerçek sıçrama oranları baz alınarak hesaplanan örnek projeksiyondur.</div>
        </div>
      </div>
    </section>

    <section class="bottom-cta">
      <div>
        <h3 style="font-size:1.2rem;font-weight:800;margin-bottom:4px;">Verileri inceledin — şimdi sıra senin topluluğunda.</h3>
        <p style="color:var(--muted);font-size:0.92rem;">Partner Studio’ya geri dönüp paketleri inceleyebilir veya doğrudan reklam talebi oluşturabilirsin.</p>
      </div>
      <div class="bottom-actions">
        <a class="btn-back" href="/reklam/ekoyildiz-ortaklik#isbirlikleri" id="btnBackBottom">← Partner Studio’ya Geri Dön</a>
        <a class="btn-cta-top" href="/tickets/new?category=reklam">Hemen Reklam Talebi Oluştur →</a>
      </div>
    </section>
  </main>

  <script>
    const PARTNERS = ${serializedPartners};
    const WEEKS = ['Başlangıç', '1. Hafta', '2. Hafta', '3. Hafta', '4. Hafta', '5. Hafta', '6. Hafta'];
    let activePartner = 'all';
    let chartMode = 'members';
    let simMultiplier = 4.2;

    function selectPartner(id) {
      activePartner = id;
      document.querySelectorAll('.partner-tab').forEach(b => {
        b.classList.toggle('is-active', b.dataset.partner === id);
      });
      renderChart();
      renderJourneys();
    }

    function setChartMode(mode) {
      chartMode = mode;
      document.getElementById('modeMembers').classList.toggle('is-active', mode === 'members');
      document.getElementById('modeEngagement').classList.toggle('is-active', mode === 'engagement');
      renderChart();
    }

    function getVisiblePartners() {
      return activePartner === 'all' ? PARTNERS : PARTNERS.filter(p => p.id === activePartner);
    }

    function renderChart() {
      const svg = document.getElementById('growthSvg');
      const tooltip = document.getElementById('chartTooltip');
      const list = getVisiblePartners();
      const W = 680, H = 280, padL = 46, padR = 24, padT = 20, padB = 34;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;

      const allVals = list.flatMap(p => chartMode === 'members' ? p.weeklyMembers : p.weeklyEngagement);
      const maxVal = Math.max(10, ...allVals) * 1.12;

      let html = '';
      // Grid lines
      for (let i = 0; i <= 4; i++) {
        const y = padT + (plotH * i) / 4;
        const val = Math.round(maxVal * (1 - i / 4));
        html += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 4"/>';
        html += '<text x="' + (padL - 8) + '" y="' + (y + 4) + '" text-anchor="end" fill="#64748b" font-size="11" font-weight="600">' + val + '</text>';
      }
      // Week labels
      WEEKS.forEach((lbl, idx) => {
        const x = padL + (plotW * idx) / (WEEKS.length - 1);
        html += '<text x="' + x + '" y="' + (H - 8) + '" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600">' + lbl + '</text>';
      });

      // Lines & Areas
      list.forEach((p) => {
        const series = chartMode === 'members' ? p.weeklyMembers : p.weeklyEngagement;
        const pts = series.map((v, idx) => {
          const x = padL + (plotW * idx) / (series.length - 1);
          const y = padT + plotH - (v / maxVal) * plotH;
          return { x, y, v, idx };
        });
        const linePath = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1)).join(' ');
        const areaPath = linePath + ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (padT + plotH) + ' L' + pts[0].x.toFixed(1) + ',' + (padT + plotH) + ' Z';
        html += '<path d="' + areaPath + '" fill="' + p.color + '" fill-opacity="0.11"/>';
        html += '<path d="' + linePath + '" fill="none" stroke="' + p.color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
        pts.forEach((pt) => {
          html += '<circle cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '" r="5.5" fill="#060813" stroke="' + p.color + '" stroke-width="3" style="cursor:pointer" data-pid="' + p.id + '" data-idx="' + pt.idx + '"/>';
        });
      });

      svg.innerHTML = html;

      svg.querySelectorAll('circle[data-pid]').forEach((c) => {
        c.addEventListener('mouseenter', () => {
          const p = PARTNERS.find(item => item.id === c.dataset.pid);
          const idx = Number(c.dataset.idx);
          const series = chartMode === 'members' ? p.weeklyMembers : p.weeklyEngagement;
          const unit = chartMode === 'members' ? p.unit : 'İndeks Puanı';
          tooltip.innerHTML = '<div style="font-weight:800;color:' + p.color + ';margin-bottom:4px;">' + p.name + '</div>'
            + '<div style="color:#cbd5e1;">' + WEEKS[idx] + ': <strong style="color:#fff;">' + series[idx] + ' ' + unit + '</strong></div>'
            + '<div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;">Toplam Değişim: ' + p.growthPct + '</div>';
          const cx = (parseFloat(c.getAttribute('cx')) / W) * 100;
          const cy = (parseFloat(c.getAttribute('cy')) / H) * 100;
          tooltip.style.left = cx + '%';
          tooltip.style.top = cy + '%';
          tooltip.classList.add('is-visible');
        });
        c.addEventListener('mouseleave', () => {
          tooltip.classList.remove('is-visible');
        });
      });
    }

    function renderJourneys() {
      const container = document.getElementById('journeyList');
      const list = getVisiblePartners();
      container.innerHTML = list.map((p) => {
        const beforePct = p.afterVal > 0 ? Math.max(8, Math.round((p.beforeVal / p.afterVal) * 100)) : 4;
        return '<div class="journey-item">'
          + '<div class="journey-top">'
          + '  <span class="journey-name">' + p.name + '</span>'
          + '  <span class="journey-delta">' + p.growthPct + '</span>'
          + '</div>'
          + '<div class="bar-row"><span style="color:#94a3b8;">Önce</span><div class="bar-track"><div class="bar-fill" style="width:' + beforePct + '%;background:rgba(148,163,184,0.55);"></div></div><span style="text-align:right;font-weight:700;">' + p.beforeLabel + '</span></div>'
          + '<div class="bar-row"><span style="color:#fff;font-weight:700;">Sonra</span><div class="bar-track"><div class="bar-fill" style="width:100%;background:' + p.color + ';"></div></div><span style="text-align:right;font-weight:800;color:' + p.color + ';">' + p.afterLabel + '</span></div>'
          + '<p style="font-size:0.82rem;color:#94a3b8;margin-top:10px;">' + p.summary + '</p>'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:0.8rem;">'
          + '  <span style="color:#cbd5e1;">' + p.extraMetricLabel + ': <strong>' + p.extraMetricVal + '</strong></span>'
          + '  <a href="' + p.videoUrl + '" target="_blank" rel="noopener noreferrer" style="color:' + p.color + ';font-weight:700;">YouTube Kanıtı ↗</a>'
          + '</div>'
          + '</div>';
      }).join('');
    }

    function setSimTier(btn) {
      simMultiplier = parseFloat(btn.dataset.mult) || 4.2;
      document.querySelectorAll('.sim-tier').forEach(b => b.classList.toggle('is-active', b === btn));
      updateSimulator();
    }

    function updateSimulator() {
      const val = Number(document.getElementById('simInput').value) || 150;
      const projected = Math.round(val * simMultiplier);
      document.getElementById('simInputVal').textContent = val + ' Üye';
      document.getElementById('simOutput').textContent = val + ' ➔ ' + projected + ' Üye';
    }

    renderChart();
    renderJourneys();
    updateSimulator();
  </script>
</body>
</html>`;
}

module.exports = { renderAdvertisingAnalyticsPage };
