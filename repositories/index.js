'use strict';

const User = require('../models/User');
const StaffProgress = require('../models/StaffProgress');
const Ticket = require('../models/Ticket');
const Economy = require('../models/Economy');

/**
 * UserRepository — Repository abstraction layer over MongoDB / Store
 */
class UserRepository {
  static async findByDiscordId(discordId) {
    return User.findOne({ discordId: String(discordId) });
  }

  static async createOrUpdateUser(discordId, data = {}) {
    let user = await User.findOne({ discordId: String(discordId) });
    if (!user) {
      user = new User({ discordId: String(discordId), ...data });
    } else {
      Object.assign(user, data);
    }
    return user.save();
  }
}

/**
 * StaffRepository — Repository abstraction layer for Staff members
 */
class StaffRepository {
  static async findByUserId(userId) {
    return StaffProgress.findOne({ userId: String(userId) });
  }

  static async updateLevel(userId, level) {
    const p = await StaffProgress.findOne({ userId: String(userId) });
    if (p) {
      p.level = level;
      return p.save();
    }
    return null;
  }
}

/**
 * TicketRepository — Repository abstraction layer for Support Tickets
 */
class TicketRepository {
  static async findByTicketId(ticketId) {
    return Ticket.findOne({ ticketId });
  }

  static async findOpenTicketsByUser(userId) {
    return Ticket.find({ userId: String(userId), status: { $ne: 'closed' } });
  }
}

module.exports = {
  UserRepository,
  StaffRepository,
  TicketRepository
};
