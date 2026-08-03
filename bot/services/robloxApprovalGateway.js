'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const APPROVER_USER_ID = '1031620522406072350';
const pendingRequests = new Map();

// 1 saatlik zaman aşımı (ms)
const REQUEST_TIMEOUT_MS = 60 * 60 * 1000;

/**
 * Roblox Cookie İşlem Onay İsteği Gönder (Approval Gateway)
 * Onaylayıcıya DM gönderir. 1 saat boyunca buton aktif kalır.
 * Onay / red sonucunda orijinal DM mesajı düzenlenir — requester'a ayrıca bildirim GİTMEZ.
 *
 * @param {import('discord.js').Client} client Discord istemcisi
 * @param {Object} options
 * @param {string} options.action    Yapılan eylem
 * @param {string} options.targetUser Hedef kullanıcı
 * @param {string} options.reason    Sebep
 * @param {Function} options.executeCallback Onay verildiğinde çalışacak fonksiyon
 * @param {string} [options.requesterId] İsteği yapan Discord kullanıcı ID'si (sadece bilgi amaçlı)
 */
async function requestRobloxCookieApproval(client, { action, targetUser, reason, executeCallback, requesterId }) {
  const reqId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const expiresAt = Date.now() + REQUEST_TIMEOUT_MS;

  const reqObj = {
    reqId,
    action,
    targetUser,
    reason,
    executeCallback,
    requesterId: requesterId || null,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt,
    approverMsgId: null,
    approverDmChannelId: null,
    timeoutHandle: null
  };

  pendingRequests.set(reqId, reqObj);

  // ── 1 Saatlik Otomatik Sona Erme ────────────────────────────────────────────
  const timeoutHandle = setTimeout(async () => {
    const req = pendingRequests.get(reqId);
    if (!req || req.status !== 'pending') return;

    req.status = 'expired';
    pendingRequests.delete(reqId);
    console.log(`[robloxApprovalGateway] Request #${reqId} expired after 1 hour.`);

    // Onaylayıcının DM mesajını "süre doldu" olarak düzenle, butonları kapat
    try {
      if (req.approverDmChannelId && req.approverMsgId) {
        const approver = await client.users.fetch(APPROVER_USER_ID).catch(() => null);
        if (approver) {
          const dmChannel = await approver.createDM().catch(() => null);
          if (dmChannel) {
            const oldMsg = await dmChannel.messages.fetch(req.approverMsgId).catch(() => null);
            if (oldMsg) {
              const expiredEmbed = new EmbedBuilder()
                .setColor(0x95a5a6)
                .setTitle(`⏰ ONAY SÜRESİ DOLDU — İPTAL EDİLDİ (#${reqId})`)
                .setDescription('Bu Roblox Cookie işlemi için **1 saatlik onay süresi** doldu.\nİstek otomatik olarak iptal edildi.')
                .addFields(
                  { name: '🔧 Yapılan Eylem', value: `${req.action}`, inline: false },
                  { name: '👤 Hedef Kullanıcı', value: `${req.targetUser}`, inline: false },
                  { name: '📋 Sebep', value: `${req.reason || 'Belirtilmedi'}`, inline: false }
                )
                .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
                .setTimestamp();

              const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`rbx_appr_accept_${reqId}`)
                  .setLabel('✅ Kabul Et')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setCustomId(`rbx_appr_reject_${reqId}`)
                  .setLabel('❌ Reddet')
                  .setStyle(ButtonStyle.Danger)
                  .setDisabled(true)
              );

              await oldMsg.edit({ embeds: [expiredEmbed], components: [disabledRow] }).catch(() => {});
            }
          }
        }
      }
    } catch (_) {}

  }, REQUEST_TIMEOUT_MS);

  reqObj.timeoutHandle = timeoutHandle;

  try {
    const approver = await client.users.fetch(APPROVER_USER_ID).catch(() => null);
    if (!approver) {
      clearTimeout(timeoutHandle);
      pendingRequests.delete(reqId);
      console.warn(`[robloxApprovalGateway] Approver user ${APPROVER_USER_ID} could not be fetched.`);
      return { success: false, pending: true, reqId, message: '❌ Onaylayıcı kullanıcıya ulaşılamadı.' };
    }

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle(`🔐 ROBLOX COOKIE İŞLEMİ ONAY İSTEĞİ (#${reqId})`)
      .setDescription(
        'Aşağıda detayları belirtilen Roblox Cookie işlemi için **onayınız gerekmektedir**.\n\n' +
        `⏰ **Onay süresi:** <t:${Math.floor(expiresAt / 1000)}:R> dolacak (1 saat)`
      )
      .addFields(
        { name: '🔧 Yapılan Eylem', value: `${action}`, inline: false },
        { name: '👤 Hedef Kullanıcı', value: `${targetUser}`, inline: false },
        { name: '📋 Sebep', value: `${reason || 'Belirtilmedi'}`, inline: false },
        { name: '🆔 İstek ID', value: `\`${reqId}\``, inline: true },
        { name: '👤 İsteği Yapan', value: requesterId ? `<@${requesterId}>` : 'Sistem', inline: true }
      )
      .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rbx_appr_accept_${reqId}`)
        .setLabel('✅ Kabul Et')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`rbx_appr_reject_${reqId}`)
        .setLabel('❌ Reddet')
        .setStyle(ButtonStyle.Danger)
    );

    const sentMsg = await approver.send({ embeds: [embed], components: [row] });
    console.log(`[robloxApprovalGateway] Approval request #${reqId} sent to approver ${APPROVER_USER_ID}`);

    // DM mesajı ID ve kanal ID'sini kaydet (timeout düzenlemesi için)
    reqObj.approverMsgId = sentMsg.id;
    reqObj.approverDmChannelId = sentMsg.channelId;

    return {
      success: true,
      pending: true,
      reqId,
      message:
        `🔒 **İşlem Onaya Gönderildi**\n\n` +
        `Roblox Cookie işlemi güvenlik onayına gönderildi.\n` +
        `📨 <@${APPROVER_USER_ID}> kullanıcısının onayı bekleniyor.\n` +
        `⏰ **Son onay:** <t:${Math.floor(expiresAt / 1000)}:R>`
    };
  } catch (err) {
    clearTimeout(timeoutHandle);
    pendingRequests.delete(reqId);
    console.error('[robloxApprovalGateway] Error sending approval request:', err.message);
    return { success: false, pending: false, message: `❌ Onay isteği gönderilemedi: \`${err.message}\`` };
  }
}

