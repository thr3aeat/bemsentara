'use strict';

const {
  EmbedBuilder, ChannelType, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  AttachmentBuilder
} = require('discord.js');
const { chatWithAI } = require('./aiService');
const Ticket = require('../../models/Ticket');
const { generateTicketId } = require('../../utils/ticketId');
const {
  TARGET_GUILD_ID, TARGET_CHANNEL_ID,
  GUILD2_ID, GUILD2_TICKET_CATEGORY_ID,
} = require('../../config');

// userId → [{role, content}]
const dmConversations = new Map();
// userId → 'normal' | 'ai' | 'emergency_ai' | 'tech' | 'billing' | 'report' | 'ad' | 'general'
const dmModes = new Map();
// userId → { ticketId, channelId, guildId, locked: boolean, claimedBy: string }
const activeDMTickets = new Map();
// Onay bekleyen kullanıcılar: userId → true
const pendingConfirmation = new Map();
// Nudge cooldown: ticketId → timestamp
const userNudgeCooldown = new Map();

const EMERGENCY_SYSTEM_PROMPT = `Sen Sentara/EkoYıldız Discord sunucusunun Baş Emniyet ve Güvenlik Yapay Zekasısın.
Görevin sunucuda istila (raid), yetki suistimali (abuse), saldırganlık yapanları tespit etmek ve eğer botta bir spam/hata durumu varsa müdahale etmektir.

KULLANICI TALEP AKIŞLARI:

1. İstilacı/Abuseci/Saldırgan Bildirme & Müdahale:
- Kullanıcıdan şüpheli kişinin Discord ID'sini veya tam kullanıcı adını iste.
- Kullanıcıdan KANIT iste (kanıt olarak mesaj eki, ekran görüntüsü yüklemesi ZORUNLUDUR).
- Kullanıcı kanıt yüklediğinde (resim/dosya) ve ID/username paylaştığında, duruma göre şu acil komutlardan uygun olanını tetikle:
  - Kalıcı olarak engellemek/yasaklamak için: [BAN_EMERGENCY] <kullanıcı_id>
  - Sunucudan atmak için: [KICK_EMERGENCY] <kullanıcı_id>
  - Geçici olarak susturmak (timeout) için: [MUTE_EMERGENCY] <kullanıcı_id> <süre> (Örn: 1d, 12h, 30m - varsayılan belirtilmezse 1d'dir)
- Örnek yanıt: "Kanıt analiz edildi. Güvenlik gerekçesiyle işlem uygulanıyor. [BAN_EMERGENCY] 1444656401216442497"

2. Botun Spam Yapmasını Durdurma:
- Eğer kullanıcı botun bildirim/DM spamladığını söylerse ("bot spam atıyor", "bildirimleri durdur", "spamı engelle" vb.), hemen bu duruma müdahale et.
- Sistemi durdurmak için [STOP_SPAM] komutunu tetikle.
- Örnek yanıt: "Anlaşıldı! Botun spam yaptığı tespit edildi. Güvenlik protokolü gereği tüm bildirim planlayıcıları durduruluyor. [STOP_SPAM]"

Kurallar:
- Türkçe konuş. Son derece ciddi, otoriter, resmi ve emniyet gücü gibi davran.
- Köşeli parantez [ ] karakterlerini yalnızca yukarıdaki komutlar ([BAN_EMERGENCY], [KICK_EMERGENCY], [MUTE_EMERGENCY] veya [STOP_SPAM]) için kullan.`;

const DM_SYSTEM_PROMPT = `Sen Sentara/EkoYıldız Discord sunucusunun resmi destek yapay zeka asistanısın. 
Adın EkoBot. Kullanıcıyla doğal, samimi ama profesyonel bir dille konuş. 
Türkçe yanıt ver. Yanıtların maksimum 300 karakter olsun.
Emoji kullanabilirsin ama abartma.

━━━━━━━━━━━━━━━━━━━━━━━
KİŞİLİK & DAVRANIŞ KURALLARI
━━━━━━━━━━━━━━━━━━━━━━━
- Kibarlıkla başla, sorunu anladığını hissettir
- Kullanıcı sinirli/üzgünse empati kur, sakin tut
- Kullanıcı saldırgan olursa uyar: "Lütfen saygılı konuşalım, yoksa ticket kapatılır."
- Belirsiz mesajlarda tahmin yürüt ama doğrulat: "Bunu mu demek istediniz?"
- Birden fazla sorun varsa önce hangisine bakacağını sor
- Çok kısa/anlamsız mesajlara (örn: "yardım", "bi sorun var") nazikçe ne olduğunu sor
- Konuşma bittiyse "Başka bir sorun var mı?" diye sor

━━━━━━━━━━━━━━━━━━━━━━━
KATEGORİ BAZLI AKIŞLAR
━━━━━━━━━━━━━━━━━━━━━━━

▸ [BAN/ŞİKAYET - "ban"]
  Adım 1: Kimi ban etmek istediğini sor (kullanıcı adı veya ID)
  Adım 2: Neden ban istediğini sor
  Adım 3: Kanıt iste (ekran görüntüsü, link vb.)
  Adım 4: Kanıt gelince → [BAN_ONAY] <kullanıcıadı_veya_id>
  Not: Kanıtsız ban taleplerini kabul etme, nazikçe açıkla

▸ [REKLAM - "reklam"]
  Adım 1: Fiyat listesini ver:
    • Shorts reklamı → 30₺
    • Uzun video alt banner → 50₺
    • Uzun video orta bölüm → 100₺
  Adım 2: Hangi türü istediğini sor
  Adım 3: Reklam konusunu/içeriğini sor
  Adım 4: Özet göster ve onay iste: "X₺ karşılığı Y reklamı, konu: Z. Onaylıyor musunuz?"
  Adım 5: Onay gelince → [REKLAM_ONAY] <tür>|<fiyat>|<konu>

▸ [KULLANICI ŞİKAYET - "report"]
  Adım 1: Şikayet ettiği kişiyi sor
  Adım 2: Ne yaptığını sor
  Adım 3: Kanıt iste
  Adım 4: Değerlendir:
    - Hafif ihlal (spam, caps, flood) → [WARN_ONAY] <hedef>|<sebep>
    - Ciddi ihlal (küfür, ırkçılık, tehdit, dolandırıcılık) → [BAN_ONAY] <hedef>
  Not: Kanıt olmadan işlem başlatma, uyar

▸ [ÖDEME SORUNU - "billing"]
  Adım 1: Hangi kanaldan ödeme yaptığını sor (Papara, banka havalesi vb.)
  Adım 2: Ödeme tutarını sor
  Adım 3: Ödeme tarih ve saatini sor
  Adım 4: Değerlendir:
    - 24 saat içindeyse → [RESOLVE] Ödemeniz alındı, sistem 24 saat içinde işleme alır. Teşekkürler!
    - 24 saatten eskiyse → [HAZIR] ödeme sorunu
  Not: Kullanıcı sipariş/makbuz numarası paylaşırsa bunu da not et

▸ [TEKNİK SORUN - "technical"]
  Adım 1: Sorunu detaylı anlat demeden önce kısa özetle ne olduğunu sor
  Adım 2: Gerekirse platform/cihaz bilgisi iste
  Bilinen Çözümler:
    - Bot yanıt vermiyor → "Botu kickleyip tekrar davet etmeyi dene"
    - Komut çalışmıyor → "Botun gerekli izinleri var mı kontrol et"
    - Rol gelmiyor → "/authorize komutunu çalıştır veya roleyi manuel kontrol et"
  Adım 3: Çözüm işe yararsa → [RESOLVE] <çözüm>
  Adım 4: Çözemediysen → [HAZIR] teknik sorun

▸ [HESAP SORUNU - "account"]
  Adım 1: Sorunun Roblox ile mi Discord ile mi ilgili olduğunu sor
  Bilinen Çözümler:
    - Roblox bağlantı sorunu → [RESOLVE] /authorize komutunu çalıştırın, hesabınız otomatik bağlanacak
    - Rol eksikliği → [RESOLVE] /authorize çalıştırın ya da birkaç dakika bekleyin
    - Hesap çalındı/erişim yok → [HAZIR] hesap sorunu
  Adım 2: Diğer hesap sorunlarında → [HAZIR] hesap sorunu

━━━━━━━━━━━━━━━━━━━━━━━
SİSTEM KOMUTLARI (Asla başka yerde kullanma)
━━━━━━━━━━━━━━━━━━━━━━━
[RESOLVE] <mesaj>    → AI çözdü, ticket oto-kapanır. Kullanıcıya çözümü yaz.
[HAZIR] <kategori>   → Yetkili gerekli, ticket yetkiliye iletilir.
[BAN_ONAY] <hedef>   → Ban işlemi başlat + ticket oto-kapat.
[WARN_ONAY] <hedef>|<sebep> → Uyarı/mute uygula + ticket oto-kapat.
[REKLAM_ONAY] <tür>|<fiyat>|<konu> → Reklam akışını başlat.

⚠️ Köşeli parantez [ ] karakterlerini yalnızca yukarıdaki komutlar için kullan. Başka hiçbir amaçla kullanma.`;

