const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const User = require("../../models/User");
const { BASE_URL, ADMIN_IDS } = require("../../config");
const { findUserByDiscordId, hasRobloxLink } = require("../../utils/userLink");
const { syncMemberRoles, buildSyncPlan, MAIN_GROUP_ID } = require("../services/roleSyncService");
const { logUpdate } = require("../services/commandLog");
const { deferEphemeral, replyEphemeral } = require("../utils/interaction");

// Embed alanı en fazla 1024 karakter olabilir ve boş olamaz; aksi halde discord.js
// "Received one or more errors" doğrulama hatası fırlatır.
function fitField(text, fallback = "—") {
  const str = text == null ? "" : String(text);
  if (!str.trim()) return fallback;
  return str.length > 1024 ? str.slice(0, 1021) + "..." : str;
}

function formatRoleList(roles) {
  if (!roles?.length) return "None";
  const lines = [];
  let len = 0;
  for (let i = 0; i < roles.length; i++) {
    const r = roles[i];
    const line = typeof r === "string" ? (/^\d+$/.test(r) ? `<@&${r}>` : r) : `<@&${r.id}>`;
    const rest = roles.length - i;
    if (len + line.length + 1 > 1000) {
      lines.push(`… +${rest} rol daha`);
      break;
    }
    lines.push(line);
    len += line.length + 1;
  }
  return fitField(lines.join("\n"), "None");
}

function buildUpdateEmbed(member, result) {
  return new EmbedBuilder()
    .setColor(result.success ? 0x5865f2 : 0xed4245)
    .setTitle("Update")
    .addFields(
      { name: "Nickname", value: fitField(result.nickname || member.displayName || member.user.username), inline: false },
      { name: "Added Roles", value: formatRoleList(result.added || []), inline: false },
      { name: "Removed Roles", value: formatRoleList(result.removed || []), inline: false }
    )
    .setFooter({ text: "Sentara • Rol Senkronizasyonu" })
    .setTimestamp();
}

async function syncBranchServerRoles(guild, member, robloxUserId) {
  const db = require("../../models/db");
  if (!db.isMongoActive()) {
    return { success: false, message: "Bu sunucu için aktif bir kurulum (ServerSetup) bulunamadı (Veritabanı aktif değil)." };
  }

  const ServerSetup = require("../../models/ServerSetup");
  const setupDoc = await ServerSetup.findOne({ guildId: guild.id, status: "active" });
  if (!setupDoc) {
    return { success: false, message: "Bu sunucu için aktif bir kurulum (ServerSetup) bulunamadı." };
  }

  const noblox = require("noblox.js");
  const rank = await noblox.getRankInGroup(setupDoc.robloxGroupId, parseInt(robloxUserId, 10)).catch(() => 0);

  // Mapped role ID(s)
  const mappedVal = setupDoc.roleMappings instanceof Map ? setupDoc.roleMappings.get(rank.toString()) : setupDoc.roleMappings[rank.toString()];
  const mappedRoleIds = Array.isArray(mappedVal) ? mappedVal : (typeof mappedVal === "string" ? mappedVal.split(",") : []);

  // Find all possible roles in the mapping to remove old ones
  let allMappedRoleIds = [];
  const rawValues = setupDoc.roleMappings instanceof Map ? Array.from(setupDoc.roleMappings.values()) : Object.values(setupDoc.roleMappings);
  for (const val of rawValues) {
    if (Array.isArray(val)) {
      allMappedRoleIds.push(...val);
    } else if (typeof val === "string" && val) {
      allMappedRoleIds.push(...val.split(","));
    }
  }
  // Keep unique values
  allMappedRoleIds = Array.from(new Set(allMappedRoleIds));

  const toAdd = [];
  const toRemove = [];

  for (const rid of mappedRoleIds) {
    if (rid && !member.roles.cache.has(rid)) {
      toAdd.push(rid);
    }
  }

  for (const rid of allMappedRoleIds) {
    if (rid && !mappedRoleIds.includes(rid) && member.roles.cache.has(rid)) {
      toRemove.push(rid);
    }
  }

  if (toAdd.length > 0) {
    await member.roles.add(toAdd, "Branch server rank update").catch(() => {});
  }

  if (toRemove.length > 0) {
    await member.roles.remove(toRemove, "Branch server rank update").catch(() => {});
  }

  // Update nickname: RobloxUsername [RankName]
  const rbxRoles = await noblox.getRoles(setupDoc.robloxGroupId).catch(() => []);
  const rankObj = rbxRoles.find(r => r.rank === rank);
  const rankName = rankObj ? rankObj.name : "Guest";
  const robloxUsername = await noblox.getUsernameFromId(parseInt(robloxUserId, 10)).catch(() => null);

  if (robloxUsername) {
    const newNickname = `${robloxUsername} [${rankName}]`.slice(0, 32);
    await member.setNickname(newNickname, "Branch server rank update").catch(() => {});
  }

  return {
    success: true,
    added: toAdd.map(id => guild.roles.cache.get(id)).filter(Boolean),
    removed: toRemove.map(id => guild.roles.cache.get(id)).filter(Boolean),
    nickname: robloxUsername ? `${robloxUsername} [${rankName}]` : null,
    rankName
  };
}

