const { PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const DataStore = require("./robloxLandDataStore");

const LEVEL_LOG_CHANNEL_ID = "1538481757404274708";
const ROLES_MAP_FILE = path.join(__dirname, "../../data/robloxland_level_roles.json");
const USER_STATS_FILE = path.join(__dirname, "../../data/robloxland_user_activity.json");

function loadJson(file, fallback = {}) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {}
  return fallback;
}

function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error(`[LevelService] Save error (${file}):`, e.message);
  }
}

// ─── 1. XP HESAPLAMA VE SEVİYE EĞRİSİ (Progressive XP Curve) ───────────────────
function getXpForLevel(level) {
  if (level <= 1) return 100;
  // Seviye 1: 100 XP, Seviye 10: ~1500 XP, Seviye 25: ~7000 XP, Seviye 40: ~18000 XP, Seviye 65: ~70000 XP
  return Math.round(50 * Math.pow(level, 1.72) + 50);
}

function getLevelRolesMap() {
  return loadJson(ROLES_MAP_FILE, {});
}

function saveLevelRolesMap(map) {
  saveJson(ROLES_MAP_FILE, map);
}

function getUserActivity(userId) {
  const all = loadJson(USER_STATS_FILE, {});
  if (!all[userId]) {
    all[userId] = {
      userId,
      messagesCount: 0,
      voiceMinutes: 0,
      streakDays: 1,
      lastActiveDate: new Date().toISOString().slice(0, 10),
      tasksCompleted: 0,
      achievementsCount: 1,
      prestige: 0,
      lastMessageTime: 0,
      lastMessageContent: ""
    };
  }
  return all[userId];
}

function saveUserActivity(userId, data) {
  const all = loadJson(USER_STATS_FILE, {});
  all[userId] = { ...(all[userId] || {}), ...data, userId };
  saveJson(USER_STATS_FILE, all);
}

