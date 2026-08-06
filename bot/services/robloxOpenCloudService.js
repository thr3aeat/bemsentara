const axios = require("axios");
const StaffProgress = require("../../models/StaffProgress");
const robloxGroupManager = require("./robloxGroupManager");

/**
 * Roblox Open Cloud & Otomatik Terfi (Auto Rank-Up) Servisi
 */
class RobloxOpenCloudService {
  /**
   * Roblox Open Cloud Messaging API ile oyundaki canlı sunuculara mesaj / duyuru yayını yapar
   */
  static async publishInGameMessage(topic = "ServerAnnouncement", messageData = {}) {
    const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY;
    const universeId = process.env.ROBLOX_UNIVERSE_ID;

    if (!apiKey || !universeId) {
      console.log("[RobloxOpenCloud] API Key veya Universe ID yapılandırılmamış, simüle ediliyor.");
      return { success: true, simulated: true };
    }

    try {
      const url = `https://apis.roblox.com/messaging-service/v1/universes/${universeId}/topics/${topic}`;
      const response = await axios.post(
        url,
        { message: JSON.stringify(messageData) },
        {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json"
          }
        }
      );
      return { success: response.status === 200 };
    } catch (error) {
      console.error("[RobloxOpenCloud] Yayınlama hatası:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Kotasını Dolduran Yetkilileri Otomatik Terfi Ettirme Pipeline'ı (Auto Rank-Up)
   */
  static async checkAndAutoPromoteStaff(guildId) {
    const staffList = await StaffProgress.find({ guildId });
    if (!staffList || staffList.length === 0) return [];

    const promoted = [];

    for (const staff of staffList) {
      // Şartlar: Roblox Doğrulaması Var + Günlük Görevler Tamamlandı + Seviye < 4
      if (staff.robloxVerified && staff.daily && staff.daily.chosenTaskCompleted && staff.level < 4) {
        const oldLevel = staff.level;
        staff.level += 1;
        await staff.save();

        promoted.push({
          userId: staff.userId,
          oldLevel: oldLevel,
          newLevel: staff.level
        });

        // Roblox Grubunda Terfi İşlemi (Varsa Roblox ID'si)
        if (staff.robloxId) {
          try {
            await robloxGroupManager.setRankByUserId(staff.robloxId, staff.level);
          } catch (e) {
            console.error(`[RobloxAutoPromote] User ${staff.robloxId} rank değiştirme hatası:`, e.message);
          }
        }
      }
    }

    return promoted;
  }
}

module.exports = RobloxOpenCloudService;
