const express = require("express");
const router = express.Router();

router.get("/api/social-stats", (req, res) => {
  try {
    const { getSocialStats } = require("../../bot/services/socialStatsService");
    const stats = getSocialStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.json({
      success: true,
      stats: {
        youtube1: 7420,
        youtube2: 1910,
        tiktok: 150,
        kick: 0,
        twitch: 0,
        instagram1: 0,
        instagram2: 0,
        total: 9480
      }
    });
  }
});

router.post("/api/settings/update-pin", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Oturum açmalısınız." });
  const { pin } = req.body;
  if (!pin || (pin.length !== 4 && pin.length !== 6) || !/^\d+$/.test(pin)) {
    return res.status(400).json({ error: "Şifreniz 4 veya 6 haneli sadece rakamlardan oluşmalıdır." });
  }
  try {
    req.user.sitePinPassword = pin;
    req.user.pinLength = pin.length;
    await req.user.save();
    const { saveStoreNow } = require("../../models/Store");
    saveStoreNow();
    try {
      const { logTrustUserActivity } = require("../../bot/services/security/trustScoreService");
      const { getDiscordClient } = require("../../bot/discordClient");
      logTrustUserActivity(getDiscordClient(), req.user.discordId, "Site PIN Şifresi Güncellendi", "Kullanıcı web hesabı için PIN güvenlik şifresini başarıyla güncelledi.", "🔑", 0x3b82f6);
    } catch (_) {}
    res.json({ success: true, message: "Site PIN şifreniz başarıyla kaydedildi." });
  } catch (err) {
    res.status(500).json({ error: "Şifre güncellenirken hata oluştu." });
  }
});

