/**
 * Form Interview Scheduler Service
 * Periodically checks scheduled interview times and sends countdown reminders
 * (15, 10, 5, 1 minute before) with roleplay advice & Roblox game link dispatch.
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const FormSubmission = require("../../models/FormSubmission");
const { getDiscordClient } = require("../discordClient");

let schedulerInterval = null;

// Realistic RP Tips for each countdown stage
const RP_ADVICE = {
  "15m": [
    "• **RESMİ KONUŞUN:** Ciddiyetinizi ve saygınızı koruyun, resmi ve kurumsal bir dil tercih edin.",
    "• **DİSİPLİNLİ OLUN:** Soru ve yönergelere eksiksiz odaklanın.",
    "• **KENDİNİZİ İYİ YANSITIN:** Becerilerinizi ve tecrübelerinizi kendinden emin biçimde aktarın.",
    "• **SESTE İSE:** Konuşurken sesinizi kalın, disiplinli, net ve özgüvenli tutun. RP kurallarına sadık kalın!",
  ].join("\n"),

  "10m": [
    "• **HAZIRLIK:** Roblox veya Discord ortamınızı hazır hale getirin, arka plan seslerini minimize edin.",
    "• **SOĞUKKANLILIK:** Heyecan yapmayın, net ve anlaşılır cümleler kurun.",
    "• **DİSİPLİNLİ DURUŞ:** Mülakat yapan yetkilinin sözünü kesmeyiniz.",
    "• **RP SADAKATİ:** Rolün gerektirdiği ciddi tavrı ve resmiyet seviyesini koruyun!",
  ].join("\n"),

  "5m": [
    "• **SON KONTROLLER:** Kulaklık, mikrofon ve Roblox istemcinizin sorunsuz çalıştığından emin olun.",
    "• **ÖZGÜVEN:** Sorulara açık, net ve kararlı yanıtlar verin.",
    "• **DISCIPLINES:** Talimat verildiğinde derhal uygulayın.",
    "• **SES VE RP:** Seste konuşacaksanız sesinizi oturaklı, tok ve kendinden emin tutun!",
  ].join("\n"),

  "1m": [
    "• **SON 1 DAKİKA:** Oyun linki birkaç saniye içinde iletilecektir!",
    "• **ODAKLANMA:** Tüm dikkatinizi mülakata verin, resmiyet ve disiplini ilk saniyeden itibaren hissettirin.",
    "• **BAŞARILAR:** Kendinizi en iyi şekilde yansıtacağınıza inanıyoruz!",
  ].join("\n"),
};

function parseTimeToDate(timeVal) {
  if (!timeVal) return null;
  if (timeVal instanceof Date) return timeVal;
  const d = new Date(timeVal);
  if (!isNaN(d.getTime())) return d;
  return null;
}

async function checkAndSendReminders() {
  const client = getDiscordClient();
  if (!client || !client.isReady()) return;

  try {
    const submissions = await FormSubmission.findAll();
    const now = new Date();

    for (const sub of submissions) {
      if (!sub.interviewScheduledTime || sub.status === "REJECTED" || sub.interviewState === "COMPLETED") {
        continue;
      }

      const scheduledDate = parseTimeToDate(sub.interviewScheduledTime);
      if (!scheduledDate) continue;

      const diffMs = scheduledDate.getTime() - now.getTime();
      const diffMin = Math.round(diffMs / 60000);

      sub.remindersSent = sub.remindersSent || [];
      const { extractTargetDiscordId } = require("./formInterviewService");
      const discordId = extractTargetDiscordId(sub);
      if (!discordId) continue;

      // ── 15 Minutes Reminder ──────────────────────────────────────────────
      if (diffMin <= 15 && diffMin > 10 && !sub.remindersSent.includes("15m")) {
        await sendReminderDM(client, discordId, 15, RP_ADVICE["15m"]);
        sub.remindersSent.push("15m");
        await FormSubmission.update(sub._id, { remindersSent: sub.remindersSent });
      }

      // ── 10 Minutes Reminder ──────────────────────────────────────────────
      if (diffMin <= 10 && diffMin > 5 && !sub.remindersSent.includes("10m")) {
        await sendReminderDM(client, discordId, 10, RP_ADVICE["10m"]);
        sub.remindersSent.push("10m");
        await FormSubmission.update(sub._id, { remindersSent: sub.remindersSent });
      }

      // ── 5 Minutes Reminder ───────────────────────────────────────────────
      if (diffMin <= 5 && diffMin > 1 && !sub.remindersSent.includes("5m")) {
        await sendReminderDM(client, discordId, 5, RP_ADVICE["5m"]);
        sub.remindersSent.push("5m");
        await FormSubmission.update(sub._id, { remindersSent: sub.remindersSent });
      }

      // ── 1 Minute Reminder ────────────────────────────────────────────────
      if (diffMin <= 1 && diffMin > -2 && !sub.remindersSent.includes("1m")) {
        await sendReminderDM(client, discordId, 1, RP_ADVICE["1m"]);
        sub.remindersSent.push("1m");
        await FormSubmission.update(sub._id, { remindersSent: sub.remindersSent });
      }

      // ── Exact Time (0 min or link dispatch) ──────────────────────────────
      if (diffMin <= 0 && diffMin >= -15 && !sub.remindersSent.includes("exact")) {
        await sendGameLinkAndJoinStatusDM(client, discordId, sub);
        sub.remindersSent.push("exact");
        await FormSubmission.update(sub._id, {
          remindersSent: sub.remindersSent,
          interviewState: "GAME_LINK_SENT",
        });
      }
    }
  } catch (err) {
    console.error("[formInterviewScheduler] Error checking reminders:", err.message);
  }
}

async function sendReminderDM(client, discordId, minutesLeft, adviceText) {
  try {
    const user = await client.users.fetch(discordId).catch(() => null);
    if (!user) return;

    const embed = new EmbedBuilder()
      .setColor(0x818cf8)
      .setTitle(`⏳ MÜLAKATINIZ ${minutesLeft} DAKİKA SONRA BAŞLAYACAK!`)
      .setDescription(
        `Sayın Aday,\n` +
        `Mülakat saatinize **${minutesLeft} dakika** kalmıştır.\n\n` +
        `📌 **BİLMENİZ GEREKENLER & MÜLAKAT TAVSİYELERİ:**\n` +
        `${adviceText}\n\n` +
        `*Lütfen mülakat saatinizde hazır bulunun.*`
      )
      .setFooter({ text: "Sentara Otomatik Mülakat Hatırlatıcısı" });

    await user.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    console.error(`[formInterviewScheduler] Reminder send error to ${discordId}:`, err.message);
  }
}

async function sendGameLinkAndJoinStatusDM(client, discordId, submission) {
  try {
    const user = await client.users.fetch(discordId).catch(() => null);
    if (!user) return;

    const gameLink = submission.robloxGameLink || "https://www.roblox.com/";

    const embed = new EmbedBuilder()
      .setColor(0x34d399)
      .setTitle("🎮 MÜLAKAT SAATİ GELDİ! OYUNA KATILIN")
      .setDescription(
        `**Sayın ${submission.discordUsername || "Aday"},**\n\n` +
        `Mülakat saatiniz gelmiştir. Aşağıdaki buton veya bağlantı üzerinden mülakat oyun sunucusuna katılım sağlayabilirsiniz.\n\n` +
        `🔗 **Roblox Oyun Linki:** [Oyuna Tıkla ve Katıl](${gameLink})\n\n` +
        `**Oyuna katıldıktan sonra lütfen aşağıdaki butonla katılımınızı doğrulayınız:**`
      )
      .setFooter({ text: "Katılım sağladıktan sonra 'EVET, KATILDIM' butonuna basınız." });

    const components = [];
    const linkRow = new ActionRowBuilder();

    // Try adding URL button if valid URL
    if (gameLink.startsWith("http://") || gameLink.startsWith("https://")) {
      linkRow.addComponents(
        new ButtonBuilder()
          .setLabel("🎮 OYUNA KATIL")
          .setStyle(ButtonStyle.Link)
          .setURL(gameLink)
      );
    }

    const joinStatusRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fint_joined_yes_${submission._id}`)
        .setLabel("EVET, KATILDIM")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`fint_joined_no_${submission._id}`)
        .setLabel("HAYIR, KATILAMADIM")
        .setStyle(ButtonStyle.Danger)
    );

    if (linkRow.components.length > 0) {
      components.push(linkRow);
    }
    components.push(joinStatusRow);

    await user.send({ embeds: [embed], components }).catch(() => {});
  } catch (err) {
    console.error(`[formInterviewScheduler] Game link send error to ${discordId}:`, err.message);
  }
}

function startScheduler() {
  if (schedulerInterval) return;
  console.log("[formInterviewScheduler] Starting interview reminder interval...");
  // Check every 30 seconds
  schedulerInterval = setInterval(checkAndSendReminders, 30000);
}

function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  checkAndSendReminders,
};
