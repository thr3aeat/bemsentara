'use strict';

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { chatWithAI } = require('./aiService');
const YouTubeMilestone = require('../../models/YouTubeMilestone');

const TARGET_CHANNEL_ID = process.env.YOUTUBE_MILESTONE_CHANNEL_ID || '1518692466860101915';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@eko8yildiz';
const LOCAL_BACKUP_FILE = path.resolve(__dirname, '../../data/youtube_milestones_cache.json');

/**
 * Parses numeric strings like "7,41 bin abone", "100.5K", "1.5 M", "50.000" into integer.
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

/**
 * Reads local fallback state if database is unavailable.
 */
function readLocalFallback() {
  try {
    if (fs.existsSync(LOCAL_BACKUP_FILE)) {
      const data = fs.readFileSync(LOCAL_BACKUP_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (_) { }
  return {
    lastSubscribers: 0,
    lastViews: 0,
    reachedSubMilestones: [],
    reachedViewMilestones: []
  };
}

/**
 * Saves local fallback state.
 */
function writeLocalFallback(state) {
  try {
    const dir = path.dirname(LOCAL_BACKUP_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_BACKUP_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (_) { }
}

/**
 * Fetches live YouTube stats for @eko8yildiz.
 */
async function fetchYouTubeChannelStats() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
  };

  let subscribers = 0;
  let views = 0;

  try {
    const res = await fetch(YOUTUBE_CHANNEL_URL, { headers });
    if (res.ok) {
      const html = await res.text();

      // Subscriber count regex
      const subMatch = html.match(/"subscriberCountText":\s*\{[^}]*"simpleText":"([^"]+)"/i) ||
        html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/i) ||
        html.match(/<meta itemprop="interactionCount" content="(\d+)"/i) ||
        html.match(/(\d[\d.,]*\s*(?:bin|k|b|mn|m|milyon|thousand|million)?)\s*abone/i);

      if (subMatch) {
        subscribers = parseCount(subMatch[1]);
      }

      // View count regex
      const viewMatch = html.match(/"viewCountText":\s*\{[^}]*"simpleText":"([^"]+)"/i) ||
        html.match(/"viewCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/i) ||
        html.match(/"viewCount":"(\d+)"/i) ||
        html.match(/(\d[\d.,]*\s*(?:bin|k|b|mn|m|milyon)?)\s*(?:görüntüleme|views)/i);

      if (viewMatch) {
        views = parseCount(viewMatch[1]);
      }
    }
  } catch (err) {
    console.warn('[youtubeMilestoneService] Ana sayfa çekme hatası:', err.message);
  }

  // Also check /about page for total channel view count if main page view count was 0 or low
  if (views <= 0) {
    try {
      const resAbout = await fetch(`${YOUTUBE_CHANNEL_URL}/about`, { headers });
      if (resAbout.ok) {
        const aboutHtml = await resAbout.text();
        const aboutViewMatch = aboutHtml.match(/"viewCountText":\s*\{[^}]*"simpleText":"([^"]+)"/i) ||
          aboutHtml.match(/"viewCount":"(\d+)"/i) ||
          aboutHtml.match(/(\d[\d.,]*)\s*görüntüleme/i);
        if (aboutViewMatch) {
          views = parseCount(aboutViewMatch[1]);
        }
      }
    } catch (_) { }
  }

  return { subscribers, views };
}

/**
 * Pre-recorded high-quality milestone templates (Fallback).
 */
const PRE_RECORDED_TEMPLATES = [
  (milestoneStr) => `:information_source: :star: **EkoYıldız kanalı artık ${milestoneStr} ulaştı! Bu başarı hepimizin başarısı, bu yolda bizimle olan herkese çok çok çok çok çok teşekkür ederiz. Eko bu yola gelirken çok zorlandı, ama buna değdi.**\n\n🎉 Hep birlikte daha büyük başarılara ve yeni rekorlara! Sevgiyle ve sağlıcakla kalın! 🚀`,
  (milestoneStr) => `:information_source: :star: **EkoYıldız kanalı artık ${milestoneStr} ulaştı! Bu başarı hepimizin başarısı, bu yolda bizimle olan herkese çok çok çok çok çok teşekkür ederiz. Eko bu yola gelirken çok zorlandı, ama buna değdi.**\n\n🌟 İlk günden beri desteğini esirgemeyen tüm Eko Yıldız ailesine minnettarız. İyi ki varsınız! 💫`,
  (milestoneStr) => `:information_source: :star: **EkoYıldız kanalı artık ${milestoneStr} ulaştı! Bu başarı hepimizin başarısı, bu yolda bizimle olan herkese çok çok çok çok çok teşekkür ederiz. Eko bu yola gelirken çok zorlandı, ama buna değdi.**\n\n✨ Büyüyen kocaman bir aile olduk. Her beğeni, her yorum ve her destek için sonsuz teşekkürler! 🎈`,
  (milestoneStr) => `:information_source: :star: **EkoYıldız kanalı artık ${milestoneStr} ulaştı! Bu başarı hepimizin başarısı, bu yolda bizimle olan herkese çok çok çok çok çok teşekkür ederiz. Eko bu yola gelirken çok zorlandı, ama buna değdi.**\n\n🔥 Durmak yok, daha güzel içerikler ve efsane maceralar için çalışmaya devam! 💪`
];

