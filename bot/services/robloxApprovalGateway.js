'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const APPROVER_USER_ID = '1031620522406072350';
const pendingRequests = new Map();

// 1 saatlik zaman aşımı (ms)
const REQUEST_TIMEOUT_MS = 60 * 60 * 1000;

// ── Otomatik Mod (Auto-Accept / Auto-Reject) ─────────────────────────────────
// { mode: 'accept' | 'reject', expiresAt: number, timeoutHandle }
let autoMode = null;

function clearAutoMode() {
  if (autoMode?.timeoutHandle) clearTimeout(autoMode.timeoutHandle);
  autoMode = null;
}

function setAutoMode(mode) {
  clearAutoMode();
  const expiresAt = Date.now() + REQUEST_TIMEOUT_MS;
  const timeoutHandle = setTimeout(() => {
    autoMode = null;
    console.log(`[robloxApprovalGateway] Auto-${mode} mode expired.`);
  }, REQUEST_TIMEOUT_MS);
  autoMode = { mode, expiresAt, timeoutHandle };
  console.log(`[robloxApprovalGateway] Auto-${mode} mode activated for 1 hour.`);
}

function getAutoMode() {
  if (!autoMode) return null;
  if (Date.now() > autoMode.expiresAt) {
    clearAutoMode();
    return null;
  }
  return autoMode;
}

// ── 4 Butonlu Row Builder ────────────────────────────────────────────────────
function buildApprovalRow(reqId) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rbx_appr_accept_${reqId}`)
      .setLabel('✅ Kabul Et')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`rbx_appr_reject_${reqId}`)
      .setLabel('❌ Reddet')
      .setStyle(ButtonStyle.Danger)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rbx_appr_autoaccept_${reqId}`)
      .setLabel('🟢 1 Saat Boyunca Kabul Et')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`rbx_appr_autoreject_${reqId}`)
      .setLabel('🔴 1 Saat Boyunca Reddet')
      .setStyle(ButtonStyle.Secondary)
  );
  return [row1, row2];
}

function buildDisabledRow(reqId) {
  const row1 = new ActionRowBuilder().addComponents(
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
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rbx_appr_autoaccept_${reqId}`)
      .setLabel('🟢 1 Saat Boyunca Kabul Et')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`rbx_appr_autoreject_${reqId}`)
      .setLabel('🔴 1 Saat Boyunca Reddet')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );
  return [row1, row2];
}

// ── Ortak: İstek mesajını orijinal DM'e göre düzenle ─────────────────────────
async function editApproverMsg(client, req, embed) {
  try {
    if (!req.approverMsgId || !req.approverDmChannelId) return;
    const approver = await client.users.fetch(APPROVER_USER_ID).catch(() => null);
    if (!approver) return;
    const dmChannel = await approver.createDM().catch(() => null);
    if (!dmChannel) return;
    const msg = await dmChannel.messages.fetch(req.approverMsgId).catch(() => null);
    if (!msg) return;
    await msg.edit({ embeds: [embed], components: buildDisabledRow(req.reqId) }).catch(() => {});
  } catch (_) {}
}

// ── Ortak: Callback'i çalıştır ────────────────────────────────────────────────
async function runCallback(req) {
  if (typeof req.executeCallback !== 'function') return { success: true, errMsg: null };
  try {
    const result = await req.executeCallback();
    console.log(`[robloxApprovalGateway] Callback completed for #${req.reqId}:`, result);
    return { success: true, errMsg: null };
  } catch (err) {
    console.error(`[robloxApprovalGateway] Callback error for #${req.reqId}:`, err.message);
    return { success: false, errMsg: err.message };
  }
}

/**
 * Roblox Cookie İşlem Onay İsteği Gönder (Approval Gateway)
 *
 * • Otomatik mod aktifse (autoAccept / autoReject) istek direkt işlenir, DM gitmez.
 * • Yoksa onaylayıcıya 4 butonlu DM gönderilir (1 saat aktif).
 * • Onay/red sonucunda DM mesajı düzenlenir — requester'a ayrıca bildirim GİTMEZ.
 */
