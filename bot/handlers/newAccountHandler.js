/**
 * newAccountHandler.js
 * 
 * Yeni hesap güvenlik sistemi - ana handler
 * guildMemberAdd event'ini dinler ve süreci başlatır
 */

const { isNewAccount, getAccountAgeInHours, calculateRiskScore } = require("../services/security/newAccountDetector");
const { sendSurveyDM } = require("../services/security/newAccountSurvey");
const { selectBestModerator, isModeratorAvailable } = require("../services/security/moderatorSelector");
const { notifyModeratorAboutNewAccount } = require("../services/security/accountInvestigation");
const AccountInvestigation = require("../../models/AccountInvestigation");
const { ENABLE_NEW_ACCOUNT_SECURITY } = require("../../config");

/**
 * Yeni üye katıldığında kontrol eder
 * @param {Client} client 
 */
function initializeNewAccountHandler(client) {
  client.on("guildMemberAdd", async (member) => {
    try {
      // Bot ise veya Yeni Hesap Güvenlik Kalkanı kapalıysa atla
      if (member.user.bot) return;
      if (!ENABLE_NEW_ACCOUNT_SECURITY && process.env.ENABLE_NEW_ACCOUNT_SECURITY !== "true") {
        return;
      }
      
      // 24 saat içinde oluşturulmuş mu?
      if (!isNewAccount(member)) {
        console.log(`[NewAccountHandler] ${member.user.tag} eski hesap, güvenlik kontrolü atlandı.`);
        return;
      }
      
      console.log(`[NewAccountHandler] Yeni hesap tespit edildi: ${member.user.tag}`);
      
      // Risk puanı hesapla
      const riskScore = await calculateRiskScore(member);
      const accountAge = getAccountAgeInHours(member.user);
      
      console.log(`[NewAccountHandler] Risk skoru: ${riskScore}/100 | Hesap yaşı: ${accountAge} saat`);
      
      // Karantina rolü ver (varsa)
      try {
        const quarantineRole = member.guild.roles.cache.find(r => 
          r.name.toLowerCase().includes('karantin') || 
          r.name.toLowerCase().includes('quarantine') ||
          r.name.toLowerCase().includes('yeni')
        );
        
        if (quarantineRole) {
          await member.roles.add(quarantineRole);
          console.log(`[NewAccountHandler] Karantina rolü verildi: ${member.user.tag}`);
        }
      } catch (err) {
        console.warn(`[NewAccountHandler] Karantina rolü verilemedi:`, err.message);
      }
      
      // DB'ye kaydet
      const investigation = new AccountInvestigation({
        userId: member.id,
        guildId: member.guild.id,
        accountAge: accountAge,
        riskScore: riskScore,
        status: 'survey_sent',
        createdAt: new Date(),
      });
      
      await investigation.save();
      console.log(`[NewAccountHandler] Investigation kaydı oluşturuldu: ${investigation._id}`);
      
      // Anket DM'i gönder
      const surveyResult = await sendSurveyDM(member.user, member.guild);
      
      if (!surveyResult) {
        console.error(`[NewAccountHandler] Anket DM'i gönderilemedi, doğrulama kanalına bildirim gönderilip direkt moderatör bildirimi yapılacak.`);
        
        // DM gönderilemezse direkt moderatöre bildir
        const moderator = await selectBestModerator(member.guild);
        if (moderator) {
          investigation.assignedModeratorId = moderator.id;
          investigation.assignedAt = new Date();
          investigation.status = 'assigned';
          await investigation.save();
          
          await notifyModeratorAboutNewAccount(client, member, investigation, riskScore);
        }

        // Doğrulama kanalına bildirim gönder
        try {
          const { VERIFY_CHANNEL_ID } = require("../../config");
          const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
          
          if (VERIFY_CHANNEL_ID) {
            const verifyChannel = member.guild.channels.cache.get(VERIFY_CHANNEL_ID) || 
                                  await member.guild.channels.fetch(VERIFY_CHANNEL_ID).catch(() => null);
            
            if (verifyChannel) {
              const dmFailedEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle("⚠️ Güvenlik Doğrulaması Başlatılamadı")
                .setDescription(
                  `Merhaba <@${member.id}>!\n\n` +
                  `Hesabınız son 24 saat içinde oluşturulduğu için güvenlik protokolü gereği doğrulama anketi doldurmanız gerekmektedir.\n\n` +
                  `**Direkt Mesaj (DM) alımınız kapalı olduğu için size anket gönderemedik.**\n\n` +
                  `**Süreci başlatmak için:**\n` +
                  `1️⃣ Sunucu ayarlarınızdan **"Gizlilik ve Güvenlik"** kısmına gidin.\n` +
                  `2️⃣ **"Sunucu üyelerinden gelen direkt mesajlara izin ver"** seçeneğini aktif edin.\n` +
                  `3️⃣ Aşağıdaki **"Anketi Başlat"** butonuna basarak süreci başlatın.`
                )
                .setFooter({ text: `${member.guild.name} • Güvenlik Sistemi` })
                .setTimestamp();

              const dmFailedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`survey_start_${member.guild.id}`)
                  .setLabel("📝 Anketi Başlat")
                  .setStyle(ButtonStyle.Primary)
              );

              const noticeMsg = await verifyChannel.send({
                content: `<@${member.id}>`,
                embeds: [dmFailedEmbed],
                components: [dmFailedRow]
              });

              // 5 dakika sonra mesajı otomatik silelim
              setTimeout(() => {
                noticeMsg.delete().catch(() => {});
              }, 5 * 60 * 1000);
            }
          }
        } catch (errNotice) {
          console.error(`[NewAccountHandler] Doğrulama kanalına bildirim gönderilemedi:`, errNotice.message);
        }
      }
      
    } catch (err) {
      console.error("[NewAccountHandler] Hata:", err.message);
      console.error(err.stack);
    }
  });
  
  console.log("[NewAccountHandler] ✅ Yeni hesap güvenlik sistemi aktif");
}

module.exports = { initializeNewAccountHandler };
