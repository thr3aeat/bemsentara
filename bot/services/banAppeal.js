'use strict';

/**
 * Ban İtiraz Sistemi — Gelişmiş Sürüm
 *
 * Özellikler:
 *  - Components V2 itiraz paneli (kanala gönderilen)
 *  - Mod → Kullanıcıya soru sorma (DM köprüsü)
 *  - Canlı DM ↔ Kanal köprüsü (kanala yazınca DM, DM cevabı kanala)
 *  - Kullanıcı log görüntüleme butonu (mesaj sil/yaz vb.)
 *  - Reddetme sebebi modal
 *  - deferUpdate bug fix
 */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
} = require('discord.js');

const APPEAL_GUILD_ID   = '1483482948320891074'; // Müttefik Orduları
const APPEAL_CHANNEL_ID = '1516411840064782427'; // #itiraz-ban

// In-memory: aktif DM köprüleri { userId → { channelId, messageId, guildId } }
const activeDmBridges = new Map();

// ─── Yardımcı: İtiraz paneli butonları ───────────────────────────────────────
function buildAppealButtons(userId, guildId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`appeal_accept_${userId}_${guildId}`)
      .setLabel('✅ Kabul Et')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`appeal_reject_${userId}_${guildId}`)
      .setLabel('❌ Reddet')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`appeal_ask_${userId}_${guildId}`)
      .setLabel('❓ Soru Sor')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`appeal_logs_${userId}_${guildId}`)
      .setLabel('📋 Kullanıcı Logları')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`appeal_dm_${userId}_${guildId}`)
      .setLabel('💬 Canlı DM Başlat')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
  );
}

// ─── Yardımcı: İtiraz embed'i oluştur ────────────────────────────────────────
function buildAppealEmbed(interaction, guildName, guildId, type, reason, additional, promise, status = 'pending') {
  const typeLabels = { ban: '🔨 Ban İtirazı', kick: '👢 Kick İtirazı', honeypot: '🍯 Honeypot İtirazı' };
  const statusMap = {
    pending:  { color: 0xfbbf24, label: '⏳ Beklemede' },
    accepted: { color: 0x4ade80, label: '✅ KABUL EDİLDİ' },
    rejected: { color: 0xff4444, label: '❌ REDDEDİLDİ' },
  };
  const s = statusMap[status] || statusMap.pending;

  return new EmbedBuilder()
    .setColor(s.color)
    .setTitle(`${typeLabels[type] || '📝 İtiraz'} — ${s.label}`)
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: '👤 Kullanıcı', value: `${interaction.user.tag}\n\`${interaction.user.id}\``, inline: true },
      { name: '🏠 Sunucu', value: `${guildName}\n\`${guildId}\``, inline: true },
      { name: '📋 İşlem', value: type === 'ban' ? 'Yasaklama' : type === 'honeypot' ? 'Tuzak Kanalı' : 'Atma', inline: true },
      { name: '📝 İtiraz Sebebi', value: reason.slice(0, 1024) },
      { name: '📎 Ek Bilgi', value: (additional || 'Yok').slice(0, 1024) },
      { name: '🤝 Söz', value: promise.slice(0, 512) },
    )
    .setFooter({ text: `İtiraz ID: ${interaction.user.id} | ${new Date().toLocaleString('tr-TR')}` })
    .setTimestamp();
}

