/**
 * economyMarketV2.js
 * 
 * Ekonomi, Market & RPG Envanter Sistemi V2
 */

const { ButtonStyle } = require("discord.js");
const ComponentsV2Factory = require("../utils/componentsV2Factory");
const TypographyHelper = require("../utils/typographyHelper");
const QuickChartHelper = require("../utils/quickChartHelper");

class EconomyMarketV2 {
  /**
   * Pazar Yeri (Marketplace) V2 Payload'ı Üretir
   */
  static buildMarketplacePayload(marketData = {}) {
    try {
      const {
        userId = "0",
        username = "Kullanıcı",
        cashBalance = 15400,
        bankBalance = 45000,
        itemsValue = 28000,
        featuredItems = [
          { id: "item_01", name: "🗡️ Ejderha Kılıcı", price: 12000, seller: "EkoTrader" },
          { id: "item_02", name: "🛡️ Titanyum Zırh", price: 8500, seller: "SentaraBot" },
          { id: "item_03", name: "💍 Şans Yüzüğü", price: 4500, seller: "GamerPro" },
        ],
      } = marketData;

      const totalWealth = cashBalance + bankBalance + itemsValue;

      // Doughnut chart for asset distribution
      const chartUrl = QuickChartHelper.getChartUrl({
        labels: ["Cüzdan Nakit", "Banka Hesabı", "Envanter / Mülk"],
        data: [cashBalance, bankBalance, itemsValue],
        datasetLabel: "Servet Dağılımı",
        chartType: "doughnut",
        color: "#5865F2",
        width: 400,
        height: 180,
      });

      const itemsListText = featuredItems.length > 0
        ? featuredItems
            .map((item) => `• **${item.name}** — 💰 **${item.price.toLocaleString()} Dolar** (Satıcı: \`${item.seller}\`)`)
            .join("\n")
        : "Şu anda pazarda aktif eşya bulunmuyor.";

      const components = [
        ...ComponentsV2Factory.headerBlock(`Sentara Küresel Pazar Yeri & Finans`, "💰"),
        ComponentsV2Factory.section(
          `👤 **Hesap:** <@${userId}> (\`${username}\`)\n` +
          `💵 **Cüzdan Nakit:** **$${cashBalance.toLocaleString()}**  |  🏦 **Banka:** **$${bankBalance.toLocaleString()}**\n` +
          `💎 **Toplam Net Servet:** **$${totalWealth.toLocaleString()}**`
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(
          `🛒 **Öne Çıkan Pazar Eşyaları:**\n${itemsListText}`
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(`📊 **Kişisel Servet Dağılım Grafiği:**`),
        ComponentsV2Factory.mediaGallery([chartUrl]),
        ComponentsV2Factory.separator(false),
        ComponentsV2Factory.text(
          TypographyHelper.subtext(`Sentara Economy Engine • Son Güncelleme: ${TypographyHelper.timestamp(new Date(), "R")}`)
        ),
        ComponentsV2Factory.actionRow([
          {
            custom_id: `market_buy_${userId}`,
            label: "🛒 Eşya Satın Al",
            style: ButtonStyle.Success,
          },
          {
            custom_id: `market_sell_${userId}`,
            label: "💰 Pazara Eşya Koy",
            style: ButtonStyle.Primary,
          },
          {
            custom_id: `market_inventory_${userId}`,
            label: "🎒 Envanterimi Aç",
            style: ButtonStyle.Secondary,
          },
        ]),
      ];

      return ComponentsV2Factory.buildPayload(0xFFD700, components);
    } catch (err) {
      console.error("[EconomyMarketV2] Payload üretme hatası:", err);
      return ComponentsV2Factory.buildPayload(0xED4245, [
        ComponentsV2Factory.text("⚠️ **Market Arayüzü Yüklenirken Bir Hata Oluştu.**")
      ]);
    }
  }
}

module.exports = EconomyMarketV2;
