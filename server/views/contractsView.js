'use strict';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatContractBodyHtml(rawText) {
  const text = String(rawText || '').trim();
  if (!text) {
    return '<p class="contract-p">İşbu sözleşme metni henüz doldurulmamıştır.</p>';
  }

  const lines = text.split(/\r?\n/);
  const htmlParts = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      htmlParts.push('<div class="contract-spacer"></div>');
      continue;
    }

    if (/^(MADDE\s+\d+|BÖLÜM\s+[IVX\d]+|GEÇİCİ\s+MADDE|EK\s+MADDE)/i.test(line)) {
      htmlParts.push(`<h3 class="contract-clause-title">${esc(line)}</h3>`);
    } else if (/^(\d+\.\d+|\([a-zğıöşü0-9]+\)|[-•▪])/i.test(line)) {
      htmlParts.push(`<p class="contract-subclause">${esc(line)}</p>`);
    } else {
      htmlParts.push(`<p class="contract-p">${esc(line)}</p>`);
    }
  }

  return htmlParts.join('\n');
}

function renderAdminContractsWorkspace() {
  return `<section id="adm-contracts" class="acc-workspace-panel" data-admin-workspace="contracts" hidden>
  <header class="acc-page-head" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;">
    <div>
      <span class="acc-eyebrow">HUKUK VE RESMÎ EVRAK DAİRESİ</span>
      <h1>📜 Sözleşmeler Yönetimi &amp; E-İmza Merkezi</h1>
      <p>Times New Roman resmi protokol formatında sözleşmeler oluşturun, <strong>EkoAI</strong> ile maddeleri geliştirip uzunlaştırın, paylaşım linki üretin ve mouse ile atılan e-imzaları takip edin.</p>
    </div>
    <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
      <button type="button" class="acc-btn" onclick="window.loadAdminContracts && window.loadAdminContracts()">🔄 Listeyi Yenile</button>
    </div>
  </header>

  <!-- Özet İstatistikler -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem;">
    <div style="background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.22);padding:1.1rem;border-radius:14px;">
      <div style="font-size:1.75rem;font-weight:800;color:#818cf8;" id="adm-contract-stat-total">0</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-top:0.2rem;">📜 Toplam Resmi Sözleşme</div>
    </div>
    <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.22);padding:1.1rem;border-radius:14px;">
      <div style="font-size:1.75rem;font-weight:800;color:#34d399;" id="adm-contract-stat-signed">0</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-top:0.2rem;">✍️ E-İmza ile İmzalanan</div>
    </div>
    <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.22);padding:1.1rem;border-radius:14px;">
      <div style="font-size:1.75rem;font-weight:800;color:#fbbf24;" id="adm-contract-stat-pending">0</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-top:0.2rem;">⏳ İmza Bekleyen</div>
    </div>
  </div>

  <!-- Yeni Sözleşme Oluşturucu + Canlı Resmi Önizleme -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:1.5rem;margin-bottom:2rem;align-items:start;">
    <!-- Sol: Sözleşme Oluşturma ve EkoAI Paneli -->
    <div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.09);border-radius:18px;padding:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem;">
        <h2 style="font-size:1.2rem;font-weight:800;margin:0;color:#fff;">✒️ Yeni Resmi Sözleşme Oluştur</h2>
        <button type="button" onclick="window.generateFormalContractTitle()" style="background:rgba(251,191,36,0.14);border:1px solid rgba(251,191,36,0.35);color:#fbbf24;padding:0.4rem 0.8rem;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;">
          🎲 Resmi Başlık Oluştur
        </button>
      </div>

      <!-- Hızlı Şablon Seçici -->
      <div style="margin-bottom:1.1rem;">
        <label style="display:block;font-size:0.76rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.45rem;">Hazır Resmi Şablonlar (Tek Tıkla Doldur)</label>
        <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
          <button type="button" onclick="window.applyContractPreset('nda')" style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);color:#a5b4fc;padding:0.38rem 0.7rem;border-radius:8px;font-size:0.76rem;font-weight:600;cursor:pointer;">🏛️ Gizlilik ve Sadakat</button>
          <button type="button" onclick="window.applyContractPreset('staff')" style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);color:#6ee7b7;padding:0.38rem 0.7rem;border-radius:8px;font-size:0.76rem;font-weight:600;cursor:pointer;">🛡️ Yetkili Görev Sözleşmesi</button>
          <button type="button" onclick="window.applyContractPreset('partner')" style="background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.3);color:#fda4af;padding:0.38rem 0.7rem;border-radius:8px;font-size:0.76rem;font-weight:600;cursor:pointer;">🤝 Ortaklık &amp; Sponsorluk</button>
          <button type="button" onclick="window.applyContractPreset('ip')" style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);color:#d8b4fe;padding:0.38rem 0.7rem;border-radius:8px;font-size:0.76rem;font-weight:600;cursor:pointer;">⚖️ Telif &amp; Fikri Mülkiyet</button>
        </div>
      </div>

      <div style="display:grid;gap:0.85rem;">
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.3rem;color:#e2e8f0;">Sözleşme Resmi Başlığı *</label>
          <input type="text" id="contract-title" placeholder="Örn: KURUMSAL GİZLİLİK, SADAKAT VE HİZMET SÖZLEŞMESİ" oninput="window.updateContractLivePreview()" style="width:100%;padding:0.7rem 0.85rem;background:rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-family:'Times New Roman',Times,serif;font-size:1rem;font-weight:700;" />
        </div>

        <div style="display:grid;grid-template-columns:2fr 1fr;gap:0.75rem;">
          <div>
            <label style="display:block;font-size:0.78rem;font-weight:700;margin-bottom:0.3rem;color:#cbd5e1;">Üst Makam / Antet Başlığı</label>
            <input type="text" id="contract-subtitle" value="T.C. İSTANBUL • EKOYILDIZ & SENTARA YÜKSEK HUKUK VE DENETİM DAİRESİ BAŞKANLIĞI" oninput="window.updateContractLivePreview()" style="width:100%;padding:0.6rem 0.75rem;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#cbd5e1;font-size:0.82rem;" />
          </div>
          <div>
            <label style="display:block;font-size:0.78rem;font-weight:700;margin-bottom:0.3rem;color:#cbd5e1;">Evrak Kayıt No</label>
            <input type="text" id="contract-doc-no" value="EKO-2026/SZL-1042" oninput="window.updateContractLivePreview()" style="width:100%;padding:0.6rem 0.75rem;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fbbf24;font-family:monospace;font-size:0.84rem;" />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div>
            <label style="display:block;font-size:0.78rem;font-weight:700;margin-bottom:0.3rem;color:#cbd5e1;">1. Taraf (Kurum / Düzenleyen)</label>
            <input type="text" id="contract-party-one" value="EkoYıldız & Sentara Yönetimi" oninput="window.updateContractLivePreview()" style="width:100%;padding:0.6rem 0.75rem;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:0.85rem;" />
          </div>
          <div>
            <label style="display:block;font-size:0.78rem;font-weight:700;margin-bottom:0.3rem;color:#cbd5e1;">2. Taraf (Muhatap / İmzacı Adı)</label>
            <input type="text" id="contract-party-two" placeholder="İmzalayacak kişi (boş bırakılırsa imzacı yazar)" oninput="window.updateContractLivePreview()" style="width:100%;padding:0.6rem 0.75rem;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:0.85rem;" />
          </div>
        </div>

        <!-- EkoAI Geliştirme Çubuğu -->
        <div style="background:linear-gradient(135deg,rgba(139,92,246,0.14),rgba(236,72,153,0.1));border:1px solid rgba(167,139,250,0.35);border-radius:12px;padding:0.9rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.6rem;flex-wrap:wrap;margin-bottom:0.55rem;">
            <div style="display:flex;align-items:center;gap:0.45rem;">
              <span style="font-size:1.1rem;">✨</span>
              <strong style="color:#e9d5ff;font-size:0.88rem;">EkoAI Hukuki Sözleşme Geliştirici</strong>
            </div>
            <select id="contract-ai-mode" style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);color:#f3e8ff;border-radius:8px;padding:0.3rem 0.6rem;font-size:0.76rem;">
              <option value="expand_formal">Ağır Resmi Hukuki Dil ile Uzat &amp; Maddelendir</option>
              <option value="strict_penalty">Cezai Şart, Sır Saklama ve Delil Maddeleri Ekle</option>
              <option value="full_rewrite">Kısa Notu Tam Teşekküllü Resmi Sözleşmeye Dönüştür</option>
            </select>
          </div>
          <p style="font-size:0.76rem;color:#cbd5e1;margin:0 0 0.65rem 0;line-height:1.45;">
            Aşağıya birkaç kelimelik konu veya taslak yazıp <strong>EkoAI ile Geliştir</strong> butonuna basın; yapay zeka metni ağır resmi hukuk diliyle uzunlaştırıp maddelere ayırsın.
          </p>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button type="button" id="btn-contract-ai-enhance" onclick="window.enhanceContractWithEkoAI()" style="flex:1;background:linear-gradient(135deg,#7c3aed,#db2777);border:none;color:#fff;padding:0.65rem 1rem;border-radius:10px;font-weight:800;font-size:0.84rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.45rem;box-shadow:0 6px 20px rgba(124,58,237,0.3);">
              <span>✨</span> <span>EkoAI ile Geliştir &amp; Yazıları Uzunlaştır</span>
            </button>
            <button type="button" onclick="window.appendNewContractClause()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);color:#fff;padding:0.65rem 0.9rem;border-radius:10px;font-weight:700;font-size:0.8rem;cursor:pointer;">
              + Madde Ekle
            </button>
          </div>
          <div id="contract-ai-status" style="display:none;margin-top:0.55rem;font-size:0.78rem;color:#c4b5fd;"></div>
        </div>

        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.3rem;color:#e2e8f0;">Sözleşme Hükümleri ve Maddeleri (Times New Roman) *</label>
          <textarea id="contract-content" rows="12" oninput="window.updateContractLivePreview()" placeholder="Sözleşme maddelerini buraya yazın veya birkaç cümle yazıp 'EkoAI ile Geliştir' butonuna tıklayın..." style="width:100%;padding:0.85rem;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.14);border-radius:12px;color:#f8fafc;font-family:'Times New Roman',Times,Georgia,serif;font-size:1.02rem;line-height:1.65;resize:vertical;"></textarea>
        </div>

        <button type="button" id="btn-create-contract" onclick="window.submitCreateContract()" style="width:100%;padding:0.9rem 1.2rem;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:12px;color:#fff;font-weight:800;font-size:0.95rem;cursor:pointer;box-shadow:0 8px 24px rgba(16,185,129,0.25);">
          📜 Resmi Sözleşmeyi Oluştur ve Paylaşım Linki Üret
        </button>

        <!-- Oluşturulan Sözleşme Paylaşım Kutusu -->
        <div id="contract-share-banner" style="display:none;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.35);border-radius:14px;padding:1rem;">
          <div style="font-weight:800;color:#34d399;font-size:0.9rem;margin-bottom:0.4rem;">✅ Resmi Sözleşme Hazır! Başkasına Paylaşabilirsiniz:</div>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
            <input type="text" id="contract-created-url" readonly style="flex:1;min-width:200px;padding:0.55rem 0.75rem;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-family:monospace;font-size:0.82rem;" />
            <button type="button" onclick="window.copyCreatedContractLink()" style="background:#10b981;border:none;color:#052e16;font-weight:800;padding:0.55rem 0.9rem;border-radius:8px;cursor:pointer;font-size:0.8rem;">🔗 Linki Kopyala</button>
            <button type="button" onclick="window.shareCreatedContractNative()" style="background:#6366f1;border:none;color:#fff;font-weight:800;padding:0.55rem 0.9rem;border-radius:8px;cursor:pointer;font-size:0.8rem;">📤 Başkasına Paylaş</button>
            <a id="contract-created-open" href="#" target="_blank" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;text-decoration:none;font-weight:700;padding:0.55rem 0.9rem;border-radius:8px;font-size:0.8rem;">📄 Sözleşmeyi Aç ↗</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Sağ: Times New Roman Resmi Belge Canlı Önizlemesi -->
    <div style="background:#fcfaf2;color:#111111;border:4px double #1e1b18;border-radius:6px;padding:2rem 1.75rem;box-shadow:0 20px 50px rgba(0,0,0,0.45);font-family:'Times New Roman',Times,Georgia,serif;position:relative;">
      <div style="border-bottom:2px solid #111;padding-bottom:0.8rem;margin-bottom:1rem;text-align:center;">
        <div id="preview-contract-subtitle" style="font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#333;font-weight:700;">
          T.C. İSTANBUL • EKOYILDIZ &amp; SENTARA YÜKSEK HUKUK VE DENETİM DAİRESİ BAŞKANLIĞI
        </div>
        <h3 id="preview-contract-title" style="font-size:1.35rem;font-weight:700;margin:0.45rem 0 0.25rem;text-transform:uppercase;color:#000;font-family:'Times New Roman',Times,serif;">
          KURUMSAL GİZLİLİK, SADAKAT VE HİZMET SÖZLEŞMESİ
        </h3>
        <div style="font-size:0.78rem;color:#444;">
          Evrak Kayıt No: <strong id="preview-contract-docno">EKO-2026/SZL-1042</strong> &nbsp;|&nbsp; Resmi Nüsha (Times New Roman)
        </div>
      </div>

      <div style="background:#f4efe1;border:1px solid #cbbfa3;padding:0.65rem 0.85rem;margin-bottom:1rem;font-size:0.86rem;line-height:1.5;">
        <div><strong>1. TARAF (KURUM):</strong> <span id="preview-party-one">EkoYıldız &amp; Sentara Yönetimi</span></div>
        <div><strong>2. TARAF (MUHATAP):</strong> <span id="preview-party-two">İmza Sahibi Muhatap</span></div>
      </div>

      <div id="preview-contract-body" style="font-size:0.95rem;line-height:1.75;text-align:justify;max-height:380px;overflow-y:auto;padding-right:6px;color:#111;">
      </div>

      <div style="border-top:1px solid #333;margin-top:1.25rem;padding-top:0.9rem;display:grid;grid-template-columns:1fr 1fr;gap:1rem;font-size:0.82rem;text-align:center;">
        <div>
          <strong>1. TARAF (KURUM MÜHRÜ)</strong>
          <div style="margin-top:0.4rem;color:#7f1d1d;font-weight:700;border:2px dashed #7f1d1d;display:inline-block;padding:4px 10px;border-radius:999px;font-size:0.72rem;">
            ✪ EKOYILDIZ RESMİ MÜHÜR
          </div>
        </div>
        <div>
          <strong>2. TARAF (MOUSE E-İMZA ALANI)</strong>
          <div style="margin-top:0.4rem;color:#1e3a8a;font-style:italic;font-size:0.78rem;">
            [Muhatap Tarafından Fare İle İmzalanacaktır]
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mevcut Sözleşmeler Tablosu -->
  <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:1.5rem;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.75rem;">
      <h2 style="font-size:1.15rem;font-weight:800;margin:0;color:#fff;">📂 Oluşturulan Sözleşmeler ve E-İmza Kayıtları</h2>
      <span style="font-size:0.8rem;color:var(--muted);">Her sözleşmenin linkini kopyalayıp karşı tarafa gönderebilirsiniz.</span>
    </div>
    <div id="adm-contracts-list" style="overflow-x:auto;">
      <div style="color:var(--muted);text-align:center;padding:2rem;">Sözleşmeler yükleniyor...</div>
    </div>
  </div>

  <script>
    (function() {
      const PRESETS = {
        nda: {
          title: 'KURUMSAL GİZLİLİK, SIR SAKLAMA VE SADAKAT SÖZLEŞMESİ',
          body: \`MADDE 1 — TARAFLAR VE AMAÇ
İşbu Kurumsal Gizlilik, Sır Saklama ve Sadakat Sözleşmesi ("Sözleşme"), bir tarafta EkoYıldız & Sentara Yönetimi ("Kurum") ile diğer tarafta aşağıda ıslak görünümlü elektronik imzası bulunan muhatap ("İmzacı") arasında, Kurum bünyesindeki tüm idari, teknik ve stratejik bilgilerin korunması amacıyla akdedilmiştir.

MADDE 2 — GİZLİ BİLGİNİN TANIMI VE KAPSAMI
Kurum içerisindeki yönetim panelleri, bot altyapısı, moderasyon yönergeleri, yetkili yazışmaları, kullanıcı verileri ve iç denetim kararları mutlak surette "Gizli Bilgi" niteliğindedir. İmzacı, bu bilgileri hiçbir üçüncü şahıs, topluluk veya kurum ile paylaşamaz.

MADDE 3 — TARAFLARIN YÜKÜMLÜLÜKLERİ
İmzacı, görev süresi boyunca ve görevi sona erdikten sonra dahi Kurum'un itibarını, veri güvenliğini ve kurumsal mahremiyetini korumakla yükümlüdür.

MADDE 4 — CEZAİ ŞARTLAR VE YAPTIRIMLAR
İşbu sözleşme hükümlerinin ihlali halinde İmzacı'nın tüm yetki ve imtiyazları derhal iptal edilir, kara liste (blacklist) işlemi uygulanır ve doğacak zararlardan ötürü hukuki süreç başlatılır.

MADDE 5 — DELİL SÖZLEŞMESİ VE YÜRÜRLÜK
6100 sayılı Hukuk Muhakemeleri Kanunu'nun 193. maddesi uyarınca Kurum'un elektronik kayıtları ve işbu belge üzerindeki mouse e-imza verileri kesin delil teşkil eder.\`
        },
        staff: {
          title: 'YETKİLİ PERSONEL GÖREV, YETKİ VE SORUMLULUK SÖZLEŞMESİ',
          body: \`MADDE 1 — SÖZLEŞMENİN KONUSU
İşbu sözleşme, EkoYıldız & Sentara topluluğu bünyesinde görev alacak Yetkili Personelin uyacağı disiplin kurallarını, görev standartlarını ve etik ilkeleri düzenler.

MADDE 2 — TARAFSIZLIK VE ADALET İLKESİ
Yetkili personel, hiçbir kullanıcıya kişisel yakınlık veya husumet sebebiyle ayrıcalıklı yahut adaletsiz işlem uygulayamaz. Tüm moderasyon işlemleri kanıtlı ve kayıtlı yürütülür.

MADDE 3 — YETKİ KULLANIM SINIRLARI
Personel, kendisine tevdi edilen yönetimsel araçları yalnızca görev tanımı dahilinde kullanacağını, yetkiyi kötüye kullanmayacağını (abuse yapmayacağını) gayrikabili rücu kabul ve taahhüt eder.

MADDE 4 — FESİH VE ELEKTRONİK İMZA GEÇERLİLİĞİ
İşbu sözleşme, muhatap tarafından elektronik ortamda fare (mouse) ile imzalandığı anda yürürlüğe girer.\`
        },
        partner: {
          title: 'KURUMSAL ORTAKLIK, REKLAM VE SPONSORLUK PROTOKOLÜ',
          body: \`MADDE 1 — PROTOKOLÜN AMACI VE TARAFLAR
İşbu protokol, EkoYıldız & Sentara Yönetimi ile İş Ortağı / Sponsor arasında gerçekleştirilecek tanıtım, etkinlik ve kurumsal iş birliği şartlarını kayıt altına alır.

MADDE 2 — HİZMET VE TANITIM ESASLARI
Taraflar, üzerinde mutabık kalınan reklam, çekiliş ve duyuru takvimine sadık kalacaklarını, topluluk standartlarına aykırı hiçbir içerik paylaşmayacaklarını taahhüt eder.

MADDE 3 — MALİ HÜKÜMLER VE İADE KOŞULLARI
Onaylanan ve yayına alınan kurumsal tanıtım operasyonlarında hizmet ifa edilmiş sayılır. Taraflar karşılıklı marka değerini koruyacak şekilde hareket eder.

MADDE 4 — YÜRÜRLÜK
İşbu protokol, elektronik imza ile onaylandığı tarihte resmiyet kazanır.\`
        },
        ip: {
          title: '5846 SAYILI FSEK KAPSAMINDA FİKRİ MÜLKİYET VE TELİF TAAHHÜTNAMESİ',
          body: \`MADDE 1 — AMAÇ VE KAPSAM
İşbu Taahhütname, EkoYıldız & Sentara bünyesinde geliştirilen tüm yazılım kodları, tasarımlar, bot sistemleri ve dijital eserlerin 5846 sayılı Fikir ve Sanat Eserleri Kanunu kapsamında korunması amacıyla düzenlenmiştir.

MADDE 2 — KOPYALAMA VE ÇOĞALTMA YASAĞI
İmzacı, Kurum'a ait hiçbir yazılım, grafik, veri tabanı veya proje dosyasını izinsiz kopyalamayacağını, üçüncü kişilere devretmeyeceğini ve tersine mühendislik işlemine tabi tutmayacağını beyan ve taahhüt eder.

MADDE 3 — HUKUKİ SORUMLULUK VE KESİN DELİL
İhlal tespitinde sunucu erişim kayıtları ve işbu e-imzalı taahhütname kesin delil olarak kullanılır.\`
        }
      };

      const FORMAL_TITLES = [
        'KURUMSAL GİZLİLİK, SIR SAKLAMA VE SADAKAT SÖZLEŞMESİ',
        'YÜKSEK YÖNETİM GÖREV, YETKİ VE SORUMLULUK PROTOKOLÜ',
        'RESMİ HİZMET, İŞ BİRLİĞİ VE HUKUKİ TAAHHÜTNAME SÖZLEŞMESİ',
        'DİJİTAL GÜVENLİK, VERİ KORUMA VE FİKRİ MÜLKİYET SÖZLEŞMESİ',
        'ÖZEL YETKİLİ PERSONEL ATAMA VE ETİK İLKELER SÖZLEŞMESİ'
      ];

      window.generateFormalContractTitle = function() {
        const titleEl = document.getElementById('contract-title');
        const docNoEl = document.getElementById('contract-doc-no');
        if (titleEl) {
          const pick = FORMAL_TITLES[Math.floor(Math.random() * FORMAL_TITLES.length)];
          titleEl.value = pick;
        }
        if (docNoEl) {
          docNoEl.value = 'EKO-' + new Date().getFullYear() + '/SZL-' + Math.floor(1000 + Math.random() * 9000);
        }
        window.updateContractLivePreview();
      };

      window.applyContractPreset = function(key) {
        const preset = PRESETS[key];
        if (!preset) return;
        const titleEl = document.getElementById('contract-title');
        const contentEl = document.getElementById('contract-content');
        const docNoEl = document.getElementById('contract-doc-no');
        if (titleEl) titleEl.value = preset.title;
        if (contentEl) contentEl.value = preset.body;
        if (docNoEl) docNoEl.value = 'EKO-' + new Date().getFullYear() + '/SZL-' + Math.floor(1000 + Math.random() * 9000);
        window.updateContractLivePreview();
      };

      window.appendNewContractClause = function() {
        const contentEl = document.getElementById('contract-content');
        if (!contentEl) return;
        const current = contentEl.value.trim();
        const matches = current.match(/MADDE\\s+(\\d+)/gi) || [];
        const nextNum = matches.length + 1;
        const clause = (current ? '\\n\\n' : '') + 'MADDE ' + nextNum + ' — ÖZEL HÜKÜMLER VE YÜKÜMLÜLÜKLER\\nTaraflar, işbu madde kapsamında belirlenen idari ve hukuki yükümlülüklere eksiksiz riayet etmeyi kabul ve taahhüt eder.';
        contentEl.value = current + clause;
        window.updateContractLivePreview();
      };

      window.updateContractLivePreview = function() {
        const title = document.getElementById('contract-title')?.value || 'RESMİ SÖZLEŞME VE PROTOKOL METNİ';
        const subtitle = document.getElementById('contract-subtitle')?.value || 'T.C. İSTANBUL • EKOYILDIZ & SENTARA HUKUK DAİRESİ';
        const docNo = document.getElementById('contract-doc-no')?.value || 'EKO-2026/SZL-1001';
        const p1 = document.getElementById('contract-party-one')?.value || 'EkoYıldız & Sentara Yönetimi';
        const p2 = document.getElementById('contract-party-two')?.value || 'İmza Sahibi Muhatap';
        const body = document.getElementById('contract-content')?.value || '';

        const elTitle = document.getElementById('preview-contract-title');
        const elSub = document.getElementById('preview-contract-subtitle');
        const elDoc = document.getElementById('preview-contract-docno');
        const elP1 = document.getElementById('preview-party-one');
        const elP2 = document.getElementById('preview-party-two');
        const elBody = document.getElementById('preview-contract-body');

        if (elTitle) elTitle.textContent = title;
        if (elSub) elSub.textContent = subtitle;
        if (elDoc) elDoc.textContent = docNo;
        if (elP1) elP1.textContent = p1;
        if (elP2) elP2.textContent = p2;

        if (elBody) {
          elBody.innerHTML = '';
          const lines = body.split(/\\r?\\n/);
          lines.forEach(raw => {
            const line = raw.trim();
            if (!line) {
              const sp = document.createElement('div');
              sp.style.height = '0.5rem';
              elBody.appendChild(sp);
              return;
            }
            if (/^(MADDE\\s+\\d+|BÖLÜM\\s+[IVX\\d]+)/i.test(line)) {
              const h = document.createElement('div');
              h.style.fontWeight = '700';
              h.style.marginTop = '0.6rem';
              h.style.marginBottom = '0.2rem';
              h.style.textTransform = 'uppercase';
              h.textContent = line;
              elBody.appendChild(h);
            } else {
              const p = document.createElement('p');
              p.style.margin = '0 0 0.35rem 0';
              p.textContent = line;
              elBody.appendChild(p);
            }
          });
        }
      };

      window.enhanceContractWithEkoAI = async function() {
        const btn = document.getElementById('btn-contract-ai-enhance');
        const statusEl = document.getElementById('contract-ai-status');
        const titleEl = document.getElementById('contract-title');
        const contentEl = document.getElementById('contract-content');
        const p1El = document.getElementById('contract-party-one');
        const p2El = document.getElementById('contract-party-two');
        const modeEl = document.getElementById('contract-ai-mode');

        if (!contentEl) return;
        const draft = contentEl.value.trim();
        const title = titleEl?.value.trim() || '';

        btn.disabled = true;
        const origHtml = btn.innerHTML;
        btn.innerHTML = '⏳ EkoAI resmi hukuk metnini geliştiriyor ve uzunlaştırıyor...';
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.textContent = '🤖 EkoAI Hukuk Servisi maddeleri detaylandırıyor, lütfen bekleyin...';
        }

        try {
          const res = await fetch('/api/admin/contracts/ai-enhance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              content: draft,
              partyOne: p1El?.value || 'EkoYıldız & Sentara Yönetimi',
              partyTwo: p2El?.value || 'Muhatap',
              mode: modeEl?.value || 'expand_formal'
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            if (data.title && titleEl && !titleEl.value.trim()) {
              titleEl.value = data.title;
            } else if (data.title && titleEl && modeEl?.value === 'full_rewrite') {
              titleEl.value = data.title;
            }
            contentEl.value = data.content;
            window.updateContractLivePreview();
            if (statusEl) {
              statusEl.style.color = '#34d399';
              statusEl.textContent = '✅ EkoAI sözleşmeyi resmi hukuk dilinde geliştirdi ve maddeleri uzunlaştırdı!';
            }
          } else {
            if (statusEl) {
              statusEl.style.color = '#fb7185';
              statusEl.textContent = '❌ Hata: ' + (data.error || 'EkoAI yanıt veremedi.');
            }
          }
        } catch (err) {
          if (statusEl) {
            statusEl.style.color = '#fb7185';
            statusEl.textContent = '❌ Bağlantı hatası: ' + err.message;
          }
        } finally {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
      };

      window.submitCreateContract = async function() {
        const title = document.getElementById('contract-title')?.value.trim();
        const headerSubtitle = document.getElementById('contract-subtitle')?.value.trim();
        const documentNo = document.getElementById('contract-doc-no')?.value.trim();
        const partyOneName = document.getElementById('contract-party-one')?.value.trim();
        const partyTwoName = document.getElementById('contract-party-two')?.value.trim();
        const content = document.getElementById('contract-content')?.value.trim();
        const btn = document.getElementById('btn-create-contract');

        if (!title || !content) {
          alert('Lütfen sözleşme başlığını ve maddelerini doldurun (veya EkoAI ile oluşturun).');
          return;
        }

        btn.disabled = true;
        btn.textContent = '⏳ Resmi Sözleşme Kaydediliyor...';

        try {
          const res = await fetch('/api/admin/contracts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              headerSubtitle,
              documentNo,
              partyOneName,
              partyTwoName,
              content
            })
          });
          const data = await res.json();
          if (res.ok && data.success && data.contract) {
            const fullUrl = window.location.origin + '/sozlesme/' + data.contract._id;
            const banner = document.getElementById('contract-share-banner');
            const urlInput = document.getElementById('contract-created-url');
            const openLink = document.getElementById('contract-created-open');
            if (banner) banner.style.display = 'block';
            if (urlInput) urlInput.value = fullUrl;
            if (openLink) openLink.href = fullUrl;
            window.loadAdminContracts();
          } else {
            alert(data.error || 'Sözleşme oluşturulamadı.');
          }
        } catch (err) {
          alert('Bağlantı hatası: ' + err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = '📜 Resmi Sözleşmeyi Oluştur ve Paylaşım Linki Üret';
        }
      };

      window.copyCreatedContractLink = function() {
        const urlInput = document.getElementById('contract-created-url');
        if (!urlInput || !urlInput.value) return;
        navigator.clipboard.writeText(urlInput.value).then(() => {
          alert('🔗 Sözleşme bağlantısı panoya kopyalandı: ' + urlInput.value);
        }).catch(() => {
          urlInput.select();
          document.execCommand('copy');
          alert('🔗 Sözleşme bağlantısı kopyalandı!');
        });
      };

      window.shareCreatedContractNative = function() {
        const urlInput = document.getElementById('contract-created-url');
        const title = document.getElementById('contract-title')?.value || 'EkoYıldız Resmi Sözleşme';
        if (!urlInput || !urlInput.value) return;
        window.shareContractUrl(urlInput.value, title);
      };

      window.shareContractUrl = function(url, title) {
        const fullUrl = url.startsWith('http') ? url : (window.location.origin + url);
        if (navigator.share) {
          navigator.share({
            title: title || 'EkoYıldız Resmi Sözleşme',
            text: '📜 EkoYıldız Resmi Sözleşme ve E-İmza Belgesi: ' + (title || ''),
            url: fullUrl
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(fullUrl).then(() => {
            alert('🔗 Paylaşım linki panoya kopyalandı! İstediğiniz kişiye gönderebilirsiniz:\\n\\n' + fullUrl);
          }).catch(() => {
            prompt('Sözleşme Paylaşım Linkini Kopyalayın:', fullUrl);
          });
        }
      };

      window.deleteAdminContract = async function(id) {
        if (!confirm('Bu resmi sözleşmeyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
        try {
          const res = await fetch('/api/admin/contracts/' + encodeURIComponent(id), { method: 'DELETE' });
          const data = await res.json();
          if (res.ok && data.success) {
            window.loadAdminContracts();
          } else {
            alert(data.error || 'Silinemedi.');
          }
        } catch (err) {
          alert('Hata: ' + err.message);
        }
      };

      window.loadAdminContracts = async function() {
        const listEl = document.getElementById('adm-contracts-list');
        if (!listEl) return;
        try {
          const res = await fetch('/api/admin/contracts');
          const data = await res.json();
          if (!res.ok || !data.success) {
            listEl.innerHTML = '<div style="color:#fb7185;padding:1rem;">Sözleşmeler alınamadı.</div>';
            return;
          }
          const items = data.contracts || [];
          const totalEl = document.getElementById('adm-contract-stat-total');
          const signedEl = document.getElementById('adm-contract-stat-signed');
          const pendingEl = document.getElementById('adm-contract-stat-pending');

          const signedCount = items.filter(c => c.status === 'SIGNED').length;
          if (totalEl) totalEl.textContent = String(items.length);
          if (signedEl) signedEl.textContent = String(signedCount);
          if (pendingEl) pendingEl.textContent = String(items.length - signedCount);

          if (items.length === 0) {
            listEl.innerHTML = '<div style="color:var(--muted);text-align:center;padding:2rem;">Henüz oluşturulmuş bir sözleşme bulunmuyor. Yukarıdan yeni bir resmi sözleşme oluşturabilirsiniz.</div>';
            return;
          }

          let html = '<table style="width:100%;border-collapse:collapse;font-size:0.86rem;text-align:left;">' +
            '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);color:var(--muted);font-size:0.76rem;text-transform:uppercase;">' +
            '<th style="padding:0.75rem;">Evrak No &amp; Başlık</th>' +
            '<th style="padding:0.75rem;">Taraflar</th>' +
            '<th style="padding:0.75rem;">Durum &amp; İmzacı</th>' +
            '<th style="padding:0.75rem;">E-İmza Önizleme</th>' +
            '<th style="padding:0.75rem;text-align:right;">İşlemler &amp; Paylaş</th>' +
            '</tr></thead><tbody>';

          items.forEach(c => {
            const url = '/sozlesme/' + c._id;
            const isSigned = c.status === 'SIGNED';
            const statusBadge = isSigned
              ? '<span style="display:inline-block;padding:3px 9px;border-radius:999px;background:rgba(52,211,153,0.15);color:#34d399;border:1px solid rgba(52,211,153,0.35);font-weight:700;font-size:0.74rem;">✅ İmzalandı</span>' +
                '<div style="font-size:0.76rem;color:#cbd5e1;margin-top:4px;">👤 ' + (c.signerName || 'İmzacı') + '</div>' +
                '<div style="font-size:0.7rem;color:var(--muted);">🕒 ' + (c.signedAt ? new Date(c.signedAt).toLocaleString('tr-TR') : '') + '</div>'
              : '<span style="display:inline-block;padding:3px 9px;border-radius:999px;background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.35);font-weight:700;font-size:0.74rem;">⏳ İmza Bekliyor</span>';

            const sigImg = (isSigned && c.signatureData)
              ? '<div style="background:#fcfaf2;padding:4px 8px;border-radius:6px;border:1px solid #cbbfa3;display:inline-block;"><img src="' + c.signatureData + '" alt="E-İmza" style="height:36px;max-width:130px;object-fit:contain;display:block;" /></div>'
              : '<span style="color:var(--muted);font-size:0.75rem;">—</span>';

            const safeTitle = String(c.title || '').replace(/'/g, "\\'");

            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">' +
              '<td style="padding:0.85rem 0.75rem;">' +
                '<div style="font-family:monospace;font-size:0.75rem;color:#fbbf24;">' + (c.documentNo || 'EKO-SZL') + '</div>' +
                '<div style="font-weight:700;color:#fff;font-family:\\'Times New Roman\\',serif;font-size:0.96rem;">' + (c.title || 'Resmi Sözleşme') + '</div>' +
                '<div style="font-size:0.72rem;color:var(--muted);">' + (c.createdAt ? new Date(c.createdAt).toLocaleString('tr-TR') : '') + '</div>' +
              '</td>' +
              '<td style="padding:0.85rem 0.75rem;font-size:0.8rem;color:#cbd5e1;">' +
                '<div><strong>1:</strong> ' + (c.partyOneName || 'EkoYıldız') + '</div>' +
                '<div><strong>2:</strong> ' + (c.partyTwoName || c.signerName || 'Muhatap') + '</div>' +
              '</td>' +
              '<td style="padding:0.85rem 0.75rem;">' + statusBadge + '</td>' +
              '<td style="padding:0.85rem 0.75rem;">' + sigImg + '</td>' +
              '<td style="padding:0.85rem 0.75rem;text-align:right;white-space:nowrap;">' +
                '<button type="button" onclick="window.shareContractUrl(\\'' + url + '\\', \\'' + safeTitle + '\\')" style="background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;padding:0.4rem 0.75rem;border-radius:8px;font-weight:700;font-size:0.76rem;cursor:pointer;margin-right:0.35rem;">📤 Başkasına Paylaş</button>' +
                '<a href="' + url + '" target="_blank" style="background:rgba(16,185,129,0.16);border:1px solid rgba(16,185,129,0.35);color:#6ee7b7;padding:0.4rem 0.75rem;border-radius:8px;font-weight:700;font-size:0.76rem;text-decoration:none;margin-right:0.35rem;display:inline-block;">📄 Aç / İmzala ↗</a>' +
                '<button type="button" onclick="window.deleteAdminContract(\\'' + c._id + '\\')" style="background:rgba(244,63,94,0.15);border:1px solid rgba(244,63,94,0.35);color:#fda4af;padding:0.4rem 0.65rem;border-radius:8px;font-weight:700;font-size:0.76rem;cursor:pointer;">🗑️</button>' +
              '</td>' +
            '</tr>';
          });

          html += '</tbody></table>';
          listEl.innerHTML = html;
        } catch (err) {
          listEl.innerHTML = '<div style="color:#fb7185;padding:1rem;">Yükleme hatası: ' + err.message + '</div>';
        }
      };

      // İlk varsayılan şablonu yükle
      setTimeout(() => {
        const contentEl = document.getElementById('contract-content');
        if (contentEl && !contentEl.value) {
          window.applyContractPreset('nda');
        }
        window.loadAdminContracts();
      }, 150);

      document.addEventListener('admin:workspace-activated', (e) => {
        if (e.detail && e.detail.workspace === 'contracts') {
          window.loadAdminContracts();
        }
      });
    })();
  </script>
</section>`;
}

