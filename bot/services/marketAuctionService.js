const MarketAuction = require("../../models/MarketAuction");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * Pazar Yeri & Açık Arttırma Yönetim Servisi
 */
class MarketAuctionService {
  /**
   * Aktif İlanları Listeler
   */
  static async getActiveAuctions(guildId) {
    return await MarketAuction.find({ guildId, status: "ACTIVE" });
  }

  /**
   * Pazar Yeri Ana Panel Embed ve Butonları
   */
  static async renderMarketplacePanel(interaction) {
    const auctions = await this.getActiveAuctions(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle("🛒 Sentara Pazar Yeri & Açık Arttırma")
      .setDescription("Kullanıcılar arası mülk, coin ve eşya alım-satım pazarına hoş geldiniz!")
      .setColor(0x9B59B6);

    if (!auctions || auctions.length === 0) {
      embed.addFields({ name: "📦 Aktif İlanlar", value: "Şu anda pazar yerinde aktif ilan bulunmamaktadır." });
    } else {
      auctions.slice(0, 5).forEach((auc, idx) => {
        embed.addFields({
          name: `${idx + 1}. ${auc.itemName} (${auc.itemType})`,
          value: `👤 Satıcı: <@${auc.sellerId}>\n💰 Mevcut Teklif: **${auc.currentBid} EkoCoin**\n🏆 En Yüksek Teklif Veren: ${auc.highestBidderId ? `<@${auc.highestBidderId}>` : "Yok"}\n🆔 İlan ID: \`${auc._id}\``
        });
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("btn_market_create_item")
        .setLabel("➕ İlan Oluştur")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("btn_market_refresh")
        .setLabel("🔄 Pazarı Yenile")
        .setStyle(ButtonStyle.Secondary)
    );

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  }

  /**
   * İlana Teklif Verme İşlemi
   */
  static async placeBid(auctionId, bidderUserId, bidAmount) {
    const auction = await MarketAuction.findOne({ _id: auctionId });
    if (!auction || auction.status !== "ACTIVE") {
      return { success: false, message: "İlan bulunamadı veya süresi dolmuş." };
    }

    if (bidderUserId === auction.sellerId) {
      return { success: false, message: "Kendi ilanınıza teklif veremezsiniz!" };
    }

    if (bidAmount <= auction.currentBid) {
      return { success: false, message: `Teklifiniz mevcut en yüksek tekliften (${auction.currentBid} EkoCoin) büyük olmalıdır!` };
    }

    auction.currentBid = bidAmount;
    auction.highestBidderId = bidderUserId;
    await auction.save();

    return { success: true, message: `Başarıyla **${bidAmount} EkoCoin** teklif verdiniz!` };
  }
}

module.exports = MarketAuctionService;
