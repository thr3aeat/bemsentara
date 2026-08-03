'use strict';

const { EmbedBuilder } = require('discord.js');

// ── Log kanalı (Müttefik Orduları sunucusu) ───────────────────────────────────
const BUTTON_LOG_GUILD_ID   = '1483482948320891074';
const BUTTON_LOG_CHANNEL_ID = '1514682098819137727';

// ── Discord loading GIF (Tenor / Discord CDN) ─────────────────────────────────
// Kullanıcının imgur görselini taklit eden dönen loading animasyonu
const LOADING_GIF_URL = 'https://i.imgur.com/llF5iyg.gif';

// ── İpuçları Listesi ──────────────────────────────────────────────────────────
const TIPS = [
  '💡 Moderatörler her zaman kurallara uygun davranmalıdır.',
  '💡 Şüpheli davranışları her zaman yetkililere bildirin.',
  '💡 Sunucu kurallarını düzenli aralıklarla okumanız önerilir.',
  '💡 Ban itirazları sistemli bir şekilde değerlendirilir.',
  '💡 Ticket oluştururken sorununuzu detaylı açıklayın.',
  '💡 Sesli kanallarda saygılı olmayı unutmayın.',
  '💡 DM reklamı yapanları yetkililere bildirin.',
  '💡 Moderasyon kararları genellikle 24 saat içinde sonuçlanır.',
  '💡 Destek talebinizi oluştururken kanıt eklemeyi unutmayın.',
  '💡 Hızlı yardım için ticket açmak yerine moderatörlere başvurun.',
  '💡 Sunucumuza katkı sağladığınız için teşekkürler!',
  '💡 Rütbe değişikliklerinde sabırlı olun, işlem biraz sürebilir.',
  '💡 Tüm işlemler güvenlik sistemimiz tarafından kaydedilmektedir.',
  '💡 Anlaşmazlıklarda sakin kalmak her zaman daha iyi sonuç verir.',
  '💡 Sistemimiz 7/24 aktif olarak çalışmaktadır.',
];

function getRandomTip() {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

// ── Roblox rütbe değiştirme buton prefix'leri (hariç tutulacak) ───────────────
const EXCLUDED_PREFIXES = [
  'roblox_rank_select',
  'rbx_btn_',
  'rbx_abuse_',
  'rbx_appr_',
  'rbx_mod_',
];

function isExcluded(customId) {
  return EXCLUDED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// ── Önemli (log atılacak) buton prefix'leri ───────────────────────────────────
const IMPORTANT_PREFIXES = [
  'ban_',
  'unban_',
  'kick_',
  'mute_',
  'timeout_',
  'mod_confirm_',
  'mod_appr_',
  'modappr_',
  'court_',
  'staff_claim_',
  'school_confirm_',
  'ticket_close',
  'ticket_claim',
  'ticket_escalate',
  'appeal_',
  'verify_',
  'blacklist_',
  'jail_',
  'leverage_',
  'investigation_',
  'interrogation_',
  'unit_',
  'rollcall_',
  'punish_',
  'epo_',
  'reklam_',
  'voice_',
];

function isImportant(customId) {
  if (isExcluded(customId)) return false;
  return IMPORTANT_PREFIXES.some(prefix => customId.startsWith(prefix));
}

/**
 * Önemli bir butona basıldığında:
 *  1. Log kanalına anlık embed at
 *  2. Interaction'a yükleniyor embed'i ile deferReply yap
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {boolean} true = loading gösterildi, false = önemsiz buton
 */
async function handleButtonLoading(interaction) {
  if (!isImportant(interaction.customId)) return false;

  const now = Math.floor(Date.now() / 1000);
  const guild = interaction.guild;
  const channel = interaction.channel;
  const user = interaction.user;

  // ── 1. Log kanalına anlık bildirim gönder ─────────────────────────────────
  try {
    const logGuild = interaction.client.guilds.cache.get(BUTTON_LOG_GUILD_ID) ||
      await interaction.client.guilds.fetch(BUTTON_LOG_GUILD_ID).catch(() => null);

    if (logGuild) {
      const logChannel = logGuild.channels.cache.get(BUTTON_LOG_CHANNEL_ID) ||
        await logGuild.channels.fetch(BUTTON_LOG_CHANNEL_ID).catch(() => null);

      if (logChannel?.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('🖱️ BUTON ETKİLEŞİMİ')
          .addFields(
            { name: '👤 Kullanan', value: `${user.toString()} (\`${user.tag}\`)`, inline: true },
            { name: '🆔 Kullanıcı ID', value: `\`${user.id}\``, inline: true },
            { name: '📍 Sunucu', value: guild ? `**${guild.name}** (\`${guild.id}\`)` : 'DM', inline: true },
            { name: '💬 Kanal', value: channel ? `${channel.toString()}` : 'Bilinmiyor', inline: true },
            { name: '🔘 Buton ID', value: `\`${interaction.customId}\``, inline: false },
            { name: '🕐 Zaman', value: `<t:${now}:F>`, inline: true }
          )
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: 'Buton Log Sistemi • Anlık İzleme' })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }
  } catch (_) {}

  // ── 2. Loading embed'i ile deferReply yap ─────────────────────────────────
  try {
    if (!interaction.deferred && !interaction.replied) {
      const loadingEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('⏳ İşlem Hazırlanıyor...')
        .setDescription(
          '> Lütfen bekleyin, isteğiniz işleme alındı.\n\n' +
          `${getRandomTip()}`
        )
        .setImage(LOADING_GIF_URL)
        .setFooter({ text: 'Bu mesaj kısa süre içinde güncellenecektir.' })
        .setTimestamp();

      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ embeds: [loadingEmbed] });
    }
  } catch (_) {}

  return true;
}

module.exports = {
  handleButtonLoading,
  isImportant,
  isExcluded,
  getRandomTip,
  BUTTON_LOG_CHANNEL_ID,
  BUTTON_LOG_GUILD_ID
};
