'use strict';

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} = require('discord.js');

const StaffProgress = require('../../models/StaffProgress');
const User = require('../../models/User');
const { GUILD2_ID, EKOYILDIZ_MOD_LOG_CHANNEL_ID } = require('../../config');
const { releaseUser, jailUser } = require('./jailService');

const TOPLULUK_ELCISI_ROLE_ID = process.env.TOPLULUK_ELCISI_ROLE_ID || '1518692391312298045';
const MOD_CEZA_LOG_CHANNEL_ID = EKOYILDIZ_MOD_LOG_CHANNEL_ID || '1518693023934844959';

const pendingAudits = new Map();
const pendingRequests = new Map();

/**
 * Topluluk Elçisi rollerine sahip tüm kullanıcıları bulur
 */
async function getAmbassadors(client) {
  const ambassadors = [];
  try {
    for (const [, guild] of client.guilds.cache) {
      await guild.members.fetch().catch(() => {});
      const role = guild.roles.cache.get(TOPLULUK_ELCISI_ROLE_ID)
        || guild.roles.cache.find(r => r.name.toLowerCase().includes('topluluk elçis') || r.name.toLowerCase().includes('elçi'));
      if (role) {
        role.members.forEach(member => {
          if (!ambassadors.some(m => m.id === member.id)) {
            ambassadors.push(member.user);
          }
        });
      }
    }
  } catch (err) {
    console.error('[toplulukElcisi] Ambassador fetch error:', err.message);
  }
  return ambassadors;
}

/**
 * Mod bir işlem yaptığında Topluluk Elçisine DM denetim bildirimi gönderir
 */
async function sendModAuditToAmbassador(client, guild, moderatorUser, targetUser, actionType, reason, extraData = {}) {
  try {
    const auditId = 'audit_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const auditObj = {
      auditId,
      guildId: guild ? guild.id : GUILD2_ID,
      moderatorId: moderatorUser.id,
      moderatorTag: moderatorUser.tag || moderatorUser.username,
      targetId: targetUser.id,
      targetTag: targetUser.tag || targetUser.username,
      actionType,
      reason,
      extraData,
      status: 'pending',
      createdAt: Date.now()
    };
    pendingAudits.set(auditId, auditObj);

    const ambassadors = await getAmbassadors(client);
    if (ambassadors.length === 0) {
      console.warn('[toplulukElcisi] Topluluk Elçisi rolüne sahip üye bulunamadı.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x7c6af7)
      .setTitle('🛡️ TOPLULUK ELÇİSİ MODERASYON DENETİMİ')
      .setDescription(
        `Sayın Topluluk Elçisi,\n\n` +
        `<@${moderatorUser.id}> adlı moderatör, **${reason}** sebebiyle <@${targetUser.id}> kullanıcısına **${actionType}** cezasını atmıştır.\n\n` +
        `Sizce bu işlem doğru mudur?`
      )
      .addFields(
        { name: '👮 Moderatör', value: `<@${moderatorUser.id}> (\`${moderatorUser.id}\`)`, inline: true },
        { name: '👤 İnceleyen/Cezalı', value: `<@${targetUser.id}> (\`${targetUser.id}\`)`, inline: true },
        { name: '⚡ Uygulanan Ceza', value: `**${actionType}**`, inline: true },
        { name: '📝 Gerekçe', value: `${reason}`, inline: false }
      )
      .setFooter({ text: 'Eko Yıldız • Topluluk Elçisi Denetim Sistemi' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`elcisi_audit_accept_${auditId}`)
        .setLabel('EVET, YAPILAN İŞLEM DOĞAL VE DOĞRUDUR KABUL EDİYORUM')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`elcisi_audit_reject_${auditId}`)
        .setLabel('HAYIR, DOĞRU DEĞİL VERİLEN CEZAYI DÜZELTMEK İSTİYORUM!')
        .setStyle(ButtonStyle.Danger)
    );

    for (const ambassador of ambassadors) {
      await ambassador.send({ embeds: [embed], components: [row] }).catch((err) => {
        console.warn(`[toplulukElcisi] Ambassador DM failed for ${ambassador.tag}:`, err.message);
      });
    }
  } catch (err) {
    console.error('[toplulukElcisi] sendModAuditToAmbassador error:', err.message);
  }
}

/**
 * Topluluk Elçisinin denetim butonuna tıklamasını işler
 */
