const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { generateGroqResponse } = require('./groqService');

const EKO_USER_ID = '1031620522406072350';

// In-memory state tracking
const userHistories = new Map();   // userId -> [{ role, content }]
const pendingRequests = new Map(); // userId -> { userId, userTag, topic, requestedAt }
let activeSession = null;          // { userId, userTag, topic, startedAt }
const waitingNotified = new Set(); // userIds already notified of waiting status

/**
 * Kullanıcı ve Eko arasındaki canlı mesaj aktarımı (Relay)
 */
async function relayMessage(client, sourceUser, targetUserId, message) {
  try {
    const targetUser = await client.users.fetch(targetUserId).catch(() => null);
    if (!targetUser) return false;

    const payload = {};
    const prefix = sourceUser.id === EKO_USER_ID ? '💬 **Eko:**' : `👤 **${sourceUser.tag}:**`;

    // Mesaj metni ve yanıt referansı
    let content = `${prefix} ${message.content || ''}`;
    if (message.reference && message.reference.messageId) {
      try {
        const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
        if (refMsg) {
          content = `> 💬 *Yanıtlanan Mesaj (${refMsg.author.username}): ${refMsg.content.slice(0, 100)}*\n` + content;
        }
      } catch (_) {}
    }

    payload.content = content.trim();

    // Dosyalar / Resimler / Ekler
    if (message.attachments && message.attachments.size > 0) {
      payload.files = Array.from(message.attachments.values()).map(att => ({
        attachment: att.url,
        name: att.name
      }));
    }

    await targetUser.send(payload);
    await message.react('⚡').catch(() => {});
    return true;
  } catch (err) {
    console.error('[EkoReservation] Mesaj iletim hatası:', err.message);
    await message.reply('❌ Mesaj karşı tarafa iletilemedi. DMs kapalı olabilir.').catch(() => {});
    return false;
  }
}

/**
 * Gelen DM Mesajını İşler
 */
async function handleIncomingDM(message, client) {
  // Botları ve Sunucu Mesajlarını Pas Geç
  if (message.author.bot || message.guild) return false;

  const authorId = message.author.id;

  // ── 1. EKO MESAJ ATTIĞINDA ──
  if (authorId === EKO_USER_ID) {
    const text = (message.content || '').trim().toLowerCase();

    // Görüşmeyi bitirme komutu (!bitir / /bitir / bitir)
    if (text === '!bitir' || text === '/bitir' || text === 'bitir') {
      if (activeSession) {
        await endActiveSession(client, 'Eko görüşmeyi sonlandırdı.');
      } else {
        await message.reply('ℹ️ Şu an aktif bir canlı görüşmeniz bulunmuyor.').catch(() => {});
      }
      return true;
    }

    // Aktif bir canlı görüşme varsa mesajı kullanıcıya ilet
    if (activeSession) {
      await relayMessage(client, message.author, activeSession.userId, message);
      return true;
    }

    // Aktif görüşme yoksa ama bekleyen istekler varsa seçim menüsünü göster
    if (pendingRequests.size > 0) {
      await sendEkoPendingChoice(client);
      return true;
    }

    return false; // Diğer normal bot komutlarına geçsin
  }

  // ── 2. NORMAL KULLANICI MESAJ ATTIĞINDA ──

  // A) Kullanıcı şu an AKTİF CANLI GÖRÜŞMEDE ise:
  if (activeSession && activeSession.userId === authorId) {
    await relayMessage(client, message.author, EKO_USER_ID, message);
    return true;
  }

  // B) Kullanıcı BEKLEME LİSTESİNDE (Sırada) ise:
  if (pendingRequests.has(authorId)) {
    // Bekleme bildirimi at
    if (!waitingNotified.has(authorId)) {
      waitingNotified.add(authorId);
      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('⏳ Eko Aktif ve Meşgul')
        .setDescription('Eko aktif oldu. Şu anda birisiyle konuşma sağlıyor. Sizinle birazdan konuşacak, hazırlanın.')
        .setFooter({ text: 'Rezervasyon Sıranız Korunuyor • EkoYıldız' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('eko_res_ok_ack')
          .setLabel('👍 TAMAM')
          .setStyle(ButtonStyle.Success)
      );

      await message.reply({ embeds: [embed], components: [row] }).catch(() => {});
    } else {
      await message.reply('⏳ Sıranız geldiğinde Eko sizinle otomatik bağlanacaktır. Lütfen hazırda bekleyin!').catch(() => {});
    }
    return true;
  }

  // C) Kullanıcı AI CHAT MODUNDA ise (Yeni Mesaj):
  try {
    let history = userHistories.get(authorId) || [];
    history.push({ role: 'user', content: message.content });

    // Son 10 mesajı sakla
    if (history.length > 10) history = history.slice(-10);

    const aiReply = await generateGroqResponse(history);

    // AI yanıtını geçmişe ekle
    history.push({ role: 'assistant', content: aiReply });
    userHistories.set(authorId, history);

    // Rezervasyon Etiketi Var Mı Kontrol Et
    const match = aiReply.match(/\[REZERVASYON_TALEP:\s*([^\]]+)\]/i);

    // Etiketi kullanıcıya gösterilecek metinden temizle
    const cleanReply = aiReply.replace(/\[REZERVASYON_TALEP:\s*([^\]]+)\]/gi, '').trim();

    if (cleanReply) {
      await message.channel.send({ content: cleanReply }).catch(() => {});
    }

    // Eğer Rezervasyon İsteği Kesinleştiyse:
    if (match) {
      const topic = match[1].trim();
      pendingRequests.set(authorId, {
        userId: authorId,
        userTag: message.author.tag,
        topic: topic,
        requestedAt: new Date()
      });

      console.log(`[EkoReservation] 📅 Yeni rezervasyon talebi: ${message.author.tag} -> Konu: ${topic}`);

      // Eko'ya bildirim gönder veya seçim sun
      await notifyEkoNewRequest(client, authorId);
    }

    return true;
  } catch (err) {
    console.error('[EkoReservation] AI chat hatası:', err.message);
    await message.reply("Merhaba! EkoYıldız'ın (Eko'nun) kişisel hesabının DM'ine hoş geldiniz. Bu hesap Eko ile konuşmak için rezervasyon / randevu almak üzere kurulmuştur. Konunuzu belirtirseniz Eko'ya ileteceğim!").catch(() => {});
    return true;
  }
}

