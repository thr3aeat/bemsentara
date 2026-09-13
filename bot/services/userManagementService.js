const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");
const axios = require("axios");
const { BASE_URL, ROWIFI_TOKEN } = require("../../config");
const User = require("../../models/User");
const UserTrustScore = require("../../models/UserTrustScore");
const UserActivityLog = require("../../models/UserActivityLog");
const Economy = require("../../models/Economy");
const StaffProgress = require("../../models/StaffProgress");
const { tickets, courtCases, investigations, collections } = require("../../models/Store");
const {
  ensureUserTrustScore,
  updateTrustScore,
  calculateTrustTier,
  requestModTrustAction,
  logTrustUserActivity
} = require("./security/trustScoreService");

/**
 * Süre metnini (örn: 10m, 1h, 2d) milisaniyeye çevirir.
 */
function parseDurationMs(durationStr) {
  if (!durationStr) return 10 * 60 * 1000;
  const match = durationStr.trim().match(/^(\d+)\s*(s|m|h|d|w)?$/i);
  if (!match) return 10 * 60 * 1000;
  const val = parseInt(match[1], 10);
  const unit = (match[2] || "m").toLowerCase();
  switch (unit) {
    case "s": return val * 1000;
    case "m": return val * 60 * 1000;
    case "h": return val * 60 * 60 * 1000;
    case "d": return val * 24 * 60 * 60 * 1000;
    case "w": return val * 7 * 24 * 60 * 60 * 1000;
    default: return val * 60 * 1000;
  }
}

/**
 * Milisaniyeyi okunabilir süreye çevirir.
 */
function formatMsDuration(ms) {
  if (!ms || ms <= 0) return "0 dk";
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) return `${hours} sa ${mins} dk`;
  return `${mins} dk`;
}

/**
 * Yetki kontrolü: Yöneticiler, moderatörler veya bot yetkilileri
 */
function canManageUsers(member, dbUser = null) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  if (member.permissions.has(PermissionFlagsBits.ModerateMembers)) return true;
  if (member.permissions.has(PermissionFlagsBits.BanMembers)) return true;
  if (member.permissions.has(PermissionFlagsBits.KickMembers)) return true;
  if (dbUser && (dbUser.isAdmin || dbUser.isStaff || dbUser.isAuthorized)) return true;
  return false;
}

/**
 * Güven Puanı İlerleme Çubuğu Üretici
 */
function renderProgressBar(current, max = 500, length = 10) {
  const safeCurrent = Math.max(0, Math.min(max, current || 0));
  const ratio = safeCurrent / max;
  const filled = Math.round(ratio * length);
  const empty = length - filled;
  const bar = "🟩".repeat(filled) + "⬜".repeat(empty);
  const percent = Math.round(ratio * 100);
  return `${bar} \`%${percent}\``;
}

/**
 * Roblox hesap bilgilerini ve gruplarını çok katmanlı sorgular.
 */
async function fetchRobloxProfile(discordId, guildId) {
  let robloxId = null;
  let robloxUsername = null;
  let linkSource = null;

  // 1. Yerel Veritabanı Kontrolü
  try {
    const dbUser = await User.findOne({ discordId });
    if (dbUser && dbUser.robloxId) {
      robloxId = String(dbUser.robloxId);
      robloxUsername = dbUser.robloxUsername;
      linkSource = "Sunucu Veritabanı";
    }
  } catch (_) {}

  // 2. RoWifi API Kontrolü
  if (!robloxId && ROWIFI_TOKEN) {
    const guildsToCheck = [guildId, "1367646464804655104", "1483482948320891074"].filter(Boolean);
    for (const gId of guildsToCheck) {
      try {
        const url = `https://api.rowifi.xyz/v3/guilds/${gId}/members/${discordId}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bot ${ROWIFI_TOKEN}` },
          timeout: 2500
        });
        const resolvedId = res.data?.roblox_id || res.data?.robloxId || res.data?.roblox?.id || res.data?.user?.roblox_id;
        if (res.status === 200 && resolvedId) {
          robloxId = String(resolvedId);
          robloxUsername = res.data?.roblox_username || res.data?.robloxUsername || res.data?.roblox?.username || null;
          linkSource = gId === guildId ? "RoWifi API (Bu Sunucu)" : "RoWifi API (Merkez)";
          break;
        }
      } catch (_) {}
    }
  }

  // 3. Bloxlink API Kontrolü
  if (!robloxId) {
    try {
      const headers = process.env.BLOXLINK_API_KEY ? { Authorization: `Bearer ${process.env.BLOXLINK_API_KEY}` } : {};
      const urls = [
        `https://v3.api.blox.link/developer/discord/${discordId}`,
        guildId ? `https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordId}` : null
      ].filter(Boolean);
      for (const url of urls) {
        const res = await axios.get(url, { headers, timeout: 3500, validateStatus: status => status < 500 });
        const resolvedId = res.data?.robloxId || res.data?.roblox_id || res.data?.primaryAccount || res.data?.roblox?.id;
        if (res.status === 200 && resolvedId) {
          robloxId = String(resolvedId);
          robloxUsername = res.data?.robloxUsername || res.data?.roblox_username || res.data?.roblox?.username || null;
          linkSource = "Bloxlink API";
          break;
        }
      }
    } catch (_) {}
  }

  if (!robloxId) {
    return {
      hasLink: false,
      robloxId: null,
      username: "Bağlı Değil",
      displayName: "Yok",
      avatarUrl: null,
      createdStr: "Bilinmiyor",
      friendsCount: "Bilinmiyor",
      isBanned: false,
      description: "Yok",
      groupsText: "Bulunamadı",
      linkSource: "Bağlantı Yok"
    };
  }

  // Roblox API detaylarını çek
  let username = robloxUsername || "Bilinmiyor";
  let displayName = username;
  let avatarUrl = null;
  let createdStr = "Bilinmiyor";
  let friendsCount = "Bilinmiyor";
  let isBanned = false;
  let description = "Yok";
  let groupsText = "Grup bilgisi yok";

  try {
    const [userRes, thumbRes, friendRes] = await Promise.all([
      axios.get(`https://users.roblox.com/v1/users/${robloxId}`, { timeout: 4000 }).catch(() => null),
      axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxId}&size=150x150&format=Png&isCircular=false`, { timeout: 4000 }).catch(() => null),
      axios.get(`https://friends.roblox.com/v1/users/${robloxId}/friends/count`, { timeout: 4000 }).catch(() => null),
    ]);

    if (userRes && userRes.data) {
      username = userRes.data.name;
      displayName = userRes.data.displayName || username;
      description = userRes.data.description ? (userRes.data.description.length > 300 ? userRes.data.description.slice(0, 300) + "..." : userRes.data.description) : "Yok";
      isBanned = !!userRes.data.isBanned;
      if (userRes.data.created) {
        const createdDate = new Date(userRes.data.created);
        createdStr = `<t:${Math.floor(createdDate.getTime() / 1000)}:R> (<t:${Math.floor(createdDate.getTime() / 1000)}:d>)`;
      }
    }

    if (thumbRes && thumbRes.data && thumbRes.data.data && thumbRes.data.data[0]) {
      avatarUrl = thumbRes.data.data[0].imageUrl;
    }

    if (friendRes && friendRes.data) {
      friendsCount = `${friendRes.data.count} arkadaş`;
    }

    // Grupları çek
    try {
      const { fetchUserGroups } = require("./roleSyncService");
      const groups = await fetchUserGroups(robloxId).catch(() => []);
      if (groups && groups.length > 0) {
        groupsText = groups.slice(0, 5).map(g => `• **[${g.group.name}](https://www.roblox.com/groups/${g.group.id}):** ${g.role.name} \`(Rank: ${g.role.rank})\``).join("\n");
        if (groups.length > 5) {
          groupsText += `\n*+${groups.length - 5} grup daha...*`;
        }
      }
    } catch (_) {}
  } catch (err) {
    console.warn("[userManagementService] Roblox API lookup error:", err.message);
  }

  return {
    hasLink: true,
    robloxId,
    username,
    displayName,
    avatarUrl,
    createdStr,
    friendsCount,
    isBanned,
    description,
    groupsText,
    linkSource
  };
}

