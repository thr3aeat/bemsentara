'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder
} = require('discord.js');
const OfficialWarning = require('../../models/OfficialWarning');
const { BASE_URL } = require('../../config');
const { ROLES } = require('./staffSystem');

const FOUNDER_ID = '1031620522406072350'; // Eko (Kurucu)
const MODERATION_ROLE_ID = '1518692386836971610';
const DEFAULT_CATEGORY_ID = '1523809020115419147';

/**
 * Builds the official 3-page document embed for a warning case
 */
function buildOfficialWarningPage(warning, page = 1) {
  const safePage = Math.max(1, Math.min(3, page));
  const embed = new EmbedBuilder()
    .setColor(safePage === 3 ? 0x27ae60 : 0xc0392b)
    .setFooter({ 
      text: `EkoYıldız Mahkemesi & Disiplin Kurulu • Dosya: ${warning.caseNo} • Sayfa ${safePage}/3` 
    })
    .setTimestamp();

  if (safePage === 1) {
    embed
      .setTitle(`⚖️ RESMİ UYARI TUTANAĞI --- EKOYILDIZ MAHKEMESİ -- ${warning.caseNo}`)
      .setDescription(
        `### 📄 SAYFA 1/3: DİSİPLİN TESPİT TUTANAĞI & İHLAL GEREKÇESİ\n\n` +
        `İşbu tutanak, **EkoYıldız Yüksek Mahkemesi ve Disiplin Kurulu** huzurunda tanzim edilmiş olup yürütme ve tebligat hükümleri taşımaktadır.\n\n` +
        `**👤 Soruşturulan Şahıs:** <@${warning.targetUserId}> (\`${warning.targetUserId}\`)\n` +
        `**🛡️ Soruşturmayı Açan Yetkili:** <@${warning.creatorId}>\n` +
        `**👑 Yüksek Denetçi / Kurucu:** <@${FOUNDER_ID}>\n` +
        `**📅 Dosya Tanzim Tarihi:** <t:${Math.floor(new Date(warning.createdAt || Date.now()).getTime() / 1000)}:F>\n\n` +
        `---\n` +
        `📌 **İHLAL GEREKÇESİ VE İDDİANAME:**\n` +
        `> *"**${warning.reason}**"*\n\n` +
        `📖 **İHLAL EDİLEN NİZAM MADDESİ:**\n` +
        `> \`${warning.ruleArticle || 'Madde 14 - Topluluk Huzuru ve Disiplin Hükümleri'}\`\n\n` +
        (warning.customNotes ? `📝 **Yetkili Ek Notu / Açıklama:**\n> ${warning.customNotes}\n\n` : '') +
        `ℹ️ *Hukuki yaptırımlar ve müeyyideleri incelemek için aşağıdaki **"Sonraki Sayfa ➡️"** butonuna tıklayınız.*`
      );
  } else if (safePage === 2) {
    embed
      .setTitle(`⚖️ RESMİ UYARI TUTANAĞI --- EKOYILDIZ MAHKEMESİ -- ${warning.caseNo}`)
      .setDescription(
        `### ⚖️ SAYFA 2/3: HUKUKİ YAPTIRIMLAR VE MÜEYYİDELER\n\n` +
        `Aşağıda yer alan cezai hükümler, kural ihlalinin devamı veya benzeri bir nizam ihlalinin tekrarı halinde **herhangi bir ek duruşma veya savunma gerekmeksizin** re'sen ve derhal infaz edilecektir:\n\n` +
        `**1. KALICI VE DERHAL UZAKLAŞTIRMA (PERMANENT BAN):**\n` +
        `> Sunucudan, Discord topluluklarından ve EkoYıldız'a bağlı tüm platformlardan süresiz olarak uzaklaştırılırsınız.\n\n` +
        `**2. SİCİL İŞLENMESİ & KARA LİSTE (BLACKLIST):**\n` +
        `> Hesabınız kalıcı olarak sabıkalı statüsüne alınır, hiçbir rol, yetki veya rütbe talebinde bulunamazsınız.\n\n` +
        `**3. EKONOMİ VE KAZANIMLARIN FESHİ:**\n` +
        `> Sahip olduğunuz oyun içi, ekonomi veya rütbe ayrıcalıkları tek taraflı olarak geri alınır ve sıfırlanır.\n\n` +
        `**4. HUKUKİ VE İDARİ İHTAR:**\n` +
        `> Bu belge nihai resmi uyarı belgesidir. İkinci bir uyarı yapılmayacaktır.\n\n` +
        `ℹ️ *Taahhütnameyi okuyup dijital e-imzanızı atmak için **"Sonraki Sayfa ➡️"** butonuna basınız.*`
      );
  } else if (safePage === 3) {
    const isSigned = warning.status === 'SIGNED';
    const signUrl = `${BASE_URL}/resmi-uyari-imza/${warning.signToken}`;

    embed
      .setTitle(`⚖️ RESMİ UYARI TUTANAĞI --- EKOYILDIZ MAHKEMESİ -- ${warning.caseNo}`)
      .setDescription(
        `### ✍️ SAYFA 3/3: RESMİ TAAHHÜTNAME & E-İMZA MÜHÜRÜ\n\n` +
        `Aşağıdaki yasal taahhüt metnini dikkatle okuyunuz:\n\n` +
        `> *"Ben, <@${warning.targetUserId}>, hakkımda düzenlenen **${warning.caseNo}** nolu Resmi Uyarı Tutanağını, ` +
        `gerekçelerini ve ihlalin tekrarı durumunda uygulanacak tüm yaptırımları okudum, anladım. ` +
        `EkoYıldız kurallarına ve nizamına koşulsuz uyacağımı, belirtilen ihlali bir daha asla tekrarlamayacağımı ` +
        `kabul, beyan ve taahhüt ederim."*\n\n` +
        `---\n` +
        (isSigned
          ? `✅ **DURUM: RESMİ E-İMZA İLE ONAYLANDI VE MÜHÜRLENDİ!**\n` +
            `📅 **İmza Tarihi:** <t:${Math.floor(new Date(warning.signedAt).getTime() / 1000)}:F>\n` +
            `Dosya karara bağlanmış ve arşive kaydedilmiştir.`
          : `⚠️ **İMZA GEREKLİLİĞİ:**\n` +
            `Resmi uyarının tamamlanması ve dosyanın yürürlüğe girmesi için aşağıdaki **"✍️ Web Üzerinden E-İmza At"** ` +
            `butonuna tıklayarak açılan sayfada farenizle (mouse) veya dokunmatik ekranınızla dijital imzanızı atmanız zorunludur.\n\n` +
            `🔗 **İmza Bağlantınız (Kişiye Özel):** [E-İmza Sayfasına Git](${signUrl})\n` +
            `⏱️ *Bağlantı tek kullanımlıktır ve sürelidir.*`)
      );

    if (isSigned && warning.signatureImage) {
      embed.setImage('attachment://imza.png');
    }
  }

  return embed;
}

