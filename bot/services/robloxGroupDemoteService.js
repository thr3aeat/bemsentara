const noblox = require("noblox.js");
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { ROBLOX_GROUPS } = require("./robloxGroupManager");

const AUTHORIZED_USER_ID = "1031620522406072350";

/**
 * Robustly authenticates noblox with TMTCOOKIE/TOKENFRIEND trying multiple format representations
 */
async function authenticateRobloxCookie() {
  const cookieCandidates = [
    process.env.TMTCOOKIE,
    process.env.TOKENFRIEND,
    process.env.tokenfriend
  ].filter(Boolean);

  if (cookieCandidates.length === 0) {
    throw new Error("Sistemde `TMTCOOKIE` veya `TOKENFRIEND` ortam değişkeni tanımlı değil.");
  }

  let lastError = null;

  for (const rawCookie of cookieCandidates) {
    let clean = rawCookie.trim();
    if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
    if (clean.startsWith("'") && clean.endsWith("'")) clean = clean.slice(1, -1);

    // Format 1: Full cookie header string `.ROBLOSECURITY=...;`
    let formattedCookie = clean;
    if (!formattedCookie.includes(".ROBLOSECURITY=")) {
      formattedCookie = `.ROBLOSECURITY=${clean};`;
    }

    // Format 2: Raw token string
    let rawToken = clean.replace(/^\.ROBLOSECURITY=/, "").replace(/;$/, "").trim();

    // Try setCookie with formattedCookie
    try {
      const user = await noblox.setCookie(formattedCookie);
      if (user) return { user, cookie: formattedCookie };
    } catch (err1) {
      lastError = err1;
    }

    // Try setCookie with rawToken
    try {
      const user = await noblox.setCookie(rawToken);
      if (user) return { user, cookie: rawToken };
    } catch (err2) {
      lastError = err2;
    }
  }

  throw new Error(`TMTCOOKIE oturumu açılamadı: ${lastError ? lastError.message : "You are not logged in."}`);
}

/**
 * Executes the !gruptancek command logic
 * @param {import('discord.js').Message} message 
 * @param {string[]} args 
 */
