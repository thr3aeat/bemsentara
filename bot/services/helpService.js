'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
  ButtonBuilder
} = require('discord.js');

const PREFIX = 'e!';

const CATEGORIES = {
  owner_system: {
    title: '👑 Kurucu & Sistem Yönetimi',
    description: 'Eko Yıldız sunucu sahibi ve üst düzey sistem yönetim komutları:',
    emoji: '👑',
    minRole: 'owner',
    commands: [
      { name: `${PREFIX}sistemler / ${PREFIX}durum`, desc: 'DuckDNS, Render ve altyapı servislerinin canlı durumunu gösterir.' },
      { name: `${PREFIX}botbilgi`, desc: 'Bot uptime, RAM, Node.js sürümü ve sistem kaynaklarını gösterir.' },
      { name: `${PREFIX}topluluk-elcisi`, desc: 'Topluluk elçiliği ve personel ayın elemanları panelini tetikler.' },
      { name: `${PREFIX}sayim`, desc: 'Tüm yetkililer için anlık aktiflik yoklaması başlatır.' },
      { name: `${PREFIX}odulver @üye [miktar]`, desc: 'Kullanıcıya veya personele özel ödül / bakiye tanımlar.' },
      { name: `${PREFIX}birimalimi`, desc: 'Resmi birim başvuru ve alım sürecini yönetir.' },
      { name: `${PREFIX}birimterfi @üye [kademe]`, desc: 'Birim personeline rütbe terfisi verir.' },
      { name: `${PREFIX}birimistifa @üye`, desc: 'Birim personeli istifa işlemini onaylar.' },
      { name: `${PREFIX}personelkov @üye [sebep]`, desc: 'Personeli yetkili kadrosundan çıkarır.' },
      { name: `${PREFIX}modcheck @üye`, desc: 'Moderatör 2 günlük otomatik DM denetimini açar/kapatır.' },
      { name: `${PREFIX}abusetest`, desc: 'Yetki kötüye kullanım algılayıcısını test eder.' },
      { name: `${PREFIX}sunucukur`, desc: 'Gelişmiş sunucu şablonu ve kanal düzeni kurar.' },
      { name: `${PREFIX}komut [aç/kapat] [komut]`, desc: 'Kanalda belirli komutları devre dışı bırakır veya açar.' }
    ]
  },
  moderation: {
    title: '👮 Moderasyon & Güvenlik',
    description: 'Sunucu güvenliği, ceza infaz ve disiplin mekanizması komutları:',
    emoji: '👮',
    minRole: 'moderator',
    commands: [
      { name: `${PREFIX}ban @üye [gerekçe]`, desc: 'Kullanıcıyı sunucudan kalıcı olarak yasaklar.' },
      { name: `${PREFIX}forceban [ID] [gerekçe]`, desc: 'Sunucuda olmayan kullanıcıyı ID ile yasaklar.' },
      { name: `${PREFIX}unban [ID]`, desc: 'Yasaklı kullanıcının banını kaldırır.' },
      { name: `${PREFIX}kick @üye [gerekçe]`, desc: 'Kullanıcıyı sunucudan atar.' },
      { name: `${PREFIX}sustur / ${PREFIX}mute @üye [süre] [gerekçe]`, desc: 'Kullanıcıya geçici zamanaşımı (mute) uygular.' },
      { name: `${PREFIX}unmute @üye`, desc: 'Kullanıcının susturmasını kaldırır.' },
      { name: `${PREFIX}uyarı / ${PREFIX}uyar @üye [gerekçe]`, desc: 'Üyeye resmi disiplin uyarısı işler.' },
      { name: `${PREFIX}uyarılar / ${PREFIX}sicil @üye`, desc: 'Kullanıcının ceza ve uyarı geçmişini listeler.' },
      { name: `${PREFIX}uyarısil @üye [indeks]`, desc: 'Üyenin aktif uyarısını siler ve sicilini düzeltir.' },
      { name: `${PREFIX}hapis @üye [dk] [gerekçe]`, desc: 'Üyeyi #kodos hapishanesine gönderir.' },
      { name: `${PREFIX}unkodos @üye`, desc: 'Hapisteki üyeyi tahliye eder ve rollerini geri verir.' },
      { name: `${PREFIX}temizle / ${PREFIX}sil [adet]`, desc: 'Kanalda belirtilen miktarda mesajı toplu siler.' },
      { name: `${PREFIX}lock / ${PREFIX}kilitle`, desc: 'Kanalı üyelere mesaj yazımına kapatır.' },
      { name: `${PREFIX}unlock / ${PREFIX}kilit-aç`, desc: 'Kanalın mesaj yazım kilidini açar.' },
      { name: `${PREFIX}slowmode / ${PREFIX}yavaşmod [saniye]`, desc: 'Kanala yavaş mod süresi ayarlar.' },
      { name: `${PREFIX}kanalaçıklama [yeni_konu]`, desc: 'Kanalın konusunu/açıklamasını günceller.' },
      { name: `${PREFIX}rol @üye [rol_adı]`, desc: 'Belirtilen kullanıcıya rol verir veya alır.' },
      { name: `${PREFIX}rololuştur [rol_adı] [renk]`, desc: 'Sunucuda yeni bir rol oluşturur.' },
      { name: `${PREFIX}takmaad / ${PREFIX}nick @üye [isim]`, desc: 'Kullanıcının sunucu içi ismini değiştirir.' },
      { name: `${PREFIX}herkesetagver [TAG]`, desc: 'Sunucudaki herkesin isminin başına tag ekler.' },
      { name: `${PREFIX}toplutagal [TAG]`, desc: 'Sunucudaki herkesten belirtilen tagı siler.' },
      { name: `${PREFIX}emojiekle [link] [isim]`, desc: 'Sunucuya görsel linkinden emoji yükler.' },
      { name: `${PREFIX}sesli`, desc: 'Ses kanallarındaki toplam üye sayısını gösterir.' },
      { name: `${PREFIX}oylama [soru]`, desc: 'Kanalda şık ve tepkili resmi oylama başlatır.' },
      { name: `${PREFIX}say`, desc: 'Sunucudaki anlık üye, ses ve aktiflik istatistiğini sayar.' }
    ]
  },
  staff: {
    title: '🛡️ Personel, Nöbet & Sicil',
    description: 'Personel nöbeti, denetim, KPI ve disiplin sistemleri:',
    emoji: '🛡️',
    minRole: 'moderator',
    commands: [
      { name: `${PREFIX}mod-anasayfa`, desc: 'Kişiselleştirilmiş personel ana kumanda panelini açar.' },
      { name: `${PREFIX}nobet`, desc: 'Aktif yetkili nöbetini başlatır veya bitirir.' },
      { name: `${PREFIX}personel-kpi @personel`, desc: 'Personel aktiflik, ticket ve performans skorunu gösterir.' },
      { name: `${PREFIX}staff-warn @personel [sebep]`, desc: 'Personel siciline disiplin uyarısı işler.' },
      { name: `${PREFIX}staff-commend @personel [sebep]`, desc: 'Personel siciline takdir/teşekkür belgesi işler.' },
      { name: `${PREFIX}staff-sicil @personel`, desc: 'Personelin sicil ve terfi geçmişini döker.' },
      { name: `${PREFIX}birimtanitim`, desc: 'Sunucudaki tüm resmi birimlerin tanıtım kartını basar.' },
      { name: `${PREFIX}birim-gorevleri`, desc: 'Günlük birim görev ağacını ve puan tablosunu listeler.' }
    ]
  },
  court: {
    title: '⚖️ Adalet & Mahkeme (Dava / Soruşturma)',
    description: 'Eko Yıldız Adalet Sistemi, mahkeme ve soruşturma süreçleri:',
    emoji: '⚖️',
    minRole: 'moderator',
    commands: [
      { name: `${PREFIX}dava-ac @sanık [madde] [gerekçe]`, desc: 'Savcılık makamına resmi dava dilekçesi verir.' },
      { name: `${PREFIX}sorusturma @şüpheli [neden]`, desc: 'Yetkili soruşturma odası açar ve baro avukatı atar.' },
      { name: `${PREFIX}adli-sicil / ${PREFIX}sabika-kaydi @üye`, desc: 'Bir üyenin adli sicil dökümünü ve sabıka kaydını sorgular.' },
      { name: `${PREFIX}yasa-kitabi`, desc: 'Sunucu Ceza Kanun Maddelerini listeler.' },
      { name: `${PREFIX}kodos-tahliye @üye`, desc: 'Hapishane kefaletini öder veya tahliye eder.' },
      { name: `${PREFIX}avukat-bul`, desc: 'Aktif baro avukatlarını listeler ve iletişim sağlar.' },
      { name: `${PREFIX}uzlaşma`, desc: 'Dava veya soruşturmada resmi uzlaşma protokolü teklif eder.' }
    ]
  },
  fun: {
    title: '🎉 Eğlence, Oyunlar & Sosyal',
    description: 'Eko Yıldız eğlence, oyun, aşk ölçer ve nostalji komutları:',
    emoji: '🎉',
    minRole: 'user',
    commands: [
      { name: `${PREFIX}kaçcm [@üye]`, desc: 'Rastgele malafat / performans analizi, dayanıklılık ve düello sistemi.' },
      { name: `${PREFIX}tarihtebugun / ${PREFIX}tarih`, desc: 'Günün Atatürk ve dünya tarihi olaylarını yapay zeka ile listeler.' },
      { name: `${PREFIX}aşkölçer @üye`, desc: 'Etiketlenen kişiyle aşk uyum yüzdesini ve fantezisini ölçer.' },
      { name: `${PREFIX}azgınlıkölçer [@üye]`, desc: 'Etiketlenen kişinin azgınlık ve enerji seviyesini ölçer.' },
      { name: `${PREFIX}1vs1 / ${PREFIX}düello @üye`, desc: 'Etiketlenen üyeyle refleks ve şans düellosuna girer.' },
      { name: `${PREFIX}slot [miktar]`, desc: 'Kumarhanede şans slotu çevirir ve ödül kazanır.' },
      { name: `${PREFIX}rulet [renk/sayı]`, desc: 'Rus ruleti ve masa ruleti simülasyonu.' },
      { name: `${PREFIX}balıktut`, desc: 'Göl veya denize olta atarak nadir ve efsanevi balıklar tutar.' },
      { name: `${PREFIX}mayıntarlası`, desc: 'Discord üzerinde interaktif mayın tarlası oyunu başlatır.' },
      { name: `${PREFIX}adamasmaca`, desc: 'Kelime tahmin etme ve adam asmaca oyunu oynatır.' },
      { name: `${PREFIX}dogrulukcesaret / ${PREFIX}dc`, desc: 'Doğruluk mu Cesaret mi oyunu başlatır.' },
      { name: `${PREFIX}yazıtura`, desc: 'Şans parası fırlatır (Yazı mı Tura mı?).' },
      { name: `${PREFIX}zar`, desc: '1 ile 6 arasında rastgele zar atar.' },
      { name: `${PREFIX}atatürk`, desc: 'Gazi Mustafa Kemal Atatürk hakkında ilham verici tarihi anekdot ve fotoğraflar sunar.' },
      { name: `${PREFIX}gününbilgisi`, desc: 'Bilim, teknoloji ve genel kültür alanından ilginç bilgi paylaşır.' },
      { name: `${PREFIX}fıkra / ${PREFIX}espri`, desc: 'Gülümseten fıkra ve soğuk/komik espriler anlatır.' },
      { name: `${PREFIX}iltifat / ${PREFIX}övgü @üye`, desc: 'Etiketlenen kişiye tatlı ve samimi bir iltifat gönderir.' },
      { name: `${PREFIX}kapaklaf @üye`, desc: 'Etiketlenen kişiye efsane bir kapak söz fırlatır.' },
      { name: `${PREFIX}yönelim / ${PREFIX}tercih`, desc: 'Cinsel yöneliminizi (Hetero, Eşcinsel, Biseksüel, Pan, Aseksüel vb.) belirler ve eğlence komutlarını ilgi alanınıza göre özelleştirir.' },
      { name: `${PREFIX}fantezi`, desc: 'Cinsel yöneliminize özel kişiselleştirilmiş fantezi senaryosu üretir.' },
      { name: `${PREFIX}cinseluyum @üye`, desc: 'Etiketlediğiniz kişiyle tensel ve cinsel uyumunuzu analiz eder.' },
      { name: `${PREFIX}sarıl / ${PREFIX}öp / ${PREFIX}şaplak @üye`, desc: 'Sosyal sevgi ve eğlenceli etkileşim komutları.' }
    ]
  },
  economy: {
    title: '💰 Ekonomi, Banka & Puan',
    description: 'Para birimleri, yatırım fonu, borsa ve alışveriş işlemleri:',
    emoji: '💰',
    minRole: 'user',
    commands: [
      { name: `${PREFIX}günlükpuan / ${PREFIX}daily`, desc: 'Günlük ücretsiz puanınızı toplar.' },
      { name: `${PREFIX}bakiye [@üye]`, desc: 'Mevcut TL, Coin ve banka hesabınızı gösterir.' },
      { name: `${PREFIX}cuzdan`, desc: 'Kişisel finans cüzdanınızı ve varlıklarınızı görüntüler.' },
      { name: `${PREFIX}transfer @üye [miktar]`, desc: 'Başka bir üyeye güvenli para transferi yapar.' },
      { name: `${PREFIX}yatirim [miktar]`, desc: 'Eko Yıldız Yatırım Fonuna katılım sağlar.' },
      { name: `${PREFIX}magaza`, desc: 'Sunucu özel rol ve ayrıcalık mağazasını açar.' }
    ]
  },
  general: {
    title: '⚙️ Genel, Kullanıcı & Araçlar',
    description: 'Profil, doğrulama, seviye, hesap ve genel bilgi komutları:',
    emoji: '⚙️',
    minRole: 'user',
    commands: [
      { name: `${PREFIX}yardım / ${PREFIX}help`, desc: 'Tüm komut kategorilerini ve yetkinize özel kullanım rehberini açar.' },
      { name: `${PREFIX}rank / ${PREFIX}seviye [@üye]`, desc: 'Seviye, XP ve mesaj istatistik kartınızı görüntüler.' },
      { name: `${PREFIX}leaderboard / ${PREFIX}top`, desc: 'Sunucu seviye, XP ve mesaj sıralamasını listeler.' },
      { name: `${PREFIX}avatar [@üye]`, desc: 'Kullanıcının profil fotoğrafını yüksek çözünürlükte gösterir.' },
      { name: `${PREFIX}kullanıcıbilgi / ${PREFIX}userinfo [@üye]`, desc: 'Kullanıcının kuruluş tarihi, rolleri ve sunucu bilgilerini döker.' },
      { name: `${PREFIX}kurucukim`, desc: 'Sunucunun kurucusunu ve sahip bilgilerini söyler.' },
      { name: `${PREFIX}sunucubilgi`, desc: 'Sunucunun detaylı üye, kanal, boost ve istatistik raporu.' },
      { name: `${PREFIX}emojiler`, desc: 'Sunucuda bulunan tüm özel emojileri listeler.' },
      { name: `${PREFIX}hesapla [işlem]`, desc: 'Matematiksel işlemleri anında çözer (Örn: `e!hesapla 25*4+10`).' },
      { name: `${PREFIX}minecraft / ${PREFIX}mc [oyuncu]`, desc: 'Minecraft oyuncu skini ve profil bilgilerini getirir.' },
      { name: `${PREFIX}afk [sebep]`, desc: 'AFK moduna geçer ve etiketlendiğinizde bilgi verir.' },
      { name: `${PREFIX}ping`, desc: 'Bot ve Discord WebSocket anlık gecikme sürelerini ölçer.' },
      { name: `${PREFIX}dogrula`, desc: 'Roblox ve Discord hesap doğrulama sihirbazını başlatır.' },
      { name: `${PREFIX}kurallar`, desc: 'Sunucu anayasasını ve kurallarını okuyup onaylar.' },
      { name: `${PREFIX}ticket`, desc: 'Destek talebi (Ticket) kategorisini ve menüsünü açar.' }
    ]
  }
};

