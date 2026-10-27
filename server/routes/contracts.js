'use strict';

const express = require('express');
const crypto = require('crypto');
const { contracts, saveStoreNow } = require('../../models/Store');
const { isSiteAdmin } = require('../../utils/adminCheck');
const { chatWithAI } = require('../../bot/services/aiService');
const { renderPublicContractPage } = require('../views/contractsView');
const { renderErrorPage } = require('../views');

const router = express.Router();

const LEGAL_CONTRACT_SYSTEM_PROMPT = `Sen Türkiye Cumhuriyeti mevzuatına, Borçlar Hukukuna, 6100 sayılı Hukuk Muhakemeleri Kanunu'na (HMK m.193 Delil Sözleşmesi) ve kurumsal protokol yazım standartlarına hâkim kıdemli bir Hukuk Müşaviri ve Resmi Sözleşme Uzmanısın (EkoAI Hukuk Servisi).

Görevin:
Kullanıcının verdiği kısa taslağı, başlığı veya notları alıp; son derece resmi, ağır, prestijli, uzun ve detaylı bir "Resmi Kurumsal Sözleşme ve Protokol" metnine dönüştürmektir.

Kesin Kurallar:
1. Yalnızca Türkçe yaz ve Times New Roman resmi evrak üslubuna uygun, ağır ve ciddi bir hukuk dili kullan ("işbu sözleşme", "gayrikabili rücu", "münhasıran", "müştereken ve müteselsilen", "nakden ve defaten", "HMK Madde 193 uyarınca kesin delil" gibi resmi terimler kullan).
2. Metni mutlaka en az 6 ila 8 detaylı madde halinde ("MADDE 1 — TARAFLAR VE AMAÇ", "MADDE 2 — SÖZLEŞMENİN KONUSU VE KAPSAMI", "MADDE 3 — TARAFLARIN HAK VE YÜKÜMLÜLÜKLERİ", "MADDE 4 — GİZLİLİK, SIR SAKLAMA VE VERİ GÜVENLİĞİ", "MADDE 5 — CEZAİ ŞARTLAR, İHLAL VE DERHAL FESİH", "MADDE 6 — FİKRİ MÜLKİYET VE TELİF HAKLARI", "MADDE 7 — ELEKTRONİK İMZA VE DELİL SÖZLEŞMESİ (HMK M.193)", "MADDE 8 — YÜRÜRLÜK VE KABUL" gibi) uzun ve doyurucu paragraflarla yaz.
3. Cevabının ilk satırında eğer uygun bir resmi başlık öneriyorsan "BAŞLIK: [BÜYÜK HARFLERLE RESMİ BAŞLIK]" formatında yaz, hemen alt satırdan itibaren doğrudan "MADDE 1 — ..." ile sözleşme metnine başla.
4. Asla sohbet cümlesi, selamlama, açıklama veya markdown kod bloğu ekleme; doğrudan resmi sözleşme maddelerini üret.`;

