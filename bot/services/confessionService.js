'use strict';

const {
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ChannelType
} = require('discord.js');
const ComponentsV2Factory = require('../utils/componentsV2Factory');
const {
  Confession,
  ConfessionSession,
  ConfessionBlacklist,
  ConfessionBlock
} = require('../../models/Confession');
const logger = require('../../utils/logger');

// Sunucu ve Kanal Sabitleri
const GUILD_ID = '1367646464804655104';
const CONFESSION_PANEL_CHANNEL_ID = '1542910032306380971'; // İtiraf oluşturma paneli
const CONFESSION_FEED_CHANNEL_ID  = '1542910080138092564'; // İtiraflar akış kanalı
const CONFESSION_MOD_CHANNEL_ID   = '1518693023934844959'; // Moderasyon / Onay / Log kanalı

// Anonim Takma Ad Üreteci
const ANONYMOUS_ADJECTIVES = [
  'Gölge', 'Gece', 'Maskeli', 'Gizemli', 'Sessiz', 'Kayıp', 'Görünmez',
  'Kozmik', 'Yıldız', 'Fırtına', 'Karanlık', 'Puslu', 'Sırdaş', 'Gezgin',
  'Şafak', 'Hayalet', 'Efsanevi', 'Kutup', 'Ayaz', 'Kızıl'
];
const ANONYMOUS_NOUNS = [
  'Dedektif', 'Yolcu', 'Filozof', 'Kartal', 'Gözlemci', 'Kurt', 'Şövalye',
  'Casus', 'Ruh', 'Savaşçı', 'Avcı', 'Gardiyan', 'Yazar', 'Misafir', 'Yankı',
  'Kuzgun', 'Gölge', 'Piyade', 'Rüzgar', 'Kaptan'
];
const ANONYMOUS_EMOJIS = ['🕵️', '🎭', '🌙', '🌌', '⚡', '🦅', '🐺', '🗡️', '🔮', '🛡️', '🕯️', '🕊️', '🍁'];

function generateAnonymousName() {
  const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
  const noun = ANONYMOUS_NOUNS[Math.floor(Math.random() * ANONYMOUS_NOUNS.length)];
  const emoji = ANONYMOUS_EMOJIS[Math.floor(Math.random() * ANONYMOUS_EMOJIS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${emoji} ${adj} ${noun} #${num}`;
}

// Otomatik moderasyon filtresi
const FORBIDDEN_WORDS = [
  'discord.gg/', '.gg/', 'http://', 'https://', 't.me/',
  'orospu', 'piç', 'sikik', 'amk', 'aq', 'oç', 'yarrak'
];

function checkAutoModeration(text) {
  if (!text) return { flagged: false };
  const lower = text.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (lower.includes(word)) {
      return { flagged: true, reason: `Yasaklı kelime veya bağlantı tespit edildi: "${word}"` };
    }
  }
  return { flagged: false };
}

/**
 * 1. İtiraf Oluşturma Panelini Başlatır / Günceller (Components V2, Accent Colorsuz)
 */
async function ensureConfessionPanel(client) {
  try {
    const channel = await client.channels.fetch(CONFESSION_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      logger.warn(`[ConfessionService] İtiraf paneli kanalı (${CONFESSION_PANEL_CHANNEL_ID}) bulunamadı.`);
      return;
    }

    const panelPayload = {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text('## 💌 Sentara İtiraf & Anonim Köprü Sistemi'),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.text(
            'İçinde tuttuğun sırları, komik anılarını, aşk itiraflarını veya sunucu hakkındaki düşüncelerini toplulukla paylaş!\n\n' +
            '📢 **Açık Paylaş:** Kendi kullanıcı adın ve profilinle doğrudan yayınlanır.\n' +
            '🕵️ **Anonim Paylaş:** Kimliğin tamamen gizlenir, sana özel rastgele bir kod adı atanır.\n' +
            '🔒 **Gizli Kilitli İtiraf:** Sansürlü yayınlanır, yalnızca şifreye sahip olanlar veya yetkililer açabilir.\n\n' +
            '💬 *Tüm itiraflarda bot üzerinden çift yönlü güvenli anonim DM köprüsü (Ghost Bridge) mevcuttur.*'
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            {
              custom_id: 'confession_btn_public',
              label: 'Açık Paylaş',
              style: ButtonStyle.Primary,
              emoji: { name: '📢' }
            },
            {
              custom_id: 'confession_btn_anonymous',
              label: 'Anonim Paylaş',
              style: ButtonStyle.Secondary,
              emoji: { name: '🕵️' }
            },
            {
              custom_id: 'confession_btn_locked',
              label: 'Gizli Kilitli İtiraf',
              style: ButtonStyle.Secondary,
              emoji: { name: '🔒' }
            }
          ])
        ])
      ]
    };

    // Kanalda mevcut mesajı ara
    const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    let existingMsg = null;
    if (messages) {
      existingMsg = messages.find(m => m.author.id === client.user.id);
    }

    if (existingMsg) {
      await existingMsg.edit(panelPayload);
      logger.info('[ConfessionService] İtiraf paneli güncellendi.');
    } else {
      await channel.send(panelPayload);
      logger.success('[ConfessionService] İtiraf paneli başarıyla gönderildi.');
    }
  } catch (err) {
    logger.error('[ConfessionService] ensureConfessionPanel Hatası:', err.message);
  }
}

/**
 * 2. İtiraf Gönderme Modalını Açar
 */
