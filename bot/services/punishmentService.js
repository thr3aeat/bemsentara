'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

const User = require('../../models/User');
const { jailUser, releaseUser } = require('./jailService');

const YAVRU_DINAZOR_ROLE_ID = '1518692402884378825';
const MOD_CEZA_LOG_CHANNEL_ID = '1518693023934844959';

/**
 * Log action to Moderator Punishment Log channel (1518693023934844959)
 */
async function sendModLog(guild, embed) {
  try {
    if (!guild) return;
    const channel = await guild.channels.fetch(MOD_CEZA_LOG_CHANNEL_ID).catch(() => null)
      || guild.channels.cache.get(MOD_CEZA_LOG_CHANNEL_ID)
      || guild.channels.cache.find(c => c.name.includes('ceza') || c.name.includes('mod-log'));
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] }).catch(() => {});
    }
  } catch (err) {
    console.warn('[punishmentService] ModLog send error:', err.message);
  }
}

/**
 * ⚠️ Uyarı Verme Komutu
 */
async function issueWarning(interactionOrMessage, targetUser, reason = 'Kural İhlali', executorUser) {
  const guild = interactionOrMessage.guild;
  if (!guild) return;

  const isInteraction = Boolean(interactionOrMessage.isCommand || interactionOrMessage.isChatInputCommand);

  let dbUser = await User.findOne({ discordId: targetUser.id });
  if (!dbUser) {
    dbUser = new User({ discordId: targetUser.id, discordUsername: targetUser.tag || targetUser.username });
  }

  dbUser.warnCount = (dbUser.warnCount || 0) + 1;
  const currentWarn = dbUser.warnCount;
  const warnId = `WARN-${Math.floor(100000 + Math.random() * 900000)}`;

  if (!dbUser.warnings) dbUser.warnings = [];
  dbUser.warnings.push({
    warnId,
    reason,
    issuedBy: executorUser.tag || executorUser.username,
    date: new Date(),
    signed: false
  });

  await dbUser.save();

  // Güven ve Performans Puanı Güncelleme (Uyarı)
  try {
    const { updateTrustScore, addModPoints } = require("./security/trustScoreService");
    await updateTrustScore(targetUser.id, -5.0, `Disiplin Uyarısı Alındı (${reason})`, executorUser.id, interactionOrMessage.client);
    await addModPoints(executorUser.id, 2.5, `Mod İşlem: Kullanıcı Uyarısı (${targetUser.username})`);
  } catch (errScore) {
    console.error("[issueWarning] Puan güncelleme hatası:", errScore.message);
  }

  const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

  // 3/3 Warning Threshold -> Auto Jail!
  if (currentWarn >= 3) {
    dbUser.warnCount = 0;
    await dbUser.save();

    // Call Jail System
    await jailUser(guild, targetUser.id, `3/3 UYARI SINIRINA ULAŞILDI: ${reason}`, 60, 500);

    // Remove Yavru Dinazor role
    if (targetMember && targetMember.roles.cache.has(YAVRU_DINAZOR_ROLE_ID)) {
      await targetMember.roles.remove(YAVRU_DINAZOR_ROLE_ID, '3/3 Uyarı Hapsi sebebiyle Yavru Dinazor rolü alındı.').catch(() => {});
    }

    const autoJailEmbed = new EmbedBuilder()
      .setTitle('🚨 3/3 UYARI LİMİTİ — OTOMATİK HAPİS İNFAZI')
      .setDescription(
        `👤 **Cezalandırılan Üye:** <@${targetUser.id}>\n` +
        `👮 **Yetkili:** <@${executorUser.id}>\n` +
        `📝 **Son Uyarı Gerekçesi:** ${reason}\n\n` +
        `⚠️ Üye **3/3 Uyarı** sınırını aştığı için uyarıları sıfırlanmış ve **#kodos Hapishanesine** gönderilmiştir!`
      )
      .setColor(0xed4245)
      .setTimestamp();

    const responsePayload = { embeds: [autoJailEmbed] };

    if (isInteraction) {
      await interactionOrMessage.reply(responsePayload).catch(() => {});
    } else {
      await interactionOrMessage.channel.send(responsePayload).catch(() => {});
    }

    await sendModLog(guild, autoJailEmbed);
    return;
  }

  // 1/3 or 2/3 Warning with Interactive Contract
  const warnEmbed = new EmbedBuilder()
    .setTitle(`📜 RESMİ DİSİPLİN UYARISI & SÖZLEŞMESİ (${currentWarn}/3)`)
    .setDescription(
      `Sayın <@${targetUser.id}>,\n\n` +
      `Sunucu kurallarını ihlal ettiğiniz gerekçesiyle yetkili <@${executorUser.id}> tarafından hakkınızda **Resmi Disiplin Uyarısı** düzenlenmiştir.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 **İhlal Gerekçesi:** ${reason}\n` +
      `📊 **Güncel Uyarı Durumunuz:** **${currentWarn} / 3**\n` +
      `🆔 **Uyarı Kod:** \`${warnId}\`\n\n` +
      `⚠️ *Uyarı sayınız 3/3'e ulaştığında otomatik olarak hapishaneye gönderileceksiniz.*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👇 **Aşağıdaki buton ile uyarı şartlarını ve kural yükümlülüklerini İMZALAYIP KABUL EDİN.**`
    )
    .setColor(0xe67e22)
    .setFooter({ text: 'Eko Yıldız Adalet & Disiplin Kurulu' })
    .setTimestamp();

  const warnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`warn_sign_contract_${targetUser.id}_${warnId}`)
      .setLabel('📜 UYARI SÖZLEŞMESİNİ İMZALA & KABUL ET')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`warn_appeal_${targetUser.id}_${warnId}`)
      .setLabel('🛡️ UYARIYA İTİRAZ ET')
      .setStyle(ButtonStyle.Secondary)
  );

  const channelPayload = { content: `<@${targetUser.id}>`, embeds: [warnEmbed], components: [warnRow] };

  if (isInteraction) {
    await interactionOrMessage.reply(channelPayload).catch(() => {});
  } else {
    await interactionOrMessage.channel.send(channelPayload).catch(() => {});
  }

  // Send DM to target user with interactive contract buttons
  await targetUser.send({
    content: `⚠️ **RESMİ UYARI BİLDİRİMİ!** Sunucuda hakkınızda resmi uyarı düzenlendi.`,
    embeds: [warnEmbed],
    components: [warnRow]
  }).catch(() => {});

  await sendModLog(guild, warnEmbed);
}

