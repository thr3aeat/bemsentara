const UserTrustScore = require("../../../models/UserTrustScore");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * Gelişmiş Alt Account / Raid Savunma Kalkanı & Trust Score Servisi
 */
class AltRaidGuardService {
  /**
   * Sunucuya katılan yeni üyeyi analiz eder ve güven skorunu günceller
   */
  static async analyzeNewMember(member) {
    const discordAgeDays = Math.floor((Date.now() - member.user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const hasAvatar = !!member.user.avatar;

    let score = 50.0; // Baz puan

    const { ENABLE_NEW_ACCOUNT_SECURITY } = require("../../../config");
    const isNewAccountEnabled = ENABLE_NEW_ACCOUNT_SECURITY || process.env.ENABLE_NEW_ACCOUNT_SECURITY === "true";

    // Hesap Yaşı Puanı
    if (discordAgeDays >= 365) score += 30;
    else if (discordAgeDays >= 30) score += 20;
    else if (discordAgeDays >= 7) score += 10;
    else if (discordAgeDays < 2 && isNewAccountEnabled) score -= 30; // Çok yeni hesap!

    // Avatar Puanı
    if (hasAvatar) score += 10;
    else score -= 15;

    // Minimum & Maksimum Skor
    score = Math.max(0, Math.min(100, score));

    // TrustScore Model Güncelleme
    let trustDoc = await UserTrustScore.findOne({ userId: member.id });
    if (!trustDoc) {
      trustDoc = await UserTrustScore.create({
        userId: member.id,
        trustScore: score,
        bonusAccountAge: discordAgeDays
      });
    } else {
      trustDoc.trustScore = score;
      trustDoc.bonusAccountAge = discordAgeDays;
      await trustDoc.save();
    }

    // Risk Karantinası Kararı (Skor < 30 ise)
    if (score < 30 && isNewAccountEnabled) {
      await this.quarantineMember(member, score, discordAgeDays);
    }

    return { score, discordAgeDays };
  }

  /**
   * Şüpheli hesabı Karantinaya alma
   */
  static async quarantineMember(member, score, discordAgeDays) {
    const quarantineRoleId = process.env.QUARANTINE_ROLE_ID;
    if (quarantineRoleId && member.guild.roles.cache.has(quarantineRoleId)) {
      try {
        await member.roles.add(quarantineRoleId);
      } catch (e) {}
    }

    // Güvenlik Log Kanalı Bildirimi
    const logChannelId = process.env.SECURITY_LOG_CHANNEL_ID;
    if (logChannelId && member.guild.channels.cache.has(logChannelId)) {
      const channel = member.guild.channels.cache.get(logChannelId);

      const embed = new EmbedBuilder()
        .setTitle("🚨 Şüpheli Hesap / Karantina Bildirimi")
        .setDescription(`Sunucuya katılan **${member.user.tag}** şüpheli olarak karantinaya alındı.`)
        .addFields(
          { name: "👤 Kullanıcı", value: `<@${member.id}> (${member.id})`, inline: true },
          { name: "🛡️ Güven Skoru", value: `%${score.toFixed(1)}`, inline: true },
          { name: "📅 Discord Hesap Yaşı", value: `${discordAgeDays} Gün`, inline: true }
        )
        .setColor(0xE74C3C)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`btn_security_release_${member.id}`)
          .setLabel("🔓 Karantinayı Kaldır")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`btn_security_ban_${member.id}`)
          .setLabel("🔨 Yasakla (Ban)")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [embed], components: [row] });
    }
  }

  /**
   * Güvenlik Buton İşlemleri (Karantina Kaldır / Ban)
   */
  static async handleSecurityButton(interaction, action, targetUserId) {
    const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);

    if (action === "release") {
      const quarantineRoleId = process.env.QUARANTINE_ROLE_ID;
      if (member && quarantineRoleId && member.roles.cache.has(quarantineRoleId)) {
        await member.roles.remove(quarantineRoleId);
      }
      const embed = new EmbedBuilder()
        .setTitle("🔓 Karantina Kaldırıldı")
        .setDescription(`<@${targetUserId}> kullanıcısının karantinası **${interaction.user.tag}** tarafından kaldırıldı.`)
        .setColor(0x2ECC71);

      await interaction.update({ embeds: [embed], components: [] });
    } else if (action === "ban") {
      if (member) {
        await member.ban({ reason: `Güvenlik paneli üzerinden ${interaction.user.tag} tarafından onaylandı.` });
      }
      const embed = new EmbedBuilder()
        .setTitle("🔨 Kullanıcı Yasaklandı")
        .setDescription(`<@${targetUserId}> kullanıcısı sunucudan yasaklandı.`)
        .setColor(0x95A5A6);

      await interaction.update({ embeds: [embed], components: [] });
    }
  }
}

module.AltRaidGuardService = AltRaidGuardService;
module.exports = AltRaidGuardService;
