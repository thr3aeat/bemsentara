'use strict';

const {
  EmbedBuilder,
  ChannelType,
  AuditLogEvent,
  PermissionFlagsBits
} = require('discord.js');

// ── Konfigürasyon ──────────────────────────────────────────────────────────
const CENTRAL_GUILD_ID    = '1483482948320891074';
const PRIMARY_CATEGORY_ID = '1533849612945719296';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── 10 Temel Forum Log Konusu ─────────────────────────────────────────────
const LOG_TOPICS = {
  BEHAVIOR_PSYCHOLOGY: {
    key: 'BEHAVIOR_PSYCHOLOGY',
    name: '🧠 Davranış & Psikoloji Logları',
    description: 'Ghost ping, öfke/toxic patlamaları ve DM reklam şüphelisi takipleri'
  },
  VOICE_MEDIA_ADVANCED: {
    key: 'VOICE_MEDIA_ADVANCED',
    name: '🎙️ Sesli Kanal & Medya Detay Logları',
    description: 'Kulaklık/mikrofon AFK kasma, ekran paylaşımı ve sesli kanal hızlı hop takipleri'
  },
  SECURITY_FORENSICS: {
    key: 'SECURITY_FORENSICS',
    name: '🛡️ Gelişmiş Güvenlik & Forensics Logları',
    description: 'Yetkili hiyerarşi ihlali, anti-nuke erken uyarısı ve yapay yan hesap analizleri'
  },
  SERVER_HEALTH_ECONOMY: {
    key: 'SERVER_HEALTH_ECONOMY',
    name: '📊 Sunucu Sağlığı & Ekonomi Analiz Logları',
    description: 'Atıl/ölü kanallar, erken af kayıtları ve emoji kullanım trendleri'
  },
  MESSAGE_LOGS: {
    key: 'MESSAGE_LOGS',
    name: '💬 Mesaj Logları',
    description: 'Silinen, düzenlenen, toplu silinen mesajlar ve sabitlemeler'
  },
  USER_MEMBER_LOGS: {
    key: 'USER_MEMBER_LOGS',
    name: '👥 Kullanıcı & Üye Logları',
    description: 'Giriş/çıkış, avatar/isim güncellemeleri, nickname ve rol değişiklikleri'
  },
  MODERATION_PUNISHMENT: {
    key: 'MODERATION_PUNISHMENT',
    name: '🔨 Moderasyon & Ceza Logları',
    description: 'Ban, unban, kick, timeout/mute işlemlerinin detaylı dökümü'
  },
  CHANNEL_ROLE_CONFIG: {
    key: 'CHANNEL_ROLE_CONFIG',
    name: '📁 Kanal & Rol Yapılandırma Logları',
    description: 'Kanal ve rol oluşturma, silme, izin ve sıralama değişiklikleri'
  },
  VOICE_BASIC_LOGS: {
    key: 'VOICE_BASIC_LOGS',
    name: '🎙️ Sesli Kanal Temel Logları',
    description: 'Kanala katılım, ayrılma, kanal değiştirme ve ses durumu'
  },
  SERVER_UPDATES_LOGS: {
    key: 'SERVER_UPDATES_LOGS',
    name: '🚀 Sunucu Güncellemeleri Logları',
    description: 'Boost, sunucu ayarları, davet bağlantıları ve emoji/sticker işlemleri'
  }
};

// Memory Caches & Trackers
const forumThreadsCache = new Map(); // `${guildId}_${topicKey}` -> threadId
const pendingThreadLogs = new Map(); // threadId -> { embeds: [] }
const threadFlushTimers = new Map(); // threadId -> Timeout
const userMessageStats  = new Map(); // userId -> { timestamps: [], capsBurstCount: 0 }
const voiceStateTracker  = new Map(); // userId -> { joinedAt, deafSince, muteSince, streamStartedAt, hops: [] }
const antiNukeTracker   = new Map(); // `${guildId}_${executorId}_${type}` -> timestamps

const LOG_FLUSH_DELAY_MS = 5000;
const MAX_EMBEDS_PER_MESSAGE = 8;

function isPrivilegedTarget(member) {
  if (!member) return false;
  return member.permissions?.has(PermissionFlagsBits.Administrator) ||
    member.permissions?.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions?.has(PermissionFlagsBits.ManageRoles) ||
    member.permissions?.has(PermissionFlagsBits.ManageChannels);
}

