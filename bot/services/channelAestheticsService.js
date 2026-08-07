'use strict';

const TARGET_GUILD_ID = '1367646464804655104';

/**
 * Formats channel names in the target guild on startup.
 * If a channel name starts with an emoji but does not contain a "→" arrow separator,
 * it formats it to: "[emoji] → [name]" (e.g., "📩 Talepler" becomes "📩 → Talepler").
 * 
 * @param {Client} client - The Discord.js client instance
 */
async function formatGuildChannelNames(client) {
  try {
    const guild = await client.guilds.fetch(TARGET_GUILD_ID).catch(() => null);
    if (!guild) {
      console.warn(`[channelAestheticsService] Target guild ${TARGET_GUILD_ID} not found. Skipping channel rename check.`);
      return;
    }

    console.log(`[channelAestheticsService] 🔍 Starting channel name check for guild: ${guild.name} (${TARGET_GUILD_ID})`);

    const channels = await guild.channels.fetch().catch((err) => {
      console.error(`[channelAestheticsService] Failed to fetch channels for guild ${guild.name}:`, err.message);
      return null;
    });

    if (!channels || channels.size === 0) {
      console.log('[channelAestheticsService] No channels found or failed to fetch.');
      return;
    }

    let renamedCount = 0;

    for (const [channelId, channel] of channels) {
      if (!channel || typeof channel.setName !== 'function') continue;

      const name = channel.name;
      if (!name) continue;

      // Regex matches: starts with one or more emoji characters (including variation selectors and zero-width joiners)
      const match = name.match(/^([\p{Extended_Pictographic}\p{Emoji_Presentation}\ufe0f\u200d]+)(.*)$/u);
      
      if (match) {
        const emoji = match[1];
        const rest = match[2];
        
        // Clean the rest of any leading spaces, hyphens, and arrow characters
        const cleanRest = rest.replace(/^[\s\-_→\->]+/, '').trim();
        
        // Only rename if there is some text left and it doesn't already contain a "→" arrow
        if (cleanRest && !name.includes('→')) {
          const newName = `${emoji} → ${cleanRest}`;
          
          console.log(`[channelAestheticsService] 🔄 Renaming "${name}" to "${newName}" in ${guild.name}`);
          
          await channel.setName(newName)
            .then(() => {
              renamedCount++;
            })
            .catch((err) => {
              console.error(`[channelAestheticsService] Failed to rename channel "${name}" to "${newName}":`, err.message);
            });

          // Respect Discord API rate limits by adding a short delay (1 second)
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    console.log(`[channelAestheticsService] ✅ Channel renaming process completed. Renamed ${renamedCount} channels.`);
  } catch (err) {
    console.error('[channelAestheticsService] Critical error during channel renaming:', err.message);
  }
}

module.exports = {
  formatGuildChannelNames
};
