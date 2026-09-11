// server/views/giveaways/giveawayAdminPage.js
// Advanced administrative interface for Giveaways, Anti-Cheat, Participants, and Sponsor Ads
function renderGiveawayAdminPage({ user, stats = {}, giveaways = [], tasks = [], participants = [], fraudFlags = [], ads = [], socialAds = [], socialAnalytics = {}, auditLogs = [] }) {
  const pb = socialAnalytics.platformBreakdown || {};
  let topPlatform = 'YouTube Ana Kanal';
  let maxComp = -1;
  Object.keys(pb).forEach(k => {
    if ((pb[k].completed || 0) > maxComp) {
      maxComp = pb[k].completed;
      topPlatform = pb[k].accountName || pb[k].platform;
    }
  });

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin & Yönetim — Eko Yıldız Çekilişler & Sponsorlar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #131b2e;
      --border: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #a855f7;
      --primary-hover: #9333ea;
      --accent: #38bdf8;
      --success: #22c55e;
      --warning: #eab308;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      min-height: 100vh;
    }
    /* Sidebar */
    .admin-sidebar {
      width: 280px;
      background: #0f172a;
      border-right: 1px solid var(--border);
      padding: 2rem 1.25rem;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      flex-shrink: 0;
    }
    .admin-main {
      flex: 1;
      padding: 2.5rem;
      overflow-y: auto;
      max-width: 1400px;
    }
    @media (max-width: 900px) {
      body { flex-direction: column; }
      .admin-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border); height: auto; position: static; }
      .admin-main { max-width: 100%; padding: 1.25rem; }
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 600;
      margin-bottom: 0.35rem;
      transition: all 0.2s ease;
      cursor: pointer;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      font-family: inherit;
      font-size: 0.95rem;
    }
    .nav-item:hover, .nav-item.active {
      background: rgba(168, 85, 247, 0.15);
      color: #fff;
    }
    .nav-item.active {
      color: var(--primary);
      border-left: 4px solid var(--primary);
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      text-decoration: none;
      font-family: inherit;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-secondary { background: rgba(255,255,255,0.06); color: #fff; border: 1px solid var(--border); }
    .btn-secondary:hover { background: rgba(255,255,255,0.12); }
    .btn-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }
    .btn-danger:hover { background: var(--danger); color: #fff; }
    .btn-success { background: rgba(34, 197, 94, 0.2); color: var(--success); border: 1px solid rgba(34, 197, 94, 0.4); }
    .btn-success:hover { background: var(--success); color: #fff; }
    
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1rem;
      overflow: hidden;
      margin-top: 1.5rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: rgba(15, 23, 42, 0.8);
      color: var(--text-muted);
      padding: 1rem 1.25rem;
      font-weight: 700;
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.05em;
    }
    td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 0.9rem;
      vertical-align: middle;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .input-field {
      width: 100%;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border);
      color: #fff;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      font-family: inherit;
      margin-top: 0.4rem;
    }
    .input-field:focus {
      outline: none;
      border-color: var(--primary);
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.35rem;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>

  <!-- Sidebar -->
  <aside class="admin-sidebar">
    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem;">
      <div style="width: 40px; height: 40px; border-radius: 0.75rem; background: linear-gradient(135deg, #a855f7, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
        ⚡
      </div>
      <div>
        <div style="font-weight: 900; font-size: 1.05rem; color: #fff;">EKO YILDIZ</div>
        <div style="font-size: 0.75rem; color: var(--primary); font-weight: 800;">ADMIN PANELİ</div>
      </div>
    </div>

    <nav style="flex: 1;">
      <button class="nav-item active" onclick="switchTab('dashboard', this)">
        <span>📊</span> Dashboard
      </button>
      <button class="nav-item" onclick="switchTab('giveaways', this)">
        <span>🎁</span> Çekilişler
      </button>
      <button class="nav-item" onclick="switchTab('wizard', this)">
        <span>✨</span> Yeni Çekiliş Sihirbazı
      </button>
      <button class="nav-item" onclick="switchTab('participants', this)">
        <span>👥</span> Katılımcı Yönetimi
      </button>
      <button class="nav-item" onclick="switchTab('fraud', this)">
        <span>🛡️</span> Şüpheli / Anti-Cheat (${fraudFlags.length})
      </button>
      <button class="nav-item" onclick="switchTab('ads', this)">
        <span>📢</span> Sponsor & Reklamlar (${ads.length})
      </button>
      <button class="nav-item" onclick="switchTab('social-ads', this)">
        <span>🌟</span> Sosyal Medya Kampanyaları (${socialAds.length})
      </button>
      <button class="nav-item" onclick="switchTab('audit', this)">
        <span>📜</span> Audit Denetim Logları
      </button>
    </nav>

    <div style="padding-top: 1.5rem; border-top: 1px solid var(--border);">
      <a href="/cekilisler" class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;">
        🌐 Platforma Git
      </a>
      <a href="/admin" class="btn btn-secondary" style="width: 100%;">
        ⚙️ Ana Site Admin
      </a>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="admin-main">
    
    <!-- Top Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1 id="pageTitle" style="font-size: 1.75rem; font-weight: 900;">Çekiliş & Sponsor Yönetim Paneli</h1>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Platform durumunu takip et, yeni çekilişler başlat ve kazananları belirle.</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button onclick="switchTab('wizard', document.querySelectorAll('.nav-item')[2])" class="btn btn-primary">
          ➕ Yeni Çekiliş Başlat
        </button>
      </div>
    </div>

    <!-- TAB 1: DASHBOARD -->
    <div id="tab-dashboard" class="tab-content active">
      <!-- Stats Overview -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Aktif Çekilişler</div>
          <div style="font-size: 2rem; font-weight: 900; color: #22c55e;">${stats.activeGiveaways || 0}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Toplam Katılımcılar</div>
          <div style="font-size: 2rem; font-weight: 900; color: #fff;">${(stats.totalParticipants || 0).toLocaleString('tr-TR')}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Toplam Bilet (Hak)</div>
          <div style="font-size: 2rem; font-weight: 900; color: #a855f7;">${(stats.totalTickets || 0).toLocaleString('tr-TR')}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Tamamlanan Görevler</div>
          <div style="font-size: 2rem; font-weight: 900; color: #38bdf8;">${(stats.completedTasks || 0).toLocaleString('tr-TR')}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Şüpheli Girişler</div>
          <div style="font-size: 2rem; font-weight: 900; color: #ef4444;">${stats.fraudCount || 0}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Aktif Sponsor Reklamları</div>
          <div style="font-size: 2rem; font-weight: 900; color: #fbbf24;">${ads.filter(a => a.isActive).length}</div>
        </div>
      </div>

      <!-- Quick Action Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        <div class="stat-card">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem;">🎁 Aktif Çekiliş Durumları</h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${giveaways.filter(g => g.status === 'ACTIVE').map(g => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(15, 23, 42, 0.6); border-radius: 0.5rem; border: 1px solid var(--border);">
                <div>
                  <div style="font-weight: 800;">${g.title}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">👥 ${g.totalEntries || 0} katılımcı &bull; 🎟️ ${g.totalTickets || 0} bilet</div>
                </div>
                <button onclick="openDrawWinnerModal('${g._id}', '${g.title.replace(/'/g, "\\'")}')" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                  🎲 Kazananı Seç
                </button>
              </div>
            `).join('') || '<div style="color:var(--text-muted); font-size:0.85rem;">Şu anda aktif çekiliş yok.</div>'}
          </div>
        </div>

        <div class="stat-card">
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem;">📢 Sponsor Reklam Performansları</h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${ads.map(ad => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(15, 23, 42, 0.6); border-radius: 0.5rem; border: 1px solid var(--border);">
                <div>
                  <div style="font-weight: 800; color: #fff;">${ad.title}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">👁️ ${ad.impressions || 0} gösterim &bull; 🖱️ ${ad.clicks || 0} tık &bull; CTR: %${ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}</div>
                </div>
                <span style="font-size: 0.75rem; font-weight: 800; color: ${ad.isActive ? '#22c55e' : '#94a3b8'};">
                  ${ad.isActive ? 'AKTİF' : 'PASİF'}
                </span>
              </div>
            `).join('') || '<div style="color:var(--text-muted); font-size:0.85rem;">Kayıtlı reklam bulunmuyor.</div>'}
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: GIVEAWAYS LIST -->
    <div id="tab-giveaways" class="tab-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="font-size: 1.25rem; font-weight: 800;">Tüm Çekilişler</h2>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Çekiliş Adı</th>
              <th>Ödül</th>
              <th>Durum</th>
              <th>Katılımcı / Bilet</th>
              <th>Bitiş Tarihi</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            ${giveaways.map(g => `
              <tr>
                <td>
                  <strong style="color: #fff;">${g.title}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Sponsor: ${g.sponsor || 'Eko Yıldız'}</div>
                </td>
                <td style="color: #38bdf8; font-weight: 700;">${g.prize}</td>
                <td>
                  <span style="font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 0.25rem; background: ${g.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2); color: #22c55e' : (g.status === 'SCHEDULED' ? 'rgba(234, 179, 8, 0.2); color: #eab308' : 'rgba(148, 163, 184, 0.2); color: #94a3b8')};">
                    ${g.status}
                  </span>
                </td>
                <td>👥 ${g.totalParticipants || g.totalEntries || 0} / 🎟️ ${g.totalTickets || 0}</td>
                <td style="color: var(--text-muted);">${new Date(g.endDate).toLocaleDateString('tr-TR')}</td>
                <td>
                  <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                    <a href="/cekilisler/${g.slug || g._id}" target="_blank" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">Görüntüle</a>
                    <button onclick="recalculateGiveawayStats('${g._id}')" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" title="Sayaçları yeniden hesapla">🔄 Sayaçlar</button>
                    ${g.status === 'ACTIVE' ? `
                      <button onclick="openDrawWinnerModal('${g._id}', '${(g.title || '').replace(/'/g, "\\'")}')" class="btn btn-primary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">🎲 Kazanan Seç</button>
                    ` : (g.status === 'COMPLETED' ? `
                      <button onclick="openDrawWinnerModal('${g._id}', '${(g.title || '').replace(/'/g, "\\'")}', true)" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; color: #fbbf24;">🔁 Yeniden Çek</button>
                      <a href="/cekilisler/canli/${g._id}" target="_blank" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; color: #38bdf8;">📺 Canlı Ekran</a>
                    ` : '')}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: MULTI-STEP GIVEAWAY CREATION WIZARD -->
    <div id="tab-wizard" class="tab-content">
      <div class="stat-card" style="max-width: 800px; margin: 0 auto; padding: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 900; margin-bottom: 0.5rem;">✨ Yeni Çekiliş Oluşturma Sihirbazı</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 2rem;">
          Adım adım bilgileri doldur, görevleri tanımla ve çekilişi yayınla veya taslak olarak sakla.
        </p>

        <form id="wizardForm" onsubmit="handleCreateGiveaway(event)">
          <!-- STEP 1: General Info -->
          <div style="border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--primary); margin-bottom: 1rem;">
              ADIM 1 — Genel Bilgiler
            </h3>
            <div class="form-group">
              <label class="form-label">Çekiliş Başlığı *</label>
              <input type="text" name="title" class="input-field" placeholder="Örn: 10.000 Robux Büyük Topluluk Çekilişi" required>
            </div>
            <div class="form-group">
              <label class="form-label">Ödül Tanımı *</label>
              <input type="text" name="prize" class="input-field" placeholder="Örn: 10.000 Robux veya Discord Nitro" required>
            </div>
            <div class="form-group">
              <label class="form-label">Sponsor Adı</label>
              <input type="text" name="sponsor" class="input-field" placeholder="Örn: Eko Yıldız veya Sponsor Marka">
            </div>
            <div class="form-group">
              <label class="form-label">Açıklama</label>
              <textarea name="description" class="input-field" rows="3" placeholder="Çekiliş hakkında detaylar, katılım şartları..."></textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Başlangıç Tarihi</label>
                <input type="datetime-local" name="startDate" class="input-field">
              </div>
              <div class="form-group">
                <label class="form-label">Bitiş Tarihi *</label>
                <input type="datetime-local" name="endDate" class="input-field" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Kapak Görseli URL</label>
              <input type="url" name="coverImage" class="input-field" placeholder="https://images.unsplash.com/...">
            </div>
          </div>

          <!-- STEP 2: Tasks Setup -->
          <div style="border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--primary); margin-bottom: 1rem;">
              ADIM 2 — Çekiliş Görevleri
            </h3>
            <div id="tasksContainer" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
              <!-- Default task 1 -->
              <div style="background: rgba(15, 23, 42, 0.6); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border); display: grid; grid-template-columns: 2fr 1fr 1fr 80px; gap: 0.5rem;">
                <input type="text" placeholder="Görev Adı (Örn: YouTube Kanalına Abone Ol)" class="input-field task-title" value="Eko Yıldız YouTube Kanalına Abone Ol" required>
                <select class="input-field task-platform">
                  <option value="youtube">YouTube</option>
                  <option value="discord">Discord</option>
                  <option value="instagram">Instagram</option>
                  <option value="site">Web Sitesi</option>
                </select>
                <input type="number" placeholder="Bilet" class="input-field task-reward" value="1" min="1">
                <select class="input-field task-mandatory">
                  <option value="true">Zorunlu</option>
                  <option value="false">Opsiyonel</option>
                </select>
              </div>
            </div>
            <button type="button" onclick="addTaskRow()" class="btn btn-secondary" style="font-size: 0.85rem;">
              ➕ Ekstra Görev Ekle
            </button>
          </div>

          <!-- STEP 3: Status & Visibility -->
          <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--primary); margin-bottom: 1rem;">
              ADIM 3 — Yayın Durumu
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Yayınlama Durumu</label>
                <select name="status" class="input-field">
                  <option value="ACTIVE">🟢 Hemen Aktif Et</option>
                  <option value="SCHEDULED">⏳ Planlanmış (Scheduled)</option>
                  <option value="DRAFT">📝 Taslak (Draft Olarak Sakla)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Öne Çıkarılsın mı?</label>
                <select name="isFeatured" class="input-field">
                  <option value="true">Evet, Ana Sayfa Hero'da Göster</option>
                  <option value="false">Hayır, Standart Liste</option>
                </select>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button type="button" onclick="switchTab('giveaways', document.querySelectorAll('.nav-item')[1])" class="btn btn-secondary">
              İptal
            </button>
            <button type="submit" class="btn btn-primary" style="padding: 0.75rem 2rem;">
              🚀 Çekilişi Kaydet & Yayınla
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TAB 4: PARTICIPANTS & VERIFICATION -->
    <div id="tab-participants" class="tab-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="font-size: 1.25rem; font-weight: 800;">Katılımcı & Bilet İnceleme</h2>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Kullanıcı Adı</th>
              <th>Çekiliş</th>
              <th>Bilet Sayısı</th>
              <th>IP Adresi</th>
              <th>Referral Kodu</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${participants.map(p => `
              <tr>
                <td><strong style="color: #fff;">@${p.username}</strong></td>
                <td>${p.giveawayTitle || p.giveawayId}</td>
                <td style="color: #a855f7; font-weight: 800;">🎟️ ${p.ticketCount || 1}</td>
                <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">${p.ip || '127.0.0.1'}</td>
                <td style="font-family: monospace; font-size: 0.8rem;">${p.referralCode || '-'}</td>
                <td>
                  <span style="font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 0.25rem; background: ${p.status === 'VALID' ? 'rgba(34, 197, 94, 0.2); color: #22c55e' : 'rgba(239, 68, 68, 0.2); color: #ef4444'};">
                    ${p.status || 'VALID'}
                  </span>
                </td>
                <td>
                  ${p.status === 'VALID' ? `
                    <button onclick="disqualifyParticipant('${p._id}')" class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">İptal Et</button>
                  ` : `
                    <button onclick="restoreParticipant('${p._id}')" class="btn btn-success" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">Onayla</button>
                  `}
                </td>
              </tr>
            `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;">Kayıtlı katılımcı bulunmuyor.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 5: FRAUD & ANTI-CHEAT -->
    <div id="tab-fraud" class="tab-content">
      <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1rem;">🛡️ Anti-Cheat & Şüpheli Katılımlar</h2>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
        Sistem aynı IP'den çoklu hesap, kendi referansıyla kaydolma veya anormal hızda görev tamamlama durumlarını otomatik olarak şüpheli olarak işaretler. Admin kararıyla engellenir veya serbest bırakılır.
      </p>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Kullanıcı / Çekiliş</th>
              <th>İhlal Nedeni</th>
              <th>IP / Sinyal</th>
              <th>Tarih</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${fraudFlags.map(f => `
              <tr>
                <td>
                  <strong>@${f.username}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${f.giveawayTitle || f.giveawayId}</div>
                </td>
                <td style="color: #ef4444; font-weight: 700;">${f.reason}</td>
                <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">${f.ip || '-'}</td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(f.timestamp).toLocaleString('tr-TR')}</td>
                <td>
                  <button onclick="resolveFraud('${f._id}', 'BAN')" class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">Diskalifiye Et</button>
                  <button onclick="resolveFraud('${f._id}', 'IGNORE')" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">Görmezden Gel</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">Harika! Şu anda herhangi bir şüpheli katılım bulunmuyor.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 6: SPONSOR ADS MANAGEMENT -->
    <div id="tab-ads" class="tab-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 800;">Sponsorlu Bağlantılar & Reklamlar</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Sitede gösterilen sponsor kartlarını yönet, gösterim/tıklama oranlarını izle.</p>
        </div>
        <button onclick="document.getElementById('newAdModal').style.display='flex'" class="btn btn-primary">
          ➕ Yeni Sponsor Reklamı Ekle
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Reklam & Sponsor</th>
              <th>Hedef URL</th>
              <th>Öncelik</th>
              <th>Gösterim</th>
              <th>Tıklama</th>
              <th>CTR (%)</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${ads.map(ad => `
              <tr>
                <td>
                  <strong style="color: #fff;">${ad.title}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Sponsor: ${ad.sponsorName}</div>
                </td>
                <td style="font-size: 0.8rem; color: var(--accent); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <a href="${ad.targetUrl}" target="_blank" style="color: var(--accent);">${ad.targetUrl}</a>
                </td>
                <td style="font-weight: 800;">${ad.priority || 1}</td>
                <td>${ad.impressions || 0}</td>
                <td style="color: #38bdf8; font-weight: 700;">${ad.clicks || 0}</td>
                <td style="color: #a855f7; font-weight: 700;">
                  %${ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}
                </td>
                <td>
                  <span style="font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 0.25rem; background: ${ad.isActive ? 'rgba(34, 197, 94, 0.2); color: #22c55e' : 'rgba(239, 68, 68, 0.2); color: #ef4444'};">
                    ${ad.isActive ? 'AKTİF' : 'PASİF'}
                  </span>
                </td>
                <td>
                  <button onclick="toggleAdStatus('${ad._id}')" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">
                    ${ad.isActive ? 'Pasife Al' : 'Aktif Et'}
                  </button>
                  <button onclick="deleteAd('${ad._id}')" class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">
                    Sil
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: SOCIAL ADS & INTERACTIVE CAMPAIGNS -->
    <div id="tab-social-ads" class="tab-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 800;">🌟 Eko Yıldız Sosyal Medya Kampanyaları & Social Ads Hub</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem;">7 Resmi hesabın interaktif micro-ad deneyimlerini, anlık etkileşim metriklerini ve sezonluk kampanya modlarını yönetin.</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <a href="/#social-hub" target="_blank" class="btn btn-secondary">
            👁️ Sitede Önizle
          </a>
        </div>
      </div>

      <!-- Social Ads Metrics Row -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Toplam Görüntülenme</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #fff; margin: 0.35rem 0;">${socialAnalytics.totalViews || 0}</div>
          <div style="font-size: 0.75rem; color: var(--accent);">Tüm kartların toplam impression'ı</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Başlatılan Etkileşim</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #38bdf8; margin: 0.35rem 0;">
            ${socialAds.reduce((s, a) => s + (Number(a.interactionsStarted) || 0), 0)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Oyuna / deneyime katılım</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Tamamlanan Deneyim</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #22c55e; margin: 0.35rem 0;">${socialAnalytics.totalCompleted || 0}</div>
          <div style="font-size: 0.75rem; color: #22c55e;">Başarıyla sonlandırılanlar</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Sosyal Medyaya Tıklama</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #a855f7; margin: 0.35rem 0;">${socialAnalytics.totalClicks || 0}</div>
          <div style="font-size: 0.75rem; color: #a855f7;">Resmi hesaba gidenler</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">En Popüler Platform</div>
          <div style="font-size: 1.3rem; font-weight: 900; color: #fef08a; margin: 0.35rem 0;">${topPlatform}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">En yüksek tamamlanma sayısı</div>
        </div>
      </div>

      <!-- Social Ads Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Platform & Hesap</th>
              <th>İnteraktif Deneyim</th>
              <th>Sezonluk Kampanya</th>
              <th>Görüntülenme / Başlatma / Tamamlama</th>
              <th>Tıklama / CTR</th>
              <th>Öne Çıkarılmış</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            ${socialAds.map(s => {
              const ctr = s.views ? ((s.clicks / s.views) * 100).toFixed(1) : 0;
              const comp = s.interactionsStarted ? ((s.interactionsCompleted / s.interactionsStarted) * 100).toFixed(1) : 0;
              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="font-size: 1.25rem;">
                        ${s.platform === 'youtube' ? '▶' : (s.platform === 'instagram' ? '📸' : (s.platform === 'tiktok' ? '🎵' : (s.platform === 'kick' ? '🟢' : '💜')))}
                      </span>
                      <div>
                        <strong style="color: #fff;">${s.accountName || s.title}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${s.badgeText || s.platform}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1; background: rgba(255,255,255,0.06); padding: 0.2rem 0.5rem; border-radius: 4px;">
                      ${s.interactionType || 'standard'}
                    </span>
                  </td>
                  <td>
                    ${s.seasonalTag ? `
                      <span style="font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; background: rgba(234, 179, 8, 0.2); color: #fef08a;">
                        ${s.seasonalTag}
                      </span>
                    ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Standart</span>'}
                  </td>
                  <td>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #fff;">
                      ${s.views || 0} / <span style="color:#38bdf8;">${s.interactionsStarted || 0}</span> / <span style="color:#22c55e;">${s.interactionsCompleted || 0}</span>
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">Tamamlama: %${comp}</div>
                  </td>
                  <td>
                    <div style="font-size: 0.85rem; font-weight: 800; color: #a855f7;">
                      ${s.clicks || 0} tık
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">CTR: %${ctr}</div>
                  </td>
                  <td>
                    ${s.isFeatured ? '<span style="color:#fbbf24; font-weight:800;">⭐ EVET</span>' : '<span style="color:var(--text-muted);">Hayır</span>'}
                  </td>
                  <td>
                    <span style="font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 0.25rem; background: ${s.isActive !== false ? 'rgba(34, 197, 94, 0.2); color: #22c55e' : 'rgba(239, 68, 68, 0.2); color: #ef4444'};">
                      ${s.isActive !== false ? 'AKTİF' : 'PASİF'}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                      <button onclick="toggleSocialAd('${s.key}')" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;">
                        ${s.isActive !== false ? 'Pasife Al' : 'Aktif Et'}
                      </button>
                      <button onclick='openEditSocialAdModal(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="btn btn-primary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;">
                        ✏️ Düzenle
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 7: AUDIT LOGS -->
    <div id="tab-audit" class="tab-content">
      <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1rem;">📜 Platform Denetim (Audit) Logları</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>İşlem (Action)</th>
              <th>Yapan Yetkili</th>
              <th>Detaylar</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            ${auditLogs.map(log => `
              <tr>
                <td style="color: #a855f7; font-weight: 800;">[${log.action}]</td>
                <td><strong>@${log.adminUsername || 'Sistem'}</strong></td>
                <td style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">${JSON.stringify(log.details || {})}</td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(log.timestamp).toLocaleString('tr-TR')}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem;">Henüz kayıt bulunmuyor.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

  </main>

  <!-- DRAW WINNER MODAL -->
  <div id="drawWinnerModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center; padding: 1.5rem;">
    <div class="stat-card" style="width: 100%; max-width: 500px; padding: 2rem; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎲</div>
      <h2 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 0.5rem;">Kriptografik Kazanan Çekilişi</h2>
      <p id="modalGiveawayTitle" style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Çekiliş Başlığı</p>
      
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.5rem; text-align: left; font-size: 0.85rem; color: var(--text-muted);">
        ℹ️ Çekiliş, katılımcıların toplam geçerli bilet sayısı üzerinden <strong>Node.js Crypto CSPRNG</strong> algoritmasıyla gerçekleştirilir. Kazanan kaydedildikten sonra geri alınamaz, ancak gerekirse yedek veya yeniden çekiliş yapılabilir.
      </div>

      <input type="hidden" id="modalGiveawayId">
      <input type="hidden" id="modalIsRedraw">

      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button onclick="document.getElementById('drawWinnerModal').style.display='none'" class="btn btn-secondary">
          Vazgeç
        </button>
        <button onclick="executeDrawWinner()" class="btn btn-primary" style="padding: 0.75rem 2rem;">
          🎲 Çekilişi Gerçekleştir
        </button>
      </div>
    </div>
  </div>

  <!-- NEW SPONSOR AD MODAL -->
  <div id="newAdModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center; padding: 1.5rem;">
    <div class="stat-card" style="width: 100%; max-width: 550px; padding: 2rem;">
      <h2 style="font-size: 1.3rem; font-weight: 900; margin-bottom: 1rem;">➕ Yeni Sponsor Reklamı Ekle</h2>
      <form onsubmit="handleCreateAd(event)">
        <div class="form-group">
          <label class="form-label">Başlık *</label>
          <input type="text" name="title" class="input-field" placeholder="Örn: Eko Yıldız Resmi Discord Sunucusu" required>
        </div>
        <div class="form-group">
          <label class="form-label">Sponsor Marka / Adı *</label>
          <input type="text" name="sponsorName" class="input-field" placeholder="Örn: Eko Yıldız" required>
        </div>
        <div class="form-group">
          <label class="form-label">Kısa Açıklama</label>
          <input type="text" name="description" class="input-field" placeholder="Topluluğumuza katıl, sohbet et ve ödüller kazan!">
        </div>
        <div class="form-group">
          <label class="form-label">Hedef URL (Bağlantı) *</label>
          <input type="url" name="targetUrl" class="input-field" placeholder="https://discord.gg/..." required>
        </div>
        <div class="form-group">
          <label class="form-label">Görsel URL</label>
          <input type="url" name="imageUrl" class="input-field" placeholder="https://...">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">CTA Buton Yazısı</label>
            <input type="text" name="ctaText" class="input-field" value="Hemen Katıl">
          </div>
          <div class="form-group">
            <label class="form-label">Öncelik (1-10)</label>
            <input type="number" name="priority" class="input-field" value="5" min="1" max="10">
          </div>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
          <button type="button" onclick="document.getElementById('newAdModal').style.display='none'" class="btn btn-secondary">
            İptal
          </button>
          <button type="submit" class="btn btn-primary">
            Kaydet & Yayınla
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function switchTab(tabId, el) {
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');
      if (el) el.classList.add('active');
    }

    function addTaskRow() {
      const container = document.getElementById('tasksContainer');
      const div = document.createElement('div');
      div.style = "background: rgba(15, 23, 42, 0.6); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border); display: grid; grid-template-columns: 2fr 1fr 1.2fr 1fr 80px; gap: 0.5rem;";
      div.innerHTML = \`
        <input type="text" placeholder="Görev Adı" class="input-field task-title" required>
        <select class="input-field task-platform">
          <option value="youtube">YouTube</option>
          <option value="discord">Discord</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="kick">Kick</option>
          <option value="twitch">Twitch</option>
          <option value="site">Web Sitesi</option>
        </select>
        <select class="input-field task-strategy" title="Doğrulama Yöntemi">
          <option value="VISIT_ONLY">VISIT_ONLY (Ziyaret)</option>
          <option value="AUTO">AUTO (Otomatik Onay)</option>
          <option value="API">API (Entegrasyon)</option>
          <option value="PROOF_REQUIRED">PROOF_REQUIRED (Kanıt)</option>
          <option value="MANUAL">MANUAL (Admin Onayı)</option>
        </select>
        <input type="number" placeholder="Bilet" class="input-field task-reward" value="1" min="1">
        <select class="input-field task-mandatory">
          <option value="false">Opsiyonel</option>
          <option value="true">Zorunlu</option>
        </select>
      \`;
      container.appendChild(div);
    }

    async function handleCreateGiveaway(e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Collect tasks
      const taskRows = document.querySelectorAll('#tasksContainer > div');
      const tasks = [];
      taskRows.forEach(row => {
        const title = row.querySelector('.task-title').value.trim();
        const platform = row.querySelector('.task-platform').value;
        const strategy = row.querySelector('.task-strategy')?.value || 'VISIT_ONLY';
        const reward = parseInt(row.querySelector('.task-reward').value, 10) || 1;
        const isMandatory = row.querySelector('.task-mandatory').value === 'true';
        if (title) {
          tasks.push({ title, platform, strategy, ticketReward: reward, isMandatory });
        }
      });
      data.tasks = tasks;

      try {
        const res = await fetch('/api/admin/giveaways', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          alert('✅ Çekiliş başarıyla oluşturuldu!');
          window.location.reload();
        } else {
          alert('Hata: ' + (result.message || 'Oluşturulamadı'));
        }
      } catch (err) {
        alert('Sunucu hatası: ' + err.message);
      }
    }

    function openDrawWinnerModal(giveawayId, title, isRedraw = false) {
      document.getElementById('modalGiveawayId').value = giveawayId;
      document.getElementById('modalGiveawayTitle').innerText = title + (isRedraw ? ' (Yeniden Çekiliş — Redraw)' : '');
      document.getElementById('modalIsRedraw').value = isRedraw ? '1' : '0';
      
      const reasonGroup = document.getElementById('modalRedrawReasonGroup');
      if (reasonGroup) {
        reasonGroup.style.display = isRedraw ? 'block' : 'none';
        document.getElementById('modalRedrawReason').value = isRedraw ? '24 saat içinde dönüş yapmadı' : '';
      }
      document.getElementById('drawWinnerModal').style.display = 'flex';
    }

    async function executeDrawWinner() {
      const giveawayId = document.getElementById('modalGiveawayId').value;
      const isRedraw = document.getElementById('modalIsRedraw').value === '1';
      const reason = document.getElementById('modalRedrawReason')?.value?.trim() || '';

      if (isRedraw && (!reason || reason.length < 5)) {
        alert('Yeniden çekiliş için zorunlu bir sebep belirtmelisiniz (min 5 karakter).');
        return;
      }

      if (!confirm(isRedraw ? 'Yeniden çekiliş yapılarak eski kazanan arşivlenecek ve yeni kazanan seçilecek. Onaylıyor musunuz?' : 'Kriptografik ağırlıklı rastgele çekiliş başlatılacak ve kazanan kalıcı olarak kaydedilecektir. Onaylıyor musunuz?')) {
        return;
      }

      try {
        const endpoint = isRedraw ? ('/api/admin/giveaways/' + giveawayId + '/redraw') : ('/api/admin/giveaways/' + giveawayId + '/draw');
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRedraw, reason })
        });
        const data = await res.json();
        if (data.success) {
          const winnerName = data.mainWinner?.username || data.winner?.username || 'Kazanan';
          alert('🎉 Kazanan başarıyla seçildi: @' + winnerName);
          window.location.href = '/cekilisler/canli/' + giveawayId;
        } else {
          alert('Hata: ' + (data.message || 'Kazanan seçilemedi.'));
        }
      } catch (err) {
        alert('Sunucu hatası: ' + err.message);
      }
    }

    async function recalculateGiveawayStats(giveawayId) {
      if (!confirm('Bu çekilişin sayaçlarını gerçek entry verileri üzerinden yeniden hesaplamak istiyor musunuz?')) return;
      try {
        const res = await fetch('/api/admin/giveaways/' + giveawayId + '/recalculate-stats', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          alert('✅ Sayaçlar güncellendi!\nKatılımcı: ' + data.totalParticipants + '\nBilet: ' + data.totalTickets);
          window.location.reload();
        } else {
          alert('Hata: ' + (data.message || 'Hesaplanamadı'));
        }
      } catch (err) {
        alert('Sunucu hatası: ' + err.message);
      }
    }

    async function disqualifyParticipant(id) {
      const reason = prompt('Katılımcıyı diskalifiye etme gerekçesini giriniz:', 'Şüpheli katılım / Çift hesap');
      if (!reason || reason.trim().length < 4) {
        alert('İşlem iptal edildi. Geçerli bir gerekçe girmelisiniz.');
        return;
      }
      try {
        const res = await fetch('/api/admin/participants/' + id + '/disqualify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ Katılımcı diskalifiye edildi.');
          window.location.reload();
        } else {
          alert('Hata: ' + (data.message || 'İşlem başarısız'));
        }
      } catch (err) {
        alert('Sunucu hatası: ' + err.message);
      }
    }

    async function restoreParticipant(id) {
      if (!confirm('Katılımcının engelini kaldırmak ve biletlerini geri iade etmek istiyor musunuz?')) return;
      try {
        const res = await fetch('/api/admin/participants/' + id + '/restore', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          alert('✅ Katılımcı hakları iade edildi.');
          window.location.reload();
        } else {
          alert('Hata: ' + (data.message || 'İşlem başarısız'));
        }
      } catch (err) {
        alert('Sunucu hatası: ' + err.message);
      }
    }

    async function resolveFraud(id, action) {
      let reason = '';
      if (action === 'BAN' || action === 'DISQUALIFY') {
        reason = prompt('Diskalifiye gerekçesi:', 'Referral ve çoklu hesap suistimali');
        if (!reason) return;
        action = 'DISQUALIFY';
      }
      try {
        const res = await fetch('/api/admin/fraud/' + id + '/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, reason })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ İşlem uygulandı.');
          window.location.reload();
        } else {
          alert('Hata: ' + (data.message || 'İşlem başarısız'));
        }
      } catch (err) {
        alert('Hata: ' + err.message);
      }
    }

    async function handleCreateAd(e) {
      e.preventDefault();
      const form = e.target;
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch('/api/admin/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          alert('✅ Reklam başarıyla kaydedildi!');
          window.location.reload();
        } else {
          alert('Hata: ' + (result.message || 'Eklenemedi'));
        }
      } catch (err) {
        alert('Sunucu hatası: ' + err.message);
      }
    }

    async function toggleAdStatus(adId) {
      try {
        const res = await fetch('/api/admin/ads/' + adId + '/toggle', { method: 'POST' });
        const result = await res.json();
        if (result.success) window.location.reload();
      } catch (err) {
        alert('Hata: ' + err.message);
      }
    }

    async function toggleSocialAd(key) {
      try {
        const res = await fetch('/api/admin/social-ads/' + key + '/toggle', { method: 'POST' });
        const result = await res.json();
        if (result.success) window.location.reload();
        else alert('Hata: ' + (result.message || 'İşlem başarısız'));
      } catch (err) {
        alert('Hata: ' + err.message);
      }
    }

    function openEditSocialAdModal(ad) {
      document.getElementById('editAdKey').value = ad.key || '';
      document.getElementById('editAdTitle').value = ad.title || '';
      document.getElementById('editAdSubtitle').value = ad.subtitle || '';
      document.getElementById('editAdCta').value = ad.ctaText || '';
      document.getElementById('editAdQuote').value = ad.wittyQuote || '';
      document.getElementById('editAdUrl').value = ad.targetUrl || '';
      document.getElementById('editAdBadge').value = ad.badgeText || '';
      document.getElementById('editAdSeasonal').value = ad.seasonalTag || '';
      document.getElementById('editAdOrder').value = ad.order || 1;
      document.getElementById('editAdFeatured').checked = Boolean(ad.isFeatured);
      document.getElementById('editSocialAdModal').style.display = 'flex';
    }

    async function handleUpdateSocialAd(e) {
      e.preventDefault();
      const form = e.target;
      const key = document.getElementById('editAdKey').value;
      const data = {
        title: document.getElementById('editAdTitle').value,
        subtitle: document.getElementById('editAdSubtitle').value,
        ctaText: document.getElementById('editAdCta').value,
        wittyQuote: document.getElementById('editAdQuote').value,
        targetUrl: document.getElementById('editAdUrl').value,
        badgeText: document.getElementById('editAdBadge').value,
        seasonalTag: document.getElementById('editAdSeasonal').value,
        order: parseInt(document.getElementById('editAdOrder').value, 10) || 1,
        isFeatured: document.getElementById('editAdFeatured').checked
      };

      try {
        const res = await fetch('/api/admin/social-ads/' + key + '/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          alert('✅ Sosyal Reklam başarıyla güncellendi!');
          window.location.reload();
        } else {
          alert('Hata: ' + (result.message || 'Güncellenemedi'));
        }
      } catch (err) {
        alert('Sunucu hatası: ' + err.message);
      }
    }
  </script>

  <!-- EDIT SOCIAL AD MODAL -->
  <div id="editSocialAdModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center; padding: 1.5rem;">
    <div class="stat-card" style="width: 100%; max-width: 600px; padding: 2rem; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h2 style="font-size: 1.3rem; font-weight: 900;">✏️ Sosyal Kampanya Kartını Düzenle</h2>
        <button onclick="document.getElementById('editSocialAdModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
      </div>
      <form onsubmit="handleUpdateSocialAd(event)">
        <input type="hidden" id="editAdKey">
        <div class="form-group">
          <label class="form-label">Başlık *</label>
          <input type="text" id="editAdTitle" class="input-field" required>
        </div>
        <div class="form-group">
          <label class="form-label">Açıklama / Alt Başlık</label>
          <input type="text" id="editAdSubtitle" class="input-field">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">CTA Buton Yazısı</label>
            <input type="text" id="editAdCta" class="input-field" required>
          </div>
          <div class="form-group">
            <label class="form-label">Rozet / Badge Metni</label>
            <input type="text" id="editAdBadge" class="input-field">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Mizahi Metin / İpucu</label>
          <input type="text" id="editAdQuote" class="input-field">
        </div>
        <div class="form-group">
          <label class="form-label">Hedef URL *</label>
          <input type="url" id="editAdUrl" class="input-field" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Sezonluk Kampanya Modu</label>
            <select id="editAdSeasonal" class="input-field">
              <option value="">Standart (Normal)</option>
              <option value="🔥 Yeni Video Düştü">🔥 Yeni Video Düştü</option>
              <option value="🟢 Bu Akşam Canlı Yayın">🟢 Bu Akşam Canlı Yayın</option>
              <option value="🎁 Çekiliş Görevi Aktif">🎁 Çekiliş Görevi Aktif</option>
              <option value="✨ Özel Gün Kampanyası">✨ Özel Gün Kampanyası</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sıralama (Order)</label>
            <input type="number" id="editAdOrder" class="input-field" min="1" max="50">
          </div>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
          <input type="checkbox" id="editAdFeatured" style="width: 18px; height: 18px;">
          <label for="editAdFeatured" style="font-size: 0.9rem; font-weight: 700; color: #fff; cursor: pointer;">
            ⭐ Bu kartı öne çıkar (Featured / Highlight)
          </label>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" onclick="document.getElementById('editSocialAdModal').style.display='none'" class="btn btn-secondary">
            İptal
          </button>
          <button type="submit" class="btn btn-primary">
            💾 Değişiklikleri Kaydet
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- DRAW WINNER MODAL -->
  <div id="drawWinnerModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center; padding: 1.5rem;">
    <div class="stat-card" style="width: 100%; max-width: 540px; padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h2 style="font-size: 1.3rem; font-weight: 900; color: #fef08a;">🎲 Kazanan Seçimi & Onay</h2>
        <button onclick="document.getElementById('drawWinnerModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
      </div>
      <input type="hidden" id="modalGiveawayId">
      <input type="hidden" id="modalIsRedraw" value="0">
      
      <p id="modalGiveawayTitle" style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 0.75rem;"></p>
      
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
        ⚖️ <strong>Kriptografik Ağırlıklı Rastgele Seçim:</strong> Katılımcıların geçerli bilet sayılarına göre orantılı şans hesaplanır. İşlem transactional kilide alınır ve sonuç audit log'a kaydedilir.
      </div>

      <div id="modalRedrawReasonGroup" style="display: none; margin-bottom: 1.25rem;">
        <label class="form-label" style="color: #fef08a; font-weight: 700;">Yeniden Çekiliş Gerekçesi (Zorunlu) *</label>
        <input type="text" id="modalRedrawReason" class="input-field" placeholder="Örn: Asil kazanan 24 saat içinde dönüş yapmadı">
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">Eski kazanan kaydı silinmez, 'INVALIDATED' durumuyla şeffaflık loglarında arşivlenir.</div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
        <button type="button" onclick="document.getElementById('drawWinnerModal').style.display='none'" class="btn btn-secondary">
          Vazgeç
        </button>
        <button type="button" onclick="executeDrawWinner()" class="btn btn-primary" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);">
          🎰 Seçimi Başlat
        </button>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { renderGiveawayAdminPage };
