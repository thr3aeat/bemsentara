const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

const ataturkPhotos = [
  'https://upload.wikimedia.org/wikipedia/commons/a/a8/Ataturk1930s.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/1/18/Mustafa_Kemal_Atat%C3%BCrk_in_1923.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Ataturk_in_1918.jpg/800px-Ataturk_in_1918.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/a0/Mustafa_Kemal_Atat%C3%BCrk_1925.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/23/Mustafa_Kemal_Ataturk_1927.jpg'
];

const dailyFacts = [
  { title: '🇹🇷 Türk Tarihi', fact: '1071 Malazgirt Meydan Muharebesi ile Anadolu’nun kapıları Türklere açılmıştır.' },
  { title: '💡 Bilim & Teknoloji', fact: 'İnternet ilk olarak 1969 yılında ARPANET adıyla iki bilgisayar arasındaki veri transferiyle kurulmuştur.' },
  { title: '📜 Tarihten Alıntı', fact: 'Mustafa Kemal Atatürk: "Hayatta en hakiki mürşit ilimdir, fendir."' },
  { title: '🌌 Uzay & Evren', fact: 'Işık hızı saniyede yaklaşık 300.000 kilometredir ve Güneş ışığı Dünya’ya 8 dakika 20 saniyede ulaşır.' },
  { title: '🧠 İlginç Bilgi', fact: 'İnsan beyni yaklaşık 86 milyar nöron içerir ve ortalama 20 watt elektrik enerjisiyle çalışır.' }
];

const spicyFactsAndHoroscopes = [
  '🔥 Bu gece teninizin çekim alanı tavan yapacak, göz temasını 3 saniyeden fazla tutan çarpılacak!',
  '💋 Yıldız haritanıza göre bugün ani bir öpücük veya şaplakla günün stresi sıfırlanabilir.',
  '🛌 Çarşafların tutku katsayısı %98! Partnerinize ufak bir temas kıvılcımı ateşlemeye yetecek.',
  '🍑 Bugün yaramazlık enerjiniz zirvede; kırmızı iç çamaşırı ve cesur adımlar şans getirecek.',
  '🍷 Romantik bir mum ışığı veya loş ortamda söylenecek fısıltılı bir söz geceyi unutulmaz kılabilir.'
];

const truthQuestions = [
  'En son kime karşı karşı konulamaz bir arzu / çekim hissettin?',
  'Bu sunucuda gizlice baş başa kalmak veya flört etmek istediğin biri var mı?',
  'En çılgın veya en yaramaz fantezin nedir?',
  'İlk öpücüğün kaç puan üzerinden kaçtı ve neredeydi?',
  'Vücudunda en çok beğendiğin ve övündüğün bölge neresi?',
  'Partnerinde seni anında baştan çıkaran en büyük özellik nedir?'
];

const dareTasks = [
  'Sunucuda beğendiğin birine DM atıp sadece "🔥 Çok yakıyorsun..." yaz ve ekran görüntüsünü at!',
  'Sunucu ses kanalında 10 saniye boyunca tutkulu bir şekilde şarkı söyle!',
  'Etiketlediğin kişiye en ateşli iltifatını herkesin önünde yaz!',
  'Profil durumuna 1 saatliğine "🔞 Tehlikeli Bölge" yaz!',
  'Etiketlediğin birine `e!şaplak` at ve nedenini açıkla!'
];

