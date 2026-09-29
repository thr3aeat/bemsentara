'use strict';

const MAX_SHORT = 160;
const MAX_MEDIUM = 500;
const MAX_LONG = 4000;

function field(name, label, options = {}) {
  return {
    name,
    label,
    type: 'text',
    required: true,
    maxLength: MAX_MEDIUM,
    placeholder: '',
    description: '',
    ...options,
  };
}

const FORM_CATALOG = Object.freeze([
  {
    slug: 'moderator',
    route: '/forms/moderator',
    formType: 'moderator',
    section: 'staff',
    category: 'Yetkili Kadrosu',
    status: 'open',
    estimatedMinutes: 8,
    isWizard: true,
    title: 'Topluluk Moderatör Başvurusu',
    description: 'EkoYıldız Discord ve oyun topluluğunda adaleti, düzeni ve huzuru sağlayacak kadroya katılın.',
    sections: [
      {
        step: 1,
        stepTitle: 'Hakkında',
        title: '1. Temel Bilgiler',
        description: 'Sizi daha yakından tanıyabilmemiz için temel iletişim ve aktiflik bilgilerinizi giriniz.',
        fields: [
          field('username', 'Adınız veya Kullanıcı Adınız', { maxLength: MAX_SHORT, placeholder: 'Örn. Alp' }),
          field('discordUsername', 'Discord Kullanıcı Adınız (veya Etiketiniz)', { maxLength: MAX_SHORT, placeholder: 'Örn. kullanici_adi (veya ID)' }),
          field('ageRange', 'Yaşınız veya Yaş Aralığınız', { type: 'select', options: ['13–15', '16–17', '18–20', '21+'] }),
          field('timezone', 'Bulunduğunuz Şehir / Saat Dilimi', { maxLength: MAX_SHORT, placeholder: 'Örn. İstanbul / GMT+3' }),
          field('availability', 'Günlük ve Haftalık Aktiflik Süreniz', { type: 'textarea', maxLength: MAX_MEDIUM, placeholder: 'Günde ortalama kaç saat Discord ve toplulukta aktif olabilirsiniz? Hangi saatler arası müsaitsiniz?' })
        ]
      },
      {
        step: 2,
        stepTitle: 'Deneyim',
        title: '2. Moderasyon ve Topluluk Deneyimi',
        description: 'Daha önceki tecrübelerinizi, üstlendiğiniz rolleri ve yetkinliklerinizi paylaşınız.',
        fields: [
          field('pastExperience', 'Daha önce bir sunucuda veya oyunda moderasyon yaptınız mı?', { type: 'select', options: ['Evet, birden fazla toplulukta aktif görev aldım', 'Evet, küçük bir sunucuda deneyimim var', 'Hayır, ancak kurallara ve sisteme çok hakimim'] }),
          field('previousCommunities', 'Hangi topluluklarda görev aldınız ve ne kadar süre kaldınız?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Örn. X sunucusu (Moderatör - 6 ay), Y sunucusu (Destek Ekibi - 3 ay)...' }),
          field('responsibilities', 'Önceki görevlerinizde hangi sorumlulukları üstlendiniz?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Chat düzeni, bilet yanıtlama, etkinlik denetimi, ses odaları moderasyonu vb.' }),
          field('toolsExperience', 'Moderasyon araçları ve bot komutlarıyla deneyiminiz var mı?', { type: 'textarea', maxLength: MAX_MEDIUM, placeholder: 'Kullandığınız moderasyon botları, audit log okuma, ceza geçmişi yönetimi tecrübeleriniz...' })
        ]
      },
      {
        step: 3,
        stepTitle: 'Senaryolar',
        title: '3. Kriz Yönetimi ve Senaryo Soruları',
        description: 'Topluluk içinde karşılaşabileceğiniz durumlara karşı reflekslerinizi ve adalet anlayışınızı değerlendiriyoruz.',
        fields: [
          field('scenarioDispute', 'Senaryo 1: İki kullanıcı genel sohbette sert bir tartışmaya girdi. İlk müdahaleniz ve adım adım izleyeceğiniz yol nedir?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Sohbeti nasıl sakinleştirirsiniz? Hangi aşamada uyarı veya susturma uygularsınız?' }),
          field('scenarioFriendViolation', 'Senaryo 2: Çok yakın bir arkadaşınızın sunucu kurallarını ihlal ettiğini gördünüz. Nasıl hareket edersiniz?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Arkadaşlık ilişkisi ile yetkili sorumluluğu arasındaki dengeyi nasıl sağlarsınız?' }),
          field('scenarioStaffAbuse', 'Senaryo 3: Bir başka yetkilinin yetkisini haksız yere (abuse) kullandığından şüphelendiniz. Ne yaparsınız?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Doğrudan tartışmaya mı girersiniz yoksa kanıt toplayıp üst yönetime mi iletirsiniz?' }),
          field('scenarioDmInsult', 'Senaryo 4: Ceza uyguladığınız bir kullanıcı size özelden (DM) hakaret veya tehdit etti. Tepkiniz ne olur?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Kişisel polemiğe girer misiniz? İşlemi nasıl belgelersiniz?' }),
          field('scenarioUncertainty', 'Senaryo 5: Kurallarda tam karşılığı yazmayan, emin olamadığınız belirsiz bir durumla karşılaştınız. Nasıl ilerlersiniz?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Kendi inisiyatifinizle mi karar verirsiniz yoksa ekibe danışır mısınız?' })
        ]
      },
      {
        step: 4,
        stepTitle: 'Motivasyon & Onay',
        title: '4. Motivasyon, Ekip Uyumu ve Taahhütler',
        description: 'Ekibe katılım amacınızı belirtiniz ve yetkili taahhütlerini onaylayınız.',
        fields: [
          field('motivation', 'Neden EkoYıldız kadrosuna katılmak istiyorsunuz?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Topluluğa ve ekibe katmak istediğiniz değer...' }),
          field('strengthsAndWeaknesses', 'Güçlü bulduğunuz yönleriniz ve geliştirmek istediğiniz alanlar nelerdir?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Örn. Sabırlıyım, hızlı iletişim kurarım. Geliştirmek istediğim alan: Kriz anlarında daha soğukkanlı olmak...' }),
          field('whyYou', 'Diğer adaylar arasından neden sizi değerlendirmeliyiz?', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Sizi öne çıkaran en belirgin özelliğiniz nedir?' }),
          field('commitmentRules', 'EkoYıldız kurallarını ve moderatör ilkelerini okudunuz mu, yetkiyi asla kişisel çıkar için kullanmayacağınızı taahhüt ediyor musunuz?', { type: 'select', options: ['Evet, kuralları okudum, anladım ve tarafsızlık taahhüdünü kabul ediyorum'] }),
          field('commitmentPrivacy', 'Yetkili kanallarındaki bilgi, konuşma ve kullanıcı verilerinin gizliliğini koruyacağınızı onaylıyor musunuz?', { type: 'select', options: ['Evet, gizlilik ilkelerine kayıtsız şartsız uyacağımı onaylıyorum'] })
        ]
      }
    ]
  },
  {
    slug: 'event-staff', route: '/forms/event-staff', formType: 'event_staff', section: 'staff', category: 'Başvurular', status: 'open', estimatedMinutes: 12,
    title: 'Etkinlik Ekibi Başvurusu', description: 'Etkinlikleri düzenleyen ve topluluğa rehberlik eden ekibe katıl.',
    sections: [
      { title: 'Temel Bilgiler', fields: [field('discordUsername', 'Discord kullanıcı adın', { maxLength: MAX_SHORT }), field('availability', 'Haftalık uygunluğun', { type: 'textarea', maxLength: MAX_MEDIUM, placeholder: 'Hangi gün ve saatlerde aktifsin?' })] },
      { title: 'Başvuru Bilgileri', fields: [field('motivation', 'Neden etkinlik ekibine katılmak istiyorsun?', { type: 'textarea', maxLength: MAX_LONG }), field('experience', 'İlgili deneyimin', { type: 'textarea', required: false, maxLength: MAX_LONG, description: 'Varsa önceki topluluk veya etkinlik deneyimlerini paylaş.' })] },
    ]
  },
  {
    slug: 'community-ambassador', route: '/forms/community-ambassador', formType: 'community_ambassador', section: 'staff', category: 'Başvurular', status: 'open', estimatedMinutes: 15,
    title: 'Topluluk Elçisi Başvurusu', description: 'EkoYıldız topluluğunu güvenle temsil etmek için başvur.',
    sections: [
      { title: 'Temel Bilgiler', fields: [field('discordUsername', 'Discord kullanıcı adın', { maxLength: MAX_SHORT }), field('ageRange', 'Yaş aralığın', { type: 'select', options: ['13–15', '16–17', '18+'] })] },
      { title: 'Temsil Deneyimi', fields: [field('motivation', 'Neden topluluk elçisi olmak istiyorsun?', { type: 'textarea', maxLength: MAX_LONG }), field('communityExperience', 'Topluluk deneyimin', { type: 'textarea', maxLength: MAX_LONG })] },
    ],
  },
  {
    slug: 'developer', route: '/forms/developer', formType: 'developer', section: 'staff', category: 'Başvurular', status: 'open', estimatedMinutes: 12,
    title: 'Geliştirici Ekibi Başvurusu', description: 'Ürün ve topluluk deneyimini geliştiren ekibe katıl.',
    sections: [
      { title: 'Temel Bilgiler', fields: [field('discordUsername', 'Discord kullanıcı adın', { maxLength: MAX_SHORT }), field('primarySkill', 'Ana uzmanlık alanın', { maxLength: MAX_SHORT, placeholder: 'Örn. Node.js, Roblox Studio, tasarım' })] },
      { title: 'Deneyim', fields: [field('portfolioUrl', 'Portföy veya örnek çalışma bağlantın', { type: 'url', required: false, maxLength: MAX_MEDIUM }), field('experience', 'Deneyimini anlat', { type: 'textarea', maxLength: MAX_LONG })] },
    ],
  },
  {
    slug: 'debug-office', route: '/forms/debug-office', formType: 'debug_office', section: 'staff', category: 'Başvurular', status: 'open', estimatedMinutes: 10,
    title: 'Hata Ayıklama Ofisi Başvurusu', description: 'Sorunları sistematik biçimde araştıran ekibe katıl.',
    sections: [
      { title: 'Temel Bilgiler', fields: [field('discordUsername', 'Discord kullanıcı adın', { maxLength: MAX_SHORT }), field('availability', 'Haftalık uygunluğun', { type: 'textarea', maxLength: MAX_MEDIUM })] },
      { title: 'Yaklaşımın', fields: [field('debuggingExperience', 'Bir hatayı nasıl araştırırsın?', { type: 'textarea', maxLength: MAX_LONG }), field('example', 'Çözdüğün bir soruna örnek ver', { type: 'textarea', required: false, maxLength: MAX_LONG })] },
    ],
  },
  {
    slug: 'game-moderation', route: '/forms/game-moderation', formType: 'game_moderation', section: 'staff', category: 'Başvurular', status: 'maintenance', estimatedMinutes: 10,
    title: 'Oyun Moderasyon Ekibi Başvurusu', description: 'Başvurular geçici olarak kapalı.', sections: [],
  },
  {
    slug: 'contact', route: '/forms/contact', formType: 'contact', section: 'other', category: 'Topluluk', status: 'open', estimatedMinutes: 3,
    title: 'Genel İletişim', description: 'Bir soru, öneri veya talebini doğrudan ekibimize ilet.',
    sections: [{ title: 'Mesajın', fields: [field('subject', 'Konu', { maxLength: MAX_SHORT, placeholder: 'Mesajınla ilgili kısa bir başlık' }), field('message', 'Mesajın', { type: 'textarea', maxLength: MAX_LONG, placeholder: 'Bize iletmek istediğin konuyu açıkça anlat.' }), field('replyPreference', 'Geri dönüş tercihin', { type: 'select', options: ['Discord', 'E-posta', 'Fark etmez'] })] }],
  },
  {
    slug: 'content-proposal', route: '/forms/content-proposal', formType: 'content_proposal', section: 'other', category: 'İçerik', status: 'open', estimatedMinutes: 4,
    title: 'İçerik / Video Önerisi', description: 'Toplulukla paylaşılmasını istediğin bir içerik veya video öner.',
    sections: [{ title: 'Önerin', fields: [field('title', 'Öneri başlığı', { maxLength: MAX_SHORT }), field('url', 'İlgili bağlantı', { type: 'url', required: false, maxLength: MAX_MEDIUM }), field('rationale', 'Neden uygun olduğunu düşünüyorsun?', { type: 'textarea', maxLength: MAX_LONG })] }],
  },
  {
    slug: 'bug-report', route: '/forms/bug-report', formType: 'bug_report', section: 'other', category: 'Destek', status: 'open', estimatedMinutes: 5,
    title: 'Hata Bildirimi', description: 'Karşılaştığın bir sorunu adım adım paylaş; çözüm sürecini hızlandıralım.',
    sections: [{ title: 'Hata Ayrıntıları', fields: [field('summary', 'Kısa özet', { maxLength: MAX_SHORT }), field('steps', 'Yeniden üretim adımları', { type: 'textarea', maxLength: MAX_LONG, placeholder: '1. … 2. … 3. …' }), field('expected', 'Beklenen sonuç', { type: 'textarea', maxLength: MAX_MEDIUM }), field('actual', 'Gerçekte ne oldu?', { type: 'textarea', maxLength: MAX_MEDIUM }), field('evidenceUrl', 'Ekran görüntüsü veya video bağlantısı', { type: 'url', required: false, maxLength: MAX_MEDIUM })] }],
  },
  {
    slug: 'partnership', route: '/forms/partnership', formType: 'partnership', section: 'other', category: 'Partnerlik', status: 'open', estimatedMinutes: 6,
    title: 'Partnerlik / İş Birliği', description: 'Markan, topluluğun veya projen için iş birliği önerisi gönder.',
    sections: [{ title: 'İş Birliği Bilgileri', fields: [field('organization', 'Kurum, kanal veya proje adı', { maxLength: MAX_SHORT }), field('contactName', 'İletişim kişisi', { maxLength: MAX_SHORT }), field('audience', 'Hedef kitlen ve erişimin', { type: 'textarea', maxLength: MAX_MEDIUM }), field('proposal', 'İş birliği teklifin', { type: 'textarea', maxLength: MAX_LONG })] }],
  },
  {
    slug: 'security-report', route: '/forms/security-report', formType: 'security_report', section: 'other', category: 'Güvenlik', status: 'open', estimatedMinutes: 5,
    title: 'Güvenlik Bildirimi', description: 'Güvenlik riski gördüğünde ayrıntıları sorumlu biçimde paylaş.',
    sections: [{ title: 'Güvenlik Ayrıntıları', fields: [field('summary', 'Kısa özet', { maxLength: MAX_SHORT }), field('affectedArea', 'Etkilenen alan', { maxLength: MAX_SHORT, placeholder: 'Örn. profil, giriş, API' }), field('reproductionOrEvidence', 'Yeniden üretim adımları veya kanıt', { type: 'textarea', maxLength: MAX_LONG, description: 'Parola, erişim anahtarı veya kişisel gizli bilgi paylaşma.' }), field('replyPreference', 'Geri dönüş tercihin', { type: 'select', options: ['Discord', 'E-posta', 'Fark etmez'] })] }],
  },
]);

