'use strict';

const logger = require('../../../utils/logger');

/**
 * AntiNukeEngine — Protects server against mass channel/role deletion, mass bans, and unapproved admin actions.
 */
class AntiNukeEngine {
  constructor() {
    this.actionHistory = new Map(); // guildId:userId -> array of timestamps
    this.threshold = 3; // Max 3 sensitive actions in 10 seconds
    this.timeWindow = 10000; // 10 seconds
    this.whitelistedUsers = new Set(); // Admin whitelist
  }

  /**
   * Records a sensitive audit log action (Channel Delete, Role Delete, Ban) and checks rate threshold
   */
  processAuditAction(guild, executorId, actionType) {
    if (!guild || !executorId || this.whitelistedUsers.has(executorId)) {
      return { triggered: false };
    }

    // Server owner is immune
    if (guild.ownerId === executorId) {
      return { triggered: false };
    }

    const key = `${guild.id}:${executorId}`;
    const now = Date.now();

    if (!this.actionHistory.has(key)) {
      this.actionHistory.set(key, []);
    }

    const timestamps = this.actionHistory.get(key).filter(t => now - t < this.timeWindow);
    timestamps.push(now);
    this.actionHistory.set(key, timestamps);

    if (timestamps.length >= this.threshold) {
      logger.warn(`[AntiNukeEngine] Nuke attempt detected by user ${executorId} in guild ${guild.id}! Action: ${actionType}`);
      this.executeNukeMitigation(guild, executorId, actionType);
      return { triggered: true, actionType, count: timestamps.length };
    }

    return { triggered: false };
  }

  /**
   * Executes anti-nuke defense mitigation (strips roles, bans attacker)
   */
  async executeNukeMitigation(guild, executorId, actionType) {
    try {
      const member = await guild.members.fetch(executorId).catch(() => null);
      if (member && member.manageable) {
        // Strip dangerous roles
        await member.roles.set([], `[AntiNuke Engine] Dangerous activity detected: ${actionType}`).catch(() => {});
        // Ban attacker
        await member.ban({ reason: `[AntiNuke Engine] Nuke/Raid threshold exceeded: ${actionType}` }).catch(() => {});
      }
    } catch (err) {
      logger.error(`[AntiNukeEngine] Mitigation failed for ${executorId}:`, err.message);
    }
  }

  addWhitelist(userId) {
    this.whitelistedUsers.add(userId);
  }

  removeWhitelist(userId) {
    this.whitelistedUsers.delete(userId);
  }
}

module.exports = new AntiNukeEngine();
