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
const cron = require('node-cron');
const ComponentsV2Factory = require('../utils/componentsV2Factory');
const {
  Confession,
  ConfessionSession,
  ConfessionBlacklist,
  ConfessionBlock
} = require('../../models/Confession');
const Economy = require('../../models/Economy');
const logger = require('../../utils/logger');

// Sunucu ve Kanal Sabitleri
const GUILD_ID = '1367646464804655104';
const CONFESSION_PANEL_CHANNEL_ID      = '1542910032306380971'; // İtiraf oluşturma paneli
const CONFESSION_FEED_CHANNEL_ID       = '1542910080138092564'; // İtiraflar akış kanalı
const CONFESSION_MOD_CHANNEL_ID        = '1518693023934844959'; // Moderasyon / Onay / Log kanalı
const CONFESSION_SECRET_LOG_CHANNEL_ID = '1542913114788331620'; // Arka plan tüm itiraf & DM köprüsü gizli denetim log kanalı

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
 * Arka Plan Gizli Denetim Günlüğü Gönderir (Kanal: 1542913114788331620)
 */
async function sendSecretAuditLog(client, payload) {
  try {
    const channel = await client.channels.fetch(CONFESSION_SECRET_LOG_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) return;
    await channel.send(payload).catch(() => {});
  } catch (err) {
    logger.error('[ConfessionService] sendSecretAuditLog Hatası:', err.message);
  }
}

/**
 * İki kullanıcının sunucudaki ortak rollerinin sayısını hesaplar
 */
async function getCommonRoleCount(client, userId1, userId2) {
  try {
    const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
    if (!guild) return 0;
    const member1 = await guild.members.fetch(userId1).catch(() => null);
    const member2 = await guild.members.fetch(userId2).catch(() => null);
    if (!member1 || !member2) return 0;

    const roles1 = member1.roles.cache.filter(r => r.id !== guild.id);
    const roles2 = member2.roles.cache.filter(r => r.id !== guild.id);
    const common = roles1.filter(r => roles2.has(r.id));
    return common.size;
  } catch (_) {
    return 0;
  }
}

/**
 * Anket için metin tabanlı ilerleme çubuğu oluşturur
 */
function renderProgressBar(percentage) {
  const totalBars = 10;
  const filledBars = Math.round((percentage / 100) * totalBars);
  const emptyBars = Math.max(0, totalBars - filledBars);
  return `[${'█'.repeat(filledBars)}${'▒'.repeat(emptyBars)}]`;
}

/**
 * 1. İtiraf Oluşturma Panelini Başlatır / Günceller (Sadece 2 Sade Buton, Components V2, Accent Colorsuz)
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
            '🕵️ **Anonim Paylaş:** Kimliğin tamamen gizlenir, sana özel rastgele bir kod adı atanır.\n\n' +
            '✨ *Tüm itiraflarda isteğe bağlı anket, 12/24 saatlik otomatik imha süresi ve çift yönlü anonim DM köprüsü (Ghost Bridge) mevcuttur.*'
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
 * 2. İtiraf Gönderme Modalını Açar (İmha & Anket Seçenekleri Modal İçinde)
 */
async function openConfessionModal(interaction, type) {
  try {
    const typeLabel = type === 'public' ? 'Açık Paylaşım' : 'Anonim Paylaşım';

    const modal = new ModalBuilder()
      .setCustomId(`confession_modal_create_${type}`)
      .setTitle(`İtiraf Gönder (${typeLabel})`);

    const categoryInput = new TextInputBuilder()
      .setCustomId('category')
      .setLabel('Kategori (Komik, Aşk, Sunucu, Dertleşme)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Örn: Komik Anı veya Dertleşme / Tavsiye')
      .setRequired(true)
      .setMaxLength(50);

    const contentInput = new TextInputBuilder()
      .setCustomId('content')
      .setLabel('İtiraf Metniniz')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('İtirafınızı buraya yazınız...')
      .setRequired(true)
      .setMaxLength(1000);

    const expireInput = new TextInputBuilder()
      .setCustomId('expire_duration')
      .setLabel('İmha Süresi (Süresiz / 24 Saat / 12 Saat)')
      .setStyle(TextInputStyle.Short)
      .setValue('Süresiz')
      .setRequired(false)
      .setMaxLength(20);

    const pollInput = new TextInputBuilder()
      .setCustomId('poll_input')
      .setLabel('Anket (İsteğe Bağlı)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Örn: Haklı mıyım? (Evet / Hayır)')
      .setRequired(false)
      .setMaxLength(100);

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
      new ActionRowBuilder().addComponents(expireInput),
      new ActionRowBuilder().addComponents(pollInput),
      new ActionRowBuilder().addComponents(allowDmInput)
    );

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
    const expireDurationStr = interaction.fields.getTextInputValue('expire_duration')?.trim().toLowerCase();
    const pollStr = interaction.fields.getTextInputValue('poll_input')?.trim();
    const allowDmVal = interaction.fields.getTextInputValue('allow_dm')?.trim().toLowerCase();
    const allowDm = allowDmVal !== 'hayır' && allowDmVal !== 'hayir' && allowDmVal !== 'h' && allowDmVal !== 'false';

    if (!content) {
      return interaction.reply({ content: '❌ İtiraf metni boş bırakılamaz!', flags: 64 });
    }

    // İmha Süresi Hesaplama
    let expiresAt = null;
    if (expireDurationStr.includes('12')) {
      expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    } else if (expireDurationStr.includes('24')) {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // Anket Ayrıştırma
    let poll = null;
    if (pollStr && pollStr.length > 2) {
      let q = pollStr;
      let optA = 'Evet';
      let optB = 'Hayır';

      if (pollStr.includes('/') || pollStr.includes('|')) {
        const sep = pollStr.includes('/') ? '/' : '|';
        const parts = pollStr.split(sep);
        if (parts.length >= 2) {
          const firstPart = parts[0].trim();
          optB = parts[1].trim().substring(0, 30);
          
          if (firstPart.includes('?') || firstPart.includes(':')) {
            const sub = firstPart.split(/\?|\:/);
            q = sub[0].trim() + '?';
            optA = sub[1].trim().substring(0, 30) || 'A';
          } else {
            optA = firstPart.substring(0, 30);
            q = 'Bu itirafa ne diyorsun?';
          }
        }
      }
      poll = {
        question: q,
        optionA: { text: optA, count: 0 },
        optionB: { text: optB, count: 0 },
        voters: {}
      };
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
      expiresAt,
      poll: poll || undefined,
      status: autoMod.flagged ? 'pending' : 'approved',
      reactions: { shock: 0, laugh: 0, redflag: 0, support: 0 },
      userReactions: {}
    };

    const newConfession = await Confession.create(confessionData);

    // 🕵️ [GİZLİ LOG] Yeni İtiraf Paylaşımını Gizli Denetim Kanalına İlet (1542913114788331620)
    await sendSecretAuditLog(interaction.client, {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`## 🕵️ [GİZLİ DENETİM] Yeni İtiraf Paylaşıldı (#${nextId})`),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.text(
            `👤 **Gerçek Yazar:** <@${userId}> (\`${userId}\`)\n` +
            `🎭 **Anonim Rumuz:** ${anonymousName}\n` +
            `📂 **Kategori:** ${category} • **Tür:** ${type}\n` +
            `⏳ **İmha Süresi:** ${expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : 'Süresiz'}\n` +
            (poll ? `📊 **Anket:** ${poll.question} (${poll.optionA.text} / ${poll.optionB.text})\n` : '') +
            `💬 **Anonim DM İzni:** ${allowDm ? 'Açık' : 'Kapalı'}\n` +
            `🛡️ **Durum:** ${newConfession.status}\n\n` +
            `📝 **İtiraf Metni:**\n> ${content.replace(/\n/g, '\n> ')}`
          )
        ])
      ]
    });

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
 * 4. İtiraf Kartını Hazırlar (Tek Menü / Çift Buton Kuralı, Components V2, Accent Colorsuz)
 */
