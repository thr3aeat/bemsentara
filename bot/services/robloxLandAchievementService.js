"use strict";

const fs = require("fs");
const path = require("path");
const ComponentsV2Factory = require("../utils/componentsV2Factory");

const GUILD_ID = "1537407325290237973";
const DATA_FILE = path.join(__dirname, "../../data/robloxland_achievements.json");
const LEGACY_ACTIVITY_FILE = path.join(__dirname, "../../data/robloxland_user_activity.json");
const TICK_MS = 60 * 1000;

const ACHIEVEMENTS = [
  // Ses
  { key: "lone_wolf", name: "Yalnız Kurt", color: "#5865F2", test: p => p.voice.aloneMinutes >= 60 },
  { key: "silent_night", name: "Sessiz Gece", color: "#191970", test: p => p.voice.midnightMinutes >= 60 },
  { key: "night_guard", name: "Gece Bekçisi", color: "#283593", test: p => p.voice.nightMinutes >= 180 },
  { key: "voice_regular", name: "Ses Müdavimi", color: "#7289DA", test: p => p.voice.totalMinutes >= 600 },
  { key: "worn_headset", name: "Kulaklık Eskitti", color: "#9B59B6", test: p => p.voice.totalMinutes >= 3000 },
  { key: "voice_legend", name: "Ses Efsanesi", color: "#8E44AD", test: p => p.voice.totalMinutes >= 6000 },
  { key: "in_the_crowd", name: "Kalabalığın İçinde", color: "#3498DB", test: p => p.voice.crowdMinutes >= 60 },
  { key: "duo_team", name: "İkili Takım", color: "#1ABC9C", test: p => maxValue(p.voice.partnerMinutes) >= 180 },
  { key: "until_morning", name: "Sabaha Kadar", color: "#34495E", test: p => p.voice.lateNightMinutes >= 300 },
  { key: "mic_master", name: "Mikrofon Ustası", color: "#00A8FF", test: p => p.voice.days.length >= 7 },
  { key: "voice_traveler", name: "Gezgin Sesçi", color: "#5DADE2", test: p => p.voice.channels.length >= 10 },
  { key: "afk_king", name: "AFK Kralı", color: "#7F8C8D", test: p => p.voice.afkMinutes >= 600 },

  // Sohbet
  { key: "first_word", name: "İlk Kelime", color: "#BDC3C7", test: p => p.chat.messages >= 1 },
  { key: "chat_started", name: "Muhabbet Başladı", color: "#2ECC71", test: p => p.chat.messages >= 100 },
  { key: "chatter", name: "Sohbetçi", color: "#27AE60", test: p => p.chat.messages >= 500 },
  { key: "talkative", name: "Konuşkan", color: "#16A085", test: p => p.chat.messages >= 1000 },
  { key: "wont_stop", name: "Durmuyor", color: "#00B894", test: p => p.chat.messages >= 5000 },
  { key: "keyboard_warrior", name: "Klavye Savaşçısı", color: "#00CEC9", test: p => p.chat.messages >= 10000 },
  { key: "historian", name: "RobloxLand Tarihçisi", color: "#F1C40F", test: p => p.chat.messages >= 25000 },
  { key: "night_owl", name: "Gece Kuşu", color: "#2C3E50", test: p => p.chat.nightMessages >= 1 },
  { key: "good_morning", name: "Günaydın RobloxLand", color: "#F9CA24", test: p => p.chat.morningMessages >= 1 },
  { key: "last_word", name: "Son Sözü Söyleyen", color: "#E67E22", test: p => p.chat.lastWordWins >= 1 },
  { key: "chat_marathon", name: "Maraton Sohbetçi", color: "#FF7675", test: p => maxValue(p.chat.dailyMessages) >= 500 },
  { key: "everywhere", name: "Her Yerdeyim", color: "#6C5CE7", test: p => p.chat.channels.length >= 20 },
  { key: "loyal_chatter", name: "Sadık Sohbetçi", color: "#A29BFE", test: p => activeInLastDays(p.chat.days, 30) >= 25 },
  { key: "returned", name: "Geri Döndü", color: "#74B9FF", test: p => p.chat.returnedAfter30Days },

  // Sunucuda kalma
  { key: "new_dev", name: "Yeni Dev", color: "#95A5A6", test: (p, c) => c.joinDays >= 1 },
  { key: "settling", name: "Yerleşmeye Başladı", color: "#3498DB", test: (p, c) => c.joinDays >= 7 },
  { key: "loyal_dev", name: "Sadık Dev", color: "#2ECC71", test: (p, c) => c.joinDays >= 30 },
  { key: "senior_dev", name: "Kıdemli Dev", color: "#F39C12", test: (p, c) => c.joinDays >= 90 },
  { key: "old_timer", name: "Eski Toprak", color: "#E67E22", test: (p, c) => c.joinDays >= 180 },
  { key: "veteran", name: "RobloxLand Veteranı", color: "#E74C3C", test: (p, c) => c.joinDays >= 365 },
  { key: "fossil", name: "Fosil Dev", color: "#8E44AD", test: (p, c) => c.joinDays >= 500 },
  { key: "immortal", name: "Ölümsüz Dev", color: "#FFD700", test: (p, c) => c.joinDays >= 1000 },

  // Komik / troll
  { key: "anyone_there", name: "Kimse Yok Mu?", color: "#F1C40F", test: p => p.voice.emptyJoins >= 5 },
  { key: "talking_wall", name: "Duvarla Konuşuyor", color: "#F1C40F", test: p => p.voice.aloneMinutes >= 120 },
  { key: "fell_asleep", name: "Uyuyakaldı", color: "#F1C40F", test: p => p.voice.longestSessionMinutes >= 360 },
  { key: "close_discord", name: "Discord’u Kapat Artık", color: "#F1C40F", test: p => maxActiveMinutes(p) >= 600 },
  { key: "touch_grass", name: "Çime Dokun", color: "#F1C40F", test: p => maxValue(p.chat.dailyMessages) >= 1000 },
  { key: "npc", name: "NPC", color: "#F1C40F", test: p => maxChannelDays(p.chat.channelDays) >= 50 },
  { key: "i_live_here", name: "Ben Burada Yaşıyorum", color: "#F1C40F", test: p => p.voice.totalMinutes >= 30000 },
  { key: "wrong_channel", name: "Yanlış Kanal", color: "#F1C40F", test: p => p.chat.quickDeletes >= 1 },
  { key: "indecisive", name: "Kararsız", color: "#F1C40F", test: p => p.voice.recentSwitches.length >= 10 },
  { key: "in_and_out", name: "Girdi Çıktı", color: "#F1C40F", test: p => maxValue(p.voice.dailyJoins) >= 20 },
  { key: "ping_hunter", name: "Ping Avcısı", color: "#F1C40F", test: p => p.social.mentionedBy.length >= 100 },
  { key: "emoji_addict", name: "Emoji Bağımlısı", color: "#F1C40F", test: p => p.chat.emojis >= 1000 },
  { key: "caps_minister", name: "Caps Lock Bakanı", color: "#F1C40F", test: p => p.chat.capsMessages >= 100 },
  { key: "edit_master", name: "Edit Ustası", color: "#F1C40F", test: p => p.chat.edits >= 100 },
  { key: "ghost", name: "Hayalet", color: "#F1C40F", test: (p, c) => c.joinDays >= 30 && p.chat.messages === 0 },
  { key: "silent_follower", name: "Sessiz Takipçi", color: "#F1C40F", test: (p, c) => c.joinDays >= 60 && p.chat.messages < 10 },

  // Sosyal
  { key: "first_friend", name: "İlk Arkadaş", color: "#E91E63", test: p => maxValue(p.voice.partnerMinutes) >= 30 },
  { key: "socializing", name: "Sosyalleşiyor", color: "#E91E63", test: p => p.social.voicePeople.length >= 25 },
  { key: "knows_everyone", name: "Herkesi Tanıyor", color: "#E91E63", test: p => p.social.voicePeople.length >= 100 },
  { key: "party_formed", name: "Parti Kuruldu", color: "#E91E63", test: p => p.voice.partyMinutes >= 120 },
  { key: "twins", name: "İkizler", color: "#E91E63", test: p => maxValue(p.voice.partnerMinutes) >= 1500 },
  { key: "inseparable", name: "Ayrılmaz İkili", color: "#E91E63", test: p => maxValue(p.voice.partnerMinutes) >= 6000 },
  { key: "community_person", name: "Topluluk İnsanı", color: "#E91E63", test: p => p.social.repliedTo.length >= 100 },
  { key: "welcome_team", name: "Hoş Geldin Ekibi", color: "#E91E63", test: p => p.social.welcomed.length >= 50 },
  { key: "helpful", name: "Yardımsever", color: "#E91E63", test: p => p.social.helped.length >= 50 },

  // Streak
  { key: "streak_3", name: "3’te 3", color: "#FF6B35", test: p => p.streak.current >= 3 },
  { key: "streak_7", name: "Bir Hafta Bizimle", color: "#FF6B35", test: p => p.streak.current >= 7 },
  { key: "streak_14", name: "Seri Başladı", color: "#FF6B35", test: p => p.streak.current >= 14 },
  { key: "streak_30", name: "Bir Ay Kaçırmadı", color: "#FF6B35", test: p => p.streak.current >= 30 },
  { key: "streak_60", name: "Durmak Yok", color: "#FF6B35", test: p => p.streak.current >= 60 },
  { key: "streak_100", name: "Demir Dev", color: "#FF6B35", test: p => p.streak.current >= 100 },
  { key: "streak_365", name: "Makine", color: "#FF6B35", test: p => p.streak.current >= 365 },
];

