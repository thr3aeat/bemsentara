'use strict';

const {
  EmbedBuilder,
  ChannelType,
  AuditLogEvent,
  PermissionFlagsBits
} = require('discord.js');

// ── Konfigürasyon ──────────────────────────────────────────────────────────
const CENTRAL_GUILD_ID = '1483482948320891074';
const LOG_CATEGORY_ID  = '1533849612945719296';

// ── 10 Temel Forum Log Konusu ─────────────────────────────────────────────
const LOG_TOPICS = {
  BEHAVIOR_PSYCHOLOGY: {
    key: 'BEHAVIOR_PSYCHOLOGY',
    name: '🧠 Davranış & Psikoloji Logları',
    description: 'Ghost ping, toxic/öfke patlamaları ve DM reklam şüphelisi takipleri'
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

// Memory Caches
const forumThreadsCache = new Map(); // `${guildId}_${topicKey}` -> threadId
const userMessageStats  = new Map(); // userId -> { timestamps: [], capsCount: 0 }
const voiceStateTracker  = new Map(); // userId -> { joinedAt, deafSince, muteSince, streamStartedAt, hops: [] }
const antiNukeTracker   = new Map(); // `${guildId}_${executorId}_${type}` -> timestamps

/**
 * Clean & sanitize guild name for Discord forum channel naming
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
 * Initialize / ensure Forum Channels and Threads exist for all servers on startup
 */
async function initForumLogService(client) {
  try {
    const centralGuild = client.guilds.cache.get(CENTRAL_GUILD_ID) ||
      await client.guilds.fetch(CENTRAL_GUILD_ID).catch(() => null);

    if (!centralGuild) {
      console.warn(`[ForumLogService] Central Guild ${CENTRAL_GUILD_ID} not found.`);
      return;
    }

    console.log(`[ForumLogService] Initializing multi-server forum log system in category ${LOG_CATEGORY_ID}...`);

    for (const guild of client.guilds.cache.values()) {
      await ensureGuildForumAndThreads(centralGuild, guild).catch(err => {
        console.error(`[ForumLogService] Error setting up forum for guild ${guild.name} (${guild.id}):`, err.message);
      });
    }

    console.log(`[ForumLogService] Multi-server forum log system ready. Cached ${forumThreadsCache.size} threads.`);
  } catch (err) {
    console.error('[ForumLogService] Startup initialization error:', err.message);
  }
}

/**
 * Ensures a Forum Channel exists under category 1533849612945719296 for a given guild
 */
async function ensureGuildForumAndThreads(centralGuild, guild) {
  const desiredName = formatForumName(guild);

  // Search existing channels under category 1533849612945719296
  let forumChannel = centralGuild.channels.cache.find(c =>
    c.parentId === LOG_CATEGORY_ID &&
    c.type === ChannelType.GuildForum &&
    (c.name === desiredName || c.topic?.includes(guild.id))
  );

  if (!forumChannel) {
    try {
      forumChannel = await centralGuild.channels.create({
        name: desiredName,
        type: ChannelType.GuildForum,
        parent: LOG_CATEGORY_ID,
        topic: `Log Hub for Server: ${guild.name} (ID: ${guild.id})`,
        reason: `Automated Log Forum Channel for ${guild.name}`
      });
      console.log(`[ForumLogService] Created Forum channel ${desiredName} for server ${guild.name}`);
    } catch (err) {
      console.error(`[ForumLogService] Failed to create Forum channel for ${guild.name}:`, err.message);
      return;
    }
  }

  // Fetch active & archived threads in this forum channel
  const activeThreads = await forumChannel.threads.fetchActive().catch(() => ({ threads: new Map() }));
  const archivedThreads = await forumChannel.threads.fetchArchived().catch(() => ({ threads: new Map() }));
  const allThreads = new Map([...activeThreads.threads, ...archivedThreads.threads]);

  // Ensure each of the 10 log topic threads exist
  for (const [topicKey, topicInfo] of Object.entries(LOG_TOPICS)) {
    const cacheKey = `${guild.id}_${topicKey}`;
    let thread = Array.from(allThreads.values()).find(t => t.name === topicInfo.name);

    if (!thread) {
      try {
        thread = await forumChannel.threads.create({
          name: topicInfo.name,
          message: {
            embeds: [
              new EmbedBuilder()
                .setTitle(topicInfo.name)
                .setDescription(`📌 **${guild.name}** sunucusu için **${topicInfo.name}** kanalı başlatıldı.\n\n*${topicInfo.description}*`)
                .setColor(0x2b2d31)
                .setFooter({ text: `EkoYıldız Forum Log • Sunucu: ${guild.name}` })
                .setTimestamp()
            ]
          }
        });
        console.log(`[ForumLogService] Created thread "${topicInfo.name}" in forum for ${guild.name}`);
      } catch (err) {
        console.error(`[ForumLogService] Thread creation failed for ${topicInfo.name} (${guild.name}):`, err.message);
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

/**
 * Send a log payload to the specific forum thread of a guild
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
      await ensureGuildForumAndThreads(centralGuild, guild);
      threadId = forumThreadsCache.get(cacheKey);
    }

    if (!threadId) return;

    const thread = centralGuild.channels.cache.get(threadId) ||
      await centralGuild.channels.fetch(threadId).catch(() => null);

    if (thread) {
      if (thread.archived) {
        await thread.setArchived(false).catch(() => {});
      }
      const embeds = Array.isArray(embedPayload) ? embedPayload : [embedPayload];
      await thread.send({ embeds }).catch(err => {
        console.warn(`[ForumLogService] Error sending to thread ${thread.name}:`, err.message);
      });
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

  // Check if message had user mentions (Ghost Ping)
  if (message.mentions?.users?.size > 0) {
    const mentionedUsers = message.mentions.users.map(u => `<@${u.id}> (\`${u.tag}\`)`).join(', ');

    const ghostEmbed = new EmbedBuilder()
      .setTitle('👻 GHOST PING (HAYALET ETİKET) YAKALANDI!')
      .setColor(0xE74C3C)
      .setDescription(
        `**Yazan Üye:** ${message.author.toString()} (\`${message.author.id}\`)\n` +
        `**Kanal:** ${message.channel.toString()}\n` +
        `**Etiketlenen Üyeler:** ${mentionedUsers}\n` +
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
  if (oldMessage.mentions?.users?.size > 0) {
    const oldMentions = oldMessage.mentions.users.map(u => u.id);
    const newMentions = newMessage.mentions?.users?.map(u => u.id) || [];
    const removedMentions = oldMentions.filter(id => !newMentions.includes(id));

    if (removedMentions.length > 0) {
      const removedText = removedMentions.map(id => `<@${id}>`).join(', ');
      const editGhostEmbed = new EmbedBuilder()
        .setTitle('👻 DÜZENLEMEDE GHOST PING YAKALANDI!')
        .setColor(0xE67E22)
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
  ensureGuildForumAndThreads,
  sendForumLog,
  handleGhostPingAndDelete,
  handleMessageEdit,
  handleMessageCreateBehavior,
  handleVoiceStateTracker,
  handleMemberJoinForensics,
  handleMemberRemoveLog,
  handleAntiNukeAndHierarchy
};