function getFormDefinition(slug) {
  return FORM_CATALOG.find((definition) => definition.slug === slug) || null;
}

function getOpenForms() {
  return FORM_CATALOG.filter((definition) => definition.status === 'open');
}

function getFields(definition) {
  return (definition?.sections || []).flatMap((section) => section.fields || []);
}

function isSafeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function validateFormPayload(definition, payload = {}) {
  const values = {};
  const errors = {};

  for (const definitionField of getFields(definition)) {
    const rawValue = payload[definitionField.name];
    const value = definitionField.type === 'checkbox' ? Boolean(rawValue) : String(rawValue ?? '').trim();
    values[definitionField.name] = value;

    if (definitionField.required && (definitionField.type === 'checkbox' ? !value : !value)) {
      errors[definitionField.name] = 'Bu alanı doldurman gerekiyor.';
      continue;
    }

    if (!value) continue;

    if (definitionField.maxLength && String(value).length > definitionField.maxLength) {
      errors[definitionField.name] = `Bu alan en fazla ${definitionField.maxLength} karakter olabilir.`;
      continue;
    }

    if (definitionField.type === 'url' && !isSafeHttpUrl(value)) {
      errors[definitionField.name] = 'Geçerli bir bağlantı girmen gerekiyor.';
      continue;
    }

    if (definitionField.type === 'select' && !definitionField.options.includes(value)) {
      errors[definitionField.name] = 'Listeden geçerli bir seçenek seçmen gerekiyor.';
    }
  }

  return { valid: Object.keys(errors).length === 0, values, errors };
}

module.exports = {
  FORM_CATALOG,
  getFormDefinition,
  getOpenForms,
  getFields,
  validateFormPayload,
};