router.post("/api/settings/update-2fa", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Oturum açmalısınız." });
  const { enabled, method } = req.body;
  try {
    req.user.twoFactorEnabled = Boolean(enabled);
    if (method && ['discord_dm', 'roblox_oauth'].includes(method)) {
      req.user.twoFactorMethod = method;
    }
    await req.user.save();
    const { saveStoreNow } = require("../../models/Store");
    saveStoreNow();
    try {
      const { logTrustUserActivity } = require("../../bot/services/security/trustScoreService");
      const { getDiscordClient } = require("../../bot/discordClient");
      const isAct = Boolean(enabled);
      logTrustUserActivity(getDiscordClient(), req.user.discordId, "2FA Güvenlik Ayarları Güncellendi", `İki faktörlü doğrulama durumu: **${isAct ? 'AKTİF' : 'PASİF'}** (Yöntem: ${method || 'Varsayılan'})`, "🛡️", isAct ? 0x2ecc71 : 0xe74c3c);
    } catch (_) {}
    res.json({ success: true, message: "2FA güvenlik ayarlarınız güncellendi." });
  } catch (err) {
    res.status(500).json({ error: "Ayarlar güncellenirken hata oluştu." });
  }
});
const crypto = require("crypto");
const axios = require("axios");
const Ticket = require("../../models/Ticket");
const User = require("../../models/User");
const Economy = require("../../models/Economy");
const { wikiArticles, saveStoreNow } = require("../../models/Store");
const { isSiteAdmin, isSiteStaff } = require("../../utils/adminCheck");
const { SHOP_ITEMS, findItem } = require("../../bot/config/shopItems");
const { BASE_URL, WEBHOOK_SECRET, MAKE_WEBHOOK_URL } = require("../../config");
const logger = require("../../utils/logger");

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmailTemplate(aiResponse) {
  const safeBody = escapeHtml(aiResponse)
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br />');

  return `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Başlık</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #040816 0%, #0d1b2d 45%, #14253f 100%);
        font-family: Arial, Helvetica, sans-serif;
      }
      table {
        border-spacing: 0;
      }
      img {
        border: 0;
      }
      a {
        text-decoration: none;
      }
      .hero-glow {
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.02);
      }
      .glass-card {
        background: linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(45,108,223,0.28);
      }
      .btn-secondary:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(31,157,119,0.25);
      }
      .accent-line {
        height: 3px;
        width: 84px;
        background: linear-gradient(90deg, #2d6cdf 0%, #67e8f9 100%);
        border-radius: 999px;
        margin: 8px 0 18px 0;
      }
    </style>
  </head>
  <body>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#07111f; padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px; width:100%;">
            <tr>
              <td>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(135deg,#0f172a 0%,#11243f 100%); border:1px solid #2b4364; border-radius:28px; overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,0.45);">
                  <tr>
                    <td style="padding:0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b1220;">
                        <tr>
                          <td style="padding:24px 28px 18px 28px; border-bottom:1px solid #24384f;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td valign="middle" width="64">
                                  <div class="hero-glow" style="width:62px; height:62px; border-radius:50%; overflow:hidden; display:inline-block; background:linear-gradient(135deg,#11253f,#2d6cdf); padding:2px;">
                                    <img src="https://yt3.googleusercontent.com/-FXtUrat6SH-K90Xc0CUtKmVaCwffoAuU0rUaQAE-GH9VZnPb9yQJHvw2lVnSgSe-G3K4SEylfs=s160-c-k-c0x00ffffff-no-rj" alt="EkoYıldız logo" width="58" height="58" style="display:block; border-radius:50%;" />
                                  </div>
                                </td>
                                <td valign="middle" style="padding-left:14px;">
                                  <div style="font-size:24px; line-height:28px; font-weight:bold; color:#f8fafc; letter-spacing:0.5px;">EkoYıldız</div>
                                  <div style="font-size:12px; line-height:16px; color:#8fa4bf; text-transform:uppercase; letter-spacing:2.2px; margin-top:4px;">YouTube Kanalı · Resmi İletişim</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0;">
                            <div class="glass-card" style="padding:8px; background:linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03));">
                              <div style="background-image:linear-gradient(rgba(255,255,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.08) 1px,transparent 1px); background-size:24px 24px; border-radius:20px; overflow:hidden;">
                                <img src="https://yt3.googleusercontent.com/EuUJlYqW2qF32abl3kXM9wWFc1HHzJro-tTva7R93LmDCZvKLngJxCpo0PFuREoAS9TGZpP70eM=w1707-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj" alt="EkoYıldız banner" width="100%" style="display:block; max-width:100%; height:auto;" />
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 28px 30px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td>
                                  <div style="font-size:30px; line-height:36px; font-weight:bold; color:#f8fafc; margin-bottom:10px;">Premium, modern ve dikkat çekici</div>
                                  <div class="accent-line"></div>
                                  <div style="font-size:16px; line-height:27px; color:#dbe8f7; margin-bottom:16px;">
                                    EkoYıldız için hazırlanan bu tasarım, profesyonel bir kurumsal izlenim sunmanın yanında, yüksek kalite ve modern estetik duygusunu da bir araya getirir.
                                  </div>
                                  <div style="font-size:15px; line-height:25px; color:#b9cbe0; margin-bottom:24px;">
                                    aiservice<br />
                                    ${safeBody}
                                  </div>
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                      <td align="center" class="btn-primary" style="background:linear-gradient(135deg,#2d6cdf 0%,#4c8dff 100%); border-radius:999px; transition:all 0.2s ease;">
                                        <a href="https://www.youtube.com/@EkoYildiz" target="_blank" style="display:inline-block; padding:14px 24px; font-size:15px; font-weight:bold; color:#ffffff;">YouTube Kanalı</a>
                                      </td>
                                      <td width="12"></td>
                                      <td align="center" class="btn-secondary" style="background:linear-gradient(135deg,#1f9d77 0%,#2dcf9c 100%); border-radius:999px; transition:all 0.2s ease;">
                                        <a href="https://discord.com/channels/1367646464804655104/1518692475189854218" target="_blank" style="display:inline-block; padding:14px 24px; font-size:15px; font-weight:bold; color:#ffffff;">Discord Destek</a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 28px 28px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #24384f; padding-top:18px;">
                              <tr>
                                <td style="font-size:12px; line-height:20px; color:#7f93b2;">
                                  EkoYıldız · Resmi iletişim ve destek alanı<br />
                                  Daha fazla bilgi için yukarıdaki bağlantıları kullanabilirsiniz.
                                </td>
                                <td align="right" style="font-size:12px; line-height:20px; color:#5e7b9b;">
                                  © 2026 EkoYıldız
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function requireLogin(req, res) {
  if (!req.user) {
    res.status(401).json({ error: "Giriş yapmanız gerekli." });
    return false;
  }
  return true;
}

function requireAdmin(req, res) {
  if (!requireLogin(req, res)) return false;
  if (!isSiteAdmin(req.user)) {
    res.status(403).json({ error: "Bu işlem için admin yetkisi gerekli." });
    return false;
  }
  return true;
}

// --- ACTIVITY TRACKER ENDPOINTS ---
const { updateActivity, getActiveUsers } = require("../services/activityTracker");

router.post("/api/activity/ping", (req, res) => {
  if (req.user) {
    updateActivity(req.user, req.body);
  }
  res.json({ success: true });
});

router.get("/api/activity/users", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.json({ success: true, users: getActiveUsers() });
});

router.get("/api/logs", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json({ success: true, logs: logger.getLogs() });
});
// ----------------------------------

router.get("/api/tickets", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Yetkilendirme gerekli" });

  try {
    const discordId = req.user.discordId;
    const ticketsArray = await Ticket.find({ userId: discordId });
    const tickets = ticketsArray.sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) {
    console.error("Ticket fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Web'den yeni ticket oluştur ──────────────────────────────────────────────
router.post("/api/tickets", async (req, res) => {
  if (!requireLogin(req, res)) return;

  const { category, subject, description, priority } = req.body;
  const s = (subject || "").trim();
  const d = (description || "").trim();
  const c = (category || "").trim();

  if (!c)  return res.status(400).json({ error: "Kategori seçiniz." });
  if (!s)  return res.status(400).json({ error: "Konu başlığı boş olamaz." });
  if (!d)  return res.status(400).json({ error: "Açıklama boş olamaz." });
  if (s.length > 100)  return res.status(400).json({ error: "Konu en fazla 100 karakter olabilir." });
  if (d.length > 2000) return res.status(400).json({ error: "Açıklama en fazla 2000 karakter olabilir." });

  const validPriorities = ["low", "normal", "medium", "high"];
  // Kategori bazlı otomatik öncelik — gönderilmemişse kategoriye göre belirle
  const autoPriority = { ban: 'high', report: 'high', billing: 'high', reklam: 'medium', technical: 'medium', account: 'medium', genel: 'low', other: 'low' };
  const prio = validPriorities.includes(priority) ? priority : (autoPriority[c] || 'medium');

  try {
    const { generateTicketId } = require("../../utils/ticketId");
    const {
      TARGET_GUILD_ID, TARGET_CHANNEL_ID,
      GUILD2_ID, GUILD2_TICKET_CATEGORY_ID,
    } = require("../../config");
    const { ChannelType, PermissionFlagsBits } = require("discord.js");
    const { buildTicketEmbed, buildCloseButton } = require("../../bot/embeds");
    const { getDiscordClient } = require("../../bot/discordClient");

    const ticketId = generateTicketId();

    // ── Discord kanalı aç ──────────────────────────────────────────────────
    let channelId = null;
    let guildId = null;
    let discordChannelMention = null;

    const client = getDiscordClient();
    if (client?.isReady()) {
      // Web ticketlar sadece GUILD2 (EkoYıldız) sunucusunda açılır
      const targets = [
        { id: GUILD2_ID, categoryId: GUILD2_TICKET_CATEGORY_ID },
      ];

      for (const target of targets) {
        try {
          const guild = await client.guilds.fetch(target.id).catch(() => null);
          if (!guild) continue;

          const permissionOverwrites = [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            {
              id: req.user.discordId,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.EmbedLinks,
              ],
            },
          ];

          // Kategoriyi belirle
          let parentId = null;
          if (target.categoryId) {
            const ch = await guild.channels.fetch(target.categoryId).catch(() => null);
            if (ch?.type === ChannelType.GuildCategory) parentId = ch.id;
            else if (ch?.type === ChannelType.GuildText) parentId = ch.parentId;
          }
          if (!parentId) {
            // "destek talepleri" kategorisini bul veya oluştur
            let cat = guild.channels.cache.find(
              ch => ch.name.toLowerCase() === "destek talepleri" && ch.type === ChannelType.GuildCategory
            );
            if (!cat) {
              cat = await guild.channels.create({ name: "DESTEK TALEPLERİ", type: ChannelType.GuildCategory });
            }
            parentId = cat.id;
          }

          const ticketChannel = await guild.channels.create({
            name: `ticket-${ticketId.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: parentId,
            permissionOverwrites,
          });

          // İlk mesaj: embed + kapat butonu + kullanıcı etiketi
          const fakeTicket = {
            ticketId, userId: req.user.discordId, userName: req.user.discordUsername,
            category: c, subject: s, description: d, priority: prio,
            createdAt: new Date(),
          };
          const embed = buildTicketEmbed(fakeTicket);
          const closeBtn = buildCloseButton(ticketId);
          await ticketChannel.send({
            content: `<@${req.user.discordId}> ticket'ın oluşturuldu! 🌐 Web üzerinden açıldı.`,
            embeds: [embed],
            components: [closeBtn],
          });

          // İlk sunucunun kanalını kaydet
          if (!channelId) {
            channelId = ticketChannel.id;
            guildId = guild.id;
            discordChannelMention = `<#${ticketChannel.id}>`;
          }
        } catch (chErr) {
          console.warn(`[webTicket] ${target.id} kanalı açılamadı:`, chErr.message);
        }
      }
    }

    const ticket = new Ticket({
      ticketId,
      userId: req.user.discordId,
      userName: req.user.discordUsername,
      category: c,
      subject: s,
      description: d,
      priority: prio,
      channelId,
      guildId,
      source: "web",
    });

    await ticket.save();
    saveStoreNow();

    try {
      const { logTicketCreated } = require("../../bot/services/ticketLog");
      logTicketCreated(ticket, { source: "Web Panel", ticketChannelId: channelId, guildId });
    } catch (_) {}

    res.json({
      success: true,
      ticket: { ticketId: ticket.ticketId, _id: ticket._id },
      discordChannel: channelId ? `Discord kanalı oluşturuldu: ${discordChannelMention}` : null,
    });
  } catch (err) {
    console.error("Web ticket create error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Web'den ticket yeniden aç ────────────────────────────────────────────────
router.post("/api/tickets/:ticketId/reopen", async (req, res) => {
  if (!requireLogin(req, res)) return;

  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ error: "Ticket bulunamadı." });

    if (ticket.userId !== req.user.discordId && !req.user.isStaff && !isSiteAdmin(req.user)) {
      return res.status(403).json({ error: "Bu ticket size ait değil." });
    }

    if (ticket.status === "open") {
      return res.status(400).json({ error: "Ticket zaten açık." });
    }

    const {
      TARGET_GUILD_ID, TARGET_CHANNEL_ID,
      GUILD2_ID, GUILD2_TICKET_CATEGORY_ID,
    } = require("../../config");
    const { ChannelType, PermissionFlagsBits } = require("discord.js");
    const { buildCloseButton } = require("../../bot/embeds");
    const { getDiscordClient } = require("../../bot/discordClient");
    const { cancelTicketDeletion } = require("../../bot/services/ticketCleanup");

    // Silme kuyruğunu iptal et
    cancelTicketDeletion(ticket.ticketId);

    ticket.status = "open";
    ticket.closedAt = null;
    ticket.closeReason = null;

    const client = getDiscordClient();
    let channelRestored = false;

    if (client?.isReady()) {
      const guildId = ticket.guildId || TARGET_GUILD_ID;

      // Mevcut kanal hâlâ var mı?
      if (ticket.channelId && !ticket.channelDeleted) {
        try {
          const guild = await client.guilds.fetch(guildId);
          const channel = await guild.channels.fetch(ticket.channelId).catch(() => null);
          if (channel) {
            await channel.permissionOverwrites.edit(ticket.userId, {
              ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
            });
            const closeBtn = buildCloseButton(ticket.ticketId);
            await channel.send({
              content: `<@${ticket.userId}> ticket'ın yeniden açıldı! 🌐 Web üzerinden açıldı.`,
              components: [closeBtn],
            });
            channelRestored = true;
          }
        } catch (_) {}
      }

      // Kanal silinmişse sadece GUILD2'de yeniden oluştur
      if (!channelRestored) {
        const targets = [
          { id: GUILD2_ID, categoryId: GUILD2_TICKET_CATEGORY_ID },
        ];

        for (const target of targets) {
          try {
            const guild = await client.guilds.fetch(target.id).catch(() => null);
            if (!guild) continue;

            const permissionOverwrites = [
              { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
              {
                id: ticket.userId,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.EmbedLinks,
                ],
              },
            ];

            let parentId = null;
            if (target.categoryId) {
              const ch = await guild.channels.fetch(target.categoryId).catch(() => null);
              if (ch?.type === ChannelType.GuildCategory) parentId = ch.id;
              else if (ch?.type === ChannelType.GuildText) parentId = ch.parentId;
            }
            if (!parentId) {
              let cat = guild.channels.cache.find(
                ch => ch.name.toLowerCase() === "destek talepleri" && ch.type === ChannelType.GuildCategory
              );
              if (!cat) {
                cat = await guild.channels.create({ name: "DESTEK TALEPLERİ", type: ChannelType.GuildCategory });
              }
              parentId = cat.id;
            }

            const newChannel = await guild.channels.create({
              name: `ticket-${ticket.ticketId.toLowerCase()}`,
              type: ChannelType.GuildText,
              parent: parentId,
              permissionOverwrites,
            });

            const closeBtn = buildCloseButton(ticket.ticketId);
            await newChannel.send({
              content: `<@${ticket.userId}> ticket'ın yeniden açıldı! 🌐 Web üzerinden yeniden açıldı.`,
              components: [closeBtn],
            });

            if (!channelRestored) {
              ticket.channelId = newChannel.id;
              ticket.guildId = guild.id;
              ticket.channelDeleted = false;
              ticket.channelDeletedAt = null;
              channelRestored = true;
            }
          } catch (chErr) {
            console.warn(`[reopenTicket] ${target.id} kanalı açılamadı:`, chErr.message);
          }
        }
      }
    }

    await ticket.save();
    saveStoreNow();

    try {
      const { addNotification } = require("../../utils/notification");
      await addNotification(ticket.userId, {
        title: "🔓 Ticket Yeniden Açıldı",
        message: `\`${ticket.ticketId}\` numaralı ticket'ınız yeniden açıldı.`,
        icon: "🔓"
      });
    } catch (_) {}

    res.json({
      success: true,
      message: channelRestored
        ? "Ticket yeniden açıldı ve Discord kanalı güncellendi."
        : "Ticket yeniden açıldı.",
    });
  } catch (err) {
    console.error("Reopen ticket error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/tickets/staff", async (req, res) => {
  if (!req.user?.isStaff && !req.user?.isAdmin) {
    return res.status(403).json({ error: "Yetkilendirme gerekli" });
  }

  try {
    const ticketsArray = await Ticket.find({ status: "open" });
    const tickets = ticketsArray.sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/tickets/:ticketId/close", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Yetkilendirme gerekli" });

  const { reason } = req.body;

  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ error: "Ticket bulunamadı" });

    if (ticket.userId !== req.user.discordId && !req.user.isStaff) {
      return res.status(403).json({ error: "Yetkilendirme gerekli" });
    }

    ticket.status = "closed";
    ticket.closedAt = new Date();
    ticket.closeReason = reason;
    await ticket.save();

    try {
      const { addNotification } = require("../../utils/notification");
      await addNotification(ticket.userId, {
        title: "🔒 Ticket Kapatıldı",
        message: `\`${ticket.ticketId}\` numaralı ticket'ınız kapatıldı. Sebep: ${reason || 'Belirtilmedi'}`,
        icon: "🔒"
      });
    } catch (_) {}

    const { logTicketClosed } = require("../../bot/services/ticketLog");
    logTicketClosed(ticket, {
      closedBy: req.user.discordId,
      closedByName: req.user.discordUsername,
      reason,
      source: "Web Panel",
    });

    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { sendTicketCloseRatingDM } = require("../../bot/services/ticketRatingService");
      const { logTrustUserActivity } = require("../../bot/services/security/trustScoreService");
      const botClient = getDiscordClient ? getDiscordClient() : null;
      if (botClient) {
        sendTicketCloseRatingDM(ticket, req.user.discordUsername, reason, botClient).catch(() => {});
        logTrustUserActivity(botClient, ticket.userId, "Bilet Kapatıldı (Web)", `\`${ticket.ticketId}\` numaralı bilet kapatıldı.\n**Kapatan:** ${req.user.discordUsername}\n**Sebep:** ${reason || 'Belirtilmedi'}`, "🔒", 0xef4444);
      }
    } catch (_) {}

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/tickets/:ticketId/rate", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });

  const { score, note } = req.body;
  const ratingScore = parseInt(score, 10);

  if (isNaN(ratingScore) || ratingScore < 1 || ratingScore > 5) {
    return res.status(400).json({ error: "Lütfen 1 ile 5 arasında geçerli bir puan verin." });
  }

  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ error: "Ticket bulunamadı." });

    if (ticket.userId !== req.user.discordId) {
      return res.status(403).json({ error: "Bu ticket size ait değil." });
    }

    if (ticket.rated) {
      return res.status(400).json({ error: "Bu ticket'ı zaten değerlendirdiniz." });
    }

    ticket.rated = true;
    ticket.ratingScore = ratingScore;
    ticket.ratingNote = note ? String(note).trim() : null;
    await ticket.save();

    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { logTrustUserActivity } = require("../../bot/services/security/trustScoreService");
      logTrustUserActivity(getDiscordClient(), ticket.userId, "Bilet Değerlendirildi (Web)", `\`${ticket.ticketId}\` numaralı destek bileti için **${ratingScore}/5 Yıldız** değerlendirmesi yapıldı.\n**Yorum:** ${note || 'Not yok'}`, "⭐", 0xf59e0b);
    } catch (_) {}

    // Ödül: Moderatöre yıldız başına 100 Coin ekle
    const staffId = ticket.claimedBy || ticket.closedBy;
    if (staffId) {
      try {
        const Economy = require("../../models/Economy");
        const { saveStoreNow } = require("../../models/Store");
        const earned = ratingScore * 100;

        let eco = await Economy.findOne({ userId: staffId });
        if (!eco) {
          eco = new Economy({ userId: staffId });
        }
        eco.balance = (eco.balance || 0) + earned;
        eco.totalEarned = (eco.totalEarned || 0) + earned;
        await eco.save();
        saveStoreNow();

        const { addNotification } = require("../../utils/notification");
        await addNotification(staffId, {
          title: "⭐ Yeni Puan ve Ödül",
          message: `\`${ticket.ticketId}\` numaralı ticket için ${ratingScore} yıldız aldınız (+${earned} coin).`,
          icon: "⭐"
        });
      } catch (ecoErr) {
        console.warn("[web-rating] Ödül verilemedi:", ecoErr.message);
      }
    }

    res.json({ success: true, message: "Değerlendirmeniz başarıyla kaydedildi! Teşekkür ederiz." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/tickets/:ticketId/message", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Yetkilendirme gerekli" });

  const { content } = req.body;

  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ error: "Ticket bulunamadı" });

    ticket.messages.push({
      authorId: req.user.discordId,
      authorName: req.user.discordUsername,
      content,
    });

    await ticket.save();

    const { logTicketMessage } = require("../../bot/services/ticketLog");
    logTicketMessage(ticket, {
      authorId: req.user.discordId,
      authorName: req.user.discordUsername,
      content,
      source: "Web Panel",
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/tickets/:ticketId", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Yetkilendirme gerekli" });

  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ error: "Ticket bulunamadı" });

    if (ticket.userId !== req.user.discordId && !req.user.isStaff && !isSiteAdmin(req.user)) {
      return res.status(403).json({ error: "Yetkilendirme gerekli" });
    }

    if (ticket.channelId) {
      const { getDiscordClient } = require("../../bot/discordClient");
      const client = getDiscordClient();
      if (client?.isReady()) {
        try {
          const { TARGET_GUILD_ID } = require("../../config");
          const guildId = ticket.guildId || TARGET_GUILD_ID;
          const guild = await client.guilds.fetch(guildId);
          const channel = await guild.channels.fetch(ticket.channelId).catch(() => null);
          if (channel) {
            await channel.delete("Ticket web panelden tamamen silindi.");
          }
        } catch (err) {
          console.warn("Discord channel delete failed or channel did not exist:", err.message);
        }
      }
    }

    await Ticket.deleteOne({ ticketId: req.params.ticketId });
    saveStoreNow();

    res.json({ success: true, message: "Ticket başarıyla tamamen silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/notifications/read-all", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  try {
    const user = await User.findById(req.user._id);
    if (user && user.notifications) {
      user.notifications.forEach(n => {
        n.read = true;
      });
      await user.save();
      saveStoreNow();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/notifications/unread", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    const unread = (user.notifications || []).filter(n => !n.read);
    res.json({ success: true, notifications: unread });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/notifications/browser-status", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  const { enabled } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    user.browserNotificationsEnabled = !!enabled;
    await user.save();
    const { saveStoreNow } = require("../../models/Store");
    saveStoreNow();
    res.json({ success: true, browserNotificationsEnabled: user.browserNotificationsEnabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/health", (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: "online",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    system: {
      memory: {
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + "MB",
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
        rss: Math.round(memory.rss / 1024 / 1024) + "MB",
      },
      nodeVersion: process.version,
      platform: process.platform,
    }
  });
});

router.post("/api/make/ai-process", async (req, res) => {
  const secret = req.headers["x-webhook-secret"] || req.headers["x-make-secret"];
  if (!WEBHOOK_SECRET || !secret || secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { sender_email, subject, message_id, content } = req.body || {};
  if (!sender_email || !message_id || !content) {
    return res.status(400).json({ error: "sender_email, message_id ve content alanları gerekli." });
  }

  try {
    const { chatWithAI } = require("../../bot/services/aiService");
    const prompt = `Aşağıdaki e-postaya Türkçe, nazik ve net bir yanıt hazırla.\n\nGönderen: ${sender_email}\nKonu: ${subject || "(Boş konu)"}\n\nMesaj:\n${content}`;
    const aiResponse = await chatWithAI([{ role: "user", content: prompt }], "Sen bir yardımcı e-posta yanıtlayıcısısın. Türkçe yaz.", "ticket", { max_tokens: 400, temperature: 0.7 });
    const emailHtml = renderEmailTemplate(aiResponse);

    if (!MAKE_WEBHOOK_URL) {
      return res.status(500).json({ error: "Make webhook URL yapılandırılmamış." });
    }

    await axios.post(MAKE_WEBHOOK_URL, {
      recipient_email: sender_email,
      subject: `Re: ${subject || "Yanıt"}`,
      ai_response: aiResponse,
      in_reply_to_id: message_id,
      html: emailHtml
    }, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 25000
    });

    return res.json({
      success: true,
      message: "AI yanıtı oluşturuldu ve Make webhook’una gönderildi.",
      ai_response: aiResponse,
      html: emailHtml
    });
  } catch (err) {
    console.error("/api/make/ai-process error:", err);
    return res.status(500).json({ error: err.message || "AI işleme başarısız oldu." });
  }
});

// ── Wiki: Makale listesi ─────────────────────────────────────────────────────
router.get("/api/wiki/articles", (req, res) => {
  const list = wikiArticles
    .find({})
    .sort({ createdAt: -1 })
    .map((a) => ({
      _id: a._id,
      title: a.title,
      body: a.body?.slice(0, 200),
      imageUrl: a.imageUrl,
      authorName: a.authorName,
      authorAvatar: a.authorAvatar,
      editedByName: a.editedByName || null,
      editedAt: a.editedAt || null,
      commentCount: (a.comments || []).length,
      views: a.views || 0,
      reactions: a.reactions || {},
      createdAt: a.createdAt,
    }));
  res.json({ success: true, articles: list });
});

// ── Wiki: Makale oluştur ─────────────────────────────────────────────────────
router.post("/api/wiki/articles", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { title, body, imageUrl } = req.body;
  const t = (title || "").trim();
  const b = (body || "").trim();
  if (!t || t.length < 2) return res.status(400).json({ error: "Başlık en az 2 karakter olmalı." });
  if (!b) return res.status(400).json({ error: "Metin boş olamaz." });

  let img = (imageUrl || "").trim();
  if (img && !/^https?:\/\//i.test(img)) return res.status(400).json({ error: "Geçerli bir resim URL'si girin (https://...)." });
  if (!img) img = null;

  try {
    const article = wikiArticles.create({
      title: t.slice(0, 120),
      body: b.slice(0, 20000),
      imageUrl: img,
      authorId: req.user.discordId,
      authorName: req.user.discordUsername,
      authorAvatar: req.user.discordAvatar,
      comments: [],
      reactions: {},
      views: 0,
      editedByName: null,
      editedById: null,
      editedAt: null,
    });
    saveStoreNow();
    res.json({ success: true, article });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Wiki: Makale düzenle ─────────────────────────────────────────────────────
router.patch("/api/wiki/articles/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const article = wikiArticles.findById(req.params.id);
  if (!article) return res.status(404).json({ error: "Makale bulunamadı." });

  const { title, body, imageUrl } = req.body;
  if (title !== undefined) article.title = String(title).trim().slice(0, 120);
  if (body  !== undefined) article.body  = String(body).trim().slice(0, 20000);
  if (imageUrl !== undefined) {
    const img = String(imageUrl).trim();
    article.imageUrl = img && /^https?:\/\//i.test(img) ? img : null;
  }
  article.editedById   = req.user.discordId;
  article.editedByName = req.user.discordUsername;
  article.editedAt     = new Date();

  await article.save();
  saveStoreNow();
  res.json({ success: true, article });
});

// ── Wiki: Makale sil ─────────────────────────────────────────────────────────
router.delete("/api/wiki/articles/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const article = wikiArticles.findById(req.params.id);
  if (!article) return res.status(404).json({ error: "Makale bulunamadı." });
  wikiArticles.data.delete(req.params.id);
  wikiArticles.persist();
  saveStoreNow();
  res.json({ success: true });
});

// ── Wiki: Görüntülenme sayısını artır ────────────────────────────────────────
router.post("/api/wiki/articles/:id/view", (req, res) => {
  const article = wikiArticles.findById(req.params.id);
  if (!article) return res.status(404).json({ error: "Makale bulunamadı." });
  article.views = (article.views || 0) + 1;
  article.save();
  res.json({ success: true, views: article.views });
});

// ── Wiki: Tepki ekle/kaldır ──────────────────────────────────────────────────
router.post("/api/wiki/articles/:id/react", async (req, res) => {
  if (!requireLogin(req, res)) return;

  const { emoji } = req.body;
  const ALLOWED = ["👍", "❤️", "🔥", "😂", "😮", "👏"];
  if (!ALLOWED.includes(emoji)) return res.status(400).json({ error: "Geçersiz tepki." });

  const article = wikiArticles.findById(req.params.id);
  if (!article) return res.status(404).json({ error: "Makale bulunamadı." });

  article.reactions = article.reactions || {};
  article.reactions[emoji] = article.reactions[emoji] || { count: 0, users: [] };

  const users = article.reactions[emoji].users;
  const idx = users.indexOf(req.user.discordId);
  if (idx === -1) {
    // Ekle
    users.push(req.user.discordId);
    article.reactions[emoji].count = users.length;
  } else {
    // Kaldır (toggle)
    users.splice(idx, 1);
    article.reactions[emoji].count = users.length;
    if (users.length === 0) delete article.reactions[emoji];
  }

  await article.save();
  saveStoreNow();
  res.json({ success: true, reactions: article.reactions });
});

// ── Wiki: Yorum ekle ─────────────────────────────────────────────────────────
router.post("/api/wiki/articles/:id/comments", async (req, res) => {
  if (!requireLogin(req, res)) return;

  const { content } = req.body;
  const text = (content || "").trim();
  if (!text) return res.status(400).json({ error: "Yorum boş olamaz." });
  if (text.length > 2000) return res.status(400).json({ error: "Yorum en fazla 2000 karakter olabilir." });

  const article = wikiArticles.findById(req.params.id);
  if (!article) return res.status(404).json({ error: "Makale bulunamadı." });

  try {
    const comment = {
      _id: crypto.randomBytes(8).toString("hex"),
      userId: req.user.discordId,
      username: req.user.discordUsername,
      avatar: req.user.discordAvatar,
      content: text,
      createdAt: new Date(),
    };
    article.comments = article.comments || [];
    article.comments.push(comment);
    await article.save();
    saveStoreNow();
    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Wiki: Yorum sil ──────────────────────────────────────────────────────────
router.delete("/api/wiki/articles/:id/comments/:commentId", async (req, res) => {
  if (!requireLogin(req, res)) return;

  const article = wikiArticles.findById(req.params.id);
  if (!article) return res.status(404).json({ error: "Makale bulunamadı." });

  const idx = (article.comments || []).findIndex(c => c._id === req.params.commentId);
  if (idx === -1) return res.status(404).json({ error: "Yorum bulunamadı." });

  const comment = article.comments[idx];
  // Sadece yorum sahibi veya admin silebilir
  if (comment.userId !== req.user.discordId && !isSiteAdmin(req.user)) {
    return res.status(403).json({ error: "Bu yorumu silme yetkiniz yok." });
  }

  article.comments.splice(idx, 1);
  await article.save();
  saveStoreNow();
  res.json({ success: true });
});

router.get("/api/admin/users", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const q = (req.query.q || "").trim().toLowerCase();
  const { users } = require("../../models/Store");
  let list = users.find({});

  // Sort by newest registered / updated first
  list.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.updatedAt || a.joinedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.updatedAt || b.joinedAt || 0).getTime();
    return timeB - timeA;
  });

  if (q) {
    list = list.filter(
      (u) =>
        String(u.discordId || "").includes(q) ||
        (u.discordUsername || "").toLowerCase().includes(q) ||
        (u.robloxUsername || "").toLowerCase().includes(q) ||
        String(u.robloxId || "").includes(q)
    );
  }

  const StaffProgress = require("../../models/StaffProgress");
  const staffRecords = await StaffProgress.find({}).catch(() => []);
  const staffMap = new Map();
  staffRecords.forEach(s => staffMap.set(String(s.userId), s));

  list = list.slice(0, 100).map((u) => {
    const sp = staffMap.get(String(u.discordId));
    let finalStatus = 'active';
    if (u.isLeft || u.modStatus === 'dismissed' || (sp && (sp.status === 'dismissed' || sp.status === 'resigned'))) {
      finalStatus = 'dismissed';
    } else if (u.modStatus === 'paused' || (sp && sp.status === 'paused')) {
      finalStatus = 'paused';
    } else if (sp && sp.status && sp.status !== 'none') {
      finalStatus = sp.status;
    } else if (u.modStatus) {
      finalStatus = u.modStatus;
    }

    const finalLevel = (sp && sp.level !== undefined) ? sp.level : (u.modLevel || u.modRank || 1);
    return {
      _id: u._id,
      discordId: u.discordId,
      discordUsername: u.discordUsername,
      discordAvatar: u.discordAvatar,
      robloxUsername: u.robloxUsername,
      robloxId: u.robloxId,
      isAdmin: Boolean(u.isAdmin),
      isStaff: Boolean(u.isStaff && finalStatus !== 'dismissed' && finalStatus !== 'paused' && finalStatus !== 'resigned'),
      isLeft: Boolean(u.isLeft || finalStatus === 'dismissed'),
      roles: u.roles || [],
      isAuthorized: Boolean(u.isAuthorized),
      isBanned: Boolean(u.isBanned),
      banReason: u.banReason || null,
      modLevel: Number(finalLevel),
      modStatus: String(finalStatus),
      createdAt: u.createdAt || u.joinedAt || null
    };
  });

  res.json({ success: true, users: list });
});

router.post("/api/admin/users/:discordId/roles", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const targetId = String(req.params.discordId);
  if (targetId === String(req.user.discordId) && req.body.isAdmin === false) {
    return res.status(400).json({ error: "Kendi admin yetkinizi kaldıramazsınız." });
  }

  const user = await User.findOne({ discordId: targetId });
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

  // Handle new roles array format
  if (Array.isArray(req.body.roles)) {
    user.roles = req.body.roles;
  } else {
    // Handle old isAdmin/isStaff format
    if (req.body.isAdmin !== undefined) user.isAdmin = Boolean(req.body.isAdmin);
    if (req.body.isStaff !== undefined) user.isStaff = Boolean(req.body.isStaff);
    if (user.isAdmin) user.isStaff = true;
  }

  if (req.body.modLevel !== undefined) {
    user.modLevel = Number(req.body.modLevel);
    user.modRank = Number(req.body.modLevel);
  }
  if (req.body.modStatus !== undefined) {
    user.modStatus = String(req.body.modStatus);
    if (user.modStatus === "dismissed" || user.modStatus === "resigned") {
      user.isLeft = true;
      user.isStaff = false;
    } else if (user.modStatus === "paused") {
      user.isLeft = false;
      user.isStaff = false;
    } else if (user.modStatus === "active") {
      user.isLeft = false;
      user.isStaff = true;
    }
  }

  // Double-check: if modStatus is dismissed/paused/resigned, enforce isStaff = false
  if (user.modStatus === "dismissed" || user.modStatus === "resigned" || user.modStatus === "paused") {
    user.isStaff = false;
  }

  await user.save();
  saveStoreNow();

  // 🛡️ Web Admin Panel — Staff Progress Mod Seviyesi & Statü Yönetimi
  if (req.body.modLevel !== undefined || req.body.modStatus !== undefined || req.body.isStaff !== undefined) {
    try {
      const StaffProgress = require("../../models/StaffProgress");
      const { getOrCreate, ROLES } = require("../../bot/services/staffSystem");
      const { getDiscordClient } = require("../../bot/discordClient");
      const staffAutomation = require("../../bot/services/staffAutomation");

      let p = await StaffProgress.findOne({ userId: targetId });
      if (!p) {
        const client = getDiscordClient();
        p = await getOrCreate(targetId, process.env.STAFF_GUILD_ID || "1367646464804655104", client);
      }

      if (p) {
        const oldLevel = p.level || 1;
        if (req.body.modLevel !== undefined) {
          p.level = Number(req.body.modLevel);
          p.adminOverride = true;
        }
        if (req.body.modStatus !== undefined) {
          p.status = String(req.body.modStatus);
          if (p.status === 'dismissed' || p.status === 'resigned') {
            p.dismissedAt = new Date();
            p.dismissReason = 'Web Admin Panel tarafından görevden ayrıldı yapıldı';
          }
        }
        p.promotedAt = new Date();
        await p.save();

        const client = getDiscordClient();
        if (client && client.guilds) {
          const guildId = process.env.STAFF_GUILD_ID || "1367646464804655104";
          const guild = await client.guilds.fetch(guildId).catch(() => null);
          if (guild) {
            const member = await guild.members.fetch(targetId).catch(() => null);
            if (member) {
              // Eğer kullanıcı ayrıldı, duraklatıldı veya staff yetkisi kaldırıldıysa tüm mod rollerini kaldır
              if (p.status === 'dismissed' || p.status === 'resigned' || p.status === 'paused' || !user.isStaff || user.isLeft) {
                const ALL_ROLES_TO_REMOVE = [
                  ...Object.values(ROLES),
                  '1518709348506013706', // Kıdemli Sekreter
                  '1518692389169135666', // Moderatör Ekibi
                  '1518708137920823327', // modizm
                  '1518707673846251691', // adminizm
                  '1518692386836971610', // Moderasyon
                  '1518692384928567456', // Kaptan
                  '1467082387933499524', '1480592150273200330', '1479818628152168479', '1467082891556163727'
                ];
                for (const rId of ALL_ROLES_TO_REMOVE) {
                  if (rId && member.roles.cache.has(rId)) {
                    await member.roles.remove(rId, 'Kadro dışı / Ayrıldı yapıldı').catch(() => {});
                  }
                }
              } else {
                const newLevel = p.level;
                const oldRoleId = ROLES[oldLevel];
                const newRoleId = ROLES[newLevel];

                if (oldRoleId && oldRoleId !== newRoleId) {
                  await member.roles.remove(oldRoleId, 'Web Admin Panel Rütbe Güncellemesi').catch(() => {});
                }
                if (newRoleId) {
                  await member.roles.add(newRoleId, 'Web Admin Panel Rütbe Güncellemesi').catch(() => {});
                }
              }
            }
          }
          await staffAutomation.syncStaffDiscordRoles(client, targetId).catch(() => {});
          await staffAutomation.updateDynamicModList(client).catch(() => {});
        }
      }
    } catch (modErr) {
      console.error("[api] Admin mod role update error:", modErr.message);
    }
  }

  res.json({
    success: true,
    user: {
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      isAdmin: user.isAdmin,
      isStaff: user.isStaff,
      roles: user.roles || [],
    },
  });
});