/**
 * Builds navigation ActionRow for 3-page document
 */
function buildPageControls(warning, currentPage = 1) {
  const row = new ActionRowBuilder();

  // Prev Button
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`official_warn_page_${warning._id}_${currentPage - 1}`)
      .setLabel('◀️ Önceki Sayfa')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage <= 1)
  );

  // Next Button
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`official_warn_page_${warning._id}_${currentPage + 1}`)
      .setLabel('▶️ Sonraki Sayfa')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= 3)
  );

  // If on Page 3 and not signed, add e-signature button
  if (currentPage === 3 && warning.status !== 'SIGNED') {
    const signUrl = `${BASE_URL}/resmi-uyari-imza/${warning.signToken}`;
    row.addComponents(
      new ButtonBuilder()
        .setLabel('✍️ Web Üzerinden E-İmza At')
        .setStyle(ButtonStyle.Link)
        .setURL(signUrl)
    );
  }

  return row;
}

/**
 * Creates an official warning meeting channel, notifies target user and founder
 */
async function createOfficialWarningMeeting({
  client,
  interaction,
  targetUserId,
  reason,
  ruleArticle,
  customNotes
}) {
  const guild = interaction.guild;
  if (!guild) {
    return interaction.editReply({ content: '❌ Sunucu bilgisine ulaşılamadı.' });
  }

  // Generate Case Number
  const caseNo = await OfficialWarning.generateCaseNo();

  // Try to find target member
  const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
  const targetUser = targetMember ? targetMember.user : await client.users.fetch(targetUserId).catch(() => null);

  if (!targetUser) {
    return interaction.editReply({ 
      content: `❌ \`${targetUserId}\` ID'sine sahip Discord kullanıcısı bulunamadı.` 
    });
  }

  // Determine Category
  let categoryId = DEFAULT_CATEGORY_ID;
  const existingCategory = guild.channels.cache.get(categoryId) 
    || guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('soruşturma'));
  if (existingCategory) {
    categoryId = existingCategory.id;
  } else if (interaction.channel && interaction.channel.parentId) {
    categoryId = interaction.channel.parentId;
  }

  // Build Channel Permissions
  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    // Founder Eko
    {
      id: FOUNDER_ID,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles
      ]
    },
    // Creator Staff Member
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    },
    // Moderation Role
    {
      id: MODERATION_ROLE_ID,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    },
    // Bot Client
    {
      id: client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles
      ]
    }
  ];

  // Target User Permission in channel
  if (targetMember) {
    permissionOverwrites.push({
      id: targetUserId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    });
  }

  // Add all other active staff roles if present
  const staffRoleIds = Object.values(ROLES).filter(Boolean);
  for (const roleId of staffRoleIds) {
    if (roleId !== MODERATION_ROLE_ID && guild.roles.cache.has(roleId)) {
      permissionOverwrites.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    }
  }

  // Channel Name: e.g. ⚖️・resmi-uyarı-06546
  const cleanDigits = caseNo.replace(/[^0-9]/g, '');
  const channelName = `⚖️・resmi-uyarı-${cleanDigits}`;

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId,
    topic: `EkoYıldız Mahkemesi Resmi Uyarı Toplantısı | Dosya: ${caseNo} | Sanık: ${targetUser.username} (${targetUserId})`,
    permissionOverwrites
  }).catch(err => {
    console.error('[officialWarningService] Channel creation error:', err.message);
    return null;
  });

  if (!channel) {
    return interaction.editReply({ content: '❌ Resmi uyarı kanalı oluşturulamadı. Lütfen bot yetkilerini kontrol edin.' });
  }

  // Create Warning Record in MongoDB
  const warning = await OfficialWarning.create({
    caseNo,
    channelId: channel.id,
    guildId: guild.id,
    targetUserId,
    creatorId: interaction.user.id,
    founderId: FOUNDER_ID,
    assignedStaffIds: [interaction.user.id],
    reason,
    ruleArticle: ruleArticle || 'Madde 14 - Topluluk Huzuru ve Disiplin Hükümleri',
    customNotes: customNotes || '',
    status: 'PENDING_ACCEPTANCE',
    currentPage: 1
  });

  // Formal First Embed (Court Room Hearing Announcement)
  const initialEmbed = new EmbedBuilder()
    .setTitle(`⚖️ RESMİ UYARI --- EKOYILDIZ MAHKEMESİ -- ${caseNo}`)
    .setColor(0xc0392b)
    .setDescription(
      `Sayın <@${targetUserId}>,\n\n` +
      `**"${reason}"** nedeni ile **EkoYıldız Yüksek Mahkemesi ve Disiplin Kurulu** tarafından **RESMİ UYARIYA** çarptırıldınız.\n\n` +
      `İşbu işlem doğrudan sicilinize işlenmiş olup **nihai ihtar** niteliğindedir.\n\n` +
      `---\n` +
      `📌 **SORUŞTURMA VE MAHKEME DETAYLARI:**\n` +
      `• **Dosya Numarası:** \`${caseNo}\`\n` +
      `• **İlgili Kural Maddesi:** \`${warning.ruleArticle}\`\n` +
      `• **Soruşturmayı Açan Yetkili:** <@${interaction.user.id}>\n` +
      `• **Yüksek Denetçi / Kurucu:** <@${FOUNDER_ID}>\n\n` +
      `⚠️ **İHLALİN TEKRARI HALİNDE UYGULANACAK YAPTIRIMLAR:**\n` +
      `1. Sunucudan derhal ve kalıcı olarak **UZAKLAŞTIRILIRSINIZ** (Süresiz Ban).\n` +
      `2. Tüm yetki, rütbe ve kazanımlarınız iptal edilir, EkoYıldız **KARA LİSTESİNE (Blacklist)** alınırsınız.\n` +
      `3. EkoYıldız ekosistemindeki tüm sunucu ve iştiraklerden süresiz men edilirsiniz.\n\n` +
      `❓ **TAAHHÜT VE KABUL ŞARTI:**\n` +
      `Bu eylemi ve benzeri kural ihlallerini bir daha asla tekrarlamayacağınızı, sunucu kurallarına tam riayet edeceğinizi kabul ve taahhüt ediyor musunuz?\n\n` +
      `*Aşağıdaki butona basarak şartları kabul edebilir ve 3 sayfalık resmi uyarı belgesini inceleyebilirsiniz.*`
    )
    .setFooter({ text: `EkoYıldız Mahkemesi • Dosya: ${caseNo}` })
    .setTimestamp();

  const initialRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`official_warn_accept_${warning._id}`)
      .setLabel('✅ ŞARTLARI & TAAHHÜTÜ KABUL ET')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`official_warn_reject_${warning._id}`)
      .setLabel('❌ REDDET')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`official_warn_close_${warning._id}`)
      .setLabel('🔒 Dosyayı Kapat')
      .setStyle(ButtonStyle.Secondary)
  );

  // Send to channel
  await channel.send({
    content: `📢 <@${targetUserId}> <@${FOUNDER_ID}> <@${interaction.user.id}> **EKOYILDIZ RESMİ DİSİPLİN MAHKEMESİ TOPLANDI**`,
    embeds: [initialEmbed],
    components: [initialRow]
  });

  // Send DM to target user with official summon
  let dmSent = false;
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle(`⚖️ RESMİ UYARI --- EKOYILDIZ MAHKEMESİ -- ${caseNo}`)
      .setColor(0xc0392b)
      .setDescription(
        `Sayın <@${targetUserId}>,\n\n` +
        `**EkoYıldız** bünyesinde **"${reason}"** gerekçesiyle hakkınızda **RESMİ UYARI TOPLANTISI** başlatılmıştır.\n\n` +
        `📁 **Dosya No:** \`${caseNo}\`\n` +
        `🏛️ **Duruşma Kanalı:** ${channel.toString()}\n\n` +
        `⚠️ **YAPTIRIM İHTARI:**\n` +
        `1. İhlalin tekrarında sunucudan derhal **UZAKLAŞTIRILIRSINIZ** (Kalıcı Ban).\n` +
        `2. EkoYıldız Kara Listesine alınırsınız.\n\n` +
        `👉 Duruşmaya katılmak, taahhütü kabul edip 3 sayfalık resmi uyarı belgesini incelemek için aşağıdaki butona tıklayınız:`
      )
      .setTimestamp();

    const dmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`official_warn_accept_${warning._id}`)
        .setLabel('✅ TAAHHÜTÜ KABUL ET VE İLERLE')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setLabel('🏛️ Duruşma Kanalına Git')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${guild.id}/${channel.id}`)
    );

    await targetUser.send({ embeds: [dmEmbed], components: [dmRow] });
    dmSent = true;
  } catch (err) {
    console.warn(`[officialWarningService] Could not send DM to target user ${targetUserId}:`, err.message);
  }

  const replyMsg = `✅ **Resmi Uyarı Toplantısı Başarıyla Oluşturuldu!**\n` +
    `📁 **Dosya No:** \`${caseNo}\`\n` +
    `🏛️ **Kanal:** ${channel.toString()}\n` +
    `📩 **DM Bildirimi:** ${dmSent ? 'Kullanıcıya başarıyla iletildi.' : '⚠️ Kullanıcının DM kutusu kapalı, kanaldan etiketlendi.'}\n` +
    `👑 **Kurucu Bildirimi:** <@${FOUNDER_ID}> kanala eklendi.`;

  return interaction.editReply({ content: replyMsg });
}