function buildMentionDetails(message) {
  const mentionedUsers = message.mentions.users?.map(u => `<@${u.id}> (${u.tag})`).join(', ') || 'Yok';
  const mentionedRoles = message.mentions.roles?.map(r => `<@&${r.id}>`).join(', ') || 'Yok';
  const privilegedUserPing = message.mentions.members?.some(isPrivilegedTarget) || false;
  return { mentionedUsers, mentionedRoles, privilegedUserPing };
}

/**
 * Format clean forum channel name for each guild
 */
function formatForumName(guild) {
  const cleanName = guild.name
    .toLowerCase()
    .replace(/[^a-z0-9-çğıöşü]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `📋-${cleanName || 'sunucu'}-loglar`.slice(0, 95);
}

/**
 * Dynamic Category Overflow Manager (50 channel limit protection)
 * Finds or creates a category with available channel capacity in central guild.
 */
async function getAvailableCategory(centralGuild) {
  try {
    let primaryCategory = centralGuild.channels.cache.get(PRIMARY_CATEGORY_ID) ||
      await centralGuild.channels.fetch(PRIMARY_CATEGORY_ID).catch(() => null);

    if (!primaryCategory) return null;

    // Check how many channels are currently in primary category
    const childrenCount = centralGuild.channels.cache.filter(c => c.parentId === PRIMARY_CATEGORY_ID).size;
    if (childrenCount < 48) {
      return primaryCategory;
    }

    // If primary category is near max capacity (50 limit), look for an overflow category
    let overflowCategory = centralGuild.channels.cache.find(c =>
      c.type === ChannelType.GuildCategory &&
      c.name.startsWith('📋 | Sunucu Logları') &&
      centralGuild.channels.cache.filter(child => child.parentId === c.id).size < 48
    );

    if (!overflowCategory) {
      const existingOverflows = centralGuild.channels.cache.filter(c =>
        c.type === ChannelType.GuildCategory && c.name.startsWith('📋 | Sunucu Logları')
      ).size;
      const newCategoryName = `📋 | Sunucu Logları ${existingOverflows + 2}`;

      overflowCategory = await centralGuild.channels.create({
        name: newCategoryName,
        type: ChannelType.GuildCategory,
        reason: '50 kanal sınırı aşıldığı için otomatik dinamik log kategorisi açıldı'
      });
      console.log(`[ForumLogService] Created dynamic overflow category: ${newCategoryName}`);
    }

    return overflowCategory;
  } catch (err) {
    console.error('[ForumLogService] Dynamic category lookup error:', err.message);
    return centralGuild.channels.cache.get(PRIMARY_CATEGORY_ID) || null;
  }
}

/**
 * Safe, Queued and Rate-Limit Free Forum & Thread Initializer
 */
async function initForumLogService(client) {
  try {
    const centralGuild = client.guilds.cache.get(CENTRAL_GUILD_ID) ||
      await client.guilds.fetch(CENTRAL_GUILD_ID).catch(() => null);

    if (!centralGuild) {
      console.warn(`[ForumLogService] Central Guild ${CENTRAL_GUILD_ID} not found.`);
      return;
    }

    console.log(`📋 [ForumLogService] Initializing forum thread cache without eager channel creation...`);
    await cacheExistingForumThreads(centralGuild);
    console.log(`🚀 [ForumLogService] Cache primed. ${forumThreadsCache.size} forum threads cached.`);
  } catch (err) {
    console.error('[ForumLogService] Startup initialization error:', err.message);
  }
}

async function cacheExistingForumThreads(centralGuild) {
  const forumChannels = centralGuild.channels.cache.filter(c => c.type === ChannelType.GuildForum);

  for (const forumChannel of forumChannels.values()) {
    try {
      const topicMatch = forumChannel.topic?.match(/ID: (\d{17,19})/);
      if (!topicMatch) continue;

      const guildId = topicMatch[1];

      const active = await forumChannel.threads.fetchActive().catch(() => null);
      const archived = await forumChannel.threads.fetchArchived().catch(() => null);
      const allThreads = new Map();

      if (active?.threads) for (const thread of active.threads.values()) allThreads.set(thread.id, thread);
      if (archived?.threads) for (const thread of archived.threads.values()) allThreads.set(thread.id, thread);

      for (const thread of allThreads.values()) {
        const topicKey = Object.keys(LOG_TOPICS).find(key => LOG_TOPICS[key].name === thread.name);
        if (topicKey) {
          forumThreadsCache.set(`${guildId}_${topicKey}`, thread.id);
        }
      }
    } catch (err) {
      console.warn('[ForumLogService] cacheExistingForumThreads error:', err.message);
    }
  }
}

/**
 * Ensures a Forum Channel and its 10 Threads exist with proper queue and message payloads
 */
async function ensureGuildForumAndThreadsSafe(centralGuild, guild) {
  const desiredName = formatForumName(guild);
  const targetCategory = await getAvailableCategory(centralGuild);
  if (!targetCategory) return;

  // 1. Check if Forum Channel exists in Central Guild
  let forumChannel = centralGuild.channels.cache.find(c =>
    c.type === ChannelType.GuildForum &&
    (c.name === desiredName || c.topic?.includes(guild.id))
  );

  if (!forumChannel) {
    try {
      forumChannel = await centralGuild.channels.create({
        name: desiredName,
        type: ChannelType.GuildForum,
        parent: targetCategory.id,
        topic: `Log Hub for Server: ${guild.name} (ID: ${guild.id})`,
        reason: `Automated Log Forum Channel for ${guild.name}`
      });
      console.log(`[ForumLogService] Created Forum channel ${desiredName} for ${guild.name}`);
      await wait(2000); // 2s pause after creating channel
    } catch (err) {
      console.error(`❌ [ForumLogService] Failed to create Forum channel for ${guild.name}:`, err.message);
      return;
    }
  }

  // 2. Fetch existing active & archived threads in this forum channel
  let activeThreads = new Map();
  let archivedThreads = new Map();
  try {
    const act = await forumChannel.threads.fetchActive().catch(() => null);
    if (act?.threads) activeThreads = act.threads;
    const arc = await forumChannel.threads.fetchArchived().catch(() => null);
    if (arc?.threads) archivedThreads = arc.threads;
  } catch (_) {}

  const allThreads = new Map([...activeThreads, ...archivedThreads]);

  // 3. Sequentially ensure each of the 10 log topic threads exist with 1.5s delay
  for (const [topicKey, topicInfo] of Object.entries(LOG_TOPICS)) {
    const cacheKey = `${guild.id}_${topicKey}`;
    let thread = Array.from(allThreads.values()).find(t => t.name === topicInfo.name);

    if (!thread) {
      try {
        // Discord API requires 'message' object when creating thread in a Forum channel!
        thread = await forumChannel.threads.create({
          name: topicInfo.name,
          autoArchiveDuration: 10080, // 7 Gün auto-archive
          message: {
            content: `📌 **${topicInfo.name}** kanalı başlatıldı.\n*Açıklama:* ${topicInfo.description}`
          }
        });
        console.log(`✅ [ForumLogService] Created thread "${topicInfo.name}" (${guild.name})`);
        await wait(1500); // Safe 1.5s delay between thread creations
      } catch (err) {
        console.error(`❌ [ForumLogService] Thread creation failed for ${topicInfo.name} (${guild.name}):`, err.message);
        continue;
      }
    }

    if (thread) {
      if (thread.archived) {
        await thread.setArchived(false).catch(() => {});
      }
      forumThreadsCache.set(cacheKey, thread.id);
    }
  }
}

async function flushThreadBuffer(client, threadId) {
  const buffer = pendingThreadLogs.get(threadId);
  if (!buffer || buffer.embeds.length === 0) {
    threadFlushTimers.delete(threadId);
    return;
  }

  pendingThreadLogs.delete(threadId);
  threadFlushTimers.delete(threadId);

  const centralGuild = client.guilds.cache.get(CENTRAL_GUILD_ID) ||
    await client.guilds.fetch(CENTRAL_GUILD_ID).catch(() => null);
  if (!centralGuild) return;

  const thread = centralGuild.channels.cache.get(threadId) ||
    await centralGuild.channels.fetch(threadId).catch(() => null);
  if (!thread) return;

  if (thread.archived) {
    await thread.setArchived(false).catch(() => {});
  }

  const allEmbeds = buffer.embeds.slice();
  while (allEmbeds.length > 0) {
    const chunk = allEmbeds.splice(0, MAX_EMBEDS_PER_MESSAGE);
    await thread.send({ embeds: chunk }).catch(err => {
      console.warn(`[ForumLogService] Error flushing buffered logs to thread ${threadId}:`, err.message);
    });
  }
}

function scheduleThreadFlush(client, threadId) {
  if (threadFlushTimers.has(threadId)) return;
  const timeout = setTimeout(() => flushThreadBuffer(client, threadId), LOG_FLUSH_DELAY_MS);
  threadFlushTimers.set(threadId, timeout);
}

/**
 * Send a log payload to the specific forum thread of a guild (with auto-unarchive)
 */
async function sendForumLog(client, guild, topicKey, embedPayload) {
  if (!guild || !topicKey) return;
  try {
    const cacheKey = `${guild.id}_${topicKey}`;
    let threadId = forumThreadsCache.get(cacheKey);

    const centralGuild = client.guilds.cache.get(CENTRAL_GUILD_ID) ||
      await client.guilds.fetch(CENTRAL_GUILD_ID).catch(() => null);
    if (!centralGuild) return;

    if (!threadId) {
      await ensureGuildForumAndThreadsSafe(centralGuild, guild);
      threadId = forumThreadsCache.get(cacheKey);
    }

    if (!threadId) return;

    const embeds = Array.isArray(embedPayload) ? embedPayload : [embedPayload];
    const buffer = pendingThreadLogs.get(threadId) || { embeds: [] };
    buffer.embeds.push(...embeds);
    pendingThreadLogs.set(threadId, buffer);

    if (buffer.embeds.length >= MAX_EMBEDS_PER_MESSAGE) {
      await flushThreadBuffer(client, threadId);
    } else {
      scheduleThreadFlush(client, threadId);
    }
  } catch (err) {
    console.error('[ForumLogService] sendForumLog error:', err.message);
  }
}

// ── ADVANCED TRACKERS & HANDLERS ──────────────────────────────────────────

/**
 * 1. Ghost Ping (Hayalet Etiket) & Message Delete Tracker
 */
async function handleGhostPingAndDelete(client, message) {
  if (!message || !message.guild || message.author?.bot) return;

  const now = Date.now();
  const createdTime = message.createdTimestamp || now;
  const elapsedSeconds = Math.floor((now - createdTime) / 1000);

  // Check if message had user/role/everyone mentions (Ghost Ping)
  const hasUserPings = message.mentions?.users?.size > 0;
  const hasRolePings = message.mentions?.roles?.size > 0;
  const hasEveryonePings = message.mentions?.everyone || false;

  if (hasUserPings || hasRolePings || hasEveryonePings) {
    const mentionedUsers = message.mentions.users?.map(u => `<@${u.id}> (\`${u.tag}\`)`).join(', ') || 'Yok';
    const mentionedRoles = message.mentions.roles?.map(r => `<@&${r.id}>`).join(', ') || 'Yok';
    const isCritical = hasEveryonePings || hasRolePings;

    const ghostEmbed = new EmbedBuilder()
      .setTitle(isCritical ? '🚨 KRİTİK GHOST PING (ROLE/EVERYONE) YAKALANDI!' : '👻 GHOST PING (HAYALET ETİKET) YAKALANDI!')
      .setColor(isCritical ? 0xFF0000 : 0xE74C3C)
      .setDescription(
        `**Yazan Üye:** ${message.author.toString()} (\`${message.author.id}\`)\n` +
        `**Kanal:** ${message.channel.toString()}\n` +
        `**Etiketlenen Üyeler:** ${mentionedUsers}\n` +
        `**Etiketlenen Roller:** ${mentionedRoles}\n` +
        `**Silinme Süresi:** \`${elapsedSeconds} saniye\` içinde silindi!\n\n` +
        `📝 **Silinen Mesaj İçeriği:**\n\`\`\`${(message.content || 'Görsel / Eklenti').slice(0, 1500)}\`\`\``
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Davranış & Psikoloji Logu • Ghost Ping Avcısı' })
      .setTimestamp();

    await sendForumLog(client, message.guild, 'BEHAVIOR_PSYCHOLOGY', ghostEmbed);
  }

  // Standard Message Delete Log
  const delEmbed = new EmbedBuilder()
    .setTitle('🗑️ MESAJ SİLİNDİ')
    .setColor(0x95A5A6)
    .addFields(
      { name: '👤 Yazan Kullanıcı', value: `${message.author?.toString() || 'Bilinmiyor'}\n\`${message.author?.id || 'N/A'}\``, inline: true },
      { name: '📍 Kanal', value: `${message.channel?.toString() || 'Bilinmiyor'}`, inline: true },
      { name: '📝 İçerik', value: `\`\`\`${(message.content || 'Görsel / Dosya Eklentisi').slice(0, 1000)}\`\`\``, inline: false }
    )
    .setTimestamp();

  await sendForumLog(client, message.guild, 'MESSAGE_LOGS', delEmbed);
}

/**
 * 2. Message Edit Tracker
 */
async function handleMessageEdit(client, oldMessage, newMessage) {
  if (!newMessage || !newMessage.guild || newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  const now = Date.now();
  const createdTime = oldMessage.createdTimestamp || now;
  const elapsedSeconds = Math.floor((now - createdTime) / 1000);

  // Check if old message had user mentions removed in edit (Edit Ghost Ping)
  const oldRolePings = oldMessage.mentions?.roles?.size > 0;
  const removedUserMentions = (oldMessage.mentions?.users?.map(u => u.id) || []).filter(id => !(newMessage.mentions?.users?.map(u => u.id) || []).includes(id));
  const removedRoleMentions = (oldMessage.mentions?.roles?.map(r => r.id) || []).filter(id => !(newMessage.mentions?.roles?.map(r => r.id) || []).includes(id));
  const removedEveryone = oldMessage.mentions?.everyone && !newMessage.mentions?.everyone;
  const removedHere = oldMessage.mentions?.here && !newMessage.mentions?.here;

  if (removedUserMentions.length > 0 || removedRoleMentions.length > 0 || removedEveryone || removedHere) {
    const removedText = [
      ...removedUserMentions.map(id => `<@${id}>`),
      ...removedRoleMentions.map(id => `<@&${id}>`),
      ...(removedEveryone ? ['@everyone'] : []),
      ...(removedHere ? ['@here'] : [])
    ].join(', ');

    const privilegedUserPing = newMessage.mentions?.members?.some(isPrivilegedTarget) || false;
    const isCritical = removedRoleMentions.length > 0 || removedEveryone || removedHere || privilegedUserPing;

    const editGhostEmbed = new EmbedBuilder()
      .setTitle(isCritical ? '🚨 KRİTİK DÜZENLEME GHOST PING YAKALANDI!' : '👻 DÜZENLEMEDE GHOST PING YAKALANDI!')
      .setColor(isCritical ? 0xFF0000 : 0xE67E22)
      .setDescription(
        `**Üye:** ${newMessage.author.toString()}\n` +
        `**Kanal:** ${newMessage.channel.toString()}\n` +
        `**Kaldırılan Etiketler:** ${removedText}\n` +
        `**Düzenleme Süresi:** \`${elapsedSeconds} saniye\` içinde etiket silindi!\n\n` +
        `**Eski İçerik:**\n\`\`\`${(oldMessage.content || '').slice(0, 500)}\`\`\`\n` +
        `**Yeni İçerik:**\n\`\`\`${(newMessage.content || '').slice(0, 500)}\`\`\``
      )
      .setTimestamp();

    await sendForumLog(client, newMessage.guild, 'BEHAVIOR_PSYCHOLOGY', editGhostEmbed);
  }

  // Standard Edit Log
  const editEmbed = new EmbedBuilder()
    .setTitle('✏️ MESAJ DÜZENLENDİ')
    .setColor(0x3498DB)
    .addFields(
      { name: '👤 Yazan', value: `${newMessage.author.toString()}`, inline: true },
      { name: '📍 Kanal', value: `${newMessage.channel.toString()}`, inline: true },
      { name: '📝 Eski Hali', value: `\`\`\`${(oldMessage.content || 'Boş').slice(0, 500)}\`\`\``, inline: false },
      { name: '✨ Yeni Hali', value: `\`\`\`${(newMessage.content || 'Boş').slice(0, 500)}\`\`\``, inline: false }
    )
    .setTimestamp();

  await sendForumLog(client, newMessage.guild, 'MESSAGE_LOGS', editEmbed);
}

/**
 * 3. Message Create: CAPS Burst / Toxic Patlama & DM Spam Tracker
 */
async function handleMessageCreateBehavior(client, message) {
  if (!message || !message.guild || message.author?.bot) return;

  const text = message.content || '';
  const now = Date.now();
  const userId = message.author.id;

  // 💬 DM Spam / Reklam Şüphelisi Tespiti
  const dmKeywords = ['dm bak', 'dm attım', 'dmden yazdım', 'inbox bak', 'özele gel', 'dme bak', 'dm at'];
  const lowerText = text.toLowerCase();
  if (dmKeywords.some(kw => lowerText.includes(kw))) {
    const dmAdvertEmbed = new EmbedBuilder()
      .setTitle('🚨 DM REKLAM ŞÜPHELİSİ TESPİT EDİLDİ!')
      .setColor(0xE74C3C)
      .setDescription(
        `**Şüpheli Üye:** ${message.author.toString()} (\`${message.author.id}\`)\n` +
        `**Kanal:** ${message.channel.toString()}\n` +
        `**Tespit Edilen Mesaj:**\n\`\`\`${text.slice(0, 500)}\`\`\`\n` +
        `⚠️ *Bu kullanıcı kanalda üyeleri DM'e çağırıyor. DM reklamı atıyor olabilir!*`
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Davranış & Psikoloji Logu • DM Reklam Dedektörü' })
      .setTimestamp();

    await sendForumLog(client, message.guild, 'BEHAVIOR_PSYCHOLOGY', dmAdvertEmbed);
  }

  // 😡 Toxic / CAPS Lock Öfke Patlaması Tespiti
  if (text.length >= 10) {
    let stats = userMessageStats.get(userId) || { timestamps: [], capsBurstCount: 0 };
    stats.timestamps.push(now);
    stats.timestamps = stats.timestamps.filter(ts => (now - ts) <= 10000); // 10 saniye penceresi

    const capsLetters = text.replace(/[^A-ZÇĞİÖŞÜ]/g, '').length;
    const totalLetters = text.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '').length;
    const isCapsBurst = totalLetters >= 8 && (capsLetters / totalLetters) >= 0.75;

    if (isCapsBurst) stats.capsBurstCount = (stats.capsBurstCount || 0) + 1;

    userMessageStats.set(userId, stats);

    if (stats.timestamps.length >= 3 && stats.capsBurstCount >= 2) {
      const rageEmbed = new EmbedBuilder()
        .setTitle('🤬 ANLIK ÖFKE PATLAMASI / CAPS SPAM TESPİTİ!')
        .setColor(0xFF5722)
        .setDescription(
          `**Kullanıcı:** ${message.author.toString()} (\`${message.author.id}\`)\n` +
          `**Kanal:** ${message.channel.toString()}\n` +
          `**Süreç:** 10 saniye içinde **${stats.timestamps.length} mesaj** atıldı ve yoğun CAPS LOCK / öfke tespit edildi.\n\n` +
          `**Son Mesaj:**\n\`\`\`${text.slice(0, 500)}\`\`\``
        )
        .setTimestamp();

      await sendForumLog(client, message.guild, 'BEHAVIOR_PSYCHOLOGY', rageEmbed);
      userMessageStats.delete(userId);
    }
  }
}

/**
 * 4. Voice State Tracker (AFK Harvester, Stream Activity, Voice Hopping)
 */
async function handleVoiceStateTracker(client, oldState, newState) {
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  const guild = newState.guild || oldState.guild;
  const userId = member.id;
  const now = Date.now();

  let vData = voiceStateTracker.get(userId) || {
    joinedAt: null,
    deafSince: null,
    muteSince: null,
    streamStartedAt: null,
    hops: []
  };

  // Sesli Kanala Katılma / Ayrılma / Değiştirme
  if (!oldState.channelId && newState.channelId) {
    // Join
    vData.joinedAt = now;
    if (newState.selfDeaf || newState.serverDeaf) vData.deafSince = now;
    if (newState.selfMute || newState.serverMute) vData.muteSince = now;

    const joinEmbed = new EmbedBuilder()
      .setTitle('🎙️ SESLİ KANALA KATILDI')
      .setColor(0x2ECC71)
      .setDescription(`**Üye:** ${member.toString()}\n**Kanal:** <#${newState.channelId}>`)
      .setTimestamp();
    await sendForumLog(client, guild, 'VOICE_BASIC_LOGS', joinEmbed);
  } else if (oldState.channelId && !newState.channelId) {
    // Leave
    const voiceMinutes = vData.joinedAt ? Math.floor((now - vData.joinedAt) / 60000) : 0;
    
    // Check if stayed deafened/muted >30 mins (AFK Voice Harvester / Secret Listener)
    if (vData.deafSince || vData.muteSince) {
      const deafMins = vData.deafSince ? Math.floor((now - vData.deafSince) / 60000) : 0;
      const muteMins = vData.muteSince ? Math.floor((now - vData.muteSince) / 60000) : 0;
      if (deafMins >= 30 || muteMins >= 30) {
        const afkEmbed = new EmbedBuilder()
          .setTitle('🎧 KULAKLIK / MİKROFON AFK SES SAATİ KASMA TESPİTİ')
          .setColor(0xF1C40F)
          .setDescription(
            `**Üye:** ${member.toString()} (\`${member.id}\`)\n` +
            `**Ayrıldığı Kanal:** <#${oldState.channelId}>\n` +
            `**Seste Kalma Süresi:** \`${voiceMinutes} dakika\`\n` +
            `**Kulaklık/Mikrofon Kapalı Süre:** Kulaklık \`${deafMins} dk\` | Mikrofon \`${muteMins} dk\`\n\n` +
            `⚠️ *Bu üye sesli kanalda uzun süre kulaklığı/mikrofonu kapalı olarak oturdu (AFK saat kasmış veya gizli dinlemiş olabilir).*`
          )
          .setTimestamp();
        await sendForumLog(client, guild, 'VOICE_MEDIA_ADVANCED', afkEmbed);
      }
    }

    const leaveEmbed = new EmbedBuilder()
      .setTitle('🚪 SESLİ KANALDIRAN AYRILDI')
      .setColor(0xE74C3C)
      .setDescription(`**Üye:** ${member.toString()}\n**Kanal:** <#${oldState.channelId}>\n**Toplam Süre:** \`${voiceMinutes} dk\``)
      .setTimestamp();
    await sendForumLog(client, guild, 'VOICE_BASIC_LOGS', leaveEmbed);

    voiceStateTracker.delete(userId);
    return;
  } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    // Switch channel
    const moveEmbed = new EmbedBuilder()
      .setTitle('🔀 SESLİ KANAL DEĞİŞTİRDİ')
      .setColor(0x3498DB)
      .setDescription(`**Üye:** ${member.toString()}\n**Eski Kanal:** <#${oldState.channelId}>\n**Yeni Kanal:** <#${newState.channelId}>`)
      .setTimestamp();
    await sendForumLog(client, guild, 'VOICE_BASIC_LOGS', moveEmbed);
  }

  // Voice Hop / Instability Detector
  vData.hops = (vData.hops || []).filter(ts => (now - ts) <= 30000);
  vData.hops.push(now);
  if (vData.hops.length >= 4) {
    const hopEmbed = new EmbedBuilder()
      .setTitle('⚡ SES KANALI SABIRSIZLIĞI / HIZLI KANAL HOPPING TESPİTİ')
      .setColor(0x9B59B6)
      .setDescription(
        `**Üye:** ${member.toString()} (\`${member.id}\`)\n` +
        `**Durum:** 30 saniye içinde **${vData.hops.length} kez** ses kanalı değiştirdi / giriş-çıkış yaptı!\n` +
        `*Bağlantı kopması veya hızlı kanal gezme davranışı.*`
      )
      .setTimestamp();
    await sendForumLog(client, guild, 'VOICE_MEDIA_ADVANCED', hopEmbed);
    vData.hops = [];
  }

  // Ekran Paylaşımı (Stream Activity Tracker)
  if (!oldState.streaming && newState.streaming) {
    vData.streamStartedAt = now;
    const streamStartEmbed = new EmbedBuilder()
      .setTitle('📺 EKRAN PAYLAŞIMI BAŞLADI')
      .setColor(0x9B59B6)
      .setDescription(`**Yayıncı:** ${member.toString()}\n**Kanal:** <#${newState.channelId}>`)
      .setTimestamp();
    await sendForumLog(client, guild, 'VOICE_MEDIA_ADVANCED', streamStartEmbed);
  } else if (oldState.streaming && !newState.streaming) {
    const streamMins = vData.streamStartedAt ? Math.max(1, Math.floor((now - vData.streamStartedAt) / 60000)) : 1;
    const viewersCount = newState.channel ? Math.max(0, newState.channel.members.size - 1) : 0;
    const streamEndEmbed = new EmbedBuilder()
      .setTitle('📊 EKRAN PAYLAŞIMI TAMAMLANDI (DETAY RAPORU)')
      .setColor(0x8E44AD)
      .setDescription(
        `**Yayın Yapan:** ${member.toString()}\n` +
        `**Kanal:** <#${oldState.channelId || newState.channelId}>\n` +
        `**Yayın Süresi:** \`${streamMins} dakika\`\n` +
        `**Kanaldaki İzleyici Sayısı:** \`${viewersCount} kişi\``
      )
      .setTimestamp();
    await sendForumLog(client, guild, 'VOICE_MEDIA_ADVANCED', streamEndEmbed);
    vData.streamStartedAt = null;
  }

  voiceStateTracker.set(userId, vData);
}

/**
 * 5. Alt-Account (Muhtemel Yan Hesap) & Member Join Tracker
 */
async function handleMemberJoinForensics(client, member) {
  if (!member || !member.guild) return;

  const now = Date.now();
  const createdTimestamp = member.user.createdTimestamp;
  const accountAgeDays = Math.floor((now - createdTimestamp) / (1000 * 60 * 60 * 24));

  // Alt-Account Warning if created < 7 days ago
  if (accountAgeDays <= 7) {
    const altEmbed = new EmbedBuilder()
      .setTitle('⚠️ YAPAY / YAN HESAP (ALT-ACCOUNT) UYARISI!')
      .setColor(0xE74C3C)
      .setDescription(
        `**Yeni Katılan Üye:** ${member.toString()} (\`${member.user.tag}\`)\n` +
        `**Hesap ID:** \`${member.id}\`\n` +
        `**Hesap Oluşturulma Tarihi:** <t:${Math.floor(createdTimestamp / 1000)}:F> (\`${accountAgeDays} gün önce\`)\n\n` +
        `⚠️ *Bu hesap henüz ${accountAgeDays} günlük çok yeni bir hesaptır! Olası ban affı delme veya yan hesap şüphesi.*`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Güvenlik & Forensics • Yan Hesap Tespiti' })
      .setTimestamp();

    await sendForumLog(client, member.guild, 'SECURITY_FORENSICS', altEmbed);
  }

  // Standard Member Join Log
  const joinEmbed = new EmbedBuilder()
    .setTitle('📥 ÜYE KATILDI')
    .setColor(0x2ECC71)
    .setDescription(
      `**Katılan:** ${member.toString()} (\`${member.user.tag}\`)\n` +
      `**Hesap Yaşı:** \`${accountAgeDays} gün\`\n` +
      `**Oluşturulma:** <t:${Math.floor(createdTimestamp / 1000)}:R>`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  await sendForumLog(client, member.guild, 'USER_MEMBER_LOGS', joinEmbed);
}

/**
 * 6. Member Remove Tracker
 */
async function handleMemberRemoveLog(client, member) {
  if (!member || !member.guild) return;

  const leaveEmbed = new EmbedBuilder()
    .setTitle('📤 ÜYE AYRILDI')
    .setColor(0xE74C3C)
    .setDescription(`**Ayrılan:** ${member.user?.tag || member.id} (\`${member.id}\`)`)
    .setThumbnail(member.user?.displayAvatarURL?.({ dynamic: true }) || null)
    .setTimestamp();

  await sendForumLog(client, member.guild, 'USER_MEMBER_LOGS', leaveEmbed);
}

/**
 * 7. Anti-Nuke Early Warning & Hierarchy Violation Handler
 */
async function handleAntiNukeAndHierarchy(client, guild, executor, type) {
  if (!guild || !executor) return;

  const now = Date.now();
  const key = `${guild.id}_${executor.id}_${type}`;
  let timestamps = antiNukeTracker.get(key) || [];
  timestamps.push(now);
  timestamps = timestamps.filter(ts => (now - ts) <= 60000); // 1 dakika
  antiNukeTracker.set(key, timestamps);

  const threshold = type === 'CHANNEL_DELETE' ? 3 : 5;
  if (timestamps.length >= threshold) {
    const nukeEmbed = new EmbedBuilder()
      .setTitle('🚨 KRİZ ALARMI: OLASI SUNUCU PATLATMA (NUKE) GİRİŞİMİ!')
      .setColor(0xFF0000)
      .setDescription(
        `**ŞÜPHELİ YETKİLİ:** ${executor.toString()} (\`${executor.tag}\` - ID: \`${executor.id}\`)\n` +
        `**EYLEM TÜRÜ:** \`${type}\`\n` +
        `**İŞLEM SAYISI:** 1 dakika içinde **${timestamps.length} işlem** gerçekleştirildi!\n\n` +
        `🔥 *ACİL MÜDAHALE GEREKEBİLİR! Bot yetkili eylemlerini izlemeye devam ediyor.*`
      )
      .setThumbnail(executor.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Gelişmiş Güvenlik & Forensics • Anti-Nuke Erken Uyarı' })
      .setTimestamp();

    await sendForumLog(client, guild, 'SECURITY_FORENSICS', nukeEmbed);
    antiNukeTracker.delete(key);
  }
}

module.exports = {
  LOG_TOPICS,
  initForumLogService,
  ensureGuildForumAndThreadsSafe,
  sendForumLog,
  handleGhostPingAndDelete,
  handleMessageEdit,
  handleMessageCreateBehavior,
  handleVoiceStateTracker,
  handleMemberJoinForensics,
  handleMemberRemoveLog,
  handleAntiNukeAndHierarchy
};