function buildFallbackEnhancedContract({ title, content, partyOne, partyTwo, mode }) {
  const cleanTitle = (title && title.trim())
    ? title.trim().toUpperCase()
    : 'KURUMSAL HİZMET, GİZLİLİK, SADAKAT VE HUKUKİ TAAHHÜT SÖZLEŞMESİ';
  const p1 = partyOne || 'EkoYıldız & Sentara Yönetimi';
  const p2 = partyTwo || 'İmza Sahibi Muhatap';
  const seedText = (content && content.trim())
    ? content.trim()
    : 'Taraflar arasında kurumsal iş birliği, gizlilik, görev sadakati ve dijital güvenlik esaslarının belirlenmesi.';

  const expanded = `MADDE 1 — TARAFLAR, TANIMLAR VE SÖZLEŞMENİN AMACI
1.1. İşbu ${cleanTitle} ("Sözleşme"), bir tarafta ${p1} ("Kurum" veya "1. Taraf") ile diğer tarafta elektronik ortamda fare (mouse) vasıtasıyla ıslak görünümlü elektronik imzası bulunan ${p2} ("Muhatap" veya "2. Taraf") arasında tam bir irade mutabakatı ile akdedilmiştir.
1.2. İşbu Sözleşmenin temel amacı; Taraflar arasındaki idari, teknik, hukuki ve operasyonel ilişkilerin sınırlarını tayin etmek, kurumsal disiplini tesis etmek ve aşağıda belirtilen özel hükümler çerçevesinde karşılıklı hak ve yükümlülükleri bağlayıcı hüküm altına almaktır.

MADDE 2 — SÖZLEŞMENİN KONUSU VE ÖZEL KAPSAMI
2.1. İşbu Sözleşmenin esas konusu ve dayanağı olan özel hükümler şunlardır:
${seedText}
2.2. Yukarıda zikredilen hususlar, işbu Sözleşmenin ayrılmaz bir cüzü olup, Muhatap bu maddelerin tamamını kayıtsız ve şartsız olarak gayrikabili rücu kabul, beyan ve taahhüt etmiştir.

MADDE 3 — TARAFLARIN HAK, YETKİ VE YÜKÜMLÜLÜKLERİ
3.1. Muhatap, ${p1} tarafından belirlenen tüm kurumsal yönergelere, iç tüzük hükümlerine, çalışma etiğine ve güvenlik protokollerine tam bir sadakatle riayet edeceğini taahhüt eder.
3.2. Muhatap, kendisine tevdi edilen hiçbir yetkiyi, erişim anahtarını, yönetim panelini veya kurumsal imtiyazı şahsi menfaati yahut üçüncü kişilerin çıkarı doğrultusunda kullanamaz; yetki sınırlarını aşacak her türlü eylemden münhasıran sorumludur.

MADDE 4 — MUTLAK GİZLİLİK, SIR SAKLAMA VE VERİ GÜVENLİĞİ YÜKÜMLÜLÜĞÜ
4.1. Kurum bünyesinde edinilen her türlü iç yazışma, yönetim kararı, yazılım mimarisi, kaynak kodu, veritabanı yapısı, moderasyon kayıtları ve stratejik planlamalar 6698 sayılı KVKK ve ilgili mevzuat uyarınca "Mutlak Gizli Bilgi" statüsündedir.
4.2. Muhatap, sözleşme yürürlükte olduğu sürece ve sözleşme herhangi bir sebeple sona erdikten sonra dahi süresiz olarak bu bilgileri üçüncü şahıs, kurum veya platformlarla paylaşmayacağını, ifşa etmeyeceğini ve kopyalamayacağını taahhüt eder.

MADDE 5 — 5846 SAYILI FSEK KAPSAMINDA FİKRİ MÜLKİYET HAKLARI
5.1. ${p1} çatısı altında üretilen tüm dijital içerikler, bot sistemleri, tasarımlar, dokümanlar ve projeler üzerindeki her türlü mali ve manevi telif hakkı münhasıran Kurum'a aittir.

MADDE 6 — SÖZLEŞMENİN İHLALİ, CEZAİ ŞARTLAR VE DERHAL FESİH
6.1. Muhatap'ın işbu Sözleşme maddelerinden herhangi birine kısmen veya tamamen aykırı hareket etmesi halinde, Kurum hiçbir ihtar veya ihbara gerek kalmaksızın sözleşmeyi tek taraflı ve derhal feshetme, tüm yetki ve hakları geri alma ve Muhatap'ı kalıcı yasaklı (blacklist) listesine alma hakkına sahiptir.
6.2.${mode === 'strict_penalty' ? ' Ağır ihlal ve sır ifşası hallerinde Muhatap, Kurum\'un uğradığı tüm maddi, manevi ve itibar kaybı zararlarını ilk talepte nakden ve defaten tazmin etmeyi kabul eder.' : ' İhlal sebebiyle doğacak her türlü idari ve hukuki sorumluluk doğrudan doğruya Muhatap\'a aittir.'}

MADDE 7 — ELEKTRONİK İMZA GEÇERLİLİĞİ VE DELİL SÖZLEŞMESİ (HMK MADDE 193)
7.1. Taraflar, işbu sözleşmenin elektronik ortamda görüntülenerek fare (mouse) veya dokunmatik ekran vasıtasıyla atılan elektronik imza ile imzalanmasının, ıslak imzalı belge ile aynı hukuki bağlayıcılığa sahip olduğunu kabul eder.
7.2. İşbu sözleşmeden doğabilecek her türlü uyuşmazlıkta, 6100 sayılı Hukuk Muhakemeleri Kanunu'nun (HMK) 193. maddesi uyarınca ${p1} sunucu kayıtları, veritabanı logları, zaman damgaları ve SHA-256 kriptografik imza özetleri kesin ve münhasır delil teşkil eder.

MADDE 8 — YÜRÜRLÜK VE İMZA
8.1. Sekiz (8) ana maddeden ibaret olan işbu Resmi Sözleşme, Taraflarca okunup müzakere edilerek elektronik ortamda imzalandığı anda yürürlüğe girmiştir.`;

  return { title: cleanTitle, content: expanded };
}

