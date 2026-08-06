/**
 * tempVoiceV2.js
 * 
 * Dynamic TempVoice & Sesli Kanal Yönetim Arayüzü V2
 */

const { ButtonStyle } = require("discord.js");
const ComponentsV2Factory = require("../utils/componentsV2Factory");
const TypographyHelper = require("../utils/typographyHelper");

class TempVoiceV2 {
  /**
   * Özel Ses Kanalı Kontrol Paneli Payload'ı Üretir
   */
  static buildVoiceControlPayload(channelData = {}) {
    try {
      const {
        channelId = "0",
        channelName = "🔊 Özel Ses Odası",
        ownerId = "0",
        ownerTag = "Kullanıcı",
        userCount = 1,
        userLimit = 5,
        isLocked = false,
        connectedUsers = [],
        createdAt = Date.now(),
      } = channelData;

      const accentColor = isLocked ? 0xED4245 : 0x57F287;
      const lockStatusText = isLocked ? "🔒 KİLİTLİ (Özel)" : "🔓 AÇIK (Herkese Açık)";

      const membersListText = (connectedUsers || []).length > 0
        ? connectedUsers.map((u, i) => `${i + 1}. <@${u}>`).join("\n")
        : "Henüz başka üye katılmadı.";

      const components = [
        ...ComponentsV2Factory.headerBlock(`Ses Kanalı Kontrol Paneli: ${channelName}`, "🎙️"),
        ComponentsV2Factory.section(
          `👑 **Oda Sahibi:** <@${ownerId}> (\`${ownerTag}\`)\n` +
          `📊 **Kullanıcı Sayısı:** **${userCount} / ${userLimit || "Sınırsız"}**\n` +
          `🛡️ **Erişim Durumu:** **${lockStatusText}**\n` +
          `⏱️ **Oda Oluşturulma:** ${TypographyHelper.timestamp(createdAt, "R")}`
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(
          `👥 **Odadaki Üyeler Listesi:**\n${membersListText}`
        ),
        ComponentsV2Factory.separator(false),
        ComponentsV2Factory.text(
          TypographyHelper.subtext(`Sentara TempVoice Automation • Kanal ID: ${channelId}`)
        ),
        ComponentsV2Factory.actionRow([
          {
            custom_id: `tempvoice_lock_${channelId}`,
            label: isLocked ? "🔓 Kilit Aç" : "🔒 Odayı Kilitle",
            style: isLocked ? ButtonStyle.Success : ButtonStyle.Danger,
          },
          {
            custom_id: `tempvoice_limit_${channelId}`,
            label: "👥 Limit Değiştir",
            style: ButtonStyle.Primary,
          },
          {
            custom_id: `tempvoice_rename_${channelId}`,
            label: "✏️ İsim Değiştir",
            style: ButtonStyle.Secondary,
          },
        ]),
        ComponentsV2Factory.actionRow([
          {
            custom_id: `tempvoice_kick_${channelId}`,
            label: "🚫 Odadan Kullanıcı At",
            style: ButtonStyle.Danger,
          },
          {
            custom_id: `tempvoice_transfer_${channelId}`,
            label: "👑 Sahiplik Devret",
            style: ButtonStyle.Secondary,
          },
        ]),
      ];

      return ComponentsV2Factory.buildPayload(accentColor, components);
    } catch (err) {
      console.error("[TempVoiceV2] Payload üretme hatası:", err);
      return ComponentsV2Factory.buildPayload(0xED4245, [
        ComponentsV2Factory.text("⚠️ **Ses Kontrol Paneli Yüklenirken Bir Hata Oluştu.**")
      ]);
    }
  }
}

module.exports = TempVoiceV2;