function buildConfessionV2Payload(confession) {
  const isPublic = confession.type === 'public';

  const authorDisplay = isPublic
    ? `👤 **Paylaşan:** <@${confession.authorId}>`
    : `🕵️ **Paylaşan:** ${confession.anonymousName}`;

  const contentDisplay = `> ${confession.content.replace(/\n/g, '\n> ')}`;
  const dmStatus = confession.allowDm ? 'Açık 💬' : 'Kapalı 🔒';
  const timestamp = Math.floor(new Date(confession.createdAt || Date.now()).getTime() / 1000);

  const shockCount = confession.reactions?.shock || 0;
  const laughCount = confession.reactions?.laugh || 0;
  const redflagCount = confession.reactions?.redflag || 0;
  const supportCount = confession.reactions?.support || 0;

  const reactionSummary = `🔥 ${shockCount} • 😂 ${laughCount} • 🚩 ${redflagCount} • ❤️ ${supportCount}`;

  // Anket varsa görselleştir
  let pollDisplay = null;
  if (confession.poll && confession.poll.question) {
    const totalVotes = (confession.poll.optionA?.count || 0) + (confession.poll.optionB?.count || 0);
    const pctA = totalVotes > 0 ? Math.round(((confession.poll.optionA?.count || 0) / totalVotes) * 100) : 50;
    const pctB = totalVotes > 0 ? 100 - pctA : 50;

    pollDisplay =
      `📊 **Anket: ${confession.poll.question}**\n` +
      `${renderProgressBar(pctA)} **${pctA}%** • ${confession.poll.optionA?.text || 'Evet'} (${confession.poll.optionA?.count || 0} Oy)\n` +
      `${renderProgressBar(pctB)} **${pctB}%** • ${confession.poll.optionB?.text || 'Hayır'} (${confession.poll.optionB?.count || 0} Oy)`;
  }

  // İmha Süresi Göstergesi (Varsa)
  let expireDisplay = null;
  if (confession.expiresAt) {
    const expireSec = Math.floor(new Date(confession.expiresAt).getTime() / 1000);
    expireDisplay = `⏳ **İmha Süresi:** <t:${expireSec}:R> (Kalan Süre)`;
  }

  // Rozet (Varsa)
  const badgePrefix = confession.badge ? `${confession.badge} • ` : '';

  // Satır 1 (Sadece 2 Sade Buton):
  const mainRow = {
    type: 1, // ActionRow
    components: [
      {
        type: 2, // Button
        style: ButtonStyle.Primary,
        label: 'Anonim DM',
        emoji: { name: '💬' },
        custom_id: `confession_dm_author_${confession.confessionId}`,
        disabled: !confession.allowDm
      },
      {
        type: 2,
        style: ButtonStyle.Secondary,
        label: 'Tepki Ver / İşlemler',
        emoji: { name: '✨' },
        custom_id: `confession_actions_${confession.confessionId}`
      }
    ]
  };

  const containerComponents = [
    ComponentsV2Factory.text(`## ${badgePrefix}💬 İtiraf #${confession.confessionId} • ${confession.category}`),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.text(authorDisplay),
    ComponentsV2Factory.text(contentDisplay),
    ...(pollDisplay ? [ComponentsV2Factory.separator(false), ComponentsV2Factory.text(pollDisplay)] : []),
    ComponentsV2Factory.separator(true),
    ComponentsV2Factory.text(`**Tepkiler:** ${reactionSummary}`),
    ...(expireDisplay ? [ComponentsV2Factory.text(expireDisplay)] : []),
    ComponentsV2Factory.text(`*Anonim DM: ${dmStatus} • <t:${timestamp}:R>*`),
    ComponentsV2Factory.separator(false),
    mainRow
  ];

  return {
    flags: ComponentsV2Factory.FLAGS,
    components: [
      ComponentsV2Factory.container(containerComponents)
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

    // Kategori "Dertleşme / Tavsiye" ise özel destek odası aç
    const isSupportCategory = confession.category.toLowerCase().includes('dertleş') || confession.category.toLowerCase().includes('tavsiye');
    try {
      const threadName = isSupportCategory
        ? `🫂 Destek & Tavsiye Odası • İtiraf #${confession.confessionId}`
        : `🧵 İtiraf #${confession.confessionId} Tartışması`;

      const thread = await msg.startThread({
        name: threadName,
        autoArchiveDuration: 1440
      });
      confession.threadId = thread.id;

      if (isSupportCategory) {
        await thread.send({
          content: `💖 **Destek & Tavsiye Alanı (İtiraf #${confession.confessionId})**\nBu alt başlık itiraf sahibine moral vermek, dertleşmek ve yapıcı tavsiyeler paylaşmak için açılmıştır. Lütfen destekleyici, kibar ve saygılı olun!`
        });
      } else {
        await thread.send({
          content: `💭 **İtiraf #${confession.confessionId}** altına anonim veya açık yorumlarınızı paylaşabilirsiniz.`
        });
      }
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
 * 5. Tepki Ver / İşlemler Menüsü (Ephemeral Pop-up)
 */
async function openConfessionActions(interaction, confessionId) {
  try {
    const confession = await Confession.findOne({ confessionId: Number(confessionId) }).lean();
    if (!confession) {
      return interaction.reply({ content: '❌ İtiraf bulunamadı.', flags: 64 });
    }

    const shockCount = confession.reactions?.shock || 0;
    const laughCount = confession.reactions?.laugh || 0;
    const redflagCount = confession.reactions?.redflag || 0;
    const supportCount = confession.reactions?.support || 0;

    // Satır 1: Tepki Butonları
    const reactionRow = {
      type: 1,
      components: [
        { type: 2, style: ButtonStyle.Secondary, label: `Şok (${shockCount})`, emoji: { name: '🔥' }, custom_id: `confession_react_shock_${confessionId}` },
        { type: 2, style: ButtonStyle.Secondary, label: `Güldüm (${laughCount})`, emoji: { name: '😂' }, custom_id: `confession_react_laugh_${confessionId}` },
        { type: 2, style: ButtonStyle.Secondary, label: `Red Flag (${redflagCount})`, emoji: { name: '🚩' }, custom_id: `confession_react_redflag_${confessionId}` },
        { type: 2, style: ButtonStyle.Secondary, label: `Destek (${supportCount})`, emoji: { name: '❤️' }, custom_id: `confession_react_support_${confessionId}` }
      ]
    };

    const actionRows = [reactionRow];

    // Satır 2: Anket Butonları (Varsa)
    if (confession.poll && confession.poll.question) {
      const pollRow = {
        type: 1,
        components: [
          {
            type: 2,
            style: ButtonStyle.Primary,
            label: `Oy: ${confession.poll.optionA?.text || 'A'} (${confession.poll.optionA?.count || 0})`,
            emoji: { name: '📊' },
            custom_id: `confession_poll_vote_A_${confessionId}`
          },
          {
            type: 2,
            style: ButtonStyle.Primary,
            label: `Oy: ${confession.poll.optionB?.text || 'B'} (${confession.poll.optionB?.count || 0})`,
            emoji: { name: '📊' },
            custom_id: `confession_poll_vote_B_${confessionId}`
          }
        ]
      };
      actionRows.push(pollRow);
    }

    // Satır 3: Ek İşlemler (Bahşiş / Thread Yanıtı / Raporla)
    const extraRow = {
      type: 1,
      components: [
        {
          type: 2,
          style: ButtonStyle.Success,
          label: 'Anonim Bahşiş Gönder',
          emoji: { name: '🎁' },
          custom_id: `confession_tip_author_${confessionId}`
        },
        {
          type: 2,
          style: ButtonStyle.Secondary,
          label: 'Anonim Thread Yanıtı',
          emoji: { name: '💬' },
          custom_id: `confession_thread_reply_${confessionId}`
        },
        {
          type: 2,
          style: ButtonStyle.Danger,
          label: 'Moderasyona Raporla',
          emoji: { name: '🚩' },
          custom_id: `confession_report_${confessionId}`
        }
      ]
    };
    actionRows.push(extraRow);

    const actionPayload = {
      flags: ComponentsV2Factory.FLAGS | 64, // Ephemeral
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`### ✨ İtiraf #${confessionId} — Hızlı İşlem & Tepki Menüsü`),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.text('Aşağıdaki butonları kullanarak itirafa tepki verebilir, ankete oy kullanabilir veya yazara anonim jest yapabilirsiniz:'),
          ComponentsV2Factory.separator(false),
          ...actionRows
        ])
      ]
    };

    return interaction.reply(actionPayload);
  } catch (err) {
    logger.error('[ConfessionService] openConfessionActions Hatası:', err.message);
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
      confession.reactions[reactionType] = Math.max(0, (confession.reactions[reactionType] || 0) - 1);
      if (confession.userReactions instanceof Map) {
        confession.userReactions.delete(userId);
      } else {
        delete confession.userReactions[userId];
      }
    } else {
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

    // Ana kart mesajını güncelle
    await refreshConfessionMessage(interaction.client, confession);

    // 🕵️ [GİZLİ LOG] Tepki Güncellemesi
    await sendSecretAuditLog(interaction.client, {
      content: `🕵️ **[GİZLİ LOG] Tepki:** <@${userId}> (\`${userId}\`) ➔ **#${confessionId}** itirafına **${reactionType}** tepkisi verdi/güncelledi.`
    });

    return interaction.reply({ content: `✅ Tepkiniz (${reactionType}) kaydedildi/güncellendi!`, flags: 64 });
  } catch (err) {
    logger.error('[ConfessionService] handleConfessionReaction Hatası:', err.message);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Tepki verilirken bir hata oluştu.', flags: 64 }).catch(() => {});
    }
  }
}