/**
 * Handles target user clicking Accept button
 */
async function handleOfficialWarningAccept(interaction, warningId) {
  const warning = await OfficialWarning.findById(warningId);
  if (!warning) {
    return interaction.reply({ content: '❌ Resmi uyarı dosyası bulunamadı.', ephemeral: true });
  }

  // Only target user or authorized staff may accept
  const isTarget = interaction.user.id === warning.targetUserId;
  const isStaff = interaction.user.id === warning.creatorId || interaction.user.id === FOUNDER_ID;
  if (!isTarget && !isStaff) {
    return interaction.reply({ 
      content: '❌ Bu taahhütü yalnızca soruşturulan kullanıcı veya yetkili onaylayabilir.', 
      ephemeral: true 
    });
  }

  if (warning.status === 'PENDING_ACCEPTANCE') {
    warning.status = 'PAGE_REVIEW';
    warning.currentPage = 1;
    await warning.save();
  }

  const embed = buildOfficialWarningPage(warning, 1);
  const controls = buildPageControls(warning, 1);

  if (interaction.isButton()) {
    // If inside DM, update DM
    if (!interaction.guild) {
      await interaction.update({ embeds: [embed], components: [controls] }).catch(() => {});
      return;
    }

    // Inside channel
    await interaction.update({ embeds: [embed], components: [controls] }).catch(() => {});

    // Notify channel
    await interaction.channel.send({
      content: `✅ <@${interaction.user.id}> resmi taahhütü kabul etti. 3 sayfalık resmi uyarı belgesi açıldı.`
    }).catch(() => {});
  }
}

