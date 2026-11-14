'use strict';

const { chatWithAI, cleanAIResponse } = require('../../bot/services/aiService');

const TICKET_STAFF_SYSTEM_PROMPT = `Sen EkoYıldız destek ve reklam masasında görevli gerçek bir yetkili temsilcisin (Eko gelene kadar biletle birebir sen ilgileniyorsun).

ÇOK ÖNEMLİ KİMLİK KURALI:
- Kullanıcıyla GERÇEK BİR YETKİLİYMİŞ GİBİ konuş. Asla "ben bir yapay zekâyım", "ben bir botum" veya "AI asistanıyım" DEME.
- Doğal, samimi, güven veren, çözüm odaklı bir yetkili gibi yanıt ver.
- Eko (kurucu/ana yetkili) bilete gelip bizzat yazana kadar tüm soruları yanıtla, detayları netleştir ve kullanıcıyı bekletmeden ilgilen.

İTEMSATIŞ LİNKİ VE ÖDEME KURALI:
- Kullanıcı İtemSatış linkini, satın alma bağlantısını veya ödeme linkini sorduğunda:
  "İtemSatış linkinde sizi biraz bekleteceğiz; Eko bizzat biletinize gelip size özel sipariş bağlantısını paylaşacak. O gelene kadar aklınızdaki diğer tüm detayları benimle konuşabilirsiniz." şeklinde nazikçe bilgi ver.
- Papara ile 0 TL komisyonlu ödeme veya Robux (2x değer: 1 TL = 100 Robux, Shorts en az 3.000 Robux) seçeneği hakkında net bilgi verebilirsin.

GÜNCEL PAKET VE FİYATLAR:
- Shorts & Hızlı Tanıtım: 30 TL / 3.000 Robux (Discord duyurusu eklenemez)
- Standart Uzun Video: 50 TL / 5.000 Robux (Discord duyurusu +110 TL / +11.000 Robux)
- Sesli Mid-Roll (Önerilen): 100 TL / 10.000 Robux (Discord duyurusu +80 TL / +8.000 Robux)
- Gold Kombin: 350 TL / 35.000 Robux
- Mega Etkileşim: 500 TL / 50.000 Robux
- Çekilişli VIP: 670 TL / 67.000 Robux

ÜSLUP:
- Kısa, net, saygılı Türkçe kullan. Gereksiz uzatma yapma.`;

function buildInitialTicketGreeting({ category, subject, description }) {
  const combined = `${category || ''} ${subject || ''} ${description || ''}`.toLowerCase();
  const isOrderOrReklam = category === 'reklam' || /itemsatış|itemsatis|reklam|paket|satın|odeme|ödeme|robux/.test(combined);

  if (isOrderOrReklam) {
    return 'Merhaba, hoş geldiniz! Talebinizi aldık ve bilet kanalınız açıldı. İtemSatış linkinde sizi biraz bekleteceğiz; Eko bizzat biletinize gelip bağlantıyı iletecek. O gelene kadar paket detayları, yayın tarihi veya aklınızdaki tüm sorular için benimle buradan konuşabilirsiniz.';
  }
  return 'Merhaba, hoş geldiniz! Destek biletiniz ve kanalınız açıldı. Eko biletinize gelip yazana kadar sizinle ben ilgileniyorum; konuyu biraz daha detaylandırmak isterseniz buradan yazabilirsiniz.';
}

async function answerAsTicketStaff({ ticket, userMessage }) {
  const cleanMsg = String(userMessage || '').trim().slice(0, 1000);
  if (!cleanMsg) return 'Mesajınızı aldım, nasıl yardımcı olabilirim?';

  const lower = cleanMsg.toLowerCase();
  if (/itemsat[ıi]ş|link|bağlantı|satın al/.test(lower)) {
    return 'İtemSatış linkinde sizi biraz bekleteceğiz; Eko bizzat biletinize gelip size özel bağlantıyı paylaşacak. O gelene kadar reklam metniniz, tarih tercihiniz veya başka bir sorunuz varsa benimle konuşabilirsiniz.';
  }

  const history = Array.isArray(ticket?.messages) ? ticket.messages.slice(-8) : [];
  const messages = [];
  for (const m of history) {
    if (!m || !m.content) continue;
    messages.push({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: String(m.content).slice(0, 800)
    });
  }
  if (!messages.length || messages[messages.length - 1].content !== cleanMsg) {
    messages.push({ role: 'user', content: cleanMsg });
  }

  try {
    const contextNote = `Bilet ID: #${ticket?.ticketId || ''}, Kategori: ${ticket?.category || 'Genel'}, Konu: ${ticket?.subject || ''}`;
    const aiReply = await chatWithAI(messages, `${TICKET_STAFF_SYSTEM_PROMPT}\n\nBAĞLAM:\n${contextNote}`, 'ticket', {
      max_tokens: 450,
      temperature: 0.55
    });
    const cleaned = cleanAIResponse(aiReply);
    if (cleaned) return cleaned;
  } catch (err) {
    console.warn('[TicketStaffAI] AI yanıtı alınamadı, yedek yanıt kullanılıyor:', err.message);
  }

  if (/fiyat|ücret|kaç|robux|tl/.test(lower)) {
    return 'Paketlerimiz Shorts 30 TL (3.000 Robux), Standart Video 50 TL (5.000 Robux), Sesli Mid-Roll 100 TL (10.000 Robux), Gold 350 TL (35.000 Robux) ve Mega 500 TL (50.000 Robux) olarak ilerliyor. Hangi paketi düşünüyorsanız detayları netleştirebiliriz; Eko da birazdan biletinize katılacaktır.';
  }
  return 'Mesajınızı not aldım, Eko biletinize gelene kadar buradayım. Eklemek istediğiniz başka bir detay varsa paylaşabilirsiniz.';
}

module.exports = {
  buildInitialTicketGreeting,
  answerAsTicketStaff
};
