'use strict';

const axios = require('axios');
const { ChannelType } = require('discord.js');

const GUILD_ID = '1367646464804655104';
const VOICE_CHANNEL_ID = '1535296197017997343';

/**
 * Parses subscriber/follower count string (e.g. "7.42 thousand", "12.5K", "1,5 M", "150") into integer.
 */
function parseCount(str) {
  if (!str) return 0;
  
  const mMatch = str.match(/([\d.,]+)\s*(million|m|mn|milyon)/i);
  if (mMatch) {
    const val = parseFloat(mMatch[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  const kMatch = str.match(/([\d.,]+)\s*(thousand|k|b|bin)/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  const pureNum = parseInt(str.replace(/[^0-9]/g, ''), 10);
  return isNaN(pureNum) ? 0 : pureNum;
}

/**
 * Scrapes/fetches follower counts from specified social media platforms.
 */
async function fetchTotalSocialFollowers() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8'
  };

  let totalFollowers = 0;
  const platformCounts = {};

  // 1. YouTube - @eko8yildiz
  try {
    const res = await axios.get('https://www.youtube.com/@eko8yildiz', { headers, timeout: 8000 });
    const match = res.data.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/i) ||
                  res.data.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/i);
    const count = parseCount(match ? match[1] : '');
    platformCounts.youtube1 = count;
    totalFollowers += count;
  } catch (err) {
    console.warn('[socialStatsService] YouTube @eko8yildiz fetch warning:', err.message);
  }

  // 2. YouTube - @eko8yildiz2
  try {
    const res = await axios.get('https://www.youtube.com/@eko8yildiz2', { headers, timeout: 8000 });
    const match = res.data.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/i) ||
                  res.data.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/i);
    const count = parseCount(match ? match[1] : '');
    platformCounts.youtube2 = count;
    totalFollowers += count;
  } catch (err) {
    console.warn('[socialStatsService] YouTube @eko8yildiz2 fetch warning:', err.message);
  }

  // 3. TikTok - @kimdirbueko
  try {
    const res = await axios.get('https://www.tiktok.com/@kimdirbueko', { headers, timeout: 8000 });
    const match = res.data.match(/"followerCount":(\d+)/i) || res.data.match(/"stats":\{"followerCount":(\d+)/i);
    const count = match ? parseInt(match[1], 10) : 0;
    platformCounts.tiktok = count;
    totalFollowers += count;
  } catch (err) {
    console.warn('[socialStatsService] TikTok fetch warning:', err.message);
  }

  // 4. Kick - ekoyildiz
  try {
    const res = await axios.get('https://kick.com/ekoyildiz', { headers, timeout: 8000 });
    const match = res.data.match(/"followers_count":(\d+)/i) || res.data.match(/"followersCount":(\d+)/i);
    const count = match ? parseInt(match[1], 10) : 0;
    platformCounts.kick = count;
    totalFollowers += count;
  } catch (err) {
    console.warn('[socialStatsService] Kick fetch warning:', err.message);
  }

  // 5. Twitch - ekoyildiz
  try {
    const res = await axios.get('https://www.twitch.tv/ekoyildiz', { headers, timeout: 8000 });
    const match = res.data.match(/"followers":\{"totalCount":(\d+)\}/i) || res.data.match(/"totalCount":(\d+)/i);
    const count = match ? parseInt(match[1], 10) : 0;
    platformCounts.twitch = count;
    totalFollowers += count;
  } catch (err) {
    console.warn('[socialStatsService] Twitch fetch warning:', err.message);
  }

  // 6. Instagram - ekonqt
  try {
    const res = await axios.get('https://www.instagram.com/ekonqt/', { headers, timeout: 8000 });
    const match = res.data.match(/"edge_followed_by":\{"count":(\d+)\}/i) ||
                  res.data.match(/(\d[\d.,KMB]*)\s*Followers/i);
    const count = match ? parseCount(match[1]) : 0;
    platformCounts.instagram1 = count;
    totalFollowers += count;
  } catch (err) {
    console.warn('[socialStatsService] Instagram @ekonqt fetch warning:', err.message);
  }

  // 7. Instagram - egee7dino
  try {
    const res = await axios.get('https://www.instagram.com/egee7dino/', { headers, timeout: 8000 });
    const match = res.data.match(/"edge_followed_by":\{"count":(\d+)\}/i) ||
                  res.data.match(/(\d[\d.,KMB]*)\s*Followers/i);
    const count = match ? parseCount(match[1]) : 0;
    platformCounts.instagram2 = count;
    totalFollowers += count;
  } catch (err) {
    console.warn('[socialStatsService] Instagram @egee7dino fetch warning:', err.message);
  }

  console.log('[socialStatsService] Fetched follower counts:', platformCounts, '| TOTAL:', totalFollowers);
  return totalFollowers;
}

/**
 * Updates the target voice channel name to "[TOTAL]+ adet Ekocan'ın evi."
 */
async function updateSocialStatsChannel(client) {
  try {
    const channel = await client.channels.fetch(VOICE_CHANNEL_ID).catch(() => null);
    if (!channel) {
      console.warn(`[socialStatsService] Target voice channel ${VOICE_CHANNEL_ID} not found.`);
      return;
    }

    const totalFollowers = await fetchTotalSocialFollowers();
    if (totalFollowers <= 0) {
      console.warn('[socialStatsService] Total followers calculated as 0, skipping channel rename to prevent error.');
      return;
    }

    const formattedNum = totalFollowers.toLocaleString('tr-TR');
    const newName = `${formattedNum}+ adet Ekocan'ın evi.`;

    if (channel.name !== newName) {
      console.log(`[socialStatsService] 🔄 Updating channel name from "${channel.name}" to "${newName}"`);
      await channel.setName(newName);
      console.log('[socialStatsService] ✅ Voice channel name updated successfully.');
    } else {
      console.log('[socialStatsService] Voice channel name is already up to date.');
    }
  } catch (err) {
    console.error('[socialStatsService] Error updating voice channel stats:', err.message);
  }
}

/**
 * Starts the scheduler:
 * - Runs once on startup
 * - Schedules daily execution at 07:00 AM (Istanbul / GMT+3)
 */
function startSocialStatsScheduler(client) {
  // 1. Run once on bot startup (ready)
  setTimeout(() => {
    updateSocialStatsChannel(client).catch((err) => {
      console.error('[socialStatsService] Startup update error:', err.message);
    });
  }, 10000);

  // 2. Schedule daily execution at 07:00 AM GMT+3
  function scheduleDaily7AM() {
    const now = new Date();
    // Istanbul is GMT+3
    const target = new Date(now);
    target.setUTCHours(4, 0, 0, 0); // 07:00 GMT+3 = 04:00 UTC

    if (target <= now) {
      target.setUTCDate(target.getUTCDate() + 1);
    }

    const delay = target.getTime() - now.getTime();
    console.log(`[socialStatsService] Next 07:00 AM update scheduled in ${Math.round(delay / 1000 / 60)} minutes.`);

    setTimeout(async () => {
      try {
        await updateSocialStatsChannel(client);
      } catch (err) {
        console.error('[socialStatsService] Daily 07:00 update error:', err.message);
      }
      scheduleDaily7AM(); // Re-schedule for next day
    }, delay);
  }

  scheduleDaily7AM();
}

module.exports = {
  fetchTotalSocialFollowers,
  updateSocialStatsChannel,
  startSocialStatsScheduler
};