function isReady(text) {
  return /^\s*\[HAZIR\]/i.test(text.trim());
}

function cleanAI(text) {
  return text
    .replace(/^\s*\[HAZIR\]\s*/i, '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim();
}

// ── Moderatör Kontrol Paneli (Yetkili Kanalı İçin) ─────────────────────────
function buildDMModActionRows(ticketId, isLocked = false, claimedBy = null) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dm_close_${ticketId}`)
      .setLabel('🔒 Talebi Kapat')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`dm_claim_${ticketId}`)
      .setLabel(claimedBy ? `🙋‍♂️ Üstlendi (${claimedBy})` : '🙋‍♂️ Talebi Üstlen')
      .setStyle(claimedBy ? ButtonStyle.Success : ButtonStyle.Primary)
      .setDisabled(!!claimedBy),
    new ButtonBuilder()
      .setCustomId(`dm_note_${ticketId}`)
      .setLabel('📝 Yetkili Notu')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dm_profile_${ticketId}`)
      .setLabel('👤 Kullanıcı Sicili')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dm_canned_prompt_${ticketId}`)
      .setLabel('⚡ Hazır Şablonlar')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`dm_ai_audit_${ticketId}`)
      .setLabel('🚨 AI İhtilaf Analiz')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`dm_transcript_${ticketId}`)
      .setLabel('📜 Transkript Al')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dm_lock_${ticketId}`)
      .setLabel(isLocked ? '🔊 DM Kilidini Aç' : '🔇 DM Yazma Kilidi')
      .setStyle(isLocked ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  return [row1, row2];
}

