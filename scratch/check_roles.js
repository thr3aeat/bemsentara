const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', async () => {
  try {
    const guild = await client.guilds.fetch('1367646464804655104');
    console.log('Guild:', guild.name);

    console.log('\n--- CHANNELS ---');
    const channels = await guild.channels.fetch();
    for (const [id, ch] of channels) {
      if (!ch) continue;
      // GuildVoice = 2, GuildCategory = 4, GuildStageVoice = 13
      if (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildCategory || ch.type === ChannelType.GuildStageVoice) {
        console.log(`[Type ${ch.type}] ${ch.name} (${ch.id}) | Parent: ${ch.parentId}`);
      }
    }

    console.log('\n--- TARGET ROLE ---');
    const targetRole = await guild.roles.fetch('1546577772724359239');
    if (targetRole) {
      console.log(`Role: ${targetRole.name} (${targetRole.id}), pos: ${targetRole.position}`);
      console.log('Current Perms:', targetRole.permissions.toArray());
    }

    console.log('\n--- OTHER NOTABLE ROLES ---');
    const roles = await guild.roles.fetch();
    for (const [id, r] of roles) {
      if (r.name.toLowerCase().includes('ekip') || r.name.toLowerCase().includes('video') || r.name.toLowerCase().includes('yetkili') || r.name.toLowerCase().includes('mod') || r.name.toLowerCase().includes('özel')) {
        console.log(`Role: ${r.name} (${r.id}) -> Perms: ${r.permissions.toArray().join(', ')}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.TOKEN);
