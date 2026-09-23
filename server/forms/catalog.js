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
    slug: 'event-staff', route: '/forms/event-staff', formType: 'event_staff', section: 'staff', category: 'Başvurular', status: 'open', estimatedMinutes: 12,
    title: 'Etkinlik Ekibi Başvurusu', description: 'Etkinlikleri düzenleyen ve topluluğa rehberlik eden ekibe katıl.',
    sections: [
      { title: 'Temel Bilgiler', fields: [field('discordUsername', 'Discord kullanıcı adın', { maxLength: MAX_SHORT }), field('availability', 'Haftalık uygunluğun', { type: 'textarea', maxLength: MAX_MEDIUM, placeholder: 'Hangi gün ve saatlerde aktifsin?' })] },
      { title: 'Başvuru Bilgileri', fields: [field('motivation', 'Neden etkinlik ekibine katılmak istiyorsun?', { type: 'textarea', maxLength: MAX_LONG }), field('experience', 'İlgili deneyimin', { type: 'textarea', required: false, maxLength: MAX_LONG, description: 'Varsa önceki topluluk veya etkinlik deneyimlerini paylaş.' })] },
    ],
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