/**
 * Kullanıcının yetki düzeyini belirler ('owner' | 'moderator' | 'user')
 */
function getUserPermissionLevel(member, user) {
  const userId = user?.id || member?.id;
  const isOwner = userId === "1031620522406072350" || member?.guild?.ownerId === userId;
  const isAdmin = isOwner || (member?.permissions && member.permissions.has("Administrator"));

  if (isOwner || isAdmin) return 'owner';

  let hasModRole = false;
  if (member?.roles?.cache) {
    if (typeof member.roles.cache.some === 'function') {
      hasModRole = member.roles.cache.some(r => /mod|yetkili|staff|yönetim|rehber|kıdemli|admin/i.test(r?.name || ''));
    } else {
      for (const r of member.roles.cache.values()) {
        if (/mod|yetkili|staff|yönetim|rehber|kıdemli|admin/i.test(r?.name || '')) {
          hasModRole = true;
          break;
        }
      }
    }
  }

  const isMod = member && (
    member.permissions?.has?.("ManageMessages") ||
    member.permissions?.has?.("KickMembers") ||
    member.permissions?.has?.("BanMembers") ||
    member.permissions?.has?.("ModerateMembers") ||
    hasModRole
  );

  if (isMod) return 'moderator';
  return 'user';
}

/**
 * Verilen yetki seviyesine uygun kategori listesini döndürür.
 */
