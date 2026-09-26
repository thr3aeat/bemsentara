'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder
} = require('discord.js');

const AutomodAppeal = require('../../models/AutomodAppeal');
const { chatWithAI } = require('./aiService');
const { sendTelegramAlert } = require('./telegramService');
const { getAutomodIncident, forgiveAutomodIncident } = require('./profanityAutomodService');
const UserTrustScore = require('../../models/UserTrustScore');
const FrogLevel = require('../../models/FrogLevel');
const { updateTrustScore } = require('./security/trustScoreService');

const MOD_APPROVAL_CHANNEL_ID = '1518684031275761719';
const MAIN_GUILD_ID = '1367646464804655104';
const OVERDUE_THRESHOLD_MS = 15 * 60 * 1000; // 15 dakika

/**
 * Benzersiz itiraz ID'si üretir (Örn: ITR-172740-A8F2)
 */
function generateAppealId() {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString(36).substring(4).toUpperCase();
  return `ITR-${time}-${rand}`;
}

/**
 * Kullanıcı itirazını işler:
 * 1. Olay bilgilerini ve kullanıcı geçmişini toplar
 * 2. EkoAI'ya analiz ettirir
 * 3. EkoAI kabul ederse cezayı kaldırır
 * 4. EkoAI reddederse Discord yetkili kanalına (1518684031275761719) V2 accent colorsuz butonlu kart gönderir
 */
