'use strict';

const STAGES = {
  APPLICATION_CREATED: 'APPLICATION_CREATED',
  APPLICATION_RECEIVED: 'APPLICATION_RECEIVED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  TEAM_EVALUATION: 'TEAM_EVALUATION',
  INVITED_TO_INTERVIEW: 'INVITED_TO_INTERVIEW',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEW_COMPLETED: 'INTERVIEW_COMPLETED',
  FINAL_EVALUATION: 'FINAL_EVALUATION',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  // Alternatif durumlar
  INFO_REQUIRED: 'INFO_REQUIRED',
  ON_HOLD: 'ON_HOLD',
  DIFFERENT_ROLE_SUGGESTED: 'DIFFERENT_ROLE_SUGGESTED',
  APPLICATION_CLOSED: 'APPLICATION_CLOSED',
  REJECTED: 'REJECTED',
  WITHDRAWN_BY_CANDIDATE: 'WITHDRAWN_BY_CANDIDATE'
};

const STAGE_METADATA = {
  APPLICATION_CREATED: {
    label: 'Başvuru Oluşturuldu',
    adminLabel: 'Başvuru Oluşturuldu (Taslak/İlk)',
    description: 'Başvuru formu aday tarafından başarıyla oluşturuldu.',
    nextStepText: 'Başvurunuz sistem kontrolünden geçiyor.',
    icon: '📝',
    color: '#818cf8',
    order: 1
  },
  APPLICATION_RECEIVED: {
    label: 'Başvuru Alındı',
    adminLabel: 'Başvuru Alındı',
    description: 'Başvurunuz sistemimize ulaştı. Ekibimiz en kısa sürede ilk incelemeyi gerçekleştirecek.',
    nextStepText: 'Ekibimiz başvurunuzu ön inceleme sırasına aldı.',
    microcopy: 'Başvurunuz insan kaynakları kara deliğine gönderilmedi. Gerçekten incelenecek.',
    icon: '📥',
    color: '#38bdf8',
    order: 2
  },
  UNDER_REVIEW: {
    label: 'Ön İnceleme',
    adminLabel: 'Ön İncelemede',
    description: 'Ekibimiz başvurunuzdaki bilgileri, yanıtları ve profilinizi değerlendiriyor.',
    nextStepText: 'Ön inceleme tamamlandıktan sonra birim değerlendirmesine aktarılacaksınız.',
    microcopy: 'Formu 47 kere yenilemenize gerek yok. Başvurunuzu aldık ve inceliyoruz.',
    icon: '🔍',
    color: '#fbbf24',
    order: 3
  },
  TEAM_EVALUATION: {
    label: 'Ekip Değerlendirmesi',
    adminLabel: 'Ekip Değerlendirmesinde',
    description: 'Başvurunuz ilgili birim yetkilileri ve ekip liderleri tarafından inceleniyor.',
    nextStepText: 'Ekip değerlendirmesi sonucunda mülakat daveti oluşturulabilir.',
    icon: '👥',
    color: '#a78bfa',
    order: 4
  },
  INVITED_TO_INTERVIEW: {
    label: 'Mülakata Davet',
    adminLabel: 'Mülakata Davet Edildi',
    description: 'Tebrikler! Başvurunuz olumlu bulundu ve mülakat aşamasına davet edildiniz.',
    nextStepText: 'Ekibimiz sizinle kısa bir görüşme gerçekleştirmek istiyor. Mülakat ayrıntılarını aşağıdan inceleyebilirsiniz.',
    microcopy: 'Merak etmeyin, kravat zorunlu değil.',
    icon: '✨',
    color: '#34d399',
    order: 5
  },
  INTERVIEW_SCHEDULED: {
    label: 'Mülakat Planlandı',
    adminLabel: 'Mülakat Saati Belirlendi',
    description: 'Görüşme saatiniz kesinleştirildi ve takvime işlendi.',
    nextStepText: 'Görüşme öncesinde aşağıdaki check-in hazırlık adımlarını tamamlayabilirsiniz.',
    icon: '📅',
    color: '#10b981',
    order: 6
  },
  INTERVIEW_COMPLETED: {
    label: 'Mülakat Tamamlandı',
    adminLabel: 'Mülakat Yapıldı',
    description: 'Mülakat görüşmeniz tamamlandı. Ekibimiz notları bir araya getiriyor.',
    nextStepText: 'Nihai değerlendirme sonuçları kısa süre içinde buraya yansıtılacaktır.',
    icon: '🎙️',
    color: '#6366f1',
    order: 7
  },
  FINAL_EVALUATION: {
    label: 'Son Değerlendirme',
    adminLabel: 'Nihai Karar Aşaması',
    description: 'Mülakat performansı ve başvuru dosyası nihai kurul tarafından onaylanıyor.',
    nextStepText: 'Sonuçlar kesinleşmek üzere.',
    icon: '⚖️',
    color: '#8b5cf6',
    order: 8
  },
  OFFER_ACCEPTED: {
    label: 'Teklif / Kabul',
    adminLabel: 'Kabul Edildi (Ekibe Katıldı)',
    description: 'Aramıza hoş geldiniz! EkoYıldız ekibine katılımınız resmen onaylandı.',
    nextStepText: 'Ekip içi yetkilendirme ve onboarding süreci başlatıldı.',
    icon: '🎉',
    color: '#10b981',
    order: 9
  },
  INFO_REQUIRED: {
    label: 'Ek Bilgi Gerekli',
    adminLabel: 'Adaydan Bilgi Bekleniyor',
    description: 'Başvurunuzun değerlendirilebilmesi için ekibimiz sizden ek bilgi rica ediyor.',
    nextStepText: 'Lütfen ekibimizin yönelttiği soruyu yanıtlayın.',
    icon: '💬',
    color: '#f59e0b',
    order: 3
  },
  ON_HOLD: {
    label: 'Beklemeye Alındı',
    adminLabel: 'Havuzda / Beklemede',
    description: 'Başvurunuz gelecekteki kontenjanlar için bekleme havuzuna alındı.',
    nextStepText: 'Yeni kontenjan açıldığında öncelikli olarak değerlendirileceksiniz.',
    icon: '⏸️',
    color: '#94a3b8',
    order: 3
  },
  DIFFERENT_ROLE_SUGGESTED: {
    label: 'Başka Pozisyon Önerildi',
    adminLabel: 'Farklı Pozisyona Yönlendirildi',
    description: 'Profiliniz başvurduğunuz pozisyon yerine alternatif bir birimimiz için daha uygun bulundu.',
    nextStepText: 'Önerilen yeni pozisyon hakkında ekip koordinatörümüz sizinle görüşecektir.',
    icon: '🔄',
    color: '#c084fc',
    order: 4
  },
  APPLICATION_CLOSED: {
    label: 'Başvuru Kapatıldı',
    adminLabel: 'Kapatıldı',
    description: 'Bu başvuru süreci tamamlandı ve arşivlendi.',
    nextStepText: 'Gelecekteki dönemlerde tekrar başvurabilirsiniz.',
    icon: '📁',
    color: '#64748b',
    order: 99
  },
  REJECTED: {
    label: 'Reddedildi',
    adminLabel: 'Reddedildi',
    description: 'Başvurunuz bu dönem için olumsuz sonuçlandı. İlginiz için teşekkür ederiz.',
    nextStepText: 'Kendinizi geliştirerek bir sonraki başvuru döneminde tekrar şansınızı deneyebilirsiniz.',
    icon: '✕',
    color: '#f43f5e',
    order: 99
  },
  WITHDRAWN_BY_CANDIDATE: {
    label: 'Geri Çekildi',
    adminLabel: 'Aday Tarafından Çekildi',
    description: 'Başvuru kendi talebiniz doğrultusunda geri çekilmiştir.',
    nextStepText: 'Süreç sonlandırıldı.',
    icon: '↩️',
    color: '#64748b',
    order: 99
  }
};

