const mongoose = require('mongoose');

const mutationSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    targetUserId: { type: String, required: true },
    moderatorUserId: { type: String, required: true },
    actionType: { type: String, enum: ['mute', 'deafen', 'kick'], required: true },
    reason: { type: String, default: null },
    duration: { type: Number, default: null }, // mute süresi (ms)
    
    // İtiraz bilgileri
    appealReason: { type: String, default: null },
    appealedAt: { type: Date, default: null },
    
    // Karar bilgileri
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: String, default: null },
    appealAccepted: { type: Boolean, default: null },
    
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mutation', mutationSchema);
