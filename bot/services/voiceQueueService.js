'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

// In-memory active queue state
const activeQueue = {
  active: false,
  guildId: null,
  channelId: null,
  currentIndex: -1,
  queue: [], // [{ userId, username, status: 'waiting'|'speaking'|'skipped'|'done', responded: false }]
  pendingTimer: null,
  timerTargetUserId: null
};

/**
 * Render Queue Panel Payload
 */
function renderQueuePanelPayload() {
  const embed = new EmbedBuilder()
    .setTitle('🎙️ CANLI SES SIRA YÖNETİM PANELİ')
    .setColor(0x7c6af7)
    .setFooter({ text: 'Eko Yıldız • Sesli Sıra & Konuşma Servisi' })
    .setTimestamp();

  if (!activeQueue.active || activeQueue.queue.length === 0) {
    embed.setDescription(
      `⚠️ **Henüz aktif bir sıra kurulmadı veya sıra boş.**\n\n` +
      `Aşağıdaki **\`[➕ Sıraya Kişi Ekle]\`** butonuna tıklayarak kullanıcı ID'lerini sıraya ekleyin.\n` +
      `Sıradaki üyelerin sesleri başlangıçta kapatılır (Mute), sıra geldikçe otomatik açılır.`
    );
  } else {
    let desc = `📊 **Sıradaki Toplam Üye:** \`${activeQueue.queue.length} Kişi\`\n\n`;
    activeQueue.queue.forEach((item, index) => {
      let icon = '⏳';
      let statusText = 'Bekliyor (Mute)';
      if (index === activeQueue.currentIndex) {
        icon = '🎙️';
        statusText = '**ŞU AN KONUŞUYOR (Mute Açık)**';
      } else if (item.status === 'done') {
        icon = '✅';
        statusText = 'Tamamlandı';
      } else if (item.status === 'skipped') {
        icon = '❌';
        statusText = 'Pas Geçildi (Reddetti)';
      }
      desc += `**${index + 1}.** ${icon} <@${item.userId}> — ${statusText}\n`;
    });
    embed.setDescription(desc);
  }

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('queue_add_member_btn').setLabel('➕ Sıraya Kişi Ekle').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('queue_next_person').setLabel('▶️ Sıradaki Kişiye Geç').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('queue_unmute_all').setLabel('🔊 Herkesin Mutesini Aç').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('queue_stop').setLabel('🛑 Sırayı Bitir').setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row1] };
}

/**
 * Initializes or starts queue setup panel in a channel
 */
async function setupQueuePanel(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({ content: '❌ Bu paneli kurmak için Yönetici yetkiniz olmalıdır.', ephemeral: true });
  }

  activeQueue.active = true;
  activeQueue.guildId = interaction.guild.id;
  activeQueue.channelId = interaction.channel.id;
  activeQueue.currentIndex = -1;
  activeQueue.queue = [];

  const payload = renderQueuePanelPayload();
  return interaction.reply(payload);
}

/**
 * Add members to queue
 */
async function addMembersToQueue(interaction, userIdsInput) {
  const guild = interaction.guild;
  const rawIds = userIdsInput.split(/[\s,;\n]+/);

  let addedCount = 0;
  for (const rawId of rawIds) {
    const cleanId = rawId.replace(/[^0-9]/g, '');
    if (!cleanId) continue;

    if (activeQueue.queue.some(q => q.userId === cleanId)) continue;

    const member = await guild.members.fetch(cleanId).catch(() => null);
    if (member) {
      // Mute user initially if in voice channel
      if (member.voice && member.voice.channelId) {
        await member.voice.setMute(true, 'Sıra sistemi: başlangıç ses kapatma').catch(() => {});
      }
      activeQueue.queue.push({
        userId: member.id,
        username: member.user.tag || member.user.username,
        status: 'waiting',
        responded: false
      });
      addedCount++;
    }
  }

  const payload = renderQueuePanelPayload();
  await interaction.channel.send(payload).catch(() => {});
  return interaction.reply({ content: `✅ ${addedCount} üye başarıyla sıraya eklendi ve ilk mutesi kapatıldı.`, ephemeral: true });
}

