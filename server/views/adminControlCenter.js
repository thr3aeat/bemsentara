'use strict';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const groups = [
  ['Genel', [['overview', 'Genel Bakış'], ['operations', 'Canlı Operasyon']]],
  ['İnsanlar', [['users', 'Kullanıcılar'], ['staff', 'Personel'], ['bans', 'Banlar ve Güvenlik'], ['coins', 'Ekonomi']]],
  ['Operasyon', [['tickets', 'Ticket’lar'], ['submissions', 'Başvurular'], ['forms', 'Panel Formları'], ['automation', 'Otomasyonlar'], ['group-logs', 'Grup Değişiklikleri']]],
  ['İçerik ve Sistem', [['content', 'İçerik ve Topluluk'], ['system', 'Sistem ve Audit']]],
];

function renderAdminMetric(value, label, { tone = 'neutral', key = '' } = {}) {
  const display = value === null || value === undefined ? 'Veri alınamadı' : String(value);
  return `<article class="acc-metric" data-tone="${esc(tone)}" data-admin-metric="${esc(key)}"><span class="acc-metric-label">${esc(label)}</span><strong class="acc-metric-val">${esc(display)}</strong></article>`;
}

function renderAdminOverviewSkeleton() {
  return `<section id="adm-overview" class="acc-workspace-panel" data-admin-workspace="overview">
  <header class="acc-page-head">
    <div>
      <span class="acc-eyebrow">EKOYILDIZ OPERASYON</span>
      <h1>Kontrol Merkezi</h1>
      <p>Canlı durum, bekleyen işler ve hızlı yönetim araçları.</p>
    </div>
    <button type="button" class="acc-btn acc-btn-refresh" data-admin-refresh>Verileri yenile</button>
  </header>
  <div class="acc-metrics" data-admin-metrics aria-live="polite">
    ${renderAdminMetric(null, 'Son 24 Saat Aktif', { key: 'activeUsers24h' })}
    ${renderAdminMetric(null, 'Canlı Kullanıcı', { key: 'liveUsersNow' })}
    ${renderAdminMetric(null, 'Açık Ticket', { key: 'openTickets' })}
    ${renderAdminMetric(null, 'Bekleyen Başvuru', { key: 'pendingSubmissions' })}
    ${renderAdminMetric(null, 'Aktif Ban', { key: 'activeBans' })}
    ${renderAdminMetric(null, 'Aktif Personel', { key: 'activeStaff' })}
  </div>
  <div class="acc-dashboard-grid">
    <section class="acc-panel">
      <div class="acc-panel-head"><h2>Operasyon kuyruğu</h2><span class="acc-badge" data-queue-count>0</span></div>
      <div data-admin-queue class="acc-state">Yükleniyor…</div>
    </section>
    <section class="acc-panel">
      <div class="acc-panel-head"><h2>Canlı kullanıcılar</h2><span class="acc-badge" data-live-count>0</span></div>
      <div data-admin-live-users class="acc-state">Yükleniyor…</div>
    </section>
    <section class="acc-panel">
      <div class="acc-panel-head"><h2>Servis sağlığı</h2></div>
      <div data-admin-services class="acc-state">Yükleniyor…</div>
    </section>
    <section class="acc-panel">
      <div class="acc-panel-head"><h2>Son yönetim işlemleri</h2></div>
      <div data-admin-recent-actions class="acc-state">Yükleniyor…</div>
    </section>
  </div>
</section>`;
}

function renderOperationsWorkspace() {
  return `<section id="adm-operations" class="acc-workspace-panel" data-admin-workspace="operations" hidden>
  <header class="acc-page-head">
    <div>
      <span class="acc-eyebrow">CANLI AKIŞ</span>
      <h1>Canlı Operasyon</h1>
      <p>Gerçek zamanlı site trafiği, aktif kullanıcılar ve anlık olaylar.</p>
    </div>
  </header>
  <div class="acc-dashboard-grid">
    <section class="acc-panel" style="grid-column: span 12;">
      <div class="acc-panel-head"><h2>Sitedeki Kullanıcılar (Canlı)</h2></div>
      <div data-admin-live-users-full class="acc-state">Yükleniyor…</div>
    </section>
  </div>
</section>`;
}

