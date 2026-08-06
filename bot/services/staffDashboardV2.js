/**
 * staffDashboardV2.js
 * 
 * Yetkili Performans & Mesai "Audit Dashboard" V2
 */

const { ButtonStyle } = require("discord.js");
const ComponentsV2Factory = require("../utils/componentsV2Factory");
const TypographyHelper = require("../utils/typographyHelper");
const QuickChartHelper = require("../utils/quickChartHelper");

class StaffDashboardV2 {
  /**
   * Yetkili Performans Dashboard Payload'ı Üretir
   */
  static buildStaffDashboardPayload(staffData) {
    const {
      userId,
      username,
      avatarUrl,
      roleName = "Kıdemli Moderatör",
      ticketCount = 42,
      modActions = 18,
      voiceHours = 34.5,
      avgResponseTimeMin = 3.8,
      weeklyPerformanceDelta = 15, // %15 artış
      dailyStats = {
        labels: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
        tickets: [5, 8, 4, 12, 6, 3, 4],
        actions: [2, 3, 1, 5, 4, 1, 2],
      },
    } = staffData;

    // QuickChart combo chart URL
    const chartUrl = QuickChartHelper.getChartUrl({
      labels: dailyStats.labels,
      data: dailyStats.tickets,
      datasetLabel: "Çözülen Ticket",
      chartType: "bar",
      color: "#5865F2",
      width: 500,
      height: 180,
    });

    const components = [
      ComponentsV2Factory.section(
        `${TypographyHelper.h2(`👑 Yetkili Audit Dashboard: ${username}`)}\n` +
        `🎭 **Kıdem / Rol:** \`${roleName}\` | 👤 <@${userId}>\n\n` +
        `🎫 **Haftalık Ticket:** **${ticketCount}**  |  🔨 **Mod İşlemleri:** **${modActions}**\n` +
        `🎙️ **Sesli Mesai:** **${voiceHours} Saat**  |  ⏱️ **Ort. Yanıt:** **${avgResponseTimeMin} dk**`,
        avatarUrl
      ),
      ComponentsV2Factory.separator(true),
      ComponentsV2Factory.text(
        `📈 **Haftalık Aktiflik & Performans Grafiği:**`
      ),
      ComponentsV2Factory.mediaGallery([chartUrl]),
      ComponentsV2Factory.separator(false),
      ComponentsV2Factory.text(
        TypographyHelper.subtext(
          `-# Ortalama yanıt süresi ${avgResponseTimeMin} dakika • Geçen haftaya göre %${weeklyPerformanceDelta} daha performanslı • ${TypographyHelper.timestamp(new Date(), "R")}`
        )
      ),
      ComponentsV2Factory.actionRow([
        {
          custom_id: `staff_details_${userId}`,
          label: "🔍 Detaylı İncele",
          style: ButtonStyle.Primary,
        },
        {
          custom_id: `staff_duty_toggle_${userId}`,
          label: "⚡ Mesai Durumu Değiştir",
          style: ButtonStyle.Secondary,
        },
      ]),
    ];

    return ComponentsV2Factory.buildPayload(0x5865F2, components);
  }
}

module.exports = StaffDashboardV2;