// ── Kullanıcı DM Canlı Kontrol Çubuğu ──────────────────────────────────────
function buildUserDMControlRow(ticketId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dm_user_close_${ticketId}`)
      .setLabel('🔒 Talebi Kapat (Çözüldü)')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`dm_user_nudge_${ticketId}`)
      .setLabel('🙋‍♂️ Yetkiliye Hatırlat')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`dm_user_transcript_${ticketId}`)
      .setLabel('📜 Konuşma Özeti')
      .setStyle(ButtonStyle.Secondary)
  );
}

// ── Bot'a DM gelen mesajı işle ──────────────────────────────────────────────
async function handleDMMessage(message, client) {
  const userId = message.author.id;

  // Aktif ticket kontrolü
  if (activeDMTickets.has(userId)) {
    await forwardDMToChannel(message, client);
    return;
  }

  // DB'den açık bilet kontrolü (bot restart durumu)
  try {
    const existing = await Ticket.findOne({ userId, status: 'open', source: 'dm' });
    if (existing && existing.channelId && existing.guildId) {
      activeDMTickets.set(userId, {
        ticketId:  existing.ticketId,
        channelId: existing.channelId,
        guildId:   existing.guildId,
        locked:    false,
        claimedBy: existing.claimedByName || null,
      });
      await forwardDMToChannel(message, client);
      return;
    }
  } catch (_) {}

  // Onay bekleniyor durumu
  if (pendingConfirmation.has(userId)) {
    await message.author.send('👆 Lütfen yukarıdaki menüden yapmak istediğiniz işlemi seçin.').catch(() => {});
    return;
  }

  // İlk kez yazıyor → Gelişmiş Hub Menüsünü göster
  if (!dmConversations.has(userId)) {
    pendingConfirmation.set(userId, true);

    const isMod = await isModeratorOrStaff(userId, client);

    const embed = new EmbedBuilder()
      .setColor(0x7c6af7)
      .setTitle('🛡️ Sentara & EkoYıldız Akıllı Destek Merkezi')
      .setDescription(
        `Merhaba **${message.author.username}**! Sentara DM Destek Merkezine hoş geldiniz.\n\n` +
        'Lütfen size nasıl yardımcı olabileceğimizi aşağıdaki butonlardan seçiniz:\n\n' +
        '🎫 **Destek Talebi Aç:** Doğrudan yetkililere ulaşmak için bilet kategorisi seçin.\n' +
        '🤖 **Yapay Zeka Destek:** EkoBot AI ile 7/24 anında sohbete başlayın.\n' +
        '📋 **Taleplerim:** Geçmiş ve aktif destek kayıtlarınızı listeleyin.' +
        (isMod ? '\n\n🚨 **ACİL AI EMNİYET BAĞLAN:** Sunucudaki saldırı/istilacıları banlatın veya bot spamlarını durdurun.' : '')
      )
      .setFooter({ text: 'Sentara Destek • 7/24 Güvenli & Hızlı İletişim', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`dm_flow_category_${userId}`)
        .setLabel('🎫 Destek Talebi Aç')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`dm_confirm_ai_${userId}`)
        .setLabel('🤖 Yapay Zeka Destek')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`dm_my_tickets_${userId}`)
        .setLabel('📋 Taleplerim')
        .setStyle(ButtonStyle.Secondary)
    );

    const components = [row1];

    if (isMod) {
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`dm_confirm_emergency_${userId}`)
          .setLabel('🚨 ACİL AI EMNİYET BAĞLAN')
          .setStyle(ButtonStyle.Danger)
      );
      components.push(row2);
    }

    await message.author.send({ embeds: [embed], components }).catch((err) => {
      console.error('[dmTicket] Karşılama gönderilemedi:', err.message);
    });
    return;
  }

  // Devam eden AI konuşması
  await continueAIConversation(message, client);
}

// ── AI konuşmasını devam ettir ──────────────────────────────────────────────
async function continueAIConversation(message, client) {
  const userId = message.author.id;
  const history = dmConversations.get(userId) || [];
  const mode = dmModes.get(userId) || 'normal';

  if (mode === 'normal' && history.length >= 14) {
    await createDMTicket(message.author, 'Kullanıcı destek talep etti.', history, client, 'Genel Destek');
    return;
  }

  let userText = message.content || '';
  if (message.attachments.size > 0) {
    userText += `\n[SİSTEM UYARISI: Kullanıcı bir kanıt/dosya eki yükledi. Dosya sayısı: ${message.attachments.size}]`;
  }

  history.push({ role: 'user', content: userText });

  try {
    const dmCh = await message.author.createDM().catch(() => null);
    if (dmCh) await dmCh.sendTyping().catch(() => {});
  } catch (_) {}

  let aiReply;
  try {
    const prompt = mode === 'emergency_ai' ? EMERGENCY_SYSTEM_PROMPT : DM_SYSTEM_PROMPT;
    aiReply = await chatWithAI(history, prompt);
    history.push({ role: 'assistant', content: aiReply });
  } catch (err) {
    console.error('[dmTicket] AI hata:', err.message);
    await message.author.send('⚠️ Asistan şu an çevrimdışı. Sizi direkt yetkililere bağlıyorum...').catch(() => {});
    await createDMTicket(message.author, message.content.slice(0, 200), history, client, 'Genel Destek');
    return;
  }

  // Acil komut kontrolleri
  if (mode === 'emergency_ai') {
    if (aiReply.includes('[BAN_EMERGENCY]')) {
      const match = aiReply.match(/\[BAN_EMERGENCY\]\s*(\d+)/);
      const targetId = match ? match[1] : null;
      if (targetId) {
        let successCount = 0;
        for (const [guildId, guild] of client.guilds.cache) {
          try {
            await guild.members.ban(targetId, { reason: `Acil AI Emniyet Raporu: İstilacı/Abuseci (Raporlayan: ${message.author.username})` });
            successCount++;
          } catch (err) {
            console.warn(`[BAN_EMERGENCY] Failed in guild ${guild.name}:`, err.message);
          }
        }
        aiReply += successCount > 0
          ? `\n\n⚡ **[SİSTEM MESAJI]** <@${targetId}> (${targetId}) kullanıcısı ${successCount} sunucudan başarıyla yasaklandı.`
          : `\n\n❌ **[SİSTEM MESAJI]** Yasaklama işlemi başarısız oldu (Yetki yetersiz veya kullanıcı bulunamadı).`;
      }
    }

    if (aiReply.includes('[KICK_EMERGENCY]')) {
      const match = aiReply.match(/\[KICK_EMERGENCY\]\s*(\d+)/);
      const targetId = match ? match[1] : null;
      if (targetId) {
        let successCount = 0;
        for (const [guildId, guild] of client.guilds.cache) {
          try {
            const member = await guild.members.fetch(targetId).catch(() => null);
            if (member) {
              await member.kick(`Acil AI Emniyet Raporu: İstilacı/Abuseci (Raporlayan: ${message.author.username})`);
              successCount++;
            }
          } catch (err) {
            console.warn(`[KICK_EMERGENCY] Failed in guild ${guild.name}:`, err.message);
          }
        }
        aiReply += successCount > 0
          ? `\n\n⚡ **[SİSTEM MESAJI]** <@${targetId}> (${targetId}) kullanıcısı ${successCount} sunucudan başarıyla atıldı.`
          : `\n\n❌ **[SİSTEM MESAJI]** Atma işlemi başarısız oldu.`;
      }
    }

    if (aiReply.includes('[MUTE_EMERGENCY]')) {
      const match = aiReply.match(/\[MUTE_EMERGENCY\]\s*(\d+)\s*(\w+)?/);
      const targetId = match ? match[1] : null;
      const durationStr = match && match[2] ? match[2] : "1d";
      if (targetId) {
        const unitMap = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
        const matches = [...durationStr.matchAll(/(\d+)([smhd])/g)];
        const durationMs = matches.length
          ? matches.reduce((total, m) => total + parseInt(m[1]) * (unitMap[m[2]] || 1000), 0)
          : 24 * 60 * 60 * 1000;

        let successCount = 0;
        for (const [guildId, guild] of client.guilds.cache) {
          try {
            const member = await guild.members.fetch(targetId).catch(() => null);
            if (member) {
              await member.timeout(durationMs, `Acil AI Emniyet Raporu: İstilacı/Abuseci (Raporlayan: ${message.author.username})`);
              successCount++;
            }
          } catch (err) {
            console.warn(`[MUTE_EMERGENCY] Failed in guild ${guild.name}:`, err.message);
          }
        }
        aiReply += successCount > 0
          ? `\n\n⚡ **[SİSTEM MESAJI]** <@${targetId}> (${targetId}) kullanıcısı ${successCount} sunucuda ${durationStr} süreyle susturuldu.`
          : `\n\n❌ **[SİSTEM MESAJI]** Susturma işlemi başarısız oldu.`;
      }
    }

    if (aiReply.includes('[STOP_SPAM]')) {
      global.SPAM_STOPPED = true;
      aiReply += `\n\n⚡ **[SİSTEM MESAJI]** Güvenlik Protokolü aktifleşti. Botun tüm bildirim planlayıcıları durduruldu.`;
    }
  }

  if (isReady(aiReply) && mode === 'normal') {
    const summary = cleanAI(aiReply);
    await createDMTicket(message.author, summary, history, client, 'Genel Destek');
  } else {
    const cleanReply = cleanAI(aiReply) || aiReply;
    await message.author.send(cleanReply).catch(() => {});
  }
}

// ── DM Ticket Kanalı Oluştur ────────────────────────────────────────────────
async function createDMTicket(user, summary, history, client, categoryName = 'Genel Destek') {
  const userId = user.id;
  dmConversations.delete(userId);

  const ticketId = generateTicketId();

  const targets = [
    { id: GUILD2_ID, categoryId: GUILD2_TICKET_CATEGORY_ID },
  ];

  let createdChannel = null;
  let createdGuildId = null;

  for (const target of targets) {
    try {
      const guild = await client.guilds.fetch(target.id).catch(() => null);
      if (!guild) continue;

      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: userId, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ];

      guild.roles.cache
        .filter(r => r.permissions.has(PermissionFlagsBits.ManageMessages) && !r.managed)
        .forEach(r => permissionOverwrites.push({
          id: r.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ],
        }));

      let parentId = null;
      if (target.categoryId) {
        const ch = await guild.channels.fetch(target.categoryId).catch(() => null);
        if (ch?.type === ChannelType.GuildCategory) parentId = ch.id;
        else if (ch?.type === ChannelType.GuildText) parentId = ch.parentId;
      }
      if (!parentId) {
        let cat = guild.channels.cache.find(
          c => c.name.toLowerCase().includes('destek') && c.type === ChannelType.GuildCategory
        );
        if (!cat) cat = await guild.channels.create({ name: 'DM TİCKETLAR', type: ChannelType.GuildCategory });
        parentId = cat.id;
      }

      const channel = await guild.channels.create({
        name: `dm-${ticketId.toLowerCase()}`,
        type: ChannelType.GuildText,
        parent: parentId,
        permissionOverwrites,
        topic: `DM Ticket | ${user.tag} (${userId}) | Kategori: ${categoryName}`,
      });

      const convText = (history || [])
        .filter(m => m.role === 'user')
        .map(m => `> ${m.content}`)
        .join('\n')
        .slice(0, 900) || 'Mesaj yok.';

      const embed = new EmbedBuilder()
        .setColor(0x7c6af7)
        .setTitle(`📩 DM Destek Talebi — #${ticketId}`)
        .setDescription(
          `**Kullanıcı:** <@${userId}> (${user.tag})\n` +
          `**Kategori:** \`${categoryName}\`\n` +
          `**Özet / Konu:** ${summary || '—'}\n\n` +
          `**Kullanıcı İlk Mesajı:**\n${convText}`
        )
        .addFields(
          {
            name: '📌 Sistem Nasıl Çalışır?',
            value:
              '• Bu kanala yazdığınız her mesaj kullanıcıya anında **DM** olarak iletilir.\n' +
              '• Kullanıcının bot DM\'sine yazdığı yanıtlar buraya düşer.\n' +
              '• Aşağıdaki moderatör butonlarıyla talebi yönetebilirsiniz.',
            inline: false
          }
        )
        .setFooter({ text: `Sentara DM Ticket Engine • #${ticketId}` })
        .setTimestamp();

      const modRows = buildDMModActionRows(ticketId, false, null);
      await channel.send({ embeds: [embed], components: modRows });

      if (!createdChannel) {
        createdChannel = channel;
        createdGuildId = guild.id;
      }
    } catch (err) {
      console.warn(`[dmTicket] ${target.id} kanalı açılamadı:`, err.message);
    }
  }

  if (!createdChannel) {
    await user.send('❌ Destek kanalı oluşturulamadı. Lütfen sunucudan yardım isteyiniz.').catch(() => {});
    return;
  }

  // DB Kaydı
  const ticket = new Ticket({
    ticketId,
    userId,
    userName: user.username,
    category: categoryName || 'dm',
    subject: (summary || `${categoryName} DM Destek`).slice(0, 100),
    description: summary || `${categoryName} DM Destek Talebi`,
    priority: 'medium',
    channelId: createdChannel.id,
    guildId: createdGuildId,
    source: 'dm',
  });
  await ticket.save();

  activeDMTickets.set(userId, {
    ticketId,
    channelId: createdChannel.id,
    guildId: createdGuildId,
    locked: false,
    claimedBy: null,
  });

  // Kullanıcıya DM Kontrol Çubuğu Gönder
  const userEmbed = new EmbedBuilder()
    .setColor(0x10b981)
    .setTitle('✅ Destek Talebiniz Oluşturuldu')
    .setDescription(
      `Talebiniz başarıyla yetkili ekibimize iletildi.\n\n` +
      `📌 **Bilet No:** \`#${ticketId}\`\n` +
      `🏷️ **Kategori:** \`${categoryName}\`\n\n` +
      `Yetkililerimiz size yazdığında mesajlar buraya düşecektir. Ekran görüntüsü veya dosya göndermek için doğrudan bu sohbete yükleyebilirsiniz.`
    )
    .setFooter({ text: 'Sentara DM Destek Masası' })
    .setTimestamp();

  const userControlRow = buildUserDMControlRow(ticketId);
  await user.send({ embeds: [userEmbed], components: [userControlRow] }).catch(() => {});

  console.log(`[dmTicket] ${user.tag} → DM ticket: ${ticketId} (${categoryName})`);
}

