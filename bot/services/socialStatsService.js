'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const { ChannelType } = require('discord.js');

const GUILD_ID = '1367646464804655104';
const VOICE_CHANNEL_ID = '1535296197017997343';
const CACHE_FILE_PATH = path.resolve(__dirname, '../../data/social_stats_cache.json');
const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parses subscriber/follower count string (e.g. "7,42 bin abone", "12.5K", "1,5 M", "150") into integer.
 */
function parseCount(str) {
  if (!str) return 0;
  const cleanStr = String(str).trim();

  const mMatch = cleanStr.match(/([\d.,]+)\s*(?:million|m|mn|milyon)/i);
  if (mMatch) {
    const val = parseFloat(mMatch[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  const kMatch = cleanStr.match(/([\d.,]+)\s*(?:thousand|k|b|bin)/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  const pureNum = parseInt(cleanStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(pureNum) ? 0 : pureNum;
}

// Memory cache of last known positive follower counts
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

/**
 * Load persistent state from cache file
 */
function loadState() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
      if (data.lastKnownCounts) {
        Object.assign(lastKnownCounts, data.lastKnownCounts);
      }
      return data;
    }
  } catch (err) {
    console.warn('[socialStatsService] Cache okuma hatası:', err.message);
  }
  return {
    lastTotal: 0,
    highestMilestone: 0,
    starActiveUntil: 0,
    lastKnownCounts: { ...lastKnownCounts }
  };
}

/**
 * Save persistent state to cache file
 */
function saveState(state) {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.warn('[socialStatsService] Cache kaydetme hatası:', err.message);
  }
}

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

  console.log('[socialStatsService] 🔄 Canlı sosyal medya istatistikleri taranıyor...');

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
      console.log(`[YouTube 1 OK]: ${count.toLocaleString('tr-TR')} abone.`);
    }
  } catch (err) {
    console.warn(`[YouTube 1]: ${err.message}. Son değer korundu (${lastKnownCounts.youtube1}).`);
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
      console.log(`[YouTube 2 OK]: ${count.toLocaleString('tr-TR')} abone.`);
    }
  } catch (err) {
    console.warn(`[YouTube 2]: ${err.message}. Son değer korundu (${lastKnownCounts.youtube2}).`);
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
      console.log(`[TikTok OK]: ${count.toLocaleString('tr-TR')} takipçi.`);
    }
  } catch (err) {
    console.warn(`[TikTok]: ${err.message}. Son değer korundu (${lastKnownCounts.tiktok}).`);
  }

  // 4. Kick - ekoyildiz
  try {
    const res = await axios.get('https://kick.com/api/v2/channels/ekoyildiz', { headers, timeout: 8000 });
    const count = res.data?.followers_count || res.data?.followersCount || 0;
    if (count > 0) {
      lastKnownCounts.kick = count;
      console.log(`[Kick OK]: ${count.toLocaleString('tr-TR')} takipçi.`);
    }
  } catch (err) {
    console.warn(`[Kick]: ${err.message}. Son değer korundu (${lastKnownCounts.kick}).`);
  }

  // 5. Twitch - ekoyildiz
  try {
    const res = await axios.get('https://www.twitch.tv/ekoyildiz', { headers, timeout: 8000 });
    const match = res.data.match(/"followers":\{"totalCount":(\d+)\}/i) ||
      res.data.match(/"totalCount":(\d+)/i);
    const count = match ? parseInt(match[1], 10) : 0;
    if (count > 0) {
      lastKnownCounts.twitch = count;
      console.log(`[Twitch OK]: ${count.toLocaleString('tr-TR')} takipçi.`);
    }
  } catch (err) {
    console.warn(`[Twitch]: ${err.message}. Son değer korundu (${lastKnownCounts.twitch}).`);
  }

  // 6. Instagram - ekonqt
  try {
    const res = await axios.get('https://www.instagram.com/ekonqt/', { headers, timeout: 8000 });
    const match = res.data.match(/"edge_followed_by":\{"count":(\d+)\}/i) ||
      res.data.match(/(\d[\d.,KMB]*)\s*Followers/i);
    const count = match ? parseCount(match[1]) : 0;
    if (count > 0) {
      lastKnownCounts.instagram1 = count;
      console.log(`[Instagram 1 OK]: ${count.toLocaleString('tr-TR')} takipçi.`);
    }
  } catch (err) {
    console.warn(`[Instagram 1]: ${err.message}. Son değer korundu (${lastKnownCounts.instagram1}).`);
  }

  // 7. Instagram - egee7dino
  try {
    const res = await axios.get('https://www.instagram.com/egee7dino/', { headers, timeout: 8000 });
    const match = res.data.match(/"edge_followed_by":\{"count":(\d+)\}/i) ||
      res.data.match(/(\d[\d.,KMB]*)\s*Followers/i);
    const count = match ? parseCount(match[1]) : 0;
    if (count > 0) {
      lastKnownCounts.instagram2 = count;
      console.log(`[Instagram 2 OK]: ${count.toLocaleString('tr-TR')} takipçi.`);
    }
  } catch (err) {
    console.warn(`[Instagram 2]: ${err.message}. Son değer korundu (${lastKnownCounts.instagram2}).`);
  }

  const totalFollowers = Object.values(lastKnownCounts).reduce((a, b) => a + b, 0);
  console.log('[socialStatsService] 📊 Toplam Takipçi/Abone:', totalFollowers.toLocaleString('tr-TR'));
  return totalFollowers;
}

