'use strict';

const { getSystemTelemetry } = require('../services/systemStatusService');

const services = [
  ['🌐', 'Web sitesi', 'Ana sayfa, Help, Safety, linkler, blog ve kullanıcı paneli'],
  ['🔐', 'Authentication', 'Oturum, Discord OAuth ve hesap doğrulama akışları'],
  ['🤖', 'Discord Bot', 'Komutlar, otomasyonlar ve topluluk etkileşimleri'],
  ['🎫', 'Ticket sistemi', 'Web talepleri, Discord teslimi ve destek kayıtları'],
  ['🛡️', 'Moderasyon', 'Topluluk güvenliği, TrustScore ve personel araçları'],
  ['🔌', 'API', 'Web ve bot servisleri arasındaki veri uç noktaları'],
];

function renderStatusPage(user = null, _layout) {
  const telemetry = getSystemTelemetry();

  const isAllGood = telemetry.overall === 'all_operational';
  const overallBadgeClass = isAllGood ? 'badge-green' : 'badge-yellow';
  const overallText = isAllGood ? 'Tüm Sistemler Operasyonel' : 'Sistemler Aktif ve Çalışıyor';

  const serviceCards = telemetry.services.map(s => {
    const isOk = s.status === 'online';
    const badgeColor = isOk ? '#34d399' : '#fbbf24';
    const badgeBg = isOk ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)';
    const badgeBorder = isOk ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)';

    return `
      <article class="status-service" id="svc-${s.id}">
        <div class="status-service-icon" aria-hidden="true">${s.icon}</div>
        <div class="status-service-content">
          <div class="status-service-head">
            <h2>${s.name}</h2>
            <span class="status-service-category">${s.category || 'Servis'}</span>
          </div>
          <p>${s.description}</p>
          <div class="status-service-meta" id="meta-${s.id}">
            <span class="status-meta-icon">⚡</span> ${s.metrics}
          </div>
        </div>
        <div class="status-badge-wrap">
          <span class="status-pill" id="pill-${s.id}" style="color:${badgeColor};background:${badgeBg};border-color:${badgeBorder}">
            <span class="status-pulse-dot" style="background:${badgeColor};box-shadow:0 0 8px ${badgeColor}"></span>
            ${s.statusLabel}
          </span>
        </div>
      </article>
    `;
  }).join('');

  const content = `
  <style>
    .status-wrap {
      max-width: 1060px;
      margin: 0 auto;
      padding: 0 16px 60px;
    }
    .status-hero {
      padding: 38px 0 28px;
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.12));
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 20px;
    }
    .status-eyebrow {
      font-size: .74rem;
      letter-spacing: .14em;
      font-weight: 850;
      color: #818cf8;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 8px;
    }
    .status-hero h1 {
      font-size: clamp(2.3rem, 5vw, 3.8rem);
      line-height: 1.05;
      letter-spacing: -0.055em;
      margin: 0 0 10px;
      background: linear-gradient(110deg, #ffffff 35%, #c7d2fe 75%, #f472b6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .status-hero p {
      max-width: 640px;
      color: var(--muted, #9496a8);
      font-size: .98rem;
      line-height: 1.6;
      margin: 0;
    }

    /* Overall Health Banner - Liquid Glass */
    .status-health-banner {
      margin: 28px 0;
      padding: 22px 26px;
      border-radius: 20px;
      background: radial-gradient(130% 120% at 50% -15%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, rgba(16,17,28,0.78) 100%), linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(20,22,35,0.75) 100%);
      border: 1px solid rgba(255, 255, 255, 0.22);
      box-shadow: 0 20px 48px -12px rgba(0,0,0,0.55), inset 0 1.5px 1px rgba(255,255,255,0.8);
      backdrop-filter: blur(24px) saturate(200%);
      -webkit-backdrop-filter: blur(24px) saturate(200%);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .status-health-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .status-health-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(16, 185, 129, 0.16);
      border: 1px solid rgba(16, 185, 129, 0.35);
      display: grid;
      place-items: center;
      font-size: 1.4rem;
      flex-shrink: 0;
    }
    .status-health-title {
      font-size: 1.25rem;
      font-weight: 850;
      color: #fff;
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }
    .status-health-desc {
      font-size: .84rem;
      color: var(--muted, #9fa2b4);
      margin: 0;
    }
    .status-refresh-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 16px;
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.22);
      color: #fff;
      font-size: .82rem;
      font-weight: 750;
      cursor: pointer;
      user-select: none;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.4);
      transition: all .2s cubic-bezier(0.34,1.56,0.64,1);
    }
    .status-refresh-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.35);
      transform: translateY(-2px);
    }
    .status-refresh-btn:active {
      transform: scale(0.93) translateY(2px) !important;
    }
    .status-refresh-btn.spinning svg {
      animation: spinRefresh .75s linear infinite;
    }
    @keyframes spinRefresh {
      to { transform: rotate(360deg); }
    }

    /* Live Telemetry Bento Grid */
    .status-telemetry-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 20px 0 28px;
    }
    .telemetry-card {
      padding: 16px 18px;
      border-radius: 16px;
      background: rgba(18, 20, 32, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.25);
      backdrop-filter: blur(18px);
    }
    .telemetry-label {
      font-size: .72rem;
      font-weight: 750;
      color: var(--muted, #9496a8);
      text-transform: uppercase;
      letter-spacing: .06em;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .telemetry-value {
      font-size: 1.15rem;
      font-weight: 850;
      color: #fff;
      letter-spacing: -0.02em;
    }
    .telemetry-sub {
      font-size: .74rem;
      color: var(--muted, #85889c);
      margin-top: 4px;
    }

    /* Services List */
    .status-list {
      display: grid;
      gap: 12px;
      margin: 28px 0;
    }
    .status-service {
      display: grid;
      grid-template-columns: 48px 1fr auto;
      gap: 16px;
      align-items: center;
      padding: 18px 22px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 16px;
      background: radial-gradient(130% 120% at 50% -15%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 40%, rgba(18,20,32,0.78) 100%), linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(18,20,32,0.72) 100%);
      box-shadow: 0 12px 28px -8px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.5);
      backdrop-filter: blur(20px);
      transition: all .2s cubic-bezier(0.34,1.56,0.64,1);
    }
    .status-service:hover {
      border-color: rgba(255, 255, 255, 0.28);
      transform: translateY(-2px);
      box-shadow: 0 18px 36px -10px rgba(0,0,0,0.55), inset 0 1.5px 1px rgba(255,255,255,0.75);
    }
    .status-service-icon {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      font-size: 1.3rem;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.3);
    }
    .status-service-content {
      min-width: 0;
    }
    .status-service-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .status-service h2 {
      font-size: 1.08rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.02em;
      color: #fff;
    }
    .status-service-category {
      font-size: .68rem;
      font-weight: 750;
      padding: 2px 7px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: #a5b4fc;
      border: 1px solid rgba(165, 180, 252, 0.2);
    }
    .status-service p {
      color: var(--muted, #9496a8);
      font-size: .86rem;
      margin: 0 0 6px;
      line-height: 1.45;
    }
    .status-service-meta {
      font-size: .78rem;
      color: #c7d2fe;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .status-meta-icon {
      color: #fbbf24;
    }

    .status-badge-wrap {
      flex-shrink: 0;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid;
      font-size: .76rem;
      font-weight: 800;
      letter-spacing: .02em;
      white-space: nowrap;
      user-select: none;
    }
    .status-pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulseDot 2s ease-in-out infinite;
    }
    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.85); }
    }

    /* Incident history container */
    .status-history {
      margin: 36px 0;
      padding: 28px;
      border: 1px dashed rgba(255, 255, 255, 0.18);
      border-radius: 18px;
      text-align: center;
      background: rgba(255, 255, 255, 0.02);
    }
    .status-history h3 {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0 0 6px;
      color: #fff;
    }
    .status-history p {
      max-width: 580px;
      margin: 0 auto;
      color: var(--muted, #9496a8);
      font-size: .88rem;
      line-height: 1.55;
    }
    .status-actions {
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 18px;
    }
    .status-action-link {
      padding: 9px 15px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      text-decoration: none;
      font-size: .82rem;
      font-weight: 750;
      transition: all .2s ease;
    }
    .status-action-link:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    @media (max-width: 860px) {
      .status-telemetry-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 680px) {
      .status-service { grid-template-columns: 44px 1fr; gap: 12px; }
      .status-badge-wrap { grid-column: 1 / -1; }
      .status-telemetry-grid { grid-template-columns: 1fr; }
      .status-health-banner { flex-direction: column; align-items: stretch; }
      .status-refresh-btn { justify-content: center; }
    }
  </style>

  <div class="status-wrap">
    <section class="status-hero">
      <div>
        <div class="status-eyebrow">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#818cf8;box-shadow:0 0 10px #818cf8;"></span>
          EKOYILDIZ CANLI SERVİS &amp; TELEMETRİ
        </div>
        <h1>Canlı Sistem Durumu</h1>
        <p>
          Platformumuzun çekirdek web altyapısı, Discord botu, veritabanı, bilet sistemi ve harici servislerin gerçek zamanlı çalışma metrikleri ve anlık operasyonel durumu.
        </p>
      </div>
    </section>

    <!-- Overall Status Banner -->
    <aside class="status-health-banner" id="healthBanner">
      <div class="status-health-left">
        <div class="status-health-icon" id="healthIcon">
          ${isAllGood ? '🟢' : '🟡'}
        </div>
        <div>
          <h2 class="status-health-title" id="healthTitle">${overallText}</h2>
          <p class="status-health-desc" id="healthDesc">
            Doğrulanmış gerçek zamanlı telemetri • Son kontrol: <span id="lastUpdatedTime">${new Date(telemetry.timestamp).toLocaleTimeString('tr-TR')}</span>
          </p>
        </div>
      </div>
      <button type="button" class="status-refresh-btn" id="btnRefreshStatus" aria-label="Durumu şimdi yenile">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        <span id="refreshBtnText">Şimdi Güncelle</span>
      </button>
    </aside>

    <!-- Bento Live Telemetry Cards -->
    <section class="status-telemetry-grid" aria-label="Canlı Sistem Metrikleri">
      <div class="telemetry-card">
        <div class="telemetry-label">🌐 Web Uptime</div>
        <div class="telemetry-value" id="valWebUptime">${telemetry.process.uptimeFormatted}</div>
        <div class="telemetry-sub" id="valWebRam">RAM: ${telemetry.process.memoryHeapMB} MB (Heap)</div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">🤖 Discord Bot</div>
        <div class="telemetry-value" id="valBotPing">${telemetry.discord.ready ? `${telemetry.discord.ping} ms` : 'Hazır Bekliyor'}</div>
        <div class="telemetry-sub" id="valBotGuilds">${telemetry.discord.ready ? `${telemetry.discord.guildCount} Sunucu • Uptime: ${telemetry.discord.uptimeFormatted}` : 'Gateway Bekleniyor'}</div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">🗄️ Veri Deposu</div>
        <div class="telemetry-value" id="valDbStatus">${telemetry.database.statusText}</div>
        <div class="telemetry-sub" id="valDbUsers">${telemetry.database.users} Kullanıcı Kayıtlı</div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">🎫 Bilet Sistemi</div>
        <div class="telemetry-value" id="valTicketStatus">Kuyruk Aktif</div>
        <div class="telemetry-sub" id="valTicketCount">${telemetry.database.tickets} Destek Talebi</div>
      </div>
    </section>

    <!-- Services Grid -->
    <section class="status-list" aria-label="EkoYıldız servisleri">
      ${serviceCards}
    </section>

    <!-- Incident History -->
    <section class="status-history">
      <h3>Planlanmamış Kesinti Bulunmuyor</h3>
      <p>
        Tüm sistem bileşenleri periyodik heartbeat kontrolleri ile izlenmektedir. Herhangi bir planlı bakım veya kesinti olduğunda burada anlık zaman çizelgesi yayımlanır.
      </p>
      <div class="status-actions">
        <a href="/help" class="status-action-link">Help Center</a>
        <a href="/tickets/new" class="status-action-link">Destek Talebi Aç</a>
        <a href="/linkler" class="status-action-link">Resmi Bağlantılar</a>
        <a href="/blog" class="status-action-link">Duyurular &amp; Güncellemeler</a>
      </div>
    </section>
  </div>

  <script>
    (function() {
      var btn = document.getElementById('btnRefreshStatus');
      var refreshText = document.getElementById('refreshBtnText');
      var lastUpdated = document.getElementById('lastUpdatedTime');

      function updateStatusData() {
        if (btn) btn.classList.add('spinning');
        if (refreshText) refreshText.textContent = 'Güncelleniyor...';

        fetch('/api/status')
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (!data.success) return;

            // Metrikleri güncelle
            if (lastUpdated) lastUpdated.textContent = new Date(data.timestamp).toLocaleTimeString('tr-TR');

            var valWebUptime = document.getElementById('valWebUptime');
            var valWebRam = document.getElementById('valWebRam');
            if (valWebUptime && data.process) valWebUptime.textContent = data.process.uptimeFormatted;
            if (valWebRam && data.process) valWebRam.textContent = 'RAM: ' + data.process.memoryHeapMB + ' MB (Heap)';

            var valBotPing = document.getElementById('valBotPing');
            var valBotGuilds = document.getElementById('valBotGuilds');
            if (valBotPing && data.discord) {
              valBotPing.textContent = data.discord.ready ? (data.discord.ping + ' ms') : 'Hazır Bekliyor';
            }
            if (valBotGuilds && data.discord) {
              valBotGuilds.textContent = data.discord.ready ? (data.discord.guildCount + ' Sunucu • Uptime: ' + data.discord.uptimeFormatted) : 'Gateway Bekleniyor';
            }

            var valDbStatus = document.getElementById('valDbStatus');
            var valDbUsers = document.getElementById('valDbUsers');
            if (valDbStatus && data.database) valDbStatus.textContent = data.database.statusText;
            if (valDbUsers && data.database) valDbUsers.textContent = data.database.users + ' Kullanıcı Kayıtlı';

            var valTicketCount = document.getElementById('valTicketCount');
            if (valTicketCount && data.database) valTicketCount.textContent = data.database.tickets + ' Destek Talebi';

            // Servis pill ve metriklerini güncelle
            if (data.services && Array.isArray(data.services)) {
              data.services.forEach(function(s) {
                var metaEl = document.getElementById('meta-' + s.id);
                var pillEl = document.getElementById('pill-' + s.id);
                if (metaEl) {
                  metaEl.innerHTML = '<span class="status-meta-icon">⚡</span> ' + s.metrics;
                }
                if (pillEl) {
                  var isOk = s.status === 'online';
                  var badgeColor = isOk ? '#34d399' : '#fbbf24';
                  var badgeBg = isOk ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)';
                  var badgeBorder = isOk ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)';
                  pillEl.style.color = badgeColor;
                  pillEl.style.background = badgeBg;
                  pillEl.style.borderColor = badgeBorder;
                  pillEl.innerHTML = '<span class="status-pulse-dot" style="background:' + badgeColor + ';box-shadow:0 0 8px ' + badgeColor + '"></span> ' + s.statusLabel;
                }
              });
            }
          })
          .catch(function(err) {
            console.warn('Status refresh error:', err);
          })
          .finally(function() {
            setTimeout(function() {
              if (btn) btn.classList.remove('spinning');
              if (refreshText) refreshText.textContent = 'Şimdi Güncelle';
            }, 400);
          });
      }

      if (btn) {
        btn.addEventListener('click', updateStatusData);
      }

      // Her 25 saniyede bir otomatik canlı telemetri yenile
      setInterval(updateStatusData, 25000);
    })();
  </script>
  `;

  if (typeof _layout === 'function') {
    return _layout('Canlı Sistem Durumu', user, content, '', '/status');
  }

  // Standalone fallback
  const { renderPlatformHeader, renderPlatformFooter, platformChromeStyles, platformChromeScript } = require('./platformChrome');
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#090a10">
  <title>Canlı Sistem Durumu — EkoYıldız</title>
  ${platformChromeStyles('dark')}
</head>
<body class="platform-chrome" data-theme="dark">
  ${renderPlatformHeader({ user, activePath: '/status' })}
  <main id="main-content">
    ${content}
  </main>
  ${renderPlatformFooter()}
  ${platformChromeScript()}
</body>
</html>`;
}

module.exports = { renderStatusPage, services };
