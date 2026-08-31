const { PermissionsBitField } = require('discord.js');
const logger = require('../utils/logger');
const {
  createRoleBasedHelpPayload,
  createCommandSuggestionPayload,
  findClosestCommand
} = require('../../services/helpService');

const moderationCommands = require('./moderation');
const funCommands = require('./fun');
const generalCommands = require('./general');
const systemCommands = require('./system');

// In-Memory Data Stores
const afkData = new Map(); // userId -> { reason, timestamp }
const levelData = new Map(); // guildId_userId -> { xp, level, messages }
const dailyData = new Map(); // userId -> timestamp
const warnData = new Map(); // guildId_userId -> Array<{ reason, moderatorId, timestamp }>
const disabledCommands = new Map(); // guildId_channelId -> Set<commandName>

const commands = new Map();

const PERM_NAMES_TR = {
  BanMembers: 'Üyeleri Yasakla',
  KickMembers: 'Üyeleri At',
  ManageChannels: 'Kanalları Yönet',
  ManageRoles: 'Rolleri Yönet',
  ManageMessages: 'Mesajları Yönet',
  ManageNicknames: 'Kullanıcı Adlarını Yönet',
  ManageGuildExpressions: 'Emojileri ve Çıkartmaları Yönet',
  ModerateMembers: 'Üyelere Zamanaşımı Uygula (Sustur)',
  Administrator: 'Yönetici',
  MuteMembers: 'Üyeleri Sustur',
  DeafenMembers: 'Üyeleri Sağırlaştır',
  MoveMembers: 'Üyeleri Taşı',
  ManageGuild: 'Sunucuyu Yönet'
};