/**
 * Handles Page Navigation (1, 2, 3)
 */
async function handleOfficialWarningPage(interaction, warningId, page) {
  const warning = await OfficialWarning.findById(warningId);
  if (!warning) {
    return interaction.reply({ content: '❌ Resmi uyarı dosyası bulunamadı.', ephemeral: true });
  }

  const targetPage = Math.max(1, Math.min(3, parseInt(page, 10) || 1));
  warning.currentPage = targetPage;
  if (warning.status === 'PENDING_ACCEPTANCE') {
    warning.status = 'PAGE_REVIEW';
  }
  await warning.save();

  const embed = buildOfficialWarningPage(warning, targetPage);
  const controls = buildPageControls(warning, targetPage);

  await interaction.update({ embeds: [embed], components: [controls] }).catch(() => {});
}

/**
 * Handles target user clicking Reject button
 */
async function handleOfficialWarningReject(interaction, warningId) {
  const warning = await OfficialWarning.findById(warningId);
  if (!warning) {
    return interaction.reply({ content: '❌ Resmi uyarı dosyası bulunamadı.', ephemeral: true });
  }

  if (interaction.user.id !== warning.targetUserId && interaction.user.id !== warning.creatorId) {
    return interaction.reply({ content: '❌ Bu işlemi sadece soruşturulan kişi yapabilir.', ephemeral: true });
  }

  const rejectEmbed = new EmbedBuilder()
    .setTitle(`⚠️ RESMİ UYARIYI REDDETMEK YASAKTIR! -- ${warning.caseNo}`)
    .setColor(0xe74c3c)
    .setDescription(
      `Sayın <@${warning.targetUserId}>,\n\n` +
      `**EkoYıldız Mahkemesi ve Disiplin Kurulu** tarafından tebliğ edilen resmi uyarıyı reddetme hakkınız bulunmamaktadır.\n\n` +
      `Şartları ve taahhütü reddetmeniz halinde, **"1. Sunucudan Kalıcı Olarak Uzaklaştırılma"** hükmü derhal yürürlüğe girecektir.\n\n` +
      `Lütfen aşağıdaki butona basarak şartları kabul ediniz ve belgenizi imzalayınız.`
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`official_warn_accept_${warning._id}`)
      .setLabel('✅ TAAHHÜTÜ KABUL ET VE İLERLE')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`official_warn_close_${warning._id}`)
      .setLabel('🔒 Dosyayı Kapat')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [rejectEmbed], components: [row] }).catch(() => {});

  if (interaction.channel) {
    await interaction.channel.send(`⚠️ <@${warning.targetUserId}> resmi uyarı taahhütünü reddetmeye çalıştı. İhtar iletildi.`);
  }
}