async function handleAmbassadorAuditButton(interaction, client) {
  const { customId, user } = interaction;
  if (!customId.startsWith('elcisi_audit_accept_') && !customId.startsWith('elcisi_audit_reject_')) {
    return false;
  }

  const isAccept = customId.startsWith('elcisi_audit_accept_');
  const auditId = customId.replace(isAccept ? 'elcisi_audit_accept_' : 'elcisi_audit_reject_', '');

  const auditObj = pendingAudits.get(auditId);
  if (!auditObj) {
    await interaction.reply({ content: '❌ Bu denetim kaydı zaman aşımına uğramış veya daha önce işlenmiş.', ephemeral: true });
    return true;
  }

  const guild = client.guilds.cache.get(auditObj.guildId) || client.guilds.cache.get(GUILD2_ID);

  if (isAccept) {
    auditObj.status = 'approved';
    pendingAudits.delete(auditId);

    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x2ecc71)
      .setTitle('✅ CEZA TOPLULUK ELÇİSİ TARAFINDAN KABUL EDİLDİ')
      .addFields({ name: '️ Denetleyen Elçi', value: `<@${user.id}> (${user.tag})`, inline: false });

    await interaction.update({ embeds: [updatedEmbed], components: [] }).catch(() => {});

    // Mod loguna bildir
    if (guild) {
      const logChannel = guild.channels.cache.get(MOD_CEZA_LOG_CHANNEL_ID)
        || guild.channels.cache.find(c => c.name.includes('ceza') || c.name.includes('mod-log'));
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🛡️ TOPLULUK ELÇİSİ CEZA ONAYI')
          .setDescription(`<@${user.id}> adlı Topluluk Elçisi tarafından verilen ceza kabul edildi.`)
          .addFields(
            { name: 'Moderatör', value: `<@${auditObj.moderatorId}>`, inline: true },
            { name: 'Cezalandırılan', value: `<@${auditObj.targetId}>`, inline: true },
            { name: 'İşlem', value: auditObj.actionType, inline: true }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }
    return true;
  } else {
    // ── CEZAYI GERİ AL / REVERT ──
    try {
      const targetMember = guild ? await guild.members.fetch(auditObj.targetId).catch(() => null) : null;

      const actLower = auditObj.actionType.toLowerCase();
      if (actLower.includes('sustur') || actLower.includes('mute')) {
        if (targetMember) await targetMember.timeout(null, 'Topluluk Elçisi tarafından ceza kaldırıldı.').catch(() => {});
      } else if (actLower.includes('yasak') || actLower.includes('ban')) {
        if (guild) await guild.bans.remove(auditObj.targetId, 'Topluluk Elçisi tarafından ban kaldırıldı.').catch(() => {});
      } else if (actLower.includes('hapis') || actLower.includes('jail')) {
        if (guild) await releaseUser(guild, auditObj.targetId).catch(() => {});
      } else if (actLower.includes('uyarı') || actLower.includes('warn')) {
        const dbUser = await User.findOne({ discordId: auditObj.targetId });
        if (dbUser && dbUser.warnCount > 0) {
          dbUser.warnCount = Math.max(0, dbUser.warnCount - 1);
          if (dbUser.warnings && dbUser.warnings.length > 0) dbUser.warnings.pop();
          await dbUser.save();
        }
      }
    } catch (errRev) {
      console.error('[toplulukElcisi] Revert error:', errRev.message);
    }

    // Elçiye yeni ceza belirleme seçimi sun
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`elcisi_fix_penalty_${auditId}`)
      .setPlaceholder('Lütfen düzeltilmiş yeni cezayı seçin...')
      .addOptions([
        new StringSelectMenuOptionBuilder().setLabel('🔊 Cezayı Tamamen İptal Et (Ceza Yok)').setValue('NONE').setDescription('Kullanıcının cezası tamamen kaldırıldı.'),
        new StringSelectMenuOptionBuilder().setLabel('⚠️ Hafif Uyarı Ver').setValue('WARN').setDescription('Kullanıcıya hafif resmi disiplin uyarısı ver.'),
        new StringSelectMenuOptionBuilder().setLabel('🔇 10 Dakika Sustur (Mute)').setValue('MUTE_10M').setDescription('Kullanıcıyı 10 dakika sustur.'),
        new StringSelectMenuOptionBuilder().setLabel('🔇 30 Dakika Sustur (Mute)').setValue('MUTE_30M').setDescription('Kullanıcıyı 30 dakika sustur.'),
        new StringSelectMenuOptionBuilder().setLabel('🔒 30 Dakika Hapse At (Jail)').setValue('JAIL_30M').setDescription('Kullanıcıyı 30 dakika hapse gönder.')
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0xed4245)
      .setTitle('🔄 CEZA GERİ ALINDI & CEZA DÜZELTME PANELDEDİR')
      .setDescription(
        `Moderatörün verdiği **${auditObj.actionType}** cezası başarıyla **GERİ ALINDI**.\n\n` +
        `Lütfen aşağıdaki menüden düzeltilmiş yeni cezayı belirleyin:`
      );

    await interaction.update({ embeds: [updatedEmbed], components: [row] }).catch(() => {});
    return true;
  }
}

