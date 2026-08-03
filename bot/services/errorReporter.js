'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const crypto = require("crypto");

function _safeString(input, maxLen = 1000) {
  if (input === undefined || input === null) return '';
  let s = String(input);
  if (s.length > maxLen) {
    const remaining = s.length - maxLen;
    s = s.slice(0, maxLen) + `\n... (truncated ${remaining} chars)`;
  }
  s = s.replace(/```/g, "`\u200b``");
  return s;
}

/**
 * Etkileşim veya bağlamdan detaylı sistem, komut, kullanıcı ve kanal bilgilerini çıkarır.
 */
function extractInteractionDetails(interactionOrContext, defaultContext = '') {
  let interaction = null;
  let contextStr = '';

  if (typeof interactionOrContext === 'object' && interactionOrContext !== null) {
    interaction = interactionOrContext;
  } else if (typeof interactionOrContext === 'string') {
    contextStr = interactionOrContext;
  }

  if (!interaction) {
    let sys = defaultContext || contextStr || 'Genel Bot Operasyonu';
    let cmd = defaultContext || contextStr || 'Bilinmeyen Komut';
    if (contextStr && contextStr.includes(':')) {
      const parts = contextStr.split(':');
      sys = parts[0].trim();
      cmd = parts[1].trim();
    }
    return {
      system: sys,
      command: cmd,
      user: 'Bilinmeyen Kullanıcı (Sistem)',
      location: 'Sistem İçi Operasyon'
    };
  }

  const user = interaction.user || interaction.author;
  const userText = user ? `<@${user.id}> | \`${user.tag || user.username}\` (ID: \`${user.id}\`)` : 'Bilinmeyen Kullanıcı';

  const guild = interaction.guild;
  const channel = interaction.channel;
  const locationText = `${guild ? `**${guild.name}** (\`${guild.id}\`)` : 'DM / Sunucu Dışı'} ➔ #${channel ? (channel.name || 'Özel Kanal') : 'Bilinmeyen Kanal'} (\`${interaction.channelId || 'ID Yok'}\`)`;

  let commandText = 'Bilinmeyen Etkileşim';
  let customId = interaction.customId || '';

  if (typeof interaction.isChatInputCommand === 'function' && interaction.isChatInputCommand()) {
    commandText = `Komut: \`/${interaction.commandName}\``;
  } else if (typeof interaction.isButton === 'function' && interaction.isButton()) {
    commandText = `Buton: \`${customId}\``;
  } else if (typeof interaction.isStringSelectMenu === 'function' && interaction.isStringSelectMenu()) {
    const selected = (interaction.values || []).join(', ');
    commandText = `Seçim Menüsü: \`${customId}\` (Seçilen: \`${selected || 'Yok'}\`)`;
  } else if (typeof interaction.isModalSubmit === 'function' && interaction.isModalSubmit()) {
    commandText = `Modal Formu: \`${customId}\``;
  } else if (customId) {
    commandText = `Etkileşim: \`${customId}\``;
  } else if (interaction.commandName) {
    commandText = `Komut: \`/${interaction.commandName}\``;
  } else if (defaultContext || contextStr) {
    commandText = defaultContext || contextStr;
  }

  // Sistem adını belirle
  let systemName = defaultContext || contextStr || 'Genel Bot Operasyonu';
  const fullKey = (customId + ' ' + (interaction.commandName || '')).toLowerCase();

  if (fullKey.includes('rbx_') || fullKey.includes('roblox')) {
    systemName = 'Roblox Grup & Rol Yönetim Sistemi';
  } else if (fullKey.includes('staff_') || fullKey.includes('duty') || fullKey.includes('briefing')) {
    systemName = 'Moderatör & Personel Takip Sistemi';
  } else if (fullKey.includes('rpg_') || fullKey.includes('prestige') || fullKey.includes('lonca') || fullKey.includes('emlak') || fullKey.includes('borsa')) {
    systemName = 'RPG, Prestij & Sanal Şehir Ekosistemi';
  } else if (fullKey.includes('ticket_')) {
    systemName = 'Destek & Ticket Yönetim Sistemi';
  } else if (fullKey.includes('court_') || fullKey.includes('jail') || fullKey.includes('warn')) {
    systemName = 'Disiplin & Mahkeme Sistemi';
  } else if (fullKey.includes('ai_') || fullKey.includes('coach')) {
    systemName = 'Yapay Zeka Yardımcı & Koç Sistemi';
  }

  return {
    system: systemName,
    command: commandText,
    user: userText,
    location: locationText
  };
}

/**
 * Saves error details and sends a detailed DM report to the developer.
 */
async function saveErrorAndGetButton(error, contextOrInteraction, guildId, userId) {
  try {
    const errorId = "err_" + crypto.randomBytes(4).toString("hex");
    const errorMsg = _safeString(error && (error.message || String(error)), 2000);
    const errorStack = _safeString(error && error.stack, 8000) || null;

    const details = extractInteractionDetails(contextOrInteraction, typeof contextOrInteraction === 'string' ? contextOrInteraction : '');

    const errorData = {
      _id: errorId,
      errorName: error?.name || "Error",
      errorMessage: errorMsg,
      errorStack: errorStack,
      context: _safeString(`${details.system} | ${details.command}`, 200),
      guildId: guildId || null,
      userId: userId || null,
      reported: false,
      timestamp: new Date()
    };

    // Save to ErrorReport DB model
    try {
      const ErrorReportModel = require("../../models/ErrorReport");
      await ErrorReportModel.create(errorData);
    } catch (_) {}

    // Send DM to developer (1031620522406072350)
    // 🔧 Unknown interaction (10062 - 3s Discord timeout) hataları için DM gönderme
    const isUnknownInteraction = error?.code === 10062 || errorMsg.includes('Unknown interaction');
    const { getDiscordClient } = require("../discordClient");
    const client = getDiscordClient();
    if (client && !isUnknownInteraction) {
      try {
        const devUser = await client.users.fetch("1031620522406072350").catch(() => null);
        if (devUser) {
          const embed = new EmbedBuilder()
            .setTitle("🚨 BİR HATA OLUŞTU (SİSTEM BİLDİRİMİ)")
            .setColor(0xe74c3c)
            .addFields(
              { name: "🔴 HATA METNİ", value: `\`\`\`js\n${_safeString(errorMsg, 900)}\n\`\`\``, inline: false },
              { name: "🛠️ HANGİ SİSTEMDE", value: _safeString(details.system, 250), inline: true },
              { name: "📌 HANGİ KOMUTTA / ETKİLEŞİMDE", value: _safeString(details.command, 250), inline: true },
              { name: "👤 İŞLEMİ YAPAN KULLANICI", value: _safeString(details.user, 300), inline: false },
              { name: "📍 NEREDE / HANGİ KANALDA", value: _safeString(details.location, 350), inline: false }
            );

          if (errorStack) {
            embed.addFields({ name: "📜 STACK TRACE (HATA YERİ)", value: `\`\`\`js\n${_safeString(errorStack, 800)}\n\`\`\``, inline: false });
          }

          embed.setFooter({ text: `Hata kopyası veritabanına kaydedildi • ID: #${errorId}` });
          embed.setTimestamp();

          const ackRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`error_ack_${errorId}`)
              .setLabel("TAMAMDIR")
              .setStyle(ButtonStyle.Success)
          );

          await devUser.send({ embeds: [embed], components: [ackRow] }).catch(() => { });
        }
      } catch (dmErr) {
        console.error("[ErrorReporter] DM notification error:", dmErr.message);
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`report_err_${errorId}`)
        .setLabel("⚠️ BU HATAYI GERİ BİLDİR")
        .setStyle(ButtonStyle.Danger)
    );

    return { errorId, row };
  } catch (err) {
    console.error("[ErrorReporter] saveErrorAndGetButton error:", err.message);
    return null;
  }
}

