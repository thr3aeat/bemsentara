'use strict';

const fs = require('fs');
const path = require('path');
const { ButtonStyle, ChannelType } = require('discord.js');
const Ticket = require('../../models/Ticket');
const { chatWithAI } = require('./aiService');
const { sendTelegramAlert } = require('./telegramService');
const ComponentsV2Factory = require('../utils/componentsV2Factory');
const logger = require('../../utils/logger');

const STATE_FILE = path.join(__dirname, '../../data/ekoai_ticket_state.json');

// In-memory state
const activeEscalations = new Map(); // ticketId -> { ticketId, channelId, guildId, userId, userName, subject, escalatedAt }
const ticketInterventions = new Map(); // ticketId -> { stage: 'none'|'interpreted'|'escalated', lastInterventionAt, attempts }

let monitorInterval = null;

/**
 * State dosyasını yükler
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (Array.isArray(data.escalations)) {
        for (const item of data.escalations) {
          if (item && item.ticketId) {
            activeEscalations.set(item.ticketId, item);
          }
        }
      }
      if (Array.isArray(data.interventions)) {
        for (const item of data.interventions) {
          if (item && item.ticketId) {
            ticketInterventions.set(item.ticketId, item);
          }
        }
      }
    }
  } catch (err) {
    logger.warn(`[EKOai] State yüklenirken hata: ${err.message}`);
  }
}

/**
 * State dosyasını kaydeder
 */
function saveState() {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const interventionsList = [];
    for (const [id, item] of ticketInterventions.entries()) {
      interventionsList.push({
        ticketId: id,
        ...item
      });
    }

    const data = {
      escalations: Array.from(activeEscalations.values()),
      interventions: interventionsList,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    logger.warn(`[EKOai] State kaydedilirken hata: ${err.message}`);
  }
}

loadState();

/**
 * En son eskalasyon yapılmış aktif bileti getirir
 */
function getLatestEscalatedTicket() {
  if (activeEscalations.size === 0) return null;
  const list = Array.from(activeEscalations.values());
  list.sort((a, b) => new Date(b.escalatedAt).getTime() - new Date(a.escalatedAt).getTime());
  return list[0];
}

/**
 * Destek biletini AI ile analiz eder: Kolay mı, zor/eskalasyon mu?
 */
