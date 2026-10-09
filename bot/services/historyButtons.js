'use strict';

/**
 * historyButtons.js
 *
 * "Tarihte Bugün" butonlarına (tb_* / tbn_*) basılınca çalışır. Cevaplar Components V2'dir:
 *  - günlük mesajdaki butonlar (tb_*) yalnızca basan kişiye görünen yeni bir cevap açar
 *  - cevabın içindeki gezinme butonları (tbn_*) aynı mesajı yerinde günceller
 * Basılır basılmaz "hazırlanıyor" durumu gösterilir (etkileşim süresi dolmasın, kullanıcı beklediğini görsün).
 */

const { MessageFlags } = require('discord.js');
const {
  VIEWS,
  parseHistoryButtonId,
  dateLabel,
  buildDetailPayload,
  buildLoadingPayload,
  buildErrorPayload
} = require('./historyV2Messages');

const COOLDOWN_MS = 3000;
const SYSTEM_PROMPT = 'Sen uzman bir tarih araştırmacısısın. Sadece Türkçe zengin içerik üret.';
const lastUse = new Map(); // userId -> zaman

/**
 * @returns {Promise<boolean>} butona ait bir kimlik işlendiyse true
 */
async function handleHistoryButton(interaction, { chat, now = Date.now } = {}) {
  const parsed = parseHistoryButtonId(interaction.customId);
  if (!parsed) return false;
  const { nav, viewKey, day, month } = parsed;

  // Aşırı hızlı art arda basmaları sınırla (her basış bir yapay zeka isteğidir).
  const t = now();
  const userId = interaction.user && interaction.user.id;
  if (userId) {
    if (t - (lastUse.get(userId) || 0) < COOLDOWN_MS) {
      if (nav) await interaction.deferUpdate().catch(() => {});
      else await interaction.reply({ content: '⏳ Biraz yavaş! Birkaç saniye sonra tekrar dene.', flags: MessageFlags.Ephemeral }).catch(() => {});
      return true;
    }
    lastUse.set(userId, t);
    if (lastUse.size > 5000) for (const [k, v] of lastUse) if (t - v > COOLDOWN_MS) lastUse.delete(k);
  }

  const loading = buildLoadingPayload({ viewKey, day, month });
  try {
    if (nav) await interaction.update(loading);
    else await interaction.reply({ ...loading, flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
  } catch (err) {
    console.warn(`[HistoryButtons] Yanıt başlatılamadı: ${err && err.message}`);
    return true; // etkileşim zaten süresi dolmuş/yanıtlanmış olabilir
  }

  let payload;
  try {
    const ask = chat || require('./aiService').chatWithAI;
    const prompt = VIEWS[viewKey].prompt(dateLabel(day, month));
    const body = await ask([{ role: 'user', content: prompt }], SYSTEM_PROMPT, 'ticket', { max_tokens: 1200, temperature: 0.65 });
    if (!body || String(body).trim().length < 20) throw new Error('yapay zeka yanıtı boş veya çok kısa');
    payload = buildDetailPayload({ viewKey, day, month, body });
  } catch (err) {
    console.warn(`[HistoryButtons] ${VIEWS[viewKey].action} için içerik alınamadı: ${err && err.message}`);
    payload = buildErrorPayload({ viewKey, day, month });
  }

  await interaction.editReply(payload).catch((err) => {
    console.warn(`[HistoryButtons] Cevap güncellenemedi: ${err && err.message}`);
  });
  return true;
}

module.exports = { handleHistoryButton, COOLDOWN_MS };
