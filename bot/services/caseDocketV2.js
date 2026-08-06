/**
 * caseDocketV2.js
 * 
 * Mahkeme ve İfade Sistemi V2 - Interactive Case Docket
 */

const { ButtonStyle } = require("discord.js");
const ComponentsV2Factory = require("../utils/componentsV2Factory");
const TypographyHelper = require("../utils/typographyHelper");

class CaseDocketV2 {
  /**
   * Duruma göre Renk Çubuğu Accent Color ve İkon belirler
   */
  static getStatusConfig(status) {
    switch (status?.toUpperCase()) {
      case "ONGOING":
      case "DEVAM_EDIYOR":
        return { color: 0xFEE75C, emoji: "⚖️", title: "DAVA DEVAM EDİYOR" };
      case "GUILTY":
      case "SUCLU":
        return { color: 0xED4245, emoji: "🔨", title: "SUÇLU BULUNDU - KARAR ONAYLANDI" };
      case "ACQUITTED":
      case "BERAAT":
        return { color: 0x57F287, emoji: "🛡️", title: "BERAAT ETTİ - DOSYA KAPATILDI" };
      default:
        return { color: 0x5865F2, emoji: "📜", title: "DAVA DOSYASI INCELEMEDE" };
    }
  }

  /**
   * Tam Teşekküllü Dava Dosyası (Interactive Case Docket) Payload'ı Üretir
   */
  static buildCaseDocketPayload(caseData = {}) {
    try {
      const {
        caseId = "DOSYA-001",
        defendantId = "0",
        judgeId = "0",
        prosecutorId = "0",
        claims = "Açıklama belirtilmedi.",
        evidenceList = [],
        votes = { guilty: 0, acquit: 0 },
        status = "ONGOING",
        expiresAt = Date.now() + 24 * 60 * 60 * 1000,
      } = caseData;

      const statusConfig = this.getStatusConfig(status);

      // Metin uzunluğu kısıtlaması (Discord 1024 char limiti)
      const safeClaims = claims.length > 500 ? `${claims.substring(0, 500)}...` : claims;

      // Kanıtları spoiler ile korumalı şekilde diz
      const safeEvList = (evidenceList || []).slice(0, 5);
      const evidenceText = safeEvList.length > 0
        ? safeEvList.map((e, idx) => `${idx + 1}. ||${e}||`).join("\n")
        : "||Henüz gizli kanıt yüklenmedi.||";

      const guiltyVotes = votes?.guilty || 0;
      const acquitVotes = votes?.acquit || 0;

      const components = [
        ...ComponentsV2Factory.headerBlock(`Dava Dosyası: ${caseId} - ${statusConfig.title}`, statusConfig.emoji),
        ComponentsV2Factory.section(
          `👤 **Sanık / Davalı:** <@${defendantId}> (\`${defendantId}\`)\n` +
          `👨‍⚖️ **Hakim / Başkan:** <@${judgeId}>\n` +
          `👔 **Savcı / İddia Makamı:** <@${prosecutorId}>\n` +
          `⏱️ **Son Karar Zamanı:** ${TypographyHelper.timestamp(expiresAt, "R")}`
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(
          `📋 **İddia ve Suçlama Detayı:**\n${TypographyHelper.quote(safeClaims)}\n\n` +
          `🔒 **Gizli Kanıtlar ve İfadeler (Spoiler):**\n${evidenceText}`
        ),
        ComponentsV2Factory.separator(true),
        ComponentsV2Factory.text(
          `📊 **Jüri / Hakem Oylama Durumu:**\n` +
          `⚖️ Suçlu Oy: **${guiltyVotes}**  |  🛡️ Beraat Oy: **${acquitVotes}**`
        ),
        ComponentsV2Factory.separator(false),
        ComponentsV2Factory.text(
          TypographyHelper.subtext(`Sentara Mahkeme & Yargı Sistemi • Dosya kilitlendi • ${TypographyHelper.timestamp(new Date(), "R")}`)
        ),
        ComponentsV2Factory.actionRow([
          {
            custom_id: `court_vote_guilty_${caseId}`,
            label: `⚖️ Suçlu (${guiltyVotes})`,
            style: ButtonStyle.Danger,
          },
          {
            custom_id: `court_vote_acquit_${caseId}`,
            label: `🛡️ Beraat (${acquitVotes})`,
            style: ButtonStyle.Success,
          },
          {
            custom_id: `court_req_evidence_${caseId}`,
            label: "📜 Ek Kanıt Talep Et",
            style: ButtonStyle.Secondary,
          },
        ]),
      ];

      return ComponentsV2Factory.buildPayload(statusConfig.color, components);
    } catch (err) {
      console.error("[CaseDocketV2] Payload üretme hatası:", err);
      return ComponentsV2Factory.buildPayload(0xED4245, [
        ComponentsV2Factory.text("⚠️ **Dava Dosyası Yüklenirken Bir Hata Oluştu.**")
      ]);
    }
  }
}

module.exports = CaseDocketV2;