async function openConfessionModal(interaction, type) {
  try {
    const isLocked = type === 'locked';
    const typeLabel = type === 'public' ? 'Açık Paylaşım' : (type === 'locked' ? 'Gizli Kilitli' : 'Anonim Paylaşım');

    const modal = new ModalBuilder()
      .setCustomId(`confession_modal_create_${type}`)
      .setTitle(`İtiraf Gönder (${typeLabel})`);

    const categoryInput = new TextInputBuilder()
      .setCustomId('category')
      .setLabel('Kategori (Komik Anı / Aşk / Sunucu / Dertleşme)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Örn: Komik Anı')
      .setRequired(true)
      .setMaxLength(50);

    const contentInput = new TextInputBuilder()
      .setCustomId('content')
      .setLabel('İtiraf Metniniz (Maks 1000 karakter)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('İtirafınızı buraya yazınız...')
      .setRequired(true)
      .setMaxLength(1000);

    const allowDmInput = new TextInputBuilder()
      .setCustomId('allow_dm')
      .setLabel('Anonim DM İzni (Evet / Hayır)')
      .setStyle(TextInputStyle.Short)
      .setValue('Evet')
      .setRequired(false)
      .setMaxLength(10);

    modal.addComponents(
      new ActionRowBuilder().addComponents(categoryInput),
      new ActionRowBuilder().addComponents(contentInput),
      new ActionRowBuilder().addComponents(allowDmInput)
    );

    if (isLocked) {
      const passwordInput = new TextInputBuilder()
        .setCustomId('password')
        .setLabel('İtiraf Şifresi (Okuyacak kişiye vereceğiniz kod)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Örn: 1234')
        .setRequired(true)
        .setMaxLength(50);
      modal.addComponents(new ActionRowBuilder().addComponents(passwordInput));
    }

    await interaction.showModal(modal);
  } catch (err) {
    logger.error('[ConfessionService] openConfessionModal Hatası:', err.message);
  }
}

/**
 * 3. Modal Form Gönderimini İşler
 */
async function handleConfessionModalSubmit(interaction) {
  try {
    const userId = interaction.user.id;

    // Kara liste kontrolü
    const isBlacklisted = await ConfessionBlacklist.findOne({ userId }).lean().catch(() => null);
    if (isBlacklisted) {
      return interaction.reply({
        content: `❌ İtiraf sisteminden engellendiniz! Gerekçe: ${isBlacklisted.reason || 'Kural ihlali'}`,
        flags: 64
      });
    }

    const customId = interaction.customId;
    const type = customId.replace('confession_modal_create_', '');
    const category = interaction.fields.getTextInputValue('category')?.trim() || 'Genel';
    const content = interaction.fields.getTextInputValue('content')?.trim();
    const allowDmVal = interaction.fields.getTextInputValue('allow_dm')?.trim().toLowerCase();
    const allowDm = allowDmVal !== 'hayır' && allowDmVal !== 'hayir' && allowDmVal !== 'h' && allowDmVal !== 'false';
    const password = type === 'locked' ? interaction.fields.getTextInputValue('password')?.trim() : null;

    if (!content) {
      return interaction.reply({ content: '❌ İtiraf metni boş bırakılamaz!', flags: 64 });
    }

    // Sıralı tekil Confession ID belirleme
    const lastDoc = await Confession.findOne().sort({ confessionId: -1 }).lean().catch(() => null);
    const nextId = lastDoc && lastDoc.confessionId ? lastDoc.confessionId + 1 : 1001;

    const anonymousName = generateAnonymousName();
    const autoMod = checkAutoModeration(content);

    const confessionData = {
      confessionId: nextId,
      authorId: userId,
      guildId: interaction.guildId || GUILD_ID,
      category,
      type,
      content,
      anonymousName,
      allowDm,
      password,
      status: autoMod.flagged ? 'pending' : 'approved',
      reactions: { shock: 0, laugh: 0, redflag: 0, support: 0 },
      userReactions: {}
    };

    const newConfession = await Confession.create(confessionData);

    if (autoMod.flagged) {
      // Moderatör Onay Kuyruğuna Gönder
      await sendToModQueue(interaction.client, newConfession, autoMod.reason);
      return interaction.reply({
        content: `⏳ İtirafınız alındı! Güvenlik filtresi denetimi gereği moderatör onayına iletildi. Onaylandığında <#${CONFESSION_FEED_CHANNEL_ID}> kanalında yayınlanacaktır.`,
        flags: 64
      });
    }

    // Doğrudan Akış Kanalında Yayınla
    const postedMsg = await postConfessionCard(interaction.client, newConfession);
    if (postedMsg) {
      newConfession.messageId = postedMsg.id;
      newConfession.channelId = postedMsg.channelId;
      await newConfession.save().catch(() => {});
    }

    return interaction.reply({
      content: `✅ İtirafınız başarıyla yayınlandı! Görmek için <#${CONFESSION_FEED_CHANNEL_ID}> kanalını ziyaret edebilirsiniz. (İtiraf ID: **#${nextId}**)`,
      flags: 64
    });
  } catch (err) {
    logger.error('[ConfessionService] handleConfessionModalSubmit Hatası:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ İtiraf kaydedilirken bir hata oluştu.', flags: 64 }).catch(() => {});
    }
  }
}

/**
 * 4. İtiraf Kartını Hazırlar ve Gönderir (Components V2, Accent Colorsuz)
 */
