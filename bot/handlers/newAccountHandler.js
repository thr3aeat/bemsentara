/**
 * newAccountHandler.js
 * 
 * Yeni hesap güvenlik sistemi - ana handler
 * guildMemberAdd event'ini dinler ve süreci başlatır
 */

const { isNewAccount, getAccountAgeInHours, calculateRiskScore } = require("../services/security/newAccountDetector");
const { sendSurveyDM } = require("../services/security/newAccountSurvey");
const { selectBestModerator, isModeratorAvailable } = require("../services/security/moderatorSelector");
const { notifyModeratorAboutNewAccount } = require("../services/security/accountInvestigation");
const AccountInvestigation = require("../../models/AccountInvestigation");

/**
 * Yeni üye katıldığında kontrol eder
 * @param {Client} client 
 */
function initializeNewAccountHandler(client) {
  client.on("guildMemberAdd", async (member) => {
    try {
      // Bot ise atla
      if (member.user.bot) return;
      
      // 24 saat içinde oluşturulmuş mu?
      if (!isNewAccount(member)) {
        console.log(`[NewAccountHandler] ${member.user.tag} eski hesap, güvenlik kontrolü atlandı.`);
        return;
      }
      
      console.log(`[NewAccountHandler] Yeni hesap tespit edildi: ${member.user.tag}`);
      
      // Risk puanı hesapla
      const riskScore = await calculateRiskScore(member);
      const accountAge = getAccountAgeInHours(member.user);
      
      console.log(`[NewAccountHandler] Risk skoru: ${riskScore}/100 | Hesap yaşı: ${accountAge} saat`);
      
      // Karantina rolü ver (varsa)
      try {
        const quarantineRole = member.guild.roles.cache.find(r => 
          r.name.toLowerCase().includes('karantin') || 
          r.name.toLowerCase().includes('quarantine') ||
          r.name.toLowerCase().includes('yeni')
        );
        
        if (quarantineRole) {
          await member.roles.add(quarantineRole);
          console.log(`[NewAccountHandler] Karantina rolü verildi: ${member.user.tag}`);
        }
      } catch (err) {
        console.warn(`[NewAccountHandler] Karantina rolü verilemedi:`, err.message);
      }
      
      // DB'ye kaydet
      const investigation = new AccountInvestigation({
        userId: member.id,
        guildId: member.guild.id,
        accountAge: accountAge,
        riskScore: riskScore,
        status: 'survey_sent',
        createdAt: new Date(),
      });
      
      await investigation.save();
      console.log(`[NewAccountHandler] Investigation kaydı oluşturuldu: ${investigation._id}`);
      
      // Anket DM'i gönder
      const surveyResult = await sendSurveyDM(member.user, member.guild);
      
      if (!surveyResult) {
        console.error(`[NewAccountHandler] Anket DM'i gönderilemedi, direkt moderatör bildirimi yapılacak.`);
        
        // DM gönderilemezse direkt moderatöre bildir
        const moderator = await selectBestModerator(member.guild);
        if (moderator) {
          investigation.assignedModeratorId = moderator.id;
          investigation.assignedAt = new Date();
          investigation.status = 'assigned';
          await investigation.save();
          
          await notifyModeratorAboutNewAccount(client, member, investigation, riskScore);
        }
      }
      
    } catch (err) {
      console.error("[NewAccountHandler] Hata:", err.message);
      console.error(err.stack);
    }
  });
  
  console.log("[NewAccountHandler] ✅ Yeni hesap güvenlik sistemi aktif");
}

module.exports = { initializeNewAccountHandler };
