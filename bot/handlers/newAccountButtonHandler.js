/**
 * newAccountButtonHandler.js
 * 
 * Yeni hesap güvenlik sistemi için button etkileşimlerini yönetir
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { sendSurveyStep } = require("../services/security/newAccountSurvey");
const { startInvestigationChat, completeInvestigation } = require("../services/security/accountInvestigation");
const AccountInvestigation = require("../../models/AccountInvestigation");

/**
 * Yeni hesap güvenlik sistemi button handler'larını ekler
 * @param {ButtonInteraction} interaction 
 */
async function handleNewAccountButtons(interaction) {
  const customId = interaction.customId;
  
  // Survey başlat
  if (customId.startsWith('survey_start_')) {
    await handleSurveyStart(interaction);
  }
  
  // Survey cevap (yes/no butonları)
  else if (customId.startsWith('survey_answer_')) {
    await handleSurveyAnswer(interaction);
  }
  
  // Investigation butonları
  else if (customId.startsWith('investigate_start_')) {
    await handleInvestigationStart(interaction);
  }
  else if (customId.startsWith('investigate_clean_')) {
    await handleInvestigationClean(interaction);
  }
  else if (customId.startsWith('investigate_tempjail_')) {
    await handleInvestigationTempJail(interaction);
  }
  else if (customId.startsWith('investigate_permajail_')) {
    await handleInvestigationPermaJail(interaction);
  }
  else if (customId.startsWith('investigate_ban_')) {
    await handleInvestigationBan(interaction);
  }
  
  // Temp jail süre seçimi
  else if (customId.startsWith('tempjail_duration_')) {
    await handleTempJailDuration(interaction);
  }
}

/**
 * Anket başlatma
 */
async function handleSurveyStart(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const guildId = interaction.customId.split('_')[2];
    
    // Investigation kaydını bul
    const investigation = await AccountInvestigation.findOne({
      userId: interaction.user.id,
      guildId: guildId,
      status: 'survey_sent'
    });
    
    if (!investigation) {
      await interaction.editReply({ content: "❌ Anket kaydın bulunamadı. Lütfen yetkililere ulaş." });
      return;
    }
    
    // İlk soruyu gönder
    const firstQuestion = await sendSurveyStep(interaction.user, interaction.guild, "1");
    
    if (!firstQuestion) {
      await interaction.editReply({ content: "❌ Anket yüklenemedi." });
      return;
    }
    
    // Store current step
    investigation.surveyAnswers = investigation.surveyAnswers || {};
    investigation.surveyAnswers._currentStep = "1";
    await investigation.save();
    
    // İlk soruyu sor
    await askSurveyQuestion(interaction.user, investigation, "1");
    
    await interaction.editReply({ content: "✅ Anket başladı! Lütfen DM'ine bak." });
    
  } catch (err) {
    console.error("[NewAccountButton] Survey start error:", err);
    await interaction.editReply({ content: "❌ Bir hata oluştu." }).catch(() => {});
  }
}

/**
 * Anket sorusunu sorar
 */
async function askSurveyQuestion(user, investigation, step) {
  const questionData = await sendSurveyStep(user, null, step);
  
  if (!questionData) return;
  
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle("📝 Güvenlik Anketi")
    .setDescription(questionData.question)
    .setFooter({ text: "Lütfen aşağıdaki seçeneklerden birini seç veya mesaj olarak cevapla" });
  
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
 * Anket button cevabı
 */
async function handleSurveyAnswer(interaction) {
  try {
    await interaction.deferUpdate();
    
    const parts = interaction.customId.split('_');
    const step = parts[2];
    const answer = parts[3];
    
    // Investigation kaydını bul
    const investigation = await AccountInvestigation.findOne({
      userId: interaction.user.id,
      status: { $in: ['survey_sent', 'survey_completed'] }
    }).sort({ createdAt: -1 });
    
    if (!investigation) {
      await interaction.followUp({ content: "❌ Anket kaydın bulunamadı.", ephemeral: true });
      return;
    }
    
    // Cevabı kaydet
    await saveSurveyAnswer(investigation, step, answer);
    
    // Bir sonraki soruya geç
    const questionData = await sendSurveyStep(interaction.user, null, step);
    const nextStep = questionData?.nextStep;
    
    if (nextStep === 'complete') {
      await completeSurvey(interaction.client, interaction.user, investigation);
    } else {
      await askSurveyQuestion(interaction.user, investigation, nextStep);
    }
    
  } catch (err) {
    console.error("[NewAccountButton] Survey answer error:", err);
  }
}

/**
 * Cevabı kaydet
 */
async function saveSurveyAnswer(investigation, step, answer) {
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
  
  const field = fieldMap[step];
  if (field) {
    // Boolean dönüşümü
    if (['wasHereBefore', 'hasAltAccounts', 'rulesAccepted'].includes(field)) {
      investigation.surveyAnswers[field] = (answer === 'yes');
    } else {
      investigation.surveyAnswers[field] = answer;
    }
    
    await investigation.save();
  }
}

/**
 * Anketi tamamla
 */
async function completeSurvey(client, user, investigation) {
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
    console.error("[NewAccountButton] Complete survey error:", err);
  }
}