async function handleGruptanCekCommand(message, args) {
  // 1. Authorization check - Authorized user 1031620522406072350 or Administrators / Owners / Site Admins
  let isAdmin = message.author.id === AUTHORIZED_USER_ID;
  if (!isAdmin && message.member?.permissions) {
    isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
  }
  if (!isAdmin && message.guild) {
    isAdmin = message.guild.ownerId === message.author.id;
  }
  try {
    const { isSiteAdmin } = require("../../utils/adminCheck");
    if (!isAdmin && isSiteAdmin({ discordId: message.author.id })) {
      isAdmin = true;
    }
  } catch (_) {}

  if (!isAdmin) {
    await message.reply({ content: "❌ Bu komutu kullanmak için yetkiniz bulunmamaktadır." }).catch(() => {});
    return;
  }

  const targetInput = args[0] ? args[0].trim() : null;
  if (!targetInput) {
    await message.reply({
      content: "⚠️ **Kullanım:** `!gruptancek <kullanıcı_adı_veya_id>`\n**Örnek:** `!gruptancek NotPutrescent6393`"
    }).catch(() => {});
    return;
  }

  // 2. Send initial progress message with 4-level fallback
  const initialEmbed = new EmbedBuilder()
    .setTitle("⏳ Roblox Gruptan Çekme İşlemi Başlatılıyor...")
    .setDescription(`**Hedef Kullanıcı:** \`${targetInput}\`\n🔍 Roblox hesabı ve TMTCOOKIE oturumu doğrulanıyor...`)
    .setColor(0x3498DB)
    .setFooter({ text: "TMTCOOKIE Otomatik Grup Yetki Düşürme Sistemi" })
    .setTimestamp();

  let statusMsg = await message.reply({ embeds: [initialEmbed] }).catch(() => null);
  if (!statusMsg && message.channel) {
    statusMsg = await message.channel.send({ embeds: [initialEmbed] }).catch(() => null);
  }
  if (!statusMsg) {
    statusMsg = await message.reply({ content: `⏳ **Roblox Gruptan Çekme İşlemi Başlatılıyor...** (Hedef: \`${targetInput}\`)` }).catch(() => null);
  }
  if (!statusMsg && message.channel) {
    statusMsg = await message.channel.send({ content: `⏳ **Roblox Gruptan Çekme İşlemi Başlatılıyor...** (Hedef: \`${targetInput}\`)` }).catch(() => null);
  }

  if (!statusMsg) {
    console.error("[!gruptancek] Mesaj gönderilemedi. Kanal izinlerini kontrol edin.");
    return;
  }

  // Helper function to safely update status message
  const safeUpdateStatus = async (embed, fallbackText) => {
    if (!statusMsg) return;
    const ok = await statusMsg.edit({ embeds: [embed] }).catch(() => null);
    if (!ok && fallbackText) {
      await statusMsg.edit({ content: fallbackText, embeds: [] }).catch(() => null);
    }
  };

  try {
    // 3. Format & authenticate with TMTCOOKIE
    let authResult;
    try {
      authResult = await authenticateRobloxCookie();
    } catch (cookieErr) {
      const errEmbed = new EmbedBuilder()
        .setTitle("❌ Roblox Oturumu Açılamadı")
        .setDescription(
          `🔑 **Neden:** \`TMTCOOKIE\` çerezinin süresi dolmuş, geçersiz veya Roblox tarafından güvenlik nedeniyle sıfırlanmış.\n\n` +
          `💡 **Çözüm:**\n` +
          `1️⃣ Roblox'a gidin ve hesabınızdan yeni bir \`.ROBLOSECURITY\` çerezi kopyalayın.\n` +
          `2️⃣ **.env** dosyasındaki veya **Render.com** ayarlarındaki \`TMTCOOKIE\` değişkenini güncelleyin.\n` +
          `3️⃣ Botu yeniden başlatın.\n\n` +
          `*Teknik Detay: ${cookieErr.message}*`
        )
        .setColor(0xE74C3C)
        .setTimestamp();

      await safeUpdateStatus(
        errEmbed,
        "❌ **Roblox Oturumu Açılamadı:** `TMTCOOKIE` çerezinin süresi dolmuş veya geçersiz. Lütfen Render.com / .env üzerindeki TMTCOOKIE değişkenini yeni Roblox `.ROBLOSECURITY` çerezi ile güncelleyin."
      );
      return;
    }

    const currentUser = authResult.user;
    const cookieUserId = currentUser?.UserID || currentUser?.userId || currentUser?.id;
    const cookieUsername = currentUser?.UserName || currentUser?.username || "Bilinmiyor";

    // 4. Resolve target Roblox User ID
    let targetUserId = null;
    let targetUsername = targetInput;

    if (/^\d+$/.test(targetInput)) {
      targetUserId = parseInt(targetInput, 10);
      targetUsername = await noblox.getUsernameFromId(targetUserId).catch(() => `User_${targetUserId}`);
    } else {
      targetUserId = await noblox.getIdFromUsername(targetInput).catch(() => null);
      if (!targetUserId) {
        throw new Error(`\`${targetInput}\` isimli Roblox kullanıcısı bulunamadı! Lütfen kullanıcı adının doğruluğunu kontrol edin.`);
      }
      targetUsername = await noblox.getUsernameFromId(targetUserId).catch(() => targetInput);
    }

    // 5. Collect all groups for TMTCOOKIE and target user
    const groupMap = new Map(); // groupId (string) => groupName (string)

    // Predefined groups from ROBLOX_GROUPS
    if (ROBLOX_GROUPS && typeof ROBLOX_GROUPS === "object") {
      for (const [gId, gName] of Object.entries(ROBLOX_GROUPS)) {
        groupMap.set(String(gId), String(gName));
      }
    }

    // Cookie account's groups
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

    // Target user's groups
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
      throw new Error("Kontrol edilecek herhangi bir Roblox grubu bulunamadı.");
    }

    // Statistics & Logs
    let processedCount = 0;
    let demotedCount = 0;
    let alreadyLowestCount = 0;
    let notInGroupCount = 0;
    let errorCount = 0;

    const actionLogs = [];

    // Helper to generate live embed & text fallback
    const generateEmbedAndText = (isFinished = false) => {
      const percent = Math.round((processedCount / totalGroups) * 100);
      const title = isFinished
        ? "✅ Roblox Gruptan Çekme İşlemi Tamamlandı"
        : `⚡ Roblox Gruptan Çekme İşlemi Yapılıyor... (%${percent})`;

      const color = isFinished ? 0x2ECC71 : 0xF1C40F;

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

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description.length > 4000 ? description.substring(0, 4000) + "..." : description)
        .setColor(color)
        .setFooter({ text: isFinished ? "TMTCOOKIE Otomatik İşlem Tamamlandı" : "Canlı Durum Güncelleniyor..." })
        .setTimestamp();

      const textFallback = `**${title}**\nHedef: \`${targetUsername}\` | İlerleme: %${percent} (${processedCount}/${totalGroups})\n` +
        `Düşürüldü: ${demotedCount} | En Düşük: ${alreadyLowestCount} | Grupta Yok: ${notInGroupCount} | Hata: ${errorCount}`;

      return { embed, textFallback };
    };

    // Initial edit
    const initData = generateEmbedAndText(false);
    await safeUpdateStatus(initData.embed, initData.textFallback);

    // 6. Loop over groups and demote if found
    for (const [groupIdStr, groupName] of groupList) {
      processedCount++;
      const groupId = parseInt(groupIdStr, 10);

      try {
        const currentRank = await noblox.getRankInGroup(groupId, targetUserId);

        if (currentRank > 0) {
          let currentRoleName = `Rank ${currentRank}`;
          try {
            const roleObj = await noblox.getRole(groupId, currentRank);
            if (roleObj && roleObj.name) currentRoleName = roleObj.name;
          } catch (_) {}

          // Get group roles to determine lowest non-zero rank (usually 1)
          const roles = await noblox.getRoles(groupId).catch(() => []);
          const nonZeroRoles = roles.filter(r => r.rank > 0).sort((a, b) => a.rank - b.rank);
          const lowestRole = nonZeroRoles[0] || { rank: 1, name: "Lowest Rank" };

          if (currentRank === lowestRole.rank) {
            alreadyLowestCount++;
            actionLogs.push(`🔹 **${groupName}**: Zaten en düşük rankta (\`${currentRoleName}\` - Rank ${currentRank})`);
          } else {
            // Set rank to lowest role (using role name/id first to handle multiple roles with rank 1)
            let rankSetSuccess = false;

            if (lowestRole.name) {
              try {
                await noblox.setRank(groupId, targetUserId, lowestRole.name);
                rankSetSuccess = true;
              } catch (_) {
                try {
                  await noblox.setRank({ group: groupId, target: targetUserId, rank: lowestRole.name });
                  rankSetSuccess = true;
                } catch (_) {}
              }
            }

            if (!rankSetSuccess && lowestRole.id) {
              try {
                await noblox.setRank(groupId, targetUserId, lowestRole.id);
                rankSetSuccess = true;
              } catch (_) {
                try {
                  await noblox.setRank({ group: groupId, target: targetUserId, role: lowestRole.id });
                  rankSetSuccess = true;
                } catch (_) {}
              }
            }

            if (!rankSetSuccess) {
              try {
                await noblox.setRank(groupId, targetUserId, lowestRole.rank);
                rankSetSuccess = true;
              } catch (_) {
                await noblox.setRank({ group: groupId, target: targetUserId, rank: lowestRole.rank });
                rankSetSuccess = true;
              }
            }

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

      // Live update message every group
      const loopData = generateEmbedAndText(false);
      await safeUpdateStatus(loopData.embed, loopData.textFallback);
      await new Promise(res => setTimeout(res, 200));
    }

    // 7. Final status edit
    const finalData = generateEmbedAndText(true);
    await safeUpdateStatus(finalData.embed, finalData.textFallback);

  } catch (err) {
    console.error("[handleGruptanCekCommand Error]:", err);
    const errEmbed = new EmbedBuilder()
      .setTitle("❌ Hata Oluştu")
      .setDescription(`İşlem sırasında bir hata meydana geldi:\n\`\`\`${err.message}\`\`\``)
      .setColor(0xE74C3C)
      .setTimestamp();
    await safeUpdateStatus(errEmbed, `❌ **Hata Oluştu:** ${err.message}`);
  }
}

module.exports = {
  handleGruptanCekCommand,
  AUTHORIZED_USER_ID,
  authenticateRobloxCookie
};
