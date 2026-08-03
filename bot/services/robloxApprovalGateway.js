'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const APPROVER_USER_ID = '1031620522406072350';
const pendingRequests = new Map();

// 1 saatlik zaman aşımı (ms)
const REQUEST_TIMEOUT_MS = 60 * 60 * 1000;

/**
 * Roblox Cookie İşlem Onay İsteği Gönder (Approval Gateway)
 * @param {import('discord.js').Client} client Discord istemcisi
 * @param {Object} options
 * @param {string} options.action Yapılan eylem
 * @param {string} options.targetUser Yapılan kullanıcı
 * @param {string} options.reason Sebep
 * @param {Function} options.executeCallback Onay verildiğinde çalıştırılacak fonksiyon
 * @param {string} [options.requesterId] İsteği yapan Discord kullanıcı ID'si (bildirim için)
 */
async function requestRobloxCookieApproval(client, { action, targetUser, reason, executeCallback, requesterId }) {
  const reqId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  const reqObj = {
    reqId,
    action,
    targetUser,
    reason,
    executeCallback,
    requesterId: requesterId || null,
    status: 'pending',
    createdAt: Date.now(),
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

    // Onaylayıcının DM mesajındaki butonları devre dışı bırak
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
                .setTitle(`⏰ ONAY SÜRESİ DOLDU (#${reqId})`)
                .setDescription('Bu Roblox Cookie işlemi için 1 saatlik onay süresi doldu. İstek otomatik olarak iptal edildi.')
                .addFields(
                  { name: 'Yapılan eylem:', value: `${req.action}`, inline: false },
                  { name: 'Yapılan kullanıcı:', value: `${req.targetUser}`, inline: false }
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

    // İsteği yapan kullanıcıya bildir
    try {
      if (req.requesterId) {
        const requester = await client.users.fetch(req.requesterId).catch(() => null);
        if (requester) {
          const expiredNotif = new EmbedBuilder()
            .setColor(0x95a5a6)
            .setTitle('⏰ İşlem Süresi Doldu')
            .setDescription(
              `Roblox Cookie işleminiz için 1 saatlik onay süresi doldu ve istek **otomatik iptal edildi**.\n\n` +
              `İşlem tekrar yapılmak isteniyorsa yeniden gönderin.`
            )
            .addFields(
              { name: 'Eylem', value: req.action, inline: false },
              { name: 'Hedef', value: req.targetUser, inline: false }
            )
            .setFooter({ text: 'Roblox Cookie Onay Sistemi' })
            .setTimestamp();
          await requester.send({ embeds: [expiredNotif] }).catch(() => {});
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
      return { success: false, pending: true, reqId, message: '1031620522406072350 idli kullanıcıya ulaşılamadı.' };
    }

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle(`🔐 ROBLOX COOKIE İŞLEMİ ONAY İSTEĞİ (#${reqId})`)
      .setDescription(
        'Aşağıda detayları belirtilen Roblox Cookie işlemi için onayınız gerekmektedir.\n\n' +
        '⏰ **Bu istek 1 saat içinde onaylanmazsa otomatik iptal edilir.**'
      )
      .addFields(
        { name: 'Yapılan eylem:', value: `${action}`, inline: false },
        { name: 'Yapılan kullanıcı:', value: `${targetUser}`, inline: false },
        { name: 'Sebep:', value: `${reason || 'Belirtilmedi'}`, inline: false },
        { name: 'İstek ID:', value: `\`${reqId}\``, inline: true },
        { name: 'Son Onay:', value: `<t:${Math.floor((Date.now() + REQUEST_TIMEOUT_MS) / 1000)}:R>`, inline: true }
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

    // DM mesajı ID ve kanal ID'sini kaydet (timeout için)
    reqObj.approverMsgId = sentMsg.id;
    reqObj.approverDmChannelId = sentMsg.channelId;

    return {
      success: true,
      pending: true,
      reqId,
      message: `🔒 **İşlem Onaya Gönderildi**\n\nRoblox Cookie işleminiz güvenlik onayına gönderildi.\n` +
               `📨 <@${APPROVER_USER_ID}> kullanıcısının onayı bekleniyor.\n` +
               `⏰ **Son onay süresi:** <t:${Math.floor((Date.now() + REQUEST_TIMEOUT_MS) / 1000)}:R>\n\n` +
               `Onay verildiğinde veya reddedildiğinde size bildirim gelecektir.`
    };
  } catch (err) {
    clearTimeout(timeoutHandle);
    pendingRequests.delete(reqId);
    console.error('[robloxApprovalGateway] Error sending approval request:', err.message);
    return { success: false, pending: false, message: err.message };
  }
}

/**
 * Onay / Red Buton Etkileşimlerini Yönet
 */
async function handleApprovalButton(interaction) {
  const { customId, user, client } = interaction;

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

    const updateEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`✅ İŞLEM ONAYLANDI (#${reqId})`)
      .addFields(
        { name: 'Yapılan eylem:', value: `${reqObj.action}`, inline: false },
        { name: 'Yapılan kullanıcı:', value: `${reqObj.targetUser}`, inline: false },
        { name: 'Sebep:', value: `${reqObj.reason}`, inline: false },
        { name: 'Onaylayan:', value: `<@${user.id}> (${user.tag})`, inline: false }
      )
      .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
      .setTimestamp();

    await interaction.update({ embeds: [updateEmbed], components: [] });

    // Roblox Cookie fonksiyonunu çalıştır
    let execSuccess = true;
    let execErrMsg = null;
    try {
      if (typeof reqObj.executeCallback === 'function') {
        const result = await reqObj.executeCallback();
        console.log(`[robloxApprovalGateway] Execution callback completed for #${reqId}:`, result);
      }
    } catch (execErr) {
      execSuccess = false;
      execErrMsg = execErr.message;
      console.error(`[robloxApprovalGateway] Execution error for #${reqId}:`, execErr.message);
      await interaction.followUp({
        content: `⚠️ İşlem onaylandı ancak Roblox API çalıştırılırken bir hata oluştu: \`${execErr.message}\``,
        ephemeral: true
      }).catch(() => {});
    }

    // İsteği yapan kullanıcıya bildir
    try {
      if (reqObj.requesterId) {
        const requester = await client.users.fetch(reqObj.requesterId).catch(() => null);
        if (requester) {
          const notifEmbed = new EmbedBuilder()
            .setColor(execSuccess ? 0x2ecc71 : 0xe67e22)
            .setTitle(execSuccess ? '✅ Roblox İşleminiz Onaylandı ve Uygulandı!' : '⚠️ Roblox İşleminiz Onaylandı Ancak Hata Oluştu')
            .setDescription(
              execSuccess
                ? `Roblox Cookie işleminiz onaylandı ve başarıyla uygulandı.`
                : `Roblox Cookie işleminiz onaylandı ancak Roblox API'de hata oluştu: \`${execErrMsg}\``
            )
            .addFields(
              { name: 'Eylem', value: reqObj.action, inline: false },
              { name: 'Hedef', value: reqObj.targetUser, inline: false },
              { name: 'Onaylayan', value: `<@${user.id}>`, inline: true }
            )
            .setFooter({ text: 'Roblox Cookie Onay Sistemi' })
            .setTimestamp();
          await requester.send({ embeds: [notifEmbed] }).catch(() => {});
        }
      }
    } catch (_) {}

  } else {
    reqObj.status = 'rejected';
    pendingRequests.delete(reqId);

    const updateEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`❌ İŞLEM REDDEDİLDİ (#${reqId})`)
      .addFields(
        { name: 'Yapılan eylem:', value: `${reqObj.action}`, inline: false },
        { name: 'Yapılan kullanıcı:', value: `${reqObj.targetUser}`, inline: false },
        { name: 'Sebep:', value: `${reqObj.reason}`, inline: false },
        { name: 'Reddeden:', value: `<@${user.id}> (${user.tag})`, inline: false }
      )
      .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
      .setTimestamp();

    await interaction.update({ embeds: [updateEmbed], components: [] });

    // İsteği yapan kullanıcıya bildir
    try {
      if (reqObj.requesterId) {
        const requester = await client.users.fetch(reqObj.requesterId).catch(() => null);
        if (requester) {
          const notifEmbed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Roblox İşleminiz Reddedildi')
            .setDescription('Roblox Cookie işleminiz yetkili tarafından reddedildi ve işlem iptal edildi.')
            .addFields(
              { name: 'Eylem', value: reqObj.action, inline: false },
              { name: 'Hedef', value: reqObj.targetUser, inline: false },
              { name: 'Reddeden', value: `<@${user.id}>`, inline: true }
            )
            .setFooter({ text: 'Roblox Cookie Onay Sistemi' })
            .setTimestamp();
          await requester.send({ embeds: [notifEmbed] }).catch(() => {});
        }
      }
    } catch (_) {}
  }

  return true;
}

module.exports = {
  APPROVER_USER_ID,
  requestRobloxCookieApproval,
  handleApprovalButton
};
