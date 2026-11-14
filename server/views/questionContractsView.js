'use strict';

const DEFAULT_CAMP_QUESTIONS = [
  'Kampınızın kurucusunun Roblox kullanıcı adı nedir?',
  'Kampınızın kurucusunun Discord kullanıcı adı nedir?',
  'Kampınıza ait bir Discord sunucusu var mı? Varsa davet bağlantısını paylaşır mısınız?',
  'Kampınıza ait bir Roblox grubu var mı? Varsa grup bağlantısını paylaşır mısınız?',
  'Kampınız yaklaşık ne zaman kuruldu?',
  'Kampınızın şu anda toplam kaç üyesi bulunmaktadır?',
  'Kampınızın temel amacı ve faaliyet alanı nedir?',
  'Kampınız açık mı?',
  'Kampınızın mevcut yönetim kadrosunda kimler bulunmaktadır?',
  'Kampınızda kullanılan rütbe sistemi hakkında kısaca bilgi verebilir misiniz?',
  'Kampınızın mapı hazır mıdır? / sonradan yenilenecek mi?',
  'Kampınızın Discord sunucusunda ortalama aktif üye sayısı nedir?',
  'Kampınızın daha önce gerçekleştirdiği önemli etkinlik, iş birliği veya projeler var mı? Varsa kısaca açıklayınız.',
  'Kampınızı diğer kamplardan ayıran en önemli özellik nedir ve neden kampınızın tanıtılmasını istiyorsunuz?',
];

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAdminQuestionContractsWorkspace() {
  const defaultListText = DEFAULT_CAMP_QUESTIONS.map(q => `- ${q}`).join('\n');

  return `<section id="adm-question-contracts" class="acc-workspace-panel" data-admin-workspace="question-contracts" hidden>
  <header class="acc-page-head" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;">
    <div>
      <span class="acc-eyebrow">SORU SÖZLEŞMESİ &amp; SORU KAHOOT MODU</span>
      <h1>🎮 SORU SÖZLEŞMESİ &amp; KAHOOT MODU</h1>
      <p><strong>- soru</strong> şeklinde sınırsız soru listesi atayın. Sayı/numara gösterilmeden sorular karşı tarafa <strong>teker teker</strong> sorulur; <strong>Soru Kahoot Modu</strong> ile her cevaptan sonra sonraki soruya geçişi canlı yönetebilirsiniz.</p>
    </div>
    <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
      <button type="button" onclick="if(window.admTab){window.admTab('contracts');}else{const nb=document.querySelector('[data-admin-nav=contracts]');if(nb){nb.click();}else{location.hash='#adm-contracts';}}" class="acc-btn" style="cursor:pointer;">📜 Normal Sözleşmelere Dön</button>
      <a href="/soru-sozlesmesi" target="_blank" class="acc-btn" style="background:rgba(16,185,129,0.16);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;text-decoration:none;font-weight:800;">↗ Hazır Kamp Linkini Aç</a>
      <button type="button" class="acc-btn" onclick="window.loadAdminQuestionContracts && window.loadAdminQuestionContracts()">🔄 Yenile</button>
    </div>
  </header>

  <!-- Hazır Genel Kamp Soru Sözleşmesi Linki Bandı -->
  <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(16,185,129,0.12));border:1px solid rgba(99,102,241,0.38);border-radius:16px;padding:1.1rem 1.35rem;margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
    <div>
      <div style="font-weight:800;font-size:1rem;color:#fff;display:flex;align-items:center;gap:0.5rem;">
        <span>🏕️</span> <span>Hazır Kamp Soru Sözleşmesi Linki (Her Zaman Aktif)</span>
      </div>
      <div style="font-size:0.82rem;color:#cbd5e1;margin-top:0.2rem;">
        Bu genel linki paylaşabilirsiniz veya aşağıdan <strong>Soru Kahoot Modu</strong> ile kendi <code>- soru</code> listenizi oluşturabilirsiniz.
      </div>
    </div>
    <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
      <input type="text" id="qcontract-general-url" readonly value="/soru-sozlesmesi" style="min-width:250px;padding:0.55rem 0.8rem;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.18);border-radius:10px;color:#34d399;font-family:monospace;font-size:0.85rem;font-weight:700;" />
      <button type="button" onclick="window.copyGeneralQContractLink()" style="background:#10b981;border:none;color:#052e16;font-weight:800;padding:0.6rem 1rem;border-radius:10px;cursor:pointer;font-size:0.82rem;">📋 Linki Kopyala</button>
      <a href="/soru-sozlesmesi" target="_blank" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;text-decoration:none;font-weight:700;padding:0.6rem 0.95rem;border-radius:10px;font-size:0.82rem;">↗ Aç</a>
    </div>
  </div>

  <!-- Soru Kahoot & Soru Listesi Oluşturucu -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:1.5rem;margin-bottom:2rem;align-items:start;">
    <!-- Sol: - soru Formatında Sınırsız Liste Girişi -->
    <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.09);border-radius:18px;padding:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.6rem;flex-wrap:wrap;margin-bottom:1rem;">
        <h2 style="font-size:1.18rem;font-weight:800;margin:0;color:#fff;">🎯 Soru Listesi Oluştur (- soru)</h2>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button type="button" onclick="window.loadCampPresetText()" style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.38);color:#6ee7b7;padding:0.38rem 0.75rem;border-radius:8px;font-size:0.76rem;font-weight:700;cursor:pointer;">
            🏕️ Kamp Sorularını Yükle
          </button>
          <button type="button" onclick="window.clearQTextArea()" style="background:rgba(244,63,94,0.14);border:1px solid rgba(244,63,94,0.35);color:#fda4af;padding:0.38rem 0.75rem;border-radius:8px;font-size:0.76rem;font-weight:700;cursor:pointer;">
            🧹 Temizle
          </button>
        </div>
      </div>

      <div style="display:grid;gap:0.85rem;">
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.3rem;color:#e2e8f0;">Oturum / Sözleşme Başlığı *</label>
          <input type="text" id="qcontract-title" value="SORU KAHOOT & KAMP SÖZLEŞMESİ" oninput="window.renderQPreviewFromText()" style="width:100%;padding:0.7rem 0.85rem;background:rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:0.95rem;font-weight:700;" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div>
            <label style="display:block;font-size:0.78rem;font-weight:700;margin-bottom:0.3rem;color:#cbd5e1;">Kime Gönderilecek? (İsteğe Bağlı)</label>
            <input type="text" id="qcontract-party-two" placeholder="Örn: X Kampı Kurucusu" style="width:100%;padding:0.6rem 0.75rem;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:0.85rem;" />
          </div>
          <div>
            <label style="display:block;font-size:0.78rem;font-weight:700;margin-bottom:0.3rem;color:#cbd5e1;">Mod Seçimi</label>
            <select id="qcontract-mode" style="width:100%;padding:0.6rem 0.75rem;background:rgba(0,0,0,0.45);border:1px solid rgba(139,92,246,0.45);border-radius:10px;color:#e9d5ff;font-size:0.84rem;font-weight:700;">
              <option value="kahoot" selected>🎮 SORU KAHOOT MODU (Canlı İstek + Yönetici Onaylı Geçiş)</option>
              <option value="normal">⚡ Normal Tek Tek Mod (Kullanıcı Kendi İlerler)</option>
            </select>
          </div>
        </div>

        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.3rem;color:#e2e8f0;">Soru Listesi (Her satıra <code style="color:#34d399;">- soru</code> şeklinde sınırsız yazabilirsiniz) *</label>
          <textarea id="qcontract-raw-list" rows="13" oninput="window.renderQPreviewFromText()" placeholder="- Sorunuz 1&#10;- Sorunuz 2&#10;- Sorunuz 3" style="width:100%;padding:0.85rem;background:rgba(0,0,0,0.34);border:1px solid rgba(255,255,255,0.14);border-radius:12px;color:#f8fafc;font-size:0.88rem;line-height:1.65;resize:vertical;">${esc(defaultListText)}</textarea>
          <div style="font-size:0.75rem;color:var(--muted);margin-top:0.3rem;">
            Sayı veya numara gösterilmez. Her <code>- soru</code> satırı karşı tarafa sırayla teker teker sorulur.
          </div>
        </div>

        <button type="button" id="btn-create-qcontract" onclick="window.submitCreateQuestionContract()" style="width:100%;padding:0.95rem 1.2rem;background:linear-gradient(135deg,#7c3aed,#10b981);border:none;border-radius:12px;color:#fff;font-weight:800;font-size:0.98rem;cursor:pointer;box-shadow:0 8px 24px rgba(124,58,237,0.3);">
          🎮 SORU LİSTESİNİ OLUŞTUR VE LİNK ÜRET
        </button>

        <div id="qcontract-share-banner" style="display:none;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.4);border-radius:14px;padding:1rem;">
          <div style="font-weight:800;color:#34d399;font-size:0.9rem;margin-bottom:0.4rem;">✅ Link Hazır! Karşı Tarafa Gönderin:</div>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
            <input type="text" id="qcontract-created-url" readonly style="flex:1;min-width:200px;padding:0.55rem 0.75rem;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-family:monospace;font-size:0.82rem;" />
            <button type="button" onclick="window.copyCreatedQContractLink()" style="background:#10b981;border:none;color:#052e16;font-weight:800;padding:0.55rem 0.9rem;border-radius:8px;cursor:pointer;font-size:0.8rem;">🔗 Linki Kopyala</button>
            <a id="qcontract-created-open" href="#" target="_blank" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;text-decoration:none;font-weight:700;padding:0.55rem 0.9rem;border-radius:8px;font-size:0.8rem;">↗ Linki Aç</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Sağ: Numarasız / Sayısız Önizleme -->
    <div style="background:rgba(15,23,42,0.88);border:1px solid rgba(129,140,248,0.25);border-radius:18px;padding:1.5rem;box-shadow:0 20px 50px rgba(0,0,0,0.35);">
      <div style="margin-bottom:0.85rem;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:0.75rem;">
        <span style="font-size:0.72rem;color:#818cf8;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">SORU AKIŞ ÖNİZLEMESİ (SAYISIZ)</span>
        <h3 id="qpreview-title" style="font-size:1.1rem;font-weight:800;margin:0.2rem 0 0;color:#fff;">SORU KAHOOT &amp; KAMP SÖZLEŞMESİ</h3>
      </div>
      <div id="qpreview-list" style="display:grid;gap:0.5rem;max-height:480px;overflow-y:auto;padding-right:4px;"></div>
    </div>
  </div>

  <!-- 🎮 Canlı Kahoot Kontrol & Cevap İnceleme Paneli -->
  <div id="adm-qcontract-answers-modal" style="display:none;background:rgba(15,23,42,0.97);border:2px solid rgba(139,92,246,0.55);border-radius:18px;padding:1.5rem;margin-bottom:1.75rem;box-shadow:0 24px 60px rgba(0,0,0,0.65);">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:0.9rem;margin-bottom:1.1rem;">
      <div>
        <span style="font-size:0.74rem;color:#a78bfa;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">🎮 CANLI SORU KAHOOT KONTROLÜ &amp; GELEN CEVAPLAR</span>
        <h3 id="qmodal-answer-title" style="margin:0.25rem 0 0;font-size:1.25rem;color:#fff;font-weight:800;">Oturum Detayı</h3>
        <div id="qmodal-answer-meta" style="font-size:0.82rem;color:#94a3b8;margin-top:0.2rem;"></div>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <button type="button" onclick="window.copyQModalAnswersText()" style="background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.45);color:#a5b4fc;padding:0.5rem 0.9rem;border-radius:10px;font-weight:700;font-size:0.8rem;cursor:pointer;">📋 Cevapları Kopyala</button>
        <button type="button" onclick="document.getElementById('adm-qcontract-answers-modal').style.display='none'" style="background:rgba(244,63,94,0.16);border:1px solid rgba(244,63,94,0.35);color:#fda4af;padding:0.5rem 0.9rem;border-radius:10px;font-weight:700;font-size:0.8rem;cursor:pointer;">✕ Kapat</button>
      </div>
    </div>

    <!-- Kahoot Canlı Geçiş Kontrolleri -->
    <div id="qmodal-kahoot-controls" style="display:none;background:linear-gradient(135deg,rgba(124,58,237,0.16),rgba(16,185,129,0.12));border:1px solid rgba(167,139,250,0.4);border-radius:14px;padding:1.1rem;margin-bottom:1.25rem;">
      <div id="qmodal-kahoot-status-bar" style="font-weight:800;font-size:0.95rem;color:#fff;margin-bottom:0.8rem;"></div>
      <div id="kahoot-admin-loader" style="display:none;align-items:center;gap:0.75rem;background:rgba(15,23,42,0.85);border:1px solid rgba(52,211,153,0.45);border-radius:12px;padding:0.75rem 1rem;margin-bottom:0.85rem;">
        <span style="display:inline-block;width:20px;height:20px;border:3px solid rgba(52,211,153,0.25);border-top-color:#34d399;border-radius:50%;animation:kahootSpin 0.65s linear infinite;"></span>
        <div>
          <div id="kahoot-admin-meme-text" style="font-weight:800;color:#6ee7b7;font-size:0.88rem;">🚀 Sonraki soruya ışınlanılıyor...</div>
          <div style="font-size:0.74rem;color:#94a3b8;">Katılımcı ekranı da aynı anda güncelleniyor</div>
        </div>
      </div>
      <style>@keyframes kahootSpin{to{transform:rotate(360deg);}}</style>
      <div style="display:flex;gap:0.65rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem;">
        <button type="button" id="btn-kahoot-next" onclick="window.triggerKahootNext(false)" style="background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;padding:0.72rem 1.25rem;border-radius:10px;font-weight:800;font-size:0.88rem;cursor:pointer;">
          ⏭️ Sonraki Soruya Geçir
        </button>
        <button type="button" id="btn-kahoot-finish" onclick="window.triggerKahootNext(true)" style="background:rgba(244,63,94,0.2);border:1px solid rgba(244,63,94,0.45);color:#fda4af;padding:0.72rem 1.1rem;border-radius:10px;font-weight:800;font-size:0.85rem;cursor:pointer;">
          🏁 Oturumu Bitir
        </button>
      </div>
      <!-- Canlı Ek Soru Ekleme -->
      <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:0.85rem;">
        <label style="display:block;font-size:0.78rem;font-weight:800;color:#c4b5fd;margin-bottom:0.4rem;">➕ Canlı Oturuma Sınırsız Yeni Soru Ekle (- soru şeklinde)</label>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:flex-start;">
          <textarea id="kahoot-append-textarea" rows="2" placeholder="- Yeni sorunuzu buraya yazın&#10;- İsterseniz birden fazla satır ekleyin" style="flex:1;min-width:240px;padding:0.6rem 0.8rem;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.18);border-radius:10px;color:#fff;font-size:0.85rem;resize:vertical;"></textarea>
          <button type="button" onclick="window.appendKahootQuestions()" style="background:#6366f1;border:none;color:#fff;padding:0.68rem 1rem;border-radius:10px;font-weight:800;font-size:0.84rem;cursor:pointer;">+ Soruları Ekle</button>
        </div>
      </div>
    </div>

    <div id="qmodal-answer-body" style="display:grid;gap:0.75rem;"></div>
  </div>

  <!-- Yönetim Paneline Gelen Cevaplar ve Aktif Kahoot Oturumları -->
  <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:1.5rem;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.75rem;">
      <h2 style="font-size:1.15rem;font-weight:800;margin:0;color:#fff;">📥 Gelen Cevaplar &amp; Aktif Kahoot Oturumları</h2>
      <span style="font-size:0.8rem;color:var(--muted);">Liste her 5 saniyede bir otomatik güncellenir.</span>
    </div>
    <div id="adm-qcontracts-list" style="overflow-x:auto;">
      <div style="color:var(--muted);text-align:center;padding:2rem;">Kayıtlar yükleniyor...</div>
    </div>
  </div>

  <script>
    (function() {
      const DEFAULT_CAMP_Q = ${JSON.stringify(DEFAULT_CAMP_QUESTIONS).replace(/</g, '\\u003c')};
      let loadedQContractsCache = [];
      let currentQModalId = null;

      function escapeHtml(val) {
        return String(val ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      async function safeReadJson(res) {
        const ct = (res.headers && res.headers.get('content-type')) || '';
        if (!ct.includes('application/json')) {
          const text = await res.text().catch(() => '');
          return { success: false, error: res.status === 429 ? 'Çok fazla istek gönderildi, birkaç saniye bekleyin.' : ('Sunucu yanıtı geçersiz (' + res.status + ')'), _raw: text };
        }
        return await res.json();
      }

      function parseListText(raw) {
        return String(raw || '')
          .split(/\\r?\\n/)
          .map(s => s.replace(/^\\s*[-•*]\\s*/, '').trim())
          .filter(Boolean);
      }

      function initGeneralQUrl() {
        const inp = document.getElementById('qcontract-general-url');
        if (inp && window.location && window.location.origin) {
          inp.value = window.location.origin + '/soru-sozlesmesi';
        }
      }

      window.copyGeneralQContractLink = function() {
        const fullUrl = window.location.origin + '/soru-sozlesmesi';
        navigator.clipboard.writeText(fullUrl).then(() => {
          alert('🔗 Link panoya kopyalandı:\\n' + fullUrl);
        }).catch(() => prompt('Linki kopyalayın:', fullUrl));
      };

      window.loadCampPresetText = function() {
        const ta = document.getElementById('qcontract-raw-list');
        if (ta) ta.value = DEFAULT_CAMP_Q.map(q => '- ' + q).join('\\n');
        window.renderQPreviewFromText();
      };

      window.clearQTextArea = function() {
        const ta = document.getElementById('qcontract-raw-list');
        if (ta) {
          ta.value = '- ';
          ta.focus();
        }
        window.renderQPreviewFromText();
      };

      window.renderQPreviewFromText = function() {
        const ta = document.getElementById('qcontract-raw-list');
        const pTitle = document.getElementById('qpreview-title');
        const pList = document.getElementById('qpreview-list');
        const title = document.getElementById('qcontract-title')?.value || 'SORU SÖZLEŞMESİ';
        if (pTitle) pTitle.textContent = title;
        if (!pList || !ta) return;

        const items = parseListText(ta.value);
        pList.innerHTML = '';
        if (items.length === 0) {
          pList.innerHTML = '<div style="color:var(--muted);padding:1rem;">Henüz soru yazılmadı. Sol taraftan <code>- soru</code> şeklinde ekleyin.</div>';
          return;
        }
        items.forEach(q => {
          const card = document.createElement('div');
          card.style.cssText = 'background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:0.75rem 0.95rem;display:flex;gap:0.6rem;align-items:flex-start;';
          const dot = document.createElement('span');
          dot.style.cssText = 'color:#34d399;font-weight:900;font-size:1rem;line-height:1.3;';
          dot.textContent = '•';
          const txt = document.createElement('div');
          txt.style.cssText = 'color:#f1f5f9;font-size:0.88rem;line-height:1.45;font-weight:600;';
          txt.textContent = q;
          card.appendChild(dot);
          card.appendChild(txt);
          pList.appendChild(card);
        });
      };

      window.submitCreateQuestionContract = async function() {
        const title = document.getElementById('qcontract-title')?.value.trim() || 'SORU SÖZLEŞMESİ';
        const partyTwoName = document.getElementById('qcontract-party-two')?.value.trim() || '';
        const modeVal = document.getElementById('qcontract-mode')?.value || 'kahoot';
        const rawText = document.getElementById('qcontract-raw-list')?.value || '';
        const questions = parseListText(rawText);
        const btn = document.getElementById('btn-create-qcontract');

        if (questions.length === 0) {
          alert('Lütfen en az 1 soru yazınız.');
          return;
        }

        btn.disabled = true;
        btn.textContent = '⏳ Link Üretiliyor...';

        try {
          const res = await fetch('/api/admin/contracts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'QUESTIONNAIRE',
              kahootMode: modeVal === 'kahoot',
              title,
              partyTwoName,
              questions
            })
          });
          const data = await res.json();
          if (res.ok && data.success && data.contract) {
            const fullUrl = window.location.origin + '/soru-sozlesmesi/' + data.contract._id;
            const banner = document.getElementById('qcontract-share-banner');
            const urlInput = document.getElementById('qcontract-created-url');
            const openLink = document.getElementById('qcontract-created-open');
            if (banner) banner.style.display = 'block';
            if (urlInput) urlInput.value = fullUrl;
            if (openLink) openLink.href = fullUrl;
            navigator.clipboard.writeText(fullUrl).catch(() => {});
            await window.loadAdminQuestionContracts();
            if (modeVal === 'kahoot') {
              window.viewQContractAnswers(data.contract._id);
            }
          } else {
            alert(data.error || 'Oluşturulamadı.');
          }
        } catch (err) {
          alert('Bağlantı hatası: ' + err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = '🎮 SORU LİSTESİNİ OLUŞTUR VE LİNK ÜRET';
        }
      };

      window.copyCreatedQContractLink = function() {
        const urlInput = document.getElementById('qcontract-created-url');
        if (!urlInput || !urlInput.value) return;
        navigator.clipboard.writeText(urlInput.value).then(() => {
          alert('🔗 Link panoya kopyalandı:\\n' + urlInput.value);
        }).catch(() => {
          urlInput.select();
          document.execCommand('copy');
        });
      };

      window.viewQContractAnswers = function(id) {
        currentQModalId = id;
        const item = loadedQContractsCache.find(c => String(c._id) === String(id));
        if (!item) return;

        const modal = document.getElementById('adm-qcontract-answers-modal');
        const titleEl = document.getElementById('qmodal-answer-title');
        const metaEl = document.getElementById('qmodal-answer-meta');
        const bodyEl = document.getElementById('qmodal-answer-body');
        const kahootBox = document.getElementById('qmodal-kahoot-controls');
        const statusBar = document.getElementById('qmodal-kahoot-status-bar');
        if (!modal || !bodyEl) return;

        titleEl.textContent = (item.signerName || item.partyTwoName || item.title || 'Soru Oturumu');
        metaEl.textContent = 'Kayıt: ' + (item.documentNo || item._id) + ' • Durum: ' + (item.status === 'SIGNED' ? 'Tamamlandı' : 'Aktif');

        if (item.kahootMode) {
          kahootBox.style.display = 'block';
          const questions = Array.isArray(item.questions) ? item.questions : [];
          const step = Number(item.currentStep || 0);
          const currentQ = questions[step] || 'Tüm mevcut sorular soruldu.';
          if (item.status === 'SIGNED') {
            statusBar.innerHTML = '🏁 <span style="color:#34d399;">Oturum tamamlandı.</span> Aşağıdan yeni soru ekleyerek devam ettirebilirsiniz.';
          } else if (item.waitingForAdmin) {
            statusBar.innerHTML = '🔔 <span style="color:#fbbf24;">KATILIMCI CEVABINI GÖNDERDİ VE SONRAKİ SORU İSTEĞİ YOLLADI!</span><br><span style="font-size:0.82rem;color:#cbd5e1;font-weight:600;">Son sorulan: ' + escapeHtml(currentQ) + '</span>';
          } else {
            statusBar.innerHTML = '⏳ <span style="color:#a5b4fc;">Katılımcı şu soruyu yanıtlıyor:</span> ' + escapeHtml(currentQ);
          }
        } else {
          kahootBox.style.display = 'none';
        }

        bodyEl.innerHTML = '';
        const answers = Array.isArray(item.answers) ? item.answers : [];
        if (answers.length > 0) {
          answers.forEach(ans => {
            const card = document.createElement('div');
            card.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:0.9rem 1.1rem;';
            const qDiv = document.createElement('div');
            qDiv.style.cssText = 'font-size:0.82rem;font-weight:800;color:#a5b4fc;margin-bottom:0.35rem;';
            qDiv.textContent = '❓ ' + (ans.question || '');
            const aDiv = document.createElement('div');
            aDiv.style.cssText = 'font-size:0.98rem;color:#fff;font-weight:600;white-space:pre-wrap;line-height:1.5;';
            aDiv.textContent = '💬 ' + (ans.answer || '—');
            card.appendChild(qDiv);
            card.appendChild(aDiv);
            bodyEl.appendChild(card);
          });
        } else {
          bodyEl.innerHTML = '<div style="color:var(--muted);padding:0.5rem;">Henüz cevap gelmedi.</div>';
        }

        modal.style.display = 'block';
      };

      const ADMIN_MEMES = [
        '🚀🐸 Sonraki soruya ışık hızında ışınlanıyoruz!',
        '🧠💨 Beyinler 3000 RPM çalışıyor, yeni soru yolda!',
        '😎⚡ "Sıradaki!" butonuna basıldı, katılımcı hazırlanıyor...',
        '🎮🔥 Kahoot turbo motoru ateşlendi!',
        '🐱💻 Kedi klavyeye bastı, sonraki soru yükleniyor!'
      ];

      window.triggerKahootNext = async function(finish) {
        if (!currentQModalId) return;
        const btnNext = document.getElementById('btn-kahoot-next');
        const btnFin = document.getElementById('btn-kahoot-finish');
        const loader = document.getElementById('kahoot-admin-loader');
        const memeEl = document.getElementById('kahoot-admin-meme-text');
        if (btnNext) btnNext.disabled = true;
        if (btnFin) btnFin.disabled = true;
        if (memeEl) {
          memeEl.textContent = finish
            ? '🏁 Oturum tamamlanıyor, cevaplar mühürleniyor...'
            : ADMIN_MEMES[Math.floor(Math.random() * ADMIN_MEMES.length)];
        }
        if (loader) loader.style.display = 'flex';
        try {
          const res = await fetch('/api/admin/contracts/' + encodeURIComponent(currentQModalId) + '/kahoot-next', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ finish: !!finish })
          });
          const data = await safeReadJson(res);
          if (res.ok && data.success) {
            await window.loadAdminQuestionContracts();
            window.viewQContractAnswers(currentQModalId);
          } else {
            alert(data.error || 'İşlem başarısız.');
          }
        } catch (err) {
          alert('Hata: ' + err.message);
        } finally {
          if (loader) loader.style.display = 'none';
          if (btnNext) btnNext.disabled = false;
          if (btnFin) btnFin.disabled = false;
        }
      };

      window.appendKahootQuestions = async function() {
        if (!currentQModalId) return;
        const ta = document.getElementById('kahoot-append-textarea');
        const questions = parseListText(ta?.value || '');
        if (questions.length === 0) {
          alert('Lütfen eklenecek soruları yazın.');
          return;
        }
        try {
          const res = await fetch('/api/admin/contracts/' + encodeURIComponent(currentQModalId) + '/kahoot-append', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions })
          });
          const data = await safeReadJson(res);
          if (res.ok && data.success) {
            if (ta) ta.value = '';
            await window.loadAdminQuestionContracts();
            window.viewQContractAnswers(currentQModalId);
          } else {
            alert(data.error || 'Sorular eklenemedi.');
          }
        } catch (err) {
          alert('Hata: ' + err.message);
        }
      };

      window.copyQModalAnswersText = function() {
        const item = loadedQContractsCache.find(c => String(c._id) === String(currentQModalId));
        if (!item) return;
        const answers = Array.isArray(item.answers) ? item.answers : [];
        const text = answers.length > 0
          ? answers.map(a => '- ' + a.question + '\\nCevap: ' + a.answer).join('\\n\\n')
          : (item.content || '');
        navigator.clipboard.writeText(text).then(() => alert('📋 Cevaplar panoya kopyalandı!'));
      };

      window.deleteAdminQContract = async function(id) {
        if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
        try {
          const res = await fetch('/api/admin/contracts/' + encodeURIComponent(id), { method: 'DELETE' });
          const data = await res.json();
          if (res.ok && data.success) {
            if (String(currentQModalId) === String(id)) {
              currentQModalId = null;
              const m = document.getElementById('adm-qcontract-answers-modal');
              if (m) m.style.display = 'none';
            }
            window.loadAdminQuestionContracts();
          }
        } catch (_) {}
      };

      window.loadAdminQuestionContracts = async function() {
        const listEl = document.getElementById('adm-qcontracts-list');
        if (!listEl) return;
        try {
          const res = await fetch('/api/admin/contracts?type=QUESTIONNAIRE');
          const data = await res.json();
          if (!res.ok || !data.success) return;
          const items = data.contracts || [];
          loadedQContractsCache = items;

          if (currentQModalId && document.getElementById('adm-qcontract-answers-modal')?.style.display === 'block') {
            window.viewQContractAnswers(currentQModalId);
          }

          if (items.length === 0) {
            listEl.innerHTML = '<div style="color:var(--muted);text-align:center;padding:2rem;">Henüz soru sözleşmesi veya Kahoot oturumu oluşturulmamış.</div>';
            return;
          }

          let html = '<table style="width:100%;border-collapse:collapse;font-size:0.86rem;text-align:left;">' +
            '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);color:var(--muted);font-size:0.76rem;text-transform:uppercase;">' +
            '<th style="padding:0.75rem;">Başlık &amp; Mod</th>' +
            '<th style="padding:0.75rem;">Katılımcı</th>' +
            '<th style="padding:0.75rem;">Canlı Durum</th>' +
            '<th style="padding:0.75rem;">Son Cevap</th>' +
            '<th style="padding:0.75rem;text-align:right;">İşlemler</th>' +
            '</tr></thead><tbody>';

          items.forEach(c => {
            const url = '/soru-sozlesmesi/' + c._id;
            const isSigned = c.status === 'SIGNED';
            const answers = Array.isArray(c.answers) ? c.answers : [];
            const lastAns = answers.length > 0 ? answers[answers.length - 1] : null;
            const modeTag = c.kahootMode
              ? '<span style="background:rgba(124,58,237,0.22);color:#c4b5fd;padding:2px 8px;border-radius:999px;font-size:0.7rem;font-weight:800;">🎮 KAHOOT MODU</span>'
              : '<span style="background:rgba(99,102,241,0.18);color:#a5b4fc;padding:2px 8px;border-radius:999px;font-size:0.7rem;font-weight:800;">📋 NORMAL</span>';

            let statusHtml = '';
            if (isSigned) {
              statusHtml = '<span style="color:#34d399;font-weight:800;">✅ Tamamlandı</span>';
            } else if (c.kahootMode && c.waitingForAdmin) {
              statusHtml = '<span style="color:#fbbf24;font-weight:800;">🔔 Sonraki Soru İsteği Bekliyor!</span>';
            } else {
              statusHtml = '<span style="color:#94a3b8;font-weight:700;">⏳ Aktif / Yanıt Bekliyor</span>';
            }

            const safeTitle = String(c.title || '').replace(/'/g, "\\'");

            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">' +
              '<td style="padding:0.85rem 0.75rem;">' +
                '<div style="margin-bottom:4px;">' + modeTag + '</div>' +
                '<div style="font-weight:700;color:#fff;">' + escapeHtml(c.title || 'Soru Sözleşmesi') + '</div>' +
              '</td>' +
              '<td style="padding:0.85rem 0.75rem;color:#e2e8f0;">' + escapeHtml(c.signerName || c.partyTwoName || 'Bekleniyor') + '</td>' +
              '<td style="padding:0.85rem 0.75rem;">' + statusHtml + '</td>' +
              '<td style="padding:0.85rem 0.75rem;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#cbd5e1;">' + escapeHtml(lastAns ? lastAns.answer : '—') + '</td>' +
              '<td style="padding:0.85rem 0.75rem;text-align:right;white-space:nowrap;">' +
                '<button type="button" onclick="window.viewQContractAnswers(\\'' + escapeHtml(c._id) + '\\')" style="background:linear-gradient(135deg,#7c3aed,#10b981);border:none;color:#fff;padding:0.45rem 0.85rem;border-radius:8px;font-weight:800;font-size:0.78rem;cursor:pointer;margin-right:0.35rem;">' + (c.kahootMode ? '🎮 Canlı Kontrol / Cevaplar' : '📋 Cevapları Gör') + '</button>' +
                '<button type="button" onclick="window.shareContractUrl(\\'' + escapeHtml(url) + '\\', \\'' + escapeHtml(safeTitle) + '\\')" style="background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;padding:0.42rem 0.75rem;border-radius:8px;font-weight:700;font-size:0.76rem;cursor:pointer;margin-right:0.35rem;">🔗 Link</button>' +
                '<button type="button" onclick="window.deleteAdminQContract(\\'' + escapeHtml(c._id) + '\\')" style="background:rgba(244,63,94,0.15);border:1px solid rgba(244,63,94,0.35);color:#fda4af;padding:0.42rem 0.65rem;border-radius:8px;font-weight:700;font-size:0.76rem;cursor:pointer;">🗑️</button>' +
              '</td>' +
            '</tr>';
          });

          html += '</tbody></table>';
          listEl.innerHTML = html;
        } catch (_) {}
      };

      setTimeout(() => {
        initGeneralQUrl();
        window.renderQPreviewFromText();
        window.loadAdminQuestionContracts();
      }, 150);

      setInterval(() => {
        if (document.hidden) return;
        const panel = document.getElementById('adm-question-contracts');
        if (panel && !panel.hidden && panel.style.display !== 'none') {
          window.loadAdminQuestionContracts();
        }
      }, 2500);

      document.addEventListener('admin:workspace-activated', (e) => {
        if (e.detail && e.detail.workspace === 'question-contracts') {
          initGeneralQUrl();
          window.loadAdminQuestionContracts();
        }
      });
    })();
  </script>
</section>`;
}

