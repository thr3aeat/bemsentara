const { Client, GatewayIntentBits, Partials } = require("discord.js");

function createDiscordClient() {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildPresences,
    ],
    // DM mesajları için partials zorunlu
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.User,
    ],
    rest: {
      // Discord.js varsayılan akıllı kuyruk yönetimi (Rate limit alınırsa otomatik bekler ve tekrar dener)
      retries: 3,
      timeout: 15000,
    },
  });
}

module.exports = { createDiscordClient };