function requireAdmin(req, res, next) {
  if (!req.user || !isSiteAdmin(req.user)) {
    return res.status(403).json({ success: false, error: 'Bu işlem için yönetici yetkisi gereklidir.' });
  }
  next();
}

// ── PUBLIC ROUTES: Sözleşme Görüntüleme ve E-İmza ───────────────────────────

router.get(['/sozlesme/:id', '/contracts/:id'], (req, res) => {
  const rawId = String(req.params.id || '').trim();
  const contract = contracts.findById(rawId) || contracts.findOne({ documentNo: rawId });
  if (!contract) {
    return res.status(404).send(renderErrorPage(404, 'Aradığınız resmi sözleşme bulunamadı veya yayından kaldırıldı.'));
  }
  return res.send(renderPublicContractPage(contract, req.user));
});

router.post('/api/contracts/:id/sign', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').trim();
    const contract = contracts.findById(rawId);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Sözleşme bulunamadı.' });
    }

    if (contract.status === 'SIGNED') {
      return res.status(400).json({ success: false, error: 'Bu sözleşme zaten imzalanmış.' });
    }

    const signerName = String(req.body?.signerName || '').trim();
    const signerTitle = String(req.body?.signerTitle || '').trim();
    const signatureData = String(req.body?.signatureData || '').trim();

    if (!signerName || signerName.length < 2) {
      return res.status(400).json({ success: false, error: 'Lütfen geçerli bir Ad Soyad veya Kullanıcı Adı giriniz.' });
    }

    if (!signatureData.startsWith('data:image/png;base64,') || signatureData.length < 150) {
      return res.status(400).json({ success: false, error: 'Geçerli bir elektronik imza çizimi algılanmadı.' });
    }

    const signedAt = new Date().toISOString();
    const hashPayload = `${contract._id}|${contract.documentNo}|${signerName}|${signedAt}|${signatureData.slice(0, 120)}`;
    const signatureHash = crypto.createHash('sha256').update(hashPayload).digest('hex').toUpperCase();

    contract.status = 'SIGNED';
    contract.signerName = signerName;
    contract.signerTitle = signerTitle;
    contract.signerDiscordId = req.user?.discordId || null;
    contract.signatureData = signatureData;
    contract.signedAt = signedAt;
    contract.signatureHash = signatureHash;

    await contract.save();
    await saveStoreNow();

    return res.json({
      success: true,
      message: 'Sözleşme başarıyla elektronik olarak imzalandı.',
      contract: {
        _id: contract._id,
        status: contract.status,
        signerName: contract.signerName,
        signedAt: contract.signedAt,
        signatureHash: contract.signatureHash,
      },
    });
  } catch (err) {
    console.error('[contracts/sign] error:', err);
    return res.status(500).json({ success: false, error: 'İmza kaydedilirken bir sunucu hatası oluştu.' });
  }
});

// ── ADMIN API ROUTES: Sözleşme Yönetimi ve EkoAI Geliştirici ────────────────