/**
 * 7. Ankete Oy Verme İşlemi
 */
async function handleConfessionPollVote(interaction, confessionId, optionKey) {
  try {
    const userId = interaction.user.id;
    const confession = await Confession.findOne({ confessionId: Number(confessionId) });
    if (!confession || !confession.poll) {
      return interaction.reply({ content: '❌ Anket bulunamadı.', flags: 64 });
    }

    if (!confession.poll.voters) {
      confession.poll.voters = new Map();
    }

    const currentVote = confession.poll.voters instanceof Map
      ? confession.poll.voters.get(userId)
      : confession.poll.voters[userId];

    if (currentVote === optionKey) {
      return interaction.reply({ content: 'ℹ️ Bu şıkka zaten oy vermişsiniz.', flags: 64 });
    }

    if (currentVote === 'A' && confession.poll.optionA) {
      confession.poll.optionA.count = Math.max(0, confession.poll.optionA.count - 1);
    } else if (currentVote === 'B' && confession.poll.optionB) {
      confession.poll.optionB.count = Math.max(0, confession.poll.optionB.count - 1);
    }

    if (optionKey === 'A' && confession.poll.optionA) {
      confession.poll.optionA.count = (confession.poll.optionA.count || 0) + 1;
    } else if (optionKey === 'B' && confession.poll.optionB) {
      confession.poll.optionB.count = (confession.poll.optionB.count || 0) + 1;
    }

    if (confession.poll.voters instanceof Map) {
      confession.poll.voters.set(userId, optionKey);
    } else {
      confession.poll.voters[userId] = optionKey;
    }

    await confession.save();
    await refreshConfessionMessage(interaction.client, confession);

    const chosenText = optionKey === 'A' ? confession.poll.optionA.text : confession.poll.optionB.text;

    // 🕵️ [GİZLİ LOG] Anket Oyu
    await sendSecretAuditLog(interaction.client, {
      content: `🕵️ **[GİZLİ LOG] Anket Oyu:** <@${userId}> (\`${userId}\`) ➔ **#${confessionId}** anketinde **"${chosenText}"** (${optionKey}) şıkkına oy verdi.`
    });

    return interaction.reply({ content: `✅ Oyunuz **"${chosenText}"** olarak kaydedildi!`, flags: 64 });
  } catch (err) {
    logger.error('[ConfessionService] handleConfessionPollVote Hatası:', err.message);
  }
}

