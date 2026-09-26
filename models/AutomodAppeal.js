'use strict';

const mongoose = require('mongoose');

const automodAppealSchema = new mongoose.Schema({
  appealId: { type: String, required: true, unique: true, index: true },
  incidentId: { type: String, required: true, index: true },
  guildId: { type: String, required: true, default: '1367646464804655104' },
  channelId: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, default: '' },
  userTag: { type: String, default: '' },

  // Orijinal ihlal bilgisi
  blockedContent: { type: String, default: '' },
  matchedWord: { type: String, default: '' },
  severity: { type: String, default: '' },
  timeoutDurationMs: { type: Number, default: null },

  // Kullanıcının itiraz mesajı
  appealMessage: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },

  // EkoAI inceleme sonucu
  aiReviewed: { type: Boolean, default: false },
  aiDecision: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  aiReasoning: { type: String, default: '' },
  aiReviewedAt: { type: Date, default: null },

  // Durum
  status: {
    type: String,
    enum: [
      'pending_ai',
      'approved_by_ai',
      'rejected_by_ai_pending_mod',
      'approved_by_mod',
      'rejected_by_mod'
    ],
    default: 'pending_ai',
    index: true
  },

  // Discord Yetkili Kanalı Mesajı
  discordMessageId: { type: String, default: null },
  discordChannelId: { type: String, default: '1518684031275761719' },

  // Moderatör inceleme sonucu
  moderatorId: { type: String, default: null },
  moderatorTag: { type: String, default: null },
  moderatorDecisionAt: { type: Date, default: null },

  // Telegram uyarısı
  telegramAlertSent: { type: Boolean, default: false },
  telegramAlertSentAt: { type: Date, default: null }
}, { timestamps: true });

const AutomodAppeal = mongoose.models.AutomodAppeal
  || mongoose.model('AutomodAppeal', automodAppealSchema);

module.exports = AutomodAppeal;
