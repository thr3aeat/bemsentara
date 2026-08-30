const { EmbedBuilder } = require('discord.js');

module.exports = [
  {
    name: 'günlükpuan',
    aliases: ['daily'],
    category: 'Kullanıcı',
    description: 'Günlük olarak puan ödülünüzü alırsınız.',
    userPermissions: [],
    botPermissions: [],
    async execute(message, args, context) {
      const lastDaily = context.dailyData.get(message.author.id) || 0;
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;

      if (now - lastDaily < cooldown) {
        const remainingSec = Math.ceil((cooldown - (now - lastDaily)) / 1000);
        const hours = Math.floor(remainingSec / 3600);
        const mins = Math.floor((remainingSec % 3600) / 60);
        return message.reply(`⏳ Günlük puanınızı zaten aldınız. Kalan süre: **${hours} saat ${mins} dakika**.`);
      }

      context.dailyData.set(message.author.id, now);
      const reward = Math.floor(Math.random() * 400) + 100;
      return message.reply(`🎁 Tebrikler! Günlük **${reward} puan** kazandınız!`);
    }
  },
  {
    name: 'afk',
    category: 'Kullanıcı',
    description: 'Bahsedildiğinizde yanıt verilmesi için bir AFK durum ayarlar.',
    userPermissions: [],
    botPermissions: [],
    async execute(message, args, context) {
      const reason = args.join(' ') || 'Sebep belirtilmedi';
      context.afkData.set(message.author.id, { reason, timestamp: Date.now() });

      return message.reply(`💤 AFK Moduna geçtiniz! Sebep: **${reason}**. Mesaj yazdığınızda AFK modunuz otomatik kalkacaktır.`);
    }
  },
  {
    name: 'rank',
    aliases: ['seviye'],
    category: 'Kullanıcı',
    description: 'Etiketlediğiniz kişinin seviyesini gösterir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message, args, context) {
      const target = message.mentions.users.first() || message.author;
      const key = `${message.guild.id}_${target.id}`;
      const data = context.levelData.get(key) || { xp: 0, level: 1, messages: 0 };

      const embed = new EmbedBuilder()
        .setTitle(`📊 ${target.username} - Seviye Kartı`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: '⭐ Seviye (Level)', value: `\`${data.level}\``, inline: true },
          { name: '✨ Toplam XP', value: `\`${data.xp}\``, inline: true },
          { name: '💬 Mesaj Sayısı', value: `\`${data.messages}\``, inline: true }
        )
        .setColor(0x8b5cf6);

      return message.reply({ content: `📊 **${target.username}** kullanıcısının seviye kartı:`, embeds: [embed] });
    }
  },
  {
    name: 'leaderboard',
    aliases: ['seviyesıralaması'],
    category: 'Kullanıcı',
    description: 'Sunucudaki seviye sıralamasını gösterir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message, args, context) {
      const guildEntries = [];
      for (const [key, val] of context.levelData.entries()) {
        if (key.startsWith(`${message.guild.id}_`)) {
          const userId = key.split('_')[1];
          guildEntries.push({ userId, xp: val.xp, level: val.level });
        }
      }

      guildEntries.sort((a, b) => b.xp - a.xp);
      const top10 = guildEntries.slice(0, 10);

      const desc = top10.length > 0
        ? top10.map((e, idx) => `**${idx + 1}.** <@${e.userId}> - Level **${e.level}** (${e.xp} XP)`).join('\n')
        : 'Henüz sıralamada kimse yok.';

      const embed = new EmbedBuilder()
        .setTitle('🏆 Sunucu Seviye Sıralaması')
        .setDescription(desc)
        .setColor(0xeab308);

      return message.reply({ content: '🏆 **Sunucu Seviye & XP Sıralaması (Top 10):**', embeds: [embed] });
    }
  },
  {
    name: 'top',
    category: 'Kullanıcı',
    description: 'Sunucudaki mesaj ve seviye sıralamasını gösterir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message, args, context) {
      const lb = context.commands.get('leaderboard');
      if (lb) return lb.execute(message, args, context);
    }
  },
  {
    name: 'avatar',
    category: 'Kullanıcı',
    description: 'Etiketlediğiniz kişinin avatarını gösterir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const user = message.mentions.users.first() || message.author;
      const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

      const embed = new EmbedBuilder()
        .setTitle(`🖼 ${user.username} Avatarı`)
        .setImage(avatarUrl)
        .setColor(0x3b82f6);

      return message.reply({ content: `🖼 **${user.username}** kullanıcısının profil fotoğrafı:`, embeds: [embed] });
    }
  },
  {
    name: 'emojiler',
    category: 'Kullanıcı',
    description: 'Sunucuda bulunan emojileri gösterir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const emojis = message.guild.emojis.cache;
      if (emojis.size === 0) return message.reply('ℹ️ Sunucuda hiç özel emoji bulunmuyor.');

      const emojiList = emojis.map(e => e.toString()).join(' ');
      const embed = new EmbedBuilder()
        .setTitle(`😃 Sunucu Emojileri (${emojis.size})`)
        .setDescription(emojiList.length > 4000 ? emojiList.substring(0, 4000) + '...' : emojiList)
        .setColor(0x10b981);

      return message.reply({ content: `😃 **Sunucu Özel Emojileri (${emojis.size} adet):**`, embeds: [embed] });
    }
  },
  {
    name: 'hesapla',
    category: 'Kullanıcı',
    description: 'Bot belirtilen matematiksel işlemi yapar.',
    userPermissions: [],
    botPermissions: [],
    async execute(message, args) {
      const expr = args.join('');
      if (!expr || !/^[0-9+\-*/().\s]+$/.test(expr)) {
        return message.reply('⚠️ Lütfen geçerli bir matematiksel işlem girin (Örn: `e!hesapla 25 * 4 + 10`).');
      }

      try {
        const result = Function(`'use strict'; return (${expr})`)();
        return message.reply(`🧮 **İşlem:** \`${expr}\`\n**Sonuç:** \`${result}\``);
      } catch (e) {
        return message.reply('❌ Matematiksel işlem hesaplanamadı.');
      }
    }
  },
  {
    name: 'kullanıcıbilgi',
    aliases: ['userinfo'],
    category: 'Kullanıcı',
    description: 'Etiketlediğiniz kullanıcının hesap bilgilerini gösterir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const member = message.mentions?.members?.first?.() || message.member;
      const user = member?.user || message.mentions?.users?.first?.() || message.author;
      const tag = user?.tag || user?.username || 'Bilinmeyen Kullanıcı';
      const avatarUrl = user?.displayAvatarURL ? user.displayAvatarURL() : null;
      const createdTs = user?.createdTimestamp ? Math.floor(user.createdTimestamp / 1000) : Math.floor(Date.now() / 1000);
      const joinedTs = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : createdTs;
      const roleCount = member?.roles?.cache ? Math.max(0, member.roles.cache.size - 1) : 0;

      const embed = new EmbedBuilder()
        .setTitle(`👤 ${tag} Bilgileri`)
        .setThumbnail(avatarUrl)
        .addFields(
          { name: '🆔 ID', value: `\`${user?.id || 'Bilinmiyor'}\``, inline: true },
          { name: '📅 Hesabın Kuruluşu', value: `<t:${createdTs}:R>`, inline: true },
          { name: '📥 Sunucuya Katılım', value: `<t:${joinedTs}:R>`, inline: true },
          { name: '🎭 Rol Sayısı', value: `\`${roleCount}\``, inline: true }
        )
        .setColor(0x6366f1);

      return message.reply({ content: `👤 **${tag}** Kullanıcı Kimlik Kartı:`, embeds: [embed] });
    }
  },
  {
    name: 'kurucukim',
    category: 'Kullanıcı',
    description: 'Sunucunun kurucusunu söyler.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const owner = message.guild?.fetchOwner ? await message.guild.fetchOwner().catch(() => null) : null;
      const ownerTag = owner?.user?.tag || owner?.tag || owner?.username || `<@${message.guild?.ownerId || '1031620522406072350'}>`;
      return message.reply(`👑 Sunucu Kurucusu: **${ownerTag}** (\`${owner?.id || message.guild?.ownerId || '1031620522406072350'}\`)`);
    }
  },
  {
    name: 'minecraft',
    category: 'Kullanıcı',
    description: 'Belirttiğiniz oyuncunun Minecraft bilgilerini gösterir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message, args) {
      const username = args[0];
      if (!username) return message.reply('⚠️ Lütfen bir Minecraft oyuncu adı yazın.');

      const embed = new EmbedBuilder()
        .setTitle(`⛏️ Minecraft Oyuncusu: ${username}`)
        .setThumbnail(`https://mc-heads.net/avatar/${username}`)
        .setImage(`https://mc-heads.net/body/${username}`)
        .setColor(0x22c55e);

      return message.reply({ content: `⛏️ **Minecraft Oyuncu Kartı:** \`${username}\``, embeds: [embed] });
    }
  },
  {
    name: 'sunucubilgi',
    aliases: ['serverinfo'],
    category: 'Kullanıcı',
    description: 'Bulunduğun sunucu hakkında bilgi verir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const guild = message.guild;
      const embed = new EmbedBuilder()
        .setTitle(`🏰 ${guild.name} Sunucu Bilgileri`)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: '👑 Kurucu', value: `<@${guild.ownerId}>`, inline: true },
          { name: '👥 Üye Sayısı', value: `\`${guild.memberCount}\``, inline: true },
          { name: '💬 Kanal Sayısı', value: `\`${guild.channels.cache.size}\``, inline: true },
          { name: '🎭 Rol Sayısı', value: `\`${guild.roles.cache.size}\``, inline: true },
          { name: '📅 Kuruluş Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
        )
        .setColor(0xec4899);

      return message.reply({ content: `🏰 **${guild.name}** Sunucu Detay Raporu:`, embeds: [embed] });
    }
  },
  {
    name: 'yardım',
    aliases: ['help', 'komutlar'],
    category: 'Kullanıcı',
    description: 'Tüm komutları listeler.',
    userPermissions: [],
    botPermissions: [],
    async execute(message, args, context) {
      try {
        const { sendHelpMenu } = require('../../services/helpService');
        await sendHelpMenu(message);
      } catch (err) {
        console.error('[Yardım Komutu Hatası]:', err);
        const fallbackText = '📚 **EkoYıldız Bot Komut Listesi:** Sunucumuzdaki tüm sistem, eğlence ve moderasyon komutlarını `e!yardım` ile kullanabilirsiniz.';
        await message.reply({ content: fallbackText }).catch(async () => {
          if (message.channel) await message.channel.send({ content: fallbackText }).catch(() => {});
        });
      }
    }
  }
];
