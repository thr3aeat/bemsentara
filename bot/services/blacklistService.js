'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');
const Blacklist = require('../../models/Blacklist');

const BLACKLIST_CHANNEL_ID = '1518692472367222915';
const LOG_CHANNEL_ID = '1518920074264842380';
const HEADER_BANNER_URL = 'https://i.imgur.com/ZaYKvkE.png';
const ACCENT_COLOR = 0x2b2d31;

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
 * Generates the blacklist representation and posts/updates it in the designated channel using Components V2
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

    const formatItem = (item) => {
      const isRemoved = item.status === 'removed';
      const cleanName = cleanBlacklistName(item.name);
      const cleanReason = cleanBlacklistReason(item.reason);
      const formattedName = isRemoved ? `~~**${cleanName}**~~` : `**${cleanName}**`;
      const reasonText = cleanReason ? ` (${cleanReason})` : '';
      const statusText = isRemoved ? ' - *[Kaldırıldı (15 gün sonra silinecek)]*' : '';
      return `* ${formattedName}${reasonText}${statusText}`;
    };

    const splitListIntoChunks = (list, maxChars = 1500) => {
      if (list.length === 0) return ['*(Temiz)*'];
      const chunks = [];
      let current = '';

      for (const item of list) {
        const line = formatItem(item);
        if (current.length + line.length + 1 > maxChars) {
          chunks.push(current.trim());
          current = line;
        } else {
          current = current ? current + '\n' + line : line;
        }
      }
      if (current) chunks.push(current.trim());
      return chunks;
    };

    const peopleChunks = splitListIntoChunks(people, 1500);
    const groupChunks = splitListIntoChunks(groups, 1500);

    const containers = [];

    // ─── 1️⃣ ANA BAŞLIK, GÖRSEL VE KİŞİLER (1. PARÇA) ─────────────────────
    const headerContainer = new ContainerBuilder().setAccentColor(ACCENT_COLOR);

    // En başa belirtilen görseli koyuyoruz
    headerContainer.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(HEADER_BANNER_URL)
      )
    );

    headerContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 🚫 KARALİSTE (BLACKLIST)'),
      new TextDisplayBuilder().setContent('\u200B'),
      new TextDisplayBuilder().setContent(
        `> Aşağıda belirtilen kullanıcılar ve dahil oldukları grup, sergiledikleri tutumlar ve topluluk kurallarını ihlal etmeleri nedeniyle bağlı tüm projelerimizden süresiz olarak uzaklaştırılmış; "Karaliste"ye alınmıştır.`
      )
    );

    headerContainer.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setDivider(true)
    );

    headerContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### 👤 Engellenen Kişiler'),
      new TextDisplayBuilder().setContent('\u200B'),
      new TextDisplayBuilder().setContent(peopleChunks[0])
    );

    containers.push(headerContainer);

    // Eğer kişiler 1. parçaya sığmadıysa sonraki parçalar için container ekle
    for (let i = 1; i < peopleChunks.length; i++) {
      const pContainer = new ContainerBuilder().setAccentColor(ACCENT_COLOR);
      pContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 👤 Engellenen Kişiler (Kısım ${i + 1})`),
        new TextDisplayBuilder().setContent('\u200B'),
        new TextDisplayBuilder().setContent(peopleChunks[i])
      );
      containers.push(pContainer);
    }

    // ─── 2️⃣ İLGİLİ GRUPLAR BÖLÜMÜ ───────────────────────────────────────
    const firstGroupContainer = new ContainerBuilder().setAccentColor(ACCENT_COLOR);
    firstGroupContainer.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setDivider(true)
    );
    firstGroupContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### 🛡️ İlgili Gruplar / Platformlar'),
      new TextDisplayBuilder().setContent('\u200B'),
      new TextDisplayBuilder().setContent(groupChunks[0])
    );
    containers.push(firstGroupContainer);

    for (let i = 1; i < groupChunks.length; i++) {
      const gContainer = new ContainerBuilder().setAccentColor(ACCENT_COLOR);
      gContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🛡️ İlgili Gruplar / Platformlar (Kısım ${i + 1})`),
        new TextDisplayBuilder().setContent('\u200B'),
        new TextDisplayBuilder().setContent(groupChunks[i])
      );
      containers.push(gContainer);
    }

    // ─── 3️⃣ FOOTER (SON CONTAINER'A EKLENİR) ───────────────────────────
    const lastContainer = containers[containers.length - 1];
    lastContainer.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    );
    lastContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`*Son Güncelleme: <t:${Math.floor(Date.now() / 1000)}:f>*`)
    );

    // ─── MESAJLARI GÖNDER / GÜNCELLE ────────────────────────────────────
    const messagesCollection = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!messagesCollection) {
      console.warn('[blacklist] Failed to fetch message history.');
      return;
    }

    const botMessages = Array.from(messagesCollection.values())
      .filter(m => m.author.id === client.user.id)
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    for (let i = 0; i < containers.length; i++) {
      const payload = {
        content: '',
        embeds: [],
        components: [containers[i]],
        flags: MessageFlags.IsComponentsV2
      };

      if (i < botMessages.length) {
        await botMessages[i].edit(payload).catch(err => {
          console.error(`[blacklist] Failed to edit content message ${i}:`, err.message);
        });
      } else {
        await channel.send(payload).catch(err => {
          console.error(`[blacklist] Failed to send new content message:`, err.message);
        });
      }
    }

    // Ekstra kalan eski mesajları temizle
    if (botMessages.length > containers.length) {
      for (let i = containers.length; i < botMessages.length; i++) {
        await botMessages[i].delete().catch(err => {
          console.warn(`[blacklist] Failed to delete surplus message:`, err.message);
        });
      }
    }
  } catch (err) {
    console.error('[blacklist] Render error:', err.stack || err.message);
  }
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
  checkBlacklistCleanup,
  cleanBlacklistName,
  cleanBlacklistReason
};
