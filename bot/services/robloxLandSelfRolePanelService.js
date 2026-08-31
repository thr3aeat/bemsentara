'use strict';

const {
  ActionRowBuilder,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder
} = require('discord.js');
const { appMeta, saveStoreNow } = require('../../models/Store');

const GUILD_ID = '1537407325290237973';
const CHANNEL_ID = '1538466308688183367';
const PANEL_META_KEY = 'robloxLandSelfRolePanelMsgId';

const ROLE_IDS = Object.freeze({
  region_tr: '1538467367632371732',
  region_foreign: '1538467471831343214',
  interest_map: '1538466342490083348',
  interest_system: '1538466418616565872',
  interest_gfx: '1538466527295316008',
  interest_model: '1538466630470996038',
  profile_male: '1543558001376497795',
  profile_female: '1543589775036907609',
  notification_giveaway: '1538467107359162400'
});

const REGION_ROLE_IDS = [ROLE_IDS.region_tr, ROLE_IDS.region_foreign];
const PROFILE_ROLE_IDS = [ROLE_IDS.profile_male, ROLE_IDS.profile_female];
const INTEREST_ROLE_IDS = [
  ROLE_IDS.interest_map,
  ROLE_IDS.interest_system,
  ROLE_IDS.interest_gfx,
  ROLE_IDS.interest_model
];

function option(label, value, description, emoji) {
  return new StringSelectMenuOptionBuilder()
    .setLabel(label)
    .setValue(value)
    .setDescription(description)
    .setEmoji(emoji);
}

function buildSelfRolePanelPayload() {
  const regionMenu = new StringSelectMenuBuilder()
    .setCustomId('rl_selfrole_region')
    .setPlaceholder('🌍 Bölgeni seç — pasaport sormuyoruz')
    .addOptions(
      option('Türk Üye', 'region_tr', 'Türkiye topluluğu rolünü al.', '🇹🇷'),
      option('Yabancı Üye', 'region_foreign', 'Uluslararası topluluk rolünü al.', '🌍'),
      option('Bölge rolümü kaldır', 'region_none', 'Bavulları topladım; bölge rolünü kaldır.', '🧳')
    );

  const interestMenu = new StringSelectMenuBuilder()
    .setCustomId('rl_selfrole_interests')
    .setPlaceholder('🧰 İlgi alanlarını aç/kapat — hepsi bedava')
    .setMinValues(1)
    .setMaxValues(4)
    .addOptions(
      option('Map', 'interest_map', 'Harita yapanlar, kaybolmayanlar ve kaybolanlar.', '🗺️'),
      option('Sistem', 'interest_system', 'Kod, mekanik ve “bende çalışıyor” ekibi.', '⚙️'),
      option('GFX', 'interest_gfx', 'Piksel cilalayan yaratıcı ekip.', '🎨'),
      option('Model', 'interest_model', 'Parçaları birleştirip evren kuranlar.', '🧱')
    );

  const profileMenu = new StringSelectMenuBuilder()
    .setCustomId('rl_selfrole_profile')
    .setPlaceholder('👤 Profil rolünü seç')
    .addOptions(
      option('Erkek', 'profile_male', 'Erkek profil rolünü al.', '👨'),
      option('Kız', 'profile_female', 'Kız profil rolünü al.', '👩'),
      option('Profil rolümü kaldır', 'profile_none', 'Bu alanı boş bırak.', '🫥')
    );

  const notificationMenu = new StringSelectMenuBuilder()
    .setCustomId('rl_selfrole_notifications')
    .setPlaceholder('🎁 Çekiliş bildirimini aç/kapat')
    .addOptions(
      option('Çekiliş rolünü aç', 'giveaway_on', 'Ödül kokusu alınca haberin olsun.', '🎉'),
      option('Çekiliş rolünü kapat', 'giveaway_off', 'Şans bugünlük sessize alındı.', '🔕')
    );

  const container = new ContainerBuilder()
    // Bilerek accent color ayarlanmıyor.
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '## 🎭 RobloxLand Rol Dolabı\n' +
        '> Rolünü seç, karakterini tamamla. Yanlış seçim yaptıysan panik yok; bu dolabın iade fişi sonsuz.\n' +
        '-# Booster rolü Discord tarafından yönetildiği için bu panelden dağıtılmaz.'
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('### 🌍 Bölge Rolleri\nTek seçimlidir; yeni seçim eski bölge rolünün yerini alır.'))
    .addActionRowComponents(new ActionRowBuilder().addComponents(regionMenu))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('### 🛠️ İlgi Rolleri\nBirden fazla seçebilirsin. Seçtiğin roller açılır veya kapanır.'))
    .addActionRowComponents(new ActionRowBuilder().addComponents(interestMenu))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('### 👤 Profil Rolü\nTek seçimlidir; istediğin zaman değiştirebilir veya kaldırabilirsin.'))
    .addActionRowComponents(new ActionRowBuilder().addComponents(profileMenu))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
      '### 🎁 Bildirim Rolü\nÇekilişleri kaçırma… ya da huzurlu sessizliği seç.\n' +
      '-# Sentara • Rol büfesi 7/24 açık, kasiyer biraz robot.'
    ))
    .addActionRowComponents(new ActionRowBuilder().addComponents(notificationMenu));

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

function hasPanelMarker(message) {
  const json = message?.components?.map(component => component.toJSON?.() || component) || [];
  return JSON.stringify(json).includes('rl_selfrole_region');
}