function renderPublicContractPage(contract, currentUser = null) {
  const isSigned = contract.status === 'SIGNED';
  const createdDateStr = contract.createdAt
    ? new Date(contract.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  const signedDateStr = contract.signedAt
    ? new Date(contract.signedAt).toLocaleString('tr-TR')
    : '';
  const defaultSignerName = currentUser
    ? (currentUser.username || currentUser.discordUsername || '')
    : (contract.partyTwoName || '');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(contract.title || 'Resmi Sözleşme')} — EkoYıldız Hukuk &amp; E-İmza</title>
  <style>
    :root {
      --paper-bg: #fcfaf2;
      --paper-ink: #111111;
      --paper-border: #1a1815;
      --seal-red: #7f1d1d;
      --sig-blue: #0f2976;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #0d0f17;
      background-image: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.14), transparent 65%);
      color: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
    }
    /* Üst Araç Çubuğu */
    .contract-topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(13, 15, 23, 0.9);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.85rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #fff;
    }
    .topbar-badge {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff;
      font-weight: 800;
      padding: 0.35rem 0.65rem;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .top-btn {
      appearance: none;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      padding: 0.55rem 1rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.84rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .top-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      transform: translateY(-1px);
    }
    .top-btn-share {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-color: rgba(167, 139, 250, 0.4);
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
    }

    /* Resmi A4 Kağıt Görünümü (Times New Roman) */
    .document-wrapper {
      max-width: 900px;
      margin: 2.2rem auto 4rem;
      padding: 0 1rem;
    }
    .official-paper {
      background: var(--paper-bg);
      color: var(--paper-ink);
      font-family: 'Times New Roman', Times, Georgia, serif;
      border: 6px double var(--paper-border);
      padding: clamp(1.75rem, 5vw, 4rem);
      box-shadow: 0 28px 80px rgba(0, 0, 0, 0.65);
      position: relative;
      overflow: hidden;
    }
    .official-paper::before {
      content: 'EKOYILDIZ RESMİ PROTOKOL';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-32deg);
      font-size: clamp(2.4rem, 6vw, 4.5rem);
      font-weight: 700;
      color: rgba(0, 0, 0, 0.032);
      white-space: nowrap;
      pointer-events: none;
      letter-spacing: 0.15em;
      font-family: 'Times New Roman', Times, serif;
    }

    /* Antet / Başlık */
    .paper-header {
      text-align: center;
      border-bottom: 3px double #111;
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .paper-crest {
      font-size: 1.8rem;
      margin-bottom: 0.3rem;
    }
    .paper-subtitle {
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #222;
      margin-bottom: 0.5rem;
    }
    .paper-title {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: clamp(1.45rem, 3vw, 2rem);
      font-weight: 700;
      text-transform: uppercase;
      color: #000;
      margin: 0.4rem 0 0.75rem;
      line-height: 1.25;
      letter-spacing: 0.02em;
    }
    .paper-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.5rem;
      border: 1px solid #333;
      background: #f5f0e1;
      padding: 0.6rem 0.9rem;
      font-size: 0.88rem;
      text-align: left;
      margin-top: 0.75rem;
    }

    /* Taraflar Kutusu */
    .parties-box {
      border: 1px solid #222;
      background: #f7f3e6;
      padding: 1rem 1.25rem;
      margin-bottom: 1.75rem;
    }
    .parties-box h2 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 1.05rem;
      text-transform: uppercase;
      margin: 0 0 0.6rem 0;
      border-bottom: 1px solid #888;
      padding-bottom: 0.3rem;
      letter-spacing: 0.05em;
    }
    .party-row {
      font-size: 1.02rem;
      line-height: 1.65;
      margin-bottom: 0.35rem;
    }

    /* Sözleşme Metni */
    .contract-body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 1.14rem;
      line-height: 1.85;
      text-align: justify;
      color: #0b0b0b;
      margin-bottom: 2.2rem;
    }
    .contract-clause-title {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 1.16rem;
      font-weight: 700;
      text-transform: uppercase;
      margin: 1.4rem 0 0.45rem;
      color: #000;
      border-bottom: 1px solid rgba(0,0,0,0.18);
      padding-bottom: 0.2rem;
    }
    .contract-p {
      margin: 0 0 0.75rem 0;
      text-indent: 1.5rem;
    }
    .contract-subclause {
      margin: 0 0 0.55rem 1.5rem;
    }
    .contract-spacer {
      height: 0.5rem;
    }

    /* İmza ve Mühür Tutanağı */
    .signature-ledger {
      border-top: 3px double #111;
      padding-top: 1.5rem;
      margin-top: 2rem;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      align-items: stretch;
    }
    .sig-col {
      border: 1px solid #333;
      background: #f8f5ea;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
    }
    .sig-col h4 {
      margin: 0 0 0.4rem 0;
      font-size: 0.98rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #aaa;
      padding-bottom: 0.4rem;
    }
    .official-stamp-box {
      margin: 1rem auto;
      width: 148px;
      height: 148px;
      border: 3px double var(--seal-red);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--seal-red);
      transform: rotate(-8deg);
      padding: 0.5rem;
      background: rgba(127, 29, 29, 0.03);
      user-select: none;
    }
    .official-stamp-box strong {
      font-size: 0.76rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .official-stamp-box span {
      font-size: 0.68rem;
      margin-top: 4px;
    }

    /* Mouse E-İmza Çizim Alanı */
    .esign-interactive-box {
      margin-top: 1.75rem;
      border: 2px solid #1e293b;
      background: #f1ede0;
      padding: 1.5rem;
    }
    .esign-title {
      font-family: 'Times New Roman', Times, serif;
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.4rem 0;
      color: #000;
      text-transform: uppercase;
    }
    .canvas-wrap {
      background: #ffffff;
      border: 2px dashed #334155;
      position: relative;
      margin: 0.75rem 0;
      touch-action: none;
    }
    #esign-canvas {
      width: 100%;
      height: 200px;
      display: block;
      cursor: crosshair;
    }
    .canvas-guideline {
      position: absolute;
      left: 24px;
      right: 24px;
      bottom: 42px;
      border-bottom: 1px dotted #94a3b8;
      pointer-events: none;
      text-align: right;
      font-size: 0.75rem;
      color: #64748b;
      font-style: italic;
    }
    .esign-input {
      width: 100%;
      padding: 0.65rem 0.8rem;
      border: 1px solid #475569;
      background: #fff;
      color: #000;
      font-family: 'Times New Roman', Times, serif;
      font-size: 1rem;
    }
    .ink-btn {
      padding: 0.35rem 0.75rem;
      border: 1px solid #64748b;
      background: #fff;
      cursor: pointer;
      font-family: 'Times New Roman', Times, serif;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .ink-btn.active {
      outline: 2px solid #000;
    }

    @media (max-width: 680px) {
      .signature-grid { grid-template-columns: 1fr; }
    }
    @media print {
      body { background: #fff; }
      .contract-topbar, .no-print { display: none !important; }
      .document-wrapper { margin: 0; max-width: 100%; padding: 0; }
      .official-paper { box-shadow: none; }
    }
  </style>
</head>
<body>
  <header class="contract-topbar no-print">
    <a href="/" class="topbar-brand">
      <span class="topbar-badge">E★ HUKUK</span>
      <div>
        <strong style="font-size:0.95rem;display:block;">EkoYıldız Resmi Sözleşme &amp; E-İmza Sistemi</strong>
        <span style="font-size:0.75rem;color:#94a3b8;">Evrak No: ${esc(contract.documentNo || 'EKO-SZL')}</span>
      </div>
    </a>
    <div class="topbar-actions">
      <button type="button" class="top-btn top-btn-share" onclick="shareThisContract()">
        <span>📤</span> <span>Başkasına Paylaş</span>
      </button>
      <button type="button" class="top-btn" onclick="copyContractUrl()">
        <span>🔗</span> <span id="copy-btn-label">Linki Kopyala</span>
      </button>
      <button type="button" class="top-btn" onclick="window.print()">
        <span>🖨️</span> <span>Yazdır / PDF Kaydet</span>
      </button>
    </div>
  </header>

  <main class="document-wrapper">
    <article class="official-paper">
      <header class="paper-header">
        <div class="paper-crest">⚖️</div>
        <div class="paper-subtitle">${esc(contract.headerSubtitle || 'T.C. İSTANBUL • EKOYILDIZ & SENTARA YÜKSEK HUKUK VE DENETİM DAİRESİ BAŞKANLIĞI')}</div>
        <h1 class="paper-title">${esc(contract.title || 'RESMİ HİZMET VE GİZLİLİK SÖZLEŞMESİ')}</h1>
        <div class="paper-meta-grid">
          <div><strong>EVRAK KAYIT NO:</strong> ${esc(contract.documentNo || 'EKO-2026/SZL')}</div>
          <div><strong>TANZİM TARİHİ:</strong> ${esc(createdDateStr)}</div>
          <div><strong>BELGE STATÜSÜ:</strong> ${isSigned ? '✅ E-İMZALI RESMİ NÜSHA' : '⏳ İMZA BEKLEYEN RESMİ NÜSHA'}</div>
        </div>
      </header>

      <section class="parties-box">
        <h2>I. TARAFLAR VE KİMLİK BİLGİLERİ</h2>
        <div class="party-row">
          <strong>1. TARAF (KURUM / DÜZENLEYEN MAKAM):</strong> ${esc(contract.partyOneName || 'EkoYıldız & Sentara Yönetimi')}
        </div>
        <div class="party-row">
          <strong>2. TARAF (MUHATAP / İMZA BEYAN EDEN):</strong>
          <span id="doc-party-two-display">${esc(contract.signerName || contract.partyTwoName || 'Aşağıda Elektronik İmzası Bulunan Muhatap')}</span>
        </div>
      </section>

      <section class="contract-body">
        ${formatContractBodyHtml(contract.content)}
      </section>

      <section class="signature-ledger">
        <div class="signature-grid">
          <!-- 1. Taraf Mühür -->
          <div class="sig-col">
            <h4>1. TARAF — KURUM ONAYI VE RESMİ MÜHÜR</h4>
            <div style="font-size:0.92rem;margin-top:0.25rem;">
              <strong>${esc(contract.partyOneName || 'EkoYıldız & Sentara Yönetimi')}</strong>
            </div>
            <div class="official-stamp-box">
              <strong>T.C. EKOYILDIZ<br/>HUKUK DAİRESİ</strong>
              <span>★ RESMİ MÜHÜR ★</span>
              <span style="font-family:monospace;font-size:0.62rem;">ONAYLI BELGE</span>
            </div>
            <div style="font-size:0.8rem;color:#333;">
              Dijital Kurum Tasdiki: <strong>GEÇERLİ</strong><br/>
              Tarih: ${esc(createdDateStr)}
            </div>
          </div>

          <!-- 2. Taraf E-İmza -->
          <div class="sig-col">
            <h4>2. TARAF — MUHATAP ELEKTRONİK İMZASI</h4>
            <div style="font-size:0.92rem;margin-top:0.25rem;">
              <strong id="sig-box-signer-name">${esc(contract.signerName || contract.partyTwoName || 'İmza Bekleniyor')}</strong>
              ${contract.signerTitle ? `<div style="font-size:0.82rem;color:#444;">(${esc(contract.signerTitle)})</div>` : ''}
            </div>

            <div id="sig-box-image-container" style="min-height:140px;display:flex;align-items:center;justify-content:center;margin:0.75rem 0;border:1px dashed #666;background:#fff;padding:0.5rem;">
              ${isSigned && contract.signatureData
                ? `<img src="${contract.signatureData}" alt="Elektronik İmza" style="max-height:125px;max-width:100%;object-fit:contain;" />`
                : `<span style="color:#666;font-style:italic;font-size:0.9rem;">Henüz imzalanmadı. Aşağıdaki imza pedini kullanarak fare (mouse) ile imzalayınız.</span>`
              }
            </div>

            <div id="sig-box-meta" style="font-size:0.78rem;color:#222;line-height:1.45;">
              ${isSigned
                ? `<div><strong>Durum:</strong> ✅ Elektronik İmza ile İmzalandı</div>
                   <div><strong>İmza Tarihi:</strong> ${esc(signedDateStr)}</div>
                   <div style="font-family:monospace;font-size:0.68rem;margin-top:3px;word-break:break-all;"><strong>SHA-256:</strong> ${esc(contract.signatureHash || '')}</div>`
                : `<div>6100 Sayılı HMK m.193 Kapsamında Elektronik Delil Belgesi</div>`
              }
            </div>
          </div>
        </div>

        <!-- İnteraktif Mouse E-İmza Alanı -->
        ${!isSigned ? `
        <div class="esign-interactive-box no-print" id="esign-form-section">
          <h3 class="esign-title">✍️ ELEKTRONİK İMZA (MOUSE İLE ISLAK İMZA) PANELİ</h3>
          <p style="margin:0 0 1rem 0;font-size:0.95rem;color:#222;">
            Lütfen adınızı/kullanıcı adınızı giriniz ve beyaz imza kutusunun içerisine <strong>farenizle (mouse)</strong> veya dokunmatik ekranla imzanızı atınız.
          </p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.85rem;margin-bottom:0.85rem;">
            <div>
              <label style="display:block;font-weight:700;font-size:0.9rem;margin-bottom:0.25rem;">Ad Soyad / Kullanıcı Adı *</label>
              <input type="text" id="signer-name-input" class="esign-input" value="${esc(defaultSignerName)}" placeholder="Örn: Ahmet Yılmaz / @kullaniciadi" required />
            </div>
            <div>
              <label style="display:block;font-weight:700;font-size:0.9rem;margin-bottom:0.25rem;">Unvan / Görev / Discord ID (İsteğe Bağlı)</label>
              <input type="text" id="signer-title-input" class="esign-input" value="${esc(currentUser?.discordId || '')}" placeholder="Örn: Kıdemli Moderatör / İş Ortağı" />
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.4rem;">
            <div style="display:flex;align-items:center;gap:0.4rem;">
              <span style="font-size:0.85rem;font-weight:700;">Kalem Rengi:</span>
              <button type="button" class="ink-btn active" onclick="setInkColor('#0f2976', this)" style="color:#0f2976;">✒️ Resmi Mavi</button>
              <button type="button" class="ink-btn" onclick="setInkColor('#111111', this)" style="color:#111111;">✒️ Siyah Mürekkep</button>
              <button type="button" class="ink-btn" onclick="setInkColor('#7f1d1d', this)" style="color:#7f1d1d;">✒️ Kırmızı Mühür</button>
            </div>
            <button type="button" onclick="clearSignaturePad()" style="background:#fff;border:1px solid #b91c1c;color:#b91c1c;padding:0.35rem 0.85rem;cursor:pointer;font-family:'Times New Roman',serif;font-weight:700;font-size:0.85rem;">
              🧹 İmzayı Temizle
            </button>
          </div>

          <div class="canvas-wrap">
            <canvas id="esign-canvas" width="760" height="200"></canvas>
            <div class="canvas-guideline">Mouse (Fare) ile bu çizgi üzerine imzanızı atınız</div>
          </div>

          <label style="display:flex;align-items:flex-start;gap:0.6rem;margin:0.9rem 0;font-size:0.95rem;cursor:pointer;line-height:1.45;">
            <input type="checkbox" id="esign-consent-chk" style="margin-top:4px;width:18px;height:18px;" />
            <span>İşbu resmi sözleşmenin tüm maddelerini okudum, anladım ve yukarıdaki kutuya fare (mouse) ile çizdiğim elektronik imzamın 6100 sayılı HMK Madde 193 uyarınca geçerli ve bağlayıcı olduğunu kabul ediyorum.</span>
          </label>

          <button type="button" id="btn-submit-esign" onclick="submitElectronicSignature()" style="width:100%;padding:0.95rem 1.25rem;background:#0f2976;color:#fff;border:2px solid #000;font-family:'Times New Roman',Times,serif;font-size:1.1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;">
            ✍️ SÖZLEŞMEYİ E-İMZA İLE İMZALA VE RESMİ OLARAK ONAYLA
          </button>
          <div id="esign-feedback" style="display:none;margin-top:0.75rem;padding:0.75rem;font-weight:700;text-align:center;"></div>
        </div>
        ` : `
        <div class="no-print" style="margin-top:1.5rem;padding:1rem;background:#ecfdf5;border:2px solid #059669;color:#065f46;text-align:center;font-size:1rem;">
          <strong>✅ İŞBU SÖZLEŞME ELEKTRONİK İMZA İLE RESMİ OLARAK İMZALANMIŞTIR.</strong>
          <div style="font-size:0.88rem;margin-top:0.25rem;">Yukarıdaki "Başkasına Paylaş" veya "Yazdır / PDF Kaydet" butonlarını kullanarak imzalı nüshayı paylaşabilirsiniz.</div>
        </div>
        `}
      </section>
    </article>
  </main>

  <script>
    function copyContractUrl() {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        const lbl = document.getElementById('copy-btn-label');
        if (lbl) {
          lbl.textContent = 'Kopyalandı!';
          setTimeout(() => { lbl.textContent = 'Linki Kopyala'; }, 2200);
        }
      }).catch(() => {
        prompt('Sözleşme Linkini Kopyalayın:', url);
      });
    }

    function shareThisContract() {
      const url = window.location.href;
      const title = ${JSON.stringify(contract.title || 'EkoYıldız Resmi Sözleşme')};
      if (navigator.share) {
        navigator.share({
          title: title,
          text: '📜 EkoYıldız Resmi Sözleşmesi — İncelemek ve E-İmza ile imzalamak için tıklayın:',
          url: url
        }).catch(() => {});
      } else {
        copyContractUrl();
        alert('🔗 Sözleşme paylaşım bağlantısı panoya kopyalandı! İstediğiniz kişiye gönderebilirsiniz:\\n\\n' + url);
      }
    }

    // ── Mouse ve Dokunmatik E-İmza Canvas Motoru ─────────────────────────────
    (function() {
      const canvas = document.getElementById('esign-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let drawing = false;
      let hasDrawn = false;
      let inkColor = '#0f2976';
      let lastPoint = null;

      function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 2.6;
      }

      resizeCanvas();

      function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
          return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
          };
        }
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }

      function startDraw(e) {
        e.preventDefault();
        drawing = true;
        hasDrawn = true;
        lastPoint = getCoords(e);
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = inkColor;
        ctx.fill();
      }

      function moveDraw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pt = getCoords(e);
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        const midX = (lastPoint.x + pt.x) / 2;
        const midY = (lastPoint.y + pt.y) / 2;
        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        lastPoint = pt;
      }

      function endDraw(e) {
        if (!drawing) return;
        e.preventDefault();
        drawing = false;
        lastPoint = null;
      }

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', moveDraw);
      window.addEventListener('mouseup', endDraw);

      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', moveDraw, { passive: false });
      window.addEventListener('touchend', endDraw);

      window.setInkColor = function(color, btn) {
        inkColor = color;
        document.querySelectorAll('.ink-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
      };

      window.clearSignaturePad = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn = false;
      };

      window.submitElectronicSignature = async function() {
        const signerName = document.getElementById('signer-name-input')?.value.trim();
        const signerTitle = document.getElementById('signer-title-input')?.value.trim();
        const consent = document.getElementById('esign-consent-chk')?.checked;
        const feedback = document.getElementById('esign-feedback');
        const btn = document.getElementById('btn-submit-esign');

        if (!signerName) {
          alert('Lütfen Ad Soyad veya Kullanıcı Adınızı yazınız.');
          return;
        }
        if (!hasDrawn) {
          alert('Lütfen imza kutusunun içerisine farenizle (mouse) imzanızı çiziniz.');
          return;
        }
        if (!consent) {
          alert('Lütfen sözleşmeyi okuduğunuzu ve elektronik imzayı onayladığınızı belirten kutucuğu işaretleyiniz.');
          return;
        }

        const signatureData = canvas.toDataURL('image/png');
        btn.disabled = true;
        btn.textContent = '⏳ Elektronik İmza Tescil Ediliyor...';

        try {
          const res = await fetch('/api/contracts/${esc(contract._id)}/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              signerName,
              signerTitle,
              signatureData
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            if (feedback) {
              feedback.style.display = 'block';
              feedback.style.background = '#dcfce7';
              feedback.style.color = '#166534';
              feedback.textContent = '✅ Sözleşme elektronik imzanızla başarıyla imzalandı! Sayfa güncelleniyor...';
            }
            setTimeout(() => window.location.reload(), 900);
          } else {
            alert(data.error || 'İmza kaydedilemedi.');
            btn.disabled = false;
            btn.textContent = '✍️ SÖZLEŞMEYİ E-İMZA İLE İMZALA VE RESMİ OLARAK ONAYLA';
          }
        } catch (err) {
          alert('Bağlantı hatası: ' + err.message);
          btn.disabled = false;
          btn.textContent = '✍️ SÖZLEŞMEYİ E-İMZA İLE İMZALA VE RESMİ OLARAK ONAYLA';
        }
      };
    })();
  </script>
</body>
</html>`;
}

module.exports = {
  renderAdminContractsWorkspace,
  renderPublicContractPage,
  formatContractBodyHtml,
};
