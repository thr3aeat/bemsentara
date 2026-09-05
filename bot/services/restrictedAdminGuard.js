const { AuditLogEvent, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

// ─── Korumaya Alınan Özel Yetkili Kullanıcı ID ───────────────────────────────
const TARGET_USER_ID = "1234102602363310122";

// @everyone / @here kullanım sayacı: `${guildId}_${userId}` -> count
// Kural: 1 tane @everyone/@here atabilir; 2. ve sonrası derhal cezalandırılır ve mesaj silinir.
const everyoneUsageTracker = new Map();

/**
 * Belirtilen olay için son audit log girdisini tarar ve işlemi yapan kişiyi döndürür.
 * @param {import('discord.js').Guild} guild
 * @param {AuditLogEvent} eventType
 * @param {string|null} targetId
 * @param {number} maxAgeSec
 */
async function fetchAuditExecutor(guild, eventType, targetId = null, maxAgeSec = 10) {
  try {
    const logs = await guild.fetchAuditLogs({ type: eventType, limit: 6 });
    const now = Date.now();
    for (const entry of logs.entries.values()) {
      const age = (now - entry.createdAt.getTime()) / 1000;
      if (age > maxAgeSec) continue;
      if (targetId && entry.target?.id !== targetId) continue;
      if (entry.executor?.bot) continue;
      return entry.executor;
    }
  } catch (err) {
    console.warn(`[RestrictedAdminGuard] Audit log fetch hatası:`, err.message);
  }
  return null;
}

/**
 * Hedef kullanıcının tüm yetkilerini ve rollerini derhal geri alır, cezalandırır ve loglar.
 * @param {import('discord.js').Guild} guild
 * @param {string} userId
 * @param {string} reason
 */
async function revokeAllPermissions(guild, userId, reason) {
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      console.warn(`[RestrictedAdminGuard] Kullanıcı (${userId}) sunucuda bulunamadı.`);
      return;
    }

    console.log(`[RestrictedAdminGuard] 🚨 ${member.user.tag} için yetki iptal süreci başlatıldı. Sebep: ${reason}`);

    // 1. Botun silebileceği tüm yetkili/normal rolleri al
    const botHighestRole = guild.members.me?.roles?.highest;
    const removableRoles = member.roles.cache.filter(r =>
      r.id !== guild.id &&
      !r.managed &&
      (!botHighestRole || botHighestRole.comparePositionTo(r) > 0)
    );

    if (removableRoles.size > 0) {
      await member.roles.remove(removableRoles, `[ÖZEL GÜVENLİK KORUMASI] ${reason}`).catch(err => {
        console.error(`[RestrictedAdminGuard] Rolleri alma hatası:`, err.message);
      });
      console.log(`[RestrictedAdminGuard] 🔒 ${member.user.tag} kullanıcısından ${removableRoles.size} rol alındı.`);
    }

    // 2. Ekstra güvenlik: 28 gün zamanaşımı (Timeout) uygulayarak kalan yetkileri de sıfırla
    await member.timeout(28 * 24 * 60 * 60 * 1000, `[ÖZEL GÜVENLİK KORUMASI] ${reason}`).catch(err => {
      console.warn(`[RestrictedAdminGuard] Timeout uygulama hatası:`, err.message);
    });

    // 3. Kullanıcıya DM ile bildir
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle("🚨 YETKİLERİNİZ ALINDI VE EYLEMİNİZ GERİ ALINDI")
        .setColor(0xFF0000)
        .setDescription(
          `**${guild.name}** sunucusunda güvenlik kural ihlali tespit edildi!\n\n` +
          `> ⚠️ **İhlal Türü:** ${reason}\n` +
          `> 🛡️ **Uygulanan Müdahale:** Tüm yönetici yetkileriniz ve rolleriniz derhal alındı, hesabınız kısıtlandı ve gerçekleştirdiğiniz eylem sistem tarafından otomatik olarak geri alındı.\n\n` +
          `*Bu işlem sunucu koruma mekanizması tarafından otomatik uygulanmıştır.*`
        )
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (_) {}

    // 4. Log kanalına detaylı bildirim gönder
    try {
      const alertEmbed = new EmbedBuilder()
        .setTitle("🚨 ÖZEL YÖNETİCİ KORUMASI: İHLAL VE OTOMATİK MÜDAHALE")
        .setColor(0xFF0000)
        .setDescription(`İzlenen özel yetkili **${member.user.tag}** güvenlik kuralı ihlali yaptı. Sistem anında müdahale ederek yapılan işlemi geri aldı ve kullanıcının tüm yetkilerini iptal etti.`)
        .addFields(
          { name: "👤 Kullanıcı", value: `${member.toString()}\nTag: \`${member.user.tag}\`\nID: \`${userId}\``, inline: true },
          { name: "🏠 Sunucu", value: `**${guild.name}** (\`${guild.id}\`)`, inline: true },
          { name: "⚠️ Tespit Edilen İhlal", value: reason, inline: false },
          { name: "🛡️ Uygulanan Müdahale", value: "✅ Yapılan eylem geri alındı (Rollback)\n✅ Tüm rolleri ve yönetici izinleri alındı\n✅ 28 Gün Zaman Aşımı (Timeout) uygulandı", inline: false }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      const logChannelId = "1504201531551907941";
      const logChannel = guild.channels.cache.get(logChannelId)
        || guild.client.channels.cache.get(logChannelId);

      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [alertEmbed] }).catch(() => {});
      }

      const { notifyAdmins } = require("../../utils/notification");
      await notifyAdmins({
        title: "🚨 ÖZEL YÖNETİCİ KORUMASI DEVREYE GİRDİ",
        message: `${member.user.tag} (${userId}) kural ihlali yaptı: ${reason}. Yetkileri derhal alındı ve işlem geri alındı!`,
        icon: "🚨"
      }).catch(() => {});
    } catch (logErr) {
      console.warn(`[RestrictedAdminGuard] Log gönderme hatası:`, logErr.message);
    }

  } catch (err) {
    console.error(`[RestrictedAdminGuard] revokeAllPermissions genel hatası:`, err.message);
  }
}

