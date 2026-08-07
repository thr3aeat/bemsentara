'use strict';

const { ChannelType } = require('discord.js');

const TARGET_GUILD_ID = '1367646464804655104';

/**
 * Formats CATEGORY names in the target guild on startup:
 * - Converts all text in Category channel names to UPPERCASE (tr-TR).
 * - Format: If emoji exists: "[emoji] → [UPPERCASE NAME]" or "[UPPERCASE NAME]".
 * - Reverts accidentally modified text/voice channel names if needed.
 * 
 * @param {Client} client - The Discord.js client instance
 */
async function formatGuildChannelNames(client) {
  try {
    const guild = await client.guilds.fetch(TARGET_GUILD_ID).catch(() => null);
    if (!guild) {
      console.warn(`[channelAestheticsService] Target guild ${TARGET_GUILD_ID} not found. Skipping channel check.`);
      return;
    }

    console.log(`[channelAestheticsService] 🔍 Starting category UPPERCASE formatting for guild: ${guild.name} (${TARGET_GUILD_ID})`);

    const channels = await guild.channels.fetch().catch((err) => {
      console.error(`[channelAestheticsService] Failed to fetch channels for guild ${guild.name}:`, err.message);
      return null;
    });

    if (!channels || channels.size === 0) {
      console.log('[channelAestheticsService] No channels found or failed to fetch.');
      return;
    }

    let categoryCount = 0;
    let revertedCount = 0;

    for (const [channelId, channel] of channels.entries()) {
      if (!channel || typeof channel.setName !== 'function') continue;

      const name = channel.name;
      if (!name) continue;

      // 1. METİN VE SES KANALLARI:
      // Yanlışlıkla eklenmiş "→" işaretlerini temizle
      if (channel.type !== ChannelType.GuildCategory) {
        if (name.includes('→')) {
          const revertedName = name
            .replace(/-*→-*/g, (match, offset, string) => {
              const nextChar = string[offset + match.length];
              if (nextChar && /[a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/.test(nextChar)) {
                return '-';
              }
              return '';
            })
            .replace(/--+/g, '-')
            .replace(/^-+|-+$/g, '');

          if (revertedName && revertedName !== name) {
            console.log(`[channelAestheticsService] ↩️ Reverting text/voice channel "${name}" back to "${revertedName}"`);
            await channel.setName(revertedName)
              .then(() => { revertedCount++; })
              .catch((err) => console.error(`[channelAestheticsService] Failed to revert channel "${name}":`, err.message));

            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        continue;
      }

      // 2. KATEGORİ KANALLARI (GuildCategory):
      // Tüm kategorilerdeki metni TÜRKÇE BÜYÜK HARFE çevir!
      const match = name.match(/^([\p{Extended_Pictographic}\p{Emoji_Presentation}\ufe0f\u200d]+)(.*)$/u);
      
      let emoji = '';
      let rest = name;

      if (match) {
        emoji = match[1];
        rest = match[2];
      }

      // Leading space, hyphens, and arrow characters clean
      const cleanRest = rest.replace(/^[\s\-_→\->]+/, '').trim();
      const upperRest = cleanRest.toLocaleUpperCase('tr-TR');

      let newName = name;
      if (emoji) {
        newName = `${emoji} → ${upperRest}`;
      } else {
        newName = upperRest;
      }

      if (newName && newName !== name) {
        console.log(`[channelAestheticsService] 🔄 Renaming category "${name}" to UPPERCASE "${newName}"`);
        await channel.setName(newName)
          .then(() => { categoryCount++; })
          .catch((err) => console.error(`[channelAestheticsService] Failed to rename category "${name}":`, err.message));

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`[channelAestheticsService] ✅ Process completed. Uppercased ${categoryCount} categories, reverted ${revertedCount} text/voice channels.`);
  } catch (err) {
    console.error('[channelAestheticsService] Critical error during channel execution:', err.message);
  }
}

module.exports = {
  formatGuildChannelNames
};
