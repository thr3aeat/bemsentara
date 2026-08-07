'use strict';

const axios = require('axios');
const { ChannelType } = require('discord.js');

const GUILD_ID = '1367646464804655104';
const VOICE_CHANNEL_ID = '1535296197017997343';

/**
 * Parses subscriber/follower count string (e.g. "7,42 bin abone", "12.5K", "1,5 M", "150") into integer.
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

// Memory cache of last known positive follower counts to ensure website stability even if platforms block requests
const lastKnownCounts = {
  youtube2: 7420,
  youtube1: 1910,
  tiktok: 150,
  kick: 0,
  twitch: 0,
  instagram1: 180,
  instagram2: 72
};

let lastChannelRenameTimestamp = 0;
const TEN_MINUTES_MS = 10 * 60 * 1000;

function getSocialStats() {
  const total = Object.values(lastKnownCounts).reduce((a, b) => a + b, 0);
  return {
    ...lastKnownCounts,
    total,
    lastUpdated: new Date()
  };
}

/**
 * Scrapes/fetches follower counts from specified social media platforms with fallback logging.
 */
async function fetchTotalSocialFollowers() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
  };

  console.log('[socialStatsService] 🔄 Fetching live social media statistics...');

  // 1. YouTube - @eko8yildiz
  try {
    const res = await axios.get('https://www.youtube.com/@eko8yildiz', { headers, timeout: 8000 });
    const match = res.data.match(/"subscriberCountText":\s*\{[^}]*"simpleText":"([^"]+)"/i) ||
      res.data.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/i) ||
      res.data.match(/<meta itemprop="interactionCount" content="(\d+)"/i) ||
      res.data.match(/(\d[\d.,]*\s*(?:bin|k|b|mn|m|milyon|thousand|million)?)\s*abone/i);
    const count = match ? parseCount(match[1]) : 0;
    if (count > 0) {
      lastKnownCounts.youtube1 = count;
      console.log(`[YouTube 1 OK]: ${count.toLocaleString('tr-TR')} aboneye ulaşıldı.`);
    } else {
      console.warn(`[YouTube 1 Warning]: Regex eşleşmedi. Son geçerli değer korundu (${lastKnownCounts.youtube1}).`);
    }
  } catch (err) {
    console.warn(`[YouTube 1 Error]: ${err.message}. Son geçerli değer korundu (${lastKnownCounts.youtube1}).`);
  }

  // 2. YouTube - @eko8yildiz2
  try {
    const res = await axios.get('https://www.youtube.com/@eko8yildiz2', { headers, timeout: 8000 });
    const match = res.data.match(/"subscriberCountText":\s*\{[^}]*"simpleText":"([^"]+)"/i) ||
      res.data.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/i) ||
      res.data.match(/<meta itemprop="interactionCount" content="(\d+)"/i) ||
      res.data.match(/(\d[\d.,]*\s*(?:bin|k|b|mn|m|milyon|thousand|million)?)\s*abone/i);
    const count = match ? parseCount(match[1]) : 0;
    if (count > 0) {
      lastKnownCounts.youtube2 = count;
      console.log(`[YouTube 2 OK]: ${count.toLocaleString('tr-TR')} aboneye ulaşıldı.`);
    } else {
      console.warn(`[YouTube 2 Warning]: Regex eşleşmedi. Son geçerli değer korundu (${lastKnownCounts.youtube2}).`);
    }
  } catch (err) {
    console.warn(`[YouTube 2 Error]: ${err.message}. Son geçerli değer korundu (${lastKnownCounts.youtube2}).`);
  }

  // 3. TikTok - @kimdirbueko
  try {
    const res = await axios.get('https://www.tiktok.com/@kimdirbueko', { headers, timeout: 8000 });
    const match = res.data.match(/"followerCount":(\d+)/i) ||
      res.data.match(/"stats":\{"followerCount":(\d+)/i) ||
      res.data.match(/(\d[\d.,]*\s*(?:bin|k|b|mn|m|milyon)?)\s*Followers/i);
    const count = match ? parseCount(match[1]) : 0;
    if (count > 0) {
      lastKnownCounts.tiktok = count;
      console.log(`[TikTok OK]: ${count.toLocaleString('tr-TR')} takipçiye ulaşıldı.`);
    } else {
      console.warn(`[TikTok Warning]: Engellendi veya Regex eşleşmedi. Son geçerli değer korundu (${lastKnownCounts.tiktok}).`);
    }
  } catch (err) {
    console.warn(`[TikTok Error]: ${err.message}. Son geçerli değer korundu (${lastKnownCounts.tiktok}).`);
  }

  // 4. Kick - ekoyildiz
  try {
    const res = await axios.get('https://kick.com/api/v2/channels/ekoyildiz', { headers, timeout: 8000 });
    const count = res.data?.followers_count || res.data?.followersCount || 0;
    if (count > 0) {
      lastKnownCounts.kick = count;
      console.log(`[Kick OK]: ${count.toLocaleString('tr-TR')} takipçiye ulaşıldı.`);
    } else {
      console.warn(`[Kick Warning]: Yanıt alınamadı. Son geçerli değer korundu (${lastKnownCounts.kick}).`);
    }
  } catch (err) {
    console.warn(`[Kick Error]: ${err.message}. Son geçerli değer korundu (${lastKnownCounts.kick}).`);
  }

  // 5. Twitch - ekoyildiz
  try {
    const res = await axios.get('https://www.twitch.tv/ekoyildiz', { headers, timeout: 8000 });
    const match = res.data.match(/"followers":\{"totalCount":(\d+)\}/i) ||
      res.data.match(/"totalCount":(\d+)/i);
    const count = match ? parseInt(match[1], 10) : 0;
    if (count > 0) {
      lastKnownCounts.twitch = count;
      console.log(`[Twitch OK]: ${count.toLocaleString('tr-TR')} takipçiye ulaşıldı.`);
    } else {
      console.warn(`[Twitch Warning]: Regex eşleşmedi. Son geçerli değer korundu (${lastKnownCounts.twitch}).`);
    }
  } catch (err) {
    console.warn(`[Twitch Error]: ${err.message}. Son geçerli değer korundu (${lastKnownCounts.twitch}).`);
  }

  // 6. Instagram - ekonqt
  try {
    const res = await axios.get('https://www.instagram.com/ekonqt/', { headers, timeout: 8000 });
    const match = res.data.match(/"edge_followed_by":\{"count":(\d+)\}/i) ||
      res.data.match(/(\d[\d.,KMB]*)\s*Followers/i);
    const count = match ? parseCount(match[1]) : 0;
    if (count > 0) {
      lastKnownCounts.instagram1 = count;
      console.log(`[Instagram 1 OK]: ${count.toLocaleString('tr-TR')} takipçiye ulaşıldı.`);
    } else {
      console.warn(`[Instagram 1 Warning]: Engellendi veya Regex eşleşmedi. Son geçerli değer korundu (${lastKnownCounts.instagram1}).`);
    }
  } catch (err) {
    console.warn(`[Instagram 1 Error]: ${err.message}. Son geçerli değer korundu (${lastKnownCounts.instagram1}).`);
  }

  // 7. Instagram - egee7dino
  try {
    const res = await axios.get('https://www.instagram.com/egee7dino/', { headers, timeout: 8000 });
    const match = res.data.match(/"edge_followed_by":\{"count":(\d+)\}/i) ||
      res.data.match(/(\d[\d.,KMB]*)\s*Followers/i);
    const count = match ? parseCount(match[1]) : 0;
    if (count > 0) {
      lastKnownCounts.instagram2 = count;
      console.log(`[Instagram 2 OK]: ${count.toLocaleString('tr-TR')} takipçiye ulaşıldı.`);
    } else {
      console.warn(`[Instagram 2 Warning]: Engellendi veya Regex eşleşmedi. Son geçerli değer korundu (${lastKnownCounts.instagram2}).`);
    }
  } catch (err) {
    console.warn(`[Instagram 2 Error]: ${err.message}. Son geçerli değer korundu (${lastKnownCounts.instagram2}).`);
  }

  const totalFollowers = Object.values(lastKnownCounts).reduce((a, b) => a + b, 0);
  console.log('[socialStatsService] 📊 Toplam Takipçi/Abone Sayısı:', totalFollowers.toLocaleString('tr-TR'));
  return totalFollowers;
}

