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
    "• **⚡ SON KONTROLLER:** Kulaklık, mikrofon ve bağlantınızın sorunsuz çalıştığından emin olun.",
    "• **ÖZGÜVEN VE DURUŞ:** Sorulara açık, net ve kararlı yanıtlar verin.",
    "• **DİSİPLİN:** Yetkililerin yönergelerine eksiksiz odaklanın.",
    "• **SES VE TON:** Konuşurken sesinizi oturaklı, tok ve kendinden emin tutun!",
  ].join("\n"),

  "2m": [
    "• **🔥 SON 2 DAKİKA!** Mülakat odanız ve yetkilileriniz hazır! Lütfen Discord mülakat bekleme odasında hazır bulunun.",
    "• **ODAK VE DİKKAT:** Bildirim seslerini kısın, derin bir nefes alın ve tamamen sürece odaklanın.",
    "• **ÖZGÜVEN:** Rahat olun, yeteneklerinize güvenin ve rolünüze bürünün!",
    "• **HIZLI ERİŞİM:** Oyun ve ses kanalı bağlantısı 60 saniye sonra doğrudan ekranınıza düşecektir!",
  ].join("\n"),

  "1m": [
    "• **🚨 SON 60 SANİYE!** Kapılar açılıyor! Mülakat heyeti odaya giriş yaptı!",
    "• **ODAKLANMA:** İlk saniyeden itibaren resmiyet, disiplin ve enerjinizi hissettirin.",
    "• **BAŞARILAR:** Kendinizi en iyi şekilde ifade edeceğinize inanıyoruz, başarılar!",
  ].join("\n"),
};

function parseTurkeyTimeToDate(timeVal) {
  if (!timeVal) return null;
  if (timeVal instanceof Date) return timeVal;
  if (typeof timeVal !== "string") return null;

  const str = timeVal.trim();
  if (!str) return null;

  const now = new Date();

  // 1. TR Full Date format: "10.08.2026 - 20:00" or "10/08/2026 20:00" or "10.08.2026 20.00"
  let match = str.match(/(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4}).*?(\d{1,2})[:.](\d{2})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    return new Date(Date.UTC(year, month - 1, day, hours - 3, minutes, 0));
  }

  // 2. ISO format: "2026-08-10 20:00" or "2026-08-10T20:00"
  match = str.match(/(\d{4})[\.\/\-](\d{1,2})[\.\/\-](\d{1,2}).*?(\d{1,2})[:.](\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    return new Date(Date.UTC(year, month - 1, day, hours - 3, minutes, 0));
  }

  // 3. Time only: "20:00", "20.00", "Saat 20:00", "20:00'da"
  match = str.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    // Use current Turkey date (UTC + 3)
    const nowTrMs = now.getTime() + (3 * 3600 * 1000);
    const trNowDate = new Date(nowTrMs);
    const year = trNowDate.getUTCFullYear();
    const month = trNowDate.getUTCMonth();
    const day = trNowDate.getUTCDate();

    return new Date(Date.UTC(year, month, day, hours - 3, minutes, 0));
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
}

async function resolveDiscordUser(client, identifier) {
  if (!client || !identifier) return null;
  const str = String(identifier).trim().replace(/^@/, "");
  if (!str) return null;

  // 1. If 17-20 digit Snowflake ID, fetch directly
  if (/^\d{17,20}$/.test(str)) {
    const user = await client.users.fetch(str).catch(() => null);
    if (user) return user;
  }

  // 2. Fallback: Search across all guilds for username/tag/displayName match
  try {
    const lower = str.toLowerCase();
    for (const guild of client.guilds.cache.values()) {
      const members = await guild.members.fetch({ query: lower, limit: 10 }).catch(() => null);
      if (members && members.size > 0) {
        const found = members.find(m => 
          m.user.username.toLowerCase() === lower ||
          m.user.tag.toLowerCase() === lower ||
          (m.displayName && m.displayName.toLowerCase() === lower)
        );
        if (found) return found.user;
      }
    }
  } catch (_) {}

  return null;
}

