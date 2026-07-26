'use strict';

const mongoose = require('mongoose');

const systemUsageSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, index: true }, // Format: YYYY-MM-DD
  totalCommands: { type: Number, default: 0 },
  totalButtonClicks: { type: Number, default: 0 },
  totalModalSubmits: { type: Number, default: 0 },

  // Command breakdown: { "s!sil": 12, "s!hapis": 5, "/dogrula": 20 }
  commandCounts: { type: Map, of: Number, default: {} },

  // Button breakdown: { "verify_roblox_start": 30, "ticket_create": 15 }
  buttonCounts: { type: Map, of: Number, default: {} },

  // System category breakdown: { "Ticket": 40, "Moderation": 25, "Roblox": 35 }
  categoryCounts: { type: Map, of: Number, default: {} },

  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const SystemUsage = mongoose.models.SystemUsage || mongoose.model('SystemUsage', systemUsageSchema);
module.exports = SystemUsage;