/**
 * Generates a clean corporate reference code: EKO-26-XXXXX
 */
function generateApplicationReference(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const yearSuffix = String(d.getFullYear() || 2026).slice(-2);
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `EKO-${yearSuffix}-${rand}`;
}

/**
 * Deterministically derives an EKO reference for legacy records without one
 */
function deriveReferenceFromId(id, date = new Date()) {
  if (!id) return generateApplicationReference(date);
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  const pos = Math.abs(hash) % 90000 + 10000;
  const yearSuffix = String(new Date(date).getFullYear() || 2026).slice(-2);
  return `EKO-${yearSuffix}-${pos}`;
}

/**
 * Generates an Interview Reference: INT-26-XXXX
 */
function generateInterviewId(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const yearSuffix = String(d.getFullYear() || 2026).slice(-2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INT-${yearSuffix}-${rand}`;
}

function getStageInfo(stageKey) {
  const normalized = String(stageKey || '').toUpperCase();
  // Legacy / existing state mapping
  if (normalized === 'SUBMITTED' || normalized === 'PENDING') return STAGE_METADATA.APPLICATION_RECEIVED;
  if (normalized === 'REVIEWING') return STAGE_METADATA.UNDER_REVIEW;
  if (normalized === 'QUESTION_PENDING') return STAGE_METADATA.INFO_REQUIRED;
  if (normalized === 'SCHEDULE_QUESTION' || normalized === 'TIME_APPROVED') return STAGE_METADATA.INTERVIEW_SCHEDULED;
  if (normalized === 'ACCEPTED_WAITING_VERIFY' || normalized === 'APPROVED') return STAGE_METADATA.OFFER_ACCEPTED;
  if (normalized === 'FINISHED') return STAGE_METADATA.INTERVIEW_COMPLETED;

  return STAGE_METADATA[normalized] || STAGE_METADATA.APPLICATION_RECEIVED;
}

const ORDERED_MAIN_STAGES = [
  'APPLICATION_CREATED',
  'APPLICATION_RECEIVED',
  'UNDER_REVIEW',
  'TEAM_EVALUATION',
  'INVITED_TO_INTERVIEW',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'FINAL_EVALUATION',
  'OFFER_ACCEPTED'
];

module.exports = {
  STAGES,
  STAGE_METADATA,
  ORDERED_MAIN_STAGES,
  generateApplicationReference,
  deriveReferenceFromId,
  generateInterviewId,
  getStageInfo
};
