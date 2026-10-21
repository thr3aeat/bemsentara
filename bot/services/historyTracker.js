'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');

const TRACKER_PATH = path.join(__dirname, '..', '..', 'data', 'history_tracker.json');

function readTracker() {
  try {
    if (fs.existsSync(TRACKER_PATH)) {
      const raw = fs.readFileSync(TRACKER_PATH, 'utf8');
      const data = JSON.parse(raw);
      return typeof data === 'object' && data !== null ? data : {};
    }
  } catch (_) {}
  return {};
}

function writeTracker(data) {
  try {
    const dir = path.dirname(TRACKER_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TRACKER_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

function hasPostedDate(key, dateStr) {
  if (!dateStr) return false;
  const tracker = readTracker();
  return tracker[key] === dateStr;
}

function recordPostedDate(key, dateStr) {
  if (!dateStr) return;
  const tracker = readTracker();
  tracker[key] = dateStr;
  writeTracker(tracker);
}

// Süreçler arası tekil kilit: aynı gün için yalnızca ilk talep eden süreç paylaşır
// (çift PM2 süreci / yeniden başlatma yarışında iki mesaj gitmesini önler).
function claimDate(key, dateStr) {
  if (!dateStr) return false;
  const lock = path.join(path.dirname(TRACKER_PATH), `history_claim_${key}_${dateStr}.lock`);
  try {
    fs.mkdirSync(path.dirname(lock), { recursive: true });
    fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
    return () => { try { fs.unlinkSync(lock); } catch (_) {} };
  } catch (_) {
    return false;
  }
}

// Makineler arası tekil kilit: VDS + Render aynı token'la açıkken dosya kilidi yetmez, iki
// makine de mesajı atar. Kilit ortak MongoDB'de kanal+gün ile tutulur; ilk yazan paylaşır.
// MongoDB'ye ulaşılamazsa yerel dosya kilidine düşülür (fail-open: tek süreçte bot susmamalı).
async function claimDateShared(key, dateStr) {
  const local = claimDate(key, dateStr);
  if (!local) return false;

  const conn = mongoose.connection;
  if (!conn || conn.readyState !== 1 || !conn.db) return local;

  const col = conn.db.collection('history_claims');
  const id = `${key}:${dateStr}`;
  try {
    await col.insertOne({
      _id: id,
      node: process.env.HA_NODE_NAME || (process.env.RENDER ? 'render' : os.hostname()),
      pid: process.pid,
      at: new Date()
    });
  } catch (err) {
    if (err && err.code === 11000) {
      local();
      return false; // başka makine bugünü zaten sahiplendi
    }
    return local;
  }
  return () => {
    local();
    col.deleteOne({ _id: id }).catch(() => {});
  };
}

// Kanalda botun bugün attığı birden fazla V2 paylaşımı varsa ilk geleni bırakıp sonrakileri siler.
async function removeDuplicateDailyPosts(channel, trDateStr) {
  try {
    const botId = channel && channel.client && channel.client.user && channel.client.user.id;
    if (!botId || !channel.isTextBased()) return 0;
    const messages = await channel.messages.fetch({ limit: 25 }).catch(() => null);
    if (!messages) return 0;

    const { MessageFlags } = require('discord.js');
    const todays = [...messages.values()]
      .filter((m) => m.author && m.author.id === botId
        && m.flags && m.flags.has(MessageFlags.IsComponentsV2)
        && m.createdAt
        && m.createdAt.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) === trDateStr)
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let removed = 0;
    for (const dup of todays.slice(1)) {
      if (await dup.delete().then(() => true).catch(() => false)) removed++;
    }
    return removed;
  } catch (_) {
    return 0;
  }
}

module.exports = {
  claimDate,
  claimDateShared,
  removeDuplicateDailyPosts,
  hasPostedDate,
  recordPostedDate
};
