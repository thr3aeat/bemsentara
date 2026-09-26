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
          activeEscalations.set(item.ticketId, item);
        }
      }
      if (Array.isArray(data.interventions)) {
        for (const item of data.interventions) {
          ticketInterventions.set(item.ticketId, item);
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

    const data = {
      escalations: Array.from(activeEscalations.values()),
      interventions: Array.from(ticketInterventions.values()),
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

  const intervention = ticketInterventions.get(ticketId) || { attempts: 0 };
  intervention.stage = 'escalated';
  intervention.lastInterventionAt = new Date().toISOString();
  ticketInterventions.set(ticketId, intervention);
  saveState();

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

  const targetEscalation = getLatestEscalatedTicket();
  if (!targetEscalation) {
    return false; // Aktif eskalasyon yoksa normal telegram akışı devam etsin
  }

  const prompt =
    `Sen EKOai Telegram Yönetim Köprüsüsün.\n` +
    `EkoYıldız Yönetim Kurulu Başkanı (Eko) Telegram'dan bir mesaj yazdı: "${telegramText}"\n\n` +
    `Aktif Discord Destek Bileti Bilgileri:\n` +
    `- Bilet No: #${targetEscalation.ticketId}\n` +
    `- Konu: ${targetEscalation.subject}\n` +
    `- Kullanıcı: ${targetEscalation.userName}\n\n` +
    `GÖREV:\n` +
    `1. Bu mesaj Discord biletindeki kullanıcıya iletilecek bir yanıt/talimat mı? ` +
    `(Örn: "Yetkili arkadaşlar ilgilenecektir", "Dekontu kanala atmasını söyleyin", "Kontrol ettim hallediyorum" vb.)\n` +
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

    const channel = await client.channels.fetch(targetEscalation.channelId).catch(() => null);

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
    }
  } catch (err) {
    logger.error(`[EKOai] handleEkoTelegramBridge hata: ${err.message}`);
  }

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
      const createdAt = new Date(ticket.createdAt || now).getTime();
      const openMinutes = Math.floor((now - createdAt) / (60 * 1000));

      const intervention = ticketInterventions.get(ticketId) || { stage: 'none', attempts: 0 };

      // En az 3 dakikadır açık olan biletlere müdahale edilir
      if (openMinutes < 3) continue;

      // Zaten eskalasyon yapılmışsa tekrar otomatik spam yapma
      if (intervention.stage === 'escalated') continue;

      // Son müdahaleden bu yana en az 5 dakika geçmiş olmalı
      if (intervention.lastInterventionAt) {
        const lastMs = new Date(intervention.lastInterventionAt).getTime();
        if (now - lastMs < 5 * 60 * 1000) continue;
      }

      const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
      if (!channel || typeof channel.send !== 'function') continue;

      logger.info(`[EKOai] Bilet #${ticketId} uzun süredir açık (${openMinutes} dk). Değerlendiriliyor...`);

      const evaluation = await evaluateTicketWithAI(ticket);

      if (evaluation.canSolveEasily && evaluation.easySolution && intervention.stage === 'none') {
        // Kolay çözülebilecek bir şey ise önce yorum/bilgi sun
        intervention.stage = 'interpreted';
        intervention.lastInterventionAt = new Date().toISOString();
        intervention.attempts = (intervention.attempts || 0) + 1;
        ticketInterventions.set(ticketId, intervention);
        saveState();

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
        // Zor veya uzun süredir bekleyen bilet: Kullanıcıya başkana bağlama teklifi sun
        intervention.stage = 'offered_escalation';
        intervention.lastInterventionAt = new Date().toISOString();
        intervention.attempts = (intervention.attempts || 0) + 1;
        ticketInterventions.set(ticketId, intervention);
        saveState();

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
 * Bilet izleme zamanlayıcısını başlatır (Her 2 dakikada bir kontrol)
 */
function startEkoAITicketMonitor(client) {
  if (monitorInterval) clearInterval(monitorInterval);

  logger.info('[EKOai] 🤖 Destek biletleri AI ve Telegram Yönetim Köprüsü monitörü aktif (2 dk periyot).');

  // İlk kontrolü 30 saniye sonra yap
  setTimeout(() => {
    processOpenTickets(client).catch(() => {});
  }, 30000);

  monitorInterval = setInterval(() => {
    processOpenTickets(client).catch(() => {});
  }, 2 * 60 * 1000);
}

module.exports = {
  startEkoAITicketMonitor,
  processOpenTickets,
  evaluateTicketWithAI,
  escalateToEkoTelegram,
  handleEkoTelegramBridge,
  handleTicketChannelMessage,
  handleButtonInteraction,
  getLatestEscalatedTicket
};
