'use strict';

const { PermissionFlagsBits, ChannelType } = require('discord.js');
const Ticket = require('../../models/Ticket');
const { GUILD2_ID, GUILD2_TICKET_CATEGORY_ID } = require('../../config');

const ARCHIVED_TICKET_CATEGORY_IDS = new Set([
  process.env.GUILD2_TICKET_ARCHIVE_CATEGORY_ID,
  '1525218080068730991',
].filter(Boolean));

function normalizeChannelName(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

function isArchivedTicketChannel(channel, guild) {
  if (!channel) return false;
  if (ARCHIVED_TICKET_CATEGORY_IDS.has(channel.parentId)) return true;

  const parent = channel.parent || guild?.channels?.cache?.get(channel.parentId);
  const labels = [channel.name, parent?.name].map(normalizeChannelName);
  return labels.some((label) => /(?:arsiv|archive|kapali|closed)/.test(label));
}

async function closeArchivedTicketRecord(ticket) {
  ticket.status = 'closed';
  ticket.closedAt = ticket.closedAt || new Date();
  ticket.closeReason = ticket.closeReason || 'Kanal arşivde olduğu için otomatik kapatıldı';
  await ticket.save().catch(() => { });
}

/**
 * Bir kullanıcının sunucuda aktif açık ticket'ı olup olmadığını kontrol eder.
 * Kural: Maksimum 1 açık ticket açılabilir.
 * @param {import('discord.js').User} user
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<{ allowed: boolean, channel?: import('discord.js').GuildChannel, ticketId?: string, reason?: string }>}
 */
async function canUserOpenTicket(user, guild) {
  if (!user || !guild) return { allowed: true };

  const targetGuildId = guild.id || GUILD2_ID;

  // 1. Veritabanında kullanıcının açık ticket'larını ara
  try {
    const activeTickets = await Ticket.find({
      userId: user.id,
      status: { $in: ['open', 'pending_confirmation', 'mode_selection'] }
    });

    for (const t of activeTickets) {
      if (t.channelId) {
        const ch = guild.channels.cache.get(t.channelId)
          || await guild.channels.fetch(t.channelId).catch(() => null);

        if (ch) {
          if (isArchivedTicketChannel(ch, guild)) {
            await closeArchivedTicketRecord(t);
            continue;
          }
          return {
            allowed: false,
            channel: ch,
            ticketId: t.ticketId,
            reason: 'active_db_ticket'
          };
        } else {
          // Kanal Discord'dan elle silinmişse veritabanındaki kaydı closed yap
          t.status = 'closed';
          t.closedAt = new Date();
          t.closeReason = 'Kanal Discord üzerinden bulunamadığı için otomatik kapatıldı';
          await t.save().catch(() => { });
        }
      }
    }
  } catch (err) {
    console.warn('[ticketLimiter] DB sorgu hatası:', err.message);
  }

  // 2. Canlı Discord kanallarında kullanıcıya ait açık ticket kanalı var mı kontrol et
  try {
    const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const [chId, ch] of guild.channels.cache) {
      if (!ch || ch.type !== ChannelType.GuildText) continue;
      const chName = ch.name.toLowerCase();
      if (chName === 'ticket-logs') continue;

      const isTicketChannel = (ch.parentId === GUILD2_TICKET_CATEGORY_ID) ||
        chName.startsWith('ticket-') ||
        chName.startsWith('reklam-');

      if (!isTicketChannel) continue;
      if (isArchivedTicketChannel(ch, guild)) continue;

      // Kullanıcının reklam kanalı mı? örn: reklam-ekoyildiz_
      if (cleanUsername && chName === `reklam-${cleanUsername}`) {
        return {
          allowed: false,
          channel: ch,
          reason: 'reklam_channel_active'
        };
      }

      // Kanalın permissionOverwrites'ında kullanıcıya ViewChannel izni verilmiş mi?
      const memberOverwrite = ch.permissionOverwrites?.cache?.get(user.id);
      if (memberOverwrite && memberOverwrite.allow.has(PermissionFlagsBits.ViewChannel)) {
        return {
          allowed: false,
          channel: ch,
          reason: 'permission_active'
        };
      }
    }
  } catch (err) {
    console.warn('[ticketLimiter] Discord kanal tarama hatası:', err.message);
  }

  return { allowed: true };
}

/**
 * Kullanıcıya maksimum 1 ticket sınırını aşması durumunda gönderilecek standart uyarı mesajı
 * @param {import('discord.js').GuildChannel} channel
 * @returns {string}
 */
function getActiveTicketWarningMessage(channel) {
  const channelMention = channel ? `<#${channel.id}>` : 'mevcut destek kanalınız';
  return (
    `❌ **Zaten Açık Bir Destek Talebiniz Bulunuyor!**\n\n` +
    `Sunucumuzda spam ve karışıklığı önlemek için aynı anda **yalnızca 1 adet** destek talebi açabilirsiniz.\n\n` +
    `> 📍 **Mevcut Talebiniz:** ${channelMention}\n\n` +
    `Lütfen mevcut kanalınızı kullanın veya talebinizin çözülüp kapatılmasını bekleyin.\n` +
    `*(Eğer farklı bir konuya geçmek isterseniz mevcut kanalınızdaki **🔄 Tür Değiştir** butonunu kullanabilirsiniz.)*`
  );
}

module.exports = {
  canUserOpenTicket,
  getActiveTicketWarningMessage
};
