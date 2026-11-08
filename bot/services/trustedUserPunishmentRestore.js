"use strict";

/**
 * Üst yetkililere (synx vb.) otomatik sistemlerin yanlışlıkla verdiği cezaları geri alır.
 * Bot açıldığında bir kez çalışır (her sunucu için bir kez; data/ altındaki işaret dosyasıyla).
 *
 * - Sunucudan ban varsa kaldırır
 * - Timeout (susturma) varsa kaldırır
 * - Yazma / fotoğraf engeli rollerini kaldırır
 * - Botun otomatik ceza olarak aldığı rolleri audit log'dan bulup geri verir
 * - Bekleyen gece / gündüz / AI otomatik ban zamanlayıcılarını iptal eder
 */

const fs = require("fs");
const path = require("path");
const { AuditLogEvent } = require("discord.js");
const { EKOYILDIZ_YAZMA_ENGELI_ROLE_ID, EKOYILDIZ_FOTO_ENGELI_ROLE_ID } = require("../../config");

const RESTORE_USER_IDS = ["1240705453584023753"]; // synx
const RESTORE_VERSION = "v1";
const STATE_FILE = path.join(__dirname, "../../data/trusted_punishment_restore.json");

// Otomatik ceza sistemlerinin audit log sebeplerinde geçen ifadeler
const AUTO_PUNISH_REASON = /abuse|otonom|koruma|otomod|automod|antinuke|gece|ceza|g[üu]venlik/i;
const PENALTY_ROLE_IDS = [EKOYILDIZ_YAZMA_ENGELI_ROLE_ID, EKOYILDIZ_FOTO_ENGELI_ROLE_ID].filter(Boolean);

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch (_) { return {}; }
}

function saveState(state) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch (err) {
    console.warn("[TrustedRestore] Durum dosyası yazılamadı:", err.message);
  }
}

async function restoreInGuild(client, guild, userId) {
  const done = [];

  // 1. Ban kaldır
  const ban = await guild.bans.fetch(userId).catch(() => null);
  if (ban) {
    const ok = await guild.members.unban(userId, "Üst yetkili: yanlış otomatik ceza geri alındı").then(() => true).catch(() => false);
    if (ok) done.push("ban kaldırıldı");
  }

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return done;

  // 2. Timeout kaldır
  if (member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now()) {
    const ok = await member.timeout(null, "Üst yetkili: yanlış otomatik ceza geri alındı").then(() => true).catch(() => false);
    if (ok) done.push("susturma kaldırıldı");
  }

  // 3. Botun otomatik ceza olarak aldığı rolleri geri ver
  const me = guild.members.me;
  const toAdd = new Set();
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, user: client.user.id, limit: 100 });
    for (const entry of logs.entries.values()) {
      if (entry.target?.id !== userId) continue;
      if (!AUTO_PUNISH_REASON.test(entry.reason || "")) continue;
      for (const change of entry.changes || []) {
        if (change.key !== "$remove") continue;
        for (const r of change.new || []) toAdd.add(r.id);
      }
    }
  } catch (err) {
    console.warn(`[TrustedRestore] ${guild.name} audit log okunamadı:`, err.message);
  }
  const restorable = [...toAdd].filter(id => {
    const role = guild.roles.cache.get(id);
    return role && !role.managed && !member.roles.cache.has(id) && !PENALTY_ROLE_IDS.includes(id) &&
      (!me || me.roles.highest.comparePositionTo(role) > 0);
  });
  if (restorable.length > 0) {
    const ok = await member.roles.add(restorable, "Üst yetkili: otomatik cezada alınan roller geri verildi").then(() => true).catch(() => false);
    if (ok) done.push(`${restorable.length} rol geri verildi`);
  }

  // 4. Ceza rollerini kaldır
  const penalty = PENALTY_ROLE_IDS.filter(id => member.roles.cache.has(id));
  if (penalty.length > 0) {
    const ok = await member.roles.remove(penalty, "Üst yetkili: ceza rolü kaldırıldı").then(() => true).catch(() => false);
    if (ok) done.push("ceza rolleri kaldırıldı");
  }

  return done;
}

async function restoreTrustedUserPunishments(client) {
  const state = loadState();
  let changed = false;

  for (const userId of RESTORE_USER_IDS) {
    for (const guild of client.guilds.cache.values()) {
      const key = `${RESTORE_VERSION}_${guild.id}_${userId}`;
      try {
        const { cancelPendingNightBan } = require("./discordAbuseDetector");
        cancelPendingNightBan(guild.id, userId);
      } catch (_) {}

      if (state[key]) continue;
      try {
        const done = await restoreInGuild(client, guild, userId);
        if (done.length > 0) console.log(`[TrustedRestore] ✅ ${guild.name} — ${userId}: ${done.join(", ")}`);
        state[key] = Date.now();
        changed = true;
      } catch (err) {
        console.warn(`[TrustedRestore] ${guild.name} — ${userId} geri alma hatası:`, err.message);
      }
    }
  }

  if (changed) saveState(state);
}

module.exports = { restoreTrustedUserPunishments, RESTORE_USER_IDS };