function normalizeCmd(str) {
  if (!str) return '';
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function registerCommand(cmd) {
  if (!cmd || !cmd.name) return;
  const primaryKey = cmd.name.toLowerCase();
  const normKey = normalizeCmd(cmd.name);

  commands.set(primaryKey, cmd);
  if (normKey) commands.set(normKey, cmd);

  if (Array.isArray(cmd.aliases)) {
    for (const alias of cmd.aliases) {
      if (!alias) continue;
      commands.set(alias.toLowerCase(), cmd);
      const normAlias = normalizeCmd(alias);
      if (normAlias) commands.set(normAlias, cmd);
    }
  }
}

// Tüm modülleri yükle
function loadAllCommands() {
  const allModules = [
    ...moderationCommands,
    ...funCommands,
    ...generalCommands,
    ...systemCommands
  ];

  for (const cmd of allModules) {
    registerCommand(cmd);
  }

  logger.success('KOMUTLAR', `Toplam ${commands.size} komut eşleşmesi başarıyla yüklendi.`);
}

loadAllCommands();

async function checkPermissions(message, userPerms = [], botPerms = [], client = null) {
  if (!message.guild) return { pass: true };

  const isOwner = message.author.id === '1031620522406072350' || (message.guild && message.author.id === message.guild.ownerId);
  if (isOwner) return { pass: true };

  // Kullanıcı Member Nesnesini Doğrula
  if (!message.member) {
    try {
      message.member = await message.guild.members.fetch(message.author.id).catch(() => null);
    } catch (e) {}
  }

  if (message.member?.permissions?.has(PermissionsBitField.Flags.Administrator)) {
    return { pass: true };
  }

  if (message.member && Array.isArray(userPerms) && userPerms.length > 0) {
    for (const perm of userPerms) {
      const flag = PermissionsBitField.Flags[perm];
      if (flag && !message.member.permissions.has(flag)) {
        const trName = PERM_NAMES_TR[perm] || perm;
        return {
          pass: false,
          error: `❌ Bu komutu kullanmak için **${trName}** yetkisine sahip olmalısınız.`
        };
      }
    }
  }

  return { pass: true };
}

/**
 * Akıllı komut öneri ve etkileşimli yardım mesajını gönderir
 */
async function sendCommandSuggestion(message, typedCmd, suggestedCmd, client) {
  const payload = createCommandSuggestionPayload(message.member, message.author, typedCmd, suggestedCmd);
  await message.reply(payload).catch(() => null);
  return true;
}

async function handleGuildMessage(message, client) {
  if (!message.author || message.author.bot) return;

  const content = (message.content || '').trim();

  // Message Content Boş Uyarısı
  if (!content && message.guild && (!message.attachments || message.attachments.size === 0)) {
    return;
  }

  // 1. AFK Kontrolü
  if (afkData.has(message.author.id)) {
    afkData.delete(message.author.id);
    message.reply(`👋 Hoş geldin **${message.author.username}**! AFK modundan çıkış yaptın.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});
  }

  // 2. Etiketlenen Kişi AFK mı?
  if (message.mentions && message.mentions.users && message.mentions.users.size > 0) {
    message.mentions.users.forEach(u => {
      if (afkData.has(u.id)) {
        const data = afkData.get(u.id);
        message.reply(`💤 **${u.username}** şu an AFK! Sebep: *${data.reason}* (<t:${Math.floor(data.timestamp / 1000)}:R>)`).catch(() => {});
      }
    });
  }

  // 3. Seviye / XP Kazanma Mantığı (Sadece Sunucu İçi)
  if (message.guild) {
    const levelKey = `${message.guild.id}_${message.author.id}`;
    const userLevel = levelData.get(levelKey) || { xp: 0, level: 1, messages: 0 };
    userLevel.messages++;
    userLevel.xp += Math.floor(Math.random() * 10) + 5;

    const nextLevelXp = userLevel.level * 100;
    if (userLevel.xp >= nextLevelXp) {
      userLevel.level++;
    }
    levelData.set(levelKey, userLevel);
  }

  // 4. Komut Ön Eki (Prefix) Ayrıştırma: 'e!', '!', '.', 's!' veya Bot Mention
  const botUser = client?.user || message.client?.user;
  const botMention1 = botUser ? `<@${botUser.id}>` : null;
  const botMention2 = botUser ? `<@!${botUser.id}>` : null;

  let commandBody = null;
  let isPrefixExplicit = false;
  const lowerContent = content.toLowerCase();

  if (lowerContent.startsWith('e!')) {
    commandBody = content.slice(2).trim();
    isPrefixExplicit = true;
  } else if (lowerContent.startsWith('e !')) {
    commandBody = content.slice(3).trim();
    isPrefixExplicit = true;
  } else if (lowerContent.startsWith('s!')) {
    commandBody = content.slice(2).trim();
    isPrefixExplicit = true;
  } else if (lowerContent.startsWith('s !')) {
    commandBody = content.slice(3).trim();
    isPrefixExplicit = true;
  } else if (botMention1 && content.startsWith(botMention1)) {
    commandBody = content.slice(botMention1.length).trim();
    isPrefixExplicit = true;
  } else if (botMention2 && content.startsWith(botMention2)) {
    commandBody = content.slice(botMention2.length).trim();
    isPrefixExplicit = true;
  } else if (content.startsWith('!')) {
    commandBody = content.slice(1).trim();
  } else if (content.startsWith('.')) {
    commandBody = content.slice(1).trim();
  }

  if (commandBody === null) return false;

  // 4.1. Kullanıcı sadece 'e!' veya 's!' yazdıysa
  if (commandBody.length === 0) {
    if (isPrefixExplicit) {
      await sendCommandSuggestion(message, '', null, client);
      return true;
    }
    return false;
  }

  const args = commandBody.split(/ +/);
  const rawCmd = args.shift();
  if (!rawCmd) {
    if (isPrefixExplicit) {
      await sendCommandSuggestion(message, '', null, client);
      return true;
    }
    return false;
  }

  const commandName = rawCmd.toLowerCase();
  const normCmdName = normalizeCmd(rawCmd);

  const command = commands.get(commandName) || commands.get(normCmdName);

  // 4.2. Komut bulunamadıysa ve e! veya s! ile çağrıldıysa: "Aradığınız komut bu mu?" tetikle
  if (!command) {
    // Sunucu inceleme komutları ayrı bir modülde tutuluyor. e!/s! ile
    // çağrıldıklarında öneri ekranına düşmeden önce o yönlendiriciye bırak.
    try {
      const { handleGuildInspectionMessage } = require('../../services/guildInspectionCommands');
      const handledInspection = await handleGuildInspectionMessage(message);
      if (handledInspection) return true;
    } catch (inspectionErr) {
      logger.error('SUNUCU İNCELEME KOMUT HATASI', inspectionErr);
    }

    if (isPrefixExplicit) {
      const closest = findClosestCommand(rawCmd, commands);
      await sendCommandSuggestion(message, rawCmd, closest, client);
      return true;
    }
    return false;
  }

  logger.info('KOMUT ÇALIŞTIRILIYOR', `Kullanıcı: ${message.author.tag} | Komut: ${command.name} | Sunucu: ${message.guild ? message.guild.name : 'DM'}`);

  // 4.9. Sunucu Yetkilendirme Kontrolü
  if (message.guild) {
    try {
      const { isGuildAuthorized } = require('../../services/guildAuthService');
      const authorized = await isGuildAuthorized(message.guild);
      if (!authorized) {
        message.reply('❌ Merhaba, bu bot Eko Yıldız\'a özeldir. Bu sebeple bu sunucuda herhangi bir komutumu veya sistemimi kullanamazsınız!').catch(() => {});
        return true;
      }
    } catch (authErr) {
      console.warn('[GuildAuth Error]:', authErr.message);
    }
  }

  // 5. Engellenmiş Kanal Kontrolü
  const BLOCKED_CHANNELS = ['1518692482970550322'];
  const isOwner = message.author.id === '1031620522406072350' || (message.guild && message.author.id === message.guild.ownerId);
  
  if (!isOwner && message.channel && BLOCKED_CHANNELS.includes(message.channel.id)) {
    message.reply('❌ Bu kanalda komut kullanımı engellenmiştir! Lütfen **başka bir kanalda veya bot komut kanalında kullanın!**').then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});
    return true;
  }

  // 5.1. Dinamik Engellenmiş Komut Kontrolü
  if (!isOwner && message.guild && message.channel) {
    const disableKey = `${message.guild.id}_${message.channel.id}`;
    if (disabledCommands.has(disableKey) && disabledCommands.get(disableKey).has(command.name)) {
      message.reply('❌ Bu komut bu kanalda yetkililer tarafından engellenmiştir.').catch(() => {});
      return true;
    }
  }

  // 6. Özel Yetki Kontrolü
  try {
    const permCheck = await checkPermissions(message, command.userPermissions, command.botPermissions, client);
    if (!permCheck.pass) {
      message.reply(permCheck.error).catch(() => {});
      return true;
    }
  } catch (permErr) {
    console.warn('[PermCheck Error]:', permErr.message);
  }

  // 7. Komutu Çalıştır
  const context = {
    client: client || message.client,
    commands,
    afkData,
    levelData,
    dailyData,
    warnData,
    disabledCommands
  };

  try {
    await command.execute(message, args, context);
    logger.success('KOMUT TAMAMLANDI', `e!${commandName} komutu başarıyla çalıştırıldı. (Kullanıcı: ${message.author.tag})`);
    return true;
  } catch (err) {
    logger.error('KOMUT HATASI', `e!${commandName} komutunda hata:`, err);
    const errText = `❌ **e!${commandName}** komutu çalıştırılırken bir hata oluştu: \`${err?.message || err || 'Bilinmeyen hata'}\``;
    try {
      if (typeof message.reply === 'function') {
        await message.reply({ content: errText }).catch(async () => {
          if (message.channel) await message.channel.send({ content: errText }).catch(() => {});
        });
      } else if (message.channel) {
        await message.channel.send({ content: errText }).catch(() => {});
      }
    } catch (_) {}
    return true;
  }
}

module.exports = {
  handleGuildMessage,
  commands,
  afkData,
  levelData,
  dailyData,
  warnData,
  disabledCommands
};