/**
 * Eko'ya yeni rezervasyon talebini veya seçim menüsünü gönderir
 */
async function notifyEkoNewRequest(client, newUserId) {
  try {
    const ekoUser = await client.users.fetch(EKO_USER_ID).catch(() => null);
    if (!ekoUser) return;

    // Eğer 2 veya daha fazla bekleyen talep varsa Eko'ya toplu seçim gönder
    if (pendingRequests.size >= 2) {
      await sendEkoPendingChoice(client);
      return;
    }

    // Sadece 1 talep varsa ve Eko şu an kimseyle konuşmuyorsa kabul/red butonlu bildirim gönder
    const request = pendingRequests.get(newUserId);
    if (!request) return;

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle('📅 Yeni Görüşme / Rezervasyon Talebi')
      .setDescription(
        `Merhaba! **${request.userTag}** (<@${request.userId}>) kişisi sizinle **${request.topic}** konusu hakkında konuşmak istiyor.`
      )
      .addFields(
        { name: '👤 Kullanıcı', value: `${request.userTag} (${request.userId})`, inline: true },
        { name: '📌 Görüşme Konusu', value: request.topic, inline: false }
      )
      .setFooter({ text: 'Onayladığınızda canlı mesajlaşma başlayacaktır.' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`eko_res_accept_${request.userId}`)
        .setLabel('✅ Evet (Kabul Et)')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`eko_res_reject_${request.userId}`)
        .setLabel('❌ Hayır (Reddet)')
        .setStyle(ButtonStyle.Danger)
    );

    await ekoUser.send({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[EkoReservation] Eko bildirimi gönderilemedi:', err.message);
  }
}

/**
 * Eko'ya birden fazla talep olduğunda seçim menüsü sunar
 */
async function sendEkoPendingChoice(client) {
  try {
    const ekoUser = await client.users.fetch(EKO_USER_ID).catch(() => null);
    if (!ekoUser) return;

    const count = pendingRequests.size;
    if (count === 0) return;

    const embed = new EmbedBuilder()
      .setColor(0x8B5CF6)
      .setTitle(`💬 Görüşme Talepleri (${count} Kişi Bekliyor)`)
      .setDescription(
        `Eko'ya talep gitti! Sistemde **${count} kişi** sizinle konuşmak istiyor.\n\n` +
        `**Hangisiyle ilk önce konuşmak istersiniz?**`
      )
      .setTimestamp();

    const selectOptions = [];
    const rows = [];

    let index = 1;
    for (const [uId, req] of pendingRequests.entries()) {
      embed.addFields({
        name: `${index}. ${req.userTag}`,
        value: `📌 **Konu:** ${req.topic}\n🆔 \`${uId}\``,
        inline: false
      });

      if (selectOptions.length < 25) {
        selectOptions.push(
          new StringSelectMenuOptionBuilder()
            .setLabel(`${index}. ${req.userTag.slice(0, 20)}`)
            .setDescription(req.topic.slice(0, 50))
            .setValue(uId)
        );
      }
      index++;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('eko_res_select_user')
      .setPlaceholder('Görüşmeye başlamak istediğiniz kişiyi seçin...')
      .addOptions(selectOptions);

    rows.push(new ActionRowBuilder().addComponents(selectMenu));

    await ekoUser.send({ embeds: [embed], components: rows });
  } catch (err) {
    console.error('[EkoReservation] Eko seçim menüsü gönderilemedi:', err.message);
  }
}

/**
 * Buton ve Select Menu Etkileşimlerini İşler
 */
async function handleInteraction(interaction, client) {
  const customId = interaction.customId;

  if (!customId.startsWith('eko_res_')) return false;

  try {
    // A) TAMAM Butonu (Bekleyen Kullanıcı)
    if (customId === 'eko_res_ok_ack') {
      await interaction.reply({ content: '👍 Bildirimi aldınız. Eko müsait olduğunda sizinle otomatik olarak bağlantı kurulacaktır!', ephemeral: true }).catch(() => {});
      return true;
    }

    // Sadece Eko butonlara basabilir
    if (interaction.user.id !== EKO_USER_ID) {
      await interaction.reply({ content: '❌ Bu butonlar sadece Eko tarafından kullanılabilir.', ephemeral: true }).catch(() => {});
      return true;
    }

    // B) Kabul Et Butonu (`eko_res_accept_${userId}`)
    if (customId.startsWith('eko_res_accept_')) {
      const targetUserId = customId.replace('eko_res_accept_', '');
      await startLiveSession(client, interaction, targetUserId);
      return true;
    }

    // C) Reddet Butonu (`eko_res_reject_${userId}`)
    if (customId.startsWith('eko_res_reject_')) {
      const targetUserId = customId.replace('eko_res_reject_', '');
      await rejectSessionRequest(client, interaction, targetUserId);
      return true;
    }

    // D) Görüşmeyi Bitir Butonu (`eko_res_end_${userId}`)
    if (customId.startsWith('eko_res_end_')) {
      await interaction.deferUpdate().catch(() => {});
      await endActiveSession(client, 'Eko buton üzerinden görüşmeyi sonlandırdı.');
      return true;
    }

    // E) Seçim Menüsü (`eko_res_select_user`)
    if (customId === 'eko_res_select_user' && interaction.isStringSelectMenu()) {
      const selectedUserId = interaction.values[0];
      await startLiveSession(client, interaction, selectedUserId);
      return true;
    }

    return false;
  } catch (err) {
    console.error('[EkoReservation] Etkileşim işleme hatası:', err.message);
    return true;
  }
}

/**
 * Seçilen kullanıcı ile canlı görüşmeyi başlatır
 */
async function startLiveSession(client, interaction, targetUserId) {
  const request = pendingRequests.get(targetUserId);

  if (!request) {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: '❌ Bu talep artık geçerli değil veya iptal edilmiş.', ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: '❌ Bu talep artık geçerli değil veya iptal edilmiş.', ephemeral: true }).catch(() => {});
    }
    return;
  }

  // Eğer hâlâ başkasıyla görüşülüyorsa
  if (activeSession && activeSession.userId !== targetUserId) {
    await endActiveSession(client, 'Yeni görüşmeye geçildiği için önceki görüşme kapatıldı.');
  }

  // Aktif oturum olarak ayarla ve bekleyenlerden sil
  activeSession = {
    userId: targetUserId,
    userTag: request.userTag,
    topic: request.topic,
    startedAt: new Date()
  };

  pendingRequests.delete(targetUserId);
  waitingNotified.delete(targetUserId);

  // Seçilen Kullanıcıya Müjde Mesajı Gönder
  const targetUser = await client.users.fetch(targetUserId).catch(() => null);
  if (targetUser) {
    const userEmbed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('🎉 Görüşme Talebiniz Kabul Edildi!')
      .setDescription(
        `Eko görüşme talebinizi kabul etti!\n\n` +
        `**Görüşme Konusu:** ${request.topic}\n\n` +
        `💬 **Artık bu DM üzerinden mesaj yazarak Eko ile doğrudan canlı konuşabilirsiniz.**`
      )
      .setFooter({ text: 'Görüşmeyi bitirmek için Eko ile mesajlaşmanızı tamamlayın • EkoYıldız' })
      .setTimestamp();

    await targetUser.send({ embeds: [userEmbed] }).catch(() => {});
  }

  // Eko'ya Canlı Görüşme Paneli Gönder
  const ekoEmbed = new EmbedBuilder()
    .setColor(0x10B981)
    .setTitle('🟢 Canlı Görüşme Başladı')
    .setDescription(
      `**Görüşülen Kullanıcı:** ${request.userTag} (<@${request.userId}>)\n` +
      `**Konu:** ${request.topic}\n\n` +
      `💬 **Bu DM kutusuna yazacağınız her mesaj doğrudan kullanıcıya iletilecektir.**\n` +
      `🛑 Görüşmeyi bitirmek için aşağıdaki **'🔴 Konuşmayı Bitir'** butonuna basın veya \`/bitir\` yazın.`
    )
    .setTimestamp();

  const endRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`eko_res_end_${targetUserId}`)
      .setLabel('🔴 Konuşmayı Bitir')
      .setStyle(ButtonStyle.Danger)
  );

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ embeds: [ekoEmbed], components: [endRow] }).catch(() => {});
  } else {
    await interaction.reply({ embeds: [ekoEmbed], components: [endRow] }).catch(() => {});
  }

  // Diğer Bekleyen Kullanıcılara "Eko aktif oldu, birazdan konuşacak" Bildirimi Gönder
  for (const [otherId, otherReq] of pendingRequests.entries()) {
    if (!waitingNotified.has(otherId)) {
      waitingNotified.add(otherId);
      const otherUser = await client.users.fetch(otherId).catch(() => null);
      if (otherUser) {
        const waitEmbed = new EmbedBuilder()
          .setColor(0xF59E0B)
          .setTitle('⏳ Eko Aktif Oldu')
          .setDescription('Eko aktif oldu. Şu anda birisiyle konuşma sağlıyor. Sizinle birazdan konuşacak, hazırlanın.')
          .setFooter({ text: 'Sıranız Geldiğinde Otomatik Bağlanacaksınız • EkoYıldız' });

        const waitRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('eko_res_ok_ack')
            .setLabel('👍 TAMAM')
            .setStyle(ButtonStyle.Success)
        );

        await otherUser.send({ embeds: [waitEmbed], components: [waitRow] }).catch(() => {});
      }
    }
  }
}

