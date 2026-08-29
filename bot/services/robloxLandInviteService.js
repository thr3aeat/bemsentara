'use strict';

const DataStore = require("./robloxLandDataStore");

const ROBLOXLND_GUILD_ID = "1537407325290237973";
const EKOYILDIZ_GUILD_ID = "1367646464804655104";
const TARGET_INVITE_CODE = "eJ2dPBXT4R";
const EKOYILDIZ_INVITE_URL = "https://discord.gg/4fQKKgNkAJ";
const LEVEL_LOG_CHANNEL_ID = "1538481757404274708";

// Guild -> Map(code -> uses)
const guildInvitesCache = new Map();

/**
 * Sunucu davetlerini önbelleğe alır
 */
async function cacheGuildInvites(guild) {
  if (!guild || typeof guild.invites?.fetch !== "function") return;
  try {
    const invites = await guild.invites.fetch().catch(() => null);
    if (invites) {
      guildInvitesCache.set(guild.id, new Map(invites.map(i => [i.code, i.uses || 0])));
    }
  } catch (err) {
    console.warn(`[InviteService] Cache error (${guild.id}):`, err.message);
  }
}

/**
 * Yeni üye katıldığında davet kodunu tespit eder ve hoş geldin / 2x Seviye XP bonusunu tanımlar
 */
async function handleMemberJoinInvite(member, client) {
  if (!member || !member.guild || member.user?.bot) return;
  const guild = member.guild;
  const userId = member.id;

  let usedCode = null;

  try {
    const cached = guildInvitesCache.get(guild.id);
    const newInvites = await guild.invites.fetch().catch(() => null);

    if (newInvites) {
      if (cached) {
        for (const [code, invite] of newInvites.entries()) {
          const prevUses = cached.get(code) || 0;
          if (invite.uses > prevUses) {
            usedCode = code;
            break;
          }
        }
      } else if (newInvites.size === 1 || newInvites.length === 1) {
        const firstEntry = Array.from(newInvites.values ? newInvites.values() : newInvites)[0];
        usedCode = firstEntry?.code;
      }
      guildInvitesCache.set(guild.id, new Map(newInvites.map ? newInvites.map(i => [i.code, i.uses || 0]) : Array.from(newInvites.values()).map(i => [i.code, i.uses || 0])));
    }
  } catch (err) {
    console.warn("[InviteService] Track error:", err.message);
  }

  // ── 1. ROBLOXLND SUNUCUSUNA KATILANLAR İÇİN HOŞ GELDİN VE EKOYILDIZ DAVETİ ──
  if (guild.id === ROBLOXLND_GUILD_ID) {
    const isTargetInvite = (usedCode && usedCode.toLowerCase() === TARGET_INVITE_CODE.toLowerCase());

    if (isTargetInvite) {
      DataStore.updateUserProfile(userId, (p) => {
        p.isEkoInvite = true;
        p.inviteCode = usedCode;
        p.xpMultiplier = 2.0;
        p.xp = (p.xp || 0) + 150;
        p.trustScore = Math.max(p.trustScore || 100, 100);
        return p;
      });
    }

    try {
      await member.send({
        content:
          `👋 **RobloxLand'e hoş geldiniz!**\n\n` +
          `EkoYıldız sunucumuza katılarak özel avantajlara sahip olabilir ve sunucuda daha hızlı seviye atlayabilirsiniz:\n` +
          `👉 ${EKOYILDIZ_INVITE_URL}`
      }).catch(() => {});
    } catch (_) {}
  }

  // ── 2. EKOYILDIZ SUNUCUSUNA KATILANLAR İÇİN 2X SEVİYE ETKİNLEŞTİRME ─────────
  if (guild.id === EKOYILDIZ_GUILD_ID) {
    DataStore.updateUserProfile(userId, (p) => {
      p.isEkoInvite = true;
      p.xpMultiplier = 2.0;
      p.xp = (p.xp || 0) + 150;
      return p;
    });

    try {
      await member.send({
        content:
          `🎉 **EkoYıldız'a hoş geldiniz!**\n\n` +
          `Artık **RobloxLand & EkoYıldız** ortak ekosisteminde **x2 şekilde seviye atlıyorsunuz.** 🚀✨`
      }).catch(() => {});
    } catch (_) {}
  }
}

module.exports = {
  cacheGuildInvites,
  handleMemberJoinInvite,
  TARGET_INVITE_CODE,
  EKOYILDIZ_INVITE_URL,
  ROBLOXLND_GUILD_ID,
  EKOYILDIZ_GUILD_ID
};
