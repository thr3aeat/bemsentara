const { PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const DataStore = require("./robloxLandDataStore");

const GUILD_ID = "1537407325290237973";
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

/**
 * Bir üye her zaman mevcut seviye rolüyle birlikte bir önceki mevcut seviye
 * rolünü taşır. Arada rolü tanımlanmamış bir seviye varsa (örn. Lv.11), en
 * yakın iki gerçek rol seçilir. Böylece sahte/eksik bir rol ID'si denenmez.
 */
function buildLevelRoleTransition(currentRoleIds, rolesMap, newLevel) {
  const orderedRoleIds = Object.entries(rolesMap || {})
    .map(([level, role]) => ({ level: Number(level), id: role?.id }))
    .filter(item => Number.isFinite(item.level) && item.level <= newLevel && /^\d{17,20}$/.test(String(item.id || '')))
    .sort((a, b) => b.level - a.level);

  const keepRoleIds = [...new Set(orderedRoleIds.map(item => item.id))].slice(0, 2);
  const allLevelRoleIds = new Set(
    Object.values(rolesMap || {})
      .map(role => role?.id)
      .filter(id => /^\d{17,20}$/.test(String(id || '')))
  );
  const assignedIds = Array.from(currentRoleIds || []);

  return {
    addRoleId: keepRoleIds[0] || null,
    addRoleIds: keepRoleIds.filter(id => !assignedIds.includes(id)),
    keepRoleIds,
    removeRoleIds: assignedIds.filter(id => allLevelRoleIds.has(id) && !keepRoleIds.includes(id))
  };
}

function getMissingLevelRoleIds(currentRoleIds, rolesMap, level) {
  const safeLevel = Math.max(1, Math.min(65, Number(level) || 1));
  return buildLevelRoleTransition(currentRoleIds, rolesMap, safeLevel).addRoleIds;
}

/**
 * Profili mevcut olduğu halde rolü eksik kalan üyeleri küçük gruplar hâlinde
 * düzeltir. Eski roller silinmez; yalnızca üyenin seviyesine uygun mevcut ve
 * önceki seviye rolü eksikse eklenir.
 */
async function syncMissingLevelRoles(client, batchSize = 10) {
  const guild = client?.guilds?.cache?.get(GUILD_ID) || await client?.guilds?.fetch(GUILD_ID).catch(() => null);
  if (!guild) return { checked: 0, granted: 0 };

  const profiles = DataStore.getAllUserProfiles();
  const userIds = Object.keys(profiles).sort();
  if (!userIds.length) return { checked: 0, granted: 0 };

  await guild.roles.fetch().catch(() => {});
  const rolesMap = getLevelRolesMap();
  const start = Number(client.__robloxLandLevelRoleCursor || 0) % userIds.length;
  const targetIds = Array.from({ length: Math.min(batchSize, userIds.length) }, (_, index) => userIds[(start + index) % userIds.length]);
  client.__robloxLandLevelRoleCursor = (start + targetIds.length) % userIds.length;

  let granted = 0;
  for (const userId of targetIds) {
    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    if (!member || member.user.bot) continue;

    const currentRoleIds = Array.from(member.roles.cache.keys());
    const missingRoleIds = getMissingLevelRoleIds(currentRoleIds, rolesMap, profiles[userId]?.level);
    const editableRoleIds = missingRoleIds.filter(roleId => guild.roles.cache.get(roleId)?.editable);
    if (!editableRoleIds.length) continue;

    try {
      await member.roles.add(editableRoleIds, "RobloxLand: profile seviyesi için eksik seviye rolü tamamlandı");
      granted += editableRoleIds.length;
    } catch (err) {
      console.warn(`[LevelService] Missing role sync failed for ${userId}:`, err.message);
    }
  }

  return { checked: targetIds.length, granted };
}

function initMissingLevelRoleSync(client) {
  if (client.__robloxLandLevelRoleSyncTimer) return;
  client.__robloxLandLevelRoleSyncTimer = setInterval(() => {
    syncMissingLevelRoles(client).catch(err => console.warn("[LevelService] missing role sync error:", err.message));
  }, 5000);
  setTimeout(() => syncMissingLevelRoles(client).catch(() => {}), 15000);
}

// ─── 1. XP HESAPLAMA VE SEVİYE EĞRİSİ (Dengelenmiş & Kolaylaştırılmış Curve) ────
function getXpForLevel(level) {
  if (level <= 1) return 60;
  if (level <= 10) {
    // 1 - 10 Seviyeler (Başlangıç: Çok kolay ve hızlı ilerleme, anında rol kazanımı)
    // Seviye 1: 60 XP, Seviye 5: 160 XP, Seviye 10: 285 XP
    return Math.round(60 + (level - 1) * 25);
  }
  if (level <= 30) {
    // 11 - 30 Seviyeler (Orta: Rahat ve motive edici tırmanış)
    // Seviye 15: ~430 XP, Seviye 20: ~710 XP, Seviye 30: ~1,500 XP
    return Math.round(285 + Math.pow(level - 10, 1.55) * 35);
  }
  if (level <= 50) {
    // 31 - 50 Seviyeler (İleri: Dengeli ve keyifli ilerleme)
    // Seviye 35: ~2,580 XP, Seviye 40: ~4,080 XP, Seviye 50: ~8,000 XP
    return Math.round(1500 + Math.pow(level - 30, 1.7) * 70);
  }
  // 51 - 65 Seviyeler (Son Roller: Efsanevi, Mitik, Ölümsüz, Tanrısal Dev - Prestijli ve Zor!)
  // Seviye 55: ~10,600 XP, Seviye 60: ~17,200 XP, Seviye 65: ~28,000 XP
  return Math.round(8000 + Math.pow(level - 50, 2.1) * 140);
}

// ─── 1.1. SEVİYE YETKİLERİ & AYRICALIKLARI (Görüntü Yükleme, Tepki Verme vb.) ────
function getPermissionsForLevel(level) {
  const perms = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory
  ];

  // Seviye 1+: Tepki Verme (AddReactions)
  if (level >= 1) {
    perms.push(PermissionFlagsBits.AddReactions);
  }

  // Seviye 2+: Görüntü / Dosya Yükleme (AttachFiles) & Bağlantı Yerleştir (EmbedLinks)
  if (level >= 2) {
    perms.push(PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks);
  }

  // Seviye 3+: Harici Emoji & Harici Çıkartmalar
  if (level >= 3) {
    perms.push(PermissionFlagsBits.UseExternalEmojis, PermissionFlagsBits.UseExternalStickers);
  }

  // Seviye 5+: Alt Başlık (Thread) Oluşturabilme
  if (level >= 5) {
    perms.push(PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.SendMessagesInThreads);
  }

  // Seviye 7+: Sunucuda Kendi Takma Adını Değiştirme (ChangeNickname)
  if (level >= 7) {
    perms.push(PermissionFlagsBits.ChangeNickname);
  }

  // Seviye 10+: Sesli Yayın (Stream) & Ses Paneli (Soundboard)
  if (level >= 10) {
    perms.push(PermissionFlagsBits.Stream, PermissionFlagsBits.UseSoundboard);
  }

  // Seviye 15+: Ses Aktiviteleri & Harici Ses Efektleri
  if (level >= 15) {
    perms.push(PermissionFlagsBits.UseEmbeddedActivities, PermissionFlagsBits.UseExternalSounds);
  }

  return perms;
}

