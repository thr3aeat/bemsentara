'use strict';

const { ChannelType } = require('discord.js');

const TARGET_GUILD_ID = '1367646464804655104';

/**
 * Formats CATEGORY names in the target guild on startup AND reverts non-category channels.
 * - Non-category channels (metin/ses kanalları): Eğer isimlerinde "→" veya "-→-" kalmışsa eski hallerine (örn. "📩-talepler") GERİ ÇEVİRİR.
 * - Category channels (Kategoriler): Başında emoji varsa ve "→" yoksa "[emoji] → [ad]" şeklinde biçimlendirir.
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

    console.log(`[channelAestheticsService] 🔍 Starting channel check & category formatting for guild: ${guild.name} (${TARGET_GUILD_ID})`);

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

    for (const [channelId, channel] of channels) {
      if (!channel || typeof channel.setName !== 'function') continue;

      const name = channel.name;
      if (!name) continue;

      // 1. KATEGORİ DIŞINDAKİ KANALLAR (METİN/SES KANALLARI):
      // Yanlışlıkla eklenmiş "→" veya "-→-" işaretlerini temizleyip kanalı eski haline geri döndür!
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
            console.log(`[channelAestheticsService] ↩️ Reverting text/voice channel "${name}" back to "${revertedName}" in ${guild.name}`);
            await channel.setName(revertedName)
              .then(() => {
                revertedCount++;
              })
              .catch((err) => {
                console.error(`[channelAestheticsService] Failed to revert channel "${name}":`, err.message);
              });

            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        continue;
      }

      // 2. KATEGORİ KANALLARI (GuildCategory):
      // Emoji varsa ve "→" yoksa "[emoji] → [ad]" formatına getir.
      const match = name.match(/^([\p{Extended_Pictographic}\p{Emoji_Presentation}\ufe0f\u200d]+)(.*)$/u);
      
      if (match) {
        const emoji = match[1];
        const rest = match[2];
        
        // Leading space, hyphens, and arrow characters clean
        const cleanRest = rest.replace(/^[\s\-_→\->]+/, '').trim();
        
        if (cleanRest && !name.includes('→')) {
          const newName = `${emoji} → ${cleanRest}`;
          
          console.log(`[channelAestheticsService] 🔄 Renaming category "${name}" to "${newName}" in ${guild.name}`);
          
          await channel.setName(newName)
            .then(() => {
              categoryCount++;
            })
            .catch((err) => {
              console.error(`[channelAestheticsService] Failed to rename category "${name}":`, err.message);
            });

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    console.log(`[channelAestheticsService] ✅ Process completed. Formatted ${categoryCount} categories, reverted ${revertedCount} text/voice channels.`);
  } catch (err) {
    console.error('[channelAestheticsService] Critical error during channel execution:', err.message);
  }
}

module.exports = {
  formatGuildChannelNames
};