function buildConfessionV2Payload(confession) {
  const isLocked = confession.type === 'locked';
  const isPublic = confession.type === 'public';

  const authorDisplay = isPublic
    ? `👤 **Paylaşan:** <@${confession.authorId}>`
    : (isLocked
      ? `🔒 **Paylaşan:** ${confession.anonymousName} *(Kilitli İtiraf)*`
      : `🕵️ **Paylaşan:** ${confession.anonymousName}`);

  const contentDisplay = isLocked
    ? '> ||🔒 Bu itiraf kilitlenmiştir. İçeriği okumak için aşağıdaki "Kilidi Aç" butonuna tıklayıp şifreyi giriniz.||'
    : `> ${confession.content.replace(/\n/g, '\n> ')}`;

  const dmStatus = confession.allowDm ? 'Açık 💬' : 'Kapalı 🔒';
  const timestamp = Math.floor(new Date(confession.createdAt || Date.now()).getTime() / 1000);

  const shockCount = confession.reactions?.shock || 0;
  const laughCount = confession.reactions?.laugh || 0;
  const redflagCount = confession.reactions?.redflag || 0;
  const supportCount = confession.reactions?.support || 0;

  const reactionRow = {
    type: 1, // ActionRow
    components: [
      {
        type: 2, // Button
        style: ButtonStyle.Secondary,
        label: `Şok Oldum (${shockCount})`,
        emoji: { name: '🔥' },
        custom_id: `confession_react_shock_${confession.confessionId}`
      },
      {
        type: 2,
        style: ButtonStyle.Secondary,
        label: `Güldüm (${laughCount})`,
        emoji: { name: '😂' },
        custom_id: `confession_react_laugh_${confession.confessionId}`
      },
      {
        type: 2,
        style: ButtonStyle.Secondary,
        label: `Red Flag (${redflagCount})`,
        emoji: { name: '🚩' },
        custom_id: `confession_react_redflag_${confession.confessionId}`
      },
      {
        type: 2,
        style: ButtonStyle.Secondary,
        label: `Destek (${supportCount})`,
        emoji: { name: '❤️' },
        custom_id: `confession_react_support_${confession.confessionId}`
      }
    ]
  };

  const actionButtons = [
    {
      type: 2,
      style: ButtonStyle.Primary,
      label: 'Anonim Yazara DM At',
      emoji: { name: '💬' },
      custom_id: `confession_dm_author_${confession.confessionId}`,
      disabled: !confession.allowDm
    },
    {
      type: 2,
      style: ButtonStyle.Secondary,
      label: 'Anonim Thread Yanıtı',
      emoji: { name: '💬' },
      custom_id: `confession_thread_reply_${confession.confessionId}`
    },
    {
      type: 2,
      style: ButtonStyle.Secondary,
      label: 'Bildir',
      emoji: { name: '🚩' },
      custom_id: `confession_report_${confession.confessionId}`
    }
  ];

  if (isLocked) {
    actionButtons.unshift({
      type: 2,
      style: ButtonStyle.Success,
      label: 'Kilidi Aç',
      emoji: { name: '🔓' },
      custom_id: `confession_unlock_${confession.confessionId}`
    });
  }

  const interactionRow = {
    type: 1,
    components: actionButtons
  };

  return {
    flags: ComponentsV2Factory.FLAGS,
    components: [
      ComponentsV2Factory.container([
        ComponentsV2Factory.text(`## 💬 İtiraf #${confession.confessionId} • ${confession.category}`),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(authorDisplay),
        ComponentsV2Factory.text(contentDisplay),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(`*Anonim DM: ${dmStatus} • <t:${timestamp}:R>*`),
        ComponentsV2Factory.separator(false),
        reactionRow,
        interactionRow
      ])
    ]
  };
}

async function postConfessionCard(client, confession) {
  try {
    const channel = await client.channels.fetch(CONFESSION_FEED_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      logger.error(`[ConfessionService] Akış kanalı (${CONFESSION_FEED_CHANNEL_ID}) bulunamadı.`);
      return null;
    }

    const payload = buildConfessionV2Payload(confession);
    const msg = await channel.send(payload);

    // Otomatik tartışma alt başlığı (Thread) oluştur
    try {
      const thread = await msg.startThread({
        name: `🧵 İtiraf #${confession.confessionId} Tartışması`,
        autoArchiveDuration: 1440
      });
      confession.threadId = thread.id;
      await thread.send({
        content: `💭 **İtiraf #${confession.confessionId}** altına anonim veya açık yorumlarınızı paylaşabilirsiniz. Anonim yorum yapmak için itiraf kartındaki **"Anonim Thread Yanıtı"** butonunu kullanabilirsiniz.`
      });
    } catch (thrErr) {
      logger.warn('[ConfessionService] Thread oluşturulamadı:', thrErr.message);
    }

    return msg;
  } catch (err) {
    logger.error('[ConfessionService] postConfessionCard Hatası:', err.message);
    return null;
  }
}

/**
 * 5. Moderatör Onay Kuyruğu Bildirimi (Channel: 1518693023934844959)
 */
