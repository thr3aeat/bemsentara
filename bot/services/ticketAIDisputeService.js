'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder
} = require("discord.js");

const Ticket = require("../../models/Ticket");
const { chatWithAI } = require("./aiService");
const { jailUser } = require("./jailService");
const { issueWarning } = require("./punishmentService");

/**
 * 1. Moderatör butonuna basınca kullanıcıya DM üzerinden "Tickete Bak" bildirimi yollar (Components V2)
 */
async function sendUserNotificationDM(interaction, ticketId) {
  try {
    const ticket = await Ticket.findOne({ ticketId });
    const targetUserId = ticket?.userId || interaction.channel?.topic?.match(/(\d{17,19})/)?.[1];
    
    if (!targetUserId) {
      return interaction.reply({
        content: "❌ Kullanıcı ID'si bulunamadı.",
        ephemeral: true
      }).catch(() => {});
    }

    const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
    if (!targetUser) {
      return interaction.reply({
        content: "❌ Kullanıcıya ulaşılamadı veya kullanıcı bulunamadı.",
        ephemeral: true
      }).catch(() => {});
    }

    const guildId = interaction.guildId;
    const channelId = interaction.channelId;
    const ticketUrl = `https://discord.com/channels/${guildId}/${channelId}`;
    const modName = interaction.user.displayName || interaction.user.username;

    // Discord Components V2 Payload Builder
    try {
      const container = new ContainerBuilder()
        .addComponents(
          new TextDisplayBuilder().setContent(`# 🔔 Destek Talebi Bildirimi\n\nMerhaba <@${targetUser.id}>,\n**${modName}** adlı moderatör destek talebinize bakmanızı istiyor!\n\n📌 **Ticket Bağlantısı:**\n[Kanala Gitmek İçin Tıklayın](${ticketUrl})`),
          new SeparatorBuilder(),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`user_dm_close_${ticketId}`)
              .setLabel("🔒 Sorunum Çözüldü - Ticketi Kapat")
              .setStyle(ButtonStyle.Success)
          )
        );

      await targetUser.send({ components: [container] });
    } catch (_) {
      // Fallback Embed if Components V2 is not supported on user's client
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("🔔 Destek Talebi Bildirimi")
        .setDescription(
          `Merhaba <@${targetUser.id}>,\n\n` +
          `**${modName}** adlı moderatör destek talebinize (\`${ticketId}\`) bakmanızı istiyor!\n\n` +
          `👉 **[Destek Kanalına Git](${ticketUrl})**`
        )
        .setFooter({ text: "Eko Yıldız Destek Sistemi" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`user_dm_close_${ticketId}`)
          .setLabel("🔒 Sorunum Çözüldü - Ticketi Kapat")
          .setStyle(ButtonStyle.Success)
      );

      await targetUser.send({ embeds: [embed], components: [row] });
    }

    return interaction.reply({
      content: `✅ **<@${targetUser.id}>** kullanıcısına DM ile kanala bakma bildirimi gönderildi.`,
      ephemeral: true
    }).catch(() => {});
  } catch (err) {
    console.error("[ticketAIDisputeService] sendUserNotificationDM error:", err.message);
    return interaction.reply({
      content: `❌ Bildirim gönderilemedi: ${err.message}`,
      ephemeral: true
    }).catch(() => {});
  }
}

/**
 * 2. "Tickette Kavga Var!" butonuna basılınca AI ile tüm sohbeti analiz eder
 */
