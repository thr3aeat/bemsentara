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
 * Boş mesaj gönderme hatalarını kesin olarak engeller.
 */
function splitIntoChunks(headerPrefix, lines, maxLen = 1500) {
  const validLines = (lines || [])
    .map(l => (l !== null && l !== undefined ? String(l).trim() : ""))
    .filter(l => l.length > 0);

  if (validLines.length === 0) {
    return [`${headerPrefix}\n\n*(Kayıt bulunamadı)*`];
  }

  const rawChunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const line of validLines) {
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
    const header = `${headerPrefix} (Bölüm ${partNum}/${totalParts}) - Toplam ${validLines.length} Kayıt:\n\n`;
    const fullText = header + content;
    return fullText.trim().length > 0 ? fullText : `${headerPrefix}\n\n*(Kayıt bulunamadı)*`;
  });
}

/**
 * Bölünmüş mesajları sırayla Discord kanalına gönderir.
 * 1. Bölüm dahil tüm bölümlerin eksiksiz ve sırayla kanala düşmesini sağlar.
 */
async function sendChunkedMessages(message, chunks) {
  const validChunks = (chunks || [])
    .map(c => (c !== null && c !== undefined ? String(c).trim() : ""))
    .filter(c => c.length > 0);

  const targetChannel = message.channel;
  if (!targetChannel || typeof targetChannel.send !== "function") {
    return;
  }

  if (validChunks.length === 0) {
    await targetChannel.send("ℹ️ Gösterilecek herhangi bir kayıt bulunamadı.").catch(() => {});
    return;
  }

  for (let i = 0; i < validChunks.length; i++) {
    const text = validChunks[i];
    if (!text) continue;

    try {
      await targetChannel.send({ content: text, allowedMentions: { parse: [] } });
    } catch (sendErr) {
      console.error(`[Guild Inspection sendChunkedMessages part ${i + 1} error]:`, sendErr.message);
      try {
        await targetChannel.send({ content: text.slice(0, 1500), allowedMentions: { parse: [] } });
      } catch (fallbackErr) {
        console.error(`[Guild Inspection fallback error part ${i + 1}]:`, fallbackErr.message);
      }
    }

    if (i < validChunks.length - 1) {
      await new Promise(res => setTimeout(res, 350));
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

  const rawLines = (message.content || "").split("\n");
  const updatePairs = [];

  // Çok satırlı girdi varsa ve kategori isim güncellemesi isteniyorsa
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (i === 0) {
      line = line.replace(/^![a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]+/i, "").trim();
    }
    if (!line) continue;

    // 1) "kategori_id ----- yeni kategori ismi" formatı
    if (line.includes("-----")) {
      const parts = line.split("-----");
      const catId = parts[0].trim().replace(/[<#>]/g, "");
      const newName = parts.slice(1).join("-----").trim();
      if (catId && newName) updatePairs.push({ catId, newName });
    }
    // 2) "Kategori ID: 12345 | Kategori İsmi: ..." formatı
    else if (/Kategori ID:\s*([0-9]+)/i.test(line) && /Kategori İsmi:\s*(.*)/i.test(line)) {
      const idMatch = line.match(/Kategori ID:\s*([0-9]+)/i);
      const nameMatch = line.match(/Kategori İsmi:\s*([^|]+)/i);
      if (idMatch && idMatch[1] && nameMatch && nameMatch[1]) {
        updatePairs.push({ catId: idMatch[1], newName: nameMatch[1].trim() });
      }
    }
  }

  // Toplu güncelleme parametreleri verilmişse kategorileri yeniden adlandır
  if (updatePairs.length > 0) {
    const statusMsg = await message.reply(`🔄 **${updatePairs.length}** kategorinin ismi güncelleniyor, lütfen bekleyin...`);
    const success = [];
    const failed = [];

    for (const pair of updatePairs) {
      const { catId, newName } = pair;
      try {
        let cat = message.guild.channels.cache.get(catId);
        if (!cat) {
          cat = await message.guild.channels.fetch(catId).catch(() => null);
        }

        if (!cat) {
          failed.push({ catId, reason: "Kategori bulunamadı." });
          continue;
        }

        if (cat.type !== ChannelType.GuildCategory) {
          failed.push({ catId, name: cat.name, reason: "Bu kanal bir kategori değil." });
          continue;
        }

        const oldName = cat.name;
        await cat.setName(newName, `Yetkili: ${message.author.tag} tarafından kategori ismi güncellendi.`);
        success.push({ id: cat.id, oldName, newName });
      } catch (err) {
        failed.push({ catId, reason: err.message || "Bilinmeyen hata" });
      }
    }

    const reportLines = [];
    if (success.length > 0) {
      reportLines.push(`✅ **İsmi Başarıyla Güncellenen Kategoriler (${success.length}):**`);
      success.forEach(s => reportLines.push(`- **${s.oldName}** ➔ **${s.newName}** (\`${s.id}\`)`));
      reportLines.push("");
    }
    if (failed.length > 0) {
      reportLines.push(`❌ **Başarısız Olanlar (${failed.length}):**`);
      failed.forEach(f => {
        const namePart = f.name ? `**${f.name}** ` : "";
        reportLines.push(`- ${namePart}(\`${f.catId}\`): ${f.reason}`);
      });
    }

    const resultChunks = splitIntoChunks("📁 **Kategori Güncelleme Raporu**", reportLines);
    await statusMsg.delete().catch(() => {});
    return sendChunkedMessages(message, resultChunks);
  }

  // Güncelleme değilse mevcut kategorileri listele
  await message.guild.channels.fetch().catch(() => {});
  const categories = message.guild.channels.cache
    .filter(c => c && c.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position);

  if (categories.size === 0) {
    return message.reply("ℹ️ Sunucuda herhangi bir kategori bulunamadı.");
  }

  const lines = [];
  categories.forEach((cat) => {
    if (!cat) return;
    const childChannels = message.guild.channels.cache.filter(c => c && c.parentId === cat.id);
    const catName = cat.name || "İsimsiz Kategori";
    if (isEditMode) {
      lines.push(`Kategori İsmi: ${catName} | Kategori ID: ${cat.id} | Sıra: ${cat.position} | Kanal Sayısı: ${childChannels.size}`);
    } else {
      lines.push(`📁 **${catName}** | ID: \`${cat.id}\` | Sıra: \`${cat.position}\` | Kanal Sayısı: \`${childChannels.size}\``);
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

  const rawLines = (message.content || "").split("\n");
  const updatePairs = [];

  // Çok satırlı girdi varsa ve rol isim güncellemesi isteniyorsa
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (i === 0) {
      line = line.replace(/^[!\.\-\_]+[a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]+/i, "").trim();
    }
    if (!line || line === "+") continue;

    // 1) "rol_id ----- yeni rol ismi" formatı
    if (line.includes("-----")) {
      const parts = line.split("-----");
      const roleId = parts[0].trim().replace(/[<@&>]/g, "");
      const newName = parts.slice(1).join("-----").trim();
      if (roleId && newName) updatePairs.push({ roleId, newName });
    }
    // 2) "Rol ID: 12345 | Rol İsmi: ..." formatı
    else if (/Rol ID:\s*([0-9]+)/i.test(line) && /Rol İsmi:\s*(.*)/i.test(line)) {
      const idMatch = line.match(/Rol ID:\s*([0-9]+)/i);
      const nameMatch = line.match(/Rol İsmi:\s*([^|]+)/i);
      if (idMatch && idMatch[1] && nameMatch && nameMatch[1]) {
        updatePairs.push({ roleId: idMatch[1], newName: nameMatch[1].trim() });
      }
    }
  }

  // Toplu güncelleme parametreleri verilmişse rollerin isimlerini güncelle
  if (updatePairs.length > 0) {
    const statusMsg = await message.reply(`🔄 **${updatePairs.length}** rolün ismi güncelleniyor, lütfen bekleyin...`);
    const success = [];
    const failed = [];

    for (const pair of updatePairs) {
      const { roleId, newName } = pair;
      try {
        let role = message.guild.roles.cache.get(roleId);
        if (!role) {
          role = await message.guild.roles.fetch(roleId).catch(() => null);
        }

        if (!role) {
          failed.push({ roleId, reason: "Rol sunucuda bulunamadı." });
          continue;
        }

        if (role.id === message.guild.id || role.name === "@everyone") {
          failed.push({ roleId, name: role.name, reason: "@everyone rolü yeniden adlandırılamaz." });
          continue;
        }

        const botMember = message.guild.members.me || await message.guild.members.fetchMe().catch(() => null);
        if (botMember && role.position >= botMember.roles.highest.position) {
          failed.push({ roleId, name: role.name, reason: "Rol hiyerarşisi: Bu rol botun yetkisinden daha üst sırada." });
          continue;
        }

        const oldName = role.name;
        await role.setName(newName, `Yetkili: ${message.author.tag} tarafından toplu rol ismi güncellemesi yapıldı.`);
        success.push({ id: role.id, oldName, newName: role.name });
      } catch (err) {
        failed.push({ roleId, reason: err.message || "Bilinmeyen hata" });
      }
    }

    const reportLines = [];
    if (success.length > 0) {
      reportLines.push(`✅ **İsmi Başarıyla Güncellenen Roller (${success.length}):**`);
      success.forEach(s => reportLines.push(`- **${s.oldName}** ➔ **${s.newName}** (\`${s.id}\`)`));
      reportLines.push("");
    }
    if (failed.length > 0) {
      reportLines.push(`❌ **Başarısız Olanlar (${failed.length}):**`);
      failed.forEach(f => {
        const namePart = f.name ? `**${f.name}** ` : "";
        reportLines.push(`- ${namePart}(\`${f.roleId}\`): ${f.reason}`);
      });
    }

    const resultChunks = splitIntoChunks("🛡️ **Rol İsimleri Güncelleme Raporu**", reportLines);
    await statusMsg.delete().catch(() => {});
    return sendChunkedMessages(message, resultChunks);
  }

  // Güncelleme değilse mevcut rolleri listele
  const fetchedRoles = await message.guild.roles.fetch().catch(() => message.guild.roles.cache);
  const roles = (fetchedRoles || message.guild.roles.cache)
    .filter(r => r && r.id !== message.guild.id && r.name !== "@everyone")
    .sort((a, b) => b.position - a.position);

  if (!roles || roles.size === 0) {
    return message.reply("ℹ️ Sunucuda listelenecek özel rol bulunamadı.");
  }

  const lines = [];
  roles.forEach((role) => {
    if (!role) return;
    const memberCount = role.members ? role.members.size : 0;
    const colorHex = role.hexColor && role.hexColor !== "#000000" ? role.hexColor : "Varsayılan";
    const roleName = role.name || "İsimsiz Rol";
    if (isEditMode) {
      lines.push(`Rol İsmi: ${roleName} | Rol ID: ${role.id} | Sıra: ${role.position} | Renk: ${colorHex} | Üye Sayısı: ${memberCount}`);
    } else {
      lines.push(`🛡️ **${roleName}** | ID: \`${role.id}\` | Sıra: \`${role.position}\` | Renk: \`${colorHex}\` | Üyeler: \`${memberCount}\``);
    }
  });

  const header = isEditMode
    ? `📋 **[DÜZENLEME FORMATI] Sunucudaki Tüm Roller**`
    : `🛡️ **Sunucudaki Tüm Roller**`;

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

  const rawLines = (message.content || "").split("\n");
  const updatePairs = [];

  // Çok satırlı girdi varsa ve kanal isim güncellemesi isteniyorsa
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (i === 0) {
      line = line.replace(/^![a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]+/i, "").trim();
    }
    if (!line) continue;

    // 1) "kanal_id ----- yeni kanal ismi" formatı
    if (line.includes("-----")) {
      const parts = line.split("-----");
      const channelId = parts[0].trim().replace(/[<#>]/g, "");
      const newName = parts.slice(1).join("-----").trim().replace(/^#+/, "");
      if (channelId && newName) updatePairs.push({ channelId, newName });
    }
    // 2) "Kanal ID: 12345 | Kanal İsmi: ..." formatı
    else if (/Kanal ID:\s*([0-9]+)/i.test(line) && /Kanal İsmi:\s*(.*)/i.test(line)) {
      const idMatch = line.match(/Kanal ID:\s*([0-9]+)/i);
      const nameMatch = line.match(/Kanal İsmi:\s*([^|]+)/i);
      if (idMatch && idMatch[1] && nameMatch && nameMatch[1]) {
        const cleanName = nameMatch[1].trim().replace(/^#+/, "");
        updatePairs.push({ channelId: idMatch[1], newName: cleanName });
      }
    }
  }

  // Toplu güncelleme parametreleri verilmişse kanalların isimlerini değiştir
  if (updatePairs.length > 0) {
    const statusMsg = await message.reply(`🔄 **${updatePairs.length}** kanalın ismi güncelleniyor, lütfen bekleyin...`);
    const success = [];
    const failed = [];

    for (const pair of updatePairs) {
      const { channelId, newName } = pair;
      try {
        let ch = message.guild.channels.cache.get(channelId);
        if (!ch) {
          ch = await message.guild.channels.fetch(channelId).catch(() => null);
        }

        if (!ch) {
          failed.push({ channelId, reason: "Kanal bulunamadı." });
          continue;
        }

        if (ch.type === ChannelType.GuildCategory) {
          failed.push({ channelId, name: ch.name, reason: "Kategorileri yeniden adlandırmak için !tumkategorilerduzenle kullanınız." });
          continue;
        }

        const oldName = ch.name;
        await ch.setName(newName, `Yetkili: ${message.author.tag} tarafından kanal ismi güncellendi.`);
        success.push({ id: ch.id, oldName, newName: ch.name });
      } catch (err) {
        failed.push({ channelId, reason: err.message || "Bilinmeyen hata" });
      }
    }

    const reportLines = [];
    if (success.length > 0) {
      reportLines.push(`✅ **İsmi Başarıyla Güncellenen Kanallar (${success.length}):**`);
      success.forEach(s => reportLines.push(`- **#${s.oldName}** ➔ **#${s.newName}** (\`${s.id}\`)`));
      reportLines.push("");
    }
    if (failed.length > 0) {
      reportLines.push(`❌ **Başarısız Olanlar (${failed.length}):**`);
      failed.forEach(f => {
        const namePart = f.name ? `**#${f.name}** ` : "";
        reportLines.push(`- ${namePart}(\`${f.channelId}\`): ${f.reason}`);
      });
    }

    const resultChunks = splitIntoChunks("💬 **Kanal İsimleri Güncelleme Raporu**", reportLines);
    await statusMsg.delete().catch(() => {});
    return sendChunkedMessages(message, resultChunks);
  }

  // Güncelleme değilse kanalları listele
  await message.guild.channels.fetch().catch(() => {});
  const channels = message.guild.channels.cache
    .filter(c => c && c.type !== ChannelType.GuildCategory)
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
    if (!ch) return;
    const categoryName = ch.parent ? ch.parent.name : "Kategorisiz";
    const categoryId = ch.parentId || "Yok";
    const typeName = getChannelTypeName(ch.type);
    const chName = ch.name || "isimsiz-kanal";

    if (isEditMode) {
      lines.push(`Kanal İsmi: #${chName} | Kanal ID: ${ch.id} | Kategori İsmi: ${categoryName} | Kategori ID: ${categoryId} | Tür: ${typeName}`);
    } else {
      lines.push(`💬 **#${chName}** | ID: \`${ch.id}\` | Kategori: **${categoryName}** (\`${categoryId}\`) | Tür: \`${typeName}\``);
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

  const rawLines = (message.content || "").split("\n");
  const updatePairs = [];

  // Çok satırlı girdi varsa ve güncelleme isteniyorsa
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (i === 0) {
      line = line.replace(/^[!\.\-\_]+[a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]+/i, "").trim();
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

    const reportLines = [];
    if (success.length > 0) {
      reportLines.push(`✅ **Başarıyla Güncellenenler (${success.length}):**`);
      success.forEach(s => reportLines.push(`- #${s.name} (\`${s.id}\`)`));
      reportLines.push("");
    }
    if (failed.length > 0) {
      reportLines.push(`❌ **Başarısız Olanlar (${failed.length}):**`);
      failed.forEach(f => {
        const namePart = f.name ? `#${f.name} ` : "";
        reportLines.push(`- ${namePart}(\`${f.channelId}\`): ${f.reason}`);
      });
    }

    const resultChunks = splitIntoChunks("📝 **Açıklama Güncelleme Raporu**", reportLines);
    await statusMsg.delete().catch(() => {});
    return sendChunkedMessages(message, resultChunks);
  }

  // Güncelleme değilse, mevcut kanal açıklamalarını listele
  await message.guild.channels.fetch().catch(() => {});
  const channels = message.guild.channels.cache
    .filter(c => c && c.type !== ChannelType.GuildCategory)
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
    if (!ch) return;
    const categoryName = ch.parent ? ch.parent.name : "Kategorisiz";
    const categoryId = ch.parentId || "Yok";
    const topic = ch.topic ? ch.topic.trim() : "(Açıklama Yok)";
    const chName = ch.name || "isimsiz-kanal";

    if (isEditMode) {
      lines.push(`Kanal İsmi: #${chName} | Kanal ID: ${ch.id} | Kategori İsmi: ${categoryName} | Kategori ID: ${categoryId} | Açıklama: ${topic}`);
    } else {
      lines.push(`📝 **#${chName}** | ID: \`${ch.id}\` | Kategori: **${categoryName}** (\`${categoryId}\`)\n↳ *Açıklama:* ${topic}`);
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
  const emojis = message.guild.emojis.cache
    .filter(e => e && e.id)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  if (emojis.size === 0) {
    return message.reply("ℹ️ Sunucuda özel emoji bulunamadı.");
  }

  const lines = [];
  emojis.forEach((emoji) => {
    if (!emoji) return;
    const typeStr = emoji.animated ? "Hareketli (GIF)" : "Sabit (PNG)";
    const mentionCode = emoji.toString() || `:${emoji.name}:`;
    const emojiName = emoji.name || "isimsiz_emoji";
    const emojiUrl = emoji.url || "Yok";

    if (isEditMode) {
      lines.push(`Emoji İsmi: :${emojiName}: | Emoji ID: ${emoji.id} | Tür: ${typeStr} | Kod: ${mentionCode} | URL: ${emojiUrl}`);
    } else {
      lines.push(`${mentionCode} **:${emojiName}:** | ID: \`${emoji.id}\` | Tür: \`${typeStr}\` | Kod: \`${mentionCode}\``);
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
  const stickers = message.guild.stickers.cache
    .filter(s => s && s.id)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  if (stickers.size === 0) {
    return message.reply("ℹ️ Sunucuda özel çıkartma (sticker) bulunamadı.");
  }

  const lines = [];
  stickers.forEach((st) => {
    if (!st) return;
    const desc = st.description ? st.description.trim() : "Açıklama yok";
    const format = st.format ? String(st.format) : "Bilinmiyor";
    const stName = st.name || "İsimsiz Çıkartma";
    const stUrl = st.url || "Yok";

    if (isEditMode) {
      lines.push(`Çıkartma İsmi: ${stName} | Çıkartma ID: ${st.id} | Açıklama: ${desc} | Format: ${format} | URL: ${stUrl}`);
    } else {
      lines.push(`🏷️ **${stName}** | ID: \`${st.id}\` | Format: \`${format}\` | Açıklama: *${desc}*`);
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
    .filter(c => c && (c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice))
    .sort((a, b) => a.position - b.position);

  if (voiceChannels.size === 0) {
    return message.reply("ℹ️ Sunucuda ses kanalı bulunamadı.");
  }

  const lines = [];
  voiceChannels.forEach((vc) => {
    if (!vc) return;
    const catName = vc.parent ? vc.parent.name : "Kategorisiz";
    const catId = vc.parentId || "Yok";
    const limit = vc.userLimit ? `${vc.userLimit} Kişi` : "Sınırsız";
    const bitrate = vc.bitrate ? `${Math.round(vc.bitrate / 1000)} kbps` : "Bilinmiyor";
    const connectedCount = vc.members ? vc.members.size : 0;
    const typeStr = vc.type === ChannelType.GuildStageVoice ? "Sahne Kanalı" : "Ses Kanalı";
    const vcName = vc.name || "isimsiz-ses";

    if (isEditMode) {
      lines.push(`Ses Kanalı: #${vcName} | ID: ${vc.id} | Kategori: ${catName} | Kategori ID: ${catId} | Tür: ${typeStr} | Limit: ${limit} | Bitrate: ${bitrate} | Odadaki Üye: ${connectedCount}`);
    } else {
      lines.push(`🔊 **#${vcName}** | ID: \`${vc.id}\` | Kategori: **${catName}** | Limit: \`${limit}\` | Bitrate: \`${bitrate}\` | Üyeler: \`${connectedCount}\``);
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
    .filter(m => m && !m.user?.bot && (
      m.permissions?.has(PermissionFlagsBits.Administrator) ||
      m.permissions?.has(PermissionFlagsBits.ManageGuild) ||
      m.permissions?.has(PermissionFlagsBits.ManageChannels) ||
      m.permissions?.has(PermissionFlagsBits.ManageMessages) ||
      m.permissions?.has(PermissionFlagsBits.ModerateMembers) ||
      m.roles?.cache?.some(r => {
        const ln = (r.name || "").toLowerCase();
        return ln.includes("mod") || ln.includes("yetkili") || ln.includes("personel") || ln.includes("admin") || ln.includes("kurucu") || ln.includes("rehber");
      })
    ))
    .sort((a, b) => (b.roles?.highest?.position || 0) - (a.roles?.highest?.position || 0));

  if (staffMembers.size === 0) {
    return message.reply("ℹ️ Sunucuda yetkili üye bulunamadı.");
  }

  const lines = [];
  staffMembers.forEach((m) => {
    if (!m || !m.user) return;
    const highestRole = m.roles?.highest ? m.roles.highest.name : "Rolsüz";
    const highestRoleId = m.roles?.highest ? m.roles.highest.id : "Yok";
    const isAdmin = m.permissions?.has(PermissionFlagsBits.Administrator) ? "Evet" : "Hayır";
    const tag = m.user.tag || m.user.username || m.id;

    if (isEditMode) {
      lines.push(`Yetkili: ${tag} | Kullanıcı ID: ${m.id} | En Yüksek Rol: ${highestRole} | Rol ID: ${highestRoleId} | Yönetici Yetkisi: ${isAdmin}`);
    } else {
      lines.push(`👮 **${tag}** (<@${m.id}>) | ID: \`${m.id}\` | Rol: **${highestRole}** | Yönetici: \`${isAdmin}\``);
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
    if (!wh) return;
    const channelName = wh.channel ? wh.channel.name : "Bilinmiyor";
    const creator = wh.owner ? (wh.owner.tag || wh.owner.username || wh.owner.id) : "Bilinmiyor";
    const whName = wh.name || "İsimsiz Webhook";

    if (isEditMode) {
      lines.push(`Webhook İsmi: ${whName} | Webhook ID: ${wh.id} | Kanal: #${channelName} | Kanal ID: ${wh.channelId} | Oluşturan: ${creator}`);
    } else {
      lines.push(`🔗 **${whName}** | ID: \`${wh.id}\` | Kanal: **#${channelName}** (\`${wh.channelId}\`) | Oluşturan: \`${creator}\``);
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
  if (!guild) return message.reply("❌ Sunucu bilgisi alınamadı.");

  await guild.channels.fetch().catch(() => {});
  await guild.roles.fetch().catch(() => {});
  await guild.emojis.fetch().catch(() => {});
  await guild.stickers.fetch().catch(() => {});

  const totalMembers = guild.memberCount || guild.members.cache.size;
  const botCount = guild.members.cache.filter(m => m && m.user?.bot).size;
  const humanCount = totalMembers - botCount;

  const categories = guild.channels.cache.filter(c => c && c.type === ChannelType.GuildCategory).size;
  const textChannels = guild.channels.cache.filter(c => c && c.type === ChannelType.GuildText).size;
  const voiceChannels = guild.channels.cache.filter(c => c && c.type === ChannelType.GuildVoice).size;
  const announcementChannels = guild.channels.cache.filter(c => c && c.type === ChannelType.GuildAnnouncement).size;
  const forumChannels = guild.channels.cache.filter(c => c && c.type === ChannelType.GuildForum).size;
  const stageChannels = guild.channels.cache.filter(c => c && c.type === ChannelType.GuildStageVoice).size;

  const normalEmojis = guild.emojis.cache.filter(e => e && !e.animated).size;
  const animatedEmojis = guild.emojis.cache.filter(e => e && e.animated).size;
  const totalStickers = guild.stickers.cache.size;

  const totalRoles = guild.roles.cache.filter(r => r && r.id !== guild.id).size;
  const boostLevel = guild.premiumTier || 0;
  const boostCount = guild.premiumSubscriptionCount || 0;

  const report =
    `📊 **${guild.name || "Sunucu"} — Tam Sunucu Detay Özeti**\n\n` +
    `🆔 **Sunucu ID:** \`${guild.id}\`\n` +
    `👑 **Sunucu Sahibi:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n` +
    `📅 **Kuruluş Tarihi:** <t:${Math.floor((guild.createdTimestamp || Date.now()) / 1000)}:F>\n\n` +
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

  await message.reply({ content: report, allowedMentions: { parse: [] } });
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

  await message.reply({ content: guide, allowedMentions: { parse: [] } });
}

/**
 * Komut adını normalize eden yardımcı fonksiyon
 */
function normalizeCommand(str) {
  return (str || "")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Mesaj içeriğindeki komutları kontrol eden ana yönlendirici
 */
async function handleGuildInspectionMessage(message) {
  const content = (message.content || "").trim();
  if (!content.startsWith("!") && !content.startsWith(".") && !content.startsWith("-")) {
    return false;
  }

  const firstLine = content.split("\n")[0].trim();
  const commandWord = firstLine.split(/\s+/)[0];
  const norm = normalizeCommand(commandWord);

  if (!norm) return false;

  // 1. Kanal Açıklamaları (Önce kontrol edilir çünkü hem 'kanal' hem 'acikla' içerir)
  if (norm.includes("kanal") && (norm.includes("acikla") || norm.includes("topic") || norm.includes("tanim"))) {
    const isEdit = norm.includes("duzen") || norm.includes("guncel") || norm.includes("set") || content.includes("-----");
    await handleTumKanalAciklamalari(message, isEdit);
    return true;
  }

  // 2. Kategoriler
  if (norm.includes("kategori")) {
    const isEdit = norm.includes("duzen") || norm.includes("guncel") || content.includes("-----");
    await handleTumKategoriler(message, isEdit);
    return true;
  }

  // 0. Rolün Üstüne Yeni Roller Kurulumu (!rolünüstüneyeniroller / !rolunustuneyeniroller)
  if (norm.includes("rolunustune") || norm.includes("rolustune") || norm.includes("yenirol")) {
    const { handleRolunUstuneYeniRoller } = require("./robloxLandLevelService");
    await handleRolunUstuneYeniRoller(message, message.content.split("\n"));
    return true;
  }

  // 0.1 Seviye Rollerini Ayrı Göster & Sırala (!ekoasrtaerkltaerkk / !ekosirala)
  if (norm.includes("ekoasr") || norm.includes("ekosirala") || norm.includes("seviyerolleri")) {
    const { reorderAndHoistLevelRoles } = require("./robloxLandLevelService");
    const statusMsg = await message.reply("⏳ **65 Seviye Rolü 'Çevrimiçi üyelerden ayrı göster' (Hoist) yapılıyor ve taban rolün üstüne sıralanıyor...**");
    const ok = await reorderAndHoistLevelRoles(message.guild);
    if (ok) {
      await statusMsg.edit("✅ **Tüm 65 seviye rolü başarıyla 'Çevrimiçi üyelerden ayrı göster' yapıldı ve taban rolün (`👤 Dev`) hemen üzerine hiyerarşik sırayla dizildi!**");
    } else {
      await statusMsg.edit("❌ Seviye rolleri sıralanırken hata oluştu veya seviye rolleri bulunamadı.");
    }
    return true;
  }

  // 3. Roller
  if (norm.includes("rol")) {
    const isEdit = norm.includes("duzen") || norm.includes("guncel") || content.includes("-----");
    await handleTumRoller(message, isEdit);
    return true;
  }

  // 4. Kanallar (Ses kanalları hariç)
  if (norm.includes("kanal") && !norm.includes("ses")) {
    const isEdit = norm.includes("duzen") || norm.includes("guncel") || content.includes("-----");
    await handleTumKanallar(message, isEdit);
    return true;
  }

  // 5. Emojiler
  if (norm.includes("emoji")) {
    const isEdit = norm.includes("duzen") || norm.includes("guncel");
    await handleTumEmojiler(message, isEdit);
    return true;
  }

  // 6. Çıkartmalar (Stickers)
  if (norm.includes("cikart") || norm.includes("sticker")) {
    const isEdit = norm.includes("duzen") || norm.includes("guncel");
    await handleTumCikartmalar(message, isEdit);
    return true;
  }

  // 7. Ses Kanalları
  if (norm.includes("ses")) {
    const isEdit = norm.includes("duzen") || norm.includes("guncel");
    await handleTumSesKanallari(message, isEdit);
    return true;
  }

  // 8. Yetkililer / Personeller
  if (norm.includes("yetkili") || norm.includes("personel") || norm.includes("kadro")) {
    const isEdit = norm.includes("duzen") || norm.includes("guncel");
    await handleTumYetkililer(message, isEdit);
    return true;
  }

  // 9. Webhooklar
  if (norm.includes("webhook")) {
    const isEdit = norm.includes("duzen") || norm.includes("guncel");
    await handleTumWebhooklar(message, isEdit);
    return true;
  }

  // 10. Sunucu Bilgisi / Özeti
  if (norm.includes("sunucubilgi") || norm.includes("sunucuozet") || norm.includes("serverinfo")) {
    await handleSunucuBilgi(message);
    return true;
  }

  // 11. Rehber
  if (norm.includes("sunucukomut") || norm.includes("sunucuyardim") || norm.includes("incelekomut") || norm.includes("serverhelp")) {
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
