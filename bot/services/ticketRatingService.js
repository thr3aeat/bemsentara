const { EmbedBuilder } = require("discord.js");
const { buildReopenAndRateRow } = require("../embeds");

/**
 * Sends DM notification with rating and reopen buttons whenever a ticket is closed.
 * Works for all categories (reklam, destek, şikayet, öneri, vb.) and all closure sources.
 */
async function sendTicketCloseRatingDM(ticket, closedByName = "Yetkili", reason = "Belirtilmedi", client = null) {
  if (!ticket || !ticket.userId) return false;

  try {
    const discordClient = client || (require("../discordClient").getDiscordClient ? require("../discordClient").getDiscordClient() : null);
    if (!discordClient || !discordClient.isReady()) {
      console.warn("[sendTicketCloseRatingDM] Discord client hazır değil.");
      return false;
    }

    const ticketOwner = await discordClient.users.fetch(ticket.userId).catch(() => null);
    if (!ticketOwner) {
      console.warn(`[sendTicketCloseRatingDM] Kullanıcı bulunamadı (${ticket.userId})`);
      return false;
    }

    const catName = ticket.categoryName || ticket.category || "Destek";
    const dmEmbed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("🔒 Destek Talebiniz Kapatıldı")
      .setDescription(
        `**${catName}** kategorisindeki destek talebiniz **${closedByName}** tarafından kapatıldı.\n\n` +
        `**Sebep:** ${reason || 'Belirtilmedi'}\n\n` +
        `⭐ **Lütfen Aldığınız Desteği Değerlendirin:**\n` +
        `Destek ekibimizin performansını değerlendirmek ve 1-5 arası yıldız/yorum vermek için aşağıdaki **"⭐ Değerlendir"** butonunu kullanabilirsiniz.\n\n` +
        `Dilerseniz talebinizi **"🔓 Tekrar Aç"** butonuyla yeniden aktif edebilirsiniz.`
      )
      .addFields(
        { name: "🎫 Ticket ID", value: `\`${ticket.ticketId}\``, inline: true },
        { name: "📋 Konu / Kategori", value: `${ticket.subject || 'Belirtilmedi'} (${catName})`, inline: true }
      )
      .setFooter({ text: "Sentara Support • Değerlendirmeniz moderatör kalitemizi artırmamıza yardımcı olur." })
      .setTimestamp();

    const dmButtons = buildReopenAndRateRow(ticket.ticketId);

    await ticketOwner.send({ embeds: [dmEmbed], components: [dmButtons] }).catch(() => {});
    console.log(`[sendTicketCloseRatingDM] DM başarıyla gönderildi: #${ticket.ticketId} -> ${ticket.userId}`);
    return true;
  } catch (err) {
    console.warn(`[sendTicketCloseRatingDM] DM gönderilemedi (${ticket.ticketId}):`, err.message);
    return false;
  }
}

module.exports = {
  sendTicketCloseRatingDM
};
