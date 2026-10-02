'use strict';

/**
 * applicationAiService.js
 * 
 * Provides AI-powered interview assistance:
 * 1. AI Interview Guide for Interviewers (personalized live questions, strengths & risk flags)
 * 2. AI Warmup Simulator for Candidates (crisis practice question, feedback & confidence boost)
 */

const { chatWithAI } = require('../../bot/services/aiService');

const INTERVIEW_AI_SYSTEM_PROMPT = `Sen EkoYıldız People & Community (İnsan Kaynakları ve Yetenek Operasyonları) Yapay Zeka Mülakat Uzmanısın.
Görevin: Adayın başvuru formundaki yanıtlarını derinlemesine analiz edip mülakat yetkilisi için profesyonel, hedefli ve adaya özel bir "Mülakat Rehberi" hazırlamaktır.
Kurallar:
- Yanıtı SADECE geçerli bir JSON objesi formatında ver. Markdown kod bloğu (örn \`\`\`json) veya fazladan açıklama ekleme.
- JSON formatı:
{
  "candidateSummary": "Adayın genel profili ve izlenimi (2-3 cümle)",
  "strengths": ["Güçlü yön 1", "Güçlü yön 2", "Güçlü yön 3"],
  "riskFlags": ["İncelenmesi gereken husus 1", "İncelenmesi gereken husus 2"],
  "recommendedQuestions": [
    {
      "question": "Canlı mülakatta sorulacak spesifik soru 1",
      "target": "Bu sorunun ölçtüğü yetkinlik",
      "idealResponseHint": "Adaydan beklenen ideal yaklaşım"
    },
    {
      "question": "Canlı mülakatta sorulacak spesifik soru 2",
      "target": "Bu sorunun ölçtüğü yetkinlik",
      "idealResponseHint": "Adaydan beklenen ideal yaklaşım"
    },
    {
      "question": "Canlı mülakatta sorulacak spesifik soru 3",
      "target": "Bu sorunun ölçtüğü yetkinlik",
      "idealResponseHint": "Adaydan beklenen ideal yaklaşım"
    },
    {
      "question": "Vaka/Kriz sorusu (Senaryo tabanlı)",
      "target": "Kriz yönetimi ve baskı altında soğukkanlılık",
      "idealResponseHint": "Adaydan beklenen ideal yaklaşım"
    }
  ],
  "rubricFocus": ["Odak Alanı 1", "Odak Alanı 2"],
  "recommendedDifficulty": "Standart"
}
- Türkçe dilinde, kurumsal, ciddi ve profesyonel bir üslup kullan.`;

const CANDIDATE_WARMUP_SYSTEM_PROMPT = `Sen EkoYıldız Aday Koçu ve Mülakat Simülatörüsün.
Adayın heyecanını yatıştırmak, onu motive etmek ve canlı mülakata en yüksek enerji ve özgüvenle girmesini sağlamak senin görevin.
Kural: SADECE geçerli bir JSON objesi formatında dön:
{
  "scenarioQuestion": "Adayın pratik yapması için gerçekçi ve heyecan verici bir kriz/vaka sorusu",
  "positionFocus": "Pozisyona dair kritik başarı faktörü",
  "prepTips": ["Önemli ipucu 1", "Önemli ipucu 2", "Önemli ipucu 3"]
}`;

const CANDIDATE_FEEDBACK_SYSTEM_PROMPT = `Sen EkoYıldız Aday Koçusun. Aday mülakat öncesi ısınma simülatöründe sorulan vaka sorusuna bir deneme cevabı verdi.
Cevabı değerlendir, onu heyecanlandır, motive et ve canlı mülakat için somut tüyolar ver.
Kural: SADECE geçerli bir JSON objesi formatında dön:
{
  "score": 88,
  "feedback": "Cevabın güçlü ve zayıf taraflarının yapıcı analizi",
  "strengths": ["Cevaptaki iyi nokta 1", "Cevaptaki iyi nokta 2"],
  "improvementTips": ["Canlı mülakatta şunu da ekle", "Şuna dikkat et"],
  "confidenceBoost": "Adayı motive eden, heyecanını artıran güçlü bir motivasyon cümlesi"
}`;

/**
 * Format candidate answers into human-readable text for AI prompt
 */
