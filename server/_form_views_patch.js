function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #818cf8;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Başvuru formunun ilk bölümünde, kimliğinizin doğrulanabilmesi ve sürecin düzenli bir şekilde ilerleyebilmesi için bazı temel ön bilgiler talep edilmektedir. Bu bilgiler, yalnızca başvurunun değerlendirilmesi ve iletişim sürecinin sağlıklı yürütülmesi amacıyla kullanılacaktır.<br><br>
      Lütfen sizden istenen bilgileri eksiksiz, güncel ve doğru bir biçimde doldurunuz. Bilgilerin doğruluğundan başvuru sahibi sorumludur. Eksik veya hatalı bilgi girişi, başvurunun geçersiz sayılmasına neden olabilir.
    </div>
    <div class="form-group" style="margin-bottom:1rem;">
      <label class="field-label">DISCORD HESABI *<br><span style="font-weight:400;font-size:0.78rem;color:var(--muted);">Discord hesabınızın kullanıcı adı nedir? Eğer herhangi bir etiket (tag) özelliğine sahipseniz "İSİM#(etiket)" şeklinde yazın.</span></label>
      <input type="text" id="q_discord" class="input-field track-field" data-field="discord_username" value="${_esc(usernameStr)}" required placeholder="Örn: ekonqtx">
      <div class="field-hint" id="hint-q_discord" style="font-size:0.72rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
    </div>
    <div class="form-group" style="margin-bottom:0;">
      <label class="field-label">DISCORD ID *<br><span style="font-weight:400;font-size:0.78rem;color:var(--muted);">Mülakat saatleri ve bot bildirimleri için 18 haneli Discord ID'niz.</span></label>
      <input type="text" id="q_discord_id" class="input-field track-field" data-field="discord_id" value="${_esc(currentUser ? (currentUser.discordId || '') : '')}" required placeholder="Örn: 123456789012345678">
      <div class="field-hint" id="hint-q_discord_id" style="font-size:0.72rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
    </div>`;
  const step1 = _step(1, '#818cf8', 'BÖLÜM 1 — İSTENİLEN ÖN BİLGİLER', 'Kimliğinizin doğrulanabilmesi için temel ön bilgileriniz.', step1Body, nextBtn(1, '#818cf8', '#818cf8,#6366f1'));

  // ═══ BÖLÜM 2 ═══
  const step2Body = `
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #a78bfa;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Kişisel bilgi paylaşımı, bireylerin özel ve hassas bilgilerini güvenli bir şekilde sunma sürecidir. Bu süreçte gizlilik, veri güvenliği ve yasal sorumluluklar öncelikli olarak gözetilmektedir. Paylaştığınız bilgiler, başvuru ve değerlendirme sürecinin doğru, adil ve etkili bir şekilde yürütülmesini sağlamak amacıyla kullanılacaktır.<br><br>
      Sunduğunuz akademik geçmiş, deneyimler, yetkinlikler ve kişisel tercihler, Etkinlik Sorumluluğu ve ilgili yetkili ekipler tarafından, sizin için en uygun görev ve sorumluluk alanlarını belirlemek ve sunucumuzun standartlarına uygun çözümler geliştirmek amacıyla değerlendirilecektir.<br><br>
      Tüm paylaşımlarınız sadece Etkinlik Organizatörü tarafından merkezi değerlendirme birimine iletilecek ve gizlilik politikalarımız doğrultusunda korunacaktır.
    </div>
    ${_field('q_p1', 'KİŞİSEL SORU — Bize biraz kendinizden bahseder misiniz?', 'Kendiniz, ilgi alanlarınız ve yaşınızdan bahsedin...', 3)}
    ${_field('q_p2', 'KİŞİSEL SORU — Hangi becerilerinizin takım içinde en çok değer taşıdığını düşünüyorsunuz?', 'Becerilerinizi ve güçlü yönlerinizi detaylandırın...', 3)}
    ${_field('q_p3', 'KİŞİSEL SORU — Takıma ne gibi özellikler getirebilirsiniz?', 'Takıma katacağınız değerleri açıklayın...', 3)}
    ${_field('q_p4', 'KİŞİSEL SORU — Neden Etkinlik Sorumluluğunda görev almak istiyorsunuz?', 'Etkinlik Yetkililiğinde çalışmanın sizin için anlamı nedir ve burada görev alarak nasıl bir katma değer sağlayacağınızı düşünüyorsunuz?', 4)}
    ${_field('q_p5', 'KİŞİSEL SORU — Üstlerinizden direktif alma konusunda ne kadar rahat hissedersiniz?', 'Bu süreçte yönergeleri anlama, uygulama ve gerektiğinde adapte etme yeteneğiniz hakkında neler söyleyebilirsiniz?', 3)}`;
  const step2 = _step(2, '#a78bfa', 'BÖLÜM 2 — İSTENİLEN KİŞİSEL BİLGİLER', 'Akademik geçmiş, deneyimler ve kişisel tercihleriniz.', step2Body, prevBtn(2) + nextBtn(2, '#a78bfa', '#a78bfa,#8b5cf6'));

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
            ['A','Etkinliği durdurarak tüm kanalları kapatmak ve sorunu daha sonra incelemek',''],
            ['B','Kanal izinlerini hızlıca düzenleyerek yalnızca ilgili rollerin erişimine izin vermek','color:#34d399;font-weight:700;'],
            ['C','Yetkisiz erişimi olan kullanıcıları doğrudan etkinlikten çıkarmak',''],
            ['D','Moderasyon ekibine durumu bildirip hiçbir müdahalede bulunmamak',''],
            ['E','Katılımcılardan kanalları kendi isteğiyle terk etmelerini rica etmek','']
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
            ['explain','Yaşanan teknik sorunu katılımcılara kısa ve net şekilde açıklamak',''],
            ['rules_remind','Etkinlik kurallarını ve akışı yazılı olarak yeniden hatırlatmak',''],
            ['argue','İtiraz eden katılımcılarla tartışmaya girmek','color:#fb7185;'],
            ['coord','Gerekli durumlarda yönetim veya moderasyon ekibiyle koordinasyon sağlamak',''],
            ['abort','Etkinliği gerekçesiz şekilde sonlandırmak','color:#fb7185;']
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
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #fbbf24;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Etkinlik Sorumluluğu kapsamında kullanılan senaryolar; EkoYıldız sunucusu içerisinde ve sunucu dışı platformlarda düzenlenen etkinliklerde karşılaşılması muhtemel gerçekçi durumları, operasyonel aksaklıkları ve organizasyon odaklı krizleri simüle eden, Etkinlik Sorumlularının planlama, yönetim, karar alma ve kriz müdahale yetkinliklerini çok yönlü biçimde değerlendirmeyi amaçlayan stratejik ölçüm araçlarıdır.<br><br>
      Bu senaryolar; etkinlik akışında yaşanan bir aksama, teknik bir problem, katılımcı itirazları, görevli yetkililer arasında yaşanan yetki karmaşası, kurallara uyumsuzluk veya etkinliğin genel düzenini ve algısını etkileyebilecek bir kriz durumu üzerine kurgulanır.
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
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid #fb7185;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölümdeki soruların cevapları, idari politikalarımızın güçlendirilmesi ve ekibimizin daha etkin bir şekilde işleyebilmesi için önemli bir katkı sağlayacaktır.
    </div>

    <div class="form-group" style="margin-bottom:1.3rem;">
      <label class="field-label">SON SORU — Yetkilerinizi kötüye kullanırsanız sorumluluk haklarınızın alınabileceğini ve teknik olarak sunucu içinde soruşturma altına olacağınızı kabul ediyor musunuz? *</label>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(52,211,153,0.12)'" onmouseout="this.style.background='rgba(52,211,153,0.06)'">
          <input type="radio" name="opt_abuse" value="EVET" required style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:600;">Evet, kabul ediyorum.</span>
        </label>
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(251,113,133,0.06);border:1px solid rgba(251,113,133,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(251,113,133,0.12)'" onmouseout="this.style.background='rgba(251,113,133,0.06)'">
          <input type="radio" name="opt_abuse" value="HAYIR" style="accent-color:#fb7185;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#fb7185;font-weight:600;">Hayır, kabul etmiyorum.</span>
        </label>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:1.3rem;">
      <label class="field-label">SON SORU — Başka bir çalışana saygısızlık ederseniz yetkililik haklarınızın elinizden alınabileceğini kabul ediyor musunuz? *</label>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(52,211,153,0.12)'" onmouseout="this.style.background='rgba(52,211,153,0.06)'">
          <input type="radio" name="opt_respect" value="EVET" required style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:600;">Evet, kabul ediyorum.</span>
        </label>
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.65rem 1rem;border-radius:12px;cursor:pointer;background:rgba(251,113,133,0.06);border:1px solid rgba(251,113,133,0.15);transition:all 0.2s;" onmouseover="this.style.background='rgba(251,113,133,0.12)'" onmouseout="this.style.background='rgba(251,113,133,0.06)'">
          <input type="radio" name="opt_respect" value="HAYIR" style="accent-color:#fb7185;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#fb7185;font-weight:600;">Hayır, kabul etmiyorum.</span>
        </label>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:0;">
      <label class="field-label">TALİMATNAME — Personel sınıfına bağlı belirli kurallar mevcut. El kitapçığına uyacağınızı teyit eder misiniz? *</label>
      <div style="margin-top:0.5rem;">
        <label class="mc-option" style="display:flex;align-items:center;gap:0.7rem;padding:0.75rem 1rem;border-radius:12px;cursor:pointer;background:rgba(52,211,153,0.08);border:1.5px solid rgba(52,211,153,0.25);transition:all 0.2s;">
          <input type="radio" name="opt_rules" value="EVET" required checked style="accent-color:#34d399;width:18px;height:18px;">
          <span style="font-size:0.92rem;color:#34d399;font-weight:700;">Kurallara uyacağım, Talimat kitapçığına göre ilerleyecek ve vazifemi yerine getireceğim.</span>
        </label>
      </div>
    </div>`;
  const step5Nav = prevBtn(5) + `<button type="submit" id="submit-btn" class="btn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:800;font-size:1.1rem;padding:0.9rem 2.8rem;border-radius:30px;box-shadow:0 8px 25px rgba(16,185,129,0.4);border:none;cursor:pointer;font-family:inherit;">🚀 Başvuruyu Gönder</button>`;
  const step5 = _step(5, '#fb7185', 'BÖLÜM 5 — İSTENİLEN SON BİLGİLER (ZORUNLU ONAYLAR)', 'Başvurunuzu tamamlamak için aşağıdaki zorunlu onayları verin.', step5Body, step5Nav);

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
          <h3 style="font-size:1.15rem;font-weight:800;color:#fff;margin-bottom:1rem;">📖 BİRİNCİL ALIM FORMU</h3>
          <div style="display:flex;flex-direction:column;gap:1rem;font-size:0.88rem;color:var(--muted);line-height:1.7;">
            <div style="border-left:3px solid #818cf8;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);">
              Birincil değerlendirme formumuz, adayların başvuru sürecinde ilk adımı attıkları ve başvurularının ön değerlendirmesinin yapıldığı önemli bir belgedir. Bu form, "Etkinlik Sorumlusu" pozisyonuna başvuran adayların ilk değerlendirmeye tabi tutulduğu bir araçtır.
            </div>
            <div style="border-left:3px solid #34d399;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);">
              <strong style="color:#fff;">FORMUN AMACI VE SÜRECİ:</strong> Formun temel amacı, adayların pozisyona uygunluğunu ilk aşamada değerlendirmektir. Başvurunun incelenmesi → Koşullu nihai değerlendirme → Mülakat daveti → Kurula alım kararı.
            </div>
            <div style="border-left:3px solid #a78bfa;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);">
              <strong style="color:#fff;">ÖN ALIMLAR MÜLAKATI:</strong> Başvurduğunuz departmanı harici olarak yöneten komite, sizinle iletişime geçecektir. Regülasyon Komitesi, size özel hazırlanmış soruları yanıtlamanızı isteyecektir. Yalnızca Etkinlik Organizatörünün onayını alırsanız, departmana katılma hakkına sahip olacaksınız.
            </div>
            <div style="border-left:3px solid #fbbf24;padding:0.8rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);font-size:0.82rem;">
              <strong style="color:#fff;">📌 FORM KURALLARI:</strong><br>
              • Başvuru formunu sadece bir kez göndermelisiniz.<br>
              • Trolleme veya toksik başvurularda bulunan kişiler EkoYıldız tarafından kara listeye alınacaktır.<br>
              • Başvuru cevaplarının özgün olması zorunludur. Yapay zekâ veya başkasından kopyalanmış içerikler tespit edildiğinde başvuru reddedilir.<br>
              • Koordinatörün değerlendirme süreci gizlilik esasına dayanır.<br>
              • Başvuru formu yalnızca kişisel değerlendirme amacı taşımakta olup paylaşılması yasaktır.<br>
              • Formun doldurulması, ilgili yönetmelik ve kuralları okuduğunuz ve kabul ettiğiniz anlamına gelir.<br>
              <span style="color:#818cf8;font-style:italic;">— Kurucu ekonqt</span>
            </div>
            <div style="border-left:3px solid #fb7185;padding:0.6rem 1.2rem;border-radius:0 12px 12px 0;background:rgba(255,255,255,0.02);font-size:0.82rem;font-style:italic;">
              ・EK NOT: Etkinlik Organizatörü her başvuruyu dikkatle inceler. Bu sürece adım atan adaylara, disiplin ve kararlılık içinde ilerlemeleri temenni edilir.
            </div>
          </div>
        </div>

        <!-- STEP PROGRESS BAR -->
        <div id="step-progress" class="card" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:1.2rem 1.5rem;margin-bottom:1.2rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.8rem;">
            ${[
              ['1','Ön Bilgiler','#818cf8'],
              ['2','Kişisel','#a78bfa'],
              ['3','Teknik','#34d399'],
              ['4','Senaryolar','#fbbf24'],
              ['5','Onaylar','#fb7185']
            ].map(([n,label,color], i) => `
              <div id="step-pill-${n}" style="display:flex;align-items:center;gap:0.35rem;padding:0.3rem 0.75rem;border-radius:20px;font-size:0.78rem;font-weight:800;border:1.5px solid ${color}40;color:${color};opacity:${i===0?'1':'0.4'};transition:opacity 0.3s;">
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
              ['1','Profil','#818cf8'],
              ['2','Vizyon','#a78bfa'],
              ['3','Kriz & Senaryo','#f59e0b'],
              ['4','Etik Testi','#ec4899'],
              ['5','Teknik & Bot','#10b981'],
              ['6','Onay','#3b82f6']
            ].map(([n,label,color], i) => `
              <div id="step-pill-${n}" style="display:flex;align-items:center;gap:0.35rem;padding:0.3rem 0.65rem;border-radius:20px;font-size:0.78rem;font-weight:800;border:1.5px solid ${color}40;color:${color};opacity:${i===0?'1':'0.4'};transition:opacity 0.3s;cursor:pointer;" onclick="toggleStep(${n})">
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

  // ═══ BÖLÜM 1 ═══
  const step1Body = `
    <div style="background:rgba(129,140,248,0.06);border-left:3px solid #818cf8;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Aşağıdaki sorular, adayların temel kimlik, iletişim, zaman yönetimi ve topluluk geçmişini detaylı bir şekilde analiz etmek üzere hazırlanmıştır. <strong>"Geliştirici Adayı"</strong> statüsünün gerektirdiği sorumluluk bilinci, gizlilik ilkelerine bağlılık ve iletişim yetkinliklerinin ilk değerlendirmesi bu bölüm üzerinden yapılacaktır.
    </div>
    <div class="form-group" style="margin-bottom:1.2rem;">
      <label class="field-label" style="display:block;font-size:0.88rem;font-weight:700;color:#e2e8f0;margin-bottom:0.4rem;">DISCORD HESABI VE USER ID *</label>
      <input type="text" id="q_discord" class="input-field track-field" data-field="discord_username" value="${_esc(usernameStr)}" required placeholder="Örn: ekonqtx / 123456789012345678" style="width:100%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:0.7rem 0.9rem;border-radius:10px;font-size:0.88rem;">
    </div>
    ${_field('q_dev_1_1', '1.1. Adınız ve Soyadınız', 'Resmi kayıtlarda yer alan tam adınız ve soyadınız...', 2)}
    ${_field('q_dev_1_2', '1.2. Yaşınız ve Doğum Tarihiniz', 'Örn: 18 / 15.05.2008', 2)}
    ${_field('q_dev_1_4', '1.4. Çalıştığınız / Yaşadığınız Saat Dilimi ve Şehir', 'Örn: UTC+3 / İstanbul', 2)}
    ${_field('q_dev_2_1', '2.1. Günlük Aktiflik Süreniz ve Müsaitlik Saatleriniz', 'Hafta içi ve hafta sonu aktiflik saatleriniz...', 3)}
    ${_field('q_dev_2_2', '2.2. Acil Durum İletişim Kanallarınız', 'İkincil iletişim kanallarınız (E-posta, Telegram vb.)...', 2)}
    ${_field('q_dev_2_3', '2.3. Sesli İletişim Yetkinliğiniz', 'Mikrofon kullanımı ve sesli iletişim durumunuz...', 2)}
    ${_field('q_dev_3_1', '3.1. Eğitim Durumunuz veya Mesleki Statünüz', 'Öğrenci/çalışan durumu...', 2)}
    ${_field('q_dev_3_2', '3.2. Projeye Ayırabileceğiniz Günlük ve Haftalık Zaman', 'Haftada ortalama kaç saat kesintisiz ayırabilirsiniz...', 2)}
    ${_field('q_dev_3_3', '3.3. Gelecek Planlarınız ve Olası Yoğunluk Dönemleriniz', 'Önümüzdeki 6 ay içindeki sınav, iş, tatil vb. durumlar...', 3)}
    ${_field('q_dev_4_1', '4.1. Kendinizi ve Çalışma Tarzınızı Detaylıca Tanımlayınız', 'Güçlü/gelişime açık yönleriniz ve çalışma disiplininiz...', 3)}
    ${_field('q_dev_4_2', '4.2. Baskı, Stres ve Yoğun Çalışma Temposu Altındaki Tutumunuz', 'Kriz anlarındaki tutumunuz ve stres yönetimi...', 3)}
    ${_field('q_dev_4_3', '4.3. Ekip Çalışması ve İletişim Anlayışınız', 'Farklı görüşteki geliştiricilerle çalışma ve fikir ayrılığı yönetimi...', 3)}
    ${_field('q_dev_5_1', '5.1. Daha Önce Görev Aldığınız Projeler ve Sunucular', 'Daha önceki geliştirici deneyimleriniz...', 3)}
    ${_field('q_dev_5_2', '5.2. Geçmiş Referanslarınız', 'Referans alınabilecek kişilerin Discord adları ve unvanları...', 2)}
    ${_field('q_dev_5_3', '5.3. Disiplin ve İhlal Geçmişi', 'Daha önce aldığınız ceza, uyarı veya ihraç durumları...', 2)}
  `;
  const step1 = _step(1, '#818cf8', 'BÖLÜM 1 — KİŞİSEL BİLGİLER VE KİMLİK DOĞRULAMA', 'Temel kimlik, zaman yönetimi ve topluluk geçmişiniz.', step1Body, nextBtn(1, '#818cf8,#6366f1'));

  // ═══ BÖLÜM 2 ═══
  const step2Body = `
    <div style="background:rgba(167,139,250,0.06);border-left:3px solid #a78bfa;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölüm, <strong>Geliştirici Adayı</strong> pozisyonuna başvuran adayların teknik altyapısını, hakim oldukları programlama dillerini, geliştirme mimarilerini ve kod kalitesini ölçmek amacıyla hazırlanmıştır.
    </div>
    ${_field('q_dev_t1_1', '1.1. Hakim Olduğunuz Programlama ve İşaretleme Dilleri', 'Lua, JS, TS, C#, Python, HTML/CSS seviyeleriniz ve tecrübe süreniz...', 3)}
    ${_field('q_dev_t1_2', '1.2. Nesne Yönelimli Programlama (OOP) ve Fonksiyonel Programlama', 'OOP ilkeleri (Inheritance, Encapsulation vb.) hakimiyetiniz...', 3)}
    ${_field('q_dev_t1_3', '1.3. Asenkron Programlama ve Veri Yapıları', 'Async/Await, Promises, Thread/Coroutine ve karmaşık veri yapıları...', 3)}
    ${_field('q_dev_t2_1', '2.1. Kullanılan Framework ve Ekosistem Deneyimi', 'QBCore, ESX, QBox, vRP veya Custom altyapı tecrübeleri...', 3)}
    ${_field('q_dev_t2_2', '2.2. Client-Side ve Server-Side Mimarisi', 'Client-Server veri akışı ve güvenlik kriterleriniz...', 3)}
    ${_field('q_dev_t2_3', '2.3. NUI ve Ön Yüz (Frontend) Geliştirme', 'React, Vue, Svelte veya Vanilla JS/CSS ile NUI deneyimi...', 3)}
    ${_field('q_dev_t3_1', '3.1. Veritabanı Teknolojileri ve Sorgu Optimizasyonu', 'MySQL, MariaDB, MongoDB ve sorgu sürelerini düşürme yöntemleri...', 3)}
    ${_field('q_dev_t3_2', '3.2. Caching (Önbellekleme) ve Veri Saklama Stratejileri', 'RAM/Local State veri saklama ve Save Interval mekanizmaları...', 3)}
    ${_field('q_dev_t3_3', '3.3. Kod Optimizasyonu ve Profiling (Resmon / Performance Analysis)', 'Script ms (tick/resmon) değerlerini optimize etme yöntemleriniz...', 3)}
    ${_field('q_dev_t4_1', '4.1. Git ve Versiyon Kontrol Sistemleri', 'Git, GitHub, Branch yönetimi, PR ve Conflict çözümü...', 3)}
    ${_field('q_dev_t4_2', '4.2. Geliştirme Ortamı (IDE) ve Yardımcı Araçlar', 'VS Code, Linter, Formatter, Debugger ve eklentiler...', 2)}
    ${_field('q_dev_t4_3', '4.3. API ve Entegrasyon Deneyimi', 'REST API, Webhook (Discord API vb.) entegrasyonları...', 3)}
    ${_field('q_dev_t5_1', '5.1. Server-Side Doğrulama ve Güvenlik', 'Event Triggering, Net Event Exploits ve Injection önleme...', 3)}
    ${_field('q_dev_t5_2', '5.2. Veri Doğrulama (Sanitization & Validation)', 'Client\'tan gelen verilerin (Item, Para, Koord) güvenliği...', 3)}
  `;
  const step2 = _step(2, '#a78bfa', 'BÖLÜM 2 — TEKNİK BECERİLER, YAZILIM DENEYİMİ VE KODLAMA STANDARTLARI', 'Teknik altyapı, diller ve mimari deneyimleriniz.', step2Body, prevBtn(2) + nextBtn(2, '#a78bfa,#8b5cf6'));

  // ═══ BÖLÜM 3 ═══
  const step3Body = `
    <div style="background:rgba(52,211,153,0.06);border-left:3px solid #34d399;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Aşağıdaki senaryolar, bir geliştirmecinin günlük süreçte karşılaşabileceği gerçek mimari problemler, performans krizleri ve güvenlik açıkları dikkate alınarak kurgulanmıştır.
    </div>
    ${_field('q_dev_s1_1', '1.1. Yüksek Resmon (Tick Rate) Sorunu', '0.15-0.20 ms çalışan mesafe döngüsünü 0.01 ms altına çekme revizyonunuz...', 4)}
    ${_field('q_dev_s1_2', '1.2. Sunucu Çökmesi ve Bellek Sızıntısı (Memory Leak)', 'RAM yükselişi ve çöküş durumlarında izleyeceğiniz debug prosedürü...', 4)}
    ${_field('q_dev_s1_3', '1.3. Toplu İşlemlerde Veritabanı Kilitlenmesi (Deadlock & Lag Spikes)', '50 oyuncu veritabanı kaydı sırasındaki lag spikelerini önleme mimariniz...', 4)}
    ${_field('q_dev_s2_1', '2.1. Yetkisiz Event Tetikleme (Unprotected Net Event)', 'Inject edilen TriggerServerEvent yetkisiz çağırmalarını engelleme...', 4)}
    ${_field('q_dev_s2_2', '2.2. Envanter ve Eşya Çoğaltma (Dupe Exploit) Analizi', 'Race condition kaynaklı eşya çoğaltma açıklarını kapatma yöntemleri...', 4)}
    ${_field('q_dev_s2_3', '2.3. Hileli Veri Paketleri ve Sanitize İşlemleri', 'NaN, nil veya SQL Injection denemelerini süzgeçten geçirme...', 4)}
    ${_field('q_dev_s3_1', '3.1. Sıfırdan Modüler Sistem Tasarımı', 'Özgün Birlik/Grup Yönetim Sistemi mimari taslağı...', 4)}
    ${_field('q_dev_s3_2', '3.2. Çakışan Script\'leri ve Kütüphaneleri Entegre Etme', 'Çakışan iki farklı sistemi merge etme adımları...', 4)}
    ${_field('q_dev_s4_1', '4.1. Mantıksal Hata Analizi (Örnek Durum)', 'Benzin seviyesinin sıfırlanması gibi hatasız mantık ошибокını debug etme...', 4)}
    ${_field('q_dev_s4_2', '4.2. Dış Servis Kesintileri (API / Discord Webhook Outage)', 'Discord API yavaşlamasında kilitlenmeyi önleyici Try-Catch / Fallback kurgusu...', 4)}
  `;
  const step3 = _step(3, '#34d399', 'BÖLÜM 3 — PRATİK KODLAMA, PROBLEM ÇÖZME VE SENARYO ANALİZLERİ', 'Saha problemleri, performans krizleri ve güvenlik senaryoları.', step3Body, prevBtn(3) + nextBtn(3, '#34d399,#059669'));

  // ═══ BÖLÜM 4 ═══
  const step4Body = `
    <div style="background:rgba(245,158,11,0.06);border-left:3px solid #f59e0b;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölüm, Eko Yıldız ve Eko Creations vizyonuna uyumunuzu, ekip içi iletişim dinamiklerinizi ve çalışma kültürünüzü değerlendirmek üzere hazırlanmıştır.
    </div>
    ${_field('q_dev_v1_1', '1.1. Eko Yıldız Bünyesine Katılma Motivasyonunuz', 'Eko Yıldız projesini tercih etme sebebiniz ve katacağınız fark...', 3)}
    ${_field('q_dev_v1_2', '1.2. Kısa ve Uzun Vadeli Geliştirici Hedefleriniz', 'İlk 1 ay ve 6+ aydaki hedefleriniz...', 3)}
    ${_field('q_dev_v1_3', '1.3. Proje Mimarisine Bakış Açınız ve İnovasyon', 'Ekosistemdeki teknik eksiklikler ve çözüm hedefleriniz...', 3)}
    ${_field('q_dev_v2_1', '2.1. Temiz Kod (Clean Code) ve Okunabilirlik İlkeleri', 'İsimlendirme standartlarınız ve kod okunabilirliği ilkeleriniz...', 3)}
    ${_field('q_dev_v2_2', '2.2. Dokümantasyon ve Bilgi Paylaşımı', 'API/Export dokümantasyon çıkarma süreciniz...', 3)}
    ${_field('q_dev_v2_3', '2.3. Eski/Verimsiz Kodları Yenileme (Refactoring) Yaklaşımınız', 'Eski koda müdahale ve refactoring yaklaşımınız...', 3)}
    ${_field('q_dev_v3_1', '3.1. Yönetim Kurulu ve Üst Merci Talimatlarına Uyum', 'Acil geliştirme taleplerini önceliklendirme tarzınız...', 3)}
    ${_field('q_dev_v3_2', '3.2. Eleştiriye Açıklık ve Kod İncelemesi (Code Review)', 'Kod incelemelerine ve yapıcı eleştirilere yaklaşımınız...', 3)}
    ${_field('q_dev_v3_3', '3.3. Fikir Ayrılıkları ve Çatışma Yönetimi', 'Ekip arkadaşıyla anlaşmazlıkları çözme tarzınız...', 3)}
    ${_field('q_dev_v4_1', '4.1. Gizlilik Sözleşmesi ve Fikri Mülkiyet (NDA & IP Security)', 'Kod ve veri gizliliği konusundaki hassasiyetiniz...', 3)}
    ${_field('q_dev_v4_2', '4.2. Sorumluluk Bilinci ve Teslim Tarihleri (Deadlines)', 'Teslim tarihlerine uyum ve gecikme durumunda iletişiminiz...', 3)}
    ${_field('q_dev_v4_3', '4.3. Topluluk Önündeki Duruş ve Temsil Yeteneği', 'Geliştirici olarak topluluk önündeki temsil bilinciniz...', 3)}
  `;
  const step4 = _step(4, '#f59e0b', 'BÖLÜM 4 — PROJE UYUM STANDARTLARI, VİZYON VE EKİP ÇALIŞMASI', 'Vizyon, okunabilirlik, iletişim ve gizlilik anlayışınız.', step4Body, prevBtn(4) + nextBtn(4, '#f59e0b,#d97706'));

  // ═══ BÖLÜM 5 ═══
  const step5Body = `
    <div style="background:rgba(239,68,68,0.06);border-left:3px solid #ef4444;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölüm, başvuru sürecinin hukuki, disipliner ve idari açıdan bağlayıcı olan son aşamasıdır. Form boyunca beyan ettiğiniz tüm bilgilerin doğruluğunu ve Gizlilik İlkesi (NDA) hükümlerini kabul ettiğinizi beyan ediniz.
    </div>

    <div style="background:rgba(0,0,0,0.3);padding:1.2rem;border-radius:12px;border:1px solid rgba(255,255,255,0.08);margin-bottom:1.2rem;">
      <h4 style="color:#ef4444;margin:0 0 0.6rem 0;font-size:0.95rem;">📜 TAAHHÜTNAME VE NİHAİ ONAYLAR</h4>
      
      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dev_nda_1" required style="margin-top:0.2rem;">
          <span><strong>1.1. Bilgilerin Doğruluğu ve Özgünlük Onayı:</strong> Formda verdiğim tüm bilgilerin eksiksiz, doğru ve şahsıma ait olduğunu; özgün olmayan/yapay zeka ürünü içerik barındırmadığını kabul ediyorum.</span>
        </label>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dev_nda_2" required style="margin-top:0.2rem;">
          <span><strong>1.2. Yanıltıcı Beyan Yaptırımı:</strong> Yanlış veya yanıltıcı bilgi tespiti halinde başvurumun iptal edileceğini ve Eko Creations bünyesinde kara listeye alınacağımı kabul ediyorum.</span>
        </label>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dev_nda_3" required style="margin-top:0.2rem;">
          <span><strong>2.1. Fikri Mülkiyet ve Kod Gizliliği (NDA):</strong> Eko Yıldız bünyesinde geliştirilen tüm script, kod, veritabanı ve dokümanların mülkiyetinin projeye ait olduğunu, izinsiz paylaşmayacağımı taahhüt ederim.</span>
        </label>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.85rem;color:#e2e8f0;">
          <input type="checkbox" id="q_dev_nda_4" required style="margin-top:0.2rem;">
          <span><strong>3.1. Yönetmelik ve Kurallara Uyum:</strong> Kurallar ve Yönetmelik Bilgilendirmesi ile Eko Creations Yönetmeliği protokollerini kabul ederim.</span>
        </label>
      </div>
    </div>

    ${_field('q_dev_sign_name', '4.1. Başvuru Sahibinin Adı Soyadı', 'Tam Ad Soyad...', 1)}
    ${_field('q_dev_sign_signature', '4.3. Onay İmzası (Discord ID / Kullanıcı Adı)', 'Örn: ekonqt / ekonqtx', 1)}
  `;
  const step5 = _step(5, '#ef4444', 'BÖLÜM 5 — TAAHHÜTNAME, YÖNETMELİK ONAYI VE NİHAİ BAŞVURU ONAYI', 'Hukuki, disipliner ve idari taahhütleriniz.', step5Body, prevBtn(5) + `<button type="submit" id="btn-submit-dev" class="btn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:800;padding:0.8rem 2.2rem;border-radius:24px;border:none;cursor:pointer;font-size:1rem;box-shadow:0 4px 15px rgba(16,185,129,0.4);">🚀 Geliştirici Başvurusunu Tamamla ve Gönder</button>`);

  const content = `
    <div style="max-width:860px;margin:2rem auto;animation:fadeUp 0.5s ease;">
      <div style="width:100%;border-radius:20px;overflow:hidden;margin-bottom:1.8rem;box-shadow:0 12px 32px rgba(0,0,0,0.5);">
        <img src="${BANNER}" style="width:100%;display:block;max-height:240px;object-fit:cover;">
      </div>

      <div style="text-align:center;margin-bottom:2rem;">
        <h1 style="font-size:2rem;font-weight:800;color:#fff;margin-bottom:0.5rem;display:flex;align-items:center;justify-content:center;gap:0.6rem;">
          <img src="https://cdn.discordapp.com/emojis/1536405010466742415.png" style="height:32px;width:32px;object-fit:contain;" onerror="this.style.display='none'">
          <span>Geliştirici Ekibi // Geliştirici Ofisi Alım Formu</span>
        </h1>
        <p style="color:var(--muted);font-size:0.95rem;max-width:650px;margin:0 auto;">
          Birincil Alım Formu — Geliştirici Adayı Pozisyonu Ön Değerlendirme Belgesi. Lütfen tüm bölümleri eksiksiz ve özgün yanıtlarla doldurunuz.
        </p>
      </div>

      <form id="dev-form">
        ${step1}
        ${step2}
        ${step3}
        ${step4}
        ${step5}
      </form>
    </div>

    <script>
      function toggleStep(n) {
        const body = document.querySelector('#form-step-' + n + ' .step-body');
        if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
      }
      function nextStep(n) {
        document.getElementById('form-step-' + n).style.display = 'none';
        const next = document.getElementById('form-step-' + (n + 1));
        if (next) { next.style.display = 'block'; window.scrollTo({top: next.offsetTop - 80, behavior: 'smooth'}); }
      }
      function prevStep(n) {
        document.getElementById('form-step-' + n).style.display = 'none';
        const prev = document.getElementById('form-step-' + (n - 1));
        if (prev) { prev.style.display = 'block'; window.scrollTo({top: prev.offsetTop - 80, behavior: 'smooth'}); }
      }

      document.getElementById('dev-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-dev');
        btn.disabled = true; btn.innerHTML = '⏳ Gönderiliyor...';

        const data = {
          discordUsername: document.getElementById('q_discord')?.value || '',
          q_dev_1_1: document.getElementById('q_dev_1_1')?.value || '',
          q_dev_1_2: document.getElementById('q_dev_1_2')?.value || '',
          q_dev_1_4: document.getElementById('q_dev_1_4')?.value || '',
          q_dev_2_1: document.getElementById('q_dev_2_1')?.value || '',
          q_dev_2_2: document.getElementById('q_dev_2_2')?.value || '',
          q_dev_2_3: document.getElementById('q_dev_2_3')?.value || '',
          q_dev_3_1: document.getElementById('q_dev_3_1')?.value || '',
          q_dev_3_2: document.getElementById('q_dev_3_2')?.value || '',
          q_dev_3_3: document.getElementById('q_dev_3_3')?.value || '',
          q_dev_4_1: document.getElementById('q_dev_4_1')?.value || '',
          q_dev_4_2: document.getElementById('q_dev_4_2')?.value || '',
          q_dev_4_3: document.getElementById('q_dev_4_3')?.value || '',
          q_dev_5_1: document.getElementById('q_dev_5_1')?.value || '',
          q_dev_5_2: document.getElementById('q_dev_5_2')?.value || '',
          q_dev_5_3: document.getElementById('q_dev_5_3')?.value || '',
          q_dev_t1_1: document.getElementById('q_dev_t1_1')?.value || '',
          q_dev_t1_2: document.getElementById('q_dev_t1_2')?.value || '',
          q_dev_t1_3: document.getElementById('q_dev_t1_3')?.value || '',
          q_dev_t2_1: document.getElementById('q_dev_t2_1')?.value || '',
          q_dev_t2_2: document.getElementById('q_dev_t2_2')?.value || '',
          q_dev_t2_3: document.getElementById('q_dev_t2_3')?.value || '',
          q_dev_t3_1: document.getElementById('q_dev_t3_1')?.value || '',
          q_dev_t3_2: document.getElementById('q_dev_t3_2')?.value || '',
          q_dev_t3_3: document.getElementById('q_dev_t3_3')?.value || '',
          q_dev_t4_1: document.getElementById('q_dev_t4_1')?.value || '',
          q_dev_t4_2: document.getElementById('q_dev_t4_2')?.value || '',
          q_dev_t4_3: document.getElementById('q_dev_t4_3')?.value || '',
          q_dev_t5_1: document.getElementById('q_dev_t5_1')?.value || '',
          q_dev_t5_2: document.getElementById('q_dev_t5_2')?.value || '',
          q_dev_s1_1: document.getElementById('q_dev_s1_1')?.value || '',
          q_dev_s1_2: document.getElementById('q_dev_s1_2')?.value || '',
          q_dev_s1_3: document.getElementById('q_dev_s1_3')?.value || '',
          q_dev_s2_1: document.getElementById('q_dev_s2_1')?.value || '',
          q_dev_s2_2: document.getElementById('q_dev_s2_2')?.value || '',
          q_dev_s2_3: document.getElementById('q_dev_s2_3')?.value || '',
          q_dev_s3_1: document.getElementById('q_dev_s3_1')?.value || '',
          q_dev_s3_2: document.getElementById('q_dev_s3_2')?.value || '',
          q_dev_s4_1: document.getElementById('q_dev_s4_1')?.value || '',
          q_dev_s4_2: document.getElementById('q_dev_s4_2')?.value || '',
          q_dev_v1_1: document.getElementById('q_dev_v1_1')?.value || '',
          q_dev_v1_2: document.getElementById('q_dev_v1_2')?.value || '',
          q_dev_v1_3: document.getElementById('q_dev_v1_3')?.value || '',
          q_dev_v2_1: document.getElementById('q_dev_v2_1')?.value || '',
          q_dev_v2_2: document.getElementById('q_dev_v2_2')?.value || '',
          q_dev_v2_3: document.getElementById('q_dev_v2_3')?.value || '',
          q_dev_v3_1: document.getElementById('q_dev_v3_1')?.value || '',
          q_dev_v3_2: document.getElementById('q_dev_v3_2')?.value || '',
          q_dev_v3_3: document.getElementById('q_dev_v3_3')?.value || '',
          q_dev_v4_1: document.getElementById('q_dev_v4_1')?.value || '',
          q_dev_v4_2: document.getElementById('q_dev_v4_2')?.value || '',
          q_dev_v4_3: document.getElementById('q_dev_v4_3')?.value || '',
          q_dev_sign_name: document.getElementById('q_dev_sign_name')?.value || '',
          q_dev_sign_signature: document.getElementById('q_dev_sign_signature')?.value || '',
        };

        try {
          const res = await fetch('/api/forms/developer/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const resData = await res.json();
          if (res.ok && resData.success) {
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

  // ═══ BÖLÜM 1 ═══
  const step1Body = `
    <div style="background:rgba(56,189,248,0.06);border-left:3px solid #38bdf8;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölüm, <strong>Hata Ayıklama Ofisi</strong> bünyesinde "Hata Denetçisi" olarak görev alacak adayların temel kimlik, iletişim, zaman yönetimi, oyun/platform birikimi ve genel çalışma disiplinini ayrıntılı bir şekilde analiz etmek amacıyla hazırlanmıştır.
    </div>

    ${_field('q_dbg_email', '1.1. E-posta Adresiniz', 'Resmi iletişim için geçerli e-posta adresiniz...', 1)}
    ${_field('q_dbg_1_2', '1.2. Adınız ve Soyadınız', 'Resmi kayıtlarda yer alan tam adınız ve soyadınız...', 2)}
    ${_field('q_dbg_1_3', '1.3. Yaşınız ve Doğum Tarihiniz (Gün/Ay/Yıl)', 'Örn: 18 / 15.05.2008', 2)}
    ${_field('q_dbg_roblox', '1.4. Roblox Kullanıcı Adınız ve Kullanıcı Kimliğiniz (User ID)', 'Roblox kullanıcı adınız ve ID numaranız...', 2)}
    
    <div class="form-group" style="margin-bottom:1.2rem;">
      <label class="field-label" style="display:block;font-size:0.88rem;font-weight:700;color:#e2e8f0;margin-bottom:0.4rem;">1.5. DISCORD KULLANICI ADINIZ VE USER ID *</label>
      <input type="text" id="q_discord" class="input-field track-field" data-field="discord_username" value="${_esc(usernameStr)}" required placeholder="Örn: ekonqtx / 123456789012345678" style="width:100%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:0.7rem 0.9rem;border-radius:10px;font-size:0.88rem;">
    </div>

    ${_field('q_dbg_2_1', '2.1. Yaşadığınız Şehir ve Çalıştığınız Saat Dilimi (Timezone)', 'Örn: İstanbul / UTC+3', 2)}
    ${_field('q_dbg_2_2', '2.2. Günlük ve Haftalık Aktiflik Süreniz', 'Hafta içi ve hafta sonu ayırabileceğiniz süreler...', 3)}
    ${_field('q_dbg_2_3', '2.3. Acil Durum İletişim Kanallarınız', 'Discord dışındaki alternatif ulaşım kanalınız...', 2)}
    ${_field('q_dbg_2_4', '2.4. Sesli ve Yazılı İletişim Becerileriniz', 'Mikrofon kullanımınız ve sesli iletişim durumunuz...', 2)}
    ${_field('q_dbg_3_1', '3.1. Eğitim Durumunuz veya Mesleki Çalışma Hayatınız', 'Okul/bölüm veya meslek/mesai saatleriniz...', 2)}
    ${_field('q_dbg_3_2', '3.2. Önümüzdeki 6 Aylık Zaman Planlamanız', 'Aktifliğinizi etkileyebilecek durumlar...', 3)}
    ${_field('q_dbg_4_1', '4.1. Kendinizi, Çalışma Disiplininizi ve Analitik Yönünüzü Tanımlayınız', 'Gözlem yeteneğiniz ve test sabrınız...', 3)}
    ${_field('q_dbg_4_2', '4.2. Baskı, Stres ve Yoğun Güncelleme Dönemlerindeki Tutumunuz', 'Yoğun hata arama süreçlerindeki soğukkanlılığınız...', 3)}
    ${_field('q_dbg_4_3', '4.3. Ekip İçi Uyum ve İletişim Anlayışınız', 'Ofis amiri ve geliştiricilerle iletişim üslubunuz...', 3)}
    ${_field('q_dbg_5_1', '5.1. Daha Önce Görev Aldığınız Projeler ve Deneyimleriniz', 'Geçmiş Hata Denetçisi / Tester rolleriniz...', 3)}
    ${_field('q_dbg_5_2', '5.2. Geçmiş Referanslarınız', 'Referans alınabilecek kişilerin adları ve görevleri...', 2)}
    ${_field('q_dbg_5_3', '5.3. Disiplin ve İhlal Geçmişiniz', 'Daha önce aldığınız ceza, uyarı veya kara liste durumları...', 2)}
  `;
  const step1 = _step(1, '#38bdf8', 'BÖLÜM 1 — KİŞİSEL BİLGİLER, İLETİŞİM VE DİSİPLİN DEĞERLENDİRMESİ', 'Temel kimlik, hesap doğrulama ve zaman yönetimi.', step1Body, nextBtn(1, '#38bdf8,#0284c7'));

  // ═══ BÖLÜM 2 ═══
  const step2Body = `
    <div style="background:rgba(167,139,250,0.06);border-left:3px solid #a78bfa;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölüm, "Hata Denetçisi" pozisyonuna başvuran adayların Roblox platformu altyapısına, Eko Yıldız oyun içi sistemlerine ve teknik test metodolojilerine hakimiyetini ölçer.
    </div>
    ${_field('q_dbg_t1_1', '1.1. Roblox Platformu ve Client/Server İşleyiş Deneyiminiz', 'ReplicatedStorage, ServerScriptService ve RemoteEvent mantığı...', 3)}
    ${_field('q_dbg_t1_2', '1.2. Eko Yıldız Oyun İçi Mekanikleri ve Sistem Bilgisi', 'Envanter, garaj, ekonomi vb. hakim olduğunuz sistemler...', 3)}
    ${_field('q_dbg_t1_3', '1.3. UI / UX (Arayüz ve Kullanıcı Deneyimi) Test Deneyimi', 'Çözünürlük, cihaz ölçekleme ve UI kilitlenme testleriniz...', 3)}
    ${_field('q_dbg_t2_1', '2.1. Fonksiyonel Test ve Sınır Değer Analizi (Boundary Value Testing)', 'Eksi değer, 0 girdisi ve spam tıklama test senaryolarınız...', 3)}
    ${_field('q_dbg_t2_2', '2.2. Sıra Dışı Kullanıcı Davranışları (Edge Cases) Tespiti', 'Beklenmedik kullanıcı adımlarını kurgulama ve deneme...', 3)}
    ${_field('q_dbg_t2_3', '2.3. Regresyon Testi (Regression Testing) Yaklaşımınız', 'Düzeltilen hatanın başka sistemleri bozup bozmadığını kontrol etme...', 3)}
    ${_field('q_dbg_t3_1', '3.1. Roblox Developer Console (F9) ve Hata Kayıtları (Logs)', 'Output, Memory, Network sekmelerini okuma ve traceback analizi...', 3)}
    ${_field('q_dbg_t3_2', '3.2. Ağ (Network) ve Ping/Lag Analizi', 'Ping/lag etkisi ile kod hatasını ayırt etme yöntemleriniz...', 3)}
    ${_field('q_dbg_t3_3', '3.3. Test Araçları ve Ekran Kaydı/Görsel Belgeleme', 'Kullandığınız kayıt ve görsel belgeleme yazılımları...', 2)}
    ${_field('q_dbg_t4_1', '4.1. Sunucu ve Veri Güvenliği Açıkları (Exploit / Dupe)', 'Eşya çoğaltma ve yetkisiz erişim açıklarını tespit mantığınız...', 3)}
    ${_field('q_dbg_t4_2', '4.2. Dış Müdahale ve Hile Tespiti Gözlem Yeteneği', '3. parti yazılımlar (Speed, Noclip, Remote Inject) farkındalığınız...', 3)}
  `;
  const step2 = _step(2, '#a78bfa', 'BÖLÜM 2 — OYUN/PLATFORM BİLGİSİ, TEKNİK DENEYİM VE HATA TESPİT YETKİNLİĞİ', 'Roblox altyapısı, test metodolojileri ve F9 konsol hakimiyeti.', step2Body, prevBtn(2) + nextBtn(2, '#a78bfa,#8b5cf6'));

  // ═══ BÖLÜM 3 ═══
  const step3Body = `
    <div style="background:rgba(52,211,153,0.06);border-left:3px solid #34d399;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölüm, teorik bilginizin gerçek test süreçlerinde ve kriz anlarında nasıl pratiğe dönüştüğünü ölçer.
    </div>
    ${_field('q_dbg_s1_1', '1.1. Senaryo 1 - Envanter ve Eşya Çoğaltma (Dupe)', 'Ortak depodan iki oyuncunun aynı anda eşya çekme hatasını doğrulama adımlarınız...', 4)}
    ${_field('q_dbg_s1_2', '1.2. Senaryo 2 - Arayüz (UI) Kilitlenmesi ve Veri Kaybı', 'Market alışverişindeki kilitlenme ve F9 konsol verisi analizi...', 4)}
    ${_field('q_dbg_s1_3', '1.3. Senaryo 3 - Görsel ve Fiziksel Çakışmalar (Clipping & Collision)', 'Harita altına düşme ve çakışma hatalarını belgeleme adımlarınız...', 4)}
    ${_field('q_dbg_s2_1', '2.1. Örnek Hata Raporu Oluşturma (Bug Report)', 'Açıklayıcı Hata Başlığı, Öncelik Seviyesi, Reproduction Steps, Beklenen ve Gerçekleşen Sonuç, Konsol Çıktısı...', 5)}
    ${_field('q_dbg_s3_1', '3.1. Hata Derecelendirme ve Önceliklendirme', 'Dokusu bozuk kıyafet, para sıfırlayan ekonomi açığı ve görevdeki yazım hatasını sıralama ve gerekçeniz...', 4)}
    ${_field('q_dbg_s3_2', '3.2. Acil Durum/Kritik Açık İletişim Prosedürü', 'Kritik açık tespiti sonrasında Ofis Amiri ve Geliştirici Ekibine güvenli bildirim süreci...', 3)}
  `;
  const step3 = _step(3, '#34d399', 'BÖLÜM 3 — PRATİK SENARYOLAR, HATA ANALİZİ VE RAPOR OLUŞTURMA', 'Saha senaryoları, bug raporu şablonu ve önceliklendirme.', step3Body, prevBtn(3) + nextBtn(3, '#34d399,#059669'));

  // ═══ BÖLÜM 4 ═══
  const step4Body = `
    <div style="background:rgba(245,158,11,0.06);border-left:3px solid #f59e0b;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Hata Ayıklama Ofisi içerisindeki çalışma kültürüne, kurum içi hiyerarşiye ve etik ilkelere uyum değerlendirmesi.
    </div>
    ${_field('q_dbg_v1_1', '1.1. Ofis Amiri ve Komite İletişimi', 'Ofis Amiri (endof) ve Regülasyon Komitesi talimatlarına yaklaşımınız...', 3)}
    ${_field('q_dbg_v1_2', '1.2. Geliştirici Ekibi ile İlişkiler ve Üslup', 'Geliştiricilere yapıcı, net ve çözüm odaklı rapor sunma tarzınız...', 3)}
    ${_field('q_dbg_v1_3', '1.3. Görev Sorumluluğu ve Kesintisiz Takip', 'Düzeltilen hatayı tekrar test etme (re-test) takibiniz...', 3)}
    ${_field('q_dbg_v2_1', '2.1. Yetkilerin ve Bilginin Kötüye Kullanımı (Exploit Abuse)', 'Açıkları çıkar için kullanmanın kara liste sebebi olduğunu kabul ve bilinciniz...', 3)}
    ${_field('q_dbg_v2_2', '2.2. Tarafsızlık ve Objektiflik', 'Yakın arkadaşınızın hatayı bildirmemesi durumundaki profesyonel tutumunuz...', 3)}
    ${_field('q_dbg_v2_3', '2.3. Bilgi Gizliliği ve Sızdırma (Leak) Hassasiyeti', 'Henüz yayınlanmamış test güncellemelerinin gizliliği...', 3)}
    ${_field('q_dbg_v3_1', '3.1. Geribildirim ve Eleştiri Toleransı', 'Raporunuz eksik bulunduğundaki revize yaklaşımınız...', 3)}
    ${_field('q_dbg_v3_2', '3.2. Ekip Çalışması ve Fikir Ayrılıkları', 'Başka bir denetçiyle ciddiyet seviyesinde yaşanan anlaşmazlıkları çözme...', 3)}
  `;
  const step4 = _step(4, '#f59e0b', 'BÖLÜM 4 — OFİS HİYERARŞİSİ, EKİP İÇİ İLETİŞİM VE ETİK KURALLAR', 'Hiyerarşi, etik ilkeler, tarafsızlık ve sızdırma hassasiyeti.', step4Body, prevBtn(4) + nextBtn(4, '#f59e0b,#d97706'));

  // ═══ BÖLÜM 5 ═══
  const step5Body = `
    <div style="background:rgba(239,68,68,0.06);border-left:3px solid #ef4444;padding:1rem 1.2rem;border-radius:0 12px 12px 0;font-size:0.88rem;color:var(--muted);line-height:1.7;margin-bottom:1.3rem;">
      Bu bölüm, Hata Ayıklama Ofisi // [A-0] Geçici Personel Alım Formu başvuru sürecinin hukuki, idari ve disipliner bağlayıcı son aşamasıdır.
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
  `;
  const step5 = _step(5, '#ef4444', 'BÖLÜM 5 — TAAHHÜTNAME, YÖNETMELİK ONAYI VE NİHAİ BAŞVURU ONAYI', 'Hukuki, idari ve disipliner taahhütleriniz.', step5Body, prevBtn(5) + `<button type="submit" id="btn-submit-dbg" class="btn" style="background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;font-weight:800;padding:0.8rem 2.2rem;border-radius:24px;border:none;cursor:pointer;font-size:1rem;box-shadow:0 4px 15px rgba(56,189,248,0.4);">🚀 Hata Ayıklama Ofisi Başvurusunu Gönder</button>`);

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
      function toggleStep(n) {
        const body = document.querySelector('#form-step-' + n + ' .step-body');
        if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
      }
      function nextStep(n) {
        document.getElementById('form-step-' + n).style.display = 'none';
        const next = document.getElementById('form-step-' + (n + 1));
        if (next) { next.style.display = 'block'; window.scrollTo({top: next.offsetTop - 80, behavior: 'smooth'}); }
      }
      function prevStep(n) {
        document.getElementById('form-step-' + n).style.display = 'none';
        const prev = document.getElementById('form-step-' + (n - 1));
        if (prev) { prev.style.display = 'block'; window.scrollTo({top: prev.offsetTop - 80, behavior: 'smooth'}); }
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
          q_dbg_2_1: document.getElementById('q_dbg_2_1')?.value || '',
          q_dbg_2_2: document.getElementById('q_dbg_2_2')?.value || '',
          q_dbg_2_3: document.getElementById('q_dbg_2_3')?.value || '',
          q_dbg_2_4: document.getElementById('q_dbg_2_4')?.value || '',
          q_dbg_3_1: document.getElementById('q_dbg_3_1')?.value || '',
          q_dbg_3_2: document.getElementById('q_dbg_3_2')?.value || '',
          q_dbg_4_1: document.getElementById('q_dbg_4_1')?.value || '',
          q_dbg_4_2: document.getElementById('q_dbg_4_2')?.value || '',
          q_dbg_4_3: document.getElementById('q_dbg_4_3')?.value || '',
          q_dbg_5_1: document.getElementById('q_dbg_5_1')?.value || '',
          q_dbg_5_2: document.getElementById('q_dbg_5_2')?.value || '',
          q_dbg_5_3: document.getElementById('q_dbg_5_3')?.value || '',
          q_dbg_t1_1: document.getElementById('q_dbg_t1_1')?.value || '',
          q_dbg_t1_2: document.getElementById('q_dbg_t1_2')?.value || '',
          q_dbg_t1_3: document.getElementById('q_dbg_t1_3')?.value || '',
          q_dbg_t2_1: document.getElementById('q_dbg_t2_1')?.value || '',
          q_dbg_t2_2: document.getElementById('q_dbg_t2_2')?.value || '',
          q_dbg_t2_3: document.getElementById('q_dbg_t2_3')?.value || '',
          q_dbg_t3_1: document.getElementById('q_dbg_t3_1')?.value || '',
          q_dbg_t3_2: document.getElementById('q_dbg_t3_2')?.value || '',
          q_dbg_t3_3: document.getElementById('q_dbg_t3_3')?.value || '',
          q_dbg_t4_1: document.getElementById('q_dbg_t4_1')?.value || '',
          q_dbg_t4_2: document.getElementById('q_dbg_t4_2')?.value || '',
          q_dbg_s1_1: document.getElementById('q_dbg_s1_1')?.value || '',
          q_dbg_s1_2: document.getElementById('q_dbg_s1_2')?.value || '',
          q_dbg_s1_3: document.getElementById('q_dbg_s1_3')?.value || '',
          q_dbg_s2_1: document.getElementById('q_dbg_s2_1')?.value || '',
          q_dbg_s3_1: document.getElementById('q_dbg_s3_1')?.value || '',
          q_dbg_s3_2: document.getElementById('q_dbg_s3_2')?.value || '',
          q_dbg_v1_1: document.getElementById('q_dbg_v1_1')?.value || '',
          q_dbg_v1_2: document.getElementById('q_dbg_v1_2')?.value || '',
          q_dbg_v1_3: document.getElementById('q_dbg_v1_3')?.value || '',
          q_dbg_v2_1: document.getElementById('q_dbg_v2_1')?.value || '',
          q_dbg_v2_2: document.getElementById('q_dbg_v2_2')?.value || '',
          q_dbg_v2_3: document.getElementById('q_dbg_v2_3')?.value || '',
          q_dbg_v3_1: document.getElementById('q_dbg_v3_1')?.value || '',
          q_dbg_v3_2: document.getElementById('q_dbg_v3_2')?.value || '',
          q_dbg_sign_name: document.getElementById('q_dbg_sign_name')?.value || '',
          q_dbg_sign_date: document.getElementById('q_dbg_sign_date')?.value || '',
          q_dbg_sign_signature: document.getElementById('q_dbg_sign_signature')?.value || '',
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

