function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sosyal Kanıt Bildirimi Sistemi — tüm formlara inject edilecek HTML+JS bloğu
 * Gerçekçi RP bildirimleri gösterir: "4 kişi daha dolduruyor", "1 kişi gönderdi", "Toplam: X"
 */
function _socialProofScript(formLabel = 'bu formu') {
  const names = ['Alper_xz', 'Raven_TR', 'stormcloud', 'elora42', 'ByteKing', 'NovaStar', 'mirela.d', '0xGhost', 'SkyBreaker', 'kiral_', 'zephyr99', 'nocturn_', 'veilstrike', 'emre.sys', 'Phantom_K', 'LunaBot', 'IronMark', 'Serafino', 'd4rkv0id', 'QuantumNx'];
  const submitMessages = [
    'formu doldurdu ve gönderdi.',
    'başvurusunu tamamlayıp gönderdi.',
    'son bölümü bitirip başvurusunu iletti.',
    'tüm aşamaları geçip gönderdi.',
    'değerlendirme için başvurusunu teslim etti.'
  ];
  const fillMessages = [
    'şu an bu formu dolduruyor.',
    'formu inceliyor ve dolduruyor.',
    'başvurusunu aktif olarak hazırlıyor.',
    'formla ilgileniyor.',
    'başvuruyu şu an yazıyor.'
  ];

  return `
<div id="sp-container" style="position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:320px;"></div>
<div id="sp-counter" style="position:fixed;bottom:24px;left:24px;z-index:9999;background:rgba(15,15,25,0.92);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:10px 16px;backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,0.5);pointer-events:none;display:flex;flex-direction:column;gap:4px;">
  <div style="font-size:0.7rem;color:#818cf8;font-weight:800;letter-spacing:1px;text-transform:uppercase;">📊 ALIM İSTATİSTİKLERİ</div>
  <div style="font-size:0.78rem;color:#a0aec0;">Şu an dolduruyor: <span id="sp-active" style="color:#34d399;font-weight:700;">…</span></div>
  <div style="font-size:0.78rem;color:#a0aec0;">Toplam gönderilen: <span id="sp-total" style="color:#fbbf24;font-weight:700;">…</span></div>
  <div style="font-size:0.78rem;color:#a0aec0;">Tahmini kalan kontenjan: <span id="sp-quota" style="color:#fb7185;font-weight:700;">…</span></div>
</div>
<style>
@keyframes sp-slidein { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
@keyframes sp-fadeout { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(40px); } }
.sp-toast { animation: sp-slidein 0.35s cubic-bezier(.22,1,.36,1) forwards; background:rgba(15,15,25,0.95); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:10px 14px; display:flex; align-items:flex-start; gap:10px; backdrop-filter:blur(24px); box-shadow:0 8px 32px rgba(0,0,0,0.5); pointer-events:none; }
.sp-toast.leaving { animation: sp-fadeout 0.35s ease forwards; }
.sp-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#818cf8,#6366f1); display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800; color:#fff; flex-shrink:0; }
</style>
<script>
(function() {
  var names = ${JSON.stringify(names)};
  var submitMsgs = ${JSON.stringify(submitMessages)};
  var fillMsgs = ${JSON.stringify(fillMessages)};
  var container = document.getElementById('sp-container');
  var elActive = document.getElementById('sp-active');
  var elTotal = document.getElementById('sp-total');
  var elQuota = document.getElementById('sp-quota');

  // Başlangıç sayıları — formun "hareketli" hissi için rastgele ama gerçekçi
  var totalSent = Math.floor(Math.random() * 18) + 14;  // 14-31 arası
  var activeNow = Math.floor(Math.random() * 5) + 2;    // 2-6 arası
  var quota = Math.floor(Math.random() * 4) + 2;        // 2-5 arası

  function updateCounter() {
    if (elActive) elActive.textContent = activeNow + ' kişi';
    if (elTotal) elTotal.textContent = totalSent + ' kişi';
    if (elQuota) elQuota.textContent = quota + ' kişi';
  }
  updateCounter();

  function randName() { return names[Math.floor(Math.random() * names.length)]; }
  function randColor() { var c=['#818cf8','#a78bfa','#34d399','#fbbf24','#fb7185','#38bdf8']; return c[Math.floor(Math.random()*c.length)]; }

  function showToastSP(icon, text, subtext, color) {
    if (!container) return;
    var t = document.createElement('div');
    t.className = 'sp-toast';
    var initials = (text.split('_')[0]||'?').substring(0,2).toUpperCase();
    t.innerHTML = '<div class="sp-avatar" style="background:linear-gradient(135deg,'+color+','+color+'99);">' + initials + '</div>' +
      '<div><div style="font-size:0.82rem;color:#e2e8f0;font-weight:700;margin-bottom:2px;">' + text + '</div>' +
      '<div style="font-size:0.74rem;color:#718096;">' + subtext + '</div></div>';
    container.appendChild(t);
    setTimeout(function() {
      t.classList.add('leaving');
      setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 5000);
  }

  // İlk yüklemede 8-15sn sonra başla
  var delay = (Math.random() * 7000) + 8000;

  function scheduleNext() {
    var interval = (Math.random() * 22000) + 12000; // 12-34sn arası
    setTimeout(function() {
      var name = randName();
      var color = randColor();
      var type = Math.random();
      if (type < 0.35) {
        // Birisi gönderdi
        totalSent++;
        if (quota > 1) quota--;
        if (activeNow > 0) activeNow--;
        showToastSP('✅', name, '✅ ' + submitMsgs[Math.floor(Math.random()*submitMsgs.length)], color);
      } else if (type < 0.75) {
        // Birisi dolduruyor
        activeNow = Math.max(1, activeNow + (Math.random() > 0.5 ? 1 : 0));
        var n2 = Math.floor(Math.random()*3)+1;
        showToastSP('✍️', name, '✍️ '+n2+' kişi daha ${formLabel} dolduruyor.', color);
      } else {
        // Birinin başvurusu incelemeye alındı
        showToastSP('🔍', name, '🔍 Başvurusu inceleme sürecine alındı.', color);
      }
      updateCounter();
      scheduleNext();
    }, interval);
  }

  setTimeout(function() {
    // İlk bildirim: kaç kişinin aktif olduğu
    showToastSP('👥', activeNow + ' kişi', '👥 Şu an ${formLabel} dolduruyor.', '#818cf8');
    updateCounter();
    scheduleNext();
  }, delay);
})();
</script>`;
}

