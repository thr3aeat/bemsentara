function renderEventStaffFormPage(currentUser, existingSubmission = null) {
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
    <div class="form-group" style="margin-bottom:0;">
      <label class="field-label">DISCORD HESABI *<br><span style="font-weight:400;font-size:0.78rem;color:var(--muted);">Discord hesabınızın kullanıcı adı nedir? Eğer herhangi bir etiket (tag) özelliğine sahipseniz "İSİM#(etiket)" şeklinde yazın.</span></label>
      <input type="text" id="q_discord" class="input-field track-field" data-field="discord_username" value="${_esc(usernameStr)}" required placeholder="Örn: ekonqtx">
      <div class="field-hint" id="hint-q_discord" style="font-size:0.72rem;color:var(--muted);margin-top:0.3rem;min-height:16px;"></div>
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

      ${!isLoggedIn ? `
        <div class="card" style="background:rgba(251,113,133,0.1);border:1px solid rgba(251,113,133,0.3);border-radius:20px;padding:2.5rem;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">🔒</div>
          <h2 style="font-size:1.6rem;font-weight:800;color:#fff;margin-bottom:0.6rem;">Başvuru Yapabilmek İçin Giriş Yapmalısınız</h2>
          <p style="color:var(--muted);max-width:600px;margin:0 auto 1.5rem;line-height:1.6;">Bu formu doldurabilmek için Discord hesabınızla giriş yapmanız gerekmektedir.</p>
          <a href="/login?redirect=/forms/event-staff" class="btn" style="background:linear-gradient(135deg,#f43f5e,#e11d48);color:#fff;font-weight:800;padding:0.8rem 2rem;border-radius:30px;font-size:1.05rem;display:inline-block;box-shadow:0 6px 20px rgba(244,63,94,0.4);">🔑 Discord ile Giriş Yap / Kayıt Ol</a>
        </div>
      ` : existingSubmission ? `
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
