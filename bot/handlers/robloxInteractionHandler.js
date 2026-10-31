const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  PermissionsBitField,
  StringSelectMenuBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const noblox = require("noblox.js");
const { ROBLOX_GROUPS } = require("../services/robloxGroupManager");

// Müttefik Orduları sunucusundaki grup yönetimi log kanalı
const ALLIED_ROBLOX_LOG_CHANNEL_ID = "1514682098819137727";
const ALLIED_GUILD_ID = "1483482948320891074";

/**
 * Tüm kayıtlı Roblox log kanallarına (TMT + Müttefik) embed gönderir.
 */
async function sendRobloxLog(interaction, embed) {
  const targets = [];

  // 1. TMT log kanalı
  try {
    const { TMT_GUILD_ID, TMT_ROBLOX_RANK_LOG_CHANNEL_ID } = require("../../config");
    const tmtGuild = interaction.client.guilds.cache.get(TMT_GUILD_ID);
    if (tmtGuild) {
      const ch = tmtGuild.channels.cache.get(TMT_ROBLOX_RANK_LOG_CHANNEL_ID);
      if (ch && ch.isTextBased()) targets.push(ch);
    }
  } catch (_) {}

  // 2. Müttefik Orduları log kanalı
  try {
    const alliedGuild = interaction.client.guilds.cache.get(ALLIED_GUILD_ID);
    if (alliedGuild) {
      const ch = alliedGuild.channels.cache.get(ALLIED_ROBLOX_LOG_CHANNEL_ID);
      if (ch && ch.isTextBased()) targets.push(ch);
    }
  } catch (_) {}

  for (const ch of targets) {
    await ch.send({ embeds: [embed] }).catch(err =>
      console.error(`[RobloxLog] ${ch.id} kanalına log gönderilemedi:`, err.message)
    );
  }
}

/**
 * Gelişmiş güvenlik kontrolü.
 * Şu anlık sunucu yöneticisi (Administrator) olanların kullanımına açık.
 */
function isUserAuthorized(member, user) {
  const { ADMIN_IDS } = require("../../config");
  const isOwner = user && user.id === "1031620522406072350";
  if (isOwner) return true;
  if (user && ADMIN_IDS.includes(user.id)) return true;
  if (!member) return false;
  return member.permissions.has(PermissionsBitField.Flags.Administrator);
}

function getDetailedRobloxError(err) {
  const msg = err.message || String(err);
  let detail = `**Orijinal Hata:** \`${msg}\`\n\n`;

  if (msg.includes("You are not logged in") || msg.includes("Cookie") || msg.includes("login") || msg.includes("401")) {
    detail += "🔑 **Muhtemel Neden:** Botun Roblox oturumu (TMTCOOKIE) geçersiz, süresi dolmuş veya hatalı tanımlanmış.\n" +
              "💡 **Çözüm:** `.env` dosyasındaki veya Render.com'daki `TMTCOOKIE` değerini güncelleyin ve botu yeniden başlatın.";
  } else if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("permission") || msg.includes("cannot set the rank") || msg.includes("Roleset is not assignable")) {
    detail += "🚫 **Muhtemel Neden:** Yetki yetersizliği. Botun Roblox grubundaki rütbesi bu işlemi yapmaya yetmiyor.\n" +
              "💡 **Çözüm:** Botun Roblox hesabının grupta **'Manage Lower Ranks' (Alt Rütbeleri Yönet)** yetkisine sahip olduğundan ve hedef kullanıcının rütbesinin botun rütbesinden düşük olduğundan emin olun. (Bot grup sahibinin veya kendisinden üst/eşit bir rütbenin rolünü değiştiremez).";
  } else if (msg.includes("not in group") || msg.includes("is not in group") || msg.includes("400")) {
    detail += "👤 **Muhtemel Neden:** Hedef kullanıcı belirtilen Roblox grubunun üyesi değil veya gruptan çıkmış/atılmış.\n" +
              "💡 **Çözüm:** Kullanıcının gruba katıldığından emin olun.";
  } else if (msg.includes("Too many requests") || msg.includes("429") || msg.includes("rate limit")) {
    detail += "⏳ **Muhtemel Neden:** Roblox API istek sınırı (Rate Limit) aşıldı.\n" +
              "💡 **Çözüm:** Lütfen birkaç dakika bekleyin ve işlemi tekrar deneyin.";
  } else {
    detail += "❓ **Muhtemel Neden:** Roblox API sunucularından kaynaklı geçici bir bağlantı sorunu veya bilinmeyen bir hata oluştu.\n" +
              "💡 **Çözüm:** Giriş bilgilerini ve grup ID'lerini kontrol edip tekrar deneyin.";
  }

  return detail;
}


// Roblox açıklama doğrulaması için bekleyen kodlar: discordId -> { robloxId, username, code }
const pendingBioCodes = new Map();

function v2Reply(container, ephemeral = true) {
  const flags = MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0);
  return { components: [container], flags };
}

/**
 * Yetkilendirme butonuna basınca açılan Components V2 yöntem seçim paneli.
 */
