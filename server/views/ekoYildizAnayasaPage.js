'use strict';

function renderEkoYildizAnayasaPage(user) {
  const content = `
    <style>
      .anayasa-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem 1rem 4rem;
        color: var(--text, #f0f0f8);
        font-family: 'Outfit', sans-serif;
      }

      /* Hero Header */
      .hero-card {
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.12) 0%, rgba(129, 140, 248, 0.05) 100%);
        border: 1px solid rgba(167, 139, 250, 0.25);
        border-radius: 20px;
        padding: 2.5rem 2rem;
        margin-bottom: 2rem;
        position: relative;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
      .hero-card::before {
        content: '';
        position: absolute;
        top: -60px;
        right: -60px;
        width: 180px;
        height: 180px;
        background: radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
      }
      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(167, 139, 250, 0.2);
        color: #c4b5fd;
        border: 1px solid rgba(167, 139, 250, 0.35);
        padding: 4px 14px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 1rem;
      }
      .hero-title {
        font-size: 2.3rem;
        font-weight: 800;
        margin: 0 0 0.75rem 0;
        background: linear-gradient(135deg, #ffffff 30%, #c4b5fd 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .hero-subtitle {
        font-size: 1.05rem;
        color: var(--muted, #94a3b8);
        max-width: 800px;
        line-height: 1.6;
        margin: 0 0 1.5rem 0;
      }
      .hero-meta-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .meta-chip {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 6px 14px;
        border-radius: 10px;
        font-size: 0.85rem;
        color: #e2e8f0;
      }
      .meta-chip strong {
        color: #a78bfa;
      }

      /* Sticky Controls: Search & Jump Bar */
      .controls-bar {
        position: sticky;
        top: 70px;
        z-index: 30;
        background: rgba(6, 6, 14, 0.85);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 0.85rem 1.25rem;
        margin-bottom: 2rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      }
      .search-box {
        position: relative;
        flex: 1;
        min-width: 260px;
      }
      .search-box input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        padding: 9px 14px 9px 38px;
        color: #fff;
        font-family: inherit;
        font-size: 0.92rem;
        transition: all 0.2s ease;
      }
      .search-box input:focus {
        outline: none;
        border-color: #a78bfa;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.2);
      }
      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        font-size: 1rem;
        pointer-events: none;
      }
      .nav-select-wrapper {
        min-width: 240px;
      }
      .nav-select-wrapper select {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        padding: 9px 14px;
        color: #e2e8f0;
        font-family: inherit;
        font-size: 0.9rem;
        cursor: pointer;
      }
      .nav-select-wrapper select:focus {
        outline: none;
        border-color: #a78bfa;
      }

      /* Quick Jump Pills */
      .pills-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 2rem;
      }
      .pill-link {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.82rem;
        color: #cbd5e1;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .pill-link:hover {
        background: rgba(167, 139, 250, 0.15);
        border-color: rgba(167, 139, 250, 0.35);
        color: #fff;
        transform: translateY(-1px);
      }

      /* Section & Article Styling */
      .doc-section {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        scroll-margin-top: 150px;
        transition: border-color 0.2s ease;
      }
      .doc-section:hover {
        border-color: rgba(167, 139, 250, 0.2);
      }
      .section-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 1rem;
        margin-bottom: 1.5rem;
      }
      .section-tag {
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #a78bfa;
        letter-spacing: 0.06em;
        margin-bottom: 4px;
      }
      .section-title {
        font-size: 1.45rem;
        font-weight: 700;
        margin: 0;
        color: #fff;
      }

      .article-card {
        background: rgba(255, 255, 255, 0.025);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 1.25rem 1.5rem;
        margin-bottom: 1.25rem;
        scroll-margin-top: 150px;
        transition: all 0.2s ease;
      }
      .article-card:last-child {
        margin-bottom: 0;
      }
      .article-card:hover {
        background: rgba(255, 255, 255, 0.035);
        border-color: rgba(167, 139, 250, 0.25);
      }
      .article-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 0.75rem;
      }
      .article-num {
        font-size: 1.08rem;
        font-weight: 700;
        color: #c4b5fd;
      }
      .copy-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #94a3b8;
        font-size: 0.75rem;
        padding: 3px 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .copy-btn:hover {
        background: rgba(167, 139, 250, 0.2);
        border-color: #a78bfa;
        color: #fff;
      }
      .article-body {
        font-size: 0.95rem;
        line-height: 1.7;
        color: #cbd5e1;
      }
      .article-body p {
        margin: 0 0 0.75rem 0;
      }
      .article-body p:last-child {
        margin-bottom: 0;
      }
      .article-body ul {
        margin: 0.5rem 0 0.75rem 1.25rem;
        padding: 0;
      }
      .article-body li {
        margin-bottom: 0.4rem;
      }
      .article-body strong {
        color: #f1f5f9;
      }

      /* Alert Card / Red Lines */
      .card-alert {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.02) 100%);
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      .card-alert .article-num {
        color: #fca5a5;
      }
      .card-warning {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.02) 100%);
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
      .card-warning .article-num {
        color: #fcd34d;
      }

      /* Responsive Table for Ceza Cetveli */
      .table-wrapper {
        overflow-x: auto;
        margin-top: 1rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .ceza-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 0.9rem;
      }
      .ceza-table th {
        background: rgba(167, 139, 250, 0.12);
        color: #c4b5fd;
        padding: 12px 16px;
        font-weight: 700;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        white-space: nowrap;
      }
      .ceza-table td {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: #cbd5e1;
      }
      .ceza-table tr:last-child td {
        border-bottom: none;
      }
      .ceza-table tr:hover td {
        background: rgba(255, 255, 255, 0.02);
      }
      .badge-permban {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.4);
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
      }
      .badge-tempban {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.4);
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
      }
      .badge-mute {
        background: rgba(99, 102, 241, 0.2);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.4);
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
      }

      /* Signature Footer Card */
      .signature-card {
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(6, 6, 14, 0.8) 100%);
        border: 1px solid rgba(167, 139, 250, 0.25);
        border-radius: 16px;
        padding: 2rem;
        margin-top: 3rem;
        text-align: center;
      }
      .signature-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 0.5rem;
      }
      .signature-sub {
        color: #94a3b8;
        font-size: 0.92rem;
        margin-bottom: 1.5rem;
      }
      .signature-seal {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        padding: 1.25rem 2rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px dashed rgba(167, 139, 250, 0.4);
        border-radius: 14px;
      }
      .seal-name {
        font-size: 1.15rem;
        font-weight: 800;
        color: #a78bfa;
        letter-spacing: 0.05em;
      }
      .seal-role {
        font-size: 0.85rem;
        color: #cbd5e1;
        margin-top: 2px;
      }
      .seal-motto {
        font-size: 0.8rem;
        color: #94a3b8;
        font-style: italic;
        margin-top: 8px;
      }

      /* Highlight when searched */
      .highlight-match {
        background: rgba(234, 179, 8, 0.35);
        color: #fff;
        padding: 0 2px;
        border-radius: 3px;
      }
      .hidden-card {
        display: none !important;
      }
    </style>

    <div class="anayasa-page">
      <!-- HERO BANNER -->
      <div class="hero-card">
        <div class="hero-badge">📜 RESMİ TOPLULUK MEVZUATI</div>
        <h1 class="hero-title">EkoYıldız Discord Topluluğu Anayasası</h1>
        <p class="hero-subtitle">
          İşbu doküman, EkoYıldız Topluluğu içerisindeki düzeni, iç barışı, etik standartları ve işleyiş hiyerarşisini
          belirleyen en üst düzey dijital mevzuat ve normlar hiyerarşisidir.
        </p>
        <div class="hero-meta-chips">
          <div class="meta-chip">🏛️ <strong>10</strong> Ana Bölüm</div>
          <div class="meta-chip">⚖️ <strong>44</strong> Madde</div>
          <div class="meta-chip">👑 Kurucu: <strong>@ekonqt</strong></div>
          <div class="meta-chip">📅 Yürürlük: <strong>Tam Yetkiyle Aktif</strong></div>
        </div>
      </div>

      <!-- STICKY CONTROLS (SEARCH & CHAPTER JUMP) -->
      <div class="controls-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="anayasa-search" placeholder="Madde, anahtar kelime veya ceza ara (örn: Doxxing, Madde 20, Reklam)..." onkeyup="filterArticles()">
        </div>
        <div class="nav-select-wrapper">
          <select id="chapter-select" onchange="jumpToSection(this.value)">
            <option value="">⚡ Hızlı Bölüm Seçimi...</option>
            <option value="#on-bilgilendirme">📌 Ön Bilgilendirme & Önemli Notlar</option>
            <option value="#bilgilendirme-1">📖 Bilgilendirme I & II (Tanımlar ve Hukuk)</option>
            <option value="#bolum-1">🏛️ Bölüm 1: Genel Hükümler ve Vizyon (Madde 1-5)</option>
            <option value="#bolum-2">👑 Bölüm 2: Yönetim Yapısı ve Hiyerarşi (Madde 6-10)</option>
            <option value="#bolum-3">👥 Bölüm 3: Üyelik Hakları ve Roller (Madde 11-15)</option>
            <option value="#bolum-4">💬 Bölüm 4: Genel Düzen ve İletişim (Madde 16-19)</option>
            <option value="#bolum-5">🛡️ Bölüm 5: Güvenlik, KVKK ve Yasaklar (Madde 20-24)</option>
            <option value="#bolum-6">⚖️ Bölüm 6: Disiplin ve Ceza Cetveli (Madde 25-28)</option>
            <option value="#bolum-7">🎨 Bölüm 7: Etkinlikler ve Ortak Projeler (Madde 29-32)</option>
            <option value="#bolum-8">🤝 Bölüm 8: Partnerlik ve Dış İlişkiler (Madde 33-36)</option>
            <option value="#bolum-9">🗳️ Bölüm 9: Değişiklik ve Komisyon (Madde 37-41)</option>
            <option value="#bolum-10">📜 Bölüm 10: Yürürlük ve İmzalar (Madde 42-44)</option>
          </select>
        </div>
      </div>

      <!-- QUICK PILLS -->
      <div class="pills-bar">
        <a href="#on-bilgilendirme" class="pill-link">📌 Ön Bilgilendirme</a>
        <a href="#bolum-1" class="pill-link">Bölüm 1: İlkeler</a>
        <a href="#bolum-2" class="pill-link">Bölüm 2: Yönetim</a>
        <a href="#bolum-3" class="pill-link">Bölüm 3: Haklar</a>
        <a href="#bolum-4" class="pill-link">Bölüm 4: Chat/Ses</a>
        <a href="#bolum-5" class="pill-link">Bölüm 5: Güvenlik</a>
        <a href="#ceza-cetveli" class="pill-link" style="border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">⚖️ Ceza Cetveli</a>
        <a href="#madde-40" class="pill-link" style="border-color: rgba(245, 158, 11, 0.4); color: #fcd34d;">🚨 Kırmızı Çizgiler</a>
        <a href="#imzalar" class="pill-link">✍️ İmzalar</a>
      </div>

      <!-- ÖN BİLGİLENDİRME & ÖNEMLİ NOTLAR -->
      <section id="on-bilgilendirme" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BAŞLANGIÇ ESASLARI</div>
          <h2 class="section-title">📌 Önemli Notlar & Ön Bilgilendirme</h2>
        </div>

        <div class="article-card card-warning">
          <div class="article-title-row">
            <div class="article-num">Önemli Notlar</div>
            <button class="copy-btn" onclick="copyAnchor('on-bilgilendirme')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <ul>
              <li>Şu anda <strong>@ekonqt</strong> tarafından kurulan EkoYıldız Discord Topluluğu Anayasası Kitapçığını okuyorsunuz.</li>
              <li>Bu kural kitapçığı oyun ve sunucu genelinde yaşanabilecek yanlış anlaşılmalara açıklık getirmek için tanzim edilmiştir.</li>
              <li>Bu kurallar sunucularımızda yer alan ve oynayan tüm üyelerin uymaları gereken bağlayıcı bir rehber niteliğindedir.</li>
              <li>Lütfen daha huzurlu ve keyifli bir deneyim için kuralları dikkatle inceleyiniz.</li>
            </ul>
          </div>
        </div>

        <div class="article-card">
          <div class="article-title-row">
            <div class="article-num">Ön Bilgilendirme İlkeleri</div>
          </div>
          <div class="article-body">
            <p><strong>Yasak İtirazları Hakkında:</strong> Eğer haksız yere yasaklandığınızı düşünüyorsanız, lütfen Discord sunucumuz üzerinden destek bileti (ticket) açarak yasak kaldırma talebinde bulununuz. İtirazlarınız yetkili ekip tarafından titizlikle değerlendirilecektir.</p>
            <p><strong>Dil Politikası:</strong> EkoYıldız Topluluğu, sadece Türkçe dilinin kullanılmasına izin verilen resmi bir Türk topluluğudur. Sunucumuzda başka dillerin kullanımı kesinlikle yasaktır (özel misafirler istisnadır).</p>
            <p><strong>Kurallara Uymak Zorunluluğu:</strong> Tüm oyuncular ve üyeler, sunucudaki kural ve düzenlemelere eksiksiz uymakla yükümlüdür. Kurallara riayet edilmemesi durumunda gerekli yaptırımlar tereddütsüz uygulanacaktır.</p>
            <p><strong>Yetkili Personel Talimatları:</strong> Sunucu ve oyun içi yetkili personelin uyarı ve yönlendirmelerine uyulması zorunludur. Yetkiliye karşı direniş, alaycı tavırlar veya talimatları görmezden gelmek yasaklanma cezası ile sonuçlanabilir.</p>
          </div>
        </div>
      </section>

      <!-- BİLGİLENDİRME I & II -->
      <section id="bilgilendirme-1" class="doc-section">
        <div class="section-header">
          <div class="section-tag">HUKUKİ ÇERÇEVE & METODOLOJİ</div>
          <h2 class="section-title">📖 Bilgilendirme I & II: Hukuki Bağlam ve Tanımlar</h2>
        </div>

        <div class="article-card">
          <div class="article-title-row">
            <div class="article-num">Bilgilendirme I: Metnin Niteliği ve Misyonu</div>
          </div>
          <div class="article-body">
            <p><strong>1. Metnin Niteliği ve Hukuki Bağlamı:</strong> İşbu doküman, EkoYıldız Discord Sunucusu ("Topluluk") içerisindeki düzeni, iç barışı, etik standartları ve işleyiş hiyerarşisini belirleyen en üst düzey dijital mevzuattır. Metin içerisinde geçen "Anayasa" ifadesi, topluluğun iç bağlayıcı kurallar bütününü ve normlar hiyerarşisinin en üst basamağını temsil eden kavramsal bir tanımlamadır.</p>
            <p><strong>2. Varoluş Amacı ve Misyon:</strong> EkoYıldız; dijital evrende bilginin, sürdürülebilirliğin, yapıcı tartışma kültürünün ve kolektif üretimin ön planda tutulduğu güvenli bir sosyal alan yaratmak amacıyla kurulmuştur. Bu Anayasa'nın temel gayesi; bireysel özgürlükler ile toplumsal düzen arasındaki dengeyi sağlamak, üyelerin haklarını güvence altına almak ve olası anlaşmazlıklarda objektif bir adalet mekanizması sunmaktır.</p>
            <p><strong>3. Bağlayıcılık ve Otomatik Kabul Senaryosu:</strong> Sunucuya giriş yapan, doğrulama adımlarını tamamlayan veya sunucudaki kanalları kullanmaya devam eden her kullanıcı, bu Anayasa'nın tamamını <strong>Okuduğunu, Anladığını ve Üstlendiğini</strong> kabul etmiş sayılır. Anayasa metnine erişim sağlamamak veya kuralları bilmediğini beyan etmek, kural ihlallerinde sorumluluğu ortadan kaldırmaz.</p>
          </div>
        </div>

        <div class="article-card">
          <div class="article-title-row">
            <div class="article-num">Bilgilendirme II: Tanımlar, Kavramlar ve Yürürlük</div>
          </div>
          <div class="article-body">
            <p><strong>1. Temel Terimler Sözlüğü:</strong></p>
            <ul>
              <li><strong>Topluluk / Sunucu:</strong> EkoYıldız isimli Discord sunucusunu, resmi alt sunucuları ve doğrudan bağlantılı dijital mecraları,</li>
              <li><strong>Yönetim (Yönetim Kurulu / Moderasyon):</strong> Sunucu içi düzeni sağlamak, denetlemek ve yaptırım uygulamakla yetkilendirilmiş yetkili kadroyu,</li>
              <li><strong>Üye:</strong> Sunucuda bulunan, herhangi bir yetkisi olsun veya olmasın tüm gerçek kişileri,</li>
              <li><strong>Yaptırım:</strong> Kural ihlali durumunda uygulanan uyarılma, susturulma (mute), geçici uzaklaştırılma (temp-ban) veya kalıcı ihraç (perm-ban) işlemlerini,</li>
              <li><strong>İçerik:</strong> Üyeler tarafından yazılı, görsel, işitsel veya bağlantı (link) şeklinde paylaşılan tüm veri ve materyalleri ifade eder.</li>
            </ul>
            <p><strong>2. Yürürlük ve Değişiklik Usulü:</strong></p>
            <ul>
              <li><strong>Yürürlük Tarihi:</strong> İşbu Anayasa, sunucunun resmi duyuru kanalında yayımlandığı andan itibaren tüm hükümleriyle birlikte derhal yürürlüğe girer.</li>
              <li><strong>Revizyon Yetkisi:</strong> Anayasa maddelerinde değişiklik yapma, yeni madde ekleme veya mevcut maddeleri ilga etme yetkisi yalnızca Sunucu Kurucuları ve Kurucular tarafından yetkilendirilmiş Anayasa Komisyonu'na aittir.</li>
              <li><strong>Geriye Yürümeme İlkesi:</strong> Anayasada yapılan değişiklikler ilan edildiği andan itibaren geçerlilik kazanır; geçmişte yapılmış ve o dönemin kurallarına uygun olan eylemlere geriye dönük yaptırım uygulanamaz.</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 1 -->
      <section id="bolum-1" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 1</div>
          <h2 class="section-title">🏛️ Genel Hükümler, Topluluk Vizyonu ve Temel İlkeler</h2>
        </div>

        <div class="article-card" id="madde-1">
          <div class="article-title-row">
            <div class="article-num">Madde 1: Tanımlamalar ve Kapsam</div>
            <button class="copy-btn" onclick="copyAnchor('madde-1')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Ekoyıldız Sunucusu:</strong> İşbu Anayasa metninde "Topluluk" veya "Sunucu" olarak anılacak olan yapı, Ekoyıldız Discord dijital platformu içerisinde faaliyet gösteren tüm sesli, yazılı ve görsel paylaşım kanallarının bütününü ifade eder.</p>
            <p><strong>Kapsam:</strong> Bu Anayasa; sunucu kurucularını, yönetim ekibini, moderatörleri, bot yöneticilerini, tüm üyeleri ve geçici/misafir statüsündeki tüm kullanıcıları kapsar. Sunucuya katılan her birey, bu Anayasa hükümlerini eksiksiz kabul etmiş sayılır.</p>
            <p><strong>Mecra Sınırları:</strong> İşbu Anayasa hükümleri yalnızca resmi Discord sunucusu içerisinde değil; topluluğa bağlı resmi sosyal medya hesaplarında, yan sunucularda ve Ekoyıldız adı altında düzenlenen tüm çevrimiçi/çevrimdışı etkinliklerde de geçerlidir.</p>
          </div>
        </div>

        <div class="article-card" id="madde-2">
          <div class="article-title-row">
            <div class="article-num">Madde 2: Topluluğun Amacı ve Vizyonu (Kırmızı Çizgi)</div>
            <button class="copy-btn" onclick="copyAnchor('madde-2')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Ahlaki ve Bilimsel Çerçeve:</strong> Ekoyıldız Topluluğu; Youtube kanalını yönetmek, üretkenlik ve topluluk ruhunu pekiştirmek amacıyla kurulmuştur.</p>
            <p><strong>Gelişim Alanı:</strong> Topluluk; üyelerinin bilgi birikimini artırmayı, fikir alışverişinde bulunabileceği güvenli ve yapıcı bir ortam yaratmayı, ortak projeler üretmesini ve yeteneklerini geliştirmesini hedefler.</p>
            <p><strong>Siyasetsizlik ve Bağımsızlık:</strong> Ekoyıldız Topluluğu hiçbir siyasi partiye, ticari örgüte veya dini yapılanmaya bağlı değildir. Topluluk içi etkileşimlerde herhangi bir ideolojinin veya ticari çıkarın propagandası yapılamaz.</p>
          </div>
        </div>

        <div class="article-card" id="madde-3">
          <div class="article-title-row">
            <div class="article-num">Madde 3: Anayasanın Bağlayıcılığı ve Üstünlüğü</div>
            <button class="copy-btn" onclick="copyAnchor('madde-3')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Normlar Hiyerarşisi:</strong> Ekoyıldız Anayasası, sunucu içerisindeki tüm alt kuralların, kanal açıklamalarının, moderasyon talimatlarının ve sözlü beyanların üstündedir. Anayasaya aykırı hiçbir lokal kural koyulamaz.</p>
            <p><strong>Geriye Yürümeme İlkesi:</strong> Anayasada veya sunucu kurallarında yapılan güncellemeler, yürürlüğe girdiği tarihten itibaren geçerlidir. Kural değişikliğinden önce gerçekleşen eylemler, yeni kurala göre geriye dönük olarak cezalandırılamaz.</p>
            <p><strong>Bilgilendirme Yükümlülüğü:</strong> Anayasa değişiklikleri sunucunun duyuru kanalından en az 24 saat önce tüm üyelere ilan edilir. Üyelerin "kuralları okumadım" veya "görmedim" savunması geçerli sayılmaz.</p>
          </div>
        </div>

        <div class="article-card card-alert" id="madde-4">
          <div class="article-title-row">
            <div class="article-num">Madde 4: Temel İnsan Hakları, Saygı ve Ayrımcılık Yasağı (Dokunulmaz Hüküm)</div>
            <button class="copy-btn" onclick="copyAnchor('madde-4')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Mutlak Ayrımcılık Yasağı:</strong> Sunucu içerisinde hiç kimse dili, ırkı, rengi, cinsiyeti, cinsel yönelimi, dini, mezhebi, felsefi inancı, etnik kökeni, fiziksel durumu veya sosyo-ekonomik statüsü nedeniyle ayrımcılığa tabi tutulamaz, aşağılanamaz veya hedef gösterilemez.</p>
            <p><strong>İnsan Onurunun Korunması:</strong> Topluluk üyelerinin kişisel haklarına, özel hayatın gizliliğine ve şahsiyetine yönelik her türlü nefret söylemi, zorbalık (cyberbullying), taciz, ifşa (doxxing) ve tehdit <strong>mutlak ve süresiz ihraç (permanent ban)</strong> sebebidir.</p>
            <p><strong>Düşünce ve İfade Özgürlüğünün Sınırları:</strong> Her üye yapıcı olmak kaydıyla düşüncelerini ifade etme hakkına sahiptir. Ancak ifade özgürlüğü; başkalarının haklarını ihlal etme, küfür, hakaret, nefret söylemi yayma veya sunucu huzurunu bozma hakkını vermez.</p>
          </div>
        </div>

        <div class="article-card" id="madde-5">
          <div class="article-title-row">
            <div class="article-num">Madde 5: Topluluk Kimliği ve Ekoyıldız Felsefesi</div>
            <button class="copy-btn" onclick="copyAnchor('madde-5')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Kolektif Sorumluluk:</strong> Ekoyıldız'ın her üyesi, sunucudaki huzur ortamını korumakla yükümlüdür. Yapıcı eleştiri teşvik edilirken, yıkıcı, toksik ve pasif-agresif davranışlar topluluk kültürüne aykırı kabul edilir.</p>
            <p><strong>Ekolojik ve Dijital Sürdürülebilirlik:</strong> "Ekoyıldız" ismi, doğa ve dijital evren arasındaki dengeden esinlenir. Üyelerin paylaşımlarında çevre bilincini, mantık ve etik ilkelerini gözetmesi beklenir.</p>
            <p><strong>Giriş Şartı ve Kabul:</strong> Sunucuya katılan her yeni üye, üye doğrulama sisteminden geçerek bu Anayasa metninin tamamını okumuş, anlamış ve kabul etmiş sayılır.</p>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 2 -->
      <section id="bolum-2" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 2</div>
          <h2 class="section-title">👑 Yönetim Yapısı, Moderasyon Hiyerarşisi ve Yetki Dağılımı</h2>
        </div>

        <div class="article-card" id="madde-6">
          <div class="article-title-row">
            <div class="article-num">Madde 6: Yönetim Felsefesi ve Şeffaflık İlkesi</div>
            <button class="copy-btn" onclick="copyAnchor('madde-6')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Gücün Kaynağı ve Sınırları:</strong> Ekoyıldız Yönetim Ekibi, yetkilerini Anayasa’dan ve topluluğun huzurunu koruma misyonundan alır. Hiçbir yönetici, kurucu veya moderatör Anayasa’nın üstünde değildir; kişisel inisiyatifler Anayasa hükümlerini çiğneyecek şekilde kullanılamaz.</p>
            <p><strong>Kötüye Kullanım Yasağı:</strong> Yönetim yetkileri; kişisel husumetleri çözmek, ego tatmin etmek, üyeleri baskı altına almak veya haksız avantaj sağlamak amacıyla kesinlikle kullanılamaz. Yetkisini kötüye kullanan yetkililer, Anayasal Disiplin Süreci’ne tabi tutulur.</p>
            <p><strong>Açıklanabilirlik ve Hesap Verilebilirlik:</strong> Alınan sunucu geneli kararlar, yapılan kapsamlı ban/atılma işlemleri ve yönetimsel güncellemeler, şeffaflık ilkesi gereği gerekçeleriyle birlikte kayıt altında tutulur ve gerektiğinde topluluğa bildirilir.</p>
          </div>
        </div>

        <div class="article-card" id="madde-7">
          <div class="article-title-row">
            <div class="article-num">Madde 7: Yönetim Hiyerarşisi ve Unvan Tanımları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-7')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <ul>
              <li><strong>Kurucular Kurulu (Founder / Co-Founder):</strong> Sunucunun mülkiyet, vizyon ve en üst karar organıdır. Anayasa değişikliği yapma, sunucu yapısını değiştirme, yönetici atama ve azletme yetkisine tek başlarına sahiptirler. Alınan tüm kararlarda nihai veto hakkı Kurucular Kurulu’na aittir.</li>
              <li><strong>Sunucu Yöneticileri (Administrator / Admin):</strong> Sunucunun günlük operasyonel süreçlerini, sistem entegrasyonlarını ve bölüm içi organizasyonları yöneten üst düzey idari kadrodur. Moderatör ekibinin denetiminden, şikayet mekanizmalarının işletilmesinden ve alt kuralların Anayasa’ya uygunluğundan sorumludur. Ağır yaptırım gerektiren (kalıcı ihraç vb.) durumlarda onay makamıdır.</li>
              <li><strong>Moderatörler (Moderator / Mod):</strong> Sunucu içi düzeni, kanalların amacına uygun kullanımını ve anlık chat/ses akışını denetleyen saha yetkilileridir. İhlallere anında müdahale etme, uyarı verme, geçici susturma (mute) ve mesaj silme yetkilerine sahiptirler. Üyelerle doğrudan temas kuran, anlaşmazlıklarda ilk ara bulucu rolü üstlenen kadrodur.</li>
              <li><strong>Teknik ve Destek Ekibi (Developer / Bot & Role Manager):</strong> Sunucunun teknik altyapısını, bot entegrasyonlarını, rol izinlerini ve güvenlik sistemlerini yöneten uzman kadrodur. Doğrudan moderasyon süreçlerine müdahale etmezler; ancak teknik güvenlik krizlerinde geçici müdahale yetkileri saklıdır.</li>
              <li><strong>Stajyer / Deneme Moderatörleri (Trial Mod):</strong> Yönetim kadrosuna aday olan, belirli bir deneme süresinden geçen yetkili adaylarıdır. Yalnızca sınırlı kanallarda ve bir kıdemli moderatörün gözetimi altında temel müdahale yetkilerini kullanabilirler.</li>
            </ul>
          </div>
        </div>

        <div class="article-card" id="madde-8">
          <div class="article-title-row">
            <div class="article-num">Madde 8: Görev, Yetki ve Sorumluluk Alanları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-8')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Tarafsızlık İlkesi:</strong> Moderasyon ekibi, yaptırım uygularken üyenin sunucudaki kıdemine, popülerliğine, yetkililerle olan kişisel yakınlığına veya rollerine bakmaksızın objektif davranmakla yükümlüdür.</p>
            <p><strong>Kanıt Toplama Yükümlülüğü:</strong> Uygulanan tüm susturma (mute), kanaldan çıkarma (kick) veya engelleme (ban) işlemlerinde; ihlale ait ekran görüntüsü (screenshot), ses kaydı veya sistem günlüğü (log) kanıt olarak yönetim içi denetim kanalında arşivlenmelidir. Kanıtsız yapılan yaptırımlar geçersiz sayılır.</p>
            <p><strong>Müdahale Ölçülülüğü:</strong> İhlallere verilen tepki ve cezalar, ihlalin boyutuyla orantılı olmalıdır. İlk defa yapılan hafif ihlallerde doğrudan ağır yaptırımlar uygulanamaz; "Dereceli Yaptırım İlkesi" esastır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-9">
          <div class="article-title-row">
            <div class="article-num">Madde 9: Yönetim İçi Denetim ve Disiplin Süreci</div>
            <button class="copy-btn" onclick="copyAnchor('madde-9')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>İç Denetim Mekanizması:</strong> Moderatörlerin ve yöneticilerin eylemleri, Kurucular Kurulu ve Üst Yönetim tarafından düzenli olarak denetlenir.</p>
            <p><strong>Kural İhlali Yapan Yetkililer:</strong> Yetki suiistimali yapan, üyelere kaba/saldırgan davranan, gizli yönetim kanallarından bilgi sızdıran veya Anayasa’yı ihlal eden yetkililere şu süreçler uygulanır:</p>
            <ul>
              <li><strong>İhtar:</strong> İlk ve hafif ihlallerde yazılı uyarı verilir.</li>
              <li><strong>Yetki Askısı:</strong> İnceleme süresince yetkiler dondurulur.</li>
              <li><strong>Azil ve İhraç:</strong> Ağır ihlallerde yetkiler tamamen alınır ve yetkili kişi topluluktan uzaklaştırılabilir.</li>
            </ul>
          </div>
        </div>

        <div class="article-card" id="madde-10">
          <div class="article-title-row">
            <div class="article-num">Madde 10: Üye - Yönetim İlişkileri ve İtiraz Hakkı</div>
            <button class="copy-btn" onclick="copyAnchor('madde-10')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Geri Bildirim ve Şikayet:</strong> Her üye, yönetimin aldığı kararlara veya bir yetkilinin tutumuna ilişkin itirazını "Destek/Talep (Ticket)" kanalı üzerinden üst yönetime iletme hakkına sahiptir.</p>
            <p><strong>İtirazların Değerlendirilmesi:</strong> İtirazlar, kararı alan yetkili dışındaki farklı bir üst yönetici veya yönetim kurulu tarafından en geç 48 saat içinde incelenir ve gerekçeli karar üyeye bildirilir.</p>
            <p><strong>Gözdağı ve Yanıltma Yasağı:</strong> Üyelerin haklı itirazlarını engellemek amacıyla yetkililer tarafından baskı kurulamaz; aynı şekilde üyeler de yönetimi meşgul etmek için asılsız kriz ve yanlış beyan üretemez.</p>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 3 -->
      <section id="bolum-3" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 3</div>
          <h2 class="section-title">👥 Üyelik Hakları, Yükümlülükler ve Rol Sistemleri</h2>
        </div>

        <div class="article-card" id="madde-11">
          <div class="article-title-row">
            <div class="article-num">Madde 11: Üyeliğin Kazanılması, Niteliği ve Koşulları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-11')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Üyeliğin Başlangıcı:</strong> Ekoyıldız Sunucusu'na katılan, sunucu katılım/doğrulama adımlarını tamamlayan ve topluluk kurallarını kabul eden her gerçek kişi "Üye" sıfatını kazanır.</p>
            <p><strong>Kişisel Hesap Sorumluluğu:</strong> Sunucudaki her üye, kendi Discord hesabının güvenliğinden ve hesabı üzerinden gerçekleştirilen tüm eylemlerden bizzat sorumludur. "Hesabım çalındı", "Kardeşim yazmış" veya "Arkadaşım şaka yapmış" gibi mazeretler kural ihlallerinde sorumluluğu ortadan kaldırmaz.</p>
            <p><strong>Çoklu Hesap (Alt Account / Yan Hesap) Yasağı:</strong> Ceza veya kural ihlallerini bertaraf etmek, etkinliklerde haksız avantaj sağlamak veya sunucu içi düzeni manipüle etmek amacıyla yan hesap kullanmak kesinlikle yasaktır. Tespit edilen yan hesaplar süresiz uzaklaştırılır, ana hesaba ise ek yaptırımlar uygulanır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-12">
          <div class="article-title-row">
            <div class="article-num">Madde 12: Üyelerin Temel Hakları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-12')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <ul>
              <li><strong>Eşitlik ve İnsan Onuruna Saygı Hakkı:</strong> Tüm üyeler topluluk içerisinde eşit haklara sahiptir. Hiçbir üyeye ayrıcalık tanınamayacağı gibi, kimsenin kişisel onuru ve saygınlığı zedelenemez.</li>
              <li><strong>Güvenli ve Huzurlu Ortam Hakkı:</strong> Üyeler; tacizden, zorbalıktan, nefret söyleminden, spamdan ve istenmeyen kişisel iletilerden (DM) arındırılmış güvenli bir dijital ortamda bulunma hakkına sahiptir.</li>
              <li><strong>Bilgiye Erişim ve Katılım Hakkı:</strong> Üyeler; sunucunun genel kanallarında içerik paylaşma, bilgi edinme, düzenlenen açık etkinliklere, çekilişlere ve yarışmalara katılma hakkına sahiptir.</li>
              <li><strong>Adil Yargılanma ve İtiraz Hakkı:</strong> Yaptırıma maruz kalan her üye; yaptırımın gerekçesini öğrenme, kanıt talep etme ve karara üst yönetim nezdinde itiraz etme hakkına sahiptir.</li>
              <li><strong>Hesap ve Veri Gizliliği Hakkı:</strong> Üyelerin kişisel verileri, özel mesajlaşmaları ve gerçek yaşam bilgileri (kendi açık rızaları olmaksızın) sunucu içerisinde paylaşılamaz veya işlenemez.</li>
            </ul>
          </div>
        </div>

        <div class="article-card" id="madde-13">
          <div class="article-title-row">
            <div class="article-num">Madde 13: Üyelerin Temel Yükümlülükleri</div>
            <button class="copy-btn" onclick="copyAnchor('madde-13')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <ul>
              <li><strong>Anayasaya ve Kurallara Uyum:</strong> Üyeler, işbu Anayasa metnine, kanal bazlı özel kurallara ve yönetim duyurularına eksiksiz uymakla yükümlüdür.</li>
              <li><strong>Nezaket ve Saygı Çerçevesi:</strong> Üyeler, diğer topluluk mensupları ve yönetim ekibi ile olan tüm iletişimlerinde nezaket, saygı ve yapıcılık esaslarına bağlı kalmalıdır.</li>
              <li><strong>İçerik Güvenliği Yükümlülüğü:</strong> Üyeler paylaştıkları tüm metin, görsel, ses ve bağlantıların (link) genel ahlaka, yasalara ve sunucu kurallarına uygunluğundan sorumludur. Zararlı yazılım, telif ihlali içeren materyal veya +18 (NSFW) içerik paylaşımı yasaktır.</li>
              <li><strong>Topluluk Huzurunu Koruma:</strong> Sunucu içerisinde kaos çıkarmak, üyeleri kışkırtmak, gruplaşarak başkaları üzerinde baskı kurmak (trolling/ganging) veya sunucuyu sabote etmeye çalışmak topluluk yükümlülüklerinin ihlali kabul edilir.</li>
            </ul>
          </div>
        </div>

        <div class="article-card" id="madde-14">
          <div class="article-title-row">
            <div class="article-num">Madde 14: Rol Hiyerarşisi ve Statü Tanımları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-14')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Yönetimsel ve İdari Roller:</strong> Kurucu / Yönetici / Moderatör kademeleridir.</p>
            <p><strong>Topluluk Katkı ve Özel Statü Rolleri:</strong></p>
            <ul>
              <li><strong>V.I.P / Özel Üye:</strong> Topluluğa uzun süreli emek vermiş, içerik üretmiş veya özel katkılarda bulunmuş kişilere sembolik teşekkür niteliğinde verilen rollerdir.</li>
              <li><strong>Kıdemli / Aktif Üye (Seviye Rolleri):</strong> Sunucu içi etkileşim, chat aktifliği ve etkinlik katılımı ile sistem tarafından otomatik veya yönetimce verilen kıdem rolleridir.</li>
              <li><strong>İçerik Üreticisi / Sanatçı / Uzman:</strong> Bilim, yazılım, sanat, tasarım gibi alanlarda topluluğa değer katan üyelere tanımlanan rollerdir.</li>
            </ul>
            <p><strong>Destekçi ve Takviye Roller:</strong> Server Booster (Sunucu Takviyecisi) rolüdür.</p>
            <p><strong>Sistem ve Geçici Roller:</strong> Karantina / Muted / Cezalı gibi yaptırım rolleridir.</p>
          </div>
        </div>

        <div class="article-card" id="madde-15">
          <div class="article-title-row">
            <div class="article-num">Madde 15: Rollerin Kazanılması, Senkronizasyonu ve Kaybı</div>
            <button class="copy-btn" onclick="copyAnchor('madde-15')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Rollerin Verilme Usulü:</strong> Yönetimsel ve özel statülü roller, Kurucular Kurulu veya Yöneticilerin onayı ile verilir. Seviye ve Boost rolleri otomasyon sistemleri üzerinden kazanılır.</p>
            <p><strong>Rol Satışı Yasağı:</strong> Sunucu içi yetki veya ayrıcalık sağlayan hiçbir idari/özel rol gerçek para, dijital varlık veya çıkar karşılığında satılamaz. (Boost rolü Discord platformunun kendi mekanizmasıdır).</p>
            <p><strong>Rollerin Geri Alınması:</strong> Aktifliğini kaybeden, topluluk ilke ve normlarına aykırı davranan kişilerin özel statü ve katkı rolleri yönetim kararıyla geri alınabilir. Yetkisini veya rolünü kötüye kullanan kişilerin ayrıcalıkları derhal feshedilir.</p>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 4 -->
      <section id="bolum-4" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 4</div>
          <h2 class="section-title">💬 Sunucu İçi Genel Düzen, Yazılı ve Sesli İletişim Kuralları</h2>
        </div>

        <div class="article-card" id="madde-16">
          <div class="article-title-row">
            <div class="article-num">Madde 16: İletişimde Genel İlkeler ve Üslup Standardı</div>
            <button class="copy-btn" onclick="copyAnchor('madde-16')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Karşılıklı Saygı ve Nezaket:</strong> Sunucu içerisindeki tüm etkileşimlerde temel esas nezakettir. Üyeler, fikir ayrılıklarına düşseler dahi muhataplarına karşı aşağılayıcı, alaycı, kırıcı veya küçümseyici bir dil kullanamazlar.</p>
            <p><strong>Dil Kullanımı ve Türkçe Hassasiyeti:</strong> Sunucunun resmi iletişim dili Türkçedir. Paylaşımlarda dilin anlaşılır, okunabilir ve imla kurallarına olabildiğince uygun kullanılması esastır. Anlaşılmayı zorlaştıracak derecede bozuk, kasıtlı olarak deforme edilmiş dil kullanımı veya chat akışını bozacak şekilde büyük harflerle (CAPS LOCK) sürekli yazım yapılması yasaktır.</p>
            <p><strong>Kanal Amacına Uygunluk (Off-Topic Yasağı):</strong> Her kanal, isminde ve sabitlemelerinde belirtilen özel amaca hizmet eder. İlgili içerikler yalnızca kendi kanallarında paylaşılmalıdır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-17">
          <div class="article-title-row">
            <div class="article-num">Madde 17: Yazılı İletişim ve Chat Düzeni</div>
            <button class="copy-btn" onclick="copyAnchor('madde-17')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Küfür, Hakaret ve Argo Yasağı:</strong> Ağır küfür, şahsa veya ailevi değerlere yönelik hakaret, sövgü ve aşağılama kesinlikle yasaktır ve doğrudan ceza sebebidir. Hafif argo kanalın genel huzurunu bozmayacak düzeyde tutulmalıdır.</p>
            <p><strong>Spam, Flooding ve Harf/Emoji İsrafı:</strong> Chat akışını tıkamak amacıyla ardı ardına hızlı mesaj göndermek (spam), aynı cümleyi tekrar tekrar yazmak (flood), anlamsız harf yığınları (random) veya aşırı emoji/GIF kullanımı mesaj silme ve susturma sebebidir.</p>
            <p><strong>Etiketleme (Mention / Ping) Kuralları:</strong> Kurucular, Yöneticiler veya Moderatörler acil bir kriz durumu olmadıkça sebepsizce etiketlenemez. @everyone ve @here yetkileri yalnızca üst yönetime aittir.</p>
            <p><strong>Reklam ve Ticari Faaliyet Yasağı:</strong> Kanallarda, profil durumlarında veya DM üzerinden izinsiz Discord davet linki, sosyal medya, referanslı link veya ticari ürün tanıtımı yapmak kesinlikle yasaktır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-18">
          <div class="article-title-row">
            <div class="article-num">Madde 18: Sesli Kanal Kuralları ve Etiketi</div>
            <button class="copy-btn" onclick="copyAnchor('madde-18')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Arka Plan Gürültüsü ve Ses Kalitesi:</strong> Aşırı yankı, cızırtı veya gürültü çıkaran kişilerin "Bas-Konuş" (Push-to-Talk) modunu kullanması zorunludur.</p>
            <p><strong>Bass, Soundboard ve Yüksek Ses Yasağı:</strong> Sohbeti sabote edecek şekilde bağırmak, harici yazılımlarla cızırtılı/basslı sesler oynatmak veya Soundboard özelliklerini kötüye kullanmak yasaktır.</p>
            <p><strong>Yayın ve Ekran Paylaşımı Etiği:</strong> Sesli kanallarda telif hakkı ihlali içeren materyaller, +18/NSFW görseller, şiddet unsurları veya kişisel verileri ifşa eden ekranlar paylaşılamaz. Yayın açan üye ekrandan bizzat sorumludur.</p>
            <p><strong>Oda Amacı ve Kapasitesi:</strong> Kanallara sürekli gir-çık yapılarak (troll) huzur bozulmamalıdır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-19">
          <div class="article-title-row">
            <div class="article-num">Madde 19: Profil, İsim ve Görsel Standartları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-19')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Kullanıcı Adı (Nickname) Standartları:</strong> Üyelerin isimleri okunabilir ve etiketlenebilir olmalıdır. İsimlerde küfür, hakaret, nefret söylemi, tahrik edici ögeler, reklam veya yetkili unvanlarını taklit eden ifadeler kullanılamaz.</p>
            <p><strong>Profil Resmi (Avatar) ve Durum Mesajları:</strong> Profil resimlerinde ve durumlarında +18/NSFW, kan/şiddet ögeleri, siyasi/terör simgeleri veya yöneticileri hedef alan aşağılayıcı ögeler bulundurulamaz.</p>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 5 -->
      <section id="bolum-5" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 5</div>
          <h2 class="section-title">🛡️ Güvenlik, İçerik Paylaşım Standartları ve Yasaklı Materyaller</h2>
        </div>

        <div class="article-card card-alert" id="madde-20">
          <div class="article-title-row">
            <div class="article-num">Madde 20: Bilgi Güvenliği, Kişisel Veriler ve Mahremiyet (KVKK ve Doxxing Yasağı)</div>
            <button class="copy-btn" onclick="copyAnchor('madde-20')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Kişisel Verilerin İfşası (Doxxing) Yasağı:</strong> Üyelerin veya üçüncü şahısların adı, soyadı, T.C. kimlik numarası, adresi, telefon numarası, fotoğrafı, okul/iş bilgileri, IP adresi veya özel yaşamına ait her türlü kişisel verinin izin alınmaksızın sunucuda paylaşılması kesinlikle yasaktır. Bu kuralın ihlali, <strong>hiçbir uyarı yapılmaksızın süresiz ihraç (permanent ban)</strong> ve gerekli görüldüğünde hukuki süreç başlatılması sebebidir.</p>
            <p><strong>Özel Mesajlaşmaların (DM) Gizliliği:</strong> Kişiler arasındaki özel mesajlaşmaların veya ses kayıtlarının açık rıza olmaksızın genel kanallarda ifşa edilmesi veya şantaj amacıyla kullanılması mahremiyet ihlalidir.</p>
            <p><strong>Hesap ve Güvenlik Sorumluluğu:</strong> Üyeler, hesap güvenliklerini sağlamakla (2FA kullanımı vb.) bizzat yükümlüdür.</p>
          </div>
        </div>

        <div class="article-card" id="madde-21">
          <div class="article-title-row">
            <div class="article-num">Madde 21: Telif Hakları, Fikri Mülkiyet ve İllegal Yazılım</div>
            <button class="copy-btn" onclick="copyAnchor('madde-21')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Fikri Mülkiyete Saygı:</strong> Korsan kitap, makale, ders notu, yazılım, müzik, film dağıtımı yapılamaz.</p>
            <p><strong>Korsan Yazılım, Crack ve Torrent Yasağı:</strong> İllegal indirme bağlantıları (crack, torrent, warez, oyun yamaları vb.), lisans anahtarı dağıtımları veya IP-TV paylaşımları yasaktır.</p>
            <p><strong>Kullanıcı Üretimi İçerikler:</strong> Başkasına ait projeleri kaynak göstermeden kendi eseri gibi sunmak (intihal) topluluk etiğine aykırıdır.</p>
          </div>
        </div>

        <div class="article-card card-alert" id="madde-22">
          <div class="article-title-row">
            <div class="article-num">Madde 22: Yasaklı Materyaller, +18 (NSFW) ve Şiddet Unsurları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-22')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Cinsellik ve NSFW Yasağı:</strong> Pornografik, erotik, cinsel organ içeren veya aşırı teşhir içeren görsel, metin, gif veya bağlantı paylaşımı kesinlikle yasaktır.</p>
            <p><strong>Gore, Şiddet ve Kan İçeriği:</strong> Ağır şiddet, işkence, kan, intihar, ceset, vahşet (gore) veya kaza görsellerinin paylaşımı kesinlikle yasaktır.</p>
            <p><strong>Zararlı Bağlantılar ve Zararlı Yazılımlar (Malware/Phishing):</strong> Truva atı (trojan), virüs, ransomware, token grabber veya sahte Discord Nitro oltalama linkleri derhal kalıcı ihraç sebebidir.</p>
          </div>
        </div>

        <div class="article-card" id="madde-23">
          <div class="article-title-row">
            <div class="article-num">Madde 23: İllegal Faaliyetler, Bilişim Suçları ve Tehlikeli Maddeler</div>
            <button class="copy-btn" onclick="copyAnchor('madde-23')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Bilişim Suçları ve Saldırı Teşvikleri:</strong> DDoS/DoS saldırı araçları, botnet ağları, site sızma (hacking) sistemleri veya kart hırsızlığı (carding) ile ilgili araç ve yönlendirmelerin paylaşılması veya övülmesi yasaktır.</p>
            <p><strong>Yasadışı Maddeler ve Silah Yapımı:</strong> Uyuşturucu, uyarıcı, tütün/alkol özendirilmesi; patlayıcı ve silah yapımı materyallerinin paylaşımı yasaktır.</p>
            <p><strong>Maddi Çıkar ve Kumar:</strong> Yasadışı bahis, kumar, saadet zinciri (ponzi) ve yetkisiz finansal yatırım tavsiyeleri yasaktır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-24">
          <div class="article-title-row">
            <div class="article-num">Madde 24: Kriz Yönetimi, Güvenlik İhbarı ve Müdahale</div>
            <button class="copy-btn" onclick="copyAnchor('madde-24')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Güvenlik İhbarı:</strong> Şüpheli bağlantı, güvenlik açığı veya KVKK ihlali tespit eden üyeler destek sistemi üzerinden üst yönetime bildirmekle yükümlüdür.</p>
            <p><strong>Acil Durum Müdahalesi:</strong> Kitlesel bir ihlal (raiding, bot saldırısı) anında moderasyon ekibi kanalları kilitleme (lockdown) veya yavaş moda alma yetkisine sahiptir.</p>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 6: DİSİPLİN & CEZA CETVELİ -->
      <section id="bolum-6" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 6</div>
          <h2 class="section-title">⚖️ Disiplin Süreci, Yaptırım Türleri ve Ceza Cetveli</h2>
        </div>

        <div class="article-card" id="madde-25">
          <div class="article-title-row">
            <div class="article-num">Madde 25: Disiplin Soruşturmasının Esasları ve İlkeleri</div>
            <button class="copy-btn" onclick="copyAnchor('madde-25')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Kanunsuz Suç ve Ceza Olmaz İlkesi:</strong> Açıkça yasaklanmamış bir eylemden dolayı yaptırım uygulanamaz.</p>
            <p><strong>Dereceli ve Ölçülü Yaptırım Esası:</strong> İhlalin niteliğine, ağırlığına ve sicil durumuna göre kademeli yaptırım uygulanır.</p>
            <p><strong>Savunma ve İtiraz Hakkı:</strong> Ağır yaptırım kararlarında 48 saat içinde Destek sistemi üzerinden yazılı savunma sunulabilir.</p>
            <p><strong>Delil ve Kayıt İlkesi:</strong> Tüm disiplin işlemleri kanıtla (screenshot, log, ses kaydı) arşivlenir. Kanıtsız cezalar iptal edilir.</p>
          </div>
        </div>

        <div class="article-card" id="madde-26">
          <div class="article-title-row">
            <div class="article-num">Madde 26: Yaptırım Türleri ve Dereceleri</div>
            <button class="copy-btn" onclick="copyAnchor('madde-26')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <ul>
              <li><strong>Sözlü veya Yazılı Uyarı (Warn):</strong> Hafif ihlallerde resmi bildirim iletilmesidir.</li>
              <li><strong>Kanal Bazlı / Süreli Susturma (Mute / Timeout):</strong> Yazılı veya sesli kanallarda 10 dakika ile 7 gün arasında kısıtlamadır.</li>
              <li><strong>Geçici Karantina (Quarantine Role):</strong> Soruşturma süresince genel kanallara erişimin kısıtlanmasıdır.</li>
              <li><strong>Sunucudan Atma (Kick):</strong> Bağlantının kesilmesidir. Davet linki ile tekrar katılabilir.</li>
              <li><strong>Süreli Uzaklaştırma (Temp-Ban):</strong> 1 gün ile 30 gün arasında sunucudan engellemedir.</li>
              <li><strong>Kalıcı İhraç (Permanent Ban):</strong> Topluluk ile ilişiğin süresiz kesilmesidir.</li>
            </ul>
          </div>
        </div>

        <!-- CEZA CETVELİ TABLOSU (MADDE 27) -->
        <div class="article-card" id="ceza-cetveli">
          <div class="article-title-row">
            <div class="article-num">Madde 27: Standart Ceza Cetveli (İhlal - Yaptırım Matrisi)</div>
            <button class="copy-btn" onclick="copyAnchor('ceza-cetveli')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p>Aşağıdaki cetvel, kural ihlallerinde uygulanacak standart asgari ve azami disiplin yaptırımlarını belirler:</p>
            
            <div class="table-wrapper">
              <table class="ceza-table">
                <thead>
                  <tr>
                    <th>İhlal Türü</th>
                    <th>İlk İhlal</th>
                    <th>İkinci İhlal (Tekrar)</th>
                    <th>Üçüncü / Kronik İhlal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Spam / Flood / Aşırı Caps Lock</strong></td>
                    <td><span class="badge-mute">Uyarı + 10 Dk Mute</span></td>
                    <td><span class="badge-mute">1 Saat Mute</span></td>
                    <td><span class="badge-mute">24 Saat Mute / Kick</span></td>
                  </tr>
                  <tr>
                    <td><strong>Kanal Dışı İletişim (Off-Topic)</strong></td>
                    <td>Sözel / Yazılı Uyarı</td>
                    <td><span class="badge-mute">30 Dk Mute</span></td>
                    <td><span class="badge-mute">2 Saat Mute</span></td>
                  </tr>
                  <tr>
                    <td><strong>Yetkilileri Sebepsiz Pinglemek / Darlamak</strong></td>
                    <td>Yazılı Uyarı</td>
                    <td><span class="badge-mute">1 Saat Mute</span></td>
                    <td><span class="badge-mute">1 Gün Mute</span></td>
                  </tr>
                  <tr>
                    <td><strong>Hafif Argo / Huzursuzluk Çıkarma</strong></td>
                    <td>Yazılı Uyarı</td>
                    <td><span class="badge-mute">2 Saat Mute</span></td>
                    <td><span class="badge-tempban">1 Gün Mute / Temp-Ban</span></td>
                  </tr>
                  <tr>
                    <td><strong>Şahsa / Ailevi Değerlere Ağır Küfür</strong></td>
                    <td><span class="badge-tempban">1 Gün Mute / Temp-Ban</span></td>
                    <td><span class="badge-tempban">7 Gün Temp-Ban</span></td>
                    <td><span class="badge-permban">Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>İzinsiz Reklam (DM veya Kanal)</strong></td>
                    <td><span class="badge-mute">Mesaj Silme + 1 Gün Mute</span></td>
                    <td><span class="badge-tempban">7 Gün Temp-Ban</span></td>
                    <td><span class="badge-permban">Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Telif İhlali / Korsan Paylaşım</strong></td>
                    <td>İçerik Silme + Uyarı</td>
                    <td><span class="badge-tempban">1 Gün Mute / Temp-Ban</span></td>
                    <td><span class="badge-tempban">7 Gün Temp-Ban</span></td>
                  </tr>
                  <tr>
                    <td><strong>Doxxing / KVKK İhlali / Veri İfşası</strong></td>
                    <td colspan="3"><span class="badge-permban">🚨 Doğrudan Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>NSFW / Pornografik İçerik</strong></td>
                    <td colspan="3"><span class="badge-permban">🚨 Doğrudan Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Zararlı Yazılım / Phishing Linki</strong></td>
                    <td colspan="3"><span class="badge-permban">🚨 Doğrudan Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Nefret Söylemi / Ağır Ayrımcılık</strong></td>
                    <td><span class="badge-tempban">7 Gün Temp-Ban / Perm-Ban</span></td>
                    <td><span class="badge-permban">Kalıcı İhraç (Perm-Ban)</span></td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td><strong>Yan Hesap (Alt Account) İle Cezadan Kaçma</strong></td>
                    <td><span class="badge-tempban">Ana & Yan Hesap 7 Gün Ban</span></td>
                    <td colspan="2"><span class="badge-permban">Her İki Hesap İçin Kalıcı İhraç</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="article-card" id="madde-28">
          <div class="article-title-row">
            <div class="article-num">Madde 28: Disiplin Kayıtlarının Silinmesi ve İnfaz İndirimi</div>
            <button class="copy-btn" onclick="copyAnchor('madde-28')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Sicil Temizleme (Arşiv Süresi):</strong> Hafif ihlallere ait uyarı ve mute kayıtları, ihlal tarihinden itibaren 6 ay boyunca yeni bir ceza alınmaması durumunda pasif konuma geçer ve sicilden düşürülür.</p>
            <p><strong>Kurala Uyum ve İnfaz İndirimi:</strong> Samimi pişmanlık gösteren ve ceza süresinin en az yarısını sorunsuz tamamlayan üyelerin yaptırımları, Yönetim Kurulu kararıyla bir defaya mahsus hafifletilebilir.</p>
            <p><strong>Aftan Yararlanamayacak İhlaller:</strong> Doxxing (ifşa), taciz, trojan/phishing paylaşımı ve sabotaj sebebiyle verilen kalıcı ihraç (Perm-Ban) kararları hiçbir af veya sicil temizliği kapsamına alınamaz.</p>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 7 -->
      <section id="bolum-7" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 7</div>
          <h2 class="section-title">🎨 Etkinlik Yönetimi, Ortak Projeler ve İçerik Üretim Standartları</h2>
        </div>

        <div class="article-card" id="madde-29">
          <div class="article-title-row">
            <div class="article-num">Madde 29: Topluluk Etkinliklerinin Esasları ve Düzenlenme Usulü</div>
            <button class="copy-btn" onclick="copyAnchor('madde-29')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Etkinlik İlkeleri:</strong> Tüm etkinlikler kapsayıcı, eğitici, eğlenceli ve Anayasa ilkelerine uygun olmak zorundadır.</p>
            <p><strong>Onay ve Takvim Mekanizması:</strong> Genel katılımlı etkinlikler en az 48 saat öncesinden Organizasyon Ekibi veya Üst Yönetim'den onay almalıdır.</p>
            <p><strong>Katılım Eşitliği:</strong> Belirli bir grubu kayırma veya kasten dışlama yapılamaz.</p>
          </div>
        </div>

        <div class="article-card" id="madde-30">
          <div class="article-title-row">
            <div class="article-num">Madde 30: Ortak Projeler, Çalışma Grubu ve Takımlar</div>
            <button class="copy-btn" onclick="copyAnchor('madde-30')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Proje Oluşturma Standartları:</strong> EkoYıldız bünyesinde yürütülecek ortak projeler için Yönetim Kurulu'ndan onay ve özel çalışma kanalları talep edilebilir.</p>
            <p><strong>Fikri Mülkiyet:</strong> Kolektif projelerde projeyi geliştiren üyelerin hakları saklıdır. Proje çıktılarında katkı sağlayan ekip açıkça belirtilmelidir.</p>
            <p><strong>Proje Odalarının Kullanımı:</strong> Odalar yalnızca proje amacı doğrultusunda kullanılmalıdır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-31">
          <div class="article-title-row">
            <div class="article-num">Madde 31: İçerik Üretimi ve Paylaşım Standartları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-31')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Eser Orijinalliği:</strong> Paylaşılan çalışmaların özgün ve topluluk kalitesine uygun olması esastır.</p>
            <p><strong>Yapay Zeka (AI) İçerik Kuralları:</strong> Yapay zeka araçları (Midjourney, ChatGPT vb.) ile üretilen içeriklerin yapay zeka çıktısı olduğu açıkça belirtilmelidir. Tamamen el emeği gibi sunmak dijital intihaldir.</p>
            <p><strong>Eleştiri Etiği:</strong> Paylaşılan eserlere yapılacak yorumlar yapıcı ve nezaket çerçevesinde olmalıdır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-32">
          <div class="article-title-row">
            <div class="article-num">Madde 32: Çekiliş, Ödüllü Turnuva ve Sponsorluk Esasları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-32')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Şeffaf Çekiliş Standardı:</strong> Çekilişler bot veya canlı yayın kuraları ile şeffaf şekilde yürütülmelidir.</p>
            <p><strong>Şartlı Katılım Kısıtı:</strong> Üyelere maddi külfet veya zorunlu üye çekme (invite) şartı koşulamaz.</p>
            <p><strong>Sponsorluk ve Dış Destekler:</strong> Tüm sponsorluk anlaşmaları yalnızca Kurucular Kurulu tarafından yürütülür.</p>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 8 -->
      <section id="bolum-8" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 8</div>
          <h2 class="section-title">🤝 Partnerlik Politikaları, Reklam ve Dış İlişkiler Yönetimi</h2>
        </div>

        <div class="article-card" id="madde-33">
          <div class="article-title-row">
            <div class="article-num">Madde 33: Dış İlişkiler Yönetimi ve Temsil Yetkisi</div>
            <button class="copy-btn" onclick="copyAnchor('madde-33')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Kurumsal Temsil İlkesi:</strong> EkoYıldız'ı dış mecralarda temsil etme yetkisi yalnızca Kurucular Kurulu ve yetkilendirilmiş Dış İlişkiler Sorumlularına aittir.</p>
            <p><strong>Yetkisiz Beyan Yasağı:</strong> Açık onay olmaksızın EkoYıldız adı kullanılarak taahhüt altına girilemez veya beyan verilemez.</p>
            <p><strong>Topluluk İtibarının Korunması:</strong> Dış platformlarda topluluğun saygınlığını zedeleyecek tutumlar sergilenemez.</p>
          </div>
        </div>

        <div class="article-card" id="madde-34">
          <div class="article-title-row">
            <div class="article-num">Madde 34: Partnerlik ve Birlik Politikaları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-34')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Partnerlik Kriterleri:</strong> Vizyonu, kaliteli üye profili ve etik değerleri uyuşan sunucularla partnerlik kurulabilir.</p>
            <p><strong>Asgari Şartlar:</strong> İllegal, korsan, siyasi propaganda yapan veya toksik yapılarla partnerlik yapılamaz. Niteliksiz link takasları reddedilir.</p>
            <p><strong>Partnerliğin Feshi:</strong> Anayasa ilkelerine veya Discord Hizmet Koşullarına aykırı hareket eden sunucularla partnerlik tek taraflı feshedilir.</p>
          </div>
        </div>

        <div class="article-card" id="madde-35">
          <div class="article-title-row">
            <div class="article-num">Madde 35: Reklam, Tanıtım ve Sponsorluk Standartları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-35')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>İzinsiz Reklam Yasağı:</strong> Sunucu genelinde veya DM üzerinden izinsiz reklam yapmak kesinlikle yasaktır.</p>
            <p><strong>Sponsorluk Şartları:</strong> Sponsorluklar topluluk faydasına olmak zorundadır ve "Sponsorlu İçerik" etiketiyle paylaşılır.</p>
            <p><strong>Bağış ve Gelir Modelleri:</strong> Sunucuya yapılan destekler (Boost vb.) gönüllülük esasına dayanır. İdari yetki satılamaz.</p>
          </div>
        </div>

        <div class="article-card" id="madde-36">
          <div class="article-title-row">
            <div class="article-num">Madde 36: Dış Kaynaklı Krizler ve Rakip Topluluk İletişimi</div>
            <button class="copy-btn" onclick="copyAnchor('madde-36')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Karalama ve Provokasyon Yönetimi:</strong> Dış gruplar tarafından başlatılan linç veya karalama girişimlerine sunucu içerisinden toplu yanıt verilmez. Süreç yönetim tarafından hukuki/idari mecralarda yönetilir.</p>
            <p><strong>Raid ve Invite Bot Saldırıları:</strong> İzinsiz DM ile üye çekmeye çalışan hesaplar derhal engellenir.</p>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 9 -->
      <section id="bolum-9" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 9</div>
          <h2 class="section-title">🗳️ Anayasal Değişiklik Usulleri, Anayasa Komisyonu ve Oylama</h2>
        </div>

        <div class="article-card" id="madde-37">
          <div class="article-title-row">
            <div class="article-num">Madde 37: Anayasa Değişiklik İlkeleri ve Teklif Usulü</div>
            <button class="copy-btn" onclick="copyAnchor('madde-37')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Anayasanın Katılığı ve Üstünlüğü:</strong> Anayasa keyfi kararlarla veya anlık inisiyatiflerle değiştirilemez. Değişiklikler yalnızca nitelikli usullere tabidir.</p>
            <p><strong>Teklif Şartları:</strong> Kurucular Kurulu oy birliği, Yönetim Kurulu 2/3 çoğunluğu veya üyelerin 1/5 imza/talebiyle sunulabilir.</p>
            <p><strong>Ön İnceleme:</strong> Teklifler Anayasa Komisyonu tarafından 7 gün içinde ön incelemeye alınır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-38">
          <div class="article-title-row">
            <div class="article-num">Madde 38: Anayasa Komisyonu’nun Yapısı ve Görevleri</div>
            <button class="copy-btn" onclick="copyAnchor('madde-38')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Komisyon Yapısı:</strong> Kurucular Kurulu'ndan 1 üye, Yönetim Ekibi'nden 2 yönetici ve Topluluk İçinden 2 temsilci olmak üzere 5 üyeden oluşur.</p>
            <p><strong>Görevleri:</strong> Madde taslaklarını hazırlamak, norm hiyerarşisini korumak, oylama süreçlerini bağımsız yönetmek ve bağlayıcı yorum bildirmektir.</p>
          </div>
        </div>

        <div class="article-card" id="madde-39">
          <div class="article-title-row">
            <div class="article-num">Madde 39: Oylama Mekanizmaları ve Kabul Nisapları</div>
            <button class="copy-btn" onclick="copyAnchor('madde-39')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Yönetim İçi Oylama:</strong> Kabul için Yönetim Kurulu üye tamsayısının en az 3/4 çoğunluğu aranır.</p>
            <p><strong>Topluluk Referandumu:</strong> Köklü değişikliklerde halk oylamasına gidilebilir. %60 ve üzeri "EVET" oyu aranır.</p>
            <p><strong>Kurucu Onayı:</strong> Tüm değişikliklerin yürürlüğe girmesi için Kurucular Kurulu'nun nihai onayı şarttır.</p>
          </div>
        </div>

        <div class="article-card card-alert" id="madde-40">
          <div class="article-title-row">
            <div class="article-num">Madde 40: Değiştirilemez Hükümler (Kırmızı Çizgiler)</div>
            <button class="copy-btn" onclick="copyAnchor('madde-40')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Dokunulmaz Maddeler:</strong></p>
            <ul>
              <li><strong>Madde 2:</strong> Topluluğun Siyasetsizliği ve Bağımsızlığı,</li>
              <li><strong>Madde 4:</strong> Temel İnsan Hakları, Saygı ve Mutlak Ayrımcılık Yasağı,</li>
              <li><strong>Madde 20:</strong> KVKK, Doxxing (İfşa) ve Kişisel Verilerin Korunması Yasağı,</li>
            </ul>
            <p>hükümleri <strong>teklif dahi edilemez, değiştirilemez ve yürürlükten kaldırılamaz.</strong></p>
            <p><strong>Kırmızı Çizgilerin İhlali:</strong> Değiştirilemez hükümleri ihlale yönelik girişimler Anayasal suç sayılır ve teklif sahiplerinin yetkileri derhal feshedilir.</p>
          </div>
        </div>

        <div class="article-card" id="madde-41">
          <div class="article-title-row">
            <div class="article-num">Madde 41: İlan, Yürürlük ve Geçiş Süreci</div>
            <button class="copy-btn" onclick="copyAnchor('madde-41')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>İlan:</strong> Kabul edilen değişiklikler duyuru kanalında gerekçesiyle yayımlanır.</p>
            <p><strong>Geçiş Süresi:</strong> Aksi belirtilmedikçe değişiklikler 24 saat sonra yürürlüğe girer. Geçiş sürecinde üyenin lehine olan kural uygulanır.</p>
          </div>
        </div>
      </section>

      <!-- BÖLÜM 10 -->
      <section id="bolum-10" class="doc-section">
        <div class="section-header">
          <div class="section-tag">BÖLÜM 10</div>
          <h2 class="section-title">📜 Yürürlük, Yürütme ve Kapanış Hükümleri</h2>
        </div>

        <div class="article-card" id="madde-42">
          <div class="article-title-row">
            <div class="article-num">Madde 42: Yürürlük ve Uygulama Alanı</div>
            <button class="copy-btn" onclick="copyAnchor('madde-42')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Yürürlüğe Giriş:</strong> İşbu EkoYıldız Topluluğu Anayasası; 10 ana bölüm, 44 madde ve 2 ön bilgilendirme metninden oluşmakta olup sunucunun resmi duyuru kanalında yayımlandığı an itibarıyla tüm hükümleriyle yürürlüğe girer.</p>
            <p><strong>Kapsama Alanı:</strong> EkoYıldız Discord sunucusu, tüm alt kanallar, sesli/yazılı odalar ve resmi sosyal medya mecralarında eş zamanlı geçerlidir.</p>
            <p><strong>Önceki Hükümlerin Geçersizliği:</strong> Anayasa ile çelişen önceki tüm lokal duyuru ve kurallar kadük sayılır.</p>
          </div>
        </div>

        <div class="article-card" id="madde-43">
          <div class="article-title-row">
            <div class="article-num">Madde 43: Yürütme ve Denetim Yetkisi</div>
            <button class="copy-btn" onclick="copyAnchor('madde-43')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Yürütme Makamı:</strong> Hükümleri yürütme yetkisi Kurucular Kurulu, Sunucu Yöneticileri ve yetkili Moderatör Kadrosuna aittir.</p>
            <p><strong>Denetim ve Tarafsızlık:</strong> Yürütme organları tarafsızlık, adalet ve ölçülülük ilkelerine uymakla yükümlüdür.</p>
            <p><strong>OHAL ve Kriz Yürütmesi:</strong> Kitlesel saldırı veya sabotaj girişimlerinde Kurucular Kurulu belirli maddeleri en fazla 72 saat süreyle dondurma yetkisine sahiptir.</p>
          </div>
        </div>

        <div class="article-card" id="madde-44">
          <div class="article-title-row">
            <div class="article-num">Madde 44: Kapanış, Bütünlük ve İmzalar</div>
            <button class="copy-btn" onclick="copyAnchor('madde-44')">🔗 Link Kopyala</button>
          </div>
          <div class="article-body">
            <p><strong>Metin Bütünlüğü:</strong> İşbu Anayasa metni bir bütündür. Maddeler tek tek ayrılarak bağlamından koparılamaz.</p>
            <p><strong>Yorumlama Yetkisi:</strong> Yorum farklılıklarında bağlayıcı nihai karar Anayasa Komisyonu ve Kurucular Kurulu'na aittir.</p>
            <p><strong>Topluluk Akit Beyanı:</strong> EkoYıldız Topluluğu’na katılan her birey, bu Anayasa’yı okumuş, anlamış ve tüm kurallara uyacağını taahhüt etmiş sayılır.</p>
          </div>
        </div>
      </section>

      <!-- İMZA VE YÜRÜRLÜK MÜHRÜ -->
      <div class="signature-card" id="imzalar">
        <h3 class="signature-title">ANAYASA ONAY VE YÜRÜRLÜK İMZALARI</h3>
        <p class="signature-sub">
          İşbu 10 bölüm ve 44 maddeden oluşan EkoYıldız Topluluğu Anayasası, Yönetim Kurulu ve Kurucular Kurulu oy birliği ile kabul edilerek resmi olarak yürürlüğe konulmuştur.
        </p>

        <div class="signature-seal">
          <div class="seal-name">ekonqt</div>
          <div class="seal-role">👑 EkoYıldız Sahibi & Kurucular Kurulu</div>
          <div class="seal-motto">"Dijital Birlik, Sürdürülebilir Gelecek ve Özgür İfade İçin."</div>
        </div>
      </div>
    </div>

    <!-- CLIENT INTERACTIVE SCRIPT -->
    <script>
      function jumpToSection(val) {
        if (!val) return;
        const el = document.querySelector(val);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }

      function copyAnchor(id) {
        const url = window.location.origin + window.location.pathname + '#' + id;
        navigator.clipboard.writeText(url).then(() => {
          if (typeof showToast === 'function') {
            showToast('Bağlantı kopyalandı!', 'success');
          } else {
            alert('Madde bağlantısı kopyalandı: ' + url);
          }
        }).catch(() => {
          prompt('Madde bağlantısı:', url);
        });
      }

      function filterArticles() {
        const query = document.getElementById('anayasa-search').value.toLowerCase().trim();
        const articles = document.querySelectorAll('.article-card');
        const sections = document.querySelectorAll('.doc-section');

        if (!query) {
          articles.forEach(card => card.classList.remove('hidden-card'));
          sections.forEach(sec => sec.classList.remove('hidden-card'));
          return;
        }

        sections.forEach(sec => {
          let hasVisibleArticle = false;
          const secArticles = sec.querySelectorAll('.article-card');

          secArticles.forEach(card => {
            const text = card.innerText.toLowerCase();
            if (text.includes(query)) {
              card.classList.remove('hidden-card');
              hasVisibleArticle = true;
            } else {
              card.classList.add('hidden-card');
            }
          });

          if (hasVisibleArticle) {
            sec.classList.remove('hidden-card');
          } else {
            sec.classList.add('hidden-card');
          }
        });
      }
    </script>
  `;

  const { _layout } = require("../views");
  return _layout("EkoYıldız Discord Topluluğu Anayasası", user, content, "", "/anayasasi");
}

module.exports = {
  renderEkoYildizAnayasaPage
};
