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
    `• <b>Bilet ID:</b> <code>#${escapeHtml(ticketId)}</code>\n` +
    `• <b>Kullanıcı:</b> ${escapeHtml(userName)} (ID: <code>${escapeHtml(ticket.userId)}</code>)\n` +
    `• <b>Konu:</b> ${escapeHtml(subject)}\n` +
    `• <b>Kanal:</b> #${escapeHtml(channelName)}\n` +
    (userNote ? `• <b>Kullanıcı Notu:</b> ${escapeHtml(userNote)}\n\n` : `\n`) +
    `<i>💡 Bu mesajı yanıtlarsanız (reply) veya mesajınıza <code>#${escapeHtml(ticketId)}</code> yazarsanız, yanıtınız olduğu gibi Discord biletine aktarılır.\n` +
    `Komutlar: /durum (bilet durumu) • /biletler (bekleyen biletler)</i>`;

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

const TICKET_ID_PATTERN = /#?\b(TK-[A-Z0-9]+(?:-[A-Z0-9]+)*)/i;
const MAX_FORWARD_LENGTH = 3500;
const ESCALATION_COOLDOWN_MS = 60 * 60 * 1000; // Aynı bilet için en fazla saatte bir Telegram çağrısı

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractTicketId(text) {
  const match = (text || '').match(TICKET_ID_PATTERN);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Bilet kapandığında Telegram köprüsündeki aktif eskalasyonu temizler.
 */
function clearEscalation(ticketId) {
  if (!ticketId || !activeEscalations.has(ticketId)) return false;
  activeEscalations.delete(ticketId);
  saveState();
  return true;
}

async function findTicketChannel(client, ticket) {
  let channel = ticket.channelId
    ? await client.channels.fetch(ticket.channelId).catch(() => null)
    : null;
  if (!channel && client.guilds?.cache) {
    const nameNeedle = String(ticket.ticketId).toLowerCase();
    for (const guild of client.guilds.cache.values()) {
      channel = guild.channels.cache.find(c => c.name && c.name.toLowerCase().includes(nameNeedle));
      if (channel) break;
    }
  }
  return channel && typeof channel.send === 'function' ? channel : null;
}

/**
 * /biletler — Eko'yu bekleyen (hâlâ açık) eskalasyonları listeler, kapananları temizler.
 */
async function sendEscalationList() {
  const waiting = [];
  for (const esc of Array.from(activeEscalations.values())) {
    const dbTicket = await Ticket.findOne({ ticketId: esc.ticketId });
    if (!dbTicket || dbTicket.status !== 'open') {
      activeEscalations.delete(esc.ticketId);
      continue;
    }
    waiting.push({ esc, dbTicket });
  }
  saveState();

  if (waiting.length === 0) {
    await sendTelegramAlert('✅ <b>Sizi bekleyen açık destek bileti yok.</b>');
    return;
  }

  waiting.sort((a, b) => new Date(a.esc.escalatedAt).getTime() - new Date(b.esc.escalatedAt).getTime());
  const lines = waiting.map(({ esc, dbTicket }) => {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(esc.escalatedAt).getTime()) / 60000));
    return `• <code>#${escapeHtml(esc.ticketId)}</code> — ${escapeHtml(dbTicket.userName || esc.userName || 'Kullanıcı')}: ` +
      `${escapeHtml(dbTicket.subject || esc.subject || 'Destek')} <i>(${minutes} dk önce)</i>`;
  });

  await sendTelegramAlert(
    `📋 <b>Sizi Bekleyen Biletler (${waiting.length})</b>\n\n${lines.join('\n')}\n\n` +
    `<i>Yanıtlamak için bilet bildirimini yanıtlayın (reply) veya mesajınıza bilet numarasını yazın.</i>`
  );
}

/**
 * /durum TK-... — Biletin durumunu ve son mesajlarını Eko'ya gönderir.
 */