function renderPublicQuestionContractPage(contract) {
  const questions = (Array.isArray(contract.questions) && contract.questions.length > 0)
    ? contract.questions
    : DEFAULT_CAMP_QUESTIONS;

  const contractId = String(contract._id || 'genel');
  const kahootMode = !!contract.kahootMode;
  const title = contract.title || 'SORU SÖZLEŞMESİ';
  const subtitle = contract.headerSubtitle || (kahootMode ? 'EKOYILDIZ & SENTARA • SORU KAHOOT MODU' : 'EKOYILDIZ & SENTARA • SORU SÖZLEŞMESİ');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background: #070913;
      background-image:
        radial-gradient(circle at 15% 15%, rgba(124, 58, 237, 0.2), transparent 45%),
        radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.14), transparent 45%);
      color: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      padding: 1rem 1.5rem;
      background: rgba(10, 14, 26, 0.85);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #fff;
    }
    .brand-badge {
      background: linear-gradient(135deg, #7c3aed, #10b981);
      color: #fff;
      font-weight: 900;
      padding: 0.4rem 0.75rem;
      border-radius: 10px;
      font-size: 0.85rem;
    }
    .wizard-shell {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.25rem;
    }
    .wizard-card {
      width: 100%;
      max-width: 700px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 24px;
      padding: 2.25rem;
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.55);
    }
    .eyebrow {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #a78bfa;
      margin-bottom: 0.35rem;
    }
    .wizard-title {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0 0 1.25rem 0;
      color: #fff;
    }
    .progress-track {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.07);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #7c3aed, #10b981);
      border-radius: 999px;
      width: 12%;
      transition: width 0.3s ease;
    }
    .question-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 18px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .q-badge {
      display: inline-block;
      background: rgba(124, 58, 237, 0.22);
      color: #c4b5fd;
      border: 1px solid rgba(124, 58, 237, 0.45);
      padding: 0.28rem 0.75rem;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 800;
      margin-bottom: 0.8rem;
    }
    .q-text {
      font-size: 1.22rem;
      font-weight: 800;
      line-height: 1.45;
      color: #ffffff;
      margin: 0 0 1.1rem 0;
    }
    .q-input {
      width: 100%;
      padding: 0.95rem 1.1rem;
      background: rgba(0, 0, 0, 0.45);
      border: 2px solid rgba(148, 163, 184, 0.25);
      border-radius: 14px;
      color: #fff;
      font-family: inherit;
      font-size: 1rem;
      line-height: 1.55;
      resize: vertical;
      min-height: 115px;
      outline: none;
    }
    .q-input:focus {
      border-color: #7c3aed;
      box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2);
    }
    .quick-choices {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    .quick-chip {
      background: rgba(99, 102, 241, 0.14);
      border: 1px solid rgba(99, 102, 241, 0.35);
      color: #c7d2fe;
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
    }
    .nav-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
    }
    .btn-prev {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 0.85rem 1.35rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.92rem;
      cursor: pointer;
    }
    .btn-prev:disabled { opacity: 0.35; cursor: not-allowed; }
    .btn-next {
      flex: 1;
      background: linear-gradient(135deg, #7c3aed, #10b981);
      border: none;
      color: #fff;
      padding: 0.95rem 1.5rem;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.98rem;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(124, 58, 237, 0.35);
    }
    .error-msg {
      display: none;
      margin-top: 0.75rem;
      padding: 0.65rem 0.9rem;
      border-radius: 10px;
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.35);
      color: #fda4af;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .waiting-box {
      display: none;
      text-align: center;
      padding: 1.5rem 0.5rem;
    }
    .success-screen {
      display: none;
      text-align: center;
      padding: 1rem 0;
    }
  </style>