// ─── 2. !rolünüstüneyeniroller KOMUTU (65 ROLÜ RENKLERİYLE OLUŞTURMA & SIRALAMA) ─
async function handleRolunUstuneYeniRoller(message, lines) {
  const guild = message.guild;
  if (!guild) return message.reply("❌ Bu komut sadece sunucularda kullanılabilir.");

  if (!message.member?.permissions?.has(PermissionFlagsBits.Administrator) && message.author.id !== "1031620522406072350" && message.author.id !== guild.ownerId) {
    return message.reply("❌ Bu komutu sadece **Yöneticiler** kullanabilir.");
  }

  const rawLines = lines || message.content.split("\n");
  let baseRoleId = null;
  const roleDefs = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Hedef taban rolü bul: 1537412517666619454 ----- 👤 Dev -- #95A5A6
    if (!baseRoleId && /\b\d{17,20}\b/.test(trimmed)) {
      const match = trimmed.match(/\b\d{17,20}\b/);
      if (match) baseRoleId = match[0];
    }

    // Seviye rolleri: 01 ----- 🌱 Çaylak Dev -- #A8B0B8
    const numMatch = trimmed.match(/^(\d{1,2})\b/);
    const hexMatch = trimmed.match(/#[0-9A-Fa-f]{6}\b/);
    if (numMatch && hexMatch) {
      const level = parseInt(numMatch[1], 10);
      const color = hexMatch[0];
      let namePart = trimmed.replace(/^(\d{1,2})/, "").replace(/#[0-9A-Fa-f]{6}\b/, "");
      namePart = namePart.replace(/^[\s\-–—\.:]+/, "").replace(/[\s\-–—\.:]+$/, "").trim();
      if (namePart.length > 0) {
        roleDefs.push({ level, name: namePart, color });
      }
    }
  }

  if (roleDefs.length === 0) {
    return message.reply("❌ Oluşturulacak seviye rolü bulunamadı. Lütfen `01 ----- 🌱 Çaylak Dev -- #A8B0B8` formatında giriniz.");
  }

  const statusMsg = await message.reply(`🔄 **${roleDefs.length}** adet seviye rolü kontrol ediliyor ve sırasıyla oluşturuluyor...`);

  await guild.roles.fetch().catch(() => {});
  const rolesMap = getLevelRolesMap();
  const createdRoles = [];
  const errors = [];

  // 1. Rolleri oluştur / güncelle (hoist: true -> ayrı göster)
  for (const def of roleDefs) {
    try {
      let role = guild.roles.cache.find(r => r.name.toLowerCase() === def.name.toLowerCase());
      if (!role) {
        role = await guild.roles.create({
          name: def.name,
          color: def.color,
          hoist: true,
          reason: `RobloxLand Level ${def.level} Rolü`,
          permissions: []
        });
      } else {
        const updates = {};
        if (role.hexColor.toLowerCase() !== def.color.toLowerCase()) updates.color = def.color;
        if (!role.hoist) updates.hoist = true;
        if (Object.keys(updates).length > 0) {
          await role.edit(updates).catch(() => {});
        }
      }
      rolesMap[def.level] = { id: role.id, name: role.name, color: def.color };
      createdRoles.push({ level: def.level, role });
    } catch (e) {
      errors.push(`Lv.${def.level} (${def.name}): ${e.message}`);
    }
  }

  saveLevelRolesMap(rolesMap);

  // 2. Taban rolün üstü ve Üst rolün altı olacak şekilde sırala ve hoist ayarla
  await reorderAndHoistLevelRoles(guild, baseRoleId, "1537426467204370543", createdRoles);

  const successText =
    `✅ **${createdRoles.length} Seviye Rolü Başarıyla Kuruldu, Sıralandı ve Ayrı Göster (Hoist) Yapıldı!**\n\n` +
    `🎯 **Sıralama Aralığı:** <@&1537412517666619454> (Alt) ➔ **[Lv. 1 - Lv. 65 Seviye Rolleri]** ➔ <@&1537426467204370543> (Üst)\n` +
    `🏆 **Seviye Aralığı:** Lv. 1 (${roleDefs[0]?.name}) ➔ Lv. ${roleDefs[roleDefs.length - 1]?.level} (${roleDefs[roleDefs.length - 1]?.name})\n` +
    `👁️ **Ayrı Gösterim:** Tüm 65 seviye rolü üyeler listesinde diğerlerinden ayrı gösterilecek şekilde ayarlandı.\n` +
    `💾 **Kayıt:** Seviye sistemi veritabanına aktarıldı. Üyeler mesaj yazdıkça ve seslide durdukça otomatik rol alacaktır!`;

  await statusMsg.edit(successText).catch(() => {});
  return true;
}

/**
 * Tüm 65 Seviye Rolünü Ayrı Göster (Hoist: true) Yapar ve 
 * 1537412517666619454'ün üstünde, 1537426467204370543'ün altında olacak şekilde sıralar.
 */
async function reorderAndHoistLevelRoles(guild, baseRoleId = "1537412517666619454", topRoleId = "1537426467204370543", customRoleList = null) {
  if (!guild) return false;

  await guild.roles.fetch().catch(() => {});
  const rolesMap = getLevelRolesMap();
  const baseRole = baseRoleId ? guild.roles.cache.get(baseRoleId) : null;
  const topRole = topRoleId ? guild.roles.cache.get(topRoleId) : null;
  const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);
  const botHighest = botMember ? botMember.roles.highest.position : 999;

  const roleObjs = [];

  // Seviye 1'den 65'e sıralı liste oluştur
  for (let lvl = 1; lvl <= 65; lvl++) {
    let r = null;
    if (customRoleList) {
      const match = customRoleList.find(x => x.level === lvl);
      if (match) r = match.role;
    }
    if (!r && rolesMap[lvl]?.id) {
      r = guild.roles.cache.get(rolesMap[lvl].id);
    }
    if (!r && rolesMap[lvl]?.name) {
      r = guild.roles.cache.find(x => x.name.toLowerCase() === rolesMap[lvl].name.toLowerCase());
    }
    if (r) {
      roleObjs.push({ level: lvl, role: r });
    }
  }

  if (roleObjs.length === 0) return false;

  // 1. Hoist (Ayrı Göster) Aç
  for (const item of roleObjs) {
    if (!item.role.hoist) {
      await item.role.setHoist(true).catch(() => {});
    }
  }

  // 2. setPositions ile tek seferde toplu veya kademeli sırala
  if (baseRole) {
    try {
      const startPos = Math.min(baseRole.position + 1, botHighest - 1);
      const positionsPayload = [];

      // Level 1 -> Level 65: baseRole'un üstüne artan sırayla
      for (let i = 0; i < roleObjs.length; i++) {
        positionsPayload.push({
          role: roleObjs[i].role.id,
          position: Math.min(startPos + i, botHighest - 1)
        });
      }

      // Üst rol (1537426467204370543) level 65'in hemen üstünde olsun
      if (topRole) {
        positionsPayload.push({
          role: topRole.id,
          position: Math.min(startPos + roleObjs.length, botHighest - 1)
        });
      }

      if (typeof guild.roles.setPositions === "function") {
        await guild.roles.setPositions(positionsPayload).catch(async () => {
          // Fallback tek tek
          for (let i = 0; i < roleObjs.length; i++) {
            await roleObjs[i].role.setPosition(Math.min(startPos + i, botHighest - 1)).catch(() => {});
          }
          if (topRole) {
            await topRole.setPosition(Math.min(startPos + roleObjs.length, botHighest - 1)).catch(() => {});
          }
        });
      } else {
        for (let i = 0; i < roleObjs.length; i++) {
          await roleObjs[i].role.setPosition(Math.min(startPos + i, botHighest - 1)).catch(() => {});
        }
        if (topRole) {
          await topRole.setPosition(Math.min(startPos + roleObjs.length, botHighest - 1)).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("[LevelService] Reorder positions error:", e.message);
    }
  }

  return true;
}

// ─── 3. LEVEL UP İŞLEYİCİSİ (Rol Değişimi + 1538481757404274708 Log Kanalı) ───
async function processLevelUp(member, newLevel, oldLevel, guild) {
  if (!member || !guild) return;

  const rolesMap = getLevelRolesMap();
  const newRoleInfo = rolesMap[newLevel];
  const oldRoleInfo = rolesMap[oldLevel];

  // 1. Rolleri otomatik takas et (Eski seviye rollerini al, yenisini ver)
  try {
    const allLevelRoleIds = Object.values(rolesMap).map(r => r.id).filter(Boolean);
    if (member.roles?.cache?.filter) {
      const rolesToRemove = member.roles.cache.filter(r => r && allLevelRoleIds.includes(r.id) && r.id !== newRoleInfo?.id);
      if (rolesToRemove.size > 0) {
        await member.roles.remove(rolesToRemove).catch(() => {});
      }
    }
    if (newRoleInfo?.id) {
      await member.roles.add(newRoleInfo.id).catch(() => {});
    }
  } catch (roleErr) {
    console.warn("[LevelService] Role swap error:", roleErr.message);
  }

  // 2. LandCoin ve Profil Güncellemesi
  const coinBonus = newLevel * 10 + 50;
  DataStore.updateUserProfile(member.id, (p) => {
    p.level = newLevel;
    p.landCoins = (p.landCoins || 0) + coinBonus;
    return p;
  });

  // 3. İLK 3 LEVELDE BİR ŞEY DEME (Silent Level Up)
  if (newLevel <= 3) {
    return;
  }

  // 4. Seviye Log Kanalına Gönder (DM ASLA GİTMEZ)
  try {
    const logChan = guild.channels.cache.get(LEVEL_LOG_CHANNEL_ID) || await guild.channels.fetch(LEVEL_LOG_CHANNEL_ID).catch(() => null);
    if (!logChan || !logChan.isTextBased()) return;

    // Gece saatleri kontrolü (00:00 - 08:00 TR Saati)
    const istanbulDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    const hour = istanbulDate.getHours();
    const isNight = hour >= 0 && hour < 8;

    const userDisplay = isNight ? `**${member.user?.tag || member.displayName}**` : `<@${member.id}>`;
    const oldName = oldRoleInfo?.name || `Seviye ${oldLevel}`;
    const newName = newRoleInfo?.name || `Seviye ${newLevel}`;

    const levelUpMsg =
      `🎉 **LEVEL UP!**\n\n` +
      `${userDisplay} seviye atladı!\n\n` +
      `**${oldName}**\n` +
      `          ↓\n` +
      `🌟 **${newName}**\n\n` +
      `Seviye **${oldLevel}** → **${newLevel}**\n` +
      `+1 Yeni Rol\n` +
      `+${coinBonus} LandCoin 🪙`;

    await logChan.send({
      content: levelUpMsg,
      allowedMentions: isNight ? { parse: [] } : { users: [member.id] }
    });
  } catch (logErr) {
    console.error("[LevelService] Level log send error:", logErr.message);
  }
}

// ─── 4. MESAJ XP SİSTEMİ (Anti-Farm, Cooldown, Multiplier) ────────────────────
const MESSAGE_COOLDOWN_MS = 50 * 1000; // 50 saniye spam engeli

async function handleMessageXp(message) {
  if (!message.guild || message.author.bot) return;

  const content = message.content ? message.content.trim() : "";
  if (content.length < 5) return; // Minimum 5 karakter

  // Komutları yoksay
  if (content.startsWith("!") || content.startsWith(".") || content.startsWith("/") || content.startsWith("-")) return;

  // Bot komut / log / ticket kanallarını yoksay
  const chanName = message.channel.name?.toLowerCase() || "";
  if (chanName.includes("komut") || chanName.includes("bot") || chanName.includes("log") || chanName.includes("talep") || chanName.includes("ticket")) {
    return;
  }

  const userId = message.author.id;
  const now = Date.now();
  const activity = getUserActivity(userId);

  // Spam ve aynı mesaj engeli
  if (activity.lastMessageContent && activity.lastMessageContent.toLowerCase() === content.toLowerCase()) {
    return;
  }

  // Cooldown kontrolü
  if (now - (activity.lastMessageTime || 0) < MESSAGE_COOLDOWN_MS) {
    return;
  }

  // XP Çarpanı
  let multiplier = 1.0;
  const isWeekend = [0, 6].includes(new Date().getDay()); // Hafta sonu 2X XP
  if (isWeekend) multiplier = 2.0;
  if (message.member?.premiumSince) multiplier *= 1.5; // Booster 1.5x

  // EkoYıldız Özel Davetiyle Giren Üyelere 2X Seviye / XP Katlayıcı
  const profilePre = DataStore.getUserProfile(userId, message.member);
  if (profilePre.isEkoInvite || (profilePre.xpMultiplier && profilePre.xpMultiplier > 1)) {
    multiplier *= (profilePre.xpMultiplier || 2.0);
  }

  const baseGain = Math.floor(Math.random() * 11) + 15; // 15 - 25 XP
  const finalXp = Math.round(baseGain * multiplier);

  activity.lastMessageTime = now;
  activity.lastMessageContent = content;
  activity.messagesCount = (activity.messagesCount || 0) + 1;

  // Streak güncellemesi
  const todayStr = new Date().toISOString().slice(0, 10);
  if (activity.lastActiveDate !== todayStr) {
    activity.streakDays = (activity.streakDays || 0) + 1;
    activity.lastActiveDate = todayStr;
  }

  saveUserActivity(userId, activity);

  // Profil XP ve Seviye Kontrolü
  const profile = DataStore.getUserProfile(userId, message.member);
  let currentXp = (profile.xp || 0) + finalXp;
  let currentLevel = profile.level || 1;
  let requiredXp = getXpForLevel(currentLevel);
  let hasLeveledUp = false;
  const oldLevel = currentLevel;

  while (currentXp >= requiredXp && currentLevel < 65) {
    currentXp -= requiredXp;
    currentLevel += 1;
    requiredXp = getXpForLevel(currentLevel);
    hasLeveledUp = true;
  }

  profile.xp = currentXp;
  profile.level = currentLevel;
  DataStore.updateUserProfile(userId, () => profile);

  if (hasLeveledUp) {
    await processLevelUp(message.member, currentLevel, oldLevel, message.guild);
  }
}

// ─── 5. SES KANALI XP ZAMANLAYICISI (Voice XP Tracker) ─────────────────────────
function initVoiceXpTracker(client) {
  setInterval(async () => {
    try {
      const guild = client.guilds.cache.get(GUILD_ID);
      if (!guild) return;

      const voiceChannels = guild.channels.cache.filter(c => c && c.isVoiceBased() && c.id !== guild.afkChannelId);

      for (const [, vChan] of voiceChannels) {
        const activeMembers = vChan.members.filter(m => m && !m.user.bot && !m.voice.deaf && !m.voice.mute);
        if (activeMembers.size < 2) continue; // En az 2 kişi aktifken XP verir

        for (const [, member] of activeMembers) {
          const activity = getUserActivity(member.id);
          activity.voiceMinutes = (activity.voiceMinutes || 0) + 1;
          saveUserActivity(member.id, activity);

          const voiceXp = Math.floor(Math.random() * 5) + 8; // 8 - 12 XP
          const profile = DataStore.getUserProfile(member.id, member);
          let currentXp = (profile.xp || 0) + voiceXp;
          let currentLevel = profile.level || 1;
          let requiredXp = getXpForLevel(currentLevel);
          let hasLeveledUp = false;
          const oldLevel = currentLevel;

          while (currentXp >= requiredXp && currentLevel < 65) {
            currentXp -= requiredXp;
            currentLevel += 1;
            requiredXp = getXpForLevel(currentLevel);
            hasLeveledUp = true;
          }

          profile.xp = currentXp;
          profile.level = currentLevel;
          DataStore.updateUserProfile(member.id, () => profile);

          if (hasLeveledUp) {
            await processLevelUp(member, currentLevel, oldLevel, guild);
          }
        }
      }
    } catch (_) {}
  }, 60 * 1000); // Her 1 dakikada bir
}

// ─── 6. PROFİL & SIRALAMA KARTLARI ───────────────────────────────────────────
function buildUserProfileCard(targetUser, member) {
  const profile = DataStore.getUserProfile(targetUser.id, member);
  const activity = getUserActivity(targetUser.id);
  const rolesMap = getLevelRolesMap();

  const currentLevel = profile.level || 1;
  const currentRole = rolesMap[currentLevel]?.name || "Çaylak Dev";
  const nextRole = rolesMap[currentLevel + 1]?.name || "Zirve";
  const requiredXp = getXpForLevel(currentLevel);
  const currentXp = profile.xp || 0;
  const remainingXp = Math.max(0, requiredXp - currentXp);
  const percent = Math.min(100, Math.round((currentXp / requiredXp) * 100));

  const filled = Math.floor((percent / 100) * 18);
  const bar = "█".repeat(filled) + "░".repeat(Math.max(0, 18 - filled));

  const voiceHours = Math.floor((activity.voiceMinutes || 0) / 60);
  const voiceMins = (activity.voiceMinutes || 0) % 60;

  return (
    `👤 **${targetUser.tag || targetUser.username}**\n\n` +
    `🌠 **Seviye:** ${currentLevel}\n` +
    `🏷️ **Rol:** ${currentRole}\n` +
    `✨ **XP:** ${currentXp.toLocaleString()} / ${requiredXp.toLocaleString()}\n` +
    `📊 **Sunucu Sırası:** #${Math.max(1, 66 - currentLevel)}\n\n` +
    `💬 **Mesaj:** ${(activity.messagesCount || 0).toLocaleString()}\n` +
    `🔊 **Ses Süresi:** ${voiceHours}s ${voiceMins}dk\n` +
    `🔥 **Seri:** ${activity.streakDays || 1} Gün\n` +
    `🎯 **Görev:** ${activity.tasksCompleted || 0}\n` +
    `🏆 **Başarım:** ${activity.achievementsCount || 1}\n\n` +
    `\`${bar}\` **${percent}%**\n\n` +
    `**Sonraki Rol:**\n` +
    `🌟 **${nextRole}**\n` +
    `*${remainingXp.toLocaleString()} XP kaldı*`
  );
}

module.exports = {
  handleRolunUstuneYeniRoller,
  reorderAndHoistLevelRoles,
  handleMessageXp,
  processLevelUp,
  initVoiceXpTracker,
  buildUserProfileCard,
  getXpForLevel,
  getLevelRolesMap
};