/**
 * Closes the official warning meeting channel
 */
async function handleOfficialWarningClose(interaction, warningId) {
  const warning = await OfficialWarning.findById(warningId);
  if (warning) {
    warning.status = 'CLOSED';
    warning.syncEnabled = false;
    await warning.save();
  }

  await interaction.reply({ content: '🔒 Resmi uyarı dosyası kapatıldı. Kanal 5 saniye içerisinde silinecektir...' });

  setTimeout(() => {
    interaction.channel.delete().catch(err => {
      console.error('[officialWarningService] Channel delete error:', err.message);
    });
  }, 5000);
}

/**
 * Called when user signs via the web portal
 */
async function handleOfficialWarningSigned({ client, warning, signatureBuffer, signerIp, signerUserAgent }) {
  try {
    warning.status = 'SIGNED';
    warning.signedAt = new Date();
    warning.signerIp = signerIp;
    warning.signerUserAgent = signerUserAgent;
    await warning.save();

    const channel = await client.channels.fetch(warning.channelId).catch(() => null);
    const attachment = new AttachmentBuilder(signatureBuffer, { name: 'imza.png' });

    const sealedEmbed = new EmbedBuilder()
      .setTitle(`⚖️ RESMİ UYARI TUTANAĞI DİJİTAL OLARAK İMZALANDI VE MÜHÜRLENDİ!`)
      .setColor(0x27ae60)
      .setDescription(
        `### 🏛️ EKOYILDIZ YÜKSEK MAHKEMESİ VE DİSİPLİN KURULU\n\n` +
        `**Dosya Numarası:** \`${warning.caseNo}\`\n` +
        `**İmzacı / Sanık:** <@${warning.targetUserId}> (\`${warning.targetUserId}\`)\n` +
        `**Soruşturmayı Açan:** <@${warning.creatorId}>\n` +
        `**Yüksek Denetçi / Kurucu:** <@${FOUNDER_ID}>\n` +
        `**İmza Zamanı:** <t:${Math.floor(Date.now() / 1000)}:F>\n` +
        `**Hukuki Durum:** 🟢 **YÜRÜRLÜĞE GİRDİ (RESMEN ONAYLANDI VE MÜHÜRLENDİ)**\n\n` +
        `---\n` +
        `📌 **KESİNLEŞEN TAAHHÜT:**\n` +
        `Kullanıcı, belirtilen kural ihlalini bir daha asla tekrarlamayacağını, sunucu nizamına riayet edeceğini ` +
        `ve tekrarı halinde **derhal ve kalıcı olarak uzaklaştırılacağını (Ban)** dijital ıslak e-imzası ile kabul etmiştir.\n\n` +
        `🖋️ **Aşağıda kullanıcının web portalından çizerek attığı resmi dijital ıslak imzası yer almaktadır:**`
      )
      .setImage('attachment://imza.png')
      .setFooter({ text: `EkoYıldız Resmi Karar Sicil Arşivi • Dosya: ${warning.caseNo}` })
      .setTimestamp();

    const archiveRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`official_warn_close_${warning._id}`)
        .setLabel('📁 Dosyayı Arşivle ve Kapat')
        .setStyle(ButtonStyle.Secondary)
    );

    if (channel) {
      await channel.send({
        content: `🚨 <@${warning.targetUserId}> <@${warning.creatorId}> <@${FOUNDER_ID}> **RESMİ UYARI BELGESİ BAŞARIYLA İMZALANDI VE SİCİLE İŞLENDİ!**`,
        embeds: [sealedEmbed],
        files: [attachment],
        components: [archiveRow]
      });
    }

    // DM to target user
    const targetUser = await client.users.fetch(warning.targetUserId).catch(() => null);
    if (targetUser) {
      const userDmEmbed = new EmbedBuilder()
        .setTitle(`⚖️ RESMİ UYARI BELGENİZ ONAYLANDI VE MÜHÜRLENDİ -- ${warning.caseNo}`)
        .setColor(0x27ae60)
        .setDescription(
          `Sayın <@${warning.targetUserId}>,\n\n` +
          `EkoYıldız Web Portalı üzerinden atmış olduğunuz e-imza başarıyla doğrulanmış ve **${warning.caseNo}** nolu resmi tutanağa mühürlenmiştir.\n\n` +
          `Taahhütünüz gereği kurallara uyduğunuz sürece ek bir yaptırım uygulanmayacaktır. ` +
          `Ancak ihlalin tekrarı durumunda **kalıcı olarak uzaklaştırılacağınızı** unutmayınız.\n\n` +
          `İyi forumlar ve adil bir topluluk dileriz.`
        )
        .setImage('attachment://imza.png')
        .setTimestamp();

      await targetUser.send({ embeds: [userDmEmbed], files: [attachment] }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('[officialWarningService] handleOfficialWarningSigned error:', err);
    return false;
  }
}