</head>
<body>
  <header class="topbar">
    <a href="/" class="brand">
      <span class="brand-badge">${kahootMode ? '🎮 SORU KAHOOT' : '📋 SORU SÖZLEŞMESİ'}</span>
      <div>
        <strong style="font-size:0.95rem;display:block;">${esc(title)}</strong>
        <span style="font-size:0.75rem;color:#94a3b8;">${esc(subtitle)}</span>
      </div>
    </a>
  </header>

  <main class="wizard-shell">
    <div class="wizard-card">
      <div id="q-sync-banner" style="display:none;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.38);color:#fde68a;border-radius:12px;padding:0.65rem 0.9rem;font-size:0.82rem;font-weight:700;margin-bottom:1rem;"></div>
      <!-- Aktif Soru Ekranı (Sayısız / Numarasız) -->
      <div id="wizard-active-view">
        <div class="eyebrow">${esc(subtitle)}</div>
        <h1 class="wizard-title">${esc(title)}</h1>

        <div class="progress-track">
          <div class="progress-fill" id="progress-fill-bar"></div>
        </div>

        <div class="question-box">
          <span class="q-badge">${kahootMode ? '🎮 CANLI SORU' : '💬 SORU'}</span>
          <h2 class="q-text" id="q-title-text"></h2>
          <div class="quick-choices" id="q-quick-choices" style="display:none;"></div>
          <textarea id="q-answer-input" class="q-input" placeholder="Cevabınızı buraya yazınız..."></textarea>
          <div id="q-error-box" class="error-msg">Lütfen devam etmeden önce bu soruyu cevaplayınız.</div>
        </div>

        <div class="nav-row">
          <button type="button" class="btn-prev" id="btn-prev-q" onclick="prevQuestion()" style="${kahootMode ? 'display:none;' : ''}" disabled>← Önceki</button>
          <button type="button" class="btn-next" id="btn-next-q" onclick="nextQuestion()">
            ${kahootMode ? '📤 Cevabı Gönder & Sonraki Soru İsteği Yolla' : 'Sonraki Soru →'}
          </button>
        </div>
      </div>

      <!-- Kahoot Bekleme Ekranı (Yönetici Onayı Bekleniyor) -->
      <div id="wizard-waiting-view" class="waiting-box">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:54px;height:54px;border:4px solid rgba(251,191,36,0.22);border-top-color:#fbbf24;border-radius:50%;animation:kSpin 0.8s linear infinite;margin-bottom:0.85rem;"></div>
        <h2 style="font-size:1.4rem;font-weight:900;margin:0 0 0.45rem;color:#fbbf24;">Cevabınız İletildi!</h2>
        <div id="waiting-meme-box" style="display:inline-block;background:rgba(124,58,237,0.18);border:1px solid rgba(167,139,250,0.4);color:#e9d5ff;padding:0.5rem 1rem;border-radius:999px;font-size:0.86rem;font-weight:800;margin-bottom:0.9rem;">
          🧠💨 Beyinler ısınıyor, yönetici onayı bekleniyor...
        </div>
        <p style="color:#cbd5e1;font-size:0.95rem;max-width:480px;margin:0 auto 1.35rem;line-height:1.6;">
          Cevabınız yönetim paneline ulaştı. Yönetici <strong>"Sonraki Soruya Geçir"</strong> dediğinde yeni soru otomatik açılacak!
        </p>
        <button type="button" id="btn-request-next" onclick="sendNextRequest()" style="background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;color:#fff;padding:0.85rem 1.4rem;border-radius:12px;font-weight:800;font-size:0.92rem;cursor:pointer;">
          🔔 Sonraki Soruya Geçmek İçin İstek Yolla
        </button>
        <div id="request-feedback" style="font-size:0.82rem;color:#34d399;margin-top:0.75rem;font-weight:700;"></div>
      </div>

      <!-- Hızlı Meme'li Geçiş Ekranı -->
      <div id="wizard-transition-view" class="waiting-box">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:58px;height:58px;border:4px solid rgba(52,211,153,0.25);border-top-color:#34d399;border-radius:50%;animation:kSpin 0.55s linear infinite;margin-bottom:0.9rem;"></div>
        <h2 style="font-size:1.45rem;font-weight:900;margin:0 0 0.45rem;color:#34d399;">🚀 Sonraki Soru Geliyor!</h2>
        <div id="transition-meme-text" style="font-size:1rem;font-weight:800;color:#e2e8f0;">🐸⚡ Işık hızında yükleniyor...</div>
      </div>
      <style>@keyframes kSpin{to{transform:rotate(360deg);}}</style>

      <!-- Tamamlandı Ekranı -->
      <div id="wizard-success-view" class="success-screen">
        <div style="font-size:3.2rem;margin-bottom:0.5rem;">🎉</div>
        <h2 style="font-size:1.5rem;font-weight:900;margin:0 0 0.5rem;color:#34d399;">Tamamlandı!</h2>
        <p style="color:#cbd5e1;font-size:0.98rem;max-width:500px;margin:0 auto 1.5rem;line-height:1.6;">
          Tüm yanıtlarınız başarıyla kaydedildi ve <strong>Yönetim Paneline</strong> iletildi.
        </p>
        <div id="submitted-summary-list" style="text-align:left;display:grid;gap:0.65rem;max-height:420px;overflow-y:auto;padding-right:4px;"></div>
      </div>
    </div>
  </main>

  <script>
    (function() {
      const CONTRACT_ID = ${JSON.stringify(contractId).replace(/</g, '\\u003c')};
      const KAHOOT_MODE = ${JSON.stringify(kahootMode)};
      let QUESTIONS = ${JSON.stringify(questions).replace(/</g, '\\u003c')};
      const answers = new Array(QUESTIONS.length).fill('');
      let currentIdx = ${Number(contract.currentStep || 0)};
      let waitingForAdmin = ${JSON.stringify(!!contract.waitingForAdmin)};
      let initialStatus = ${JSON.stringify(contract.status || 'PENDING').replace(/</g, '\\u003c')};

      const DRAFT_KEY = 'eko_qcontract_draft_' + CONTRACT_ID;
      const syncBannerEl = document.getElementById('q-sync-banner');

      function setSyncBanner(msg, isWarning) {
        if (!syncBannerEl) return;
        if (!msg) {
          syncBannerEl.style.display = 'none';
          syncBannerEl.textContent = '';
          return;
        }
        syncBannerEl.style.display = 'block';
        syncBannerEl.style.background = isWarning ? 'rgba(251,191,36,0.12)' : 'rgba(16,185,129,0.12)';
        syncBannerEl.style.borderColor = isWarning ? 'rgba(251,191,36,0.38)' : 'rgba(16,185,129,0.38)';
        syncBannerEl.style.color = isWarning ? '#fde68a' : '#6ee7b7';
        syncBannerEl.textContent = msg;
      }

      function saveDraft() {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({
            currentIdx,
            answers,
            updatedAt: Date.now()
          }));
        } catch (_) {}
      }

      function loadDraft() {
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.answers)) {
            parsed.answers.forEach((val, idx) => {
              if (typeof val === 'string' && val.trim() !== '') {
                answers[idx] = val;
              }
            });
          }
          if (!KAHOOT_MODE && typeof parsed.currentIdx === 'number' && parsed.currentIdx >= 0 && parsed.currentIdx < QUESTIONS.length) {
            currentIdx = parsed.currentIdx;
          }
        } catch (_) {}
      }

      function clearDraft() {
        try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
      }

      async function safeReadJson(res) {
        const ct = (res.headers && res.headers.get('content-type')) || '';
        if (!ct.includes('application/json')) {
          return { success: false, error: res.status === 429 ? 'Çok fazla istek gönderildi, lütfen birkaç saniye bekleyin.' : ('Sunucu yanıtı geçersiz (' + res.status + ')') };
        }
        return await res.json();
      }

      async function fetchWithRetry(url, options, maxRetries) {
        const tries = maxRetries || 5;
        let lastErr = null;
        for (let i = 0; i < tries; i++) {
          try {
            const res = await fetch(url, options);
            if ([502, 503, 504].includes(res.status) && i < tries - 1) {
              setSyncBanner('⏳ Sunucu yeniden başlatılıyor, yazdığınız cevaplar güvende — tekrar bağlanılıyor...', true);
              await new Promise(r => setTimeout(r, 2000));
              continue;
            }
            setSyncBanner('', false);
            return res;
          } catch (err) {
            lastErr = err;
            if (i < tries - 1) {
              setSyncBanner('⏳ Bağlantı bekleniyor, yazdığınız cevaplar tarayıcıda korunuyor...', true);
              await new Promise(r => setTimeout(r, 2000));
            }
          }
        }
        throw lastErr || new Error('Sunucuya ulaşılamadı.');
      }

      loadDraft();

      const progressFillEl = document.getElementById('progress-fill-bar');
      const qTitleEl = document.getElementById('q-title-text');
      const qInputEl = document.getElementById('q-answer-input');
      const qErrorEl = document.getElementById('q-error-box');
      const qQuickEl = document.getElementById('q-quick-choices');
      const btnPrev = document.getElementById('btn-prev-q');
      const btnNext = document.getElementById('btn-next-q');

      const activeView = document.getElementById('wizard-active-view');
      const waitingView = document.getElementById('wizard-waiting-view');
      const transitionView = document.getElementById('wizard-transition-view');
      const successView = document.getElementById('wizard-success-view');

      const CLIENT_MEMES = [
        '🧠💨 Beyinler 3000 RPM çalışıyor...',
        '🚀🐸 Işık hızında sonraki soruya geçiliyor!',
        '😎☕ Yönetici "Sıradaki!" butonuna bastı basacak...',
        '🎮⚡ Kahoot turbo motoru devrede!',
        '👀🔥 Cevap radarları döndü, yeni soru hazırlanıyor!',
        '🐱💻 Kedi klavyeye bastı, soru iniyor!'
      ];

      function pickRandomMeme() {
        return CLIENT_MEMES[Math.floor(Math.random() * CLIENT_MEMES.length)];
      }

      function updateWaitingMeme() {
        const el = document.getElementById('waiting-meme-box');
        if (el) el.textContent = pickRandomMeme();
      }

      function getQuickChipsForQuestion(qText) {
        const lower = String(qText || '').toLowerCase();
        if (lower.includes('açık mı')) {
          return ['Evet, kampımız şu an açık ve aktif', 'Hayır, yakında açılacak (Hazırlık aşamasında)', 'Geçici olarak bakımda'];
        }
        if (lower.includes('mapı hazır') || lower.includes('sonradan yenilenecek')) {
          return ['Map tamamen hazır', 'Map hazır ancak ileride yenilenecek/güncellenecek', 'Map şu an yapım aşamasında'];
        }
        return [];
      }

      function showSuccessScreen(ansList) {
        clearDraft();
        setSyncBanner('', false);
        activeView.style.display = 'none';
        waitingView.style.display = 'none';
        if (transitionView) transitionView.style.display = 'none';
        successView.style.display = 'block';
        const summaryList = document.getElementById('submitted-summary-list');
        if (!summaryList) return;
        summaryList.innerHTML = '';
        (ansList || []).forEach(item => {
          const row = document.createElement('div');
          row.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:12px;padding:0.8rem 1rem;';
          const qEl = document.createElement('div');
          qEl.style.cssText = 'font-size:0.78rem;color:#a5b4fc;font-weight:800;margin-bottom:0.25rem;';
          qEl.textContent = item.question;
          const aEl = document.createElement('div');
          aEl.style.cssText = 'font-size:0.92rem;color:#fff;font-weight:600;white-space:pre-wrap;';
          aEl.textContent = item.answer;
          row.appendChild(qEl);
          row.appendChild(aEl);
          summaryList.appendChild(row);
        });
      }

      function renderCurrentQuestion() {
        const total = Math.max(QUESTIONS.length, 1);
        const qText = QUESTIONS[currentIdx] || '';
        const pct = Math.min(100, Math.round(((currentIdx + 1) / total) * 100));
        if (progressFillEl) progressFillEl.style.width = pct + '%';

        qTitleEl.textContent = qText;
        qInputEl.value = answers[currentIdx] || '';
        qErrorEl.style.display = 'none';

        const chips = getQuickChipsForQuestion(qText);
        if (chips.length > 0) {
          qQuickEl.style.display = 'flex';
          qQuickEl.innerHTML = '';
          chips.forEach(choice => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'quick-chip';
            chip.textContent = choice;
            chip.onclick = () => {
              qInputEl.value = choice;
              answers[currentIdx] = choice;
              qInputEl.focus();
            };
            qQuickEl.appendChild(chip);
          });
        } else {
          qQuickEl.style.display = 'none';
          qQuickEl.innerHTML = '';
        }

        if (!KAHOOT_MODE) {
          btnPrev.disabled = currentIdx === 0;
          btnNext.textContent = currentIdx === QUESTIONS.length - 1
            ? '✅ Tamamla ve Gönder'
            : 'Sonraki Soru →';
        } else {
          btnNext.textContent = '📤 Cevabı Gönder & Sonraki Soru İsteği Yolla';
        }

        setTimeout(() => qInputEl.focus(), 40);
      }

      if (qInputEl) {
        qInputEl.addEventListener('input', () => {
          answers[currentIdx] = qInputEl.value || '';
          saveDraft();
        });
      }

      window.prevQuestion = function() {
        if (KAHOOT_MODE) return;
        answers[currentIdx] = (qInputEl.value || '').trim();
        if (currentIdx > 0) {
          currentIdx--;
          saveDraft();
          renderCurrentQuestion();
        }
      };

      window.nextQuestion = async function() {
        const val = (qInputEl.value || '').trim();
        if (!val) {
          qErrorEl.textContent = 'Lütfen devam etmeden önce bu soruyu cevaplayınız.';
          qErrorEl.style.display = 'block';
          qInputEl.focus();
          return;
        }
        answers[currentIdx] = val;
        saveDraft();

        if (KAHOOT_MODE) {
          btnNext.disabled = true;
          btnNext.textContent = '⏳ Cevap Gönderiliyor...';
          try {
            const res = await fetchWithRetry('/api/question-contracts/' + encodeURIComponent(CONTRACT_ID) + '/answer-step', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ answer: val, question: QUESTIONS[currentIdx] })
            }, 5);
            const data = await safeReadJson(res);
            if (res.ok && data.success) {
              waitingForAdmin = true;
              updateWaitingMeme();
              activeView.style.display = 'none';
              waitingView.style.display = 'block';
              document.getElementById('request-feedback').textContent = '🔔 Sonraki soru isteği yöneticiye iletildi.';
            } else {
              qErrorEl.textContent = data.error || 'Gönderilemedi.';
              qErrorEl.style.display = 'block';
            }
          } catch (err) {
            qErrorEl.textContent = 'Bağlantı hatası (cevabınız tarayıcıda korundu): ' + err.message;
            qErrorEl.style.display = 'block';
          } finally {
            btnNext.disabled = false;
            btnNext.textContent = '📤 Cevabı Gönder & Sonraki Soru İsteği Yolla';
          }
          return;
        }

        if (currentIdx < QUESTIONS.length - 1) {
          currentIdx++;
          saveDraft();
          renderCurrentQuestion();
          return;
        }

        btnNext.disabled = true;
        btnPrev.disabled = true;
        btnNext.textContent = '⏳ Gönderiliyor...';
        const payloadAnswers = QUESTIONS.map((q, idx) => ({ question: q, answer: answers[idx] || '' }));
        try {
          const res = await fetchWithRetry('/api/question-contracts/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractId: CONTRACT_ID, answers: payloadAnswers })
          }, 5);
          const data = await safeReadJson(res);
          if (res.ok && data.success) {
            showSuccessScreen(payloadAnswers);
          } else {
            qErrorEl.textContent = data.error || 'Hata oluştu.';
            qErrorEl.style.display = 'block';
            btnNext.disabled = false;
            btnPrev.disabled = currentIdx === 0;
          }
        } catch (err) {
          qErrorEl.textContent = 'Bağlantı hatası (tüm cevaplarınız korundu, tekrar deneyin): ' + err.message;
          qErrorEl.style.display = 'block';
          btnNext.disabled = false;
          btnPrev.disabled = currentIdx === 0;
        }
      };

      window.sendNextRequest = async function() {
        try {
          const res = await fetchWithRetry('/api/question-contracts/' + encodeURIComponent(CONTRACT_ID) + '/request-next', { method: 'POST' }, 3);
          if (res.ok) {
            document.getElementById('request-feedback').textContent = '🔔 İstek tekrar gönderildi! Yönetici onayladığında yeni soru açılacaktır.';
          }
        } catch (_) {}
      };

      if (KAHOOT_MODE) {
        if (initialStatus === 'SIGNED') {
          showSuccessScreen(${JSON.stringify(contract.answers || []).replace(/</g, '\\u003c')});
        } else if (waitingForAdmin) {
          updateWaitingMeme();
          activeView.style.display = 'none';
          waitingView.style.display = 'block';
        } else {
          renderCurrentQuestion();
        }

        // Beklerken her 3 saniyede bir eğlenceli meme metnini döndür
        setInterval(() => {
          if (waitingView && waitingView.style.display === 'block') {
            updateWaitingMeme();
          }
        }, 3000);

        // Canlı Kahoot Polling (1.2sn): Yönetici sonraki soruya geçirdiğinde meme'li hızlı geçişle aç
        let kahootPollTimer = null;
        let isTransitioning = false;
        kahootPollTimer = setInterval(async () => {
          if (document.hidden || isTransitioning) return;
          try {
            const res = await fetch('/api/question-contracts/' + encodeURIComponent(CONTRACT_ID) + '/state');
            if ([502, 503, 504].includes(res.status)) {
              setSyncBanner('⏳ Sunucu yeniden başlatılıyor, oturumunuz ve cevaplarınız korunuyor...', true);
              return;
            }
            const st = await safeReadJson(res);
            if (!res.ok || !st.success) return;
            setSyncBanner('', false);

            if (st.status === 'SIGNED') {
              showSuccessScreen(st.answers || []);
              if (kahootPollTimer) { clearInterval(kahootPollTimer); kahootPollTimer = null; }
              return;
            }
            if (!st.waitingForAdmin && st.currentQuestion) {
              const stepChanged = Number(st.currentStep) !== Number(currentIdx) || waitingForAdmin;
              if (stepChanged) {
                isTransitioning = true;
                currentIdx = Number(st.currentStep);
                QUESTIONS[currentIdx] = st.currentQuestion;
                waitingForAdmin = false;
                saveDraft();
                waitingView.style.display = 'none';
                successView.style.display = 'none';
                activeView.style.display = 'none';
                const tMeme = document.getElementById('transition-meme-text');
                if (tMeme) tMeme.textContent = pickRandomMeme();
                if (transitionView) transitionView.style.display = 'block';
                setTimeout(() => {
                  if (transitionView) transitionView.style.display = 'none';
                  activeView.style.display = 'block';
                  renderCurrentQuestion();
                  isTransitioning = false;
                }, 450);
              }
            }
          } catch (_) {
            setSyncBanner('⏳ Bağlantı bekleniyor, yazdığınız cevaplar tarayıcıda korunuyor...', true);
          }
        }, 1200);
      } else {
        renderCurrentQuestion();
      }
    })();
  </script>
</body>
</html>`;
}

module.exports = {
  DEFAULT_CAMP_QUESTIONS,
  renderAdminQuestionContractsWorkspace,
  renderPublicQuestionContractPage,
};
