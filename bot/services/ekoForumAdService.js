'use strict';

const fs = require('fs');
const path = require('path');
const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Eko Yıldız — forum/reklam kanallarına açılan gönderiler için kural denetimi,
// DM teşekkür mesajı, tek seferlik öne çıkarma ve görünürlük çarkı.
const GUILD_ID = '1367646464804655104';
const FORUM_CATEGORY_ID = '1521539351031578684'; // reklam/forum kanalları kategorisi
const ANNOUNCE_CHANNEL_ID = '1521544387442507838'; // forum duyuru kanalı
const COOLDOWN_MS = 10 * 24 * 60 * 60 * 1000; // aynı anda tek paylaşım, 10 gün
const TICK_MS = 60 * 1000;
const PREFIX = 'ekoforum_';
const COLOR = 0x5865f2;

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'ekoForumAds.json');

// Çark ödülleri: interval = kaç dakikada bir öne çıkarılır, duration = toplam süre (dk)
const WHEEL_REWARDS = [
  { id: 'vis2h', label: '👁️ 2 Saatlik Görünürlük', weight: 30, duration: 120, interval: 30 },
  { id: 'boost1h', label: '🚀 1 Saatlik Boost', weight: 25, duration: 60, interval: 15 },
  { id: 'single', label: '⬆️ Ekstra Tek Seferlik Öne Çıkarma', weight: 30, duration: 0, interval: 0 },
  { id: 'none', label: '🍀 Bu sefer olmadı', weight: 15, duration: 0, interval: 0 }
];

const RULES_TEXT =
  '**📋 Temel Kurallar**\n' +
  '• Kanal yalnızca **"Askeri Kamp"** temalı sunucular içindir. Roblox askeri kampları ve benzeri içerikler **yasaktır.**\n' +
  '• Aynı anda birden fazla paylaşım yasaktır. Yeni paylaşım için mevcut paylaşımınızın üzerinden en az **10 gün** geçmelidir.\n' +
  '• Başkasının metnini/tanıtımını kopyalamak **doğrudan ban** sebebidir.\n' +
  '• Davet linkiniz **süresiz** olmalıdır; süreli/geçersiz linkli paylaşımlar uyarısız silinir.\n\n' +
  '**📝 Reklam Formatı**\n' +
  '• Form başlığına link koymak yasaktır; başlığa yalnızca kampınızın **açılımını veya kısaltmasını** yazın.\n' +
  '• Başkalarının reklam formları altına kendi reklamınızı yapmak yasaktır.\n' +
  '• Link göndermek serbesttir, ancak süresiz link kuralı zorunludur.';

const NO_MENTIONS = { parse: [] }; // @everyone/@here, rol ve kullanıcı etiketi yok

const LINK_REGEX = /(https?:\/\/|www\.|discord\.gg\/|discord(?:app)?\.com\/invite\/|\.gg\/)/i;
const INVITE_REGEX = /(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-z0-9-]+)/i;

let store = { users: {}, threads: {}, announceMsgId: null };
let tickTimer = null;

function loadStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    store = { users: raw.users || {}, threads: raw.threads || {}, announceMsgId: raw.announceMsgId || null };
  } catch {
    store = { users: {}, threads: {} };
  }
}

function saveStore() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('[EkoForumAd] Kayıt yazılamadı:', err.message);
  }
}

function isTargetThread(thread) {
  return thread?.guild?.id === GUILD_ID &&
    thread.parentId !== ANNOUNCE_CHANNEL_ID &&
    thread.parent?.parentId === FORUM_CATEGORY_ID &&
    [ChannelType.GuildForum, ChannelType.GuildMedia].includes(thread.parent?.type);
}

async function sendDM(user, payload) {
  return user.send({ ...payload, allowedMentions: NO_MENTIONS }).catch(() => null);
}