function loadData() {
  try { return fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) : { users: {}, channels: {}, messages: {} }; }
  catch (_) { return { users: {}, channels: {}, messages: {} }; }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function blankProgress(userId) {
  return {
    userId,
    awarded: {},
    chat: { messages: 0, dailyMessages: {}, days: [], channels: [], channelDays: {}, nightMessages: 0, morningMessages: 0, emojis: 0, capsMessages: 0, edits: 0, quickDeletes: 0, lastWordWins: 0, returnedAfter30Days: false, lastValidAt: 0 },
    voice: { totalMinutes: 0, aloneMinutes: 0, midnightMinutes: 0, nightMinutes: 0, lateNightMinutes: 0, crowdMinutes: 0, partyMinutes: 0, afkMinutes: 0, days: [], channels: [], partnerMinutes: {}, emptyJoins: 0, recentSwitches: [], dailyJoins: {}, sessionStartedAt: 0, longestSessionMinutes: 0 },
    social: { voicePeople: [], mentionedBy: [], repliedTo: [], welcomed: [], helped: [] },
    streak: { current: 0, longest: 0, lastDate: "" },
    activeMinutes: {}
  };
}

function normalizeProgress(raw, userId) {
  const base = blankProgress(userId);
  const p = raw || {};
  return {
    ...base, ...p,
    awarded: { ...base.awarded, ...(p.awarded || {}) },
    chat: { ...base.chat, ...(p.chat || {}) },
    voice: { ...base.voice, ...(p.voice || {}) },
    social: { ...base.social, ...(p.social || {}) },
    streak: { ...base.streak, ...(p.streak || {}) },
    activeMinutes: { ...base.activeMinutes, ...(p.activeMinutes || {}) }
  };
}

