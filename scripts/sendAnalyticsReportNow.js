'use strict';

require('dotenv').config();
const { createDiscordClient } = require('../bot/client');
const { sendDailyReport } = require('../bot/services/serverDailyAnalyticsService');
const logger = require('../utils/logger');

async function main() {
  const token = process.env.TOKEN;
  if (!token) {
    console.error('TOKEN bulunamadı!');
    process.exit(1);
  }

  const client = createDiscordClient();

  client.once('ready', async () => {
    logger.success(`Bot hazır olarak giriş yaptı: ${client.user.tag}`);
    try {
      logger.info('Hedef kanala (1544400099004784700) analiz raporu ve butonlar gönderiliyor...');
      const result = await sendDailyReport(client);
      if (result) {
        logger.success('✅ Rapor başarıyla gönderildi!');
      } else {
        logger.error('❌ Rapor gönderilemedi (kanal bulunamadı veya yetki yetersiz).');
      }
    } catch (err) {
      logger.error('Rapor gönderirken hata:', err);
    } finally {
      setTimeout(() => {
        client.destroy();
        process.exit(0);
      }, 3000);
    }
  });

  await client.login(token);
}

main().catch(err => {
  console.error('Çalıştırma hatası:', err);
  process.exit(1);
});
