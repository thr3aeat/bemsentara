'use strict';

const { chatWithAI } = require('../aiService');
const logger = require('../../../utils/logger');

/**
 * TicketSummaryAI — Uses AI to summarize completed ticket conversations into clean 3-sentence summaries.
 */
async function generateTicketSummary(ticketId, messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'Bilet içerisinde yeterli mesaj içeriği bulunmuyor.';
  }

  const conversationText = messages
    .slice(-30)
    .map(m => `${m.author?.username || 'Kullanıcı'}: ${m.content}`)
    .join('\n');

  const systemPrompt = `Sen profesyonel bir müşteri destek ve moderasyon analizcisisin. 
Aşağıdaki destek bileti konuşmasını incele ve Türkçe 3 cümle ile özetle:
1. Kullanıcının sorunu neydi?
2. Yetkili ekibin çözümü/yanıtı ne oldu?
3. Biletin nihai sonucu ne oldu?`;

  try {
    const summary = await chatWithAI(conversationText, systemPrompt, 'ticket', { max_tokens: 250, temperature: 0.5 });
    return summary || 'Bilet özeti otomatik oluşturulamadı.';
  } catch (err) {
    logger.error(`[TicketSummaryAI] Summary generation failed for ticket ${ticketId}:`, err.message);
    return 'Bilet özeti oluşturulurken bir hata meydana geldi.';
  }
}

module.exports = {
  generateTicketSummary
};