// ── DM → Kanal İletimi ──────────────────────────────────────────────────────
async function forwardDMToChannel(message, client) {
  const userId = message.author.id;
  let dmInfo = activeDMTickets.get(userId);

  if (!dmInfo) {
    try {
      const ticket = await Ticket.findOne({ userId, status: 'open', source: 'dm' });
      if (ticket && ticket.channelId && ticket.guildId) {
        dmInfo = {
          ticketId:  ticket.ticketId,
          channelId: ticket.channelId,
          guildId:   ticket.guildId,
          locked:    false,
          claimedBy: ticket.claimedByName || null,
        };
        activeDMTickets.set(userId, dmInfo);
      }
    } catch (_) {}
  }

  if (!dmInfo) return;

  // Kilit kontrolü
  if (dmInfo.locked) {
    return message.reply('🔇 **Yazma Kilidi Aktif:** Destek talebiniz yetkililer tarafından geçici olarak durdurulmuştur. Lütfen yetkili yanıtını bekleyiniz.');
  }

  const guild = await client.guilds.fetch(dmInfo.guildId).catch(() => null);
  if (!guild) {
    activeDMTickets.delete(userId);
    return;
  }

  const channel = await guild.channels.fetch(dmInfo.channelId).catch(() => null);
  if (!channel) {
    activeDMTickets.delete(userId);
    try {
      const t = await Ticket.findOne({ ticketId: dmInfo.ticketId });
      if (t && t.status === 'open') {
        t.status = 'closed';
        t.closeReason = 'Kanal silindi';
        t.closedAt = new Date();
        await t.save();
      }
    } catch (_) {}

    const embed = new EmbedBuilder()
      .setColor(0xfbbf24)
      .setTitle('📭 Destek Kanalınız Kapandı')
      .setDescription('Destek talebiniz sonlandırılmış.\nYeni bir destek talebi açmak ister misiniz?')
      .setFooter({ text: 'Sentara Destek' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`dm_flow_category_${userId}`)
        .setLabel('✅ Evet, Yeni Destek Aç')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`dm_confirm_no_${userId}`)
        .setLabel('❌ Hayır')
        .setStyle(ButtonStyle.Secondary)
    );

    pendingConfirmation.set(userId, true);
    await message.author.send({ embeds: [embed], components: [row] }).catch(() => {});
    return;
  }

  let replyText = null;
  if (message.reference && message.reference.messageId) {
    try {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      if (refMsg) {
        const embed = refMsg.embeds?.[0];
        const content = embed ? (embed.description || embed.title) : refMsg.content;
        replyText = content ? (content.length > 100 ? content.slice(0, 100) + '...' : content) : '*(ek dosya)*';
      }
    } catch (_) {}
  }

  const embed = new EmbedBuilder()
    .setColor(0x4ade80)
    .setAuthor({ name: `${message.author.tag} (DM Kullanıcısı)`, iconURL: message.author.displayAvatarURL() })
    .setDescription((replyText ? `↩️ **Cevaplanan Mesaj:** *"${replyText}"*\n\n` : '') + (message.content || '*(ek dosya paylaştı)*'))
    .setFooter({ text: `📩 DM Gelen Mesaj • #${dmInfo.ticketId}` })
    .setTimestamp();

  const sendOpts = { embeds: [embed] };

  if (message.attachments.size > 0) {
    sendOpts.files = [...message.attachments.values()].map(a => a.url).slice(0, 8);
  }

  await channel.send(sendOpts).catch(() => {});
  await message.react('📨').catch(() => {});
}

// ── Kanal → DM İletimi ──────────────────────────────────────────────────────
async function forwardChannelToDM(message, client) {
  if (!message.channel.name?.startsWith('dm-')) return false;

  const channelId = message.channel.id;
  let targetUserId = null;

  for (const [uid, info] of activeDMTickets.entries()) {
    if (info.channelId === channelId) { targetUserId = uid; break; }
  }

  if (!targetUserId && message.channel.topic) {
    const m = message.channel.topic.match(/\((\d{17,20})\)/);
    if (m) targetUserId = m[1];
  }

  if (!targetUserId) {
    try {
      const t = await Ticket.findOne({ channelId, status: 'open' });
      if (t) targetUserId = t.userId;
    } catch (_) {}
  }

  if (!targetUserId) return false;

  const user = await client.users.fetch(targetUserId).catch(() => null);
  if (!user) return false;

  let replyText = null;
  if (message.reference && message.reference.messageId) {
    try {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      if (refMsg) {
        const embed = refMsg.embeds?.[0];
        const content = embed ? (embed.description || embed.title) : refMsg.content;
        replyText = content ? (content.length > 100 ? (content.includes('Cevaplanan Mesaj:') ? content.split('\n\n').slice(1).join('\n\n') : content).slice(0, 100) + '...' : content) : '*(ek dosya)*';
      }
    } catch (_) {}
  }

  const embed = new EmbedBuilder()
    .setColor(0x7c6af7)
    .setAuthor({ name: `${message.author.displayName || message.author.username} (Yetkili Temsilci)`, iconURL: message.author.displayAvatarURL() })
    .setDescription((replyText ? `↩️ **Cevaplanan Mesajınız:** *"${replyText}"*\n\n` : '') + (message.content || '*(dosya gönderdi)*'))
    .setFooter({ text: 'Sentara Destek • Yetkili Yanıtı' })
    .setTimestamp();

  const sendOpts = { embeds: [embed] };
  if (message.attachments.size > 0) {
    sendOpts.files = [...message.attachments.values()].map(a => a.url).slice(0, 8);
  }

  await user.send(sendOpts).catch(() => {});
  await message.react('✅').catch(() => {});
  return true;
}

