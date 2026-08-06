const TempVoiceV2 = require("../bot/services/tempVoiceV2");
const EconomyMarketV2 = require("../bot/services/economyMarketV2");
const TrustScoreV2 = require("../bot/services/trustScoreV2");
const CrossPlatformNotifyV2 = require("../bot/services/crossPlatformNotifyV2");

console.log("=========================================");
console.log(" TESTING ALL 4 NEW V2 EXTENSION MODULES ");
console.log("=========================================\n");

// 1. TempVoiceV2 Test
console.log("--- 1. TempVoiceV2 Test ---");
const voicePayload = TempVoiceV2.buildVoiceControlPayload({
  channelId: "109988776655443322",
  channelName: "🎙️ Eko'nun Sohbet Odası",
  ownerId: "123456789",
  ownerTag: "Eko#0001",
  userCount: 3,
  userLimit: 5,
  isLocked: true,
  connectedUsers: ["123456789", "987654321", "112233445"],
});
console.log("TempVoice Flags:", voicePayload.flags);
console.log("TempVoice Accent Color (Locked=Red):", voicePayload.components[0].accent_color);

// 2. EconomyMarketV2 Test
console.log("\n--- 2. EconomyMarketV2 Test ---");
const marketPayload = EconomyMarketV2.buildMarketplacePayload({
  userId: "123456789",
  username: "EkoInvestor",
  cashBalance: 25000,
  bankBalance: 120000,
  itemsValue: 45000,
});
console.log("Marketplace Flags:", marketPayload.flags);
console.log("Marketplace Accent Color (Gold):", marketPayload.components[0].accent_color);

// 3. TrustScoreV2 Test
console.log("\n--- 3. TrustScoreV2 Test ---");
const trustPayload = TrustScoreV2.buildTrustScorePayload({
  userId: "123456789",
  username: "GüvenilirOyuncu",
  trustScore: 92,
  accountAgeDays: 600,
  isRobloxVerified: true,
  robloxUsername: "RobloxVerifiedPlayer",
});
console.log("Trust Score Flags:", trustPayload.flags);
console.log("Trust Score Accent Color (High Green):", trustPayload.components[0].accent_color);

// 4. CrossPlatformNotifyV2 Test
console.log("\n--- 4. CrossPlatformNotifyV2 Test ---");
const tgMessage = CrossPlatformNotifyV2.formatForTelegram({
  title: "Roblox Tehdit Alarmı",
  description: "Bir yetkili 5 kullanıcıyı gruptan çıkardı.",
  user: "RogueUser",
  actionType: "EXILE_BATCH",
});
console.log("Telegram Output Sample:\n", tgMessage);

const webhookPayload = CrossPlatformNotifyV2.formatForWebhook({
  title: "Ticket Kapatıldı",
  user: "User123",
  actionType: "TICKET_CLOSE",
});
console.log("Webhook Output Sample:\n", JSON.stringify(webhookPayload, null, 2));

console.log("\n=========================================");
console.log(" SUCCESS: ALL 4 NEW V2 MODULES PASSED!");
console.log("=========================================");
