/**
 * voiceMuteDetector.js
 * 
 * Ses kanalında susturulma vs. kendi kendini susturma ayırt eden servis.
 * Audit log'ları detaylı şekilde inceleyerek sadece gerçek moderator susturma işlemlerini tespit eder.
 */

const { AuditLogEvent } = require("discord.js");

/**
 * Ses kanalında susturulup susturulmadığını kontrol eder
 * @param {VoiceState} newState - Yeni voice state
 * @param {Guild} guild - Guild nesnesi
 * @returns {Promise<{isMuted: boolean, moderator: string, moderatorObj: Object|null}>}
 */
async function detectVoiceMute(newState, guild) {
  try {
    // Audit log'u al (son 10 saniye içerisindeki entries)
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberUpdate,
      limit: 10,
    }).catch(() => null);

    if (!auditLogs || auditLogs.entries.size === 0) {
      // Audit log'ta kayıt yok = kendi kendini susturmuş
      console.log(
        `[voiceMuteDetector] No audit log found for ${newState.member?.user?.tag}. Likely self-mute.`
      );
      return { isMuted: false, moderator: null, moderatorObj: null };
    }

    // Hedef kullanıcı için en yeni mute entry'yi bul
    const entries = Array.from(auditLogs.entries.values());
    const targetEntry = entries.find((entry) => {
      return (
        entry.target?.id === newState.member.id &&
        Date.now() - entry.createdTimestamp < 10000 && // 10 saniye içinde
        entry.changes?.some(c => c.key === 'mute' && c.new === true) // Mute değişmesi
      );
    });

    if (!targetEntry || !targetEntry.executor) {
      console.log(
        `[voiceMuteDetector] No mute action found for ${newState.member?.user?.tag}. Likely self-mute.`
      );
      return { isMuted: false, moderator: null, moderatorObj: null };
    }

    const moderator = targetEntry.executor;

    // Kendi kendini susturmuş ise
    if (moderator.id === newState.member.id) {
      console.log(
        `[voiceMuteDetector] Self-mute detected: ${newState.member?.user?.tag} kendini susturdu`
      );
      return { isMuted: false, moderator: null, moderatorObj: null };
    }

    // Başka birisi tarafından susturulmuş → Gerçek mute!
    console.log(
      `[voiceMuteDetector] Mute detected: ${newState.member?.user?.tag} was muted by ${moderator.tag}`
    );
    return {
      isMuted: true,
      moderator: moderator.tag,
      moderatorObj: moderator,
    };
  } catch (err) {
    console.warn(
      `[voiceMuteDetector] Error detecting voice mute: ${err.message}`
    );
    return { isMuted: false, moderator: null, moderatorObj: null };
  }
}

/**
 * Ses kanalında sağırlaştırma vs. kendi kendini sağırlaştırma ayırt eden servis
 * @param {VoiceState} newState - Yeni voice state
 * @param {Guild} guild - Guild nesnesi
 * @returns {Promise<{isDeafened: boolean, moderator: string, moderatorObj: Object|null}>}
 */
async function detectVoiceDeafen(newState, guild) {
  try {
    // Audit log'u al (son 10 saniye içerisindeki entries)
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberUpdate,
      limit: 10,
    }).catch(() => null);

    if (!auditLogs || auditLogs.entries.size === 0) {
      // Audit log'ta kayıt yok = kendi kendini sağırlaştırmış
      console.log(
        `[voiceMuteDetector] No audit log found for ${newState.member?.user?.tag}. Likely self-deafen.`
      );
      return { isDeafened: false, moderator: null, moderatorObj: null };
    }

    // Hedef kullanıcı için en yeni deafen entry'yi bul
    const entries = Array.from(auditLogs.entries.values());
    const targetEntry = entries.find((entry) => {
      return (
        entry.target?.id === newState.member.id &&
        Date.now() - entry.createdTimestamp < 10000 && // 10 saniye içinde
        (
          entry.changes?.some(c => c.key === 'deaf' && c.new === true) || // Deafen değişmesi (eski)
          entry.changes?.some(c => c.key === 'communication_disabled_until') // Yeni Discord versiyonu
        )
      );
    });

    if (!targetEntry || !targetEntry.executor) {
      console.log(
        `[voiceMuteDetector] No deafen action found for ${newState.member?.user?.tag}. Likely self-deafen.`
      );
      return { isDeafened: false, moderator: null, moderatorObj: null };
    }

    const moderator = targetEntry.executor;

    // Kendi kendini sağırlaştırmış ise
    if (moderator.id === newState.member.id) {
      console.log(
        `[voiceMuteDetector] Self-deafen detected: ${newState.member?.user?.tag} kendini sağırlaştırdı`
      );
      return { isDeafened: false, moderator: null, moderatorObj: null };
    }

    // Başka birisi tarafından sağırlaştırılmış → Gerçek deafen!
    console.log(
      `[voiceMuteDetector] Deafen detected: ${newState.member?.user?.tag} was deafened by ${moderator.tag}`
    );
    return {
      isDeafened: true,
      moderator: moderator.tag,
      moderatorObj: moderator,
    };
  } catch (err) {
    console.warn(
      `[voiceMuteDetector] Error detecting voice deafen: ${err.message}`
    );
    return { isDeafened: false, moderator: null, moderatorObj: null };
  }
}

module.exports = { detectVoiceMute, detectVoiceDeafen };