function renderContentHubWorkspace() {
  return `<section id="adm-content" class="acc-workspace-panel" data-admin-workspace="content" hidden>
  <header class="acc-page-head">
    <div>
      <span class="acc-eyebrow">TOPLULUK VE MEDYA</span>
      <h1>İçerik ve Topluluk Yönetimi</h1>
      <p>Çekilişler, reklam ortaklıkları, blog ve duyurulara hızlı erişim.</p>
    </div>
  </header>
  <div class="acc-cards-grid">
    <a href="/cekilisler/admin" class="acc-action-card">
      <div class="acc-action-icon">🎁</div>
      <div class="acc-action-info">
        <strong>Çekiliş Yönetim Masası</strong>
        <p>Aktif çekilişleri, katılımcıları ve kazanan belirleme motorunu yönetin.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
    <a href="/reklam/ekoyildiz-ortaklik" class="acc-action-card">
      <div class="acc-action-icon">💼</div>
      <div class="acc-action-info">
        <strong>Reklam & Ortaklık Rehberi</strong>
        <p>Topluluk sponsorluk paketleri, fiyatlandırma ve sunum sayfası.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
    <a href="/blog" class="acc-action-card">
      <div class="acc-action-icon">✍️</div>
      <div class="acc-action-info">
        <strong>Topluluk Blogu</strong>
        <p>EkoYıldız rehberleri, güncellemeleri ve resmi makaleleri.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
    <a href="/video-blog" class="acc-action-card">
      <div class="acc-action-icon">🎬</div>
      <div class="acc-action-info">
        <strong>Video Blog & Medya</strong>
        <p>YouTube içerikleri, topluluk videoları ve eğitim materyalleri.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
    <a href="/linkler" class="acc-action-card">
      <div class="acc-action-icon">🔗</div>
      <div class="acc-action-info">
        <strong>Bio Link Hub</strong>
        <p>Tüm resmi sosyal ağ ve platform köprüleri merkezi.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
  </div>
</section>`;
}

function renderSystemHubWorkspace() {
  return `<section id="adm-system" class="acc-workspace-panel" data-admin-workspace="system" hidden>
  <header class="acc-page-head">
    <div>
      <span class="acc-eyebrow">TEKNİK YÖNETİM</span>
      <h1>Sistem ve Audit Merkezi</h1>
      <p>Sunucu telemetrisi, veritabanı durumu ve teknik denetim araçları.</p>
    </div>
  </header>
  <div class="acc-cards-grid">
    <a href="/status" class="acc-action-card">
      <div class="acc-action-icon">📡</div>
      <div class="acc-action-info">
        <strong>Sistem Durumu (Status)</strong>
        <p>Tüm mikroservislerin, API uçlarının ve Node.js runtime sağlığı.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
    <a href="/debug" class="acc-action-card">
      <div class="acc-action-icon">🛠️</div>
      <div class="acc-action-info">
        <strong>Debug Masası</strong>
        <p>Bellek kullanımı, in-memory store dökümü ve bot runtime metrikleri.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
    <a href="/settings" class="acc-action-card">
      <div class="acc-action-icon">⚙️</div>
      <div class="acc-action-info">
        <strong>Platform Ayarları</strong>
        <p>Site yapılandırması, oturum ve genel tercihler.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
    <a href="/group-admin" class="acc-action-card">
      <div class="acc-action-icon">🛡️</div>
      <div class="acc-action-info">
        <strong>Roblox Grup Yönetimi</strong>
        <p>Roblox grup rütbe eşitlemesi, logları ve üyelik operasyonları.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
  </div>
</section>`;
}

function renderStaffWorkspace() {
  return `<section id="adm-staff" class="acc-workspace-panel" data-admin-workspace="staff" hidden>
  <header class="acc-page-head">
    <div>
      <span class="acc-eyebrow">YÖNETİM KADROSU</span>
      <h1>Personel ve Yetkili Merkezi</h1>
      <p>Yetkili kadrosu, performans puanları ve personel akademisi.</p>
    </div>
  </header>
  <div class="acc-cards-grid">
    <a href="/staff" class="acc-action-card">
      <div class="acc-action-icon">👔</div>
      <div class="acc-action-info">
        <strong>Yetkili Operasyon Masası</strong>
        <p>Aktif kadro listesi, vardiya takibi ve yetkili puanlama arayüzü.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
    <a href="/staff-academy" class="acc-action-card">
      <div class="acc-action-icon">🎓</div>
      <div class="acc-action-info">
        <strong>Yetkili Akademisi</strong>
        <p>Eğitim modülleri, sınavlar ve stajyer personel oryantasyonu.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
  </div>
</section>`;
}

