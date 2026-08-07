'use strict';

/**
 * Account Transfer Service
 * Moderatörlerin kullanıcı hesaplarını başka Discord hesabına geçirmesi için servis
 */

const { findOne: findUser, create: createUser } = require('../../models/User');
const StaffProgress = require('../../models/StaffProgress');
const Economy = require('../../models/Economy');
const Ticket = require('../../models/Ticket');
const { appMeta, saveStoreNow } = require('../../models/Store');

/**
 * Hesap geçişi yapar - tüm verileri eski hesaptan yeni hesaba aktarır
 * @param {string} oldDiscordId - Eski Discord ID
 * @param {string} newDiscordId - Yeni Discord ID
 * @param {string} newDiscordUsername - Yeni Discord kullanıcı adı
 * @param {string} moderatorId - İşlemi yapan moderatörün Discord ID
 * @param {string} reason - Geçiş sebebi
 * @returns {Promise<Object>} Transfer sonucu
 */
async function transferAccount(oldDiscordId, newDiscordId, newDiscordUsername, moderatorId, reason = 'Hesap geçişi') {
  try {
    // Eski hesabı kontrol et
    const oldUser = await findUser({ discordId: oldDiscordId });
    if (!oldUser) {
      return { success: false, message: 'Eski hesap bulunamadı.' };
    }

    // Yeni hesap zaten kayıtlı mı kontrol et
    const existingNewUser = await findUser({ discordId: newDiscordId });
    if (existingNewUser) {
      return { 
        success: false, 
        message: 'Yeni Discord ID zaten sistemde kayıtlı. Lütfen farklı bir hesap kullanın.' 
      };
    }

    const transferLog = {
      timestamp: new Date(),
      oldDiscordId: oldDiscordId,
      newDiscordId: newDiscordId,
      moderatorId: moderatorId,
      reason: reason,
      transferredData: {}
    };

    // 1. User modeli verisini kopyala
    const newUser = await createUser({
      discordId: newDiscordId,
      discordUsername: newDiscordUsername,
      robloxUsername: oldUser.robloxUsername,
      robloxId: oldUser.robloxId,
      verified: oldUser.verified,
      verifiedAt: oldUser.verifiedAt,
      createdAt: new Date(),
      metadata: {
        ...oldUser.metadata,
        transferredFrom: oldDiscordId,
        transferDate: new Date(),
        transferReason: reason,
        transferredBy: moderatorId
      }
    });
    transferLog.transferredData.user = true;

    // 2. StaffProgress verisini aktar
    const oldStaffProgress = await StaffProgress.findOne({ userId: oldDiscordId });
    if (oldStaffProgress) {
      const newStaffProgress = new StaffProgress({
        userId: newDiscordId,
        name: oldStaffProgress.name,
        level: oldStaffProgress.level,
        rank: oldStaffProgress.rank,
        status: oldStaffProgress.status,
        joinDate: oldStaffProgress.joinDate,
        stats: oldStaffProgress.stats,
        gamification: oldStaffProgress.gamification,
        daily: oldStaffProgress.daily,
        modReports: oldStaffProgress.modReports,
        duty: oldStaffProgress.duty,
        settings: oldStaffProgress.settings,
        metadata: {
          ...oldStaffProgress.metadata,
          transferredFrom: oldDiscordId,
          transferDate: new Date()
        }
      });
      await newStaffProgress.save();
      transferLog.transferredData.staffProgress = true;

      // Eski staff progress'i arşivle
      oldStaffProgress.status = 'transferred';
      oldStaffProgress.metadata = oldStaffProgress.metadata || {};
      oldStaffProgress.metadata.transferredTo = newDiscordId;
      oldStaffProgress.metadata.transferDate = new Date();
      await oldStaffProgress.save();
    }

    // 3. Economy verisini aktar
    const oldEconomy = await Economy.findOne({ userId: oldDiscordId });
    if (oldEconomy) {
      const newEconomy = new Economy({
        userId: newDiscordId,
        balance: oldEconomy.balance,
        bank: oldEconomy.bank,
        totalEarned: oldEconomy.totalEarned,
        inventory: oldEconomy.inventory,
        transactions: oldEconomy.transactions,
        metadata: {
          ...oldEconomy.metadata,
          transferredFrom: oldDiscordId,
          transferDate: new Date()
        }
      });
      await newEconomy.save();
      transferLog.transferredData.economy = true;

      // Eski economy'yi sıfırla veya arşivle
      oldEconomy.balance = 0;
      oldEconomy.bank = 0;
      oldEconomy.metadata = oldEconomy.metadata || {};
      oldEconomy.metadata.transferredTo = newDiscordId;
      oldEconomy.metadata.transferDate = new Date();
      await oldEconomy.save();
    }

    // 4. Ticket'ları güncelle (sadece userId'yi değiştir, tüm geçmişi koru)
    const userTickets = await Ticket.find({ userId: oldDiscordId });
    for (const ticket of userTickets) {
      ticket.userId = newDiscordId;
      ticket.metadata = ticket.metadata || {};
      ticket.metadata.userIdTransferred = true;
      ticket.metadata.oldUserId = oldDiscordId;
      await ticket.save();
    }
    transferLog.transferredData.tickets = userTickets.length;

    // 5. appMeta'ya transfer logu kaydet
    if (appMeta) {
      const transferHistoryRecord = appMeta.findOne({ key: 'accountTransferHistory' });
      if (transferHistoryRecord) {
        transferHistoryRecord.transfers = transferHistoryRecord.transfers || [];
        transferHistoryRecord.transfers.push(transferLog);
        transferHistoryRecord.save();
      } else {
        appMeta.create({
          key: 'accountTransferHistory',
          transfers: [transferLog]
        });
      }
      saveStoreNow();
    }

    // 6. Eski User'ı arşivle (sil veya işaretle)
    oldUser.metadata = oldUser.metadata || {};
    oldUser.metadata.transferredTo = newDiscordId;
    oldUser.metadata.transferDate = new Date();
    oldUser.metadata.transferReason = reason;
    oldUser.save();

    return {
      success: true,
      message: 'Hesap geçişi başarıyla tamamlandı.',
      transferLog: transferLog,
      newUser: {
        discordId: newUser.discordId,
        discordUsername: newUser.discordUsername,
        robloxUsername: newUser.robloxUsername
      }
    };

  } catch (error) {
    console.error('[AccountTransfer] Transfer error:', error);
    return {
      success: false,
      message: `Hesap geçişi sırasında hata oluştu: ${error.message}`
    };
  }
}