function getAccessibleCategoryKeys(roleLevel) {
  if (roleLevel === 'owner') {
    return ['owner_system', 'moderation', 'staff', 'court', 'fun', 'economy', 'general'];
  }
  if (roleLevel === 'moderator') {
    return ['moderation', 'staff', 'court', 'fun', 'economy', 'general'];
  }
  return ['fun', 'economy', 'general'];
}

/**
 * Rol seviyesine özel rozet ve başlık bilgisi
 */
function getRoleBadge(roleLevel) {
  if (roleLevel === 'owner') return { badge: '👑 Sunucu Sahibi / Üst Düzey Yönetici', color: 0xf59e0b };
  if (roleLevel === 'moderator') return { badge: '👮 Eko Yıldız Yetkili / Moderatör', color: 0x3b82f6 };
  return { badge: '👤 Eko Yıldız Topluluk Üyesi', color: 0x10b981 };
}

/**
 * Role ve kategoriye göre Yardım Embed ve Select Menu oluşturur.
 */
function createRoleBasedHelpPayload(member, user, categoryKey = null) {
  const roleLevel = getUserPermissionLevel(member, user);
  const accessibleKeys = getAccessibleCategoryKeys(roleLevel);
  const roleBadge = getRoleBadge(roleLevel);

  const selectedCat = categoryKey && CATEGORIES[categoryKey] && accessibleKeys.includes(categoryKey)
    ? CATEGORIES[categoryKey]
    : null;

  const embed = new EmbedBuilder()
    .setColor(roleBadge.color)
    .setFooter({ text: 'Eko Yıldız 7/24 Bot Motoru • Yetkiye Özel Komut Sistemi' })
    .setTimestamp();

  if (selectedCat) {
    embed.setTitle(`${selectedCat.emoji} ${selectedCat.title} (${roleBadge.badge})`);
    let cmdText = `${selectedCat.description}\n\n`;
    selectedCat.commands.forEach(c => {
      cmdText += `> **\`${c.name}\`**\n> └ *${c.desc}*\n\n`;
    });

    if (cmdText.length > 4000) {
      cmdText = cmdText.substring(0, 3990) + '\n\n*(Devamı için kategoriyi daraltın)*';
    }
    embed.setDescription(cmdText);
  } else {
    embed.setTitle(`🌟 EKO YILDIZ KOMUT MERKEZİ`);
    embed.setDescription(
      `Merhaba <@${user?.id || member?.id}>! Sunucu yetkiniz: **${roleBadge.badge}**\n\n` +
      `📌 **Komut Prefixleri:** \`e!\` veya \`s!\` (Örn: \`e!kaçcm\`, \`e!tarihtebugun\`, \`e!sistemler\`, \`e!yardım\`)\n\n` +
      `👇 **Kullanabileceğiniz Komut Kategorileri (Aşağıdaki menüden kategori seçin):**`
    );

    accessibleKeys.forEach(k => {
      const cat = CATEGORIES[k];
      if (cat) {
        const cmdPills = cat.commands.slice(0, 5).map(c => `\`${c.name.split(' ')[0]}\``).join(' ');
        embed.addFields({
          name: cat.title,
          value: `${cmdPills}${cat.commands.length > 5 ? ` *+${cat.commands.length - 5} daha*` : ''}`,
          inline: false
        });
      }
    });
  }

  // Select Menu for categories
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`s_help_role_select_${user?.id || member?.id}`)
    .setPlaceholder('📂 Bir Komut Kategorisi Seçin...');

  accessibleKeys.forEach(k => {
    const cat = CATEGORIES[k];
    if (cat) {
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(cat.title)
          .setValue(k)
          .setDescription(cat.description.slice(0, 50))
          .setEmoji(cat.emoji)
          .setDefault(k === categoryKey)
      );
    }
  });

  const row = new ActionRowBuilder().addComponents(selectMenu);
  return { embeds: [embed], components: [row] };
}