function getProgress(data, userId) {
  const isNew = !data.users[userId];
  const p = normalizeProgress(data.users[userId], userId);
  if (isNew) {
    try {
      const legacy = JSON.parse(fs.readFileSync(LEGACY_ACTIVITY_FILE, "utf8"))[userId];
      if (legacy) {
        p.chat.messages = Math.max(0, Number(legacy.messagesCount || 0));
        p.voice.totalMinutes = Math.max(0, Number(legacy.voiceMinutes || 0));
      }
    } catch (_) {}
  }
  data.users[userId] = p;
  return p;
}

function maxValue(obj) { return Math.max(0, ...Object.values(obj || {}).map(Number)); }
function maxChannelDays(obj) { return Math.max(0, ...Object.values(obj || {}).map(v => Array.isArray(v) ? v.length : 0)); }
function maxActiveMinutes(p) { return Math.max(0, ...Object.values(p.activeMinutes || {}).map(v => Array.isArray(v) ? v.length : 0)); }
function uniqPush(arr, value) { if (value && !arr.includes(value)) arr.push(value); }
function trimObject(obj, keep = 40) { const keys = Object.keys(obj || {}).sort(); while (keys.length > keep) delete obj[keys.shift()]; }

function istanbulParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const pick = type => parts.find(x => x.type === type)?.value;
  return { date: `${pick("year")}-${pick("month")}-${pick("day")}`, hour: Number(pick("hour")) };
}