/**
 * Transfer geçmişini getirir
 * @param {number} limit - Maksimum kayıt sayısı
 * @returns {Promise<Array>} Transfer geçmişi
 */
async function getTransferHistory(limit = 50) {
  try {
    if (!appMeta) return [];

    const transferHistoryRecord = appMeta.findOne({ key: 'accountTransferHistory' });
    if (!transferHistoryRecord || !transferHistoryRecord.transfers) return [];

    const transfers = transferHistoryRecord.transfers || [];
    return transfers.slice(-limit).reverse(); // Son N kaydı ters sırada getir
  } catch (error) {
    console.error('[AccountTransfer] History fetch error:', error);
    return [];
  }
}

/**
 * Belirli bir kullanıcının transfer geçmişini getirir
 * @param {string} discordId - Discord ID
 * @returns {Promise<Array>} Kullanıcının transfer geçmişi
 */
async function getUserTransferHistory(discordId) {
  try {
    const allHistory = await getTransferHistory(1000);
    return allHistory.filter(t => 
      t.oldDiscordId === discordId || t.newDiscordId === discordId
    );
  } catch (error) {
    console.error('[AccountTransfer] User history fetch error:', error);
    return [];
  }
}

module.exports = {
  transferAccount,
  getTransferHistory,
  getUserTransferHistory
};