/**
 * 🔒 Hapis Cezası Komutu
 */
async function issueJail(interactionOrMessage, targetUser, durationMinutes = 60, reason = 'Kural İhlali', executorUser) {
  const guild = interactionOrMessage.guild;
  if (!guild) return;

  const isInteraction = Boolean(interactionOrMessage.isCommand || interactionOrMessage.isChatInputCommand);

  // Call Jail Service
  const jailed = await jailUser(guild, targetUser.id, reason, durationMinutes, 500);
  if (!jailed) {
    const errPayload = { content: `❌ <@${targetUser.id}> kullanıcı hapishaneye gönderilemedi.`, ephemeral: true };
    if (isInteraction) return interactionOrMessage.reply(errPayload);
    return interactionOrMessage.channel.send(errPayload);
  }

  // Strip Yavru Dinazor Role
  const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
  if (targetMember && targetMember.roles.cache.has(YAVRU_DINAZOR_ROLE_ID)) {
    await targetMember.roles.remove(YAVRU_DINAZOR_ROLE_ID, 'Hapis cezası sebebiyle Yavru Dinazor rolü alındı.').catch(() => {});
  }

  // Güven ve Performans Puanı Güncelleme (Hapis)
  try {
    const { updateTrustScore, addModPoints } = require("./security/trustScoreService");
    await updateTrustScore(targetUser.id, -30.0, `Hapse Atıldı (Süre: ${durationMinutes} Dk, Sebep: ${reason})`, executorUser.id, interactionOrMessage.client);
    await addModPoints(executorUser.id, 2.5, `Mod İşlem: Hapis İnfazı (${targetUser.username})`);
  } catch (errScore) {
    console.error("[issueJail] Puan güncelleme hatası:", errScore.message);
  }

  const jailEmbed = new EmbedBuilder()
    .setTitle('🔒 RESMİ İNFAZ TAAHHÜTNAMESİ VE HAPİS CEZASI')
    .setDescription(
      `Sayın <@${targetUser.id}>,\n\n` +
      `Yetkili <@${executorUser.id}> kararıyla **#kodos Hapishanesine** sevk edildiniz.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 **Cezalandırma Sebebi:** ${reason}\n` +
      `⏳ **Hapis Süresi:** **${durationMinutes} Dakika**\n` +
      `💰 **Kefalet Miktarı:** **500 Coin**\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👇 **Aşağıdaki buton ile Hapis Taahhütnamesini imzalayarak cezanızı başlatabilir veya Avukat talep edebilirsiniz.**`
    )
    .setColor(0x7f8c8d)
    .setFooter({ text: 'Eko Yıldız İnfaz ve Islah Kurumu' })
    .setTimestamp();

  const jailRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`jail_sign_contract_${targetUser.id}`)
      .setLabel('📜 HAPİS TAAHHÜTNAMESİNİ İMZALA')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`jail_request_lawyer_${targetUser.id}`)
      .setLabel('💼 AVUKAT / MAHKEME TALEP ET')
      .setStyle(ButtonStyle.Primary)
  );

  const payload = { content: `<@${targetUser.id}>`, embeds: [jailEmbed], components: [jailRow] };

  if (isInteraction) {
    await interactionOrMessage.reply(payload).catch(() => {});
  } else {
    await interactionOrMessage.channel.send(payload).catch(() => {});
  }

  await targetUser.send({
    content: `🔒 **HAPİSE GÖNDERİLDİNİZ!** Lütfen taahhütnameyi imzalayın.`,
    embeds: [jailEmbed],
    components: [jailRow]
  }).catch(() => {});

  await sendModLog(guild, jailEmbed);
}