/**
 * Sunucu tipine göre (Branch / TMT / Allied-EKO / BEM) tek bir üyenin rollerini senkronize eder.
 * Interaction'dan bağımsızdır; /update, /update all:True ve /verify ortak kullanır.
 */
async function syncMemberInGuild(client, guild, member, dbUser) {
  const { TMT_GUILD_ID, ALLIED_GUILD_ID, GUILD2_ID } = require("../../config");
  const guildId = String(guild.id).trim();

  // Branch Sunucu (ServerSetup ile kurulmuş)
  const db = require("../../models/db");
  if (db.isMongoActive()) {
    const ServerSetup = require("../../models/ServerSetup");
    const setupDoc = await ServerSetup.findOne({ guildId, status: "active" });
    if (setupDoc) return syncBranchServerRoles(guild, member, dbUser.robloxId);
  }

  // TMT Sunucusu
  if (guildId === String(TMT_GUILD_ID).trim()) {
    const { syncTMTRoles } = require("../services/tmtRoleSyncService");
    const result = await syncTMTRoles(client, member.id, dbUser.robloxId, member);
    if (result && !result.success && !result.message) {
      result.message = "Roller senkronize edilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    }
    return result;
  }

  // Allied veya EKOYILDIZ Sunucusu
  if (guildId === String(ALLIED_GUILD_ID).trim() || guildId === String(GUILD2_ID).trim()) {
    const { syncAlliedRoles } = require("../services/alliedRoleSyncService");
    const result = await syncAlliedRoles(client, member.id, parseInt(dbUser.robloxId, 10), member);
    if (result && !result.success && !result.message) {
      result.message = "Roller senkronize edilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    }
    return result;
  }

  // BEM Sunucusu (varsayılan)
  const result = await syncMemberRoles(guild, member, parseInt(dbUser.robloxId, 10), dbUser.robloxUsername);
  if (result?.success && dbUser.groupRole !== result.rankName) {
    dbUser.groupRole = result.rankName;
    await dbUser.save();
  }
  return result;
}

function addResultFields(embed, result) {
  if (result.tier) {
    embed.addFields({ name: "🎖️ Seviye Rolü", value: fitField(result.tier), inline: true });
  }
  if (result.unresolved?.length) {
    embed.addFields({
      name: "⚠️ Eşleşmeyen Roller",
      value: fitField(result.unresolved.map((n) => `\`${n}\``).join(", ")),
      inline: false,
    });
  }
  return embed;
}

function linkUrlForGuild(guild) {
  const { TMT_GUILD_ID } = require("../../config");
  return `${BASE_URL}/baglan/${String(guild.id) === String(TMT_GUILD_ID) ? "tmt" : "bem"}`;
}

function canManageOthers(interaction) {
  return (
    ADMIN_IDS.includes(interaction.user.id) ||
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)
  );
}

async function runSyncForMember(interaction, { ephemeral = true, commandName = "update", targetUser = null } = {}) {
  const { guild, user } = interaction;

  if (!guild) {
    return interaction.reply(replyEphemeral("❌ Bu komut yalnızca sunucuda kullanılabilir."));
  }

  const target = targetUser || user;
  const isSelf = target.id === user.id;
  const dbUser = await findUserByDiscordId(target.id);

  const { isProtectedUser } = require("../services/profanityAutomodService");
  if (isSelf && dbUser && dbUser.isJailed && !isProtectedUser(user.id)) {
    return interaction.reply(
      replyEphemeral("❌ Hapiste olduğunuz için rollerinizi güncelleyemezsiniz veya senkronize edemezsiniz!")
    );
  }

  if (!hasRobloxLink(dbUser)) {
    logUpdate(interaction, { commandName, dbUser, notLinked: true });
    if (!isSelf) {
      return interaction.reply(
        replyEphemeral(`❌ <@${target.id}> kullanıcısının Roblox hesabı bağlı değil. \`/verify\` ile bağlaması gerekiyor.`)
      );
    }
    // TMT/BEM için tek sayfalık akış: Discord → Roblox bağla → roller otomatik güncellenir
    return interaction.reply({
      ...replyEphemeral(
        `❌ Roblox hesabın bağlı değil.\n\n` +
          `Aşağıdaki butona tıkla; sayfa sana özel açılır. Roblox ile giriş, arkadaşlık isteği veya profil kodu ile ` +
          `hesabını bağla, rollerin otomatik verilir.`
      ),
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Hesabımı Bağla").setURL(linkUrlForGuild(guild))
        )
      ]
    });
  }

  await interaction.deferReply(ephemeral ? deferEphemeral() : {});

  try {
    const member = isSelf && interaction.member && !interaction.member.partial
      ? interaction.member
      : await guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.editReply({ content: `❌ <@${target.id}> bu sunucuda bulunmuyor.` });
    }

    const result = await syncMemberInGuild(interaction.client, guild, member, dbUser);
    logUpdate(interaction, { commandName, dbUser, result });

    if (!result || !result.success) {
      return interaction.editReply({
        content: `❌ Roller senkronize edilemedi: ${result?.message || result?.error || "Bilinmeyen hata"}`,
      });
    }

    const embed = addResultFields(buildUpdateEmbed(member, result), result);
    if (commandName === "verify") {
      embed
        .setTitle("✅ Doğrulandı")
        .setDescription(
          `Roblox hesabın: **${dbUser.robloxUsername || dbUser.robloxId}**\n` +
            `Rütben değişirse rollerin otomatik güncellenir. Elle güncellemek için \`/update\`.`
        );
      return interaction.editReply({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Hesabı Değiştir").setURL(linkUrlForGuild(guild))
          )
        ]
      });
    }
    if (!isSelf) embed.setDescription(`<@${target.id}> kullanıcısının rolleri güncellendi.`);
    return interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("[RoleSync] error:", err);
    logUpdate(interaction, { commandName, dbUser, error: err.message });
    return interaction.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
  }
}

