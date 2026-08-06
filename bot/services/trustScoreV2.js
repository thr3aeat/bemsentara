/**
 * trustScoreV2.js
 * 
 * Gelişmiş Kullanıcı Güven Skoru & Anti-Abuse Radar V2
 */

const { ButtonStyle } = require("discord.js");
const ComponentsV2Factory = require("../utils/componentsV2Factory");
const TypographyHelper = require("../utils/typographyHelper");
const QuickChartHelper = require("../utils/quickChartHelper");

class TrustScoreV2 {
  /**
   * Kullanıcı Güven Skoru Raporu Payload'ı Üretir
   */
  static buildTrustScorePayload(trustData = {}) {
    try {
      const {
        userId = "0",
        username = "Kullanıcı",
        avatarUrl = null,
        trustScore = 88, // 0 - 100
        accountAgeDays = 450,
        isRobloxVerified = true,
        robloxUsername = "RobloxUser",
        punishmentCount = 0,
        isAltRisk = false,
        linkedAlts = [],
      } = trustData;

      // Accent color engine (High Green 80+, Medium Yellow 40-79, Low Red 0-39)
      const accentColor = trustScore >= 80 ? 0x00FF88 : trustScore >= 40 ? 0xFEE75C : 0xFF0000;
      const riskStatusTitle = trustScore >= 80 ? "DÜŞÜK RİSK (GÜVENİLİR ÜYE) ✅" : trustScore >= 40 ? "ORTA RİSK (ŞÜPHELİ KULLANICI) ⚠️" : "YÜKSEK RİSK (TEHDİT POTANSİYELİ) 🚨";

      // Doughnut chart representing score vs risk deficit
      const chartUrl = QuickChartHelper.getChartUrl({
        labels: ["Güven Puanı", "Risk Eksiltmesi"],
        data: [trustScore, 100 - trustScore],
        datasetLabel: "Güven Analizi",
        chartType: "doughnut",
        color: trustScore >= 80 ? "#00FF88" : trustScore >= 40 ? "#FEE75C" : "#FF0000",
        width: 400,
        height: 180,
      });

      const altInfoText = isAltRisk && linkedAlts.length > 0
        ? `⚠️ **Tespit Edilen Yan Hesaplar:** ${linkedAlts.map(a => `<@${a}>`).join(", ")}`
        : "✅ Herhangi bir yan hesap (alt account) eşleşmesi bulunamadı.";

      const components = [
        ComponentsV2Factory.section(
          `${TypographyHelper.h2(`🛡️ Kullanıcı Güven Analizi: ${username}`)}\n` +
          `👤 **Kullanıcı:** <@${userId}> (\`ID: ${userId}\`)\n` +
          `📊 **Güven Skoru:** **${trustScore} / 100** — Durum: **${riskStatusTitle}**\n` +
          `🎮 **Roblox Hesabı:** ${isRobloxVerified ? `[${robloxUsername}](https://www.roblox.com/users/profile) ✅` : "Doğrulanmamış ❌"}\n` +
          `📅 **Hesap Yaşı:** **${accountAgeDays} Gün**  |  🔨 **Ceza Geçmişi:** **${punishmentCount} Adet**`,
          avatarUrl
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(
          `🔍 **Anti-Abuse Radar Yan Hesap Tespiti:**\n${altInfoText}`
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(`📈 **Güven Skoru Analitik Grafiği:**`),
        ComponentsV2Factory.mediaGallery([chartUrl]),
        ComponentsV2Factory.separator(false),
        ComponentsV2Factory.text(
          TypographyHelper.subtext(`Sentara Anti-Abuse Trust Radar • Tarih: ${TypographyHelper.timestamp(new Date(), "R")}`)
        ),
        ComponentsV2Factory.actionRow([
          {
            custom_id: `trust_whitelist_${userId}`,
            label: "🛡️ Güvenli Listeye Al",
            style: ButtonStyle.Success,
          },
          {
            custom_id: `trust_quarantine_${userId}`,
            label: "🚨 Karantinaya Al / Mute",
            style: ButtonStyle.Danger,
          },
        ]),
      ];

      return ComponentsV2Factory.buildPayload(accentColor, components);
    } catch (err) {
      console.error("[TrustScoreV2] Payload üretme hatası:", err);
      return ComponentsV2Factory.buildPayload(0xED4245, [
        ComponentsV2Factory.text("⚠️ **Güven Skoru Arayüzü Yüklenirken Bir Hata Oluştu.**")
      ]);
    }
  }
}

module.exports = TrustScoreV2;