async function evaluateTicketWithAI(ticket, recentContext = '') {
  const subject = ticket.subject || 'Genel Destek';
  const desc = ticket.description || 'Belirtilmedi';
  const category = ticket.category || 'other';

  const prompt =
    `Sen EKOai Destek Asistanısın. EkoYıldız topluluğunun Discord destek biletlerini denetlersin.\n\n` +
    `Bilet Bilgileri:\n` +
    `- Konu: ${subject}\n` +
    `- Açıklama: ${desc}\n` +
    `- Kategori: ${category}\n` +
    (recentContext ? `- Son Mesajlar: ${recentContext}\n\n` : `\n`) +
    `GÖREV:\n` +
    `1. Bu biletteki soru / konu kolayca çözülebilecek, bilgilendirme yapılabilecek standart bir konu mu? ` +
    `(Örn: Yetkili alımları nasıl yapılır, Robux/mağaza teslimat süresi, rol alma, Discord/Roblox kuralları, genel bilgilendirme, bot komutları vb.)\n` +
    `2. Yoksa zor, finansal/hesap uyuşmazlığı, ceza itirazı, yetkili onayı gerektiren veya kullanıcının cevapsız kalıp mağdur olduğu bir konu mu?\n\n` +
    `YALNIZCA GEÇERLİ JSON YANITI DÖN (başka hiçbir metin yazma):\n` +
    `{\n` +
    `  "canSolveEasily": true_veya_false,\n` +
    `  "easySolution": "Kullanıcıya sorunu çözecek net, saygılı, rehberlik edici Türkçe açıklama (max 350 karakter)",\n` +
    `  "difficultyReason": "Zor olma veya yetkiliye/başkana bağlanma sebebi"\n` +
    `}`;

  try {
    const aiRes = await chatWithAI(prompt, 'Sen EKOai bilet çözüm asistanısın. Yalnızca JSON formatında yanıt ver.');
    if (aiRes) {
      const jsonMatch = aiRes.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (err) {
    logger.warn(`[EKOai] evaluateTicketWithAI hata: ${err.message}`);
  }

  return {
    canSolveEasily: false,
    easySolution: null,
    difficultyReason: 'Otomatik AI analizi yapılamadı veya konu özel inceleme gerektiriyor.'
  };
}

/**
 * Eko'ya Telegram üzerinden çağrı / bildirim gönderir
 */
async function escalateToEkoTelegram(ticket, channel, client, userNote = '') {
  const ticketId = ticket.ticketId;
  const channelName = channel?.name || `ticket-${ticketId}`;
  const userName = ticket.userName || `<@${ticket.userId}>`;
  const subject = ticket.subject || 'Genel Destek';

  activeEscalations.set(ticketId, {
    ticketId,
    channelId: channel.id,
    guildId: channel.guild?.id,
    userId: ticket.userId,
    userName: ticket.userName || 'Bilinmiyor',
    subject,
    escalatedAt: new Date().toISOString()
  });

  const intervention = ticketInterventions.get(ticketId) || { ticketId, attempts: 0 };
  intervention.ticketId = ticketId;
  intervention.stage = 'escalated';
  intervention.lastInterventionAt = new Date().toISOString();
  ticketInterventions.set(ticketId, intervention);
  saveState();

  ticket.ekoaiIntervened = true;
  ticket.ekoaiStage = 'escalated';
  if (typeof ticket.save === 'function') {
    await ticket.save().catch(() => {});
  }

  const telegramHtml =
    `👑 <b>EKOai — Destek Bileti Yönetici Bildirimi</b>\n\n` +
    `Sayın Yönetim Kurulu Başkanım (Eko), Discord destek biletinde sizi bekleyen bir kullanıcı var.\n\n` +
    `• <b>Bilet ID:</b> <code>#${ticketId}</code>\n` +
    `• <b>Kullanıcı:</b> ${userName} (ID: <code>${ticket.userId}</code>)\n` +
    `• <b>Konu:</b> ${subject}\n` +
    `• <b>Kanal:</b> #${channelName}\n` +
    (userNote ? `• <b>Kullanıcı Notu:</b> ${userNote}\n\n` : `\n`) +
    `<i>💡 Bu mesaja Telegram'dan doğrudan yanıt verirseniz veya mesaj yazarsanız, EKOai yanıtınızı Discord biletine otomatik olarak aktaracaktır.</i>`;

  await sendTelegramAlert(telegramHtml);

  // Discord kanalına Components V2 (accent colorsuz) bildirim gönder
  const payload = {
    flags: ComponentsV2Factory.FLAGS,
    components: [
      ComponentsV2Factory.container([
        ComponentsV2Factory.text(
          `### 📲 EKOai — Telegram Bağlantısı Kuruldu\n` +
          `Sayın <@${ticket.userId}>, destek talebiniz **EkoYıldız Yönetim Kurulu Başkanı'na** Telegram üzerinden ivedilikle iletildi.\n\n` +
          `*Başkanımız Telegram üzerinden yanıt verdiğinde veya talimat ilettiğinde, mesajı anında bu kanala aktarılacaktır.*`
        )
      ])
    ]
  };

  await channel.send(payload).catch(async () => {
    await channel.send({
      content:
        `📲 **EKOai — Telegram Bağlantısı Kuruldu**\n` +
        `Sayın <@${ticket.userId}>, durum **EkoYıldız Yönetim Kurulu Başkanı'na** Telegram üzerinden iletildi. Başkan yanıt verdiğinde buraya aktarılacaktır.`
    });
  });

  logger.success(`[EKOai] Bilet #${ticketId} Eko'ya (Telegram) eskalasyon yapıldı.`);
}

/**
 * Eko Telegram'dan yanıt yazdığında çağrılır.
 * Mesajı analiz edip bilet kanalına iletir veya Eko'ya AI yanıtı döner.
 */
async function handleEkoTelegramBridge(client, telegramText, rawMessage) {
  if (!telegramText || typeof telegramText !== 'string') return false;

  // 1. Reply edilen mesajdan bilet ID'sini çıkar (Örn: #TK-MU5WLFQ1-STEMU veya Bilet ID: #TK-...)
  let targetTicketId = null;
  const replyText = rawMessage?.reply_to_message?.text || '';
  const matchReply = replyText.match(/#?(TK-[A-Z0-9-]+)/i);
  if (matchReply) {
    targetTicketId = matchReply[1].toUpperCase();
  }

  // 2. Mesaj metninden bilet ID'sini çıkar
  if (!targetTicketId) {
    const matchMsg = telegramText.match(/#?(TK-[A-Z0-9-]+)/i);
    if (matchMsg) {
      targetTicketId = matchMsg[1].toUpperCase();
    }
  }

  // 3. Hedef bileti bul
  let targetEscalation = null;
  if (targetTicketId) {
    if (activeEscalations.has(targetTicketId)) {
      targetEscalation = activeEscalations.get(targetTicketId);
    } else {
      const dbTicket = await Ticket.findOne({ ticketId: targetTicketId });
      if (dbTicket) {
        targetEscalation = {
          ticketId: dbTicket.ticketId,
          channelId: dbTicket.channelId,
          guildId: dbTicket.guildId,
          userId: dbTicket.userId,
          userName: dbTicket.userName || 'Kullanıcı',
          subject: dbTicket.subject || 'Destek'
        };
      }
    }
  }

  if (!targetEscalation) {
    targetEscalation = getLatestEscalatedTicket();
  }

  if (!targetEscalation) {
    const openTickets = await Ticket.find({ status: 'open' });
    if (openTickets && openTickets.length > 0) {
      const sorted = openTickets.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const latestOpen = sorted[0];
      targetEscalation = {
        ticketId: latestOpen.ticketId,
        channelId: latestOpen.channelId,
        guildId: latestOpen.guildId,
        userId: latestOpen.userId,
        userName: latestOpen.userName || 'Kullanıcı',
        subject: latestOpen.subject || 'Destek'
      };
    }
  }

  if (!targetEscalation) {
    return false; // Aktif bilet yoksa normal telegram akışı devam etsin
  }

  logger.info(`[EKOai] Telegram köprü mesajı alındı: "${telegramText}" -> Hedef Bilet: #${targetEscalation.ticketId}`);

  const prompt =
    `Sen EKOai Telegram Yönetim Köprüsüsün.\n` +
    `EkoYıldız Yönetim Kurulu Başkanı (Eko) Telegram'dan bir mesaj yazdı: "${telegramText}"\n\n` +
    `Aktif Discord Destek Bileti Bilgileri:\n` +
    `- Bilet No: #${targetEscalation.ticketId}\n` +
    `- Konu: ${targetEscalation.subject}\n` +
    `- Kullanıcı: ${targetEscalation.userName}\n\n` +
    `GÖREV:\n` +
    `1. Bu mesaj Discord biletindeki kullanıcıya iletilecek bir yanıt/talimat mı? ` +
    `(Örn: "Yetkili arkadaşlar ilgilenecektir", "Dekontu kanala atmasını söyleyin", "Kontrol ettim hallediyorum", "test" vb.)\n` +
    `2. Yoksa Başkan bot'a (sana) bir soru mu soruyor? (Örn: "kim bekliyor", "durum ne", "konu nedir" vb.)\n\n` +
    `YALNIZCA GEÇERLİ JSON DÖN:\n` +
    `{\n` +
    `  "intent": "forward_to_ticket" | "reply_to_eko",\n` +
    `  "messageForUser": "Discord kanalına yazılacak temiz, net mesaj",\n` +
    `  "replyForEko": "Eko'ya Telegram'dan verilecek AI cevabı"\n` +
    `}`;

  try {
    const aiRes = await chatWithAI(prompt, 'Sen EKOai Telegram köprüsüsün. Yalnızca JSON üret.');
    let parsed = null;
    if (aiRes) {
      const match = aiRes.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    // Kanalı ID ile veya isim ile bul
    let channel = await client.channels.fetch(targetEscalation.channelId).catch(() => null);
    if (!channel) {
      for (const guild of client.guilds.cache.values()) {
        channel = guild.channels.cache.find(c =>
          c.id === targetEscalation.channelId ||
          (c.name && c.name.toLowerCase().includes(targetEscalation.ticketId.toLowerCase()))
        );
        if (channel) break;
      }
    }

    if (parsed && parsed.intent === 'reply_to_eko' && parsed.replyForEko) {
      await sendTelegramAlert(`🤖 <b>EKOai Yanıtı:</b>\n${parsed.replyForEko}`);
      return true;
    }

    // Varsayılan veya forward_to_ticket: Discord bilet kanalına Components V2 (accent colorsuz) gönder
    const messageForUser = (parsed && parsed.messageForUser) ? parsed.messageForUser : telegramText.trim();

    if (channel && typeof channel.send === 'function') {
      const discordPayload = {
        flags: ComponentsV2Factory.FLAGS,
        components: [
          ComponentsV2Factory.container([
            ComponentsV2Factory.text(
              `### 👑 EkoYıldız Yönetim Kurulu Başkanı'ndan Mesaj\n\n` +
              `> ${messageForUser}\n\n` +
              `*Mesaj EKOai Telegram Yönetim Köprüsü aracılığıyla aktarılmıştır.*`
            )
          ])
        ]
      };

      await channel.send(discordPayload).catch(async () => {
        await channel.send({
          content:
            `👑 **EkoYıldız Yönetim Kurulu Başkanı'ndan Mesaj:**\n\n> ${messageForUser}\n\n*EKOai Telegram Köprüsü üzerinden iletildi.*`
        });
      });

      await sendTelegramAlert(
        `✅ <b>İletildi:</b> Sayın Başkanım, yanıtınız <b>#${channel.name}</b> (<code>#${targetEscalation.ticketId}</code>) biletine başarıyla aktarıldı.`
      );
      return true;
    } else {
      logger.warn(`[EKOai] Hedef kanal bulunamadı (${targetEscalation.channelId}).`);
      await sendTelegramAlert(
        `⚠️ Sayın Başkanım, <code>#${targetEscalation.ticketId}</code> biletinin Discord kanalı bulunamadı veya kapatılmış.`
      );
      return true;
    }
  } catch (err) {
    logger.error(`[EKOai] handleEkoTelegramBridge hata: ${err.message}`);
  }

  return false;
}

/**
/**
 * Bir mesajın EKOai asistanına ait olup olmadığını tespit eder (V1 & V2 uyumlu).
 */
function isEkoAIMessage(m, clientUserId) {
  if (!m) return false;
  if (clientUserId && m.author?.id && m.author.id !== clientUserId) return false;

  // 1. Content kontrolü
  const content = m.content || '';
  if (content.includes('EKOai') || content.includes('Yönetim Kurulu Başkanı') || content.includes('Destek Asistanı')) {
    return true;
  }

  // 2. Embed kontrolü
  if (Array.isArray(m.embeds)) {
    for (const emb of m.embeds) {
      const embStr = `${emb.title || ''} ${emb.description || ''}`;
      if (embStr.includes('EKOai') || embStr.includes('Yönetim Kurulu Başkanı') || embStr.includes('Destek Asistanı')) {
        return true;
      }
    }
  }

  // 3. Components kontrolü (Derin özyinelemeli: Container, ActionRow, Button, TextDisplay)
  const checkComponent = (comp) => {
    if (!comp) return false;
    const cid = comp.customId || comp.custom_id || '';
    if (cid.startsWith('ekoai_')) return true;
    if (typeof comp.content === 'string' && (comp.content.includes('EKOai') || comp.content.includes('Yönetim Kurulu Başkanı') || comp.content.includes('Destek Asistanı'))) {
      return true;
    }
    if (Array.isArray(comp.components)) {
      return comp.components.some(checkComponent);
    }
    return false;
  };

  if (Array.isArray(m.components) && m.components.some(checkComponent)) {
    return true;
  }

  // 4. Raw JSON string kontrolü
  try {
    const raw = JSON.stringify(m);
    if (raw.includes('ekoai_') || raw.includes('EKOai') || raw.includes('Yönetim Kurulu Başkanı') || raw.includes('Destek Asistanı')) {
      return true;
    }
  } catch (_) {}

  return false;
}

/**
 * Açık biletleri periyodik olarak tarayıp uzun süre açık kalanları değerlendirir.
 */
async function processOpenTickets(client) {
  if (!client || !client.isReady()) return;

  try {
    const openTickets = await Ticket.find({ status: 'open' });
    if (!openTickets || openTickets.length === 0) return;

    const now = Date.now();

    for (const ticket of openTickets) {
      // Zaten bir yetkili üstlendiyse (claimedBy) EKOai araya girmez
      if (ticket.claimedBy) continue;

      const ticketId = ticket.ticketId;
      const intervention = ticketInterventions.get(ticketId) || { ticketId, stage: 'none', attempts: 0 };
      intervention.ticketId = ticketId;

      // 0. Reklam biletleri ve sipariş masaları EKOai eskalasyon/destek asistanı döngüsünden KESİNLİKLE muaftır!
      const isReklamTicket =
        ticket.category === 'reklam_destek' ||
        ticket.category === 'reklam' ||
        (typeof ticket.subject === 'string' && /reklam/i.test(ticket.subject)) ||
        (typeof ticket.ticketId === 'string' && (ticket.ticketId.startsWith('RBLX-') || ticket.ticketId.startsWith('REKLAM-')));

      if (isReklamTicket) {
        if (intervention.stage !== 'reklam_exempt') {
          intervention.stage = 'reklam_exempt';
          intervention.attempts = 1;
          ticketInterventions.set(ticketId, intervention);
          saveState();
        }
        continue;
      }

      const createdAt = new Date(ticket.createdAt || now).getTime();
      const openMinutes = Math.floor((now - createdAt) / (60 * 1000));

      // En az 3 dakikadır açık olan biletlere müdahale edilir
      if (openMinutes < 3) continue;

      // Zaten eskalasyon yapılmışsa veya eskalasyon teklifi sunulmuşsa KESİNLİKLE tekrar mesaj atma (SPAM ÖNLEME)
      if (intervention.stage === 'escalated' || intervention.stage === 'offered_escalation' || intervention.stage === 'interpreted') {
        continue;
      }

      // Herhangi bir otomatik müdahale 1 veya daha fazla kez yapıldıysa asla tekrar otomatik yazma
      if ((intervention.attempts || 0) >= 1) continue;

      // Bilet veri modelinde daha önce müdahale yapıldığı işaretliyse atla
      if (ticket.ekoaiIntervened) continue;

      // Son müdahaleden bu yana en az 5 dakika geçmiş olmalı (güvenlik tamponu)
      if (intervention.lastInterventionAt) {
        const lastMs = new Date(intervention.lastInterventionAt).getTime();
        if (now - lastMs < 5 * 60 * 1000) continue;
      }

      const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
      if (!channel || typeof channel.send !== 'function') continue;

      // KANAL MESAJ KONTROLÜ (Son 50 mesaj): Bot daha önce bu kanalda EKOai mesajı veya butonu gönderdiyse kesinlikle tekrar atma
      try {
        if (typeof channel.messages?.fetch === 'function') {
          const recentMessages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
          if (recentMessages) {
            const msgList = typeof recentMessages.values === 'function' ? Array.from(recentMessages.values()) : Array.from(recentMessages);
            const ekoAIMessages = msgList.filter(m => isEkoAIMessage(m, client.user?.id));

            if (ekoAIMessages.length > 0) {
              // Eğer kanalda birden fazla duplicate EKOai mesajı birikmişse (spam olmuşsa), en güncel 1 tanesini bırakıp eskileri sil
              if (ekoAIMessages.length > 1) {
                const duplicatesToDelete = ekoAIMessages.slice(1);
                for (const oldMsg of duplicatesToDelete) {
                  if (typeof oldMsg.delete === 'function') {
                    await oldMsg.delete().catch(() => {});
                  }
                }
              }

              intervention.stage = 'offered_escalation';
              intervention.attempts = Math.max(intervention.attempts || 0, 1);
              ticketInterventions.set(ticketId, intervention);
              saveState();
              ticket.ekoaiIntervened = true;
              ticket.ekoaiStage = 'offered_escalation';
              if (typeof ticket.save === 'function') {
                await ticket.save().catch(() => {});
              }
              try {
                const { tickets } = require('../models/Store');
                const stored = tickets.findOne({ ticketId });
                if (stored) {
                  stored.ekoaiIntervened = true;
                  stored.ekoaiStage = 'offered_escalation';
                  if (typeof stored.save === 'function') await stored.save();
                }
              } catch (_) {}
              continue;
            }
          }
        }
      } catch (e) {
        // fetch hatası durumunda devam et
      }

      logger.info(`[EKOai] Bilet #${ticketId} uzun süredir açık (${openMinutes} dk). Değerlendiriliyor...`);

      const evaluation = await evaluateTicketWithAI(ticket);

      if (evaluation.canSolveEasily && evaluation.easySolution && intervention.stage === 'none') {
        // Kolay çözülebilecek bir şey ise önce yorum/bilgi sun
        intervention.stage = 'interpreted';
        intervention.lastInterventionAt = new Date().toISOString();
        intervention.attempts = (intervention.attempts || 0) + 1;
        ticketInterventions.set(ticketId, intervention);
        saveState();

        ticket.ekoaiIntervened = true;
        ticket.ekoaiStage = 'interpreted';
        if (typeof ticket.save === 'function') {
          await ticket.save().catch(() => {});
        }
        try {
          const { tickets } = require('../models/Store');
          const stored = tickets.findOne({ ticketId });
          if (stored) {
            stored.ekoaiIntervened = true;
            stored.ekoaiStage = 'interpreted';
            if (typeof stored.save === 'function') await stored.save();
          }
        } catch (_) {}

        const solvePayload = {
          flags: ComponentsV2Factory.FLAGS,
          components: [
            ComponentsV2Factory.container([
              ComponentsV2Factory.text(
                `### 🤖 EKOai — Destek Asistanı\n` +
                `**Sayın kullanıcımız, destek talebiniz incelendi:**\n\n` +
                `${evaluation.easySolution}\n\n` +
                `*Bu bilgi sorununuzu çözdü mü? Çözülmediyse veya yetkili bekliyorsanız lütfen belirtiniz.*`
              )
            ])
          ]
        };

        await channel.send(solvePayload).catch(() => {});
        logger.info(`[EKOai] Bilet #${ticketId} için kolay çözüm yorumu gönderildi.`);
      } else {
        // Zor veya uzun süredir bekleyen bilet: Kullanıcıya başkana bağlama teklifi sun (Yalnızca 1 kez sunulur)
        intervention.stage = 'offered_escalation';
        intervention.lastInterventionAt = new Date().toISOString();
        intervention.attempts = (intervention.attempts || 0) + 1;
        ticketInterventions.set(ticketId, intervention);
        saveState();

        ticket.ekoaiIntervened = true;
        ticket.ekoaiStage = 'offered_escalation';
        if (typeof ticket.save === 'function') {
          await ticket.save().catch(() => {});
        }
        try {
          const { tickets } = require('../models/Store');
          const stored = tickets.findOne({ ticketId });
          if (stored) {
            stored.ekoaiIntervened = true;
            stored.ekoaiStage = 'offered_escalation';
            if (typeof stored.save === 'function') await stored.save();
          }
        } catch (_) {}

        const subjectText = ticket.subject ? `**${ticket.subject}**` : 'belirttiğiniz konu';
        const escalatePayload = {
          flags: ComponentsV2Factory.FLAGS,
          components: [
            ComponentsV2Factory.container([
              ComponentsV2Factory.text(
                `### 🤖 EKOai — Destek Asistanı\n` +
                `Ticketiniz uzun zamandır açık, ve konu: ${subjectText}...\n\n` +
                `Dilerseniz, sizi **EkoYıldız Yönetim Kurulu Başkanı'na** Telegram aracılığıyla bağlayabilirim.`
              ),
              ComponentsV2Factory.actionRow([
                {
                  customId: `ekoai_connect_telegram_${ticketId}`,
                  label: "👑 Yönetim Kurulu Başkanı'na Bağla",
                  style: ButtonStyle.Success,
                  emoji: "📲"
                },
                {
                  customId: `ekoai_quick_help_${ticketId}`,
                  label: "💡 Sorumu AI ile Yorumla",
                  style: ButtonStyle.Secondary,
                  emoji: "💬"
                }
              ])
            ])
          ]
        };

        await channel.send(escalatePayload).catch(() => {});
        logger.info(`[EKOai] Bilet #${ticketId} için Telegram eskalasyon teklifi sunuldu.`);
      }
    }
  } catch (err) {
    logger.error(`[EKOai] processOpenTickets hata: ${err.message}`);
  }
}

/**
 * Kullanıcı bilet kanalında mesaj yazdığında EKOai tetikleyicisi
 */
async function handleTicketChannelMessage(message, client) {
  if (!message.guild || message.author.bot) return;

  const channel = message.channel;
  const channelName = channel.name || '';
  if (!channelName.startsWith('ticket-') && !channelName.startsWith('eposta-')) return;

  const ticket = await Ticket.findOne({ channelId: channel.id, status: 'open' });
  if (!ticket || ticket.claimedBy) return;

  const text = (message.content || '').toLowerCase();

  // Kullanıcı başkanı veya telegram'ı özellikle talep ediyorsa
  if (text.includes('eko') || text.includes('başkan') || text.includes('telegram') || text.includes('yönetim kurulu')) {
    await escalateToEkoTelegram(ticket, channel, client, message.content);
    return;
  }
}

/**
 * Discord buton etkileşimlerini yönetir
 */
async function handleButtonInteraction(interaction) {
  const { customId } = interaction;
  if (!customId.startsWith('ekoai_')) return false;

  await interaction.deferReply({ ephemeral: true }).catch(() => {});

  if (customId.startsWith('ekoai_connect_telegram_')) {
    const ticketId = customId.replace('ekoai_connect_telegram_', '');
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return interaction.editReply({ content: '❌ Destek bileti kaydı bulunamadı.' });
    }

    await escalateToEkoTelegram(ticket, interaction.channel, interaction.client, 'Kullanıcı butona tıklayarak bağlantı talep etti.');
    return interaction.editReply({
      content: '✅ Durum EkoYıldız Yönetim Kurulu Başkanı’na Telegram üzerinden ivedilikle iletildi! Kanaldan yanıt bekleniyor.'
    });
  }

  if (customId.startsWith('ekoai_quick_help_')) {
    const ticketId = customId.replace('ekoai_quick_help_', '');
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return interaction.editReply({ content: '❌ Destek bileti kaydı bulunamadı.' });
    }

    const evalResult = await evaluateTicketWithAI(ticket);
    const replyText = evalResult.easySolution ||
      `Konunuz (${ticket.subject}) incelenmiştir. Yetkili ekiplerimiz en kısa sürede dönüş sağlayacaktır. İsterseniz yukarıdaki butondan doğrudan Yönetim Kurulu Başkanı'na bağlanabilirsiniz.`;

    const payload = {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container([
          ComponentsV2Factory.text(`### 🤖 EKOai — Konu İncelemesi\n${replyText}`)
        ])
      ]
    };

    await interaction.channel.send(payload).catch(() => {});
    return interaction.editReply({ content: '✅ Konu değerlendirmesi kanala Components V2 olarak aktarıldı.' });
  }

  return false;
}

/**
 * Bilet izleme zamanlayıcısını başlatır (Her 5 dakikada bir kontrol)
 */
function startEkoAITicketMonitor(client) {
  if (monitorInterval) clearInterval(monitorInterval);

  logger.info('[EKOai] 🤖 Destek biletleri AI ve Telegram Yönetim Köprüsü monitörü aktif (5 dk periyot).');

  // İlk kontrolü 60 saniye sonra yap
  setTimeout(() => {
    processOpenTickets(client).catch(() => {});
  }, 60000);

  monitorInterval = setInterval(() => {
    processOpenTickets(client).catch(() => {});
  }, 5 * 60 * 1000);
}

module.exports = {
  startEkoAITicketMonitor,
  processOpenTickets,
  isEkoAIMessage,
  evaluateTicketWithAI,
  escalateToEkoTelegram,
  handleEkoTelegramBridge,
  handleTicketChannelMessage,
  handleButtonInteraction,
  getLatestEscalatedTicket,
  ticketInterventions,
  activeEscalations,
  loadState,
  saveState
};
