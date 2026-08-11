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
 * 🚨 Elçi bir moderatörün cezasını iptal/düzeltme yaptığında moderatörün siciline işler
 * 3 Hatalı işlemde Moderatör otomatik PIP (Sıkı Takip) sürecine alınır.
 */
async function processModMistake(moderatorId, client) {
  try {
    const p = await StaffProgress.findOne({ userId: moderatorId });
    if (!p) return;

    p.stats = p.stats || {};
    p.stats.invalidActions = (p.stats.invalidActions || 0) + 1;

    // 3 Hatalı işlemde Moderatör otomatik PIP (Sıkı Takip) sürecine alınır
    if (p.stats.invalidActions >= 3 && !p.pip?.isActive) {
      p.pip = {
        isActive: true,
        signed: false,
        startedAt: new Date(),
        gracePeriodEnd: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 Saat tolerans
        consecutiveSuccessDays: 0
      };
      await p.save();

      // Moderatöre DM Gönder
      const modUser = await client.users.fetch(moderatorId).catch(() => null);
      if (modUser) {
        await modUser.send(
          `⚠️ **DİKKAT:** Topluluk Elçisi tarafından 3 adet hatalı/haksız ceza verdiğiniz tespit edildi.\n` +
          `Hesabınız otomatik olarak **PIP (Performans İyileştirme) Soruşturmasına** alınmıştır. Lütfen dikkatli olun!`
        ).catch(() => {});
      }
      console.log(`[toplulukElcisi] Moderator ${moderatorId} placed under PIP due to 3 invalid actions.`);
    } else {
      await p.save();
    }
  } catch (err) {
    console.error('[toplulukElcisi] processModMistake error:', err.message);
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

      // Moderatöre hatalı ceza kaydı işle (PIP kontrolü)
      if (auditObj.moderatorId) {
        await processModMistake(auditObj.moderatorId, client);
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

    if (auditObj.moderatorId) {
      await processModMistake(auditObj.moderatorId, client);
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

// ── ⚖️ MODERATÖR YÜKSEK MAHKEMESİ & İTİRAZ JÜRİSİ (JURY CHIEF) ────────────────

const pendingAppeals = new Map();

/**
 * İtiraz veya kovulma soruşturmasını Yüksek Mahkeme Paneline düşürür
 */
async function sendModAppealToAmbassador(client, appealObj) {
  try {
    const appealId = 'appeal_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    pendingAppeals.set(appealId, { ...appealObj, appealId, createdAt: Date.now() });

    const ambassadors = await getAmbassadors(client);
    if (ambassadors.length === 0) return;

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('⚖️ TOPLULUK ELÇİSİ YÜKSEK MAHKEMESİ & İTİRAZ PANELDEDİR')
      .setDescription(
        `Sayın Topluluk Elçisi (Baş Yargıç),\n\n` +
        `<@${appealObj.userId}> kullanıcısı **${appealObj.appealType || 'Cezaya/İşten Çıkarılmaya İtiraz'}** talebinde bulunmuştur.\n\n` +
        `**İtiraz Nedeni:** ${appealObj.reason || 'Belirtilmedi'}`
      )
      .addFields(
        { name: '👤 İtiraz Eden Üye/Yetkili', value: `<@${appealObj.userId}> (\`${appealObj.userId}\`)`, inline: true },
        { name: '📋 İtiraz Türü', value: appealObj.appealType || 'İtiraz', inline: true },
        { name: '👮 İlgili Moderatör/Sistem', value: appealObj.modId ? `<@${appealObj.modId}>` : 'Otomasyon', inline: true }
      )
      .setFooter({ text: 'Eko Yıldız • Yüksek Mahkeme & Ombudsman Paneli' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`elcisi_court_reinstate_${appealId}`).setLabel('⚖️ İşe İade Et / Cezayı İptal Et').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`elcisi_court_clearwarn_${appealId}`).setLabel('🧹 Sicil & Uyarıları Temizle').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`elcisi_court_reject_${appealId}`).setLabel('❌ İtirazı Reddet (Onayla)').setStyle(ButtonStyle.Danger)
    );

    for (const ambassador of ambassadors) {
      await ambassador.send({ embeds: [embed], components: [row] }).catch(() => {});
    }
  } catch (err) {
    console.error('[toplulukElcisi] sendModAppealToAmbassador error:', err.message);
  }
}

/**
 * Yetkiliyi işe iade eder (p.dismissedAt resetler ve yetkileri verir)
 */
async function reinstateStaff(userId, client, ambassadorUser) {
  try {
    const p = await StaffProgress.findOne({ userId });
    if (!p) return false;

    p.status = 'active';
    p.dismissedAt = null;
    p.dismissReason = null;
    p.resignedAt = null;
    p.resignReason = null;

    if (p.warnings) {
      p.warnings.count = 0;
      p.warnings.warnedDays = [];
    }

    await p.save();

    // Yetki rolünü geri ver
    for (const [, guild] of client.guilds.cache) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) {
        const { ROLES } = require('./staffSystem');
        const roleId = ROLES[p.level || 1];
        if (roleId) await member.roles.add(roleId, 'Topluluk Elçisi Yüksek Mahkemesi İşe İade Kararı').catch(() => {});
      }
    }

    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
      await user.send(
        `🏛️ **YÜKSEK MAHKEME KARARI:** Topluluk Elçisi <@${ambassadorUser.id}> tarafından yapılan inceleme sonucunda ` +
        `haksız çıkarılma/ceza tespit edilmiş olup **işe iadeniz ve yetkileriniz eksiksiz onaylanmıştır!**`
      ).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('[toplulukElcisi] reinstateStaff error:', err.message);
    return false;
  }
}