/**
 * Ana kanaldaki itiraf kartı mesajını günceller
 */
async function refreshConfessionMessage(client, confession) {
  try {
    if (!confession.messageId || !confession.channelId) return;
    const channel = await client.channels.fetch(confession.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;
    const msg = await channel.messages.fetch(confession.messageId).catch(() => null);
    if (msg) {
      const payload = buildConfessionV2Payload(confession);
      await msg.edit(payload).catch(() => {});
    }
  } catch (_) {}
}

/**
 * 8. Anonim Bahşiş Gönderme Modalı & Transferi
 */
async function openTipModal(interaction, targetIdOrSessionId, isSession = false) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`confession_modal_tip_${isSession ? 'session' : 'confession'}_${targetIdOrSessionId}`)
      .setTitle('🎁 Anonim Bahşiş Gönder');

    const amountInput = new TextInputBuilder()
      .setCustomId('tip_amount')
      .setLabel('Gönderilecek EkoCoin Miktarı (Örn: 25)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Örn: 25, 50, 100')
      .setRequired(true)
      .setMaxLength(10);

    modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
    await interaction.showModal(modal);
  } catch (err) {
    logger.error('[ConfessionService] openTipModal Hatası:', err.message);
  }
}

async function handleTipModalSubmit(interaction) {
  try {
    const senderId = interaction.user.id;
    const customId = interaction.customId;
    const isSession = customId.startsWith('confession_modal_tip_session_');
    const targetKey = customId.replace(isSession ? 'confession_modal_tip_session_' : 'confession_modal_tip_confession_', '');
    const amountStr = interaction.fields.getTextInputValue('tip_amount')?.trim();
    const amount = parseInt(amountStr, 10);

    if (isNaN(amount) || amount <= 0) {
      return interaction.reply({ content: '❌ Geçersiz bir miktar girdiniz!', flags: 64 });
    }

    let targetUserId = null;
    if (isSession) {
      const session = await ConfessionSession.findOne({ sessionId: targetKey }).lean();
      if (!session) return interaction.reply({ content: '❌ Oturum bulunamadı.', flags: 64 });
      targetUserId = session.authorId === senderId ? session.senderId : session.authorId;
    } else {
      const confession = await Confession.findOne({ confessionId: Number(targetKey) }).lean();
      if (!confession) return interaction.reply({ content: '❌ İtiraf bulunamadı.', flags: 64 });
      targetUserId = confession.authorId;
    }

    if (targetUserId === senderId) {
      return interaction.reply({ content: '❌ Kendinize bahşiş gönderemezsiniz.', flags: 64 });
    }

    // Gönderenin EkoCoin kontrolü
    const senderEco = await Economy.findOne({ userId: senderId });
    const currentBalance = (senderEco?.wallet || 0) + (senderEco?.balance || 0);

    if (currentBalance < amount) {
      return interaction.reply({
        content: `❌ Yetersiz bakiye! Mevcut bakiyeniz: **${currentBalance} EkoCoin**, Gönderilmek istenen: **${amount} EkoCoin**.`,
        flags: 64
      });
    }

    // Bakiye transferi
    if (senderEco) {
      if ((senderEco.wallet || 0) >= amount) {
        senderEco.wallet -= amount;
      } else {
        const rem = amount - (senderEco.wallet || 0);
        senderEco.wallet = 0;
        senderEco.bank = Math.max(0, (senderEco.bank || 0) - rem);
      }
      senderEco.totalSpent = (senderEco.totalSpent || 0) + amount;
      await senderEco.save();
    }

    let targetEco = await Economy.findOne({ userId: targetUserId });
    if (!targetEco) {
      targetEco = new Economy({ userId: targetUserId, wallet: amount });
    } else {
      targetEco.wallet = (targetEco.wallet || 0) + amount;
      targetEco.totalEarned = (targetEco.totalEarned || 0) + amount;
    }
    await targetEco.save();

    // 🕵️ [GİZLİ LOG] Anonim Bahşiş Transferi Logu
    await sendSecretAuditLog(interaction.client, {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text('## 🎁 [GİZLİ DENETİM] Anonim Bahşiş Transferi'),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.text(
            `📤 **Gönderen (Gerçek ID):** <@${senderId}> (\`${senderId}\`)\n` +
            `📥 **Alıcı (Gerçek ID):** <@${targetUserId}> (\`${targetUserId}\`)\n` +
            `💰 **Miktar:** **${amount} EkoCoin**\n` +
            `📌 **Hedef / Oturum:** \`${targetKey}\``
          )
        ])
      ]
    });

    // Alıcıya DM bildirimi
    const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
    if (targetUser) {
      await targetUser.send({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text('## 🎁 Tebrikler! Anonim Bahşiş Aldınız!'),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(
              `Bir topluluk üyesi size **${amount} EkoCoin** anonim bahşiş gönderdi!\n` +
              'EkoCoin cüzdan bakiyenize başarıyla eklendi.'
            )
          ])
        ]
      }).catch(() => {});
    }

    return interaction.reply({
      content: `🎉 **${amount} EkoCoin** tutarındaki anonim bahşişiniz başarıyla iletildi!`,
      flags: 64
    });
  } catch (err) {
    logger.error('[ConfessionService] handleTipModalSubmit Hatası:', err.message);
  }
}