/**
 * 🔓 Hapisten Çıkarma Komutu
 */
async function issueUnjail(interactionOrMessage, targetUser, executorUser) {
  const guild = interactionOrMessage.guild;
  if (!guild) return;

  const isInteraction = Boolean(interactionOrMessage.isCommand || interactionOrMessage.isChatInputCommand);

  const released = await releaseUser(guild, targetUser.id);
  if (!released) {
    const errPayload = { content: `❌ <@${targetUser.id}> kullanıcısının aktif hapis kaydı bulunamadı.`, ephemeral: true };
    if (isInteraction) return interactionOrMessage.reply(errPayload);
    return interactionOrMessage.channel.send(errPayload);
  }

  const unjailEmbed = new EmbedBuilder()
    .setTitle('🔓 HAPİS CEZASI KALDIRILDI & TAHLİYE')
    .setDescription(
      `Sayın <@${targetUser.id}>,\n\n` +
      `Yetkili <@${executorUser.id}> kararıyla **#kodos Hapishanesinden** tahliye edildiniz!\n` +
      `Rolleriniz başarıyla iade edilmiştir.`
    )
    .setColor(0x2ecc71)
    .setTimestamp();

  const payload = { embeds: [unjailEmbed] };

  if (isInteraction) {
    await interactionOrMessage.reply(payload).catch(() => {});
  } else {
    await interactionOrMessage.channel.send(payload).catch(() => {});
  }

  await targetUser.send({ embeds: [unjailEmbed] }).catch(() => {});
  await sendModLog(guild, unjailEmbed);
}

module.exports = {
  issueWarning,
  issueJail,
  issueUnjail
};
