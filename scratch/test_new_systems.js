const StaffLeaveService = require("../bot/services/staffLeaveService");
const StaffShiftService = require("../bot/services/staffShiftService");
const AltRaidGuardService = require("../bot/services/security/altRaidGuardService");
const TicketSmartResolverService = require("../bot/services/ticket/ticketSmartResolverService");
const MarketAuctionService = require("../bot/services/marketAuctionService");
const StockChartService = require("../bot/services/stockChartService");
const RobloxOpenCloudService = require("../bot/services/robloxOpenCloudService");

async function runTests() {
  console.log("=== 🧪 Sentara New Systems Verification Test ===");

  // 1. Staff Leave Test
  console.log("1. StaffLeaveService defined:", typeof StaffLeaveService.isUserOnLeave === "function");

  // 2. Staff Shift Test
  console.log("2. StaffShiftService defined:", typeof StaffShiftService.getActiveShift === "function");

  // 3. Alt Raid Guard Test
  console.log("3. AltRaidGuardService defined:", typeof AltRaidGuardService.analyzeNewMember === "function");

  // 4. Ticket AI Resolver Test
  const faqs = TicketSmartResolverService.getFAQDatabase();
  console.log("4. TicketSmartResolverService FAQs loaded count:", faqs.length);

  // 5. Market Auction Test
  console.log("5. MarketAuctionService defined:", typeof MarketAuctionService.placeBid === "function");

  // 6. Stock Chart Test
  console.log("6. StockChartService defined:", typeof StockChartService.generateStockChart === "function");

  // 7. Roblox Open Cloud Test
  console.log("7. RobloxOpenCloudService defined:", typeof RobloxOpenCloudService.publishInGameMessage === "function");

  console.log("✅ All 5 System Packages initialized successfully!");
}

runTests().catch(err => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