function dayNumber(date) { return Math.floor(Date.parse(`${date}T12:00:00Z`) / 86400000); }
function activeInLastDays(days, count) { const today = dayNumber(istanbulParts().date); return (days || []).filter(d => { const n = dayNumber(d); return n <= today && n > today - count; }).length; }
function joinDays(member) { return member?.joinedTimestamp ? Math.floor((Date.now() - member.joinedTimestamp) / 86400000) : 0; }

function markActiveMinute(p, date, now = Date.now()) {
  p.activeMinutes[date] = p.activeMinutes[date] || [];
  uniqPush(p.activeMinutes[date], String(Math.floor(now / 60000)));
  trimObject(p.activeMinutes, 3);
}

function updateStreak(p, today) {
  if (p.streak.lastDate === today) return;
  const yesterday = p.streak.lastDate && dayNumber(today) - dayNumber(p.streak.lastDate) === 1;
  p.streak.current = yesterday ? p.streak.current + 1 : 1;
  p.streak.longest = Math.max(p.streak.longest || 0, p.streak.current);
  p.streak.lastDate = today;
}

async function awardEligible(member, p, data) {
  if (!member || member.guild?.id !== GUILD_ID) return [];
  const context = { joinDays: joinDays(member) };
  const won = [];
  for (const achievement of ACHIEVEMENTS) {
    if (p.awarded[achievement.key] || !achievement.test(p, context)) continue;
    try {
      let role = member.guild.roles.cache.find(r => r.name === achievement.name);
      if (!role) {
        role = await member.guild.roles.create({ name: achievement.name, color: achievement.color, hoist: false, reason: "RobloxLand Başarım Sistemi" });
      }
      if (!member.roles.cache.has(role.id)) await member.roles.add(role, `Başarım açıldı: ${achievement.name}`);
      p.awarded[achievement.key] = new Date().toISOString();
      won.push(achievement.name);
    } catch (err) {
      console.warn(`[RobloxLandAchievements] ${achievement.name} verilemedi (${member.id}):`, err.message);
    }
  }
  if (won.length) {
    data.users[member.id] = p;
    saveData(data);
    const list = won.map(name => `• **${name}**`).join("\n");
    await member.send(`🏆 **RobloxLand'de ${won.length === 1 ? "bir gizli başarım" : `${won.length} gizli başarım`} açtın!**\n${list}\n\nRol${won.length === 1 ? "ün" : "lerin"} hesabına eklendi. Rozet dolabına +${won.length}; çimlere dokunmak hâlâ ücretsiz. 😄`).catch(() => {});
  }
  return won;
}