async function ensureSelfRolePanel(client) {
  const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) return null;

  const channel = guild.channels.cache.get(CHANNEL_ID) || await guild.channels.fetch(CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased?.()) return null;

  const payload = buildSelfRolePanelPayload();
  let meta = appMeta?.findOne({ key: PANEL_META_KEY });
  let panelMessage = meta?.messageId
    ? await channel.messages.fetch(meta.messageId).catch(() => null)
    : null;

  if (!panelMessage) {
    const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    panelMessage = recent?.find(message => message.author?.id === client.user.id && hasPanelMarker(message)) || null;
  }

  if (panelMessage) {
    await panelMessage.edit(payload);
  } else {
    panelMessage = await channel.send(payload);
  }

  if (panelMessage && appMeta) {
    if (!meta) {
      meta = appMeta.create({ key: PANEL_META_KEY, messageId: panelMessage.id, channelId: CHANNEL_ID });
    } else {
      meta.messageId = panelMessage.id;
      meta.channelId = CHANNEL_ID;
      meta.save();
    }
    saveStoreNow();
  }

  console.log('✅ RobloxLand rol alma paneli hazır (Components V2, accentsiz).');
  return panelMessage;
}

async function applyRoleChanges(member, addIds, removeIds, reason) {
  const existing = new Set(member.roles.cache.keys());
  const removed = [];
  const added = [];
  const unavailable = [];

  for (const roleId of [...new Set(removeIds)]) {
    if (!existing.has(roleId)) continue;
    const role = member.guild.roles.cache.get(roleId);
    if (!role || role.managed || !role.editable) {
      unavailable.push(role?.name || roleId);
      continue;
    }
    await member.roles.remove(roleId, reason);
    existing.delete(roleId);
    removed.push(role.name);
  }

  for (const roleId of [...new Set(addIds)]) {
    if (existing.has(roleId)) continue;
    const role = member.guild.roles.cache.get(roleId);
    if (!role || role.managed || !role.editable) {
      unavailable.push(role?.name || roleId);
      continue;
    }
    await member.roles.add(roleId, reason);
    existing.add(roleId);
    added.push(role.name);
  }

  return { added, removed, unavailable };
}

function replyEphemeral(interaction, content) {
  const payload = { content, ephemeral: true };
  if (interaction.deferred || interaction.replied) return interaction.followUp(payload);
  return interaction.reply(payload);
}

async function handleSelfRoleInteraction(interaction) {
  if (!interaction.guild || interaction.guildId !== GUILD_ID) {
    return replyEphemeral(interaction, '🧭 Bu rol dolabı başka bir evrene ait.');
  }

  const member = interaction.member;
  if (!member?.roles?.cache) {
    return replyEphemeral(interaction, '❌ Üyelik bilgilerin alınamadı. Birkaç saniye sonra tekrar dene.');
  }

  const selected = interaction.values || [];
  const addIds = [];
  const removeIds = [];

  if (interaction.customId === 'rl_selfrole_region') {
    const value = selected[0];
    removeIds.push(...REGION_ROLE_IDS.filter(id => id !== ROLE_IDS[value]));
    if (ROLE_IDS[value]) addIds.push(ROLE_IDS[value]);
    if (value === 'region_none') removeIds.push(...REGION_ROLE_IDS);
  } else if (interaction.customId === 'rl_selfrole_profile') {
    const value = selected[0];
    removeIds.push(...PROFILE_ROLE_IDS.filter(id => id !== ROLE_IDS[value]));
    if (ROLE_IDS[value]) addIds.push(ROLE_IDS[value]);
    if (value === 'profile_none') removeIds.push(...PROFILE_ROLE_IDS);
  } else if (interaction.customId === 'rl_selfrole_interests') {
    for (const value of selected) {
      const roleId = ROLE_IDS[value];
      if (!INTEREST_ROLE_IDS.includes(roleId)) continue;
      if (member.roles.cache.has(roleId)) removeIds.push(roleId);
      else addIds.push(roleId);
    }
  } else if (interaction.customId === 'rl_selfrole_notifications') {
    if (selected[0] === 'giveaway_on') addIds.push(ROLE_IDS.notification_giveaway);
    if (selected[0] === 'giveaway_off') removeIds.push(ROLE_IDS.notification_giveaway);
  } else {
    return false;
  }

  try {
    const result = await applyRoleChanges(member, addIds, removeIds, `Kişisel rol paneli: ${interaction.user.tag}`);
    const lines = ['🎭 **Rol dolabın güncellendi!**'];
    if (result.added.length) lines.push(`✅ Eklendi: ${result.added.map(name => `**${name}**`).join(', ')}`);
    if (result.removed.length) lines.push(`🧹 Çıkarıldı: ${result.removed.map(name => `**${name}**`).join(', ')}`);
    if (!result.added.length && !result.removed.length) lines.push('🪞 Zaten böyle görünüyordun; dolap değişiklik yapmadı.');
    if (result.unavailable.length) lines.push(`⚠️ Botun erişemediği roller: ${result.unavailable.join(', ')}`);

    await replyEphemeral(interaction, lines.join('\n'));
  } catch (err) {
    console.error('[RobloxLandSelfRole] Role update error:', err.message);
    await replyEphemeral(interaction, '❌ Rol askısı biraz sıkıştı. Bot rolünün bu rollerin üstünde olduğundan emin olun.').catch(() => {});
  }

  return true;
}

module.exports = {
  GUILD_ID,
  CHANNEL_ID,
  ROLE_IDS,
  buildSelfRolePanelPayload,
  ensureSelfRolePanel,
  handleSelfRoleInteraction,
  applyRoleChanges
};