async function checkAndSendReminders() {
  const client = getDiscordClient();
  if (!client || !client.isReady()) return;

  try {
    const submissions = await FormSubmission.findAll();
    const now = new Date();

    for (const sub of submissions) {
      if (!sub.interviewScheduledTime || sub.status === "REJECTED" || sub.interviewState === "COMPLETED" || sub.interviewState === "FINISHED") {
        continue;
      }

      const scheduledDate = parseTurkeyTimeToDate(sub.interviewScheduledTime);
      if (!scheduledDate) continue;

      const diffMs = scheduledDate.getTime() - now.getTime();
      const diffMin = Math.round(diffMs / 60000);

      sub.remindersSent = sub.remindersSent || [];
      const { extractTargetDiscordId } = require("./formInterviewService");
      const targetId = extractTargetDiscordId(sub);
      if (!targetId) continue;

      const user = await resolveDiscordUser(client, targetId);
      if (!user) {
        console.warn(`[formInterviewScheduler] Discord user could not be resolved for identifier: ${targetId}`);
        continue;
      }

      // ── 15 Minutes Reminder ──────────────────────────────────────────────
      if (diffMin <= 15 && diffMin >= 0 && !sub.remindersSent.includes("15m")) {
        await sendReminderDM(user, 15, RP_ADVICE["15m"]);
        sub.remindersSent.push("15m");
        await FormSubmission.update(sub._id, { remindersSent: sub.remindersSent });
      }

      // ── 10 Minutes Reminder ──────────────────────────────────────────────
      if (diffMin <= 10 && diffMin >= -5 && !sub.remindersSent.includes("10m")) {
        await sendReminderDM(user, 10, RP_ADVICE["10m"]);
        sub.remindersSent.push("10m");
        await FormSubmission.update(sub._id, { remindersSent: sub.remindersSent });
      }

      // ── 5 Minutes Reminder ───────────────────────────────────────────────
      if (diffMin <= 5 && diffMin >= -10 && !sub.remindersSent.includes("5m")) {
        await sendReminderDM(user, 5, RP_ADVICE["5m"]);
        sub.remindersSent.push("5m");
        await FormSubmission.update(sub._id, { remindersSent: sub.remindersSent });
      }

      // ── 2 Minutes Reminder ───────────────────────────────────────────────
      if (diffMin <= 2 && diffMin >= -12 && !sub.remindersSent.includes("2m")) {
        await sendReminderDM(user, 2, RP_ADVICE["2m"]);
        sub.remindersSent.push("2m");
        await FormSubmission.update(sub._id, { remindersSent: sub.remindersSent });
      }

      // ── 1 Minute Reminder ────────────────────────────────────────────────
      if (diffMin <= 1 && diffMin >= -15 && !sub.remindersSent.includes("1m")) {
        await sendReminderDM(user, 1, RP_ADVICE["1m"]);
        sub.remindersSent.push("1m");
        await FormSubmission.update(sub._id, { remindersSent: sub.remindersSent });
      }

      // ── Exact Time (0 min or link dispatch) ──────────────────────────────
      if (diffMin <= 0 && diffMin >= -30 && !sub.remindersSent.includes("exact")) {
        await sendGameLinkAndJoinStatusDM(user, sub);
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

async function sendReminderDM(user, minutesLeft, adviceText) {
  try {
    let color = 0x818cf8;
    let title = `⏳ MÜLAKATINIZ ${minutesLeft} DAKİKA SONRA BAŞLIYOR!`;

    if (minutesLeft === 15) {
      color = 0x818cf8;
      title = "⏱️ MÜLAKAT ODA HAZIRLIKLARI BAŞLADI (15 Dakika Kala)";
    } else if (minutesLeft === 10) {
      color = 0x38bdf8;
      title = "🎙️ MİKROFON VE DONANIM TESTİ (Son 10 Dakika)";
    } else if (minutesLeft === 5) {
      color = 0xf59e0b;
      title = "⚡ HEYECAN DORUKTA — SON 5 DAKİKA!";
    } else if (minutesLeft === 2) {
      color = 0xf97316;
      title = "🔥 SON 2 DAKİKA! LÜTFEN BEKLEME ODASINA GEÇİNİZ!";
    } else if (minutesLeft === 1) {
      color = 0xef4444;
      title = "🚨 SON 60 SANİYE! KAPI AÇILIYOR, HAZIR OLUN!";
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(
        `Sayın Aday,\n` +
        `Mülakat saatinize **${minutesLeft === 1 ? '1 dakika (60 saniye)' : minutesLeft + ' dakika'}** kalmıştır.\n\n` +
        `📌 **BİLMENİZ GEREKENLER & MÜLAKAT TAVSİYELERİ:**\n` +
        `${adviceText}\n\n` +
        `*Lütfen ses kanalında veya oyun sunucusunda hazır bulunun.*`
      )
      .setFooter({ text: "EkoYıldız Mülakat & Yetenek Operasyonları" });

    await user.send({ embeds: [embed] }).then(() => {
      console.log(`[formInterviewScheduler] ✅ ${minutesLeft}m reminder DM sent to ${user.tag} (${user.id})`);
    }).catch(dmErr => {
      console.warn(`[formInterviewScheduler] ❌ Could not send DM to ${user.tag} (${user.id}):`, dmErr.message);
    });
  } catch (err) {
    console.error(`[formInterviewScheduler] Reminder send error to ${user?.id}:`, err.message);
  }
}


async function sendGameLinkAndJoinStatusDM(user, submission) {
  try {
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

    await user.send({ embeds: [embed], components }).then(() => {
      console.log(`[formInterviewScheduler] ✅ Game link DM sent to ${user.tag} (${user.id})`);
    }).catch(dmErr => {
      console.warn(`[formInterviewScheduler] ❌ Could not send Game Link DM to ${user.tag} (${user.id}):`, dmErr.message);
    });
  } catch (err) {
    console.error(`[formInterviewScheduler] Game link send error to ${user?.id}:`, err.message);
  }
}

function startScheduler() {
  if (schedulerInterval) return;
  console.log("[formInterviewScheduler] Starting interview reminder interval...");
  checkAndSendReminders().catch(err => console.error("[formInterviewScheduler] Initial check error:", err.message));
  schedulerInterval = setInterval(checkAndSendReminders, 15000);
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
  parseTurkeyTimeToDate,
  resolveDiscordUser,
};