// ── DM Buton Yöneticisi (Tüm DM Butonları) ──────────────────────────────────
async function handleDMButton(interaction, client) {
  const customId = interaction.customId;
  if (!customId?.startsWith('dm_')) return false;

  const userId = interaction.user.id;

  // 1. Kategori Seçim Menüsü Aç
  if (customId.startsWith('dm_flow_category_')) {
    pendingConfirmation.delete(userId);
    const catEmbed = new EmbedBuilder()
      .setColor(0x7c6af7)
      .setTitle('📂 Destek Talebi Kategorisi Seçin')
      .setDescription(
        'Sorununuzun hızlı çözülebilmesi için lütfen en uygun kategoriyi seçiniz:\n\n' +
        '🛠️ **Teknik Destek & Hata:** Bot komutları, website, erişim sorunları.\n' +
        '💳 **Ödeme & Mağaza:** İtemSatış, Sentara Coin, bakiye ve ürün teslimatı.\n' +
        '🚨 **Şikayet & İhlal:** Kural ihlalleri, istismar veya moderatör şikayeti.\n' +
        '💼 **Reklam & Sponsorluk:** Sunucu reklamları ve işbirlikleri.\n' +
        '❓ **Genel Soru & Bilgi:** Sunucu kuralları, roller ve diğer konular.'
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`dm_cat_tech_${userId}`).setLabel('🛠️ Teknik Destek').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`dm_cat_billing_${userId}`).setLabel('💳 Ödeme & Mağaza').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`dm_cat_report_${userId}`).setLabel('🚨 Şikayet & İhlal').setStyle(ButtonStyle.Danger)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`dm_cat_ad_${userId}`).setLabel('💼 Reklam & Sponsorluk').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`dm_cat_general_${userId}`).setLabel('❓ Genel Soru').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`dm_confirm_no_${userId}`).setLabel('❌ İptal').setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [catEmbed], components: [row1, row2] }).catch(() => {});
    return true;
  }

  // 2. Kategori Seçildiğinde Doğrudan Ticket Aç
  if (customId.startsWith('dm_cat_')) {
    const parts = customId.split('_');
    const catKey = parts[2]; // tech, billing, report, ad, general
    const catMap = {
      tech: '🛠️ Teknik Destek & Hata',
      billing: '💳 Ödeme & Mağaza',
      report: '🚨 Şikayet & İhlal',
      ad: '💼 Reklam & Sponsorluk',
      general: '❓ Genel Destek'
    };
    const catName = catMap[catKey] || 'Genel Destek';

    await interaction.update({
      content: `⏳ **${catName}** kategorisinde destek talebiniz hazırlanıyor...`,
      embeds: [],
      components: [],
    }).catch(() => {});

    await createDMTicket(interaction.user, `${catName} talebi`, [], client, catName);
    return true;
  }

  // 3. Yapay Zeka Desteğe Bağlan
  if (customId.startsWith('dm_confirm_ai_')) {
    pendingConfirmation.delete(userId);
    dmConversations.set(userId, []);
    dmModes.set(userId, 'ai');
    await interaction.update({
      content: '🤖 **EkoBot Yapay Zeka Asistanı Bağlandı!**\nSorununuzu doğrudan yazabilirsiniz. Size anında çözüm ve bilgi sunmak için buradayım. 😊',
      embeds: [],
      components: [],
    }).catch(() => {});
    return true;
  }

  // 4. Acil Güvenlik Masası
  if (customId.startsWith('dm_confirm_emergency_')) {
    pendingConfirmation.delete(userId);
    const isMod = await isModeratorOrStaff(userId, client);
    if (!isMod) {
      await interaction.reply({ content: '❌ Bu özelliği yalnızca moderatör ekibi kullanabilir.', ephemeral: true }).catch(() => {});
      return true;
    }
    dmConversations.set(userId, []);
    dmModes.set(userId, 'emergency_ai');
    await interaction.update({
      content: '🚨 **ACİL EMNİYET VE ASAYİŞ SİSTEMİ DEVREYE ALINDI!**\n\n' +
               'Sunucudaki istilacıları/abusecileri raporlayabilir veya bot bildirim spamlarını durdurabilirsiniz.\n' +
               'Lütfen şüpheli ID/kullanıcı adını yazın ve ekran görüntüsü (kanıt) yükleyin.',
      embeds: [],
      components: [],
    }).catch(() => {});
    return true;
  }

  // 5. İptal / Vazgeç
  if (customId.startsWith('dm_confirm_no_')) {
    pendingConfirmation.delete(userId);
    await interaction.update({
      content: '👍 İşlem iptal edildi. İhtiyaç duyduğunuzda dilediğiniz an tekrar yazabilirsiniz.',
      embeds: [],
      components: [],
    }).catch(() => {});
    return true;
  }

  // 6. Kullanıcının Kendi Taleplerini Listelemesi
  if (customId.startsWith('dm_my_tickets_')) {
    pendingConfirmation.delete(userId);
    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 }).limit(5).catch(() => []);
    if (!tickets.length) {
      await interaction.update({
        content: 'ℹ️ Daha önce açılmış herhangi bir destek talebiniz bulunmuyor.',
        embeds: [],
        components: [],
      }).catch(() => {});
      return true;
    }

    const listEmbed = new EmbedBuilder()
      .setColor(0x7c6af7)
      .setTitle(`📋 Destek Talepleriniz — ${interaction.user.username}`)
      .setDescription(
        tickets.map(t => {
          const statusEmoji = t.status === 'open' ? '🟢 Açık' : '🔒 Kapalı';
          const dateStr = t.createdAt ? `<t:${Math.floor(new Date(t.createdAt).getTime() / 1000)}:d>` : '—';
          return `• **#${t.ticketId}** (${statusEmoji}) | \`${t.category}\` | ${dateStr}\n  *${t.subject || 'Konu belirtilmedi'}*`;
        }).join('\n\n')
      )
      .setFooter({ text: 'Son 5 biletiniz listelendi.' });

    await interaction.update({ embeds: [listEmbed], components: [] }).catch(() => {});
    return true;
  }

  // ── Moderatör Eylemleri ──

  // 7. DM Kapat Butonu
  if (customId.startsWith('dm_close_')) {
    return handleDMCloseButton(interaction, client);
  }

  // 8. DM Talebi Üstlen (Claim)
  if (customId.startsWith('dm_claim_')) {
    const ticketId = customId.replace('dm_claim_', '');
    const ticket = await Ticket.findOne({ ticketId }).catch(() => null);
    if (!ticket) return interaction.reply({ content: '❌ Bilet bulunamadı.', ephemeral: true });

    ticket.claimedBy = interaction.user.id;
    ticket.claimedByName = interaction.user.username;
    ticket.claimedAt = new Date();
    await ticket.save();

    for (const [uid, info] of activeDMTickets.entries()) {
      if (info.ticketId === ticketId) {
        info.claimedBy = interaction.user.username;
        break;
      }
    }

    // Kullanıcıya DM Bildirimi
    try {
      const user = await client.users.fetch(ticket.userId);
      if (user) {
        const claimEmbed = new EmbedBuilder()
          .setColor(0x3b82f6)
          .setDescription(`🙋‍♂️ Destek talebiniz yetkili **${interaction.user.username}** tarafından üstlenildi ve incelemeye alındı.`)
          .setFooter({ text: 'Sentara Destek Masası' });
        await user.send({ embeds: [claimEmbed] }).catch(() => {});
      }
    } catch (_) {}

    await interaction.reply({ content: `🙋‍♂️ Bu destek talebini başarıyla üstlendiniz: **${interaction.user.username}**` });
    return true;
  }

  // 9. Yetkili Notu Ekle (Modal)
  if (customId.startsWith('dm_note_')) {
    const ticketId = customId.replace('dm_note_', '');
    const modal = new ModalBuilder()
      .setCustomId(`dm_note_modal_${ticketId}`)
      .setTitle(`📝 Yetkili Notu Ekle — #${ticketId}`);

    const noteInput = new TextInputBuilder()
      .setCustomId('dm_note_text')
      .setLabel('Yetkili Notu / İnceleme Detayı')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Kullanıcı hakkında veya talep hakkında mod notu...')
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(noteInput));
    await interaction.showModal(modal).catch(() => {});
    return true;
  }

  // 10. Kullanıcı Sicilini Gör (TrustScore & Profil)
  if (customId.startsWith('dm_profile_')) {
    const ticketId = customId.replace('dm_profile_', '');
    const ticket = await Ticket.findOne({ ticketId }).catch(() => null);
    if (!ticket) return interaction.reply({ content: '❌ Bilet bulunamadı.', ephemeral: true });

    const targetUserId = ticket.userId;
    const targetUser = await client.users.fetch(targetUserId).catch(() => null);
    const member = interaction.guild ? await interaction.guild.members.fetch(targetUserId).catch(() => null) : null;

    let trustScore = 100;
    try {
      const { getTrustScore } = require('./security/trustScoreService');
      const scoreData = await getTrustScore(targetUserId);
      if (scoreData && typeof scoreData.score === 'number') trustScore = scoreData.score;
    } catch (_) {}

    const totalTickets = await Ticket.countDocuments({ userId: targetUserId }).catch(() => 1);
    const openTickets = await Ticket.countDocuments({ userId: targetUserId, status: 'open' }).catch(() => 1);

    const infoEmbed = new EmbedBuilder()
      .setTitle(`👤 DM Kullanıcı Sicili — ${targetUser ? targetUser.username : targetUserId}`)
      .setColor(trustScore >= 70 ? 0x10b981 : (trustScore >= 40 ? 0xf59e0b : 0xef4444))
      .setThumbnail(targetUser ? targetUser.displayAvatarURL() : null)
      .addFields(
        { name: "🆔 Discord ID", value: `\`${targetUserId}\``, inline: true },
        { name: "🛡️ Güven Puanı", value: `**%${trustScore}** ${trustScore >= 70 ? '🟢 (Güvenilir)' : '⚠️ (Riskli)'}`, inline: true },
        { name: "🎫 Toplam / Açık Bilet", value: `**${totalTickets}** Toplam / **${openTickets}** Açık`, inline: true },
        { name: "📅 Hesap Yaşı", value: targetUser ? `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>` : "—", inline: true },
        { name: "📥 Sunucuya Katılım", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "—", inline: true }
      )
      .setFooter({ text: 'Sentara Audit Service' })
      .setTimestamp();

    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    return true;
  }

  // 11. Hazır Şablon Yanıt Menüsü (Canned Responses)
  if (customId.startsWith('dm_canned_prompt_')) {
    const ticketId = customId.replace('dm_canned_prompt_', '');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`dm_canned_send_info_${ticketId}`).setLabel('ℹ️ Kanıt / Detay İste').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`dm_canned_send_billing_${ticketId}`).setLabel('💳 Ödeme Dekontu İste').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`dm_canned_send_wait_${ticketId}`).setLabel('⏳ İnceleniyor Bildir').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`dm_canned_send_resolved_${ticketId}`).setLabel('✅ Çözüldü Bildir').setStyle(ButtonStyle.Success)
    );
    await interaction.reply({ content: '⚡ **Göndermek istediğiniz hazır şablon yanıtı seçiniz:**', components: [row], ephemeral: true });
    return true;
  }

  // Hazır şablon gönderimi
  if (customId.startsWith('dm_canned_send_')) {
    const parts = customId.split('_');
    const cannedType = parts[3]; // info, billing, wait, resolved
    const ticketId = parts[4];

    const ticket = await Ticket.findOne({ ticketId }).catch(() => null);
    if (!ticket) return interaction.reply({ content: '❌ Bilet bulunamadı.', ephemeral: true });

    const cannedTexts = {
      info: 'Lütfen sorununuzu daha detaylı açıklayınız ve varsa ekran görüntüsü / video kanıtlarını bu sohbete yükleyiniz.',
      billing: 'Ödeme işleminiz yetkililerimiz tarafından kontrol edilmektedir. Lütfen İtemSatış / Banka sipariş numaranızı ve ödeme dekontunuzu iletiniz.',
      wait: 'Talebiniz yetkili birimimize aktarılmış olup incelenmektedir. En kısa sürede size geri dönüş yapılacaktır. Sabrınız için teşekkür ederiz.',
      resolved: 'Talebiniz ile ilgili gerekli inceleme yapılmış ve sorun çözülmüştür. Başka bir konuda yardıma ihtiyacınız var mıdır?'
    };

    const textToSend = cannedTexts[cannedType] || 'Talebiniz incelenmektedir.';

    try {
      const user = await client.users.fetch(ticket.userId);
      if (user) {
        const cannedEmbed = new EmbedBuilder()
          .setColor(0x7c6af7)
          .setAuthor({ name: `${interaction.user.username} (Yetkili Temsilci)`, iconURL: interaction.user.displayAvatarURL() })
          .setDescription(textToSend)
          .setFooter({ text: 'Sentara Destek • Hazır Bilgilendirme' })
          .setTimestamp();
        await user.send({ embeds: [cannedEmbed] });
      }
    } catch (_) {}

    await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x7c6af7)
          .setDescription(`⚡ **Hazır Şablon İletildi (${interaction.user.username}):**\n> *"${textToSend}"*`)
      ]
    });

    await interaction.update({ content: '✅ Hazır yanıt kullanıcıya DM olarak gönderildi.', components: [] });
    return true;
  }

  // 12. AI İhtilaf & Risk Analizi
  if (customId.startsWith('dm_ai_audit_')) {
    const ticketId = customId.replace('dm_ai_audit_', '');
    await interaction.deferReply();

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 40 }).catch(() => null);
      const logText = messages ? [...messages.values()].reverse().map(m => {
        const author = m.author.bot ? (m.embeds?.[0]?.author?.name || 'Bot/Embed') : m.author.username;
        const content = m.embeds?.[0]?.description || m.content || '';
        return `[${author}]: ${content}`;
      }).join('\n') : '';

      const prompt = `Aşağıdaki Discord DM destek bileti konuşmasını analiz et:
1. Kullanıcının temel sorunu ve duygu durumu (öfkeli, sakin, dolandırılmış, vb.)
2. Kullanıcının talebi meşru mu yoksa şüpheli/kural ihlali mi?
3. Yetkiliye tavsiye edilen en hızlı ve güvenli çözüm nedir?

Konuşma dökümü:
${logText.slice(0, 3000)}`;

      const analysis = await chatWithAI([{ role: 'user', content: prompt }], 'Sen tarafsız ve uzman bir destek/moderatör kalite denetçisisin. Türkçe ve maddeler halinde analiz yap.', 'ticket');

      const auditEmbed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle(`🚨 AI Destek Analizi & İhtilaf Raporu — #${ticketId}`)
        .setDescription(analysis || 'Analiz oluşturulamadı.')
        .setFooter({ text: 'Sentara AI Support Auditor' })
        .setTimestamp();

      await interaction.editReply({ embeds: [auditEmbed] });
    } catch (err) {
      await interaction.editReply({ content: `❌ AI analizi başarısız: ${err.message}` });
    }
    return true;
  }

  // 13. Transkript Al
  if (customId.startsWith('dm_transcript_')) {
    const ticketId = customId.replace('dm_transcript_', '');
    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);
      if (!messages) return interaction.editReply({ content: '❌ Mesajlar alınamadı.' });

      let transcript = `=======================================================\n` +
                       `SENTARA DM TICKET TRANSKRIPT - #${ticketId}\n` +
                       `Tarih: ${new Date().toLocaleString('tr-TR')}\n` +
                       `Kanal: ${interaction.channel.name}\n` +
                       `=======================================================\n\n`;

      [...messages.values()].reverse().forEach(m => {
        const time = new Date(m.createdAt).toLocaleString('tr-TR');
        const author = m.author.bot ? (m.embeds?.[0]?.author?.name || 'Bot') : m.author.tag;
        const text = m.embeds?.[0]?.description || m.content || '(Ek Dosya)';
        transcript += `[${time}] ${author}: ${text}\n`;
      });

      const buffer = Buffer.from(transcript, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, { name: `transcript-${ticketId}.txt` });

      await interaction.channel.send({
        content: `📜 **Resmi Transkript Kaydı Oluşturuldu (#${ticketId})**`,
        files: [attachment]
      });

      await interaction.editReply({ content: '✅ Transkript kanala başarıyla yüklendi.' });
    } catch (err) {
      await interaction.editReply({ content: `❌ Transkript hatası: ${err.message}` });
    }
    return true;
  }

  // 14. DM Yazma Kilidi (Toggle Lock)
  if (customId.startsWith('dm_lock_')) {
    const ticketId = customId.replace('dm_lock_', '');
    let targetInfo = null;
    let targetUid = null;

    for (const [uid, info] of activeDMTickets.entries()) {
      if (info.ticketId === ticketId) { targetInfo = info; targetUid = uid; break; }
    }

    if (!targetInfo) return interaction.reply({ content: '❌ Aktif DM oturumu bulunamadı.', ephemeral: true });

    targetInfo.locked = !targetInfo.locked;
    const isLocked = targetInfo.locked;

    const modRows = buildDMModActionRows(ticketId, isLocked, targetInfo.claimedBy);
    await interaction.message.edit({ components: modRows }).catch(() => {});

    await interaction.reply({
      content: isLocked
        ? `🔇 **DM Yazma Kilidi Aktif:** <@${targetUid}> kullanıcısının DM üzerinden mesaj göndermesi geçici olarak durduruldu.`
        : `🔊 **DM Yazma Kilidi Açıldı:** <@${targetUid}> kullanıcısı artık mesaj gönderebilir.`
    });
    return true;
  }

  // ── Kullanıcı DM Eylemleri ──

  // 15. Kullanıcının Kendi Biletini Kapatması
  if (customId.startsWith('dm_user_close_')) {
    const ticketId = customId.replace('dm_user_close_', '');
    const ticket = await Ticket.findOne({ ticketId, status: 'open' }).catch(() => null);
    if (!ticket) return interaction.reply({ content: 'ℹ️ Bu bilet zaten kapatılmış.', ephemeral: true });

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.closeReason = 'Kullanıcı tarafından DM üzerinden çözüldü ve kapatıldı';
    ticket.closedBy = userId;
    ticket.closedByName = interaction.user.username;
    await ticket.save();

    activeDMTickets.delete(userId);
    dmConversations.delete(userId);

    await interaction.update({
      content: '✅ **Destek talebiniz kapatıldı.** Sorununuzun çözüldüğüne sevindik!\n\nLütfen aldığınız hizmeti değerlendirmeyi unutmayın:',
      embeds: [],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`dm_rate_5_${ticketId}`).setLabel('⭐⭐⭐⭐⭐ (5)').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`dm_rate_4_${ticketId}`).setLabel('⭐⭐⭐⭐ (4)').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`dm_rate_3_${ticketId}`).setLabel('⭐⭐⭐ (3)').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`dm_rate_1_${ticketId}`).setLabel('⭐ (1)').setStyle(ButtonStyle.Danger)
        )
      ]
    }).catch(() => {});

    // Kanala bildirim
    if (ticket.channelId && ticket.guildId) {
      try {
        const guild = await client.guilds.fetch(ticket.guildId);
        const ch = await guild.channels.fetch(ticket.channelId);
        if (ch) {
          await ch.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x10b981)
                .setTitle('🔒 Kullanıcı Talebi Kendi Kapattı')
                .setDescription(`Kullanıcı <@${userId}> sorununun çözüldüğünü belirterek talebi sonlandırdı.\nKanal 3 dakika içinde otomatik silinecektir.`)
            ]
          });
          setTimeout(async () => {
            await ch.delete('Kullanıcı DM talebini kapattı').catch(() => {});
          }, 3 * 60 * 1000);
        }
      } catch (_) {}
    }
    return true;
  }

  // 16. Kullanıcının Yetkiliye Hatırlatması (Nudge)
  if (customId.startsWith('dm_user_nudge_')) {
    const ticketId = customId.replace('dm_user_nudge_', '');
    const lastNudge = userNudgeCooldown.get(ticketId) || 0;
    const now = Date.now();

    if (now - lastNudge < 5 * 60 * 1000) {
      const remainingSec = Math.ceil((5 * 60 * 1000 - (now - lastNudge)) / 1000);
      return interaction.reply({ content: `⏳ Yetkililere çok sık bildirim gönderemezsiniz. Lütfen **${remainingSec} saniye** sonra tekrar deneyin.`, ephemeral: true });
    }

    userNudgeCooldown.set(ticketId, now);

    const ticket = await Ticket.findOne({ ticketId, status: 'open' }).catch(() => null);
    if (!ticket || !ticket.channelId) {
      return interaction.reply({ content: '❌ Aktif bilet kanalı bulunamadı.', ephemeral: true });
    }

    try {
      const guild = await client.guilds.fetch(ticket.guildId);
      const ch = await guild.channels.fetch(ticket.channelId);
      if (ch) {
        await ch.send({
          content: '🔔 **Yetkili Hatırlatması:** Kullanıcı DM üzerinden yanıt beklediğini bildirdi!',
          embeds: [
            new EmbedBuilder()
              .setColor(0xf59e0b)
              .setDescription(`⚠️ <@${userId}> kullanıcısı destek kanalına dikkat çekmek istedi.`)
              .setTimestamp()
          ]
        });
      }
    } catch (_) {}

    await interaction.reply({ content: '🔔 Yetkili ekibimize acil bildirim iletildi! En kısa sürede yanıt alacaksınız.', ephemeral: true });
    return true;
  }

  // 17. Kullanıcının DM'den Konuşma Özeti İstemesi
  if (customId.startsWith('dm_user_transcript_')) {
    const ticketId = customId.replace('dm_user_transcript_', '');
    const ticket = await Ticket.findOne({ ticketId }).catch(() => null);
    if (!ticket) return interaction.reply({ content: '❌ Bilet bulunamadı.', ephemeral: true });

    await interaction.reply({
      content: `📄 **Destek Talebi Özeti (#${ticketId})**\n• **Kategori:** \`${ticket.category}\`\n• **Konu:** ${ticket.subject}\n• **Durum:** ${ticket.status === 'open' ? '🟢 Aktif' : '🔒 Kapalı'}\n• **Açılış:** <t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:f>`,
      ephemeral: true
    });
    return true;
  }

  // 18. Yıldız Değerlendirme
  if (customId.startsWith('dm_rate_')) {
    const parts = customId.split('_');
    const stars = parseInt(parts[2]) || 5;
    const ticketId = parts[3];

    try {
      const ticket = await Ticket.findOne({ ticketId });
      if (ticket) {
        ticket.rating = stars;
        ticket.ratedAt = new Date();
        await ticket.save();
      }
    } catch (_) {}

    await interaction.update({
      content: `⭐ **Geri bildiriminiz için çok teşekkür ederiz!**\nDeğerlendirmeniz: **${'⭐'.repeat(stars)} (${stars}/5)** kaydedildi. İyi günler dileriz! 😊`,
      components: []
    }).catch(() => {});
    return true;
  }

  return false;
}

