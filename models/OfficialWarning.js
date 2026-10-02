'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const officialWarningSchema = new mongoose.Schema({
  caseNo: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  channelId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  guildId: { 
    type: String, 
    required: true 
  },
  targetUserId: { 
    type: String, 
    required: true, 
    index: true 
  },
  creatorId: { 
    type: String, 
    required: true 
  },
  founderId: { 
    type: String, 
    default: '1031620522406072350' 
  },
  assignedStaffIds: [{ 
    type: String 
  }],
  reason: { 
    type: String, 
    required: true 
  },
  ruleArticle: { 
    type: String, 
    default: 'Madde 14 - Disiplin ve Topluluk Huzuru Yönergesi' 
  },
  customNotes: { 
    type: String, 
    default: '' 
  },
  status: {
    type: String,
    enum: ['PENDING_ACCEPTANCE', 'PAGE_REVIEW', 'AWAITING_SIGNATURE', 'SIGNED', 'REJECTED', 'CLOSED'],
    default: 'PENDING_ACCEPTANCE',
    index: true
  },
  currentPage: { 
    type: Number, 
    default: 1 
  },
  signToken: { 
    type: String, 
    unique: true, 
    index: true,
    default: () => crypto.randomBytes(24).toString('hex')
  },
  tokenExpiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 saat geçerli
  },
  signedAt: { 
    type: Date, 
    default: null 
  },
  signatureImage: { 
    type: String, 
    default: null 
  },
  signerIp: { 
    type: String, 
    default: null 
  },
  signerUserAgent: { 
    type: String, 
    default: null 
  },
  syncEnabled: { 
    type: Boolean, 
    default: true 
  },
  messages: [{
    senderId: String,
    senderName: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Static helper to generate next Case Number, e.g. "NO.06546"
officialWarningSchema.statics.generateCaseNo = async function() {
  for (let i = 0; i < 10; i++) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const candidate = `NO.${randomDigits}`;
    if (!this.db || this.db.readyState !== 1) {
      return candidate;
    }
    const exists = await this.exists({ caseNo: candidate });
    if (!exists) return candidate;
  }
  return `NO.${Date.now().toString().slice(-5)}`;
};

const OfficialWarning = mongoose.models.OfficialWarning 
  || mongoose.model('OfficialWarning', officialWarningSchema);

module.exports = OfficialWarning;
