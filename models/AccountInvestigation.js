const mongoose = require("mongoose");

const accountInvestigationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  accountAge: { type: Number }, // saat cinsinden
  riskScore: { type: Number, default: 0 }, // 0-100 arası
  
  // Anket cevapları
  surveyAnswers: {
    username: String,
    howFound: String, // "Davet linki", "Arkadaş", "Sosyal medya", "Diğer"
    joinPurpose: String,
    wasHereBefore: Boolean,
    hasAltAccounts: Boolean,
    rulesAccepted: Boolean,
    additionalInfo: String,
    // Ek sorular
    whyNewAccount: String,
    hasMicrophone: String,
    age: String,
  },
  
  surveyCompletedAt: Date,
  
  // Moderatör bilgileri
  assignedModeratorId: String,
  assignedAt: Date,
  
  // Soruşturma
  investigationStartedAt: Date,
  investigationMessages: [{
    from: { type: String, enum: ['moderator', 'user'] },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  questionCount: { type: Number, default: 0 },
  
  // Karar
  decision: { 
    type: String, 
    enum: ['pending', 'clean', 'temp_jail', 'perma_jail', 'banned'],
    default: 'pending'
  },
  decisionReason: String,
  tempJailDuration: Number, // dakika cinsinden
  tempJailEndsAt: Date,
  decidedAt: Date,
  decidedBy: String,
  
  // Meta
  status: { 
    type: String, 
    enum: ['survey_sent', 'survey_completed', 'assigned', 'investigating', 'completed'],
    default: 'survey_sent'
  },
  
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

accountInvestigationSchema.index({ userId: 1, guildId: 1 });
accountInvestigationSchema.index({ status: 1 });
accountInvestigationSchema.index({ assignedModeratorId: 1 });

module.exports = mongoose.model("AccountInvestigation", accountInvestigationSchema);
