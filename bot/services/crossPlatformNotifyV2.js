/**
 * crossPlatformNotifyV2.js
 * 
 * Telegram & Çapraz Platform Bildirim Senkronizasyonu V2
 */

class CrossPlatformNotifyV2 {
  /**
   * Discord V2 mesaj veya olay verisini Telegram MarkdownV2 formatına dönüştürür
   */
  static formatForTelegram(eventData = {}) {
    const {
      title = "Bildirim",
      description = "",
      user = "Kullanıcı",
      actionType = "SİSTEM_OLAYI",
      timestamp = new Date().toISOString(),
    } = eventData;

    // Telegram MarkdownV2 özel karakter kaçışları
    const escapeTg = (text) => text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');

    return (
      `🚀 *Sentara Cross\\-Platform Notification*\n\n` +
      `📌 *Başlık:* ${escapeTg(title)}\n` +
      `⚡ *Eylem:* \`${escapeTg(actionType)}\`\n` +
      `👤 *Kullanıcı:* ${escapeTg(user)}\n\n` +
      `📝 *Açıklama:*\n${escapeTg(description)}\n\n` +
      `⏱️ *Zaman:* \`${escapeTg(timestamp)}\``
    );
  }

  /**
   * Webhook veya Dashboard için JSON payload'ı üretir
   */
  static formatForWebhook(eventData = {}) {
    return {
      service: "Sentara Cross-Platform Notification Engine",
      version: "V2.0",
      timestamp: new Date().toISOString(),
      event: {
        title: eventData.title || "Bildirim",
        actionType: eventData.actionType || "INFO",
        user: eventData.user || "System",
        description: eventData.description || "",
        metadata: eventData.metadata || {},
      },
    };
  }
}

module.exports = CrossPlatformNotifyV2;