/**
 * Kullanıcıya ait tüm sistem verilerini derleyen ana fonksiyon.
 */
async function fetchComprehensiveUserData(targetUserId, guild, client) {
  const resolvedId = String(targetUserId);

  // 1. Discord User ve Member Bilgileri
  let discordUser = await client.users.fetch(resolvedId).catch(() => null);
  let member = null;
  if (guild) {
    member = await guild.members.fetch(resolvedId).catch(() => null);
  }
  if (!member) {
    for (const g of client.guilds.cache.values()) {
      const m = await g.members.fetch(resolvedId).catch(() => null);
      if (m) {
        member = m;
        break;
      }
    }
  }

  // 2. Veritabanı Kullanıcı Dokümanı
  let dbUser = await User.findOne({ discordId: resolvedId });
  if (!dbUser && discordUser) {
    try {
      dbUser = await User.create({
        discordId: resolvedId,
        discordUsername: discordUser.tag,
        joinedAt: member?.joinedAt || new Date()
      });
    } catch (_) {}
  }

  // 3. Güven Puanı (Trust Score) Dokümanı
  let trustRecord = null;
  try {
    trustRecord = await ensureUserTrustScore(resolvedId, guild?.id || "1367646464804655104", client);
  } catch (err) {
    console.warn("[userManagementService] ensureUserTrustScore error:", err.message);
    trustRecord = await UserTrustScore.findOne({ userId: resolvedId });
  }

  // 4. Roblox Verileri
  const robloxData = await fetchRobloxProfile(resolvedId, guild?.id);

  // 5. Ekonomi Dokümanı
  let economy = null;
  try {
    economy = await Economy.findOne({ userId: resolvedId });
  } catch (_) {}

  // 6. Personel & Yetkili İlerleme
  let staffProgress = null;
  try {
    staffProgress = await StaffProgress.findOne({ userId: resolvedId });
  } catch (_) {}

  // 7. Tüm Loglar, Davalar, Biletler
  const activityLogs = UserActivityLog.getByUser(resolvedId, 100) || [];
  const userTickets = tickets ? (tickets.find({ userId: resolvedId }) || []) : [];
  const userCourtCases = courtCases ? (courtCases.find({ targetId: resolvedId }) || courtCases.find({ userId: resolvedId }) || []) : [];
  const userInvestigations = investigations ? (investigations.find({ targetId: resolvedId }) || investigations.find({ userId: resolvedId }) || []) : [];
  const adminNotes = dbUser?.adminNotes || [];
  const criminalRecord = dbUser?.criminalRecord || [];

  return {
    resolvedId,
    discordUser,
    member,
    dbUser,
    trustRecord,
    robloxData,
    economy,
    staffProgress,
    activityLogs,
    userTickets,
    userCourtCases,
    userInvestigations,
    adminNotes,
    criminalRecord,
    fetchedAt: new Date()
  };
}

/**
 * Kullanıcı İnceleme & Yönetim Panelinin Embed ve Bileşenlerini Oluşturur.
 */
