'use strict';

// TMT ve BEM destek paneli: EkoYıldız destek paneliyle aynı düzen (Components V2, accent rengi yok).
// Kategori seçimi mevcut "tmt_support_category" / "support_category" akışını kullanır.

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const { BASE_URL, TMT_GUILD_ID, TMT_SUPPORT_CHANNEL_ID } = require('../../config');
const { appMeta, saveStoreNow } = require('../../models/Store');

const ACCOUNT_STATUS_ID = 'guild_support_account_status';

const PANELS = {
  tmt: {
    name: 'TMT | Turkish Armed Forces',
    selectId: 'tmt_support_category',
    linkPath: '/baglan/tmt',
    options: [
      { label: 'Discord Destek', value: 'discord', description: 'Discord sunucumuzla ilgili sorunlar', emoji: '📚' },
      { label: 'Oyun Destek', value: 'game', description: 'Oyunda yaşadığın sorunlar ve yardım', emoji: '💂' },
      { label: 'Hesap / Rol Sorunu', value: 'account', description: 'Roblox bağlama, rol ve rütbe sorunları', emoji: '👤' },
      { label: 'Şikayet', value: 'report', description: 'Bir kullanıcıyı veya kural ihlalini bildir', emoji: '❗' },
      { label: 'Diğer', value: 'other', description: 'Yukarıdakilere uymayan konular', emoji: '❓' }
    ]
  },
  bem: {
    name: 'BEM | Bursa Emniyet Müdürlüğü',
    selectId: 'support_category',
    linkPath: '/baglan/bem',
    options: [
      { label: 'Genel Destek', value: 'genel', description: 'Soru ve genel destek talepleri', emoji: '💬' },
      { label: 'Hesap / Rol Sorunu', value: 'account', description: 'Roblox bağlama, rol ve rütbe sorunları', emoji: '👤' },
      { label: 'Ban / Şikayet', value: 'ban', description: 'Birini şikayet et veya ban itirazı yap', emoji: '🔨' },
      { label: 'Kullanıcı Şikayet', value: 'report', description: 'Küfür, taciz veya kural ihlali bildir', emoji: '🚨' },
      { label: 'Teknik Sorun', value: 'technical', description: 'Bot veya site ile ilgili sorunlar', emoji: '🔧' },
      { label: 'Diğer', value: 'other', description: 'Yukarıdakilere uymayan konular', emoji: '📝' }
    ]
  }
};

function buildSupportPanel(key) {
  const panel = PANELS[key];
  const gap = () => new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## İletişim ve Destek · ${panel.name}`))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      '> Sorunların ve soruların için aşağıdan bir bölüm seç. Formu doldurduktan sonra yalnızca senin ve ' +
      'yetkili ekibin görebileceği özel bir kanal açılır.'
    ))
    .addSeparatorComponents(gap())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      '* **Talep açmadan önce;**\n' +
      '  * Troll, şaka veya deneme amaçlı talep açma.\n' +
      '  * Açık bir talebin varsa yeni bir tane açma.\n' +
      '  * Konuyu ve açıklamayı net yaz, kanıtlarını (SS, video, ID) hazırla.\n' +
      '  * Yetkilileri etiketleme, sabırlı ol.\n' +
      '  * Rol / rütbe sorunlarında önce **Hesap Durumum** butonuyla bağlantını kontrol et.'
    ))
    .addSeparatorComponents(gap())
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(panel.selectId)
        .setPlaceholder('İletişime geçmek istediğin bölümü seç')
        .addOptions(panel.options)
    ))
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${ACCOUNT_STATUS_ID}:${key}`).setLabel('Hesap Durumum').setEmoji('👤').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setURL(`${BASE_URL}/tickets`).setLabel('Taleplerim & Dosyalar').setEmoji('📂').setStyle(ButtonStyle.Link),
      new ButtonBuilder().setURL(`${BASE_URL}/yardim`).setLabel('Yardım Merkezi').setEmoji('❓').setStyle(ButtonStyle.Link)
    ));

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

// Kanalda tek panel tutar: kayıtlı mesajı günceller, yoksa botun eski panellerini silip yenisini gönderir.
async function ensureSupportPanel(channel, key) {
  const payload = buildSupportPanel(key);
  const metaKey = `guildSupportPanel_${key}_${channel.id}`;
  const meta = appMeta ? appMeta.findOne({ key: metaKey }) : null;

  const existing = meta?.messageId && await channel.messages.fetch(meta.messageId).catch(() => null);
  if (existing) return existing.edit(payload);

  const recent = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (recent) {
    for (const m of recent.values()) {
      if (m.author.id === channel.client.user.id) await m.delete().catch(() => {});
    }
  }

  const sent = await channel.send(payload);
  if (appMeta) {
    if (meta) { meta.messageId = sent.id; meta.save(); }
    else appMeta.create({ key: metaKey, messageId: sent.id, channelId: channel.id });
    saveStoreNow();
  }
  return sent;
}

async function ensureTMTSupportPanel(client) {
  const guild = await client.guilds.fetch(TMT_GUILD_ID).catch(() => null);
  const channel = guild && await guild.channels.fetch(TMT_SUPPORT_CHANNEL_ID).catch(() => null);
  if (channel) await ensureSupportPanel(channel, 'tmt');
}

async function handleAccountStatusButton(interaction) {
  const key = interaction.customId.split(':')[1] === 'tmt' ? 'tmt' : 'bem';
  const { findUserByDiscordId, hasRobloxLink } = require('../../utils/userLink');
  const Ticket = require('../../models/Ticket');

  const dbUser = await findUserByDiscordId(interaction.user.id);
  const robloxOk = hasRobloxLink(dbUser);
  const openTicket = await Ticket.findOne({ userId: interaction.user.id, status: 'open' }).catch(() => null);
  const linkUrl = `${BASE_URL}${PANELS[key].linkPath}`;

  const lines = [
    '## Hesap Durumum',
    `**Discord:** ✅ ${interaction.user.username}`,
    `**Roblox:** ${robloxOk ? `✅ ${dbUser.robloxUsername || dbUser.robloxId}` : '❌ Bağlı değil'}`,
    `**Site hesabı:** ${dbUser ? '✅ Var' : '❌ Yok (bağlarken otomatik oluşur)'}`,
    `**Açık destek talebi:** ${openTicket?.channelId ? `<#${openTicket.channelId}>` : 'Yok'}`
  ];

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')))
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setURL(linkUrl).setLabel(robloxOk ? 'Rollerimi Güncelle' : 'Hesabımı Bağla').setStyle(ButtonStyle.Link)
    ));

  return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
}

module.exports = {
  ACCOUNT_STATUS_ID,
  buildSupportPanel,
  ensureSupportPanel,
  ensureTMTSupportPanel,
  handleAccountStatusButton
};
