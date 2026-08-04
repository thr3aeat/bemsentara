/**
 * newAccountMessageHandler.js
 * 
 * DM üzerinden gelen anket cevapları ve soruşturma mesajlarını yönetir
 */

const AccountInvestigation = require("../../models/AccountInvestigation");
const { sendSurveyStep } = require("../services/security/newAccountSurvey");
const { relayInvestigationMessage } = require("../services/security/accountInvestigation");

/**
 * DM mesajlarını dinler
 * @param {Client} client 
 */
function initializeNewAccountMessageHandler(client) {
  client.on("messageCreate", async (message) => {
    try {
      // Bot mesajları veya guild mesajları atla
      if (message.author.bot) return;
      if (message.guild) return; // Sadece DM'leri işle
      
      // 1. Önce soruşturma mesajı mı kontrol et
      const isInvestigationMessage = await relayInvestigationMessage(client, message, 
        await isUserModerator(client, message.author.id) ? 'moderator' : 'user'
      );
      
      if (isInvestigationMessage) {
        // Mesaj soruşturma mesajıydı, işlendi
        return;
      }
      
      // 2. Anket cevabı mı kontrol et
      await handleSurveyTextAnswer(client, message);
      
    } catch (err) {
      console.error("[NewAccountMessageHandler] Error:", err);
    }
  });
  
  console.log("[NewAccountMessageHandler] ✅ DM message handler aktif");
}

/**
 * Kullanıcının moderatör olup olmadığını kontrol eder
 */
async function isUserModerator(client, userId) {
  try {
    // Tüm guild'larda moderatör rolü var mı kontrol et
    for (const guild of client.guilds.cache.values()) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) continue;
      
      const hasModerationRole = member.roles.cache.some(role => {
        const roleName = role.name.toLowerCase();
        return (
          roleName.includes('mod') ||
          roleName.includes('yetkili') ||
          roleName.includes('staff') ||
          roleName.includes('yönetici') ||
          roleName.includes('admin')
        );
      });
      
      const hasAdminPermission = member.permissions.has('Administrator');
      
      if (hasModerationRole || hasAdminPermission) {
        return true;
      }
    }
    
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Anket text cevabını işler
 */
async function handleSurveyTextAnswer(client, message) {
  try {
    // Bu kullanıcının aktif bir anketi var mı?
    const investigation = await AccountInvestigation.findOne({
      userId: message.author.id,
      status: { $in: ['survey_sent', 'survey_completed'] },
      'surveyAnswers._currentType': 'text'
    }).sort({ createdAt: -1 });
    
    if (!investigation) return;
    
    const currentStep = investigation.surveyAnswers._currentStep;
    const { saveSurveyAnswer, askSurveyQuestion, completeSurvey } = require("./newAccountButtonHandler");
    
    // Cevabı kaydet
    await saveSurveyAnswer(investigation, currentStep, message.content, message.author);
    
    // Bir sonraki soruya geç
    const questionData = await sendSurveyStep(message.author, null, currentStep);
    const nextStep = questionData?.nextStep;
    
    if (nextStep === 'complete') {
      await completeSurvey(client, message.author, investigation);
    } else if (nextStep) {
      await askSurveyQuestion(message.author, investigation, nextStep);
    }
    
  } catch (err) {
    console.error("[NewAccountMessageHandler] Survey text answer error:", err);
  }
}

module.exports = { initializeNewAccountMessageHandler };
