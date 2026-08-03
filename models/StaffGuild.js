'use strict';

const mongoose = require('mongoose');

/**
 * Personel Kulüpleri & Lonca Savaşları Modeli (Guild / Faction System)
 */
const staffGuildSchema = new mongoose.Schema({
  guildName: { type: String, required: true, unique: true, index: true },
  tag: { type: String, required: true, uppercase: true }, // Örn: [KRF], [GCN]
  leaderId: { type: String, required: true, index: true },
  members: { type: [String], default: [] }, // Max 5 kişi
  treasury: { type: Number, default: 0 }, // Ortak EkoCoin Hazinesi
  diamonds: { type: Number, default: 0 }, // Ortak Elmas Hazinesi
  level: { type: Number, default: 1 }, // Klan Binası Seviyesi (1-10)
  weeklyPoints: { type: Number, default: 0 }, // Haftalık Lonca Puanı
  isCityRuler: { type: Boolean, default: false } // Bu hafta "Şehrin Hakimi" unvanı var mı?
}, { timestamps: true });

const StaffGuild = mongoose.models.StaffGuild || mongoose.model('StaffGuild', staffGuildSchema);

module.exports = StaffGuild;