/**
 * Kullanıcının sicil uyarısını siler
 */
async function clearStaffWarnings(userId, client, ambassadorUser) {
  try {
    const p = await StaffProgress.findOne({ userId });
    if (p && p.warnings) {
      p.warnings.count = 0;
      p.warnings.warnedDays = [];
      p.warnings.inactivityCount = 0;
      await p.save();
    }

    const u = await User.findOne({ discordId: userId });
    if (u) {
      u.warnCount = 0;
      u.warnings = [];
      await u.save();
    }

    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
      await user.send(
        `🧹 **YÜKSEK MAHKEME KARARI:** Topluluk Elçisi <@${ambassadorUser.id}> kararıyla ` +
        `disiplin sicilinizdeki tüm uyarılar ve cezalar temizlenmiştir.`
      ).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('[toplulukElcisi] clearStaffWarnings error:', err.message);
    return false;
  }
}

/**
 * Yüksek Mahkeme buton etkileşimlerini işler
 */
async function handleAmbassadorCourtButton(interaction, client) {
  const { customId, user } = interaction;
  if (!customId.startsWith('elcisi_court_')) return false;

  let appealId = '';
  let action = '';

  if (customId.startsWith('elcisi_court_reinstate_')) {
    action = 'reinstate';
    appealId = customId.replace('elcisi_court_reinstate_', '');
  } else if (customId.startsWith('elcisi_court_clearwarn_')) {
    action = 'clearwarn';
    appealId = customId.replace('elcisi_court_clearwarn_', '');
  } else if (customId.startsWith('elcisi_court_reject_')) {
    action = 'reject';
    appealId = customId.replace('elcisi_court_reject_', '');
  }

  const appealObj = pendingAppeals.get(appealId);
  if (!appealObj) {
    await interaction.reply({ content: '❌ Bu mahkeme dosyası karara bağlanmış veya bulunamadı.', ephemeral: true });
    return true;
  }

  pendingAppeals.delete(appealId);

  if (action === 'reinstate') {
    await reinstateStaff(appealObj.userId, client, user);
    const updated = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x2ecc71)
      .setTitle('⚖️ YÜKSEK MAHKEME KARARI: İŞE İADE EDİLDİ')
      .addFields({ name: '️ Kararı Veren Yargıç Elçi', value: `<@${user.id}>`, inline: false });
    await interaction.update({ embeds: [updated], components: [] }).catch(() => {});
  } else if (action === 'clearwarn') {
    await clearStaffWarnings(appealObj.userId, client, user);
    const updated = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x3498db)
      .setTitle('🧹 YÜKSEK MAHKEME KARARI: SİCİL TEMİZLENDİ')
      .addFields({ name: '️ Kararı Veren Yargıç Elçi', value: `<@${user.id}>`, inline: false });
    await interaction.update({ embeds: [updated], components: [] }).catch(() => {});
  } else {
    const targetUser = await client.users.fetch(appealObj.userId).catch(() => null);
    if (targetUser) {
      await targetUser.send(`❌ **Yüksek Mahkeme Kararı:** İtiraz talebiniz Topluluk Elçisi (<@${user.id}>) tarafından reddedildi ve ceza sabit tutuldu.`).catch(() => {});
    }
    const updated = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0xed4245)
      .setTitle('❌ YÜKSEK MAHKEME KARARI: İTİRAZ REDDEDİLDİ')
      .addFields({ name: '️ Kararı Veren Yargıç Elçi', value: `<@${user.id}>`, inline: false });
    await interaction.update({ embeds: [updated], components: [] }).catch(() => {});
  }

  return true;
}

