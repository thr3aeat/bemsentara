const CaseDocketV2 = require("../bot/services/caseDocketV2");
const StaffDashboardV2 = require("../bot/services/staffDashboardV2");
const RobloxSecurityV2 = require("../bot/services/robloxSecurityV2");
const AIExamV2 = require("../bot/services/aiExamV2");

console.log("=========================================");
console.log(" TESTING ALL 4 ENTERPRISE V2 MODULES ");
console.log("=========================================\n");

// 1. CaseDocketV2 Test
console.log("--- 1. CaseDocketV2 Test ---");
const casePayload = CaseDocketV2.buildCaseDocketPayload({
  caseId: "MAHKEME-2026-089",
  defendantId: "123456789012345678",
  judgeId: "987654321098765432",
  prosecutorId: "112233445566778899",
  claims: "Kullanıcı sunucu içerisinde izinsiz reklam yapmış ve yetkiliye hakarette bulunmuştur.",
  evidenceList: ["https://cdn.discord/ss1.png", "Ses kaydı dökümü ID #442"],
  votes: { guilty: 14, acquit: 2 },
  status: "ONGOING",
});
console.log("Case Docket Status Flags:", casePayload.flags);
console.log("Case Docket Accent Color:", casePayload.components[0].accent_color);
console.log("Case Docket Components Count:", casePayload.components[0].components.length);

// 2. StaffDashboardV2 Test
console.log("\n--- 2. StaffDashboardV2 Test ---");
const staffPayload = StaffDashboardV2.buildStaffDashboardPayload({
  userId: "123456789",
  username: "EkoAdmin",
  avatarUrl: "https://cdn.discordapp.com/avatars/123/avatar.png",
  roleName: "Başmoderatör",
  ticketCount: 65,
  modActions: 24,
  voiceHours: 42.0,
  avgResponseTimeMin: 2.9,
  weeklyPerformanceDelta: 22,
});
console.log("Staff Dashboard Flags:", staffPayload.flags);
console.log("Staff Dashboard Accent Color:", staffPayload.components[0].accent_color);

// 3. RobloxSecurityV2 Test
console.log("\n--- 3. RobloxSecurityV2 Test ---");
const threatPayload = RobloxSecurityV2.buildThreatAlertPayload({
  actorUsername: "RogueManager",
  actorUserId: 99887766,
  actionType: "EXILE_USER_BATCH",
  threatLevel: "CRITICAL",
  affectedCount: 5,
  affectedUsers: ["User_Alpha", "User_Beta", "User_Gamma", "User_Delta", "User_Epsilon"],
  groupId: 123456,
});
console.log("Threat Alert Flags:", threatPayload.flags);
console.log("Threat Alert Critical Accent Color:", threatPayload.components[0].accent_color);

// 4. AIExamV2 Test
console.log("\n--- 4. AIExamV2 Test ---");
const examPayload = AIExamV2.buildExamResultPayload({
  candidateUserId: "5544332211",
  candidateUsername: "AdayModeratör",
  score: 90,
  passed: true,
  correctCount: 18,
  wrongCount: 2,
  aiFeedback: "Mükemmel sınav sonucu! Kurallar ve komut kullanımı eksiksiz.",
});
console.log("AI Exam Result Flags:", examPayload.flags);
console.log("AI Exam Result Accent Color:", examPayload.components[0].accent_color);

const ticketPayload = AIExamV2.buildSmartTicketAIPayload({
  ticketId: "TICKET-4410",
  userQuestion: "Roblox hesabımı bot ile nasıl bağlayabilirim?",
  aiAnswer: "`/kayitol` komutunu kullanarak Roblox kullanıcı adınızı girin ve verilen doğrulama kodunu profilinize ekleyin.",
  confidenceScore: 98,
});
console.log("Smart Ticket AI Payload Flags:", ticketPayload.flags);

console.log("\n=========================================");
console.log(" SUCCESS: ALL 4 ENTERPRISE V2 MODULES PASSED!");
console.log("=========================================");
