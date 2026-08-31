'use strict';

const fs = require('fs');
const path = require('path');
const {
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');
const DataStore = require('./robloxLandDataStore');

const ROBLOXLND_GUILD_ID = "1537407325290237973";
const EKOYILDIZ_GUILD_ID = "1367646464804655104";
const TARGET_INVITE_CODE = "eJ2dPBXT4R";

// İstenen Özel Kanallar
const INVITE_PANEL_CHANNEL_ID = "1544022394111529010"; // Davet panelinin yer alacağı kanal
const SECRET_REWARD_CHANNEL_ID = "1544022526034714644"; // Yeterli davet (5+) yapanların açılacağı gizli kanal
const INVITES_DATA_FILE = path.join(__dirname, "../../data/robloxland_invites.json");

// Guild -> Map(code -> uses)
const guildInvitesCache = new Map();

function loadInvitesData() {
  try {
    const dir = path.dirname(INVITES_DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(INVITES_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(INVITES_DATA_FILE, "utf8"));
    }
  } catch (_) {}
  return { users: {}, codes: {} };
}

function saveInvitesData(data) {
  try {
    const dir = path.dirname(INVITES_DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(INVITES_DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[InviteService] Save error:", err.message);
  }
}

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
 * RobloxLand Özel Davet Paneli Tasarımı
 */
function buildInvitePanelPayload() {
  const content = [
    ComponentsV2Factory.text(
      `# 📨 ROBLOXLND — ÖZEL DAVET & KADEMELİ ÖDÜL SİSTEMİ\n\n` +
      `RobloxLand topluluğunu birlikte büyütüyoruz! Kendine özel davet bağlantını oluşturarak arkadaşlarını sunucumuza davet et, seviye sisteminde **2X hızlan** ve özel gizli kanallara erişim kazan!\n\n` +
      `### 🎁 Davet Ödül Kademeleri:\n` +
      `• ⚡ **3 Başarılı Davet:** **2X Hızlı Seviye Atlama (Çift Kat XP Takviyesi)** aktifleşir!\n` +
      `• 🔓 **5 Başarılı Davet:** Gizli <#${SECRET_REWARD_CHANNEL_ID}> kanalını görme ve özel erişim yetkisi açılır!\n` +
      `• 💎 **10+ Başarılı Davet:** Özel Davetçi Rozeti, +500 LandCoins ve VIP çekiliş önceliği!\n\n` +
      `### 📌 Nasıl Çalışır?\n` +
      `1. Aşağıdaki **📨 Davet Linkimi Oluştur / Al** butonuna tıklayarak sana özel davet linkini al.\n` +
      `2. Linkini arkadaşlarınla paylaş; sunucuya her katılan kişiyle davet sayın otomatik artar.\n` +
      `3. Belirtilen hedeflere ulaştığında ödüllerin ve kanal yetkilerin sistem tarafından anında tanımlanır!\n\n` +
      `-# ⚠️ Sahte hesap, bot veya anında çıkış yapan davetler otomatik filtrelenir.`
    ),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Success,
        label: "📨 Davet Linkimi Oluştur / Al",
        custom_id: "robloxland_create_my_invite",
        emoji: { name: "🔗" }
      },
      {
        style: ButtonStyle.Primary,
        label: "📊 Davet İstatistiklerim",
        custom_id: "robloxland_my_invite_stats",
        emoji: { name: "📈" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🏆 Davet Sıralaması (Top 10)",
        custom_id: "robloxland_invite_leaderboard",
        emoji: { name: "🏆" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

/**
 * Davet panelini 1544022394111529010 kanalına yerleştirir/günceller
 */
async function deployInvitePanel(client) {
  try {
    const channel = client.channels.cache.get(INVITE_PANEL_CHANNEL_ID) || await client.channels.fetch(INVITE_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return false;

    const payload = buildInvitePanelPayload();
    const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    const botMsg = messages?.find(m => m.author.id === client.user.id);

    if (botMsg) {
      await botMsg.edit(payload).catch(() => {});
    } else {
      await channel.send(payload).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error("[InviteService] Deploy panel error:", err.message);
    return false;
  }
}

/**
 * Kullanıcı için veya mevcut davet kodunu oluşturur/getirir
 */
async function getOrCreateUserInvite(guild, member) {
  const data = loadInvitesData();
  const userId = member.id;

  if (data.users[userId]?.code) {
    const existingCode = data.users[userId].code;
    return `https://discord.gg/${existingCode}`;
  }

  // Yeni tekil davet linki oluştur
  const inviteChannel = guild.rulesChannel || guild.channels.cache.find(c => c.isTextBased?.()) || guild.channels.cache.get(INVITE_PANEL_CHANNEL_ID);
  if (!inviteChannel) return null;

  try {
    const invite = await inviteChannel.createInvite({
      maxAge: 0, // Sınırsız süre
      maxUses: 0, // Sınırsız kullanım
      unique: true,
      reason: `RobloxLand Özel Davet Sistemi - ${member.user?.tag || userId}`
    });

    if (!data.users[userId]) {
      data.users[userId] = {
        userId,
        code: invite.code,
        invitedCount: 0,
        invitedUsers: [],
        hasXpBoost: false,
        hasSecretChannelAccess: false,
        createdAt: new Date().toISOString()
      };
    } else {
      data.users[userId].code = invite.code;
    }

    data.codes[invite.code] = userId;
    saveInvitesData(data);

    // Önbelleğe de ekle
    const cached = guildInvitesCache.get(guild.id) || new Map();
    cached.set(invite.code, 0);
    guildInvitesCache.set(guild.id, cached);

    return `https://discord.gg/${invite.code}`;
  } catch (err) {
    console.error("[InviteService] Create invite error:", err.message);
    return null;
  }
}

/**
 * Kullanıcının gizli kanala (1544022526034714644) erişim yetkisini açar
 */
async function unlockSecretChannelForUser(guild, userId) {
  try {
    const secretChannel = guild.channels.cache.get(SECRET_REWARD_CHANNEL_ID) || await guild.channels.fetch(SECRET_REWARD_CHANNEL_ID).catch(() => null);
    if (!secretChannel) return false;

    await secretChannel.permissionOverwrites.create(userId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    }, { reason: "RobloxLand 5+ Başarılı Davet Ödülü" });

    return true;
  } catch (err) {
    console.error(`[InviteService] Secret channel unlock error for ${userId}:`, err.message);
    return false;
  }
}

/**
 * Yeni üye katıldığında davet kodunu tespit eder ve ödülleri uygular
 */
async function handleMemberJoinInvite(member, client) {
  if (!member || !member.guild || member.user?.bot) return;
  const guild = member.guild;
  const userId = member.id;

  let usedCode = null;

  try {
    const cached = guildInvitesCache.get(guild.id) || new Map();
    const newInvites = await guild.invites.fetch().catch(() => null);

    if (newInvites) {
      const inviteList = typeof newInvites.values === "function" 
        ? Array.from(newInvites.values()) 
        : (Array.isArray(newInvites) ? newInvites : []);

      for (const invite of inviteList) {
        const prevUses = cached.get(invite.code) || 0;
        if ((invite.uses || 0) > prevUses) {
          usedCode = invite.code;
          break;
        }
      }

      // Eğer kullanılan kod bulunamadıysa ve sunucuda tek bir invite varsa
      if (!usedCode && inviteList.length === 1) {
        usedCode = inviteList[0]?.code;
      }

      guildInvitesCache.set(guild.id, new Map(inviteList.map(i => [i.code, i.uses || 0])));
    }
  } catch (err) {
    console.warn("[InviteService] Track error:", err.message);
  }

  // RobloxLand sunucusu kontrolü
  if (guild.id === ROBLOXLND_GUILD_ID) {
    const invitesData = loadInvitesData();
    const inviterId = usedCode ? invitesData.codes[usedCode] : null;

    if (inviterId && inviterId !== userId) {
      const inviterData = invitesData.users[inviterId] || {
        userId: inviterId,
        code: usedCode,
        invitedCount: 0,
        invitedUsers: [],
        hasXpBoost: false,
        hasSecretChannelAccess: false
      };

      if (!inviterData.invitedUsers.includes(userId)) {
        inviterData.invitedUsers.push(userId);
        inviterData.invitedCount = inviterData.invitedUsers.length;

        // ── ÖDÜL 1: 3 Davet ➔ 2X XP Hızlı Seviye Atlama ──
        if (inviterData.invitedCount >= 3 && !inviterData.hasXpBoost) {
          inviterData.hasXpBoost = true;
          DataStore.updateUserProfile(inviterId, (p) => {
            p.xpMultiplier = Math.max(p.xpMultiplier || 1.0, 2.0);
            return p;
          });

          // DM ile bilgilendir
          try {
            const inviterUser = await client.users.fetch(inviterId).catch(() => null);
            if (inviterUser) {
              await inviterUser.send({
                content: `⚡ **Tebrikler!** RobloxLand'e **3 kişi** davet ettiğin için **2X Hızlı Seviye Atlama (XP Takviyesi)** kazandın! Artık mesaj ve ses etkinliklerinden çift kat XP kazanacaksın! 🚀`
              }).catch(() => {});
            }
          } catch (_) {}
        }

        // ── ÖDÜL 2: 5 Davet ➔ Gizli Kanala (1544022526034714644) Erişim Yetkisi ──
        if (inviterData.invitedCount >= 5 && !inviterData.hasSecretChannelAccess) {
          inviterData.hasSecretChannelAccess = true;
          await unlockSecretChannelForUser(guild, inviterId);

          // DM ile bilgilendir
          try {
            const inviterUser = await client.users.fetch(inviterId).catch(() => null);
            if (inviterUser) {
              await inviterUser.send({
                content: `🔓 **Muazzam Başarı!** RobloxLand'e **5 kişi** davet ettiğin için gizli <#${SECRET_REWARD_CHANNEL_ID}> kanalına özel erişim yetkisi kazandın! Aramıza hoş geldin!`
              }).catch(() => {});
            }
          } catch (_) {}
        }

        invitesData.users[inviterId] = inviterData;
        saveInvitesData(invitesData);
      }
    }

    // EkoYıldız daveti veya ortak sunucu bonusu
    const isTargetInvite = (usedCode && usedCode.toLowerCase() === TARGET_INVITE_CODE.toLowerCase());
    const inEkoGuild = await isUserInGuild(client, EKOYILDIZ_GUILD_ID, userId);

    if (isTargetInvite || inEkoGuild) {
      DataStore.updateUserProfile(userId, (p) => {
        p.isEkoInvite = true;
        p.inviteCode = usedCode || TARGET_INVITE_CODE;
        p.xpMultiplier = 2.0;
        p.xp = (p.xp || 0) + 150;
        p.trustScore = Math.max(p.trustScore || 100, 100);
        return p;
      });
    }
  }
}

/**
 * Davet sistemi buton etkileşimlerini yönetir
 */
async function handleInviteInteraction(interaction) {
  const customId = interaction.customId;
  const member = interaction.member;
  const guild = interaction.guild;

  if (customId === "robloxland_create_my_invite") {
    await interaction.deferReply({ ephemeral: true });

    const inviteUrl = await getOrCreateUserInvite(guild, member);
    if (!inviteUrl) {
      return await interaction.editReply({ content: "❌ Davet bağlantısı oluşturulurken bir hata oluştu." });
    }

    const data = loadInvitesData();
    const count = data.users[member.id]?.invitedCount || 0;

    return await interaction.editReply({
      content:
        `🔗 **Senin Özel RobloxLand Davet Bağlantın:**\n${inviteUrl}\n\n` +
        `📊 **Mevcut Davet Sayın:** \`${count} kişi\`\n\n` +
        `🎁 **Kazanabileceğin Ödüller:**\n` +
        `• 3 Davet ➔ **2X Hızlı Seviye Atlama (XP Takviyesi)** ${count >= 3 ? '✅ *(Kazanıldı)*' : '⏳'}\n` +
        `• 5 Davet ➔ **<#${SECRET_REWARD_CHANNEL_ID}> Gizli Kanalına Erişim İzni** ${count >= 5 ? '✅ *(Açıldı)*' : '⏳'}\n` +
        `• 10 Davet ➔ **Özel Davetçi Rozeti & +500 LandCoins** ${count >= 10 ? '✅ *(Kazanıldı)*' : '⏳'}`
    });
  }

  if (customId === "robloxland_my_invite_stats") {
    await interaction.deferReply({ ephemeral: true });
    const data = loadInvitesData();
    const userData = data.users[member.id] || { invitedCount: 0, code: null };
    const count = userData.invitedCount || 0;

    return await interaction.editReply({
      content:
        `📊 **${member.user.username} — Davet İstatistikleri**\n\n` +
        `• **Davet Ettiğin Kişi:** \`${count} kişi\`\n` +
        `• **Davet Kodun:** \`${userData.code || 'Henüz oluşturulmadı'}\`\n` +
        `• **2X Seviye XP Durumu:** ${count >= 3 ? '✅ **Aktif (2X)**' : '❌ *(3 davet gerekli)*'}\n` +
        `• **Gizli Kanal (<#${SECRET_REWARD_CHANNEL_ID}>) Erişimi:** ${count >= 5 ? '✅ **Açık**' : '❌ *(5 davet gerekli)*'}\n\n` +
        (userData.code ? `🔗 **Linkin:** https://discord.gg/${userData.code}` : `*Link almak için 'Davet Linkimi Oluştur' butonuna basınız.*`)
    });
  }

  if (customId === "robloxland_invite_leaderboard") {
    await interaction.deferReply({ ephemeral: true });
    const data = loadInvitesData();
    const topUsers = Object.values(data.users || {})
      .filter(u => u.invitedCount > 0)
      .sort((a, b) => b.invitedCount - a.invitedCount)
      .slice(0, 10);

    if (topUsers.length === 0) {
      return await interaction.editReply({ content: "🏆 **Henüz davet sıralamasında kimse bulunmuyor. İlk davet eden sen ol!**" });
    }

    const rows = topUsers.map((u, i) => {
      const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `**#${i + 1}**`));
      return `${medal} <@${u.userId}> ➔ **${u.invitedCount} Davet**`;
    }).join("\n");

    return await interaction.editReply({
      content: `# 🏆 RobloxLand — En Çok Davet Edenler (Top 10)\n\n${rows}`
    });
  }

  return false;
}

module.exports = {
  ROBLOXLND_GUILD_ID,
  INVITE_PANEL_CHANNEL_ID,
  SECRET_REWARD_CHANNEL_ID,
  loadInvitesData,
  saveInvitesData,
  cacheGuildInvites,
  handleMemberJoinInvite,
  buildInvitePanelPayload,
  deployInvitePanel,
  handleInviteInteraction,
  unlockSecretChannelForUser
};
