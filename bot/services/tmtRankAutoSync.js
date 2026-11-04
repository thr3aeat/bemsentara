"use strict";

// TMT Roblox grubunda (ana grup + branş grupları) rütbe değişince
// ilgili kullanıcının Discord rollerini otomatik günceller.
// Tetikleyici: robloxAuditLogPoller her yeni audit log kaydında handleAuditEntries çağırır.

const User = require("../../models/User");
const { normalizeId } = require("../../utils/userLink");
const { TMT_BRANCH_GROUPS } = require("../config/tmtBranchSync");

const TMT_MAIN_GROUP_ID = "11517908";

// Kullanıcının TMT rollerini etkileyen audit log eylemleri
const SYNC_ACTIONS = new Set([
  "Change Rank",
  "Accept Join Request",
  "Kick User",
  "Remove Member",
  "Leave Group",
]);

function isTMTGroup(groupId) {
  const id = String(groupId);
  return id === TMT_MAIN_GROUP_ID || Object.prototype.hasOwnProperty.call(TMT_BRANCH_GROUPS, id);
}

async function findUsersByRobloxId(robloxId) {
  const id = normalizeId(robloxId);
  if (!id) return [];
  const all = await User.find({});
  return all.filter((u) => normalizeId(u.robloxId) === id && u.discordId && !String(u.discordId).startsWith("portal_"));
}

/**
 * Bir Roblox kullanıcısının TMT Discord rollerini senkronize eder.
 * @returns {Promise<number>} Güncellenen Discord hesabı sayısı
 */
async function syncRobloxUserInTMT(client, robloxId, reason = "auto") {
  const users = await findUsersByRobloxId(robloxId);
  if (users.length === 0) return 0;

  const { syncTMTRoles } = require("./tmtRoleSyncService");
  let updated = 0;
  for (const u of users) {
    try {
      const result = await syncTMTRoles(client, u.discordId, u.robloxId);
      if (result?.success) {
        updated++;
        const added = (result.added || []).map((r) => r.name).join(", ") || "-";
        const removed = (result.removed || []).map((r) => r.name).join(", ") || "-";
        console.log(`[TMT AutoSync] ${u.robloxUsername || robloxId} (${u.discordId}) güncellendi [${reason}] +[${added}] -[${removed}]`);
      } else if (result?.error !== "member_not_found") {
        console.warn(`[TMT AutoSync] ${u.discordId} senkronize edilemedi:`, result?.error);
      }
    } catch (err) {
      console.error(`[TMT AutoSync] ${u.discordId} hata:`, err.message);
    }
  }
  return updated;
}

/**
 * Audit log kayıtlarını işler; TMT gruplarındaki rütbe değişikliklerinde Discord rollerini günceller.
 * Aynı kullanıcı için bir poll turunda yalnızca bir kez senkron yapılır.
 */
async function handleAuditEntries(client, groupId, entries) {
  if (!isTMTGroup(groupId) || !Array.isArray(entries) || entries.length === 0) return;

  const targets = new Set();
  for (const entry of entries) {
    if (!SYNC_ACTIONS.has(entry?.actionType)) continue;
    const d = entry.description || {};
    const targetId = d.TargetId ?? (entry.actionType === "Leave Group" ? entry.actor?.user?.userId : null);
    if (targetId) targets.add(String(targetId));
  }

  for (const robloxId of targets) {
    await syncRobloxUserInTMT(client, robloxId, `audit:${groupId}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

module.exports = {
  TMT_MAIN_GROUP_ID,
  isTMTGroup,
  syncRobloxUserInTMT,
  handleAuditEntries,
};