async function submitAutomodAppeal({ incidentId, userId, appealMessage, client }) {
  if (!userId || !appealMessage || typeof appealMessage !== 'string' || appealMessage.trim() === '') {
    return { success: false, error: 'Kullanıcı ID ve itiraz mesajı zorunludur.' };
  }

  const cleanAppealMsg = appealMessage.trim().substring(0, 1000);
  const incident = incidentId ? getAutomodIncident(incidentId) : null;

  // Kullanıcı ve sunucu bilgilerini topla
  let username = 'Bilinmeyen Kullanıcı';
  let userTag = '';
  let joinedAt = null;
  let totalMessages = 0;
  let userLevel = 0;
  let trustScore = 75;

  const guild = client.guilds.cache.get(MAIN_GUILD_ID)
    || (incident?.guildId ? client.guilds.cache.get(incident.guildId) : null)
    || client.guilds.cache.first();

  let member = null;
  if (guild) {
    member = await guild.members.fetch(userId).catch(() => null);
    if (member) {
      username = member.user.username;
      userTag = member.user.tag || member.user.username;
      joinedAt = member.joinedAt;
    }
  }

  // Veritabanı istatistiklerini çek
  try {
    const trustDoc = await UserTrustScore.findOne({ userId }).lean().catch(() => null);
    if (trustDoc && typeof trustDoc.score === 'number') {
      trustScore = trustDoc.score;
    }

    const frogDoc = await FrogLevel.findOne({ userId }).lean().catch(() => null);
    if (frogDoc) {
      totalMessages = frogDoc.totalMessages || 0;
      userLevel = frogDoc.level || 0;
    }
  } catch (_) {}

  const blockedContent = incident?.content || 'Belirtilmemiş veya silinmiş mesaj';
  const matchedWord = incident?.matched || incident?.tierName || 'Küfür/Argo Filtresi';
  const severity = incident?.severity || 'STANDART';
  const timeoutDurationMs = incident?.timeoutDurationMs || null;
  const channelId = incident?.channelId || (guild?.systemChannelId || '1518684031275761719');

  const appealId = generateAppealId();

  // ── 1. EKOAI İLE İLK İNCELEME ──────────────────────────────────────────
  const joinDurationText = joinedAt
    ? `${Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24))} gün`
    : 'Bilinmiyor';

  const aiPrompt = `Sen EkoYıldız Topluluğu Başsavcısı ve Güvenlik Yapay Zekası EKOai'sin.
Bir kullanıcı küfür/argo automod filtresine takılmış ve İtiraz Merkezi üzerinden itirazda bulunmuştur.

GÖREVİN:
Kullanıcının yazdığı itiraz mesajını, yaptığı kural ihlalini ve sunucu içerisindeki genel geçmiş hareketlerini / güvenilirliğini objektif, adil ve sağduyulu bir şekilde analiz et.

KULLANICI DOSYASI:
- Kullanıcı Adı: ${username} (ID: ${userId})
- Sunucuda Kalma Süresi: ${joinDurationText}
- Toplam Mesaj Sayısı: ${totalMessages} (Kurbağa Seviyesi: ${userLevel})
- Güven Puanı: ${trustScore}/100
- İhlal Edilen Mesaj İçeriği: "${blockedContent}"
- Filtreye Takılan Kelime/Kalıp: "${matchedWord}" (Ağırlık: ${severity})
- Kullanıcının İtiraz Savunması: "${cleanAppealMsg}"

DEĞERLENDİRME KRİTERLERİ:
1. Kullanıcının yazdığı küfür gerçekten birine yönelik ağır bir hakaret/sövgü mü, yoksa argo/şakalaşma/arkadaş arası veya masum bir yanlış anlama/harf hatası mı?
2. Kullanıcının itiraz savunması samimi, mantıklı ve saygılı mı?
3. Kullanıcının sunucudaki geçmişi (mesaj sayısı, güven puanı) temiz ve aktif bir üye olduğunu gösteriyor mu?
4. Eğer açıkça ağır dini/milli küfür, ailevi ağır hakaret veya art niyetli toksiklik varsa KESİNLİKLE REDDET.
5. Eğer yanlış pozitif, şakalaşma, masum tepki veya ilk kez olan bir argo için geçerli bir izahat sunulmuşsa KABUL ET.

Lütfen cevabını YALNIZCA şu formatta ver:
KARAR: [KABUL veya RED]
GEREKÇE: [Kullanıcıya ve yetkililere yönelik 2-3 cümlelik net açıklama]`;

  let aiDecision = 'REJECTED';
  let aiReasoning = 'Standart EkoAI incelemesinde ihlalin kural dışı olduğu tespit edildi.';

  try {
    const aiResponse = await chatWithAI(aiPrompt, 'EkoYıldız Başsavcısı EKOai');
    if (aiResponse) {
      aiReasoning = aiResponse;
      const upper = aiResponse.toUpperCase();
      if (upper.includes('KARAR: KABUL') || (upper.includes('KABUL') && !upper.includes('RED'))) {
        aiDecision = 'APPROVED';
      } else {
        aiDecision = 'REJECTED';
      }

      // Gerekçeyi temizle
      const matchGerekce = aiResponse.match(/GEREKÇE:\s*([\s\S]+)/i);
      if (matchGerekce && matchGerekce[1]) {
        aiReasoning = matchGerekce[1].trim();
      }
    }
  } catch (aiErr) {
    console.warn('[AutomodAppealService] EkoAI inceleme hatası:', aiErr.message);
    aiDecision = 'REJECTED';
    aiReasoning = 'Yapay zeka analiz servisinden yanıt alınamadığı için dosya doğrudan yetkili onayına sevk edildi.';
  }

  // ── 2. KARAR DURUMUNA GÖRE İŞLEM ──────────────────────────────────────
  let appealStatus = 'pending_ai';
  let discordMessageId = null;

  if (aiDecision === 'APPROVED') {
    // A. EkoAI KABUL ETTİ
    appealStatus = 'approved_by_ai';

    // Cezayı kaldır
    await applyAppealApproval({
      guild,
      userId,
      incidentId,
      reason: `EkoAI İtiraz Kabulü: ${aiReasoning}`
    });

    // Kullanıcıya DM bilgilendirmesi
    if (member) {
      member.send({
        content: `🎉 **İtirazınız EkoAI Tarafından KABUL EDİLDİ!**\n\n` +
          `📝 **Dosya:** \`${appealId}\`\n` +
          `🤖 **EkoAI Gerekçesi:** ${aiReasoning}\n` +
          `✨ Hesabınızdaki kısıtlama kaldırıldı ve güven puanınız telafi edildi. İyi sohbetler!`
      }).catch(() => {});
    }
  } else {
    // B. EkoAI REDDETTİ -> Yetkili Kanalına Gönder (1518684031275761719)
    appealStatus = 'rejected_by_ai_pending_mod';

    const sentMessage = await sendAppealToDiscordStaffChannel({
      client,
      appealId,
      userId,
      username,
      blockedContent,
      matchedWord,
      appealMessage: cleanAppealMsg,
      aiReasoning,
      trustScore,
      totalMessages,
      userLevel,
      channelId
    });

    if (sentMessage) {
      discordMessageId = sentMessage.id;
    }

    // Kullanıcıya DM bilgilendirmesi (isteğe bağlı)
    if (member) {
      member.send({
        content: `ℹ️ **İtirazınız Ön İncelemeden Geçti:**\n\n` +
          `🤖 EkoAI ön değerlendirmesi sonucu dosyanız onaylanmadı ancak **insan yetkililerin nihai kararı için** yetkili inceleme kuruluna aktarıldı.\n` +
          `📌 **Dosya No:** \`${appealId}\`\n` +
          `💬 **EkoAI Gözlemi:** ${aiReasoning}\n` +
          `⏳ Yetkililerimiz en kısa sürede dosyanızı değerlendirecektir.`
      }).catch(() => {});
    }
  }

  // ── 3. VERİTABANINA KAYDET ───────────────────────────────────────────
  let appealRecord = null;
  try {
    appealRecord = await AutomodAppeal.create({
      appealId,
      incidentId: incidentId || 'UNKNOWN',
      guildId: guild ? guild.id : MAIN_GUILD_ID,
      channelId,
      userId,
      username,
      userTag,
      blockedContent,
      matchedWord,
      severity,
      timeoutDurationMs,
      appealMessage: cleanAppealMsg,
      aiReviewed: true,
      aiDecision,
      aiReasoning,
      aiReviewedAt: new Date(),
      status: appealStatus,
      discordMessageId,
      discordChannelId: MOD_APPROVAL_CHANNEL_ID
    });
  } catch (dbErr) {
    console.warn('[AutomodAppealService] Veritabanı kayıt hatası (fallback memory):', dbErr.message);
  }

  return {
    success: true,
    appealId,
    status: appealStatus,
    aiDecision,
    aiReasoning,
    appealRecord
  };
}