function emojiCount(content) {
  const custom = content.match(/<a?:\w+:\d+>/g) || [];
  const unicode = content.match(/\p{Extended_Pictographic}/gu) || [];
  return custom.length + unicode.length;
}

function isCapsHeavy(content) {
  const letters = content.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/g) || [];
  if (letters.length < 8) return false;
  const upper = letters.filter(c => c === c.toLocaleUpperCase("tr-TR") && c !== c.toLocaleLowerCase("tr-TR")).length;
  return upper / letters.length >= 0.7;
}

async function trackValidMessage(message) {
  if (!message.guild || message.guild.id !== GUILD_ID || message.author.bot) return [];
  const data = loadData();
  const p = getProgress(data, message.author.id);
  const { date, hour } = istanbulParts();
  const previousAt = Number(p.chat.lastValidAt || 0);

  if (previousAt && Date.now() - previousAt >= 30 * 86400000) p.chat.returnedAfter30Days = true;
  p.chat.lastValidAt = Date.now();
  p.chat.messages += 1;
  p.chat.dailyMessages[date] = (p.chat.dailyMessages[date] || 0) + 1;
  trimObject(p.chat.dailyMessages, 40);
  uniqPush(p.chat.days, date);
  uniqPush(p.chat.channels, message.channelId);
  p.chat.channelDays[message.channelId] = p.chat.channelDays[message.channelId] || [];
  uniqPush(p.chat.channelDays[message.channelId], date);
  if (hour >= 3 && hour < 5) p.chat.nightMessages += 1;
  if (hour >= 6 && hour < 7) p.chat.morningMessages += 1;
  p.chat.emojis += emojiCount(message.content || "");
  if (isCapsHeavy(message.content || "")) p.chat.capsMessages += 1;
  updateStreak(p, date);
  markActiveMinute(p, date, message.createdTimestamp || Date.now());

  const replied = message.mentions?.repliedUser?.id;
  if (replied && replied !== message.author.id) {
    uniqPush(p.social.repliedTo, replied);
    const channelName = message.channel?.name?.toLocaleLowerCase("tr-TR") || "";
    if (channelName.includes("yardım") || channelName.includes("yardim") || channelName.includes("destek")) uniqPush(p.social.helped, replied);
  }
  const lower = (message.content || "").toLocaleLowerCase("tr-TR");
  if (/\b(hoş geldin|hos geldin|hg)\b/.test(lower)) {
    for (const [, target] of message.mentions?.members || []) {
      if (target.id !== message.author.id && target.joinedTimestamp && Date.now() - target.joinedTimestamp <= 7 * 86400000) uniqPush(p.social.welcomed, target.id);
    }
  }
  const mentionedTargets = [];
  for (const [, target] of message.mentions?.users || []) {
    if (target.id === message.author.id || target.bot) continue;
    const targetP = getProgress(data, target.id);
    uniqPush(targetP.social.mentionedBy, message.author.id);
    data.users[target.id] = targetP;
    mentionedTargets.push([target.id, targetP]);
  }

  data.messages[message.id] = { userId: message.author.id, createdAt: message.createdTimestamp || Date.now() };
  const messageIds = Object.keys(data.messages);
  if (messageIds.length > 5000) for (const id of messageIds.slice(0, messageIds.length - 5000)) delete data.messages[id];
  data.channels[message.channelId] = { userId: message.author.id, at: Date.now(), awarded: false };
  data.users[message.author.id] = p;
  saveData(data);

  const wins = await awardEligible(message.member, p, data);
  for (const [targetId, targetP] of mentionedTargets) {
    const targetMember = message.guild.members.cache.get(targetId) || await message.guild.members.fetch(targetId).catch(() => null);
    if (targetMember) await awardEligible(targetMember, targetP, data);
  }
  // Mevcut profil kartıyla uyumluluk.
  try {
    const { getUserActivity, saveUserActivity } = require("./robloxLandLevelService");
    const activity = getUserActivity(message.author.id);
    activity.streakDays = p.streak.current;
    activity.lastActiveDate = p.streak.lastDate;
    activity.achievementsCount = Object.keys(p.awarded).length;
    saveUserActivity(message.author.id, activity);
  } catch (_) {}
  return wins;
}

