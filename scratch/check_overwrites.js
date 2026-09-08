const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', async () => {
  try {
    const guild = await client.guilds.fetch('1367646464804655104');
    const channels = await guild.channels.fetch();
    
    console.log('=== VOICE & SPECIAL CHANNELS PERMISSIONS OVERWRITES ===');
    for (const [id, ch] of channels) {
      if (!ch) continue;
      if (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice || ch.type === ChannelType.GuildCategory) {
        const overwrites = ch.permissionOverwrites.cache;
        console.log(`\nChannel: [${ch.type}] "${ch.name}" (${ch.id})`);
        for (const [owId, ow] of overwrites) {
          const roleOrMember = ow.type === 0 ? guild.roles.cache.get(owId)?.name : 'User';
          console.log(`  Overwrite: ${ow.type === 0 ? 'Role' : 'Member'} ${roleOrMember || owId}: Allow=[${ow.allow.toArray().join(', ')}], Deny=[${ow.deny.toArray().join(', ')}]`);
        }
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.TOKEN);
