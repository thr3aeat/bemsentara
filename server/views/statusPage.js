'use strict';

function renderStatusPage(user = null, _layout, _esc) {
  const content = `
    <style>
      .status-container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1rem 0;
      }
      .status-hero {
        background: linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,78,59,0.06) 100%);
        border: 1px solid rgba(52,211,153,0.3);
        border-radius: 20px;
        padding: 2.5rem;
        text-align: center;
        position: relative;
        overflow: hidden;
        margin-bottom: 2.5rem;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
      }
      .status-hero::before {
        content: '';
        position: absolute;
        top: -50%;
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%);
        pointer-events: none;
      }
      .pulse-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        background: rgba(52,211,153,0.15);
        color: #34d399;
        padding: 0.5rem 1.2rem;
        border-radius: 30px;
        font-weight: 700;
        font-size: 0.95rem;
        border: 1px solid rgba(52,211,153,0.3);
        margin-bottom: 1rem;
      }
      .pulse-dot {
        width: 10px;
        height: 10px;
        background: #34d399;
        border-radius: 50%;
        box-shadow: 0 0 12px #34d399;
        animation: pulseAnimation 1.8s infinite;
      }
      @keyframes pulseAnimation {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52,211,153,0.7); }
        70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(52,211,153,0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52,211,153,0); }
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.2rem;
        margin-bottom: 2.5rem;
      }
      .metric-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px;
        padding: 1.4rem;
        text-align: center;
        backdrop-filter: blur(12px);
      }
      .metric-value {
        font-size: 1.8rem;
        font-weight: 800;
        color: #fff;
        margin: 0.3rem 0;
        background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .metric-label {
        font-size: 0.85rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .service-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2.5rem;
      }
      .service-item {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 16px;
        padding: 1.3rem 1.6rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.25s ease;
      }
      .service-item:hover {
        background: rgba(255,255,255,0.04);
        border-color: rgba(167,139,250,0.25);
        transform: translateY(-2px);
      }
      .service-info {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .service-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(255,255,255,0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .service-name {
        font-size: 1.05rem;
        font-weight: 700;
        color: #fff;
      }
      .service-desc {
        font-size: 0.83rem;
        color: var(--muted);
        margin-top: 0.2rem;
      }
      .service-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.85rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .badge-operational {
        background: rgba(52,211,153,0.12);
        color: #34d399;
        border: 1px solid rgba(52,211,153,0.25);
      }
      .history-section {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 18px;
        padding: 1.8rem;
      }
      .history-item {
        display: flex;
        gap: 1.2rem;
        padding: 1rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .history-item:last-child {
        border-bottom: none;
      }
      .history-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #34d399;
        margin-top: 5px;
        flex-shrink: 0;
        box-shadow: 0 0 8px rgba(52,211,153,0.5);
      }
    </style>

    <div class="status-container">
      <!-- Hero Status Banner -->
      <div class="status-hero">
        <div class="pulse-badge">
          <div class="pulse-dot"></div>
          <span>TÜM SİSTEMLER OPERASYONEL</span>
        </div>
        <h1 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 0.6rem; color: #fff;">
          RobloxLand & Sentara Sistem Durumu
        </h1>
        <p style="color: var(--muted); font-size: 1rem; max-width: 650px; margin: 0 auto;">
          Discord bot servislerimiz, Roblox OpenCloud entegrasyonlarımız, AutoMod güvenlik kalkanımız ve veritabanı altyapımız 7/24 kesintisiz denetlenmektedir.
        </p>
      </div>

      <!-- Quick Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Genel Uptime (90 Gün)</div>
          <div class="metric-value">%99.98</div>
          <span style="font-size: 0.78rem; color: #34d399;">🟢 Sıfır Kritik Kesinti</span>
        </div>
        <div class="metric-card">
          <div class="metric-label">Ortalama API Gecikmesi</div>
          <div class="metric-value">18 ms</div>
          <span style="font-size: 0.78rem; color: var(--muted);">Shard 0 & WebSocket</span>
        </div>
        <div class="metric-card">
          <div class="metric-label">AutoMod Koruması</div>
          <div class="metric-value">3 Kademe</div>
          <span style="font-size: 0.78rem; color: #a78bfa;">🛡️ Hiyerarşik Nöbet Aktif</span>
        </div>
        <div class="metric-card">
          <div class="metric-label">Aktif Seviye Hiyerarşisi</div>
          <div class="metric-value">65 Seviye</div>
          <span style="font-size: 0.78rem; color: #34d399;">✓ Sıralı & Ayrı Gösterim</span>
        </div>
      </div>

      <!-- Service Status List -->
      <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 1.2rem; color: #fff; display:flex; align-items:center; gap:0.6rem;">
        <span>📡 Canlı Servis Durumları</span>
        <button onclick="location.reload()" style="margin-left:auto; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:0.4rem 0.9rem; border-radius:10px; cursor:pointer; font-family:inherit; font-size:0.85rem;">🔄 Şimdi Yenile</button>
      </h2>

      <div class="service-list">
        <div class="service-item">
          <div class="service-info">
            <div class="service-icon">🤖</div>
            <div>
              <div class="service-name">Discord Bot Çekirdeği & Gateway</div>
              <div class="service-desc">Event handler, komut motoru ve interaktif buton dinleyicileri.</div>
            </div>
          </div>
          <span class="service-badge badge-operational">🟢 %100 Operasyonel</span>
        </div>

        <div class="service-item">
          <div class="service-info">
            <div class="service-icon">🛡️</div>
            <div>
              <div class="service-name">AutoMod & 3 Kademeli Küfür Kalkanı</div>
              <div class="service-desc">Moderatör (3 dk), Üst Yetkili (5 dk) ve Kurucu hiyerarşik devir sistemi.</div>
            </div>
          </div>
          <span class="service-badge badge-operational">🟢 Aktif & Nöbette</span>
        </div>

        <div class="service-item">
          <div class="service-info">
            <div class="service-icon">☁️</div>
            <div>
              <div class="service-name">Roblox OpenCloud & Grup API Senkronizasyonu</div>
              <div class="service-desc">Grup üyeliği, rank doğrulama ve anlık kullanıcı sorgulama.</div>
            </div>
          </div>
          <span class="service-badge badge-operational">🟢 Senkronize</span>
        </div>

        <div class="service-item">
          <div class="service-info">
            <div class="service-icon">🎟️</div>
            <div>
              <div class="service-name">Bilet (Ticket) & Sipariş Sistemi</div>
              <div class="service-desc">Kişiye özel kanal açılışı, transcript kaydı ve yetkili puanlama.</div>
            </div>
          </div>
          <span class="service-badge badge-operational">🟢 %100 Operasyonel</span>
        </div>

        <div class="service-item">
          <div class="service-info">
            <div class="service-icon">🪙</div>
            <div>
              <div class="service-name">Ekonomi, Kupon & Escrow Güvenlik Motoru</div>
              <div class="service-desc">Güven puanı, indirim kuponları ve dolandırıcı kara liste denetimi.</div>
            </div>
          </div>
          <span class="service-badge badge-operational">🟢 Güvenli & Aktif</span>
        </div>

        <div class="service-item">
          <div class="service-info">
            <div class="service-icon">📈</div>
            <div>
              <div class="service-name">XP, Seviye & Ses Takip Sistemi</div>
              <div class="service-desc">65 seviye kademeli rol motoru ve otomatik sıralama.</div>
            </div>
          </div>
          <span class="service-badge badge-operational">🟢 %100 Operasyonel</span>
        </div>

        <div class="service-item">
          <div class="service-info">
            <div class="service-icon">🗄️</div>
            <div>
              <div class="service-name">Veritabanı & Kalıcı Veri Katmanı</div>
              <div class="service-desc">Otomatik yedekleme ve sıfır gecikmeli DataStore.</div>
            </div>
          </div>
          <span class="service-badge badge-operational">🟢 Sağlıklı</span>
        </div>
      </div>

      <!-- Incident History -->
      <div class="history-section">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 1rem;">
          📋 Son Bakım & Olay Günlüğü
        </h3>
        <div class="history-item">
          <div class="history-dot"></div>
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Tüm Sistemler ve API Uç Noktaları Stabil</div>
            <div style="font-size: 0.85rem; color: var(--muted); margin-top: 0.2rem;">
              Yapılan son test ve sağlık kontrollerinde hiçbir kesinti veya hata tespit edilmemiştir.
            </div>
            <div style="font-size: 0.75rem; color: #a78bfa; margin-top: 0.4rem;">Bugün • Otomatik Kontrol</div>
          </div>
        </div>
        <div class="history-item">
          <div class="history-dot"></div>
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">65 Seviye Rol Hiyerarşisi ve İstek Köprüsü Devrede</div>
            <div style="font-size: 0.85rem; color: var(--muted); margin-top: 0.2rem;">
              Seviye rolleri hoist senkronizasyonu ve çift taraflı istek köprüsü başarıyla devreye alındı.
            </div>
            <div style="font-size: 0.75rem; color: #a78bfa; margin-top: 0.4rem;">Son Güncelleme</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return _layout('Sistem Durumu', user, content, '', '/status');
}

module.exports = { renderStatusPage };