async function removeThread(thread, user, reason) {
  await sendDM(user, {
    embeds: [new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('❌ Paylaşımınız kaldırıldı')
      .setDescription(`**${thread.name}** başlıklı paylaşımınız kaldırıldı.\n\n**Sebep:** ${reason}\n\n${RULES_TEXT}`)
      .setFooter({ text: 'Eko Yıldız • Reklam Sistemi' })]
  });
  await thread.delete(`Forum kuralı: ${reason}`).catch(() => {});
}

// Davet linki süresiz mi? (maxAge 0 = süresiz). Doğrulanamazsa dokunmuyoruz.
async function checkInvite(client, content) {
  const match = content?.match(INVITE_REGEX);
  if (!match) return { ok: true };
  const invite = await client.fetchInvite(match[1]).catch(err => (err?.code === 10006 ? 'invalid' : null));
  if (invite === 'invalid') return { ok: false, reason: 'Davet linki geçersiz.' };
  if (invite && invite.maxAge) return { ok: false, reason: 'Davet linki süreli; yalnızca **süresiz** linkler kabul edilir.' };
  return { ok: true };
}

function buildThanksPayload(thread) {
  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('⭐ Reklamınız / forumunuz için teşekkürler!')
    .setDescription(
      `**${thread.name}** paylaşımınız <#${thread.parentId}> kanalında yayında.\n\n` +
      'Eko Yıldız\'da reklam yapmak çok kolay! Dilerseniz aşağıdaki butona tıklayarak reklamınızın forum içindeki ' +
      '**görünürlüğünü tek seferliğine artırabilir**, ya da **çark çevirip** 2 saatlik görünürlük, 1 saatlik boost gibi özellikler kazanabilirsiniz.\n\n' +
      RULES_TEXT
    )
    .setFooter({ text: 'Eko Yıldız • Reklam Sistemi' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${PREFIX}bump_${thread.id}`).setLabel('Görünürlüğü Artır (Tek Seferlik)').setEmoji('⬆️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`${PREFIX}spin_${thread.id}`).setLabel('Çark Çevir').setEmoji('🎡').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setLabel('Paylaşıma Git').setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${GUILD_ID}/${thread.id}`)
  );
  return { embeds: [embed], components: [row] };
}

// Gönderiye mesaj atarak "son etkinlik" sıralamasında en üste taşır; önceki bump mesajı silinir.
async function bumpThread(client, threadId, label = 'öne çıkarıldı') {
  const thread = await client.channels.fetch(threadId).catch(() => null);
  if (!thread) return false;
  if (thread.archived) await thread.setArchived(false).catch(() => {});

  const rec = store.threads[threadId] || (store.threads[threadId] = {});
  if (rec.lastBumpMsgId) {
    await thread.messages.delete(rec.lastBumpMsgId).catch(() => {});
  }
  const msg = await thread.send({
    allowedMentions: NO_MENTIONS,
    embeds: [new EmbedBuilder().setColor(0xfee75c).setDescription(`🚀 Bu reklam Eko Yıldız sistemiyle **${label}**.`)]
  }).catch(() => null);
  if (!msg) return false;
  rec.lastBumpMsgId = msg.id;
  saveStore();
  return true;
}