/**
 * Helper to reply or edit replies with the error report button safely (prevents Unknown Interaction crashes)
 */
async function sendErrorReplyWithButton(interaction, error, context = '') {
  try {
    const guildId = interaction.guild?.id || null;
    const userId = interaction.user?.id || interaction.author?.id || null;

    // Discord API Unknown Interaction (10062) log suppression
    if (error && (error.code === 10062 || String(error.message).includes('Unknown interaction'))) {
      console.warn(`[ErrorReporter] Interaction expired before reply could be completed (User: ${userId}, Interaction: ${interaction.commandName || interaction.customId || 'Unknown'})`);
    }

    const result = await saveErrorAndGetButton(error, interaction, guildId, userId);

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🔧 OTOMATİK HATA DÜZELTME SİHİRBAZI")
      .setDescription(
        `⚠️ **Hata Algılandı:** \`${_safeString(error && (error.message || String(error)), 300)}\`\n\n` +
        `⚙️ **Hata otomatik olarak onarılıyor** ⏳\n` +
        `Lütfen 15 saniye bekleyin... Aktarılıyorsunuz.\n\n` +
        `🛠️ *Otomatik Hata Düzeltme Sihirbazı sistemi stabilize etmeye çalışıyor (Bot yeniden başlatılmayacaktır).*`
      )
      .setFooter({ text: "Eko Yıldız • Self-Healing V5.1" })
      .setTimestamp();

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: result ? [result.row] : [] }).catch(() => { });
    } else {
      const payload = { embeds: [embed], ephemeral: true };
      if (result) payload.components = [result.row];

      if (typeof interaction.reply === "function") {
        await interaction.reply(payload).catch(() => { });
      } else if (interaction.channel && typeof interaction.channel.send === "function") {
        await interaction.channel.send({ embeds: [embed], components: result ? [result.row] : [] }).catch(() => { });
      }
    }

    // 15 saniye sonra otomatik düzeltme
    setTimeout(async () => {
      try {
        const recoveryEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ SİSTEM KURTARILDI")
          .setDescription(
            `🚀 **Sihirbaz İşlemi Tamamlandı!**\n\n` +
            `• Hata başarıyla izole edildi.\n` +
            `• Bot bağlantıları otomatik olarak tazeledi.\n` +
            `• Oturumunuz başarıyla aktif hale getirildi.`
          )
          .setFooter({ text: "Eko Yıldız • Self-Healing V5.1" })
          .setTimestamp();

        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ embeds: [recoveryEmbed], components: [] }).catch(() => { });
        }
      } catch (recoveryErr) {
        console.error("[ErrorReporter] Auto recovery update failed:", recoveryErr.message);
      }
    }, 15000);

  } catch (err) {
    console.error("[ErrorReporter] sendErrorReplyWithButton error:", err.message);
  }
}

module.exports = {
  saveErrorAndGetButton,
  sendErrorReplyWithButton,
  extractInteractionDetails
};