/**
 * 1. KANAL SİLME KONTROLÜ VE GERİ OLUŞTURMA (ROLLBACK)
 */
async function handleChannelDeleteGuard(channel) {
  if (!channel.guild) return;

  // Discord Audit Log kaydının düşmesi için kısa bekleme (500ms)
  await new Promise(r => setTimeout(r, 500));

  const executor = await fetchAuditExecutor(channel.guild, AuditLogEvent.ChannelDelete, channel.id, 10);
  if (!executor || executor.id !== TARGET_USER_ID) return;

  console.log(`[RestrictedAdminGuard] 🚨 ${executor.tag} tarafından kanal silindi: #${channel.name}`);

  // Geri al: Kanalı aynı özellikleriyle anında yeniden oluştur
  try {
    const createOptions = {
      name: channel.name,
      type: channel.type,
      topic: channel.topic || undefined,
      parent: channel.parentId || undefined,
      nsfw: channel.nsfw || undefined,
      rateLimitPerUser: channel.rateLimitPerUser || undefined,
      position: channel.position
    };

    if (channel.permissionOverwrites?.cache?.size) {
      createOptions.permissionOverwrites = channel.permissionOverwrites.cache.map(po => ({
        id: po.id,
        allow: po.allow,
        deny: po.deny,
        type: po.type
      }));
    }

    const restoredChannel = await channel.guild.channels.create(createOptions);
    console.log(`[RestrictedAdminGuard] ♻️ Silinen kanal başarıyla kurtarıldı ve yeniden oluşturuldu: #${restoredChannel.name}`);
  } catch (err) {
    console.error(`[RestrictedAdminGuard] Kanal kurtarma/geri alma hatası:`, err.message);
  }

  // Yetkilerini derhal al
  await revokeAllPermissions(
    channel.guild,
    TARGET_USER_ID,
    `İzinsiz Kanal Silme İhlali (#${channel.name} kanalı silindi, otomatik olarak kurtarıldı)`
  );
}

/**
 * 2. @everyone / @here PİNG KONTROLÜ (1 TANE İZİNLİ, 2. VE SONRASINDA SİLME + YETKİ ALMA)
 */
async function handleMessageCreateGuard(message) {
  if (!message.guild || message.author.bot) return;
  if (message.author.id !== TARGET_USER_ID) return;

  const hasEveryonePing = message.mentions.everyone || /@(everyone|here)/i.test(message.content);
  if (!hasEveryonePing) return;

  const key = `${message.guild.id}_${TARGET_USER_ID}`;
  const currentCount = everyoneUsageTracker.get(key) || 0;

  if (currentCount === 0) {
    // 1 adet @everyone / @here hakkı var, izin ver
    everyoneUsageTracker.set(key, 1);
    console.log(`[RestrictedAdminGuard] ℹ️ ${message.author.tag} izin verilen 1 adet @everyone/@here hakkını kullandı.`);
    return;
  }

  // 2. veya daha fazla ping atıldı -> İHLAL!
  console.log(`[RestrictedAdminGuard] 🚨 ${message.author.tag} 1'den fazla @everyone/@here pingi attı!`);

  // Geri al: Mesajı derhal sil
  await message.delete().catch(err => console.warn(`[RestrictedAdminGuard] Mesaj silme hatası:`, err.message));

  // Yetkilerini derhal al
  await revokeAllPermissions(
    message.guild,
    TARGET_USER_ID,
    `İzinsiz @everyone / @here Sınırı Aşıldı (İzin verilen 1 hak kullanılmıştı, 2. ping atılmaya çalışıldı)`
  );
}