async function sendToModQueue(client, confession, flagReason = null) {
  try {
    const modChannel = await client.channels.fetch(CONFESSION_MOD_CHANNEL_ID).catch(() => null);
    if (!modChannel || !modChannel.isTextBased()) return;

    const payload = {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`## 🛡️ Moderasyon Onay Kuyruğu (#${confession.confessionId})`),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.text(
            `👤 **Yazar:** <@${confession.authorId}> (\`${confession.authorId}\`)\n` +
            `📂 **Kategori:** ${confession.category} • **Tür:** ${confession.type}\n` +
            (flagReason ? `⚠️ **Filtre Sebebi:** ${flagReason}\n` : '') +
            `📝 **İçerik:**\n> ${confession.content.replace(/\n/g, '\n> ')}`
          ),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.actionRow([
            {
              custom_id: `confession_mod_approve_${confession.confessionId}`,
              label: 'Onayla',
              style: ButtonStyle.Success,
              emoji: { name: '✅' }
            },
            {
              custom_id: `confession_mod_reject_${confession.confessionId}`,
              label: 'Reddet',
              style: ButtonStyle.Danger,
              emoji: { name: '❌' }
            },
            {
              custom_id: `confession_mod_edit_${confession.confessionId}`,
              label: 'Düzenle',
              style: ButtonStyle.Secondary,
              emoji: { name: '✏️' }
            },
            {
              custom_id: `confession_mod_blacklist_${confession.confessionId}`,
              label: 'Yazarı Engelle',
              style: ButtonStyle.Danger,
              emoji: { name: '🚫' }
            }
          ])
        ])
      ]
    };

    await modChannel.send(payload);
  } catch (err) {
    logger.error('[ConfessionService] sendToModQueue Hatası:', err.message);
  }
}

/**
 * 6. Tepki İşleme (Dynamic Reaction Buttons)
 */
async function handleConfessionReaction(interaction, confessionId, reactionType) {
  try {
    const userId = interaction.user.id;
    const confession = await Confession.findOne({ confessionId: Number(confessionId) });
    if (!confession) {
      return interaction.reply({ content: '❌ İtiraf bulunamadı.', flags: 64 });
    }

    if (!confession.reactions) {
      confession.reactions = { shock: 0, laugh: 0, redflag: 0, support: 0 };
    }
    if (!confession.userReactions) {
      confession.userReactions = new Map();
    }

    const currentReaction = confession.userReactions instanceof Map
      ? confession.userReactions.get(userId)
      : confession.userReactions[userId];

    if (currentReaction === reactionType) {
      // Aynı tepkiye tekrar bastı -> Kaldır (Toggle)
      confession.reactions[reactionType] = Math.max(0, (confession.reactions[reactionType] || 0) - 1);
      if (confession.userReactions instanceof Map) {
        confession.userReactions.delete(userId);
      } else {
        delete confession.userReactions[userId];
      }
    } else {
      // Farklı tepki veya ilk kez tepki
      if (currentReaction && confession.reactions[currentReaction]) {
        confession.reactions[currentReaction] = Math.max(0, confession.reactions[currentReaction] - 1);
      }
      confession.reactions[reactionType] = (confession.reactions[reactionType] || 0) + 1;
      if (confession.userReactions instanceof Map) {
        confession.userReactions.set(userId, reactionType);
      } else {
        confession.userReactions[userId] = reactionType;
      }
    }

    await confession.save();

    // Mesajı güncelle
    const updatedPayload = buildConfessionV2Payload(confession);
    await interaction.update(updatedPayload).catch(async () => {
      // Eğer update başarısız olursa mesajı edit'le
      if (interaction.message) {
        await interaction.message.edit(updatedPayload).catch(() => {});
      }
    });
  } catch (err) {
    logger.error('[ConfessionService] handleConfessionReaction Hatası:', err.message);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Tepki verilirken bir hata oluştu.', flags: 64 }).catch(() => {});
    }
  }
}

/**
 * 7. Anonim Thread Yanıtı Modal & İşleme
 */
async function openThreadReplyModal(interaction, confessionId) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`confession_modal_thread_reply_${confessionId}`)
      .setTitle(`Anonim Thread Yanıtı (#${confessionId})`);

    const replyInput = new TextInputBuilder()
      .setCustomId('reply_text')
      .setLabel('Anonim Yorumunuz')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Bu itirafa anonim olarak yorumunuzu yazın...')
      .setRequired(true)
      .setMaxLength(800);

    modal.addComponents(new ActionRowBuilder().addComponents(replyInput));
    await interaction.showModal(modal);
  } catch (err) {
    logger.error('[ConfessionService] openThreadReplyModal Hatası:', err.message);
  }
}

async function handleThreadReplyModalSubmit(interaction) {
  try {
    const confessionId = interaction.customId.replace('confession_modal_thread_reply_', '');
    const replyText = interaction.fields.getTextInputValue('reply_text')?.trim();
    if (!replyText) {
      return interaction.reply({ content: '❌ Yorum boş olamaz!', flags: 64 });
    }

    const confession = await Confession.findOne({ confessionId: Number(confessionId) }).lean();
    if (!confession) {
      return interaction.reply({ content: '❌ İtiraf bulunamadı.', flags: 64 });
    }

    let thread = null;
    if (confession.threadId) {
      thread = await interaction.client.channels.fetch(confession.threadId).catch(() => null);
    }

    if (!thread && confession.messageId) {
      const feedChan = await interaction.client.channels.fetch(CONFESSION_FEED_CHANNEL_ID).catch(() => null);
      if (feedChan) {
        const parentMsg = await feedChan.messages.fetch(confession.messageId).catch(() => null);
        if (parentMsg) {
          thread = parentMsg.thread || await parentMsg.startThread({
            name: `🧵 İtiraf #${confessionId} Tartışması`,
            autoArchiveDuration: 1440
          }).catch(() => null);
        }
      }
    }

    if (!thread) {
      return interaction.reply({ content: '❌ İtiraf alt başlığı (Thread) bulunamadı.', flags: 64 });
    }

    const alias = generateAnonymousName();
    await thread.send({
      content: `🕵️ **${alias}:**\n> ${replyText.replace(/\n/g, '\n> ')}`
    });

    return interaction.reply({
      content: '✅ Yorumunuz kimliğiniz tamamen gizli tutularak thread altına iletildi!',
      flags: 64
    });
  } catch (err) {
    logger.error('[ConfessionService] handleThreadReplyModalSubmit Hatası:', err.message);
  }
}

