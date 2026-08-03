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
    
    // Cevabı kaydet
    const fieldMap = {
      "1": "username",
      "2": "howFound",
      "3": "joinPurpose",
      "4": "wasHereBefore",
      "5": "hasAltAccounts",
      "6": "rulesAccepted",
      "7": "additionalInfo",
      "8": "whyNewAccount",
      "9": "hasMicrophone"
    };
    
    const field = fieldMap[currentStep];
    if (field) {
      investigation.surveyAnswers[field] = message.content;
      await investigation.save();
    }
    
    // Bir sonraki soruya geç
    const questionData = await sendSurveyStep(message.author, null, currentStep);
    const nextStep = questionData?.nextStep;
    
    if (nextStep === 'complete') {
      await completeSurveyFromMessage(client, message.author, investigation);
    } else if (nextStep) {
      await askSurveyQuestionFromMessage(message.author, investigation, nextStep);
    }
    
  } catch (err) {
    console.error("[NewAccountMessageHandler] Survey text answer error:", err);
  }
}

/**
 * Anket sorusunu sorar (message context'ten)
 */
async function askSurveyQuestionFromMessage(user, investigation, step) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
  
  const questionData = await sendSurveyStep(user, null, step);
  
  if (!questionData) return;
  
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle("📝 Güvenlik Anketi")
    .setDescription(questionData.question)
    .setFooter({ text: questionData.optional ? "İsteğe bağlı - 'Yok' yazarak geçebilirsin" : "Lütfen cevapla" });
  
  let components = [];
  
  if (questionData.type === 'buttons') {
    const row = new ActionRowBuilder();
    for (const option of questionData.options) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`survey_answer_${step}_${option.value}`)
          .setLabel(option.label)
          .setStyle(option.style)
      );
    }
    components.push(row);
  }
  
  await user.send({ embeds: [embed], components: components });
  
  // Store beklenen cevap tipini
  investigation.surveyAnswers._currentStep = step;
  investigation.surveyAnswers._currentType = questionData.type;
  await investigation.save();
}

/**
 * Anketi tamamla (message context'ten)
 */
async function completeSurveyFromMessage(client, user, investigation) {
  try {
    const { sendSurveyCompleteMessage } = require("../services/security/newAccountSurvey");
    const { selectBestModerator } = require("../services/security/moderatorSelector");
    const { notifyModeratorAboutNewAccount } = require("../services/security/accountInvestigation");
    
    investigation.status = 'survey_completed';
    investigation.surveyCompletedAt = new Date();
    await investigation.save();
    
    await sendSurveyCompleteMessage(user, client.guilds.cache.get(investigation.guildId));
    
    // Moderatör seç ve bildir
    const guild = client.guilds.cache.get(investigation.guildId);
    if (!guild) return;
    
    const member = await guild.members.fetch(investigation.userId).catch(() => null);
    if (!member) return;
    
    const moderator = await selectBestModerator(guild);
    if (moderator) {
      investigation.assignedModeratorId = moderator.id;
      investigation.assignedAt = new Date();
      investigation.status = 'assigned';
      await investigation.save();
      
      await notifyModeratorAboutNewAccount(client, member, investigation, investigation.riskScore);
    }
    
  } catch (err) {
    console.error("[NewAccountMessageHandler] Complete survey error:", err);
  }
}

module.exports = { initializeNewAccountMessageHandler };