/**
 * Generates an inspiring milestone announcement message via AI Service or pre-recorded fallback.
 */
async function generateMilestoneMessage(type, count) {
  const countStr = count.toLocaleString('tr-TR');
  let milestoneStr = '';

  if (type === 'subscribers') {
    milestoneStr = `${countStr} aboneye`;
  } else {
    milestoneStr = `${countStr} izlenmeye`;
  }

  const prompt = `EkoYıldız YouTube kanalı (@eko8yildiz) yeni bir kilometre taşına ulaştı!
Ulaşılan Başarı: ${milestoneStr}
Hedef: Discord sunucusunda (#genel / duyuru) paylaşılmak üzere samimi, duygusal, içten ve coşkulu bir kutlama mesajı yaz.

KESİN KURALLAR:
1. Mesajın İLK CÜMLESİ tam olarak şu şekilde başlamalıdır:
:information_source: :star: **EkoYıldız kanalı artık ${milestoneStr} ulaştı! Bu başarı hepimizin başarısı, bu yolda bizimle olan herkese çok çok çok çok çok teşekkür ederiz. Eko bu yola gelirken çok zorlandı, ama buna değdi.**
2. Altına 1-2 cümlelik topluluğa teşekkür eden, sıcak ve motive edici samimi bir ekleme yap.
3. Asla <think> veya İngilizce not ekleme, sadece doğrudan Discord mesaj metnini döndür.`;

  try {
    const aiResponse = await chatWithAI(
      [{ role: 'user', content: prompt }],
      'Sen EkoYıldız YouTube kanalının ve Discord topluluğunun samimi, içten ve sevilen yapay zeka temsilcisisin.',
      'ticket',
      { max_tokens: 300, temperature: 0.7 }
    );

    if (aiResponse && aiResponse.includes(':information_source:')) {
      return aiResponse.trim();
    }
  } catch (err) {
    console.warn('[youtubeMilestoneService] AI mesaj üretimi başarısız, kayıtlı şablon kullanılıyor:', err.message);
  }

  // Fallback to random pre-recorded template
  const template = PRE_RECORDED_TEMPLATES[Math.floor(Math.random() * PRE_RECORDED_TEMPLATES.length)];
  return template(milestoneStr);
}

/**
 * Calculates crossed milestones based on current numbers.
 * Subscriber milestones: Every 100 subscribers (>=1000) and every 1,000 subscribers.
 * View milestones: 50K, 100K, 150K, 200K, 250K, 500K, 750K, 1M, etc.
 */
function getPassedMilestones(currentVal, reachedList, step = 100) {
  const newMilestones = [];
  if (currentVal <= 0) return newMilestones;

  const currentFloor = Math.floor(currentVal / step) * step;

  // Check from step up to currentFloor
  for (let m = step; m <= currentFloor; m += step) {
    if (!reachedList.includes(m)) {
      newMilestones.push(m);
    }
  }

  return newMilestones;
}

/**
 * Checks YouTube channel stats and posts milestone announcement if crossed.
 */
