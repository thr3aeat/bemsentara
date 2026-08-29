'use strict';

const DataStore = require("./robloxLandDataStore");

const ROBLOXLND_GUILD_ID = "1537407325290237973";
const EKOYILDIZ_GUILD_ID = "1367646464804655104";
const TARGET_INVITE_CODE = "eJ2dPBXT4R";
const EKOYILDIZ_INVITE_URL = "https://discord.gg/4fQKKgNkAJ";
const ROBLOXLND_INVITE_URL = "https://discord.gg/eJ2dPBXT4R";
const EKOYILDIZ_PHOTO_CHANNEL_ID = "1518692517955244133";
const LEVEL_LOG_CHANNEL_ID = "1538481757404274708";

// Guild -> Map(code -> uses)
const guildInvitesCache = new Map();

/**
 * Kullanıcının belirtilen sunucuda olup olmadığını kontrol eder
 */
async function isUserInGuild(client, guildId, userId) {
  if (!client || !guildId || !userId) return false;
  try {
    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return false;
    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    return Boolean(member);
  } catch (_) {
    return false;
  }
}

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
 * Yeni üye katıldığında davet kodunu tespit eder ve koşula göre hoş geldin / 2x Seviye XP mesajını iletir
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

  // ── 1. ROBLOXLND SUNUCUSUNA KATILANLAR ────────────────────────────────────────
  if (guild.id === ROBLOXLND_GUILD_ID) {
    const isTargetInvite = (usedCode && usedCode.toLowerCase() === TARGET_INVITE_CODE.toLowerCase());
    const inEkoGuild = await isUserInGuild(client, EKOYILDIZ_GUILD_ID, userId);

    if (isTargetInvite || inEkoGuild) {
      // EkoYıldız'da zaten var veya özel davetle girdiyse: 2X Seviye Aktif
      DataStore.updateUserProfile(userId, (p) => {
        p.isEkoInvite = true;
        p.inviteCode = usedCode || TARGET_INVITE_CODE;
        p.xpMultiplier = 2.0;
        p.xp = (p.xp || 0) + 150;
        p.trustScore = Math.max(p.trustScore || 100, 100);
        return p;
      });

      try {
        await member.send({
          content:
            `👋 **RobloxLand'e hoş geldiniz!**\n\n` +
            `EkoYıldız sunucumuzda da bulunduğunuz için artık her iki sunucuda da **x2 (çift kat) şeklinde seviye atlıyorsunuz!** 🚀✨`
        }).catch(() => {});
      } catch (_) {}
    } else {
      // Sadece RobloxLand'e girdi, EkoYıldız'da henüz yok:
      try {
        await member.send({
          content:
            `👋 **RobloxLand'e hoş geldiniz!**\n\n` +
            `EkoYıldız sunucumuza katılarak özel avantajlara sahip olabilir ve sunucuda daha hızlı seviye atlayabilirsiniz:\n` +
            `👉 ${EKOYILDIZ_INVITE_URL}`
        }).catch(() => {});
      } catch (_) {}
    }
  }

  // ── 2. EKOYILDIZ SUNUCUSUNA KATILANLAR ────────────────────────────────────────
  if (guild.id === EKOYILDIZ_GUILD_ID) {
    const inRobloxLand = await isUserInGuild(client, ROBLOXLND_GUILD_ID, userId);

    if (inRobloxLand) {
      // Hem EkoYıldız'da hem de RobloxLand'de var:
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
            `Artık **RobloxLand - EkoYıldız** ortak ekosisteminde **x2 şekilde seviye atlıyorsunuz.** 🚀✨`
        }).catch(() => {});
      } catch (_) {}
    } else {
      // Sadece EkoYıldız'da var, RobloxLand'de YOK:
      try {
        await member.send({
          content:
            `👋 **EkoYıldız YouTube - Discord Topluluğuna Hoş Geldiniz!**\n\n` +
            `<#${EKOYILDIZ_PHOTO_CHANNEL_ID}> kanalına YouTube kanalımıza abone olduğunuza dair ekran görüntüsü (fotoğraf) atarsanız özel kanallara ve dosyalara erişebilirsiniz!\n\n` +
            `*(Ayrıca RobloxLand sunucumuza katılarak her iki toplulukta da 2x seviye atlama avantajı kazanabilirsiniz: ${ROBLOXLND_INVITE_URL})*`
        }).catch(() => {});
      } catch (_) {}
    }
  }
}

module.exports = {
  cacheGuildInvites,
  handleMemberJoinInvite,
  isUserInGuild,
  TARGET_INVITE_CODE,
  EKOYILDIZ_INVITE_URL,
  ROBLOXLND_INVITE_URL,
  ROBLOXLND_GUILD_ID,
  EKOYILDIZ_GUILD_ID,
  EKOYILDIZ_PHOTO_CHANNEL_ID
};