router.get('/api/admin/contracts', requireAdmin, (req, res) => {
  try {
    const all = contracts.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, contracts: all });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/admin/contracts', requireAdmin, async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const headerSubtitle = String(req.body?.headerSubtitle || 'T.C. İSTANBUL • EKOYILDIZ & SENTARA YÜKSEK HUKUK VE DENETİM DAİRESİ BAŞKANLIĞI').trim();
    const documentNo = String(req.body?.documentNo || `EKO-${new Date().getFullYear()}/SZL-${Math.floor(1000 + Math.random() * 9000)}`).trim();
    const partyOneName = String(req.body?.partyOneName || 'EkoYıldız & Sentara Yönetimi').trim();
    const partyTwoName = String(req.body?.partyTwoName || '').trim();
    const content = String(req.body?.content || '').trim();

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Sözleşme başlığı ve maddeleri zorunludur.' });
    }

    const record = contracts.create({
      title,
      headerSubtitle,
      documentNo,
      partyOneName,
      partyTwoName,
      content,
      status: 'PENDING',
      createdBy: req.user?.discordId || req.user?.username || 'Admin',
      signerName: null,
      signerTitle: null,
      signatureData: null,
      signedAt: null,
      signatureHash: null,
    });

    await saveStoreNow();
    return res.json({ success: true, contract: record });
  } catch (err) {
    console.error('[admin/contracts create] error:', err);
    return res.status(500).json({ success: false, error: 'Sözleşme oluşturulamadı.' });
  }
});

router.delete('/api/admin/contracts/:id', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const deleted = contracts.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Sözleşme bulunamadı.' });
    }
    await saveStoreNow();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/admin/contracts/ai-enhance', requireAdmin, async (req, res) => {
  const title = String(req.body?.title || '').trim();
  const content = String(req.body?.content || '').trim();
  const partyOne = String(req.body?.partyOne || 'EkoYıldız & Sentara Yönetimi').trim();
  const partyTwo = String(req.body?.partyTwo || 'İmza Sahibi Muhatap').trim();
  const mode = String(req.body?.mode || 'expand_formal').trim();

  const modeInstruction = mode === 'strict_penalty'
    ? 'Özellikle ağır cezai şartlar, sır saklama (NDA), yetki kötüye kullanımı yaptırımları ve HMK m.193 kesin delil hükümlerini çok detaylı ve uzun maddeler halinde ekle.'
    : mode === 'full_rewrite'
      ? 'Verilen kısa konuyu baştan sona 8 maddelik tam teşekküllü, çok resmi bir hukuk sözleşmesine dönüştür ve uygun bir resmi BAŞLIK öner.'
      : 'Mevcut taslağı ve maddeleri ağır resmi hukuk diliyle (Times New Roman protokol üslubuyla) genişlet, cümleleri uzunlaştır ve en az 7-8 resmi maddeye çıkar.';

  const userPrompt = `1. Taraf (Kurum): ${partyOne}
2. Taraf (Muhatap): ${partyTwo}
Mevcut Sözleşme Başlığı: ${title || '(Belirtilmedi, lütfen resmi bir başlık oluştur)'}
İstenen Geliştirme Modu: ${modeInstruction}

Mevcut Taslak / Konu Metni:
${content || 'Kurumsal gizlilik, görev sadakati, disiplin kuralları ve sorumluluk sözleşmesi.'}

Lütfen yukarıdaki bilgileri kullanarak çok resmi, uzun ve maddelendirilmiş ("MADDE 1 — ...", "MADDE 2 — ...") sözleşme metnini üret.`;

  try {
    const aiText = await chatWithAI(
      [{ role: 'user', content: userPrompt }],
      LEGAL_CONTRACT_SYSTEM_PROMPT,
      'contract',
      { max_tokens: 2200, temperature: 0.45 }
    );

    if (aiText && aiText.trim().length > 120) {
      let extractedTitle = title;
      let cleanedBody = aiText.trim();

      const firstLineMatch = cleanedBody.match(/^BAŞLIK\s*:\s*(.+)$/im);
      if (firstLineMatch) {
        extractedTitle = firstLineMatch[1].trim().replace(/^["']|["']$/g, '');
        cleanedBody = cleanedBody.replace(/^BAŞLIK\s*:\s*.+\r?\n*/im, '').trim();
      }

      return res.json({
        success: true,
        source: 'ekoai',
        title: extractedTitle || 'KURUMSAL HİZMET, GİZLİLİK VE HUKUKİ TAAHHÜT SÖZLEŞMESİ',
        content: cleanedBody,
      });
    }
  } catch (err) {
    console.warn('[contracts/ai-enhance] AI fallback devrede:', err.message);
  }

  // Güvenilir Hukuki Şablon Genişletici Fallback
  const fallback = buildFallbackEnhancedContract({ title, content, partyOne, partyTwo, mode });
  return res.json({
    success: true,
    source: 'ekoai_legal_engine',
    title: fallback.title,
    content: fallback.content,
  });
});

module.exports = router;
