/**
 * robloxSecurityV2.js
 * 
 * Roblox Audit Poller "Real-Time Threat & Rank Matrix" V2
 */

const { ButtonStyle } = require("discord.js");
const ComponentsV2Factory = require("../utils/componentsV2Factory");
const TypographyHelper = require("../utils/typographyHelper");
const QuickChartHelper = require("../utils/quickChartHelper");

class RobloxSecurityV2 {
  /**
   * Roblox Güvenlik ve Tehdit Alarmları V2 Payload'ı Üretir
   */
  static buildThreatAlertPayload(threatData = {}) {
    try {
      const {
        actorUsername = "BilinmeyenHesap",
        actorUserId = 0,
        actionType = "EXILE_USER_BATCH",
        threatLevel = "CRITICAL", // CRITICAL, WARNING, INFO
        affectedCount = 0,
        affectedUsers = [],
        groupId = 0,
        rankDistribution = {
          labels: ["Üye", "Moderatör", "Yönetici", "Kurucu"],
          counts: [1, 1, 1, 1],
        },
      } = threatData;

      const isCritical = threatLevel === "CRITICAL";
      const accentColor = isCritical ? 0xFF0000 : threatLevel === "WARNING" ? 0xFEE75C : 0x00FF88;
      const actorAvatarUrl = actorUserId ? `https://www.roblox.com/headshot-thumbnail/image?userId=${actorUserId}&width=420&height=420&format=png` : null;

      // Doughnut chart URL for group rank distribution (safe fallback)
      const labels = rankDistribution?.labels?.length ? rankDistribution.labels : ["Üye", "Yetkili"];
      const counts = rankDistribution?.counts?.length ? rankDistribution.counts : [1, 1];

      const chartUrl = QuickChartHelper.getChartUrl({
        labels: labels,
        data: counts,
        datasetLabel: "Rütbe Dağılımı",
        chartType: "doughnut",
        color: "#FF4757",
        width: 400,
        height: 180,
      });

      // Metin taşmalarını önlemek için ilk 10 kullanıcıyı göster
      const displayedList = (affectedUsers || []).slice(0, 10);
      let affectedUsersText = displayedList.length > 0
        ? displayedList.map((usr, i) => `${i + 1}. ${usr}`).join("\n")
        : "Belirtilmedi";

      if ((affectedUsers || []).length > 10) {
        affectedUsersText += `\n... ve ${affectedUsers.length - 10} kullanıcı daha.`;
      }

      const components = [
        ComponentsV2Factory.section(
          `${TypographyHelper.h2(isCritical ? "🚨 KRİTİK GÜVENLİK ALARMI: ŞÜPHELİ GRUP İŞLEMİ" : "⚠️ ROBLOX DENETİM UYARISI")}\n` +
          `**İşlemi Yapan Hesabı:** [${actorUsername}](https://www.roblox.com/users/${actorUserId}/profile) (\`ID: ${actorUserId}\`)\n` +
          `**Eylem Türü:** \`${actionType}\` | **Etkilenen Kullanıcı:** **${affectedCount || affectedUsers.length} Kişi**`,
          actorAvatarUrl
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(
          `🚨 **Etkilenen Roblox Kullanıcıları Listesi:**\n` +
          TypographyHelper.codeBlock(affectedUsersText, "yaml")
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(`📊 **Anlık Roblox Grup Rütbe Dağılımı:**`),
        ComponentsV2Factory.mediaGallery([chartUrl]),
        ComponentsV2Factory.separator(false),
        ComponentsV2Factory.text(
          TypographyHelper.subtext(
            `Sentara Roblox Threat Matrix • Olay Zamanı: ${TypographyHelper.timestamp(new Date(), "R")} • GroupID: ${groupId}`
          )
        ),
        ComponentsV2Factory.actionRow([
          {
            custom_id: `roblox_lockdown_${groupId}`,
            label: "🔒 Grubu Kilitle / Dondur",
            style: ButtonStyle.Danger,
          },
          {
            custom_id: `roblox_revert_${actorUserId}`,
            label: "🛡️ İşlemi Geri Al & Yetki Düşür",
            style: ButtonStyle.Secondary,
          },
        ]),
      ];

      return ComponentsV2Factory.buildPayload(accentColor, components);
    } catch (err) {
      console.error("[RobloxSecurityV2] Payload üretme hatası:", err);
      // Hata durumunda dahi çökmemesi için güvenli basit V2 yanıtı
      return ComponentsV2Factory.buildPayload(0xFF0000, [
        ComponentsV2Factory.text("🚨 **Roblox Güvenlik Uyarısı İletilirken Bir Hata Oluştu.**")
      ]);
    }
  }
}

module.exports = RobloxSecurityV2;