async function sendTicketStatus(client, ticket) {
  const channel = await findTicketChannel(client, ticket);
  let recent = '';
  if (channel && typeof channel.messages?.fetch === 'function') {
    const fetched = await channel.messages.fetch({ limit: 6 }).catch(() => null);
    const list = fetched ? (typeof fetched.values === 'function' ? Array.from(fetched.values()) : Array.from(fetched)) : [];
    recent = list
      .filter(m => m.content)
      .sort((a, b) => (a.createdTimestamp || 0) - (b.createdTimestamp || 0))
      .map(m => {
        const author = m.author?.bot ? '🤖 Bot' : (m.author?.username || 'Kullanıcı');
        const text = m.content.length > 160 ? `${m.content.slice(0, 160)}…` : m.content;
        return `• <b>${escapeHtml(author)}:</b> ${escapeHtml(text)}`;
      })
      .join('\n');
  }

  const statusText = ticket.status === 'open' ? '🟢 Açık' : `🔒 ${escapeHtml(ticket.status)}`;
  await sendTelegramAlert(
    `📄 <b>Bilet Durumu — <code>#${escapeHtml(ticket.ticketId)}</code></b>\n\n` +
    `• <b>Durum:</b> ${statusText}\n` +
    `• <b>Kullanıcı:</b> ${escapeHtml(ticket.userName || 'Bilinmiyor')} (ID: <code>${escapeHtml(ticket.userId)}</code>)\n` +
    `• <b>Konu:</b> ${escapeHtml(ticket.subject || 'Destek')}\n` +
    `• <b>Üstlenen:</b> ${escapeHtml(ticket.claimedByName || 'Yok')}\n` +
    (channel ? `• <b>Kanal:</b> #${escapeHtml(channel.name)}\n` : `• <b>Kanal:</b> bulunamadı\n`) +
    (recent ? `\n<b>Son mesajlar:</b>\n${recent}` : '')
  );
}

/**
 * Eko Telegram'dan yazdığında çağrılır.
 * Yalnızca bilet bildirimine yanıt (reply) verilmişse veya mesajda bilet numarası varsa
 * mesajı olduğu gibi Discord bilet kanalına aktarır. Diğer mesajlar normal EKOai sohbetine gider.
 */
