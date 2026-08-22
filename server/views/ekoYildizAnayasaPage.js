'use strict';

function renderEkoYildizAnayasaPage(user) {
  const content = `
    <style>
      .mevzuat-wrapper {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem 1rem 5rem;
        color: #e2e8f0;
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* Resmî Gazete / Mevzuat Anteti */
      .resmi-header {
        background: linear-gradient(180deg, rgba(20, 20, 35, 0.95) 0%, rgba(10, 10, 20, 0.98) 100%);
        border: 1px solid rgba(167, 139, 250, 0.25);
        border-top: 4px solid #a78bfa;
        border-radius: 16px;
        padding: 2.5rem 2rem 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
        position: relative;
        text-align: center;
      }
      .resmi-header::after {
        content: 'RESMÎ MEVZUAT';
        position: absolute;
        bottom: 10px;
        right: 20px;
        font-size: 4.5rem;
        font-weight: 900;
        color: rgba(255, 255, 255, 0.015);
        letter-spacing: 0.1em;
        pointer-events: none;
      }
      .resmi-emblem {
        font-size: 2.4rem;
        margin-bottom: 0.5rem;
        display: inline-block;
        filter: drop-shadow(0 2px 8px rgba(167, 139, 250, 0.5));
      }
      .resmi-state-title {
        font-size: 0.9rem;
        font-weight: 800;
        color: #c4b5fd;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        margin-bottom: 0.35rem;
      }
      .resmi-portal-title {
        font-size: 2.1rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -0.02em;
        margin: 0 0 1.25rem 0;
      }
      .resmi-metadata-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        max-width: 900px;
        margin: 0 auto;
        text-align: left;
      }
      .meta-item {
        font-size: 0.85rem;
      }
      .meta-label {
        color: #94a3b8;
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.04em;
        margin-bottom: 2px;
      }
      .meta-value {
        color: #f1f5f9;
        font-weight: 700;
      }

      /* Başlangıç (Preamble) Kutusu */
      .preamble-card {
        background: rgba(167, 139, 250, 0.04);
        border-left: 4px solid #a78bfa;
        border-radius: 0 14px 14px 0;
        padding: 1.5rem 1.75rem;
        margin-bottom: 2.25rem;
        font-style: italic;
        line-height: 1.8;
        color: #cbd5e1;
        font-size: 0.98rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      }
      .preamble-title {
        font-style: normal;
        font-weight: 800;
        font-size: 1.1rem;
        color: #c4b5fd;
        margin-bottom: 0.5rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      /* Sticky Arama ve Navigasyon Barı */
      .mevzuat-nav {
        position: sticky;
        top: 70px;
        z-index: 30;
        background: rgba(8, 8, 18, 0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 0.85rem 1.25rem;
        margin-bottom: 2rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      .search-container {
        flex: 1;
        min-width: 260px;
        position: relative;
      }
      .search-container input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 10px;
        padding: 10px 14px 10px 38px;
        color: #fff;
        font-family: inherit;
        font-size: 0.92rem;
        transition: all 0.2s ease;
      }
      .search-container input:focus {
        outline: none;
        border-color: #a78bfa;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.25);
      }
      .search-icon-fixed {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        font-size: 1rem;
        pointer-events: none;
      }
      .jump-select select {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 10px;
        padding: 10px 14px;
        color: #e2e8f0;
        font-family: inherit;
        font-size: 0.9rem;
        cursor: pointer;
      }
      .jump-select select:focus {
        outline: none;
        border-color: #a78bfa;
      }

      /* Hızlı Kısayol Rozetleri */
      .quick-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 2rem;
      }
      .quick-chip {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 0.83rem;
        color: #cbd5e1;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      .quick-chip:hover {
        background: rgba(167, 139, 250, 0.15);
        border-color: rgba(167, 139, 250, 0.4);
        color: #fff;
        transform: translateY(-1px);
      }

      /* Bölüm & Madde Kartları */
      .kanun-bolum {
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        scroll-margin-top: 150px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      }
      .bolum-head {
        border-bottom: 2px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 1.25rem;
        margin-bottom: 1.75rem;
      }
      .bolum-no {
        font-size: 0.8rem;
        font-weight: 800;
        color: #a78bfa;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .bolum-baslik {
        font-size: 1.45rem;
        font-weight: 800;
        color: #fff;
        margin: 0;
      }

      .kanun-madde {
        background: rgba(255, 255, 255, 0.025);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 1.35rem 1.6rem;
        margin-bottom: 1.25rem;
        scroll-margin-top: 150px;
        transition: all 0.2s ease;
      }
      .kanun-madde:last-child {
        margin-bottom: 0;
      }
      .kanun-madde:hover {
        border-color: rgba(167, 139, 250, 0.3);
        background: rgba(255, 255, 255, 0.035);
      }
      .madde-head-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 0.85rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.07);
      }
      .madde-baslik-etiketi {
        font-size: 1.05rem;
        font-weight: 800;
        color: #c4b5fd;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .madde-paylas-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #94a3b8;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .madde-paylas-btn:hover {
        background: rgba(167, 139, 250, 0.2);
        border-color: #a78bfa;
        color: #fff;
      }
      .madde-metin {
        font-size: 0.95rem;
        line-height: 1.8;
        color: #cbd5e1;
      }
      .madde-metin p {
        margin: 0 0 0.85rem 0;
        text-indent: 1.25rem;
      }
      .madde-metin p:last-child {
        margin-bottom: 0;
      }
      .fıkra-no {
        font-weight: 800;
        color: #a78bfa;
        margin-right: 4px;
      }
      .bent-list {
        margin: 0.6rem 0 0.85rem 1.75rem;
        padding: 0;
        list-style-type: none;
      }
      .bent-list li {
        margin-bottom: 0.45rem;
        position: relative;
        padding-left: 1.25rem;
      }
      .bent-list li::before {
        content: 'a)';
        position: absolute;
        left: 0;
        color: #a78bfa;
        font-weight: 700;
        font-size: 0.88rem;
      }
      .bent-list li:nth-child(2)::before { content: 'b)'; }
      .bent-list li:nth-child(3)::before { content: 'c)'; }
      .bent-list li:nth-child(4)::before { content: 'd)'; }
      .bent-list li:nth-child(5)::before { content: 'e)'; }

      /* Kırmızı Çizgi / Dokunulmazlık Damgası */
      .dokunulmaz-madde {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(185, 28, 28, 0.02) 100%);
        border: 1px solid rgba(239, 68, 68, 0.35);
        position: relative;
      }
      .dokunulmaz-madde .madde-baslik-etiketi {
        color: #fca5a5;
      }
      .dokunulmaz-badge {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.4);
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      /* Resmî Ceza ve İntizam Cetveli Tablosu */
      .resmi-tablo-wrapper {
        overflow-x: auto;
        margin-top: 1.25rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.3);
      }
      .resmi-tablo {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 0.9rem;
      }
      .resmi-tablo th {
        background: rgba(167, 139, 250, 0.15);
        color: #c4b5fd;
        padding: 14px 18px;
        font-weight: 800;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        white-space: nowrap;
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 0.05em;
      }
      .resmi-tablo td {
        padding: 13px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: #cbd5e1;
      }
      .resmi-tablo tr:hover td {
        background: rgba(255, 255, 255, 0.025);
      }
      .yaptirim-ihrac {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.45);
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
        display: inline-block;
      }
      .yaptirim-uzaklasma {
        background: rgba(245, 158, 11, 0.25);
        color: #fcd34d;
        border: 1px solid rgba(245, 158, 11, 0.45);
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
        display: inline-block;
      }
      .yaptirim-susturma {
        background: rgba(99, 102, 241, 0.25);
        color: #c7d2fe;
        border: 1px solid rgba(99, 102, 241, 0.45);
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
        display: inline-block;
      }

      /* Resmî Mühür ve İmzalar */
      .resmi-imza-alani {
        background: linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(10, 10, 20, 0.98) 100%);
        border: 1px solid rgba(167, 139, 250, 0.3);
        border-radius: 16px;
        padding: 2.5rem 2rem;
        margin-top: 3.5rem;
        text-align: center;
        position: relative;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
      }
      .imza-ust-baslik {
        font-size: 1.25rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
      }
      .imza-aciklama {
        color: #94a3b8;
        font-size: 0.95rem;
        max-width: 700px;
        margin: 0 auto 2rem;
        line-height: 1.6;
      }
      .muhur-kutusu {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        padding: 1.5rem 3rem;
        background: rgba(0, 0, 0, 0.4);
        border: 2px dashed rgba(167, 139, 250, 0.5);
        border-radius: 16px;
        position: relative;
      }
      .muhur-kurum {
        font-size: 0.8rem;
        color: #94a3b8;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .muhur-imzaci {
        font-size: 1.45rem;
        font-weight: 900;
        color: #a78bfa;
        letter-spacing: 0.05em;
      }
      .muhur-unvan {
        font-size: 0.9rem;
        font-weight: 600;
        color: #cbd5e1;
        margin-top: 2px;
      }
      .muhur-kod {
        font-family: monospace;
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 10px;
        background: rgba(255, 255, 255, 0.03);
        padding: 2px 8px;
        border-radius: 4px;
      }

      .hidden-item {
        display: none !important;
      }
    </style>

    <div class="mevzuat-wrapper">
      <!-- RESMÎ BAŞLIK & METADATA -->
      <header class="resmi-header">
        <div class="resmi-emblem">🇹🇷 ⭐</div>
        <div class="resmi-state-title">EkoYıldız Dijital Topluluk Federasyonu</div>
        <h1 class="resmi-portal-title">EkoYıldız Topluluğu Anayasası</h1>
        
        <div class="resmi-metadata-grid">
          <div class="meta-item">
            <div class="meta-label">Mevzuat Türü</div>
            <div class="meta-value">Temel Anayasa Metni</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Mevzuat No</div>
            <div class="meta-value">2026/01</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Kabul Tarihi</div>
            <div class="meta-value">07 Temmuz 2026</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Yürürlük Durumu</div>
            <div class="meta-value" style="color: #34d399;">● Mer'iyette (Yürürlükte)</div>
          </div>
        </div>
      </header>

      <!-- BAŞLANGIÇ (PREAMBLE) -->
      <div class="preamble-card">
        <div class="preamble-title">📜 Başlangıç Hükümleri</div>
        EkoYıldız Topluluğu; dijital evrende bilginin, sürdürülebilirliğin, yapıcı tartışma kültürünün ve kolektif üretimin ön planda tutulduğu güvenli bir sosyal alan yaratmak, bireysel hürriyetler ile kamu düzeni arasındaki sarsılmaz dengeyi kurmak, adaleti ve insan onurunu güvence altına almak amacıyla işbu Anayasa'yı en üstün bağlayıcı normlar bütünü olarak kabul ve ilan eder.
      </div>

      <!-- NAVİGASYON VE ARAMA -->
      <div class="mevzuat-nav">
        <div class="search-container">
          <span class="search-icon-fixed">🔍</span>
          <input type="text" id="mevzuat-ara" placeholder="Madde no, fıkra veya terim ara (örn: Madde 4, Doxxing, Mute, Telif, KVKK)..." onkeyup="mevzuatAra()">
        </div>
        <div class="jump-select">
          <select id="mevzuat-bolum-sec" onchange="bolumeGit(this.value)">
            <option value="">⚡ Resmî Bölüm Fihristi...</option>
            <option value="#on-esaslar">📌 Ön Bilgilendirme ve Bağlayıcılık</option>
            <option value="#bolum-1">🏛️ KISIM I: Genel Hükümler ve Temel İlkeler (Md. 1-5)</option>
            <option value="#bolum-2">👑 KISIM II: Yönetim Teşkilatı ve Hiyerarşi (Md. 6-10)</option>
            <option value="#bolum-3">👥 KISIM III: Üyelik Statüsü ve Haklar (Md. 11-15)</option>
            <option value="#bolum-4">💬 KISIM IV: İletişim ve Genel İntizam (Md. 16-19)</option>
            <option value="#bolum-5">🛡️ KISIM V: Güvenlik, KVKK ve Yasaklar (Md. 20-24)</option>
            <option value="#bolum-6">⚖️ KISIM VI: Ceza ve Disiplin Hukuku (Md. 25-28)</option>
            <option value="#bolum-7">🎨 KISIM VII: Etkinlikler ve Ortak Eserler (Md. 29-32)</option>
            <option value="#bolum-8">🤝 KISIM VIII: Dış Münasebetler ve Temsil (Md. 33-36)</option>
            <option value="#bolum-9">🗳️ KISIM IX: Anayasa Değişiklik Usulü (Md. 37-41)</option>
            <option value="#bolum-10">📜 KISIM X: Yürürlük ve İcra Hükümleri (Md. 42-44)</option>
          </select>
        </div>
      </div>

      <!-- HIZLI KISAYOLLAR -->
      <div class="quick-chips">
        <a href="#on-esaslar" class="quick-chip">📌 Ön Esaslar</a>
        <a href="#bolum-1" class="quick-chip">Kısım I: İlkeler</a>
        <a href="#bolum-2" class="quick-chip">Kısım II: Yönetim</a>
        <a href="#bolum-3" class="quick-chip">Kısım III: Haklar</a>
        <a href="#bolum-5" class="quick-chip">Kısım V: Güvenlik</a>
        <a href="#ceza-cetveli" class="quick-chip" style="border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">⚖️ Resmî Ceza Cetveli</a>
        <a href="#madde-40" class="quick-chip" style="border-color: rgba(245, 158, 11, 0.4); color: #fcd34d;">🚨 Dokunulmaz Hükümler</a>
        <a href="#resmi-imzalar" class="quick-chip">✍️ Resmî Tasdik</a>
      </div>

      <!-- ÖN ESASLAR -->
      <section id="on-esaslar" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">BAŞLANGIÇ DÜZENLEMELERİ</div>
          <h2 class="bolum-baslik">📌 Ön Bilgilendirme ve Hukuki Bağlam</h2>
        </div>

        <div class="kanun-madde">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">I. Metnin Niteliği ve Hukuki Bağlamı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('on-esaslar')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> İşbu doküman, EkoYıldız Discord Topluluğu ("Topluluk") içerisindeki düzeni, iç barışı, etik standartları ve işleyiş hiyerarşisini belirleyen en üst düzey dijital mevzuattır.</p>
            <p><span class="fıkra-no">(2)</span> Metin içerisinde geçen "Anayasa" ifadesi, topluluğun iç bağlayıcı normlar hiyerarşisinin en üst basamağını temsil eden kavramsal ve hukuki bir tanımlamadır.</p>
            <p><span class="fıkra-no">(3)</span> Sunucuya katılan, üye doğrulama sistemini tamamlayan veya sunucu mecralarında bulunan her gerçek kişi bu Anayasa'nın tüm hükümlerini okumuş, anlamış ve kabul etmiş sayılır. Kuralları bilmemek mazeret teşkil etmez.</p>
          </div>
        </div>

        <div class="kanun-madde">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">II. Resmî Dil ve Yasak İtiraz Politikası</div>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> <strong>Resmî Dil:</strong> EkoYıldız Topluluğu'nun resmî iletişim ve etkileşim dili Türkçedir. Topluluk mecralarında Türkçe dışında dil kullanımı (özel diplomatik misafirler hariç) kısıtlanmıştır.</p>
            <p><span class="fıkra-no">(2)</span> <strong>Yargı Yolu ve İtiraz:</strong> Haksız bir yaptırıma uğradığını iddia eden her üye, resmî Destek Bilet Sistemi (Ticket) üzerinden üst kurula itiraz etme hakkına sahiptir.</p>
            <p><span class="fıkra-no">(3)</span> <strong>İntizam Şartı:</strong> Yetkili personelin kamu düzenini sağlamaya matuf meşru talimatlarına riayet zorunludur.</p>
          </div>
        </div>
      </section>

      <!-- KISIM I -->
      <section id="bolum-1" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM I</div>
          <h2 class="bolum-baslik">🏛️ Genel Hükümler, Topluluk Vizyonu ve Temel İlkeler</h2>
        </div>

        <div class="kanun-madde" id="madde-1">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 1 – Tanımlamalar ve Şümul (Kapsam)</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-1')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> İşbu Anayasa metninde geçen "Topluluk" veya "Sunucu" kavramı; EkoYıldız Discord platformu bünyesindeki tüm sesli, yazılı ve görsel kanalların bütününü ifade eder.</p>
            <p><span class="fıkra-no">(2)</span> Bu Anayasa hükümleri; kurucuları, üst yönetim kurulunu, moderasyon kadrosunu, teknik ekipleri, tüm kayıtlı üyeleri ve geçici ziyaretçileri istisnasız bağlar.</p>
            <p><span class="fıkra-no">(3)</span> Anayasa'nın bağlayıcılığı, topluluğa bağlı resmi sosyal medya hesapları, alt sunucular ve EkoYıldız namına düzenlenen tüm resmi faaliyetlerde caridir.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-2">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 2 – Topluluğun Gayesi, Ahlaki Çerçevesi ve Siyasetsizlik İlkesi
              <span class="dokunulmaz-badge">DOKUNULMAZ HÜKÜM</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-2')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Topluluğu; üyelerinin bilgi birikimini artırmayı, fikir teatisinde bulunabileceği emniyetli ve medeni bir mecra tesis etmeyi, ortak projeler üretmeyi hedefler.</p>
            <p><span class="fıkra-no">(2)</span> <strong>Siyasetsizlik ve Tarafsızlık:</strong> EkoYıldız Topluluğu hiçbir siyasi fırkaya, ticari zümreye veya dini teşekküle bağlı değildir. Topluluk mecralarında siyasi propaganda veya ticari çıkar sağlama gayesi güdülemez.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-3">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 3 – Anayasanın Üstünlüğü ve Normlar Hiyerarşisi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-3')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Anayasası hükümleri, sunucu içerisindeki tüm alt yönergelerin, kanal kurallarının, sözlü emirlerin ve moderasyon teamüllerinin fevkindedir (üstündedir).</p>
            <p><span class="fıkra-no">(2)</span> Anayasa hükümlerine aykırı hiçbir talimat verilemez, idari karar ittihaz olunamaz.</p>
            <p><span class="fıkra-no">(3)</span> <strong>Kanunların Geriye Yürümezliği:</strong> Yapılan mevzuat değişiklikleri ilan edildiği tarihten itibaren muteber olup; geçmişe şamil olarak geriye dönük ceza tayin edilemez.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-4">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 4 – Temel İnsan Hakları, Eşitlik ve Ayrımcılık Yasağı
              <span class="dokunulmaz-badge">DOKUNULMAZ HÜKÜM</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-4')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Topluluk nezdinde herkes; dil, ırk, renk, cinsiyet, siyasi düşünce, felsefi inanç, din, mezhep ve benzeri sebeplerle ayrım gözetilmeksizin kanun önünde eşittir.</p>
            <p><span class="fıkra-no">(2)</span> İnsan haysiyet ve şerefine yönelik her türlü tahkir, nefret söylemi, siber zorbalık, taciz ve hedef gösterme fiilleri <strong>doğrudan süresiz ihraç (kalıcı ban)</strong> ile cezalandırılır.</p>
            <p><span class="fıkra-no">(3)</span> Düşünce ve ifade hürriyeti; başkalarının haklarını ihlal etme veya kamu düzenini bozma cüretini bahşetmez.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-5">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 5 – Topluluk Kimliği ve Ekolojik Denge İlkesi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-5')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız'ın her ferdi, ortak huzur iklimini muhafaza etmekle mükelleftir. Yapıcı tenkit teşvik edilir; lakin yıkıcı ve toksik tavırlar intizama aykırı addolunur.</p>
            <p><span class="fıkra-no">(2)</span> "EkoYıldız" mefhumu, doğa ile dijital dünya arasındaki ahenkten ilham alır; paylaşımlarda etik ve medeni prensiplere riayet esastır.</p>
          </div>
        </div>
      </section>

      <!-- KISIM II -->
      <section id="bolum-2" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM II</div>
          <h2 class="bolum-baslik">👑 Yönetim Teşkilatı, Moderasyon Hiyerarşisi ve Yetki Taksimi</h2>
        </div>

        <div class="kanun-madde" id="madde-6">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 6 – Yönetim Erki ve Şeffaflık Prensibi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-6')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Yönetim organları yetkilerini doğrudan Anayasa'dan ve kamu düzenini muhafaza vazifesinden alır. Hiçbir merci veya şahıs Anayasa'dan kaynaklanmayan bir idari yetkiyi kullanamaz.</p>
            <p><span class="fıkra-no">(2)</span> Yetkinin kötüye kullanılması, keyfi cezalandırma veya şahsi husumetlerin icrası kesin surette memnudur (yasaktır).</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-7">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 7 – İdari Teşkilat ve Hiyerarşik Kadrolar</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-7')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız İdari Yapılanması şu yetkili mercilerden müteşekkildir:</p>
            <ul class="bent-list">
              <li><strong>Kurucular Kurulu (Founders):</strong> En üst karar, temsil ve nihai veto makamıdır.</li>
              <li><strong>Sunucu Yöneticileri (Administrators):</strong> Günlük idari ve operasyonel işleyişi yürüten üst düzey makamdır.</li>
              <li><strong>Moderatörler (Moderators):</strong> Sahada intizamı temin eden, ilk müdahale ve tahkikat yetkisine haiz heyettir.</li>
              <li><strong>Teknik ve Sistem Heyeti (Developers & Bot Managers):</strong> Altyapı ve siber emniyeti sevk ve idare eden teknik kuruldur.</li>
              <li><strong>Aday Moderatörler (Trial Staff):</strong> Nezaret altında vazife ifa eden stajyer kadrodur.</li>
            </ul>
          </div>
        </div>

        <div class="kanun-madde" id="madde-8">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 8 – Tarafsızlık ve Delil Mecburiyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-8')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Moderasyon heyeti yaptırım tayin ederken tarafsızlık ve eşitlik ilkelerine riayetle mükelleftir.</p>
            <p><span class="fıkra-no">(2)</span> <strong>İspat Mecburiyeti:</strong> Tatbik edilen tüm disiplin muameleleri; ekran görüntüsü, ses kaydı veya sistem kütüğü (log) ile tevsik edilerek resmî arşivde muhafaza edilir. Kanıtsız yaptırımlar hükümsüzdür.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-9">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 9 – İdari Denetim ve Görevden El Çektirme</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-9')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Yetkisini kötüye kullanan, üyelere kaba muamelede bulunan veya gizli idari kayıtları ifşa eden görevlilere sırasıyla: İhtar, Yetki Askısı ve Azil (İhraç) cezaları tatbik edilir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-10">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 10 – Hak Arama Hürriyeti ve İtiraz Süreci</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-10')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Her üye, idari bir karara karşı 48 saat zarfında Destek Sistemi üzerinden gerekçeli itiraz hakkını haizdir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM III -->
      <section id="bolum-3" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM III</div>
          <h2 class="bolum-baslik">👥 Üyelik Statüsü, Temel Haklar ve Rol Düzeni</h2>
        </div>

        <div class="kanun-madde" id="madde-11">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 11 – Üyelik Sıfatı ve Şahsi Sorumluluk</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-11')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Doğrulama prosedürünü ikmal eden her ferd "Topluluk Üyesi" sıfatını iktisap eder.</p>
            <p><span class="fıkra-no">(2)</span> Her üye kendi hesabının emniyetinden ve hesabı vasıtasıyla vuku bulan tüm eylemlerden şahsen ve münhasıran mesuldür.</p>
            <p><span class="fıkra-no">(3)</span> Yaptırımdan kaçmak veya nizama hile karıştırmak kastıyla yan hesap (alt account) kullanılması mutlak surette yasaktır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-12">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 12 – Üyelerin Temel Hak ve Teminatları</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-12')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Üyeler; güvenli ve sükun dolu bir dijital ortamda bulunma, bilgiye erişme, adil yargılanma ve mahremiyetin korunması haklarına sahiptir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-13">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 13 – Üyelerin Temel Vecibeleri (Ödevleri)</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-13')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Üyeler, Anayasa kurallarına tam riayet etmek, nezaket hudutlarını muhafaza etmek ve kamu huzurunu bozucu fiillerden ictinap etmekle (kaçınmakla) mükelleftir.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-14">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 14 & 15 – Rol Sistemi ve Ticaret Yasağı</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-14')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sunucu içi idari unvanlar ve özel statü rolleri hiçbir surette maddi menfaat, para veya takas mukabilinde satılamaz ve devredilemez.</p>
          </div>
        </div>
      </section>

      <!-- KISIM IV -->
      <section id="bolum-4" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM IV</div>
          <h2 class="bolum-baslik">💬 Genel İntizam, Yazılı ve Sesli Muhabere Kuralları</h2>
        </div>

        <div class="kanun-madde" id="madde-16">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 16 & 17 – Muhabere Âdabı, Chat Düzeni ve Reklam Memnuiyeti</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-16')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Ağır sövgü, şahsa ve mukaddesata hakaret, taşkınlık, spam ve flood kesin cezai yaptırıma tabidir.</p>
            <p><span class="fıkra-no">(2)</span> <strong>Ticari Reklam Yasağı:</strong> Yetkisiz harici sunucu daveti, referanslı link veya ticari reklam yayılması yasaktır.</p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-18">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 18 & 19 – Sesli Kanallar ve Profil Standartları</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-18')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Sesli odalarda başkalarını rahatsız edici gürültü yapmak, ses değiştirici/soundboard suistimali ve izinsiz ses kaydı almak yasaktır.</p>
            <p><span class="fıkra-no">(2)</span> Kullanıcı profillerinde müstehcen, gayriahlaki veya tahrik edici unsurlar barındırılamaz.</p>
          </div>
        </div>
      </section>

      <!-- KISIM V -->
      <section id="bolum-5" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM V</div>
          <h2 class="bolum-baslik">🛡️ Siber Emniyet, Kişisel Veriler (KVKK) ve Yasaklı Fiiller</h2>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-20">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 20 – Kişisel Verilerin Korunması ve Doxxing Yasağı
              <span class="dokunulmaz-badge">DOKUNULMAZ HÜKÜM</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-20')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Gerçek şahısların kimlik bilgileri, T.C. kimlik numarası, ikametgahı, telefon numarası, fotoğrafı veya özel hayatın gizliliğini ihlal eden herhangi bir verinin izinsiz neşredilmesi (Doxxing) mutlak surette yasaktır.</p>
            <p><span class="fıkra-no">(2)</span> Bu hükmü ihlal eden fail, <strong>ihtarsız olarak süresiz ihraç (Perm-Ban)</strong> edilir ve lüzumu halinde adli mercilere suç duyurusunda bulunulur.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-22">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 22 & 23 – Müstehcenlik (NSFW), Şiddet ve Bilişim Suçları
              <span class="dokunulmaz-badge">AĞIR SUÇ</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-22')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Pornografik materyal, vahşet/kan (gore) içerikleri, zararlı yazılım (trojan, token grabber, phishing) dağıtımı derhal kalıcı ihraç sebebidir.</p>
          </div>
        </div>
      </section>

      <!-- KISIM VI: RESMÎ CEZA CETVELİ -->
      <section id="bolum-6" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM VI</div>
          <h2 class="bolum-baslik">⚖️ Ceza ve Disiplin Hukuku, Yaptırım Cetveli</h2>
        </div>

        <div class="kanun-madde" id="madde-25">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 25 & 26 – Suçta ve Cezada Kanunilik Prensibi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-25')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Anayasa ve bağlı mevzuatta açıkça suç sayılmayan bir eylemden dolayı kimseye yaptırım uygulanamaz.</p>
            <p><span class="fıkra-no">(2)</span> Disiplin cezaları: Uyarı (Warn), Süreli Susturma (Mute), İntizam Karantinası, Sunucudan Çıkarma (Kick), Süreli İhraç (Temp-Ban) ve Kalıcı İhraç (Perm-Ban) türlerinden ibarettir.</p>
          </div>
        </div>

        <!-- CETVEL TABLOSU -->
        <div class="kanun-madde" id="ceza-cetveli">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 27 – Resmî İntizam ve Ceza Cetveli (Yaptırım Matrisi)</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('ceza-cetveli')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Fiillerin ağırlığı ve tekerrürü halinde tatbik olunacak standart cezalar aşağıda gösterilmiştir:</p>
            
            <div class="resmi-tablo-wrapper">
              <table class="resmi-tablo">
                <thead>
                  <tr>
                    <th>İhlal ve Cürüm Türü</th>
                    <th>Birinci Derece (İlk İhlal)</th>
                    <th>İkinci Derece (Tekerrür)</th>
                    <th>Üçüncü Derece (İtiyadi Cürüm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Spam / Flood / Büyük Harf Taşkınlığı</strong></td>
                    <td><span class="yaptirim-susturma">İhtar + 10 Dk Susturma</span></td>
                    <td><span class="yaptirim-susturma">1 Saat Susturma</span></td>
                    <td><span class="yaptirim-susturma">24 Saat Susturma / Kick</span></td>
                  </tr>
                  <tr>
                    <td><strong>Kanal Dışı İletişim (Off-Topic)</strong></td>
                    <td>Sözlü / Yazılı İhtar</td>
                    <td><span class="yaptirim-susturma">30 Dk Susturma</span></td>
                    <td><span class="yaptirim-susturma">2 Saat Susturma</span></td>
                  </tr>
                  <tr>
                    <td><strong>Kamu Görevlilerini Taciz / Sebepsiz Ping</strong></td>
                    <td>Yazılı İhtar</td>
                    <td><span class="yaptirim-susturma">1 Saat Susturma</span></td>
                    <td><span class="yaptirim-susturma">24 Saat Susturma</span></td>
                  </tr>
                  <tr>
                    <td><strong>Huzur ve Sükûnu Bozma / Hafif Argo</strong></td>
                    <td>Yazılı İhtar</td>
                    <td><span class="yaptirim-susturma">2 Saat Susturma</span></td>
                    <td><span class="yaptirim-uzaklasma">1 Gün Süreli İhraç</span></td>
                  </tr>
                  <tr>
                    <td><strong>Şahsa ve Ailevi Mukaddesata Ağır Küfür</strong></td>
                    <td><span class="yaptirim-uzaklasma">1 Gün Süreli İhraç</span></td>
                    <td><span class="yaptirim-uzaklasma">7 Gün Süreli İhraç</span></td>
                    <td><span class="yaptirim-ihrac">Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>İzinsiz Reklam / Propaganda</strong></td>
                    <td><span class="yaptirim-susturma">Mesaj İptali + 1 Gün Mute</span></td>
                    <td><span class="yaptirim-uzaklasma">7 Gün Süreli İhraç</span></td>
                    <td><span class="yaptirim-ihrac">Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Fikri Mülkiyet ve Korsan Paylaşımı</strong></td>
                    <td>İçerik İptali + İhtar</td>
                    <td><span class="yaptirim-uzaklasma">1 Gün Süreli İhraç</span></td>
                    <td><span class="yaptirim-uzaklasma">7 Gün Süreli İhraç</span></td>
                  </tr>
                  <tr>
                    <td><strong>Doxxing / Kişisel Veri İfşası (KVKK)</strong></td>
                    <td colspan="3"><span class="yaptirim-ihrac">🚨 Derhal ve Doğrudan Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Müstehcenlik / NSFW İçerik Neşri</strong></td>
                    <td colspan="3"><span class="yaptirim-ihrac">🚨 Derhal ve Doğrudan Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Zararlı Yazılım / Oltalama (Phishing)</strong></td>
                    <td colspan="3"><span class="yaptirim-ihrac">🚨 Derhal ve Doğrudan Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Nefret Söylemi ve Ağır Ayrımcılık</strong></td>
                    <td><span class="yaptirim-uzaklasma">7 Gün Süreli İhraç</span></td>
                    <td colspan="2"><span class="yaptirim-ihrac">Kalıcı İhraç (Perm-Ban)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Yan Hesapla Cezadan Kaçınma Gayesi</strong></td>
                    <td><span class="yaptirim-uzaklasma">Asıl ve Yan Hesap 7 Gün Ban</span></td>
                    <td colspan="2"><span class="yaptirim-ihrac">Tüm Hesaplar İçin Kalıcı İhraç</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="kanun-madde" id="madde-28">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 28 – Sicil Temizliği ve İnfaz İndirimi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-28')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> 6 ay süreyle yeni bir disiplin cezası almayan üyelerin hafif sicil kayıtları arşive kaldırılır.</p>
            <p><span class="fıkra-no">(2)</span> Doxxing, sabotaj ve pornografi fiilleri hiçbir af kapsamına dahil edilemez.</p>
          </div>
        </div>
      </section>

      <!-- KISIM VII - X -->
      <section id="bolum-7" class="kanun-bolum">
        <div class="bolum-head">
          <div class="bolum-no">KISIM VII – X</div>
          <h2 class="bolum-baslik">📜 Ortak Projeler, Dış İlişkiler ve Anayasa Değişikliği</h2>
        </div>

        <div class="kanun-madde" id="madde-33">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 33 & 34 – Temsil Salahiyeti ve Partnerlik Akdi</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-33')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> EkoYıldız Topluluğu'nu dış mecralarda temsil yetkisi münhasıran Kurucular Kurulu ve yetkilendirilmiş Dış Temsilcilere aittir.</p>
          </div>
        </div>

        <div class="kanun-madde dokunulmaz-madde" id="madde-40">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">
              MADDE 40 – Değiştirilemez Hükümler (Kırmızı Çizgiler)
              <span class="dokunulmaz-badge">MUTLAK DOKUNULMAZLIK</span>
            </div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-40')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> Anayasa'nın;</p>
            <ul class="bent-list">
              <li><strong>Madde 2:</strong> Siyasetsizlik, Bağımsızlık ve Ahlaki Amaç,</li>
              <li><strong>Madde 4:</strong> Temel İnsan Hakları ve Ayrımcılık Yasağı,</li>
              <li><strong>Madde 20:</strong> Kişisel Verilerin Korunması ve Doxxing Yasağı,</li>
            </ul>
            <p>hükümleri <strong>değiştirilemez ve değiştirilmesi teklif dahi edilemez.</strong></p>
          </div>
        </div>

        <div class="kanun-madde" id="madde-42">
          <div class="madde-head-row">
            <div class="madde-baslik-etiketi">MADDE 42, 43 & 44 – Yürürlük ve İcra</div>
            <button class="madde-paylas-btn" onclick="maddeKopyala('madde-42')">🔗 Link</button>
          </div>
          <div class="madde-metin">
            <p><span class="fıkra-no">(1)</span> İşbu Anayasa metni 10 Kısım ve 44 Maddeden ibaret olup, Resmî Duyuru kanalında neşredildiği an itibarıyla mer'iyete girmiştir.</p>
            <p><span class="fıkra-no">(2)</span> Bu Anayasa hükümlerini icraya Kurucular Kurulu ve Yüksek Yönetim Heyeti yetkilidir.</p>
          </div>
        </div>
      </section>

      <!-- RESMÎ İMZA VE MÜHÜR ALANI -->
      <div class="resmi-imza-alani" id="resmi-imzalar">
        <div class="imza-ust-baslik">YÜKSEK TASDİK VE İCRA MAKAMI</div>
        <p class="imza-aciklama">
          İşbu EkoYıldız Topluluğu Anayasası, Kurucular Kurulu ve Yönetim Heyeti tarafından oy birliği ile kabul edilerek yürürlüğe konulmuştur.
        </p>

        <div class="muhur-kutusu">
          <div class="muhur-kurum">EkoYıldız Yüksek Kurucular Kurulu</div>
          <div class="muhur-imzaci">ekonqt</div>
          <div class="muhur-unvan">👑 Kurucu & Heyet Başkanı</div>
          <div class="muhur-kod">E-İMZA NO: EYA-2026-0707-TURKISH-RP-OFFICIAL</div>
        </div>
      </div>
    </div>

    <!-- İNTERAKTİF İSTEMCİ SCRİPTİ -->
    <script>
      function bolumeGit(secici) {
        if (!secici) return;
        const hedef = document.querySelector(secici);
        if (hedef) {
          hedef.scrollIntoView({ behavior: 'smooth' });
        }
      }

      function maddeKopyala(maddeId) {
        const link = window.location.origin + window.location.pathname + '#' + maddeId;
        navigator.clipboard.writeText(link).then(() => {
          if (typeof showToast === 'function') {
            showToast('Resmî Madde Bağlantısı Kopyalandı!', 'success');
          } else {
            alert('Madde Bağlantısı: ' + link);
          }
        }).catch(() => {
          prompt('Madde Bağlantısı:', link);
        });
      }

      function mevzuatAra() {
        const kelime = document.getElementById('mevzuat-ara').value.toLowerCase().trim();
        const maddeler = document.querySelectorAll('.kanun-madde');
        const bolumler = document.querySelectorAll('.kanun-bolum');

        if (!kelime) {
          maddeler.forEach(m => m.classList.remove('hidden-item'));
          bolumler.forEach(b => b.classList.remove('hidden-item'));
          return;
        }

        bolumler.forEach(bolum => {
          let bolumdeVar = false;
          const bolumMaddeleri = bolum.querySelectorAll('.kanun-madde');

          bolumMaddeleri.forEach(madde => {
            const metin = madde.innerText.toLowerCase();
            if (metin.includes(kelime)) {
              madde.classList.remove('hidden-item');
              bolumdeVar = true;
            } else {
              madde.classList.add('hidden-item');
            }
          });

          if (bolumdeVar) {
            bolum.classList.remove('hidden-item');
          } else {
            bolum.classList.add('hidden-item');
          }
        });
      }
    </script>
  `;

  const { _layout } = require("../views");
  return _layout("EkoYıldız Topluluğu Resmî Anayasası & Mevzuat Portalı", user, content, "", "/anayasasi");
}

module.exports = {
  renderEkoYildizAnayasaPage
};