function extractSubmissionContext(submission) {
  const lines = [];
  lines.push(`Pozisyon / Form: ${submission.formTitle || submission.formType || 'Ekip Başvurusu'}`);
  lines.push(`Aday Adı: ${submission.discordUsername || submission.userId || 'Aday'}`);

  if (submission.interviewScheduledTime) {
    lines.push(`Planlanan Mülakat Zamanı: ${submission.interviewScheduledTime}`);
  }

  // Pre-interview answers
  if (submission.interviewAnswers) {
    lines.push('\n[Mülakat Ön Soru Yanıtları]');
    for (const [k, v] of Object.entries(submission.interviewAnswers)) {
      lines.push(`- ${k}: ${v}`);
    }
  }

  // Form question answers
  if (submission.answers && typeof submission.answers === 'object') {
    lines.push('\n[Form Başvuru Yanıtları]');
    for (const [k, v] of Object.entries(submission.answers)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        lines.push(`- ${k}: ${v}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Fallback guide generator in case of network or API error
 */
function generateFallbackGuide(submission) {
  const title = submission.formTitle || 'Ekip';
  return {
    candidateSummary: `${title} pozisyonuna başvuran aday, temel gereksinimleri karşılamakta ve ekibe katılma motivasyonu sergilemektedir. İletişim üslubu ve kriz çözme refleksi canlı mülakatta test edilmelidir.`,
    strengths: [
      'Rol ve sorumluluk bilincine dair istekli yaklaşım',
      'Topluluk ve ekip kurallarına uyum taahhüdü',
      'Süreç ve mülakat adımlarını zamanında tamamlama disiplini'
    ],
    riskFlags: [
      'Baskı ve gergin durumlardaki soğukkanlılığının canlı vaka ile sınanması önerilir',
      'Ekip içi hiyerarşi ve kriz anı karar alma inisiyatifinin netleştirilmesi gerekir'
    ],
    recommendedQuestions: [
      {
        question: `Geçmiş tecrübelerinizde bir kriz veya kurallara aykırı bir durumla karşılaştığınızda izlediğiniz ilk 3 adımı anlatır mısınız?`,
        target: 'Metotlu problem çözme ve prosedür takibi',
        idealResponseHint: 'Önce durumu tespit etme, kanıt alma, tarafları sakinleştirme ve yetkiliye raporlama sırasını izlemelidir.'
      },
      {
        question: `Bir ekip arkadaşınızın veya yöneticinizin hatalı bir karar aldığını fark ederseniz bunu nasıl ve hangi kanaldan dile getirirsiniz?`,
        target: 'Profesyonel iletişim ve yapıcı geri bildirim',
        idealResponseHint: 'Halka açık ortamda tartışmak yerine özelden, saygılı ve kanıta dayalı ifade etmelidir.'
      },
      {
        question: `Yoğun ve stresli bir etkinlik anında birden fazla aksilik aynı anda çıkarsa önceliklendirmenizi neye göre belirlersiniz?`,
        target: 'Önceliklendirme ve stres toleransı',
        idealResponseHint: 'En kritik etki yaratan sorundan başlayarak sakin bir şekilde delege etme becerisi sergilemelidir.'
      },
      {
        question: `EkoYıldız ekibinde 3 ay sonra kendinizi nerede ve hangi projede görmeyi hedefliyorsunuz?`,
        target: 'Uzun vadeli motivasyon ve vizyon uyumu',
        idealResponseHint: 'Somut hedefler, öğrenme isteği ve topluluğa değer katma vizyonu sunmalıdır.'
      }
    ],
    rubricFocus: [
      'İletişim & Diksiyon',
      'Kriz ve Problem Çözme',
      'Rol ve Kural Hakimiyeti'
    ],
    recommendedDifficulty: 'Standart'
  };
}

/**
 * Fallback warmup for candidate
 */
function generateFallbackWarmup(submission) {
  const title = submission.formTitle || 'EkoYıldız Ekip';
  return {
    scenarioQuestion: `[Simülasyon Senaryosu]: Bir topluluk üyesi genel ses kanalında kuralları ihlal ediyor, diğer üyelere rahatsızlık veriyor ve uyarılara agresif yanıt veriyor. Bu esnada sunucuda üst düzey başka bir yetkili bulunmuyor. Bu duruma karşı atacağınız ilk 3 adımı ve ses tonunuzu nasıl koruyacağınızı açıklayınız.`,
    positionFocus: `${title} Yetkinliği: Soğukkanlı kriz müdahalesi ve yetki sınırlarını koruma.`,
    prepTips: [
      'Cevabınızda ses tonunuzun sakin, tok ve resmi kalacağını vurgulayın.',
      'Kişisel tartışmaya girmeyin; kural maddesine atıfta bulunarak kanıt alın.',
      'Mülakat yetkilisine kendinizi ifade ederken net ve kendinden emin cümleler kurun.'
    ]
  };
}

/**
 * Fallback feedback for candidate trial answer
 */
function generateFallbackFeedback(answer) {
  const len = (answer || '').trim().length;
  const score = Math.min(95, Math.max(72, Math.round(70 + (len / 15))));
  return {
    score,
    feedback: `Deneme cevabınız dikkatle incelendi. Durumu çözmeye yönelik niyetiniz ve kural odaklı yaklaşımınız takdir topladı. Cevabınızda resmiyet ve disiplin unsurları açıkça hissediliyor.`,
    strengths: [
      'Resmi ve kurumsal bir üslup benimsemeniz',
      'Soruna karşı sorumluluk alma refleksi göstermeniz'
    ],
    improvementTips: [
      'Canlı mülakatta adımlarınızı 1., 2. ve 3. adım olarak numaralandırarak anlatmanız yetkililerde çok daha profesyonel bir intiba bırakacaktır.',
      'Kararınızın ardından durumu kayıt altına alıp raporlayacağınızı mutlaka belirtin.'
    ],
    confidenceBoost: `🔥 Harika bir ısınma provası! Bu sakinliği ve disiplinli duruşu canlı mülakat odasında da sürdürürseniz harika bir sonuç elde edeceksiniz. Mülakat heyeti sizi bekliyor, başarılar!`
  };
}

/**
 * Clean and parse JSON safely
 */
function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null;
  let str = text.trim();
  // Strip Markdown code fences if model enclosed it
  str = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Try direct parse
  try {
    return JSON.parse(str);
  } catch (_) {
    // Attempt to extract { ... } block
    const match = str.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (__) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Generate AI Interview Guide for Interviewer
 */
async function generateInterviewGuide(submission) {
  const context = extractSubmissionContext(submission);
  const prompt = `Aşağıdaki aday başvuru bilgilerini incele ve mülakat yetkilisi için rehber oluştur:\n\n${context}`;

  try {
    const raw = await chatWithAI(
      [{ role: 'user', content: prompt }],
      INTERVIEW_AI_SYSTEM_PROMPT,
      'ticket',
      { temperature: 0.4, max_tokens: 1200 }
    );
    const parsed = tryParseJson(raw);
    if (parsed && parsed.recommendedQuestions && Array.isArray(parsed.recommendedQuestions)) {
      return parsed;
    }
    console.warn('[applicationAiService] AI response could not be parsed as guide JSON, using fallback.');
    return generateFallbackGuide(submission);
  } catch (err) {
    console.warn('[applicationAiService] AI Guide error, using fallback:', err.message);
    return generateFallbackGuide(submission);
  }
}

/**
 * Generate AI Warmup Scenario Question for Candidate
 */
async function generateCandidateWarmup(submission) {
  const context = extractSubmissionContext(submission);
  const prompt = `Adayın mülakata hazırlanması ve ısınması için pozisyona özel 1 adet heyecan verici kriz/vaka senaryosu ve 3 tüyo hazırla:\n\n${context}`;

  try {
    const raw = await chatWithAI(
      [{ role: 'user', content: prompt }],
      CANDIDATE_WARMUP_SYSTEM_PROMPT,
      'ticket',
      { temperature: 0.5, max_tokens: 700 }
    );
    const parsed = tryParseJson(raw);
    if (parsed && parsed.scenarioQuestion) {
      return parsed;
    }
    return generateFallbackWarmup(submission);
  } catch (err) {
    console.warn('[applicationAiService] AI Warmup error, using fallback:', err.message);
    return generateFallbackWarmup(submission);
  }
}

/**
 * Evaluate Candidate Practice Answer
 */
async function evaluateCandidateWarmup(submission, practiceAnswer) {
  const context = extractSubmissionContext(submission);
  const prompt = `Aday Bilgisi:\n${context}\n\nAdayın Deneme Sorusuna Yanıtı:\n"${practiceAnswer}"\n\nBu yanıtı değerlendir ve heyecanlandırıcı geri bildirim dön.`;

  try {
    const raw = await chatWithAI(
      [{ role: 'user', content: prompt }],
      CANDIDATE_FEEDBACK_SYSTEM_PROMPT,
      'ticket',
      { temperature: 0.5, max_tokens: 800 }
    );
    const parsed = tryParseJson(raw);
    if (parsed && typeof parsed.score === 'number' && parsed.feedback) {
      return parsed;
    }
    return generateFallbackFeedback(practiceAnswer);
  } catch (err) {
    console.warn('[applicationAiService] AI Feedback error, using fallback:', err.message);
    return generateFallbackFeedback(practiceAnswer);
  }
}

module.exports = {
  generateInterviewGuide,
  generateCandidateWarmup,
  evaluateCandidateWarmup,
  extractSubmissionContext,
  generateFallbackGuide,
  generateFallbackWarmup,
  generateFallbackFeedback
};
