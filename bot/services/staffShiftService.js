'use strict';

const { startDuty, endDuty, getDutyStatus, handleDutyButton } = require('./staffDutyService');

/**
 * StaffShiftService - Deprecated & Forwarded to StaffDutyService
 * Vardiya sistemi kaldırılmış, tüm işlemler gelişmiş Nöbet Sistemine aktarılmıştır.
 */
class StaffShiftService {
  static async getActiveShift(userId, guildId) {
    const StaffProgress = require('../../models/StaffProgress');
    const p = await StaffProgress.findOne({ userId, 'duty.isActive': true });
    return p ? p.duty : null;
  }

  static async startShift(interaction) {
    return startDuty(interaction, interaction.client);
  }

  static async stopShift(interaction) {
    interaction.customId = 'btn_duty_end';
    return handleDutyButton(interaction);
  }

  static async getShiftStatus(interaction) {
    return getDutyStatus(interaction);
  }
}

module.exports = StaffShiftService;