/**
 * Advance to next person in queue
 */
async function advanceToNextPerson(interactionOrGuild, client) {
  const guild = interactionOrGuild.guild || interactionOrGuild;
  const isInteraction = Boolean(interactionOrGuild.customId || interactionOrGuild.isButton);

  if (activeQueue.pendingTimer) {
    clearTimeout(activeQueue.pendingTimer);
    activeQueue.pendingTimer = null;
  }

  // Mute previous speaker
  if (activeQueue.currentIndex >= 0 && activeQueue.queue[activeQueue.currentIndex]) {
    const prevUser = activeQueue.queue[activeQueue.currentIndex];
    if (prevUser.status === 'speaking') {
      prevUser.status = 'done';
    }
    const prevMember = await guild.members.fetch(prevUser.userId).catch(() => null);
    if (prevMember && prevMember.voice && prevMember.voice.channelId) {
      await prevMember.voice.setMute(true, 'Sıra tamamlandı').catch(() => {});
    }
  }

  activeQueue.currentIndex += 1;

  if (activeQueue.currentIndex >= activeQueue.queue.length) {
    const endEmbed = new EmbedBuilder()
      .setTitle('🏁 SIRA SİSTEMİ TAMAMLINDI')
      .setDescription('Sıradaki tüm kullanıcıların konuşma süreleri sona erdi!')
      .setColor(0x2ecc71);

    if (isInteraction) {
      await interactionOrGuild.reply({ embeds: [endEmbed] }).catch(() => {});
    } else {
      const channel = await guild.channels.fetch(activeQueue.channelId).catch(() => null);
      if (channel) await channel.send({ embeds: [endEmbed] }).catch(() => {});
    }
    return;
  }

  const currentTarget = activeQueue.queue[activeQueue.currentIndex];
  currentTarget.status = 'speaking';
  currentTarget.responded = false;

  const targetMember = await guild.members.fetch(currentTarget.userId).catch(() => null);

  // Send DM to target user: SIRA GELDİ!
  if (targetMember) {
    const dmEmbed = new EmbedBuilder()
      .setTitle('🚨 SIRA GELDİ!')
      .setDescription(
        `Merhaba <@${targetMember.id}>,\n\n` +
        `Ses kanalında konuşma **SIRASI SİZE GELDİ!** 🎙️\n\n` +
        `Lütfen **5 saniye içinde** cevabınızı seçin:\n` +
        `• **[✅ Sırayı Kabul Ediyorum]** ➔ Sesi açar ve konuşmanızı başlatır.\n` +
        `• **[❌ Sırayı Reddediyorum]** ➔ Pas geçer ve sıradaki kişiye aktarır.`
      )
      .setColor(0xf1c40f)
      .setTimestamp();

    const dmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`queue_dm_accept_${targetMember.id}`)
        .setLabel('✅ Sırayı Kabul Ediyorum')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`queue_dm_reject_${targetMember.id}`)
        .setLabel('❌ Sırayı Reddediyorum')
        .setStyle(ButtonStyle.Danger)
    );

    await targetMember.send({ embeds: [dmEmbed], components: [dmRow] }).catch(() => {});
  }

  // 5-Second Timeout Rule: If no response in 5s, auto-unmute user!
  activeQueue.timerTargetUserId = currentTarget.userId;
  activeQueue.pendingTimer = setTimeout(async () => {
    if (activeQueue.currentIndex >= 0 && activeQueue.queue[activeQueue.currentIndex]?.userId === currentTarget.userId) {
      if (!currentTarget.responded) {
        currentTarget.responded = true;
        // Auto-unmute target
        if (targetMember && targetMember.voice && targetMember.voice.channelId) {
          await targetMember.voice.setMute(false, '5 saniye dolduğu için ses otomatik açıldı.').catch(() => {});
        }

        const autoEmbed = new EmbedBuilder()
          .setTitle('⏱️ 5 SÂNİYE DOLDU — SES OTOMATİK AÇILDI')
          .setDescription(`Sayın <@${currentTarget.userId}> 5 saniye içinde cevap vermediği için mikrofon mutesi **OTOMATİK OLARAK AÇILDI!** 🎙️`)
          .setColor(0x2ecc71);

        const channel = await guild.channels.fetch(activeQueue.channelId).catch(() => null);
        if (channel) await channel.send({ embeds: [autoEmbed] }).catch(() => {});
      }
    }
  }, 5000);

  const panelPayload = renderQueuePanelPayload();
  if (isInteraction) {
    await interactionOrGuild.reply(panelPayload).catch(() => {});
  } else {
    const channel = await guild.channels.fetch(activeQueue.channelId).catch(() => null);
    if (channel) await channel.send(panelPayload).catch(() => {});
  }
}