/**
 * Soruşturmayı başlat
 */
async function handleInvestigationStart(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const investigationId = interaction.customId.split('_')[2];
    
    await startInvestigationChat(interaction.client, investigationId);
    
    await interaction.editReply({ content: "✅ Soruşturma başladı! Kullanıcı ile DM üzerinden konuşabilirsin." });
    
  } catch (err) {
    console.error("[NewAccountButton] Investigation start error:", err);
    await interaction.editReply({ content: "❌ Bir hata oluştu." }).catch(() => {});
  }
}

/**
 * Temiz karar
 */
async function handleInvestigationClean(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const investigationId = interaction.customId.split('_')[2];
    
    await completeInvestigation(
      interaction.client,
      investigationId,
      'clean',
      interaction.user.id,
      { reason: "Güvenlik kontrolü geçildi" }
    );
    
    await interaction.editReply({ content: "✅ Kullanıcı temiz olarak işaretlendi ve doğrulandı." });
    
  } catch (err) {
    console.error("[NewAccountButton] Clean decision error:", err);
    await interaction.editReply({ content: "❌ Bir hata oluştu." }).catch(() => {});
  }
}

/**
 * Geçici hapis
 */
async function handleInvestigationTempJail(interaction) {
  try {
    const investigationId = interaction.customId.split('_')[2];
    
    // Süre seçim menüsü göster
    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle("🔒 Geçici Hapis Süresi")
      .setDescription("Lütfen hapis süresini seç:");
    
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tempjail_duration_${investigationId}_10`)
        .setLabel("10 dakika")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`tempjail_duration_${investigationId}_30`)
        .setLabel("30 dakika")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`tempjail_duration_${investigationId}_60`)
        .setLabel("1 saat")
        .setStyle(ButtonStyle.Secondary)
    );
    
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tempjail_duration_${investigationId}_360`)
        .setLabel("6 saat")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`tempjail_duration_${investigationId}_720`)
        .setLabel("12 saat")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`tempjail_duration_${investigationId}_1440`)
        .setLabel("1 gün")
        .setStyle(ButtonStyle.Secondary)
    );
    
    await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    
  } catch (err) {
    console.error("[NewAccountButton] Temp jail error:", err);
    await interaction.reply({ content: "❌ Bir hata oluştu.", ephemeral: true }).catch(() => {});
  }
}

/**
 * Temp jail süre seçimi
 */
async function handleTempJailDuration(interaction) {
  try {
    await interaction.deferUpdate();
    
    const parts = interaction.customId.split('_');
    const investigationId = parts[2];
    const duration = parseInt(parts[3]);
    
    await completeInvestigation(
      interaction.client,
      investigationId,
      'temp_jail',
      interaction.user.id,
      { reason: "Şüpheli davranış tespit edildi", duration: duration }
    );
    
    await interaction.followUp({ content: `✅ Kullanıcı ${duration} dakika süreyle hapise alındı.`, ephemeral: true });
    
  } catch (err) {
    console.error("[NewAccountButton] Temp jail duration error:", err);
    await interaction.followUp({ content: "❌ Bir hata oluştu.", ephemeral: true }).catch(() => {});
  }
}

/**
 * Süresiz hapis
 */
async function handleInvestigationPermaJail(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const investigationId = interaction.customId.split('_')[2];
    
    await completeInvestigation(
      interaction.client,
      investigationId,
      'perma_jail',
      interaction.user.id,
      { reason: "Ciddi güvenlik riski tespit edildi" }
    );
    
    await interaction.editReply({ content: "⛓️ Kullanıcı süresiz hapise alındı." });
    
  } catch (err) {
    console.error("[NewAccountButton] Perma jail error:", err);
    await interaction.editReply({ content: "❌ Bir hata oluştu." }).catch(() => {});
  }
}

/**
 * Ban
 */
async function handleInvestigationBan(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const investigationId = interaction.customId.split('_')[2];
    
    await completeInvestigation(
      interaction.client,
      investigationId,
      'banned',
      interaction.user.id,
      { reason: "Güvenlik tehdidi tespit edildi" }
    );
    
    await interaction.editReply({ content: "🚫 Kullanıcı yasaklandı." });
    
  } catch (err) {
    console.error("[NewAccountButton] Ban error:", err);
    await interaction.editReply({ content: "❌ Bir hata oluştu." }).catch(() => {});
  }
}

module.exports = { handleNewAccountButtons };
