'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Blacklist = require('../../models/Blacklist');

const BLACKLIST_CHANNEL_ID = '1518692472367222915';
const LOG_CHANNEL_ID = '1518920074264842380';

const cleanBlacklistName = (name) => {
  if (!name) return '';
  return name.replace(/[\*\~\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const cleanBlacklistReason = (reason) => {
  if (!reason) return '';
  return reason.replace(/[\*\~\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
};

// Default list of initial blocked people and groups
const DEFAULT_PEOPLE = [
  { name: 'LorerYT', reason: 'salaklık ve alttaki 2 kişi onun ekibinden' },
  { name: 'alionur738', reason: '' },
  { name: 'belamorgan', reason: '' },
  { name: 'İsrafil', reason: '' },
  { name: 'SpaceLeafs & Saynp1', reason: 'Fiziksel özellikler/Obezite' },
  { name: 'Waffuru', reason: 'Sebepsiz yere önemli kullanıcıları yasaklamak' },
  { name: 'wegoles', reason: 'Muhakeme yeteneğinden yoksun davranmak' },
  { name: 'ArdaDayı (LORER)', reason: 'Gizlilik kurallarını ihlal etmek ve MİT görevini suistimal etmek' },
  { name: 'LuaFriztche', reason: 'Ayrımcılık yapmak, kişiye göre torpil geçmek ve haksız AS.İZ/Blacklist kararları' },
  { name: 'Xyleun', reason: 'Zararlı alışkanlıklar üzerinden prim yapmaya çalışmak' },
  { name: 'Deuxcharen', reason: 'Aşırı özgüvenli ve yapay bir tavır sergilemek' },
  { name: 'Sanker', reason: 'Dikkat dağınıklığı ve koordinasyon eksikliği' },
  { name: 'cici_esra', reason: 'Arkadaş çevresine zarar vermek, haksız yasaklamalara sebep olmak ve uygunsuz ilişkiler kurmak' },
  { name: 'cyberrulzty', reason: 'Yetkiyi/Gücü kötüye kullanmak ve egoist tavırlar sergilemek' },
  { name: 'emrcn56', reason: 'Yönetim kadrosuna geçtikten sonra kibirlenmek' },
  { name: 'elesger500', reason: 'Ağır hakaret içerikli kişisel ithamlar' },
  { name: 'sydearr', reason: 'Yazılım/script hırsızlığı yapmak, etiket sebebiyle haksız yasaklamalar uygulamak ve kendi çıkarları doğrultusunda hareket etmek' },
  { name: 'kusba', reason: 'Hesap çalmaya çalışmak link ile enayi olmak' },
  { name: 'Bexay', reason: 'Sanker Paşasından aldığı konuşma metinlerini videoda anlatmak' },
  { name: 'ardo', reason: 'Femboy olmak.' },
  { name: 'Sword', reason: 'insanları satmak, Panel kullanmak' }
];

const DEFAULT_GROUPS = [
  { name: 'LorerYT YouTube Sunucusu\'nda bulunan herkes.', reason: '' },
  { name: 'TA ve TPT ile alakalı olan gruplar.', reason: '' },
  { name: 'Yıldırım Orduları', reason: 'Ciddiyetten uzak tavırlar sergilemek, özel hayata müdahale' },
  { name: 'MİT (Birim)', reason: 'Ciddiyetsizlik ve görev bilincine sahip olmamak' },
  { name: 'TA Kızları', reason: 'Üst yönetimle etik dışı ve çıkar amaçlı yakınlık kurmak' },
  { name: 'Ermeniler (Oyun İçi Fraksiyon/Grup)', reason: 'Siyasi ve diplomatik tutumlardan dolayı dış mihraklara bağlılıkla hareket etmek' },
  { name: 'TNF', reason: 'Kullanıcıları sunucudan çıkmaya zorlamak' }
];

/**
 * Seeds default data if empty and runs initial render
 */
async function initializeBlacklist(client) {
  try {
    const count = await Blacklist.countDocuments();
    if (count === 0) {
      console.log('[blacklist] Seeding default blacklist data...');
      const insertData = [];
      for (const p of DEFAULT_PEOPLE) {
        insertData.push({ name: p.name, type: 'person', reason: p.reason, isDefault: true });
      }
      for (const g of DEFAULT_GROUPS) {
        insertData.push({ name: g.name, type: 'group', reason: g.reason, isDefault: true });
      }
      await Blacklist.insertMany(insertData);
      console.log('[blacklist] Seeding complete.');
    }

    const allEntries = await Blacklist.find();
    for (const entry of allEntries) {
      const cleanName = cleanBlacklistName(entry.name);
      const cleanReason = cleanBlacklistReason(entry.reason);
      if (entry.name !== cleanName || entry.reason !== cleanReason) {
        entry.name = cleanName;
        entry.reason = cleanReason;
        await entry.save().catch(e => console.error('[blacklist] Migration save error:', e.message));
      }
    }

    await renderBlacklist(client);
  } catch (err) {
    console.error('[blacklist] Initialization error:', err.message);
  }
}

/**
 * Generates the unified single Embed Blacklist representation with Components v2 ActionRow
 */
async function renderBlacklist(client) {
  try {
    const channel = await client.channels.fetch(BLACKLIST_CHANNEL_ID).catch(() => null);
    if (!channel) {
      console.warn(`[blacklist] Channel ${BLACKLIST_CHANNEL_ID} not found.`);
      return;
    }

    const people = await Blacklist.find({ type: 'person' }).sort({ createdAt: 1 });
    const groups = await Blacklist.find({ type: 'group' }).sort({ createdAt: 1 });

    const formatList = (list) => {
      if (list.length === 0) return '> *(Kayıt bulunmuyor)*';
      return list.map(item => {
        const isRemoved = item.status === 'removed';
        const cleanName = cleanBlacklistName(item.name);
        const cleanReason = cleanBlacklistReason(item.reason);
        if (isRemoved) {
          return `> ❌ ~~**${cleanName}**~~ • *[15 Günlük Silinme Sürecinde]*`;
        }
        const reasonText = cleanReason ? ` • *${cleanReason}*` : '';
        return `> ⛔ **${cleanName}**${reasonText}`;
      }).join('\n');
    };

    const formattedPeople = formatList(people);
    const formattedGroups = formatList(groups);

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🚫 KARALİSTE (BLACKLIST)')
      .setThumbnail('https://i.imgur.com/HT7bvru.png')
      .setDescription(
        'Aşağıda belirtilen kullanıcılar ve dahil oldukları grup/platformlar, sergiledikleri tutumlar ve topluluk kurallarını ihlal etmeleri nedeniyle bağlı tüm projelerimizden süresiz olarak uzaklaştırılmış; **Karaliste**\'ye alınmıştır.'
      )
      .addFields(
        { name: '👤 Engellenen Kişiler', value: formattedPeople.slice(0, 1024), inline: false },
        { name: '🛡️ İlgili Gruplar / Platformlar', value: formattedGroups.slice(0, 1024), inline: false }
      )
      .setFooter({
        text: 'Eko Yıldız • Karaliste Yönetim Sistemi',
        iconURL: client.user.displayAvatarURL()
      })
      .setTimestamp();

    // Components v2 ActionRow (Interactive Buttons)
    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('blacklist_btn_rules')
        .setLabel('Kurallar & Formatlar')
        .setEmoji('ℹ️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('blacklist_btn_refresh')
        .setLabel('Listeyi Yenile')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('blacklist_btn_stats')
        .setLabel('İstatistikler')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Secondary)
    );

    // Single Embed Architecture: fetch messages, edit existing primary bot embed or send new
    const messagesCollection = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    if (!messagesCollection) return;

    const botMessages = Array.from(messagesCollection.values())
      .filter(m => m.author.id === client.user.id);

    const primaryMsg = botMessages.find(m => m.embeds.length > 0 && m.embeds[0].title?.includes('KARALİSTE'));
    const surplusMessages = botMessages.filter(m => m.id !== primaryMsg?.id);

    // Clean up surplus bot messages to maintain a single pristine embed channel
    for (const msg of surplusMessages) {
      await msg.delete().catch(() => {});
    }

    if (primaryMsg) {
      await primaryMsg.edit({ embeds: [embed], components: [actionRow] }).catch(err => {
        console.error('[blacklist] Failed to edit primary embed:', err.message);
      });
    } else {
      await channel.send({ embeds: [embed], components: [actionRow] }).catch(err => {
        console.error('[blacklist] Failed to send primary embed:', err.message);
      });
    }
  } catch (err) {
    console.error('[blacklist] Render error:', err.stack || err.message);
  }
}

/**
 * Interactive button handler for Components v2 Blacklist Buttons
 */
async function handleBlacklistButtons(interaction) {
  const { customId, client } = interaction;

  if (customId === 'blacklist_btn_rules') {
    await interaction.reply({
      content:
        `📜 **Karaliste Kuralları & Format Rehberi**\n\n` +
        `• **Kişi Ekleme Formatı:** \`Kişiİsmi - Sebep\`\n` +
        `• **Grup Ekleme Formatı:** \`Grup/Grupİsmi - Sebep\`\n` +
        `• **Kaldırma / Pasife Alma:** \`Kaldır İsmi\` *(15 günlük silinme sürecine girer)*\n` +
        `• **Tamamen Silme:** \`Sil İsmi\`\n` +
        `• **Yeniden Açma:** \`Aç İsmi\`\n\n` +
        `*Not: Karaliste kanalına yazılan komut dışı mesajlar otomatik olarak temizlenir.*`,
      ephemeral: true
    }).catch(() => {});
    return true;
  }

  if (customId === 'blacklist_btn_refresh') {
    await renderBlacklist(client);
    await interaction.reply({
      content: `✅ **Karaliste veritabanından başarıyla yenilendi ve güncellendi!**`,
      ephemeral: true
    }).catch(() => {});
    return true;
  }

  if (customId === 'blacklist_btn_stats') {
    const activePeopleCount = await Blacklist.countDocuments({ type: 'person', status: { $ne: 'removed' } });
    const activeGroupsCount = await Blacklist.countDocuments({ type: 'group', status: { $ne: 'removed' } });
    const removedCount = await Blacklist.countDocuments({ status: 'removed' });
    const totalCount = await Blacklist.countDocuments();

    const statsEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('📊 Karaliste İstatistik Verileri')
      .addFields(
        { name: '👤 Aktif Engellenen Kişiler', value: `\`${activePeopleCount}\` kişi`, inline: true },
        { name: '🛡️ Aktif Engellenen Gruplar', value: `\`${activeGroupsCount}\` grup`, inline: true },
        { name: '⏳ Silinme Sürecindeki Kayıtlar', value: `\`${removedCount}\` kayıt`, inline: true },
        { name: '📁 Toplam Veritabanı Kaydı', value: `\`${totalCount}\` adet`, inline: true }
      )
      .setFooter({ text: 'Eko Yıldız • Canlı İstatistik' })
      .setTimestamp();

    await interaction.reply({ embeds: [statsEmbed], ephemeral: true }).catch(() => {});
    return true;
  }

  return false;
}

/**
 * Parses and processes a message written in the blacklist channel.
 */
async function handleBlacklistMessage(message, client) {
  if (message.author.bot) return;

  const content = message.content.trim();
  const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

  const deleteMessage = () => {
    message.delete().catch(err => console.warn(`[blacklist] Failed to delete user message:`, err.message));
  };

  const sendWarning = async (warningText) => {
    deleteMessage();
    const warnMsg = await message.channel.send({ content: warningText }).catch(() => null);
    if (warnMsg) {
      setTimeout(() => {
        warnMsg.delete().catch(() => {});
      }, 5000);
    }
  };

  const additionPattern = /^\(?([^)]+?)\)?\s*\(([^)]+?)\)$/;
  const groupAdditionPattern = /^\(?([^)]+?)\)?\s*grubu\s*\(([^)]+?)\)$/i;
  const removalPattern = /^\(?([^)]+?)\)?\s*\(sorunçözüldü\)\s*Kaldırıldı$/i;
  const completeRemovalPattern = /^\(?([^)]+?)\)?\s*Tamamen\s*kaldırıldı$/i;
  const reopenPattern = /^\(?([^)]+?)\)?\s*\(sorun\s*çözülmemiş\)\s*Yeniden\s*Açıldı$/i;

  if (completeRemovalPattern.test(content)) {
    const match = content.match(completeRemovalPattern);
    const name = match[1].trim();

    try {
      const entry = await Blacklist.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (!entry) {
        return sendWarning(`❌ **${name}** karalistede bulunamadı!`);
      }

      await Blacklist.deleteOne({ _id: entry._id });
      deleteMessage();
      await renderBlacklist(client);

      if (logChannel) {
        const cleanName = entry.name.replace(/[<@!>]/g, "");
        await logChannel.send({
          content: `🗑️ **[KARALİSTE TAMAMEN SİLİNDİ]** <@${message.author.id}> tarafından **${cleanName}** listeden tamamen silindi.`,
          allowedMentions: { users: [] }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.error('[blacklist] DB complete removal error:', dbErr.message);
      return sendWarning(`❌ Bir veritabanı hatası oluştu: ${dbErr.message}`);
    }
    return;
  }

  if (removalPattern.test(content)) {
    const match = content.match(removalPattern);
    const name = match[1].trim();

    try {
      const entry = await Blacklist.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (!entry) {
        return sendWarning(`❌ **${name}** karalistede bulunamadı!`);
      }

      entry.status = 'removed';
      entry.removedAt = new Date();
      await entry.save();

      deleteMessage();
      await renderBlacklist(client);

      if (logChannel) {
        const cleanName = entry.name.replace(/[<@!>]/g, "");
        await logChannel.send({
          content: `📤 **[KARALİSTE KALDIRMA]** <@${message.author.id}> tarafından **${cleanName}** kaldırıldı. (15 gün sonra listeden tamamen silinecektir.)`,
          allowedMentions: { users: [] }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.error('[blacklist] DB removal error:', dbErr.message);
      return sendWarning(`❌ Bir veritabanı hatası oluştu: ${dbErr.message}`);
    }
    return;
  }

  if (reopenPattern.test(content)) {
    const match = content.match(reopenPattern);
    const name = match[1].trim();

    try {
      const entry = await Blacklist.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (!entry) {
        return sendWarning(`❌ **${name}** karalistede bulunamadı!`);
      }

      entry.status = 'active';
      entry.removedAt = null;
      await entry.save();

      deleteMessage();
      await renderBlacklist(client);

      if (logChannel) {
        const cleanName = entry.name.replace(/[<@!>]/g, "");
        await logChannel.send({
          content: `🔄 **[KARALİSTE YENİDEN AÇILDI]** <@${message.author.id}> tarafından **${cleanName}** karaliste kaydı yeniden aktif edildi.`,
          allowedMentions: { users: [] }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.error('[blacklist] DB reopen error:', dbErr.message);
      return sendWarning(`❌ Bir veritabanı hatası oluştu: ${dbErr.message}`);
    }
    return;
  }

  if (groupAdditionPattern.test(content)) {
    const match = content.match(groupAdditionPattern);
    const groupName = match[1].trim();
    const reason = match[2].trim();

    try {
      const existing = await Blacklist.findOne({ name: { $regex: new RegExp(`^${groupName}$`, 'i') }, type: 'group' });
      if (existing) {
        return sendWarning(`⚠️ **${groupName}** grubu zaten karalistede ekli!`);
      }

      await Blacklist.create({
        name: groupName,
        type: 'group',
        reason: reason,
        addedBy: message.author.id
      });

      deleteMessage();
      await renderBlacklist(client);

      if (logChannel) {
        const cleanName = groupName.replace(/[<@!>]/g, "");
        await logChannel.send({
          content: `🛡️ **[KARALİSTE GRUP EKLENDİ]** <@${message.author.id}> tarafından **${cleanName}** grubu eklendi. (Sebep: ${reason})`,
          allowedMentions: { users: [] }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.error('[blacklist] DB group addition error:', dbErr.message);
      return sendWarning(`❌ Bir veritabanı hatası oluştu: ${dbErr.message}`);
    }
    return;
  }

  if (additionPattern.test(content)) {
    const match = content.match(additionPattern);
    const name = match[1].trim();
    const reason = match[2].trim();

    try {
      const existing = await Blacklist.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, type: 'person' });
      if (existing) {
        return sendWarning(`⚠️ **${name}** zaten karalistede ekli!`);
      }

      await Blacklist.create({
        name: name,
        type: 'person',
        reason: reason,
        addedBy: message.author.id
      });

      deleteMessage();
      await renderBlacklist(client);

      if (logChannel) {
        const cleanName = name.replace(/[<@!>]/g, "");
        await logChannel.send({
          content: `➕ **[KARALİSTE KİŞİ EKLENDİ]** <@${message.author.id}> tarafından **${cleanName}** eklendi. (Sebep: ${reason})`,
          allowedMentions: { users: [] }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.error('[blacklist] DB addition error:', dbErr.message);
      return sendWarning(`❌ Bir veritabanı hatası oluştu: ${dbErr.message}`);
    }
    return;
  }

  sendWarning(`⚠️ **Geçersiz Karaliste Formatı!**\nFormat: \`KullanıcıAdı (Sebep)\` veya \`GrupAdı grubu (Sebep)\``);
}

/**
 * Periodic cleanup task: Deletes 'removed' blacklist entries after 15 days
 */
async function checkBlacklistCleanup(client) {
  try {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const expiredEntries = await Blacklist.find({
      status: 'removed',
      removedAt: { $lte: fifteenDaysAgo }
    });

    if (expiredEntries.length > 0) {
      console.log(`[blacklist] Found ${expiredEntries.length} expired removed blacklist entries. Deleting...`);
      await Blacklist.deleteMany({
        _id: { $in: expiredEntries.map(e => e._id) }
      });

      await renderBlacklist(client);
    }
  } catch (err) {
    console.error('[blacklist] Cleanup task error:', err.message);
  }
}

module.exports = {
  initializeBlacklist,
  renderBlacklist,
  handleBlacklistMessage,
  handleBlacklistButtons,
  checkBlacklistCleanup,
  cleanBlacklistName,
  cleanBlacklistReason
};