async function analyzeTicketDisputeWithAI(interaction, ticketId) {
  try {
    await interaction.deferReply().catch(() => {});

    // Sohbet geçmişinden son 60 mesajı çek
    const fetchedMsgs = await interaction.channel.messages.fetch({ limit: 60 }).catch(() => null);
    if (!fetchedMsgs || fetchedMsgs.size === 0) {
      return interaction.editReply({ content: "❌ Analiz edilecek mesaj bulunamadı." });
    }

    const messagesArray = Array.from(fetchedMsgs.values())
      .reverse()
      .filter(m => !m.author.bot)
      .map(m => `[${m.author.username} | ID:${m.author.id}]: ${m.content}`);

    if (messagesArray.length === 0) {
      return interaction.editReply({ content: "ℹ️ Kanalda analiz edilecek kullanıcı mesajı bulunmuyor." });
    }

    const chatContext = messagesArray.join("\n");

    const DISPUTE_PROMPT = `Sen Eko Yıldız sunucusunun yapay zeka adalet ve moderasyon analizcisisin.
Aşağıda bir Discord destek biletinde (ticket) geçen kullanıcı mesajları yer almaktadır:

--- SOHBET GEÇMİŞİ ---
${chatContext}
--- SOHBET SONU ---

Görevin bu mesajlarda kavga, küfür, hakaret, saygısızlık, kışkırtma veya kural ihlali olup olmadığını analiz etmektir.

YALNIZCA AŞAĞIDAKİ JSON FORMATINDA YANIT VER (Başka hiçbir açıklama yazma):
{
  "hasViolation": true veya false,
  "offenderId": "kuralı ihlal eden kullanıcının Discord ID'si",
  "offenderName": "kullanıcının kullanıcı adı",
  "violatedRule": "Çiğnenen kural adı (Örn: Küfür ve Hakaret / Saygısızlık / Kışkırtma ve Tartışma Çıkarma)",
  "recommendedJailMinutes": 30,
  "summary": "Kısa ihlal gerekçesi"
}`;

    const aiResponseText = await chatWithAI([{ role: "user", content: chatContext }], DISPUTE_PROMPT, "ticket", { max_tokens: 500, temperature: 0.2 });

    let analysisResult = null;
    try {
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      }
    } catch (_) {}

    if (!analysisResult || !analysisResult.hasViolation || !analysisResult.offenderId) {
      return interaction.editReply({
        content: "✅ **AI Analiz Sonucu:** Destek talebindeki sohbet geçmişinde herhangi bir kavga, küfür veya kural ihlali tespit edilmedi."
      });
    }

    const { offenderId, offenderName, violatedRule, recommendedJailMinutes, summary } = analysisResult;
    const jailDuration = recommendedJailMinutes || 30;

    // Kullanıcıya uyarı gönder (DM & Kanal içi)
    const targetUser = await interaction.client.users.fetch(offenderId).catch(() => null);
    if (targetUser) {
      await issueWarning(interaction, targetUser, `Tickette Tartışma/Kural İhlali: ${violatedRule}`, interaction.user).catch(() => {});

      const userWarnEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("⚠️ KURAL İHLALİ VE DİSİPLİN UYARISI")
        .setDescription(
          `Sayın <@${offenderId}>,\n\n` +
          `Destek talebinde **"${violatedRule}"** kuralını çiğnediğiniz ve tartışma çıkardığınız tespit edilmiştir.\n\n` +
          `**İhlal Gerekçesi:** ${summary || 'Topluluk kurallarına aykırı davranış'}\n\n` +
          `⚠️ **Uyarı:** Lütfen üslubunuza dikkat ediniz! Davranışınızı tekrarlamanız durumunda hesabınıza **${jailDuration} dakika hapis cezası** uygulanacaktır.`
        )
        .setFooter({ text: "Eko Yıldız Güvenlik & Moderasyon Sistemi" })
        .setTimestamp();

      await targetUser.send({ embeds: [userWarnEmbed] }).catch(() => {});
    }

    // Moderatör Paneline Rapor ve Hapis Butonu Gönder
    const reportEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🚨 AI KAVGA VE İHLAL ANALİZ RAPORU")
      .setDescription(
        `🤖 **Yapay Zeka Analizini Tamamladı!**\n\n` +
        `👤 **İhlal Eden Kullanıcı:** <@${offenderId}> (\`${offenderId}\` - ${offenderName || 'Bilinmiyor'})\n` +
        `⚠️ **Çiğnenen Kural:** **${violatedRule}**\n` +
        `📝 **AI Analiz Gerekçesi:** ${summary}\n` +
        `⏱️ **Önerilen Hapis Cezası:** **${jailDuration} Dakika**\n\n` +
        `✅ Kullanıcıya **"${violatedRule}"** ihlali sebebiyle resmi uyarı gönderildi.\n` +
        `📢 *Kullanıcı aynı davranışı tekrarlarsa veya cezayı derhal uygulamak isterseniz aşağıdaki butona tıklayabilirsiniz:*`
      )
      .setFooter({ text: "Eko Yıldız Moderasyon Paneli" })
      .setTimestamp();

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_apply_ai_jail_${ticketId}_${offenderId}_${jailDuration}`)
        .setLabel(`⛓️ ${jailDuration} Dk Hapis Cezası Ver`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒")
    );

    return interaction.editReply({
      embeds: [reportEmbed],
      components: [actionRow]
    });
  } catch (err) {
    console.error("[ticketAIDisputeService] analyzeTicketDisputeWithAI error:", err.message);
    return interaction.editReply({
      content: `❌ Analiz sırasında bir hata oluştu: ${err.message}`
    });
  }
}

/**
 * 3. Moderatör "Hapis Cezası Ver" butonuna basınca belirlenen süreyle hapse atar
 */
async function applyAIJailPenalty(interaction, ticketId, offenderId, durationMinutes) {
  try {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    const duration = parseInt(durationMinutes, 10) || 30;

    const guild = interaction.guild;
    if (!guild) {
      return interaction.editReply({ content: "❌ Sunucu bulunamadı." });
    }

    const result = await jailUser(interaction.client, guild, offenderId, `Tickette Kavga/İhlal (AI Moderasyon)`, duration, interaction.user.id);
    if (result === false) {
      return interaction.editReply({ content: "❌ Kullanıcı hapse atılamadı. Kullanıcı sunucuda olmayabilir veya yetkiler yetersiz." });
    }

    const offenderUser = await interaction.client.users.fetch(offenderId).catch(() => null);

    // DM ile kullanıcıya bildir
    if (offenderUser) {
      const jailDmEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("🔒 HAPİS CEZASI UYGULANDI")
        .setDescription(
          `Destek talebinde kuralları ihlal etmeye devam ettiğiniz için **${interaction.user.username}** tarafından **${duration} dakika** süreliğine **Hapishaneye** gönderildiniz.`
        )
        .setFooter({ text: "Eko Yıldız Adalet Sistemi" })
        .setTimestamp();
      await offenderUser.send({ embeds: [jailDmEmbed] }).catch(() => {});
    }

    // Kanala duyuru at
    const chanAnnounceEmbed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("🔒 HAPİS İNFAZI GERÇEKLEŞTİRİLDİ")
      .setDescription(
        `👮 **Yetkili:** <@${interaction.user.id}>\n` +
        `👤 **Cezalandırılan:** <@${offenderId}>\n` +
        `⏱️ **Süre:** **${duration} Dakika**\n` +
        `📝 **Gerekçe:** Tickette Kural İhlali / Tartışma Çıkarma`
      )
      .setTimestamp();

    await interaction.channel.send({ embeds: [chanAnnounceEmbed] }).catch(() => {});

    return interaction.editReply({ content: `✅ **İşlem Başarılı!** <@${offenderId}> kullanıcısına **${duration} dakika** hapis cezası uygulandı.` });
  } catch (err) {
    console.error("[ticketAIDisputeService] applyAIJailPenalty error:", err.message);
    return interaction.editReply({ content: `❌ Hapis cezası verilirken hata oluştu: ${err.message}` });
  }
}

module.exports = {
  sendUserNotificationDM,
  analyzeTicketDisputeWithAI,
  applyAIJailPenalty
};