async function requestRobloxCookieApproval(client, { action, targetUser, reason, executeCallback, requesterId }) {
  const reqId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const expiresAt = Date.now() + REQUEST_TIMEOUT_MS;

  const reqObj = {
    reqId, action, targetUser, reason, executeCallback,
    requesterId: requesterId || null,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt,
    approverMsgId: null,
    approverDmChannelId: null,
    timeoutHandle: null
  };

  // ── Otomatik Mod Kontrolü ─────────────────────────────────────────────────
  const currentAuto = getAutoMode();
  if (currentAuto) {
    const isAutoAccept = currentAuto.mode === 'accept';
    console.log(`[robloxApprovalGateway] Auto-${currentAuto.mode} mode active — processing #${reqId} automatically.`);

    if (isAutoAccept) {
      const { success, errMsg } = await runCallback(reqObj);
      return {
        success: true,
        pending: false,
        reqId,
        message: success
          ? `✅ **İşlem Otomatik Kabul Edildi** (1 saat boyunca kabul modu aktif)\n\nRoblox API işlemi uygulandı.`
          : `⚠️ **Otomatik kabul edildi ancak Roblox API hatası:** \`${errMsg}\``
      };
    } else {
      return {
        success: false,
        pending: false,
        reqId,
        message: `❌ **İşlem Otomatik Reddedildi** (1 saat boyunca reddet modu aktif)`
      };
    }
  }

  // ── Normal Akış: DM Gönder ────────────────────────────────────────────────
  pendingRequests.set(reqId, reqObj);

  // 1 saatlik timeout
  const timeoutHandle = setTimeout(async () => {
    const req = pendingRequests.get(reqId);
    if (!req || req.status !== 'pending') return;
    req.status = 'expired';
    pendingRequests.delete(reqId);
    console.log(`[robloxApprovalGateway] Request #${reqId} expired after 1 hour.`);

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

    await editApproverMsg(client, req, expiredEmbed);
  }, REQUEST_TIMEOUT_MS);

  reqObj.timeoutHandle = timeoutHandle;

  try {
    const approver = await client.users.fetch(APPROVER_USER_ID).catch(() => null);
    if (!approver) {
      clearTimeout(timeoutHandle);
      pendingRequests.delete(reqId);
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

    const rows = buildApprovalRow(reqId);
    const sentMsg = await approver.send({ embeds: [embed], components: rows });
    console.log(`[robloxApprovalGateway] Approval request #${reqId} sent to approver ${APPROVER_USER_ID}`);

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
 * Onay / Red / Otomatik Mod Buton Etkileşimlerini Yönet.
 * Sonuç, onaylayıcının DM mesajını düzenleyerek gösterilir.
 * Requester'a ayrıca DM gitmez.
 */
async function handleApprovalButton(interaction) {
  const { customId, user } = interaction;

  const isKnownButton =
    customId.startsWith('rbx_appr_accept_') ||
    customId.startsWith('rbx_appr_reject_') ||
    customId.startsWith('rbx_appr_autoaccept_') ||
    customId.startsWith('rbx_appr_autoreject_');

  if (!isKnownButton) return false;

  // Yalnızca APPROVER_USER_ID kullanıcısı butonlara tıklayabilir
  if (user.id !== APPROVER_USER_ID) {
    return interaction.reply({
      content: '❌ Bu Roblox Cookie işlemini sadece yetkili kullanıcı onaylayabilir!',
      ephemeral: true
    });
  }

  // reqId: son segmenti al
  const reqId = customId.split('_').slice(3).join('_');

  // ── OTOMATIK KABUL (1 Saat Boyunca) ─────────────────────────────────────
  if (customId.startsWith('rbx_appr_autoaccept_')) {
    setAutoMode('accept');

    // Bu isteği de hemen kabul et
    const reqObj = pendingRequests.get(reqId);
    if (reqObj && reqObj.status === 'pending') {
      if (reqObj.timeoutHandle) clearTimeout(reqObj.timeoutHandle);
      reqObj.status = 'approved';
      pendingRequests.delete(reqId);

      const processingEmbed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`⏳ İŞLEM UYGULANIYYOR... (#${reqId})`)
        .setDescription('Otomatik kabul modu etkinleştirildi + bu istek uygulanıyor...')
        .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
        .setTimestamp();
      await interaction.update({ embeds: [processingEmbed], components: [] });

      const { success, errMsg } = await runCallback(reqObj);

      const autoAcceptEmbed = new EmbedBuilder()
        .setColor(success ? 0x2ecc71 : 0xe67e22)
        .setTitle(success
          ? `✅ ONAYLANDI + OTOMATİK KABUL MODU AKTİF (#${reqId})`
          : `⚠️ OTOMATİK KABUL AKTİF — ANCAK HATA OLUŞTU (#${reqId})`)
        .setDescription(
          `🟢 **1 saat boyunca kabul et modu etkinleştirildi.**\n` +
          `Bu istek de kabul edildi. <t:${Math.floor((Date.now() + REQUEST_TIMEOUT_MS) / 1000)}:R> kadar aktif.\n\n` +
          (success ? 'Roblox API işlemi başarıyla uygulandı.' : `Roblox API hatası: \`\`\`${errMsg}\`\`\``)
        )
        .addFields(
          { name: '🔧 Yapılan Eylem', value: reqObj.action, inline: false },
          { name: '👤 Hedef Kullanıcı', value: reqObj.targetUser, inline: false },
          { name: '✅ Onaylayan', value: `<@${user.id}>`, inline: true },
          { name: '🕐 Onay Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
        .setTimestamp();

      await interaction.message.edit({ embeds: [autoAcceptEmbed], components: [] }).catch(() => {});
    } else {
      // Bu istek zaten kapandıysa sadece modu aç, mesajı güncelle
      const modeOnlyEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('🟢 OTOMATİK KABUL MODU ETKİNLEŞTİRİLDİ')
        .setDescription(
          `Bundan sonra gelen tüm Roblox Cookie istekleri otomatik kabul edilecek.\n` +
          `⏰ Aktif kalma süresi: <t:${Math.floor((Date.now() + REQUEST_TIMEOUT_MS) / 1000)}:R>`
        )
        .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
        .setTimestamp();
      await interaction.update({ embeds: [modeOnlyEmbed], components: [] });
    }
    return true;
  }

  // ── OTOMATIK REDDET (1 Saat Boyunca) ────────────────────────────────────
  if (customId.startsWith('rbx_appr_autoreject_')) {
    setAutoMode('reject');

    const reqObj = pendingRequests.get(reqId);
    if (reqObj && reqObj.status === 'pending') {
      if (reqObj.timeoutHandle) clearTimeout(reqObj.timeoutHandle);
      reqObj.status = 'rejected';
      pendingRequests.delete(reqId);

      const autoRejectEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle(`❌ REDDEDİLDİ + OTOMATİK REDDET MODU AKTİF (#${reqId})`)
        .setDescription(
          `🔴 **1 saat boyunca reddet modu etkinleştirildi.**\n` +
          `Bu istek de reddedildi. <t:${Math.floor((Date.now() + REQUEST_TIMEOUT_MS) / 1000)}:R> kadar aktif.`
        )
        .addFields(
          { name: '🔧 Yapılan Eylem', value: reqObj.action, inline: false },
          { name: '👤 Hedef Kullanıcı', value: reqObj.targetUser, inline: false },
          { name: '❌ Reddeden', value: `<@${user.id}>`, inline: true },
          { name: '🕐 Red Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
        .setTimestamp();
      await interaction.update({ embeds: [autoRejectEmbed], components: [] });
    } else {
      const modeOnlyEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('🔴 OTOMATİK REDDET MODU ETKİNLEŞTİRİLDİ')
        .setDescription(
          `Bundan sonra gelen tüm Roblox Cookie istekleri otomatik reddedilecek.\n` +
          `⏰ Aktif kalma süresi: <t:${Math.floor((Date.now() + REQUEST_TIMEOUT_MS) / 1000)}:R>`
        )
        .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
        .setTimestamp();
      await interaction.update({ embeds: [modeOnlyEmbed], components: [] });
    }
    return true;
  }

  // ── TEKİL KABUL / REDDET ─────────────────────────────────────────────────
  const isAccept = customId.startsWith('rbx_appr_accept_');

  const reqObj = pendingRequests.get(reqId);
  if (!reqObj) {
    return interaction.reply({
      content: '❌ İstek süresi dolmuş, daha önce işlenmiş veya bulunamadı.',
      ephemeral: true
    });
  }

  if (reqObj.timeoutHandle) {
    clearTimeout(reqObj.timeoutHandle);
    reqObj.timeoutHandle = null;
  }

  if (isAccept) {
    reqObj.status = 'approved';
    pendingRequests.delete(reqId);

    // İşleniyor embed'i
    const processingEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`⏳ İŞLEM UYGULANIYYOR... (#${reqId})`)
      .setDescription('Onay alındı, Roblox API işlemi çalıştırılıyor...')
      .addFields(
        { name: '🔧 Yapılan Eylem', value: reqObj.action, inline: false },
        { name: '👤 Hedef Kullanıcı', value: reqObj.targetUser, inline: false }
      )
      .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
      .setTimestamp();

    await interaction.update({ embeds: [processingEmbed], components: [] });

    const { success, errMsg } = await runCallback(reqObj);

    const finalEmbed = new EmbedBuilder()
      .setColor(success ? 0x2ecc71 : 0xe67e22)
      .setTitle(success ? `✅ İŞLEM ONAYLANDI VE UYGULANDII (#${reqId})` : `⚠️ ONAYLANDI — ANCAK HATA OLUŞTU (#${reqId})`)
      .setDescription(success
        ? 'İşlem başarıyla onaylandı ve Roblox API üzerinde uygulandı.'
        : `İşlem onaylandı ancak Roblox API sırasında bir hata oluştu:\n\`\`\`${errMsg}\`\`\``)
      .addFields(
        { name: '🔧 Yapılan Eylem', value: reqObj.action, inline: false },
        { name: '👤 Hedef Kullanıcı', value: reqObj.targetUser, inline: false },
        { name: '📋 Sebep', value: reqObj.reason || 'Belirtilmedi', inline: false },
        { name: '✅ Onaylayan', value: `<@${user.id}> (\`${user.tag}\`)`, inline: true },
        { name: '🕐 Onay Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setFooter({ text: 'Eko Yıldız • Roblox Cookie Güvenlik Onay Kapısı' })
      .setTimestamp();

    await interaction.message.edit({ embeds: [finalEmbed], components: [] }).catch(() => {});

  } else {
    reqObj.status = 'rejected';
    pendingRequests.delete(reqId);

    const rejectedEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`❌ İŞLEM REDDEDİLDİ (#${reqId})`)
      .setDescription('Bu Roblox Cookie işlemi yetkili tarafından reddedildi ve iptal edildi.')
      .addFields(
        { name: '🔧 Yapılan Eylem', value: reqObj.action, inline: false },
        { name: '👤 Hedef Kullanıcı', value: reqObj.targetUser, inline: false },
        { name: '📋 Sebep', value: reqObj.reason || 'Belirtilmedi', inline: false },
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
  handleApprovalButton,
  getAutoMode
};
