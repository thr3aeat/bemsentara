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
      `Gönderinizi daha görünür kılmak, doğru kitleye ulaştırmak ve etkileşimleri artırmak için aşağıdaki menülerden konunuzun **kategorisini** ve **otomatik tepkilerini** seçebilirsiniz:`
    ),
    ComponentsV2Factory.separator(true),
    // Kategori Seçim Menüsü
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`robloxland_forum_category_${thread.id}`)
        .setPlaceholder("🏷️ Konunuzun kategorisini seçin...")
        .addOptions(
          FORUM_CATEGORIES.map(cat => ({
            label: cat.label,
            value: cat.value,
            description: cat.description,
            emoji: cat.emoji
          }))
        )
    ),
    // Tepki Seçim Menüsü
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`robloxland_forum_reaction_${thread.id}`)
        .setPlaceholder("⚡ Foruma eklenecek otomatik tepkileri seçin...")
        .addOptions(
          REACTION_PACKS.map(rp => ({
            label: rp.label,
            value: rp.value,
            description: rp.description
          }))
        )
    ),
    ComponentsV2Factory.separator(true),
    // Hızlı Aksiyon Butonları
    ComponentsV2Factory.actionRow([
      {
        style: ButtonStyle.Secondary,
        label: "✏️ Başlığı Yeniden Adlandır",
        custom_id: `robloxland_forum_rename_${thread.id}`,
        emoji: { name: "✏️" }
      },
      {
        style: ButtonStyle.Secondary,
        label: "🔒 Konuyu Kilitle",
        custom_id: `robloxland_forum_lock_${thread.id}`,
        emoji: { name: "🔒" }
      },
      {
        style: ButtonStyle.Danger,
        label: "🗑️ Konuyu Sil",
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
      // Mevcut başlıktan eski ön ekleri temizle
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

  // 2. Tepki Paketi Seçimi (StringSelectMenu)
  if (customId.startsWith('robloxland_forum_reaction_')) {
    const selectedVal = interaction.values?.[0];
    const reactionPack = REACTION_PACKS.find(r => r.value === selectedVal);
    if (!reactionPack) {
      return await interaction.reply({ content: '❌ Geçersiz tepki seçimi.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Başlangıç mesajını bul ve tepkileri ekle
      const starterMessage = (typeof thread.fetchStarterMessage === 'function')
        ? await thread.fetchStarterMessage().catch(() => null)
        : null;

      const targetMsg = starterMessage || (await thread.messages.fetch({ limit: 5 }).catch(() => null))?.first();

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

  // 3. Başlığı Yeniden Adlandır Butonu (Modal Açar)
  if (customId.startsWith('robloxland_forum_rename_')) {
    const modal = new ModalBuilder()
      .setCustomId(`robloxland_forum_modal_rename_${thread.id}`)
      .setTitle("✏️ Forum Konusu Başlığını Güncelle");

    const input = new TextInputBuilder()
      .setCustomId("new_title")
      .setLabel("Yeni Konu Başlığı")
      .setStyle(TextInputStyle.Short)
      .setValue(thread.name || "")
      .setMaxLength(100)
      .setMinLength(3)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return true;
  }

  // 4. Başlık Güncelleme Modal Submit
  if (customId.startsWith('robloxland_forum_modal_rename_')) {
    const newTitle = interaction.fields.getTextInputValue("new_title")?.trim();
    if (!newTitle) {
      return await interaction.reply({ content: "❌ Başlık boş bırakılamaz.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    await thread.setName(newTitle.slice(0, 100)).catch(() => {});
    await interaction.editReply({ content: `✅ Konu başlığı başarıyla güncellendi: **${newTitle}**` });
    return true;
  }

  // 5. Konuyu Kilitle Butonu
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

  // 6. Konuyu Sil Butonu
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

module.exports = {
  GUILD_ID,
  FORUM_CATEGORY_ID,
  FORUM_CATEGORIES,
  REACTION_PACKS,
  buildForumSetupPayload,
  handleThreadCreate,
  handleForumInteraction,
  isOwnerOrStaff
};
