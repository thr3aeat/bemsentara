const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', async () => {
  try {
    const guild = await client.guilds.fetch('1367646464804655104');
    const channels = await guild.channels.fetch();
    console.log('=== ALL VOICE CHANNELS ===');
    for (const [id, ch] of channels) {
      if (!ch || ch.type !== ChannelType.GuildVoice) continue;
      console.log(`\nVoice Channel: "${ch.name}" (${ch.id}) | Category: ${ch.parent ? ch.parent.name : 'None'}`);
      for (const [owId, ow] of ch.permissionOverwrites.cache) {
        const role = guild.roles.cache.get(owId);
        console.log(`  Overwrite: ${role ? role.name : owId} (${owId}) -> Allow: [${ow.allow.toArray().join(', ')}], Deny: [${ow.deny.toArray().join(', ')}]`);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.TOKEN);
