'use strict';

const {
  ChannelType,
  PermissionFlagsBits,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');

// Hedef Sabitler
const GUILD_ID = '1537407325290237973';
const FORUM_CATEGORY_ID = '1538475901778530324'; // Forum Kanalları Kategorisi
const STAFF_ROLE_ID = '1537411928585015366';
const DESIGNATED_STAFF_ID = '1497600770634289194';

// Kategori Seçenekleri
const FORUM_CATEGORIES = [
  {
    label: "📢 Reklam & Tanıtım",
    value: "reklam",
    tagPrefix: "[📢 Reklam]",
    description: "Sunucu, grup, YouTube veya Discord tanıtımları",
    emoji: "📢"
  },
  {
    label: "🚀 Proje & Oyun Tanıtımı",
    value: "proje",
    tagPrefix: "[🚀 Proje]",
    description: "Roblox oyunları, mekanikler ve yapım aşamaları",
    emoji: "🚀"
  },
  {
    label: "👥 Arkadaş & Ekip Arama",
    value: "arkadas",
    tagPrefix: "[👥 Ekip Arama]",
    description: "Geliştirici ekibi, senarist veya oyun arkadaşı",
    emoji: "👥"
  },
  {
    label: "💡 Fikir & Tartışma",
    value: "fikir",
    tagPrefix: "[💡 Fikir]",
    description: "Görüş alışverişi, oyun fikirleri ve topluluk sohbeti",
    emoji: "💡"
  },
  {
    label: "🛠️ Destek & Soru-Cevap",
    value: "destek",
    tagPrefix: "[🛠️ Destek]",
    description: "Studio, Luau kodlama, bug çözümleri ve teknik yardım",
    emoji: "🛠️"
  },
  {
    label: "🎨 Tasarım & Modelleme",
    value: "tasarim",
    tagPrefix: "[🎨 Tasarım]",
    description: "Blender 3D, UI tasarımı, GFX ve çizim paylaşımları",
    emoji: "🎨"
  },
  {
    label: "💼 Ticaret & Komisyon",
    value: "ticaret",
    tagPrefix: "[💼 Ticaret]",
    description: "Asset satışı, iş ilanları ve komisyon hizmetleri",
    emoji: "💼"
  }
];

// Durum Rozetleri
const FORUM_STATUS_BADGES = [
  { label: "🟢 [Aktif / Açık]", value: "status_aktif", badge: "🟢 [Aktif]", description: "Konu aktif ve tartışmaya/etkileşime açık" },
  { label: "✅ [Çözüldü]", value: "status_cozuldu", badge: "✅ [Çözüldü]", description: "Soru cevaplandı veya sorun giderildi" },
  { label: "🏷️ [Satılık]", value: "status_satilik", badge: "🏷️ [Satılık]", description: "Ürün veya hizmet satışta" },
  { label: "🤝 [Alındı / Tamamlandı]", value: "status_tamamlandi", badge: "🤝 [Tamamlandı]", description: "İşlem veya ticaret başarıyla sonuçlandı" },
  { label: "👥 [Ekip Bulundu]", value: "status_ekip", badge: "👥 [Ekip Bulundu]", description: "Aranan ekip/arkadaş bulundu" },
  { label: "⛔ [Kapatıldı]", value: "status_kapatildi", badge: "⛔ [Kapatıldı]", description: "Konu kapandı ve işlem sonlandırıldı" }
];

// Yavaş Mod (Slowmode) Seçenekleri
const FORUM_SLOWMODE_OPTIONS = [
  { label: "⚡ Yavaş Mod Kapalı (0s)", value: "slow_0", seconds: 0, description: "Normal mesajlaşma hızı" },
  { label: "⏱️ 5 Saniye Yavaş Mod", value: "slow_5", seconds: 5, description: "Üye başına 5 saniye bekleme" },
  { label: "⏱️ 15 Saniye Yavaş Mod", value: "slow_15", seconds: 15, description: "Üye başına 15 saniye bekleme" },
  { label: "⏱️ 30 Saniye Yavaş Mod", value: "slow_30", seconds: 30, description: "Üye başına 30 saniye bekleme" },
  { label: "⏳ 1 Dakika Yavaş Mod", value: "slow_60", seconds: 60, description: "Üye başına 1 dakika bekleme" },
  { label: "⏳ 5 Dakika Yavaş Mod", value: "slow_300", seconds: 300, description: "Üye başına 5 dakika bekleme" }
];

// Tepki Paketleri
const REACTION_PACKS = [
  {
    label: "👍 Klasik Oylama (👍 - 👎)",
    value: "like_dislike",
    description: "Beğeni ve oylama tepkileri",
    emojis: ["👍", "👎"]
  },
  {
    label: "🔥 Alev & Sevgi (🔥 - ❤️)",
    value: "fire_heart",
    description: "Beğeni ve popülerlik tepkileri",
    emojis: ["🔥", "❤️"]
  },
  {
    label: "⭐ Yıldız Değerlendirmesi (⭐ - 🌟)",
    value: "star_quality",
    description: "Kalite ve yıldız puanlama",
    emojis: ["⭐", "🌟"]
  },
  {
    label: "🚀 Roket & Kutlama (🚀 - 🎉)",
    value: "rocket_celebrate",
    description: "Proje ve tanıtımlar için kutlama",
    emojis: ["🚀", "🎉"]
  },
  {
    label: "🤝 Ekip & Anlaşma (🤝 - 💬)",
    value: "handshake_chat",
    description: "İletişim ve ekip arama tepkileri",
    emojis: ["🤝", "💬"]
  }
];

/**
 * Yetkili veya Konu Sahibi Yetki Denetleyicisi
 */
function isOwnerOrStaff(member, ownerId) {
  if (!member) return false;
  if (member.id === ownerId || member.id === DESIGNATED_STAFF_ID) return true;

  const rolesList = member.roles?.cache
    ? (typeof member.roles.cache.some === 'function'
      ? member.roles.cache
      : Array.from(member.roles.cache.values ? member.roles.cache.values() : []))
    : [];

  return Boolean(
    (member.permissions?.has && (
      member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageChannels) ||
      member.permissions.has(PermissionFlagsBits.ManageThreads)
    )) ||
    (member.roles?.cache?.has && member.roles.cache.has(STAFF_ROLE_ID)) ||
    (Array.isArray(rolesList) ? rolesList.some(r => /yetkili|admin|mod|yönetici|sorumlu|kurucu/i.test(r?.name || '')) : (typeof rolesList.some === 'function' && rolesList.some(r => /yetkili|admin|mod|yönetici|sorumlu|kurucu/i.test(r?.name || ''))))
  );
}

