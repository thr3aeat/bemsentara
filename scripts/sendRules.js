'use strict';

require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { TOKEN } = require('../config');
const { sendEkoYildizRules, RULES_CHANNEL_ID } = require('../bot/services/rulesService');

async function main() {
  if (!TOKEN) {
    console.error('❌ TOKEN bulunamadı!');
    process.exit(1);
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
  });

  client.once('ready', async () => {
    console.log(`🤖 Bot giriş yaptı: ${client.user.tag}`);
    try {
      const ok = await sendEkoYildizRules(client, RULES_CHANNEL_ID, { forceNew: true });
      if (ok) {
        console.log('✅ Kurallar mesajı Discord Components V2 formatında başarıyla gönderildi!');
      } else {
        console.error('❌ Kurallar gönderilemedi.');
      }
    } catch (err) {
      console.error('❌ Gönderim sırasında hata:', err);
    } finally {
      process.exit(0);
    }
  });

  await client.login(TOKEN);
}

main();