function buildVerifyMethodPanel(linkedUser) {
  const container = new ContainerBuilder().setAccentColor(0x4169e1);

  if (linkedUser) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `## ✅ Hesabın Zaten Bağlı\nRoblox: **${linkedUser.robloxUsername || "Bilinmiyor"}** (\`${linkedUser.robloxId}\`)\n\n` +
      "Rollerini güncellemek için **Rollerimi Senkronize Et** butonunu kullan. Farklı bir hesap bağlamak istersen aşağıdan yeni yöntem seçebilirsin."
    ));
  } else {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      "## 🔐 Roblox Hesap Bağlama\nAşağıdaki menüden sana uygun **doğrulama yöntemini** seç."
    ));
  }

  container
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("rbx_sel_verify_method")
        .setPlaceholder("Doğrulama yöntemi seç...")
        .addOptions(
          { label: "Roblox OAuth2", value: "oauth", emoji: "🌐", description: "Resmi Roblox girişi ile bağla (önerilen)" },
          { label: "Roblox Arkadaşlık", value: "friend", emoji: "🤝", description: "Botun arkadaşlık isteğini kabul et" },
          { label: "Roblox Açıklama", value: "bio", emoji: "📝", description: "Profil açıklamana doğrulama kodu yaz" },
          { label: "Discord DM", value: "dm", emoji: "✉️", description: "Doğrulama bağlantısı DM ile gelsin" }
        )
    ))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("-# TMT Yetkilendirme Sistemi"));

  return v2Reply(container);
}

function buildUsernameModal(customId, title) {
  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("rbx_username_input")
        .setLabel("Roblox Kullanıcı Adınız")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("örn: RobloxUser")
        .setRequired(true)
        .setMaxLength(50)
    ));
}

/**
 * Doğrulanmış Roblox hesabını kaydeder ve bulunulan sunucuya göre rolleri senkronize eder.
 */
async function linkAndSyncRoblox(interaction, robloxId, username) {
  const User = require("../../models/User");
  const { saveStoreNow } = require("../../models/Store");
  let dbUser = await User.findOne({ discordId: interaction.user.id });
  if (!dbUser) {
    const { ensureDiscordUser } = require("../../utils/userLink");
    dbUser = await ensureDiscordUser(interaction.user);
  }

  dbUser.robloxId = String(robloxId);
  dbUser.robloxUsername = username;
  dbUser.isAuthorized = true;
  await dbUser.save();
  saveStoreNow();

  const { TARGET_GUILD_ID, TMT_GUILD_ID, ALLIED_GUILD_ID, GUILD2_ID } = require("../../config");
  const guild = interaction.guild;
  if (!guild) return false;

  const guildId = String(guild.id).trim();
  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member) return false;

  const rid = parseInt(robloxId, 10);
  if (guildId === String(ALLIED_GUILD_ID).trim() || guildId === String(GUILD2_ID).trim()) {
    const { syncAlliedRoles } = require("../services/alliedRoleSyncService");
    const result = await syncAlliedRoles(interaction.client, interaction.user.id, rid, guild);
    return result?.success || false;
  }
  if (guildId === String(TMT_GUILD_ID).trim()) {
    const { syncTMTRoles } = require("../services/tmtRoleSyncService");
    const result = await syncTMTRoles(interaction.client, interaction.user.id, rid, member);
    return result?.success || false;
  }
  if (guildId === String(TARGET_GUILD_ID).trim()) {
    const { syncMemberRoles } = require("../services/roleSyncService");
    const result = await syncMemberRoles(guild, member, rid, username);
    return result?.success || false;
  }
  return false;
}

function linkResultText(username, syncSuccess) {
  return syncSuccess
    ? `✅ **Doğrulama Başarılı!**\nRoblox hesabınız (**${username}**) bağlandı ve rolleriniz senkronize edildi.`
    : `✅ **Hesap Doğrulandı!**\nRoblox hesabınız (**${username}**) bağlandı fakat roller senkronize edilemedi. Lütfen \`/verify\` ile tekrar deneyin.`;
}