/**
 * Forum Konusu Açıldığında Gönderilecek Components V2 Düzenleme Paneli
 */
function buildForumSetupPayload(thread, authorId) {
  const content = [
    ComponentsV2Factory.text(
      `# 📑 MERHABA! ROBLOXLND FORUMUNA HOŞ GELDİNİZ!\n\n` +
      `👋 Merhaba <@${authorId}>! Forum konunuz başarıyla oluşturuldu.\n\n` +
      `Konunuzu yönetmek, doğru kitleye ulaştırmak ve alt başlık ayarlarını özelleştirmek için aşağıdaki kontrol araçlarını kullanabilirsiniz:\n\n` +
      `• 🏷️ **Kategori & Durum:** Konunuzun konusunu ve durumunu ([Çözüldü], [Satılık] vb.) belirleyin.\n` +
      `• ⏱️ **Yavaş Mod (Slowmode):** Mesaj akış hızını kontrol altına alın.\n` +
      `• 🚪 **Üye Uzaklaştır:** Rahatsızlık veren kullanıcıları konunuzdan çıkarın.\n` +
      `• 📝 **Başlık & Alt Başlık:** Detaylı başlık ve slogan ekleyin.\n\n` +
      `-# 💡 *Düzenleme tamamlandığında "✅ Tamamla & Paneli Kapat" butonuna basabilirsiniz.*`
    ),
    ComponentsV2Factory.separator(true),
    // 1. Kategori Seçim Menüsü
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: `robloxland_forum_category_${thread.id}`,
          placeholder: "🏷️ 1. Konunuzun kategorisini seçin...",
          options: FORUM_CATEGORIES.map(cat => ({
            label: cat.label,
            value: cat.value,
            description: cat.description,
            emoji: { name: cat.emoji }
          }))
        }
      ]
    },
    // 2. Durum Rozeti Seçim Menüsü
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: `robloxland_forum_status_${thread.id}`,
          placeholder: "📌 2. Durum rozeti belirleyin ([Çözüldü], [Satılık] vb.)...",
          options: FORUM_STATUS_BADGES.map(sb => ({
            label: sb.label,
            value: sb.value,
            description: sb.description
          }))
        }
      ]
    },
    // 3. Yavaş Mod (Slowmode) Seçim Menüsü
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: `robloxland_forum_slowmode_${thread.id}`,
          placeholder: "⏱️ 3. Yavaş mod (slowmode) hızını belirleyin...",
          options: FORUM_SLOWMODE_OPTIONS.map(sm => ({
            label: sm.label,
            value: sm.value,
            description: sm.description
          }))
        }
      ]
    },
    // 4. Tepki Seçim Menüsü
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: `robloxland_forum_reaction_${thread.id}`,
          placeholder: "⚡ 4. Foruma eklenecek otomatik tepkileri seçin...",
          options: REACTION_PACKS.map(rp => ({
            label: rp.label,
            value: rp.value,
            description: rp.description
          }))
        }
      ]
    },
    ComponentsV2Factory.separator(true),
    // Hızlı Aksiyon Butonları
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Primary,
        label: "📝 Başlık & Alt Başlık",
        custom_id: `robloxland_forum_rename_${thread.id}`,
        emoji: { name: "✏️" }
      },
      {
        style: ButtonStyle.Danger,
        label: "🚪 Üye Uzaklaştır",
        custom_id: `robloxland_forum_kick_${thread.id}`,
        emoji: { name: "🚪" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🔒 Kilitle / Aç",
        custom_id: `robloxland_forum_lock_${thread.id}`,
        emoji: { name: "🔒" }
      },
      {
        style: ButtonStyle.Success,
        label: "✅ Tamamla & Kapat",
        custom_id: `robloxland_forum_finish_${thread.id}`,
        emoji: { name: "✨" }
      },
      {
        style: ButtonStyle.Danger,
        label: "🗑️ Sil",
        custom_id: `robloxland_forum_delete_${thread.id}`,
        emoji: { name: "🗑️" }
      }
    ])
  ];

  return ComponentsV2Factory.buildPayload(content);
}