// ─── 1. Banlanan kullanıcıya DM gönder ───────────────────────────────────────
async function sendAppealDM(user, guildName, guildId, reason, type = 'ban') {
  try {
    const C = require('../utils/componentsV2Factory');
    const TypographyHelper = require('../utils/typographyHelper');
    const typeLabels  = { ban: '🔨 Yasaklandınız', kick: '👢 Atıldınız', honeypot: '🍯 Tuzak Kanalı — Atıldınız' };
    const typeColors  = { ban: 0xff4444, kick: 0xff9500, honeypot: 0xff6b6b };

    const payload = {
      flags: C.FLAGS,
      components: [
        C.container(typeColors[type] || 0xff4444, [
          ...C.headerBlock(typeLabels[type] || '🔨 Yasaklandınız', '⚖️'),
          C.section(
            `**${guildName}** sunucusundan ${type === 'ban' ? 'yasaklandınız' : 'atıldınız'}.\n\n` +
            `📋 **Gerekçe:**\n${TypographyHelper.quote(reason || 'Belirtilmedi')}\n\n` +
            `Bu kararın hatalı olduğunu düşünüyorsanız **İtiraz Formunu** doldurabilirsiniz.`
          ),
          C.separator(true),
          C.text(`🏠 **Sunucu:** ${guildName} | ⏱️ <t:${Math.floor(Date.now() / 1000)}:F>`),
          C.separator(false),
          C.text(TypographyHelper.subtext('Sentara Ban & Ceza İtiraz Sistemi • Otomatik İletim')),
          C.actionRow([{
            custom_id: `ban_appeal_${guildId}_${type}`,
            label: '📝 İtiraz Formunu Doldur',
            style: ButtonStyle.Danger,
          }]),
        ]),
      ],
    };

    await user.send(payload);
    console.log(`[banAppeal] DM gönderildi: ${user.tag} (${type}, ${guildName})`);
    return true;
  } catch (err) {
    console.log(`[banAppeal] DM gönderilemedi (${user.tag}): ${err.message}`);
    return false;
  }
}

// ─── 2. İtiraz butonu → modal aç ─────────────────────────────────────────────
async function handleAppealButton(interaction) {
  const { customId } = interaction;
  if (!customId.startsWith('ban_appeal_')) return false;

  const parts = customId.replace('ban_appeal_', '').split('_');
  const guildId = parts[0];
  const type = parts.slice(1).join('_') || 'ban';

  const modal = new ModalBuilder()
    .setCustomId(`ban_appeal_modal_${guildId}_${type}`)
    .setTitle('📝 İtiraz Formu');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('appeal_reason')
        .setLabel('Neden itiraz ediyorsunuz?')
        .setPlaceholder('Haksız olduğunu düşündüğünüz sebebi açıklayın...')
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('appeal_additional')
        .setLabel('Ek bilgi veya kanıt (opsiyonel)')
        .setPlaceholder('Ekstra bilgi, ekran görüntüsü linki vb...')
        .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(500)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('appeal_promise')
        .setLabel('Tekrar yapmayacağınıza söz veriyor musunuz?')
        .setPlaceholder('Evet / Hayır + kısa açıklama')
        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(200)
    ),
  );

  await interaction.showModal(modal);
  return true;
}

// ─── 3. Modal submit → itirazı kanala gönder ─────────────────────────────────
async function handleAppealModalSubmit(interaction, client) {
  const { customId } = interaction;
  if (!customId.startsWith('ban_appeal_modal_')) return false;

  const parts = customId.replace('ban_appeal_modal_', '').split('_');
  const guildId = parts[0];
  const type = parts.slice(1).join('_') || 'ban';

  const reason     = interaction.fields.getTextInputValue('appeal_reason');
  const additional = interaction.fields.getTextInputValue('appeal_additional') || 'Yok';
  const promise    = interaction.fields.getTextInputValue('appeal_promise');

  let guildName = 'Bilinmeyen Sunucu';
  try {
    const g = await client.guilds.fetch(guildId).catch(() => null);
    if (g) guildName = g.name;
  } catch (_) {}

  const appealChannel = await client.channels.fetch(APPEAL_CHANNEL_ID).catch(() => null);
  if (!appealChannel) {
    await interaction.reply({ content: '❌ İtiraz kanalı bulunamadı, lütfen daha sonra tekrar deneyin.', ephemeral: true });
    return true;
  }

  const embed = buildAppealEmbed(interaction, guildName, guildId, type, reason, additional, promise, 'pending');
  const buttons = buildAppealButtons(interaction.user.id, guildId);

  const sent = await appealChannel.send({ embeds: [embed], components: [buttons] });

  // Canlı DM köprüsü için kaydet
  activeDmBridges.set(interaction.user.id, {
    channelId: APPEAL_CHANNEL_ID,
    messageId: sent.id,
    guildId,
    type,
    guildName,
    reason,
    additional,
    promise,
  });

  await interaction.reply({
    content: '✅ **İtirazınız başarıyla gönderildi!**\n\nYetkililer inceleyecek ve size geri dönüş yapacaktır.\n\n💬 Yetkililer sizinle iletişime geçmek isterse bu DM üzerinden mesaj alacaksınız.',
    ephemeral: true,
  });

  console.log(`[banAppeal] İtiraz iletildi: ${interaction.user.tag} → ${APPEAL_CHANNEL_ID}`);
  return true;
}