/**
 * 9. Anonim DM Köprüsü Başlatma & Ortak Rol Bilgisi (Ghost Bridge)
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

    // Aktif oturum kontrolü
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

    // Ortak rol sayısı
    const commonRoles = await getCommonRoleCount(interaction.client, confession.authorId, senderId);

    // 🕵️ [GİZLİ LOG] Yeni DM Köprüsü Talebi
    await sendSecretAuditLog(interaction.client, {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`## 🔗 [GİZLİ DENETİM] Yeni DM Köprüsü Talebi (\`${sessionId}\`)`),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.text(
            `📌 **İtiraf ID:** #${confessionId}\n` +
            `✍️ **İtiraf Sahibi:** <@${confession.authorId}> (\`${confession.authorId}\`)\n` +
            `🕵️ **Anonim DM Başlatan:** <@${senderId}> (\`${senderId}\`)\n` +
            `ℹ️ **Ortak Sunucu Rol Sayısı:** ${commonRoles}`
          )
        ])
      ]
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
              `ℹ️ *İpucu: Bu kullanıcı ile ${commonRoles} ortak sunucu rolünüz var.*\n` +
              '🔒 **Güvenlik:** Kimliğin ve profilin karşı tarafa asla gösterilmez.'
            ),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.actionRow([
              { custom_id: `confession_bridge_accept_${sessionId}`, label: 'Kabul Et', style: ButtonStyle.Success, emoji: { name: '✅' } },
              { custom_id: `confession_bridge_reject_${sessionId}`, label: 'Reddet', style: ButtonStyle.Danger, emoji: { name: '❌' } }
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
 * 10. DM Köprüsü Butonları & Handshake (Gizli El Sıkışma Protokolü)
 */
