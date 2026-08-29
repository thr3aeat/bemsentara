const { ChannelType, PermissionFlagsBits } = require("discord.js");

const TARGET_GUILD_ID = "1537407325290237973";

/**
 * Kanal türünü Türkçe okunabilir metne dönüştürür.
 */
function getChannelTypeName(type) {
  switch (type) {
    case ChannelType.GuildText:
      return "Metin Kanalı";
    case ChannelType.GuildVoice:
      return "Ses Kanalı";
    case ChannelType.GuildCategory:
      return "Kategori";
    case ChannelType.GuildAnnouncement:
      return "Duyuru Kanalı";
    case ChannelType.GuildStageVoice:
      return "Sahne Kanalı";
    case ChannelType.GuildForum:
      return "Forum Kanalı";
    case ChannelType.GuildMedia:
      return "Medya Kanalı";
    case ChannelType.PublicThread:
      return "Açık Alt Başlık";
    case ChannelType.PrivateThread:
      return "Özel Alt Başlık";
    case ChannelType.AnnouncementThread:
      return "Duyuru Alt Başlığı";
    default:
      return "Diğer";
  }
}

/**
 * Uzun metin dizilerini Discord'un 2000 karakter sınırına göre satır satır bölümlere (partlara) ayırır.
 */
function splitIntoChunks(headerPrefix, lines, maxLen = 1850) {
  if (!lines || lines.length === 0) {
    return [`${headerPrefix}\n\n*(Kayıt bulunamadı)*`];
  }

  const rawChunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const line of lines) {
    const lineLen = line.length + 1; // + newline
    if (currentLength + lineLen > maxLen && currentChunk.length > 0) {
      rawChunks.push(currentChunk.join("\n"));
      currentChunk = [line];
      currentLength = lineLen;
    } else {
      currentChunk.push(line);
      currentLength += lineLen;
    }
  }

  if (currentChunk.length > 0) {
    rawChunks.push(currentChunk.join("\n"));
  }

  const totalParts = rawChunks.length;
  return rawChunks.map((content, idx) => {
    const partNum = idx + 1;
    return `${headerPrefix} (Bölüm ${partNum}/${totalParts}) - Toplam ${lines.length} Kayıt:\n\n${content}`;
  });
}

/**
 * Bölünmüş mesajları sırayla Discord kanalına gönderir.
 */
async function sendChunkedMessages(message, chunks) {
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) {
      await message.reply({ content: chunks[i], allowedMentions: { parse: [] } });
    } else {
      await message.channel.send({ content: chunks[i], allowedMentions: { parse: [] } });
    }
  }
}

/**
 * Yetki kontrolü (Hedef sunucu, Yönetici veya Kanal/Rol Yönetimi yetkisi)
 */
function checkPermission(message) {
  if (!message.guild) return false;
  if (message.guild.id === TARGET_GUILD_ID) return true;
  if (message.author.id === "1031620522406072350" || message.author.id === message.guild.ownerId) return true;
  
  return (
    message.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
    message.member?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
    message.member?.permissions?.has(PermissionFlagsBits.ManageChannels) ||
    message.member?.permissions?.has(PermissionFlagsBits.ManageRoles)
  );
}

/**
 * 1. Tüm Kategoriler Komutu (!tumkategoriler / !tumkategorilerduzenle)
 */