/**
 * Rezervasyon talebini reddeder
 */
async function rejectSessionRequest(client, interaction, targetUserId) {
  const request = pendingRequests.get(targetUserId);
  pendingRequests.delete(targetUserId);
  waitingNotified.delete(targetUserId);

  // Kullanıcıya Bildirim Gönder
  const targetUser = await client.users.fetch(targetUserId).catch(() => null);
  if (targetUser) {
    await targetUser.send({ content: 'Eko sizinle konuşmayı reddetti.' }).catch(() => {});
  }

  const tag = request ? request.userTag : targetUserId;
  const replyContent = `❌ **${tag}** kullanıcısının görüşme talebi reddedildi.`;

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content: replyContent, embeds: [], components: [] }).catch(() => {});
  } else {
    await interaction.reply({ content: replyContent, embeds: [], components: [] }).catch(() => {});
  }

  // Kalan başka talepler varsa Eko'ya sor
  if (pendingRequests.size > 0 && !activeSession) {
    await sendEkoPendingChoice(client);
  }
}

/**
 * Aktif canlı oturumu sonlandırır ve sıradaki kullanıcıya otomatik geçer
 */
async function endActiveSession(client, reason = 'Görüşme tamamlandı.') {
  if (!activeSession) return;

  const endedUser = activeSession;
  activeSession = null;

  // Kullanıcıya Sonlandırma Mesajı Gönder
  const user = await client.users.fetch(endedUser.userId).catch(() => null);
  if (user) {
    await user.send({ content: 'Eko ile olan görüşmeniz sonlandırıldı. Teşekkür ederiz!' }).catch(() => {});
  }

  // Eko'ya Bilgi Mesajı Gönder
  const ekoUser = await client.users.fetch(EKO_USER_ID).catch(() => null);
  if (ekoUser) {
    await ekoUser.send({ content: `🛑 **${endedUser.userTag}** ile olan canlı görüşme sonlandırıldı.` }).catch(() => {});
  }

  // 🔄 OTOMATİK SIRADAKİ KULLANICIYA GEÇİŞ
  const remainingCount = pendingRequests.size;

  if (remainingCount === 1) {
    // 1 kişi kalmışsa otomatik olarak ona onay/seçim sun
    const nextUserId = pendingRequests.keys().next().value;
    await notifyEkoNewRequest(client, nextUserId);
  } else if (remainingCount >= 2) {
    // 2 veya daha fazla kişi varsa Eko'ya hangisiyle görüşeceğini seçtir!
    await sendEkoPendingChoice(client);
  }
}

module.exports = {
  EKO_USER_ID,
  handleIncomingDM,
  handleInteraction,
  endActiveSession,
  getPendingRequests: () => pendingRequests,
  getActiveSession: () => activeSession
};
