'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { chatWithAI } = require('./aiService');

const MOD_APPROVAL_CHANNEL_ID = '1518684031275761719';
const pendingModRequests = new Map();

/**
 * Moderasyon işleminin AI ve Yetki düzeyini analiz eder
 */
async function checkAiAndRankApproval(moderatorUser, member, reason, actionType) {
  // 1. Yetkili Rütbe Kontrolü
  let isHighRank = false;
  if (moderatorUser.id === '1031620522406072350') {
    isHighRank = true;
  } else if (member && member.permissions && member.permissions.has('Administrator')) {
    isHighRank = true;
  } else {
    try {
      const StaffProgress = require('../../models/StaffProgress');
      const p = await StaffProgress.findOne({ userId: moderatorUser.id });
      if (p && (p.level >= 4 || p.reputation?.rebirthLevel > 0)) {
        isHighRank = true;
      }
    } catch (_) {}
  }

  // 2. Yapay Zeka (AI) Ağır İhlal Analizi
  let isExtremeViolation = false;
  let aiReasoning = 'Standart Moderasyon Sebebi';

  try {
    const prompt = `Sen Discord sunucu güvenlik yapay zekasısın. Aşağıdaki moderasyon sebebini analiz et.
Sebep sıradan bir tartışma veya normal küfür mü, yoksa normal küfürlerin ÖTESİNDE aşırı kötü/ağır bir ihlal (örneğin sunucuya raid/nuke yapma, aşırı ağır nefret söylemi, illegal tehdit) mi?

Sebep: "${reason}"

Cevabını YALNIZCA şu formatta ver:
DURUM: [AĞIR İHLAL / NORMAL]
AÇIKLAMA: [Kısa özet]`;

    const aiResponse = await chatWithAI(prompt, 'Güvenlik AI Analizcisi');
    if (aiResponse) {
      aiReasoning = aiResponse;
      if (aiResponse.toUpperCase().includes('AĞIR İHLAL')) {
        isExtremeViolation = true;
      }
    }
  } catch (err) {
    console.warn('[modApprovalGateway] AI analysis error:', err.message);
  }

  // Eğer mod rütbesi yüksekse VE (AI ağır ihlal derse veya yetkili kurucu/admin ise) -> Otomatik İzin
  const autoApprove = isHighRank && (isExtremeViolation || moderatorUser.id === '1031620522406072350');

  return {
    isHighRank,
    isExtremeViolation,
    autoApprove,
    aiReasoning
  };
}

/**
 * Moderasyon İşlemi Onay Talebi Oluştur
 */