function renderEventStaffFormPage(currentUser, existingSubmission = null) {
  const _layout = require('./views')._layout;
  const isLoggedIn = Boolean(currentUser);
  const usernameStr = currentUser ? (currentUser.discordUsername || currentUser.username || '') : '';
  const BANNER = 'https://i.imgur.com/PeLUdcU.jpeg';

  // Helper to build a step section with header-bar + collapsible body
  function _step(num, color, title, subtitle, bodyHtml, navHtml) {
    const hidden = num > 1 ? 'display:none;' : '';
    return `
      <div id="form-step-${num}" class="form-step card" style="border-radius:20px;border-left:4px solid ${color};${hidden}transition:all 0.3s;">
        <div class="step-header-bar" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" onclick="toggleStep(${num})">
          <div>
            <h3 style="font-size:1.1rem;font-weight:800;color:${color};margin-bottom:0.2rem;">${title}</h3>
            <p style="font-size:0.78rem;color:var(--muted);margin:0;">${subtitle}</p>
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem;">
            <span class="step-done-badge" style="display:none;background:${color}20;color:${color};font-size:0.72rem;font-weight:800;padding:0.25rem 0.7rem;border-radius:20px;border:1px solid ${color}40;">✓ TAMAMLANDI</span>
            <span class="step-expand-btn" style="display:none;color:${color};font-size:1.2rem;cursor:pointer;" title="Genişlet / Daralt">▼</span>
          </div>
        </div>
        <div class="step-body" style="margin-top:1rem;">
          ${bodyHtml}
          <div class="step-nav" style="display:flex;justify-content:${num === 1 ? 'flex-end' : 'space-between'};margin-top:1.5rem;">
            ${navHtml}
          </div>
        </div>
      </div>`;
  }

  // Field builder helper
  function _field(id, label, placeholder, rows) {
    return `
      <div class="form-group" style="margin-bottom:1.2rem;">
        <label class="field-label">${label} *</label>
        <textarea id="${id}" class="input-field track-field" data-field="${id}" rows="${rows || 3}" required placeholder="${placeholder}"></textarea>
        <div class="field-hint" id="hint-${id}" style="font-size:0.72rem;color:var(--muted);margin-top:0.25rem;min-height:16px;"></div>
      </div>`;
  }

  const prevBtn = (n) => `<button type="button" onclick="prevStep(${n})" class="btn btn-ghost" style="font-size:0.9rem;">← Önceki Bölüm</button>`;
  const nextBtn = (n, color, grad) => `<button type="button" onclick="nextStep(${n})" class="btn" style="background:linear-gradient(135deg,${grad});color:#fff;font-weight:700;padding:0.7rem 1.8rem;border-radius:24px;border:none;cursor:pointer;font-family:inherit;">Sonraki Bölüm →</button>`;

  // ═══ BÖLÜM 1 ═══
  const step1Body = `
    <div style="background:rgba(129,140,248,0.06);border-left:3px solid #818cf8;padding:1.2rem 1.5rem;border-radius:0 14px 14px 0;font-size:0.9rem;color:var(--muted);line-height:1.85;margin-bottom:1.5rem;">
      <strong style="color:#818cf8;font-size:0.95rem;">1.1 — KİMLİK VE İLETİŞİM BİLGİLERİ</strong><br><br>
      Başvuru formunun ilk ve en kritik bölümünde, kimliğinizin güvenilir biçimde doğrulanabilmesi, mülakat takviminin oluşturulabilmesi, sistem bildirimleri ve bot entegrasyonunun hatasız çalışabilmesi için bazı temel ön bilgiler talep edilmektedir. Bu bilgiler; yalnızca EkoYıldız Etkinlik Yönetim Komisyonu tarafından, başvurunuzun değerlendirilmesi, iletişim sürecinin sağlıklı yürütülmesi ve idari arşiv kayıtlarının tutulması amacıyla kullanılacaktır.<br><br>
      Lütfen sizden istenen tüm bilgileri eksiksiz, güncel, tutarlı ve doğru bir biçimde doldurunuz. Bilgilerin doğruluğundan ve güncelliğinden yalnızca başvuru sahibi sorumludur. Eksik, hatalı, tutarsız veya yanıltıcı bilgi girişi; başvurunun hiçbir açıklama yapılmaksızın geçersiz sayılmasına ve kara liste kaydına alınmanıza neden olabilir.<br><br>
      <span style="color:#fbbf24;">⚠️ Önemli Uyarı:</span> Discord Kullanıcı Adı ve Discord ID bilgileriniz, başvurunuzun sisteme kayıt edilmesi ve mülakat bildirimlerinin gönderilebilmesi açısından zorunludur. Bu bilgiler eksik veya yanlış girildiğinde başvurunuz <strong>değerlendirmeye alınmayacaktır.</strong>
    </div>
    <div class="form-group" style="margin-bottom:1.2rem;">
      <label class="field-label">DISCORD KULLANICI ADI (USERNAME) *<br><span style="font-weight:400;font-size:0.8rem;color:var(--muted);line-height:1.7;">Discord hesabınızın tam ve güncel kullanıcı adını giriniz. Yeni Discord sistemi (2023 sonrası) kullanıcı adı formatında ise yalnızca kullanıcı adınızı (örn: ekonqtx), eski format kullanıyorsanız "İSİM#ETIKET" şeklinde (örn: ekonqtx#1234) yazınız. Sunucuda farklı bir görünen ad (display name) kullanıyorsanız, lütfen bunu da parantez içinde belirtiniz.</span></label>
      <input type="text" id="q_discord" class="input-field track-field" data-field="discord_username" value="${_esc(usernameStr)}" required placeholder="Örn: ekonqtx — veya — ekonqtx#1234">
      <div class="field-hint" id="hint-q_discord" style="font-size:0.72rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
    </div>
    <div class="form-group" style="margin-bottom:1.2rem;">
      <label class="field-label">DISCORD ID (18 HANE — NUMERİK KOD) *<br><span style="font-weight:400;font-size:0.8rem;color:var(--muted);line-height:1.7;">Discord ID'niz, hesabınıza ait 18 haneli benzersiz numerik tanımlayıcıdır. Bu bilgi; mülakat takvimi bildirimleri, bot sistemi entegrasyonu ve idari kayıt amacıyla kullanılmaktadır. Discord ID'nizi öğrenmek için: Discord'da Geliştirici Modu'nu etkinleştirin (Ayarlar → Gelişmiş → Geliştirici Modu = Açık), ardından profilinize sağ tıklayıp "Kullanıcı ID'sini Kopyala" seçeneğini kullanınız. ID rakamsal (numerik) formatta olmalı; @ işareti veya harf içermemelidir.</span></label>
      <input type="text" id="q_discord_id" class="input-field track-field" data-field="discord_id" value="${_esc(currentUser ? (currentUser.discordId || '') : '')}" required placeholder="Örn: 123456789012345678 (18 rakam)">
      <div class="field-hint" id="hint-q_discord_id" style="font-size:0.72rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label class="field-label">EkoYıldız SUNUCUSUNDA KULLANDIĞINIZ GÖRÜNEN AD (DISPLAY NAME) *<br><span style="font-weight:400;font-size:0.8rem;color:var(--muted);line-height:1.7;">EkoYıldız Discord sunucusunda profilinizde görünen ad nedir? Bu bilgi, komisyonun sizi sunucu içinde tanıyabilmesi ve değerlendirme sürecinde doğru profili inceleyebilmesi için gerekmektedir. Sunucuda birden fazla görünen ad kullandıysanız, en son güncellediğiniz ad ile yazınız.</span></label>
      <input type="text" id="q_display_name" class="input-field track-field" data-field="display_name" required placeholder="Örn: eko.nqtx veya Nqtx" value="${_esc(usernameStr)}">
      <div class="field-hint" id="hint-q_display_name" style="font-size:0.72rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
    </div>`;
  const step1 = _step(1, '#818cf8', 'BÖLÜM 1 — KİMLİK VE İLETİŞİM BİLGİLERİ', 'Discord kimliği, ID ve sunucu içi profil bilgileri — değerlendirme sürecinin temeli.', step1Body, nextBtn(1, '#818cf8', '#818cf8,#6366f1'));

  // ═══ BÖLÜM 2 ═══
  const step2Body = `
    <div style="background:rgba(167,139,250,0.06);border-left:3px solid #a78bfa;padding:1.2rem 1.5rem;border-radius:0 14px 14px 0;font-size:0.9rem;color:var(--muted);line-height:1.85;margin-bottom:1.5rem;">
      <strong style="color:#a78bfa;font-size:0.95rem;">2.1 — KİŞİSEL SORU HAVUZU & ADAYLIK PORTFÖYÜ</strong><br><br>
      Bu bölümde sizinle daha yakından tanışmayı hedefliyoruz. Aşağıdaki kişisel sorular; adayın bireysel kimliğini, motivasyon kaynaklarını, öz farkındalık düzeyini, takım dinamiklerine uyum kapasitesini ve EkoYıldız topluluğuna sağlayabileceği somut katma değeri ölçmek amacıyla tasarlanmıştır.<br><br>
      Verilen yanıtlar; yüzeysel, genel geçer veya birkaç cümleyle geçiştirilmiş olmayıp aday hakkında gerçek bir fikir edinilmesini sağlayacak özgün, içten ve bütünlüklü bir nitelik taşımalıdır. Yapay zekâ yardımıyla oluşturulmuş, kopyala-yapıştır yöntemiyle doldurulan veya şablondan uyarlanan cevaplar sistem tarafından otomatik olarak tespit edilmekte ve bu tür başvurular değerlendirme dışı bırakılmaktadır.<br><br>
      <span style="color:#fbbf24;">📌 Değerlendirme Notu:</span> Kişisel bölümdeki sorulara verilen yanıtların uzunluğu ve derinliği, komisyonun adayın kendini ifade etme kapasitesi hakkında fikir edinmesi açısından kritik önem taşımaktadır. Her soru için en az 4-6 cümle yazmanız beklenmektedir.
    </div>
    ${_field('q_p1', 'KİŞİSEL SORU 1 — Lütfen bize biraz kendinizden bahsediniz: Yaşınız, ilgi alanlarınız, günlük rutininiz ve EkoYıldız topluluğuna ilk kez ne zaman, nasıl adım attığınızı anlatınız. Toplulukta geçirdiğiniz süre zarfında en çok hangi etkinlik ya da etkileşimler sizi olumlu yönde etkiledi ve bu deneyimler sizi Etkinlik Sorumluluğu pozisyonuna başvurmaya nasıl yöneltti?', 'Yaşınız, ilgi alanlarınız, EkoYıldız macerınızın başlangıcı, toplulukta yaşadığınız en güzel deneyimler ve bu başvuruya sizi getiren süreç hakkında dürüst ve samimi bir anlatım yapınız. En az 5-6 cümle yazmanız beklenmektedir...', 5)}
    ${_field('q_p2', 'KİŞİSEL SORU 2 — Takım içindeki en güçlü yönleriniz ve katkı sağlayabileceğiniz alanlar nelerdir? Bunu destekleyen somut bir örnek ya da geçmişte bir toplulukta/sunucuda gerçekleştirdiğiniz ve gurur duyduğunuz bir katkıyı da paylaşınız. Güçlü yönlerinizin yanı sıra, kendinizde geliştirmek istediğiniz bir eksikliğinizi de dürüstçe belirtiniz.', 'Güçlü yönleriniz ve bunları destekleyen somut örnekler, ayrıca kendinizde farkında olduğunuz bir zayıf nokta ve bu konuda ne yaptığınızı detaylıca açıklayınız. Yüzeysel kalmayınız...', 5)}
    ${_field('q_p3', 'KİŞİSEL SORU 3 — EkoYıldız Etkinlik Sorumluluğu kadrosuna katıldığınızda takıma somut olarak ne getireceksiniz? Kuru bir liste yazmak yerine, bu özelliklerin pratikte nasıl yansıyacağını örneklerle açıklayınız. Takım içi uyum, iletişim tarzı ve çatışma yönetimi konularında kendinizi nasıl tanımlarsınız?', 'Takıma katkınızın somut tezahürleri, iletişim tarzınız ve farklı kişiliklerle çalışma deneyimlerinizi gerçekçi örneklerle açıklayınız...', 5)}
    ${_field('q_p4', 'KİŞİSEL SORU 4 — Neden Etkinlik Sorumluluğu pozisyonuna başvuruyorsunuz ve bu rolün size neden uygun olduğunu düşünüyorsunuz? EkoYıldız özelinde, mevcut etkinlik yapısını gözlemleyerek fark ettiğiniz eksiklikler veya geliştirilebilecek alanlar var mı? Eğer varsa bunları ve bu konuda nasıl bir katkı sağlayabileceğinizi açıklayınız. Bu rolü üstlenmenizin, kişisel gelişiminize ve EkoYıldız topluluğuna uzun vadede nasıl bir değer katacağını düşünüyorsunuz?', 'Bu rolü seçme motivasyonunuz, EkoYıldız etkinlik yapısına yönelik gözlemleriniz, olası katkılarınız ve uzun vadeli hedeflerinizi kapsamlı biçimde açıklayınız...', 6)}
    ${_field('q_p5', 'KİŞİSEL SORU 5 — Görev hiyerarşisine, direktiflere ve üst kademe kararlarına uyum konusunda kendinizi nasıl değerlendirirsiniz? Geçmişte bir otorite figürü veya üstünüzle yaşadığınız bir anlaşmazlık durumunu ve bu durumu nasıl yönettiğinizi örnek vererek anlatınız. Katılmadığınız bir karara nasıl yaklaşırsınız; direniş mi, ikna çabası mı yoksa uyum mu?', 'Hiyerarşiye uyum tarzınız, geçmişte yaşadığınız bir otorite/anlaşmazlık deneyimi ve katılmadığınız kararlara yaklaşımınızı dürüstçe açıklayınız...', 5)}
    ${_field('q_p6', 'KİŞİSEL SORU 6 — Başvurduğunuz Etkinlik Sorumluluğu pozisyonunun hangi sorumluluklarını taşıdığını tam olarak biliyor musunuz? Görevin sizi en çok hangi yönüyle zorladığını öngörüyorsunuz ve bu zorluğu aşmak için şu an hangi adımları atmaya hazırsınız? Ayrıca bu göreve ayırabileceğiniz haftalık aktif zaman dilimlerini ve aktivite planınızı belirtiniz.', 'Görevin beklentileri ve sorumluluklarına ilişkin farkındalığınız, öngördüğünüz zorluklar ve bunlara hazırlığınız ile haftalık müsaitlik planınızı detaylıca yazınız...', 5)}`;
  const step2 = _step(2, '#a78bfa', 'BÖLÜM 2 — KİŞİSEL SORU HAVUZU & ADAYLIK PORTFÖYÜ', 'Motivasyon, öz farkındalık, takım uyumu ve somut katkı kapasitesi değerlendirmesi.', step2Body, prevBtn(2) + nextBtn(2, '#a78bfa', '#a78bfa,#8b5cf6'));

  // ═══ BÖLÜM 3 ═══
  const step3Body = `
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #34d399;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      EkoYıldız Topluluk Sunucusu bünyesinde görev alacak Etkinlik Sorumluluğu adayları için hazırlanan bu teknik bilgi aşaması, etkinlik yetkilisi görevini yetkin, sorumluluk sahibi ve sunucu standartlarına uygun biçimde yerine getirebilecek kişilerin belirlenmesini amaçlamaktadır.<br><br>
      <strong>"Sorulara verilen nitelikli, tutarlı ve uygulamaya yönelik cevaplar, başvurunun olumlu değerlendirilmesinde belirleyici rol oynayacaktır."</strong>
    </div>
    ${_field('q_t1', 'TEKNİK SORU — EkoYıldız sunucusunda düzenlenen bir etkinlikte Etkinlik Sorumlusunun, moderasyon ekibi ve yönetim kadrosundan hangi yönleriyle ayrıldığını, hangi konularda doğrudan yetkili, hangi konularda ise yetkisiz olduğunu teknik ve yönetsel açıdan açıklayınız.', 'Yetki sınırları ve görev tanımı farklılıkları...', 4)}
    ${_field('q_t2', 'TEKNİK SORU — Etkinlik Sorumlusunun, etkinlik sırasında aldığı kararların sonradan tartışma konusu olmaması için hangi teknik kayıtları (log, ekran görüntüsü, yazılı duyuru vb.) tutması gerekir ve bu kayıtlar hangi durumlarda kullanılmalıdır?', 'Kayıt türleri ve kullanım durumları...', 4)}
    ${_field('q_t3', 'TEKNİK SORU — Sunucu dışı bir platformda düzenlenen EkoYıldız etkinliğinde, Etkinlik Sorumlusunun temsil yetkisi, iletişim dili ve bilgi paylaşım sınırları nasıl belirlenmelidir?', 'Dış platform prosedürleri ve iletişim sınırları...', 4)}
    ${_field('q_t4', 'TEKNİK SORU — Bir etkinlik sırasında, başka bir yetkilinin Etkinlik Sorumlusunun kararlarına açık şekilde müdahale etmesi veya yetki karmaşası yaratması durumunda; Etkinlik Sorumlusu bu durumu nasıl yönetmelidir?', 'Yetki karmaşası yönetimi adımları...', 4)}
    ${_field('q_t5', 'TEKNİK SORU — Etkinlik sırasında uygulanan kuralların, sunucu genel kurallarıyla çeliştiği iddiası ortaya atılırsa; Etkinlik Sorumlusunun bu duruma yaklaşımı nasıl olmalı ve hangi birimlerle koordinasyon kurmalıdır?', 'Kural çelişkisi çözüm prosedürleri...', 4)}
    ${_field('q_t6', 'TEKNİK SORU — Bir etkinliğin, katılımcıların bir kısmı tarafından adil olmadığı gerekçesiyle eleştirilmesi hâlinde; Etkinlik Sorumlusunun geri bildirim toplama, raporlama ve iyileştirme sürecini teknik olarak nasıl yürütmesi gerekir?', 'Geri bildirim toplama ve raporlama süreci...', 4)}
    ${_field('q_t7', 'TEKNİK SORU — Etkinlik Sorumlusunun performansı hangi ölçülebilir teknik kriterler üzerinden değerlendirilmelidir? (örnek: etkinlik akışına uyum, kriz müdahale süresi, iletişim netliği vb.)', 'Ölçülebilir performans kriterleri listesi...', 3)}

    <!-- ÇOKTAN SEÇMELİ TEST (Soru 8) -->
    <div class="form-group" style="margin-bottom:1.2rem;">
      <label class="field-label">TEKNİK SORU — (Çoktan Seçmeli Test) *</label>
      <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.2rem;margin-top:0.4rem;">
        <p style="color:var(--muted);font-size:0.88rem;line-height:1.7;margin-bottom:1rem;">
          EkoYıldız sunucusunda düzenlenen geniş katılımlı bir etkinlik sırasında, katılımcıların kullandığı geçici ses kanallarında ciddi bir karmaşa yaşanmakta ve bazı kullanıcılar yetkileri olmadığı hâlde farklı kanallara erişebilmektedir. Bu durum, etkinliğin akışını ve düzenini olumsuz etkilemektedir.<br><br>
          <strong>Bu durumda Etkinlik Sorumlusunun aşağıdaki adımlardan hangisini öncelikli olarak uygulaması teknik açıdan en doğrudur?</strong>
        </p>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          ${[
      ['A', 'Etkinliği durdurarak tüm kanalları kapatmak ve sorunu daha sonra incelemek', ''],
      ['B', 'Kanal izinlerini hızlıca düzenleyerek yalnızca ilgili rollerin erişimine izin vermek', 'color:#34d399;font-weight:700;'],
      ['C', 'Yetkisiz erişimi olan kullanıcıları doğrudan etkinlikten çıkarmak', ''],
      ['D', 'Moderasyon ekibine durumu bildirip hiçbir müdahalede bulunmamak', ''],
      ['E', 'Katılımcılardan kanalları kendi isteğiyle terk etmelerini rica etmek', '']
    ].map(([letter, text, style]) => `
            <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);transition:all 0.2s;${style}" onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
              <input type="radio" name="q_mc8" value="${letter}" required style="accent-color:#34d399;width:18px;height:18px;flex-shrink:0;">
              <span style="font-size:0.88rem;">${letter}) ${text}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    <!-- ÇOKLU SEÇİM (Soru 9) -->
    <div class="form-group" style="margin-bottom:1.2rem;">
      <label class="field-label">TEKNİK SORU — (Çoklu Seçim) *</label>
      <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.2rem;margin-top:0.4rem;">
        <p style="color:var(--muted);font-size:0.88rem;line-height:1.7;margin-bottom:1rem;">
          EkoYıldız sunucu içi bir etkinlik sırasında; teknik bir aksaklık yaşanmış, bazı katılımcılar etkinliğin adil ilerlemediğini iddia etmiş, etkinlik akışı kısa süreli olarak kesintiye uğramıştır.<br><br>
          <strong>Bu durumda Etkinlik Sorumlusunun yetki ve sorumlulukları çerçevesinde atması gereken doğru adımlar aşağıdakilerden hangileridir?</strong>
        </p>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          ${[
      ['explain', 'Yaşanan teknik sorunu katılımcılara kısa ve net şekilde açıklamak', ''],
      ['rules_remind', 'Etkinlik kurallarını ve akışı yazılı olarak yeniden hatırlatmak', ''],
      ['argue', 'İtiraz eden katılımcılarla tartışmaya girmek', 'color:#fb7185;'],
      ['coord', 'Gerekli durumlarda yönetim veya moderasyon ekibiyle koordinasyon sağlamak', ''],
      ['abort', 'Etkinliği gerekçesiz şekilde sonlandırmak', 'color:#fb7185;']
    ].map(([val, text, style]) => `
            <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);transition:all 0.2s;${style}" onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
              <input type="checkbox" name="q_cb9" value="${val}" style="accent-color:#a78bfa;width:18px;height:18px;flex-shrink:0;">
              <span style="font-size:0.88rem;">${text}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    ${_field('q_t10', 'TEKNİK SORU — Bir Etkinlik Sorumlusunun görev sırasında yetkisini aşması ile inisiyatif alması arasındaki farkı EkoYıldız etkinlik yapısı özelinde açıklayınız.', 'Yetki aşımı ve inisiyatif arasındaki fark...', 4)}`;
  const step3 = _step(3, '#34d399', 'BÖLÜM 3 — İSTENİLEN TEKNİK BİLGİLER', 'EkoYıldız topluluk standartlarına uygun teknik ve yönetsel bilgi ölçümü.', step3Body, prevBtn(3) + nextBtn(3, '#34d399', '#34d399,#059669'));

  // ═══ BÖLÜM 4 ═══
  const step4Body = `
    <div style="background:rgba(251,191,36,0.06);border-left:3px solid #fbbf24;padding:1.2rem 1.5rem;border-radius:0 14px 14px 0;font-size:0.9rem;color:var(--muted);line-height:1.85;margin-bottom:1.5rem;">
      <strong style="color:#fbbf24;font-size:0.95rem;">4.1 — SENARYO TEMELLİ DEĞERLENDİRME (Kriz Yönetimi & Operasyonel Yetkinlik)</strong><br><br>
      Etkinlik Sorumluluğu kapsamında kullanılan senaryolar; EkoYıldız sunucusu içerisinde ve sunucu dışı platformlarda düzenlenen etkinliklerde karşılaşılması muhtemel gerçekçi durumları, operasyonel aksaklıkları ve organizasyon odaklı krizleri birebir simüle eden, Etkinlik Sorumlularının planlama, yönetim, anlık karar alma ve kriz müdahale yetkinliklerini çok yönlü ve derinlemesine biçimde değerlendirmeyi amaçlayan stratejik ölçüm araçlarıdır.<br><br>
      Bu senaryolar; etkinlik akışında yaşanan kritik bir aksama, beklenmedik teknik arızalar, katılımcı itirazları ve şikâyetleri, görevli yetkililer arasında yaşanan yetki karmaşası ve koordinasyon bozukluğu, sunucu içi veya dışı kurallara açık uyumsuzluk, bilgi sızdırılması ile etkinliğin genel düzenini, bütünlüğünü ve kamuoyu algısını kalıcı olarak olumsuz etkileyebilecek her türlü kriz senaryosu üzerine kurgulanır.<br><br>
      <span style="color:#fbbf24;">📋 Beklenti:</span> Her senaryo için yanıtınız en az 6-8 cümle uzunluğunda olmalı; "ne yapardım" değil, <strong>"hangi sırayla, hangi gerekçeyle, hangi adımları atardım"</strong> sorusuna yanıt vermelidir. Yüzeysel yanıtlar değerlendirme puanını düşürmektedir.
    </div>
    ${_field('q_s1', 'SENARYO SORUSU 1 — Büyük ölçekli etkinlik sırasında katılımcı sayısı beklenenden fazla oluyor, sunucu performansı düşüyor. Bazı oyuncular RP senaryosunu önceden bildiklerini iddia ederek etkinlik akışını bozuyor, bazı yetkililer kendi inisiyatifleriyle RP görevlerini değiştiriyor ve dış topluluklarda yanıltıcı bilgiler yayılmakta. Etkinlik Sorumlusu olarak nasıl yönetirsiniz?', 'Etkinlik akışı, RP bütünlüğü, sunucu performansı ve katılımcı deneyimini korumak için stratejileriniz...', 5)}
    ${_field('q_s2', 'SENARYO SORUSU 2 — Etkinlik sırasında bazı oyuncular, RP senaryosu ve ödül dağıtımı hakkında adaletsizlik ve ayrıcalık iddialarında bulunuyor. Teknik aksaklıklar nedeniyle bazı kanallar doğru çalışmıyor ve katılımcılar karmaşa yaşamaya başlıyor. Hangi adımları hangi öncelik sırasıyla atarsınız?', 'RP bütünlüğü, katılımcı memnuniyeti, teknik sorun çözümü ve koordinasyon...', 5)}
    ${_field('q_s3', 'SENARYO SORUSU 3 — Sunucu dışındaki başka bir Discord topluluğu ve sosyal platformlar üzerinden, EkoYıldız etkinliği hakkında yanıltıcı bilgiler hızla yayılmakta. Bazı oyuncular sunucu içinde huzursuzluk yaratıyor, bazı yetkililer kendi yorumlarıyla akışı değiştirmeye çalışıyor. Hangi adımları atarsınız?', 'Sunucu içi ve dışı iletişim, yetki sınırları ve topluluk güveni...', 5)}
    ${_field('q_s4', 'SENARYO SORUSU 4 — Etkinlik sırasında bazı oyuncular rol akışını kasıtlı olarak bozuyor, diğer oyuncular bu durumdan etkileniyor ve teknik sorunlar nedeniyle etkinlik duraksıyor. Hangi müdahaleleri uygularsınız?', 'Rol bütünlüğü, teknik akış ve katılımcı memnuniyeti koruma stratejileri...', 5)}
    ${_field('q_s5', 'SENARYO SORUSU 5 — Etkinlik tamamlandıktan sonra bazı katılımcılar etkinliği "taraflı ve önceden ayarlanmış" olarak sosyal platformlarda eleştiriyor ve ödül dağıtımı ile yönetim kararlarını sorguluyor. Etkinlik sırasında kaydedilen loglar bazı hataları ortaya koyuyor. Hangi belgeleri ve kayıtları kullanır, hangi stratejileri uygularsınız?', 'Topluluk algısı düzeltme, güven tesisi ve raporlama stratejileri...', 5)}
    ${_field('q_ss', 'TEKLİ SENARYO — EkoYıldız sunucusunda planlanan bir etkinlik sırasında, beklenmedik bir sunucu bakım çalışması meydana geliyor ve etkinliğin bazı kritik mekanikleri geçici olarak devre dışı kalıyor. Aynı zamanda bazı oyuncular rol kurallarını ihlal ediyor, bazı yetkililer etik sınırları zorlayarak etkinliği yönlendirmeye çalışıyor, bazı katılımcılar dış platformlarda olumsuz paylaşımlar yapıyor. Bu durumda hangi önceliklere sahip adımları atarsınız?', 'Tüm kriz yönetim adımlarınızı öncelik sırasıyla açıklayın...', 6)}`;
  const step4 = _step(4, '#fbbf24', 'BÖLÜM 4 — İSTENİLEN SENARYO BİLGİLERİ', 'Gerçekleşmesi muhtemel kriz senaryolarına yaklaşımınız.', step4Body, prevBtn(4) + nextBtn(4, '#fbbf24', '#fbbf24,#d97706'));

  // ═══ BÖLÜM 5 ═══
  const step5Body = `
    <div style="background:rgba(251,113,133,0.06);border-left:3px solid #fb7185;padding:1.2rem 1.5rem;border-radius:0 14px 14px 0;font-size:0.9rem;color:var(--muted);line-height:1.85;margin-bottom:1.5rem;">
      <strong style="color:#fb7185;font-size:0.95rem;">5.1 — ZORUNLU ONAYLAR, ETİK TAAHHÜTLER VE NİHAİ BEYANLAR</strong><br><br>
      Bu son bölüm; başvuru sürecinin yasal, idari ve etik boyutlarını kapsamaktadır. Aşağıda yer alan tüm onay, taahhüt ve beyan maddeleri; EkoYıldız Etkinlik Yönetim Komisyonu'nun standart personel alma prosedürlerinin ayrılmaz bir parçasını oluşturmakta olup başvurunun geçerli sayılabilmesi için eksiksiz ve doğru biçimde beyan edilmesi zorunludur.<br><br>
      Her maddeyi dikkatlice okuyunuz; yalnızca gerçekten katıldığınız ve uygulamaya koymaya hazır olduğunuz maddeleri onaylayınız. Yanlış beyan veya onay verdiğiniz taahhütlere uymadığınız tespit edildiğinde göreviniz sona erdirilecek ve sistemde kayıt altına alınacaktır.<br><br>
      <span style="color:#fb7185;">⚠️ Son Uyarı:</span> Bu formu gönderdikten sonra verilen yanıtlar değiştirilemez. Gönder butonuna basmadan önce tüm bölümleri son bir kez gözden geçiriniz.
    </div>

    <div class="form-group" style="margin-bottom:1.4rem;">
      <label class="field-label" style="font-size:0.92rem;line-height:1.7;">ONAY 1 — YETKİ KÖTÜYE KULLANIMI VE SORUŞTURMA HAKKI *<br><span style="font-weight:400;font-size:0.82rem;color:var(--muted);">EkoYıldız Etkinlik Sorumlusu sıfatıyla tarafınıza tanınan yetki ve ayrıcalıkların kötüye kullanılması, sistematik ihlal edilmesi veya kasıtlı olarak sınır dışına çıkılması durumunda; sorumluluk haklarınızın herhangi bir ön bildirim yapılmaksızın askıya alınabileceğini ya da kalıcı olarak iptal edilebileceğini, ayrıca sunucu içi idari soruşturma prosedürü kapsamında soruşturmaya alınabileceğinizi ve bu kararların nihai ve itiraz kabul etmez nitelik taşıdığını kabul ediyor musunuz?</span></label>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.7rem 1.1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(52,211,153,0.12)'" onmouseout="this.style.background='rgba(52,211,153,0.06)'">
          <input type="radio" name="opt_abuse" value="EVET" required style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:600;">Evet, okudum, anladım ve tüm maddelerini kabul ediyorum.</span>
        </label>
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.7rem 1.1rem;border-radius:12px;cursor:pointer;background:rgba(251,113,133,0.06);border:1px solid rgba(251,113,133,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(251,113,133,0.12)'" onmouseout="this.style.background='rgba(251,113,133,0.06)'">
          <input type="radio" name="opt_abuse" value="HAYIR" style="accent-color:#fb7185;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#fb7185;font-weight:600;">Hayır, bu koşulları kabul etmiyorum.</span>
        </label>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:1.4rem;">
      <label class="field-label" style="font-size:0.92rem;line-height:1.7;">ONAY 2 — SAYGILILIK, ETİK İLETİŞİM VE KURUMSAL TEMSİL *<br><span style="font-weight:400;font-size:0.82rem;color:var(--muted);">Görev süresince ekip üyelerine, katılımcılara, moderatörlere ve yönetim kademesine karşı her koşulda saygılı, yapıcı ve kurumsal iletişim standartlarına uygun davranmayı taahhüt ettiğinizi; hakaret, aşağılama, ötekileştirme veya kışkırtıcı tutum sergilemeniz hâlinde, durumun ağırlığına göre uyarı, rol askıya alma veya kalıcı olarak görevden el çektirme yaptırımlarının uygulanabileceğini kabul ediyor musunuz?</span></label>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.7rem 1.1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(52,211,153,0.12)'" onmouseout="this.style.background='rgba(52,211,153,0.06)'">
          <input type="radio" name="opt_respect" value="EVET" required style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:600;">Evet, okudum, anladım ve saygılı iletişim standartlarına uymayı taahhüt ediyorum.</span>
        </label>
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.7rem 1.1rem;border-radius:12px;cursor:pointer;background:rgba(251,113,133,0.06);border:1px solid rgba(251,113,133,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(251,113,133,0.12)'" onmouseout="this.style.background='rgba(251,113,133,0.06)'">
          <input type="radio" name="opt_respect" value="HAYIR" style="accent-color:#fb7185;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#fb7185;font-weight:600;">Hayır, bu koşulları kabul etmiyorum.</span>
        </label>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:1.4rem;">
      <label class="field-label" style="font-size:0.92rem;line-height:1.7;">ONAY 3 — GİZLİLİK, VERİ KORUMA VE BİLGİ GÜVENLİĞİ TAAHHÜDÜ *<br><span style="font-weight:400;font-size:0.82rem;color:var(--muted);">Etkinlik Sorumlusu sıfatıyla erişim sağlayacağınız idari bilgiler, katılımcı verileri, yönetim iletişim içerikleri, planlama dökümanları ve ekip içi koordinasyon bilgilerinin; sunucu dışına çıkarılmaması, üçüncü taraflarla paylaşılmaması ve herhangi bir sosyal platform üzerinde ifşa edilmemesi gerektiğini kabul ediyor musunuz? Gizlilik ihlalinin disiplin prosedürü kapsamında değerlendirileceğini onaylıyor musunuz?</span></label>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.7rem 1.1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(52,211,153,0.12)'" onmouseout="this.style.background='rgba(52,211,153,0.06)'">
          <input type="radio" name="opt_privacy" value="EVET" required style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:600;">Evet, gizlilik ve veri güvenliği taahhütlerini okudum ve kabul ediyorum.</span>
        </label>
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.7rem 1.1rem;border-radius:12px;cursor:pointer;background:rgba(251,113,133,0.06);border:1px solid rgba(251,113,133,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(251,113,133,0.12)'" onmouseout="this.style.background='rgba(251,113,133,0.06)'">
          <input type="radio" name="opt_privacy" value="HAYIR" style="accent-color:#fb7185;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#fb7185;font-weight:600;">Hayır, kabul etmiyorum.</span>
        </label>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:0;">
      <label class="field-label" style="font-size:0.92rem;line-height:1.7;">NİHAİ TAAHHÜT — PERSONEL TALİMATNAMESİ, GÖREV YÖNETMELİĞİ VE EKİP EL KİTABINA UYUM *<br><span style="font-weight:400;font-size:0.82rem;color:var(--muted);">EkoYıldız Etkinlik Sorumluluğu Personel Talimatnamesi, Görev Yönetmeliği ve Ekip El Kitabı'nın tüm maddelerini; göreve başlamadan önce eksiksiz biçimde okumayı, içeriğini özümsemeyi ve görev süresince kurallara harfiyen uymayı taahhüt ettiğinizi, söz konusu belgelerin güncellenmesi hâlinde güncel versiyona uyum sağlamakla yükümlü olduğunuzu ve bu kurallara aykırı her türlü eylemin disiplin sürecini başlatacağını kabul ediyor musunuz?</span></label>
      <div style="margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.85rem 1.1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.08);border:1.5px solid rgba(52,211,153,0.3);transition:all 0.2s;">
          <input type="radio" name="opt_rules" value="EVET" required checked style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:700;">Evet, talimatname ve el kitabını okuyacağımı, kurallara harfiyen uyacağımı, üzerime düşen tüm görev ve sorumlulukları eksiksiz yerine getireceğimi beyan ve taahhüt ediyorum.</span>
        </label>
      </div>
    </div>`;
  const step5Nav = prevBtn(5) + `<button type="submit" id="submit-btn" class="btn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:800;font-size:1.1rem;padding:0.9rem 2.8rem;border-radius:30px;box-shadow:0 8px 25px rgba(16,185,129,0.4);border:none;cursor:pointer;font-family:inherit;">🚀 Başvuruyu Gönder</button>`;
  const step5 = _step(5, '#fb7185', 'BÖLÜM 5 — ZORUNLU ONAYLAR, ETİK TAAHHÜTLER & NİHAİ BEYANLAR', 'Yasal, idari ve etik taahhütlerinizi onaylayarak başvuruyu tamamlayın.', step5Body, step5Nav);

  const content = `
    <div style="max-width:960px; margin:1.5rem auto; animation:fadeUp 0.5s ease;">
      <!-- FORM BANNER -->
      <div style="width:100%;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);margin-bottom:1.5rem;box-shadow:0 12px 35px rgba(0,0,0,0.5);">
        <img src="${BANNER}" style="width:100%;display:block;max-height:280px;object-fit:cover;">
      </div>

      <!-- FORM HEADER TITLE CARD -->
      <div class="card" style="background:rgba(20,20,35,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:2rem;backdrop-filter:blur(20px);margin-bottom:1.5rem;border-top:4px solid #34d399;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
          <div>
            <div style="color:#34d399;font-size:0.85rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:0.4rem;">✳️ ETKİNLİK YETKİLİSİ ALIM FORMU</div>
            <h1 style="font-size:1.8rem;font-weight:800;color:#fff;">Etkinlik Sorumluluğu // [A-1] 1. Nesil Sorumlu Başvuru Formu</h1>
          </div>
          <a href="/forms" class="btn btn-sm btn-ghost">← Tüm Formlara Dön</a>
        </div>
      </div>

      ${existingSubmission ? `
        <div class="card" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.3);border-radius:20px;padding:2.5rem;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">⏳</div>
          <h2 style="font-size:1.6rem;font-weight:800;color:#fff;margin-bottom:0.6rem;">Başvurunuz Değerlendirilme Aşamasında!</h2>
          <p style="color:var(--muted);max-width:650px;margin:0 auto 1.5rem;line-height:1.6;">
            Sayın <strong>${_esc(usernameStr)}</strong>, başvurunuz <strong>${new Date(existingSubmission.createdAt).toLocaleString('tr-TR')}</strong> tarihinde ulaşmıştır.
          </p>
          <div style="display:inline-block;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1rem 1.5rem;text-align:left;font-size:0.9rem;color:var(--muted);">
            <div>📌 <strong>Durum:</strong> <span style="color:#fbbf24;font-weight:700;">⏳ İNCELENİYOR</span></div>
            <div>🆔 <strong>ID:</strong> <code>${existingSubmission._id}</code></div>
          </div>
        </div>
      ` : `

        <!-- DOCUMENTATION CARD -->
        <div class="card" style="margin-bottom:1.5rem;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:1.8rem;">
          <h3 style="font-size:1.15rem;font-weight:800;color:#fff;margin-bottom:1rem;">📖 ETKİNLİK SORUMLULUĞU BİRİNCİL ALIM FORMU</h3>
          <div style="display:flex;flex-direction:column;gap:1rem;font-size:0.88rem;color:var(--muted);line-height:1.7;">
            <div style="border-left:3px solid #818cf8;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);">
              Bu birincil değerlendirme formu, EkoYıldız Etkinlik Sorumluluğu pozisyonuna başvuran adayların ilk aşama değerlendirmesine tabi tutulduğu resmi belgedir. Formun eksiksiz, samimi ve özenli biçimde doldurulması, aday hakkında komisyonun doğru ve kapsamlı bir değerlendirme yapabilmesi açısından kritik öneme sahiptir. Eksik, yüzeysel veya tutarsız yanıtlar; başvurunun ilk aşamada elenme ihtimalini doğrudan artırmaktadır.
            </div>
            <div style="border-left:3px solid #34d399;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);">
              <strong style="color:#fff;">FORMUN AMACI VE İZLEYECEĞİ SÜREÇ:</strong> Formun birincil amacı, adayların bu pozisyona uygunluğunu ilk aşamada niteliksel düzeyde değerlendirmektir. Süreç şu adımları izler: <em>① Başvuru Formu Gönderimi → ② Komisyon Tarafından Ön İnceleme → ③ Yapay Zekâ Destekli Metin Analizi → ④ Koşullu Nihai Değerlendirme → ⑤ Mülakat Daveti → ⑥ Mülakat Süreci → ⑦ Nihai Alım Kararı.</em> Her adım bağımsız kriterler doğrultusunda gerçekleştirilmekte olup sürecin herhangi bir aşamasında başvuru reddedilebilir.
            </div>
            <div style="border-left:3px solid #a78bfa;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);">
              <strong style="color:#fff;">ÖN ALIMLAR MÜLAKATı:</strong> Başvurduğunuz departmanı harici olarak denetleyen Regülasyon Komitesi, inceleme sürecinin tamamlanmasının ardından sizinle özel olarak iletişime geçecektir. Komite üyeleri, formdaki yanıtlarınızdan hareketle size özel hazırlanmış detaylı sorular yöneltecektir. <strong>Yalnızca Etkinlik Organizatörü'nün nihai onayını alan adaylar departmana katılma hakkı elde edecektir.</strong> Mülakat daveti Discord üzerinden DM yoluyla iletilecek; davet gelen süre zarfında yanıt verilmemesi başvuruyu otomatik olarak geçersiz kılacaktır.
            </div>
            <div style="border-left:3px solid #fbbf24;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);font-size:0.82rem;">
              <strong style="color:#fff;">📌 FORM KURALLARI VE ETİK İLKELER:</strong><br>
              • Başvuru formu her aday tarafından yalnızca bir kez doldurulup gönderilebilir. Mükerrer başvurular sistem tarafından otomatik olarak reddedilir.<br>
              • Trol, eksik, kasıtlı yanıltıcı veya amaç dışı başvurularda bulunan adaylar EkoYıldız sisteminde kalıcı olarak kara listeye alınacaktır.<br>
              • Başvuru cevaplarının özgün ve tamamen size ait olması zorunludur. Yapay zekâ, başka bir kişinin metni veya çevrimiçi kaynaklardan kopyalanmış içerikler sistem tarafından yüksek doğrulukla tespit edilmekte ve bu tür başvurular herhangi bir bildirim yapılmaksızın reddedilmektedir.<br>
              • Değerlendirme süreci tam gizlilik esasına dayanır. Komisyon kararları ve değerlendirme kriterleri hiçbir koşulda paylaşılmaz.<br>
              • Bu formu doldurmak; EkoYıldız ilgili tüm yönetmelik, talimatname ve kuralları okuduğunuz, içeriğini anladığınız ve tüm koşulları kabul ettiğiniz anlamına gelmektedir.<br>
              <span style="color:#818cf8;font-style:italic;">— Kurucu ekonqt</span>
            </div>
            <div style="border-left:3px solid #fb7185;padding:0.6rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);font-size:0.82rem;font-style:italic;">
              ・ EK NOT: Her başvuru, Etkinlik Organizatörü ve Regülasyon Komitesi tarafından özenle ve bireysel olarak incelenmektedir. Bu sürece adım atan tüm adaylara, kararlılık ve özgünlük içinde ilerlemeleri temenni edilir. Formun görünür kısmında yalnızca yanıtlarınız yer almakla birlikte, sistemimiz arka planda yazım davranışı, süre ve içerik tutarlılığı gibi ek parametreleri de kayıt altına almaktadır.
            </div>
          </div>
        </div>

        <!-- STEP PROGRESS BAR -->
        <div id="step-progress" class="card" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:1.2rem 1.5rem;margin-bottom:1.2rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.8rem;">
            ${[
      ['1', 'Ön Bilgiler', '#818cf8'],
      ['2', 'Kişisel', '#a78bfa'],
      ['3', 'Teknik', '#34d399'],
      ['4', 'Senaryolar', '#fbbf24'],
      ['5', 'Onaylar', '#fb7185']
    ].map(([n, label, color], i) => `
              <div id="step-pill-${n}" style="display:flex;align-items:center;gap:0.35rem;padding:0.3rem 0.75rem;border-radius:20px;font-size:0.78rem;font-weight:800;border:1.5px solid ${color}40;color:${color};opacity:${i === 0 ? '1' : '0.4'};transition:opacity 0.3s;">
                <span style="width:18px;height:18px;border-radius:50%;background:${color}20;border:1.5px solid ${color};display:inline-flex;align-items:center;justify-content:center;font-size:0.7rem;">${n}</span>
                ${label}
                <span class="pill-check" style="display:none;color:${color};font-weight:800;">✓</span>
              </div>
              ${i < 4 ? '<div style="flex:1;height:2px;background:rgba(255,255,255,0.08);border-radius:1px;"><div id="step-bar-' + n + '" style="height:100%;width:0%;background:' + color + ';border-radius:1px;transition:width 0.4s;"></div></div>' : ''}
            `).join('')}
          </div>
          <div style="font-size:0.8rem;color:var(--muted);">Bölüm <span id="step-current-label">1</span>/5 — <span id="step-name-label" style="color:var(--accent);">Ön Bilgiler</span></div>
        </div>

        <form id="event-staff-form" autocomplete="off" style="display:flex;flex-direction:column;gap:1.2rem;">
          ${step1}
          ${step2}
          ${step3}
          ${step4}
          ${step5}
        </form>

        <script>
          // ─── DAVRANIŞSAL TAKİP SİSTEMİ ───────────────────────────
          const _beh = {};
          let _currentStep = 1;
          const STEP_NAMES = {1:'Ön Bilgiler',2:'Kişisel Bilgiler',3:'Teknik Bilgiler',4:'Senaryo Bilgileri',5:'Son Bilgiler (Onaylar)'};
          const STEP_COLORS = {1:'#818cf8',2:'#a78bfa',3:'#34d399',4:'#fbbf24',5:'#fb7185'};

          function _initTracking() {
            document.querySelectorAll('.track-field').forEach(el => {
              const fid = el.dataset.field;
              _beh[fid] = { typed_chars: 0, paste_count: 0, focus_count: 0, focus_ms: 0, idle_events: 0, _ft: 0, _last: 0 };
              el.addEventListener('focus', () => { _beh[fid]._ft = Date.now(); _beh[fid].focus_count++; });
              el.addEventListener('blur', () => { if (_beh[fid]._ft) _beh[fid].focus_ms += Date.now() - _beh[fid]._ft; _beh[fid]._ft = 0; });
              el.addEventListener('input', () => {
                const now = Date.now();
                if (_beh[fid]._last && (now - _beh[fid]._last) > 4000) _beh[fid].idle_events++;
                _beh[fid]._last = now;
                _beh[fid].typed_chars++;
                _updateHint(fid, el);
              });
              el.addEventListener('paste', () => { _beh[fid].paste_count++; setTimeout(() => _updateHint(fid, el), 10); });
            });
          }

          function _updateHint(fid, el) {
            const hint = document.getElementById('hint-' + el.id);
            if (!hint) return;
            const b = _beh[fid];
            const parts = [];
            const len = (el.value || '').length;
            if (len > 0) {
              if (b.paste_count > 0) parts.push('📋 Yapıştırıldı');
              else parts.push('✍️ Yazıldı');
            }
            if (b.idle_events > 1) parts.push('⏸️ Bekleme var');
            if (len > 0) parts.push(len + ' karakter');
            hint.textContent = parts.join(' • ');
            hint.style.color = b.paste_count > 0 ? '#fbbf24' : 'var(--muted)';
          }

          function _getBehavior() {
            const result = {};
            for (const [fid, b] of Object.entries(_beh)) {
              const el = document.querySelector('[data-field="' + fid + '"]');
              const len = el ? (el.value || '').length : 0;
              let type = 'bilinmiyor';
              if (len === 0) type = 'boş';
              else if (b.paste_count > 0 && b.typed_chars < 5) type = 'kopyala-yapıştır';
              else if (b.paste_count > 0) type = 'yapıştır + düzenleme';
              else if (b.idle_events >= 3) type = 'yazdı (uzun bekleme)';
              else type = 'yazdı';
              result[fid] = { type, chars: len, typed: b.typed_chars, pastes: b.paste_count, focus_sec: Math.round(b.focus_ms / 1000), idle_events: b.idle_events };
            }
            return result;
          }

          // ─── ADIM NAVİGASYONU (Tamamlanan bölümler daraltılmış görünür kalır) ───
          function _collapseStep(num) {
            const step = document.getElementById('form-step-' + num);
            if (!step) return;
            const body = step.querySelector('.step-body');
            const badge = step.querySelector('.step-done-badge');
            const expBtn = step.querySelector('.step-expand-btn');
            if (body) body.style.display = 'none';
            if (badge) badge.style.display = 'inline-flex';
            if (expBtn) { expBtn.style.display = 'inline-flex'; expBtn.textContent = '▶'; }
            step.style.opacity = '0.8';
            step.style.background = 'rgba(255,255,255,0.015)';
          }

          function _expandStep(num) {
            const step = document.getElementById('form-step-' + num);
            if (!step) return;
            const body = step.querySelector('.step-body');
            const badge = step.querySelector('.step-done-badge');
            const expBtn = step.querySelector('.step-expand-btn');
            if (body) body.style.display = 'block';
            if (badge) badge.style.display = 'none';
            if (expBtn) { expBtn.style.display = 'none'; }
            step.style.opacity = '1';
            step.style.background = '';
          }

          function nextStep(current) {
            const step = document.getElementById('form-step-' + current);
            const fields = step.querySelectorAll('[required]');
            let valid = true;
            const checkedRadioNames = new Set();
            fields.forEach(f => {
              if (f.type === 'radio') {
                if (!checkedRadioNames.has(f.name)) {
                  checkedRadioNames.add(f.name);
                  const chosen = step.querySelector('input[name="' + f.name + '"]:checked');
                  if (!chosen) { valid = false; }
                }
              } else if (!f.value || !f.value.trim()) {
                f.style.borderColor = '#fb7185';
                valid = false;
              } else {
                f.style.borderColor = '';
              }
            });
            if (!valid) { if (typeof showToast === 'function') showToast('⚠️ Lütfen tüm zorunlu alanları doldurun.', 'error'); return; }

            // Collapse completed step (stays visible)
            _collapseStep(current);

            _currentStep = current + 1;
            const next = document.getElementById('form-step-' + _currentStep);
            if (next) {
              next.style.display = 'block';
              _expandStep(_currentStep);
              setTimeout(() => next.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
            }
            _updateProgress();
          }

          function prevStep(current) {
            const step = document.getElementById('form-step-' + current);
            if (step) step.style.display = 'none';
            _currentStep = current - 1;
            const prev = document.getElementById('form-step-' + _currentStep);
            if (prev) {
              prev.style.display = 'block';
              _expandStep(_currentStep);
              setTimeout(() => prev.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
            }
            _updateProgress();
          }

          function toggleStep(num) {
            if (num >= _currentStep) return; // can only toggle completed steps
            const step = document.getElementById('form-step-' + num);
            if (!step) return;
            const body = step.querySelector('.step-body');
            if (!body) return;
            if (body.style.display === 'none') _expandStep(num);
            else _collapseStep(num);
          }

          function _updateProgress() {
            for (let i = 1; i <= 5; i++) {
              const pill = document.getElementById('step-pill-' + i);
              if (pill) {
                pill.style.opacity = i <= _currentStep ? '1' : '0.4';
                const chk = pill.querySelector('.pill-check');
                if (chk) chk.style.display = i < _currentStep ? 'inline' : 'none';
              }
              if (i < 5) {
                const bar = document.getElementById('step-bar-' + i);
                if (bar) bar.style.width = i < _currentStep ? '100%' : '0%';
              }
            }
            const nameEl = document.getElementById('step-name-label');
            const curEl = document.getElementById('step-current-label');
            if (nameEl) nameEl.textContent = STEP_NAMES[_currentStep] || '';
            if (curEl) curEl.textContent = _currentStep;
          }

          // ─── FORM GÖNDERİM ───────────────────────────────────────
          document.getElementById('event-staff-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('submit-btn');
            btn.disabled = true;
            btn.innerHTML = '⏳ Gönderiliyor...';

            const cb9 = Array.from(document.querySelectorAll('input[name="q_cb9"]:checked')).map(c => c.value);

            const payload = {
              formType: 'event_staff',
              discordUsername: document.getElementById('q_discord').value.trim(),
              discordId: ((document.getElementById('q_discord_id')||{}).value||'').trim(),
              personal:  { q1: (document.getElementById('q_p1')||{}).value||'', q2: (document.getElementById('q_p2')||{}).value||'', q3: (document.getElementById('q_p3')||{}).value||'', q4: (document.getElementById('q_p4')||{}).value||'', q5: (document.getElementById('q_p5')||{}).value||'' },
              technical: { q1: (document.getElementById('q_t1')||{}).value||'', q2: (document.getElementById('q_t2')||{}).value||'', q3: (document.getElementById('q_t3')||{}).value||'', q4: (document.getElementById('q_t4')||{}).value||'', q5: (document.getElementById('q_t5')||{}).value||'', q6: (document.getElementById('q_t6')||{}).value||'', q7: (document.getElementById('q_t7')||{}).value||'', mc8: (document.querySelector('input[name="q_mc8"]:checked')||{}).value||'', cb9, q10: (document.getElementById('q_t10')||{}).value||'' },
              scenarios: { s1: (document.getElementById('q_s1')||{}).value||'', s2: (document.getElementById('q_s2')||{}).value||'', s3: (document.getElementById('q_s3')||{}).value||'', s4: (document.getElementById('q_s4')||{}).value||'', s5: (document.getElementById('q_s5')||{}).value||'', single: (document.getElementById('q_ss')||{}).value||'' },
              confirmations: { abuse: (document.querySelector('input[name="opt_abuse"]:checked')||{}).value||'', respect: (document.querySelector('input[name="opt_respect"]:checked')||{}).value||'', rules: (document.querySelector('input[name="opt_rules"]:checked')||{}).value||'' },
              behavior: _getBehavior()
            };

            try {
              const res = await fetch('/api/forms/event-staff/submit', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
              const data = await res.json();
              if (data && data.success) {
                if (typeof showToast === 'function') showToast('✅ Başvurunuz başarıyla alındı!', 'success');
                setTimeout(() => window.location.reload(), 1500);
              } else {
                if (typeof showToast === 'function') showToast('❌ ' + (data.error || 'Başvuru gönderilemedi'), 'error');
                btn.disabled = false; btn.innerHTML = '🚀 Başvuruyu Gönder';
              }
            } catch (err) {
              if (typeof showToast === 'function') showToast('❌ Bağlantı hatası yaşandı.', 'error');
              btn.disabled = false; btn.innerHTML = '🚀 Başvuruyu Gönder';
            }
          });

          _initTracking();
        </script>
        ${_socialProofScript('bu başvuru formunu')}
      `}
    </div>
  `;

  return _layout('Etkinlik Yetkilisi Başvuru Formu', currentUser, content, '', '/forms');
}


function renderClosedFormPage(currentUser, formName = 'Bu Form', bannerUrl = '') {
  const _layout = require('./views')._layout;
  const content = `
    <div style="max-width:720px; margin:4rem auto; text-align:center; animation:fadeUp 0.5s ease;">
      ${bannerUrl ? '<div style="width:100%;border-radius:20px;overflow:hidden;margin-bottom:1.5rem;box-shadow:0 8px 24px rgba(0,0,0,0.4);"><img src="' + bannerUrl + '" style="width:100%;display:block;max-height:200px;object-fit:cover;filter:brightness(0.6);"></div>' : ''}
      <div class="card" style="background:rgba(251,113,133,0.06); border:1px solid rgba(251,113,133,0.25); border-radius:24px; padding:3.5rem 2.5rem;">
        <div style="font-size:4rem; margin-bottom:1.5rem; opacity:0.85;">🔒</div>
        <h1 style="font-size:2rem; font-weight:800; color:#fff; margin-bottom:0.8rem;">${_esc(formName)} Şu An Kapalı</h1>
        <p style="color:var(--muted); font-size:1.05rem; line-height:1.7; max-width:500px; margin:0 auto 2rem;">
          Başvurular şu anda alınmamaktadır. Yeni bir alım dönemi açıldığında duyurulacaktır.
        </p>
        <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
          <a href="/forms" class="btn" style="background:linear-gradient(135deg,#818cf8,#6366f1); color:#fff; font-weight:700; padding:0.75rem 1.8rem; border-radius:24px;">← Tüm Formlar</a>
          <a href="/dashboard" class="btn btn-ghost" style="padding:0.75rem 1.8rem; border-radius:24px;">Ana Sayfa</a>
        </div>
      </div>
    </div>
  `;
  return _layout(formName + ' — Kapalı', currentUser, content, '', '/forms');
}

function renderCommunityAmbassadorFormPage(currentUser, existingSubmission = null) {
  const _layout = require('./views')._layout;
  const isLoggedIn = Boolean(currentUser);
  const usernameStr = currentUser ? (currentUser.discordUsername || currentUser.username || '') : '';
  const BANNER = 'https://i.imgur.com/ELNPQjZ.jpeg';

  function _step(num, color, title, subtitle, bodyHtml, navHtml) {
    const hidden = num > 1 ? 'display:none;' : '';
    return `
      <div id="form-step-${num}" class="form-step card" style="border-radius:20px;border-left:4px solid ${color};${hidden}transition:all 0.3s;margin-bottom:1.5rem;background:rgba(20,20,35,0.7);backdrop-filter:blur(20px);padding:2rem;">
        <div class="step-header-bar" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" onclick="toggleStep(${num})">
          <div>
            <h3 style="font-size:1.15rem;font-weight:800;color:${color};margin-bottom:0.2rem;">${title}</h3>
            <p style="font-size:0.8rem;color:var(--muted);margin:0;">${subtitle}</p>
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem;">
            <span class="step-done-badge" style="display:none;background:${color}20;color:${color};font-size:0.72rem;font-weight:800;padding:0.25rem 0.7rem;border-radius:20px;border:1px solid ${color}40;">✓ TAMAMLANDI</span>
            <span class="step-expand-btn" style="display:none;color:${color};font-size:1.2rem;cursor:pointer;" title="Genişlet / Daralt">▼</span>
          </div>
        </div>
        <div class="step-body" style="margin-top:1.2rem;">
          ${bodyHtml}
          <div class="step-nav" style="display:flex;justify-content:${num === 1 ? 'flex-end' : 'space-between'};margin-top:1.8rem;padding-top:1.2rem;border-top:1px solid rgba(255,255,255,0.06);">
            ${navHtml}
          </div>
        </div>
      </div>`;
  }

  function _field(id, label, placeholder, rows) {
    return `
      <div class="form-group" style="margin-bottom:1.3rem;">
        <label class="field-label" style="display:block;font-weight:700;color:#e2e8f0;font-size:0.92rem;margin-bottom:0.4rem;">${label} <span style="color:#f43f5e;">*</span></label>
        <textarea id="${id}" class="input-field track-field" data-field="${id}" rows="${rows || 3}" required placeholder="${placeholder}" style="width:100%;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:0.8rem 1rem;color:#fff;font-family:inherit;font-size:0.9rem;line-height:1.6;outline:none;transition:border-color 0.2s;"></textarea>
        <div class="field-hint" id="hint-${id}" style="font-size:0.75rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
      </div>`;
  }

  function _fieldInput(id, label, placeholder, val = '') {
    return `
      <div class="form-group" style="margin-bottom:1.3rem;">
        <label class="field-label" style="display:block;font-weight:700;color:#e2e8f0;font-size:0.92rem;margin-bottom:0.4rem;">${label} <span style="color:#f43f5e;">*</span></label>
        <input type="text" id="${id}" class="input-field track-field" data-field="${id}" value="${_esc(val)}" required placeholder="${placeholder}" style="width:100%;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:0.8rem 1rem;color:#fff;font-family:inherit;font-size:0.9rem;outline:none;transition:border-color 0.2s;">
        <div class="field-hint" id="hint-${id}" style="font-size:0.75rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
      </div>`;
  }

  function _ethicsField(idPrefix, qNum, statementText) {
    return `
      <div class="form-group" style="margin-bottom:1.5rem;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.4rem;">
        <div style="font-weight:800;color:#ec4899;font-size:0.85rem;letter-spacing:0.5px;margin-bottom:0.4rem;">İFADE ${qNum}</div>
        <p style="font-size:0.95rem;color:#fff;font-weight:600;line-height:1.6;margin-bottom:1rem;">"${statementText}"</p>
        
        <div style="margin-bottom:1rem;">
          <label style="display:block;font-size:0.82rem;color:var(--muted);margin-bottom:0.5rem;font-weight:600;">SEÇİMİNİZ *</label>
          <div style="display:flex;gap:0.8rem;flex-wrap:wrap;">
            ${[
        ['Katılıyorum', '#34d399'],
        ['Kısmen Katılıyorum', '#fbbf24'],
        ['Katılmıyorum', '#f43f5e']
      ].map(([opt, col]) => `
              <label style="display:inline-flex;align-items:center;gap:0.5rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);padding:0.5rem 1rem;border-radius:20px;cursor:pointer;font-size:0.88rem;color:#fff;transition:all 0.2s;">
                <input type="radio" name="${idPrefix}_choice" value="${opt}" required style="accent-color:${col};">
                <span>${opt}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div>
          <label style="display:block;font-size:0.82rem;color:var(--muted);margin-bottom:0.4rem;font-weight:600;">YANITINIZ VE GEREKÇENİZ (En az 3 cümle) *</label>
          <textarea id="${idPrefix}_reason" class="input-field track-field" data-field="${idPrefix}_reason" rows="3" required placeholder="Lütfen tercihinizi en az 3 cümle ile detaylandırarak açıklayınız..." style="width:100%;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:0.8rem 1rem;color:#fff;font-family:inherit;font-size:0.9rem;line-height:1.6;outline:none;"></textarea>
          <div class="field-hint" id="hint-${idPrefix}_reason" style="font-size:0.75rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
        </div>
      </div>`;
  }

  const prevBtn = (n) => `<button type="button" onclick="prevStep(${n})" class="btn btn-ghost" style="font-size:0.9rem;">← Önceki Bölüm</button>`;
  const nextBtn = (n, color, grad) => `<button type="button" onclick="nextStep(${n})" class="btn" style="background:linear-gradient(135deg,${grad});color:#fff;font-weight:700;padding:0.75rem 1.8rem;border-radius:24px;border:none;cursor:pointer;font-family:inherit;box-shadow:0 4px 15px ${color}40;">Sonraki Bölüm →</button>`;

  // ═══ BÖLÜM 1 ═══
  const step1Body = `
    <div style="background:rgba(129,140,248,0.06);border-left:3px solid #818cf8;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      <strong>1.1. Kimlik, İletişim ve Müsaitlik Bilgileri:</strong><br>
      Başvuru değerlendirme ve mülakat davet süreçlerinin sağlıklı yürütülmesi adına kimlik ve iletişim bilgilerinizi doğru girmelisiniz.
    </div>
    ${_fieldInput('q_fullName', 'Adınız / İkinci Adınız ve Soyadınız', 'Örn: Ahmet Yılmaz')}
    ${_fieldInput('q_discordUsername', 'Discord Kullanıcı Adınız (Username) ve Discord ID (18 Haneli Numerik Kodu)', 'Örn: ahmet_user (123456789012345678)', usernameStr)}
    ${_fieldInput('q_ageBirthDate', 'Yaşınız ve Doğum Tarihiniz', 'Örn: 21 (15.04.2005)')}
    ${_fieldInput('q_cityTimezone', 'Bulunduğunuz Şehir ve Zaman Diliminiz', 'Örn: İstanbul (GMT+3)')}
    ${_field('q_availability', 'Günlük ve Haftalık Müsaitlik Süreniz', 'Hafta içi: 18:00 - 23:00, Hafta sonu: 14:00 - 01:00 saat aralıklarında aktiftim...', 3)}
    
    <div style="background:rgba(129,140,248,0.06);border-left:3px solid #818cf8;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-top:1.5rem;margin-bottom:1.3rem;">
      <strong>1.2. Geçmiş Deneyim ve Referanslar:</strong>
    </div>
    ${_field('q_pastExperience', 'Daha önce görev aldığınız Discord sunucuları, topluluklar veya platformlar hangileridir?', 'Lütfen sunucu adı, sunucudaki üye sayısı, üstlendiğiniz rol ve ayrılma nedeninizi detaylandırarak yazınız...', 4)}
    ${_field('q_toughestIncident', 'Geçmişte üstlendiğiniz rollerde karşılaştığınız ve yönetmekte en çok zorlandığınız tek bir olayı ve bu olayı nasıl çözdüğünüzü anlatınız.', 'Karşılaştığınız zorlu kriz durumunu ve uyguladığınız çözüm adımlarını detaylandırın...', 4)}
    ${_field('q_references', 'Referans gösterebileceğiniz 2 kişiyi belirtiniz', 'Discord Kullanıcı Adı ve Rolü ile yazınız. Örn:\n1. @kullanici1 - Üst Yönetici\n2. @kullanici2 - Moderatör Lideri', 3)}`;

  const step1 = _step(1, '#818cf8', 'BÖLÜM I — KİŞİSEL BİLGİLER, GEÇMİŞ VE TEKNİK PROFİL', 'Kimlik, erişim, deneyim ve referans bilgileri.', step1Body, nextBtn(1, '#818cf8', '#818cf8,#6366f1'));

  // ═══ BÖLÜM 2 ═══
  const step2Body = `
    <div style="background:rgba(167,139,250,0.06);border-left:3px solid #a78bfa;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      <strong>2.1. Temsil ve Kurumsal Bakış:</strong><br>
      Topluluk Elçisi, markanın dışa dönük yüzü ve kültür taşıyıcısıdır. Vizyonunuz ve rol bilinciniz değerlendirilecektir.
    </div>
    ${_field('q_brandVision', 'EkoYıldız markası ve topluluğu sizin için ne ifade ediyor? Sunucudaki genel gidişat ve atmosfer hakkında ne düşünüyorsunuz?', 'Topluluk vizyonu, atmosfer ve genel gidişat hakkındaki düşünceleriniz...', 4)}
    ${_field('q_ambassadorVsMod', '"Moderasyon/Disiplin Yetkilisi" ile "Topluluk Elçisi" arasındaki fark sizce nedir? Bir Elçi, moderatörlerin yetersiz kaldığı veya yetki alanına girmediği durumlarda topluluğa nasıl yön vermelidir?', 'Yetki sınırları, temsil farkı ve topluluğa rehberlik etme yöntemi...', 4)}
    ${_field('q_top3Traits', 'Sizi diğer adaylardan ayıran ve EkoYıldız Topluluk Elçiliği kadrosuna katmamızı gerektiren en belirgin 3 kişisel özelliğinizi açıklayınız.', '1. Kişisel özellik...\n2. Kişisel özellik...\n3. Kişisel özellik...', 4)}

    <div style="background:rgba(167,139,250,0.06);border-left:3px solid #a78bfa;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-top:1.5rem;margin-bottom:1.3rem;">
      <strong>2.2. Proaktif Katkı ve Strateji:</strong>
    </div>
    ${_field('q_first30DaysPlan', 'Topluluk Elçisi seçilmeniz durumunda ilk 30 gün içinde uygulamayı planladığınız somut bir proje, etkinlik veya etkileşim artırma stratejisi var mı? Detaylandırarak açıklayınız.', 'Uygulanabilir somut proje, etkinlik ve etkileşim stratejiniz...', 5)}
    ${_field('q_retentionStrategy', 'Toplulukta üye bağlılığını (retention) artırmak ve yeni katılan kullanıcıların sunucudan hemen ayrılmasını engellemek için nasıl bir karşılama/oryantasyon mekanizması kurgulardınız?', 'Yeni katılan kullanıcıları tutundurma, oryantasyon ve uyum mekanizması...', 5)}`;

  const step2 = _step(2, '#a78bfa', 'BÖLÜM II — MOTİVASYON, VİZYON VE ROL BİLİNCİ', 'Temsil, proaktif projeler ve üye bağlılığı kurgusu.', step2Body, prevBtn(2) + nextBtn(2, '#a78bfa', '#a78bfa,#8b5cf6'));

  // ═══ BÖLÜM 3 ═══
  const step3Body = `
    <div style="background:rgba(245,158,11,0.06);border-left:3px solid #f59e0b;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölümdeki senaryolara verdiğiniz yanıtlar, kriz anındaki karar verme mekanizmanızı ve iletişim dilinizi ölçecektir. Her senaryo için adım adım ne yapacağınızı yazınız.
    </div>

    <!-- SENARYO 1 -->
    <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(245,158,11,0.2);border-radius:16px;padding:1.4rem;margin-bottom:1.5rem;">
      <div style="font-weight:800;color:#f59e0b;font-size:0.9rem;margin-bottom:0.5rem;">📌 SENARYO 1: Kural Sınırında Yürüyen Gerginlik ve Kutuplaşma</div>
      <p style="font-size:0.88rem;color:var(--muted);line-height:1.6;margin-bottom:1rem;">
        <strong>Durum:</strong> Sunucunun ana sohbet kanalında (#genel-chat), sunucunun kıdemli ve popüler 3 üyesi ile henüz yeni katılmış 2 üye arasında hassas bir toplumsal/güncel konu üzerinden tartışma başladı. Taraflar doğrudan hakaret etmiyor ancak yoğun şekilde imalı dil, pasif-agresif ifadeler ve mizah kılıfı altında aşağılamalar kullanıyor. Sohbet aşırı hızlandı, diğer üyeler rahatsız olup kanaldan çıkmaya başladı.
      </p>
      ${_field('q_s1_A', 'Soru A — Kanala müdahale ederken kullanacağınız ilk mesajın birebir metnini yazınız.', 'Müdahale mesajınızın birebir metni...', 3)}
      ${_field('q_s1_B', 'Soru B — Kıdemli üyeler sizin uyarınıza "Biz kural ihlali yapmıyoruz, sohbet ediyoruz. İstemeyen okumasın" şeklinde tepki verirse tutumunuz ne olur?', 'Tutumunuz ve atacağınız adımlar...', 3)}
      ${_field('q_s1_C', 'Soru C — Olayı kanalı yavaş moda (slowmode) almadan veya kilitlenmeden yönetmek için hangi psikolojik/iletişimsel teknikleri kullanırsınız?', 'Kullanacağınız iletişim ve psikolojik yönlendirme teknikleri...', 4)}
    </div>

    <!-- SENARYO 2 -->
    <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(245,158,11,0.2);border-radius:16px;padding:1.4rem;margin-bottom:1.5rem;">
      <div style="font-weight:800;color:#f59e0b;font-size:0.9rem;margin-bottom:0.5rem;">📌 SENARYO 2: Yönetim Karşıtı Provokasyon ve Bilgi Kirliliği</div>
      <p style="font-size:0.88rem;color:var(--muted);line-height:1.6;margin-bottom:1rem;">
        <strong>Durum:</strong> Gece saatlerinde sunucudaki bir kullanıcının haksız yere banlandığı iddiasıyla, bir grup üye #genel-chat ve #öneri-şikayet kanallarında eş zamanlı olarak üst yönetimi hedef alan mesajlar atmaya başladı. Grup, "Adalet İstiyoruz", "Yönetim İstifa" gibi sloganlar atarak sunucu düzenini bozuyor. O an sunucuda sizden başka aktif yetkili bulunmuyor.
      </p>
      ${_field('q_s2_A', 'Soru A — Bu kitlesel tepki karşısında atacağınız ilk 3 teknik/idari adım ne olur?', '1. Adım...\n2. Adım...\n3. Adım...', 3)}
      ${_field('q_s2_B', 'Soru B — İddiaların doğru olup olmadığını bilmediğiniz o anki kriz sürecinde, topluluğun öfkesini dindirmek adına kamuoyuna nasıl bir açıklama yaparsınız? (Açıklama metnini yazınız.)', 'Kamuoyuna yapacağınız yatıştırıcı resmi duyuru metni...', 4)}
      ${_field('q_s2_C', 'Soru C — Olayı provoke eden ana kişiler ile konudan etkilenip galeyana gelen masum üyeleri nasıl ayırt edersiniz?', 'Provokatör ve galeyana gelen üye ayrımı kriterleriniz...', 3)}
    </div>

    <!-- SENARYO 3 -->
    <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(245,158,11,0.2);border-radius:16px;padding:1.4rem;margin-bottom:1.5rem;">
      <div style="font-weight:800;color:#f59e0b;font-size:0.9rem;margin-bottom:0.5rem;">📌 SENARYO 3: Üst Yönetim İçi Anlaşmazlık ve Yetki Suistimali</div>
      <p style="font-size:0.88rem;color:var(--muted);line-height:1.6;margin-bottom:1rem;">
        <strong>Durum:</strong> Bir etkinlik sırasında, sizden kıdemli bir Yönetici (Admin), topluluk önünde bir üyeyi kişisel husumetinden dolayı haksız yere aşağıladı ve rolünü aldı. Mağdur üye size özel mesajdan (DM) ulaşarak ağlayarak yardım istiyor ve olayı sosyal medyaya taşımakla tehdit ediyor.
      </p>
      ${_field('q_s3_A', 'Soru A — Mağdur üyeye özel mesajdan vereceğiniz yanıtın metni ne olur?', 'Mağdur üyeye DM üzerinden yazacağınız yanıt metni...', 3)}
      ${_field('q_s3_B', 'Soru B — Kendi üstünüz olan bu Yönetici ile nasıl bir iletişim kurarsınız? Olayı hiyerarşik olarak bir üst mercie (Sunucu Sahibi / Topluluk Lideri) nasıl raporlarsınız?', 'Kıdemli yönetici ile iletişim ve hiyerarşik raporlama adımlarınız...', 4)}
      ${_field('q_s3_C', 'Soru C — Bu krizin sunucu imajına zarar vermesini önlemek için Elçi olarak alacağınız önlemler nelerdir?', 'Sunucu imajını koruma önlemleri...', 3)}
    </div>

    <!-- SENARYO 4 -->
    <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(245,158,11,0.2);border-radius:16px;padding:1.4rem;margin-bottom:1.5rem;">
      <div style="font-weight:800;color:#f59e0b;font-size:0.9rem;margin-bottom:0.5rem;">📌 SENARYO 4: Çöküş Aşamasındaki Etkinlik ve Düşük Katılım</div>
      <p style="font-size:0.88rem;color:var(--muted);line-height:1.6;margin-bottom:1rem;">
        <strong>Durum:</strong> Haftalar öncesinden duyurusu yapılan, büyük ödüllü bir EkoYıldız topluluk yarışması/etkinliği başladı. Ancak etkinliğin başlamasından 15 dakika geçmesine rağmen sesli kanala sadece 3 kişi katıldı. Etkinliği sunan ekip paniklemiş durumda ve sunucuda ciddi bir mahcubiyet havası oluşmak üzere.
      </p>
      ${_field('q_s4_A', 'Soru A — İlk 10 dakika içinde katılımı anlık olarak artırmak için yapacağınız acil durum hamleleri nelerdir?', 'Katılımı anlık yükseltmek için atılacak acil hamleler...', 3)}
      ${_field('q_s4_B', 'Soru B — Duyuru kanallarını, rol etiketlerini (@everyone / @here suistimal etmeden) ve diğer kanalları nasıl efektif kullanırsınız?', 'Etiket suistimali yapmadan duyuru kanallarını efektif kullanma...', 3)}
      ${_field('q_s4_C', 'Soru C — Etkinlik bittikten sonra bu başarısızlığın tekrarlanmaması için yönetime sunacağınız analiz raporunda hangi başlıklara yer verirsiniz?', 'Analiz raporu başlıkları ve çözüm tavsiyeleri...', 4)}
    </div>

    <!-- SENARYO 5 -->
    <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(245,158,11,0.2);border-radius:16px;padding:1.4rem;">
      <div style="font-weight:800;color:#f59e0b;font-size:0.9rem;margin-bottom:0.5rem;">📌 SENARYO 5: Özel Mesaj (DM) İhlalleri ve Gizli Çıkar İlişkileri</div>
      <p style="font-size:0.88rem;color:var(--muted);line-height:1.6;margin-bottom:1rem;">
        <strong>Durum:</strong> Bir topluluk üyesi size ekran görüntüleriyle birlikte gelerek, başka bir sunucunun reklamcısının EkoYıldız üyelerine DM üzerinden reklam attığını ve bu kişinin sunucumuzdaki bazı üyelerle iş birliği yaptığını bildirdi.
      </p>
      ${_field('q_s5_A', 'Soru A — Kanıtların geçerliliğini ve doğruluğunu doğrulamak için hangi kriterleri incelersiniz?', 'Kanıt doğrulama kriterleriniz...', 3)}
      ${_field('q_s5_B', 'Soru B — Sunucu içindeki sızmaları ve gizli reklam faaliyetlerini tespit etmek için ne tür bir izleme ve raporlama mekanizması kurarsınız?', 'İzleme ve raporlama mekanizması tasarımı...', 4)}
    </div>`;

  const step3 = _step(3, '#f59e0b', 'BÖLÜM III — DERİNLATILMIŞ SENARYO VE KRİZ YÖNETİMİ TESTLERİ', 'Gerçekçi kriz durumlarında karar alma ve iletişim becerisi.', step3Body, prevBtn(3) + nextBtn(3, '#f59e0b', '#f59e0b,#d97706'));

  // ═══ BÖLÜM 4 ═══
  const step4Body = `
    <div style="background:rgba(236,72,153,0.06);border-left:3px solid #ec4899;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Aşağıdaki ifadelere "Katılıyorum", "Kısmen Katılıyorum" veya "Katılmıyorum" şeklinde yanıt verip <strong>en az 3 cümle</strong> ile gerekçenizi açıklayınız.
    </div>
    ${_ethicsField('q_e1', 1, 'Bir Topluluk Elçisi, sunucu içinde en yakın arkadaşı bile kural ihlali yapsa, hiçbir tolerans göstermeden resmi prosedürü uygulamalıdır.')}
    ${_ethicsField('q_e2', 2, 'Topluluk içi huzur için bazen kuralların esnetilmesi veya yazılı olmayan insani çözümler uygulanması gerekebilir.')}
    ${_ethicsField('q_e3', 3, 'Yetkili ekibi içerisindeki bir tartışma veya fikir ayrılığı asla üyelere yansıtılmamalı, üye önünde tartışılmamalıdır.')}
    ${_ethicsField('q_e4', 4, 'Topluluk Elçisi, sunucudaki olumsuz eleştirileri silmek yerine, o eleştirileri topluluğun gelişim fırsatı olarak yönetmelidir.')}`;

  const step4 = _step(4, '#ec4899', 'BÖLÜM IV — ETİK, İLETİŞİM VE KİŞİSEL TUTUM TESTİ', 'Etik ilkeler, tarafsızlık ve yetkili tutumu testi.', step4Body, prevBtn(4) + nextBtn(4, '#ec4899', '#ec4899,#be185d'));

  // ═══ BÖLÜM 5 ═══
  const step5Body = `
    <div style="background:rgba(16,185,129,0.06);border-left:3px solid #10b981;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Discord platform hakimiyeti, bot sistemleri, log takibi ve markdown düzen yetkinliğinizi ölçen teknik sorular.
    </div>
    ${_field('q_t1_security', 'Discord Sunucu Güvenliği ve Bot Yapılandırmaları', 'Sunucu güvenlik seviyeleri, doğrulama sistemleri ve otomasyon botları (kayıt botları, ceza botları, log sistemleri) hakkındaki tecrübelerinizi açıklayınız...', 4)}
    ${_field('q_t2_auditLog', 'Log (Kayıt) İnceleme Becerisi', 'Bir kural ihlali veya sohbet silinmesi durumunda, denetim kaydı (Audit Log) ve bot log kanalları üzerinden olayı nasıl takip eder ve kanıtlaştırırsınız?', 4)}
    ${_field('q_t3_markdown', 'Discord Zengin Metin (Markdown) ve Görsel Düzen Tasarımı', 'EkoYıldız topluluğuna özel hazırlanmış "Hoş Geldin & Kurallar Hatırlatması" temalı, Markdown (kalın, italik, kod bloğu, alt çizgi) kullanılarak biçimlendirilmiş profesyonel bir duyuru metni tasarlayınız:\n\n```markdown\n# 🌟 EKOYILDIZ TOPLULUĞUNA HOŞ GELDİNİZ! ...\n```', 6)}`;

  const step5 = _step(5, '#10b981', 'BÖLÜM V — TEKNİK BİLGİ VE BOT/SİSTEM HAKİMİYETİ', 'Bot sistemleri, Audit Log takibi ve Markdown duyuru tasarımı.', step5Body, prevBtn(5) + nextBtn(5, '#10b981', '#10b981,#047857'));

  // ═══ BÖLÜM 6 ═══
  const step6Body = `
    <div style="background:rgba(59,130,246,0.06);border-left:3px solid #3b82f6;padding:1.2rem 1.4rem;border-radius:0 12px 12px 0;font-size:0.9rem;color:#e2e8f0;line-height:1.7;margin-bottom:1.5rem;">
      <div style="font-weight:800;color:#60a5fa;margin-bottom:0.5rem;font-size:1rem;">📜 TAAHHÜT VE RESMİ ONAY BEYANI</div>
      "Yukarıda verdiğim tüm bilgilerin, senaryo yanıtlarının ve analizlerin şahsıma ait olduğunu; EkoYıldız Topluluk Elçiliği rolüne seçilmem halinde sunucu gizlilik ilkelerine, yetkili etiğine ve hiyerarşik yapıya eksiksiz uyacağımı taahhüt ederim."
    </div>

    <div style="margin-bottom:1.5rem;background:rgba(0,0,0,0.3);border:1px solid rgba(59,130,246,0.3);border-radius:16px;padding:1.2rem;">
      <label style="display:flex;align-items:center;gap:0.8rem;cursor:pointer;color:#fff;font-weight:700;font-size:0.95rem;">
        <input type="checkbox" id="q_decl_confirm" required style="width:20px;height:20px;accent-color:#3b82f6;flex-shrink:0;">
        <span>Yukarıdaki taahhütnameyi okudum, anladım ve kabul ediyorum. *</span>
      </label>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
      ${_fieldInput('q_decl_date', 'Tarih', 'Örn: ' + new Date().toLocaleDateString('tr-TR'))}
      ${_fieldInput('q_decl_signature', 'İmza / Ad Soyad', 'Adınız Soyadınız')}
    </div>

    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:14px;padding:1rem 1.2rem;font-size:0.85rem;color:#fde68a;line-height:1.6;margin-bottom:1rem;">
      ⚠️ <strong>Son Kontrol Hatırlatması:</strong> Formu göndermeden önce tüm bölümleri eksiksiz doldurduğunuzdan emin olunuz. Gönderilen başvurularda sonradan değişiklik yapılamaz.
    </div>`;

  const submitBtn = `<button type="submit" id="ambassador-submit-btn" class="btn" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;padding:0.9rem 2.5rem;border-radius:30px;border:none;cursor:pointer;font-size:1.05rem;box-shadow:0 6px 20px rgba(245,158,11,0.4);letter-spacing:0.5px;">🚀 Başvuruyu Resmen Gönder</button>`;
  const step6 = _step(6, '#3b82f6', 'BÖLÜM VI — ONAY VE BEYAN', 'Taahhütname onayı, tarih ve imza.', step6Body, prevBtn(6) + submitBtn);

  // ═══ MAIN PAGE LAYOUT ═══
  const content = `
    <div style="max-width:960px; margin:2rem auto; animation:fadeUp 0.5s ease;">
      
      <!-- HEADER BANNER CARD -->
      <div class="card" style="padding:0; overflow:hidden; border-radius:24px; border:1px solid rgba(255,255,255,0.1); margin-bottom:1.5rem; box-shadow:0 12px 35px rgba(0,0,0,0.5);">
        <img src="${BANNER}" alt="EkoYıldız Topluluk Elçisi" style="width:100%; display:block; max-height:280px; object-fit:cover; object-position:center;">
      </div>

      <!-- FORM HEADER TITLE CARD -->
      <div class="card" style="background:rgba(20,20,35,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:2rem;backdrop-filter:blur(20px);margin-bottom:1.5rem;border-top:4px solid #f59e0b;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
          <div>
            <div style="color:#f59e0b;font-size:0.85rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:0.4rem;">👑 EKOYILDIZ TOPLULUK ELÇİLİĞİ</div>
            <h1 style="font-size:1.8rem;font-weight:800;color:#fff;margin:0;">Topluluk Elçisi // Mülakat Başvuru Formu</h1>
          </div>
          <a href="/forms" class="btn btn-sm btn-ghost" style="border-radius:20px;">← Tüm Formlara Dön</a>
        </div>
      </div>

      <!-- COUNTDOWN BANNER CARD -->
      <div class="card" style="background:linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.08));border:1px solid rgba(245,158,11,0.4);border-radius:20px;padding:1.5rem;margin-bottom:1.5rem;backdrop-filter:blur(20px);box-shadow:0 8px 30px rgba(245,158,11,0.15);">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.2rem;">
          <div style="display:flex;align-items:center;gap:1rem;">
            <div style="font-size:2.2rem;">⏰</div>
            <div>
              <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.3rem;flex-wrap:wrap;">
                <span style="background:#f59e0b;color:#000;font-weight:900;font-size:0.75rem;padding:0.25rem 0.75rem;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">
                  ⏰ (20 SAAT SONRA KAPANACAK)
                </span>
                <span style="color:#fbbf24;font-size:0.85rem;font-weight:700;">SÜRELİ BAŞVURU</span>
              </div>
              <h3 id="countdown-banner-title" style="font-size:1.15rem;font-weight:800;color:#fff;margin:0;">Topluluk Elçiliği Başvuruları Kapanıyor</h3>
            </div>
          </div>
          <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(245,158,11,0.3);border-radius:16px;padding:0.8rem 1.4rem;text-align:center;min-width:240px;">
            <div style="font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:0.3rem;">KAPANMASINA KALAN SÜRE</div>
            <div id="ambassador-countdown" style="font-family:monospace,Consolas,'Courier New';font-size:1.5rem;font-weight:900;color:#fbbf24;letter-spacing:1px;text-shadow:0 0 10px rgba(245,158,11,0.4);">
              -- : -- : --
            </div>
          </div>
        </div>
      </div>

      ${existingSubmission ? `
        <div class="card" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:20px;padding:2.5rem;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">⏳</div>
          <h2 style="font-size:1.6rem;font-weight:800;color:#fff;margin-bottom:0.6rem;">Topluluk Elçiliği Başvurunuz İncelemede!</h2>
          <p style="color:var(--muted);max-width:650px;margin:0 auto 1.5rem;line-height:1.6;">
            Sayın <strong>${_esc(usernameStr)}</strong>, başvurunuz <strong>${new Date(existingSubmission.createdAt).toLocaleString('tr-TR')}</strong> tarihinde başarıyla teslim alınmıştır.
          </p>
          <div style="display:inline-block;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1rem 1.5rem;text-align:left;font-size:0.9rem;color:var(--muted);">
            <div>📌 <strong>Durum:</strong> <span style="color:#fbbf24;font-weight:700;">⏳ İNCELENİYOR</span></div>
            <div>🆔 <strong>ID:</strong> <code>${existingSubmission._id}</code></div>
          </div>
        </div>
      ` : (Date.now() >= 1786455128000) ? `
        <div class="card" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:20px;padding:3rem;text-align:center;">
          <div style="font-size:3.5rem;margin-bottom:1rem;">🔒</div>
          <h2 style="font-size:1.8rem;font-weight:800;color:#f87171;margin-bottom:0.8rem;">Topluluk Elçiliği Başvuruları Kapandı!</h2>
          <p style="color:var(--muted);max-width:650px;margin:0 auto 1.5rem;line-height:1.6;font-size:1rem;">
            20 saatlik başvuru süresi dolduğu için Topluluk Elçisi mülakat başvuru formu gönderime resmen kapatılmıştır. İlginiz için teşekkür ederiz!
          </p>
          <div style="display:inline-flex;align-items:center;gap:0.5rem;background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:0.7rem 1.4rem;font-weight:800;font-size:0.9rem;">
            <span>🚫 BAŞVURU DURUMU: KAPALI</span>
          </div>
        </div>
      ` : `

        <!-- DOCUMENTATION & ROLE DESCRIPTION CARD -->
        <div class="card" style="margin-bottom:1.5rem;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:1.8rem;">
          <h3 style="font-size:1.2rem;font-weight:800;color:#fff;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
            <span>📜</span> 1. Topluluk Elçiliği Rolü ve Vizyonu
          </h3>
          <p style="font-size:0.92rem;color:var(--muted);line-height:1.7;margin-bottom:1.2rem;">
            EkoYıldız topluluğunda Topluluk Elçisi, sadece düzeni sağlayan bir yetkili değil; sunucu kültürünü dış dünyaya tanıtan, üyeler arası etkileşimi artıran, markanın imajını temsil eden ve topluluk içi dinamikleri yöneten köprü rolüdür.
          </p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:0.8rem;margin-bottom:1.5rem;">
            <div style="border-left:3px solid #f59e0b;padding:0.7rem 1rem;background:rgba(255,255,255,0.02);border-radius:0 10px 10px 0;font-size:0.85rem;">
              <strong style="color:#fff;">Temsil ve Marka Yüzü:</strong> EkoYıldız sunucusunu hem Discord bünyesinde hem de harici platformlarda vizyonuna uygun temsil etmek.
            </div>
            <div style="border-left:3px solid #34d399;padding:0.7rem 1rem;background:rgba(255,255,255,0.02);border-radius:0 10px 10px 0;font-size:0.85rem;">
              <strong style="color:#fff;">Kullanıcı Karşılama:</strong> Yeni katılan kişilerin uyum sürecini hızlandırmak ve aktif üyeliğe teşvik etmek.
            </div>
            <div style="border-left:3px solid #a78bfa;padding:0.7rem 1rem;background:rgba(255,255,255,0.02);border-radius:0 10px 10px 0;font-size:0.85rem;">
              <strong style="color:#fff;">Kriz ve Denge Yönetimi:</strong> Sohbet kanallarındaki gerginlikleri kural ihlallerine varmadan uzlaşmacı üslupla yatıştırmak.
            </div>
            <div style="border-left:3px solid #818cf8;padding:0.7rem 1rem;background:rgba(255,255,255,0.02);border-radius:0 10px 10px 0;font-size:0.85rem;">
              <strong style="color:#fff;">Etkinlik ve Etkileşim:</strong> Yarışma, çekiliş, sesli kanal buluşmaları ve organizasyon desteği sağlamak.
            </div>
            <div style="border-left:3px solid #ec4899;padding:0.7rem 1rem;background:rgba(255,255,255,0.02);border-radius:0 10px 10px 0;font-size:0.85rem;grid-column:1/-1;">
              <strong style="color:#fff;">Geri Bildirim Toplama:</strong> Üyelerden gelen istek ve önerileri hiyerarşik yapıya uygun biçimde Üst Yönetim ekibine raporlamak.
            </div>
          </div>

          <h4 style="font-size:1.05rem;font-weight:800;color:#fff;margin-bottom:0.8rem;">🎯 2. Adaylarda Aranan Kriterler ve Yetkinlikler</h4>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.6rem;font-size:0.84rem;color:var(--muted);margin-bottom:1.5rem;">
            <div style="background:rgba(0,0,0,0.2);padding:0.6rem 0.9rem;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
              • <strong>Yaş ve Olgunluk:</strong> Kriz anında soğukkanlı kalma yetisi.
            </div>
            <div style="background:rgba(0,0,0,0.2);padding:0.6rem 0.9rem;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
              • <strong>İletişim & Diksiyon:</strong> Türkçeyi imla kurallarına uygun kullanabilme.
            </div>
            <div style="background:rgba(0,0,0,0.2);padding:0.6rem 0.9rem;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
              • <strong>Discord Bilgisi:</strong> Yetki/rol ve bot komutlarına hakimiyet.
            </div>
            <div style="background:rgba(0,0,0,0.2);padding:0.6rem 0.9rem;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
              • <strong>Aktiflik & Sorumluluk:</strong> Haftalık aktiflik sürelerini aksatmama.
            </div>
          </div>

          <div style="background:rgba(245,158,11,0.08);border-left:4px solid #f59e0b;padding:0.9rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.86rem;color:#fde68a;line-height:1.6;">
            <strong>📌 ADAYLARA NOT:</strong> Bu form, EkoYıldız topluluğundaki stratejik ve temsil düzeyi yüksek "Topluluk Elçisi" rolü için hazırlanmıştır. Yanıtlarınızın yüzeysel olmaması, detaylı gerekçeler ve somut adımlar içermesi değerlendirme puanınızı doğrudan etkileyecektir.
          </div>
        </div>

        <!-- STEP PROGRESS BAR -->
        <div id="step-progress" class="card" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:1.2rem 1.5rem;margin-bottom:1.2rem;">
          <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.8rem;flex-wrap:wrap;">
            ${[
      ['1', 'Profil', '#818cf8'],
      ['2', 'Vizyon', '#a78bfa'],
      ['3', 'Kriz & Senaryo', '#f59e0b'],
      ['4', 'Etik Testi', '#ec4899'],
      ['5', 'Teknik & Bot', '#10b981'],
      ['6', 'Onay', '#3b82f6']
    ].map(([n, label, color], i) => `
              <div id="step-pill-${n}" style="display:flex;align-items:center;gap:0.35rem;padding:0.3rem 0.65rem;border-radius:20px;font-size:0.78rem;font-weight:800;border:1.5px solid ${color}40;color:${color};opacity:${i === 0 ? '1' : '0.4'};transition:opacity 0.3s;cursor:pointer;" onclick="toggleStep(${n})">
                <span style="width:18px;height:18px;border-radius:50%;background:${color}20;border:1.5px solid ${color};display:inline-flex;align-items:center;justify-content:center;font-size:0.7rem;">${n}</span>
                ${label}
                <span class="pill-check" style="display:none;color:${color};font-weight:800;">✓</span>
              </div>
              ${i < 5 ? '<div style="flex:1;min-width:12px;height:2px;background:rgba(255,255,255,0.08);border-radius:1px;"><div id="step-bar-' + n + '" style="height:100%;width:0%;background:' + color + ';border-radius:1px;transition:width 0.4s;"></div></div>' : ''}
            `).join('')}
          </div>
          <div style="font-size:0.82rem;color:var(--muted);">Bölüm <span id="step-current-label">1</span>/6 — <span id="step-name-label" style="color:var(--accent);">Kişisel Bilgiler & Profil</span></div>
        </div>

        <form id="community-ambassador-form" autocomplete="off" style="display:flex;flex-direction:column;gap:1.2rem;">
          ${step1}
          ${step2}
          ${step3}
          ${step4}
          ${step5}
          ${step6}
        </form>

        <script>
          const _beh = {};
          let _currentStep = 1;
          const STEP_NAMES = {
            1: 'Kişisel Bilgiler & Profil',
            2: 'Motivasyon, Vizyon ve Rol Bilinci',
            3: 'Derinleştirilmiş Senaryo ve Kriz Yönetimi',
            4: 'Etik, İletişim ve Kişisel Tutum Testi',
            5: 'Teknik Bilgi ve Bot/Sistem Hakimiyeti',
            6: 'Onay ve Beyan'
          };
          const STEP_COLORS = {
            1: '#818cf8',
            2: '#a78bfa',
            3: '#f59e0b',
            4: '#ec4899',
            5: '#10b981',
            6: '#3b82f6'
          };

          function _initTracking() {
            document.querySelectorAll('.track-field').forEach(el => {
              const fid = el.getAttribute('data-field');
              if (!fid) return;
              if (!_beh[fid]) {
                _beh[fid] = { focusCount: 0, pasteCount: 0, totalTimeMs: 0, charCount: 0, wordCount: 0, focusStart: 0 };
              }
              el.addEventListener('focus', () => {
                _beh[fid].focusCount++;
                _beh[fid].focusStart = Date.now();
              });
              el.addEventListener('blur', () => {
                if (_beh[fid].focusStart > 0) {
                  _beh[fid].totalTimeMs += (Date.now() - _beh[fid].focusStart);
                  _beh[fid].focusStart = 0;
                }
              });
              el.addEventListener('paste', () => {
                _beh[fid].pasteCount++;
              });
              el.addEventListener('input', () => {
                const val = el.value || '';
                _beh[fid].charCount = val.length;
                _beh[fid].wordCount = val.trim() ? val.trim().split(/\\s+/).length : 0;
                const hintEl = document.getElementById('hint-' + fid);
                if (hintEl) {
                  hintEl.textContent = val.length > 0 ? (val.length + ' karakter, ' + _beh[fid].wordCount + ' kelime') : '';
                }
              });
            });
          }

          function toggleStep(num) {
            const stepEl = document.getElementById('form-step-' + num);
            if (!stepEl) return;
            const bodyEl = stepEl.querySelector('.step-body');
            const expandBtn = stepEl.querySelector('.step-expand-btn');
            if (bodyEl.style.display === 'none') {
              bodyEl.style.display = 'block';
              if (expandBtn) expandBtn.textContent = '▼';
            } else {
              bodyEl.style.display = 'none';
              if (expandBtn) expandBtn.textContent = '▲';
            }
          }

          function _updateStepUI(stepNum) {
            _currentStep = stepNum;
            for (let i = 1; i <= 6; i++) {
              const st = document.getElementById('form-step-' + i);
              const pill = document.getElementById('step-pill-' + i);
              const bar = document.getElementById('step-bar-' + i);
              if (st) {
                if (i === stepNum) {
                  st.style.display = 'block';
                  st.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  st.style.display = 'none';
                }
              }
              if (pill) {
                pill.style.opacity = i === stepNum ? '1' : i < stepNum ? '0.85' : '0.4';
                const check = pill.querySelector('.pill-check');
                if (check) check.style.display = i < stepNum ? 'inline' : 'none';
              }
              if (bar) {
                bar.style.width = i < stepNum ? '100%' : '0%';
              }
            }
            const lbl = document.getElementById('step-current-label');
            const nlbl = document.getElementById('step-name-label');
            if (lbl) lbl.textContent = stepNum;
            if (nlbl) {
              nlbl.textContent = STEP_NAMES[stepNum];
              nlbl.style.color = STEP_COLORS[stepNum];
            }
          }

          function nextStep(currentNum) {
            const currentStepEl = document.getElementById('form-step-' + currentNum);
            if (currentStepEl) {
              const reqs = currentStepEl.querySelectorAll('[required]');
              let valid = true;
              reqs.forEach(r => {
                if (r.type === 'radio') {
                  const name = r.name;
                  const checked = currentStepEl.querySelector('input[name="' + name + '"]:checked');
                  if (!checked) valid = false;
                } else if (!r.value || !r.value.trim()) {
                  r.style.borderColor = '#f43f5e';
                  valid = false;
                } else {
                  r.style.borderColor = 'rgba(255,255,255,0.12)';
                }
              });
              if (!valid) {
                if (typeof showToast === 'function') {
                  showToast('⚠️ Lütfen bu bölümdeki tüm zorunlu soruları doldurunuz.', 'warning');
                } else {
                  alert('Lütfen bu bölümdeki tüm zorunlu soruları doldurunuz.');
                }
                return;
              }
            }
            if (currentNum < 6) {
              _updateStepUI(currentNum + 1);
            }
          }

          function prevStep(currentNum) {
            if (currentNum > 1) {
              _updateStepUI(currentNum - 1);
            }
          }

          document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('community-ambassador-form');
            if (!form) return;

            form.addEventListener('submit', async function(e) {
              e.preventDefault();

              const confirmCb = document.getElementById('q_decl_confirm');
              if (!confirmCb || !confirmCb.checked) {
                if (typeof showToast === 'function') showToast('⚠️ Lütfen resmi taahhütnameyi onaylayınız.', 'warning');
                return;
              }

              const btn = document.getElementById('ambassador-submit-btn');
              btn.disabled = true;
              btn.innerHTML = '⏳ Gönderiliyor...';

              const payload = {
                discordUsername: document.getElementById('q_discordUsername')?.value || '',
                section1: {
                  fullName: document.getElementById('q_fullName')?.value || '',
                  discordUsername: document.getElementById('q_discordUsername')?.value || '',
                  ageBirthDate: document.getElementById('q_ageBirthDate')?.value || '',
                  cityTimezone: document.getElementById('q_cityTimezone')?.value || '',
                  availability: document.getElementById('q_availability')?.value || '',
                  pastExperience: document.getElementById('q_pastExperience')?.value || '',
                  toughestIncident: document.getElementById('q_toughestIncident')?.value || '',
                  references: document.getElementById('q_references')?.value || '',
                },
                section2: {
                  brandVision: document.getElementById('q_brandVision')?.value || '',
                  ambassadorVsMod: document.getElementById('q_ambassadorVsMod')?.value || '',
                  top3Traits: document.getElementById('q_top3Traits')?.value || '',
                  first30DaysPlan: document.getElementById('q_first30DaysPlan')?.value || '',
                  retentionStrategy: document.getElementById('q_retentionStrategy')?.value || '',
                },
                section3: {
                  scenario1_A: document.getElementById('q_s1_A')?.value || '',
                  scenario1_B: document.getElementById('q_s1_B')?.value || '',
                  scenario1_C: document.getElementById('q_s1_C')?.value || '',
                  scenario2_A: document.getElementById('q_s2_A')?.value || '',
                  scenario2_B: document.getElementById('q_s2_B')?.value || '',
                  scenario2_C: document.getElementById('q_s2_C')?.value || '',
                  scenario3_A: document.getElementById('q_s3_A')?.value || '',
                  scenario3_B: document.getElementById('q_s3_B')?.value || '',
                  scenario3_C: document.getElementById('q_s3_C')?.value || '',
                  scenario4_A: document.getElementById('q_s4_A')?.value || '',
                  scenario4_B: document.getElementById('q_s4_B')?.value || '',
                  scenario4_C: document.getElementById('q_s4_C')?.value || '',
                  scenario5_A: document.getElementById('q_s5_A')?.value || '',
                  scenario5_B: document.getElementById('q_s5_B')?.value || '',
                },
                section4: {
                  ethics1: {
                    choice: form.querySelector('input[name="q_e1_choice"]:checked')?.value || '',
                    reason: document.getElementById('q_e1_reason')?.value || '',
                  },
                  ethics2: {
                    choice: form.querySelector('input[name="q_e2_choice"]:checked')?.value || '',
                    reason: document.getElementById('q_e2_reason')?.value || '',
                  },
                  ethics3: {
                    choice: form.querySelector('input[name="q_e3_choice"]:checked')?.value || '',
                    reason: document.getElementById('q_e3_reason')?.value || '',
                  },
                  ethics4: {
                    choice: form.querySelector('input[name="q_e4_choice"]:checked')?.value || '',
                    reason: document.getElementById('q_e4_reason')?.value || '',
                  },
                },
                section5: {
                  techSecurityBots: document.getElementById('q_t1_security')?.value || '',
                  techAuditLogs: document.getElementById('q_t2_auditLog')?.value || '',
                  techMarkdownDesign: document.getElementById('q_t3_markdown')?.value || '',
                },
                section6: {
                  declarationAccepted: true,
                  declarationDate: document.getElementById('q_decl_date')?.value || '',
                  declarationSignature: document.getElementById('q_decl_signature')?.value || '',
                },
                behavior: _beh
              };

              try {
                const res = await fetch('/api/forms/community-ambassador/submit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                  if (typeof showToast === 'function') showToast('✅ ' + data.message, 'success');
                  setTimeout(() => { window.location.reload(); }, 1500);
                } else {
                  if (typeof showToast === 'function') showToast('❌ ' + (data.error || 'Gönderim hatası.'), 'error');
                  btn.disabled = false;
                  btn.innerHTML = '🚀 Başvuruyu Resmen Gönder';
                }
              } catch (err) {
                if (typeof showToast === 'function') showToast('❌ Bağlantı hatası yaşandı.', 'error');
                btn.disabled = false;
                btn.innerHTML = '🚀 Başvuruyu Resmen Gönder';
              }
            });

            (function() {
              const targetTime = 1786455128000;
              const countdownEl = document.getElementById('ambassador-countdown');
              
              function updateCountdown() {
                const now = Date.now();
                const diff = targetTime - now;
                
                if (diff <= 0) {
                  if (countdownEl) {
                    countdownEl.innerText = "00 Sa 00 Dk 00 Sn";
                    countdownEl.style.color = "#f43f5e";
                  }
                  const bannerTitle = document.getElementById('countdown-banner-title');
                  if (bannerTitle) bannerTitle.innerText = "❌ Başvurular Sona Erdi / Kapatıldı";
                  
                  const submitBtn = document.getElementById('ambassador-submit-btn');
                  if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerText = "❌ BAŞVURU SÜRESİ DOLDU (KAPANDI)";
                    submitBtn.style.opacity = "0.5";
                    submitBtn.style.cursor = "not-allowed";
                  }
                  setTimeout(() => { window.location.reload(); }, 1000);
                  return;
                }
                
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                const formatted = 
                  String(hours).padStart(2, '0') + " Sa " + 
                  String(minutes).padStart(2, '0') + " Dk " + 
                  String(seconds).padStart(2, '0') + " Sn";
                  
                if (countdownEl) countdownEl.innerText = formatted;
              }
              
              updateCountdown();
              setInterval(updateCountdown, 1000);
            })();

            _initTracking();
          });
        </script>
      `}
    </div>
  `;

  return _layout('Topluluk Elçisi Mülakat Başvuru Formu', currentUser, content, '', '/forms');
}

function renderDeveloperFormPage(currentUser, existingSubmission = null) {
  const _layout = require('./views')._layout;
  const isLoggedIn = Boolean(currentUser);
  const usernameStr = currentUser ? (currentUser.discordUsername || currentUser.username || '') : '';
  const BANNER = 'https://i.imgur.com/Iruh2AD.jpeg';

  function _step(num, color, title, subtitle, bodyHtml, navHtml) {
    const hidden = num > 1 ? 'display:none;' : '';
    return `
      <div id="form-step-${num}" class="form-step card" style="border-radius:20px;border-left:5px solid ${color};${hidden}transition:all 0.35s cubic-bezier(0.4, 0, 0.2, 1);margin-bottom:1.8rem;background:rgba(18,18,32,0.85);backdrop-filter:blur(25px);padding:2.2rem;box-shadow:0 15px 35px rgba(0,0,0,0.4), 0 0 20px ${color}15;">
        <div class="step-header-bar" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.08);" onclick="toggleStep(${num})">
          <div style="display:flex;align-items:center;gap:1rem;">
            <div style="width:42px;height:42px;border-radius:12px;background:${color}20;border:1px solid ${color}50;color:${color};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.2rem;box-shadow:0 4px 12px ${color}20;">
              ${num}
            </div>
            <div>
              <h3 style="font-size:1.15rem;font-weight:800;color:#f8fafc;margin:0 0 0.2rem 0;letter-spacing:0.3px;">${title}</h3>
              <p style="font-size:0.8rem;color:var(--muted);margin:0;line-height:1.4;">${subtitle}</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.7rem;">
            <span class="step-done-badge" id="step-badge-${num}" style="display:none;background:${color}25;color:${color};font-size:0.75rem;font-weight:800;padding:0.3rem 0.8rem;border-radius:20px;border:1px solid ${color}50;box-shadow:0 2px 8px ${color}20;">
              ✓ TAMAMLANDI
            </span>
            <span class="step-expand-icon" id="expand-icon-${num}" style="color:${color};font-size:1.1rem;transition:transform 0.3s;display:inline-block;">▼</span>
          </div>
        </div>
        <div class="step-body" id="step-body-${num}" style="margin-top:1.4rem;">
          ${bodyHtml}
          <div class="step-nav" style="display:flex;justify-content:${num === 1 ? 'flex-end' : 'space-between'};margin-top:2.2rem;padding-top:1.2rem;border-top:1px solid rgba(255,255,255,0.08);">
            ${navHtml}
          </div>
        </div>
      </div>`;
  }

  function _field(id, label, desc, placeholder, rows, hint = '', exampleGuide = '') {
    const recMin = rows >= 4 ? 120 : 60;
    return `
      <div class="form-group dev-field-group" style="margin-bottom:1.8rem;background:rgba(12,12,24,0.6);border:1px solid rgba(255,255,255,0.08);padding:1.3rem 1.4rem;border-radius:14px;transition:all 0.3s;" id="group-${id}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.8rem;margin-bottom:0.6rem;">
          <label class="field-label" style="display:block;font-size:0.94rem;font-weight:800;color:#f1f5f9;line-height:1.45;">
            ${label} <span style="color:#ef4444;font-size:0.95rem;">*</span>
          </label>
          <span id="badge-${id}" class="quality-pill" style="font-size:0.7rem;font-weight:800;padding:0.25rem 0.65rem;border-radius:12px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);white-space:nowrap;transition:all 0.3s;">
            ⚪ Boş
          </span>
        </div>

        ${desc ? `
          <div style="font-size:0.82rem;color:#cbd5e1;line-height:1.65;margin-bottom:0.8rem;background:rgba(129,140,248,0.07);padding:0.75rem 0.95rem;border-radius:10px;border-left:3px solid #818cf8;">
            💡 <strong>Soru Açıklaması & Kriter:</strong> ${desc}
          </div>
        ` : ''}

        ${exampleGuide ? `
          <div style="margin-bottom:0.8rem;">
            <button type="button" class="btn-guide-toggle" onclick="toggleExampleGuide('${id}')" style="background:rgba(129,140,248,0.12);border:1px solid rgba(129,140,248,0.3);color:#a5b4fc;font-size:0.78rem;font-weight:700;padding:0.35rem 0.85rem;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:0.4rem;transition:all 0.2s;">
              ⚡ Örnek İyi Yanıt Rehberi & İpuçları (Tıklayın)
            </button>
            <div id="guide-${id}" style="display:none;margin-top:0.6rem;background:rgba(0,0,0,0.45);border:1px dashed rgba(129,140,248,0.35);padding:0.9rem 1.1rem;border-radius:10px;font-size:0.8rem;color:#e2e8f0;line-height:1.65;">
              <strong style="color:#818cf8;display:block;margin-bottom:0.4rem;font-size:0.82rem;">📌 Değerlendirme Komisyonu Tavsiyesi & Örnek Çerçeve:</strong>
              ${exampleGuide}
            </div>
          </div>
        ` : ''}

        <textarea id="${id}" class="input-field track-field dev-textarea" data-field="${id}" data-rec-min="${recMin}" rows="${rows || 4}" required placeholder="${placeholder}" oninput="updateFieldMetrics('${id}')" style="width:100%;background:rgba(6,6,16,0.8);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:0.85rem 1rem;border-radius:12px;font-size:0.88rem;font-family:inherit;line-height:1.6;resize:vertical;transition:border-color 0.2s, box-shadow 0.2s;"></textarea>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.5rem;font-size:0.75rem;">
          <div style="display:flex;align-items:center;gap:0.6rem;flex:1;max-width:60%;">
            <div style="width:100%;height:5px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
              <div id="bar-${id}" style="width:0%;height:100%;background:#ef4444;transition:width 0.3s, background 0.3s;"></div>
            </div>
          </div>
          <span id="counter-${id}" style="color:var(--muted);font-weight:600;">0 / ${recMin} karakter (Önerilen: ${recMin}+)</span>
        </div>

        ${hint ? `<div style="font-size:0.76rem;color:var(--muted);margin-top:0.35rem;font-style:italic;display:flex;align-items:center;gap:0.3rem;">ℹ️ ${hint}</div>` : ''}
      </div>`;
  }

  const prevBtn = (n) => `<button type="button" onclick="prevStep(${n})" class="btn btn-ghost" style="font-size:0.9rem;font-weight:700;padding:0.75rem 1.6rem;border-radius:30px;">← Önceki Bölüm</button>`;
  const nextBtn = (n, grad) => `<button type="button" onclick="nextStep(${n})" class="btn" style="background:linear-gradient(135deg,${grad});color:#fff;font-weight:800;padding:0.75rem 2.2rem;border-radius:30px;border:none;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(0,0,0,0.3);letter-spacing:0.3px;">Sonraki Bölüm →</button>`;

  // ═══ BÖLÜM 1 ═══
  const step1Body = `
    <div style="background:rgba(129,140,248,0.08);border-left:4px solid #818cf8;padding:1.2rem 1.4rem;border-radius:0 14px 14px 0;font-size:0.9rem;color:#e2e8f0;line-height:1.75;margin-bottom:1.6rem;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
      <h4 style="color:#818cf8;margin:0 0 0.5rem 0;font-size:1rem;display:flex;align-items:center;gap:0.5rem;">
        📌 BÖLÜM 1 AMACI VE DEĞERLENDİRME KRİTERLERİ
      </h4>
      Aşağıdaki bölüm, adayların temel kimlik doğrulaması, Discord platform geçmişi, zaman yönetimi disiplini, çalışma saatleri uyumu ve topluluk geçmişini kapsamlı bir biçimde analiz etmek amacıyla kurgulanmıştır.
      <strong>"Geliştirici Adayı"</strong> statüsü; yüksek sorumluluk bilinci, kesintisiz iletişim, gizlilik ilkelerine (%100 NDA) bağlılık ve kriz anlarında soğukkanlı müdahale yet yeteneği gerektirmektedir. Lütfen tüm soruları eksiksiz ve dürüstçe yanıtlayınız.
    </div>

    <div class="form-group dev-field-group" style="margin-bottom:1.8rem;background:rgba(12,12,24,0.6);border:1px solid rgba(255,255,255,0.08);padding:1.3rem 1.4rem;border-radius:14px;">
      <label class="field-label" style="display:block;font-size:0.94rem;font-weight:800;color:#f1f5f9;margin-bottom:0.5rem;">
        1.0. DISCORD HESABI VE NUMERİK USER ID <span style="color:#ef4444;">*</span>
      </label>
      <div style="font-size:0.8rem;color:#cbd5e1;line-height:1.6;margin-bottom:0.7rem;background:rgba(129,140,248,0.07);padding:0.6rem 0.8rem;border-radius:8px;border-left:3px solid #818cf8;">
        Discord ID'niz, hesabınıza tanımlı 18 haneli benzersiz numerik koddur (Örn: 123456789012345678). Geliştirici bot entegrasyonu ve otomatik mülakat takvimi atamaları bu ID üzerinden yürütülmektedir.
        <strong>Nasıl Alınır?</strong> Discord Ayarlar → Gelişmiş → Geliştirici Modu = AÇIK getirin. Ardından kendi profilinize sağ tıklayıp "Kullanıcı ID'sini Kopyala" seçeneğini kullanın.
      </div>
      <input type="text" id="q_discord" class="input-field track-field" data-field="discord_username" value="${_esc(usernameStr)}" required placeholder="Örn: ekonqtx / 123456789012345678" style="width:100%;background:rgba(6,6,16,0.8);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:0.85rem 1rem;border-radius:12px;font-size:0.88rem;font-family:inherit;" oninput="updateOverallProgress()">
    </div>

    ${_field(
      'q_dev_1_1',
      '1.1. Adınız, Soyadınız ve Kimlik Doğrulama Bilgileriniz',
      'Resmi idari kayıtlarda ve geliştirici sözleşmesinde yer alacak tam adınız ve soyadınız.',
      'Örn: Ahmet Yılmaz',
      2,
      'Tam ad ve soyadınızı eksiksiz giriniz.',
      'Ad Soyad: Ahmet Yılmaz<br>Unvan / Kıdem: Yazılım Mühendisliği Öğrencisi / Full-stack Developer'
    )}

    ${_field(
      'q_dev_1_2',
      '1.2. Yaşınız, Doğum Tarihiniz ve Yaş Grubu Doğrulamanız',
      'Geliştirici kadromuz hukuki sorumluluklar gereğince 16+ yaş sınırı ve olgunluk düzeyi aramaktadır.',
      'Örn: 19 Yaşında (Doğum Tarihi: 14.08.2007)',
      2,
      'Yaşınız ve gün/ay/yıl olarak doğum tarihiniz.',
      'Yaş: 20 | Doğum Tarihi: 15 Mayıs 2006'
    )}

    ${_field(
      'q_dev_1_4',
      '1.4. Yaşadığınız Şehir, Saat Dilimi (UTC/GMT) ve Bağlantı Altyapınız',
      'Geliştirici ekibimiz ile ortak toplantı zamanlarını ve sunucu lokasyonunu senkronize etmek için kullanılır.',
      'Örn: İstanbul / Türkiye (UTC+3) — Fiber İnternet Altyapısı (100 Mbps)',
      2,
      'Şehir, saat dilimi ve internet altyapı durumunuz.',
      'Şehir: Ankara / UTC+3<br>Altyapı: Kesintisiz Fiber 200 Mbps (Yedek mobil veri mevcut)'
    )}

    ${_field(
      'q_dev_2_1',
      '2.1. Günlük ve Haftalık Aktiflik Süreleriniz, Müsaitlik Saat Aralıklarınız',
      'Hafta içi ve hafta sonu geliştirmeye, testlere ve ekip toplantılarına ayırabileceğiniz saat aralıklarını detaylandırınız.',
      'Hafta içi: 18:00 - 01:00 (7 saat)\nHafta sonu: 13:00 - 02:00 (13 saat)\nToplam Haftalık: ~50 Saat aktif kod yazma süresi...',
      4,
      'Hafta içi ve hafta sonu saatlerinizi ayrı ayrı yazınız.',
      '<strong>Hafta İçi:</strong> 19:00 - 02:00 saatleri arası kesintisiz aktiflik.<br><strong>Hafta Sonu:</strong> 12:00 - 03:00 saatleri arası tam zamanlı aktiflik ve test süreçleri.'
    )}

    ${_field(
      'q_dev_2_2',
      '2.2. Acil Durum İletişim Kanallarınız ve Ulaşılabilirlik Düzeyiniz',
      'Sunucu çökmesi, kritik güvenlik açığı veya acil bakımlarda Discord haricinde ulaşılabilecek ikincil kanallarınız.',
      'Örn: E-posta (ahmet@dev.com), Telegram (@ahmet_dev), Telefon/WhatsApp (Acil durumlar için)...',
      3,
      'Birden fazla iletişim kanalını belirtiniz.',
      'E-posta: dev@ekoyildiz.com<br>Telegram: @ekoyildiz_dev<br>Acil Durum Response Süresi: Maksimum 15 dakika'
    )}

    ${_field(
      'q_dev_2_3',
      '2.3. Sesli İletişim Yetkinliğiniz, Ekipman Kaliteniz ve Toplantı Disiplininiz',
      'Geliştirici toplantılarına sesli katılım sağlama, gürültüsüz ortam ve kaliteli mikrofon durumunuz.',
      'Sesli kanallara katılım engelimsizdir. C920 mikrofon / harici kulaklık kullanıyorum, gürültüsüz ortamdayım...',
      3,
      'Sesli toplantı durumu ve ekipman bilgisini açıklayınız.',
      'Mikrofon: HyperX QuadCast (Cızırtısız net ses)<br>Sesli İletişim: Haftalık geliştirici toplantılarına ve acil durum sesli kanallarına kesintisiz katılım taahhüt ediyorum.'
    )}

    ${_field(
      'q_dev_3_1',
      '3.1. Eğitim Durumunuz, Mesleki Statünüz ve Günlük Rutininiz',
      'Mevcut eğitim veya iş durumunuzun yazılım geliştirme sürecinize etkisini açıklayınız.',
      'Bilgisayar Mühendisliği 3. Sınıf öğrencisiyim / Özel bir yazılım şirketinde Backend Developer olarak çalışıyorum...',
      3,
      'Eğitim/meslek statünüzü belirtiniz.',
      'Eğitim: Yazılım Mühendisliği Lisans 2. Sınıf<br>Günlük Rutin: Gündüz dersler, 17:00 sonrası tamamen projeye ve geliştirmelere odaklanma.'
    )}

    ${_field(
      'q_dev_3_2',
      '3.2. Projeye Ayırabileceğiniz Günlük ve Haftalık Kesintisiz Çalışma Süresi',
      'Sadece "online" olmak değil, aktif olarak IDE başında kod yazmaya ayıracağınız kesintisiz net süre.',
      'Günde ortalama 4-6 saat, haftalık ise toplam 30-40 saat net kodlama ve hata ayıklama süresi ayırabilirim...',
      3,
      'Günlük ve haftalık net çalışma saatini rakamsal ve açıklamalı giriniz.',
      'Günlük Net Kodlama: 5 Saat<br>Haftalık Net Kodlama: 35-40 Saat kesintisiz geliştirme ve profiling süresi.'
    )}

    ${_field(
      'q_dev_3_3',
      '3.3. Gelecek Planlarınız, Olası Yoğunluk Dönemleriniz ve Kesinti Önlemleriniz',
      'Önümüzdeki 6 ay içinde vize/final sınavları, iş seyahatleri, tatil veya askerlik durumlarınızı ve projenin aksamaması için alacağınız önlemleri yazınız.',
      'Ocak ve Mayıs aylarında vize/final sınavlarım var. Bu dönemlerde ekibe 2 hafta önceden yazılı bilgi verip nöbetleşe görev devri planlıyorum...',
      4,
      'Gelecek 6 aylık plan ve olası inaktiflik önlemleriniz.',
      '<strong>Yoğunluk Dönemleri:</strong> 15-25 Ocak Vize Haftası.<br><strong>Önlem:</strong> Sınav haftasından 10 gün önce mevcut taskları tamamlayıp stajyer geliştiricilere devir teslim notları hazırlayacağım.'
    )}

    ${_field(
      'q_dev_4_1',
      '4.1. Kendinizi, Çalışma Tarzınızı ve Yazılım Felsefenizi Detaylıca Tanımlayınız',
      'Disiplinli çalışma alışkanlıklarınız, güçlü yönleriniz, kendinizi geliştirmeye açık bulduğunuz alanlar ve kodlama tutkunuz.',
      'Yazılım geliştirmede modülerlik ve Clean Code felsefesini benimserim. Güçlü yönüm karmaşık algoritma mantıklarını basite indirgemektir...',
      5,
      'Kendinizi ve yazılım felsefenizi detaylıca ifade ediniz.',
      '<strong>Çalışma Tarzı:</strong> Problem merkezli ve modüler kod yapısı.<br><strong>Güçlü Yönler:</strong> Algoritma optimizasyonu, veritabanı sorgu hızlandırma.<br><strong>Gelişim Alanı:</strong> CSS animasyonları ve karmaşık NUI efektleri.'
    )}

    ${_field(
      'q_dev_4_2',
      '4.2. Baskı, Stres, Kriz ve Yoğun Çalışma Temposu Altındaki Tutumunuz',
      'Sunucunun canlı yayında çöktüğü, kritik bir dupe açığının çıktığı veya 200 oyuncunun lag yaşadığı kriz anlarındaki soğukkanlı tutumunuz ve müdahale prosedürünüz.',
      'Kriz anlarında panik yapmadan log ve profiler incelemesi başlatırım. İlk olarak hasarı minimuma indirmek için ilgili event veya scripti güvenli moda alırım...',
      5,
      'Kriz yönetimindeki adımlarınızı detaylandırınız.',
      '1. Aşama: Hasarı izole et (Scripti güvenli metoda çek).<br>2. Aşama: Log ve Resmon profiling verilerini incele.<br>3. Aşama: Hotfix uygula ve staging ortamında test et.<br>4. Aşama: Canlıya al ve monitoring yap.'
    )}

    ${_field(
      'q_dev_4_3',
      '4.3. Ekip Çalışması, İletişim Anlayışınız ve Fikir Ayrılıkları Yönetimi',
      'Farklı kodlama üslubuna sahip diğer geliştiricilerle ortak repoda çalışırken takındığınız tavır ve mimari tartışmalarda uzlaşma yönteminizi açıklayınız.',
      'Fikir ayrılıklarında kişisel duygularla değil, benchmark verileri ve kod okunabilirliği ile hareket ederim. Ortak üslup için linter kurallarına uyarım...',
      4,
      'Ekip uyumu ve teknik tartışma yönetiminizi yazınız.',
      'Mimari kararlarda kişisel görüş yerine performans test sonuçlarını (Benchmark / Memory usage) baz alırım. Kod incelemelerinde (Code Review) yapıcı eleştiri sunarım.'
    )}

    ${_field(
      'q_dev_5_1',
      '5.1. Daha Önce Görev Aldığınız Projeler, Sunucular ve Tamamladığınız Sistemler',
      'Geçmişte sıfırdan yazdığınız veya katkı sunduğunuz sistemler (Envanter, Birlik Yönetimi, Ekonomi, Discord Botları vb.) ve referans projeleriniz.',
      'X Projesinde Lead Developer olarak 1 yıl görev aldım. Sıfırdan QBCore uyumlu custom envanter ve SQL optimization sistemleri geliştirdim...',
      5,
      'Proje isimleri, aldığınız roller ve tamamladığınız işleri sıralayınız.',
      '<strong>1. X Roleplay (2024-2025):</strong> Lead Developer. Sıfırdan Modüler Birlik ve Mülk yönetim altyapısı.<br><strong>2. Eko Creations Botu (2025):</strong> Node.js ve MongoDB tabanlı ekonomi ve ceza takip sistemi.'
    )}

    ${_field(
      'q_dev_5_2',
      '5.2. Geçmiş Referanslarınız ve İletişim Bilgileri',
      'Teknik yetkinliğinizi ve karakterinizi doğrulayabilecek yetkili, sunucu sahibi veya kıdemli geliştirici referanslarınız.',
      '1. Mehmet K. (X Server Owner) - Discord: mehmet_owner / ID: 9876543210\n2. Serkan T. (Lead Dev) - Discord: serkan_dev',
      3,
      'Discord kullanıcı adları ve projelerdeki görevleri.',
      'Referans 1: Mert A. (Eski Sunucu Sahibi) - Discord: @mert_owner<br>Referans 2: Can V. (Kıdemli Yazılımcı) - Discord: @can_leaddev'
    )}

    ${_field(
      'q_dev_5_3',
      '5.3. Disiplin ve İhlal Geçmişi',
      'Daha önce çalıştığınız projelerde veya topluluklarda aldığınız ceza, uyarı, kara liste veya ihraç durumları var mıdır? Varsa sebeplerini açıklayınız.',
      'Herhangi bir kara liste veya ihraç durumum bulunmamaktadır. Tüm projelerden dostane bir şekilde ayrıldım...',
      3,
      'Varsa açıkça belirtiniz, yoksa "Bulunmamaktadır" yazınız.',
      'Herhangi bir disiplin ihlali, telif ihlali veya projelere zarar verme geçmişim bulunmamaktadır.'
    )}
  `;
  const step1 = _step(1, '#818cf8', 'BÖLÜM 1 — KİŞİSEL BİLGİLER, İLETİŞİM VE KİMLİK DOĞRULAMA', 'Temel kimlik, saat dilimi, zaman yönetimi ve topluluk geçmişiniz.', step1Body, nextBtn(1, '#818cf8,#6366f1'));

  // ═══ BÖLÜM 2 ═══
  const step2Body = `
    <div style="background:rgba(167,139,250,0.08);border-left:4px solid #a78bfa;padding:1.2rem 1.4rem;border-radius:0 14px 14px 0;font-size:0.9rem;color:#e2e8f0;line-height:1.75;margin-bottom:1.6rem;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
      <h4 style="color:#a78bfa;margin:0 0 0.5rem 0;font-size:1rem;display:flex;align-items:center;gap:0.5rem;">
        🧠 BÖLÜM 2 AMACI VE TEKNİK DEĞERLENDİRME STANDARTLARI
      </h4>
      Bu bölüm, <strong>Geliştirici Adayı</strong> pozisyonuna başvuran adayların teorik yazılım bilgisini, nesne yönelimli mimarilere hakimiyetini, veritabanı sorgu optimizasyonunu, ön yüz (NUI) yeteneklerini ve server-side güvenlik yaklaşımlarını ölçmek üzere hazırlanmıştır.
      Cevaplarınızda yüzeysel ifadeler yerine kullandığınız kütüphaneleri, metodolojileri, tasarım kalıplarını (Design Patterns) ve teknik terimleri açıkça belirtiniz.
    </div>

    ${_field(
      'q_dev_t1_1',
      '2.1. Hakim Olduğunuz Programlama, Betik ve İşaretleme Dilleri',
      'Lua, JavaScript (ES6+), TypeScript, C#, Python, HTML5, CSS3/SASS dillerindeki tecrübe sürenizi ve seviyenizi (1-10 arası) detaylandırınız.',
      'Lua (5 Yıl - 9/10), JavaScript (4 Yıl - 8/10), TypeScript (2 Yıl - 7/10), C# (3 Yıl - 7/10), HTML/CSS (4 Yıl - 8/10)...',
      4,
      'Her dil için yıl ve 10 üzerinden seviye belirtiniz.',
      '• <strong>Lua:</strong> 5 Yıl (Seviye: 9/10) - Metatables, Coroutines, State Management.<br>• <strong>JavaScript/TypeScript:</strong> 4 Yıl (Seviye: 8/10) - Async/Await, ESNext, Node.js.<br>• <strong>HTML5/CSS3:</strong> 3 Yıl (Seviye: 8/10) - Flexbox, Grid, NUI Animations.'
    )}

    ${_field(
      'q_dev_t1_2',
      '2.2. Nesne Yönelimli Programlama (OOP) ve Fonksiyonel Programlama İlkeleri',
      'OOP ilkeleri (Inheritance, Encapsulation, Polymorphism, Abstraction) ve Tasarım Kalıpları (Singleton, Factory, Observer) hakkındaki bilginizi ve projelerinizdeki kullanım örneklerini açıklayınız.',
      'Encapsulation ilkeleriyle veritabanı işlemlerini nesneye hapsedip dışarıya güvenli metotlar sunarım. Singleton pattern ile veritabanı bağlantısını tek instance olarak yönetirim...',
      5,
      'OOP prensiplerini ve kullandığınız tasarım kalıplarını açıklayınız.',
      '<strong>Inheritance & Polymorphism:</strong> Araç sınıfları (Helikopter, Araba) üretirken temel Vehicle classından türetme yaparım.<br><strong>Encapsulation:</strong> Oyuncu verilerini private tutup getter/setter yapılarıyla süzgeçten geçiririm.'
    )}

    ${_field(
      'q_dev_t1_3',
      '2.3. Asenkron Programlama, Coroutine ve Karmaşık Veri Yapıları',
      'Async/Await, Promises, Threading, Coroutines, State Machines, Map/Set ve Hash Table veri yapılarını hangi durumlarda tercih ettiğinizi ve performans etkilerini yazınız.',
      'Veritabanı veya dış API çağrılarında main threadi bloklamamak için Async/Await ve Promises yapısı kullanırım. Lua tarafında coroutine.create ile ağır döngüleri zamana yayarım...',
      5,
      'Asenkron mimariyi ve tercih sebeplerinizi yazınız.',
      '<strong>Async/Await:</strong> I/O (Veritabanı/Disk) işlemlerinde event-loop kilitlenmesini engellemek için zorunludur.<br><strong>Map/Set:</strong> Dizi içi aramalarda O(N) karmaşıklığı O(1) düzeyine indirmek için Hash-Map kullanırım.'
    )}

    ${_field(
      'q_dev_t2_1',
      '2.4. Oyun Altyapıları, Çekirdek Framework ve Ekosistem Deneyimi',
      'QBCore, ESX, QBox, vRP veya Özel (Custom) framework altyapılarındaki tecrübeniz, çekirdek (core) revizyonları yapıp yapamadığınız.',
      'QBCore ve ESX altyapılarında çekirdek fonksiyonları (QBCore.Functions vb.) revize ettim. Çekirdek seviyesinde playerdata eventlerini modüler hale getirdim...',
      4,
      'Altyapı bilginizi ve yaptığınız çekirdek değişiklikleri yazınız.',
      'QBCore framework üzerinde 3 yıldır aktif geliştirme yapıyorum. QBCore.Functions.GetPlayer gibi sık çağrılan metodlara Server-Cache katmanı ekleyerek SQL yükünü %40 azalttım.'
    )}

    ${_field(
      'q_dev_t2_2',
      '2.5. Client-Side ve Server-Side Mimari Yapısı ve Güvenlik Ayırımı',
      'Client ve Server arasındaki sorumluluk ayırımı, verilmesi ve verilmemesi gereken kararlar (Client tarafına asla güvenmeme ilkesi).',
      'Client tarafı sadece görsel işleme (NUI/Animasyon) ve kullanıcı girdisi alır. Hiçbir para, envanter, yetki veya koordinat doğrulama kararı Client tarafına bırakılamaz...',
      4,
      'Client-Server güvenlik ayrımı hakkındaki felsefenizi detaylandırınız.',
      '<strong>Güvenlik İlkesi:</strong> "Never Trust The Client". Bütün hesaplamalar, bakiye düşüşleri ve item doğrulamaları kesinlikle Server-Side tarafında gerçekleşmelidir.'
    )}

    ${_field(
      'q_dev_t2_3',
      '2.6. NUI (Native UI) ve Ön Yüz (Frontend) Geliştirme Deneyimi',
      'React.js, Vue.js, Svelte veya Vanilla JavaScript/HTML/CSS ile NUI arayüzü geliştirme tecrübeleriniz, NUI callback mekanizmaları.',
      'React ve Svelte kullanarak performanslı NUI arayüzleri yazıyorum. SendNuiMessage ve RegisterNuiCallback hatasız veri akışı sağlar...',
      4,
      'Kullandığınız frontend teknolojilerini ve NUI haberleşmesini anlatınız.',
      'React.js ve TailwindCSS ile NUI geliştiriyorum. `fetchNui` wrapper fonksiyonu ile Client ve React state arasında 0.1ms altında çift yönlü veri senkronizasyonu sağlıyorum.'
    )}

    ${_field(
      'q_dev_t3_1',
      '2.7. Veritabanı Teknolojileri, İndeksleme ve Sorgu Optimizasyonu',
      'MySQL, MariaDB, MongoDB, PostgreSQL tecrübeniz. İndeksleme (Indexing), Transactions, Foreign Key yapıları ve Yavaş Sorgu (Slow Query) analizi.',
      'MySQL ve MariaDB kullanıyorum. Sık aranan sütunlara (identifier, citizenid, discord_id) B-Tree indeks ekleyerek sorgu süresini 450msden 4msye düşürürüm...',
      5,
      'İndeksleme ve sorgu optimizasyon adımlarınızı anlatınız.',
      '<strong>İndeksleme:</strong> `citizenid` ve `item_name` alanlarına COMPOUND INDEX ekleyerek arama maaliyetini düşürüyorum.<br><strong>Transaction:</strong> Para transferlerinde ACID prensibine uygun `START TRANSACTION` ve `COMMIT/ROLLBACK` yapısı kullanırım.'
    )}

    ${_field(
      'q_dev_t3_2',
      '2.8. Caching (Önbellekleme) ve Geçici Veri Saklama Stratejileri',
      'Veritabanına sürekli yazmak yerine RAM (State/Table) üzerinde veri tutma ve dönemsel (Save Interval / Auto-Save) veritabanına aktarma kurgunuz.',
      'Oyuncu envanteri veya bakiyesi her değiştiğinde SQL atmak yerine Server-RAM (Global Table) üzerinde güncellerim. 15 dakikada bir veya oyundan çıkarken (playerDropped) bulk-save yaparım...',
      5,
      'RAM caching ve otomatik kayıt mimarinizi açıklayınız.',
      '<strong>Memory Cache:</strong> Oyuncu verileri sunucu açılışında RAM\'e yüklenir (State Bag / Global Table).<br><strong>Save Interval:</strong> Her 10 dakikada bir async kanaldan veritabanına toplu (Bulk Insert/Update) yazılır.'
    )}

    ${_field(
      'q_dev_t3_3',
      '2.9. Kod Profiling, Tick Rate ve Resmon Optimizasyonu',
      'Profiler (Resmon) ölçümlerinde 0.15-0.25 ms harcayan mesafe veya arayüz döngülerini 0.00-0.01 ms seviyelerine çekme teknikleriniz.',
      'Sürekli çalışan `CreateThread` döngülerinde `Wait(0)` kullanımını sadece oyuncu yakındayken aktif ederim. Mesafe kontrollerinde `#(vector3 - vector3)` ve dinamik sleep süresi kullanırım...',
      5,
      'Resmon düşürme ve mesafe optimizasyon tekniklerinizi anlatınız.',
      '1. Dinamik Sleep: Oyuncu marker/bölgeden uzaksa `Wait(1500)`, yaklaştıkça `Wait(0)` döngüsüne girer.<br>2. Math Optimization: `GetDistanceBetweenCoords` yerine Lua native `#(v1 - v2)` vektör çıkarması kullanılır.'
    )}

    ${_field(
      'q_dev_t4_1',
      '2.10. Git, GitHub ve Versiyon Kontrol Sistemleri',
      'Git Flow mimarisi, Feature Branch yönetimi, Pull Request (PR) oluşturma, Code Review yapma ve Merge Conflict (Çakışma) çözme adımlarınız.',
      'Main branch doğrudan korunur. Her yeni özellik için `feature/birlik-sistemi` branchi açarım. Çakışma durumunda VS Code Merge Editor ile ikincil kodları kıyaslayıp güvenle birleştiririm...',
      5,
      'Git workflow adımlarınızı ve çakışma yönetimini anlatınız.',
      '<strong>Git Flow:</strong> main → staging → feature/xyz.<br><strong>Conflict Resolution:</strong> Local branch üzerinde `git fetch origin` yapıp `git rebase staging` ile çakışmaları çözüp PR açarım.'
    )}

    ${_field(
      'q_dev_t4_2',
      '2.11. Geliştirme Ortamı (IDE), Linter ve Hata Ayıklama Araçları',
      'VS Code, ESLint, LuaCheck, Prettier, Breakpoint Debugger ve kullandığınız eklentiler.',
      'VS Code üzerinde LuaLS ve ESLint kullanıyorum. Otomatik tip kontrolü (Sumneko Lua Annotations) yazarak kod içi tip hatalarını henüz yazarken engellerim...',
      3,
      'IDE eklentilerinizi ve linter kurulumlarınızı yazınız.',
      'IDE: VS Code.<br>Eklentiler: LuaLS (Sumneko), ESLint, Prettier, GitLens.<br>Tip Kontrolü: `@param` ve `@return` annotasyonları ile sıkı tip denetimi.'
    )}

    ${_field(
      'q_dev_t4_3',
      '2.12. API Tasarımı, Webhook ve Dış Servis Entegrasyonları',
      'REST API end-point kurgusu, Discord Webhook loglama, Axios/Fetch kullanımı ve WebSockets deneyimi.',
      'Express.js ile RESTful API yazarım. Discord Webhooklarında Rate-Limit yememek için kuyruk (Queue System) mimarisi kullanırım...',
      4,
      'Dış servis entegrasyon tecrübenizi ve rate-limit önlemlerinizi yazınız.',
      'Discord Webhook gönderimlerinde 5 saniyelik buffer queue tutarak HTTP 429 (Too Many Requests) hatasını engelliyorum. JSON schema ile payload doğrulaması yapıyorum.'
    )}

    ${_field(
      'q_dev_t5_1',
      '2.13. Server-Side Güvenliği, Anti-Exploit ve Net Event Doğrulamaları',
      'Enjekte edilmiş (injected) yetkisiz `TriggerServerEvent` çağrılarını engelleme, kaynak doğrulama (source check), mesafe doğrulama ve yetki kontrolü.',
      'Her server event başında `source` kontrolü, oyuncu mesafe doğrulaması (`#(playerCoords - targetCoords) < 5.0`) ve yetki süzgeci koyarım. Geçersiz çağrıda kullanıcıyı otomatik banlarım...',
      5,
      'Net event güvenlik kontrollerinizi kod mantığıyla anlatınız.',
      '<strong>Event Güvenlik Süzgeci:</strong><br>1. Source & Cooldown Check<br>2. Distance Validation (Oyuncu hedef noktadan uzaktaysa event reddedilir)<br>3. Security Token / Signature Check'
    )}

    ${_field(
      'q_dev_t5_2',
      '2.14. Veri Doğrulama, Temizleme (Sanitization) ve Hata Yakalama',
      'Client tarafından gönderilen parametrelerin (Item miktarı, Para tutarı, String girdileri) tip denetimi (Type checking), NaN/nil süzgeci ve Injection koruması.',
      'Clienttan gelen veri `tonumber(amount)` ile sayıya çevrilir. `if not amount or amount <= 0 or amount ~= amount (NaN check)` kontrolü yapılarak negatif ve NaN injectionlar engellenir...',
      5,
      'Sanitization ve NaN/Nil koruma kod yapınızı anlatınız.',
      '```lua\nlocal amount = tonumber(rawAmount)\nif not amount or amount <= 0 or amount ~= amount then\n    -- Hileli paket: Ban/Log işlemi\n    return\nend\n```'
    )}
  `;
  const step2 = _step(2, '#a78bfa', 'BÖLÜM 2 — TEKNİK BECERİLER, YAZILIM DENEYİMİ VE KODLAMA STANDARTLARI', 'Diller, OOP, asenkron yapılar, veritabanı, profiling ve güvenlik.', step2Body, prevBtn(2) + nextBtn(2, '#a78bfa,#8b5cf6'));

  // ═══ BÖLÜM 3 ═══
  const step3Body = `
    <div style="background:rgba(52,211,153,0.08);border-left:4px solid #34d399;padding:1.2rem 1.4rem;border-radius:0 14px 14px 0;font-size:0.9rem;color:#e2e8f0;line-height:1.75;margin-bottom:1.6rem;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
      <h4 style="color:#34d399;margin:0 0 0.5rem 0;font-size:1rem;display:flex;align-items:center;gap:0.5rem;">
        🛠️ BÖLÜM 3 AMACI VE GERÇEK SAHA SENARYOLARI
      </h4>
      Bu bölüm, canlı sunucu ortamlarında karşılaşabileceğiniz gerçek yazılım hatalarını, performans darboğazlarını, bellek sızıntılarını (Memory Leak) ve güvenlik ihlallerini çözme kabiliyetinizi ölçmek üzere tasarlanmıştır.
      Lütfen her senaryo için <strong>1) Kök Neden Analizi</strong>, <strong>2) Müdahale Adımları</strong> ve <strong>3) Kod/Mimari Çözüm Revizyonu</strong> şeklinde adım adım açıklama yazınız.
    </div>

    ${_field(
      'q_dev_s1_1',
      '3.1. Senaryo 1: Yüksek Resmon (Tick Rate / CPU Spike) Optimizasyonu',
      'Sunucuda 0.25 ms yük oluşturan bir 3D Text / Marker çizim döngüsünü 0.00-0.01 ms seviyesine indirmek için kodu nasıl refactor edersiniz?',
      'Kök Neden: Her tickte (Wait(0)) tüm koordinatların çizdirilmesi.\nÇözüm: Oyuncunun konumunu 1 saniyelik aralıklarla kontrol eden pasif döngü kurgularım. Oyuncu 5 metre yakına geldiğinde aktif Wait(0) çizim döngüsüne sokarım...',
      6,
      'Adım adım refactoring metodunuzu yazınız.',
      '<strong>1. Kök Neden:</strong> Gereksiz Wait(0) içinde 1000 adet koordinat kontrolü.<br><strong>2. Revizyon:</strong> Grid-based veya Spatial Partitioning mantığı ile sadece bulunulan bölgedeki 1 marker çizdirilir.<br><strong>3. Sonuç:</strong> Resmon 0.25 ms → 0.01 ms.'
    )}

    ${_field(
      'q_dev_s1_2',
      '3.2. Senaryo 2: Bellek Sızıntısı (Memory Leak) ve RAM Yükselişi Analizi',
      'Sunucu açıldıktan 6 saat sonra RAM kullanımı 4 GB seviyesinden 18 GB seviyesine çıkıp sunucu çöküyor. Bu bellek sızıntısını tespit etme ve giderme adımlarınız nelerdir?',
      'Profiler yardımıyla temizlenmeyen event listenerları, kapatılmayan veritabanı bağlantılarını ve sürekli büyüyen global tabloları (Unbounded Tables) tararım. Eventlerde biriken nil yapılmayarak tutulan objeleri silerim...',
      6,
      'Memory leak bulma araçlarınızı ve kod içi temizlik adımlarınızı yazınız.',
      '<strong>1. Profiling:</strong> `collectgarbage("count")` ile Lua bellek artışını anlık izlerim.<br><strong>2. Kök Neden:</strong> Tabloya eklenen ama `table.remove` veya `nil` yapılmayan oyuncu verileri.<br><strong>3. Giderme:</strong> `playerDropped` eventinde tablo temizliği.'
    )}

    ${_field(
      'q_dev_s1_3',
      '3.3. Senaryo 3: Veritabanı Kilitlenmesi (Deadlock & Save Lag Spikes)',
      '100 oyuncu aynı anda sunucudan çıktığında veya saat başı otomatik kayıtta veritabanı kilitleniyor (Deadlock) ve oyuncular 10 saniyelik lag yaşıyor. Bu mimariyi nasıl çözersiniz?',
      'Eşzamanlı (Sync) sorgular yerine MySQL Async / Prepared Statements kurgularım. Tüm kayıtları tek tek değil, Bulk Insert / Transaction paketleri halinde 500ms aralıklarla kuyruktan (Queue Batching) işlerim...',
      6,
      'Deadlock ve lag spike çözme mimarinizi anlatınız.',
      '<strong>Queue Batching Mimari:</strong> Kayıt talepleri `SaveQueue` dizisine atılır. Worker thread her 2 saniyede bir 10 kaydı `UPDATE ... WHERE id IN (...)` şeklinde işleyerek veritabanı kilidini engeller.'
    )}

    ${_field(
      'q_dev_s2_1',
      '3.4. Senaryo 4: Yetkisiz Event Tetikleme (Unprotected Net Event Exploits)',
      'Kötü niyetli bir kullanıcı inject yazılım ile `esx_bank:deposit` veya `qb-banking:server:deposit` eventini dışarıdan çağırıp hesabına sınırsız para ekliyor. Bu olaya acil müdahaleniz ve kalıcı çözümünüz ne olur?',
      'Acil Müdahale: Eventi sunucuyu kapatmadan devre dışı bırakıp hotfix hazırlarım. Kalıcı Çözüm: Server-side tarafta oyuncunun bankamatik/banka yakınında olup olmadığını (`#(playerCoords - bankCoords) < 3.0`) ve paranın envanterde varlığını doğrularım...',
      6,
      'Acil kriz yönetimi ve event doğrulama kod adımlarınızı anlatınız.',
      '<strong>1. Hotfix:</strong> Event içerisine yetki ve koordinat kontrolü ekle.<br><strong>2. Sanitize:</strong> `if amount <= 0 then exports["anticheat"]:Ban(source) end`<br><strong>3. Validation:</strong> Server-side bakiye kontrolü yapmadan bakiyeyi arttırma.'
    )}

    ${_field(
      'q_dev_s2_2',
      '3.5. Senaryo 5: Envanter ve Eşya Çoğaltma (Dupe Exploit & Race Condition) Analizi',
      'İki oyuncu bir araca veya depoya aynı milisaniyede tıklayarak aynı eşyayı 2 katına çıkarıyor (Race Condition). Bu açığı mimari olarak nasıl engellersiniz?',
      'Depo/Envanter slotlarına Mutex / Lock mekanizması koyarım. Bir oyuncu depoyu açtığı anda `inventory:isBusy[depoId] = true` setlenir. İkinci oyuncunun erişimi reddedilir...',
      6,
      'Mutex/Lock yapısı ile race condition engelleme mantığını açıklayınız.',
      '<strong>State Locking:</strong> Envanter açıldığı an Server-Side `BusyLocks[containerId] = source` atanır. İşlem bitmeden veya envanter kapanmadan ikinci bir `GetItem` veya `MoveItem` çağrısı kesinlikle işlenmez.'
    )}

    ${_field(
      'q_dev_s2_3',
      '3.6. Senaryo 6: Hileli Veri Paketleri ve Sanitize İşlemleri',
      'Bir hileci `TriggerServerEvent("buyItem", "weapon_pistol", -999999)` veya `NaN` miktar göndererek para hesabı mantığını bozuyor. Kod seviyesinde bu veri paketini nasıl süzersiniz?',
      'Gelen parametreler `type(item) == "string"` ve `type(count) == "number"` kontrollerinden geçirilir. Sayı pozitif tam sayı (`count > 0 and math.floor(count) == count`) ve `count ~= count` (NaN check) süzgecine tabi tutulur...',
      6,
      'Kod bloğu örneğiyle veri süzme işlemlerini gösteriniz.',
      '```lua\nif type(count) ~= "number" or count <= 0 or count ~= count or count > 100 then\n    exports["anticheat"]:FlagUser(source, "Zararlı Miktar Enjeksiyonu")\n    return\nend\n```'
    )}

    ${_field(
      'q_dev_s3_1',
      '3.7. Senaryo 7: Sıfırdan Modüler ve Ölçeklenebilir Sistem Tasarımı',
      'Sizden sunucu için sıfırdan "Modüler Birlik ve Bölge Kontrol Sistemi" yazmanız istendi. Bu sistemin dosya mimarisini, veri yapısını ve client-server haberleşmesini nasıl tasarlarsınız?',
      'Dosya Yapısı: `client/`, `server/`, `shared/`, `nui/`. Shared tarafında konfigürasyon ve bölge koordinatları tutulur. Server tarafında bölge sahiplikleri RAM tablosunda işlenir...',
      6,
      'Sistem mimari şemasını ve dosya hiyerarşisini yazınız.',
      '📁 config.lua (Bölge koordinatları)<br>📁 server/main.lua (Zone Manager & SQL Sync)<br>📁 client/main.lua (PolyZone & NUI UI Manager)<br>📁 html/ (React tabanlı harita arayüzü)'
    )}

    ${_field(
      'q_dev_s3_2',
      '3.8. Senaryo 8: Çakışan Kütüphaneleri ve Script\'leri Entegre Etme (Merge Conflict & Dependency)',
      'Sunucuda bulunan 2 farklı hedef belirleme kütüphanesi (Örn: `qb-target` ve `ox_target`) çakışıyor ve bazı scriptler çalışmıyor. Bu uyumsuzluğu çözmek için nasıl bir wrapper / adapter yazarsınız?',
      'Ortak bir `TargetAdapter` wrapper kütüphanesi yazarım. `AddTargetModel` veya `AddBoxZone` çağrılarını hangi kütüphane aktifse ona dinamik olarak yönlendiririm...',
      5,
      'Adapter Pattern kullanımınızı ve kütüphane birleştirme adımlarınızı anlatınız.',
      '```lua\nTargetAdapter = {}\nfunction TargetAdapter.AddBoxZone(name, coords, ...)\n    if GetResourceState("ox_target") == "started" then\n        exports.ox_target:addBoxZone(...)\n    else\n        exports["qb-target"]:AddBoxZone(...)\n    end\nend\n```'
    )}

    ${_field(
      'q_dev_s4_1',
      '3.9. Senaryo 9: Mantıksal Hata Analizi (Logical Bugs & Edge Cases)',
      'Konsolda hiçbir error/warning hatası vermeyen ancak araçların benzin seviyesinin sunucu yeniden başladığında sıfırlandığı bir bugı nasıl debug edip çözersiniz?',
      'Veritabanı kayıt kodlarına `print/console.log` veya Logger ekleyerek `playerDropped` ve `vehicleSave` eventlerinin tetiklenme sırasını incelerim. State-bag veri yazma sırasını kontrol ederim...',
      5,
      'Hata ayıklama (debug) adımlarınızı sırasıyla açıklayınız.',
      '1. Aşama: SQL kayıt sorgularına Debug-Logger ekle.<br>2. Aşama: Araç silinirken (DeleteVehicle) benzin verisinin DB\'ye yazılıp yazılmadığını kontrol et.<br>3. Aşama: State-Bag senkronizasyonunu düzelt.'
    )}

    ${_field(
      'q_dev_s4_2',
      '3.10. Senaryo 10: Dış Servis Kesintileri (Discord API / Webhook Outage & Rate-Limit)',
      'Discord API sunucuları çöktüğünde veya Webhooklar yavaşladığında sunucudaki bazı scriptlerin kilitlenmesini engellemek için kod seviyesinde nasıl bir Fallback / Try-Catch mimarisi kurgularsınız?',
      'Discord loglama fonksiyonlarını pcall / try-catch içine alırım. HTTP taleplerini zaman aşımı (Timeout: 2000ms) ile sınırlandırırım. Discord çökse dahi oyun sunucusu kilitlenmez...',
      5,
      'Dış servis çökmesine karşı koruma kodunuzu yazınız.',
      '```lua\nCreateThread(function()\n    local success, err = pcall(function()\n        PerformHttpRequest(webhookUrl, function(status) end, "POST", payload, headers)\n    end)\n    if not success then\n        print("[WARN] Discord Webhook erişilemiyor, oyun akışı etkilenmedi.")\n    end\nend)\n```'
    )}
  `;
  const step3 = _step(3, '#34d399', 'BÖLÜM 3 — PRATİK KODLAMA, PROBLEM ÇÖZME VE GERÇEK SAHA SENARYOLARI', 'Resmon optimizasyonu, bellek sızıntıları, dupe önleme ve kriz yönetimi.', step3Body, prevBtn(3) + nextBtn(3, '#34d399,#059669'));

  // ═══ BÖLÜM 4 ═══
  const step4Body = `
    <div style="background:rgba(245,158,11,0.08);border-left:4px solid #f59e0b;padding:1.2rem 1.4rem;border-radius:0 14px 14px 0;font-size:0.9rem;color:#e2e8f0;line-height:1.75;margin-bottom:1.6rem;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
      <h4 style="color:#f59e0b;margin:0 0 0.5rem 0;font-size:1rem;display:flex;align-items:center;gap:0.5rem;">
        🌟 BÖLÜM 4 AMACI VE EKİP KÜLTÜRÜ STANDARTLARI
      </h4>
      Bu bölüm, Eko Yıldız ve Eko Creations projelerindeki vizyonunuzu, kod temizliği (Clean Code) standartlarınızı, dokümantasyon kültürünüzü ve yönetim kurulu ile kuracağınız disiplinli iletişimi değerlendirmek üzere kurgulanmıştır.
    </div>

    ${_field(
      'q_dev_v1_1',
      '4.1. Eko Yıldız Bünyesine Katılma Motivasyonunuz ve Katkı Vizyonunuz',
      'Eko Yıldız projesini tercih etme sebebiniz ve projenin teknik kalitesine katacağınız özgün değerler.',
      'Eko Yıldız topluluğunun profesyonel yapısı ve inovatif bakış açısı cezbedici. Ekibe katılarak kesintisiz ve yüksek performanslı sistemler kazandırmayı hedefliyorum...',
      4,
      'Katılma motivasyonunuzu ve teknik vizyonunuzu ifade ediniz.',
      'Eko Yıldız ekosisteminde kod standartlarını yükseltmek, sıfır hatalı oyuncu deneyimi sunmak ve yenilikçi oyun sistemleri geliştirmek birincil hedefimdir.'
    )}

    ${_field(
      'q_dev_v1_2',
      '4.2. Kısa ve Uzun Vadeli Geliştirici Hedefleriniz',
      'İlk 1 ay içindeki kısa vadeli hedefleriniz ve 6+ ay içindeki uzun vadeli teknik hedefleriniz.',
      'İlk 1 ayda mevcut kod tabanını inceleyip resmon optimizasyonları yapacağım. 6. ayda ise tamamen özgün modüler altyapıyı yayına almayı hedefliyorum...',
      4,
      'Kısa ve uzun vadeli planlarınızı ayrı ayrı detaylandırınız.',
      '<strong>İlk 1 Ay:</strong> Mevcut sunucu paketinin profiling taraması ve acil optimizasyonlar.<br><strong>6+ Ay:</strong> Özgün ve yüksek ölçeklenebilir 2. nesil sistem altyapısının inşası.'
    )}

    ${_field(
      'q_dev_v1_3',
      '4.3. Proje Mimarisine Bakış Açınız ve İnovasyon Teklifleriniz',
      'Mevcut FiveM / Discord ekosistemlerindeki teknik eksiklikler ve Eko Yıldız projesine getirmek istediğiniz yenilikçi çözümler.',
      'Geleneksel script yapıları yerine event-driven ve mikro-servis mantığına yakın modüler paketler kurgulamak projeye büyük ivme kazandıracaktır...',
      4,
      'Yenilikçi teknik fikirlerinizi paylaşınız.',
      'Discord Botu ile Oyun Sunucusu veritabanı arasında anlık WebSocket köprüsü kurarak tüm istatistikleri ve cezaları 0 delay ile senkronize etmeyi öneriyorum.'
    )}

    ${_field(
      'q_dev_v2_1',
      '4.4. Temiz Kod (Clean Code) ve Okunabilirlik İlkeleri',
      'Değişken isimlendirme standartlarınız (camelCase, snake_case), DRY (Don\'t Repeat Yourself) prensibi ve modüler kod yazma alışkanlığınız.',
      'Lua tarafında snake_case, JS tarafında camelCase standartlarını uygularım. Kendini tekrar eden kodları (DRY) helper fonksiyonlara toplarım...',
      4,
      'Kod okunabilirliği standartlarınızı açıklayınız.',
      'DRY (Don\'t Repeat Yourself) ve KISS (Keep It Simple, Stupid) prensiplerini uygularım. Karmaşık metodları maksimum 30 satırlık küçük fonksiyonlara bölerim.'
    )}

    ${_field(
      'q_dev_v2_2',
      '4.5. Dokümantasyon Standartları ve Bilgi Paylaşımı Kültürünüz',
      'Yazdığınız kütüphanelere API / Export dokümantasyonu çıkarma, README dosyası hazırlama ve ekip arkadaşlarınızı bilgilendirme tarzınız.',
      'Geliştirdiğim her script için `docs/API.md` dosyası oluşturur ve export fonksiyonlarının aldığı parametreleri (@param, @return) eksiksiz yazarım...',
      4,
      'Dokümantasyon çıkarma alışkanlığınızı detaylandırınız.',
      'Her PR öncesinde `README.md` güncellemesi yapar, eklenen yeni exportların kullanım örneklerini (Code Snippets) ekip kanallarına eklerim.'
    )}

    ${_field(
      'q_dev_v2_3',
      '4.6. Eski / Verimsiz Kodları Yenileme (Refactoring) Yaklaşımınız',
      'Geçmişten kalan veya başkası tarafından yazılmış spagetti koda müdahale etme ve güvenli yenileme adımlarınız.',
      'Spagetti koda hemen dalmak yerine önce kodun mevcut girdilerini ve çıktılarını analiz eder, birim testler yazarak aşamalı şekilde refactor ederim...',
      4,
      'Refactoring adımlarınızı anlatınız.',
      'Eski kodu tek seferde silmek yerine geriye dönük uyumluluğu (Backward Compatibility) koruyarak adım adım yeni modüllere aktarırım.'
    )}

    ${_field(
      'q_dev_v3_1',
      '4.7. Yönetim Kurulu ve Üst Merci Talimatlarına Uyum Disiplininiz',
      'Yönetim Kurulu tarafından verilen acil geliştirme taleplerini önceliklendirme, takvime uyma ve düzenli durum raporu (Status Report) sunma tarzınız.',
      'Yönetimden gelen acil talepleri JIRA/Trello üzerinde "Hotfix / Critical" etiketiyle ilk sıraya alırım. Her gün sonunda kısa durum özeti geçerim...',
      4,
      'İdari talimatlara uyum ve raporlama üslubunuzu yazınız.',
      'Acil taleplerde derhal zaman tahmini (ETA) sunar ve geliştirme sürecini 6 saatlik aralıklarla Yönetim Kurulu\'na raporlarım.'
    )}

    ${_field(
      'q_dev_v3_2',
      '4.8. Eleştiriye Açıklık ve Kod İncelemesi (Code Review) Tutumunuz',
      'Kıdemli geliştiricilerin veya Ofis Amirinin kodunuza yaptığı düzeltme ve eleştirilere karşı tutumunuz.',
      'Kod incelemelerini kişisel bir saldırı olarak değil, gelişim fırsatı olarak görürüm. Daha performanslı bir öneri geldiğinde memnuniyetle uygularım...',
      4,
      'Code review tutumunuzu ifade ediniz.',
      'Code Review sürecinde yapıcı eleştirileri başımızın üstünde tutarız. Daha iyi bir algoritma sunulduğunda öğrenmekten gurur duyarım.'
    )}

    ${_field(
      'q_dev_v3_3',
      '4.9. Fikir Ayrılıkları ve Ekip İçi Çatışma Yönetimi',
      'Ekip arkadaşlarınızla teknik bir konuda düştüğünüz fikir ayrılıklarını çözme üslubunuz.',
      'Teknik tartışmaları duyguyla değil, performans test verileri (Benchmark) ve okunabilirlik kriterleri ile nesnel biçimde sonuçlandırırım...',
      4,
      'Çatışma çözme metodunuzu anlatınız.',
      'Duygusal tartışmalardan kaçınır, 2 farklı yaklaşımı da test ortamında çalıştırıp Resmon ve RAM çıktılarına göre objektif karar veririm.'
    )}

    ${_field(
      'q_dev_v4_1',
      '4.10. Gizlilik Sözleşmesi ve Fikri Mülkiyet (NDA & IP Security) Bilinciniz',
      'Eko Yıldız projesine ait kodların, veritabanı yapısının ve idari bilgilerin üçüncü şahıslarla paylaşılmaması konusundaki hassasiyetiniz.',
      'Fikri mülkiyet haklarına ve Gizlilik Sözleşmesine (%100 NDA) koşulsuz uyarım. Kodların ve verilerin sızdırılması idari ve hukuki sorumluluk getirir...',
      4,
      'NDA ve kod gizliliği bilincinizi açıklayınız.',
      'Projeye ait hiçbir script, kod parçası veya veritabanı dökümü üçüncü kişilere aktarılamaz, satılamaz veya kişisel depolarda açık tutulamaz.'
    )}

    ${_field(
      'q_dev_v4_2',
      '4.11. Sorumluluk Bilinci, Teslim Tarihleri (Deadlines) ve Zaman Yönetimi',
      'Belirlenen teslim tarihlerine (Deadline) uyum gösterme ve olası aksamalarda önceden bilgilendirme disiplininiz.',
      'Teslim tarihine uymak birinci önceliğimdir. Beklenmeyen bir teknik engel çıktığında bunu son dakika değil, en az 24 saat önceden yönetime bildiririm...',
      4,
      'Zaman yönetimi ve teslim tarihi disiplininizi yazınız.',
      'Teslim tarihlerine sadakat esastır. Olası bir gecikme riskinde derhal durum analizi ve yeni ETA bilgisi yönetime sunulur.'
    )}

    ${_field(
      'q_dev_v4_3',
      '4.12. Topluluk Önündeki Duruş ve Temsil Yeteneği',
      'Bir Eko Yıldız Geliştiricisi olarak sunucu içi ve dışı mecralarda (Discord, Forum vb.) sergileyeceğiniz ağırbaşlı ve kurumsal duruş.',
      'Geliştirici unvanı taşıdığımın bilincinde olarak tüm üyelere karşı saygılı, kurumsal ve yardımsever bir dil kullanırım. Tartışmalardan uzak dururum...',
      4,
      'Topluluk önündeki temsil anlayışınızı yazınız.',
      'Geliştiriciler projenin vitrinidir. Üyelere karşı her zaman sabırlı, üslup sahibi ve çözüm odaklı kurumsal bir temsil sergilerim.'
    )}
  `;
  const step4 = _step(4, '#f59e0b', 'BÖLÜM 4 — PROJE UYUM STANDARTLARI, VİZYON VE EKİP ÇALIŞMASI', 'Vizyon, okunabilirlik, Clean Code, dokümantasyon ve gizlilik.', step4Body, prevBtn(4) + nextBtn(4, '#f59e0b,#d97706'));

  // ═══ BÖLÜM 5 ═══
  const step5Body = `
    <div style="background:rgba(239,68,68,0.08);border-left:4px solid #ef4444;padding:1.2rem 1.4rem;border-radius:0 14px 14px 0;font-size:0.9rem;color:#e2e8f0;line-height:1.75;margin-bottom:1.6rem;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
      <h4 style="color:#ef4444;margin:0 0 0.5rem 0;font-size:1rem;display:flex;align-items:center;gap:0.5rem;">
        ⚖️ BÖLÜM 5 AMACI VE HUKUKİ / DİSİPLİNER BEYAN
      </h4>
      Bu bölüm, başvuru sürecinin idari, disipliner ve fikri mülkiyet açısından bağlayıcı olan nihai onay aşamasıdır. Form boyunca sunduğunuz tüm bilgilerin doğruluğunu, özgünlüğünü ve Gizlilik İlkesi (NDA) hükümlerini kabul ettiğinizi beyan ediniz.
    </div>

    <div style="background:rgba(0,0,0,0.45);padding:1.4rem;border-radius:16px;border:1px solid rgba(239,68,68,0.3);margin-bottom:1.6rem;box-shadow:0 8px 25px rgba(0,0,0,0.3);">
      <h4 style="color:#ef4444;margin:0 0 0.8rem 0;font-size:1.05rem;font-weight:800;display:flex;align-items:center;gap:0.5rem;">
        📜 GELİŞTİRİCİ TAAHHÜTNAMESİ VE NİHAİ ONAYLAR
      </h4>
      
      <div style="margin-bottom:1.2rem;background:rgba(255,255,255,0.03);padding:0.9rem;border-radius:10px;">
        <label style="display:flex;align-items:flex-start;gap:0.8rem;cursor:pointer;font-size:0.88rem;color:#f1f5f9;line-height:1.6;">
          <input type="checkbox" id="q_dev_nda_1" required style="margin-top:0.25rem;width:18px;height:18px;accent-color:#ef4444;">
          <span><strong>1.1. Bilgilerin Doğruluğu ve Özgünlük Onayı:</strong> Bu başvuru formunda beyan ettiğim tüm kişisel, teknik ve mesleki bilgilerin eksiksiz, doğru ve şahsıma ait olduğunu; hiçbir bölümünde kopyala-yapıştır veya yapay zeka ürünü sahte içerik bulunmadığını beyan ederim.</span>
        </label>
      </div>

      <div style="margin-bottom:1.2rem;background:rgba(255,255,255,0.03);padding:0.9rem;border-radius:10px;">
        <label style="display:flex;align-items:flex-start;gap:0.8rem;cursor:pointer;font-size:0.88rem;color:#f1f5f9;line-height:1.6;">
          <input type="checkbox" id="q_dev_nda_2" required style="margin-top:0.25rem;width:18px;height:18px;accent-color:#ef4444;">
          <span><strong>1.2. Yanıltıcı Beyan ve Kara Liste Yaptırımı:</strong> Form içerisinde yanlış, yanıltıcı veya abartılı beyanda bulunduğumun tespiti halinde başvurumun derhal reddedileceğini ve Eko Creations / Eko Yıldız projelerinde süresiz olarak kara listeye (Blacklist) alınacağımı kabul ediyorum.</span>
        </label>
      </div>

      <div style="margin-bottom:1.2rem;background:rgba(255,255,255,0.03);padding:0.9rem;border-radius:10px;">
        <label style="display:flex;align-items:flex-start;gap:0.8rem;cursor:pointer;font-size:0.88rem;color:#f1f5f9;line-height:1.6;">
          <input type="checkbox" id="q_dev_nda_3" required style="margin-top:0.25rem;width:18px;height:18px;accent-color:#ef4444;">
          <span><strong>2.1. Fikri Mülkiyet ve Kod Gizliliği Sözleşmesi (NDA):</strong> Eko Yıldız bünyesinde geliştireceğim veya erişim sağlayacağım tüm script, kod, veri yapısı, arayüz ve dokümanların mülkiyet hakkının Eko Creations'a ait olduğunu; üçüncü şahıslarla izinsiz paylaşmayacağımı, satmayacağımı ve sızdırmayacağımı taahhüt ederim.</span>
        </label>
      </div>

      <div style="margin-bottom:1.2rem;background:rgba(255,255,255,0.03);padding:0.9rem;border-radius:10px;">
        <label style="display:flex;align-items:flex-start;gap:0.8rem;cursor:pointer;font-size:0.88rem;color:#f1f5f9;line-height:1.6;">
          <input type="checkbox" id="q_dev_nda_4" required style="margin-top:0.25rem;width:18px;height:18px;accent-color:#ef4444;">
          <span><strong>3.1. Yönetmelik ve Kurallara Uyum Taahhüdü:</strong> Eko Yıldız Kurumsal Yönetmelik İlkeleri, Geliştirici Ofisi Hizmet Sözleşmesi ve Yönetim Kurulu talimatlarına eksiksiz uyacağımı taahhüt ederim.</span>
        </label>
      </div>
    </div>

    ${_field('q_dev_sign_name', '4.1. Başvuru Sahibinin Adı Soyadı (Resmi İsim Beyanı)', 'Örn: Ahmet Yılmaz', 1, 'Resmi kimlik adınızı giriniz.')}
    ${_field('q_dev_sign_signature', '4.3. Dijital Onay İmzası (Discord ID / Kullanıcı Adı)', 'Örn: ekonqtx / 123456789012345678', 1, 'Discord kullanıcı adınızı veya ID nizi onay olarak yazınız.')}
  `;
  const step5 = _step(5, '#ef4444', 'BÖLÜM 5 — TAAHHÜTNAME, YÖNETMELİK ONAYI VE NİHAİ BAŞVURU İMZASI', 'Hukuki, disipliner, NDA taahhütleri ve dijital onay.', step5Body, prevBtn(5) + `
    <div style="display:flex;align-items:center;gap:0.8rem;">
      <button type="button" onclick="openPreviewModal()" class="btn" style="background:rgba(129,140,248,0.2);color:#a5b4fc;border:1px solid rgba(129,140,248,0.4);font-weight:700;padding:0.8rem 1.6rem;border-radius:30px;cursor:pointer;font-family:inherit;">
        🔍 Başvuru Önizleme
      </button>
      <button type="submit" id="btn-submit-dev" class="btn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:900;padding:0.85rem 2.5rem;border-radius:30px;border:none;cursor:pointer;font-size:1.05rem;box-shadow:0 8px 25px rgba(16,185,129,0.4);letter-spacing:0.4px;">
        🚀 Başvuruyu Tamamla ve Gönder
      </button>
    </div>
  `);

  const content = `
    <style>
      .quality-pill.quality-empty { background:rgba(255,255,255,0.05); color:#94a3b8; border-color:rgba(255,255,255,0.1); }
      .quality-pill.quality-low { background:rgba(239,68,68,0.15); color:#fca5a5; border-color:rgba(239,68,68,0.3); }
      .quality-pill.quality-mid { background:rgba(245,158,11,0.15); color:#fde047; border-color:rgba(245,158,11,0.3); }
      .quality-pill.quality-high { background:rgba(16,185,129,0.15); color:#6ee7b7; border-color:rgba(16,185,129,0.3); }

      .dev-field-group:focus-within {
        border-color: rgba(129,140,248,0.4) !important;
        box-shadow: 0 0 20px rgba(129,140,248,0.15);
      }
      
      .stepper-nav-pill {
        padding: 0.6rem 1.1rem;
        border-radius: 30px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        color: #94a3b8;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .stepper-nav-pill.active {
        background: rgba(129,140,248,0.2);
        border-color: #818cf8;
        color: #fff;
        box-shadow: 0 0 15px rgba(129,140,248,0.2);
      }
      .stepper-nav-pill.completed {
        border-color: #10b981;
        color: #34d399;
      }

      /* Modal Styling */
      .modal-backdrop {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
        z-index: 9999; display: none; align-items: center; justify-content: center;
        padding: 1.5rem;
      }
      .modal-card {
        background: #0f0f1d; border: 1px solid rgba(255,255,255,0.15);
        border-radius: 24px; max-width: 900px; width: 100%; max-height: 85vh;
        overflow-y: auto; padding: 2rem; box-shadow: 0 25px 50px rgba(0,0,0,0.6);
        color: #fff; position: relative;
      }
    </style>

    <div style="max-width:920px;margin:2rem auto;animation:fadeUp 0.5s ease;">
      <!-- Hero Banner -->
      <div style="width:100%;border-radius:24px;overflow:hidden;margin-bottom:1.8rem;box-shadow:0 15px 35px rgba(0,0,0,0.6);position:relative;">
        <img src="${BANNER}" style="width:100%;display:block;max-height:260px;object-fit:cover;">
        <div style="position:absolute;bottom:0;left:0;width:100%;background:linear-gradient(to top, #0b0b16, transparent);height:100px;"></div>
      </div>

      <!-- Main Header -->
      <div style="text-align:center;margin-bottom:2.2rem;">
        <div style="display:inline-flex;align-items:center;gap:0.5rem;background:rgba(129,140,248,0.12);border:1px solid rgba(129,140,248,0.3);padding:0.35rem 1rem;border-radius:20px;color:#a5b4fc;font-size:0.8rem;font-weight:800;margin-bottom:0.8rem;">
          ⚡ EKO YILDIZ // RESMİ YAZILIM & GELİŞTİRİCİ OFİSİ ALIM PORTALI
        </div>
        <h1 style="font-size:2.2rem;font-weight:900;color:#fff;margin-bottom:0.6rem;letter-spacing:-0.5px;display:flex;align-items:center;justify-content:center;gap:0.7rem;">
          <span>Geliştirici Ekibi // Geliştirici Ofisi Başvuru Formu</span>
        </h1>
        <p style="color:var(--muted);font-size:0.96rem;max-width:720px;margin:0 auto;line-height:1.65;">
          Birincil Alım Formu — Geliştirici Adayı Pozisyonu Kapsamlı Ön Değerlendirme Belgesi. Lütfen tüm teknik senaryoları ve soruları özgün, detaylı ve doyurucu yanıtlarla doldurunuz.
        </p>
      </div>

      <!-- Interactive Stepper Bar -->
      <div style="background:rgba(20,20,35,0.7);backdrop-filter:blur(20px);padding:1.1rem 1.4rem;border-radius:20px;border:1px solid rgba(255,255,255,0.08);margin-bottom:2rem;box-shadow:0 10px 25px rgba(0,0,0,0.3);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.6rem;overflow-x:auto;padding-bottom:0.4rem;" id="stepper-pills">
          <div class="stepper-nav-pill active" id="pill-step-1" onclick="jumpToStep(1)">
            <span>1</span> Kimlik & Zaman
          </div>
          <div class="stepper-nav-pill" id="pill-step-2" onclick="jumpToStep(2)">
            <span>2</span> Teknik Beceriler
          </div>
          <div class="stepper-nav-pill" id="pill-step-3" onclick="jumpToStep(3)">
            <span>3</span> Saha Senaryoları
          </div>
          <div class="stepper-nav-pill" id="pill-step-4" onclick="jumpToStep(4)">
            <span>4</span> Vizyon & Uyum
          </div>
          <div class="stepper-nav-pill" id="pill-step-5" onclick="jumpToStep(5)">
            <span>5</span> Taahhüt & İmza
          </div>
        </div>

        <div style="margin-top:0.9rem;display:flex;align-items:center;justify-content:space-between;font-size:0.78rem;color:var(--muted);">
          <span>Form İlerleme Durumu: <strong id="progress-percent-text" style="color:#818cf8;">%0 Tamamlandı</strong></span>
          <span id="filled-fields-count">0 / 45 Alan Dolduruldu</span>
        </div>
        <div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:6px;overflow:hidden;margin-top:0.4rem;">
          <div id="overall-progress-bar" style="width:0%;height:100%;background:linear-gradient(90deg, #818cf8, #10b981);transition:width 0.4s ease;"></div>
        </div>
      </div>

      <!-- Draft Status Banner -->
      <div id="draft-banner" style="display:none;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);padding:0.75rem 1.1rem;border-radius:14px;margin-bottom:1.5rem;color:#6ee7b7;font-size:0.84rem;align-items:center;justify-content:space-between;">
        <span>💾 <strong>Otomatik Taslak Yüklendi:</strong> Daha önce doldurduğunuz veriler kaldığınız yerden geri yüklendi.</span>
        <button type="button" onclick="clearFormDraft()" style="background:transparent;border:none;color:#fca5a5;cursor:pointer;font-size:0.8rem;text-decoration:underline;">🗑️ Taslağı Temizle</button>
      </div>

      <form id="dev-form">
        ${step1}
        ${step2}
        ${step3}
        ${step4}
        ${step5}
      </form>
    </div>

    <!-- Floating Live Status Bar -->
    <div id="floating-bar" style="position:fixed;bottom:20px;right:20px;background:rgba(15,15,30,0.9);backdrop-filter:blur(15px);border:1px solid rgba(129,140,248,0.3);padding:0.8rem 1.3rem;border-radius:20px;box-shadow:0 12px 30px rgba(0,0,0,0.5);z-index:9000;display:flex;align-items:center;gap:1rem;color:#fff;font-size:0.82rem;">
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10b981;box-shadow:0 0 10px #10b981;"></span>
        <span>Otomatik Kayıt Aktif</span>
      </div>
      <button type="button" onclick="openPreviewModal()" style="background:rgba(129,140,248,0.2);border:1px solid #818cf8;color:#a5b4fc;padding:0.35rem 0.9rem;border-radius:14px;cursor:pointer;font-weight:700;font-size:0.78rem;">
        🔍 Önizleme
      </button>
    </div>

    <!-- Preview Modal -->
    <div id="preview-modal" class="modal-backdrop">
      <div class="modal-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.4rem;padding-bottom:0.8rem;border-bottom:1px solid rgba(255,255,255,0.1);">
          <h3 style="font-size:1.3rem;font-weight:900;color:#fff;margin:0;">🔍 Geliştirici Başvurusu Önizleme Raporu</h3>
          <button type="button" onclick="closePreviewModal()" style="background:transparent;border:none;color:#94a3b8;font-size:1.5rem;cursor:pointer;">✕</button>
        </div>
        <div id="preview-modal-body" style="font-size:0.86rem;line-height:1.6;color:#cbd5e1;">
          <!-- Populated by JS -->
        </div>
        <div style="margin-top:1.6rem;text-align:right;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.1);">
          <button type="button" onclick="closePreviewModal()" class="btn btn-ghost" style="margin-right:0.6rem;">Düzenlemeye Dön</button>
          <button type="button" onclick="submitFormFromModal()" class="btn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:800;padding:0.7rem 1.8rem;border-radius:24px;border:none;">🚀 Önizlemeyi Onayla ve Gönder</button>
        </div>
      </div>
    </div>

    <script>
      const DRAFT_KEY = 'dev_form_draft_v2';

      function toggleStep(n) {
        const body = document.getElementById('step-body-' + n);
        const icon = document.getElementById('expand-icon-' + n);
        if (body) {
          const isHidden = body.style.display === 'none';
          body.style.display = isHidden ? 'block' : 'none';
          if (icon) icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
        }
      }

      function jumpToStep(n) {
        for (let i = 1; i <= 5; i++) {
          const stepEl = document.getElementById('form-step-' + i);
          const pillEl = document.getElementById('pill-step-' + i);
          if (stepEl) stepEl.style.display = i === n ? 'block' : 'none';
          if (pillEl) {
            if (i === n) pillEl.classList.add('active');
            else pillEl.classList.remove('active');
          }
        }
        const target = document.getElementById('form-step-' + n);
        if (target) window.scrollTo({ top: target.offsetTop - 90, behavior: 'smooth' });
      }

      function nextStep(n) {
        jumpToStep(n + 1);
      }

      function prevStep(n) {
        jumpToStep(n - 1);
      }

      function toggleExampleGuide(id) {
        const guide = document.getElementById('guide-' + id);
        if (guide) guide.style.display = guide.style.display === 'none' ? 'block' : 'none';
      }

      function updateFieldMetrics(id) {
        const field = document.getElementById(id);
        if (!field) return;

        const val = field.value.trim();
        const len = val.length;
        const recMin = parseInt(field.getAttribute('data-rec-min') || '100', 10);

        const counter = document.getElementById('counter-' + id);
        const bar = document.getElementById('bar-' + id);
        const badge = document.getElementById('badge-' + id);
        const group = document.getElementById('group-' + id);

        if (counter) counter.innerText = len + ' / ' + recMin + ' karakter (Önerilen: ' + recMin + '+)';

        const pct = Math.min(100, Math.round((len / recMin) * 100));
        if (bar) {
          bar.style.width = pct + '%';
          if (len === 0) bar.style.background = '#ef4444';
          else if (len < recMin * 0.5) bar.style.background = '#ef4444';
          else if (len < recMin) bar.style.background = '#f59e0b';
          else bar.style.background = '#10b981';
        }

        if (badge) {
          badge.className = 'quality-pill';
          if (len === 0) {
            badge.classList.add('quality-empty');
            badge.innerHTML = '⚪ Boş';
          } else if (len < recMin * 0.5) {
            badge.classList.add('quality-low');
            badge.innerHTML = '🔴 Çok Kısa';
          } else if (len < recMin) {
            badge.classList.add('quality-mid');
            badge.innerHTML = '🟡 Orta Düzey';
          } else {
            badge.classList.add('quality-high');
            badge.innerHTML = '🟢 Harika & Detaylı';
          }
        }

        saveFormDraft();
        updateOverallProgress();
      }

      function updateOverallProgress() {
        const allTrackFields = document.querySelectorAll('#dev-form .track-field');
        let filledCount = 0;

        allTrackFields.forEach(f => {
          if (f.value && f.value.trim().length > 0) filledCount++;
        });

        const total = allTrackFields.length;
        const pct = Math.round((filledCount / total) * 100);

        const progressText = document.getElementById('progress-percent-text');
        const progressBar = document.getElementById('overall-progress-bar');
        const filledCountText = document.getElementById('filled-fields-count');

        if (progressText) progressText.innerText = '%' + pct + ' Tamamlandı';
        if (progressBar) progressBar.style.width = pct + '%';
        if (filledCountText) filledCountText.innerText = filledCount + ' / ' + total + ' Alan Dolduruldu';

        // Update step pills completed status
        for (let step = 1; step <= 5; step++) {
          const stepContainer = document.getElementById('form-step-' + step);
          const pill = document.getElementById('pill-step-' + step);
          const stepBadge = document.getElementById('step-badge-' + step);

          if (stepContainer && pill) {
            const stepFields = stepContainer.querySelectorAll('.track-field');
            let stepFilled = 0;
            stepFields.forEach(sf => { if (sf.value && sf.value.trim().length > 0) stepFilled++; });

            if (stepFilled === stepFields.length && stepFields.length > 0) {
              pill.classList.add('completed');
              if (stepBadge) stepBadge.style.display = 'inline-block';
            } else {
              pill.classList.remove('completed');
              if (stepBadge) stepBadge.style.display = 'none';
            }
          }
        }
      }

      function saveFormDraft() {
        try {
          const draftData = {};
          document.querySelectorAll('#dev-form .track-field').forEach(f => {
            if (f.id) draftData[f.id] = f.value;
          });
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        } catch (_) {}
      }

      function loadFormDraft() {
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (!raw) return;
          const draftData = JSON.parse(raw);
          let loadedAny = false;

          Object.keys(draftData).forEach(id => {
            const field = document.getElementById(id);
            if (field && draftData[id]) {
              field.value = draftData[id];
              updateFieldMetrics(id);
              loadedAny = true;
            }
          });

          if (loadedAny) {
            const banner = document.getElementById('draft-banner');
            if (banner) banner.style.display = 'flex';
          }
        } catch (_) {}
      }

      function clearFormDraft() {
        try {
          localStorage.removeItem(DRAFT_KEY);
          document.getElementById('draft-banner').style.display = 'none';
          document.querySelectorAll('#dev-form .track-field').forEach(f => {
            f.value = '';
            updateFieldMetrics(f.id);
          });
        } catch (_) {}
      }

      function openPreviewModal() {
        const body = document.getElementById('preview-modal-body');
        if (!body) return;

        let html = '';
        for (let step = 1; step <= 5; step++) {
          const stepContainer = document.getElementById('form-step-' + step);
          if (!stepContainer) continue;

          const title = stepContainer.querySelector('h3')?.innerText || ('Bölüm ' + step);
          html += '<div style="margin-bottom:1.4rem;background:rgba(255,255,255,0.03);padding:1rem;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">';
          html += '<h4 style="color:#818cf8;margin:0 0 0.8rem 0;font-size:1rem;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:0.4rem;">' + title + '</h4>';

          const fields = stepContainer.querySelectorAll('.dev-field-group, .form-group');
          fields.forEach(fg => {
            const label = fg.querySelector('.field-label')?.innerText || '';
            const input = fg.querySelector('textarea, input[type="text"]');
            if (input) {
              const val = input.value.trim();
              html += '<div style="margin-bottom:0.7rem;">';
              html += '<strong style="color:#e2e8f0;font-size:0.83rem;display:block;">' + label + '</strong>';
              html += '<div style="background:rgba(0,0,0,0.4);padding:0.5rem 0.8rem;border-radius:8px;margin-top:0.2rem;font-size:0.8rem;color:' + (val ? '#6ee7b7' : '#ef4444') + ';">' + (val ? _esc(val).replace(/\\n/g, '<br>') : '⚠️ [DOLDURULMADI]') + '</div>';
              html += '</div>';
            }
          });
          html += '</div>';
        }

        body.innerHTML = html;
        document.getElementById('preview-modal').style.display = 'flex';
      }

      function closePreviewModal() {
        document.getElementById('preview-modal').style.display = 'none';
      }

      function submitFormFromModal() {
        closePreviewModal();
        document.getElementById('dev-form').requestSubmit();
      }

      function _esc(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      // Initialize page scripts
      document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('#dev-form .track-field').forEach(f => {
          if (f.id) updateFieldMetrics(f.id);
        });
        loadFormDraft();
        updateOverallProgress();
      });

      document.getElementById('dev-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-dev');
        btn.disabled = true; btn.innerHTML = '⏳ Gönderiliyor...';

        const data = {};
        document.querySelectorAll('#dev-form .track-field').forEach(f => {
          if (f.id) data[f.id] = f.value || '';
        });
        data.discordUsername = document.getElementById('q_discord')?.value || '';

        try {
          const res = await fetch('/api/forms/developer/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const resData = await res.json();
          if (res.ok && resData.success) {
            try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
            alert('✅ Geliştirici başvurunuz başarıyla alındı! Discord üzerindeki Mülakat botu üzerinden bilgilendirileceksiniz.');
            window.location.href = '/forms';
          } else {
            alert('❌ Hata: ' + (resData.error || 'Başvuru gönderilemedi.'));
            btn.disabled = false; btn.innerHTML = '🚀 Geliştirici Başvurusunu Tamamla ve Gönder';
          }
        } catch (err) {
          alert('❌ Bağlantı hatası: ' + err.message);
          btn.disabled = false; btn.innerHTML = '🚀 Geliştirici Başvurusunu Tamamla ve Gönder';
        }
      });
    </script>
  `;

  return _layout('Geliştirici Ekibi Alım Formu', currentUser, content, '', '/forms');
}

function renderDebugOfficeFormPage(currentUser, existingSubmission = null) {
  const _layout = require('./views')._layout;
  const isLoggedIn = Boolean(currentUser);
  const usernameStr = currentUser ? (currentUser.discordUsername || currentUser.username || '') : '';
  const BANNER = 'https://i.imgur.com/juSekgU.jpeg';

  function _step(num, color, title, subtitle, bodyHtml, navHtml) {
    const hidden = num > 1 ? 'display:none;' : '';
    return `
      <div id="form-step-${num}" class="form-step card" style="border-radius:20px;border-left:4px solid ${color};${hidden}transition:all 0.3s;margin-bottom:1.5rem;background:rgba(20,20,35,0.7);backdrop-filter:blur(20px);padding:2rem;">
        <div class="step-header-bar" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" onclick="toggleStep(${num})">
          <div>
            <h3 style="font-size:1.1rem;font-weight:800;color:${color};margin-bottom:0.2rem;">${title}</h3>
            <p style="font-size:0.78rem;color:var(--muted);margin:0;">${subtitle}</p>
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem;">
            <span class="step-done-badge" style="display:none;background:${color}20;color:${color};font-size:0.72rem;font-weight:800;padding:0.25rem 0.7rem;border-radius:20px;border:1px solid ${color}40;">✓ TAMAMLANDI</span>
            <span class="step-expand-btn" style="display:none;color:${color};font-size:1.2rem;cursor:pointer;" title="Genişlet / Daralt">▼</span>
          </div>
        </div>
        <div class="step-body" style="margin-top:1.2rem;">
          ${bodyHtml}
          <div class="step-nav" style="display:flex;justify-content:${num === 1 ? 'flex-end' : 'space-between'};margin-top:1.8rem;">
            ${navHtml}
          </div>
        </div>
      </div>`;
  }

  function _field(id, label, placeholder, rows, hint = '') {
    return `
      <div class="form-group" style="margin-bottom:1.2rem;">
        <label class="field-label" style="display:block;font-size:0.88rem;font-weight:700;color:#e2e8f0;margin-bottom:0.4rem;">${label} *</label>
        <textarea id="${id}" class="input-field track-field" data-field="${id}" rows="${rows || 3}" required placeholder="${placeholder}" style="width:100%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:0.7rem 0.9rem;border-radius:10px;font-size:0.88rem;font-family:inherit;line-height:1.5;"></textarea>
        ${hint ? `<div style="font-size:0.75rem;color:var(--muted);margin-top:0.25rem;">${hint}</div>` : ''}
        <div class="field-hint" id="hint-${id}" style="font-size:0.72rem;color:var(--muted);margin-top:0.25rem;min-height:16px;"></div>
      </div>`;
  }

  const prevBtn = (n) => `<button type="button" onclick="prevStep(${n})" class="btn btn-ghost" style="font-size:0.9rem;">← Önceki Bölüm</button>`;
  const nextBtn = (n, grad) => `<button type="button" onclick="nextStep(${n})" class="btn" style="background:linear-gradient(135deg,${grad});color:#fff;font-weight:700;padding:0.7rem 1.8rem;border-radius:24px;border:none;cursor:pointer;font-family:inherit;">Sonraki Bölüm →</button>`;
  // ═══════════════════════════════════════════════════════════════
  // GENİŞLETİLMİŞ FORM BLOĞU
  // Bu dosya, orijinal dosyandaki aynı fonksiyonun (BÖLÜM 1-5 + content + script)
  // yerine geçecek şekilde hazırlanmıştır. _field, _step, nextBtn, prevBtn,
  // _layout, BANNER, _esc, usernameStr, currentUser gibi tüm dış bağımlılıklar
  // senin orijinal dosyanda zaten mevcut olduğu için burada TEKRAR TANIMLANMADI.
  // Sadece bu bloğu, orijinal dosyandaki karşılık gelen bloğun yerine yapıştır.
  // ═══════════════════════════════════════════════════════════════

  // ═══ İLERLEME ÇUBUĞU (tüm adımlarda ortak, sabit üstte) ═══
  const progressBar = `
    <div id="dbg-progress-wrap" style="position:sticky;top:0;z-index:50;background:rgba(10,10,15,0.85);backdrop-filter:blur(8px);padding:0.8rem 1rem;border-radius:14px;margin-bottom:1.5rem;border:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
        <span style="font-size:0.78rem;color:var(--muted);font-weight:600;">BAŞVURU İLERLEMESİ</span>
        <span id="dbg-progress-label" style="font-size:0.78rem;color:#38bdf8;font-weight:700;">Bölüm 1 / 5</span>
      </div>
      <div style="width:100%;height:8px;background:rgba(255,255,255,0.08);border-radius:6px;overflow:hidden;">
        <div id="dbg-progress-fill" style="height:100%;width:20%;background:linear-gradient(90deg,#38bdf8,#a78bfa,#34d399,#f59e0b,#ef4444);border-radius:6px;transition:width 0.4s ease;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:0.4rem;">
        <span style="font-size:0.68rem;color:var(--muted);">Kişisel Bilgiler</span>
        <span style="font-size:0.68rem;color:var(--muted);">Teknik</span>
        <span style="font-size:0.68rem;color:var(--muted);">Senaryolar</span>
        <span style="font-size:0.68rem;color:var(--muted);">Etik</span>
        <span style="font-size:0.68rem;color:var(--muted);">Onay</span>
      </div>
    </div>
  `;

  // ═══ BÖLÜM 1 ═══
  const step1Body = `
    <div style="background:rgba(56,189,248,0.06);border-left:3px solid #38bdf8;padding:1.2rem 1.4rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.8;margin-bottom:1.3rem;">
      <p style="margin:0 0 0.8rem 0;">Bu bölüm, <strong>Hata Ayıklama Ofisi</strong> bünyesinde "Hata Denetçisi" olarak görev alacak adayların temel kimlik, iletişim, zaman yönetimi, oyun/platform birikimi ve genel çalışma disiplinini ayrıntılı bir şekilde analiz etmek amacıyla hazırlanmıştır.</p>
      <p style="margin:0 0 0.5rem 0;color:#e2e8f0;font-weight:600;">📌 Bu bölümde nelere dikkat edilmeli?</p>
      <ul style="margin:0;padding-left:1.2rem;">
        <li>Tüm bilgiler gerçek ve doğrulanabilir olmalıdır; kimlik/iletişim tutarsızlıkları başvuruyu geçersiz kılar.</li>
        <li>Zaman planlaması sorularında iyimser değil <em>gerçekçi</em> rakamlar verin — sonradan tutturulamayan taahhütler güven kaybına yol açar.</li>
        <li>Disiplin geçmişi sorusuna dürüst yanıt vermek, gizlemeye çalışmaktan her zaman daha avantajlıdır.</li>
      </ul>
    </div>

    ${_field('q_dbg_email', '1.1. E-posta Adresiniz', 'Resmi iletişim için geçerli, düzenli kontrol ettiğiniz e-posta adresinizi yazınız. Kurumsal veya kişisel olabilir, ancak aktif kullanımda olmalıdır...', 1)}
    ${_field('q_dbg_1_2', '1.2. Adınız ve Soyadınız', 'Resmi kayıtlarda yer alan tam adınız ve soyadınızı yazınız. Takma ad veya kısaltma kullanmayınız...', 2)}
    ${_field('q_dbg_1_3', '1.3. Yaşınız ve Doğum Tarihiniz (Gün/Ay/Yıl)', 'Örn: 18 / 15.05.2008 — Yaş sınırı ve uygunluk değerlendirmesi için gereklidir...', 2)}
    ${_field('q_dbg_roblox', '1.4. Roblox Kullanıcı Adınız ve Kullanıcı Kimliğiniz (User ID)', 'Roblox kullanıcı adınız ve profilinizdeki sayısal ID numaranızı eksiksiz giriniz. ID bilgisini profil URL adresinizden doğrulayabilirsiniz...', 2)}
    ${_field('q_dbg_1_5b', '1.5.1. Roblox Hesap Yaşı ve Genel Aktiflik Geçmişiniz', 'Hesabınızın ne zamandan beri aktif olduğu, geçmişte oynadığınız oyunlar ve genel platform tecrübenizi kısaca özetleyiniz...', 3)}

    <div class="form-group" style="margin-bottom:1.2rem;">
      <label class="field-label" style="display:block;font-size:0.88rem;font-weight:700;color:#e2e8f0;margin-bottom:0.4rem;">1.5. DISCORD KULLANICI ADINIZ VE USER ID *</label>
      <input type="text" id="q_discord" class="input-field track-field" data-field="discord_username" value="${_esc(usernameStr)}" required placeholder="Örn: ekonqtx / 123456789012345678" style="width:100%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:0.7rem 0.9rem;border-radius:10px;font-size:0.88rem;">
    </div>

    ${_field('q_dbg_2_1', '2.1. Yaşadığınız Şehir ve Çalıştığınız Saat Dilimi (Timezone)', 'Örn: İstanbul / UTC+3 — Ekip içi koordinasyon ve toplantı planlaması için önemlidir...', 2)}
    ${_field('q_dbg_2_2', '2.2. Günlük ve Haftalık Aktiflik Süreniz', 'Hafta içi ve hafta sonu ayırabileceğiniz süreleri, hangi saat aralıklarında daha aktif olduğunuzu ve bu sürenin ne kadarını fiilen test/rapor işine ayırabileceğinizi detaylandırınız...', 3)}
    ${_field('q_dbg_2_2b', '2.2.1. Aktiflik Sürenizi Etkileyebilecek Kısıtlar', 'Okul, iş, spor, aile gibi düzenli olarak zaman ayırmanız gereken sabit meşguliyetlerinizi belirtiniz...', 3)}
    ${_field('q_dbg_2_3', '2.3. Acil Durum İletişim Kanallarınız', 'Discord dışındaki alternatif ulaşım kanalınızı (telefon, e-posta, farklı platform vb.) ve hangi durumlarda bu kanaldan ulaşılabileceğini belirtiniz...', 2)}
    ${_field('q_dbg_2_4', '2.4. Sesli ve Yazılı İletişim Becerileriniz', 'Mikrofon kullanımınız, sesli toplantılara katılım isteğiniz ve yazılı raporlama/ifade becerinizi kısaca değerlendiriniz...', 2)}
    ${_field('q_dbg_3_1', '3.1. Eğitim Durumunuz veya Mesleki Çalışma Hayatınız', 'Okul/bölüm bilgisi veya meslek/mesai saatlerinizi, bunların haftalık programınıza etkisiyle birlikte açıklayınız...', 2)}
    ${_field('q_dbg_3_2', '3.2. Önümüzdeki 6 Aylık Zaman Planlamanız', 'Sınav dönemleri, tatiller, askerlik, iş değişikliği gibi aktifliğinizi etkileyebilecek öngörülebilir durumları ve bu dönemlerde nasıl bir plan izleyeceğinizi belirtiniz...', 3)}
    ${_field('q_dbg_3_2b', '3.2.1. Uzun Süreli İzin/Ayrılma Durumunda İzleyeceğiniz Prosedür', 'Beklenmedik veya planlı bir ayrılma durumunda ekibi nasıl bilgilendireceğinizi anlatınız...', 2)}
    ${_field('q_dbg_4_1', '4.1. Kendinizi, Çalışma Disiplininizi ve Analitik Yönünüzü Tanımlayınız', 'Gözlem yeteneğiniz, detaylara verdiğiniz önem ve tekrarlayan/sıkıcı test süreçlerindeki sabrınızı somut örneklerle anlatınız...', 3)}
    ${_field('q_dbg_4_2', '4.2. Baskı, Stres ve Yoğun Güncelleme Dönemlerindeki Tutumunuz', 'Yoğun hata arama süreçlerinde zaman baskısı altında nasıl soğukkanlı kalabildiğinizi, geçmişte yaşadığınız benzer bir deneyimi örnek vererek anlatınız...', 3)}
    ${_field('q_dbg_4_3', '4.3. Ekip İçi Uyum ve İletişim Anlayışınız', 'Ofis amiri ve geliştiricilerle iletişim üslubunuzu, hiyerarşiye ve geri bildirime nasıl yaklaştığınızı açıklayınız...', 3)}
    ${_field('q_dbg_4_3b', '4.3.1. Farklı Kişilik Tiplerine Uyum', 'Sizden çok farklı çalışma tarzına sahip bir ekip arkadaşıyla nasıl verimli çalışabileceğinizi anlatınız...', 3)}
    ${_field('q_dbg_5_1', '5.1. Daha Önce Görev Aldığınız Projeler ve Deneyimleriniz', 'Geçmiş Hata Denetçisi / Tester rollerinizi, hangi projelerde ne kadar süre çalıştığınızı ve elde ettiğiniz somut sonuçları (bulduğunuz kritik hatalar vb.) detaylandırınız...', 3)}
    ${_field('q_dbg_5_2', '5.2. Geçmiş Referanslarınız', 'Referans alınabilecek kişilerin adlarını, görevlerini ve size ulaşılabilecek iletişim bilgilerini (varsa) belirtiniz...', 2)}
    ${_field('q_dbg_5_3', '5.3. Disiplin ve İhlal Geçmişiniz', 'Daha önce herhangi bir platform veya sunucuda aldığınız ceza, uyarı veya kara liste durumlarını; varsa nedenini ve o zamandan bu yana neyin değiştiğini dürüstçe belirtiniz...', 2)}
  `;
  const step1 = _step(1, '#38bdf8', 'BÖLÜM 1 — KİŞİSEL BİLGİLER, İLETİŞİM VE DİSİPLİN DEĞERLENDİRMESİ', 'Temel kimlik, hesap doğrulama ve zaman yönetimi.', progressBar + step1Body, nextBtn(1, '#38bdf8,#0284c7'));

  // ═══ BÖLÜM 2 ═══
  const step2Body = `
    <div style="background:rgba(167,139,250,0.06);border-left:3px solid #a78bfa;padding:1.2rem 1.4rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.8;margin-bottom:1.3rem;">
      <p style="margin:0 0 0.8rem 0;">Bu bölüm, "Hata Denetçisi" pozisyonuna başvuran adayların Roblox platformu altyapısına, Eko Yıldız oyun içi sistemlerine ve teknik test metodolojilerine hakimiyetini ölçer.</p>
      <p style="margin:0 0 0.5rem 0;color:#e2e8f0;font-weight:600;">🛠️ Değerlendirme Kriterleri</p>
      <ul style="margin:0;padding-left:1.2rem;">
        <li>Teorik bilgiden çok, gerçek test tecrübenize dayanan somut örnekler önem taşır.</li>
        <li>Bilmediğiniz bir konuda tahmin yürütmek yerine, öğrenmeye açık olduğunuzu belirtmek daha değerlidir.</li>
        <li>Teknik terimleri doğru kullanmanız, konuya hakimiyetinizi gösteren en güçlü işarettir.</li>
      </ul>
    </div>
    ${_field('q_dbg_t1_1', '1.1. Roblox Platformu ve Client/Server İşleyiş Deneyiminiz', 'ReplicatedStorage, ServerScriptService ve RemoteEvent mantığı hakkındaki bilginizi; client-server senkronizasyonunun neden önemli olduğunu örneklerle açıklayınız...', 3)}
    ${_field('q_dbg_t1_1b', '1.1.1. Yaygın Client-Server Senkronizasyon Hatalarına Örnekler', 'Karşılaştığınız veya bildiğiniz tipik senkronizasyon hatalarını (örn. gecikmeli veri güncellemesi, çakışan istekler) örneklendiriniz...', 3)}
    ${_field('q_dbg_t1_2', '1.2. Eko Yıldız Oyun İçi Mekanikleri ve Sistem Bilgisi', 'Envanter, garaj, ekonomi vb. hakim olduğunuz sistemleri ve bu sistemlerde daha önce fark ettiğiniz tutarsızlıkları detaylandırınız...', 3)}
    ${_field('q_dbg_t1_3', '1.3. UI / UX (Arayüz ve Kullanıcı Deneyimi) Test Deneyimi', 'Çözünürlük, cihaz ölçekleme (mobil/PC/tablet) ve UI kilitlenme testlerinizi; hangi cihazlarda test yapabildiğinizi belirtiniz...', 3)}
    ${_field('q_dbg_t2_1', '2.1. Fonksiyonel Test ve Sınır Değer Analizi (Boundary Value Testing)', 'Eksi değer, 0 girdisi, maksimum karakter/sayı sınırı aşımı ve spam tıklama gibi test senaryolarınızı somut örneklerle anlatınız...', 3)}
    ${_field('q_dbg_t2_2', '2.2. Sıra Dışı Kullanıcı Davranışları (Edge Cases) Tespiti', 'Beklenmedik kullanıcı adımlarını (örn. işlem sırasında sayfa değiştirme, art arda hızlı tıklama) kurgulama ve test etme yaklaşımınızı anlatınız...', 3)}
    ${_field('q_dbg_t2_3', '2.3. Regresyon Testi (Regression Testing) Yaklaşımınız', 'Düzeltilen bir hatanın başka sistemleri bozup bozmadığını kontrol etme sürecinizi adım adım açıklayınız...', 3)}
    ${_field('q_dbg_t2_3b', '2.3.1. Kritik Sistemlerde Regresyon Test Önceliklendirmesi', 'Zaman kısıtlı bir güncelleme öncesinde hangi sistemleri öncelikli test edeceğinizi ve nedenini belirtiniz...', 3)}
    ${_field('q_dbg_t3_1', '3.1. Roblox Developer Console (F9) ve Hata Kayıtları (Logs)', 'Output, Memory, Network sekmelerini okuma ve traceback analizi yapma sürecinizi; bir hatayı F9 üzerinden nasıl teşhis ettiğinizi örnekle anlatınız...', 3)}
    ${_field('q_dbg_t3_2', '3.2. Ağ (Network) ve Ping/Lag Analizi', 'Ping/lag etkisiyle gerçek bir kod hatasını nasıl ayırt ettiğinizi, hangi yöntem veya araçları kullandığınızı açıklayınız...', 3)}
    ${_field('q_dbg_t3_3', '3.3. Test Araçları ve Ekran Kaydı/Görsel Belgeleme', 'Kullandığınız kayıt ve görsel belgeleme yazılımlarını (OBS, ShareX vb.) ve belgeleme alışkanlıklarınızı belirtiniz...', 2)}
    ${_field('q_dbg_t4_1', '4.1. Sunucu ve Veri Güvenliği Açıkları (Exploit / Dupe)', 'Eşya çoğaltma ve yetkisiz erişim açıklarını tespit etme mantığınızı; bu tür bir açığı fark ettiğinizde izleyeceğiniz adımları anlatınız...', 3)}
    ${_field('q_dbg_t4_2', '4.2. Dış Müdahale ve Hile Tespiti Gözlem Yeteneği', '3. parti yazılımlar (Speed, Noclip, Remote Inject vb.) hakkındaki farkındalığınızı ve bunları oyun içi gözlemle nasıl fark edebileceğinizi açıklayınız...', 3)}
    ${_field('q_dbg_t4_2b', '4.2.1. Şüpheli Davranış Tespitinde Kanıt Toplama Süreciniz', 'Şüphelendiğiniz bir hile/istismar durumunda hangi kanıtları (video, log, ekran görüntüsü vb.) nasıl topladığınızı anlatınız...', 3)}
  `;
  const step2 = _step(2, '#a78bfa', 'BÖLÜM 2 — OYUN/PLATFORM BİLGİSİ, TEKNİK DENEYİM VE HATA TESPİT YETKİNLİĞİ', 'Roblox altyapısı, test metodolojileri ve F9 konsol hakimiyeti.', progressBar + step2Body, prevBtn(2) + nextBtn(2, '#a78bfa,#8b5cf6'));

  // ═══ BÖLÜM 3 ═══
  const step3Body = `
    <div style="background:rgba(52,211,153,0.06);border-left:3px solid #34d399;padding:1.2rem 1.4rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.8;margin-bottom:1.3rem;">
      <p style="margin:0 0 0.8rem 0;">Bu bölüm, teorik bilginizin gerçek test süreçlerinde ve kriz anlarında nasıl pratiğe dönüştüğünü ölçer.</p>
      <p style="margin:0 0 0.5rem 0;color:#e2e8f0;font-weight:600;">🎯 Senaryo Yanıtlarında Dikkat Edilmesi Gerekenler</p>
      <ul style="margin:0;padding-left:1.2rem;">
        <li>Yanıtlarınızı adım adım, kronolojik sırayla yazınız (1. adım, 2. adım gibi).</li>
        <li>Kim ile iletişime geçeceğinizi ve hangi kanalı kullanacağınızı net belirtiniz.</li>
        <li>"Ne yapardım" değil, geçmişte benzer bir durumda "ne yaptım" şeklinde somut deneyim paylaşmanız değerinizi artırır.</li>
      </ul>
    </div>
    ${_field('q_dbg_s1_1', '1.1. Senaryo 1 - Envanter ve Eşya Çoğaltma (Dupe)', 'Ortak depodan iki oyuncunun aynı anda eşya çekme hatasını fark ettiniz. Bu durumu doğrulama, tekrar üretme (reproduce) ve raporlama adımlarınızı detaylı anlatınız...', 4)}
    ${_field('q_dbg_s1_2', '1.2. Senaryo 2 - Arayüz (UI) Kilitlenmesi ve Veri Kaybı', 'Market alışverişi sırasında arayüz kilitlendi ve oyuncunun parası düştü ama eşya gelmedi. F9 konsol verisini nasıl analiz edeceğinizi ve izleyeceğiniz adımları anlatınız...', 4)}
    ${_field('q_dbg_s1_3', '1.3. Senaryo 3 - Görsel ve Fiziksel Çakışmalar (Clipping & Collision)', 'Bir oyuncu haritanın altına düşüyor veya nesnelerle çakışma yaşıyor. Bu tür hataları belgeleme, tekrar üretme koşullarını tespit etme ve raporlama adımlarınızı anlatınız...', 4)}
    ${_field('q_dbg_s1_4', '1.4. Senaryo 4 - Ekonomi Dengesizliği (Exploit ile Sonsuz Para)', 'Bir oyuncunun normalde imkansız bir yöntemle hızla çok fazla para kazandığını fark ettiniz. Bu durumu nasıl doğrular, kanıtlar ve kime, hangi öncelikte bildirirsiniz?', 4)}
    ${_field('q_dbg_s2_1', '2.1. Örnek Hata Raporu Oluşturma (Bug Report)', 'Aşağıdaki şablona uygun örnek bir hata raporu yazınız: Açıklayıcı Hata Başlığı, Öncelik Seviyesi, Reproduction Steps (Tekrar Üretme Adımları), Beklenen Sonuç, Gerçekleşen Sonuç, Konsol Çıktısı/Ek Kanıt...', 5)}
    ${_field('q_dbg_s2_1b', '2.1.1. Rapor Şablonunuzda Öncelik Seviyelerini Nasıl Tanımlarsınız?', 'Kendi raporlama sisteminizde "Kritik", "Yüksek", "Orta", "Düşük" gibi öncelik seviyelerini hangi kriterlere göre belirlediğinizi açıklayınız...', 3)}
    ${_field('q_dbg_s3_1', '3.1. Hata Derecelendirme ve Önceliklendirme', 'Dokusu bozuk bir kıyafet, oyuncunun parasını sıfırlayan bir ekonomi açığı ve bir görevdeki yazım hatası aynı anda bildirildi. Bunları önem sırasına koyunuz ve gerekçenizi detaylı açıklayınız...', 4)}
    ${_field('q_dbg_s3_2', '3.2. Acil Durum/Kritik Açık İletişim Prosedürü', 'Kritik bir güvenlik açığı tespit ettiğinizde, Ofis Amiri ve Geliştirici Ekibine güvenli ve hızlı bildirim sürecinizi; bu süreçte gizliliği nasıl koruyacağınızı adım adım anlatınız...', 3)}
    ${_field('q_dbg_s3_2b', '3.2.1. Açığın Yayılmasını Önlemek İçin Alacağınız Önlemler', 'Kritik açığı bildirene kadar geçen sürede, açığın başka kullanıcılar tarafından fark edilip istismar edilmesini önlemek için neler yapabileceğinizi anlatınız...', 3)}
  `;
  const step3 = _step(3, '#34d399', 'BÖLÜM 3 — PRATİK SENARYOLAR, HATA ANALİZİ VE RAPOR OLUŞTURMA', 'Saha senaryoları, bug raporu şablonu ve önceliklendirme.', progressBar + step3Body, prevBtn(3) + nextBtn(3, '#34d399,#059669'));

  // ═══ BÖLÜM 4 ═══
  const step4Body = `
    <div style="background:rgba(245,158,11,0.06);border-left:3px solid #f59e0b;padding:1.2rem 1.4rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.8;margin-bottom:1.3rem;">
      <p style="margin:0 0 0.8rem 0;">Hata Ayıklama Ofisi içerisindeki çalışma kültürüne, kurum içi hiyerarşiye ve etik ilkelere uyum değerlendirmesi.</p>
      <p style="margin:0 0 0.5rem 0;color:#e2e8f0;font-weight:600;">⚖️ Neden Önemli?</p>
      <ul style="margin:0;padding-left:1.2rem;">
        <li>Hata Denetçisi rolü, oyuncuların göremediği hassas bilgilere (yayınlanmamış güncellemeler, açıklar) erişim sağlar.</li>
        <li>Bu yetkinin sorumlu kullanımı, ekibin ve platformun güvenilirliğini doğrudan etkiler.</li>
        <li>Etik ihlaller, geri dönüşü olmayan (kara liste) sonuçlar doğurabilir.</li>
      </ul>
    </div>
    ${_field('q_dbg_v1_1', '1.1. Ofis Amiri ve Komite İletişimi', 'Ofis Amiri (endof) ve Regülasyon Komitesi talimatlarına yaklaşımınızı; talimatla kendi görüşünüzün çeliştiği bir durumda nasıl davranacağınızı anlatınız...', 3)}
    ${_field('q_dbg_v1_2', '1.2. Geliştirici Ekibi ile İlişkiler ve Üslup', 'Geliştiricilere yapıcı, net ve çözüm odaklı rapor sunma tarzınızı; eleştirinizi nasıl "suçlayıcı olmayan" bir dille ilettiğinizi örnekleyiniz...', 3)}
    ${_field('q_dbg_v1_3', '1.3. Görev Sorumluluğu ve Kesintisiz Takip', 'Düzeltilen bir hatayı tekrar test etme (re-test) sürecinizi ve bu takibi nasıl organize ettiğinizi (liste, not tutma vb.) anlatınız...', 3)}
    ${_field('q_dbg_v2_1', '2.1. Yetkilerin ve Bilginin Kötüye Kullanımı (Exploit Abuse)', 'Açıkları kişisel çıkar için kullanmanın kara liste sebebi olduğunu kabul ettiğinizi ve bu konudaki bilincinizi kendi cümlelerinizle açıklayınız...', 3)}
    ${_field('q_dbg_v2_2', '2.2. Tarafsızlık ve Objektiflik', 'Yakın arkadaşınızın ciddi bir hatayı bildirmediğini fark ettiğinizde izleyeceğiniz profesyonel tutumu detaylı anlatınız...', 3)}
    ${_field('q_dbg_v2_2b', '2.2.1. Kişisel Çıkar Çatışması Yaşadığınız Bir Durumda Tutumunuz', 'Kendi çıkarınızla ekibin/oyunun çıkarının çatıştığı bir durumda nasıl karar vereceğinizi somut bir örnekle anlatınız...', 3)}
    ${_field('q_dbg_v2_3', '2.3. Bilgi Gizliliği ve Sızdırma (Leak) Hassasiyeti', 'Henüz yayınlanmamış test güncellemelerinin gizliliğine ne kadar önem verdiğinizi ve bu bilgiyi korumak için ne gibi önlemler alacağınızı anlatınız...', 3)}
    ${_field('q_dbg_v3_1', '3.1. Geribildirim ve Eleştiri Toleransı', 'Hazırladığınız bir raporun eksik/yetersiz bulunduğu ve revize istendiği bir durumda nasıl yaklaşacağınızı anlatınız...', 3)}
    ${_field('q_dbg_v3_2', '3.2. Ekip Çalışması ve Fikir Ayrılıkları', 'Başka bir denetçiyle bir hatanın ciddiyet seviyesi konusunda yaşanan anlaşmazlığı nasıl çözüme kavuşturacağınızı adım adım anlatınız...', 3)}
    ${_field('q_dbg_v3_2b', '3.2.1. Uzlaşmaya Varılamayan Durumlarda İzleyeceğiniz Yol', 'Karşılıklı görüş ayrılığı devam ederse konuyu kime, nasıl ileteceğinizi belirtiniz...', 2)}
  `;
  const step4 = _step(4, '#f59e0b', 'BÖLÜM 4 — OFİS HİYERARŞİSİ, EKİP İÇİ İLETİŞİM VE ETİK KURALLAR', 'Hiyerarşi, etik ilkeler, tarafsızlık ve sızdırma hassasiyeti.', progressBar + step4Body, prevBtn(4) + nextBtn(4, '#f59e0b,#d97706'));

  // ═══ BÖLÜM 5 ═══ (taahhütname metinleri ve onay kutuları AYNEN korunmuştur — sadece imza alanına küçük bir doğrulama sorusu eklendi)
  const step5Body = `
    <div style="background:rgba(239,68,68,0.06);border-left:3px solid #ef4444;padding:1.2rem 1.4rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.8;margin-bottom:1.3rem;">
      <p style="margin:0 0 0.8rem 0;">Bu bölüm, Hata Ayıklama Ofisi // [A-0] Geçici Personel Alım Formu başvuru sürecinin hukuki, idari ve disipliner bağlayıcı son aşamasıdır.</p>
      <p style="margin:0;color:#fca5a5;font-weight:600;">⚠️ Bu bölümdeki onaylar bağlayıcıdır; her maddeyi dikkatle okumadan işaretlemeyiniz.</p>
    </div>

    <div style="background:rgba(0,0,0,0.3);padding:1.2rem;border-radius:12px;border:1px solid rgba(255,255,255,0.08);margin-bottom:1.2rem;">
      <h4 style="color:#ef4444;margin:0 0 0.6rem 0;font-size:0.95rem;">📜 TAAHHÜTNAME VE NİHAİ BAŞVURU ONAYLARI</h4>

      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dbg_nda_1" required style="margin-top:0.2rem;">
          <span><strong>1.1. Bilgilerin Doğruluğu ve Özgünlük Onayı:</strong> Verdiğim bilgilerin eksiksiz, doğru ve şahsıma ait olduğunu; özgün olmayan/yapay zeka ürünü içerik barındırmadığını kabul ediyorum.</span>
        </label>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dbg_nda_2" required style="margin-top:0.2rem;">
          <span><strong>1.2. Yanıltıcı Beyan Yaptırımı:</strong> Yanlış veya yanıltıcı bilgi tespiti durumunda başvurumun derhal iptal edileceğini ve Eko Creations bünyesinde kara listeye alınacağımı kabul ediyorum.</span>
        </label>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dbg_nda_3" required style="margin-top:0.2rem;">
          <span><strong>2.1. İç Bilgi ve Hata Gizliliği (NDA):</strong> Oyun içi açıkları, hataları ve yayınlanmamış test güncellemelerini 3. kişilerle kesinlikle paylaşmayacağımı taahhüt ederim.</span>
        </label>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dbg_nda_4" required style="margin-top:0.2rem;">
          <span><strong>2.2. Açık ve Yetki İstismar Etmeme (Exploit / Dupe Abuse):</strong> Sistem açıklarını kendi veya başkalarının çıkarı için kullanmayacağımı, derhal bildireceğimi kabul ederim.</span>
        </label>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dbg_nda_5" required style="margin-top:0.2rem;">
          <span><strong>3.1. Yönetmelik ve Kurallara Uyum:</strong> Kurallar ve Yönetmelik Bilgilendirmesi ile Eko Creations Yönetmeliği prosedürlerini okuduğumu ve uyacağımı kabul ederim.</span>
        </label>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dbg_nda_6" required style="margin-top:0.2rem;">
          <span><strong>3.2. Ofis Amiri ve Komite Nihai Yetki Beyanı:</strong> Tek yetkili mercinin Regülasyon Komitesi ve Ofis Amiri olduğunu ve kararın bağlayıcılığını kabul ederim.</span>
        </label>
      </div>
    </div>

    ${_field('q_dbg_sign_name', '4.1. Başvuru Sahibinin Adı Soyadı', 'Tam Ad Soyad...', 1)}
    ${_field('q_dbg_sign_date', '4.2. Başvuru Tarihi ve Saat', 'Örn: 10/08/2026 - 20:00', 1)}
    ${_field('q_dbg_sign_signature', '4.3. Onay İmzası (Discord & Roblox Kullanıcı Adı / ID)', 'Örn: cyhnoz / 123456789012345678', 1)}
    ${_field('q_dbg_sign_note', '4.4. Eklemek İstediğiniz Son Notlar (Opsiyonel)', 'Başvurunuzla ilgili belirtmek istediğiniz ek bir husus varsa buraya yazabilirsiniz...', 2)}
  `;
  const step5 = _step(5, '#ef4444', 'BÖLÜM 5 — TAAHHÜTNAME, YÖNETMELİK ONAYI VE NİHAİ BAŞVURU ONAYI', 'Hukuki, idari ve disipliner taahhütleriniz.', progressBar + step5Body, prevBtn(5) + `<button type="submit" id="btn-submit-dbg" class="btn" style="background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;font-weight:800;padding:0.8rem 2.2rem;border-radius:24px;border:none;cursor:pointer;font-size:1rem;box-shadow:0 4px 15px rgba(56,189,248,0.4);">🚀 Hata Ayıklama Ofisi Başvurusunu Gönder</button>`);

  const content = `
    <div style="max-width:860px;margin:2rem auto;animation:fadeUp 0.5s ease;">
      <div style="width:100%;border-radius:20px;overflow:hidden;margin-bottom:1.8rem;box-shadow:0 12px 32px rgba(0,0,0,0.5);">
        <img src="${BANNER}" style="width:100%;display:block;max-height:240px;object-fit:cover;">
      </div>

      <div style="text-align:center;margin-bottom:2rem;">
        <h1 style="font-size:1.8rem;font-weight:800;color:#fff;margin-bottom:0.5rem;display:flex;align-items:center;justify-content:center;gap:0.6rem;">
          <img src="https://cdn.discordapp.com/emojis/1536405009187602482.png" style="height:32px;width:32px;object-fit:contain;" onerror="this.style.display='none'">
          <span>HATA AYIKLAMA OFİSİ // [A-0] GEÇİCİ PERSONEL ALIM FORMU</span>
        </h1>
        <p style="color:var(--muted);font-size:0.95rem;max-width:680px;margin:0 auto;">
          Hata Denetçisi Ön Değerlendirme Belgesi. Lütfen tüm bölümleri eksiksiz ve özgün yanıtlarla doldurunuz.
        </p>
      </div>

      <form id="dbg-form">
        ${step1}
        ${step2}
        ${step3}
        ${step4}
        ${step5}
      </form>
    </div>

    <script>
      // ═══ İlerleme çubuğu güncelleme ═══
      function updateProgress(n) {
        const fills = document.querySelectorAll('#dbg-progress-fill');
        const labels = document.querySelectorAll('#dbg-progress-label');
        const pct = (n / 5) * 100;
        fills.forEach(f => f.style.width = pct + '%');
        labels.forEach(l => l.textContent = 'Bölüm ' + n + ' / 5');
      }

      // ═══ Karakter sayacı (textarea'lar için) ═══
      function attachCharCounters() {
        document.querySelectorAll('#dbg-form textarea').forEach(function(ta) {
          if (ta.dataset.counterAttached) return;
          ta.dataset.counterAttached = '1';
          const counter = document.createElement('div');
          counter.style.cssText = 'font-size:0.72rem;color:var(--muted);text-align:right;margin-top:-0.9rem;margin-bottom:0.9rem;';
          counter.textContent = (ta.value ? ta.value.length : 0) + ' karakter';
          ta.insertAdjacentElement('afterend', counter);
          ta.addEventListener('input', function() {
            counter.textContent = ta.value.length + ' karakter';
          });
        });
      }
      attachCharCounters();

      function toggleStep(n) {
        const body = document.querySelector('#form-step-' + n + ' .step-body');
        if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
      }
      function nextStep(n) {
        document.getElementById('form-step-' + n).style.display = 'none';
        const next = document.getElementById('form-step-' + (n + 1));
        if (next) {
          next.style.display = 'block';
          updateProgress(n + 1);
          window.scrollTo({top: next.offsetTop - 80, behavior: 'smooth'});
        }
      }
      function prevStep(n) {
        document.getElementById('form-step-' + n).style.display = 'none';
        const prev = document.getElementById('form-step-' + (n - 1));
        if (prev) {
          prev.style.display = 'block';
          updateProgress(n - 1);
          window.scrollTo({top: prev.offsetTop - 80, behavior: 'smooth'});
        }
      }

      document.getElementById('dbg-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-dbg');
        btn.disabled = true; btn.innerHTML = '⏳ Gönderiliyor...';

        const data = {
          discordUsername: document.getElementById('q_discord')?.value || '',
          q_dbg_email: document.getElementById('q_dbg_email')?.value || '',
          q_dbg_1_2: document.getElementById('q_dbg_1_2')?.value || '',
          q_dbg_1_3: document.getElementById('q_dbg_1_3')?.value || '',
          q_dbg_roblox: document.getElementById('q_dbg_roblox')?.value || '',
          q_dbg_1_5b: document.getElementById('q_dbg_1_5b')?.value || '',
          q_dbg_2_1: document.getElementById('q_dbg_2_1')?.value || '',
          q_dbg_2_2: document.getElementById('q_dbg_2_2')?.value || '',
          q_dbg_2_2b: document.getElementById('q_dbg_2_2b')?.value || '',
          q_dbg_2_3: document.getElementById('q_dbg_2_3')?.value || '',
          q_dbg_2_4: document.getElementById('q_dbg_2_4')?.value || '',
          q_dbg_3_1: document.getElementById('q_dbg_3_1')?.value || '',
          q_dbg_3_2: document.getElementById('q_dbg_3_2')?.value || '',
          q_dbg_3_2b: document.getElementById('q_dbg_3_2b')?.value || '',
          q_dbg_4_1: document.getElementById('q_dbg_4_1')?.value || '',
          q_dbg_4_2: document.getElementById('q_dbg_4_2')?.value || '',
          q_dbg_4_3: document.getElementById('q_dbg_4_3')?.value || '',
          q_dbg_4_3b: document.getElementById('q_dbg_4_3b')?.value || '',
          q_dbg_5_1: document.getElementById('q_dbg_5_1')?.value || '',
          q_dbg_5_2: document.getElementById('q_dbg_5_2')?.value || '',
          q_dbg_5_3: document.getElementById('q_dbg_5_3')?.value || '',
          q_dbg_t1_1: document.getElementById('q_dbg_t1_1')?.value || '',
          q_dbg_t1_1b: document.getElementById('q_dbg_t1_1b')?.value || '',
          q_dbg_t1_2: document.getElementById('q_dbg_t1_2')?.value || '',
          q_dbg_t1_3: document.getElementById('q_dbg_t1_3')?.value || '',
          q_dbg_t2_1: document.getElementById('q_dbg_t2_1')?.value || '',
          q_dbg_t2_2: document.getElementById('q_dbg_t2_2')?.value || '',
          q_dbg_t2_3: document.getElementById('q_dbg_t2_3')?.value || '',
          q_dbg_t2_3b: document.getElementById('q_dbg_t2_3b')?.value || '',
          q_dbg_t3_1: document.getElementById('q_dbg_t3_1')?.value || '',
          q_dbg_t3_2: document.getElementById('q_dbg_t3_2')?.value || '',
          q_dbg_t3_3: document.getElementById('q_dbg_t3_3')?.value || '',
          q_dbg_t4_1: document.getElementById('q_dbg_t4_1')?.value || '',
          q_dbg_t4_2: document.getElementById('q_dbg_t4_2')?.value || '',
          q_dbg_t4_2b: document.getElementById('q_dbg_t4_2b')?.value || '',
          q_dbg_s1_1: document.getElementById('q_dbg_s1_1')?.value || '',
          q_dbg_s1_2: document.getElementById('q_dbg_s1_2')?.value || '',
          q_dbg_s1_3: document.getElementById('q_dbg_s1_3')?.value || '',
          q_dbg_s1_4: document.getElementById('q_dbg_s1_4')?.value || '',
          q_dbg_s2_1: document.getElementById('q_dbg_s2_1')?.value || '',
          q_dbg_s2_1b: document.getElementById('q_dbg_s2_1b')?.value || '',
          q_dbg_s3_1: document.getElementById('q_dbg_s3_1')?.value || '',
          q_dbg_s3_2: document.getElementById('q_dbg_s3_2')?.value || '',
          q_dbg_s3_2b: document.getElementById('q_dbg_s3_2b')?.value || '',
          q_dbg_v1_1: document.getElementById('q_dbg_v1_1')?.value || '',
          q_dbg_v1_2: document.getElementById('q_dbg_v1_2')?.value || '',
          q_dbg_v1_3: document.getElementById('q_dbg_v1_3')?.value || '',
          q_dbg_v2_1: document.getElementById('q_dbg_v2_1')?.value || '',
          q_dbg_v2_2: document.getElementById('q_dbg_v2_2')?.value || '',
          q_dbg_v2_2b: document.getElementById('q_dbg_v2_2b')?.value || '',
          q_dbg_v2_3: document.getElementById('q_dbg_v2_3')?.value || '',
          q_dbg_v3_1: document.getElementById('q_dbg_v3_1')?.value || '',
          q_dbg_v3_2: document.getElementById('q_dbg_v3_2')?.value || '',
          q_dbg_v3_2b: document.getElementById('q_dbg_v3_2b')?.value || '',
          q_dbg_sign_name: document.getElementById('q_dbg_sign_name')?.value || '',
          q_dbg_sign_date: document.getElementById('q_dbg_sign_date')?.value || '',
          q_dbg_sign_signature: document.getElementById('q_dbg_sign_signature')?.value || '',
          q_dbg_sign_note: document.getElementById('q_dbg_sign_note')?.value || '',
        };

        try {
          const res = await fetch('/api/forms/debug-office/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const resData = await res.json();
          if (res.ok && resData.success) {
            alert('✅ Hata Ayıklama Ofisi başvurunuz başarıyla alındı!');
            window.location.href = '/forms';
          } else {
            alert('❌ Hata: ' + (resData.error || 'Başvuru gönderilemedi.'));
            btn.disabled = false; btn.innerHTML = '🚀 Hata Ayıklama Ofisi Başvurusunu Gönder';
          }
        } catch (err) {
          alert('❌ Bağlantı hatası: ' + err.message);
          btn.disabled = false; btn.innerHTML = '🚀 Hata Ayıklama Ofisi Başvurusunu Gönder';
        }
      });
    </script>
  `;

  return _layout('Hata Ayıklama Ofisi Alım Formu', currentUser, content, '', '/forms');
}
module.exports = {
  renderEventStaffFormPage,
  renderClosedFormPage,
  renderCommunityAmbassadorFormPage,
  renderDeveloperFormPage,
  renderDebugOfficeFormPage,
};