function renderTicketsWorkspace() {
  return `<section id="adm-tickets" class="acc-workspace-panel" data-admin-workspace="tickets" hidden>
  <header class="acc-page-head">
    <div>
      <span class="acc-eyebrow">DESTEK SİSTEMİ</span>
      <h1>Ticket ve Destek Masası</h1>
      <p>Kullanıcı talepleri, şikayetler ve doğrulama süreçleri.</p>
    </div>
  </header>
  <div class="acc-cards-grid">
    <a href="/tickets" class="acc-action-card">
      <div class="acc-action-icon">🎫</div>
      <div class="acc-action-info">
        <strong>Destek Biletleri Masası</strong>
        <p>Tüm açık, bekleyen ve kilitli destek taleplerini inceleyin.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
    <a href="/tickets/create" class="acc-action-card">
      <div class="acc-action-icon">➕</div>
      <div class="acc-action-info">
        <strong>Yeni Destek Talebi Aç</strong>
        <p>Kullanıcı adına resmi inceleme veya bildirim bileti oluşturun.</p>
      </div>
      <span class="acc-arrow">→</span>
    </a>
  </div>
</section>`;
}

function renderAdminControlCenterShell({ user, legacyContent }) {
  const nav = groups.map(([label, items]) => `
    <section class="acc-nav-group">
      <h2 class="acc-nav-title">${esc(label)}</h2>
      <div class="acc-nav-items">
        ${items.map(([id, title]) => `<button type="button" class="acc-nav-btn" data-admin-nav="${esc(id)}">${esc(title)}</button>`).join('')}
      </div>
    </section>
  `).join('');

  return `
  <div class="acc-shell" data-admin-shell data-sidebar-open="false">
    <aside class="acc-sidebar">
      <div class="acc-brand">
        <span class="acc-brand-badge">E★</span>
        <div class="acc-brand-text">
          <strong>EkoYıldız</strong>
          <span>Control Center</span>
        </div>
      </div>
      <nav class="acc-nav">
        ${nav}
      </nav>
      <div class="acc-sidebar-footer">
        <a href="/" class="acc-back-link">← Siteye Dön</a>
      </div>
    </aside>
    <div class="acc-sidebar-backdrop" data-admin-sidebar-close></div>

    <section class="acc-main">
      <header class="acc-commandbar">
        <button type="button" class="acc-toggle-btn" data-admin-sidebar-toggle aria-label="Yönetim menüsünü aç">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <button type="button" class="acc-command-trigger" data-admin-command-trigger>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span>Kontrol merkezinde ara…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <div class="acc-user-pill">
          <span class="acc-status-dot"></span>
          <span class="acc-admin-name" title="${esc(user?.username || user?.discordUsername || 'Yönetici')}">${esc(user?.username || user?.discordUsername || 'Yönetici')}</span>
        </div>
      </header>

      <div class="acc-workspace">
        ${renderOperationsWorkspace()}
        ${renderStaffWorkspace()}
        ${renderTicketsWorkspace()}
        ${renderContentHubWorkspace()}
        ${renderSystemHubWorkspace()}
        ${legacyContent}
      </div>
    </section>

    <!-- Komut Paleti Dialog -->
    <div class="acc-command-dialog-wrap" data-admin-command-dialog hidden>
      <div class="acc-command-box">
        <div class="acc-command-input-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" class="acc-command-input" data-admin-command-input placeholder="Modül, araç veya işlem ara..." autofocus />
          <kbd class="acc-esc-badge" data-admin-command-close>ESC</kbd>
        </div>
        <div class="acc-command-results" data-admin-command-results></div>
      </div>
    </div>

    <!-- Ortak Kritik İşlem Onay Dialogu -->
    <dialog class="acc-confirm-dialog" data-admin-confirm-dialog>
      <div class="acc-confirm-inner">
        <div class="acc-confirm-icon-wrap">⚠️</div>
        <h3 data-admin-confirm-title class="acc-confirm-title">İşlemi Onayla</h3>
        <p data-admin-confirm-summary class="acc-confirm-summary"></p>
        <div class="acc-confirm-actions">
          <button type="button" class="acc-btn acc-btn-ghost" data-admin-confirm-cancel>Vazgeç</button>
          <button type="button" class="acc-btn acc-btn-danger" data-admin-confirm-submit>Onayla ve Uygula</button>
        </div>
      </div>
    </dialog>
  </div>`;
}

function adminControlCenterAssets() {
  return '<link rel="stylesheet" href="/public/admin/control-center.css">\n<script defer src="/public/admin/control-center.js"></script>';
}

module.exports = {
  renderAdminControlCenterShell,
  renderAdminOverviewSkeleton,
  renderAdminMetric,
  renderOperationsWorkspace,
  renderContentHubWorkspace,
  renderSystemHubWorkspace,
  adminControlCenterAssets,
  esc,
};