/**
 * 8. Şifreli İtirafı Açma (Unlock Modal)
 */
async function openUnlockModal(interaction, confessionId) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`confession_modal_unlock_${confessionId}`)
      .setTitle(`Kilidi Aç (#${confessionId})`);

    const passInput = new TextInputBuilder()
      .setCustomId('entered_password')
      .setLabel('İtiraf Şifresi')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Yazarın verdiği şifreyi giriniz...')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(passInput));
    await interaction.showModal(modal);
  } catch (err) {
    logger.error('[ConfessionService] openUnlockModal Hatası:', err.message);
  }
}

async function handleUnlockModalSubmit(interaction) {
  try {
    const confessionId = interaction.customId.replace('confession_modal_unlock_', '');
    const enteredPassword = interaction.fields.getTextInputValue('entered_password')?.trim();

    const confession = await Confession.findOne({ confessionId: Number(confessionId) }).lean();
    if (!confession) {
      return interaction.reply({ content: '❌ İtiraf bulunamadı.', flags: 64 });
    }

    const isAuthor = confession.authorId === interaction.user.id;
    const isStaff = interaction.memberPermissions?.has('Administrator') || interaction.memberPermissions?.has('ManageMessages');
    const isPassCorrect = confession.password && enteredPassword === confession.password;

    if (isPassCorrect || isAuthor || isStaff) {
      return interaction.reply({
        content: `### 🔓 İtiraf #${confessionId} İçeriği:\n\n> ${confession.content.replace(/\n/g, '\n> ')}`,
        flags: 64
      });
    } else {
      return interaction.reply({
        content: '❌ Hatalı şifre girdiniz! Yalnızca geçerli şifreye sahip olanlar bu itirafı okuyabilir.',
        flags: 64
      });
    }
  } catch (err) {
    logger.error('[ConfessionService] handleUnlockModalSubmit Hatası:', err.message);
  }
}

/**
 * 9. İtiraf Bildirme (Report)
 */
async function handleConfessionReport(interaction, confessionId) {
  try {
    const confession = await Confession.findOne({ confessionId: Number(confessionId) }).lean();
    if (!confession) {
      return interaction.reply({ content: '❌ İtiraf bulunamadı.', flags: 64 });
    }

    const modChannel = await interaction.client.channels.fetch(CONFESSION_MOD_CHANNEL_ID).catch(() => null);
    if (modChannel && modChannel.isTextBased()) {
      await modChannel.send({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text(`## 🚩 İtiraf Bildirisi (#${confessionId})`),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(
              `👤 **Bildiren:** <@${interaction.user.id}> (\`${interaction.user.id}\`)\n` +
              `✍️ **İtiraf Sahibi:** <@${confession.authorId}> (\`${confession.authorId}\`)\n` +
              `📝 **İçerik:**\n> ${confession.content.replace(/\n/g, '\n> ')}`
            ),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.actionRow([
              {
                custom_id: `confession_mod_reject_${confessionId}`,
                label: 'İtirafı Kaldır',
                style: ButtonStyle.Danger,
                emoji: { name: '🗑️' }
              },
              {
                custom_id: `confession_mod_blacklist_${confessionId}`,
                label: 'Yazarı Engelle',
                style: ButtonStyle.Danger,
                emoji: { name: '🚫' }
              }
            ])
          ])
        ]
      });
    }

    return interaction.reply({
      content: '✅ Bildiriminiz moderasyon ekibine iletildi. Teşekkür ederiz.',
      flags: 64
    });
  } catch (err) {
    logger.error('[ConfessionService] handleConfessionReport Hatası:', err.message);
  }
}

/**
 * 10. Ghost Bridge Relay DM Başlatma
 */