async function handleRobloxInteractions(interaction) {
  // ─── 0a. DOĞRULAMA YÖNTEMİ SEÇİMİ ───────────────────────────────────────────
  if (interaction.isStringSelectMenu() && interaction.customId === "rbx_sel_verify_method") {
    const { BASE_URL } = require("../../config");
    const oauthUrl = `${BASE_URL}/auth/roblox`;
    const method = interaction.values[0];

    if (method === "friend") {
      return interaction.showModal(buildUsernameModal("rbx_mod_verify_friend_username", "Roblox Arkadaş Doğrulaması"));
    }
    if (method === "bio") {
      return interaction.showModal(buildUsernameModal("rbx_mod_verify_bio_username", "Roblox Açıklama Doğrulaması"));
    }

    const oauthRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Roblox ile Giriş Yap").setEmoji("🌐").setStyle(ButtonStyle.Link).setURL(oauthUrl)
    );

    if (method === "dm") {
      const dmContainer = new ContainerBuilder()
        .setAccentColor(0x5865f2)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          "## ✉️ Roblox Doğrulama Bağlantın\n" +
          "Aşağıdaki butona tıklayarak **aynı Discord hesabınla** giriş yap ve Roblox hesabını bağla.\n" +
          "Bağladıktan sonra sunucudaki **Rollerimi Senkronize Et** butonuna bas veya `/verify` komutunu kullan.\n\n" +
          "-# Bu bağlantıyı kimseyle paylaşma."
        ))
        .addActionRowComponents(oauthRow);
      const sent = await interaction.user.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).then(() => true).catch(() => false);
      return interaction.reply({
        content: sent
          ? "✉️ Doğrulama bağlantısı **DM kutuna** gönderildi!"
          : "❌ DM gönderilemedi. Gizlilik ayarlarından **sunucu üyelerinden DM**'e izin verip tekrar dene.",
        ephemeral: true,
      });
    }

    // oauth
    const container = new ContainerBuilder()
      .setAccentColor(0x00a2ff)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        "## 🌐 Roblox OAuth2 ile Doğrulama\n" +
        "**1.** Aşağıdaki butona tıkla\n**2.** Aynı Discord hesabınla giriş yap\n**3.** Roblox hesabına izin ver\n" +
        "**4.** Sunucuya dönüp **Rollerimi Senkronize Et** butonuna bas"
      ))
      .addActionRowComponents(oauthRow);
    return interaction.reply(v2Reply(container));
  }

  // ─── 0b. ROBLOX AÇIKLAMA (BIO) İLE DOĞRULAMA ────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === "rbx_mod_verify_bio_username") {
    await interaction.deferReply({ ephemeral: true });
    const username = interaction.fields.getTextInputValue("rbx_username_input").trim();
    try {
      const robloxId = await noblox.getIdFromUsername(username).catch(() => null);
      if (!robloxId) {
        return interaction.editReply({ content: "❌ Roblox kullanıcı adı bulunamadı. Lütfen doğru yazdığınızdan emin olun." });
      }
      const code = `EKO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      pendingBioCodes.set(interaction.user.id, { robloxId: String(robloxId), username, code });

      const container = new ContainerBuilder()
        .setAccentColor(0xf1c40f)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `## 📝 Roblox Açıklama Doğrulaması\nHesap: **${username}** (\`${robloxId}\`)\n\n` +
          `**1.** [Roblox profil ayarlarını aç](https://www.roblox.com/my/account#!/info)\n` +
          `**2.** **Açıklama (About)** kısmına şu kodu ekle ve kaydet:\n\`\`\`${code}\`\`\`` +
          `**3.** Aşağıdaki **Doğrulamayı Tamamla** butonuna bas\n\n-# Doğrulama sonrası kodu açıklamandan silebilirsin.`
        ))
        .addActionRowComponents(new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("rbx_btn_verify_bio_confirm").setLabel("Doğrulamayı Tamamla").setEmoji("✅").setStyle(ButtonStyle.Success)
        ));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      console.error("Bio verification start error:", err);
      return interaction.editReply({ content: `❌ Bir hata oluştu: \`${err.message}\`` });
    }
  }

  if (interaction.isButton() && interaction.customId === "rbx_btn_verify_bio_confirm") {
    await interaction.deferReply({ ephemeral: true });
    const pending = pendingBioCodes.get(interaction.user.id);
    if (!pending) {
      return interaction.editReply({ content: "❌ Bekleyen doğrulama bulunamadı. Lütfen yöntemi baştan seçin." });
    }
    try {
      const info = await noblox.getUserInfo(parseInt(pending.robloxId, 10));
      if (!info?.description || !info.description.includes(pending.code)) {
        return interaction.editReply({ content: `❌ Kod açıklamanda bulunamadı. \`${pending.code}\` kodunu ekleyip kaydettiğinden emin ol ve tekrar dene.` });
      }
      pendingBioCodes.delete(interaction.user.id);
      const syncSuccess = await linkAndSyncRoblox(interaction, pending.robloxId, pending.username);
      return interaction.editReply({ content: linkResultText(pending.username, syncSuccess) });
    } catch (err) {
      console.error("Bio verification confirm error:", err);
      return interaction.editReply({ content: `❌ Bir hata oluştu: \`${err.message}\`` });
    }
  }

  // ─── 0. ARKADAŞ İSTEĞİ İLE HESAP DOĞRULAMA (2. YÖNTEM) ──────────────────────
  if (interaction.customId === "rbx_btn_verify_friend_start") {
    const modal = new ModalBuilder()
      .setCustomId("rbx_mod_verify_friend_username")
      .setTitle("Roblox Arkadaş Doğrulaması");

    const usernameInput = new TextInputBuilder()
      .setCustomId("rbx_username_input")
      .setLabel("Roblox Kullanıcı Adınız")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("örn: RobloxUser")
      .setRequired(true)
      .setMaxLength(50);

    modal.addComponents(new ActionRowBuilder().addComponents(usernameInput));
    return interaction.showModal(modal);
  }

  if (interaction.customId === "rbx_mod_verify_friend_username") {
    await interaction.deferReply({ ephemeral: true });
    const username = interaction.fields.getTextInputValue("rbx_username_input").trim();
    try {
      const robloxId = await noblox.getIdFromUsername(username);
      if (!robloxId) {
        return interaction.editReply({ content: "❌ Roblox kullanıcı adı bulunamadı. Lütfen doğru yazdığınızdan emin olun." });
      }

      // Arkadaşlık isteği gönder
      const { getFriendJar, getOrFetchFriendBotId } = require("../services/robloxGroupManager");
      const friendJar = getFriendJar();
      
      let requestSent = false;
      try {
        await noblox.sendFriendRequest({ userId: robloxId, jar: friendJar });
        requestSent = true;
      } catch (err) {
        const errMsg = typeof err === "string" ? err : (err?.message || JSON.stringify(err || ""));
        const lowerMsg = errMsg.toLowerCase();
        const isAlreadyFriend =
          lowerMsg.includes("already a friend") ||
          lowerMsg.includes("already friends") ||
          lowerMsg.includes("are already friends") ||
          lowerMsg.includes("cannot send friend request") ||
          lowerMsg.includes("already pending") ||
          lowerMsg.includes("zaten var") ||
          lowerMsg.includes('"code":5') ||
          lowerMsg.includes('"code": 5') ||
          err?.errors?.[0]?.code === 5;

        if (isAlreadyFriend) {
          requestSent = true;
        } else {
          console.error("sendFriendRequest error:", err);
          return interaction.editReply({ 
            content: `❌ Arkadaşlık isteği gönderilemedi.\n**Neden:** Roblox profilinizin arkadaşlık isteklerine açık olduğundan veya botun arkadaşlık isteği limitlerinin dolmadığından emin olun.\n*Hata detayı:* \`${errMsg}\`` 
          });
        }
      }

      // Bot Roblox ID'sini al
      const botRobloxId = await getOrFetchFriendBotId();
      const botProfileUrl = botRobloxId ? `https://www.roblox.com/users/${botRobloxId}/profile` : "https://www.roblox.com";

      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle("🤖 Roblox Arkadaşlık Doğrulaması")
        .setDescription(
          `**${username}** (ID: \`${robloxId}\`) hesabına arkadaşlık isteği gönderildi.\n\n` +
          `**Yapılması Gerekenler:**\n` +
          `1. Roblox hesabınıza giriş yapın.\n` +
          `2. **[Botun Roblox Profiline Gitmek İçin Tıklayın](${botProfileUrl})** ve gelen arkadaşlık isteğini kabul edin.\n` +
          `3. İsteği kabul ettikten sonra aşağıdaki **Doğrulamayı Tamamla** butonuna tıklayın.\n\n` +
          `*Not: Doğrulama tamamlandıktan sonra bot sizi otomatik olarak arkadaşlıktan çıkaracaktır.*`
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`rbx_btn_verify_friend_confirm_${robloxId}_${username}`)
          .setLabel("✅ Doğrulamayı Tamamla")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error("Verification start error:", err);
      return interaction.editReply({ content: `❌ Bir hata oluştu: \`${err.message}\`` });
    }
  }

  if (interaction.customId && interaction.customId.startsWith("rbx_btn_verify_friend_confirm_")) {
    await interaction.deferReply({ ephemeral: true });
    const parts = interaction.customId.split("_");
    const robloxId = parts[5];
    const username = parts.slice(6).join("_");

    try {
      const { getFriendJar, getOrFetchFriendBotId } = require("../services/robloxGroupManager");
      const botRobloxId = await getOrFetchFriendBotId();
      const friendJar = getFriendJar();
      if (!botRobloxId || !friendJar) {
        return interaction.editReply({ content: "❌ Botun Roblox bağlantısı şu an aktif değil. Lütfen daha sonra tekrar deneyin." });
      }

      // Arkadaşlık listesini kontrol et
      const friends = await noblox.getFriends({ userId: botRobloxId, jar: friendJar });
      const isFriend = friends && friends.data && friends.data.some(f => String(f.id) === String(robloxId));

      if (!isFriend) {
        return interaction.editReply({ 
          content: "❌ **Arkadaşlık isteği kabul edilmemiş.** Lütfen botun gönderdiği arkadaşlık isteğini kabul ettiğinizden emin olun ve tekrar deneyin." 
        });
      }

      const syncSuccess = await linkAndSyncRoblox(interaction, robloxId, username);

      // Arkadaşlıktan çıkar
      const { unfriendUser } = require("../services/robloxGroupManager");
      await unfriendUser(parseInt(robloxId, 10));

      if (syncSuccess) {
        return interaction.editReply({ 
          content: `✅ **Doğrulama Başarılı!**\nRoblox hesabınız (**${username}**) başarıyla doğrulandı ve bağlandı. Rolleriniz senkronize edildi.` 
        });
      } else {
        return interaction.editReply({ 
          content: `✅ **Hesap Doğrulandı!**\nRoblox hesabınız (**${username}**) başarıyla bağlandı fakat rolleriniz senkronize edilirken bir sorun oluştu. Lütfen \`/verify\` komutunu kullanarak tekrar deneyin.` 
        });
      }
    } catch (err) {
      console.error("Verification confirm error:", err);
      return interaction.editReply({ content: `❌ Bir hata oluştu: \`${err.message}\`` });
    }
  }

  // --- 1. SEÇİM MENÜLERİ (GRUP VE RÜTBE SEÇİMİ) ---
  if (interaction.isStringSelectMenu()) {
    if (!isUserAuthorized(interaction.member)) {
      return interaction.reply({ content: "❌ Bu menüyü kullanmak için yeterli yetkiniz (Yönetici) bulunmuyor.", ephemeral: true });
    }

    if (interaction.customId === "roblox_group_select") {
      const selectedValue = interaction.values[0]; // rbx_grp_ID
      const groupId = selectedValue.replace("rbx_grp_", "");
      const groupName = ROBLOX_GROUPS[groupId] || "Bilinmeyen Grup";

      const embed = new EmbedBuilder()
        .setTitle(`🏢 Seçilen Grup: ${groupName}`)
        .setDescription(`Aşağıdaki butonları kullanarak **${groupName}** (ID: \`${groupId}\`) grubunda işlemler yapabilirsiniz.\n\nLütfen işlem yapmadan önce "Rütbe Listesi" butonuna tıklayarak gruptaki tüm rütbe adlarını/ID'lerini kontrol edin.`)
        .setColor(0x3498DB)
        .setFooter({ text: "İşlemler Roblox API üzerinden anlık olarak gerçekleştirilir." });

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`rbx_btn_ranks_${groupId}`)
          .setLabel("Rütbe Listesi")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("📜"),
        new ButtonBuilder()
          .setCustomId(`rbx_btn_changerank_${groupId}`)
          .setLabel("Rütbe Değiştir")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🪖"),
        new ButtonBuilder()
          .setCustomId(`rbx_btn_manual_${groupId}`)
          .setLabel("Manuel İstek")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("➕")
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`rbx_btn_acceptall_${groupId}`)
          .setLabel("Tüm İstekleri Kabul Et")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅"),
        new ButtonBuilder()
          .setCustomId(`rbx_btn_denyall_${groupId}`)
          .setLabel("Tüm İstekleri Reddet")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("❌")
      );

      return interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    }

    if (interaction.customId.startsWith("roblox_rank_select")) {
      await interaction.deferReply({ ephemeral: true });
      try {
        const parts = interaction.values[0].split("_");
        // Format: rbx_rank_groupId_userId_newRankId
        const groupId = parts[2];
        const userId = parseInt(parts[3]);
        const newRankId = parseInt(parts[4]);

        const username = await noblox.getUsernameFromId(userId).catch(() => `User:${userId}`);
        
        let oldRoleName = "Bilinmiyor / Grupta Değil";
        try {
          oldRoleName = await noblox.getRankNameInGroup(parseInt(groupId), userId);
        } catch (_) {}

        const groupName = ROBLOX_GROUPS[groupId] || `Grup ID: ${groupId}`;
        const { requestRobloxCookieApproval } = require("../services/robloxApprovalGateway");

        const approvalRes = await requestRobloxCookieApproval(interaction.client, {
          action: `Roblox Rütbe Değiştirme (${groupName})`,
          targetUser: `**${username}** (ID: \`${userId}\`)`,
          reason: `Yetkili: ${interaction.user.tag} (${interaction.user.id}) | Eski Rütbe: ${oldRoleName} -> Yeni Rank ID: ${newRankId}`,
          requesterId: interaction.user.id,
          executeCallback: async (approverUser) => {
            const newRole = await noblox.setRank({ group: parseInt(groupId), target: userId, rank: newRankId });

            try {
              const logEmbed = new EmbedBuilder()
                .setTitle("🪖 Roblox Rütbe Değişikliği")
                .setColor(0x2ECC71)
                .addFields(
                  { name: "👤 İsteği Yapan", value: `${interaction.user.toString()}\n\`${interaction.user.tag}\``, inline: true },
                  { name: "🆔 İsteği Yapan ID", value: `\`${interaction.user.id}\``, inline: true },
                  { name: "✅ Onaylayan", value: approverUser ? `${approverUser.toString()}\n\`${approverUser.tag}\`` : 'Otomatik Onay', inline: true },
                  { name: "🏢 Grup", value: `**${groupName}**\nID: \`${groupId}\``, inline: true },
                  { name: "👤 Hedef Kullanıcı", value: `**${username}**\nID: \`${userId}\``, inline: true },
                  { name: "⏪ Eski Rütbe", value: `**${oldRoleName}**`, inline: true },
                  { name: "🆕 Yeni Rütbe", value: `**${newRole.name}**\nRank ID: \`${newRankId}\``, inline: true }
                )
                .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`)
                .setTimestamp()
                .setFooter({ text: "Roblox Grup Yönetim Sistemi", iconURL: interaction.client.user.displayAvatarURL() });

              await sendRobloxLog(interaction, logEmbed);
            } catch (logErr) {
              console.error("[Roblox Rank Select Log Error]", logErr);
            }
            return newRole;
          }
        });

        return interaction.editReply({ content: approvalRes.message });
      } catch (err) {
        console.error("[Roblox Rank Select Error]", err);
        const detailedError = getDetailedRobloxError(err);
        return interaction.editReply({ content: `❌ **Rütbe Değiştirme Hatası**\n\n${detailedError}` });
      }
    }
  }

  // --- 2. BUTONLAR ---
  if (interaction.isButton() && interaction.customId.startsWith("rbx_btn_")) {
    if (!isUserAuthorized(interaction.member)) {
      return interaction.reply({ content: "❌ Yetkiniz yok.", ephemeral: true });
    }

    if (interaction.customId === "rbx_btn_tmt_yk_alimi") {
      const modal = new ModalBuilder()
        .setCustomId("rbx_mod_tmt_yk_alimi")
        .setTitle("YK Alımı (Tüm Gruplar)");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("roblox_username")
            .setLabel("Roblox Kullanıcı Adı")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    const parts = interaction.customId.split("_");
    const action = parts[2]; // ranks, changerank, manual, acceptall, denyall
    const groupId = parts[3];
    const groupName = ROBLOX_GROUPS[groupId] || "Grup";

    if (action === "ranks") {
      await interaction.deferReply({ ephemeral: true });
      try {
        const roles = await noblox.getRoles(parseInt(groupId));
        const rolesText = roles.map(r => `• **${r.name}** (Rank ID: ${r.rank})`).join("\n");
        const embed = new EmbedBuilder()
          .setTitle(`📜 ${groupName} - Tüm Rütbeler`)
          .setDescription(`Gruptaki tüm rütbeler listelenmiştir:\n\n${rolesText}`)
          .setColor(0x2ECC71);
        
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error("[Roblox Get Ranks Error]", err);
        const detailedError = getDetailedRobloxError(err);
        return interaction.editReply({ content: `❌ **Rütbe Listesi Çekilemedi**\n\n${detailedError}` });
      }
    }

    if (action === "changerank") {
      const modal = new ModalBuilder()
        .setCustomId(`rbx_mod_username_${groupId}`)
        .setTitle("🪖 Rütbe Değiştir");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("roblox_username")
            .setLabel("Roblox Kullanıcı Adı")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    if (action === "manual") {
      const modal = new ModalBuilder()
        .setCustomId(`rbx_mod_manual_${groupId}`)
        .setTitle("➕ İstek Yönetimi (Manuel)");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("roblox_username")
            .setLabel("İstek Atan Kullanıcı Adı")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("action_type")
            .setLabel("Kabul için: evet, Reddetmek için: hayır")
            .setPlaceholder("evet / hayır")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    if (action === "acceptall" || action === "denyall") {
      await interaction.deferReply({ ephemeral: true });
      const isAccept = action === "acceptall";
      try {
        const reqs = await noblox.getJoinRequests({ group: parseInt(groupId), limit: 100 });
        if (!reqs || !reqs.data || reqs.data.length === 0) {
          return interaction.editReply({ content: "ℹ️ Bekleyen katılım isteği bulunmuyor." });
        }

        let count = 0;
        const userList = [];
        for (const r of reqs.data) {
          await noblox.handleJoinRequest(parseInt(groupId), r.requester.userId, isAccept).catch(() => {});
          userList.push(`• ${r.requester.username} (\`${r.requester.userId}\`)`);
          count++;
        }

        // Log → TMT + Müttefik kanallarına
        try {
          const logEmbed = new EmbedBuilder()
            .setTitle(isAccept ? "✅ Toplu Katılım İstekleri Kabul Edildi" : "❌ Toplu Katılım İstekleri Reddedildi")
            .setColor(isAccept ? 0x2ECC71 : 0xE74C3C)
            .addFields(
              { name: "👤 Yetkili", value: `${interaction.user.toString()}\n\`${interaction.user.tag}\``, inline: true },
              { name: "🆔 Yetkili ID", value: `\`${interaction.user.id}\``, inline: true },
              { name: "🏢 Grup", value: `**${groupName}**\nID: \`${groupId}\``, inline: true },
              { name: `📋 ${isAccept ? "Kabul Edilen" : "Reddedilen"} Kullanıcılar (${count})`, value: userList.slice(0, 20).join("\n") + (count > 20 ? `\n...ve ${count - 20} kişi daha` : "") || "—", inline: false }
            )
            .setTimestamp()
            .setFooter({ text: "Roblox Grup Yönetim Sistemi", iconURL: interaction.client.user.displayAvatarURL() });

          await sendRobloxLog(interaction, logEmbed);
        } catch (logErr) {
          console.error("[Roblox AcceptAll/DenyAll Log Error]", logErr);
        }

        return interaction.editReply({ content: `✅ İşlem Başarılı! Toplam **${count}** bekleyen istek **${isAccept ? "kabul edildi" : "reddedildi"}**.` });
      } catch (err) {
        console.error("[Roblox Handle Join Requests Error]", err);
        const detailedError = getDetailedRobloxError(err);
        return interaction.editReply({ content: `❌ **Katılım İstekleri İşlenirken Hata Oluştu**\n\n${detailedError}` });
      }
    }
  }

  // --- 3. MODALLAR (FORM GÖNDERİMİ) ---
  if (interaction.isModalSubmit() && interaction.customId.startsWith("rbx_mod_")) {
    if (!isUserAuthorized(interaction.member)) {
      return interaction.reply({ content: "❌ Yetkiniz yok.", ephemeral: true });
    }

    if (interaction.customId === "rbx_mod_tmt_yk_alimi") {
      await interaction.deferReply({ ephemeral: true });
      const username = interaction.fields.getTextInputValue("roblox_username").trim();
      try {
        const userId = await noblox.getIdFromUsername(username).catch(() => null);
        if (!userId) {
          return interaction.editReply({ content: `❌ **${username}** adında bir Roblox kullanıcısı bulunamadı.` });
        }

        const tmtGroups = {
          "11517908": "TMT Turkish Armed Forces",
          "35212138": "TMT Akademi",
          "33709461": "TMT Askeri İnzibat",
          "35430592": "TMT Birimler Bölükler",
          "5415548": "TMT Deniz Kuvvetleri Komutanlığı",
          "35212127": "TMT Genel Branş Komutanlığı",
          "33709391": "TMT Hava Kuvvetleri",
          "35432150": "TMT Hudut Müfettişleri",
          "12008462": "TMT Jandarma Genel Komutanlığı",
          "33714381": "TMT Kara Kuvvetleri Komutanlığı",
          "35528574": "TMT Ministry of Foreign Affairs",
          "33708598": "TMT Özel Kuvvetler Komutanlığı",
          "35528598": "TMT RAIDERS",
          "35528556": "TMT Sürücü Okulu"
        };

        const results = [];
        for (const [groupId, groupName] of Object.entries(tmtGroups)) {
          try {
            const roles = await noblox.getRoles(parseInt(groupId));
            let targetRoleName = groupId === "11517908" ? "yönetim kurulu" : "ordu yönetimi";
            const targetRole = roles.find(r => r.name.toLowerCase().includes(targetRoleName));
            
            if (targetRole) {
              await noblox.setRank({ group: parseInt(groupId), target: userId, rank: targetRole.rank });
              results.push(`✅ **${groupName}**: ${targetRole.name} yapıldı`);
            } else {
              results.push(`⚠️ **${groupName}**: '${targetRoleName}' rütbesi bulunamadı`);
            }
          } catch (err) {
             if (err.message.includes("is not in group") || err.message.includes("not in group")) {
               results.push(`❌ **${groupName}**: Kullanıcı bu grupta değil`);
             } else if (err.message.includes("permission") || err.message.includes("403")) {
               results.push(`❌ **${groupName}**: Yetki yetersiz veya kullanıcının rütbesi eşit/yüksek`);
             } else {
               results.push(`❌ **${groupName}**: Hata oluştu`);
             }
          }
        }

        const embed = new EmbedBuilder()
          .setTitle("👑 YK Alımı Tamamlandı")
          .setDescription(`**${username}** (\`${userId}\`) kullanıcısının rütbe güncellemeleri:\n\n${results.join("\n")}`)
          .setColor(0x2ECC71)
          .setTimestamp();
          
        try {
          const logEmbed = EmbedBuilder.from(embed)
            .addFields(
              { name: "👤 İşlemi Yapan", value: `${interaction.user.toString()}`, inline: true }
            )
            .setFooter({ text: "Roblox Grup Yönetim Sistemi", iconURL: interaction.client.user.displayAvatarURL() });
          await sendRobloxLog(interaction, logEmbed);
        } catch (_) {}

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error("[YK Alımı Error]", err);
        return interaction.editReply({ content: `❌ İşlem sırasında bir hata oluştu: ${err.message}` });
      }
    }

    const parts = interaction.customId.split("_");
    const action = parts[2]; // username, manual
    const groupId = parts[3];

    await interaction.deferReply({ ephemeral: true });

    try {
      if (action === "username") {
        const username = interaction.fields.getTextInputValue("roblox_username").trim();
        const userId = await noblox.getIdFromUsername(username).catch(() => null);
        if (!userId) {
          return interaction.editReply({ content: `❌ **${username}** adında bir Roblox kullanıcısı bulunamadı.` });
        }

        const roles = await noblox.getRoles(parseInt(groupId));
        let currentRoleName = "Grupta Değil";
        try {
          currentRoleName = await noblox.getRankNameInGroup(parseInt(groupId), userId);
        } catch (_) {}

        const selectRows = [];
        const chunkSize = 25;
        for (let i = 0; i < roles.length; i += chunkSize) {
          const chunk = roles.slice(i, i + chunkSize);
          const options = chunk.map(r => ({
            label: `${r.name} (Rank: ${r.rank})`,
            value: `rbx_rank_${groupId}_${userId}_${r.rank}_${r.id}`,
            description: `Rütbe ID: ${r.rank}`
          }));

          const part = Math.floor(i / chunkSize) + 1;
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`roblox_rank_select_${part}`)
            .setPlaceholder(`Yeni rütbeyi seçin (Kısım ${part})...`)
            .addOptions(options);

          selectRows.push(new ActionRowBuilder().addComponents(selectMenu));
        }

        const embed = new EmbedBuilder()
          .setTitle("🪖 Rütbe Değiştir (Aşama 2)")
          .setDescription(`**Kullanıcı:** ${username} (\`${userId}\`)\n**Mevcut Rütbe:** ${currentRoleName}\n\nAşağıdaki menüden atamak istediğiniz yeni rütbeyi seçin:`)
          .setColor(0x3498DB);

        return interaction.editReply({ embeds: [embed], components: selectRows });
      }

      if (action === "manual") {
        const username = interaction.fields.getTextInputValue("roblox_username").trim();
        const actionType = interaction.fields.getTextInputValue("action_type").trim().toLowerCase();
        const isAccept = actionType === "evet" || actionType === "yes" || actionType === "kabul";

        const userId = await noblox.getIdFromUsername(username).catch(() => null);
        if (!userId) {
          return interaction.editReply({ content: `❌ **${username}** adında bir Roblox kullanıcısı bulunamadı.` });
        }

        const manualGroupName = ROBLOX_GROUPS[groupId] || `Grup ID: ${groupId}`;
        const { requestRobloxCookieApproval } = require("../services/robloxApprovalGateway");

        const approvalRes = await requestRobloxCookieApproval(interaction.client, {
          action: `Roblox Gruba Katılım ${isAccept ? 'Onayı' : 'Reddi'} (${manualGroupName})`,
          targetUser: `**${username}** (ID: \`${userId}\`)`,
          reason: `Yetkili: ${interaction.user.tag} (${interaction.user.id}) | Grup ID: ${groupId}`,
          requesterId: interaction.user.id,
          executeCallback: async (approverUser) => {
            await noblox.handleJoinRequest(parseInt(groupId), userId, isAccept);

            try {
              const logEmbed = new EmbedBuilder()
                .setTitle(isAccept ? "✅ Manuel Katılım İsteği Onaylandı" : "❌ Manuel Katılım İsteği Reddedildi")
                .setColor(isAccept ? 0x2ECC71 : 0xE74C3C)
                .addFields(
                  { name: "👤 İsteği Yapan", value: `${interaction.user.toString()}\n\`${interaction.user.tag}\``, inline: true },
                  { name: "🆔 İsteği Yapan ID", value: `\`${interaction.user.id}\``, inline: true },
                  { name: "✅ Onaylayan", value: approverUser ? `${approverUser.toString()}\n\`${approverUser.tag}\`` : 'Otomatik Onay', inline: true },
                  { name: "🏢 Grup", value: `**${manualGroupName}**\nID: \`${groupId}\``, inline: true },
                  { name: "👤 Hedef Roblox Kullanıcısı", value: `**${username}**\nID: \`${userId}\``, inline: true },
                  { name: "📋 İşlem", value: isAccept ? "Gruba Katılım Onaylandı" : "Gruba Katılım Reddedildi", inline: true }
                )
                .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`)
                .setTimestamp()
                .setFooter({ text: "Roblox Grup Yönetim Sistemi", iconURL: interaction.client.user.displayAvatarURL() });

              await sendRobloxLog(interaction, logEmbed);
            } catch (logErr) {
              console.error("[Roblox Manual Join Log Error]", logErr);
            }
          }
        });

        return interaction.editReply({ content: approvalRes.message });
      }
    } catch (err) {
      console.error("[Roblox Interaction Error]", err);
      const detailedError = getDetailedRobloxError(err);
      return interaction.editReply({ content: `❌ **İşlem Formu Gönderim Hatası**\n\n${detailedError}` });
    }
  }

  return null;
}

// ─── Abuse Buton Handler'ları ─────────────────────────────────────────────────
/**
 * Abuse şüphesi butonlarını işler.
 * customId: rbx_abuse_demote_{groupId}_{targetUserId}
 * customId: rbx_abuse_ignore_{groupId}_{targetUserId}
 */
async function handleAbuseButton(interaction) {
  if (!isUserAuthorized(interaction.member, interaction.user)) {
    return interaction.reply({ content: "❌ Bu butonu kullanmak için Yönetici yetkisi gereklidir.", ephemeral: true });
  }

  const parts     = interaction.customId.split("_");
  // Format: rbx_abuse_demote/ignore_{groupId}_{targetUserId}_{actorId}
  const action    = parts[2]; // "demote" veya "ignore"
  const groupId   = parts[3];
  const targetId  = parseInt(parts[4]);
  const actorId   = parts[5] ? parseInt(parts[5]) : null;
  const groupName = ROBLOX_GROUPS[groupId] || `Grup ${groupId}`;

  // Gece modu sayacını iptal et (eğer varsa)
  if (actorId && actorId !== 0) {
    const { cancelPendingRbxNightBan } = require("../services/robloxAuditLogPoller");
    cancelPendingRbxNightBan(groupId, actorId);
  }

  // Butonları hemen devre dışı bırak
  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rbx_abuse_demote_${groupId}_${targetId}_${actorId || "0"}`)
      .setLabel(action === "demote" ? "✅ Rütbe İndirildi" : "✅ EVET ÇEK — En Düşük Rütbeye İndir")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🚨")
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`rbx_abuse_ignore_${groupId}_${targetId}_${actorId || "0"}`)
      .setLabel(action === "ignore" ? "🚫 Yoksayıldı" : "❌ Yoksay — Şüphe Yok")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🚫")
      .setDisabled(true)
  );

  // ── YOKSAY ──────────────────────────────────────────────────────────────────
  if (action === "ignore") {
    await interaction.update({
      embeds: [
        EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0x95A5A6)
          .setTitle("🚫 Abuse Şüphesi — Yoksayıldı")
          .setDescription(
            (interaction.message.embeds[0].description || "") +
            `\n\n✅ **${interaction.user.toString()}** tarafından yoksayıldı.`
          )
      ],
      components: [disabledRow]
    });
    return;
  }

  // ── RÜTBE İNDİR ─────────────────────────────────────────────────────────────
  await interaction.deferUpdate();

  try {
    // 1. Gruptaki tüm rütbeleri al
    const roles = await noblox.getRoles(parseInt(groupId));

    // 2. En düşük rütbeyi bul (rank > 0, misafir değil)
    const lowest = roles
      .filter(r => r.rank > 0)
      .sort((a, b) => a.rank - b.rank)[0];

    if (!lowest) {
      return interaction.editReply({ content: "❌ Grupta geçerli bir düşük rütbe bulunamadı." });
    }

    // 3. Kullanıcının mevcut rütbesini al
    let targetToDemote = targetId;
    let isRevertingActor = false;
    if ((!targetToDemote || targetToDemote === 0) && actorId && actorId !== 0) {
      targetToDemote = actorId;
      isRevertingActor = true;
    }

    let oldRoleName = "Bilinmiyor";
    try { oldRoleName = await noblox.getRankNameInGroup(parseInt(groupId), targetToDemote); } catch (_) {}

    // 4. Kullanıcı adını al
    let targetUsername = `ID:${targetToDemote}`;
    try { targetUsername = await noblox.getUsernameFromId(targetToDemote); } catch (_) {}

    // 5. Rütbeyi en düşüğe çek
    await noblox.setRank({ group: parseInt(groupId), target: targetToDemote, rank: lowest.rank });

    // 6. Log embedi
    const logEmbed = new EmbedBuilder()
      .setTitle(isRevertingActor ? "🚨 Abuse Müdahalesi — Aktör Rütbesi En Düşüğe Çekildi" : "🚨 Abuse Müdahalesi — Rütbe En Düşüğe Çekildi")
      .setColor(0xFF6B00)
      .addFields(
        { name: "👤 Müdahaleyi Yapan",    value: `${interaction.user.toString()}\n\`${interaction.user.tag}\``, inline: true },
        { name: "🏢 Grup",                value: `**${groupName}**\nID: \`${groupId}\``,                       inline: true },
        { name: isRevertingActor ? "👤 Cezalandırılan Aktör" : "🎯 Hedef Kullanıcı",     value: `**${targetUsername}**\nID: \`${targetToDemote}\``,                  inline: true },
        { name: "⏪ İndirilmeden Önceki", value: `**${oldRoleName}**`,                                          inline: true },
        { name: "🆕 Çekilen Rütbe",       value: `**${lowest.name}** (Rank \`${lowest.rank}\`)`,                inline: true }
      )
      .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${targetToDemote}&width=150&height=150&format=png`)
      .setTimestamp()
      .setFooter({ text: "Roblox Abuse Müdahale Sistemi", iconURL: interaction.client.user.displayAvatarURL() });

    await sendRobloxLog(interaction, logEmbed);

    // 7. Alert mesajını güncelle
    await interaction.editReply({
      embeds: [
        EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0xFF6B00)
          .setTitle("🚨 Abuse Müdahalesi Gerçekleştirildi")
          .setDescription(
            (interaction.message.embeds[0].description || "") +
            `\n\n✅ **${interaction.user.toString()}** tarafından müdahale edildi.\n` +
            `**${targetUsername}** kullanıcısının rütbesi **${lowest.name}** (Rank \`${lowest.rank}\`) olarak güncellendi.`
          )
      ],
      components: [disabledRow]
    });

    console.log(`[AbuseButton] 🚨 Müdahale: Grup ${groupId} — ${targetUsername} (${targetToDemote}) → ${lowest.name} (${lowest.rank})`);
  } catch (err) {
    console.error("[AbuseButton] Rütbe indirme hatası:", err);
    const detailedError = getDetailedRobloxError(err);
    await interaction.editReply({
      embeds: [
        EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0xE74C3C)
          .setTitle("❌ Abuse Müdahalesi Başarısız")
          .setDescription(
            (interaction.message.embeds[0].description || "") +
            `\n\n❌ **Hata:** ${detailedError}`
          )
      ],
      components: [disabledRow]
    });
  }
}

module.exports = { handleRobloxInteractions, handleAbuseButton, buildVerifyMethodPanel };