// Duyuru kanalına kurallar + sistem tanıtımını bir kez gönderir, sonraki açılışlarda günceller.
async function ensureAnnouncement(client) {
  const channel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID).catch(() => null);
  if (!channel) return;
  const payload = {
    allowedMentions: NO_MENTIONS,
    embeds: [new EmbedBuilder()
      .setColor(COLOR)
      .setTitle('📢 Eko Yıldız Reklam & Forum Sistemi')
      .setDescription(
        'Forum kanallarına reklamınızı açtığınızda bot size **DM\'den** ulaşır. Oradan reklamınızı ' +
        '**tek seferliğine öne çıkarabilir** veya **çark çevirip** 2 saatlik görünürlük, 1 saatlik boost gibi ödüller kazanabilirsiniz.\n\n' +
        'Kurallara uymayan paylaşımlar otomatik olarak kaldırılır.\n\n' + RULES_TEXT
      )
      .setFooter({ text: 'Eko Yıldız • Reklam Sistemi' })]
  };

  if (channel.type === ChannelType.GuildForum || channel.type === ChannelType.GuildMedia) {
    const existing = store.announceMsgId && await channel.threads.fetch(store.announceMsgId).catch(() => null);
    if (existing) {
      const starter = await existing.fetchStarterMessage().catch(() => null);
      if (starter) return starter.edit(payload).catch(() => {});
    }
    const thread = await channel.threads.create({ name: '📋 Reklam Kuralları & Sistem', message: payload }).catch(() => null);
    if (thread) { await thread.pin().catch(() => {}); store.announceMsgId = thread.id; saveStore(); }
    return;
  }

  // Kayıtlı id kaybolsa bile kanaldaki mevcut duyuruyu bul; kopyaları temizle, yalnızca hiç yoksa gönder.
  const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (!recent) return; // Kanal okunamadıysa yeni mesaj atma (her açılışta kopya oluşmasın)
  const ours = [...recent.filter(m =>
    m.author?.id === client.user.id &&
    (m.id === store.announceMsgId || JSON.stringify(m.toJSON()).includes('Reklam & Forum Sistemi'))
  ).values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  if (ours.length > 0) {
    const [keep, ...duplicates] = ours;
    for (const dup of duplicates) await dup.delete().catch(() => {});
    if (store.announceMsgId !== keep.id) { store.announceMsgId = keep.id; saveStore(); }
    return;
  }

  const msg = await channel.send(payload).catch(() => null);
  if (msg) { store.announceMsgId = msg.id; saveStore(); }
}

function rollWheel() {
  const total = WHEEL_REWARDS.reduce((s, r) => s + r.weight, 0);
  let n = Math.random() * total;
  for (const r of WHEEL_REWARDS) {
    if ((n -= r.weight) < 0) return r;
  }
  return WHEEL_REWARDS[WHEEL_REWARDS.length - 1];
}

async function handleThreadCreate(thread, newlyCreated) {
  if (!newlyCreated || !isTargetThread(thread)) return;

  const ownerId = thread.ownerId;
  const user = await thread.client.users.fetch(ownerId).catch(() => null);
  if (!user || user.bot) return;

  // Başlıkta link yasağı
  if (LINK_REGEX.test(thread.name)) {
    return removeThread(thread, user, 'Form başlığına link koymak yasaktır. Başlığa yalnızca kampınızın açılımını veya kısaltmasını yazın.');
  }

  // Aynı anda tek paylaşım / 10 gün kuralı (önceki paylaşım hâlâ duruyorsa)
  const prev = store.users[ownerId];
  if (prev && prev.threadId !== thread.id && Date.now() - prev.createdAt < COOLDOWN_MS) {
    const prevThread = await thread.client.channels.fetch(prev.threadId).catch(() => null);
    if (prevThread) {
      const remainingDays = Math.ceil((COOLDOWN_MS - (Date.now() - prev.createdAt)) / 86400000);
      return removeThread(thread, user, `Aynı anda birden fazla paylaşım yasaktır. Yeni paylaşım için **${remainingDays} gün** daha beklemelisiniz (mevcut paylaşım: <#${prev.threadId}>).`);
    }
  }

  // Süresiz davet linki kontrolü (ilk mesaj, gönderinin oluşmasını kısaca bekle)
  await new Promise(r => setTimeout(r, 1500));
  const starter = await thread.fetchStarterMessage().catch(() => null);
  const inviteCheck = await checkInvite(thread.client, starter?.content);
  if (!inviteCheck.ok) return removeThread(thread, user, inviteCheck.reason);

  store.users[ownerId] = { threadId: thread.id, createdAt: Date.now() };
  store.threads[thread.id] = { ownerId, bumpUsed: false, spinUsed: false };
  saveStore();

  await sendDM(user, buildThanksPayload(thread));
}