async function handleVerify(interaction) {
  return runSyncForMember(interaction, { ephemeral: true, commandName: "verify" });
}

const runningUpdateAll = new Set();

async function handleUpdateAll(interaction) {
  const { guild } = interaction;
  if (!guild) {
    return interaction.reply(replyEphemeral("❌ Bu komut yalnızca sunucuda kullanılabilir."));
  }
  if (!canManageOthers(interaction)) {
    return interaction.reply(replyEphemeral("❌ `/update all:True` için **Rolleri Yönet** yetkisi gerekiyor."));
  }
  if (runningUpdateAll.has(guild.id)) {
    return interaction.reply(replyEphemeral("⏳ Bu sunucuda zaten bir `/update all` işlemi sürüyor."));
  }

  runningUpdateAll.add(guild.id);
  await interaction.deferReply();

  try {
    const members = await guild.members.fetch();
    const allUsers = await User.find({});
    const byDiscordId = new Map();
    for (const u of allUsers) {
      if (u?.discordId && hasRobloxLink(u)) byDiscordId.set(String(u.discordId), u);
    }

    const targets = [...members.values()].filter((m) => !m.user.bot && byDiscordId.has(m.id));
    const notLinked = members.filter((m) => !m.user.bot).size - targets.length;
    const stats = { done: 0, changed: 0, unchanged: 0, failed: 0 };

    const progress = () =>
      `🔄 Roller güncelleniyor... **${stats.done}/${targets.length}**\n` +
      `✅ Değişen: ${stats.changed} • ➖ Aynı: ${stats.unchanged} • ❌ Hata: ${stats.failed}`;

    await interaction.editReply({ content: progress() });

    let lastEdit = Date.now();
    for (const member of targets) {
      try {
        const result = await syncMemberInGuild(interaction.client, guild, member, byDiscordId.get(member.id));
        if (!result?.success) stats.failed++;
        else if ((result.added?.length || 0) + (result.removed?.length || 0) > 0) stats.changed++;
        else stats.unchanged++;
      } catch (err) {
        stats.failed++;
        console.error(`[UpdateAll] ${member.id} hata:`, err.message);
      }
      stats.done++;

      if (Date.now() - lastEdit > 5000) {
        lastEdit = Date.now();
        await interaction.editReply({ content: progress() }).catch(() => {});
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("✅ Update All tamamlandı")
      .addFields(
        { name: "Taranan (bağlı)", value: String(targets.length), inline: true },
        { name: "Rolü değişen", value: String(stats.changed), inline: true },
        { name: "Değişmeyen", value: String(stats.unchanged), inline: true },
        { name: "Hata", value: String(stats.failed), inline: true },
        { name: "Roblox bağlı değil", value: String(notLinked), inline: true }
      )
      .setFooter({ text: "Sentara • Rol Senkronizasyonu" })
      .setTimestamp();

    return interaction.editReply({ content: "", embeds: [embed] });
  } catch (err) {
    console.error("[UpdateAll] error:", err);
    return interaction.editReply({ content: `❌ Toplu güncelleme hatası: ${err.message}` }).catch(() => {});
  } finally {
    runningUpdateAll.delete(guild.id);
  }
}

async function handleUpdate(interaction) {
  if (interaction.options?.getBoolean?.("all")) return handleUpdateAll(interaction);

  const targetUser = interaction.options?.getUser?.("kullanici") || interaction.user;
  if (targetUser.id !== interaction.user.id && !canManageOthers(interaction)) {
    return interaction.reply(
      replyEphemeral("❌ Başkasının rollerini güncellemek için **Rolleri Yönet** yetkisi gerekiyor.")
    );
  }
  if (targetUser.bot) {
    return interaction.reply(replyEphemeral("❌ Botların rolleri güncellenemez."));
  }
  return runSyncForMember(interaction, { ephemeral: false, commandName: "update", targetUser });
}

function formatDebugList(items, empty = "—") {
  if (!items?.length) return empty;
  return items
    .slice(0, 15)
    .map((r) => (typeof r === "string" ? r : `<@&${r.id}> \`${r.name}\``))
    .join("\n")
    .slice(0, 1024);
}

function buildDebugEmbed(targetMember, dbUser, syncPlan, { applied }) {
  const embed = new EmbedBuilder()
    .setColor(syncPlan.success ? 0xfbbf24 : 0xed4245)
    .setTitle(`🔧 Debug Update${applied ? " (uygulandı)" : " (önizleme)"}`)
    .setDescription(`Hedef: ${targetMember} (\`${targetMember.id}\`)`)
    .setTimestamp();

  if (!dbUser?.robloxId) {
    embed.addFields({
      name: "Veritabanı",
      value: "❌ Roblox bağlı değil",
      inline: false,
    });
    return embed;
  }

  embed.addFields(
    {
      name: "Roblox",
      value: `**${dbUser.robloxUsername || "?"}**\nID: \`${dbUser.robloxId}\``,
      inline: true,
    },
    {
      name: "DB",
      value: `Yetkili: ${dbUser.isAuthorized ? "✅" : "❌"}\nKayıtlı rütbe: \`${dbUser.groupRole || "—"}\``,
      inline: true,
    }
  );

  if (!syncPlan.success) {
    embed.addFields({
      name: "Hata",
      value: syncPlan.message || syncPlan.error,
      inline: false,
    });
    return embed;
  }

  const groupList = syncPlan.userGroups
    .slice(0, 12)
    .map((g) => `• ${g.group.name}: **${g.role.name}**`)
    .join("\n");

  embed.addFields(
    {
      name: "Ana grup rütbesi",
      value: `**${syncPlan.rankName}** (grup \`${MAIN_GROUP_ID}\`)`,
      inline: false,
    },
    {
      name: "Seviye / Branş",
      value: `Seviye: \`${syncPlan.tier || "—"}\`\nBranş: \`${syncPlan.branch?.departmentRoleName || "Branşsız"}\``,
      inline: true,
    },
    {
      name: "Takma ad",
      value: syncPlan.nicknameWouldChange
        ? `→ \`${syncPlan.nickname}\``
        : `\`${syncPlan.nickname || "—"}\` (değişmez)`,
      inline: true,
    },
    {
      name: "Roblox grupları",
      value: (groupList || "—").slice(0, 1024),
      inline: false,
    },
    {
      name: "Hedef roller",
      value: syncPlan.desiredNames.map((n) => `\`${n}\``).join(", ").slice(0, 1024),
      inline: false,
    },
    {
      name: "Çözümleme",
      value:
        syncPlan.resolved
          .map((r) => `${r.ok ? "✅" : "❌"} ${r.name}${r.id ? ` (${r.id})` : ""}`)
          .join("\n")
          .slice(0, 1024) || "—",
      inline: false,
    }
  );

  if (syncPlan.unresolved?.length) {
    embed.addFields({
      name: "⚠️ Eşleşmeyen",
      value: syncPlan.unresolved.map((n) => `\`${n}\``).join(", ").slice(0, 1024),
      inline: false,
    });
  }

  embed.addFields(
    {
      name: applied ? "Eklenen" : "Eklenecek",
      value: formatDebugList(applied ? syncPlan.added : syncPlan.toAdd, "None"),
      inline: true,
    },
    {
      name: applied ? "Kaldırılan" : "Kaldırılacak",
      value: formatDebugList(applied ? syncPlan.removed : syncPlan.toRemove, "None"),
      inline: true,
    },
    {
      name: "Yönetilen rol havuzu",
      value: `\`${syncPlan.managedCount}\` rol`,
      inline: true,
    }
  );

  return embed;
}

async function handleDebugUpdate(interaction) {
  const isAdmin =
    ADMIN_IDS.includes(interaction.user.id) ||
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);

  if (!isAdmin) {
    return interaction.reply(replyEphemeral("❌ Bu komut yalnızca yöneticiler içindir."));
  }

  if (!interaction.guild) {
    return interaction.reply(replyEphemeral("❌ Bu komut yalnızca sunucuda kullanılabilir."));
  }

  const targetUser = interaction.options.getUser("kullanici") || interaction.user;
  const apply = interaction.options.getBoolean("uygula") ?? false;

  await interaction.deferReply(deferEphemeral());

  try {
    const dbUser = await findUserByDiscordId(targetUser.id);
    const targetMember = await interaction.guild.members.fetch(targetUser.id);

    if (!hasRobloxLink(dbUser)) {
      const embed = buildDebugEmbed(targetMember, dbUser, { success: false }, { applied: false });
      return interaction.editReply({ embeds: [embed] });
    }

    const plan = await buildSyncPlan(
      interaction.guild,
      targetMember,
      parseInt(dbUser.robloxId, 10),
      dbUser.robloxUsername
    );

    if (apply && plan.success) {
      const result = await syncMemberRoles(
        interaction.guild,
        targetMember,
        parseInt(dbUser.robloxId, 10),
        dbUser.robloxUsername
      );

      if (result.success && dbUser.groupRole !== result.rankName) {
        dbUser.groupRole = result.rankName;
        await dbUser.save();
      }

      const embed = buildDebugEmbed(
        targetMember,
        dbUser,
        { ...plan, added: result.added, removed: result.removed, success: result.success, message: result.message },
        { applied: true }
      );
      return interaction.editReply({ embeds: [embed] });
    }

    const embed = buildDebugEmbed(targetMember, dbUser, plan, { applied: false });
    embed.setFooter({ text: "Önizleme — uygulamak için uygula: true" });

    return interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("Debug update error:", err);
    return interaction.editReply({
      content: `❌ Debug hatası: ${err.message}`,
    });
  }
}

module.exports = {
  handleVerify,
  handleUpdate,
  handleUpdateAll,
  syncMemberInGuild,
  handleDebugUpdate,
  runSyncForMember,
  buildUpdateEmbed,
};