async function processModActionWithApproval(interaction, { actionType, targetUser, reason, executeCallback }) {
  const moderator = interaction.user;
  const member = interaction.member;

  // AI & Rütbe analizi yap
  const evalResult = await checkAiAndRankApproval(moderator, member, reason, actionType);

  // Otomatik İzin (AI Ağır İhlal + Yüksek Rütbe)
  if (evalResult.autoApprove) {
    console.log(`[modApprovalGateway] ⚡ Auto-approved action '${actionType}' for target ${targetUser?.id} by mod ${moderator.id}`);
    
    // İşlemi anında gerçekleştir
    const resultMsg = await executeCallback();

    // Log kanalına (1518684031275761719) otomatik onay bildirimi at
    try {
      const channel = await interaction.client.channels.fetch(MOD_APPROVAL_CHANNEL_ID).catch(() => null);
      if (channel && channel.isTextBased()) {
        const autoEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle(`⚡ OTOMATİK MODERASYON ONAYI (${actionType})`)
          .setDescription(`🤖 **Yapay Zeka ve Yüksek Yetki Kontrolü:** İşlem doğrudan onaylandı ve uygulandı.`)
          .addFields(
            { name: 'Yapılan İşlem:', value: `${actionType}`, inline: true },
            { name: 'Hedef Kullanıcı:', value: `${targetUser ? `${targetUser.tag || targetUser.username} (\`${targetUser.id}\`)` : 'Belirtilmedi'}`, inline: true },
            { name: 'Yetkili:', value: `<@${moderator.id}> (\`${moderator.id}\`)`, inline: true },
            { name: 'Sebep:', value: `${reason}`, inline: false },
            { name: '🤖 AI Değerlendirmesi:', value: `${evalResult.aiReasoning}`, inline: false }
          )
          .setTimestamp();

        await channel.send({ embeds: [autoEmbed] }).catch(() => {});
      }
    } catch (_) {}

    return { autoApproved: true, message: resultMsg || `✅ İşlem başarıyla uygulandı.` };
  }

  // Aksi Halde: Onay İstek Mesajı Gönder (1518684031275761719)
  const reqId = 'modreq_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  const reqObj = {
    reqId,
    actionType,
    targetUser,
    moderator,
    reason,
    executeCallback,
    status: 'pending',
    createdAt: Date.now()
  };

  pendingModRequests.set(reqId, reqObj);

  try {
    const channel = await interaction.client.channels.fetch(MOD_APPROVAL_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return { autoApproved: false, message: `❌ Moderasyon Onay Kanalı (${MOD_APPROVAL_CHANNEL_ID}) bulunamadı.` };
    }

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`🛡️ MODERASYON İŞLEMİ ONAY İSTEĞİ (#${reqId})`)
      .setDescription(`Bir yetkili moderasyon işlemi yapmak istiyor. Lütfen aşağıdaki butonlardan onay verin veya reddedin.`)
      .addFields(
        { name: '📋 Yapılan İşlem:', value: `**${actionType}**`, inline: true },
        { name: '👤 Hedef Kullanıcı:', value: targetUser ? `<@${targetUser.id}> | \`${targetUser.tag || targetUser.id}\`` : 'Belirtilmedi', inline: true },
        { name: '👨‍💼 Yetkili:', value: `<@${moderator.id}> | \`${moderator.tag}\``, inline: true },
        { name: '📝 Sebep:', value: `${reason}`, inline: false },
        { name: '🤖 AI İncelemesi:', value: `${evalResult.aiReasoning}`, inline: false }
      )
      .setFooter({ text: 'Eko Yıldız • Moderasyon Güvenlik Onay Sistemi' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mod_appr_accept_${reqId}`)
        .setLabel('✅ Onayla ve Uygula')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`mod_appr_reject_${reqId}`)
        .setLabel('❌ Reddet ve İptal Et')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });

    return {
      autoApproved: false,
      message: `🔒 **Moderasyon İşlemi Onaya Gönderildi!**\nİşlem talebi yetkili kanalına (<#${MOD_APPROVAL_CHANNEL_ID}>) iletildi. Yöneticilerin onayı bekleniyor.`
    };
  } catch (err) {
    console.error('[modApprovalGateway] Error sending request:', err.message);
    return { autoApproved: false, message: `❌ Onay isteği gönderilirken hata oluştu: ${err.message}` };
  }
}

/**
 * Onay / Red Buton Etkileşimlerini Yönet
 */
async function handleModApprovalButton(interaction) {
  const { customId, user } = interaction;
  if (!customId.startsWith('mod_appr_accept_') && !customId.startsWith('mod_appr_reject_')) {
    return false;
  }

  // Yalnızca Admin / Yetkili kullanıcı onaylayabilir
  if (!interaction.member.permissions.has('Administrator') && user.id !== '1031620522406072350') {
    return interaction.reply({ content: '❌ Bu moderasyon işlemini sadece Yöneticiler onaylayabilir!', ephemeral: true });
  }

  const isAccept = customId.startsWith('mod_appr_accept_');
  const reqId = customId.replace(isAccept ? 'mod_appr_accept_' : 'mod_appr_reject_', '');

  const reqObj = pendingModRequests.get(reqId);
  if (!reqObj) {
    return interaction.reply({ content: '❌ İstek süresi dolmuş veya daha önce işlenmiş.', ephemeral: true });
  }

  if (isAccept) {
    reqObj.status = 'approved';
    pendingModRequests.delete(reqId);

    const updateEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`✅ MODERASYON İŞLEMİ ONAYLANDI VE UYGULANDI (#${reqId})`)
      .addFields(
        { name: 'İşlem:', value: `${reqObj.actionType}`, inline: true },
        { name: 'Hedef:', value: reqObj.targetUser ? `<@${reqObj.targetUser.id}> (\`${reqObj.targetUser.id}\`)` : 'Belirtilmedi', inline: true },
        { name: 'Yetkili:', value: `<@${reqObj.moderator.id}>`, inline: true },
        { name: 'Sebep:', value: `${reqObj.reason}`, inline: false },
        { name: 'Onaylayan Yönetici:', value: `<@${user.id}> (${user.tag})`, inline: false }
      )
      .setTimestamp();

    await interaction.update({ embeds: [updateEmbed], components: [] });

    try {
      await reqObj.executeCallback();
    } catch (execErr) {
      await interaction.followUp({ content: `⚠️ Onaylandı ancak işlem yapılırken hata oluştu: ${execErr.message}`, ephemeral: true });
    }
  } else {
    reqObj.status = 'rejected';
    pendingModRequests.delete(reqId);

    const updateEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`❌ MODERASYON İŞLEMİ REDDEDİLDİ (#${reqId})`)
      .addFields(
        { name: 'İşlem:', value: `${reqObj.actionType}`, inline: true },
        { name: 'Hedef:', value: reqObj.targetUser ? `<@${reqObj.targetUser.id}> (\`${reqObj.targetUser.id}\`)` : 'Belirtilmedi', inline: true },
        { name: 'Yetkili:', value: `<@${reqObj.moderator.id}>`, inline: true },
        { name: 'Sebep:', value: `${reqObj.reason}`, inline: false },
        { name: 'Reddeden Yönetici:', value: `<@${user.id}> (${user.tag})`, inline: false }
      )
      .setTimestamp();

    await interaction.update({ embeds: [updateEmbed], components: [] });
  }

  return true;
}

module.exports = {
  MOD_APPROVAL_CHANNEL_ID,
  processModActionWithApproval,
  handleModApprovalButton
};