async function handleBridgeButton(interaction, action, sessionId) {
  try {
    const session = await ConfessionSession.findOne({ sessionId });
    if (!session) {
      return interaction.reply({ content: '❌ Bu DM oturumu bulunamadı veya süresi doldu.', flags: 64 });
    }

    const client = interaction.client;
    const userId = interaction.user.id;
    const isAuthor = session.authorId === userId;
    const commonRoles = await getCommonRoleCount(client, session.authorId, session.senderId);

    // 🕵️ [GİZLİ LOG] DM Köprüsü Aksiyonu
    await sendSecretAuditLog(client, {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`## 🔄 [GİZLİ DENETİM] DM Köprüsü İşlemi (\`${sessionId}\`)`),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.text(
            `📌 **İtiraf ID:** #${session.confessionId}\n` +
            `👤 **Tıklayan:** <@${userId}> (\`${userId}\`)\n` +
            `✍️ **İtiraf Sahibi:** <@${session.authorId}> (\`${session.authorId}\`)\n` +
            `🕵️ **Anonim Konuşmacı:** <@${session.senderId}> (\`${session.senderId}\`)\n` +
            `⚡ **İşlem:** \`${action}\``
          )
        ])
      ]
    });

    const getBridgeControls = (sId) => [
      { custom_id: `confession_bridge_reveal_${sId}`, label: 'Kimliğimi Açıkla', style: ButtonStyle.Primary, emoji: { name: '🤝' } },
      { custom_id: `confession_bridge_tip_${sId}`, label: 'Bahşiş Gönder', style: ButtonStyle.Success, emoji: { name: '🎁' } },
      { custom_id: `confession_bridge_close_${sId}`, label: 'Sohbeti Kapat', style: ButtonStyle.Secondary, emoji: { name: '🛑' } }
    ];

    if (action === 'accept') {
      if (!isAuthor) {
        return interaction.reply({ content: '❌ Bu isteği yalnızca itiraf sahibi onaylayabilir.', flags: 64 });
      }

      session.status = 'active';
      await session.save();

      await interaction.update({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text('## 🟢 Anonim Köprü Bağlantısı Aktif!'),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(
              `**#${session.confessionId}** itirafı için anonim bağlantı kuruldu.\n` +
              `ℹ️ *İpucu: Bu kullanıcı ile ${commonRoles} ortak sunucu rolünüz var.*\n\n` +
              'Artık bu DM kanalına yazacağınız her mesaj karşı tarafa `📝 İtiraf Sahibi` rumuzuyla aktarılacaktır.'
            ),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.actionRow(getBridgeControls(sessionId))
          ])
        ]
      });

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
                `ℹ️ *İpucu: Bu kullanıcı ile ${commonRoles} ortak sunucu rolünüz var.*\n\n` +
                'Artık bu DM kanalına yazacağınız her mesaj yazara `🕵️ Anonim Konuşmacı` rumuzuyla aktarılacaktır.'
              ),
              ComponentsV2Factory.separator(true),
              ComponentsV2Factory.actionRow(getBridgeControls(sessionId))
            ])
          ]
        }).catch(() => {});
      }
    } else if (action === 'reject') {
      if (!isAuthor) {
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
    } else if (action === 'reveal') {
      if (!session.handshake) {
        session.handshake = { authorRevealed: false, senderRevealed: false };
      }

      if (isAuthor) {
        session.handshake.authorRevealed = true;
      } else {
        session.handshake.senderRevealed = true;
      }
      await session.save();

      const otherUserId = isAuthor ? session.senderId : session.authorId;
      const otherUser = await client.users.fetch(otherUserId).catch(() => null);

      if (session.handshake.authorRevealed && session.handshake.senderRevealed) {
        const authorUser = await client.users.fetch(session.authorId).catch(() => null);
        const revealText =
          `🎉 **Kimlikler Karşılıklı Olarak Açıklandı!**\n\n` +
          `✍️ **İtiraf Sahibi:** <@${session.authorId}> (${authorUser?.tag || session.authorId})\n` +
          `🕵️ **Anonim Konuşmacı:** <@${session.senderId}> (${otherUser?.tag || session.senderId})`;

        await interaction.reply({ content: revealText });
        if (otherUser) await otherUser.send(revealText).catch(() => {});
      } else {
        await interaction.reply({
          content: '🤝 Kimlik açma talebiniz karşı tarafa iletildi. Karşı taraf da onayladığında kimlikler açıklanacaktır.',
          flags: 64
        });

        if (otherUser) {
          await otherUser.send({
            flags: ComponentsV2Factory.FLAGS,
            components: [
              ComponentsV2Factory.container([
                ComponentsV2Factory.text('## 🤝 Kimlik Açıklama Talebi'),
                ComponentsV2Factory.separator(true),
                ComponentsV2Factory.text(
                  'Sohbet ettiğiniz kişi kimliğini karşılıklı olarak açıklamak istiyor.\n' +
                  'Siz de onaylıyor musunuz?'
                ),
                ComponentsV2Factory.separator(true),
                ComponentsV2Factory.actionRow([
                  { custom_id: `confession_bridge_reveal_accept_${sessionId}`, label: 'Kabul Et (Kimliğimi Aç)', style: ButtonStyle.Success, emoji: { name: '✅' } },
                  { custom_id: `confession_bridge_reveal_reject_${sessionId}`, label: 'Reddet', style: ButtonStyle.Danger, emoji: { name: '❌' } }
                ])
              ])
            ]
          }).catch(() => {});
        }
      }
    } else if (action === 'reveal_accept') {
      if (!session.handshake) {
        session.handshake = { authorRevealed: false, senderRevealed: false };
      }
      if (isAuthor) session.handshake.authorRevealed = true;
      else session.handshake.senderRevealed = true;
      await session.save();

      const authorUser = await client.users.fetch(session.authorId).catch(() => null);
      const senderUser = await client.users.fetch(session.senderId).catch(() => null);

      const revealPayload = {
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text('## 🎉 Kimlikler Açıklandı!'),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(
              `✍️ **İtiraf Sahibi:** <@${session.authorId}> (${authorUser?.tag || session.authorId})\n` +
              `🕵️ **Konuşmacı:** <@${session.senderId}> (${senderUser?.tag || session.senderId})`
            )
          ])
        ]
      };

      await interaction.update(revealPayload);
      const otherUser = isAuthor ? senderUser : authorUser;
      if (otherUser) await otherUser.send(revealPayload).catch(() => {});
    } else if (action === 'reveal_reject') {
      await interaction.update({
        content: '❌ Kimlik açıklama talebini reddettiniz. Sohbet anonim olarak devam ediyor.',
        components: []
      });
      const otherUserId = isAuthor ? session.senderId : session.authorId;
      const otherUser = await client.users.fetch(otherUserId).catch(() => null);
      if (otherUser) {
        await otherUser.send('ℹ️ Karşı taraf kimlik açıklama talebini onaylamadı. Sohbet anonim olarak devam ediyor.').catch(() => {});
      }
    } else if (action === 'tip') {
      return openTipModal(interaction, sessionId, true);
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
      const otherUserId = isAuthor ? session.senderId : session.authorId;
      const otherUser = await client.users.fetch(otherUserId).catch(() => null);
      if (otherUser) await otherUser.send(closePayload).catch(() => {});
    }
  } catch (err) {
    logger.error('[ConfessionService] handleBridgeButton Hatası:', err.message);
  }
}

