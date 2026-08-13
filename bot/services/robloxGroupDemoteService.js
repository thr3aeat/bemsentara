const noblox = require("noblox.js");
const { EmbedBuilder } = require("discord.js");
const { ROBLOX_GROUPS } = require("./robloxGroupManager");

const AUTHORIZED_USER_ID = "1031620522406072350";

/**
 * Executes the !gruptancek command logic
 * @param {import('discord.js').Message} message 
 * @param {string[]} args 
 */
async function handleGruptanCekCommand(message, args) {
  // Authorization check - strictly for authorized user 1031620522406072350
  if (message.author.id !== AUTHORIZED_USER_ID) {
    await message.reply({ content: "❌ Bu komutu kullanmak için yetkiniz bulunmamaktadır." }).catch(() => {});
    return;
  }

  const targetInput = args[0] ? args[0].trim() : null;
  if (!targetInput) {
    await message.reply({
      content: "⚠️ **Kullanım:** `!gruptancek <kullanıcı_adı_veya_id>`\n**Örnek:** `!gruptancek RobloxKullaniciAdi`"
    }).catch(() => {});
    return;
  }

  // Send initial progress message
  const initialEmbed = new EmbedBuilder()
    .setTitle("⏳ Roblox Gruptan Çekme İşlemi Başlatılıyor...")
    .setDescription(`**Hedef:** \`${targetInput}\`\n🔍 Roblox kullanıcısı ve TMTCOOKIE bağlantısı kontrol ediliyor...`)
    .setColor(0x3498DB)
    .setFooter({ text: "TMTCOOKIE Otomatik Grup Yetki Düşürme Sistemi" })
    .setTimestamp();

  const statusMsg = await message.reply({ embeds: [initialEmbed] }).catch(() => null);
  if (!statusMsg) return;

  const cookie = process.env.TMTCOOKIE;
  if (!cookie) {
    const errEmbed = new EmbedBuilder()
      .setTitle("❌ İşlem Başarısız")
      .setDescription("`TMTCOOKIE` ortam değişkeni sistemde bulunamadı. Lütfen `.env` dosyasını veya ortam değişkenlerini kontrol edin.")
      .setColor(0xE74C3C);
    await statusMsg.edit({ embeds: [errEmbed] }).catch(() => {});
    return;
  }

  try {
    // 1. Authenticate with cookie
    const currentUser = await noblox.setCookie(cookie).catch((err) => {
      throw new Error(`TMTCOOKIE oturumu açılamadı (Cookie geçersiz/süresi dolmuş): ${err.message}`);
    });

    const cookieUserId = currentUser?.UserID || currentUser?.userId || currentUser?.id;
    const cookieUsername = currentUser?.UserName || currentUser?.username || "Bilinmiyor";

    // 2. Resolve target Roblox User ID
    let targetUserId = null;
    let targetUsername = targetInput;

    if (/^\d+$/.test(targetInput)) {
      targetUserId = parseInt(targetInput, 10);
      targetUsername = await noblox.getUsernameFromId(targetUserId).catch(() => `User_${targetUserId}`);
    } else {
      targetUserId = await noblox.getIdFromUsername(targetInput).catch(() => null);
      if (!targetUserId) {
        throw new Error(`\`${targetInput}\` isimli Roblox kullanıcısı bulunamadı!`);
      }
      targetUsername = await noblox.getUsernameFromId(targetUserId).catch(() => targetInput);
    }

    // 3. Collect all groups for TMTCOOKIE and target user
    const groupMap = new Map(); // groupId (string) => groupName (string)

    // Add predefined groups from ROBLOX_GROUPS
    if (ROBLOX_GROUPS && typeof ROBLOX_GROUPS === "object") {
      for (const [gId, gName] of Object.entries(ROBLOX_GROUPS)) {
        groupMap.set(String(gId), String(gName));
      }
    }

    // Add cookie account's groups
    const cookieGroups = await noblox.getGroups(cookieUserId).catch(() => []);
    if (Array.isArray(cookieGroups)) {
      for (const g of cookieGroups) {
        const gId = String(g.Id || g.id);
        const gName = g.Name || g.name || `Grup ${gId}`;
        if (!groupMap.has(gId)) {
          groupMap.set(gId, gName);
        }
      }
    }

    // Add target user's groups as well to guarantee checking all mutual groups
    const targetGroups = await noblox.getGroups(targetUserId).catch(() => []);
    if (Array.isArray(targetGroups)) {
      for (const g of targetGroups) {
        const gId = String(g.Id || g.id);
        const gName = g.Name || g.name || `Grup ${gId}`;
        if (!groupMap.has(gId)) {
          groupMap.set(gId, gName);
        }
      }
    }

    const groupList = Array.from(groupMap.entries()); // [[groupId, groupName], ...]
    const totalGroups = groupList.length;

    if (totalGroups === 0) {
      throw new Error("Kontrol edilecek grup bulunamadı.");
    }

    // Statistics
    let processedCount = 0;
    let demotedCount = 0;
    let alreadyLowestCount = 0;
    let notInGroupCount = 0;
    let errorCount = 0;

    const actionLogs = [];

    // Helper to generate updated Discord embed
    const generateEmbed = (isFinished = false) => {
      const percent = Math.round((processedCount / totalGroups) * 100);
      const title = isFinished
        ? "✅ Roblox Gruptan Çekme İşlemi Tamamlandı"
        : `⚡ Roblox Gruptan Çekme İşlemi Yapılıyor... (%${percent})`;

      const color = isFinished ? 0x2ECC71 : 0xF1C40F;

      // Keep last 12 action log entries to respect Discord embed limits
      const recentLogs = actionLogs.slice(-12).join("\n");
      const logText = recentLogs.length > 0 ? `\n\n**📋 İşlem Günlüğü (Son Hareketler):**\n${recentLogs}` : "";

      const description = `**👤 Hedef Kullanıcı:** \`${targetUsername}\` (ID: \`${targetUserId}\`)\n` +
        `**🔑 Cookie Hesabı:** \`${cookieUsername}\` (ID: \`${cookieUserId}\`)\n` +
        `**📊 İlerleme:** %${percent} (\`${processedCount}/${totalGroups}\` grup kontrol edildi)\n\n` +
        `**📈 Özet Durum:**\n` +
        `🔻 **Rütbe Düşürüldü:** \`${demotedCount}\`\n` +
        `🔹 **Zaten En Düşük Rütbede:** \`${alreadyLowestCount}\`\n` +
        `⚪ **Grupta Değil:** \`${notInGroupCount}\`\n` +
        `⚠️ **Hata / Yetki Yok:** \`${errorCount}\`` +
        logText;

      return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description.length > 4000 ? description.substring(0, 4000) + "..." : description)
        .setColor(color)
        .setFooter({ text: isFinished ? "TMTCOOKIE Otomatik İşlem Tamamlandı" : "Canlı Durum Güncelleniyor..." })
        .setTimestamp();
    };

    // Initial live status update
    await statusMsg.edit({ embeds: [generateEmbed(false)] }).catch(() => {});

    // 4. Iterate over groups and process rank check & demotion
    for (const [groupIdStr, groupName] of groupList) {
      processedCount++;
      const groupId = parseInt(groupIdStr, 10);

      try {
        const currentRank = await noblox.getRankInGroup(groupId, targetUserId);

        if (currentRank > 0) {
          // Target user is in group!
          let currentRoleName = `Rank ${currentRank}`;
          try {
            const roleObj = await noblox.getRole(groupId, currentRank);
            if (roleObj && roleObj.name) currentRoleName = roleObj.name;
          } catch (_) {}

          // Get group roles to determine lowest non-zero rank
          const roles = await noblox.getRoles(groupId).catch(() => []);
          const nonZeroRoles = roles.filter(r => r.rank > 0).sort((a, b) => a.rank - b.rank);
          const lowestRole = nonZeroRoles[0] || { rank: 1, name: "Lowest Rank" };

          if (currentRank === lowestRole.rank) {
            alreadyLowestCount++;
            actionLogs.push(`🔹 **${groupName}**: Zaten en düşük rankta (\`${currentRoleName}\` - Rank ${currentRank})`);
          } else {
            // Demote to lowest rank
            await noblox.setRank(groupId, targetUserId, lowestRole.rank);
            demotedCount++;
            actionLogs.push(`🔻 **${groupName}**: Rütbe düşürüldü (\`${currentRoleName}\` ➔ \`${lowestRole.name}\` - Rank ${lowestRole.rank})`);
          }
        } else {
          notInGroupCount++;
        }
      } catch (groupErr) {
        errorCount++;
        const errMsg = groupErr.message || "Bilinmeyen hata";
        actionLogs.push(`⚠️ **${groupName}**: Hata - ${errMsg}`);
      }

      // Update message live after each group
      await statusMsg.edit({ embeds: [generateEmbed(false)] }).catch(() => {});
      await new Promise(res => setTimeout(res, 200));
    }

    // 5. Final update
    await statusMsg.edit({ embeds: [generateEmbed(true)] }).catch(() => {});

  } catch (err) {
    console.error("[handleGruptanCekCommand Error]:", err);
    const errEmbed = new EmbedBuilder()
      .setTitle("❌ Hata Oluştu")
      .setDescription(`İşlem sırasında bir hata meydana geldi:\n\`\`\`${err.message}\`\`\``)
      .setColor(0xE74C3C)
      .setTimestamp();
    await statusMsg.edit({ embeds: [errEmbed] }).catch(() => {});
  }
}

module.exports = {
  handleGruptanCekCommand,
  AUTHORIZED_USER_ID
};