function buildIncelePayload(data, activeTab = "overview", executorMember = null) {
  const {
    resolvedId,
    discordUser,
    member,
    dbUser,
    trustRecord,
    robloxData,
    economy,
    staffProgress,
    activityLogs,
    userTickets,
    userCourtCases,
    userInvestigations,
    adminNotes,
    criminalRecord
  } = data;

  const tag = discordUser ? discordUser.tag : (dbUser?.discordUsername || `Kullanıcı (${resolvedId})`);
  const avatar = discordUser
    ? discordUser.displayAvatarURL({ dynamic: true, size: 256 })
    : (dbUser?.discordAvatar || robloxData.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png");

  const trustScore = trustRecord ? Number(trustRecord.trustScore || 100).toFixed(1) : "100.0";
  const numScore = parseFloat(trustScore);
  const tier = calculateTrustTier ? calculateTrustTier(numScore) : 2;

  // Risk ve Durum Değerlendirmesi
  let riskBadge = "🟢 Düşük Risk (Güvenilir)";
  let riskColor = 0x57f287; // Green
  if (dbUser?.isBanned) {
    riskBadge = "⛔ YASAKLI / KARA LİSTEDE";
    riskColor = 0xed4245; // Red
  } else if (numScore < 50) {
    riskBadge = "🔴 YÜKSEK RİSK (Kritik)";
    riskColor = 0xed4245;
  } else if (numScore < 80) {
    riskBadge = "🟡 ORTA RİSK (İncelemede)";
    riskColor = 0xfee75c; // Yellow
  } else if (numScore >= 140) {
    riskBadge = "⭐ ÇOK GÜVENİLİR (Örnek Üye)";
    riskColor = 0x5865f2; // Blurple
  }

  const embed = new EmbedBuilder()
    .setColor(riskColor)
    .setThumbnail(avatar)
    .setFooter({
      text: `Sentara Güvenlik & Denetim Hub • ID: ${resolvedId} • Tab: ${activeTab.toUpperCase()}`,
      iconURL: discordUser?.displayAvatarURL() || undefined
    })
    .setTimestamp();

  // ─────────────────────────────────────────────────────────────
  // SEKME 1: 📌 GENEL BAKIŞ & KİMLİK (OVERVIEW)
  // ─────────────────────────────────────────────────────────────
  if (activeTab === "overview") {
    embed.setTitle(`🔍 Kullanıcı Yönetim & Denetim: ${tag}`);
    embed.setDescription(
      `> Bu panel üzerinden **${tag}** kullanıcısının Discord, Roblox, güvenlik skoru ve tüm sistem hareketlerini tek bir yerden görüntüleyebilir ve yönetebilirsiniz.\n\n` +
      `**🛡️ Güvenlik Özeti:** ${riskBadge} | **⭐ Güven Puanı:** \`${trustScore} TS\` (Kademe: \`Tier ${tier}\`)\n` +
      `**📊 Güven Puanı Barı:** ${renderProgressBar(numScore, 500, 10)}`
    );

    // Discord Bölümü
    const createdTs = discordUser ? Math.floor(discordUser.createdTimestamp / 1000) : null;
    const joinedTs = member && member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

    let rolesStr = "Yok";
    if (member && member.roles && member.roles.cache) {
      let roleList = [];
      const cache = member.roles.cache;
      const guildId = member.guild?.id;
      if (typeof cache.values === "function") {
        roleList = Array.from(cache.values()).filter(r => r && r.id !== guildId);
      } else if (Array.isArray(cache)) {
        roleList = cache.filter(r => r && r.id !== guildId);
      }
      roleList.sort((a, b) => (b.position || 0) - (a.position || 0));
      if (roleList.length > 0) {
        rolesStr = roleList.map(r => r.toString()).slice(0, 12).join(", ");
        if (roleList.length > 12) rolesStr += ` *(+${roleList.length - 12} rol)*`;
      }
    }

    const isTimeout = member && member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now();
    const timeoutStr = isTimeout ? `⚠️ <t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:R> sona eriyor` : "Yok";

    embed.addFields(
      {
        name: "📱 Discord Kimliği",
        value:
          `• **Kullanıcı:** <@${resolvedId}> (\`${resolvedId}\`)\n` +
          `• **Hesap Açılış:** ${createdTs ? `<t:${createdTs}:F> (<t:${createdTs}:R>)` : "Bilinmiyor"}\n` +
          `• **Sunucuya Giriş:** ${joinedTs ? `<t:${joinedTs}:F> (<t:${joinedTs}:R>)` : "Sunucuda değil / Ayrılmış"}\n` +
          `• **Takma Ad:** \`${member?.nickname || "Yok"}\` | **Bot mu:** \`${discordUser?.bot ? "Evet 🤖" : "Hayır 👤"}\`\n` +
          `• **Susturma (Timeout):** ${timeoutStr}\n` +
          `• **Roller (${member?.roles?.cache?.size ? member.roles.cache.size - 1 : 0}):** ${rolesStr}`,
        inline: false
      },
      {
        name: "🎮 Roblox Entegrasyonu",
        value: robloxData.hasLink
          ? `• **Kullanıcı:** [${robloxData.username}](https://www.roblox.com/users/${robloxData.robloxId}/profile) (\`${robloxData.robloxId}\`)\n` +
            `• **Görünen Ad:** ${robloxData.displayName}\n` +
            `• **Hesap Açılış:** ${robloxData.createdStr}\n` +
            `• **Arkadaş:** ${robloxData.friendsCount} | **Yasaklı mı:** ${robloxData.isBanned ? "⚠️ Evet" : "Temiz"}\n` +
            `• **Doğrulama Kaynağı:** \`${robloxData.linkSource}\``
          : `❌ Doğrulanmış bir Roblox hesabı bulunamadı.`,
        inline: false
      },
      {
        name: "📊 Sistem & Aktivite Sayaçları",
        value:
          `• 🔊 **Ses Süresi:** \`${formatMsDuration(staffProgress?.voiceTime || trustRecord?.activeVoiceSeconds ? (trustRecord?.activeVoiceSeconds * 1000) : 0)}\`\n` +
          `• 💬 **Toplam Mesaj:** \`${(staffProgress?.totalMessages || trustRecord?.messageCount || 0).toLocaleString('tr-TR')}\`\n` +
          `• 🎫 **Destek Biletleri:** \`${userTickets.length} talep\`\n` +
          `• ⚖️ **Mahkeme & Soruşturma:** \`${userCourtCases.length + userInvestigations.length} dosya\`\n` +
          `• 📝 **Yönetici Notları:** \`${adminNotes.length} not\` | **Sabıka:** \`${criminalRecord.length} kayıt\``,
        inline: false
      }
    );

    if (dbUser?.isBanned) {
      embed.addFields({
        name: "🚫 Aktif Yasaklama Bilgisi (Ceza Dosyası)",
        value:
          `**Sebep:** ${dbUser.banReason || "Belirtilmedi"}\n` +
          `**Tarih:** ${dbUser.bannedAt ? `<t:${Math.floor(new Date(dbUser.bannedAt).getTime() / 1000)}:F>` : "Bilinmiyor"}\n` +
          `**Yasaklayan Yetkili:** <@${dbUser.bannedBy || "Bilinmiyor"}>`,
        inline: false
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SEKME 2: 🛡️ GÜVEN PUANI & RİSK ANALİZİ (TRUST_SCORE)
  // ─────────────────────────────────────────────────────────────
  else if (activeTab === "trust_score") {
    embed.setTitle(`🛡️ Güven Puanı & Güvenlik Matrisi: ${tag}`);
    embed.setDescription(
      `Sentara Gelişmiş Güvenlik ve İtibar Motoru (TrustScore Engine) tarafından hesaplanan güncel parametreler ve puan hareketleri aşağıda listelenmiştir.\n\n` +
      `**⭐ Güncel Skor:** \`${trustScore} / 500.0 TS\`\n` +
      `**🏆 Güven Kademesi:** \`Tier ${tier}\` (${tier === 3 ? "Kıdemli Lider" : tier === 2 ? "Güvenilir Üye" : tier === 1 ? "Yeni / İncelemede" : "Yüksek Risk"})\n` +
      `**📊 Puan Barı:** ${renderProgressBar(numScore, 500, 12)}`
    );

    const bonusAcc = trustRecord?.bonusAccountAge || 0;
    const bonusJoin = trustRecord?.bonusJoinAge || 0;
    const bonus2FA = trustRecord?.bonus2FA ? "✅ +10 TS (Etkin)" : "❌ 0 TS (Kapalı)";
    const bonusPhone = trustRecord?.bonusPhone ? "✅ +10 TS (Doğrulandı)" : "❌ 0 TS (Doğrulanmadı)";
    const dailyChat = (trustRecord?.dailyChatPoints || 0).toFixed(1);
    const dailyVoice = (trustRecord?.dailyVoicePoints || 0).toFixed(1);
    const violations = trustRecord?.violationCount || 0;
    const capsViolations = trustRecord?.capsViolationsCount || 0;

    embed.addFields(
      {
        name: "📈 Puan Çarpanları & Bonuslar",
        value:
          `• 🗓️ **Hesap Yaşı Bonusu:** \`+${bonusAcc} TS\`\n` +
          `• 🛡️ **Sunucu Sadakat Bonusu:** \`+${bonusJoin} TS\`\n` +
          `• 🔐 **2FA (İki Aşamalı Doğrulama):** ${bonus2FA}\n` +
          `• 📱 **Telefon Doğrulaması:** ${bonusPhone}\n` +
          `• 💬 **Bugünkü Chat Puanı:** \`+${dailyChat} TS\`\n` +
          `• 🔊 **Bugünkü Ses Puanı:** \`+${dailyVoice} TS\`\n` +
          `• 🔥 **Günlük Streak:** \`${trustRecord?.dailyStreak || 0} gün\``,
        inline: true
      },
      {
        name: "📉 İhlal & Ceza Sayaçları",
        value:
          `• 🚨 **Toplam İhlal Sayısı:** \`${violations} ihlal\`\n` +
          `• 🔠 **Caps / Spam İhlalleri:** \`${capsViolations} kez\`\n` +
          `• ⚖️ **Bekleyen Çift Onay:** ${trustRecord?.pendingModAction ? `⚠️ Var (±${trustRecord.pendingModAction.amount} TS)` : "Yok"}\n` +
          `• 🧹 **Temiz Sicil Ödülü:** ${trustRecord?.cleanSheetLastAwarded ? `✅ <t:${Math.floor(new Date(trustRecord.cleanSheetLastAwarded).getTime() / 1000)}:R>` : "Henüz alınmadı"}`,
        inline: true
      }
    );

    // Son Güven Puanı Logları (Son 6 adet)
    const scoreLogs = (trustRecord?.scoreLogs || []).slice(-6).reverse();
    if (scoreLogs.length > 0) {
      const logsText = scoreLogs.map(l => {
        const sign = l.amount >= 0 ? "+" : "";
        const amtStr = `${sign}${Number(l.amount).toFixed(1)} TS`;
        const timeStr = l.timestamp ? `<t:${Math.floor(new Date(l.timestamp).getTime() / 1000)}:R>` : "Az önce";
        const opStr = l.operatorId ? `<@${l.operatorId}>` : "Sistem";
        return `• \`${amtStr}\` **${l.reason || "Puan Hareketi"}** — ${opStr} (${timeStr})`;
      }).join("\n");

      embed.addFields({
        name: "📜 Son Güven Puanı Değişimleri",
        value: logsText,
        inline: false
      });
    } else {
      embed.addFields({
        name: "📜 Son Güven Puanı Değişimleri",
        value: "*Henüz kaydedilmiş bir güven puanı hareketi bulunmuyor.*",
        inline: false
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SEKME 3: 📜 TÜM LOGLAR & OLAY GEÇMİŞİ (LOGS)
  // ─────────────────────────────────────────────────────────────
  else if (activeTab === "logs") {
    embed.setTitle(`📜 Tüm Olay & Hareket Geçmişi: ${tag}`);
    embed.setDescription(
      `Kullanıcının Discord komutları, moderasyon cezaları, biletleri, mahkeme kayıtları ve admin notları kronolojik olarak aşağıda listelenmiştir.\n\n` +
      `🌐 *Daha geniş filtreleme ve tüm geçmiş için aşağıdaki Web Log butonunu kullanabilirsiniz.*`
    );

    const timeline = [];

    // 1. Admin Notları
    adminNotes.forEach(n => {
      timeline.push({
        type: "NOTE",
        icon: "📝",
        title: `Yönetici Notu [${n.category || "Genel"}]`,
        desc: `${n.note} *(Yazan: ${n.modTag || n.modId || "Yetkili"})*`,
        timestamp: new Date(n.createdAt || Date.now()).getTime()
      });
    });

    // 2. Sabıka / Ceza Kayıtları
    criminalRecord.forEach(cr => {
      timeline.push({
        type: "CRIME",
        icon: "⚖️",
        title: `Cezai Hüküm (#${cr.caseCode || "CEZA"})`,
        desc: `Madde: ${cr.lawArticle || "İhlal"} | Karar: **${cr.verdict || "Suçlu"}**`,
        timestamp: new Date(cr.date || Date.now()).getTime()
      });
    });

    // 3. Mahkeme Davaları
    userCourtCases.forEach(c => {
      timeline.push({
        type: "COURT",
        icon: "🏛️",
        title: `Mahkeme Dosyası: #${c.caseId || c.caseCode || "DAVA"}`,
        desc: `Gerekçe: ${c.reason || "Dava konusu"} | Durum: ${c.status || "Aktif"}`,
        timestamp: new Date(c.createdAt || Date.now()).getTime()
      });
    });

    // 4. Biletler
    userTickets.forEach(t => {
      timeline.push({
        type: "TICKET",
        icon: "🎫",
        title: `Destek Bileti: #${t.ticketId || "bilet"}`,
        desc: `Kategori: ${t.category || "Destek"} | Durum: ${t.status === "closed" ? "Kapatıldı 🔒" : "Açık 🟢"}`,
        timestamp: new Date(t.createdAt || Date.now()).getTime()
      });
    });

    // 5. UserActivityLog'ları (Komutlar & Mod Eylemleri)
    activityLogs.slice(0, 25).forEach(l => {
      let icon = "💬";
      let title = "Aktivite";
      let desc = "Sistem olayı";
      if (l.activityType === "command") {
        icon = "💬";
        title = `Komut Kullanımı: /${l.details?.commandName || "komut"}`;
        desc = l.details?.channelName ? `Kanal: #${l.details.channelName}` : "Sunucu komutu";
      } else if (l.activityType === "mod_action" || l.activityType === "warn" || l.activityType === "timeout" || l.activityType === "ban") {
        icon = "⚖️";
        title = `Moderatör Eylemi: ${l.activityType.toUpperCase()}`;
        desc = `${l.details?.action || l.details?.reason || "İşlem yapıldı"} *(Mod: ${l.details?.modTag || l.details?.modId || "Yetkili"})*`;
      } else if (l.activityType === "admin_note") {
        return; // Zaten adminNotes'tan çekildi
      } else if (l.activityType === "trust_score") {
        icon = "⭐";
        title = `Güven Puanı: ${l.details?.amount >= 0 ? "+" : ""}${l.details?.amount} TS`;
        desc = `Gerekçe: ${l.details?.reason || "Puan güncellemesi"}`;
      } else {
        icon = "📌";
        title = l.activityType.toUpperCase();
        desc = JSON.stringify(l.details || {});
      }
      timeline.push({
        type: "ACTIVITY",
        icon,
        title,
        desc,
        timestamp: new Date(l.timestamp).getTime()
      });
    });

    timeline.sort((a, b) => b.timestamp - a.timestamp);

    if (timeline.length > 0) {
      const displayTimeline = timeline.slice(0, 10).map(item => {
        const timeStr = `<t:${Math.floor(item.timestamp / 1000)}:R>`;
        return `${item.icon} **${item.title}** (${timeStr})\n   └─ ${item.desc}`;
      }).join("\n\n");

      embed.addFields({
        name: `📋 Son Olay Kayıtları (İlk 10 / ${timeline.length})`,
        value: displayTimeline,
        inline: false
      });
    } else {
      embed.addFields({
        name: "📋 Olay Kayıtları",
        value: "*Kullanıcıya ait kaydedilmiş herhangi bir ceza, bilet veya aktivite logu bulunmamaktadır.*",
        inline: false
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SEKME 4: ⚖️ KULLANICI YÖNETİM & MODERASYON (ACTIONS)
  // ─────────────────────────────────────────────────────────────
  else if (activeTab === "actions") {
    embed.setTitle(`⚖️ Kullanıcı Yönetim & Hızlı Aksiyon Paneli: ${tag}`);
    embed.setDescription(
      `Yetkili olarak bu kullanıcı üzerinde doğrudan moderasyon işlemlerini yürütebilir, ceza verebilir veya güven puanı müdahalesinde bulunabilirsiniz.\n\n` +
      `**Anlık Durum:**\n` +
      `• Yasaklama Durumu: ${dbUser?.isBanned ? "🔴 **Yasaklı (Ban)**" : "🟢 **Yasaklı Değil (Aktif)**"}\n` +
      `• Susturma (Timeout): ${member && member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now() ? `⚠️ **Susturulmuş** (<t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:R> açılacak)` : "🟢 **Susturma Yok**"}\n` +
      `• Mevcut Güven Puanı: \`${trustScore} TS\`\n` +
      `• Toplam Sabıka Kaydı: \`${criminalRecord.length} adet\` | Yönetici Notu: \`${adminNotes.length} adet\`\n\n` +
      `*Aşağıdaki interaktif butonları kullanarak işlem yapabilirsiniz.*`
    );

    embed.addFields(
      {
        name: "🛡️ 1. Güven Puanı Müdahalesi",
        value: "Kullanıcıya başarı, yardım veya ihlal durumunda manuel puan ekleyin veya kırın. (Kanıt bağlantısı otomatik zorunludur)",
        inline: true
      },
      {
        name: "📝 2. Yönetici Notu Bırakma",
        value: "Kullanıcının sicil dosyasına diğer yetkililerin görebileceği kalıcı inceleme notları ekleyin.",
        inline: true
      },
      {
        name: "⚠️ 3. Resmi Uyarı (Warn)",
        value: "Kullanıcıya DM üzerinden resmi uyarı gönderin ve güven puanından otomatik kesinti uygulayın.",
        inline: true
      },
      {
        name: "🔇 4. Zaman Aşımı / Susturma",
        value: "Kullanıcıyı belirli bir süre boyunca sunucuda metin ve ses kanallarından susturun.",
        inline: true
      },
      {
        name: "🚫 5. Global Yasaklama (Ban)",
        value: "Kullanıcıyı botun bağlı olduğu tüm sunuculardan ve web portalından derhal men edin.",
        inline: true
      },
      {
        name: "🔄 6. Canlı Veri Yenileme",
        value: "Roblox, Discord ve veritabanı kayıtlarını anlık olarak yeniden senkronize edin.",
        inline: true
      }
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SEKME 5: 💼 EKONOMİ, SEVİYE & VARLIKLAR (ECONOMY)
  // ─────────────────────────────────────────────────────────────
  else if (activeTab === "economy") {
    embed.setTitle(`💼 Ekonomi, Rütbe & Sunucu Varlıkları: ${tag}`);
    embed.setDescription(
      `Kullanıcının sunucu içi ekonomi dengesi, oyun istatistikleri, rütbe ve rozet bilgileri aşağıda özetlenmiştir.`
    );

    const wallet = (economy?.wallet || 0).toLocaleString("tr-TR");
    const bank = (economy?.bank || 0).toLocaleString("tr-TR");
    const totalEarned = (economy?.totalEarned || 0).toLocaleString("tr-TR");
    const gamesPlayed = economy?.gamesPlayed || 0;
    const gamesWon = economy?.gamesWon || 0;
    const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

    const level = staffProgress?.level || 1;
    const xp = staffProgress?.xp || 0;
    const rankName = staffProgress?.rank || "Üye";

    embed.addFields(
      {
        name: "💰 Bakiye & Finans",
        value:
          `• 🪙 **Cüzdan:** \`${wallet} Coin\`\n` +
          `• 🏦 **Banka:** \`${bank} Coin\`\n` +
          `• 💎 **Toplam Kazanç:** \`${totalEarned} Coin\`\n` +
          `• 🏆 **Oyun Başarısı:** \`${gamesWon} / ${gamesPlayed}\` (\`%${winRate} Kazanma\`)`,
        inline: true
      },
      {
        name: "🎖️ Rütbe & Seviye",
        value:
          `• 🔰 **Seviye:** \`Level ${level}\` (\`${xp.toLocaleString("tr-TR")} XP\`)\n` +
          `• 🏷️ **Unvan / Rütbe:** \`${rankName}\`\n` +
          `• 🏛️ **Örnek Vatandaş mı:** ${dbUser?.isOrnekVatandas ? "✅ Evet (Sicili Temiz)" : "❌ Hayır (Sabıkalı)"}\n` +
          `• 🛡️ **Birim / Departman:** \`${staffProgress?.unit || "Genel Topluluk"}\``,
        inline: true
      }
    );

    // Envanter & Rozetler
    const inventory = economy?.inventory || [];
    const badges = economy?.profileBadges || [];

    let invStr = "Envanter boş";
    if (inventory.length > 0) {
      invStr = inventory.slice(0, 6).map(i => `• ${i.icon || "📦"} **${i.name}**`).join("\n");
      if (inventory.length > 6) invStr += `\n*+${inventory.length - 6} eşya daha...*`;
    }

    embed.addFields({
      name: `🎒 Envanter (${inventory.length}) & Rozetler (${badges.length})`,
      value: invStr,
      inline: false
    });
  }

  // ─────────────────────────────────────────────────────────────
  // BİLEŞENLER (SELECT MENU & BUTTONS)
  // ─────────────────────────────────────────────────────────────
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`incele_tab_${resolvedId}`)
    .setPlaceholder("📂 Sayfayı veya İnceleme Modunu Değiştirin...")
    .addOptions(
      {
        label: "Genel Bakış & Kimlik",
        description: "Discord, Roblox, roller ve güvenlik özeti",
        value: "overview",
        emoji: "📌",
        default: activeTab === "overview"
      },
      {
        label: "Güven Puanı & Risk Analizi",
        description: "Detaylı Trust Score puanı, bonuslar ve puan geçmişi",
        value: "trust_score",
        emoji: "🛡️",
        default: activeTab === "trust_score"
      },
      {
        label: "Tüm Loglar & Olay Geçmişi",
        description: "Ceza geçmişi, komut logları, biletler, davalar",
        value: "logs",
        emoji: "📜",
        default: activeTab === "logs"
      },
      {
        label: "Kullanıcı Yönetimi & Moderasyon",
        description: "Puan düzenleme, not ekleme, susturma, yasaklama",
        value: "actions",
        emoji: "⚖️",
        default: activeTab === "actions"
      },
      {
        label: "Ekonomi, Rütbe & Varlıklar",
        description: "Bakiye, seviye, unvan ve envanter bilgileri",
        value: "economy",
        emoji: "💼",
        default: activeTab === "economy"
      }
    );

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);

  // Aksiyon Butonları
  const isBanned = !!dbUser?.isBanned;
  const isMuted = member && member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now();

  const actionButtonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`incele_btn_trust_${resolvedId}`)
      .setLabel("Puan Düzenle")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🛡️"),
    new ButtonBuilder()
      .setCustomId(`incele_btn_note_${resolvedId}`)
      .setLabel("Not Ekle")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📝"),
    new ButtonBuilder()
      .setCustomId(`incele_btn_warn_${resolvedId}`)
      .setLabel("Uyarı Ver")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⚠️"),
    new ButtonBuilder()
      .setCustomId(isMuted ? `incele_btn_unmute_${resolvedId}` : `incele_btn_mute_${resolvedId}`)
      .setLabel(isMuted ? "Susturma Kaldır" : "Sustur")
      .setStyle(isMuted ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setEmoji(isMuted ? "🔊" : "🔇"),
    new ButtonBuilder()
      .setCustomId(isBanned ? `incele_btn_unban_${resolvedId}` : `incele_btn_ban_${resolvedId}`)
      .setLabel(isBanned ? "Yasak Kaldır" : "Yasakla")
      .setStyle(isBanned ? ButtonStyle.Success : ButtonStyle.Danger)
      .setEmoji(isBanned ? "🔓" : "🚫")
  );

  const utilityRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`incele_btn_refresh_${resolvedId}_${activeTab}`)
      .setLabel("Yenile")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔄"),
    new ButtonBuilder()
      .setLabel("Canlı Web Logları")
      .setStyle(ButtonStyle.Link)
      .setURL(`${BASE_URL}/user-logs/${resolvedId}`)
      .setEmoji("🌐")
  );

  return {
    embeds: [embed],
    components: [selectRow, actionButtonsRow, utilityRow]
  };
}

/**
 * Slash komutu /incele çalıştığında tetiklenir.
 */
async function handleInceleCommand(interaction) {
  // Yetki Kontrolü
  const dbExecutor = await User.findOne({ discordId: interaction.user.id }).catch(() => null);
  if (!canManageUsers(interaction.member, dbExecutor)) {
    return interaction.editReply({
      content: "❌ Bu gelişmiş yönetim komutunu kullanmak için **Yönetici** veya **Moderatör** yetkilerine sahip olmalısınız."
    });
  }

  // Hedef Kullanıcıyı Belirle
  let targetUser = interaction.options.getUser("kullanici");
  const queryStr = interaction.options.getString("kullanici_id") || interaction.options.getString("kullanici");

  if (!targetUser && queryStr) {
    const cleanQuery = queryStr.replace(/[<@!>]/g, "").trim();
    if (/^\d{17,20}$/.test(cleanQuery)) {
      targetUser = await interaction.client.users.fetch(cleanQuery).catch(() => null);
    }
    if (!targetUser) {
      const foundMember = await interaction.guild.members.fetch({ query: cleanQuery, limit: 1 }).catch(() => null);
      if (foundMember && foundMember.size > 0) {
        targetUser = foundMember.first().user;
      }
    }
    if (!targetUser) {
      const foundDb = await User.findOne({
        $or: [
          { discordId: cleanQuery },
          { discordUsername: new RegExp(`^${cleanQuery}$`, "i") },
          { robloxUsername: new RegExp(`^${cleanQuery}$`, "i") },
          { robloxId: cleanQuery }
        ]
      });
      if (foundDb && foundDb.discordId) {
        targetUser = await interaction.client.users.fetch(foundDb.discordId).catch(() => null);
      }
    }
  }

  // Eğer hiçbir şey verilmediyse komutu kullanan kişiyi göster
  if (!targetUser) {
    targetUser = interaction.user;
  }

  // İnceleme İşlemini Logla
  try {
    UserActivityLog.log(targetUser.id, "inspection", {
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      guildId: interaction.guild?.id
    });
  } catch (_) {}

  const data = await fetchComprehensiveUserData(targetUser.id, interaction.guild, interaction.client);
  const payload = buildIncelePayload(data, "overview", interaction.member);

  return interaction.editReply(payload);
}

/**
 * Select Menüden sekme değiştiğinde tetiklenir.
 */
async function handleInceleSelectMenu(interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith("incele_tab_")) return false;

  const targetUserId = customId.replace("incele_tab_", "");
  const selectedTab = interaction.values[0] || "overview";

  await interaction.deferUpdate().catch(() => {});

  const data = await fetchComprehensiveUserData(targetUserId, interaction.guild, interaction.client);
  const payload = buildIncelePayload(data, selectedTab, interaction.member);

  await interaction.editReply(payload).catch(err => console.error("[handleInceleSelectMenu] error:", err.message));
  return true;
}

/**
 * İncele panelindeki butonlara tıklandığında tetiklenir.
 */
async function handleInceleButton(interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith("incele_btn_")) return false;

  const dbExecutor = await User.findOne({ discordId: interaction.user.id }).catch(() => null);
  if (!canManageUsers(interaction.member, dbExecutor)) {
    return interaction.reply({
      content: "❌ Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor!",
      flags: MessageFlags.Ephemeral
    });
  }

  // 1. Yenileme Butonu
  if (customId.startsWith("incele_btn_refresh_")) {
    const parts = customId.replace("incele_btn_refresh_", "").split("_");
    const targetUserId = parts[0];
    const activeTab = parts[1] || "overview";

    await interaction.deferUpdate().catch(() => {});
    const data = await fetchComprehensiveUserData(targetUserId, interaction.guild, interaction.client);
    const payload = buildIncelePayload(data, activeTab, interaction.member);
    await interaction.editReply(payload).catch(() => {});
    return true;
  }

  // 2. Güven Puanı Düzenleme Modalı Aç
  if (customId.startsWith("incele_btn_trust_")) {
    const targetUserId = customId.replace("incele_btn_trust_", "");
    const modal = new ModalBuilder()
      .setCustomId(`incele_modal_trust_${targetUserId}`)
      .setTitle("🛡️ Güven Puanı (TS) Düzenleme");

    const amountInput = new TextInputBuilder()
      .setCustomId("ts_amount")
      .setLabel("Puan Değişimi (+15 veya -20 gibi)")
      .setPlaceholder("+20 veya -15")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId("ts_reason")
      .setLabel("İşlem Gerekçesi")
      .setPlaceholder("Sunucuya destek / İhlal cezası / Görev tamamlama...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const proofInput = new TextInputBuilder()
      .setCustomId("ts_proof")
      .setLabel("Kanıt Bağlantısı (URL veya Mesaj ID)")
      .setPlaceholder("https://cdn.discordapp.com/... veya mesaj linki")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(amountInput),
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(proofInput)
    );

    await interaction.showModal(modal);
    return true;
  }

  // 3. Yönetici Notu Ekleme Modalı Aç
  if (customId.startsWith("incele_btn_note_")) {
    const targetUserId = customId.replace("incele_btn_note_", "");
    const modal = new ModalBuilder()
      .setCustomId(`incele_modal_note_${targetUserId}`)
      .setTitle("📝 Yönetici Notu Ekle");

    const noteInput = new TextInputBuilder()
      .setCustomId("note_text")
      .setLabel("Not Metni")
      .setPlaceholder("Kullanıcı hakkında yetkililerin görmesi gereken not...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const catInput = new TextInputBuilder()
      .setCustomId("note_category")
      .setLabel("Kategori (Genel / Güvenlik / Şüpheli / Ödül)")
      .setPlaceholder("Güvenlik")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(noteInput),
      new ActionRowBuilder().addComponents(catInput)
    );

    await interaction.showModal(modal);
    return true;
  }

  // 4. Uyarı (Warn) Modalı Aç
  if (customId.startsWith("incele_btn_warn_")) {
    const targetUserId = customId.replace("incele_btn_warn_", "");
    const modal = new ModalBuilder()
      .setCustomId(`incele_modal_warn_${targetUserId}`)
      .setTitle("⚠️ Resmi Kullanıcı Uyarısı");

    const reasonInput = new TextInputBuilder()
      .setCustomId("warn_reason")
      .setLabel("Uyarı Gerekçesi")
      .setPlaceholder("Kural ihlali detayı...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const penaltyInput = new TextInputBuilder()
      .setCustomId("warn_penalty")
      .setLabel("Kesilecek Güven Puanı (TS)")
      .setPlaceholder("10 (Varsayılan)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(penaltyInput)
    );

    await interaction.showModal(modal);
    return true;
  }

  // 5. Sustur (Mute) Modalı Aç
  if (customId.startsWith("incele_btn_mute_")) {
    const targetUserId = customId.replace("incele_btn_mute_", "");
    const modal = new ModalBuilder()
      .setCustomId(`incele_modal_mute_${targetUserId}`)
      .setTitle("🔇 Kullanıcı Susturma (Timeout)");

    const durationInput = new TextInputBuilder()
      .setCustomId("mute_duration")
      .setLabel("Süre (örn: 10m, 1h, 1d, 7d)")
      .setPlaceholder("10m")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId("mute_reason")
      .setLabel("Susturma Gerekçesi")
      .setPlaceholder("Sohbette uygunsuz davranış...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(durationInput),
      new ActionRowBuilder().addComponents(reasonInput)
    );

    await interaction.showModal(modal);
    return true;
  }

  // 6. Susturmayı Kaldır (Unmute)
  if (customId.startsWith("incele_btn_unmute_")) {
    const targetUserId = customId.replace("incele_btn_unmute_", "");
    await interaction.deferUpdate().catch(() => {});

    const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
    if (member) {
      await member.timeout(null, `Susturma kaldırıldı: Yetkili ${interaction.user.tag}`).catch(() => {});
    }

    UserActivityLog.log(targetUserId, "mod_action", {
      action: "UNMUTE",
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason: "İnceleme panelinden susturma kaldırıldı"
    });

    const data = await fetchComprehensiveUserData(targetUserId, interaction.guild, interaction.client);
    const payload = buildIncelePayload(data, "actions", interaction.member);
    await interaction.editReply(payload).catch(() => {});
    return true;
  }

  // 7. Yasakla (Ban)
  if (customId.startsWith("incele_btn_ban_")) {
    const targetUserId = customId.replace("incele_btn_ban_", "");
    await interaction.deferUpdate().catch(() => {});

    let dbUser = await User.findOne({ discordId: targetUserId });
    const targetUserObj = await interaction.client.users.fetch(targetUserId).catch(() => null);

    const banReason = `Profil İnceleme Paneli Üzerinden Banlandı (Yetkili: ${interaction.user.tag})`;
    if (!dbUser) {
      dbUser = await User.create({
        discordId: targetUserId,
        discordUsername: targetUserObj?.username || "Bilinmiyor",
        isBanned: true,
        banReason,
        bannedAt: new Date(),
        bannedBy: interaction.user.id
      });
    } else {
      dbUser.isBanned = true;
      dbUser.banReason = banReason;
      dbUser.bannedAt = new Date();
      dbUser.bannedBy = interaction.user.id;
      await dbUser.save();
    }

    // Güven Puanını düşür ve logla
    try {
      await updateTrustScore(targetUserId, -50.0, "Yönetim Paneli Üzerinden Yasaklandı", interaction.user.id, interaction.client);
    } catch (_) {}

    UserActivityLog.log(targetUserId, "ban", {
      action: "BAN",
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason: banReason
    });

    // Kullanıcıya DM Gönder
    if (targetUserObj) {
      await targetUserObj.send(
        `🚫 **BEM Sentara & EkoYıldız Sunucularından Yasaklandınız!**\n\n` +
        `**Gerekçe:** ${banReason}\n` +
        `Erişiminiz tüm sunucularımızdan ve bot servislerimizden kesilmiştir.`
      ).catch(() => {});
    }

    // Botun bulunduğu sunuculardan banla
    for (const g of interaction.client.guilds.cache.values()) {
      await g.bans.create(targetUserId, { reason: banReason }).catch(() => {});
    }

    const data = await fetchComprehensiveUserData(targetUserId, interaction.guild, interaction.client);
    const payload = buildIncelePayload(data, "actions", interaction.member);
    await interaction.editReply(payload).catch(() => {});
    return true;
  }

  // 8. Yasağı Kaldır (Unban)
  if (customId.startsWith("incele_btn_unban_")) {
    const targetUserId = customId.replace("incele_btn_unban_", "");
    await interaction.deferUpdate().catch(() => {});

    let dbUser = await User.findOne({ discordId: targetUserId });
    if (dbUser) {
      dbUser.isBanned = false;
      dbUser.banReason = null;
      dbUser.bannedAt = null;
      dbUser.bannedBy = null;
      await dbUser.save();
    }

    UserActivityLog.log(targetUserId, "unban", {
      action: "UNBAN",
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason: "İnceleme paneli üzerinden yasaklama kaldırıldı"
    });

    for (const g of interaction.client.guilds.cache.values()) {
      await g.bans.remove(targetUserId, `Yasaklama Kaldırıldı: Yetkili ${interaction.user.tag}`).catch(() => {});
    }

    const data = await fetchComprehensiveUserData(targetUserId, interaction.guild, interaction.client);
    const payload = buildIncelePayload(data, "actions", interaction.member);
    await interaction.editReply(payload).catch(() => {});
    return true;
  }

  return false;
}

/**
 * İncele panelindeki modalların gönderimini işler.
 */
async function handleInceleModal(interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith("incele_modal_")) return false;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // 1. Güven Puanı Modalı
  if (customId.startsWith("incele_modal_trust_")) {
    const targetUserId = customId.replace("incele_modal_trust_", "");
    const amountStr = interaction.fields.getTextInputValue("ts_amount").trim();
    const reason = interaction.fields.getTextInputValue("ts_reason").trim();
    const proofUrl = interaction.fields.getTextInputValue("ts_proof").trim();

    const amount = parseFloat(amountStr.replace("+", ""));
    if (isNaN(amount)) {
      return interaction.editReply({ content: "❌ Lütfen geçerli bir sayı girin (Örn: +15 veya -20)." });
    }

    const result = await requestModTrustAction(
      interaction.user.id,
      targetUserId,
      amount,
      reason,
      proofUrl,
      interaction.client
    );

    UserActivityLog.log(targetUserId, "trust_score", {
      amount,
      reason,
      proofUrl,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag
    });

    return interaction.editReply({
      content: result.success
        ? `✅ **Güven Puanı Güncellendi!**\n**Miktar:** \`${amount >= 0 ? "+" : ""}${amount} TS\`\n**Gerekçe:** ${reason}\n${result.message || ""}`
        : `❌ **Hata:** ${result.error || "İşlem uygulanamadı."}`
    });
  }

  // 2. Yönetici Notu Modalı
  if (customId.startsWith("incele_modal_note_")) {
    const targetUserId = customId.replace("incele_modal_note_", "");
    const noteText = interaction.fields.getTextInputValue("note_text").trim();
    const category = (interaction.fields.getTextInputValue("note_category") || "Genel").trim();

    let dbUser = await User.findOne({ discordId: targetUserId });
    if (!dbUser) {
      dbUser = await User.create({ discordId: targetUserId });
    }
    if (!dbUser.adminNotes) dbUser.adminNotes = [];

    const noteEntry = {
      id: Date.now().toString(),
      modId: interaction.user.id,
      modTag: interaction.user.tag,
      note: noteText,
      category,
      createdAt: new Date()
    };
    dbUser.adminNotes.push(noteEntry);
    await dbUser.save();

    UserActivityLog.log(targetUserId, "admin_note", {
      note: noteText,
      category,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag
    });

    return interaction.editReply({
      content: `✅ **Yönetici Notu Kaydedildi!**\n**Kategori:** \`${category}\`\n**Not:** ${noteText}`
    });
  }

  // 3. Uyarı (Warn) Modalı
  if (customId.startsWith("incele_modal_warn_")) {
    const targetUserId = customId.replace("incele_modal_warn_", "");
    const warnReason = interaction.fields.getTextInputValue("warn_reason").trim();
    const penaltyStr = interaction.fields.getTextInputValue("warn_penalty") || "10";
    const penalty = parseFloat(penaltyStr) || 10;

    let dbUser = await User.findOne({ discordId: targetUserId });
    if (!dbUser) {
      dbUser = await User.create({ discordId: targetUserId });
    }
    if (!dbUser.criminalRecord) dbUser.criminalRecord = [];

    dbUser.criminalRecord.push({
      caseCode: `WARN-${Date.now().toString().slice(-4)}`,
      lawArticle: "Yetkili Uyarısı",
      verdict: "Uyarı Verildi",
      reason: warnReason,
      modId: interaction.user.id,
      date: new Date()
    });
    dbUser.isOrnekVatandas = false;
    await dbUser.save();

    // Güven puanı düşür
    try {
      await updateTrustScore(targetUserId, -Math.abs(penalty), `Uyarı Cezası: ${warnReason}`, interaction.user.id, interaction.client);
    } catch (_) {}

    // DM Bildirimi
    const targetUserObj = await interaction.client.users.fetch(targetUserId).catch(() => null);
    if (targetUserObj) {
      await targetUserObj.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("⚠️ Resmi Moderasyon Uyarısı Aldınız")
            .setColor(0xf59e0b)
            .setDescription(
              `Sunucumuzda kurallara aykırı davranışınız sebebiyle resmi uyarı aldınız.\n\n` +
              `**Gerekçe:** ${warnReason}\n` +
              `**Güven Puanı Kesintisi:** \`-${Math.abs(penalty)} TS\`\n` +
              `*Lütfen sunucu kurallarına dikkat ediniz.*`
            )
            .setTimestamp()
        ]
      }).catch(() => {});
    }

    UserActivityLog.log(targetUserId, "warn", {
      reason: warnReason,
      penalty: -Math.abs(penalty),
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag
    });

    return interaction.editReply({
      content: `✅ <@${targetUserId}> kullanıcısına resmi uyarı iletildi ve **-${Math.abs(penalty)} TS** kesinti uygulandı.`
    });
  }

  // 4. Susturma (Timeout) Modalı
  if (customId.startsWith("incele_modal_mute_")) {
    const targetUserId = customId.replace("incele_modal_mute_", "");
    const durationStr = interaction.fields.getTextInputValue("mute_duration").trim();
    const muteReason = interaction.fields.getTextInputValue("mute_reason").trim();

    const durationMs = parseDurationMs(durationStr);
    const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);

    if (!member) {
      return interaction.editReply({ content: "❌ Kullanıcı bu sunucuda bulunamadı." });
    }

    await member.timeout(durationMs, `Yetkili: ${interaction.user.tag} | Sebep: ${muteReason}`).catch(err => {
      console.warn("[incele timeout] error:", err.message);
    });

    // Güven puanı kesintisi
    try {
      await updateTrustScore(targetUserId, -15.0, `Susturuldu (${durationStr}): ${muteReason}`, interaction.user.id, interaction.client);
    } catch (_) {}

    // DM Gönder
    const targetUserObj = member.user;
    if (targetUserObj) {
      await targetUserObj.send(
        `🔇 **${interaction.guild.name} Sunucusunda Susturuldunuz!**\n\n` +
        `**Süre:** \`${durationStr}\`\n` +
        `**Gerekçe:** ${muteReason}\n` +
        `**Güven Puanı:** \`-15 TS\``
      ).catch(() => {});
    }

    UserActivityLog.log(targetUserId, "timeout", {
      duration: durationStr,
      reason: muteReason,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag
    });

    return interaction.editReply({
      content: `✅ <@${targetUserId}> kullanıcısı **${durationStr}** boyunca susturuldu ve **-15 TS** uygulandı.`
    });
  }

  return false;
}

module.exports = {
  fetchRobloxProfile,
  fetchComprehensiveUserData,
  buildIncelePayload,
  handleInceleCommand,
  handleInceleSelectMenu,
  handleInceleButton,
  handleInceleModal,
  parseDurationMs,
  canManageUsers
};