router.post("/api/admin/restore-staff", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const query = String(req.body.query || '').trim();
  if (!query) return res.status(400).json({ error: 'Kullanıcı adı veya Discord ID girin.' });

  const StaffProgress = require("../../models/StaffProgress");
  const { getDiscordClient } = require("../../bot/discordClient");
  const { ROLES } = require("../../bot/services/staffSystem");

  let user = null;
  if (/^[0-9]{17,20}$/.test(query)) {
    user = await User.findOne({ discordId: query });
  }

  if (!user) {
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactMatches = await User.find({
      $or: [
        { discordId: query },
        { discordUsername: new RegExp('^' + safeQuery + '$', 'i') },
        { robloxUsername: new RegExp('^' + safeQuery + '$', 'i') },
      ]
    });

    if (exactMatches.length === 1) {
      user = exactMatches[0];
    } else if (exactMatches.length > 1) {
      return res.status(400).json({ error: 'Birden fazla eşleşme bulundu. Lütfen Discord ID kullanın.' });
    }
  }

  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  const userId = String(user.discordId);
  const autoPassModeratorSchool = req.body.autoPassModeratorSchool === true;
  let progress = await StaffProgress.findOne({ userId });
  if (progress && progress.status === 'active' && !autoPassModeratorSchool) {
    return res.status(400).json({ error: 'Bu kullanıcı zaten aktif staff durumunda.' });
  }

  if (!progress) {
    progress = new StaffProgress({
      userId,
      guildId: process.env.STAFF_GUILD_ID || '1367646464804655104',
      level: 1,
      status: 'active',
      joinedAt: new Date(),
      promotedAt: new Date(),
    });
  } else {
    progress.status = 'active';
    progress.dismissedAt = null;
    progress.dismissReason = null;
    progress.resignedAt = null;
    progress.resignReason = null;
    progress.retiredAt = null;
  }

  await progress.save();
  user.isStaff = true;
  await user.save();
  saveStoreNow();

  const client = getDiscordClient();
  if (client && client.isReady()) {
    const guild = await client.guilds.fetch(process.env.STAFF_GUILD_ID || '1367646464804655104').catch(() => null);
    if (guild) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) {
        const roleId = ROLES[1];
        if (roleId && !member.roles.cache.has(roleId)) {
          await member.roles.add(roleId, 'Staff restore işlemi').catch(() => {});
        }
      }
    }
  }

  let message = `✅ ${user.discordUsername || user.discordId} personel olarak geri alındı. Rol verildi.`;
  if (autoPassModeratorSchool) {
    try {
      const { graduateStudent } = require('../../bot/services/moderatorSchool');
      if (client && client.isReady()) {
        await graduateStudent(userId, 'Admin Panel (Geri Alma)', client, {
          score: 100,
          reason: 'Admin panelinden otomatik olarak moderatör okulu tamamlandı.'
        });
      } else {
        progress.schoolSystem = progress.schoolSystem || {};
        progress.schoolSystem.status = 'graduated';
        progress.schoolSystem.completedAt = new Date();
        progress.schoolSystem.phase = 3;
        progress.schoolSystem.step = 0;
        await progress.save();
      }
      message += ' Moderatör okulu otomatik olarak geçirildi.';
    } catch (schoolErr) {
      console.error('[restore-staff] Moderator school auto-pass failed:', schoolErr.message);
      message += ' Moderatör okulu otomatik geçilirken bir hata oluştu.';
    }
  }

  res.json({ success: true, message, autoPassModeratorSchool });
});