/**
 * Updates the target voice channel name to "[TOTAL]+ adet Ekocan'ın evi."
 * Enforces Discord API Rate-Limit protection (max 2 renames per 10 minutes).
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

    if (channel.name === newName) {
      console.log('[socialStatsService] Ses kanalı ismi zaten güncel.');
      return;
    }

    const now = Date.now();
    if (lastChannelRenameTimestamp > 0 && (now - lastChannelRenameTimestamp) < TEN_MINUTES_MS) {
      const minutesLeft = Math.ceil((TEN_MINUTES_MS - (now - lastChannelRenameTimestamp)) / 1000 / 60);
      console.log(`[socialStatsService] ⏳ Discord Rate-Limit Koruması: Kanal en son yakın zamanda güncellendi. ${minutesLeft} dakika sonra tekrar denenecek.`);
      return;
    }

    console.log(`[socialStatsService] 🔄 Kanal ismi güncelleniyor: "${channel.name}" ➔ "${newName}"`);
    await channel.setName(newName);
    lastChannelRenameTimestamp = now;
    console.log('[socialStatsService] ✅ Ses kanalı ismi başarıyla güncellendi.');
  } catch (err) {
    console.error('[socialStatsService] Error updating voice channel stats:', err.message);
  }
}

/**
 * Starts the scheduler:
 * - Schedules daily execution ONLY at 07:00 AM (Istanbul / GMT+3)
 */
function startSocialStatsScheduler(client) {
  // Schedule daily execution at 07:00 AM GMT+3 (04:00 UTC)
  function scheduleDaily7AM() {
    const now = new Date();
    const target = new Date(now);
    target.setUTCHours(4, 0, 0, 0); // 07:00 GMT+3 = 04:00 UTC

    if (target <= now) {
      target.setUTCDate(target.getUTCDate() + 1);
    }

    const delay = target.getTime() - now.getTime();
    console.log(`[socialStatsService] ⏰ Takipçi güncellemesi günlük 07:00 AM'de çalışacak. Sonraki kontrol ${Math.round(delay / 1000 / 60)} dakika sonra.`);

    setTimeout(async () => {
      try {
        await updateSocialStatsChannel(client);
      } catch (err) {
        console.error('[socialStatsService] Daily 07:00 update error:', err.message);
      }
      scheduleDaily7AM();
    }, delay);
  }

  scheduleDaily7AM();
}

module.exports = {
  fetchTotalSocialFollowers,
  updateSocialStatsChannel,
  startSocialStatsScheduler,
  getSocialStats
};