// ── DM Modalı Yöneticisi (Yetkili Notu vb.) ──────────────────────────────────
async function handleDMModal(interaction, client) {
  const customId = interaction.customId;
  if (!customId?.startsWith('dm_')) return false;

  // Yetkili Notu Modalı
  if (customId.startsWith('dm_note_modal_')) {
    const ticketId = customId.replace('dm_note_modal_', '');
    const noteText = interaction.fields.getTextInputValue('dm_note_text');

    const noteEmbed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle(`📝 Yetkili İnceleme Notu — #${ticketId}`)
      .setDescription(noteText)
      .setFooter({ text: `Notu Ekleyen: ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.channel.send({ embeds: [noteEmbed] });
    await interaction.reply({ content: '✅ Yetkili notu başarıyla eklendi.', ephemeral: true });
    return true;
  }

  return false;
}

// ── DM Ticket Kapat (Eski buton uyumluluğu) ─────────────────────────────────
async function handleDMCloseButton(interaction, client) {
  if (!interaction.customId?.startsWith('dm_close_')) return false;

  const ticketId = interaction.customId.replace('dm_close_', '');

  const ticket = await Ticket.findOne({ ticketId }).catch(() => null);
  if (!ticket) {
    await interaction.reply({ content: '❌ Ticket bulunamadı.', ephemeral: true });
    return true;
  }
  if (ticket.status === 'closed') {
    await interaction.reply({ content: 'ℹ️ Bu ticket zaten kapalı.', ephemeral: true });
    return true;
  }

  ticket.status = 'closed';
  ticket.closedAt = new Date();
  ticket.closeReason = `DM ticket yetkili tarafından kapatıldı — ${interaction.user.tag}`;
  ticket.closedBy = interaction.user.id;
  ticket.closedByName = interaction.user.username;
  await ticket.save();

  const targetUserId = ticket.userId;
  activeDMTickets.delete(targetUserId);
  dmConversations.delete(targetUserId);

  await interaction.reply({ content: '✅ DM Ticket başarıyla kapatıldı.', ephemeral: true });

  const closeEmbed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('🔒 DM Ticket Kapatıldı')
    .setDescription(
      `**Kapatan Yetkili:** ${interaction.user.tag}\n` +
      `⏳ Kanal 3 dakika içinde otomatik olarak silinecektir.`
    )
    .setTimestamp();

  await interaction.channel.send({ embeds: [closeEmbed] }).catch(() => {});

  // Kullanıcıya DM
  try {
    const user = await client.users.fetch(targetUserId);
    const dmEmbed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🔒 Destek Talebiniz Kapatıldı')
      .setDescription(
        `Destek talebiniz yetkili **${interaction.user.username}** tarafından çözümlenerek kapatıldı.\n\n` +
        `⭐ **Değerlendirme Yapmayı Unutmayın!**\n` +
        `Aldığınız hizmet kalitesini aşağıdaki butonlardan puanlayabilirsiniz.`
      )
      .setFooter({ text: 'Sentara Destek • Bizi tercih ettiğiniz için teşekkürler.' })
      .setTimestamp();

    const rateRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`dm_rate_5_${ticketId}`).setLabel('⭐⭐⭐⭐⭐ (5)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`dm_rate_4_${ticketId}`).setLabel('⭐⭐⭐⭐ (4)').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`dm_rate_3_${ticketId}`).setLabel('⭐⭐⭐ (3)').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`dm_rate_1_${ticketId}`).setLabel('⭐ (1)').setStyle(ButtonStyle.Danger)
    );

    await user.send({ embeds: [dmEmbed], components: [rateRow] }).catch(() => {});
  } catch (_) {}

  const channelToDelete = interaction.channel;
  const channelId = channelToDelete.id;
  const guildId = channelToDelete.guild?.id;

  setTimeout(async () => {
    try {
      if (guildId) {
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (guild) {
          const ch = await guild.channels.fetch(channelId).catch(() => null);
          if (ch) await ch.delete('DM Ticket kapatıldı');
        }
      } else {
        await channelToDelete.delete('DM Ticket kapatıldı').catch(() => {});
      }
    } catch (_) {}
  }, 3 * 60 * 1000);

  return true;
}

// ── Moderatör Yetki Kontrolü ────────────────────────────────────────────────
async function isModeratorOrStaff(userId, client) {
  const { ADMIN_IDS, TARGET_GUILD_ID } = require('../../config');
  if (ADMIN_IDS && ADMIN_IDS.includes(userId)) return true;

  try {
    const StaffProgress = require('../../models/StaffProgress');
    const staff = await StaffProgress.findOne({ userId });
    if (staff && staff.level >= 1) return true;
  } catch (_) {}

  const guildsToCheck = [TARGET_GUILD_ID, '1367646464804655104'];
  const staffRoleIds = [
    '1518692395774906648',
    '1518692394495643830',
    '1518692393660973186',
    '1518692392415395971',
    '1518709348506013706',
    '1518692391312298045',
  ];

  for (const gId of guildsToCheck) {
    if (!gId) continue;
    try {
      const guild = client.guilds.cache.get(gId) || await client.guilds.fetch(gId).catch(() => null);
      if (guild) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
          if (member.permissions.has('Administrator') || member.permissions.has('ManageGuild')) return true;
          if (staffRoleIds.some(rid => member.roles.cache.has(rid))) return true;
        }
      }
    } catch (_) {}
  }

  return false;
}

module.exports = {
  handleDMMessage,
  handleDMButton,
  handleDMModal,
  forwardChannelToDM,
  handleDMCloseButton,
  activeDMTickets,
};