/**
 * Topluluk elçisi yeni düzeltilmiş cezayı seçtiğinde
 */
async function handleAmbassadorFixSelect(interaction, client) {
  if (!interaction.isStringSelectMenu() || !interaction.customId.startsWith('elcisi_fix_penalty_')) return false;

  const auditId = interaction.customId.replace('elcisi_fix_penalty_', '');
  const auditObj = pendingAudits.get(auditId);

  const selectedOption = interaction.values[0];
  const guild = client.guilds.cache.get(auditObj?.guildId || GUILD2_ID);
  const user = interaction.user;

  let newActionText = 'Ceza İptal Edildi (Cezasız)';

  if (auditObj && guild) {
    const targetMember = await guild.members.fetch(auditObj.targetId).catch(() => null);
    const targetUser = await client.users.fetch(auditObj.targetId).catch(() => null);

    if (selectedOption === 'WARN' && targetUser) {
      const { issueWarning } = require('./punishmentService');
      await issueWarning(interaction, targetUser, `Topluluk Elçisi Düzeltmesi: ${auditObj.reason}`, user);
      newActionText = 'Uyarı (Warn)';
    } else if (selectedOption === 'MUTE_10M' && targetMember) {
      await targetMember.timeout(10 * 60 * 1000, `Topluluk Elçisi Düzeltmesi: ${auditObj.reason}`);
      newActionText = '10 Dk Susturma';
    } else if (selectedOption === 'MUTE_30M' && targetMember) {
      await targetMember.timeout(30 * 60 * 1000, `Topluluk Elçisi Düzeltmesi: ${auditObj.reason}`);
      newActionText = '30 Dk Susturma';
    } else if (selectedOption === 'JAIL_30M' && targetUser) {
      await jailUser(guild, targetUser.id, `Topluluk Elçisi Düzeltmesi: ${auditObj.reason}`, 30, 500);
      newActionText = '30 Dk Hapis';
    }

    // Mod loguna yazdır
    const logChannel = guild.channels.cache.get(MOD_CEZA_LOG_CHANNEL_ID)
      || guild.channels.cache.find(c => c.name.includes('ceza') || c.name.includes('mod-log'));
    if (logChannel && logChannel.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle('🔄 TOPLULUK ELÇİSİ CEZA DÜZELTMESİ')
        .setDescription(`Geri alındı. <@${user.id}> adlı topluluk elçisi tarafından yeni cezası verildi.`)
        .addFields(
          { name: 'Moderatörün İlk Cezası', value: auditObj.actionType, inline: true },
          { name: 'Yeni Verilen Ceza', value: newActionText, inline: true },
          { name: 'Hedef Üye', value: `<@${auditObj.targetId}>`, inline: true },
          { name: 'Düzeltmeyi Yapan Elçi', value: `<@${user.id}>`, inline: false }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }

    pendingAudits.delete(auditId);
  }

  await interaction.update({
    content: `✅ **İşlem Tamamlandı!** İlk ceza geri alındı ve yeni ceza (${newActionText}) başarıyla uygulandı.`,
    embeds: [],
    components: []
  }).catch(() => {});

  return true;
}

/**
 * Ayın Elemanları Seçim Panelini Topluluk Elçisine DM olarak gönderir
 * Slash komutla DEĞİL, doğrudan DM ile çalışır.
 */
async function sendAwardPanelDM(client) {
  try {
    const ambassadors = await getAmbassadors(client);
    if (ambassadors.length === 0) {
      console.warn('[toplulukElcisi] Topluluk Elçisi rolüne sahip üye bulunamadı — ödül paneli gönderilemedi.');
      return 0;
    }

    const now = new Date();
    const ayAdi = now.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('🏆 AYIN ELEMANLARI & ÖDÜL YÖNETİM PANELİ')
      .setDescription(
        `Sayın Topluluk Elçisi,\n\n` +
        `**${ayAdi}** dönemi kapandı. Aşağıdaki butonlardan bu ayın en başarılı üyelerini seçebilirsiniz.\n\n` +
        `👑 **AYIN MODERATÖRÜ:** StaffSystem ödülü + **0.5x Gelişim Çarpanı** + **1000 E.C.**\n` +
        `💬 **AYIN EN İYİ SOHBET EDENİ:** **0.05x Gelişim Çarpanı**\n` +
        `🎤 **AYIN EN İYİ SESTE DURANI:** **0.05x Gelişim Çarpanı**\n\n` +
        `⚠️ Her kategori için bir kullanıcı seçin. Seçim sonrası sistem otomatik ödülleri tanımlar ve kazananlar DM ile bilgilendirilir.`
      )
      .setFooter({ text: `Eko Yıldız • ${ayAdi} Ödül Paneli` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('elcisi_award_mod').setLabel('👑 Ayın Moderatörünü Seç').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('elcisi_award_chat').setLabel('💬 Ayın En İyi Sohbet Edenini Seç').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('elcisi_award_voice').setLabel('🎤 Ayın En İyi Seste Duranını Seç').setStyle(ButtonStyle.Secondary)
    );

    let sentCount = 0;
    for (const ambassador of ambassadors) {
      await ambassador.send({ embeds: [embed], components: [row] }).then(() => {
        sentCount++;
        console.log(`[toplulukElcisi] Ödül paneli DM gönderildi → ${ambassador.tag}`);
      }).catch((err) => {
        console.warn(`[toplulukElcisi] Ödül paneli DM gönderilemedi → ${ambassador.tag}: ${err.message}`);
      });
    }
    return sentCount;
  } catch (err) {
    console.error('[toplulukElcisi] sendAwardPanelDM error:', err.message);
    return 0;
  }
}

/**
 * Moderatör Talep & İstifa & İzin & Terfi Onay Gönderimi
 */
async function sendModRequestToAmbassador(client, requestType, requesterUser, details = {}, onApprove, onReject) {
  try {
    const reqId = 'modreq_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    pendingRequests.set(reqId, {
      reqId,
      requestType,
      requesterId: requesterUser.id,
      requesterTag: requesterUser.tag || requesterUser.username,
      details,
      onApprove,
      onReject,
      createdAt: Date.now()
    });

    const ambassadors = await getAmbassadors(client);
    if (ambassadors.length === 0) return;

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`📋 TOPLULUK ELÇİSİ ONAY TALEBİ: ${requestType.toUpperCase()}`)
      .setDescription(
        `**${requesterUser.tag}** (<@${requesterUser.id}>) kullanıcısı bir **${requestType}** talebinde bulundu.\n\n` +
        `Onaylıyor musunuz?`
      )
      .addFields(
        { name: 'Talep Sahibi', value: `<@${requesterUser.id}>`, inline: true },
        { name: 'Talep Türü', value: requestType, inline: true },
        { name: 'Detaylar', value: details.reason || details.text || 'Detay bulunmuyor.', inline: false }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`elcisi_req_approve_${reqId}`).setLabel('✅ Onayla ve İzin Ver').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`elcisi_req_reject_${reqId}`).setLabel('❌ Reddet').setStyle(ButtonStyle.Danger)
    );

    for (const ambassador of ambassadors) {
      await ambassador.send({ embeds: [embed], components: [row] }).catch(() => {});
    }
  } catch (err) {
    console.error('[toplulukElcisi] sendModRequestToAmbassador error:', err.message);
  }
}