async function handleConfessionDMStart(interaction, confessionId) {
  try {
    const senderId = interaction.user.id;
    const confession = await Confession.findOne({ confessionId: Number(confessionId) }).lean();
    if (!confession) {
      return interaction.reply({ content: '❌ İtiraf bulunamadı.', flags: 64 });
    }

    if (!confession.allowDm) {
      return interaction.reply({ content: '🔒 Bu itirafın sahibi anonim DM bağlantılarını devre dışı bırakmış.', flags: 64 });
    }

    if (confession.authorId === senderId) {
      return interaction.reply({ content: '❌ Kendi itirafınıza anonim DM başlatamazsınız!', flags: 64 });
    }

    // Engelleme kontrolü
    const isBlocked = await ConfessionBlock.findOne({ authorId: confession.authorId, blockedUserId: senderId }).lean();
    if (isBlocked) {
      return interaction.reply({ content: '❌ Bu itirafın sahibi sizinle iletişimi engelledi.', flags: 64 });
    }

    const isBlacklisted = await ConfessionBlacklist.findOne({ userId: senderId }).lean();
    if (isBlacklisted) {
      return interaction.reply({ content: '❌ İtiraf sisteminden yasaklandınız.', flags: 64 });
    }

    // Aktif açık oturum var mı?
    const existingActiveSession = await ConfessionSession.findOne({
      confessionId: Number(confessionId),
      authorId: confession.authorId,
      senderId: senderId,
      status: 'active'
    });
    if (existingActiveSession) {
      return interaction.reply({
        content: `💬 Bu itirafın yazarıyla zaten aktif bir oturumunuz bulunuyor! Bot ile olan DM kutunuzdan mesaj gönderebilirsiniz. (Oturum: \`${existingActiveSession.sessionId}\`)`,
        flags: 64
      });
    }

    const sessionId = `SES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await ConfessionSession.create({
      sessionId,
      confessionId: Number(confessionId),
      authorId: confession.authorId,
      senderId: senderId,
      status: 'pending',
      messages: []
    });

    // İtiraf Sahibine DM Gönder
    const authorUser = await interaction.client.users.fetch(confession.authorId).catch(() => null);
    if (!authorUser) {
      return interaction.reply({ content: '❌ İtiraf sahibine ulaşılamadı (DM kapalı olabilir).', flags: 64 });
    }

    try {
      await authorUser.send({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text('## 💌 Yeni Anonim DM Köprüsü İsteği!'),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(
              `Bir kullanıcı **#${confessionId}** numaralı itirafın için seninle bot üzerinden anonim sohbet başlatmak istiyor.\n\n` +
              '🔒 **Güvenlik Notu:** Kimliğin ve profilin karşı tarafa asla gösterilmez. Mesajlar bot aracılığıyla güvenli köprü üzerinden iletilecektir.'
            ),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.actionRow([
              {
                custom_id: `confession_bridge_accept_${sessionId}`,
                label: 'Kabul Et',
                style: ButtonStyle.Success,
                emoji: { name: '✅' }
              },
              {
                custom_id: `confession_bridge_reject_${sessionId}`,
                label: 'Reddet',
                style: ButtonStyle.Danger,
                emoji: { name: '❌' }
              }
            ])
          ])
        ]
      });
    } catch (dmErr) {
      return interaction.reply({
        content: '❌ İtiraf sahibinin DM kutusu kapalı olduğu için bağlantı isteği iletilemedi.',
        flags: 64
      });
    }

    return interaction.reply({
      content: `✅ **#${confessionId}** itirafının yazarına anonim bağlantı isteği gönderildi! Yazar onayladığında bot DM kutunuz üzerinden sohbete başlayabilirsiniz.`,
      flags: 64
    });
  } catch (err) {
    logger.error('[ConfessionService] handleConfessionDMStart Hatası:', err.message);
  }
}

/**
 * 11. Ghost Bridge Onay / Ret / Kontrol Butonları
 */