/**
 * Discord Yetkili Kanalına (1518684031275761719) Components V2 (accent colorsuz) kartı gönderir
 */
async function sendAppealToDiscordStaffChannel({
  client,
  appealId,
  userId,
  username,
  blockedContent,
  matchedWord,
  appealMessage,
  aiReasoning,
  trustScore,
  totalMessages,
  userLevel,
  channelId
}) {
  try {
    const staffChannel = await client.channels.fetch(MOD_APPROVAL_CHANNEL_ID).catch(() => null);
    if (!staffChannel || !staffChannel.isTextBased()) {
      console.error(`[AutomodAppealService] ❌ Yetkili kanalı bulunamadı: ${MOD_APPROVAL_CHANNEL_ID}`);
      return null;
    }

    // ─── CONTAINER (accent colorsuz / Components V2) ─────────────────────
    const container = new ContainerBuilder();

    // 1. Başlık
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### ⚖️ Automod İtirazı — Yetkili Değerlendirmesi')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    // 2. Detaylar
    const detailsText =
      `👤 **Kullanıcı:** <@${userId}> (\`${username}\` / \`${userId}\`)\n` +
      `📍 **Olay Kanalı:** <#${channelId}>\n` +
      `🚫 **Engellenen Mesaj:** \`${blockedContent.substring(0, 300)}\`\n` +
      `🔍 **Filtre Tespiti:** \`${matchedWord}\`\n\n` +
      `📝 **Kullanıcının İtiraz Savunması:**\n> *"${appealMessage}"*\n\n` +
      `🤖 **EkoAI Ön İnceleme:** \`❌ REDDEDİLDİ\`\n` +
      `💬 **EkoAI Gerekçesi:** ${aiReasoning}\n\n` +
      `📊 **Kullanıcı Profili:** Güven Puanı: \`${trustScore}/100\` • Mesaj: \`${totalMessages}\` • Seviye: \`${userLevel}\``;

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(detailsText)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true)
    );

    // 3. Karar Butonları
    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`automod_appeal_approve_${appealId}`)
        .setLabel('Kabul Et (Cezayı Kaldır)')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`automod_appeal_reject_${appealId}`)
        .setLabel('Reddet')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    container.addActionRowComponents(actionRow);

    const message = await staffChannel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    }).catch(async (v2Err) => {
      // V2 Desteklenmezse Embed Fallback
      console.warn('[AutomodAppealService] V2 fallback embed:', v2Err.message);
      const embed = new EmbedBuilder()
        .setTitle('⚖️ Automod İtirazı — Yetkili Değerlendirmesi')
        .setColor(0x2b2d31) // Nötr koyu gri (accent colorsuz)
        .setDescription(detailsText)
        .setFooter({ text: `İtiraz Dosyası: ${appealId}` })
        .setTimestamp();
      return staffChannel.send({ embeds: [embed], components: [actionRow] });
    });

    console.log(`[AutomodAppealService] ✅ İtiraz kartı yetkili kanalına gönderildi (${message.id})`);
    return message;
  } catch (err) {
    console.error('[AutomodAppealService] Yetkili kartı gönderilirken hata:', err.message);
    return null;
  }
}