async function handleTumKategoriler(message, isEditMode = false) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` veya `Kanalları Yönet` yetkisine sahip olmalısınız.");
  }

  await message.guild.channels.fetch().catch(() => {});
  const categories = message.guild.channels.cache
    .filter(c => c.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position);

  if (categories.size === 0) {
    return message.reply("ℹ️ Sunucuda herhangi bir kategori bulunamadı.");
  }

  const lines = [];
  categories.forEach((cat) => {
    const childChannels = message.guild.channels.cache.filter(c => c.parentId === cat.id);
    if (isEditMode) {
      lines.push(`Kategori İsmi: ${cat.name} | Kategori ID: ${cat.id} | Sıra: ${cat.position} | Kanal Sayısı: ${childChannels.size}`);
    } else {
      lines.push(`📁 **${cat.name}** | ID: \`${cat.id}\` | Sıra: \`${cat.position}\` | Kanal Sayısı: \`${childChannels.size}\``);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Kategoriler**`
    : `📁 **Sunucudaki Tüm Kategoriler**`;

  const chunks = splitIntoChunks(header, lines);
  await sendChunkedMessages(message, chunks);
}

/**
 * 2. Tüm Roller Komutu (!tumroller / !tumrollerduzenle)
 */
async function handleTumRoller(message, isEditMode = false) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` veya `Rolleri Yönet` yetkisine sahip olmalısınız.");
  }

  await message.guild.roles.fetch().catch(() => {});
  const roles = message.guild.roles.cache
    .filter(r => r.id !== message.guild.id) // @everyone hariç
    .sort((a, b) => b.position - a.position);

  if (roles.size === 0) {
    return message.reply("ℹ️ Sunucuda listelenecek özel rol bulunamadı.");
  }

  const lines = [];
  roles.forEach((role) => {
    const memberCount = role.members.size;
    const colorHex = role.hexColor !== "#000000" ? role.hexColor : "Varsayılan";
    if (isEditMode) {
      lines.push(`Rol İsmi: ${role.name} | Rol ID: ${role.id} | Sıra: ${role.position} | Renk: ${colorHex} | Üye Sayısı: ${memberCount}`);
    } else {
      lines.push(`🛡️ **${role.name}** | ID: \`${role.id}\` | Sıra: \`${role.position}\` | Renk: \`${colorHex}\` | Üyeler: \`${memberCount}\``);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Roller (@everyone hariç)**`
    : `🛡️ **Sunucudaki Tüm Roller (@everyone hariç)**`;

  const chunks = splitIntoChunks(header, lines);
  await sendChunkedMessages(message, chunks);
}

/**
 * 3. Tüm Kanallar Komutu (!tumkanallar / !tumkanallarduzenle)
 */
async function handleTumKanallar(message, isEditMode = false) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` veya `Kanalları Yönet` yetkisine sahip olmalısınız.");
  }

  await message.guild.channels.fetch().catch(() => {});
  const channels = message.guild.channels.cache
    .filter(c => c.type !== ChannelType.GuildCategory)
    .sort((a, b) => {
      const posA = a.parent ? a.parent.position * 1000 + a.position : a.position;
      const posB = b.parent ? b.parent.position * 1000 + b.position : b.position;
      return posA - posB;
    });

  if (channels.size === 0) {
    return message.reply("ℹ️ Sunucuda listelenecek kanal bulunamadı.");
  }

  const lines = [];
  channels.forEach((ch) => {
    const categoryName = ch.parent ? ch.parent.name : "Kategorisiz";
    const categoryId = ch.parentId || "Yok";
    const typeName = getChannelTypeName(ch.type);

    if (isEditMode) {
      lines.push(`Kanal İsmi: #${ch.name} | Kanal ID: ${ch.id} | Kategori İsmi: ${categoryName} | Kategori ID: ${categoryId} | Tür: ${typeName}`);
    } else {
      lines.push(`💬 **#${ch.name}** | ID: \`${ch.id}\` | Kategori: **${categoryName}** (\`${categoryId}\`) | Tür: \`${typeName}\``);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Kanallar**`
    : `💬 **Sunucudaki Tüm Kanallar**`;

  const chunks = splitIntoChunks(header, lines);
  await sendChunkedMessages(message, chunks);
}

/**
 * 4. Tüm Kanal Açıklamaları Komutu (!tumkanalaciklamalari / !tumkanalaciklamalariduzenle)
 */
async function handleTumKanalAciklamalari(message, isEditMode = false) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` veya `Kanalları Yönet` yetkisine sahip olmalısınız.");
  }

  const rawLines = message.content.split("\n");
  const updatePairs = [];

  // Çok satırlı girdi varsa ve güncelleme isteniyorsa
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (i === 0) {
      line = line.replace(/^![a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]+/i, "").trim();
    }
    if (!line) continue;

    // 1) "kanal_id ----- yeni açıklama" formatı
    if (line.includes("-----")) {
      const parts = line.split("-----");
      const channelId = parts[0].trim().replace(/[<#>]/g, "");
      const desc = parts.slice(1).join("-----").trim();
      if (channelId) updatePairs.push({ channelId, description: desc });
    }
    // 2) "Kanal ID: 12345 | Açıklama: ..." formatı
    else if (/Kanal ID:\s*([0-9]+)/i.test(line) && /Açıklama:\s*(.*)/i.test(line)) {
      const idMatch = line.match(/Kanal ID:\s*([0-9]+)/i);
      const descMatch = line.match(/Açıklama:\s*(.*)/i);
      if (idMatch && idMatch[1]) {
        updatePairs.push({ channelId: idMatch[1], description: descMatch ? descMatch[1].trim() : "" });
      }
    }
  }

  // Eğer güncelleme parametreleri verilmişse toplu güncelleme çalıştır
  if (updatePairs.length > 0) {
    const statusMsg = await message.reply(`🔄 **${updatePairs.length}** kanalın açıklaması güncelleniyor, lütfen bekleyin...`);
    const success = [];
    const failed = [];

    for (const pair of updatePairs) {
      const { channelId, description } = pair;
      try {
        let ch = message.guild.channels.cache.get(channelId);
        if (!ch) {
          ch = await message.guild.channels.fetch(channelId).catch(() => null);
        }

        if (!ch) {
          failed.push({ channelId, reason: "Kanal bulunamadı." });
          continue;
        }

        if (typeof ch.setTopic !== "function") {
          failed.push({ channelId, name: ch.name, reason: "Bu kanal türü açıklama/topic desteklemiyor." });
          continue;
        }

        await ch.setTopic(description, `Yetkili: ${message.author.tag} tarafından toplu düzenleme yapıldı.`);
        success.push({ id: ch.id, name: ch.name });
      } catch (err) {
        failed.push({ channelId, reason: err.message || "Bilinmeyen hata" });
      }
    }

    let resultText = `**Toplu Kanal Açıklaması Güncelleme Sonucu:**\n\n`;
    if (success.length > 0) {
      resultText += `✅ **Başarıyla Güncellenenler (${success.length}):**\n`;
      success.forEach(s => {
        resultText += `- #${s.name} (\`${s.id}\`)\n`;
      });
      resultText += "\n";
    }
    if (failed.length > 0) {
      resultText += `❌ **Başarısız Olanlar (${failed.length}):**\n`;
      failed.forEach(f => {
        const namePart = f.name ? `#${f.name} ` : "";
        resultText += `- ${namePart}(\`${f.channelId}\`): ${f.reason}\n`;
      });
    }

    const resultChunks = splitIntoChunks("📝 **Açıklama Güncelleme Raporu**", resultText.split("\n"));
    return sendChunkedMessages(message, resultChunks);
  }

  // Güncelleme değilse, mevcut kanal açıklamalarını listele
  await message.guild.channels.fetch().catch(() => {});
  const channels = message.guild.channels.cache
    .filter(c => c.type !== ChannelType.GuildCategory)
    .sort((a, b) => {
      const posA = a.parent ? a.parent.position * 1000 + a.position : a.position;
      const posB = b.parent ? b.parent.position * 1000 + b.position : b.position;
      return posA - posB;
    });

  if (channels.size === 0) {
    return message.reply("ℹ️ Sunucuda listelenecek kanal bulunamadı.");
  }

  const lines = [];
  channels.forEach((ch) => {
    const categoryName = ch.parent ? ch.parent.name : "Kategorisiz";
    const categoryId = ch.parentId || "Yok";
    const topic = ch.topic ? ch.topic.trim() : "(Açıklama Yok)";

    if (isEditMode) {
      lines.push(`Kanal İsmi: #${ch.name} | Kanal ID: ${ch.id} | Kategori İsmi: ${categoryName} | Kategori ID: ${categoryId} | Açıklama: ${topic}`);
    } else {
      lines.push(`📝 **#${ch.name}** | ID: \`${ch.id}\` | Kategori: **${categoryName}** (\`${categoryId}\`)\n↳ *Açıklama:* ${topic}`);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Kanal Açıklamaları**`
    : `📝 **Sunucudaki Tüm Kanal Açıklamaları**`;

  const chunks = splitIntoChunks(header, lines);
  await sendChunkedMessages(message, chunks);
}

/**
 * 5. Tüm Emojiler Komutu (!tumemojiler / !tumemojilerduzenle)
 */
async function handleTumEmojiler(message, isEditMode = false) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` veya `Emojileri Yönet` yetkisine sahip olmalısınız.");
  }

  await message.guild.emojis.fetch().catch(() => {});
  const emojis = message.guild.emojis.cache.sort((a, b) => a.name.localeCompare(b.name));

  if (emojis.size === 0) {
    return message.reply("ℹ️ Sunucuda özel emoji bulunamadı.");
  }

  const lines = [];
  emojis.forEach((emoji) => {
    const typeStr = emoji.animated ? "Hareketli (GIF)" : "Sabit (PNG)";
    const mentionCode = emoji.toString();
    if (isEditMode) {
      lines.push(`Emoji İsmi: :${emoji.name}: | Emoji ID: ${emoji.id} | Tür: ${typeStr} | Kod: ${mentionCode} | URL: ${emoji.url}`);
    } else {
      lines.push(`${mentionCode} **:${emoji.name}:** | ID: \`${emoji.id}\` | Tür: \`${typeStr}\` | Kod: \`${mentionCode}\``);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Özel Emojiler**`
    : `😀 **Sunucudaki Tüm Özel Emojiler**`;

  const chunks = splitIntoChunks(header, lines);
  await sendChunkedMessages(message, chunks);
}

/**
 * 6. Tüm Çıkartmalar Komutu (!tumcikartmalar / !tumcikartmalarduzenle / !tumstickerlar)
 */
async function handleTumCikartmalar(message, isEditMode = false) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` veya `Çıkartmaları Yönet` yetkisine sahip olmalısınız.");
  }

  await message.guild.stickers.fetch().catch(() => {});
  const stickers = message.guild.stickers.cache.sort((a, b) => a.name.localeCompare(b.name));

  if (stickers.size === 0) {
    return message.reply("ℹ️ Sunucuda özel çıkartma (sticker) bulunamadı.");
  }

  const lines = [];
  stickers.forEach((st) => {
    const desc = st.description ? st.description : "Açıklama yok";
    const format = st.format ? st.format : "Bilinmiyor";
    if (isEditMode) {
      lines.push(`Çıkartma İsmi: ${st.name} | Çıkartma ID: ${st.id} | Açıklama: ${desc} | Format: ${format} | URL: ${st.url}`);
    } else {
      lines.push(`🏷️ **${st.name}** | ID: \`${st.id}\` | Format: \`${format}\` | Açıklama: *${desc}*`);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Çıkartmalar (Stickers)**`
    : `🏷️ **Sunucudaki Tüm Çıkartmalar (Stickers)**`;

  const chunks = splitIntoChunks(header, lines);
  await sendChunkedMessages(message, chunks);
}

/**
 * 7. Tüm Ses Kanalları Komutu (!tumseskanallari / !tumseskanallariduzenle)
 */
async function handleTumSesKanallari(message, isEditMode = false) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` veya `Kanalları Yönet` yetkisine sahip olmalısınız.");
  }

  await message.guild.channels.fetch().catch(() => {});
  const voiceChannels = message.guild.channels.cache
    .filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice)
    .sort((a, b) => a.position - b.position);

  if (voiceChannels.size === 0) {
    return message.reply("ℹ️ Sunucuda ses kanalı bulunamadı.");
  }

  const lines = [];
  voiceChannels.forEach((vc) => {
    const catName = vc.parent ? vc.parent.name : "Kategorisiz";
    const catId = vc.parentId || "Yok";
    const limit = vc.userLimit ? `${vc.userLimit} Kişi` : "Sınırsız";
    const bitrate = vc.bitrate ? `${Math.round(vc.bitrate / 1000)} kbps` : "Bilinmiyor";
    const connectedCount = vc.members.size;
    const typeStr = vc.type === ChannelType.GuildStageVoice ? "Sahne Kanalı" : "Ses Kanalı";

    if (isEditMode) {
      lines.push(`Ses Kanalı: #${vc.name} | ID: ${vc.id} | Kategori: ${catName} | Kategori ID: ${catId} | Tür: ${typeStr} | Limit: ${limit} | Bitrate: ${bitrate} | Odadaki Üye: ${connectedCount}`);
    } else {
      lines.push(`🔊 **#${vc.name}** | ID: \`${vc.id}\` | Kategori: **${catName}** | Limit: \`${limit}\` | Bitrate: \`${bitrate}\` | Üyeler: \`${connectedCount}\``);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Ses Kanalları**`
    : `🔊 **Sunucudaki Tüm Ses Kanalları**`;

  const chunks = splitIntoChunks(header, lines);
  await sendChunkedMessages(message, chunks);
}

/**
 * 8. Tüm Yetkililer / Personeller Komutu (!tumyetkililer / !tumyetkililerduzenle)
 */
async function handleTumYetkililer(message, isEditMode = false) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` yetkisine sahip olmalısınız.");
  }

  await message.guild.members.fetch().catch(() => {});
  const staffMembers = message.guild.members.cache
    .filter(m => !m.user.bot && (
      m.permissions.has(PermissionFlagsBits.Administrator) ||
      m.permissions.has(PermissionFlagsBits.ManageGuild) ||
      m.permissions.has(PermissionFlagsBits.ManageChannels) ||
      m.permissions.has(PermissionFlagsBits.ManageMessages) ||
      m.permissions.has(PermissionFlagsBits.ModerateMembers) ||
      m.roles.cache.some(r => {
        const ln = r.name.toLowerCase();
        return ln.includes("mod") || ln.includes("yetkili") || ln.includes("personel") || ln.includes("admin") || ln.includes("kurucu") || ln.includes("rehber");
      })
    ))
    .sort((a, b) => (b.roles.highest?.position || 0) - (a.roles.highest?.position || 0));

  if (staffMembers.size === 0) {
    return message.reply("ℹ️ Sunucuda yetkili üye bulunamadı.");
  }

  const lines = [];
  staffMembers.forEach((m) => {
    const highestRole = m.roles.highest ? m.roles.highest.name : "Rolsüz";
    const highestRoleId = m.roles.highest ? m.roles.highest.id : "Yok";
    const isAdmin = m.permissions.has(PermissionFlagsBits.Administrator) ? "Evet" : "Hayır";

    if (isEditMode) {
      lines.push(`Yetkili: ${m.user.tag} | Kullanıcı ID: ${m.id} | En Yüksek Rol: ${highestRole} | Rol ID: ${highestRoleId} | Yönetici Yetkisi: ${isAdmin}`);
    } else {
      lines.push(`👮 **${m.user.tag}** (<@${m.id}>) | ID: \`${m.id}\` | Rol: **${highestRole}** | Yönetici: \`${isAdmin}\``);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Yetkililer & Personeller**`
    : `👮 **Sunucudaki Tüm Yetkililer & Personeller**`;

  const chunks = splitIntoChunks(header, lines);
  await sendChunkedMessages(message, chunks);
}

/**
 * 9. Tüm Webhooklar Komutu (!tumwebhooklar / !tumwebhooklarduzenle)
 */
async function handleTumWebhooklar(message, isEditMode = false) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` veya `Webhookları Yönet` yetkisine sahip olmalısınız.");
  }

  const webhooks = await message.guild.fetchWebhooks().catch(() => null);
  if (!webhooks || webhooks.size === 0) {
    return message.reply("ℹ️ Sunucuda herhangi bir webhook bulunamadı.");
  }

  const lines = [];
  webhooks.forEach((wh) => {
    const channelName = wh.channel ? wh.channel.name : "Bilinmiyor";
    const creator = wh.owner ? wh.owner.tag : "Bilinmiyor";

    if (isEditMode) {
      lines.push(`Webhook İsmi: ${wh.name} | Webhook ID: ${wh.id} | Kanal: #${channelName} | Kanal ID: ${wh.channelId} | Oluşturan: ${creator}`);
    } else {
      lines.push(`🔗 **${wh.name}** | ID: \`${wh.id}\` | Kanal: **#${channelName}** (\`${wh.channelId}\`) | Oluşturan: \`${creator}\``);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Webhooklar**`
    : `🔗 **Sunucudaki Tüm Webhooklar**`;

  const chunks = splitIntoChunks(header, lines);
  await sendChunkedMessages(message, chunks);
}

/**
 * 10. Sunucu Özeti / Bilgisi (!sunucubilgi / !sunucuozet)
 */
async function handleSunucuBilgi(message) {
  if (!checkPermission(message)) {
    return message.reply("❌ Bu komutu kullanmak için `Yönetici` yetkisine sahip olmalısınız.");
  }

  const guild = message.guild;
  await guild.channels.fetch().catch(() => {});
  await guild.roles.fetch().catch(() => {});
  await guild.emojis.fetch().catch(() => {});
  await guild.stickers.fetch().catch(() => {});

  const totalMembers = guild.memberCount || guild.members.cache.size;
  const botCount = guild.members.cache.filter(m => m.user.bot).size;
  const humanCount = totalMembers - botCount;

  const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
  const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
  const announcementChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildAnnouncement).size;
  const forumChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildForum).size;
  const stageChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildStageVoice).size;

  const normalEmojis = guild.emojis.cache.filter(e => !e.animated).size;
  const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
  const totalStickers = guild.stickers.cache.size;

  const totalRoles = guild.roles.cache.filter(r => r.id !== guild.id).size;
  const boostLevel = guild.premiumTier || 0;
  const boostCount = guild.premiumSubscriptionCount || 0;

  const report =
    `📊 **${guild.name} — Tam Sunucu Detay Özeti**\n\n` +
    `🆔 **Sunucu ID:** \`${guild.id}\`\n` +
    `👑 **Sunucu Sahibi:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n` +
    `📅 **Kuruluş Tarihi:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n\n` +
    `👥 **Üyeler:**\n` +
    `• Toplam Üye: **${totalMembers}** (Gerçek: **${humanCount}**, Bot: **${botCount}**)\n` +
    `• Takviye (Boost): Seviye **${boostLevel}** (**${boostCount}** Takviye)\n\n` +
    `📁 **Kanallar & Kategoriler (Toplam ${guild.channels.cache.size}):**\n` +
    `• Kategoriler: **${categories}**\n` +
    `• Metin Kanalları: **${textChannels}**\n` +
    `• Ses Kanalları: **${voiceChannels}**\n` +
    `• Duyuru Kanalları: **${announcementChannels}**\n` +
    `• Forum Kanalları: **${forumChannels}**\n` +
    `• Sahne Kanalları: **${stageChannels}**\n\n` +
    `🛡️ **Roller:** **${totalRoles}** Rol\n\n` +
    `🎨 **Görseller:**\n` +
    `• Sabit Emojiler: **${normalEmojis}**\n` +
    `• Hareketli Emojiler (GIF): **${animatedEmojis}**\n` +
    `• Çıkartmalar (Stickers): **${totalStickers}**\n\n` +
    `💡 *Tüm detayları görmek ve düzenleme formatında almak için ` +
    "`!tumkategoriler`, `!tumkanallar`, `!tumroller`, `!tumemojiler`, `!tumcikartmalar`, `!tumseskanallari`, `!tumyetkililer` " +
    `komutlarını kullanabilirsiniz.*`;

  await message.reply(report);
}

/**
 * 11. Yardım Rehberi (!sunucukomutlari)
 */
async function handleSunucuYardim(message) {
  const guide =
    `🛠️ **Sunucu İnceleme ve Düzenleme Komutları Rehberi**\n\n` +
    `📌 **Normal İnceleme Komutları:**\n` +
    `• \`!tumkategoriler\` — Sunucudaki tüm kategorileri listeler.\n` +
    `• \`!tumkanallar\` — Sunucudaki tüm kanalları kategorileriyle listeler.\n` +
    `• \`!tumroller\` — Sunucudaki tüm rolleri listeler.\n` +
    `• \`!tumkanalaciklamalari\` — Sunucudaki kanal açıklamalarını (topic) listeler.\n` +
    `• \`!tumemojiler\` — Sunucudaki tüm emojileri, ID'lerini ve türlerini listeler.\n` +
    `• \`!tumcikartmalar\` (veya \`!tumstickerlar\`) — Sunucudaki çıkartmaları listeler.\n` +
    `• \`!tumseskanallari\` — Ses kanallarını, limitlerini ve bitratelerini listeler.\n` +
    `• \`!tumyetkililer\` — Sunucudaki tüm yetkili ve personel kadrosunu listeler.\n` +
    `• \`!tumwebhooklar\` — Sunucudaki webhookları listeler.\n` +
    `• \`!sunucubilgi\` — Sunucunun genel özet istatistiklerini verir.\n\n` +
    `📋 **Kopyalanabilir / Eşleme (Düzenle) Komutları:**\n` +
    `• \`!tumkategorilerduzenle\`\n` +
    `• \`!tumkanallarduzenle\`\n` +
    `• \`!tumrollerduzenle\`\n` +
    `• \`!tumkanalaciklamalariduzenle\` *(Kanal ID + Açıklama toplu düzenleme destekler)*\n` +
    `• \`!tumemojilerduzenle\`\n` +
    `• \`!tumcikartmalarduzenle\`\n` +
    `• \`!tumseskanallariduzenle\`\n` +
    `• \`!tumyetkililerduzenle\`\n` +
    `• \`!tumwebhooklarduzenle\`\n\n` +
    `🔒 **Arşiv Komutu:**\n` +
    `• \`!arsiv [kanal_id, kanal_id_2...]\` — Kanalları gizli arşiv kategorisine taşır ve görünmez yapar.`;

  await message.reply(guide);
}

/**
 * Mesaj içeriğindeki komutları kontrol eden ana yönlendirici
 */
async function handleGuildInspectionMessage(message) {
  const content = (message.content || "").trim();
  const firstLine = content.split("\n")[0].trim().toLowerCase();
  const commandWord = firstLine.split(/\s+/)[0];

  // 1. Kategoriler
  if (["!tumkategoriler", "!tümkategoriler"].includes(commandWord)) {
    await handleTumKategoriler(message, false);
    return true;
  }
  if ([
    "!tumkategorilerduzenle",
    "!tümkategorilerdüzenle",
    "!tumkategoriler-duzenle",
    "!tümkategoriler-düzenle",
    "!tumkategoriduzenle",
    "!tümkategoridüzenle"
  ].includes(commandWord)) {
    await handleTumKategoriler(message, true);
    return true;
  }

  // 2. Roller
  if (["!tumroller", "!tümroller", "!tumrollerveidleriveisimleri"].includes(commandWord)) {
    await handleTumRoller(message, false);
    return true;
  }
  if ([
    "!tumrollerduzenle",
    "!tümrollerdüzenle",
    "!tumroller-duzenle",
    "!tümroller-düzenle",
    "!tumrolduzenle",
    "!tümroldüzenle"
  ].includes(commandWord)) {
    await handleTumRoller(message, true);
    return true;
  }

  // 3. Kanallar
  if (["!tumkanallar", "!tümkanallar"].includes(commandWord) && !firstLine.includes("aciklama") && !firstLine.includes("açıklama") && !firstLine.includes("duzenle") && !firstLine.includes("düzenle")) {
    await handleTumKanallar(message, false);
    return true;
  }
  if ([
    "!tumkanallarduzenle",
    "!tümkanallardüzenle",
    "!tumkanallar-duzenle",
    "!tümkanallar-düzenle",
    "!tumkanalduzenle",
    "!tümkanaldüzenle"
  ].includes(commandWord)) {
    await handleTumKanallar(message, true);
    return true;
  }

  // 4. Kanal Açıklamaları
  if ([
    "!tumkanalaciklamalari",
    "!tümkanalaçıklamaları",
    "!tumkanalaciklamalar",
    "!tümkanalaçıklamalar",
    "!tumkanallarınaciklamalari",
    "!tümkanallarınaçıklamaları"
  ].includes(commandWord)) {
    await handleTumKanalAciklamalari(message, false);
    return true;
  }
  if ([
    "!tumkanalaciklamalariduzenle",
    "!tümkanalaçıklamalarıdüzenle",
    "!tumkanalaciklamalarduzenle",
    "!tümkanalaçıklamardüzenle",
    "!tumkanalaciklamalar-duzenle",
    "!tümkanalaçıklamalar-düzenle",
    "!tumkanallaraciklamaduzenle",
    "!tumkanallaraciklama",
    "!tümkanallaraciklama",
    "!tumkanallaraciklamaguncelle"
  ].includes(commandWord)) {
    await handleTumKanalAciklamalari(message, true);
    return true;
  }

  // 5. Emojiler
  if (["!tumemojiler", "!tümemojiler", "!tumemoji", "!tümemoji"].includes(commandWord)) {
    await handleTumEmojiler(message, false);
    return true;
  }
  if ([
    "!tumemojilerduzenle",
    "!tümemojilerdüzenle",
    "!tumemojiduzenle",
    "!tümemojidüzenle",
    "!tumemojiler-duzenle",
    "!tümemojiler-düzenle"
  ].includes(commandWord)) {
    await handleTumEmojiler(message, true);
    return true;
  }

  // 6. Çıkartmalar (Stickers)
  if ([
    "!tumcikartmalar",
    "!tümçıkartmalar",
    "!tumstickerlar",
    "!tümstickerlar",
    "!tumcikartma",
    "!tümçıkartma",
    "!tumsticker",
    "!tümsticker"
  ].includes(commandWord)) {
    await handleTumCikartmalar(message, false);
    return true;
  }
  if ([
    "!tumcikartmalarduzenle",
    "!tümçıkartmalardüzenle",
    "!tumstickerlarduzenle",
    "!tümstickerlardüzenle",
    "!tumcikartma-duzenle",
    "!tumsticker-duzenle"
  ].includes(commandWord)) {
    await handleTumCikartmalar(message, true);
    return true;
  }

  // 7. Ses Kanalları
  if ([
    "!tumseskanallari",
    "!tümseskanalları",
    "!tumsesler",
    "!tümsesler",
    "!tumseskanalları",
    "!tümseskanallari"
  ].includes(commandWord)) {
    await handleTumSesKanallari(message, false);
    return true;
  }
  if ([
    "!tumseskanallariduzenle",
    "!tümseskanallarıdüzenle",
    "!tumsesduzenle",
    "!tümsesdüzenle",
    "!tumseskanallar-duzenle"
  ].includes(commandWord)) {
    await handleTumSesKanallari(message, true);
    return true;
  }

  // 8. Yetkililer / Personeller
  if ([
    "!tumyetkililer",
    "!tümyetkililer",
    "!tumpersoneller",
    "!tümpersoneller",
    "!tumpersonel",
    "!tümpersonel",
    "!tumkadro",
    "!tümkadro"
  ].includes(commandWord)) {
    await handleTumYetkililer(message, false);
    return true;
  }
  if ([
    "!tumyetkililerduzenle",
    "!tümyetkililerdüzenle",
    "!tumpersonelduzenle",
    "!tümpersoneldüzenle",
    "!tumyetkili-duzenle"
  ].includes(commandWord)) {
    await handleTumYetkililer(message, true);
    return true;
  }

  // 9. Webhooklar
  if (["!tumwebhooklar", "!tümwebhooklar", "!tumwebhook", "!tümwebhook"].includes(commandWord)) {
    await handleTumWebhooklar(message, false);
    return true;
  }
  if ([
    "!tumwebhooklarduzenle",
    "!tümwebhooklardüzenle",
    "!tumwebhookduzenle",
    "!tümwebhookdüzenle"
  ].includes(commandWord)) {
    await handleTumWebhooklar(message, true);
    return true;
  }

  // 10. Sunucu Bilgisi / Özeti
  if ([
    "!sunucubilgi",
    "!tumsunucubilgi",
    "!sunucuozet",
    "!sunucuözet",
    "!tumsunucuozet",
    "!tumsunucuözet",
    "!serverinfo"
  ].includes(commandWord)) {
    await handleSunucuBilgi(message);
    return true;
  }

  // 11. Rehber
  if ([
    "!sunucukomutlari",
    "!sunucukomutları",
    "!incelekomutlari",
    "!incelekomutları"
  ].includes(commandWord)) {
    await handleSunucuYardim(message);
    return true;
  }

  return false;
}

module.exports = {
  handleGuildInspectionMessage,
  handleTumKategoriler,
  handleTumRoller,
  handleTumKanallar,
  handleTumKanalAciklamalari,
  handleTumEmojiler,
  handleTumCikartmalar,
  handleTumSesKanallari,
  handleTumYetkililer,
  handleTumWebhooklar,
  handleSunucuBilgi,
  handleSunucuYardim
};