/**
 * Sunucudaki tüm seviye rollerinin yetkilerini otomatik olarak senkronize eder.
 */
async function syncLevelRolePermissions(guild) {
  if (!guild) return;
  try {
    await guild.roles.fetch().catch(() => {});
    const rolesMap = getLevelRolesMap();
    for (let lvl = 1; lvl <= 65; lvl++) {
      const roleInfo = rolesMap[lvl];
      if (!roleInfo || !roleInfo.id) continue;
      const role = guild.roles.cache.get(roleInfo.id) || guild.roles.cache.find(r => r.name.toLowerCase() === (roleInfo.name || '').toLowerCase());
      if (role) {
        const requiredPerms = getPermissionsForLevel(lvl);
        await role.setPermissions(requiredPerms).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[LevelService] syncLevelRolePermissions error:', err.message);
  }
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
      lastMessageContent: "",
      recentMessages: []
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

  // 1. Rolleri oluştur / güncelle (hoist: true -> ayrı göster, permissions: getPermissionsForLevel(level))
  for (const def of roleDefs) {
    try {
      const perms = getPermissionsForLevel(def.level);
      let role = guild.roles.cache.find(r => r.name.toLowerCase() === def.name.toLowerCase());
      if (!role) {
        role = await guild.roles.create({
          name: def.name,
          color: def.color,
          hoist: true,
          reason: `RobloxLand Level ${def.level} Rolü`,
          permissions: perms
        });
      } else {
        const updates = { permissions: perms };
        if (role.hexColor.toLowerCase() !== def.color.toLowerCase()) updates.color = def.color;
        if (!role.hoist) updates.hoist = true;
        await role.edit(updates).catch(() => {});
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

  // 1. Yeni rolü ve bir önceki rolü tut; daha eski seviye rollerini kaldır.
  try {
    const currentRoleIds = member.roles?.cache?.keys
      ? Array.from(member.roles.cache.keys())
      : [];
    const transition = buildLevelRoleTransition(currentRoleIds, rolesMap, newLevel);

    if (transition.removeRoleIds.length > 0) {
      await member.roles.remove(transition.removeRoleIds, `RobloxLand Lv.${newLevel}: eski seviye rolleri temizlendi`).catch(() => {});
    }
    if (transition.addRoleIds.length > 0) {
      await member.roles.add(transition.addRoleIds, `RobloxLand Lv.${newLevel}: mevcut ve önceki seviye rolleri`).catch(() => {});
    }
  } catch (roleErr) {
    console.warn("[LevelService] Role swap error:", roleErr.message);
  }

  // 2. LandCoin ve Profil Güncellemesi
  const coinBonus = newLevel * 15 + 60;
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

    const permsUnlocked = [];
    if (newLevel === 1) permsUnlocked.push('💬 Mesajlara Tepki Verme (Add Reactions)');
    if (newLevel === 2) permsUnlocked.push('🖼️ Görsel / Dosya Yükleme & Link Önizleme');
    if (newLevel === 3) permsUnlocked.push('✨ Harici Emoji & Çıkartma Kullanımı');
    if (newLevel === 5) permsUnlocked.push('🧵 Alt Başlık (Thread) Açabilme');
    if (newLevel === 7) permsUnlocked.push('🏷️ Sunucu İçi Takma Ad Değiştirme');
    if (newLevel === 10) permsUnlocked.push('📺 Sesli Ekran Yayını & Ses Paneli (Soundboard)');
    if (newLevel >= 15 && oldLevel < 15) permsUnlocked.push('🎮 Ses Aktiviteleri (Watch Together vb.)');

    const perkText = permsUnlocked.length > 0
      ? `\n\n🔓 **Açılan Yeni Yetkiler:**\n` + permsUnlocked.map(p => `• ${p}`).join('\n')
      : '';

    const levelUpMsg =
      `🎉 **LEVEL UP!**\n\n` +
      `${userDisplay} seviye atladı!\n\n` +
      `**${oldName}**\n` +
      `          ↓\n` +
      `🌟 **${newName}**\n\n` +
      `Seviye **${oldLevel}** → **${newLevel}**\n` +
      `+1 Yeni Rol\n` +
      `+${coinBonus} LandCoin 🪙` +
      perkText;

    await logChan.send({
      content: levelUpMsg,
      allowedMentions: isNight ? { parse: [] } : { users: [member.id] }
    });
  } catch (logErr) {
    console.error("[LevelService] Level log send error:", logErr.message);
  }
}

// ─── 4. MESAJ XP SİSTEMİ (Anti-Farm, Cooldown, Multiplier) ────────────────────
const MESSAGE_COOLDOWN_MS = 20 * 1000; // 20 saniye akıcı sohbet süresi

async function handleMessageXp(message) {
  if (!message.guild || message.author.bot) return;

  const content = message.content ? message.content.trim() : "";
  const normalizedContent = content.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
  const meaningfulChars = normalizedContent.replace(/[^a-z0-9çğıöşü]/gi, "");
  if (meaningfulChars.length < 5 || new Set(meaningfulChars).size < 2) return;

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
  activity.recentMessages = (activity.recentMessages || []).filter(item => now - Number(item.at || 0) <= 10 * 60 * 1000);

  // Spam ve aynı mesaj engeli
  if (
    (activity.lastMessageContent && activity.lastMessageContent.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ") === normalizedContent) ||
    activity.recentMessages.some(item => item.content === normalizedContent)
  ) {
    return;
  }

  // Cooldown kontrolü (20 saniye)
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

  const baseGain = Math.floor(Math.random() * 16) + 20; // 20 - 35 XP
  const finalXp = Math.round(baseGain * multiplier);

  activity.lastMessageTime = now;
  activity.lastMessageContent = normalizedContent;
  activity.recentMessages.push({ content: normalizedContent, at: now });
  if (activity.recentMessages.length > 20) activity.recentMessages = activity.recentMessages.slice(-20);
  activity.messagesCount = (activity.messagesCount || 0) + 1;

  saveUserActivity(userId, activity);

  try {
    const { trackValidMessage } = require("./robloxLandAchievementService");
    await trackValidMessage(message);
  } catch (err) {
    console.warn("[LevelService] achievement message tracking error:", err.message);
  }

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
      const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
      if (!guild) return;

      const voiceChannels = guild.channels.cache.filter(c => c && c.isVoiceBased() && c.id !== guild.afkChannelId);
      const isWeekend = [0, 6].includes(new Date().getDay());

      for (const [, vChan] of voiceChannels) {
        const activeMembers = vChan.members.filter(m => m && !m.user.bot && !m.voice.deaf && !m.voice.mute);
        if (activeMembers.size < 2) continue; // En az 2 kişi aktifken XP verir

        for (const [, member] of activeMembers) {
          const activity = getUserActivity(member.id);
          activity.voiceMinutes = (activity.voiceMinutes || 0) + 1;
          saveUserActivity(member.id, activity);

          let multiplier = 1.0;
          if (isWeekend) multiplier = 2.0;
          if (member.premiumSince) multiplier *= 1.5;

          const profilePre = DataStore.getUserProfile(member.id, member);
          if (profilePre.isEkoInvite || (profilePre.xpMultiplier && profilePre.xpMultiplier > 1)) {
            multiplier *= (profilePre.xpMultiplier || 2.0);
          }

          const baseVoice = Math.floor(Math.random() * 11) + 15; // 15 - 25 XP
          const voiceXp = Math.round(baseVoice * multiplier);

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
    `🔥 **Seri:** ${activity.streakDays || 0} Gün\n` +
    `🎯 **Görev:** ${activity.tasksCompleted || 0}\n` +
    `🏆 **Başarım:** ${activity.achievementsCount || 0}\n\n` +
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
  getLevelRolesMap,
  getPermissionsForLevel,
  syncLevelRolePermissions,
  buildLevelRoleTransition,
  getMissingLevelRoleIds,
  syncMissingLevelRoles,
  initMissingLevelRoleSync,
  getUserActivity,
  saveUserActivity
};