async function handleBridgeButton(interaction, action, sessionId) {
  try {
    const session = await ConfessionSession.findOne({ sessionId });
    if (!session) {
      return interaction.reply({ content: '❌ Bu DM oturumu bulunamadı veya süresi doldu.', flags: 64 });
    }

    const client = interaction.client;

    if (action === 'accept') {
      if (interaction.user.id !== session.authorId) {
        return interaction.reply({ content: '❌ Bu isteği yalnızca itiraf sahibi onaylayabilir.', flags: 64 });
      }

      session.status = 'active';
      await session.save();

      // İtiraf sahibine bilgi ver
      await interaction.update({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text('## 🟢 Anonim Köprü Bağlantısı Aktif!'),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(
              `**#${session.confessionId}** itirafı için anonim bağlantı kuruldu.\n` +
              'Artık bu DM kanalına yazacağınız her mesaj karşı tarafa `📝 İtiraf Sahibi` rumuzuyla aktarılacaktır.\n' +
              'Karşı tarafın yazdığı mesajlar ise buraya `🕵️ Anonim Konuşmacı` olarak düşecektir.'
            ),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.actionRow([
              { custom_id: `confession_bridge_close_${sessionId}`, label: 'Sohbeti Kapat', style: ButtonStyle.Secondary, emoji: { name: '🛑' } },
              { custom_id: `confession_bridge_block_${sessionId}`, label: 'Kullanıcıyı Engelle', style: ButtonStyle.Danger, emoji: { name: '🚫' } },
              { custom_id: `confession_bridge_report_${sessionId}`, label: 'Taciz Bildir', style: ButtonStyle.Danger, emoji: { name: '⚠️' } }
            ])
          ])
        ]
      });

      // Göndericiye DM ile bildir
      const senderUser = await client.users.fetch(session.senderId).catch(() => null);
      if (senderUser) {
        await senderUser.send({
          flags: ComponentsV2Factory.FLAGS,
          components: [
            ComponentsV2Factory.container([
              ComponentsV2Factory.text('## 🟢 Anonim Köprü Bağlantısı Kabul Edildi!'),
              ComponentsV2Factory.separator(true),
              ComponentsV2Factory.text(
                `**#${session.confessionId}** itirafının yazarı bağlantınızı kabul etti!\n` +
                'Artık bu DM kanalına yazacağınız her mesaj yazara `🕵️ Anonim Konuşmacı` rumuzuyla aktarılacaktır.\n' +
                'Kimliğiniz tamamen gizli kalmaya devam edecektir.'
              ),
              ComponentsV2Factory.separator(true),
              ComponentsV2Factory.actionRow([
                { custom_id: `confession_bridge_close_${sessionId}`, label: 'Sohbeti Kapat', style: ButtonStyle.Secondary, emoji: { name: '🛑' } },
                { custom_id: `confession_bridge_report_${sessionId}`, label: 'Taciz Bildir', style: ButtonStyle.Danger, emoji: { name: '⚠️' } }
              ])
            ])
          ]
        }).catch(() => {});
      }
    } else if (action === 'reject') {
      if (interaction.user.id !== session.authorId) {
        return interaction.reply({ content: '❌ Bu isteği yalnızca itiraf sahibi reddedebilir.', flags: 64 });
      }

      session.status = 'closed';
      session.closedAt = new Date();
      await session.save();

      await interaction.update({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text('## ❌ Bağlantı İsteği Reddedildi'),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text('Anonim DM isteği reddedildi.')
          ])
        ]
      });

      const senderUser = await client.users.fetch(session.senderId).catch(() => null);
      if (senderUser) {
        await senderUser.send(`❌ **#${session.confessionId}** numaralı itirafın sahibi anonim sohbet isteğinizi kabul etmedi.`).catch(() => {});
      }
    } else if (action === 'close') {
      session.status = 'closed';
      session.closedAt = new Date();
      await session.save();

      const closePayload = {
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text('## 🛑 Anonim Sohbet Kapatıldı'),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text('Bu anonim köprü oturumu sonlandırıldı. Artık mesaj iletilmeyecektir.')
          ])
        ]
      };

      await interaction.reply(closePayload);

      // Karşı tarafa da bildir
      const otherUserId = interaction.user.id === session.authorId ? session.senderId : session.authorId;
      const otherUser = await client.users.fetch(otherUserId).catch(() => null);
      if (otherUser) {
        await otherUser.send(closePayload).catch(() => {});
      }
    } else if (action === 'block') {
      if (interaction.user.id !== session.authorId) {
        return interaction.reply({ content: '❌ Yalnızca itiraf sahibi karşı tarafı engelleyebilir.', flags: 64 });
      }

      session.status = 'closed';
      session.closedAt = new Date();
      await session.save();

      await ConfessionBlock.create({
        authorId: session.authorId,
        blockedUserId: session.senderId,
        confessionId: session.confessionId
      }).catch(() => {});

      await interaction.reply({
        content: '🚫 Kullanıcı başarıyla engellendi! Bu kullanıcı artık itiraflarınıza DM isteği gönderemez.',
        flags: 64
      });

      const senderUser = await client.users.fetch(session.senderId).catch(() => null);
      if (senderUser) {
        await senderUser.send('🛑 Bu oturum itiraf sahibi tarafından sonlandırıldı.').catch(() => {});
      }
    } else if (action === 'report') {
      // Taciz bildirme: Son 10 mesajı moderatör kanalına ilet
      const lastMessages = session.messages.slice(-10);
      const modChannel = await client.channels.fetch(CONFESSION_MOD_CHANNEL_ID).catch(() => null);

      if (modChannel && modChannel.isTextBased()) {
        const historyText = lastMessages.length > 0
          ? lastMessages.map(m => `• [${m.sender === 'author' ? 'İtiraf Sahibi' : 'Anonim Konuşmacı'}]: ${m.content}`).join('\n')
          : 'Henüz mesaj kaydı bulunmuyor.';

        await modChannel.send({
          flags: ComponentsV2Factory.FLAGS,
          components: [
            ComponentsV2Factory.container([
              ComponentsV2Factory.text(`## ⚠️ Anonim Köprü Taciz Bildirisi (\`${sessionId}\`)`),
              ComponentsV2Factory.separator(true),
              ComponentsV2Factory.text(
                `📌 **İtiraf ID:** #${session.confessionId}\n` +
                `🚨 **Bildiren:** <@${interaction.user.id}> (\`${interaction.user.id}\`)\n` +
                `✍️ **İtiraf Sahibi:** <@${session.authorId}> (\`${session.authorId}\`)\n` +
                `🕵️ **Anonim Konuşmacı:** <@${session.senderId}> (\`${session.senderId}\`)\n\n` +
                `**Son Mesaj Geçmişi:**\n\`\`\`\n${historyText}\n\`\`\``
              ),
              ComponentsV2Factory.separator(true),
              ComponentsV2Factory.actionRow([
                {
                  custom_id: `confession_mod_blacklist_user_${session.senderId}`,
                  label: 'Anonim Konuşmacıyı Yasakla',
                  style: ButtonStyle.Danger,
                  emoji: { name: '🚫' }
                },
                {
                  custom_id: `confession_mod_blacklist_user_${session.authorId}`,
                  label: 'Yazarı Yasakla',
                  style: ButtonStyle.Danger,
                  emoji: { name: '🚫' }
                }
              ])
            ])
          ]
        });
      }

      await interaction.reply({
        content: '⚠️ Taciz bildiriminiz ve son mesaj geçmişiniz moderasyon ekibine iletildi.',
        flags: 64
      });
    }
  } catch (err) {
    logger.error('[ConfessionService] handleBridgeButton Hatası:', err.message);
  }
}

/**
 * 12. DM Mesaj Yönlendirme Mekanizması (Message Relay in DM)
 */