async function trackMessageDelete(message) {
  const guildId = message.guild?.id;
  if (guildId !== GUILD_ID) return;
  const data = loadData();
  const tracked = data.messages[message.id];
  if (!tracked || Date.now() - tracked.createdAt > 5000) return;
  const member = message.member || await message.guild.members.fetch(tracked.userId).catch(() => null);
  if (!member) return;
  const p = getProgress(data, tracked.userId);
  p.chat.quickDeletes += 1;
  delete data.messages[message.id];
  saveData(data);
  await awardEligible(member, p, data);
}

async function trackMessageEdit(message) {
  if (message.guild?.id !== GUILD_ID || message.author?.bot) return;
  const data = loadData();
  const tracked = data.messages[message.id];
  if (!tracked || tracked.edited) return;
  const p = getProgress(data, message.author.id);
  p.chat.edits += 1;
  tracked.edited = true;
  saveData(data);
  await awardEligible(message.member, p, data);
}

async function trackVoiceState(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  const member = newState.member || oldState.member;
  if (guild?.id !== GUILD_ID || !member || member.user.bot) return;
  const data = loadData();
  const p = getProgress(data, member.id);
  const now = Date.now();
  const { date } = istanbulParts();

  if (!oldState.channelId && newState.channelId) {
    p.voice.sessionStartedAt = now;
    p.voice.dailyJoins[date] = (p.voice.dailyJoins[date] || 0) + 1;
    trimObject(p.voice.dailyJoins, 3);
    if ((newState.channel?.members?.filter(m => !m.user.bot).size || 0) <= 1) p.voice.emptyJoins += 1;
  } else if (oldState.channelId && !newState.channelId) {
    if (p.voice.sessionStartedAt) p.voice.longestSessionMinutes = Math.max(p.voice.longestSessionMinutes, Math.floor((now - p.voice.sessionStartedAt) / 60000));
    p.voice.sessionStartedAt = 0;
  } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    p.voice.recentSwitches = [...p.voice.recentSwitches.filter(t => now - t <= 10 * 60000), now];
  }
  data.users[member.id] = p;
  saveData(data);
  await awardEligible(member, p, data);
}

async function tickVoice(client) {
  const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) return;
  const data = loadData();
  const { date, hour } = istanbulParts();
  const touched = [];
  for (const [, channel] of guild.channels.cache.filter(c => c?.isVoiceBased?.())) {
    const humans = channel.members.filter(m => !m.user.bot);
    for (const [, member] of humans) {
      const p = getProgress(data, member.id);
      p.voice.totalMinutes += 1;
      uniqPush(p.voice.days, date);
      uniqPush(p.voice.channels, channel.id);
      markActiveMinute(p, date);
      if (humans.size === 1) p.voice.aloneMinutes += 1;
      if (hour >= 0 && hour < 5) p.voice.midnightMinutes += 1;
      if (hour >= 0 && hour < 6) p.voice.nightMinutes += 1;
      if (hour >= 23 || hour < 6) p.voice.lateNightMinutes += 1;
      if (humans.size >= 10) { p.voice.crowdMinutes += 1; p.voice.partyMinutes += 1; }
      if (channel.id === guild.afkChannelId) p.voice.afkMinutes += 1;
      if (!p.voice.sessionStartedAt) p.voice.sessionStartedAt = Date.now();
      p.voice.longestSessionMinutes = Math.max(p.voice.longestSessionMinutes, Math.floor((Date.now() - p.voice.sessionStartedAt) / 60000));
      for (const [, peer] of humans) {
        if (peer.id === member.id) continue;
        p.voice.partnerMinutes[peer.id] = (p.voice.partnerMinutes[peer.id] || 0) + 1;
        uniqPush(p.social.voicePeople, peer.id);
      }
      data.users[member.id] = p;
      touched.push([member, p]);
    }
  }
  // Son mesajı altı saat değişmeyen kanallar.
  for (const channelState of Object.values(data.channels)) {
    if (!channelState.awarded && Date.now() - channelState.at >= 6 * 3600000) {
      const member = await guild.members.fetch(channelState.userId).catch(() => null);
      if (member) {
        const p = getProgress(data, member.id);
        p.chat.lastWordWins += 1;
        channelState.awarded = true;
        touched.push([member, p]);
      }
    }
  }
  saveData(data);
  for (const [member, p] of touched) await awardEligible(member, p, data);
}