async function checkYouTubeMilestones(client) {
  try {
    const { subscribers, views } = await fetchYouTubeChannelStats();

    if (subscribers <= 0 && views <= 0) {
      console.log('[youtubeMilestoneService] İstatistikler okunamadı (0 geldi), atlanıyor.');
      return;
    }

    // Load state from DB or local fallback
    let doc = null;
    try {
      doc = await YouTubeMilestone.findOne({ channelHandle: '@eko8yildiz' });
    } catch (_) { }

    let localState = readLocalFallback();

    if (!doc) {
      try {
        doc = new YouTubeMilestone({
          channelHandle: '@eko8yildiz',
          lastSubscribers: localState.lastSubscribers || subscribers,
          lastViews: localState.lastViews || views,
          reachedSubMilestones: localState.reachedSubMilestones || [],
          reachedViewMilestones: localState.reachedViewMilestones || []
        });
      } catch (_) { }
    }

    const reachedSubMilestones = doc ? doc.reachedSubMilestones : localState.reachedSubMilestones;
    const reachedViewMilestones = doc ? doc.reachedViewMilestones : localState.reachedViewMilestones;

    // Determine if this is the very first initialization
    const isFirstInit = (!reachedSubMilestones || reachedSubMilestones.length === 0) &&
      (!doc || doc.lastSubscribers === 0) &&
      localState.lastSubscribers === 0;

    if (isFirstInit) {
      console.log(`[youtubeMilestoneService] İlk kurulum yapılıyor. Mevcut durum baz alınıyor: ${subscribers} Abone, ${views} İzlenme.`);
      const baseSubMilestones = [];
      const baseViewMilestones = [];

      // Mark all past milestones as already reached so we don't spam 50 past milestones at once
      for (let s = 100; s <= subscribers; s += 100) baseSubMilestones.push(s);
      for (let v = 50000; v <= views; v += 50000) baseViewMilestones.push(v);

      if (doc) {
        doc.lastSubscribers = subscribers;
        doc.lastViews = views;
        doc.reachedSubMilestones = baseSubMilestones;
        doc.reachedViewMilestones = baseViewMilestones;
        doc.lastCheckedAt = new Date();
        await doc.save().catch(() => { });
      }

      writeLocalFallback({
        lastSubscribers: subscribers,
        lastViews: views,
        reachedSubMilestones: baseSubMilestones,
        reachedViewMilestones: baseViewMilestones
      });

      return;
    }

    // Calculate new subscriber milestones (100 and 1,000 steps)
    const newSubMilestones = getPassedMilestones(subscribers, reachedSubMilestones, 100);

    // Calculate new view milestones (50,000 steps)
    const newViewMilestones = getPassedMilestones(views, reachedViewMilestones, 50000);

    const channel = await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);

    // 1. Post Subscriber Milestones
    if (newSubMilestones.length > 0) {
      // Pick highest newly achieved milestone to announce
      const highestSubMilestone = Math.max(...newSubMilestones);
      console.log(`[youtubeMilestoneService] 🎉 YENİ ABONE KİLOMETRE TAŞI: ${highestSubMilestone} Abone!`);

      const messageContent = await generateMilestoneMessage('subscribers', highestSubMilestone);

      if (channel && channel.isTextBased()) {
        await channel.send({ content: messageContent }).catch(err => {
          console.error('[youtubeMilestoneService] Kanala mesaj gönderme hatası:', err.message);
        });
      }

      // Mark all new milestones as reached
      for (const m of newSubMilestones) {
        if (!reachedSubMilestones.includes(m)) reachedSubMilestones.push(m);
      }
    }

    // 2. Post View Milestones
    if (newViewMilestones.length > 0) {
      const highestViewMilestone = Math.max(...newViewMilestones);
      console.log(`[youtubeMilestoneService] 🎉 YENİ İZLENME KİLOMETRE TAŞI: ${highestViewMilestone} İzlenme!`);

      const messageContent = await generateMilestoneMessage('views', highestViewMilestone);

      if (channel && channel.isTextBased()) {
        await channel.send({ content: messageContent }).catch(err => {
          console.error('[youtubeMilestoneService] Kanala izlenme mesajı gönderme hatası:', err.message);
        });
      }

      for (const m of newViewMilestones) {
        if (!reachedViewMilestones.includes(m)) reachedViewMilestones.push(m);
      }
    }

    // Save updated state
    if (doc) {
      doc.lastSubscribers = subscribers;
      doc.lastViews = views;
      doc.reachedSubMilestones = reachedSubMilestones;
      doc.reachedViewMilestones = reachedViewMilestones;
      doc.lastCheckedAt = new Date();
      await doc.save().catch(() => { });
    }

    writeLocalFallback({
      lastSubscribers: subscribers,
      lastViews: views,
      reachedSubMilestones,
      reachedViewMilestones
    });

  } catch (err) {
    console.error('[youtubeMilestoneService] checkYouTubeMilestones hatası:', err.message);
  }
}

/**
 * Starts the YouTube Milestone background scheduler (runs every 15 minutes).
 */
function startYouTubeMilestoneScheduler(client) {
  console.log('[youtubeMilestoneService] 🚀 YouTube kilometre taşı takipçisi başlatıldı (Her 15 dakikada bir kontrol).');

  // Her 15 dakikada bir kontrol et
  cron.schedule('*/15 * * * *', async () => {
    await checkYouTubeMilestones(client).catch(() => { });
  });

  // Bot açılışından 20 saniye sonra ilk kontrolü gerçekleştir
  setTimeout(() => {
    checkYouTubeMilestones(client).catch(() => { });
  }, 20000);
}

module.exports = {
  fetchYouTubeChannelStats,
  checkYouTubeMilestones,
  generateMilestoneMessage,
  startYouTubeMilestoneScheduler
};