/**
 * Thread Oluşturulduğunda Tetiklenen Olay Yöneticisi
 */
async function handleThreadCreate(thread, newlyCreated = true) {
  if (!thread || !thread.guild || thread.guild.id !== GUILD_ID) return false;

  // Hedef kategori kontrolü (1538475901778530324)
  const parentChannel = thread.parent || (thread.parentId ? await thread.guild.channels.fetch(thread.parentId).catch(() => null) : null);
  const isTargetCategory = parentChannel && (
    parentChannel.parentId === FORUM_CATEGORY_ID ||
    parentChannel.id === FORUM_CATEGORY_ID
  );

  if (!isTargetCategory) return false;

  try {
    const authorId = thread.ownerId || thread.authorId || thread.guild.ownerId;
    const payload = buildForumSetupPayload(thread, authorId);

    await thread.send(payload).catch(err => {
      console.warn(`[RobloxLandForum] Setup message send warning:`, err.message);
    });

    return true;
  } catch (err) {
    console.error(`[RobloxLandForum] handleThreadCreate error:`, err.message);
    return false;
  }
}

/**
 * Forum Etkileşimlerini Yönetir (Select Menu & Buttons)
 */
async function handleForumInteraction(interaction) {
  const customId = interaction.customId;
  if (!customId || !customId.startsWith('robloxland_forum_')) return false;

  const channel = interaction.channel;
  if (!channel || (!channel.isThread && typeof channel.isThread !== 'function')) return false;

  const thread = channel;
  const ownerId = thread.ownerId;

  // Yetki Kontrolü: Sadece konu sahibi veya sunucu yetkilisi düzenleyebilir
  if (!isOwnerOrStaff(interaction.member, ownerId)) {
    return await interaction.reply({
      content: '❌ Bu forum konusu ayarlarını yalnızca gönderi sahibi veya RobloxLand yetkilileri düzenleyebilir.',
      ephemeral: true
    });
  }

  // 1. Kategori Seçimi (StringSelectMenu)
  if (customId.startsWith('robloxland_forum_category_')) {
    const selectedVal = interaction.values?.[0];
    const categoryInfo = FORUM_CATEGORIES.find(c => c.value === selectedVal);
    if (!categoryInfo) {
      return await interaction.reply({ content: '❌ Geçersiz kategori seçimi.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      let cleanName = thread.name;
      for (const cat of FORUM_CATEGORIES) {
        cleanName = cleanName.replace(cat.tagPrefix, '').trim();
      }

      const newTitle = `${categoryInfo.tagPrefix} ${cleanName}`.slice(0, 100);
      await thread.setName(newTitle).catch(() => {});

      await interaction.editReply({
        content: `✅ Forum konunuzun kategorisi **${categoryInfo.label}** olarak güncellendi!\n• **Yeni Başlık:** \`${newTitle}\``
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Başlık güncellenirken hata oluştu: ${err.message}` });
    }
    return true;
  }

  // 2. Durum Rozeti Seçimi (StringSelectMenu)
  if (customId.startsWith('robloxland_forum_status_')) {
    const selectedVal = interaction.values?.[0];
    const statusInfo = FORUM_STATUS_BADGES.find(s => s.value === selectedVal);
    if (!statusInfo) {
      return await interaction.reply({ content: '❌ Geçersiz durum rozeti.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      let currentTitle = thread.name;
      // Eski durum rozetlerini temizle
      for (const sb of FORUM_STATUS_BADGES) {
        currentTitle = currentTitle.replace(` [${sb.badge}]`, '').replace(sb.badge, '').trim();
      }

      const newTitle = `${currentTitle} ${statusInfo.badge}`.slice(0, 100);
      await thread.setName(newTitle).catch(() => {});

      await interaction.editReply({
        content: `✅ Forum konunuzun durumu **${statusInfo.label}** olarak güncellendi!\n• **Yeni Başlık:** \`${newTitle}\``
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Durum rozeti güncellenirken hata: ${err.message}` });
    }
    return true;
  }

  // 3. Yavaş Mod (Slowmode) Seçimi
  if (customId.startsWith('robloxland_forum_slowmode_')) {
    const selectedVal = interaction.values?.[0];
    const slowmodeInfo = FORUM_SLOWMODE_OPTIONS.find(s => s.value === selectedVal);
    if (!slowmodeInfo) {
      return await interaction.reply({ content: '❌ Geçersiz yavaş mod seçeneği.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      if (typeof thread.setRateLimitPerUser === 'function') {
        await thread.setRateLimitPerUser(slowmodeInfo.seconds, 'Forum konu sahibi slowmode ayarı').catch(() => {});
      }
      await interaction.editReply({
        content: `⏱️ Forum konunuzun yavaş modu **${slowmodeInfo.label}** olarak ayarlandı!`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Yavaş mod ayarlanırken hata: ${err.message}` });
    }
    return true;
  }

  // 4. Tepki Paketi Seçimi (StringSelectMenu)
  if (customId.startsWith('robloxland_forum_reaction_')) {
    const selectedVal = interaction.values?.[0];
    const reactionPack = REACTION_PACKS.find(r => r.value === selectedVal);
    if (!reactionPack) {
      return await interaction.reply({ content: '❌ Geçersiz tepki seçimi.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const starterMessage = (typeof thread.fetchStarterMessage === 'function')
        ? await thread.fetchStarterMessage().catch(() => null)
        : null;

      const targetMsg = starterMessage || (await thread.messages?.fetch({ limit: 5 }).catch(() => null))?.first?.();

      if (targetMsg) {
        for (const emoji of reactionPack.emojis) {
          await targetMsg.react(emoji).catch(() => {});
        }
      }

      await interaction.editReply({
        content: `✅ Forum konunuza **${reactionPack.label}** tepkileri otomatik olarak eklendi! (${reactionPack.emojis.join(' ')})`
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Tepki eklenirken hata oluştu: ${err.message}` });
    }
    return true;
  }

  // 5. Başlık & Alt Başlık Düzenleme Modalı Aç
  if (customId.startsWith('robloxland_forum_rename_')) {
    const modal = new ModalBuilder()
      .setCustomId(`robloxland_forum_modal_rename_${thread.id}`)
      .setTitle("📝 Başlık & Alt Başlık Düzenleyici");

    let cleanName = thread.name || "";
    for (const cat of FORUM_CATEGORIES) {
      cleanName = cleanName.replace(cat.tagPrefix, '').trim();
    }
    for (const sb of FORUM_STATUS_BADGES) {
      cleanName = cleanName.replace(` [${sb.badge}]`, '').replace(sb.badge, '').trim();
    }

    const mainTitleInput = new TextInputBuilder()
      .setCustomId("main_title")
      .setLabel("Ana Konu Başlığı")
      .setStyle(TextInputStyle.Short)
      .setValue(cleanName)
      .setMaxLength(65)
      .setMinLength(3)
      .setRequired(true);

    const subTitleInput = new TextInputBuilder()
      .setCustomId("sub_title")
      .setLabel("Alt Başlık / Slogan / Detay (İsteğe Bağlı)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Örn: [Ekip Aranıyor] • 100K+ Ziyaret / Satılık")
      .setMaxLength(30)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(mainTitleInput),
      new ActionRowBuilder().addComponents(subTitleInput)
    );

    await interaction.showModal(modal);
    return true;
  }

  // 6. Başlık & Alt Başlık Modal Gönderimi ve Otomatik Mesaj Temizleme
  if (customId.startsWith('robloxland_forum_modal_rename_')) {
    const mainTitle = interaction.fields.getTextInputValue("main_title")?.trim();
    const subTitle = interaction.fields.getTextInputValue("sub_title")?.trim();

    if (!mainTitle) {
      return await interaction.reply({ content: "❌ Ana başlık boş bırakılamaz.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    // Mevcut kategori ön ekini ve durum rozetini koru
    let currentCategoryPrefix = "";
    for (const cat of FORUM_CATEGORIES) {
      if (thread.name.startsWith(cat.tagPrefix)) {
        currentCategoryPrefix = cat.tagPrefix + " ";
        break;
      }
    }

    let currentBadge = "";
    for (const sb of FORUM_STATUS_BADGES) {
      if (thread.name.includes(sb.badge)) {
        currentBadge = ` ${sb.badge}`;
        break;
      }
    }

    let finalTitle = `${currentCategoryPrefix}${mainTitle}`;
    if (subTitle) {
      finalTitle += ` — ${subTitle}`;
    }
    finalTitle += currentBadge;
    finalTitle = finalTitle.slice(0, 100);

    await thread.setName(finalTitle).catch(() => {});

    await interaction.editReply({
      content: `✅ **Forum Başlığı ve Alt Başlığı Güncellendi!**\n• **Yeni Başlık:** \`${finalTitle}\`\n\n🧹 *Kurulum paneli mesajı temizleniyor...*`
    });

    // Otomatik olarak kurulum paneli mesajını sil
    setTimeout(async () => {
      try {
        if (interaction.message && typeof interaction.message.delete === 'function') {
          await interaction.message.delete().catch(() => {});
        } else if (thread.messages?.fetch) {
          const msgs = await thread.messages.fetch({ limit: 10 }).catch(() => null);
          const botSetupMsg = msgs?.find(m => m.author.id === interaction.client.user?.id && m.components?.length > 0);
          if (botSetupMsg) await botSetupMsg.delete().catch(() => {});
        }
      } catch (_) {}
    }, 3000);

    return true;
  }

  // 7. "Üye Uzaklaştır" Modalı Aç
  if (customId.startsWith('robloxland_forum_kick_')) {
    const modal = new ModalBuilder()
      .setCustomId(`robloxland_forum_modal_kick_${thread.id}`)
      .setTitle("🚪 Konudan Üye Uzaklaştır");

    const targetInput = new TextInputBuilder()
      .setCustomId("target_user")
      .setLabel("Uzaklaştırılacak Üye ID veya @Kullanıcı")
      .setPlaceholder("Örn: 123456789012345678 veya @kullanici")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(50)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId("kick_reason")
      .setLabel("Uzaklaştırma Gerekçesi (İsteğe Bağlı)")
      .setPlaceholder("Örn: Konu dışı spam / rahatsız edici davranış")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(200)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(targetInput),
      new ActionRowBuilder().addComponents(reasonInput)
    );

    await interaction.showModal(modal);
    return true;
  }

  // 8. "Üye Uzaklaştır" Modalı Gönderildiğinde
  if (customId.startsWith('robloxland_forum_modal_kick_')) {
    const rawTarget = interaction.fields.getTextInputValue("target_user")?.trim();
    const reason = interaction.fields.getTextInputValue("kick_reason")?.trim() || "Belirtilmedi";
    const cleanUserId = rawTarget?.replace(/[^0-9]/g, '');

    if (!cleanUserId || cleanUserId.length < 16) {
      return await interaction.reply({
        content: '❌ Geçersiz kullanıcı ID/etiket belirttiniz. Lütfen geçerli bir Discord ID giriniz.',
        ephemeral: true
      });
    }

    if (cleanUserId === ownerId) {
      return await interaction.reply({
        content: '❌ Konu sahibi konudan uzaklaştırılamaz!',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      if (thread.members && typeof thread.members.remove === 'function') {
        await thread.members.remove(cleanUserId, `Forum konusu sahibi tarafından uzaklaştırıldı: ${reason}`).catch(() => {});
      }

      // Konu içine bilgilendirme mesajı gönder
      if (typeof thread.send === 'function') {
        await thread.send({
          content: `🚪 <@${cleanUserId}> adlı kullanıcı, konu sahibi <@${interaction.user?.id || ownerId}> tarafından bu forum konusundan uzaklaştırıldı.\n> **Gerekçe:** ${reason}`
        }).catch(() => {});
      }

      // Uzaklaştırılan üyeye DM gönder
      try {
        if (interaction.client?.users?.fetch) {
          const kickedUser = await interaction.client.users.fetch(cleanUserId).catch(() => null);
          if (kickedUser) {
            await kickedUser.send({
              content: `ℹ️ **${thread.name}** adlı forum konusundan konu sahibi tarafından uzaklaştırıldınız.\n• **Gerekçe:** ${reason}`
            }).catch(() => {});
          }
        }
      } catch (_) {}

      await interaction.editReply({
        content: `✅ <@${cleanUserId}> adlı kullanıcı başarıyla forum konusundan uzaklaştırıldı!`
      });
    } catch (err) {
      await interaction.editReply({
        content: `❌ Üye uzaklaştırılırken hata oluştu: ${err.message}`
      });
    }
    return true;
  }

  // 9. "Tamamla & Paneli Kapat" Butonu (Mesajı Otomatik Siler)
  if (customId.startsWith('robloxland_forum_finish_')) {
    await interaction.reply({
      content: '✨ **Forum düzenlemeniz tamamlandı!** Kurulum paneli 2 saniye içinde kaldırılacaktır.',
      ephemeral: true
    });

    setTimeout(async () => {
      try {
        if (interaction.message && typeof interaction.message.delete === 'function') {
          await interaction.message.delete().catch(() => {});
        } else if (thread.messages?.fetch) {
          const msgs = await thread.messages.fetch({ limit: 10 }).catch(() => null);
          const botSetupMsg = msgs?.find(m => m.author.id === interaction.client.user?.id && m.components?.length > 0);
          if (botSetupMsg) await botSetupMsg.delete().catch(() => {});
        }
      } catch (_) {}
    }, 2000);

    return true;
  }

  // 10. Konuyu Kilitle Butonu
  if (customId.startsWith('robloxland_forum_lock_')) {
    await interaction.deferReply({ ephemeral: true });
    const isLocked = thread.locked;
    await thread.setLocked(!isLocked).catch(() => {});

    await thread.send({
      content: !isLocked
        ? `🔒 **Bu forum konusu <@${interaction.user.id}> tarafından kilitlendi.** Yeni mesaj gönderilemez.`
        : `🔓 **Bu forum konusunun kilidi <@${interaction.user.id}> tarafından açıldı.**`
    }).catch(() => {});

    await interaction.editReply({
      content: !isLocked ? '🔒 Konu başarıyla kilitlendi.' : '🔓 Konu kilidi açıldı.'
    });
    return true;
  }

  // 11. Konuyu Sil Butonu
  if (customId.startsWith('robloxland_forum_delete_')) {
    await interaction.reply({
      content: '🗑️ Forum konusu 3 saniye içinde silinecektir...',
      ephemeral: true
    });

    setTimeout(async () => {
      await thread.delete('Forum konusu sahibi/yetkili tarafından silindi').catch(() => {});
    }, 3000);
    return true;
  }

  return false;
}

function initForumService(client) {
  if (client && !client.__robloxLandForumAttached) {
    client.__robloxLandForumAttached = true;
    client.on('threadCreate', async (thread, newlyCreated) => {
      try {
        await handleThreadCreate(thread, newlyCreated);
      } catch (err) {
        console.error('[threadCreate] RobloxLand Forum error:', err.message);
      }
    });
  }
}

module.exports = {
  GUILD_ID,
  FORUM_CATEGORY_ID,
  FORUM_CATEGORIES,
  FORUM_STATUS_BADGES,
  FORUM_SLOWMODE_OPTIONS,
  REACTION_PACKS,
  initForumService,
  buildForumSetupPayload,
  handleThreadCreate,
  handleForumInteraction,
  isOwnerOrStaff
};
