'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const APPROVER_USER_ID = '1031620522406072350';
const pendingRequests = new Map();

/**
 * Roblox Cookie İşlem Onay İsteği Gönder (Approval Gateway)
 * @param {import('discord.js').Client} client Discord istemcisi
 * @param {Object} options
 * @param {string} options.action Yapılan eylem (Örn: Roblox Rütbe Değiştirme / Gruptan Atma)
 * @param {string} options.targetUser Yapılan kullanıcı (Örn: Username / Roblox ID / Mention)
 * @param {string} options.reason Sebep (Örn: Terfi sınavı geçildi / Moderasyon işlemi)
 * @param {Function} options.executeCallback Onay verildiğinde çalıştırılacak roblox cookie fonksiyonu
 */
async function requestRobloxCookieApproval(client, { action, targetUser, reason, executeCallback }) {
  const reqId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  const reqObj = {
    reqId,
    action,
    targetUser,
    reason,
    executeCallback,
    status: 'pending',
    createdAt: Date.now()
  };

  pendingRequests.set(reqId, reqObj);

  try {
    const approver = await client.users.fetch(APPROVER_USER_ID).catch(() => null);
    if (!approver) {
      console.warn(`[robloxApprovalGateway] Approver user ${APPROVER_USER_ID} could not be fetched.`);
      return { success: false, pending: true, reqId, message: '1031620522406072350 idli kullanıcıya ulaşılamadı.' };
    }

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle(`🔐 ROBLOX COOKIE İŞLEMİ ONAY İSTEĞİ (#${reqId})`)
      .setDescription('Aşağıda detayları belirtilen Roblox Cookie işlemi için onayınız gerekmektedir.')
      .addFields(
        { name: 'Yapılan eylem:', value: `${action}`, inline: false },
        { name: 'Yapılan kullanıcı:', value: `${targetUser}`, inline: false },
        { name: 'Sebep:', value: `${reason || 'Belirtilmedi'}`, inline: false }
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

    await approver.send({ embeds: [embed], components: [row] });
    console.log(`[robloxApprovalGateway] Approval request #${reqId} sent to approver ${APPROVER_USER_ID}`);

    return {
      success: true,
      pending: true,
      reqId,
      message: '🔒 İşlem Roblox Cookie Güvenlik Onayına Gönderildi. 1031620522406072350 IDli kullanıcının onayı bekleniyor.'
    };
  } catch (err) {
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

  // Yalnızca 1031620522406072350 kullanıcısı butonlara tıklayabilir
  if (user.id !== APPROVER_USER_ID) {
    return interaction.reply({
      content: '❌ Bu Roblox Cookie işlemini sadece yetkili **1031620522406072350** kullanıcısı onaylayabilir!',
      ephemeral: true
    });
  }

  const isAccept = customId.startsWith('rbx_appr_accept_');
  const reqId = customId.replace(isAccept ? 'rbx_appr_accept_' : 'rbx_appr_reject_', '');

  const reqObj = pendingRequests.get(reqId);
  if (!reqObj) {
    return interaction.reply({
      content: '❌ İstek süresi dolmuş veya daha önce işlenmiş.',
      ephemeral: true
    });
  }

  if (isAccept) {
    reqObj.status = 'approved';
    pendingRequests.delete(reqId);

    const updateEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`✅ İŞLEM ONAYLANDI VE UYGULANDI (#${reqId})`)
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
    try {
      if (typeof reqObj.executeCallback === 'function') {
        const result = await reqObj.executeCallback();
        console.log(`[robloxApprovalGateway] Execution callback completed for #${reqId}:`, result);
      }
    } catch (execErr) {
      console.error(`[robloxApprovalGateway] Execution error for #${reqId}:`, execErr.message);
      await interaction.followUp({
        content: `⚠️ İşlem onaylandı ancak Roblox API çalıştırılırken bir hata oluştu: \`${execErr.message}\``,
        ephemeral: true
      }).catch(() => {});
    }
  } else {
    reqObj.status = 'rejected';
    pendingRequests.delete(reqId);

    const updateEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`❌ İŞLEM REDDEDİLDİ VE İPTAL EDİLDİ (#${reqId})`)
      .addFields(
        { name: 'Yapılan eylem:', value: `${reqObj.action}`, inline: false },
        { name: 'Yapılan kullanıcı:', value: `${reqObj.targetUser}`, inline: false },
        { name: 'Sebep:', value: `${reqObj.reason}`, inline: false },
        { name: 'Reddeden:', value: `<@${user.id}> (${user.tag})`, inline: false }
      )
      .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
      .setTimestamp();

    await interaction.update({ embeds: [updateEmbed], components: [] });
  }

  return true;
}

module.exports = {
  APPROVER_USER_ID,
  requestRobloxCookieApproval,
  handleApprovalButton
};