/**
 * Updates the target voice channel name:
 * - When milestone (500 / 1000 step) is crossed: "⭐ [TOTAL]+ adet Ekocan'ın evi." (lasts for 24 hours)
 * - Standard name: "[TOTAL]+ adet Ekocan'ın evi."
 * - Enforces Discord API Rate-Limit protection (max 2 renames per 10 minutes).
 */
async function updateSocialStatsChannel(client) {
  try {
    const channel = await client.channels.fetch(VOICE_CHANNEL_ID).catch(() => null);
    if (!channel) {
      console.warn(`[socialStatsService] Hedef ses kanalı ${VOICE_CHANNEL_ID} bulunamadı.`);
      return;
    }

    const totalFollowers = await fetchTotalSocialFollowers();
    if (totalFollowers <= 0) {
      console.warn('[socialStatsService] Takipçi sayısı 0 hesaplandı, kanal ismi değiştirilmedi.');
      return;
    }

    const state = loadState();
    const now = Date.now();

    // Determine 500 / 1000 milestone jump
    const currentMilestoneFloor = Math.floor(totalFollowers / 500) * 500;
    const isFirstTime = !state.highestMilestone || state.highestMilestone === 0;

    let hasNewMilestone = false;
    if (isFirstTime) {
      state.highestMilestone = currentMilestoneFloor;
      state.lastTotal = totalFollowers;
    } else if (currentMilestoneFloor > state.highestMilestone) {
      // 500 veya 1000 artış kilometre taşı aşıldı!
      console.log(`[socialStatsService] 🌟 YENİ KİLOMETRE TAŞI (+500/1000): ${currentMilestoneFloor}! Yıldız emojisi 24 saatliğine aktif ediliyor.`);
      state.highestMilestone = currentMilestoneFloor;
      state.starActiveUntil = now + ONE_DAY_MS; // 1 gün (24 saat) boyunca yıldız kalacak
      hasNewMilestone = true;
    }

    // Check if star celebration is currently active
    const isStarActive = state.starActiveUntil && now < state.starActiveUntil;
    const formattedNum = totalFollowers.toLocaleString('tr-TR');

    let newName = '';
    if (isStarActive) {
      newName = `⭐ ${formattedNum}+ adet Ekocan'ın evi.`;
    } else {
      newName = `${formattedNum}+ adet Ekocan'ın evi.`;
    }

    // Update state cache
    state.lastTotal = totalFollowers;
    state.lastKnownCounts = { ...lastKnownCounts };
    state.lastUpdated = now;
    saveState(state);

    if (channel.name === newName) {
      console.log(`[socialStatsService] Ses kanalı ismi zaten güncel: "${channel.name}"`);
      return;
    }

    // Discord Rate-Limit Koruması (10 dakikada en fazla 2 güncelleme)
    if (lastChannelRenameTimestamp > 0 && (now - lastChannelRenameTimestamp) < TEN_MINUTES_MS) {
      const minutesLeft = Math.ceil((TEN_MINUTES_MS - (now - lastChannelRenameTimestamp)) / 1000 / 60);
      console.log(`[socialStatsService] ⏳ Discord Rate-Limit Koruması: Kanal ${minutesLeft} dakika sonra güncellenecek.`);
      return;
    }

    console.log(`[socialStatsService] 🔄 Kanal ismi güncelleniyor: "${channel.name}" ➔ "${newName}"`);
    await channel.setName(newName);
    lastChannelRenameTimestamp = now;
    console.log('[socialStatsService] ✅ Ses kanalı ismi başarıyla güncellendi.');

  } catch (err) {
    console.error('[socialStatsService] Ses kanalı güncelleme hatası:', err.message);
  }
}

/**
 * Starts the 7/24 scheduler:
 * - Runs every 30 minutes seamlessly in background
 * - Daily check at 07:00 AM (Istanbul / GMT+3)
 * - Automatic startup scan after 10 seconds
 */
function startSocialStatsScheduler(client) {
  console.log('[socialStatsService] 🚀 7/24 Sosyal Medya & Ses Kanalı Takipçisi başlatıldı.');

  // Her 30 dakikada bir kontrol et ve kanal durumunu incele
  cron.schedule('*/30 * * * *', async () => {
    try {
      await updateSocialStatsChannel(client);
    } catch (err) {
      console.error('[socialStatsService] 30dk döngü hatası:', err.message);
    }
  });

  // Her sabah saat 07:00'da (GMT+3) kesin kontrol
  cron.schedule('0 7 * * *', async () => {
    try {
      console.log('[socialStatsService] ☀️ Günlük 07:00 sabah güncellemesi yapılıyor...');
      await updateSocialStatsChannel(client);
    } catch (err) {
      console.error('[socialStatsService] 07:00 döngü hatası:', err.message);
    }
  }, { timezone: 'Europe/Istanbul' });

  // Bot açılışından 10 saniye sonra ilk kontrolü gerçekleştir
  setTimeout(() => {
    updateSocialStatsChannel(client).catch(err => {
      console.error('[socialStatsService] Başlangıç tarama hatası:', err.message);
    });
  }, 10000);
}

module.exports = {
  fetchTotalSocialFollowers,
  updateSocialStatsChannel,
  startSocialStatsScheduler,
  getSocialStats
};