let tenureCursor = 0;
async function scanTenure(client, batchSize = 5) {
  const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) return;
  const data = loadData();
  const members = [...guild.members.cache.values()].filter(member => !member.user.bot);
  if (!members.length) return;
  const batch = [];
  for (let i = 0; i < Math.min(batchSize, members.length); i += 1) {
    batch.push(members[(tenureCursor + i) % members.length]);
  }
  tenureCursor = (tenureCursor + batch.length) % members.length;
  for (const member of batch) {
    if (member.user.bot) continue;
    await awardEligible(member, getProgress(data, member.id), data);
  }
}

function initAchievementTracker(client) {
  if (client.__robloxLandAchievementTimer) return;
  client.__robloxLandAchievementTimer = setInterval(() => tickVoice(client).catch(err => console.error("[RobloxLandAchievements] tick:", err.message)), TICK_MS);
  setTimeout(() => { tickVoice(client).catch(() => {}); scanTenure(client).catch(() => {}); }, 15000);
  setInterval(() => scanTenure(client).catch(() => {}), TICK_MS);
}

function getStreak(userId) {
  const p = getProgress(loadData(), userId);
  const today = istanbulParts().date;
  const stale = p.streak.lastDate && dayNumber(today) - dayNumber(p.streak.lastDate) > 1;
  return { current: stale ? 0 : p.streak.current, longest: p.streak.longest, lastDate: p.streak.lastDate };
}

async function handleStreakCommand(message) {
  if (message.guild?.id !== GUILD_ID || !/^e!streak(?:\s|$)/i.test((message.content || "").trim())) return false;
  const streak = getStreak(message.author.id);
  const next = [3, 7, 14, 30, 60, 100, 365].find(n => n > streak.current);
  await message.reply(ComponentsV2Factory.buildPayload([
    ComponentsV2Factory.text(
      `# 🔥 ${message.author.username} — Streak Durumu\n\n` +
      `**Güncel seri:** \`${streak.current} gün\`\n` +
      `**En uzun seri:** \`${streak.longest} gün\`\n` +
      `**Bugünkü geçerli mesaj:** ${streak.lastDate === istanbulParts().date ? "✅ Atıldı" : "❌ Henüz yok"}\n\n` +
      (next ? `Sonraki seri başarımına **${next - streak.current} gün** kaldı.` : "🏆 Tüm streak başarımlarını tamamladın!") +
      `\n\n-# Seri için her gün spam olmayan en az bir geçerli mesaj gerekir. Rutin DM gönderilmez.`
    )
  ]));
  return true;
}

module.exports = {
  GUILD_ID,
  ACHIEVEMENTS,
  getStreak,
  handleStreakCommand,
  initAchievementTracker,
  trackValidMessage,
  trackMessageDelete,
  trackMessageEdit,
  trackVoiceState,
  _test: { blankProgress, istanbulParts, updateStreak, emojiCount, isCapsHeavy, maxValue }
};