/**
 * 11. DM Mesaj Yönlendirme (Relay) & Gizli Mesaj Loglama
 */
async function handleDirectMessageRelay(message) {
  try {
    if (!message || message.author.bot || message.channel.type !== ChannelType.DM) return false;

    const userId = message.author.id;
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

    activeSession.messages.push({
      sender: senderRole,
      content: message.content,
      timestamp: new Date()
    });
    if (activeSession.messages.length > 30) {
      activeSession.messages = activeSession.messages.slice(-30);
    }
    await activeSession.save();

    // 🕵️ [GİZLİ LOG] DM Köprüsü Üzerinden Atılan Mesajı Gizli Kanala İlet
    await sendSecretAuditLog(message.client, {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`## 💬 [GİZLİ DENETİM] DM Köprüsü Mesajı (\`${activeSession.sessionId}\`)`),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.text(
            `📌 **İtiraf ID:** #${activeSession.confessionId}\n` +
            `📤 **Gönderen (Gerçek ID):** <@${userId}> (\`${userId}\`) [${isAuthor ? 'İtiraf Sahibi' : 'Anonim Konuşmacı'}]\n` +
            `📥 **Alıcı (Gerçek ID):** <@${targetUserId}> (\`${targetUserId}\`)\n\n` +
            `💬 **Mesaj:**\n> ${message.content.replace(/\n/g, '\n> ')}`
          )
        ])
      ]
    });

    await targetUser.send({
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`${senderTitle}:\n> ${message.content.replace(/\n/g, '\n> ')}`),
          ComponentsV2Factory.separator(false),
          ComponentsV2Factory.actionRow([
            { custom_id: `confession_bridge_reveal_${activeSession.sessionId}`, label: 'Kimliğimi Açıkla', style: ButtonStyle.Primary, emoji: { name: '🤝' } },
            { custom_id: `confession_bridge_tip_${activeSession.sessionId}`, label: 'Bahşiş Gönder', style: ButtonStyle.Success, emoji: { name: '🎁' } },
            { custom_id: `confession_bridge_close_${activeSession.sessionId}`, label: 'Sohbeti Kapat', style: ButtonStyle.Secondary, emoji: { name: '🛑' } }
          ])
        ])
      ]
    });

    await message.react('✉️').catch(() => {});
    return true;
  } catch (err) {
    logger.error('[ConfessionService] handleDirectMessageRelay Hatası:', err.message);
    return false;
  }
}

/**
 * 12. Her Pazar 07:00 Haftanın / Ayın / Yılın İtirafını Belirleme & İmha Cron Görevleri
 */
function initConfessionSchedulers(client) {
  cron.schedule('0 7 * * 0', async () => {
    logger.info('[ConfessionService] Pazar 07:00 haftalık itiraf değerlendirmesi başlatılıyor...');
    await selectTopConfessions(client);
  });

  setInterval(async () => {
    try {
      const now = new Date();
      const expiredConfessions = await Confession.find({
        expiresAt: { $lte: now },
        isExpired: { $ne: true }
      });

      for (const conf of expiredConfessions) {
        conf.isExpired = true;
        await conf.save();

        if (conf.messageId && conf.channelId) {
          const ch = await client.channels.fetch(conf.channelId).catch(() => null);
          if (ch) {
            const msg = await ch.messages.fetch(conf.messageId).catch(() => null);
            if (msg) {
              await msg.delete().catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      logger.error('[ConfessionService] İmha temizleme hatası:', e.message);
    }
  }, 2 * 60 * 1000);
}

async function selectTopConfessions(client) {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyConfessions = await Confession.find({
      createdAt: { $gte: oneWeekAgo },
      status: 'approved'
    }).lean();

    if (weeklyConfessions.length === 0) return;

    const getScore = (c) => (c.reactions?.shock || 0) + (c.reactions?.laugh || 0) + (c.reactions?.support || 0) + ((c.reactions?.redflag || 0) * 0.5);
    weeklyConfessions.sort((a, b) => getScore(b) - getScore(a));

    const topWeekly = weeklyConfessions[0];
    if (!topWeekly) return;

    const confDoc = await Confession.findOne({ confessionId: topWeekly.confessionId });
    if (confDoc) {
      confDoc.badge = '👑 Haftanın İtirafı';
      await confDoc.save();
      await refreshConfessionMessage(client, confDoc);
    }

    const feedChan = await client.channels.fetch(CONFESSION_FEED_CHANNEL_ID).catch(() => null);
    if (feedChan && feedChan.isTextBased()) {
      await feedChan.send({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text('## 👑 Haftanın İtirafı Seçildi!'),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(
              `Topluluk tarafından bu hafta en çok sevilen ve tepki alan itiraf belirlendi!\n\n` +
              `📌 **İtiraf ID:** #${topWeekly.confessionId} (${topWeekly.category})\n` +
              `> ${topWeekly.content.substring(0, 300)}...\n\n` +
              `❤️ Toplam Etkileşim: **${getScore(topWeekly)} Puan**`
            )
          ])
        ]
      });
    }
  } catch (err) {
    logger.error('[ConfessionService] selectTopConfessions Hatası:', err.message);
  }
}