module.exports = [
  // ── 1. 1VS1 DÜELLO (STRATEJİK RPG) ─────────────────────────────────────────
  {
    name: '1vs1',
    aliases: ['1v1', 'duello', 'düello'],
    category: 'Eğlence',
    description: 'Stratejik, kritik vuruşlu, kalkanlı ve iksirli 1v1 Düello oyunu.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const opponent = message.mentions?.members?.first?.();
      if (!opponent || opponent.id === message.author.id || opponent.user.bot) {
        return message.reply('⚠️ Lütfen düello yapmak için geçerli bir kullanıcı etiketleyin!');
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`accept_duel_${message.author.id}`).setLabel('⚔️ Düelloyu Kabul Et').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`reject_duel_${message.author.id}`).setLabel('🏳️ Reddet').setStyle(ButtonStyle.Danger)
      );

      const msg = await message.channel.send({
        content: `⚔️ ${opponent}, ${message.author} seni stratejik 1v1 düelloya davet ediyor!`,
        components: [row]
      });

      const collector = msg.createMessageComponentCollector({ time: 30000 });

      collector.on('collect', async i => {
        if (i.user.id !== opponent.id) return i.reply({ content: '❌ Bu davet sizin için değil.', ephemeral: true });

        if (i.customId.startsWith('reject_duel_')) {
          await i.update({ content: `🏳️ ${opponent.user.tag} düelloyu reddetti.`, components: [] });
          collector.stop();
          return;
        }

        let p1 = { id: message.author.id, name: message.author.username, hp: 100, mana: 50, shield: false };
        let p2 = { id: opponent.id, name: opponent.user.username, hp: 100, mana: 50, shield: false };
        let turnId = p1.id;

        const getBattleEmbed = (lastAction = 'Savaş Başladı!') => new EmbedBuilder()
          .setTitle('⚔️ STRATEJİK 1v1 DÜELLO SAVAŞI')
          .setColor(0xd97706)
          .setDescription(`📜 **Son Hamle:** ${lastAction}\n\n❤️ **${p1.name}:** ${p1.hp} HP | 💧 Mana: ${p1.mana}/50 ${p1.shield ? '🛡️ [Kalkan Aktif]' : ''}\n❤️ **${p2.name}:** ${p2.hp} HP | 💧 Mana: ${p2.mana}/50 ${p2.shield ? '🛡️ [Kalkan Aktif]' : ''}\n\n🎯 **Sıra:** <@${turnId}>`);

        const getActionRow = () => new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('duel_attack').setLabel('💥 Saldır').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('duel_special').setLabel('⚡ Özel Saldırı (30 Mana)').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('duel_shield').setLabel('🛡️ Kalkan Yap').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('duel_heal').setLabel('🧪 İyileş (+15 Mana)').setStyle(ButtonStyle.Primary)
        );

        await i.update({ content: '⚔️ **Düello Başladı!**', embeds: [getBattleEmbed()], components: [getActionRow()] });

        const battleCollector = msg.createMessageComponentCollector({ time: 90000 });

        battleCollector.on('collect', async bi => {
          if (bi.user.id !== turnId) return bi.reply({ content: '❌ Sıra sende değil!', ephemeral: true });

          let attacker = (turnId === p1.id) ? p1 : p2;
          let defender = (turnId === p1.id) ? p2 : p1;
          let actionLog = '';

          if (bi.customId === 'duel_attack') {
            let dmg = Math.floor(Math.random() * 20) + 10;
            const isCrit = Math.random() < 0.15;
            if (isCrit) dmg *= 2;

            if (defender.shield) {
              dmg = Math.floor(dmg / 2);
              defender.shield = false;
              actionLog = `💥 **${attacker.name}** saldırdı! Kalkan hasarı yarıya indirdi (**${dmg} Hasar**)!`;
            } else {
              actionLog = isCrit
                ? `⚡ **KRİTİK VURUŞ!** **${attacker.name}** muazzam vurdu (**${dmg} Hasar**)!`
                : `💥 **${attacker.name}** saldırdı (**${dmg} Hasar**)!`;
            }
            defender.hp = Math.max(0, defender.hp - dmg);
            attacker.mana = Math.min(50, attacker.mana + 5);

          } else if (bi.customId === 'duel_special') {
            if (attacker.mana < 30) {
              return bi.reply({ content: '❌ Yeterli manan yok! (En az 30 Mana gerekli)', ephemeral: true });
            }
            attacker.mana -= 30;
            let dmg = Math.floor(Math.random() * 25) + 25;
            if (defender.shield) {
              dmg = Math.floor(dmg / 2);
              defender.shield = false;
            }
            defender.hp = Math.max(0, defender.hp - dmg);
            actionLog = `⚡ **ÖZEL SALDIRI!** **${attacker.name}** yoldan çıkaran bir büyü yaptı (**${dmg} Hasar**)!`;

          } else if (bi.customId === 'duel_shield') {
            attacker.shield = true;
            actionLog = `🛡️ **${attacker.name}** savunma kalkanını kaldırdı! Gelecek hasar yarıya düşecek.`;

          } else if (bi.customId === 'duel_heal') {
            const heal = Math.floor(Math.random() * 15) + 10;
            attacker.hp = Math.min(100, attacker.hp + heal);
            attacker.mana = Math.min(50, attacker.mana + 15);
            actionLog = `🧪 **${attacker.name}** iksir içti (**+${heal} HP** ve **+15 Mana** kazandı)!`;
          }

          if (p1.hp <= 0 || p2.hp <= 0) {
            const winner = p1.hp > 0 ? message.author : opponent.user;
            await bi.update({
              content: `🏆 **DÜELLO BİTTİ!** Kazanan: **${winner.tag}** 🎉`,
              embeds: [],
              components: []
            });
            battleCollector.stop();
            return;
          }

          turnId = (turnId === p1.id) ? p2.id : p1.id;
          await bi.update({ embeds: [getBattleEmbed(actionLog)], components: [getActionRow()] });
        });

        battleCollector.on('end', (collected, reason) => {
          if (reason !== 'user') {
            msg.edit({ content: '⏱️ **Düello süresi doldu!**', components: [] }).catch(() => { });
          }
        });
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          msg.edit({ content: '⏱️ **Davet zaman aşımına uğradı.**', components: [] }).catch(() => { });
        }
      });
    }
  },

  // ── 2. GELİŞMİŞ VE ATEŞLİ AŞK ÖLÇER / SHIP / ÇARŞAF UYUMU ─────────────────────
  {
    name: 'aşkölçer',
    aliases: ['askolcer', 'ship', 'love', 'tutku', 'uyum'],
    category: 'Eğlence',
    description: 'Etiketlediğiniz kişiyle aranızdaki aşk, tutku, ten ve yatak odası uyumunu ölçer.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const target = message.mentions?.users?.first?.();
      if (!target) return message.reply('❤️ Lütfen aşkınızı ve tutkunuzu ölçmek için birini etiketleyin!');
      if (target.id === message.author.id) return message.reply('❤️ Kendinize olan aşkınız harika ama lütfen başka birini etiketleyin!');

      const calcPercent = () => Math.floor(Math.random() * 101);
      const makeHeartBar = (score) => {
        const filled = Math.round(score / 10);
        const empty = 10 - filled;
        return '❤️'.repeat(filled) + '🖤'.repeat(empty);
      };

      const getSpicyComment = (love, passion) => {
        const avg = Math.round((love + passion) / 2);
        if (avg >= 85) return '🔥 **ÇARŞAFLAR TUTUŞTU!** Aranızda durdurulamaz bir elektrik ve devasa bir ten çekimi var! Yatak odasının kapısını kilitleyin! 🔞';
        if (avg >= 65) return '💋 **Ateşli ve Uyumlu!** Birbirinizi gördüğünüz anda kalp ritminiz tavan yapıyor. Küçük bir dokunuşla kıvılcım patlar! 😉';
        if (avg >= 40) return '✨ **Tatlı Bir Çekim:** Arkadaşlıktan öte, aşktan biraz çıtır! Doğru ışıkta ve doğru müzikte her an alevlenebilir.';
        if (avg >= 20) return '🧊 **Ilık Rüzgarlar:** Arada hafif bir kıvılcım var ama biraz daha çaba ve romantik jestler gerekiyor.';
        return '❄️ **Kuzey Kutbu:** Aranızdaki elektrik şu an sıfıra yakın. Soğuk bir su için veya arkadaş kalın!';
      };

      const bedroomPositions = [
        '🛌 Klasik Aşk Sarmalı (%95 Ten Uyumu)',
        '🧗‍♂️ Tavandan Sallanmalı Çılgın Pozisyon (%88 Uyum)',
        '🔥 Ateşli Fırtına & Çarşaf Yakan (%99 Uyum)',
        '🏎️ Hızlı & Öfkeli Gece Vardiyası (%92 Uyum)',
        '🐉 Efsanevi Ejderha Kilitlenmesi (%90 Uyum)'
      ];

      let loveScore = calcPercent();
      let passionScore = calcPercent();
      let bedroomScore = calcPercent();
      let isBoosted = false;

      const buildShipEmbed = (u1, u2, lScore, pScore, bScore) => {
        const avg = Math.round((lScore + pScore + bScore) / 3);
        const comment = getSpicyComment(lScore, pScore);
        const pos = bedroomPositions[Math.floor(Math.random() * bedroomPositions.length)];

        return new EmbedBuilder()
          .setTitle(`💖 AŞK, TUTKU & TEN UYUMU TESTİ`)
          .setThumbnail(u2.displayAvatarURL())
          .setDescription(
            `👑 **Aşıklar:** ${u1}  💞  ${u2}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `💖 **Kalp & Ruh Uyumu:** **%${lScore}**\n` +
            `\`${makeHeartBar(lScore)}\`\n\n` +
            `🔥 **Ten Çekimi & Tutku:** **%${pScore}**\n` +
            `\`${makeHeartBar(pScore)}\`\n\n` +
            `🛌 **Yatak & Çarşaf Uyumu:** **%${bScore}**\n` +
            `\`${makeHeartBar(bScore)}\`\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🍑 **Önerilen Uyumlu Fantezi:** \`${pos}\`\n` +
            `🌡️ **Genel Ateş Derecesi:** **${avg >= 70 ? '🔥 100°C (Kaynama Noktası!)' : (avg >= 40 ? '✨ 50°C (Ilık & Çekici)' : '❄️ 10°C (Serin)')}**\n\n` +
            `💬 **Aşk Analizi:**\n${comment}`
          )
          .setColor(avg >= 70 ? 0xef4444 : (avg >= 40 ? 0xec4899 : 0x3b82f6))
          .setFooter({ text: 'EkoYıldız Aşk & Tutku Laboratuvarı • Sadece Yetişkin Eğlence' })
          .setTimestamp();
      };

      const getShipRow = () => new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ship_reroll_${message.author.id}`)
          .setLabel('🎲 Yeniden Ölç')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`ship_boost_${message.author.id}`)
          .setLabel('🔥 Ateşi Körükle (+%20 Tutku)')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`ship_bedroom_${message.author.id}`)
          .setLabel('🔞 Yatak Odası Falı')
          .setStyle(ButtonStyle.Secondary)
      );

      const msg = await message.reply({
        embeds: [buildShipEmbed(message.author, target, loveScore, passionScore, bedroomScore)],
        components: [getShipRow()]
      });

      const collector = msg.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: '❌ Bu butonları sadece testi başlatan kişi kullanabilir!', ephemeral: true });
        }

        if (interaction.customId.startsWith('ship_reroll_')) {
          loveScore = calcPercent();
          passionScore = calcPercent();
          bedroomScore = calcPercent();
          isBoosted = false;
          await interaction.update({ embeds: [buildShipEmbed(message.author, target, loveScore, passionScore, bedroomScore)], components: [getShipRow()] });
        } else if (interaction.customId.startsWith('ship_boost_')) {
          if (isBoosted) {
            return interaction.reply({ content: '⚠️ **Ateş zaten maksimum seviyede! Yangın tüpleri yetersiz kalabilir! 🔥🚨**', ephemeral: true });
          }
          isBoosted = true;
          passionScore = Math.min(100, passionScore + 25);
          bedroomScore = Math.min(100, bedroomScore + 25);
          await interaction.update({ embeds: [buildShipEmbed(message.author, target, loveScore, passionScore, bedroomScore)], components: [getShipRow()] });
          await interaction.followUp({ content: `🔥 **Ateş Körüklendi!** Tutku ve yatak uyumu tavan yaptı! 🔞💋`, ephemeral: true });
        } else if (interaction.customId.startsWith('ship_bedroom_')) {
          const horo = spicyFactsAndHoroscopes[Math.floor(Math.random() * spicyFactsAndHoroscopes.length)];
          const bedEmbed = new EmbedBuilder()
            .setTitle(`🔞 YATAK ODASI FALI — ${message.author.username} & ${target.username}`)
            .setDescription(`${horo}\n\n*Partnerinizi loş bir ortama davet etmenin tam zamanı!* 😉`)
            .setColor(0xec4899)
            .setTimestamp();
          await interaction.reply({ embeds: [bedEmbed], ephemeral: true });
        }
      });

      collector.on('end', () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          getShipRow().components.map(b => ButtonBuilder.from(b).setDisabled(true))
        );
        msg.edit({ components: [disabledRow] }).catch(() => {});
      });
    }
  },

  // ── 3. AZGINLIK & LİBİDO ÖLÇER ─────────────────────────────────────────────
  {
    name: 'azgınlıkölçer',
    aliases: ['azginlikolcer', 'libido', 'ates', 'horny', 'ateş'],
    category: 'Eğlence',
    description: 'Etiketlediğiniz kişinin (veya kendinizin) anlık libido ve ateş derecesini ölçer.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const target = message.mentions?.users?.first?.() || message.author;
      let score = Math.floor(Math.random() * 101);

      const makeFireBar = (s) => {
        const filled = Math.round(s / 10);
        const empty = 10 - filled;
        return '🔥'.repeat(filled) + '🧊'.repeat(empty);
      };

      const getFireDesc = (s) => {
        if (s >= 90) return '🚨 **KRİTİK DERECE: AŞIRI YANICI!** Yanına yaklaşan çarpılır, acilen soğuk duş veya partner şart! 🔞🔥';
        if (s >= 70) return '🌶️ **Acı Biber Etkisi:** İçinde fırtınalar kopuyor, gözleri yaramazlık arıyor... 😉';
        if (s >= 40) return '✨ **Tatlı Kıvılcım:** Normal seviyede flörtöz, ortam uygun olursa alevlenir.';
        if (s >= 20) return '🧊 **Sakin Sular:** Henüz kış uykusunda, biraz romantik dokunuş lazım.';
        return '🏔️ **Kutup Ayısı:** Sıfır tepki, keşiş gibi sakin ve huzurlu.';
      };

      const buildFireEmbed = (user, s) => {
        const avatarUrl = typeof user?.displayAvatarURL === 'function' ? user.displayAvatarURL() : null;
        const embed = new EmbedBuilder()
          .setTitle(`🌶️ LİBİDO & ATEŞ ÖLÇER — ${user?.username || 'Kullanıcı'}`)
          .setDescription(
            `👤 **Kullanıcı:** ${user}\n\n` +
            `🌡️ **Ateş Seviyesi:** **%${s}**\n` +
            `\`${makeFireBar(s)}\`\n\n` +
            `📢 **Durum Analizi:**\n${getFireDesc(s)}\n\n` +
            `💡 **Önerilen Reçete:** ${s >= 75 ? '🚿 Buzlu Soğuk Duş + Loş Oda' : '☕ Ilık Papatya Çayı'}`
          )
          .setColor(s >= 70 ? 0xef4444 : (s >= 40 ? 0xf59e0b : 0x3b82f6))
          .setFooter({ text: 'EkoYıldız Ateş Departmanı' })
          .setTimestamp();

        if (avatarUrl) embed.setThumbnail(avatarUrl);
        return embed;
      };

      const getFireRow = () => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`fire_shower_${message.author.id}`).setLabel('🚿 Soğuk Duş Al (-30%)').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`fire_chili_${message.author.id}`).setLabel('🌶️ Acı Biber Ye (+25%)').setStyle(ButtonStyle.Danger)
      );

      const msg = await message.reply({
        embeds: [buildFireEmbed(target, score)],
        components: [getFireRow()]
      });

      const collector = msg.createMessageComponentCollector({ time: 60000 });
      collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: '❌ Sadece komutu kullanan butonlara basabilir!', ephemeral: true });
        }

        if (interaction.customId.startsWith('fire_shower_')) {
          score = Math.max(0, score - 30);
          await interaction.update({ embeds: [buildFireEmbed(target, score)], components: [getFireRow()] });
          await interaction.followUp({ content: '🚿 **Buz gibi soğuk duş alındı!** Ateş dindi, ferahladınız. 🧊', ephemeral: true });
        } else if (interaction.customId.startsWith('fire_chili_')) {
          score = Math.min(100, score + 25);
          await interaction.update({ embeds: [buildFireEmbed(target, score)], components: [getFireRow()] });
          await interaction.followUp({ content: '🌶️ **Acı biber yendi!** Alevler bacayı sardı! 🔥🔞', ephemeral: true });
        }
      });
    }
  },

  // ── 4. ÖP & ÖPÜCÜK (KISS) ──────────────────────────────────────────────────
  {
    name: 'öp',
    aliases: ['op', 'kiss', 'öpcük', 'opcuk'],
    category: 'Eğlence',
    description: 'Etiketlediğiniz kişiyi tutkulu veya tatlı bir şekilde öpersiniz.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const target = message.mentions?.users?.first?.();
      if (!target) return message.reply('💋 Kimi öpmek istiyorsanız onu etiketleyin!');
      if (target.id === message.author.id) return message.reply('💋 Aynayı mı öpüyorsunuz? Lütfen başka birini etiketleyin!');

      const kissGifs = [
        'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
        'https://media.giphy.com/media/hnNy3Gz2aS920/giphy.gif',
        'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif'
      ];
      const gif = kissGifs[Math.floor(Math.random() * kissGifs.length)];
      const wetness = Math.floor(Math.random() * 41) + 60; // %60-%100

      const embed = new EmbedBuilder()
        .setTitle('💋 TUTKULU VE ATEŞLİ ÖPÜCÜK!')
        .setDescription(`${message.author} ❤️ ${target}\n\n**${message.author.username}**, **${target.username}** kullanıcısının boynundan ve dudağından tutkuyla öptü!\n\n💦 **Islaklık & Tutku Derecesi:** **%${wetness}** *(Dudaklar uyuştu!)*`)
        .setImage(gif)
        .setColor(0xec4899)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },

  // ── 5. SARIL (HUG) ────────────────────────────────────────────────────────
  {
    name: 'sarıl',
    aliases: ['saril', 'hug'],
    category: 'Eğlence',
    description: 'Etiketlediğiniz kişiye sımsıkı ve ateşli sarılırsınız.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const target = message.mentions?.users?.first?.();
      if (!target) return message.reply('🫂 Kime sarılmak istiyorsanız onu etiketleyin!');

      const hugGifs = [
        'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
        'https://media.giphy.com/media/l2QDM9Jnim1YV5bxC/giphy.gif'
      ];
      const gif = hugGifs[Math.floor(Math.random() * hugGifs.length)];

      const embed = new EmbedBuilder()
        .setTitle('🫂 SICACIK VE ATEŞLİ SARILMA')
        .setDescription(`**${message.author.username}**, **${target.username}** kullanıcısına sımsıkı sarıldı!\n\n✨ **Sıcaklık Seviyesi:** **%100** *(Kalp atışları birbirine karıştı)*`)
        .setImage(gif)
        .setColor(0x8b5cf6)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },

  // ── 6. ŞAPLAK (SPANK / SLAP) ───────────────────────────────────────────────
  {
    name: 'şaplak',
    aliases: ['saplak', 'spank', 'tokat', 'slap'],
    category: 'Eğlence',
    description: 'Etiketlediğiniz kişiye yaramazlık şaplağı atarsınız.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const target = message.mentions?.users?.first?.();
      if (!target) return message.reply('🍑 Kime şaplak atmak istiyorsanız onu etiketleyin!');

      const force = Math.floor(Math.random() * 80) + 50; // 50-130 PSI
      const sound = force > 90 ? '💥 *ŞRAAAAKKK! (Ses tüm mahallede yankılandı!)*' : '👋 *ŞLAAP! (Tatlı ve kızartıcı)*';

      const embed = new EmbedBuilder()
        .setTitle('🍑 YARAMAZLIK ŞAPLAĞI!')
        .setDescription(
          `**${message.author.username}**, **${target.username}** kullanıcısına unutamayacağı bir şaplak indirdi!\n\n` +
          `👉 **Vuruş Sesi:** ${sound}\n` +
          `💥 **Darbe Kuvveti:** **${force} PSI**\n` +
          `🔴 **Kızarıklık Derecesi:** **%${Math.min(100, force)}** *(El izi net şekilde çıktı!)* 🔞`
        )
        .setColor(0xef4444)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },

  // ── 7. DOĞRULUK MU CESARET Mİ (18+ VE CESUR MOD) ──────────────────────────
  {
    name: 'dogrulukcesaret',
    aliases: ['dc', 'd-c', 'dogruluk-cesaret', 'dare'],
    category: 'Eğlence',
    description: 'İnteraktif Doğruluk mu Cesaret mi oyunu.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const embed = new EmbedBuilder()
        .setTitle('🎲 DOĞRULUK MU CESARET Mİ?')
        .setDescription(`Merhaba **${message.author.username}**! Cesaretini test etme vakti geldi.\n\nAşağıdaki butonlardan seçimini yap:`)
        .setColor(0xec4899);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dc_truth_${message.author.id}`).setLabel('🤫 Doğruluk (Cesur Soru)').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`dc_dare_${message.author.id}`).setLabel('🔥 Cesaret (Ateşli Görev)').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`dc_random_${message.author.id}`).setLabel('🎲 Şansıma Ne Çıkarsa').setStyle(ButtonStyle.Secondary)
      );

      const msg = await message.reply({ embeds: [embed], components: [row] });
      const collector = msg.createMessageComponentCollector({ time: 45000 });

      collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
          return i.reply({ content: '❌ Sadece oyunu başlatan kişi seçebilir!', ephemeral: true });
        }

        let isTruth = i.customId.startsWith('dc_truth_');
        if (i.customId.startsWith('dc_random_')) {
          isTruth = Math.random() < 0.5;
        }

        if (isTruth) {
          const q = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
          const resEmbed = new EmbedBuilder()
            .setTitle('🤫 DOĞRULUK SORUSU (Dürüst Ol!)')
            .setDescription(`❓ **Soru:**\n>>> **${q}**\n\n*Cevabını bu kanala yaz! Kaçmak yok!* 😉`)
            .setColor(0x3b82f6);
          await i.update({ embeds: [resEmbed], components: [] });
        } else {
          const d = dareTasks[Math.floor(Math.random() * dareTasks.length)];
          const resEmbed = new EmbedBuilder()
            .setTitle('🔥 CESARET GÖREVİ (Cesaretini Göster!)')
            .setDescription(`🎯 **Görev:**\n>>> **${d}**\n\n*Görevi tamamla ve kanıtını bu kanala sun!* 🔞💥`)
            .setColor(0xef4444);
          await i.update({ embeds: [resEmbed], components: [] });
        }
        collector.stop();
      });
    }
  },

  // ── 8. KAÇ CM & ULTIMATE MALAFAT TESTİ (ZENGİN SİSTEM) ──────────────────────
  {
    name: 'kaçcm',
    aliases: ['kaccm', 'kac-cm', 'kaç-cm', 'cm', 'malafat'],
    category: 'Eğlence',
    description: 'Rastgele kaç cm olduğunu ölçer, dayanıklılık, menzil ve fantezi istatistiği verir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message, args = []) {
      const target = message.mentions?.users?.first?.() || message.author;

      if (target.bot) {
        return message.reply('🤖 **Ben bir robotum ama siber antenim tam 100 cm!** 📡⚡\n*Pil seviyesi %100, aşırı ısınma koruması devrede!* 🔞');
      }

      const calculateCm = () => Math.floor(Math.random() * 38) + 1;
      const calculateHardness = () => Math.floor(Math.random() * 50) + 51;

      const getStamina = (cm) => {
        if (cm <= 7) return '⚡ 3 Saniye (Erken Final & Nefes Darlığı!)';
        if (cm <= 14) return '⏱️ 15 Dakika (Standart Anadolu Performansı)';
        if (cm <= 22) return '🔥 45 Dakika + Uzatmalar (Çarşaf Yakan!)';
        if (cm <= 30) return '🚀 3 Gün 3 Gece (Efsane Maraton)';
        return '🐉 Şampiyonlar Ligi (Yatak Kırıcı & Deprem Etkisi!)';
      };

      const getTitleAndColor = (cm) => {
        if (cm <= 5) return {
          title: '🔬 Mikroskopik & Fındık Kadar',
          comment: 'Cımbız ve büyüteç olmadan tespit edilemiyor! Rüzgarda uçmasın dikkat et 🤏',
          alert: '⚠️ AFAD ve Arama Kurtarma ekipleri mercekle bölgede!',
          color: 0xef4444
        };
        if (cm <= 11) return {
          title: '🐣 Mütevazı Anadolu Kaplanı',
          comment: 'Niyet çok iyi ama ekipman fındık kadar. Kalbin temiz, önemli olan işlevi! 😌',
          alert: '✅ İdare eder, üzmez ama çok da heyecanlandırmaz.',
          color: 0xf59e0b
        };
        if (cm <= 17) return {
          title: '📏 Altın Milli Ortalama',
          comment: 'Tam bir fiyat/performans ürünü! Utandırmaz, yormaz, çarşafı tatlı tatlı sallar. 🔥',
          alert: '👍 Türkiye standartlarının gurur tablosu.',
          color: 0x10b981
        };
        if (cm <= 24) return {
          title: '🦍 Devasa Yatak Kırıcı',
          comment: 'Ateşli ve tehlikeli! Karşı taraf görünce hafiften tırsıyor ve geri adım atıyor... 💥',
          alert: '🚨 DİKKAT: Çevredeki mobilyalara ve duvara zarar verebilir!',
          color: 0x3b82f6
        };
        if (cm <= 31) return {
          title: '🐍 Çılgın Anakonda',
          comment: 'Doğal afet bölgesi! Komşular sarsıntıdan polise haber verdi, yatak garantisi bitti! 🔞',
          alert: '🔞 18+ Çevredekiler derhal sığınaklara kaçsın!',
          color: 0x8b5cf6
        };
        return {
          title: '🚀 Gökdelen Canavarı / Ruhsatlı Silah',
          comment: 'Polis çevirmede durdurdu, jandarma ruhsat istedi! Yörüngeye fırlatılacak boyutta! 🌌⚡',
          alert: '⚡ EFSANEVİ BOYUT: Kitle imha silahı sayılır!',
          color: 0xec4899
        };
      };

      const makeBar = (cm) => {
        const total = 10;
        const filled = Math.min(total, Math.max(1, Math.round((cm / 40) * total)));
        return '8' + '='.repeat(filled * 2) + 'D 💦';
      };

      const getCondomSize = (cm) => {
        if (cm <= 5) return 'XXS (Parmak Kılıfı Tipi 🤏)';
        if (cm <= 12) return 'S / M (Şirin Standart Beden 📦)';
        if (cm <= 20) return 'L / XL (Mega Beden 🔥)';
        if (cm <= 30) return 'XXXL (Çöp Poşeti / Çuval Tipi 🗑️)';
        return 'Çadır Brandası & Battaniye 🏕️';
      };

      const getSprayDistance = (cm) => {
        if (cm <= 5) return '💧 10 cm (Hafif Sızıntı)';
        if (cm <= 12) return '🎯 1.5 Metre (Hedefi Tam Vuran)';
        if (cm <= 20) return '🧯 10 Metre (Tazyikli İtfaiye Hortumu)';
        if (cm <= 30) return '🌊 50 Metre (Baraj Kapağı Açıldı!)';
        return '🚀 Yörüngeye Kadar (Ay\'ı Vurdu! 🌕)';
      };

      const fantasyPositions = [
        '🚁 Helikopter Vuruşu (%98 Uyum)',
        '🧗‍♂️ Tavandan Sallanmalı Kamikaze (%85 Uyum)',
        '🛌 Klasik Anadolu Misyoneri (%100 Uyum)',
        '🐉 Alevli Ejderha Vuruşu (%90 Uyum)',
        '🏎️ Turbo Geri Vites (%92 Uyum)',
        '🤼 Wrestling Tipi Kilitlenme (%88 Uyum)'
      ];

      const getRandomPosition = () => fantasyPositions[Math.floor(Math.random() * fantasyPositions.length)];

      const createEmbed = (user, cm, bonus = 0) => {
        const info = getTitleAndColor(cm);
        const bar = makeBar(cm);
        const hardness = calculateHardness();
        const stamina = getStamina(cm);
        const condom = getCondomSize(cm);
        const spray = getSprayDistance(cm);
        const position = getRandomPosition();

        const embed = new EmbedBuilder()
          .setTitle(`🍆 KAÇ CM & ULTIMATE PERFORMANS TESTİ - ${user.username || 'Kullanıcı'}`)
          .setColor(info.color)
          .addFields(
            { name: '📐 Malafat Boyu', value: `**${cm} cm** ${bonus > 0 ? `*(+${bonus} cm Mavi Hap Effect! 💊)*` : ''}`, inline: true },
            { name: '💎 Sertlik Seviyesi', value: `**%${hardness}** (Çelik Gibi)`, inline: true },
            { name: '⏱️ Dayanıklılık', value: `**${stamina}**`, inline: true },
            { name: '🛡️ Uyumlu Beden', value: `**${condom}**`, inline: true },
            { name: '💦 Tazyik & Menzil', value: `**${spray}**`, inline: true },
            { name: '🍑 Önerilen Fantezi', value: `**${position}**`, inline: true },
            { name: '🏆 Ünvan', value: `**${info.title}**` },
            { name: '💬 Detaylı Yorum', value: info.comment },
            { name: '📢 Durum Raporu', value: info.alert },
            { name: '📊 Görsel Ölçüm', value: `\`${bar}\`` }
          )
          .setFooter({ text: 'EkoYıldız 🔥' })
          .setTimestamp();

        try {
          const avatarUrl = typeof user?.displayAvatarURL === 'function' ? user.displayAvatarURL() : null;
          if (avatarUrl) embed.setThumbnail(avatarUrl);
        } catch (_) {}

        return embed;
      };

      let currentCm = calculateCm();
      let hasUsedViagra = false;
      let isOldSystem = false;

      const getNewSystemRow = () => {
        const buttons = [
          new ButtonBuilder()
            .setCustomId(`reroll_cm_${message.author.id}`)
            .setLabel('🎲 Yeniden Ölç')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`viagra_cm_${message.author.id}`)
            .setLabel('💊 Mavi Hap (+cm)')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`fantasy_cm_${message.author.id}`)
            .setLabel('🍑 Fantezi Çarkı')
            .setStyle(ButtonStyle.Secondary)
        ];

        if (target && target.id !== message.author.id) {
          buttons.push(
            new ButtonBuilder()
              .setCustomId(`compare_cm_${message.author.id}`)
              .setLabel('⚔️ Karşılaştır')
              .setStyle(ButtonStyle.Success)
          );
        } else {
          buttons.push(
            new ButtonBuilder()
              .setCustomId(`old_system_cm_${message.author.id}`)
              .setLabel('📜 Sade Metin')
              .setStyle(ButtonStyle.Secondary)
          );
        }

        return new ActionRowBuilder().addComponents(buttons);
      };

      const getOldSystemRow = () => new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`new_system_cm_${message.author.id}`)
          .setLabel('✨ Yeni Sisteme Geçiş Yap (Zengin Embed)')
          .setStyle(ButtonStyle.Success)
      );

      const embed = createEmbed(target, currentCm);
      let replyMsg;
      const payload = {
        content: `📏 **${target.username || 'Kullanıcı'}** kullanıcısının Kaç CM / Malafat Analiz Raporu:`,
        embeds: [embed],
        components: [getNewSystemRow()]
      };

      try {
        if (typeof message.reply === 'function') {
          replyMsg = await message.reply(payload).catch(async () => {
            if (message.channel) return await message.channel.send(payload);
          });
        } else if (message.channel) {
          replyMsg = await message.channel.send(payload);
        }
      } catch (err) {
        console.error('[kaçcm error]:', err);
        const fallback = `📏 **${target.username || 'Kullanıcı'}** kullanıcısının malafatı tam olarak **${currentCm} cm**! ¯\\_(ツ)_/¯`;
        if (typeof message.reply === 'function') {
          return message.reply(fallback).catch(() => message.channel?.send(fallback).catch(() => {}));
        } else if (message.channel) {
          return message.channel.send(fallback).catch(() => {});
        }
      }

      if (!replyMsg || typeof replyMsg.createMessageComponentCollector !== 'function') {
        return;
      }
      const collector = replyMsg.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: '❌ Bu butonları sadece komutu kullanan kişi tıklayabilir!', ephemeral: true });
        }

        if (interaction.customId.startsWith('old_system_cm_')) {
          isOldSystem = true;
          await interaction.update({
            content: `📏 **${target.username}** kullanıcısının malafatı tam olarak **${currentCm} cm**! ¯\\_(ツ)_/¯`,
            embeds: [],
            components: [getOldSystemRow()]
          });
        } else if (interaction.customId.startsWith('new_system_cm_')) {
          isOldSystem = false;
          const currentEmbed = createEmbed(target, currentCm);
          await interaction.update({
            content: `📏 **${target.username}** kullanıcısının Kaç CM / Malafat Analiz Raporu:`,
            embeds: [currentEmbed],
            components: [getNewSystemRow()]
          });
        } else if (interaction.customId.startsWith('reroll_cm_')) {
          currentCm = calculateCm();
          hasUsedViagra = false;
          if (isOldSystem) {
            await interaction.update({
              content: `📏 **${target.username}** kullanıcısının malafatı tam olarak **${currentCm} cm**! ¯\\_(ツ)_/¯`,
              embeds: [],
              components: [getOldSystemRow()]
            });
          } else {
            const newEmbed = createEmbed(target, currentCm);
            await interaction.update({
              content: `📏 **${target.username}** kullanıcısının Kaç CM / Malafat Analiz Raporu:`,
              embeds: [newEmbed],
              components: [getNewSystemRow()]
            });
          }
        } else if (interaction.customId.startsWith('viagra_cm_')) {
          if (hasUsedViagra) {
            return interaction.reply({ content: '⚠️ **Zaten takviye aldın! Aşırı doz kalp krizine yol açabilir! 💊💀**', ephemeral: true });
          }
          hasUsedViagra = true;
          const bonus = Math.floor(Math.random() * 5) + 3;
          currentCm += bonus;
          if (isOldSystem) {
            await interaction.update({
              content: `📏 **${target.username}** kullanıcısının malafatı Mavi Hap takviyesiyle tam olarak **${currentCm} cm** oldu! 💊🚀 ¯\\_(ツ)_/¯`,
              embeds: [],
              components: [getOldSystemRow()]
            });
          } else {
            const boostedEmbed = createEmbed(target, currentCm, bonus);
            await interaction.update({
              content: `📏 **${target.username}** kullanıcısının Kaç CM / Malafat Analiz Raporu:`,
              embeds: [boostedEmbed],
              components: [getNewSystemRow()]
            });
          }
          await interaction.followUp({ content: `💊 **Mavi Hap Etkisini Gösterdi!** Malafat **+${bonus} cm** daha uzadı! 🚀🔥`, ephemeral: true });
        } else if (interaction.customId.startsWith('fantasy_cm_')) {
          const newPos = fantasyPositions[Math.floor(Math.random() * fantasyPositions.length)];
          const fantasyEmbed = new EmbedBuilder()
            .setTitle(`🍑 FANTEZİ ÇARKI - ${target.username}`)
            .setColor(0xec4899)
            .setDescription(`🔥 **Rastgele Fantezi Kartı Çekildi!**\n\n👉 **Bugünün Önerilen Pozisyonu:**\n**${newPos}**\n\n*Partneriniz hazırsa hemen deneyebilirsiniz!* 😉🔞`);
          await interaction.reply({ embeds: [fantasyEmbed], ephemeral: true });
        } else if (interaction.customId.startsWith('compare_cm_')) {
          const user1Cm = currentCm;
          const user2Cm = calculateCm();
          const p1 = target;
          const p2 = message.author;

          const compEmbed = new EmbedBuilder()
            .setTitle('⚔️ KAÇ CM MALAFAT DÜELLOSU')
            .setColor(0xf59e0b)
            .addFields(
              { name: `👤 ${p1.username}`, value: `**${user1Cm} cm**\n\`${makeBar(user1Cm)}\``, inline: true },
              { name: `⚔️ VS`, value: '⚡', inline: true },
              { name: `👤 ${p2.username}`, value: `**${user2Cm} cm**\n\`${makeBar(user2Cm)}\``, inline: true },
              { name: '🏆 Kapışma Sonucu', value: user1Cm > user2Cm ? `🎉 **${p1.username}** heybetiyle **${p2.username}** kişisini ezip geçti!` : (user2Cm > user1Cm ? `🎉 **${p2.username}** devasa boyutuyla **${p1.username}** kişisini nakavt etti!` : '🤝 **Berabere!** İki malafat da eşit boyda çıktı, dostluk kazandı.') }
            );

          await interaction.reply({ embeds: [compEmbed], ephemeral: false });
        }
      });

      collector.on('end', () => {
        const activeRow = isOldSystem ? getOldSystemRow() : getNewSystemRow();
        const disabledRow = new ActionRowBuilder().addComponents(
          activeRow.components.map(b => ButtonBuilder.from(b).setDisabled(true))
        );
        replyMsg.edit({ components: [disabledRow] }).catch(() => { });
      });
    }
  },

  // ── 9. SLOT MAKİNESİ (CASINO) ──────────────────────────────────────────────
  {
    name: 'slot',
    category: 'Eğlence',
    description: 'Animasyonlu Slot Makinesi oyunu.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const items = ['🍒', '🍋', '💎', '🔔', '7️⃣', '🍑', '🍆'];
      const getRandomItem = () => items[Math.floor(Math.random() * items.length)];

      const spinMsg = await message.reply('🎰 **Slot Makinesi Dönüyor...**\n`[ ❓ | ❓ | ❓ ]`');

      setTimeout(async () => {
        const i1 = getRandomItem();
        await spinMsg.edit(`🎰 **Slot Makinesi Dönüyor...**\n\`[ ${i1} | ❓ | ❓ ]\``).catch(() => { });

        setTimeout(async () => {
          const i2 = getRandomItem();
          await spinMsg.edit(`🎰 **Slot Makinesi Dönüyor...**\n\`[ ${i1} | ${i2} | ❓ ]\``).catch(() => { });

          setTimeout(async () => {
            const i3 = getRandomItem();
            const isWin = (i1 === i2 && i2 === i3);
            const isPair = (i1 === i2 || i2 === i3 || i1 === i3);

            let status = '❌ Şansına küs, kazanamadın!';
            let color = 0xef4444;

            if (isWin) {
              status = '🏆 **BÜYÜK İKRAMİYE! 3\'ü DE EŞLEŞTİ! 🎉**';
              color = 0x10b981;
            } else if (isPair) {
              status = '✨ **İkili Eşleşme! Güzel deneme.**';
              color = 0xf59e0b;
            }

            const embed = new EmbedBuilder()
              .setTitle('🎰 SLOT MAKİNESİ SONUCU')
              .setDescription(`\`[ ${i1} | ${i2} | ${i3} ]\`\n\n${status}`)
              .setColor(color);

            await spinMsg.edit({ content: null, embeds: [embed] }).catch(() => { });
          }, 800);
        }, 800);
      }, 800);
    }
  },

  // ── 10. MAYIN TARLASI ──────────────────────────────────────────────────────
  {
    name: 'mayıntarlası',
    aliases: ['minesweeper', 'mayin-tarlasi'],
    category: 'Eğlence',
    description: '5x5 Buton Izgaralı Mayın Tarlası Oyunu.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const mines = new Set();
      while (mines.size < 4) {
        mines.add(Math.floor(Math.random() * 25));
      }

      let revealed = new Set();
      let gameOver = false;
      let score = 0;

      const buildGrid = () => {
        const rows = [];
        for (let r = 0; r < 5; r++) {
          const actionRow = new ActionRowBuilder();
          for (let c = 0; c < 5; c++) {
            const index = r * 5 + c;
            const btn = new ButtonBuilder().setCustomId(`mine_${index}`);

            if (revealed.has(index)) {
              if (mines.has(index)) {
                btn.setLabel('💣').setStyle(ButtonStyle.Danger).setDisabled(true);
              } else {
                btn.setLabel('🟩').setStyle(ButtonStyle.Success).setDisabled(true);
              }
            } else {
              if (gameOver) {
                if (mines.has(index)) btn.setLabel('💣').setStyle(ButtonStyle.Danger).setDisabled(true);
                else btn.setLabel('⬛').setStyle(ButtonStyle.Secondary).setDisabled(true);
              } else {
                btn.setLabel('❓').setStyle(ButtonStyle.Secondary);
              }
            }
            actionRow.addComponents(btn);
          }
          rows.push(actionRow);
        }
        return rows;
      };

      const getEmbed = () => new EmbedBuilder()
        .setTitle('💣 MAYIN TARLASI (MINESWEEPER)')
        .setDescription(`🎮 **Mayınlara basmadan kareleri açın!**\n\n🎯 **Skor:** ${score} Puan\n💣 **Kalan Güvenli Kare:** ${21 - revealed.size}`)
        .setColor(0x3b82f6);

      const msg = await message.reply({ embeds: [getEmbed()], components: buildGrid() });
      const collector = msg.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
          return i.reply({ content: '❌ Bu oyunu sadece komutu başlatan oynayabilir!', ephemeral: true });
        }

        const index = parseInt(i.customId.replace('mine_', ''));
        if (mines.has(index)) {
          gameOver = true;
          revealed.add(index);
          const loseEmbed = new EmbedBuilder()
            .setTitle('💥 BOOM! MAYINA BASTIN!')
            .setDescription(`💀 **Kaybettin!** Toplanan Skor: **${score} Puan**`)
            .setColor(0xef4444);

          await i.update({ embeds: [loseEmbed], components: buildGrid() });
          collector.stop();
        } else {
          revealed.add(index);
          score += 10;

          if (revealed.size === 21) {
            gameOver = true;
            const winEmbed = new EmbedBuilder()
              .setTitle('🏆 TEBRİKLER! TÜM MAYINLARDAN KAÇTIN!')
              .setDescription(`🎉 **Tüm temiz alanları açtın!** Toplam Skor: **${score} Puan**`)
              .setColor(0x10b981);

            await i.update({ embeds: [winEmbed], components: buildGrid() });
            collector.stop();
          } else {
            await i.update({ embeds: [getEmbed()], components: buildGrid() });
          }
        }
      });
    }
  },

  // ── 11. ADAM ASMACA ───────────────────────────────────────────────────────
  {
    name: 'adamasmaca',
    category: 'Eğlence',
    description: 'Adam Asmaca oyunu oynarsınız.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const kelimeler = ['DISCORD', 'TURKIYE', 'EKOYILDIZ', 'YAZILIM', 'SISTEM', 'ELEKTRONIK', 'ROBLOX', 'FANTEZI'];
      const word = kelimeler[Math.floor(Math.random() * kelimeler.length)];
      let guessed = new Set();
      let lives = 6;

      const renderWord = () => word.split('').map(char => (guessed.has(char) ? char : '\\_')).join(' ');

      const msg = await message.reply(`🎮 **Adam Asmaca Başladı!**\n\nKelime: \`${renderWord()}\`\nKalan Hak: **${lives}**\n\n*Harf tahmin etmek için sohbete tek bir harf yazın!*`);

      const filter = m => m.author.id === message.author.id && m.content.length === 1;
      const collector = message.channel.createMessageCollector({ filter, time: 60000 });

      collector.on('collect', m => {
        const char = m.content.toUpperCase();
        m.delete().catch(() => { });

        if (guessed.has(char)) return;
        guessed.add(char);

        if (!word.includes(char)) lives--;

        const currentDisplay = renderWord();
        if (!currentDisplay.includes('\\_')) {
          msg.edit(`🎉 **Tebrikler!** Kelimeyi bildiniz: **${word}**`);
          collector.stop();
        } else if (lives <= 0) {
          msg.edit(`💀 **Kaybettiniz!** Doğru kelime: **${word}** idi.`);
          collector.stop();
        } else {
          msg.edit(`🎮 **Adam Asmaca**\n\nKelime: \`${currentDisplay}\`\nKalan Hak: **${lives}**`);
        }
      });
    }
  },

  // ── 12. BALIK TUT ─────────────────────────────────────────────────────────
  {
    name: 'balıktut',
    aliases: ['baliktut', 'fish'],
    category: 'Eğlence',
    description: 'Olta atar ve rastgele deniz canlısı yakalarsınız.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const catches = [
        { name: '🐟 Küçük Hamsi (15 cm)', value: 10, rarity: 'Yaygın' },
        { name: '🐠 Renkli Palyaço Balığı (25 cm)', value: 35, rarity: 'Nadir' },
        { name: '🦈 Büyük Beyaz Köpekbalığı (3 Metre!)', value: 250, rarity: 'Destansı' },
        { name: '👢 Eski Bir Çizme', value: 0, rarity: 'Çöp' },
        { name: '👑 Altın Kaplama Deniz Kızı Tacı', value: 500, rarity: 'EFSANEVİ' }
      ];

      const chosen = catches[Math.floor(Math.random() * catches.length)];
      const embed = new EmbedBuilder()
        .setTitle('🎣 OLTA ÇEKİLDİ!')
        .setDescription(`Oltana takılan:\n\n👉 **${chosen.name}**\n⭐ **Nadirlik:** \`${chosen.rarity}\`\n💰 **Değer:** \`${chosen.value} Puan\``)
        .setColor(0x3b82f6)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },

  // ── 13. RUS RULETİ ────────────────────────────────────────────────────────
  {
    name: 'rulet',
    aliases: ['rusruleti', 'roulette'],
    category: 'Eğlence',
    description: 'Revolver ile Rus Ruleti oynarsınız.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const isDead = Math.random() < (1 / 6);
      const msg = await message.reply('🔫 **Altıpatlar namlusu çevrildi ve şakağa dayandı... Tetik çekiliyor...**');

      setTimeout(async () => {
        if (isDead) {
          const deadEmbed = new EmbedBuilder()
            .setTitle('💥 BOOOOM! MERMİ PATLADI!')
            .setDescription(`💀 **${message.author.username}** kafasına sıktı ve rahmetli oldu! ⚰️`)
            .setColor(0xef4444);
          await msg.edit({ content: null, embeds: [deadEmbed] });
        } else {
          const liveEmbed = new EmbedBuilder()
            .setTitle('💨 *KLİK!* BOŞ KOVAN!')
            .setDescription(`😅 Şanslısın **${message.author.username}**! Mermi namluya denk gelmedi, hayattasın! 🎉`)
            .setColor(0x10b981);
          await msg.edit({ content: null, embeds: [liveEmbed] });
        }
      }, 2000);
    }
  },

  // ── 14. DİĞER EĞLENCE KOMUTLARI ───────────────────────────────────────────
  {
    name: 'yazıtura',
    aliases: ['yazı-tura', 'paracevir', 'coinflip'],
    category: 'Eğlence',
    description: 'Yazı-Tura atarsınız.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const msg = await message.reply('🪙 **Para havaya atıldı, dönüyor...**');
      setTimeout(async () => {
        const result = Math.random() < 0.5 ? 'YAZI 🪙' : 'TURA 🪙';
        const embed = new EmbedBuilder()
          .setTitle('🪙 YAZI-TURA SONUCU')
          .setDescription(`Para düştü ve gelen sonuç:\n\n👉 **${result}**`)
          .setColor(0xf59e0b);
        await msg.edit({ content: null, embeds: [embed] }).catch(() => { });
      }, 1000);
    }
  },
  {
    name: 'gününbilgisi',
    aliases: ['tarih', 'bilgi', 'fact'],
    category: 'Eğlence',
    description: 'Rastgele tarihi, bilimsel veya kültürel bir bilgi/alıntı gösterir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const item = dailyFacts[Math.floor(Math.random() * dailyFacts.length)];
      const embed = new EmbedBuilder()
        .setTitle(item.title)
        .setDescription(`📌 ${item.fact}`)
        .setColor(0x3b82f6)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
  },
  {
    name: 'atatürk',
    aliases: ['ataturk'],
    category: 'Eğlence',
    description: 'Rastgele bir Atatürk fotoğrafı gönderir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const photo = ataturkPhotos[Math.floor(Math.random() * ataturkPhotos.length)];
      const embed = new EmbedBuilder()
        .setTitle('🇹🇷 Mustafa Kemal Atatürk')
        .setImage(photo)
        .setColor(0xef4444);
      return message.reply({ embeds: [embed] });
    }
  },
  {
    name: 'iltifat',
    category: 'Eğlence',
    description: 'Etiketlediğiniz kişiye tatlı veya romantik bir iltifat eder.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const target = message.mentions?.users?.first?.() || message.author;
      const iltifatlar = [
        'Gözlerinin ışıltısı tüm sunucunun aydınlatma masrafını karşılıyor! ✨',
        'Sen bu dünyaya fazlasın, yıldızlardan düşmüş bir parçasın. 🌟',
        'Gülüşünle buzulları eritecek kadar sıcak ve çekicisin. 🔥',
        'Senin olduğun odada havanın sıcaklığı otomatik 10 derece artıyor! 💖'
      ];
      const ilt = iltifatlar[Math.floor(Math.random() * iltifatlar.length)];
      return message.reply(`💬 ${target}, **${message.author.username}** sana diyor ki:\n>>> *"${ilt}"*`);
    }
  },
  {
    name: 'kapaklaf',
    aliases: ['kapak'],
    category: 'Eğlence',
    description: 'Etiketlediğiniz kişiye efsane kapak söz söyler.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const target = message.mentions?.users?.first?.();
      if (!target) return message.reply('Kime kapak yapmak istiyorsanız etiketleyin!');
      const laflar = [
        'Sana laf sokardım ama laf sokmaya bile değmezsin.',
        'Benim seviyeme çıkamazsın, asansör bozuk!',
        'Senin egon benim boyumu aşamaz canım.',
        'Karakterin kadar konuş desem ömür boyu susarsın.'
      ];
      const laf = laflar[Math.floor(Math.random() * laflar.length)];
      return message.reply(`💥 ${target}, **${message.author.username}** tarafından fena bozuldu:\n>>> *"${laf}"*`);
    }
  },
  {
    name: 'fıkra',
    aliases: ['fikra', 'joke'],
    category: 'Eğlence',
    description: 'Rastgele komik fıkra anlatır.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const fikralar = [
        'Temel bir gün uçağa binmiş. Yanındaki adama sormuş: "Hemşerim bu uçak nereye uçar?" Adam: "Trabzon\'a" demiş. Temel: "Ula iyi ki binmişim benim de yolum orayadı!"',
        'Hoca bir gün göle maya çalıyormuş. Köylüler sormuş: "Hocam göl maya tutar mı?" Hoca: "Ya tutarsa!"',
        'Dursun Temel\'e demiş: "Temel uşağum saat kaç?" Temel bakmış: "Valla akreple yelkovan güreşiyir, ben de anlamadım!"'
      ];
      const fikra = fikralar[Math.floor(Math.random() * fikralar.length)];
      return message.reply(`😄 **Günün Fıkrası:**\n>>> ${fikra}`);
    }
  },
  {
    name: 'tarihtebugun',
    aliases: ['tarih', 'tb', 'tarihte-bugun', 'todayinhistory'],
    category: 'Genel',
    description: 'Tarihte bugün yaşanan büyük zaferleri, Atatürk\'ün adımlarını, bilim ve keşif olaylarını anlatır.',
    userPermissions: [],
    botPermissions: ['EmbedLinks'],
    async execute(message, args) {
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      const { getSpecialDayInfo } = require('../../services/specialDaysHelper');
      const { getHistoricalFallbackEvent } = require('../../services/historyDataset');
      const { chatWithAI } = require('../../services/aiService');

      const loadingMsg = await message.reply('⏳ Tarih arşivleri taranıyor ve yapay zeka ile günün tarihi özeti hazırlanıyor...').catch(() => null);

      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth();
      const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      const dateStr = `${day} ${months[month]}`;

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDay = yesterday.getDate();
      const yesterdayMonth = months[yesterday.getMonth()];
      const yesterdayStr = `${yesterdayDay} ${yesterdayMonth}`;

      const specialDay = getSpecialDayInfo(today);
      const embedTitle = specialDay ? `${specialDay.emoji} ${specialDay.name} – ${dateStr}` : `📅 Tarihte Bugün – ${dateStr}`;
      const embedColor = specialDay?.color || 0xdc143c;

      const systemPrompt = `Sen Türk ve Dünya tarihini derinlemesine bilen, Atatürk ilkelerine ve Cumhuriyet değerlerine tutkuyla bağlı, samimi ve sürükleyici bir üslupla konuşan uzman bir baş tarih araştırmacısı ve anlatıcısısın.
Görevin: İstenen tarihte (${dateStr}) gerçekleşmiş tarihi olayları derinlemesine, edebi, akıcı, merak uyandırıcı ve zengin bir Türkçe ile çok kapsamlı aktarmak.

İÇERİK YAPISI:
1. GİRİŞ & ATATÜRK KÖŞESİ (Gazi Mustafa Kemal Atatürk'ün bu tarihteki veya o dönemin bu günlerindeki askeri, siyasi, stratejik ve devrimci liderliği, vizyonu ve tarihi adımları).
2. TÜRK VE DÜNYA TARİHİNDE BÜYÜK DÖNÜM NOKTALARI (Fetihler, savaşlar, antlaşmalar, devrimler, imparatorluklar ve uluslararası kritik gelişmeler).
3. BİLİM, UZAY, KÜLTÜR VE SANAT (İcatlar, uzay keşifleri, edebiyat ve mimarlık şaheserleri).
4. İLGİNÇ TARİHİ TRIVIA & BİLİNMEYEN GERÇEKLER (Az bilinen, şaşırtıcı ve düşündürücü tarihi anekdot).
5. GÜNÜN TARİHİ SÖZÜ & VECİZESİ (Günün ruhunu yansıtan ilham verici tarihi bir söz).

KURALLAR:
- Samimi, saygılı ve arkadaş canlısı bir hitapla başla.
- Bilgiler tarihi gerçeklere tam uygun, detaylı ve doyurucu olsun.
- Sadece Türkçe metin üret.`;

      const userPrompt = `Tarih: ${dateStr}.
Lütfen ${dateStr} tarihi için:
1) Gazi Mustafa Kemal Atatürk ve Kurtuluş/Cumhuriyet tarihimizden çok detaylı bir anlatım (Dün ${yesterdayStr}'taki tarihi bağlam ile),
2) Türk ve Dünya tarihindeki diğer büyük tarihi zaferler, antlaşmalar veya kırılma anları,
3) Bilim, teknoloji, uzay veya sanat dünyasından tarihte bugün yaşanan önemli bir keşif/gelişme,
4) İlginç, şaşırtıcı bir tarihi trivia/anekdot,
5) Günün tarihi sözünü içeren çok kapsamlı, akıcı, zengin ve uzun bir Tarihte Bugün metni hazırla.`;

      let aiContent = "";
      try {
        aiContent = await chatWithAI([{ role: 'user', content: userPrompt }], systemPrompt, 'ticket', { max_tokens: 1000, temperature: 0.65 });
        if (!aiContent || aiContent.trim().length < 120) {
          throw new Error("AI yanıtı yetersiz");
        }
      } catch (aiErr) {
        aiContent = getHistoricalFallbackEvent(day, month);
      }

      if (aiContent && aiContent.length > 4000) {
        aiContent = aiContent.substring(0, 3990) + "\n\n*(Devamı kesildi...)*";
      }

      const botAvatar = message.client?.user ? message.client.user.displayAvatarURL() : undefined;

      const embed = new EmbedBuilder()
        .setTitle(embedTitle)
        .setDescription(aiContent)
        .setColor(embedColor)
        .setFooter({ text: "EkoYıldız Genişletilmiş Tarih & Kültür Sistemi • Gazi Mustafa Kemal Atatürk'ün İzinde", iconURL: botAvatar })
        .setTimestamp();

      if (specialDay) {
        embed.addFields({
          name: `📌 ${specialDay.emoji} Günün Anlam ve Önemi`,
          value: `${specialDay.desc}\n> *"${specialDay.quote}"*`
        });
      }

      const historyRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`tb_detail_ataturk_${day}_${month}`)
          .setLabel("🏛️ Atatürk & Zaferler")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`tb_detail_science_${day}_${month}`)
          .setLabel("🔬 Bilim & Keşifler")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`tb_detail_trivia_${day}_${month}`)
          .setLabel("💡 Tarihi Trivia")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`tb_random_quote_${day}_${month}`)
          .setLabel("📜 Tarihi Vecize")
          .setStyle(ButtonStyle.Secondary)
      );

      if (loadingMsg && typeof loadingMsg.edit === 'function') {
        return loadingMsg.edit({ content: null, embeds: [embed], components: [historyRow] }).catch(() => message.reply({ embeds: [embed], components: [historyRow] }).catch(() => {}));
      } else {
        return message.reply({ embeds: [embed], components: [historyRow] }).catch(() => {});
      }
    }
  },

  // ── 9. CİNSEL YÖNELİM KARTIS VE TERCİH MERKEZİ ─────────────────────────────
  {
    name: 'yönelim',
    aliases: ['yonelim', 'cinselyonelim', 'tercih', 'orientation'],
    category: 'Eğlence',
    description: 'Cinsel yöneliminizi (Heteroseksüel, Eşcinsel/Gay/Lesbian, Biseksüel, Panseksüel, Aseksüel, Aseküel, Demiseksüel, vb.) seçer ve eğlence komutlarını ilgi alanınıza göre özelleştirir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const User = require('../../../models/User');
      let dbUser = await User.findOne({ discordId: message.author.id });

      const orientations = [
        { label: 'Heteroseksüel (Karşı Cins İlgisi)', value: 'Heteroseksüel', emoji: '👫', desc: 'Karşı cinse yönelik çekim ve romantik ilgi.' },
        { label: 'Eşcinsel / Gey / Lezbiyen (Kendi Cinsi)', value: 'Eşcinsel', emoji: '🏳️‍🌈', desc: 'Aynı cinse yönelik çekim ve tutkulu ilgi.' },
        { label: 'Biseksüel (Her İki Cins)', value: 'Biseksüel', emoji: '💖', desc: 'Hem kendi cinsine hem de karşı cinse yönelik ilgi.' },
        { label: 'Panseksüel (Cinsiyetten Bağımsız)', value: 'Panseksüel', emoji: '✨', desc: 'Cinsiyet kimliğinden bağımsız olarak ruha ilgi.' },
        { label: 'Aseksüel (Düşük/Yok Cinsel Çekim)', value: 'Aseksüel', emoji: '🛡️', desc: 'Cinsel çekim hissetmeyen, duygusal bağ odaklı.' },
        { label: 'Demiseksüel (Derin Duygusal Bağ Odaklı)', value: 'Demiseksüel', emoji: '💫', desc: 'Yalnızca derin duygusal bağ kurulduğunda çekim duyan.' }
      ];

      const currentOrientation = dbUser?.sexualOrientation || 'Belirtilmedi';

      const embed = new EmbedBuilder()
        .setTitle('🌈 CİNSEL YÖNELİM & TERCİH PROFİLİ')
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(
          `Merhaba **${message.author.username}**!\n\n` +
          `📌 **Mevcut Cinsel Yönelim Profiliniz:** \`${currentOrientation}\`\n\n` +
          `💡 **Nasıl Çalışır?**\n` +
          `Burada seçeceğiniz yönelim, bot içerisindeki fantezi çarkı, uyum testi, libido ve flört komutlarının metinlerini doğrudan sizin cinsel ilgi alanınıza özel olarak kişiselleştirir.\n\n` +
          `👇 **Aşağıdaki menüden kendi cinsel yöneliminizi seçin:**`
        )
        .setColor(0xec4899)
        .setFooter({ text: 'EkoYıldız Özgür Yönelim & Eğlence Motoru' })
        .setTimestamp();

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`set_orientation_${message.author.id}`)
        .setPlaceholder('🌈 Cinsel Yöneliminizi Seçin...')
        .addOptions(
          orientations.map(o => new StringSelectMenuOptionBuilder()
            .setLabel(o.label)
            .setValue(o.value)
            .setDescription(o.desc)
            .setEmoji(o.emoji)
            .setDefault(o.value === currentOrientation)
          )
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);
      const replyMsg = await message.reply({ embeds: [embed], components: [row] });

      const collector = replyMsg.createMessageComponentCollector({ time: 60000 });
      collector.on('collect', async i => {
        if (i.user.id !== message.author.id) {
          return i.reply({ content: '❌ Bu menüyü sadece komutu çalıştıran kullanıcı değiştirebilir!', ephemeral: true });
        }
        const selectedVal = i.values[0];

        if (!dbUser) {
          dbUser = new User({ discordId: message.author.id, username: message.author.username });
        }
        dbUser.sexualOrientation = selectedVal;
        await dbUser.save();

        const updatedEmbed = new EmbedBuilder()
          .setTitle('✅ CİNSEL YÖNELİM PROFİLİNİZ GÜNCELLENDİ!')
          .setDescription(`✨ Cinsel yönelim tercihiniz **${selectedVal}** olarak kaydedildi!\n\nArtık tüm fantezi, uyum, flört ve eğlence komutları sizin cinsel ilgi dünyanıza göre kişiselleştirilmiş olarak çalışacaktır. 🎉`)
          .setColor(0x10b981)
          .setFooter({ text: 'EkoYıldız Profil Sistemi' });

        await i.update({ embeds: [updatedEmbed], components: [] });
      });
    }
  },

  // ── 10. ÖZEL FANTEZİ ÇARKI (YÖNELİME ÖZEL) ─────────────────────────────────
  {
    name: 'fantezi',
    aliases: ['fantezicarki', 'fantezi-carki', 'fantasyroll'],
    category: 'Eğlence',
    description: 'Kendi cinsel yöneliminize ve ilgi alanınıza özel kurgulanmış fantezi senaryosu üretir.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const User = require('../../../models/User');
      const dbUser = await User.findOne({ discordId: message.author.id });
      const orientation = dbUser?.sexualOrientation || 'Heteroseksüel';

      const fantasiesByOrientation = {
        'Heteroseksüel': [
          '🌌 Loş ışıklı bir otel odasında şampanya eşliğinde tutkulu bir gece misyoneri.',
          '🏎️ Gece sahil kenarında parkedilmiş lüks bir arabada yüksek adrenalinli macera.',
          '🕯️ Mum ışıkları ve ipek çarşaflar arasında unutulmaz bir romantik ritim.'
        ],
        'Eşcinsel': [
          '🏳️‍🌈 Özel bir kulübün VIP odasında göz göze, derin ve elektrikli bir yakınlaşma.',
          '🔥 Gece yarısı havuz kenarında tutkulu ve sınırları zorlayan harika bir fantezi.',
          '✨ İki tutkulu ruhun romantik bir akşam yemeği sonrasında birbirine kenetlenmesi.'
        ],
        'Biseksüel': [
          '💎 Çift yönlü tutku: Sınırların kalktığı, yüksek enerjili ve özgürlüklü bir parti fantezisi.',
          '🔮 Hem duygusal hem de cinsel ateşin zirve yaptığı sürpriz bir akşam.',
          '🎭 Farklı evrenlerin ve arzuların buluştuğu romantik ve çılgın bir senaryo.'
        ],
        'Panseksüel': [
          '✨ Ruhların ve bedenlerin cinsiyet kavramından tamamen bağımsız şekilde büyüleyici uyumu.',
          '🌌 Kozmik bir derinlik: Saf arzu ve zihinsel çekimin harmanlandığı özel bir gece.',
          '🎨 Sanatsal ve özgür; sadece duygunun ve tutkunun konuştuğu eşsiz anlar.'
        ],
        'Aseksüel': [
          '☕ Yıldızların altında kahve eşliğinde saatlerce süren derin felsefi ve duygusal sohbet.',
          '🛋️ Sıcak bir battaniyenin altında film izlerken hissedilen saf ve huzurlu yakınlık.',
          '🌌 Birbirinin ruhuna dokunan, tamamen cinsellikten uzak ama %100 sadık bir bağ.'
        ],
        'Demiseksüel': [
          '💖 Yıllardır süren derin dostluğun ve güvenin aniden alevlenen tutkulu meyvesi.',
          '🔒 Yalnızca kalpler tamamen açıldığında ortaya çıkan büyüleyici ve özel temas.',
          '🕊️ Ruhsal bütünleşmenin ardından gelen unutulmaz ve romantik anlar.'
        ]
      };

      const options = fantasiesByOrientation[orientation] || fantasiesByOrientation['Heteroseksüel'];
      const chosenFantasy = options[Math.floor(Math.random() * options.length)];

      const embed = new EmbedBuilder()
        .setTitle(`🍑 CİNSEL FANTEZİ ÇARKI — ${message.author.username}`)
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(
          `👤 **Kullanıcı:** ${message.author}\n` +
          `🌈 **Kayıtlı Yönelim Profiliniz:** \`${orientation}\`\n\n` +
          `✨ **Sizin Yöneliminize Özel Çıkan Senaryo:**\n` +
          `>>> **${chosenFantasy}**\n\n` +
          `💡 *Cinsel yöneliminizi değiştirmek için \`e!yönelim\` komutunu kullanabilirsiniz.*`
        )
        .setColor(0xec4899)
        .setFooter({ text: 'EkoYıldız Kişiselleştirilmiş Fantezi Motoru' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },

  // ── 11. CİNSEL UYUM VE TEN UYUMU TESTİ ──────────────────────────────────────
  {
    name: 'cinseluyum',
    aliases: ['tenuyumu', 'ten-uyumu', 'cinsel-uyum', 'sexualharmony'],
    category: 'Eğlence',
    description: 'Etiketlediğiniz kişiyle cinsel, tensel ve duygusal çekim uyumunuzu ölçer.',
    userPermissions: [],
    botPermissions: [],
    async execute(message) {
      const target = message.mentions?.users?.first?.();
      if (!target) return message.reply('💞 Ten ve cinsel uyumunuzu ölçmek istediğiniz kişiyi etiketleyin!');
      if (target.id === message.author.id) return message.reply('❌ Kendi kendinizle ten uyumu ölçemezsiniz!');

      const harmonyScore = Math.floor(Math.random() * 41) + 60; // 60-100%
      const User = require('../../../models/User');
      const dbUser = await User.findOne({ discordId: message.author.id });
      const orientation = dbUser?.sexualOrientation || 'Heteroseksüel';

      const embed = new EmbedBuilder()
        .setTitle('🔥 CİNSEL & TENSEL UYUM ANALİZİ')
        .setDescription(
          `${message.author} ⚡ ${target}\n\n` +
          `💖 **Genel Uyum Skoru:** **%${harmonyScore}**\n` +
          `🌈 **Sizin Yönelim Temanız:** \`${orientation}\`\n\n` +
          `🔥 **Tensel Çekim:** **%${Math.min(100, harmonyScore + 5)}** *(Tenler birbirini çekiyor!)*\n` +
          `🌊 **Tutku & Ritim:** **%${harmonyScore}** *(Ritim mükemmel tutuyor)*\n` +
          `💬 **Fantezi Uyum Seviyesi:** **%${Math.max(50, harmonyScore - 8)}**\n\n` +
          `📢 **Uzman Yorumu:**\n` +
          `> Aranızdaki kimyasal elektrik oldukça yüksek! Birbirinizin dokunuşlarına tepki verme ihtimaliniz maksimum seviyede.`
        )
        .setColor(0xef4444)
        .setFooter({ text: 'EkoYıldız Kimya & Uyum Laboratuvarı' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  }
];
