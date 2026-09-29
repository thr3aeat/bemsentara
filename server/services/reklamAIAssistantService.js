'use strict';

const { chatWithAI, cleanAIResponse } = require('../../bot/services/aiService');
const {
  BASE_DISCORD_ANNOUNCEMENT_PRICE,
  PRESET_PACKAGES,
  CUSTOM_MODULES,
  getDiscordAddonForPackage,
  calculateCustomPackagePrice
} = require('./reklamPricingConfig');

const REKLAM_AI_SYSTEM_PROMPT = `Sen EkoYıldız Partner Studio'nun akıllı, dürüst ve resmi yapay zekası **EKOai Reklam Danışmanı** (EkoAI · AI Destek Asistanı)'sın.
EkoYıldız YouTube ve Discord ekosisteminde reklam ve sponsorluk almak isteyen potansiyel iş ortaklarına, oyun geliştiricilerine ve topluluk liderlerine rehberlik edersin.

KİMLİK VE DAVRANIŞ KURALI:
- Sen bir yapay zekâ asistanısın. Gerçek bir insan personelmiş gibi ASLA davranma. Kimliğin: "EkoAI / EKOai · AI Destek Asistanı".
- Kullanıcının çözülemeyen veya özel bir durumu varsa "Yetkiliye Aktar" diyerek bilet açmasını veya reklam masası ekibine yönlendirilmesini sağla.

TEMEL PRENSİPLER VE KURALLAR:
1. **Şeffaflık ve Dürüstlük**: Asla gerçek dışı satış veya üye garantisi verme. EkoYıldız gerçek ve organik kitleye görünürlük sağlar.
2. **Paket ve Fiyat Bilgileri**:
   - **Shorts Entegrasyonu / Hızlı Tanıtım (30 TL)**: 30-60 sn dikey video, yüksek viral erişim. ÖNEMLİ: Shorts paketine "Discord Duyurusu" EKLENEMEZ!
   - **Standart Video Sponsorluğu (50 TL)**: Alt bant banner, açıklama ve sabit yorum yerleşimi. (Discord Duyurusu opsiyonel +110 TL).
   - **Sesli Mid-Roll (100 TL - En Çok Tercih Edilen)**: Video içi 20-30 saniyelik doğal sesli anlatım, açıklama linki, sabit yorum. (Discord Duyurusu avantajlı indirimle +80 TL).
   - **Gold Kombin (350 TL)**: Uzun video + Shorts + topluluk paylaşımı.
   - **Mega Etkileşim (500 TL)**: Uzun video + Shorts + topluluk + özel Discord duyurusu.
   - **Çekilişli VIP Kapsam (670 TL)**: Mega paket + topluluk odaklı özel çekiliş kurgusu.
   - **Discord Duyurusu Bağımsız Fiyatı**: 140 TL. Paketle alındığında indirimli uygulanır.
   - **Kendi Paketini Oluştur**: 3 modül seçildiğinde %10, 4+ modül seçildiğinde %15 akıllı paket avantajı uygulanır.
3. **Ödeme Yöntemleri ve Şeffaflık**:
   - **Papara ile Ödeme**: **0 TL komisyon**. Papara numarasına doğrudan ödeme yapılarak ek işlem ücreti ödenmeden işlem tamamlanır. Hızlı ve komisyonsuz yöntemdir.
   - **İtemSatış ile Ödeme**: Platform üzerinden güvenli ödeme yapılır. Platform hizmeti gereği **+5 TL işlem/komisyon ücreti** şeffaf biçimde toplam tutara eklenir.
   - Güven beyanı: "Ödeme İtemSatış üzerinden gerçekleştirilebilir." Asla resmi olmayan veya sahte onay rozetleri uydurma.
4. **İttifak Orduları Kampları Kuralları**:
   - Ücretli reklam için kamp yöneticisinin YGS veya GS rütbesinde olması gerekir.
   - Ücretsiz reklam yalnızca 5.000+ GERÇEK üyeye sahip kamplara değerlendirilir (bot hesaplar sayılmaz) ve onay süreci uzundur.
5. **Yönlendirme ve Yetkiliye Aktarma**:
   - Kullanıcı doğrudan sipariş veya bilet açmak istediğinde "/tickets/new?category=reklam" sayfasını öner.
   - Konu karmaşıklaştığında veya özel bütçe gerektiğinde: "Dilerseniz bu görüşmeyi doğrudan bir yetkiliye aktarabiliriz." diyerek destek biletine yönlendir.
6. **Üslup**:
   - Profesyonel, cana yakın, Türkçe, akıcı, abartısız ve güven veren bir ton.
   - Kısa, net ve okunabilir yanıtlar ver.`;