/**
 * 13. Moderasyon Kuyruğu ve Raporlama
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
            { custom_id: `confession_mod_approve_${confession.confessionId}`, label: 'Onayla', style: ButtonStyle.Success, emoji: { name: '✅' } },
            { custom_id: `confession_mod_reject_${confession.confessionId}`, label: 'Reddet', style: ButtonStyle.Danger, emoji: { name: '❌' } },
            { custom_id: `confession_mod_blacklist_${confession.confessionId}`, label: 'Yazarı Engelle', style: ButtonStyle.Danger, emoji: { name: '🚫' } }
          ])
        ])
      ]
    };

    await modChannel.send(payload);
  } catch (err) {
    logger.error('[ConfessionService] sendToModQueue Hatası:', err.message);
  }
}

async function handleConfessionReport(interaction, confessionId) {
  try {
    const confession = await Confession.findOne({ confessionId: Number(confessionId) }).lean();
    if (!confession) return interaction.reply({ content: '❌ İtiraf bulunamadı.', flags: 64 });

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
              { custom_id: `confession_mod_reject_${confessionId}`, label: 'İtirafı Kaldır', style: ButtonStyle.Danger, emoji: { name: '🗑️' } },
              { custom_id: `confession_mod_blacklist_${confessionId}`, label: 'Yazarı Engelle', style: ButtonStyle.Danger, emoji: { name: '🚫' } }
            ])
          ])
        ]
      });
    }

    return interaction.reply({ content: '✅ Bildiriminiz moderasyon ekibine iletildi. Teşekkür ederiz.', flags: 64 });
  } catch (err) {
    logger.error('[ConfessionService] handleConfessionReport Hatası:', err.message);
  }
}

async function handleModQueueAction(interaction, action, confessionIdOrUserId) {
  try {
    const confessionId = Number(confessionIdOrUserId);
    const confession = await Confession.findOne({ confessionId });
    if (!confession) return interaction.reply({ content: '❌ İtiraf kaydı bulunamadı.', flags: 64 });

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
            ComponentsV2Factory.text(`İtiraf <@${interaction.user.id}> tarafından onaylandı ve yayınlandı.`)
          ])
        ]
      });
    } else if (action === 'reject') {
      confession.status = 'rejected';
      confession.reviewerId = interaction.user.id;
      await confession.save();

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
      await confession.save();

      await interaction.update({
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text(`## 🚫 Yazar Kara Listeye Alındı (#${confessionId})`),
            ComponentsV2Factory.separator(true),
            ComponentsV2Factory.text(`Yazar (<@${confession.authorId}>) <@${interaction.user.id}> tarafından kara listeye alındı.`)
          ])
        ]
      });
    }
  } catch (err) {
    logger.error('[ConfessionService] handleModQueueAction Hatası:', err.message);
  }
}

/**
 * 14. Thread Reply Modal & Submit
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
    if (!replyText) return interaction.reply({ content: '❌ Yorum boş olamaz!', flags: 64 });

    const confession = await Confession.findOne({ confessionId: Number(confessionId) }).lean();
    if (!confession) return interaction.reply({ content: '❌ İtiraf bulunamadı.', flags: 64 });

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

    if (!thread) return interaction.reply({ content: '❌ İtiraf alt başlığı bulunamadı.', flags: 64 });

    const alias = generateAnonymousName();
    await thread.send({ content: `🕵️ **${alias}:**\n> ${replyText.replace(/\n/g, '\n> ')}` });

    // 🕵️ [GİZLİ LOG] Anonim Thread Yorumu
    await sendSecretAuditLog(interaction.client, {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`## 🧵 [GİZLİ DENETİM] Anonim Thread Yorumu (#${confessionId})`),
          ComponentsV2Factory.separator(true),
          ComponentsV2Factory.text(
            `👤 **Gerçek Kullanıcı:** <@${interaction.user.id}> (\`${interaction.user.id}\`)\n` +
            `🎭 **Atanan Rumuz:** ${alias}\n` +
            `💬 **Yorum İçeriği:**\n> ${replyText.replace(/\n/g, '\n> ')}`
          )
        ])
      ]
    });

    return interaction.reply({ content: '✅ Yorumunuz kimliğiniz tamamen gizli tutularak thread altına iletildi!', flags: 64 });
  } catch (err) {
    logger.error('[ConfessionService] handleThreadReplyModalSubmit Hatası:', err.message);
  }
}

module.exports = {
  CONFESSION_PANEL_CHANNEL_ID,
  CONFESSION_FEED_CHANNEL_ID,
  CONFESSION_MOD_CHANNEL_ID,
  CONFESSION_SECRET_LOG_CHANNEL_ID,
  ensureConfessionPanel,
  openConfessionModal,
  handleConfessionModalSubmit,
  openConfessionActions,
  handleConfessionReaction,
  handleConfessionPollVote,
  openTipModal,
  handleTipModalSubmit,
  openThreadReplyModal,
  handleThreadReplyModalSubmit,
  handleConfessionReport,
  handleConfessionDMStart,
  handleBridgeButton,
  handleDirectMessageRelay,
  handleModQueueAction,
  initConfessionSchedulers,
  selectTopConfessions
};