async function handleDirectMessageRelay(message) {
  try {
    if (!message || message.author.bot || message.channel.type !== ChannelType.DM) return false;

    const userId = message.author.id;
    // Aktif oturum ara
    const activeSession = await ConfessionSession.findOne({
      $or: [{ authorId: userId }, { senderId: userId }],
      status: 'active'
    }).sort({ updatedAt: -1 });

    if (!activeSession) return false;

    const isAuthor = activeSession.authorId === userId;
    const targetUserId = isAuthor ? activeSession.senderId : activeSession.authorId;
    const targetUser = await message.client.users.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      await message.reply('❌ Karşı tarafa ulaşılamıyor. Oturum kapatılmış olabilir.');
      return true;
    }

    const senderRole = isAuthor ? 'author' : 'sender';
    const senderTitle = isAuthor ? '📝 **İtiraf Sahibi**' : '🕵️ **Anonim Konuşmacı**';

    // Mesajı kaydet
    activeSession.messages.push({
      sender: senderRole,
      content: message.content,
      timestamp: new Date()
    });
    // Maksimum son 30 mesajı tut
    if (activeSession.messages.length > 30) {
      activeSession.messages = activeSession.messages.slice(-30);
    }
    await activeSession.save();

    // Karşı tarafa V2 Container ile ilet
    const controlButtons = [
      { custom_id: `confession_bridge_close_${activeSession.sessionId}`, label: 'Sohbeti Kapat', style: ButtonStyle.Secondary, emoji: { name: '🛑' } }
    ];
    if (isAuthor) {
      // Hedef sender
      controlButtons.push({ custom_id: `confession_bridge_report_${activeSession.sessionId}`, label: 'Taciz Bildir', style: ButtonStyle.Danger, emoji: { name: '⚠️' } });
    } else {
      // Hedef author
      controlButtons.push({ custom_id: `confession_bridge_block_${activeSession.sessionId}`, label: 'Kullanıcıyı Engelle', style: ButtonStyle.Danger, emoji: { name: '🚫' } });
      controlButtons.push({ custom_id: `confession_bridge_report_${activeSession.sessionId}`, label: 'Taciz Bildir', style: ButtonStyle.Danger, emoji: { name: '⚠️' } });
    }

    await targetUser.send({
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`${senderTitle}:\n> ${message.content.replace(/\n/g, '\n> ')}`),
          ComponentsV2Factory.separator(false),
          ComponentsV2Factory.actionRow(controlButtons)
        ])
      ]
    });

    // Göndericiye iletildi reaksiyonu
    await message.react('✉️').catch(() => {});
    return true;
  } catch (err) {
    logger.error('[ConfessionService] handleDirectMessageRelay Hatası:', err.message);
    return false;
  }
}

/**
 * 13. Moderasyon Kuyruğu Butonları
 */
async function handleModQueueAction(interaction, action, confessionIdOrUserId) {
  try {
    if (action === 'blacklist_user') {
      const targetUserId = confessionIdOrUserId;
      await ConfessionBlacklist.findOneAndUpdate(
        { userId: targetUserId },
        {
          userId: targetUserId,
          reason: 'Moderatör tarafından itiraf sisteminden yasaklandı',
          bannedBy: interaction.user.id,
          bannedAt: new Date()
        },
        { upsert: true, new: true }
      );
      return interaction.reply({
        content: `🚫 <@${targetUserId}> (\`${targetUserId}\`) başarıyla itiraf sisteminden kara listeye alındı.`,
        flags: 64
      });
    }

    const confessionId = Number(confessionIdOrUserId);
    const confession = await Confession.findOne({ confessionId });
    if (!confession) {
      return interaction.reply({ content: '❌ İtiraf kaydı bulunamadı.', flags: 64 });
    }

    if (action === 'approve') {
      confession.status = 'approved';
      confession.reviewerId = interaction.user.id;
      await confession.save();

      const posted = await postConfessionCard(interaction.client, confession);
      if (posted) {
        confession.messageId = posted.id;
        confession.channelId = posted.channelId;
        await confession.save();
      }

      await interaction.update({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text(`## ✅ Onaylandı (#${confessionId})`),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(
              `İtiraf <@${interaction.user.id}> tarafından onaylandı ve <#${CONFESSION_FEED_CHANNEL_ID}> kanalında yayınlandı.`
            )
          ])
        ]
      });
    } else if (action === 'reject') {
      confession.status = 'rejected';
      confession.reviewerId = interaction.user.id;
      await confession.save();

      // Eğer daha önce yayınlanmışsa mesajı sil
      if (confession.messageId && confession.channelId) {
        const feedChan = await interaction.client.channels.fetch(confession.channelId).catch(() => null);
        if (feedChan) {
          const msg = await feedChan.messages.fetch(confession.messageId).catch(() => null);
          if (msg) await msg.delete().catch(() => {});
        }
      }

      await interaction.update({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text(`## ❌ Reddedildi / Kaldırıldı (#${confessionId})`),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(`İtiraf <@${interaction.user.id}> tarafından reddedildi/kaldırıldı.`)
          ])
        ]
      });
    } else if (action === 'blacklist') {
      await ConfessionBlacklist.findOneAndUpdate(
        { userId: confession.authorId },
        {
          userId: confession.authorId,
          reason: `#${confessionId} itirafındaki kural ihlali`,
          bannedBy: interaction.user.id,
          bannedAt: new Date()
        },
        { upsert: true, new: true }
      );

      confession.status = 'rejected';
      confession.reviewerId = interaction.user.id;
      await confession.save();

      await interaction.update({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text(`## 🚫 Yazar Kara Listeye Alındı (#${confessionId})`),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(
              `Yazar (<@${confession.authorId}>) <@${interaction.user.id}> tarafından kara listeye alındı ve itiraf reddedildi.`
            )
          ])
        ]
      });
    }
  } catch (err) {
    logger.error('[ConfessionService] handleModQueueAction Hatası:', err.message);
  }
}

module.exports = {
  CONFESSION_PANEL_CHANNEL_ID,
  CONFESSION_FEED_CHANNEL_ID,
  CONFESSION_MOD_CHANNEL_ID,
  ensureConfessionPanel,
  openConfessionModal,
  handleConfessionModalSubmit,
  handleConfessionReaction,
  openThreadReplyModal,
  handleThreadReplyModalSubmit,
  openUnlockModal,
  handleUnlockModalSubmit,
  handleConfessionReport,
  handleConfessionDMStart,
  handleBridgeButton,
  handleDirectMessageRelay,
  handleModQueueAction
};
