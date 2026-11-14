'use strict';

/**
 * advertisingAnalyticsPage.js
 *
 * EkoYıldız Partner Studio — Apple Health / Keynote tarzında
 * "Nereden Nereye" İnteraktif Topluluk Büyüme & Analiz Merkezi.
 */

function renderAdvertisingAnalyticsPage(user = null) {
  const PARTNERS_DATA = [
    {
      id: 'impreius',
      name: 'İMPREİUS FAMİLY',
      category: 'Topluluk & Sohbet Patlaması',
      color: '#2997ff',
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
      weeklyEngagement: [8, 22, 38, 45, 42, 44, 45],
      weeklyPct: [0, 93, 240, 393, 493, 533, 553]
    },
    {
      id: 'tta',
      name: 'TTA TURKISH ARMED FORCES',
      category: 'Denetim & Aktiflik Artışı',
      color: '#30d158',
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
      weeklyEngagement: [12, 19, 31, 46, 55, 61, 65],
      weeklyPct: [0, 40, 113, 220, 280, 313, 333]
    },
    {
      id: 'asker-map',
      name: 'Asker Oyunu Map Sağlayıcısı',
      category: 'Ticari Lansman & Sipariş',
      color: '#ff9f0a',
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
      weeklyEngagement: [0, 18, 34, 52, 68, 76, 82],
      weeklyPct: [0, 100, 200, 300, 400, 460, 500]
    }
  ];

  const serializedPartners = JSON.stringify(PARTNERS_DATA);

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#000000">
  <title>Nereden Nereye Analizleri — EkoYıldız Partner Studio</title>
  <style>
    :root {
      --bg: #000000;
      --surface: #161617;
      --surface-elevated: #1d1d1f;
      --border: rgba(255, 255, 255, 0.09);
      --border-strong: rgba(255, 255, 255, 0.16);
      --text: #f5f5f7;
      --muted: #86868b;
      --sub: #a1a1a6;
      --apple-blue: #0071e3;
      --apple-link: #2997ff;
      --apple-green: #30d158;
      --apple-orange: #ff9f0a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(ellipse 75% 45% at 50% -10%, rgba(0, 113, 227, 0.14), transparent 65%), var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
      letter-spacing: -0.011em;
      font-variant-numeric: tabular-nums;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    .shell { max-width: 1160px; margin: 0 auto; padding: 0 24px; }

    /* Apple Sticky Translucent Header */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 60;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .topbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      height: 60px;
    }
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 980px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: var(--text);
      font-weight: 600;
      font-size: 0.88rem;
      transition: background 180ms ease, transform 180ms ease;
    }
    .btn-back:hover {
      background: rgba(255, 255, 255, 0.14);
      transform: translateX(-2px);
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 0.96rem;
      color: var(--text);
    }
    .topbar-badge {
      padding: 3px 10px;
      border-radius: 980px;
      background: rgba(48, 209, 88, 0.14);
      color: var(--apple-green);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .btn-cta-top {
      padding: 8px 18px;
      border-radius: 980px;
      background: var(--apple-blue);
      color: #fff;
      font-weight: 600;
      font-size: 0.88rem;
      transition: background 180ms ease;
    }
    .btn-cta-top:hover { background: #0077ed; }

    /* Apple Editorial Hero */
    .hero { padding: 56px 0 32px; text-align: center; }
    .hero-eyebrow {
      color: #f56300;
      font-size: 0.88rem;
      font-weight: 600;
      margin-bottom: 10px;
      letter-spacing: 0.01em;
    }
    .hero h1 {
      font-size: clamp(2.1rem, 4.8vw, 3.5rem);
      font-weight: 700;
      letter-spacing: -0.034em;
      line-height: 1.07;
      margin-bottom: 14px;
      color: var(--text);
    }
    .hero h1 span {
      background: linear-gradient(135deg, #f5f5f7 0%, #a1a1a6 55%, #2997ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      max-width: 660px;
      margin: 0 auto;
      color: var(--sub);
      font-size: 1.05rem;
    }

    /* Apple Health-style KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 34px 0 30px;
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 22px;
      transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 240ms ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: var(--border-strong);
    }
    .kpi-label { font-size: 0.8rem; color: var(--muted); font-weight: 600; margin-bottom: 8px; }
    .kpi-val { font-size: 2rem; font-weight: 700; letter-spacing: -0.03em; }
    .kpi-sub { font-size: 0.8rem; color: var(--sub); margin-top: 6px; }

    /* Apple Segmented Control */
    .selector-wrap { display: flex; justify-content: center; margin-bottom: 26px; }
    .selector-bar {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 4px;
      border-radius: 980px;
      background: rgba(118, 118, 128, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .partner-tab {
      padding: 9px 18px;
      border-radius: 980px;
      border: none;
      background: transparent;
      color: var(--sub);
      font-weight: 600;
      font-size: 0.86rem;
      cursor: pointer;
      transition: all 180ms ease;
    }
    .partner-tab:hover { color: var(--text); }
    .partner-tab.is-active {
      background: var(--surface-elevated);
      color: #ffffff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
    }

    /* Bento Dashboard Grid */
    .dash-grid {
      display: grid;
      grid-template-columns: 1.45fr 1fr;
      gap: 20px;
      margin-bottom: 22px;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 26px;
      position: relative;
    }
    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .panel-title { font-size: 1.15rem; font-weight: 700; letter-spacing: -0.02em; }
    .panel-sub { font-size: 0.84rem; color: var(--muted); margin-top: 2px; }

    .mode-pills {
      display: inline-flex;
      background: rgba(118, 118, 128, 0.22);
      border-radius: 980px;
      padding: 3px;
      gap: 3px;
    }
    .mode-pill {
      padding: 6px 13px;
      border-radius: 980px;
      border: none;
      background: transparent;
      color: var(--sub);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 160ms ease;
    }
    .mode-pill.is-active {
      background: #3a3a3c;
      color: #ffffff;
    }

    /* SVG Chart */
    .chart-wrap {
      position: relative;
      width: 100%;
      height: 310px;
    }
    .chart-svg { width: 100%; height: 100%; overflow: visible; }
    .chart-tooltip {
      position: absolute;
      pointer-events: none;
      background: rgba(29, 29, 31, 0.92);
      backdrop-filter: saturate(180%) blur(16px);
      -webkit-backdrop-filter: saturate(180%) blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 14px;
      padding: 10px 14px;
      font-size: 0.82rem;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65);
      opacity: 0;
      transform: translate(-50%, -112%);
      transition: opacity 120ms ease;
      z-index: 20;
      min-width: 175px;
    }
    .chart-tooltip.is-visible { opacity: 1; }

    /* Before -> After Apple Progress Cards */
    .journey-list { display: flex; flex-direction: column; gap: 14px; }
    .journey-item {
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 16px 18px;
    }
    .journey-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .journey-name { font-weight: 700; font-size: 0.94rem; color: var(--text); }
    .journey-delta {
      padding: 3px 10px;
      border-radius: 980px;
      font-size: 0.74rem;
      font-weight: 700;
      background: rgba(48, 209, 88, 0.15);
      color: var(--apple-green);
    }
    .bar-row {
      display: grid;
      grid-template-columns: 56px 1fr 86px;
      align-items: center;
      gap: 10px;
      margin-top: 6px;
      font-size: 0.8rem;
    }
    .bar-track {
      height: 8px;
      border-radius: 980px;
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 980px;
      transition: width 650ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    /* Simulator */
    .sim-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: center;
    }
    .sim-controls { display: flex; flex-direction: column; gap: 18px; }
    .sim-slider { width: 100%; accent-color: var(--apple-blue); cursor: pointer; }
    .sim-result-box {
      background: radial-gradient(circle at 30% 20%, rgba(0, 113, 227, 0.16), transparent 60%), var(--surface-elevated);
      border: 1px solid rgba(41, 151, 255, 0.32);
      border-radius: 22px;
      padding: 24px;
      text-align: center;
    }
    .sim-arrow {
      font-size: clamp(1.6rem, 3.2vw, 2.3rem);
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 10px 0 6px;
      color: #ffffff;
    }

    /* Bottom Footer CTA */
    .bottom-cta {
      margin: 28px 0 64px;
      padding: 28px 32px;
      border-radius: 28px;
      background: var(--surface);
      border: 1px solid var(--border);
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
      <div class="hero-eyebrow">EkoYıldız Analiz Merkezi · Şeffaf Veriler</div>
      <h1>Toplulukların <span>Gerçek Sıçrama Grafikleri.</span></h1>
      <p>
        Reklam vermeden önce tereddüt etmen çok normal. EkoYıldız ile çalışan toplulukların reklam öncesi ve sonrası verilerini, haftalık ivme eğrilerini ve etkileşim dönüşümlerini aşağıdan incele.
      </p>
    </section>

    <section class="kpi-grid" aria-label="Özet İstatistikler">
      <div class="kpi-card">
        <div class="kpi-label">En Yüksek Üye Sıçraması</div>
        <div class="kpi-val" style="color:var(--apple-link);">+%553</div>
        <div class="kpi-sub">150 üyeden 980 üyeye (İMPREİUS)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Zirve Sohbet Aktifliği</div>
        <div class="kpi-val" style="color:var(--text);">45 Msj/Dk</div>
        <div class="kpi-sub">Tanıtım sonrası organik sohbet hızı</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Denetim Katılım Artışı</div>
        <div class="kpi-val" style="color:var(--apple-green);">+%333</div>
        <div class="kpi-sub">15 aktiften 65 denetim aktifine (TTA)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Ticari Dönüşüm</div>
        <div class="kpi-val" style="color:var(--apple-orange);">10–15 / Ay</div>
        <div class="kpi-sub">Sıfırdan aylık düzenli sipariş</div>
      </div>
    </section>

    <div class="selector-wrap">
      <div class="selector-bar" role="tablist" aria-label="Topluluk Seçimi">
        <button type="button" class="partner-tab is-active" data-partner="all" onclick="selectPartner('all')">Tümünü Karşılaştır</button>
        <button type="button" class="partner-tab" data-partner="impreius" onclick="selectPartner('impreius')">İMPREİUS FAMİLY</button>
        <button type="button" class="partner-tab" data-partner="tta" onclick="selectPartner('tta')">TTA TURKISH ARMED</button>
        <button type="button" class="partner-tab" data-partner="asker-map" onclick="selectPartner('asker-map')">Asker Oyunu Map</button>
      </div>
    </div>

    <section class="dash-grid">
      <!-- Sol: İnteraktif SVG Zaman Serisi Grafiği -->
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">Haftalık Büyüme Eğrisi (Nereden ➔ Nereye)</h2>
            <p class="panel-sub">Noktaların üzerine gelerek haftalık değişimi inceleyin</p>
          </div>
          <div class="mode-pills" role="group" aria-label="Grafik Modu">
            <button type="button" class="mode-pill is-active" id="modeMembers" onclick="setChartMode('members')">Hacim</button>
            <button type="button" class="mode-pill" id="modeEngagement" onclick="setChartMode('engagement')">Etkileşim</button>
            <button type="button" class="mode-pill" id="modePct" onclick="setChartMode('pct')">% Artış</button>
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
            <h2 class="panel-title">Önce vs Sonra</h2>
            <p class="panel-sub">Başlangıç seviyesi ve ulaşılan nokta</p>
          </div>
        </div>
        <div class="journey-list" id="journeyList"></div>
      </div>
    </section>

    <!-- İnteraktif Büyüme Simülatörü -->
    <section class="panel" style="margin-bottom:24px;">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Kendi Topluluğun İçin Büyüme Simülatörü</h2>
          <p class="panel-sub">Mevcut üye sayını seç, geçmiş EkoYıldız partner verilerine göre olası yükseliş bandını gör.</p>
        </div>
      </div>
      <div class="sim-grid">
        <div class="sim-controls">
          <div>
            <label for="simInput" style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:10px;font-size:0.94rem;">
              <span style="color:var(--sub);">Mevcut Topluluk / Aktiflik Sayın</span>
              <span id="simInputVal" style="color:var(--apple-link);font-weight:700;">150 Üye</span>
            </label>
            <input class="sim-slider" id="simInput" type="range" min="30" max="1500" step="10" value="150" oninput="updateSimulator()">
          </div>
          <div>
            <span style="display:block;font-weight:600;margin-bottom:8px;font-size:0.9rem;color:var(--sub);">Hedeflenen Kampanya Yoğunluğu</span>
            <div class="mode-pills">
              <button type="button" class="mode-pill sim-tier" data-mult="2.4" onclick="setSimTier(this)">Başlangıç (2.4x)</button>
              <button type="button" class="mode-pill sim-tier is-active" data-mult="4.2" onclick="setSimTier(this)">Standart (4.2x)</button>
              <button type="button" class="mode-pill sim-tier" data-mult="6.5" onclick="setSimTier(this)">Tam Lansman (6.5x)</button>
            </div>
          </div>
        </div>
        <div class="sim-result-box">
          <div style="font-size:0.78rem;color:var(--apple-link);font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">Öngörülen Nereden ➔ Nereye Bandı</div>
          <div class="sim-arrow" id="simOutput">150 ➔ 630 Üye</div>
          <div style="font-size:0.84rem;color:var(--sub);">Geçmiş EkoYıldız partnerlerinin gerçek sıçrama oranları baz alınarak hesaplanan örnek projeksiyondur.</div>
        </div>
      </div>
    </section>

    <section class="bottom-cta">
      <div>
        <h3 style="font-size:1.22rem;font-weight:700;letter-spacing:-0.02em;margin-bottom:4px;">Verileri inceledin — şimdi sıra senin topluluğunda.</h3>
        <p style="color:var(--sub);font-size:0.92rem;">Partner Studio’ya geri dönüp paketleri inceleyebilir veya doğrudan reklam talebi oluşturabilirsin.</p>
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
      document.getElementById('modePct').classList.toggle('is-active', mode === 'pct');
      renderChart();
    }

    function getVisiblePartners() {
      return activePartner === 'all' ? PARTNERS : PARTNERS.filter(p => p.id === activePartner);
    }

    function getSeries(p) {
      if (chartMode === 'engagement') return p.weeklyEngagement;
      if (chartMode === 'pct') return p.weeklyPct;
      return p.weeklyMembers;
    }

    function renderChart() {
      const svg = document.getElementById('growthSvg');
      const tooltip = document.getElementById('chartTooltip');
      const list = getVisiblePartners();
      const W = 680, H = 280, padL = 48, padR = 24, padT = 20, padB = 34;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;

      const allVals = list.flatMap(getSeries);
      const maxVal = Math.max(10, ...allVals) * 1.12;

      let html = '';
      for (let i = 0; i <= 4; i++) {
        const y = padT + (plotH * i) / 4;
        const val = Math.round(maxVal * (1 - i / 4));
        const suffix = chartMode === 'pct' ? '%' : '';
        html += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4"/>';
        html += '<text x="' + (padL - 8) + '" y="' + (y + 4) + '" text-anchor="end" fill="#86868b" font-size="11" font-weight="500">' + val + suffix + '</text>';
      }
      WEEKS.forEach((lbl, idx) => {
        const x = padL + (plotW * idx) / (WEEKS.length - 1);
        html += '<text x="' + x + '" y="' + (H - 8) + '" text-anchor="middle" fill="#86868b" font-size="11" font-weight="500">' + lbl + '</text>';
      });

      list.forEach((p) => {
        const series = getSeries(p);
        const pts = series.map((v, idx) => {
          const x = padL + (plotW * idx) / (series.length - 1);
          const y = padT + plotH - (v / maxVal) * plotH;
          return { x, y, v, idx };
        });
        const linePath = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1)).join(' ');
        const areaPath = linePath + ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (padT + plotH) + ' L' + pts[0].x.toFixed(1) + ',' + (padT + plotH) + ' Z';
        html += '<path d="' + areaPath + '" fill="' + p.color + '" fill-opacity="0.12"/>';
        html += '<path d="' + linePath + '" fill="none" stroke="' + p.color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
        pts.forEach((pt) => {
          html += '<circle cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '" r="5" fill="#161617" stroke="' + p.color + '" stroke-width="3" style="cursor:pointer" data-pid="' + p.id + '" data-idx="' + pt.idx + '"/>';
        });
      });

      svg.innerHTML = html;

      svg.querySelectorAll('circle[data-pid]').forEach((c) => {
        c.addEventListener('mouseenter', () => {
          const p = PARTNERS.find(item => item.id === c.dataset.pid);
          const idx = Number(c.dataset.idx);
          const series = getSeries(p);
          const unit = chartMode === 'members' ? p.unit : (chartMode === 'pct' ? '% Artış' : 'İndeks');
          tooltip.innerHTML = '<div style="font-weight:700;color:' + p.color + ';margin-bottom:4px;">' + p.name + '</div>'
            + '<div style="color:#a1a1a6;">' + WEEKS[idx] + ': <strong style="color:#f5f5f7;">' + series[idx] + ' ' + unit + '</strong></div>'
            + '<div style="font-size:0.74rem;color:#86868b;margin-top:2px;">Toplam Değişim: ' + p.growthPct + '</div>';
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
          + '<div class="bar-row"><span style="color:#86868b;">Önce</span><div class="bar-track"><div class="bar-fill" style="width:' + beforePct + '%;background:rgba(142,142,147,0.55);"></div></div><span style="text-align:right;font-weight:600;color:#a1a1a6;">' + p.beforeLabel + '</span></div>'
          + '<div class="bar-row"><span style="color:#f5f5f7;font-weight:600;">Sonra</span><div class="bar-track"><div class="bar-fill" style="width:100%;background:' + p.color + ';"></div></div><span style="text-align:right;font-weight:700;color:' + p.color + ';">' + p.afterLabel + '</span></div>'
          + '<p style="font-size:0.8rem;color:#86868b;margin-top:10px;">' + p.summary + '</p>'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:0.8rem;">'
          + '  <span style="color:#a1a1a6;">' + p.extraMetricLabel + ': <strong style="color:#f5f5f7;">' + p.extraMetricVal + '</strong></span>'
          + '  <a href="' + p.videoUrl + '" target="_blank" rel="noopener noreferrer" style="color:#2997ff;font-weight:500;">YouTube Kanıtı ›</a>'
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
