'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
  ButtonBuilder
} = require('discord.js');

const PREFIX = 's!';

const CATEGORIES = {
  moderation: {
    title: '👮 Moderasyon & Disiplin Komutları',
    description: 'Sunucu güvenliği, ceza infaz ve disiplin mekanizması komutları:',
    emoji: '👮',
    commands: [
      { name: `${PREFIX}hapis @üye [dk] [gerekçe]`, desc: 'Üyeyi #kodos hapishanesine atar ve sözleşme taahhütnamesi iletir.' },
      { name: `${PREFIX}uyar @üye [gerekçe]`, desc: 'Üyeye resmi disiplin uyarısı ve dijital kural sözleşmesi iletir.' },
      { name: `${PREFIX}uyarı-sil @üye`, desc: 'Üyenin aktif 1 uyarısını siler ve sicilini düzeltir.' },
      { name: `${PREFIX}unkodos @üye`, desc: 'Hapisteki üyeyi tahliye eder ve rollerini geri iade eder.' },
      { name: `${PREFIX}ban @üye [gerekçe]`, desc: 'Kullanıcıyı sunucudan yasaklar.' },
      { name: `${PREFIX}kick @üye [gerekçe]`, desc: 'Kullanıcıyı sunucudan atar.' },
      { name: `${PREFIX}mute @üye [süre] [gerekçe]`, desc: 'Kullanıcıya geçici sohbet kısıtlaması uygular.' },
      { name: `${PREFIX}temizle [adet]`, desc: 'Kanalda belirtilen miktarda mesajı siler.' }
    ]
  },
  court: {
    title: '⚖️ Adalet & Mahkeme (Dava / Soruşturma)',
    description: 'Eko Yıldız Adalet Sistemi, mahkeme ve soruşturma süreçleri:',
    emoji: '⚖️',
    commands: [
      { name: `${PREFIX}dava-ac @sanık [madde] [gerekçe]`, desc: 'Savcılık makamına resmi dava dilekçesi verir.' },
      { name: `${PREFIX}sorusturma @şüpheli [neden]`, desc: 'Yetkili soruşturma odası açar ve baro avukatı atar.' },
      { name: `${PREFIX}adli-sicil @üye`, desc: 'Bir üyenin adli sicil dökümünü ve sabıka kaydını sorgular.' },
      { name: `${PREFIX}avukat-bul`, desc: 'Aktif baro avukatlarını listeler ve iletişim sağlar.' },
      { name: `${PREFIX}uzlaşma`, desc: 'Dava veya soruşturmada resmi uzlaşma protokolü teklif eder.' }
    ]
  },
  staff: {
    title: '🛡️ Personel & Yetkili Yönetimi',
    description: 'Personel nöbeti, denetim, KPI ve disiplin sistemleri:',
    emoji: '🛡️',
    commands: [
      { name: `${PREFIX}mod-anasayfa`, desc: 'Kişiselleştirilmiş personel ana kumanda panelini açar.' },
      { name: `${PREFIX}nobet`, desc: 'Aktif yetkili nöbetini başlatır veya bitirir.' },
      { name: `${PREFIX}personel-kpi @personel`, desc: 'Personel aktiflik, ticket ve performans skorunu gösterir.' },
      { name: `${PREFIX}staff-warn @personel [sebep]`, desc: 'Personel siciline disiplin uyarısı işler.' },
      { name: `${PREFIX}staff-commend @personel [sebep]`, desc: 'Personel siciline takdir/teşekkür belgesi işler.' }
    ]
  },
  economy: {
    title: '💰 Ekonomi, Banka & Mağaza',
    description: 'Para birimleri, yatırım fonu, borsa ve alışveriş işlemleri:',
    emoji: '💰',
    commands: [
      { name: `${PREFIX}bakiye [@üye]`, desc: 'Mevcut TL, Coin ve banka hesabınızı gösterir.' },
      { name: `${PREFIX}cuzdan`, desc: 'Kişisel finans cüzdanınızı ve varlıklarınızı görüntüler.' },
      { name: `${PREFIX}transfer @üye [miktar]`, desc: 'Başka bir üyeye güvenli para transferi yapar.' },
      { name: `${PREFIX}yatirim [miktar]`, desc: 'Eko Yıldız Yatırım Fonuna katılım sağlar.' },
      { name: `${PREFIX}magaza`, desc: 'Sunucu özel rol ve ayrıcalık mağazasını açar.' },
      { name: `${PREFIX}gunluk`, desc: 'Günlük ücretsiz coin ve ödül haklarınızı toplar.' }
    ]
  },
  ticket: {
    title: '🎫 Destek & Bilet Sistemleri',
    description: 'DM Ticket, Reklam İhbarı ve Oyuncu Destek Kanalları:',
    emoji: '🎫',
    commands: [
      { name: `${PREFIX}ticket`, desc: 'Destek talebi (Ticket) kategorisini ve menüsünü açar.' },
      { name: `${PREFIX}eposta-destek`, desc: 'Gelişmiş iki kanallı e-posta destek biletini başlatır.' },
      { name: `${PREFIX}reklam-talep`, desc: 'Sunucu içi reklam başvurusu ve onay odası açar.' }
    ]
  },
  general: {
    title: '⚙️ Genel & Kullanıcı Sistemleri',
    description: 'Profil, doğrulama, seviye ve genel bilgi komutları:',
    emoji: '⚙️',
    commands: [
      { name: `${PREFIX}yardım`, desc: 'Tüm komut kategorilerini ve kullanım rehberini açar.' },
      { name: `${PREFIX}profil [@üye]`, desc: 'Kişiselleştirilmiş kullanıcı kartını ve biyografisini gösterir.' },
      { name: `${PREFIX}seviye`, desc: 'Kurbağa/Dinazor seviye ve XP bilgilerinizi görüntüler.' },
      { name: `${PREFIX}dogrula`, desc: 'Roblox ve Discord hesap doğrulama sihirbazını başlatır.' },
      { name: `${PREFIX}kurallar`, desc: 'Sunucu anayasasını ve kurallarını okuyup onaylar.' },
      { name: `${PREFIX}ping`, desc: 'Bot ve veritabanı Gecikme (Latency) sürelerini ölçer.' }
    ]
  }
};