/**
 * Reklam sayfası için kullanıcı sorusunu yanıtlar.
 * @param {string} userQuestion - Ziyaretçinin sorusu
 * @param {Array<{role: string, content: string}>} [history] - Önceki mesaj geçmişi
 */
async function answerAdvertisingQuestion(userQuestion, history = []) {
  if (!userQuestion || typeof userQuestion !== 'string' || !userQuestion.trim()) {
    throw new Error('Geçerli bir soru girilmelidir.');
  }

  const cleanQuestion = userQuestion.trim().slice(0, 800); // Güvenlik & spam limiti

  const messages = [];

  // Önceki konuşma geçmişini filtrele ve ekle (en fazla son 6 mesaj)
  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-6);
    for (const item of recent) {
      if (item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string') {
        messages.push({
          role: item.role,
          content: item.content.slice(0, 1000)
        });
      }
    }
  }

  messages.push({
    role: 'user',
    content: cleanQuestion
  });

  try {
    const aiResponse = await chatWithAI(messages, REKLAM_AI_SYSTEM_PROMPT, 'ticket', {
      max_tokens: 650,
      temperature: 0.6
    });

    const cleaned = cleanAIResponse(aiResponse);
    return cleaned || 'Sorunuz alındı ancak şu anda detaylı yanıt üretilemedi. Lütfen bir destek bileti açarak ekibimize danışınız.';
  } catch (err) {
    console.error('[ReklamAIAssistant] Hata:', err.message);

    // AI geçici olarak ulaşılamazsa fallback akıllı yanıtlar
    const lower = cleanQuestion.toLowerCase();
    if (lower.includes('discord') && (lower.includes('duyuru') || lower.includes('fiyat'))) {
      return 'Discord duyurusu ekstrası dinamik fiyatlandırmaya sahiptir: Shorts paketlerinde eklenemez, Midroll ile +₺850, Dedicated Özel Video ile avantajlı olarak +₺600 karşılığında pakete dahil edilir.';
    }
    if (lower.includes('shorts')) {
      return 'YouTube Shorts paketimiz ₺1.500 başlangıç fiyatıyla sunulur. 30-60 saniyelik dikey video formatında yüksek viral görünürlük sağlar. Shorts formatı gereği Discord duyurusu bu pakete eklenememektedir.';
    }
    if (lower.includes('ittifak') || lower.includes('asker') || lower.includes('ordu')) {
      return 'İttifak Orduları başvurularında ücretli reklam için YGS veya GS şartı aranır. Ücretsiz reklam ise yalnızca 5.000+ gerçek üyesi bulunan kamplar için değerlendirmeye alınır.';
    }
    if (lower.includes('ödeme') || lower.includes('itemsatış') || lower.includes('güven')) {
      return 'Tüm reklam ve sponsorluk ödemeleri resmî İtemSatış mağazası üzerinden güvenli ödeme yöntemleriyle (kredi kartı, havale/EFT) gerçekleştirilmektedir.';
    }

    return 'Şu anda yapay zeka servislerimizde kısa bir yoğunluk bulunmaktadır. Dilerseniz sayfamızdaki "Reklam Masası Aç" butonuyla doğrudan yetkili ekibimizle görüşebilirsiniz.';
  }
}

module.exports = {
  answerAdvertisingQuestion,
  REKLAM_AI_SYSTEM_PROMPT
};
