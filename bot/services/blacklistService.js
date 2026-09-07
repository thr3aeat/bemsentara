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

    const formatItemLine = (item) => {
      const isRemoved = item.status === 'removed';
      const cleanName = cleanBlacklistName(item.name);
      const cleanReason = cleanBlacklistReason(item.reason);
      const formattedName = isRemoved ? `~~**${cleanName}**~~` : `**${cleanName}**`;
      const reasonText = cleanReason ? ` (${cleanReason})` : '';
      const statusText = isRemoved ? ' - *[Kaldırıldı (15 gün sonra silinecek)]*' : '';
      const photoBadge = item.imageUrl ? ' 📷' : '';
      return `* ${formattedName}${reasonText}${photoBadge}${statusText}`;
    };

    const containers = [];
    let currentContainer = new ContainerBuilder();
    let currentComponentCount = 0;

    const pushCurrentContainer = () => {
      if (currentComponentCount > 0) {
        containers.push(currentContainer);
        currentContainer = new ContainerBuilder();
        currentComponentCount = 0;
      }
    };

    // ─── 1️⃣ ANA BAŞLIK VE GÖRSEL ─────────────────────────────────────────
    currentContainer.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(HEADER_BANNER_URL)
      )
    );
    currentComponentCount++;

    currentContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 🚫 KARALİSTE (BLACKLIST)'),
      new TextDisplayBuilder().setContent('\u200B'),
      new TextDisplayBuilder().setContent(
        `> Aşağıda belirtilen kullanıcılar ve dahil oldukları grup, sergiledikleri tutumlar ve topluluk kurallarını ihlal etmeleri nedeniyle bağlı tüm projelerimizden süresiz olarak uzaklaştırılmış; "Karaliste"ye alınmıştır.`
      )
    );
    currentComponentCount += 3;

    currentContainer.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setDivider(true)
    );
    currentComponentCount++;

    // ─── 2️⃣ ENGELLENEN KİŞİLER ──────────────────────────────────────────
    currentContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### 👤 Engellenen Kişiler'),
      new TextDisplayBuilder().setContent('\u200B')
    );
    currentComponentCount += 2;

    let textBuffer = '';

    const flushTextBuffer = () => {
      if (textBuffer.trim().length > 0) {
        if (currentComponentCount >= 7) {
          pushCurrentContainer();
        }
        currentContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(textBuffer.trim())
        );
        currentComponentCount++;
        textBuffer = '';
      }
    };

    if (people.length === 0) {
      textBuffer = '*(Temiz)*\n';
    } else {
      for (const person of people) {
        const line = formatItemLine(person);

        if (person.imageUrl) {
          // Önceki biriken metni yazdır
          flushTextBuffer();

          if (currentComponentCount >= 6) {
            pushCurrentContainer();
          }

          // Bu kişinin başlık satırını ve hemen altına fotoğrafını ekle
          currentContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(line)
          );
          currentComponentCount++;

          currentContainer.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder().setURL(person.imageUrl)
            )
          );
          currentComponentCount++;
        } else {
          // Fotoğrafı yoksa buffer'a ekle
          if (textBuffer.length + line.length + 1 > 1400 || currentComponentCount >= 7) {
            flushTextBuffer();
          }
          textBuffer += (textBuffer ? '\n' : '') + line;
        }
      }
    }
    flushTextBuffer();

    // ─── 3️⃣ İLGİLİ GRUPLAR / PLATFORMLAR ────────────────────────────────
    if (currentComponentCount >= 5) {
      pushCurrentContainer();
    }

    currentContainer.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setDivider(true)
    );
    currentComponentCount++;

    currentContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### 🛡️ İlgili Gruplar / Platformlar'),
      new TextDisplayBuilder().setContent('\u200B')
    );
    currentComponentCount += 2;

    if (groups.length === 0) {
      textBuffer = '*(Temiz)*\n';
    } else {
      for (const group of groups) {
        const line = formatItemLine(group);

        if (group.imageUrl) {
          flushTextBuffer();

          if (currentComponentCount >= 6) {
            pushCurrentContainer();
          }

          currentContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(line)
          );
          currentComponentCount++;

          currentContainer.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder().setURL(group.imageUrl)
            )
          );
          currentComponentCount++;
        } else {
          if (textBuffer.length + line.length + 1 > 1400 || currentComponentCount >= 7) {
            flushTextBuffer();
          }
          textBuffer += (textBuffer ? '\n' : '') + line;
        }
      }
    }
    flushTextBuffer();

    // ─── 4️⃣ FOOTER (SON CONTAINER'A EKLENİR) ───────────────────────────
    if (currentComponentCount >= 7) {
      pushCurrentContainer();
    }

    currentContainer.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    );
    currentContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`*Son Güncelleme: <t:${Math.floor(Date.now() / 1000)}:f>*`)
    );
    currentComponentCount += 2;
    pushCurrentContainer();

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

  // Ek ve görsel kontrolü
  let imageUrl = null;
  if (message.attachments && message.attachments.size > 0) {
    const imgAtt = message.attachments.find(a => 
      (a.contentType && a.contentType.startsWith('image/')) ||
      /\.(png|jpe?g|webp|gif)$/i.test(a.name || '')
    ) || message.attachments.first();
    if (imgAtt) {
      imageUrl = imgAtt.url;
    }
  }

  // Metin içinde görsel URL'si varsa yakala
  if (!imageUrl) {
    const urlMatch = content.match(/https?:\/\/\S+\.(?:png|jpe?g|webp|gif)(?:\?\S*)?/i);
    if (urlMatch) {
      imageUrl = urlMatch[0];
    }
  }

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const additionPattern = /^\(?([^)]+?)\)?\s*\(([^)]+?)\)$/;
  const groupAdditionPattern = /^\(?([^)]+?)\)?\s*grubu\s*\(([^)]+?)\)$/i;
  const removalPattern = /^\(?([^)]+?)\)?\s*\(sorunçözüldü\)\s*Kaldırıldı$/i;
  const completeRemovalPattern = /^\(?([^)]+?)\)?\s*Tamamen\s*kaldırıldı$/i;
  const reopenPattern = /^\(?([^)]+?)\)?\s*\(sorun\s*çözülmemiş\)\s*Yeniden\s*Açıldı$/i;
  const removePhotoPattern = /^\(?([^)]+?)\)?\s*\((?:foto|fotograf|fotoğraf|resim)\s*(?:sil|kaldır|kaldir)\)$/i;
  const singleNamePattern = /^\(?([^\(\)\r\n]+?)\)?$/;

  // 1. Fotoğraf Kaldırma
  if (removePhotoPattern.test(content)) {
    const match = content.match(removePhotoPattern);
    const name = match[1].trim();

    try {
      const entry = await Blacklist.findOne({ name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } });
      if (!entry) {
        return sendWarning(`❌ **${name}** karalistede bulunamadı!`);
      }

      entry.imageUrl = null;
      await entry.save();

      deleteMessage();
      await renderBlacklist(client);

      if (logChannel) {
        const cleanName = entry.name.replace(/[<@!>]/g, "");
        await logChannel.send({
          content: `🗑️ **[KARALİSTE FOTOĞRAF SİLİNDİ]** <@${message.author.id}> tarafından **${cleanName}** kaydının fotoğrafı kaldırıldı.`,
          allowedMentions: { users: [] }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.error('[blacklist] DB photo removal error:', dbErr.message);
      return sendWarning(`❌ Bir veritabanı hatası oluştu: ${dbErr.message}`);
    }
    return;
  }

  // 2. Tamamen Kaldırıldı
  if (completeRemovalPattern.test(content)) {
    const match = content.match(completeRemovalPattern);
    const name = match[1].trim();

    try {
      const entry = await Blacklist.findOne({ name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } });
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

  // 3. Kaldırıldı (Soft remove)
  if (removalPattern.test(content)) {
    const match = content.match(removalPattern);
    const name = match[1].trim();

    try {
      const entry = await Blacklist.findOne({ name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } });
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

  // 4. Yeniden Açıldı
  if (reopenPattern.test(content)) {
    const match = content.match(reopenPattern);
    const name = match[1].trim();

    try {
      const entry = await Blacklist.findOne({ name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } });
      if (!entry) {
        return sendWarning(`❌ **${name}** karalistede bulunamadı!`);
      }

      entry.status = 'active';
      entry.removedAt = null;
      if (imageUrl) {
        entry.imageUrl = imageUrl;
      }
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

  // 5. Grup Ekle / Güncelle
  if (groupAdditionPattern.test(content)) {
    const match = content.match(groupAdditionPattern);
    const groupName = match[1].trim();
    const reason = match[2].trim();

    try {
      let existing = await Blacklist.findOne({ name: { $regex: new RegExp(`^${escapeRegex(groupName)}$`, 'i') }, type: 'group' });
      let isNew = false;
      if (existing) {
        existing.reason = reason;
        existing.status = 'active';
        existing.removedAt = null;
        if (imageUrl) existing.imageUrl = imageUrl;
        await existing.save();
      } else {
        await Blacklist.create({
          name: groupName,
          type: 'group',
          reason: reason,
          imageUrl: imageUrl || null,
          addedBy: message.author.id
        });
        isNew = true;
      }

      deleteMessage();
      await renderBlacklist(client);

      if (logChannel) {
        const cleanName = groupName.replace(/[<@!>]/g, "");
        const photoInfo = imageUrl ? ' 📸 *(Fotoğraf eklendi)*' : '';
        await logChannel.send({
          content: `🛡️ **[KARALİSTE GRUP EKLENDİ]** <@${message.author.id}> tarafından **${cleanName}** grubu eklendi. (Sebep: ${reason})${photoInfo}${isNew ? '' : ' *(Güncellendi)*'}`,
          allowedMentions: { users: [] }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.error('[blacklist] DB group addition error:', dbErr.message);
      return sendWarning(`❌ Bir veritabanı hatası oluştu: ${dbErr.message}`);
    }
    return;
  }

  // 6. Kişi Ekle / Güncelle (Sebeple)
  if (additionPattern.test(content)) {
    const match = content.match(additionPattern);
    const name = match[1].trim();
    const reason = match[2].trim();

    try {
      let existing = await Blacklist.findOne({ name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') }, type: 'person' });
      let isNew = false;
      if (existing) {
        existing.reason = reason;
        existing.status = 'active';
        existing.removedAt = null;
        if (imageUrl) existing.imageUrl = imageUrl;
        await existing.save();
      } else {
        await Blacklist.create({
          name: name,
          type: 'person',
          reason: reason,
          imageUrl: imageUrl || null,
          addedBy: message.author.id
        });
        isNew = true;
      }

      deleteMessage();
      await renderBlacklist(client);

      if (logChannel) {
        const cleanName = name.replace(/[<@!>]/g, "");
        const photoInfo = imageUrl ? ' 📸 *(Fotoğraf eklendi)*' : '';
        await logChannel.send({
          content: `➕ **[KARALİSTE KİŞİ EKLENDİ]** <@${message.author.id}> tarafından **${cleanName}** eklendi. (Sebep: ${reason})${photoInfo}${isNew ? '' : ' *(Güncellendi)*'}`,
          allowedMentions: { users: [] }
        }).catch(() => {});
      }
    } catch (dbErr) {
      console.error('[blacklist] DB addition error:', dbErr.message);
      return sendWarning(`❌ Bir veritabanı hatası oluştu: ${dbErr.message}`);
    }
    return;
  }

  // 7. Sade İsim Yazıldıysa (Örn: alionur738 veya (alionur738) + Fotoğraf)
  if (singleNamePattern.test(content)) {
    const match = content.match(singleNamePattern);
    let name = match[1].trim();

    // Eğer link içeriyorsa linki ayıkla
    if (imageUrl && name.includes(imageUrl)) {
      name = name.replace(imageUrl, '').trim();
    }

    if (!name && imageUrl) {
      return sendWarning(`⚠️ **Fotoğraf kime ait?** Lütfen fotoğraf ile birlikte kişinin adını yazın (Örn: \`alionur738\`).`);
    }

    if (name) {
      try {
        let existing = await Blacklist.findOne({ name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } });
        let isNew = false;

        if (existing) {
          if (imageUrl) {
            existing.imageUrl = imageUrl;
          }
          existing.status = 'active';
          existing.removedAt = null;
          await existing.save();
        } else {
          await Blacklist.create({
            name: name,
            type: 'person',
            reason: '',
            imageUrl: imageUrl || null,
            addedBy: message.author.id
          });
          isNew = true;
        }

        deleteMessage();
        await renderBlacklist(client);

        if (logChannel) {
          const cleanName = name.replace(/[<@!>]/g, "");
          const actionText = isNew
            ? (imageUrl ? `➕ **[KARALİSTE KİŞİ VE FOTOĞRAF EKLENDİ]**` : `➕ **[KARALİSTE KİŞİ EKLENDİ]**`)
            : (imageUrl ? `📸 **[KARALİSTE FOTOĞRAF GÜNCELLENDİ]**` : `🔄 **[KARALİSTE GÜNCELLENDİ]**`);

          await logChannel.send({
            content: `${actionText} <@${message.author.id}> tarafından **${cleanName}** kaydı işlendi.`,
            allowedMentions: { users: [] }
          }).catch(() => {});
        }
        return;
      } catch (dbErr) {
        console.error('[blacklist] DB single name addition/update error:', dbErr.message);
        return sendWarning(`❌ Bir veritabanı hatası oluştu: ${dbErr.message}`);
      }
    }
  }

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