// ── 💼 BİRİM VE LONCA FON YÖNETİCİSİ (BÜTÇE ŞEFİ) ──────────────────────────

const UnitBudget = require('../../models/UnitBudget');

/**
 * Birim Liderinin Topluluk Elçisinden Bütçe/Elmas talep etmesini sağlar
 */
async function requestUnitBudgetFromAmbassador(client, requesterUser, unitName, requestedAmount, reason = '') {
  try {
    await sendModRequestToAmbassador(
      client,
      'Birim Bütçe & Elmas Talebi',
      requesterUser,
      { reason: `**${unitName}** için **${requestedAmount} TL/Elmas** bütçe talep ediyor.\n**Açıklama:** ${reason || 'Etkinlik ve Ödül Havuzu'}` },
      async () => {
        // Onaylandığında Birim Kasasına Bütçe Ekle
        let ub = await UnitBudget.findOne({ unitName });
        if (!ub) {
          ub = new UnitBudget({ unitName, budget: 0, diamonds: 0 });
        }
        ub.budget = (ub.budget || 0) + requestedAmount;
        await ub.save();

        await requesterUser.send(
          `✅ **BÜTÇE ONAYLANDI!** Topluluk Elçisi (Bütçe Şefi) tarafından **${unitName}** kasasına ` +
          `**${requestedAmount} TL/Elmas** başarıyla aktarıldı!`
        ).catch(() => {});
      },
      async () => {
        await requesterUser.send(
          `❌ **BÜTÇE REDDEDİLDİ:** **${unitName}** için yaptığınız **${requestedAmount} TL/Elmas** bütçe talebi Topluluk Elçisi tarafından uygun görülmedi.`
        ).catch(() => {});
      }
    );
    return true;
  } catch (err) {
    console.error('[toplulukElcisi] requestUnitBudgetFromAmbassador error:', err.message);
    return false;
  }
}

// ── 🛡️ ELÇİ VETO HAKKI & SUNUCU KİLİDİ (LOCKDOWN) ───────────────────────────

let isLockdownActive = false;

/**
 * Elçi aşırı yetki kullanımında veya kitlesel ban/mute durumlarında Lockdown modunu dondurur/açar
 */