/**
 * Onay / Red Buton Etkileşimlerini Yönet.
 * Sonuç, onaylayıcının DM mesajını düzenleyerek gösterilir.
 * Requester'a ayrıca DM gitmez.
 */
async function handleApprovalButton(interaction) {
  const { customId, user } = interaction;

  if (!customId.startsWith('rbx_appr_accept_') && !customId.startsWith('rbx_appr_reject_')) {
    return false;
  }

  // Yalnızca APPROVER_USER_ID kullanıcısı butonlara tıklayabilir
  if (user.id !== APPROVER_USER_ID) {
    return interaction.reply({
      content: '❌ Bu Roblox Cookie işlemini sadece yetkili kullanıcı onaylayabilir!',
      ephemeral: true
    });
  }

  const isAccept = customId.startsWith('rbx_appr_accept_');
  const reqId = customId.replace(isAccept ? 'rbx_appr_accept_' : 'rbx_appr_reject_', '');

  const reqObj = pendingRequests.get(reqId);
  if (!reqObj) {
    return interaction.reply({
      content: '❌ İstek süresi dolmuş, daha önce işlenmiş veya bulunamadı.',
      ephemeral: true
    });
  }

  // Timeout'u iptal et
  if (reqObj.timeoutHandle) {
    clearTimeout(reqObj.timeoutHandle);
    reqObj.timeoutHandle = null;
  }

  if (isAccept) {
    reqObj.status = 'approved';
    pendingRequests.delete(reqId);

    // ── Önce mesajı "onaylandı, işleniyor..." olarak güncelle ──────────────
    const processingEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`⏳ İŞLEM UYGULANIYYOR... (#${reqId})`)
      .setDescription('Onay alındı, Roblox API işlemi çalıştırılıyor...')
      .addFields(
        { name: '🔧 Yapılan Eylem', value: `${reqObj.action}`, inline: false },
        { name: '👤 Hedef Kullanıcı', value: `${reqObj.targetUser}`, inline: false }
      )
      .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
      .setTimestamp();

    await interaction.update({ embeds: [processingEmbed], components: [] });

    // ── Roblox callback'i çalıştır ──────────────────────────────────────────
    let execSuccess = true;
    let execErrMsg = null;
    try {
      if (typeof reqObj.executeCallback === 'function') {
        const result = await reqObj.executeCallback();
        console.log(`[robloxApprovalGateway] Callback completed for #${reqId}:`, result);
      }
    } catch (execErr) {
      execSuccess = false;
      execErrMsg = execErr.message;
      console.error(`[robloxApprovalGateway] Callback error for #${reqId}:`, execErr.message);
    }

    // ── İşlem sonucunu aynı mesaja düzenle ─────────────────────────────────
    const finalEmbed = new EmbedBuilder()
      .setColor(execSuccess ? 0x2ecc71 : 0xe67e22)
      .setTitle(execSuccess ? `✅ İŞLEM ONAYLANDI VE UYGULANDII (#${reqId})` : `⚠️ ONAYLANDI — ANCAK HATA OLUŞTU (#${reqId})`)
      .setDescription(execSuccess
        ? 'İşlem başarıyla onaylandı ve Roblox API üzerinde uygulandı.'
        : `İşlem onaylandı ancak Roblox API sırasında bir hata oluştu:\n\`\`\`${execErrMsg}\`\`\``)
      .addFields(
        { name: '🔧 Yapılan Eylem', value: `${reqObj.action}`, inline: false },
        { name: '👤 Hedef Kullanıcı', value: `${reqObj.targetUser}`, inline: false },
        { name: '📋 Sebep', value: `${reqObj.reason || 'Belirtilmedi'}`, inline: false },
        { name: '✅ Onaylayan', value: `<@${user.id}> (\`${user.tag}\`)`, inline: true },
        { name: '🕐 Onay Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
      .setTimestamp();

    // interaction.message.edit ile orijinal DM mesajını son haline getir
    await interaction.message.edit({ embeds: [finalEmbed], components: [] }).catch(() => {});

  } else {
    reqObj.status = 'rejected';
    pendingRequests.delete(reqId);

    // ── Red sonucunu orijinal mesaja düzenle ───────────────────────────────
    const rejectedEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`❌ İŞLEM REDDEDİLDİ (#${reqId})`)
      .setDescription('Bu Roblox Cookie işlemi yetkili tarafından reddedildi ve iptal edildi.')
      .addFields(
        { name: '🔧 Yapılan Eylem', value: `${reqObj.action}`, inline: false },
        { name: '👤 Hedef Kullanıcı', value: `${reqObj.targetUser}`, inline: false },
        { name: '📋 Sebep', value: `${reqObj.reason || 'Belirtilmedi'}`, inline: false },
        { name: '❌ Reddeden', value: `<@${user.id}> (\`${user.tag}\`)`, inline: true },
        { name: '🕐 Red Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
      .setTimestamp();

    await interaction.update({ embeds: [rejectedEmbed], components: [] });
  }

  return true;
}

module.exports = {
  APPROVER_USER_ID,
  requestRobloxCookieApproval,
  handleApprovalButton
};
