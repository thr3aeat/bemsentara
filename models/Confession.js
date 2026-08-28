'use strict';

const mongoose = require('mongoose');

// 1. İtiraflar Şeması
const confessionSchema = new mongoose.Schema({
  confessionId: { type: Number, required: true, unique: true, index: true },
  authorId: { type: String, required: true, index: true },
  channelId: { type: String, default: null },
  messageId: { type: String, default: null, index: true },
  threadId: { type: String, default: null },
  guildId: { type: String, default: '1367646464804655104' },
  category: { type: String, required: true, default: 'Genel' },
  type: { type: String, enum: ['public', 'anonymous', 'locked'], default: 'anonymous' },
  content: { type: String, required: true, maxlength: 1500 },
  anonymousName: { type: String, default: '🕵️ Anonim Dedektif #01' },
  allowDm: { type: Boolean, default: true },
  password: { type: String, default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  reviewerId: { type: String, default: null },
  reviewReason: { type: String, default: null },
  reactions: {
    shock: { type: Number, default: 0 },
    laugh: { type: Number, default: 0 },
    redflag: { type: Number, default: 0 },
    support: { type: Number, default: 0 }
  },
  userReactions: {
    type: Map,
    of: String,
    default: {}
  }
}, { timestamps: true });

// 2. Canlı Anonim DM Köprüsü (Active Ghost Bridge Sessions)
const confessionSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  confessionId: { type: Number, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  senderId: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'active', 'closed'], default: 'pending' },
  messages: [
    {
      sender: { type: String, enum: ['author', 'sender'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  closedAt: { type: Date, default: null }
}, { timestamps: true });

// 3. İtiraf Kara Liste Şeması
const confessionBlacklistSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  reason: { type: String, default: 'Sistem kurallarını ihlal etme' },
  bannedBy: { type: String, default: 'Otomatik Moderasyon' },
  bannedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 4. İtiraf Sahibi Özel Engelleme Şeması (Author Blocks)
const confessionBlockSchema = new mongoose.Schema({
  authorId: { type: String, required: true, index: true },
  blockedUserId: { type: String, required: true, index: true },
  confessionId: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Confession = mongoose.models.Confession || mongoose.model('Confession', confessionSchema);
const ConfessionSession = mongoose.models.ConfessionSession || mongoose.model('ConfessionSession', confessionSessionSchema);
const ConfessionBlacklist = mongoose.models.ConfessionBlacklist || mongoose.model('ConfessionBlacklist', confessionBlacklistSchema);
const ConfessionBlock = mongoose.models.ConfessionBlock || mongoose.model('ConfessionBlock', confessionBlockSchema);

module.exports = {
  Confession,
  ConfessionSession,
  ConfessionBlacklist,
  ConfessionBlock
};
