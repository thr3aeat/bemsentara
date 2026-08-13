'use strict';

const { isSiteAdmin } = require("../../utils/adminCheck");

function renderTumModlarPage(user) {
  const content = `
    <div class="tumodlar-container">
      <!-- HEADER BANNER -->
      <div class="banner-card">
        <div class="banner-info">
          <div class="banner-badge">👑 SADECE YÖNETİCİ (ADMIN) ERİŞİMİ</div>
          <h1 class="banner-title">Tüm Moderatörler & Mod Okulu Yönetim Paneli</h1>
          <p class="banner-sub">
            Tüm ekip üyelerini, Mod Okulu öğrencilerini yönetebilir; moderatörleri <strong>kovabilir</strong>, 
            <strong>Discord / Roblox hesaplarını değiştirebilir</strong> ve 
            <strong>"🚨 DİKKAT: Eksik Doğrulama İşlemi"</strong> DM uyarısının gitme durumunu ayarlayabilirsiniz.
          </p>
        </div>
        <div class="banner-actions">
          <button class="btn btn-warning" onclick="toggleGlobalVerificationDM(true)">
            🚨 Tüm Ekip İçin Eksik Doğrulama DM'ini Kapat
          </button>
          <button class="btn btn-success" onclick="toggleGlobalVerificationDM(false)">
            📩 Tüm Ekip İçin Aç
          </button>
          <button class="btn btn-secondary" onclick="loadModData()">
            🔄 Yenile
          </button>
        </div>
      </div>

      <!-- QUICK STATS CARDS -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-data">
            <div class="stat-val" id="stat-total">0</div>
            <div class="stat-lbl">Toplam Moderatör</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <div class="stat-data">
            <div class="stat-val" id="stat-school">0</div>
            <div class="stat-lbl">Mod Okulundaki Öğrenci</div>
          </div>
        </div>
        <div class="stat-card stat-alert">
          <div class="stat-icon">🚨</div>
          <div class="stat-data">
            <div class="stat-val" id="stat-disabled-dm">0</div>
            <div class="stat-lbl">Eksik Doğrulama DM'i Kapalı</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">☀️</div>
          <div class="stat-data">
            <div class="stat-val" id="stat-briefing">0</div>
            <div class="stat-lbl">Sabah Briefingi Açık</div>
          </div>
        </div>
      </div>

      <!-- FILTER & SEARCH BAR -->
      <div class="filter-card">
        <div class="tab-buttons">
          <button class="tab-btn active" data-tab="all" onclick="setTab('all')">🌐 Tüm Moderatörler</button>
          <button class="tab-btn" data-tab="school" onclick="setTab('school')">🎓 Mod Okulundakiler</button>
          <button class="tab-btn" data-tab="dm-disabled" onclick="setTab('dm-disabled')">🚨 Eksik Doğrulama DM'i Kapalı</button>
          <button class="tab-btn" data-tab="briefing" onclick="setTab('briefing')">☀️ Briefing Açık Olanlar</button>
        </div>
        <div class="search-box">
          <input type="text" id="modSearchInput" placeholder="Kullanıcı adı, Roblox kullanıcı adı veya Discord ID ile ara..." oninput="filterMods()" />
        </div>
      </div>

      <!-- MODERATOR LIST GRID -->
      <div id="modListGrid" class="mod-grid">
        <div class="loading-spinner">🔄 Moderatör verileri yükleniyor...</div>
      </div>
    </div>

    <!-- MODAL: ACCOUNT CHANGE -->
    <div id="accountModal" class="modal-overlay" style="display:none;">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">🔄 Discord / Roblox Hesap Değiştirme</h3>
          <button class="modal-close" onclick="closeAccountModal()">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="modalTargetUserId" />
          <div class="form-group">
            <label class="form-label">Mevcut Discord ID:</label>
            <input type="text" id="modalCurrentId" class="form-input" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Yeni Discord ID (Opsiyonel - Tüm Verileri Aktarır):</label>
            <input type="text" id="modalNewDiscordId" class="form-input" placeholder="Örn: 1031620522406072350" />
          </div>
          <div class="form-group">
            <label class="form-label">Yeni Discord Kullanıcı Adı (Hesap Aktarımı İçin):</label>
            <input type="text" id="modalNewDiscordUsername" class="form-input" placeholder="Örn: yeni_kullanici" />
          </div>
          <div class="form-group">
            <label class="form-label">Yeni Roblox Kullanıcı Adı (Opsiyonel):</label>
            <input type="text" id="modalNewRobloxUsername" class="form-input" placeholder="Örn: RobloxKullaniciAdi" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeAccountModal()">İptal</button>
          <button class="btn btn-primary" onclick="submitAccountChange()">💾 Değişikliği Kaydet</button>
        </div>
      </div>
    </div>

    <!-- STYLES -->
    <style>
      .tumodlar-container {
        max-width: 1320px;
        margin: 0 auto;
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .banner-card {
        background: linear-gradient(135deg, rgba(30,27,75,0.7) 0%, rgba(15,23,42,0.85) 100%);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 28px;
        backdrop-filter: blur(var(--glass-blur));
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }
      .banner-info { max-width: 750px; }
      .banner-badge {
        display: inline-block;
        background: rgba(244,63,94,0.18);
        color: #fb7185;
        border: 1px solid rgba(244,63,94,0.35);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        margin-bottom: 10px;
        letter-spacing: 0.5px;
      }
      .banner-title { font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 8px; }
      .banner-sub { color: var(--muted); font-size: 0.95rem; line-height: 1.5; }
      .banner-actions { display: flex; gap: 10px; flex-wrap: wrap; }

      .btn {
        padding: 9px 16px;
        border-radius: 10px;
        font-family: inherit;
        font-size: 0.86rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .btn-primary { background: rgba(167,139,250,0.25); color: #c084fc; border: 1px solid rgba(167,139,250,0.4); }
      .btn-primary:hover { background: rgba(167,139,250,0.4); transform: translateY(-2px); }
      .btn-danger { background: rgba(244,63,94,0.18); color: #fb7185; border: 1px solid rgba(244,63,94,0.35); }
      .btn-danger:hover { background: rgba(244,63,94,0.3); transform: translateY(-2px); }
      .btn-warning { background: rgba(251,191,36,0.18); color: #fbbf24; border: 1px solid rgba(251,191,36,0.35); }
      .btn-warning:hover { background: rgba(251,191,36,0.3); transform: translateY(-2px); }
      .btn-success { background: rgba(52,211,153,0.18); color: #34d399; border: 1px solid rgba(52,211,153,0.35); }
      .btn-success:hover { background: rgba(52,211,153,0.3); transform: translateY(-2px); }
      .btn-secondary { background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid var(--border); }
      .btn-secondary:hover { background: rgba(255,255,255,0.15); }

      /* STATS GRID */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }
      .stat-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        backdrop-filter: blur(var(--glass-blur));
      }
      .stat-card.stat-alert { border-color: rgba(251,113,133,0.3); background: rgba(251,113,133,0.05); }
      .stat-icon { font-size: 2.2rem; }
      .stat-val { font-size: 1.8rem; font-weight: 800; color: #fff; }
      .stat-lbl { font-size: 0.85rem; color: var(--muted); }

      /* FILTER & SEARCH */
      .filter-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 14px;
      }
      .tab-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
      .tab-btn {
        background: transparent;
        border: 1px solid transparent;
        color: var(--muted);
        padding: 8px 16px;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .tab-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
      .tab-btn.active {
        background: rgba(167,139,250,0.15);
        color: var(--accent);
        border-color: rgba(167,139,250,0.3);
      }
      .search-box { flex: 1; min-width: 280px; }
      .search-box input {
        width: 100%;
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        padding: 10px 16px;
        border-radius: 8px;
        color: #fff;
        font-family: inherit;
        font-size: 0.9rem;
        outline: none;
      }
      .search-box input:focus { border-color: var(--accent); }

      /* MODERATOR CARDS GRID */
      .mod-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 18px;
      }
      .mod-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: relative;
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      .mod-card:hover { transform: translateY(-2px); border-color: rgba(167,139,250,0.4); }
      .mod-card.dm-disabled-card { border-left: 4px solid var(--warning); }
      .mod-card.dismissed-card { opacity: 0.6; border-left: 4px solid var(--danger); }

      .mod-header { display: flex; align-items: center; gap: 14px; }
      .mod-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #2a2a40;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        border: 2px solid var(--border);
      }
      .mod-name-info { flex: 1; }
      .mod-name { font-size: 1.1rem; font-weight: 700; color: #fff; }
      .mod-id { font-size: 0.78rem; color: var(--muted); }
      .mod-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 700;
        margin-top: 4px;
      }
      .badge-stajyer { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
      .badge-personel { background: rgba(167,139,250,0.15); color: #c084fc; border: 1px solid rgba(167,139,250,0.3); }
      .badge-sekreter { background: rgba(244,63,94,0.15); color: #fb7185; border: 1px solid rgba(244,63,94,0.3); }
      .badge-school { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }

      .mod-details {
        background: rgba(0,0,0,0.25);
        border: 1px solid rgba(255,255,255,0.04);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 0.85rem;
      }
      .detail-row { display: flex; justify-content: space-between; color: var(--muted); }
      .detail-val { color: #fff; font-weight: 600; }

      /* ACTION BUTTONS ON CARD */
      .card-admin-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        border-top: 1px solid var(--border);
        padding-top: 14px;
      }

      /* TOGGLE SWITCHES */
      .switches-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .switch-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255,255,255,0.02);
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--border);
      }
      .switch-label { font-size: 0.85rem; font-weight: 600; color: #e2e8f0; }
      .switch-desc { font-size: 0.75rem; color: var(--muted); font-weight: 400; }

      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
      }
      .toggle-switch input { opacity: 0; width: 0; height: 0; }
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: #334155;
        transition: .3s;
        border-radius: 24px;
      }
      .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .3s;
        border-radius: 50%;
      }
      input:checked + .slider { background-color: #34d399; }
      input:checked + .slider.alert-slider { background-color: #fb7185; }
      input:checked + .slider:before { transform: translateX(20px); }

      /* MODAL STYLES */
      .modal-overlay {
        position: fixed;
        top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-card {
        background: #0f172a;
        border: 1px solid var(--border);
        border-radius: 16px;
        width: 90%;
        max-width: 520px;
        padding: 24px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      }
      .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
      .modal-title { font-size: 1.2rem; font-weight: 700; color: #fff; }
      .modal-close { background: transparent; border: none; color: var(--muted); font-size: 1.2rem; cursor: pointer; }
      .modal-body { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
      .form-group { display: flex; flex-direction: column; gap: 6px; }
      .form-label { font-size: 0.85rem; font-weight: 600; color: #cbd5e1; }
      .form-input {
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--border);
        padding: 10px 14px;
        border-radius: 8px;
        color: #fff;
        font-family: inherit;
        font-size: 0.9rem;
        outline: none;
      }
      .form-input:focus { border-color: var(--accent); }
      .modal-footer { display: flex; justify-content: flex-end; gap: 10px; }

      .loading-spinner { text-align: center; padding: 40px; color: var(--muted); font-size: 1.1rem; }
    </style>

    <!-- CLIENT SCRIPT -->
    <script>
      let allModerators = [];
      let currentTab = 'all';

      async function loadModData() {
        const grid = document.getElementById('modListGrid');
        grid.innerHTML = '<div class="loading-spinner">🔄 Moderatör verileri yükleniyor...</div>';
        try {
          const res = await fetch('/api/tumodlar/data');
          const data = await res.json();
          if (data.success) {
            allModerators = data.moderators || [];
            updateStats(data.counts || {});
            filterMods();
          } else {
            grid.innerHTML = '<div class="loading-spinner">❌ Hata: ' + (data.error || 'Veri yüklenemedi') + '</div>';
          }
        } catch (err) {
          grid.innerHTML = '<div class="loading-spinner">❌ Bağlantı hatası oluştu.</div>';
        }
      }

      function updateStats(counts) {
        document.getElementById('stat-total').innerText = counts.total || 0;
        document.getElementById('stat-school').innerText = counts.inSchool || 0;
        document.getElementById('stat-disabled-dm').innerText = counts.verificationDmDisabled || 0;
        document.getElementById('stat-briefing').innerText = counts.briefingEnabled || 0;
      }

      function setTab(tab) {
        currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });
        filterMods();
      }

      function filterMods() {
        const query = (document.getElementById('modSearchInput').value || '').toLowerCase().trim();
        let filtered = allModerators;

        if (currentTab === 'school') {
          filtered = filtered.filter(m => m.inSchool);
        } else if (currentTab === 'dm-disabled') {
          filtered = filtered.filter(m => m.settings.skipIncompleteVerificationDM);
        } else if (currentTab === 'briefing') {
          filtered = filtered.filter(m => m.settings.dailyBriefingEnabled);
        }

        if (query) {
          filtered = filtered.filter(m => 
            String(m.userId).includes(query) ||
            (m.discordUsername || '').toLowerCase().includes(query) ||
            (m.robloxUsername || '').toLowerCase().includes(query)
          );
        }

        renderGrid(filtered);
      }

      function renderGrid(mods) {
        const grid = document.getElementById('modListGrid');
        if (mods.length === 0) {
          grid.innerHTML = '<div class="loading-spinner">🔍 Aradığınız kriterlere uygun moderatör bulunamadı.</div>';
          return;
        }

        grid.innerHTML = mods.map(m => {
          const isDmDisabled = m.settings.skipIncompleteVerificationDM;
          const isDismissed = m.status === 'dismissed';
          const badgeClass = m.inSchool ? 'badge-school' : (m.level === 4 ? 'badge-sekreter' : (m.level === 2 ? 'badge-personel' : 'badge-stajyer'));

          return \`
            <div class="mod-card \${isDmDisabled ? 'dm-disabled-card' : ''} \${isDismissed ? 'dismissed-card' : ''}">
              <div class="mod-header">
                <div class="mod-avatar">\${m.discordUsername.charAt(0).toUpperCase()}</div>
                <div class="mod-name-info">
                  <div class="mod-name">\${escHtml(m.discordUsername)}</div>
                  <div class="mod-id">ID: \${m.userId}</div>
                  <span class="mod-badge \${badgeClass}">\${escHtml(m.levelName)}</span>
                </div>
              </div>

              <div class="mod-details">
                <div class="detail-row">
                  <span>Roblox Hesabı:</span>
                  <span class="detail-val">\${escHtml(m.robloxUsername)}</span>
                </div>
                <div class="detail-row">
                  <span>Mod Okulu Durumu:</span>
                  <span class="detail-val">\${escHtml(m.schoolStatusText)}</span>
                </div>
              </div>

              <div class="switches-group">
                <div class="switch-item">
                  <div>
                    <div class="switch-label">🚨 "Eksik Doğrulama" DM'ini Kapat</div>
                    <div class="switch-desc">Açık ise "🚨 DİKKAT: Eksik Doğrulama" uyarısı DM gitmez.</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" \${isDmDisabled ? 'checked' : ''} onchange="toggleUserSetting('\${m.userId}', 'skipIncompleteVerificationDM', this.checked)">
                    <span class="slider alert-slider"></span>
                  </label>
                </div>

                <div class="switch-item">
                  <div>
                    <div class="switch-label">☀️ Günlük Briefing DM'i</div>
                    <div class="switch-desc">Sabah günaydın ve görev bilgilendirme DM'i</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" \${m.settings.dailyBriefingEnabled ? 'checked' : ''} onchange="toggleUserSetting('\${m.userId}', 'dailyBriefingEnabled', this.checked)">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <!-- ADMIN ACTIONS: KOV & HESAP DEĞİŞTİR -->
              <div class="card-admin-actions">
                <button class="btn btn-primary" onclick="openAccountModal('\${m.userId}', '\${escHtml(m.robloxUsername)}')">
                  🔄 Hesap Değiştir
                </button>
                <button class="btn btn-danger" onclick="dismissMod('\${m.userId}', '\${escHtml(m.discordUsername)}')">
                  🚨 Kov / İşten Çıkar
                </button>
              </div>
            </div>
          \`;
        }).join('');
      }

      async function toggleUserSetting(userId, settingName, value) {
        try {
          const body = { targetUserId: userId };
          body[settingName] = value;

          const res = await fetch('/api/tumodlar/update-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await res.json();
          if (data.success) {
            showToast('✅ Ayar güncellendi!', 'success');
            const mod = allModerators.find(m => String(m.userId) === String(userId));
            if (mod) mod.settings[settingName] = value;
          } else {
            showToast('❌ ' + (data.error || 'Ayar güncellenemedi'), 'error');
            loadModData();
          }
        } catch (err) {
          showToast('❌ Bağlantı hatası', 'error');
          loadModData();
        }
      }

      async function dismissMod(userId, username) {
        const reason = prompt(\`🚨 "\${username}" (\${userId}) isimli moderatörü kovmak / işten çıkarmak istediğinize emin misiniz?\\n\\nİşten çıkarma nedenini girin:\`, "Admin paneli üzerinden kovuldu");
        if (reason === null) return; // Canceled

        try {
          const res = await fetch('/api/tumodlar/dismiss', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: userId, reason })
          });
          const data = await res.json();
          if (data.success) {
            showToast('🚨 Moderatör başarıyla kovuldu / işten çıkarıldı.', 'success');
            loadModData();
          } else {
            showToast('❌ ' + (data.error || 'İşten çıkarma başarısız oldu'), 'error');
          }
        } catch (err) {
          showToast('❌ Bağlantı hatası', 'error');
        }
      }

      function openAccountModal(userId, currentRoblox) {
        document.getElementById('modalTargetUserId').value = userId;
        document.getElementById('modalCurrentId').value = userId;
        document.getElementById('modalNewDiscordId').value = '';
        document.getElementById('modalNewDiscordUsername').value = '';
        document.getElementById('modalNewRobloxUsername').value = currentRoblox || '';
        document.getElementById('accountModal').style.display = 'flex';
      }

      function closeAccountModal() {
        document.getElementById('accountModal').style.display = 'none';
      }

      async function submitAccountChange() {
        const targetUserId = document.getElementById('modalTargetUserId').value;
        const newDiscordId = document.getElementById('modalNewDiscordId').value;
        const newDiscordUsername = document.getElementById('modalNewDiscordUsername').value;
        const newRobloxUsername = document.getElementById('modalNewRobloxUsername').value;

        try {
          const res = await fetch('/api/tumodlar/change-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUserId,
              newDiscordId,
              newDiscordUsername,
              newRobloxUsername
            })
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message, 'success');
            closeAccountModal();
            loadModData();
          } else {
            showToast('❌ ' + (data.error || 'Hesap değiştirme başarısız oldu'), 'error');
          }
        } catch (err) {
          showToast('❌ Bağlantı hatası', 'error');
        }
      }

      async function toggleGlobalVerificationDM(disable) {
        if (!confirm(disable 
          ? "🚨 TÜM moderatörler için 'Eksik Doğrulama' DM uyarısını KAPATMAK istediğinize emin misiniz?" 
          : "📩 TÜM moderatörler için 'Eksik Doğrulama' DM uyarısını AÇMAK istediğinize emin misiniz?")) return;

        try {
          const res = await fetch('/api/tumodlar/global-toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_verification_dm', skipIncompleteVerificationDM: disable })
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message, 'success');
            loadModData();
          } else {
            showToast('❌ ' + (data.error || 'Toplu işlem yapılamadı'), 'error');
          }
        } catch (err) {
          showToast('❌ Bağlantı hatası', 'error');
        }
      }

      function escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      document.addEventListener('DOMContentLoaded', loadModData);
    </script>
  `;

  const { _layout } = require("../views");
  return _layout("Tüm Modlar & Mod Okulu Yönetimi", user, content, "", "/tumodlar");
}

module.exports = {
  renderTumModlarPage
};