async function toggleAmbassadorLockdown(client, ambassadorUser, guild, reason = 'Aşırı Yetki Kullanımı / Güvenlik Tedbiri') {
  try {
    isLockdownActive = !isLockdownActive;

    const embed = new EmbedBuilder()
      .setColor(isLockdownActive ? 0xed4245 : 0x2ecc71)
      .setTitle(isLockdownActive ? '🚨 SUNUCU KORUMA KİLİDİ (LOCKDOWN) AKTİF!' : '🛡️ SUNUCU KORUMA KİLİDİ KALDIRILDI')
      .setDescription(
        isLockdownActive
          ? `Topluluk Elçisi Veto Hakkı tetiklendi! <@${ambassadorUser.id}> tarafından sunucu koruma kilidi devreye sokuldu.\n\n**Gerekçe:** ${reason}`
          : `Topluluk Elçisi <@${ambassadorUser.id}> tarafından sunucu koruma kilidi kaldırıldı. Normal operasyona dönüldü.`
      )
      .setTimestamp();

    if (guild) {
      const logChannel = guild.channels.cache.get(MOD_CEZA_LOG_CHANNEL_ID)
        || guild.channels.cache.find(c => c.name.includes('ceza') || c.name.includes('mod-log') || c.name.includes('duyuru'));
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    return isLockdownActive;
  } catch (err) {
    console.error('[toplulukElcisi] toggleAmbassadorLockdown error:', err.message);
    return isLockdownActive;
  }
}

function getLockdownState() {
  return isLockdownActive;
}

// ── 🏛️ 1. SENATO & KRİZ KABİNESİ (SHADOW CABINET) ──────────────────────────

const recentModActions = new Map();

/**
 * 60 saniyede 5+ moderasyon işlemi tespit edildiğinde Protocol Zero uyarısı verir
 */
async function trackProtocolZeroAction(client, guild, moderatorUser, actionType) {
  try {
    const modId = moderatorUser.id;
    const now = Date.now();
    let timestamps = recentModActions.get(modId) || [];
    timestamps = timestamps.filter(t => now - t < 60 * 1000);
    timestamps.push(now);
    recentModActions.set(modId, timestamps);

    if (timestamps.length >= 5) {
      const ambassadors = await getAmbassadors(client);
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('🚨 PROTOCOL ZERO: ŞÜPHELİ KİTLESEL MODERASYON UYARISI')
        .setDescription(
          `**DİKKAT!** <@${modId}> (${moderatorUser.tag}) 1 dakika içinde **${timestamps.length} adet** moderasyon işlemi gerçekleştirdi!\n\n` +
          `Hesabın hacklenmiş veya aşırı yetki kötüye kullanımı ihtimaline karşı sunucuyu **Karantina Moduna** alabilir ve yetkilinin erişimini askıya alabilirsiniz.`
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`elcisi_protocol0_quarantine_${modId}`).setLabel('🛑 KARANTİNAYA AL & YETKİLERİ DONDUR').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`elcisi_protocol0_ignore_${modId}`).setLabel('✅ Yoksay (Normal İşlem)').setStyle(ButtonStyle.Secondary)
      );

      for (const ambassador of ambassadors) {
        await ambassador.send({ embeds: [embed], components: [row] }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[toplulukElcisi] trackProtocolZeroAction error:', err.message);
  }
}

/**
 * Protocol Zero karantinasını aktif eder ve yetkilinin erişimini askıya alır
 */
async function activateProtocolZero(client, ambassadorUser, moderatorId, guild) {
  try {
    const p = await StaffProgress.findOne({ userId: moderatorId });
    if (p) {
      p.status = 'suspended';
      await p.save();
    }

    if (guild) {
      const member = await guild.members.fetch(moderatorId).catch(() => null);
      if (member) {
        const { ROLES } = require('./staffSystem');
        const roleIds = Object.values(ROLES);
        for (const rId of roleIds) {
          if (member.roles.cache.has(rId)) {
            await member.roles.remove(rId, 'Protocol Zero Karantina').catch(() => {});
          }
        }
      }
    }

    await toggleAmbassadorLockdown(client, ambassadorUser, guild, `<@${moderatorId}> şüpheli kitlesel işlem nedeniyle karantinaya alındı.`);

    const modUser = await client.users.fetch(moderatorId).catch(() => null);
    if (modUser) {
      await modUser.send(
        `🚨 **PROTOCOL ZERO UYARISI:** Kısa süre içerisinde yaptığınız yoğun moderasyon işlemleri nedeniyle ` +
        `Topluluk Elçisi (<@${ambassadorUser.id}>) tarafından hesabınız **Karantinaya Alınmış** ve yetkileriniz geçici olarak dondurulmuştur.`
      ).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('[toplulukElcisi] activateProtocolZero error:', err.message);
    return false;
  }
}

/**
 * Merkez Bankası Kriz Vergisi Müdahale Oylaması Başlatır
 */
async function triggerCentralBankVote(client, marketSnapshot) {
  try {
    const ambassadors = await getAmbassadors(client);
    if (ambassadors.length === 0) return;

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🏛️ SENATO & MERKEZ BANKASI MÜDAHALE OYLAMASI')
      .setDescription(
        `Sayın Topluluk Elçisi,\n\n` +
        `Sunucu ekonomisi ikaz veriyor! **Piyasa Durumu:** \`${marketSnapshot.state}\` (Risk Puanı: ${marketSnapshot.riskScore})\n\n` +
        `Kriz Vergisini düşürerek yetkilileri ve ekonomiyi teşvik etmek ister misiniz?`
      )
      .addFields(
        { name: 'Mevcut Çarpan', value: `${marketSnapshot.multiplier}x`, inline: true },
        { name: 'Mevcut Kriz Vergisi', value: `%${(marketSnapshot.crisisTaxRate * 100).toFixed(0)}`, inline: true }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('elcisi_senate_tax_low').setLabel('📉 Kriz Vergisini İndir (%5) & Teşvik Ver (2.0x)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('elcisi_senate_tax_high').setLabel('📈 Kriz Vergisini Artır (%20)').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('elcisi_senate_tax_normal').setLabel('⚖️ Mevcut Piyasayı Koru').setStyle(ButtonStyle.Secondary)
    );

    for (const ambassador of ambassadors) {
      await ambassador.send({ embeds: [embed], components: [row] }).catch(() => {});
    }
  } catch (err) {
    console.error('[toplulukElcisi] triggerCentralBankVote error:', err.message);
  }
}

// ── 🎭 2. YERALTI TEŞKİLATI & GİZLİ MÜŞTERİ OPERASYONLARI (UNDERCOVER AUDITS) ─

async function generateGhostReport(client, ambassadorUser, targetModId) {
  try {
    const p = await StaffProgress.findOne({ userId: targetModId });
    if (!p) return null;

    const invalidActions = p.stats?.invalidActions || 0;
    const ticketsSolved = p.stats?.ticketsSolved || 0;
    const warnings = p.warnings?.count || 0;

    let grade = '🟢 A (Mükemmel)';
    let recommendation = 'Yetkili başarıyla görev yapmaktadır.';
    if (invalidActions > 1 || warnings > 0) {
      grade = '🟡 C (Orta - Riskli)';
      recommendation = 'Hatalı işlemler mevcut. Yakın takip önerilir.';
    }
    if (invalidActions >= 3 || p.pip?.isActive) {
      grade = '🔴 F (Yetersiz - PIP Sürecinde)';
      recommendation = 'Zorunlu AI Pratik Senaryosu atanması önerilir.';
    }

    const embed = new EmbedBuilder()
      .setColor(0x8e44ad)
      .setTitle(`🕵️ GİZLİ DENETİM & PERFORMANS KARNESİ`)
      .setDescription(`**Hedef Moderatör:** <@${targetModId}>\n**Performans Notu:** ${grade}`)
      .addFields(
        { name: '🎫 Çözülen Ticket', value: `${ticketsSolved}`, inline: true },
        { name: '⚠️ Disiplin Uyarısı', value: `${warnings}`, inline: true },
        { name: '❌ Hatalı Ceza Sayısı', value: `${invalidActions}`, inline: true },
        { name: '📝 Değerlendirme Notu', value: recommendation, inline: false }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`elcisi_ghost_pass_${targetModId}`).setLabel('⭐ Başarılı (+500 XP Bonus)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`elcisi_ghost_fail_${targetModId}`).setLabel('📚 Zorunlu AI Pratik Eğitimi Ata').setStyle(ButtonStyle.Danger)
    );

    return { embeds: [embed], components: [row] };
  } catch (err) {
    console.error('[toplulukElcisi] generateGhostReport error:', err.message);
    return null;
  }
}

async function assignAIPracticeScenario(targetModId, client, ambassadorUser) {
  try {
    const p = await StaffProgress.findOne({ userId: targetModId });
    if (p) {
      p.schoolSystem = p.schoolSystem || {};
      p.schoolSystem.status = 'phase1_blocks_completed';
      await p.save();
    }

    const modUser = await client.users.fetch(targetModId).catch(() => null);
    if (modUser) {
      await modUser.send(
        `📚 **TOPLULUK ELÇİSİ TALİMATI:** Topluluk Elçisi <@${ambassadorUser.id}> tarafından yapılan gizli denetim sonucunda ` +
        `hesabınıza **Zorunlu AI Pratik Moderasyon Senaryosu** tanımlanmıştır. Lütfen en kısa sürede eğitim sınavınızı tamamlayın.`
      ).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('[toplulukElcisi] assignAIPracticeScenario error:', err.message);
    return false;
  }
}

// ── ⚔️ 3. LONCA SAVAŞLARI & DEVLET HAZİNESİ (GUILD MASTER & TREASURY) ─────────

async function requestStateTreasuryFund(client, requesterUser, unitName, amount = 5000, reason = '') {
  try {
    await sendModRequestToAmbassador(
      client,
      'Devlet Hazinesi Ödül Fonu',
      requesterUser,
      { reason: `**${unitName}** için Devlet Hazinesinden **${amount} E.C./Elmas** fon talep ediliyor.\n**Gerekçe:** ${reason || 'Etkinlik Ödülü'}` },
      async () => {
        let ub = await UnitBudget.findOne({ unitName });
        if (!ub) ub = new UnitBudget({ unitName, budget: 0, diamonds: 0 });
        ub.budget = (ub.budget || 0) + amount;
        ub.diamonds = (ub.diamonds || 0) + Math.floor(amount / 100);
        await ub.save();

        let p = await StaffProgress.findOne({ userId: requesterUser.id });
        if (p) {
          p.gamification = p.gamification || {};
          p.gamification.ecoCoins = (p.gamification.ecoCoins || 0) + amount;
          await p.save();
        }

        await requesterUser.send(`💰 **DEVLET HAZİNESİ FONU AKTARILDI!** Topluluk Elçisi tarafından **${unitName}** biriminize **${amount} E.C. / Elmas** başarıyla aktarıldı!`).catch(() => {});
      },
      async () => {
        await requesterUser.send(`❌ **DEVLET HAZİNESİ FONU REDDEDİLDİ:** Hazine talebiniz Topluluk Elçisi tarafından uygun görülmedi.`).catch(() => {});
      }
    );
    return true;
  } catch (err) {
    console.error('[toplulukElcisi] requestStateTreasuryFund error:', err.message);
    return false;
  }
}

// ── 🕯️ 4. YÜKSEK MAHKEME & KAMU HİZMETİ BERAATİ & PIP REHABILITATION ───────────

async function grantPardonWithCommunityService(userId, client, ambassadorUser, serviceTaskName = 'task_chat') {
  try {
    const p = await StaffProgress.findOne({ userId });
    if (!p) return false;

    p.status = 'active';
    p.dismissedAt = null;
    p.dismissReason = null;

    if (p.pip) {
      p.pip.isActive = false;
      p.pip.signed = false;
    }

    p.daily = p.daily || {};
    p.daily.chosenTask = serviceTaskName;
    p.daily.chosenTaskCompleted = false;

    await p.save();

    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
      await user.send(
        `🕯️ **YÜKSEK MAHKEME BERAAT KARARI:** Topluluk Elçisi <@${ambassadorUser.id}> kararıyla cezanız ` +
        `**Kamu Hizmeti Görevine** çevrilmiştir! Görevinizi (${serviceTaskName}) tamamladığınızda beraatiniz kesinleşecektir.`
      ).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('[toplulukElcisi] grantPardonWithCommunityService error:', err.message);
    return false;
  }
}

async function releaseFromPIP(userId, client, ambassadorUser) {
  try {
    const p = await StaffProgress.findOne({ userId });
    if (p) {
      p.pip = { isActive: false, signed: false };
      p.stats = p.stats || {};
      p.stats.invalidActions = 0;
      await p.save();
    }

    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
      await user.send(
        `🛡️ **TOPLULUK ELÇİSİ KARARI:** <@${ambassadorUser.id}> kararıyla **PIP (Performans Takibi)** süreciniz sonlandırılmış ` +
        `ve sicilinizdeki hatalı ceza puanları sıfırlanmıştır!`
      ).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('[toplulukElcisi] releaseFromPIP error:', err.message);
    return false;
  }
}

/**
 * Yeni Senato, Protocol Zero ve Ghost buton etkileşimlerini yönlendirir
 */
async function handleAmbassadorAdvancedButton(interaction, client) {
  const { customId, user, guild } = interaction;

  if (customId.startsWith('elcisi_protocol0_quarantine_')) {
    const modId = customId.replace('elcisi_protocol0_quarantine_', '');
    await activateProtocolZero(client, user, modId, guild);
    await interaction.update({ content: `🛑 <@${modId}> karantinaya alındı ve yetkileri donduruldu.`, components: [], embeds: [] }).catch(() => {});
    return true;
  }

  if (customId.startsWith('elcisi_protocol0_ignore_')) {
    await interaction.update({ content: '✅ İşlem normal kabul edildi.', components: [], embeds: [] }).catch(() => {});
    return true;
  }

  if (customId.startsWith('elcisi_senate_tax_')) {
    const { applyCentralBankIntervention } = require('./marketSystem');
    let msg = '';
    if (customId === 'elcisi_senate_tax_low') {
      applyCentralBankIntervention(0.05, 2.0, 24);
      msg = '📉 **Merkez Bankası Müdahalesi:** Kriz vergisi %5\'e indirildi ve gelişim çarpanı 2.0x yapıldı!';
    } else if (customId === 'elcisi_senate_tax_high') {
      applyCentralBankIntervention(0.20, 1.0, 24);
      msg = '📈 **Merkez Bankası Kararı:** Kriz vergisi %20\'ye çıkarıldı ve borsa frenlendi.';
    } else {
      msg = '⚖️ Mevcut piyasa şartları korundu.';
    }
    await interaction.update({ content: msg, components: [], embeds: [] }).catch(() => {});
    return true;
  }

  if (customId.startsWith('elcisi_ghost_fail_')) {
    const targetModId = customId.replace('elcisi_ghost_fail_', '');
    await assignAIPracticeScenario(targetModId, client, user);
    await interaction.update({ content: `📚 <@${targetModId}> için **Zorunlu AI Pratik Senaryosu** tanımlandı.`, components: [], embeds: [] }).catch(() => {});
    return true;
  }

  if (customId.startsWith('elcisi_ghost_pass_')) {
    const targetModId = customId.replace('elcisi_ghost_pass_', '');
    let p = await StaffProgress.findOne({ userId: targetModId });
    if (p) {
      p.gamification = p.gamification || {};
      p.gamification.currentXP = (p.gamification.currentXP || 0) + 500;
      await p.save();
    }
    await interaction.update({ content: `⭐ <@${targetModId}> takdir edildi ve +500 XP bonus tanımlandı!`, components: [], embeds: [] }).catch(() => {});
    return true;
  }

  return false;
}

module.exports = {
  TOPLULUK_ELCISI_ROLE_ID,
  getAmbassadors,
  sendModAuditToAmbassador,
  processModMistake,
  handleAmbassadorAuditButton,
  handleAmbassadorFixSelect,
  sendAwardPanelDM,
  sendModRequestToAmbassador,
  handleAmbassadorRequestButton,
  sendModAppealToAmbassador,
  reinstateStaff,
  clearStaffWarnings,
  handleAmbassadorCourtButton,
  requestUnitBudgetFromAmbassador,
  toggleAmbassadorLockdown,
  getLockdownState,
  trackProtocolZeroAction,
  activateProtocolZero,
  triggerCentralBankVote,
  generateGhostReport,
  assignAIPracticeScenario,
  requestStateTreasuryFund,
  grantPardonWithCommunityService,
  releaseFromPIP,
  handleAmbassadorAdvancedButton
};
