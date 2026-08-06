/**
 * aiExamV2.js
 * 
 * AI Exam & Ticket AI "Adaptif Öğrenme & Akıllı Asistan" V2
 */

const { ButtonStyle } = require("discord.js");
const ComponentsV2Factory = require("../utils/componentsV2Factory");
const TypographyHelper = require("../utils/typographyHelper");
const QuickChartHelper = require("../utils/quickChartHelper");

class AIExamV2 {
  /**
   * Yetkili Okulu Sınav Sonuç Kartı Payload'ı Üretir
   */
  static buildExamResultPayload(examData) {
    const {
      candidateUserId,
      candidateUsername,
      score = 85,
      passed = true,
      totalQuestions = 20,
      correctCount = 17,
      wrongCount = 3,
      aiFeedback = "Aday genel olarak sunucu kurallarına son derece hakim. Ancak ban süresi hesaplama konusunda birkaç küçük pürüz var.",
    } = examData;

    const accentColor = passed ? 0x00FF88 : 0xFF4757;
    const resultEmoji = passed ? "🎓" : "⚠️";

    // Doughnut chart for correct vs wrong breakdown
    const chartUrl = QuickChartHelper.getChartUrl({
      labels: ["Doğru Cevap", "Yanlış Cevap"],
      data: [correctCount, wrongCount],
      datasetLabel: "Sınav Sonucu",
      chartType: "doughnut",
      color: passed ? "#00FF88" : "#FF4757",
      width: 400,
      height: 180,
    });

    const components = [
      ...ComponentsV2Factory.headerBlock(
        `Yetkili Okulu Sınav Sonucu: ${candidateUsername} (${score}/100)`,
        resultEmoji
      ),
      ComponentsV2Factory.section(
        `👤 **Aday:** <@${candidateUserId}> (\`${candidateUserId}\`)\n` +
        `📊 **Puan:** **${score} / 100** — Durum: **${passed ? "BAŞARILI (GEÇTİ) ✅" : "BAŞARISIZ (KALDI) ❌"}**\n` +
        `🎯 **Doğru Sayısı:** **${correctCount}**  |  ❌ **Yanlış Sayısı:** **${wrongCount}**`
      ),
      ComponentsV2Factory.separator(true),
      ComponentsV2Factory.text(
        `💡 **AI Eğitmen Değerlendirme & Tavsiye Raporu:**\n` +
        TypographyHelper.quote(aiFeedback)
      ),
      ComponentsV2Factory.separator(true),
      ComponentsV2Factory.text(`📈 **Doğruluk Oranı Dağılımı:**`),
      ComponentsV2Factory.mediaGallery([chartUrl]),
      ComponentsV2Factory.separator(false),
      ComponentsV2Factory.text(
        TypographyHelper.subtext(`Sentara AI Moderator School Engine • Tarih: ${TypographyHelper.timestamp(new Date(), "F")}`)
      ),
      ComponentsV2Factory.actionRow([
        {
          custom_id: `exam_approve_${candidateUserId}`,
          label: "✅ Yetkiyi Onayla & Rol Ver",
          style: ButtonStyle.Success,
          disabled: !passed,
        },
        {
          custom_id: `exam_retry_${candidateUserId}`,
          label: "🔄 Sınavı Tekrar Başlat",
          style: ButtonStyle.Secondary,
        },
      ]),
    ];

    return ComponentsV2Factory.buildPayload(accentColor, components);
  }

  /**
   * AI Ticket Asistanı Akıllı Yanıt Payload'ı Üretir
   */
  static buildSmartTicketAIPayload(ticketData) {
    const {
      ticketId,
      userQuestion,
      aiAnswer,
      confidenceScore = 94,
    } = ticketData;

    const components = [
      ...ComponentsV2Factory.headerBlock(`AI Destek Asistanı • Ticket #${ticketId}`, "🤖"),
      ComponentsV2Factory.section(
        `❓ **Soru:**\n${TypographyHelper.quote(userQuestion)}\n\n` +
        `💡 **AI Çözüm Önerisi (Güven Oranı: %${confidenceScore}):**\n${aiAnswer}`
      ),
      ComponentsV2Factory.separator(true),
      ComponentsV2Factory.text(
        TypographyHelper.subtext(
          `Bu bir yapay zeka tarafından üretilen otomatik çözümdür. Sorununuz çözüldüyse aşağıdaki butonla ticket'ı kapatabilirsiniz.`
        )
      ),
      ComponentsV2Factory.actionRow([
        {
          custom_id: `ai_apply_solution_${ticketId}`,
          label: "🚀 Çözümü Uygula & Kapat",
          style: ButtonStyle.Success,
        },
        {
          custom_id: `ai_explain_more_${ticketId}`,
          label: "💬 Detaylandır / Açıkla",
          style: ButtonStyle.Primary,
        },
        {
          custom_id: `ai_call_staff_${ticketId}`,
          label: "🙋‍♂️ Yetkiliye Aktar",
          style: ButtonStyle.Danger,
        },
      ]),
    ];

    return ComponentsV2Factory.buildPayload(0x5865F2, components);
  }
}

module.exports = AIExamV2;