async function handleInteraction(interaction) {
  const [action, threadId] = interaction.customId.slice(PREFIX.length).split('_');
  const rec = store.threads[threadId];
  if (!rec || rec.ownerId !== interaction.user.id) {
    return interaction.reply({ allowedMentions: NO_MENTIONS, content: '❌ Bu paylaşım bulunamadı veya size ait değil.', ephemeral: true });
  }
  const thread = await interaction.client.channels.fetch(threadId).catch(() => null);
  if (!thread) {
    return interaction.reply({ allowedMentions: NO_MENTIONS, content: '❌ Paylaşım artık mevcut değil.', ephemeral: true });
  }

  if (action === 'bump') {
    if (rec.bumpUsed) return interaction.reply({ allowedMentions: NO_MENTIONS, content: '⚠️ Tek seferlik öne çıkarma hakkınızı zaten kullandınız.', ephemeral: true });
    rec.bumpUsed = true;
    saveStore();
    const ok = await bumpThread(interaction.client, threadId);
    return interaction.reply({ allowedMentions: NO_MENTIONS, content: ok ? `✅ **${thread.name}** forumda en üste taşındı!` : '❌ Öne çıkarma başarısız oldu.', ephemeral: true });
  }

  if (action === 'spin') {
    if (rec.spinUsed) return interaction.reply({ allowedMentions: NO_MENTIONS, content: '⚠️ Bu paylaşım için çark hakkınızı zaten kullandınız.', ephemeral: true });
    rec.spinUsed = true;
    const reward = rollWheel();

    let resultText;
    if (reward.duration) {
      rec.boost = { label: reward.label, endAt: Date.now() + reward.duration * 60000, intervalMs: reward.interval * 60000, nextAt: Date.now() };
      resultText = `🎉 Tebrikler! **${reward.label}** kazandınız. Paylaşımınız bu süre boyunca her **${reward.interval} dakikada bir** öne çıkarılacak.`;
    } else if (reward.id === 'single') {
      rec.bumpUsed = false;
      resultText = `🎉 **${reward.label}** kazandınız! "Görünürlüğü Artır" butonunu bir kez daha kullanabilirsiniz.`;
    } else {
      resultText = '🍀 Çark bu sefer boş geldi. Bir sonraki paylaşımınızda şansınızı tekrar deneyin!';
    }
    saveStore();
    if (rec.boost) runTick(interaction.client);

    return interaction.reply({
      allowedMentions: NO_MENTIONS,
      embeds: [new EmbedBuilder().setColor(COLOR).setTitle('🎡 Çark Sonucu').setDescription(resultText)]
    });
  }

  return interaction.reply({ allowedMentions: NO_MENTIONS, content: '❌ Bilinmeyen işlem.', ephemeral: true });
}

async function runTick(client) {
  const now = Date.now();
  for (const [threadId, rec] of Object.entries(store.threads)) {
    const boost = rec.boost;
    if (!boost) continue;
    if (now >= boost.endAt) {
      delete rec.boost;
      saveStore();
      continue;
    }
    if (now >= boost.nextAt) {
      boost.nextAt = now + boost.intervalMs;
      saveStore();
      const ok = await bumpThread(client, threadId, `${boost.label} ile öne çıkarıldı`);
      if (!ok) { delete rec.boost; saveStore(); }
    }
  }
}

function initEkoForumAdService(client) {
  if (!client || client.__ekoForumAdAttached) return;
  client.__ekoForumAdAttached = true;
  loadStore();

  client.on('threadCreate', (thread, newlyCreated) => {
    handleThreadCreate(thread, newlyCreated).catch(err => console.error('[EkoForumAd] threadCreate:', err.message));
  });

  client.on('threadDelete', (thread) => {
    if (store.threads[thread.id]) {
      delete store.threads[thread.id];
      saveStore();
    }
  });

  if (client.isReady()) ensureAnnouncement(client).catch(() => {});
  else client.once('ready', () => ensureAnnouncement(client).catch(err => console.error('[EkoForumAd] duyuru:', err.message)));

  if (!tickTimer) {
    tickTimer = setInterval(() => runTick(client).catch(err => console.error('[EkoForumAd] tick:', err.message)), TICK_MS);
  }
}

module.exports = {
  PREFIX,
  initEkoForumAdService,
  handleInteraction,
  handleThreadCreate
};
