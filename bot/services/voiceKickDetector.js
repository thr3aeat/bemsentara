/**
 * voiceKickDetector.js
 * 
 * Ses kanalından atılma vs. gönüllü ayrılışı ayırt eden servis.
 * Audit log'ları detaylı şekilde inceleyerek sadece gerçek moderator atılışlarını tespit eder.
 */

const { AuditLogEvent } = require("discord.js");

/**
 * Ses kanalından atılıp atılmadığını kontrol eder
 * @param {VoiceState} newState - Yeni voice state
 * @param {Guild} guild - Guild nesnesi
 * @returns {Promise<{isKicked: boolean, moderator: string, moderatorObj: Object|null}>}
 */
async function detectVoiceKick(newState, guild) {
  try {
    // Audit log'u al (son 15 saniye içerisindeki entries)
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberDisconnect, // Doğru event tipi: MemberDisconnect
      limit: 5,
    }).catch(() => null);

    if (!auditLogs || auditLogs.entries.size === 0) {
      // Audit log'ta kayıt yok = gönüllü ayrılış
      console.log(
        `[voiceKickDetector] No disconnect audit log found for ${newState.member?.user?.tag}. Likely voluntary leave.`
      );
      return { isKicked: false, moderator: null, moderatorObj: null };
    }

    // Hedef kullanıcı için en yeni disconnect entry'yi bul
    const entries = Array.from(auditLogs.entries.values());
    const targetEntry = entries.find((entry) => {
      return (
        entry.target?.id === newState.member.id &&
        Date.now() - entry.createdTimestamp < 15000 // 15 saniye içinde
      );
    });

    if (!targetEntry || !targetEntry.executor) {
      console.log(
        `[voiceKickDetector] No disconnect action found for ${newState.member?.user?.tag}. Likely voluntary leave.`
      );
      return { isKicked: false, moderator: null, moderatorObj: null };
    }

    // Moderator kendisi tarafından atılmışsa → Self-kick değil, gerçek kick
    const moderator = targetEntry.executor;
    
    if (moderator.id === newState.member.id) {
      // Kendi kendini bırakmış (bu audit log'ta self-kick olarak görülüyor)
      console.log(
        `[voiceKickDetector] Self-leave detected: ${newState.member?.user?.tag} kendisi ses kanalından çıktı`
      );
      return { isKicked: false, moderator: null, moderatorObj: null };
    }

    // Başka birisi tarafından atılmış → Gerçek kick!
    console.log(
      `[voiceKickDetector] Kick detected: ${newState.member?.user?.tag} was kicked by ${moderator.tag}`
    );
    return {
      isKicked: true,
      moderator: moderator.tag,
      moderatorObj: moderator,
    };
  } catch (err) {
    console.warn(
      `[voiceKickDetector] Error detecting voice kick: ${err.message}`
    );
    return { isKicked: false, moderator: null, moderatorObj: null };
  }
}

module.exports = { detectVoiceKick };