/**
 * Talep Butonlarını İşleme (İstifa, İzin, Terfi)
 */
async function handleAmbassadorRequestButton(interaction, client) {
  const { customId, user } = interaction;
  if (!customId.startsWith('elcisi_req_approve_') && !customId.startsWith('elcisi_req_reject_')) return false;

  const isApprove = customId.startsWith('elcisi_req_approve_');
  const reqId = customId.replace(isApprove ? 'elcisi_req_approve_' : 'elcisi_req_reject_', '');

  const reqObj = pendingRequests.get(reqId);
  if (!reqObj) {
    await interaction.reply({ content: '❌ Bu talep yanıtlanmış veya süresi dolmuş.', ephemeral: true });
    return true;
  }

  pendingRequests.delete(reqId);

  if (isApprove) {
    if (reqObj.onApprove) await reqObj.onApprove();

    // Terfi ise StaffProgress level artır
    if (reqObj.requestType.toLowerCase().includes('terfi')) {
      let p = await StaffProgress.findOne({ userId: reqObj.requesterId });
      if (p) {
        p.level = (p.level || 1) + 1;
        await p.save();
      }
    }

    const updated = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x2ecc71)
      .setTitle(`✅ TALEP ONAYLANDI (${reqObj.requestType.toUpperCase()})`)
      .addFields({ name: 'Onaylayan Elçi', value: `<@${user.id}>`, inline: false });

    await interaction.update({ embeds: [updated], components: [] }).catch(() => {});
  } else {
    if (reqObj.onReject) await reqObj.onReject();

    const updated = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0xed4245)
      .setTitle(`❌ TALEP REDDEDİLDİ (${reqObj.requestType.toUpperCase()})`)
      .addFields({ name: 'Reddeden Elçi', value: `<@${user.id}>`, inline: false });

    await interaction.update({ embeds: [updated], components: [] }).catch(() => {});
  }

  return true;
}

module.exports = {
  TOPLULUK_ELCISI_ROLE_ID,
  getAmbassadors,
  sendModAuditToAmbassador,
  handleAmbassadorAuditButton,
  handleAmbassadorFixSelect,
  sendAwardPanelDM,
  sendModRequestToAmbassador,
  handleAmbassadorRequestButton
};
