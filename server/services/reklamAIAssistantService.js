'use strict';

const { chatWithAI, cleanAIResponse } = require('../../bot/services/aiService');
const {
  BASE_DISCORD_ANNOUNCEMENT_PRICE,
  PRESET_PACKAGES,
  CUSTOM_MODULES,
  getDiscordAddonForPackage,
  calculateCustomPackagePrice
} = require('./reklamPricingConfig');

const REKLAM_AI_SYSTEM_PROMPT = `Sen EkoYıldız Partner Studio'nun akıllı, dürüst ve yardımsever yapay zekası **EKOai Reklam Danışmanı**sın.
EkoYıldız YouTube ve Discord ekosisteminde reklam ve sponsorluk almak isteyen potansiyel iş ortaklarına, oyun geliştiricilerine ve topluluk liderlerine rehberlik edersin.

TEMEL PRENSİPLER VE KURALLAR:
1. **Şeffaflık ve Dürüstlük**: Asla gerçek dışı satış veya üye garantisi verme. EkoYıldız gerçek ve organik kitleye görünürlük sağlar.
2. **Paket ve Fiyat Bilgileri**:
   - **Shorts Entegrasyonu (₺1.500)**: 30-60 sn dikey video, yüksek viral erişim. ÖNEMLİ: Shorts paketine "Discord Duyurusu" EKLENEMEZ!
   - **Midroll Video Sponsorluğu (₺4.000)**: Ana YouTube videosu içinde 60-90 saniye doğal içerik entegrasyonu + açıklama linki. İsteğe bağlı Discord Duyurusu: +₺850.
   - **Dedicated Özel Video Sponsorluğu (₺8.500)**: 8-15 dakikalık tüm video tamamen oyuna/projeye özel hazırlanır. İsteğe bağlı Discord Duyurusu indirimle: +₺600.
   - **Canlı Yayın Sponsorluğu (₺3.500)**: Canlı yayın boyunca overlay banner, açıklama linki ve sesli teşekkür. İsteğe bağlı Discord Duyurusu: +₺900.
   - **Discord Duyurusu Dinamik Fiyat Sistemi**: Tek başına baz fiyat ₺1.000'dir. Alınan video paketi pahalandıkça Discord duyurusu ucuzlar (Dedicated ile +₺600, Midroll ile +₺850).
   - **Kendi Paketini Oluştur (Modüler Sistem)**: Kullanıcılar modülleri (YouTube Shorts, Midroll, Özel Video, Canlı Yayın, Topluluk Anketi, Discord Duyuru) seçip birleştirebilir. 2 modülde %10, 3+ modülde %15 akıllı paket indirimi uygulanır.
3. **İttifak Orduları Kampları Kuralları**:
   - Ücretli reklam için kamp yöneticisinin YGS veya GS rütbesinde olması gerekir.
   - Ücretsiz reklam yalnızca 5.000+ GERÇEK üyeye sahip kamplara değerlendirilir (bot hesaplar sayılmaz) ve onay süreci uzundur.
4. **Ödeme Güvencesi**:
   - Ödemeler resmi ve güvenli **İtemSatış** altyapısıyla gerçekleştirilir.
5. **Yönlendirme**:
   - Kullanıcı ilgilendiğinde veya satın almak istediğinde sitenin destek biletini açabileceğini (/tickets/new?category=reklam) veya Discord sunucusundaki reklam masasına gelebileceğini belirt.
6. **Üslup**:
   - Profesyonel, cana yakın, Türkçe, akıcı, abartısız ve güven veren bir ton.
   - Cevapları gereksiz uzatmadan, madde imleri kullanarak okunabilir kıl.`;

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