router.post("/api/admin/action", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { category, actionType, payload } = req.body;
  if (!category || !actionType) {
    return res.status(400).json({ error: "Eksik parametreler (category ve actionType gerekli)." });
  }

  const { getDiscordClient } = require("../../bot/discordClient");
  const client = getDiscordClient();
  if (!client || !client.isReady()) {
    return res.status(503).json({ error: "Discord botu henüz aktif değil veya hazır değil." });
  }

  const { TARGET_GUILD_ID } = require("../../config");
  const guild = client.guilds.cache.get(TARGET_GUILD_ID);
  if (!guild) {
    return res.status(500).json({ error: "Sunucu (TARGET_GUILD_ID) bulunamadı." });
  }

  let responseText = "";
  const mockInteraction = {
    client,
    guild,
    user: { id: req.user.discordId, username: req.user.discordUsername, tag: req.user.discordUsername },
    member: {
      user: { id: req.user.discordId, username: req.user.discordUsername, tag: req.user.discordUsername },
      permissions: { has: () => true },
      roles: { cache: { has: () => true } }
    },
    isReady: () => true,
    isChatInputCommand: () => true,
    deferReply: async () => {},
    editReply: async (payloadData) => {
      if (typeof payloadData === 'string') {
        responseText = payloadData;
      } else {
        if (payloadData.content) responseText = payloadData.content;
        if (payloadData.embeds) {
          const embedTexts = payloadData.embeds.map(emb => {
            let text = "";
            const data = emb.data || emb;
            if (data.title) text += `=== ${data.title} ===\n`;
            if (data.description) text += `${data.description}\n`;
            if (data.fields) {
              data.fields.forEach(f => {
                text += `**${f.name}**: ${f.value}\n`;
              });
            }
            return text;
          }).join('\n\n');
          responseText = (responseText ? responseText + "\n\n" : "") + embedTexts;
        }
      }
      return mockInteraction;
    },
    reply: async (payloadData) => {
      return mockInteraction.editReply(payloadData);
    },
    followUp: async (payloadData) => {
      return mockInteraction.editReply(payloadData);
    }
  };

  try {
    if (category === "moderation") {
      if (actionType === "mute") {
        const { kullanici, sure, sebep } = payload;
        const targetUserId = (kullanici || "").replace(/[<@!>]/g, "");
        const member = await guild.members.fetch(targetUserId).catch(() => null);
        if (!member) return res.status(404).json({ error: "Kullanıcı sunucuda bulunamadı." });

        const parseDuration = (timeStr) => {
          const unitMap = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
          const matches = [...timeStr.matchAll(/(\d+)([smhd])/g)];
          if (!matches.length) return 10 * 60 * 1000;
          return matches.reduce((total, match) => total + parseInt(match[1]) * (unitMap[match[2]] || 1000), 0);
        };
        const durationMs = parseDuration(sure || "10m");
        await member.timeout(durationMs, `Web Panel admin: ${req.user.discordUsername} - Sebep: ${sebep}`);
        return res.json({ success: true, message: `✅ ${member.user.tag} kullanıcısı ${sure} süreyle susturuldu.` });
      }

      if (actionType === "unmute") {
        const { kullanici } = payload;
        const targetUserId = (kullanici || "").replace(/[<@!>]/g, "");
        const member = await guild.members.fetch(targetUserId).catch(() => null);
        if (!member) return res.status(404).json({ error: "Kullanıcı sunucuda bulunamadı." });

        await member.timeout(null, `Web Panel admin: ${req.user.discordUsername}`);
        return res.json({ success: true, message: `✅ ${member.user.tag} kullanıcısının susturması kaldırıldı.` });
      }

      if (actionType === "modaction") {
        const { kullanici, sebep, kanit } = payload;
        const targetUserId = (kullanici || "").replace(/[<@!>]/g, "");
        const targetUser = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUser) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

        const fakeAttachment = kanit ? { url: kanit } : null;
        const { executeModAction } = require("../../bot/services/modActionService");
        await executeModAction(mockInteraction, targetUser, sebep, fakeAttachment);
        return res.json({ success: true, message: responseText || "Ceza işlemi uygulandı." });
      }

      if (actionType === "bulk_delete") {
        const { miktar } = payload;
        const count = parseInt(miktar, 10);
        if (isNaN(count) || count < 1 || count > 100) {
          return res.status(400).json({ error: "Silinecek mesaj sayısı 1-100 arasında olmalıdır." });
        }

        const { TARGET_CHANNEL_ID } = require("../../config");
        const channel = await client.channels.fetch(TARGET_CHANNEL_ID).catch(() => null);
        if (!channel || !channel.isTextBased()) {
          return res.status(404).json({ error: "Mesaj silme kanalı bulunamadı." });
        }

        const deleted = await channel.bulkDelete(count, true);
        return res.json({
          success: true,
          message: `✅ ${deleted.size} mesaj başarıyla silindi.` + 
            (deleted.size < count ? ` (${count - deleted.size} mesaj 14 günden eski olduğu için atlandı.)` : "")
        });
      }

      if (actionType === "blacklist") {
        const { option, name, reason } = payload;
        const Blacklist = require("../../models/Blacklist");
        const { renderBlacklist } = require("../../bot/services/blacklistService");
        const BLACKLIST_LOG_CHANNEL_ID = '1518920074264842380';
        const logChannel = await client.channels.fetch(BLACKLIST_LOG_CHANNEL_ID).catch(() => null);

        const cleanBlacklistName = (str) => {
          if (!str) return "";
          return str.replace(/[\*\~\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        };

        const cleanBlacklistReason = (str) => {
          if (!str) return "";
          return str.replace(/[\*\~\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        };

        const cleanedName = cleanBlacklistName(name);
        const cleanedReason = cleanBlacklistReason(reason);

        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const safePattern = new RegExp(`^${escapeRegex(cleanedName)}$`, 'i');
        let entry = await Blacklist.findOne({ name: { $regex: safePattern } });

        if (option === "1" || option === "2") {
          let type = option === "1" ? "person" : "group";
          let finalName = cleanedName;
          if (type === "group" && !finalName.endsWith(" grubu")) {
            finalName += " grubu";
          }
          let isNew = false;
          if (entry) {
            entry.reason = cleanedReason;
            entry.type = type;
            entry.status = "active";
            entry.removedAt = null;
            await entry.save();
          } else {
            entry = new Blacklist({ name: finalName, type, reason: cleanedReason, status: "active" });
            await entry.save();
            isNew = true;
          }
          await renderBlacklist(client);
          if (logChannel) {
            await logChannel.send({
              content: `📥 **[WEB KARALİSTE EKLEME]** Admin <@${req.user.discordId}> tarafından **${finalName}** listeye eklendi.\n📋 **Sebep:** ${reason}\n📂 **Tür:** ${type === 'person' ? 'Kişi' : 'Grup'} (${isNew ? 'Yeni Kayıt' : 'Güncellendi'})`
            });
          }
          return res.json({ success: true, message: `✅ **${finalName}** başarıyla karalisteye eklendi.` });
        }

        if (option === "3") {
          if (!entry) return res.status(404).json({ error: `**${name}** karalistede bulunamadı.` });
          entry.status = "removed";
          entry.removedAt = new Date();
          await entry.save();
          await renderBlacklist(client);
          if (logChannel) {
            await logChannel.send({
              content: `📤 **[WEB KARALİSTE KALDIRMA]** Admin <@${req.user.discordId}> tarafından **${entry.name}** kaldırıldı. (15 gün sonra silinecektir.)`
            });
          }
          return res.json({ success: true, message: `✅ **${entry.name}** karaliste yasağı kaldırıldı (strikethrough yapıldı).` });
        }

        if (option === "4") {
          if (!entry) return res.status(404).json({ error: `**${name}** karalistede bulunamadı.` });
          await Blacklist.deleteOne({ _id: entry._id });
          await renderBlacklist(client);
          if (logChannel) {
            await logChannel.send({
              content: `🗑️ **[WEB KARALİSTE TAMAMEN SİLİNDİ]** Admin <@${req.user.discordId}> tarafından **${entry.name}** tamamen silindi.`
            });
          }
          return res.json({ success: true, message: `✅ **${entry.name}** listeden tamamen silindi.` });
        }

        if (option === "5") {
          if (!entry) return res.status(404).json({ error: `**${name}** karalistede bulunamadı.` });
          entry.status = "active";
          entry.removedAt = null;
          await entry.save();
          await renderBlacklist(client);
          if (logChannel) {
            await logChannel.send({
              content: `🔄 **[WEB KARALİSTE YENİDEN ETKİN]** Admin <@${req.user.discordId}> tarafından **${entry.name}** yasağı yeniden aktif edildi.`
            });
          }
          return res.json({ success: true, message: `✅ **${entry.name}** karaliste kaydı yeniden açıldı.` });
        }
      }

      if (actionType === "tamban" || actionType === "tamban_kaldir") {
        const { kullanici_id, seviye, sebep } = payload;
        const { handleModerationCommand } = require("../../bot/handlers/moderationCommandHandler");

        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return actionType;
            if (prop === "options") {
              return {
                getString: (name) => {
                  if (name === "kullanici_id") return kullanici_id;
                  if (name === "seviye") return seviye || "high";
                  if (name === "sebep") return sebep;
                  return null;
                }
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });

        await handleModerationCommand(proxy);
        return res.json({ success: true, message: responseText || "Tam ban işlemi uygulandı." });
      }
    }

    if (category === "staff") {
      if (actionType === "report") {
        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "personelrapor";
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, reportText: responseText || "Rapor verisi boş." });
      }

      if (actionType === "attendance_start" || actionType === "attendance_stop") {
        const { startRollCall, endRollCall } = require("../../bot/services/rollCallService");
        if (actionType === "attendance_start") {
          await startRollCall(client, mockInteraction);
        } else {
          await endRollCall(client, mockInteraction);
        }
        return res.json({ success: true, message: responseText || "Yoklama işlemi tamamlandı." });
      }

      if (actionType === "setstats") {
        const { kullanici, parametre, deger } = payload;
        const targetUserId = (kullanici || "").replace(/[<@!>]/g, "");
        const targetUserObj = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUserObj) return res.status(404).json({ error: "Personel bulunamadı." });

        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "personelayarla";
            if (prop === "options") {
              return {
                getUser: () => targetUserObj,
                getString: () => parametre,
                getInteger: () => parseInt(deger, 10) || 0
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "İstatistik ayarlandı." });
      }

      if (actionType === "fire") {
        const { kullanici, sebep } = payload;
        const targetUserId = (kullanici || "").replace(/[<@!>]/g, "");
        const targetUserObj = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUserObj) return res.status(404).json({ error: "Personel bulunamadı." });

        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "personelkov";
            if (prop === "options") {
              return {
                getUser: () => targetUserObj,
                getString: () => sebep
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Personel kovuldu." });
      }

      if (actionType === "promote_demote") {
        const { kullanici, islem, sebep } = payload;
        const targetUserId = (kullanici || "").replace(/[<@!>]/g, "");
        const targetUserObj = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUserObj) return res.status(404).json({ error: "Personel bulunamadı." });

        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const cmdName = islem === "terfi" ? "birimterfi" : "tenzilat";

        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return cmdName;
            if (prop === "options") {
              return {
                getUser: () => targetUserObj,
                getString: () => sebep
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Rütbe işlemi uygulandı." });
      }

      if (actionType === "reward") {
        const { kullanici, islem, odul } = payload;
        const targetUserId = (kullanici || "").replace(/[<@!>]/g, "");
        const targetUserObj = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUserObj) return res.status(404).json({ error: "Personel bulunamadı." });

        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "odulver";
            if (prop === "options") {
              return {
                getUser: () => targetUserObj,
                getString: (name) => (name === "islem" ? islem : odul)
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Ödül işlemi uygulandı." });
      }

      if (actionType === "giveleave") {
        const { kullanici, tarih, sebep } = payload;
        const targetUserId = (kullanici || "").replace(/[<@!>]/g, "");
        const targetUserObj = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUserObj) return res.status(404).json({ error: "Personel bulunamadı." });

        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "izin_ver";
            if (prop === "options") {
              return {
                getUser: () => targetUserObj,
                getString: (name) => (name === "tarih" ? tarih : sebep)
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "İzin tanımlandı." });
      }
    }

    if (category === "system") {
      if (actionType === "toggle_economy" || actionType === "toggle_moderation" || actionType === "toggle_fun") {
        const ServerConfig = require("../../models/ServerConfig");
        let cfg = await ServerConfig.findOne({ guildId: TARGET_GUILD_ID });
        if (!cfg) {
          cfg = new ServerConfig({ guildId: TARGET_GUILD_ID });
        }

        const modName = actionType.replace("toggle_", "");
        const keyMap = { economy: "economyEnabled", moderation: "moderationEnabled", fun: "funEnabled" };
        const key = keyMap[modName];

        cfg[key] = !cfg[key];
        await cfg.save();
        return res.json({ success: true, message: `✅ ${modName.toUpperCase()} sistemi durumu güncellendi: ${cfg[key] ? "AKTİF" : "DEVRE DIŞI"}` });
      }

      if (actionType === "channel_perms") {
        const { kanal, islem, izin } = payload;
        const channelObj = await client.channels.fetch(kanal).catch(() => null);
        if (!channelObj) return res.status(404).json({ error: "Belirtilen kanal bulunamadı." });

        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "kanal";
            if (prop === "options") {
              return {
                getSubcommand: () => islem,
                getChannel: () => channelObj,
                getString: () => izin
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Kanal izinleri güncellendi." });
      }

      if (actionType === "otomod") {
        const { islem } = payload;
        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "otomod";
            if (prop === "options") {
              return {
                getSubcommand: () => islem
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Otomod güncellendi." });
      }

      if (actionType === "roblox_ranks") {
        const { op, val } = payload;
        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        
        let cmdName = op;
        let optionOverrides = {};

        if (cmdName === "ekobang" || cmdName === "ekobangerial") {
          const targetUserId = val.replace(/[<@!>]/g, "");
          const targetUserObj = await client.users.fetch(targetUserId).catch(() => null);
          if (!targetUserObj) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
          optionOverrides = { getUser: () => targetUserObj };
        } else {
          optionOverrides = { getString: () => val };
        }

        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return cmdName;
            if (prop === "options") return optionOverrides;
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Roblox işlemi tamamlandı." });
      }

      if (actionType === "birimalimi") {
        const { birim } = payload;
        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "birimalimi";
            if (prop === "options") {
              return {
                getString: () => birim
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Birim alımı başlatıldı." });
      }

      if (actionType === "birimtanitim") {
        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "birimtanitim";
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Birim tanıtım mesajı gönderildi." });
      }

      if (actionType === "xpcekilis") {
        const { xp_miktari, kazanan_sayisi } = payload;
        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "xpcekilis";
            if (prop === "options") {
              return {
                getInteger: (name) => (name === "xp_miktari" ? parseInt(xp_miktari, 10) : parseInt(kazanan_sayisi, 10))
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Çekiliş başlatıldı." });
      }

      if (actionType === "konus") {
        const { kullanici, konu } = payload;
        const targetUserId = kullanici.replace(/[<@!>]/g, "");
        const targetUserObj = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUserObj) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "konus";
            if (prop === "options") {
              return {
                getUser: () => targetUserObj,
                getString: () => konu
              };
            }
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "AI DM konuşması başlatıldı." });
      }

      if (actionType === "abusetest") {
        const { handleGeneralCommand } = require("../../bot/handlers/generalCommandHandler");
        const proxy = new Proxy(mockInteraction, {
          get(target, prop) {
            if (prop === "commandName") return "abusetest";
            return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
          }
        });
        await handleGeneralCommand(proxy);
        return res.json({ success: true, message: responseText || "Abuse embed testi gönderildi." });
      }

      if (actionType === "modalim_search") {
        const { user } = payload;
        const targetUserId = user.replace(/[<@!>]/g, "");
        const targetUserObj = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUserObj) return res.status(404).json({ error: "Aday bulunamadı." });
        if (targetUserObj.bot) return res.status(400).json({ error: "Botlara mülakat gönderilemez." });

        const { startModInterview } = require("../../bot/services/modInterview");
        const sent = await startModInterview(targetUserObj, req.user.discordId, guild.id, client);
        if (sent) {
          return res.json({ success: true, message: `✅ **${targetUserObj.username}** kullanıcısına mülakat daveti DM'de gönderildi.` });
        } else {
          return res.status(400).json({ error: `❌ **${targetUserObj.username}** kullanıcısına DM gönderilemedi. DM kutusu kapalı olabilir.` });
        }
      }

      if (actionType === "modalim_direct") {
        const { user, robloxUsername } = payload;
        const targetUserId = user.replace(/[<@!>]/g, "");
        const targetUserObj = await client.users.fetch(targetUserId).catch(() => null);
        if (!targetUserObj) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

        const MOD_ROLE_ID = process.env.MOD_ROLE_ID || '1518692389169135666';
        const MOD_GUILD_ID = process.env.MOD_GUILD_ID || '1367646464804655104';

        const modGuild = await client.guilds.fetch(MOD_GUILD_ID).catch(() => null);
        if (modGuild) {
          const member = await modGuild.members.fetch(targetUserId).catch(() => null);
          if (member) {
            await member.roles.add(MOD_ROLE_ID, `Direkt mod alımı - Admin: ${req.user.discordUsername}`);
          }
        }

        const StaffProgress = require("../../models/StaffProgress");
        let staffRecord = await StaffProgress.findOne({ userId: targetUserId });
        if (!staffRecord) {
          staffRecord = new StaffProgress({ userId: targetUserId, guildId: MOD_GUILD_ID, level: 1 });
        } else {
          if (staffRecord.level < 1) {
            staffRecord.level = 1;
          }
          staffRecord.status = 'active';
          staffRecord.dismissedAt = null;
          staffRecord.dismissReason = null;
        }
        await staffRecord.save();

        const { ensureAdminGuildMembership } = require("../../bot/services/staffAutomation");
        await ensureAdminGuildMembership(client, targetUserId).catch(() => {});

        const noblox = require("noblox.js");
        const robloxId = await noblox.getIdFromUsername(robloxUsername.trim()).catch(() => null);
        if (!robloxId) {
          return res.status(400).json({ error: `Roblox kullanıcısı (${robloxUsername}) bulunamadı. Lütfen kontrol edip manuel doğrulayın.` });
        }

        const User = require("../../models/User");
        const { saveStoreNow } = require("../../models/Store");
        let dbUser = await User.findOne({ discordId: targetUserId });
        if (!dbUser) {
          dbUser = new User({ discordId: targetUserId, discordUsername: targetUserObj.username });
        }
        dbUser.robloxId = String(robloxId);
        dbUser.robloxUsername = robloxUsername;
        dbUser.isAuthorized = true;
        await dbUser.save();
        saveStoreNow();

        const { syncStaffRobloxRanks, syncStaffDiscordRoles } = require("../../bot/services/staffAutomation");
        await syncStaffRobloxRanks(client, targetUserId).catch(() => {});
        await syncStaffDiscordRoles(client, targetUserId).catch(() => {});

        const { syncMemberRoles } = require("../../bot/services/roleSyncService");
        const { VERIFY_CHANNEL_ID } = require("../../config");
        
        const mainGuild = await client.guilds.fetch(TARGET_GUILD_ID).catch(() => null);
        if (mainGuild) {
          const mainMember = await mainGuild.members.fetch(targetUserId).catch(() => null);
          if (mainMember) {
            await syncMemberRoles(mainGuild, mainMember, robloxId, robloxUsername).catch(() => {});
          }
        }

        const { EmbedBuilder } = require("discord.js");
        const dmEmbed = new EmbedBuilder()
          .setColor(0x7c6af7)
          .setTitle("🔗 Roblox Grup Doğrulaması Başarılı")
          .setThumbnail(targetUserObj.avatarURL() || null)
          .setDescription(
            `Merhaba **${targetUserObj.username}**! 👋\n\n` +
            `Roblox hesabınız başarıyla doğrulandı ve yetkili yetkileriniz tanımlandı.\n\n` +
            `🎮 **Roblox Kullanıcı Adı:** \`${robloxUsername}\`\n` +
            `🆔 **Roblox ID:** \`${robloxId}\`\n` +
            `📈 **Personel Seviyesi:** \`Stajyer (Level 1)\`\n\n` +
            `✓ Discord rolleri senkronize edildi\n` +
            `✓ Roblox grup rütbeleri ayarlandı\n` +
            `✓ Staff sistem kaydı aktif edildi`
          )
          .setFooter({ text: "Sentara Entegrasyon Sistemi" })
          .setTimestamp();

        await targetUserObj.send({ embeds: [dmEmbed] }).catch(() => {});

        if (mainGuild && VERIFY_CHANNEL_ID) {
          const verifyChannel = await mainGuild.channels.fetch(VERIFY_CHANNEL_ID).catch(() => null);
          if (verifyChannel && verifyChannel.isTextBased()) {
            const publicEmbed = new EmbedBuilder()
              .setColor(0x4ade80)
              .setTitle("🔗 Yeni Personel Roblox Doğrulaması")
              .setDescription(
                `**Kullanıcı:** <@${targetUserId}> (\`${targetUserId}\`)\n` +
                `**Roblox Hesabı:** [${robloxUsername}](https://www.roblox.com/users/${robloxId}/profile) (\`${robloxId}\`)\n` +
                `**Durum:** Yetkili doğrulandı ve roller sunucuda senkronize edildi.`
              )
              .setFooter({ text: "Sentara Roblox Doğrulama" })
              .setTimestamp();
            await verifyChannel.send({ embeds: [publicEmbed] }).catch(() => {});
          }
        }

        return res.json({
          success: true,
          message: `✅ **${targetUserObj.username}** başarıyla stajyer mod olarak alındı ve Roblox hesabı **${robloxUsername}** olarak doğrulandı.`
        });
      }

      if (actionType === "restart") {
        res.json({ success: true, message: "🔄 Bot yeniden başlatılıyor..." });
        setTimeout(() => {
          process.exit(0);
        }, 1500);
        return;
      }
    }

    return res.status(400).json({ error: "Bilinmeyen işlem veya kategori." });
  } catch (err) {
    console.error("[webAction] Hata:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/api/roles/sync", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });

  const { hasRobloxLink, findUserByDiscordId } = require("../../utils/userLink");
  const freshUser = (await findUserByDiscordId(req.user.discordId)) || req.user;

  if (!hasRobloxLink(freshUser)) {
    return res.status(400).json({
      error: "Roblox hesabı bağlı değil.",
      authorizeUrl: `/auth/authorize?discordId=${req.user.discordId}`,
    });
  }

  const { getDiscordClient } = require("../../bot/discordClient");
  const { syncMemberRoles } = require("../../bot/services/roleSyncService");
  const { TARGET_GUILD_ID, BASE_URL } = require("../../config");
  const User = require("../../models/User");

  const client = getDiscordClient();
  if (!client?.isReady()) {
    return res.status(503).json({ error: "Discord bot henüz hazır değil. Birkaç saniye sonra tekrar deneyin." });
  }

  try {
    const guild = await client.guilds.fetch(TARGET_GUILD_ID);
    const member = await guild.members.fetch(req.user.discordId);

    const result = await syncMemberRoles(
      guild,
      member,
      parseInt(freshUser.robloxId, 10),
      freshUser.robloxUsername
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    if (freshUser && freshUser.groupRole !== result.rankName) {
      freshUser.groupRole = result.rankName;
      await freshUser.save();
    }

    res.json({
      success: true,
      nickname: result.nickname,
      rankName: result.rankName,
      added: result.added.map((r) => ({ id: r.id, name: r.name })),
      removed: result.removed.map((r) => ({ id: r.id, name: r.name })),
      unresolved: result.unresolved || [],
      dashboardUrl: `${BASE_URL}/dashboard`,
    });
  } catch (err) {
    if (err.code === 10007) {
      return res.status(404).json({
        error: "Discord sunucusunda bulunamadınız. Önce sunucuya katılın.",
      });
    }
    console.error("Web role sync error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/settings", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  
  const { profileBio, profileColor, sitePassword, gunsLolUrl, profileBgUrl, profileMusicUrl } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      if (profileBio !== undefined) user.profileBio = String(profileBio).slice(0, 500);
      if (profileColor !== undefined) user.profileColor = String(profileColor).slice(0, 32);
      if (gunsLolUrl !== undefined) user.gunsLolUrl = String(gunsLolUrl).slice(0, 150);
      if (profileBgUrl !== undefined) user.profileBgUrl = String(profileBgUrl).slice(0, 250);
      if (profileMusicUrl !== undefined) user.profileMusicUrl = String(profileMusicUrl).slice(0, 250);

      if (sitePassword) {
        const bcrypt = require("bcrypt");
        user.sitePassword = await bcrypt.hash(sitePassword, 10);
        user.passwordCreatedAt = new Date();
      }

      await user.save();
      saveStoreNow();
      if (req.session) {
        req.session.passport.user = user._id;
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: kullanıcı ban ─────────────────────────────────────────────────────
router.post("/api/admin/users/:discordId/ban", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const targetId = String(req.params.discordId);
  if (targetId === String(req.user.discordId)) {
    return res.status(400).json({ error: "Kendinizi banlayamazsınız." });
  }

  const { reason, discordBan } = req.body;
  const banReason = (reason || "Belirtilmedi").trim().slice(0, 500);

  try {
    const user = await User.findOne({ discordId: targetId });
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    if (user.isAdmin) {
      return res.status(403).json({ error: "Admin kullanıcılar banlanamaz." });
    }

    // Site ban
    user.isBanned = true;
    user.banReason = banReason;
    user.bannedAt = new Date();
    user.bannedBy = req.user.discordId;
    await user.save();
    saveStoreNow();

    // Discord ban (isteğe bağlı)
    let discordResult = null;
    if (discordBan) {
      try {
        const { getDiscordClient } = require("../../bot/discordClient");
        const { TARGET_GUILD_ID } = require("../../config");
        const client = getDiscordClient();
        if (client?.isReady()) {
          const guild = await client.guilds.fetch(TARGET_GUILD_ID);
          await guild.members.ban(targetId, { reason: `[Web Panel] ${banReason} — Yetkili: ${req.user.discordUsername}` });
          discordResult = "Discord ban uygulandı.";
        } else {
          discordResult = "Bot hazır değil, Discord ban uygulanamadı.";
        }
      } catch (dErr) {
        discordResult = `Discord ban hatası: ${dErr.message}`;
      }
    }

    res.json({
      success: true,
      message: `${user.discordUsername} yasaklandı.`,
      discordResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: kullanıcı ban kaldır ──────────────────────────────────────────────
router.post("/api/admin/users/:discordId/unban", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const targetId = String(req.params.discordId);
  const { discordUnban } = req.body;

  try {
    const user = await User.findOne({ discordId: targetId });
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    user.isBanned = false;
    user.banReason = null;
    user.bannedAt = null;
    user.bannedBy = null;
    await user.save();
    saveStoreNow();

    // Discord unban (isteğe bağlı)
    let discordResult = null;
    if (discordUnban) {
      try {
        const { getDiscordClient } = require("../../bot/discordClient");
        const { TARGET_GUILD_ID } = require("../../config");
        const client = getDiscordClient();
        if (client?.isReady()) {
          const guild = await client.guilds.fetch(TARGET_GUILD_ID);
          await guild.bans.remove(targetId, `[Web Panel] Ban kaldırıldı — Yetkili: ${req.user.discordUsername}`);
          discordResult = "Discord ban kaldırıldı.";
        } else {
          discordResult = "Bot hazır değil, Discord ban kaldırılamadı.";
        }
      } catch (dErr) {
        discordResult = `Discord unban hatası: ${dErr.message}`;
      }
    }

    res.json({
      success: true,
      message: `${user.discordUsername} yasağı kaldırıldı.`,
      discordResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: rütbe tanımları ───────────────────────────────────────────────────
const SITE_ROLES = {
  wiki_editor:      { name: "📝 Wiki Editörü",        color: "#7c6af7" },
  moderator:        { name: "🛡️ Moderatör",            color: "#4ade80" },
  support_lead:     { name: "⭐ Destek Lideri",        color: "#fbbf24" },
  content_creator:  { name: "🎬 İçerik Yaratıcısı",   color: "#ff6bf7" },
  translator:       { name: "🌐 Çevirmen",             color: "#06b6d4" },
  event_manager:    { name: "🎉 Etkinlik Yöneticisi",  color: "#f97316" },
  community_helper: { name: "🤝 Topluluk Yardımcısı", color: "#a3e635" },
  media_team:       { name: "📸 Medya Ekibi",          color: "#e879f9" },
  developer:        { name: "💻 Geliştirici",          color: "#38bdf8" },
  vip:              { name: "👑 VIP",                  color: "#facc15" },
};

// ── Admin: kullanıcıya rütbe ata ─────────────────────────────────────────────
router.post("/api/admin/users/:discordId/site-roles", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const targetId = String(req.params.discordId);
  const { roles } = req.body;

  if (!Array.isArray(roles)) {
    return res.status(400).json({ error: "Roles bir dizi olmalı." });
  }

  const validRoles = roles.filter(r => SITE_ROLES[r]);

  try {
    const user = await User.findOne({ discordId: targetId });
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    user.roles = validRoles;
    await user.save();
    saveStoreNow();

    res.json({
      success: true,
      message: `${user.discordUsername} rütbeleri güncellendi.`,
      roles: user.roles,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: rütbe listesi ─────────────────────────────────────────────────────
router.get("/api/admin/roles", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json({ success: true, roles: SITE_ROLES });
});

// ── Admin: kullanıcıya coin ver ──────────────────────────────────────────────
router.post("/api/admin/users/:discordId/give-coins", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const targetId = String(req.params.discordId);
  const { amount, reason } = req.body;
  const coins = parseInt(amount, 10);

  if (isNaN(coins) || coins <= 0) {
    return res.status(400).json({ error: "Geçerli bir miktar girin." });
  }
  if (coins > 1000000) {
    return res.status(400).json({ error: "Maksimum 1.000.000 coin verebilirsiniz." });
  }

  try {
    const user = await User.findOne({ discordId: targetId });
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    let eco = await Economy.findOne({ userId: targetId });
    if (!eco) {
      eco = new Economy({ userId: targetId });
    }

    eco.balance = (eco.balance || 0) + coins;
    eco.totalEarned = (eco.totalEarned || 0) + coins;
    await eco.save();
    saveStoreNow();

    try {
      const { addNotification } = require("../../utils/notification");
      await addNotification(targetId, {
        title: "💰 Coin Eklendi",
        message: `${coins.toLocaleString("tr-TR")} coin hesabınıza eklendi. Sebep: ${reason || 'Belirtilmedi'}`,
        icon: "💰"
      });
    } catch (_) {}

    console.log(`[admin-coins] ${req.user.discordUsername} → ${user.discordUsername}: +${coins} coin (${reason || 'sebep yok'})`);

    res.json({
      success: true,
      message: `${user.discordUsername} kullanıcısına ${coins.toLocaleString("tr-TR")} coin verildi.`,
      newBalance: eco.balance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: banlı kullanıcı listesi ──────────────────────────────────────────
router.get("/api/admin/bans", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { users: userStore } = require("../../models/Store");
    const banned = userStore.find({}).filter(u => u.isBanned);
    res.json({
      success: true,
      bans: banned.map(u => ({
        discordId: u.discordId,
        discordUsername: u.discordUsername,
        discordAvatar: u.discordAvatar,
        banReason: u.banReason,
        bannedAt: u.bannedAt,
        bannedBy: u.bannedBy,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Etkinlik Yetkilisi Formu Gönderme ───────────────────────────────────────
router.post("/api/forms/event-staff/submit", async (req, res) => {
  try {
    const FormSubmission = require("../../models/FormSubmission");
    const { discordUsername, discordId: bodyDiscordId, personal, technical, scenarios, confirmations } = req.body;
    const userId = req.user ? req.user.discordId : ("guest_" + Date.now());
    const targetDiscordId = bodyDiscordId || req.body.q_discord_id || (req.user ? req.user.discordId : userId);

    // Check existing pending application if user is logged in
    if (req.user) {
      const existing = await FormSubmission.findPendingByUser(userId, "event_staff");
      if (existing) {
        return res.status(400).json({ error: "Zaten incelenmekte olan aktif bir başvurunuz bulunmaktadır." });
      }
    }

    if (!personal || !technical || !scenarios || !confirmations) {
      return res.status(400).json({ error: "Lütfen tüm zorunlu soruları doldurun." });
    }

    // Save submission
    const submission = await FormSubmission.create({
      userId,
      discordId: targetDiscordId,
      discordUsername: discordUsername || (req.user ? (req.user.discordUsername || req.user.username) : "Misafir"),
      formType: "event_staff",
      formTitle: "Etkinlik Sorumluluğu // [A-1] 1. Nesil Sorumlu Başvuru Formu",
      formData: {
        personal,
        technical,
        scenarios,
        confirmations
      }
    });

    // Send Discord Log & Channel Notification
    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { sendNewApplicationLog } = require("../../bot/services/staffRecruitmentPanelService");
      const botClient = getDiscordClient();
      if (botClient && botClient.isReady()) {
        sendNewApplicationLog(botClient, submission).catch(() => {});
      }
    } catch (_) {}

    // Start automated Bot DM interview preliminary question flow
    try {
      const { startFormInterviewFlow } = require("../../bot/services/formInterviewService");
      startFormInterviewFlow(submission._id).catch(e => console.error("[formSubmit] Interview flow start error:", e.message));
    } catch (_) {}

    res.json({ success: true, message: "Başvurunuz başarıyla gönderildi!", submissionId: submission._id });
  } catch (err) {
    console.error("[event-staff-submit] Error:", err.message);
    res.status(500).json({ error: "Sunucu hatası: " + err.message });
  }
});

// ── Topluluk Elçisi Formu Gönderme ───────────────────────────────────────────
router.post("/api/forms/community-ambassador/submit", async (req, res) => {
  try {
    const FormSubmission = require("../../models/FormSubmission");
    const { discordUsername, discordId: bodyDiscordId, section1, section2, section3, section4, section5, section6, behavior } = req.body;
    const userId = req.user ? req.user.discordId : ("guest_" + Date.now());
    const targetDiscordId = bodyDiscordId || req.body.q_discord_id || (req.user ? req.user.discordId : userId);

    // Check 20-hour application deadline
    const DEADLINE_MS = 1786455128000;
    if (Date.now() > DEADLINE_MS) {
      return res.status(400).json({ error: "Topluluk Elçiliği başvuruları 20 saatlik sürenin dolması nedeniyle kapanmıştır." });
    }

    // Check existing pending application if user is logged in
    if (req.user) {
      const existing = await FormSubmission.findPendingByUser(userId, "community_ambassador");
      if (existing) {
        return res.status(400).json({ error: "Zaten incelenmekte olan aktif bir Topluluk Elçiliği başvurunuz bulunmaktadır." });
      }
    }

    if (!section1 || !section2 || !section3 || !section4 || !section5 || !section6) {
      return res.status(400).json({ error: "Lütfen tüm zorunlu bölüm ve soruları doldurunuz." });
    }

    // Save submission
    const submission = await FormSubmission.create({
      userId,
      discordId: targetDiscordId,
      discordUsername: discordUsername || (req.user ? (req.user.discordUsername || req.user.username) : "Misafir"),
      formType: "community_ambassador",
      formTitle: "EkoYıldız Topluluk Elçisi // Mülakat Başvuru Formu",
      formData: {
        section1,
        section2,
        section3,
        section4,
        section5,
        section6,
        behavior
      }
    });

    // Send Discord Log & Channel Notification
    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { sendNewApplicationLog } = require("../../bot/services/staffRecruitmentPanelService");
      const botClient = getDiscordClient();
      if (botClient && botClient.isReady()) {
        sendNewApplicationLog(botClient, submission).catch(() => {});
      }
    } catch (_) {}

    // Start automated Bot DM interview preliminary question flow
    try {
      const { startFormInterviewFlow } = require("../../bot/services/formInterviewService");
      startFormInterviewFlow(submission._id).catch(e => console.error("[formSubmit] Interview flow start error:", e.message));
    } catch (_) {}

    res.json({ success: true, message: "Topluluk Elçiliği başvurunuz başarıyla alınmıştır!", submissionId: submission._id });
  } catch (err) {
    console.error("[community-ambassador-submit] Error:", err.message);
    res.status(500).json({ error: "Sunucu hatası: " + err.message });
  }
});

// ── Geliştirici Alım Formu Gönderme ─────────────────────────────────────────────
router.post("/api/forms/developer/submit", async (req, res) => {
  try {
    const FormSubmission = require("../../models/FormSubmission");
    const { discordUsername, discordId: bodyDiscordId } = req.body;
    const userId = req.user ? req.user.discordId : ("guest_" + Date.now());
    const targetDiscordId = bodyDiscordId || req.body.q_discord_id || (req.user ? req.user.discordId : userId);

    if (req.user) {
      const existing = await FormSubmission.findPendingByUser(userId, "developer");
      if (existing) {
        return res.status(400).json({ error: "Zaten incelenmekte olan aktif bir Geliştirici başvurunuz bulunmaktadır." });
      }
    }

    const submission = await FormSubmission.create({
      userId,
      discordId: targetDiscordId,
      targetDiscordId: targetDiscordId,
      discordUsername: discordUsername || (req.user ? (req.user.discordUsername || req.user.username) : "Misafir"),
      formType: "developer",
      formTitle: "Geliştirici Ekibi // Geliştirici Ofisi Alım Formu",
      formData: req.body
    });

    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { sendNewApplicationLog } = require("../../bot/services/staffRecruitmentPanelService");
      const botClient = getDiscordClient();
      if (botClient && botClient.isReady()) {
        sendNewApplicationLog(botClient, submission).catch(() => {});
      }
    } catch (_) {}

    try {
      const { startFormInterviewFlow } = require("../../bot/services/formInterviewService");
      startFormInterviewFlow(submission._id).catch(e => console.error("[formSubmit] Interview flow start error:", e.message));
    } catch (_) {}

    res.json({ success: true, message: "Geliştirici başvurunuz başarıyla alınmıştır!", submissionId: submission._id });
  } catch (err) {
    console.error("[developer-submit] Error:", err.message);
    res.status(500).json({ error: "Sunucu hatası: " + err.message });
  }
});

// ── Hata Ayıklama Ofisi Formu Gönderme ─────────────────────────────────────────
router.post("/api/forms/debug-office/submit", async (req, res) => {
  try {
    const FormSubmission = require("../../models/FormSubmission");
    const { discordUsername, discordId: bodyDiscordId } = req.body;
    const userId = req.user ? req.user.discordId : ("guest_" + Date.now());
    const targetDiscordId = bodyDiscordId || req.body.q_discord_id || (req.user ? req.user.discordId : userId);

    if (req.user) {
      const existing = await FormSubmission.findPendingByUser(userId, "debug_office");
      if (existing) {
        return res.status(400).json({ error: "Zaten incelenmekte olan aktif bir Hata Ayıklama Ofisi başvurunuz bulunmaktadır." });
      }
    }

    const submission = await FormSubmission.create({
      userId,
      discordId: targetDiscordId,
      targetDiscordId: targetDiscordId,
      discordUsername: discordUsername || (req.user ? (req.user.discordUsername || req.user.username) : "Misafir"),
      formType: "debug_office",
      formTitle: "Hata Ayıklama Ofisi Alım Formu",
      formData: req.body
    });

    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { sendNewApplicationLog } = require("../../bot/services/staffRecruitmentPanelService");
      const botClient = getDiscordClient();
      if (botClient && botClient.isReady()) {
        sendNewApplicationLog(botClient, submission).catch(() => {});
      }
    } catch (_) {}

    try {
      const { startFormInterviewFlow } = require("../../bot/services/formInterviewService");
      startFormInterviewFlow(submission._id).catch(e => console.error("[formSubmit] Interview flow start error:", e.message));
    } catch (_) {}

    res.json({ success: true, message: "Hata Ayıklama Ofisi başvurunuz başarıyla alınmıştır!", submissionId: submission._id });
  } catch (err) {
    console.error("[debug-office-submit] Error:", err.message);
    res.status(500).json({ error: "Sunucu hatası: " + err.message });
  }
});

// ── Admin: Form Başvurularını Listele ─────────────────────────────────────────
router.get("/api/admin/form-submissions", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const FormSubmission = require("../../models/FormSubmission");
    const submissions = await FormSubmission.findAll();
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Form Başvurusunu Değerlendir (Onayla / Reddet) ──────────────────────
router.post("/api/admin/form-submissions/:id/review", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { status, note } = req.body;
    if (!["APPROVED", "REJECTED", "AI_DETECTED"].includes(status)) {
      return res.status(400).json({ error: "Geçersiz durum (APPROVED, REJECTED veya AI_DETECTED olmalı)." });
    }

    const FormSubmission = require("../../models/FormSubmission");
    const updated = await FormSubmission.updateStatus(req.params.id, status, req.user.discordUsername, note);
    if (!updated) {
      return res.status(404).json({ error: "Başvuru kaydı bulunamadı." });
    }

    // Kullanıcıya bot DM gönder
    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { extractTargetDiscordId } = require("../../bot/services/formInterviewService");
      const client = getDiscordClient();
      if (client && client.isReady()) {
        const targetId = extractTargetDiscordId(updated) || updated.userId;
        const user = targetId ? await client.users.fetch(targetId).catch(() => null) : null;
        if (user) {
          const { ButtonStyle } = require("discord.js");
          const ComponentsV2Factory = require("../../bot/utils/componentsV2Factory");

          const statusMessages = {
            APPROVED:    { emoji: '✅', title: 'Başvurunuz Kabul Edildi!', color: 0x34d399, msg: 'Tebrikler! Etkinlik Yetkilisi başvurunuz değerlendirildi ve **kabul edildi**. Ekibimize hoş geldiniz!' },
            REJECTED:    { emoji: '❌', title: 'Başvurunuz Reddedildi', color: 0xfb7185, msg: 'Etkinlik Yetkilisi başvurunuz incelendi ve maalesef **reddedildi**. Gelecekte yeni başvurular açıldığında tekrar başvurabilirsiniz.' },
            AI_DETECTED: { emoji: '🤖', title: 'Başvurunuzda AI İçerik Tespit Edildi', color: 0xa78bfa, msg: 'Başvurunuz incelendi ve yanıtlarınızda **yapay zekâ kullanımı tespit edildi**. Bu nedenle başvurunuz geçersiz sayılmıştır. Özgün yanıtlarla yeniden başvurabilirsiniz.' },
          };
          const sm = statusMessages[status];
          const noteSection = note ? '\n\n📝 **Not:** ' + note : '';

          const payload = {
            flags: ComponentsV2Factory.FLAGS,
            components: [
              ComponentsV2Factory.container(sm.color, [
                ComponentsV2Factory.section(
                  '## ' + sm.emoji + ' ' + sm.title + '\n\n' +
                  sm.msg + noteSection + '\n\n' +
                  '**Form:** ' + (updated.formTitle || 'Etkinlik Yetkilisi Başvurusu') + '\n' +
                  '**Değerlendiren:** ' + req.user.discordUsername
                ),
              ]),
            ],
          };
          await user.send(payload).catch(() => {});

          // Etkinlik Sorumlusu (Event Staff) oryantasyonunu başlat
          if (status === 'APPROVED' && updated.formType === 'event_staff') {
            try {
              const { startEventStaffOnboarding } = require("../../bot/services/eventStaffOnboarding");
              await startEventStaffOnboarding(targetId, client);
            } catch (err) {
              console.error('[EventStaffOnboarding] Integration error:', err.message);
            }
          }
        }
      }
    } catch (_) {}

    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Forma soru sor (kullanıcıya DM) ────────────────────────────────────
router.post("/api/admin/form-submissions/:id/ask", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { questionKey, questionLabel, questionText } = req.body;
    if (!questionText || !questionText.trim()) {
      return res.status(400).json({ error: "Soru metni boş olamaz." });
    }

    const FormSubmission = require("../../models/FormSubmission");
    const submission = await FormSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: "Başvuru bulunamadı." });
    }

    const { getDiscordClient } = require("../../bot/discordClient");
    const { extractTargetDiscordId } = require("../../bot/services/formInterviewService");
    const client = getDiscordClient();
    if (!client || !client.isReady()) {
      return res.status(503).json({ error: "Bot bağlı değil, DM gönderilemiyor." });
    }

    const targetId = extractTargetDiscordId(submission) || submission.userId;
    const user = targetId ? await client.users.fetch(targetId).catch(() => null) : null;
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı Discord'da bulunamadı. DM gönderilemedi." });
    }

    const ComponentsV2Factory = require("../../bot/utils/componentsV2Factory");
    const { ButtonStyle } = require("discord.js");

    // Cevap vermek için token — submission ID + question key
    const replyToken = Buffer.from(req.params.id + '|' + (questionKey || 'q')).toString('base64').replace(/=/g,'');

    const payload = {
      flags: ComponentsV2Factory.FLAGS,
      components: [
        ComponentsV2Factory.container(0x818cf8, [
          ComponentsV2Factory.section(
            '## 💬 Moderatörümüz Size Soru Sordu\n\n' +
            '**Form:** ' + (submission.formTitle || 'Etkinlik Yetkilisi Başvurusu') + '\n' +
            '**Sorulan konu:** ' + (questionLabel || questionKey || '—') + '\n\n' +
            '**Soru:**\n> ' + questionText.trim()
          ),
          ComponentsV2Factory.separator(false),
          ComponentsV2Factory.text('Cevaplamak veya cevaplamayı reddetmek için aşağıdaki butona tıklayın.'),
          ComponentsV2Factory.actionRow([
            { custom_id: 'formask_reply_' + replyToken, label: '✍️ Cevap Ver', style: ButtonStyle.Primary },
            { custom_id: 'formask_decline_' + replyToken, label: 'Cevap Vermek İstemiyorum', style: ButtonStyle.Secondary },
          ]),
        ]),
      ],
    };

    try {
      await user.send(payload);
    } catch (dmErr) {
      try {
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
        const embed = new EmbedBuilder()
          .setColor(0x818cf8)
          .setTitle("💬 Moderatörümüz Size Soru Sordu")
          .setDescription(
            '**Form:** ' + (submission.formTitle || 'Etkinlik Yetkilisi Başvurusu') + '\n' +
            '**Sorulan konu:** ' + (questionLabel || questionKey || '—') + '\n\n' +
            '**Soru:**\n> ' + questionText.trim()
          )
          .setFooter({ text: "Cevap vermek veya reddetmek için aşağıdaki butonları kullanabilirsiniz." });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('formask_reply_' + replyToken).setLabel('✍️ Cevap Ver').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('formask_decline_' + replyToken).setLabel('Cevap Vermek İstemiyorum').setStyle(ButtonStyle.Secondary)
        );

        await user.send({ embeds: [embed], components: [row] });
      } catch (fallbackErr) {
        console.error('[form-ask] DM send error:', fallbackErr.message);
        if (fallbackErr.code === 50007 || dmErr.code === 50007) {
          return res.status(400).json({ error: "Kullanıcının Discord özel mesajları (DM) kapalı olduğu için soru iletilemedi." });
        }
        return res.status(400).json({ error: "Discord DM gönderilemedi: " + (fallbackErr.message || dmErr.message) });
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[form-ask] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: DM Atılacak Discord ID Kaydet ───────────────────────────────────────
router.post("/api/admin/form-submissions/:id/set-target-discord-id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { targetDiscordId } = req.body;
    if (!targetDiscordId || !targetDiscordId.trim()) {
      return res.status(400).json({ error: "Discord ID alanı boş olamaz." });
    }

    const cleanedId = targetDiscordId.trim();
    if (!/^\d{17,20}$/.test(cleanedId)) {
      return res.status(400).json({ error: "Geçersiz Discord ID formatı. 17-20 haneli sayısal ID giriniz." });
    }

    const FormSubmission = require("../../models/FormSubmission");
    const updated = await FormSubmission.update(req.params.id, {
      targetDiscordId: cleanedId,
      discordId: cleanedId,
      q_discord_id: cleanedId,
    });

    if (!updated) {
      return res.status(404).json({ error: "Başvuru kaydı bulunamadı." });
    }

    // Anında zamanlayıcı kontrolünü tetikle
    try {
      const { checkAndSendReminders } = require("../../bot/services/formInterviewScheduler");
      checkAndSendReminders().catch(() => {});
    } catch (_) {}

    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Roblox Oyun Linki Kaydet ──────────────────────────────────────────
router.post("/api/admin/form-submissions/:id/set-game-link", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { gameLink } = req.body;
    if (!gameLink || !gameLink.trim()) {
      return res.status(400).json({ error: "Roblox oyun linki boş olamaz." });
    }

    const FormSubmission = require("../../models/FormSubmission");
    const updated = await FormSubmission.update(req.params.id, { robloxGameLink: gameLink.trim() });
    if (!updated) {
      return res.status(404).json({ error: "Başvuru kaydı bulunamadı." });
    }

    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Mülakat Saatini Onayla ─────────────────────────────────────────────
router.post("/api/admin/form-submissions/:id/approve-time", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { scheduledTime } = req.body;
    const FormSubmission = require("../../models/FormSubmission");
    const submission = await FormSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: "Başvuru kaydı bulunamadı." });
    }

    const finalTime = scheduledTime || submission.interviewScheduledTime || "Belirtilen Saat";
    const updated = await FormSubmission.update(req.params.id, {
      interviewScheduledTime: finalTime,
      interviewTimeApproved: true,
      interviewState: "TIME_APPROVED",
    });

    // Kullanıcıya Discord DM gönder
    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { extractTargetDiscordId } = require("../../bot/services/formInterviewService");
      const client = getDiscordClient();
      if (client && client.isReady()) {
        const discordId = extractTargetDiscordId(updated);
        const user = discordId ? await client.users.fetch(discordId).catch(() => null) : null;
        if (user) {
          const { EmbedBuilder } = require("discord.js");
          const embed = new EmbedBuilder()
            .setColor(0x34d399)
            .setTitle("✅ MÜLAKAT SAATİNİZ ONAYLANDI!")
            .setDescription(
              `Merhaba **${updated.discordUsername || "Aday"}**,\n\n` +
              `Başvurunuz için belirlenen mülakat saati yetkili ekibimiz tarafından **ONAYLANMIŞTIR**.\n\n` +
              `⏰ **Onaylanan Mülakat Saati:** \`${finalTime}\`\n\n` +
              `📌 Lütfen belirtilen saatten 15 dakika önce Discord ve Roblox ortamınızda hazır bulununuz.\n` +
              `Mülakat saatinize yakın sürede botumuz tarafından bildirim ve RP tavsiyeleri alacaksınız.`
            )
            .setFooter({ text: "Sentara Mülakat Yönetimi" });

          await user.send({ embeds: [embed] }).catch(() => {});
        }
      }
    } catch (_) {}

    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Farklı Mülakat Saati Teklif Et ───────────────────────────────────────
router.post("/api/admin/form-submissions/:id/propose-time", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { proposedTime } = req.body;
    if (!proposedTime || !proposedTime.trim()) {
      return res.status(400).json({ error: "Teklif edilecek mülakat saati belirtilmelidir." });
    }

    const FormSubmission = require("../../models/FormSubmission");
    const updated = await FormSubmission.update(req.params.id, {
      interviewScheduledTime: proposedTime.trim(),
      interviewTimeApproved: false,
      interviewState: "SCHEDULE_QUESTION",
    });

    if (!updated) {
      return res.status(404).json({ error: "Başvuru kaydı bulunamadı." });
    }

    // Bot DM ile kullanıcıya yeni saati sor
    try {
      const { startFormInterviewFlow } = require("../../bot/services/formInterviewService");
      await startFormInterviewFlow(updated._id);
    } catch (_) {}

    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Mülakatı Bitir (Danışman Yorum DM Tetikle) ─────────────────────────
router.post("/api/admin/form-submissions/:id/finish-interview", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const FormSubmission = require("../../models/FormSubmission");
    const updated = await FormSubmission.update(req.params.id, {
      interviewState: "FINISHED",
    });

    if (!updated) {
      return res.status(404).json({ error: "Başvuru kaydı bulunamadı." });
    }

    // Send Danışman Yorum / Yıldız Değerlendirmesi DM to user
    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { sendConsultantReviewDM, extractTargetDiscordId } = require("../../bot/services/formInterviewService");
      const client = getDiscordClient();
      if (client && client.isReady()) {
        const discordId = extractTargetDiscordId(updated);
        if (discordId) await sendConsultantReviewDM(client, discordId, updated._id);
      }
    } catch (dmErr) {
      console.error("[finish-interview] DM error:", dmErr.message);
    }

    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Mülakatı Kabul Et ──────────────────────────────────────────────────
router.post("/api/admin/form-submissions/:id/accept-interview", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const FormSubmission = require("../../models/FormSubmission");
    const updated = await FormSubmission.update(req.params.id, {
      status: "APPROVED",
      interviewState: "ACCEPTED_WAITING_VERIFY",
      reviewedBy: req.user.discordUsername || "Admin",
      reviewedAt: new Date(),
    });

    if (!updated) {
      return res.status(404).json({ error: "Başvuru kaydı bulunamadı." });
    }

    // Send DM to candidate
    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { sendInterviewAcceptedDM, extractTargetDiscordId } = require("../../bot/services/formInterviewService");
      const client = getDiscordClient();
      if (client && client.isReady()) {
        const discordId = extractTargetDiscordId(updated);
        if (discordId) await sendInterviewAcceptedDM(client, discordId, updated._id);
      }
    } catch (dmErr) {
      console.error("[accept-interview] DM error:", dmErr.message);
    }

    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Mülakatı Reddet ───────────────────────────────────────────────────
router.post("/api/admin/form-submissions/:id/reject-interview", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { reason } = req.body;
    const FormSubmission = require("../../models/FormSubmission");
    const updated = await FormSubmission.update(req.params.id, {
      status: "REJECTED",
      interviewState: "REJECTED",
      reviewNote: reason || "Belirtilmeyen Neden",
      reviewedBy: req.user.discordUsername || "Admin",
      reviewedAt: new Date(),
    });

    if (!updated) {
      return res.status(404).json({ error: "Başvuru kaydı bulunamadı." });
    }

    // Send DM to candidate
    try {
      const { getDiscordClient } = require("../../bot/discordClient");
      const { sendInterviewRejectedDM, extractTargetDiscordId } = require("../../bot/services/formInterviewService");
      const client = getDiscordClient();
      if (client && client.isReady()) {
        const discordId = extractTargetDiscordId(updated);
        if (discordId) await sendInterviewRejectedDM(client, discordId, updated._id, reason);
      }
    } catch (dmErr) {
      console.error("[reject-interview] DM error:", dmErr.message);
    }

    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: panel form gönder ────────────────────────────────────────────────
router.post("/api/admin/submit-form", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { formType, formData } = req.body;
  if (!formType || !formData) {
    return res.status(400).json({ error: "Form tipi ve form verileri gerekli." });
  }

  const { getDiscordClient } = require("../../bot/discordClient");
  const client = getDiscordClient();
  if (!client?.isReady()) {
    return res.status(503).json({ error: "Discord botu hazır değil, lütfen daha sonra tekrar deneyin." });
  }

  const { EmbedBuilder } = require("discord.js");
  const { chatWithAI } = require("../../bot/services/aiService");
  const { sendAdminLog } = require("../../bot/services/staffAutomation");
  const { logToModChannel } = require("../../bot/services/modChannelService");

  try {
    const userId = req.user.discordId;
    const username = req.user.discordUsername;
    const avatar = req.user.discordAvatar || "https://cdn.discordapp.com/embed/avatars/0.png";

    if (formType === "leave") {
      const { reason, duration } = formData;
      if (!reason || !duration) {
        return res.status(400).json({ error: "İzin sebebi ve izin süresi gerekli." });
      }

      const aiPrompt = `Bir moderatör izin talebinde bulundu.\nSebep: ${reason}\nSüre: ${duration} gün.\nBu talebi onayla veya reddet. Eğer kabul ediyorsan sadece "KABUL" yaz, reddediyorsan "RED" yaz ve yanına kısa bir sebep ekle.`;
      const aiResponse = await chatWithAI(aiPrompt, "Sen yetkili bir IK yöneticisisin.");
      
      const embed = new EmbedBuilder()
        .setTitle('📝 İzin Talebi')
        .addFields(
          { name: 'Kullanıcı', value: `<@${userId}>` },
          { name: 'Sebep', value: reason },
          { name: 'Süre', value: `${duration} Gün` },
          { name: 'Yapay Zeka Kararı', value: aiResponse }
        )
        .setTimestamp();
        
      const approved = aiResponse.toUpperCase().includes('KABUL');
      if (approved) {
        embed.setColor(0x2ECC71);
      } else {
        embed.setColor(0xE74C3C);
      }
      
      await sendAdminLog(client, 'ANA_SUNUCU', embed);
      try {
        await logToModChannel(client, userId, embed).catch(() => {});
      } catch (_) {}

      return res.json({
        success: true,
        approved,
        message: approved ? "İzin talebiniz onaylandı." : `İzin talebiniz reddedildi. Sebep: ${aiResponse}`,
        aiResponse
      });
    }

    else if (formType === "suggestion") {
      const { suggestion } = formData;
      if (!suggestion) {
        return res.status(400).json({ error: "Öneri metni boş olamaz." });
      }

      const embed = new EmbedBuilder()
        .setTitle('💡 Yeni Bir Öneri Var')
        .setDescription(suggestion)
        .setAuthor({ name: username, iconURL: avatar })
        .setColor(0x3498DB)
        .setTimestamp();
        
      await sendAdminLog(client, 'SUGGESTION_LOG', embed);
      try {
        await logToModChannel(client, userId, embed).catch(() => {});
      } catch (_) {}

      return res.json({ success: true, message: "Öneriniz başarıyla iletildi." });
    }

    else if (formType === "resign") {
      const { reason, confirm } = formData;
      if (!reason || !confirm) {
        return res.status(400).json({ error: "İstifa sebebi ve onay kelimesi gerekli." });
      }
      if (confirm.toLowerCase() !== 'evet') {
        return res.status(400).json({ error: "İşlemi onaylamak için 'Evet' yazmalısınız." });
      }

      const embed = new EmbedBuilder()
        .setTitle('🚪 İstifa Bildirimi')
        .addFields(
          { name: 'Kullanıcı', value: `<@${userId}>` },
          { name: 'Sebep', value: reason }
        )
        .setColor(0x992D22)
        .setTimestamp();
        
      await sendAdminLog(client, 'ANA_SUNUCU', embed);
      try {
        await logToModChannel(client, userId, embed).catch(() => {});
      } catch (_) {}
      
      try {
        const { ADMIN_GUILD_ID } = require('../../bot/services/staffAutomation');
        const guild = client.guilds.cache.get(ADMIN_GUILD_ID);
        if (guild) {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member) await member.kick('Kendi isteğiyle istifa etti.');
        }
      } catch (e) {
        console.error('Kick failed:', e.message);
      }

      return res.json({ success: true, message: "İstifanız başarıyla raporlandı." });
    }

    else if (formType === "modaction") {
      const { user, action, reason } = formData;
      if (!user || !action || !reason) {
        return res.status(400).json({ error: "Kullanıcı, işlem ve sebep alanları zorunludur." });
      }

      const embed = new EmbedBuilder()
        .setTitle('⚖️ Moderatör İşlemi Raporlandı')
        .addFields(
          { name: 'Yetkili', value: `<@${userId}>`, inline: true },
          { name: 'İşlem Gören', value: user, inline: true },
          { name: 'İşlem Tipi', value: action, inline: true },
          { name: 'Sebep / Kanıt', value: reason }
        )
        .setColor(0x9B59B6)
        .setTimestamp();
        
      await sendAdminLog(client, 'CEZA_LOG', embed);
      try {
        await logToModChannel(client, userId, embed).catch(() => {});
      } catch (_) {}

      return res.json({ success: true, message: "Moderatör işlemi başarıyla raporlandı." });
    }

    else if (formType === "ban_report") {
      const { isim, kisi, kisiId, sebep, kanit } = formData;
      if (!isim || !kisi || !kisiId || !sebep || !kanit) {
        return res.status(400).json({ error: "Tüm alanların doldurulması zorunludur." });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔨 Yeni Ban Raporu')
        .addFields(
          { name: 'Raporlayan İsim', value: isim, inline: true },
          { name: 'Raporlayan (Discord)', value: `<@${userId}>`, inline: true },
          { name: 'Banlanacak Kişi', value: kisi, inline: true },
          { name: 'Banlanacak Kişinin ID', value: kisiId, inline: true },
          { name: 'Sebep', value: sebep },
          { name: 'Kanıt', value: kanit }
        )
        .setColor(0xE74C3C)
        .setTimestamp();
      
      const channel = await client.channels.fetch('1466946902154018967').catch(() => null);
      if (channel) await channel.send({ embeds: [embed] });
      try {
        await logToModChannel(client, userId, embed).catch(() => {});
      } catch (_) {}

      return res.json({ success: true, message: "Ban raporu başarıyla gönderildi." });
    }

    else if (formType === "mute_report") {
      const { isim, rutbe, kisi, ihlal } = formData;
      if (!isim || !rutbe || !kisi || !ihlal) {
        return res.status(400).json({ error: "Tüm alanların doldurulması zorunludur." });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔇 Yeni Mute Raporu')
        .addFields(
          { name: 'Raporlayan İsim', value: isim, inline: true },
          { name: 'Rütbe', value: rutbe, inline: true },
          { name: 'Raporlayan (Discord)', value: `<@${userId}>`, inline: true },
          { name: 'Mute Atılan Kişi', value: kisi, inline: true },
          { name: 'Kaçıncı İhlali', value: ihlal, inline: true }
        )
        .setColor(0xF39C12)
        .setTimestamp();
      
      const channel = await client.channels.fetch('1466946762190229589').catch(() => null);
      if (channel) await channel.send({ embeds: [embed] });
      try {
        await logToModChannel(client, userId, embed).catch(() => {});
      } catch (_) {}

      return res.json({ success: true, message: "Mute raporu başarıyla gönderildi." });
    }

    else if (formType === "mod_complain") {
      const { mod, sebep, kanit } = formData;
      if (!mod || !sebep || !kanit) {
        return res.status(400).json({ error: "Tüm alanların doldurulması zorunludur." });
      }

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Yeni Mod Şikayeti')
        .addFields(
          { name: 'Şikayet Eden (Discord)', value: `<@${userId}>`, inline: true },
          { name: 'Şikayet Edilen Mod', value: mod, inline: true },
          { name: 'Sebep', value: sebep },
          { name: 'Kanıt', value: kanit }
        )
        .setColor(0x992D22)
        .setTimestamp();
      
      const channel = await client.channels.fetch('1466946497206816973').catch(() => null);
      if (channel) await channel.send({ embeds: [embed] });

      return res.json({ success: true, message: "Şikayetiniz gizlilik içinde yönetime iletildi." });
    }

    else {
      return res.status(400).json({ error: "Geçersiz form tipi." });
    }

  } catch (err) {
    console.error("[SubmitForm API Error]:", err);
    res.status(500).json({ error: "Form gönderilirken sunucuda bir hata oluştu: " + err.message });
  }
});

// ── Moderatör puan sıralaması ────────────────────────────────────────────────
router.get("/api/staff/ratings", async (req, res) => {  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });

  try {
    const { tickets: ticketStore, users: userStore } = require("../../models/Store");

    // Değerlendirme yapılmış tüm ticketları bul
    const ratedTickets = ticketStore.find({ rated: true });

    // Moderatör bazında istatistik topla
    const staffMap = new Map();

    for (const ticket of ratedTickets) {
      const staffId = ticket.claimedBy || ticket.closedBy;
      if (!staffId) continue;

      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          staffId,
          totalScore: 0,
          count: 0,
          scores: [],
        });
      }

      const entry = staffMap.get(staffId);
      entry.totalScore += ticket.ratingScore || 0;
      entry.count += 1;
      entry.scores.push(ticket.ratingScore || 0);
    }

    // Kullanıcı bilgilerini ekle ve sırala
    const result = [];
    for (const [staffId, data] of staffMap.entries()) {
      const staffUser = userStore.findOne({ discordId: staffId });
      const avg = data.count > 0 ? (data.totalScore / data.count) : 0;

      result.push({
        staffId,
        username: staffUser ? staffUser.discordUsername : "Bilinmiyor",
        avatar: staffUser ? staffUser.discordAvatar : "https://cdn.discordapp.com/embed/avatars/0.png",
        averageScore: Math.round(avg * 10) / 10,
        totalRatings: data.count,
        totalScore: data.totalScore,
        // Puan dağılımı (1-5 kaç tane)
        distribution: [1, 2, 3, 4, 5].map(s => data.scores.filter(x => x === s).length),
      });
    }

    // Ortalama puana göre azalan sırala
    result.sort((a, b) => b.averageScore - a.averageScore || b.totalRatings - a.totalRatings);

    res.json({ success: true, staff: result });
  } catch (err) {
    console.error("[/api/staff/ratings]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Ekonomi: herkese açık profil bakiyesi ───────────────────────────────────
router.get("/api/economy/public/:discordId", async (req, res) => {
  try {
    const targetId = String(req.params.discordId);
    let eco = await Economy.findOne({ userId: targetId });
    if (!eco) eco = { balance: 0, inventory: [], profileEffect: null, profileFrame: null, profileBadges: [], totalEarned: 0, totalSpent: 0 };
    // Herkese göster ama hassas bilgileri sınırla
    res.json({
      success: true,
      balance: eco.balance || 0,
      inventory: (eco.inventory || []),
      profileEffect: eco.profileEffect || null,
      profileFrame: eco.profileFrame || null,
      profileBadges: eco.profileBadges || [],
      totalEarned: eco.totalEarned || 0,
      totalSpent: eco.totalSpent || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Ekonomi: bakiye sorgula ──────────────────────────────────────────────────
router.get("/api/economy/balance", async (req, res) => {
  if (!requireLogin(req, res)) return;
  try {
    let eco = await Economy.findOne({ userId: req.user.discordId });
    if (!eco) eco = { balance: 0, inventory: [], profileEffect: null, profileFrame: null, profileBadges: [], totalEarned: 0, totalSpent: 0 };
    res.json({
      success: true,
      balance: eco.balance || 0,
      inventory: eco.inventory || [],
      profileEffect: eco.profileEffect || null,
      profileFrame: eco.profileFrame || null,
      profileBadges: eco.profileBadges || [],
      totalEarned: eco.totalEarned || 0,
      totalSpent: eco.totalSpent || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Mağaza: ürün listesi ─────────────────────────────────────────────────────
router.get("/api/shop/items", (req, res) => {
  res.json({ success: true, items: SHOP_ITEMS });
});

// ── Mağaza: satın al ─────────────────────────────────────────────────────────
router.post("/api/shop/buy", async (req, res) => {
  if (!requireLogin(req, res)) return;

  const { itemId } = req.body;
  const item = findItem(itemId);
  if (!item) return res.status(404).json({ error: "Ürün bulunamadı." });

  try {
    let eco = await Economy.findOne({ userId: req.user.discordId });
    if (!eco) {
      eco = new Economy({ userId: req.user.discordId });
      await eco.save();
    }

    const balance = eco.balance || 0;
    if (balance < item.price) {
      return res.status(400).json({
        error: `Yetersiz bakiye. Gerekli: ${item.price.toLocaleString("tr-TR")} coin, Mevcut: ${balance.toLocaleString("tr-TR")} coin.`,
      });
    }

    const inventory = eco.inventory || [];
    if (inventory.some(i => i.itemId === itemId)) {
      return res.status(400).json({ error: "Bu ürüne zaten sahipsiniz." });
    }

    eco.balance = balance - item.price;
    eco.totalSpent = (eco.totalSpent || 0) + item.price;
    eco.inventory = [...inventory, {
      itemId: item.id,
      name: item.name,
      icon: item.icon,
      type: item.type,
      acquiredAt: new Date(),
    }];

    if (item.type === "effect" && !eco.profileEffect) eco.profileEffect = item.id;
    if (item.type === "frame"  && !eco.profileFrame)  eco.profileFrame  = item.id;
    if (item.type === "badge") {
      eco.profileBadges = [...(eco.profileBadges || []), item.id];
    }
    if (item.type === "color") {
      const user = await User.findOne({ discordId: req.user.discordId });
      if (user) { user.profileColor = item.value; await user.save(); }
    }

    await eco.save();
    saveStoreNow();

    try {
      const { addNotification } = require("../../utils/notification");
      await addNotification(req.user.discordId, {
        title: "🛍️ Satın Alım Başarılı",
        message: `${item.icon} ${item.name} satın alındı! Envanterinize eklendi.`,
        icon: "🛍️"
      });
    } catch (_) {}

    res.json({ success: true, message: `${item.icon} ${item.name} satın alındı!`, newBalance: eco.balance });
  } catch (err) {
    console.error("[shop/buy]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Profil: aktif efekt/çerçeve değiştir ────────────────────────────────────
router.post("/api/profile/equip", async (req, res) => {
  if (!requireLogin(req, res)) return;

  const { itemId } = req.body;
  const item = findItem(itemId);
  if (!item) return res.status(404).json({ error: "Ürün bulunamadı." });

  try {
    const eco = await Economy.findOne({ userId: req.user.discordId });
    if (!eco) return res.status(400).json({ error: "Envanter bulunamadı." });

    const inventory = eco.inventory || [];
    if (!inventory.some(i => i.itemId === itemId)) {
      return res.status(400).json({ error: "Bu ürüne sahip değilsiniz." });
    }

    if (item.type === "effect") eco.profileEffect = itemId;
    if (item.type === "frame")  eco.profileFrame  = itemId;

    await eco.save();
    saveStoreNow();
    res.json({ success: true, message: `${item.icon} ${item.name} aktif edildi.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Webhook Proxy ────────────────────────────────────────────────────────────
// Roblox → bu endpoint → Discord webhook
// Roblox'tan: POST /api/webhook/proxy
// Body: { webhookUrl, content, embeds, username, avatarUrl }
// Güvenlik: zorunlu secret header kontrolü

router.post("/api/webhook/proxy", async (req, res) => {
  // CORS — sadece site tabanlı webhook proxy isteklerine izin ver
  res.setHeader("Access-Control-Allow-Origin", BASE_URL || "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Webhook-Secret");

  const { webhookUrl, content, embeds, username, avatar_url, tts, allowed_mentions } = req.body;

  // webhookUrl zorunlu
  if (!webhookUrl) {
    return res.status(400).json({ success: false, error: "webhookUrl gerekli." });
  }

  // Sadece Discord webhook URL'lerine izin ver
  const discordWebhookPattern = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/.+/;
  if (!discordWebhookPattern.test(webhookUrl)) {
    return res.status(400).json({ success: false, error: "Sadece Discord webhook URL'leri desteklenir." });
  }

  // İçerik kontrolü
  if (!content && (!embeds || !embeds.length)) {
    return res.status(400).json({ success: false, error: "content veya embeds gerekli." });
  }

  // Webhook secret kontrolü
  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ success: false, error: "Sunucu yapılandırması eksik: WEBHOOK_SECRET tanımlı değil." });
  }
  const secretHeader = String(req.headers["x-webhook-secret"] || "").trim();
  if (secretHeader !== WEBHOOK_SECRET) {
    return res.status(403).json({ success: false, error: "Geçersiz webhook secret header." });
  }

  const origin = req.headers.origin;
  if (origin && origin !== BASE_URL) {
    return res.status(403).json({ success: false, error: "Geçersiz kaynak geldi." });
  }

  // Payload oluştur
  const payload = {};
  if (content)          payload.content          = String(content).slice(0, 2000);
  if (username)         payload.username         = String(username).slice(0, 80);
  if (avatar_url)       payload.avatar_url       = String(avatar_url);
  if (tts)              payload.tts              = Boolean(tts);
  if (allowed_mentions && typeof allowed_mentions === "object") {
    payload.allowed_mentions = {
      parse: Array.isArray(allowed_mentions.parse)
        ? allowed_mentions.parse.filter((p) => ["roles", "users", "everyone"].includes(p)).slice(0, 3)
        : [],
      users: Array.isArray(allowed_mentions.users) ? allowed_mentions.users.slice(0, 10) : [],
      roles: Array.isArray(allowed_mentions.roles) ? allowed_mentions.roles.slice(0, 10) : [],
    };
  }
  if (embeds && Array.isArray(embeds)) {
    payload.embeds = embeds.slice(0, 10).map((embed) => {
      const safeEmbed = {};
      if (embed.title) safeEmbed.title = String(embed.title).slice(0, 256);
      if (embed.description) safeEmbed.description = String(embed.description).slice(0, 4096);
      if (embed.color) safeEmbed.color = Number(embed.color) || undefined;
      if (embed.url && /^https?:\/\//i.test(embed.url)) safeEmbed.url = String(embed.url).slice(0, 2048);
      if (embed.fields && Array.isArray(embed.fields)) {
        safeEmbed.fields = embed.fields.slice(0, 10).map((field) => ({
          name: String(field.name || "").slice(0, 256),
          value: String(field.value || "").slice(0, 1024),
          inline: Boolean(field.inline),
        }));
      }
      if (embed.footer && embed.footer.text) {
        safeEmbed.footer = { text: String(embed.footer.text).slice(0, 2048) };
      }
      if (embed.image && typeof embed.image.url === "string" && /^https?:\/\//i.test(embed.image.url)) {
        safeEmbed.image = { url: String(embed.image.url) };
      }
      if (embed.thumbnail && typeof embed.thumbnail.url === "string" && /^https?:\/\//i.test(embed.thumbnail.url)) {
        safeEmbed.thumbnail = { url: String(embed.thumbnail.url) };
      }
      if (embed.author && typeof embed.author.name === "string") {
        safeEmbed.author = { name: String(embed.author.name).slice(0, 256) };
      }
      return safeEmbed;
    });
  }

  try {
    const https = require("https");
    const url = new URL(webhookUrl);
    const body = JSON.stringify(payload);

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "SentaraWebhookProxy/1.0",
        },
      };

      const req2 = https.request(options, (r) => {
        let data = "";
        r.on("data", chunk => data += chunk);
        r.on("end", () => resolve({ status: r.statusCode, body: data }));
      });

      req2.on("error", reject);
      req2.setTimeout(5000, () => { req2.destroy(); reject(new Error("Timeout")); });
      req2.write(body);
      req2.end();
    });

    // Discord 204 = başarılı (içerik yok), 200 = başarılı (içerik var)
    if (result.status === 204 || result.status === 200) {
      return res.status(200).json({ success: true, message: "Webhook gönderildi." });
    }

    // Rate limit
    if (result.status === 429) {
      let retryAfter = 1;
      try { retryAfter = JSON.parse(result.body).retry_after || 1; } catch (_) {}
      return res.status(429).json({ success: false, error: "Rate limit. Tekrar dene.", retry_after: retryAfter });
    }

    return res.status(result.status).json({
      success: false,
      error: `Discord hata kodu: ${result.status}`,
      discord_response: result.body,
    });

  } catch (err) {
    console.error("[webhook-proxy]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Roblox Arkadaş İsteği Doğrulama API'leri ─────────────────────────────────
router.post("/api/auth/roblox/friend-request", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });

  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Roblox kullanıcı adı gerekli." });

  try {
    const noblox = require("noblox.js");
    const robloxId = await noblox.getIdFromUsername(username.trim());
    if (!robloxId) {
      return res.status(400).json({ error: "Roblox kullanıcı adı bulunamadı." });
    }

    const { getFriendJar, getOrFetchFriendBotId } = require("../../bot/services/robloxGroupManager");
    const friendJar = getFriendJar();

    // Arkadaşlık isteği gönder
    try {
      await noblox.sendFriendRequest({ userId: robloxId, jar: friendJar });
    } catch (err) {
      const errMsg = typeof err === "string" ? err : (err?.message || JSON.stringify(err || ""));
      const lowerMsg = errMsg.toLowerCase();
      const isAlreadyFriend =
        lowerMsg.includes("already a friend") ||
        lowerMsg.includes("already friends") ||
        lowerMsg.includes("are already friends") ||
        lowerMsg.includes("cannot send friend request") ||
        lowerMsg.includes("already pending") ||
        lowerMsg.includes("zaten var") ||
        lowerMsg.includes('"code":5') ||
        lowerMsg.includes('"code": 5') ||
        err?.errors?.[0]?.code === 5;

      if (!isAlreadyFriend) {
        console.error("sendFriendRequest error:", err);
        return res.status(400).json({
          error: `Arkadaşlık isteği gönderilemedi. Hata: ${errMsg}`
        });
      }
    }

    const botRobloxId = await getOrFetchFriendBotId();
    const botProfileUrl = botRobloxId ? `https://www.roblox.com/users/${botRobloxId}/profile` : "https://www.roblox.com";

    res.json({
      success: true,
      robloxId,
      botProfileUrl
    });
  } catch (err) {
    console.error("API Friend Request error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/auth/roblox/friend-verify", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });

  const { robloxId, username } = req.body;
  if (!robloxId || !username) {
    return res.status(400).json({ error: "Eksik parametre." });
  }

  try {
    const { getFriendJar, getOrFetchFriendBotId } = require("../../bot/services/robloxGroupManager");
    const botRobloxId = await getOrFetchFriendBotId();
    const friendJar = getFriendJar();
    if (!botRobloxId || !friendJar) {
      return res.status(503).json({ error: "Botun Roblox bağlantısı aktif değil. Daha sonra tekrar deneyin." });
    }

    const noblox = require("noblox.js");
    const friends = await noblox.getFriends({ userId: botRobloxId, jar: friendJar });
    const isFriend = friends && friends.data && friends.data.some(f => String(f.id) === String(robloxId));

    if (!isFriend) {
      return res.status(400).json({ error: "Arkadaşlık isteği henüz kabul edilmemiş." });
    }

    // Veritabanına kaydet
    const User = require("../../models/User");
    const { saveStoreNow } = require("../../models/Store");
    let dbUser = await User.findById(req.user._id);
    if (!dbUser && req.user.discordId) {
      dbUser = await User.findOne({ discordId: String(req.user.discordId) });
    }
    if (!dbUser) {
      return res.status(404).json({ error: "Kullanıcı veritabanında bulunamadı." });
    }

    dbUser.robloxId = String(robloxId);
    dbUser.robloxUsername = username;
    dbUser.isAuthorized = true;
    dbUser.verificationStatus = {
      ...(dbUser.verificationStatus || {}),
      robloxVerifiedAt: new Date().toISOString(),
      source: 'friend-verify'
    };
    await dbUser.save();
    saveStoreNow();

    // Rolleri senkronize et
    const { getDiscordClient } = require("../../bot/discordClient");
    const { syncMemberRoles } = require("../../bot/services/roleSyncService");
    const { TARGET_GUILD_ID } = require("../../config");
    
    const client = getDiscordClient();
    if (client && client.isReady()) {
      try {
        const guild = await client.guilds.fetch(TARGET_GUILD_ID);
        const member = await guild.members.fetch(dbUser.discordId);
        await syncMemberRoles(guild, member, parseInt(robloxId, 10), username);
      } catch (syncErr) {
        console.warn("API Friend Verify role sync failed:", syncErr.message);
      }
    }

    // Arkadaşlıktan çıkar
    const { unfriendUser } = require("../../bot/services/robloxGroupManager");
    await unfriendUser(parseInt(robloxId, 10));

    try {
      const { syncRoleConnectionForUser } = require("../services/discordRoleConnectionService");
      const accessToken = dbUser.discordAccessToken || req.session?.discordAccessToken;
      const applicationId = process.env.DISCORD_ROLE_CONNECTION_APPLICATION_ID;
      if (applicationId && accessToken) {
        await syncRoleConnectionForUser(dbUser, accessToken, applicationId, {});
      }
    } catch (syncErr) {
      console.warn("[api] Discord role connection sync failed after verification:", syncErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("API Friend Verify error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/avukat/ai", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { discordId } = req.body;
  if (!discordId) return res.status(400).json({ error: "Discord ID girilmelidir." });

  try {
    const { startAvukatInterview } = require("../../bot/services/avukatService");
    const { getDiscordClient } = require("../../bot/discordClient");
    const client = getDiscordClient();
    if (!client || !client.isReady()) {
      return res.status(503).json({ error: "Discord botu aktif değil." });
    }

    // Mock an interaction
    let responseContent = "";
    const mockInteraction = {
      client,
      user: { id: req.user.discordId },
      deferReply: async () => {},
      editReply: async (payload) => {
        responseContent = payload.content || (payload.embeds && payload.embeds[0]?.data?.description) || JSON.stringify(payload);
      }
    };

    await startAvukatInterview(mockInteraction, discordId);
    return res.json({ success: true, message: responseContent || "AI Mülakatı başlatıldı." });
  } catch (err) {
    console.error("AI Avukat Alım Hatası:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/api/avukat/direct", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { discordId } = req.body;
  if (!discordId) return res.status(400).json({ error: "Discord ID girilmelidir." });

  try {
    const { hireAvukatDirect } = require("../../bot/services/avukatService");
    const { getDiscordClient } = require("../../bot/discordClient");
    const client = getDiscordClient();
    if (!client || !client.isReady()) {
      return res.status(503).json({ error: "Discord botu aktif değil." });
    }

    // Mock an interaction
    let responseContent = "";
    const mockInteraction = {
      client,
      user: { id: req.user.discordId },
      deferReply: async () => {},
      editReply: async (payload) => {
        responseContent = payload.content || (payload.embeds && payload.embeds[0]?.data?.description) || JSON.stringify(payload);
      }
    };

    await hireAvukatDirect(mockInteraction, discordId);
    return res.json({ success: true, message: responseContent || "Sınavsız avukat alımı gerçekleştirildi." });
  } catch (err) {
    console.error("Sınavsız Avukat Alım Hatası:", err);
    return res.status(500).json({ error: err.message });
  }
});


// ─── Group Administration APIs ──────────────────────────────────────────────
const { groupAdmins, rankMetadata } = require("../../models/Store");
const { ROBLOX_GROUPS } = require("../../bot/services/robloxGroupManager");

// List of TMT Group IDs specifically for filtering/verification
const TMT_GROUP_IDS = new Set([
  "35212138", // TMT Akademi
  "33709461", // TMT Askeri İnzibat
  "35430592", // TMT Birimler Bölükler
  "5415548",  // TMT Deniz Kuvvetleri Komutanlığı
  "35212127", // TMT Genel Branş Komutanlığı
  "33709391", // TMT Hava Kuvvetleri
  "35432150", // TMT Hudut Müfettişleri
  "12008462", // TMT Jandarma Genel Komutanlığı
  "33714381", // TMT Kara Kuvvetleri Komutanlığı
  "35528574", // TMT Ministry of Foreign Affairs
  "33708598", // TMT Özel Kuvvetler Komutanlığı
  "11517908", // TMT Turkish Armed Forces
  "35528598", // TMT RAIDERS
  "35528556", // TMT Sürücü Okulu
]);

function requireGroupAdmin(req, res) {
  if (!req.user) {
    res.status(401).json({ error: "Giriş yapmanız gerekli." });
    return false;
  }
  const isOwner = req.user.discordUsername.toLowerCase() === "ekonqtx";
  const isAdmin = groupAdmins.findOne({ username: req.user.discordUsername }) || groupAdmins.findOne({ username: req.user.discordUsername.toLowerCase() });
  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Bu işlem için grup yetkilisi olmanız gerekmektedir." });
    return false;
  }
  return true;
}

function requireGroupOwner(req, res) {
  if (!req.user) {
    res.status(401).json({ error: "Giriş yapmanız gerekli." });
    return false;
  }
  if (req.user.discordUsername.toLowerCase() !== "ekonqtx") {
    res.status(403).json({ error: "Bu işlem için grup sahibi (ekonqtx) olmanız gerekmektedir." });
    return false;
  }
  return true;
}

// Roblox API helper with CSRF and cookie handling
async function robloxApiRequest(url, method, data = null) {
  const cookie = process.env.TMTCOOKIE;
  if (!cookie) {
    throw new Error("Roblox TMTCOOKIE ortam değişkeni ayarlanmamış.");
  }
  const formattedCookie = cookie.includes(".ROBLOSECURITY=") ? cookie : `.ROBLOSECURITY=${cookie};`;

  // 1. Get X-CSRF-TOKEN
  let csrfToken = null;
  try {
    await axios.post("https://auth.roblox.com/v2/logout", {}, {
      headers: { Cookie: formattedCookie }
    });
  } catch (err) {
    csrfToken = err.response?.headers?.["x-csrf-token"];
  }

  if (!csrfToken) {
    throw new Error("Roblox CSRF token alınamadı.");
  }

  // 2. Perform Request with Retry Logic
  let response;
  let retries = 3;
  while (retries > 0) {
    try {
      response = await axios({
        url,
        method,
        data,
        headers: {
          Cookie: formattedCookie,
          "X-CSRF-TOKEN": csrfToken,
          "Content-Type": "application/json"
        }
      });
      break;
    } catch (err) {
      if (err.response && err.response.status === 429 && retries > 1) {
        retries--;
        console.warn("Roblox API Rate Limit (429). Bekleniyor... 5 saniye");
        await new Promise(r => setTimeout(r, 5000));
      } else {
        throw err;
      }
    }
  }

  return response.data;
}

// Endpoint: Get Owner / Group Admins config
router.get("/api/group-admin/config", (req, res) => {
  if (!requireGroupAdmin(req, res)) return;
  const admins = groupAdmins.find({});
  res.json({
    success: true,
    owner: "ekonqtx",
    admins: admins.map(a => ({ _id: a._id, username: a.username, createdAt: a.createdAt }))
  });
});

// Endpoint: Add Group Admin
router.post("/api/group-admin/admins", async (req, res) => {
  if (!requireGroupOwner(req, res)) return;
  const username = (req.body.username || "").trim().toLowerCase();
  if (!username) {
    return res.status(400).json({ error: "Geçerli bir kullanıcı adı girilmelidir." });
  }

  const existing = groupAdmins.findOne({ username });
  if (existing) {
    return res.status(400).json({ error: "Bu kullanıcı zaten yetkili." });
  }

  const created = groupAdmins.create({ username, createdAt: new Date() });
  await saveStoreNow();
  
  logger.log("[GRUP YÖNETİCİSİ] " + (req.user.discordUsername || req.user.username) + ", " + username + " kullanıcısını yönetici olarak ekledi.", "admin");
  
  res.json({ success: true, admin: created });
});

// Endpoint: Remove Group Admin
router.delete("/api/group-admin/admins/:username", async (req, res) => {
  if (!requireGroupOwner(req, res)) return;
  const username = String(req.params.username).trim().toLowerCase();
  
  const found = groupAdmins.findOne({ username });
  if (!found) {
    return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  }

  // Remove the record by deleting from Map and persisting
  const { data } = require("../../models/Store").groupAdmins;
  data.delete(found._id);
  
  // Also delete from MongoDB if active
  const db = require("../../models/db");
  if (db.isMongoActive()) {
    const Record = db.getRecord();
    await Record.deleteOne({ collection: "groupAdmins", _storeId: found._id }).catch(() => {});
  }
  
  await saveStoreNow();
  
  logger.log("[GRUP YÖNETİCİSİ] " + (req.user.discordUsername || req.user.username) + ", " + username + " kullanıcısının yönetici yetkisini kaldırdı.", "admin");
  
  res.json({ success: true, message: "Kullanıcı yetkisi kaldırıldı." });
});

// Endpoint: List TMT groups
router.get("/api/group-admin/groups", (req, res) => {
  if (!requireGroupAdmin(req, res)) return;
  
  // Build groups list matching TMT groups
  const tmtGroupsList = Object.entries(ROBLOX_GROUPS)
    .filter(([id]) => TMT_GROUP_IDS.has(id))
    .map(([id, name]) => ({ id, name }));

  res.json({ success: true, groups: tmtGroupsList });
});

// Endpoint: Fetch roles for a group
router.get("/api/group-admin/groups/:groupId/roles", async (req, res) => {
  if (!requireGroupAdmin(req, res)) return;
  const groupId = String(req.params.groupId);
  if (!TMT_GROUP_IDS.has(groupId)) {
    return res.status(403).json({ error: "Bu grup üzerinde yetkiniz yok veya TMT grubu değil." });
  }

  try {
    const [rolesResponse, groupResponse] = await Promise.all([
      axios.get(`https://groups.roblox.com/v1/groups/${groupId}/roles`),
      axios.get(`https://groups.roblox.com/v1/groups/${groupId}`).catch(() => ({ data: { description: "" } }))
    ]);
    
    const robloxRoles = rolesResponse.data.roles || [];
    const description = groupResponse.data.description || "";

    // Map each role and load local color metadata
    const roles = robloxRoles.map(role => {
      const meta = rankMetadata.findOne({ groupId, roleId: String(role.id) });
      return {
        id: String(role.id),
        name: role.name,
        rank: role.rank,
        description: role.description || "",
        color: meta ? meta.color : "#7c6af7"
      };
    });

    res.json({ success: true, roles, description });
  } catch (err) {
    console.error("Fetch group roles error:", err.message);
    res.status(500).json({ error: "Roblox grubundan rütbeler çekilemedi: " + err.message });
  }
});

// Endpoint: Update description
router.patch("/api/group-admin/groups/:groupId/description", async (req, res) => {
  if (!requireGroupAdmin(req, res)) return;
  const groupId = String(req.params.groupId);
  if (!TMT_GROUP_IDS.has(groupId)) {
    return res.status(403).json({ error: "Bu grup üzerinde yetkiniz yok veya TMT grubu değil." });
  }

  const { description } = req.body;
  if (description === undefined) {
    return res.status(400).json({ error: "description parametresi gereklidir." });
  }

  try {
    await robloxApiRequest(
      `https://groups.roblox.com/v1/groups/${groupId}/description`,
      "PATCH",
      { description }
    );
    
    logger.log(`[GRUP YÖNETİCİSİ] ${req.user.discordUsername || req.user.username}, ${groupId} ID'li grubun açıklamasını güncelledi.`, "admin");
    
    res.json({ success: true, message: "Grup açıklaması güncellendi." });
  } catch (err) {
    console.error("Update description error:", err.response?.data || err.message);
    res.status(500).json({ error: "Roblox grup açıklaması güncellenemedi: " + (err.response?.data?.errors?.[0]?.message || err.message) });
  }
});

// Endpoint: Save role updates (ranks, names, colors)
router.patch("/api/group-admin/groups/:groupId/roles", async (req, res) => {
  if (!requireGroupAdmin(req, res)) return;
  const groupId = String(req.params.groupId);
  if (!TMT_GROUP_IDS.has(groupId)) {
    return res.status(403).json({ error: "Bu grup üzerinde yetkiniz yok veya TMT grubu değil." });
  }

  const { roles } = req.body; // Array of { id, name, rank, color }
  if (!Array.isArray(roles)) {
    return res.status(400).json({ error: "roles dizisi gereklidir." });
  }

  try {
    // 1. Fetch current roles from Roblox to calculate current state and check constraints
    const response = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/roles`);
    const currentRobloxRoles = response.data.roles || [];
    
    // 2. Identify the modifications and update colors locally
    const nameOnlyUpdates = [];
    const rankUpdates = [];
    const newRolesToCreate = [];
    for (const item of roles) {
      const roleId = String(item.id);
      const name = item.name;
      const rank = parseInt(item.rank, 10);
      const color = item.color || "#7c6af7";

      if (roleId.startsWith("new_")) {
        newRolesToCreate.push({ name, rank, color, roleId });
        continue;
      }

      // Find current state
      const current = currentRobloxRoles.find(r => String(r.id) === roleId);
      if (!current) continue;

      // Restrict Guest (rank 0) and Owner (rank 255) modifications on Roblox
      const isSystemRole = current.rank === 0 || current.rank === 255 || rank === 0 || rank === 255;
      
      // Save color locally for all roles
      let meta = rankMetadata.findOne({ groupId, roleId });
      if (!meta) {
        rankMetadata.create({ groupId, roleId, color, createdAt: new Date() });
      } else if (meta.color !== color) {
        meta.color = color;
        meta.updatedAt = new Date();
        await meta.save();
      }

      // Identify type of update
      if (isSystemRole) {
        // Cannot modify rank of system roles (Guest/Owner)
        if (current.name !== name) {
          nameOnlyUpdates.push({
            id: roleId,
            name: name,
            description: current.description || ""
          });
        }
      } else {
        if (current.name !== name && current.rank === rank) {
          nameOnlyUpdates.push({
            id: roleId,
            name: name,
            description: current.description || ""
          });
        } else if (current.rank !== rank) {
          rankUpdates.push({
            id: roleId,
            oldRank: current.rank,
            newRank: rank,
            name: name,
            description: current.description || ""
          });
        }
      }
    }

    // Step 3A: Perform name-only updates directly (does not change rank numbers, so safe for non-owners)
    for (const update of nameOnlyUpdates) {
      await robloxApiRequest(
        `https://groups.roblox.com/v1/groups/${groupId}/rolesets/${update.id}`,
        "PATCH",
        {
          name: update.name
        }
      );
      // Wait to avoid rate limits
      await new Promise(r => setTimeout(r, 2000));
    }

    // Step 3B: Perform rank updates with conflict resolution (Smart Algorithm)
    if (rankUpdates.length > 0) {
      let pending = [...rankUpdates];
      let currentOccupied = new Set(currentRobloxRoles.map(r => r.rank));
      
      while (pending.length > 0) {
        let found = false;
        for (let i = 0; i < pending.length; i++) {
          const update = pending[i];
          // Kendi ranki ise veya gideceği yer şu an tamamen boşsa
          if (!currentOccupied.has(update.newRank) || update.newRank === update.oldRank) {
            await robloxApiRequest(
              `https://groups.roblox.com/v1/groups/${groupId}/rolesets/${update.id}`,
              "PATCH",
              { name: update.name, rank: update.newRank }
            );
            currentOccupied.delete(update.oldRank);
            currentOccupied.add(update.newRank);
            pending.splice(i, 1);
            found = true;
            await new Promise(r => setTimeout(r, 2000));
            break;
          }
        }
        
        // Eğer Deadlock (Kilitlenme) olursa, mecburen birini geçici ranka (200+) atıyoruz
        if (!found) {
          const update = pending[0];
          let tempRank = 200;
          while (currentOccupied.has(tempRank) || tempRank === 255) tempRank++;
          
          await robloxApiRequest(
            `https://groups.roblox.com/v1/groups/${groupId}/rolesets/${update.id}`,
            "PATCH",
            { name: update.name, rank: tempRank }
          );
          currentOccupied.delete(update.oldRank);
          currentOccupied.add(tempRank);
          update.oldRank = tempRank; // Artık yeni yeri burası, bir sonraki döngüde asıl yerine gidecek
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    // Step 3C: Create new roles
    for (const newRole of newRolesToCreate) {
      try {
        const createRes = await robloxApiRequest(
          `https://groups.roblox.com/v1/groups/${groupId}/rolesets/create`,
          "POST",
          {
            name: newRole.name || "Yeni Rol",
            description: "",
            rank: newRole.rank
          }
        );
        // Save its color locally if a color was provided
        if (createRes && createRes.id) {
          rankMetadata.create({ groupId, roleId: String(createRes.id), color: newRole.color, createdAt: new Date() });
        }
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error("Yeni rol oluşturma hatası:", err.response?.data || err.message);
        throw new Error("Yeni rol oluşturulamadı: " + (err.response?.data?.errors?.[0]?.message || err.message));
      }
    }

    await saveStoreNow();
    
    logger.log("[GRUP YÖNETİCİSİ] " + (req.user.discordUsername || req.user.username) + ", " + groupId + " ID'li grubun rütbe sıralarını/isimlerini/renklerini güncelledi.", "admin");
    
    res.json({ success: true, message: "Rütbeler başarıyla güncellendi." });
  } catch (err) {
    console.error("Update roles error:", err.response?.data || err.message);
    const robloxError = err.response?.data?.errors?.[0];
    let errMsg = err.message;
    if (robloxError) {
      if (robloxError.code === 24 || robloxError.message?.includes("membership relationship rank")) {
        errMsg = "Roblox API Hatası: İşlemi yapan hesabın (TMTCOOKIE) grubun Yegane Sahibi (Owner) olması gerekmektedir. Eğer TMTCOOKIE'ye bir bot veya sadece yetkili bir hesap ekli ise rank sıraları değiştirilemez. Lütfen Render.com'da TMTCOOKIE değişkenine grubu kuran ana hesabın çerezini girin.";
      } else {
        errMsg = robloxError.message;
      }
    }
    res.status(500).json({ error: "Rütbeler güncellenemedi: " + errMsg });
  }
});

// Endpoint: 5-by-5 Reorder Single Group
router.post("/api/group-admin/groups/:groupId/reorder-5", async (req, res) => {
  if (!requireGroupAdmin(req, res)) return;
  const groupId = String(req.params.groupId);
  if (!TMT_GROUP_IDS.has(groupId)) {
    return res.status(403).json({ error: "Bu grup üzerinde yetkiniz yok veya TMT grubu değil." });
  }

  try {
    // 1. Fetch current roles
    const response = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/roles`);
    const currentRobloxRoles = response.data.roles || [];

    // 2. Filter out Guest (0) and Owner (255), and sort the remaining roles by current rank ascending
    const reorderable = currentRobloxRoles
      .filter(r => r.rank > 0 && r.rank < 255)
      .sort((a, b) => a.rank - b.rank);

    if (reorderable.length === 0) {
      return res.json({ success: true, message: "Grupta düzenlenebilir rütbe bulunamadı." });
    }

    // 3. Prepare target ranks starting from 5 increasing by 5
    const updates = reorderable.map((role, index) => ({
      id: String(role.id),
      oldRank: role.rank,
      newRank: 5 * (index + 1),
      name: role.name,
      description: role.description || ""
    }));

    // Filter updates that don't need changes
    const actualUpdates = updates.filter(u => u.oldRank !== u.newRank);
    if (actualUpdates.length === 0) {
      return res.json({ success: true, message: "Rütbe sıraları zaten 5'erli şekilde düzenli." });
    }

    // Akıllı Sıralama Algoritması (Gereksiz 200+ geçişlerini önler)
    let pending = [...actualUpdates];
    let currentOccupied = new Set(currentRobloxRoles.map(r => r.rank));

    while (pending.length > 0) {
      let found = false;
      for (let i = 0; i < pending.length; i++) {
        const update = pending[i];
        if (!currentOccupied.has(update.newRank) || update.newRank === update.oldRank) {
          await robloxApiRequest(
            `https://groups.roblox.com/v1/groups/${groupId}/rolesets/${update.id}`,
            "PATCH",
            { name: update.name, rank: update.newRank }
          );
          currentOccupied.delete(update.oldRank);
          currentOccupied.add(update.newRank);
          pending.splice(i, 1);
          found = true;
          await new Promise(r => setTimeout(r, 2000));
          break;
        }
      }
      
      if (!found) {
        const update = pending[0];
        let tempRank = 200;
        while (currentOccupied.has(tempRank) || tempRank === 255) tempRank++;
        
        await robloxApiRequest(
          `https://groups.roblox.com/v1/groups/${groupId}/rolesets/${update.id}`,
          "PATCH",
          { name: update.name, rank: tempRank }
        );
        currentOccupied.delete(update.oldRank);
        currentOccupied.add(tempRank);
        update.oldRank = tempRank;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    logger.log("[GRUP YÖNETİCİSİ] " + (req.user.discordUsername || req.user.username) + ", " + groupId + " ID'li grubun rütbelerini 5'erli olarak sıraladı.", "admin");
    res.json({ success: true, message: "Rütbeler başarıyla 5'erli olarak sıralandı." });
  } catch (err) {
    console.error("Reorder 5 error:", err.response?.data || err.message);
    const robloxError = err.response?.data?.errors?.[0];
    let errMsg = err.message;
    if (robloxError) {
      if (robloxError.code === 24 || robloxError.message?.includes("membership relationship rank")) {
        errMsg = "Roblox API Hatası: İşlemi yapan hesabın (TMTCOOKIE) grubun Yegane Sahibi (Owner) olması gerekmektedir. Eğer TMTCOOKIE'ye bir bot veya sadece yetkili bir hesap ekli ise rank sıraları değiştirilemez. Lütfen Render.com'da TMTCOOKIE değişkenine grubu kuran ana hesabın çerezini girin.";
      } else {
        errMsg = robloxError.message;
      }
    }
    res.status(500).json({ error: "Rütbeler 5'erli sıralanamadı: " + errMsg });
  }
});

// Endpoint: Get Role Permissions
router.get("/api/group-admin/groups/:groupId/roles/:roleId/permissions", async (req, res) => {
  if (!requireGroupAdmin(req, res)) return;
  const { groupId, roleId } = req.params;
  try {
    const data = await robloxApiRequest(
      `https://groups.roblox.com/v1/groups/${groupId}/roles/${roleId}/permissions`,
      "GET"
    );
    res.json(data);
  } catch (err) {
    console.error("Get permissions error:", err.message);
    res.status(500).json({ error: "İzinler alınamadı: " + err.message });
  }
});

// Endpoint: Update Role Permissions
router.patch("/api/group-admin/groups/:groupId/roles/:roleId/permissions", async (req, res) => {
  if (!requireGroupAdmin(req, res)) return;
  const { groupId, roleId } = req.params;
  
  if (String(groupId) === "11517908") {
    return res.status(403).json({ error: "TMT Turkish Armed Forces grubunda izin yönetimi kapalıdır." });
  }

  try {
    const permissions = req.body;
    const data = await robloxApiRequest(
      `https://groups.roblox.com/v1/groups/${groupId}/roles/${roleId}/permissions`,
      "PATCH",
      permissions
    );
    logger.log("[GRUP YÖNETİCİSİ] " + (req.user.discordUsername || req.user.username) + ", " + groupId + " ID'li grubun " + roleId + " ID'li rolünün izinlerini güncelledi.", "admin");
    res.json({ success: true, data });
  } catch (err) {
    console.error("Update permissions error:", err.message);
    res.status(500).json({ error: "İzinler güncellenemedi: " + (err.response?.data?.errors?.[0]?.message || err.message) });
  }
});

// ─── Sentara Sosyal Medya API Rotaları ─────────────────────────────────────────
const { posts, stories, liveStreams } = require("../../models/Store");

router.get("/api/social/feed", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  try {
    const allPosts = posts.find({}).sort({ createdAt: -1 });
    
    // Enrich posts with user details
    const enrichedPosts = allPosts.map(p => {
      const author = User.findOne({ discordId: p.userId });
      return {
        ...p,
        authorUsername: author ? author.discordUsername : p.userName,
        authorAvatar: author ? author.discordAvatar : p.userAvatar,
        authorStatus: author ? author.customStatus : null,
        authorColor: author ? author.profileColor : "#7c6af7",
        isLiked: p.likes ? p.likes.includes(req.user.discordId) : false
      };
    });

    // Load active stories (less than 24 hours old)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeStories = stories.find({}).filter(s => new Date(s.createdAt) > twentyFourHoursAgo);
    
    // Group stories by user
    const groupedStories = [];
    const userStoryMap = new Map();
    activeStories.forEach(s => {
      const author = User.findOne({ discordId: s.userId });
      if (!userStoryMap.has(s.userId)) {
        userStoryMap.set(s.userId, {
          userId: s.userId,
          userName: author ? author.discordUsername : s.userName,
          userAvatar: author ? author.discordAvatar : s.userAvatar,
          stories: []
        });
      }
      userStoryMap.get(s.userId).stories.push(s);
    });
    userStoryMap.forEach(v => groupedStories.push(v));

    res.json({ success: true, posts: enrichedPosts, stories: groupedStories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/social/posts", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  const { content, repostOf } = req.body;
  if (!content && !repostOf) return res.status(400).json({ error: "Gönderi içeriği boş olamaz." });

  try {
    let repostedBy = null;
    let finalContent = content;
    if (repostOf) {
      const orig = posts.findOne({ _id: repostOf });
      if (!orig) return res.status(404).json({ error: "Yeniden paylaşılacak gönderi bulunamadı." });
      repostedBy = req.user.discordUsername;
    }

    const newPost = posts.create({
      userId: req.user.discordId,
      userName: req.user.discordUsername,
      userAvatar: req.user.discordAvatar,
      content: finalContent || "",
      repostOf: repostOf || null,
      repostedBy: repostedBy,
      likes: [],
      comments: [],
      createdAt: new Date()
    });

    saveStoreNow();
    res.json({ success: true, post: newPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/social/posts/:id/like", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  try {
    const post = posts.findOne({ _id: req.params.id });
    if (!post) return res.status(404).json({ error: "Gönderi bulunamadı." });

    if (!post.likes) post.likes = [];
    const index = post.likes.indexOf(req.user.discordId);
    let liked = false;
    if (index === -1) {
      post.likes.push(req.user.discordId);
      liked = true;
    } else {
      post.likes.splice(index, 1);
    }
    
    await post.save();
    saveStoreNow();
    res.json({ success: true, likesCount: post.likes.length, liked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/social/posts/:id/comments", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Yorum içeriği boş olamaz." });

  try {
    const post = posts.findOne({ _id: req.params.id });
    if (!post) return res.status(404).json({ error: "Gönderi bulunamadı." });

    if (!post.comments) post.comments = [];
    const newComment = {
      id: crypto.randomBytes(8).toString("hex"),
      userId: req.user.discordId,
      userName: req.user.discordUsername,
      userAvatar: req.user.discordAvatar,
      content: content,
      createdAt: new Date(),
      replies: []
    };

    post.comments.push(newComment);
    await post.save();
    saveStoreNow();
    res.json({ success: true, comment: newComment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/social/posts/:id/comments/:commentId/replies", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Yanıt içeriği boş olamaz." });

  try {
    const post = posts.findOne({ _id: req.params.id });
    if (!post) return res.status(404).json({ error: "Gönderi bulunamadı." });

    const comment = (post.comments || []).find(c => c.id === req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Yorum bulunamadı." });

    if (!comment.replies) comment.replies = [];
    const newReply = {
      id: crypto.randomBytes(8).toString("hex"),
      userId: req.user.discordId,
      userName: req.user.discordUsername,
      userAvatar: req.user.discordAvatar,
      content: content,
      createdAt: new Date()
    };

    comment.replies.push(newReply);
    await post.save();
    saveStoreNow();
    res.json({ success: true, reply: newReply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/social/stories", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Hikaye içeriği boş olamaz." });

  try {
    const newStory = stories.create({
      userId: req.user.discordId,
      userName: req.user.discordUsername,
      userAvatar: req.user.discordAvatar,
      content: content,
      createdAt: new Date()
    });

    saveStoreNow();
    res.json({ success: true, story: newStory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/social/status", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  const { status } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    user.customStatus = status ? String(status).slice(0, 100) : null;
    await user.save();
    saveStoreNow();
    res.json({ success: true, status: user.customStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/social/streams", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  try {
    const activeStreams = liveStreams.find({ active: true });
    res.json({ success: true, streams: activeStreams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/social/streams", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Yayın başlığı girilmelidir." });

  try {
    // End any existing streams by this user
    const existing = liveStreams.find({ userId: req.user.discordId, active: true });
    for (const s of existing) {
      s.active = false;
      await s.save();
    }

    const newStream = liveStreams.create({
      userId: req.user.discordId,
      userName: req.user.discordUsername,
      userAvatar: req.user.discordAvatar,
      title: title,
      active: true,
      chatMessages: [],
      viewerCount: Math.floor(Math.random() * 8) + 1,
      createdAt: new Date()
    });

    saveStoreNow();
    res.json({ success: true, stream: newStream });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/social/streams/:id/end", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  try {
    const stream = liveStreams.findOne({ _id: req.params.id });
    if (!stream) return res.status(404).json({ error: "Yayın bulunamadı." });
    if (stream.userId !== req.user.discordId) return res.status(403).json({ error: "Yalnızca kendi yayınınızı kapatabilirsiniz." });

    stream.active = false;
    await stream.save();
    saveStoreNow();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/social/streams/:id/chat", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Giriş yapmanız gerekli." });
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Mesaj boş olamaz." });

  try {
    const stream = liveStreams.findOne({ _id: req.params.id, active: true });
    if (!stream) return res.status(404).json({ error: "Yayın bulunamadı veya kapalı." });

    if (!stream.chatMessages) stream.chatMessages = [];
    const newMsg = {
      userName: req.user.discordUsername,
      content: content,
      createdAt: new Date()
    };
    stream.chatMessages.push(newMsg);
    
    // Add random floating message mocks to make it lively!
    const mocks = [
      "Harika yayın!", "Efsane gidiyor", "Gözlerim yaşardı", "Başarılar dilerim", 
      "Sentara premium farkı!", "Helal olsun", "Destekler sonuna kadar", "+++"
    ];
    if (Math.random() > 0.4) {
      const randomUser = "Kullanıcı" + Math.floor(Math.random() * 90 + 10);
      const randomText = mocks[Math.floor(Math.random() * mocks.length)];
      stream.chatMessages.push({
        userName: randomUser,
        content: randomText,
        createdAt: new Date()
      });
      stream.viewerCount = (stream.viewerCount || 0) + (Math.random() > 0.5 ? 1 : -1);
      if (stream.viewerCount < 1) stream.viewerCount = 1;
    }

    await stream.save();
    saveStoreNow();
    res.json({ success: true, message: newMsg, stream });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



// ═══════════════════════════════════════════════════════════════════════════
// HESAP GEÇİŞİ (ACCOUNT TRANSFER) - MODERATÖR ONLY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hesap geçişi yap - POST /api/account-transfer
 * Moderatör bir kullanıcının tüm verilerini başka bir Discord hesabına aktarır
 */
// Helper: Hesap transferi yetki kontrolü
async function isAccountTransferAuthorized(reqUser) {
  if (!reqUser) return false;
  if (reqUser.isAdmin || reqUser.isStaff) return true;
  if (process.env.DISCORD_OWNER_ID && reqUser.discordId === process.env.DISCORD_OWNER_ID) return true;

  try {
    const StaffProgress = require("../../models/StaffProgress");
    const staffProgress = await StaffProgress.findOne({ userId: reqUser.discordId });
    if (staffProgress && (staffProgress.adminOverride || (staffProgress.level || 0) >= 2 || staffProgress.status === 'active')) {
      return true;
    }

    const User = require("../../models/User");
    const dbUser = await User.findOne({ discordId: reqUser.discordId });
    if (dbUser && (dbUser.isAdmin || dbUser.isStaff)) return true;
  } catch (e) {
    console.error('[AccountTransfer] Auth check error:', e.message);
  }
  return false;
}

/**
 * Hesap geçişi yap - POST /api/account-transfer
 * Moderatör bir kullanıcının tüm verilerini başka bir Discord hesabına aktarır
 */
router.post("/api/account-transfer", async (req, res) => {
  try {
    // Oturum kontrolü
    if (!req.user) {
      return res.status(401).json({ error: "Oturum açmalısınız." });
    }

    // Yetki kontrolü
    const authorized = await isAccountTransferAuthorized(req.user);
    if (!authorized) {
      return res.status(403).json({ error: "Bu işlem için Moderatör veya Yönetici yetkisine sahip olmalısınız." });
    }

    const { oldDiscordId, newDiscordId, newDiscordUsername, reason } = req.body;

    // Parametre kontrolü
    if (!oldDiscordId || !newDiscordId || !newDiscordUsername) {
      return res.status(400).json({ error: "Eski Discord ID, Yeni Discord ID ve Yeni Discord Kullanıcı Adı gereklidir." });
    }

    // Discord ID formatı kontrolü
    if (!/^\d{17,20}$/.test(oldDiscordId) || !/^\d{17,20}$/.test(newDiscordId)) {
      return res.status(400).json({ error: "Geçersiz Discord ID formatı." });
    }

    // Aynı hesaba geçiş kontrolü
    if (oldDiscordId === newDiscordId) {
      return res.status(400).json({ error: "Eski ve yeni Discord ID aynı olamaz." });
    }

    // Transfer servisini çalıştır
    const { transferAccount } = require("../services/accountTransferService");
    const result = await transferAccount(
      oldDiscordId,
      newDiscordId,
      newDiscordUsername,
      req.user.discordId,
      reason || 'Moderatör tarafından yapılan hesap geçişi'
    );

    if (result.success) {
      // Log kaydet
      console.log(`[AccountTransfer] ${req.user.discordUsername} (${req.user.discordId}) transferred account from ${oldDiscordId} to ${newDiscordId}`);
      
      // Discord'a bildirim gönder
      try {
        const { getDiscordClient } = require("../../bot/discordClient");
        const discordBot = getDiscordClient();
        const { EmbedBuilder } = require('discord.js');
        const { LOG_CHANNEL_ID } = require("../../config");

        if (discordBot && LOG_CHANNEL_ID) {
          const logChannel = await discordBot.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
          if (logChannel) {
            const embed = new EmbedBuilder()
              .setColor(0xFFA500)
              .setTitle('🔄 Hesap Geçişi Yapıldı')
              .setDescription(
                `**Moderatör:** <@${req.user.discordId}> (${req.user.discordUsername})\n\n` +
                `**Eski Hesap:** <@${oldDiscordId}>\n` +
                `**Yeni Hesap:** <@${newDiscordId}> (${newDiscordUsername})\n\n` +
                `**Sebep:** ${reason || 'Belirtilmemiş'}\n\n` +
                `**Aktarılan Veriler:**\n` +
                `${result.transferLog.transferredData.user ? '✅ User Data\n' : ''}` +
                `${result.transferLog.transferredData.staffProgress ? '✅ Staff Progress\n' : ''}` +
                `${result.transferLog.transferredData.economy ? '✅ Economy Data\n' : ''}` +
                `${result.transferLog.transferredData.tickets ? `✅ ${result.transferLog.transferredData.tickets} Ticket(s)\n` : ''}`
              )
              .setTimestamp()
              .setFooter({ text: 'Account Transfer System' });

            await logChannel.send({ embeds: [embed] }).catch(() => {});
          }
        }
      } catch (logErr) {
        console.error('[AccountTransfer] Discord log error:', logErr.message);
      }

      return res.json(result);
    } else {
      return res.status(400).json({ error: result.message });
    }

  } catch (error) {
    console.error('[API] Account transfer error:', error);
    return res.status(500).json({ error: "Hesap geçişi sırasında bir hata oluştu." });
  }
});

/**
 * Hesap geçiş geçmişini getir - GET /api/account-transfer/history
 */
router.get("/api/account-transfer/history", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Oturum açmalısınız." });
    }

    const authorized = await isAccountTransferAuthorized(req.user);
    if (!authorized) {
      return res.status(403).json({ error: "Bu işlem için Moderatör veya Yönetici yetkisine sahip olmalısınız." });
    }

    const { getTransferHistory } = require("../services/accountTransferService");
    const history = await getTransferHistory(100);

    return res.json({ success: true, history });

  } catch (error) {
    console.error('[API] Transfer history error:', error);
    return res.status(500).json({ error: "Geçmiş getirilirken bir hata oluştu." });
  }
});

/**
 * Belirli bir kullanıcının geçiş geçmişini getir - GET /api/account-transfer/user/:discordId
 */
router.get("/api/account-transfer/user/:discordId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Oturum açmalısınız." });
    }

    const authorized = await isAccountTransferAuthorized(req.user);
    if (!authorized) {
      return res.status(403).json({ error: "Bu işlem için Moderatör veya Yönetici yetkisine sahip olmalısınız." });
    }

    const { discordId } = req.params;
    
    if (!/^\d{17,20}$/.test(discordId)) {
      return res.status(400).json({ error: "Geçersiz Discord ID formatı." });
    }

    const { getUserTransferHistory } = require("../services/accountTransferService");
    const history = await getUserTransferHistory(discordId);

    return res.json({ success: true, history });

  } catch (error) {
    console.error('[API] User transfer history error:', error);
    return res.status(500).json({ error: "Kullanıcı geçmişi getirilirken bir hata oluştu." });
  }
});
