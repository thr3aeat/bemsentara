const mongoose = require('mongoose');

const moderationConfirmSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    actorId: { type: String, required: true }, // işlem yapan moderatör
    targetId: { type: String, required: true }, // işlem gören moderatör
    actionType: { type: String, enum: ['mute', 'deafen', 'kick'], required: true },
    reason: { type: String, default: null },
    
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    acceptedBy: { type: String, default: null },
    acceptedAt: { type: Date, default: null },
    rejectedBy: { type: String, default: null },
    rejectedAt: { type: Date, default: null },
    modChannelId: { type: String, default: null }, // Moderatör DM'i için channel ID
    
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ModerationConfirm', moderationConfirmSchema);