/**
 * İki string arasındaki Levenshtein benzerliğini hesaplar
 */
function levenshteinDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Girilen komut adını kütüphanedeki en yakın komutla eşleştirir
 */
function findClosestCommand(rawInput, commandsMap) {
  if (!rawInput) return null;
  const clean = rawInput.toLowerCase().trim();
  let bestMatch = null;
  let minDistance = 999;

  for (const [key, cmd] of commandsMap.entries()) {
    if (!cmd || !cmd.name) continue;
    const dist = levenshteinDistance(clean, cmd.name.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = cmd;
    }
    if (cmd.aliases) {
      for (const al of cmd.aliases) {
        const alDist = levenshteinDistance(clean, al.toLowerCase());
        if (alDist < minDistance) {
          minDistance = alDist;
          bestMatch = cmd;
        }
      }
    }
  }

  return minDistance <= 4 ? bestMatch : null;
}

/**
 * "Aradığınız komut bu mu?" interaktif öneri embed ve butonlarını üretir
 */
function createCommandSuggestionPayload(member, user, typedCmd, suggestedCmd = null) {
  const userId = user?.id || member?.id;
  const roleLevel = getUserPermissionLevel(member, user);
  const roleBadge = getRoleBadge(roleLevel);

  const targetCmd = suggestedCmd || {
    name: 'yardım',
    description: 'Tüm komut rehberini ve yetkinize uygun komut listesini açar.'
  };

  const isExplicitQuery = !!typedCmd && typedCmd.trim().length > 0;

  const embed = new EmbedBuilder()
    .setTitle(`🔍 Aradığınız Komut Bu mu?`)
    .setColor(0x7c6af7)
    .setDescription(
      isExplicitQuery
        ? `Girdiğiniz **\`e!${typedCmd}\`** komutu bulunamadı.\n\n` +
          `💡 **En Yakın Önerilen Komut:** \`e!${targetCmd.name}\`\n` +
          `📝 **Açıklama:** *${targetCmd.description || 'Komut açıklaması'}*\n\n` +
          `Yetkiniz: **${roleBadge.badge}**\n\n` +
          `Lütfen aşağıdaki butonlarla seçiminizi yapın:`
        : `Merhaba <@${userId}>! **e!** (veya **s!**) komut ön ekini yazdınız.\n\n` +
          `💡 **Popüler / Önerilen Komut:** \`e!${targetCmd.name}\`\n` +
          `📝 **Açıklama:** *${targetCmd.description}*\n\n` +
          `Yetkiniz: **${roleBadge.badge}**\n\n` +
          `Aşağıdaki butonları kullanarak doğrudan komutu çalıştırabilir veya tüm komutlarınızı görüntüleyebilirsiniz:`
    )
    .setFooter({ text: 'Eko Yıldız Akıllı Komut Arama & Öneri Motoru' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cmd_suggest_run_${userId}_${targetCmd.name}`)
      .setLabel(`✅ Evet, aradığım bu (e!${targetCmd.name})`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`cmd_suggest_all_${userId}`)
      .setLabel('❌ Hayır, aradığım bu değil (Tüm Komutlar)')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`cmd_suggest_run_${userId}_kaçcm`)
      .setLabel('🎲 e!kaçcm')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`cmd_suggest_run_${userId}_tarihtebugun`)
      .setLabel('📅 e!tarihtebugun')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

/**
 * Sends or replies with Help Payload
 */
async function sendHelpMenu(interactionOrMessage, categoryKey = null) {
  const member = interactionOrMessage.member;
  const user = interactionOrMessage.author || interactionOrMessage.user;
  const payload = createRoleBasedHelpPayload(member, user, categoryKey);
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
  getUserPermissionLevel,
  getAccessibleCategoryKeys,
  getRoleBadge,
  createRoleBasedHelpPayload,
  findClosestCommand,
  createCommandSuggestionPayload,
  sendHelpMenu
};