// ─── 4. Kabul / Red / Soru / Log / DM butonları ──────────────────────────────
async function handleAppealDecisionButton(interaction, client) {
  const { customId } = interaction;

  const isAccept = customId.startsWith('appeal_accept_');
  const isReject = customId.startsWith('appeal_reject_');
  const isAsk    = customId.startsWith('appeal_ask_');
  const isLogs   = customId.startsWith('appeal_logs_');
  const isDm     = customId.startsWith('appeal_dm_');

  if (!isAccept && !isReject && !isAsk && !isLogs && !isDm) return false;

  // Parse: appeal_XXXX_{userId}_{guildId}
  let prefix;
  if (isAccept) prefix = 'appeal_accept_';
  else if (isReject) prefix = 'appeal_reject_';
  else if (isAsk)    prefix = 'appeal_ask_';
  else if (isLogs)   prefix = 'appeal_logs_';
  else               prefix = 'appeal_dm_';

  const rest = customId.replace(prefix, '');
  const sepIdx = rest.indexOf('_');
  const userId  = rest.substring(0, sepIdx);
  const guildId = rest.substring(sepIdx + 1);

  // ── Soru Sor ───────────────────────────────────────────────────────────────
  if (isAsk) {
    const modal = new ModalBuilder()
      .setCustomId(`appeal_ask_modal_${userId}_${guildId}`)
      .setTitle('❓ Kullanıcıya Soru Sor');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('appeal_question')
          .setLabel('Kullanıcıya iletmek istediğiniz soruyu yazın')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(800)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  // ── Kullanıcı Logları ──────────────────────────────────────────────────────
  if (isLogs) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      let logText = `📋 **${userId} kullanıcısının son aktivite özeti:**\n\n`;

      if (guild) {
        // Discord Audit Log'dan son 10 işlem
        const audit = await guild.fetchAuditLogs({ limit: 15 }).catch(() => null);
        if (audit) {
          const entries = audit.entries.filter(e =>
            e.target?.id === userId || e.executor?.id === userId
          );
          if (entries.size > 0) {
            logText += '**📜 Sunucu Audit Log Kayıtları:**\n';
            entries.forEach(e => {
              const ts = Math.floor(e.createdTimestamp / 1000);
              logText += `• \`${e.action}\` — <t:${ts}:R> — ${e.reason || 'Sebep yok'}\n`;
            });
          } else {
            logText += '• Audit log kaydı bulunamadı.\n';
          }
        }

        // Ban kaydı var mı kontrol
        const ban = await guild.bans.fetch(userId).catch(() => null);
        if (ban) {
          logText += `\n**🔨 Ban Kaydı:** Aktif ban mevcut\nSebep: ${ban.reason || 'Belirtilmedi'}\n`;
        } else {
          logText += `\n**🔨 Ban Kaydı:** Aktif ban yok\n`;
        }
      }

      // İç ban/uyarı loglarından kontrol
      try {
        const Mutation = require('../../models/Mutation');
        const mutations = await Mutation.find({ userId }).sort({ createdAt: -1 }).limit(5).catch(() => []);
        if (mutations.length > 0) {
          logText += '\n**⚡ İç Ceza Geçmişi (son 5):**\n';
          mutations.forEach(m => {
            const ts = Math.floor(new Date(m.createdAt).getTime() / 1000);
            logText += `• \`${m.type || 'ceza'}\` — <t:${ts}:R> — ${m.reason || 'Sebep yok'}\n`;
          });
        }
      } catch (_) {}

      // Mesaj geçmişi (itiraz kanalında o kullanıcıdan mesaj varsa)
      const appealCh = await client.channels.fetch(APPEAL_CHANNEL_ID).catch(() => null);
      if (appealCh) {
        const msgs = await appealCh.messages.fetch({ limit: 50 }).catch(() => null);
        if (msgs) {
          const userMsgs = msgs.filter(m => m.author.id === userId);
          if (userMsgs.size > 0) {
            logText += `\n**💬 İtiraz Kanalında Son Mesajlar (${userMsgs.size}):**\n`;
            userMsgs.first(3).forEach(m => {
              const ts = Math.floor(m.createdTimestamp / 1000);
              logText += `• <t:${ts}:R>: ${m.content.slice(0, 100)}\n`;
            });
          }
        }
      }

      logText += `\n-# Kullanıcı ID: \`${userId}\` | Sunucu: \`${guildId}\``;

      await interaction.editReply({ content: logText.slice(0, 2000) });
    } catch (err) {
      console.error('[banAppeal] logs error:', err.message);
      await interaction.editReply({ content: `❌ Log alınamadı: ${err.message}` });
    }
    return true;
  }

  // ── Canlı DM Köprüsü Başlat ────────────────────────────────────────────────
  if (isDm) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) return interaction.editReply({ content: '❌ Kullanıcı bulunamadı.' });

      const C = require('../utils/componentsV2Factory');
      // Kullanıcıya köprünün açıldığını bildir
      await user.send({
        flags: C.FLAGS,
        components: [C.container(0x3b82f6, [
          C.section(
            `## 💬 Yetkili İletişim Kanalı Açıldı\n\n` +
            `Yetkililer itirazınız hakkında sizinle **canlı** iletişime geçmek istedi.\n\n` +
            `Bu DM'e yazdığınız her mesaj **itiraz kanalına** iletilecektir. Cevaplar da buraya gelecek.\n\n` +
            `-# <@${interaction.user.id}> (${interaction.user.tag}) köprüyü başlattı.`
          ),
        ])],
      }).catch(() => {});

      activeDmBridges.set(userId, {
        channelId: APPEAL_CHANNEL_ID,
        messageId: interaction.message?.id,
        guildId,
        modId: interaction.user.id,
        active: true,
      });

      await interaction.editReply({
        content: `✅ **Canlı DM köprüsü açıldı!**\n\n<@${userId}> kullanıcısı artık bu DM üzerinden mesaj gönderebilir. Yanıtları #itiraz-ban kanalına düşecek.\n\n> Köprüyü kapatmak için \`-appealclose ${userId}\` komutunu kullanın.`,
      });
    } catch (err) {
      console.error('[banAppeal] dm_bridge error:', err.message);
      await interaction.editReply({ content: `❌ Hata: ${err.message}` });
    }
    return true;
  }

  // ── Kabul ──────────────────────────────────────────────────────────────────
  if (isAccept) {
    await interaction.deferUpdate();
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (guild) {
        await guild.bans.remove(userId, `İtiraz kabul edildi — Yetkili: ${interaction.user.tag}`).catch(() => {});
      }

      const user = await client.users.fetch(userId).catch(() => null);
      if (user) {
        const C = require('../utils/componentsV2Factory');
        await user.send({
          flags: C.FLAGS,
          components: [C.container(0x4ade80, [
            C.section(
              `## ✅ İtirazınız Kabul Edildi!\n\n` +
              `İtirazınız **${interaction.user.tag}** tarafından incelendi ve **kabul edildi**.\n\n` +
              `Yasağınız kaldırılmıştır. Sunucuya tekrar katılabilirsiniz.\n\n` +
              `⚠️ Lütfen kurallarımıza uygun davranmaya devam edin.`
            ),
          ])],
        }).catch(() => {});
      }

      activeDmBridges.delete(userId);

      const oldEmbed = interaction.message?.embeds?.[0];
      const updated = oldEmbed
        ? EmbedBuilder.from(oldEmbed).setColor(0x4ade80).setTitle('✅ İTİRAZ KABUL EDİLDİ')
            .addFields({ name: '👮 Karar Veren', value: `${interaction.user.tag}`, inline: true },
                       { name: '🕐 Karar Zamanı', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true })
        : null;

      await interaction.editReply({
        embeds: updated ? [updated] : [],
        components: [buildAppealButtons(userId, guildId, true)],
      });
    } catch (err) {
      console.error('[banAppeal] accept error:', err.message);
    }
    return true;
  }

  // ── Red → Modal aç ─────────────────────────────────────────────────────────
  if (isReject) {
    const modal = new ModalBuilder()
      .setCustomId(`appeal_reject_modal_${userId}_${guildId}`)
      .setTitle('❌ İtirazı Reddet');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reject_reason')
          .setLabel('Red sebebini yazın (kullanıcıya iletilecek)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(800)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  return false;
}

// ─── 5. Modal submit'ler: Red sebebi + Soru Sor ──────────────────────────────
async function handleAppealModalExtras(interaction, client) {
  const { customId } = interaction;

  // ── Red sebebi modal ───────────────────────────────────────────────────────
  if (customId.startsWith('appeal_reject_modal_')) {
    const rest   = customId.replace('appeal_reject_modal_', '');
    const sepIdx = rest.indexOf('_');
    const userId  = rest.substring(0, sepIdx);
    const guildId = rest.substring(sepIdx + 1);

    const rejectReason = interaction.fields.getTextInputValue('reject_reason');
    await interaction.deferUpdate();

    try {
      const user = await client.users.fetch(userId).catch(() => null);
      if (user) {
        const C = require('../utils/componentsV2Factory');
        await user.send({
          flags: C.FLAGS,
          components: [C.container(0xff4444, [
            C.section(
              `## ❌ İtirazınız Reddedildi\n\n` +
              `İtirazınız **${interaction.user.tag}** tarafından incelendi ve **reddedildi**.\n\n` +
              `**Red Sebebi:**\n> ${rejectReason}\n\n` +
              `Yasağınız devam etmektedir.`
            ),
          ])],
        }).catch(() => {});
      }

      activeDmBridges.delete(userId);

      const oldEmbed = interaction.message?.embeds?.[0];
      const updated = oldEmbed
        ? EmbedBuilder.from(oldEmbed).setColor(0xff4444).setTitle('❌ İTİRAZ REDDEDİLDİ')
            .addFields(
              { name: '👮 Karar Veren', value: `${interaction.user.tag}`, inline: true },
              { name: '🕐 Karar Zamanı', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true },
              { name: '📝 Red Sebebi', value: rejectReason.slice(0, 1024) }
            )
        : null;

      await interaction.editReply({
        embeds: updated ? [updated] : [],
        components: [buildAppealButtons(userId, guildId, true)],
      });
    } catch (err) {
      console.error('[banAppeal] reject modal error:', err.message);
    }
    return true;
  }

  // ── Soru sor modal ─────────────────────────────────────────────────────────
  if (customId.startsWith('appeal_ask_modal_')) {
    const rest   = customId.replace('appeal_ask_modal_', '');
    const sepIdx = rest.indexOf('_');
    const userId  = rest.substring(0, sepIdx);
    const guildId = rest.substring(sepIdx + 1);

    const question = interaction.fields.getTextInputValue('appeal_question');
    await interaction.deferUpdate();

    try {
      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) {
        await interaction.followUp({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
        return true;
      }

      const C = require('../utils/componentsV2Factory');
      await user.send({
        flags: C.FLAGS,
        components: [C.container(0xf59e0b, [
          C.section(
            `## ❓ Yetkili Soru Sordu\n\n` +
            `**${interaction.user.tag}** itirazınız hakkında bir soru sormak istiyor:\n\n` +
            `> ${question}\n\n` +
            `Cevabınızı bu DM'e yazın — otomatik olarak itiraz kanalına iletilecektir.`
          ),
        ])],
      });

      // Kullanıcının cevabı iletebilmesi için köprüyü aktifleştir
      activeDmBridges.set(userId, {
        channelId: APPEAL_CHANNEL_ID,
        messageId: interaction.message?.id,
        guildId,
        modId: interaction.user.id,
        active: true,
      });

      // Kanala soru sorulduğunu bildir
      const appealCh = await client.channels.fetch(APPEAL_CHANNEL_ID).catch(() => null);
      if (appealCh) {
        await appealCh.send({
          content: `❓ **${interaction.user.tag}** → <@${userId}> kullanıcısına soru iletildi:\n> ${question}\n\n*Kullanıcının cevabı buraya düşecek.*`,
        }).catch(() => {});
      }

      await interaction.followUp({ content: '✅ Soru kullanıcıya DM olarak iletildi.', ephemeral: true });
    } catch (err) {
      console.error('[banAppeal] ask modal error:', err.message);
      await interaction.followUp({ content: `❌ Hata: ${err.message}`, ephemeral: true }).catch(() => {});
    }
    return true;
  }

  return false;
}

// ─── 6. Canlı DM köprüsü: Kullanıcı DM → Kanal ──────────────────────────────
async function handleAppealDmBridge(message, client) {
  // Sadece DM mesajları, bot değil
  if (message.guild || message.author.bot) return false;

  const bridge = activeDmBridges.get(message.author.id);
  if (!bridge || !bridge.active) return false;

  try {
    const channel = await client.channels.fetch(bridge.channelId).catch(() => null);
    if (!channel) return false;

    const C = require('../utils/componentsV2Factory');
    await channel.send({
      flags: C.FLAGS,
      components: [C.container(0x6366f1, [
        C.section(
          `## 💬 DM Köprüsü — Kullanıcı Yanıtladı\n\n` +
          `**<@${message.author.id}>** (${message.author.tag}) mesaj gönderdi:\n\n` +
          `> ${message.content.slice(0, 900)}`
        ),
      ])],
    });

    // Kullanıcıya teslim onayı
    await message.react('✅').catch(() => {});
    return true;
  } catch (err) {
    console.error('[banAppeal] dm_bridge incoming error:', err.message);
    return false;
  }
}

// ─── 7. Kanal mesajı → Kullanıcıya DM (mod kanalda yazınca) ─────────────────
async function handleAppealChannelBridge(message, client) {
  // Sadece itiraz kanalındaki mesajlar, bot değil
  if (!message.guild) return false;
  if (message.channel.id !== APPEAL_CHANNEL_ID) return false;
  if (message.author.bot) return false;
  // Sadece - prefix ile başlayan bridge mesajları: -dm {userId} {mesaj}
  if (!message.content.startsWith('-dm ')) return false;

  const parts   = message.content.slice(4).split(' ');
  const userId  = parts[0];
  const text    = parts.slice(1).join(' ').trim();

  if (!userId || !text) {
    await message.reply('❌ Kullanım: `-dm {kullanıcı_id} {mesaj}`').catch(() => {});
    return true;
  }

  try {
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) {
      await message.reply('❌ Kullanıcı bulunamadı.').catch(() => {});
      return true;
    }

    const C = require('../utils/componentsV2Factory');
    await user.send({
      flags: C.FLAGS,
      components: [C.container(0x6366f1, [
        C.section(
          `## 💬 Yetkili Mesajı\n\n` +
          `**${message.author.tag}** sana bir mesaj iletti:\n\n` +
          `> ${text}\n\n` +
          `-# Bu mesajı almak için itiraz köprüsü aktif olmalıdır. Cevaplamak için bu DM'e yazabilirsin.`
        ),
      ])],
    });

    await message.react('✅').catch(() => {});
  } catch (err) {
    await message.reply(`❌ DM gönderilemedi: ${err.message}`).catch(() => {});
  }
  return true;
}

// ─── 8. Exports ──────────────────────────────────────────────────────────────
module.exports = {
  sendAppealDM,
  handleAppealButton,
  handleAppealModalSubmit,
  handleAppealDecisionButton,
  handleAppealModalExtras,
  handleAppealDmBridge,
  handleAppealChannelBridge,
  activeDmBridges,
  APPEAL_CHANNEL_ID,
  APPEAL_GUILD_ID,
};