/**
 * DM Accept Handler
 */
async function handleDMAccept(interaction, userId) {
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: '❌ Bu buton sadece sizin içindir.', ephemeral: true });
  }

  const currentTarget = activeQueue.queue[activeQueue.currentIndex];
  if (!currentTarget || currentTarget.userId !== userId) {
    return interaction.reply({ content: '⚠️ Konuşma sırası artık sizde değil.', ephemeral: true });
  }

  currentTarget.responded = true;
  if (activeQueue.pendingTimer) {
    clearTimeout(activeQueue.pendingTimer);
    activeQueue.pendingTimer = null;
  }

  const member = await interaction.guild?.members.fetch(userId).catch(() => null);
  if (member && member.voice && member.voice.channelId) {
    await member.voice.setMute(false, 'Sırayı kabul ettiği için ses açıldı.').catch(() => {});
  }

  const acceptEmbed = new EmbedBuilder()
    .setTitle('✅ SIRA KABUL EDİLDİ')
    .setDescription(`<@${userId}> sırayı kabul etti ve mikrofondaki sesi açıldı! 🎙️`)
    .setColor(0x2ecc71);

  await interaction.reply({ embeds: [acceptEmbed] }).catch(() => {});

  const channel = interaction.client.channels.cache.get(activeQueue.channelId);
  if (channel) await channel.send({ embeds: [acceptEmbed] }).catch(() => {});
}

/**
 * DM Reject Handler
 */
async function handleDMReject(interaction, userId) {
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: '❌ Bu buton sadece sizin içindir.', ephemeral: true });
  }

  const currentTarget = activeQueue.queue[activeQueue.currentIndex];
  if (!currentTarget || currentTarget.userId !== userId) {
    return interaction.reply({ content: '⚠️ Konuşma sırası artık sizde değil.', ephemeral: true });
  }

  currentTarget.responded = true;
  currentTarget.status = 'skipped';

  if (activeQueue.pendingTimer) {
    clearTimeout(activeQueue.pendingTimer);
    activeQueue.pendingTimer = null;
  }

  const rejectEmbed = new EmbedBuilder()
    .setTitle('❌ SIRA REDDEDİLDİ (PAS)')
    .setDescription(`<@${userId}> konuşma sırasını reddetti. Sıradaki kişiye geçiliyor...`)
    .setColor(0xe74c3c);

  await interaction.reply({ embeds: [rejectEmbed] }).catch(() => {});

  const channel = interaction.client.channels.cache.get(activeQueue.channelId);
  if (channel) await channel.send({ embeds: [rejectEmbed] }).catch(() => {});

  // Advance to next
  await advanceToNextPerson(interaction.guild, interaction.client);
}

/**
 * Unmute all in voice channel
 */