async function handleEkoTelegramBridge(client, telegramText, rawMessage) {
  if (!telegramText || typeof telegramText !== 'string') return false;

  const trimmed = telegramText.trim();
  const command = (trimmed.match(/^\/(\w+)/) || [])[1]?.toLowerCase() || null;

  if (command === 'biletler') {
    await sendEscalationList();
    return true;
  }

  // Bilet numarası: önce mesajın kendisinden, yoksa yanıtlanan bildirimden
  const replyText = rawMessage?.reply_to_message?.text || rawMessage?.reply_to_message?.caption || '';
  const targetTicketId = extractTicketId(trimmed) || extractTicketId(replyText);
  if (!targetTicketId) {
    if (command === 'durum') {
      await sendTelegramAlert('ℹ️ Kullanım: <code>/durum TK-XXXX</code> veya bir bilet bildirimini yanıtlayarak <code>/durum</code> yazın.');
      return true;
    }
    return false; // Bilet hedeflenmedi → normal EKOai Telegram sohbeti
  }

  const ticket = await Ticket.findOne({ ticketId: targetTicketId });
  if (!ticket) {
    await sendTelegramAlert(`⚠️ <code>#${escapeHtml(targetTicketId)}</code> numaralı bilet bulunamadı.`);
    return true;
  }

  if (command === 'durum') {
    await sendTicketStatus(client, ticket);
    return true;
  }

  if (ticket.status !== 'open') {
    clearEscalation(ticket.ticketId);
    await sendTelegramAlert(
      `⚠️ Sayın Başkanım, <code>#${escapeHtml(ticket.ticketId)}</code> bileti kapatılmış; mesajınız iletilmedi.`
    );
    return true;
  }

  // Bilet numarasını ve baştaki ayraçları mesajdan temizle; metni AI ile değiştirmeden aktar
  let messageForUser = trimmed
    .replace(new RegExp(TICKET_ID_PATTERN.source, 'gi'), '')
    .replace(/^[\s:,.\-–—]+/, '')
    .trim();
  if (!messageForUser) {
    await sendTelegramAlert(
      `ℹ️ <code>#${escapeHtml(ticket.ticketId)}</code> için iletilecek bir mesaj yazmadınız.`
    );
    return true;
  }
  if (messageForUser.length > MAX_FORWARD_LENGTH) {
    messageForUser = `${messageForUser.slice(0, MAX_FORWARD_LENGTH)}…`;
  }

  logger.info(`[EKOai] Telegram köprü mesajı alındı -> Hedef Bilet: #${ticket.ticketId}`);

  const channel = await findTicketChannel(client, ticket);
  if (!channel) {
    logger.warn(`[EKOai] Hedef kanal bulunamadı (${ticket.channelId}).`);
    await sendTelegramAlert(
      `⚠️ Sayın Başkanım, <code>#${escapeHtml(ticket.ticketId)}</code> biletinin Discord kanalı bulunamadı.`
    );
    return true;
  }

  const quoted = messageForUser.split(/\r?\n/).map(line => `> ${line}`).join('\n');
  const allowedMentions = { users: ticket.userId ? [ticket.userId] : [] };
  const discordPayload = {
    flags: ComponentsV2Factory.FLAGS,
    allowedMentions,
    components: [
      ComponentsV2Factory.container([
        ComponentsV2Factory.text(
          `### 👑 EkoYıldız Yönetim Kurulu Başkanı'ndan Mesaj\n` +
          (ticket.userId ? `<@${ticket.userId}>\n\n` : '\n') +
          `${quoted}\n\n` +
          `*Mesaj EKOai Telegram Yönetim Köprüsü aracılığıyla aktarılmıştır. Yanıtınızı bu kanala yazabilirsiniz.*`
        )
      ])
    ]
  };

  const sent = await channel.send(discordPayload).then(() => true, async () => {
    return channel.send({
      allowedMentions,
      content:
        `👑 **EkoYıldız Yönetim Kurulu Başkanı'ndan Mesaj** ${ticket.userId ? `<@${ticket.userId}>` : ''}\n\n${quoted}\n\n` +
        `*EKOai Telegram Köprüsü üzerinden iletildi.*`
    }).then(() => true, () => false);
  });

  if (!sent) {
    await sendTelegramAlert(
      `❌ <code>#${escapeHtml(ticket.ticketId)}</code> biletine mesaj gönderilemedi (Discord izin/bağlantı hatası).`
    );
    return true;
  }

  await sendTelegramAlert(
    `✅ <b>İletildi:</b> Yanıtınız <b>#${escapeHtml(channel.name)}</b> (<code>#${escapeHtml(ticket.ticketId)}</code>) biletine aktarıldı.`
  );
  return true;
}

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

const ESCALATION_REQUEST_PATTERN = /(^|[^\p{L}\p{N}])(eko|başkan\p{L}*|telegram\p{L}*|yönetim kurulu\p{L}*)(?=$|[^\p{L}\p{N}])/iu;

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

  // Kullanıcı başkanı veya telegram'ı özellikle talep ediyorsa ("ekonomi" gibi kelimeler tetiklemez)
  if (!ESCALATION_REQUEST_PATTERN.test(message.content || '')) return;

  // Aynı bilet için Telegram'a saatte en fazla bir çağrı gönder (spam önleme)
  const previous = activeEscalations.get(ticket.ticketId);
  if (previous && Date.now() - new Date(previous.escalatedAt).getTime() < ESCALATION_COOLDOWN_MS) return;

  await escalateToEkoTelegram(ticket, channel, client, message.content);
}

/**
 * Discord buton etkileşimlerini yönetir
 */
async function handleButtonInteraction(interaction) {
  const { customId } = interaction;
  if (!customId.startsWith('ekoai_')) return false;

  // Defer başarısızsa (etkileşim zaten yanıtlanmış) editReply InteractionNotReplied fırlatır; dur
  if (!interaction.deferred && !interaction.replied) {
    const ok = await interaction.deferReply({ ephemeral: true }).then(() => true, () => false);
    if (!ok) return true;
  }

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
  clearEscalation,
  extractTicketId,
  escapeHtml,
  ticketInterventions,
  activeEscalations,
  loadState,
  saveState
};