/**
 * Moderatör Kabul Et / Reddet butonuna bastığında çalışır
 */
async function handleModeratorDecision(interaction, appealId, decision) {
  try {
    const appeal = await AutomodAppeal.findOne({ appealId });
    if (!appeal) {
      return interaction.reply({
        content: `❌ \`${appealId}\` numaralı itiraz dosyası bulunamadı.`,
        ephemeral: true
      }).catch(() => {});
    }

    if (appeal.status === 'approved_by_mod' || appeal.status === 'rejected_by_mod' || appeal.status === 'approved_by_ai') {
      return interaction.reply({
        content: `⚠️ Bu itiraz dosyası daha önce karara bağlanmış: **${appeal.status}**`,
        ephemeral: true
      }).catch(() => {});
    }

    const modTag = interaction.user.tag || interaction.user.username;
    const modId = interaction.user.id;

    if (decision === 'approve') {
      appeal.status = 'approved_by_mod';
      appeal.moderatorId = modId;
      appeal.moderatorTag = modTag;
      appeal.moderatorDecisionAt = new Date();
      await appeal.save().catch(() => {});

      // Cezayı ve kısıtlamaları kaldır
      await applyAppealApproval({
        guild: interaction.guild,
        userId: appeal.userId,
        incidentId: appeal.incidentId,
        reason: `Yetkili İtiraz Kabulü: ${modTag}`
      });

      // Discord mesajını güncelle
      await updateDiscordStaffMessage(interaction.message, appeal, 'KABUL', modId);

      await interaction.reply({
        content: `✅ **İtiraz onaylandı!** <@${appeal.userId}> adlı kullanıcının kısıtlamaları kaldırıldı.`,
        ephemeral: true
      }).catch(() => {});

      // Kullanıcıya DM bilgilendirmesi
      const member = interaction.guild ? await interaction.guild.members.fetch(appeal.userId).catch(() => null) : null;
      if (member) {
        member.send({
          content: `🎉 **İtirazınız Yetkili Tarafından KABUL EDİLDİ!**\n\n` +
            `Dosyanız (\`${appealId}\`) yetkili kurulunca incelendi ve **<@${modId}>** tarafından onaylandı.\n` +
            `Uygulanan kısıtlamalar kaldırıldı. Sunucu kurallarına dikkat ettiğiniz için teşekkür ederiz.`
        }).catch(() => {});
      }
    } else {
      appeal.status = 'rejected_by_mod';
      appeal.moderatorId = modId;
      appeal.moderatorTag = modTag;
      appeal.moderatorDecisionAt = new Date();
      await appeal.save().catch(() => {});

      // Discord mesajını güncelle
      await updateDiscordStaffMessage(interaction.message, appeal, 'RED', modId);

      await interaction.reply({
        content: `❌ **İtiraz reddedildi.** Dosya kapatıldı.`,
        ephemeral: true
      }).catch(() => {});

      // Kullanıcıya DM bilgilendirmesi
      const member = interaction.guild ? await interaction.guild.members.fetch(appeal.userId).catch(() => null) : null;
      if (member) {
        member.send({
          content: `❌ **İtirazınız Reddedildi:**\n\n` +
            `\`${appealId}\` numaralı itirazınız yetkili kurulunca değerlendirildi ve onaylanmadı.\n` +
            `Cezanızın bitmesini bekleyebilir veya genel kurallarımızı inceleyebilirsiniz: <#1514583014208700519>`
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[AutomodAppealService] handleModeratorDecision error:', err.message);
    return interaction.reply({
      content: `❌ İşlem sırasında bir hata oluştu: ${err.message}`,
      ephemeral: true
    }).catch(() => {});
  }
}

/**
 * Yetkili karara bağladığında kanaldaki mesajı günceller (butonları pasifize eder)
 */
async function updateDiscordStaffMessage(message, appeal, result, modId) {
  try {
    if (!message) return;

    const container = new ContainerBuilder();
    const isApproved = result === 'KABUL';

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        isApproved
          ? `### ⚖️ Automod İtirazı — ✅ KABUL EDİLDİ`
          : `### ⚖️ Automod İtirazı — ❌ REDDEDİLDİ`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const summaryText =
      `👤 **Kullanıcı:** <@${appeal.userId}> (\`${appeal.username}\`)\n` +
      `🚫 **Engellenen Mesaj:** \`${appeal.blockedContent.substring(0, 200)}\`\n` +
      `📝 **İtiraz Savunması:** *"${appeal.appealMessage}"*\n\n` +
      `👮 **Kararı Veren Yetkili:** <@${modId}>\n` +
      `📌 **Nihai Karar:** ${isApproved ? '✅ **ONAYLANDI (Cezalar Kaldırıldı)**' : '❌ **REDDEDİLDİ**'}\n` +
      `⏱️ **Karar Zamanı:** <t:${Math.floor(Date.now() / 1000)}:R>`;

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(summaryText)
    );

    await message.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    }).catch(() => {});
  } catch (err) {
    console.warn('[AutomodAppealService] Mesaj güncelleme hatası:', err.message);
  }
}

/**
 * Onaylanan itirazın cezalarını (timeout, jail, trust score) kaldırır
 */
async function applyAppealApproval({ guild, userId, incidentId, reason }) {
  try {
    if (incidentId && guild) {
      // profanityAutomodService üzerinden forgiveAutomodIncident dene
      try {
        await forgiveAutomodIncident({ messageId: incidentId, guild, moderatorId: 'EKOAI_APPEAL' });
      } catch (_) {}
    }

    if (guild && userId) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member && member.communicationDisabledUntilTimestamp) {
        await member.timeout(null, reason || 'İtiraz Kabulü').catch(() => {});
      }
    }

    // Güven puanını telafi et (+3 puan)
    try {
      await updateTrustScore(userId, 3.0, reason || 'Automod İtiraz Kabulü', 'SYSTEM');
    } catch (_) {}
  } catch (err) {
    console.error('[AutomodAppealService] applyAppealApproval error:', err.message);
  }
}