async function unmuteAllQueue(interaction) {
  const guild = interaction.guild;
  for (const item of activeQueue.queue) {
    const member = await guild.members.fetch(item.userId).catch(() => null);
    if (member && member.voice && member.voice.channelId) {
      await member.voice.setMute(false, 'Toplu mute açma').catch(() => {});
    }
  }
  return interaction.reply({ content: '🔊 Sıradaki tüm üyelerin ses mutesi başarıyla açıldı.', ephemeral: true });
}

/**
 * Stop Queue
 */
async function stopQueue(interaction) {
  activeQueue.active = false;
  activeQueue.queue = [];
  activeQueue.currentIndex = -1;
  if (activeQueue.pendingTimer) {
    clearTimeout(activeQueue.pendingTimer);
    activeQueue.pendingTimer = null;
  }
  return interaction.reply({ content: '🛑 Canlı ses sırası sonlandırıldı ve sıfırlandı.', ephemeral: true });
}

/**
 * Handles chat messages matching "sesimi aç", "bende sıra", "sıra bende", "sıram geldi" etc.
 */
async function handleVoiceQueueChatMessage(message) {
  if (!message || message.author.bot || !message.guild) return;

  const content = message.content.toLowerCase();
  const triggerRegex = /(?:bende\s*s[ıi]ra|s[ıi]ra\s*bende|s[ıi]ram\s*geldi|benim\s*s[ıi]ram|sesimi\s*a[çc]|ses\s*a[çc]|muta\s*a[çc]|mute\s*a[çc])/i;

  if (!triggerRegex.test(content)) return;

  const userId = message.author.id;

  // 1) Is user the CURRENT active speaker?
  if (activeQueue.active && activeQueue.currentIndex >= 0 && activeQueue.queue[activeQueue.currentIndex]?.userId === userId) {
    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (member && member.voice && member.voice.channelId) {
      await member.voice.setMute(false, 'Chat talebi üzerine ses açıldı').catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setTitle('🎙️ SESİNİZ AÇILDI!')
      .setDescription(`Sayın <@${userId}>, konuşma sırası sizdedir! Ses muteniz açıldı, mikrofonunuzu kullanabilirsiniz.`)
      .setColor(0x2ecc71)
      .setTimestamp();

    return message.reply({ embeds: [embed] }).catch(() => {});
  }

  // 2) Is user in waiting queue list?
  if (activeQueue.active && activeQueue.queue.length > 0) {
    const queueIndex = activeQueue.queue.findIndex(item => item.userId === userId);
    if (queueIndex !== -1) {
      const pos = queueIndex + 1;
      const embed = new EmbedBuilder()
        .setTitle('⏳ SES SIRANIZ BEKLEMEDE')
        .setDescription(
          `Sayın <@${userId}>,\n\n` +
          `Ses sırası listesindesiniz. Şu an **${pos}. sıradasınız**.\n` +
          `Sıranız geldiğinde DM kutunuza özel bildirim gönderilecek ve ses muteniz otomatik olarak açılacaktır!`
        )
        .setColor(0xf1c40f)
        .setTimestamp();

      return message.reply({ embeds: [embed] }).catch(() => {});
    }
  }

  // 3) User is not in queue
  const embed = new EmbedBuilder()
    .setTitle('⚠️ SIRA LİSTESİNDE BULUNAMADINIZ')
    .setDescription(
      `Sayın <@${userId}>,\n\n` +
      `Henüz aktif canlı ses sırasına eklenmemiş görünüyorsunuz.\n` +
      `Sıraya girmek için yetkiliye başvurabilir veya paneldeki **\`[➕ Sıraya Kişi Ekle]\`** butonunu kullanabilirsiniz.`
    )
    .setColor(0xe67e22)
    .setTimestamp();

  return message.reply({ embeds: [embed] }).catch(() => {});
}

module.exports = {
  activeQueue,
  renderQueuePanelPayload,
  setupQueuePanel,
  addMembersToQueue,
  advanceToNextPerson,
  handleDMAccept,
  handleDMReject,
  unmuteAllQueue,
  stopQueue,
  handleVoiceQueueChatMessage
};
