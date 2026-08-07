'use strict';

/**
 * oneTimeV2Update.js
 * 
 * Tek seferlik olarak tüm Components V2 mesajlarını accentColor olmadan günceller.
 * Bot başlatıldığında bir kez çalışır ve ardından kendini devre dışı bırakır.
 */

const { appMeta, saveStoreNow } = require('../../models/Store');

async function runOneTimeV2Update(client) {
  try {
    // Güncellenip güncellenmediğini kontrol et
    let updateRecord = appMeta ? appMeta.findOne({ key: 'v2AccentColorUpdateCompleted' }) : null;
    
    if (updateRecord && updateRecord.completed === true) {
      console.log('[OneTimeV2Update] ✅ Components V2 güncelleme daha önce tamamlanmış, atlıyor...');
      return;
    }

    console.log('[OneTimeV2Update] 🔄 Components V2 mesajlarını accent color olmadan güncellemeye başlıyor...');

    // Import service functions
    const { sendEkoHookAbout, CHANNEL_ID: EKO_HOOK_CHANNEL } = require('./ekoHookService');
    const { sendSupportersMessage, SUPPORTERS_CHANNEL_ID } = require('./supportersService');
    const { sendEkoYildizRules, RULES_CHANNEL_ID } = require('./rulesService');
    const { renderBlacklist } = require('./blacklistService');

    let successCount = 0;
    let errorCount = 0;

    // 1. Eko Hook mesajını güncelle
    try {
      console.log('[OneTimeV2Update] 📝 Eko Hook mesajı güncelleniyor...');
      const success = await sendEkoHookAbout(client, EKO_HOOK_CHANNEL);
      if (success) {
        successCount++;
        console.log('[OneTimeV2Update] ✅ Eko Hook güncellendi');
      } else {
        errorCount++;
        console.log('[OneTimeV2Update] ⚠️ Eko Hook güncellenemedi');
      }
    } catch (err) {
      errorCount++;
      console.error('[OneTimeV2Update] ❌ Eko Hook hatası:', err.message);
    }

    // 2. Destekçiler mesajını güncelle
    try {
      console.log('[OneTimeV2Update] 📝 Destekçiler mesajı güncelleniyor...');
      const success = await sendSupportersMessage(client, SUPPORTERS_CHANNEL_ID);
      if (success) {
        successCount++;
        console.log('[OneTimeV2Update] ✅ Destekçiler güncellendi');
      } else {
        errorCount++;
        console.log('[OneTimeV2Update] ⚠️ Destekçiler güncellenemedi');
      }
    } catch (err) {
      errorCount++;
      console.error('[OneTimeV2Update] ❌ Destekçiler hatası:', err.message);
    }

    // 3. Kurallar mesajını güncelle
    try {
      console.log('[OneTimeV2Update] 📝 Kurallar mesajı güncelleniyor...');
      const success = await sendEkoYildizRules(client, RULES_CHANNEL_ID);
      if (success) {
        successCount++;
        console.log('[OneTimeV2Update] ✅ Kurallar güncellendi');
      } else {
        errorCount++;
        console.log('[OneTimeV2Update] ⚠️ Kurallar güncellenemedi');
      }
    } catch (err) {
      errorCount++;
      console.error('[OneTimeV2Update] ❌ Kurallar hatası:', err.message);
    }

    // 4. Blacklist mesajını güncelle
    try {
      console.log('[OneTimeV2Update] 📝 Karaliste mesajı güncelleniyor...');
      await renderBlacklist(client);
      successCount++;
      console.log('[OneTimeV2Update] ✅ Karaliste güncellendi');
    } catch (err) {
      errorCount++;
      console.error('[OneTimeV2Update] ❌ Karaliste hatası:', err.message);
    }

    // Güncelleme tamamlandı olarak işaretle
    if (appMeta) {
      if (!updateRecord) {
        appMeta.create({
          key: 'v2AccentColorUpdateCompleted',
          completed: true,
          timestamp: new Date(),
          successCount: successCount,
          errorCount: errorCount
        });
      } else {
        updateRecord.completed = true;
        updateRecord.timestamp = new Date();
        updateRecord.successCount = successCount;
        updateRecord.errorCount = errorCount;
        updateRecord.save();
      }
      saveStoreNow();
    }

    console.log(`[OneTimeV2Update] 🎉 Güncelleme tamamlandı! Başarılı: ${successCount}, Hata: ${errorCount}`);
    console.log('[OneTimeV2Update] ℹ️ Bu script bir daha çalışmayacak.');

  } catch (err) {
    console.error('[OneTimeV2Update] ❌ Kritik hata:', err.stack || err.message);
  }
}

module.exports = { runOneTimeV2Update };