/**
 * Message synchronization between user DM and channel
 */
async function handleWarningMessageSync(client, message) {
  if (message.author.bot) return;

  // 1) DM to Channel
  if (!message.guild) {
    const warning = await OfficialWarning.findOne({
      targetUserId: message.author.id,
      status: { $in: ['PENDING_ACCEPTANCE', 'PAGE_REVIEW', 'AWAITING_SIGNATURE'] },
      syncEnabled: true
    }).sort({ createdAt: -1 });

    if (warning) {
      const channel = await client.channels.fetch(warning.channelId).catch(() => null);
      if (channel) {
        warning.messages.push({
          senderId: message.author.id,
          senderName: message.author.username,
          content: message.content
        });
        await warning.save();

        const syncEmbed = new EmbedBuilder()
          .setAuthor({ name: `${message.author.username} (DM İfadesi)`, iconURL: message.author.displayAvatarURL() })
          .setDescription(message.content || '*Görsel veya ek içerik iletildi*')
          .setColor(0x3498db)
          .setFooter({ text: `Resmi Uyarı Dosyası: ${warning.caseNo}` })
          .setTimestamp();

        if (message.attachments.size > 0) {
          syncEmbed.setImage(message.attachments.first().url);
        }

        await channel.send({ embeds: [syncEmbed] });
      }
    }
    return;
  }

  // 2) Channel to DM
  const channelWarning = await OfficialWarning.findOne({
    channelId: message.channel.id,
    status: { $in: ['PENDING_ACCEPTANCE', 'PAGE_REVIEW', 'AWAITING_SIGNATURE'] },
    syncEnabled: true
  });

  if (channelWarning) {
    channelWarning.messages.push({
      senderId: message.author.id,
      senderName: message.author.username,
      content: message.content
    });
    await channelWarning.save();

    const targetUser = await client.users.fetch(channelWarning.targetUserId).catch(() => null);
    if (targetUser) {
      const isFounder = message.author.id === FOUNDER_ID;
      const roleLabel = isFounder ? '👑 Kurucu Eko' : '⚖️ Mahkeme Yetkilisi';
      const syncEmbed = new EmbedBuilder()
        .setAuthor({ name: `${roleLabel} - ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setDescription(message.content || '*Görsel veya dosya eklendi*')
        .setColor(0x9b59b6)
        .setFooter({ text: `Resmi Uyarı Toplantısı: ${channelWarning.caseNo}` })
        .setTimestamp();

      if (message.attachments.size > 0) {
        syncEmbed.setImage(message.attachments.first().url);
      }

      await targetUser.send({ embeds: [syncEmbed] }).catch(() => {});
    }
  }
}

module.exports = {
  FOUNDER_ID,
  MODERATION_ROLE_ID,
  DEFAULT_CATEGORY_ID,
  createOfficialWarningMeeting,
  handleOfficialWarningAccept,
  handleOfficialWarningPage,
  handleOfficialWarningReject,
  handleOfficialWarningClose,
  handleOfficialWarningSigned,
  handleWarningMessageSync,
  buildOfficialWarningPage,
  buildPageControls
};