/**
 * 15 dakikadan uzun süredir yetkililerce bakılmayan itirazları tespit edip Telegram'a bildirir
 */
async function checkPendingAppealsAndAlertTelegram(client) {
  try {
    const cutoff = new Date(Date.now() - OVERDUE_THRESHOLD_MS);

    const pendingAppeals = await AutomodAppeal.find({
      status: 'rejected_by_ai_pending_mod',
      telegramAlertSent: { $ne: true },
      submittedAt: { $lt: cutoff }
    }).limit(5);

    for (const appeal of pendingAppeals) {
      console.log(`[AutomodAppealService] ⚠️ 15 dakikadır bakılmayan itiraz tespit edildi: ${appeal.appealId}`);

      const telegramMsg =
        `⚠️ <b>[EkoYıldız Automod İtirazı Beklemede!]</b>\n\n` +
        `👤 <b>Kullanıcı:</b> ${escapeHtml(appeal.username)} (<code>${appeal.userId}</code>)\n` +
        `📝 <b>İtiraz Mesajı:</b> ${escapeHtml(appeal.appealMessage)}\n` +
        `🚫 <b>Engellenen İçerik:</b> <code>${escapeHtml(appeal.blockedContent)}</code>\n` +
        `🔍 <b>Filtre:</b> <code>${escapeHtml(appeal.matchedWord)}</code>\n` +
        `🤖 <b>EkoAI Kararı:</b> Reddedildi (${escapeHtml(appeal.aiReasoning)})\n\n` +
        `⏳ <b>Uyarı:</b> Yetkili kanalına iletilen bu itiraza <b>15 dakikadır kimse bakmadı!</b>\n` +
        `🔗 <a href="https://discord.com/channels/${MAIN_GUILD_ID}/${MOD_APPROVAL_CHANNEL_ID}">Yetkili İnceleme Kanalına Git</a>`;

      const sent = await sendTelegramAlert(telegramMsg).catch(err => {
        console.error('[AutomodAppealService] Telegram alert hatası:', err.message);
        return false;
      });

      if (sent) {
        appeal.telegramAlertSent = true;
        appeal.telegramAlertSentAt = new Date();
        await appeal.save().catch(() => {});
        console.log(`[AutomodAppealService] 📲 Telegram uyarısı gönderildi (${appeal.appealId})`);
      }
    }
  } catch (err) {
    console.error('[AutomodAppealService] checkPendingAppealsAndAlertTelegram error:', err.message);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Arka plan planlayıcısı — Her 60 saniyede bir bekleyen itirazları tarar
 */
let appealSchedulerInterval = null;
function startAppealMonitoringScheduler(client) {
  if (appealSchedulerInterval) return;

  // İlk tarama 30 saniye sonra
  setTimeout(() => {
    checkPendingAppealsAndAlertTelegram(client).catch(() => {});
  }, 30000);

  // Düzenli periyot: Her 60 saniyede bir
  appealSchedulerInterval = setInterval(() => {
    checkPendingAppealsAndAlertTelegram(client).catch(() => {});
  }, 60 * 1000);

  if (appealSchedulerInterval.unref) {
    appealSchedulerInterval.unref();
  }

  console.log('[AutomodAppealService] ⏰ Automod İtiraz & Telegram takip zamanlayıcısı başlatıldı.');
}

module.exports = {
  submitAutomodAppeal,
  sendAppealToDiscordStaffChannel,
  handleModeratorDecision,
  checkPendingAppealsAndAlertTelegram,
  startAppealMonitoringScheduler,
  applyAppealApproval,
  MOD_APPROVAL_CHANNEL_ID,
  MAIN_GUILD_ID
};