/**
 * 3. BİR BAŞKASINA YÖNETİCİ YETKİLİ ROL EKLEME KONTROLÜ (ROLÜ GERİ ALMA + YETKİ ALMA)
 */
async function handleMemberUpdateGuard(oldMember, newMember) {
  if (newMember.id === TARGET_USER_ID) return; // Kendi rol değişikliği değil, başkasına verme kontrolü

  // Yeni eklenen rolleri bul
  const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  if (addedRoles.size === 0) return;

  // Eklenen roller arasında Yönetici (Administrator) izni var mı?
  const adminRoles = addedRoles.filter(r => r.permissions.has(PermissionFlagsBits.Administrator));
  if (adminRoles.size === 0) return;

  // Audit log kontrolü için kısa bekleme (600ms)
  await new Promise(r => setTimeout(r, 600));

  const executor = await fetchAuditExecutor(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id, 10);
  if (!executor || executor.id !== TARGET_USER_ID) return;

  console.log(`[RestrictedAdminGuard] 🚨 ${executor.tag}, ${newMember.user.tag} kullanıcısına Yönetici rolü verdi!`);

  // Geri al: Verilen yönetici rollerini hedeften derhal geri al
  for (const [roleId, role] of adminRoles) {
    await newMember.roles.remove(role, `[ÖZEL GÜVENLİK] ${TARGET_USER_ID} tarafından izinsiz verilen yönetici rolü geri alındı.`).catch(err => {
      console.error(`[RestrictedAdminGuard] Rol geri alma hatası:`, err.message);
    });
  }

  const roleNames = adminRoles.map(r => r.name).join(", ");
  console.log(`[RestrictedAdminGuard] ↩️ ${newMember.user.tag} kullanıcısından izinsiz yönetici rolü (${roleNames}) geri alındı.`);

  // Yetkilerini derhal al
  await revokeAllPermissions(
    newMember.guild,
    TARGET_USER_ID,
    `İzinsiz Yönetici Rolü Verme İhlali (${newMember.user.tag} kullanıcısına "${roleNames}" rolü eklendi, geri alındı)`
  );
}

/**
 * 4. BOT EKLEME KONTROLÜ (BOTU ATMA + YETKİ ALMA)
 */
async function handleMemberAddGuard(member) {
  if (!member.user.bot) return;

  // Audit log kaydı için bekleme (800ms)
  await new Promise(r => setTimeout(r, 800));

  const executor = await fetchAuditExecutor(member.guild, AuditLogEvent.BotAdd, member.id, 15);
  if (!executor || executor.id !== TARGET_USER_ID) return;

  console.log(`[RestrictedAdminGuard] 🚨 ${executor.tag} tarafından izinsiz bot eklendi: ${member.user.tag}`);

  // Geri al: Eklenen botu derhal sunucudan at (kick)
  try {
    await member.kick(`[ÖZEL GÜVENLİK KORUMASI] İzinsiz bot ekleme: ${TARGET_USER_ID} tarafından eklendi.`);
    console.log(`[RestrictedAdminGuard] 👢 İzinsiz eklenen bot (${member.user.tag}) sunucudan derhal atıldı.`);
  } catch (err) {
    console.error(`[RestrictedAdminGuard] Botu atma hatası:`, err.message);
  }

  // Yetkilerini derhal al
  await revokeAllPermissions(
    member.guild,
    TARGET_USER_ID,
    `İzinsiz Bot Ekleme İhlali (${member.user.tag} adlı bot sunucuya eklendi, otomatik olarak atıldı)`
  );
}

/**
 * Özel Yönetici Korumasını başlatan ana fonksiyon
 * @param {import('discord.js').Client} client
 */
function initRestrictedAdminGuard(client) {
  console.log(`[RestrictedAdminGuard] 🛡️ Özel Yönetici Koruması Aktif Edildi. İzlenen ID: ${TARGET_USER_ID}`);

  client.on("channelDelete",     (channel)           => handleChannelDeleteGuard(channel).catch(e => console.error("[RestrictedGuard] channelDelete:", e.message)));
  client.on("messageCreate",     (message)           => handleMessageCreateGuard(message).catch(e => console.error("[RestrictedGuard] messageCreate:", e.message)));
  client.on("guildMemberUpdate", (oldMem, newMem)    => handleMemberUpdateGuard(oldMem, newMem).catch(e => console.error("[RestrictedGuard] guildMemberUpdate:", e.message)));
  client.on("guildMemberAdd",    (member)            => handleMemberAddGuard(member).catch(e => console.error("[RestrictedGuard] guildMemberAdd:", e.message)));
}

module.exports = {
  initRestrictedAdminGuard,
  TARGET_USER_ID,
  everyoneUsageTracker,
  revokeAllPermissions
};
