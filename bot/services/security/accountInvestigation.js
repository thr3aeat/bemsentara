/**
 * accountInvestigation.js
 * 
 * Moderatör ve kullanıcı arasında DM üzerinden soruşturma yürütür
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const { getAccountAgeInHours, getRiskLevel, getRiskColor } = require("./newAccountDetector");

/**
 * Moderatöre yeni hesap bildirimi gönderir
 * @param {Client} client 
 * @param {GuildMember} member 
 * @param {Object} investigation - DB'den gelen investigation kaydı
 * @param {number} riskScore 
 */
async function notifyModeratorAboutNewAccount(client, member, investigation, riskScore) {
  try {
    const moderator = await client.users.fetch(investigation.assignedModeratorId).catch(() => null);
    if (!moderator) {
      console.error("[AccountInvestigation] Moderatör bulunamadı!");
      return;
    }
    
    const accountAge = getAccountAgeInHours(member.user);
    const surveyAnswers = investigation.surveyAnswers || {};
    
    const embed = new EmbedBuilder()
      .setColor(getRiskColor(riskScore))
      .setTitle("🚨 Yeni Riskli Kullanıcı")
      .setDescription(
        `Yeni bir hesap sunucuya katıldı ve güvenlik doğrulaması tamamlandı.\n` +
        `Lütfen inceleme yap ve karar ver.`
      )
      .addFields(
        { name: "👤 Kullanıcı", value: `${member.user.tag} (${member.user.id})`, inline: true },
        { name: "⏰ Hesap Yaşı", value: `${accountAge} saat`, inline: true },
        { name: "📊 Risk Seviyesi", value: `${getRiskLevel(riskScore)} (${riskScore}/100)`, inline: true },
        { name: "📝 Anket Cevapları", value: "━━━━━━━━━━━━━━━━", inline: false },
        { name: "Kullanıcı Adı", value: surveyAnswers.username || "Belirtilmedi", inline: true },
        { name: "Nasıl Buldu?", value: surveyAnswers.howFound || "Belirtilmedi", inline: true },
        { name: "Katılma Amacı", value: surveyAnswers.joinPurpose || "Belirtilmedi", inline: false },
        { name: "Daha Önce Burada?", value: surveyAnswers.wasHereBefore ? "✅ Evet" : "❌ Hayır", inline: true },
        { name: "Alt Hesap?", value: surveyAnswers.hasAltAccounts ? "✅ Evet" : "❌ Hayır", inline: true },
        { name: "Kuralları Kabul?", value: surveyAnswers.rulesAccepted ? "✅ Evet" : "❌ Hayır", inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Investigation ID: ${investigation._id}` })
      .setTimestamp();
    
    if (surveyAnswers.additionalInfo && surveyAnswers.additionalInfo !== "Yok") {
      embed.addFields({ name: "💬 Ek Bilgi", value: surveyAnswers.additionalInfo, inline: false });
    }
    
    if (surveyAnswers.whyNewAccount && surveyAnswers.whyNewAccount !== "Yok") {
      embed.addFields({ name: "❓ Neden Yeni Hesap?", value: surveyAnswers.whyNewAccount, inline: false });
    }
    
    if (surveyAnswers.hasMicrophone) {
      embed.addFields({ name: "🎤 Mikrofon", value: surveyAnswers.hasMicrophone === "yes" ? "✅ Var" : "❌ Yok", inline: true });
    }
    
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`investigate_start_${investigation._id}`)
        .setLabel("🔍 Soruşturmayı Başlat")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`investigate_clean_${investigation._id}`)
        .setLabel("✅ Temiz")
        .setStyle(ButtonStyle.Success)
    );
    
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`investigate_tempjail_${investigation._id}`)
        .setLabel("🔒 Geçici Hapis")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`investigate_permajail_${investigation._id}`)
        .setLabel("⛓️ Süresiz Hapis")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`investigate_ban_${investigation._id}`)
        .setLabel("🚫 Ban")
        .setStyle(ButtonStyle.Danger)
    );
    
    await moderator.send({ embeds: [embed], components: [row1, row2] });
    console.log(`[AccountInvestigation] Moderatöre bildirim gönderildi: ${moderator.tag}`);
  } catch (err) {
    console.error("[AccountInvestigation] Moderatör bildirimi gönderilemedi:", err.message);
  }
}

/**
 * Soruşturma sohbetini başlatır
 * @param {Client} client 
 * @param {string} investigationId 
 */
async function startInvestigationChat(client, investigationId) {
  try {
    const AccountInvestigation = require("../../../models/AccountInvestigation");
    const investigation = await AccountInvestigation.findById(investigationId);
    
    if (!investigation) {
      console.error("[AccountInvestigation] Investigation bulunamadı!");
      return;
    }
    
    investigation.status = 'investigating';
    investigation.investigationStartedAt = new Date();
    await investigation.save();
    
    const moderator = await client.users.fetch(investigation.assignedModeratorId).catch(() => null);
    const user = await client.users.fetch(investigation.userId).catch(() => null);
    
    if (!moderator || !user) {
      console.error("[AccountInvestigation] Moderatör veya kullanıcı bulunamadı!");
      return;
    }
    
    // Moderatöre talimat
    const modEmbed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle("✅ Soruşturma Başladı")
      .setDescription(
        `${user.tag} ile DM üzerinden konuşma başladı.\n\n` +
        `**Nasıl Kullanılır:**\n` +
        `• Bu sohbete yazdığın her mesaj otomatik olarak kullanıcıya iletilecek.\n` +
        `• Kullanıcının cevapları sana otomatik olarak gelecek.\n` +
        `• Soruşturmayı bitirmek için yukarıdaki butonları kullan.\n\n` +
        `**Önemli:** Soruşturma devam ederken diğer moderatörler bu vakayı göremez.`
      )
      .setFooter({ text: `Investigation ID: ${investigationId}` });
    
    await moderator.send({ embeds: [modEmbed] });
    
    // Kullanıcıya bildirim
    const userEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle("📞 Yetkili İle İletişim")
      .setDescription(
        `Bir yetkili seninle konuşmak istiyor.\n\n` +
        `Bu DM üzerinden sorulara cevap verebilirsin. Dürüst ve net ol.`
      );
    
    await user.send({ embeds: [userEmbed] });
    
    console.log(`[AccountInvestigation] Soruşturma sohbeti başladı: ${investigationId}`);
  } catch (err) {
    console.error("[AccountInvestigation] Soruşturma sohbeti başlatılamadı:", err.message);
  }
}

/**
 * Soruşturma mesajını karşı tarafa iletir
 * @param {Client} client 
 * @param {Message} message 
 * @param {string} from - 'moderator' veya 'user'
 */
async function relayInvestigationMessage(client, message, from) {
  try {
    const AccountInvestigation = require("../../../models/AccountInvestigation");
    
    // Bu kullanıcının aktif bir soruşturması var mı?
    const query = from === 'moderator' 
      ? { assignedModeratorId: message.author.id, status: 'investigating' }
      : { userId: message.author.id, status: 'investigating' };
    
    const investigation = await AccountInvestigation.findOne(query);
    
    if (!investigation) {
      // Aktif soruşturma yok - mesajı relay etme
      return false;
    }
    
    // Mesajı kaydet
    investigation.investigationMessages.push({
      from: from,
      message: message.content,
      timestamp: new Date()
    });
    
    if (from === 'moderator') {
      investigation.questionCount = (investigation.questionCount || 0) + 1;
    }
    
    await investigation.save();
    
    // Karşı tarafa ilet
    const targetId = from === 'moderator' ? investigation.userId : investigation.assignedModeratorId;
    const target = await client.users.fetch(targetId).catch(() => null);
    
    if (!target) {
      console.error("[AccountInvestigation] Hedef kullanıcı bulunamadı!");
      return false;
    }
    
    const prefix = from === 'moderator' ? "**👮 Yetkili:**" : "**👤 Kullanıcı:**";
    await target.send(`${prefix} ${message.content}`);
    
    return true;
  } catch (err) {
    console.error("[AccountInvestigation] Mesaj iletimi başarısız:", err.message);
    return false;
  }
}

/**
 * Soruşturmayı tamamlar ve kararı uygular
 * @param {Client} client 
 * @param {string} investigationId 
 * @param {string} decision - 'clean', 'temp_jail', 'perma_jail', 'banned'
 * @param {string} moderatorId 
 * @param {Object} options - { reason, duration }
 */
async function completeInvestigation(client, investigationId, decision, moderatorId, options = {}) {
  try {
    const AccountInvestigation = require("../../../models/AccountInvestigation");
    const investigation = await AccountInvestigation.findById(investigationId);
    
    if (!investigation) {
      console.error("[AccountInvestigation] Investigation bulunamadı!");
      return;
    }
    
    investigation.decision = decision;
    investigation.decisionReason = options.reason || "Belirtilmedi";
    investigation.decidedBy = moderatorId;
    investigation.decidedAt = new Date();
    investigation.status = 'completed';
    investigation.completedAt = new Date();
    
    if (decision === 'temp_jail' && options.duration) {
      investigation.tempJailDuration = options.duration;
      investigation.tempJailEndsAt = new Date(Date.now() + options.duration * 60 * 1000);
    }
    
    await investigation.save();
    
    // Kararı uygula
    const guild = client.guilds.cache.get(investigation.guildId);
    if (!guild) {
      console.error("[AccountInvestigation] Guild bulunamadı!");
      return;
    }
    
    const member = await guild.members.fetch(investigation.userId).catch(() => null);
    if (!member) {
      console.error("[AccountInvestigation] Member bulunamadı!");
      return;
    }
    
    await applyDecision(client, member, decision, options);
    
    // Moderatöre bildir
    const moderator = await client.users.fetch(moderatorId).catch(() => null);
    if (moderator) {
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("✅ Soruşturma Tamamlandı")
        .setDescription(
          `**Kullanıcı:** ${member.user.tag}\n` +
          `**Karar:** ${getDecisionText(decision)}\n` +
          `**Sebep:** ${options.reason || "Belirtilmedi"}\n` +
          `**Soru Sayısı:** ${investigation.questionCount || 0}\n` +
          `**Süre:** ${Math.floor((investigation.completedAt - investigation.investigationStartedAt) / 60000)} dakika`
        )
        .setTimestamp();
      
      await moderator.send({ embeds: [embed] });
    }
    
    // Kullanıcıya bildir
    await notifyUserAboutDecision(client, member.user, investigation.guildId, decision, options);
    
    // Log kanalına kaydet
    await logInvestigationResult(client, investigation, member, decision, options);
    
    console.log(`[AccountInvestigation] Soruşturma tamamlandı: ${investigationId} - Karar: ${decision}`);
  } catch (err) {
    console.error("[AccountInvestigation] Soruşturma tamamlanamadı:", err.message);
  }
}

/**
 * Kararı uygular (rol verme, jail, ban vb.)
 */
async function applyDecision(client, member, decision, options) {
  try {
    const guild = member.guild;
    
    switch (decision) {
      case 'clean':
        // Doğrulanmış rolü ver, karantinayı kaldır
        const verifiedRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('doğrulan') || r.name.toLowerCase() === 'verified');
        if (verifiedRole) {
          await member.roles.add(verifiedRole);
        }
        
        const quarantineRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('karantin') || r.name.toLowerCase().includes('quarantine'));
        if (quarantineRole && member.roles.cache.has(quarantineRole.id)) {
          await member.roles.remove(quarantineRole);
        }
        break;
        
      case 'temp_jail':
      case 'perma_jail':
        // Jail rolü ver
        const jailRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'hapis' || r.name.toLowerCase() === 'jail');
        if (jailRole) {
          await member.roles.add(jailRole);
        }
        
        // Timeout uygula (temp jail için)
        if (decision === 'temp_jail' && options.duration) {
          const durationMs = options.duration * 60 * 1000;
          await member.timeout(durationMs, options.reason || "Güvenlik soruşturması");
        }
        break;
        
      case 'banned':
        await member.ban({ reason: options.reason || "Güvenlik soruşturması sonucu" });
        break;
    }
  } catch (err) {
    console.error("[AccountInvestigation] Karar uygulanamadı:", err.message);
  }
}

/**
 * Kullanıcıya karar bilgisini gönderir
 */
async function notifyUserAboutDecision(client, user, guildId, decision, options) {
  try {
    const guild = client.guilds.cache.get(guildId);
    const embed = new EmbedBuilder()
      .setTitle("📋 Soruşturma Sonucu")
      .setDescription(`**${guild?.name || "Sunucu"}** güvenlik soruşturması tamamlandı.`)
      .setTimestamp();
    
    switch (decision) {
      case 'clean':
        embed.setColor(0x00FF00);
        embed.addFields(
          { name: "✅ Sonuç", value: "Hesabın temiz bulundu. Sunucuya hoş geldin!" },
          { name: "📌 Not", value: "Artık tüm kanallara erişim sağlayabilirsin." }
        );
        break;
        
      case 'temp_jail':
        embed.setColor(0xFFA500);
        embed.addFields(
          { name: "🔒 Sonuç", value: `Geçici olarak hapise alındın. Süre: ${options.duration} dakika` },
          { name: "📌 Sebep", value: options.reason || "Belirtilmedi" },
          { name: "⏰ Bitiş", value: `<t:${Math.floor((Date.now() + options.duration * 60 * 1000) / 1000)}:R>` }
        );
        break;
        
      case 'perma_jail':
        embed.setColor(0xFF0000);
        embed.addFields(
          { name: "⛓️ Sonuç", value: "Süresiz hapise alındın." },
          { name: "📌 Sebep", value: options.reason || "Belirtilmedi" },
          { name: "📝 İtiraz", value: "İtiraz etmek için yetkililere ulaşabilirsin." }
        );
        break;
        
      case 'banned':
        embed.setColor(0xFF0000);
        embed.addFields(
          { name: "🚫 Sonuç", value: "Sunucudan yasaklandın." },
          { name: "📌 Sebep", value: options.reason || "Belirtilmedi" }
        );
        break;
    }
    
    await user.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    console.error("[AccountInvestigation] Kullanıcıya bildirim gönderilemedi:", err.message);
  }
}

/**
 * Soruşturma sonucunu log kanalına kaydeder
 */
async function logInvestigationResult(client, investigation, member, decision, options) {
  try {
    const { LOG_CHANNEL_ID } = require("../../../config");
    if (!LOG_CHANNEL_ID) return;
    
    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!logChannel) return;
    
    const embed = new EmbedBuilder()
      .setColor(getRiskColor(investigation.riskScore || 0))
      .setTitle("📊 Güvenlik Soruşturması Tamamlandı")
      .addFields(
        { name: "👤 Kullanıcı", value: `${member.user.tag} (${member.id})`, inline: true },
        { name: "⏰ Hesap Yaşı", value: `${investigation.accountAge || 'Bilinmiyor'} saat`, inline: true },
        { name: "📊 Risk Skoru", value: `${investigation.riskScore || 0}/100`, inline: true },
        { name: "👮 Moderatör", value: `<@${investigation.decidedBy}>`, inline: true },
        { name: "⏱️ Soruşturma Süresi", value: `${Math.floor((investigation.completedAt - investigation.investigationStartedAt) / 60000)} dakika`, inline: true },
        { name: "❓ Soru Sayısı", value: `${investigation.questionCount || 0}`, inline: true },
        { name: "⚖️ Karar", value: getDecisionText(decision), inline: false },
        { name: "📌 Sebep", value: options.reason || "Belirtilmedi", inline: false }
      )
      .setFooter({ text: `Investigation ID: ${investigation._id}` })
      .setTimestamp();
    
    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error("[AccountInvestigation] Log kaydı oluşturulamadı:", err.message);
  }
}

function getDecisionText(decision) {
  switch (decision) {
    case 'clean': return '✅ Temiz';
    case 'temp_jail': return '🔒 Geçici Hapis';
    case 'perma_jail': return '⛓️ Süresiz Hapis';
    case 'banned': return '🚫 Ban';
    default: return 'Bilinmiyor';
  }
}

module.exports = {
  notifyModeratorAboutNewAccount,
  startInvestigationChat,
  relayInvestigationMessage,
  completeInvestigation,
};