/**
 * Generates the main Help Embed and Select Menu
 */
function createHelpPayload(categoryKey = null) {
  const selectedCat = categoryKey && CATEGORIES[categoryKey] ? CATEGORIES[categoryKey] : null;

  const embed = new EmbedBuilder()
    .setTitle('🌐 SENTARA & EKO YILDIZ KOMUT KUTUPHANESİ')
    .setColor(0x7c6af7)
    .setDescription(
      `Merhaba! Tüm komutları **\`s!komut_ismi\`** veya **\`/\` Slash komutları** ile çalıştırabilirsiniz.\n\n` +
      `📌 **Prefix:** \`s!\` veya \`!\` (Örn: \`s!hapis\`, \`s!uyar\`, \`s!dava-ac\`)\n\n` +
      `👇 **Detaylı komut listesi için aşağıdaki menüden bir kategori seçin:**`
    )
    .setFooter({ text: 'Sentara AI • Gelişmiş Komut & Altyapı Servisi' })
    .setTimestamp();

  if (selectedCat) {
    embed.setTitle(`${selectedCat.emoji} ${selectedCat.title}`);
    let cmdText = `${selectedCat.description}\n\n`;
    selectedCat.commands.forEach(c => {
      cmdText += `> **\`${c.name}\`**\n> └ *${c.desc}*\n\n`;
    });
    embed.setDescription(cmdText);
  } else {
    // Show summary of all categories
    Object.keys(CATEGORIES).forEach(k => {
      const cat = CATEGORIES[k];
      embed.addFields({
        name: `${cat.emoji} ${cat.title}`,
        value: `\`${cat.commands.length} Komut\` • Örn: \`${cat.commands[0].name}\``,
        inline: true
      });
    });
  }

  // Select Menu for categories
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('s_help_category_select')
    .setPlaceholder('📂 Bir Komut Kategorisi Seçin...');

  Object.keys(CATEGORIES).forEach(k => {
    const cat = CATEGORIES[k];
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(cat.title)
        .setValue(k)
        .setDescription(cat.description.slice(0, 50))
        .setEmoji(cat.emoji)
        .setDefault(k === categoryKey)
    );
  });

  const row = new ActionRowBuilder().addComponents(selectMenu);
  return { embeds: [embed], components: [row] };
}

/**
 * Sends or replies with Help Payload
 */
async function sendHelpMenu(interactionOrMessage, categoryKey = null) {
  const payload = createHelpPayload(categoryKey);
  const isInteraction = Boolean(interactionOrMessage.isCommand || interactionOrMessage.isChatInputCommand || interactionOrMessage.isStringSelectMenu);

  if (isInteraction) {
    if (interactionOrMessage.replied || interactionOrMessage.deferred) {
      await interactionOrMessage.editReply(payload).catch(() => {});
    } else {
      await interactionOrMessage.reply({ ...payload, ephemeral: true }).catch(() => {});
    }
  } else if (interactionOrMessage.reply) {
    await interactionOrMessage.reply(payload).catch(async () => {
      if (interactionOrMessage.channel) {
        await interactionOrMessage.channel.send(payload).catch(() => {});
      }
    });
  } else if (interactionOrMessage.channel) {
    await interactionOrMessage.channel.send(payload).catch(() => {});
  }
}

module.exports = {
  CATEGORIES,
  createHelpPayload,
  sendHelpMenu
};
