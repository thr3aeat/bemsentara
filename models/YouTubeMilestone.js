'use strict';

const mongoose = require('mongoose');

const youTubeMilestoneSchema = new mongoose.Schema({
  channelHandle: {
    type: String,
    required: true,
    unique: true,
    default: '@eko8yildiz'
  },
  lastSubscribers: {
    type: Number,
    default: 0
  },
  lastViews: {
    type: Number,
    default: 0
  },
  reachedSubMilestones: {
    type: [Number],
    default: []
  },
  reachedViewMilestones: {
    type: [Number],
    default: []
  },
  lastCheckedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.models.YouTubeMilestone || mongoose.model('YouTubeMilestone', youTubeMilestoneSchema);
